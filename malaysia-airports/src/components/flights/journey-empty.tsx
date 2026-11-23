'use client';

import Image from 'next/image';
import { useAirportContext } from '@/lib/hooks/use-airport-context';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { sectionHref } from '@/components/shell/sections';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { objectPosition, placeholderProps, type MediaImage } from '@/components/ui/media';
import { Icon, type IconName } from '@/components/ui/icon';
import { AirportVignette } from '@/components/art/airport-vignette';
import { TaburField } from '@/components/art/patterns';
import { FlightSearchBox } from './flight-search-box';

/** Id of the heading, so the page can move focus here after clearing everything. */
export const JOURNEY_EMPTY_HEADING_ID = 'journey-empty-title';

/**
 * My journey with no saved flights: what the page does, three steps to start, a link to the
 * board of the remembered airport, and the flight search right here.
 *
 * Redesign 1b: with a photograph (`photo`, prepared on the server: the wing above the islands) the
 * panel looks out of an aircraft window: the photograph in a window-shaped frame beside the words.
 * The window stays smaller than the paragraph beside it, so the page's largest paint is still its
 * text in the first frame (a photograph filling the panel would have been the LCP, painted after
 * the page's scripts had loaded: about 3.5 s in Lighthouse mobile instead of 1.2 s).
 */
export function JourneyEmpty({ photo }: { photo?: MediaImage }) {
  const t = useT();
  const { selection } = useAirportContext();
  const availability = useSectionAvailability();
  const steps: { icon: IconName; text: string }[] = [
    { icon: 'search', text: t('flightPages.journey.empty.step1') },
    { icon: 'bookmark', text: t('flightPages.journey.empty.step2') },
    { icon: 'route', text: t('flightPages.journey.empty.step3') },
  ];

  // Redesign round one: an inviting midnight panel with the line drawing of the remembered
  // airport (or the generic terminal), three steps as cards, one gold call to action, then the
  // flight search on the page's own surface.
  return (
    <section aria-labelledby={JOURNEY_EMPTY_HEADING_ID} className="overflow-hidden rounded-3xl border border-line bg-surface shadow-md">
      <div className="on-media surface-midnight relative isolate overflow-hidden p-6 text-ink sm:p-10 lg:p-12">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <span className="absolute inset-0 bg-[radial-gradient(60%_100%_at_95%_0%,color-mix(in_srgb,var(--color-gold)_20%,transparent),transparent_70%)]" />
          <TaburField fade className="absolute top-0 right-0 h-full w-1/2 opacity-40" />
          {photo ? null : (
            <AirportVignette
              code={selection?.airport ?? 'generic'}
              terminal={selection?.terminal}
              ground="sunken"
              className="absolute -right-4 -bottom-2 w-[min(30rem,70%)] bg-transparent text-on-midnight-dim opacity-25 sm:opacity-35 lg:opacity-45"
            />
          )}
        </div>
        {photo ? (
          // The aircraft window: a bezel, then the photograph with the soft inner shadow of the pane.
          <div
            aria-hidden="true"
            className="float-right mb-3 ml-4 rounded-[2.25rem] bg-[linear-gradient(160deg,rgb(255_255_255/0.22),rgb(255_255_255/0.06))] p-1.5 shadow-lg ring-1 ring-white/15 sm:absolute sm:top-10 sm:right-10 sm:float-none sm:m-0 sm:rounded-[3.25rem] sm:p-2 lg:top-12 lg:right-12"
          >
            <div className="relative h-28 w-20 overflow-hidden rounded-[1.875rem] sm:h-48 sm:w-36 sm:rounded-[2.75rem] lg:h-52 lg:w-40">
              <Image
                src={photo.src}
                alt=""
                fill
                sizes="(min-width: 64rem) 10rem, (min-width: 40rem) 9rem, 5rem"
                quality={60}
                {...placeholderProps(photo)}
                style={{ objectPosition: objectPosition(photo.focal) }}
                className="object-cover"
              />
              <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_1.25rem_rgb(0_0_0/0.45)]" />
            </div>
          </div>
        ) : null}
        <div className={cn(photo && 'sm:pr-48 lg:pr-56')}>
          <p className="type-eyebrow text-gold-bright">{t('flightPages.look.emptyKicker')}</p>
          <h2 id={JOURNEY_EMPTY_HEADING_ID} tabIndex={-1} className="type-display-md mt-2 max-w-[34rem] text-balance text-ink">
            {t('flightPages.journey.empty.title')}
          </h2>
          <p className="type-body-lg mt-4 max-w-reading text-ink-2">{t('flightPages.journey.empty.body')}</p>
        </div>
        <ol className="clear-both mt-8 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.icon} className="glass-dark flex gap-3.5 rounded-2xl p-4">
              <span className="type-data-sm flex size-9 shrink-0 items-center justify-center rounded-full bg-gold font-semibold text-on-gold">{index + 1}</span>
              <div className="min-w-0">
                <Icon name={step.icon} size="sm" className="text-gold-bright" />
                <p className="type-body-sm mt-1.5 text-ink">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <LocaleLink href={sectionHref('flights', selection, availability)} className={`${buttonClasses({ variant: 'gold', size: 'lg' })} mt-8`}>
          {t('flightPages.journey.empty.findFlight')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
        </LocaleLink>
      </div>
      <div className="p-5 sm:p-8 lg:p-10">
        <h3 className="type-title-lg mb-3 text-ink">{t('flightPages.journey.empty.searchTitle')}</h3>
        <FlightSearchBox />
      </div>
    </section>
  );
}
