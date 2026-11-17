/**
 * The app's client-side stores: one validated `localStorage` entry each. Shapes are defined
 * here with zod; the React hooks in `@/lib/hooks` read and write them.
 *
 * Everything stays on the device. Bump a store's `version` when its shape changes.
 */
import { z } from 'zod';
import { TERMINAL_IDS } from '@/content/types';
import type { AirportSelection } from '@/content/airports';
import { JOURNEY_MODES } from '@/lib/journey/modes';
import { DEFAULT_PREFERENCES, PREFERENCES_STORE_NAME, PREFERENCES_STORE_VERSION, PreferencesSchema, type Preferences } from './preferences';
import { createStore } from './storage';

const slug = z.string().regex(/^[a-z]{3}$/);
const isoInstant = z.string().min(10);

/* ---- Airport context ---------------------------------------------------------------------- */

const AirportSelectionSchema: z.ZodType<AirportSelection | null> = z
  .object({ airport: slug, terminal: z.enum(TERMINAL_IDS).optional() })
  .nullable();

/** The last airport (and KLIA terminal) the user chose. `null` until they choose one. */
export const airportStore = createStore<AirportSelection | null>({
  name: 'airport',
  version: 1,
  schema: AirportSelectionSchema,
  defaultValue: null,
});

/* ---- Journey mode ------------------------------------------------------------------------- */

const JourneyModeSchema = z.enum(JOURNEY_MODES).nullable();

/** The journey mode the user picked. `null` until they pick one. */
export const journeyModeStore = createStore<z.infer<typeof JourneyModeSchema>>({
  name: 'journey-mode',
  version: 1,
  schema: JourneyModeSchema,
  defaultValue: null,
});

/* ---- Saved journey ------------------------------------------------------------------------ */

export const SavedFlightSchema = z.object({
  /** Flight id, for example `mh2610-20261117-d`. */
  id: z.string().min(5),
  /** Airport slug whose board the flight was saved from. */
  airport: slug,
  /** Compact designator: `MH2610`. */
  number: z.string().min(3),
  direction: z.enum(['d', 'a']),
  /** Local date key of the flight. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Short route text for lists: `Kuala Lumpur to London`. */
  route: z.string().optional(),
  mode: z.enum(JOURNEY_MODES).optional(),
  savedAt: isoInstant,
});
/** A flight the user saved. Only identifiers are stored; status is looked up fresh. */
export type SavedFlight = z.infer<typeof SavedFlightSchema>;

export const SavedPlaceSchema = z.object({
  /** Content id (facility, outlet, car park, transport option or map point). */
  id: z.string().min(1),
  type: z.enum(['facility', 'outlet', 'car-park', 'transport', 'map-point']),
  airport: slug,
  title: z.string().min(1),
  /** Link without the locale prefix. */
  href: z.string().min(1),
  savedAt: isoInstant,
});
/** A place the user saved. */
export type SavedPlace = z.infer<typeof SavedPlaceSchema>;

export const ParkedCarNoteSchema = z.object({
  airport: slug.optional(),
  carParkId: z.string().optional(),
  level: z.string().max(40).optional(),
  zone: z.string().max(40).optional(),
  note: z.string().max(280).optional(),
  savedAt: isoInstant,
});
/** The user's reminder of where they parked. */
export type ParkedCarNote = z.infer<typeof ParkedCarNoteSchema>;

export const SavedJourneySchema = z.object({
  flights: z.array(SavedFlightSchema).max(20),
  places: z.array(SavedPlaceSchema).max(50),
  parkedCar: ParkedCarNoteSchema.nullable(),
});
/** Everything in "My journey". */
export type SavedJourney = z.infer<typeof SavedJourneySchema>;

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
