import {
  AIRPORTS,
  FEATURED_AIRPORTS,
  GROUP_CONTACTS,
  GUIDES,
  airportsByClassification,
  airportsWithContent,
  getAirportContent,
  getNotices,
  isMultiTerminal,
  localizeAirport,
  pick,
  resolveSources,
  type Airport,
  type GuideNote,
  type Lang,
  type Source,
  type Terminal,
} from '@/content';
import { ARRIVAL_TIME_RULE } from '@/content/planning-rules';
import { cn } from '@/lib/cn';
import { getT } from '@/lib/i18n';
import { AirportVignette } from '@/components/art/airport-vignette';
import { RebungRule, TaburField } from '@/components/art/patterns';
import { AirportCode } from '@/components/common/airport-code';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import type { NoticeView } from '@/components/airport/notice-utils';
import { FlightSearchBox } from '@/components/flights/flight-search-box';
import { sectionPath } from '@/components/shell/sections';
import { Badge } from '@/components/ui/badge';
import { Card, CardLink } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { DemoMarkedList } from '@/components/common/demo-tag';
import { ArrivalChecklist, type ArrivalChecklistItem } from './arrival-checklist';
import { BoardPreview } from './board-preview';
import { ConciergeQuestions } from './concierge-questions';
import { JourneyModeGuidance, JourneyModes } from './journey-modes';
import { JourneyTeaser, type TeaserOfficialFact } from './journey-teaser';
import { ModeQuickActions } from './mode-quick-actions';
import { HomeOpsStatus } from './home-ops-status';
import { NoticeStrip } from './notice-strip';
import { SavedFlightFlag, SavedFlightSlot } from './saved-flight-slot';
import { ShopDineStrip, type ShopDineFilter } from './shop-dine-strip';

/* ---- First screen ---------------------------------------------------------------------------- */

/**
 * The first screen: headline, flight search with the airport selector, journey modes, six quick
 * actions, and one notice with the getting-there and terminal-guidance strip. Vertical spacing
 * scales with the height of the window so all of it sits above the fold at 1280 by 720.
 */
/** The arrival-card step of the Arriving guide, for the home's Arriving mode (A-18). */
function arrivalChecklist(lang: Lang): ArrivalChecklistItem | null {
  const guide = GUIDES.find((item) => item.slug === 'arriving');
  const section = guide?.sections.find((item) => item.id === 'before-you-land');
  const step = section?.steps.find((item) => item.id === 'mdac');
  if (!guide || !section || !step) return null;
  const action = step.actions?.[0];
  return {
    heading: pick(section.title, lang),
    title: pick(step.title, lang),
    body: pick(step.body, lang),
    provenance: step.provenance,
    sources: resolveSources(step.sources),
    ...(guide.asOf ? { asOf: guide.asOf } : {}),
    ...(action ? { action: { label: pick(action.label, lang), href: action.href } } : {}),
    guideHref: `/guides/${guide.slug}`,
  };
}

/** KLIA's notices and their sources for the home status row (B-01 hand-off, round 2). */
function kliaStatusData() {
  const notices = getNotices('kul');
  const sources: Record<string, Source> = Object.fromEntries(resolveSources([...new Set(notices.flatMap((notice) => notice.sources))]).map((source) => [source.id, source]));
  return { notices, sources };
}

export function HomeHero({ lang, notices }: { lang: Lang; notices: readonly NoticeView[] }) {
  const t = getT(lang);
  const arrival = arrivalChecklist(lang);
  return (
    <section aria-labelledby="home-title" className="relative isolate overflow-hidden border-b border-line">
      <TaburField fade className="absolute top-0 right-0 -z-10 h-52 w-[44rem] max-w-[65%] opacity-45 max-md:hidden" />
      <Container className="flex flex-col gap-[clamp(0.5rem,1.9vh,1.25rem)] pt-[clamp(0.625rem,2.4vh,2rem)] pb-[clamp(1.25rem,3.2vh,2.75rem)] max-sm:gap-2.5 max-sm:pt-2.5">
        <div className="flex items-end justify-between gap-x-10 gap-y-2">
          <div className="min-w-0">
            <p className="type-eyebrow mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-gold-ink max-sm:hidden">
              <span aria-hidden="true" className="h-px w-7 bg-gold" />
              <span lang="ms">{t('home.greeting')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('home.eyebrow', { count: AIRPORTS.length })}</span>
            </p>
            <h1 id="home-title" className="type-display-lg text-ink max-sm:text-[1.625rem] max-xs:text-2xl">
              {/* Upright, in colour: the italic face (81 KB) is no longer loaded (A-10). */}
              {t('home.headlineTaskLead')} <span className="text-primary-ink">{t('home.headlineTaskAccent')}</span>
            </h1>
          </div>
          <p className="type-body-sm max-w-80 shrink-0 pb-1 text-ink-2 max-xl:hidden">{t('home.lead')}</p>
        </div>

        {/* The airport is chosen once, in the header (A-17). */}
        <FlightSearchBox id="flight-search" />

        {/* The visitor's saved flight, above the journey modes (A-08). The flag runs during HTML
            parsing so the slot reserves its height before first paint. */}
        <SavedFlightFlag />
        <SavedFlightSlot />

        <div className="flex flex-col gap-[clamp(0.5rem,1.3vh,0.875rem)] max-sm:gap-2.5">
          <JourneyModes />
          <JourneyModeGuidance className="px-1 max-sm:hidden [@media(max-height:50rem)]:hidden" />
          <ModeQuickActions />
        </div>

        <NoticeStrip notices={notices} status={<HomeOpsStatus {...kliaStatusData()} />} />
        {arrival ? <ArrivalChecklist item={arrival} /> : null}
      </Container>
    </section>
  );
}

/* ---- Board preview --------------------------------------------------------------------------- */

export function HomeBoard({ lang }: { lang: Lang }) {
  const t = getT(lang);
  return (
    <Section aria-label={t('flights.board.title')} spacing="md">
      <p className="type-eyebrow mb-4 flex items-center gap-2.5 text-gold-ink">
        <span aria-hidden="true" className="h-px w-7 bg-gold" />
        <span className="tabular font-medium text-ink-3">01</span>
        {t('home.board.eyebrow')}
      </p>
      {/* A "Demo" marker stays in view while the rows scroll past on a phone (A-04). */}
      <DemoMarkedList>
        <BoardPreview rows={8} />
      </DemoMarkedList>
    </Section>
  );
}

/* ---- Your journey ---------------------------------------------------------------------------- */

const FACT_TOPICS = ['check-in', 'terminal', 'gate', 'getting-there'];

function officialFact(notes: readonly GuideNote[], lang: Lang): TeaserOfficialFact | undefined {
  const official = notes.filter((note) => note.provenance === 'official' && (!note.appliesTo?.direction || note.appliesTo.direction === 'departing') && !note.appliesTo?.airline);
  const note = FACT_TOPICS.map((topic) => official.find((item) => item.topic === topic)).find(Boolean);
  if (!note) return undefined;
  return {
    airport: note.airport,
    ...(note.appliesTo?.terminal ? { terminal: note.appliesTo.terminal } : {}),
    title: pick(note.title, lang),
    body: pick(note.body, lang),
    sources: resolveSources(note.sources),
  };
}

export function HomeJourney({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const facts = Object.fromEntries(
    airportsWithContent().flatMap((slug) => {
      const fact = officialFact(getAirportContent(slug)?.guidesNotes ?? [], lang);
      return fact ? [[slug, fact] as const] : [];
    }),
  );
  const phone = GROUP_CONTACTS.find((contact) => contact.kind === 'phone');
  return (
    <Section tone="subtle" aria-labelledby="home-journey-title">
      <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <SectionHeading id="home-journey-title" number={2} eyebrow={t('home.journey.eyebrow')} title={t('journey.timeline.title')} lead={t('home.journey.lead')} />
          <ProvenanceLegend kinds={['official', 'estimated', 'suggestion']} />
          <p className="type-caption mt-3 text-ink-2">{t('journey.timeline.intro')}</p>
        </div>
        <JourneyTeaser
          facts={facts}
          arrival={{
            minutesBefore: ARRIVAL_TIME_RULE.minutesBefore,
            text: pick(ARRIVAL_TIME_RULE.text, lang),
            provenance: ARRIVAL_TIME_RULE.provenance,
            sources: resolveSources(ARRIVAL_TIME_RULE.sources),
          }}
          fallback={phone ? { value: phone.value, sources: resolveSources(phone.sources) } : undefined}
        />
      </div>
    </Section>
  );
}

/* ---- The network ----------------------------------------------------------------------------- */

function AirportCard({ airport: record, terminal, lang, large = false }: { airport: Airport; terminal?: Terminal; lang: Lang; large?: boolean }) {
  const t = getT(lang);
  // Names, city and state in the page language (D-09 hand-off, round 2).
  const airport = localizeAirport(record, lang);
  const title = terminal ? pick(terminal.name, lang) : airport.shortName;
  const place = airport.city === airport.state ? airport.city : `${airport.city}, ${airport.state}`;
  return (
    <Card as="li" interactive className="flex min-w-0 flex-col overflow-hidden">
      <div className="border-b border-line">
        <AirportVignette code={airport.code} terminal={terminal?.id} ground="sunken" className={large ? 'aspect-[16/7] object-cover' : undefined} />
      </div>
      <div className={large ? 'flex flex-1 flex-col gap-1.5 p-5 sm:p-6' : 'flex flex-1 flex-col gap-1 p-4'}>
        {/* Wraps at 320 px and 125% text instead of pushing the code out of the card (A-16). */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h3 className={cn('min-w-0', large ? 'type-title-lg text-ink' : 'type-title-md text-ink')}>
            <CardLink href={sectionPath(airport.slug, 'overview', terminal?.id)}>{title}</CardLink>
          </h3>
          <AirportCode code={airport.code} name={airport.name} variant="boxed" size="sm" className="mt-0.5 shrink-0" />
        </div>
        <p className="type-body-sm text-ink-2">{terminal ? `${airport.name}, ${place}` : airport.name}</p>
        {terminal ? null : <p className="type-caption text-ink-3">{place}</p>}
        <p className="type-body-sm mt-auto flex items-center gap-1.5 pt-2 font-semibold text-ink">
          {t('home.network.airportHome')}
          <Icon name="arrow-right" size="sm" strokeWidth={1.75} className="text-ink-3" />
        </p>
      </div>
    </Card>
  );
}

export function HomeNetwork({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const groups = airportsByClassification();
  const multi = FEATURED_AIRPORTS.filter(isMultiTerminal);
  const single = FEATURED_AIRPORTS.filter((airport) => !isMultiTerminal(airport));
  const stats = [
    { value: groups.international.length, label: t('airportSwitcher.international') },
    { value: groups.domestic.length, label: t('airportSwitcher.domestic') },
    { value: groups.stolport.length, label: t('airportSwitcher.stolports') },
  ];
  return (
    <Section aria-labelledby="home-network-title">
      <SectionHeading
        id="home-network-title"
        number={3}
        eyebrow={t('home.network.eyebrow')}
        title={t('home.network.title', { count: AIRPORTS.length })}
        lead={t('home.network.lead')}
        action={
          <LocaleLink href="/airports" className="link-action text-ink">
            {t('nav.airports')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        }
      />
      <ul aria-label={t('home.network.featuredLabel')} className="grid gap-4 sm:grid-cols-2 lg:gap-5">
        {multi.flatMap((airport) => airport.terminals.map((terminal) => <AirportCard key={`${airport.slug}-${terminal.id}`} airport={airport} terminal={terminal} lang={lang} large />))}
      </ul>
      <ul aria-label={t('home.network.featuredLabel')} className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,9rem),1fr))] gap-4 sm:grid-cols-3 lg:mt-5 lg:grid-cols-5 lg:gap-5">
        {single.map((airport) => (
          <AirportCard key={airport.slug} airport={airport} lang={lang} />
        ))}
      </ul>

      <div className="relative mt-6 overflow-hidden rounded-lg bg-inverse text-on-inverse lg:mt-8">
        <RebungRule size="lg" className="absolute inset-x-0 top-0 opacity-70" />
        <div className="grid items-center gap-x-12 gap-y-6 px-5 pt-11 pb-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-12 lg:pb-8">
          <div className="min-w-0">
            <h3 className="type-display-md">{t('home.network.bandTitle', { count: AIRPORTS.length })}</h3>
            <p className="type-body mt-2 max-w-reading text-on-inverse-dim">{t('home.network.bandLead')}</p>
            <dl className="mt-6 grid max-w-xl grid-cols-[repeat(auto-fit,minmax(min(100%,6.5rem),1fr))] gap-x-6 gap-y-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse gap-1 border-t border-on-inverse-dim/40 pt-3">
                  <dt className="type-caption text-on-inverse-dim">{stat.label}</dt>
                  <dd className="type-data-lg">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <LocaleLink
            href="/airports"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-on-inverse px-5 text-base font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
          >
            {t('home.network.browse')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </div>
      </div>
    </Section>
  );
}

/* ---- Shop and dine --------------------------------------------------------------------------- */

export function HomeShopDine({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const outletCounts = Object.fromEntries(
    airportsWithContent().flatMap((slug) => {
      const count = getAirportContent(slug)?.outlets.length ?? 0;
      return count > 0 ? [[slug, count] as const] : [];
    }),
  );
  // Filters that can return at least one published outlet at each airport (C-05 hand-off).
  const usableFilters = Object.fromEntries(
    airportsWithContent().map((slug) => {
      const outlets = getAirportContent(slug)?.outlets ?? [];
      const usable: ShopDineFilter[] = [];
      if (outlets.some((outlet) => outlet.hours && outlet.hours.kind !== 'text')) usable.push('open-now');
      if (outlets.some((outlet) => outlet.halal === 'certified')) usable.push('halal');
      if (outlets.some((outlet) => outlet.zone === 'landside')) usable.push('landside');
      if (outlets.some((outlet) => outlet.zone === 'airside')) usable.push('airside');
      return [slug, usable] as const;
    }),
  );
  return (
    <Section tone="subtle" aria-labelledby="home-shop-title">
      <div className="grid items-end gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <SectionHeading id="home-shop-title" number={4} eyebrow={t('home.shop.eyebrow')} title={t('home.shop.title')} lead={t('home.shop.lead')} className="mb-0 sm:mb-0" />
        <ShopDineStrip outletCounts={outletCounts} usableFilters={usableFilters} />
      </div>
    </Section>
  );
}

/* ---- Concierge ------------------------------------------------------------------------------- */

/** The note behind the sample answer. If the content layer no longer has it, the sample is left out. */
const SAMPLE_ANSWER = { airport: 'kul', note: 'kul-t1-gates-c-satellite' } as const;

export function HomeConcierge({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const note = getAirportContent(SAMPLE_ANSWER.airport)?.guidesNotes.find((item) => item.id === SAMPLE_ANSWER.note);
  return (
    <Section aria-labelledby="home-concierge-title">
      <div className="grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <SectionHeading id="home-concierge-title" number={5} eyebrow={t('home.concierge.eyebrow')} title={t('home.concierge.title')} lead={t('concierge.intro')} />
          <ConciergeQuestions questions={[t('home.concierge.q1'), t('home.concierge.q2'), t('home.concierge.q3')]} />
        </div>
        {note ? (
          <figure className="min-w-0 self-start rounded-lg border border-line-strong bg-surface shadow-sm">
            <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5 sm:px-6">
              <span className="type-eyebrow flex items-center gap-2 text-ink-2">
                <Icon name="sparkles" size="sm" className="text-primary-ink" />
                {t('concierge.title')}
              </span>
              <Badge tone="gold">{t('home.concierge.preview')}</Badge>
            </figcaption>
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
              <p className="type-body ml-auto max-w-[85%] rounded-lg rounded-br-xs bg-primary px-4 py-2.5 font-medium text-on-primary">{t('home.concierge.sampleQuestion')}</p>
              <div className="max-w-[92%] rounded-lg rounded-bl-xs border border-line bg-page-subtle px-4 py-3.5">
                <p className="type-title-sm text-ink">{pick(note.title, lang)}</p>
                <p className="type-body mt-1.5 text-ink-2">{pick(note.body, lang)}</p>
                <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-1">
                  <ProvenanceTag provenance={note.provenance} className="mt-1" />
                  <SourceNote sources={resolveSources(note.sources)} />
                </div>
              </div>
              <p className="type-caption text-ink-2">{t('home.concierge.previewNote')}</p>
            </div>
          </figure>
        ) : null}
      </div>
    </Section>
  );
}
