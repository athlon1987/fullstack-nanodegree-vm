'use client';

import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

export interface TooltipProps {
  /** Short, non-essential text. Anything a user must read belongs on the page, not in a tooltip. */
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** The focusable trigger element (a button or link). */
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

/** Hover delay before opening, as before (Radix `delayDuration`). */
const OPEN_DELAY_MS = 350;
/** Grace period to move the pointer from the trigger onto the tooltip (WCAG 1.4.13, hoverable). */
const CLOSE_DELAY_MS = 120;
const OFFSET = 6;
const EDGE = 8;

/**
 * A hint on hover and keyboard focus. Touch users do not get tooltips, so never put required
 * information in one.
 *
 * Round 5 (E-03): a small component of its own instead of Radix Tooltip, whose positioning
 * engine was in the first-load script of every page because the header uses two tooltips. It
 * renders nothing until it opens (no markup to hydrate), and keeps the behaviour WCAG 1.4.13 asks
 * for: it opens after a short hover or on keyboard focus, stays open while the pointer is over the
 * trigger or the tooltip, closes with Escape, and never on touch. While open, the trigger is
 * described by it (`aria-describedby`). The position is fixed beside the trigger and kept 8 px
 * inside the window.
 *
 * @example <Tooltip content={t('search.shortcutHint')}><IconButton icon="search" label={t('nav.search')} /></Tooltip>
 */
export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const id = useId();
  const wrapper = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const clear = () => window.clearTimeout(timer.current);
  const show = (delay: number) => {
    clear();
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = (delay: number) => {
    clear();
    timer.current = window.setTimeout(() => setOpen(false), delay);
  };

  useEffect(() => clear, []);

  // Escape closes it wherever focus is (hover-only tooltips have no focused trigger).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clear();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = wrapper.current?.firstElementChild;
    const element = tip.current;
    if (!trigger || !element) return;
    const anchor = trigger.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    let top = side === 'bottom' ? anchor.bottom + OFFSET : side === 'top' ? anchor.top - OFFSET - box.height : anchor.top + (anchor.height - box.height) / 2;
    let left = side === 'right' ? anchor.right + OFFSET : side === 'left' ? anchor.left - OFFSET - box.width : anchor.left + (anchor.width - box.width) / 2;
    left = Math.min(Math.max(left, EDGE), width - EDGE - box.width);
    top = Math.min(Math.max(top, EDGE), height - EDGE - box.height);
    // Placed directly: it is measured first, so it starts hidden and becomes visible here.
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
    element.style.visibility = 'visible';
  }, [open, side]);

  return (
    // `display: contents`: the trigger keeps its own place in the layout (and its own hiding classes).
    <span
      ref={wrapper}
      className="contents"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') show(open ? 0 : OPEN_DELAY_MS);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') hide(CLOSE_DELAY_MS);
      }}
      onPointerDown={() => {
        clear();
        setOpen(false);
      }}
      onFocus={(event) => {
        if (event.target === wrapper.current?.firstElementChild && event.target.matches(':focus-visible')) show(0);
      }}
      onBlur={() => {
        clear();
        setOpen(false);
      }}
    >
      {cloneElement(children, { 'aria-describedby': open ? id : children.props['aria-describedby'] })}
      {open ? (
        <span
          ref={tip}
          id={id}
          role="tooltip"
          style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
          className="type-caption z-50 max-w-64 animate-fade-in rounded-sm border border-transparent bg-inverse px-2.5 py-1.5 font-medium text-on-inverse shadow-md"
          onPointerEnter={clear}
          onPointerLeave={() => hide(CLOSE_DELAY_MS)}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
