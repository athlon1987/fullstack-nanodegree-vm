/**
 * The operations half of the provider registry (queue estimates and car park availability),
 * apart from `index.ts` so a Client Component that needs only these does not also load the demo
 * flight generator (round 3, E-03). `index.ts` re-exports both.
 */
import type { Instant } from '@/lib/time';
import { DemoParkingAvailabilityProvider, DemoWaitTimeProvider } from './demo-operations';

/** The queue-estimate provider for an instant (demo). */
export function getWaitTimeProvider(now: Instant): DemoWaitTimeProvider {
  return new DemoWaitTimeProvider(now);
}

/** The car park availability provider for an instant (demo). */
export function getParkingAvailabilityProvider(now: Instant): DemoParkingAvailabilityProvider {
  return new DemoParkingAvailabilityProvider(now);
}
