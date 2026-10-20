export interface SparkReach {
  min: number;
  max: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export function createPixelSpark(width: number, height: number, colors: string[], reach: SparkReach = { min: 14, max: 44 }): HTMLElement {
  const el = document.createElement('span');
  el.className = 'pixel-spark';
  el.setAttribute('aria-hidden', 'true');
  const edge = Math.floor(Math.random() * 4);
  const along = Math.random();
  const distance = rand(reach.min, reach.max);
  const drift = rand(-14, 14);
  const [x, y, dx, dy] =
    edge === 0
      ? [along * width, -4, drift, -distance]
      : edge === 1
        ? [width, along * height, distance, drift]
        : edge === 2
          ? [along * width, height, drift, distance]
          : [-4, along * height, -distance, drift];
  const size = pick([4, 4, 6]);
  el.style.cssText = `--x:${x}px;--y:${y}px;--dx:${dx}px;--dy:${dy}px;--s:${size}px;--c:${pick(colors)};--d:${Math.round(rand(420, 760))}ms`;
  el.addEventListener('animationend', () => el.remove(), { once: true });
  return el;
}

export function burstSparks(target: HTMLElement, count: number, colors: string[], reach?: SparkReach): void {
  const { width, height } = target.getBoundingClientRect();
  for (let i = 0; i < count; i++) target.appendChild(createPixelSpark(width, height, colors, reach));
}
