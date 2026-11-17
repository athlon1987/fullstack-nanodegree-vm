'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FacilityCategory, Source, TerminalId } from '@/content/types';
import { useT } from '@/lib/i18n/client';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { FacilityCard } from './facility-card';
import {
  EMPTY_FACILITY_FILTERS,
  activeFilterCount,
  filterFacilities,
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
}

/**
 * The facilities directory with filters by type, terminal, area and accessibility. Filters live
 * in the URL (`?cat=…&t=…&area=…&access=1`); the static HTML lists everything.
 */
export function FacilitiesDirectory(props: FacilitiesDirectoryProps) {
  return (
    <Suspense fallback={<Directory {...props} filters={EMPTY_FACILITY_FILTERS} />}>
      <DirectoryFromUrl {...props} />
    </Suspense>
  );
}

function DirectoryFromUrl(props: FacilitiesDirectoryProps) {
  const params = useSearchParams();
  const categories = useMemo(() => [...new Set(props.items.map((item) => item.category))], [props.items]);
  const filters = useMemo(
    () => parseFacilityFilters(params, { categories, terminals: props.terminals.map((terminal) => terminal.id) }),
    [params, categories, props.terminals],
  );
  return <Directory {...props} filters={filters} />;
}

function write(filters: FacilityFilters) {
  const query = writeFacilityFilters(new URLSearchParams(window.location.search), filters).toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function Directory({ items, sources, terminals, filters }: FacilitiesDirectoryProps & { filters: FacilityFilters }) {
  const t = useT();
  const multiTerminal = terminals.length > 1;
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
  const groups = categories
    .map((category) => ({ ...category, items: shown.filter((item) => item.category === category.id) }))
    .filter((group) => group.items.length > 0);
  const active = activeFilterCount(filters);
  const update = (patch: Partial<FacilityFilters>) => write({ ...filters, ...patch });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-10">
      <section aria-labelledby="facility-filters-title" className="min-w-0 lg:sticky lg:top-[calc(var(--spacing-header)+1rem)] lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 id="facility-filters-title" className="type-title-md text-ink">
            {t('mapPages.facilities.filtersTitle')}
          </h2>
          {active > 0 ? (
            <Button variant="quiet" size="sm" iconStart="x" onClick={() => write(EMPTY_FACILITY_FILTERS)}>
              {t('mapPages.facilities.clear')}
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-5 rounded-xl border border-line-strong bg-surface p-4">
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
            </div>
          </div>

          {multiTerminal ? (
            <SegmentedControl
              label={t('mapPages.facilities.terminal')}
              showLabel
              block
              value={filters.terminal ?? 'all'}
              onValueChange={(value) => update({ terminal: value === 'all' ? undefined : (value as TerminalId) })}
              options={[{ value: 'all', label: t('mapPages.facilities.allTerminals') }, ...terminals.map((terminal) => ({ value: terminal.id, label: terminal.label }))]}
            />
          ) : null}

          <SegmentedControl
            label={t('mapPages.facilities.area')}
            showLabel
            block
            value={filters.area ?? 'all'}
            onValueChange={(value) => update({ area: value === 'all' ? undefined : (value as 'landside' | 'airside') })}
            options={[
              { value: 'all', label: t('mapPages.facilities.areaAll') },
              { value: 'landside', label: t('mapPages.legend.landside') },
              { value: 'airside', label: t('mapPages.legend.airside') },
            ]}
            className="[&_label]:min-h-14"
          />

          <Switch
            label={t('mapPages.facilities.accessibleOnly')}
            hint={t('mapPages.facilities.accessibleHint')}
            checked={filters.accessible}
            onCheckedChange={(checked) => update({ accessible: checked })}
          />
        </div>
      </section>

      <div className="min-w-0">
        <p className="type-data-sm mb-4 text-ink-2" aria-live="polite">
          {t.count('mapPages.facilities.results', shown.length)}
        </p>
        {groups.length === 0 ? (
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
            {groups.map((group) => (
              <section key={group.id} aria-labelledby={`facility-group-${group.id}`}>
                <h2 id={`facility-group-${group.id}`} className="type-title-lg mb-4 flex items-baseline gap-3 border-b border-line pb-2 text-ink">
                  {group.label}
                  <span className="type-data-sm text-ink-3">{group.items.length}</span>
                </h2>
                <div className="grid gap-4 @3xl:grid-cols-2">
                  {group.items.map((item) => (
                    <FacilityCard key={item.id} facility={item} sources={sources} showTerminal={multiTerminal} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
