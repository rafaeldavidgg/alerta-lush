import { describe, expect, it } from 'vitest';
import {
  LUSH_IN_STOCK_TEXT,
  LUSH_OUT_OF_STOCK_TEXT,
  LUSH_STRATEGIES,
  isLushHost,
} from '@core/lush-detector';

describe('lush-detector', () => {
  it('accepts lush.com and subdomains', () => {
    expect(isLushHost('lush.com')).toBe(true);
    expect(isLushHost('www.lush.com')).toBe(true);
    expect(isLushHost('WWW.LUSH.COM')).toBe(true);
    expect(isLushHost('es.lush.com.')).toBe(true);
  });

  it('rejects other hosts', () => {
    expect(isLushHost('otra-tienda.com')).toBe(false);
    expect(isLushHost('notlush.com')).toBe(false);
    expect(isLushHost('lush.com.evil.com')).toBe(false);
    expect(isLushHost('')).toBe(false);
  });

  it('exposes the fixed JSON-LD then button chain', () => {
    expect(LUSH_STRATEGIES).toEqual([
      { type: 'jsonld' },
      {
        type: 'htmlSelector',
        selector: 'button',
        inStockText: LUSH_IN_STOCK_TEXT,
        outOfStockText: LUSH_OUT_OF_STOCK_TEXT,
      },
    ]);
    expect(LUSH_IN_STOCK_TEXT).toBe('Añadir a la cesta');
    expect(LUSH_OUT_OF_STOCK_TEXT).toBe('No disponible');
  });
});
