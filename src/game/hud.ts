export const PIXEL_FONT = '"Press Start 2P", monospace';

export interface Accents {
  acc: string;
  acc2: string;
}

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
};

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, border: string): void {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y + h - 3, w, 3);
  ctx.fillRect(x, y, 3, h);
  ctx.fillRect(x + w - 3, y, 3, h);
}

export function drawHud(ctx: CanvasRenderingContext2D, top: number, stars: { taken: number; total: number }, elapsed: number, muted: boolean, accents: Accents, touch = false): void {
  const x = 16;
  const y = top + 14;
  panel(ctx, x, y, 236, touch ? 40 : 58, accents.acc);
  ctx.font = `12px ${PIXEL_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd84a';
  ctx.fillText(`★ ${stars.taken}/${stars.total}`, x + 14, y + 26);
  ctx.fillStyle = '#eef3ff';
  ctx.fillText(formatTime(elapsed), x + 120, y + 26);
  if (touch) return;
  ctx.font = `7px ${PIXEL_FONT}`;
  ctx.fillStyle = accents.acc;
  ctx.fillText(`ESC QUIT   M ${muted ? 'SOUND OFF' : 'SOUND ON'}`, x + 14, y + 46);
}

export function drawHint(ctx: CanvasRenderingContext2D, width: number, height: number, alpha: number, touch: boolean, accents: Accents): void {
  if (alpha <= 0) return;
  const text = touch ? 'GET ALL STARS · STOMP BUGS' : 'ARROWS MOVE   SPACE JUMP X2   DOWN DROP   STOMP THE BUGS';
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.font = `9px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 32;
  panel(ctx, width / 2 - w / 2, height - (touch ? 150 : 70), w, 34, accents.acc2);
  ctx.fillStyle = '#eef3ff';
  ctx.fillText(text, width / 2, height - (touch ? 150 : 70) + 21);
  ctx.globalAlpha = 1;
}

export function drawBanner(ctx: CanvasRenderingContext2D, width: number, height: number, title: string, subtitle: string, t: number, color: string, accents: Accents): void {
  const appear = Math.min(1, t / 0.25);
  const scale = 1 + (1 - appear) * 0.8;
  const cy = height / 2;
  ctx.globalAlpha = appear;
  ctx.fillStyle = 'rgba(5, 6, 12, 0.72)';
  ctx.fillRect(0, cy - 70, width, 140);
  ctx.fillStyle = color;
  ctx.fillRect(0, cy - 70, width, 3);
  ctx.fillRect(0, cy + 67, width, 3);

  ctx.save();
  ctx.translate(width / 2, cy - 4);
  ctx.scale(scale, scale);
  const size = Math.min(44, Math.floor(width / (title.length + 2)));
  ctx.font = `${size}px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  const jitter = Math.floor(t * 20) % 5 === 0 ? 6 : 3;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = accents.acc2;
  ctx.fillText(title, -jitter, 0);
  ctx.fillStyle = accents.acc;
  ctx.fillText(title, jitter, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  ctx.restore();

  ctx.font = `11px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eef3ff';
  ctx.fillText(subtitle, width / 2, cy + 40);
  ctx.globalAlpha = 1;
}

export function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, alpha: number, border: string): void {
  ctx.globalAlpha = alpha;
  ctx.font = `8px ${PIXEL_FONT}`;
  ctx.textAlign = 'center';
  const w = Math.ceil(ctx.measureText(text).width) + 20;
  const h = 26;
  const bx = Math.round(x - w / 2);
  const by = Math.round(y - h);
  ctx.fillStyle = '#eef3ff';
  ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = border;
  ctx.fillRect(bx, by, w, 3);
  ctx.fillRect(bx, by + h - 3, w, 3);
  ctx.fillRect(bx, by, 3, h);
  ctx.fillRect(bx + w - 3, by, 3, h);
  ctx.fillRect(Math.round(x) - 3, by + h, 6, 3);
  ctx.fillRect(Math.round(x) - 3 + 3, by + h + 3, 3, 3);
  ctx.fillStyle = '#0b0d17';
  ctx.fillText(text, x, by + 17);
  ctx.globalAlpha = 1;
}
