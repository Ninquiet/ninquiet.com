import { PIXEL } from './constants';
import { buildSprite, type Palette, type Sprite } from './pixelArt';

export type Eyes = 'forward' | 'center' | 'back' | 'blink' | 'hurt';
export type Arms = 'down' | 'up' | 'swingA' | 'swingB';
export type Legs = 'stand' | 'runA' | 'runB' | 'runC' | 'jump' | 'fall';

export interface RobotPose {
  eyes: Eyes;
  arms: Arms;
  legs: Legs;
  antennaLight: boolean;
  antennaSway: -1 | 0 | 1;
  headDrop: 0 | 1;
  chestLight: boolean;
}

const ROBOT_PALETTE: Palette = {
  K: '#1a2040',
  W: '#eef3ff',
  G: '#a3acd1',
  D: '#59618a',
  B: '#0f2433',
  E: '#7ff6ff',
  e: '#2f8f99',
  P: '#ff4fb8',
  p: '#7a2457',
  X: '#ff3355',
};

const EYE_ROWS: Record<Eyes, [string, string]> = {
  forward: ['BBBEBE', 'BBBEBE'],
  center: ['BEBBEB', 'BEBBEB'],
  back: ['EBEBBB', 'EBEBBB'],
  blink: ['BBBBBB', 'BeBBeB'],
  hurt: ['BXBBXB', 'XBXXBX'],
};

const ARM_ROWS: Record<Arms, string[]> = {
  down: ['....KGGGGGGK....', '...DKGW##WGKD...', '...D.KGGGGK.D...'],
  up: ['..D.KGGGGGGK.D..', '...DKGW##WGKD...', '.....KGGGGK.....'],
  swingA: ['....KGGGGGGK....', '..D.KGW##WGKDD..', '.D...KGGGGK.....'],
  swingB: ['....KGGGGGGK....', '..DDKGW##WGK.D..', '.....KGGGGK...D.'],
};

const LEG_ROWS: Record<Legs, string[]> = {
  stand: ['.....DD..GG.....', '.....DD..GG.....', '....DDD..GGG....'],
  runA: ['.....DD...GG....', '....DD.....GG...', '...DD.......GGG.'],
  runB: ['......DDGG......', '......DDGG......', '.....DDDGGG.....'],
  runC: ['.....GG...DD....', '....GG.....DD...', '...GGG......DD..'],
  jump: ['.....DDGG.......', '....DD..GG......', '...DD....GG.....'],
  fall: ['.....DD..GG.....', '....DD....GG....', '....D......G....'],
};

function headRows(pose: RobotPose): string[] {
  const [eyesTop, eyesBottom] = EYE_ROWS[pose.eyes];
  const light = pose.antennaLight ? 'P' : 'p';
  const antenna = '.'.repeat(7 + pose.antennaSway) + light + '.'.repeat(8 - pose.antennaSway);
  return [
    antenna,
    '.......D........',
    '.....KKKKKK.....',
    '....KWWWWWWK....',
    '...KGWWWWWWWK...',
    '...KGBBBBBBWK...',
    `..DKG${eyesTop}WK...`,
    `..DKG${eyesBottom}WK...`,
    '...KGWWWWWWWK...',
    '....KKWWWWKK....',
  ];
}

function overlay(base: string[], top: string[], offset: number): string[] {
  const rows = base.map((row) => row.split(''));
  top.forEach((row, y) => {
    const target = rows[y + offset];
    if (!target) return;
    for (let x = 0; x < row.length; x++) if (row[x] !== '.') target[x] = row[x];
  });
  return rows.map((row) => row.join(''));
}

function robotRows(pose: RobotPose): string[] {
  const chest = pose.chestLight ? 'PP' : 'pp';
  const body = [...ARM_ROWS[pose.arms].map((row) => row.replace('##', chest)), ...LEG_ROWS[pose.legs]];
  const base = [...Array<string>(10).fill('.'.repeat(16)), ...body];
  return overlay(base, headRows(pose), pose.headDrop);
}

const robotCache = new Map<string, Sprite>();

export function robotSprite(pose: RobotPose): Sprite {
  const key = `${pose.eyes}|${pose.arms}|${pose.legs}|${pose.antennaLight}|${pose.antennaSway}|${pose.headDrop}|${pose.chestLight}`;
  let sprite = robotCache.get(key);
  if (!sprite) {
    sprite = buildSprite(robotRows(pose), ROBOT_PALETTE, PIXEL);
    robotCache.set(key, sprite);
  }
  return sprite;
}

const BUG_PALETTE: Palette = {
  K: '#14051f',
  M: '#c13cff',
  m: '#6b1c99',
  R: '#ff2244',
  W: '#ffffff',
};

const BUG_BODY = [
  '...K......K...',
  '....K....K....',
  '....KKKKKK....',
  '...KMMMMMMK...',
  '..KMMMMMRRMK..',
  '..KMMMMMRWMK..',
  '..KmMMMMMMMK..',
  '...KmmmmmmK...',
];

const BUG_LEGS = {
  a: ['..K.K.K.K.K...', '.K.K.K.K.K....'],
  b: ['...K.K.K.K.K..', '....K.K.K.K.K.'],
};

let bugFrames: [Sprite, Sprite] | null = null;

export function bugSprite(frame: 0 | 1): Sprite {
  bugFrames ??= [
    buildSprite([...BUG_BODY, ...BUG_LEGS.a], BUG_PALETTE, PIXEL),
    buildSprite([...BUG_BODY, ...BUG_LEGS.b], BUG_PALETTE, PIXEL),
  ];
  return bugFrames[frame];
}

export const BUG_COLORS = ['#c13cff', '#6b1c99', '#ff2244', '#ffffff'];

export type DroneLook = -1 | 0 | 1;

const DRONE_PALETTE: Palette = {
  K: '#122008',
  G: '#a6ff3c',
  g: '#5fae14',
  W: '#f2ffe0',
  E: '#ff9f1c',
  R: '#ff2244',
  P: '#1a0a00',
  L: '#ffd166',
  b: '#c9d1e0',
};

const DRONE_EYES: Record<DroneLook, [string, string, string]> = {
  [-1]: ['IIIWW', 'PIIWW', 'IIIWW'],
  [0]: ['WIIIW', 'WIPIW', 'WIIIW'],
  [1]: ['WWIII', 'WWIIP', 'WWIII'],
};

function droneRows(propeller: 0 | 1, look: DroneLook, alert: boolean): string[] {
  const iris = alert ? 'R' : 'E';
  const [top, mid, bottom] = DRONE_EYES[look].map((row) => row.replace(/I/g, iris));
  return [
    propeller === 0 ? '..bbbbKbbbb..' : '....bbKbb....',
    '......K......',
    '....KKKKK....',
    '..KgGGGGGgK..',
    '.KgGWWWWWGgK.',
    `.KGW${top}WGK.`,
    `KgGW${mid}WGgK`,
    `.KGW${bottom}WGK.`,
    '.KgGWWWWWGgK.',
    '..KgGGGGGgK..',
    '...KLKKKLK...',
  ];
}

const droneCache = new Map<string, Sprite>();

export function droneSprite(propeller: 0 | 1, look: DroneLook, alert: boolean): Sprite {
  const key = `${propeller}|${look}|${alert}`;
  let sprite = droneCache.get(key);
  if (!sprite) {
    sprite = buildSprite(droneRows(propeller, look, alert), DRONE_PALETTE, PIXEL);
    droneCache.set(key, sprite);
  }
  return sprite;
}

export const DRONE_COLORS = ['#a6ff3c', '#5fae14', '#ff9f1c', '#f2ffe0'];

const SPIDER_ROWS = [
  '......KKKKKK........',
  '....KKAAAAAAKK......',
  '...KAAAAaaAAAAK.....',
  '..KAAaAAAAAAaAAK....',
  '.KAAAAAAaaAAAAAKKKK.',
  '.KAAaAAAAAAAAaAKHHHK',
  '.KAAAAAaaaaAAAAKHEEK',
  '.KAAAAAAAAAAAAAKHHEK',
  '..KAAaAAAAAAaAAKKKK.',
  '...KAAAAaaAAAAK.....',
  '....KKAAAAAAKK......',
  '......KKKKKK........',
];

export interface SpiderSkin {
  body: Palette;
  near: string;
  far: string;
  colors: string[];
}

export const SPIDER_SKINS: SpiderSkin[] = [
  { body: { K: '#0d0718', A: '#3d1c6e', a: '#7a3cff', H: '#24103f', E: '#5ce1e6' }, near: '#6a36b8', far: '#2a1450', colors: ['#7a3cff', '#3d1c6e', '#5ce1e6'] },
  { body: { K: '#1f0a02', A: '#c2410c', a: '#ff8a1c', H: '#7c2d12', E: '#fff3b0' }, near: '#ea580c', far: '#7c2d12', colors: ['#ff8a1c', '#c2410c', '#fff3b0'] },
  { body: { K: '#1f0505', A: '#b91c1c', a: '#ff4d6d', H: '#7f1d1d', E: '#ffffff' }, near: '#ef4444', far: '#7f1d1d', colors: ['#ff4d6d', '#b91c1c', '#ffffff'] },
];

const SPIDER_FLASH: Palette = { K: '#ffffff', A: '#ffffff', a: '#ffffff', H: '#ffffff', E: '#ffffff' };
const spiderCache = new Map<string, Sprite>();

export function spiderSprite(stage: number, flash: boolean): Sprite {
  const key = flash ? 'flash' : String(stage);
  let sprite = spiderCache.get(key);
  if (!sprite) {
    sprite = buildSprite(SPIDER_ROWS, flash ? SPIDER_FLASH : SPIDER_SKINS[stage].body, PIXEL);
    spiderCache.set(key, sprite);
  }
  return sprite;
}

const STAR_ROWS = [
  '....K....',
  '...KYK...',
  'KKKKWKKKK',
  'KYYYWYYYK',
  '.KYYYYYK.',
  '..KYOYK..',
  '.KYOKOYK.',
  '.KOK.KOK.',
  '.KK...KK.',
];

const STAR_PALETTE: Palette = { K: '#3a2400', Y: '#ffd84a', W: '#fffbe0', O: '#e8a317' };

let star: Sprite | null = null;

export function starSprite(): Sprite {
  star ??= buildSprite(STAR_ROWS, STAR_PALETTE, PIXEL);
  return star;
}

export const STAR_COLORS = ['#ffd84a', '#fffbe0', '#e8a317'];
export const ROBOT_COLORS = ['#eef3ff', '#a3acd1', '#7ff6ff', '#ff4fb8'];
