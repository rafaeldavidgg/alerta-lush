import axios from 'axios';

/** A minimal response shape that keeps the core testable without axios. */
export interface HttpResponse {
  status: number;
  data: string;
}

export interface HttpRequestOptions {
  headers: Record<string, string>;
  timeout: number;
}

export type HttpGet = (url: string, options: HttpRequestOptions) => Promise<HttpResponse>;

export interface HttpPostResponse {
  status: number;
  data: unknown;
}

export type HttpPost = (
  url: string,
  body: unknown,
  options: HttpRequestOptions,
) => Promise<HttpPostResponse>;

/**
 * Identifiable, browser-like User-Agent. The `Name/version (+contact)` part
 * makes the traffic attributable; the browser token avoids trivial bot blocks.
 */
export const DEFAULT_USER_AGENT =
  'StockAlert/0.1 (+https://github.com/stockalert; personal availability monitor) ' +
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export function browserHeaders(userAgent: string = DEFAULT_USER_AGENT): Record<string, string> {
  return {
    'User-Agent': userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'no-cache',
  };
}

/** Default HTTP GET backed by axios. Non-2xx statuses are returned, not thrown. */
export const axiosGet: HttpGet = async (url, { headers, timeout }) => {
  const response = await axios.get<string>(url, {
    headers,
    timeout,
    responseType: 'text',
    maxRedirects: 5,
    validateStatus: () => true,
  });
  return {
    status: response.status,
    data: typeof response.data === 'string' ? response.data : String(response.data),
  };
};

/** Default HTTP POST backed by axios. Non-2xx statuses are returned, not thrown. */
export const axiosPost: HttpPost = async (url, body, { headers, timeout }) => {
  const response = await axios.post(url, body, {
    headers,
    timeout,
    validateStatus: () => true,
  });
  return { status: response.status, data: response.data };
};
