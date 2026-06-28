import type {
  GradientStop,
  ImageSource,
  LinearGradient,
  PatternInput,
  Primitive,
  RegionTransform,
  RenderOptions,
  Scene,
  Style,
} from '../types';
import { addCircle, addLine, addPolygon, emptyScene } from '../scene';

export interface CompositionOptions extends RenderOptions {
  /** Outer circle radius as fraction of min(width, height) / 2. Default 0.85. */
  outerScale?: number;
  /** Inner vesica circle radius as fraction of outer circle radius. Default 0.34. */
  innerScale?: number;
  /** Stroke color of the geometric lines. Default 'rgba(255,255,255,0.78)'. */
  lineColor?: string;
  /** Line stroke width in pixels. Default 0.9. */
  lineWidth?: number;
  /** Show horizontal diameter line. Default true. */
  showHorizon?: boolean;
  /** Show vertical diameter line. Default false. */
  showVertical?: boolean;
  /**
   * Atmosphere gradient. Pass `null` for a transparent atmosphere. If
   * an `image` is also provided, the atmosphere sits underneath as a
   * default "outside the geometry" backdrop. If omitted, a default
   * peach→blue vertical gradient is used.
   */
  atmosphere?: GradientStop[] | null;
  /**
   * When set, the geometric regions become viewports into this image,
   * each with its own rotation. The image fills the canvas; the
   * geometry shows a kaleidoscope view of it.
   */
  image?: ImageSource | null;
  /**
   * How to rotate each region's image content. Array of degrees; cycles
   * if shorter than the number of regions. Default `[0, 60, 120, 180,
   * 240, 300]` (windmill, six-fold). Pass `[0, 0, ...]` to disable
   * rotation per region.
   *
   * Ignored when `transformsPerRegion` is provided.
   */
  rotationsPerRegion?: number[];
  /**
   * Full per-region transforms (rotation, scale, translation). Overrides
   * `rotationsPerRegion` when set. Use this for kaleidoscope shuffles
   * that include horizontal/vertical reflections, not just rotations.
   */
  transformsPerRegion?: RegionTransform[];
  /**
   * Whether to also fill the central hexagon and the three vesica
   * circles with the image (each with their own rotation). Default true.
   */
  fillInnerRegions?: boolean;
  /**
   * When true, alternate hexagram-tip triangles get a subtle dark tint
   * overlay. Default false.
   */
  alternateTints?: boolean;
  /** Strength of alternate tints (0..1). Default 0.12. */
  tintStrength?: number;
}

const DEFAULTS = {
  outerScale: 0.85,
  innerScale: 0.34,
  lineColor: 'rgba(255,255,255,0.78)',
  lineWidth: 0.9,
  showHorizon: true,
  showVertical: false,
  fillInnerRegions: true,
  alternateTints: false,
  tintStrength: 0.12,
  rotationsPerRegion: [0, 60, 120, 180, 240, 300],
};

const DEFAULT_ATMOSPHERE: GradientStop[] = [
  { offset: 0.0,  color: '#f3d2b4' },
  { offset: 0.35, color: '#d8c6c4' },
  { offset: 0.65, color: '#90a0bb' },
  { offset: 1.0,  color: '#5d738f' },
];

function deg2rad(d: number): number { return (d * Math.PI) / 180; }

/**
 * Vertices of an equilateral triangle inscribed in a circle of radius
 * `r` at center `(cx, cy)`. `startDeg` rotates the triangle (math
 * convention: 0° = east, CCW positive; we flip y for screen).
 */
function triangleVertices(
  cx: number, cy: number, r: number, startDeg: number,
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const a = deg2rad(startDeg - i * 120);
    out.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]);
  }
  return out;
}

export function composition(input: PatternInput, options: CompositionOptions): Scene {
  void input; // Composition is structural for now; data hooks will follow.
  const opts = { ...DEFAULTS, ...options };
  const scene = emptyScene(opts.width, opts.height, null);

  const cx = opts.width / 2;
  const cy = opts.height / 2;
  const halfMin = Math.min(opts.width, opts.height) / 2;
  const outerR = halfMin * opts.outerScale;
  const innerR = outerR * opts.innerScale;
  const triquetraD = innerR / Math.sqrt(3);
  const rotation = opts.rotation ?? 0;

  const stops = options.atmosphere === undefined ? DEFAULT_ATMOSPHERE : options.atmosphere;
  const image = options.image ?? null;

  // 1. Atmosphere backdrop (covers the whole canvas).
  if (stops !== null) {
    const grad: LinearGradient = {
      kind: 'linear-gradient',
      x1: opts.width / 2, y1: 0,
      x2: opts.width / 2, y2: opts.height,
      stops,
    };
    addPolygon(scene, [
      [0, 0], [opts.width, 0], [opts.width, opts.height], [0, opts.height],
    ], { fill: grad, stroke: null });
  }

  // 2. Regions: hexagram tips + central hexagon + (optional) vesica circles.
  // Outer vertices at math-angles 30, 90, 150, 210, 270, 330 (rotated by `rotation`).
  const tipAngles = [90, 30, 330, 270, 210, 150];
  const outerVerts: [number, number][] = tipAngles.map(a => {
    const r = deg2rad(a + rotation);
    return [cx + outerR * Math.cos(r), cy - outerR * Math.sin(r)];
  });
  // Hexagon vertices sit BETWEEN adjacent tips. With tips at 90,30,330,..., hexagon
  // vertices are at 60, 0, 300, 240, 180, 120 (rotated). For tip i, the two
  // neighbouring hexagon vertices are hex[i] and hex[(i-1+6)%6].
  const hexAngles = [60, 0, 300, 240, 180, 120];
  const hexVerts: [number, number][] = hexAngles.map(a => {
    const r = deg2rad(a + rotation);
    const hr = outerR / Math.sqrt(3);
    return [cx + hr * Math.cos(r), cy - hr * Math.sin(r)];
  });

  const rots = opts.rotationsPerRegion.length > 0 ? opts.rotationsPerRegion : [0];
  const transforms = options.transformsPerRegion;

  function transformFor(idx: number): RegionTransform {
    if (transforms && transforms.length > 0) return transforms[idx % transforms.length];
    return { rotate: rots[idx % rots.length] };
  }

  // Compute cover-fit rect once: image scales to fully cover the canvas,
  // centered. All regions sample from the SAME scaled image, only their
  // per-region transform varies — that's how the kaleidoscope works.
  let imageRect: { x: number; y: number; width: number; height: number } | undefined;
  if (image) {
    const fit = Math.max(opts.width / image.width, opts.height / image.height);
    const drawW = image.width * fit;
    const drawH = image.height * fit;
    imageRect = {
      x: (opts.width - drawW) / 2,
      y: (opts.height - drawH) / 2,
      width: drawW,
      height: drawH,
    };
  }

  function regionPrim(
    shape: [number, number][],
    img: ImageSource,
    transform: RegionTransform,
    tint?: string,
  ): Primitive {
    return {
      kind: 'region',
      shape,
      image: img,
      imageRect,
      transform,
      tint,
      style: { fill: null, stroke: null },
    };
  }

  if (image) {
    // 6 tip-triangles
    for (let i = 0; i < 6; i++) {
      const tip = outerVerts[i];
      const left = hexVerts[i];
      const right = hexVerts[(i + 5) % 6];
      scene.primitives.push(regionPrim([tip, left, right], image, transformFor(i)));
    }
    if (opts.fillInnerRegions) {
      // Central hexagon
      scene.primitives.push(regionPrim(hexVerts, image, transformFor(6)));
      // 3 vesica circles approximated as polygons (24-gon each)
      for (let i = 0; i < 3; i++) {
        const a = deg2rad(90 - i * 120 + rotation);
        const ccx = cx + triquetraD * Math.cos(a);
        const ccy = cy - triquetraD * Math.sin(a);
        const poly: [number, number][] = [];
        for (let j = 0; j < 24; j++) {
          const ja = (j * 2 * Math.PI) / 24;
          poly.push([ccx + innerR * Math.cos(ja), ccy + innerR * Math.sin(ja)]);
        }
        scene.primitives.push(regionPrim(poly, image, transformFor(7 + i)));
      }
    }
  }

  // 3. Geometry lines on top.
  const line: Style = {
    fill: null,
    stroke: opts.lineColor,
    strokeWidth: opts.lineWidth,
    opacity: 1,
  };
  addCircle(scene, cx, cy, outerR, line);

  // Two triangles
  const triUp   = triangleVertices(cx, cy, outerR, 90 + rotation);
  const triDown = triangleVertices(cx, cy, outerR, 270 + rotation);
  addPolygon(scene, triUp, line);
  addPolygon(scene, triDown, line);

  // Optional tints on alternate hexagram tips
  if (opts.alternateTints) {
    const tintStyle: Style = {
      fill: `rgba(20, 30, 50, ${opts.tintStrength})`,
      stroke: null,
      blend: 'multiply',
    };
    for (let i = 0; i < 6; i++) {
      if (i % 2 !== 0) continue;
      const tip = outerVerts[i];
      const left = hexVerts[i];
      const right = hexVerts[(i + 5) % 6];
      addPolygon(scene, [tip, left, right], tintStyle);
    }
  }

  // Three vesica circles (line)
  for (let i = 0; i < 3; i++) {
    const a = deg2rad(90 - i * 120 + rotation);
    const ccx = cx + triquetraD * Math.cos(a);
    const ccy = cy - triquetraD * Math.sin(a);
    addCircle(scene, ccx, ccy, innerR, line);
  }

  // Diameters
  if (opts.showHorizon) {
    addLine(scene, cx - outerR * 1.02, cy, cx + outerR * 1.02, cy, line);
  }
  if (opts.showVertical) {
    addLine(scene, cx, cy - outerR * 1.02, cx, cy + outerR * 1.02, line);
  }

  scene.meta = {
    pattern: 'composition',
    outerR,
    innerR,
    triquetraD,
    regions: image ? (opts.fillInnerRegions ? 10 : 6) : 0,
  };

  return scene;
}
