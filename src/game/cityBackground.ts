import { PIXEL } from './constants';

interface LayerSpec {
  seed: number;
  depth: number;
  drift: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  body: string;
  edge: string;
  windows: string[];
  windowChance: number;
  neon: number;
}

interface Layer {
  spec: LayerSpec;
  canvas: HTMLCanvasElement;
  top: number;
}

interface Star {
  x: number;
  y: number;
  phase: number;
  size: number;
}

const LAYERS: LayerSpec[] = [
  { seed: 7, depth: 0.018, drift: 0.015, minWidth: 18, maxWidth: 46, minHeight: 0.14, maxHeight: 0.32, body: '#2a1050', edge: '#4a2080', windows: ['#7a3cff', '#ff4fb8'], windowChance: 0.05, neon: 0.1 },
  { seed: 23, depth: 0.034, drift: 0.035, minWidth: 24, maxWidth: 60, minHeight: 0.08, maxHeight: 0.24, body: '#1b0a36', edge: '#ff4fb8', windows: ['#ffd166', '#5ce1e6', '#ff4fb8'], windowChance: 0.08, neon: 0.35 },
  { seed: 51, depth: 0.055, drift: 0.07, minWidth: 34, maxWidth: 80, minHeight: 0.05, maxHeight: 0.17, body: '#0f0620', edge: '#5ce1e6', windows: ['#ffd166', '#5ce1e6', '#ff7ad9'], windowChance: 0.1, neon: 0.55 },
];

const GRID_DEPTH = 0.012;
const SKY_DEPTH = 0.006;
const MAX_SHIFT = 480;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const snap = (v: number) => Math.round(v / PIXEL) * PIXEL;

export class CityBackground {
  private readonly ctx: CanvasRenderingContext2D;
  private layers: Layer[] = [];
  private stars: Star[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private time = 0;
  private visible = false;
  private fade = 0;
  private startScroll = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.layers = LAYERS.map((spec) => this.buildLayer(spec));
    const random = mulberry32(99);
    this.stars = Array.from({ length: Math.round(width / 9) }, () => ({
      x: random() * width,
      y: random() * height * 0.62,
      phase: random() * Math.PI * 2,
      size: random() < 0.15 ? PIXEL * 2 : PIXEL,
    }));
  }

  show(): void {
    if (!this.visible && this.fade === 0) this.startScroll = window.scrollY;
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  update(dt: number): boolean {
    this.time += dt;
    this.fade = Math.min(1, Math.max(0, this.fade + (this.visible ? dt : -dt) * 1.4));
    return this.fade > 0;
  }

  private buildLayer(spec: LayerSpec): Layer {
    const random = mulberry32(spec.seed);
    const margin = this.width * 0.25;
    const width = Math.ceil(this.width + margin * 2);
    const top = Math.ceil(this.height * spec.maxHeight);
    const height = top + this.height + MAX_SHIFT;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    let x = -PIXEL * 4;
    while (x < width) {
      const w = snap(spec.minWidth + random() * (spec.maxWidth - spec.minWidth));
      const h = snap(this.height * (spec.minHeight + random() * (spec.maxHeight - spec.minHeight)));
      const y = top - h;
      ctx.fillStyle = spec.body;
      ctx.fillRect(x, y, w, height - y);
      ctx.fillStyle = spec.edge;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(x, y, PIXEL, height - y);
      ctx.globalAlpha = 0.5 + spec.neon * 0.5;
      ctx.fillRect(x, y, w, PIXEL);
      ctx.globalAlpha = 1;

      if (random() < spec.neon) {
        const antenna = snap(10 + random() * 40);
        ctx.fillStyle = spec.edge;
        ctx.fillRect(x + snap(w / 2), y - antenna, PIXEL, antenna);
        ctx.fillStyle = '#ff2e88';
        ctx.fillRect(x + snap(w / 2) - PIXEL, y - antenna - PIXEL, PIXEL * 3, PIXEL * 2);
      }
      if (random() < spec.neon * 0.6) {
        ctx.fillStyle = random() < 0.5 ? '#ff4fb8' : '#5ce1e6';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x + PIXEL * 2, y + snap(h * 0.18), w - PIXEL * 4, PIXEL);
        ctx.globalAlpha = 1;
      }

      for (let wy = y + PIXEL * 3; wy < height; wy += PIXEL * 4) {
        for (let wx = x + PIXEL * 2; wx < x + w - PIXEL * 2; wx += PIXEL * 3) {
          if (random() > spec.windowChance) continue;
          ctx.fillStyle = spec.windows[Math.floor(random() * spec.windows.length)];
          ctx.globalAlpha = 0.55 + random() * 0.45;
          ctx.fillRect(wx, wy, PIXEL, PIXEL * 2);
        }
      }
      ctx.globalAlpha = 1;
      x += w + snap(random() * 12);
    }
    return { spec, canvas, top };
  }

  render(scrollY: number, focusX: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    if (this.fade <= 0) return;

    ctx.globalAlpha = this.fade;
    const travel = scrollY - this.startScroll;
    const shift = (depth: number) => Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT * 0.4, -travel * depth));
    const horizon = h * 0.8 + shift(SKY_DEPTH);
    const lean = focusX - w / 2;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#07010f');
    sky.addColorStop(0.55, '#1c0436');
    sky.addColorStop(0.85, '#4a0b5c');
    sky.addColorStop(1, '#ff2e88');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    for (const star of this.stars) {
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(this.time * 1.7 + star.phase));
      ctx.globalAlpha = this.fade * twinkle;
      ctx.fillStyle = '#f5e9ff';
      ctx.fillRect(snap(star.x - lean * 0.005), snap(star.y + shift(SKY_DEPTH * 0.5)), star.size, star.size);
    }
    ctx.globalAlpha = this.fade;

    this.drawSun(ctx, w * 0.45 - lean * 0.01, horizon, Math.min(w, h) * 0.26);
    this.drawGrid(ctx, w, h, horizon + shift(GRID_DEPTH) - shift(SKY_DEPTH), lean);

    for (const layer of this.layers) {
      const x = -this.width * 0.25 - lean * layer.spec.drift;
      const y = horizon - layer.top + shift(layer.spec.depth) - shift(SKY_DEPTH);
      ctx.drawImage(layer.canvas, Math.round(x), Math.round(y));
    }

    const haze = ctx.createLinearGradient(0, horizon - h * 0.25, 0, horizon + 40);
    haze.addColorStop(0, 'rgba(255, 46, 136, 0)');
    haze.addColorStop(1, 'rgba(255, 46, 136, 0.12)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizon - h * 0.25, w, h * 0.25 + 40);
    ctx.globalAlpha = 1;
  }

  private drawSun(ctx: CanvasRenderingContext2D, cx: number, horizon: number, r: number): void {
    const cy = horizon - r * 0.55;
    const gradient = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    gradient.addColorStop(0, '#ffe66d');
    gradient.addColorStop(0.5, '#ff9a3c');
    gradient.addColorStop(1, '#ff2e88');
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.width, horizon);
    ctx.clip();
    ctx.fillStyle = gradient;
    const period = PIXEL * 6;
    const scroll = (this.time * 14) % period;
    for (let y = -r; y < r; y += PIXEL) {
      const t = (y + r) / (2 * r);
      if (t > 0.5) {
        const gap = PIXEL * (1 + Math.floor((t - 0.5) * 6));
        if ((y + r + scroll) % period < gap) continue;
      }
      const half = Math.sqrt(Math.max(0, r * r - y * y));
      ctx.fillRect(snap(cx - half), snap(cy + y), snap(half * 2), PIXEL);
    }
    ctx.restore();
  }

  private drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, horizon: number, lean: number): void {
    if (horizon >= h) return;
    const floor = ctx.createLinearGradient(0, horizon, 0, h);
    floor.addColorStop(0, '#2a0640');
    floor.addColorStop(1, '#090112');
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, w, h - horizon);

    ctx.strokeStyle = '#ff2e88';
    ctx.lineWidth = 2;
    const vanishX = w / 2 - lean * 0.05;
    const depth = h - horizon;
    for (let i = -14; i <= 14; i++) {
      ctx.globalAlpha = this.fade * 0.55;
      ctx.beginPath();
      ctx.moveTo(vanishX + i * 18, horizon);
      ctx.lineTo(vanishX + i * w * 0.16, h);
      ctx.stroke();
    }
    const offset = (this.time * 0.6) % 1;
    for (let i = 0; i < 12; i++) {
      const t = (i + offset) / 12;
      const y = horizon + depth * t * t;
      ctx.globalAlpha = this.fade * (0.25 + t * 0.5);
      ctx.fillStyle = i % 2 ? '#ff2e88' : '#c13cff';
      ctx.fillRect(0, Math.round(y), w, 2);
    }
    ctx.globalAlpha = this.fade;
  }
}
