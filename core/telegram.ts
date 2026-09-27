import { axiosPost, type HttpPost } from '@core/http';
import { redact } from '@core/logging';
import type { Logger } from '@core/logging';
import type { TrackedProduct } from '@core/types';
import type { RestockNotifier } from '@core/monitor/notifier';

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

export interface TelegramSender {
  sendMessage(chatId: string, text: string): Promise<TelegramSendResult>;
}

export interface TelegramSenderOptions {
  httpPost?: HttpPost;
  apiBase?: string;
  timeoutMs?: number;
  logger?: Logger;
}

/** Build the restock message: the label (or URL) plus the product URL. */
export function buildRestockMessage(product: TrackedProduct): string {
  const name = product.etiqueta?.trim() || product.url;
  return ['🔔 ¡Vuelve a estar disponible!', '', name, product.url].join('\n');
}

/**
 * Telegram Bot API client. The token is supplied by the caller (from an
 * environment variable or secret) and is redacted from any logged error.
 */
export function createTelegramSender(
  token: string,
  options: TelegramSenderOptions = {},
): TelegramSender {
  const httpPost = options.httpPost ?? axiosPost;
  const apiBase = options.apiBase ?? 'https://api.telegram.org';
  const timeoutMs = options.timeoutMs ?? 10_000;
  const logger = options.logger;

  return {
    async sendMessage(chatId, text) {
      try {
        const response = await httpPost(
          `${apiBase}/bot${token}/sendMessage`,
          { chat_id: chatId, text, disable_web_page_preview: false },
          { headers: { 'Content-Type': 'application/json' }, timeout: timeoutMs },
        );
        const data = response.data as { ok?: boolean; description?: string } | undefined;
        if (response.status >= 200 && response.status < 300 && data?.ok !== false) {
          return { ok: true };
        }
        const error = redact(
          `Telegram HTTP ${response.status}${data?.description ? `: ${data.description}` : ''}`,
          [token],
        );
        logger?.error('telegram send failed', { error });
        return { ok: false, error };
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        const error = redact(message, [token]);
        logger?.error('telegram send error', { error });
        return { ok: false, error };
      }
    },
  };
}

/**
 * Adapt a {@link TelegramSender} to the monitoring run's notifier contract.
 * Throws on failure so the run can log it; the run never aborts on it.
 */
export function createTelegramNotifier(sender: TelegramSender): RestockNotifier {
  return {
    async notifyRestock(product) {
      const result = await sender.sendMessage(product.chat_id, buildRestockMessage(product));
      if (!result.ok) {
        throw new Error(result.error ?? 'telegram send failed');
      }
    },
  };
}
