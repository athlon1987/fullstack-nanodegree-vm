'use client';

import { useId, useState } from 'react';
import { pick } from '@/content/types';
import { formatCurrency, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { calculateParking } from '@/lib/parking';
import { timezoneLabel } from '@/lib/time';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { sourcesFor } from '@/components/transport/transport-types';
import { dailyMaxCeiling, defaultArrival, QUICK_STAYS, shiftStamp, stayMinutes, type LocalStamp } from './parking-logic';
import type { ParkingPageData } from './parking-types';

const EMPTY: LocalStamp = { date: '', time: '' };

/** Published rates first, then a published daily maximum, then the first car park. */
function defaultCarPark(data: ParkingPageData): string {
  return (
    data.carParks.find((carPark) => carPark.rateStatus === 'published')?.id ??
    data.carParks.find((carPark) => carPark.dailyMax !== undefined)?.id ??
    data.carParks[0]?.id ??
    ''
  );
}

/**
 * Parking fee estimate for a stay, by the car park's `rateStatus`:
 * - published rates: `calculateParking` with the breakdown and the daily cap;
 * - not verified with a published daily maximum: only the most the stay can cost, with the assumption stated;
 * - not verified otherwise: no figure, the quoted figures with their sources, and the official page.
 * Times are airport time. Arrival defaults to the next quarter hour once the clock is read.
 */
export function ParkingCalculator({ data }: { data: ParkingPageData }) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const now = useNow(60_000);
  const [carParkId, setCarParkId] = useState(() => defaultCarPark(data));
  const [entryState, setEntry] = useState<LocalStamp | null>(null);
  const [exitState, setExit] = useState<LocalStamp | null>(null);

  const entry = entryState ?? (now === null ? EMPTY : defaultArrival(now, data.timezone));
  const exit = exitState ?? shiftStamp(entry, 1440, data.timezone) ?? EMPTY;
  const minutes = stayMinutes(entry, exit, data.timezone);
  const carPark = data.carParks.find((item) => item.id === carParkId) ?? data.carParks[0];
  if (!carPark) return null;

  const result = minutes !== null && minutes > 0 ? calculateParking(carPark, minutes) : null;
  const ceiling = minutes !== null && minutes > 0 && carPark.rateStatus !== 'published' ? dailyMaxCeiling(carPark, minutes) : undefined;
  const invalid = minutes !== null && minutes <= 0;
  const premium = carPark.type === 'preferred';

  const setQuick = (stay: number) => {
    setEntry(entry);
    const next = shiftStamp(entry, stay, data.timezone);
    if (next) setExit(next);
  };

  let headline: string;
  if (minutes === null) headline = t('transportPages.calculator.incomplete');
  else if (invalid) headline = t('transportPages.calculator.invalid');
  else if (result && !result.unavailable) headline = `${t('transportPages.calculator.total')}: ${formatCurrency(result.total, lang, { alwaysShowSen: !Number.isInteger(result.total) })}`;
  else if (ceiling) headline = t('transportPages.calculator.ceilingTitle', { amount: formatCurrency(ceiling.amount, lang) });
  else headline = t('transportPages.calculator.noFigureTitle');

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form
        aria-labelledby={`${id}-form`}
        onSubmit={(event) => event.preventDefault()}
        className="flex flex-col gap-5 rounded-xl border border-line-strong bg-surface p-4 shadow-xs sm:p-5"
      >
        <span id={`${id}-form`} className="sr-only">
          {t('transportPages.calculator.title')}
        </span>
        <NativeSelect label={t('transportPages.calculator.carPark')} iconStart="square-parking" value={carPark.id} onChange={(event) => setCarParkId(event.target.value)}>
          {data.carParks.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <fieldset className="min-w-0">
          <legend className="type-title-sm mb-3 text-ink">{t('transportPages.calculator.entry')}</legend>
          <div className="grid gap-3 xs:grid-cols-2">
            <Input type="date" label={t('transportPages.calculator.entryDate')} value={entry.date} onChange={(event) => setEntry({ ...entry, date: event.target.value })} mono />
            <Input type="time" label={t('transportPages.calculator.entryTime')} value={entry.time} onChange={(event) => setEntry({ ...entry, time: event.target.value })} mono />
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="type-title-sm mb-3 text-ink">{t('transportPages.calculator.exit')}</legend>
          <div className="grid gap-3 xs:grid-cols-2">
            <Input
              type="date"
              label={t('transportPages.calculator.exitDate')}
              value={exit.date}
              min={entry.date || undefined}
              onChange={(event) => setExit({ ...exit, date: event.target.value })}
              error={invalid ? t('transportPages.calculator.invalid') : undefined}
              mono
            />
            <Input type="time" label={t('transportPages.calculator.exitTime')} value={exit.time} onChange={(event) => setExit({ ...exit, time: event.target.value })} mono />
          </div>
        </fieldset>
        <div role="group" aria-labelledby={`${id}-quick`}>
          <p id={`${id}-quick`} className="type-body-sm mb-2 font-medium text-ink-2">
            {t('transportPages.calculator.quick')}
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_STAYS.map((stay) => {
              const pressed = minutes === stay.minutes;
              return (
                <Button key={stay.minutes} type="button" size="sm" variant={pressed ? 'primary' : 'secondary'} aria-pressed={pressed} onClick={() => setQuick(stay.minutes)} disabled={!entry.date || !entry.time}>
                  {t.count(stay.unit === 'hours' ? 'common.units.hours' : 'common.units.days', stay.count)}
                </Button>
              );
            })}
          </div>
        </div>
        <p className="type-caption text-ink-2">{now === null ? t('transportPages.calculator.lead') : `${t('transportPages.calculator.lead')} ${timezoneLabel(now, data.timezone)}.`}</p>
      </form>

      <section aria-labelledby={`${id}-result`} className="flex flex-col gap-4 rounded-xl border border-line-strong bg-surface-sunken p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={`${id}-result`} className="type-eyebrow text-ink-3">
            {t('transportPages.calculator.resultLabel')}
          </h3>
          <ProvenanceTag provenance="estimated" />
        </div>
        {premium ? (
          <Callout tone="warning" title={data.premiumWarning?.title ?? t('transportPages.parking.longStayCheck')}>
            {data.premiumWarning ? <p>{data.premiumWarning.body}</p> : null}
          </Callout>
        ) : null}
        <div>
          <p role="status" className={result && !result.unavailable ? 'type-display-sm text-ink' : ceiling ? 'type-display-sm text-ink' : 'type-title-md text-ink'}>
            {result && !result.unavailable ? formatCurrency(result.total, lang, { alwaysShowSen: !Number.isInteger(result.total) }) : ceiling ? t('transportPages.calculator.ceilingTitle', { amount: formatCurrency(ceiling.amount, lang) }) : headline}
          </p>
          {minutes !== null && minutes > 0 ? (
            <p className="type-body-sm mt-1 text-ink-2">
              {t('transportPages.calculator.stay')}: <span className="type-data-sm text-ink">{formatDuration(minutes, lang)}</span>
            </p>
          ) : null}
        </div>

        {result && !result.unavailable ? (
          <>
            {result.capped ? (
              <Chip tone="info" icon="badge-check" className="self-start">
                {t('transportPages.calculator.capped')}
              </Chip>
            ) : null}
            <div>
              <p className="type-eyebrow text-ink-3">{t('transportPages.calculator.breakdown')}</p>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {result.breakdown.map((line) => (
                  <li key={`${line.minutes}-${pick(line.label, 'en')}`} className="flex items-center justify-between gap-4 py-2">
                    <span className="type-body-sm text-ink-2">
                      {pick(line.label, lang)}
                      {line.capped ? ` · ${t('transportPages.calculator.capped')}` : null}
                    </span>
                    <span className="type-data-sm text-ink">{formatCurrency(line.amount, lang, { alwaysShowSen: !Number.isInteger(line.amount) })}</span>
                  </li>
                ))}
              </ul>
              {carPark.dailyMax !== undefined ? (
                <p className="type-caption mt-2 text-ink-2">
                  {t('transportPages.parking.fields.dailyMax')}: {formatCurrency(carPark.dailyMax, lang)}
                </p>
              ) : null}
            </div>
            <p className="type-body-sm text-ink-2">{t('transportPages.calculator.note')}</p>
          </>
        ) : null}

        {ceiling ? (
          <p className="type-body-sm text-ink-2">
            {t('transportPages.calculator.ceilingBody', {
              max: formatCurrency(ceiling.dailyMax, lang),
              duration: formatDuration(minutes ?? 0, lang),
              amount: formatCurrency(ceiling.amount, lang),
            })}
          </p>
        ) : null}

        {result?.unavailable && result.reason === 'rates-not-verified' ? (
          <div className="flex flex-col gap-2">
            {!ceiling ? <p className="type-body-sm text-ink-2">{t('transportPages.calculator.noFigureBody')}</p> : null}
            {carPark.description ? (
              <div className="rounded-lg border border-line bg-surface p-3.5">
                <p className="type-eyebrow text-ink-3">{t('transportPages.parking.fields.whatSourcesSay')}</p>
                <p className="type-body-sm mt-1.5 text-ink-2">{carPark.description}</p>
                <SourceNote sources={sourcesFor(carPark.sourceIds, data.sources)} className="mt-1" />
              </div>
            ) : null}
            <p className="type-body-sm font-semibold text-ink">{t('transportPages.parking.sourcesDiffer')}</p>
          </div>
        ) : null}

        <ExternalLink href={carPark.officialUrl} variant="action" className="type-body-sm self-start">
          {t('transportPages.calculator.officialLink')}
        </ExternalLink>
      </section>
    </div>
  );
}
