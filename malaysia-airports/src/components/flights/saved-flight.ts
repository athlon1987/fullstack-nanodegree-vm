/**
 * The record My journey keeps for a saved flight. Only identifiers and a short route are
 * stored; status is always looked up fresh from the provider.
 */
import type { Flight } from '@/lib/flights';
import type { Translator } from '@/lib/i18n/translate';
import type { SavedFlight } from '@/lib/stores';

export function toSavedFlight(flight: Flight, t: Translator): Omit<SavedFlight, 'savedAt'> {
  return {
    id: flight.id,
    airport: flight.airport,
    number: flight.number,
    direction: flight.direction,
    date: flight.date,
    route: t('flights.detail.route', { origin: flight.origin.city, destination: flight.destination.city }),
    mode: flight.direction === 'd' ? 'departing' : 'arriving',
  };
}
