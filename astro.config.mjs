// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
  site: 'https://thelonius.github.io',
  integrations: [
    mermaid({
      // 'base' theme lets themeVariables take full control
      theme: 'base',
      // disable auto-switching so our custom palette stays fixed
      autoTheme: false,
      mermaidConfig: {
        themeVariables: {
          background: '#0f1216',
          primaryColor: '#1a1e24',
          primaryBorderColor: '#242932',
          primaryTextColor: '#e6e9ef',
          lineColor: '#7dd3fc',
          secondaryColor: '#1a1e24',
          tertiaryColor: '#1a1e24',
          edgeLabelBackground: '#1a1e24',
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});