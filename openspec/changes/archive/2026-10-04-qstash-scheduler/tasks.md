# Tasks

## 1. Dependencies and configuration

- [x] 1.1 Add `@upstash/qstash` dependency and verify `npm install` succeeds
- [x] 1.2 Extend `core/config.ts` with cron/QStash env validation (`CRON_SECRET`, QStash signing keys) plus unit tests, and verify `npm test -- core/config.test.ts` passes
- [x] 1.3 Document new env vars in `.env.example` and verify `git diff -- .env.example` shows only the new variables

## 2. Cron trigger endpoint

- [x] 2.1 Implement `POST /api/cron/monitor` reusing `runMonitoringPass` with Upstash store, fetcher, evaluator, and Telegram notifier, and verify `npm run typecheck` passes
- [x] 2.2 Add QStash signature verification with bearer `CRON_SECRET` fallback and zero-side-effect `401/4xx` paths, and verify unauthorized requests evaluate no products in route tests
- [x] 2.3 Set `dynamic = 'force-dynamic'` and route `maxDuration`, return short `{ ok, summary }` without secrets, and verify response body contains counts and no token values in route tests
- [x] 2.4 Cover overlap/retry safety (no duplicate notifications, state stays consistent) and verify concurrent-delivery route tests pass

## 3. Scheduler cutover

- [ ] 3.1 Create the QStash `*/15 * * * *` schedule with retries/DLQ targeting prod `/api/cron/monitor` and verify a manual QStash publish triggers a full pass in Vercel logs
- [x] 3.2 Demote GitHub Actions `schedule` (disable cron, keep `workflow_dispatch` during burn-in) and verify `git diff -- .github/workflows/monitor.yml` shows the intended trigger change
- [x] 3.3 Update README setup/troubleshooting for QStash as primary scheduler and verify documented manual-trigger and schedule-check commands run as written

## 4. Integration verification

- [x] 4.1 Run `npm test`, `npm run typecheck`, and `npm run lint` and verify all pass
- [ ] 4.2 Verify end-to-end in prod: authorized trigger updates `ultima_verificacion`, emits summary logs in Vercel/QStash, and unauthorized trigger returns `401` with no state change
