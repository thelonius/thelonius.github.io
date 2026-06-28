import type {
  AspectAngle,
  AspectInput,
  PatternInput,
  RenderOptions,
  Scene,
} from '../types';
import { clamp, longitudeToPoint } from '../geometry';
import { addCircle, addPolygon, emptyScene } from '../scene';
import { resolvePalette } from '../palette/default';

export interface FlowerOfLifeOptions extends RenderOptions {
  /** Wheel radius as fraction of min(width, height). Default 0.18. */
  ringRadius?: number;
  /**
   * Circle radius (per-planet) as multiple of the wheel radius. Default 1.
   * With circleRadius=1 (and ringRadius=0.18), two planets 60° apart on
   * the wheel have circles that meet at a vesica piscis — d_center = r.
   */
  circleRadius?: number;
  /** Max orb used to derive strength. Default 8. */
  maxOrb?: number;
  /** Outline stroke width of each planet circle. Default 0.8. */
  strokeWidth?: number;
  /** Opacity of each planet's circle outline. Default 0.5. */
  outlineOpacity?: number;
  /** Opacity multiplier for filled aspect lenses. Default 0.55. */
  lensOpacity?: number;
  /** Polygon samples per arc when building lens polygons. Default 32. */
  lensSamples?: number;
  /** Include background when true. */
  standalone?: boolean;
}

const DEFAULTS: Required<Omit<FlowerOfLifeOptions, keyof RenderOptions>> = {
  ringRadius: 0.18,
  circleRadius: 1.0,
  maxOrb: 8,
  strokeWidth: 0.8,
  outlineOpacity: 0.45,
  lensOpacity: 0.55,
  lensSamples: 32,
  standalone: false,
};

function deriveStrength(a: AspectInput, maxOrb: number): number {
  if (typeof a.strength === 'number') return clamp(a.strength, 0, 1);
  return clamp(1 - a.orb / maxOrb, 0, 1);
}

/**
 * Build a polygonal approximation of the intersection lens (vesica) of
 * two circles with identical radius `r`, centered at A and B. Returns
 * an empty array when the circles don't overlap or coincide.
 *
 * Both renderers (SVG and Canvas) support filled polygons, so the lens
 * works across targets without arc-aware path parsing.
 */
function lensPolygon(
  ax: number, ay: number,
  bx: number, by: number,
  r: number,
  samples: number,
): [number, number][] {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy);
  if (d <= 1e-9 || d >= 2 * r) return [];

  const aToB = Math.atan2(dy, dx);
  const alpha = Math.acos(d / (2 * r));

  const pts: [number, number][] = [];

  // Arc on circle A from a1 to a2 (sweeping through aToB — toward B).
  for (let i = 0; i <= samples; i++) {
    const t = aToB - alpha + (2 * alpha) * (i / samples);
    pts.push([ax + r * Math.cos(t), ay + r * Math.sin(t)]);
  }
  // Arc on circle B from b1 to b2 (sweeping through bToA — toward A).
  for (let i = 0; i <= samples; i++) {
    const t = (aToB + Math.PI) - alpha + (2 * alpha) * (i / samples);
    pts.push([bx + r * Math.cos(t), by + r * Math.sin(t)]);
  }

  return pts;
}

/**
 * Generate a "flower of life"-style pattern: each planet seeds a circle
 * at its position on the wheel. All circles share the same radius, and
 * the geometry of pairwise overlaps naturally encodes the angular
 * distance between planets:
 *
 *   - 0°   (conjunction): coincident circles
 *   - 60°  (sextile):     vesica piscis (d_center = r)
 *   - 90°  (square):      partial lens
 *   - 120° (trine):       small lens
 *   - 180° (opposition):  tangent, no overlap
 *
 * For each declared aspect, the corresponding lens is filled with the
 * aspect's color (opacity scaled by strength), so the canonical
 * vesica/triquetra forms light up where they belong.
 */
export function flowerOfLife(input: PatternInput, options: FlowerOfLifeOptions): Scene {
  const opts = { ...DEFAULTS, ...options };
  const palette = resolvePalette(input.palette);
  const scene = emptyScene(opts.width, opts.height, opts.standalone ? palette.background : null);

  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const wheelR = Math.min(opts.width, opts.height) * opts.ringRadius;
  const circleR = wheelR * opts.circleRadius;
  const rotation = opts.rotation ?? 0;

  // Resolve planet centers.
  const centers = new Map<string, { x: number; y: number }>();
  for (const p of input.planets) {
    const pt = longitudeToPoint(p.longitude, cx, cy, wheelR, rotation);
    centers.set(p.id, pt);
  }

  // Step 1: fill aspect lenses (below outlines).
  let lensCount = 0;
  for (const a of input.aspects) {
    const from = centers.get(a.from);
    const to = centers.get(a.to);
    if (!from || !to) continue;
    const strength = deriveStrength(a, opts.maxOrb);
    if (strength <= 0) continue;

    const lens = lensPolygon(from.x, from.y, to.x, to.y, circleR, opts.lensSamples);
    if (lens.length === 0) continue;

    const color = palette.aspects[a.angle as AspectAngle] ?? '#888';
    addPolygon(scene, lens, {
      fill: color,
      stroke: null,
      opacity: opts.lensOpacity * strength,
      blend: 'screen',
    });
    lensCount++;
  }

  // Step 2: draw each planet's outline circle on top.
  for (const p of input.planets) {
    const pt = centers.get(p.id);
    if (!pt) continue;
    const color = palette.planets[p.id] ?? '#cfd6e8';
    addCircle(scene, pt.x, pt.y, circleR, {
      fill: null,
      stroke: color,
      strokeWidth: opts.strokeWidth,
      opacity: opts.outlineOpacity,
    });
  }

  scene.meta = {
    pattern: 'flower-of-life',
    circleR,
    wheelR,
    lensCount,
  };

  return scene;
}
