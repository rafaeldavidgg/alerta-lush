import { describe, expect, it, vi } from 'vitest';

// If any non-playwright strategy imported playwright-core, this would throw.
vi.mock('playwright-core', () => {
  throw new Error('playwright-core must not be imported for non-playwright strategies');
});

import { runStrategies } from '@core/detectors';

describe('lazy playwright loading', () => {
  it('does not load playwright-core for a JSON-LD store', async () => {
    const result = await runStrategies(
      [{ type: 'jsonld' }],
      {
        url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
        html: `<script type="application/ld+json">{"@type":"Product","offers":{"availability":"https://schema.org/InStock"}}</script>`,
      },
    );
    expect(result.state).toBe('in_stock');
  });

  it('does not load playwright-core for an htmlSelector fallback', async () => {
    const result = await runStrategies(
      [
        { type: 'jsonld' },
        { type: 'htmlSelector', selector: 'button', inStockText: 'Añadir a la cesta', outOfStockText: 'No disponible' },
      ],
      { url: 'https://www.lush.com/es/es/p/x', html: '<button>Añadir a la cesta</button>' },
    );
    expect(result.state).toBe('in_stock');
  });
});
