import { axiosGet, browserHeaders, type HttpGet } from '@core/http';

export interface FetchResult {
  ok: boolean;
  status: number;
  html?: string;
  error?: string;
  attempts: number;
}

export interface FetchOptions {
  timeoutMs?: number;
  /** Extra attempts after the first request. */
  maxRetries?: number;
  backoffMs?: number;
  userAgent?: string;
  sleep?: (ms: number) => Promise<void>;
}

const RETRYABLE_STATUSES = new Set([403, 429]);

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a product fetcher around an injectable {@link HttpGet}.
 *
 * Behaviour:
 *  - one request per call, plus bounded retries on `403`/`429`/`5xx`/network errors;
 *  - bounded exponential backoff between attempts;
 *  - a bounded timeout per attempt;
 *  - never throws; failures come back as `{ ok: false }`.
 */
export function createProductFetcher(httpGet: HttpGet, options: FetchOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxRetries = options.maxRetries ?? 1;
  const backoffMs = options.backoffMs ?? 1_000;
  const userAgent = options.userAgent;
  const sleep = options.sleep ?? defaultSleep;

  return async function fetchProductHtml(url: string): Promise<FetchResult> {
    const totalAttempts = maxRetries + 1;
    let lastError = 'request failed';
    let lastStatus = 0;

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      if (attempt > 0) {
        await sleep(backoffMs * 2 ** (attempt - 1));
      }

      try {
        const response = await httpGet(url, {
          headers: browserHeaders(userAgent),
          timeout: timeoutMs,
        });
        lastStatus = response.status;

        if (response.status >= 200 && response.status < 300) {
          return { ok: true, status: response.status, html: response.data, attempts: attempt + 1 };
        }

        lastError = `HTTP ${response.status}`;
        const retryable = RETRYABLE_STATUSES.has(response.status) || response.status >= 500;
        if (!retryable) {
          return { ok: false, status: response.status, error: lastError, attempts: attempt + 1 };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        lastStatus = 0;
      }
    }

    return { ok: false, status: lastStatus, error: lastError, attempts: totalAttempts };
  };
}

/** Production fetcher using axios. */
export const fetchProductHtml = createProductFetcher(axiosGet);
