import { describe, it, expect } from 'vitest';
import { toSVG } from '../src/render/svg';
import { toCanvas } from '../src/render/canvas';
import type { Scene } from '../src/types';

const scene: Scene = {
  width: 100,
  height: 100,
  background: '#000',
  primitives: [
    { kind: 'circle', cx: 50, cy: 50, r: 20, style: { fill: '#fff', opacity: 0.5 } },
    { kind: 'line',   x1: 0, y1: 0, x2: 100, y2: 100, style: { stroke: '#f00', strokeWidth: 2 } },
    { kind: 'polygon', points: [[10, 10], [90, 10], [50, 90]], style: { fill: '#0f0', stroke: '#00f' } },
  ],
};

describe('toSVG', () => {
  it('produces a well-formed root SVG element', () => {
    const svg = toSVG(scene);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
    expect(svg).toContain('viewBox="0 0 100 100"');
  });

  it('includes background rect when scene has background', () => {
    const svg = toSVG(scene);
    expect(svg).toContain('fill="#000"');
  });

  it('renders each primitive type', () => {
    const svg = toSVG(scene);
    expect(svg).toContain('<circle');
    expect(svg).toContain('<line');
    expect(svg).toContain('<polygon');
  });

  it('emits inner-only fragment when inner: true', () => {
    const inner = toSVG(scene, { inner: true });
    expect(inner).not.toMatch(/^<svg /);
    expect(inner).toContain('<circle');
  });

  it('escapes hostile color strings to prevent XML injection', () => {
    const dirty: Scene = {
      width: 10, height: 10, background: null,
      primitives: [{ kind: 'circle', cx: 5, cy: 5, r: 2, style: { fill: '"><script>x</script>' } }],
    };
    const svg = toSVG(dirty);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });
});

describe('toCanvas', () => {
  it('invokes context methods for each primitive', () => {
    const calls: string[] = [];
    const ctx: any = new Proxy({} as any, {
      get(_t, prop) {
        if (prop === 'setLineDash') return (_segs: number[]) => { calls.push('setLineDash'); };
        if (typeof prop === 'symbol') return undefined;
        const name = String(prop);
        if (name === 'fillStyle' || name === 'strokeStyle') return '#000';
        if (name === 'lineWidth' || name === 'globalAlpha') return 1;
        if (name === 'globalCompositeOperation') return 'source-over';
        return (...args: unknown[]) => {
          calls.push(`${name}(${args.length})`);
        };
      },
      set(_t, prop, _v) {
        calls.push(`set:${String(prop)}`);
        return true;
      },
    });
    toCanvas(scene, ctx);
    expect(calls.some(c => c.startsWith('arc'))).toBe(true);
    expect(calls.some(c => c.startsWith('moveTo'))).toBe(true);
    expect(calls.some(c => c.startsWith('lineTo'))).toBe(true);
    expect(calls.some(c => c === 'fillRect(4)')).toBe(true); // background
  });
});
