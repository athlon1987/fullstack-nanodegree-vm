/**
 * Pure helpers for the ground transport planner. Client-safe: no content-layer imports beyond types.
 *
 * Fare validity. The content layer has no structured validity field on a destination yet, so a fare
 * that changes on a date is authored as two destinations whose English names end with the period,
 * for example "KL Sentral (fare until 31 December 2026)" and "KL Sentral (fare from 1 January 2027)".
 * `farePeriods` reads those dates back from the names (never inventing one), and `optionsForDay`
 * keeps, for each place, the fare that applies on a given airport-local date so that
 * `compareTransport` ranks on today's fare. With no date (server render, before the clock is read)
 * it keeps the first period and the UI lists every period with its dates.
 */
import { pick } from '@/content/values';
import type { Lang, LocalizedText, TransportDestination, TransportMode, TransportOption } from '@/content/types';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Matches the period suffix of an English destination name: "(fare until 31 December 2026)". */
const PERIOD_EN = /\s*\((?:fare\s+)?(until|from)\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})\)\s*$/i;
/** The same suffix in Malay: "(tambang hingga 31 Disember 2026)", "(tambang mulai 1 Januari 2027)". */
const PERIOD_MS = /\s*\((?:tambang\s+)?(?:hingga|mulai|sehingga|dari)\s+[^)]*\)\s*$/i;

/** Modes that take you door to door by nature: an option of these modes with no destination list has no fixed route. */
export const DOOR_TO_DOOR_MODES: readonly TransportMode[] = ['e-hailing', 'taxi', 'private-car', 'car-rental'];

/** Modes compared in the planner. Movement between and inside terminals has its own section. */
export const PLANNER_MODES: readonly TransportMode[] = ['rail', 'bus', 'taxi', 'e-hailing', 'car-rental', 'private-car', 'shuttle'];

/** Date keys (`YYYY-MM-DD`, airport-local) a destination's fare applies between, both inclusive. */
export interface FareValidity {
  from?: string;
  until?: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** The validity period written at the end of a destination's English name, if any. */
export function parseFareValidity(name: LocalizedText): FareValidity {
  const match = PERIOD_EN.exec(name.en);
  if (!match) return {};
  const month = MONTHS.indexOf(match[3].toLowerCase());
  if (month < 0) return {};
  const key = `${match[4]}-${pad(month + 1)}-${pad(Number(match[2]))}`;
  return match[1].toLowerCase() === 'until' ? { until: key } : { from: key };
}

/** A destination name without its validity suffix, in both languages: "KL Sentral". */
export function placeName(name: LocalizedText): LocalizedText {
  const en = name.en.replace(PERIOD_EN, '').trim();
  return name.ms === undefined ? { en } : { en, ms: name.ms.replace(PERIOD_MS, '').trim() };
}

const keyOf = (name: LocalizedText): string => placeName(name).en.toLowerCase();

/** One fare period for a place. */
export interface FarePeriod extends FareValidity {
  destination: TransportDestination;
}

/** Every published entry for one place served by an option, ordered by date. */
export interface PlaceFares {
  /** Lower-case English place name, the grouping key. */
  key: string;
  name: LocalizedText;
  periods: FarePeriod[];
}

/** Group an option's destinations by place, each with its fare periods in date order. */
export function farePeriods(option: TransportOption): PlaceFares[] {
  const groups = new Map<string, PlaceFares>();
  for (const destination of option.destinations) {
    const key = keyOf(destination.name);
    const group = groups.get(key) ?? { key, name: placeName(destination.name), periods: [] };
    group.periods.push({ destination, ...parseFareValidity(destination.name) });
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    group.periods.sort((a, b) => (a.from ?? a.until ?? '').localeCompare(b.from ?? b.until ?? ''));
  }
  return [...groups.values()];
}

/** True when `day` (a date key) falls inside the period. */
export function periodCovers(period: FareValidity, day: string): boolean {
  return (!period.from || period.from <= day) && (!period.until || day <= period.until);
}

/** Where a place's fares stand on a given day. */
export interface FareStatus {
  /** The period that applies on the day, if any. */
  current?: FarePeriod;
  /** Periods that start after the day, soonest first. */
  upcoming: FarePeriod[];
  /** The last period, when every period ended before the day. */
  expired?: FarePeriod;
  /** True when the place has more than one dated period. */
  dated: boolean;
}

/** Which fare applies on `day`, and which changes are coming. */
export function fareStatus(place: PlaceFares, day: string): FareStatus {
  const dated = place.periods.some((period) => period.from || period.until);
  const covering = place.periods.filter((period) => periodCovers(period, day));
  const current = covering.sort((a, b) => (b.from ?? '').localeCompare(a.from ?? ''))[0];
  const upcoming = place.periods.filter((period) => period.from && period.from > day);
  const ended = place.periods.filter((period) => period.until && period.until < day);
  const expired = !current && upcoming.length === 0 && ended.length > 0 ? ended[ended.length - 1] : undefined;
  return { current, upcoming, expired, dated };
}

/**
 * The options as they stand on `day`: one destination per place, named without its period,
 * carrying the fare that applies that day. A place whose fares have all ended, or not yet begun,
 * keeps its entry without a fare, so it reads "not published" rather than showing a stale number.
 * With `day` null the first period is kept.
 */
export function optionsForDay(options: readonly TransportOption[], day: string | null): TransportOption[] {
  return options.map((option) =>
    option.destinations.length === 0 ? option : { ...option, destinations: farePeriods(option).map((place) => reduce(place, day)) },
  );
}

function reduce(place: PlaceFares, day: string | null): TransportDestination {
  if (day === null) return { ...place.periods[0].destination, name: place.name };
  const status = fareStatus(place, day);
  if (status.current) return { ...status.current.destination, name: place.name };
  const fallback = status.upcoming[0] ?? status.expired ?? place.periods[place.periods.length - 1];
  const rest: TransportDestination = { name: place.name };
  if (fallback.destination.durationMinutes !== undefined) rest.durationMinutes = fallback.destination.durationMinutes;
  return rest;
}

/** A place travellers can pick in the planner. */
export interface PlaceChoice {
  /** English place name, passed to `compareTransport` as the destination. */
  value: string;
  name: LocalizedText;
  /** How many options list this place. */
  count: number;
}

/** The places named in the options, most widely served first. */
export function placeChoices(options: readonly TransportOption[]): PlaceChoice[] {
  const choices = new Map<string, PlaceChoice>();
  for (const option of options) {
    for (const place of farePeriods(option)) {
      const existing = choices.get(place.key);
      if (existing) existing.count += 1;
      else choices.set(place.key, { value: place.name.en, name: place.name, count: 1 });
    }
  }
  return [...choices.values()].sort((a, b) => b.count - a.count || a.name.en.localeCompare(b.name.en));
}

/** True for an option that has no destination list because it goes wherever you ask. */
export function isDoorToDoor(option: TransportOption): boolean {
  return option.destinations.length === 0 && DOOR_TO_DOOR_MODES.includes(option.mode);
}

/**
 * True for an option that takes you to any address (a taxi, e-hailing, your own or a hired car),
 * whether or not its content lists example places. A coupon taxi whose only listed fare is for
 * the city zone still goes to KL Sentral (C-02): it is offered for every place, without a fare.
 */
export function servesAnyPlace(option: TransportOption): boolean {
  return DOOR_TO_DOOR_MODES.includes(option.mode);
}

/**
 * Door-to-door options list no places, so `compareTransport` would treat them as "not listed" for
 * every destination. For ranking only, give them an entry for the chosen place with no fare and no
 * time: they then sort with everything else, after the options that have the number. The UI
 * recognises them with `isDoorToDoor(original)` and never shows that entry as a published route.
 */
export function withDoorToDoorEntries(options: readonly TransportOption[], place: string | undefined): TransportOption[] {
  if (!place) return [...options];
  const key = keyOf({ en: place });
  return options.map((option) => {
    if (isDoorToDoor(option)) return { ...option, destinations: [{ name: { en: place } }] };
    // A door-to-door mode that lists other places: add the chosen one, without a fare or a time.
    if (servesAnyPlace(option) && !option.destinations.some((destination) => keyOf(destination.name) === key)) {
      return { ...option, destinations: [...option.destinations, { name: { en: place } }] };
    }
    return option;
  });
}

/** Show an `asOf` value: date keys become dates in words, anything else is shown as written. */
export function asOfLabel(asOf: string, lang: Lang, formatDay: (key: string, lang: Lang) => string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? formatDay(asOf, lang) : asOf;
}

/** Plain names of the places an option lists, in the page language. */
export function listedPlaces(option: TransportOption, lang: Lang): string[] {
  return farePeriods(option).map((place) => pick(place.name, lang));
}

/** What to show as an option's fare for a place on a day. */
export interface FareInfo {
  /** The place the figures are for, if the option lists one. */
  place?: PlaceFares;
  /** The entry whose fare, time and note are shown: today's period, or the first when the day is unknown. */
  shown?: TransportDestination;
  /** True when the place has dated fare periods. */
  dated: boolean;
  /** Where the dated fares stand on the day (only when the day is known). */
  status?: FareStatus;
  /** True for door-to-door options with no fixed route. */
  doorToDoor: boolean;
}

/**
 * The fare to show for an option. `placeKey` is the lower-case English place name; without one the
 * option's first place is used. `day` is the airport-local date key, or null before the clock is read.
 */
export function fareInfo(option: TransportOption, placeKey: string | undefined, day: string | null): FareInfo {
  const places = farePeriods(option);
  const place = placeKey ? places.find((item) => item.key === placeKey) : places[0];
  // A taxi or e-hailing option still serves a place it does not list, without a fare for it.
  const doorToDoor = isDoorToDoor(option) || (servesAnyPlace(option) && placeKey !== undefined && !place);
  if (!place) return { dated: false, doorToDoor };
  const dated = place.periods.some((period) => period.from || period.until);
  if (!dated || day === null) return { place, shown: place.periods[0].destination, dated, doorToDoor };
  const status = fareStatus(place, day);
  const info: FareInfo = { place, dated, status, doorToDoor };
  const shown = status.current?.destination;
  if (shown) info.shown = shown;
  return info;
}

/** Lower-case English place key for a place value from `placeChoices`. */
export const placeKey = (value: string): string => value.toLowerCase();
