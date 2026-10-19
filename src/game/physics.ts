export interface Platform {
  x: number;
  y: number;
  w: number;
  floor?: boolean;
}

export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  ground: Platform | null;
  dropTimer: number;
  dropY: number;
}

export interface World {
  platforms: Platform[];
  rects: { x: number; y: number; w: number; h: number }[];
  width: number;
  bottom: number;
}

export function createBody(w: number, h: number): Body {
  return { x: 0, y: 0, w, h, vx: 0, vy: 0, onGround: false, ground: null, dropTimer: 0, dropY: -1 };
}

export const centerX = (body: Body) => body.x + body.w / 2;
export const feetY = (body: Body) => body.y + body.h;

export function overlaps(a: Body, b: Body, inset = 0): boolean {
  return a.x + inset < b.x + b.w - inset && a.x + a.w - inset > b.x + inset && a.y + inset < b.y + b.h - inset && a.y + a.h - inset > b.y + inset;
}

export function dropThrough(body: Body, duration: number): void {
  if (!body.ground || body.ground.floor) return;
  body.dropY = body.ground.y;
  body.dropTimer = duration;
  body.onGround = false;
  body.ground = null;
  body.y += 2;
}

export function step(body: Body, dt: number, world: World, gravity: number, maxFall: number): boolean {
  const wasOnGround = body.onGround;
  body.dropTimer = Math.max(0, body.dropTimer - dt);
  body.vy = Math.min(body.vy + gravity * dt, maxFall);
  body.x = Math.min(Math.max(body.x + body.vx * dt, 0), world.width - body.w);

  const prevFeet = body.y + body.h;
  body.y += body.vy * dt;
  body.onGround = false;
  body.ground = null;

  if (body.vy >= 0) {
    const feet = body.y + body.h;
    let landing: Platform | null = null;
    for (const platform of world.platforms) {
      if (body.dropTimer > 0 && !platform.floor && Math.abs(platform.y - body.dropY) < 1) continue;
      if (body.x + body.w <= platform.x || body.x >= platform.x + platform.w) continue;
      if (prevFeet <= platform.y + 1 && feet >= platform.y && (!landing || platform.y < landing.y)) landing = platform;
    }
    if (landing) {
      body.y = landing.y - body.h;
      body.vy = 0;
      body.onGround = true;
      body.ground = landing;
    }
  }

  if (body.y + body.h > world.bottom) {
    body.y = world.bottom - body.h;
    body.vy = 0;
    body.onGround = true;
    body.ground = { x: 0, y: world.bottom, w: world.width, floor: true };
  }

  return !wasOnGround && body.onGround;
}
