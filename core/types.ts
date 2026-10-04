/**
 * Core domain types shared by the web app, the monitoring worker, and the detectors.
 */

/** Result of evaluating a product's availability. */
export type AvailabilityState = 'in_stock' | 'out_of_stock' | 'unknown';

/** Every allowed availability value, handy for validation and tests. */
export const AVAILABILITY_STATES: readonly AvailabilityState[] = [
  'in_stock',
  'out_of_stock',
  'unknown',
] as const;

/** Type guard for {@link AvailabilityState}. */
export function isAvailabilityState(value: unknown): value is AvailabilityState {
  return value === 'in_stock' || value === 'out_of_stock' || value === 'unknown';
}

/**
 * A product the user asked Alerta Lush to watch.
 *
 * Field names intentionally match the project's data model
 * (`id, url, chat_id, etiqueta, tienda, estado_actual, estado_anterior,
 * ultima_verificacion, creado_en`).
 *
 * `estado_actual` is the result of the most recent run and may be `unknown`.
 * `estado_anterior` is the last *determined* state (or `unknown` when nothing
 * has been determined yet); transition detection is based on it so that a
 * transient `unknown` does not erase the known baseline.
 */
export interface TrackedProduct {
  id: string;
  url: string;
  chat_id: string;
  etiqueta?: string;
  /** Registrable store domain derived from the URL host, e.g. `lush.com`. */
  tienda: string;
  estado_actual: AvailabilityState;
  estado_anterior: AvailabilityState;
  /** ISO-8601 timestamp of the last evaluation, or null before the first run. */
  ultima_verificacion: string | null;
  /** ISO-8601 creation timestamp. */
  creado_en: string;
}

/** Fields required to create a tracked product. */
export interface NewTrackedProduct {
  url: string;
  chat_id: string;
  etiqueta?: string;
  tienda: string;
}

/**
 * A tracked product as exposed to the browser/API. The Telegram `chat_id` is
 * included on purpose: on shared deployments several people register products
 * and the list must show which chat each alert will go to. Anyone who can open
 * the page can see every chat_id.
 */
export type PublicTrackedProduct = TrackedProduct;

/** Return the product as-is: `chat_id` is intentionally visible (see above). */
export function toPublicProduct(product: TrackedProduct): PublicTrackedProduct {
  return product;
}
