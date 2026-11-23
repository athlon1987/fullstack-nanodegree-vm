'use client';

import type { AnswerCard, CarParkCard, FacilityCard, FlightCard, OutletCard, TransportCard } from '@/lib/concierge/types';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { formatTime } from '@/lib/time';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { LocaleLink } from '@/components/common/locale-link';
import { NotPublished } from '@/components/common/not-published';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';

const CARD = 'flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="type-caption text-ink-2">{label}</dt>
      <dd className="type-body-sm text-ink">{children}</dd>
    </div>
  );
}

function DetailsLink({ href, name }: { href?: string; name: string }) {
  const t = useT();
  if (!href) return null;
  return (
    <LocaleLink href={href} aria-label={t('conciergePage.answer.detailsFor', { name })} className="link-action type-body-sm inline-flex items-center gap-1.5">
      {t('conciergePage.answer.details_link')}
      <Icon name="arrow-right" size="sm" />
    </LocaleLink>
  );
}

function CardHead({ icon, title, meta }: { icon: string; title: string; meta?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="type-title-sm text-ink">{title}</h4>
        {meta ? <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</div> : null}
      </div>
    </div>
  );
}

function useZone() {
  const t = useT();
  return (zone: FacilityCard['zone']): string | undefined =>
    zone === 'airside' ? t('common.labels.airside') : zone === 'landside' ? t('common.labels.landside') : zone === 'both' ? t('conciergePage.answer.zoneBoth') : undefined;
}

function Flight({ card }: { card: FlightCard }) {
  const t = useT();
  const delayed = card.estimated !== card.scheduled;
  return (
    <div className="surface-board flex min-w-0 flex-col gap-3 rounded-2xl bg-board p-4 text-board-ink shadow-md sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="type-data-lg text-board-ink">{card.number}</h4>
          <p className="type-body-sm text-board-dim">
            {card.airline} · {t(card.direction === 'd' ? 'common.labels.to' : 'common.labels.from')} {card.place}
          </p>
        </div>
        <FlightStatusChip status={card.status} size="sm" />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 xs:grid-cols-4">
        <div>
          <dt className="type-caption text-board-dim">{t('conciergePage.answer.flight.scheduled')}</dt>
          <dd className={cn('type-data-md', delayed ? 'text-board-dim line-through' : 'text-board-accent')}>{formatTime(card.scheduled)}</dd>
        </div>
        {delayed ? (
          <div>
            <dt className="type-caption text-board-dim">{t('conciergePage.answer.flight.expected')}</dt>
            <dd className="type-data-md text-board-accent">{formatTime(card.estimated)}</dd>
          </div>
        ) : null}
        <div>
          <dt className="type-caption text-board-dim">{t('common.labels.terminal')}</dt>
          <dd className="type-body-sm text-board-ink">{card.terminalLabel}</dd>
        </div>
        <div>
          <dt className="type-caption text-board-dim">{t(card.direction === 'd' ? 'common.labels.gate' : 'common.labels.belt')}</dt>
          <dd className="type-data-sm text-board-ink">{(card.direction === 'd' ? card.gate : card.belt) ?? '—'}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ProvenanceTag provenance="demo" length="short" />
        <LocaleLink href={card.href} className="link-action type-body-sm inline-flex items-center gap-1.5 text-board-ink">
          {t('conciergePage.answer.flight.open')}
          <Icon name="arrow-right" size="sm" />
        </LocaleLink>
      </div>
    </div>
  );
}

function Facility({ card }: { card: FacilityCard }) {
  const t = useT();
  const zone = useZone()(card.zone);
  return (
    <div className={CARD}>
      <CardHead
        icon={card.category}
        title={card.name}
        meta={<><ProvenanceTag provenance={card.provenance} length="short" /><Badge size="sm" variant="label">{card.place}</Badge>{zone ? <Badge size="sm" variant="label">{zone}</Badge> : null}</>}
      />
      {card.description ? <p className="type-body text-ink-2">{card.description}</p> : null}
      {card.location || card.hours ? (
        <dl className="grid gap-2">
          {card.location ? <Fact label={t('common.labels.location')}>{card.location}</Fact> : null}
          {card.hours ? <Fact label={t('common.labels.hours')}>{card.hours}</Fact> : null}
        </dl>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-x-4">
        <DetailsLink href={card.href} name={card.name} />
        {card.mapHref ? (
          <LocaleLink href={card.mapHref} className="link-action type-body-sm inline-flex items-center gap-1.5">
            <Icon name="map" size="sm" />
            {t('conciergePage.answer.viewMap')}
          </LocaleLink>
        ) : null}
      </div>
    </div>
  );
}

function Outlet({ card }: { card: OutletCard }) {
  const t = useT();
  const zone = useZone()(card.zone);
  return (
    <div className={CARD}>
      <CardHead
        icon="utensils"
        title={card.name}
        meta={<><ProvenanceTag provenance={card.provenance} length="short" /><Badge size="sm" variant="label">{card.place}</Badge>{card.halal ? <Badge size="sm" variant="label" className="bg-positive-bg text-positive-fg">{t(`conciergePage.answer.halal.${card.halal}`)}</Badge> : null}</>}
      />
      {card.description ? <p className="type-body text-ink-2">{card.description}</p> : null}
      <dl className="grid gap-2">
        <Fact label={t('common.labels.location')}>{card.location ?? zone ?? <NotPublished />}</Fact>
        {card.hours ? <Fact label={t('common.labels.hours')}>{card.hours}</Fact> : null}
      </dl>
      <div className="mt-auto">
        <DetailsLink href={card.href} name={card.name} />
      </div>
    </div>
  );
}

function Transport({ card }: { card: TransportCard }) {
  const t = useT();
  return (
    <div className={CARD}>
      <CardHead
        icon={card.mode}
        title={card.name}
        meta={<><ProvenanceTag provenance={card.provenance} length="short" /><Badge size="sm" variant="label">{card.modeLabel}</Badge>{card.highlight ? <Badge size="sm" variant="label" className="bg-positive-bg text-positive-fg">{t(card.highlight === 'lowest-fare' ? 'conciergePage.answer.lowestFare' : 'conciergePage.answer.quickest')}</Badge> : null}</>}
      />
      {card.rows.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line">
          {card.rows.map((row) => (
            <li key={row.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 first:pt-0 last:pb-0">
              <span className="type-body-sm min-w-0 flex-1 basis-40 text-ink">{row.name}</span>
              <span className="type-data-sm flex shrink-0 gap-3 text-ink">
                {row.fare ? <span><span className="sr-only">{t('conciergePage.answer.fare')}: </span>{row.fare}</span> : <NotPublished label={`${t('conciergePage.answer.fare')}: ${t('common.labels.notPublished')}`} />}
                {row.duration ? <span><span className="sr-only">{t('conciergePage.answer.duration')}: </span>{row.duration}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {card.frequency ? <p className="type-body-sm text-ink-2">{card.frequency}</p> : null}
      <div className="mt-auto">
        <DetailsLink href={card.href} name={card.name} />
      </div>
    </div>
  );
}

function CarPark({ card }: { card: CarParkCard }) {
  const t = useT();
  return (
    <div className={CARD}>
      <CardHead icon="square-parking" title={card.name} meta={<><ProvenanceTag provenance={card.estimate ? 'estimated' : card.provenance} length="short" /><Badge size="sm" variant="label">{card.place}</Badge></>} />
      <dl className="grid gap-2">
        <Fact label={card.estimate ? t('conciergePage.answer.estimate') : t('conciergePage.answer.rates')}>
          {/* One fact, one answer (round 4, 6.1.3): the rate status in the parking page's words. */}
          {card.estimate ? (
            <span className="type-data-md">{card.estimate}</span>
          ) : card.rateMissing ? (
            <NotPublished officialUrl={card.officialUrl} label={card.rateText} />
          ) : (
            <span data-rate-line="">{card.rateText}</span>
          )}
        </Fact>
      </dl>
      <div className="mt-auto">
        <DetailsLink href={card.href} name={card.name} />
      </div>
    </div>
  );
}

/** The cards of an answer: flights, places, transport options and car parks. */
export function ConciergeCards({ cards, className }: { cards: readonly AnswerCard[]; className?: string }) {
  if (cards.length === 0) return null;
  return (
    // Polish (critique-redesign2 item 12): one card per row at the conversation's width.
    <ul className={cn('grid gap-3', className)}>
      {cards.map((card) => (
        <li key={`${card.type}:${card.id}`} className={cn('flex min-w-0', card.type === 'flight' && '@lg:col-span-2')}>
          <div className="flex w-full min-w-0 flex-col [&>*]:flex-1">
            {card.type === 'flight' ? <Flight card={card} /> : null}
            {card.type === 'facility' ? <Facility card={card} /> : null}
            {card.type === 'outlet' ? <Outlet card={card} /> : null}
            {card.type === 'transport' ? <Transport card={card} /> : null}
            {card.type === 'car-park' ? <CarPark card={card} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
