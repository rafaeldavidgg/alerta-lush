import type { DetectionContext, DetectionResult, DetectorStrategy } from '@core/detectors/types';
import { runStrategies } from '@core/detectors/registry';

export interface PlaywrightConfig {
  type: 'playwright';
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  waitForSelector?: string;
  strategies: import('@core/detectors/types').DetectorStrategyConfig[];
}

/**
 * Renders a page with a headless browser, then evaluates the configured inner
 * strategies against the rendered DOM. Used only by stores that opt into it.
 *
 * `playwright-core` is imported lazily so that:
 *  - stores that do not use this strategy never load it, and
 *  - a missing browser (no `npx playwright install`) degrades to `unknown`
 *    instead of throwing.
 */
export const playwrightStrategy: DetectorStrategy<PlaywrightConfig> = {
  type: 'playwright',
  async detect(config, context: DetectionContext): Promise<DetectionResult> {
    let browser: Awaited<ReturnType<import('playwright-core').BrowserType['launch']>> | undefined;
    try {
      const { chromium } = await import('playwright-core');
      browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(context.url, {
        waitUntil: config.waitUntil ?? 'domcontentloaded',
        timeout: 30_000,
      });
      if (config.waitForSelector) {
        await page.waitForSelector(config.waitForSelector, { timeout: 15_000 });
      }
      const html = await page.content();
      const evaluation = await runStrategies(config.strategies, { url: context.url, html });
      return {
        state: evaluation.state,
        reason: evaluation.reason ? `playwright: ${evaluation.reason}` : 'playwright',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { state: 'unknown', reason: `playwright unavailable: ${message}` };
    } finally {
      await browser?.close().catch(() => undefined);
    }
  },
};
