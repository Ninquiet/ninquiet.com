import { useEffect, useState } from 'react';
import { DEFAULT_PALETTE, PALETTES, PALETTE_EVENT, applyPalette, currentPalette, type Palette } from '../lib/palette';
import styles from './PaletteSwitcher.module.css';

export default function PaletteSwitcher() {
  const [active, setActive] = useState<Palette>(DEFAULT_PALETTE);

  useEffect(() => {
    setActive(currentPalette());
    const sync = (event: Event) => setActive((event as CustomEvent<Palette>).detail);
    window.addEventListener(PALETTE_EVENT, sync);
    return () => window.removeEventListener(PALETTE_EVENT, sync);
  }, []);

  return (
    <div className={styles.root} role="group" aria-label="Color palette">
      <span className={styles.label}>theme:</span>
      {PALETTES.map((palette) => (
        <button
          key={palette}
          type="button"
          className={styles.option}
          data-palette={palette}
          aria-pressed={active === palette}
          onClick={() => applyPalette(palette)}
        >
          {palette}
        </button>
      ))}
    </div>
  );
}
