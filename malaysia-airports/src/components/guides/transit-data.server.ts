/**
 * Server-only: the content slices the transit page and planner need, localised and with sources
 * resolved, so the Client Component receives plain props and never imports the content layer.
 */
import {
  getFaq,
  getGuide,
  getNotices,
  localizeAirport,
  pick,
  resolveSources,
  terminalLabel,
  type AirportContent,
  type Faq,
  type Facility,
  type GuideNote,
  type Lang,
  type Notice,
  type Source,
  type TerminalId,
  type TransportOption,
} from '@/content';
import { formatCurrency } from '@/lib/format';
import type { Translator } from '@/lib/i18n/translate';
import type { FactView } from './fact-card';
import { guideStepView } from './guide-views.server';
import type { TransitTerminal } from './transit-logic';

export interface RestView {
  id: string;
  name: string;
  terminal: string;
  zone: string;
  location?: string;
  description: string;
  provenance: FactView['provenance'];
  sources: Source[];
}

export interface TransitData {
  airportName: string;
  airportSlug: string;
  hasLounges: boolean;
  /** The official note on changing terminals (KLIA). */
  interTerminal?: FactView;
  /** Published ways between terminals, with fare, frequency and boarding details. */
  options: FactView[];
  mdac?: FactView;
  customs?: FactView;
  entry?: FactView;
  checkIn: Partial<Record<TransitTerminal, FactView>>;
  gates: Partial<Record<TransitTerminal, FactView>>;
  rest: RestView[];
  late: FactView[];
  /** Sources for steps that are this prototype's own guidance. */
  methodSources: Source[];
  /**
   * Notices about the Aerotrain to the Terminal 1 C gates, with their sources (D-08 hand-off,
   * round 2): the gate step reads them through `OpsStatus`, which says whether one is in effect
   * or planned and links to it. Absent at airports without an Aerotrain.
   */
  aerotrain?: { notices: Notice[]; sources: Record<string, Source> };
}

function aerotrainNotices(slug: string): TransitData['aerotrain'] {
  if (slug !== 'kul') return undefined;
  const notices = getNotices(slug).filter((notice) => /aerotrain/i.test(notice.id) || /aerotrain/i.test(notice.title.en));
  const sources = Object.fromEntries(resolveSources([...new Set(notices.flatMap((notice) => notice.sources))]).map((source) => [source.id, source]));
  return { notices, sources };
}

function noteFact(note: GuideNote, lang: Lang): FactView {
  return { id: note.id, title: pick(note.title, lang), body: pick(note.body, lang), provenance: note.provenance, sources: resolveSources(note.sources) };
}

function faqFact(faq: Faq | undefined, lang: Lang): FactView | undefined {
  return faq ? { id: faq.id, title: pick(faq.question, lang), body: pick(faq.answer, lang), provenance: faq.provenance, sources: resolveSources(faq.sources) } : undefined;
}

function optionFact(option: TransportOption, content: AirportContent, lang: Lang, t: Translator): FactView {
  const details: { label: string; value: string }[] = [];
  for (const destination of option.destinations) {
    if (destination.fare) {
      const note = destination.note ? pick(destination.note, lang) : undefined;
      // A free service's note already says so ("Free of charge."); don't repeat it.
      const value = destination.fare.amount === 0 ? (note ?? t('common.labels.free')) : note ? `${formatCurrency(destination.fare, lang)}. ${note}` : formatCurrency(destination.fare, lang);
      details.push({ label: t('guidePages.transit.official.fare'), value });
    }
  }
  if (option.frequency) details.push({ label: t('guidePages.transit.official.frequency'), value: pick(option.frequency, lang) });
  for (const boarding of option.boarding) {
    details.push({
      label: `${t('guidePages.transit.official.boarding')}: ${terminalLabel(content.airport, boarding.terminal, lang, { short: true })}`,
      value: pick(boarding.note, lang),
    });
  }
  return {
    id: option.id,
    title: pick(option.name, lang),
    body: option.description ? pick(option.description, lang) : '',
    provenance: option.provenance,
    sources: resolveSources(option.sources),
    details,
  };
}

function zoneLabel(facility: Facility, t: Translator): string {
  if (facility.zone === 'airside') return t('common.labels.airside');
  if (facility.zone === 'landside') return t('common.labels.landside');
  if (facility.zone === 'both') return `${t('common.labels.landside')}, ${t('common.labels.airside')}`;
  return t('common.labels.unverified');
}

const asTerminal = (id: TerminalId | undefined): TransitTerminal | undefined => (id === 'T1' || id === 'T2' ? id : undefined);

export function transitData(content: AirportContent, lang: Lang, t: Translator, hasLounges: boolean): TransitData {
  const notes = content.guidesNotes;
  const interTerminalNote = notes.find((note) => note.topic === 'transit' && note.provenance === 'official');
  const mdacNote = notes.find((note) => note.topic === 'landing' && note.appliesTo?.scope === 'international');
  const checkIn: Partial<Record<TransitTerminal, FactView>> = {};
  const gates: Partial<Record<TransitTerminal, FactView>> = {};
  for (const note of notes) {
    const terminal = asTerminal(note.appliesTo?.terminal);
    if (!terminal || note.appliesTo?.airline) continue;
    if (note.topic === 'check-in' && !checkIn[terminal]) checkIn[terminal] = noteFact(note, lang);
    if (note.topic === 'gate' && note.provenance === 'official' && !gates[terminal]) gates[terminal] = noteFact(note, lang);
  }
  const immigrationGuide = getGuide('immigration-customs');
  const step = (id: string): FactView | undefined => {
    const view = guideStepView(immigrationGuide, id, lang);
    return view ? { id: view.id, title: view.title, body: view.body, provenance: view.provenance, sources: view.sources } : undefined;
  };
  const rest = content.facilities
    .filter((facility) => facility.category === 'hotel' || facility.category === 'rest')
    .map((facility) => ({
      id: facility.id,
      name: pick(facility.name, lang),
      terminal: terminalLabel(content.airport, facility.terminal, lang),
      zone: zoneLabel(facility, t),
      location: facility.locationNote ? pick(facility.locationNote, lang) : undefined,
      description: pick(facility.description, lang),
      provenance: facility.provenance,
      sources: resolveSources(facility.sources),
    }));

  return {
    airportName: localizeAirport(content.airport, lang).shortName,
    airportSlug: content.airport.slug,
    hasLounges,
    interTerminal: interTerminalNote ? noteFact(interTerminalNote, lang) : undefined,
    // Only services that link two terminals: people movers inside one terminal (the Aerotrain) are not a transfer option.
    options: content.transport
      .filter((option) => option.mode === 'inter-terminal' && new Set(option.boarding.map((boarding) => boarding.terminal)).size > 1)
      .map((option) => optionFact(option, content, lang, t)),
    mdac: mdacNote ? noteFact(mdacNote, lang) : undefined,
    customs: step('declare'),
    entry: step('documents'),
    checkIn,
    gates,
    rest,
    late: ['missed-connection', 'flight-delay-care', 'flight-delay-refund'].map((id) => faqFact(getFaq(id), lang)).filter((fact): fact is FactView => Boolean(fact)),
    methodSources: resolveSources(['prototype-method']),
    aerotrain: aerotrainNotices(content.airport.slug),
  };
}
