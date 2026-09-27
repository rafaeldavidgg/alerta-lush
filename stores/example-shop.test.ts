import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluateAvailability } from '@core/evaluate';

function fixture(name: string): string {
  const path = fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));
  return readFileSync(path, 'utf8');
}

/**
 * Adding a store needs only a configuration entry. This test exercises the
 * second store end-to-end through the unmodified core evaluation path.
 */
describe('example store added by configuration only', () => {
  it('evaluates in_stock via the htmlSelector strategy', async () => {
    const result = await evaluateAvailability(
      'https://example-shop.test/products/1',
      fixture('example-shop-in-stock.html'),
    );
    expect(result.state).toBe('in_stock');
    expect(result.strategy).toBe('htmlSelector');
    expect(result.store).toBe('example-shop.test');
  });
});
