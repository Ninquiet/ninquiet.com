interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  gravity: number;
}

interface Ring {
  x: number;
  y: number;
  life: number;
  max: number;
  radius: number;
  color: string;
}

interface Popup {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class Effects {
  private particles: Particle[] = [];
  private rings: Ring[] = [];
  private popups: Popup[] = [];
  shake = 0;
  flash = 0;
  onExplode: ((x: number, y: number) => void) | null = null;

  clear(): void {
    this.particles = [];
    this.rings = [];
    this.popups = [];
    this.shake = 0;
    this.flash = 0;
  }

  private emit(x: number, y: number, count: number, colors: string[], speed: [number, number], opts: Partial<Particle> & { spread?: number; angle?: number } = {}): void {
    const { spread = Math.PI * 2, angle = -Math.PI / 2 } = opts;
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = rand(speed[0], speed[1]);
      const max = opts.max ?? rand(0.35, 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: max,
        max,
        size: opts.size ?? pick([3, 3, 6]),
        color: pick(colors),
        gravity: opts.gravity ?? 900,
      });
    }
  }

  dust(x: number, y: number, strength = 1): void {
    this.emit(x - 8, y, Math.round(4 * strength), ['#8a93b8', '#5a6288'], [40, 140], { angle: Math.PI, spread: 0.9, gravity: -60, max: 0.35, size: 3 });
    this.emit(x + 8, y, Math.round(4 * strength), ['#8a93b8', '#5a6288'], [40, 140], { angle: 0, spread: 0.9, gravity: -60, max: 0.35, size: 3 });
  }

  thrust(x: number, y: number): void {
    this.emit(x, y, 10, ['#ffd166', '#ff8a3d', '#ff4fb8'], [120, 320], { angle: Math.PI / 2, spread: 0.7, gravity: 200, max: 0.3, size: 3 });
  }

  sparkle(x: number, y: number, colors: string[]): void {
    this.emit(x, y, 14, colors, [80, 260], { gravity: 300, max: 0.5 });
    this.rings.push({ x, y, life: 0.3, max: 0.3, radius: 26, color: colors[0] });
  }

  explode(x: number, y: number, colors: string[]): void {
    this.emit(x, y, 34, colors, [140, 520], { gravity: 1100, max: 0.9 });
    this.emit(x, y, 12, ['#ffffff', '#fff3b0'], [60, 200], { gravity: 0, max: 0.25, size: 6 });
    this.rings.push({ x, y, life: 0.4, max: 0.4, radius: 70, color: '#ffffff' });
    this.rings.push({ x, y, life: 0.55, max: 0.55, radius: 110, color: colors[0] });
    this.shake = Math.max(this.shake, 10);
    this.flash = Math.max(this.flash, 0.12);
    this.onExplode?.(x, y);
  }

  confetti(x: number, y: number, colors: string[]): void {
    this.emit(x, y, 60, colors, [250, 700], { gravity: 700, max: 1.6, spread: Math.PI * 0.9 });
  }

  popup(text: string, x: number, y: number, color: string): void {
    this.popups.push({ text, x, y, life: 0.8, color });
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.5 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const p of this.popups) {
      p.life -= dt;
      p.y -= 50 * dt;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    this.shake = Math.max(0, this.shake - 40 * dt);
    this.flash = Math.max(0, this.flash - dt);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.6);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
    }
    for (const r of this.rings) {
      const t = 1 - r.life / r.max;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * (0.2 + t * 0.8), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const p of this.popups) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = '#000';
      ctx.fillText(p.text, p.x + 2, p.y + 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }
}
