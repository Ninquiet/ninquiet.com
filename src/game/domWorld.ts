import { PERCH_SELECTOR, PLATFORM_SELECTORS, STAR_SELECTOR } from './constants';
import type { Platform, World } from './physics';

export interface Point {
  x: number;
  y: number;
}

const insetOf = (el: Element) => Number((el as HTMLElement).dataset.bitdroidInset ?? 0);

function documentRect(el: Element) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, w: rect.width, h: rect.height };
}

export class DomWorld implements World {
  platforms: Platform[] = [];
  width = 0;
  bottom = 0;
  private starAnchors: Element[] = [];

  refresh(): void {
    const doc = document.documentElement;
    this.width = doc.clientWidth;
    this.bottom = doc.scrollHeight;
    this.platforms = [];
    for (const el of document.querySelectorAll(PLATFORM_SELECTORS.join(','))) {
      if ((el as HTMLElement).offsetParent === null && el.tagName !== 'FOOTER') continue;
      const rect = documentRect(el);
      if (rect.w < 8 || rect.h <= 0) continue;
      this.platforms.push({ x: rect.x, y: Math.round(rect.y + rect.h * insetOf(el)), w: rect.w });
    }
    this.starAnchors = [...document.querySelectorAll(STAR_SELECTOR)].filter((el) => (el as HTMLElement).offsetParent !== null);
  }

  perch(): Point | null {
    const el = document.querySelector(PERCH_SELECTOR);
    if (!el) return null;
    const rect = documentRect(el);
    return { x: rect.x + rect.w * 0.5, y: Math.round(rect.y + rect.h * insetOf(el)) };
  }

  starPositions(): Point[] {
    return this.starAnchors.map((el) => {
      const rect = documentRect(el);
      return { x: rect.x + rect.w / 2, y: rect.y };
    });
  }
}
