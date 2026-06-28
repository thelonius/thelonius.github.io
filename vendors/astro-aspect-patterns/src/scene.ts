import type { Scene, Style } from './types';

export function emptyScene(width: number, height: number, background?: string | null): Scene {
  return {
    width,
    height,
    background: background ?? null,
    primitives: [],
  };
}

export function addLine(
  scene: Scene,
  x1: number, y1: number,
  x2: number, y2: number,
  style: Style,
): void {
  scene.primitives.push({ kind: 'line', x1, y1, x2, y2, style });
}

export function addCircle(
  scene: Scene,
  cx: number, cy: number, r: number,
  style: Style,
): void {
  scene.primitives.push({ kind: 'circle', cx, cy, r, style });
}

export function addPath(scene: Scene, d: string, style: Style): void {
  scene.primitives.push({ kind: 'path', d, style });
}

export function addPolygon(scene: Scene, points: [number, number][], style: Style): void {
  scene.primitives.push({ kind: 'polygon', points, style });
}
