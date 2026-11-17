'use client';

import { useId, type FormEvent } from 'react';
import { terminalLabel } from '@/content/airports';
import type { Airport, TerminalId } from '@/content/types';
import type { FlightDirection } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { STATUS_GROUPS, readQueryKind, type StatusGroupId } from './board-model';

export interface BoardToolbarProps {
  airport: Airport;
  direction: FlightDirection;
  query: string;
  onQueryChange: (query: string) => void;
  terminal: TerminalId | undefined;
  onTerminalChange: (terminal: TerminalId | undefined) => void;
  groups: readonly StatusGroupId[];
  onGroupsChange: (groups: StatusGroupId[]) => void;
  /** Flights per status group for the current search, or `null` while loading. */
  counts: Partial<Record<StatusGroupId, number>> | null;
}

/**
 * Search within the board, the KLIA terminal filter and the status filters. Every control is a
 * real form control or toggle button; nothing depends on colour alone.
 */
export function BoardToolbar({ airport, direction, query, onQueryChange, terminal, onTerminalChange, groups, onGroupsChange, counts }: BoardToolbarProps) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const statusLabelId = `${id}-status`;
  const reading = readQueryKind(query);
  const multiTerminal = airport.terminals.length > 1;
  const visibleGroups = STATUS_GROUPS[direction].filter((group) => !counts || (counts[group.id] ?? 0) > 0 || groups.includes(group.id));

  const toggle = (group: StatusGroupId, pressed: boolean) => {
    const next = pressed ? [...groups, group] : groups.filter((item) => item !== group);
    // Keep the life-cycle order in the URL, whatever order they were pressed in.
    onGroupsChange(STATUS_GROUPS[direction].map((item) => item.id).filter((item) => next.includes(item)));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <form role="search" aria-label={t('flightPages.board.searchLabel')} className="min-w-0 flex-1 basis-80" onSubmit={(event: FormEvent) => event.preventDefault()}>
          <SearchField
            label={t('flightPages.board.searchLabel')}
            hideLabel
            value={query}
            onValueChange={onQueryChange}
            onClear={() => onQueryChange('')}
            placeholder={t('flightPages.board.searchPlaceholder')}
            placeholderShort={t('flightPages.board.searchPlaceholderShort')}
            name="q"
            inputMode="search"
            autoComplete="off"
          />
        </form>
        {multiTerminal ? (
          <SegmentedControl<string>
            label={t('flightPages.board.terminalLabel')}
            value={terminal ?? 'all'}
            onValueChange={(value) => onTerminalChange(value === 'all' ? undefined : airport.terminals.find((item) => item.id === value)?.id)}
            className="max-sm:w-full"
            block
            options={[
              { value: 'all', label: t('flightPages.board.allTerminals') },
              ...airport.terminals.map((item) => ({ value: item.id, label: terminalLabel(airport, item.id, lang, { short: true }) })),
            ]}
          />
        ) : null}
      </div>

      <div role="group" aria-labelledby={statusLabelId} className="flex flex-wrap items-center gap-2">
        <span id={statusLabelId} className="type-eyebrow mr-1 text-ink-2">
          {t('flightPages.board.statusLabel')}
        </span>
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
          <Button variant="quiet" size="sm" iconStart="x" onClick={() => onGroupsChange([])}>
            {t('flightPages.board.clearFilters')}
          </Button>
        ) : null}
      </div>

      {reading ? (
        <p className="type-body-sm flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ink-2">
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
