import type {
  AspectAngle,
  AspectInput,
  PatternInput,
  RenderOptions,
  Scene,
} from '../types';
import { clamp, longitudeToPoint } from '../geometry';
import { addCircle, addLine, emptyScene } from '../scene';
import { resolvePalette } from '../palette/default';

export interface StarPolygonOptions extends RenderOptions {
  /** Number of equidistant points around the wheel. Default 12 (zodiac). */
  n?: number;
  /** Planet ring radius as fraction of min(width, height). Default 0.36. */
  ringRadius?: number;
  /** Max orb used to derive strength if AspectInput.strength is missing. */
  maxOrb?: number;
  /** Base chord stroke width at full strength. Default 1.4. */
  chordWidth?: number;
  /** Minimum aggregate strength for an aspect type to be drawn. Default 0.1. */
  minStrength?: number;
  /** Draw the n-point ring as a guideline. Default false. */
  showRing?: boolean;
  /** Include background when true. */
  standalone?: boolean;
}

const DEFAULTS: Required<Omit<StarPolygonOptions, keyof RenderOptions>> = {
  n: 12,
  ringRadius: 0.36,
  maxOrb: 8,
  chordWidth: 1.4,
  minStrength: 0.1,
  showRing: false,
  standalone: false,
};

function deriveStrength(a: AspectInput, maxOrb: number): number {
  if (typeof a.strength === 'number') return clamp(a.strength, 0, 1);
  return clamp(1 - a.orb / maxOrb, 0, 1);
}

/**
 * Convert an aspect angle (in degrees) to the step `k` for an `{n/k}`
 * star polygon. Returns 0 if the angle cannot be cleanly represented
 * on a ring of `n` equidistant points (the polygon would degenerate).
 */
function aspectToStep(angle: number, n: number): number {
  const step = Math.round((angle / 360) * n);
  if (step <= 0 || step >= n) return 0;
  return step;
}

/**
 * Generate a star-polygon mandala: stacked {n/k} chord sets, one set
 * per aspect type present in the input, weighted by the aggregate
 * strength of that aspect type.
 *
 * The pattern is rotationally symmetric — it ignores planet positions
 * and uses only the set of aspect types and their cumulative strength.
 * Use this when you want a "герб дня" picture that summarises the
 * aspectual weather as one mandala.
 */
export function starPolygon(input: PatternInput, options: StarPolygonOptions): Scene {
  const opts = { ...DEFAULTS, ...options };
  const palette = resolvePalette(input.palette);
  const scene = emptyScene(opts.width, opts.height, opts.standalone ? palette.background : null);

  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const R = Math.min(opts.width, opts.height) * opts.ringRadius;
  const rotation = opts.rotation ?? 0;
  const n = opts.n;

  // Aggregate aspect strength by exact angle.
  const totals = new Map<AspectAngle, number>();
  for (const a of input.aspects) {
    const s = deriveStrength(a, opts.maxOrb);
    if (s <= 0) continue;
    totals.set(a.angle, (totals.get(a.angle) ?? 0) + s);
  }

  const maxTotal = Math.max(0, ...totals.values());

  if (opts.showRing) {
    addCircle(scene, cx, cy, R, {
      fill: null, stroke: '#2a3556', strokeWidth: 0.5, opacity: 0.5, dashArray: '2,6',
    });
    // Vertex marks
    for (let i = 0; i < n; i++) {
      const lon = (i / n) * 360;
      const { x, y } = longitudeToPoint(lon, cx, cy, R, rotation);
      addCircle(scene, x, y, 1.5, { fill: '#3a4a6a', stroke: null, opacity: 0.7 });
    }
  }

  let drawnLayers = 0;
  for (const [angle, total] of totals) {
    if (maxTotal === 0) break;
    const norm = total / maxTotal;
    if (norm < opts.minStrength) continue;

    const step = aspectToStep(angle, n);
    if (step === 0) continue;

    const color = palette.aspects[angle as AspectAngle] ?? '#888';
    const strokeWidth = opts.chordWidth * (0.6 + 1.4 * norm);
    const opacity = 0.25 + 0.55 * norm;

    // Emit unique chords of the {n/step} polygon.
    const seen = new Set<string>();
    for (let i = 0; i < n; i++) {
      const j = (i + step) % n;
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const lon1 = (i / n) * 360;
      const lon2 = (j / n) * 360;
      const p1 = longitudeToPoint(lon1, cx, cy, R, rotation);
      const p2 = longitudeToPoint(lon2, cx, cy, R, rotation);
      addLine(scene, p1.x, p1.y, p2.x, p2.y, {
        fill: null, stroke: color, strokeWidth, opacity,
      });
    }
    drawnLayers++;
  }

  scene.meta = {
    pattern: 'star-polygon',
    n,
    drawnLayers,
    aspectTotals: Object.fromEntries(totals),
  };

  return scene;
}
