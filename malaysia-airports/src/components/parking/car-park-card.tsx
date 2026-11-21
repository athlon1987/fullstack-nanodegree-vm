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
import { Chip } from '@/components/ui/chip';
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
}

/**
 * One car park: what it is, space now (simulated, labelled), bays, access, features, accessible
 * bays, EV charging, payment, and its rates by `rateStatus`. Unverified rates are quoted from
 * the content with their sources and a link to the official page; nothing is calculated from them.
 */
export function CarParkCard({ carPark, sources, timezone, availability, showTerminal, premiumWarning, defaultProvenance }: CarParkCardProps) {
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

  return (
    <article
      id={`car-park-${carPark.id}`}
      aria-labelledby={titleId}
      className={cn(
        '@container flex min-w-0 scroll-mt-32 flex-col overflow-hidden rounded-xl border bg-surface shadow-xs',
        premium ? 'border-warning-border border-2' : 'border-line-strong',
      )}
    >
      {premium ? (
        <div className="flex items-start gap-2.5 border-b border-warning-border bg-warning-bg px-4 py-3 text-warning-fg sm:px-5">
          <Icon name="triangle-alert" className="mt-0.5 shrink-0" />
          <p className="type-body-sm font-semibold">{premiumWarning?.title ?? t('transportPages.parking.longStayCheck')}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-page-subtle text-ink">
            <Icon name="square-parking" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="type-title-md text-ink">
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
            <span className="type-eyebrow text-ink-3">{t('transportPages.availability.title')}</span>
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
              <ul className="flex flex-wrap gap-2">
                {carPark.features.map((feature) => (
                  <li key={feature}>
                    <Chip icon="check">{feature}</Chip>
                  </li>
                ))}
              </ul>
            </Fact>
          ) : null}
        </dl>
        {missing.length > 0 ? <NotPublished label={t('transportPages.fields.missing', { facts: formatList(missing, lang) })} /> : null}

        <div className={cn('rounded-lg border p-4', notVerified ? 'border-line-strong bg-page-subtle' : 'border-line bg-surface')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="type-title-sm text-ink">{t('transportPages.parking.fields.rates')}</h4>
            {notVerified ? (
              <Chip tone="warning" icon="circle-alert">
                {t('transportPages.parking.ratesNotVerified')}
              </Chip>
            ) : (
              <Chip tone="positive" icon="badge-check">
                {t('transportPages.parking.ratesPublished')}
              </Chip>
            )}
          </div>
          {carPark.dailyMax !== undefined ? (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="type-body-sm text-ink-2">{t('transportPages.parking.fields.dailyMax')}</span>
              <span className="type-data-md text-ink">{formatCurrency(carPark.dailyMax, lang)}</span>
            </p>
          ) : null}
          {notVerified ? (
            <>
              <p className="type-body-sm mt-2 font-semibold text-ink">{t('transportPages.parking.sourcesDiffer')}</p>
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

      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line px-4 py-1.5 sm:px-5">
        <SourceNote sources={sourcesFor(carPark.sourceIds, sources)} />
        {carPark.asOf ? <AsOf value={carPark.asOf} timeZone={timezone} /> : null}
        {carPark.bookingUrl && carPark.bookingUrl !== carPark.officialUrl ? (
          <ExternalLink href={carPark.bookingUrl} variant="action" className="type-body-sm ml-auto" data-handoff="parking-booking">
            {t('common.actions.bookOnOfficialSite')}
          </ExternalLink>
        ) : null}
      </div>
    </article>
  );
}
