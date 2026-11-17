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
import { lt, type CarPark, type LocalizedText, type RateBand } from '@/content/types';
import { formatDuration } from './format';

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
