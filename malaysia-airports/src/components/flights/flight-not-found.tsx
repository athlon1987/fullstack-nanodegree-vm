'use client';

import { getAirport } from '@/content/airports';
import type { Flight } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import { EmptyState } from '@/components/common/empty-state';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Icon } from '@/components/ui/icon';
import { FlightRow } from './flight-row';
import { FlightSearchBox } from './flight-search-box';

export interface FlightNotFoundProps {
  airport: string;
  /** `unknown`: no such flight that day; `expired`: it left the board; `future`: not on it yet. */
  reason: 'unknown' | 'expired' | 'future';
  /** The same flight number on today's board, when there is one. */
  sameToday?: Flight | null;
  /** Leave out the message when the page header already says it. */
  showMessage?: boolean;
}

/** A helpful dead end: what happened, the same flight today if it runs, a search, and the board. */
export function FlightNotFound({ airport, reason, sameToday, showMessage = true }: FlightNotFoundProps) {
  const t = useT();
  const record = getAirport(airport);
  const title = reason === 'expired' ? t('flightPages.notFound.expiredTitle') : reason === 'future' ? t('flightPages.notFound.futureTitle') : t('flightPages.notFound.title');
  const body = reason === 'expired' ? t('flightPages.notFound.expiredBody') : reason === 'future' ? t('flightPages.notFound.futureBody') : t('flightPages.notFound.unknownBody');

  return (
    <div className="flex flex-col gap-10">
      {showMessage ? (
        <EmptyState icon="search-x" headingLevel={2} title={title}>
          {body}
        </EmptyState>
      ) : null}

      {sameToday ? (
        <section aria-labelledby="same-flight-today">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="same-flight-today" className="type-title-lg text-ink">
              {t('flightPages.notFound.sameToday')}
            </h2>
            <ProvenanceTag provenance="demo" />
          </div>
          <div className="surface-board @container overflow-hidden rounded-lg border border-line">
            <ul aria-labelledby="same-flight-today">
              <FlightRow flight={sameToday} />
            </ul>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="flight-not-found-search">
        <h2 id="flight-not-found-search" className="type-title-lg mb-3 text-ink">
          {t('flightPages.notFound.searchTitle')}
        </h2>
        <FlightSearchBox airport={airport} />
      </section>

      {record ? (
        <p>
          <LocaleLink href={`/${record.slug}/flights`} className="link-action text-ink">
            {t('flightPages.notFound.openBoard', { airport: record.shortName })}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </p>
      ) : null}
    </div>
  );
}
