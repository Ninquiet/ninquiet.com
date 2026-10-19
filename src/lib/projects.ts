import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORY_EXTENSIONS } from '../data/categories';
import type { ProjectEntry } from './terminal/types';

export type Project = CollectionEntry<'projects'>;

export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function pickForSection(projects: Project[], categories: string[], limit: number): { shown: Project[]; rest: number } {
  const matching = projects.filter((project) => categories.includes(project.data.category));
  const ordered = [...matching.filter((p) => p.data.featured), ...matching.filter((p) => !p.data.featured)];
  return { shown: ordered.slice(0, limit), rest: Math.max(0, matching.length - limit) };
}

export function relatedProjects(project: Project, all: Project[], count: number): Project[] {
  const rank = (p: Project) => (p.data.category === project.data.category ? 0 : 2) + (p.data.featured ? 0 : 1);
  return all
    .filter((p) => p.id !== project.id)
    .sort((a, b) => rank(a) - rank(b) || b.data.date.getTime() - a.data.date.getTime())
    .slice(0, count);
}

export function fileName(project: Project): string {
  const extension = CATEGORY_EXTENSIONS[project.data.category];
  return extension === '/' ? `${project.id}/` : `${project.id}${extension}`;
}

export function permissions(project: Project): string {
  return CATEGORY_EXTENSIONS[project.data.category] === '/' ? 'drwxr-xr-x' : '-rw-r--r--';
}

export function toTerminalEntry(project: Project): ProjectEntry {
  return {
    slug: project.id,
    title: project.data.title,
    category: project.data.category,
    extension: CATEGORY_EXTENSIONS[project.data.category],
    year: project.data.date.getFullYear(),
  };
}
