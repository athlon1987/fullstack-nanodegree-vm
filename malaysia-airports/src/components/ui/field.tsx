import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './icon';

/** Shared look of text inputs and selects: 44px tall, 16px text, a 3:1 boundary. */
export const controlClasses =
  'h-11 w-full rounded-md border border-line-control bg-surface px-3 text-base text-ink transition-colors duration-fast ' +
  'placeholder:text-ink-3 hover:border-ink disabled:border-line disabled:bg-neutral-bg disabled:text-ink-3 ' +
  'aria-invalid:border-critical-fg aria-invalid:border-2';

export interface FieldProps {
  id: string;
  label: string;
  /** Keep the label for assistive technology but hide it visually. */
  hideLabel?: boolean;
  /** Short helper text under the control. */
  hint?: ReactNode;
  /** Error message. It is announced, shown with an icon, and marks the control invalid. */
  error?: ReactNode;
  /** Shown after the label, for example `t('common.labels.optional')`. */
  optionalLabel?: string;
  className?: string;
  children: ReactNode;
}

/** `aria-describedby` for a control inside a `Field`. */
export function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

/** Label, hint and error around a form control. Used by `Input`, `NativeSelect` and `SearchField`. */
export function Field({ id, label, hideLabel = false, hint, error, optionalLabel, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('type-body-sm font-semibold text-ink', hideLabel && 'sr-only')}>
        {label}
        {optionalLabel ? <span className="ml-1.5 font-normal text-ink-3">({optionalLabel})</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="type-caption text-ink-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="type-caption flex items-start gap-1.5 font-medium text-critical-fg">
          <Icon name="circle-alert" size="sm" strokeWidth={2} className="mt-px" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
