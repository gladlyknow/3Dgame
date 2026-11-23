import type { DriveControl, InputState } from './types';

const KEY_TO_CONTROL: Record<string, DriveControl | undefined> = {
  ArrowUp: 'forward',
  w: 'forward',
  W: 'forward',
  ArrowDown: 'back',
  s: 'back',
  S: 'back',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

export class InputManager {
  readonly state: InputState = { forward: false, back: false, left: false, right: false };
  onHorn: () => void = () => undefined;

  constructor(root: ParentNode = document) {
    window.addEventListener('keydown', (event) => this.onKey(event, true));
    window.addEventListener('keyup', (event) => this.onKey(event, false));
    window.addEventListener('blur', () => this.reset());

    root.querySelectorAll<HTMLButtonElement>('[data-control]').forEach((button) => {
      const control = button.dataset.control as DriveControl;
      const press = (event: PointerEvent) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.state[control] = true;
        button.classList.add('pressed');
      };
      const release = (event: PointerEvent) => {
        event.preventDefault();
        this.state[control] = false;
        button.classList.remove('pressed');
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
  }

  reset(): void {
    this.state.forward = false;
    this.state.back = false;
    this.state.left = false;
    this.state.right = false;
    document.querySelectorAll('[data-control].pressed').forEach((node) => node.classList.remove('pressed'));
  }

  private onKey(event: KeyboardEvent, pressed: boolean): void {
    if (event.code === 'Space') {
      event.preventDefault();
      if (pressed && !event.repeat) this.onHorn();
      return;
    }
    const control = KEY_TO_CONTROL[event.key];
    if (!control) return;
    event.preventDefault();
    this.state[control] = pressed;
  }
}
