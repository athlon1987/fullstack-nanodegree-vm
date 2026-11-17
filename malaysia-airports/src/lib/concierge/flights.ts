/**
 * Adapts the demo flight provider to the small interface the engine needs. The engine never
 * creates a provider itself (that would read the clock): the caller passes one built for `now`.
 */
import type { DemoFlightProvider } from '@/lib/providers';
import type { ConciergeFlightSource } from './types';

export function flightSourceFromProvider(provider: DemoFlightProvider): ConciergeFlightSource {
  return {
    generatedAt: provider.meta().generatedAt,
    get: (id, airport) => provider.getFlightSync(id, airport),
    find: (designator, airport) =>
      provider
        .searchSync({ q: designator, airport, limit: 6 })
        .filter((flight) => flight.number.toUpperCase() === designator.toUpperCase()),
  };
}
