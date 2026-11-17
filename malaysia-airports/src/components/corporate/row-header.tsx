import type { ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * A row header cell for reference tables. The design-system `Th` is styled as a column heading
 * (small caps data type); row headers read as body text, in sentence case, at the row's height.
 */
export function RowHeader({ className, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="row"
      className={cn('type-body-sm h-row px-3 py-3 text-left align-middle font-semibold text-ink first:pl-4 sm:px-4 sm:text-base sm:first:pl-5', className)}
      {...rest}
    />
  );
}
