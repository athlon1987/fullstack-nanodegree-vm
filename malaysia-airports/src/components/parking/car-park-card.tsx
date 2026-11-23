'use client';

import type { Source } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDuration, formatList } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import type { ParkingAvailability } from '@/lib/providers';
import { ExternalLink } from '@/components/common/external-link';
import { NotPublished } from '@/components/common/not-published';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Icon } from '@/components/ui/icon';
import { sourcesFor, type NoteView } from '@/components/transport/transport-types';
import { AsOf, Fact } from '@/components/transport/transport-values';
import { AvailabilityValue, baysText, rateBandText, walkText, YesNo } from './car-park-values';
import type { CarParkView } from './parking-types';

export interface CarParkCardProps {
  carPark: CarParkView;
  sources: Readonly<Record<string, Source>>;
  timezone: string;
  /** Simulated space: `undefined` hides it, `null` while the clock is read. */
  availability?: ParkingAvailability | null;
  showTerminal: boolean;
  /** Advice for premium car parks, shown as a warning band on them. */
  premiumWarning?: NoteView;
  /** The list states this provenance once (`ProvenanceDefault`): no tag of its own when it matches (A-14). */
  defaultProvenance?: CarParkView['provenance'];
  /** The list gives one source list for all its cards (`SectionSourceList`): no source toggle of its own (round 5, A-14). */
  groupedSources?: boolean;
}

/**
 * One car park: what it is, space now (simulated, labelled), bays, access, features, accessible
 * bays, EV charging, payment, and its rates by `rateStatus`. Unverified rates are quoted from
 * the content with their sources and a link to the official page; nothing is calculated from them.
 *
 * Round 5 (A-14, 6.1.7, the layout log's recommendation): fewer marks per card. The simulated
 * space is labelled "Simulated space" in words (the list's banner is the one "Demo" marker); the
 * features are a plain list, not chips; the rate status is said once, by the shared rate line
 * (6.1.3), with an icon, not again by a chip; and with `groupedSources` the sources are in the
 * list's one source list.
 */
export function CarParkCard({ carPark, sources, timezone, availability, showTerminal, premiumWarning, defaultProvenance, groupedSources = false }: CarParkCardProps) {
  const t = useT();
  const lang = useLang();
  const titleId = `car-park-${carPark.id}-title`;
  const premium = carPark.type === 'preferred';
  const bays = baysText(carPark, lang);
  const walk = walkText(carPark, t);
  const missing = [
    bays ? undefined : t('transportPages.parking.missingNames.bays'),
    walk ? undefined : t('transportPages.parking.missingNames.access'),
    carPark.accessibleBays === undefined ? t('transportPages.parking.missingNames.accessibleBays') : undefined,
    carPark.evCharging === undefined ? t('transportPages.parking.missingNames.ev') : undefined,
    carPark.payment?.length ? undefined : t('transportPages.parking.missingNames.payment'),
  ].filter((item): item is string => item !== undefined);
  const notVerified = carPark.rateStatus !== 'published';
  const booking = carPark.bookingUrl && carPark.bookingUrl !== carPark.officialUrl ? carPark.bookingUrl : undefined;
  const footer = !groupedSources || Boolean(carPark.asOf) || Boolean(booking);

  return (
    <article
      id={`car-park-${carPark.id}`}
      aria-labelledby={titleId}
      className={cn(
        // Redesign stage two: an elegant card (24 px corners, hairline, soft shadow); the premium car
        // park keeps its warning as a soft amber band and a faint amber edge (full in high contrast).
        '@container flex min-w-0 scroll-mt-32 flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm',
        premium ? 'border-warning-border/50 hc:border-warning-border' : 'border-line',
      )}
    >
      {premium ? (
        <div className="flex items-start gap-3 border-b border-warning-border/40 bg-warning-bg px-5 py-3.5 text-warning-fg hc:border-warning-border sm:px-6">
          <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface/70">
            <Icon name="triangle-alert" size="sm" strokeWidth={2} />
          </span>
          <p className="type-body-sm font-semibold">{premiumWarning?.title ?? t('transportPages.parking.longStayCheck')}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
            <Icon name="square-parking" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="type-title-lg text-ink">
              {carPark.name}
            </h3>
            <p className="type-body-sm mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2">
              {t(`transportPages.parking.types.${carPark.type}`)}
              {showTerminal && carPark.terminal ? <TerminalBadge terminal={carPark.terminal} size="sm" /> : null}
            </p>
            {carPark.provenance !== defaultProvenance ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ProvenanceTag provenance={carPark.provenance} />
              </div>
            ) : null}
          </div>
        </div>

        {availability !== undefined ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="type-eyebrow text-ink-3">{t('transportPages.availability.simulatedTitle')}</span>
            <AvailabilityValue availability={availability} />
          </div>
        ) : null}

        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 border-t border-line pt-4 @md:grid-cols-2">
          {bays ? (
            <Fact label={t('transportPages.parking.fields.bays')}>
              <span className="type-data-md text-ink">{bays}</span>
            </Fact>
          ) : null}
          {walk ? (
            <Fact label={t('transportPages.parking.fields.access')}>
              <span className="type-body-sm text-ink">{walk}</span>
            </Fact>
          ) : null}
          {carPark.accessibleBays !== undefined ? (
            <Fact label={t('transportPages.parking.fields.accessibleBays')}>
              <YesNo value={carPark.accessibleBays} icon="accessibility" />
            </Fact>
          ) : null}
          {carPark.evCharging !== undefined ? (
            <Fact label={t('transportPages.parking.fields.ev')}>
              <YesNo value={carPark.evCharging} icon="plug-zap" />
            </Fact>
          ) : null}
          {carPark.payment?.length ? (
            <Fact label={t('transportPages.parking.fields.payment')}>
              <span className="type-body-sm text-ink">{formatList(carPark.payment, lang)}</span>
            </Fact>
          ) : null}
          {carPark.features.length > 0 ? (
            <Fact label={t('transportPages.parking.fields.features')} className="@md:col-span-2">
              <ul className="flex flex-col gap-1">
                {carPark.features.map((feature) => (
                  <li key={feature} className="type-body-sm flex items-start gap-2 text-ink">
                    <Icon name="check" size="sm" className="mt-0.5 shrink-0 text-ink-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Fact>
          ) : null}
        </dl>
        {missing.length > 0 ? <NotPublished label={t('transportPages.fields.missing', { facts: formatList(missing, lang) })} /> : null}

        <div className={cn('rounded-xl p-4', notVerified ? 'bg-page-subtle' : 'border border-line bg-surface')}>
          <h4 className="type-title-sm text-ink">{t('transportPages.parking.fields.rates')}</h4>
          {/* One fact, one answer (round 4, 6.1.3): the same sentence as the price table, the concierge and the help FAQ.
              Round 5: the status chip beside the heading said the sentence's first words again; the icon keeps its cue. */}
          <div className="mt-2 flex items-start gap-2">
            <Icon name={notVerified ? 'circle-alert' : 'badge-check'} size="sm" className={cn('mt-0.5 shrink-0', notVerified ? 'text-warning-fg' : 'text-positive-fg')} />
            <p className="type-body-sm font-semibold text-ink" data-rate-line="">
              {carPark.rateLine}
            </p>
          </div>
          {carPark.dailyMax !== undefined && !notVerified ? (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="type-body-sm text-ink-2">{t('transportPages.parking.fields.dailyMax')}</span>
              <span className="type-data-md text-ink">{formatCurrency(carPark.dailyMax, lang)}</span>
            </p>
          ) : null}
          {notVerified ? (
            <>
              {carPark.description ? (
                <>
                  <p className="type-eyebrow mt-3 text-ink-3">{t('transportPages.parking.fields.whatSourcesSay')}</p>
                  <p className="type-body-sm mt-1.5 text-ink-2">{carPark.description}</p>
                </>
              ) : null}
            </>
          ) : (
            <>
              <ul className="mt-2 flex flex-col gap-1">
                {carPark.rates.map((band) => (
                  <li key={`${band.fromMinute}-${band.kind}`} className="type-body-sm text-ink">
                    {rateBandText(band, lang, t)}
                  </li>
                ))}
              </ul>
              {carPark.graceMinutes ? (
                <p className="type-body-sm mt-1 text-ink-2">
                  {t('transportPages.parking.fields.grace')}: {formatDuration(carPark.graceMinutes, lang)}
                </p>
              ) : null}
              {carPark.description ? <p className="type-body-sm mt-3 text-ink-2">{carPark.description}</p> : null}
            </>
          )}
          <ExternalLink href={carPark.officialUrl} variant="action" className="type-body-sm mt-2">
            {notVerified ? t('transportPages.calculator.officialLink') : t('transportPages.parking.officialPage')}
          </ExternalLink>
        </div>
      </div>

      {footer ? (
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line px-5 py-2 sm:px-6">
          {groupedSources ? null : <SourceNote sources={sourcesFor(carPark.sourceIds, sources)} />}
          {carPark.asOf ? <AsOf value={carPark.asOf} timeZone={timezone} /> : null}
          {booking ? (
            <ExternalLink href={booking} variant="action" className="type-body-sm ml-auto" data-handoff="parking-booking">
              {t('common.actions.bookOnOfficialSite')}
            </ExternalLink>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
