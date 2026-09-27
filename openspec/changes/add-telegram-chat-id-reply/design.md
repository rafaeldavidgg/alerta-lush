# Design

## Context

See `proposal.md` for motivation; see `specs/telegram-chat-id-discovery/spec.md` for the behavioral contract.

Current state that shapes the approach:

- The Telegram integration is **outbound only**: `core/telegram.ts` wraps `sendMessage` via the shared `HttpPost` abstraction (`core/http.ts`), and the GitHub Actions worker (`src/worker/index.ts`) uses it through `createTelegramNotifier`.
- The web app is a Next.js App Router project on Vercel with API route handlers under `src/app/api/` (see `src/app/api/products/route.ts`). Routes call shared logic in `core/`, which is unit-tested with Vitest (aliases `@core/*`, `@/*`).
- Configuration is environment-based. `core/config.ts` only has a worker loader (`loadWorkerConfig`) that requires Upstash credentials; the web app currently reads no Telegram variables.
- The README currently tells users to read their `chat_id` from `getUpdates` manually (step 2).
- `getUpdates` and webhooks are mutually exclusive. The worker only calls `sendMessage`, so it never polls `getUpdates` today — switching the bot to webhook mode is safe.

## Goals / Non-Goals

**Goals:**

- A user who messages the bot receives their `chat_id` in the same chat, on every message.
- Inbound endpoint is authenticated so only Telegram can trigger replies.
- Shared parsing/formatting logic lives in `core/` and is unit-testable without a network.
- Deployment is a small, reversible configuration change (env vars + one `setWebhook` call).

**Non-Goals:**

- No persistence, dedupe of `update_id`, or reply throttling. Replies are stateless and idempotent by content.
- No support for edited messages, callback queries, or other non-message update types (acknowledged and ignored).
- No change to the outbound restock-alert format or the monitoring worker.
- No change to the registration form or the data model.

## Decisions

### 1. Reception via Telegram webhook, not `getUpdates` polling

The user selected Vercel webhook. A webhook gives near-instant replies and needs no polling loop. Alternatively, polling `getUpdates` from the existing scheduled worker would have zero new infrastructure but up to ~15 minutes of latency and would require storing the update offset. Rejected for latency and added state.

### 2. Endpoint location and runtime

Add `src/app/api/telegram/webhook/route.ts`, exporting a `POST` handler and `export const dynamic = 'force-dynamic'`. Use the default Node.js runtime because the design uses `node:crypto` for a timing-safe secret comparison. This mirrors the existing route style (`src/app/api/products/route.ts`).

### 3. Authenticate with Telegram's webhook secret token

Verify the `X-Telegram-Bot-Api-Secret-Token` header against `TELEGRAM_WEBHOOK_SECRET` using `crypto.timingSafeEqual`. Reject mismatches with HTTP 401 and send nothing. This is the mechanism Telegram provides specifically for webhook callers and avoids a custom auth scheme. Note Telegram restricts `secret_token` to `A-Z a-z 0-9 _ -`, 1–256 chars.

### 4. Keep logic in `core/` behind small pure functions

Add `core/telegram-incoming.ts` with:

- a minimal `TelegramUpdate` shape,
- `extractMessage(update)` → `{ chatId, text } | null` (returns non-null only for a plain `message` with a chat id),
- `buildChatIdReply(chatId)` → reply text (Spanish, matching the UI: names the `chat_id` and says to paste it in the form),
- a thin `handleTelegramUpdate(update, { sender, logger })` that extracts, replies, and never throws.

This keeps the route handler a few lines and lets Vitest cover behavior with a fake sender, following the existing `core/telegram.ts` sender-injection pattern.

### 5. Reuse the existing sender; web config is separate from worker config

The route builds a sender with `createTelegramSender(config.telegramBotToken, { logger })` and reuses `redact` from `core/logging.ts` so the token never appears in logs. Add `loadTelegramWebhookConfig(env)` to `core/config.ts` (requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`, does **not** require Upstash), leaving `loadWorkerConfig` untouched. Adding `TELEGRAM_BOT_TOKEN` to the web app's Vercel env is required for replies.

### 6. Register the webhook with a documented one-time call

`setWebhook` is performed once during setup with `url` = the production webhook URL, `secret_token`, and `allowed_updates: ["message"]` to reduce noise. Document the exact `curl`/URL in the README rather than adding a script, keeping the change small. The README's manual `getUpdates` instructions become a fallback that requires `deleteWebhook` first.

## Risks / Trade-offs

- **Vercel Deployment Protection blocks Telegram** → If Password Protection or Vercel Authentication is enabled, Telegram's POSTs get redirected/blocked and no replies arrive. Mitigation: document that the webhook path must be publicly reachable, or disable protection for `/api/telegram/webhook` (bypass rule).
- **Wrong or stale webhook URL** → `setWebhook` must target the production domain; preview URLs change per deployment. Mitigation: document the production URL and provide a `getWebhookInfo` check.
- **Duplicate replies on retry** → If the handler crashes before responding, Telegram may re-deliver and the user could get a second reply. Mitigation: always return 200 after handling; a duplicate reply is harmless and no offset state is introduced.
- **Secret exposure** → The secret is a shared credential. Mitigation: read from env only, never log it, keep it out of `.env.example` values, and use timing-safe comparison.
- **First-run confusion if the webhook is never set** → The bot appears silent. Mitigation: README setup step includes a verify step ("message the bot, expect the reply") and a fallback.

## Migration Plan

1. Merge the route and `core` logic; deploy to Vercel.
2. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` to Vercel (Production and Preview).
3. Generate a secret, then call `setWebhook` with the production URL, `secret_token`, and `allowed_updates: ["message"]`.
4. Verify with `getWebhookInfo` and by messaging the bot.
5. Update the README setup steps.

Rollback: call `deleteWebhook` (or `setWebhook` without the secret) and remove the env vars. Outbound alerts and the worker are unaffected either way.

## Open Questions

None. The reception mechanism and reply frequency were confirmed with the user.
