/**
 * Convert ecliptic longitude to a screen-space angle (in degrees).
 *
 * Conventions:
 *  - Astrological longitude grows counter-clockwise from 0° Aries.
 *  - With rotation=0 the library places 0° Aries at 9 o'clock (left),
 *    matching the natal-chart layout where the Ascendant sits on the
 *    left horizon. To rotate the whole wheel so the Ascendant is at
 *    9 o'clock, pass `rotation = ascendantLongitude`.
 *  - The returned value is intended to be paired with `polarToCartesian`.
 */
export function longitudeToAngleDeg(longitude: number, rotation = 0): number {
  const a = (270 - longitude + rotation) % 360;
  return a >= 0 ? a : a + 360;
}

/**
 * Convert a polar angle (degrees, 0 = 12 o'clock, clockwise) to (x, y).
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function longitudeToPoint(
  longitude: number,
  cx: number,
  cy: number,
  radius: number,
  rotation = 0,
): { x: number; y: number } {
  return polarToCartesian(cx, cy, radius, longitudeToAngleDeg(longitude, rotation));
}

/**
 * Mulberry32 PRNG. Deterministic, tiny, good enough for visual jitter.
 */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Find intersection of two line segments AB and CD. Returns null when
 * parallel or when the intersection lies outside either segment.
 */
export function intersectSegments(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
): { x: number; y: number } | null {
  const rx = bx - ax;
  const ry = by - ay;
  const sx = dx - cx;
  const sy = dy - cy;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((cx - ax) * sy - (cy - ay) * sx) / denom;
  const u = ((cx - ax) * ry - (cy - ay) * rx) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: ax + t * rx, y: ay + t * ry };
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

/**
 * Linear mix of two hex colors. `t=0` → a, `t=1` → b.
 */
export function mixHex(a: string, b: string, t = 0.5): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return '#' + toHex(ar * (1 - t) + br * t)
            + toHex(ag * (1 - t) + bg * t)
            + toHex(ab * (1 - t) + bb * t);
}
