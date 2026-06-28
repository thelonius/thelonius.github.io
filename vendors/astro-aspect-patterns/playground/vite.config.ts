import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  server: {
    port: 5174,
    host: '127.0.0.1',
    open: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
