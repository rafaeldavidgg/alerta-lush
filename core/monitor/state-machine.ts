import type { AvailabilityState } from '@core/types';

export interface TransitionResult {
  /** The state to persist as `estado_actual` (this run's observation). */
  estado_actual: AvailabilityState;
  /** The state to persist as `estado_anterior` (last determined state). */
  estado_anterior: AvailabilityState;
  /** Whether a restock notification should be sent. */
  shouldNotify: boolean;
}

/**
 * Restock transition rules.
 *
 * - Only `out_of_stock -> in_stock` notifies.
 * - The first determined observation only sets a baseline.
 * - `unknown` never notifies and preserves the last determined state, so a
 *   transient failure does not erase the baseline.
 */
export function applyStateTransition(
  estadoAnterior: AvailabilityState,
  observed: AvailabilityState,
): TransitionResult {
  const shouldNotify = estadoAnterior === 'out_of_stock' && observed === 'in_stock';
  const nextAnterior = observed === 'unknown' ? estadoAnterior : observed;

  return {
    estado_actual: observed,
    estado_anterior: nextAnterior,
    shouldNotify,
  };
}
