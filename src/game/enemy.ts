import type { Sfx } from './audio';
import { ENEMY } from './constants';
import type { Point } from './domWorld';
import type { Effects } from './effects';
import type { Hostile, HostileContext, HostileView } from './hostile';
import { drawSprite } from './pixelArt';
import { centerX, createBody, dropThrough, feetY, step, type Body, type Platform, type World } from './physics';
import { BUG_COLORS, bugSprite } from './sprites';

type State = 'warning' | 'rising' | 'active' | 'dead';
export type Intent = 'chase' | 'climb' | 'drop' | 'leap' | 'unstuck';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function horizontalGap(x: number, platform: Platform): number {
  if (x < platform.x) return platform.x - x;
  if (x > platform.x + platform.w) return x - (platform.x + platform.w);
  return 0;
}

export class EnemyBrain {
  intent: Intent = 'chase';
  goal: Point | null = null;
  wantJump = false;
  wantDrop = false;
  private stuckTimer = 0;
  private lastX = 0;

  think(me: Body, target: Body, world: World, dt: number): void {
    const cx = centerX(me);
    const feet = feetY(me);
    const tx = centerX(target);
    const tFeet = feetY(target);
    const dy = tFeet - feet;
    this.wantJump = false;
    this.wantDrop = false;

    this.stuckTimer = Math.abs(cx - this.lastX) < 3 ? this.stuckTimer + dt : 0;
    this.lastX = cx;

    if (!me.onGround) return;

    if (this.stuckTimer > 1.1) {
      this.intent = 'unstuck';
      this.goal = { x: cx + (Math.random() < 0.5 ? -160 : 160), y: feet };
      this.wantJump = true;
      this.stuckTimer = 0;
      return;
    }

    if (dy < -36) {
      const platform = this.bestLedge(cx, feet, tx, tFeet, world.platforms);
      if (platform) {
        this.intent = 'climb';
        this.goal = { x: clamp(tx, platform.x + 18, platform.x + platform.w - 18), y: platform.y };
        const gap = horizontalGap(cx, platform);
        this.wantJump = gap < 70;
        if (gap >= 70) this.goal = { x: cx < platform.x ? platform.x + 10 : platform.x + platform.w - 10, y: platform.y };
        return;
      }
    }

    if (dy > 36) {
      this.intent = 'drop';
      this.goal = { x: tx, y: tFeet };
      this.wantDrop = Math.abs(tx - cx) < 110 && !me.ground?.floor;
      return;
    }

    this.intent = 'chase';
    this.goal = { x: tx, y: tFeet };
    const ground = me.ground;
    if (ground && !ground.floor) {
      const nearLeft = cx - ground.x < 16 && tx < cx;
      const nearRight = ground.x + ground.w - cx < 16 && tx > cx;
      if ((nearLeft || nearRight) && Math.abs(dy) < 120) {
        this.intent = 'leap';
        this.wantJump = true;
      }
    }
  }

  private bestLedge(cx: number, feet: number, tx: number, tFeet: number, platforms: Platform[]): Platform | null {
    let best: Platform | null = null;
    let bestScore = Infinity;
    for (const p of platforms) {
      const rise = feet - p.y;
      if (rise < 20 || rise > ENEMY.reachHeight) continue;
      const gap = horizontalGap(cx, p);
      if (gap > ENEMY.reachDistance) continue;
      const score = Math.abs(p.y - tFeet) + horizontalGap(tx, p) * 0.5 + gap * 0.6;
      if (score < bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return best;
  }
}

export class Enemy implements Hostile {
  readonly body = createBody(ENEMY.width, ENEMY.height);
  readonly brain = new EnemyBrain();
  state: State = 'warning';
  facing: 1 | -1 = 1;
  private timer = 0;
  private thinkTimer = 0;
  private walk = 0;
  private glitch = 0;

  constructor(x: number, private readonly spawnFeet: number) {
    this.body.x = x - this.body.w / 2;
    this.body.y = spawnFeet;
  }

  get alive(): boolean {
    return this.state === 'rising' || this.state === 'active';
  }

  get dead(): boolean {
    return this.state === 'dead';
  }

  get harmful(): boolean {
    return this.alive;
  }

  readonly hitRadius = 34;

  hit(effects: Effects, sfx: Sfx): boolean {
    this.explode(effects, sfx);
    return true;
  }

  center(): Point {
    return { x: centerX(this.body), y: this.body.y + this.body.h / 2 };
  }

  update({ dt, target, world, effects, sfx }: HostileContext): void {
    this.timer += dt;
    this.glitch = Math.max(0, this.glitch - dt);
    if (this.state === 'warning') {
      if (this.timer >= ENEMY.warningTime) {
        this.state = 'rising';
        this.body.y = this.spawnFeet;
        this.body.vy = -ENEMY.spawnVelocity;
        this.glitch = 0.6;
        sfx.spawn();
      }
      return;
    }
    if (!this.alive) return;

    this.thinkTimer -= dt;
    if (this.thinkTimer <= 0 && this.state === 'active' && target) {
      this.brain.think(this.body, target, world, ENEMY.thinkInterval);
      this.thinkTimer = ENEMY.thinkInterval;
    }

    const goal = this.brain.goal;
    const dx = goal ? goal.x - centerX(this.body) : 0;
    const desired = Math.abs(dx) > 8 ? Math.sign(dx) * ENEMY.speed : 0;
    const delta = desired - this.body.vx;
    this.body.vx += Math.sign(delta) * Math.min(Math.abs(delta), ENEMY.accel * dt);
    if (Math.abs(this.body.vx) > 20) this.facing = this.body.vx > 0 ? 1 : -1;

    if (this.body.onGround && this.brain.wantJump) {
      this.body.vy = -ENEMY.jumpVelocity;
      this.brain.wantJump = false;
      effects.dust(centerX(this.body), feetY(this.body), 0.6);
    }
    if (this.body.onGround && this.brain.wantDrop) {
      dropThrough(this.body, 0.22);
      this.brain.wantDrop = false;
    }

    const rising = this.state === 'rising';
    const landed = step(this.body, dt, world, ENEMY.gravity, ENEMY.maxFall);
    if (rising && this.body.vy >= 0) this.state = 'active';
    if (landed) effects.dust(centerX(this.body), feetY(this.body), 0.5);
    if (this.body.onGround) this.walk += (Math.abs(this.body.vx) / ENEMY.speed) * dt * 10;
    if (Math.random() < dt * 0.6) this.glitch = 0.12;
  }

  explode(effects: Effects, sfx: Sfx): void {
    if (this.state === 'dead') return;
    if (this.state === 'warning') {
      this.state = 'dead';
      return;
    }
    this.state = 'dead';
    effects.explode(centerX(this.body), this.body.y + this.body.h / 2, BUG_COLORS);
    sfx.explode();
  }

  draw(ctx: CanvasRenderingContext2D, { viewportBottom, accent }: HostileView): void {
    if (this.state === 'dead') return;
    if (this.state === 'warning') {
      const blink = Math.floor(this.timer * 10) % 2 === 0;
      if (!blink) return;
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff2244';
      ctx.fillText('!', centerX(this.body), viewportBottom - 18);
      ctx.fillRect(centerX(this.body) - 14, viewportBottom - 6, 28, 3);
      return;
    }

    this.drawIntent(ctx, accent);
    const sprite = bugSprite((Math.floor(this.walk) % 2) as 0 | 1);
    const x = centerX(this.body);
    const y = feetY(this.body);
    if (this.glitch > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      drawSprite(ctx, sprite, x - 4, y, { facing: this.facing, alpha: 0.6 });
      drawSprite(ctx, sprite, x + 4, y + 2, { facing: this.facing, alpha: 0.6 });
      ctx.restore();
    }
    const squash = this.body.onGround ? 1 : 0.9;
    drawSprite(ctx, sprite, x, y, { facing: this.facing, scaleX: 2 - squash, scaleY: squash });
  }

  private drawIntent(ctx: CanvasRenderingContext2D, accent: string): void {
    if (this.state !== 'active') return;
    const x = centerX(this.body);
    const top = this.body.y - 14;
    const goal = this.brain.goal;
    if (goal) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, this.body.y + this.body.h / 2);
      ctx.lineTo(goal.x, goal.y - 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.8;
      ctx.strokeRect(goal.x - 5, goal.y - 11, 10, 10);
      ctx.restore();
    }
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.85;
    ctx.fillText(`AI:${this.brain.intent.toUpperCase()}`, x, top);
    ctx.globalAlpha = 1;
  }
}
