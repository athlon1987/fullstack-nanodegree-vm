/**
 * Server-side slices of the content layer that the journey timeline and the status card use
 * (B-11, B-12, B-13). Server only: it reads `@/content`; pass the results to Client Components
 * as plain data. Nothing here invents a fact: every value is read from a sourced record, and
 * what is missing stays missing (the timeline then says it is not published).
 */
import { getFaq, pick, resolveSources, type AirlineAtAirport, type AirportContent, type Lang, type LocalizedText } from '@/content';
import { gatePrefixesOf } from '@/lib/flights/gates';
import type { JourneyAirportContent, JourneyPlace, JourneyService } from '@/lib/journey';
import type { PublishedCheckIn } from './flight-status-hero';

/** Airline assistance notice periods we can source, by IATA code (FAQ records only). */
const AIRLINE_ASSISTANCE_FAQS: Readonly<Record<string, string>> = { MH: 'wheelchair-request' };

/** Places near gates, airline assistance notes and Fast Track for an airport's journeys. */
export function journeyExtras(content: AirportContent, lang: Lang): Pick<JourneyAirportContent, 'places' | 'airlineAssistance' | 'fastTrack' | 'fastTrackByTerminal'> {
  const slug = content.airport.slug;
  const places: JourneyPlace[] = [];
  for (const facility of content.facilities) {
    if (facility.category !== 'lounge' || facility.zone !== 'airside') continue;
    const prefixes = gatePrefixesOf(facility.locationNote?.en);
    if (prefixes.length === 0) continue;
    places.push({
      id: facility.id,
      kind: 'lounge',
      name: facility.name,
      terminal: facility.terminal,
      airside: true,
      gatePrefixes: prefixes,
      ...(facility.locationNote ? { location: facility.locationNote } : {}),
      href: `/${slug}/lounges`,
      provenance: facility.provenance,
      sources: facility.sources,
    });
  }
  for (const outlet of content.outlets) {
    if (outlet.zone !== 'airside' || outlet.kind === 'service') continue;
    const prefixes = gatePrefixesOf(outlet.locationNote?.en);
    if (prefixes.length === 0) continue;
    places.push({
      id: outlet.id,
      kind: 'outlet',
      name: { en: outlet.name },
      terminal: outlet.terminal,
      airside: true,
      gatePrefixes: prefixes,
      ...(outlet.locationNote ? { location: outlet.locationNote } : {}),
      href: `/${slug}/shop-dine/${outlet.slug}`,
      provenance: 'official',
      sources: outlet.sources,
    });
  }

  const airlineAssistance: Record<string, JourneyService> = {};
  for (const [code, faqId] of Object.entries(AIRLINE_ASSISTANCE_FAQS)) {
    const faq = getFaq(faqId);
    if (!faq || !content.airlines.some((airline) => airline.code === code)) continue;
    airlineAssistance[code] = { title: faq.question, body: faq.answer, provenance: faq.provenance, sources: faq.sources, href: `/help/${faq.topic}#${faq.id}` };
  }

  // Fast Track: only when the content layer publishes a record for it (closes with D-02). Each
  // terminal with its own record gets it, so a Terminal 2 flight links to the Terminal 2 record
  // (D-02 hand-off, round 2).
  const records = content.facilities.filter((facility) => /fast[\s-]?track/i.test(`${facility.id} ${facility.name.en}`));
  const service = (record: (typeof records)[number]): JourneyService => ({
    title: { en: `Optional: ${record.name.en}`, ms: `Pilihan: ${pick(record.name, 'ms')}` } satisfies LocalizedText,
    body: record.description,
    href: `/${slug}/facilities#${record.id}`,
    ...(record.bookingUrl ? { bookingUrl: record.bookingUrl } : {}),
    provenance: record.provenance,
    sources: record.sources,
  });
  const fastTrack = records[0] ? service(records[0]) : undefined;
  const fastTrackByTerminal = Object.fromEntries(records.flatMap((record) => (record.terminal ? [[record.terminal, service(record)] as const] : [])));
  void lang;
  return { places, airlineAssistance, ...(fastTrack ? { fastTrack } : {}), ...(Object.keys(fastTrackByTerminal).length > 0 ? { fastTrackByTerminal } : {}) };
}

/** Read a field that is plain text today and may become `LocalizedText` (D-03 hand-off). */
function textOf(value: unknown, lang: Lang): { text: string; english: boolean } | null {
  if (typeof value === 'string') return value ? { text: value, english: lang !== 'en' } : null;
  if (value && typeof value === 'object' && 'en' in value) {
    const localized = value as LocalizedText;
    const text = pick(localized, lang);
    return { text, english: lang !== 'en' && !localized[lang as 'ms'] };
  }
  return null;
}

/** The airline's published check-in area for the status card, with its provenance and sources. */
export function publishedCheckInFor(airline: AirlineAtAirport, lang: Lang): PublishedCheckIn | undefined {
  const checkIn = textOf((airline as { checkIn?: unknown }).checkIn, lang);
  if (!checkIn) return undefined;
  return {
    airline: airline.name,
    text: checkIn.text,
    english: checkIn.english,
    provenance: airline.basis === 'third-party' ? 'estimated' : 'official',
    sources: resolveSources(airline.sources),
  };
}
