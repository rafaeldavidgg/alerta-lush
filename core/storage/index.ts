import type { ProductStore } from '@core/storage/types';
import type { Env } from '@core/config';
import { getMemoryStore } from '@core/storage/memory';
import { createUpstashStoreFromEnv } from '@core/storage/upstash';

/**
 * Resolve the configured shared store.
 *
 * `STOCKALERT_STORE_BACKEND=memory` selects the in-memory adapter for local
 * development and tests; otherwise Upstash Redis is used.
 */
export function getProductStore(env: Env = process.env): ProductStore {
  if (env.STOCKALERT_STORE_BACKEND?.trim().toLowerCase() === 'memory') {
    return getMemoryStore();
  }
  return createUpstashStoreFromEnv(env);
}

export type { ProductStore, ProductUpdate } from '@core/storage/types';
export { createMemoryStore, getMemoryStore, resetMemoryStore } from '@core/storage/memory';
export {
  createUpstashStore,
  createUpstashStoreFromEnv,
  PRODUCT_IDS_KEY,
  productKey,
} from '@core/storage/upstash';
