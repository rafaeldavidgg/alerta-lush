import { describe, expect, it } from 'vitest';
import { AVAILABILITY_STATES, isAvailabilityState } from '@core/types';
import { coerceAvailabilityState, validateRegistration } from '@core/validation';

describe('availability state union', () => {
  it('accepts exactly the allowed state values', () => {
    for (const state of AVAILABILITY_STATES) {
      expect(isAvailabilityState(state)).toBe(true);
    }
    expect(AVAILABILITY_STATES).toEqual(['in_stock', 'out_of_stock', 'unknown']);
  });

  it('rejects anything else', () => {
    expect(isAvailabilityState('available')).toBe(false);
    expect(isAvailabilityState('in-stock')).toBe(false);
    expect(isAvailabilityState(undefined)).toBe(false);
    expect(isAvailabilityState(1)).toBe(false);
  });

  it('coerces unknown input to unknown', () => {
    expect(coerceAvailabilityState('weird')).toBe('unknown');
    expect(coerceAvailabilityState('in_stock')).toBe('in_stock');
  });
});

describe('validateRegistration', () => {
  it('accepts a valid registration and fixes the store to Lush', () => {
    const result = validateRegistration({
      url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
      chat_id: '123456789',
      etiqueta: 'Jabón Silvery Moon',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tienda).toBe('Lush');
    expect(result.value.chat_id).toBe('123456789');
    expect(result.value.etiqueta).toBe('Jabón Silvery Moon');
  });

  it('rejects an invalid URL', () => {
    const result = validateRegistration({ url: 'not-a-url', chat_id: '123' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.url).toBeDefined();
  });

  it('rejects a non-Lush URL without persisting', () => {
    const result = validateRegistration({
      url: 'https://www.otra-tienda.com/producto/123',
      chat_id: '123',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.url).toMatch(/lush\.com/i);
  });

  it('rejects an empty chat_id', () => {
    const result = validateRegistration({
      url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
      chat_id: '',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.chat_id).toMatch(/obligatorio/i);
  });

  it('rejects a non-numeric chat_id', () => {
    const result = validateRegistration({
      url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
      chat_id: 'abc',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.chat_id).toMatch(/numérico/i);
  });

  it('omits an empty optional label', () => {
    const result = validateRegistration({
      url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
      chat_id: '123',
      etiqueta: '   ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.etiqueta).toBeUndefined();
  });
});
