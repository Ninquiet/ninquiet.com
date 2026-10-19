import type { Sfx } from './audio';
import type { Point } from './domWorld';
import type { Effects } from './effects';
import type { Body, World } from './physics';

export interface HostileContext {
  dt: number;
  target: Body | null;
  world: World;
  effects: Effects;
  sfx: Sfx;
  pointer: Point | null;
}

export interface HostileView {
  viewportBottom: number;
  accent: string;
}

export interface Hostile {
  readonly body: Body;
  readonly alive: boolean;
  readonly dead: boolean;
  update(context: HostileContext): void;
  draw(ctx: CanvasRenderingContext2D, view: HostileView): void;
  explode(effects: Effects, sfx: Sfx): void;
  center(): Point;
}
