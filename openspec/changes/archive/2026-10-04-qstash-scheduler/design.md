# Design

## Context

See `proposal.md` for motivation. Current state: `src/worker/index.ts` runs `runMonitoringPass` (`core/monitor/run.ts`) as a CLI in GitHub Actions (`.github/workflows/monitor.yml`, cron `3,18,33,48 * * * *`). Web app runs on Vercel Hobby; state lives in Upstash Redis (`core/storage/upstash.ts`); no `/api/cron/*` route and no `vercel.json` exist; `@upstash/qstash` is not installed. Vercel Hobby Cron is capped at once/day, so an external scheduler must call into Vercel over HTTPS.

## Goals / Non-Goals

**Goals:**
- Same monitoring semantics over HTTP as today's CLI (full pass, at-most-once notification, per-product isolation).
- QStash as primary scheduler with retries, signing, and DLQ; on-demand runs no longer depend on Actions queue.
- Small, reviewable diff that reuses `runMonitoringPass`, store, fetcher, evaluator, and notifier.

**Non-Goals:**
- Changing detection (JSON-LD + button), transition rules, Telegram copy, or product-tracking API.
- Multi-scheduler fan-out, per-product schedules, or timezone-aware per-user digests.
- Moving off Vercel Hobby or Upstash Redis.

## Decisions

- **New `POST /api/cron/monitor` route reusing `runMonitoringPass`.** Alternative: keep CLI and have QStash call GitHub `repository_dispatch` — rejected because it reintroduces the Actions queue we want to escape. The route builds the same deps as `src/worker/index.ts` (Upstash store, `fetchProductHtml`, `evaluateAvailability`, Telegram notifier/sender, redacting logger) and returns `{ ok, summary }`.
- **QStash signature verification as primary auth, bearer `CRON_SECRET` as fallback for manual curl/QStash misconfig.** Alternative: bearer-only — rejected because QStash signing gives per-message authenticity without sharing a long-lived secret in more places. Use `@upstash/qstash` `verifySignature` (Next.js App Router: read raw body for verification) plus constant-time bearer compare mirroring `src/app/api/telegram/webhook/route.ts`.
- **QStash schedule `*/15 * * * *` with bounded retries + DLQ; GitHub `schedule` disabled after cutover, `workflow_dispatch` kept temporarily.** Alternative: delete workflow immediately — rejected to keep a manual fallback during burn-in. Concurrency guard moves from Actions `concurrency: stock-monitor` to endpoint-level overlap safety (spec: no duplicate notifications).
- **Fail-fast config via `core/config.ts` extension (`loadCronConfig`).** Reuses existing env-validation pattern; missing `TELEGRAM_BOT_TOKEN`/Upstash/QStash vars return `500` without side effects.
- **`export const maxDuration` on the route and `dynamic = 'force-dynamic'`.** Follows existing `products`/`webhook` routes; avoids static optimization and gives the pass room within Hobby limits. Long-tail risk (many products x 15s timeout + retry) stays bounded by existing per-product timeouts and sequential evaluation.

## Risks / Trade-offs

- [Risk] Pass exceeds Vercel Hobby execution limits on large catalogs → Mitigation: keep per-product timeout/retry as-is, return summary promptly, measure worst-case in staging; defer parallelization to apply phase if needed.
- [Risk] Secret or signing-key leak/rotation gap → Mitigation: separate `CRON_SECRET` + QStash signing keys from bot/Redis tokens; document rotation; `401` path has zero side effects.
- [Risk] Duplicate deliveries from QStash retries → Mitigation: rely on persisted state transition (at-most-once) and overlap-safe update; spec forbids duplicate notifications.
- [Risk] Deployment Protection blocks scheduler → Mitigation: leave cron route public / add Vercel exception, same caveat as Telegram webhook in README.
- [Trade-off] New external dependency (QStash) vs. pure GitHub — accepted because free tier covers load and vendor already hosts our Redis.

## Migration Plan

1. Ship route + config + dep behind secrets (no schedule change); verify manual authenticated call in preview/prod.
2. Create QStash schedule pointing at prod URL; observe logs, DLQ, and Telegram behavior for 24-48h alongside disabled-or-paused Actions schedule.
3. Disable Actions `schedule` (keep `workflow_dispatch` briefly), update README install/troubleshooting and `.env.example`.
4. Rollback: pause/delete QStash schedule, re-enable Actions `schedule`; no data migration (shared Redis state).

## Open Questions

- Keep `workflow_dispatch` permanently as second manual path, or remove after burn-in? (Default in tasks: keep during transition, decide at review.)
- Exact `maxDuration` value to set within current Hobby allowance at implementation time.
