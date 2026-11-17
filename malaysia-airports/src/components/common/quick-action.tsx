import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from '@/components/ui/icon';
import { LocaleLink } from './locale-link';

export interface QuickActionProps {
  /** A registry name or a domain key (`parking`, `rail`, `dine`). */
  icon: IconKey;
  title: string;
  /** One short line under the title. Hidden on phones in the `compact` layout. */
  hint?: string;
  /** Path without the locale. */
  href: string;
  /** Marks the first action for the current journey mode (a solid ink tile with a label such as "Start here"). */
  emphasis?: boolean;
  /** Text of the emphasis label. */
  emphasisLabel?: string;
  /** `tile` (default): icon above text. `row`: icon beside text, for lists and phones. */
  layout?: 'tile' | 'row';
  /** Extra content under the hint (a count, a chip). */
  children?: ReactNode;
  className?: string;
}

/**
 * A large, whole-surface link to a task: "Track a flight", "Parking", "Terminal maps".
 *
 * @example <QuickAction icon="parking" title={t('nav.parking')} hint="..." href={`/${airport}/parking`} />
 */
export function QuickAction({ icon, title, hint, href, emphasis = false, emphasisLabel, layout = 'tile', children, className }: QuickActionProps) {
  return (
    <LocaleLink
      href={href}
      className={cn(
        'group relative flex min-h-13 min-w-0 rounded-lg border p-4 transition-[border-color,background-color,box-shadow] duration-fast',
        layout === 'tile' ? 'flex-col gap-3 sm:p-5' : 'items-center gap-3.5',
        emphasis
          ? 'border-ink bg-ink text-page hover:shadow-md'
          : 'border-line-strong bg-surface text-ink hover:border-ink-3 hover:bg-surface-raised hover:shadow-sm',
        className,
      )}
    >
      <span className={cn('flex items-center justify-between gap-3', layout === 'row' && 'shrink-0')}>
        <Icon name={icon} size="lg" className={emphasis ? 'text-page' : 'text-primary-ink'} />
        {emphasis && emphasisLabel && layout === 'tile' ? (
          <span className="type-data-xs rounded-xs border border-current px-1.5 py-0.5 font-semibold">{emphasisLabel}</span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-title-sm block sm:text-lg">{title}</span>
        {hint ? <span className={cn('type-body-sm mt-0.5 block', emphasis ? 'opacity-85' : 'text-ink-2')}>{hint}</span> : null}
        {children}
      </span>
      <Icon
        name="arrow-right"
        size="sm"
        strokeWidth={1.75}
        className={cn(
          'shrink-0 transition-transform duration-base group-hover:translate-x-0.5',
          layout === 'tile' ? 'absolute right-4 bottom-4 hidden sm:block' : '',
          emphasis ? 'text-page' : 'text-ink-3',
          layout === 'tile' && emphasis && emphasisLabel ? 'sm:hidden' : '',
        )}
      />
    </LocaleLink>
  );
}
