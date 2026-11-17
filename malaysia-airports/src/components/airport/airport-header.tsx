import { CLASSIFICATION_LABELS, isMultiTerminal, pick, type Airport, type Lang } from '@/content';
import { getT } from '@/lib/i18n';
import { AirportVignette } from '@/components/art/airport-vignette';
import { AirportCode } from '@/components/common/airport-code';
import { LocalTime } from '@/components/common/local-time';
import { LocaleLink } from '@/components/common/locale-link';
import type { AirportSectionId } from '@/components/shell/sections';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { AirportTitle, SyncAirportContext } from './airport-title';
import { SectionNav, TerminalChips } from './section-nav';

export interface AirportHeaderProps {
  airport: Airport;
  lang: Lang;
  /** Sections this airport has, from `airportSections(slug)`. */
  sections: readonly AirportSectionId[];
}

/**
 * The header of every page under an airport: its classification and place, the name (the `h1`
 * on the overview), its code, the local time, terminal chips at KLIA, its line-drawn vignette,
 * and the section navigation.
 */
export function AirportHeader({ airport, lang, sections }: AirportHeaderProps) {
  const t = getT(lang);
  const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
  return (
    <div className="border-b border-line bg-page-subtle">
      <SyncAirportContext slug={airport.slug} />
      <Container>
        <div className="grid items-end gap-x-10 pt-4 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
          <div className="min-w-0 pb-4 sm:pb-5">
            <p className="type-eyebrow mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-gold-ink">
              <span aria-hidden="true" className="h-px w-7 bg-gold" />
              <span>{pick(CLASSIFICATION_LABELS[airport.classification], lang)}</span>
              <span aria-hidden="true" className="max-sm:hidden">
                ·
              </span>
              {/* On phones the place takes its own line rather than leaving the dot dangling. */}
              <span className="text-ink-2 max-sm:basis-full">{place}</span>
            </p>
            <AirportTitle slug={airport.slug} name={airport.name} />
            <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2.5">
              <AirportCode code={airport.code} name={airport.name} variant="boxed" />
              <LocalTime showLabel timeZone={airport.timezone} />
              {isMultiTerminal(airport) ? (
                <TerminalChips slug={airport.slug} terminals={airport.terminals.map((terminal) => ({ id: terminal.id, label: pick(terminal.shortName, lang) }))} />
              ) : null}
              <LocaleLink href="/airports" className="link-action type-body-sm text-ink-2 max-sm:hidden">
                <Icon name="tower-control" size="sm" />
                {t('nav.airports')}
              </LocaleLink>
            </div>
          </div>
          <div aria-hidden="true" className="self-end overflow-hidden rounded-t-lg border border-b-0 border-line max-lg:hidden">
            <AirportVignette code={airport.code} ground="surface" />
          </div>
        </div>
        <SectionNav slug={airport.slug} name={airport.shortName} sections={sections} />
      </Container>
    </div>
  );
}
