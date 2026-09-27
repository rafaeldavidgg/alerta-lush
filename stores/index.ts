import type { StoreConfig } from '@stores/types';
import { getRegistrableDomain, parseProductUrl } from '@core/url';
import { lushStore } from '@stores/lush';
import { exampleShopStore } from '@stores/example-shop';

/**
 * The store registry. Adding a store is: create a `stores/<name>.ts` file and
 * add it to this array.
 */
export const stores: StoreConfig[] = [lushStore, exampleShopStore];

export function listStores(): StoreConfig[] {
  return [...stores];
}

/**
 * Find the store definition for a host. Never throws: an unknown host simply
 * returns `undefined`, and callers treat that as `unknown` availability.
 */
export function getStoreForHost(host: string): StoreConfig | undefined {
  const normalized = host.trim().toLowerCase();
  if (!normalized) return undefined;

  const registrable = getRegistrableDomain(normalized);
  return stores.find(
    (store) =>
      store.domain === normalized ||
      store.domain === registrable ||
      normalized.endsWith(`.${store.domain}`),
  );
}

/** Convenience: resolve a store definition directly from a product URL. */
export function getStoreForUrl(url: string): StoreConfig | undefined {
  const parsed = parseProductUrl(url);
  if (!parsed.ok) return undefined;
  return getStoreForHost(parsed.host);
}
