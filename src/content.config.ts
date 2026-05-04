import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    tagline: z.string(),
    period: z.string(),
    status: z.enum(['shipped', 'production', 'demo', 'live', 'open-source']),
    year: z.number(),

    hero: z.object({
      type: z.enum(['iframe', 'screencast', 'terminal', 'gif', 'image', 'github-og']),
      src: z.string().optional(),
      alt: z.string(),
      content: z.string().optional(),
      note: z.string().optional(),
    }),

    keyMetric: z.string().optional(),

    stack: z.array(z.string()),
    metrics: z.array(z.object({
      label: z.string(),
      value: z.string(),
      hint: z.string().optional(),
    })).optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
      kind: z.enum(['repo', 'demo', 'adr', 'article', 'video']),
    })),

    featured: z.boolean().default(false),
    deep: z.boolean().default(true),
    order: z.number(),

    description: z.string().max(160),
  }),
});

export const collections = { projects };
