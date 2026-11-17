'use client';

import { useRouter } from 'next/navigation';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { getAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { formatFlightNumber, type Flight } from '@/lib/flights';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { localeHref } from '@/lib/locale';
import type { SearchDocType } from '@/lib/search/engine';
import { formatTime } from '@/lib/time';
import { AirportCode } from '@/components/common/airport-code';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { flightHref } from '@/components/flights/flight-row';
import { closeOverlay, overlays, useOverlayDialog } from '@/components/shell/overlay-store';
import { sectionHref } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { Button } from '@/components/ui/button';
import { Icon, type IconKey } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Kbd } from '@/components/ui/kbd';
import { clearRecentSearches, loadSearchIndex, rememberSearch, useRecentSearches, useSiteSearch } from './site-search';

type Item =
  | { kind: 'recent'; id: string; query: string }
  | { kind: 'link'; id: string; href: string; label: string; meta?: string; icon: IconKey }
  | { kind: 'flight'; id: string; href: string; flight: Flight }
  | { kind: 'all'; id: string; href: string; label: string };

interface Group {
  id: string;
  title: string;
  /** Shown beside the title: the demonstration tag. Never interactive (it sits inside the listbox). */
  aside?: ReactNode;
  items: Item[];
}

const OPTION =
  'flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-ink outline-none aria-selected:bg-primary-soft aria-selected:text-primary-ink forced-colors:aria-selected:outline-2 forced-colors:aria-selected:outline-[Highlight]';

/**
 * The command palette: one search over the whole site. Opens from the header, the phone bottom
 * bar, the `/` key and Ctrl or Cmd + K. A combobox with a grouped listbox: arrow keys move, Enter
 * opens, Escape closes. Flight matches come from the demo provider and carry the demonstration tag.
 */
export function CommandPalette() {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const dialog = useOverlayDialog('search');
  const availability = useSectionAvailability();
  const { airport, selection } = useAirportContext();
  const recent = useRecentSearches();
  const baseId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [everywhere, setEverywhere] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);

  // Start fresh each time the palette opens (it stays mounted so focus can return on close).
  if (dialog.open !== wasOpen) {
    setWasOpen(dialog.open);
    if (dialog.open) {
      setQuery(dialog.payload.query ?? '');
      setActive(0);
    }
  }

  const scoped = airport && !everywhere ? airport.slug : undefined;
  const results = useSiteSearch(lang, query, { airport: scoped, limit: 4, flightLimit: 4, enabled: dialog.open });
  const text = results.query;
  const searching = text.length >= 2;

  const groups: Group[] = [];
  if (!searching) {
    if (recent.length > 0) {
      groups.push({
        id: 'recent',
        title: t('search.recent'),
        items: recent.map((item, index) => ({ kind: 'recent', id: `recent-${index}`, query: item })),
      });
    }
    groups.push({
      id: 'quick',
      title: t('search.quickLinks'),
      items: [
        { kind: 'link', id: 'quick-flights', href: sectionHref('flights', selection, availability), label: t('nav.flights'), icon: 'plane-takeoff' },
        { kind: 'link', id: 'quick-map', href: sectionHref('map', selection, availability), label: t('nav.map'), icon: 'map' },
        { kind: 'link', id: 'quick-transport', href: sectionHref('transport', selection, availability), label: t('nav.groundTransport'), icon: 'train-front' },
        { kind: 'link', id: 'quick-parking', href: sectionHref('parking', selection, availability), label: t('nav.parking'), icon: 'square-parking' },
        { kind: 'link', id: 'quick-notices', href: '/notices', label: t('nav.notices'), icon: 'megaphone' },
        { kind: 'link', id: 'quick-airports', href: '/airports', label: t('nav.airports'), icon: 'tower-control' },
      ],
    });
  } else {
    const flights: Group | null =
      results.flights.length > 0
        ? {
            id: 'flights',
            title: t('search.types.flight'),
            aside: <ProvenanceTag provenance="demo" length="short" />,
            items: results.flights.map((flight) => ({ kind: 'flight', id: `flight-${flight.airport}-${flight.id}`, href: flightHref(flight), flight })),
          }
        : null;
    const content: Group[] = results.groups.map((group) => ({
      id: group.type,
      title: t(`search.types.${group.type}` as `search.types.${SearchDocType}`),
      items: group.hits.map((hit) => ({
        kind: 'link',
        id: `hit-${hit.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
        href: hit.href,
        label: hit.title,
        meta: hit.airport ? getAirport(hit.airport)?.shortName : undefined,
        icon: hit.type,
      })),
    }));
    if (flights && results.flightShaped) groups.push(flights);
    groups.push(...content);
    if (flights && !results.flightShaped) groups.push(flights);
    groups.push({
      id: 'all',
      title: t('search.seeAllResults'),
      items: [{ kind: 'all', id: 'all-results', href: `/search?q=${encodeURIComponent(text)}`, label: t('search.openFullResults', { query: text }) }],
    });
  }

  const items = groups.flatMap((group) => group.items);
  const current = items[Math.min(active, items.length - 1)];
  const optionId = (item: Item): string => `${baseId}-${item.id}`;
  const found = searching ? results.total : 0;

  useEffect(() => {
    if (!current) return;
    document.getElementById(`${baseId}-${current.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [baseId, current]);

  const leave = () => {
    if (searching) rememberSearch(text);
    closeOverlay('search');
  };

  const activate = (item: Item) => {
    if (item.kind === 'recent') {
      setQuery(item.query);
      setActive(0);
      return;
    }
    leave();
    router.push(localeHref(lang, item.href));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => (Math.min(index, items.length - 1) + step + items.length) % items.length);
    } else if (event.key === 'Home' && items.length > 0 && event.ctrlKey) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End' && items.length > 0 && event.ctrlKey) {
      event.preventDefault();
      setActive(items.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (current) activate(current);
    }
  };

  const status =
    results.status === 'error'
      ? t('search.failed')
      : searching
        ? results.status !== 'ready' && found === 0
          ? t('search.loading')
          : found === 0
            ? t('search.noResults', { query: text })
            : t.count('search.resultsCount', found)
        : '';

  const renderOption = (item: Item) => {
    const selected = current?.id === item.id;
    const index = items.indexOf(item);
    const common = {
      id: optionId(item),
      role: 'option' as const,
      'aria-selected': selected,
      tabIndex: -1,
      onMouseMove: () => setActive(index),
      className: OPTION,
    };
    if (item.kind === 'recent') {
      return (
        <div key={item.id} {...common} onClick={() => activate(item)}>
          <Icon name="history" size="sm" className="text-ink-3" />
          <span className="min-w-0 flex-1">{item.query}</span>
        </div>
      );
    }
    if (item.kind === 'flight') {
      const { flight } = item;
      const boardAirport = getAirport(flight.airport);
      return (
        <LocaleLink key={item.id} {...common} href={item.href} onClick={leave}>
          <span className="type-data-md w-12 shrink-0">{formatTime(flight.estimated)}</span>
          <span className="min-w-0 flex-1">
            <span className="type-title-sm block">
              <span className="type-data-md mr-2">{formatFlightNumber(flight)}</span>
              {t('flights.detail.route', { origin: flight.origin.city, destination: flight.destination.city })}
            </span>
            <span className="type-caption block text-ink-2">{flight.airline.name}</span>
          </span>
          {boardAirport ? <AirportCode code={boardAirport.code} name={boardAirport.name} size="sm" className="text-ink-2 max-sm:hidden" /> : null}
          <FlightStatusChip status={flight.status} size="sm" />
        </LocaleLink>
      );
    }
    return (
      <LocaleLink key={item.id} {...common} href={item.href} onClick={leave}>
        <Icon name={item.kind === 'all' ? 'search' : item.icon} size="sm" className="text-ink-3" />
        <span className="min-w-0 flex-1">
          <span className={item.kind === 'all' ? 'font-semibold' : 'font-medium'}>{item.label}</span>
        </span>
        {item.kind === 'link' && item.meta ? <span className="type-caption shrink-0 text-ink-2">{item.meta}</span> : null}
        <Icon name="arrow-right" size="sm" strokeWidth={1.75} className={cn('shrink-0 text-ink-3', !selected && 'opacity-0')} />
      </LocaleLink>
    );
  };

  return (
    <DialogPrimitive.Root open={dialog.open} onOpenChange={dialog.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-board/60 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={dialog.onCloseAutoFocus}
          className={cn(
            'fixed inset-0 z-50 flex flex-col bg-surface-raised text-ink shadow-lg outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in',
            'sm:inset-x-auto sm:top-[9vh] sm:bottom-auto sm:left-1/2 sm:max-h-[min(42rem,82vh)] sm:w-[min(44rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:rounded-xl sm:border sm:border-line-strong',
          )}
        >
          <DialogPrimitive.Title className="sr-only">{t('search.title')}</DialogPrimitive.Title>

          <div className="flex items-center gap-1 border-b border-line py-1.5 pr-1.5 pl-4">
            <Icon name="search" className="shrink-0 text-ink-3" />
            <input
              role="combobox"
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              aria-label={t('search.label')}
              aria-expanded="true"
              aria-controls={`${baseId}-listbox`}
              aria-autocomplete="list"
              aria-activedescendant={current ? optionId(current) : undefined}
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-13 min-w-0 flex-1 bg-transparent px-2 text-base text-ink outline-none placeholder:text-ink-3 sm:text-lg"
            />
            <Kbd className="max-sm:hidden">Esc</Kbd>
            <DialogPrimitive.Close asChild>
              <IconButton icon="x" label={t('common.actions.close')} />
            </DialogPrimitive.Close>
          </div>

          {airport ? (
            <div role="group" aria-label={t('search.scopeLabel')} className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
              <span className="type-caption text-ink-2">{t('search.scopeLabel')}</span>
              {[
                { everywhere: false, label: airport.shortName },
                { everywhere: true, label: t('search.everywhere') },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={everywhere === option.everywhere}
                  onClick={() => {
                    setEverywhere(option.everywhere);
                    setActive(0);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-control px-2.5 text-sm font-medium text-ink transition-colors duration-fast hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-page touch:h-11"
                >
                  {everywhere === option.everywhere ? <Icon name="check" size="sm" strokeWidth={2.25} /> : null}
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          <p role="status" className="sr-only">
            {status}
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            <div id={`${baseId}-listbox`} role="listbox" aria-label={t('search.title')}>
              {groups.map((group) =>
              group.items.length > 0 ? (
                <div key={group.id} role="group" aria-labelledby={`${baseId}-group-${group.id}`} className="pb-2">
                  <div className="flex min-h-9 items-center justify-between gap-3 px-3">
                    <p id={`${baseId}-group-${group.id}`} role="presentation" className="type-eyebrow text-ink-2">
                      {group.title}
                    </p>
                    {group.aside}
                  </div>
                  {group.items.map(renderOption)}
                </div>
              ) : null,
              )}
            </div>

            {searching && results.status === 'error' ? (
              <div className="m-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-page-subtle p-4">
                <p className="type-body-sm text-ink">{t('search.failed')}</p>
                <Button variant="secondary" size="sm" iconStart="refresh-cw" onClick={() => loadSearchIndex(lang)}>
                  {t('common.actions.retry')}
                </Button>
              </div>
            ) : null}
            {searching && results.status === 'ready' && found === 0 ? (
              <div className="m-2 rounded-md border border-line bg-page-subtle p-4">
                <p className="type-body font-semibold text-ink">{t('search.noResults', { query: text })}</p>
                <p className="type-body-sm mt-1 text-ink-2">{t('search.noResultsHint')}</p>
                <Button variant="secondary" size="sm" iconStart="sparkles" className="mt-3" onClick={() => overlays.openConcierge(text)}>
                  {t('concierge.open')}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 max-sm:pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            <p className="type-caption text-ink-2 max-sm:hidden">{t('search.keyboardHint')}</p>
            {!searching && recent.length > 0 ? (
              <Button variant="quiet" size="sm" onClick={() => clearRecentSearches()}>
                {t('search.clearRecent')}
              </Button>
            ) : (
              <p className="type-caption text-ink-2">{t('search.flightsDemo')}</p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
