# `core/` — shared modules

Everything in `core/` is shared by the Vercel web app (API routes) and the
GitHub Actions worker, so behaviour and types can never drift between them.

| Module | Responsibility |
| --- | --- |
| `types.ts` | `TrackedProduct`, `AvailabilityState` (`in_stock` \| `out_of_stock` \| `unknown`). |
| `url.ts` | Validación de URLs: solo se aceptan URLs de `lush.com`. |
| `validation.ts` | Registration validation shared by the API and the web form. |
| `http.ts` | Minimal `HttpGet`/`HttpPost` abstractions plus axios-backed defaults and browser-like headers. |
| `fetch.ts` | Product fetcher: one request per call, bounded retries/backoff on 403/429/5xx, timeout, never throws. |
| `evaluate.ts` | Evaluates Lush availability with the fixed chain (JSON-LD, then button text). |
| `detectors/` | Detector framework: contract, registry, `jsonld` and `htmlSelector` strategies. |
| `storage/` | `ProductStore` contract, Upstash Redis adapter, in-memory adapter. |
| `telegram.ts` | Telegram Bot API `sendMessage` client, message builder, notifier adapter. |
| `telegram-incoming.ts` | Parses inbound webhook updates and replies with the sender's `chat_id` (used by `/api/telegram/webhook`). |
| `logging.ts` | Minimal logger with secret redaction. |
| `config.ts` | Worker environment validation (fails fast on missing variables). |
| `monitor/` | State machine, notifier contract, and the monitoring run. |

## Redis key layout

| Key | Type | Contents |
| --- | --- | --- |
| `stockalert:products` | Set | Every tracked-product id. |
| `stockalert:product:<id>` | String (JSON) | One `TrackedProduct` document. |

The adapter lives in `core/storage/upstash.ts`.

## State semantics

- `estado_actual` — result of the most recent run (may be `unknown`).
- `estado_anterior` — the last *determined* state, or `unknown` if none yet.
  Transition detection uses it so a transient failure does not erase the
  baseline.

Only `out_of_stock → in_stock` notifies. The first determined observation just
sets a baseline. `unknown` never notifies and never destroys the baseline.
