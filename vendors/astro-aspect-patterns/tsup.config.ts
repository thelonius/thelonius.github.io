import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'patterns/aspectField': 'src/patterns/aspectField.ts',
    'patterns/starPolygon': 'src/patterns/starPolygon.ts',
    'patterns/flowerOfLife': 'src/patterns/flowerOfLife.ts',
    'patterns/tiling': 'src/patterns/tiling.ts',
    'patterns/harmonograph': 'src/patterns/harmonograph.ts',
    'patterns/voronoi': 'src/patterns/voronoi.ts',
    'patterns/composition': 'src/patterns/composition.ts',
    'render/svg': 'src/render/svg.ts',
    'render/canvas': 'src/render/canvas.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'es2020',
});
