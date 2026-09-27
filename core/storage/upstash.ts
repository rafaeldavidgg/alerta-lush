import { randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';
import type { NewTrackedProduct, TrackedProduct } from '@core/types';
import type { Env } from '@core/config';
import type { ProductStore, ProductUpdate } from '@core/storage/types';

/** Set holding every tracked-product id. */
export const PRODUCT_IDS_KEY = 'stockalert:products';

/** Key holding a single tracked product's JSON document. */
export function productKey(id: string): string {
  return `stockalert:product:${id}`;
}

export interface UpstashStoreOptions {
  now?: () => Date;
  idFactory?: () => string;
}

/**
 * Upstash Redis adapter. Shared by the Vercel API routes and the GitHub Actions
 * worker, so both read and write the same records. The REST credentials come
 * from the environment and are never persisted in the repository.
 */
export function createUpstashStore(redis: Redis, options: UpstashStoreOptions = {}): ProductStore {
  const now = options.now ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());

  return {
    async create(input: NewTrackedProduct): Promise<TrackedProduct> {
      const product: TrackedProduct = {
        id: idFactory(),
        url: input.url,
        chat_id: input.chat_id,
        tienda: input.tienda,
        estado_actual: 'unknown',
        estado_anterior: 'unknown',
        ultima_verificacion: null,
        creado_en: now().toISOString(),
      };
      if (input.etiqueta !== undefined) product.etiqueta = input.etiqueta;

      await redis.set(productKey(product.id), product);
      await redis.sadd(PRODUCT_IDS_KEY, product.id);
      return product;
    },

    async list(): Promise<TrackedProduct[]> {
      const ids = await redis.smembers<string[]>(PRODUCT_IDS_KEY);
      if (ids.length === 0) return [];
      const products = await Promise.all(
        ids.map((id) => redis.get<TrackedProduct>(productKey(id))),
      );
      return products.filter((product): product is TrackedProduct => product !== null);
    },

    async get(id: string): Promise<TrackedProduct | null> {
      return (await redis.get<TrackedProduct>(productKey(id))) ?? null;
    },

    async update(id: string, patch: ProductUpdate): Promise<TrackedProduct | null> {
      const existing = await redis.get<TrackedProduct>(productKey(id));
      if (!existing) return null;
      const updated: TrackedProduct = { ...existing, ...patch };
      await redis.set(productKey(id), updated);
      return updated;
    },

    async delete(id: string): Promise<boolean> {
      const existing = await redis.get<TrackedProduct>(productKey(id));
      if (!existing) return false;
      await redis.srem(PRODUCT_IDS_KEY, id);
      await redis.del(productKey(id));
      return true;
    },
  };
}

/** Build a store from `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. */
export function createUpstashStoreFromEnv(env: Env = process.env): ProductStore {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    throw new Error(
      'Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. ' +
        'Set them in the environment, or use STOCKALERT_STORE_BACKEND=memory for local development.',
    );
  }
  return createUpstashStore(new Redis({ url, token }));
}
