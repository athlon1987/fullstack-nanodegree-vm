import { pick, resolveSources, terminalLabel, type Airport, type AirlineAtAirport, type Lang } from '@/content';
import { getT } from '@/lib/i18n';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';

export interface AirlineFactsProps {
  lang: Lang;
  airport: Airport;
  airline: AirlineAtAirport;
}

/** True when the published record says anything worth showing on a flight page. */
export function hasAirlineFacts(airline: AirlineAtAirport): boolean {
  return Boolean(airline.terminal || airline.checkIn || airline.note);
}

/**
 * What is published about the flight's airline at this airport (terminal, check-in area), with
 * its sources. Facts only from the content layer; a third-party basis is tagged as estimated.
 * Server Component: it resolves sources from the content layer.
 */
export function AirlineFacts({ lang, airport, airline }: AirlineFactsProps) {
  const t = getT(lang);
  const provenance = airline.basis === 'third-party' ? 'estimated' : 'official';
  const basis =
    airline.basis === 'airline'
      ? t('flightPages.airline.basisAirline')
      : airline.basis === 'airport'
        ? t('flightPages.airline.basisAirport')
        : t('flightPages.airline.basisThirdParty');
  return (
    <section aria-labelledby="airline-facts-title" className="rounded-lg border border-line-strong bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="airline-facts-title" className="type-title-md text-ink">
          {t('flightPages.airline.title', { airline: airline.name, airport: airport.shortName })}
        </h2>
        <ProvenanceTag provenance={provenance} length="short" />
      </div>
      <p className="type-caption mt-1 text-ink-2">{basis}</p>
      <dl className="mt-3 flex flex-col gap-3">
        {airline.terminal ? (
          <div>
            <dt className="type-eyebrow text-ink-2">{t('common.labels.terminal')}</dt>
            <dd className="type-body-sm mt-0.5 text-ink">{terminalLabel(airport, airline.terminal, lang)}</dd>
          </div>
        ) : null}
        {airline.checkIn ? (
          <div>
            <dt className="type-eyebrow text-ink-2">{t('common.labels.checkIn')}</dt>
            <dd className="type-body-sm mt-0.5 text-ink" lang={lang === 'en' || airline.checkIn.ms ? undefined : 'en'}>
              {pick(airline.checkIn, lang)}
            </dd>
          </div>
        ) : null}
      </dl>
      {airline.note ? <p className="type-body-sm mt-3 text-ink-2">{pick(airline.note, lang)}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-4">
        <SourceNote sources={resolveSources(airline.sources)} />
        {airline.asOf ? <p className="type-caption text-ink-2">{t('freshness.asOf', { date: airline.asOf })}</p> : null}
      </div>
    </section>
  );
}
