import { describe, expect, it, vi } from 'vitest';
import { createLogger } from '@core/logging';
import { createMemoryStore } from '@core/storage/memory';
import { runMonitoringPass, type MonitorDeps } from '@core/monitor/run';
import type { RestockNotifier } from '@core/monitor/notifier';
import type { FetchResult } from '@core/fetch';
import type { AvailabilityState } from '@core/types';

function silentLogger() {
  return createLogger({ sink: () => undefined });
}

const okFetch = (): Promise<FetchResult> =>
  Promise.resolve({ ok: true, status: 200, html: '<html></html>', attempts: 1 });

async function seedProduct(
  store: ReturnType<typeof createMemoryStore>,
  estado: AvailabilityState,
  url = 'https://www.lush.com/es/es/p/silvery-moon-soap',
) {
  const created = await store.create({ url, chat_id: '123', tienda: 'Lush' });
  await store.update(created.id, { estado_actual: estado, estado_anterior: estado });
  return created.id;
}

function deps(store: MonitorDeps['store'], overrides: Partial<MonitorDeps> = {}): MonitorDeps {
  return {
    store,
    fetchHtml: okFetch,
    evaluate: async () => ({ state: 'in_stock' }),
    notifier: { notifyRestock: async () => undefined },
    logger: silentLogger(),
    ...overrides,
  };
}

describe('runMonitoringPass', () => {
  it('notifies exactly once on a restock and not again on repeats', async () => {
    const store = createMemoryStore();
    await seedProduct(store, 'out_of_stock');
    const notify = vi.fn(async () => undefined);
    const notifier: RestockNotifier = { notifyRestock: notify };

    const first = await runMonitoringPass(deps(store, { notifier }));
    expect(first.notified).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);

    const second = await runMonitoringPass(deps(store, { notifier }));
    expect(second.notified).toBe(0);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('sets a baseline without notifying on the first in-stock observation', async () => {
    const store = createMemoryStore();
    await seedProduct(store, 'unknown');
    const notify = vi.fn(async () => undefined);
    const summary = await runMonitoringPass(
      deps(store, { notifier: { notifyRestock: notify } }),
    );
    expect(summary.notified).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it('isolates a failure on one product and processes the rest', async () => {
    const store = createMemoryStore();
    await seedProduct(store, 'unknown', 'https://www.lush.com/es/es/p/fails');
    await seedProduct(store, 'unknown', 'https://www.lush.com/es/es/p/succeeds');

    const evaluate = vi.fn(async (url: string) => {
      if (url.endsWith('/fails')) throw new Error('boom');
      return { state: 'in_stock' as AvailabilityState };
    });

    const summary = await runMonitoringPass(deps(store, { evaluate }));
    expect(summary.total).toBe(2);
    expect(summary.errors).toBe(1);
    expect(summary.inStock).toBe(1);
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('issues one fetch per product', async () => {
    const store = createMemoryStore();
    await seedProduct(store, 'out_of_stock', 'https://www.lush.com/es/es/p/a');
    await seedProduct(store, 'out_of_stock', 'https://www.lush.com/es/es/p/b');
    const fetchHtml = vi.fn(okFetch);
    await runMonitoringPass(deps(store, { fetchHtml }));
    expect(fetchHtml).toHaveBeenCalledTimes(2);
  });

  it('records unknown on an HTTP failure and keeps the last determined state', async () => {
    const store = createMemoryStore();
    const id = await seedProduct(store, 'out_of_stock');
    const failingFetch = async (): Promise<FetchResult> => ({
      ok: false,
      status: 403,
      error: 'HTTP 403',
      attempts: 2,
    });
    const summary = await runMonitoringPass(deps(store, { fetchHtml: failingFetch }));
    expect(summary.unknown).toBe(1);
    expect(summary.notified).toBe(0);

    const product = await store.get(id);
    expect(product?.estado_actual).toBe('unknown');
    expect(product?.estado_anterior).toBe('out_of_stock');
  });

  it('keeps the run alive when the notifier fails and does not re-notify', async () => {
    const store = createMemoryStore();
    await seedProduct(store, 'out_of_stock');
    const notify = vi.fn(async () => {
      throw new Error('Telegram HTTP 400: chat not found');
    });

    const first = await runMonitoringPass(
      deps(store, { notifier: { notifyRestock: notify } }),
    );
    expect(first.notified).toBe(0);
    expect(notify).toHaveBeenCalledTimes(1);

    const second = await runMonitoringPass(
      deps(store, { notifier: { notifyRestock: notify } }),
    );
    expect(second.notified).toBe(0);
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
