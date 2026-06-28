import type {
  FillValue, GradientStop, LinearGradient, Primitive, RadialGradient,
  Scene, Style,
} from '../types';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function stopsToSvg(stops: GradientStop[]): string {
  return stops.map(s =>
    `<stop offset="${fmt(s.offset)}" stop-color="${escapeXml(s.color)}"${s.opacity !== undefined ? ` stop-opacity="${fmt(s.opacity)}"` : ''}/>`
  ).join('');
}

function gradientToDef(grad: LinearGradient | RadialGradient, id: string): string {
  if (grad.kind === 'linear-gradient') {
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fmt(grad.x1)}" y1="${fmt(grad.y1)}" x2="${fmt(grad.x2)}" y2="${fmt(grad.y2)}">${stopsToSvg(grad.stops)}</linearGradient>`;
  }
  return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${fmt(grad.cx)}" cy="${fmt(grad.cy)}" r="${fmt(grad.r)}"${grad.fx !== undefined ? ` fx="${fmt(grad.fx)}"` : ''}${grad.fy !== undefined ? ` fy="${fmt(grad.fy)}"` : ''}>${stopsToSvg(grad.stops)}</radialGradient>`;
}

interface RenderState {
  defs: string[];
  gradIdCounter: number;
  gradMap: Map<LinearGradient | RadialGradient, string>;
  clipIdCounter: number;
}

function polygonCentroid(pts: [number, number][]): { x: number; y: number } {
  let x = 0, y = 0;
  for (const p of pts) { x += p[0]; y += p[1]; }
  return { x: x / pts.length, y: y / pts.length };
}

function transformToSvg(t: { rotate?: number; scaleX?: number; scaleY?: number; translateX?: number; translateY?: number; cx?: number; cy?: number }, fallbackCx: number, fallbackCy: number): string {
  const ox = t.cx ?? fallbackCx;
  const oy = t.cy ?? fallbackCy;
  const parts: string[] = [];
  if (t.translateX || t.translateY) {
    parts.push(`translate(${fmt(t.translateX ?? 0)} ${fmt(t.translateY ?? 0)})`);
  }
  if (t.rotate) parts.push(`rotate(${fmt(t.rotate)} ${fmt(ox)} ${fmt(oy)})`);
  if (t.scaleX !== undefined || t.scaleY !== undefined) {
    parts.push(`translate(${fmt(ox)} ${fmt(oy)}) scale(${fmt(t.scaleX ?? 1)} ${fmt(t.scaleY ?? t.scaleX ?? 1)}) translate(${fmt(-ox)} ${fmt(-oy)})`);
  }
  return parts.join(' ');
}

function resolveFill(fill: FillValue, state: RenderState): string {
  if (fill === undefined || fill === null) return 'none';
  if (typeof fill === 'string') return escapeXml(fill);
  let id = state.gradMap.get(fill);
  if (!id) {
    id = `grad${state.gradIdCounter++}`;
    state.gradMap.set(fill, id);
    state.defs.push(gradientToDef(fill, id));
  }
  return `url(#${id})`;
}

function styleToAttrs(style: Style, state: RenderState): string {
  const parts: string[] = [];
  parts.push(`fill="${resolveFill(style.fill ?? null, state)}"`);
  if (style.stroke) parts.push(`stroke="${escapeXml(style.stroke)}"`);
  if (style.strokeWidth !== undefined) parts.push(`stroke-width="${fmt(style.strokeWidth)}"`);
  if (style.opacity !== undefined) parts.push(`opacity="${fmt(style.opacity)}"`);
  if (style.dashArray) parts.push(`stroke-dasharray="${escapeXml(style.dashArray)}"`);
  if (style.blend && style.blend !== 'normal') parts.push(`style="mix-blend-mode:${escapeXml(style.blend)}"`);
  return parts.join(' ');
}

function primitiveToSVG(p: Primitive, state: RenderState): string {
  const attrs = styleToAttrs(p.style, state);
  switch (p.kind) {
    case 'circle':
      return `<circle cx="${fmt(p.cx)}" cy="${fmt(p.cy)}" r="${fmt(p.r)}" ${attrs}/>`;
    case 'line':
      return `<line x1="${fmt(p.x1)}" y1="${fmt(p.y1)}" x2="${fmt(p.x2)}" y2="${fmt(p.y2)}" ${attrs}/>`;
    case 'arc': {
      const start = { x: p.cx + p.r * Math.cos(p.a0), y: p.cy + p.r * Math.sin(p.a0) };
      const end   = { x: p.cx + p.r * Math.cos(p.a1), y: p.cy + p.r * Math.sin(p.a1) };
      const sweep = p.a1 > p.a0 ? 1 : 0;
      const large = Math.abs(p.a1 - p.a0) > Math.PI ? 1 : 0;
      const d = `M ${fmt(start.x)} ${fmt(start.y)} A ${fmt(p.r)} ${fmt(p.r)} 0 ${large} ${sweep} ${fmt(end.x)} ${fmt(end.y)}`;
      return `<path d="${d}" ${attrs}/>`;
    }
    case 'polygon': {
      const pts = p.points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ');
      return `<polygon points="${pts}" ${attrs}/>`;
    }
    case 'path':
      return `<path d="${escapeXml(p.d)}" ${attrs}/>`;
    case 'region': {
      const clipId = `clip${state.clipIdCounter++}`;
      const pts = p.shape.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ');
      state.defs.push(`<clipPath id="${clipId}"><polygon points="${pts}"/></clipPath>`);
      const centroid = polygonCentroid(p.shape);
      const tx = transformToSvg(p.transform, centroid.x, centroid.y);
      const rect = p.imageRect ?? { x: 0, y: 0, width: p.image.width, height: p.image.height };
      const imgAttrs = `href="${escapeXml(p.image.href)}" x="${fmt(rect.x)}" y="${fmt(rect.y)}" width="${fmt(rect.width)}" height="${fmt(rect.height)}" preserveAspectRatio="xMidYMid slice"`;
      const tint = p.tint
        ? `<polygon points="${pts}" fill="${escapeXml(p.tint)}"/>`
        : '';
      const outline = p.style.stroke
        ? `<polygon points="${pts}" fill="none" ${styleToAttrs({ ...p.style, fill: null }, state)}/>`
        : '';
      return `<g clip-path="url(#${clipId})"><g transform="${tx}"><image ${imgAttrs}/></g>${tint}</g>${outline}`;
    }
  }
}

/**
 * Render a `Scene` to an SVG string. Gradients used as fills are
 * automatically extracted into a `<defs>` block at the top of the
 * generated SVG.
 */
export function toSVG(scene: Scene, options: { inner?: boolean } = {}): string {
  const state: RenderState = { defs: [], gradIdCounter: 1, gradMap: new Map(), clipIdCounter: 1 };
  const body = scene.primitives.map(p => primitiveToSVG(p, state)).join('');
  const defs = state.defs.length > 0 ? `<defs>${state.defs.join('')}</defs>` : '';
  if (options.inner) {
    return defs + body;
  }
  const bg = scene.background
    ? `<rect width="100%" height="100%" fill="${escapeXml(scene.background)}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(scene.width)} ${fmt(scene.height)}" width="${fmt(scene.width)}" height="${fmt(scene.height)}">${defs}${bg}${body}</svg>`;
}

/**
 * Build a `<svg>` DOM element from a scene. Browser-only.
 */
export function toSVGElement(scene: Scene): SVGSVGElement {
  if (typeof document === 'undefined') {
    throw new Error('toSVGElement requires a DOM. Use toSVG() in non-browser environments.');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(toSVG(scene), 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.tagName !== 'svg') {
    throw new Error('Failed to parse generated SVG');
  }
  return svg as unknown as SVGSVGElement;
}
