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
   `TELEGRAM_BOT_TOKEN`.
4. Send your new bot any message (for example `hi`) so it is allowed to reply
   to you.

### 2. Get your chat_id

1. Send a message to your bot (step 1.4).
2. Open this URL in a browser, replacing `<TOKEN>` with your token:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789,...}` — that number is your `chat_id`.
4. To notify several people/chats, repeat for each one; each tracked product
   stores its own `chat_id`.

### 3. Create the Upstash Redis database

1. Sign in at [upstash.com](https://upstash.com) and create a **Redis**
   database (free tier is plenty).
2. In the database's **REST API** section, copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 4. Configure GitHub Actions secrets

In your repository: **Settings → Secrets and variables → Actions → New
repository secret**. Add:

| Secret | Value |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | your bot token |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

### 5. Deploy the web app on Vercel

1. Import this repository into Vercel (framework: Next.js, defaults are fine).
2. Add the same three variables under **Settings → Environment Variables**
   (for Production and Preview).
3. Deploy.

### 6. Use it

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

- **Secrets** (`TELEGRAM_BOT_TOKEN`, Upstash credentials) live only in GitHub
  secrets and Vercel environment variables. `.env.example` contains empty
  placeholders; real values are never committed.
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
