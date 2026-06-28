import type { AspectAngle, AspectInput, PatternInput, PlanetPosition } from '../../src';
import { makeRng } from '../../src';
import { todayChart } from './today-chart';

const PLANET_NAMES = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
];

const ASPECT_ANGLES: AspectAngle[] = [0, 30, 60, 72, 90, 120, 144, 150, 180];

interface BuildOptions {
  seed: number;
  maxOrb: number;
}

/** Detect aspects between every pair, keep only those within maxOrb. */
function detectAspects(planets: PlanetPosition[], maxOrb: number): AspectInput[] {
  const out: AspectInput[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      let delta = Math.abs(a.longitude - b.longitude) % 360;
      if (delta > 180) delta = 360 - delta;
      for (const angle of ASPECT_ANGLES) {
        const orb = Math.abs(delta - angle);
        if (orb <= maxOrb) {
          out.push({ from: a.id, to: b.id, angle, orb });
          break;
        }
      }
    }
  }
  return out;
}

export function presetRandom(opts: BuildOptions): PatternInput {
  const rng = makeRng(opts.seed);
  const planets: PlanetPosition[] = PLANET_NAMES.map((id, i) => ({
    id,
    longitude: (i * 36 + rng() * 36) % 360,
  }));
  return { planets, aspects: detectAspects(planets, opts.maxOrb) };
}

export function presetGrandCross(_opts: BuildOptions): PatternInput {
  const planets: PlanetPosition[] = [
    { id: 'Sun',     longitude: 0   },
    { id: 'Moon',    longitude: 90  },
    { id: 'Mars',    longitude: 180 },
    { id: 'Jupiter', longitude: 270 },
  ];
  return { planets, aspects: detectAspects(planets, 8) };
}

export function presetGrandTrine(_opts: BuildOptions): PatternInput {
  const planets: PlanetPosition[] = [
    { id: 'Sun',     longitude: 0   },
    { id: 'Jupiter', longitude: 120 },
    { id: 'Saturn',  longitude: 240 },
    // Add a fourth point off-trine so chords have a non-symmetric counterpart
    { id: 'Mercury', longitude: 60  },
  ];
  return { planets, aspects: detectAspects(planets, 8) };
}

export function presetDense(opts: BuildOptions): PatternInput {
  const rng = makeRng(opts.seed);
  const planets: PlanetPosition[] = PLANET_NAMES.map(id => ({
    id,
    longitude: rng() * 360,
  }));
  return { planets, aspects: detectAspects(planets, opts.maxOrb) };
}

export function presetQuintileHeavy(_opts: BuildOptions): PatternInput {
  // Five planets at the vertices of a regular pentagon — all pairwise
  // distances fall on 72° or 144°, so quintile family dominates.
  const planets: PlanetPosition[] = [
    { id: 'Sun',     longitude: 0   },
    { id: 'Mercury', longitude: 72  },
    { id: 'Venus',   longitude: 144 },
    { id: 'Mars',    longitude: 216 },
    { id: 'Jupiter', longitude: 288 },
  ];
  return { planets, aspects: detectAspects(planets, 8) };
}

export function presetToday(opts: BuildOptions): PatternInput {
  return todayChart({ maxOrb: opts.maxOrb });
}

export const PRESETS: Record<string, (o: BuildOptions) => PatternInput> = {
  random: presetRandom,
  'grand-cross': presetGrandCross,
  'grand-trine': presetGrandTrine,
  dense: presetDense,
  'quintile-heavy': presetQuintileHeavy,
  today: presetToday,
};
