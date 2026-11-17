import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from './icon';

const TONES = {
  neutral: 'border-line-strong bg-surface text-ink-2',
  outline: 'border-line-control bg-transparent text-ink',
  solid: 'border-ink bg-ink text-page',
  primary: 'border-transparent bg-primary-soft text-primary-ink',
  gold: 'border-transparent bg-gold-soft text-gold-ink',
  positive: 'border-positive-border bg-positive-bg text-positive-fg',
  warning: 'border-warning-border bg-warning-bg text-warning-fg',
  critical: 'border-critical-border bg-critical-bg text-critical-fg',
  info: 'border-info-border bg-info-bg text-info-fg',
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
        'type-caption inline-flex h-chip max-w-full items-center gap-1.5 rounded-sm border px-2 font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size="xs" strokeWidth={1.75} /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
