import * as cheerio from 'cheerio';
import type { DetectionContext, DetectionResult, DetectorStrategy } from '@core/detectors/types';

function normalizeText(value: string | undefined | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Locates an element by CSS selector and compares its text against the
 * configured in-stock / out-of-stock strings. Returns `unknown` when the
 * element is missing or its text matches neither value.
 */
export const htmlSelectorStrategy: DetectorStrategy<{
  type: 'htmlSelector';
  selector: string;
  inStockText: string;
  outOfStockText: string;
}> = {
  type: 'htmlSelector',
  detect(config, context: DetectionContext): DetectionResult {
    const $ = cheerio.load(context.html);
    const elements = $(config.selector);
    if (elements.length === 0) {
      return { state: 'unknown', reason: `selector "${config.selector}" not found` };
    }

    const inStockText = normalizeText(config.inStockText);
    const outOfStockText = normalizeText(config.outOfStockText);

    for (let i = 0; i < elements.length; i += 1) {
      const text = normalizeText($(elements[i]).text());
      if (inStockText && text === inStockText) {
        return { state: 'in_stock', reason: `text matched "${config.inStockText}"` };
      }
      if (outOfStockText && text === outOfStockText) {
        return { state: 'out_of_stock', reason: `text matched "${config.outOfStockText}"` };
      }
    }

    return { state: 'unknown', reason: 'selector text matched neither expected value' };
  },
};
