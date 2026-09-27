import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  launch: vi.fn(),
  goto: vi.fn(),
  content: vi.fn(),
  close: vi.fn(),
}));

vi.mock('playwright-core', () => ({
  chromium: { launch: mocks.launch },
}));

import { playwrightStrategy } from '@core/detectors';

const CONFIG = {
  type: 'playwright' as const,
  strategies: [
    {
      type: 'htmlSelector' as const,
      selector: 'button.add-to-cart',
      inStockText: 'Add to cart',
      outOfStockText: 'Sold out',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.close.mockResolvedValue(undefined);
  mocks.goto.mockResolvedValue(undefined);
  mocks.launch.mockResolvedValue({
    newPage: async () => ({
      goto: mocks.goto,
      content: mocks.content,
      waitForSelector: async () => undefined,
    }),
    close: mocks.close,
  });
});

describe('playwrightStrategy', () => {
  it('evaluates inner strategies against the rendered DOM', async () => {
    mocks.content.mockResolvedValue('<button class="add-to-cart">Add to cart</button>');
    const result = await playwrightStrategy.detect(CONFIG, {
      url: 'https://js-shop.test/p/1',
      html: '<html><body>loading…</body></html>',
    });
    expect(result.state).toBe('in_stock');
    expect(mocks.close).toHaveBeenCalled();
  });

  it('degrades to unknown when the browser cannot launch', async () => {
    mocks.launch.mockRejectedValue(new Error('Executable doesn’t exist'));
    const result = await playwrightStrategy.detect(CONFIG, {
      url: 'https://js-shop.test/p/1',
      html: '',
    });
    expect(result.state).toBe('unknown');
    expect(result.reason).toMatch(/playwright unavailable/i);
  });
});
