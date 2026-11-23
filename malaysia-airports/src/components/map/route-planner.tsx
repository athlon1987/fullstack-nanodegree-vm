'use client';

import type { ReactNode } from 'react';
import type { PathResult, WalkProfile } from '@/lib/map';
import { formatDistance, formatDuration, formatList } from '@/lib/format';
import { cn } from '@/lib/cn';
import { MAP_ROUTE_NAMES_SCRIPT } from '@/lib/inline-scripts-map';
import { useLang, useT } from '@/lib/i18n/client';
import type { Translator } from '@/lib/i18n/translate';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Badge } from '@/components/ui/badge';
import { Callout } from '@/components/ui/callout';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconKey, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Field, controlClasses } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { placeOptionLabels, type LevelView, type MapView, type RouteStep } from './map-logic';

export const ROUTE_FROM_ID = 'map-route-from';
export const ROUTE_TO_ID = 'map-route-to';

export interface RoutePlannerProps {
  /**
   * `controls`: the heading, From, To, step-free and the clear button. `result`: the time, the
   * step-free answer and the written steps (nothing until there is a route). `all`: both in one
   * card. Round 4 (6.1.6): the map puts the controls above the drawing and the steps below it.
   */
  part?: 'all' | 'controls' | 'result';
  map: MapView;
  levelsById: ReadonlyMap<string, LevelView>;
  fromId?: string;
  toId?: string;
  stepFree: boolean;
  route: PathResult | null;
  steps: readonly RouteStep[];
  minutes: Record<WalkProfile, number> | null;
  activeStep: string | null;
  onFromChange: (id: string | undefined) => void;
  onToChange: (id: string | undefined) => void;
  onSwap: () => void;
  onStepFreeChange: (value: boolean) => void;
  onClear: () => void;
  onStepSelect: (step: RouteStep) => void;
}

/** Words for one step of the directions. */
export function stepInstruction(step: RouteStep, t: Translator, levels: ReadonlyMap<string, LevelView>): string {
  const place = step.place ?? '';
  const levelName = (id: string | undefined) => (id ? (levels.get(id)?.name ?? id) : '');
  switch (step.kind) {
    case 'start':
      return t('mapPages.route.steps.start', { place });
    case 'arrive':
      return t('mapPages.route.steps.arrive', { place });
    case 'walk':
      if (step.place) return t('mapPages.route.steps.walkTo', { place });
      if (step.approach === 'lift') return t('mapPages.route.steps.toLift');
      if (step.approach === 'escalator') return t('mapPages.route.steps.toEscalator');
      if (step.approach === 'stairs') return t('mapPages.route.steps.toStairs');
      return t('mapPages.route.steps.walkOn');
    case 'through':
    case 'checkpoint': {
      // A checkpoint step names the control ("Go through Customs"); a level change names the
      // level and where it leads, and says how to keep it step-free (C-08).
      if (step.kind === 'checkpoint' && !step.toLevel) return t('mapPages.route.steps.goThrough', { place });
      const level = levelName(step.toLevel);
      const up = step.levelDirection === 'up';
      const base = step.place
        ? t(up ? 'mapPages.route.steps.levelUpTo' : 'mapPages.route.steps.levelDownTo', { level, place })
        : t(up ? 'mapPages.route.steps.levelUp' : 'mapPages.route.steps.levelDown', { level });
      return step.stepFree ? `${base} ${t('mapPages.route.steps.stepFreeLevel')}` : base;
    }
    case 'change-level': {
      const level = levelName(step.toLevel);
      const up = step.direction === 'up';
      if (step.conveyance === 'escalator') return t(up ? 'mapPages.route.steps.escalatorUp' : 'mapPages.route.steps.escalatorDown', { level });
      if (step.conveyance === 'stairs') return t(up ? 'mapPages.route.steps.stairsUp' : 'mapPages.route.steps.stairsDown', { level });
      return t(up ? 'mapPages.route.steps.liftUp' : 'mapPages.route.steps.liftDown', { level });
    }
    case 'ride': {
      const target = step.place ?? levelName(step.toLevel ?? step.level);
      if (step.conveyance === 'bus') return t('mapPages.route.steps.bus', { place: target });
      if (step.conveyance === 'travelator') return t('mapPages.route.steps.travelator', { place: target });
      return t('mapPages.route.steps.train', { place: target });
    }
  }
}

function stepIcon(step: RouteStep): IconKey {
  if (step.kind === 'start') return 'circle-dot';
  if (step.kind === 'arrive') return 'map-pin';
  if (step.kind === 'change-level') return step.conveyance === 'lift' ? 'move-vertical' : 'chevrons-up-down';
  if (step.kind === 'through') return step.stepFree ? 'move-vertical' : 'chevrons-up-down';
  if (step.kind === 'checkpoint') return 'id-card';
  if (step.kind === 'ride') return step.conveyance === 'bus' ? 'bus-front' : 'tram-front';
  return 'footprints';
}

const wholeMinutes = (value: number) => Math.max(1, Math.ceil(value - 1e-9));

/**
 * Directions between two places: the form, the estimate at both walking paces and the written
 * steps, which are the primary way to follow a route (the line on the map illustrates them).
 */
export function RoutePlanner({
  part = 'all',
  map,
  levelsById,
  fromId,
  toId,
  stepFree,
  route,
  steps,
  minutes,
  activeStep,
  onFromChange,
  onToChange,
  onSwap,
  onStepFreeChange,
  onClear,
  onStepSelect,
}: RoutePlannerProps) {
  const t = useT();
  const lang = useLang();
  const both = Boolean(fromId && toId);
  const same = both && fromId === toId;

  // Unique per map: "Aerotrain station (Satellite Building) · Gates", not two "Aerotrain station" (C-09).
  const labels = placeOptionLabels(map);
  const options = map.levels.map((level) => (
    <optgroup key={level.id} label={level.name}>
      {map.pois
        .filter((poi) => poi.level === level.id)
        .map((poi) => (
          <option key={poi.id} value={poi.id}>
            {labels.get(poi.id)}
          </option>
        ))}
    </optgroup>
  ));

  const levelPath = route ? route.levels.map((id) => levelsById.get(id)?.label ?? id) : [];

  // Redesign stage two: the route panel is an app-like tool (28 px corners, a deeper shadow).
  const card = 'rounded-3xl border border-line bg-surface p-5 shadow-md sm:p-6';
  const result =
    route && minutes ? (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-page-subtle p-4">
            <p className="type-body-sm text-ink-2">{t('mapPages.route.standard')}</p>
            <p className="type-title-lg tabular mt-1 text-ink">{t('mapPages.route.minutes', { minutes: minutes.standard })}</p>
          </div>
          <div className="rounded-2xl bg-page-subtle p-4">
            <p className="type-body-sm text-ink-2">{t('mapPages.route.reduced')}</p>
            <p className="type-title-lg tabular mt-1 text-ink">{t('mapPages.route.minutes', { minutes: minutes.reduced })}</p>
            <p className="type-caption mt-1 text-ink-2">{t('mapPages.route.reducedHint')}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ProvenanceTag provenance="estimated" />
          {route.accessible ? (
            <Chip tone="positive" icon="accessibility">
              {t('mapPages.route.stepFreeYes')}
            </Chip>
          ) : (
            <Chip tone="warning" icon="triangle-alert">
              {t('mapPages.route.stepFreeNo')}
            </Chip>
          )}
          <span className="type-body-sm text-ink-2">{t('mapPages.route.distance', { distance: formatDistance(route.metres, lang) })}</span>
        </div>
        {levelPath.length > 1 ? (
          <p className="type-body-sm mt-2 flex flex-wrap items-center gap-1.5 text-ink-2">
            <Icon name="layers" size="sm" />
            {levelPath.map((label, index) => (
              <span key={`${label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 ? <Icon name="arrow-right" size="xs" /> : null}
                <span className="font-medium text-ink">{label}</span>
              </span>
            ))}
          </p>
        ) : null}
        <p className="type-caption mt-3 text-ink-2">{t('mapPages.route.estimateNote')}</p>

        <h3 className="type-title-md mt-7 text-ink">
          {t('mapPages.route.stepsTitle')}
        </h3>
        <ol className="mt-4 flex flex-col">
          {steps.map((step, index) => {
            const instruction = stepInstruction(step, t, levelsById);
            const level = levelsById.get(step.level);
            const walkMeta = step.metres > 0 && (step.kind === 'walk' || step.kind === 'through' || step.kind === 'checkpoint');
            const rideMeta = step.kind === 'ride' || step.kind === 'change-level';
            const last = index === steps.length - 1;
            return (
              <li key={step.key} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'z-10 flex size-8 shrink-0 items-center justify-center rounded-pill border',
                      step.kind === 'arrive' ? 'border-primary bg-primary text-on-primary' : step.kind === 'start' ? 'border-ink bg-ink text-page' : 'border-line-strong bg-surface text-ink',
                    )}
                  >
                    <Icon name={stepIcon(step)} size="sm" strokeWidth={2} />
                  </span>
                  {!last ? <span aria-hidden="true" className="my-0.5 w-[3px] flex-1 rounded-pill bg-primary/20" /> : null}
                </div>
                <button
                  type="button"
                  onClick={() => onStepSelect(step)}
                  aria-pressed={activeStep === step.key}
                  className={cn(
                    'mb-2 min-w-0 flex-1 rounded-xl px-3 py-1.5 text-left transition-colors duration-fast hover:bg-page-subtle',
                    activeStep === step.key && 'bg-primary-soft hover:bg-primary-soft',
                  )}
                >
                  <span className="sr-only">{t('mapPages.route.showStep', { number: index + 1 })}: </span>
                  <span className="type-body block font-semibold text-ink">{instruction}</span>
                  {step.via.length > 0 ? <span className="type-body-sm block text-ink-2">{t('mapPages.route.steps.passing', { list: formatList(step.via, lang) })}</span> : null}
                  <span className="type-caption mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2">
                    {level ? <Badge size="sm">{level.label}</Badge> : null}
                    {walkMeta ? (
                      <span>
                        {t('mapPages.route.steps.walkMeta', { distance: formatDistance(step.metres, lang) })} · {formatDuration(wholeMinutes(step.minutes.standard), lang)}
                      </span>
                    ) : null}
                    {rideMeta && step.minutes.standard > 0 ? <span>{t('mapPages.route.steps.rideMeta', { minutes: wholeMinutes(step.minutes.standard) })}</span> : null}
                  </span>
                  {step.note ? <span className="type-body-sm mt-1 block text-ink-2">{step.note}</span> : null}
                </button>
              </li>
            );
          })}
        </ol>
      </>
    ) : null;

  if (part === 'result') {
    return result ? (
      <section aria-labelledby="map-route-result-title" data-route-result="" className={card}>
        <h2 id="map-route-result-title" className="type-title-lg mb-4 flex items-center gap-2 text-ink">
          <Icon name="route" className="text-primary-ink" />
          {t('mapPages.route.resultTitle')}
        </h2>
        {result}
      </section>
    ) : null;
  }

  return (
    <section aria-labelledby="map-route-title" className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="map-route-title" className="type-title-lg flex items-center gap-2 text-ink">
            <Icon name="route" className="text-primary-ink" />
            {t('mapPages.route.title')}
          </h2>
          {/* Polish (critique-redesign2 item 4): the lead is read on phones but not shown, so the drawing
              starts on the first screen; the controls keep one height before and after a deep link's
              route is applied (no shift above the drawing). */}
          <p className="type-body-sm mt-1 text-ink-2 max-sm:sr-only">{t('mapPages.route.lead')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton
            icon="arrow-left-right"
            variant="secondary"
            size="sm"
            label={t('mapPages.route.swap')}
            onClick={onSwap}
            disabled={!fromId && !toId}
            className="shrink-0 [&_svg]:rotate-90"
          />
          <IconButton icon="x" variant="secondary" size="sm" label={t('mapPages.route.clear')} onClick={onClear} disabled={!fromId && !toId} className="shrink-0" />
        </div>
      </div>

      {/* From and To in one well, like a travel app's route card (full width, so a long place
          name is not cut short in the field). Closing fix (VA6 item 3): a route in the address is
          written into both fields during parsing, by the script right after the well. */}
      <div data-route-fields="" data-terminal={map.terminal} className="mt-4 rounded-2xl bg-page-subtle p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <PlaceSelect
            id={ROUTE_FROM_ID}
            end="from"
            label={t('mapPages.route.from')}
            icon="circle-dot"
            value={fromId ?? ''}
            shown={(fromId && labels.get(fromId)) || t('mapPages.route.choose')}
            onChange={(value) => onFromChange(value || undefined)}
          >
            <option value="">{t('mapPages.route.choose')}</option>
            {options}
          </PlaceSelect>
          <PlaceSelect
            id={ROUTE_TO_ID}
            end="to"
            label={t('mapPages.route.to')}
            icon="map-pin"
            value={toId ?? ''}
            shown={(toId && labels.get(toId)) || t('mapPages.route.choose')}
            onChange={(value) => onToChange(value || undefined)}
          >
            <option value="">{t('mapPages.route.choose')}</option>
            {options}
          </PlaceSelect>
        </div>
      </div>
      <RouteNamesScript />

      <div className="mt-4">
        <Switch label={t('mapPages.route.stepFree')} hint={t('mapPages.route.stepFreeHint')} checked={stepFree} onCheckedChange={onStepFreeChange} />
      </div>

      {same ? (
        <Callout tone="info" className="mt-4">
          {t('mapPages.route.same')}
        </Callout>
      ) : null}
      {both && !same && !route ? (
        <Callout tone="warning" className="mt-4" title={t('map.noRoute')}>
          {stepFree ? t('mapPages.route.noRouteStepFree') : null}
        </Callout>
      ) : null}

      {part === 'all' && result ? <div className="mt-5 border-t border-line pt-5">{result}</div> : null}

    </section>
  );
}

/**
 * Redesign three (critique-redesign2 item 5, V6 item 4): From and To show the whole place name.
 * A native `<select>` cuts its value at the field's width ("Departures drop-off · Lev…" at
 * 1440 px), so the chosen name is drawn as text that wraps, and the real `<select>` lies over it,
 * transparent: it keeps its label, its keyboard and the phone's own picker, and its focus ring is
 * drawn on the field. The drawn text is hidden from assistive technology (the select says it).
 */
function PlaceSelect({
  id,
  end,
  label,
  icon,
  value,
  shown,
  onChange,
  children,
}: {
  id: string;
  /** The address parameter this field reads (`from` or `to`), for `MAP_ROUTE_NAMES_SCRIPT`. */
  end: 'from' | 'to';
  label: string;
  icon: IconName;
  value: string;
  shown: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Field id={id} label={label}>
      {/* `suppressHydrationWarning` (this element and the drawn name only): with a route in the
          address the script has already written the name and dropped `text-ink-2` before React
          hydrates with an empty query; React keeps them, then renders the same name. */}
      <div
        data-place-select={end}
        suppressHydrationWarning
        className={cn(
          controlClasses,
          'relative flex h-auto min-h-12 items-center gap-3 py-2.5 pr-11 pl-4 has-[select:focus-visible]:focus-ring',
          !value && 'text-ink-2',
        )}
      >
        <Icon name={icon} className="shrink-0 text-ink-3" />
        <span data-place-shown="" aria-hidden="true" suppressHydrationWarning className="type-body min-w-0 font-medium [overflow-wrap:anywhere] [text-wrap:pretty]">
          {shown}
        </span>
        <Icon name="chevron-down" size="sm" strokeWidth={2} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-2" />
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 size-full cursor-pointer appearance-none rounded-md opacity-0">
          {children}
        </select>
      </div>
    </Field>
  );
}

/**
 * Runs `MAP_ROUTE_NAMES_SCRIPT` during HTML parsing, right after the From and To well. Rendered as
 * plain text on the client, so React never creates a script element after hydration (the Next.js
 * notes, section 4; the same pattern as the home's saved-flight flag).
 */
function RouteNamesScript() {
  return (
    <script
      suppressHydrationWarning
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      dangerouslySetInnerHTML={{ __html: MAP_ROUTE_NAMES_SCRIPT }}
    />
  );
}
