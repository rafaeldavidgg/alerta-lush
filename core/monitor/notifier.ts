import type { TrackedProduct } from '@core/types';

/**
 * Sends restock notifications. Abstracted so the monitoring run can be tested
 * with a fake, and so Telegram remains one implementation among possible ones.
 */
export interface RestockNotifier {
  notifyRestock(product: TrackedProduct): Promise<void>;
}
