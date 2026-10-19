import type { Sfx } from './audio';
import { PIXEL, SPIDER } from './constants';
import type { Point } from './domWorld';
import type { Effects } from './effects';
import type { Hostile, HostileContext, HostileView } from './hostile';
import { drawSprite } from './pixelArt';
import { createBody, type World } from './physics';
import { SPIDER_SKINS, spiderSprite } from './sprites';
import { add, distance, length, normalize, scale, sub, type Vec } from './steering';

type State = 'dormant' | 'waking' | 'crawl' | 'dead';

interface LegSpec {
  angle: number;
  group: 0 | 1;
}

const DEG = Math.PI / 180;
const LEGS: LegSpec[] = [
  { angle: -40 * DEG, group: 0 },
  { angle: -95 * DEG, group: 1 },
  { angle: -150 * DEG, group: 0 },
  { angle: 40 * DEG, group: 1 },
  { angle: 95 * DEG, group: 0 },
  { angle: 150 * DEG, group: 1 },
];

const LABELS: Record<State, string> = { dormant: 'SLEEP', waking: 'WAKE', crawl: 'CRAWL', dead: '' };
const MAX_REACH = SPIDER.thigh + SPIDER.shin;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const snap = (v: number) => Math.round(v / PIXEL) * PIXEL;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const polar = (angle: number, radius: number): Vec => ({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });

function lerpAngle(from: number, to: number, k: number): number {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * k;
}

function closestOnPerimeter(r: { x: number; y: number; w: number; h: number }, p: Vec): Vec {
  const cx = clamp(p.x, r.x, r.x + r.w);
  const cy = clamp(p.y, r.y, r.y + r.h);
  if (cx !== p.x || cy !== p.y) return { x: cx, y: cy };
  const left = p.x - r.x;
  const right = r.x + r.w - p.x;
  const top = p.y - r.y;
  const bottom = r.y + r.h - p.y;
  const min = Math.min(left, right, top, bottom);
  if (min === left) return { x: r.x, y: p.y };
  if (min === right) return { x: r.x + r.w, y: p.y };
  if (min === top) return { x: p.x, y: r.y };
  return { x: p.x, y: r.y + r.h };
}

export function findGrip(world: World, ideal: Vec, hip: Vec): Vec | null {
  let best: Vec | null = null;
  let bestDistance = Infinity;
  const consider = (point: Vec) => {
    if (distance(hip, point) > MAX_REACH * 0.98) return;
    const d = distance(point, ideal);
    if (d < bestDistance) {
      bestDistance = d;
      best = point;
    }
  };
  for (const rect of world.rects) consider(closestOnPerimeter(rect, ideal));
  consider({ x: 0, y: ideal.y });
  consider({ x: world.width, y: ideal.y });
  return best;
}

export function solveKnee(hip: Vec, foot: Vec, body: Vec): Vec {
  const dx = foot.x - hip.x;
  const dy = foot.y - hip.y;
  const reach = clamp(Math.hypot(dx, dy), Math.abs(SPIDER.thigh - SPIDER.shin) + 0.01, MAX_REACH - 0.01);
  const base = Math.atan2(dy, dx);
  const cos = (SPIDER.thigh ** 2 + reach ** 2 - SPIDER.shin ** 2) / (2 * SPIDER.thigh * reach);
  const bend = Math.acos(clamp(cos, -1, 1));
  const a = add(hip, polar(base - bend, SPIDER.thigh));
  const b = add(hip, polar(base + bend, SPIDER.thigh));
  return distance(a, body) > distance(b, body) ? a : b;
}

class Leg {
  foot: Vec = { x: 0, y: 0 };
  gripped = false;
  private from: Vec = { x: 0, y: 0 };
  private to: Vec = { x: 0, y: 0 };
  private toGrip = false;
  private t = -1;
  private lastTry = 0;

  constructor(readonly spec: LegSpec) {}

  get stepping(): boolean {
    return this.t >= 0;
  }

  get planted(): boolean {
    return !this.stepping && this.gripped;
  }

  hip(center: Vec, heading: number): Vec {
    return add(center, polar(heading + this.spec.angle, SPIDER.hipRadius));
  }

  ideal(center: Vec, heading: number, curl: number, velocity: Vec): Vec {
    return add(add(center, polar(heading + this.spec.angle, SPIDER.idealReach * curl)), scale(velocity, 0.22));
  }

  canRetry(time: number): boolean {
    return time - this.lastTry > SPIDER.regrabInterval;
  }

  reach(to: Vec, grip: boolean, time: number): void {
    this.from = { ...this.foot };
    this.to = to;
    this.toGrip = grip;
    this.gripped = false;
    this.lastTry = time;
    this.t = 0;
  }

  advance(dt: number, duration: number, center: Vec): void {
    if (this.t < 0) return;
    this.t = Math.min(1, this.t + dt / duration);
    const k = easeInOut(this.t);
    const along = sub(this.to, this.from);
    const outward = normalize(sub(add(this.from, scale(along, 0.5)), center));
    const lift = Math.sin(Math.PI * this.t) * 10;
    this.foot = add(add(this.from, scale(along, k)), scale(outward, lift));
    if (this.t >= 1) {
      this.t = -1;
      this.gripped = this.toGrip;
    }
  }
}

export class Spider implements Hostile {
  readonly body = createBody(SPIDER.hitbox, SPIDER.hitbox * 0.72);
  readonly hitRadius = SPIDER.hitRadius;
  private readonly legs = LEGS.map((spec) => new Leg(spec));
  private position: Vec;
  private velocity: Vec = { x: 0, y: 0 };
  private heading = -Math.PI / 2;
  private state: State = 'dormant';
  private hp = SPIDER.hp;
  private time = 0;
  private stateTime = 0;
  private flash = 0;
  private placed = false;

  constructor(x: number, surfaceY: number) {
    this.position = { x, y: surfaceY - 10 };
    this.syncBody();
  }

  get alive(): boolean {
    return this.state !== 'dead';
  }

  get dead(): boolean {
    return this.state === 'dead';
  }

  get harmful(): boolean {
    return this.state === 'crawl';
  }

  private get stage(): number {
    return SPIDER.hp - Math.max(1, this.hp);
  }

  private get speedFactor(): number {
    return SPIDER.speedByStage[this.stage];
  }

  center(): Point {
    return { ...this.position };
  }

  private setState(state: State): void {
    this.state = state;
    this.stateTime = 0;
  }

  private curl(): number {
    if (this.state === 'dormant') return 0.55 + Math.sin(this.time * 2) * 0.03;
    if (this.state === 'waking') return 0.55 + 0.45 * Math.min(1, this.stateTime / SPIDER.wakeTime);
    return 1;
  }

  private grip(): number {
    return this.legs.filter((leg) => leg.planted).length;
  }

  update(c: HostileContext): void {
    this.time += c.dt;
    this.stateTime += c.dt;
    this.flash = Math.max(0, this.flash - c.dt);
    if (this.state === 'dead') return;
    if (!this.placed) this.placeLegs(c.world);

    const target = c.target ? { x: c.target.x + c.target.w / 2, y: c.target.y + c.target.h / 2 } : null;
    if (this.state === 'dormant' && target && distance(this.position, target) < SPIDER.wakeRadius) this.wake(c);
    if (this.state === 'waking') {
      if (target) this.heading = lerpAngle(this.heading, Math.atan2(target.y - this.position.y, target.x - this.position.x), Math.min(1, c.dt * 4));
      if (this.stateTime >= SPIDER.wakeTime) this.setState('crawl');
    }
    if (this.state === 'crawl') this.crawl(c, target);

    this.updateLegs(c);
    this.syncBody();
  }

  private placeLegs(world: World): void {
    this.placed = true;
    for (const leg of this.legs) {
      const ideal = leg.ideal(this.position, this.heading, this.curl(), this.velocity);
      const grip = findGrip(world, ideal, leg.hip(this.position, this.heading));
      leg.foot = grip ?? ideal;
      leg.gripped = grip !== null;
    }
  }

  private wake(c: HostileContext): void {
    this.setState('waking');
    c.effects.popup('!!', this.position.x, this.position.y - 44, '#ff2244');
    c.sfx.alert();
  }

  private crawl(c: HostileContext, target: Vec | null): void {
    const grip = this.grip();
    const holding = grip >= SPIDER.minGrip;
    if (holding && target) {
      const toTarget = sub(target, this.position);
      const lunge = length(toTarget) < SPIDER.lungeRadius ? SPIDER.lungeBoost : 1;
      const traction = 0.3 + 0.7 * (grip / this.legs.length);
      const desired = scale(normalize(toTarget), SPIDER.speed * this.speedFactor * traction * lunge);
      const steer = sub(desired, this.velocity);
      const maxStep = SPIDER.accel * this.speedFactor * c.dt;
      const steerLength = length(steer);
      this.velocity = add(this.velocity, steerLength > maxStep ? scale(steer, maxStep / steerLength) : steer);
    } else if (!holding) {
      this.velocity = { x: this.velocity.x * 0.98, y: this.velocity.y + SPIDER.fallGravity * c.dt };
    }

    const overreached = this.legs.some((leg) => leg.planted && distance(leg.hip(this.position, this.heading), leg.foot) > MAX_REACH);
    if (overreached && holding) this.velocity = scale(this.velocity, 0.55);

    this.position = add(this.position, scale(this.velocity, c.dt));
    this.position.x = clamp(this.position.x, 30, c.world.width - 30);
    this.position.y = clamp(this.position.y, 40, c.world.bottom - 30);
    if (this.position.y >= c.world.bottom - 30) this.velocity.y = Math.min(0, this.velocity.y);
    if (length(this.velocity) > 25) this.heading = lerpAngle(this.heading, Math.atan2(this.velocity.y, this.velocity.x), Math.min(1, c.dt * 6));
  }

  private updateLegs(c: HostileContext): void {
    const curl = this.curl();
    const falling = this.grip() < SPIDER.minGrip && this.state === 'crawl';
    const stepTime = SPIDER.stepTime / this.speedFactor;
    for (const leg of this.legs) {
      const hip = leg.hip(this.position, this.heading);
      const ideal = leg.ideal(this.position, this.heading, curl, this.velocity);
      if (!leg.stepping) {
        const otherGroupStepping = this.legs.some((other) => other.stepping && other.spec.group !== leg.spec.group);
        const drifted = distance(leg.foot, ideal) > (this.state === 'waking' ? 8 : SPIDER.stepThreshold);
        const overreached = distance(hip, leg.foot) > MAX_REACH;
        const loose = !leg.gripped && leg.canRetry(this.time);
        if ((drifted || overreached || loose) && (falling || !otherGroupStepping)) {
          const grip = findGrip(c.world, ideal, hip);
          leg.reach(grip ?? ideal, grip !== null, this.time);
        }
      }
      leg.advance(c.dt, stepTime, this.position);
      if (!leg.stepping && !leg.gripped && distance(hip, leg.foot) > MAX_REACH) {
        const dir = normalize(sub(leg.foot, hip));
        leg.foot = add(hip, scale(dir, MAX_REACH));
      }
    }
  }

  private syncBody(): void {
    this.body.x = this.position.x - this.body.w / 2;
    this.body.y = this.position.y - this.body.h / 2;
    this.body.vx = this.velocity.x;
    this.body.vy = this.velocity.y;
  }

  hit(effects: Effects, sfx: Sfx): boolean {
    if (this.state === 'dead') return true;
    this.hp -= 1;
    if (this.hp <= 0) {
      this.explode(effects, sfx);
      return true;
    }
    const me = this.position;
    this.flash = 0.18;
    effects.sparkle(me.x, me.y, SPIDER_SKINS[this.stage].colors);
    effects.popup(this.hp === 1 ? '1 HIT LEFT!' : `${this.hp} HITS LEFT`, me.x, me.y - 50, SPIDER_SKINS[this.stage].colors[0]);
    effects.shake = Math.max(effects.shake, 6);
    sfx.stomp();
    if (this.state === 'dormant') this.setState('waking');
    this.velocity = add(this.velocity, scale(normalize({ x: -Math.cos(this.heading), y: -Math.sin(this.heading) }), 220));
    return false;
  }

  explode(effects: Effects, sfx: Sfx): void {
    if (this.state === 'dead') return;
    const me = this.position;
    const colors = SPIDER_SKINS[this.stage].colors;
    this.state = 'dead';
    effects.explode(me.x, me.y, colors);
    effects.explode(me.x - 30, me.y + 10, [...colors, '#ffffff']);
    effects.explode(me.x + 30, me.y - 6, colors);
    effects.shake = Math.max(effects.shake, 18);
    sfx.explode();
  }

  draw(ctx: CanvasRenderingContext2D, view: HostileView): void {
    if (this.state === 'dead') return;
    const me = this.position;
    const skin = SPIDER_SKINS[this.stage];
    const flashing = this.flash > 0;
    for (const leg of this.legs) this.drawLeg(ctx, leg, flashing ? '#ffffff' : leg.spec.group === 0 ? skin.near : skin.far);
    const sprite = spiderSprite(this.stage, flashing);
    const facingRight = Math.cos(this.heading) >= 0;
    const jitter = this.stage === 2 && Math.floor(this.time * 20) % 4 === 0 ? 2 : 0;
    drawSprite(ctx, sprite, me.x + jitter, me.y + sprite.height / 2, {
      facing: facingRight ? 1 : -1,
      rotation: facingRight ? this.heading : this.heading - Math.PI,
    });
    this.drawLabel(ctx, view.accent);
  }

  private drawLeg(ctx: CanvasRenderingContext2D, leg: Leg, color: string): void {
    const hip = leg.hip(this.position, this.heading);
    const knee = solveKnee(hip, leg.foot, this.position);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(snap(hip.x), snap(hip.y));
    ctx.lineTo(snap(knee.x), snap(knee.y));
    ctx.lineTo(snap(leg.foot.x), snap(leg.foot.y));
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(snap(knee.x) - 4, snap(knee.y) - 4, 8, 8);
    ctx.fillStyle = '#0d0718';
    ctx.fillRect(snap(knee.x) - 1, snap(knee.y) - 1, 3, 3);
    ctx.fillStyle = leg.gripped ? '#ffffff' : '#0d0718';
    ctx.fillRect(snap(leg.foot.x) - 2, snap(leg.foot.y) - 2, 4, 4);
  }

  private drawLabel(ctx: CanvasRenderingContext2D, accent: string): void {
    const me = this.position;
    const top = me.y - 58;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.harmful ? '#ff2244' : accent;
    ctx.globalAlpha = 0.9;
    ctx.fillText(`AI:${LABELS[this.state]} GRIP ${this.grip()}/6`, me.x, top);
    for (let i = 0; i < SPIDER.hp; i++) {
      ctx.fillStyle = i < this.hp ? SPIDER_SKINS[this.stage].colors[0] : 'rgba(255,255,255,0.18)';
      ctx.fillRect(me.x - 17 + i * 12, top + 5, 9, 5);
    }
    ctx.globalAlpha = 1;
  }
}
