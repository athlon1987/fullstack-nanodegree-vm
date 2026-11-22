import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icon';

/* Direction v2: a soft tinted panel with the tone's icon in a round badge. The edge is a faint
   tint of the tone; the in-app high-contrast setting restores the full border. */
const TONES = {
  neutral: { box: 'border-line bg-surface-sunken', icon: 'bg-surface text-ink-2', glyph: 'info' },
  info: { box: 'border-info-border/35 bg-info-bg hc:border-info-border', icon: 'bg-surface/70 text-info-fg', glyph: 'info' },
  positive: { box: 'border-positive-border/35 bg-positive-bg hc:border-positive-border', icon: 'bg-surface/70 text-positive-fg', glyph: 'circle-check' },
  warning: { box: 'border-warning-border/40 bg-warning-bg hc:border-warning-border', icon: 'bg-surface/70 text-warning-fg', glyph: 'triangle-alert' },
  critical: { box: 'border-critical-border/40 bg-critical-bg hc:border-critical-border', icon: 'bg-surface/70 text-critical-fg', glyph: 'octagon-alert' },
} as const satisfies Record<string, { box: string; icon: string; glyph: IconName }>;

export type CalloutTone = keyof typeof TONES;

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: CalloutTone;
  title?: ReactNode;
  /** Override the tone's icon. */
  icon?: IconName;
  /** Links or buttons shown under the text. */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * A message set apart from the page: something to know (`info`), something that went well
 * (`positive`), something to act on (`warning`) or something that blocks the journey
 * (`critical`). Tone is always carried by the icon and the words as well as the colour.
 *
 * @example <Callout tone="warning" title={t('parking.ratesNotVerified')}>{t('parking.ratesNotVerifiedBody')}</Callout>
 */
export function Callout({ tone = 'neutral', title, icon, actions, className, children, role = 'note', ...rest }: CalloutProps) {
  const style = TONES[tone];
  return (
    <div role={role} className={cn('flex gap-3.5 rounded-xl border p-4 text-ink sm:p-5', style.box, className)} {...rest}>
      <span aria-hidden="true" className={cn('-mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', style.icon)}>
        <Icon name={icon ?? style.glyph} size="sm" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        {title ? <p className="type-title-sm text-ink">{title}</p> : null}
        {children ? <div className={cn('type-body-sm text-ink-2 sm:text-base', title && 'mt-1')}>{children}</div> : null}
        {actions ? <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">{actions}</div> : null}
      </div>
    </div>
  );
}
