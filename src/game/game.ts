import { AmbientDrones } from './ambient';
import { Sfx } from './audio';
import { CityBackground } from './cityBackground';
import { CHAIN_DELAY, CHAIN_RADIUS, DRONE, ENEMY, HEADER_SELECTOR, SPIDER, STAR_SIZE, ZAP_RADIUS } from './constants';
import { DomWorld, type Point } from './domWorld';
import { Effects } from './effects';
import { Drone } from './drone';
import { Enemy } from './enemy';
import type { Hostile, HostileContext } from './hostile';
import { drawBanner, drawBubble, drawHint, drawHud, formatTime, PIXEL_FONT, type Accents } from './hud';
import { Input } from './input';
import { drawSprite } from './pixelArt';
import { centerX, feetY, overlaps } from './physics';
import { CardDrop } from '../lib/cardDrop';
import { Player } from './player';
import { Spider } from './spider';
import { STAR_COLORS, starSprite } from './sprites';
import { distance } from './steering';

export type Phase = 'idle' | 'playing' | 'over' | 'returning';
type Result = 'win' | 'lose' | 'quit';

interface Star {
  x: number;
  y: number;
  taken: boolean;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  background: HTMLCanvasElement;
  hitbox: HTMLButtonElement;
  readAccents: () => Accents;
  onPhase: (phase: Phase) => void;
  touch: boolean;
}

const BUBBLES = ['click me!', 'wanna play?', 'psst... press me', 'stars to collect!', 'beep boop'];
const TOUCH_BUBBLES = ['tap me!', 'wanna play?', 'tap to play', 'beep boop'];
const vibrate = (pattern: number | number[]) => navigator.vibrate?.(pattern);
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly world = new DomWorld();
  private readonly player = new Player();
  private readonly effects = new Effects();
  private readonly sfx = new Sfx();
  private readonly input: Input;
  private readonly city: CityBackground;
  private cityDrawn = false;
  private hostiles: Hostile[] = [];
  private readonly ambient = new AmbientDrones();
  private readonly cardDrop = new CardDrop();
  private droneRespawns: number[] = [];
  private suppressClick = false;
  private time = 0;
  private prevFeet = 0;
  private chain: { hostile: Hostile; at: number }[] = [];
  private combo = 0;
  private comboTimer = 0;
  private stars: Star[] = [];
  private phase: Phase = 'idle';
  private result: Result = 'lose';
  private elapsed = 0;
  private overTimer = 0;
  private spawnClock = 0;
  private spawnIndex = 0;
  private respawns: number[] = [];
  private hintTimer = 0;
  private refreshTimer = 0;
  private bubbleText = '';
  private bubbleTime = 0;
  private bubbleTimer = 2.5;
  private pointerClient: { x: number; y: number } | null = null;
  private accents: Accents;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private frame = 0;
  private last = 0;
  private resizeObserver: ResizeObserver | null = null;
  private hitboxPosition = '';

  constructor(private readonly options: GameOptions) {
    const ctx = options.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.accents = options.readAccents();
    this.input = new Input({ onQuit: () => this.quit(), onMute: () => this.sfx.toggleMute() });
    this.city = new CityBackground(options.background);
    this.effects.onExplode = (x, y) => {
      this.cardDrop.near(x, y, 120);
      this.world.refresh();
      this.queueChain(x, y);
    };
  }

  mount(): void {
    this.resize();
    this.world.refresh();
    const perch = this.world.perch();
    if (perch) this.player.placeAt(perch);
    this.input.attach();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown, { capture: true });
    window.addEventListener('click', this.onClickCapture, { capture: true });
    this.options.hitbox.addEventListener('pointerenter', this.onHoverIn);
    this.options.hitbox.addEventListener('pointerleave', this.onHoverOut);
    this.options.hitbox.addEventListener('focus', this.onHoverIn);
    this.options.hitbox.addEventListener('blur', this.onHoverOut);
    this.resizeObserver = new ResizeObserver(() => this.world.refresh());
    this.resizeObserver.observe(document.body);
    void document.fonts?.load(`12px ${PIXEL_FONT}`).then(() => this.world.refresh());
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.input.detach();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('pointerdown', this.onPointerDown, { capture: true });
    window.removeEventListener('click', this.onClickCapture, { capture: true });
    this.options.hitbox.removeEventListener('pointerenter', this.onHoverIn);
    this.options.hitbox.removeEventListener('pointerleave', this.onHoverOut);
    this.options.hitbox.removeEventListener('focus', this.onHoverIn);
    this.options.hitbox.removeEventListener('blur', this.onHoverOut);
    this.resizeObserver?.disconnect();
  }

  get controls(): Input {
    return this.input;
  }

  setAccents(accents: Accents): void {
    this.accents = accents;
  }

  start(): void {
    if (this.phase !== 'idle') return;
    this.sfx.resume();
    this.sfx.start();
    this.cardDrop.restoreAll();
    this.world.refresh();
    this.stars = this.world.starPositions().flatMap((p) => (p ? [{ x: p.x, y: p.y - 30, taken: false }] : []));
    this.ambient.clear(this.effects, this.sfx);
    this.hostiles = [];
    this.respawns = [];
    this.droneRespawns = [];
    this.spawnHunters(DRONE.gameCount);
    this.spawnSpider();
    this.spawnClock = 0;
    this.spawnIndex = 0;
    this.elapsed = 0;
    this.hintTimer = 4.5;
    this.player.hovered = false;
    this.player.startPlay();
    this.input.setActive(true);
    this.setPhase('playing');
  }

  quit(): void {
    if (this.phase !== 'playing') return;
    this.finish('quit');
  }

  toggleMute(): boolean {
    return this.sfx.toggleMute();
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    if (phase === 'idle') delete document.documentElement.dataset.game;
    else document.documentElement.dataset.game = phase;
    if (phase === 'playing') this.city.show();
    if (phase === 'returning' || phase === 'idle') this.city.hide();
    this.options.hitbox.hidden = phase !== 'idle';
    this.options.onPhase(phase);
  }

  private finish(result: Result): void {
    this.result = result;
    this.overTimer = 0;
    this.input.setActive(false);
    this.setPhase('over');
    if (result === 'lose') {
      this.player.hurt();
      this.sfx.lose();
      vibrate([60, 40, 160]);
      this.effects.flash = 0.2;
      this.effects.shake = 12;
    } else if (result === 'win') {
      this.player.cheer();
      this.sfx.win();
      this.effects.confetti(window.scrollX + this.width / 2, window.scrollY + this.height * 0.3, [...STAR_COLORS, this.accents.acc, this.accents.acc2]);
    }
  }

  private beginReturn(): void {
    const perch = this.world.perch() ?? this.player.feet();
    this.setPhase('returning');
    this.player.flyTo(perch, 1.35);
    this.sfx.whoosh();
    window.scrollTo({ top: Math.max(0, perch.y - this.height * 0.45), behavior: 'smooth' });
  }

  private resize = (): void => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const canvas = this.options.canvas;
    canvas.width = Math.round(this.width * this.dpr);
    canvas.height = Math.round(this.height * this.dpr);
    this.city.resize(this.width, this.height, this.dpr);
    this.world.refresh();
  };

  private onPointer = (event: PointerEvent): void => {
    this.pointerClient = { x: event.clientX, y: event.clientY };
    const point = { x: event.clientX + window.scrollX, y: event.clientY + window.scrollY };
    const aiming = event.pointerType === 'mouse' && this.hostileAt(point, ZAP_RADIUS) !== null;
    document.documentElement.classList.toggle('bitdroid-aim', aiming);
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if ((event.target as Element | null)?.closest('[data-no-zap]')) return;
    const point = { x: event.clientX + window.scrollX, y: event.clientY + window.scrollY };
    const hostile = this.hostileAt(point, event.pointerType === 'touch' ? ZAP_RADIUS + 14 : ZAP_RADIUS);
    if (!hostile) return;
    event.preventDefault();
    event.stopPropagation();
    this.suppressClick = true;
    this.zap(hostile);
  };

  private onClickCapture = (event: MouseEvent): void => {
    if (!this.suppressClick) return;
    this.suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  private hostileAt(point: Point, radius: number): Hostile | null {
    if (this.phase === 'idle') return this.ambient.at(point, radius);
    if (this.phase !== 'playing') return null;
    return this.hostiles.find((h) => h.alive && distance(h.center(), point) < Math.max(radius, h.hitRadius)) ?? null;
  }

  private zap(hostile: Hostile): void {
    const c = hostile.center();
    this.sfx.resume();
    const destroyed = hostile.hit(this.effects, this.sfx);
    this.sfx.zap();
    vibrate(20);
    this.effects.popup('ZAP!', c.x, c.y - 26, '#ffffff');
    if (destroyed && this.phase === 'playing') this.onHostileKilled(hostile);
  }

  private onHostileKilled(hostile: Hostile): void {
    if (hostile instanceof Spider) {
      const c = hostile.center();
      this.effects.popup('BOSS DOWN!', c.x, c.y - 60, '#ffd84a');
      return;
    }
    if (hostile instanceof Drone) this.droneRespawns.push(this.spawnClock + DRONE.respawnDelay);
    else this.respawns.push(this.spawnClock + ENEMY.respawnDelay);
  }

  private hostileContext(dt: number, withTarget: boolean): HostileContext {
    return { dt, target: withTarget ? this.player.body : null, world: this.world, effects: this.effects, sfx: this.sfx, pointer: this.pointerWorld() };
  }

  private spawnSpider(): void {
    const el = document.querySelector(SPIDER.perchSelector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.hostiles.push(new Spider(rect.left + window.scrollX + rect.width * 0.6, rect.top + window.scrollY));
  }

  private spawnHunters(count: number): void {
    const zones = this.world.cardZones(DRONE.hover).sort(() => Math.random() - 0.5);
    const start = this.player.feet();
    const far = zones.filter((z) => Math.abs(z.y - start.y) > 260);
    for (const zone of (far.length >= count ? far : zones).slice(0, count)) this.hostiles.push(new Drone(zone, 'hunter'));
  }

  private onHoverIn = (): void => {
    this.player.hovered = true;
    this.bubbleTime = 0;
  };

  private onHoverOut = (): void => {
    this.player.hovered = false;
  };

  private pointerWorld(): Point | null {
    return this.pointerClient ? { x: this.pointerClient.x + window.scrollX, y: this.pointerClient.y + window.scrollY } : null;
  }

  private loop = (now: number): void => {
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.renderCity(dt);
    this.render();
    this.frame = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.time += dt;
    this.prevFeet = feetY(this.player.body);
    this.effects.update(dt);
    this.refreshTimer -= dt;
    if (this.refreshTimer <= 0 && this.phase !== 'idle') {
      this.world.refresh();
      this.syncStars();
      this.refreshTimer = 1.5;
    }

    const done = this.player.update(dt, {
      input: this.input,
      world: this.world,
      effects: this.effects,
      sfx: this.sfx,
      perch: this.phase === 'idle' ? this.world.perch() : null,
      pointer: this.pointerWorld(),
    });

    if (this.phase === 'idle') this.updateIdle(dt);
    else if (this.phase === 'playing') this.updatePlaying(dt);
    else if (this.phase === 'over') this.updateOver(dt);
    else if (this.phase === 'returning' && done) {
      this.hostiles = [];
      this.chain = [];
      this.cardDrop.restoreAll();
      this.stars = [];
      this.setPhase('idle');
    }
    this.processChain(dt);
  }

  private chainTargets(): Hostile[] {
    if (this.phase === 'idle') return this.ambient.drones;
    if (this.phase === 'playing' || this.phase === 'over') return this.hostiles;
    return [];
  }

  private queueChain(x: number, y: number): void {
    for (const hostile of this.chainTargets()) {
      if (!hostile.alive || this.chain.some((entry) => entry.hostile === hostile)) continue;
      if (distance(hostile.center(), { x, y }) > CHAIN_RADIUS + hostile.hitRadius * 0.5) continue;
      this.chain.push({ hostile, at: this.time + CHAIN_DELAY });
    }
  }

  private processChain(dt: number): void {
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.combo = 0;
    if (this.chain.length === 0) return;
    const due = this.chain.filter((entry) => entry.at <= this.time);
    this.chain = this.chain.filter((entry) => entry.at > this.time);
    for (const { hostile } of due) {
      if (!hostile.alive) continue;
      const c = hostile.center();
      const destroyed = hostile.hit(this.effects, this.sfx);
      this.combo += 1;
      this.comboTimer = 0.9;
      this.effects.popup(`CHAIN x${this.combo + 1}`, c.x, c.y - 40, '#ffd84a');
      if (destroyed && this.phase === 'playing') this.onHostileKilled(hostile);
    }
  }

  private syncStars(): void {
    const positions = this.world.starPositions();
    this.stars.forEach((star, i) => {
      const p = positions[i] ?? null;
      if (p) {
        star.x = p.x;
        star.y = p.y - 30;
      }
    });
  }

  private updateIdle(dt: number): void {
    this.positionHitbox();
    this.ambient.update(this.hostileContext(dt, false), this.world, { top: window.scrollY, bottom: window.scrollY + this.height });
    if (this.player.hovered) return;
    this.bubbleTime = Math.max(0, this.bubbleTime - dt);
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      const pool = this.options.touch ? TOUCH_BUBBLES : BUBBLES;
      this.bubbleText = pool[Math.floor(Math.random() * pool.length)];
      this.bubbleTime = 2.6;
      this.bubbleTimer = this.options.touch ? rand(5, 8) : rand(10, 16);
    }
  }

  private positionHitbox(): void {
    const feet = this.player.feet();
    const position = `translate(${Math.round(feet.x - 30)}px, ${Math.round(feet.y - 64)}px)`;
    if (position !== this.hitboxPosition) {
      this.options.hitbox.style.transform = position;
      this.hitboxPosition = position;
    }
  }

  private updatePlaying(dt: number): void {
    this.elapsed += dt;
    this.hintTimer -= dt;
    this.spawnClock += dt;
    while (this.spawnIndex < ENEMY.spawnSchedule.length && this.spawnClock >= ENEMY.spawnSchedule[this.spawnIndex]) {
      this.spawnEnemy();
      this.spawnIndex++;
    }
    this.respawns = this.respawns.filter((at) => {
      if (this.spawnClock < at) return true;
      this.spawnEnemy();
      return false;
    });
    this.droneRespawns = this.droneRespawns.filter((at) => {
      if (this.spawnClock < at) return true;
      if (this.hostiles.filter((h) => h instanceof Drone && !h.dead).length < DRONE.maxGame) this.spawnHunters(1);
      return false;
    });

    const body = this.player.body;
    const context = this.hostileContext(dt, true);
    for (const hostile of this.hostiles) {
      hostile.update(context);
      if (!hostile.harmful) continue;
      const enemy = hostile.body;
      const feet = feetY(body);
      const horizontal = body.x + 3 < enemy.x + enemy.w && body.x + body.w - 3 > enemy.x;
      const cameFromAbove = this.prevFeet <= enemy.y + 16 || body.y + body.h / 2 < enemy.y;
      const stomping = horizontal && body.vy >= -40 && cameFromAbove && feet >= enemy.y - 3;
      if (stomping && this.player.grace === 0) {
        const destroyed = hostile.hit(this.effects, this.sfx);
        this.player.stomp();
        this.sfx.stomp();
        vibrate(25);
        this.effects.popup('STOMP!', centerX(enemy), enemy.y - 10, this.accents.acc);
        if (destroyed) this.onHostileKilled(hostile);
        continue;
      }
      if (stomping || this.player.grace > 0 || this.player.invulnerable > 0) continue;
      if (overlaps(body, enemy, 6)) {
        this.finish('lose');
        return;
      }
    }
    this.hostiles = this.hostiles.filter((hostile) => !hostile.dead);

    for (const star of this.stars) {
      if (star.taken) continue;
      const half = STAR_SIZE / 2;
      const hit = body.x < star.x + half && body.x + body.w > star.x - half && body.y < star.y + half && body.y + body.h > star.y - half;
      if (!hit) continue;
      star.taken = true;
      this.effects.sparkle(star.x, star.y, STAR_COLORS);
      this.effects.popup('+1', star.x, star.y - 18, '#ffd84a');
      this.sfx.collect();
      vibrate(12);
    }
    if (this.stars.length > 0 && this.stars.every((star) => star.taken)) this.finish('win');

    this.followCamera(dt);
  }

  private updateOver(dt: number): void {
    this.overTimer += dt;
    const first = this.result === 'win' ? 0.2 : this.result === 'quit' ? 0.05 : 0.55;
    const gap = this.result === 'quit' ? 0.12 : 0.2;
    this.hostiles.forEach((hostile, i) => {
      if (this.overTimer >= first + i * gap) hostile.explode(this.effects, this.sfx);
    });
    const hold = this.result === 'quit' ? 0.5 : 2.6;
    if (this.overTimer >= Math.max(hold, first + this.hostiles.length * gap)) this.beginReturn();
  }

  private spawnEnemy(): void {
    if (this.hostiles.filter((h) => h instanceof Enemy && !h.dead).length >= ENEMY.maxAlive) return;
    const playerScreenX = centerX(this.player.body) - window.scrollX;
    let x = rand(60, this.width - 60);
    for (let i = 0; i < 8 && Math.abs(x - playerScreenX) < 220; i++) x = rand(60, this.width - 60);
    this.hostiles.push(new Enemy(x + window.scrollX, window.scrollY + this.height + 10));
  }

  private followCamera(dt: number): void {
    const feet = feetY(this.player.body) - window.scrollY;
    const top = this.height * 0.34;
    const bottom = this.height * 0.66;
    let desired = window.scrollY;
    if (feet < top) desired = window.scrollY - (top - feet);
    else if (feet > bottom) desired = window.scrollY + (feet - bottom);
    const max = document.documentElement.scrollHeight - this.height;
    desired = Math.min(Math.max(desired, 0), max);
    const next = window.scrollY + (desired - window.scrollY) * Math.min(1, dt * 7);
    if (Math.abs(next - window.scrollY) > 0.5) window.scrollTo({ top: next, behavior: 'instant' });
  }

  private renderCity(dt: number): void {
    const active = this.city.update(dt);
    if (!active && !this.cityDrawn) return;
    this.city.render(window.scrollY, centerX(this.player.body) - window.scrollX);
    this.cityDrawn = active;
  }

  private headerBottom(): number {
    return Math.max(0, document.querySelector(HEADER_SELECTOR)?.getBoundingClientRect().bottom ?? 0);
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.width, this.height);
    const header = this.headerBottom();
    const shake = this.effects.shake;
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, header, this.width, this.height - header);
    ctx.clip();
    ctx.translate(Math.round(-window.scrollX + sx), Math.round(-window.scrollY + sy));
    this.drawStars(ctx);
    const view = { viewportBottom: window.scrollY + this.height, accent: this.accents.acc2 };
    for (const hostile of this.hostiles) hostile.draw(ctx, view);
    this.ambient.draw(ctx, view);
    this.player.draw(ctx);
    this.effects.draw(ctx);
    if (this.phase === 'idle') this.drawIdleExtras(ctx);
    ctx.restore();

    if (this.effects.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.5, this.effects.flash * 3)})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.phase === 'playing' || this.phase === 'over') {
      const taken = this.stars.filter((s) => s.taken).length;
      drawHud(ctx, header, { taken, total: this.stars.length }, this.elapsed, this.sfx.muted, this.accents, this.options.touch);
    }
    if (this.phase === 'playing') drawHint(ctx, this.width, this.height, this.hintTimer, this.options.touch, this.accents);
    if (this.phase === 'over' && this.result !== 'quit') {
      const win = this.result === 'win';
      const taken = this.stars.filter((s) => s.taken).length;
      drawBanner(
        ctx,
        this.width,
        this.height,
        win ? 'YOU WIN!' : 'GAME OVER',
        win ? `TIME ${formatTime(this.elapsed)}` : `★ ${taken}/${this.stars.length}   TRY AGAIN`,
        this.overTimer,
        win ? this.accents.acc : this.accents.acc2,
        this.accents,
      );
    }
  }

  private drawStars(ctx: CanvasRenderingContext2D): void {
    const sprite = starSprite();
    const t = performance.now() / 1000;
    this.stars.forEach((star, i) => {
      if (star.taken) return;
      const bob = Math.sin(t * 3 + i) * 4;
      const spin = Math.max(0.2, Math.abs(Math.cos(t * 2.2 + i * 0.7)));
      ctx.globalAlpha = 0.18 + Math.sin(t * 4 + i) * 0.06;
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath();
      ctx.arc(star.x, star.y + bob, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      drawSprite(ctx, sprite, star.x, star.y + bob + sprite.height / 2, { scaleX: spin });
    });
  }

  private drawIdleExtras(ctx: CanvasRenderingContext2D): void {
    const feet = this.player.feet();
    const t = performance.now() / 1000;
    if (this.player.hovered) {
      ctx.font = `9px ${PIXEL_FONT}`;
      ctx.textAlign = 'center';
      const y = feet.y - 64 + Math.sin(t * 6) * 3;
      ctx.fillStyle = '#000';
      ctx.fillText('PLAY ▶', feet.x + 2, y + 2);
      ctx.fillStyle = this.accents.acc;
      ctx.fillText('PLAY ▶', feet.x, y);
      return;
    }
    if (this.bubbleTime > 0) {
      const alpha = Math.min(1, this.bubbleTime * 4, (2.6 - this.bubbleTime) * 6);
      drawBubble(ctx, feet.x, feet.y - 62, this.bubbleText, alpha, this.accents.acc);
    }
  }
}
