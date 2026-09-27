import type { StoreConfig } from '@stores/types';

/**
 * Fixture-backed example store demonstrating how little it takes to add a
 * store: one entry, reusing the existing `htmlSelector` strategy. It is also
 * used by tests to prove that a new store needs no change to the core.
 */
export const exampleShopStore: StoreConfig = {
  domain: 'example-shop.test',
  name: 'Example Shop',
  strategies: [
    {
      type: 'htmlSelector',
      selector: 'button.add-to-cart',
      inStockText: 'Add to cart',
      outOfStockText: 'Sold out',
    },
  ],
};
