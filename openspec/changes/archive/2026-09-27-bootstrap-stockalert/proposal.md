# Proposal

## Why

Shoppers who want a specific product (e.g. a Lush soap) currently have to refresh the store page by hand to know when it is restocked, and often miss the window. StockAlert automates that watch: the user registers a product URL once and receives a Telegram message the moment it transitions from "No disponible" to "Añadir a la cesta". The whole system must run at zero cost on free tiers (Vercel Hobby + GitHub Actions + a free managed store).

## What Changes

- Introduce **StockAlert**, a personal open-source project (new codebase, greenfield).
- Add a **web interface** (Next.js on Vercel) with a form to register a tracked product: product URL, Telegram `chat_id`, and an optional label.
- Add a **scheduled monitoring job** (GitHub Actions `cron` every 15 minutes plus manual `workflow_dispatch`) that checks every tracked product once per run.
- Add a **pluggable, per-store availability detector**: a common `StoreDetector` contract with reusable strategies (JSON-LD/Schema.org `availability`, HTML selector + expected text, optional Playwright for JS-rendered sites) selected by domain via configuration. Ship a working **Lush** configuration (JSON-LD first, button-text fallback).
- Add **Telegram notifications** via the Bot API `sendMessage`, with token supplied only through secrets/environment variables.
- Add **shared persistent storage** accessible from both Vercel and GitHub Actions. Chosen: **Upstash Redis free tier** (documented trade-off in design.md), so tracked URLs and `chat_id`s are not committed to the public repository.
- Add **state-machine and deduplication logic**: only notify on `out_of_stock → in_stock`; keep `unknown` as non-notifiable and retry on the next run.
- Add **operational foundations**: secret management (`.env.example`, GitHub secrets, Vercel env vars), request robustness (403/429 backoff, timeouts, identifiable User-Agent, single request per product per run), minimal logging for Actions runs, and a README documenting BotFather setup, obtaining a `chat_id`, configuring secrets, and deploying.

## Capabilities

### New Capabilities

- `product-tracking`: Web form and API to register, list, and remove tracked products, plus the persisted tracked-product model and the shared store used by both the web app and the monitoring job.
- `availability-detection`: The pluggable per-store detector architecture (`StoreDetector` contract, reusable strategies, domain→strategy configuration) and the built-in Lush store definition.
- `stock-monitoring`: The scheduled monitoring run that reads tracked products, evaluates availability, applies the state transition and deduplication rules, handles `unknown` and HTTP failures, and logs results.
- `telegram-alerts`: Delivery of restock notifications through the Telegram Bot API with securely supplied credentials.

### Modified Capabilities

- None (greenfield project; no existing specs).

## Impact

- **New codebase / repo layout**: Next.js app (frontend + API routes) for Vercel; a Node/TypeScript worker entry point invoked by a GitHub Actions workflow; shared detector and storage packages.
- **External services**: Vercel (hosting), GitHub Actions (scheduler), Upstash Redis (state), Telegram Bot API (delivery). No paid dependencies.
- **Config & secrets**: `TELEGRAM_BOT_TOKEN` and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` as GitHub secrets and Vercel env vars; `.env.example` committed, real values never.
- **Repository**: public on GitHub under a provisional name ("StockAlert").
