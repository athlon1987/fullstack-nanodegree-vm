/**
 * Server-only builders for the transport and parking pages: they read the content layer, pick the
 * page language and resolve sources, so Client Components receive small, serialisable props and
 * never import `@/content`.
 */
import { FAQS, getGuide, getSource, hasTranslation, localizeAirport, pick, resolveSources, terminalLabel, type AirportContent, type GuideNote, type Lang, type LocalizedText, type Source } from '@/content';
import { PLANNER_MODES } from './transport-logic';
import type { NoteView, TerminalInfo, ToutsView, TransportContext } from './transport-types';

/** The Help answer about ride touts, scoped to the airports it applies to. */
const TOUTS_FAQ = 'scam-touts';
/** The arriving guide's statement it repeats ("Leaving the airport": book at a counter or in your app). */
const TOUTS_GUIDE = { slug: 'arriving', step: 'official-transport' };

/**
 * The airport's anti-touting statement for the transport page (C-02): the arriving guide's step,
 * with its sources, where the Help answer about touts applies to this airport and the airport has
 * taxis or e-hailing to warn about. Falls back to the Help answer's own words.
 */
export function toutsView(content: AirportContent, lang: Lang): ToutsView | undefined {
  const rides = content.transport.some((option) => option.mode === 'taxi' || option.mode === 'e-hailing');
  const faq = FAQS.find((item) => item.id === TOUTS_FAQ && item.airports?.includes(content.airport.slug));
  if (!rides || !faq) return undefined;
  const step = getGuide(TOUTS_GUIDE.slug)
    ?.sections.flatMap((section) => section.steps)
    .find((item) => item.id === TOUTS_GUIDE.step);
  const helpHref = `/help/${faq.topic}#${faq.id}`;
  if (step?.body) return { body: pick(step.body, lang), provenance: step.provenance, sourceIds: step.sources ?? faq.sources, helpHref };
  const view: ToutsView = { body: pick(faq.answer, lang), provenance: faq.provenance, sourceIds: faq.sources, helpHref };
  if (faq.asOf) view.asOf = faq.asOf;
  return view;
}

const PASSENGER_SITE = 'https://airports.malaysiaairports.com.my/';

/** A source lookup for the given ids. */
export function sourceLookup(ids: Iterable<string>): Record<string, Source> {
  return Object.fromEntries(resolveSources([...new Set(ids)]).map((source) => [source.id, source]));
}

/** Terminals with short labels and short level names ("Level 1" from "Level 1: buses"). */
export function terminalInfo(content: AirportContent, lang: Lang): TerminalInfo[] {
  return content.airport.terminals.map((terminal) => ({
    id: terminal.id,
    label: terminalLabel(content.airport, terminal.id, lang, { short: true }),
    levels: Object.fromEntries(terminal.levels.map((level) => [level.id, pick(level.name, lang).split(':')[0].trim()])),
  }));
}

/** The airport's official website: the most specific official page we cite for it. */
export function officialSite(content: AirportContent): string {
  const candidates = resolveSources(content.airport.sources);
  const page = candidates.find((source) => source.kind === 'official' && source.url.startsWith(PASSENGER_SITE) && source.url.length > PASSENGER_SITE.length);
  return page?.url ?? getSource('mahb-airports-site')?.url ?? PASSENGER_SITE;
}

/** A guide note in the page language. */
export function noteView(note: GuideNote, lang: Lang): NoteView {
  const view: NoteView = { id: note.id, title: pick(note.title, lang), body: pick(note.body, lang), provenance: note.provenance, sourceIds: note.sources };
  if (note.asOf) view.asOf = note.asOf;
  return view;
}

/** True when some of the given texts fall back to English on a Malay page. */
export function needsTranslationNotice(texts: readonly (LocalizedText | undefined)[], lang: Lang): boolean {
  return lang !== 'en' && texts.some((text) => text !== undefined && !hasTranslation(text, lang));
}

/** Everything the transport page shows, split by section. */
export interface TransportPageModel {
  context: TransportContext;
  /** Options compared in the planner (rail, coach, taxi, e-hailing, car rental, private car, shuttle). */
  planner: AirportContent['transport'];
  /** Inter-terminal options that link two or more terminals. */
  between: AirportContent['transport'];
  /** Inter-terminal options inside a single terminal (people movers). */
  inside: AirportContent['transport'];
  /** Transit advice that applies to the whole airport (for KLIA: there is no airside link). */
  transferNotes: NoteView[];
  /** Planner modes with no published option. */
  missingModes: (typeof PLANNER_MODES)[number][];
  gaps?: NoteView;
  translationMissing: boolean;
}

/** Build the transport page model for an airport. */
export function transportPageModel(content: AirportContent, lang: Lang): TransportPageModel {
  const planner = content.transport.filter((option) => PLANNER_MODES.includes(option.mode));
  const movers = content.transport.filter((option) => option.mode === 'inter-terminal');
  const between = movers.filter((option) => new Set(option.boarding.map((point) => point.terminal)).size > 1);
  const inside = movers.filter((option) => !between.includes(option));
  const transfer = between.length > 0 ? content.guidesNotes.filter((note) => note.topic === 'transit' && !note.appliesTo) : [];
  const gaps = content.guidesNotes.find((note) => note.id === `${content.airport.slug}-content-gaps`);
  const present = new Set(planner.map((option) => option.mode));
  const touts = toutsView(content, lang);

  const sourceIds = [
    ...content.transport.flatMap((option) => option.sources),
    ...(touts?.sourceIds ?? []),
    ...transfer.flatMap((note) => note.sources),
    ...(gaps?.sources ?? []),
  ];

  const texts = [
    ...content.transport.flatMap((option) => [
      option.name,
      option.description,
      option.frequency,
      option.accessibility?.note,
      option.hours?.kind === 'text' ? option.hours.text : option.hours?.note,
      ...option.destinations.flatMap((destination) => [destination.name, destination.note]),
      ...option.boarding.map((point) => point.note),
    ]),
    ...transfer.flatMap((note) => [note.title, note.body]),
  ];

  const model: TransportPageModel = {
    context: {
      slug: content.airport.slug,
      airportName: localizeAirport(content.airport, lang).shortName,
      timezone: content.airport.timezone,
      terminals: terminalInfo(content, lang),
      sources: sourceLookup(sourceIds),
      officialUrl: officialSite(content),
      ...(touts ? { touts } : {}),
    },
    planner,
    between,
    inside,
    transferNotes: transfer.map((note) => noteView(note, lang)),
    missingModes: PLANNER_MODES.filter((mode) => !present.has(mode)),
    translationMissing: needsTranslationNotice(texts, lang),
  };
  if (gaps) model.gaps = noteView(gaps, lang);
  return model;
}
