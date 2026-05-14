import type { Lang } from './ui';

export interface Section {
  id: string;
  label: string;
}

// Sidebar sections for markdown-rendered showcase pages (ShowcaseLayout).
// The ids for Problem/Approach/Architecture must match the heading slugs
// Astro's github-slugger generates from the <h2> text in the markdown body.
// Metrics/Stack/Links are emitted by ShowcaseLayout with explicit ids.
export const showcaseSections: Record<Lang, Section[]> = {
  en: [
    { id: 'problem', label: 'Problem' },
    { id: 'approach', label: 'Approach' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'stack', label: 'Stack' },
    { id: 'links', label: 'Links' },
  ],
  ru: [
    { id: 'задача', label: 'Задача' },
    { id: 'решение', label: 'Решение' },
    { id: 'архитектура', label: 'Архитектура' },
    { id: 'metrics', label: 'Метрики' },
    { id: 'stack', label: 'Стек' },
    { id: 'links', label: 'Ссылки' },
  ],
};
