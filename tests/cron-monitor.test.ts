import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { sendMessage, receiverVerify } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  receiverVerify: vi.fn(),
}));

// Stub outbound Telegram and the QStash signature verifier so route tests
// assert observable behavior (status codes, summaries, side effects) without
// network access or real signed payloads.
vi.mock('@core/telegram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@core/telegram')>();
  return {
    ...actual,
    createTelegramSender: () => ({ sendMessage }),
  };
});

vi.mock('@core/fetch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@core/fetch')>();
  return {
    ...actual,
    fetchProductHtml: async () => ({ ok: true, status: 200, html: '<html></html>', attempts: 1 }),
  };
});

vi.mock('@core/evaluate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@core/evaluate')>();
  return {
    ...actual,
    evaluateAvailability: async () => ({ state: 'in_stock' }),
  };
});

vi.mock('@upstash/qstash', () => ({
  Receiver: class {
    verify = receiverVerify;
  },
}));

// In-memory backend for these route-level tests (the "local dev path").
process.env.ALERTA_STORE_BACKEND = 'memory';

import { GET, POST } from '@/app/api/cron/monitor/route';
import { resetMemoryStore, getMemoryStore } from '@core/storage/memory';

const BOT_TOKEN = '123456789:AA-test-bot-token';
const CRON_SECRET = 'test-cron-secret-value';
const SIGNING_KEY = 'test-signing-key';

function cronRequest(options: {
  bearer?: string | null;
  signature?: string | null;
  body?: unknown;
  rawBody?: string;
} = {}): Request {
  const { bearer = `Bearer ${CRON_SECRET}`, signature = null, body, rawBody } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearer !== null) headers['Authorization'] = bearer;
  if (signature !== null) headers['upstash-signature'] = signature;
  return new Request('http://localhost/api/cron/monitor', {
    method: 'POST',
    headers,
    body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
}

async function seedOutOfStockProduct() {
  const store = getMemoryStore();
  const created = await store.create({
    url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
    chat_id: '999',
    tienda: 'Lush',
  });
  await store.update(created.id, { estado_actual: 'out_of_stock', estado_anterior: 'out_of_stock' });
  return created.id;
}

beforeEach(() => {
  vi.stubEnv('ALERTA_STORE_BACKEND', 'memory');
  vi.stubEnv('TELEGRAM_BOT_TOKEN', BOT_TOKEN);
  vi.stubEnv('CRON_SECRET', CRON_SECRET);
  vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', '');
  vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', '');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  resetMemoryStore();
  sendMessage.mockReset();
  sendMessage.mockResolvedValue({ ok: true });
  receiverVerify.mockReset();
  receiverVerify.mockResolvedValue(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/cron/monitor auth', () => {
  it('rejects a request with no credentials and evaluates nothing', async () => {
    const id = await seedOutOfStockProduct();
    const response = await POST(cronRequest({ bearer: null }));
    expect(response.status).toBe(401);

    const product = await getMemoryStore().get(id);
    expect(product?.ultima_verificacion).toBeNull();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rejects a wrong bearer secret', async () => {
    const response = await POST(cronRequest({ bearer: 'Bearer wrong-secret-value-123' }));
    expect(response.status).toBe(401);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('returns 500 when no scheduler credential is configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const response = await POST(cronRequest({ bearer: null }));
    expect(response.status).toBe(500);
    const data = (await response.json()) as { error: string };
    expect(data.error).toMatch(/not configured/);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('accepts a valid QStash signature without a bearer token', async () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', SIGNING_KEY);
    const response = await POST(cronRequest({ bearer: null, signature: 'valid-sig' }));
    expect(receiverVerify).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('rejects an invalid QStash signature without a bearer fallback', async () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', SIGNING_KEY);
    receiverVerify.mockRejectedValue(new Error('invalid signature'));
    const response = await POST(cronRequest({ bearer: null, signature: 'bad-sig' }));
    expect(response.status).toBe(401);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed JSON body without running a pass', async () => {
    const response = await POST(cronRequest({ rawBody: 'not-json{' }));
    expect(response.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe('POST /api/cron/monitor run', () => {
  it('runs a full pass and returns a summary without secrets', async () => {
    await seedOutOfStockProduct();
    const response = await POST(cronRequest({ body: {} }));
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      ok: boolean;
      summary: Record<string, number>;
    };
    expect(data.ok).toBe(true);
    expect(data.summary).toMatchObject({
      total: 1,
      inStock: 1,
      notified: 1,
      errors: 0,
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);

    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain(BOT_TOKEN);
    expect(serialized).not.toContain(CRON_SECRET);
    expect(serialized).not.toContain(SIGNING_KEY);
  });

  it('does not re-notify on a retry after a successful run', async () => {
    await seedOutOfStockProduct();
    const first = await POST(cronRequest({ body: {} }));
    expect(((await first.json()) as { summary: { notified: number } }).summary.notified).toBe(1);

    const second = await POST(cronRequest({ body: {} }));
    expect(second.status).toBe(200);
    expect(((await second.json()) as { summary: { notified: number } }).summary.notified).toBe(0);
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/cron/monitor', () => {
  it('rejects non-POST methods without side effects', async () => {
    await seedOutOfStockProduct();
    const response = await GET();
    expect(response.status).toBe(405);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
