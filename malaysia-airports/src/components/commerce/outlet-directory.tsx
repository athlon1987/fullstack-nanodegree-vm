'use client';

import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Source, TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatList } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { EmptyState } from '@/components/common/empty-state';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { Icon } from '@/components/ui/icon';
import { NativeSelect } from '@/components/ui/native-select';
import { SearchField } from '@/components/ui/search-field';
import { Switch } from '@/components/ui/switch';
import {
  EMPTY_OUTLET_FILTERS,
  OUTLET_KINDS,
  PROXIMITY_KINDS,
  activeFilterCount,
  effectiveSort,
  filterAvailability,
  filterOutlets,
  gateAreasFor,
  gateContextFor,
  gateProximity,
  hasMachineHours,
  parseOutletFilters,
  sortOutlets,
  withoutUnavailable,
  writeOutletFilters,
  type FilterAvailability,
  type OutletFilters,
  type OutletKind,
  type OutletSort,
  type OutletView,
  type PriceBand,
  type UnavailableFilter,
} from './commerce-view';
import { GatePanel } from './gate-panel';
import { KIND_ICONS, OutletCard } from './outlet-card';

export interface OutletDirectoryProps {
  airport: string;
  items: OutletView[];
  sources: Record<string, Source>;
  /** The airport's terminals; the terminal filter shows only when there is more than one. */
  terminals: { id: TerminalId; label: string }[];
  /** Link to the lounges page, when the airport has one (the "services" empty state points to it). */
  loungesHref?: string;
  /** The honest "partial directory" note, rendered on the server. */
  notice?: ReactNode;
}

/**
 * Shop and dine discovery: text search, type, category, terminal, side of security, halal,
 * open now (only where hours are published), price (only where published), sorting, and a
 * schematic "near your gate". Filters live in the URL; the static HTML lists every outlet.
 */
export function OutletDirectory(props: OutletDirectoryProps) {
  return (
    <Suspense fallback={<Directory {...props} filters={EMPTY_OUTLET_FILTERS} dropped={[]} live={false} />}>
      <DirectoryFromUrl {...props} />
    </Suspense>
  );
}

function DirectoryFromUrl(props: OutletDirectoryProps) {
  const params = useSearchParams();
  const { items, terminals, airport } = props;
  const options = useMemo(
    () => ({
      categories: [...new Set(items.map((item) => item.categoryKey))],
      cuisines: [...new Set(items.flatMap((item) => (item.cuisine ? [item.cuisine] : [])))],
      terminals: terminals.map((terminal) => terminal.id),
      gateIds: gateAreasFor(airport).map((area) => area.id),
    }),
    [items, terminals, airport],
  );
  // Filters the data cannot serve are dropped and named, so a link never lands on "0 of 8" (C-05).
  const { filters, dropped } = useMemo(() => withoutUnavailable(parseOutletFilters(params, options), filterAvailability(items)), [params, options, items]);
  return <Directory {...props} filters={filters} dropped={dropped} live />;
}

function write(filters: OutletFilters) {
  const query = writeOutletFilters(new URLSearchParams(window.location.search), filters).toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
}

const PRICE_BANDS: readonly PriceBand[] = [1, 2, 3, 4];

function Directory({
  airport,
  items,
  sources,
  terminals,
  loungesHref,
  notice,
  filters,
  dropped,
  live,
}: OutletDirectoryProps & {
  filters: OutletFilters;
  /** Filters asked for in the link that the data cannot serve (C-05). */
  dropped: readonly UnavailableFilter[];
  /**
   * False in the Suspense fallback: that HTML is replaced, never hydrated, so its phone filter
   * toggle cannot work. It is shown disabled until the live directory takes over.
   */
  live: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const now = useNow();
  const [query, setQuery] = useState(filters.query);
  const [open, setOpen] = useState(false);
  const multiTerminal = terminals.length > 1;
  const terminalLabels = useMemo(() => Object.fromEntries(terminals.map((terminal) => [terminal.id, terminal.label])), [terminals]);
  const current: OutletFilters = { ...filters, query };
  const update = (patch: Partial<OutletFilters>) => write({ ...current, ...patch });
  const gate = gateContextFor(airport, filters.gate);
  const sort = effectiveSort(filters, gate !== undefined);

  const count = (patch: Partial<OutletFilters>) => filterOutlets(items, { ...current, ...patch }, now).length;
  const shown = sortOutlets(filterOutlets(items, current, now), sort, { query, gate, lang });
  const active = activeFilterCount(filters);
  const withHours = items.filter((item) => hasMachineHours(item.hours)).length;
  const available: FilterAvailability = useMemo(() => filterAvailability(items), [items]);
  const hasPrices = available.price;
  const zones = (['landside', 'airside'] as const).filter((zone) => available[zone]);
  const unavailable = (['openNow', 'halal', 'landside', 'airside'] as const).filter((key) => !available[key]);
  const unavailableText = (keys: readonly UnavailableFilter[]) => formatList(keys.map((key) => t(`commercePages.filters.unavailableNames.${key}`)), lang);
  const cuisines = [...new Set(items.flatMap((item) => (item.cuisine ? [item.cuisine] : [])))].sort((a, b) => a.localeCompare(b, lang));
  const categories = useMemo(() => {
    const seen = new Map<string, { label: string; kind: OutletKind }>();
    for (const item of items) if (!seen.has(item.categoryKey)) seen.set(item.categoryKey, { label: item.categoryLabel, kind: item.kind });
    return [...seen.entries()].map(([key, value]) => ({ key, ...value })).sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [items, lang]);
  const visibleCategories = categories.filter((category) => !filters.kind || category.kind === filters.kind || filters.categories.includes(category.key));

  const clearAll = () => {
    setQuery('');
    write({ ...EMPTY_OUTLET_FILTERS, gate: filters.gate, sort: filters.sort });
  };
  const toggleList = <T,>(values: readonly T[], value: T, pressed: boolean): T[] => (pressed ? [...values, value] : values.filter((item) => item !== value));

  const groups: { id: string; title?: string; estimated?: boolean; items: OutletView[] }[] =
    sort === 'gate' && gate
      ? PROXIMITY_KINDS.map((kind) => ({
          id: kind,
          title: t(`commercePages.gate.proximity.${kind}`),
          estimated: true,
          items: shown.filter((item) => gateProximity(item, gate) === kind),
        })).filter((group) => group.items.length > 0)
      : sort === 'suggested' && multiTerminal && !filters.terminal
        ? terminals
            .map((terminal) => ({ id: terminal.id, title: terminal.label, items: shown.filter((item) => item.terminal === terminal.id) }))
            .filter((group) => group.items.length > 0)
        : [{ id: 'all', items: shown }];

  const resultLine =
    shown.length === items.length && !query.trim()
      ? t.count('commercePages.results', shown.length)
      : `${t.count('commercePages.resultsFiltered', shown.length, { total: items.length })}${query.trim() ? ` ${t('commercePages.resultsQuery', { query: query.trim() })}` : ''}`;

  const servicesEmpty = filters.kind === 'service' && !items.some((item) => item.kind === 'service');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <SearchField
          label={t('commercePages.search.label')}
          size="lg"
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            write({ ...filters, query: value });
          }}
          onClear={() => {
            setQuery('');
            write({ ...filters, query: '' });
          }}
          placeholder={t('commercePages.search.placeholder')}
          placeholderShort={t('commercePages.search.placeholderShort')}
        />
        <NativeSelect
          label={t('commercePages.sort.label')}
          value={sort}
          onChange={(event) => update({ sort: event.target.value as OutletSort })}
          iconStart="list-filter"
        >
          <option value="suggested">{t('commercePages.sort.suggested')}</option>
          <option value="name">{t('commercePages.sort.name')}</option>
          <option value="gate" disabled={!gate}>
            {t('commercePages.sort.gate')}
          </option>
        </NativeSelect>
      </div>

      <div role="group" aria-label={t('commercePages.filters.type')} className="-mx-1 flex flex-wrap gap-2 px-1">
        <FilterChip pressed={!filters.kind} onPressedChange={() => update({ kind: undefined, categories: [] })} count={count({ kind: undefined, categories: [] })}>
          {t('commercePages.kinds.all')}
        </FilterChip>
        {OUTLET_KINDS.map((kind) => (
          <FilterChip
            key={kind}
            icon={KIND_ICONS[kind]}
            pressed={filters.kind === kind}
            onPressedChange={(pressed) => update({ kind: pressed ? kind : undefined, categories: [] })}
            count={count({ kind, categories: [] })}
          >
            {t(`commercePages.kinds.${kind}`)}
          </FilterChip>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--spacing-header)+1rem)] lg:self-start">
          <GatePanel
            airport={airport}
            terminalLabels={terminalLabels}
            value={filters.gate}
            context={gate}
            onChange={(value) => update({ gate: value, sort: value ? undefined : filters.sort === 'gate' ? undefined : filters.sort })}
          />

          <section aria-labelledby="outlet-filters-title" className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 id="outlet-filters-title" className="type-title-sm sr-only text-ink lg:not-sr-only">
                {t('commercePages.filters.title')}
              </h2>
              {active > 0 ? (
                <Button variant="quiet" size="sm" iconStart="x" onClick={clearAll} className="max-lg:hidden">
                  {t('commercePages.filters.clear')}
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2 lg:hidden">
              <Button
                variant="secondary"
                block
                iconStart="sliders-horizontal"
                aria-expanded={open}
                aria-controls="outlet-filters-panel"
                disabled={!live}
                onClick={() => setOpen((value) => !value)}
              >
                {t('commercePages.filters.toggle')}
                {active > 0 ? ` (${active})` : null}
              </Button>
              {active > 0 ? (
                <Button variant="quiet" iconStart="x" onClick={clearAll}>
                  {t('commercePages.filters.clear')}
                </Button>
              ) : null}
            </div>

            <div
              id="outlet-filters-panel"
              className={cn('mt-3 flex-col divide-y divide-line rounded-xl border border-line-strong bg-surface px-4 lg:flex', open ? 'flex' : 'hidden')}
            >
              <FilterGroup id="outlet-category" label={t('commercePages.filters.category')}>
                {visibleCategories.map((category) => (
                  <FilterChip
                    key={category.key}
                    pressed={filters.categories.includes(category.key)}
                    onPressedChange={(pressed) => update({ categories: toggleList(filters.categories, category.key, pressed) })}
                    count={count({ categories: [category.key] })}
                    className="h-auto min-h-9 whitespace-normal py-1.5 text-left touch:min-h-11"
                  >
                    {category.label}
                  </FilterChip>
                ))}
              </FilterGroup>

              {cuisines.length > 0 ? (
                <FilterGroup id="outlet-cuisine" label={t('commercePages.filters.cuisine')}>
                  {cuisines.map((cuisine) => (
                    <FilterChip
                      key={cuisine}
                      pressed={filters.cuisines.includes(cuisine)}
                      onPressedChange={(pressed) => update({ cuisines: toggleList(filters.cuisines, cuisine, pressed) })}
                      count={count({ cuisines: [cuisine] })}
                    >
                      {cuisine}
                    </FilterChip>
                  ))}
                </FilterGroup>
              ) : null}

              {multiTerminal ? (
                <FilterGroup id="outlet-terminal" label={t('commercePages.filters.terminal')}>
                  {terminals.map((terminal) => (
                    <FilterChip
                      key={terminal.id}
                      icon="building-2"
                      pressed={filters.terminal === terminal.id}
                      onPressedChange={(pressed) => update({ terminal: pressed ? terminal.id : undefined })}
                      count={count({ terminal: terminal.id })}
                    >
                      {terminal.label}
                    </FilterChip>
                  ))}
                </FilterGroup>
              ) : null}

              {zones.length > 0 ? (
              <FilterGroup id="outlet-security" label={t('commercePages.filters.security')}>
                {zones.map((zone) => (
                  <FilterChip
                    key={zone}
                    icon={zone === 'airside' ? 'scan-line' : 'door-open'}
                    pressed={filters.zone === zone}
                    onPressedChange={(pressed) => update({ zone: pressed ? zone : undefined })}
                    count={count({ zone })}
                    className="h-auto min-h-9 whitespace-normal py-1.5 text-left touch:min-h-11"
                  >
                    {t(`commercePages.card.zone.${zone}`)}
                  </FilterChip>
                ))}
              </FilterGroup>
              ) : null}

              {available.halal || available.openNow ? (
                <div className="flex flex-col gap-4 py-4">
                  {available.halal ? (
                    <Switch
                      label={t('commercePages.filters.halal')}
                      hint={t('commercePages.filters.halalHint')}
                      checked={filters.halal}
                      onCheckedChange={(checked) => update({ halal: checked })}
                    />
                  ) : null}
                  {available.openNow ? (
                    <Switch
                      label={t('commercePages.filters.openNow')}
                      hint={t('commercePages.filters.openNowHint', { count: withHours, total: items.length })}
                      checked={filters.openNow}
                      onCheckedChange={(checked) => update({ openNow: checked })}
                    />
                  ) : null}
                </div>
              ) : null}

              {unavailable.length > 0 ? (
                // Filters the data cannot serve are not offered; say which and why (C-05).
                <div data-unavailable-filters="" className="py-4">
                  <p className="type-body-sm font-semibold text-ink">{t('commercePages.filters.unavailableTitle')}</p>
                  <p className="type-body-sm mt-1 text-ink-2">{t('commercePages.filters.unavailableBody', { list: unavailableText(unavailable) })}</p>
                </div>
              ) : null}

              {hasPrices ? (
                <FilterGroup id="outlet-price" label={t('commercePages.filters.price')}>
                  {PRICE_BANDS.map((band) => (
                    <FilterChip
                      key={band}
                      pressed={filters.prices.includes(band)}
                      onPressedChange={(pressed) => update({ prices: toggleList(filters.prices, band, pressed) })}
                      count={count({ prices: [band] })}
                    >
                      {t(`commercePages.filters.band${band}`)}
                    </FilterChip>
                  ))}
                </FilterGroup>
              ) : (
                <div className="py-4">
                  <p className="type-body-sm font-semibold text-ink">{t('commercePages.filters.price')}</p>
                  <p className="type-body-sm mt-1 text-ink-2">{t('commercePages.filters.priceNone')}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="min-w-0">
          {notice}
          {dropped.length > 0 ? (
            <p data-dropped-filters="" className="type-body-sm mb-3 flex gap-2 rounded-lg border border-line-strong bg-page-subtle p-3 text-ink">
              <Icon name="info" size="sm" className="mt-0.5 shrink-0 text-ink-2" />
              <span>{t('commercePages.filters.dropped', { list: unavailableText(dropped) })}</span>
            </p>
          ) : null}
          <p className="type-data-sm mb-4 text-ink-2" aria-live="polite" aria-atomic="true">
            {resultLine}
          </p>

          {shown.length === 0 ? (
            servicesEmpty ? (
              <EmptyState
                icon="hand-helping"
                headingLevel={2}
                title={t('commercePages.empty.servicesTitle')}
                action={
                  loungesHref ? (
                    <Button asChild variant="secondary" iconEnd="arrow-right">
                      <LocaleLink href={loungesHref}>{t('commercePages.loungesLink')}</LocaleLink>
                    </Button>
                  ) : undefined
                }
              >
                {t('commercePages.empty.servicesBody')}
              </EmptyState>
            ) : filters.openNow ? (
              <EmptyState
                icon="clock"
                headingLevel={2}
                title={t('commercePages.empty.openNowTitle')}
                action={
                  <Button variant="secondary" iconStart="x" onClick={() => update({ openNow: false })}>
                    {t('commercePages.empty.turnOffOpenNow')}
                  </Button>
                }
              >
                {t('commercePages.empty.openNowBody')}
              </EmptyState>
            ) : (
              <EmptyState
                icon="search-x"
                headingLevel={2}
                title={t('commercePages.empty.title')}
                action={
                  <Button variant="secondary" iconStart="x" onClick={clearAll}>
                    {t('commercePages.filters.clear')}
                  </Button>
                }
              >
                {t('commercePages.empty.body')}
              </EmptyState>
            )
          ) : (
            <div className="flex flex-col gap-10 @container">
              {groups.map((group) => (
                <Group key={group.id} labelledBy={group.title ? `outlet-group-${group.id}` : undefined}>
                  {group.title ? (
                    <h2 id={`outlet-group-${group.id}`} className="type-title-md mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-2 text-ink">
                      {group.title}
                      <span className="type-data-sm text-ink-3">{group.items.length}</span>
                      {group.estimated ? <ProvenanceTag provenance="estimated" length="short" className="ml-auto" /> : null}
                    </h2>
                  ) : null}
                  <ul className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
                    {group.items.map((item) => (
                      <li key={item.id} className="flex min-w-0">
                        <div className="flex w-full min-w-0 flex-col [&>article]:flex-1">
                          <OutletCard
                            outlet={item}
                            sources={sources}
                            showTerminal={multiTerminal}
                            proximity={gate && sort !== 'gate' ? gateProximity(item, gate) : undefined}
                            headingLevel={group.title ? 3 : 2}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Group>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** A titled group of results is a section; the flat list needs no extra landmark. */
function Group({ labelledBy, children }: { labelledBy?: string; children: ReactNode }) {
  return labelledBy ? <section aria-labelledby={labelledBy}>{children}</section> : <div>{children}</div>;
}

function FilterGroup({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="py-4">
      <p id={`${id}-label`} className="type-body-sm mb-2.5 font-semibold text-ink">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
