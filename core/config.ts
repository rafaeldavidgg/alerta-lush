export type StoreBackend = 'upstash' | 'memory';

export type Env = Record<string, string | undefined>;

export interface WorkerConfig {
  telegramBotToken: string;
  storeBackend: StoreBackend;
}

export interface TelegramWebhookConfig {
  telegramBotToken: string;
  webhookSecret: string;
}

function readBackend(env: Env): StoreBackend {
  const raw = (env.ALERTA_STORE_BACKEND ?? env.STOCKALERT_STORE_BACKEND ?? '')
    .trim()
    .toLowerCase();
  return raw === 'memory' ? 'memory' : 'upstash';
}

/**
 * Load and validate worker configuration from the environment.
 *
 * Throws with a clear, actionable message when a required variable is missing
 * so the worker can fail fast (and loudly) in GitHub Actions.
 */
export function loadWorkerConfig(env: Env = process.env): WorkerConfig {
  const errors: string[] = [];

  const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!telegramBotToken) errors.push('TELEGRAM_BOT_TOKEN is required');

  const storeBackend = readBackend(env);
  if (storeBackend === 'upstash') {
    if (!env.UPSTASH_REDIS_REST_URL?.trim()) {
      errors.push(
        'UPSTASH_REDIS_REST_URL is required (or set ALERTA_STORE_BACKEND=memory for local runs)',
      );
    }
    if (!env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
      errors.push(
        'UPSTASH_REDIS_REST_TOKEN is required (or set ALERTA_STORE_BACKEND=memory for local runs)',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n- ${errors.join('\n- ')}`);
  }

  return { telegramBotToken: telegramBotToken as string, storeBackend };
}

/**
 * Load and validate the Telegram webhook configuration used by the Vercel API
 * route. Unlike {@link loadWorkerConfig} it does not require any store
 * credentials: the webhook only needs to authenticate Telegram and send a
 * reply.
 */
export function loadTelegramWebhookConfig(env: Env = process.env): TelegramWebhookConfig {
  const errors: string[] = [];

  const telegramBotToken = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!telegramBotToken) errors.push('TELEGRAM_BOT_TOKEN is required');

  const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) errors.push('TELEGRAM_WEBHOOK_SECRET is required');

  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    telegramBotToken: telegramBotToken as string,
    webhookSecret: webhookSecret as string,
  };
}
