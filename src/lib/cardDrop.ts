export interface CardDropOptions {
  selector: string;
  fallTime: number;
  awayTime: number;
  rehangTime: number;
}

const DEFAULTS: CardDropOptions = { selector: '.card', fallTime: 1600, awayTime: 5000, rehangTime: 650 };

export const FALLEN_SELECTOR = '.is-dropping, .is-gone';

export class CardDrop {
  private readonly options: CardDropOptions;
  private readonly timers = new Map<HTMLElement, number[]>();

  constructor(options: Partial<CardDropOptions> = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  near(x: number, y: number, radius: number): void {
    for (const card of document.querySelectorAll<HTMLElement>(this.options.selector)) {
      if (card.matches(FALLEN_SELECTOR)) continue;
      const rect = card.getBoundingClientRect();
      const left = rect.left + window.scrollX;
      const top = rect.top + window.scrollY;
      const nx = Math.max(left, Math.min(x, left + rect.width));
      const ny = Math.max(top, Math.min(y, top + rect.height));
      if (Math.hypot(x - nx, y - ny) <= radius) this.drop(card, x < left + rect.width / 2);
    }
  }

  restoreAll(): void {
    for (const card of document.querySelectorAll<HTMLElement>(FALLEN_SELECTOR)) this.rehang(card);
  }

  private drop(card: HTMLElement, hitFromLeft: boolean): void {
    this.clearTimers(card);
    card.style.setProperty('--pivot-x', hitFromLeft ? '100%' : '0%');
    card.style.setProperty('--swing', hitFromLeft ? '-1' : '1');
    card.classList.remove('is-rehang');
    card.classList.add('is-dropping');
    this.schedule(card, this.options.fallTime, () => {
      card.classList.remove('is-dropping');
      card.classList.add('is-gone');
    });
    this.schedule(card, this.options.fallTime + this.options.awayTime, () => this.rehang(card));
  }

  private rehang(card: HTMLElement): void {
    this.clearTimers(card);
    card.classList.remove('is-dropping', 'is-gone');
    card.classList.add('is-rehang');
    this.schedule(card, this.options.rehangTime, () => card.classList.remove('is-rehang'));
  }

  private schedule(card: HTMLElement, delay: number, fn: () => void): void {
    const id = window.setTimeout(fn, delay);
    this.timers.set(card, [...(this.timers.get(card) ?? []), id]);
  }

  private clearTimers(card: HTMLElement): void {
    for (const id of this.timers.get(card) ?? []) window.clearTimeout(id);
    this.timers.delete(card);
  }
}
