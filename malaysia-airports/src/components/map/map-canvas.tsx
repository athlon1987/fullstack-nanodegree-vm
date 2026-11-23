'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useHydrated } from '@/lib/hooks/use-store';
import { useT } from '@/lib/i18n/client';
import { MAP_ROUTE_STRIP_SCRIPT } from '@/lib/inline-scripts';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import {
  DEFAULT_FRAME,
  MAX_ZOOM,
  MIN_ZOOM,
  fitView,
  panByPixels,
  placeLabels,
  segmentHitsBox,
  viewBoxFor,
  zoomAround,
  type Bounds,
  type FrameSize,
  type LabelCandidate,
  type LabelSide,
  type LevelView,
  type MapView,
  type PoiView,
  type Segment,
  type ViewState,
} from './map-logic';

export interface RouteLine {
  key: string;
  points: [number, number][];
  ride: boolean;
  active: boolean;
}

export interface RouteConnector {
  key: string;
  x: number;
  y: number;
  toLevel: string;
  label: string;
  direction: 'up' | 'down';
}

export interface MapCanvasProps {
  map: MapView;
  level: LevelView;
  /** Points drawn on this level (filters already applied). */
  pois: readonly PoiView[];
  selectedId?: string;
  fromId?: string;
  toId?: string;
  routeLines: readonly RouteLine[];
  connectors: readonly RouteConnector[];
  /** Whether a route step is highlighted (dims the rest of the line). */
  stepActive: boolean;
  view: ViewState;
  bounds: Bounds;
  onViewChange: (next: ViewState, animate: boolean) => void;
  onSelect: (id: string) => void;
  onLevelChange: (id: string) => void;
  onEscape: () => void;
  /**
   * Controls for the card's top bar beside the disclaimer (the level tabs). Polish
   * (critique-redesign2 item 4): the tabs sit in the canvas's own bar, so the drawing starts higher.
   */
  toolbar?: ReactNode;
  /** The drawing's size in pixels, whenever it changes (the explorer frames each level's first view for it). */
  onFrameChange?: (frame: FrameSize) => void;
}

/** Labels win space in this order (higher first). */
const KIND_PRIORITY: Partial<Record<PoiView['kind'], number>> = {
  gate: 9,
  train: 8,
  'check-in': 7,
  'baggage-reclaim': 7,
  lounge: 6,
  'prayer-room': 6,
  security: 6,
  immigration: 6,
  customs: 5,
  'calm-room': 5,
  information: 5,
  bus: 5,
  hotel: 5,
  'meeting-point': 5,
  entrance: 4,
  toilet: 4,
  parking: 4,
  other: 4,
};

const ZONE_FILL = {
  landside: 'fill-surface stroke-line-strong',
  airside: 'fill-primary-soft stroke-line-strong',
  link: 'fill-page-subtle stroke-line-control',
} as const;

/** Rounded estimate of label width in pixels for the 12.5 px semibold label face. */
const CHAR_WIDTH = 6.9;
const ZONE_CHAR_WIDTH = 7.2;

/**
 * The drawn map: zones, corridors, markers, labels and the route, with zoom and pan by buttons,
 * keyboard (arrow keys, plus, minus, zero), mouse drag and Ctrl or Cmd with the scroll wheel.
 * Markers are real buttons; the list of places under the map offers the same choices as text.
 */
export function MapCanvas({
  map,
  level,
  pois,
  selectedId,
  fromId,
  toId,
  routeLines,
  connectors,
  stepActive,
  view,
  bounds,
  onViewChange,
  onSelect,
  onLevelChange,
  onEscape,
  toolbar,
  onFrameChange,
}: MapCanvasProps) {
  const t = useT();
  // Closing fix: false in the server HTML and while hydrating (the strip's placeholder), true after.
  const hydrated = useHydrated();
  const instructionsId = useId();
  const patternId = `map${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [frame, setFrame] = useState<FrameSize>(DEFAULT_FRAME);
  const [hot, setHot] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointer: number; x: number; y: number; view: ViewState; moved: boolean } | null>(null);
  const frameChange = useRef(onFrameChange);
  useEffect(() => {
    frameChange.current = onFrameChange;
  });

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setFrame({ width, height });
        frameChange.current?.({ width, height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const box = viewBoxFor(view, bounds, frame);
  const u = 1 / box.scale;
  const radius = frame.width < 520 ? 12 : 15;
  const iconSize = radius === 12 ? 14 : 16;

  // Ctrl or Cmd + wheel (and trackpad pinch) zooms around the pointer; a plain wheel scrolls the page.
  const latest = useRef({ view, bounds, box, onViewChange });
  useEffect(() => {
    latest.current = { view, bounds, box, onViewChange };
  });
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const { view: current, bounds: currentBounds, box: currentBox, onViewChange: change } = latest.current;
      const rect = svg.getBoundingClientRect();
      const anchor = { x: currentBox.x + (event.clientX - rect.left) / currentBox.scale, y: currentBox.y + (event.clientY - rect.top) / currentBox.scale };
      change(zoomAround(current, Math.exp(-event.deltaY * 0.01), anchor, currentBounds), false);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  // The route in screen pixels: labels keep off it (critique-redesign2 item 5, V6 item 4).
  const segments = useMemo(() => {
    const out: Segment[] = [];
    for (const line of routeLines) {
      for (let index = 1; index < line.points.length; index++) {
        const [ax, ay] = line.points[index - 1];
        const [bx, by] = line.points[index];
        out.push([(ax - box.x) * box.scale, (ay - box.y) * box.scale, (bx - box.x) * box.scale, (by - box.y) * box.scale]);
      }
    }
    return out;
  }, [routeLines, box.x, box.y, box.scale]);

  const zoneLabels = useMemo(() => {
    const out: { id: string; x: number; y: number; anchor: 'start' | 'middle'; text: string; screen: { x1: number; y1: number; x2: number; y2: number } }[] = [];
    for (const zone of map.zones) {
      if (zone.level !== level.id) continue;
      const width = zone.name.length * ZONE_CHAR_WIDTH + 8;
      if (zone.shape.type === 'rect') {
        const sw = zone.shape.width * box.scale;
        const sh = zone.shape.height * box.scale;
        if (sw < width + 24 || sh < 30) continue;
        const sx = (zone.shape.x - box.x) * box.scale + 12;
        const sy = (zone.shape.y - box.y) * box.scale + 20;
        out.push({ id: zone.id, x: zone.shape.x + 12 / box.scale, y: zone.shape.y + 20 / box.scale, anchor: 'start', text: zone.name, screen: { x1: sx, y1: sy - 12, x2: sx + width, y2: sy + 4 } });
      } else {
        const xs = zone.shape.points.map(([x]) => x);
        const ys = zone.shape.points.map(([, y]) => y);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const top = Math.min(...ys);
        const sx = (cx - box.x) * box.scale;
        const sy = (top - box.y) * box.scale - 10;
        if (sy < 40) continue;
        out.push({ id: zone.id, x: cx, y: top - 10 / box.scale, anchor: 'middle', text: zone.name, screen: { x1: sx - width / 2, y1: sy - 12, x2: sx + width / 2, y2: sy + 4 } });
      }
    }
    const markers = pois.map((poi) => {
      const x = (poi.x - box.x) * box.scale;
      const y = (poi.y - box.y) * box.scale;
      return { x1: x - radius - 4, y1: y - radius - 4, x2: x + radius + 4, y2: y + radius + 4 };
    });
    return out.filter(
      (label) =>
        !markers.some((m) => label.screen.x1 < m.x2 && m.x1 < label.screen.x2 && label.screen.y1 < m.y2 && m.y1 < label.screen.y2) &&
        !segments.some((segment) => segmentHitsBox(segment, { x1: label.screen.x1 - 6, y1: label.screen.y1 - 6, x2: label.screen.x2 + 6, y2: label.screen.y2 + 6 })),
    );
  }, [map.zones, level.id, box.scale, box.x, box.y, pois, radius, segments]);

  const labelSides = useMemo(() => {
    const candidates: LabelCandidate[] = pois.map((poi) => {
      const screen = { x: (poi.x - box.x) * box.scale, y: (poi.y - box.y) * box.scale };
      let priority = KIND_PRIORITY[poi.kind] ?? 2;
      if (poi.id === hot) priority = 80;
      if (poi.id === fromId || poi.id === toId) priority = 90;
      if (poi.id === selectedId) priority = 100;
      return { id: poi.id, x: screen.x, y: screen.y, text: poi.short, priority };
    });
    // Redesign three: no reserved corner any more (it kept labels out of the top 56 px for level
    // chips that moved into the card's top bar in the polish), and the route is an obstacle.
    const reserved = zoneLabels.map((label) => label.screen);
    return placeLabels(candidates, frame, { radius: radius + 2, charWidth: CHAR_WIDTH, reserved, segments, segmentPad: 9 });
  }, [pois, box.x, box.y, box.scale, frame, hot, fromId, toId, selectedId, zoneLabels, radius, segments]);

  const corridors = useMemo(() => {
    const nodes = new Map(map.nodes.map((node) => [node.id, node]));
    let d = '';
    for (const edge of map.edges) {
      const a = nodes.get(edge.from);
      const b = nodes.get(edge.to);
      if (a && b && a.level === level.id && b.level === level.id && edge.kind === 'walk') d += `M${a.x} ${a.y}L${b.x} ${b.y}`;
    }
    return d;
  }, [map.nodes, map.edges, level.id]);

  const pan = (dx: number, dy: number) => onViewChange(panByPixels(view, dx, dy, box.scale, bounds), true);
  const zoom = (factor: number) => onViewChange(zoomAround(view, factor, { x: view.cx, y: view.cy }, bounds), true);
  const reset = () => onViewChange(fitView(bounds, frame), true);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const step = event.shiftKey ? 0.4 : 0.18;
    const actions: Record<string, () => void> = {
      ArrowUp: () => pan(0, -frame.height * step),
      ArrowDown: () => pan(0, frame.height * step),
      ArrowLeft: () => pan(-frame.width * step, 0),
      ArrowRight: () => pan(frame.width * step, 0),
      '+': () => zoom(1.5),
      '=': () => zoom(1.5),
      '-': () => zoom(1 / 1.5),
      _: () => zoom(1 / 1.5),
      '0': reset,
      Escape: onEscape,
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, view, moved: false };
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      current.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    onViewChange(panByPixels(current.view, -dx, -dy, box.scale, bounds), false);
  };
  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  const markerLabel = (poi: PoiView) => {
    const base = t('mapPages.canvas.marker', { name: poi.name, kind: poi.kindLabel, level: level.name });
    if (poi.id === fromId) return `${t('mapPages.canvas.markerStart')}: ${base}`;
    if (poi.id === toId) return `${t('mapPages.canvas.markerEnd')}: ${base}`;
    return base;
  };

  const ordered = [...pois].sort((a, b) => rank(a.id) - rank(b.id));
  function rank(id: string): number {
    if (id === selectedId) return 4;
    if (id === toId) return 3;
    if (id === fromId) return 2;
    if (id === hot) return 1;
    return 0;
  }

  return (
    <div className={cn('grid grid-cols-1 overflow-hidden rounded-3xl border border-line bg-surface shadow-md', toolbar && 'sm:grid-cols-[auto_minmax(0,1fr)]')}>
      {/* Round 4 (6.1.6): the disclaimer is a strip above the drawing, not an overlay on it, so no
          level chip, pin or label can ever cover it (on phones the "To Gates" chip did).
          Redesign stage two: a quiet chip in the card's top bar, the same words. */}
      {/* Polish (critique-redesign2 item 4): the level tabs sit in the card's own top bar, beside the
          disclaimer from 640 px (above it on a phone), so the drawing starts higher. The disclaimer
          stays a strip of its own above the drawing. */}
      {toolbar ? <div className="min-w-0 px-3 pt-2.5 sm:pb-2.5">{toolbar}</div> : null}
      <p
        data-map-disclaimer=""
        className={cn(
          'type-caption mx-3 my-2.5 inline-flex items-center gap-1.5 self-center justify-self-start rounded-pill bg-fill px-3 py-1 font-medium text-ink-2',
          toolbar && 'sm:justify-self-end',
        )}
      >
          <Icon name="flask-conical" size="xs" strokeWidth={2} className="shrink-0" />
          {t('mapPages.schematicLabel')}
        </p>
      <div
        ref={frameRef}
        onKeyDown={onKeyDown}
        className={cn(
          'relative col-span-full aspect-[5/4] w-full overflow-hidden border-t border-line bg-surface-sunken sm:aspect-[16/10] lg:aspect-auto lg:h-[min(calc(100dvh-30rem),42rem)] lg:min-h-[24rem]',
          'has-[[data-map-surface]:focus-visible]:focus-ring-inset',
        )}
      >
        {/* Closing fix (VA6 item 5): the skip link comes before the drawing, where it skips the
            places on it (each a button) and the controls, and shows over the drawing's corner when
            it has focus, like the site's own skip link. It was the first item of the bar under the
            drawing, after every marker, and its own row on a phone pushed the zoom and pan buttons
            half under the phone bar. */}
        <a
          href="#map-places"
          onKeyDown={(event) => event.stopPropagation()}
          className="type-body-sm sr-only rounded-pill bg-ink px-4 py-2.5 font-semibold text-page shadow-lg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus-visible:focus-ring"
        >
          {t('mapPages.canvas.skipToList')}
        </a>
        <p id={instructionsId} className="sr-only">
          {t('mapPages.canvas.instructions')}
        </p>
        <svg
          ref={svgRef}
          data-map-surface=""
          role="group"
          aria-label={t('mapPages.canvas.label', { level: level.name })}
          aria-describedby={instructionsId}
          tabIndex={0}
          viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={(event) => {
            if ((event.target as Element).closest('[data-poi]')) return;
            const rect = event.currentTarget.getBoundingClientRect();
            onViewChange(zoomAround(view, 1.6, { x: box.x + (event.clientX - rect.left) / box.scale, y: box.y + (event.clientY - rect.top) / box.scale }, bounds), true);
          }}
          className={cn('absolute inset-0 size-full touch-manipulation outline-none select-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        >
          <defs>
            <pattern id={`${patternId}-dots`} width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" className="fill-line-strong" />
            </pattern>
            <pattern id={`${patternId}-hatch`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="12" className="stroke-primary-ink" strokeWidth="1.5" strokeOpacity="0.14" />
            </pattern>
          </defs>
          <rect x={-2000} y={-2000} width={5000} height={4600} fill={`url(#${patternId}-dots)`} opacity={0.55} />

          <g aria-hidden="true">
            {map.zones
              .filter((zone) => zone.level === level.id)
              .map((zone) => {
                const shared = {
                  className: ZONE_FILL[zone.tone],
                  strokeWidth: 1.25,
                  vectorEffect: 'non-scaling-stroke' as const,
                  strokeDasharray: zone.tone === 'link' ? '5 4' : undefined,
                };
                return (
                  <g key={zone.id}>
                    {zone.shape.type === 'rect' ? (
                      <>
                        <rect x={zone.shape.x} y={zone.shape.y} width={zone.shape.width} height={zone.shape.height} rx={16} {...shared} />
                        {zone.tone === 'airside' ? <rect x={zone.shape.x} y={zone.shape.y} width={zone.shape.width} height={zone.shape.height} rx={16} fill={`url(#${patternId}-hatch)`} /> : null}
                      </>
                    ) : (
                      <>
                        <polygon points={zone.shape.points.map(([x, y]) => `${x},${y}`).join(' ')} strokeLinejoin="round" {...shared} />
                        {zone.tone === 'airside' ? <polygon points={zone.shape.points.map(([x, y]) => `${x},${y}`).join(' ')} fill={`url(#${patternId}-hatch)`} /> : null}
                      </>
                    )}
                  </g>
                );
              })}
            <path d={corridors} className="fill-none stroke-line-strong" strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {zoneLabels.map((label) => (
              <text
                key={label.id}
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                fontSize={10.5 * u}
                letterSpacing={0.9 * u}
                className="fill-ink-2 font-sans font-semibold uppercase"
              >
                {label.text}
              </text>
            ))}
          </g>

          <g aria-hidden="true">
            {routeLines.map((line) => {
              const points = line.points.map(([x, y]) => `${x},${y}`).join(' ');
              const dim = stepActive && !line.active;
              return (
                <g key={line.key} className={cn('animate-fade-in transition-opacity duration-base', dim && 'opacity-35')}>
                  <polyline points={points} className="fill-none stroke-surface" strokeWidth={line.active ? 16 : 13} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <polyline
                    points={points}
                    className="fill-none stroke-primary"
                    strokeWidth={line.active ? 9 : 6.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={line.ride ? '0.1 11' : undefined}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </g>

          <g>
            {ordered.map((poi) => {
              const selected = poi.id === selectedId;
              const isEnd = poi.id === toId;
              const isStart = poi.id === fromId;
              const emphasised = selected || isEnd || isStart;
              const side = labelSides.get(poi.id);
              return (
                <g
                  key={poi.id}
                  data-poi={poi.id}
                  role="button"
                  tabIndex={0}
                  aria-label={markerLabel(poi)}
                  aria-pressed={selected}
                  transform={`translate(${poi.x} ${poi.y}) scale(${u})`}
                  className="group/marker cursor-pointer outline-none"
                  onClick={() => {
                    if (!drag.current?.moved) onSelect(poi.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(poi.id);
                    }
                  }}
                  onPointerEnter={() => setHot(poi.id)}
                  onPointerLeave={() => setHot((current) => (current === poi.id ? null : current))}
                  onFocus={() => setHot(poi.id)}
                  onBlur={() => setHot((current) => (current === poi.id ? null : current))}
                >
                  <Marker poi={poi} radius={radius} iconSize={iconSize} variant={isEnd ? 'end' : isStart ? 'start' : selected ? 'selected' : 'default'} />
                  {side ? <MarkerLabel text={poi.short} side={side} radius={radius} strong={emphasised} /> : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Closing fix (VA6 item 5): the pan and zoom buttons are the bar's only row. On a phone they
          share the card's width (seven 44 px buttons, no divider), so at 390 x 844 they sit at y
          715 to 759, clear of the phone bar from y 785 (they were at 765 to 809, half under it). */}
      <div className="col-span-full flex flex-wrap items-center justify-end border-t border-line bg-surface px-2 py-2 sm:px-3">
        <div role="group" aria-label={t('mapPages.canvas.controls')} className="flex flex-wrap items-center justify-center gap-0.5 rounded-2xl bg-page-subtle p-1 max-sm:w-full max-sm:justify-between">
          <IconButton size="sm" icon="arrow-left" label={t('mapPages.canvas.panLeft')} onClick={() => pan(-frame.width * 0.25, 0)} />
          <IconButton size="sm" icon="arrow-up" label={t('mapPages.canvas.panUp')} onClick={() => pan(0, -frame.height * 0.25)} />
          <IconButton size="sm" icon="arrow-down" label={t('mapPages.canvas.panDown')} onClick={() => pan(0, frame.height * 0.25)} />
          <IconButton size="sm" icon="arrow-right" label={t('mapPages.canvas.panRight')} onClick={() => pan(frame.width * 0.25, 0)} />
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-line max-sm:hidden" />
          <IconButton size="sm" icon="zoom-out" label={t('map.zoomOut')} onClick={() => zoom(1 / 1.6)} disabled={view.k <= MIN_ZOOM + 0.001} />
          <IconButton size="sm" icon="zoom-in" label={t('map.zoomIn')} onClick={() => zoom(1.6)} disabled={view.k >= MAX_ZOOM - 0.001} />
          <IconButton size="sm" icon="locate-fixed" label={t('map.resetView')} onClick={reset} />
        </div>
      </div>
      {/* Polish (critique-redesign2 item 4): the strip now closes the card, under the drawing: a deep
          link's route arrives after hydration, and the strip appearing above the drawing moved the
          whole drawing down by 53 px on the first screen (CLS 0.24 at 1440 x 900).
          Round 6 (review-3 9.1 item 7): where the route changes level, as buttons in a strip
          (it was above the drawing). Floating over the drawing, the "To Gates" chip covered the
          "Immigration and security" label (and "To Level 3" a check-in row): no chip is drawn
          over a place or its label any more. */}
      {connectors.length > 0 ? (
        <div data-route-connectors="" className={STRIP_CLASSES}>
          {/* Closing fix: on a phone the words take their own line and the buttons the next, so
              on the first 390 x 844 screen no button is cut by the phone bar (the strip starts
              just above it; the buttons begin under it, in full, and come into view on scrolling). */}
          <span className={STRIP_LABEL_CLASSES}>{t('mapPages.canvas.continues')}</span>
          {connectors.map((connector) => (
            <button key={connector.key} type="button" onClick={() => onLevelChange(connector.toLevel)} className={STRIP_BUTTON_CLASSES}>
              <Icon name={connector.direction === 'up' ? 'arrow-up' : 'arrow-down'} size="xs" strokeWidth={2.25} />
              {t('mapPages.canvas.toLevel', { level: connector.label })}
            </button>
          ))}
        </div>
      ) : !hydrated ? (
        <>
          {/* Closing fix: the strip's room, held from the first paint when the address has a route
              that will show it (the script decides; see `MAP_ROUTE_STRIP_SCRIPT`). The same
              classes and one invisible button, so it is exactly the strip's height; hidden in the
              HTML, and gone once hydrated, when the strip itself takes its place. */}
          <div
            data-route-strip-placeholder=""
            data-terminal={map.terminal}
            data-levels={JSON.stringify(Object.fromEntries(map.pois.map((poi) => [poi.id, poi.level])))}
            hidden
            aria-hidden="true"
            suppressHydrationWarning
            className={cn(STRIP_CLASSES, '[&>*]:invisible')}
          >
            <span className={STRIP_LABEL_CLASSES}>{t('mapPages.canvas.continues')}</span>
            <span className={STRIP_BUTTON_CLASSES}>
              <Icon name="arrow-down" size="xs" strokeWidth={2.25} />
              {t('mapPages.canvas.toLevel', { level: map.levels[0]?.label ?? '' })}
            </span>
          </div>
          <script
            suppressHydrationWarning
            type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
            dangerouslySetInnerHTML={{ __html: MAP_ROUTE_STRIP_SCRIPT }}
          />
        </>
      ) : null}
    </div>
  );
}

/** The "route continues" strip, its words and its buttons (shared with its placeholder). */
const STRIP_CLASSES = 'col-span-full flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line bg-surface px-4 py-2.5';
const STRIP_LABEL_CLASSES = 'type-body-sm text-ink-2 max-sm:w-full';
const STRIP_BUTTON_CLASSES =
  'type-caption inline-flex min-h-8 items-center gap-1 rounded-pill bg-primary px-3 font-semibold whitespace-nowrap text-on-primary shadow-sm hover:bg-primary-hover focus-visible:focus-ring touch:min-h-11';

function Marker({ poi, radius, iconSize, variant }: { poi: PoiView; radius: number; iconSize: number; variant: 'default' | 'selected' | 'start' | 'end' }) {
  const illustrative = poi.provenance === 'demo';
  if (variant === 'end') {
    const r = radius + 2;
    const cy = -(r + 10);
    return (
      <>
        <circle cy={cy} r={r + 7} className="fill-none stroke-focus opacity-0 group-focus-visible/marker:opacity-100" strokeWidth={3} />
        <path
          d={`M0 0 C${-r * 0.35} ${-r * 0.6} ${-r} ${cy + r * 0.55} ${-r} ${cy} A${r} ${r} 0 1 1 ${r} ${cy} C${r} ${cy + r * 0.55} ${r * 0.35} ${-r * 0.6} 0 0 Z`}
          className="fill-primary stroke-surface"
          strokeWidth={2}
        />
        <g transform={`translate(${-iconSize / 2} ${cy - iconSize / 2})`}>
          <Icon name={poi.kind} className="text-on-primary" width={iconSize} height={iconSize} style={{ width: iconSize, height: iconSize }} strokeWidth={2} />
        </g>
      </>
    );
  }
  const strong = variant === 'selected' || variant === 'start';
  return (
    <>
      <circle r={radius + 7} className="fill-none stroke-focus opacity-0 group-focus-visible/marker:opacity-100" strokeWidth={3} />
      {strong ? <circle r={radius + 6} className="fill-ink/15" /> : null}
      <circle
        r={strong ? radius + 1 : radius}
        className={cn(
          'transition-[stroke-width] duration-fast',
          strong ? 'fill-ink stroke-surface' : 'fill-surface stroke-ink group-hover/marker:stroke-primary',
          variant === 'start' && 'stroke-leaf',
        )}
        strokeWidth={strong ? 2.5 : 1.5}
        strokeDasharray={!strong && illustrative ? '3 2.4' : undefined}
      />
      <g transform={`translate(${-iconSize / 2} ${-iconSize / 2})`}>
        <Icon name={poi.kind} className={strong ? 'text-page' : 'text-ink'} width={iconSize} height={iconSize} style={{ width: iconSize, height: iconSize }} strokeWidth={1.75} />
      </g>
    </>
  );
}

function MarkerLabel({ text, side, radius, strong }: { text: string; side: LabelSide; radius: number; strong: boolean }) {
  const gap = radius + 6;
  const position: Record<LabelSide, { x: number; y: number; anchor: 'start' | 'end' | 'middle' }> = {
    right: { x: gap, y: 4.5, anchor: 'start' },
    left: { x: -gap, y: 4.5, anchor: 'end' },
    below: { x: 0, y: radius + 15, anchor: 'middle' },
    above: { x: 0, y: -radius - 7, anchor: 'middle' },
  };
  const { x, y, anchor } = position[side];
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={12.5}
      strokeWidth={4}
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('fill-ink stroke-surface font-sans [paint-order:stroke]', strong ? 'font-bold' : 'font-semibold')}
    >
      {text}
    </text>
  );
}
