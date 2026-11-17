import type { Lang, TrafficFigure } from '@/content';
import { SourceNote } from '@/components/common/source-note';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import type { Translator } from '@/lib/i18n';
import { formatChange, formatMillions, formatPartialDate, formatPeriod, resolveCorporateSources } from './corporate-data.server';
import { RowHeader } from './row-header';

/** Passenger statistics as reported, newest period first, every row with its sources. */
export function TrafficTable({ figures, lang, t }: { figures: readonly TrafficFigure[]; lang: Lang; t: Translator }) {
  return (
    <>
      <ul aria-label={t('corporatePages.media.tableCaption')} className="border-t border-line sm:hidden">
        {figures.map((figure) => (
          <li key={figure.id} className="border-b border-line py-4">
            <p className="type-caption font-semibold text-ink-2">
              {formatPeriod(figure.period, lang, t)} · {t(`corporatePages.media.scope.${figure.scope}`)}
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="type-data-lg text-ink">{formatMillions(figure.millions, lang, t, figure.qualifier)}</span>
              {figure.changePct === undefined ? null : <span className="type-data-sm text-ink-2">{formatChange(figure.changePct, lang)}</span>}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3">
              <span className="type-caption text-ink-3">{t('corporatePages.common.reported', { date: formatPartialDate(figure.reported, lang, 'medium') })}</span>
              <SourceNote sources={resolveCorporateSources(figure.sources)} />
            </div>
          </li>
        ))}
      </ul>
      <TableScroll label={t('corporatePages.media.tableCaption')} className="max-sm:hidden">
        <Table density="dense" className="min-w-[44rem]">
          <caption className="sr-only">{t('corporatePages.media.tableCaption')}</caption>
          <THead>
            <Tr>
              <Th>{t('corporatePages.media.colPeriod')}</Th>
              <Th>{t('corporatePages.media.colScope')}</Th>
              <Th numeric>{t('corporatePages.media.colPassengers')}</Th>
              <Th numeric>{t('corporatePages.media.colChange')}</Th>
              <Th>{t('corporatePages.media.colReported')}</Th>
              <Th>{t('corporatePages.media.colSources')}</Th>
            </Tr>
          </THead>
          <TBody>
            {figures.map((figure) => (
              <Tr key={figure.id}>
                <RowHeader className="h-row-dense py-2 whitespace-nowrap">
                  {formatPeriod(figure.period, lang, t)}
                </RowHeader>
                <Td>{t(`corporatePages.media.scope.${figure.scope}`)}</Td>
                <Td numeric mono className="whitespace-nowrap">
                  {formatMillions(figure.millions, lang, t, figure.qualifier)}
                </Td>
                <Td numeric mono className="whitespace-nowrap">
                  {figure.changePct === undefined ? <span className="font-sans text-ink-3">{t('corporatePages.common.notStated')}</span> : formatChange(figure.changePct, lang)}
                </Td>
                <Td className="whitespace-nowrap">{formatPartialDate(figure.reported, lang, 'medium')}</Td>
                <Td>
                  <SourceNote sources={resolveCorporateSources(figure.sources)} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </TableScroll>
    </>
  );
}
