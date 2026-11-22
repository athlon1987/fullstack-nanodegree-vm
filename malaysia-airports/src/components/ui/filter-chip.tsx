'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from './icon';

export interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  pressed: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** Shown while not pressed; a check mark replaces it when pressed. */
  icon?: IconKey;
  /** Optional result count, shown in tabular figures. */
  count?: number;
  children: ReactNode;
}

/**
 * A toggle for filters ("Open now", "Halal", "Before security"). It is a real button with
 * `aria-pressed`; the pressed state shows a check mark as well as the fill, never colour alone.
 *
 * @example <FilterChip pressed={openNow} onPressedChange={setOpenNow}>{t('common.labels.openNow')}</FilterChip>
 */
export function FilterChip({ pressed, onPressedChange, icon, count, className, children, onClick, ...rest }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange?.(!pressed);
      }}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill border px-3.5 text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,scale] duration-fast motion-ok:active:scale-[0.97] touch:h-11',
        pressed
          ? 'border-transparent bg-ink text-page shadow-sm'
          : 'border-line-strong bg-surface text-ink shadow-xs hover:border-line-control hover:bg-page-subtle',
        'disabled:border-transparent disabled:bg-fill disabled:text-ink-3 disabled:shadow-none',
        className,
      )}
      {...rest}
    >
      {pressed ? <Icon name="check" size="sm" strokeWidth={2.25} /> : icon ? <Icon name={icon} size="sm" /> : null}
      {children}
      {count !== undefined ? <span className="type-data-sm opacity-75">{count}</span> : null}
    </button>
  );
}
