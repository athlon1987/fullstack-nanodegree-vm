/**
 * Ground transport comparison. Pure: scores and sorts the published options for a priority
 * without ever inventing a fare or a journey time.
 *
 * - `price` and `time` rank only on published numbers. Options that lack the number sort after
 *   those that have it and are labelled, so the gap is visible.
 * - `convenience` is a transparent heuristic by mode (door-to-door first), nudged by frequency
 *   and 24-hour service. It is `basis: 'heuristic'`: present it as estimated guidance.
 * - `accessibility` puts options confirmed step-free first, unknown next, not step-free last.
 */
import { pick } from '@/content/values';
import type { TransportDestination, TransportMode, TransportOption } from '@/content/types';

/** What the traveller cares about most. */
export type TransportPriority = 'price' | 'time' | 'convenience' | 'accessibility';

/** Machine-readable remarks about a scored option; the UI maps them to dictionary keys. */
export type TransportLabel =
  | 'fare-not-published'
  | 'duration-not-published'
  | 'destination-not-listed'
  | 'lowest-fare'
  | 'shortest-time'
  | 'step-free'
  | 'step-free-unknown'
  | 'not-step-free';

/** Options for `compareTransport`. */
export interface CompareTransportOptions {
  /** Where the traveller is going, matched against destination names in either language. */
  destination?: string;
  priority: TransportPriority;
  /** Restrict to these modes (for example leave out `inter-terminal` for a city comparison). */
  modes?: readonly TransportMode[];
}

/** A transport option with its score for the chosen priority. */
export interface ScoredTransportOption {
  option: TransportOption;
  /** The destination entry the numbers come from, when the option lists one. */
  destination?: TransportDestination;
  /** Published fare in MYR, if any. */
  fare?: number;
  /** Published journey time in minutes, if any. */
  minutes?: number;
  /** 0 to 100 for the chosen priority; higher is better. 0 when the needed number is missing. */
  score: number;
  /** 1-based position after sorting. */
  rank: number;
  /** `published`: ranked on published numbers. `heuristic`: ranked by our rule of thumb. */
  basis: 'published' | 'heuristic';
  labels: TransportLabel[];
}

const CONVENIENCE_BY_MODE: Record<TransportMode, number> = {
  'e-hailing': 88,
  taxi: 86,
  'private-car': 78,
  rail: 74,
  'car-rental': 60,
  shuttle: 55,
  bus: 50,
  'inter-terminal': 40,
};

const normalise = (value: string): string => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function matchDestination(option: TransportOption, wanted: string | undefined): { destination?: TransportDestination; listed: boolean } {
  if (option.destinations.length === 0) return { listed: !wanted };
  if (!wanted) {
    const withFare = option.destinations.filter((item) => item.fare !== undefined);
    const cheapest = [...withFare].sort((a, b) => (a.fare?.amount ?? 0) - (b.fare?.amount ?? 0))[0];
    return { destination: cheapest ?? option.destinations[0], listed: true };
  }
  const needle = normalise(wanted);
  const found = option.destinations.find((item) => normalise(pick(item.name, 'en')).includes(needle) || normalise(pick(item.name, 'ms')).includes(needle));
  return found ? { destination: found, listed: true } : { listed: false };
}

/**
 * Score and sort transport options for a priority.
 *
 * @example
 * compareTransport(content.transport, { priority: 'price', destination: 'KL Sentral' })
 *   .map((row) => [row.option.id, row.fare, row.labels]);
 */
export function compareTransport(options: readonly TransportOption[], settings: CompareTransportOptions): ScoredTransportOption[] {
  const candidates = options.filter((option) => !settings.modes || settings.modes.includes(option.mode));

  const rows = candidates.map((option) => {
    const { destination, listed } = matchDestination(option, settings.destination);
    const fare = destination?.fare?.amount;
    const minutes = destination?.durationMinutes;
    const labels: TransportLabel[] = [];
    if (!listed) labels.push('destination-not-listed');
    if (fare === undefined) labels.push('fare-not-published');
    if (minutes === undefined) labels.push('duration-not-published');
    const stepFree = option.accessibility?.stepFree;
    labels.push(stepFree === true ? 'step-free' : stepFree === false ? 'not-step-free' : 'step-free-unknown');
    return { option, destination, fare, minutes, listed, stepFree, labels };
  });

  const fares = rows.filter((row) => row.listed && row.fare !== undefined).map((row) => row.fare as number);
  const times = rows.filter((row) => row.listed && row.minutes !== undefined).map((row) => row.minutes as number);
  const lowestFare = fares.length > 0 ? Math.min(...fares) : undefined;
  const shortestTime = times.length > 0 ? Math.min(...times) : undefined;

  const scored = rows.map((row) => {
    if (row.listed && row.fare !== undefined && row.fare === lowestFare) row.labels.push('lowest-fare');
    if (row.listed && row.minutes !== undefined && row.minutes === shortestTime) row.labels.push('shortest-time');

    let score = 0;
    let basis: ScoredTransportOption['basis'] = 'published';
    if (settings.priority === 'price') {
      score = row.fare === undefined || lowestFare === undefined ? 0 : row.fare === 0 ? 100 : Math.round((100 * Math.max(lowestFare, 0.01)) / row.fare);
      if (row.fare !== undefined && lowestFare === 0 && row.fare > 0) score = Math.max(1, Math.round(100 / (1 + row.fare)));
    } else if (settings.priority === 'time') {
      score = row.minutes === undefined || shortestTime === undefined ? 0 : Math.round((100 * shortestTime) / row.minutes);
    } else if (settings.priority === 'convenience') {
      basis = 'heuristic';
      score = CONVENIENCE_BY_MODE[row.option.mode];
      if (row.option.frequencyMinutes !== undefined && row.option.frequencyMinutes <= 15) score += 5;
      if (row.option.hours?.kind === '24h') score += 5;
      score = Math.min(100, score);
    } else {
      score = row.stepFree === true ? 100 : row.stepFree === false ? 10 : 50;
    }
    return { ...row, score, basis };
  });

  const missing = (row: (typeof scored)[number]): number => {
    if (settings.priority === 'price') return row.fare === undefined ? 1 : 0;
    if (settings.priority === 'time') return row.minutes === undefined ? 1 : 0;
    return 0;
  };

  scored.sort((a, b) => {
    const byListed = Number(!a.listed) - Number(!b.listed);
    if (byListed !== 0) return byListed;
    const byMissing = missing(a) - missing(b);
    if (byMissing !== 0) return byMissing;
    if (settings.priority === 'price' && a.fare !== undefined && b.fare !== undefined && a.fare !== b.fare) return a.fare - b.fare;
    if (settings.priority === 'time' && a.minutes !== undefined && b.minutes !== undefined && a.minutes !== b.minutes) return a.minutes - b.minutes;
    if (b.score !== a.score) return b.score - a.score;
    return pick(a.option.name, 'en').localeCompare(pick(b.option.name, 'en'));
  });

  return scored.map((row, index) => {
    const result: ScoredTransportOption = { option: row.option, score: row.score, rank: index + 1, basis: row.basis, labels: row.labels };
    if (row.destination) result.destination = row.destination;
    if (row.fare !== undefined) result.fare = row.fare;
    if (row.minutes !== undefined) result.minutes = row.minutes;
    return result;
  });
}
