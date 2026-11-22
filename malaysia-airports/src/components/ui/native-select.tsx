import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field, controlClasses, describedBy } from './field';
import { Icon, type IconName } from './icon';

export interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  iconStart?: IconName;
  fieldClassName?: string;
  /** `<option>` and `<optgroup>` elements. */
  children: ReactNode;
}

/**
 * A styled native `<select>`: the platform picker on phones, full keyboard support everywhere.
 * Preferred over custom listboxes for short lists (airport, terminal, level).
 *
 * @example
 * <NativeSelect label={t('common.labels.terminal')}><option value="T1">Terminal 1</option></NativeSelect>
 */
export function NativeSelect({ label, hideLabel, hint, error, iconStart, fieldClassName, className, id, children, ...rest }: NativeSelectProps) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <Field id={selectId} label={label} hideLabel={hideLabel} hint={hint} error={error} className={fieldClassName}>
      <div className="relative">
        {iconStart ? <Icon name={iconStart} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-3" /> : null}
        <select
          id={selectId}
          aria-describedby={describedBy(selectId, hint, error)}
          aria-invalid={error ? true : undefined}
          className={cn(controlClasses, 'appearance-none truncate pr-11 font-medium', iconStart && 'pl-11', className)}
          {...rest}
        >
          {children}
        </select>
        <Icon name="chevron-down" size="sm" strokeWidth={2} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-2" />
      </div>
    </Field>
  );
}
