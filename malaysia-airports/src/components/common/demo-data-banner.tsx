'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { Icon } from '@/components/ui/icon';
import { LocaleLink } from './locale-link';

export interface DemoDataBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Replace the default body ("Flight times, gates and status on this page are simulated..."), for example with `provider.meta().disclaimer`. */
  children?: ReactNode;
  /** One line only: the title and "Do not use it to plan travel." Use above inline results. */
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
      className={cn(
        'relative flex min-w-0 overflow-hidden border border-demo-border bg-demo-bg text-demo-fg forced-colors:border-2',
        attached ? 'rounded-t-lg' : 'rounded-lg',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="hazard-stripes w-6 shrink-0 sm:w-9" />
      <div className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-3 sm:px-4', compact ? 'py-2' : 'py-3')}>
        <p className="type-data-sm flex items-center gap-2 font-bold tracking-data uppercase">
          <Icon name="flask-conical" size="sm" strokeWidth={2} />
          {t('demo.bannerTitle')}
        </p>
        <p className="type-body-sm min-w-0 flex-1 basis-64">
          {compact ? null : <>{children ?? t('demo.bannerBody')} </>}
          <strong className="font-bold">{t('demo.doNotPlan')}</strong>
        </p>
        {hideLink ? null : (
          <LocaleLink
            href="/about-this-prototype"
            className="type-body-sm inline-flex min-h-8 items-center font-semibold underline decoration-1 underline-offset-4 hover:decoration-2 touch:min-h-11 touch:min-w-11"
          >
            {t('demo.learnMore')}
          </LocaleLink>
        )}
      </div>
    </div>
  );
}
