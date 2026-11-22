import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from './icon';

/* Direction v2: soft pills. Fills, not outlines; status tones keep a faint tinted edge, and the
   in-app high-contrast setting brings their full border back. */
const TONES = {
  neutral: 'border-transparent bg-fill text-ink-2',
  outline: 'border-line-control bg-transparent text-ink',
  solid: 'border-transparent bg-ink text-page',
  primary: 'border-transparent bg-primary-soft text-primary-ink',
  gold: 'border-transparent bg-gold-soft text-gold-ink',
  positive: 'border-positive-border/35 bg-positive-bg text-positive-fg hc:border-positive-border',
  warning: 'border-warning-border/35 bg-warning-bg text-warning-fg hc:border-warning-border',
  critical: 'border-critical-border/35 bg-critical-bg text-critical-fg hc:border-critical-border',
  info: 'border-info-border/35 bg-info-bg text-info-fg hc:border-info-border',
} as const;

export type ChipTone = keyof typeof TONES;

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  icon?: IconKey;
  children: ReactNode;
}

/**
 * A static tag: a category, an attribute, a fact about an item. Not interactive (use
 * `FilterChip` for toggles). Status tones always need an icon or explicit words.
 *
 * @example <Chip icon="moon-star">{t('common.labels.open24Hours')}</Chip>
 */
export function Chip({ tone = 'neutral', icon, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'type-caption inline-flex min-h-chip max-w-full items-center gap-1.5 rounded-pill border px-2.5 py-0.5 font-semibold',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size="xs" strokeWidth={1.75} /> : null}
      <span className="min-w-0">{children}</span>
    </span>
  );
}
