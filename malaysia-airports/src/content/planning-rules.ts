/**
 * Planning rules (D-13): numbers other parts of the site compute with, kept in the content layer
 * with their provenance and sources so one edit updates every surface. A small module with no
 * other content in it, so client code (the transit planner) can import it cheaply.
 */
import { lt } from './values';
import type { LocalizedText, Provenance } from './types';

/** How early to be at the airport, in minutes before departure. Same rule as the departing guide's "Plan when to arrive" step. */
export const ARRIVAL_TIME_RULE = {
  id: 'arrival-time-rule',
  minutesBefore: { international: 180, domestic: 120 },
  /** Shown with the time it produces. */
  text: lt(
    'About 3 hours before an international flight and 2 hours before a domestic flight. Your airline sets the actual check-in deadlines.',
    'Kira-kira 3 jam sebelum penerbangan antarabangsa dan 2 jam sebelum penerbangan domestik. Syarikat penerbangan menetapkan had masa daftar masuk sebenar.',
  ),
  provenance: 'estimated',
  sources: ['prototype-method'],
} as const satisfies { id: string; minutesBefore: Record<'international' | 'domestic', number>; text: LocalizedText; provenance: Provenance; sources: readonly string[] };

/**
 * The transit planner's connection assumptions, as [shortest, longest] minutes. Our own planning
 * figures, never airport data: always shown as Estimated with `prototype-method` as the source.
 */
export const TRANSIT_ASSUMPTIONS = {
  id: 'transit-assumptions',
  minutes: {
    leaveAircraft: [10, 25],
    transfer: [15, 40],
    immigration: [15, 60],
    bags: [15, 45],
    bagsMaybe: [0, 45],
    customs: [5, 15],
    travel: [15, 35],
    toDepartures: [5, 15],
    checkIn: [10, 30],
    controls: [15, 45],
    controlsDomestic: [10, 25],
    gate: [10, 25],
    /** Check-in usually closes this long before departure. */
    cutoffInternational: 60,
    cutoffDomestic: 45,
    /** Gates usually close this long before departure. */
    gateClose: 20,
  },
  provenance: 'estimated',
  sources: ['prototype-method'],
} as const satisfies { id: string; minutes: Record<string, number | readonly [number, number]>; provenance: Provenance; sources: readonly string[] };
