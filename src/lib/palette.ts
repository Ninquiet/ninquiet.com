export const PALETTES = ['synthwave', 'phosphor', 'amber'] as const;

export type Palette = (typeof PALETTES)[number];

export const PALETTE_EVENT = 'palettechange';

export const DEFAULT_PALETTE: Palette = 'synthwave';

export function isPalette(value: string): value is Palette {
  return (PALETTES as readonly string[]).includes(value);
}

export function currentPalette(): Palette {
  const value = document.documentElement.dataset.palette ?? DEFAULT_PALETTE;
  return isPalette(value) ? value : DEFAULT_PALETTE;
}

export function applyPalette(palette: Palette): void {
  const root = document.documentElement;
  if (palette === DEFAULT_PALETTE) delete root.dataset.palette;
  else root.dataset.palette = palette;
  try {
    localStorage.setItem('palette', palette);
  } catch {}
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: palette }));
}

export function readAccents(): { acc: string; acc2: string } {
  const style = getComputedStyle(document.documentElement);
  return { acc: style.getPropertyValue('--acc').trim(), acc2: style.getPropertyValue('--acc2').trim() };
}
