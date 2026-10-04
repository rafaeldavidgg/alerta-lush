import type { AvailabilityState } from '@core/types';
import { runStrategies, type DetectorStrategyType } from '@core/detectors';
import { LUSH_DOMAIN, LUSH_STRATEGIES, isLushHost } from '@core/lush-detector';

export interface AvailabilityEvaluation {
  state: AvailabilityState;
  /** Siempre `lush.com` cuando la URL es Lush; ausente en otro caso. */
  store?: string;
  /** The strategy that determined the state, if any. */
  strategy?: DetectorStrategyType;
  reason?: string;
}

function extractHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Evaluate availability exclusively for Lush.
 *
 * Non-Lush URLs yield `unknown` (and therefore no notification).
 * Strategy errors are surfaced as `unknown` rather than thrown.
 */
export async function evaluateAvailability(
  url: string,
  html: string,
): Promise<AvailabilityEvaluation> {
  const host = extractHost(url);
  if (!host || !isLushHost(host)) {
    return { state: 'unknown', reason: `non-Lush URL: ${url}` };
  }

  try {
    const result = await runStrategies(LUSH_STRATEGIES, { url, html });
    return {
      state: result.state,
      store: LUSH_DOMAIN,
      strategy: result.strategy,
      reason: result.reason,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { state: 'unknown', store: LUSH_DOMAIN, reason: `detector error: ${message}` };
  }
}
