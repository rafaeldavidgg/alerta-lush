import { describe, expect, it } from 'vitest';
import { htmlSelectorStrategy } from '@core/detectors';

const CONFIG = {
  type: 'htmlSelector' as const,
  selector: 'button.add-to-cart',
  inStockText: 'Add to cart',
  outOfStockText: 'Sold out',
};

async function detect(html: string) {
  return htmlSelectorStrategy.detect(CONFIG, { url: 'https://example.com/p', html });
}

describe('htmlSelectorStrategy', () => {
  it('matches the expected in-stock text', async () => {
    const result = await detect('<button class="add-to-cart">  Add   to cart </button>');
    expect(result.state).toBe('in_stock');
  });

  it('matches the expected out-of-stock text', async () => {
    const result = await detect('<button class="add-to-cart">Sold out</button>');
    expect(result.state).toBe('out_of_stock');
  });

  it('returns unknown for unexpected text', async () => {
    const result = await detect('<button class="add-to-cart">Coming soon</button>');
    expect(result.state).toBe('unknown');
  });

  it('returns unknown when the element is missing', async () => {
    const result = await detect('<button class="buy-now">Add to cart</button>');
    expect(result.state).toBe('unknown');
  });
});
