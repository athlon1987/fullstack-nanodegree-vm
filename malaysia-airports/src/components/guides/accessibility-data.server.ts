/** Server-only: the content the accessibility hub reuses from guides and the KLIA facilities. */
import { getAirport, getAirportContent, getGuide, getSource, localizeAirport, pick, resolveSources, type Lang, type Source } from '@/content';
import { airportsWithSection } from '@/components/shell/sections.server';
import type { FactView } from './fact-card';
import { guideStepView, type GuideStepView } from './guide-views.server';

export interface AccessibilityData {
  airlineSteps: GuideStepView[];
  airportSteps: GuideStepView[];
  butterflySteps: GuideStepView[];
  quietSpaces: FactView[];
  otherFacilityAirports: { slug: string; name: string }[];
  /** True once KLIA has accessible toilets on its map or in its directory (D-11). */
  accessibleToiletsPublished: boolean;
  /** The official special assistance page, used while the toilets are not published. */
  specialAssistanceUrl: string;
  /** What is not published yet for KLIA accessibility, from the content layer (D-04). */
  gaps?: { title: string; body: string; asOf?: string; sources: Source[] };
  /** Malaysia Airports CARE live chat. */
  careChatUrl?: string;
}

export function accessibilityData(lang: Lang): AccessibilityData {
  const mobility = getGuide('reduced-mobility');
  const hidden = getGuide('neurodivergent');
  const steps = (guide: typeof mobility, ids: string[]) =>
    ids.map((id) => guideStepView(guide, id, lang)).filter((step): step is GuideStepView => Boolean(step));
  const klia = getAirportContent('kul');
  const quietSpaces: FactView[] = (klia?.facilities ?? [])
    .filter((facility) => facility.category === 'calm-room' || facility.id.includes('sensory-walls'))
    .map((facility) => ({
      id: facility.id,
      title: pick(facility.name, lang),
      body: [facility.locationNote, facility.description, facility.access].filter(Boolean).map((text) => pick(text!, lang)).join(' '),
      provenance: facility.provenance,
      sources: resolveSources(facility.sources),
    }));
  const accessibleToiletsPublished =
    (klia?.facilities ?? []).some((facility) => facility.category === 'accessible-toilet') ||
    (klia?.maps ?? []).some((map) => map.pois.some((poi) => poi.kind === 'accessible-toilet'));
  const gapsNote = klia?.guidesNotes.find((note) => note.id === 'kul-accessibility-gaps');
  return {
    accessibleToiletsPublished,
    specialAssistanceUrl: getSource('mahb-special-assistance-klia-t1')?.url ?? 'https://www.malaysiaairports.com.my/',
    ...(gapsNote
      ? { gaps: { title: pick(gapsNote.title, lang), body: pick(gapsNote.body, lang), ...(gapsNote.asOf ? { asOf: gapsNote.asOf } : {}), sources: resolveSources(gapsNote.sources) } }
      : {}),
    ...(getSource('mahb-care-chat') ? { careChatUrl: getSource('mahb-care-chat')!.url } : {}),
    airlineSteps: steps(mobility, ['airline', 'meet-assist', 'tell-details']),
    airportSteps: steps(mobility, ['airport-page']),
    butterflySteps: steps(hidden, ['what', 'register', 'priority']),
    quietSpaces,
    otherFacilityAirports: airportsWithSection('facilities')
      .filter((slug) => slug !== 'kul')
      .map((slug) => {
        const airport = getAirport(slug);
        return { slug, name: airport ? localizeAirport(airport, lang).shortName : slug.toUpperCase() };
      }),
  };
}
