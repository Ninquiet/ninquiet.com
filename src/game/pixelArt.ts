export type Palette = Record<string, string>;

export interface Sprite {
  right: HTMLCanvasElement;
  left: HTMLCanvasElement;
  width: number;
  height: number;
}

function paint(rows: string[], palette: Palette, scale: number, flip: boolean): HTMLCanvasElement {
  const width = Math.max(...rows.map((row) => row.length));
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = rows.length * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      const px = flip ? width - 1 - x : x;
      ctx.fillStyle = color;
      ctx.fillRect(px * scale, y * scale, scale, scale);
    }
  });
  return canvas;
}

export function buildSprite(rows: string[], palette: Palette, scale: number): Sprite {
  const right = paint(rows, palette, scale, false);
  return { right, left: paint(rows, palette, scale, true), width: right.width, height: right.height };
}

export interface DrawOptions {
  facing?: 1 | -1;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  alpha?: number;
}

export function drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, feetX: number, feetY: number, options: DrawOptions = {}): void {
  const { facing = 1, scaleX = 1, scaleY = 1, rotation = 0, alpha = 1 } = options;
  const image = facing === 1 ? sprite.right : sprite.left;
  const w = sprite.width * scaleX;
  const h = sprite.height * scaleY;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (rotation !== 0) {
    ctx.translate(Math.round(feetX), Math.round(feetY - sprite.height / 2));
    ctx.rotate(rotation);
    ctx.drawImage(image, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
  } else {
    ctx.drawImage(image, Math.round(feetX - w / 2), Math.round(feetY - h), Math.round(w), Math.round(h));
  }
  ctx.restore();
}
