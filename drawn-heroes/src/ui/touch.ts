import type { InputManager, PlayerInput } from '../core/input';

type Act = 'light' | 'heavy' | 'jump' | 'special' | 'dodge' | 'ult' | 'interact' | 'swap';

interface BtnDef {
  act: Act;
  label: string;
  sub: string;
  dx: number;
  dy: number;
  size: number;
}

// offsets from the bottom-right corner (px, before scaling); x grows leftwards
const CLUSTER: BtnDef[] = [
  { act: 'light', label: 'HIT', sub: 'LIGHT', dx: 70, dy: 74, size: 86 },
  { act: 'jump', label: '↑', sub: 'JUMP', dx: 64, dy: 176, size: 66 },
  { act: 'heavy', label: '!!', sub: 'HEAVY', dx: 166, dy: 48, size: 66 },
  { act: 'special', label: '★', sub: 'SPECIAL', dx: 158, dy: 140, size: 60 },
  { act: 'dodge', label: '⟲', sub: 'DODGE', dx: 250, dy: 42, size: 58 },
  { act: 'ult', label: '✸', sub: 'TEAM', dx: 244, dy: 122, size: 56 },
  { act: 'interact', label: '+', sub: 'HELP', dx: 146, dy: 228, size: 50 },
  { act: 'swap', label: '⇄', sub: 'SWAP', dx: 52, dy: 268, size: 44 },
];

interface Pad {
  player: number;
  zone: HTMLElement;
  base: HTMLElement;
  knob: HTMLElement;
  stickId: number | null;
  ox: number;
  oy: number;
  buttons: Map<Act, HTMLElement>;
}

/** On-screen controls: a floating joystick plus thumb buttons, multi-touch safe. */
export class TouchControls {
  readonly root: HTMLElement;
  private pads: Pad[] = [];
  private input: InputManager;
  private onSwap: () => void;
  private mode: 'solo' | 'coop' = 'solo';
  scale = 1;

  constructor(root: HTMLElement, input: InputManager, onSwap: () => void) {
    this.root = root;
    this.input = input;
    this.onSwap = onSwap;
  }

  build(mode: 'solo' | 'coop'): void {
    this.mode = mode;
    this.root.innerHTML = '';
    this.pads = [];
    const players = mode === 'coop' ? [0, 1] : [0];
    for (const p of players) this.pads.push(this.makePad(p));
    this.layout();
  }

  private makePad(player: number): Pad {
    const zone = document.createElement('div');
    zone.className = 'stick-zone';
    zone.setAttribute('aria-label', `Player ${player + 1} movement stick`);
    const base = document.createElement('div');
    base.className = 'stick-base';
    const knob = document.createElement('div');
    knob.className = 'stick-knob';
    zone.append(base, knob);
    this.root.append(zone);
    const pad: Pad = { player, zone, base, knob, stickId: null, ox: 0, oy: 0, buttons: new Map() };
    zone.addEventListener('pointerdown', (e) => {
      if (pad.stickId !== null) return;
      e.preventDefault();
      this.input.markTouch();
      pad.stickId = e.pointerId;
      try {
        zone.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const r = zone.getBoundingClientRect();
      pad.ox = e.clientX - r.left;
      pad.oy = e.clientY - r.top;
      this.moveStick(pad, e.clientX - r.left, e.clientY - r.top);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pad.stickId) return;
      e.preventDefault();
      const r = zone.getBoundingClientRect();
      this.moveStick(pad, e.clientX - r.left, e.clientY - r.top);
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pad.stickId) return;
      pad.stickId = null;
      this.resetStick(pad);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);

    for (const b of CLUSTER) {
      if (b.act === 'swap' && this.mode === 'coop') continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `tbtn ${b.act}`;
      el.innerHTML = `<span aria-hidden="true">${b.label}</span><small>${b.sub}</small>`;
      el.setAttribute('aria-label', b.sub.toLowerCase());
      el.tabIndex = -1;
      const press = (e: PointerEvent) => {
        e.preventDefault();
        this.input.markTouch();
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        el.classList.add('down');
        if (b.act === 'swap') this.onSwap();
        else this.set(player, b.act, true);
      };
      const release = (e: PointerEvent) => {
        e.preventDefault();
        el.classList.remove('down');
        if (b.act !== 'swap') this.set(player, b.act, false);
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      this.root.append(el);
      pad.buttons.set(b.act, el);
    }
    return pad;
  }

  private set(player: number, act: Exclude<Act, 'swap'>, v: boolean): void {
    const t = this.input.touch[player];
    (t as unknown as Record<string, boolean>)[act] = v;
  }

  private moveStick(pad: Pad, x: number, y: number): void {
    const R = 54 * this.scale;
    let dx = x - pad.ox;
    let dy = y - pad.oy;
    const m = Math.hypot(dx, dy);
    if (m > R) {
      // drag the origin along so direction changes stay responsive
      pad.ox += (dx / m) * (m - R);
      pad.oy += (dy / m) * (m - R);
      dx = x - pad.ox;
      dy = y - pad.oy;
    }
    pad.base.style.left = `${pad.ox}px`;
    pad.base.style.top = `${pad.oy}px`;
    pad.knob.style.left = `${pad.ox + dx}px`;
    pad.knob.style.top = `${pad.oy + dy}px`;
    pad.base.style.display = pad.knob.style.display = 'block';
    let vx = dx / R;
    let vy = dy / R;
    const mag = Math.hypot(vx, vy);
    if (mag < 0.18) vx = vy = 0;
    const t: PlayerInput = this.input.touch[pad.player];
    t.mx = Math.max(-1, Math.min(1, vx));
    t.mz = Math.max(-1, Math.min(1, vy));
  }

  private resetStick(pad: Pad): void {
    const t = this.input.touch[pad.player];
    t.mx = 0;
    t.mz = 0;
    const r = pad.zone.getBoundingClientRect();
    pad.ox = r.width * 0.45;
    pad.oy = r.height * 0.62;
    pad.base.style.left = pad.knob.style.left = `${pad.ox}px`;
    pad.base.style.top = pad.knob.style.top = `${pad.oy}px`;
  }

  /** Position everything for the current viewport. */
  layout(): void {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cs = getComputedStyle(document.documentElement);
    const inset = (n: string) => parseFloat(cs.getPropertyValue(n)) || 0;
    const sar = inset('--sar');
    const sal = inset('--sal');
    const sab = inset('--sab');
    const split = this.mode === 'coop';
    const k = this.scale * (split ? 0.78 : Math.min(1, Math.max(0.72, Math.min(W, H) / 420)));
    for (const pad of this.pads) {
      const right = pad.player === 1;
      const zoneW = split ? W * 0.22 : W * 0.45;
      pad.zone.style.width = `${zoneW}px`;
      pad.zone.style.height = `${H * 0.62}px`;
      pad.zone.style.left = right ? `${W - zoneW}px` : '0px';
      pad.zone.style.bottom = '0px';
      // cluster anchor
      let ax: number;
      let dir: number;
      if (!split) {
        ax = W - sar - 10;
        dir = -1;
      } else if (pad.player === 0) {
        ax = W * 0.5 - 30;
        dir = -1;
      } else {
        ax = W * 0.5 + 30;
        dir = 1;
      }
      const ay = H - sab - 8;
      for (const b of CLUSTER) {
        const el = pad.buttons.get(b.act);
        if (!el) continue;
        const size = b.size * k;
        el.style.width = el.style.height = `${size}px`;
        el.style.fontSize = `${size * 0.36}px`;
        el.style.left = `${ax + dir * b.dx * k}px`;
        el.style.top = `${ay - b.dy * k}px`;
      }
      if (!split) pad.zone.style.left = `${sal}px`;
      this.resetStick(pad);
    }
  }

  /** Highlight buttons whose ability is ready. */
  setReady(player: number, special: boolean, ult: boolean): void {
    const pad = this.pads.find((p) => p.player === player);
    if (!pad) return;
    pad.buttons.get('special')?.classList.toggle('ready', special);
    pad.buttons.get('ult')?.classList.toggle('ready', ult);
  }

  releaseAll(): void {
    for (const pad of this.pads) {
      pad.stickId = null;
      this.resetStick(pad);
      pad.buttons.forEach((el) => el.classList.remove('down'));
    }
    for (const t of this.input.touch) {
      t.mx = t.mz = 0;
      t.jump = t.light = t.heavy = t.special = t.dodge = t.ult = t.interact = false;
    }
  }
}
