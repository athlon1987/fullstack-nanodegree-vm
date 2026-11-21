'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AIRPORTS, AIRPORT_CHOICES, CLASSIFICATION_LABELS } from '@/content/airports';
import { AIRPORT_CLASSIFICATIONS, pick } from '@/content/values';
import type { Airport, AirportClassification } from '@/content/types';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import type { TKey } from '@/lib/i18n/translate';
import { AirportCode } from '@/components/common/airport-code';
import { LocaleLink } from '@/components/common/locale-link';
import { getSection, hasSection, isAirportSection, sectionHref, type AirportSectionId } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardLink } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { NativeSelect } from '@/components/ui/native-select';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { MapMarker, NetworkMap } from './network-map';

type TypeFilter = 'all' | AirportClassification;

const GROUP_TITLES: Record<AirportClassification, TKey> = {
  international: 'airportSwitcher.international',
  domestic: 'airportSwitcher.domestic',
  stolport: 'airportSwitcher.stolports',
};

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const STATES = [...new Set(AIRPORTS.map((airport) => airport.state))].sort((a, b) => a.localeCompare(b));

export interface AirportDirectoryViewProps {
  /** The section to continue to after choosing (`?then=`), when there is one. */
  then?: AirportSectionId;
}

/**
 * The airport chooser and directory: all 39 airports grouped by Malaysia Airports' own
 * classification, with a search, a state filter and a type filter, beside a schematic map.
 * Choosing an airport remembers it and goes to its home, or straight to the `then` section.
 */
export function AirportDirectoryView({ then }: AirportDirectoryViewProps) {
  const t = useT();
  const lang = useLang();
  const availability = useSectionAvailability();
  const { selection, set } = useAirportContext();
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [type, setType] = useState<TypeFilter>('all');

  const terms = normalise(query).split(/\s+/).filter(Boolean);
  const shown = AIRPORTS.filter((airport) => {
    if (state && airport.state !== state) return false;
    if (type !== 'all' && airport.classification !== type) return false;
    const haystack = normalise([airport.name, airport.shortName, airport.city, airport.state, airport.code, airport.icao ?? ''].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
  const highlight = new Set(shown.map((airport) => airport.slug));
  const filtered = Boolean(query || state || type !== 'all');
  const target: AirportSectionId = then ?? 'overview';
  const targetLabel = then && then !== 'overview' ? t(getSection(then).labelKey) : null;

  const reset = () => {
    setQuery('');
    setState('');
    setType('all');
  };

  const card = (airport: Airport) => {
    const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
    const terminals = AIRPORT_CHOICES.filter((choice) => choice.airport === airport.slug && choice.terminal);
    const reachable = hasSection(availability, airport.slug, target);
    const current = selection?.airport === airport.slug;
    return (
      <Card as="li" key={airport.slug} interactive padding="sm" className="flex min-w-0 items-start gap-3.5" data-airport={airport.slug}>
        <AirportCode code={airport.code} variant="boxed" className="mt-0.5 w-13 shrink-0 justify-center text-center" />
        <div className="min-w-0 flex-1">
          <h3 className="type-title-sm text-ink">
            <CardLink
              href={sectionHref(target, airport.slug, availability)}
              onClick={() => set({ airport: airport.slug })}
              aria-label={targetLabel && reachable ? t('airportsPage.goToSection', { section: targetLabel, airport: airport.name }) : undefined}
            >
              {airport.name}
            </CardLink>
          </h3>
          <p className="type-body-sm mt-0.5 text-ink-2">{place}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 empty:hidden">
            {current ? (
              <Chip tone="primary" icon="check">
                {t('shell.switcher.selected')}
              </Chip>
            ) : null}
            {airport.depth === 'listing' ? <Chip>{t('airportsPage.listingOnly')}</Chip> : null}
            {terminals.map((choice) => (
              <LocaleLink
                key={choice.id}
                href={sectionHref(target, { airport: choice.airport, terminal: choice.terminal }, availability)}
                onClick={() => set({ airport: choice.airport, terminal: choice.terminal })}
                className="relative z-10 inline-flex h-7 items-center rounded-md border border-line-control bg-surface px-2.5 text-sm font-medium text-ink transition-colors duration-fast hover:border-ink touch:h-11"
              >
                {pick(choice.label, lang)}
              </LocaleLink>
            ))}
          </div>
        </div>
        <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="mt-1 shrink-0 text-ink-3" />
      </Card>
    );
  };

  // The choices most visitors want, as large buttons above the filters (A-26): KLIA Terminal 1,
  // KLIA Terminal 2 and the last airport used on this device.
  const pinned = AIRPORT_CHOICES.filter((choice) => choice.airport === 'kul' && choice.terminal);
  const last = selection ? AIRPORT_CHOICES.find((choice) => choice.airport === selection.airport && (choice.terminal ?? undefined) === selection.terminal) : undefined;
  const quick = last && !pinned.some((choice) => choice.id === last.id) ? [last, ...pinned] : pinned;

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      {targetLabel ? (
        <Callout tone="info" icon="arrow-right">
          {t('airportsPage.thenBanner', { section: targetLabel })}
        </Callout>
      ) : null}

      <section aria-labelledby="airports-quick-title" className="-mt-2 lg:-mt-4">
        <h2 id="airports-quick-title" className="type-eyebrow mb-2 text-ink-2">
          {t('shellExtras.directory.pinnedTitle')}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {quick.map((choice) => {
            const isLast = choice.id === last?.id;
            return (
              <li key={choice.id} className="flex min-w-0">
                <LocaleLink
                  href={sectionHref(target, { airport: choice.airport, terminal: choice.terminal }, availability)}
                  onClick={() => set(choice.terminal ? { airport: choice.airport, terminal: choice.terminal } : { airport: choice.airport })}
                  className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg border border-line-strong bg-surface px-3 py-2 text-ink transition-colors duration-fast hover:border-ink hover:bg-page-subtle"
                >
                  <AirportCode code={choice.code} variant="boxed" className="w-13 shrink-0 justify-center text-center" />
                  <span className="min-w-0 flex-1">
                    <span className="type-title-sm block">{pick(choice.label, lang)}</span>
                    {isLast ? <span className="type-caption block text-ink-2">{t('shellExtras.directory.lastUsed')}</span> : null}
                  </span>
                  <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="shrink-0 text-ink-3" />
                </LocaleLink>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <form role="search" aria-label={t('airportsPage.filtersLabel')} onSubmit={(event) => event.preventDefault()} className="flex min-w-0 flex-col gap-4">
          <SearchField label={t('shell.switcher.searchLabel')} hideLabel={false} placeholder={t('airportSwitcher.searchPlaceholder')} placeholderShort={t('shell.switcher.searchLabel')} value={query} onValueChange={setQuery} />
          <NativeSelect label={t('airportsPage.state')} value={state} onChange={(event) => setState(event.target.value)} iconStart="map-pin">
            <option value="">{t('airportsPage.allStates')}</option>
            {STATES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </NativeSelect>
          <SegmentedControl<TypeFilter>
            label={t('airportsPage.type')}
            showLabel
            block
            stackOnPhone
            value={type}
            onValueChange={setType}
            options={[
              { value: 'all', label: t('common.labels.all') },
              ...AIRPORT_CLASSIFICATIONS.map((classification) => ({ value: classification, label: pick(CLASSIFICATION_LABELS[classification], lang) })),
            ]}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="type-body-sm font-semibold text-ink">
              {t.count('airportsPage.shown', shown.length)}
            </p>
            {filtered ? (
              <Button variant="quiet" size="sm" iconStart="x" onClick={reset}>
                {t('flights.filters.clearFilters')}
              </Button>
            ) : null}
          </div>
        </form>

        <figure className="min-w-0 rounded-lg border border-line bg-surface p-4 sm:p-5">
          <NetworkMap
            titles={{ peninsular: t('airportsPage.map.peninsular'), borneo: t('airportsPage.map.borneo') }}
            alt={t('airportsPage.map.alt', { count: AIRPORTS.length })}
            highlight={filtered ? highlight : undefined}
          />
          <figcaption className="mt-4 border-t border-line pt-3">
            <ul className="type-caption flex flex-wrap gap-x-5 gap-y-1.5 text-ink">
              {AIRPORT_CLASSIFICATIONS.map((classification) => (
                <li key={classification} className="flex items-center gap-1.5">
                  <MapMarker kind={classification} />
                  {pick(CLASSIFICATION_LABELS[classification], lang)}
                </li>
              ))}
            </ul>
            <p className="type-caption mt-2 text-ink-2">{t('airportsPage.map.caption')}</p>
          </figcaption>
        </figure>
      </div>

      {AIRPORT_CLASSIFICATIONS.map((classification) => {
        const group = shown.filter((airport) => airport.classification === classification);
        if (group.length === 0) return null;
        return (
          <section key={classification} aria-labelledby={`airports-${classification}`}>
            <h2 id={`airports-${classification}`} className="type-display-sm mb-4 flex items-baseline gap-3 border-b border-line-strong pb-3 text-ink">
              {t(GROUP_TITLES[classification])}
              <span className="type-data-md text-ink-2">{group.length}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{group.map(card)}</ul>
          </section>
        );
      })}

      {shown.length === 0 ? (
        <div className="rounded-lg border border-line bg-page-subtle p-6">
          <p className="type-body font-semibold text-ink">{t('airportSwitcher.noMatch')}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={reset}>
            {t('flights.filters.clearFilters')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Reads `?then=` and renders the directory. Wrap it in `<Suspense>` (it uses `useSearchParams`). */
export function AirportDirectory() {
  const then = useSearchParams().get('then');
  return <AirportDirectoryView then={isAirportSection(then) ? then : undefined} />;
}
