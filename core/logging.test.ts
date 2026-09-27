import { describe, expect, it } from 'vitest';
import { createLogger, redact } from '@core/logging';
import type { LogLevel } from '@core/logging';

describe('redact', () => {
  it('replaces every occurrence of a secret', () => {
    expect(redact('token abc123 and abc123 again', ['abc123'])).toBe('token *** and *** again');
  });

  it('ignores short values to avoid over-redacting', () => {
    expect(redact('a b c', ['a'])).toBe('a b c');
  });
});

describe('createLogger', () => {
  it('redacts secrets from messages and metadata', () => {
    const lines: string[] = [];
    const logger = createLogger({
      secrets: ['123456:AA-secret-token'],
      sink: (_level: LogLevel, line: string) => lines.push(line),
    });

    logger.info('sending with token 123456:AA-secret-token');
    logger.error('failure', { token: '123456:AA-secret-token' });

    const output = lines.join('\n');
    expect(output).not.toContain('123456:AA-secret-token');
    expect(output).toContain('***');
  });

  it('captures calls for assertions', () => {
    const lines: string[] = [];
    const logger = createLogger({ sink: (_l, line) => lines.push(line) });
    logger.warn('careful');
    expect(lines).toEqual(['careful']);
  });
});
