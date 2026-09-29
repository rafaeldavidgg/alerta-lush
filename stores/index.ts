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

/** A store entry safe to show in the user-facing supported-stores catalog. */
export interface VisibleStore {
  domain: string;
  name: string;
}

/**
 * User-facing store catalog: real stores only, demo/fixture entries
 * excluded. The web UI renders this, so adding a real store entry
 * publishes it automatically with no UI change.
 */
export function listVisibleStores(): VisibleStore[] {
  return stores
    .filter((store) => !store.demo)
    .map((store) => ({ domain: store.domain, name: store.name }));
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
