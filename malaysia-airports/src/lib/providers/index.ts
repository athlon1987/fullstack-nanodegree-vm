/**
 * Provider registry. The UI asks for a provider here and never imports a concrete class, so a
 * live integration can be swapped in at one place.
 *
 * Every factory takes `now` (a `Date`, epoch milliseconds or ISO string): providers are
 * immutable snapshots of one instant and never read the clock themselves. On the client, `now`
 * comes from `useNow()`; in a route handler, from `new Date()` after the request has been read.
 */
import type { Instant } from '@/lib/time';
import { DemoFlightProvider } from './demo-flights';
import type { ProviderMode } from './types';

export * from './types';
export {
  DemoFlightProvider,
  DEMO_REFRESH_SECONDS,
  boardWindow,
  buildDemoTimetable,
  createDemoProvider,
  demoFlightsForDate,
  type DemoTimetableEntry,
} from './demo-flights';
export {
  DemoParkingAvailabilityProvider,
  DemoWaitTimeProvider,
  OPS_SERVICE_IDS,
  demoBusyness,
  opsServicesFor,
  opsStatus,
  type OpsServiceId,
  type OpsState,
  type OpsStatusLine,
} from './demo-operations';
export { OfficialFlightProvider, OFFICIAL_FLIGHTS_ENDPOINT, toOfficialParams } from './official-flights';
export { getParkingAvailabilityProvider, getWaitTimeProvider } from './operations';
export { DEMO_AIRPORT_SLUGS, hasDemoRoutes } from './demo-routes';

/** Which mode each provider runs in. Reported by `/api/health`. */
export const PROVIDER_MODES: Readonly<Record<'flights' | 'waitTimes' | 'parkingAvailability', ProviderMode>> = {
  flights: 'demo',
  waitTimes: 'demo',
  parkingAvailability: 'demo',
};

/** The flight provider for an instant. Demo in this prototype; also offers `*Sync` methods. */
export function getFlightProvider(now: Instant): DemoFlightProvider {
  return new DemoFlightProvider(now);
}
