/**
 * The title of a flight page and of a saved flight, from the flight alone. Safe for Client
 * Components: it imports neither the demo generator nor the content layer (round 3, E-03).
 */
import { formatFlightNumber, placeCity, type Flight } from '@/lib/flights';
import type { Translator } from '@/lib/i18n/translate';

/**
 * "MH 2610 to London" or "MH 2611 from London". Round 6 (review-3 9.1 item 8): the city in the
 * page language, as the board names it ("AK 6336 ke Pulau Pinang", not "ke Penang").
 */
export function flightTitle(flight: Flight, t: Translator): string {
  const number = formatFlightNumber(flight);
  return flight.direction === 'd'
    ? t('flightPages.detail.titleDeparture', { number, city: placeCity(flight.destination, t.lang) })
    : t('flightPages.detail.titleArrival', { number, city: placeCity(flight.origin, t.lang) });
}
