# astro-aspect-patterns

Framework-agnostic generator of geometric patterns driven by astrological
aspects. Feed in planet positions and aspects, get back a scene-graph of
primitives (circles, lines, polygons, paths), then render with the built-in
SVG or Canvas renderer.

The library does not compute positions or aspects — it consumes them. Bring
your own ephemeris.

## Install

```bash
npm install astro-aspect-patterns
```

ESM and CJS, zero runtime dependencies.

## Quick start — Canvas

```ts
import { aspectField, toCanvas } from 'astro-aspect-patterns';

const canvas = document.getElementById('chart') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const scene = aspectField(
  {
    planets: [
      { id: 'Sun',  longitude: 12.4 },
      { id: 'Moon', longitude: 145.2 },
      { id: 'Mars', longitude: 78.6 },
    ],
    aspects: [
      { from: 'Sun',  to: 'Moon', angle: 120, orb: 1.3 },
      { from: 'Sun',  to: 'Mars', angle: 60,  orb: 0.4 },
    ],
  },
  { width: canvas.width, height: canvas.height, standalone: true },
);

toCanvas(scene, ctx);
```

### Same scene as SVG string

```ts
import { aspectField, toSVG } from 'astro-aspect-patterns';

const svg = toSVG(aspectField(input, { width: 600, height: 600, standalone: true }));
document.getElementById('chart')!.innerHTML = svg;
```

For SVG-in-Node (e.g. rendering bot images server-side), pipe the string into
[`resvg-js`](https://github.com/yisibl/resvg-js) to get PNG.

## Playground

```bash
npm run playground
```

Spins up a Vite dev server with a live canvas, all options exposed as
sliders, and presets (random, grand cross, grand trine, dense). Useful
for tuning visuals before wiring the library into a host app.

## Patterns

Currently shipped:

- **`aspect-field`** — chords between aspected planets, with soft halo
  glows at chord intersections. Designed to overlay an existing chart
  wheel; pass `standalone: true` if you want it to draw its own background
  and ring guideline.

Planned (see `docs/GEOMETRIC_PATTERNS.md` in the source repo):

- `star-polygon` — {n/k} aspect-driven star polygons stacked by aspect weight
- `tiling` — regular and Penrose tilings chosen by dominant aspect
- `flower-of-life` — overlapping circles per aspected planet pair
- `harmonograph` — Lissajous sums with frequency ratios from aspect types
- `voronoi` — planet-seeded Voronoi cells weighted by dignity

## API

### `aspectField(input, options) → Scene`

- `input.planets: PlanetPosition[]` — `{ id, longitude (0..360), speed?, dignity? }`
- `input.aspects: AspectInput[]` — `{ from, to, angle, orb, strength? }`
- `input.palette?: Palette` — overrides for planet, aspect, sign colors

`options`:

- `width`, `height` — viewport in px
- `rotation?` — wheel rotation in degrees (use `ascendantLongitude` to
  put the ASC at 9 o'clock)
- `ringRadius?` — planet ring as fraction of `min(width, height)`. Default `0.32`
- `maxOrb?` — orb at which strength reaches zero. Default `8`
- `chordWidth?` — base chord stroke width at strength=1. Default `1.6`
- `haloOpacity?`, `haloRadius?` — halo glow at chord intersections
- `standalone?` — include background + ring guideline

### Renderers

```ts
import { toSVG, toSVGElement, toCanvas } from 'astro-aspect-patterns';

toSVG(scene);                  // → string
toSVG(scene, { inner: true }); // fragment without <svg> wrapper
toSVGElement(scene);           // → SVGSVGElement (browser only)
toCanvas(scene, ctx2d);        // mutates the canvas context
```

## License

MIT
