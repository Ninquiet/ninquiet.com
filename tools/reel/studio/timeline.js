export const FPS = 30;
export const W = 1280;
export const H = 720;
export const DURATION = 60;
export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;

export const STAGES = {
  1: 'STAGE 1 · XR / VFX',
  2: 'STAGE 2 · GAMES',
  3: 'STAGE 3 · AI AGENTS',
  4: 'BOSS · NINQUIET.COM',
};

export const BOOT_LINES = [
  { t: 0.25, text: '> booting ninquiet.os', status: '' },
  { t: 0.7, text: '> unity · c# · hlsl ', status: 'OK' },
  { t: 1.15, text: '> shaders · vfx graph ', status: 'OK' },
  { t: 1.6, text: '> xr runtime ', status: 'OK' },
  { t: 2.05, text: '> ai agents ', status: 'ONLINE' },
  { t: 2.5, text: '> loading cartridges ', status: '100%' },
];

const yt = (id) => `yt720/${id}.mp4`;

export const SEGMENTS = [
  { kind: 'boot', start: 0, end: 4 },
  { kind: 'card', start: 4, end: 6, stage: 1, title: 'STAGE 1', subtitle: 'XR / VFX' },
  { kind: 'clip', start: 6, end: 8, stage: 1, slug: 'portals', title: 'Portals', src: yt('2QOjH1y26Dw'), from: 30 },
  { kind: 'clip', start: 8, end: 10, stage: 1, slug: 'hover-bikes-fire', title: 'Hover Bikes Fire', src: yt('NOSlHRmX7gs'), from: 131.5 },
  { kind: 'clip', start: 10, end: 12, stage: 1, slug: 'matrix-code-rain', title: 'Matrix Code Rain', src: yt('ro8pqshcnUw'), from: 17 },
  { kind: 'clip', start: 12, end: 14, stage: 1, slug: 'buy-effect', title: 'Buy Effect', src: yt('KvMahG42MJM'), from: 9.5 },
  { kind: 'clip', start: 14, end: 16, stage: 1, slug: 'jelly-shader', title: 'Jelly Shader', src: 'assets/jelly-shader.mp4', from: 1 },
  { kind: 'clip', start: 16, end: 18, stage: 1, slug: 'world-spheres', title: 'World Spheres', src: yt('6Qh3OYzmqDA'), from: 13 },
  { kind: 'clip', start: 18, end: 19, stage: 1, slug: 'mirror-vr', title: 'Mirror VR', src: yt('rm-tMkqEp4Q'), from: 46.5 },
  { kind: 'clip', start: 19, end: 20, stage: 1, slug: 'tech-dissolve', title: 'Tech Dissolve', src: yt('TQmGO0wJXqM'), from: 5 },
  { kind: 'clip', start: 20, end: 21, stage: 1, slug: 'teleportation-dash-vr', title: 'Teleportation Dash', src: yt('KGd9-G0b0Ik'), from: 51 },
  { kind: 'clip', start: 21, end: 22, stage: 1, slug: 'force-zones-vr', title: 'Force Zones', src: yt('oWufqkjh-GM'), from: 5 },
  { kind: 'card', start: 22, end: 24, stage: 2, title: 'STAGE 2', subtitle: 'GAMES' },
  { kind: 'clip', start: 24, end: 26, stage: 2, slug: 'bitdroid', title: 'BitDroid', src: yt('00tMO94JzMw'), from: 200, zoom: 1.25 },
  { kind: 'clip', start: 26, end: 28, stage: 2, slug: 'escuela-de-insultos', title: 'Escuela de Insultos', src: yt('vO3QHNyNFLE'), from: 40 },
  { kind: 'clip', start: 28, end: 30, stage: 2, slug: 'inquilino-maldito', title: 'Inquilino Maldito', src: yt('5BX8Hnrxqh0'), from: 75.5 },
  { kind: 'clip', start: 30, end: 32, stage: 2, slug: 'race-against-the-time', title: 'Race Against the Time', src: yt('yhKHteLQ37M'), from: 45.5 },
  { kind: 'clip', start: 32, end: 34, stage: 2, slug: 'swingi-bois', title: 'Swingi Bois Beta', src: 'assets/swingi-bois-gameplay.mp4', from: 6.8 },
  { kind: 'clip', start: 34, end: 36, stage: 2, slug: 'swingi-bois', title: 'Swingi Bois Beta', src: 'assets/swingi-bois-gameplay.mp4', from: 25.5 },
  { kind: 'card', start: 36, end: 38, stage: 3, title: 'STAGE 3', subtitle: 'AI AGENTS' },
  { kind: 'clip', start: 38, end: 40, stage: 3, slug: 'tinyagentoffice', title: 'TinyAgentOffice', src: 'assets/tinyagentoffice.mp4', from: 2 },
  { kind: 'counter', start: 40, end: 42, stage: 3, slug: 'custom-gpts', title: 'Custom GPTs', image: 'assets/gpts.jpg' },
  { kind: 'prompt', start: 42, end: 44, stage: 3, slug: 'unity-essentials', title: 'Unity Essentials', image: 'assets/unity-essentials.jpg' },
  { kind: 'clip', start: 44, end: 46, stage: 3, slug: 'canvas-bend-points', title: 'Canvas Bend Points', src: 'assets/canvas-bend-points.mp4', from: 1 },
  { kind: 'warning', start: 46, end: 48 },
  { kind: 'site', start: 48, end: 54, stage: 4, slug: 'ninquiet-portfolio', title: 'ninquiet.com', from: 3.4 },
  { kind: 'continue', start: 54, end: 60 },
];

export const COUNTDOWN_START = 54;
export const COIN_AT = 59;

export function segmentAt(t) {
  return SEGMENTS.find((s) => t >= s.start && t < s.end) ?? SEGMENTS.at(-1);
}

export function isProject(segment) {
  return Boolean(segment.slug);
}
