import type { KeyAction, KeyOverrides } from './save';

export interface PlayerInput {
  mx: number;
  mz: number;
  jump: boolean;
  light: boolean;
  heavy: boolean;
  special: boolean;
  dodge: boolean;
  ult: boolean;
  interact: boolean;
}

export type NavAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back' | 'pause' | 'swap';
export type Device = 'keyboard' | 'gamepad' | 'touch';

export const KEY_ACTIONS: KeyAction[] = ['left', 'right', 'up', 'down', 'jump', 'light', 'heavy', 'special', 'dodge', 'ult', 'interact'];

export const ACTION_LABELS: Record<KeyAction, string> = {
  left: 'Move left',
  right: 'Move right',
  up: 'Move back (depth)',
  down: 'Move forward (depth)',
  jump: 'Jump',
  light: 'Light attack',
  heavy: 'Heavy attack (hold to charge)',
  special: 'Special ability',
  dodge: 'Dodge (with direction) / Block (hold still)',
  ult: 'Ultimate / Team Finisher',
  interact: 'Interact / Revive / Co-op combo',
};

type Map = Record<KeyAction, string[]>;

export const KEYS_SOLO: Map = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  jump: ['Space'],
  light: ['KeyJ'],
  heavy: ['KeyK'],
  special: ['KeyL'],
  dodge: ['ShiftLeft', 'ShiftRight'],
  ult: ['KeyI'],
  interact: ['KeyE'],
};

export const KEYS_P1: Map = {
  left: ['KeyA'],
  right: ['KeyD'],
  up: ['KeyW'],
  down: ['KeyS'],
  jump: ['Space'],
  light: ['KeyC'],
  heavy: ['KeyV'],
  special: ['KeyB'],
  dodge: ['ShiftLeft'],
  ult: ['KeyQ'],
  interact: ['KeyE'],
};

export const KEYS_P2: Map = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  jump: ['KeyU', 'Numpad0'],
  light: ['KeyJ', 'Numpad1'],
  heavy: ['KeyK', 'Numpad2'],
  special: ['KeyL', 'Numpad3'],
  dodge: ['KeyO', 'NumpadEnter'],
  ult: ['KeyI', 'Numpad4'],
  interact: ['KeyP', 'Numpad5'],
};

export function applyOverrides(base: Map, o: KeyOverrides): Map {
  const out = {} as Map;
  for (const a of KEY_ACTIONS) out[a] = o[a] ? [o[a]!, ...base[a].slice(1).filter((k) => k !== o[a])] : [...base[a]];
  return out;
}

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  const map: Record<string, string> = {
    Space: 'Space',
    ShiftLeft: 'L-Shift',
    ShiftRight: 'R-Shift',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Enter: 'Enter',
    Escape: 'Esc',
    Tab: 'Tab',
    ControlLeft: 'L-Ctrl',
    ControlRight: 'R-Ctrl',
    AltLeft: 'L-Alt',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Semicolon: ';',
    Quote: "'",
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Minus: '-',
    Equal: '=',
  };
  return map[code] ?? code;
}

const emptyInput = (): PlayerInput => ({ mx: 0, mz: 0, jump: false, light: false, heavy: false, special: false, dodge: false, ult: false, interact: false });

/** Merges keyboard, gamepads and the touch overlay into two virtual controllers. */
export class InputManager {
  private keys = new Set<string>();
  private navQueue: NavAction[] = [];
  private padPrev: boolean[][] = [];
  private padAxisPrev: number[][] = [];
  private padRepeat = 0;
  mode: 'solo' | 'coop' = 'solo';
  maps: { solo: Map; p1: Map; p2: Map } = { solo: KEYS_SOLO, p1: KEYS_P1, p2: KEYS_P2 };
  pad1ToP2 = false;
  touch: PlayerInput[] = [emptyInput(), emptyInput()];
  lastDevice: Device = 'keyboard';
  gameKeysActive = false;
  private capture: ((code: string | null) => void) | null = null;
  onDeviceChange: ((d: Device) => void) | null = null;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('blur', () => this.clear());
    if (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) this.lastDevice = 'touch';
  }

  setMaps(solo: KeyOverrides, p1: KeyOverrides, p2: KeyOverrides): void {
    this.maps = { solo: applyOverrides(KEYS_SOLO, solo), p1: applyOverrides(KEYS_P1, p1), p2: applyOverrides(KEYS_P2, p2) };
  }

  captureKey(cb: (code: string | null) => void): void {
    this.capture = cb;
  }

  private setDevice(d: Device): void {
    if (this.lastDevice !== d) {
      this.lastDevice = d;
      this.onDeviceChange?.(d);
    }
  }

  markTouch(): void {
    this.setDevice('touch');
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    if (this.capture && down) {
      e.preventDefault();
      const cb = this.capture;
      this.capture = null;
      cb(e.code === 'Escape' ? null : e.code);
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text')) return;
    if (down) {
      this.setDevice('keyboard');
      if (!e.repeat) {
        const nav = this.keyNav(e.code);
        if (nav) this.navQueue.push(nav);
      }
      this.keys.add(e.code);
    } else this.keys.delete(e.code);
    const gameKey = e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab';
    if (gameKey && (this.gameKeysActive || e.code === 'Tab')) e.preventDefault();
  }

  private keyNav(code: string): NavAction | null {
    switch (code) {
      case 'ArrowUp':
      case 'KeyW':
        return 'up';
      case 'ArrowDown':
      case 'KeyS':
        return 'down';
      case 'ArrowLeft':
      case 'KeyA':
        return 'left';
      case 'ArrowRight':
      case 'KeyD':
        return 'right';
      case 'Escape':
        return 'pause';
      case 'KeyP':
        return this.mode === 'coop' ? null : 'pause';
      case 'Backspace':
        return 'back';
      case 'Tab':
        return 'swap';
    }
    return null;
  }

  clear(): void {
    this.keys.clear();
    this.touch = [emptyInput(), emptyInput()];
  }

  /** Navigation events since the last call (keyboard + gamepad). */
  pollNav(): NavAction[] {
    this.pollPads(true);
    const q = this.navQueue;
    this.navQueue = [];
    return q;
  }

  private keyState(map: Map): PlayerInput {
    const k = (a: KeyAction) => map[a].some((c) => this.keys.has(c));
    const mx = (k('right') ? 1 : 0) - (k('left') ? 1 : 0);
    const mz = (k('down') ? 1 : 0) - (k('up') ? 1 : 0);
    const m = Math.hypot(mx, mz) || 1;
    return {
      mx: mx / (m > 1 ? m : 1),
      mz: mz / (m > 1 ? m : 1),
      jump: k('jump'),
      light: k('light'),
      heavy: k('heavy'),
      special: k('special'),
      dodge: k('dodge'),
      ult: k('ult'),
      interact: k('interact'),
    };
  }

  private padState(p: Gamepad): PlayerInput {
    const b = (i: number) => !!p.buttons[i]?.pressed;
    let mx = p.axes[0] ?? 0;
    let mz = p.axes[1] ?? 0;
    if (Math.hypot(mx, mz) < 0.25) mx = mz = 0;
    if (b(14)) mx = -1;
    if (b(15)) mx = 1;
    if (b(12)) mz = -1;
    if (b(13)) mz = 1;
    return {
      mx,
      mz,
      jump: b(0),
      light: b(2),
      heavy: b(3),
      special: b(1),
      dodge: b(5) || b(6),
      ult: b(7),
      interact: b(4),
    };
  }

  private pads(): Gamepad[] {
    try {
      const list = navigator.getGamepads ? navigator.getGamepads() : [];
      return Array.from(list).filter((g): g is Gamepad => !!g && g.connected);
    } catch {
      return [];
    }
  }

  private pollPads(forNav: boolean): void {
    const pads = this.pads();
    pads.forEach((p, i) => {
      const prev = this.padPrev[i] ?? [];
      const now = p.buttons.map((x) => x.pressed);
      const pressed = (n: number) => now[n] && !prev[n];
      if (now.some(Boolean) || Math.abs(p.axes[0] ?? 0) > 0.5 || Math.abs(p.axes[1] ?? 0) > 0.5) this.setDevice('gamepad');
      if (forNav) {
        if (pressed(0)) this.navQueue.push('confirm');
        if (pressed(1)) this.navQueue.push('back');
        if (pressed(9)) this.navQueue.push('pause');
        if (pressed(8)) this.navQueue.push('swap');
        if (pressed(12)) this.navQueue.push('up');
        if (pressed(13)) this.navQueue.push('down');
        if (pressed(14)) this.navQueue.push('left');
        if (pressed(15)) this.navQueue.push('right');
        const ax = p.axes[0] ?? 0;
        const ay = p.axes[1] ?? 0;
        const prevA = this.padAxisPrev[i] ?? [0, 0];
        if (this.padRepeat > 0) this.padRepeat--;
        const fire = (cur: number, was: number, neg: NavAction, pos: NavAction) => {
          if (Math.abs(cur) > 0.6 && (Math.abs(was) <= 0.6 || this.padRepeat === 0)) {
            this.navQueue.push(cur < 0 ? neg : pos);
            this.padRepeat = 14;
          }
        };
        fire(ay, prevA[1], 'up', 'down');
        fire(ax, prevA[0], 'left', 'right');
        this.padAxisPrev[i] = [ax, ay];
        this.padPrev[i] = now;
      }
    });
  }

  read(): PlayerInput[] {
    const pads = this.pads();
    let p1: PlayerInput;
    let p2: PlayerInput;
    if (this.mode === 'solo') {
      p1 = this.keyState(this.maps.solo);
      p2 = emptyInput();
      for (const p of pads) p1 = merge(p1, this.padState(p));
    } else {
      p1 = this.keyState(this.maps.p1);
      p2 = this.keyState(this.maps.p2);
      const a = this.pad1ToP2 ? 1 : 0;
      if (pads[a]) p1 = merge(p1, this.padState(pads[a]));
      if (pads[1 - a]) p2 = merge(p2, this.padState(pads[1 - a]));
    }
    p1 = merge(p1, this.touch[0]);
    p2 = merge(p2, this.touch[1]);
    return [p1, p2];
  }

  get gamepadCount(): number {
    return this.pads().length;
  }
}

function merge(a: PlayerInput, b: PlayerInput): PlayerInput {
  const mx = Math.abs(b.mx) > Math.abs(a.mx) ? b.mx : a.mx;
  const mz = Math.abs(b.mz) > Math.abs(a.mz) ? b.mz : a.mz;
  return {
    mx,
    mz,
    jump: a.jump || b.jump,
    light: a.light || b.light,
    heavy: a.heavy || b.heavy,
    special: a.special || b.special,
    dodge: a.dodge || b.dodge,
    ult: a.ult || b.ult,
    interact: a.interact || b.interact,
  };
}
