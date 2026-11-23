'use client';

import { pick, TRANSPORT_MODE_LABELS } from '@/content/values';
import type { TerminalId, TransportOption } from '@/content/types';
import { useLang, useT } from '@/lib/i18n/client';
import { NotPublished } from '@/components/common/not-published';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Icon } from '@/components/ui/icon';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { fareInfo } from './transport-logic';
import type { TransportContext } from './transport-types';
import { AccessValue, AsOf, BoardingList, DurationValue, FareFigure, FareTimeline, FrequencyValue, HoursValue, PaymentValue } from './transport-values';

export interface TransportTableRow {
  option: TransportOption;
  rank: number;
}

export interface TransportTableProps {
  rows: readonly TransportTableRow[];
  placeKey?: string;
  context: TransportContext;
  day: string | null;
  terminal?: TerminalId;
  caption: string;
}

const CELL = 'px-3 py-3 align-top first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5';

/**
 * The ranked options side by side, with provenance and sources in each row header. The card view
 * has the descriptions and notes. The table scrolls inside its labelled region on narrow screens.
 */
export function TransportTable({ rows, placeKey, context, day, terminal, caption }: TransportTableProps) {
  const t = useT();
  const lang = useLang();
  return (
    <TableScroll label={caption} className="relative rounded-2xl border border-line bg-surface shadow-sm">
      <Table density="dense" className="min-w-[64rem]">
        <caption className="sr-only">{caption}</caption>
        <THead>
          <Tr>
            <Th numeric>
              <span className="sr-only">{t('transportPages.planner.rankHeader')}</span>
              <span aria-hidden="true">#</span>
            </Th>
            <Th>{t('transportPages.planner.option')}</Th>
            <Th>{t('transportPages.fields.fare')}</Th>
            <Th>{t('transportPages.fields.time')}</Th>
            <Th>
              {t('transportPages.fields.frequency')} / {t('transportPages.fields.hours')}
            </Th>
            <Th>{t('transportPages.fields.boarding')}</Th>
            <Th>{t('transportPages.fields.payment')}</Th>
            <Th>{t('transport.stepFree')}</Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map(({ option, rank }) => {
            const info = fareInfo(option, placeKey, day);
            return (
              <Tr key={option.id}>
                <Td numeric className="type-data-sm align-top pt-3.5 text-ink-2">
                  {rank}
                </Td>
                <th scope="row" className={`${CELL} w-60 text-left font-normal`}>
                  <span className="flex items-start gap-2.5">
                    <Icon name={option.mode} size="sm" className="mt-0.5 shrink-0 text-ink-2" />
                    <span className="min-w-0">
                      <span className="type-body-sm block font-semibold text-ink">{pick(option.name, lang)}</span>
                      <span className="type-caption mt-0.5 block text-ink-2">
                        {pick(TRANSPORT_MODE_LABELS[option.mode], lang)}
                        {option.operator ? ` · ${option.operator}` : null}
                      </span>
                      <ProvenanceTag provenance={option.provenance} length="short" className="mt-1.5" />
                      {/* Round 4 (A-14): the sources are listed once under the table, with the options they back. */}
                      {option.asOf ? <AsOf value={option.asOf} timeZone={context.timezone} className="py-0" /> : null}
                    </span>
                  </span>
                </th>
                <td className={`${CELL} w-44`}>
                  <FareFigure info={info} context={context} size="md" shortLabel />
                  <FareTimeline info={info} context={context} compact />
                </td>
                <td className={`${CELL} w-32`}>
                  <DurationValue info={info} shortLabel />
                </td>
                <td className={`${CELL} w-56`}>
                  {option.hours || option.frequency || option.frequencyMinutes !== undefined ? (
                    <span className="flex flex-col gap-2">
                      <FrequencyValue option={option} />
                      <HoursValue hours={option.hours} />
                    </span>
                  ) : (
                    <NotPublished />
                  )}
                </td>
                <td className={`${CELL} w-64`}>
                  <BoardingList option={option} context={context} terminal={terminal} compact />
                </td>
                <td className={CELL}>
                  <PaymentValue option={option} shortLabel />
                </td>
                <td className={CELL}>
                  <AccessValue option={option} compact />
                </td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </TableScroll>
  );
}
