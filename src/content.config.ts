import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_IDS } from './data/categories';

const projects = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/projects', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      category: z.enum(CATEGORY_IDS),
      tags: z.array(z.string()).default([]),
      summary: z.string(),
      cover: image().optional(),
      video: z.string().startsWith('/media/').optional(),
      version: z.string().optional(),
      license: z.string().optional(),
      featured: z.boolean().default(false),
      legacy: z.boolean().default(false),
      links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    }),
});

export const collections = { projects };
