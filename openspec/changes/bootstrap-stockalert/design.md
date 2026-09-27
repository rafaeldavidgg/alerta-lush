# Design

## Context

See `proposal.md` — Why. This is a greenfield repository (only `openspec/` and `.opencode/` exist today), so the design establishes the project's initial architecture and layout.

Constraints that shape the approach:

- **Zero cost.** Only free tiers: Vercel Hobby (Next.js hosting) and GitHub Actions (scheduled worker). No always-on server, no paid managed services.
- **Two runtimes, one shared state.** The web app (Vercel, serverless API routes) writes tracked products; the GitHub Actions job reads and updates them. Neither can see the other's filesystem.
- **TypeScript end to end**, for shared types between the web app, the worker, and the detectors.
- **Public repository**, but tracked URLs and chat_ids are user data and must not be committed.
- **Store HTML is hostile to bots.** Verified during planning: a plain non-browser client receives HTTP `403` from `www.lush.com` even with a browser User-Agent, while a browser-like fetch returns the page. Availability is also exposed statically.

Observed from `https://www.lush.com/es/es/p/silvery-moon-soap` (in stock): a Next.js page whose `<head>` contains an `application/ld+json` `Product` node with `"offers":{"@type":"Offer","availability":"https://schema.org/InStock","price":7.5,"priceCurrency":"EUR"}`. This confirms the JSON-LD strategy as the primary signal and the button text (`Añadir a la cesta` / `No disponible`) as the fallback.

## Goals / Non-Goals

**Goals:**

- One repository containing the Next.js web app, the scheduled worker entry point, and the shared detection/storage/notification modules.
- A detector architecture where a new store is added by configuration, not by editing core monitoring code.
- Correct restock semantics: notify once on `out_of_stock → in_stock`, never spam, never treat `unknown` as available.
- A deploy path that a single maintainer can follow from the README.

**Non-Goals:**

- Multi-user accounts, authentication, or per-user isolation. This is a personal tool; the MVP assumes a single operator. (See Risks for the mitigation.)
- Horizontal scaling, queues, or high throughput. Volumes are tens of products every 15 minutes.
- Supporting every store out of the box. Only Lush is shipped; the framework is the deliverable.
- Real-time (sub-minute) detection. The free scheduler bounds latency to roughly 15–30 minutes.

## Decisions

### D1 — Shared storage: Upstash Redis free tier

Chosen over Vercel KV and an in-repo JSON file.

- **Why Upstash (direct).** Vercel's KV offering is now delivered through marketplace integrations that resolve to Upstash; using Upstash directly avoids coupling to Vercel-specific binding names and lets the GitHub Actions job use the same REST credentials as the web app. The free tier (500k commands/month, 256 MB) is orders of magnitude above the expected load (a handful of reads/writes per 15-minute run). It is serverless/HTTP, so it works from Vercel's edge/serverless functions and from Actions without a persistent connection.
- **Rejected — in-repo JSON file.** Simplest to build and diff, but the repository is public, so all tracked URLs and chat_ids would be world-readable, and the Actions job would have to commit on every run (noisy history, token write permissions, race conditions between the web app and the job). Violates the "tracked data is not publicly exposed" requirement.
- **Rejected — Vercel KV brand.** Same underlying product, but adds a Vercel-specific abstraction and permission model for no benefit given the worker is not a Vercel function.

Data shape in Redis: a hash/set of tracked products keyed by generated id (e.g. `stockalert:products` as a set of ids plus `stockalert:product:<id>` hashes, or a single JSON document). The concrete key layout is an implementation detail recorded in tasks.

### D2 — Single repository, one shared TypeScript core

- A Next.js (App Router) app provides the form, list, and API routes for Vercel.
- The GitHub Actions job runs a small Node entry point (e.g. `node dist/worker.js` or `tsx src/worker/index.ts`) that imports the **same** `core/` modules: detector registry, store config, storage client, Telegram client.
- **Why.** Types and behavior must not drift between the web app and the worker. A shared `core/` package avoids a second copy of the detector logic.
- **Alternative considered.** Two repositories (web + worker) sharing a published npm package — rejected as overkill for a personal project and a slow feedback loop.

### D3 — Pluggable detectors: strategy interface + per-store config with fallback chain

- A `StoreDetector` contract returns `'in_stock' | 'out_of_stock' | 'unknown'` from fetched content.
- Reusable strategies: `jsonLd` (Schema.org `Product.offers.availability`), `htmlSelector` (selector + expected in-stock/out-of-stock text), and an optional `playwright` strategy for JS-rendered stores.
- A store entry declares a domain and an **ordered list** of strategies; the first determined result wins, and `unknown` falls through to the next strategy. This is what makes the Lush "JSON-LD primary, button-text fallback" behavior explicit rather than hard-coded.
- Configuration as **typed TypeScript** (`stores/index.ts` plus one file per store, e.g. `stores/lush.ts`) rather than YAML.
  - **Why TS over YAML.** Types catch a malformed selector or typo'd parameter at build time; no extra YAML dependency; the config is bundled normally by Next.js and imported directly by the worker.
  - **Alternative considered.** `config/stores.yaml` — more approachable for non-programmers, but requires a schema validator anyway and loses compile-time checks. Adding a remote/DB-backed config later remains possible because the registry is consumed through a lookup function, not imported inline everywhere.
- **Store detection** is by registrable domain derived from the product URL host, so all paths of `lush.com` resolve to the Lush entry.

### D4 — Fetching: browser-like client with identifiable UA, bounded timeout, backoff

- Use `axios` (or `fetch`) with a descriptive, identifiable User-Agent that also looks like a real browser enough to avoid trivial bot blocks: the ASCII product name plus a contact URL, in the standard `Name/version (+url)` form, appended to a browser token. The observed `403` from Lush means a naive UA-only client is insufficient; the request should send realistic `Accept`/`Accept-Language`/`Sec-*` headers.
- Bounded timeout (e.g. 10–15 s), at most one request per product per run, bounded retry/backoff on `429`/`403`, and per-product error isolation so one failure never aborts the run.
- `playwright` is an **optional dependency**: it is only needed when a store selects the browser strategy, keeping the default install lean and compatible with a free GitHub Actions runner.

### D5 — Scheduling: GitHub Actions `cron` + `workflow_dispatch`

- A workflow at `.github/workflows/monitor.yml` runs `cron: '*/15 * * * *'` and `workflow_dispatch`.
- **Why.** Free, no external scheduler, and the repository is already public. Timezone is UTC.
- **Caveat.** GitHub scheduled workflows are best-effort: they can be delayed under load and are disabled after 60 days of repository inactivity. Combined with the user's stated 15–30 minute tolerance, an effective cadence of 15–30 minutes is expected. A `concurrency` group prevents overlapping runs; a comment in the workflow documents the inactivity caveat.
- **Alternative considered.** Vercel Cron — also free, but then the worker would live inside the Next.js app and the scheduler would depend on the Vercel plan; Actions keeps the worker separable and log-visible.

### D6 — State machine with `unknown` preserving last determined state

- Persisted `estado_actual` reflects the latest run's result (including `unknown`); transitions are computed against the last **determined** state, so an `unknown` blip does not erase an `out_of_stock` baseline and a later `in_stock` still notifies.
- The first determined observation only sets a baseline (no notification), so adding an already-in-stock product does not fire immediately.
- Notifications use an at-most-once rule: the state update happens as part of processing the transition, so a Telegram failure does not cause a duplicate on the next run.

### D7 — Secrets

- `TELEGRAM_BOT_TOKEN`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` are provided as GitHub Actions secrets and Vercel environment variables. `.env.example` documents the names with empty/placeholder values. No secret is ever read from the repository.

### D8 — Telegram delivery

- Send via `sendMessage` to the product's `chat_id` using `chat_id` + `text` and `disable_web_page_preview` unset so the link is clickable. Message includes label/URL and the URL. Failures are logged and swallowed.

## Risks / Trade-offs

- **Public web form is unauthenticated** → anyone who finds the Vercel URL could register products or attempt to message arbitrary chat_ids. The Telegram bot can only message chats that have started it, which limits abuse. Mitigation for the MVP: document that the Vercel project should be protected (Vercel password protection or an `ALLOWED_INVITE`-style check), and keep the store private. If this becomes a real concern, add a shared-secret check to the API routes.
- **GitHub Actions cron is imprecise and can pause after inactivity** → latency may exceed 15 minutes, and monitoring can stop after ~60 days idle. Mitigation: document it in the README; keep the repo active; manual `workflow_dispatch` covers recovery.
- **Store anti-bot measures (403/429) may block the worker** → availability becomes `unknown`, never a false "in stock". Mitigation: browser-like headers, backoff, and the optional Playwright strategy for stubborn stores.
- **Store markup changes break a detector** → JSON-LD is stable and machine-readable, so the primary Lush path is resilient; the selector fallback is the fragile part. Mitigation: `unknown` is safe, and logs show which strategy resolved.
- **Free-tier limits (Upstash commands, Actions minutes)** → current usage is far below limits; a 15-minute cadence at tens of products is negligible. Public-repo Actions minutes are free.
- **At-most-once notifications** → if Telegram is down exactly when a restock fires, the alert is lost rather than retried. Accepted as the safer default versus spam; the state and logs still record the transition.
- **`playwright` adds a heavy dependency** → kept optional and only loaded by stores that opt into it.

## Migration Plan

Greenfield deployment; no existing data to migrate.

1. Scaffold the repository (Next.js app, `core/`, `stores/`, worker, workflow).
2. Create the Telegram bot via BotFather and capture the token and a chat_id.
3. Create the free Upstash Redis database and capture the REST URL/token.
4. Set GitHub Actions secrets and Vercel environment variables.
5. Deploy the web app to Vercel; register a product.
6. Trigger the workflow manually to validate end-to-end, then rely on the 15-minute cron.

Rollback: the system has no destructive side effects; reverting is disabling the workflow and/or the Vercel deployment. Redis data can be deleted independently.

## Open Questions

- Whether to add a lightweight shared-secret/allowlist to the registration API can be decided during implementation without changing the specs or task breakdown.
