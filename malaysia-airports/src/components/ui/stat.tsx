import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface StatProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: ReactNode;
  label: ReactNode;
  /** A qualifier under the label: the unit, the date, the source. */
  hint?: ReactNode;
  /** Use the mono data face instead of the display face (operational numbers). */
  mono?: boolean;
  size?: 'md' | 'lg';
}

/**
 * One number with its label. The label comes first in the markup so it is read first.
 *
 * @example <Stat value="39" label={t('common.labels.airports')} />
 */
export function Stat({ value, label, hint, mono = false, size = 'md', className, ...rest }: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col-reverse gap-1.5', className)} {...rest}>
      <div className="min-w-0">
        <p className="type-caption font-semibold text-ink-3">{label}</p>
        {hint ? <p className="type-caption mt-1 text-ink-2">{hint}</p> : null}
      </div>
      <p className={cn('text-ink', mono ? (size === 'lg' ? 'type-data-xl' : 'type-data-lg') : size === 'lg' ? 'type-display-lg' : 'type-display-md')}>{value}</p>
    </div>
  );
}
