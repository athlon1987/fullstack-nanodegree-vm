import type { ReactNode } from 'react';
import type { Lang } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { Translator } from '@/lib/i18n/translate';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionSourceList } from '@/components/common/section-source-list';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { sourcesFor } from '@/components/transport/transport-types';
import { Icon } from '@/components/ui/icon';
import { buttonClasses } from '@/components/ui/button';
import { SERVICE_TOOL } from '@/components/facilities/service-frame';
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
    <section aria-labelledby="parking-prices-title" data-parking-matrix="" data-answer-task="parking-price" data-answer-state={answerState} className={cn(SERVICE_TOOL, 'flex flex-col overflow-hidden')}>
      {/* Redesign stage two: the answer of the page in one raised panel (heading, table, sources and
          the booking hand-off), the table full bleed inside it. */}
      <div className="px-4 pt-5 pb-4 sm:px-7 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <h2 id="parking-prices-title" className="type-display-sm text-ink">
            {t('transportPages.matrix.title')}
          </h2>
          <ProvenanceTag provenance="estimated" length="short" />
        </div>
        <p className="type-body-sm mt-1.5 max-w-reading text-ink-2">{allPublished ? t('transportPages.matrix.leadPublished') : t('transportPages.matrix.leadCeiling')}</p>
      </div>

      {/* A scroll region, not `overflow-hidden`: at 320 px and 125% text the table is wider than
          the screen, and clipping hid the 7-day column and scrolled the page (verification round, A-16). */}
      <TableScroll label={t('transportPages.matrix.caption', { airport: data.airportName })} className="border-y border-line">
        {/* Polish (critique-redesign2 item 8): below 640 px each car park is a small grid, its name
            across the full width and the three stays as three equal cells under it, instead of a
            134 px name column three lines tall. Grid on the rows only: the markup stays a table. */}
        <table className="w-full border-collapse text-left max-sm:block max-sm:[&_tbody]:block max-sm:[&_thead]:block max-sm:[&_tr]:grid max-sm:[&_tr]:grid-cols-3">
          <caption className="sr-only">{t('transportPages.matrix.caption', { airport: data.airportName })}</caption>
          <colgroup>
            <col />
            {MATRIX_DAYS.map((days) => (
              <col key={days} className="sm:w-32" />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-page-subtle">
              <th scope="col" className="type-caption py-2.5 pr-2 pl-4 font-semibold text-ink-2 max-sm:sr-only sm:pl-7">
                {t('transportPages.parking.carPark')}
              </th>
              {MATRIX_DAYS.map((days) => (
                <th key={days} scope="col" className="type-caption px-1 py-2.5 text-right font-semibold text-ink-2 last:pr-4 sm:px-2 sm:last:pr-7">
                  {t.count('common.units.days', days)}
                </th>
              ))}
            </tr>
          </thead>
          {rows.map(({ carPark, cells }) => (
            <tbody key={carPark.id} data-car-park={carPark.id} className="border-b border-line last:border-b-0">
              <tr>
                <th scope="row" className="pt-3.5 pr-2 pb-2 pl-4 align-top font-normal max-sm:col-span-3 max-sm:pr-4 max-sm:pb-1 sm:pl-7">
                  <span className="type-body-sm sm:type-title-sm block font-semibold text-ink">{carPark.name}</span>
                  <span className="type-caption mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ink-2">
                    {t(`transportPages.parking.types.${carPark.type}`)}
                    {multi && carPark.terminal ? <TerminalBadge terminal={carPark.terminal} size="sm" /> : null}
                  </span>
                </th>
                {cells.every((cell) => cell.kind === 'none') ? (
                  <td colSpan={MATRIX_DAYS.length} className="type-body-sm px-2 pt-3.5 pb-2 pr-4 text-right align-top font-medium text-ink-2 max-sm:col-span-3 max-sm:pt-1 max-sm:pl-4 max-sm:text-left sm:pr-7">
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
                <td colSpan={MATRIX_DAYS.length + 1} className="px-4 pb-3.5 max-sm:col-span-3 sm:px-7">
                  <RowNote carPark={carPark} cells={cells} data={data} t={t} />
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </TableScroll>

      {/* Round 5 (A-14, 6.1.7): one source list for the table (each source names its car parks),
          instead of a toggle under every row. */}
      <div className="flex flex-col gap-4 px-4 pt-3 pb-5 sm:px-7 sm:pb-6">
        <SectionSourceList items={rows.filter(({ carPark }) => carPark.type !== 'preferred' || !data.premiumWarning).map(({ carPark, cells }) => ({ name: carPark.name, sources: rowSources(carPark, cells, data) }))} />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Measurement (round 4, 6.1.9): the main booking hand-off, like the car-park cards' links.
              Redesign stage two: the page's one primary action. */}
          <ExternalLink href={data.officialUrl} variant="plain" className={buttonClasses({ variant: 'primary' })} data-handoff="parking-booking">
            {t('transportPages.parking.bookAction')}
          </ExternalLink>
          <a href="#parking-calculator-title" className="link-action type-body-sm text-ink">
            {t('transportPages.matrix.estimateYours')}
            <Icon name="arrow-down" size="sm" />
          </a>
          {transportLink}
        </div>
      </div>
    </section>
  );
}

/**
 * Polish (critique-redesign2 item 8): parking's key answer beside the title, as the other service
 * pages have one: the lowest one-day figure in the matrix below, with the same "Estimated" tag and
 * the same qualifier (a daily maximum is "at most, not verified"), the car park it belongs to and
 * the booking hand-off. Renders nothing when no car park has a figure.
 */
export function ParkingKeyAnswer({ data, t, lang }: Omit<ParkingPriceMatrixProps, 'transportLink'>) {
  const money = (amount: number) => formatCurrency(amount, lang, { alwaysShowSen: !Number.isInteger(amount) });
  const best = data.carParks
    .flatMap((carPark) => {
      const cell = priceRow(carPark)[0];
      if (!cell || cell.kind === 'none') return [];
      const amount = cell.kind === 'reported' ? cell.min : cell.amount;
      return [{ carPark, cell, amount }];
    })
    .sort((a, b) => a.amount - b.amount)[0];
  if (!best) return null;
  const verified = best.cell.kind === 'estimate';

  return (
    // Below 1024 px the price matrix itself follows the title (C-01: the matrix on the first phone
    // screen), so this summary of it is for the wide intro only.
    <section aria-labelledby="parking-answer-title" data-parking-answer="" className={cn(SERVICE_TOOL, 'p-5 max-lg:hidden sm:p-6')}>
      {/* The qualifier is said in words under the figure (the matrix carries the "Estimated" tag). */}
      <h2 id="parking-answer-title" className="type-title-md text-ink">
        {t('transportPages.frame.parkingAnswerTitle')}
      </h2>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-ink">
        {verified ? null : (
          <>
            <span aria-hidden="true" className="type-display-sm text-ink-2">
              ≤
            </span>
            <span className="sr-only">{t('transportPages.matrix.atMost')} </span>
          </>
        )}
        <span className="type-display-sm tabular-nums">{best.cell.kind === 'reported' && best.cell.min !== best.cell.max ? `${money(best.cell.min)}–${money(best.cell.max)}` : money(best.amount)}</span>
        <span className="type-body text-ink-2">{t('transportPages.frame.parkingAnswerPerDay')}</span>
      </p>
      <p className="type-title-sm mt-1 text-ink">{best.carPark.name}</p>
      <p className="type-caption mt-0.5 text-ink-2">{t(verified ? 'transportPages.frame.parkingAnswerEstimate' : 'transportPages.frame.parkingAnswerAtMost')}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <ExternalLink href={data.officialUrl} variant="plain" className={buttonClasses({ variant: 'primary' })} data-handoff="parking-booking">
          {t('transportPages.parking.bookAction')}
        </ExternalLink>
        <a href="#parking-prices-title" className="link-action type-body-sm text-ink">
          {t('transportPages.frame.parkingAnswerCompare')}
          <Icon name="arrow-down" size="sm" />
        </a>
      </div>
    </section>
  );
}

function MatrixCell({ cell, money, t }: { cell: PriceCell; money: (amount: number) => string; t: Translator }) {
  const base = 'type-data-sm sm:type-data-md px-1 pt-3.5 pb-2 text-right align-top whitespace-nowrap last:pr-4 max-sm:pt-1 sm:px-2 sm:last:pr-7';
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

  if (warning) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-warning-border/40 bg-warning-bg px-3 py-2 text-warning-fg hc:border-warning-border">
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
  // and the help FAQ use; who says so and when is in the table's source list (round 5).
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
      <p className="type-caption min-w-0 text-ink-2" data-rate-line="">
        {carPark.rateLine}
      </p>
      {kind !== 'estimate' ? (
        <ExternalLink href={carPark.officialUrl} variant="action" className="type-caption">
          {t('transportPages.matrix.check')}
        </ExternalLink>
      ) : null}
    </div>
  );
}

/** The sources behind a row's figures: the reported figures' own sources, else the car park's. */
function rowSources(carPark: CarParkView, cells: PriceCell[], data: ParkingPageData) {
  const reported = carPark.reported ?? [];
  return (cells[0]?.kind ?? 'none') === 'reported' ? sourcesFor(reported.map((figure) => figure.sourceId), data.sources) : sourcesFor(carPark.sourceIds, data.sources);
}
