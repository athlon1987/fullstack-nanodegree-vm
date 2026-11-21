/**
 * Builds the search documents from the content layer. Server-side: this imports every
 * airport's content, so call it in a Server Component or route handler and hand the result to
 * the client as a prop (or JSON), where `createSearchIndex` turns it into an index.
 */
import {
  AIRPORTS,
  CLASSIFICATION_LABELS,
  CORPORATE_PAGES,
  FACILITY_CATEGORY_META,
  FAQS,
  GUIDES,
  MAP_POI_KIND_LABELS,
  MEDIA_ITEMS,
  NEWS_ITEMS,
  TRANSPORT_MODE_LABELS,
  getAirportContent,
  getNotices,
  isMultiTerminal,
  localizeAirport,
  pick,
  type Lang,
  type LocalizedText,
} from '@/content';
import { FEATURED_AIRPORT_SLUGS } from '@/content/airports';
import { getT } from '@/lib/i18n';
import { CORPORATE_SECTIONS } from '@/components/corporate/corporate-sections';
import type { SearchDocument } from './engine';

const both = (text: LocalizedText): string[] => (text.ms ? [text.en, text.ms] : [text.en]);

/** Topics people search for that the content layer does not publish yet (needs MAHB data). */
const UNPUBLISHED_TOPICS = [
  { id: 'accessibleParking', href: '/accessibility', keywords: ['accessible parking', 'disabled parking', 'oku parking', 'parkir oku', 'blue badge', 'accessible', 'parking'] },
  { id: 'hearingLoop', href: '/accessibility', keywords: ['hearing loop', 'hearing loops', 'induction loop', 'hearing', 'deaf', 'pekak', 'gelung pendengaran'] },
  { id: 'moneyChanger', href: '/help', keywords: ['money changer', 'money changers', 'currency exchange', 'forex', 'pengurup wang', 'tukar wang', 'tukaran wang', 'changer', 'currency'] },
  { id: 'trolley', href: '/help', keywords: ['trolley', 'trolleys', 'troli', 'baggage trolley', 'luggage cart'] },
  // Only until the content layer publishes a Fast Track record (D-02): see `buildSearchDocuments`.
  { id: 'fastTrack', href: '/help', keywords: ['fast track', 'fasttrack', 'laluan pantas', 'priority lane', 'lorong keutamaan', 'express lane'] },
  // Round 4 (A-12, re-review 6.1.5): the content gaps list names these; no airport publishes them yet.
  { id: 'accessibleToilet', href: '/accessibility#not-published', keywords: ['accessible toilet', 'accessible toilets', 'disabled toilet', 'tandas oku', 'oku toilet'] },
  { id: 'wifi', href: '/help', keywords: ['wifi', 'wi-fi', 'internet', 'wireless', 'free wifi', 'wifi percuma'] },
  { id: 'smoking', href: '/help', keywords: ['smoking', 'smoking room', 'smoking rooms', 'smoke', 'merokok', 'bilik merokok', 'rokok'] },
] as const;

/** Car parks by how a long-stay driver should meet them: long-stay first, premium last (A-12). */
const CAR_PARK_RANK: Readonly<Record<string, number>> = { 'long-term': 1.3, preferred: 0.6, premium: 0.6 };

/**
 * "Fast Track" twice, "Calm Room" beside "Calm Room (Terminal 2)": titles that repeat within one
 * airport get the terminal (map places: the level) (round 4, A-12). Repeats across airports keep
 * their titles: every results list already names the airport, and an airport name in a title
 * would match searches for the airport itself. A title that already names its terminal stays.
 */
function disambiguateTitles(documents: SearchDocument[], places: ReadonlyMap<string, string>): void {
  const named = /\((?:Terminal|T)\s?\d\)\s*$/i;
  const base = (title: string) => title.replace(named, '').trim().toLowerCase();
  const groups = new Map<string, SearchDocument[]>();
  for (const document of documents) {
    if (!document.airport || document.type === 'airport' || document.type === 'unpublished') continue;
    const key = `${document.airport}|${document.type}|${base(document.title)}`;
    groups.set(key, [...(groups.get(key) ?? []), document]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const document of group) {
      const label = places.get(document.id);
      if (!label || named.test(document.title)) continue;
      document.title = /\)\s*$/.test(document.title) ? document.title.replace(/\)\s*$/, `, ${label})`) : `${document.title} (${label})`;
    }
  }
}

const clip = (text: string, length = 220): string => (text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text);

/**
 * Every searchable item in one language: airports (and KLIA's terminals), facilities, outlets,
 * transport options, car parks, guides, FAQs, notices, corporate pages and news.
 *
 * Titles and summaries are in `lang` (falling back to English); keywords carry both languages
 * so that "surau" works on the English site and "prayer" on the Malay one.
 */
export function buildSearchDocuments(lang: Lang): SearchDocument[] {
  const documents: SearchDocument[] = [];
  // Where each record is in its airport, for telling repeated titles apart (see `disambiguateTitles`).
  const places = new Map<string, string>();
  const t = getT(lang);

  for (const airport of AIRPORTS) {
    // The airport's own result in the page language (D-09, round 2); both forms stay searchable.
    const local = localizeAirport(airport, lang);
    documents.push({
      id: `airport:${airport.slug}`,
      type: 'airport',
      title: `${local.name} (${airport.code})`,
      summary: pick(airport.summary, lang),
      href: `/${airport.slug}`,
      airport: airport.slug,
      keywords: [
        airport.code,
        airport.icao ?? '',
        airport.shortName,
        airport.city,
        airport.state,
        ...(lang === 'en' ? [] : [local.name, local.shortName, local.city, local.state]),
        ...both(CLASSIFICATION_LABELS[airport.classification]),
      ].filter(Boolean),
    });
    if (isMultiTerminal(airport)) {
      for (const terminal of airport.terminals) {
        documents.push({
          id: `airport:${airport.slug}:${terminal.id.toLowerCase()}`,
          type: 'airport',
          title: pick(terminal.name, lang),
          summary: pick(airport.summary, lang),
          href: `/${airport.slug}?t=${terminal.id}`,
          airport: airport.slug,
          keywords: [airport.code, airport.shortName, terminal.id, ...both(terminal.shortName)],
        });
      }
    }

    const content = getAirportContent(airport.slug);
    if (!content?.hasContent) continue;
    const terminalName = (id: string | undefined): string | undefined => {
      const terminal = id && isMultiTerminal(airport) ? airport.terminals.find((item) => item.id === id) : undefined;
      return terminal ? pick(terminal.name, lang).replace(new RegExp(`^${local.shortName}\\s+`), '') : undefined;
    };
    const place = (id: string, terminal?: string) => {
      const name = terminalName(terminal);
      if (name) places.set(id, name);
    };

    for (const facility of content.facilities) {
      place(`facility:${facility.id}`, facility.terminal);
      const meta = FACILITY_CATEGORY_META[facility.category];
      // The lounges page lists lounges, hotels, rest and shower facilities with `#<id>` anchors.
      const page = facility.category === 'lounge' || facility.category === 'hotel' || facility.category === 'rest' || facility.category === 'shower' ? 'lounges' : 'facilities';
      documents.push({
        id: `facility:${facility.id}`,
        type: 'facility',
        title: pick(facility.name, lang),
        summary: clip([facility.locationNote ? pick(facility.locationNote, lang) : '', pick(facility.description, lang)].filter(Boolean).join(' ')),
        href: `/${airport.slug}/${page}#${facility.id}`,
        airport: airport.slug,
        keywords: [...both(meta.label), ...both(facility.name), facility.category.replace(/-/g, ' '), facility.operator ?? '', airport.code, airport.shortName].filter(Boolean),
      });
    }
    for (const outlet of content.outlets) {
      place(`outlet:${outlet.id}`, outlet.terminal);
      documents.push({
        id: `outlet:${outlet.id}`,
        type: 'outlet',
        title: outlet.name,
        summary: clip([outlet.category, outlet.locationNote ? pick(outlet.locationNote, lang) : '', outlet.description ? pick(outlet.description, lang) : ''].filter(Boolean).join('. ')),
        href: `/${airport.slug}/shop-dine/${outlet.slug}`,
        airport: airport.slug,
        keywords: [outlet.category, outlet.cuisine ?? '', outlet.kind, outlet.halal === 'certified' ? 'halal' : '', outlet.halal === 'certified' ? 'halal certified' : '', airport.code, airport.shortName].filter(Boolean),
      });
    }
    for (const option of content.transport) {
      documents.push({
        id: `transport:${option.id}`,
        type: 'transport',
        title: pick(option.name, lang),
        summary: clip(option.description ? pick(option.description, lang) : pick(TRANSPORT_MODE_LABELS[option.mode], lang)),
        // Anchors as the transport cards render them (`transport-<id>`).
        href: `/${airport.slug}/transport#transport-${option.id}`,
        airport: airport.slug,
        keywords: [...both(TRANSPORT_MODE_LABELS[option.mode]), ...both(option.name), option.mode.replace(/-/g, ' '), option.operator ?? '', ...option.destinations.flatMap((destination) => both(destination.name)), airport.code, airport.shortName].filter(Boolean),
      });
    }
    // Places on the schematic maps that no other record covers (lifts, information points,
    // meeting points): "lift" and "lif" find them (A-12). Positions are illustrative and the map
    // page says so; the search result only names the place and its level.
    for (const map of content.maps) {
      for (const poi of map.pois) {
        if (poi.ref || poi.kind === 'gate') continue;
        // Map places repeat by level ("Toilets" on Levels 5 and 3): the level tells them apart.
        const levelName = map.levels.find((level) => level.id === poi.level)?.name;
        places.set(`place:${map.id}:${poi.id}`, levelName ? pick(levelName, lang).split(':')[0].trim() : poi.level);
        const kindLabel = (MAP_POI_KIND_LABELS as Partial<Record<string, LocalizedText>>)[poi.kind];
        documents.push({
          id: `place:${map.id}:${poi.id}`,
          type: 'place',
          title: pick(poi.name, lang),
          summary: `${pick(map.name, lang)} · ${poi.level}`,
          href: `/${airport.slug}/map?t=${map.terminal}&level=${encodeURIComponent(poi.level)}&poi=${encodeURIComponent(poi.id)}`,
          airport: airport.slug,
          keywords: [...(kindLabel ? both(kindLabel) : []), poi.kind.replace(/-/g, ' '), ...both(poi.name), map.terminal, airport.code, airport.shortName],
        });
      }
    }
    // Airlines with a published terminal and check-in: "AirAsia" finds the airline, not only its flights.
    for (const airline of content.airlines) {
      const terminal = airline.terminal && isMultiTerminal(airport) ? airport.terminals.find((item) => item.id === airline.terminal) : undefined;
      documents.push({
        id: `airline:${airport.slug}:${airline.code.toLowerCase()}`,
        type: 'airline',
        title: `${airline.name} (${airline.code})`,
        summary: clip([terminal ? pick(terminal.name, lang) : airport.shortName, airline.checkIn ?? '', airline.note ? pick(airline.note, lang) : ''].filter(Boolean).join(' · ')),
        href: `/${airport.slug}/flights?q=${encodeURIComponent(airline.code)}${terminal ? `&t=${terminal.id}` : ''}`,
        airport: airport.slug,
        keywords: [airline.code, airline.name, ...airline.name.split(/[\s()]+/).filter((word) => word.length > 2), airline.terminal ?? '', airport.code, airport.shortName].filter(Boolean),
      });
    }
    // The airport's parking page first (round 4, A-12): "parking" leads with prices for every car
    // park, not with the premium product the page warns long-stay drivers about.
    if (content.carParks.length > 0) {
      documents.push({
        id: `parking:${airport.slug}`,
        type: 'parking',
        title: t('shellExtras.searchPages.parking.title', { airport: local.shortName }),
        summary: t('shellExtras.searchPages.parking.summary'),
        href: `/${airport.slug}/parking`,
        airport: airport.slug,
        keywords: ['parking', 'car park', 'parkir', 'tempat letak kereta', 'parking rates', 'kadar parkir', airport.code, airport.shortName],
        // Above every single car park; the network's first featured airport (KLIA) first when the
        // query names no airport.
        rank: airport.slug === FEATURED_AIRPORT_SLUGS[0] ? 1.6 : 1.5,
        // Only for parking questions: "penan" still finds Penang airport first.
        rankWhen: ['parking', 'parkir', 'park', 'carpark'],
      });
    }
    for (const carPark of content.carParks) {
      place(`parking:${carPark.id}`, carPark.terminal);
      const document: SearchDocument = {
        id: `parking:${carPark.id}`,
        type: 'parking',
        title: pick(carPark.name, lang),
        summary: clip(carPark.description ? pick(carPark.description, lang) : ''),
        // Anchors as the car park cards render them (`car-park-<id>`).
        href: `/${airport.slug}/parking#car-park-${carPark.id}`,
        airport: airport.slug,
        keywords: ['parking', 'car park', 'parkir', 'tempat letak kereta', ...both(carPark.name), carPark.type.replace(/-/g, ' '), airport.code, airport.shortName],
      };
      const rank = CAR_PARK_RANK[carPark.type];
      if (rank !== undefined) document.rank = rank;
      documents.push(document);
    }
  }

  for (const guide of GUIDES) {
    documents.push({
      id: `guide:${guide.slug}`,
      type: 'guide',
      title: pick(guide.title, lang),
      summary: pick(guide.summary, lang),
      href: `/guides/${guide.slug}`,
      keywords: [...guide.audience, ...guide.sections.flatMap((section) => [...both(section.title), ...section.steps.flatMap((step) => both(step.title))])],
    });
  }
  for (const faq of FAQS) {
    const document: SearchDocument = {
      id: `faq:${faq.id}`,
      type: 'faq',
      title: pick(faq.question, lang),
      summary: clip(pick(faq.answer, lang)),
      href: `/help/${faq.topic}#${faq.id}`,
      keywords: [faq.topic.replace(/-/g, ' '), ...both(faq.question)],
    };
    if (faq.airports?.length === 1) document.airport = faq.airports[0];
    documents.push(document);
  }
  for (const notice of getNotices()) {
    const document: SearchDocument = {
      id: `notice:${notice.id}`,
      type: 'notice',
      title: pick(notice.title, lang),
      summary: clip(pick(notice.body, lang)),
      href: `/notices#${notice.id}`,
      keywords: ['notice', 'advisory', 'notis', notice.severity],
    };
    if (notice.airport) document.airport = notice.airport;
    documents.push(document);
  }
  for (const page of CORPORATE_PAGES) {
    documents.push({
      id: `corporate:${page.slug}`,
      type: 'corporate',
      title: pick(page.title, lang),
      summary: pick(page.summary, lang),
      href: `/corporate/${page.slug}`,
      keywords: [page.section, 'corporate', 'korporat', 'Malaysia Airports'],
    });
  }
  for (const item of NEWS_ITEMS) {
    documents.push({
      id: `corporate:news:${item.slug}`,
      type: 'corporate',
      title: pick(item.title, lang),
      summary: clip(pick(item.summary, lang)),
      href: `/corporate/news/${item.slug}`,
      keywords: ['news', 'berita', item.date],
      // News below tasks (round 4, A-12): "surau" ranked a solar-farm story second.
      rank: 0.5,
    });
  }
  // The media centre's items and the corporate section pages (corporate-network hand-off).
  const indexed = new Set(documents.map((document) => document.href));
  for (const item of MEDIA_ITEMS) {
    const href = `/corporate/news/${item.slug}`;
    if (indexed.has(href)) continue;
    documents.push({
      id: `corporate:media:${item.slug}`,
      type: 'corporate',
      title: pick(item.title, lang),
      summary: clip(pick(item.summary, lang)),
      href,
      keywords: ['news', 'berita', item.topic, item.date],
      rank: 0.5,
    });
  }
  // Known gaps answer honestly instead of returning the nearest unrelated record (A-12). These
  // say only that nothing is published; they state no fact about the airports.
  // A gap closes by itself once a real record covers it: "fast track" then finds that record.
  const published = (phrase: string) => documents.some((document) => document.title.toLowerCase().includes(phrase));
  for (const gap of UNPUBLISHED_TOPICS) {
    if (gap.id === 'fastTrack' && published('fast track')) continue;
    documents.push({
      id: `unpublished:${gap.id}`,
      type: 'unpublished',
      title: t(`shellExtras.searchGaps.${gap.id}.title`),
      summary: t(`shellExtras.searchGaps.${gap.id}.summary`),
      href: gap.href,
      keywords: [...gap.keywords],
    });
  }
  for (const section of CORPORATE_SECTIONS) {
    if (indexed.has(section.href)) continue;
    documents.push({
      id: `corporate:section:${section.id}`,
      type: 'corporate',
      title: t(section.label),
      summary: t(section.description),
      href: section.href,
      keywords: [section.id, 'corporate', 'korporat', 'Malaysia Airports'],
    });
  }

  disambiguateTitles(documents, places);
  return documents;
}
