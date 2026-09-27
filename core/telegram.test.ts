import { describe, expect, it } from 'vitest';
import { createTelegramNotifier, createTelegramSender } from '@core/telegram';
import type { HttpPost } from '@core/http';
import type { TrackedProduct } from '@core/types';

const TOKEN = '123456789:AA-secret-token-value';

function product(overrides: Partial<TrackedProduct> = {}): TrackedProduct {
  return {
    id: 'p1',
    url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
    chat_id: '111',
    etiqueta: 'Silvery Moon',
    tienda: 'lush.com',
    estado_actual: 'in_stock',
    estado_anterior: 'in_stock',
    ultima_verificacion: '2026-01-01T00:00:00.000Z',
    creado_en: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('createTelegramSender', () => {
  it('posts a sendMessage request with the chat_id and text', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const httpPost: HttpPost = async (url, body) => {
      calls.push({ url, body });
      return { status: 200, data: { ok: true } };
    };
    const sender = createTelegramSender(TOKEN, { httpPost });

    const result = await sender.sendMessage('111', 'hola');

    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain(`/bot${TOKEN}/sendMessage`);
    expect(calls[0]!.body).toMatchObject({ chat_id: '111', text: 'hola' });
  });

  it('reports an API error without throwing', async () => {
    const httpPost: HttpPost = async () => ({
      status: 400,
      data: { ok: false, description: 'chat not found' },
    });
    const sender = createTelegramSender(TOKEN, { httpPost });
    const result = await sender.sendMessage('111', 'hola');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('chat not found');
  });

  it('redacts the token from errors', async () => {
    const httpPost: HttpPost = async () => {
      throw new Error(`request to https://api.telegram.org/bot${TOKEN}/sendMessage failed`);
    };
    const sender = createTelegramSender(TOKEN, { httpPost });
    const result = await sender.sendMessage('111', 'hola');
    expect(result.ok).toBe(false);
    expect(result.error).not.toContain(TOKEN);
    expect(result.error).toContain('***');
  });
});

describe('createTelegramNotifier', () => {
  it('includes the label and URL and targets each product chat', async () => {
    const sent: Array<{ chatId: string; text: string }> = [];
    const sender = {
      async sendMessage(chatId: string, text: string) {
        sent.push({ chatId, text });
        return { ok: true };
      },
    };
    const notifier = createTelegramNotifier(sender);

    await notifier.notifyRestock(product({ chat_id: '111' }));
    await notifier.notifyRestock(product({ id: 'p2', chat_id: '222', etiqueta: undefined }));

    expect(sent).toHaveLength(2);
    expect(sent[0]!.chatId).toBe('111');
    expect(sent[0]!.text).toContain('Silvery Moon');
    expect(sent[0]!.text).toContain('https://www.lush.com/es/es/p/silvery-moon-soap');
    expect(sent[1]!.chatId).toBe('222');
    expect(sent[1]!.text).toContain('https://www.lush.com/es/es/p/silvery-moon-soap');
  });

  it('throws when delivery fails so the run can log it', async () => {
    const notifier = createTelegramNotifier({
      async sendMessage() {
        return { ok: false, error: 'boom' };
      },
    });
    await expect(notifier.notifyRestock(product())).rejects.toThrow('boom');
  });
});
