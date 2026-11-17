/**
 * Pure helpers for the parking page. Client-safe.
 *
 * - The calculator takes dates and times as typed into native date and time inputs (airport
 *   time) and turns them into a stay in minutes for `calculateParking`.
 * - When a car park's rates are not verified but its daily maximum is published, `dailyMaxCeiling`
 *   gives the most a stay can cost if that maximum caps each 24 hours from entry. The UI states
 *   that assumption and labels the figure as an estimate; it is never shown as the fee.
 */
import type { CarPark } from '@/content/types';
import { dateKey, formatTime, zonedDateTime } from '@/lib/time';

const MINUTES_PER_DAY = 1440;

/** `HH:MM` to minutes after midnight, or null when it is not a valid 24-hour time. */
export function parseClock(value: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

const isDay = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** The instant of a local date and time at the airport, or null when either part is missing or invalid. */
export function localInstant(day: string, time: string, timeZone: string): Date | null {
  const minutes = parseClock(time);
  if (!isDay(day) || minutes === null) return null;
  const instant = zonedDateTime(day, minutes, timeZone);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** A local date and time at the airport, as native inputs expect them. */
export interface LocalStamp {
  date: string;
  time: string;
}

/** The stay in minutes between two local stamps. Null when incomplete; negative or zero when reversed. */
export function stayMinutes(entry: LocalStamp, exit: LocalStamp, timeZone: string): number | null {
  const start = localInstant(entry.date, entry.time, timeZone);
  const end = localInstant(exit.date, exit.time, timeZone);
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/** A local stamp `minutes` after another. Null when the start is incomplete. */
export function shiftStamp(start: LocalStamp, minutes: number, timeZone: string): LocalStamp | null {
  const instant = localInstant(start.date, start.time, timeZone);
  if (!instant) return null;
  const later = new Date(instant.getTime() + minutes * 60000);
  return { date: dateKey(later, timeZone), time: formatTime(later, timeZone) };
}

/** A sensible default arrival: the next quarter hour after `now`, airport time. */
export function defaultArrival(now: number, timeZone: string): LocalStamp {
  const step = 15 * 60000;
  const next = new Date(Math.ceil((now + 1) / step) * step);
  return { date: dateKey(next, timeZone), time: formatTime(next, timeZone) };
}

/** The most a stay can cost under a published daily maximum, if it caps each 24 hours from entry. */
export interface DailyMaxCeiling {
  /** Started 24-hour periods. */
  periods: number;
  /** Periods multiplied by the daily maximum, in MYR. */
  amount: number;
  dailyMax: number;
}

/**
 * Upper bound for a stay at a car park whose daily maximum is published. Undefined when there is
 * no daily maximum or the stay is not positive.
 */
export function dailyMaxCeiling(carPark: Pick<CarPark, 'dailyMax'>, minutes: number): DailyMaxCeiling | undefined {
  if (carPark.dailyMax === undefined || !Number.isFinite(minutes) || minutes <= 0) return undefined;
  const periods = Math.ceil(minutes / MINUTES_PER_DAY);
  return { periods, amount: Math.round(periods * carPark.dailyMax * 100) / 100, dailyMax: carPark.dailyMax };
}

/** Quick stay lengths offered as buttons, in minutes. */
export const QUICK_STAYS = [
  { minutes: 180, unit: 'hours', count: 3 },
  { minutes: 1440, unit: 'days', count: 1 },
  { minutes: 3 * 1440, unit: 'days', count: 3 },
  { minutes: 7 * 1440, unit: 'days', count: 7 },
] as const;
