'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { facilityCategoryLabel } from '@/content/values';
import type { FacilityCategory, Source, TerminalId } from '@/content/types';
import { useLang, useT } from '@/lib/i18n/client';
import { NotPublished } from '@/components/common/not-published';
import { ProvenanceDefault } from '@/components/common/provenance-tag';
import { sharedProvenance } from '@/components/common/shared-provenance';
import { sectionSources } from '@/components/common/section-sources';
import { SourceNote } from '@/components/common/source-note';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { FilterChip } from '@/components/ui/filter-chip';
import { Switch } from '@/components/ui/switch';
import { MoreOnPhones } from '@/components/common/more-on-phones';
import { FacilityCard } from './facility-card';
import { AsOf } from './facility-values';
import {
  EMPTY_FACILITY_FILTERS,
  activeFilterCount,
  ASSISTANCE_CATEGORIES,
  filterFacilities,
  missingExpectedCategories,
  parseFacilityFilters,
  writeFacilityFilters,
  type FacilityFilters,
  type FacilityView,
} from './facility-view';

export interface FacilitiesDirectoryProps {
  items: FacilityView[];
  sources: Record<string, Source>;
  /** The airport's terminals; the terminal filter shows only when there is more than one. */
  terminals: { id: TerminalId; label: string }[];
  /** Airport slug: enables "save to My journey" on each card. */
  airport?: string;
  /** Short airport name, for the "not published yet" cards. */
  airportName?: string;
}

/**
 * The facilities directory with filters by type, terminal, area and accessibility. Filters live
 * in the URL (`?cat=…&t=…&area=…&access=1`); the static HTML lists everything.
 */
export function FacilitiesDirectory(props: FacilitiesDirectoryProps) {
  return (
    <Suspense fallback={<Directory {...props} filters={EMPTY_FACILITY_FILTERS} live={false} />}>
      <DirectoryFromUrl {...props} />
    </Suspense>
  );
}

function DirectoryFromUrl(props: FacilitiesDirectoryProps) {
  const params = useSearchParams();
  const categories = useMemo(() => [...new Set([...props.items.map((item) => item.category), ...missingExpectedCategories(props.items)])], [props.items]);
  const filters = useMemo(
    () => parseFacilityFilters(params, { categories, terminals: props.terminals.map((terminal) => terminal.id) }),
    [params, categories, props.terminals],
  );
  return <Directory {...props} filters={filters} live />;
}

function write(filters: FacilityFilters) {
  const query = writeFacilityFilters(new URLSearchParams(window.location.search), filters).toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function Directory({
  items,
  sources,
  terminals,
  airport,
  airportName,
  filters,
  live,
}: FacilitiesDirectoryProps & {
  filters: FacilityFilters;
  /**
   * False in the Suspense fallback: that HTML is replaced, never hydrated, so its phone filter
   * toggle cannot work. It is shown disabled until the live directory takes over.
   */
  live: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const multiTerminal = terminals.length > 1;
  // Expected but unpublished categories (C-07): a chip each, and a "not published" card with the
  // information-counter route. Terminal and area filters do not apply to them (nothing is placed).
  const missing = useMemo(() => missingExpectedCategories(items), [items]);
  const placeholders = missing.filter(
    (category) =>
      (filters.categories.length === 0 || filters.categories.includes(category)) &&
      (!filters.accessible || ASSISTANCE_CATEGORIES.includes(category)),
  );
  const information = items.find((item) => item.category === 'information');
  const categories = useMemo(() => {
    const seen = new Map<FacilityCategory, { label: string; icon: string; count: number }>();
    for (const item of items) {
      const entry = seen.get(item.category);
      if (entry) entry.count += 1;
      else seen.set(item.category, { label: item.categoryLabel, icon: item.icon, count: 1 });
    }
    return [...seen.entries()].map(([id, entry]) => ({ id, ...entry }));
  }, [items]);
  const shown = filterFacilities(items, filters);
  // Round 2 (A-14): the provenance most shown facilities share, stated once above the list.
  const defaultProvenance = sharedProvenance(shown);
  const groups = categories
    .map((category) => ({ ...category, items: shown.filter((item) => item.category === category.id) }))
    .filter((group) => group.items.length > 0);
  const active = activeFilterCount(filters);
  const update = (patch: Partial<FacilityFilters>) => write({ ...filters, ...patch });
  const collapseGroups = active === 0;
  useOpenTargetDetails();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-10">
      <section aria-labelledby="facility-filters-title" className="min-w-0 lg:sticky lg:top-[calc(var(--spacing-sticky)+1rem)] lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 id="facility-filters-title" className="type-title-md sr-only text-ink lg:not-sr-only">
            {t('mapPages.facilities.filtersTitle')}
          </h2>
          {active > 0 ? (
            <Button variant="quiet" size="sm" iconStart="x" onClick={() => write(EMPTY_FACILITY_FILTERS)}>
              {t('mapPages.facilities.clear')}
            </Button>
          ) : null}
        </div>

        <Button
          variant="secondary"
          block
          iconStart="sliders-horizontal"
          aria-expanded={open}
          aria-controls="facility-filters-panel"
          disabled={!live}
          onClick={() => setOpen((value) => !value)}
          className="mt-3 lg:hidden"
        >
          {t('mapPages.facilities.filtersTitle')}
          {active > 0 ? ` (${active})` : null}
        </Button>
        <div id="facility-filters-panel" className={cn('mt-4 flex-col gap-5 rounded-xl border border-line-strong bg-surface p-4 lg:flex', open ? 'flex' : 'hidden')}>
          <div role="group" aria-labelledby="facility-type-label">
            <p id="facility-type-label" className="type-body-sm mb-2 font-semibold text-ink">
              {t('mapPages.facilities.category')}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  icon={category.icon}
                  count={category.count}
                  pressed={filters.categories.includes(category.id)}
                  onPressedChange={(pressed) =>
                    update({ categories: pressed ? [...filters.categories, category.id] : filters.categories.filter((id) => id !== category.id) })
                  }
                >
                  {category.label}
                </FilterChip>
              ))}
              {missing.map((category) => (
                <FilterChip
                  key={category}
                  icon="circle-dashed"
                  pressed={filters.categories.includes(category)}
                  onPressedChange={(pressed) => update({ categories: pressed ? [...filters.categories, category] : filters.categories.filter((id) => id !== category) })}
                  className="border-dashed"
                >
                  {facilityCategoryLabel(category, lang)}
                </FilterChip>
              ))}
            </div>
          </div>

          {multiTerminal ? (
            <div role="group" aria-labelledby="facility-terminal-label">
              <p id="facility-terminal-label" className="type-body-sm mb-2 font-semibold text-ink">
                {t('mapPages.facilities.terminal')}
              </p>
              <div className="flex flex-wrap gap-2">
                {terminals.map((terminal) => (
                  <FilterChip
                    key={terminal.id}
                    icon="building-2"
                    pressed={filters.terminal === terminal.id}
                    onPressedChange={(pressed) => update({ terminal: pressed ? terminal.id : undefined })}
                  >
                    {terminal.label}
                  </FilterChip>
                ))}
              </div>
            </div>
          ) : null}

          <div role="group" aria-labelledby="facility-area-label">
            <p id="facility-area-label" className="type-body-sm mb-2 font-semibold text-ink">
              {t('mapPages.facilities.area')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['landside', 'airside'] as const).map((area) => (
                <FilterChip key={area} pressed={filters.area === area} onPressedChange={(pressed) => update({ area: pressed ? area : undefined })}>
                  {t(`mapPages.legend.${area}`)}
                </FilterChip>
              ))}
            </div>
          </div>

          <Switch
            label={t('mapPages.facilities.accessibleOnly')}
            hint={t('mapPages.facilities.accessibleHint')}
            checked={filters.accessible}
            onCheckedChange={(checked) => update({ accessible: checked })}
          />
        </div>
      </section>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="type-data-sm text-ink-2" aria-live="polite">
            {t.count('mapPages.facilities.results', shown.length)}
          </p>
          {/* Round 2 (A-14): the provenance most facilities share, said once; the others keep their tag. */}
          {defaultProvenance ? <ProvenanceDefault provenance={defaultProvenance} /> : null}
        </div>
        {groups.length === 0 && placeholders.length === 0 ? (
          <EmptyState
            icon="search-x"
            headingLevel={2}
            title={t('mapPages.facilities.emptyTitle')}
            action={
              <Button variant="secondary" iconStart="x" onClick={() => write(EMPTY_FACILITY_FILTERS)}>
                {t('mapPages.facilities.clear')}
              </Button>
            }
          >
            {t('mapPages.facilities.emptyBody')}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-10 @container">
            {groups.map((group) => {
              // Round 4 (A-14): one source list per section, not a toggle on every card. Each source
              // names the facilities it supports. The date is said once when the cards share it;
              // otherwise each card keeps its own "As of".
              const first = group.items[0];
              const sameDate = group.items.every((item) => item.asOf === first.asOf);
              const label = (item: FacilityView) =>
                group.items.some((other) => other !== item && other.name === item.name) ? `${item.name} (${item.terminalLabel})` : item.name;
              const listed = sectionSources(group.items, (item) => item.sourceIds, label, sources);
              const card = (item: FacilityView) => (
                <FacilityCard
                  key={item.id}
                  facility={item}
                  sources={sources}
                  showTerminal={multiTerminal}
                  airport={airport}
                  defaultProvenance={defaultProvenance}
                  groupedSources
                  showAsOf={!sameDate}
                />
              );
              return (
                <section key={group.id} aria-labelledby={`facility-group-${group.id}`}>
                  <h2 id={`facility-group-${group.id}`} className="type-title-lg mb-4 flex items-baseline gap-3 border-b border-line pb-2 text-ink">
                    {group.label}
                    <span className="type-data-sm text-ink-3">{group.items.length}</span>
                  </h2>
                  {/* Round 6 (review-3 9.1 item 7): with no filter, a long group shows its first
                      cards and keeps the rest behind a disclosure on phones (the page was 15,451 px
                      at 390 px). A link to a card inside it opens it (`useOpenTargetDetails`). */}
                  <div className="grid gap-4 @3xl:grid-cols-2">
                    {(collapseGroups ? group.items.slice(0, GROUP_SHOWN) : group.items).map(card)}
                  </div>
                  {collapseGroups && group.items.length > GROUP_SHOWN ? (
                    <MoreOnPhones
                      className="mt-3"
                      contentClassName="grid gap-4 @3xl:grid-cols-2 md:pt-4"
                      summary={t('mapPages.facilities.moreInGroup', { count: group.items.length - GROUP_SHOWN, group: group.label })}
                    >
                      {group.items.slice(GROUP_SHOWN).map(card)}
                    </MoreOnPhones>
                  ) : null}
                  {listed.sources.length > 0 || (sameDate && first.asOf) ? (
                    <div data-section-sources="" className="mt-2 flex flex-wrap items-center gap-x-4">
                      <SourceNote sources={listed.sources} citedBy={group.items.length > 1 ? listed.citedBy : undefined} label={t('shellExtras.sourceLists.section')} />
                      {sameDate && first.asOf ? <AsOf value={first.asOf} /> : null}
                    </div>
                  ) : null}
                </section>
              );
            })}
            {placeholders.length > 0 ? (
              <section aria-labelledby="facility-group-unpublished" data-facility-placeholders="">
                <h2 id="facility-group-unpublished" className="type-title-lg mb-1 border-b border-line pb-2 text-ink">
                  {t('mapPages.facilities.placeholderTitle')}
                </h2>
                <p className="type-body-sm text-ink-2">{t('mapPages.facilities.placeholderLead', { airport: airportName ?? '' })}</p>
                {/* Round 2 (A-14): what is missing and what to do, once for the section instead of on every card. */}
                <NotPublished label={t('mapPages.facilities.placeholderFields')} className="mt-2" />
                <p className="type-body-sm mt-1 mb-4 text-ink-2">{t('mapPages.facilities.placeholderBody', { airport: airportName ?? '' })}</p>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  {placeholders.map((category) => (
                    <article
                      key={category}
                      id={`facility-unpublished-${category}`}
                      aria-labelledby={`facility-unpublished-${category}-title`}
                      className="flex min-w-0 scroll-mt-32 flex-col gap-3 rounded-xl border border-dashed border-line-strong bg-page-subtle p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-2">
                          <Icon name={category} />
                        </span>
                        <h3 id={`facility-unpublished-${category}-title`} className="type-title-md min-w-0 text-ink">
                          {facilityCategoryLabel(category, lang)}
                        </h3>
                      </div>
                      {information ? (
                        <a href={`#${information.id}`} className="link-action type-body-sm self-start text-ink">
                          {t('mapPages.facilities.placeholderAction')}
                          <Icon name="arrow-right" size="sm" />
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/** Cards a group shows before "N more" on phones when no filter is chosen (round 6). */
const GROUP_SHOWN = 3;

/**
 * A link to a card that sits in a closed disclosure (`#kul-t1-fast-track` from the overview or a
 * flight page) opens the disclosure first, on load and on later in-page links, in browsers that do
 * not do so themselves.
 */
function useOpenTargetDetails() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      const details = target?.closest('details');
      if (!target || !details || details.open) return;
      details.open = true;
      target.scrollIntoView({ block: 'start' });
    };
    open();
    window.addEventListener('hashchange', open);
    return () => window.removeEventListener('hashchange', open);
  }, []);
}
