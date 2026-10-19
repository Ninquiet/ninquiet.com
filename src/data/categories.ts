export const CATEGORY_IDS = ['agents', 'tools', 'xr', 'vfx', 'games', 'ui-ux', 'web', 'branding', 'motion', 'art'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  agents: 'ai agents',
  tools: 'dev tools',
  xr: 'xr',
  vfx: 'vfx / shaders',
  games: 'games',
  'ui-ux': 'ui / ux',
  web: 'web',
  branding: 'branding',
  motion: 'motion',
  art: 'art',
};

export const CATEGORY_EXTENSIONS: Record<CategoryId, string> = {
  agents: '/',
  tools: '.ts',
  xr: '.unity',
  vfx: '.shader',
  games: '.unity',
  'ui-ux': '.fig',
  web: '.html',
  branding: '.ai',
  motion: '.mp4',
  art: '.psd',
};
