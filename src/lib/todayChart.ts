/**
 * Compute today's geocentric chart (planet longitudes + aspect graph)
 * via `astronomy-engine` and produce a `PatternInput` ready to feed
 * into `astro-aspect-patterns`.
 *
 * Pure client-safe — no network, no DOM, no WASM. Suitable for use both
 * at build-time (server static SVG fallback) and at runtime (animated
 * canvas hydration).
 */

import {
  Body,
  EclipticGeoMoon,
  EclipticLongitude,
  SunPosition,
} from 'astronomy-engine';
import type { AspectAngle, AspectInput, PatternInput, PlanetPosition } from 'astro-aspect-patterns';

const ASPECT_ANGLES: AspectAngle[] = [0, 30, 45, 60, 72, 90, 120, 135, 144, 150, 180];

interface PlanetSpec {
  id: string;
  body: 'sun' | 'moon' | Body;
  /** Typical daily motion in degrees per day — used to normalise `dignity`. */
  typicalMotion: number;
}

const PLANETS: PlanetSpec[] = [
  { id: 'Sun',     body: 'sun',         typicalMotion: 1.0  },
  { id: 'Moon',    body: 'moon',        typicalMotion: 13.2 },
  { id: 'Mercury', body: Body.Mercury,  typicalMotion: 1.1  },
  { id: 'Venus',   body: Body.Venus,    typicalMotion: 1.2  },
  { id: 'Mars',    body: Body.Mars,     typicalMotion: 0.5  },
  { id: 'Jupiter', body: Body.Jupiter,  typicalMotion: 0.08 },
  { id: 'Saturn',  body: Body.Saturn,   typicalMotion: 0.03 },
  { id: 'Uranus',  body: Body.Uranus,   typicalMotion: 0.01 },
  { id: 'Neptune', body: Body.Neptune,  typicalMotion: 0.006 },
  { id: 'Pluto',   body: Body.Pluto,    typicalMotion: 0.004 },
];

function longitudeOf(body: 'sun' | 'moon' | Body, date: Date): number {
  if (body === 'sun')  return SunPosition(date).elon;
  if (body === 'moon') return EclipticGeoMoon(date).lon;
  return EclipticLongitude(body, date);
}

function wrap360(v: number): number {
  const r = v % 360;
  return r < 0 ? r + 360 : r;
}

function deltaLon(a: number, b: number): number {
  let d = wrap360(b - a);
  if (d > 180) d -= 360;
  return d;
}

function speedAround(body: 'sun' | 'moon' | Body, date: Date): number {
  const dt = 6 * 60 * 60 * 1000;
  const before = new Date(date.getTime() - dt);
  const after  = new Date(date.getTime() + dt);
  return deltaLon(longitudeOf(body, before), longitudeOf(body, after)) * 2;
}

export interface TodayChartOptions {
  date?: Date;
  /** Max orb in degrees for aspect detection. Default 8. */
  maxOrb?: number;
  /** When true, return only the seven classical planets (drop Uranus/Neptune/Pluto). */
  classical?: boolean;
}

export function todayChart(options: TodayChartOptions = {}): PatternInput {
  const date = options.date ?? new Date();
  const maxOrb = options.maxOrb ?? 8;
  const list = options.classical
    ? PLANETS.slice(0, 7)
    : PLANETS;

  const planets: PlanetPosition[] = list.map(({ id, body, typicalMotion }) => {
    const longitude = wrap360(longitudeOf(body, date));
    const speed = speedAround(body, date);
    const dignity = Math.max(0, Math.min(1, 1 - Math.abs(speed) / typicalMotion));
    return { id, longitude, speed, dignity };
  });

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
        aspects.push({ from: planets[i].id, to: planets[j].id, angle: best.angle, orb: best.orb });
      }
    }
  }

  return { planets, aspects };
}
