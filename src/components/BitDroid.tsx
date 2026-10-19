import { useEffect, useRef, useState } from 'react';
import { Game, type Phase } from '../game/game';
import type { Action } from '../game/input';
import { PALETTE_EVENT, readAccents } from '../lib/palette';
import styles from './BitDroid.module.css';
import TouchPad from './TouchPad.tsx';

export default function BitDroid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const hitboxRef = useRef<HTMLButtonElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const background = backgroundRef.current;
    const hitbox = hitboxRef.current;
    if (!canvas || !background || !hitbox) return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    setTouch(coarse);
    const game = new Game({ canvas, background, hitbox, readAccents, onPhase: setPhase, touch: coarse });
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

  return (
    <>
      <canvas ref={backgroundRef} className={styles.city} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <button
        ref={hitboxRef}
        type="button"
        className={styles.hitbox}
        aria-label="Play the BitDroid mini game"
        onClick={() => gameRef.current?.start()}
      />
      {touch && phase === 'playing' && (
        <TouchPad
          onAction={(action: Action, pressed: boolean) => gameRef.current?.controls.setVirtual(action, pressed)}
          onQuit={() => gameRef.current?.quit()}
          onToggleMute={() => gameRef.current?.toggleMute() ?? false}
        />
      )}
    </>
  );
}
