/**
 * Exact astrological aspect angle. The library accepts the canonical
 * Ptolemaic set plus the modern minor aspects.
 */
export type AspectAngle = 0 | 30 | 45 | 60 | 72 | 90 | 120 | 135 | 144 | 150 | 180;

/**
 * A planet (or other point: nodes, lots, asteroids) on the ecliptic.
 *
 * The library does not compute positions — it consumes them. Callers
 * are free to feed in transits, natal points, or any mix of both. If a
 * later layered model is needed, extend `id` with a prefix (e.g.
 * `'natal-sun'`, `'transit-sun'`) — the library treats ids as opaque.
 */
export interface PlanetPosition {
  id: string;
  /** Ecliptic longitude in degrees, 0..360. 0 = 0° Aries. */
  longitude: number;
  /** Degrees per day. Optional, used by patterns that vary radius by speed. */
  speed?: number;
  /** 0..1 normalised dignity / importance weight. */
  dignity?: number;
}

/**
 * An aspect between two `PlanetPosition`s. `from`/`to` are ids; the
 * library looks them up in the `planets` array of the same input.
 */
export interface AspectInput {
  from: string;
  to: string;
  angle: AspectAngle;
  /** |actual separation - exact angle|, in degrees. */
  orb: number;
  /** 0..1 strength. If absent, derived from orb via `1 - orb / maxOrb`. */
  strength?: number;
}

export interface Palette {
  background?: string | null;
  /** Per-planet color, keyed by `PlanetPosition.id`. */
  planets?: Record<string, string>;
  /** Per-aspect-angle color. */
  aspects?: Partial<Record<AspectAngle, string>>;
  /** 12 colors, one per zodiac sign (0 = Aries, 11 = Pisces). */
  signs?: string[];
}

export interface PatternInput {
  planets: PlanetPosition[];
  aspects: AspectInput[];
  palette?: Palette;
}

export interface RenderOptions {
  width: number;
  height: number;
  /**
   * Rotation of the wheel in degrees. Use this when integrating with a
   * chart that aligns the Ascendant to a fixed point (e.g. 9 o'clock).
   * Default 0 = 0° Aries at the right (3 o'clock), counter-clockwise.
   */
  rotation?: number;
  /** Seed for any pseudo-random decisions inside patterns. */
  seed?: number;
}

export interface GradientStop {
  offset: number;       // 0..1
  color: string;
  opacity?: number;
}

export interface LinearGradient {
  kind: 'linear-gradient';
  x1: number; y1: number;
  x2: number; y2: number;
  stops: GradientStop[];
}

export interface RadialGradient {
  kind: 'radial-gradient';
  cx: number; cy: number;
  r: number;
  fx?: number; fy?: number;
  stops: GradientStop[];
}

export type FillValue = string | LinearGradient | RadialGradient | null;

export interface Style {
  fill?: FillValue;
  stroke?: string | null;
  strokeWidth?: number;
  opacity?: number;
  blend?: 'normal' | 'multiply' | 'screen' | 'overlay';
  dashArray?: string;
}

/**
 * Reference to a raster image source. Carries both an `href` (URL or
 * data URL, used by the SVG renderer) and an optional already-loaded
 * `element` (used by the Canvas renderer to call `drawImage` without
 * waiting for a fetch). The two should describe the same image when
 * both are present.
 */
export interface ImageSource {
  href: string;
  width: number;
  height: number;
  /**
   * Optional pre-loaded image for synchronous Canvas rendering. Any
   * `CanvasImageSource` works: `HTMLImageElement`, `HTMLCanvasElement`,
   * `ImageBitmap`, `OffscreenCanvas`.
   */
  element?: CanvasImageSource;
}

export interface RegionTransform {
  /** Rotation in degrees around the region's centroid (or `cx`/`cy` if set). */
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  /** Transform origin override. Defaults to the polygon centroid. */
  cx?: number;
  cy?: number;
}

export type Primitive =
  | { kind: 'circle';  cx: number; cy: number; r: number; style: Style }
  | { kind: 'arc';     cx: number; cy: number; r: number; a0: number; a1: number; style: Style }
  | { kind: 'line';    x1: number; y1: number; x2: number; y2: number; style: Style }
  | { kind: 'polygon'; points: [number, number][]; style: Style }
  | { kind: 'path';    d: string; style: Style }
  | {
      kind: 'region';
      /** Closed polygon defining the clip area. */
      shape: [number, number][];
      image: ImageSource;
      /**
       * Rectangle in canvas coordinates where the image is laid down
       * BEFORE the per-region transform is applied. Pass a "cover-fit"
       * rect (image scaled to fully cover the canvas, centered) to get
       * a true kaleidoscope feel where every region samples the same
       * fully-scaled scene.
       *
       * When omitted, defaults to `{ x:0, y:0, width: image.width, height: image.height }`.
       */
      imageRect?: { x: number; y: number; width: number; height: number };
      transform: RegionTransform;
      /** Optional tint overlaid inside the region (e.g. 'rgba(0,0,0,0.1)'). */
      tint?: string;
      /** Style applies to the optional outline stroke of the region. */
      style: Style;
    };

export interface Scene {
  width: number;
  height: number;
  background?: string | null;
  primitives: Primitive[];
  meta?: Record<string, unknown>;
}

export type PatternKind =
  | 'aspect-field'
  | 'star-polygon'
  | 'tiling'
  | 'flower-of-life'
  | 'harmonograph'
  | 'voronoi';
