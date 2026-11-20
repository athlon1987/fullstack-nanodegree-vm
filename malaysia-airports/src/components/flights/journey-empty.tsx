'use client';

import { useAirportContext } from '@/lib/hooks/use-airport-context';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { sectionHref } from '@/components/shell/sections';
import { buttonClasses } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { FlightSearchBox } from './flight-search-box';

/** Id of the heading, so the page can move focus here after clearing everything. */
export const JOURNEY_EMPTY_HEADING_ID = 'journey-empty-title';

/**
 * My journey with no saved flights: what the page does, three steps to start, a link to the
 * board of the remembered airport, and the flight search right here.
 */
export function JourneyEmpty() {
  const t = useT();
  const { selection } = useAirportContext();
  const availability = useSectionAvailability();
  const steps: { icon: IconName; text: string }[] = [
    { icon: 'search', text: t('flightPages.journey.empty.step1') },
    { icon: 'bookmark', text: t('flightPages.journey.empty.step2') },
    { icon: 'route', text: t('flightPages.journey.empty.step3') },
  ];

  return (
    <section aria-labelledby={JOURNEY_EMPTY_HEADING_ID} className="overflow-hidden rounded-xl border border-line-strong bg-surface">
      <div className="p-5 sm:p-8 lg:p-10">
        <h2 id={JOURNEY_EMPTY_HEADING_ID} tabIndex={-1} className="type-display-sm text-ink">
          {t('flightPages.journey.empty.title')}
        </h2>
        <p className="type-body-lg mt-3 max-w-reading text-ink-2">{t('flightPages.journey.empty.body')}</p>
        <ol className="mt-7 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.icon} className="flex gap-3.5 rounded-lg border border-line bg-page-subtle p-4">
              <span className="type-data-sm flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-ink">{index + 1}</span>
              <div className="min-w-0">
                <Icon name={step.icon} size="sm" className="text-primary-ink" />
                <p className="type-body-sm mt-1.5 text-ink">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <LocaleLink href={sectionHref('flights', selection, availability)} className={`${buttonClasses({ variant: 'primary' })} mt-7`}>
          {t('flightPages.journey.empty.findFlight')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
        </LocaleLink>
      </div>
      <div className="border-t border-line bg-page-subtle p-5 sm:p-8 lg:p-10">
        <h3 className="type-title-lg mb-3 text-ink">{t('flightPages.journey.empty.searchTitle')}</h3>
        <FlightSearchBox />
      </div>
    </section>
  );
}
