import { beforeAll, describe, expect, it } from 'vitest';
import { FEATURED_AIRPORT_SLUGS } from '@/content/airports';
import { hasDemoRoutes } from '@/lib/providers/demo-routes';
import { serveFlightFeed } from '@/lib/providers/feed-server';
import type { FeedDay } from '@/lib/providers/resilient';
import { dateKey } from '@/lib/time';
import { answerQuestion } from './engine';
import { flightBoardsFor, flightSourceFromDays, groupBoards, unavailableFlightSource } from './flights';
import { serverFlightSource } from './flights.server';
import { buildConciergeKnowledge } from './knowledge.server';
import type { ConciergeKnowledge } from './types';

/** A fixed instant: the engine never reads the clock. */
const NOW = Date.parse('2026-11-17T10:00:00+08:00');
const TODAY = '2026-11-17';

let en: ConciergeKnowledge;
let kul: FeedDay;

beforeAll(async () => {
  en = buildConciergeKnowledge('en');
  const served = await serveFlightFeed({ airport: 'kul', date: TODAY, direction: 'd' }, String(NOW), new Date(NOW));
  expect(served.status).toBe(200);
  kul = served.body as FeedDay;
});

describe('concierge flights from the flight feed (round 5, B-09)', () => {
  it('asks the feed only for the boards a question can need', () => {
    expect(dateKey(NOW)).toBe(TODAY);
    // No flight in the question and none saved: no request at all.
    expect(flightBoardsFor('Where can I pray at KLIA?', en, {}, NOW, hasDemoRoutes)).toEqual([]);
    // A flight number: today's departures and arrivals at the six airports the generator searched.
    const boards = flightBoardsFor('Is MH2610 delayed?', en, {}, NOW, hasDemoRoutes);
    expect(new Set(boards.map((board) => board.airport))).toEqual(new Set(FEATURED_AIRPORT_SLUGS));
    expect(boards.every((board) => board.date === TODAY)).toBe(true);
    expect(groupBoards(boards).map((group) => group[0].direction).sort()).toEqual(['a', 'd']);
    // The context airport is searched too, and only airports with a board.
    expect(flightBoardsFor('Is AK6000 on time?', en, { airport: 'tgg' }, NOW, hasDemoRoutes).some((board) => board.airport === 'tgg')).toBe(true);
    expect(flightBoardsFor('Is AK6000 on time?', en, { airport: 'lwy' }, NOW, (airport) => airport === 'kul').map((board) => board.airport)).toEqual(['kul', 'kul']);
    // The saved flight: its own board (date and direction from the id, airport from the journey).
    expect(flightBoardsFor('Which gate?', en, { flightId: 'mh2610-20261118-a' }, NOW, hasDemoRoutes, 'pen')).toEqual([{ airport: 'pen', date: '2026-11-18', direction: 'a' }]);
  });

  it('answers with the flight the board shows, labelled as demonstration data', () => {
    const flight = kul.flights[4];
    const designator = flight.number.replace(/\s+/g, '');
    const answer = answerQuestion({ question: `Is ${designator} delayed?`, lang: 'en', context: { airport: 'kul' } }, { knowledge: en, now: NOW, flights: flightSourceFromDays([kul], NOW) });
    const card = answer.cards.find((item) => item.type === 'flight');
    expect(card && 'number' in card ? String(card.number).replace(/\s+/g, '') : undefined).toBe(designator);
    expect(answer.demo).toBe(true);
    expect(answer.demoGeneratedAt).toBe(kul.meta.generatedAt);
    expect(flightSourceFromDays([kul], NOW).get(flight.id)).toEqual(flight);
    expect(flightSourceFromDays([kul], NOW).get(flight.id, 'kul')).toEqual(flight);
  });

  it('the server reads the same feed the pages read', async () => {
    const flight = kul.flights[2];
    const designator = flight.number.replace(/\s+/g, '');
    const source = await serverFlightSource(`Status of ${designator}?`, en, { airport: 'kul' }, NOW);
    expect(source?.unavailable).toBeFalsy();
    expect(source?.find(designator, 'kul')[0]).toEqual(flight);
    expect(await serverFlightSource('Where are the prayer rooms?', en, {}, NOW)).toBeNull();
  });

  it('says flight information could not be loaded when the feed is unreachable, in both languages', () => {
    const designator = kul.flights[1].number.replace(/\s+/g, '');
    for (const lang of ['en', 'ms'] as const) {
      const knowledge = lang === 'en' ? en : buildConciergeKnowledge('ms');
      const answer = answerQuestion({ question: lang === 'en' ? `Status of ${designator}?` : `Apakah status ${designator}?`, lang, context: {} }, { knowledge, now: NOW, flights: unavailableFlightSource() });
      expect(answer.text).toMatch(lang === 'en' ? /Flight information could not be loaded just now/ : /Maklumat penerbangan tidak dapat dimuatkan sekarang/);
      expect(answer.text).not.toMatch(/could not find|tidak menemui/);
      expect(answer.cards.some((card) => card.type === 'flight')).toBe(false);
      // A saved flight whose board could not be loaded is named, not silently dropped.
      const saved = answerQuestion({ question: lang === 'en' ? 'What is the status of my flight?' : 'Apakah status penerbangan saya?', lang, context: { flightId: 'mh2610-20261117-d', airport: 'kul' } }, { knowledge, now: NOW, flights: unavailableFlightSource() });
      expect(saved.text + saved.limits.join(' ')).toMatch(/MH 2610/);
    }
    // Found elsewhere, missing here: still "not found" when the boards were searched.
    const found = answerQuestion({ question: 'Status of ZZ9999?', lang: 'en', context: {} }, { knowledge: en, now: NOW, flights: flightSourceFromDays([kul], NOW) });
    expect(found.text).toMatch(/could not find ZZ 9999 on the demonstration boards/);
  });
});
