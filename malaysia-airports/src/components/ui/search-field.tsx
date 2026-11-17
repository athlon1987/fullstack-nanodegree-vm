'use client';

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { Icon, type IconName } from './icon';

const SIZES = {
  md: { field: 'min-h-11', input: 'h-11 text-base', pad: 'pl-10', icon: 'left-3', gap: 'left-10' },
  lg: { field: 'min-h-13', input: 'h-13 text-base sm:text-lg', pad: 'pl-12', icon: 'left-4', gap: 'left-12' },
} as const;

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange' | 'value' | 'defaultValue'> {
  /** The accessible name of the field. Visible unless `hideLabel` (the default for search). */
  label: string;
  hideLabel?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called after the clear button empties the field. */
  onClear?: () => void;
  /** Placeholder text. Never clipped: it is truncated with an ellipsis if it cannot fit. */
  placeholder?: string;
  /** A shorter placeholder (about 18 characters) shown while the field itself is narrower than 36rem, where the long one would not fit. */
  placeholderShort?: string;
  /** Leading icon; `null` for none. */
  icon?: IconName | null;
  /** md 44px (default), lg 52px. */
  size?: keyof typeof SIZES;
  /** Rendered inside the field after the clear button: usually the submit `Button`. */
  trailing?: ReactNode;
  /** Helper text under the field, linked with `aria-describedby`. */
  hint?: ReactNode;
  fieldClassName?: string;
}

/**
 * Search input with a label, an optional leading icon and a clear button that appears once
 * there is text. Works controlled (`value` + `onValueChange`) or uncontrolled.
 *
 * @example
 * <SearchField label={t('flights.search.label')} placeholder={t('flights.search.placeholder')} onValueChange={setQuery} />
 */
export function SearchField({
  label,
  hideLabel = true,
  value,
  defaultValue,
  onValueChange,
  onClear,
  placeholder,
  placeholderShort,
  icon = 'search',
  size = 'md',
  trailing,
  hint,
  fieldClassName,
  className,
  id,
  ...rest
}: SearchFieldProps) {
  const t = useT();
  const generated = useId();
  const inputId = id ?? generated;
  const ref = useRef<HTMLInputElement>(null);
  const s = SIZES[size];

  // Text typed before hydration stays in the DOM (React does not overwrite it while hydrating)
  // but not in the parent's state, so the next render would erase it. Hand it over once.
  const adopted = useRef(false);
  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;
    const input = ref.current;
    if (input && value !== undefined && input.value !== value) onValueChange?.(input.value);
  }, [value, onValueChange]);

  const clear = () => {
    const input = ref.current;
    if (!input) return;
    if (value === undefined) input.value = '';
    onValueChange?.('');
    onClear?.();
    input.focus();
  };

  return (
    <div className={cn('@container flex min-w-0 flex-col gap-1.5', fieldClassName)}>
      <label htmlFor={inputId} className={cn('type-body-sm font-semibold text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div
        className={cn(
          'group relative flex items-center rounded-md border border-line-control bg-surface transition-colors duration-fast',
          'hover:border-ink has-[input:focus-visible]:focus-ring has-[input:focus-visible]:border-ink',
          s.field,
        )}
      >
        {icon ? <Icon name={icon} className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-3', s.icon)} /> : null}
        <div className="relative min-w-0 flex-1">
          <input
            ref={ref}
            id={inputId}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            /* A single space keeps :placeholder-shown working; the visible placeholder is the span below. */
            placeholder=" "
            aria-describedby={hint ? `${inputId}-hint` : undefined}
            {...(value !== undefined ? { value } : { defaultValue })}
            onChange={(event) => onValueChange?.(event.target.value)}
            className={cn(
              'peer block w-full min-w-0 appearance-none rounded-md bg-transparent pr-2 text-ink outline-none',
              s.input,
              icon ? s.pad : 'pl-3',
              className,
            )}
            {...rest}
          />
          {placeholder ? (
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 truncate text-ink-3 peer-placeholder-shown:block',
                size === 'lg' ? 'text-base sm:text-lg' : 'text-base',
                icon ? s.gap : 'left-3',
              )}
            >
              {placeholderShort ? (
                <>
                  <span className="@xl:hidden">{placeholderShort}</span>
                  <span className="hidden @xl:inline">{placeholder}</span>
                </>
              ) : (
                placeholder
              )}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={clear}
          aria-label={t('common.actions.clear')}
          className="mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-2 transition-colors duration-fast group-has-[input:placeholder-shown]:hidden hover:bg-page-subtle hover:text-ink touch:size-11"
        >
          <Icon name="x" size="sm" strokeWidth={2} />
        </button>
        {trailing ? <div className="relative mr-1 flex shrink-0 items-center">{trailing}</div> : null}
      </div>
      {hint ? (
        <p id={`${inputId}-hint`} className="type-caption text-ink-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
