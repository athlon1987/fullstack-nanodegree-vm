/**
 * Server helpers for pages under `/[lang]/[airport]/…`. Feature engineers: this is the whole
 * recipe for a section page (see `docs/engineering/handoffs/shell.md`):
 *
 *   // src/app/[lang]/[airport]/parking/page.tsx
 *   export const generateStaticParams = () => sectionStaticParams('parking');
 *   export const generateMetadata = (props: PageProps<'/[lang]/[airport]/parking'>) => airportSectionMetadata(props.params, 'parking');
 *
 *   export default function Page({ params }: PageProps<'/[lang]/[airport]/parking'>) {
 *     return <Suspense fallback={<SectionSkeleton />}><Parking params={params} /></Suspense>;
 *   }
 *   async function Parking({ params }: { params: AirportPageParams }) {
 *     const { t, airport, content } = await loadAirportPage(params, 'parking');   // 404s when the airport has no parking content
 *     return <><PageHeader … /><Container>…</Container></>;
 *   }
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAirportContent, type Airport, type AirportContent, type Lang } from '@/content';
import { getT, toLang, type Translator } from '@/lib/i18n';
import { getSection, type AirportSectionId } from '@/components/shell/sections';
import { airportSections, sectionStaticParams } from '@/components/shell/sections.server';

export { sectionStaticParams };

/** The `params` promise of any page or layout under `/[lang]/[airport]`. */
export type AirportPageParams = Promise<{ lang: string; airport: string }>;

/** Everything a page under an airport needs. */
export interface AirportPageContext {
  lang: Lang;
  t: Translator;
  airport: Airport;
  content: AirportContent;
  /** The sections this airport has, in navigation order. */
  sections: AirportSectionId[];
}

/**
 * Resolve the route params into the airport and its content. Answers with the not-found page
 * when the airport is unknown or does not have `section`.
 *
 * Await it INSIDE a `<Suspense>` child, never at the top of a page or layout (Next.js notes, section 5).
 */
export async function loadAirportPage(params: AirportPageParams, section: AirportSectionId = 'overview'): Promise<AirportPageContext> {
  return loadAirportPageFor(params, (sections) => sections.includes(section));
}

/**
 * Like `loadAirportPage`, for a page that also serves an honest empty state to some airports
 * without its section (the map's "no map yet" for airports with facilities; transit's simple page
 * for airports with content). `accepts` decides; every other airport gets the not-found page.
 */
export async function loadAirportPageFor(
  params: AirportPageParams,
  accepts: (sections: readonly AirportSectionId[], slug: string) => boolean,
): Promise<AirportPageContext> {
  const { lang: rawLang, airport: slug } = await params;
  const lang = toLang(rawLang);
  const content = getAirportContent(slug);
  // Only the canonical lower-case slug is a page: `/en/KUL` is not.
  if (!content || content.airport.slug !== slug) notFound();
  const sections = airportSections(content.airport.slug);
  if (!accepts(sections, content.airport.slug)) notFound();
  return { lang, t: getT(lang), airport: content.airport, content, sections };
}

/**
 * Metadata for a section page: "Parking: KLIA" with the section's one-line description.
 *
 * An unknown airport, or one without the section, gets the not-found title and `noindex`: the
 * page itself answers with the not-found page, so the tab must not say "Parking at Subang"
 * (C-06). Pages that serve an honest empty state to some airports without the section pass
 * `emptyState`: those keep their title but are not indexed.
 */
export async function airportSectionMetadata(
  params: AirportPageParams,
  section: AirportSectionId,
  overrides: { title?: string; description?: string } = {},
  options: { emptyState?: (sections: readonly AirportSectionId[], slug: string) => boolean } = {},
): Promise<Metadata> {
  const { lang, airport: slug } = await params;
  const t = getT(toLang(lang));
  const airport = getAirportContent(slug)?.airport;
  const missing: Metadata = { title: t('errors.notFoundTitle'), robots: { index: false, follow: false } };
  if (!airport || airport.slug !== slug) return missing;
  const sections = airportSections(airport.slug);
  const has = sections.includes(section);
  const empty = !has && (options.emptyState?.(sections, airport.slug) ?? false);
  if (!has && !empty) return missing;
  const meta = getSection(section);
  const title = overrides.title ?? (section === 'overview' ? `${airport.name} (${airport.code})` : `${t(meta.labelKey)}: ${airport.shortName}`);
  const description = overrides.description ?? (meta.descriptionKey ? `${t(meta.descriptionKey)} ${airport.name}.` : t('airportPage.metaDescription', { airport: airport.name }));
  return empty ? { title, description, robots: { index: false, follow: true } } : { title, description };
}

/** The map's empty state serves airports with a facilities directory but no map (C-06). */
export const mapEmptyState = (sections: readonly AirportSectionId[]): boolean => sections.includes('facilities');
