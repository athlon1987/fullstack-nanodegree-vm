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
  /** Square the bottom corners when the banner caps a board. */
  attached?: boolean;
}

/**
 * The unmistakable label for simulated data: amber, hazard-striped, the same in every theme.
 * Required above every surface that shows demo flights, wait times or availability.
 *
 * @example <DemoDataBanner attached />
 */
export function DemoDataBanner({ children, compact = false, hideLink = false, attached = false, className, ...rest }: DemoDataBannerProps) {
  const t = useT();
  return (
    <div
      role="note"
      aria-label={t('demo.bannerTitle')}
      data-demo-banner=""
      data-demo-marker=""
      className={cn(
        // The focus colour is redefined inside the banner: orchid on amber is under 3:1 in the dark
        // themes, the banner's own ink is above 10:1 in every theme (WCAG 1.4.11).
        '@container relative flex min-w-0 overflow-hidden border border-demo-border bg-demo-bg text-demo-fg [--color-focus:var(--color-demo-fg)] forced-colors:border-2',
        attached ? 'rounded-t-lg' : 'rounded-lg',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="hazard-stripes w-6 shrink-0 sm:w-9" />
      {/* Narrow containers (phones, side columns): one line of at most 44 px, so the banner never
          pushes the answer off the first screen. The full sentence stays for assistive technology. */}
      <div className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-3 @lg:gap-x-4 @lg:px-4', compact ? 'py-0 @lg:py-2' : 'py-0 @lg:py-3')}>
        <p className="type-data-sm flex min-h-11 items-center gap-2 font-bold tracking-data uppercase @lg:min-h-0">
          <Icon name="flask-conical" size="sm" strokeWidth={2} />
          <span className="@max-lg:hidden">{t('demo.bannerTitle')}</span>
          {/* Narrow: "Demo" keeps the line to one row; the note's name stays "Demonstration data". */}
          <span className="@lg:hidden">{t('provenance.demo.short')}</span>
        </p>
        <p className="type-body-sm min-w-0 @max-lg:sr-only @lg:flex-1 @lg:basis-64">
          {compact ? null : <>{children ?? t('demo.bannerBody')} </>}
          <strong className="font-bold">{t('demo.doNotPlan')}</strong>
        </p>
        <p aria-hidden="true" className="type-body-sm font-semibold @lg:hidden">
          {t('shellExtras.demo.notLive')}
        </p>
        {hideLink ? null : (
          <LocaleLink
            href="/about-this-prototype"
            className="type-body-sm inline-flex min-h-8 items-center font-semibold underline decoration-1 underline-offset-4 hover:decoration-2 touch:min-h-11 touch:min-w-11 @max-lg:ml-auto"
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
