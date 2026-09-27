import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn() }));

// Stub the outbound Telegram call so route tests assert observable behavior
// (status codes and the reply sent) without touching the network.
vi.mock('@core/telegram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@core/telegram')>();
  return {
    ...actual,
    createTelegramSender: () => ({ sendMessage }),
  };
});

import { POST } from '@/app/api/telegram/webhook/route';

const SECRET = 'test-webhook-secret';

function webhookRequest(body: unknown, secret: string | null = SECRET): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret !== null) headers['X-Telegram-Bot-Api-Secret-Token'] = secret;
  return new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv('TELEGRAM_BOT_TOKEN', '123456789:AA-secret-token-value');
  vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', SECRET);
  sendMessage.mockReset();
  sendMessage.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/telegram/webhook', () => {
  it('rejects a request with no secret token', async () => {
    const response = await POST(
      webhookRequest({ update_id: 1, message: { chat: { id: 1 }, text: 'hi' } }, null),
    );
    expect(response.status).toBe(401);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rejects a request with the wrong secret token (different length)', async () => {
    const response = await POST(webhookRequest({ update_id: 1 }, 'wrong'));
    expect(response.status).toBe(401);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('replies with the chat id on a valid message update', async () => {
    const response = await POST(
      webhookRequest({ update_id: 1, message: { chat: { id: 123456 }, text: 'hola' } }),
    );

    expect(response.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    const [chatId, text] = sendMessage.mock.calls[0]! as [string, string];
    expect(chatId).toBe('123456');
    expect(text).toContain('123456');
  });

  it('acknowledges a non-message update without replying', async () => {
    const response = await POST(
      webhookRequest({ update_id: 2, edited_message: { chat: { id: 1 } } }),
    );

    expect(response.status).toBe(200);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('returns 400 for an unparseable body', async () => {
    const response = await POST(
      new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': SECRET,
        },
        body: 'not-json',
      }),
    );

    expect(response.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('still acknowledges when the reply fails to send', async () => {
    sendMessage.mockResolvedValue({ ok: false, error: 'chat not found' });

    const response = await POST(
      webhookRequest({ update_id: 3, message: { chat: { id: 9 }, text: 'x' } }),
    );

    expect(response.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
});
