'use client';

import { terminalLabel } from '@/content/airports';
import type { NoticeSeverity } from '@/content/types';
import { cn } from '@/lib/cn';
import { useAirportContext, useJourneyMode, useNow } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import type { JourneyMode } from '@/lib/journey/modes';
import { formatDate } from '@/lib/time';
import { noticeViewState, pickHeadlineNotice, type NoticeView } from '@/components/airport/notice-utils';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { sectionHref, type AirportSectionId } from '@/components/shell/sections';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { Icon, type IconName } from '@/components/ui/icon';

const SEVERITY: Record<NoticeSeverity, { box: string; text: string; icon: IconName }> = {
  info: { box: 'bg-info-bg', text: 'text-info-fg', icon: 'info' },
  advisory: { box: 'bg-page-subtle', text: 'text-ink', icon: 'megaphone' },
  warning: { box: 'bg-warning-bg', text: 'text-warning-fg', icon: 'triangle-alert' },
  critical: { box: 'bg-critical-bg', text: 'text-critical-fg', icon: 'octagon-alert' },
};

const MODE_LINK: Record<JourneyMode, { section: AirportSectionId; icon: IconName }> = {
  departing: { section: 'transport', icon: 'train-front' },
  arriving: { section: 'transport', icon: 'train-front' },
  transiting: { section: 'transit', icon: 'arrow-left-right' },
  meeting: { section: 'parking', icon: 'square-parking' },
};

const LINK =
  'group flex min-h-12 min-w-0 items-center gap-3 px-3 py-2 text-ink transition-colors duration-fast hover:bg-page-subtle focus-visible:focus-ring-inset sm:px-4';

/**
 * The strip that closes the first screen: one operational notice (the most serious one that is
 * current for the chosen airport, or for the network), then "getting there" and "terminal
 * guidance" links that are rewritten for the journey mode and the chosen airport.
 */
export function NoticeStrip({ notices, className }: { notices: readonly NoticeView[]; className?: string }) {
  const t = useT();
  const lang = useLang();
  const now = useNow();
  const { effectiveMode } = useJourneyMode();
  const { airport, selection } = useAirportContext();
  const availability = useSectionAvailability();

  const notice = pickHeadlineNotice(notices, now, airport?.slug);
  const style = notice ? SEVERITY[notice.severity] : SEVERITY.info;
  const upcoming = notice && now !== null && noticeViewState(notice, now) === 'upcoming';
  const period = notice?.validFrom && upcoming ? t('notices.from', { date: formatDate(notice.validFrom, lang, 'medium') }) : null;

  const airportName = airport ? (selection?.terminal ? terminalLabel(airport, selection.terminal, lang) : airport.shortName) : t('home.strip.anyAirport');
  const mode = MODE_LINK[effectiveMode];
  const klia = !airport || airport.terminals.length > 1;

  return (
    <section
      aria-label={t('home.strip.label')}
      className={cn('grid overflow-hidden rounded-lg border border-line-strong bg-surface lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,1fr)]', className)}
    >
      {notice ? (
        <div data-severity={notice.severity} className={cn('flex min-w-0 items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5', style.box)}>
          <Icon name={style.icon} className={cn('max-xs:hidden', style.text)} />
          <div className="min-w-0 flex-1">
            <h2 className={cn('type-eyebrow flex flex-wrap items-center gap-x-1.5 gap-y-0.5', style.text)}>
              <span className="max-sm:sr-only">{t('home.notice.label')}</span>
              <span aria-hidden="true" className="max-sm:hidden">
                ·
              </span>
              <span className="text-ink-2">{notice.scope ?? t('home.notice.network')}</span>
              {notice.provenance === 'demo' ? <ProvenanceTag provenance="demo" length="short" className="ml-1" /> : null}
            </h2>
            <p className="type-body-sm mt-1 font-semibold text-ink sm:text-[0.9375rem]">{notice.title}</p>
            {period ? <p className="type-data-xs mt-0.5 text-ink-2 max-sm:hidden [@media(max-height:50rem)]:hidden">{period}</p> : null}
          </div>
          <LocaleLink
            href={`/notices#${notice.id}`}
            aria-label={t('home.notice.detailsFor', { title: notice.title })}
            className="link-action type-body-sm shrink-0 text-ink"
          >
            {t('home.notice.details')}
          </LocaleLink>
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-3 bg-page-subtle px-3 py-2.5 sm:px-4">
          <Icon name="circle-check" className="text-ink-2" />
          <p className="type-body-sm min-w-0 flex-1 text-ink-2">{t('notices.none')}</p>
          <LocaleLink href="/notices" className="link-action type-body-sm shrink-0 text-ink">
            {t('notices.viewAll')}
          </LocaleLink>
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-line border-t border-line lg:contents lg:divide-x-0 lg:border-t-0">
        <LocaleLink href={sectionHref(mode.section, selection, availability)} className={cn(LINK, 'lg:border-l lg:border-line')}>
          <Icon name={mode.icon} className="text-primary-ink max-xs:hidden" />
          <span className="min-w-0 flex-1">
            <span className="type-body-sm block font-semibold sm:text-[0.9375rem]">{t(`home.strip.${effectiveMode}.title`, { airport: airportName })}</span>
            <span className="type-caption block text-ink-2 max-sm:hidden">{t(`home.strip.${effectiveMode}.body`)}</span>
          </span>
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="text-ink-3 transition-transform duration-base group-hover:translate-x-0.5 max-sm:hidden" />
        </LocaleLink>
        <LocaleLink href={klia ? '/help/terminals' : sectionHref('overview', selection, availability)} className={cn(LINK, 'lg:border-l lg:border-line')}>
          <Icon name="building-2" className="text-primary-ink max-xs:hidden" />
          <span className="min-w-0 flex-1">
            <span className="type-body-sm block font-semibold sm:text-[0.9375rem]">{t('home.strip.terminalTitle')}</span>
            <span className="type-caption block text-ink-2 max-sm:hidden">
              {klia ? t('home.strip.terminalKlia') : t('home.strip.terminalAirport', { airport: airportName })}
            </span>
          </span>
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="text-ink-3 transition-transform duration-base group-hover:translate-x-0.5 max-sm:hidden" />
        </LocaleLink>
      </div>
    </section>
  );
}
