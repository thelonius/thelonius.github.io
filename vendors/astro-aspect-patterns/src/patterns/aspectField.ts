import type {
  AspectAngle,
  AspectInput,
  PatternInput,
  PlanetPosition,
  RenderOptions,
  Scene,
} from '../types';
import { clamp, intersectSegments, longitudeToPoint, mixHex } from '../geometry';
import { addCircle, addLine, emptyScene } from '../scene';
import { resolvePalette } from '../palette/default';

export interface AspectFieldOptions extends RenderOptions {
  /** Planet ring radius as fraction of min(width, height). Default 0.32. */
  ringRadius?: number;
  /**
   * Max orb in degrees used to derive strength when AspectInput.strength
   * is missing. With the default of 8°, an aspect exactly on its angle
   * gets strength=1 and an aspect off by 8° gets strength=0.
   */
  maxOrb?: number;
  /** Base chord stroke width in pixels at strength=1. Default 1.6. */
  chordWidth?: number;
  /** Multiplier for halo glow at chord intersections. 0 disables glows. Default 0.18. */
  haloOpacity?: number;
  /**
   * Base halo radius as fraction of ring radius. Default 0.05.
   *
   * Per-halo radius is derived from this base plus the orbs of the two
   * aspects that produced the intersection: looser orbs give wider, softer
   * glows; tight orbs give smaller, more concentrated droplets.
   */
  haloRadius?: number;
  /**
   * When true, draws a small filled marker at every planet's position.
   * Marker radius scales with `PlanetPosition.dignity` (0..1). Default false.
   */
  nodeMarkers?: boolean;
  /** Base node marker radius in pixels. Default 2.5. */
  nodeRadius?: number;
  /**
   * When true, the scene includes its own background rectangle and the
   * outer ring circle. Default false — assume the consumer draws those
   * itself and the field is overlaid.
   */
  standalone?: boolean;
  /**
   * Animation clock in seconds. When provided alongside `pulsation` or
   * `nodeBreathing`, halos pulse and nodes "breathe" sinusoidally.
   * Default undefined (static scene).
   */
  time?: number;
  /** Halo pulsation amplitude (0..1). 0 disables pulsation. Default 0. */
  pulsation?: number;
  /**
   * Halo pulsation base frequency in Hz. Each halo's effective frequency
   * is `pulsationFreq * (1 + speedNorm)` where speedNorm derives from
   * the participating planets' speeds. Default 0.15 Hz (~7s period).
   */
  pulsationFreq?: number;
  /** Node breathing amplitude in pixels. 0 disables breathing. Default 0. */
  nodeBreathing?: number;
}

const DEFAULTS: Required<Omit<AspectFieldOptions, keyof RenderOptions | 'time'>> = {
  ringRadius: 0.32,
  maxOrb: 8,
  chordWidth: 1.6,
  haloOpacity: 0.18,
  haloRadius: 0.05,
  nodeMarkers: false,
  nodeRadius: 2.5,
  standalone: false,
  pulsation: 0,
  pulsationFreq: 0.15,
  nodeBreathing: 0,
};

interface PlacedAspect {
  aspect: AspectInput;
  ax: number; ay: number;
  bx: number; by: number;
  color: string;
  strength: number;
  /** Normalised orb (0 = exact, 1 = at maxOrb). */
  orbNorm: number;
  fromPlanet?: PlanetPosition;
  toPlanet?: PlanetPosition;
}

function deriveStrength(a: AspectInput, maxOrb: number): number {
  if (typeof a.strength === 'number') return clamp(a.strength, 0, 1);
  return clamp(1 - a.orb / maxOrb, 0, 1);
}

/**
 * Pseudo-random phase derived from a planet id. Stable across renders
 * so the same planet always pulses at the same phase.
 */
function phaseFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000 * Math.PI * 2;
}

export function aspectField(input: PatternInput, options: AspectFieldOptions): Scene {
  const opts = { ...DEFAULTS, ...options };
  const palette = resolvePalette(input.palette);
  const scene = emptyScene(
    opts.width,
    opts.height,
    opts.standalone ? palette.background : null,
  );

  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const R = Math.min(opts.width, opts.height) * opts.ringRadius;
  const rotation = opts.rotation ?? 0;
  const t = options.time ?? 0;

  // Index planets by id and compute their (possibly breathing) screen positions.
  const planetById = new Map<string, { x: number; y: number; planet: PlanetPosition }>();
  for (const p of input.planets) {
    let { x, y } = longitudeToPoint(p.longitude, cx, cy, R, rotation);
    if (opts.nodeBreathing > 0 && t !== 0) {
      const phase = phaseFromId(p.id);
      // Each planet breathes radially with amplitude `nodeBreathing` and a
      // frequency proportional to |speed| (deg/day). Phase is per-planet.
      const f = 0.1 + Math.min(1, Math.abs(p.speed ?? 1) / 13) * 0.4;
      const breathe = opts.nodeBreathing * Math.sin(2 * Math.PI * f * t + phase);
      // Project outward along the radial direction.
      const dx = x - cx;
      const dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      x += (dx / len) * breathe;
      y += (dy / len) * breathe;
    }
    planetById.set(p.id, { x, y, planet: p });
  }

  if (opts.standalone) {
    addCircle(scene, cx, cy, R, {
      fill: null,
      stroke: '#1a2235',
      strokeWidth: 0.5,
      opacity: 0.5,
      dashArray: '2,6',
    });
  }

  // Place aspects: resolve endpoints, color, strength, normalised orb.
  const placed: PlacedAspect[] = [];
  for (const a of input.aspects) {
    const from = planetById.get(a.from);
    const to = planetById.get(a.to);
    if (!from || !to) continue;
    const color = palette.aspects[a.angle as AspectAngle] ?? '#888888';
    const strength = deriveStrength(a, opts.maxOrb);
    if (strength <= 0) continue;
    const orbNorm = clamp(a.orb / opts.maxOrb, 0, 1);
    placed.push({
      aspect: a,
      ax: from.x, ay: from.y,
      bx: to.x,  by: to.y,
      color, strength, orbNorm,
      fromPlanet: from.planet,
      toPlanet: to.planet,
    });
  }

  // Draw chords. Width and opacity scale with aspect strength.
  for (const p of placed) {
    addLine(scene, p.ax, p.ay, p.bx, p.by, {
      fill: null,
      stroke: p.color,
      strokeWidth: opts.chordWidth * (0.4 + 0.6 * p.strength),
      opacity: 0.25 + 0.55 * p.strength,
    });
  }

  // Halo glows at chord intersections, with per-pair sizing from orb and
  // optional time-modulated pulsation.
  if (opts.haloOpacity > 0 && placed.length > 1) {
    const baseHaloR = opts.haloRadius * R;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        if (
          a.aspect.from === b.aspect.from || a.aspect.from === b.aspect.to ||
          a.aspect.to   === b.aspect.from || a.aspect.to   === b.aspect.to
        ) continue;
        const hit = intersectSegments(
          a.ax, a.ay, a.bx, a.by,
          b.ax, b.ay, b.bx, b.by,
        );
        if (!hit) continue;

        // Combined orb: loose → wider, softer; tight → smaller, denser.
        const orbCombined = (a.orbNorm + b.orbNorm) / 2; // 0..1
        // Tight (orb~0) → 0.45×base; loose (orb~1) → 1.6×base.
        let radius = baseHaloR * (0.45 + 1.15 * orbCombined);
        let opacity = opts.haloOpacity * (1.0 - 0.4 * orbCombined);

        // Pulsation: per-intersection frequency derives from the speed of
        // the four planets involved (fast bodies pulse faster). Phase is a
        // stable hash from the four ids combined.
        if (opts.pulsation > 0 && t !== 0) {
          const speeds = [a.fromPlanet, a.toPlanet, b.fromPlanet, b.toPlanet]
            .map(pl => Math.abs(pl?.speed ?? 1))
            .reduce((s, v) => s + v, 0) / 4;
          const speedNorm = Math.min(1, speeds / 6); // 6 deg/day is fast-ish
          const f = opts.pulsationFreq * (0.5 + 1.5 * speedNorm);
          const phase = phaseFromId(
            a.aspect.from + a.aspect.to + b.aspect.from + b.aspect.to,
          );
          const pulse = Math.sin(2 * Math.PI * f * t + phase);
          radius *= 1 + opts.pulsation * pulse;
          opacity *= 1 + opts.pulsation * 0.5 * pulse;
        }

        const color = mixHex(a.color, b.color, 0.5);
        addCircle(scene, hit.x, hit.y, Math.max(0.5, radius), {
          fill: color,
          stroke: null,
          opacity: clamp(opacity, 0, 1),
          blend: 'screen',
        });
      }
    }
  }

  // Node markers at planet positions (per-planet, size from dignity).
  if (opts.nodeMarkers) {
    for (const [, { x, y, planet }] of planetById) {
      const dignity = clamp(planet.dignity ?? 0.5, 0, 1);
      const r = opts.nodeRadius * (0.6 + 1.4 * dignity);
      const color = palette.planets[planet.id] ?? '#cfd6e8';
      // Soft outer aura
      addCircle(scene, x, y, r * 2.2, {
        fill: color, stroke: null,
        opacity: 0.18,
        blend: 'screen',
      });
      // Solid inner
      addCircle(scene, x, y, r, {
        fill: color, stroke: null,
        opacity: 0.95,
      });
    }
  }

  scene.meta = {
    pattern: 'aspect-field',
    chordCount: placed.length,
    ringRadius: R,
    rotation,
    time: t,
  };

  return scene;
}
