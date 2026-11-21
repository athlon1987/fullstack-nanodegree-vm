/**
 * SERVER ONLY. Builds the concierge knowledge pack from the verified content layer: the slice
 * the answer engine reads, as plain serialisable data. `/api/concierge` uses it directly and
 * `/[lang]/concierge/knowledge.json` serves it as static JSON for the browser fallback.
 */
// Package E (fix round, security-17): importing this module from a Client Component fails the build.
import 'server-only';
import {
  AIRPORTS,
  ALL_SOURCES,
  FACILITY_CATEGORY_META,
  FAQS,
  FEATURED_AIRPORTS,
  GROUP_CONTACTS,
  GUIDES,
  HELP_TOPICS,
  TRANSPORT_MODE_LABELS,
  airportsWithContent,
  getAirportContent,
  getNotices,
  getSource,
  type FacilityCategory,
  type Lang,
  type LocalizedText,
} from '@/content';
import { airportSections } from '@/components/shell/sections.server';
import { buildSearchDocuments } from '@/lib/search';
import { normalise } from './text';
import type { ConciergeKnowledge, KnowledgeAirline, KnowledgeAirport, KnowledgePassage } from './types';

/** Names people use for airports that are not their official or short names. */
const EXTRA_ALIASES: Readonly<Record<string, readonly string[]>> = {
  kul: ['klia', 'klia2', 'klia 2', 'klia terminal 1', 'klia terminal 2', 'kuala lumpur airport', 'kuala lumpur international', 'kl airport', 'kl international airport'],
  pen: ['pulau pinang', 'penang airport', 'bayan lepas'],
  szb: ['subang airport', 'skypark'],
  bki: ['kk airport', 'kota kinabalu airport'],
  lgk: ['langkawi airport'],
  kch: ['kuching airport'],
};

function aliasesFor(airport: (typeof AIRPORTS)[number]): string[] {
  const names = [airport.shortName, airport.name, ...(EXTRA_ALIASES[airport.slug] ?? [])];
  // The city only when it names one airport ("Kuching"), not a district shared with another.
  if (AIRPORTS.filter((other) => other.city === airport.city).length === 1) names.push(airport.city);
  return [...new Set(names.map(normalise).filter((name) => name.length >= 3))];
}

function passagesFromContent(): KnowledgePassage[] {
  const passages: KnowledgePassage[] = [];
  for (const faq of FAQS) {
    passages.push({
      id: `faq:${faq.id}`,
      kind: 'faq',
      topic: faq.topic,
      airports: faq.airports ?? [],
      title: faq.question,
      body: faq.answer,
      provenance: faq.provenance,
      sourceIds: faq.sources,
      href: `/help/${faq.topic}#${faq.id}`,
    });
  }
  for (const guide of GUIDES) {
    for (const section of guide.sections) {
      for (const step of section.steps) {
        passages.push({
          id: `guide:${guide.slug}:${section.id}:${step.id}`,
          kind: 'guide',
          topic: guide.slug,
          airports: guide.airports ?? [],
          title: step.title,
          body: step.body,
          provenance: step.provenance,
          sourceIds: step.sources ?? guide.sources,
          href: `/guides/${guide.slug}#${section.id}`,
          scope: `${guide.title.en} ${section.title.en}`,
        });
      }
    }
  }
  for (const slug of airportsWithContent()) {
    for (const note of getAirportContent(slug)?.guidesNotes ?? []) {
      passages.push({
        id: `note:${note.id}`,
        kind: 'note',
        topic: note.topic,
        airports: [note.airport],
        terminal: note.appliesTo?.terminal,
        airline: note.appliesTo?.airline,
        gatePrefixes: note.appliesTo?.gatePrefixes,
        title: note.title,
        body: note.body,
        provenance: note.provenance,
        sourceIds: note.sources,
        gap: note.id.endsWith('content-gaps'),
      });
    }
  }
  return passages;
}

function build(lang: Lang): ConciergeKnowledge {
  const contents = airportsWithContent().map((slug) => getAirportContent(slug)).filter((item) => item !== undefined);
  const airports: KnowledgeAirport[] = AIRPORTS.map((airport) => {
    const content = contents.find((item) => item.airport.slug === airport.slug);
    return {
      slug: airport.slug,
      code: airport.code,
      name: airport.name,
      shortName: airport.shortName,
      city: airport.city,
      terminals: airport.terminals.map((terminal) => ({ id: terminal.id, name: terminal.name, shortName: terminal.shortName })),
      contacts: airport.contacts,
      sources: airport.sources,
      sections: airportSections(airport.slug),
      hasContent: content?.hasContent ?? false,
      aliases: aliasesFor(airport),
    };
  });
  const featured: ConciergeKnowledge['featured'] = FEATURED_AIRPORTS.flatMap((airport) =>
    airport.terminals.length > 1
      ? airport.terminals.map((terminal) => ({ airport: airport.slug, terminal: terminal.id, label: (lang === 'ms' ? terminal.name.ms : undefined) ?? terminal.name.en }))
      : [{ airport: airport.slug, label: airport.shortName }],
  );
  const airlines: KnowledgeAirline[] = contents.flatMap((content) => content.airlines.map((airline) => ({ ...airline, airport: content.airport.slug })));
  const categories = Object.fromEntries(Object.entries(FACILITY_CATEGORY_META).map(([key, meta]) => [key, meta.label])) as Record<FacilityCategory, LocalizedText>;
  return {
    lang,
    airports,
    featured,
    facilities: contents.flatMap((content) => content.facilities),
    outlets: contents.flatMap((content) => content.outlets),
    transport: contents.flatMap((content) => content.transport),
    carParks: contents.flatMap((content) => content.carParks),
    airlines,
    passages: passagesFromContent(),
    notices: getNotices(),
    groupContacts: [...GROUP_CONTACTS],
    sources: [...ALL_SOURCES],
    labels: { categories, modes: TRANSPORT_MODE_LABELS },
    searchDocs: buildSearchDocuments(lang),
    helpTopics: HELP_TOPICS.map((topic) => topic.slug),
    guides: GUIDES.map((guide) => guide.slug),
    officialSiteUrl: getSource('mahb-airports-site')?.url,
  };
}

const cache = new Map<Lang, ConciergeKnowledge>();

/** The knowledge pack for a language, built once per server process. */
export function buildConciergeKnowledge(lang: Lang): ConciergeKnowledge {
  let knowledge = cache.get(lang);
  if (!knowledge) {
    knowledge = build(lang);
    cache.set(lang, knowledge);
  }
  return knowledge;
}
