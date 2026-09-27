import type { AvailabilityState } from '@core/types';

/** Human-readable label for an availability state. */
export function stateLabel(state: AvailabilityState): string {
  switch (state) {
    case 'in_stock':
      return 'Disponible';
    case 'out_of_stock':
      return 'No disponible';
    default:
      return 'Desconocido';
  }
}

/** Format a verification timestamp for display, or a placeholder when never checked. */
export function formatLastCheck(iso: string | null): string {
  if (!iso) return 'Sin comprobar todavía';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return date.toLocaleString('es-ES');
}
