'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AIRPORTS, AIRPORT_CHOICES, CLASSIFICATION_LABELS, localizeAirport } from '@/content/airports';
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
import { objectPosition, placeholderProps, type MediaImage } from '@/components/ui/media';
import { AirportVignette } from '@/components/art/airport-vignette';
import { MapMarker, NetworkMap } from './network-map';
import { DEPTH_COPY, DEPTH_ORDER, airportDepthLabel } from './airport-depth';

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


export interface AirportDirectoryViewProps {
  /** The section to continue to after choosing (`?then=`), when there is one. */
  then?: AirportSectionId;
  /**
   * Photographs of airports that have their own in the photo library, by slug (redesign round
   * one), resolved on the server (`src/content/images.ts` stays out of the browser bundle).
   */
  photos?: Readonly<Record<string, MediaImage>>;
}

/** The type filter's short labels (the legend and the group headings keep the full names). */
const SHORT_TYPE_LABELS = {
  international: { en: 'International', ms: 'Antarabangsa' },
  domestic: { en: 'Domestic', ms: 'Domestik' },
  stolport: { en: 'STOLport', ms: 'STOLport' },
} as const;

/**
 * The airport chooser and directory: all 39 airports grouped by Malaysia Airports' own
 * classification, with a search, a state filter and a type filter, beside a schematic map.
 * Choosing an airport remembers it and goes to its home, or straight to the `then` section.
 */
export function AirportDirectoryView({ then, photos = {} }: AirportDirectoryViewProps) {
  const t = useT();
  const lang = useLang();
  const availability = useSectionAvailability();
  const { selection, set } = useAirportContext();
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [type, setType] = useState<TypeFilter>('all');

  // Names, cities and states in the page language (D-09 hand-off, round 2); the search also
  // matches the English forms.
  const { airports, states, english } = useMemo(() => {
    const local = AIRPORTS.map((airport) => localizeAirport(airport, lang));
    return {
      airports: local,
      states: [...new Set(local.map((airport) => airport.state))].sort((a, b) => a.localeCompare(b, lang)),
      english: new Map(AIRPORTS.map((airport) => [airport.slug, [airport.name, airport.shortName, airport.city, airport.state].join(' ')])),
    };
  }, [lang]);
  const terms = normalise(query).split(/\s+/).filter(Boolean);
  const shown = airports.filter((airport) => {
    if (state && airport.state !== state) return false;
    if (type !== 'all' && airport.classification !== type) return false;
    const haystack = normalise([airport.name, airport.shortName, airport.city, airport.state, english.get(airport.slug) ?? '', airport.code, airport.icao ?? ''].join(' '));
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

  /** What both card shapes share: the link (named by the airport), the chips and terminal links. */
  const parts = (airport: Airport) => {
    const terminals = AIRPORT_CHOICES.filter((choice) => choice.airport === airport.slug && choice.terminal);
    const reachable = hasSection(availability, airport.slug, target);
    const depth = airportDepthLabel(availability, airport.slug);
    const current = selection?.airport === airport.slug;
    const link = (
      <CardLink
        href={sectionHref(target, airport.slug, availability)}
        onClick={() => set({ airport: airport.slug })}
        aria-label={targetLabel && reachable ? t('airportsPage.goToSection', { section: targetLabel, airport: airport.name }) : undefined}
      >
        {airport.name}
      </CardLink>
    );
    const chips = (
      <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
        {current ? (
          <Chip tone="primary" icon="check">
            {t('shell.switcher.selected')}
          </Chip>
        ) : null}
        {/* What this site has for the airport, from its real sections (round 4, 6.1.8). */}
        <Chip icon={DEPTH_COPY[depth].icon} data-depth={depth}>
          {t(DEPTH_COPY[depth].label)}
        </Chip>
        {terminals.map((choice) => (
          <LocaleLink
            key={choice.id}
            href={sectionHref(target, { airport: choice.airport, terminal: choice.terminal }, availability)}
            onClick={() => set({ airport: choice.airport, terminal: choice.terminal })}
            className="relative z-10 inline-flex h-7 items-center rounded-pill border border-line-control bg-surface px-3 text-sm font-medium text-ink transition-colors duration-fast hover:border-ink touch:h-11"
          >
            {pick(choice.label, lang)}
          </LocaleLink>
        ))}
      </div>
    );
    return { depth, link, chips };
  };

  /**
   * Redesign round one: airports with their own photograph, or a full guide here, get a photo-led
   * card: the photograph (or the airport's own line drawing on midnight while the library has
   * none; never another airport's picture), the words on their own scrim.
   */
  const featured = (airport: Airport) => Boolean(photos[airport.slug]) || airportDepthLabel(availability, airport.slug) === 'guide';

  const featureCard = (airport: Airport) => {
    const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
    const { link, chips } = parts(airport);
    const photo = photos[airport.slug];
    return (
      <Card
        as="li"
        key={airport.slug}
        interactive
        variant="midnight"
        data-airport={airport.slug}
        className="group/media isolate flex min-h-[18rem] min-w-0 flex-col justify-end overflow-hidden rounded-2xl border-0 p-0 sm:min-h-[21rem]"
      >
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
          {photo ? (
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="(min-width: 80rem) 33vw, (min-width: 40rem) 50vw, 100vw"
              quality={60}
              {...placeholderProps(photo)}
              style={{ objectPosition: objectPosition(photo.focal) }}
              className="object-cover transition-[scale] duration-slower ease-out motion-ok:group-hover/media:scale-[1.04]"
            />
          ) : (
            <>
              <span className="absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_0%,color-mix(in_srgb,var(--color-gold)_20%,transparent),transparent_70%)]" />
              <AirportVignette
                code={airport.code}
                terminal={airport.slug === 'kul' ? 'T1' : undefined}
                ground="sunken"
                className="absolute top-3 -right-4 w-[85%] bg-transparent text-on-midnight-dim opacity-40 transition-transform duration-slower ease-out motion-ok:group-hover/media:scale-[1.03]"
              />
            </>
          )}
        </div>
        {/* Polish 1b (critique-redesign1b item 7): a scrim only under the words, fading out 3rem above
            them, instead of a veil over the whole card. */}
        <div className="scrim-behind flex flex-col gap-2 rounded-b-[inherit] p-5 pt-6 [--scrim-behind-fade:3rem] sm:p-6 sm:pt-8">
          <AirportCode code={airport.code} size="sm" className="inline-flex h-7 w-fit items-center rounded-pill bg-gold px-2.5 text-on-gold" />
          <h3 className="type-title-lg text-ink">{link}</h3>
          <p className="type-body-sm text-ink-2">{place}</p>
          <div className="mt-1">{chips}</div>
        </div>
      </Card>
    );
  };

  const row = (airport: Airport) => {
    const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
    const { link, chips } = parts(airport);
    return (
      <li
        key={airport.slug}
        data-airport={airport.slug}
        className="group/card relative flex min-w-0 items-center gap-4 rounded-xl px-3 py-3 transition-colors duration-fast hover:bg-page-subtle has-[[data-card-link]:focus-visible]:focus-ring sm:px-4"
      >
        <AirportCode code={airport.code} className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-midnight text-sm text-gold-bright" />
        <div className="min-w-0 flex-1">
          <h3 className="type-title-sm text-ink">{link}</h3>
          <p className="type-body-sm mt-0.5 text-ink-2">{place}</p>
          <div className="mt-1.5">{chips}</div>
        </div>
        <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="shrink-0 text-ink-3 transition-transform duration-fast motion-ok:group-hover/card:translate-x-0.5" />
      </li>
    );
  };

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
                  className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 text-ink shadow-sm transition-[box-shadow,border-color] duration-base hover:border-line-strong hover:shadow-md"
                >
                  <AirportCode code={choice.code} className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-midnight text-sm text-gold-bright" />
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
            {states.map((item) => (
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
              // Redesign round one (critique item 25): short labels, so no segment wraps on a phone.
              ...AIRPORT_CLASSIFICATIONS.map((classification) => ({ value: classification, label: SHORT_TYPE_LABELS[classification][lang] })),
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
          {/* The depth labels on the cards, explained once (round 4, re-review 6.1.8). */}
          <div className="border-t border-line pt-3">
            <h2 className="type-eyebrow text-ink-2">{t('flightPages.depth.legendTitle')}</h2>
            <dl className="type-body-sm mt-2 grid gap-x-3 gap-y-1.5 text-ink-2 sm:grid-cols-[auto_minmax(0,1fr)]">
              {DEPTH_ORDER.filter((depth) => depth !== 'guide-only' || AIRPORTS.some((airport) => airportDepthLabel(availability, airport.slug) === 'guide-only')).map((depth) => (
                <div key={depth} className="contents">
                  <dt className="font-semibold text-ink max-sm:mt-1">{t(DEPTH_COPY[depth].label)}</dt>
                  <dd>{t(DEPTH_COPY[depth].hint)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </form>

        {/* Redesign round one: the network map as a night chart on midnight (an `on-media` scope). */}
        <figure className="on-media surface-midnight relative isolate min-w-0 overflow-hidden rounded-3xl p-5 text-ink shadow-lg sm:p-7">
          <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_100%_0%,color-mix(in_srgb,var(--color-gold)_16%,transparent),transparent_70%)]" />
          <NetworkMap
            titles={{ peninsular: t('airportsPage.map.peninsular'), borneo: t('airportsPage.map.borneo') }}
            alt={t('airportsPage.map.alt', { count: AIRPORTS.length })}
            highlight={filtered ? highlight : undefined}
          />
          <figcaption className="mt-5 border-t border-line-strong pt-4">
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
            <h2 id={`airports-${classification}`} className="type-display-sm mb-5 flex items-center gap-3 text-ink">
              {t(GROUP_TITLES[classification])}
              <span className="type-data-md rounded-pill bg-fill px-2.5 py-0.5 text-ink-2">{group.length}</span>
            </h2>
            {group.some(featured) ? <ul className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{group.filter(featured).map(featureCard)}</ul> : null}
            {group.some((airport) => !featured(airport)) ? (
              <ul className="grid gap-x-6 gap-y-1 rounded-2xl border border-line bg-surface p-2 shadow-sm sm:p-3 lg:grid-cols-2">
                {group.filter((airport) => !featured(airport)).map(row)}
              </ul>
            ) : null}
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
export function AirportDirectory({ photos }: Pick<AirportDirectoryViewProps, 'photos'>) {
  const then = useSearchParams().get('then');
  return <AirportDirectoryView then={isAirportSection(then) ? then : undefined} photos={photos} />;
}
