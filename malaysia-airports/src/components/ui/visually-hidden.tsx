import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Text for assistive technology only.
 *
 * @example <VisuallyHidden>{t('common.labels.terminal')}</VisuallyHidden>
 */
export function VisuallyHidden({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('sr-only', className)} {...rest} />;
}
