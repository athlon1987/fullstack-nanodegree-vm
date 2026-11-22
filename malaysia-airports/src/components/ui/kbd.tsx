import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * A keyboard key.
 *
 * @example <Kbd>/</Kbd>
 */
export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'type-data-sm inline-flex h-6 min-w-6 items-center justify-center rounded-xs border border-line-strong bg-surface px-1.5 text-ink-2 shadow-[inset_0_-1px_0_var(--color-line-strong)]',
        className,
      )}
      {...rest}
    />
  );
}
