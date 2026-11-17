/**
 * Server-only builders: localised, serialisable views of guides and airport notes.
 * Never import from a Client Component (it reads the whole content layer).
 */
import {
  GUIDES,
  airportsWithContent,
  getAirportContent,
  guideScopes,
  guideStepScopes,
  hasTranslation,
  pick,
  resolveSources,
  type Guide,
  type GuideNote,
  type GuideScope,
  type Lang,
  type Provenance,
  type Source,
} from '@/content';
import { GUIDE_GROUPS, GUIDE_NOTE_TOPICS, guideIcon, type GuideGroupId } from './guide-meta';
import type { IconKey } from '@/components/ui/icon';

export interface GuideActionView {
  label: string;
  href: string;
  external: boolean;
}

export interface GuideStepView {
  id: string;
  title: string;
  body: string;
  provenance: Provenance;
  sources: Source[];
  actions: GuideActionView[];
  scopes: GuideScope[];
}

export interface GuideSectionView {
  id: string;
  title: string;
  intro?: string;
  steps: GuideStepView[];
}

export interface GuideCardView {
  slug: string;
  title: string;
  summary: string;
  icon: IconKey;
  scopes: GuideScope[];
  stepCount: number;
}

export interface GuideView extends GuideCardView {
  sections: GuideSectionView[];
  asOf?: string;
  sources: Source[];
  translationMissing: boolean;
}

export interface AirportNoteView {
  id: string;
  airportCode: string;
  airportName: string;
  title: string;
  body: string;
  provenance: Provenance;
  sources: Source[];
}

function stepCount(guide: Guide): number {
  return guide.sections.reduce((sum, section) => sum + section.steps.length, 0);
}

function guideTranslated(guide: Guide, lang: Lang): boolean {
  if (!hasTranslation(guide.title, lang) || !hasTranslation(guide.summary, lang)) return false;
  return guide.sections.every(
    (section) =>
      hasTranslation(section.title, lang) &&
      hasTranslation(section.intro, lang) &&
      section.steps.every((step) => hasTranslation(step.title, lang) && hasTranslation(step.body, lang)),
  );
}

export function toGuideCard(guide: Guide, lang: Lang): GuideCardView {
  return {
    slug: guide.slug,
    title: pick(guide.title, lang),
    summary: pick(guide.summary, lang),
    icon: guideIcon(guide.slug),
    scopes: guideScopes(guide),
    stepCount: stepCount(guide),
  };
}

export function toGuideView(guide: Guide, lang: Lang): GuideView {
  return {
    ...toGuideCard(guide, lang),
    sections: guide.sections.map((section) => ({
      id: section.id,
      title: pick(section.title, lang),
      intro: section.intro ? pick(section.intro, lang) : undefined,
      steps: section.steps.map((step) => ({
        id: step.id,
        title: pick(step.title, lang),
        body: pick(step.body, lang),
        provenance: step.provenance,
        sources: resolveSources(step.sources),
        actions: (step.actions ?? []).map((action) => ({
          label: pick(action.label, lang),
          href: action.href,
          external: /^https?:/.test(action.href),
        })),
        scopes: [...guideStepScopes(guide.slug, step.id)],
      })),
    })),
    asOf: guide.asOf,
    sources: resolveSources(guide.sources),
    translationMissing: !guideTranslated(guide, lang),
  };
}

/** One step of a guide as a view, for pages that reuse guide content (accessibility hub). */
export function guideStepView(guide: Guide | undefined, stepId: string, lang: Lang): GuideStepView | undefined {
  if (!guide) return undefined;
  for (const section of toGuideView(guide, lang).sections) {
    const step = section.steps.find((item) => item.id === stepId);
    if (step) return step;
  }
  return undefined;
}

/** Hub groups with their guide cards, in display order. */
export function guideGroups(lang: Lang): { id: GuideGroupId; cards: GuideCardView[] }[] {
  const placed = new Set(GUIDE_GROUPS.flatMap((group) => group.slugs));
  return GUIDE_GROUPS.map((group, index) => {
    const listed = group.slugs.map((slug) => GUIDES.find((guide) => guide.slug === slug)).filter((guide): guide is Guide => Boolean(guide));
    const extra = index === GUIDE_GROUPS.length - 1 ? GUIDES.filter((guide) => !placed.has(guide.slug)) : [];
    return { id: group.id, cards: [...listed, ...extra].map((guide) => toGuideCard(guide, lang)) };
  });
}

export function toNoteView(note: GuideNote, lang: Lang): AirportNoteView {
  const content = getAirportContent(note.airport);
  return {
    id: note.id,
    airportCode: content?.airport.code ?? note.airport.toUpperCase(),
    airportName: content?.airport.shortName ?? note.airport.toUpperCase(),
    title: pick(note.title, lang),
    body: pick(note.body, lang),
    provenance: note.provenance,
    sources: resolveSources(note.sources),
  };
}

/** Sourced airport notes for a guide: every airport with content, topics from `GUIDE_NOTE_TOPICS`. */
export function airportNotesForGuide(slug: string, lang: Lang): AirportNoteView[] {
  const topics = GUIDE_NOTE_TOPICS[slug];
  if (!topics) return [];
  const notes: AirportNoteView[] = [];
  for (const airport of airportsWithContent()) {
    for (const note of getAirportContent(airport)?.guidesNotes ?? []) {
      // Content-gap notes are honest but generic; they belong on the airport pages, not here.
      if (topics.includes(note.topic) && note.provenance !== 'suggestion') notes.push(toNoteView(note, lang));
    }
  }
  return notes;
}
