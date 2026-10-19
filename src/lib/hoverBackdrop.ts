export interface HoverBackdropOptions {
  cardSelector: string;
  hideDelay: number;
}

const DEFAULTS: HoverBackdropOptions = { cardSelector: '.card', hideDelay: 140 };

export class HoverBackdrop {
  private readonly layers: HTMLElement[];
  private readonly options: HoverBackdropOptions;
  private front = 0;
  private current: Element | null = null;
  private hideTimer = 0;

  constructor(
    private readonly root: HTMLElement,
    options: Partial<HoverBackdropOptions> = {},
  ) {
    this.layers = [...root.querySelectorAll<HTMLElement>('[data-backdrop-layer]')];
    this.options = { ...DEFAULTS, ...options };
  }

  attach(): void {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.addEventListener('pointerover', this.onOver);
    document.addEventListener('pointerout', this.onOut);
  }

  private imageFor(card: Element): string | null {
    const video = card.querySelector('video');
    if (video?.poster) return video.poster;
    const img = card.querySelector('img');
    return img ? img.currentSrc || img.src : null;
  }

  private onOver = (event: PointerEvent): void => {
    const card = (event.target as Element | null)?.closest(this.options.cardSelector);
    if (!card || card === this.current) return;
    if (document.documentElement.dataset.game) return;
    const src = this.imageFor(card);
    if (!src) return;
    window.clearTimeout(this.hideTimer);
    this.current = card;
    this.show(src);
  };

  private onOut = (event: PointerEvent): void => {
    if (!this.current) return;
    const next = event.relatedTarget as Node | null;
    if (next && this.current.contains(next)) return;
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => this.hide(), this.options.hideDelay);
  };

  private show(src: string): void {
    const previous = this.layers[this.front];
    this.front = (this.front + 1) % this.layers.length;
    const layer = this.layers[this.front];
    layer.style.backgroundImage = `url("${src}")`;
    layer.classList.remove('is-in', 'is-out');
    void layer.offsetWidth;
    layer.classList.add('is-in');
    if (previous !== layer && previous.classList.contains('is-in')) {
      previous.classList.remove('is-in');
      previous.classList.add('is-out');
    }
    this.root.classList.add('is-active');
  }

  private hide(): void {
    this.current = null;
    for (const layer of this.layers) {
      if (!layer.classList.contains('is-in')) continue;
      layer.classList.remove('is-in');
      layer.classList.add('is-out');
    }
    this.root.classList.remove('is-active');
  }
}
