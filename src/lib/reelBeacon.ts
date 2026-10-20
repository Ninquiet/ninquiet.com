import { burstSparks } from './pixelSpark';

export interface ReelBeaconOptions {
  danceEvery: number;
  danceLength: number;
  trickleEvery: number;
  colors: string[];
}

const DEFAULTS: ReelBeaconOptions = {
  danceEvery: 2600,
  danceLength: 900,
  trickleEvery: 380,
  colors: ['var(--acc2)', 'var(--acc)', '#ffffff', '#ffd23f'],
};

export class ReelBeacon {
  private readonly options: ReelBeaconOptions;
  private visible = true;
  private danceTimer = 0;
  private trickleTimer = 0;

  constructor(
    private readonly chip: HTMLElement,
    options: Partial<ReelBeaconOptions> = {},
  ) {
    this.options = { ...DEFAULTS, ...options };
  }

  attach(): void {
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.start();
      else this.stop();
    }).observe(this.chip);
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.visible && this.start()));
    this.chip.addEventListener('pointerenter', () => {
      this.dance();
      burstSparks(this.chip, 16, this.options.colors, { min: 18, max: 52 });
    });
    this.chip.addEventListener('animationend', (event) => {
      if (event.animationName.includes('reel-dance')) this.chip.classList.remove('is-dancing');
    });
  }

  private start(): void {
    this.stop();
    this.danceTimer = window.setInterval(() => this.dance(), this.options.danceEvery);
    this.trickleTimer = window.setInterval(() => burstSparks(this.chip, 1, this.options.colors, { min: 10, max: 26 }), this.options.trickleEvery);
  }

  private stop(): void {
    window.clearInterval(this.danceTimer);
    window.clearInterval(this.trickleTimer);
  }

  private dance(): void {
    if (this.chip.classList.contains('is-dancing')) return;
    this.chip.classList.add('is-dancing');
    burstSparks(this.chip, 10, this.options.colors, { min: 16, max: 40 });
    window.setTimeout(() => this.chip.classList.remove('is-dancing'), this.options.danceLength + 100);
  }
}
