import { describe, expect, it } from 'vitest';
import { runStrategies } from '@core/detectors';

const FALLBACK_CONFIG = [
  { type: 'jsonld' as const },
  {
    type: 'htmlSelector' as const,
    selector: 'button',
    inStockText: 'Añadir a la cesta',
    outOfStockText: 'No disponible',
  },
];

describe('strategy fallback chain', () => {
  it('falls through an unknown primary to a later strategy', async () => {
    const html = '<html><body><button>Añadir a la cesta</button></body></html>';
    const result = await runStrategies(FALLBACK_CONFIG, {
      url: 'https://www.lush.com/es/es/p/x',
      html,
    });
    expect(result.state).toBe('in_stock');
    expect(result.strategy).toBe('htmlSelector');
  });

  it('short-circuits on a determined primary', async () => {
    const html = `<html><head>
      <script type="application/ld+json">
        {"@type":"Product","offers":{"availability":"https://schema.org/InStock"}}
      </script></head><body><button>No disponible</button></body></html>`;
    const result = await runStrategies(FALLBACK_CONFIG, {
      url: 'https://www.lush.com/es/es/p/x',
      html,
    });
    expect(result.state).toBe('in_stock');
    expect(result.strategy).toBe('jsonld');
  });

  it('returns unknown when no strategy resolves', async () => {
    const result = await runStrategies(FALLBACK_CONFIG, {
      url: 'https://www.lush.com/es/es/p/x',
      html: '<html><body><button>Comprar</button></body></html>',
    });
    expect(result.state).toBe('unknown');
  });
});
