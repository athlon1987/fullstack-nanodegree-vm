'use client';

import { useMemo } from 'react';
import type { TerminalId } from '@/content/types';
import { formatFlightNumber, isFinalStatus } from '@/lib/flights';
import { formatList } from '@/lib/format';
import { useFlightProvider, useSavedJourney } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { NativeSelect } from '@/components/ui/native-select';
import { gateAreasFor, type GateContext } from './commerce-view';

export interface GatePanelProps {
  airport: string;
  terminalLabels: Readonly<Partial<Record<TerminalId, string>>>;
  /** The `gate` filter: an area id or `T1-C12`. */
  value: string | undefined;
  context: GateContext | undefined;
  onChange: (value: string | undefined) => void;
}

/**
 * "Near your gate": choose a gate area, or use the gate of a saved departing flight (demo data,
 * labelled). Proximity itself is an estimate and says so.
 */
export function GatePanel({ airport, terminalLabels, value, context, onChange }: GatePanelProps) {
  const t = useT();
  const lang = useLang();
  const areas = gateAreasFor(airport);
  const { journey, hydrated } = useSavedJourney();
  const provider = useFlightProvider();

  const flight = useMemo(() => {
    if (!provider) return null;
    const saved = journey.flights.filter((item) => item.airport === airport && item.direction === 'd');
    const live = saved
      .map((item) => provider.getFlightSync(item.id, airport))
      .filter((item): item is NonNullable<typeof item> => item !== null && !isFinalStatus(item.status))
      .sort((a, b) => a.estimated.localeCompare(b.estimated));
    return live[0] ?? null;
  }, [provider, journey.flights, airport]);

  const flightValue = flight?.gate ? `${flight.terminal}-${flight.gate}` : undefined;
  const fromFlight = value !== undefined && !areas.some((area) => area.id === value);
  const areaLabel = (letters: string[], terminal: TerminalId, international: boolean) =>
    `${t('commercePages.gate.areaOption', { terminal: terminalLabels[terminal] ?? terminal, gates: formatList(letters, lang) })}, ${t(
      international ? 'commercePages.gate.international' : 'commercePages.gate.domestic',
    )}`;

  if (areas.length === 0 && !flight) return null;

  return (
    <section aria-labelledby="gate-panel-title" className="rounded-xl border border-line-strong bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="gate-panel-title" className="type-title-sm flex items-center gap-2 text-ink">
          <Icon name="navigation" size="sm" className="text-ink-2" />
          {t('commercePages.gate.title')}
        </h2>
        <ProvenanceTag provenance="estimated" length="short" />
      </div>
      <p className="type-body-sm mt-1.5 text-ink-2">{t('commercePages.gate.lead')}</p>

      {areas.length > 0 || fromFlight ? (
        <NativeSelect
          label={t('commercePages.gate.areaLabel')}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value || undefined)}
          fieldClassName="mt-3"
        >
          <option value="">{t('commercePages.gate.areaNone')}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {areaLabel(area.letters, area.terminal, area.international)}
            </option>
          ))}
          {fromFlight && value && context?.gate ? (
            <option value={value}>
              {`${t('common.labels.gate')} ${context.gate} (${terminalLabels[context.terminal] ?? context.terminal}) · ${t('provenance.demo.short')}`}
            </option>
          ) : null}
        </NativeSelect>
      ) : null}

      <div className="mt-3 border-t border-line pt-3">
        {!hydrated || !provider ? (
          <p className="type-body-sm text-ink-2">{t('commercePages.gate.noFlight')}</p>
        ) : flight ? (
          flight.gate ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <ProvenanceTag provenance="demo" length="short" />
                <p className="type-body-sm min-w-0 text-ink">
                  {t('commercePages.gate.fromFlight', { gate: flight.gate, flight: formatFlightNumber(flight) })}
                </p>
              </div>
              {flightValue && value !== flightValue ? (
                <Button
                  size="sm"
                  variant="secondary"
                  iconStart="locate-fixed"
                  className="self-start"
                  onClick={() => onChange(flightValue)}
                >
                  {t('commercePages.gate.useFlightGate', { gate: flight.gate })}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="type-body-sm text-ink-2">{t('commercePages.gate.flightNoGate', { flight: formatFlightNumber(flight) })}</p>
          )
        ) : (
          <p className="type-body-sm text-ink-2">
            {t('commercePages.gate.noFlight')}{' '}
            <LocaleLink href={`/${airport}/flights?dir=d`} className="link">
              {t('commercePages.gate.findFlight')}
            </LocaleLink>
          </p>
        )}
      </div>

      {value ? (
        <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
          <p className="type-caption min-w-0 flex-1 text-ink-2">{t('commercePages.gate.note')}</p>
          <Button size="sm" variant="quiet" iconStart="x" onClick={() => onChange(undefined)}>
            {t('commercePages.gate.clear')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
