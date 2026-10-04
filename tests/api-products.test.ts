import { beforeEach, describe, expect, it } from 'vitest';
import type { TrackedProduct } from '@core/types';

// Use the in-memory backend for these route-level tests (the "local dev path").
process.env.STOCKALERT_STORE_BACKEND = 'memory';

import { GET, POST } from '@/app/api/products/route';
import { DELETE } from '@/app/api/products/[id]/route';
import { resetMemoryStore } from '@core/storage/memory';

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetMemoryStore();
});

describe('POST /api/products', () => {
  it('creates a valid product and fixes the store to Lush', async () => {
    const response = await POST(
      postRequest({
        url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
        chat_id: '123456',
        etiqueta: 'Silvery Moon',
      }),
    );
    expect(response.status).toBe(201);
    const data = (await response.json()) as { product: Record<string, unknown> };
    expect(data.product).toMatchObject({
      tienda: 'Lush',
      estado_actual: 'unknown',
      estado_anterior: 'unknown',
      etiqueta: 'Silvery Moon',
    });
  });

  it('includes the chat_id so shared deployments can tell chats apart', async () => {
    const createResponse = await POST(
      postRequest({ url: 'https://www.lush.com/es/es/p/x', chat_id: '987654' }),
    );
    const created = (await createResponse.json()) as { product: Record<string, unknown> };
    expect(created.product).toMatchObject({ chat_id: '987654' });

    const list = (await (await GET()).json()) as { products: Record<string, unknown>[] };
    expect(list.products).toHaveLength(1);
    expect(list.products[0]).toMatchObject({ chat_id: '987654' });
  });

  it('rejects an invalid URL with field errors and does not persist', async () => {
    const response = await POST(postRequest({ url: 'not-a-url', chat_id: '123' }));
    expect(response.status).toBe(400);
    const data = (await response.json()) as { errors: Record<string, string> };
    expect(data.errors.url).toBeDefined();

    const list = (await (await GET()).json()) as { products: TrackedProduct[] };
    expect(list.products).toHaveLength(0);
  });

  it('rejects a non-Lush URL with a blocking error and does not persist', async () => {
    const response = await POST(
      postRequest({ url: 'https://www.otra-tienda.com/producto/123', chat_id: '123' }),
    );
    expect(response.status).toBe(400);
    const data = (await response.json()) as { errors: Record<string, string> };
    expect(data.errors.url).toMatch(/lush\.com/i);

    const list = (await (await GET()).json()) as { products: TrackedProduct[] };
    expect(list.products).toHaveLength(0);
  });

  it('rejects an empty chat_id', async () => {
    const response = await POST(
      postRequest({ url: 'https://www.lush.com/es/es/p/x', chat_id: '' }),
    );
    expect(response.status).toBe(400);
  });
});

describe('GET /api/products', () => {
  it('registers and lists a product against the configured store', async () => {
    await POST(postRequest({ url: 'https://www.lush.com/es/es/p/a', chat_id: '1' }));
    const data = (await (await GET()).json()) as { products: TrackedProduct[] };
    expect(data.products).toHaveLength(1);
    expect(data.products[0]!.tienda).toBe('Lush');
  });
});

describe('DELETE /api/products/[id]', () => {
  it('deletes an existing product and 404s a missing one', async () => {
    const created = (await (
      await POST(postRequest({ url: 'https://www.lush.com/es/es/p/a', chat_id: '1' }))
    ).json()) as { product: TrackedProduct };

    const response = await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ id: created.product.id }),
    });
    expect(response.status).toBe(200);

    const list = (await (await GET()).json()) as { products: TrackedProduct[] };
    expect(list.products).toHaveLength(0);

    const missing = await DELETE(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'does-not-exist' }),
    });
    expect(missing.status).toBe(404);
  });
});
