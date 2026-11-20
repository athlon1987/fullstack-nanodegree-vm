'use client';

import { useState } from 'react';
import { useAirportContext } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import type { TKey } from '@/lib/i18n/translate';
import { LocaleLink } from '@/components/common/locale-link';
import { overlays } from '@/components/shell/overlay-store';
import { hasSection, sectionPath } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import type { IconKey } from '@/components/ui/icon';

/**
 * Filter ids as they travel in the `filters` query parameter of the shop and dine page
 * (`/kul/shop-dine?filters=open-now,halal`).
 */

/** Lets a control's label wrap (min height kept) so nothing pushes the page wider than the screen. */
const WRAP = 'h-auto min-h-9 max-w-full shrink py-1.5 text-left whitespace-normal touch:h-auto touch:min-h-11';
const WRAP_BUTTON = 'h-auto min-h-11 max-w-full shrink py-2 text-left whitespace-normal';
export const SHOP_DINE_FILTERS = ['open-now', 'halal', 'landside', 'airside'] as const;
export type ShopDineFilter = (typeof SHOP_DINE_FILTERS)[number];

const FILTER_META: Record<ShopDineFilter, { label: TKey; icon: IconKey }> = {
  'open-now': { label: 'common.labels.openNow', icon: 'clock' },
  halal: { label: 'home.shop.halal', icon: 'badge-check' },
  landside: { label: 'common.labels.landside', icon: 'door-open' },
  airside: { label: 'common.labels.airside', icon: 'scan-line' },
};

export interface ShopDineStripProps {
  /** Number of published outlets per airport slug (airports with none are left out). */
  outletCounts: Readonly<Record<string, number>>;
  /**
   * Filters that can return at least one outlet, per airport slug, from the published data. A
   * filter that cannot return anything is not offered (C-05 hand-off): no "0 of 8".
   */
  usableFilters: Readonly<Record<string, readonly ShopDineFilter[]>>;
}

/**
 * Shop and dine discovery: choose what matters (open now, halal, before or after security) and
 * continue to the chosen airport's listing with those filters applied. With no airport chosen
 * the button opens the airport switcher first.
 */
export function ShopDineStrip({ outletCounts, usableFilters }: ShopDineStripProps) {
  const t = useT();
  const { airport, selection } = useAirportContext();
  const availability = useSectionAvailability();
  const [active, setActive] = useState<readonly ShopDineFilter[]>([]);

  const toggle = (filter: ShopDineFilter, pressed: boolean) => {
    setActive((current) => {
      // Before and after security exclude each other.
      const opposite: ShopDineFilter | null = filter === 'landside' ? 'airside' : filter === 'airside' ? 'landside' : null;
      const rest = current.filter((item) => item !== filter && item !== opposite);
      return pressed ? [...rest, filter] : rest;
    });
  };

  const count = airport ? (outletCounts[airport.slug] ?? 0) : 0;
  // With an airport: its usable filters. Without one: those usable somewhere in the network.
  const usable = airport ? (usableFilters[airport.slug] ?? []) : [...new Set(Object.values(usableFilters).flat())];
  const offered = SHOP_DINE_FILTERS.filter((filter) => usable.includes(filter));
  const chosen = active.filter((filter) => offered.includes(filter));
  const hasListing = airport ? hasSection(availability, airport.slug, 'shop-dine') : false;
  const query = chosen.length > 0 ? `filters=${SHOP_DINE_FILTERS.filter((filter) => chosen.includes(filter)).join(',')}` : '';
  const base = airport ? sectionPath(airport.slug, 'shop-dine', selection?.terminal) : '';
  const href = airport ? `${base}${query ? `${base.includes('?') ? '&' : '?'}${query}` : ''}` : '';

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label={t('home.shop.filtersLabel')} className="flex flex-wrap gap-2 empty:hidden">
        {offered.map((filter) => (
          <FilterChip
            key={filter}
            pressed={chosen.includes(filter)}
            onPressedChange={(pressed) => toggle(filter, pressed)}
            icon={FILTER_META[filter].icon}
            // Long Malay labels at a large text size wrap inside the chip instead of widening the page.
            className={WRAP}
          >
            {t(FILTER_META[filter].label)}
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {airport && hasListing ? (
          <Button asChild iconEnd="arrow-right" className={WRAP_BUTTON}>
            <LocaleLink href={href}>{t('home.shop.browseAt', { airport: airport.shortName })}</LocaleLink>
          </Button>
        ) : airport ? (
          <Button variant="secondary" iconEnd="chevrons-up-down" className={WRAP_BUTTON} onClick={() => overlays.openAirportSwitcher('shop-dine', query)}>
            {t('common.actions.change')}: {airport.shortName}
          </Button>
        ) : (
          <Button iconStart="map-pin" className={WRAP_BUTTON} onClick={() => overlays.openAirportSwitcher('shop-dine', query)}>
            {t('home.shop.chooseAirport')}
          </Button>
        )}
        {airport ? (
          <p role="status" className="type-body-sm text-ink-2">
            {count > 0 ? t.count('home.shop.published', count, { airport: airport.shortName }) : t('home.shop.nonePublished', { airport: airport.shortName })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
