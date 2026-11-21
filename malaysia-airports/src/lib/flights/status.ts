/**
 * The flight status model: labels in both languages, a tone for colour, and an icon key.
 * Status is never shown by colour alone: always render the label and the icon together.
 */
import type { Lang, LocalizedText } from '@/content/types';
import { lt, pick } from '@/content/values';
import type { TKey } from '@/lib/i18n/translate';
import type { FlightDirection, FlightStatus } from './types';

/**
 * How a status should feel:
 *  - `neutral`: nothing to do yet;
 *  - `positive`: things are moving as planned;
 *  - `warning`: act soon, or something has changed;
 *  - `critical`: the flight will not operate as planned;
 *  - `muted`: the flight is over.
 */
export type StatusTone = 'neutral' | 'positive' | 'warning' | 'critical' | 'muted';

/** Presentation data for one status. */
export interface FlightStatusMeta {
  status: FlightStatus;
  /** Human label in both languages (the same text as `i18nKey` in the dictionaries). */
  label: LocalizedText;
  /** Dictionary key for the label, for components that already hold a translator. */
  i18nKey: TKey;
  tone: StatusTone;
  /** Semantic icon key in lucide-style kebab case; `src/components/ui/icon.tsx` maps it. */
  icon: string;
  /** Which boards the status can appear on. */
  directions: readonly FlightDirection[];
  /** True once nothing more will happen to the flight. */
  final: boolean;
}

const BOTH: readonly FlightDirection[] = ['d', 'a'];
const DEP: readonly FlightDirection[] = ['d'];
const ARR: readonly FlightDirection[] = ['a'];

/** Presentation data for every status, keyed by status. */
export const FLIGHT_STATUS_META: Record<FlightStatus, FlightStatusMeta> = {
  scheduled: { status: 'scheduled', label: lt('Scheduled', 'Mengikut jadual'), i18nKey: 'flights.statuses.scheduled', tone: 'neutral', icon: 'clock', directions: BOTH, final: false },
  'check-in-open': { status: 'check-in-open', label: lt('Check-in open', 'Daftar masuk dibuka'), i18nKey: 'flights.statuses.checkInOpen', tone: 'positive', icon: 'ticket-check', directions: DEP, final: false },
  'check-in-closed': { status: 'check-in-closed', label: lt('Check-in closed', 'Daftar masuk ditutup'), i18nKey: 'flights.statuses.checkInClosed', tone: 'neutral', icon: 'ticket-x', directions: DEP, final: false },
  boarding: { status: 'boarding', label: lt('Boarding', 'Menaiki pesawat'), i18nKey: 'flights.statuses.boarding', tone: 'positive', icon: 'door-open', directions: DEP, final: false },
  'final-call': { status: 'final-call', label: lt('Final call', 'Panggilan terakhir'), i18nKey: 'flights.statuses.finalCall', tone: 'warning', icon: 'megaphone', directions: DEP, final: false },
  'gate-closed': { status: 'gate-closed', label: lt('Gate closed', 'Pintu ditutup'), i18nKey: 'flights.statuses.gateClosed', tone: 'muted', icon: 'door-closed', directions: DEP, final: false },
  departed: { status: 'departed', label: lt('Departed', 'Telah berlepas'), i18nKey: 'flights.statuses.departed', tone: 'muted', icon: 'plane-takeoff', directions: DEP, final: true },
  delayed: { status: 'delayed', label: lt('Delayed', 'Lewat'), i18nKey: 'flights.statuses.delayed', tone: 'warning', icon: 'clock-alert', directions: BOTH, final: false },
  cancelled: { status: 'cancelled', label: lt('Cancelled', 'Dibatalkan'), i18nKey: 'flights.statuses.cancelled', tone: 'critical', icon: 'circle-x', directions: BOTH, final: true },
  'en-route': { status: 'en-route', label: lt('En route', 'Dalam penerbangan'), i18nKey: 'flights.statuses.enRoute', tone: 'neutral', icon: 'plane', directions: ARR, final: false },
  landed: { status: 'landed', label: lt('Landed', 'Telah mendarat'), i18nKey: 'flights.statuses.landed', tone: 'positive', icon: 'plane-landing', directions: ARR, final: false },
  'at-gate': { status: 'at-gate', label: lt('At gate', 'Di pintu'), i18nKey: 'flights.statuses.atGate', tone: 'positive', icon: 'map-pin-check', directions: ARR, final: false },
  baggage: { status: 'baggage', label: lt('Bags on belt', 'Bagasi di karusel'), i18nKey: 'flights.statuses.baggage', tone: 'positive', icon: 'luggage', directions: ARR, final: false },
  completed: { status: 'completed', label: lt('Completed', 'Selesai'), i18nKey: 'flights.statuses.completed', tone: 'muted', icon: 'circle-check', directions: ARR, final: true },
};

/** Presentation data for a status. */
export function flightStatusMeta(status: FlightStatus): FlightStatusMeta {
  return FLIGHT_STATUS_META[status];
}

/** The label of a status in a language: `flightStatusLabel('boarding', 'ms')` is "Menaiki pesawat". */
export function flightStatusLabel(status: FlightStatus, lang: Lang): string {
  return pick(FLIGHT_STATUS_META[status].label, lang);
}

/** Statuses that can appear on a departures or arrivals board, for the status filter. */
export function statusesForDirection(direction: FlightDirection): FlightStatus[] {
  return Object.values(FLIGHT_STATUS_META)
    .filter((meta) => meta.directions.includes(direction))
    .map((meta) => meta.status);
}

/** True when the flight is over or will not operate (departed, completed, cancelled). */
export function isFinalStatus(status: FlightStatus): boolean {
  return FLIGHT_STATUS_META[status].final;
}
