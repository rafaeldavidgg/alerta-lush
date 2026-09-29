import { describe, expect, it } from 'vitest';
import { getStoreForHost, getStoreForUrl, listStores, listVisibleStores } from '@stores/index';

describe('store registry', () => {
  it('resolves a configured host', () => {
    expect(getStoreForHost('www.lush.com')?.domain).toBe('lush.com');
    expect(getStoreForHost('lush.com')?.domain).toBe('lush.com');
  });

  it('returns undefined for an unknown host without throwing', () => {
    expect(getStoreForHost('unknown-shop.example.org')).toBeUndefined();
    expect(getStoreForHost('')).toBeUndefined();
  });

  it('resolves a deeply nested product path', () => {
    const store = getStoreForUrl('https://www.lush.com/es/es/p/moominmamma-body-lotion');
    expect(store?.name).toBe('Lush');
  });

  it('ships the Lush definition by default', () => {
    expect(listStores().map((store) => store.domain)).toContain('lush.com');
  });

  it('exposes a user-facing catalog without demo stores', () => {
    const visible = listVisibleStores();
    expect(visible).toContainEqual({ domain: 'lush.com', name: 'Lush' });
    expect(visible.map((store) => store.domain)).not.toContain('example-shop.test');
    for (const store of visible) {
      expect(typeof store.domain).toBe('string');
      expect(typeof store.name).toBe('string');
    }
  });
});
