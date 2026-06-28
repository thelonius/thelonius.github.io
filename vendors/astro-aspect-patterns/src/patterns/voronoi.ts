import type {
  PatternInput,
  PlanetPosition,
  RenderOptions,
  Scene,
} from '../types';
import { clamp, longitudeToPoint, makeRng, mixHex } from '../geometry';
import { addPolygon, emptyScene } from '../scene';
import { resolvePalette } from '../palette/default';

export interface VoronoiOptions extends RenderOptions {
  /** Planet seed ring radius as fraction of min(w,h). Default 0.32. */
  ringRadius?: number;
  /** Padding around the canvas edge for the seed bounds in pixels. Default 0. */
  padding?: number;
  /** Maximum orb used to derive weights when AspectInput.strength is missing. */
  maxOrb?: number;
  /**
   * Mix between planet color and a neutral base for each cell.
   * 0 = neutral, 1 = full planet color. Default 0.7.
   */
  colorMix?: number;
  /** Radial fade for cells far from center, 0..1. Default 0.35. */
  vignette?: number;
  /** Outline stroke width between cells. Default 0.6. */
  strokeWidth?: number;
  /** Include background. */
  standalone?: boolean;
}

const DEFAULTS: Required<Omit<VoronoiOptions, keyof RenderOptions>> = {
  ringRadius: 0.32,
  padding: 0,
  maxOrb: 8,
  colorMix: 0.7,
  vignette: 0.35,
  strokeWidth: 0.6,
  standalone: false,
};

type Point = [number, number];

/**
 * Sutherland-Hodgman clip of a convex polygon by a single half-plane.
 * Keeps the side where `nx*x + ny*y <= c` (i.e. the "inside" of the
 * half-plane defined by normal (nx, ny) and offset c).
 */
function clipPolygonByHalfPlane(
  poly: Point[],
  nx: number, ny: number, c: number,
): Point[] {
  if (poly.length === 0) return poly;
  const out: Point[] = [];
  const inside = (p: Point) => nx * p[0] + ny * p[1] <= c + 1e-9;
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const curIn = inside(cur);
    const prevIn = inside(prev);
    if (curIn) {
      if (!prevIn) {
        // Intersect prev-cur with the half-plane boundary
        const t = (c - (nx * prev[0] + ny * prev[1])) /
                  (nx * (cur[0] - prev[0]) + ny * (cur[1] - prev[1]));
        out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
      }
      out.push(cur);
    } else if (prevIn) {
      const t = (c - (nx * prev[0] + ny * prev[1])) /
                (nx * (cur[0] - prev[0]) + ny * (cur[1] - prev[1]));
      out.push([prev[0] + t * (cur[0] - prev[0]), prev[1] + t * (cur[1] - prev[1])]);
    }
  }
  return out;
}

/**
 * Compute the Voronoi cell for `seed[k]` against all other seeds,
 * clipped to the canvas rectangle. O(N) per seed, O(N²) total — fine
 * for the ~10-15 points we expect.
 */
function voronoiCell(
  seeds: Point[],
  k: number,
  w: number, h: number,
  pad: number,
): Point[] {
  let cell: Point[] = [
    [pad, pad],
    [w - pad, pad],
    [w - pad, h - pad],
    [pad, h - pad],
  ];
  const [px, py] = seeds[k];
  for (let j = 0; j < seeds.length; j++) {
    if (j === k) continue;
    const [qx, qy] = seeds[j];
    // Half-plane: closer to P than to Q.
    // |X - P|² <= |X - Q|² → 2(Q-P)·X <= |Q|² - |P|²
    const nx = 2 * (qx - px);
    const ny = 2 * (qy - py);
    const c = qx * qx + qy * qy - px * px - py * py;
    cell = clipPolygonByHalfPlane(cell, nx, ny, c);
    if (cell.length === 0) return cell;
  }
  return cell;
}

interface SeededPlanet {
  planet: PlanetPosition;
  point: Point;
  weight: number;
}

/**
 * Aggregate aspect strengths per planet id and turn them into 0..1 weights.
 */
function planetWeights(input: PatternInput, maxOrb: number): Map<string, number> {
  const totals = new Map<string, number>();
  for (const a of input.aspects) {
    const s = typeof a.strength === 'number'
      ? clamp(a.strength, 0, 1)
      : clamp(1 - a.orb / maxOrb, 0, 1);
    totals.set(a.from, (totals.get(a.from) ?? 0) + s);
    totals.set(a.to,   (totals.get(a.to)   ?? 0) + s);
  }
  let max = 0;
  totals.forEach(v => { if (v > max) max = v; });
  const out = new Map<string, number>();
  totals.forEach((v, k) => out.set(k, max > 0 ? v / max : 0));
  return out;
}

/**
 * Voronoi tessellation: each planet seeds one cell on the canvas.
 * Cells are bounded by the canvas rectangle and the perpendicular
 * bisectors between every pair of seeds.
 */
export function voronoi(input: PatternInput, options: VoronoiOptions): Scene {
  const opts = { ...DEFAULTS, ...options };
  const palette = resolvePalette(input.palette);
  const scene = emptyScene(opts.width, opts.height, opts.standalone ? palette.background : null);

  if (input.planets.length === 0) {
    scene.meta = { pattern: 'voronoi', cells: 0 };
    return scene;
  }

  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const R = Math.min(opts.width, opts.height) * opts.ringRadius;
  const rotation = opts.rotation ?? 0;
  const weights = planetWeights(input, opts.maxOrb);

  const seeds: SeededPlanet[] = input.planets.map(p => {
    const { x, y } = longitudeToPoint(p.longitude, cx, cy, R, rotation);
    return {
      planet: p,
      point: [x, y],
      weight: weights.get(p.id) ?? 0,
    };
  });

  const seedPoints: Point[] = seeds.map(s => s.point);
  const maxDist = Math.hypot(opts.width / 2, opts.height / 2);
  const rng = makeRng(opts.seed ?? 11);
  const baseColor = '#1a2247';
  const bgColor = (opts.standalone && palette.background) || '#0a0e27';

  let cellCount = 0;
  for (let i = 0; i < seeds.length; i++) {
    const cell = voronoiCell(seedPoints, i, opts.width, opts.height, opts.padding);
    if (cell.length < 3) continue;

    const planetColor = palette.planets[seeds[i].planet.id] ?? '#9ca3b8';
    const weight = seeds[i].weight;
    // Stronger weight → more saturated, less blended with base.
    const mix = clamp(opts.colorMix * (0.5 + 0.5 * weight), 0, 1);
    let color = mixHex(baseColor, planetColor, mix);
    // Tiny per-cell jitter so identical weights still read as distinct.
    const jitter = (rng() - 0.5) * 0.08;
    color = mixHex(color, jitter > 0 ? '#ffffff' : '#000000', Math.abs(jitter));

    let opacity = 1;
    if (opts.vignette > 0) {
      const cellCx = cell.reduce((s, p) => s + p[0], 0) / cell.length;
      const cellCy = cell.reduce((s, p) => s + p[1], 0) / cell.length;
      const dist = Math.hypot(cellCx - cx, cellCy - cy) / maxDist;
      opacity = clamp(1 - opts.vignette * dist, 0, 1);
    }

    addPolygon(scene, cell, {
      fill: color,
      stroke: bgColor,
      strokeWidth: opts.strokeWidth,
      opacity,
    });
    cellCount++;
  }

  scene.meta = {
    pattern: 'voronoi',
    cells: cellCount,
    seeds: seeds.length,
  };

  return scene;
}
