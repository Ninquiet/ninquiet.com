export interface Vec {
  x: number;
  y: number;
}

export const vec = (x = 0, y = 0): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });
export const length = (a: Vec): number => Math.hypot(a.x, a.y);
export const distance = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

export function normalize(a: Vec): Vec {
  const len = length(a);
  return len > 0.0001 ? { x: a.x / len, y: a.y / len } : vec();
}

export function truncate(a: Vec, max: number): Vec {
  const len = length(a);
  return len > max ? scale(a, max / len) : a;
}

export function seek(position: Vec, velocity: Vec, target: Vec, maxSpeed: number): Vec {
  return sub(scale(normalize(sub(target, position)), maxSpeed), velocity);
}

export function flee(position: Vec, velocity: Vec, threat: Vec, maxSpeed: number): Vec {
  return sub(scale(normalize(sub(position, threat)), maxSpeed), velocity);
}

export function arrive(position: Vec, velocity: Vec, target: Vec, maxSpeed: number, slowRadius: number): Vec {
  const offset = sub(target, position);
  const dist = length(offset);
  const speed = maxSpeed * Math.min(1, dist / slowRadius);
  return sub(scale(normalize(offset), speed), velocity);
}

export function predict(position: Vec, target: Vec, targetVelocity: Vec, maxSpeed: number, horizon: number): Vec {
  const lookAhead = Math.min(horizon, distance(position, target) / Math.max(maxSpeed, 1));
  return add(target, scale(targetVelocity, lookAhead));
}

export function wander(angle: number, strength: number): Vec {
  return { x: Math.cos(angle) * strength, y: Math.sin(angle) * strength * 0.5 };
}
