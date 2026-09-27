# Proposal

## Why

Today the only way to learn your Telegram `chat_id` is to manually open the `getUpdates` URL in a browser (README step 2) and eyeball a JSON payload. That is error-prone, especially on a phone, and it blocks first-time users at the registration form: the form requires a `chat_id` before anything can be tracked. Letting the bot answer with the `chat_id` as soon as you message it removes that setup friction.

## What Changes

- Add an inbound Telegram webhook endpoint (Next.js route handler on Vercel) that receives bot updates and replies to **every** incoming message with the sender's `chat_id`.
- Authenticate inbound requests with a Telegram webhook secret (`X-Telegram-Bot-Api-Secret-Token`) so arbitrary callers cannot make the bot send messages.
- Keep the reply self-contained: it names the `chat_id` and states it is the value to paste in the StockAlert form.
- Acknowledge updates quickly with HTTP 200 (including updates that are not messages) so Telegram does not retry.
- Provide a documented one-time `setWebhook` step and the environment variables it needs.
- **Non-breaking**: the existing outbound restock alerts and the GitHub Actions worker are unaffected. The worker only calls `sendMessage`; it never calls `getUpdates`, so switching the bot to webhook mode does not conflict with the scheduled job.

## Capabilities

### New Capabilities

- `telegram-chat-id-discovery`: Receiving inbound Telegram messages through a secured webhook and replying with the sender's `chat_id` so the user can copy it into the product registration form.

### Modified Capabilities

<!-- None: existing requirement texts (restock alerts, product tracking) do not change. -->

## Impact

- **New route**: `src/app/api/telegram/webhook/route.ts` — accepts Telegram updates, verifies the secret, replies with the `chat_id`.
- **Core logic**: new reusable, unit-testable module (e.g. `core/telegram-incoming.ts`) for parsing an update, deciding whether it is a message, and building the `chat_id` reply text; extends the existing Telegram client to send the reply.
- **Config**: new `TELEGRAM_WEBHOOK_SECRET` environment variable (Vercel + `.env.example`). `TELEGRAM_BOT_TOKEN` is now also read by the web app (it was previously only used by the worker).
- **Docs**: README setup step 2 is replaced/expanded with webhook registration instructions; the manual `getUpdates` walkthrough becomes a fallback.
- **No new dependencies**; no data-model or Redis key changes.
