/**
 * Types for the concierge answer engine. Everything here is plain data, so an answer can cross
 * the network (`/api/concierge`), be stored in the tab's session storage and be rendered by
 * Client Components without importing the content layer.
 */
import type {
  AirlineAtAirport,
  CarPark,
  Contact,
  Facility,
  FacilityCategory,
  Lang,
  LocalizedText,
  Notice,
  Outlet,
  Provenance,
  Source,
  TerminalId,
  TransportMode,
  TransportOption,
} from '@/content/types';
import type { Flight, FlightDirection, FlightStatus } from '@/lib/flights/types';
import type { SearchDocument } from '@/lib/search/engine';

/* -------------------------------------------------------------------------------------------
 * Knowledge: the slice of the content layer the engine reads
 * ---------------------------------------------------------------------------------------- */

/** An airport as the engine needs it. */
export interface KnowledgeAirport {
  slug: string;
  code: string;
  name: string;
  shortName: string;
  city: string;
  terminals: { id: TerminalId; name: LocalizedText; shortName: LocalizedText }[];
  contacts: Contact[];
  sources: string[];
  /** Airport sections that exist (same rule as the shell's navigation). */
  sections: string[];
  hasContent: boolean;
  /** Lower-case, accent-free names that identify this airport in a question. */
  aliases: string[];
}

/** A citable passage: an FAQ answer, a guide step or an airport guide note. */
export interface KnowledgePassage {
  /** `faq:<id>`, `guide:<slug>:<step>` or `note:<id>`. */
  id: string;
  kind: 'faq' | 'guide' | 'note';
  /** FAQ topic, guide slug or note topic. */
  topic: string;
  /** Airport slugs it is limited to; empty for network-wide passages. */
  airports: string[];
  terminal?: TerminalId;
  airline?: string;
  gatePrefixes?: string[];
  title: LocalizedText;
  body: LocalizedText;
  provenance: Provenance;
  sourceIds: string[];
  /** Internal link without the locale. */
  href?: string;
  /** Guide and section titles (English), used only to tell which terminal a step is about. */
  scope?: string;
  /** A "what we have not verified" note: shown only when an answer is missing. */
  gap?: boolean;
}

/** An airline fact with the airport it belongs to. */
export type KnowledgeAirline = AirlineAtAirport & { airport: string };

/** Everything the engine reads. Built on the server by `buildConciergeKnowledge(lang)`. */
export interface ConciergeKnowledge {
  lang: Lang;
  airports: KnowledgeAirport[];
  /** Airports (and KLIA terminals) offered when a question needs an airport. */
  featured: { airport: string; terminal?: TerminalId; label: string }[];
  facilities: Facility[];
  outlets: Outlet[];
  transport: TransportOption[];
  carParks: CarPark[];
  airlines: KnowledgeAirline[];
  passages: KnowledgePassage[];
  notices: Notice[];
  groupContacts: Contact[];
  sources: Source[];
  labels: {
    categories: Record<FacilityCategory, LocalizedText>;
    modes: Record<TransportMode, LocalizedText>;
  };
  /** The site search documents for `lang` (search fallback and links). */
  searchDocs: SearchDocument[];
  /** Help topic slugs and guide slugs that exist, for links. */
  helpTopics: string[];
  guides: string[];
  officialSiteUrl?: string;
  /**
   * Airline assistance notice periods we can source, by IATA code (round 4, 6.1.4). An airline
   * that is not listed has no published rule: the concierge says so and never guesses one.
   */
  assistanceNotice?: Record<string, { hours: number; late: LocalizedText; provenance: Provenance; sources: readonly string[] }>;
}

/* -------------------------------------------------------------------------------------------
 * Understanding a question
 * ---------------------------------------------------------------------------------------- */

export const CONCIERGE_INTENTS = [
  'check-in',
  'terminal-transfer',
  'transport',
  'dining',
  'facility',
  'layover',
  'parking',
  'lost-property',
  'assistance',
  'flight-delay',
  'flight-status',
  'gate',
  'notices',
  'contact',
  // Slot-specific intents whose first statement is the direct answer (B-08).
  'fare',
  'airline-terminal',
  'lounge',
  'fast-track',
  'duty-free',
  'service-status',
  'immigration',
  'arrival-time',
  'greeting',
  'unknown',
] as const;
export type ConciergeIntent = (typeof CONCIERGE_INTENTS)[number];

/** What the engine found in the question. */
export interface ConciergeSlots {
  /** Airport slug named in the question. */
  airport?: string;
  /** Terminals named, in order of mention. */
  terminals: TerminalId[];
  /** Flight designator as typed: `{ airline: 'MH', number: '2610' }`. */
  flight?: { airline: string; number: string };
  /** A transport destination named in the question. */
  destination?: string;
  category?: FacilityCategory;
  /** A length of time: "six-hour layover", "3 days", "90 minutes". */
  durationMinutes?: number;
  /** Gate as typed: `C12`, or just the letter `C`. */
  gate?: string;
  /** Transport priority words: cheapest, fastest, step-free. */
  priority?: 'price' | 'time' | 'accessibility';
  /** IATA code of an airline named in the question. */
  airline?: string;
  /** "nearest", "closest", "terdekat". */
  nearest: boolean;
  /** "my flight", "penerbangan saya". */
  myFlight: boolean;
  /** Wants to leave the airport during a layover. */
  leave: boolean;
  /** Mentions bags or luggage. */
  baggage: boolean;
  /** "accessible", "step-free", "wheelchair", "elderly", "warga emas": answers keep to step-free facts (B-08). */
  accessible: boolean;
  /** An airline named in words that is not in our airline records ("Emirates"), as typed. */
  airlineName?: string;
}

export interface Understanding {
  intent: ConciergeIntent;
  /** Score of the winning intent (0 when nothing matched). */
  score: number;
  slots: ConciergeSlots;
}

/* -------------------------------------------------------------------------------------------
 * Asking and answering
 * ---------------------------------------------------------------------------------------- */

/** Conversation context carried from one question to the next. */
export interface ConciergeContext {
  airport?: string;
  terminal?: TerminalId;
  /** A saved flight id (`mh2610-20261117-d`), only when the visitor chose to include it. */
  flightId?: string;
  /** The previous question's intent, for follow-ups such as "and in Terminal 2?". */
  intent?: ConciergeIntent;
  /** The previous question's facility category and destination, for the same follow-ups. */
  category?: FacilityCategory;
  destination?: string;
}

export interface ConciergeInput {
  question: string;
  lang: Lang;
  context?: ConciergeContext;
}

/** Where flights come from: the server flight feed (demonstration data in this prototype; round 5). */
export interface ConciergeFlightSource {
  /** ISO instant the data was generated for. */
  generatedAt: string;
  /** The boards could not be loaded (offline, the feed failing): say so instead of "not found". */
  unavailable?: boolean;
  get(id: string, airport?: string): Flight | null;
  /** Flights matching a designator such as `MH2610`, best first. */
  find(designator: string, airport?: string): Flight[];
}

export interface ConciergeDeps {
  knowledge: ConciergeKnowledge;
  /** Epoch milliseconds. Never read inside the engine. */
  now: number;
  flights?: ConciergeFlightSource | null;
}

/** One sentence of guidance with its provenance and sources. */
export interface AnswerStatement {
  title?: string;
  text: string;
  provenance: Provenance;
  sourceIds: string[];
  href?: string;
}

export interface FlightCard {
  type: 'flight';
  id: string;
  number: string;
  airline: string;
  direction: FlightDirection;
  /** Remote city. */
  place: string;
  airport: string;
  terminal: TerminalId;
  terminalLabel: string;
  scheduled: string;
  estimated: string;
  status: FlightStatus;
  delayMinutes: number;
  gate?: string;
  belt?: string;
  href: string;
  provenance: 'demo';
}

export interface FacilityCard {
  type: 'facility';
  id: string;
  name: string;
  category: FacilityCategory;
  categoryLabel: string;
  place: string;
  zone: 'landside' | 'airside' | 'both' | 'unknown';
  description?: string;
  location?: string;
  hours?: string;
  provenance: Provenance;
  sourceIds: string[];
  href?: string;
  mapHref?: string;
}

export interface OutletCard {
  type: 'outlet';
  id: string;
  name: string;
  category: string;
  place: string;
  zone: 'landside' | 'airside' | 'both' | 'unknown';
  description?: string;
  location?: string;
  hours?: string;
  halal?: 'certified' | 'pork-free' | 'non-halal';
  provenance: Provenance;
  sourceIds: string[];
  href?: string;
}

export interface TransportCard {
  type: 'transport';
  id: string;
  name: string;
  mode: TransportMode;
  modeLabel: string;
  operator?: string;
  /** Destinations matched by the question (or all the option lists). */
  rows: { name: string; fare?: string; duration?: string; note?: string }[];
  frequency?: string;
  highlight?: 'lowest-fare' | 'quickest';
  provenance: Provenance;
  sourceIds: string[];
  href?: string;
}

export interface CarParkCard {
  type: 'car-park';
  id: string;
  name: string;
  place: string;
  ratesPublished: boolean;
  /**
   * The car park's rate status in one sentence, from `rateStatusText` in `@/lib/parking`: the same
   * words as the parking page and the help FAQ (round 4, re-review 6.1.3).
   */
  rateText: string;
  /** No figure at all (`none` basis): shown as "not published" with the official link. */
  rateMissing?: boolean;
  estimate?: string;
  officialUrl?: string;
  provenance: Provenance;
  sourceIds: string[];
  href?: string;
}

export type AnswerCard = FlightCard | FacilityCard | OutletCard | TransportCard | CarParkCard;

/** A follow-up: a link into the site or another question to ask. */
export type AnswerAction =
  | { kind: 'link'; label: string; href: string; icon?: string }
  | { kind: 'ask'; label: string; question: string; context?: ConciergeContext };

export interface AnswerContact {
  kind: Contact['kind'];
  label: string;
  value: string;
  href?: string;
  note?: string;
  sourceIds: string[];
}

export interface AnswerEscalation {
  reason: 'missing' | 'human' | 'disruption';
  text: string;
  contacts: AnswerContact[];
  /** Mention the passenger's airline as a channel (it has no published number here). */
  airline: boolean;
  officialUrl?: string;
}

export interface ConciergeAnswer {
  lang: Lang;
  question: string;
  intent: ConciergeIntent;
  /** Short answer: one or two sentences. */
  text: string;
  statements: AnswerStatement[];
  cards: AnswerCard[];
  actions: AnswerAction[];
  /** Things we do not know, said plainly. */
  limits: string[];
  /** A prompt for a better answer: "Tell me your flight number…". */
  hint?: string;
  clarify?: { prompt: string; options: { label: string; context: ConciergeContext }[] };
  escalation?: AnswerEscalation;
  sources: Source[];
  /** True when any part comes from the demo flight provider. */
  demo: boolean;
  /** ISO instant of the demo data shown, when `demo`. */
  demoGeneratedAt?: string;
  /** True when Malay was asked for and some content is only in English. */
  translationFallback: boolean;
  /** Context to send with the next question. */
  context: ConciergeContext;
}

/** How the answer was produced. `local` is the in-browser fallback. */
export type ConciergeMode = 'grounded' | 'grounded-rephrased' | 'local';

/** Body of a successful `/api/concierge` response. */
export interface ConciergeResponse {
  mode: Exclude<ConciergeMode, 'local'>;
  answer: ConciergeAnswer;
}
