/**
 * URL validation for Alerta Lush: only lush.com URLs are accepted.
 */

import { isLushHost, LUSH_NAME } from '@core/lush-detector';

/**
 * Common second-level labels used by multi-part public suffixes. This keeps the
 * derivation dependency-free while handling the common `co.uk`-style cases.
 */
const MULTI_PART_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'co.jp',
  'or.jp',
  'ne.jp',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'com.br',
  'com.mx',
  'com.ar',
  'co.in',
  'co.za',
  'com.es',
  'com.tr',
  'com.sg',
  'com.hk',
]);

/**
 * Derive the registrable domain (the "store") from a host.
 *
 * `www.lush.com` -> `lush.com`, `shop.example.co.uk` -> `example.co.uk`.
 */
export function getRegistrableDomain(host: string): string {
  const normalized = host.trim().toLowerCase().replace(/\.$/, '');
  if (!normalized) return '';

  // Bare IP addresses are returned as-is.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) return normalized;

  const labels = normalized.split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');

  const lastTwo = labels.slice(-2).join('.');
  if (MULTI_PART_SUFFIXES.has(lastTwo)) {
    return labels.slice(-3).join('.');
  }
  return lastTwo;
}

export type ParsedProductUrl =
  | { ok: true; url: string; host: string; tienda: string }
  | { ok: false; error: string };

/**
 * Validate and normalize a product URL. Only `lush.com` URLs are accepted;
 * anything else is rejected so it can never be persisted.
 */
export function parseProductUrl(input: unknown): ParsedProductUrl {
  if (typeof input !== 'string' || input.trim() === '') {
    return { ok: false, error: 'La URL es obligatoria' };
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return { ok: false, error: 'La URL debe ser una URL absoluta http(s)' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'La URL debe usar http o https' };
  }

  if (!parsed.hostname) {
    return { ok: false, error: 'La URL debe incluir un host' };
  }

  if (!isLushHost(parsed.hostname)) {
    return { ok: false, error: 'Solo se vigilan URLs de lush.com' };
  }

  return {
    ok: true,
    url: parsed.toString(),
    host: parsed.hostname.toLowerCase(),
    tienda: LUSH_NAME,
  };
}
