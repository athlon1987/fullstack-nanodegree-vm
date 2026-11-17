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
  NEWS_ITEMS,
  TRANSPORT_MODE_LABELS,
  getAirportContent,
  getNotices,
  isMultiTerminal,
  pick,
  type Lang,
  type LocalizedText,
} from '@/content';
import type { SearchDocument } from './engine';

const both = (text: LocalizedText): string[] => (text.ms ? [text.en, text.ms] : [text.en]);
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

  for (const airport of AIRPORTS) {
    documents.push({
      id: `airport:${airport.slug}`,
      type: 'airport',
      title: `${airport.name} (${airport.code})`,
      summary: pick(airport.summary, lang),
      href: `/${airport.slug}`,
      airport: airport.slug,
      keywords: [airport.code, airport.icao ?? '', airport.shortName, airport.city, airport.state, ...both(CLASSIFICATION_LABELS[airport.classification])].filter(Boolean),
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

    for (const facility of content.facilities) {
      const meta = FACILITY_CATEGORY_META[facility.category];
      const page = facility.category === 'lounge' || facility.category === 'hotel' ? 'lounges' : 'facilities';
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
      documents.push({
        id: `outlet:${outlet.id}`,
        type: 'outlet',
        title: outlet.name,
        summary: clip([outlet.category, outlet.locationNote ? pick(outlet.locationNote, lang) : '', outlet.description ? pick(outlet.description, lang) : ''].filter(Boolean).join('. ')),
        href: `/${airport.slug}/shop-dine/${outlet.slug}`,
        airport: airport.slug,
        keywords: [outlet.category, outlet.cuisine ?? '', outlet.kind, airport.code, airport.shortName].filter(Boolean),
      });
    }
    for (const option of content.transport) {
      documents.push({
        id: `transport:${option.id}`,
        type: 'transport',
        title: pick(option.name, lang),
        summary: clip(option.description ? pick(option.description, lang) : pick(TRANSPORT_MODE_LABELS[option.mode], lang)),
        href: `/${airport.slug}/transport#${option.id}`,
        airport: airport.slug,
        keywords: [...both(TRANSPORT_MODE_LABELS[option.mode]), ...both(option.name), option.mode.replace(/-/g, ' '), option.operator ?? '', ...option.destinations.flatMap((destination) => both(destination.name)), airport.code, airport.shortName].filter(Boolean),
      });
    }
    for (const carPark of content.carParks) {
      documents.push({
        id: `parking:${carPark.id}`,
        type: 'parking',
        title: pick(carPark.name, lang),
        summary: clip(carPark.description ? pick(carPark.description, lang) : ''),
        href: `/${airport.slug}/parking#${carPark.id}`,
        airport: airport.slug,
        keywords: ['parking', 'car park', 'parkir', 'tempat letak kereta', ...both(carPark.name), carPark.type.replace(/-/g, ' '), airport.code, airport.shortName],
      });
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
    });
  }

  return documents;
}
