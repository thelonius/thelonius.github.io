import type { FillValue, LinearGradient, Primitive, RadialGradient, Scene, Style } from '../types';

type GradientLike = {
  addColorStop(offset: number, color: string): void;
};

type Ctx2D = {
  fillStyle: string | GradientLike;
  strokeStyle: string | GradientLike;
  lineWidth: number;
  globalAlpha: number;
  globalCompositeOperation: string;
  setLineDash(segments: number[]): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  arc(cx: number, cy: number, r: number, a0: number, a1: number, ccw?: boolean): void;
  fill(): void;
  stroke(): void;
  save(): void;
  restore(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  createLinearGradient(x1: number, y1: number, x2: number, y2: number): GradientLike;
  createRadialGradient(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): GradientLike;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(sx: number, sy: number): void;
  clip(): void;
  drawImage(img: CanvasImageSource, dx: number, dy: number, dw?: number, dh?: number): void;
};

function polygonCentroid(pts: [number, number][]): [number, number] {
  let x = 0, y = 0;
  for (const p of pts) { x += p[0]; y += p[1]; }
  return [x / pts.length, y / pts.length];
}

function tracePolygon(ctx: Ctx2D, pts: [number, number][]): void {
  if (pts.length === 0) return;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function isGradient(v: FillValue): v is LinearGradient | RadialGradient {
  return typeof v === 'object' && v !== null && 'kind' in v;
}

function applyFillStops(g: GradientLike, stops: { offset: number; color: string; opacity?: number }[]): void {
  for (const s of stops) {
    // Stop opacity → embedded into color when present (canvas has no per-stop alpha).
    if (s.opacity !== undefined && s.opacity < 1) {
      g.addColorStop(s.offset, applyAlphaToColor(s.color, s.opacity));
    } else {
      g.addColorStop(s.offset, s.color);
    }
  }
}

function applyAlphaToColor(color: string, alpha: number): string {
  // Best-effort: convert "#rgb"/"#rrggbb" to rgba(); leave named/rgb() alone.
  if (color.startsWith('#')) {
    const h = color.slice(1);
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    if (h.length === 6) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  return color;
}

function resolveCanvasFill(ctx: Ctx2D, fill: FillValue): string | GradientLike | null {
  if (fill === undefined || fill === null) return null;
  if (typeof fill === 'string') return fill;
  if (fill.kind === 'linear-gradient') {
    const g = ctx.createLinearGradient(fill.x1, fill.y1, fill.x2, fill.y2);
    applyFillStops(g, fill.stops);
    return g;
  }
  // radial-gradient: inner focal at (fx, fy) defaults to (cx, cy)
  const fx = fill.fx ?? fill.cx;
  const fy = fill.fy ?? fill.cy;
  const g = ctx.createRadialGradient(fx, fy, 0, fill.cx, fill.cy, fill.r);
  applyFillStops(g, fill.stops);
  return g;
}

function blendToComposite(blend: Style['blend']): string {
  switch (blend) {
    case 'multiply': return 'multiply';
    case 'screen':   return 'screen';
    case 'overlay':  return 'overlay';
    default:         return 'source-over';
  }
}

function applyStyle(ctx: Ctx2D, style: Style): void {
  ctx.globalAlpha = style.opacity ?? 1;
  ctx.globalCompositeOperation = blendToComposite(style.blend);
  if (style.dashArray) {
    const segs = style.dashArray.split(/[\s,]+/).map(Number).filter(n => Number.isFinite(n));
    ctx.setLineDash(segs);
  } else {
    ctx.setLineDash([]);
  }
  ctx.lineWidth = style.strokeWidth ?? 1;
  if (style.stroke) ctx.strokeStyle = style.stroke;
}

function paint(ctx: Ctx2D, style: Style): void {
  if (style.fill !== undefined && style.fill !== null) {
    if (isGradient(style.fill)) {
      const g = resolveCanvasFill(ctx, style.fill);
      if (g !== null) {
        ctx.fillStyle = g;
        ctx.fill();
      }
    } else {
      ctx.fillStyle = style.fill;
      ctx.fill();
    }
  }
  if (style.stroke) {
    ctx.stroke();
  }
}

function drawPrimitive(ctx: Ctx2D, p: Primitive): void {
  ctx.save();
  applyStyle(ctx, p.style);
  ctx.beginPath();
  switch (p.kind) {
    case 'circle':
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      paint(ctx, p.style);
      break;
    case 'arc':
      ctx.arc(p.cx, p.cy, p.r, p.a0, p.a1);
      paint(ctx, p.style);
      break;
    case 'line':
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(p.x2, p.y2);
      paint(ctx, p.style);
      break;
    case 'polygon':
      if (p.points.length > 0) {
        ctx.moveTo(p.points[0][0], p.points[0][1]);
        for (let i = 1; i < p.points.length; i++) {
          ctx.lineTo(p.points[i][0], p.points[i][1]);
        }
        ctx.closePath();
        paint(ctx, p.style);
      }
      break;
    case 'path':
      // Minimal SVG-path parser: M/m (moveto), L/l (lineto), Z/z (close).
      // Sufficient for harmonograph traces and simple polylines.
      // Arc commands ("A") are intentionally skipped — convert to polygon
      // or use the SVG renderer for high-fidelity arcs on canvas.
      drawSimplePath(ctx, p.d, p.style);
      break;
    case 'region':
      drawRegion(ctx, p);
      break;
  }
  ctx.restore();
}

function drawRegion(
  ctx: Ctx2D,
  region: Extract<Primitive, { kind: 'region' }>,
): void {
  if (!region.image.element) {
    // No pre-loaded image to draw on canvas. Silently skip — the SVG
    // renderer can still produce the region by fetching `href` via
    // <image>. Caller should pre-load and attach `element` for canvas.
    return;
  }
  const [cx, cy] = polygonCentroid(region.shape);
  const t = region.transform;
  const ox = t.cx ?? cx;
  const oy = t.cy ?? cy;

  ctx.save();
  // Clip to the region shape
  ctx.beginPath();
  tracePolygon(ctx, region.shape);
  ctx.clip();

  // Apply transform around (ox, oy)
  if (t.translateX || t.translateY) {
    ctx.translate(t.translateX ?? 0, t.translateY ?? 0);
  }
  ctx.translate(ox, oy);
  if (t.rotate) ctx.rotate((t.rotate * Math.PI) / 180);
  if (t.scaleX !== undefined || t.scaleY !== undefined) {
    ctx.scale(t.scaleX ?? 1, t.scaleY ?? t.scaleX ?? 1);
  }
  ctx.translate(-ox, -oy);

  // Draw the image using region.imageRect (defaults to native size at origin).
  const rect = region.imageRect ?? { x: 0, y: 0, width: region.image.width, height: region.image.height };
  ctx.drawImage(region.image.element, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();

  // Tint overlay (drawn after restore so it's not clipped twice, but we
  // do still want it inside the shape; we re-clip via a fresh save).
  if (region.tint) {
    ctx.save();
    ctx.beginPath();
    tracePolygon(ctx, region.shape);
    ctx.clip();
    ctx.fillStyle = region.tint;
    ctx.fillRect(0, 0, 1e9, 1e9);
    ctx.restore();
  }

  // Outline
  if (region.style.stroke) {
    ctx.save();
    applyStyle(ctx, region.style);
    ctx.beginPath();
    tracePolygon(ctx, region.shape);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSimplePath(ctx: Ctx2D, d: string, style: Style): void {
  let i = 0;
  let cx = 0;
  let cy = 0;
  let startedSubpath = false;
  let subStartX = 0;
  let subStartY = 0;
  ctx.beginPath();
  while (i < d.length) {
    const ch = d[i];
    if (ch === ' ' || ch === ',') { i++; continue; }
    if (ch === 'M' || ch === 'm' || ch === 'L' || ch === 'l') {
      const rel = ch === ch.toLowerCase();
      i++;
      // Read consecutive pairs of numbers after the command.
      let first = true;
      while (i < d.length) {
        const skipped = skipSeparators(d, i);
        i = skipped;
        if (i >= d.length || isCommandChar(d[i])) break;
        const [x, ni] = readNumber(d, i);
        i = skipSeparators(d, ni);
        if (i >= d.length || isCommandChar(d[i])) break;
        const [y, ni2] = readNumber(d, i);
        i = ni2;
        const px = rel ? cx + x : x;
        const py = rel ? cy + y : y;
        if (first && (ch === 'M' || ch === 'm')) {
          ctx.moveTo(px, py);
          subStartX = px;
          subStartY = py;
          startedSubpath = true;
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
        cx = px;
        cy = py;
      }
    } else if (ch === 'Z' || ch === 'z') {
      ctx.closePath();
      if (startedSubpath) { cx = subStartX; cy = subStartY; }
      i++;
    } else {
      // Unknown command — bail out gracefully.
      break;
    }
  }
  paint(ctx, style);
}

function isCommandChar(c: string): boolean {
  return /[A-Za-z]/.test(c);
}

function skipSeparators(s: string, i: number): number {
  while (i < s.length && (s[i] === ' ' || s[i] === ',')) i++;
  return i;
}

function readNumber(s: string, i: number): [number, number] {
  let j = i;
  if (s[j] === '+' || s[j] === '-') j++;
  while (j < s.length && /[0-9.]/.test(s[j])) j++;
  if (j < s.length && (s[j] === 'e' || s[j] === 'E')) {
    j++;
    if (s[j] === '+' || s[j] === '-') j++;
    while (j < s.length && /[0-9]/.test(s[j])) j++;
  }
  return [parseFloat(s.slice(i, j)), j];
}

/**
 * Render a scene to a Canvas 2D context. Mostly the same fidelity as
 * the SVG renderer, with one caveat: `path` primitives are skipped
 * because canvas has no SVG path parser.
 */
export function toCanvas(scene: Scene, ctx: Ctx2D): void {
  if (scene.background) {
    ctx.save();
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, scene.width, scene.height);
    ctx.restore();
  }
  for (const p of scene.primitives) {
    drawPrimitive(ctx, p);
  }
}
