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
  /** Marks the first action for the current journey mode (a solid tile with a label such as "Start here"). */
  emphasis?: boolean;
  /** Text of the emphasis label. */
  emphasisLabel?: string;
  /** `tile` (default): icon above text. `row`: icon beside text, for lists and phones. */
  layout?: 'tile' | 'row';
  /**
   * `default`: a white card on the page. `media`: smoky midnight glass for a tile laid over a
   * photograph or the hero art (the text inside takes the light ink, `on-media`).
   */
  tone?: 'default' | 'media';
  /** Extra content under the hint (a count, a chip). */
  children?: ReactNode;
  className?: string;
}

const TONES = {
  default: {
    tile: 'bg-surface text-ink shadow-sm ring-1 ring-line hover:shadow-md hover:ring-line-strong',
    emphasis: 'bg-ink text-page shadow-md ring-1 ring-ink hover:shadow-lg',
    badge: 'bg-primary-soft text-primary-ink',
    badgeEmphasis: 'bg-page/12 text-page',
  },
  media: {
    tile: 'glass-dark on-media text-ink hover:bg-[color-mix(in_srgb,var(--color-glass-dark)_86%,transparent)]',
    // Polish 1b (critique-redesign1b item 8): the first tile is outlined in gold, not filled white,
    // so it no longer reads as a second "selected" state under the journey mode switch.
    emphasis: 'glass-dark on-media text-ink ring-2 ring-gold-bright hover:bg-[color-mix(in_srgb,var(--color-glass-dark)_86%,transparent)]',
    badge: 'bg-[rgb(255_255_255/0.1)] text-ink ring-1 ring-[rgb(255_255_255/0.15)]',
    badgeEmphasis: 'bg-gold text-on-gold',
  },
} as const;

/**
 * A large, whole-surface link to a task: "Track a flight", "Parking", "Terminal maps". The icon sits
 * in a soft round badge; the tile lifts a little on hover where motion is allowed.
 *
 * @example <QuickAction icon="parking" title={t('nav.parking')} hint="..." href={`/${airport}/parking`} />
 */
export function QuickAction({ icon, title, hint, href, emphasis = false, emphasisLabel, layout = 'tile', tone = 'default', children, className }: QuickActionProps) {
  const style = TONES[tone];
  return (
    <LocaleLink
      href={href}
      className={cn(
        'group relative flex min-h-13 min-w-0 rounded-2xl p-4 transition-[box-shadow,background-color,translate] duration-base ease-out motion-ok:hover:-translate-y-0.5',
        layout === 'tile' ? 'flex-col gap-3 sm:p-5' : 'items-center gap-3.5',
        emphasis ? style.emphasis : style.tile,
        className,
      )}
    >
      <span className={cn('flex items-center justify-between gap-3', layout === 'row' && 'shrink-0')}>
        <span data-action-badge="" className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', emphasis ? style.badgeEmphasis : style.badge)}>
          <Icon name={icon} size="md" strokeWidth={1.75} />
        </span>
        {/* Shown here, but announced after the title, so the link's name starts with what it
            leads to ("Flights, … Start here"), not with the badge. */}
        {emphasis && emphasisLabel && layout === 'tile' ? (
          <span aria-hidden="true" data-emphasis-label="" className="type-caption rounded-pill border border-current px-2 py-0.5 font-semibold">
            {emphasisLabel}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-title-sm block sm:text-lg">{title}</span>
        {hint ? <span className={cn('type-body-sm mt-0.5 block', emphasis && tone !== 'media' ? 'opacity-85' : 'text-ink-2')}>{hint}</span> : null}
        {emphasis && emphasisLabel && layout === 'tile' ? <span className="sr-only">, {emphasisLabel}</span> : null}
        {children}
      </span>
      <Icon
        name="arrow-right"
        size="sm"
        strokeWidth={1.75}
        className={cn(
          'shrink-0 transition-transform duration-base motion-ok:group-hover:translate-x-0.5',
          layout === 'tile' ? 'absolute right-4 bottom-4 hidden sm:block' : '',
          emphasis && tone !== 'media' ? 'text-page' : 'text-ink-3',
          layout === 'tile' && emphasis && emphasisLabel ? 'sm:hidden' : '',
        )}
      />
    </LocaleLink>
  );
}
