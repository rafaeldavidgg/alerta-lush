import type { Logger } from '@core/logging';
import type { TrackedProduct } from '@core/types';
import type { ProductStore } from '@core/storage/types';
import type { FetchResult } from '@core/fetch';
import type { AvailabilityEvaluation } from '@core/evaluate';
import type { RestockNotifier } from '@core/monitor/notifier';
import { applyStateTransition } from '@core/monitor/state-machine';

export interface MonitorDeps {
  store: ProductStore;
  fetchHtml: (url: string) => Promise<FetchResult>;
  evaluate: (url: string, html: string) => Promise<AvailabilityEvaluation>;
  notifier: RestockNotifier;
  logger: Logger;
  now?: () => Date;
}

export interface RunSummary {
  total: number;
  inStock: number;
  outOfStock: number;
  unknown: number;
  notified: number;
  errors: number;
}

/**
 * Evaluate every tracked product once.
 *
 * Historic non-Lush products (registered before the Lush-only change) are
 * kept as-is: they evaluate to `unknown` and never notify. Nothing is
 * migrated or deleted here.
 *
 * Guarantees:
 *  - at most one fetch per product (retries are handled inside `fetchHtml`);
 *  - a failure on one product never prevents the others from running;
 *  - a notification is attempted only on `out_of_stock -> in_stock`;
 *  - the state is persisted whether or not the notification succeeds, so a
 *    failed delivery is never retried on the next run (at-most-once).
 */
export async function runMonitoringPass(deps: MonitorDeps): Promise<RunSummary> {
  const { store, fetchHtml, evaluate, notifier, logger } = deps;
  const now = deps.now ?? (() => new Date());

  const products = await store.list();
  const summary: RunSummary = {
    total: products.length,
    inStock: 0,
    outOfStock: 0,
    unknown: 0,
    notified: 0,
    errors: 0,
  };

  for (const product of products) {
    try {
      const outcome = await evaluateProduct(product, { fetchHtml, evaluate, notifier, logger });
      if (outcome.notified) summary.notified += 1;
      if (outcome.state === 'in_stock') summary.inStock += 1;
      else if (outcome.state === 'out_of_stock') summary.outOfStock += 1;
      else summary.unknown += 1;

      await store.update(product.id, {
        estado_actual: outcome.estado_actual,
        estado_anterior: outcome.estado_anterior,
        ultima_verificacion: now().toISOString(),
      });

      logger.info('product evaluated', {
        id: product.id,
        state: outcome.state,
        strategy: outcome.strategy,
        notified: outcome.notified,
        reason: outcome.reason,
      });
    } catch (error) {
      summary.errors += 1;
      const message = error instanceof Error ? error.message : String(error);
      logger.error('product evaluation failed', { id: product.id, error: message });
    }
  }

  logger.info('monitoring run complete', { ...summary });
  return summary;
}

interface EvaluationOutcome {
  state: AvailabilityEvaluation['state'];
  estado_actual: TrackedProduct['estado_actual'];
  estado_anterior: TrackedProduct['estado_anterior'];
  strategy?: string;
  reason?: string;
  notified: boolean;
}

async function evaluateProduct(
  product: TrackedProduct,
  deps: Pick<MonitorDeps, 'fetchHtml' | 'evaluate' | 'notifier' | 'logger'>,
): Promise<EvaluationOutcome> {
  const { fetchHtml, evaluate, notifier, logger } = deps;

  let evaluation: AvailabilityEvaluation;
  const fetched = await fetchHtml(product.url);
  if (!fetched.ok || fetched.html === undefined) {
    evaluation = { state: 'unknown', reason: fetched.error ?? `HTTP ${fetched.status}` };
  } else {
    evaluation = await evaluate(product.url, fetched.html);
  }

  const transition = applyStateTransition(product.estado_anterior, evaluation.state);

  let notified = false;
  if (transition.shouldNotify) {
    try {
      await notifier.notifyRestock(product);
      notified = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('restock notification failed', { id: product.id, error: message });
    }
  }

  return {
    state: evaluation.state,
    estado_actual: transition.estado_actual,
    estado_anterior: transition.estado_anterior,
    strategy: evaluation.strategy,
    reason: evaluation.reason,
    notified,
  };
}
