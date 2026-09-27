import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateAvailability } from '@core/evaluate';
import { createLogger } from '@core/logging';
import { runMonitoringPass } from '@core/monitor/run';
import { createMemoryStore } from '@core/storage/memory';
import { createTelegramNotifier, createTelegramSender } from '@core/telegram';
import type { HttpPost } from '@core/http';

function fixture(name: string): string {
  const path = fileURLToPath(new URL(`../core/detectors/__fixtures__/${name}`, import.meta.url));
  return readFileSync(path, 'utf8');
}

describe('end-to-end restock scenario', () => {
  it('sends exactly one Telegram message on restock and none on a repeat run', async () => {
    const store = createMemoryStore();
    const created = await store.create({
      url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
      chat_id: '999',
      etiqueta: 'Silvery Moon',
      tienda: 'lush.com',
    });
    await store.update(created.id, {
      estado_actual: 'out_of_stock',
      estado_anterior: 'out_of_stock',
    });

    const sent: Array<Record<string, unknown>> = [];
    const httpPost: HttpPost = async (_url, body) => {
      sent.push(body as Record<string, unknown>);
      return { status: 200, data: { ok: true } };
    };

    const deps = {
      store,
      fetchHtml: async () => ({
        ok: true,
        status: 200,
        html: fixture('lush-in-stock.html'),
        attempts: 1,
      }),
      evaluate: evaluateAvailability,
      notifier: createTelegramNotifier(createTelegramSender('test-token', { httpPost })),
      logger: createLogger({ sink: () => undefined }),
    };

    const first = await runMonitoringPass(deps);
    expect(first.notified).toBe(1);
    expect(sent).toHaveLength(1);
    expect(String(sent[0]!.text)).toContain('Silvery Moon');
    expect(String(sent[0]!.text)).toContain('https://www.lush.com/es/es/p/silvery-moon-soap');
    expect(sent[0]!.chat_id).toBe('999');

    const second = await runMonitoringPass(deps);
    expect(second.notified).toBe(0);
    expect(sent).toHaveLength(1);
  });
});
