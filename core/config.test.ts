import { describe, expect, it } from 'vitest';
import { loadTelegramWebhookConfig, loadWorkerConfig } from '@core/config';

describe('loadWorkerConfig', () => {
  it('throws a clear error when the Telegram token is missing', () => {
    expect(() => loadWorkerConfig({})).toThrow(/TELEGRAM_BOT_TOKEN/);
  });

  it('accepts the memory backend without Upstash credentials', () => {
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
