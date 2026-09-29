import type { DetectorStrategyConfig } from '@core/detectors/types';

/**
 * A store definition. Adding support for a new store means adding one of these
 * (and reusing existing detector strategies) - no change to the monitoring core
 * is required.
 */
export interface StoreConfig {
  /** Registrable domain this definition handles, e.g. `lush.com`. */
  domain: string;
  /** Human-readable store name. */
  name: string;
  /**
   * Demo/fixture entries (tests, docs) are evaluated by the monitor but
   * excluded from the user-facing store catalog. Real stores omit this.
   */
  demo?: boolean;
  /** Ordered strategies; the first determined result wins. */
  strategies: DetectorStrategyConfig[];
}
