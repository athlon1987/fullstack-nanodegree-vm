import { airportsWithContent, getAirportContent, getNotices, resolveSources, type Source } from '@/content';
import { isLang } from '@/lib/i18n';
import { journeyExtras } from '@/components/flights/journey-content';

/**
 * The journey content of one airport (notes, places near gates, airline assistance, notices and
 * the sources they cite) as static JSON built at build time. My journey loads it only for the
 * airports of the flights saved on this device, instead of carrying every airport's notes in
 * the page (performance-06).
 */
export function generateStaticParams() {
  return airportsWithContent().map((airport) => ({ airport }));
}

export async function GET(_request: Request, context: { params: Promise<{ lang: string; airport: string }> }) {
  const { lang, airport } = await context.params;
  const content = isLang(lang) ? getAirportContent(airport) : undefined;
  if (!isLang(lang) || !content || content.airport.slug !== airport) return Response.json({ error: 'not-found' }, { status: 404 });
  const extras = journeyExtras(content, lang);
  const notices = getNotices(content.airport.slug);
  const ids = new Set<string>([
    ...content.guidesNotes.flatMap((note) => note.sources),
    ...notices.flatMap((notice) => notice.sources),
    ...(extras.places ?? []).flatMap((place) => place.sources),
    ...Object.values(extras.airlineAssistance ?? {}).flatMap((service) => service.sources),
    ...(extras.fastTrack?.sources ?? []),
  ]);
  const sources: Record<string, Source> = Object.fromEntries(resolveSources([...ids]).map((source) => [source.id, source]));
  return Response.json({ slug: content.airport.slug, guidesNotes: content.guidesNotes, ...extras, notices, sources });
}
