'use client';

import Link from 'next/link';
import { useId, useMemo } from 'react';
import { pick, TRANSPORT_MODE_LABELS } from '@/content/values';
import type { TerminalId } from '@/content/types';
import { useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { dateKey } from '@/lib/time';
import { compareTransport, type TransportPriority } from '@/lib/transport';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Icon } from '@/components/ui/icon';
import { NativeSelect } from '@/components/ui/native-select';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { listedPlaces, optionsForDay, placeChoices, placeKey, withDoorToDoorEntries } from './transport-logic';
import { TransportOptionCard, type TransportHighlight } from './transport-option-card';
import { TransportTable } from './transport-table';
import type { PlannerData } from './transport-types';

export const PRIORITIES: readonly TransportPriority[] = ['price', 'time', 'convenience', 'accessibility'];
export type PlannerView = 'cards' | 'table';

/** What the traveller chose. `place` is an English place name from `placeChoices`. */
export interface PlannerState {
  place?: string;
  priority: TransportPriority;
  view: PlannerView;
}

export const DEFAULT_PLANNER_STATE: PlannerState = { priority: 'price', view: 'cards' };

export interface TransportPlannerProps extends PlannerData {
  state: PlannerState;
  onStateChange?: (next: PlannerState) => void;
  terminal?: TerminalId;
  /** Link to the same page without the terminal filter (with the locale). */
  allTerminalsHref?: string;
}

const PRIORITY_LABEL = {
  price: 'transport.priorityPrice',
  time: 'transport.priorityTime',
  convenience: 'transport.priorityConvenience',
  accessibility: 'transport.priorityAccessibility',
} as const;

const PRIORITY_ICON = { price: 'coins', time: 'timer', convenience: 'armchair', accessibility: 'accessibility' } as const;

/**
 * The ground transport planner: pick a place and a priority, get the published options ranked by
 * `compareTransport` on today's fares, as cards or a table. Options that do not list the place are
 * set apart with the places they do list. Nothing is invented: a missing number reads "not
 * published" and sorts last, and the sort note says so.
 */
export function TransportPlanner({ context, options, state, onStateChange, terminal, allTerminalsHref }: TransportPlannerProps) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const now = useNow(60_000);
  const day = now === null ? null : dateKey(now, context.timezone);

  const choices = useMemo(() => placeChoices(options), [options]);
  const place = choices.find((choice) => choice.value === state.place) ?? choices[0];
  const key = place ? placeKey(place.value) : undefined;

  const { ranked, unlisted } = useMemo(() => {
    const byId = new Map(options.map((option) => [option.id, option]));
    const scored = compareTransport(withDoorToDoorEntries(optionsForDay(options, day), place?.value), { priority: state.priority, destination: place?.value });
    const listed = scored.filter((row) => !row.labels.includes('destination-not-listed'));
    const fares = listed.filter((row) => row.fare !== undefined).length;
    const times = listed.filter((row) => row.minutes !== undefined).length;
    return {
      ranked: listed.map((row, index) => {
        const highlights: TransportHighlight[] = [];
        if (fares > 1 && row.labels.includes('lowest-fare')) highlights.push('lowest-fare');
        if (times > 1 && row.labels.includes('shortest-time')) highlights.push('shortest-time');
        return { option: byId.get(row.option.id) ?? row.option, rank: index + 1, highlights };
      }),
      unlisted: scored.filter((row) => row.labels.includes('destination-not-listed')).map((row) => byId.get(row.option.id) ?? row.option),
    };
  }, [options, day, place?.value, state.priority]);

  const priorityLabel = t(PRIORITY_LABEL[state.priority]);
  const placeLabel = place ? pick(place.name, lang) : '';
  const terminalLabel = terminal ? context.terminals.find((item) => item.id === terminal)?.label : undefined;
  const set = (patch: Partial<PlannerState>) => onStateChange?.({ ...state, ...patch });

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label={t('transportPages.planner.controlsLabel')}
        className="grid gap-5 rounded-xl border border-line-strong bg-surface p-4 shadow-xs sm:p-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-8"
      >
        <NativeSelect
          label={t('transportPages.planner.destination')}
          hint={t('transportPages.planner.destinationHint')}
          iconStart="map-pin"
          value={place?.value ?? ''}
          onChange={(event) => set({ place: event.target.value })}
          disabled={choices.length === 0}
        >
          {choices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {pick(choice.name, lang)}
            </option>
          ))}
        </NativeSelect>
        <SegmentedControl
          label={t('transportPages.planner.priority')}
          showLabel
          stackOnPhone
          block
          name={`${id}-priority`}
          value={state.priority}
          onValueChange={(priority) => set({ priority })}
          options={PRIORITIES.map((value) => ({ value, label: t(PRIORITY_LABEL[value]), icon: PRIORITY_ICON[value] }))}
        />
      </div>

      <div className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-reading">
          <p className="type-title-md text-ink" role="status">
            {t.count('transportPages.planner.summary', ranked.length, { destination: placeLabel, priority: priorityLabel.toLocaleLowerCase(lang === 'ms' ? 'ms-MY' : 'en-GB') })}
          </p>
          <p className="type-body-sm mt-1 text-ink-2">
            {t(`transportPages.planner.sortNote.${state.priority}`)}
            {state.priority === 'convenience' ? <ProvenanceTag provenance="estimated" length="short" className="ml-2 align-middle" /> : null}
          </p>
          {terminalLabel ? (
            <p className="type-body-sm mt-2 flex flex-wrap items-center gap-x-3 text-ink">
              <Icon name="list-filter" size="sm" className="text-ink-2" />
              {t('transportPages.planner.terminalFilter', { terminal: terminalLabel })}
              {allTerminalsHref ? (
                <Link href={allTerminalsHref} scroll={false} className="link-action">
                  {t('transportPages.planner.showAllTerminals')}
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
        <SegmentedControl
          label={t('transportPages.planner.view')}
          name={`${id}-view`}
          value={state.view}
          onValueChange={(view) => set({ view })}
          options={[
            { value: 'cards', label: t('transportPages.planner.viewCards'), icon: 'layers' },
            { value: 'table', label: t('transportPages.planner.viewTable'), icon: 'menu' },
          ]}
          className="shrink-0"
        />
      </div>

      {ranked.length === 0 ? (
        <p className="type-body text-ink-2">{t('transportPages.planner.noResults')}</p>
      ) : state.view === 'table' ? (
        <TransportTable
          rows={ranked}
          placeKey={key}
          context={context}
          day={day}
          terminal={terminal}
          caption={t('transportPages.planner.tableCaption', { airport: context.airportName, destination: placeLabel, priority: priorityLabel })}
        />
      ) : (
        <ol className="flex flex-col gap-4" aria-label={t('transportPages.planner.tableCaption', { airport: context.airportName, destination: placeLabel, priority: priorityLabel })}>
          {ranked.map(({ option, rank, highlights }) => (
            <li key={option.id}>
              <TransportOptionCard option={option} placeKey={key} context={context} day={day} terminal={terminal} rank={rank} highlights={highlights} />
            </li>
          ))}
        </ol>
      )}

      {unlisted.length > 0 ? (
        <section aria-labelledby={`${id}-unlisted`} className="rounded-xl border border-line bg-page-subtle p-4 sm:p-5">
          <h3 id={`${id}-unlisted`} className="type-title-sm text-ink">
            {t('transportPages.planner.notListedTitle', { destination: placeLabel })}
          </h3>
          <p className="type-body-sm mt-1 max-w-reading text-ink-2">{t('transportPages.planner.notListedBody', { destination: placeLabel })}</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {unlisted.map((option) => {
              const places = listedPlaces(option, lang);
              return (
                // Same anchor as a ranked card, so search results can land on the option either way.
                <li key={option.id} id={`transport-${option.id}`} className="flex min-w-0 scroll-mt-32 items-start gap-3 rounded-lg border border-line-strong bg-surface p-3.5">
                  <Icon name={option.mode} className="mt-0.5 shrink-0 text-ink-2" />
                  <div className="min-w-0">
                    <p className="type-body-sm font-semibold text-ink">{pick(option.name, lang)}</p>
                    <p className="type-caption mt-0.5 text-ink-2">{pick(TRANSPORT_MODE_LABELS[option.mode], lang)}</p>
                    <p className="type-body-sm mt-1.5 text-ink-2">
                      {places.length > 0 ? t('transportPages.planner.listedFor', { places: places.join('; ') }) : t('transportPages.planner.noPlaces')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
