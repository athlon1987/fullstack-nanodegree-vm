import { describe, expect, it } from 'vitest';
import { getAirportContent } from '@/content';
import type { AirportContent, GuideNote } from '@/content/types';
import { checkInLines } from '@/lib/flights/check-in';
import { getT } from '@/lib/i18n';
import { DemoFlightProvider } from '@/lib/providers/demo-flights';
import { LHR, PEN, makeFlight, type FlightSeed } from '@/lib/testing/fixtures';
import { JOURNEY_MODES, buildJourney, type JourneyStep } from './index';

const kul = getAirportContent('kul') as AirportContent;
// Ipoh: a real MAHB airport with no content file yet.
const noContentAirport = getAirportContent('iph') as AirportContent;
const at = (clock: string) => new Date(`2026-11-17T${clock}:00+08:00`);

const international = (extra: FlightSeed = {}) =>
  makeFlight({
    code: 'MH',
    digits: '2',
    time: '14:00',
    remote: LHR,
    checkInOpensAt: '2026-11-17T11:00:00+08:00',
    checkInClosesAt: '2026-11-17T13:00:00+08:00',
    boardingAt: '2026-11-17T13:15:00+08:00',
    gateClosesAt: '2026-11-17T13:45:00+08:00',
    ...extra,
  });
const domestic = (extra: FlightSeed = {}) =>
  makeFlight({
    code: 'MH',
    digits: '1138',
    time: '14:00',
    remote: PEN,
    checkInOpensAt: '2026-11-17T12:00:00+08:00',
    checkInClosesAt: '2026-11-17T13:15:00+08:00',
    boardingAt: '2026-11-17T13:30:00+08:00',
    gateClosesAt: '2026-11-17T13:50:00+08:00',
    ...extra,
  });
const arrival = (extra: FlightSeed = {}) => makeFlight({ code: 'MH', digits: '1', time: '17:35', remote: LHR, direction: 'a', ...extra });

const ids = (steps: JourneyStep[]) => steps.map((step) => step.id);
const step = (steps: JourneyStep[], id: string): JourneyStep => {
  const found = steps.find((item) => item.id === id);
  if (!found) throw new Error(`No step ${id} in ${ids(steps).join(', ')}`);
  return found;
};
const timesInOrder = (steps: JourneyStep[]): boolean => {
  const times = steps.filter((item) => item.time).map((item) => Date.parse(item.time as string));
  return times.every((time, index) => index === 0 || time >= times[index - 1]);
};

describe('buildJourney: departing', () => {
  it('orders the steps from terminal to boarding with times that never go backwards', () => {
    const steps = buildJourney({ flight: international(), mode: 'departing', airportContent: kul, now: at('08:00') });
    expect(ids(steps)).toEqual(['terminal', 'travel', 'arrive', 'check-in', 'security', 'gate', 'food', 'boarding', 'departure']);
    expect(timesInOrder(steps)).toBe(true);
    expect(steps.every((item) => item.state === 'upcoming')).toBe(true);
  });

  it('recommends arriving 3 hours before an international flight and 2 hours before a domestic one, as estimated guidance', () => {
    const intl = step(buildJourney({ flight: international(), mode: 'departing', airportContent: kul, now: at('08:00') }), 'arrive');
    expect(intl.time).toBe('2026-11-17T11:00:00+08:00');
    expect(intl.provenance).toBe('estimated');
    expect(intl.title.en).toBe('Arrive at the airport by 11:00');
    expect(intl.body.en).toMatch(/airline/);

    const dom = step(buildJourney({ flight: domestic(), mode: 'departing', airportContent: kul, now: at('08:00') }), 'arrive');
    expect(dom.time).toBe('2026-11-17T12:00:00+08:00');
    expect(dom.provenance).toBe('estimated');
  });

  it('uses an official arrival rule when the airport content has one', () => {
    const rule: GuideNote = {
      id: 'test-arrival-rule',
      airport: 'kul',
      topic: 'arrival-time',
      title: { en: 'Official arrival advice' },
      body: { en: 'The airport asks passengers to arrive 4 hours early this week.' },
      provenance: 'official',
      sources: ['mahb-klia-t1-home'],
    };
    const content = { ...kul, guidesNotes: [...kul.guidesNotes, rule] };
    const arrive = step(buildJourney({ flight: international(), mode: 'departing', airportContent: content, now: at('08:00') }), 'arrive');
    expect(arrive).toMatchObject({ provenance: 'official', sources: ['mahb-klia-t1-home'], body: { en: rule.body.en } });
  });

  it('tags each step with the right kind of guidance', () => {
    const steps = buildJourney({ flight: international({ gate: 'C12', checkInRow: 'H', checkInCounters: '1-18' }), mode: 'departing', airportContent: kul, now: at('11:30') });
    expect(step(steps, 'terminal').provenance).toBe('demo');
    expect(step(steps, 'travel').provenance).toBe('suggestion');
    expect(step(steps, 'check-in').provenance).toBe('demo');
    expect(step(steps, 'security').provenance).toBe('estimated');
    expect(step(steps, 'gate').provenance).toBe('demo');
    expect(step(steps, 'food').provenance).toBe('suggestion');
    expect(step(steps, 'boarding').provenance).toBe('demo');
    const live = buildJourney({ flight: international({ gate: 'C12', isDemo: false }), mode: 'departing', airportContent: kul, now: at('11:30') });
    expect(step(live, 'gate').provenance).toBe('official');
    expect(step(live, 'boarding').provenance).toBe('estimated');
  });

  it('shows the check-in row from the provider and attaches sourced airline notes', () => {
    const steps = buildJourney({ flight: international({ checkInRow: 'H', checkInCounters: '1-18' }), mode: 'departing', airportContent: kul, now: at('11:30') });
    const checkIn = step(steps, 'check-in');
    expect(checkIn.body.en).toContain('Row H, counters 1-18');
    expect(checkIn.body.ms).toContain('Baris H, kaunter 1-18');
    expect(checkIn.notes.map((note) => note.id)).toEqual(['kul-t1-check-in-level', 'kul-t1-mh-check-in-rows']);
    expect(checkIn.notes.every((note) => note.provenance === 'official' && note.sources.length > 0)).toBe(true);

    // Before the row is shown, the step still states the flight's own close time: demo data (B-02).
    const generic = step(buildJourney({ flight: international(), mode: 'departing', airportContent: kul, now: at('08:00') }), 'check-in');
    expect(generic.provenance).toBe('demo');
    expect(generic.body.en).toMatch(/Check-in closes at 13:00/);
    expect(step(buildJourney({ flight: null, mode: 'departing', airportContent: kul, now: at('08:00') }), 'check-in').provenance).toBe('estimated');
    const otherAirline = step(buildJourney({ flight: international({ airline: { code: 'BA', name: 'British Airways' } }), mode: 'departing', airportContent: kul, now: at('08:00') }), 'check-in');
    expect(otherAirline.notes.map((note) => note.id)).toEqual(['kul-t1-check-in-level']);
  });

  it('explains how to reach the gate using the airport facts for that gate group', () => {
    const satellite = step(buildJourney({ flight: international({ gate: 'C12' }), mode: 'departing', airportContent: kul, now: at('12:40') }), 'gate');
    expect(satellite.title.en).toBe('Go to gate C12');
    expect(satellite.notes.map((note) => note.id)).toEqual(['kul-t1-gates-c-satellite']);
    expect(satellite.notes[0].provenance).toBe('official');
    expect(satellite.actions[0]).toEqual({ labelKey: 'journey.actions.viewGateOnMap', href: '/kul/map?gate=C12&t=T1' });

    const pier = step(buildJourney({ flight: international({ gate: 'G4' }), mode: 'departing', airportContent: kul, now: at('12:40') }), 'gate');
    expect(pier.notes.map((note) => note.id)).toEqual(['kul-t1-gates-g-h-contact-pier']);

    const unknown = step(buildJourney({ flight: international(), mode: 'departing', airportContent: kul, now: at('08:00') }), 'gate');
    expect(unknown).toMatchObject({ provenance: 'estimated', notes: [] });
    expect(unknown.body.en).toMatch(/90 minutes/);
  });

  it('marks past, current and upcoming steps from the given time', () => {
    const steps = buildJourney({ flight: international(), mode: 'departing', airportContent: kul, now: at('13:20') });
    expect(step(steps, 'boarding').state).toBe('current');
    expect(step(steps, 'check-in').state).toBe('done');
    expect(step(steps, 'terminal').state).toBe('done');
  });

  it('adapts to a domestic flight, hand luggage and assistance needs', () => {
    const steps = buildJourney({
      flight: domestic(),
      mode: 'departing',
      airportContent: kul,
      now: at('08:00'),
      preferences: { checkedBags: false, reducedMobility: true },
    });
    expect(ids(steps)).toContain('assistance');
    expect(step(steps, 'assistance').notes.map((note) => note.id)).toEqual(['kul-butterfly-effect-note']);
    expect(step(steps, 'security').title.en).toBe('Go through security');
    expect(step(steps, 'check-in').body.en).toMatch(/straight to security/);
  });

  it('replaces the timeline with one clear step when the flight is cancelled, and leads with a delay', () => {
    const cancelled = buildJourney({ flight: international({ status: 'cancelled' }), mode: 'departing', airportContent: kul, now: at('08:00') });
    expect(ids(cancelled)).toEqual(['disruption']);
    expect(cancelled[0].body.en).toMatch(/Contact Malaysia Airlines/);
    expect(cancelled[0]).toMatchObject({ state: 'current', terminal: true });
    const delayed = buildJourney({
      flight: international({ status: 'delayed', estimated: '2026-11-17T15:10:00+08:00', delayMinutes: 70 }),
      mode: 'departing',
      airportContent: kul,
      now: at('08:00'),
    });
    expect(delayed[0]).toMatchObject({ id: 'delay', title: { en: 'Flight MH 2 is delayed: new time 15:10' } });
  });

  it('still gives useful, untimed guidance without a flight or airport content', () => {
    const steps = buildJourney({ flight: null, mode: 'departing', airportContent: noContentAirport, now: at('08:00') });
    expect(ids(steps)).toEqual(['terminal', 'travel', 'arrive', 'check-in', 'security', 'gate', 'food', 'boarding']);
    expect(steps.every((item) => item.time === undefined && item.state === 'upcoming')).toBe(true);
    expect(step(steps, 'terminal').provenance).toBe('suggestion');
    expect(step(steps, 'travel').actions.map((action) => action.href)).toEqual(['/iph/transport', '/iph/parking']);
    expect(steps.every((item) => item.notes.length === 0)).toBe(true);
  });
});

describe('buildJourney: arriving, transiting, meeting', () => {
  it('covers landing, immigration, baggage, customs, onward transport and meeting point', () => {
    const steps = buildJourney({ flight: arrival({ belt: '5' }), mode: 'arriving', airportContent: kul, now: at('16:00') });
    expect(ids(steps)).toEqual(['landing', 'immigration', 'baggage', 'customs', 'onward', 'meeting-point']);
    expect(step(steps, 'landing').time).toBe('2026-11-17T17:35:00+08:00');
    expect(step(steps, 'baggage')).toMatchObject({ provenance: 'demo', title: { en: 'Collect your bags at belt 5' } });
    expect(step(steps, 'immigration').notes.map((note) => note.id)).toEqual(['kul-autogate-mdac']);
    expect(step(steps, 'immigration').notes[0].provenance).toBe('estimated');
    expect(step(steps, 'onward').notes.map((note) => note.id)).toEqual(['kul-t1-buses-level-1']);
    expect(step(steps, 'customs').provenance).toBe('estimated');
  });

  it('skips immigration and customs for a domestic arrival, and baggage for hand luggage', () => {
    const steps = buildJourney({ flight: arrival({ origin: PEN }), mode: 'arriving', airportContent: kul, now: at('16:00'), preferences: { checkedBags: false } });
    expect(ids(steps)).toEqual(['landing', 'onward', 'meeting-point']);
  });

  it('explains a self-transfer between Terminal 1 and Terminal 2 with estimated time guidance', () => {
    const steps = buildJourney({
      flight: arrival(),
      mode: 'transiting',
      airportContent: kul,
      now: at('16:00'),
      preferences: { connection: { type: 'self-transfer', onwardTerminal: 'T2' } },
    });
    expect(ids(steps)).toEqual(['connection-type', 'landing', 'transfer', 'connection-time', 'rest', 'onward-gate']);
    expect(step(steps, 'connection-type').title.en).toMatch(/self-transfer/);
    expect(step(steps, 'transfer').title.en).toBe('Transfer from KLIA Terminal 1 to KLIA Terminal 2');
    const guidance = step(steps, 'connection-time');
    expect(guidance.provenance).toBe('estimated');
    expect(guidance.body.en).toMatch(/Airlines set the minimum connection time/);
    expect(guidance.actions.map((action) => action.labelKey)).toContain('journey.actions.contactAirline');
  });

  it('keeps a protected same-terminal connection airside and shows the time between flights', () => {
    const onward = international({ digits: '4', scheduled: '2026-11-17T20:05:00+08:00', estimated: '2026-11-17T20:05:00+08:00', boardingAt: '2026-11-17T19:20:00+08:00', gateClosesAt: '2026-11-17T19:50:00+08:00', gate: 'C3' });
    const steps = buildJourney({
      flight: arrival(),
      mode: 'transiting',
      airportContent: kul,
      now: at('16:00'),
      preferences: { connection: { type: 'protected', onwardFlight: onward } },
    });
    expect(step(steps, 'transfer').title.en).toBe('Follow the transfer signs');
    expect(step(steps, 'connection-time').title.en).toBe('You have about 2 h 30 min between flights');
    expect(ids(steps).slice(-2)).toEqual(['onward-gate', 'onward-boarding']);
    expect(step(steps, 'onward-gate').notes.map((note) => note.id)).toEqual(['kul-t1-gates-c-satellite']);
    expect(timesInOrder(steps)).toBe(true);
  });

  it('helps someone meeting a passenger: status, parking, where to wait, when to expect them', () => {
    const steps = buildJourney({ flight: arrival(), mode: 'meeting', airportContent: kul, now: at('16:00') });
    expect(ids(steps)).toEqual(['status', 'wait', 'parking', 'expect']);
    expect(step(steps, 'status').provenance).toBe('demo');
    expect(step(steps, 'expect')).toMatchObject({ time: '2026-11-17T18:05:00+08:00', provenance: 'estimated' });
    expect(step(steps, 'wait').notes.map((note) => note.id)).toEqual(['kul-t1-arrival-hall-level']);
    expect(step(steps, 'parking').actions[0].href).toBe(`/kul/parking?t=T1&from=${encodeURIComponent('2026-11-17T17:05:00+08:00')}&to=${encodeURIComponent('2026-11-17T20:05:00+08:00')}`);
    expect(timesInOrder(steps)).toBe(true);
  });
});

describe('buildJourney: contract for the UI', () => {
  const flights = { departing: international({ gate: 'C12', checkInRow: 'H', checkInCounters: '1-18' }), arriving: arrival({ belt: '5' }), transiting: arrival(), meeting: arrival() };

  it('gives every step copy in both languages, a provenance tag and locale-free links with real dictionary keys', () => {
    const t = getT('en');
    for (const mode of JOURNEY_MODES) {
      for (const flight of [flights[mode], null]) {
        const steps = buildJourney({ flight, mode, airportContent: kul, now: at('12:00') });
        expect(steps.length).toBeGreaterThan(0);
        expect(new Set(ids(steps)).size).toBe(steps.length);
        for (const item of steps) {
          expect(item.title.ms, `${mode} ${item.id}`).toBeTruthy();
          expect(item.body.ms, `${mode} ${item.id}`).toBeTruthy();
          expect(['official', 'estimated', 'suggestion', 'demo']).toContain(item.provenance);
          expect(Boolean(item.time) || Boolean(item.relative), `${mode} ${item.id} has a time or a relative key`).toBe(true);
          if (item.relative) expect(t(item.relative)).not.toBe(item.relative);
          for (const action of item.actions) {
            expect(action.href.startsWith('/')).toBe(true);
            expect(action.href.startsWith('/en') || action.href.startsWith('/ms/')).toBe(false);
            expect(t(action.labelKey)).not.toBe(action.labelKey);
          }
        }
      }
    }
  });
});

/* ------------------------------------------------------------------------------------------
 * Fix round B: states from start, end and status (B-02), needs (B-11), context (B-13),
 * greeters (B-17), operational status hints (B-01) and check-in desks (B-12)
 * --------------------------------------------------------------------------------------- */

const current = (steps: JourneyStep[]): string[] => steps.filter((item) => item.state === 'current').map((item) => item.id);
const departing = (flight: ReturnType<typeof international>, clock: string, preferences = {}) =>
  buildJourney({ flight, mode: 'departing', airportContent: kul, now: at(clock), preferences });

describe('buildJourney: the current step follows start, end and flight status (B-02)', () => {
  it('moves on from check-in one minute after it closes and says check-in has closed', () => {
    const steps = departing(international({ status: 'check-in-closed', checkInRow: 'H', checkInCounters: '1-18' }), '13:01');
    expect(current(steps)).toEqual(['security']);
    const checkIn = step(steps, 'check-in');
    expect(checkIn.state).toBe('done');
    expect(checkIn.title.en).toBe('Check-in closed at 13:00');
    expect(checkIn.body.en).toMatch(/contact Malaysia Airlines now/);
    expect(checkIn.body.en).toMatch(/If you have checked in, carry on to security/);
  });

  it('keeps check-in current while it is open', () => {
    expect(current(departing(international({ status: 'check-in-open', checkInRow: 'H' }), '12:59'))).toEqual(['check-in']);
  });

  it('makes boarding current while boarding, then the departure once the gate has closed', () => {
    expect(current(departing(international({ status: 'boarding', gate: 'C12' }), '13:20'))).toEqual(['boarding']);
    const closed = departing(international({ status: 'gate-closed', gate: 'C12' }), '13:46');
    expect(current(closed)).toEqual(['departure']);
    expect(step(closed, 'boarding').state).toBe('done');
    expect(step(closed, 'departure').title.en).toBe('Gate closed at 13:45: departs 14:00');
  });

  it('ends a departed flight with one terminal step that sends nobody anywhere (departure + 1 min)', () => {
    const steps = departing(international({ status: 'departed', actual: '2026-11-17T14:00:00+08:00' }), '14:01');
    expect(ids(steps)).toEqual(['departed']);
    expect(steps[0]).toMatchObject({ state: 'current', terminal: true, title: { en: 'Flight MH 2 departed at 14:00' } });
    expect(steps[0].body.en).not.toMatch(/go to|gate|board/i);
  });

  it('ends a cancelled flight with one terminal step for departing, arriving and meeting journeys', () => {
    for (const [mode, flight] of [
      ['departing', international({ status: 'cancelled' })],
      ['arriving', arrival({ status: 'cancelled' })],
      ['meeting', arrival({ status: 'cancelled' })],
    ] as const) {
      const steps = buildJourney({ flight, mode, airportContent: kul, now: at('12:00') });
      expect(ids(steps), mode).toEqual(['disruption']);
      expect(steps[0].state, mode).toBe('current');
    }
  });

  it('marks landing done once an arrival has landed and makes the next step current', () => {
    const landed = arrival({ status: 'landed', actual: '2026-11-17T17:35:00+08:00' });
    const steps = buildJourney({ flight: landed, mode: 'arriving', airportContent: kul, now: at('17:36') });
    expect(step(steps, 'landing')).toMatchObject({ state: 'done', title: { en: 'Flight MH 1 landed at 17:35' } });
    expect(current(steps)).toEqual(['immigration']);
    const later = buildJourney({ flight: landed, mode: 'arriving', airportContent: kul, now: at('18:40') });
    expect(current(later)).toEqual(['onward']);
  });

  it('keeps the landing upcoming before an arrival lands', () => {
    const steps = buildJourney({ flight: arrival({ status: 'en-route' }), mode: 'arriving', airportContent: kul, now: at('16:00') });
    expect(step(steps, 'landing').state).toBe('upcoming');
    expect(current(steps)).toEqual([]);
  });
});

describe('buildJourney: needs (B-11)', () => {
  const airlineAssistance = {
    MH: { title: { en: 'Malaysia Airlines assistance' }, body: { en: 'Malaysia Airlines asks for wheelchair requests at least 48 hours before departure.' }, provenance: 'official' as const, sources: ['mh-special-assistance'] },
  };
  const content = { ...kul, airlineAssistance };

  it('adds the assistance step with the airline notice period and the airport service, departing and arriving', () => {
    const preferences = { needs: ['wheelchair', 'older'] as const, reducedMobility: true, stepFree: true };
    const dep = buildJourney({ flight: international({ gate: 'C12' }), mode: 'departing', airportContent: content, now: at('08:00'), preferences: { ...preferences, needs: [...preferences.needs] } });
    const assistance = step(dep, 'assistance');
    expect(assistance.title.en).toBe('Arrange assistance with Malaysia Airlines');
    expect(assistance.body.en).toMatch(/a wheelchair, an older traveller/);
    expect(assistance.notes.map((note) => note.id)).toEqual(['assistance-mh', 'kul-butterfly-effect-note']);
    expect(assistance.notes[0].body.en).toMatch(/48 hours/);
    expect(assistance.actions.map((action) => action.href)).toContain('/accessibility');
    // Map links ask for step-free routes.
    expect(step(dep, 'gate').actions[0].href).toBe('/kul/map?gate=C12&t=T1&sf=1');

    const arr = buildJourney({ flight: arrival(), mode: 'arriving', airportContent: content, now: at('08:00'), preferences: { needs: ['companion'] } });
    expect(ids(arr)).toContain('assistance');
  });

  it('says honestly when the airline notice period is not published', () => {
    const steps = buildJourney({ flight: international({ airline: { code: 'BA', name: 'British Airways' } }), mode: 'departing', airportContent: content, now: at('08:00'), preferences: { needs: ['wheelchair'] } });
    expect(step(steps, 'assistance').body.en).toMatch(/We have not published its notice period/);
  });

  it('leaves the assistance step out without needs', () => {
    expect(ids(departing(international(), '08:00'))).not.toContain('assistance');
  });
});

describe('buildJourney: links that keep the flight context (B-13)', () => {
  const lounge = {
    id: 'kul-t1-plaza-premium-g',
    kind: 'lounge' as const,
    name: { en: 'Plaza Premium Lounge', ms: 'Plaza Premium Lounge' },
    terminal: 'T1' as const,
    airside: true,
    gatePrefixes: ['G'],
    href: '/kul/lounges#kul-t1-plaza-premium-g',
    provenance: 'official' as const,
    sources: ['mahb-klia-t1-home'],
  };
  const content = { ...kul, places: [lounge] };

  it('passes gate and terminal to shop and dine, terminal and arrival time to parking, terminal to transport', () => {
    const steps = departing(international({ gate: 'G6' }), '08:00');
    expect(step(steps, 'food').actions[0].href).toBe('/kul/shop-dine?gate=T1-G6&t=T1');
    expect(step(steps, 'travel').actions.map((action) => action.href)).toEqual([
      '/kul/transport?t=T1',
      `/kul/parking?t=T1&from=${encodeURIComponent('2026-11-17T11:00:00+08:00')}`,
    ]);
  });

  it('suggests the lounge near the gate after security, first when the passenger has lounge access', () => {
    const steps = buildJourney({ flight: international({ gate: 'G6' }), mode: 'departing', airportContent: content, now: at('08:00'), preferences: { loungeAccess: true } });
    const food = step(steps, 'food');
    expect(food.places?.map((place) => place.id)).toEqual(['kul-t1-plaza-premium-g']);
    expect(food.body.en).toMatch(/Near gate G6, after security: Plaza Premium Lounge/);
    expect(food.actions[1].href).toBe('/kul/lounges?t=T1');
    // A C gate is not near the G pier.
    expect(step(buildJourney({ flight: international({ gate: 'C12' }), mode: 'departing', airportContent: content, now: at('08:00') }), 'food').places).toBeUndefined();
  });

  it('moves the arrive-by time later with hand luggage only, as an estimate', () => {
    const arrive = step(departing(international(), '08:00', { handLuggageOnly: true }), 'arrive');
    expect(arrive.title.en).toBe('Arrive at the airport by 12:00');
    expect(arrive.provenance).toBe('estimated');
    expect(arrive.body.en).toMatch(/hand luggage only/);
  });

  it('offers Fast Track only as an optional step after security, when the content publishes it', () => {
    expect(ids(departing(international(), '08:00'))).not.toContain('fast-track');
    const fastTrack = { title: { en: 'Optional: Fast Track' }, body: { en: 'A paid lane.' }, href: '/kul/fast-track', provenance: 'official' as const, sources: ['mahb-klia-t1-home'] };
    const steps = buildJourney({ flight: international(), mode: 'departing', airportContent: { ...kul, fastTrack }, now: at('08:00') });
    const order = ids(steps);
    expect(order.indexOf('fast-track')).toBe(order.indexOf('security') + 1);
    expect(step(steps, 'fast-track').optional).toBe(true);
  });
});

describe('buildJourney: meeting someone (B-17)', () => {
  it('leads with where to wait and pick up, offers short-stay parking with a 3-hour preset and drops long-stay warnings', () => {
    const steps = buildJourney({ flight: arrival(), mode: 'meeting', airportContent: kul, now: at('16:00') });
    expect(ids(steps).slice(0, 3)).toEqual(['status', 'wait', 'parking']);
    expect(step(steps, 'wait').body.en).toMatch(/Do not wait at the kerb/);
    expect(step(steps, 'wait').body.en).toMatch(/e-hailing pick-up area and any entry fee are not published/);
    const parking = step(steps, 'parking');
    expect(parking.title.en).toBe('Short-stay parking');
    expect(parking.notes.map((note) => note.id)).not.toContain('kul-ltcp-shuttle-note');
    expect(parking.notes.map((note) => note.id)).not.toContain('kul-preferred-parking-warning');
    const all = JSON.stringify(steps);
    expect(all).not.toMatch(/Avoid Preferred Parking|longer trip/);
  });
});

describe('buildJourney: status lines and check-in desks (B-01, B-12)', () => {
  it('asks for the Aerotrain line at a C gate and the immigration line at security', () => {
    const steps = departing(international({ gate: 'C12' }), '08:00');
    expect(step(steps, 'gate').ops).toEqual(['aerotrain']);
    expect(step(steps, 'security').ops).toEqual(['immigration']);
    expect(step(departing(international({ gate: 'G6' }), '08:00'), 'gate').ops).toBeUndefined();
  });

  it('shows no immigration line for a domestic departure', () => {
    expect(step(departing(domestic(), '08:00'), 'security').ops).toBeUndefined();
  });

  it('agrees with the status card on every demo departure, with and without desk rows from the feed', () => {
    const now = new Date('2026-11-18T09:40:00+08:00');
    const board = new DemoFlightProvider(now).listFlightsSync({ airport: 'kul', direction: 'd' });
    let withRows = 0;
    let withoutRows = 0;
    for (const flight of board) {
      if (flight.status === 'cancelled' || flight.status === 'departed') continue;
      const lines = checkInLines(flight);
      const checkIn = buildJourney({ flight, mode: 'departing', airportContent: kul, now }).find((item) => item.id === 'check-in');
      if (!checkIn) continue;
      const closed = flight.checkInClosesAt !== undefined && Date.parse(flight.checkInClosesAt) <= now.getTime();
      if (closed) continue;
      if (lines.length > 0) {
        withRows += 1;
        // Every line the card shows (cabins and bag drop) is in the timeline, in both languages.
        for (const line of lines) {
          expect(checkIn.body.en, flight.id).toContain(line.en);
          expect(checkIn.body.ms, flight.id).toContain(line.ms as string);
        }
      } else {
        withoutRows += 1;
        // No feed row: neither the card nor the timeline invents one.
        expect(checkIn.body.en, flight.id).not.toMatch(/\bRow [A-Z]\b/);
      }
    }
    expect(withRows).toBeGreaterThan(0);
    expect(withoutRows).toBeGreaterThan(0);
  });

  it('lists every cabin desk and the bag drop in the check-in step', () => {
    const flight = international({
      checkInRow: 'H',
      checkInCounters: '1-18',
      checkInDesks: [
        { cabin: 'economy', row: 'H', counters: '1-18' },
        { cabin: 'business', row: 'D', counters: '4-12' },
      ],
      bagDrop: ['F', 'G'],
    });
    const body = step(departing(flight, '11:30'), 'check-in').body.en;
    expect(body).toContain('Economy: Row H, counters 1-18');
    expect(body).toContain('Business: Row D, counters 4-12');
    expect(body).toContain('Bag drop: F, G');
  });
});
