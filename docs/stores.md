# Adding a store

StockAlert ships one store (**Lush**). Adding another never requires touching
the monitoring core — only configuration.

## 1. Create a store definition

Add a file under `stores/`, e.g. `stores/my-shop.ts`:

```ts
import type { StoreConfig } from '@stores/types';

export const myShopStore: StoreConfig = {
  domain: 'my-shop.com', // registrable domain (no leading "www.")
  name: 'My Shop',
  strategies: [
    { type: 'jsonld' },
    {
      type: 'htmlSelector',
      selector: 'button.add-to-cart',
      inStockText: 'Add to cart',
      outOfStockText: 'Sold out',
    },
  ],
};
```

Register it in `stores/index.ts`:

```ts
export const stores: StoreConfig[] = [lushStore, exampleShopStore, myShopStore];
```

## 2. Choose strategies

Strategies are evaluated in order; the first one that returns a determined
state wins, and `unknown` falls through to the next.

| Strategy | When to use | Parameters |
| --- | --- | --- |
| `jsonld` | The page exposes Schema.org `Product` JSON-LD. Most reliable. | none |
| `htmlSelector` | Availability is plain text in the HTML. | `selector`, `inStockText`, `outOfStockText` |
| `playwright` | Availability only appears after JavaScript runs. | `waitUntil`, `waitForSelector`, nested `strategies` |

A typical robust configuration is `jsonld` first with an `htmlSelector`
fallback.

### The optional `playwright` strategy

`playwright` is intentionally **not** installed as a browser-downloading
dependency, so `npm install` stays light. When a store opts into it:

```bash
npx playwright install chromium
```

The strategy lazily imports `playwright-core`; if the browser is missing it
degrades to `unknown` instead of crashing the run. Stores that do not use it
never load it.

## 3. Test it with a fixture

Save a real page (or a trimmed version) under `stores/__fixtures__/` and add a
test like `stores/example-shop.test.ts`:

```ts
const result = await evaluateAvailability('https://my-shop.com/p/1', fixtureHtml);
expect(result.state).toBe('in_stock');
```

`stores/example-shop.ts` exists purely as this worked example — copy it as your
starting point.
