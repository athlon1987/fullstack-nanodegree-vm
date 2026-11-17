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
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors duration-fast touch:h-11',
        pressed ? 'border-ink bg-ink text-page' : 'border-line-control bg-surface text-ink hover:border-ink hover:bg-page-subtle',
        'disabled:border-line disabled:bg-neutral-bg disabled:text-ink-3',
        className,
      )}
      {...rest}
    >
      {pressed ? <Icon name="check" size="sm" strokeWidth={2.25} /> : icon ? <Icon name={icon} size="sm" /> : null}
      {children}
      {count !== undefined ? <span className="type-data-sm opacity-80">{count}</span> : null}
    </button>
  );
}
