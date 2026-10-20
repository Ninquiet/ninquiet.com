import { LEVEL_EVENT } from './levelTransition';
import { REEL, REEL_EVENT, type ReelChapter } from '../data/reel';

interface ReelElements {
  root: HTMLElement;
  screen: HTMLElement;
  video: HTMLVideoElement;
  map: HTMLElement;
  open: HTMLButtonElement;
  openLabel: HTMLElement;
  sound: HTMLButtonElement;
  fullscreen: HTMLButtonElement;
  close: HTMLButtonElement;
  end: HTMLElement;
  replay: HTMLButtonElement;
}

const CLOSE_MS = 320;
const SEEK_STEP = 5;

export class ReelPlayer {
  private isOpen = false;
  private lastFocus: HTMLElement | null = null;
  private chapter: ReelChapter | undefined;
  private segments: HTMLElement[] = [];
  private raf = 0;

  constructor(private readonly el: ReelElements) {}

  attach(): void {
    window.addEventListener(REEL_EVENT, () => this.open());
    document.addEventListener('click', this.onTrigger);
    this.el.close.addEventListener('click', () => this.close());
    this.el.sound.addEventListener('click', () => this.toggleSound());
    this.el.fullscreen.addEventListener('click', () => this.toggleFullscreen());
    this.el.open.addEventListener('click', () => this.openChapter());
    this.el.replay.addEventListener('click', () => this.replay());
    this.el.video.addEventListener('ended', () => this.showEnd(true));
    this.el.video.addEventListener('click', () => this.togglePlay());
    this.el.map.addEventListener('click', this.onSeek);
    this.el.root.addEventListener('click', (event) => {
      if (event.target === this.el.root) this.close();
    });
    this.buildMap();
  }

  private buildMap(): void {
    this.segments = REEL.chapters.map((chapter) => {
      const span = document.createElement('span');
      span.dataset.stage = String(chapter.stage);
      span.style.flexGrow = String(chapter.end - chapter.start);
      if (chapter.title) span.title = chapter.title;
      this.el.map.append(span);
      return span;
    });
  }

  private onTrigger = (event: MouseEvent): void => {
    const trigger = (event.target as Element | null)?.closest('[data-reel]');
    if (!trigger) return;
    event.preventDefault();
    this.open();
  };

  private onSeek = (event: MouseEvent): void => {
    const rect = this.el.map.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    this.seek(ratio * REEL.duration);
  };

  private onKey = (event: KeyboardEvent): void => {
    event.stopPropagation();
    const onButton = (event.target as Element | null)?.closest('button, a');
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'm':
      case 'M':
        this.toggleSound();
        break;
      case 'r':
      case 'R':
        this.replay();
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
      case 'Enter':
        if (onButton) return;
        event.preventDefault();
        this.openChapter();
        break;
      case ' ':
        if (onButton) return;
        event.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowRight':
        this.seek(this.el.video.currentTime + SEEK_STEP);
        break;
      case 'ArrowLeft':
        this.seek(this.el.video.currentTime - SEEK_STEP);
        break;
      case 'Tab':
        this.trapFocus(event);
        break;
    }
  };

  private trapFocus(event: KeyboardEvent): void {
    const focusable = [...this.el.root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')].filter((node) => node.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === this.el.root)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { root, video } = this.el;
    if (!video.getAttribute('src')) video.src = REEL.src;
    video.currentTime = 0;
    this.showEnd(false);
    root.hidden = false;
    root.dataset.state = 'on';
    document.documentElement.classList.add('reel-open');
    window.addEventListener('keydown', this.onKey, true);
    root.focus({ preventScroll: true });
    video.muted = false;
    video.play().catch(() => {
      video.muted = true;
      void video.play();
    }).finally(() => this.renderSound());
    this.tick();
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    const { root, video } = this.el;
    video.pause();
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey, true);
    root.dataset.state = 'off';
    window.setTimeout(() => {
      if (this.isOpen) return;
      root.hidden = true;
      delete root.dataset.state;
      document.documentElement.classList.remove('reel-open');
    }, CLOSE_MS);
    if (document.fullscreenElement) void document.exitFullscreen();
    this.lastFocus?.focus({ preventScroll: true });
  }

  private openChapter(): void {
    const chapter = this.chapter;
    if (!chapter?.slug) return;
    this.close();
    window.dispatchEvent(new CustomEvent(LEVEL_EVENT, { detail: { href: `/projects/${chapter.slug}/`, label: chapter.title } }));
  }

  private seek(time: number): void {
    const video = this.el.video;
    video.currentTime = Math.min(REEL.duration - 0.05, Math.max(0, time));
    this.showEnd(false);
    if (video.paused) void video.play();
  }

  private replay(): void {
    this.seek(0);
  }

  private togglePlay(): void {
    const video = this.el.video;
    if (video.paused) void video.play();
    else video.pause();
  }

  private toggleFullscreen(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (this.el.screen.requestFullscreen) {
      void this.el.screen.requestFullscreen().catch(() => this.nativeFullscreen());
      return;
    }
    this.nativeFullscreen();
  }

  private nativeFullscreen(): void {
    (this.el.video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
  }

  private toggleSound(): void {
    this.el.video.muted = !this.el.video.muted;
    this.renderSound();
  }

  private renderSound(): void {
    const muted = this.el.video.muted;
    this.el.sound.setAttribute('aria-pressed', String(!muted));
    this.el.sound.textContent = muted ? '[M] sound: off' : '[M] sound: on';
  }

  private showEnd(visible: boolean): void {
    this.el.end.hidden = !visible;
    if (visible) this.el.replay.focus({ preventScroll: true });
  }

  private tick = (): void => {
    const time = this.el.video.currentTime;
    REEL.chapters.forEach((chapter, i) => {
      const progress = Math.min(1, Math.max(0, (time - chapter.start) / (chapter.end - chapter.start)));
      this.segments[i].style.setProperty('--p', progress.toFixed(3));
    });
    const chapter = REEL.chapters.find((c) => time >= c.start && time < c.end);
    if (chapter !== this.chapter) {
      this.chapter = chapter;
      this.el.root.dataset.stage = String(chapter?.stage ?? 0);
      this.el.open.disabled = !chapter?.slug;
      this.el.openLabel.textContent = chapter?.title ?? '...';
    }
    if (this.isOpen) this.raf = requestAnimationFrame(this.tick);
  };
}
