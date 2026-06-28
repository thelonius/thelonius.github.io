import {
  Body,
  EclipticGeoMoon,
  EclipticLongitude,
  SunPosition,
} from 'astronomy-engine';
import type { AspectAngle, AspectInput, PatternInput, PlanetPosition } from '../../src';

/**
 * Canonical Ptolemaic + minor aspect set used by `astro-aspect-patterns`.
 */
const ASPECT_ANGLES: AspectAngle[] = [0, 30, 45, 60, 72, 90, 120, 135, 144, 150, 180];

/**
 * Planets we render. Includes the lunar nodes? No — astronomy-engine
 * exposes node search via SearchMoonNode, but we don't need them for
 * the aspect pattern. Sticking to 10 classical bodies keeps the picture
 * legible.
 */
const PLANETS: { id: string; body: 'sun' | 'moon' | Body }[] = [
  { id: 'Sun',     body: 'sun'  },
  { id: 'Moon',    body: 'moon' },
  { id: 'Mercury', body: Body.Mercury },
  { id: 'Venus',   body: Body.Venus   },
  { id: 'Mars',    body: Body.Mars    },
  { id: 'Jupiter', body: Body.Jupiter },
  { id: 'Saturn',  body: Body.Saturn  },
  { id: 'Uranus',  body: Body.Uranus  },
  { id: 'Neptune', body: Body.Neptune },
  { id: 'Pluto',   body: Body.Pluto   },
];

/** Average daily motion in degrees per day, for normalising speed → 0..1. */
const TYPICAL_DAILY_MOTION: Record<string, number> = {
  Sun: 1.0, Moon: 13.2, Mercury: 1.1, Venus: 1.2, Mars: 0.5,
  Jupiter: 0.08, Saturn: 0.03, Uranus: 0.01, Neptune: 0.006, Pluto: 0.004,
};

function longitudeOf(body: 'sun' | 'moon' | Body, date: Date): number {
  if (body === 'sun')  return SunPosition(date).elon;
  if (body === 'moon') return EclipticGeoMoon(date).lon;
  return EclipticLongitude(body, date);
}

/** Wrap a longitude into [0, 360). */
function wrap360(v: number): number {
  const r = v % 360;
  return r < 0 ? r + 360 : r;
}

/** Signed shortest distance from longitude `a` to `b`, in degrees, [-180, 180]. */
function deltaLon(a: number, b: number): number {
  let d = wrap360(b - a);
  if (d > 180) d -= 360;
  return d;
}

/** Compute daily motion in deg/day by finite difference around `date`. */
function speedAround(body: 'sun' | 'moon' | Body, date: Date): number {
  const dt = 6 * 60 * 60 * 1000; // ±6 hours
  const before = new Date(date.getTime() - dt);
  const after  = new Date(date.getTime() + dt);
  return deltaLon(longitudeOf(body, before), longitudeOf(body, after)) * (24 / 12);
}

export interface TodayChartOptions {
  /** Date to compute the chart for. Default: now. */
  date?: Date;
  /** Maximum orb in degrees for aspect detection. Default 8. */
  maxOrb?: number;
}

/**
 * Compute today's geocentric chart and produce a `PatternInput` ready
 * to feed into any pattern in `astro-aspect-patterns`.
 *
 * Speeds are filled in (deg/day, signed — negative = retrograde) and
 * `dignity` is normalised to 0..1 from |speed| relative to each planet's
 * typical daily motion, so animation hooks (pulsation frequency) can
 * pick it up downstream.
 */
export function todayChart(options: TodayChartOptions = {}): PatternInput {
  const date = options.date ?? new Date();
  const maxOrb = options.maxOrb ?? 8;

  const planets: PlanetPosition[] = PLANETS.map(({ id, body }) => {
    const longitude = wrap360(longitudeOf(body, date));
    const speed = speedAround(body, date);
    const typical = TYPICAL_DAILY_MOTION[id] ?? 1;
    // "Dignity" here is a stand-in for "presence": fast planets are
    // small + zippy, slow planets are big + heavy. Inverted abs-speed.
    const dignity = Math.max(0, Math.min(1, 1 - Math.abs(speed) / typical));
    return { id, longitude, speed, dignity };
  });

  // Detect aspects: pairwise pick the closest aspect angle within orb.
  const aspects: AspectInput[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let delta = Math.abs(deltaLon(planets[i].longitude, planets[j].longitude));
      if (delta > 180) delta = 360 - delta;
      let best: { angle: AspectAngle; orb: number } | null = null;
      for (const a of ASPECT_ANGLES) {
        const orb = Math.abs(delta - a);
        if (orb > maxOrb) continue;
        if (!best || orb < best.orb) best = { angle: a, orb };
      }
      if (best) {
        aspects.push({
          from: planets[i].id,
          to:   planets[j].id,
          angle: best.angle,
          orb: best.orb,
        });
      }
    }
  }

  return { planets, aspects };
}
