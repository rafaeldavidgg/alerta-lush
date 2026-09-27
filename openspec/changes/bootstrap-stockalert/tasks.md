# Tasks

## 1. Project scaffolding and tooling

- [x] 1.1 Initialize the repo as a Next.js (App Router) + TypeScript project, creating `core/`, `stores/`, `src/` and `public/`; verify `npm run build` succeeds and the expected directories exist.
- [x] 1.2 Enable TypeScript `strict` and add lint/format scripts; verify `npx tsc --noEmit` and the lint script both pass on a clean tree.
- [x] 1.3 Add a test runner (Vitest) with a config that resolves `core/` and `stores/`; verify a placeholder smoke test runs green via `npm test`.
- [x] 1.4 Add runtime dependencies (`axios`, `@upstash/redis`, an HTML parser such as `cheerio`) and `playwright` as an optional/dev-only dependency; verify `npm install` and `npm run build` still succeed without installing browsers.

## 2. Shared domain model, config lookup, and storage

- [x] 2.1 Define the `TrackedProduct` types and the `in_stock | out_of_stock | unknown` state union in `core/`; verify the project type-checks and a unit test asserts only allowed state values are accepted.
- [x] 2.2 Implement URL validation and store/domain derivation (`tienda`) from a product URL; verify unit tests cover a valid URL, a malformed URL, a non-http scheme, and a subdomain host.
- [x] 2.3 Implement the store-config registry lookup (domain → store entry) with a function that never throws on an unknown host; verify unit tests cover a configured host, an unknown host, and a deeply nested path.
- [x] 2.4 Implement the shared storage client over Upstash Redis behind a small interface (create/list/get/update/delete), with an in-memory adapter for tests; verify CRUD unit tests pass against the in-memory adapter and the Redis keys/fields follow the documented layout.
- [x] 2.5 Write `core/README.md` describing each shared module and the Redis key layout; verify the documented module list matches the files that exist.

## 3. Pluggable detector framework

- [x] 3.1 Implement the `StoreDetector` contract, a strategy registry, and the ordered fallback chain (first determined result wins); verify unit tests prove a `unknown` primary falls through to a later strategy and a determined primary short-circuits.
- [x] 3.2 Implement the Schema.org JSON-LD strategy; verify unit tests cover `https://schema.org/InStock`, short `InStock`, an out-of-stock value, a malformed JSON-LD block, and no JSON-LD at all.
- [x] 3.3 Implement the HTML selector strategy (selector + expected in-stock/out-of-stock text); verify unit tests cover expected in-stock text, expected out-of-stock text, a matching element with unexpected text, and a missing element.
- [x] 3.4 Add the built-in Lush store configuration (JSON-LD primary, button-text fallback using `Añadir a la cesta` / `No disponible`); verify fixture-based tests reproduce `in_stock` from the captured in-stock page, `out_of_stock` from an out-of-stock fixture, and the fallback path when JSON-LD is absent.
- [x] 3.5 Add the optional Playwright strategy that lazily loads its browser dependency and is selected only by stores that configure it; verify a unit test confirms stores not using it never load Playwright and that a missing browser degrades to `unknown` instead of throwing.
- [x] 3.6 Add a second example store entry (fixture-backed) and document the steps to add a store in `docs/stores.md`; verify the new store is evaluated using only configuration by running its test with no change to `core/` monitoring code.

## 4. Fetching and the monitoring run

- [x] 4.1 Implement the HTTP fetch client with an identifiable User-Agent, browser-like headers, a bounded timeout, and bounded backoff on `403`/`429`; verify unit tests with a mocked HTTP layer cover `200`, `403`, `429`, and a timeout.
- [x] 4.2 Implement the per-product state machine (first-evaluation baseline, restock, still-in-stock, went-out-of-stock, `unknown`, recovery from `unknown`); verify unit tests assert the notification decision for each transition.
- [x] 4.3 Wire the transition result to a notifier interface and enforce at-most-once delivery; verify an integration test with a fake notifier asserts exactly one message per restock and none for repeats.
- [x] 4.4 Implement run orchestration that iterates every tracked product, issues at most one request each, and isolates per-product errors; verify a test where one product throws still processes the remaining products.
- [x] 4.5 Add run logging (per-product outcome plus a run summary) with secret redaction; verify a test asserts the token value never appears in captured logs.
- [x] 4.6 Implement the worker entry point that reads configuration from environment variables and runs a full pass; verify `npm run worker` fails fast with a clear message when a required variable is missing and completes against the in-memory/fake store when set.

## 5. Telegram notification client

- [x] 5.1 Implement the Telegram `sendMessage` client reading the bot token from the environment; verify unit tests with a mocked API cover success and an API error.
- [x] 5.2 Verify message content and targeting: the message includes the label (or URL) and the URL, and is sent to the product's `chat_id`; verify a test with two products using different chat_ids sends each to its own chat.
- [x] 5.3 Verify delivery failures are logged, never crash the run, and never re-notify; verify tests assert the run continues after a Telegram error and no duplicate is sent on the next pass.

## 6. Web interface and API

- [x] 6.1 Build the registration form (URL, chat_id, optional label) with client-side validation feedback; verify a component test submits valid input and surfaces field errors for an invalid URL and empty chat_id.
- [x] 6.2 Implement the API routes for create, list, and delete backed by the storage interface; verify route tests cover a valid create, an invalid URL rejection with no persistence, and a delete that removes the product.
- [x] 6.3 Build the product list view showing label/URL, store, current state, and last verification time, with a delete action; verify a component test renders products and reflects a deletion.
- [x] 6.4 Wire the real Upstash client into the API routes and add a local dev path; verify a local run with placeholder `.env` values registers and lists a product against the configured store.

## 7. GitHub Actions scheduler

- [x] 7.1 Add `.github/workflows/monitor.yml` with `schedule` (`*/15 * * * *`), `workflow_dispatch`, and a `concurrency` group; verify the workflow file passes YAML validation and a manual dispatch starts a run.
- [x] 7.2 Pass the required secrets (`TELEGRAM_BOT_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) into the workflow environment and document the inactivity caveat in a workflow comment; verify the secrets are masked in run logs and absent from the workflow file body.

## 8. Documentation and secret configuration

- [x] 8.1 Add `.env.example` listing every required variable with placeholder values; verify no real secret appears anywhere in the repository and the names match the workflow and the app.
- [x] 8.2 Write the README covering BotFather bot creation, obtaining a chat_id, creating the free Upstash database, setting GitHub secrets and Vercel env vars, and deploying; verify a reader can follow the steps in order with no missing value.
- [x] 8.3 Document the web UI's public-form limitation and the recommended Vercel protection in the README; verify the limitation and mitigation are stated explicitly.

## 9. End-to-end integration verification

- [ ] 9.1 Register a real Lush product through the deployed Vercel app and trigger the workflow manually; verify the run logs show the product evaluated and a state recorded in the shared store.
- [x] 9.2 Run an end-to-end restock scenario against the in-memory store and a test chat; verify a Telegram restock message is received exactly once and a repeat run sends nothing.
- [x] 9.3 Verify the public repository exposes no tracked product data or secrets, and that a `403`/`429`/timeout from a store records `unknown` without a notification.
- [x] 9.4 Run `openspec validate bootstrap-stockalert --strict` and confirm the change validates with no errors.
