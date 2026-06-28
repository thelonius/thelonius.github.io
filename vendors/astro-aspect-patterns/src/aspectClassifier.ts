import type { AspectAngle, AspectInput } from './types';
import { clamp } from './geometry';

export interface AspectTotals {
  /** Sum of strengths per exact aspect angle. */
  byAngle: Map<AspectAngle, number>;
  /** Aspect angle with the highest total. Falls back to 0 when input is empty. */
  dominant: AspectAngle;
  /** Strength sum of the dominant aspect. */
  dominantTotal: number;
}

/**
 * Aggregate aspect strengths by exact angle and pick the dominant one.
 *
 * Strength is taken from `AspectInput.strength` when present, otherwise
 * derived as `clamp(1 - orb/maxOrb, 0, 1)`. When the input has no
 * aspects, `dominant` defaults to 0 (conjunction).
 */
export function classifyAspects(
  aspects: AspectInput[],
  maxOrb = 8,
): AspectTotals {
  const byAngle = new Map<AspectAngle, number>();
  for (const a of aspects) {
    const s = typeof a.strength === 'number'
      ? clamp(a.strength, 0, 1)
      : clamp(1 - a.orb / maxOrb, 0, 1);
    if (s <= 0) continue;
    byAngle.set(a.angle, (byAngle.get(a.angle) ?? 0) + s);
  }

  let dominant: AspectAngle = 0;
  let dominantTotal = -1;
  for (const [angle, total] of byAngle) {
    if (total > dominantTotal) {
      dominantTotal = total;
      dominant = angle;
    }
  }

  return {
    byAngle,
    dominant,
    dominantTotal: Math.max(0, dominantTotal),
  };
}
