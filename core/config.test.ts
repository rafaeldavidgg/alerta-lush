import { describe, expect, it } from 'vitest';
import { loadCronConfig, loadTelegramWebhookConfig, loadWorkerConfig } from '@core/config';

describe('loadWorkerConfig', () => {
  it('throws a clear error when the Telegram token is missing', () => {
    expect(() => loadWorkerConfig({})).toThrow(/TELEGRAM_BOT_TOKEN/);
  });

  it('accepts the memory backend without Upstash credentials', () => {
    const config = loadWorkerConfig({
      TELEGRAM_BOT_TOKEN: 'token',
      ALERTA_STORE_BACKEND: 'memory',
    });
    expect(config.storeBackend).toBe('memory');
  });

  it('honors the legacy STOCKALERT_STORE_BACKEND as a fallback', () => {
    const config = loadWorkerConfig({
      TELEGRAM_BOT_TOKEN: 'token',
      STOCKALERT_STORE_BACKEND: 'memory',
    });
    expect(config.storeBackend).toBe('memory');
  });

  it('requires Upstash credentials on the default backend', () => {
    expect(() => loadWorkerConfig({ TELEGRAM_BOT_TOKEN: 'token' })).toThrow(
      /UPSTASH_REDIS_REST_URL/,
    );
  });

  it('returns a complete config when everything is set', () => {
    const config = loadWorkerConfig({
      TELEGRAM_BOT_TOKEN: 'token',
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'secret',
    });
    expect(config).toEqual({ telegramBotToken: 'token', storeBackend: 'upstash' });
  });
});

describe('loadTelegramWebhookConfig', () => {
  it('throws when the Telegram token is missing', () => {
    expect(() => loadTelegramWebhookConfig({ TELEGRAM_WEBHOOK_SECRET: 'secret' })).toThrow(
      /TELEGRAM_BOT_TOKEN/,
    );
  });

  it('throws when the webhook secret is missing', () => {
    expect(() => loadTelegramWebhookConfig({ TELEGRAM_BOT_TOKEN: 'token' })).toThrow(
      /TELEGRAM_WEBHOOK_SECRET/,
    );
  });

  it('does not require Upstash credentials', () => {
    const config = loadTelegramWebhookConfig({
      TELEGRAM_BOT_TOKEN: 'token',
      TELEGRAM_WEBHOOK_SECRET: 'secret',
    });
    expect(config).toEqual({ telegramBotToken: 'token', webhookSecret: 'secret' });
  });
});

describe('loadCronConfig', () => {
  it('requires at least one scheduler credential', () => {
    expect(() =>
      loadCronConfig({
        TELEGRAM_BOT_TOKEN: 'token',
        UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'secret',
      }),
    ).toThrow(/CRON_SECRET or QSTASH_CURRENT_SIGNING_KEY/);
  });

  it('accepts a bearer-only setup', () => {
    const config = loadCronConfig({
      TELEGRAM_BOT_TOKEN: 'token',
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'secret',
      CRON_SECRET: 'cron-secret',
    });
    expect(config).toEqual({
      telegramBotToken: 'token',
      storeBackend: 'upstash',
      cronSecret: 'cron-secret',
      qstashCurrentSigningKey: undefined,
      qstashNextSigningKey: undefined,
    });
  });

  it('accepts a QStash-signing-only setup', () => {
    const config = loadCronConfig({
      TELEGRAM_BOT_TOKEN: 'token',
      UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'secret',
      QSTASH_CURRENT_SIGNING_KEY: 'current',
      QSTASH_NEXT_SIGNING_KEY: 'next',
    });
    expect(config.qstashCurrentSigningKey).toBe('current');
    expect(config.qstashNextSigningKey).toBe('next');
    expect(config.cronSecret).toBeUndefined();
  });

  it('works with the memory backend without Upstash credentials', () => {
    const config = loadCronConfig({
      TELEGRAM_BOT_TOKEN: 'token',
      ALERTA_STORE_BACKEND: 'memory',
      CRON_SECRET: 'cron-secret',
    });
    expect(config.storeBackend).toBe('memory');
  });

  it('requires the Telegram token and Upstash credentials on the default backend', () => {
    expect(() => loadCronConfig({ CRON_SECRET: 's' })).toThrow(/TELEGRAM_BOT_TOKEN/);
    expect(() => loadCronConfig({ TELEGRAM_BOT_TOKEN: 't', CRON_SECRET: 's' })).toThrow(
      /UPSTASH_REDIS_REST_URL/,
    );
  });

  it('trims blank credential values', () => {
    expect(() =>
      loadCronConfig({
        TELEGRAM_BOT_TOKEN: 'token',
        ALERTA_STORE_BACKEND: 'memory',
        CRON_SECRET: '   ',
      }),
    ).toThrow(/CRON_SECRET or QSTASH_CURRENT_SIGNING_KEY/);
  });
});
