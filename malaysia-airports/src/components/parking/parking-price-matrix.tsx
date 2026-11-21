import type { ReactNode } from 'react';
import type { Lang } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { Translator } from '@/lib/i18n/translate';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { sourcesFor } from '@/components/transport/transport-types';
import { Icon } from '@/components/ui/icon';
import { TableScroll } from '@/components/ui/table';
import { MATRIX_DAYS, priceRow, type PriceCell } from './parking-logic';
import type { CarParkView, ParkingPageData } from './parking-types';

export interface ParkingPriceMatrixProps {
  data: ParkingPageData;
  t: Translator;
  lang: Lang;
  /** A link to the airport's transport page, when it has one (built by the page). */
  transportLink?: ReactNode;
}

/**
 * Price first (C-01): each car park against stays of 1, 3 and 7 days, server-rendered so it
 * works without JavaScript and reads no clock. Cells come from `priceRow`: a published tariff
 * gives an estimate, the record's daily maximum the most a stay can cost, and unverified rates
 * the range the sources' own daily maximums give. Every figure that is not from a tariff is marked
 * "not verified", and each row says so in the shared `rateLine` (round 4, 6.1.3). Premium parking
 * carries its warning in its own row. The booking link goes to the official parking page.
 */
export function ParkingPriceMatrix({ data, t, lang, transportLink }: ParkingPriceMatrixProps) {
  const rows = data.carParks.map((carPark) => ({ carPark, cells: priceRow(carPark) }));
  const allPublished = rows.every(({ cells }) => cells.every((cell) => cell.kind === 'estimate'));
  // E-17 hand-off (round 2): the answer state of the "parking price" top task, for the aggregate measurement.
  const noneKnown = rows.every(({ cells }) => cells.every((cell) => cell.kind === 'none'));
  const answerState = allPublished ? 'answered' : noneKnown ? 'not-published' : 'partial';
  const multi = data.terminals.length > 1;
  const money = (amount: number) => formatCurrency(amount, lang, { alwaysShowSen: !Number.isInteger(amount) });

  return (
    <section aria-labelledby="parking-prices-title" data-parking-matrix="" data-answer-task="parking-price" data-answer-state={answerState} className="flex flex-col gap-3">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 id="parking-prices-title" className="type-title-lg text-ink">
            {t('transportPages.matrix.title')}
          </h2>
          <ProvenanceTag provenance="estimated" length="short" />
        </div>
        <p className="type-body-sm mt-1 max-w-reading text-ink-2">{allPublished ? t('transportPages.matrix.leadPublished') : t('transportPages.matrix.leadCeiling')}</p>
      </div>

      {/* A scroll region, not `overflow-hidden`: at 320 px and 125% text the table is wider than
          the screen, and clipping hid the 7-day column and scrolled the page (verification round, A-16). */}
      <TableScroll label={t('transportPages.matrix.caption', { airport: data.airportName })} className="rounded-xl border border-line-strong bg-surface shadow-xs">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{t('transportPages.matrix.caption', { airport: data.airportName })}</caption>
          <colgroup>
            <col />
            {MATRIX_DAYS.map((days) => (
              <col key={days} className="sm:w-32" />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-line-strong bg-page-subtle">
              <th scope="col" className="type-caption py-2 pr-2 pl-3 font-semibold text-ink-2 sm:pl-4">
                {t('transportPages.parking.carPark')}
              </th>
              {MATRIX_DAYS.map((days) => (
                <th key={days} scope="col" className="type-caption px-2 py-2 text-right font-semibold text-ink-2 last:pr-3 sm:last:pr-4">
                  {t.count('common.units.days', days)}
                </th>
              ))}
            </tr>
          </thead>
          {rows.map(({ carPark, cells }) => (
            <tbody key={carPark.id} data-car-park={carPark.id} className="border-b border-line last:border-b-0">
              <tr>
                <th scope="row" className="py-2.5 pr-2 pl-3 align-top font-normal sm:pl-4">
                  <span className="type-body-sm block font-semibold text-ink">{carPark.name}</span>
                  <span className="type-caption mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ink-2">
                    {t(`transportPages.parking.types.${carPark.type}`)}
                    {multi && carPark.terminal ? <TerminalBadge terminal={carPark.terminal} size="sm" /> : null}
                  </span>
                </th>
                {cells.every((cell) => cell.kind === 'none') ? (
                  <td colSpan={MATRIX_DAYS.length} className="type-body-sm px-2 py-2.5 pr-3 text-right align-top font-medium text-ink-2 sm:pr-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="circle-dashed" size="sm" />
                      {t('transportPages.matrix.none')}
                    </span>
                  </td>
                ) : (
                  cells.map((cell, index) => <MatrixCell key={MATRIX_DAYS[index]} cell={cell} money={money} t={t} />)
                )}
              </tr>
              <tr>
                <td colSpan={MATRIX_DAYS.length + 1} className="px-3 pb-2.5 sm:px-4">
                  <RowNote carPark={carPark} cells={cells} data={data} t={t} />
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </TableScroll>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Measurement (round 4, 6.1.9): the main booking hand-off, like the car-park cards' links. */}
        <ExternalLink href={data.officialUrl} variant="action" className="type-body-sm font-semibold" data-handoff="parking-booking">
          {t('transportPages.parking.bookAction')}
        </ExternalLink>
        <a href="#parking-calculator-title" className="link-action type-body-sm text-ink">
          {t('transportPages.matrix.estimateYours')}
          <Icon name="arrow-down" size="sm" />
        </a>
        {transportLink}
      </div>
    </section>
  );
}

function MatrixCell({ cell, money, t }: { cell: PriceCell; money: (amount: number) => string; t: Translator }) {
  const base = 'type-data-sm px-1.5 py-2.5 text-right align-top whitespace-nowrap last:pr-3 sm:px-2 sm:last:pr-4';
  if (cell.kind === 'none') {
    return (
      <td className={cn(base, 'text-ink-2')}>
        <span aria-hidden="true">–</span>
        <span className="sr-only">{t('transportPages.matrix.none')}</span>
      </td>
    );
  }
  if (cell.kind === 'estimate') return <td className={cn(base, 'text-ink')}>{money(cell.amount)}</td>;
  const figure = cell.kind === 'ceiling' ? money(cell.amount) : cell.min === cell.max ? money(cell.max) : `${money(cell.min)}–${money(cell.max)}`;
  // Round 4 (6.1.3): a daily maximum is as unverified as a reported figure, so both are marked
  // alike; the row's note says so in words, with the sources.
  return (
    <td className={cn(base, 'text-ink-2')} data-rate-verified="false">
      <span aria-hidden="true">≤ </span>
      <span className="sr-only">{t('transportPages.matrix.atMost')} </span>
      {figure}
      <span className="sr-only"> ({t('transportPages.matrix.notVerified')})</span>
    </td>
  );
}

/** The line under a car park's figures: where they come from, or its warning. */
function RowNote({ carPark, cells, data, t }: { carPark: CarParkView; cells: PriceCell[]; data: ParkingPageData; t: Translator }) {
  const warning = carPark.type === 'preferred' ? data.premiumWarning : undefined;
  const kind = cells[0]?.kind ?? 'none';
  const reported = carPark.reported ?? [];

  if (warning) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-bg px-2.5 py-1.5 text-warning-fg">
        <Icon name="triangle-alert" size="sm" className="mt-0.5 shrink-0" />
        <p className="type-body-sm min-w-0">
          <span className="font-semibold">{warning.title}</span>{' '}
          <a href={`#car-park-${carPark.id}`} className="link whitespace-nowrap">
            {t('transportPages.matrix.seeDetails')}
          </a>
        </p>
      </div>
    );
  }

  // One fact, one answer (round 4, 6.1.3): the record's rate status in the words the concierge
  // and the help FAQ use; the source note beside it gives who says so and when.
  const sources = kind === 'reported' ? sourcesFor(reported.map((figure) => figure.sourceId), data.sources) : sourcesFor(carPark.sourceIds, data.sources);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
      <p className="type-caption min-w-0 text-ink-2" data-rate-line="">
        {carPark.rateLine}
      </p>
      <SourceNote sources={sources} />
      {kind !== 'estimate' ? (
        <ExternalLink href={carPark.officialUrl} variant="action" className="type-caption">
          {t('transportPages.matrix.check')}
        </ExternalLink>
      ) : null}
    </div>
  );
}
