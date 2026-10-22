import type { NavAction } from '../core/input';

export type Actions = Record<string, (el: HTMLElement, ev: Event) => void>;

export interface ShowOptions {
  back?: () => void;
  dim?: boolean;
  focus?: string;
  onInput?: (el: HTMLInputElement) => void;
}

export const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Minimal screen manager: one DOM screen at a time, plus a modal layer and HUD overlays. */
export class UI {
  readonly root: HTMLElement;
  readonly hud: HTMLElement;
  private screen: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private back: (() => void) | null = null;
  private modalBack: (() => void) | null = null;
  onSound: ((kind: 'move' | 'select' | 'back') => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.hud = document.createElement('div');
    this.hud.className = 'hud-layer';
    this.root.append(this.hud);
  }

  get open(): boolean {
    return this.screen !== null || this.modal !== null;
  }

  show(html: string, actions: Actions, opts: ShowOptions = {}): HTMLElement {
    this.hide();
    const el = this.build(html, actions, opts, false);
    this.screen = el;
    this.back = opts.back ?? null;
    return el;
  }

  private build(html: string, actions: Actions, opts: ShowOptions, isModal: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `screen${opts.dim || isModal ? ' dim' : ''}`;
    el.innerHTML = html;
    el.addEventListener('click', (ev) => {
      const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!t || (t as HTMLButtonElement).disabled) return;
      const fn = actions[t.dataset.act!];
      if (fn) {
        this.onSound?.(t.dataset.act === 'back' ? 'back' : 'select');
        fn(t, ev);
      }
    });
    el.addEventListener('input', (ev) => {
      const t = ev.target as HTMLInputElement;
      if (opts.onInput) opts.onInput(t);
    });
    el.addEventListener('change', (ev) => {
      const t = ev.target as HTMLInputElement;
      if (t.type === 'checkbox' && opts.onInput) opts.onInput(t);
    });
    this.root.append(el);
    const focusEl = (opts.focus ? el.querySelector<HTMLElement>(opts.focus) : null) ?? this.focusables(el)[0];
    // focus without scrolling the page; only show the ring for keyboard/gamepad users
    window.setTimeout(() => focusEl?.focus({ preventScroll: true }), 0);
    return el;
  }

  hide(): void {
    this.screen?.remove();
    this.screen = null;
    this.back = null;
  }

  confirm(title: string, body: string, yes: string, no = 'Cancel'): Promise<boolean> {
    return new Promise((resolve) => {
      this.closeModal();
      const done = (v: boolean) => {
        this.closeModal();
        resolve(v);
      };
      this.modal = this.build(
        `<div class="card narrow" role="dialog" aria-modal="true" aria-labelledby="mdl-title">
          <h2 id="mdl-title">${esc(title)}</h2>
          <p>${esc(body)}</p>
          <div class="row" style="justify-content:flex-end">
            <button class="btn" data-act="no">${esc(no)}</button>
            <button class="btn primary" data-act="yes">${esc(yes)}</button>
          </div>
        </div>`,
        { yes: () => done(true), no: () => done(false) },
        { focus: '[data-act="no"]' },
        true,
      );
      this.modalBack = () => done(false);
    });
  }

  private closeModal(): void {
    this.modal?.remove();
    this.modal = null;
    this.modalBack = null;
  }

  private focusables(scope: HTMLElement): HTMLElement[] {
    return Array.from(scope.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), input, select, [data-nav]')).filter((e) => e.offsetParent !== null || e === document.activeElement);
  }

  /** Keyboard / gamepad navigation between controls in the active layer. */
  nav(a: NavAction): void {
    const scope = this.modal ?? this.screen;
    if (!scope) return;
    if (a === 'back' || a === 'pause') {
      if (this.modal && this.modalBack) this.modalBack();
      else if (this.back) {
        this.onSound?.('back');
        this.back();
      }
      return;
    }
    const list = this.focusables(scope);
    if (!list.length) return;
    const cur = document.activeElement as HTMLElement | null;
    const i = cur ? list.indexOf(cur) : -1;
    if (a === 'confirm') {
      if (cur && i >= 0) {
        if (cur instanceof HTMLInputElement && cur.type === 'checkbox') cur.click();
        else cur.click();
      }
      return;
    }
    if ((a === 'left' || a === 'right') && cur instanceof HTMLInputElement && cur.type === 'range') {
      const step = Number(cur.step || 0.05);
      cur.value = String(Number(cur.value) + (a === 'right' ? step : -step));
      cur.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const delta = a === 'up' || a === 'left' ? -1 : 1;
    const next = list[(i + delta + list.length) % list.length];
    next.focus({ preventScroll: false });
    this.onSound?.('move');
  }

  // ------------------------------------------------------------ HUD overlays
  private timed = new Map<string, number>();

  overlay(key: string, html: string, ms: number, cls: string): HTMLElement {
    this.clearOverlay(key);
    const el = document.createElement('div');
    el.className = cls;
    el.dataset.key = key;
    el.innerHTML = html;
    this.hud.append(el);
    if (ms > 0) this.timed.set(key, window.setTimeout(() => this.clearOverlay(key), ms));
    return el;
  }

  clearOverlay(key: string): void {
    const t = this.timed.get(key);
    if (t) window.clearTimeout(t);
    this.timed.delete(key);
    this.hud.querySelectorAll(`[data-key="${key}"]`).forEach((e) => e.remove());
  }

  clearOverlays(): void {
    this.timed.forEach((t) => window.clearTimeout(t));
    this.timed.clear();
    this.hud.innerHTML = '';
  }

  toast(text: string, ms = 1800): void {
    this.overlay('toast', esc(text), ms, 'toast');
  }
}
