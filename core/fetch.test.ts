import { describe, expect, it } from 'vitest';
import { createProductFetcher } from '@core/fetch';
import type { HttpGet, HttpRequestOptions } from '@core/http';

const noSleep = async () => undefined;

function recorder(responses: Array<{ status: number; data?: string } | Error>) {
  const requests: Array<{ url: string; options: HttpRequestOptions }> = [];
  let index = 0;
  const httpGet: HttpGet = async (url, options) => {
    requests.push({ url, options });
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    if (next instanceof Error) throw next;
    return { status: next.status, data: next.data ?? '' };
  };
  return { httpGet, requests };
}

const options = { sleep: noSleep, backoffMs: 0, maxRetries: 1 };

describe('createProductFetcher', () => {
  it('returns the HTML on 200 with a single attempt', async () => {
    const { httpGet, requests } = recorder([{ status: 200, data: '<html>ok</html>' }]);
    const fetchHtml = createProductFetcher(httpGet, options);
    const result = await fetchHtml('https://www.lush.com/p/1');
    expect(result).toMatchObject({ ok: true, status: 200, html: '<html>ok</html>', attempts: 1 });
    expect(requests).toHaveLength(1);
  });

  it('sends an identifiable browser-like User-Agent', async () => {
    const { httpGet, requests } = recorder([{ status: 200, data: '' }]);
    const fetchHtml = createProductFetcher(httpGet, options);
    await fetchHtml('https://www.lush.com/p/1');
    const headers = requests[0]!.options.headers;
    expect(headers['User-Agent']).toContain('StockAlert/');
    expect(headers['Accept']).toContain('text/html');
    expect(headers['Accept-Language']).toBeTruthy();
  });

  it('backs off and retries on 403 before failing', async () => {
    const { httpGet, requests } = recorder([{ status: 403 }, { status: 403 }]);
    const fetchHtml = createProductFetcher(httpGet, options);
    const result = await fetchHtml('https://www.lush.com/p/1');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
    expect(result.attempts).toBe(2);
    expect(requests).toHaveLength(2);
  });

  it('retries on 429 and succeeds on the second attempt', async () => {
    const { httpGet } = recorder([{ status: 429 }, { status: 200, data: '<html>ok</html>' }]);
    const fetchHtml = createProductFetcher(httpGet, options);
    const result = await fetchHtml('https://www.lush.com/p/1');
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it('fails without throwing on a timeout', async () => {
    const { httpGet } = recorder([new Error('timeout of 15000ms exceeded')]);
    const fetchHtml = createProductFetcher(httpGet, options);
    const result = await fetchHtml('https://www.lush.com/p/1');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/timeout/i);
    expect(result.attempts).toBe(2);
  });

  it('does not retry a non-retryable status such as 404', async () => {
    const { httpGet, requests } = recorder([{ status: 404 }]);
    const fetchHtml = createProductFetcher(httpGet, options);
    const result = await fetchHtml('https://www.lush.com/p/1');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(requests).toHaveLength(1);
  });
});
