# Proposal

## Why

GitHub Actions `schedule` is best-effort: runs arrive late, get dropped under load, and pause after ~60 days of repo inactivity. Manual `workflow_dispatch` goes through the same queue, so on-demand runs "work when they want". Monitoring needs a reliable free scheduler with retries. QStash fits because the project already uses Upstash Redis and its free tier (1.000 msg/day) covers ~96 runs/day with retries, signing, and DLQ.

## What Changes

- Add an authenticated HTTP endpoint (e.g. `POST /api/cron/monitor`) that executes the same monitoring pass as `npm run worker` (`runMonitoringPass` + Upstash store + Telegram notifier).
- Create and document a QStash schedule (`*/15 * * * *`-equivalent) targeting that endpoint, with retries/backoff and signature verification.
- Add QStash credentials and signing keys to Vercel env and document setup; keep Telegram/Upstash secrets unchanged.
- Keep the GitHub Actions workflow as manual fallback during transition, then disable its `schedule` trigger (retain or remove `workflow_dispatch` explicitly).
- Update setup/runbook docs (README install + troubleshooting) for QStash instead of Actions as primary scheduler.

## Capabilities

### New Capabilities

- `cron-trigger`: authenticated HTTP trigger that runs a monitoring pass on demand from an external scheduler and returns a short machine-readable summary.

### Modified Capabilities

- `stock-monitoring`: scheduler source changes from GitHub Actions best-effort cron to QStash schedule; manual triggering and run-log location change accordingly. Detection, transition, dedup, and per-product robustness rules are unchanged.

## Impact

- Affected code: `src/worker/index.ts` (reuse logic), new `src/app/api/cron/monitor/route.ts`, `core/config.ts` (new env validation), `next.config.mjs`/`vercel.json` (`maxDuration`), new `@upstash/qstash` dependency.
- Systems: Vercel Hobby (new function invocation every 15 min), Upstash (Redis + QStash schedules), Telegram unchanged, GitHub Actions demoted to fallback.
- Ops: new QStash schedule + secrets (`QSTASH_TOKEN`, signing keys, `CRON_SECRET`); Vercel Deployment Protection must leave the cron route public.
