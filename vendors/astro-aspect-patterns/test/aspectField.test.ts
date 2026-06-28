import { describe, it, expect } from 'vitest';
import { aspectField } from '../src/patterns/aspectField';
import type { PatternInput } from '../src/types';

const baseInput: PatternInput = {
  planets: [
    { id: 'Sun',  longitude: 0 },     // 0° Aries
    { id: 'Moon', longitude: 120 },   // 0° Leo
    { id: 'Mars', longitude: 90 },    // 0° Cancer
    { id: 'Venus', longitude: 240 },  // 0° Sagittarius
  ],
  aspects: [
    { from: 'Sun',  to: 'Moon', angle: 120, orb: 0 },        // exact trine
    { from: 'Sun',  to: 'Mars', angle: 90,  orb: 2 },        // square, 2° off
    { from: 'Moon', to: 'Venus', angle: 120, orb: 0 },       // exact trine, crosses Sun-Mars
  ],
};

describe('aspectField', () => {
  it('produces a scene with one line per resolvable aspect', () => {
    const scene = aspectField(baseInput, { width: 400, height: 400 });
    const lines = scene.primitives.filter(p => p.kind === 'line');
    expect(lines).toHaveLength(3);
  });

  it('emits halo circles at chord intersections of non-adjacent pairs', () => {
    // Two oppositions on perpendicular axes — chords cross at the center.
    const crossing: PatternInput = {
      planets: [
        { id: 'A', longitude: 0 },
        { id: 'B', longitude: 180 },
        { id: 'C', longitude: 90 },
        { id: 'D', longitude: 270 },
      ],
      aspects: [
        { from: 'A', to: 'B', angle: 180, orb: 0 },
        { from: 'C', to: 'D', angle: 180, orb: 0 },
      ],
    };
    const scene = aspectField(crossing, { width: 400, height: 400 });
    const halos = scene.primitives.filter(p => p.kind === 'circle');
    expect(halos.length).toBeGreaterThanOrEqual(1);
  });

  it('skips aspects whose endpoints are missing from planets[]', () => {
    const input: PatternInput = {
      planets: [{ id: 'Sun', longitude: 0 }],
      aspects: [{ from: 'Sun', to: 'Ghost', angle: 60, orb: 0 }],
    };
    const scene = aspectField(input, { width: 400, height: 400 });
    expect(scene.primitives.filter(p => p.kind === 'line')).toHaveLength(0);
  });

  it('is deterministic for the same input', () => {
    const a = aspectField(baseInput, { width: 400, height: 400 });
    const b = aspectField(baseInput, { width: 400, height: 400 });
    expect(JSON.stringify(a.primitives)).toBe(JSON.stringify(b.primitives));
  });

  it('chord strength scales stroke width and opacity', () => {
    const scene = aspectField(baseInput, { width: 400, height: 400 });
    const lines = scene.primitives.filter(p => p.kind === 'line') as Extract<typeof scene.primitives[number], { kind: 'line' }>[];
    // The Sun-Mars square has orb=2, the trines have orb=0 → trines should be wider
    const sunMars = lines[1];
    const sunMoon = lines[0];
    expect(sunMoon.style.strokeWidth!).toBeGreaterThan(sunMars.style.strokeWidth!);
  });

  it('drops zero-strength aspects (orb >= maxOrb)', () => {
    const input: PatternInput = {
      planets: [
        { id: 'Sun', longitude: 0 },
        { id: 'Moon', longitude: 120 },
      ],
      aspects: [{ from: 'Sun', to: 'Moon', angle: 120, orb: 10 }],
    };
    const scene = aspectField(input, { width: 400, height: 400, maxOrb: 8 } as any);
    expect(scene.primitives.filter(p => p.kind === 'line')).toHaveLength(0);
  });

  it('includes background only in standalone mode', () => {
    const inline = aspectField(baseInput, { width: 400, height: 400 });
    expect(inline.background).toBeNull();
    const stand = aspectField(baseInput, { width: 400, height: 400, standalone: true } as any);
    expect(stand.background).toBeTruthy();
  });
});
