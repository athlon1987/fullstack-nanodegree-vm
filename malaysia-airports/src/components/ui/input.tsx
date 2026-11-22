import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Field, controlClasses, describedBy } from './field';
import { Icon, type IconName } from './icon';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Every input has a label. Hide it visually with `hideLabel` only when the context names the field. */
  label: string;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  optionalLabel?: string;
  iconStart?: IconName;
  /** Mono, tabular figures: flight numbers, times, bay numbers. */
  mono?: boolean;
  /** Class for the outer field wrapper (`className` goes to the input). */
  fieldClassName?: string;
}

/**
 * Text input with its label, hint and error.
 *
 * @example <Input label={t('journey.saved.parkedCar.zone')} hint={...} mono />
 */
export function Input({ label, hideLabel, hint, error, optionalLabel, iconStart, mono, fieldClassName, className, id, ...rest }: InputProps) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <Field id={inputId} label={label} hideLabel={hideLabel} hint={hint} error={error} optionalLabel={optionalLabel} className={fieldClassName}>
      <div className="relative">
        {iconStart ? <Icon name={iconStart} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" /> : null}
        <input
          id={inputId}
          aria-describedby={describedBy(inputId, hint, error)}
          aria-invalid={error ? true : undefined}
          className={cn(controlClasses, iconStart && 'pl-11', mono && 'font-mono tabular-nums', className)}
          {...rest}
        />
      </div>
    </Field>
  );
}
