import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { loadTelegramWebhookConfig } from '@core/config';
import { createLogger } from '@core/logging';
import { createTelegramSender } from '@core/telegram';
import { handleTelegramUpdate, type TelegramUpdate } from '@core/telegram-incoming';

export const dynamic = 'force-dynamic';

/** Header Telegram sends with the `secret_token` configured via setWebhook. */
const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

/** Constant-time string comparison that tolerates different lengths. */
function secretsMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  if (providedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(providedBytes, expectedBytes);
}

/**
 * Telegram Bot API webhook. Authenticates the caller with the configured
 * secret token, then replies to every incoming message with the sender's
 * `chat_id`. Always acknowledges accepted updates with HTTP 200 (and a
 * non-message update is accepted without a reply) so Telegram stops retrying.
 */
export async function POST(request: Request): Promise<Response> {
  let config;
  try {
    config = loadTelegramWebhookConfig();
  } catch {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  if (!secretsMatch(request.headers.get(SECRET_HEADER), config.webhookSecret)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const logger = createLogger({ secrets: [config.telegramBotToken] });
  const sender = createTelegramSender(config.telegramBotToken, { logger });
  await handleTelegramUpdate(update, { sender, logger });

  return NextResponse.json({ ok: true });
}
