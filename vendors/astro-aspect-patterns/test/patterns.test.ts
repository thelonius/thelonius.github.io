import { describe, it, expect } from 'vitest';
import { starPolygon } from '../src/patterns/starPolygon';
import { flowerOfLife } from '../src/patterns/flowerOfLife';
import { tiling, shapeFromAspect } from '../src/patterns/tiling';
import { harmonograph } from '../src/patterns/harmonograph';
import { voronoi } from '../src/patterns/voronoi';
import { classifyAspects } from '../src/aspectClassifier';
import type { PatternInput } from '../src/types';

const basicInput: PatternInput = {
  planets: [
    { id: 'Sun',     longitude: 0   },
    { id: 'Moon',    longitude: 120 },
    { id: 'Mercury', longitude: 60  },
    { id: 'Venus',   longitude: 30  },
    { id: 'Mars',    longitude: 90  },
    { id: 'Jupiter', longitude: 180 },
    { id: 'Saturn',  longitude: 240 },
  ],
  aspects: [
    { from: 'Sun',  to: 'Moon',    angle: 120, orb: 0   },
    { from: 'Sun',  to: 'Mercury', angle: 60,  orb: 1   },
    { from: 'Sun',  to: 'Mars',    angle: 90,  orb: 0.5 },
    { from: 'Sun',  to: 'Jupiter', angle: 180, orb: 0   },
    { from: 'Moon', to: 'Saturn',  angle: 120, orb: 0   },
  ],
};

const opts = { width: 400, height: 400 };

describe('classifyAspects', () => {
  it('returns the angle with the highest aggregate strength', () => {
    const r = classifyAspects(basicInput.aspects);
    expect(r.byAngle.size).toBeGreaterThan(0);
    expect([0, 30, 45, 60, 72, 90, 120, 135, 144, 150, 180]).toContain(r.dominant);
  });

  it('handles empty input', () => {
    const r = classifyAspects([]);
    expect(r.dominant).toBe(0);
    expect(r.dominantTotal).toBe(0);
  });
});

describe('starPolygon', () => {
  it('emits chord layers for present aspect types', () => {
    const scene = starPolygon(basicInput, opts);
    const lines = scene.primitives.filter(p => p.kind === 'line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const a = starPolygon(basicInput, opts);
    const b = starPolygon(basicInput, opts);
    expect(JSON.stringify(a.primitives)).toBe(JSON.stringify(b.primitives));
  });

  it('emits ring guideline when showRing is true', () => {
    const scene = starPolygon(basicInput, { ...opts, showRing: true } as any);
    const circles = scene.primitives.filter(p => p.kind === 'circle');
    expect(circles.length).toBeGreaterThan(0);
  });
});

describe('flowerOfLife', () => {
  it('emits one outline circle per planet', () => {
    const scene = flowerOfLife(basicInput, opts);
    const circles = scene.primitives.filter(p => p.kind === 'circle');
    expect(circles.length).toBe(basicInput.planets.length);
  });

  it('emits lens polygons for overlapping aspects', () => {
    const scene = flowerOfLife(basicInput, opts);
    const polys = scene.primitives.filter(p => p.kind === 'polygon');
    // Some aspects overlap (sextile with d=r) and others don't (opposition d=2r).
    expect(polys.length).toBeGreaterThan(0);
  });

  it('skips lenses when circles are tangent or beyond', () => {
    const input: PatternInput = {
      planets: [
        { id: 'A', longitude: 0   },
        { id: 'B', longitude: 180 },
      ],
      aspects: [{ from: 'A', to: 'B', angle: 180, orb: 0 }],
    };
    // ringRadius=0.18 default → wheelR ~= 72, circleR same → planets at d=2*wheelR → tangent.
    const scene = flowerOfLife(input, opts);
    expect(scene.primitives.filter(p => p.kind === 'polygon').length).toBe(0);
  });
});

describe('tiling', () => {
  it('maps aspect to tile shape', () => {
    expect(shapeFromAspect(60)).toBe('hex');
    expect(shapeFromAspect(90)).toBe('square');
    expect(shapeFromAspect(120)).toBe('triangle');
    expect(shapeFromAspect(72)).toBe('rhombic');
  });

  it('emits cells covering the canvas', () => {
    const scene = tiling(basicInput, { ...opts, tileSize: 40 } as any);
    const cells = scene.primitives.filter(p => p.kind === 'polygon');
    expect(cells.length).toBeGreaterThan(20);
    expect(scene.meta?.shape).toBeDefined();
  });

  it('respects explicit shape override', () => {
    const scene = tiling(basicInput, { ...opts, shape: 'square', tileSize: 40 } as any);
    expect(scene.meta?.shape).toBe('square');
    // Square tiles have 4 vertices
    const polys = scene.primitives.filter(p => p.kind === 'polygon');
    polys.forEach(p => {
      if (p.kind === 'polygon') expect(p.points.length).toBe(4);
    });
  });
});

describe('harmonograph', () => {
  it('emits a single path primitive', () => {
    const scene = harmonograph(basicInput, opts);
    const paths = scene.primitives.filter(p => p.kind === 'path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('emits no path when there are no usable aspects', () => {
    const scene = harmonograph(
      { planets: [], aspects: [] },
      opts,
    );
    expect(scene.primitives.filter(p => p.kind === 'path').length).toBe(0);
  });

  it('phase parameter changes the trace', () => {
    const a = harmonograph(basicInput, { ...opts, seed: 1 });
    const b = harmonograph(basicInput, { ...opts, seed: 1, phase: 0.5 } as any);
    expect(JSON.stringify(a.primitives)).not.toBe(JSON.stringify(b.primitives));
  });
});

describe('voronoi', () => {
  it('emits one cell per planet seed (when cells are non-degenerate)', () => {
    const scene = voronoi(basicInput, opts);
    const cells = scene.primitives.filter(p => p.kind === 'polygon');
    expect(cells.length).toBe(basicInput.planets.length);
  });

  it('handles a single planet (returns a single full-canvas cell)', () => {
    const scene = voronoi(
      { planets: [{ id: 'Sun', longitude: 0 }], aspects: [] },
      opts,
    );
    const cells = scene.primitives.filter(p => p.kind === 'polygon');
    expect(cells.length).toBe(1);
  });

  it('handles empty planets gracefully', () => {
    const scene = voronoi({ planets: [], aspects: [] }, opts);
    expect(scene.primitives).toEqual([]);
  });
});
