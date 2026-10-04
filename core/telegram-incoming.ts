import type { Logger } from '@core/logging';
import type { TelegramSender } from '@core/telegram';

/**
 * Minimal shape of a Telegram Bot API update. Only the fields Alerta Lush reads
 * are typed; everything else is ignored.
 */
export interface TelegramUpdate {
  update_id?: number;
  message?: TelegramMessage;
  [key: string]: unknown;
}

export interface TelegramMessage {
  chat?: { id?: number | string };
  text?: string;
  [key: string]: unknown;
}

export interface ExtractedMessage {
  chatId: string;
  text: string;
}

/**
 * Extract the chat id and text from a plain `message` update. Returns `null`
 * for updates that are not plain messages (edited messages, callback queries,
 * channel posts, …) or that lack a chat id, so callers can acknowledge without
 * replying.
 */
export function extractMessage(update: TelegramUpdate): ExtractedMessage | null {
  const message = update?.message;
  if (!message || typeof message !== 'object') return null;

  const rawChatId = message.chat?.id;
  if (rawChatId === undefined || rawChatId === null) return null;

  const chatId = String(rawChatId).trim();
  if (chatId === '') return null;

  return { chatId, text: typeof message.text === 'string' ? message.text : '' };
}

/** Build the self-contained reply that tells the user which `chat_id` to use. */
export function buildChatIdReply(chatId: string): string {
  return [
    '🆔 Tu chat_id es:',
    '',
    chatId,
    '',
    'Cópialo en el campo «chat_id» del formulario de Alerta Lush para recibir los avisos.',
  ].join('\n');
}

export interface HandleTelegramUpdateOptions {
  sender: TelegramSender;
  logger?: Logger;
}

/**
 * Reply to an incoming message with its chat id, if it is a plain message.
 *
 * Never throws: a delivery failure is logged (the injected logger redacts the
 * token) so the webhook can still acknowledge the update and Telegram stops
 * retrying.
 */
export async function handleTelegramUpdate(
  update: TelegramUpdate,
  { sender, logger }: HandleTelegramUpdateOptions,
): Promise<void> {
  const message = extractMessage(update);
  if (!message) return;

  try {
    const result = await sender.sendMessage(message.chatId, buildChatIdReply(message.chatId));
    if (!result.ok) {
      logger?.error('telegram chat_id reply failed', {
        chatId: message.chatId,
        error: result.error,
      });
    }
  } catch (caught) {
    const error = caught instanceof Error ? caught.message : String(caught);
    logger?.error('telegram chat_id reply error', { chatId: message.chatId, error });
  }
}
