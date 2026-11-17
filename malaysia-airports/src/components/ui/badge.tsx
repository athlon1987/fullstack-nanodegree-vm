import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const TONES = {
  neutral: 'border-line-control text-ink',
  solid: 'border-ink bg-ink text-page',
  primary: 'border-transparent bg-primary-soft text-primary-ink',
  gold: 'border-gold text-gold-ink',
  positive: 'border-positive-border bg-positive-bg text-positive-fg',
  warning: 'border-warning-border bg-warning-bg text-warning-fg',
  critical: 'border-critical-border bg-critical-bg text-critical-fg',
  info: 'border-info-border bg-info-bg text-info-fg',
} as const;

const SIZES = {
  sm: 'h-badge-sm min-w-badge-sm px-1',
  md: 'h-badge min-w-badge px-1.5',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONES;
  /** sm 20px, md 24px (default). */
  size?: keyof typeof SIZES;
  children: ReactNode;
}

/**
 * A compact mono label for codes and counts: "T1", "NEW", "12". For words use `Chip`.
 *
 * @example <Badge tone="primary">{t('common.labels.new')}</Badge>
 */
export function Badge({ tone = 'neutral', size = 'md', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn('type-data-xs inline-flex shrink-0 items-center justify-center rounded-xs border font-semibold', TONES[tone], SIZES[size], className)}
      {...rest}
    >
      {children}
    </span>
  );
}
