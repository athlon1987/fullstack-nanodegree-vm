/**
 * The app's client-side stores: one validated `localStorage` entry each. Shapes are checked with
 * the hand-written `check` toolkit from `./storage` (not zod, and nothing at runtime from
 * `@/content/types`), so validation adds about a kilobyte to the browser shell instead of zod
 * and the content schemas (performance-08). The React hooks in `@/lib/hooks` read and write them.
 *
 * Everything stays on the device. Bump a store's `version` when its shape changes.
 */
import type { AirportSelection } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { JOURNEY_MODES } from '@/lib/journey/modes';
import { DEFAULT_PREFERENCES, PREFERENCES_STORE_NAME, PREFERENCES_STORE_VERSION, PreferencesSchema, type Preferences } from './preferences';
import { check, createStore, validator, type Infer, type Validator } from './storage';

/** Every terminal id. `Record<TerminalId, true>` fails to compile if the content adds one. */
const TERMINALS: Record<TerminalId, true> = { T1: true, T2: true, MAIN: true };
const TERMINAL_IDS = Object.keys(TERMINALS) as TerminalId[];

const slug = check.string({ pattern: /^[a-z]{3}$/ });
const isoInstant = check.string({ min: 10, max: 40 });
/**
 * A link on this site, without the locale (`/kul/facilities/prayer-t1`). Absolute URLs,
 * protocol-relative `//host` and `/\host` (which browsers treat as `//host`) and other schemes
 * such as `data:` or `javascript:` are refused (security-09).
 */
export const SAME_SITE_PATH = /^\/(?![/\\])[^\s\\]*$/;

/* ---- Airport context ---------------------------------------------------------------------- */

const AirportSelectionSchema: Validator<AirportSelection | null> = validator(
  check.nullable(check.object({ airport: slug, terminal: check.optional(check.oneOf(TERMINAL_IDS)) })),
);

/** The last airport (and KLIA terminal) the user chose. `null` until they choose one. */
export const airportStore = createStore<AirportSelection | null>({
  name: 'airport',
  version: 1,
  schema: AirportSelectionSchema,
  defaultValue: null,
});

/* ---- Journey mode ------------------------------------------------------------------------- */

const JourneyModeSchema = validator(check.nullable(check.oneOf(JOURNEY_MODES)));

/** The journey mode the user picked. `null` until they pick one. */
export const journeyModeStore = createStore<Infer<typeof JourneyModeSchema>>({
  name: 'journey-mode',
  version: 1,
  schema: JourneyModeSchema,
  defaultValue: null,
});

/* ---- Saved journey ------------------------------------------------------------------------ */

const savedFlight = check.object({
  /** Flight id, for example `mh2610-20261117-d`. */
  id: check.string({ min: 5, max: 40 }),
  /** Airport slug whose board the flight was saved from. */
  airport: slug,
  /** Compact designator: `MH2610`. */
  number: check.string({ min: 3, max: 12 }),
  direction: check.oneOf(['d', 'a'] as const),
  /** Local date key of the flight. */
  date: check.string({ pattern: /^\d{4}-\d{2}-\d{2}$/ }),
  /** Short route text for lists: `Kuala Lumpur to London`. */
  route: check.optional(check.string({ max: 200 })),
  mode: check.optional(check.oneOf(JOURNEY_MODES)),
  savedAt: isoInstant,
});
export const SavedFlightSchema = validator(savedFlight);
/** A flight the user saved. Only identifiers are stored; status is looked up fresh. */
export type SavedFlight = Infer<typeof savedFlight>;

const savedPlace = check.object({
  /** Content id (facility, outlet, car park, transport option or map point). */
  id: check.string({ min: 1, max: 120 }),
  type: check.oneOf(['facility', 'outlet', 'car-park', 'transport', 'map-point'] as const),
  airport: slug,
  title: check.string({ min: 1, max: 200 }),
  /** Link on this site without the locale prefix; never an absolute or protocol-relative URL. */
  href: check.string({ min: 1, max: 300, pattern: SAME_SITE_PATH }),
  savedAt: isoInstant,
});
export const SavedPlaceSchema = validator(savedPlace);
/** A place the user saved. */
export type SavedPlace = Infer<typeof savedPlace>;

const parkedCarNote = check.object({
  airport: check.optional(slug),
  carParkId: check.optional(check.string({ max: 120 })),
  level: check.optional(check.string({ max: 40 })),
  zone: check.optional(check.string({ max: 40 })),
  note: check.optional(check.string({ max: 280 })),
  savedAt: isoInstant,
});
export const ParkedCarNoteSchema = validator(parkedCarNote);
/** The user's reminder of where they parked. */
export type ParkedCarNote = Infer<typeof parkedCarNote>;

/**
 * Invalid or tampered entries are dropped one by one; the rest of the saved journey is kept.
 * (Saving a 21st flight or 51st place is refused by `set`, as before.)
 */
const savedJourney = check.object({
  flights: check.array(savedFlight, { max: 20, dropInvalid: true }),
  places: check.array(savedPlace, { max: 50, dropInvalid: true }),
  parkedCar: check.nullable(parkedCarNote),
});
export const SavedJourneySchema = validator(savedJourney);
/** Everything in "My journey". */
export type SavedJourney = Infer<typeof savedJourney>;

/** An empty saved journey: the default and the server snapshot. */
export const EMPTY_SAVED_JOURNEY: SavedJourney = { flights: [], places: [], parkedCar: null };

/** Saved flights, saved places and the parked-car note. */
export const savedJourneyStore = createStore<SavedJourney>({
  name: 'journey',
  version: 1,
  schema: SavedJourneySchema,
  defaultValue: EMPTY_SAVED_JOURNEY,
});

/* ---- Preferences -------------------------------------------------------------------------- */

/** Theme, text size, contrast and motion preferences. */
export const preferencesStore = createStore<Preferences>({
  name: PREFERENCES_STORE_NAME,
  version: PREFERENCES_STORE_VERSION,
  schema: PreferencesSchema,
  defaultValue: DEFAULT_PREFERENCES,
});
