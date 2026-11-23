import type { ReactNode } from 'react';
import { CLASSIFICATION_LABELS, isMultiTerminal, pick, type Airport, type Lang } from '@/content';
import { heroForAirport } from '@/content/images';
import { getT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { AirportCode } from '@/components/common/airport-code';
import { LocalTime } from '@/components/common/local-time';
import { LocaleLink } from '@/components/common/locale-link';
import type { AirportSectionId } from '@/components/shell/sections';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { toMediaImage } from '@/components/ui/media';
import { AirportBackdrop } from './airport-backdrop';
import { AirportBar } from './airport-bar';
import { SyncAirportContext } from './airport-title';
import { SectionNav, TerminalChips } from './section-nav';

export interface AirportHeaderProps {
  airport: Airport;
  lang: Lang;
  /** Sections this airport has, from `airportSections(slug)`. */
  sections: readonly AirportSectionId[];
}

/** A refined pill over the midnight header (smoky glass: legible over any photograph). */

/**
 * The section tabs as an app-like pill bar (redesign round one). It is sticky from `md` up, under
 * the site header, and scrolls sideways with an edge fade and buttons where more tabs wait.
 *
 * The airport chrome around it is `display: contents`, so this bar's containing block is the page
 * itself and it stays stuck for the whole page, not only while the header is in view. The airport
 * layout moves the page's own sticky content (`top-sticky`: board hour headings, filters, the
 * map) below it (`[data-airport-page]`).
 */
function AirportTabsBar({ airport, sections, inPage = false, className }: { airport: Airport; sections: readonly AirportSectionId[]; inPage?: boolean; className?: string }) {
  return (
    <div
      data-airport-tabs=""
      className={cn(
        'z-30 border-b border-line bg-page md:sticky',
        // Inside the page (the overview), `--spacing-sticky` already includes this bar: step back by it.
        inPage ? 'md:top-[calc(var(--spacing-sticky)-3rem)]' : 'md:top-sticky',
        className,
      )}
    >
      <Container>
        <SectionNav slug={airport.slug} name={airport.shortName} sections={sections} />
      </Container>
    </div>
  );
}

/**
 * The cinematic airport header of the overview (redesign round one): the airport's photograph
 * (`heroForAirport`; never another airport's), or a rich branded midnight with the airport's own
 * line drawing while the library has none; the classification and place as one gold kicker, the
 * name as the page's `h1` in display type, and the code, local time and terminal choice as
 * refined pills. `search` (the airport's flight search) sits on the band, so on a phone it is in
 * the first screen. The section pill bar follows.
 *
 * Rendered by the overview page itself (round 2), so it is in the static shell; `globals.css`
 * hides the layout's compact bar while this banner is on the page.
 */
export function AirportBanner({ airport, lang, sections, search }: AirportHeaderProps & { search?: ReactNode }) {
  const t = getT(lang);
  const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
  const terminals = isMultiTerminal(airport) ? airport.terminals.map((terminal) => ({ id: terminal.id, label: pick(terminal.shortName, lang) })) : [];
  const photo = heroForAirport(airport.slug);
  const credit = photo ? toMediaImage(photo, lang, { credit: true }).credit : undefined;

  return (
    <div data-airport-chrome="full" className="contents">
      <div className="relative isolate overflow-hidden bg-midnight">
        <AirportBackdrop slug={airport.slug} code={airport.code} lang={lang} variant="hero" />
        {/* Redesign 1b: over a photograph the words and the search heading sit on one feathered
            scrim (no visible box; 4.5:1 or more over the brightest part of any photograph). On a
            phone the photograph has the top of the banner to itself, then fades under the words,
            like a travel app's image header. */}
        <Container className={cn('relative pb-8 md:pb-12', photo ? 'pt-36 sm:pt-28 md:pt-20 lg:pt-24' : 'pt-7 sm:pt-12 md:pt-16 lg:pt-20')}>
          <div className={cn('max-w-[56rem]', photo && 'scrim-feather')}>
            <div className="on-media text-ink">
              <p className="type-caption flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold tracking-[0.16em] text-ink-2 uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-gold-bright" />
                <span>{pick(CLASSIFICATION_LABELS[airport.classification], lang)}</span>
                <span aria-hidden="true" className="max-sm:hidden">
                  ·
                </span>
                {/* On phones the place takes its own line rather than leaving the dot dangling. */}
                <span className="text-ink-2 max-sm:basis-full">{place}</span>
              </p>
              <h1 className="type-display-xl mt-3 text-balance text-ink sm:mt-4">{airport.name}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-7">
                {/* Redesign round one (critique item 17): identity and time are plain text, the
                    terminals one segmented control, "All airports" a text link. */}
                <span className="type-body-sm inline-flex min-h-9 items-center gap-2 text-ink-2 touch:min-h-11">
                  <AirportCode code={airport.code} name={airport.name} size="sm" className="font-semibold text-ink" />
                  <span aria-hidden="true">·</span>
                  <LocalTime showLabel timeZone={airport.timezone} className="flex-wrap whitespace-normal" />
                </span>
                {terminals.length > 0 ? <TerminalChips slug={airport.slug} terminals={terminals} /> : null}
                <LocaleLink href="/airports" className="link-action type-body-sm ml-auto text-ink max-sm:hidden">
                  {t('nav.airports')}
                  <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                </LocaleLink>
              </div>
            </div>
            {search ? <div className="relative mt-7 sm:mt-10">{search}</div> : null}
          </div>
        </Container>
        {credit ? (
          <p className="on-media type-caption absolute right-3 bottom-3 max-w-[60%] rounded-pill bg-[color-mix(in_srgb,var(--color-scrim)_78%,transparent)] px-2.5 py-0.5 text-xs text-on-midnight-dim max-md:hidden">
            {credit}
          </p>
        ) : null}
      </div>
      <AirportTabsBar airport={airport} sections={sections} inPage />
    </div>
  );
}

/**
 * The header of every page under an airport (rendered by the airport layout): one slim midnight
 * band (at most 56 px on phones) with the airport, its terminal and clock, and the sections behind
 * one control, so the page's own `h1` and answer start in the first phone screen (A-01). From `md`
 * up the section pill bar sits under it, sticky. On the overview, `AirportBanner` takes its place.
 *
 * `display: contents` (redesign round one): the band and the pill bar are the page's own children,
 * so the bar can stay stuck while the page scrolls.
 */
export function AirportHeader({ airport, lang, sections }: AirportHeaderProps) {
  const terminals = isMultiTerminal(airport) ? airport.terminals.map((terminal) => ({ id: terminal.id, label: pick(terminal.shortName, lang) })) : [];

  return (
    <>
      <SyncAirportContext slug={airport.slug} />
      <div data-airport-chrome="compact" className="contents">
        <AirportBar
          slug={airport.slug}
          name={airport.shortName}
          fullName={airport.name}
          code={airport.code}
          timeZone={airport.timezone}
          terminals={terminals}
          sections={sections}
          backdrop={<AirportBackdrop slug={airport.slug} code={airport.code} lang={lang} variant="band" />}
        />
        <AirportTabsBar airport={airport} sections={sections} className="max-md:hidden" />
      </div>
    </>
  );
}
