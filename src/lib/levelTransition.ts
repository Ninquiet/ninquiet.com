export const LEVEL_EVENT = 'level:navigate';
const STORAGE_KEY = 'level-enter';
const BLOCK = 32;

interface Elements {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  kicker: HTMLElement;
  title: HTMLElement;
  bar: HTMLElement;
}

interface StageText {
  leaving: string;
  arriving: string;
  label: string;
}

function stageFor(url: URL, fallback: string): StageText {
  if (url.pathname === '/') return { leaving: 'BACK TO BASE', arriving: 'WELCOME BACK', label: 'ninquiet.com' };
  if (url.pathname === '/projects/') return { leaving: 'LOADING STAGE SELECT', arriving: 'STAGE SELECT', label: '~/projects' };
  return { leaving: 'LOADING STAGE', arriving: 'STAGE START', label: fallback };
}

interface Cell {
  x: number;
  y: number;
  delay: number;
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export class LevelTransition {
  private busy = false;

  constructor(private readonly el: Elements) {}

  attach(): void {
    document.addEventListener('click', this.onClick);
    window.addEventListener(LEVEL_EVENT, this.onNavigate as EventListener);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) this.reset();
    });
    this.enter();
  }

  private onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.endsWith('/')) return;
    if (url.pathname === window.location.pathname) return;
    event.preventDefault();
    const name = link.querySelector('.name')?.textContent?.trim() || link.textContent?.trim() || url.pathname;
    void this.leave(url, stageFor(url, name));
  };

  private onNavigate = (event: CustomEvent<{ href: string; label?: string }>): void => {
    const url = new URL(event.detail.href, window.location.href);
    void this.leave(url, stageFor(url, event.detail.label ?? url.pathname));
  };

  private cells(order: 'in' | 'out'): Cell[] {
    const cols = Math.ceil(window.innerWidth / BLOCK);
    const rows = Math.ceil(window.innerHeight / BLOCK);
    const span = cols + rows;
    const cells: Cell[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const wave = (x + y) / span;
        cells.push({ x, y, delay: (order === 'in' ? wave : 1 - wave) * 0.8 + Math.random() * 0.2 });
      }
    }
    return cells;
  }

  private prepareCanvas(): CanvasRenderingContext2D {
    const { canvas } = this.el;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  private animate(cover: boolean, duration: number): Promise<void> {
    const ctx = this.prepareCanvas();
    const cells = this.cells(cover ? 'in' : 'out');
    const colors = [cssVar('--acc'), cssVar('--acc2'), '#ffffff'];
    const bg = cssVar('--bg');
    const start = performance.now();
    return new Promise((resolve) => {
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (const cell of cells) {
          const local = Math.min(1, Math.max(0, (t - cell.delay * 0.7) / 0.3));
          const filled = cover ? local : 1 - local;
          if (filled <= 0) continue;
          const size = Math.ceil(BLOCK * filled);
          const offset = (BLOCK - size) / 2;
          ctx.fillStyle = filled < 1 && filled > 0.35 ? colors[(cell.x + cell.y) % colors.length] : bg;
          ctx.fillRect(cell.x * BLOCK + offset, cell.y * BLOCK + offset, size, size);
        }
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  private setText(kicker: string, title: string): void {
    this.el.kicker.textContent = kicker;
    this.el.title.textContent = title;
  }

  private async leave(url: URL, stage: StageText): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    const { root, bar } = this.el;
    root.dataset.state = 'covering';
    bar.style.setProperty('--progress', '0');
    await this.animate(true, 420);
    this.setText(stage.leaving, stage.label);
    root.dataset.state = 'loading';
    for (let i = 1; i <= 8; i++) {
      bar.style.setProperty('--progress', String(i / 8));
      await wait(34);
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ kicker: stage.arriving, label: stage.label }));
    } catch {}
    window.location.href = url.href;
  }

  private async enter(): Promise<void> {
    let stored: { kicker: string; label: string } | null = null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      if (raw) stored = raw.startsWith('{') ? JSON.parse(raw) : { kicker: 'STAGE START', label: raw };
    } catch {}
    if (!stored) return this.reset();
    const { root } = this.el;
    this.setText(stored.kicker, stored.label);
    root.dataset.state = 'loading';
    this.el.bar.style.setProperty('--progress', '1');
    await wait(260);
    root.dataset.state = 'revealing';
    await this.animate(false, 480);
    this.reset();
  }

  private reset(): void {
    this.busy = false;
    delete this.el.root.dataset.state;
    delete document.documentElement.dataset.levelEnter;
  }
}
