'use client';

import Image from 'next/image';
import { pick, TRANSPORT_MODE_LABELS } from '@/content/values';
import type { TerminalId, TransportOption } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatList } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import { MoreOnPhones } from '@/components/common/more-on-phones';
import { NotPublished } from '@/components/common/not-published';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { objectPosition, placeholderProps } from '@/components/ui/media';
import { SERVICE_CARD, SERVICE_ICON } from '@/components/facilities/service-frame';
import { fareInfo } from './transport-logic';
import { ToutsWarning } from './touts-warning';
import { officialSourceUrl, sourcesFor, ticketChannel, type TransportContext } from './transport-types';
import { AccessValue, AsOf, BoardingList, DurationValue, Fact, FareFigure, FareTimeline, FrequencyValue, HoursValue, PaymentValue } from './transport-values';

/** Remarks worth a chip on a ranked card. */
export type TransportHighlight = 'lowest-fare' | 'shortest-time';

export interface TransportOptionCardProps {
  /** The option as published, with every fare period. */
  option: TransportOption;
  /** Lower-case English place name the figures are for; the option's first place when omitted. */
  placeKey?: string;
  context: TransportContext;
  /** Airport-local date key, or null before the clock is read. */
  day: string | null;
  /** Show boarding points at this terminal only. */
  terminal?: TerminalId;
  /** Position in the ranked list (shown, and announced by the surrounding `<ol>`). */
  rank?: number;
  highlights?: readonly TransportHighlight[];
  /** The list states this provenance once (`ProvenanceDefault`): no tag of its own when it matches (A-14). */
  defaultProvenance?: TransportOption['provenance'];
  headingLevel?: 2 | 3;
  /** Round 4 (A-14): the section lists the sources once, with what each supports: none on the card. */
  groupedSources?: boolean;
  className?: string;
}

/**
 * One way to travel: fare (with the period that applies today and the next change), journey time,
 * frequency, hours, where to board, payment, accessibility, provenance and sources. Anything not
 * published says so.
 */
export function TransportOptionCard({ option, placeKey, context, day, terminal, rank, highlights = [], defaultProvenance, headingLevel = 3, groupedSources = false, className }: TransportOptionCardProps) {
  const t = useT();
  const lang = useLang();
  const Heading = `h${headingLevel}` as const;
  const info = fareInfo(option, placeKey, day);
  const titleId = `transport-${option.id}-title`;
  const photo = context.photos?.[option.id];
  const official = officialSourceUrl(option.sources, context.sources);
  const tickets = ticketChannel(option, context.sources);
  const note = info.doorToDoor ? undefined : info.shown?.note ?? info.place?.periods[0]?.destination.note;
  const route = info.doorToDoor ? t('transportPages.planner.doorToDoor') : info.place ? pick(info.place.name, lang) : undefined;
  const hasHours = option.hours !== undefined;
  const hasFrequency = option.frequency !== undefined || option.frequencyMinutes !== undefined;
  const hasPayment = (option.payment?.length ?? 0) > 0;
  const missing = [
    hasFrequency ? undefined : t('transportPages.fields.missingNames.frequency'),
    hasHours ? undefined : t('transportPages.fields.missingNames.hours'),
    hasPayment ? undefined : t('transportPages.fields.missingNames.payment'),
  ].filter((item): item is string => item !== undefined);

  return (
    <article
      id={`transport-${option.id}`}
      aria-labelledby={titleId}
      className={cn(SERVICE_CARD, '@container min-w-0 scroll-mt-32 overflow-hidden', className)}
    >
      <div className="flex h-full min-w-0 flex-col @3xl:flex-row">
        {/* Redesign stage two: the service's own photograph where the library has one (the KLIA
            Ekspres train); every other option keeps its icon. A band on top in a narrow card, a
            column beside the facts in a wide one; its size is reserved, so nothing moves while it loads. */}
        {photo ? (
          <div className="relative isolate h-40 shrink-0 overflow-hidden bg-fill @3xl:h-auto @3xl:min-h-64 @3xl:w-72">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 64rem) 18rem, 100vw"
              quality={60}
              {...placeholderProps(photo)}
              style={{ objectPosition: objectPosition(photo.focal) }}
              className="-z-10 object-cover"
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-5 p-5 sm:p-6 @2xl:flex-row @2xl:items-start @2xl:justify-between @2xl:gap-8">
            <div className="flex min-w-0 items-start gap-3.5">
              {rank ? (
                <span aria-hidden="true" className="type-data-sm mt-3 flex size-7 shrink-0 items-center justify-center rounded-pill bg-ink text-page">
                  {rank}
                </span>
              ) : null}
              <span className={SERVICE_ICON}>
                <Icon name={option.mode} />
              </span>
              <div className="min-w-0">
                <Heading id={titleId} className="type-title-lg text-ink">
                  {pick(option.name, lang)}
                </Heading>
                <p className="type-body-sm mt-0.5 text-ink-2">
                  {pick(TRANSPORT_MODE_LABELS[option.mode], lang)}
                  {option.operator ? ` · ${option.operator}` : null}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 empty:hidden">
                  {option.provenance !== defaultProvenance ? <ProvenanceTag provenance={option.provenance} /> : null}
                  {highlights.includes('lowest-fare') ? (
                    <Chip tone="positive" icon="coins">
                      {t('transportPages.planner.lowestFare')}
                    </Chip>
                  ) : null}
                  {highlights.includes('shortest-time') ? (
                    <Chip tone="positive" icon="timer">
                      {t('transportPages.planner.shortestTime')}
                    </Chip>
                  ) : null}
                </div>
              </div>
            </div>

            {/* The two answers, large: what it costs and how long it takes. Side by side while the
                figures fit, stacked when they do not ("Percuma" broke in a 115 px column at 360 px
                and 125% text). */}
            <dl className="grid shrink-0 grid-cols-[repeat(auto-fit,minmax(min(100%,7.5rem),1fr))] gap-x-6 gap-y-3 rounded-2xl bg-page-subtle px-4 py-3.5 @2xl:w-80">
              <Fact label={info.dated && info.status ? t('transportPages.fields.fareToday') : t('transportPages.fields.fare')}>
                <FareFigure info={info} context={context} shortLabel />
              </Fact>
              <Fact label={t('transportPages.fields.time')}>
                <DurationValue info={info} shortLabel size="lg" />
              </Fact>
            </dl>
          </div>

          {info.dated ? (
            <div className="border-t border-line px-5 py-3.5 sm:px-6">
              <FareTimeline info={info} context={context} />
            </div>
          ) : null}

          <div className="flex flex-col gap-5 border-t border-line px-5 py-4 sm:px-6 sm:py-5">
            {option.mode === 'taxi' || option.mode === 'e-hailing' ? <ToutsWarning context={context} variant="inline" mode={option.mode} /> : null}
            {/* Round 6 (review-3 9.1 item 7): on phones the details sit behind a disclosure that names
                them, so the page is a list of options with fares and times first (11,952 px at 390 px). */}
            <MoreOnPhones from="card" summary={t('transportPages.fields.moreDetails')} contentClassName="flex flex-col gap-5">
              {option.description ? <p className="type-body-sm max-w-reading text-ink-2">{pick(option.description, lang)}</p> : null}
              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 @md:grid-cols-2 @4xl:grid-cols-4">
                {route ? (
                  <Fact label={t('transportPages.fields.route')}>
                    <span className="type-body-sm text-ink">{route}</span>
                  </Fact>
                ) : null}
                {hasFrequency ? (
                  <Fact label={t('transportPages.fields.frequency')}>
                    <FrequencyValue option={option} />
                  </Fact>
                ) : null}
                {hasHours ? (
                  <Fact label={t('transportPages.fields.hours')}>
                    <HoursValue hours={option.hours} />
                  </Fact>
                ) : null}
                {hasPayment ? (
                  <Fact label={t('transportPages.fields.payment')}>
                    <PaymentValue option={option} />
                  </Fact>
                ) : null}
                <Fact label={t('transportPages.fields.accessibility')}>
                  <AccessValue option={option} />
                </Fact>
                <Fact label={t('transportPages.fields.boarding')} className="@md:col-span-2">
                  <BoardingList option={option} context={context} terminal={terminal} />
                </Fact>
                {note ? (
                  <Fact label={t('transportPages.fields.note')} className="@md:col-span-2">
                    <span className="type-body-sm block text-ink-2">{pick(note, lang)}</span>
                  </Fact>
                ) : null}
              </dl>
              {missing.length > 0 ? <NotPublished label={t('transportPages.fields.missing', { facts: formatList(missing, lang) })} /> : null}
            </MoreOnPhones>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line px-5 py-2 sm:px-6">
            {groupedSources ? null : <SourceNote sources={sourcesFor(option.sources, context.sources)} />}
            {option.asOf ? <AsOf value={option.asOf} timeZone={context.timezone} /> : null}
            <span className="ml-auto flex flex-wrap items-center gap-x-5">
              {option.bookingUrl ? (
                <ExternalLink href={option.bookingUrl} variant="action" className="type-body-sm" data-handoff="transport-ticket">
                  {t('transportPages.planner.bookOnline')}
                </ExternalLink>
              ) : tickets ? (
                <ExternalLink href={tickets} variant="action" className="type-body-sm font-semibold" data-handoff={`${option.mode}-tickets`}>
                  {t('transportPages.planner.tickets')}
                </ExternalLink>
              ) : null}
              {official && official !== tickets ? (
                <ExternalLink href={official} variant="action" className="type-body-sm">
                  {t('common.actions.openOfficialSite')}
                </ExternalLink>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
