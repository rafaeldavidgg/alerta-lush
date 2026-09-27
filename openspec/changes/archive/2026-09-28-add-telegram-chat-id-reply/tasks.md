# Tasks

## 1. Core incoming-message logic

- [x] 1.1 Add `core/telegram-incoming.ts` with a minimal `TelegramUpdate` type, `extractMessage(update)` returning `{ chatId, text } | null` only for a plain `message` with a chat id, and `buildChatIdReply(chatId)` returning Spanish reply text that names the `chat_id` and says to paste it in the form; verify with `npm run typecheck`.
- [x] 1.2 Add `handleTelegramUpdate(update, { sender, logger })` that extracts the message, sends the reply through the injected `TelegramSender`, returns without throwing on send failure, and logs the failure with the token redacted; verify a fake-sender unit test covers message, non-message, and send-failure cases.
- [x] 1.3 Add `loadTelegramWebhookConfig(env)` to `core/config.ts` requiring `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` (no Upstash requirement) and throwing a clear message when either is missing; verify with `core/config.test.ts` cases and `npm test`.
- [x] 1.4 Write `core/telegram-incoming.test.ts` asserting the reply contains the numeric chat id, that non-message updates send nothing, and that a failed send still resolves; verify `npm test` passes.

## 2. Webhook route

- [x] 2.1 Add `src/app/api/telegram/webhook/route.ts` exporting `dynamic = 'force-dynamic'` and a `POST` handler that reads `X-Telegram-Bot-Api-Secret-Token`, compares it timing-safely to `TELEGRAM_WEBHOOK_SECRET`, and returns 401 without sending anything when it does not match; verify with a route test covering a missing/invalid secret.
- [x] 2.2 Wire the valid path: parse the JSON body, call `handleTelegramUpdate` with a sender built from `loadTelegramWebhookConfig()` and the shared logger, and return HTTP 200 for both message and non-message updates; verify with route tests asserting 200 and one `sendMessage` call for a message update.
- [x] 2.3 Return 400 for an unparseable body and verify the handler never throws (the test asserts no unhandled rejection); run `npm test`.
- [x] 2.4 Add a `tests/telegram-webhook.test.ts` route-level test that injects a fake sender (or stubs the Telegram HTTP call) and asserts the endpoint's observable behavior: 401 on bad secret, 200 and a reply containing the chat id on a valid message, 200 with no reply on a non-message update.

## 3. Configuration and documentation

- [x] 3.1 Add `TELEGRAM_WEBHOOK_SECRET` (empty placeholder) to `.env.example` and note that `TELEGRAM_BOT_TOKEN` is now also used by the web app; verify the file still contains no real secret values.
- [x] 3.2 Update `README.md` setup: replace the manual `getUpdates` chat_id step with webhook registration (generate a secret, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` to Vercel, run the documented `setWebhook` call with the production URL, `secret_token`, and `allowed_updates: ["message"]`), keep a `getUpdates` fallback that requires `deleteWebhook`, and document the Vercel Deployment Protection caveat; verify each documented command is copy-pasteable and matches the implemented env var names.
- [x] 3.3 Update `core/README.md` module table and `docs` where relevant to mention the inbound webhook module and route; verify the described behavior matches the code.
- [x] 3.4 Confirm the existing restock-alert path is untouched by running the full suite (`npm test`), `npm run typecheck`, and `npm run lint`.
