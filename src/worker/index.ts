import { loadWorkerConfig } from '@core/config';
import { evaluateAvailability } from '@core/evaluate';
import { fetchProductHtml } from '@core/fetch';
import { createLogger } from '@core/logging';
import { runMonitoringPass } from '@core/monitor/run';
import { getProductStore } from '@core/storage';
import { createTelegramNotifier, createTelegramSender } from '@core/telegram';

/**
 * Entry point for the scheduled monitoring run (GitHub Actions) and for local
 * runs (`npm run worker`). Reads all configuration from the environment.
 */
async function main(): Promise<void> {
  const config = loadWorkerConfig();
  const logger = createLogger({ secrets: [config.telegramBotToken] });
  logger.info('starting monitoring run', { backend: config.storeBackend });

  const store = getProductStore();
  const notifier = createTelegramNotifier(createTelegramSender(config.telegramBotToken, { logger }));

  const summary = await runMonitoringPass({
    store,
    fetchHtml: fetchProductHtml,
    evaluate: evaluateAvailability,
    notifier,
    logger,
  });

  logger.info('worker finished', { ...summary });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`StockAlert worker failed: ${message}`);
  process.exitCode = 1;
});
