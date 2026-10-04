import type { AvailabilityState } from '@core/types';

/**
 * Configuration for a single detection strategy. These are the reusable,
 * store-agnostic building blocks that a store entry composes.
 */
export type DetectorStrategyConfig =
  | { type: 'jsonld' }
  | {
      type: 'htmlSelector';
      /** CSS selector, e.g. `button`. */
      selector: string;
      /** Text that means the product is available. */
      inStockText: string;
      /** Text that means the product is unavailable. */
      outOfStockText: string;
    };

export type DetectorStrategyType = DetectorStrategyConfig['type'];

/** Input handed to a strategy. */
export interface DetectionContext {
  /** The product URL (used by strategies that need to navigate). */
  url: string;
  /** The fetched page markup. */
  html: string;
}

/** What a strategy reports back. */
export interface DetectionResult {
  state: AvailabilityState;
  /** Short, log-friendly explanation of how the state was determined. */
  reason?: string;
}

/**
 * A reusable availability detection strategy. Implementations return
 * `unknown` whenever they cannot determine the state with confidence.
 */
export interface DetectorStrategy<T extends DetectorStrategyConfig = DetectorStrategyConfig> {
  readonly type: DetectorStrategyType;
  detect(config: T, context: DetectionContext): DetectionResult | Promise<DetectionResult>;
}
