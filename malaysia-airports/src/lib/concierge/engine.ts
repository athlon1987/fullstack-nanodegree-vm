/**
 * The concierge answer engine: deterministic, grounded, bilingual.
 *
 * `answerQuestion(input, deps)` understands the question (intent and slots), looks up the
 * structured content first (airline check-in facts, facilities by category, transport by
 * destination, car parks, outlets), then the citable passages (FAQs, guide steps, airport notes),
 * then the site search engine. Every statement it returns carries a provenance tag and the ids
 * of its sources; flights come only from the injected demo flight source and are tagged `demo`.
 * When the content does not have the answer it says so and adds an escalation block with the
 * official contacts. It never writes a fact of its own: the templates in
 * `src/lib/i18n/features/concierge.ts` (`engine`) only frame values taken from the content.
 *
 * Pure: no clock, no randomness, no network. The same function runs in `/api/concierge` and,
 * as the offline fallback, in the browser.
 */
import type { CarPark, Contact, Facility, Hours, Lang, Notice, Outlet, Provenance, TerminalId, TransportOption } from '@/content/types';
import { formatCurrency } from '@/lib/format';
import { formatFlightNumber } from '@/lib/flights/query';
import { flightStatusLabel } from '@/lib/flights/status';
import type { Flight } from '@/lib/flights/types';
import { calculateParking } from '@/lib/parking';
import { formatTime } from '@/lib/time';
import { ANSWER_LIMITS, CONCIERGE_MAX_QUESTION } from './constants';
import { hrefFor, retrievePassages, searchKnowledge, type PassageQuery } from './retrieve';
import { fellBack, list, minutesLabel, normalise, phrase, pickText, tokens, type EnginePhrase } from './text';
import { understand } from './understand';
import type {
  AnswerAction,
  AnswerCard,
  AnswerContact,
  AnswerEscalation,
  AnswerStatement,
  ConciergeAnswer,
  ConciergeContext,
  ConciergeDeps,
  ConciergeInput,
  ConciergeIntent,
  ConciergeKnowledge,
  KnowledgeAirport,
  KnowledgePassage,
  Understanding,
} from './types';

/* -------------------------------------------------------------------------------------------
 * The answer builder
 * ---------------------------------------------------------------------------------------- */

class Builder {
  text = '';
  statements: AnswerStatement[] = [];
  cards: AnswerCard[] = [];
  actions: AnswerAction[] = [];
  limits: string[] = [];
  hint?: string;
  clarify?: ConciergeAnswer['clarify'];
  escalation?: AnswerEscalation;
  demo = false;
  fallback = false;
  private seen = new Set<string>();
  private said: Set<string>[] = [];

  constructor(
    readonly k: ConciergeKnowledge,
    readonly lang: Lang,
  ) {}

  /** Bilingual content in the asked language; remembers when Malay fell back to English. */
  pick(text: Parameters<typeof pickText>[0]): string {
    if (fellBack(text, this.lang)) this.fallback = true;
    return pickText(text, this.lang);
  }

  say(key: EnginePhrase, vars?: Record<string, string | number>): string {
    return phrase(this.lang, key, vars);
  }

  once(key: string): boolean {
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }

  statement(statement: AnswerStatement, key?: string): void {
    if (this.statements.length >= ANSWER_LIMITS.statements) return;
    if (!statement.text.trim()) return;
    if (key && this.seen.has(`s:${key}`)) return;
    // Near-duplicates: the same fact often appears in an FAQ, a guide step and an airport note.
    const words = new Set(tokens(statement.text));
    const overlaps = this.said.some((other) => {
      let shared = 0;
      for (const word of words) if (other.has(word)) shared += 1;
      return shared / Math.max(1, Math.min(words.size, other.size)) >= 0.6;
    });
    if (overlaps) return;
    if (key) this.seen.add(`s:${key}`);
    this.said.push(words);
    this.statements.push(statement);
  }

  passage(passage: KnowledgePassage): void {
    this.statement(
      {
        title: this.pick(passage.title),
        text: this.pick(passage.body),
        provenance: passage.provenance,
        sourceIds: passage.sourceIds,
        href: passage.href,
      },
      passage.id,
    );
  }

  card(card: AnswerCard): void {
    if (this.cards.length >= ANSWER_LIMITS.cards) return;
    if (!this.once(`c:${card.type}:${card.id}`)) return;
    if (card.type === 'flight') this.demo = true;
    this.cards.push(card);
  }

  link(label: string, href: string | undefined, icon?: string): void {
    if (!href || this.actions.length >= ANSWER_LIMITS.actions) return;
    if (!this.once(`a:${href}`)) return;
    this.actions.push({ kind: 'link', label, href, icon });
  }

  ask(label: string, question: string, context?: ConciergeContext): void {
    if (this.actions.length >= ANSWER_LIMITS.actions) return;
    if (!this.once(`q:${question}`)) return;
    this.actions.push({ kind: 'ask', label, question, context });
  }

  limit(text: string): void {
    if (this.once(`l:${text}`)) this.limits.push(text);
  }

  get grounded(): boolean {
    return this.statements.some((item) => item.sourceIds.length > 0) || this.cards.some((card) => card.type !== 'flight' && card.sourceIds.length > 0);
  }
}

/* -------------------------------------------------------------------------------------------
 * Helpers over the knowledge
 * ---------------------------------------------------------------------------------------- */

interface Scope {
  b: Builder;
  k: ConciergeKnowledge;
  lang: Lang;
  now: number;
  question: string;
  u: Understanding;
  airport?: KnowledgeAirport;
  terminal?: TerminalId;
  flight: Flight | null;
  /** A flight number was asked about but not found. */
  missingFlight?: string;
  context: ConciergeContext;
}

const getAirport = (k: ConciergeKnowledge, slug: string | undefined): KnowledgeAirport | undefined =>
  slug ? k.airports.find((airport) => airport.slug === slug) : undefined;

function terminalName(s: Scope, terminal: TerminalId | undefined, short = false): string | undefined {
  const found = s.airport?.terminals.find((item) => item.id === terminal);
  if (!found || !s.airport || s.airport.terminals.length < 2) return undefined;
  return s.b.pick(short ? found.shortName : found.name);
}

/** "KLIA Terminal 1" when a terminal is in scope, otherwise the airport's everyday name. */
function placeName(s: Scope): string {
  return terminalName(s, s.terminal) ?? s.airport?.shortName ?? '';
}

function hasSection(s: Scope, section: string): boolean {
  return s.airport?.sections.includes(section) ?? false;
}

function sectionHref(s: Scope, section: string): string | undefined {
  if (!s.airport || !hasSection(s, section)) return undefined;
  return `/${s.airport.slug}/${section}${s.terminal && s.airport.terminals.length > 1 ? `?t=${s.terminal}` : ''}`;
}

function formatHours(b: Builder, hours: Hours | undefined): string | undefined {
  if (!hours) return undefined;
  if (hours.kind === '24h') return b.say('hours24');
  if (hours.kind === 'daily') return b.say('hoursDaily', { open: hours.open, close: hours.close });
  return b.pick(hours.text);
}

function noticeState(notice: Notice, now: number): 'upcoming' | 'active' | 'expired' {
  if (notice.validFrom && now < Date.parse(notice.validFrom)) return 'upcoming';
  if (notice.validTo && now > Date.parse(notice.validTo)) return 'expired';
  return 'active';
}

function addNotice(s: Scope, notice: Notice): void {
  const state = noticeState(notice, s.now);
  const label = s.b.say(state === 'upcoming' ? 'noticeUpcoming' : state === 'active' ? 'noticeActive' : 'noticeEnded');
  s.b.statement(
    { title: `${label}: ${s.b.pick(notice.title)}`, text: s.b.pick(notice.body), provenance: notice.provenance, sourceIds: notice.sources, href: hrefFor(s.k, 'notice', notice.id) },
    `notice:${notice.id}`,
  );
}

/** Notices for the airport (and network-wide) that are not over, most serious first. */
function liveNotices(s: Scope, filter: (notice: Notice) => boolean = () => true): Notice[] {
  const rank = { critical: 0, warning: 1, advisory: 2, info: 3 } as const;
  return s.k.notices
    .filter((notice) => !notice.airport || notice.airport === s.airport?.slug)
    .filter((notice) => noticeState(notice, s.now) !== 'expired')
    .filter(filter)
    .sort((a, b) => rank[a.severity] - rank[b.severity]);
}

const GENERIC_WORDS = new Set(tokens('train trains bus buses coach coaches shuttle free between terminal terminals the to and klia express ekspres car park long term building main satellite non stop service'));

/** True when the question names this option by a distinctive word ("Aerotrain"). */
function namedIn(question: string, name: string): boolean {
  const asked = new Set(tokens(question));
  return tokens(name.split('(')[0]).some((word) => !GENERIC_WORDS.has(word) && asked.has(word));
}

/** "KLIA Ekspres (non-stop train to KL Sentral)" is mentioned as "KLIA Ekspres". */
function shortName(name: string): string {
  return name.split('(')[0].trim();
}

const GENERIC_STARTS = new Set(['train', 'trains', 'free', 'bus', 'buses', 'shuttle', 'coupon', 'taxi', 'taxis', 'airport', 'car', 'e-hailing']);

/** "Free shuttle bus …" reads "free shuttle bus …" mid-sentence; names such as "KLIA Ekspres" keep their capitals. */
function midSentence(name: string, lang: Lang): string {
  const first = name.split(' ')[0].toLowerCase();
  return lang === 'en' && GENERIC_STARTS.has(first) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

/** "Toilets" becomes "toilets" mid-sentence; "Wi-Fi" and "ATM" keep their capitals. */
function sentenceCase(label: string): string {
  return /[A-Z]/.test(label.slice(1)) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

function mentions(text: string, name: string): boolean {
  const needle = normalise(name);
  return needle.length > 2 && ` ${normalise(text)} `.includes(` ${needle} `);
}

function passages(s: Scope, query: Omit<PassageQuery, 'airport'> & { airport?: string }): void {
  for (const { passage } of retrievePassages(s.k, { airport: s.airport?.slug, terminal: s.terminal, ...query })) s.b.passage(passage);
}

function toContact(b: Builder, contact: Contact): AnswerContact {
  return {
    kind: contact.kind,
    label: b.pick(contact.label),
    value: contact.value,
    href: contact.href,
    note: contact.note ? b.pick(contact.note) : undefined,
    sourceIds: contact.sources,
  };
}

function escalate(s: Scope, reason: AnswerEscalation['reason'], airline = false): void {
  if (s.b.escalation) return;
  const contacts = s.airport && s.airport.contacts.length > 0 ? s.airport.contacts : s.k.groupContacts;
  const key: EnginePhrase = reason === 'missing' ? 'escalateMissing' : reason === 'human' ? 'escalateHuman' : 'escalateDisruption';
  s.b.escalation = {
    reason,
    text: s.b.say(key),
    contacts: contacts.map((contact) => toContact(s.b, contact)),
    airline,
    officialUrl: s.k.officialSiteUrl,
  };
}

function needAirport(s: Scope): boolean {
  if (s.airport) return false;
  s.b.text = s.b.say('clarifyAirport');
  s.b.clarify = {
    prompt: s.b.say('clarifyAirport'),
    options: s.k.featured.map((item) => ({ label: item.label, context: { ...s.context, airport: item.airport, terminal: item.terminal, intent: s.u.intent } })),
  };
  return true;
}

/* ---- cards ------------------------------------------------------------------------------- */

function flightCard(s: Scope, flight: Flight): void {
  const airport = getAirport(s.k, flight.airport);
  const terminal = airport?.terminals.find((item) => item.id === flight.terminal);
  const terminalLabel = airport && airport.terminals.length > 1 && terminal ? s.b.pick(terminal.name) : (airport?.shortName ?? flight.airport.toUpperCase());
  const place = flight.direction === 'd' ? flight.destination.city : flight.origin.city;
  s.b.card({
    type: 'flight',
    id: flight.id,
    number: formatFlightNumber(flight),
    airline: flight.airline.name,
    direction: flight.direction,
    place,
    airport: flight.airport,
    terminal: flight.terminal,
    terminalLabel,
    scheduled: flight.scheduled,
    estimated: flight.estimated,
    status: flight.status,
    delayMinutes: flight.delayMinutes,
    gate: flight.gate,
    belt: flight.belt,
    href: `/${flight.airport}/flights/${flight.id}`,
    provenance: 'demo',
  });
  const delayed = flight.estimated !== flight.scheduled;
  s.b.statement(
    {
      text: s.b.say(delayed ? 'flightDemoDelayed' : 'flightDemo', {
        flight: formatFlightNumber(flight),
        route: s.b.say(flight.direction === 'd' ? 'routeTo' : 'routeFrom', { place }),
        status: flightStatusLabel(flight.status, s.lang).toLowerCase(),
        time: formatTime(delayed ? flight.estimated : flight.scheduled),
        terminal: terminalLabel,
      }),
      provenance: 'demo',
      sourceIds: [],
      href: `/${flight.airport}/flights/${flight.id}`,
    },
    `flight:${flight.id}`,
  );
}

function facilityCard(s: Scope, facility: Facility): void {
  const airport = getAirport(s.k, facility.airport);
  const terminal = airport?.terminals.find((item) => item.id === facility.terminal);
  const place = airport && airport.terminals.length > 1 && terminal ? s.b.pick(terminal.name) : (airport?.shortName ?? '');
  const hasMap = airport?.sections.includes('map') && facility.mapPoint;
  s.b.card({
    type: 'facility',
    id: facility.id,
    name: s.b.pick(facility.name),
    category: facility.category,
    categoryLabel: s.b.pick(s.k.labels.categories[facility.category]),
    place,
    zone: facility.zone,
    description: s.b.pick(facility.description),
    location: facility.locationNote ? s.b.pick(facility.locationNote) : undefined,
    hours: formatHours(s.b, facility.hours),
    provenance: facility.provenance,
    sourceIds: facility.sources,
    href: hrefFor(s.k, 'facility', facility.id),
    mapHref: hasMap ? `/${facility.airport}/map?poi=${facility.mapPoint}` : undefined,
  });
}

function facilityStatement(s: Scope, facility: Facility): void {
  s.b.statement(
    { title: s.b.pick(facility.name), text: s.b.pick(facility.description), provenance: facility.provenance, sourceIds: facility.sources, href: hrefFor(s.k, 'facility', facility.id) },
    `facility:${facility.id}`,
  );
}

function outletCard(s: Scope, outlet: Outlet): void {
  const airport = getAirport(s.k, outlet.airport);
  const terminal = airport?.terminals.find((item) => item.id === outlet.terminal);
  s.b.card({
    type: 'outlet',
    id: outlet.id,
    name: outlet.name,
    category: outlet.cuisine ?? outlet.category,
    place: airport && airport.terminals.length > 1 && terminal ? s.b.pick(terminal.name) : (airport?.shortName ?? ''),
    zone: outlet.zone,
    description: outlet.description ? s.b.pick(outlet.description) : undefined,
    location: outlet.locationNote ? s.b.pick(outlet.locationNote) : undefined,
    hours: formatHours(s.b, outlet.hours),
    halal: outlet.halal,
    provenance: 'official',
    sourceIds: outlet.sources,
    href: hrefFor(s.k, 'outlet', outlet.id),
  });
}

function fareText(s: Scope, fare: NonNullable<TransportOption['destinations'][number]['fare']>): string {
  return formatCurrency(fare.amount, s.lang);
}

function transportCard(s: Scope, option: TransportOption, rows: TransportOption['destinations'], highlight?: 'lowest-fare' | 'quickest'): void {
  s.b.card({
    type: 'transport',
    id: option.id,
    name: s.b.pick(option.name),
    mode: option.mode,
    modeLabel: s.b.pick(s.k.labels.modes[option.mode]),
    operator: option.operator,
    rows: rows.map((row) => ({
      name: s.b.pick(row.name),
      fare: row.fare ? fareText(s, row.fare) : undefined,
      duration: row.durationMinutes ? minutesLabel(row.durationMinutes, s.lang) : undefined,
      note: row.note ? s.b.pick(row.note) : undefined,
    })),
    frequency: option.frequency ? s.b.pick(option.frequency) : undefined,
    highlight,
    provenance: option.provenance,
    sourceIds: option.sources,
    href: hrefFor(s.k, 'transport', option.id),
  });
}

function carParkCard(s: Scope, carPark: CarPark, estimate?: string): void {
  const officialUrl = carPark.bookingUrl ?? s.k.sources.find((source) => carPark.sources.includes(source.id) && source.url.startsWith('https:'))?.url;
  const airport = getAirport(s.k, carPark.airport);
  const terminal = airport?.terminals.find((item) => item.id === carPark.terminal);
  s.b.card({
    type: 'car-park',
    id: carPark.id,
    name: s.b.pick(carPark.name),
    place: airport && airport.terminals.length > 1 && terminal ? s.b.pick(terminal.name) : (airport?.shortName ?? ''),
    ratesPublished: carPark.rateStatus === 'published' && carPark.rates.length > 0,
    estimate,
    officialUrl,
    provenance: carPark.provenance,
    sourceIds: carPark.sources,
    href: hrefFor(s.k, 'parking', carPark.id),
  });
}

/* -------------------------------------------------------------------------------------------
 * Intent handlers
 * ---------------------------------------------------------------------------------------- */

type Handler = (s: Scope) => void;

const CHECK_IN_WORDS = ['check in', 'counter', 'counters', 'bag drop', 'daftar masuk', 'kaunter'];

const checkIn: Handler = (s) => {
  if (needAirport(s)) return;
  const airport = s.airport as KnowledgeAirport;
  const code = s.flight?.airline.code ?? s.u.slots.airline;
  if (s.flight) flightCard(s, s.flight);
  if (code) {
    const fact = s.k.airlines.find((airline) => airline.airport === airport.slug && airline.code === code);
    const name = fact?.name ?? s.flight?.airline.name ?? code;
    const provenance: Provenance = fact?.basis === 'third-party' ? 'estimated' : 'official';
    if (fact?.terminal && airport.terminals.length > 1) {
      s.b.statement({ text: s.b.say('checkInAirlineTerminal', { airline: name, terminal: terminalName(s, fact.terminal) ?? '' }), provenance, sourceIds: fact.sources }, `airline-terminal:${fact.code}`);
    }
    if (fact?.checkIn) {
      if (s.lang === 'ms') s.b.fallback = true;
      s.b.text = s.b.say('checkInAirline', { airline: name, airport: airport.shortName });
      s.b.statement({ title: name, text: fact.checkIn, provenance, sourceIds: fact.sources }, `airline-checkin:${fact.code}`);
    } else {
      s.b.text = s.b.say('checkInAirlineMissing', { airline: name, airport: airport.shortName });
      escalate(s, 'missing', true);
    }
    passages(s, { text: `${s.question} check in`, airline: code, topics: ['check-in'], require: CHECK_IN_WORDS, limit: 2, minScore: 4 });
  } else {
    s.b.text = s.b.say('checkInGeneral', { airport: placeName(s) });
    passages(s, { text: `${s.question} check in counter`, topics: ['check-in'], require: CHECK_IN_WORDS, limit: 3, minScore: 4 });
    s.b.hint = s.b.say('checkInAskFlight');
  }
  s.b.link(s.b.say('actionDeparturesBoard'), sectionHref(s, 'flights'), 'plane-takeoff');
  if (s.k.guides.includes('check-in')) s.b.link(s.b.say('actionCheckinAndBagDrop'), '/guides/check-in', 'ticket-check');
};

const terminalTransfer: Handler = (s) => {
  if (needAirport(s)) return;
  const airport = s.airport as KnowledgeAirport;
  if (airport.terminals.length < 2) {
    s.b.text = s.b.say('transferNone', { airport: airport.shortName });
    escalate(s, 'missing');
    return;
  }
  const names = airport.terminals.map((terminal) => normalise(terminal.shortName.en));
  const options = s.k.transport.filter(
    (option) => option.airport === airport.slug && option.mode === 'inter-terminal' && option.destinations.some((row) => names.every((name) => normalise(row.name.en).includes(name))),
  );
  if (options.length === 0) {
    s.b.text = s.b.say('transferNone', { airport: airport.shortName });
    escalate(s, 'missing');
  } else {
    s.b.text = s.b.say('transfer', {
      terminals: list(airport.terminals.map((terminal) => s.b.pick(terminal.shortName)), s.lang),
      airport: airport.shortName,
      options: list(options.map((option) => midSentence(s.b.pick(option.name), s.lang)), s.lang),
    });
  }
  const later = normalise(airport.terminals[airport.terminals.length - 1].shortName.en);
  passages(s, { text: `${s.question} change terminals`, terminal: undefined, topics: ['parking-transport', 'transit', 'terminals'], require: [later], limit: 2, minScore: 4 });
  for (const option of options) {
    transportCard(s, option, option.destinations);
    if (option.description) s.b.statement({ title: s.b.pick(option.name), text: s.b.pick(option.description), provenance: option.provenance, sourceIds: option.sources, href: hrefFor(s.k, 'transport', option.id) }, `transport:${option.id}`);
  }
  for (const notice of liveNotices(s, (notice) => options.some((option) => mentions(`${notice.title.en} ${notice.body.en}`, shortName(option.name.en))))) addNotice(s, notice);
  s.b.link(s.b.say('actionConnectionsAndTransit'), sectionHref({ ...s, terminal: undefined }, 'transit'), 'route');
  s.b.link(s.b.say('actionTransportPlanner'), sectionHref({ ...s, terminal: undefined }, 'transport'), 'train-front');
};

const transport: Handler = (s) => {
  if (needAirport(s)) return;
  const airport = s.airport as KnowledgeAirport;
  const all = s.k.transport.filter((option) => option.airport === airport.slug && option.mode !== 'inter-terminal');
  if (all.length === 0) {
    s.b.text = s.b.say('transportNone', { airport: airport.shortName });
    escalate(s, 'missing');
    return;
  }
  const wanted = s.u.slots.destination;
  const matches = wanted
    ? all
        .map((option) => ({ option, rows: option.destinations.filter((row) => normalise(row.name.en).includes(wanted) || normalise(row.name.ms ?? '').includes(wanted)) }))
        .filter((match) => match.rows.length > 0)
    : [];

  if (wanted && matches.length > 0) {
    const destination = s.b.pick(matches[0].rows[0].name).split('(')[0].trim();
    const priced = matches.flatMap((match) => match.rows.filter((row) => row.fare).map((row) => ({ ...match, row })));
    const timed = matches.flatMap((match) => match.rows.filter((row) => row.durationMinutes).map((row) => ({ ...match, row })));
    const cheapest = [...priced].sort((a, b) => (a.row.fare?.amount ?? 0) - (b.row.fare?.amount ?? 0))[0];
    const quickest = [...timed].sort((a, b) => (a.row.durationMinutes ?? 0) - (b.row.durationMinutes ?? 0))[0];
    const priority = s.u.slots.priority;
    if (priority === 'time' && quickest) {
      s.b.text = s.b.say('transportFastest', { destination, option: shortName(s.b.pick(quickest.option.name)), duration: minutesLabel(quickest.row.durationMinutes ?? 0, s.lang) });
    } else if (priority === 'price' && cheapest) {
      s.b.text = s.b.say('transportCheapest', { destination, option: shortName(s.b.pick(cheapest.option.name)), fare: cheapest.row.fare ? fareText(s, cheapest.row.fare) : '' });
    } else {
      s.b.text = s.b.say('transportList', { destination, airport: airport.shortName, options: list(matches.map((match) => midSentence(shortName(s.b.pick(match.option.name)), s.lang)), s.lang) });
    }
    const ordered = [...matches].sort((a, b) => {
      const fa = Math.min(...a.rows.map((row) => row.fare?.amount ?? Number.POSITIVE_INFINITY));
      const fb = Math.min(...b.rows.map((row) => row.fare?.amount ?? Number.POSITIVE_INFINITY));
      return priority === 'time'
        ? Math.min(...a.rows.map((row) => row.durationMinutes ?? Infinity)) - Math.min(...b.rows.map((row) => row.durationMinutes ?? Infinity))
        : fa - fb;
    });
    for (const match of ordered) {
      for (const row of match.rows) {
        if (row.fare) {
          s.b.statement(
            { text: s.b.say('destinationFare', { option: shortName(s.b.pick(match.option.name)), destination: s.b.pick(row.name), fare: fareText(s, row.fare) }), provenance: match.option.provenance, sourceIds: match.option.sources, href: hrefFor(s.k, 'transport', match.option.id) },
            `fare:${match.option.id}:${row.name.en}`,
          );
        } else if (row.durationMinutes && priority === 'time') {
          s.b.statement(
            { text: s.b.say('destinationDuration', { option: shortName(s.b.pick(match.option.name)), destination: s.b.pick(row.name), duration: minutesLabel(row.durationMinutes, s.lang) }), provenance: match.option.provenance, sourceIds: match.option.sources },
            `time:${match.option.id}:${row.name.en}`,
          );
        }
      }
      const highlight = cheapest?.option.id === match.option.id && priority === 'price' ? 'lowest-fare' : quickest?.option.id === match.option.id && priority === 'time' ? 'quickest' : undefined;
      transportCard(s, match.option, match.rows, highlight);
    }
    for (const notice of liveNotices(s, (notice) => matches.some((match) => mentions(`${notice.title.en} ${notice.body.en}`, shortName(match.option.name.en))))) addNotice(s, notice);
    const unpriced = matches.filter((match) => match.rows.every((row) => !row.fare));
    if (priority === 'price' && unpriced.length > 0) {
      s.b.statement({ text: s.b.say('transportFareGap', { options: list(unpriced.map((match) => midSentence(s.b.pick(match.option.name), s.lang)), s.lang) }), provenance: 'suggestion', sourceIds: [] });
    }
    if (priority === 'price' && !cheapest) s.b.limit(s.b.say('transportNoFare', { destination }));
    for (const match of ordered.slice(0, 2)) {
      if (match.option.description) s.b.statement({ title: s.b.pick(match.option.name), text: s.b.pick(match.option.description), provenance: match.option.provenance, sourceIds: match.option.sources }, `transport:${match.option.id}`);
    }
  } else {
    if (wanted) s.b.limit(s.b.say('transportNoDestination', { destination: wanted, airport: airport.shortName }));
    s.b.text = s.b.say('transportGeneral', { airport: airport.shortName, options: list(all.map((option) => midSentence(shortName(s.b.pick(option.name)), s.lang)), s.lang) });
    for (const option of all.slice(0, ANSWER_LIMITS.cards)) transportCard(s, option, option.destinations);
    passages(s, { text: `${s.question} transport`, topics: ['parking-transport', 'onward-transport', 'getting-there'], limit: 2, minScore: 4 });
  }
  s.b.link(s.b.say('actionCompareAllTransport'), sectionHref({ ...s, terminal: undefined }, 'transport'), 'train-front');
};

const dining: Handler = (s) => {
  if (needAirport(s)) return;
  const airport = s.airport as KnowledgeAirport;
  const outlets = s.k.outlets.filter((outlet) => outlet.airport === airport.slug && outlet.kind === 'dine' && (!s.terminal || outlet.terminal === s.terminal));
  const zoneRank = { airside: 0, both: 1, unknown: 2, landside: 3 } as const;
  outlets.sort((a, b) => zoneRank[a.zone] - zoneRank[b.zone] || a.name.localeCompare(b.name));
  if (outlets.length > 0) {
    s.b.text = s.b.say('dining', { place: placeName(s), outlets: list(outlets.slice(0, 6).map((outlet) => outlet.name), s.lang) });
    for (const outlet of outlets) outletCard(s, outlet);
  } else {
    s.b.text = s.b.say('diningNone', { place: placeName(s) });
    escalate(s, 'missing');
  }
  const text = normalise(s.question);
  if (/\b(gate|gates|pintu|near|nearest|berhampiran|terdekat)\b/.test(text)) s.b.limit(s.b.say('diningNearGate'));
  const gate = s.u.slots.gate;
  if (gate) passages(s, { text: `gate ${gate}`, gatePrefix: gate[0], topics: ['gate'], limit: 1, minScore: 3 });
  s.b.link(s.b.say('actionShopAndDine'), sectionHref(s, 'shop-dine'), 'utensils');
};

const facility: Handler = (s) => {
  if (needAirport(s)) return;
  const category = s.u.slots.category;
  if (!category) return fallback(s);
  const airport = s.airport as KnowledgeAirport;
  const label = s.b.pick(s.k.labels.categories[category]);
  const all = s.k.facilities.filter((item) => item.airport === airport.slug && item.category === category);
  const inTerminal = s.terminal ? all.filter((item) => item.terminal === s.terminal) : all;
  const chosen = inTerminal.length > 0 ? inTerminal : all;
  if (chosen.length > 0) {
    if (s.terminal && inTerminal.length === 0) s.b.limit(s.b.say('facilityOtherTerminal', { terminal: terminalName(s, s.terminal) ?? '' }));
    s.b.text = s.b.say('facility', { category: label, place: inTerminal.length > 0 ? placeName(s) : airport.shortName, names: list(chosen.slice(0, 5).map((item) => s.b.pick(item.name)), s.lang) });
    if (s.u.slots.nearest) s.b.limit(s.b.say('facilityNearest'));
    for (const item of chosen) facilityCard(s, item);
    const mapped = chosen.find((item) => item.mapPoint && airport.sections.includes('map'));
    if (mapped) s.b.link(s.b.say('actionShowOnTheTerminal'), `/${airport.slug}/map?poi=${mapped.mapPoint}`, 'map');
  } else {
    s.b.text = s.b.say('facilityNone', { category: s.lang === 'en' ? sentenceCase(label) : label, place: placeName(s) });
    escalate(s, 'missing');
    passages(s, { text: `${s.k.labels.categories[category].en} not verified`, includeGaps: true, require: tokens(s.k.labels.categories[category].en).slice(0, 1), limit: 1, minScore: 1 });
    const info = s.k.facilities.find((item) => item.airport === airport.slug && item.category === 'information');
    if (info) facilityCard(s, info);
  }
  passages(s, { text: `${s.question} ${s.k.labels.categories[category].en}`, limit: 2, minScore: 5 });
  const page = category === 'lounge' || category === 'hotel' ? 'lounges' : 'facilities';
  s.b.link(s.b.say(page === 'lounges' ? 'actionLoungesAndRest' : 'actionAllFacilities'), sectionHref(s, page), 'layers');
};

const layover: Handler = (s) => {
  if (needAirport(s)) return;
  const airport = s.airport as KnowledgeAirport;
  const duration = s.u.slots.durationMinutes;
  const long = duration === undefined || duration >= 240;
  const order = long
    ? (['rest', 'hotel', 'lounge', 'calm-room', 'other', 'shower', 'viewing'] as const)
    : (['lounge', 'other', 'calm-room', 'viewing', 'rest', 'hotel', 'shower'] as const);
  const here = s.k.facilities.filter((item) => item.airport === airport.slug && (!s.terminal || item.terminal === s.terminal));
  const picked = order.flatMap((category) => here.filter((item) => item.category === category));
  s.b.text = duration
    ? s.b.say('layover', { duration: minutesLabel(duration, s.lang), airport: placeName(s) })
    : s.b.say('layoverNoDuration', { airport: placeName(s) });
  passages(s, { text: `${s.question} transit layover`, topics: ['transit'], limit: 2, minScore: 4 });
  for (const item of picked.slice(0, ANSWER_LIMITS.cards)) facilityCard(s, item);
  const food = s.k.outlets.filter((outlet) => outlet.airport === airport.slug && outlet.kind === 'dine' && (!s.terminal || outlet.terminal === s.terminal));
  for (const outlet of food.slice(0, 1)) outletCard(s, outlet);
  if (picked.length === 0 && food.length === 0) {
    s.b.text = s.b.say('noAnswerAt', { airport: placeName(s) });
    escalate(s, 'missing');
  } else {
    s.b.statement({ text: s.b.say('layoverReturn'), provenance: 'suggestion', sourceIds: [] });
  }
  if (s.u.slots.leave) s.b.limit(s.b.say('layoverLeave'));
  s.b.link(s.b.say('actionLoungesAndRest'), sectionHref(s, 'lounges'), 'sofa');
  s.b.link(s.b.say('actionConnectionsAndTransit'), sectionHref({ ...s, terminal: undefined }, 'transit'), 'route');
  s.b.link(s.b.say('actionShopAndDine'), sectionHref(s, 'shop-dine'), 'utensils');
};

const parking: Handler = (s) => {
  if (needAirport(s)) return;
  const airport = s.airport as KnowledgeAirport;
  const all = s.k.carParks.filter((item) => item.airport === airport.slug);
  const inTerminal = s.terminal ? all.filter((item) => !item.terminal || item.terminal === s.terminal) : all;
  const parks = inTerminal.length > 0 ? inTerminal : all;
  if (parks.length === 0) {
    s.b.text = s.b.say('parkingNone', { airport: airport.shortName });
    escalate(s, 'missing');
    return;
  }
  s.b.text = s.b.say('parking', { place: placeName(s) });
  const duration = s.u.slots.durationMinutes;
  const published = parks.filter((item) => item.rateStatus === 'published' && item.rates.length > 0);
  const missing = parks.filter((item) => !published.includes(item));
  for (const park of published) {
    const result = duration ? calculateParking(park, duration) : undefined;
    if (result && !result.unavailable) {
      const total = formatCurrency(result.total, s.lang, { alwaysShowSen: !Number.isInteger(result.total) });
      s.b.statement({ text: s.b.say('parkingEstimate', { total, duration: minutesLabel(duration ?? 0, s.lang), carPark: s.b.pick(park.name) }), provenance: 'estimated', sourceIds: park.sources }, `estimate:${park.id}`);
      carParkCard(s, park, total);
    } else {
      s.b.statement({ text: s.b.say('parkingRates', { carPark: s.b.pick(park.name) }), provenance: park.provenance, sourceIds: park.sources }, `rates:${park.id}`);
      carParkCard(s, park);
    }
    if (park.description) s.b.statement({ title: s.b.pick(park.name), text: s.b.pick(park.description), provenance: park.provenance, sourceIds: park.sources }, `park:${park.id}`);
  }
  if (missing.length > 0) {
    s.b.limit(s.b.say('parkingMissing', { carParks: list(missing.map((item) => s.b.pick(item.name)), s.lang) }));
    for (const park of missing) carParkCard(s, park);
    if (published.length === 0) escalate(s, 'missing');
  }
  passages(s, { text: `${s.question} car park`, topics: ['parking-transport', 'getting-there'], limit: 2, minScore: 4 });
  s.b.link(s.b.say('actionParkingAndCalculator'), sectionHref({ ...s, terminal: undefined }, 'parking'), 'square-parking');
};

const lostProperty: Handler = (s) => {
  const baggage = s.u.slots.baggage;
  s.b.text = s.airport ? s.b.say('lost', { airport: s.airport.shortName }) : s.b.say('lostGeneral');
  passages(s, { text: `${s.question} lost${baggage ? ' baggage bag' : ''}`, terminal: undefined, topics: baggage ? ['lost-property', 'baggage'] : ['lost-property'], limit: 3, minScore: 4 });
  if (s.airport) {
    for (const item of s.k.facilities.filter((entry) => entry.airport === s.airport?.slug && entry.category === 'lost-property')) facilityCard(s, item);
  }
  escalate(s, 'human', baggage);
  if (s.k.helpTopics.includes('lost-property')) s.b.link(s.b.say('actionLostPropertyHelp'), '/help/lost-property', 'package-search');
};

const assistance: Handler = (s) => {
  s.b.text = s.airport ? s.b.say('assistance', { airport: s.airport.shortName }) : s.b.say('assistanceGeneral');
  passages(s, { text: s.question, terminal: undefined, topics: ['accessibility', 'assistance', 'reduced-mobility', 'neurodivergent', 'older-travellers'], limit: 6, minScore: 4 });
  if (s.airport) {
    const related = s.k.facilities.filter((item) => item.airport === s.airport?.slug && (item.category === 'assistance' || item.category === 'calm-room'));
    for (const item of related.slice(0, 2)) facilityCard(s, item);
  }
  escalate(s, 'human', true);
  s.b.link(s.b.say('actionAssistanceAndAccessibility'), '/accessibility', 'accessibility');
  if (s.k.guides.includes('reduced-mobility')) s.b.link(s.b.say('actionReducedMobilityGuide'), '/guides/reduced-mobility', 'person-standing');
};

const flightDelay: Handler = (s) => {
  if (s.flight) {
    flightCard(s, s.flight);
    s.b.text = s.b.say('delayFlight', { flight: formatFlightNumber(s.flight), status: flightStatusLabel(s.flight.status, s.lang).toLowerCase() });
    s.b.link(s.b.say('actionFlightDetails'), `/${s.flight.airport}/flights/${s.flight.id}`, 'plane');
  } else {
    s.b.text = s.b.say('delayGeneral');
    if (s.missingFlight) s.b.limit(s.b.say('flightNotFound', { flight: s.missingFlight }));
    else s.b.hint = s.b.say('flightAsk');
  }
  passages(s, { text: `${s.question} delay delayed airline`, terminal: undefined, topics: ['flights'], limit: 3, minScore: 4 });
  for (const notice of liveNotices(s, (notice) => notice.severity === 'warning' || notice.severity === 'critical').slice(0, 1)) addNotice(s, notice);
  escalate(s, 'disruption', true);
  if (s.k.helpTopics.includes('flights')) s.b.link(s.b.say('actionFlightsAndDisruptionHelp'), '/help/flights', 'circle-help');
  s.b.link(s.b.say('actionMyJourney'), '/journey', 'bookmark');
};

const flightStatus: Handler = (s) => {
  if (s.flight) {
    flightCard(s, s.flight);
    s.b.text = s.b.say('statusText', { flight: formatFlightNumber(s.flight), status: flightStatusLabel(s.flight.status, s.lang).toLowerCase() });
    s.b.link(s.b.say('actionFlightDetails'), `/${s.flight.airport}/flights/${s.flight.id}`, 'plane');
  } else {
    s.b.text = s.missingFlight ? s.b.say('flightNotFound', { flight: s.missingFlight }) : s.b.say('flightAsk');
    escalate(s, 'missing', true);
  }
  passages(s, { text: `${s.question} real status flight`, terminal: undefined, topics: ['flights'], limit: 1, minScore: 4 });
  s.b.link(s.b.say('actionDeparturesBoard'), sectionHref(s, 'flights'), 'plane-takeoff');
};

const gate: Handler = (s) => {
  if (needAirport(s)) return;
  const airport = s.airport as KnowledgeAirport;
  const gateSlot = s.u.slots.gate;
  s.b.text = s.b.say('gate', { airport: placeName(s) });
  const named = s.k.transport.filter((option) => option.airport === airport.slug && (namedIn(s.question, option.name.en) || (option.mode === 'inter-terminal' && option.destinations.some((row) => gateSlot && mentions(row.name.en, `${gateSlot[0]} gates`)))));
  for (const option of named) {
    transportCard(s, option, option.destinations);
    if (option.description) s.b.statement({ title: s.b.pick(option.name), text: s.b.pick(option.description), provenance: option.provenance, sourceIds: option.sources }, `transport:${option.id}`);
    for (const notice of liveNotices(s, (notice) => mentions(`${notice.title.en} ${notice.body.en}`, shortName(option.name.en)))) addNotice(s, notice);
  }
  if (/\b(running|operating|working|open|beroperasi|berjalan)\b/.test(normalise(s.question))) s.b.limit(s.b.say('liveStatus'));
  passages(s, { text: `${s.question} gate`, gatePrefix: gateSlot?.[0], topics: ['gate', 'terminals'], limit: 3, minScore: 4 });
  s.b.link(s.b.say('actionTerminalMap'), sectionHref(s, 'map'), 'map');
};

const notices: Handler = (s) => {
  const items = liveNotices(s);
  const name = s.airport?.shortName;
  if (items.length === 0) {
    s.b.text = name ? s.b.say('noticesNone', { airport: name }) : s.b.say('noAnswer');
  } else {
    s.b.text = name ? s.b.say('notices', { airport: name }) : s.b.say('topic');
    for (const notice of items) addNotice(s, notice);
  }
  s.b.link(s.b.say('actionAllNotices'), '/notices', 'megaphone');
};

const contact: Handler = (s) => {
  s.b.text = s.airport ? s.b.say('contact', { who: s.airport.name }) : s.b.say('topic');
  passages(s, { text: `${s.question} contact`, terminal: undefined, topics: ['contact', 'feedback'], limit: 2, minScore: 3 });
  escalate(s, 'human');
  if (s.k.helpTopics.includes('contact')) s.b.link(s.b.say('actionContactHelp'), '/help/contact', 'phone');
};

const greeting: Handler = (s) => {
  s.b.text = s.b.say('greeting');
};

/** Structured retrieval found nothing to say: passages, then the site search engine. */
function fallback(s: Scope): void {
  passages(s, { text: s.question, limit: 3, minScore: 4 });
  for (const hit of searchKnowledge(s.k, s.question, { airport: s.airport?.slug, limit: 4 })) {
    const [type, id] = [hit.type, hit.id.slice(hit.id.indexOf(':') + 1)];
    if (type === 'faq') {
      const passage = s.k.passages.find((item) => item.id === `faq:${id}`);
      if (passage) s.b.passage(passage);
    } else if (type === 'facility') {
      const item = s.k.facilities.find((entry) => entry.id === id);
      if (item) facilityStatement(s, item);
    } else if (type === 'transport') {
      const option = s.k.transport.find((entry) => entry.id === id);
      if (option?.description) s.b.statement({ title: s.b.pick(option.name), text: s.b.pick(option.description), provenance: option.provenance, sourceIds: option.sources, href: hit.href }, `transport:${option.id}`);
    } else if (type === 'notice') {
      const notice = s.k.notices.find((entry) => entry.id === id);
      if (notice) addNotice(s, notice);
    } else if (type === 'parking') {
      const park = s.k.carParks.find((entry) => entry.id === id);
      if (park?.description) s.b.statement({ title: s.b.pick(park.name), text: s.b.pick(park.description), provenance: park.provenance, sourceIds: park.sources, href: hit.href }, `park:${park.id}`);
    } else if (type === 'guide') {
      for (const { passage } of retrievePassages(s.k, { text: s.question, airport: s.airport?.slug, topics: [id], limit: 1, minScore: 4 })) s.b.passage(passage);
      s.b.link(hit.title, hit.href, 'file-text');
    } else {
      s.b.link(hit.title, hit.href, 'arrow-right');
    }
  }
  if (s.b.statements.length > 0) {
    s.b.text = s.b.say('searchIntro');
  } else {
    s.b.text = s.airport ? s.b.say('noAnswerAt', { airport: s.airport.shortName }) : s.b.say('noAnswer');
    escalate(s, 'missing');
    s.b.link(s.b.say('actionSearchTheSite'), `/search?q=${encodeURIComponent(s.question.slice(0, 80))}`, 'search');
  }
}

const HANDLERS: Record<ConciergeIntent, Handler> = {
  'check-in': checkIn,
  'terminal-transfer': terminalTransfer,
  transport,
  dining,
  facility,
  layover,
  parking,
  'lost-property': lostProperty,
  assistance,
  'flight-delay': flightDelay,
  'flight-status': flightStatus,
  gate,
  notices,
  contact,
  greeting,
  unknown: fallback,
};

/* -------------------------------------------------------------------------------------------
 * Entry point
 * ---------------------------------------------------------------------------------------- */

function resolveFlight(u: Understanding, context: ConciergeContext, deps: ConciergeDeps, airport: string | undefined): { flight: Flight | null; missing?: string } {
  const source = deps.flights;
  const designator = u.slots.flight ? `${u.slots.flight.airline}${u.slots.flight.number}` : undefined;
  if (designator) {
    const label = formatFlightNumber(designator);
    if (!source) return { flight: null, missing: label };
    const found = (airport ? source.find(designator, airport) : []).concat(source.find(designator));
    const best = found.find((flight) => flight.direction === 'd') ?? found[0];
    return best ? { flight: best } : { flight: null, missing: label };
  }
  if (context.flightId && source) return { flight: source.get(context.flightId, context.airport) };
  return { flight: null };
}

/**
 * Answer a question from the knowledge, the demo flight source and nothing else.
 *
 * @example
 * const answer = answerQuestion({ question: 'Where is the nearest prayer room?', lang: 'en', context: { airport: 'kul', terminal: 'T1' } }, { knowledge, now: Date.now() });
 */
export function answerQuestion(input: ConciergeInput, deps: ConciergeDeps): ConciergeAnswer {
  const { knowledge: k, now } = deps;
  const lang = input.lang;
  const question = input.question.trim().slice(0, CONCIERGE_MAX_QUESTION);
  const context = input.context ?? {};
  const u = understand(question, k, context);
  const b = new Builder(k, lang);

  const multiTerminal = k.airports.filter((airport) => airport.terminals.length > 1);
  let airportSlug = u.slots.airport;
  if (!airportSlug && u.slots.terminals.length > 0 && multiTerminal.length === 1) airportSlug = multiTerminal[0].slug;
  const { flight, missing } = resolveFlight(u, context, deps, airportSlug ?? context.airport);
  if (!airportSlug && flight && u.intent !== 'flight-delay') airportSlug = flight.airport;
  airportSlug ??= context.airport;
  const airport = getAirport(k, airportSlug);

  let terminal: TerminalId | undefined;
  if (airport && airport.terminals.length > 1) {
    terminal = u.slots.terminals[0] ?? (flight && flight.airport === airport.slug ? flight.terminal : undefined) ?? (context.airport === airport.slug ? context.terminal : undefined);
    if (u.intent === 'terminal-transfer') terminal = undefined;
  }

  const scope: Scope = { b, k, lang, now, question, u, airport, terminal, flight, missingFlight: missing, context };
  HANDLERS[u.intent](scope);

  // Nothing grounded and nothing to clarify: try the passages and the search engine.
  if (!b.clarify && !b.grounded && u.intent !== 'greeting' && u.intent !== 'unknown') {
    const text = b.text;
    fallback(scope);
    if (b.statements.length > 0 && text) b.text = text;
  }
  if (!b.clarify && !b.grounded && u.intent !== 'greeting' && !b.escalation) escalate(scope, 'missing');

  const ids = new Set<string>();
  for (const item of b.statements) item.sourceIds.forEach((id) => ids.add(id));
  for (const card of b.cards) if (card.type !== 'flight') card.sourceIds.forEach((id) => ids.add(id));
  for (const item of b.escalation?.contacts ?? []) item.sourceIds.forEach((id) => ids.add(id));
  const sources = k.sources.filter((source) => ids.has(source.id));
  const demo = b.demo || b.statements.some((item) => item.provenance === 'demo');

  return {
    lang,
    question,
    intent: u.intent,
    text: b.text || b.say('noAnswer'),
    statements: b.statements,
    cards: b.cards,
    actions: b.actions,
    limits: b.limits,
    hint: b.hint,
    clarify: b.clarify,
    escalation: b.escalation,
    sources,
    demo,
    demoGeneratedAt: demo ? deps.flights?.generatedAt : undefined,
    translationFallback: b.fallback,
    context: {
      airport: airport?.slug,
      terminal,
      flightId: flight?.id ?? context.flightId,
      intent: b.clarify ? u.intent : u.intent === 'greeting' ? context.intent : u.intent,
      category: u.intent === 'facility' ? u.slots.category : undefined,
      destination: u.intent === 'transport' ? u.slots.destination : undefined,
    },
  };
}
