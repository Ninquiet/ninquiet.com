import type { Sfx } from './audio';
import { DRONE } from './constants';
import type { DomWorld, Point } from './domWorld';
import { Drone } from './drone';
import type { Effects } from './effects';
import type { HostileContext, HostileView } from './hostile';
import { distance } from './steering';

export interface Viewport {
  top: number;
  bottom: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class AmbientDrones {
  drones: Drone[] = [];
  private timer: number = DRONE.ambientFirstSpawn;

  update(context: HostileContext, world: DomWorld, view: Viewport): void {
    this.timer -= context.dt;
    if (this.timer <= 0) {
      if (this.drones.filter((d) => !d.dead).length < DRONE.ambientMax) this.spawn(world, view);
      this.timer = rand(...DRONE.ambientInterval);
    }
    for (const drone of this.drones) drone.update(context);
    const height = view.bottom - view.top;
    this.drones = this.drones.filter((drone) => {
      const y = drone.center().y;
      return !drone.dead && y > view.top - height * 2.5 && y < view.bottom + height * 2.5;
    });
  }

  private spawn(world: DomWorld, view: Viewport): void {
    const zones = world.zonesBetween(view.top + 110, view.bottom - 40, DRONE.hover);
    if (zones.length === 0) return;
    const zone = zones[Math.floor(Math.random() * zones.length)];
    this.drones.push(new Drone(zone, 'ambient', rand(...DRONE.ambientLifetime)));
  }

  draw(ctx: CanvasRenderingContext2D, view: HostileView): void {
    for (const drone of this.drones) drone.draw(ctx, view);
  }

  at(point: Point, radius: number): Drone | null {
    return this.drones.find((drone) => drone.alive && distance(drone.center(), point) < radius) ?? null;
  }

  clear(effects: Effects, sfx: Sfx): void {
    for (const drone of this.drones) drone.explode(effects, sfx);
    this.drones = [];
    this.timer = DRONE.ambientFirstSpawn * 2;
  }
}
