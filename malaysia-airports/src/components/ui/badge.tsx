import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const TONES = {
  neutral: 'border-line-control text-ink',
  solid: 'border-ink bg-ink text-page',
  primary: 'border-transparent bg-primary-soft text-primary-ink',
  gold: 'border-gold bg-gold-soft text-gold-ink',
  positive: 'border-positive-border/50 bg-positive-bg text-positive-fg',
  warning: 'border-warning-border/50 bg-warning-bg text-warning-fg',
  critical: 'border-critical-border/50 bg-critical-bg text-critical-fg',
  info: 'border-info-border/50 bg-info-bg text-info-fg',
} as const;

const SIZES = {
  sm: 'h-badge-sm min-w-badge-sm px-1',
  md: 'h-badge min-w-badge px-1.5',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONES;
  /** sm 20px, md 24px (default). */
  size?: keyof typeof SIZES;
  /**
   * `code` (default): the mono label for flight numbers, times, gates and airport codes.
   * `label`: a place name ("Terminal 1", "KLIA Terminal 2") in the sans caption, semibold and
   * sentence case on a neutral tint (critique-redesign2 item 15: set as code, place names were the
   * noisiest marks on a card).
   */
  variant?: 'code' | 'label';
  children: ReactNode;
}

/**
 * A compact mono label for codes and counts: "T1", "NEW", "12". For words use `Chip`.
 *
 * @example <Badge tone="primary">{t('common.labels.new')}</Badge>
 */
export function Badge({ tone = 'neutral', size = 'md', variant = 'code', className, children, ...rest }: BadgeProps) {
  if (variant === 'label') {
    return (
      <span className={cn('type-caption inline-flex shrink-0 items-center rounded-pill bg-fill px-2.5 py-0.5 font-semibold text-ink-2', size === 'sm' ? 'min-h-badge-sm' : 'min-h-badge', className)} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn('type-data-xs inline-flex shrink-0 items-center justify-center rounded-xs border font-semibold', TONES[tone], SIZES[size], className)}
      {...rest}
    >
      {children}
    </span>
  );
}
