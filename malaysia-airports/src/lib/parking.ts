/**
 * Parking fee calculator. Pure: give it a car park and a length of stay in minutes.
 *
 * How a tariff is read
 *  - A stay is charged in 24-hour periods counted from entry.
 *  - Within each period the `rates` bands apply to the minutes parked in that period:
 *    a `flat` band charges once when the stay enters it; a `per-block` band charges for every
 *    started block of `blockMinutes`.
 *  - `dailyMax`, when published, caps each 24-hour period.
 *  - `graceMinutes`, when published, makes very short stays free.
 *
 * Example: "RM 4 for the first hour, RM 3 for each further hour, RM 46 a day" is
 *   rates: [{ fromMinute: 0, toMinute: 60, kind: 'flat', amount: 4 },
 *           { fromMinute: 60, kind: 'per-block', amount: 3, blockMinutes: 60 }], dailyMax: 46
 *
 * The result is an ESTIMATE from published rates (`provenance: 'estimated'` in the UI). When a
 * car park's rates are not verified the function says so instead of guessing.
 */
import { lt } from '@/content/values';
import type { CarPark, LocalizedText, RateBand, Source } from '@/content/types';
import { formatCurrency, formatDuration } from './format';

/** One line of the fee breakdown. */
export interface ParkingBreakdownLine {
  label: LocalizedText;
  /** Minutes this line covers. */
  minutes: number;
  /** Charge for the line in MYR, after any cap. */
  amount: number;
  /** True when the daily maximum replaced a higher band total. */
  capped: boolean;
}

/** A calculated fee. */
export interface ParkingEstimate {
  unavailable?: false;
  /** Total in MYR. */
  total: number;
  breakdown: ParkingBreakdownLine[];
  /** True when the daily maximum was applied to at least one period. */
  capped: boolean;
  currency: 'MYR';
  /** The stay that was priced, in minutes. */
  minutes: number;
}

/** Why a fee cannot be calculated. */
export type ParkingUnavailableReason = 'rates-not-verified' | 'invalid-duration';

/** No fee can be calculated. The UI links to the official parking page instead. */
export interface ParkingUnavailable {
  unavailable: true;
  reason: ParkingUnavailableReason;
}

/** Result of `calculateParking`. Narrow with `result.unavailable`. */
export type ParkingResult = ParkingEstimate | ParkingUnavailable;

const MINUTES_PER_DAY = 1440;
const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/** Charge for the first `minutes` of one 24-hour period under a set of bands, before any cap. */
export function chargeForPeriod(rates: readonly RateBand[], minutes: number): number {
  let total = 0;
  for (const band of [...rates].sort((a, b) => a.fromMinute - b.fromMinute)) {
    if (minutes <= band.fromMinute) continue;
    if (band.kind === 'flat') {
      total += band.amount;
      continue;
    }
    const end = Math.min(minutes, band.toMinute ?? Infinity);
    const blocks = Math.ceil((end - band.fromMinute) / (band.blockMinutes ?? 60));
    total += blocks * band.amount;
  }
  return roundMoney(total);
}

/**
 * Estimate the fee for a stay.
 *
 * Returns `{ unavailable: true, reason: 'rates-not-verified' }` when the car park has no
 * published tariff, and `reason: 'invalid-duration'` for a negative or non-finite stay.
 *
 * @example
 * const result = calculateParking(carPark, 150);
 * if (!result.unavailable) formatCurrency(result.total);
 */
export function calculateParking(carPark: Pick<CarPark, 'rates' | 'rateStatus' | 'dailyMax' | 'graceMinutes'>, minutes: number): ParkingResult {
  if (carPark.rateStatus !== 'published' || carPark.rates.length === 0) {
    return { unavailable: true, reason: 'rates-not-verified' };
  }
  if (!Number.isFinite(minutes) || minutes < 0) {
    return { unavailable: true, reason: 'invalid-duration' };
  }
  const stay = Math.ceil(minutes);

  if (stay === 0 || (carPark.graceMinutes !== undefined && stay <= carPark.graceMinutes)) {
    const breakdown: ParkingBreakdownLine[] =
      stay === 0 ? [] : [{ label: lt('Free grace period', 'Tempoh percuma'), minutes: stay, amount: 0, capped: false }];
    return { total: 0, breakdown, capped: false, currency: 'MYR', minutes: stay };
  }

  const price = (periodMinutes: number): { amount: number; capped: boolean } => {
    const raw = chargeForPeriod(carPark.rates, periodMinutes);
    return carPark.dailyMax !== undefined && raw > carPark.dailyMax
      ? { amount: carPark.dailyMax, capped: true }
      : { amount: raw, capped: false };
  };

  const fullDays = Math.floor(stay / MINUTES_PER_DAY);
  const remainder = stay % MINUTES_PER_DAY;
  const breakdown: ParkingBreakdownLine[] = [];

  if (fullDays > 0) {
    const day = price(MINUTES_PER_DAY);
    breakdown.push({
      label: fullDays === 1 ? lt('First 24 hours', '24 jam pertama') : lt(`${fullDays} full days`, `${fullDays} hari penuh`),
      minutes: fullDays * MINUTES_PER_DAY,
      amount: roundMoney(day.amount * fullDays),
      capped: day.capped,
    });
  }
  if (remainder > 0) {
    const part = price(remainder);
    breakdown.push({
      label:
        fullDays > 0
          ? lt(`Remaining ${formatDuration(remainder, 'en')}`, `Baki ${formatDuration(remainder, 'ms')}`)
          : lt(formatDuration(remainder, 'en'), formatDuration(remainder, 'ms')),
      minutes: remainder,
      amount: part.amount,
      capped: part.capped,
    });
  }

  return {
    total: roundMoney(breakdown.reduce((sum, line) => sum + line.amount, 0)),
    breakdown,
    capped: breakdown.some((line) => line.capped),
    currency: 'MYR',
    minutes: stay,
  };
}

/** Minutes between an entry and an exit instant, for feeding the calculator. Negative if reversed. */
export function parkingMinutes(entry: Date | string | number, exit: Date | string | number): number {
  return Math.ceil((new Date(exit).getTime() - new Date(entry).getTime()) / 60000);
}

/* -------------------------------------------------------------------------------------------
 * Rate status: one fact, one answer (round 4, re-review 6.1.3)
 *
 * The parking page, the concierge and the help FAQ all describe a car park's rates with
 * `rateStatusText`, read from the same record, so they cannot disagree. A content test
 * (`src/content/content.test.ts`) fails when any of them words the status differently.
 * ---------------------------------------------------------------------------------------- */

/**
 * What a car park's rates rest on:
 * - `tariff`: a captured rate card (`rateStatus: 'published'` with bands): estimates are possible;
 * - `daily-max`: rates not verified, but the record holds a daily maximum its sources agree on;
 * - `reported`: rates not verified; individual sources quote a daily maximum;
 * - `none`: no figure we can stand behind.
 */
export type RateBasis = 'tariff' | 'daily-max' | 'reported' | 'none';

/** The rate facts of one car park, from its record alone. */
export interface RateFacts {
  basis: RateBasis;
  /** True only for a captured tariff. Every other basis is "not verified". */
  verified: boolean;
  /** The daily maximum the record holds (`tariff` or `daily-max`). */
  dailyMax?: number;
  /** Daily maximums individual sources quote (`reported`), each with the car park's own source id. */
  reported: readonly { amount: number; source: string }[];
  /** The lowest daily figure the record gives (daily maximum or a reported figure), for ranking. */
  lowestDaily?: number;
}

type RatedCarPark = Pick<CarPark, 'rates' | 'rateStatus' | 'dailyMax' | 'reportedDailyMax' | 'sources'>;

/** What the rate sentence needs to know about a source: who publishes it and whether it is dated. */
export type RateSource = Pick<Source, 'publisher' | 'asOf'>;

/** Read a car park's rate facts. Pure: the record is the only input. */
export function rateFacts(carPark: RatedCarPark): RateFacts {
  // Only figures whose source the car park itself cites, as on the parking page.
  const reported = (carPark.reportedDailyMax ?? []).filter((figure) => carPark.sources.includes(figure.source));
  if (carPark.rateStatus === 'published' && carPark.rates.length > 0) {
    return { basis: 'tariff', verified: true, dailyMax: carPark.dailyMax, reported: [], lowestDaily: carPark.dailyMax };
  }
  if (carPark.dailyMax !== undefined) return { basis: 'daily-max', verified: false, dailyMax: carPark.dailyMax, reported: [], lowestDaily: carPark.dailyMax };
  if (reported.length > 0) return { basis: 'reported', verified: false, reported, lowestDaily: Math.min(...reported.map((figure) => figure.amount)) };
  return { basis: 'none', verified: false, reported: [] };
}

const joinEn = (items: string[]): string => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const joinMs = (items: string[]): string => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} dan ${items[items.length - 1]}`);

/**
 * The one sentence every surface uses for a car park's rates, in both languages.
 * `sourceOf` looks a source up by id (for `reported` figures: who gives the figure, and "undated"
 * when its page carries no date); unknown ids read "one source".
 *
 * @example rateStatusText(longTermCarPark, getSource).en
 *   // 'Rates not verified: our sources give a daily maximum of RM 32; the hourly rates are not confirmed.'
 */
export function rateStatusText(carPark: RatedCarPark, sourceOf: (sourceId: string) => RateSource | undefined = () => undefined): LocalizedText {
  const facts = rateFacts(carPark);
  const money = (amount: number, lang: 'en' | 'ms') => formatCurrency(amount, lang, { alwaysShowSen: !Number.isInteger(amount) });
  switch (facts.basis) {
    case 'tariff':
      return facts.dailyMax !== undefined
        ? lt(`Rates published, with a daily maximum of ${money(facts.dailyMax, 'en')}.`, `Kadar diterbitkan, dengan maksimum harian ${money(facts.dailyMax, 'ms')}.`)
        : lt('Rates published.', 'Kadar diterbitkan.');
    case 'daily-max':
      return lt(
        `Rates not verified: our sources give a daily maximum of ${money(facts.dailyMax ?? 0, 'en')}; the hourly rates are not confirmed.`,
        `Kadar belum disahkan: sumber kami memberikan maksimum harian ${money(facts.dailyMax ?? 0, 'ms')}; kadar sejam belum dipastikan.`,
      );
    case 'reported': {
      // Who says so, and whether their page carries a date: an undated figure is weaker evidence.
      const who = (id: string, lang: 'en' | 'ms') => {
        const source = sourceOf(id);
        if (!source) return lang === 'en' ? 'one source' : 'satu sumber';
        return source.asOf ? source.publisher : `${source.publisher} (${lang === 'en' ? 'undated' : 'tanpa tarikh'})`;
      };
      const en = facts.reported.map((figure) => `${who(figure.source, 'en')} gives ${money(figure.amount, 'en')} a day`);
      const ms = facts.reported.map((figure) => `${who(figure.source, 'ms')} memberikan ${money(figure.amount, 'ms')} sehari`);
      return lt(`Rates not verified: ${joinEn(en)}.`, `Kadar belum disahkan: ${joinMs(ms)}.`);
    }
    default:
      return lt('No price published.', 'Tiada harga diterbitkan.');
  }
}
