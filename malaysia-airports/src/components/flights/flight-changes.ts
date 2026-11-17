/**
 * What changed about a flight between two refreshes: status, expected time, gate or belt.
 * Used for the polite announcements on the board (saved flights only) and for demo alerts.
 * Pure: the caller keeps the previous snapshots.
 */
import type { Lang } from '@/content/types';
import { flightStatusMeta, formatFlightNumber, remotePlace, type Flight, type FlightStatus } from '@/lib/flights';
import { formatList } from '@/lib/format';
import type { Translator } from '@/lib/i18n/translate';
import { formatTime } from '@/lib/time';

/** The parts of a flight a passenger would want to hear about. */
export interface FlightSnapshot {
  status: FlightStatus;
  estimated: string;
  gate?: string;
  belt?: string;
}

export type FlightChange =
  | { kind: 'status'; from: FlightStatus; to: FlightStatus }
  | { kind: 'time'; from: string; to: string }
  | { kind: 'gate'; from?: string; to: string }
  | { kind: 'belt'; from?: string; to: string };

export function snapshotOf(flight: Flight): FlightSnapshot {
  return { status: flight.status, estimated: flight.estimated, gate: flight.gate, belt: flight.belt };
}

/** Changes from one snapshot to the next. A gate or belt that disappears is not reported. */
export function diffSnapshot(previous: FlightSnapshot, next: FlightSnapshot): FlightChange[] {
  const changes: FlightChange[] = [];
  if (previous.status !== next.status) changes.push({ kind: 'status', from: previous.status, to: next.status });
  if (Date.parse(previous.estimated) !== Date.parse(next.estimated)) changes.push({ kind: 'time', from: previous.estimated, to: next.estimated });
  if (next.gate && next.gate !== previous.gate) changes.push({ kind: 'gate', from: previous.gate, to: next.gate });
  if (next.belt && next.belt !== previous.belt) changes.push({ kind: 'belt', from: previous.belt, to: next.belt });
  return changes;
}

/** Flights whose snapshot changed since `previous`. Flights not seen before are not reported. */
export function collectChanges(previous: ReadonlyMap<string, FlightSnapshot>, flights: readonly Flight[]): { flight: Flight; changes: FlightChange[] }[] {
  const result: { flight: Flight; changes: FlightChange[] }[] = [];
  for (const flight of flights) {
    const before = previous.get(flight.id);
    if (!before) continue;
    const changes = diffSnapshot(before, snapshotOf(flight));
    if (changes.length > 0) result.push({ flight, changes });
  }
  return result;
}

/** One change in words: "now Boarding", "new time 14:35", "gate C12". */
export function describeChange(change: FlightChange, t: Translator, timeZone?: string): string {
  switch (change.kind) {
    case 'status':
      return t('flightPages.changes.status', { status: t(flightStatusMeta(change.to).i18nKey) });
    case 'time':
      return t('flightPages.changes.time', { time: formatTime(change.to, timeZone) });
    case 'gate':
      return t('flightPages.changes.gate', { gate: change.to });
    case 'belt':
      return t('flightPages.changes.belt', { belt: change.to });
  }
}

/** A sentence for a flight's changes: "MH 2610 to London: now Boarding and gate C12." */
export function describeFlightChanges(flight: Flight, changes: readonly FlightChange[], t: Translator, lang: Lang, timeZone?: string): string {
  const parts = changes.map((change) => describeChange(change, t, timeZone));
  const vars = { number: formatFlightNumber(flight), city: remotePlace(flight).city, changes: formatList(parts, lang) };
  return flight.direction === 'd' ? t('flightPages.changes.summaryDeparture', vars) : t('flightPages.changes.summaryArrival', vars);
}
