export const REEL_EVENT = 'reel:open';

export interface ReelChapter {
  start: number;
  end: number;
  stage: number;
  slug?: string;
  title?: string;
}

export const REEL = {
  src: '/media/reel.mp4',
  poster: '/media/reel-poster.jpg',
  duration: 60,
  chapters: [
    { start: 0, end: 4, stage: 0 },
    { start: 4, end: 6, stage: 1 },
    { start: 6, end: 8, stage: 1, slug: 'portals', title: 'Portals' },
    { start: 8, end: 10, stage: 1, slug: 'hover-bikes-fire', title: 'Hover Bikes Fire' },
    { start: 10, end: 12, stage: 1, slug: 'matrix-code-rain', title: 'Matrix Code Rain' },
    { start: 12, end: 14, stage: 1, slug: 'buy-effect', title: 'Buy Effect' },
    { start: 14, end: 16, stage: 1, slug: 'jelly-shader', title: 'Jelly Shader' },
    { start: 16, end: 18, stage: 1, slug: 'world-spheres', title: 'World Spheres' },
    { start: 18, end: 19, stage: 1, slug: 'mirror-vr', title: 'Mirror VR' },
    { start: 19, end: 20, stage: 1, slug: 'tech-dissolve', title: 'Tech Dissolve' },
    { start: 20, end: 21, stage: 1, slug: 'teleportation-dash-vr', title: 'Teleportation Dash' },
    { start: 21, end: 22, stage: 1, slug: 'force-zones-vr', title: 'Force Zones' },
    { start: 22, end: 24, stage: 2 },
    { start: 24, end: 26, stage: 2, slug: 'bitdroid', title: 'BitDroid' },
    { start: 26, end: 28, stage: 2, slug: 'escuela-de-insultos', title: 'Escuela de Insultos' },
    { start: 28, end: 30, stage: 2, slug: 'inquilino-maldito', title: 'Inquilino Maldito' },
    { start: 30, end: 32, stage: 2, slug: 'race-against-the-time', title: 'Race Against the Time' },
    { start: 32, end: 34, stage: 2, slug: 'invasion-alienigena', title: 'Invasión Alienígena' },
    { start: 34, end: 36, stage: 2, slug: 'solo-en-la-sola-soledad', title: 'Solo en la Sola Soledad' },
    { start: 36, end: 38, stage: 3 },
    { start: 38, end: 40, stage: 3, slug: 'tinyagentoffice', title: 'TinyAgentOffice' },
    { start: 40, end: 42, stage: 3, slug: 'custom-gpts', title: 'Custom GPTs' },
    { start: 42, end: 44, stage: 3, slug: 'unity-essentials', title: 'Unity Essentials' },
    { start: 44, end: 46, stage: 3, slug: 'canvas-bend-points', title: 'Canvas Bend Points' },
    { start: 46, end: 48, stage: 4 },
    { start: 48, end: 54, stage: 4, slug: 'ninquiet-portfolio', title: 'ninquiet.com' },
    { start: 54, end: 60, stage: 5 },
  ] satisfies ReelChapter[],
};
