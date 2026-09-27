import { isAvailabilityState, type AvailabilityState } from '@core/types';
import { parseProductUrl } from '@core/url';

export interface RegistrationInput {
  url?: unknown;
  chat_id?: unknown;
  etiqueta?: unknown;
}

export interface ValidRegistration {
  url: string;
  chat_id: string;
  etiqueta?: string;
  tienda: string;
}

export type RegistrationResult =
  | { ok: true; value: ValidRegistration }
  | { ok: false; errors: Record<string, string> };

/**
 * Validate a product registration. Shared by the API route and the web form so
 * the two can never drift. Returns field-level errors on failure.
 */
export function validateRegistration(input: RegistrationInput): RegistrationResult {
  const errors: Record<string, string> = {};

  const parsed = parseProductUrl(input.url);
  if (!parsed.ok) {
    errors.url = parsed.error;
  }

  const rawChatId = typeof input.chat_id === 'string' ? input.chat_id.trim() : '';
  if (rawChatId === '') {
    errors.chat_id = 'chat_id is required';
  } else if (!/^-?\d+$/.test(rawChatId)) {
    errors.chat_id = 'chat_id must be numeric';
  }

  let etiqueta: string | undefined;
  if (typeof input.etiqueta === 'string') {
    const trimmed = input.etiqueta.trim();
    if (trimmed.length > 0) etiqueta = trimmed;
  } else if (input.etiqueta !== undefined && input.etiqueta !== null) {
    errors.etiqueta = 'etiqueta must be a string';
  }

  if (Object.keys(errors).length > 0 || !parsed.ok) {
    return { ok: false, errors };
  }

  const value: ValidRegistration = {
    url: parsed.url,
    chat_id: rawChatId,
    tienda: parsed.tienda,
  };
  if (etiqueta !== undefined) value.etiqueta = etiqueta;
  return { ok: true, value };
}

/** Normalize a state coming from untrusted input (e.g. a store response). */
export function coerceAvailabilityState(value: unknown): AvailabilityState {
  return isAvailabilityState(value) ? value : 'unknown';
}
