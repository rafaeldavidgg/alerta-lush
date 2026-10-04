import { describe, expect, it } from 'vitest';
import { getRegistrableDomain, parseProductUrl } from '@core/url';

describe('parseProductUrl', () => {
  it('accepts a valid Lush product URL and fixes the store to Lush', () => {
    const result = parseProductUrl('https://www.lush.com/es/es/p/silvery-moon-soap');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tienda).toBe('Lush');
    expect(result.host).toBe('www.lush.com');
    expect(result.url).toBe('https://www.lush.com/es/es/p/silvery-moon-soap');
  });

  it('rejects a malformed URL', () => {
    const result = parseProductUrl('not-a-url');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/absoluta/i);
  });

  it('rejects a non-http scheme', () => {
    const result = parseProductUrl('ftp://www.lush.com/product');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/http/i);
  });

  it('rejects an empty URL', () => {
    expect(parseProductUrl('').ok).toBe(false);
    expect(parseProductUrl(undefined).ok).toBe(false);
  });

  it('rejects a non-Lush URL', () => {
    const result = parseProductUrl('https://shop.example.co.uk/products/soap');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/lush\.com/i);
  });

  it('rejects a lookalike domain', () => {
    const result = parseProductUrl('https://lush.com.evil.com/p/1');
    expect(result.ok).toBe(false);
  });
});

describe('getRegistrableDomain', () => {
  it('strips the www prefix', () => {
    expect(getRegistrableDomain('www.lush.com')).toBe('lush.com');
  });

  it('keeps bare domains', () => {
    expect(getRegistrableDomain('lush.com')).toBe('lush.com');
  });

  it('handles deep subdomains', () => {
    expect(getRegistrableDomain('a.b.c.lush.com')).toBe('lush.com');
  });
});
