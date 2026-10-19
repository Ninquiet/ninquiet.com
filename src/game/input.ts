export type Action = 'left' | 'right' | 'jump' | 'down';

const KEYMAP: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'down',
  KeyS: 'down',
};

export interface InputCommands {
  onQuit: () => void;
  onMute: () => void;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export class Input {
  private readonly held = new Set<Action>();
  private readonly virtual = new Set<Action>();
  private jumpPressed = false;
  private jumpReleased = false;
  private downPressed = false;
  private active = false;

  constructor(private readonly commands: InputCommands) {}

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.reset);
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.reset);
  }

  setActive(active: boolean): void {
    this.active = active;
    this.reset();
  }

  isDown(action: Action): boolean {
    return this.held.has(action) || this.virtual.has(action);
  }

  axis(): number {
    return (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
  }

  consumeJumpPressed(): boolean {
    const value = this.jumpPressed;
    this.jumpPressed = false;
    return value;
  }

  consumeJumpReleased(): boolean {
    const value = this.jumpReleased;
    this.jumpReleased = false;
    return value;
  }

  consumeDownPressed(): boolean {
    const value = this.downPressed;
    this.downPressed = false;
    return value;
  }

  setVirtual(action: Action, pressed: boolean): void {
    if (pressed && !this.virtual.has(action)) this.press(action);
    if (!pressed && this.virtual.has(action)) this.release(action);
    if (pressed) this.virtual.add(action);
    else this.virtual.delete(action);
  }

  private press(action: Action): void {
    if (action === 'jump') this.jumpPressed = true;
    if (action === 'down') this.downPressed = true;
  }

  private release(action: Action): void {
    if (action === 'jump') this.jumpReleased = true;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.active || isTyping(event.target)) return;
    if (event.code === 'Escape') {
      this.commands.onQuit();
      return;
    }
    if (event.code === 'KeyM') {
      this.commands.onMute();
      return;
    }
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat && !this.held.has(action)) this.press(action);
    this.held.add(action);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (this.held.has(action)) this.release(action);
    this.held.delete(action);
  };

  private reset = (): void => {
    this.held.clear();
    this.virtual.clear();
    this.jumpPressed = false;
    this.jumpReleased = false;
    this.downPressed = false;
  };
}
