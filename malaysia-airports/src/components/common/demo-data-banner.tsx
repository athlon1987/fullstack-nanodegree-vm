'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { Icon } from '@/components/ui/icon';
import { LocaleLink } from './locale-link';

export interface DemoDataBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Replace the default body ("Flight times, gates and status on this page are simulated..."), for example with `provider.meta().disclaimer`. */
  children?: ReactNode;
  /** One line only: the title and "Do not use this data to plan travel." Use above inline results. */
  compact?: boolean;
  /** Hide the "About this prototype" link (when the banner is already on that page). */
  hideLink?: boolean;
  /** Square the bottom corners when the banner caps a board (or another midnight panel): it then takes the board's midnight surface. */
  attached?: boolean;
}

/**
 * The label for simulated data. Required above every surface that shows demo flights, wait times
 * or availability.
 *
 * Redesign round one (critique item 3): one quiet line built into the top of the surface it
 * labels, not a butter-yellow box. On a board or midnight panel (`attached`): the board's own
 * midnight with a gold hairline above and a gold flask, the words in the board's dim ink. On a
 * page: the same line on `page-subtle`. Every word of the meaning stays: the title "Demonstration
 * data" (also the note's accessible name), "Simulated, not live", "Do not use this data to plan
 * travel" and the link to "About this prototype". The longer body (or `children`) is shown in wide
 * containers when not `compact`, and is always in the note for assistive technology.
 *
 * @example <DemoDataBanner attached />
 */
export function DemoDataBanner({ children, compact = false, hideLink = false, attached = false, className, ...rest }: DemoDataBannerProps) {
  const t = useT();
  const body = children ?? t('demo.bannerBody');
  return (
    <div
      role="note"
      aria-label={t('demo.bannerTitle')}
      data-demo-banner=""
      data-demo-marker=""
      className={cn(
        '@container relative min-w-0 overflow-hidden forced-colors:border',
        attached
          ? // The board's midnight in every theme, a gold hairline on top, a board line under it.
            'surface-board rounded-t-2xl border border-b-0 border-line bg-board-raised text-ink-2 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-gold-bright)_70%,transparent)]'
          : 'rounded-xl bg-page-subtle text-ink-2 ring-1 ring-line ring-inset',
        className,
      )}
      {...rest}
    >
      <div className={cn('flex min-h-11 min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 px-3 @lg:min-h-9 @lg:px-4', compact ? '@lg:py-1' : '@lg:py-2')}>
        <Icon
          name="flask-conical"
          size="sm"
          strokeWidth={1.75}
          className={cn('shrink-0 forced-colors:text-[CanvasText]', attached ? 'text-gold-bright' : 'text-gold-ink')}
        />
        <p className="type-body-sm min-w-0 flex-1">
          <strong className="font-semibold text-ink">
            <span className="@max-lg:hidden">{t('demo.bannerTitle')}</span>
            {/* Narrow: "Demo" keeps the line to one row; the note's name stays "Demonstration data". */}
            <span className="@lg:hidden">{t('provenance.demo.short')}</span>
          </strong>
          <span aria-hidden="true" className="mx-1.5 text-ink-3">
            ·
          </span>
          {/* The full body: visible in wide containers (not compact), always read out. */}
          <span className={cn(compact ? 'sr-only' : '@max-5xl:sr-only')}>{body} </span>
          <span aria-hidden="true" className={cn(!compact && '@5xl:hidden')}>
            {t('shellExtras.demo.notLive')}{' '}
          </span>
          <span className="font-semibold text-ink @max-lg:sr-only">{t('demo.doNotPlan')}</span>
        </p>
        {hideLink ? null : (
          <LocaleLink
            href="/about-this-prototype"
            className="type-body-sm inline-flex min-h-8 shrink-0 items-center gap-1 font-semibold text-ink underline decoration-1 underline-offset-4 hover:decoration-2 touch:min-h-11 touch:min-w-11"
          >
            <span className="@max-lg:hidden">{t('demo.learnMore')}</span>
            <span className="@lg:hidden" aria-hidden="true">
              {t('shellExtras.demo.about')}
            </span>
            <span className="sr-only @lg:hidden">{t('demo.learnMore')}</span>
          </LocaleLink>
        )}
      </div>
    </div>
  );
}
