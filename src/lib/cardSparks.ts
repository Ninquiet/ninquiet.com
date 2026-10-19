export interface CardSparksOptions {
  cardSelector: string;
  delay: number;
  count: number;
  colors: string[];
}

const DEFAULTS: CardSparksOptions = {
  cardSelector: '.card',
  delay: 380,
  count: 16,
  colors: ['var(--acc)', 'var(--acc2)', '#ffffff'],
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export class CardSparks {
  private readonly options: CardSparksOptions;
  private current: Element | null = null;
  private timer = 0;

  constructor(options: Partial<CardSparksOptions> = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  attach(): void {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.addEventListener('pointerover', this.onOver);
    document.addEventListener('pointerout', this.onOut);
  }

  private onOver = (event: PointerEvent): void => {
    const card = (event.target as Element | null)?.closest<HTMLElement>(this.options.cardSelector);
    if (!card || card === this.current) return;
    this.current = card;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      if (this.current === card) this.burst(card);
    }, this.options.delay);
  };

  private onOut = (event: PointerEvent): void => {
    if (!this.current) return;
    const next = event.relatedTarget as Node | null;
    if (next && this.current.contains(next)) return;
    this.current = null;
    window.clearTimeout(this.timer);
  };

  private burst(card: HTMLElement): void {
    const { width, height } = card.getBoundingClientRect();
    for (let i = 0; i < this.options.count; i++) card.appendChild(this.spark(width, height));
  }

  private spark(width: number, height: number): HTMLElement {
    const el = document.createElement('span');
    el.className = 'pixel-spark';
    el.setAttribute('aria-hidden', 'true');
    const edge = Math.floor(Math.random() * 4);
    const along = Math.random();
    const reach = rand(14, 44);
    const drift = rand(-14, 14);
    const [x, y, dx, dy] =
      edge === 0
        ? [along * width, -4, drift, -reach]
        : edge === 1
          ? [width, along * height, reach, drift]
          : edge === 2
            ? [along * width, height, drift, reach]
            : [-4, along * height, -reach, drift];
    const size = pick([4, 4, 6]);
    el.style.cssText = `--x:${x}px;--y:${y}px;--dx:${dx}px;--dy:${dy}px;--s:${size}px;--c:${pick(this.options.colors)};--d:${Math.round(rand(420, 760))}ms`;
    el.addEventListener('animationend', () => el.remove(), { once: true });
    return el;
  }
}
