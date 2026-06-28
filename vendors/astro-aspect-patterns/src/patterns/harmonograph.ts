import type {
  AspectAngle,
  AspectInput,
  PatternInput,
  RenderOptions,
  Scene,
} from '../types';
import { clamp, makeRng } from '../geometry';
import { addPath, addCircle, emptyScene } from '../scene';
import { resolvePalette } from '../palette/default';

export interface HarmonographOptions extends RenderOptions {
  /** Curve max radius as fraction of min(width, height). Default 0.42. */
  radius?: number;
  /** Total drawing time in seconds. Default 28. */
  duration?: number;
  /** Time step per integration step. Default 0.01. */
  dt?: number;
  /** Per-second damping factor (exp(-damping*t)). Default 0.05. */
  damping?: number;
  /** Max orb used to derive strength. Default 8. */
  maxOrb?: number;
  /** Stroke width of the trace path. Default 0.8. */
  strokeWidth?: number;
  /** Path stroke opacity. Default 0.85. */
  opacity?: number;
  /** Phase offset (radians) added by the playback. Default 0. */
  phase?: number;
  /** Include background. */
  standalone?: boolean;
}

const DEFAULTS: Required<Omit<HarmonographOptions, keyof RenderOptions>> = {
  radius: 0.42,
  duration: 28,
  dt: 0.01,
  damping: 0.05,
  maxOrb: 8,
  strokeWidth: 0.8,
  opacity: 0.85,
  phase: 0,
  standalone: false,
};

/**
 * Frequency ratio per aspect angle. The integer pairs are chosen so
 * that the dominant Ptolemaic aspects produce well-known Lissajous
 * shapes (3:4 square, 2:3 trine, 1:2 octave for opposition).
 */
const RATIO_BY_ANGLE: Record<AspectAngle, [number, number]> = {
  0:   [1, 1],
  30:  [11, 12],
  45:  [7, 8],
  60:  [5, 6],
  72:  [4, 5],
  90:  [3, 4],
  120: [2, 3],
  135: [5, 8],
  144: [3, 5],
  150: [11, 13],
  180: [1, 2],
};

function deriveStrength(a: AspectInput, maxOrb: number): number {
  if (typeof a.strength === 'number') return clamp(a.strength, 0, 1);
  return clamp(1 - a.orb / maxOrb, 0, 1);
}

interface Pendulum {
  fx: number;
  fy: number;
  amp: number;
  phx: number;
  phy: number;
}

/**
 * Harmonograph trace: each aspect contributes a pair of orthogonal
 * pendulums whose frequency ratio is taken from `RATIO_BY_ANGLE`. The
 * traces are summed with damping and rendered as a single path.
 *
 * The result is a single closed-ish curve that "sounds like" the chart
 * — frequency ratios are the same as musical intervals.
 */
export function harmonograph(input: PatternInput, options: HarmonographOptions): Scene {
  const opts = { ...DEFAULTS, ...options };
  const palette = resolvePalette(input.palette);
  const scene = emptyScene(opts.width, opts.height, opts.standalone ? palette.background : null);

  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const R = Math.min(opts.width, opts.height) * opts.radius;
  const rng = makeRng(opts.seed ?? 7);

  // Build a pendulum per declared aspect with a known ratio.
  const pendulums: Pendulum[] = [];
  for (const a of input.aspects) {
    const ratio = RATIO_BY_ANGLE[a.angle as AspectAngle];
    if (!ratio) continue;
    const s = deriveStrength(a, opts.maxOrb);
    if (s <= 0) continue;
    // Random phase per pendulum keeps the curve from collapsing into
    // a single straight line when all pendulums start in sync.
    pendulums.push({
      fx: ratio[0] * (0.5 + 0.05 * rng()),
      fy: ratio[1] * (0.5 + 0.05 * rng()),
      amp: s,
      phx: rng() * Math.PI * 2,
      phy: rng() * Math.PI * 2,
    });
  }

  if (pendulums.length === 0) {
    scene.meta = { pattern: 'harmonograph', pendulums: 0 };
    return scene;
  }

  // Pre-compute normalisation factor so the amplitude sum fits in R.
  const ampSum = pendulums.reduce((s, p) => s + p.amp, 0);
  const norm = R / ampSum;

  const steps = Math.max(2, Math.floor(opts.duration / opts.dt));
  // Build a compact SVG path. Use commas as separators to keep size down.
  let d = '';
  let lastEmit = -Infinity;
  const emitEvery = Math.max(1, Math.floor(steps / 4000)); // keep path size sane

  for (let i = 0; i <= steps; i++) {
    const t = i * opts.dt;
    const env = Math.exp(-opts.damping * t);
    let x = 0;
    let y = 0;
    for (const p of pendulums) {
      const omegaX = 2 * Math.PI * p.fx;
      const omegaY = 2 * Math.PI * p.fy;
      x += p.amp * Math.sin(omegaX * t + p.phx + opts.phase);
      y += p.amp * Math.cos(omegaY * t + p.phy + opts.phase);
    }
    x *= norm * env;
    y *= norm * env;
    if (i - lastEmit >= emitEvery || i === steps) {
      const sx = (cx + x).toFixed(2);
      const sy = (cy + y).toFixed(2);
      d += d === '' ? `M${sx} ${sy}` : ` L${sx} ${sy}`;
      lastEmit = i;
    }
  }

  // Colour pick: blend two strongest aspects' colours.
  const sorted = [...input.aspects]
    .filter(a => RATIO_BY_ANGLE[a.angle as AspectAngle])
    .sort((a, b) => deriveStrength(b, opts.maxOrb) - deriveStrength(a, opts.maxOrb));
  const primary = sorted[0]
    ? (palette.aspects[sorted[0].angle as AspectAngle] ?? '#7be3d6')
    : '#7be3d6';

  addPath(scene, d, {
    fill: null,
    stroke: primary,
    strokeWidth: opts.strokeWidth,
    opacity: opts.opacity,
  });

  // Small marker at the curve's start to anchor the eye.
  addCircle(scene, cx, cy, 1.2, { fill: primary, stroke: null, opacity: 0.6 });

  scene.meta = {
    pattern: 'harmonograph',
    pendulums: pendulums.length,
    points: Math.ceil((steps + 1) / emitEvery),
  };

  return scene;
}
