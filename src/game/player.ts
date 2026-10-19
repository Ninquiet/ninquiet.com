import type { Sfx } from './audio';
import { PIXEL, PLAYER } from './constants';
import type { Point } from './domWorld';
import type { Effects } from './effects';
import type { Input } from './input';
import { drawSprite } from './pixelArt';
import { centerX, createBody, dropThrough, feetY, step, type World } from './physics';
import { ROBOT_COLORS, robotSprite, type Arms, type Eyes, type Legs } from './sprites';

type Mode = 'idle' | 'play' | 'hurt' | 'flight';
type LookKind = 'center' | 'side';

interface Flight {
  from: Point;
  to: Point;
  t: number;
  duration: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const RUN_CYCLE: Legs[] = ['runA', 'runB', 'runC', 'runB'];
const RUN_ARMS: Arms[] = ['swingA', 'down', 'swingB', 'down'];

export class Player {
  readonly body = createBody(PLAYER.width, PLAYER.height);
  facing: 1 | -1 = 1;
  invulnerable = 0;
  hovered = false;
  private mode: Mode = 'idle';
  private time = 0;
  private squashX = 1;
  private squashY = 1;
  private jumpsUsed = 0;
  private coyote = 0;
  private buffer = 0;
  private runPhase = 0;
  private spin = 0;
  private sway = 0;
  private swayVelocity = 0;
  private look: LookKind = 'center';
  private lookTimer = 1.5;
  private lastSide: 1 | -1 = -1;
  private glanceTimer = 0;
  private turnTimer = 0;
  private blinkTimer = 2;
  private blinkLeft = 0;
  private doubleBlink = false;
  private hopY = 0;
  private hopVelocity = 0;
  private hopTimer = 6;
  private anticipation = 0;
  private hurtTimer = 0;
  private flight: Flight | null = null;

  feet(): Point {
    return { x: centerX(this.body), y: feetY(this.body) + this.hopY };
  }

  placeAt(point: Point): void {
    this.body.x = point.x - this.body.w / 2;
    this.body.y = point.y - this.body.h;
    this.body.vx = 0;
    this.body.vy = 0;
  }

  startPlay(): void {
    this.mode = 'play';
    this.jumpsUsed = 0;
    this.coyote = PLAYER.coyoteTime;
    this.invulnerable = PLAYER.startInvulnerability;
    this.hopY = 0;
    this.body.vy = -PLAYER.jumpVelocity * 0.75;
    this.stretch();
  }

  hurt(): void {
    this.mode = 'hurt';
    this.hurtTimer = 0;
    this.body.vx = -this.facing * 140;
    this.body.vy = -720;
    this.squashX = 1.3;
    this.squashY = 0.7;
  }

  cheer(): void {
    this.body.vx = 0;
    this.body.vy = -560;
    this.mode = 'hurt';
    this.hurtTimer = -10;
  }

  flyTo(target: Point, duration: number): void {
    this.mode = 'flight';
    this.flight = { from: this.feet(), to: target, t: 0, duration };
    this.hopY = 0;
  }

  isIdle(): boolean {
    return this.mode === 'idle';
  }

  stomp(): void {
    this.body.vy = -PLAYER.stompBounce;
    this.jumpsUsed = 1;
    this.stretch();
  }

  update(dt: number, ctx: { input: Input; world: World; effects: Effects; sfx: Sfx; perch: Point | null; pointer: Point | null }): boolean {
    this.time += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.updateSway(dt);
    this.squashX += (1 - this.squashX) * Math.min(1, dt * 14);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 14);
    this.spin = Math.max(0, this.spin - dt);

    if (this.mode === 'idle') this.updateIdle(dt, ctx.perch, ctx.pointer, ctx.effects, ctx.sfx);
    else if (this.mode === 'play') this.updatePlay(dt, ctx.input, ctx.world, ctx.effects, ctx.sfx);
    else if (this.mode === 'hurt') this.updateHurt(dt);
    else if (this.mode === 'flight') return this.updateFlight(dt, ctx.effects, ctx.sfx);
    return false;
  }

  private stretch(): void {
    this.squashX = 0.78;
    this.squashY = 1.25;
    this.kickSway(-this.facing * 4);
  }

  private squash(amount = 1): void {
    this.squashX = 1 + 0.32 * amount;
    this.squashY = 1 - 0.28 * amount;
    this.kickSway(this.facing * 5 * amount);
  }

  private kickSway(force: number): void {
    this.swayVelocity += force;
  }

  private updateSway(dt: number): void {
    this.swayVelocity += (-this.sway * 90 - this.swayVelocity * 9) * dt;
    this.sway += this.swayVelocity * dt;
  }

  private faceTo(side: 1 | -1): void {
    if (side === this.facing) return;
    this.facing = side;
    this.turnTimer = 0.11;
    this.kickSway(-side * 6);
  }

  private updateIdle(dt: number, perch: Point | null, pointer: Point | null, effects: Effects, sfx: Sfx): void {
    if (perch) this.placeAt(perch);
    this.turnTimer = Math.max(0, this.turnTimer - dt);
    this.glanceTimer = Math.max(0, this.glanceTimer - dt);
    this.updateBlink(dt);
    this.updateHop(dt, effects, sfx);

    const me = this.feet();
    const attentive = pointer && Math.abs(pointer.x - me.x) < 340 && Math.abs(pointer.y - (me.y - 30)) < 260;
    if (this.hovered || attentive) {
      if (pointer && Math.abs(pointer.x - me.x) > 24) this.faceTo(pointer.x > me.x ? 1 : -1);
      this.look = this.hovered || (pointer && Math.abs(pointer.x - me.x) < 70) ? 'center' : 'side';
      this.lookTimer = 0.8;
      return;
    }

    this.lookTimer -= dt;
    if (this.lookTimer > 0) {
      if (this.look === 'side' && this.glanceTimer === 0 && Math.random() < dt * 0.35) this.glanceTimer = 0.35;
      return;
    }
    if (this.look === 'center') {
      const side: 1 | -1 = this.lastSide === 1 ? -1 : 1;
      this.lastSide = side;
      this.look = 'side';
      this.faceTo(side);
      this.lookTimer = rand(1.1, 2.3);
    } else if (Math.random() < 0.28) {
      const side: 1 | -1 = this.facing === 1 ? -1 : 1;
      this.lastSide = side;
      this.faceTo(side);
      this.lookTimer = rand(0.6, 1.1);
    } else {
      this.look = 'center';
      this.turnTimer = 0.09;
      this.lookTimer = rand(1.4, 2.8);
    }
  }

  private updateBlink(dt: number): void {
    if (this.blinkLeft > 0) {
      this.blinkLeft -= dt;
      if (this.blinkLeft <= 0 && this.doubleBlink) {
        this.doubleBlink = false;
        this.blinkTimer = 0.12;
      }
      return;
    }
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinkLeft = 0.12;
      this.doubleBlink = Math.random() < 0.25;
      this.blinkTimer = rand(2, 5);
    }
  }

  private updateHop(dt: number, effects: Effects, sfx: Sfx): void {
    if (this.anticipation > 0) {
      this.anticipation -= dt;
      this.squashX = 1.18;
      this.squashY = 0.84;
      if (this.anticipation <= 0) {
        this.hopVelocity = this.hovered ? -300 : -270;
        this.stretch();
      }
      return;
    }
    if (this.hopVelocity !== 0 || this.hopY < 0) {
      this.hopVelocity += 1700 * dt;
      this.hopY += this.hopVelocity * dt;
      if (this.hopY >= 0) {
        this.hopY = 0;
        this.hopVelocity = 0;
        this.squash(0.8);
        const feet = this.feet();
        effects.dust(feet.x, feet.y, 0.6);
        sfx.land();
      }
      return;
    }
    this.hopTimer -= dt;
    if (this.hopTimer <= 0) {
      this.anticipation = 0.09;
      this.hopTimer = this.hovered ? 0.7 : rand(7, 12);
    }
  }

  private updatePlay(dt: number, input: Input, world: World, effects: Effects, sfx: Sfx): void {
    const body = this.body;
    const axis = input.axis();
    if (axis !== 0) this.faceTo(axis > 0 ? 1 : -1);
    this.turnTimer = Math.max(0, this.turnTimer - dt);

    const target = axis * PLAYER.runSpeed;
    const accel = body.onGround ? (axis === 0 ? PLAYER.friction : PLAYER.groundAccel) : PLAYER.airAccel;
    const delta = target - body.vx;
    body.vx += Math.sign(delta) * Math.min(Math.abs(delta), accel * dt);

    if (body.onGround) {
      this.coyote = PLAYER.coyoteTime;
      this.jumpsUsed = 0;
    } else {
      this.coyote -= dt;
      if (this.coyote <= 0 && this.jumpsUsed === 0) this.jumpsUsed = 1;
    }

    if (input.consumeJumpPressed()) this.buffer = PLAYER.jumpBuffer;
    this.buffer -= dt;
    if (this.buffer > 0) {
      const feet = this.feet();
      if (this.coyote > 0) {
        body.vy = -PLAYER.jumpVelocity;
        this.jumpsUsed = 1;
        this.coyote = 0;
        this.buffer = 0;
        this.stretch();
        effects.dust(feet.x, feet.y, 0.8);
        sfx.jump();
      } else if (this.jumpsUsed < 2) {
        body.vy = -PLAYER.doubleJumpVelocity;
        this.jumpsUsed = 2;
        this.buffer = 0;
        this.spin = 0.38;
        this.stretch();
        effects.thrust(feet.x, feet.y);
        sfx.doubleJump();
      }
    }
    if (input.consumeJumpReleased() && body.vy < 0) body.vy *= PLAYER.jumpCut;
    if (input.consumeDownPressed() && body.onGround) dropThrough(body, PLAYER.dropTime);

    const fallSpeed = body.vy;
    if (step(body, dt, world, PLAYER.gravity, PLAYER.maxFall) && fallSpeed > 260) {
      this.squash(Math.min(1, fallSpeed / 900));
      const feet = this.feet();
      effects.dust(feet.x, feet.y, Math.min(1.5, fallSpeed / 600));
      sfx.land();
    }
    if (body.onGround) this.runPhase += (Math.abs(body.vx) / PLAYER.runSpeed) * dt * 11;
  }

  private updateHurt(dt: number): void {
    this.hurtTimer += dt;
    this.body.vy += PLAYER.gravity * 0.6 * dt;
    this.body.x += this.body.vx * dt;
    this.body.y += this.body.vy * dt;
  }

  private updateFlight(dt: number, effects: Effects, sfx: Sfx): boolean {
    const flight = this.flight;
    if (!flight) return true;
    flight.t = Math.min(1, flight.t + dt / flight.duration);
    const k = easeInOut(flight.t);
    const arc = Math.sin(Math.PI * flight.t) * 220;
    const x = flight.from.x + (flight.to.x - flight.from.x) * k;
    const y = flight.from.y + (flight.to.y - flight.from.y) * k - arc;
    this.facing = flight.to.x >= flight.from.x ? 1 : -1;
    this.placeAt({ x, y });
    if (Math.random() < 0.6) effects.thrust(x, y);
    if (flight.t >= 1) {
      this.flight = null;
      this.mode = 'idle';
      this.squash(1);
      effects.dust(x, y, 1.2);
      effects.sparkle(x, y - 24, ROBOT_COLORS);
      sfx.land();
      this.look = 'center';
      this.lookTimer = 1.2;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.invulnerable > 0 && Math.floor(this.time * 18) % 2 === 0) return;
    const body = this.body;
    let eyes: Eyes = this.look === 'center' ? 'center' : 'forward';
    let arms: Arms = 'down';
    let legs: Legs = 'stand';
    let headDrop: 0 | 1 = 0;
    let bob = 0;
    let rotation = 0;

    if (this.mode === 'idle') {
      if (this.turnTimer > 0) eyes = 'center';
      else if (this.glanceTimer > 0) eyes = 'back';
      if (this.hopY < 0 || this.anticipation > 0) {
        arms = this.hopVelocity < 0 ? 'up' : 'down';
        legs = this.hopY < -4 ? 'jump' : 'stand';
      }
      headDrop = this.hopY === 0 && this.time % 1.2 > 0.6 ? 1 : 0;
      if (this.hovered) eyes = 'center';
    } else if (this.mode === 'play') {
      eyes = this.turnTimer > 0 ? 'center' : 'forward';
      if (!body.onGround) {
        arms = 'up';
        legs = body.vy < 120 ? 'jump' : 'fall';
      } else if (Math.abs(body.vx) > 30) {
        const frame = Math.floor(this.runPhase) % 4;
        legs = RUN_CYCLE[frame];
        arms = RUN_ARMS[frame];
        bob = frame % 2 === 1 ? PIXEL : 0;
      } else {
        headDrop = this.time % 1.2 > 0.6 ? 1 : 0;
      }
      if (this.spin > 0) rotation = (1 - this.spin / 0.38) * Math.PI * 2 * this.facing;
    } else if (this.mode === 'hurt') {
      eyes = this.hurtTimer < 0 ? 'center' : 'hurt';
      arms = 'up';
      legs = 'fall';
    } else {
      eyes = 'center';
      arms = 'up';
      legs = 'jump';
      rotation = this.flight ? easeInOut(this.flight.t) * Math.PI * 4 * this.facing : 0;
    }

    if (this.blinkLeft > 0 && eyes !== 'hurt') eyes = 'blink';
    const swayStep = Math.max(-1, Math.min(1, Math.round(this.sway / 2.5))) as -1 | 0 | 1;
    const sprite = robotSprite({
      eyes,
      arms,
      legs,
      headDrop,
      antennaLight: this.time % 1.05 < 0.72,
      antennaSway: (swayStep * this.facing) as -1 | 0 | 1,
      chestLight: Math.sin(this.time * 3.4) > -0.3,
    });
    const feet = this.feet();
    drawSprite(ctx, sprite, feet.x, feet.y - bob, { facing: this.facing, scaleX: this.squashX, scaleY: this.squashY, rotation });
  }
}
