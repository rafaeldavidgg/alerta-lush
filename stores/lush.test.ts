import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateAvailability } from '@core/evaluate';

function fixture(name: string): string {
  const path = fileURLToPath(new URL(`../core/detectors/__fixtures__/${name}`, import.meta.url));
  return readFileSync(path, 'utf8');
}

const LUSH_URL = 'https://www.lush.com/es/es/p/silvery-moon-soap';

describe('built-in Lush store configuration', () => {
  it('yields in_stock from the captured in-stock page (JSON-LD)', async () => {
    const result = await evaluateAvailability(LUSH_URL, fixture('lush-in-stock.html'));
    expect(result.state).toBe('in_stock');
    expect(result.strategy).toBe('jsonld');
    expect(result.store).toBe('lush.com');
  });

  it('yields out_of_stock from an out-of-stock page (JSON-LD)', async () => {
    const result = await evaluateAvailability(LUSH_URL, fixture('lush-out-of-stock.html'));
    expect(result.state).toBe('out_of_stock');
    expect(result.strategy).toBe('jsonld');
  });

  it('falls back to button text when JSON-LD is missing', async () => {
    const result = await evaluateAvailability(LUSH_URL, fixture('lush-no-jsonld.html'));
    expect(result.state).toBe('in_stock');
    expect(result.strategy).toBe('htmlSelector');
  });

  it('falls back to button text for out-of-stock when JSON-LD is missing', async () => {
    const result = await evaluateAvailability(
      LUSH_URL,
      fixture('lush-no-jsonld-out-of-stock.html'),
    );
    expect(result.state).toBe('out_of_stock');
    expect(result.strategy).toBe('htmlSelector');
  });

  it('yields unknown for an unconfigured store', async () => {
    const result = await evaluateAvailability(
      'https://unknown-shop.example.org/product/1',
      fixture('lush-in-stock.html'),
    );
    expect(result.state).toBe('unknown');
  });
});
