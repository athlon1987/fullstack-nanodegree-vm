/** Server-only: the content the accessibility hub reuses from guides and the KLIA facilities. */
import { getAirport, getAirportContent, getGuide, pick, resolveSources, type Lang } from '@/content';
import { airportsWithSection } from '@/components/shell/sections.server';
import type { FactView } from './fact-card';
import { guideStepView, type GuideStepView } from './guide-views.server';

export interface AccessibilityData {
  airlineSteps: GuideStepView[];
  airportSteps: GuideStepView[];
  butterflySteps: GuideStepView[];
  quietSpaces: FactView[];
  otherFacilityAirports: { slug: string; name: string }[];
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
  return {
    airlineSteps: steps(mobility, ['airline', 'meet-assist', 'tell-details']),
    airportSteps: steps(mobility, ['airport-page']),
    butterflySteps: steps(hidden, ['what', 'register', 'priority']),
    quietSpaces,
    otherFacilityAirports: airportsWithSection('facilities')
      .filter((slug) => slug !== 'kul')
      .map((slug) => ({ slug, name: getAirport(slug)?.shortName ?? slug.toUpperCase() })),
  };
}
