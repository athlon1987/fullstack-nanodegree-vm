'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapNode, Source } from '@/content/types';
import { useUrlSearchParams } from '@/lib/hooks/use-url';
import { shortestPath } from '@/lib/map';
import { useT } from '@/lib/i18n/client';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { SourceNote } from '@/components/common/source-note';
import { AsOf, sourcesFor } from '@/components/facilities/facility-values';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { Icon } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { MapCanvas, type RouteConnector, type RouteLine } from './map-canvas';
import { MapLegend } from './map-legend';
import {
  MAP_FILTERS,
  applyQueryPatch,
  buildRouteSteps,
  CHECKPOINT_KINDS,
  clampView,
  filterCounts,
  fitView,
  levelBounds,
  gatePlaceId,
  parseMapQuery,
  passesFilters,
  routeMinutes,
  routingModel,
  scoreMatch,
  searchText,
  type MapFilterId,
  type MapQuery,
  type MapView,
  type QueryPatch,
  type RouteStep,
  type ViewState,
} from './map-logic';
import { DETAILS_HEADING_ID, PlaceDetails } from './place-details';
import { PlaceList } from './place-list';
import { ROUTE_FROM_ID, ROUTE_TO_ID, RoutePlanner } from './route-planner';
import { prefersReducedMotion } from './use-reduced-motion';

export interface MapExplorerProps {
  /** Every schematic map of the airport (one per terminal at most). */
  maps: MapView[];
  sources: Record<string, Source>;
  airportSlug: string;
  /** Terminal labels by id, for the "no map for this terminal" state. */
  terminalLabels: Record<string, string>;
  /** Locale-free path of the facilities directory, when the airport has one. */
  facilitiesHref?: string;
  officialMapUrl?: string;
  officialAirportUrl: string;
}

/** Zoom used when a place is chosen from search, the list or a deep link. */
const FOCUS_ZOOM = 1.8;

/**
 * The interactive terminal map. The URL holds the shareable state (`t`, `level`, `poi`, `from`,
 * `to`, `sf`, `cat`); the static HTML is the default view, so the map, the filters' results and
 * the list of places are there without JavaScript.
 */
export function MapExplorer(props: MapExplorerProps) {
  // No `<Suspense>` (round 2): the query comes from `useUrlSearchParams`, empty until hydration,
  // so the server map hydrates in place (a search typed before hydration is kept); a deep link's
  // place, level or route is applied right after.
  const params = useUrlSearchParams();
  const query = useMemo(() => parseMapQuery(params), [params]);
  return <MapExplorerView {...props} query={query} />;
}

function MapExplorerView({ query, ...props }: MapExplorerProps & { query: MapQuery }) {
  const map = query.terminal ? props.maps.find((item) => item.terminal === query.terminal) : props.maps[0];
  if (!map) return <TerminalWithoutMap terminal={query.terminal ?? ''} {...props} />;
  return <MapWorkspace key={map.id} map={map} query={query} {...props} />;
}

function TerminalWithoutMap({ terminal, maps, airportSlug, terminalLabels, facilitiesHref, officialAirportUrl }: MapExplorerProps & { terminal: string }) {
  const t = useT();
  const label = terminalLabels[terminal] ?? terminal;
  const other = maps[0];
  return (
    <div className="max-w-narrow rounded-2xl border border-line bg-surface shadow-sm p-6 sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-lg bg-page-subtle text-ink-2">
        <Icon name="map" size="lg" />
      </span>
      <h2 className="type-title-lg mt-4 text-ink">{t('mapPages.terminalNoMapTitle', { terminal: label })}</h2>
      <p className="type-body mt-2 text-ink-2">{t('mapPages.terminalNoMapBody')}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {other ? (
          <Button asChild iconStart="map">
            <LocaleLink href={`/${airportSlug}/map?t=${other.terminal}`}>{t('mapPages.showTerminalMap', { terminal: other.terminalLabel })}</LocaleLink>
          </Button>
        ) : null}
        {facilitiesHref ? (
          <Button asChild variant="secondary" iconStart="map-pin">
            <LocaleLink href={`${facilitiesHref}?t=${terminal}`}>{t('mapPages.openFacilities')}</LocaleLink>
          </Button>
        ) : null}
        <ExternalLink href={officialAirportUrl} variant="action">
          {t('mapPages.officialAirportPage')}
        </ExternalLink>
      </div>
    </div>
  );
}

type PendingFocus = { type: 'marker'; id: string } | { type: 'details' } | { type: 'from' } | { type: 'to' };

function writeQuery(patch: QueryPatch) {
  const search = applyQueryPatch(window.location.search, patch);
  window.history.replaceState(null, '', `${window.location.pathname}${search}${window.location.hash}`);
}

function MapWorkspace({ map, query, sources, facilitiesHref, officialMapUrl, officialAirportUrl }: MapExplorerProps & { map: MapView; query: MapQuery }) {
  const t = useT();
  const poisById = useMemo(() => new Map(map.pois.map((poi) => [poi.id, poi])), [map]);
  const levelsById = useMemo(() => new Map(map.levels.map((level) => [level.id, level])), [map]);
  const nodesById = useMemo(() => new Map(map.nodes.map((node) => [node.id, node])), [map]);
  const routing = useMemo(() => routingModel(map), [map]);
  const stepContext = useMemo(
    () => ({
      placeByNode: new Map(map.pois.map((poi) => [poi.node, poi.name])),
      levelOrder: new Map(map.levels.map((level) => [level.id, level.order])),
      edgeNotes: map.edgeNotes,
      checkpoints: new Set(map.pois.filter((poi) => CHECKPOINT_KINDS.includes(poi.kind)).map((poi) => poi.node)),
      stepFree: query.stepFree,
    }),
    [map, query.stepFree],
  );

  // `?gate=C12` (journey timeline): show the gate and make it the route's destination, then keep
  // only the standard parameters so later choices are not overridden.
  const gateId = query.gate ? gatePlaceId(map.pois, query.gate) : undefined;
  useEffect(() => {
    if (!query.gate) return;
    writeQuery(gateId ? { gate: null, poi: query.poi ?? gateId, to: query.to ?? gateId, level: null } : { gate: null });
  }, [query.gate, query.poi, query.to, gateId]);

  const selected = query.poi ? poisById.get(query.poi) : undefined;
  const from = query.from ? poisById.get(query.from) : undefined;
  const to = query.to ? poisById.get(query.to) : undefined;
  const level = (query.level ? levelsById.get(query.level) : undefined) ?? levelsById.get(selected?.level ?? from?.level ?? '') ?? map.levels[0];
  const filters = query.filters;

  const route = useMemo(
    () => (from && to && from.id !== to.id ? shortestPath(routing, from.id, to.id, { accessibleOnly: query.stepFree }) : null),
    [routing, from, to, query.stepFree],
  );
  const steps = useMemo(() => (route ? buildRouteSteps(route, stepContext) : []), [route, stepContext]);
  const minutes = route ? routeMinutes(route) : null;

  const [search, setSearch] = useState('');
  const [views, setViews] = useState<Record<string, ViewState>>({});
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [centredOn, setCentredOn] = useState<string | undefined>(undefined);
  const activeStepKey = activeStep && steps.some((step) => step.key === activeStep) ? activeStep : null;

  const bounds = useMemo(() => levelBounds(map, level.id), [map, level.id]);
  const view = views[level.id] ?? fitView(bounds);

  // A selection that arrives through the URL (deep link, back or forward) is centred once.
  if (centredOn !== selected?.id) {
    setCentredOn(selected?.id);
    if (selected) {
      const target = selected;
      setViews((current) => ({
        ...current,
        [target.level]: clampView({ k: Math.max(current[target.level]?.k ?? 1, FOCUS_ZOOM), cx: target.x, cy: target.y }, levelBounds(map, target.level)),
      }));
    }
  }

  const viewsRef = useRef(views);
  useEffect(() => {
    viewsRef.current = views;
  }, [views]);
  const animation = useRef(0);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  const changeView = useCallback(
    (levelId: string, next: ViewState, animate: boolean) => {
      cancelAnimationFrame(animation.current);
      const start = viewsRef.current[levelId] ?? fitView(levelBounds(map, levelId));
      if (!animate || prefersReducedMotion()) {
        setViews((current) => ({ ...current, [levelId]: next }));
        return;
      }
      const began = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - began) / 280);
        const eased = 1 - (1 - progress) ** 3;
        const frame: ViewState = {
          k: start.k * (next.k / start.k) ** eased,
          cx: start.cx + (next.cx - start.cx) * eased,
          cy: start.cy + (next.cy - start.cy) * eased,
        };
        setViews((current) => ({ ...current, [levelId]: frame }));
        if (progress < 1) animation.current = requestAnimationFrame(tick);
      };
      animation.current = requestAnimationFrame(tick);
    },
    [map],
  );

  // Move focus once the element it should land on has rendered.
  const pendingFocus = useRef<PendingFocus | null>(null);
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    let element: Element | null = null;
    if (target.type === 'details') element = document.getElementById(DETAILS_HEADING_ID);
    else if (target.type === 'from') element = document.getElementById(ROUTE_FROM_ID);
    else if (target.type === 'to') element = document.getElementById(ROUTE_TO_ID);
    else element = document.querySelector(`[data-poi="${CSS.escape(target.id)}"]`);
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) return;
    pendingFocus.current = null;
    if (target.type === 'marker') element.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    element.focus({ preventScroll: target.type === 'marker' });
  });

  const counts = useMemo(() => filterCounts(map.pois), [map]);
  const haystacks = useMemo(
    () =>
      new Map(
        map.pois.map((poi) => {
          const filter = MAP_FILTERS.find((item) => item.id === poi.filter);
          return [poi.id, searchText([poi.name, poi.kindLabel, filter ? t(filter.labelKey) : undefined, levelsById.get(poi.level)?.name, poi.zoneName, poi.facility?.categoryLabel])];
        }),
      ),
    [map, t, levelsById],
  );
  const results = useMemo(() => {
    const text = search.trim();
    if (!text) return [];
    return map.pois
      .map((poi) => ({ poi, score: scoreMatch(text, poi.name, haystacks.get(poi.id) ?? '') }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.poi.name.localeCompare(b.poi.name))
      .slice(0, 8)
      .map((item) => item.poi);
  }, [search, map, haystacks]);

  const filtered = useMemo(() => map.pois.filter((poi) => passesFilters(poi, filters)), [map, filters]);
  const keep = (id: string) => id === selected?.id || id === from?.id || id === to?.id;
  const onLevel = map.pois.filter((poi) => poi.level === level.id && (passesFilters(poi, filters) || keep(poi.id)));

  const { routeLines, connectors } = useMemo(() => {
    const lines: RouteLine[] = [];
    const links: RouteConnector[] = [];
    const order = (id: string) => levelsById.get(id)?.order ?? 0;
    for (const step of steps) {
      const nodes = step.nodes.map((id) => nodesById.get(id)).filter((node): node is MapNode => node !== undefined);
      let run: [number, number][] = [];
      const flush = () => {
        if (run.length > 1) lines.push({ key: `${step.key}-${lines.length}`, points: run, ride: step.kind === 'ride', active: step.key === activeStepKey });
        run = [];
      };
      for (const node of nodes) {
        if (node.level === level.id) run.push([node.x, node.y]);
        else flush();
      }
      flush();
      if (step.toLevel && step.toLevel !== step.level) {
        const up = order(step.toLevel) > order(step.level);
        const leave = [...nodes].reverse().find((node) => node.level === step.level);
        const arrive = nodes.find((node) => node.level === step.toLevel);
        if (step.level === level.id && leave) {
          links.push({ key: `${step.key}-out`, x: leave.x, y: leave.y, toLevel: step.toLevel, label: levelsById.get(step.toLevel)?.label ?? step.toLevel, direction: up ? 'up' : 'down' });
        }
        if (step.toLevel === level.id && arrive) {
          links.push({ key: `${step.key}-in`, x: arrive.x, y: arrive.y, toLevel: step.level, label: levelsById.get(step.level)?.label ?? step.level, direction: up ? 'down' : 'up' });
        }
      }
    }
    return { routeLines: lines, connectors: links };
  }, [steps, nodesById, levelsById, level.id, activeStepKey]);

  /* ----- actions ----- */

  const select = (id: string, origin: 'map' | 'search' | 'list') => {
    const poi = poisById.get(id);
    if (!poi) return;
    setCentredOn(id);
    writeQuery({ poi: id, level: poi.level });
    if (origin !== 'map') {
      const current = viewsRef.current[poi.level];
      changeView(poi.level, clampView({ k: Math.max(current?.k ?? 1, FOCUS_ZOOM), cx: poi.x, cy: poi.y }, levelBounds(map, poi.level)), poi.level === level.id);
      pendingFocus.current = origin === 'list' ? { type: 'marker', id } : { type: 'details' };
    }
  };

  const clearSelection = () => {
    setCentredOn(undefined);
    writeQuery({ poi: null });
  };

  const changeLevel = (id: string) => {
    writeQuery({ level: id });
  };

  const setFilters = (next: MapFilterId[]) => {
    writeQuery({ cat: next.length > 0 ? next.join(',') : null });
    const shown = map.pois.filter((poi) => passesFilters(poi, next)).length;
    setStatus(t.count('mapPages.list.count', shown));
  };

  const describe = (fromId: string | undefined, toId: string | undefined, stepFree: boolean): string => {
    if (!fromId || !toId) return '';
    if (fromId === toId) return t('mapPages.route.same');
    const found = shortestPath(routing, fromId, toId, { accessibleOnly: stepFree });
    if (!found) return stepFree ? t('mapPages.route.noRouteStepFree') : t('map.noRoute');
    return t('mapPages.route.found', { minutes: routeMinutes(found).standard, count: buildRouteSteps(found, stepContext).length });
  };

  const setRoute = (next: { from?: string; to?: string; stepFree?: boolean }) => {
    const fromId = 'from' in next ? next.from : from?.id;
    const toId = 'to' in next ? next.to : to?.id;
    const stepFree = next.stepFree ?? query.stepFree;
    const startLevel = fromId ? poisById.get(fromId)?.level : undefined;
    const complete = Boolean(fromId && toId && fromId !== toId);
    writeQuery({ from: fromId ?? null, to: toId ?? null, sf: stepFree ? '1' : null, ...(complete && startLevel ? { level: startLevel } : {}) });
    setActiveStep(null);
    if (complete && startLevel) changeView(startLevel, fitView(levelBounds(map, startLevel)), startLevel === level.id);
    setStatus(describe(fromId, toId, stepFree));
    if (complete) revealDrawing();
  };

  /*
   * Round 6 (review-3 9.1 item 7): on phones the From and To fields come before the drawing, so a
   * chosen route was drawn below the first screen (the drawing started at 933 px). Once a route is
   * complete the drawing is scrolled up under the header, unless it is already in full view. Focus
   * stays where it is. A keyboard user's focused field is kept in view (WCAG 2.4.7, 2.4.11): the
   * page then scrolls only as far as that allows, which still shows most of the drawing.
   */
  const drawing = useRef<HTMLDivElement>(null);
  const revealDrawing = () => {
    requestAnimationFrame(() => {
      const element = drawing.current;
      if (!element || window.matchMedia('(min-width: 64rem)').matches) return;
      const box = element.getBoundingClientRect();
      if (box.top >= 0 && box.bottom <= window.innerHeight) return;
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      const active = document.activeElement;
      const keyboard = active instanceof HTMLElement && active !== document.body && !element.contains(active) && active.matches(':focus-visible');
      if (!keyboard) {
        element.scrollIntoView({ block: 'start', behavior });
        return;
      }
      const top = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const delta = Math.min(box.top - top, box.bottom - window.innerHeight + 8, active.getBoundingClientRect().top - top);
      if (delta > 0) window.scrollBy({ top: delta, behavior });
    });
  };

  const defaultOrigin = (destination: string): string | undefined => {
    const top = map.levels[0]?.id;
    const candidates = map.pois.filter((poi) => poi.id !== destination);
    return (candidates.find((poi) => poi.level === top && poi.kind === 'entrance') ?? candidates.find((poi) => poi.kind === 'entrance') ?? candidates[0])?.id;
  };

  const routeHere = (id: string) => {
    if (from && from.id !== id) {
      setRoute({ to: id });
      return;
    }
    setRoute({ from: defaultOrigin(id), to: id });
    pendingFocus.current = { type: 'from' };
  };

  const routeFrom = (id: string) => {
    setRoute({ from: id, ...(to?.id === id ? { to: undefined } : {}) });
    if (!to || to.id === id) pendingFocus.current = { type: 'to' };
  };

  const selectStep = (step: RouteStep) => {
    const next = activeStepKey === step.key ? null : step.key;
    setActiveStep(next);
    if (!next) return;
    if (step.level !== level.id) writeQuery({ level: step.level });
    const points = step.nodes.map((id) => nodesById.get(id)).filter((node): node is MapNode => node !== undefined && node.level === step.level);
    if (points.length === 0) return;
    const xs = points.map((node) => node.x);
    const ys = points.map((node) => node.y);
    const current = viewsRef.current[step.level];
    changeView(
      step.level,
      clampView({ k: current?.k ?? 1, cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2 }, levelBounds(map, step.level)),
      step.level === level.id,
    );
  };

  const routeLevels = new Set(route?.levels ?? []);
  const unmapped = MAP_FILTERS.filter((filter) => filter.id !== 'other' && counts[filter.id] === 0);
  const searching = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-14">
      {/* Round 4 (6.1.6): on phones the order is search, From and To, the map, then the directions
          and the filters, so a chosen route is drawn just below the controls instead of 600 px
          above them. DOM order is the visual order at every width; on desktop the map stays
          sticky in the right column beside the same four blocks. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_1fr] lg:gap-x-8">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div role="search">
            <SearchField
              label={t('mapPages.search.label')}
              value={search}
              onValueChange={setSearch}
              onClear={() => setSearch('')}
              placeholder={t('mapPages.search.placeholder')}
              placeholderShort={t('mapPages.search.placeholderShort')}
            />
            <p className={searching ? 'type-body-sm mt-2 text-ink-2' : 'sr-only'} aria-live="polite">
              {searching ? (results.length > 0 ? t.count('mapPages.search.results', results.length) : t('mapPages.search.noResults', { query: search.trim() })) : ''}
            </p>
            {searching && results.length === 0 ? <p className="type-body-sm text-ink-2">{t('mapPages.search.noResultsHint')}</p> : null}
            {results.length > 0 ? (
              <ul className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
                {results.map((poi) => (
                  <li key={poi.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        select(poi.id, 'search');
                      }}
                      className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-fast hover:bg-page-subtle focus-visible:focus-ring-inset"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-page-subtle text-ink">
                        <Icon name={poi.kind} size="sm" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="type-body block font-semibold text-ink">{poi.name}</span>
                        <span className="type-body-sm block text-ink-2">
                          {poi.kindLabel} · {levelsById.get(poi.level)?.label}
                        </span>
                      </span>
                      <Icon name="chevron-right" size="sm" className="text-ink-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <RoutePlanner
            part="controls"
            map={map}
            levelsById={levelsById}
            fromId={from?.id}
            toId={to?.id}
            stepFree={query.stepFree}
            route={route}
            steps={steps}
            minutes={minutes}
            activeStep={activeStepKey}
            onFromChange={(id) => setRoute({ from: id })}
            onToChange={(id) => setRoute({ to: id })}
            onSwap={() => setRoute({ from: to?.id, to: from?.id })}
            onStepFreeChange={(value) => setRoute({ stepFree: value })}
            onClear={() => {
              writeQuery({ from: null, to: null });
              setActiveStep(null);
              setStatus('');
            }}
            onStepSelect={selectStep}
          />
        </div>

        <div className="min-w-0 lg:sticky lg:top-[calc(var(--spacing-sticky)+1rem)] lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-start">
          <SegmentedControl
            label={t('mapPages.levels.label')}
            value={level.id}
            onValueChange={changeLevel}
            block
            stackOnPhone
            options={map.levels.map((item) => ({
              value: item.id,
              label: item.label,
              hint: item.hint,
              icon: routeLevels.has(item.id) ? 'route' : 'layers',
            }))}
          />
          {level.note ? <p className="type-body-sm mt-2 flex gap-2 text-ink-2"><Icon name="info" size="sm" className="mt-0.5" />{level.note}</p> : null}
          <div ref={drawing} className="mt-3">
            <MapCanvas
              map={map}
              level={level}
              pois={onLevel}
              selectedId={selected?.id}
              fromId={route ? from?.id : undefined}
              toId={route ? to?.id : undefined}
              routeLines={routeLines}
              connectors={connectors}
              stepActive={activeStepKey !== null}
              view={view}
              bounds={bounds}
              onViewChange={(next, animate) => changeView(level.id, next, animate)}
              onSelect={(id) => select(id, 'map')}
              onLevelChange={changeLevel}
              onEscape={clearSelection}
            />
          </div>
          <MapLegend showRoute={Boolean(route)} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 empty:hidden lg:col-start-1 lg:row-start-3">
          {selected ? (
            <PlaceDetails
              poi={selected}
              level={levelsById.get(selected.level)}
              sources={sources}
              facilitiesHref={facilitiesHref}
              isDestination={to?.id === selected.id}
              isStart={from?.id === selected.id}
              onClose={clearSelection}
              onRouteHere={() => routeHere(selected.id)}
              onRouteFrom={() => routeFrom(selected.id)}
            />
          ) : null}
          <RoutePlanner
            part="result"
            map={map}
            levelsById={levelsById}
            fromId={from?.id}
            toId={to?.id}
            stepFree={query.stepFree}
            route={route}
            steps={steps}
            minutes={minutes}
            activeStep={activeStepKey}
            onFromChange={(id) => setRoute({ from: id })}
            onToChange={(id) => setRoute({ to: id })}
            onSwap={() => setRoute({ from: to?.id, to: from?.id })}
            onStepFreeChange={(value) => setRoute({ stepFree: value })}
            onClear={() => {
              writeQuery({ from: null, to: null });
              setActiveStep(null);
              setStatus('');
            }}
            onStepSelect={selectStep}
          />
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-4">
          <div role="group" aria-labelledby="map-filters-label">
            <p id="map-filters-label" className="type-body-sm mb-2 font-semibold text-ink">
              {t('mapPages.filters.label')}
            </p>
            <div className="flex flex-wrap gap-2">
              {MAP_FILTERS.filter((filter) => counts[filter.id] > 0).map((filter) => (
                <FilterChip
                  key={filter.id}
                  icon={filter.icon}
                  count={counts[filter.id]}
                  pressed={filters.includes(filter.id)}
                  onPressedChange={(pressed) => setFilters(pressed ? [...filters, filter.id] : filters.filter((id) => id !== filter.id))}
                >
                  {t(filter.labelKey)}
                </FilterChip>
              ))}
              {filters.length > 0 ? (
                <Button variant="quiet" size="sm" iconStart="x" onClick={() => setFilters([])}>
                  {t('mapPages.filters.showAll')}
                </Button>
              ) : null}
            </div>
            {unmapped.length > 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-line-strong p-3">
                <p className="type-body-sm text-ink-2">{t('mapPages.filters.notMapped')}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {unmapped.map((filter) => (
                    <li key={filter.id} className="type-caption inline-flex items-center gap-1 rounded-sm bg-page-subtle px-2 py-1 text-ink-2">
                      <Icon name="circle-dashed" size="xs" />
                      {t(filter.labelKey)}
                    </li>
                  ))}
                </ul>
                {facilitiesHref ? (
                  <LocaleLink href={facilitiesHref} className="link-action type-body-sm mt-1">
                    {t('mapPages.filters.notMappedLink')}
                  </LocaleLink>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      <PlaceList
        levels={map.levels}
        pois={filtered}
        total={map.pois.length}
        filters={filters}
        selectedId={selected?.id}
        onShow={(id) => select(id, 'list')}
        onRouteHere={routeHere}
        onClearFilters={() => setFilters([])}
      />

      <section aria-labelledby="map-about-title" className="grid gap-8 border-t border-line pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <h2 id="map-about-title" className="type-title-lg text-ink">
            {t('mapPages.about.title')}
          </h2>
          <p className="type-body mt-3 max-w-reading text-ink-2">{map.note}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            {officialMapUrl ? (
              <ExternalLink href={officialMapUrl} variant="action">
                {t('mapPages.officialMap')}
              </ExternalLink>
            ) : null}
            <ExternalLink href={officialAirportUrl} variant="action">
              {t('mapPages.officialAirportPage')}
            </ExternalLink>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6">
            <SourceNote sources={sourcesFor(map.sourceIds, sources)} />
            {map.asOf ? <AsOf value={map.asOf} /> : null}
          </div>
        </div>
        <ProvenanceLegend kinds={['official', 'estimated', 'demo']} />
      </section>
    </div>
  );
}
