import type { DetectorStrategyConfig } from '@core/detectors/types';

/** Dominio canónico Lush. */
export const LUSH_DOMAIN = 'lush.com';

/** Nombre visible fijo de la tienda. */
export const LUSH_NAME = 'Lush';

/** Textos fijos del botón Lush. */
export const LUSH_IN_STOCK_TEXT = 'Añadir a la cesta';
export const LUSH_OUT_OF_STOCK_TEXT = 'No disponible';

/** Cadena fija de detección Lush: JSON-LD primero, botón como respaldo. */
export const LUSH_STRATEGIES: DetectorStrategyConfig[] = [
  { type: 'jsonld' },
  {
    type: 'htmlSelector',
    selector: 'button',
    inStockText: LUSH_IN_STOCK_TEXT,
    outOfStockText: LUSH_OUT_OF_STOCK_TEXT,
  },
];

/** True cuando el host es lush.com o un subdominio. */
export function isLushHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/\.$/, '');
  if (!normalized) return false;
  return normalized === LUSH_DOMAIN || normalized.endsWith(`.${LUSH_DOMAIN}`);
}
