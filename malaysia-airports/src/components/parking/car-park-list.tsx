'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import type { TerminalId } from '@/content/types';
import { formatCurrency, formatList } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { getParkingAvailabilityProvider, type ParkingAvailability } from '@/lib/providers';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { Freshness } from '@/components/common/freshness';
import { NotPublished } from '@/components/common/not-published';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Table, TableScroll, TBody, Th, THead, Tr } from '@/components/ui/table';
import { CarParkCard } from './car-park-card';
import { AvailabilityValue, baysText, walkText, YesNo } from './car-park-values';
import type { ParkingPageData } from './parking-types';

export interface CarParkListProps {
  data: ParkingPageData;
  /** Show the car parks of this terminal, and those not tied to one. */
  terminal?: TerminalId;
  /** The same page without the terminal filter (with the locale). */
  allHref?: string;
}

const CELL = 'px-3 py-3 align-top first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5';
const REFRESH_MS = 60_000;

/**
 * The car parks, as cards or a comparison table, with simulated space from the
 * ParkingAvailabilityProvider under the demo banner. Honours the airport's terminal filter.
 */
export function CarParkList({ data, terminal, allHref }: CarParkListProps) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const now = useNow(REFRESH_MS);
  const carParks = terminal ? data.carParks.filter((carPark) => !carPark.terminal || carPark.terminal === terminal) : data.carParks;
  const multi = data.terminals.length > 1;
  const terminalLabel = terminal ? data.terminals.find((item) => item.id === terminal)?.label : undefined;

  const provider = useMemo(() => (now === null ? null : getParkingAvailabilityProvider(now)), [now]);
  const availability = useMemo(() => {
    if (!provider) return null;
    const rows = provider.getAvailabilitySync({ airport: data.slug, carParks: data.carParks.map((carPark) => ({ id: carPark.id, bays: carPark.bays })) });
    return new Map<string, ParkingAvailability>(rows.map((row) => [row.carParkId, row]));
  }, [provider, data.slug, data.carParks]);
  const spaceFor = (carParkId: string): ParkingAvailability | null => availability?.get(carParkId) ?? null;
  const caption = t('transportPages.parking.tableCaption', { airport: data.airportName });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <DemoDataBanner compact>{provider?.meta().disclaimer[lang] ?? t('demo.availabilityNote')}</DemoDataBanner>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="type-body-sm font-semibold text-ink">{t.count('transportPages.parking.count', carParks.length)}</p>
            {terminalLabel ? (
              <p className="type-body-sm mt-1 flex flex-wrap items-center gap-x-3 text-ink-2">
                <Icon name="list-filter" size="sm" />
                {t('transportPages.parking.terminalFilter', { terminal: terminalLabel })}
                {allHref ? (
                  <Link href={allHref} scroll={false} className="link-action text-ink">
                    {t('transportPages.parking.showAll')}
                  </Link>
                ) : null}
              </p>
            ) : null}
            <Freshness updatedAt={provider?.meta().generatedAt ?? null} refreshSeconds={REFRESH_MS / 1000} context={t('transportPages.availability.context')} live="off" className="mt-1" />
          </div>
          <SegmentedControl
            label={t('transportPages.planner.view')}
            name={`${id}-view`}
            value={view}
            onValueChange={setView}
            options={[
              { value: 'cards', label: t('transportPages.planner.viewCards'), icon: 'layers' },
              { value: 'table', label: t('transportPages.planner.viewTable'), icon: 'menu' },
            ]}
            className="shrink-0"
          />
        </div>
      </div>

      {view === 'table' ? (
        <TableScroll label={caption} className="rounded-xl border border-line-strong bg-surface">
          <Table density="dense" className="min-w-[60rem]">
            <caption className="sr-only">{caption}</caption>
            <THead>
              <Tr>
                <Th>{t('transportPages.parking.carPark')}</Th>
                <Th>{t('transportPages.parking.fields.bays')}</Th>
                <Th>{t('transportPages.parking.fields.access')}</Th>
                <Th>{t('transportPages.parking.fields.accessibleBays')}</Th>
                <Th>{t('transportPages.parking.fields.ev')}</Th>
                <Th>{t('transportPages.parking.fields.payment')}</Th>
                <Th>{t('transportPages.parking.fields.rates')}</Th>
                <Th>{t('transportPages.availability.title')}</Th>
              </Tr>
            </THead>
            <TBody>
              {carParks.map((carPark) => {
                const bays = baysText(carPark, lang);
                const walk = walkText(carPark, t);
                return (
                  <Tr key={carPark.id}>
                    <th scope="row" className={`${CELL} w-56 text-left font-normal`}>
                      <span className="type-body-sm block font-semibold text-ink">{carPark.name}</span>
                      <span className="type-caption mt-1 flex flex-wrap items-center gap-2 text-ink-2">
                        {t(`transportPages.parking.types.${carPark.type}`)}
                        {multi && carPark.terminal ? <TerminalBadge terminal={carPark.terminal} size="sm" /> : null}
                      </span>
                      {carPark.type === 'preferred' ? (
                        <span className="type-caption mt-1.5 flex items-start gap-1.5 font-semibold text-warning-fg">
                          <Icon name="triangle-alert" size="xs" className="mt-0.5 shrink-0" />
                          {data.premiumWarning?.title ?? t('transportPages.parking.longStayCheck')}
                        </span>
                      ) : null}
                    </th>
                    <td className={`${CELL} type-data-sm text-ink`}>{bays ?? <NotPublished />}</td>
                    <td className={`${CELL} w-48`}>{walk ? <span className="type-body-sm text-ink">{walk}</span> : <NotPublished />}</td>
                    <td className={CELL}>{carPark.accessibleBays === undefined ? <NotPublished /> : <YesNo value={carPark.accessibleBays} icon="accessibility" />}</td>
                    <td className={CELL}>{carPark.evCharging === undefined ? <NotPublished /> : <YesNo value={carPark.evCharging} icon="plug-zap" />}</td>
                    <td className={CELL}>{carPark.payment?.length ? <span className="type-body-sm text-ink">{formatList(carPark.payment, lang)}</span> : <NotPublished />}</td>
                    <td className={CELL}>
                      <span className="flex flex-col items-start gap-1">
                        {carPark.rateStatus === 'published' ? (
                          <Chip tone="positive" icon="badge-check">
                            {t('transportPages.parking.ratesPublished')}
                          </Chip>
                        ) : (
                          <Chip tone="warning" icon="circle-alert">
                            {t('transportPages.parking.ratesNotVerified')}
                          </Chip>
                        )}
                        {carPark.dailyMax !== undefined ? (
                          <span className="type-caption text-ink-2">
                            {t('transportPages.parking.fields.dailyMax')}: <span className="type-data-xs text-ink">{formatCurrency(carPark.dailyMax, lang)}</span>
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className={`${CELL} w-52`}>
                      <AvailabilityValue availability={spaceFor(carPark.id)} />
                    </td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </TableScroll>
      ) : (
        <ul className="grid items-start gap-4 lg:grid-cols-2">
          {carParks.map((carPark) => (
            <li key={carPark.id} className="min-w-0">
              <CarParkCard
                carPark={carPark}
                sources={data.sources}
                timezone={data.timezone}
                availability={spaceFor(carPark.id)}
                showTerminal={multi}
                premiumWarning={data.premiumWarning}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
