import type { AvailabilityState } from '@core/types';
import type {
  DetectionContext,
  DetectorStrategy,
  DetectorStrategyConfig,
  DetectorStrategyType,
} from '@core/detectors/types';

const registry = new Map<DetectorStrategyType, DetectorStrategy>();

/** Register a strategy so store configurations can reference it by `type`. */
export function registerStrategy(strategy: DetectorStrategy): void {
  registry.set(strategy.type, strategy);
}

/** Remove every registered strategy. Primarily useful in tests. */
export function clearStrategies(): void {
  registry.clear();
}

export function getStrategy(type: DetectorStrategyType): DetectorStrategy | undefined {
  return registry.get(type);
}

export function listStrategyTypes(): DetectorStrategyType[] {
  return [...registry.keys()];
}

export interface StrategyEvaluation {
  state: AvailabilityState;
  /** The strategy type that produced the determined state, if any. */
  strategy?: DetectorStrategyType;
  reason?: string;
}

/**
 * Evaluate an ordered list of strategies and return the first determined
 * result. An `unknown` result falls through to the next strategy; if none
 * determines the state, `unknown` is returned.
 */
export async function runStrategies(
  configs: DetectorStrategyConfig[],
  context: DetectionContext,
): Promise<StrategyEvaluation> {
  let lastReason: string | undefined;

  for (const config of configs) {
    const strategy = registry.get(config.type);
    if (!strategy) {
      lastReason = `no strategy registered for "${config.type}"`;
      continue;
    }

    const result = await strategy.detect(config, context);
    if (result.state !== 'unknown') {
      return { state: result.state, strategy: config.type, reason: result.reason };
    }
    lastReason = result.reason;
  }

  return { state: 'unknown', reason: lastReason ?? 'no strategies configured' };
}
