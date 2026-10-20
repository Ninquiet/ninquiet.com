import { burstSparks } from './pixelSpark';

export interface CardSparksOptions {
  cardSelector: string;
  delay: number;
  count: number;
  colors: string[];
}

const DEFAULTS: CardSparksOptions = {
  cardSelector: '.card',
  delay: 200,
  count: 16,
  colors: ['var(--acc)', 'var(--acc2)', '#ffffff'],
};

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
    burstSparks(card, this.options.count, this.options.colors);
  }
}
