import { describe, expect, it } from 'vitest';
import {
  buildChatIdReply,
  extractMessage,
  handleTelegramUpdate,
  type TelegramUpdate,
} from '@core/telegram-incoming';
import type { Logger } from '@core/logging';
import type { TelegramSender } from '@core/telegram';

function messageUpdate(chatId: number | string, text = 'hola'): TelegramUpdate {
  return { update_id: 1, message: { chat: { id: chatId }, text } };
}

function recordingSender() {
  const sent: Array<{ chatId: string; text: string }> = [];
  const sender: TelegramSender = {
    async sendMessage(chatId, text) {
      sent.push({ chatId, text });
      return { ok: true };
    },
  };
  return { sender, sent };
}

function fakeLogger(): Logger & { errors: Array<Record<string, unknown> | undefined> } {
  const errors: Array<Record<string, unknown> | undefined> = [];
  return {
    errors,
    info: () => {},
    warn: () => {},
    error: (_message, meta) => {
      errors.push(meta);
    },
  };
}

describe('extractMessage', () => {
  it('returns the stringified chat id and text for a plain message', () => {
    expect(extractMessage(messageUpdate(123456))).toEqual({ chatId: '123456', text: 'hola' });
  });

  it('supports string chat ids and a missing text', () => {
    expect(extractMessage({ message: { chat: { id: '-100123' } } })).toEqual({
      chatId: '-100123',
      text: '',
    });
  });

  it.each([
    ['an update without a message', { update_id: 1, edited_message: {} } as TelegramUpdate],
    ['a message without a chat', { message: {} } as TelegramUpdate],
    ['a message without a chat id', { message: { chat: {} } } as TelegramUpdate],
    ['an empty update', {} as TelegramUpdate],
  ])('returns null for %s', (_label, update) => {
    expect(extractMessage(update)).toBeNull();
  });
});

describe('buildChatIdReply', () => {
  it('names the chat_id and points to the form', () => {
    const text = buildChatIdReply('123456');
    expect(text).toContain('123456');
    expect(text).toContain('chat_id');
    expect(text.toLowerCase()).toContain('formulario');
    expect(text).toContain('Alerta Lush');
  });
});

describe('handleTelegramUpdate', () => {
  it('replies to the sender chat with its chat id', async () => {
    const { sender, sent } = recordingSender();

    await handleTelegramUpdate(messageUpdate(987654), { sender });

    expect(sent).toHaveLength(1);
    expect(sent[0]!.chatId).toBe('987654');
    expect(sent[0]!.text).toContain('987654');
  });

  it('sends nothing for a non-message update', async () => {
    const { sender, sent } = recordingSender();

    await handleTelegramUpdate({ update_id: 7, callback_query: { id: 'x' } }, { sender });

    expect(sent).toHaveLength(0);
  });

  it('resolves and logs when delivery reports an error', async () => {
    const logger = fakeLogger();
    const sender: TelegramSender = {
      async sendMessage() {
        return { ok: false, error: 'chat not found' };
      },
    };

    await expect(handleTelegramUpdate(messageUpdate(1), { sender, logger })).resolves.toBeUndefined();
    expect(logger.errors).toHaveLength(1);
    expect(logger.errors[0]).toMatchObject({ error: 'chat not found' });
  });

  it('resolves and logs when the sender throws', async () => {
    const logger = fakeLogger();
    const sender: TelegramSender = {
      async sendMessage() {
        throw new Error('network down');
      },
    };

    await expect(handleTelegramUpdate(messageUpdate(1), { sender, logger })).resolves.toBeUndefined();
    expect(logger.errors).toHaveLength(1);
    expect(logger.errors[0]).toMatchObject({ error: 'network down' });
  });
});
