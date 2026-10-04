import { describe, expect, it } from 'vitest';
import type { Redis } from '@upstash/redis';
import { createMemoryStore } from '@core/storage/memory';
import { PRODUCT_IDS_KEY, createUpstashStore, productKey } from '@core/storage/upstash';
import type { ProductStore } from '@core/storage/types';

const SAMPLE = {
  url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
  chat_id: '123456789',
  etiqueta: 'Silvery Moon',
  tienda: 'Lush',
};

function createFakeRedis() {
  const values = new Map<string, unknown>();
  const sets = new Map<string, Set<string>>();
  const operations: string[] = [];

  const redis = {
    async set(key: string, value: unknown) {
      operations.push(`set ${key}`);
      values.set(key, structuredClone(value));
      return 'OK';
    },
    async get(key: string) {
      operations.push(`get ${key}`);
      return values.has(key) ? structuredClone(values.get(key)) : null;
    },
    async sadd(key: string, member: string) {
      operations.push(`sadd ${key}`);
      const set = sets.get(key) ?? new Set<string>();
      set.add(member);
      sets.set(key, set);
      return 1;
    },
    async srem(key: string, member: string) {
      operations.push(`srem ${key}`);
      return sets.get(key)?.delete(member) ? 1 : 0;
    },
    async del(key: string) {
      operations.push(`del ${key}`);
      return values.delete(key) ? 1 : 0;
    },
    async smembers(key: string) {
      operations.push(`smembers ${key}`);
      return [...(sets.get(key) ?? [])];
    },
  };

  return { redis: redis as unknown as Redis, operations };
}

function runCrudSuite(name: string, makeStore: () => ProductStore) {
  describe(name, () => {
    it('creates a product with no determined state', async () => {
      const store = makeStore();
      const product = await store.create(SAMPLE);
      expect(product.id).toBeTruthy();
      expect(product.estado_actual).toBe('unknown');
      expect(product.estado_anterior).toBe('unknown');
      expect(product.ultima_verificacion).toBeNull();
      expect(() => new Date(product.creado_en).toISOString()).not.toThrow();
    });

    it('lists and gets created products', async () => {
      const store = makeStore();
      await store.create(SAMPLE);
      await store.create({ ...SAMPLE, url: 'https://www.lush.com/es/es/p/other' });
      const all = await store.list();
      expect(all).toHaveLength(2);
      const first = all[0]!;
      expect(await store.get(first.id)).toMatchObject({ id: first.id });
    });

    it('updates a product state', async () => {
      const store = makeStore();
      const product = await store.create(SAMPLE);
      const updated = await store.update(product.id, {
        estado_actual: 'in_stock',
        estado_anterior: 'in_stock',
        ultima_verificacion: '2026-01-01T00:00:00.000Z',
      });
      expect(updated).toMatchObject({
        id: product.id,
        estado_actual: 'in_stock',
        estado_anterior: 'in_stock',
        ultima_verificacion: '2026-01-01T00:00:00.000Z',
      });
    });

    it('returns null when updating a missing product', async () => {
      const store = makeStore();
      expect(await store.update('does-not-exist', { estado_actual: 'in_stock' })).toBeNull();
    });

    it('deletes a product and reports whether it existed', async () => {
      const store = makeStore();
      const product = await store.create(SAMPLE);
      expect(await store.delete(product.id)).toBe(true);
      expect(await store.get(product.id)).toBeNull();
      expect(await store.delete(product.id)).toBe(false);
      expect(await store.list()).toHaveLength(0);
    });
  });
}

runCrudSuite('createMemoryStore', () => createMemoryStore({ idFactory: () => crypto.randomUUID() }));

runCrudSuite('createUpstashStore', () => {
  const { redis } = createFakeRedis();
  return createUpstashStore(redis, { idFactory: () => crypto.randomUUID() });
});

describe('upstash key layout', () => {
  it('uses the documented keys', async () => {
    const { redis, operations } = createFakeRedis();
    const store = createUpstashStore(redis, { idFactory: () => 'fixed-id' });
    await store.create(SAMPLE);

    expect(PRODUCT_IDS_KEY).toBe('stockalert:products');
    expect(productKey('fixed-id')).toBe('stockalert:product:fixed-id');
    expect(operations).toContain('sadd stockalert:products');
    expect(operations).toContain('set stockalert:product:fixed-id');
  });
});
