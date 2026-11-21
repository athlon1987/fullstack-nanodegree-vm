import type { Lang } from '@/content/types';
import { getT } from '@/lib/i18n';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Badge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import type { RestView } from './commerce-view.server';
import { AsOfText, FactRows, HoursText } from './fact-rows';
import { OpenStatus } from './open-status';

export interface LoungeCardProps {
  item: RestView;
  lang: Lang;
  showTerminal: boolean;
  headingLevel?: 3 | 4;
}

/**
 * A lounge, hotel, rest service or shower: where it is and on which side of security, who may
 * use it as published, the operator's own page when the content cites it, and the sources.
 */
export function LoungeCard({ item, lang, showTerminal, headingLevel = 4 }: LoungeCardProps) {
  const t = getT(lang);
  const Heading = headingLevel === 3 ? 'h3' : 'h4';
  return (
    <article
      id={item.id}
      aria-labelledby={`${item.id}-title`}
      className="flex min-w-0 scroll-mt-32 flex-col rounded-xl border border-line-strong bg-surface p-4 shadow-xs target:border-ink target:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-3.5">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-page-subtle text-ink">
          <Icon name={item.category} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-caption text-ink-2">
            {item.categoryLabel}
            {item.operator ? <span className="text-ink-3"> · </span> : null}
            {item.operator}
          </p>
          <Heading id={`${item.id}-title`} className="type-title-md mt-0.5 text-ink">
            {item.name}
          </Heading>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProvenanceTag provenance={item.provenance} length="short" />
            {showTerminal ? <Badge size="sm">{item.terminalLabel}</Badge> : null}
            {item.zone === 'airside' ? <Chip icon="scan-line">{t('commercePages.card.zone.airside')}</Chip> : null}
            {item.zone === 'landside' ? <Chip icon="door-open">{t('commercePages.card.zone.landside')}</Chip> : null}
            <OpenStatus hours={item.hours} />
          </div>
        </div>
      </div>

      <p className="type-body mt-3.5 text-ink-2">{item.description}</p>

      <FactRows
        className="mt-4"
        facts={[
          { label: t('commercePages.lounges.location'), value: item.locationNote },
          { label: t('commercePages.lounges.level'), value: item.levelName },
          { label: t('commercePages.lounges.hours'), value: item.hours ? <HoursText hours={item.hours} /> : undefined },
          { label: t('commercePages.lounges.access'), value: item.access },
          // No operator publishes prices here yet (C-11, OOS-04): said once, in the grouped line.
          { label: t('commercePages.lounges.price'), value: undefined },
        ]}
      />

      <div aria-hidden="true" className="min-h-3 flex-1" />
      {item.mapHref || item.operatorUrl || item.bookingUrl ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-3">
          {item.mapHref ? (
            <LocaleLink href={item.mapHref} aria-label={`${t('commercePages.outlet.showOnMap')}: ${item.name}`} className="link-action type-body-sm inline-flex items-center gap-1.5">
              <Icon name="map" size="sm" />
              {t('commercePages.outlet.showOnMap')}
            </LocaleLink>
          ) : null}
          {item.operatorUrl ? (
            <ExternalLink href={item.operatorUrl} variant="action" className="type-body-sm">
              {t('commercePages.lounges.operatorPage')}
            </ExternalLink>
          ) : null}
          {item.bookingUrl ? (
            <ExternalLink href={item.bookingUrl} variant="action" className="type-body-sm" data-handoff="lounge-booking">
              {t('commercePages.lounges.book')}
            </ExternalLink>
          ) : null}
        </div>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-4">
        <SourceNote sources={item.sources} />
        {item.asOf ? <AsOfText value={item.asOf} /> : null}
      </div>
    </article>
  );
}
