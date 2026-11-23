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
  pick,
  resolveSources,
  type GuideNote,
  type Lang,
  type Source,
} from '@/content';
import { localizeAirport } from '@/content/airports';
import { DISCOVER_IMAGES, HOME_HERO_IMAGES, IMAGES, objectPosition, type SiteImage } from '@/content/images';
import { ARRIVAL_TIME_RULE } from '@/content/planning-rules';
import { getT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import type { NoticeView } from '@/components/airport/notice-utils';
import { FlightSearchBox } from '@/components/flights/flight-search-box';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { DeferredImage } from '@/components/ui/deferred-image';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { DemoMarkedList } from '@/components/common/demo-tag';
import { ArrivalChecklist, type ArrivalChecklistItem } from './arrival-checklist';
import { BoardPreview } from './board-preview';
import { DepartingNow } from './departing-now';
import { ConciergeQuestions } from './concierge-questions';
import { DestinationCard } from './destination-card';
import { HeroBackdrop } from './hero-backdrop';
import { JourneyModes } from './journey-modes';
import { JourneyTeaser, type TeaserOfficialFact } from './journey-teaser';
import { ModeQuickActions } from './mode-quick-actions';
import { HomeOpsStatus } from './home-ops-status';
import { NoticeStrip } from './notice-strip';
import { SavedFlightFlag, SavedFlightSlot } from './saved-flight-slot';
import { ShopDineStrip, type ShopDineFilter } from './shop-dine-strip';

/* ---- First screen ---------------------------------------------------------------------------- */

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

/**
 * The first screen (Direction v2): a full-bleed cinematic hero that runs up under the header (the
 * header is transparent over it until the page scrolls; `data-hero-under-header`). Over the
 * picture: the headline, the flight search on a frosted panel, the saved flight, the journey
 * modes and six quick actions on smoky glass, and the notice strip. All of it stays above the
 * fold at 1280 by 720 and on a 390 by 844 phone (smoke tests), so vertical spacing follows the
 * window height.
 *
 * The picture is the first photograph of `HOME_HERO_IMAGES` (preloaded, the LCP element) or,
 * while the library is empty, the illustrated "KLIA at dusk". The `h1` is in the static HTML.
 */
export function HomeHero({ lang, notices }: { lang: Lang; notices: readonly NoticeView[] }) {
  const t = getT(lang);
  const arrival = arrivalChecklist(lang);
  const photoId = HOME_HERO_IMAGES[0];
  // Typed as a library photo: while the library is empty the id type is `never`.
  const photo: SiteImage | undefined = photoId === undefined ? undefined : (IMAGES[photoId] as SiteImage);
  return (
    <section
      aria-labelledby="home-title"
      data-hero-under-header=""
      className="relative isolate -mt-header flex flex-col justify-end overflow-x-clip bg-midnight md:min-h-[calc(100svh-2rem)] lg:min-h-[min(62rem,calc(100svh-2rem))]"
    >
      <HeroBackdrop photo={photo} lang={lang} />
      <Container className="flex flex-col gap-[clamp(0.625rem,1.5vh,1rem)] pt-[calc(var(--spacing-header)+clamp(1rem,3.5vh,3.5rem))] pb-[clamp(1.25rem,3.5vh,3rem)]">
        {/* Redesign round one (critique item 5): from 1440 px the headline and the search share the
            left of the hero with a glass "Departing now" panel on the right (live status in the
            hero); 48 px between the h1 and the search; the example searches wait for focus. */}
        <div className="min-[90rem]:grid min-[90rem]:grid-cols-[minmax(0,1fr)_22rem] min-[90rem]:items-end min-[90rem]:gap-x-10">
          <div className="flex min-w-0 flex-col gap-[clamp(1rem,3vh,3rem)]">
            {/* Redesign 1b: over the photograph the words sit on a feathered scrim (no visible box);
                the gold line keeps 4:1 or more over the brightest part of any photograph. */}
            <div className={cn('on-media max-w-[60rem] text-ink', photo && 'scrim-feather')}>
              <p className="type-caption mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold tracking-[0.16em] text-ink-2 uppercase max-sm:hidden [@media(max-height:46rem)]:hidden">
                <span aria-hidden="true" className="h-px w-8 bg-gold-bright" />
                <span lang="ms">{t('home.greeting')}</span>
                <span aria-hidden="true">·</span>
                <span>{t('home.eyebrow', { count: AIRPORTS.length })}</span>
              </p>
              <h1
                id="home-title"
                className="font-heading text-[clamp(1.875rem,min(5vw,6.8vh),4.5rem)] leading-[1.02] font-[650] tracking-[-0.04em] text-balance text-ink"
              >
                {t('home.headlineTaskLead')} <span className="text-gold-bright">{t('home.headlineTaskAccent')}</span>
              </h1>
              <p className="type-body-lg mt-4 max-w-[36rem] text-ink-2 max-lg:hidden [@media(max-height:60rem)]:hidden">{t('home.lead')}</p>
            </div>

            {/* The flight search on a frosted panel: the brightest thing on the screen. The airport is
                chosen once, in the header (A-17). */}
            <FlightSearchBox
              id="flight-search"
              examplesOnFocus
              className={cn(
                'max-w-[60rem] [&_.pattern-rebung]:hidden',
                '[&>div]:rounded-3xl [&>div]:border-[rgb(255_255_255/0.5)] [&>div]:shadow-xl [&>div]:backdrop-blur-[20px] [&>div]:backdrop-saturate-150',
                '[&>div]:bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)]',
                'hc:[&>div]:bg-surface [@media(prefers-reduced-transparency:reduce)]:[&>div]:bg-surface',
              )}
            />
          </div>
          <DepartingNow className="min-h-[19rem] max-[89.99rem]:hidden" />
        </div>

        {/* The visitor's saved flight, above the journey modes (A-08). The flag runs during HTML
            parsing so the slot reserves its height before first paint. */}
        <SavedFlightFlag />
        <SavedFlightSlot className="max-w-[60rem]" />

        <div className="flex flex-col gap-[clamp(0.5rem,1.3vh,0.875rem)]">
          <JourneyModes tone="media" className="lg:max-w-[52rem]" />
          <ModeQuickActions tone="media" />
        </div>

        <NoticeStrip notices={notices} status={<HomeOpsStatus {...kliaStatusData()} />} />
        {arrival ? <ArrivalChecklist item={arrival} /> : null}
      </Container>
      {photo ? (
        <p className="type-caption absolute right-3 bottom-2 z-10 rounded-pill bg-[color-mix(in_srgb,var(--color-scrim)_78%,transparent)] px-2.5 py-0.5 text-on-midnight-dim max-md:hidden">
          {`${lang === 'ms' ? 'Foto' : 'Photo'}: ${photo.credit.author}, ${photo.credit.licence}`}
        </p>
      ) : null}
    </section>
  );
}

/* ---- Board preview --------------------------------------------------------------------------- */

/**
 * The next flights: an introduction on the left (it stays in view while the list scrolls past on
 * a desktop) and the board as app-like cards on the right. The board's own heading becomes an h3.
 * Its demonstration label stays with it, quiet but present, and a "Demo" marker stays in view
 * while the rows scroll past on a phone (A-04).
 */
export function HomeBoard({ lang }: { lang: Lang }) {
  const t = getT(lang);
  return (
    <Section aria-labelledby="home-board-title" spacing="lg" className="relative">
      {/* Redesign round one (critique items 16 and 9): the heading above a board as wide as the
          container (the table layout from 1024 px, no empty column beside it), five rows on phones. */}
      <SectionHeading id="home-board-title" eyebrow={t('home.board.eyebrow')} title={t('home.v2.boardTitle')} lead={t('home.v2.boardLead')} />
      <DemoMarkedList className="min-w-0 max-sm:[&_ul>li:nth-child(n+6)]:hidden">
        <BoardPreview rows={8} headingLevel={3} className="shadow-xl" />
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
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <SectionHeading id="home-journey-title" eyebrow={t('home.journey.eyebrow')} title={t('journey.timeline.title')} lead={t('home.journey.lead')} />
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

/* ---- Discover Malaysia (the network) --------------------------------------------------------- */

/** The destinations rail, in this order; the Kuala Lumpur gateways get their own row. */
const DESTINATIONS = ['pen', 'bki', 'lgk', 'kch'] as const;

export function HomeNetwork({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const groups = airportsByClassification();
  const featured = new Map(FEATURED_AIRPORTS.map((airport) => [airport.slug, airport]));
  const destinations = DESTINATIONS.flatMap((slug) => (featured.has(slug) ? [featured.get(slug)!] : []));
  const gateways = FEATURED_AIRPORTS.filter((airport) => !(DESTINATIONS as readonly string[]).includes(airport.slug));
  const stats = [
    { value: groups.international.length, label: t('airportSwitcher.international') },
    { value: groups.domestic.length, label: t('airportSwitcher.domestic') },
    { value: groups.stolport.length, label: t('airportSwitcher.stolports') },
  ];
  return (
    <Section tone="surface" aria-labelledby="home-network-title">
      <SectionHeading
        id="home-network-title"
        eyebrow={t('home.network.eyebrow')}
        title={t('home.v2.discoverTitle')}
        lead={t('home.v2.discoverLead')}
        action={
          <LocaleLink href="/airports" className="link-action text-ink">
            {t('nav.airports')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        }
      />
      {/* A swipeable rail on phones (the next card peeks in), four up from `lg`. */}
      <ul
        aria-labelledby="home-network-title"
        className="-mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-4 overflow-x-auto px-gutter pt-1 pb-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {destinations.map((airport) => (
          <DestinationCard
            key={airport.slug}
            airport={airport}
            lang={lang}
            sizes="(min-width: 64rem) 25vw, (min-width: 40rem) 45vw, 78vw"
            className="w-[78%] max-w-[22rem] shrink-0 snap-start sm:w-[45%] lg:w-auto lg:max-w-none"
          />
        ))}
      </ul>

      <h3 id="home-gateways-title" className="type-title-lg mt-12 mb-5 text-[1.25rem] text-ink sm:mt-14">
        {t('home.v2.gatewaysTitle')}
      </h3>
      <ul aria-labelledby="home-gateways-title" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-5">
        {gateways.flatMap((airport) =>
          isMultiTerminal(airport)
            ? airport.terminals.map((terminal) => (
                <DestinationCard key={`${airport.slug}-${terminal.id}`} airport={airport} terminal={terminal} lang={lang} shape="landscape" sizes="(min-width: 64rem) 36vw, (min-width: 40rem) 50vw, 100vw" />
              ))
            : [<DestinationCard key={airport.slug} airport={airport} lang={lang} shape="landscape" sizes="(min-width: 64rem) 28vw, (min-width: 40rem) 50vw, 100vw" />],
        )}
      </ul>

      <div className="surface-midnight on-media relative mt-12 overflow-hidden rounded-3xl text-ink shadow-lg sm:mt-14">
        <span aria-hidden="true" className="rule-gold absolute inset-x-8 top-0" />
        <div className="grid items-center gap-x-12 gap-y-7 px-6 py-9 sm:px-10 sm:py-11 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <h3 className="type-display-md">{t('home.network.title', { count: AIRPORTS.length })}</h3>
            <p className="type-body mt-3 max-w-reading text-ink-2">{t('home.network.bandLead')}</p>
            <dl className="mt-7 grid max-w-xl grid-cols-[repeat(auto-fit,minmax(min(100%,6.5rem),1fr))] gap-x-8 gap-y-5">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse gap-1.5">
                  <dt className="type-caption text-ink-2">{stat.label}</dt>
                  <dd className="type-data-lg text-gold-bright">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <LocaleLink
            href="/airports"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-pill bg-gold px-6 text-base font-semibold text-on-gold shadow-sm transition-[background-color,box-shadow] duration-fast hover:bg-gold-hover hover:shadow-md"
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

/**
 * Redesign round one (critique item 20): beside the filters, typographic cards with real content
 * (the airport, how many places there are and three of their names) instead of gradient frames
 * that looked like images that failed to load. Each links to that airport's listing.
 */
const SHOP_CARD_GROUNDS = [
  'linear-gradient(150deg, #3a1f12 0%, #7a4220 65%, #a8693a 100%)',
  'linear-gradient(150deg, #0b1640 0%, #1d2d6b 100%)',
  'linear-gradient(150deg, #0d3b33 0%, #1f5e50 100%)',
] as const;

/**
 * Redesign 1b: the discover photographs of Malaysian food (and a street stall) behind the cards,
 * decorative: they set the mood and do not claim to show any outlet. Food first, in the library's order.
 */
const SHOP_CARD_PHOTOS: SiteImage[] = (() => {
  const pool = DISCOVER_IMAGES.map((id) => IMAGES[id] as SiteImage);
  return [...pool.filter((image) => image.subject === 'food'), ...pool.filter((image) => image.id === 'george-town-street')];
})();

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
  // The airports with the most published outlets, with a few names each (content, no clock).
  const showcase = airportsWithContent()
    .map((slug) => ({ slug, outlets: getAirportContent(slug)?.outlets ?? [] }))
    .filter((item) => item.outlets.length > 0)
    .sort((a, b) => b.outlets.length - a.outlets.length)
    .slice(0, 3)
    .map((item) => {
      const airport = AIRPORTS.find((entry) => entry.slug === item.slug);
      const dine = item.outlets.filter((outlet) => outlet.kind === 'dine');
      return {
        slug: item.slug,
        count: item.outlets.length,
        name: airport ? localizeAirport(airport, lang).shortName : item.slug.toUpperCase(),
        names: [...new Set((dine.length >= 3 ? dine : item.outlets).map((outlet) => outlet.name))].slice(0, 3),
      };
    });
  return (
    <Section tone="ivory" aria-labelledby="home-shop-title">
      <div className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0">
          <SectionHeading id="home-shop-title" eyebrow={t('home.shop.eyebrow')} title={t('home.shop.title')} lead={t('home.shop.lead')} />
          <ShopDineStrip outletCounts={outletCounts} usableFilters={usableFilters} />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {showcase.map((item, index) => {
            const photo = SHOP_CARD_PHOTOS[index];
            return (
              <li
                key={item.slug}
                className={cn('on-media group/shop relative isolate flex min-h-44 flex-col justify-end overflow-hidden rounded-3xl p-5 text-ink shadow-md sm:p-6', index === 0 && 'sm:row-span-2 sm:min-h-[22rem]', photo && 'min-h-52')}
                style={photo ? undefined : { backgroundImage: SHOP_CARD_GROUNDS[index % SHOP_CARD_GROUNDS.length] }}
              >
                {photo ? (
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-midnight">
                    <DeferredImage
                      src={photo.src}
                      alt=""
                      fill
                      sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 50vw, 100vw"
                      quality={60}
                      blurDataURL={photo.blurDataURL}
                      style={{ objectPosition: objectPosition(photo) }}
                      className="object-cover transition-[scale] duration-slower ease-out motion-ok:group-hover/shop:scale-[1.04]"
                    />
                  </div>
                ) : (
                  <Icon name={index === 0 ? 'utensils' : index === 1 ? 'shopping-bag' : 'glass-water'} strokeWidth={0.75} className="absolute -top-4 -right-4 -z-10 size-36 text-[rgb(255_255_255/0.16)] transition-transform duration-slow ease-out motion-ok:group-hover/shop:scale-105" />
                )}
                {/* Over a photograph the words sit on a card-wide scrim (edge to edge, fading out in
                    the 3rem above them; the text alpha under every line however tall the block
                    grows). It is the block's own background, so the link's hit area stays the card. */}
                <div
                  className={cn(
                    'flex flex-col',
                    photo &&
                      '-mx-5 -mb-5 rounded-b-[inherit] bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-scrim)_var(--scrim-text-alpha),transparent)_0,color-mix(in_srgb,var(--color-scrim)_var(--scrim-text-alpha),transparent)_calc(100%-3rem),transparent)] px-5 pt-12 pb-5 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pt-14 sm:pb-6 hc:bg-[color-mix(in_srgb,var(--color-scrim)_92%,transparent)]',
                  )}
                >
                  <span aria-hidden="true" className="type-display-md text-gold-bright tabular-nums">
                    {item.count}
                  </span>
                  <span className="sr-only">{t.count('home.shop.published', item.count, { airport: item.name })}</span>
                  <h3 className="type-title-md mt-1 text-ink">
                    <LocaleLink href={`/${item.slug}/shop-dine`} className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:focus-ring">
                      {t('home.shop.browseAt', { airport: item.name })}
                    </LocaleLink>
                  </h3>
                  <p className="type-body-sm mt-1.5 line-clamp-2 text-ink-2">{item.names.join(' · ')}</p>
                </div>
              </li>
            );
          })}
        </ul>
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
    <Section tone="midnight" aria-labelledby="home-concierge-title" className="relative overflow-hidden">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <SectionHeading id="home-concierge-title" eyebrow={t('home.concierge.eyebrow')} title={t('home.concierge.title')} lead={t('concierge.intro')} />
          <ConciergeQuestions questions={[t('home.concierge.q1'), t('home.concierge.q2'), t('home.concierge.q3')]} />
        </div>
        {note ? (
          <figure className="glass-dark min-w-0 self-start rounded-3xl">
            <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[rgb(255_255_255/0.12)] px-5 py-4 sm:px-6">
              <span className="type-eyebrow flex items-center gap-2 text-ink-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-gold text-on-gold">
                  <Icon name="sparkles" size="sm" />
                </span>
                {t('concierge.title')}
              </span>
              <Badge tone="gold">{t('home.concierge.preview')}</Badge>
            </figcaption>
            <div className="flex flex-col gap-4 px-5 py-6 sm:px-6">
              <p className="type-body ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 font-medium text-on-primary">{t('home.concierge.sampleQuestion')}</p>
              <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-[rgb(255_255_255/0.06)] px-4 py-3.5 ring-1 ring-[rgb(255_255_255/0.12)]">
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

