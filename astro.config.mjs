// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
  site: 'https://thelonius.github.io',
  // Disable the floating dev-mode toolbar — it overlaps content on tablet
  // viewports during preview shares. Production builds never include it.
  devToolbar: { enabled: false },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    mermaid({
      // The real colours come from CSS overrides in src/styles/global.css
      // that bind rendered SVG to live OKLCH tokens. The values below are a
      // no-op skin used only during mermaid's initial layout pass, before
      // our @layer components rules apply.
      theme: 'base',
      autoTheme: false,
      mermaidConfig: {
        themeVariables: {
          // mermaid v11 requires parseable colour values here — it inverts
          // them internally to derive secondary palette, so 'currentColor'
          // or 'transparent' break initialization with "Unsupported color
          // format" and the diagrams never render.
          //
          // We pass valid mid-grey hex placeholders; the actual colours come
          // from CSS overrides in src/styles/global.css that bind rendered
          // SVG to live OKLCH tokens via @layer components rules.
          background: '#1a1e24',
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