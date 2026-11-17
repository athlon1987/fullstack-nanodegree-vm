import { describe, expect, it } from 'vitest';
import { getAirportContent } from '@/content';
import type { AirportContent, GuideNote } from '@/content/types';
import { getT } from '@/lib/i18n';
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
    expect(ids(steps)).toEqual(['terminal', 'travel', 'arrive', 'check-in', 'security', 'gate', 'food', 'boarding']);
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
    expect(checkIn.body.ms).toContain('Barisan H, kaunter 1-18');
    expect(checkIn.notes.map((note) => note.id)).toEqual(['kul-t1-check-in-level', 'kul-t1-mh-check-in-rows']);
    expect(checkIn.notes.every((note) => note.provenance === 'official' && note.sources.length > 0)).toBe(true);

    const generic = step(buildJourney({ flight: international(), mode: 'departing', airportContent: kul, now: at('08:00') }), 'check-in');
    expect(generic.provenance).toBe('estimated');
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
    expect(cancelled[0].body.en).toMatch(/Contact your airline/);
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
    expect(ids(steps)).toEqual(['status', 'parking', 'wait', 'expect']);
    expect(step(steps, 'status').provenance).toBe('demo');
    expect(step(steps, 'expect')).toMatchObject({ time: '2026-11-17T18:05:00+08:00', provenance: 'estimated' });
    expect(step(steps, 'wait').notes.map((note) => note.id)).toEqual(['kul-t1-arrival-hall-level']);
    expect(step(steps, 'parking').actions[0].href).toBe('/kul/parking');
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
