import type { Sfx } from './audio';
import { DRONE } from './constants';
import type { Point, Zone } from './domWorld';
import type { Effects } from './effects';
import type { Hostile, HostileContext, HostileView } from './hostile';
import { drawSprite } from './pixelArt';
import { createBody } from './physics';
import { DRONE_COLORS, droneSprite, type DroneLook } from './sprites';
import { add, arrive, distance, flee, predict, seek, truncate, vec, wander, type Vec } from './steering';

export type DroneRole = 'hunter' | 'ambient';
type Steer = 'spawn' | 'patrol' | 'alert' | 'pursue' | 'return' | 'flee' | 'leave' | 'dead';

const SPAWN_TIME = 0.5;
const LEAVE_TIME = 0.6;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

export class Drone implements Hostile {
  readonly body = createBody(DRONE.width, DRONE.height);
  private position: Vec;
  private velocity: Vec = vec();
  private state: Steer = 'spawn';
  private time = 0;
  private stateTime = 0;
  private side: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  private wanderAngle = Math.random() * Math.PI * 2;
  private prediction: Vec | null = null;
  private life: number;

  constructor(
    private readonly zone: Zone,
    private readonly role: DroneRole,
    lifetime = Infinity,
  ) {
    this.position = { x: rand(zone.x1, zone.x2), y: zone.y };
    this.life = lifetime;
    this.syncBody();
  }

  get alive(): boolean {
    return this.state !== 'spawn' && this.state !== 'leave' && this.state !== 'dead';
  }

  get dead(): boolean {
    return this.state === 'dead';
  }

  center(): Point {
    return { ...this.position };
  }

  private setState(state: Steer): void {
    this.state = state;
    this.stateTime = 0;
  }

  private home(): Vec {
    return { x: (this.zone.x1 + this.zone.x2) / 2, y: this.zone.y };
  }

  private maxSpeed(): number {
    if (this.state === 'pursue') return DRONE.pursueSpeed;
    if (this.state === 'return') return DRONE.returnSpeed;
    if (this.state === 'flee') return DRONE.fleeSpeed;
    return DRONE.patrolSpeed;
  }

  update(c: HostileContext): void {
    this.time += c.dt;
    this.stateTime += c.dt;
    if (this.state === 'dead') return;
    if (this.state === 'spawn') {
      if (this.stateTime >= SPAWN_TIME) this.setState('patrol');
      return;
    }
    if (this.state === 'leave') {
      this.position.y -= 60 * c.dt;
      if (this.stateTime >= LEAVE_TIME) this.state = 'dead';
      return;
    }
    this.life -= c.dt;
    if (this.life <= 0) {
      this.setState('leave');
      return;
    }

    const target = c.target ? { x: c.target.x + c.target.w / 2, y: c.target.y + c.target.h / 2 } : null;
    const targetVelocity = c.target ? { x: c.target.vx, y: c.target.vy } : vec();
    const force = this.think(c, target, targetVelocity);

    this.velocity = truncate(add(this.velocity, truncate(force, DRONE.maxForce * c.dt)), this.maxSpeed());
    if (this.state === 'alert') this.velocity = { x: this.velocity.x * 0.85, y: this.velocity.y * 0.85 };
    this.position = add(this.position, { x: this.velocity.x * c.dt, y: this.velocity.y * c.dt });
    this.position.x = Math.min(Math.max(this.position.x, 20), c.world.width - 20);
    this.syncBody();
  }

  private think(c: HostileContext, target: Vec | null, targetVelocity: Vec): Vec {
    this.prediction = null;
    const pos = this.position;
    const vel = this.velocity;
    const sees = (radius: number) => this.role === 'hunter' && target !== null && distance(pos, target) < radius;
    const threatened = this.role === 'ambient' && c.pointer !== null && distance(pos, c.pointer) < DRONE.fleeRadius;

    switch (this.state) {
      case 'patrol': {
        if (sees(DRONE.detectRadius)) {
          this.setState('alert');
          c.effects.popup('!', pos.x, pos.y - 30, '#ff2244');
          c.sfx.alert();
          return vec();
        }
        if (threatened) {
          this.setState('flee');
          return vec();
        }
        const goal = { x: this.side > 0 ? this.zone.x2 : this.zone.x1, y: this.zone.y + Math.sin(this.time * 2) * 6 };
        if (Math.abs(pos.x - goal.x) < 14) this.side = this.side > 0 ? -1 : 1;
        this.wanderAngle += (Math.random() - 0.5) * 2.4 * c.dt * 6;
        return add(arrive(pos, vel, goal, DRONE.patrolSpeed, DRONE.slowRadius), wander(this.wanderAngle, 30));
      }
      case 'alert':
        if (this.stateTime >= DRONE.alertTime) this.setState('pursue');
        return vec();
      case 'pursue': {
        if (!target || !sees(DRONE.loseRadius)) {
          this.setState('return');
          return vec();
        }
        this.prediction = predict(pos, target, targetVelocity, DRONE.pursueSpeed, 0.8);
        return seek(pos, vel, this.prediction, DRONE.pursueSpeed);
      }
      case 'return': {
        if (sees(DRONE.detectRadius * 0.8)) {
          this.setState('alert');
          return vec();
        }
        const home = this.home();
        if (distance(pos, home) < 24) this.setState('patrol');
        return arrive(pos, vel, home, DRONE.returnSpeed, DRONE.slowRadius);
      }
      case 'flee': {
        if (!c.pointer || distance(pos, c.pointer) > DRONE.fleeRadius * 1.7) {
          this.setState('return');
          return vec();
        }
        return flee(pos, vel, c.pointer, DRONE.fleeSpeed);
      }
      default:
        return vec();
    }
  }

  private syncBody(): void {
    this.body.x = this.position.x - this.body.w / 2;
    this.body.y = this.position.y - this.body.h / 2;
    this.body.vx = this.velocity.x;
    this.body.vy = this.velocity.y;
  }

  explode(effects: Effects, sfx: Sfx): void {
    if (this.state === 'dead') return;
    const wasVisible = this.state !== 'leave';
    this.state = 'dead';
    if (!wasVisible) return;
    effects.explode(this.position.x, this.position.y, DRONE_COLORS);
    sfx.explode();
  }

  draw(ctx: CanvasRenderingContext2D, view: HostileView): void {
    if (this.state === 'dead') return;
    const pos = this.position;
    const hunting = this.state === 'pursue' || this.state === 'alert';
    this.drawSteering(ctx, view.accent, hunting);

    const look: DroneLook = this.velocity.x > 30 ? 1 : this.velocity.x < -30 ? -1 : 0;
    const sprite = droneSprite((Math.floor(this.time * 22) % 2) as 0 | 1, look, hunting);
    const appear = this.state === 'spawn' ? Math.max(0.01, easeOutBack(Math.min(1, this.stateTime / SPAWN_TIME))) : 1;
    const alpha = this.state === 'leave' ? 1 - this.stateTime / LEAVE_TIME : 1;
    const shake = this.state === 'alert' ? (Math.random() - 0.5) * 4 : 0;
    const bob = Math.sin(this.time * 4) * 2;
    const tilt = Math.max(-0.28, Math.min(0.28, this.velocity.x / 700));
    drawSprite(ctx, sprite, pos.x + shake, pos.y + bob + sprite.height / 2, {
      scaleX: appear,
      scaleY: appear,
      rotation: tilt,
      alpha,
    });
  }

  private drawSteering(ctx: CanvasRenderingContext2D, accent: string, hunting: boolean): void {
    if (this.state === 'spawn' || this.state === 'leave') return;
    const pos = this.position;
    const hunter = this.role === 'hunter';
    ctx.save();
    if (hunter) {
      ctx.setLineDash([3, 7]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = hunting ? '#ff2244' : '#a6ff3c';
      ctx.globalAlpha = hunting ? 0.35 : 0.16;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, DRONE.detectRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = hunter ? 0.8 : 0.5;
    ctx.strokeStyle = '#a6ff3c';
    ctx.lineWidth = 2;
    const tip = { x: pos.x + this.velocity.x * 0.3, y: pos.y + this.velocity.y * 0.3 };
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.fillStyle = '#a6ff3c';
    ctx.fillRect(Math.round(tip.x) - 2, Math.round(tip.y) - 2, 4, 4);

    if (this.prediction) {
      ctx.strokeStyle = '#ff2244';
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(this.prediction.x, this.prediction.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeRect(this.prediction.x - 6, this.prediction.y - 6, 12, 12);
      ctx.fillStyle = '#ff2244';
      ctx.fillRect(this.prediction.x - 1, this.prediction.y - 1, 3, 3);
    }

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = hunting ? '#ff2244' : accent;
    ctx.globalAlpha = hunter ? 0.9 : 0.55;
    const label = this.state === 'patrol' ? 'PATROL' : this.state === 'return' ? 'ARRIVE' : this.state.toUpperCase();
    ctx.fillText(`STEER:${label}`, pos.x, pos.y - 30);
    ctx.restore();
  }
}
