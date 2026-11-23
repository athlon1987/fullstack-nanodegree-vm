'use client';

import { useT } from '@/lib/i18n/client';
import { ProvenanceDefault, ProvenanceTag } from '@/components/common/provenance-tag';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { MAP_FILTERS, placePosition, type LevelView, type MapFilterId, type PoiView } from './map-logic';

export interface PlaceListProps {
  levels: readonly LevelView[];
  /** Points that pass the filters, all levels. */
  pois: readonly PoiView[];
  total: number;
  filters: readonly MapFilterId[];
  selectedId?: string;
  onShow: (id: string) => void;
  onRouteHere: (id: string) => void;
  onClearFilters: () => void;
}

/**
 * Every place on the map as text, grouped by level, with the same filters as the map. This is
 * the screen-reader friendly view and works without the drawing.
 */
export function PlaceList({ levels, pois, total, filters, selectedId, onShow, onRouteHere, onClearFilters }: PlaceListProps) {
  const t = useT();
  const active = MAP_FILTERS.filter((filter) => filters.includes(filter.id));
  return (
    <section id="map-places" aria-labelledby="map-places-title" tabIndex={-1} className="scroll-mt-28 outline-none">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h2 id="map-places-title" className="type-display-sm text-ink">
            {t('mapPages.list.title')}
          </h2>
          <p className="type-body mt-2 max-w-reading text-ink-2">{t('mapPages.list.lead')}</p>
        </div>
        <p className="type-data-sm text-ink-2" aria-live="polite">
          {t.count('mapPages.list.count', pois.length)}
          {pois.length !== total ? ` / ${total}` : null}
        </p>
      </div>

      {active.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {active.map((filter) => (
            <span key={filter.id} className="type-body-sm inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 text-ink">
              <Icon name={filter.icon} size="sm" />
              {t(filter.labelKey)}
            </span>
          ))}
          <Button variant="quiet" size="sm" iconStart="x" onClick={onClearFilters}>
            {t('mapPages.filters.showAll')}
          </Button>
        </div>
      ) : null}

      {pois.length === 0 ? (
        <p className="type-body mt-6 rounded-2xl border border-dashed border-line-strong p-5 text-ink-2">{t('mapPages.list.empty')}</p>
      ) : (
        <div className="mt-8 flex flex-col gap-10 @container">
          {levels.map((level) => {
            const items = pois.filter((poi) => poi.level === level.id);
            if (items.length === 0) return null;
            // Round 4 (A-14): the tag most places on the level share, said once under its heading
            // ("Demo unless marked": illustrative positions); only the other places keep a tag.
            const shared = levelProvenance(items);
            return (
              <div key={level.id}>
                <h3 className="type-title-lg flex flex-wrap items-center gap-x-3 text-ink">
                  {level.name}
                  <span className="type-data-sm rounded-pill bg-fill px-2.5 py-0.5 text-ink-2">{items.length}</span>
                </h3>
                {shared ? <ProvenanceDefault provenance={shared} className="mt-2" /> : null}
                <ul className="mt-3 grid gap-x-6 overflow-hidden rounded-2xl border border-line bg-surface px-4 shadow-sm @2xl:grid-cols-2 @5xl:grid-cols-3 sm:px-5">
                  {items.map((poi) => (
                    <li key={poi.id} className="-mb-px flex min-w-0 items-start gap-3 border-b border-line py-3" aria-current={poi.id === selectedId ? 'true' : undefined}>
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                        <Icon name={poi.kind} size="sm" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="type-body font-semibold text-ink">{poi.name}</p>
                        <p className="type-body-sm text-ink-2">
                          {poi.kindLabel}
                          {poi.side !== 'unknown' && placePosition(poi).area ? ` · ${t(`mapPages.area.${poi.side}`)}` : null}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {poi.provenance !== shared ? <ProvenanceTag provenance={poi.provenance} length="short" /> : null}
                          <button type="button" onClick={() => onShow(poi.id)} aria-label={`${t('mapPages.list.showOnMap')}: ${poi.name}`} className="link-action type-body-sm">
                            {t('mapPages.list.showOnMap')}
                          </button>
                          <button type="button" onClick={() => onRouteHere(poi.id)} aria-label={`${t('mapPages.details.routeHere')}: ${poi.name}`} className="link-action type-body-sm">
                            {t('mapPages.details.routeHere')}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * The provenance most places on a level share (at least half, and more than one place). Unlike
 * `sharedProvenance`, "Demo" counts: here it marks an illustrative pin position, not simulated
 * flight data, and the map draws those pins dashed as well.
 */
function levelProvenance(items: readonly PoiView[]): PoiView['provenance'] | undefined {
  const counts = new Map<PoiView['provenance'], number>();
  for (const item of items) counts.set(item.provenance, (counts.get(item.provenance) ?? 0) + 1);
  const [top, count] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  return top && count !== undefined && count > 1 && count * 2 >= items.length ? top : undefined;
}
