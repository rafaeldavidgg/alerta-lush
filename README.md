# StockAlert

Monitor the availability of products on online stores and get a **Telegram
message the moment a product comes back in stock**.

Paste a product URL that is currently unavailable, and StockAlert checks it
every 15 minutes and notifies you when it becomes available (for Lush: when the
`No disponible` button becomes `Añadir a la cesta`).

Everything runs on free tiers: **Vercel Hobby** (web app) + **GitHub Actions**
(scheduler) + **Upstash Redis** (shared storage) + **Telegram Bot API**
(notifications). Total cost: €0.

---

## How it works

```
┌──────────────┐   register    ┌───────────────┐   every 15 min   ┌──────────────┐
│  Next.js app │ ───────────▶  │ Upstash Redis │ ◀─────────────── │ GH Actions   │
│  (Vercel)    │               │ (shared state)│                  │ worker       │
└──────────────┘               └───────────────┘                  └──────┬───────┘
                                                                         │ fetch + detect
                                                                         ▼
                                                                    ┌──────────┐
                                                                    │ Telegram │
                                                                    └──────────┘
```

- The web app writes tracked products to Upstash Redis.
- A GitHub Actions job reads them, checks each product once, and updates the
  stored state.
- Only an `out_of_stock → in_stock` transition sends a Telegram message. The
  first observation just sets a baseline, and `unknown` (network/anti-bot
  failures) never notifies.

The availability detection is **pluggable per store**: see
[`docs/stores.md`](docs/stores.md). Lush ships configured (Schema.org JSON-LD
first, button-text fallback).

---

## Setup

You need: a GitHub account, a Vercel account, an Upstash account, and Telegram.
All free.

### 1. Create the Telegram bot

1. Open Telegram and chat with [@BotFather](https://t.me/BotFather).
2. Send `/newbot`, choose a name and a username ending in `bot`.
3. Copy the **token** (looks like `123456789:AA...`). This is
   `TELEGRAM_BOT_TOKEN`. The web app uses it to reply with your `chat_id`; the
   scheduled worker uses it to send restock alerts.

### 2. Create the Upstash Redis database

1. Sign in at [upstash.com](https://upstash.com) and create a **Redis**
   database (free tier is plenty).
2. In the database's **REST API** section, copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configure GitHub Actions secrets

In your repository: **Settings → Secrets and variables → Actions → New
repository secret**. Add:

| Secret | Value |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | your bot token |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

### 4. Deploy the web app on Vercel

1. Import this repository into Vercel (framework: Next.js, defaults are fine).
2. Add these variables under **Settings → Environment Variables** (for
   Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `TELEGRAM_BOT_TOKEN` | your bot token (used to reply with your `chat_id`) |
   | `TELEGRAM_WEBHOOK_SECRET` | a random string using only `A-Z a-z 0-9 _ -` (1–256 chars) |
   | `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
   | `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

3. Deploy, and note your production domain (for example
   `https://stockalert.vercel.app`).

> **Deployment Protection:** if you enable Vercel Password Protection or Vercel
> Authentication, Telegram's webhook calls are blocked and the bot will not
> reply. Add a protection bypass for `/api/telegram/webhook`, or keep that path
> publicly reachable.

### 5. Register the Telegram webhook (one-time)

Point Telegram at your deployed endpoint. Replace `<TOKEN>` and
`<WEBHOOK_SECRET>` (the same value you set in Vercel) and use your production
domain:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<your-vercel-domain>/api/telegram/webhook",
    "secret_token": "<WEBHOOK_SECRET>",
    "allowed_updates": ["message"]
  }'
```

Confirm it registered with:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

The scheduled worker only calls `sendMessage`, so the webhook does not conflict
with monitoring.

### 6. Get your chat_id

1. Open Telegram and send your bot any message (for example `hi`).
2. The bot replies with your **chat_id** — copy it; you will paste it in the
   form.

A `chat_id` is per chat. To notify several people/chats, repeat this for each
one and register each `chat_id` with its own product.

<details>
<summary>Fallback: read the chat_id manually</summary>

Webhooks and `getUpdates` are mutually exclusive, so remove the webhook first,
send your bot a message, then read the updates:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

Then open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and find
`"chat":{"id":123456789,...}` — that number is your `chat_id`.

</details>

### 7. Use it

1. Open your Vercel URL.
2. Paste a product URL (e.g.
   `https://www.lush.com/es/es/p/silvery-moon-soap`), your `chat_id`, and an
   optional label.
3. Add it. The next scheduled run (within ~15 minutes) records its state; when
   it restocks you get a Telegram message.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values (or use the memory backend)
npm run dev                  # http://localhost:3000
```

For local work without Upstash, run with the in-memory backend:

```bash
# PowerShell
$env:STOCKALERT_STORE_BACKEND = "memory"
$env:TELEGRAM_BOT_TOKEN = "dummy"
npm run worker
```

> The in-memory backend does not persist across serverless requests; it is only
> for local development and tests.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server. |
| `npm run build` | Production build. |
| `npm test` | Run the test suite (Vitest). |
| `npm run typecheck` | TypeScript type-check. |
| `npm run lint` | ESLint. |
| `npm run worker` | Run one monitoring pass (used by GitHub Actions). |

---

## Security and privacy

- **Secrets** (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, Upstash
  credentials) live only in GitHub secrets and Vercel environment variables.
  `.env.example` contains empty placeholders; real values are never committed.
- **Webhook authentication:** the Telegram webhook only acts on requests that
  carry the configured `TELEGRAM_WEBHOOK_SECRET`, so third parties cannot make
  the bot send messages through it.
- **Tracked data** (product URLs and `chat_id`s) lives in an Upstash Redis
  database, **not** in the repository, so a public repository does not expose
  who is watching what.
- **Public form limitation:** the web form is not authenticated. Anyone who
  finds your Vercel URL could register products (the bot can only message chats
  that have started it, which limits abuse). For a personal deployment, enable
  **Vercel Password Protection**, or keep the deployment URL private. If you
  want a hard guarantee, add a shared secret to the API routes.

## Robustness notes

- An identifiable, browser-like `User-Agent` is sent, with one request per
  product per run (plus bounded retries on `403`/`429`/`5xx`).
- `403`/`429`/timeouts record `unknown` and never a false "in stock".
- Notifications are **at-most-once**: a Telegram failure is logged and not
  retried, so you never get duplicate spam.
- GitHub schedule caveat: cron is best-effort and pauses after ~60 days of
  repository inactivity (see the comment in
  `.github/workflows/monitor.yml`).

## License

MIT
