import type { NewTrackedProduct, TrackedProduct } from '@core/types';

export type ProductUpdate = Partial<
  Pick<
    TrackedProduct,
    'url' | 'chat_id' | 'etiqueta' | 'tienda' | 'estado_actual' | 'estado_anterior' | 'ultima_verificacion'
  >
>;

/**
 * Persistence contract for tracked products. Implemented by the Upstash Redis
 * adapter (shared by the web app and the worker) and an in-memory adapter used
 * by tests and local development.
 */
export interface ProductStore {
  create(input: NewTrackedProduct): Promise<TrackedProduct>;
  list(): Promise<TrackedProduct[]>;
  get(id: string): Promise<TrackedProduct | null>;
  update(id: string, patch: ProductUpdate): Promise<TrackedProduct | null>;
  delete(id: string): Promise<boolean>;
}
