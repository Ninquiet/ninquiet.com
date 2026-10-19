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
