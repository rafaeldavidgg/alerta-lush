import type { StoreConfig } from '@stores/types';

/**
 * Fixture-backed example store demonstrating how little it takes to add a
 * store: one entry, reusing the existing `htmlSelector` strategy. It is also
 * used by tests to prove that a new store needs no change to the core.
 */
export const exampleShopStore: StoreConfig = {
  domain: 'example-shop.test',
  name: 'Example Shop',
  // Fixture-only store: evaluated by the monitor in tests, never shown
  // in the user-facing supported-stores catalog.
  demo: true,
  strategies: [
    {
      type: 'htmlSelector',
      selector: 'button.add-to-cart',
      inStockText: 'Add to cart',
      outOfStockText: 'Sold out',
    },
  ],
};
