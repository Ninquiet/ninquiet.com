import { useState, type PointerEvent } from 'react';
import type { Action } from '../game/input';
import styles from './TouchPad.module.css';

interface Props {
  onAction: (action: Action, pressed: boolean) => void;
  onQuit: () => void;
  onToggleMute: () => boolean;
}

interface PadKey {
  action: Action;
  label: string;
  className: string;
}

const MOVE_KEYS: PadKey[] = [
  { action: 'left', label: '◀', className: styles.key },
  { action: 'right', label: '▶', className: styles.key },
];

const ACTION_KEYS: PadKey[] = [
  { action: 'down', label: '▼', className: styles.key },
  { action: 'jump', label: 'JUMP', className: `${styles.key} ${styles.jump}` },
];

export default function TouchPad({ onAction, onQuit, onToggleMute }: Props) {
  const [muted, setMuted] = useState(false);

  const handlers = (action: Action) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.dataset.pressed = 'true';
      onAction(action, true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      delete event.currentTarget.dataset.pressed;
      onAction(action, false);
    },
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => {
      delete event.currentTarget.dataset.pressed;
      onAction(action, false);
    },
  });

  const renderKey = (key: PadKey) => (
    <button key={key.action} type="button" className={key.className} aria-label={key.action} {...handlers(key.action)}>
      {key.label}
    </button>
  );

  return (
    <div className={styles.root} data-no-zap onContextMenu={(event) => event.preventDefault()}>
      <div className={styles.system}>
        <button type="button" className={styles.small} onClick={() => setMuted(onToggleMute())} aria-label={muted ? 'Sound on' : 'Sound off'}>
          {muted ? '♪ OFF' : '♪ ON'}
        </button>
        <button type="button" className={styles.small} onClick={onQuit} aria-label="Quit game">
          ✕ QUIT
        </button>
      </div>
      <div className={styles.pad}>
        <div className={styles.cluster}>{MOVE_KEYS.map(renderKey)}</div>
        <div className={styles.cluster}>{ACTION_KEYS.map(renderKey)}</div>
      </div>
    </div>
  );
}
