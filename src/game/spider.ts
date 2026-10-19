import type { Sfx } from './audio';
import { PIXEL, SPIDER } from './constants';
import type { Point } from './domWorld';
import type { Effects } from './effects';
import type { Hostile, HostileContext, HostileView } from './hostile';
import { drawSprite } from './pixelArt';
import { createBody, dropThrough, feetY, step, type World } from './physics';
import { SPIDER_SKINS, spiderSprite } from './sprites';
import { distance, type Vec } from './steering';

type State = 'dormant' | 'waking' | 'chase' | 'crouch' | 'leap' | 'dead';

interface LegSpec {
  hipX: number;
  hipY: number;
  restX: number;
  near: boolean;
  group: 0 | 1;
}

const LEGS: LegSpec[] = [
  { hipX: 14, hipY: 6, restX: 60, near: true, group: 0 },
  { hipX: 4, hipY: 6, restX: 22, near: true, group: 1 },
  { hipX: -6, hipY: 6, restX: -34, near: true, group: 0 },
  { hipX: 12, hipY: 2, restX: 46, near: false, group: 1 },
  { hipX: 2, hipY: 2, restX: 6, near: false, group: 0 },
  { hipX: -8, hipY: 2, restX: -50, near: false, group: 1 },
];

const LABELS: Record<State, string> = { dormant: 'SLEEP', waking: 'WAKE', chase: 'HUNT', crouch: 'CROUCH', leap: 'LEAP', dead: '' };
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const snap = (v: number) => Math.round(v / PIXEL) * PIXEL;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function solveKnee(hip: Vec, foot: Vec, thigh: number, shin: number): Vec {
  const dx = foot.x - hip.x;
  const dy = foot.y - hip.y;
  const reach = clamp(Math.hypot(dx, dy), Math.abs(thigh - shin) + 0.01, thigh + shin - 0.01);
  const base = Math.atan2(dy, dx);
  const bend = Math.acos(clamp((thigh * thigh + reach * reach - shin * shin) / (2 * thigh * reach), -1, 1));
  const a = { x: hip.x + Math.cos(base - bend) * thigh, y: hip.y + Math.sin(base - bend) * thigh };
  const b = { x: hip.x + Math.cos(base + bend) * thigh, y: hip.y + Math.sin(base + bend) * thigh };
  return a.y < b.y ? a : b;
}

class Leg {
  foot: Vec = { x: 0, y: 0 };
  private from: Vec = { x: 0, y: 0 };
  private to: Vec = { x: 0, y: 0 };
  private t = -1;

  constructor(readonly spec: LegSpec) {}

  get stepping(): boolean {
    return this.t >= 0;
  }

  hip(center: Vec, facing: 1 | -1): Vec {
    return { x: center.x + this.spec.hipX * facing, y: center.y + this.spec.hipY };
  }

  startStep(to: Vec): void {
    this.from = { ...this.foot };
    this.to = to;
    this.t = 0;
  }

  cancel(): void {
    this.t = -1;
  }

  advance(dt: number, duration: number): void {
    if (this.t < 0) return;
    this.t = Math.min(1, this.t + dt / duration);
    const k = easeInOut(this.t);
    this.foot = {
      x: this.from.x + (this.to.x - this.from.x) * k,
      y: this.from.y + (this.to.y - this.from.y) * k - Math.sin(Math.PI * this.t) * 14,
    };
    if (this.t >= 1) this.t = -1;
  }
}

export class Spider implements Hostile {
  readonly body = createBody(SPIDER.width, SPIDER.height);
  readonly hitRadius = SPIDER.hitRadius;
  private readonly legs = LEGS.map((spec) => new Leg(spec));
  private state: State = 'dormant';
  private facing: 1 | -1 = -1;
  private hp = SPIDER.hp;
  private time = 0;
  private stateTime = 0;
  private flash = 0;
  private cooldown = 0;

  constructor(x: number, surfaceY: number) {
    this.body.x = x - this.body.w / 2;
    this.body.y = surfaceY - this.body.h;
    const center = this.center();
    for (const leg of this.legs) leg.foot = { x: center.x + leg.spec.restX * 0.5 * this.facing, y: surfaceY };
  }

  get alive(): boolean {
    return this.state !== 'dead';
  }

  get dead(): boolean {
    return this.state === 'dead';
  }

  get harmful(): boolean {
    return this.state === 'chase' || this.state === 'crouch' || this.state === 'leap';
  }

  private get stage(): number {
    return SPIDER.hp - Math.max(1, this.hp);
  }

  private get speedFactor(): number {
    return SPIDER.speedByStage[this.stage];
  }

  private crouchDepth(): number {
    if (this.state === 'crouch') return Math.min(1, (this.stateTime * this.speedFactor) / SPIDER.crouchTime) * 12;
    if (this.state === 'dormant') return 8 + Math.sin(this.time * 2) * 1.5;
    return 0;
  }

  center(): Point {
    return { x: this.body.x + this.body.w / 2, y: this.body.y + this.body.h - SPIDER.ride + this.crouchDepth() };
  }

  private setState(state: State): void {
    this.state = state;
    this.stateTime = 0;
  }

  update(c: HostileContext): void {
    this.time += c.dt;
    this.stateTime += c.dt;
    this.flash = Math.max(0, this.flash - c.dt);
    this.cooldown = Math.max(0, this.cooldown - c.dt);
    if (this.state === 'dead') return;

    const body = this.body;
    const me = this.center();
    const target = c.target;
    const targetCenter = target ? { x: target.x + target.w / 2, y: target.y + target.h / 2 } : null;

    if (this.state === 'dormant') {
      body.vx = 0;
      if (targetCenter && distance(me, targetCenter) < SPIDER.wakeRadius) this.wake(c);
    } else if (this.state === 'waking') {
      if (targetCenter) this.facing = targetCenter.x > me.x ? 1 : -1;
      if (this.stateTime >= SPIDER.wakeTime) this.setState('chase');
    } else if (this.state === 'chase' && target && targetCenter) {
      this.chase(c, me, target.y + target.h, targetCenter);
    } else if (this.state === 'crouch' && target && targetCenter) {
      body.vx *= 0.8;
      if (this.stateTime >= SPIDER.crouchTime / this.speedFactor) this.leap(c, me, targetCenter.x, feetY(target));
    }

    const landed = step(body, c.dt, c.world, SPIDER.gravity, SPIDER.maxFall);
    if (this.state === 'leap' && landed) {
      this.setState('chase');
      this.cooldown = SPIDER.leapCooldown / this.speedFactor;
      c.effects.dust(me.x, feetY(body), 1.6);
      c.effects.shake = Math.max(c.effects.shake, 5);
      this.plantAll(c.world);
    }
    this.updateLegs(c.dt, c.world);
  }

  private wake(c: HostileContext): void {
    this.setState('waking');
    const me = this.center();
    c.effects.popup('!!', me.x, me.y - 40, '#ff2244');
    c.sfx.alert();
  }

  private chase(c: HostileContext, me: Vec, targetFeet: number, targetCenter: Vec): void {
    const body = this.body;
    const dx = targetCenter.x - me.x;
    if (Math.abs(dx) > 12) this.facing = dx > 0 ? 1 : -1;

    const planted = this.legs.filter((leg) => !leg.stepping).length;
    let gait = 0.35 + 0.65 * (planted / this.legs.length);
    const overreached = this.legs.some((leg) => !leg.stepping && distance(leg.hip(me, this.facing), leg.foot) > SPIDER.thigh + SPIDER.shin);
    if (overreached) gait *= 0.3;

    const desired = Math.abs(dx) > 16 ? Math.sign(dx) * SPIDER.speed * this.speedFactor * gait : 0;
    const delta = desired - body.vx;
    body.vx += Math.sign(delta) * Math.min(Math.abs(delta), SPIDER.accel * c.dt);

    const dy = targetFeet - feetY(body);
    const ground = body.ground;
    if (dy > 60 && body.onGround && ground && !ground.floor && Math.abs(dx) < 140) {
      dropThrough(body, 0.3);
      return;
    }
    const atEdge = !!ground && !ground.floor && ((dx < 0 && me.x - ground.x < 20) || (dx > 0 && ground.x + ground.w - me.x < 20));
    const inRange = distance(me, targetCenter) < SPIDER.leapRange;
    if (body.onGround && this.cooldown === 0 && inRange && (dy < -70 || (atEdge && Math.abs(dy) < 120))) this.setState('crouch');
  }

  private leap(c: HostileContext, me: Vec, targetX: number, targetFeet: number): void {
    const t = SPIDER.leapTime;
    const dy = targetFeet - feetY(this.body);
    this.body.vx = clamp((targetX - me.x) / t, -650, 650);
    this.body.vy = clamp((dy - 0.5 * SPIDER.gravity * t * t) / t, -1350, 250);
    this.setState('leap');
    for (const leg of this.legs) leg.cancel();
    c.effects.dust(me.x, feetY(this.body), 1.2);
    c.sfx.jump();
  }

  private surfaceAt(x: number, world: World, nearY: number): number {
    let best = nearY;
    let bestGap = Infinity;
    for (const p of world.platforms) {
      if (x < p.x || x > p.x + p.w) continue;
      const gap = Math.abs(p.y - nearY);
      if (p.y > nearY - 50 && p.y < nearY + 90 && gap < bestGap) {
        bestGap = gap;
        best = p.y;
      }
    }
    return best;
  }

  private restTarget(leg: Leg, world: World, curl: number): Vec {
    const me = this.center();
    const x = me.x + leg.spec.restX * this.facing * curl + this.body.vx * 0.18;
    const y = this.surfaceAt(x, world, feetY(this.body)) - (leg.spec.near ? 0 : 3);
    return { x, y };
  }

  private plantAll(world: World): void {
    for (const leg of this.legs) {
      leg.cancel();
      leg.foot = this.restTarget(leg, world, 1);
    }
  }

  private updateLegs(dt: number, world: World): void {
    const me = this.center();
    const airborne = this.state === 'leap' || !this.body.onGround;
    if (airborne) {
      for (const leg of this.legs) {
        const hip = leg.hip(me, this.facing);
        const tuck = { x: hip.x + leg.spec.restX * 0.4 * this.facing, y: hip.y + 26 };
        leg.foot = { x: leg.foot.x + (tuck.x - leg.foot.x) * Math.min(1, dt * 14), y: leg.foot.y + (tuck.y - leg.foot.y) * Math.min(1, dt * 14) };
      }
      return;
    }

    const curl = this.state === 'dormant' ? 0.5 : this.state === 'waking' ? 0.5 + 0.5 * Math.min(1, this.stateTime / SPIDER.wakeTime) : 1;
    const stepTime = SPIDER.stepTime / this.speedFactor;
    for (const leg of this.legs) {
      const target = this.restTarget(leg, world, curl);
      const otherGroupStepping = this.legs.some((other) => other.stepping && other.spec.group !== leg.spec.group);
      const threshold = this.state === 'waking' ? 6 : SPIDER.stepThreshold;
      if (!leg.stepping && !otherGroupStepping && distance(leg.foot, target) > threshold) leg.startStep(target);
      leg.advance(dt, stepTime);
    }
  }

  hit(effects: Effects, sfx: Sfx): boolean {
    if (this.state === 'dead') return true;
    this.hp -= 1;
    const me = this.center();
    if (this.hp <= 0) {
      this.explode(effects, sfx);
      return true;
    }
    this.flash = 0.18;
    effects.sparkle(me.x, me.y, SPIDER_SKINS[this.stage].colors);
    effects.popup(this.hp === 1 ? '1 HIT LEFT!' : `${this.hp} HITS LEFT`, me.x, me.y - 46, SPIDER_SKINS[this.stage].colors[0]);
    effects.shake = Math.max(effects.shake, 6);
    sfx.stomp();
    if (this.state === 'dormant') this.setState('waking');
    this.body.vx -= this.facing * 160;
    return false;
  }

  explode(effects: Effects, sfx: Sfx): void {
    if (this.state === 'dead') return;
    const me = this.center();
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
    const me = this.center();
    const skin = SPIDER_SKINS[this.stage];
    const flashing = this.flash > 0;
    for (const leg of this.legs) if (!leg.spec.near) this.drawLeg(ctx, leg, me, flashing ? '#ffffff' : skin.far, 4);
    const sprite = spiderSprite(this.stage, flashing);
    const jitter = this.stage === 2 && Math.floor(this.time * 20) % 4 === 0 ? 2 : 0;
    drawSprite(ctx, sprite, me.x + jitter, me.y + sprite.height / 2, { facing: this.facing });
    for (const leg of this.legs) if (leg.spec.near) this.drawLeg(ctx, leg, me, flashing ? '#ffffff' : skin.near, 5);
    this.drawLabel(ctx, me, view.accent);
  }

  private drawLeg(ctx: CanvasRenderingContext2D, leg: Leg, center: Vec, color: string, width: number): void {
    const hip = leg.hip(center, this.facing);
    const knee = solveKnee(hip, leg.foot, SPIDER.thigh, SPIDER.shin);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
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
    ctx.fillRect(snap(leg.foot.x) - 2, snap(leg.foot.y) - 1, 4, 3);
  }

  private drawLabel(ctx: CanvasRenderingContext2D, me: Vec, accent: string): void {
    const top = me.y - 34;
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.harmful ? '#ff2244' : accent;
    ctx.globalAlpha = 0.9;
    ctx.fillText(`AI:${LABELS[this.state]}`, me.x, top);
    for (let i = 0; i < SPIDER.hp; i++) {
      ctx.fillStyle = i < this.hp ? SPIDER_SKINS[this.stage].colors[0] : 'rgba(255,255,255,0.18)';
      ctx.fillRect(me.x - 17 + i * 12, top + 5, 9, 5);
    }
    ctx.globalAlpha = 1;
  }
}
