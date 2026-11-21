import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * A loading placeholder. Size it with utilities; it is hidden from assistive technology, so
 * pair a group of skeletons with one `role="status"` message.
 *
 * @example <Skeleton className="h-row w-full" />
 */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden="true" className={cn('block max-w-full animate-shimmer rounded-sm bg-neutral-bg', className)} {...rest} />;
}

/** Lines of placeholder text; the last line is shorter. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-4', index === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </span>
  );
}
