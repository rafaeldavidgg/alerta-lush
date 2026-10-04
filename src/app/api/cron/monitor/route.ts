import { NextResponse } from 'next/server';
import { loadCronConfig } from '@core/config';
import { isAuthorizedRequest } from '@core/cron-auth';
import { evaluateAvailability } from '@core/evaluate';
import { fetchProductHtml } from '@core/fetch';
import { createLogger } from '@core/logging';
import { runMonitoringPass } from '@core/monitor/run';
import { getProductStore } from '@core/storage';
import { createTelegramNotifier, createTelegramSender } from '@core/telegram';

export const dynamic = 'force-dynamic';

/** Room for a full pass (one bounded fetch per product) on Vercel Hobby. */
export const maxDuration = 60;

/**
 * QStash-driven monitoring trigger. Authenticates the caller (QStash
 * signature or bearer `CRON_SECRET`), then runs the same monitoring pass as
 * `npm run worker` and returns a short machine-readable summary.
 * Unauthorized or malformed requests never evaluate products.
 */
export async function POST(request: Request): Promise<Response> {
  let config;
  try {
    config = loadCronConfig();
  } catch {
    return NextResponse.json({ error: 'cron not configured' }, { status: 500 });
  }

  const rawBody = await request.text();

  const authorized = await isAuthorizedRequest(request, rawBody, {
    cronSecret: config.cronSecret,
    qstashCurrentSigningKey: config.qstashCurrentSigningKey,
    qstashNextSigningKey: config.qstashNextSigningKey,
  });
  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (rawBody.trim() !== '') {
    try {
      JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
  }

  const secrets = [
    config.telegramBotToken,
    config.cronSecret,
    config.qstashCurrentSigningKey,
    config.qstashNextSigningKey,
  ].filter((secret): secret is string => typeof secret === 'string');
  const logger = createLogger({ secrets });

  try {
    const store = getProductStore();
    const notifier = createTelegramNotifier(
      createTelegramSender(config.telegramBotToken, { logger }),
    );

    const summary = await runMonitoringPass({
      store,
      fetchHtml: fetchProductHtml,
      evaluate: evaluateAvailability,
      notifier,
      logger,
    });

    logger.info('cron monitoring run complete', { ...summary });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('cron monitoring run failed', { error: message });
    return NextResponse.json({ error: 'monitoring pass failed' }, { status: 500 });
  }
}

/** Only POST triggers a run; anything else is rejected without side effects. */
export async function GET(): Promise<Response> {
  return NextResponse.json({ error: 'method not allowed' }, { status: 405 });
}
