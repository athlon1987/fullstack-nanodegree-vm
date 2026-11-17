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
import { overlays, useOverlayState } from './overlay-store';
import { sectionHref } from './sections';
import { useSectionAvailability } from './shell-context';

const ITEM =
  'relative flex min-h-14 w-full min-w-11 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-semibold text-ink-2 transition-colors duration-fast aria-[current]:text-ink';

function Label({ icon, children, badge }: { icon: IconName; children: ReactNode; badge?: number }) {
  return (
    <>
      <span className="relative">
        <Icon name={icon} size="lg" />
        {badge ? (
          <span aria-hidden="true" className="type-data-xs absolute -top-1 -right-2.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-pill bg-primary px-1 font-bold text-on-primary">
            {badge}
          </span>
        ) : null}
      </span>
      <span>{children}</span>
    </>
  );
}

function Bar({ pathname }: { pathname: string | null }) {
  const t = useT();
  const { selection } = useAirportContext();
  const availability = useSectionAvailability();
  const { open } = useOverlayState();
  const saved = useSavedCount();
  const [first, second] = pathname ? stripLocale(pathname).split('/').filter(Boolean) : [];
  const onHome = pathname !== null && !first;
  const onFlights = Boolean(first && getAirport(first) && second === 'flights');
  const onJourney = first === 'journey';

  return (
    <nav
      aria-label={t('shell.bottomBar.label')}
      data-print="hidden"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-end px-1.5">
        <li>
          <LocaleLink href="/" aria-current={onHome ? 'page' : undefined} className={ITEM}>
            <Label icon="home">{t('nav.home')}</Label>
          </LocaleLink>
        </li>
        <li>
          <LocaleLink href={sectionHref('flights', selection, availability)} aria-current={onFlights ? 'true' : undefined} className={ITEM}>
            <Label icon="plane-takeoff">{t('nav.flights')}</Label>
          </LocaleLink>
        </li>
        <li>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open === 'search'}
            onClick={() => overlays.openSearch()}
            className={cn(ITEM, 'text-ink')}
          >
            <span className="-mt-6 flex size-13 items-center justify-center rounded-full bg-primary text-on-primary shadow-md ring-4 ring-surface">
              <Icon name="search" size="lg" strokeWidth={1.75} />
            </span>
            <span>{t('nav.search')}</span>
          </button>
        </li>
        <li>
          <LocaleLink
            href="/journey"
            aria-current={onJourney ? 'page' : undefined}
            aria-label={saved > 0 ? t.count('shell.journey.count', saved) : undefined}
            className={ITEM}
          >
            <Label icon="bookmark" badge={saved}>
              {t('shell.bottomBar.journey')}
            </Label>
          </LocaleLink>
        </li>
        <li>
          <button type="button" aria-haspopup="dialog" aria-expanded={open === 'menu'} onClick={() => overlays.openMenu()} className={ITEM}>
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
 * The phone bottom bar: Home, Flights, a raised Search, Journey and Menu. Targets are at least
 * 44px and the bar pads itself for the home indicator. Hidden from `md` up.
 */
export function MobileBar() {
  return (
    <Suspense fallback={<Bar pathname={null} />}>
      <BarForPath />
    </Suspense>
  );
}
