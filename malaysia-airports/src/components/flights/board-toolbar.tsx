'use client';

import { useId, useState, type FormEvent } from 'react';
import { terminalLabel } from '@/content/airports';
import type { Airport, TerminalId } from '@/content/types';
import type { FlightDirection } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { SearchField } from '@/components/ui/search-field';
import { STATUS_GROUPS, readQueryKind, type StatusGroupId } from './board-model';

export interface BoardToolbarProps {
  airport: Airport;
  direction: FlightDirection;
  /** The query the board shows (it follows the field in a transition). */
  query: string;
  /**
   * The field's starting text. The field keeps its own text, so a keystroke re-renders only the
   * field (performance-02); change `searchKey` to reset it from outside (Clear search).
   */
  initialQuery: string;
  searchKey?: number;
  onQueryChange: (query: string) => void;
  terminal: TerminalId | undefined;
  onTerminalChange: (terminal: TerminalId | undefined) => void;
  groups: readonly StatusGroupId[];
  onGroupsChange: (groups: StatusGroupId[]) => void;
  /** Flights per status group for the current search, or `null` while loading. */
  counts: Partial<Record<StatusGroupId, number>> | null;
}

/**
 * Search within the board and the status filters. The KLIA terminal is chosen with the terminal
 * chips in the airport header (they write `?t=`); when one is chosen it shows here as a pressed
 * chip that clears it. Every control is a real form control or toggle button; nothing depends
 * on colour alone.
 */
export function BoardToolbar({ airport, direction, query, initialQuery, searchKey = 0, onQueryChange, terminal, onTerminalChange, groups, onGroupsChange, counts }: BoardToolbarProps) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const statusLabelId = `${id}-status`;
  const reading = readQueryKind(query);
  const visibleGroups = STATUS_GROUPS[direction].filter((group) => !counts || (counts[group.id] ?? 0) > 0 || groups.includes(group.id));

  const toggle = (group: StatusGroupId, pressed: boolean) => {
    const next = pressed ? [...groups, group] : groups.filter((item) => item !== group);
    // Keep the life-cycle order in the URL, whatever order they were pressed in.
    onGroupsChange(STATUS_GROUPS[direction].map((item) => item.id).filter((item) => next.includes(item)));
  };

  return (
    // Round 4 (re-review 6.1.6): on wide screens the search and the status chips share a row, so
    // the first board row is above the fold at 1440 x 900 in English and Malay.
    <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:flex-wrap xl:items-center xl:gap-x-5">
      <div className="flex flex-wrap items-end gap-3 xl:min-w-64 xl:flex-1">
        <form role="search" aria-label={t('flightPages.board.searchLabel')} className="min-w-0 flex-1 basis-80" onSubmit={(event: FormEvent) => event.preventDefault()}>
          <BoardSearchField key={searchKey} initial={initialQuery} onQueryChange={onQueryChange} />
        </form>
      </div>

      {/* One row that scrolls sideways on phones, so the board stays near the top of the screen.
          Round 5: as tall as a chip even when no status has flights (at night), so the board under
          it does not move up when the feed answers. */}
      <div
        role="group"
        aria-labelledby={statusLabelId}
        className="flex min-h-9 items-center gap-2 max-sm:-mx-gutter max-sm:min-h-10 max-sm:overflow-x-auto max-sm:px-gutter max-sm:pb-1 sm:flex-wrap touch:min-h-11 max-sm:touch:min-h-12"
      >
        <span id={statusLabelId} className="type-eyebrow mr-1 shrink-0 text-ink-2">
          {t('flightPages.board.statusLabel')}
        </span>
        {terminal ? (
          <FilterChip pressed onPressedChange={() => onTerminalChange(undefined)} aria-label={t('flightPages.board.terminalChip', { terminal: terminalLabel(airport, terminal, lang) })}>
            {terminalLabel(airport, terminal, lang, { short: true })}
          </FilterChip>
        ) : null}
        {visibleGroups.map((group) => (
          <FilterChip
            key={group.id}
            pressed={groups.includes(group.id)}
            onPressedChange={(pressed) => toggle(group.id, pressed)}
            icon={group.icon}
            count={counts ? (counts[group.id] ?? 0) : undefined}
          >
            {t(group.labelKey)}
          </FilterChip>
        ))}
        {groups.length > 0 ? (
          <Button variant="quiet" size="sm" iconStart="x" className="shrink-0" onClick={() => onGroupsChange([])}>
            {t('flightPages.board.clearFilters')}
          </Button>
        ) : null}
      </div>

      {reading ? (
        <p className="type-body-sm flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ink-2 xl:basis-full">
          <span className="inline-flex items-center gap-1.5">
            {t('flightPages.board.readingAs')}
            <span className="type-data-xs rounded-xs border border-line-control px-1.5 py-0.5 font-semibold text-ink uppercase">{t(`flightPages.board.kinds.${reading}`)}</span>
          </span>
          <span>{t('flightPages.board.searchScope')}</span>
        </p>
      ) : null}
    </div>
  );
}

/** The search field with its own text: typing re-renders this field only; the board follows. */
function BoardSearchField({ initial, onQueryChange }: { initial: string; onQueryChange: (query: string) => void }) {
  const t = useT();
  const [text, setText] = useState(initial);
  const change = (value: string) => {
    setText(value);
    onQueryChange(value);
  };
  return (
    <SearchField
      label={t('flightPages.board.searchLabel')}
      hideLabel
      value={text}
      onValueChange={change}
      onClear={() => change('')}
      placeholder={t('flightPages.board.searchPlaceholder')}
      placeholderShort={t('flightPages.board.searchPlaceholderShort')}
      name="q"
      inputMode="search"
      autoComplete="off"
    />
  );
}
