'use client';

import type { PathResult, WalkProfile } from '@/lib/map';
import { formatDistance, formatDuration, formatList } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useLang, useT } from '@/lib/i18n/client';
import type { Translator } from '@/lib/i18n/translate';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Chip } from '@/components/ui/chip';
import { Icon, type IconKey } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import type { LevelView, MapView, RouteStep } from './map-logic';

export const ROUTE_FROM_ID = 'map-route-from';
export const ROUTE_TO_ID = 'map-route-to';

export interface RoutePlannerProps {
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
      return t('mapPages.route.steps.walkThrough', { level: levelName(step.toLevel) });
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
  if (step.kind === 'ride') return step.conveyance === 'bus' ? 'bus-front' : 'tram-front';
  return 'footprints';
}

const wholeMinutes = (value: number) => Math.max(1, Math.ceil(value - 1e-9));

/**
 * Directions between two places: the form, the estimate at both walking paces and the written
 * steps, which are the primary way to follow a route (the line on the map illustrates them).
 */
export function RoutePlanner({
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

  const options = map.levels.map((level) => (
    <optgroup key={level.id} label={level.name}>
      {map.pois
        .filter((poi) => poi.level === level.id)
        .map((poi) => (
          <option key={poi.id} value={poi.id}>
            {poi.name}
          </option>
        ))}
    </optgroup>
  ));

  const levelPath = route ? route.levels.map((id) => levelsById.get(id)?.label ?? id) : [];

  return (
    <section aria-labelledby="map-route-title" className="rounded-xl border border-line-strong bg-surface p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="map-route-title" className="type-title-lg flex items-center gap-2 text-ink">
            <Icon name="route" className="text-primary-ink" />
            {t('mapPages.route.title')}
          </h2>
          <p className="type-body-sm mt-1 text-ink-2">{t('mapPages.route.lead')}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-2 gap-y-3">
        <NativeSelect id={ROUTE_FROM_ID} label={t('mapPages.route.from')} iconStart="circle-dot" value={fromId ?? ''} onChange={(event) => onFromChange(event.target.value || undefined)}>
          <option value="">{t('mapPages.route.choose')}</option>
          {options}
        </NativeSelect>
        <IconButton
          icon="arrow-left-right"
          variant="secondary"
          label={t('mapPages.route.swap')}
          onClick={onSwap}
          disabled={!fromId && !toId}
          className="row-span-2 self-center [&_svg]:rotate-90"
        />
        <NativeSelect id={ROUTE_TO_ID} label={t('mapPages.route.to')} iconStart="map-pin" value={toId ?? ''} onChange={(event) => onToChange(event.target.value || undefined)}>
          <option value="">{t('mapPages.route.choose')}</option>
          {options}
        </NativeSelect>
      </div>

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

      {route && minutes ? (
        <div className="mt-5 border-t border-line pt-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-page-subtle p-3">
              <p className="type-body-sm text-ink-2">{t('mapPages.route.standard')}</p>
              <p className="type-data-lg mt-1 text-ink">{t('mapPages.route.minutes', { minutes: minutes.standard })}</p>
            </div>
            <div className="rounded-lg bg-page-subtle p-3">
              <p className="type-body-sm text-ink-2">{t('mapPages.route.reduced')}</p>
              <p className="type-data-lg mt-1 text-ink">{t('mapPages.route.minutes', { minutes: minutes.reduced })}</p>
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

          <h3 className="type-title-md mt-6 text-ink">{t('mapPages.route.stepsTitle')}</h3>
          <ol className="mt-3 flex flex-col">
            {steps.map((step, index) => {
              const instruction = stepInstruction(step, t, levelsById);
              const level = levelsById.get(step.level);
              const walkMeta = step.metres > 0 && (step.kind === 'walk' || step.kind === 'through');
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
                    {!last ? <span aria-hidden="true" className="w-0.5 flex-1 bg-line-strong" /> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onStepSelect(step)}
                    aria-pressed={activeStep === step.key}
                    className={cn(
                      'mb-2 min-w-0 flex-1 rounded-md px-2 py-1 text-left transition-colors duration-fast hover:bg-page-subtle',
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
        </div>
      ) : null}

      {fromId || toId ? (
        <div className="mt-4 border-t border-line pt-3">
          <Button variant="quiet" size="sm" iconStart="x" onClick={onClear}>
            {t('mapPages.route.clear')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
