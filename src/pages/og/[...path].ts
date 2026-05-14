import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const projects = await getCollection('projects');

const pages: Record<string, { title: string; description: string }> = {
  home: {
    title: 'Ed Dubnitsky — AI/ML Engineer',
    description: 'Production RAG, computer vision, multi-provider LLM. Five case studies.',
  },
};

// Only the English entries (collection root) get OG images; Russian
// translations live under ru/ and reuse the same image per slug.
projects.forEach(p => {
  if (p.data.deep && !p.id.includes('/')) {
    pages[p.data.slug] = {
      title: p.data.title,
      description: p.data.description,
    };
  }
});

const route = await OGImageRoute({
  param: 'path',
  pages,
  getImageOptions: (_, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[15, 18, 22], [26, 30, 36]],
    border: { color: [125, 211, 252], width: 4, side: 'inline-start' },
    padding: 80,
    font: {
      title: {
        color: [230, 233, 239],
        size: 56,
        weight: 'Bold',
        families: ['Inter', 'JetBrains Mono'],
      },
      description: {
        color: [138, 148, 167],
        size: 28,
        families: ['Inter'],
      },
    },
  }),
});

export const getStaticPaths = route.getStaticPaths;
export const GET = route.GET;
