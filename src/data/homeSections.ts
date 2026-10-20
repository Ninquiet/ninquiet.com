import type { CategoryId } from './categories';

export interface HomeSection {
  id: string;
  prompt: string;
  categories: CategoryId[];
  limit: number;
}

export const HOME_SECTIONS: HomeSection[] = [
  { id: 'agents', prompt: 'ls -la ~/projects --agents --tools', categories: ['agents', 'tools'], limit: 6 },
  { id: 'xr', prompt: 'ls ~/projects --xr --vfx', categories: ['xr', 'vfx'], limit: 6 },
  { id: 'games', prompt: 'ls ~/projects --games', categories: ['games'], limit: 3 },
];
