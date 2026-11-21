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
import { calculateParking } from '@/lib/parking';
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

/* -------------------------------------------------------------------------------------------
 * Price matrix (C-01): what a stay of 1, 3 or 7 days can cost at each car park
 * ---------------------------------------------------------------------------------------- */

/** Stay lengths in the price matrix, in days. */
export const MATRIX_DAYS = [1, 3, 7] as const;

/**
 * One cell of the price matrix:
 * - `estimate`: worked out from a published tariff;
 * - `ceiling`: the most the stay can cost under a published daily maximum (hourly rates not verified);
 * - `reported`: rates not verified; the range the sources' daily maximums give, never the fee;
 * - `none`: no figure we can stand behind.
 */
export type PriceCell =
  | { kind: 'estimate'; amount: number }
  | { kind: 'ceiling'; amount: number }
  | { kind: 'reported'; min: number; max: number }
  | { kind: 'none' };

type PricedCarPark = Pick<CarPark, 'rates' | 'rateStatus' | 'dailyMax' | 'graceMinutes'> & { reported?: readonly { amount: number }[] };

const money = (value: number): number => Math.round(value * 100) / 100;

/** The matrix cell for a stay of `days` days. Pure: it never reads the clock. */
export function priceCell(carPark: PricedCarPark, days: number): PriceCell {
  const minutes = days * MINUTES_PER_DAY;
  const result = calculateParking(carPark, minutes);
  if (!result.unavailable) return { kind: 'estimate', amount: result.total };
  const ceiling = dailyMaxCeiling(carPark, minutes);
  if (ceiling) return { kind: 'ceiling', amount: ceiling.amount };
  const amounts = (carPark.reported ?? []).map((figure) => figure.amount);
  if (amounts.length > 0) return { kind: 'reported', min: money(Math.min(...amounts) * days), max: money(Math.max(...amounts) * days) };
  return { kind: 'none' };
}

/** A row of the matrix: one cell per entry of `MATRIX_DAYS`. */
export function priceRow(carPark: PricedCarPark): PriceCell[] {
  return MATRIX_DAYS.map((days) => priceCell(carPark, days));
}

/**
 * A local stamp from an ISO instant in a link (`?from=2026-11-21T10:00:00+08:00`), in airport
 * time. Null when the value is missing or not a date. Journey links carry these (B-13).
 */
export function stampFromIso(value: string | null | undefined, timeZone: string): LocalStamp | null {
  if (!value) return null;
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return null;
  return { date: dateKey(instant, timeZone), time: formatTime(instant, timeZone) };
}
