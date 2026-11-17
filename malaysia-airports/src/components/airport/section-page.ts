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
  const { lang: rawLang, airport: slug } = await params;
  const lang = toLang(rawLang);
  const content = getAirportContent(slug);
  // Only the canonical lower-case slug is a page: `/en/KUL` is not.
  if (!content || content.airport.slug !== slug) notFound();
  const sections = airportSections(content.airport.slug);
  if (!sections.includes(section)) notFound();
  return { lang, t: getT(lang), airport: content.airport, content, sections };
}

/**
 * Metadata for a section page: "Parking: KLIA" with the section's one-line description.
 * Unknown airports get the not-found title.
 */
export async function airportSectionMetadata(
  params: AirportPageParams,
  section: AirportSectionId,
  overrides: { title?: string; description?: string } = {},
): Promise<Metadata> {
  const { lang, airport: slug } = await params;
  const t = getT(lang);
  const airport = getAirportContent(slug)?.airport;
  if (!airport) return { title: t('errors.notFoundTitle') };
  const meta = getSection(section);
  const title = overrides.title ?? (section === 'overview' ? `${airport.name} (${airport.code})` : `${t(meta.labelKey)}: ${airport.shortName}`);
  const description = overrides.description ?? (meta.descriptionKey ? `${t(meta.descriptionKey)} ${airport.name}.` : t('airportPage.metaDescription', { airport: airport.name }));
  return { title, description };
}
