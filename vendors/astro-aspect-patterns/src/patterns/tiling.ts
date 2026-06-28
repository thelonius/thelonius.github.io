import type {
  AspectAngle,
  PatternInput,
  PlanetPosition,
  RenderOptions,
  Scene,
} from '../types';
import { clamp, longitudeToAngleDeg, makeRng, mixHex } from '../geometry';
import { addPolygon, emptyScene } from '../scene';
import { resolvePalette } from '../palette/default';
import { classifyAspects } from '../aspectClassifier';

export type TileShape = 'hex' | 'square' | 'triangle' | 'rhombic';

export interface TilingOptions extends RenderOptions {
  /** Edge length of an individual tile in pixels. Default ~5% of min(w,h). */
  tileSize?: number;
  /**
   * Override the auto-classified tile shape. When omitted, the shape is
   * picked from the dominant aspect (sextile→hex, square→square,
   * trine→triangle, semi/quincunx→rhombic; falls back to hex).
   */
  shape?: TileShape;
  /** Max orb used to derive aspect strength. Default 8. */
  maxOrb?: number;
  /**
   * How strongly tile colors lean on the per-planet palette versus a
   * neutral base. 0 = uniform muted base, 1 = pure planet colors. Default 0.7.
   */
  colorMix?: number;
  /**
   * Radial fade — tiles farther from the canvas center fade toward the
   * background. 0 disables (flat plane), 1 = fully fade at corners. Default 0.4.
   */
  vignette?: number;
  /** Outline stroke width between tiles. Default 0.4. */
  strokeWidth?: number;
  /** Include background. */
  standalone?: boolean;
}

const DEFAULTS: Required<Omit<TilingOptions, keyof RenderOptions | 'shape' | 'tileSize'>> = {
  maxOrb: 8,
  colorMix: 0.7,
  vignette: 0.4,
  strokeWidth: 0.4,
  standalone: false,
};

export function shapeFromAspect(angle: AspectAngle): TileShape {
  switch (angle) {
    case 60: return 'hex';
    case 90: return 'square';
    case 120: return 'triangle';
    case 30:
    case 72:
    case 144:
    case 150:
      return 'rhombic';
    default: return 'hex'; // 0, 45, 135, 180 — fall back to hex
  }
}

interface CellEmit {
  points: [number, number][];
  cx: number;
  cy: number;
}

function emitSquares(w: number, h: number, s: number, out: CellEmit[]): void {
  for (let y = -s; y < h + s; y += s) {
    for (let x = -s; x < w + s; x += s) {
      out.push({
        points: [[x, y], [x + s, y], [x + s, y + s], [x, y + s]],
        cx: x + s / 2,
        cy: y + s / 2,
      });
    }
  }
}

function emitHexes(w: number, h: number, s: number, out: CellEmit[]): void {
  // Pointy-top hex. width = s*sqrt(3), vertical pitch = s*1.5.
  const hw = s * Math.sqrt(3);
  const hh = s * 1.5;
  for (let row = -1; row * hh < h + s; row++) {
    const offsetX = (((row % 2) + 2) % 2) * (hw / 2);
    for (let col = -1; col * hw + offsetX < w + s; col++) {
      const cx = col * hw + offsetX;
      const cy = row * hh;
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3 - Math.PI / 2;
        pts.push([cx + s * Math.cos(ang), cy + s * Math.sin(ang)]);
      }
      out.push({ points: pts, cx, cy });
    }
  }
}

function emitTriangles(w: number, h: number, s: number, out: CellEmit[]): void {
  const tHeight = (s * Math.sqrt(3)) / 2;
  for (let row = -1; row * tHeight < h + s; row++) {
    const rowOffset = (((row % 2) + 2) % 2) * (s / 2);
    for (let col = -1; col * s - rowOffset < w + s; col++) {
      const x0 = col * s - rowOffset;
      const y0 = row * tHeight;
      // Upward triangle
      const up: [number, number][] = [
        [x0, y0 + tHeight],
        [x0 + s, y0 + tHeight],
        [x0 + s / 2, y0],
      ];
      out.push({ points: up, cx: x0 + s / 2, cy: y0 + tHeight * 2 / 3 });
      // Downward triangle (offset by s/2 along x)
      const down: [number, number][] = [
        [x0 + s / 2, y0],
        [x0 + 3 * s / 2, y0],
        [x0 + s, y0 + tHeight],
      ];
      out.push({ points: down, cx: x0 + s, cy: y0 + tHeight / 3 });
    }
  }
}

function emitRhombi(w: number, h: number, s: number, out: CellEmit[]): void {
  // Two rhombi (60° and 120°) interlocking — same vertex set as a triangle grid.
  const tHeight = (s * Math.sqrt(3)) / 2;
  for (let row = -1; row * tHeight < h + s; row++) {
    const rowOffset = (((row % 2) + 2) % 2) * (s / 2);
    for (let col = -2; col * s - rowOffset < w + s; col += 1) {
      const x0 = col * s - rowOffset;
      const y0 = row * tHeight;
      // Thin rhombus (60°) pointing right
      const rhomb: [number, number][] = [
        [x0, y0 + tHeight],
        [x0 + s / 2, y0],
        [x0 + s, y0 + tHeight],
        [x0 + s / 2, y0 + 2 * tHeight],
      ];
      out.push({
        points: rhomb,
        cx: x0 + s / 2,
        cy: y0 + tHeight,
      });
    }
  }
}

/**
 * For a cell center (cx, cy), return the planet whose ecliptic
 * longitude best matches the screen-space direction from the canvas
 * centre to (cx, cy). Used to color tiling cells by "which planet's
 * territory they fall in".
 */
function pickPlanetForCell(
  cellX: number, cellY: number,
  canvasCx: number, canvasCy: number,
  planets: PlanetPosition[],
  rotation: number,
): PlanetPosition | null {
  if (planets.length === 0) return null;
  const dx = cellX - canvasCx;
  const dy = cellY - canvasCy;
  if (dx === 0 && dy === 0) return planets[0];
  // Reverse of longitudeToAngleDeg: angleDeg in screen polar (0 = top, CW).
  // Cell math-angle (atan2 with y-down): atan2(dy, dx) in radians.
  // angleDeg used by polarToCartesian satisfies: math-angle = (angleDeg - 90) * π/180
  // → angleDeg = math-angle * 180/π + 90
  const mathAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const angleDeg = ((mathAngleDeg + 90) % 360 + 360) % 360;
  // Invert longitudeToAngleDeg(L, rot): L = (270 + rot - angleDeg) mod 360
  const longitude = ((270 + rotation - angleDeg) % 360 + 360) % 360;

  let best = planets[0];
  let bestDist = Infinity;
  for (const p of planets) {
    let d = Math.abs(((p.longitude - longitude) % 360 + 360) % 360);
    if (d > 180) d = 360 - d;
    if (d < bestDist) { bestDist = d; best = p; }
  }
  return best;
}

/**
 * Plane-filling tiling driven by the dominant aspect of the chart.
 * Each cell is colored by which planet's ecliptic sector it falls in
 * (screen-space angle from canvas center maps back to a longitude).
 */
export function tiling(input: PatternInput, options: TilingOptions): Scene {
  const opts = { ...DEFAULTS, ...options };
  const palette = resolvePalette(input.palette);
  const scene = emptyScene(opts.width, opts.height, opts.standalone ? palette.background : null);

  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const rotation = opts.rotation ?? 0;

  const classification = classifyAspects(input.aspects, opts.maxOrb);
  const shape: TileShape = opts.shape ?? shapeFromAspect(classification.dominant);
  const tileSize = options.tileSize ?? Math.min(opts.width, opts.height) * 0.05;

  const cells: CellEmit[] = [];
  switch (shape) {
    case 'hex':      emitHexes(opts.width, opts.height, tileSize, cells); break;
    case 'square':   emitSquares(opts.width, opts.height, tileSize, cells); break;
    case 'triangle': emitTriangles(opts.width, opts.height, tileSize, cells); break;
    case 'rhombic':  emitRhombi(opts.width, opts.height, tileSize, cells); break;
  }

  const baseColor = '#1a2247';
  const bgColor = (opts.standalone && palette.background) || '#0a0e27';
  const rng = makeRng(opts.seed ?? 1);
  const maxDist = Math.hypot(opts.width / 2, opts.height / 2);

  for (const cell of cells) {
    const planet = pickPlanetForCell(cell.cx, cell.cy, cx, cy, input.planets, rotation);
    const planetColor = planet ? (palette.planets[planet.id] ?? '#9ca3b8') : '#9ca3b8';

    // Mix planet color with base; add tiny per-cell jitter for texture.
    let color = mixHex(baseColor, planetColor, clamp(opts.colorMix, 0, 1));
    const jitter = (rng() - 0.5) * 0.1;
    if (jitter !== 0) color = mixHex(color, jitter > 0 ? '#ffffff' : '#000000', Math.abs(jitter));

    // Vignette: fade by distance from center.
    let opacity = 1;
    if (opts.vignette > 0) {
      const dist = Math.hypot(cell.cx - cx, cell.cy - cy) / maxDist;
      opacity = clamp(1 - opts.vignette * dist, 0, 1);
    }

    addPolygon(scene, cell.points, {
      fill: color,
      stroke: bgColor,
      strokeWidth: opts.strokeWidth,
      opacity,
    });
  }

  scene.meta = {
    pattern: 'tiling',
    shape,
    dominantAspect: classification.dominant,
    cellCount: cells.length,
    tileSize,
  };

  // Silence noisy var
  void longitudeToAngleDeg;

  return scene;
}
