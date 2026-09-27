import { registerStrategy } from '@core/detectors/registry';
import { jsonLdStrategy } from '@core/detectors/jsonld';
import { htmlSelectorStrategy } from '@core/detectors/html-selector';
import { playwrightStrategy } from '@core/detectors/playwright';

/** Register the built-in strategies. Idempotent. */
export function registerBuiltInStrategies(): void {
  registerStrategy(jsonLdStrategy);
  registerStrategy(htmlSelectorStrategy);
  registerStrategy(playwrightStrategy);
}

registerBuiltInStrategies();

export { registerStrategy, clearStrategies, runStrategies } from '@core/detectors/registry';
export type { StrategyEvaluation } from '@core/detectors/registry';
export { jsonLdStrategy } from '@core/detectors/jsonld';
export { htmlSelectorStrategy } from '@core/detectors/html-selector';
export { playwrightStrategy } from '@core/detectors/playwright';
export type {
  DetectionContext,
  DetectionResult,
  DetectorStrategy,
  DetectorStrategyConfig,
  DetectorStrategyType,
} from '@core/detectors/types';
