export interface Accents {
  acc: string;
  acc2: string;
}

export interface GlyphFieldOptions {
  cell: number;
  radius: number;
  glyphs: string;
}

const DEFAULTS: GlyphFieldOptions = { cell: 18, radius: 130, glyphs: '01<>/{}[]#*+=~;:' };

export class GlyphField {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly options: GlyphFieldOptions;
  private width = 0;
  private height = 0;
  private time = 0;
  private pointer = { x: -9999, y: -9999 };
  private frame = 0;
  private running = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private accents: Accents,
    options: Partial<GlyphFieldOptions> = {},
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.options = { ...DEFAULTS, ...options };
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!this.running) this.draw();
  }

  setAccents(accents: Accents): void {
    this.accents = accents;
    if (!this.running) this.draw();
  }

  setPointer(x: number, y: number): void {
    this.pointer = { x, y };
  }

  clearPointer(): void {
    this.pointer = { x: -9999, y: -9999 };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      this.time += 0.012;
      this.draw();
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private noise(x: number, y: number): number {
    const t = this.time;
    return Math.sin(x * 0.012 + t) * Math.cos(y * 0.017 - t * 0.8) + Math.sin((x + y) * 0.006 + t * 0.5);
  }

  private draw(): void {
    const { ctx, width, height, time, pointer } = this;
    const { cell, radius, glyphs } = this.options;
    ctx.clearRect(0, 0, width, height);
    ctx.font = '11px "JetBrains Mono", monospace';
    for (let x = cell / 2; x < width; x += cell) {
      for (let y = cell / 2; y < height; y += cell) {
        const n = this.noise(x, y);
        const dist = Math.hypot(x - pointer.x, y - pointer.y);
        const near = Math.max(0, 1 - dist / radius);
        const value = ((n + 2) / 4) * 0.26 + near * 0.8;
        if (value < 0.08) continue;
        ctx.globalAlpha = Math.min(value, 0.9);
        ctx.fillStyle = near > 0.25 ? this.accents.acc2 : this.accents.acc;
        if (near > 0.15 || n > 1.1) {
          const speed = near > 0.15 ? 40 : 6;
          const index = Math.abs(Math.floor(x * 7 + y * 13 + time * speed)) % glyphs.length;
          ctx.fillText(glyphs[index], x - 3, y + 4);
        } else {
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
