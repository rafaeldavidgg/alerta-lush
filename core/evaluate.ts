import type { AvailabilityState } from '@core/types';
import { runStrategies, type DetectorStrategyType } from '@core/detectors';
import { getStoreForUrl } from '@stores/index';

export interface AvailabilityEvaluation {
  state: AvailabilityState;
  /** The store domain whose configuration was used, when one matched. */
  store?: string;
  /** The strategy that determined the state, if any. */
  strategy?: DetectorStrategyType;
  reason?: string;
}

/**
 * Evaluate availability for a product URL against the configured store.
 *
 * An unconfigured store yields `unknown` (and therefore no notification).
 * Strategy errors are surfaced as `unknown` rather than thrown, so one bad
 * store cannot abort a run.
 */
export async function evaluateAvailability(
  url: string,
  html: string,
): Promise<AvailabilityEvaluation> {
  const store = getStoreForUrl(url);
  if (!store) {
    return { state: 'unknown', reason: `no store configuration matches ${url}` };
  }

  try {
    const result = await runStrategies(store.strategies, { url, html });
    return {
      state: result.state,
      store: store.domain,
      strategy: result.strategy,
      reason: result.reason,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { state: 'unknown', store: store.domain, reason: `detector error: ${message}` };
  }
}
