import { describe, expect, it } from 'vitest';
import { applyStateTransition } from '@core/monitor/state-machine';
import type { AvailabilityState } from '@core/types';

describe('applyStateTransition', () => {
  it('does not notify on the first determined observation (baseline)', () => {
    const result = applyStateTransition('unknown', 'in_stock');
    expect(result).toEqual({
      estado_actual: 'in_stock',
      estado_anterior: 'in_stock',
      shouldNotify: false,
    });
  });

  it('notifies on out_of_stock -> in_stock', () => {
    const result = applyStateTransition('out_of_stock', 'in_stock');
    expect(result.shouldNotify).toBe(true);
    expect(result.estado_anterior).toBe('in_stock');
  });

  it('does not notify while still in stock', () => {
    expect(applyStateTransition('in_stock', 'in_stock').shouldNotify).toBe(false);
  });

  it('does not notify when it goes out of stock and records the new state', () => {
    const result = applyStateTransition('in_stock', 'out_of_stock');
    expect(result.shouldNotify).toBe(false);
    expect(result).toEqual({
      estado_actual: 'out_of_stock',
      estado_anterior: 'out_of_stock',
      shouldNotify: false,
    });
  });

  it('records unknown without notifying and preserves the last determined state', () => {
    const result = applyStateTransition('out_of_stock', 'unknown');
    expect(result).toEqual({
      estado_actual: 'unknown',
      estado_anterior: 'out_of_stock',
      shouldNotify: false,
    });
  });

  it('notifies when recovering from an unknown blip back to in_stock', () => {
    const afterBlip = applyStateTransition('out_of_stock', 'unknown');
    const recovered = applyStateTransition(afterBlip.estado_anterior, 'in_stock');
    expect(recovered.shouldNotify).toBe(true);
  });

  it('never notifies for any transition involving unknown', () => {
    const states: AvailabilityState[] = ['in_stock', 'out_of_stock', 'unknown'];
    for (const previous of states) {
      for (const observed of states) {
        if (previous === 'unknown' || observed === 'unknown') {
          expect(applyStateTransition(previous, observed).shouldNotify).toBe(false);
        }
      }
    }
  });
});
