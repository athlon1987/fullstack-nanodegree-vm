/**
 * Time helpers. Every airport shows its own local time (all of Malaysia is UTC+8, no daylight
 * saving), always on a 24-hour clock.
 *
 * Nothing in this module reads the clock: every function takes the instant it should work with.
 * Server Components must never call `new Date()` (it fails the build under Cache Components);
 * Client Components get the current time from `useNow()` in `@/lib/hooks`.
 */
import type { Hours, Lang } from '@/content/types';

/** Timezone used when none is given: the single zone of the airport network. */
export const DEFAULT_TIMEZONE = 'Asia/Kuala_Lumpur';

/** Anything that names an instant: a `Date`, epoch milliseconds, or an ISO string with offset. */
export type Instant = Date | number | string;

/** Normalise an `Instant` to a `Date`. */
export function toDate(value: Instant): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Calendar and clock fields of an instant, as seen in a timezone. */
export interface ZonedParts {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  /** 0 to 23. */
  hour: number;
  minute: number;
  second: number;
  /** ISO weekday: 1 is Monday, 7 is Sunday. */
  weekday: number;
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Break an instant into calendar fields in the given timezone. */
export function zonedParts(value: Instant, timeZone: string = DEFAULT_TIMEZONE): ZonedParts {
  const fields: Record<string, string> = {};
  for (const part of partsFormatter(timeZone).formatToParts(toDate(value))) fields[part.type] = part.value;
  return {
    year: Number(fields.year),
    month: Number(fields.month),
    day: Number(fields.day),
    hour: Number(fields.hour),
    minute: Number(fields.minute),
    second: Number(fields.second),
    weekday: WEEKDAYS[fields.weekday] ?? 1,
  };
}

/** Offset of a timezone from UTC at an instant, in minutes (480 for Malaysia). */
export function offsetMinutes(value: Instant, timeZone: string = DEFAULT_TIMEZONE): number {
  const date = toDate(value);
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** Format an offset in minutes as `+08:00`. */
export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Local date key in a timezone: `2026-11-17`. */
export function dateKey(value: Instant, timeZone: string = DEFAULT_TIMEZONE): string {
  const parts = zonedParts(value, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** `2026-11-17` to `20261117` (used in flight ids). */
export function compactDateKey(key: string): string {
  return key.replaceAll('-', '');
}

/** `20261117` to `2026-11-17`. Returns `null` when the input is not eight digits or not a real date. */
export function expandDateKey(compact: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(compact);
  if (!match) return null;
  const key = `${match[1]}-${match[2]}-${match[3]}`;
  return isDateKey(key) ? key : null;
}

/** True for a real calendar date written `YYYY-MM-DD`. */
export function isDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]);
}

/** Move a date key by whole days: `shiftDateKey('2026-11-30', 1)` is `2026-12-01`. */
export function shiftDateKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * The instant at which a local wall-clock time occurs in a timezone.
 * `minutesOfDay` may exceed 1439 or be negative to roll into adjacent days.
 */
export function zonedDateTime(key: string, minutesOfDay: number, timeZone: string = DEFAULT_TIMEZONE): Date {
  const [year, month, day] = key.split('-').map(Number);
  const guess = Date.UTC(year, month - 1, day, 0, minutesOfDay);
  const offset = offsetMinutes(guess, timeZone);
  const adjusted = guess - offset * 60000;
  const check = offsetMinutes(adjusted, timeZone);
  return new Date(check === offset ? adjusted : guess - check * 60000);
}

/** ISO string with the timezone's offset: `2026-11-17T08:25:00+08:00`. */
export function toIsoWithOffset(value: Instant, timeZone: string = DEFAULT_TIMEZONE): string {
  const parts = zonedParts(value, timeZone);
  const offset = formatOffset(offsetMinutes(value, timeZone));
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}${offset}`;
}

/** Minutes since local midnight in a timezone (0 to 1439). */
export function minutesOfDay(value: Instant, timeZone: string = DEFAULT_TIMEZONE): number {
  const parts = zonedParts(value, timeZone);
  return parts.hour * 60 + parts.minute;
}

/** A new `Date` shifted by whole or fractional minutes. */
export function addMinutes(value: Instant, minutes: number): Date {
  return new Date(toDate(value).getTime() + minutes * 60000);
}

/** Whole minutes from `from` to `to` (negative when `to` is earlier), rounded toward zero. */
export function minutesBetween(from: Instant, to: Instant): number {
  return Math.trunc((toDate(to).getTime() - toDate(from).getTime()) / 60000);
}

const LOCALES: Record<Lang, string> = { en: 'en-MY', ms: 'ms-MY' };

/** BCP 47 locale used for Intl formatting in each interface language. */
export function intlLocale(lang: Lang): string {
  return LOCALES[lang];
}

/** 24-hour local time, `14:05`. */
export function formatTime(value: Instant, timeZone: string = DEFAULT_TIMEZONE): string {
  const parts = zonedParts(value, timeZone);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Date styles for `formatDate`. */
export type DateStyle = 'short' | 'medium' | 'long' | 'weekday';

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  weekday: { weekday: 'long', day: 'numeric', month: 'long' },
};

/**
 * Local date in words: `17 Nov`, `17 Nov 2026`, `17 November 2026` or `Tuesday, 17 November`
 * (`Selasa, 17 November` in Malay).
 */
export function formatDate(
  value: Instant,
  lang: Lang,
  style: DateStyle = 'medium',
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { ...DATE_OPTIONS[style], timeZone }).format(toDate(value));
}

/** Date and 24-hour time together: `17 Nov, 14:05`. */
export function formatDateTime(value: Instant, lang: Lang, timeZone: string = DEFAULT_TIMEZONE): string {
  return `${formatDate(value, lang, 'short', timeZone)}, ${formatTime(value, timeZone)}`;
}

/** Signed whole minutes until `target` as seen from `now` (negative when it has passed). */
export function relativeMinutes(target: Instant, now: Instant): number {
  return Math.round((toDate(target).getTime() - toDate(now).getTime()) / 60000);
}

/**
 * Relative time in words: `now`, `in 25 min`, `in 2 h 10 min`, `25 min ago`
 * (`sekarang`, `dalam 25 min`, `25 min lalu` in Malay).
 */
export function formatRelative(target: Instant, now: Instant, lang: Lang): string {
  const minutes = relativeMinutes(target, now);
  if (minutes === 0) return lang === 'ms' ? 'sekarang' : 'now';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  const hourUnit = lang === 'ms' ? 'j' : 'h';
  const amount = hours === 0 ? `${abs} min` : rest === 0 ? `${hours} ${hourUnit}` : `${hours} ${hourUnit} ${rest} min`;
  if (minutes > 0) return lang === 'ms' ? `dalam ${amount}` : `in ${amount}`;
  return lang === 'ms' ? `${amount} lalu` : `${amount} ago`;
}

/** The current moment as an airport sees it. */
export interface AirportNow {
  /** `14:05` */
  time: string;
  /** `2026-11-17` */
  dateKey: string;
  /** Minutes since local midnight. */
  minutesOfDay: number;
  /** ISO weekday, 1 is Monday. */
  weekday: number;
  /** `2026-11-17T14:05:00+08:00` */
  iso: string;
}

/** "Now in airport time": pass the current instant (from `useNow()` on the client). */
export function nowInAirport(now: Instant, timeZone: string = DEFAULT_TIMEZONE): AirportNow {
  const parts = zonedParts(now, timeZone);
  return {
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
    dateKey: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    minutesOfDay: parts.hour * 60 + parts.minute,
    weekday: parts.weekday,
    iso: toIsoWithOffset(now, timeZone),
  };
}

/** Short timezone label for an airport: `MYT (UTC+8)`. */
export function timezoneLabel(value: Instant, timeZone: string = DEFAULT_TIMEZONE): string {
  const offset = offsetMinutes(value, timeZone);
  const hours = offset / 60;
  const utc = `UTC${offset >= 0 ? '+' : '-'}${Number.isInteger(hours) ? Math.abs(hours) : formatOffset(offset).slice(1)}`;
  return timeZone === DEFAULT_TIMEZONE ? `MYT (${utc})` : utc;
}

/**
 * True when the viewer's timezone has a different offset from the airport's at `now`, in which
 * case the UI shows the airport timezone next to times. `viewerTimeZone` comes from
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client.
 */
export function timezoneDiffers(now: Instant, viewerTimeZone: string, airportTimeZone: string = DEFAULT_TIMEZONE): boolean {
  return offsetMinutes(now, viewerTimeZone) !== offsetMinutes(now, airportTimeZone);
}

function clockToMinutes(clock: string): number {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Whether something with the given hours is open at an instant.
 * Returns `undefined` when the hours are prose only (`kind: 'text'`) or missing: the UI then
 * shows the published text instead of an open/closed badge.
 */
export function isOpenAt(hours: Hours | undefined, at: Instant, timeZone: string = DEFAULT_TIMEZONE): boolean | undefined {
  if (!hours || hours.kind === 'text') return undefined;
  if (hours.kind === '24h') return true;
  const minute = minutesOfDay(at, timeZone);
  const open = clockToMinutes(hours.open);
  const close = clockToMinutes(hours.close);
  if (open === close) return true;
  return open < close ? minute >= open && minute < close : minute >= open || minute < close;
}
