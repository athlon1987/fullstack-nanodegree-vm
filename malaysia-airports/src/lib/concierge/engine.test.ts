import { beforeAll, describe, expect, it } from 'vitest';
import type { CarPark, Lang } from '@/content/types';
import { conciergePageEn, conciergePageMs } from '@/lib/i18n/features/concierge';
import { calculateParking } from '@/lib/parking';
import { getFlightProvider } from '@/lib/providers';
import type { Flight } from '@/lib/flights/types';
import { answerQuestion } from './engine';
import { checkGrounded } from './fact-guard';
import { flightSourceFromProvider } from './flights';
import { buildConciergeKnowledge } from './knowledge.server';
import type { ConciergeAnswer, ConciergeContext, ConciergeFlightSource, ConciergeKnowledge } from './types';
import { understand } from './understand';

/** A fixed instant: the engine never reads the clock. */
const NOW = Date.parse('2026-11-17T10:00:00+08:00');

let en: ConciergeKnowledge;
let ms: ConciergeKnowledge;
let flights: ConciergeFlightSource;
/** Every flight the demo source returned during a test, for the property check. */
const seenFlights: Flight[] = [];
let departure: Flight;

beforeAll(() => {
  en = buildConciergeKnowledge('en');
  ms = buildConciergeKnowledge('ms');
  const source = flightSourceFromProvider(getFlightProvider(NOW));
  flights = {
    generatedAt: source.generatedAt,
    get: (id, airport) => {
      const flight = source.get(id, airport);
      if (flight) seenFlights.push(flight);
      return flight;
    },
    find: (designator, airport) => {
      const found = source.find(designator, airport);
      seenFlights.push(...found);
      return found;
    },
  };
  const board = getFlightProvider(NOW).listFlightsSync({ airport: 'kul', direction: 'd' });
  departure = board.find((flight) => flight.airline.code === 'MH') ?? board[0];
  seenFlights.push(departure);
});

const ask = (question: string, context: ConciergeContext = {}, lang: Lang = 'en'): ConciergeAnswer =>
  answerQuestion({ question, lang, context }, { knowledge: lang === 'ms' ? ms : en, now: NOW, flights });

const sourced = (answer: ConciergeAnswer) => answer.statements.filter((statement) => statement.sourceIds.length > 0);

/** Grounded with at least one source, or an honest "not available" with official contacts. */
function expectGroundedOrHonest(answer: ConciergeAnswer) {
  const grounded = sourced(answer).length > 0;
  const honest = answer.escalation !== undefined && answer.escalation.contacts.length > 0;
  expect(grounded || honest, `${answer.question} -> ${answer.text}`).toBe(true);
}

describe('understand', () => {
  it.each([
    ['Where do I check in for my flight?', 'check-in'],
    ['How do I get from Terminal 1 to Terminal 2?', 'terminal-transfer'],
    ['Where can I eat near my departure gate?', 'dining'],
    ['What is the cheapest way to get to KL Sentral?', 'transport'],
    ['My flight is delayed, what should I do?', 'flight-delay'],
    ['Where is the nearest prayer room?', 'facility'],
    ['What can I do during a six-hour layover?', 'layover'],
    ['How much does parking cost?', 'parking'],
    ['I lost my phone', 'lost-property'],
    ['I need a wheelchair', 'assistance'],
    ['Is there free Wi-Fi?', 'facility'],
    ['Bagaimana saya pergi dari Terminal 1 ke Terminal 2?', 'terminal-transfer'],
    ['Di mana surau terdekat?', 'facility'],
    ['Penerbangan saya lewat', 'flight-delay'],
    ['Berapakah kos parkir?', 'parking'],
    ['hello', 'greeting'],
  ])('%s -> %s', (question, intent) => {
    expect(understand(question, en).intent).toBe(intent);
  });

  it('extracts the slots passengers use', () => {
    const transfer = understand('How do I get from klia2 to Terminal 1?', en).slots;
    expect(transfer.terminals).toEqual(['T2', 'T1']);
    expect(understand('What can I do during a six-hour layover?', en).slots.durationMinutes).toBe(360);
    expect(understand('Parking for 2 days', en).slots.durationMinutes).toBe(2880);
    expect(understand('persinggahan enam jam', en).slots.durationMinutes).toBe(360);
    expect(understand('Where do I check in for MH 2610?', en).slots.flight).toEqual({ airline: 'MH', number: '2610' });
    expect(understand('Status of mas2610', en).slots.flight).toEqual({ airline: 'MH', number: '2610' });
    const sentral = understand('cheapest way to KL Sentral', en).slots;
    expect(sentral.destination).toBe('kl sentral');
    expect(sentral.priority).toBe('price');
    expect(sentral.airline).toBeUndefined();
    expect(sentral.flight).toBeUndefined();
    const gate = understand('Where can I eat near gate C12?', en).slots;
    expect(gate.gate).toBe('C12');
    expect(gate.flight).toBeUndefined();
    expect(understand('Where is the prayer room at Penang airport?', en).slots.airport).toBe('pen');
    expect(understand('I lost my pen at KLIA', en).slots.airport).toBe('kul');
    expect(understand('My flight to Kuching is delayed', en).slots.airport).toBeUndefined();
    expect(understand('Where can I eat?', en).slots.category).toBeUndefined();
    expect(understand('Where can I pray?', en).slots.category).toBe('prayer-room');
  });

  it('keeps the topic for a follow-up', () => {
    const follow = understand('and in Terminal 2?', en, { airport: 'kul', terminal: 'T1', intent: 'facility', category: 'prayer-room' });
    expect(follow.intent).toBe('facility');
    expect(follow.slots.category).toBe('prayer-room');
  });
});

describe('answers to the passenger questions', () => {
  it('check-in for a saved flight: the demo flight and the airline’s published check-in', () => {
    const answer = ask('Where do I check in for my flight?', { flightId: departure.id, airport: 'kul' });
    expect(answer.intent).toBe('check-in');
    expect(answer.cards.some((card) => card.type === 'flight' && card.id === departure.id)).toBe(true);
    expect(answer.demo).toBe(true);
    expect(answer.statements.some((statement) => statement.provenance === 'demo')).toBe(true);
    expectGroundedOrHonest(answer);
  });

  it('check-in without an airport asks which airport, and the options lead to an answer', () => {
    const answer = ask('Where do I check in for my flight?');
    expect(answer.clarify?.options.length).toBeGreaterThan(1);
    const followUp = ask('Where do I check in for my flight?', answer.clarify?.options[0].context);
    expect(followUp.clarify).toBeUndefined();
    expectGroundedOrHonest(followUp);
  });

  it('Terminal 1 to Terminal 2: inter-terminal options with sources', () => {
    const answer = ask('How do I get from Terminal 1 to Terminal 2?');
    expect(answer.intent).toBe('terminal-transfer');
    expect(answer.context.airport).toBe('kul');
    expect(answer.cards.filter((card) => card.type === 'transport').length).toBeGreaterThan(0);
    expect(sourced(answer).length).toBeGreaterThan(0);
  });

  it('eating near the gate: published outlets, and says it cannot rank by distance', () => {
    const answer = ask('Where can I eat near my departure gate?', { airport: 'kul', terminal: 'T1' });
    expect(answer.intent).toBe('dining');
    expect(answer.limits.length).toBeGreaterThan(0);
    expectGroundedOrHonest(answer);
  });

  it('cheapest way to KL Sentral: the lowest published fare, and flags options without a fare', () => {
    const answer = ask('What is the cheapest way to get to KL Sentral?');
    expect(answer.intent).toBe('transport');
    const fares = en.transport
      .filter((option) => option.airport === 'kul')
      .flatMap((option) => option.destinations.filter((row) => /kl sentral/i.test(row.name.en) && row.fare).map((row) => row.fare?.amount ?? 0));
    if (fares.length > 0) expect(answer.text).toContain(String(Math.min(...fares)));
    expect(sourced(answer).length).toBeGreaterThan(0);
  });

  it('a delayed flight: guidance with sources and an escalation to the airline', () => {
    const answer = ask('My flight is delayed, what should I do?');
    expect(answer.intent).toBe('flight-delay');
    expect(answer.escalation?.reason).toBe('disruption');
    expect(answer.escalation?.airline).toBe(true);
    expectGroundedOrHonest(answer);
  });

  it('a delayed flight with its number shows the demo flight, labelled', () => {
    const answer = ask(`${departure.number} is delayed, what should I do?`);
    expect(answer.cards[0]?.type).toBe('flight');
    expect(answer.demo).toBe(true);
  });

  it('nearest prayer room: asks for the airport, then answers from the facilities', () => {
    expect(ask('Where is the nearest prayer room?').clarify).toBeDefined();
    const answer = ask('Where is the nearest prayer room?', { airport: 'kul', terminal: 'T1' });
    expect(answer.cards.some((card) => card.type === 'facility' && card.category === 'prayer-room')).toBe(true);
    expect(answer.limits.length).toBeGreaterThan(0);
    expectGroundedOrHonest(answer);
  });

  it('six-hour layover at KLIA: places to rest, with sources', () => {
    const answer = ask('What can I do during a six-hour layover at KLIA?');
    expect(answer.intent).toBe('layover');
    expect(answer.text).toContain('6');
    expect(sourced(answer).length).toBeGreaterThan(0);
  });

  it('parking cost: an estimate only where rates are published, otherwise says so', () => {
    const pen = ask('How much does parking cost at Penang airport for 3 hours?');
    expect(pen.intent).toBe('parking');
    expectGroundedOrHonest(pen);
    const kul = ask('How much does parking cost at KLIA?');
    const published = en.carParks.filter((park) => park.airport === 'kul' && park.rateStatus === 'published');
    if (published.length === 0) {
      expect(kul.limits.length).toBeGreaterThan(0);
      expect(kul.escalation?.contacts.length).toBeGreaterThan(0);
      expect(kul.statements.some((statement) => statement.provenance === 'estimated')).toBe(false);
    }
  });

  it('lost property, wheelchair and Wi-Fi each answer or escalate', () => {
    for (const question of ['I lost my phone at KLIA. Who do I contact?', 'How do I ask for a wheelchair?', 'Is there free Wi-Fi at KLIA?']) {
      const answer = ask(question);
      expectGroundedOrHonest(answer);
      expect(answer.escalation, question).toBeDefined();
    }
  });

  it('answers in Bahasa Malaysia', () => {
    const answer = ask('Bagaimana saya pergi dari Terminal 1 ke Terminal 2?', {}, 'ms');
    expect(answer.lang).toBe('ms');
    expect(answer.text).toContain('sumber kami');
    const prayer = ask('Di mana surau terdekat?', { airport: 'kul', terminal: 'T1' }, 'ms');
    expect(prayer.cards.some((card) => card.type === 'facility')).toBe(true);
  });

  it('says it does not know rather than guessing', () => {
    const answer = ask('What is the meaning of life?');
    expect(answer.escalation?.reason).toBe('missing');
    expect(answer.escalation?.contacts.length).toBeGreaterThan(0);
  });

  it('never invents a flight: an unknown number is reported as not found', () => {
    const answer = ask('What is the status of MH 9999?');
    expect(answer.cards.some((card) => card.type === 'flight')).toBe(false);
    expect(answer.text).toContain('MH 9999');
  });
});

/* -------------------------------------------------------------------------------------------
 * Property: no number or name in any answer that the content, the demo flights or the question
 * does not contain.
 * ---------------------------------------------------------------------------------------- */

const QUESTIONS = [
  'Where do I check in for my flight?',
  'How do I get from Terminal 1 to Terminal 2?',
  'Where can I eat near my departure gate?',
  'What is the cheapest way to get to KL Sentral?',
  'What is the fastest way to KL Sentral?',
  'My flight is delayed, what should I do?',
  'Where is the nearest prayer room?',
  'What can I do during a six-hour layover?',
  'What can I do with 90 minutes before my flight?',
  'How much does parking cost for 3 hours?',
  'How much is parking for 2 days?',
  'I lost my phone. Who do I contact?',
  'My bag did not arrive',
  'I left my laptop on the plane',
  'How do I ask for a wheelchair?',
  'Is there free Wi-Fi?',
  'Where are the toilets?',
  'Is there an ATM?',
  'Where is the lounge?',
  'Is there a hotel inside the airport?',
  'Where can I smoke?',
  'How do I get to Putrajaya?',
  'Taxi to KLCC',
  'How do I get to George Town?',
  'Bus to KK Sentral',
  'How do I get to the C gates?',
  'Is the Aerotrain running?',
  'How do I contact Malaysia Airports?',
  'Are there any notices?',
  'Can I bring a power bank?',
  'How much liquid can I take?',
  'What is the status of MH 1?',
  'hello',
  'qwerty asdf',
  'Di mana saya daftar masuk?',
  'Apakah cara termurah ke KL Sentral?',
  'Di mana surau terdekat?',
  'Telefon saya hilang',
];
const CONTEXTS: ConciergeContext[] = [{}, { airport: 'kul' }, { airport: 'kul', terminal: 'T2' }, { airport: 'pen' }, { airport: 'bki' }, { airport: 'lgk' }, { airport: 'iph' }];

/** Every string a passenger can read in an answer. */
function answerStrings(answer: ConciergeAnswer): string[] {
  const out = [answer.text, ...answer.limits, ...answer.statements.flatMap((statement) => [statement.title ?? '', statement.text])];
  for (const card of answer.cards) {
    if (card.type === 'flight') out.push(card.number, card.place, card.terminalLabel, card.airline, card.gate ?? '');
    else if (card.type === 'transport') out.push(card.name, card.modeLabel, card.operator ?? '', card.frequency ?? '', ...card.rows.flatMap((row) => [row.name, row.fare ?? '', row.duration ?? '', row.note ?? '']));
    else if (card.type === 'car-park') out.push(card.name, card.place, card.estimate ?? '');
    else out.push(card.name, card.place, card.location ?? '', card.hours ?? '');
  }
  for (const action of answer.actions) out.push(action.label);
  if (answer.escalation) out.push(answer.escalation.text, ...answer.escalation.contacts.flatMap((contact) => [contact.label, contact.value, contact.note ?? '']));
  for (const option of answer.clarify?.options ?? []) out.push(option.label);
  return out.filter(Boolean);
}

/** Numbers the engine may derive: the question's duration and parking charges for it. */
function derived(answer: ConciergeAnswer, knowledge: ConciergeKnowledge, context: ConciergeContext): string {
  const minutes = understand(answer.question, knowledge, context).slots.durationMinutes;
  if (minutes === undefined) return '';
  const parts = [minutes, Math.floor(minutes / 60), minutes % 60, minutes / 60].map(String);
  for (const park of knowledge.carParks as CarPark[]) {
    const result = calculateParking(park, minutes);
    if (!result.unavailable) parts.push(result.total.toFixed(2), String(result.total));
  }
  return parts.join(' ');
}

describe('property: answers contain no invented numbers or names', () => {
  it('holds for every question, context and language', () => {
    const phrasebook = JSON.stringify([conciergePageEn.engine, conciergePageMs.engine]);
    const failures: string[] = [];
    let checked = 0;
    for (const lang of ['en', 'ms'] as const) {
      const knowledge = lang === 'ms' ? ms : en;
      const corpus = JSON.stringify(knowledge) + phrasebook;
      for (const context of CONTEXTS) {
        for (const question of QUESTIONS) {
          seenFlights.length = 0;
          const answer = ask(question, context, lang);
          const reference = [corpus, question, JSON.stringify(seenFlights), derived(answer, knowledge, context)].join('\n');
          for (const text of answerStrings(answer)) {
            const result = checkGrounded(text, reference);
            if (!result.ok) failures.push(`[${lang} ${JSON.stringify(context)}] ${question}: ${result.unsupported.join(', ')} in "${text}"`);
          }
          // Every source id resolves; demo data is always flagged.
          const ids = new Set(knowledge.sources.map((source) => source.id));
          for (const statement of answer.statements) for (const id of statement.sourceIds) if (!ids.has(id)) failures.push(`unknown source ${id}`);
          if (answer.cards.some((card) => card.type === 'flight') && !answer.demo) failures.push(`${question}: flight card without demo flag`);
          if (answer.statements.some((statement) => statement.provenance === 'demo' && statement.sourceIds.length > 0)) failures.push(`${question}: demo statement with a source`);
          // Grounded, or an honest "not available" with official contacts, or a clarifying question.
          if (!answer.clarify && answer.intent !== 'greeting') {
            const grounded = sourced(answer).length > 0 || (answer.escalation?.contacts.length ?? 0) > 0;
            if (!grounded) failures.push(`${question} [${JSON.stringify(context)}]: neither grounded nor escalated`);
          }
          checked += 1;
        }
      }
    }
    expect(failures).toEqual([]);
    expect(checked).toBe(2 * CONTEXTS.length * QUESTIONS.length);
  });
});
