export interface ScrollGlitchElements {
  root: HTMLElement;
  displacement: SVGFEDisplacementMapElement;
  turbulence: SVGFETurbulenceElement;
  redOffset: SVGFEOffsetElement;
  blueOffset: SVGFEOffsetElement;
}

export interface ScrollGlitchOptions {
  velocityForMax: number;
  maxDisplacement: number;
  maxSplit: number;
  decay: number;
}

const DEFAULTS: ScrollGlitchOptions = { velocityForMax: 2.5, maxDisplacement: 46, maxSplit: 7, decay: 0.86 };

export class ScrollGlitch {
  private readonly options: ScrollGlitchOptions;
  private lastY = window.scrollY;
  private lastTime = performance.now();
  private target = 0;
  private intensity = 0;
  private frame = 0;
  private tick = 0;
  private running = false;

  constructor(
    private readonly el: ScrollGlitchElements,
    options: Partial<ScrollGlitchOptions> = {},
  ) {
    this.options = { ...DEFAULTS, ...options };
  }

  start(): void {
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  stop(): void {
    window.removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.frame);
    this.running = false;
    this.render(0);
  }

  private onScroll = (): void => {
    const now = performance.now();
    const dy = Math.abs(window.scrollY - this.lastY);
    const dt = Math.max(now - this.lastTime, 1);
    this.lastY = window.scrollY;
    this.lastTime = now;
    this.target = Math.max(this.target, Math.min(1, dy / dt / this.options.velocityForMax));
    if (!this.running) {
      this.running = true;
      this.frame = requestAnimationFrame(this.loop);
    }
  };

  private loop = (): void => {
    this.intensity += (this.target - this.intensity) * 0.3;
    this.target *= this.options.decay;
    this.render(this.intensity);
    if (this.intensity < 0.01 && this.target < 0.01) {
      this.running = false;
      this.render(0);
      return;
    }
    this.frame = requestAnimationFrame(this.loop);
  };

  private render(intensity: number): void {
    const { root, displacement, turbulence, redOffset, blueOffset } = this.el;
    this.tick++;
    root.classList.toggle('is-active', intensity > 0.01);
    root.style.setProperty('--glitch', intensity.toFixed(3));
    if (intensity <= 0.01) return;

    const burst = Math.random() > 0.35 ? 1 : 0.25;
    const split = intensity * this.options.maxSplit;
    displacement.setAttribute('scale', (intensity * this.options.maxDisplacement * burst).toFixed(1));
    redOffset.setAttribute('dx', (-split).toFixed(1));
    blueOffset.setAttribute('dx', split.toFixed(1));
    if (this.tick % 3 === 0) {
      turbulence.setAttribute('seed', String(Math.floor(Math.random() * 1000)));
      turbulence.setAttribute('baseFrequency', `0.0001 ${(0.03 + Math.random() * 0.09).toFixed(3)}`);
      root.style.setProperty('--glitch-shift', `${Math.floor(Math.random() * 100)}px`);
    }
  }
}
