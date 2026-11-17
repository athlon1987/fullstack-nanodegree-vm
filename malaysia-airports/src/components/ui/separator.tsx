import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface SeparatorProps extends HTMLAttributes<HTMLElement> {
  /** hairline (default), strong, or `rebung`: the gold pucuk rebung thread, decoration only. */
  variant?: 'hairline' | 'strong' | 'rebung';
  orientation?: 'horizontal' | 'vertical';
}

/**
 * A rule between groups of content. The `rebung` variant is the system's single gold accent:
 * use it once per view at most, never to carry meaning.
 *
 * @example <Separator variant="rebung" />
 */
export function Separator({ variant = 'hairline', orientation = 'horizontal', className, ...rest }: SeparatorProps) {
  if (variant === 'rebung') {
    return <div aria-hidden="true" className={cn('pattern-rebung w-full text-gold', className)} {...rest} />;
  }
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('w-px self-stretch', variant === 'strong' ? 'bg-line-strong' : 'bg-line', className)}
        {...rest}
      />
    );
  }
  return <hr className={cn('w-full border-0 border-t', variant === 'strong' ? 'border-line-strong' : 'border-line', className)} {...rest} />;
}
