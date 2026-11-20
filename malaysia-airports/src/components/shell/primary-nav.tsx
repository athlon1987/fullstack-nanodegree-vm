'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { cn } from '@/lib/cn';
import { useAirportContext } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { stripLocale } from '@/lib/locale';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { closeOverlay } from './overlay-store';
import { PRIMARY_NAV, isPrimaryNavActive, primaryNavHref, primaryNavSection } from './sections';
import { useSectionAvailability } from './shell-context';

export interface PrimaryNavProps {
  /** `bar`: the row in the header. `list`: large rows with icons for the menu. */
  variant?: 'bar' | 'list';
  className?: string;
}

function NavLinks({ variant = 'bar', className, pathname }: PrimaryNavProps & { pathname: string | null }) {
  const t = useT();
  const { selection, airport } = useAirportContext();
  const availability = useSectionAvailability();
  const path = pathname ? stripLocale(pathname) : null;

  return (
    <ul className={cn(variant === 'bar' ? 'flex items-center' : 'flex flex-col', className)}>
      {/* Assistance sits in the utility bar on desktop (always visible there, in both languages)
          and in this list in the phone menu (A-15). */}
      {PRIMARY_NAV.filter((item) => variant === 'list' || item.id !== 'assistance').map((item) => {
        const active = path !== null && isPrimaryNavActive(item, path);
        // None of the item's sections exists at the chosen airport: the link leads to the "not
        // published" state, and says so (A-07).
        const missing = Boolean(item.section && selection && airport && primaryNavSection(item, selection, availability) === null);
        return (
          <li key={item.id}>
            <LocaleLink
              href={primaryNavHref(item, selection, availability)}
              aria-current={active ? 'true' : undefined}
              onClick={() => closeOverlay()}
              className={
                variant === 'bar'
                  ? cn(
                      'relative inline-flex h-11 items-center rounded-md px-2 text-[0.9375rem] font-medium whitespace-nowrap text-ink-2 transition-colors duration-fast hover:bg-page-subtle hover:text-ink',
                      'aria-[current]:text-ink aria-[current]:after:absolute aria-[current]:after:inset-x-2 aria-[current]:after:bottom-1 aria-[current]:after:h-0.5 aria-[current]:after:rounded-pill aria-[current]:after:bg-primary',
                    )
                  : cn(
                      'flex min-h-13 items-center gap-3.5 rounded-md px-2 text-lg font-semibold text-ink transition-colors duration-fast hover:bg-page-subtle',
                      'aria-[current]:bg-primary-soft aria-[current]:text-primary-ink',
                    )
              }
            >
              {variant === 'list' ? <Icon name={item.icon} className="text-primary-ink" /> : null}
              <span className={variant === 'list' ? 'min-w-0 flex-1' : undefined}>
                {t(item.labelKey)}
                {missing && airport ? (
                  variant === 'list' ? (
                    <span className="type-caption block font-medium text-ink-2">{t('shellExtras.notPublished.tileHint', { airport: airport.shortName })}</span>
                  ) : (
                    <span className="sr-only">, {t('shellExtras.notPublished.tileHint', { airport: airport.shortName })}</span>
                  )
                ) : null}
              </span>
              {variant === 'list' ? <Icon name="chevron-right" size="sm" className="text-ink-3" /> : null}
            </LocaleLink>
          </li>
        );
      })}
    </ul>
  );
}

function NavLinksForPath(props: PrimaryNavProps) {
  return <NavLinks {...props} pathname={usePathname()} />;
}

/**
 * Primary navigation: Flights, Plan your journey, At the airport, Shops and food, Transport and
 * parking, Help, Assistance. Airport-scoped items follow the remembered airport (`sectionHref`);
 * with none they lead to the airport chooser first.
 */
export function PrimaryNav({ variant = 'bar', className }: PrimaryNavProps) {
  const t = useT();
  return (
    <nav aria-label={t('nav.mainLabel')} className={variant === 'bar' ? className : undefined}>
      {/* The current-page marker needs the pathname, which suspends on routes with unknown params:
          the fallback renders the same links without the marker. */}
      <Suspense fallback={<NavLinks variant={variant} className={variant === 'bar' ? undefined : className} pathname={null} />}>
        <NavLinksForPath variant={variant} className={variant === 'bar' ? undefined : className} />
      </Suspense>
    </nav>
  );
}
