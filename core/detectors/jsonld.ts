import * as cheerio from 'cheerio';
import type { AvailabilityState } from '@core/types';
import type { DetectionContext, DetectionResult, DetectorStrategy } from '@core/detectors/types';

const IN_STOCK_VALUES = new Set(['instock', 'limitedavailability']);
const OUT_OF_STOCK_VALUES = new Set([
  'outofstock',
  'soldout',
  'discontinued',
  'outofstockonline',
]);

/**
 * Reduce a Schema.org availability value to its bare token, accepting both the
 * short (`InStock`) and URL (`https://schema.org/InStock`) forms.
 */
function normalizeAvailabilityToken(value: unknown): string {
  if (typeof value !== 'string') return '';
  const afterSlash = value.split('/').pop() ?? value;
  const afterColon = afterSlash.split(':').pop() ?? afterSlash;
  return afterColon.toLowerCase().replace(/[^a-z]/g, '');
}

function mapAvailability(value: unknown): AvailabilityState {
  const token = normalizeAvailabilityToken(value);
  if (IN_STOCK_VALUES.has(token)) return 'in_stock';
  if (OUT_OF_STOCK_VALUES.has(token)) return 'out_of_stock';
  return 'unknown';
}

/** Collect every `@type: Product`-ish node, descending into `@graph` arrays. */
function collectProductNodes(node: unknown, out: Record<string, unknown>[]): void {
  if (Array.isArray(node)) {
    for (const item of node) collectProductNodes(item, out);
    return;
  }
  if (!node || typeof node !== 'object') return;

  const record = node as Record<string, unknown>;
  const type = record['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => typeof t === 'string' && t.toLowerCase() === 'product')) {
    out.push(record);
  }
  if (Array.isArray(record['@graph'])) {
    collectProductNodes(record['@graph'], out);
  }
}

function readAvailability(product: Record<string, unknown>): unknown {
  const offers = product['offers'];
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      if (offer && typeof offer === 'object') {
        const value = (offer as Record<string, unknown>)['availability'];
        if (value !== undefined) return value;
      }
    }
    return undefined;
  }
  if (offers && typeof offers === 'object') {
    return (offers as Record<string, unknown>)['availability'];
  }
  return undefined;
}

/**
 * Reads `application/ld+json` blocks and maps Schema.org `Product` offer
 * availability to a state.
 */
export const jsonLdStrategy: DetectorStrategy<{ type: 'jsonld' }> = {
  type: 'jsonld',
  detect(_config, context: DetectionContext): DetectionResult {
    const $ = cheerio.load(context.html);
    const blocks = $('script[type="application/ld+json"]');

    for (let i = 0; i < blocks.length; i += 1) {
      const raw = $(blocks[i]).text().trim();
      if (!raw) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Malformed JSON-LD block: skip it and keep looking.
        continue;
      }

      const productNodes: Record<string, unknown>[] = [];
      collectProductNodes(parsed, productNodes);

      for (const product of productNodes) {
        const state = mapAvailability(readAvailability(product));
        if (state !== 'unknown') {
          return { state, reason: `jsonld availability=${String(readAvailability(product))}` };
        }
      }
    }

    return { state: 'unknown', reason: 'no usable Product JSON-LD availability' };
  },
};
