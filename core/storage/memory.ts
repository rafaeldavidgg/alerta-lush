import { randomUUID } from 'node:crypto';
import type { NewTrackedProduct, TrackedProduct } from '@core/types';
import type { ProductStore, ProductUpdate } from '@core/storage/types';

export interface MemoryStoreOptions {
  now?: () => Date;
  idFactory?: () => string;
}

/** In-memory {@link ProductStore} for tests and local development. */
export function createMemoryStore(options: MemoryStoreOptions = {}): ProductStore {
  const now = options.now ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());
  const products = new Map<string, TrackedProduct>();

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
      products.set(product.id, product);
      return product;
    },

    async list(): Promise<TrackedProduct[]> {
      return [...products.values()];
    },

    async get(id: string): Promise<TrackedProduct | null> {
      return products.get(id) ?? null;
    },

    async update(id: string, patch: ProductUpdate): Promise<TrackedProduct | null> {
      const existing = products.get(id);
      if (!existing) return null;
      const updated: TrackedProduct = { ...existing, ...patch };
      products.set(id, updated);
      return updated;
    },

    async delete(id: string): Promise<boolean> {
      return products.delete(id);
    },
  };
}

interface GlobalWithMemoryStore {
  __stockalertMemoryStore?: ProductStore;
}

/**
 * Process-wide in-memory store. Persisted on `globalThis` so it survives module
 * reloads (HMR) during local development. Not suitable for serverless runtime,
 * where each request may be a fresh process.
 */
export function getMemoryStore(): ProductStore {
  const globalRef = globalThis as unknown as GlobalWithMemoryStore;
  if (!globalRef.__stockalertMemoryStore) {
    globalRef.__stockalertMemoryStore = createMemoryStore();
  }
  return globalRef.__stockalertMemoryStore;
}

/** Drop the process-wide in-memory store. Useful in tests and manual dev runs. */
export function resetMemoryStore(): void {
  const globalRef = globalThis as unknown as GlobalWithMemoryStore;
  delete globalRef.__stockalertMemoryStore;
}
