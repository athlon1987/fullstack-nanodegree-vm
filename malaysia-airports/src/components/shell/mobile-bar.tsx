'use client';

import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { getAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { useAirportContext } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { stripLocale } from '@/lib/locale';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon, type IconName } from '@/components/ui/icon';
import { useSavedCount } from './header-tools';
import { ScrollChrome } from './scroll-chrome';
import { overlays, useOverlayOpen } from './overlay-store';
import { sectionHref } from './sections';
import { useSectionAvailability } from './shell-context';

const ITEM =
  'relative flex min-h-14 w-full min-w-11 flex-col items-center justify-center gap-0.5 rounded-md text-xs leading-tight font-semibold text-ink-2 transition-colors duration-fast aria-[current]:text-ink';

function Label({ icon, children, badge }: { icon: IconName; children: ReactNode; badge?: number }) {
  // The label comes first in the DOM and the icon is moved above it with `order-first`, so the
  // visible text reads "Journey 1" (the space keeps them two words) and the accessible name can
  // start with it (WCAG 2.5.3; verification round).
  return (
    <>
      <span data-bar-label="" className="whitespace-nowrap">
        {children}
      </span>{' '}
      <span className="relative order-first">
        <Icon name={icon} size="lg" />
        {badge ? (
          <span aria-hidden="true" className="type-data-xs absolute -top-1 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-pill bg-primary px-1 font-bold text-on-primary">
            {badge}
          </span>
        ) : null}
      </span>
    </>
  );
}

function Bar({ pathname }: { pathname: string | null }) {
  const t = useT();
  const { selection } = useAirportContext();
  const availability = useSectionAvailability();
  const searchOpen = useOverlayOpen('search');
  const menuOpen = useOverlayOpen('menu');
  const saved = useSavedCount();
  const [first, second] = pathname ? stripLocale(pathname).split('/').filter(Boolean) : [];
  const onHome = pathname !== null && !first;
  const onFlights = Boolean(first && getAirport(first) && second === 'flights');
  const onJourney = first === 'journey';

  return (
    <nav
      aria-label={t('shell.bottomBar.label')}
      data-print="hidden"
      data-mobile-bar=""
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {/* Flights and Journey get the widest columns: their Malay labels are the longest. */}
      <ul className="mx-auto grid max-w-lg grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,1.3fr)_minmax(0,0.85fr)] items-end px-1">
        <li>
          <LocaleLink href="/" aria-current={onHome ? 'page' : undefined} className={ITEM}>
            <Label icon="home">{t('shellExtras.bottomBar.home')}</Label>
          </LocaleLink>
        </li>
        <li>
          {/* One of the few likely next steps that is prefetched before the click (A-19). */}
          <LocaleLink prefetch="auto" href={sectionHref('flights', selection, availability)} aria-current={onFlights ? 'true' : undefined} className={ITEM}>
            <Label icon="plane-takeoff">{t('nav.flights')}</Label>
          </LocaleLink>
        </li>
        <li>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            data-early-overlay="search"
            onClick={() => overlays.openSearch()}
            className={cn(ITEM, 'text-ink')}
          >
            {/* Inside the bar, not raised above it: an overhang covered tile labels on the home
                first screen (A-11). */}
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="search" size="md" strokeWidth={2} />
            </span>
            <span data-bar-label="" className="whitespace-nowrap">
              {t('nav.search')}
            </span>
          </button>
        </li>
        <li>
          <LocaleLink
            prefetch="auto"
            href="/journey"
            aria-current={onJourney ? 'page' : undefined}
            aria-label={saved > 0 ? t.count('shell.bottomBar.journeyCount', saved) : undefined}
            className={ITEM}
          >
            <Label icon="bookmark" badge={saved}>
              {t('shell.bottomBar.journey')}
            </Label>
          </LocaleLink>
        </li>
        <li>
          <button type="button" aria-haspopup="dialog" aria-expanded={menuOpen} data-early-overlay="menu" onClick={() => overlays.openMenu()} className={ITEM}>
            <Label icon="menu">{t('shell.bottomBar.menu')}</Label>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function BarForPath() {
  return <Bar pathname={usePathname()} />;
}

/**
 * The phone bottom bar: Home, Flights, Search, Journey and Menu. Targets are at least 44px and
 * the bar pads itself for the home indicator. Hidden from `md` up. On short windows and at large
 * text it collapses to icons and gives way while scrolling (`ScrollChrome`).
 */
export function MobileBar() {
  return (
    <>
      <ScrollChrome />
      <Suspense fallback={<Bar pathname={null} />}>
        <BarForPath />
      </Suspense>
    </>
  );
}
