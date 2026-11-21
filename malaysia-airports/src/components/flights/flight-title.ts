/**
 * The title of a flight page and of a saved flight, from the flight alone. Safe for Client
 * Components: it imports neither the demo generator nor the content layer (round 3, E-03).
 */
import { formatFlightNumber, type Flight } from '@/lib/flights';
import type { Translator } from '@/lib/i18n/translate';

/** "MH 2610 to London" or "MH 2611 from London". */
export function flightTitle(flight: Flight, t: Translator): string {
  const number = formatFlightNumber(flight);
  return flight.direction === 'd'
    ? t('flightPages.detail.titleDeparture', { number, city: flight.destination.city })
    : t('flightPages.detail.titleArrival', { number, city: flight.origin.city });
}
