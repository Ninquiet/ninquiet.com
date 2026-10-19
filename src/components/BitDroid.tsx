import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Game, type Phase } from '../game/game';
import type { Action } from '../game/input';
import { PALETTE_EVENT, readAccents } from '../lib/palette';
import styles from './BitDroid.module.css';

const TOUCH_BUTTONS: { action: Action; label: string; side: 'left' | 'right' }[] = [
  { action: 'left', label: '◀', side: 'left' },
  { action: 'right', label: '▶', side: 'left' },
  { action: 'down', label: '▼', side: 'right' },
  { action: 'jump', label: '▲', side: 'right' },
];

export default function BitDroid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitboxRef = useRef<HTMLButtonElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hitbox = hitboxRef.current;
    if (!canvas || !hitbox) return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    setTouch(coarse);
    const game = new Game({ canvas, hitbox, readAccents, onPhase: setPhase, touch: coarse });
    gameRef.current = game;
    game.mount();
    const onPalette = () => game.setAccents(readAccents());
    window.addEventListener(PALETTE_EVENT, onPalette);
    return () => {
      window.removeEventListener(PALETTE_EVENT, onPalette);
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const press = (action: Action, pressed: boolean) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    gameRef.current?.controls.setVirtual(action, pressed);
  };

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <button
        ref={hitboxRef}
        type="button"
        className={styles.hitbox}
        aria-label="Play the BitDroid mini game"
        onClick={() => gameRef.current?.start()}
      />
      {touch && phase === 'playing' && (
        <div className={styles.pad}>
          {(['left', 'right'] as const).map((side) => (
            <div key={side} className={styles.cluster}>
              {TOUCH_BUTTONS.filter((b) => b.side === side).map((b) => (
                <button
                  key={b.action}
                  type="button"
                  className={styles.key}
                  aria-label={b.action}
                  onPointerDown={press(b.action, true)}
                  onPointerUp={press(b.action, false)}
                  onPointerCancel={press(b.action, false)}
                  onPointerLeave={press(b.action, false)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
