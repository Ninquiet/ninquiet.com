export const PIXEL = 3;

export const PLAYER = {
  width: 30,
  height: 42,
  runSpeed: 330,
  groundAccel: 2800,
  airAccel: 1900,
  friction: 2600,
  gravity: 2300,
  maxFall: 1150,
  jumpVelocity: 1010,
  doubleJumpVelocity: 880,
  jumpCut: 0.45,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  dropTime: 0.22,
  stompBounce: 760,
  startInvulnerability: 1.2,
};

export const ENEMY = {
  width: 34,
  height: 24,
  speed: 215,
  accel: 1800,
  gravity: 2300,
  maxFall: 1150,
  jumpVelocity: 1010,
  spawnVelocity: 1250,
  thinkInterval: 0.12,
  reachHeight: 200,
  reachDistance: 280,
  spawnSchedule: [1.4, 7, 13, 20, 28, 36],
  maxAlive: 6,
  respawnDelay: 3,
  warningTime: 0.7,
};

export const STAR_SIZE = 24;

export const PLATFORM_SELECTORS = [
  '[data-bitdroid-perch]',
  '[data-bitdroid-ledge]',
  'main .hero .role',
  'main .hero .chips',
  'main [aria-label="Interactive terminal"]',
  'main .prompt',
  'main .card',
  'main .card .body',
  'main .card .tags',
  'main .more',
  'main .archive a',
  'main .commit',
  'main .cta',
  'main #contact .chips .tag',
  'main .mail',
  'body > footer',
];

export const GRAB_SELECTORS = [...PLATFORM_SELECTORS, 'main p', 'main h1', 'main h2', 'main li', 'main img', 'main video'];
export const GRAB_LINE_SELECTOR = 'main .section';

export const STAR_SELECTOR = 'main .card, main #contact .chips .tag';
export const PERCH_SELECTOR = '[data-bitdroid-perch]';
export const HEADER_SELECTOR = 'body > header';

export const DRONE = {
  width: 30,
  height: 26,
  patrolSpeed: 85,
  pursueSpeed: 235,
  returnSpeed: 160,
  fleeSpeed: 170,
  maxForce: 560,
  detectRadius: 230,
  loseRadius: 420,
  fleeRadius: 110,
  alertTime: 0.45,
  slowRadius: 70,
  hover: 46,
  gameCount: 4,
  maxGame: 5,
  respawnDelay: 6,
  ambientMax: 3,
  ambientFirstSpawn: 5,
  ambientInterval: [9, 18] as const,
  ambientLifetime: [40, 70] as const,
};

export const ZAP_RADIUS = 34;
export const CHAIN_RADIUS = 115;
export const CHAIN_DELAY = 0.12;

export const SPIDER = {
  hitbox: 60,
  speed: 145,
  accel: 700,
  fallGravity: 1500,
  wakeRadius: 380,
  wakeTime: 0.8,
  lungeRadius: 150,
  lungeBoost: 1.7,
  thigh: 36,
  shin: 42,
  hipRadius: 12,
  idealReach: 54,
  stepThreshold: 30,
  stepTime: 0.15,
  regrabInterval: 0.25,
  minGrip: 2,
  hp: 3,
  speedByStage: [1, 1.4, 1.85],
  hitRadius: 50,
  perchSelector: 'main #contact .cta',
}
