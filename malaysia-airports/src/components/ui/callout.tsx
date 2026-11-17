import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icon';

const TONES = {
  neutral: { box: 'border-line-strong bg-page-subtle', icon: 'text-ink-2', glyph: 'info' },
  info: { box: 'border-info-border bg-info-bg', icon: 'text-info-fg', glyph: 'info' },
  positive: { box: 'border-positive-border bg-positive-bg', icon: 'text-positive-fg', glyph: 'circle-check' },
  warning: { box: 'border-warning-border bg-warning-bg', icon: 'text-warning-fg', glyph: 'triangle-alert' },
  critical: { box: 'border-critical-border bg-critical-bg', icon: 'text-critical-fg', glyph: 'octagon-alert' },
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
    <div role={role} className={cn('flex gap-3 rounded-lg border p-4 text-ink sm:p-5', style.box, className)} {...rest}>
      <Icon name={icon ?? style.glyph} strokeWidth={1.75} className={cn('mt-0.5', style.icon)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="type-title-sm text-ink">{title}</p> : null}
        {children ? <div className={cn('type-body-sm text-ink-2 sm:text-base', title && 'mt-1')}>{children}</div> : null}
        {actions ? <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">{actions}</div> : null}
      </div>
    </div>
  );
}
