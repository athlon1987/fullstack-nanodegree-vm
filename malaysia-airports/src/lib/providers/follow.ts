/**
 * Following a flight (BR-04, exec-commerce-13, ux-frequent-03): the seam between the "Follow
 * this flight" control and whatever delivers the updates.
 *
 * Today two channels exist, and the UI says exactly what each delivers:
 *  - `browser`: notifications shown by an open page of this site (`flight-alerts.ts`). Nothing
 *    arrives when the browser is closed.
 *  - `email`: a labelled DEMONSTRATION. The address is kept on this device only and nothing is
 *    sent: e-mail and push delivery to a closed browser need a delivery service, a server-side
 *    flight watcher and a data-protection review (OOS-10). A live implementation replaces
 *    `DemoEmailFollowChannel` behind the same interface and reports `mode: 'live'`.
 */
import { check, createStore, validator } from '@/lib/storage';

export type FollowChannelId = 'browser' | 'email' | 'push';

export interface FollowResult {
  ok: boolean;
  /** `invalid-target` for a malformed address; `unsupported` when the channel cannot work here. */
  error?: 'invalid-target' | 'unsupported';
}

/** One way of receiving updates about a flight. */
export interface FollowChannel {
  id: FollowChannelId;
  /** `demo`: nothing is delivered. `live`: delivered by a real service. */
  mode: 'demo' | 'live';
  /** Whether the flight is followed on this channel (and with which target). */
  target(flightId: string): string | null;
  follow(flightId: string, target: string): Promise<FollowResult>;
  unfollow(flightId: string): Promise<void>;
}

/** A practical e-mail check: something@domain.tld, no spaces, at most 254 characters. */
export function isEmailAddress(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

/** Demo e-mail follows on this device (`ma:flight-follow-email:v1`): flight id to address. */
export const emailFollowStore = createStore<Record<string, string>>({
  name: 'flight-follow-email',
  version: 1,
  // zod-free validation (round 2, E-03): zod left the JavaScript of every page.
  schema: validator(check.record(check.string({ min: 5, max: 40 }), check.string({ max: 254 }))),
  defaultValue: {},
});

/** The demonstration e-mail channel: remembers the choice on this device, sends nothing. */
export class DemoEmailFollowChannel implements FollowChannel {
  readonly id = 'email' as const;
  readonly mode = 'demo' as const;

  target(flightId: string): string | null {
    return emailFollowStore.get()[flightId] ?? null;
  }

  async follow(flightId: string, target: string): Promise<FollowResult> {
    if (!isEmailAddress(target)) return { ok: false, error: 'invalid-target' };
    emailFollowStore.set((current) => {
      const next = { ...current, [flightId]: target.trim() };
      // Keep at most 20 flights, newest last.
      const keys = Object.keys(next);
      return keys.length > 20 ? Object.fromEntries(keys.slice(-20).map((key) => [key, next[key]])) : next;
    });
    return { ok: true };
  }

  async unfollow(flightId: string): Promise<void> {
    emailFollowStore.set((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== flightId)));
  }
}

/** The e-mail channel in use: the demonstration until a delivery service is connected (OOS-10). */
export const emailFollowChannel: FollowChannel = new DemoEmailFollowChannel();
