export type {
  AspectAngle,
  PlanetPosition,
  AspectInput,
  Palette,
  PatternInput,
  RenderOptions,
  Style,
  Primitive,
  Scene,
  PatternKind,
  GradientStop,
  LinearGradient,
  RadialGradient,
  FillValue,
  ImageSource,
  RegionTransform,
} from './types';

export {
  longitudeToAngleDeg,
  polarToCartesian,
  longitudeToPoint,
  intersectSegments,
  mixHex,
  clamp,
  makeRng,
} from './geometry';

export {
  emptyScene,
  addLine,
  addCircle,
  addPath,
  addPolygon,
} from './scene';

export {
  DEFAULT_PALETTE,
  DEFAULT_ASPECT_COLORS,
  DEFAULT_PLANET_COLORS,
  resolvePalette,
  monochromePalette,
} from './palette/default';

export { aspectField } from './patterns/aspectField';
export type { AspectFieldOptions } from './patterns/aspectField';

export { starPolygon } from './patterns/starPolygon';
export type { StarPolygonOptions } from './patterns/starPolygon';

export { flowerOfLife } from './patterns/flowerOfLife';
export type { FlowerOfLifeOptions } from './patterns/flowerOfLife';

export { tiling, shapeFromAspect } from './patterns/tiling';
export type { TilingOptions, TileShape } from './patterns/tiling';

export { harmonograph } from './patterns/harmonograph';
export type { HarmonographOptions } from './patterns/harmonograph';

export { voronoi } from './patterns/voronoi';
export type { VoronoiOptions } from './patterns/voronoi';

export { composition } from './patterns/composition';
export type { CompositionOptions } from './patterns/composition';

export { classifyAspects } from './aspectClassifier';
export type { AspectTotals } from './aspectClassifier';

export { toSVG, toSVGElement } from './render/svg';
export { toCanvas } from './render/canvas';
