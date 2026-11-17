/**
 * Content model for the verified content layer.
 *
 * This file is the single authority for the shape of published content. Every type has a zod
 * schema next to it (`XSchema`) and the TypeScript type is inferred from the schema, so the two
 * cannot drift. `validateContent()` at the bottom runs every schema plus the cross-reference
 * checks (source ids, airport codes, map references) and is executed by a unit test, so bad
 * content fails `npm run test`.
 *
 * Rules that the model enforces or supports (build-spec section 1):
 *  - every published item carries `sources: string[]` (ids resolved through `@/content`);
 *  - unknown values stay `undefined` (the UI prints "Not published"), they are never guessed;
 *  - guidance carries a `provenance` tag: official | estimated | suggestion | demo.
 *
 * This module has no runtime imports other than zod, so it is safe in client bundles.
 */
import { z } from 'zod';

// Zod otherwise probes `new Function` once to decide whether to compile parsers; the site's CSP
// blocks eval, so that probe shows up as a `script-src` violation in production consoles. This
// module loads with the shell on every page, before any parse (platform hand-off).
z.config({ jitless: true });

/* -------------------------------------------------------------------------------------------
 * Language and localised text
 * ---------------------------------------------------------------------------------------- */

/** Supported interface languages: English and Bahasa Malaysia. */
export const LANGS = ['en', 'ms'] as const;
export const LangSchema = z.enum(LANGS);
/** A supported language code. */
export type Lang = z.infer<typeof LangSchema>;
/** Language used when nothing else is known. */
export const DEFAULT_LANG: Lang = 'en';

/** Type guard for route params and stored values. */
export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export const LocalizedTextSchema = z.strictObject({
  en: z.string().min(1),
  ms: z.string().min(1).optional(),
});
/** Long-form content authored in English with an optional Malay version. Read it with `pick`. */
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

/**
 * Read a localised text in the requested language, falling back to English.
 * Use `hasTranslation` to decide whether to show the `TranslationNotice`.
 */
export function pick(text: LocalizedText, lang: Lang): string {
  return lang === 'ms' && text.ms ? text.ms : text.en;
}

/** True when `text` exists in `lang` without falling back (English always counts). */
export function hasTranslation(text: LocalizedText | undefined, lang: Lang): boolean {
  if (!text) return true;
  return lang === 'en' || Boolean(text.ms);
}

/** Small constructor for localised text: `lt('Prayer room', 'Surau')`. */
export function lt(en: string, ms?: string): LocalizedText {
  return ms ? { en, ms } : { en };
}

/* -------------------------------------------------------------------------------------------
 * Shared primitives
 * ---------------------------------------------------------------------------------------- */

/** Calendar date, `YYYY-MM-DD`. */
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
/** Instant with an explicit offset, for example `2026-11-28T00:00:00+08:00`. */
export const IsoDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/, 'Expected ISO date-time with offset');
/** 24-hour clock time, `HH:mm`. */
export const ClockTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a kebab-case id');
const SourceIdsSchema = z.array(z.string().min(1)).min(1, 'Every published item needs at least one source');

export const PROVENANCES = ['official', 'estimated', 'suggestion', 'demo'] as const;
export const ProvenanceSchema = z.enum(PROVENANCES);
/**
 * The kind of guidance, shown with `ProvenanceTag`:
 *  - `official`: instruction or fact from an authoritative source (airport operator, airline, government);
 *  - `estimated`: our calculation, a typical value, or a fact reported only by non-authoritative sources;
 *  - `suggestion`: an optional idea;
 *  - `demo`: simulated data from a demo provider or an illustrative placement.
 */
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const SOURCE_KINDS = ['official', 'government', 'operator', 'news', 'aggregator', 'other'] as const;
export const SourceSchema = z.strictObject({
  id: IdSchema,
  title: z.string().min(1),
  publisher: z.string().min(1),
  /** Absolute `https:` URL, or an internal path (`/about-this-prototype`) for the prototype's own method notes. */
  url: z.union([z.url(), z.string().regex(/^\/[a-z0-9\-/]*$/, 'Expected an absolute URL or an internal path')]),
  /** Date we retrieved or last checked the source. */
  retrieved: IsoDateSchema,
  /** Date the source itself states, when it has one. */
  asOf: z.string().min(1).optional(),
  /** Who is speaking: `official` is Malaysia Airports itself, `operator` an airline or service operator. */
  kind: z.enum(SOURCE_KINDS),
});
/** A citable source. Content refers to sources by `id`. */
export type Source = z.infer<typeof SourceSchema>;
export type SourceKind = Source['kind'];

export const HoursSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('24h'), note: LocalizedTextSchema.optional() }),
  z.strictObject({
    kind: z.literal('daily'),
    open: ClockTimeSchema,
    close: ClockTimeSchema,
    note: LocalizedTextSchema.optional(),
  }),
  z.strictObject({ kind: z.literal('text'), text: LocalizedTextSchema }),
]);
/**
 * Opening hours. `24h` and `daily` are machine-readable (see `isOpenAt` in `@/lib/time`);
 * `text` is for hours published only as prose.
 */
export type Hours = z.infer<typeof HoursSchema>;

export const MoneySchema = z.strictObject({
  amount: z.number().nonnegative(),
  currency: z.literal('MYR'),
  /** How the fare is charged, when the source says. */
  basis: z.enum(['per-person', 'per-vehicle', 'metered', 'from']).optional(),
});
/** An amount in Malaysian ringgit. Format with `formatCurrency` from `@/lib/format`. */
export type Money = z.infer<typeof MoneySchema>;

export const ContactSchema = z.strictObject({
  kind: z.enum(['phone', 'email', 'web', 'chat', 'app']),
  label: LocalizedTextSchema,
  /** Display value: the number, address or URL as published. */
  value: z.string().min(1),
  /** Link target (`tel:`, `mailto:` or `https:`), when one is appropriate. */
  href: z.string().min(1).optional(),
  note: LocalizedTextSchema.optional(),
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** An official contact channel. */
export type Contact = z.infer<typeof ContactSchema>;

/* -------------------------------------------------------------------------------------------
 * Airports and terminals
 * ---------------------------------------------------------------------------------------- */

export const TERMINAL_IDS = ['T1', 'T2', 'MAIN'] as const;
export const TerminalIdSchema = z.enum(TERMINAL_IDS);
/** KLIA has `T1` and `T2`; every other airport has a single `MAIN` terminal. */
export type TerminalId = z.infer<typeof TerminalIdSchema>;

export const LevelSchema = z.strictObject({
  /** Stable id, for example `L5`. */
  id: z.string().min(1),
  name: LocalizedTextSchema,
  /** Physical order, low to high. */
  order: z.number().int(),
  description: LocalizedTextSchema.optional(),
  provenance: ProvenanceSchema.optional(),
  sources: z.array(z.string().min(1)).optional(),
});
/** A published floor of a terminal. Only levels we can source are listed. */
export type Level = z.infer<typeof LevelSchema>;

export const TerminalSchema = z.strictObject({
  id: TerminalIdSchema,
  /** Full public name, for example "KLIA Terminal 1". */
  name: LocalizedTextSchema,
  /** Short label for chips and filters, for example "Terminal 1". */
  shortName: LocalizedTextSchema,
  levels: z.array(LevelSchema),
  /** IATA codes of airlines we can source at this terminal (see `AirlineAtAirport`). */
  airlines: z.array(z.string().length(2)).optional(),
});
export type Terminal = z.infer<typeof TerminalSchema>;

export const AIRPORT_CLASSIFICATIONS = ['international', 'domestic', 'stolport'] as const;
export const AirportClassificationSchema = z.enum(AIRPORT_CLASSIFICATIONS);
/** Malaysia Airports' own classes: 5 international, 17 domestic, 17 STOLports. */
export type AirportClassification = z.infer<typeof AirportClassificationSchema>;

export const AIRPORT_DEPTHS = ['full', 'essential', 'listing'] as const;
export const AirportDepthSchema = z.enum(AIRPORT_DEPTHS);
/** How much of the product an airport gets: all tools, the essentials, or a directory entry. */
export type AirportDepth = z.infer<typeof AirportDepthSchema>;

export const AIRPORT_REGIONS = ['peninsular', 'sabah', 'sarawak', 'labuan'] as const;
export const AirportRegionSchema = z.enum(AIRPORT_REGIONS);
export type AirportRegion = z.infer<typeof AirportRegionSchema>;

export const VerificationSchema = z.enum(['verified', 'unverified']);
/** Whether a registry record is fully backed by search-confirmed research. */
export type Verification = z.infer<typeof VerificationSchema>;

export const CoordinatesSchema = z.strictObject({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  /** True when the position is rounded for a schematic map and must not be used for navigation. */
  approximate: z.boolean(),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const AirportSchema = z.strictObject({
  /** IATA code, upper case: `KUL`. */
  code: z.string().regex(/^[A-Z]{3}$/),
  /** Route segment, the lower-case IATA code: `kul`. */
  slug: z.string().regex(/^[a-z]{3}$/),
  /** ICAO code where the research has one. Check `unverifiedFields` before presenting it as fact. */
  icao: z.string().regex(/^[A-Z]{4}$/).optional(),
  /** Official name. */
  name: z.string().min(1),
  /** Everyday name for chips and lists: "KLIA", "Penang", "Subang". */
  shortName: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  region: AirportRegionSchema,
  classification: AirportClassificationSchema,
  depth: AirportDepthSchema,
  /** IANA zone. All of Malaysia, including Sabah and Sarawak, is UTC+8 with no daylight saving. */
  timezone: z.literal('Asia/Kuala_Lumpur'),
  coordinates: CoordinatesSchema,
  terminals: z.array(TerminalSchema).min(1),
  summary: LocalizedTextSchema,
  contacts: z.array(ContactSchema),
  /** `unverified` when any code or name below rests on prior knowledge or low-confidence research. */
  verification: VerificationSchema,
  /** Which fields are not search-confirmed, for example `['icao']`. Empty when verified. */
  unverifiedFields: z.array(z.enum(['code', 'icao', 'name', 'location', 'network-membership'])),
  verificationNote: z.string().optional(),
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** One of the 39 airports operated by Malaysia Airports in Malaysia. */
export type Airport = z.infer<typeof AirportSchema>;

/* -------------------------------------------------------------------------------------------
 * Facilities
 * ---------------------------------------------------------------------------------------- */

export const FACILITY_CATEGORIES = [
  'prayer-room',
  'nursing-room',
  'toilet',
  'accessible-toilet',
  'lounge',
  'hotel',
  'clinic',
  'pharmacy',
  'baggage',
  'wifi',
  'atm',
  'money-changer',
  'sim',
  'information',
  'lost-property',
  'play-area',
  'smoking',
  'shower',
  'rest',
  'charging',
  'water',
  'porter',
  'assistance',
  'calm-room',
  'viewing',
  'other',
] as const;
export const FacilityCategorySchema = z.enum(FACILITY_CATEGORIES);
export type FacilityCategory = z.infer<typeof FacilityCategorySchema>;

/**
 * Human labels for facility categories in both languages, plus a semantic icon key.
 * The icon key is a hint for `src/components/ui/icon.tsx` to map; it is not a guaranteed
 * lucide name.
 */
export const FACILITY_CATEGORY_META: Record<FacilityCategory, { label: LocalizedText; icon: string }> = {
  'prayer-room': { label: lt('Prayer room (surau)', 'Surau'), icon: 'prayer' },
  'nursing-room': { label: lt('Nursing and baby care room', 'Bilik penjagaan bayi'), icon: 'baby' },
  toilet: { label: lt('Toilets', 'Tandas'), icon: 'toilet' },
  'accessible-toilet': { label: lt('Accessible toilet', 'Tandas OKU'), icon: 'accessible' },
  lounge: { label: lt('Lounge', 'Lounge'), icon: 'lounge' },
  hotel: { label: lt('Hotel', 'Hotel'), icon: 'hotel' },
  clinic: { label: lt('Clinic and medical help', 'Klinik dan bantuan perubatan'), icon: 'medical' },
  pharmacy: { label: lt('Pharmacy', 'Farmasi'), icon: 'pharmacy' },
  baggage: { label: lt('Baggage services', 'Perkhidmatan bagasi'), icon: 'baggage' },
  wifi: { label: lt('Wi-Fi', 'Wi-Fi'), icon: 'wifi' },
  atm: { label: lt('ATM', 'ATM'), icon: 'atm' },
  'money-changer': { label: lt('Money changer', 'Pengurup wang'), icon: 'currency' },
  sim: { label: lt('SIM cards and mobile', 'Kad SIM dan telekomunikasi'), icon: 'sim' },
  information: { label: lt('Information counter', 'Kaunter pertanyaan'), icon: 'info' },
  'lost-property': { label: lt('Lost and found', 'Barang hilang dan dijumpai'), icon: 'lost' },
  'play-area': { label: lt("Children's play area", 'Ruang permainan kanak-kanak'), icon: 'play' },
  smoking: { label: lt('Smoking room', 'Bilik merokok'), icon: 'smoking' },
  shower: { label: lt('Showers', 'Bilik mandi'), icon: 'shower' },
  rest: { label: lt('Rest area', 'Ruang rehat'), icon: 'rest' },
  charging: { label: lt('Charging point', 'Tempat mengecas peranti'), icon: 'charging' },
  water: { label: lt('Drinking water', 'Air minuman'), icon: 'water' },
  porter: { label: lt('Porter service', 'Perkhidmatan porter'), icon: 'porter' },
  assistance: { label: lt('Assistance', 'Bantuan khas'), icon: 'assistance' },
  'calm-room': { label: lt('Calm room', 'Bilik tenang'), icon: 'calm' },
  viewing: { label: lt('Viewing gallery', 'Galeri tinjau'), icon: 'viewing' },
  other: { label: lt('Other', 'Lain-lain'), icon: 'other' },
};

/** Label for a facility category in the given language. */
export function facilityCategoryLabel(category: FacilityCategory, lang: Lang): string {
  return pick(FACILITY_CATEGORY_META[category].label, lang);
}

export const ZONES = ['landside', 'airside', 'both', 'unknown'] as const;
export const ZoneSchema = z.enum(ZONES);
/** Before security (`landside`), after security (`airside`), or not published (`unknown`). */
export type Zone = z.infer<typeof ZoneSchema>;

export const FacilitySchema = z.strictObject({
  id: IdSchema,
  /** Airport slug, for example `kul`. */
  airport: z.string().regex(/^[a-z]{3}$/),
  terminal: TerminalIdSchema,
  name: LocalizedTextSchema,
  category: FacilityCategorySchema,
  zone: ZoneSchema,
  /** A `Level.id` of the terminal, when the level is published. */
  level: z.string().optional(),
  /** Where it is, in words, exactly as far as the sources support. */
  locationNote: LocalizedTextSchema.optional(),
  hours: HoursSchema.optional(),
  description: LocalizedTextSchema,
  /** Who runs it (lounges, hotels, clinics). */
  operator: z.string().optional(),
  /** Who may use it or how to get in (lounges, calm rooms). */
  access: LocalizedTextSchema.optional(),
  /** True or false only when a source says so. */
  accessible: z.boolean().optional(),
  bookingUrl: z.url().optional(),
  /** Id of a `MapPoi` on one of the airport's maps. */
  mapPoint: z.string().optional(),
  provenance: ProvenanceSchema,
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** A facility or service inside a terminal. Lounges and hotels are facilities too. */
export type Facility = z.infer<typeof FacilitySchema>;

/* -------------------------------------------------------------------------------------------
 * Outlets (shop, dine, services)
 * ---------------------------------------------------------------------------------------- */

export const OutletSchema = z.strictObject({
  id: IdSchema,
  /** URL segment under `/[airport]/shop-dine/`. */
  slug: IdSchema,
  airport: z.string().regex(/^[a-z]{3}$/),
  terminal: TerminalIdSchema,
  /** Trading name as published. */
  name: z.string().min(1),
  kind: z.enum(['dine', 'shop', 'service']),
  /** Free-form category from the official directory, for example "Cafe" or "Duty free". */
  category: z.string().min(1),
  cuisine: z.string().optional(),
  zone: ZoneSchema,
  level: z.string().optional(),
  locationNote: LocalizedTextSchema.optional(),
  hours: HoursSchema.optional(),
  /** 1 (budget) to 4 (premium), only when published. */
  priceBand: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  /** Halal status as the outlet or airport publishes it. Undefined means not published. */
  halal: z.enum(['certified', 'pork-free', 'non-halal']).optional(),
  description: LocalizedTextSchema.optional(),
  mapPoint: z.string().optional(),
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** A shop, restaurant or commercial service. Only outlets confirmed by an official source. */
export type Outlet = z.infer<typeof OutletSchema>;

/* -------------------------------------------------------------------------------------------
 * Ground transport
 * ---------------------------------------------------------------------------------------- */

export const TRANSPORT_MODES = [
  'rail',
  'bus',
  'taxi',
  'e-hailing',
  'car-rental',
  'private-car',
  'shuttle',
  'inter-terminal',
] as const;
export const TransportModeSchema = z.enum(TRANSPORT_MODES);
export type TransportMode = z.infer<typeof TransportModeSchema>;

/** Labels for transport modes in both languages. */
export const TRANSPORT_MODE_LABELS: Record<TransportMode, LocalizedText> = {
  rail: lt('Train', 'Kereta api'),
  bus: lt('Bus and coach', 'Bas'),
  taxi: lt('Taxi', 'Teksi'),
  'e-hailing': lt('E-hailing', 'E-hailing'),
  'car-rental': lt('Car rental', 'Kereta sewa'),
  'private-car': lt('Private car', 'Kenderaan sendiri'),
  shuttle: lt('Shuttle', 'Bas ulang-alik'),
  'inter-terminal': lt('Between terminals', 'Antara terminal'),
};

export const TransportDestinationSchema = z.strictObject({
  name: LocalizedTextSchema,
  /** Published fare. Undefined means the fare is not published in our sources. */
  fare: MoneySchema.optional(),
  /** Published journey time in minutes. Undefined means not published. */
  durationMinutes: z.number().positive().optional(),
  note: LocalizedTextSchema.optional(),
});
export type TransportDestination = z.infer<typeof TransportDestinationSchema>;

export const TransportOptionSchema = z.strictObject({
  id: IdSchema,
  airport: z.string().regex(/^[a-z]{3}$/),
  mode: TransportModeSchema,
  name: LocalizedTextSchema,
  operator: z.string().optional(),
  description: LocalizedTextSchema.optional(),
  destinations: z.array(TransportDestinationSchema),
  /** Service frequency in words. */
  frequency: LocalizedTextSchema.optional(),
  /** Minutes between departures, when a single figure is published. */
  frequencyMinutes: z.number().positive().optional(),
  hours: HoursSchema.optional(),
  boarding: z.array(
    z.strictObject({
      terminal: TerminalIdSchema,
      level: z.string().optional(),
      note: LocalizedTextSchema,
    }),
  ),
  /** Accepted payment methods as published, for example `['Card', 'Touch n Go']`. */
  payment: z.array(z.string().min(1)).optional(),
  accessibility: z
    .strictObject({
      /** True or false only when a source says so. */
      stepFree: z.boolean().optional(),
      note: LocalizedTextSchema.optional(),
    })
    .optional(),
  bookingUrl: z.url().optional(),
  provenance: ProvenanceSchema,
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** A way to get to, from or around the airport. Compare options with `compareTransport`. */
export type TransportOption = z.infer<typeof TransportOptionSchema>;

/* -------------------------------------------------------------------------------------------
 * Parking
 * ---------------------------------------------------------------------------------------- */

export const RateBandSchema = z.strictObject({
  /** First parked minute this band covers (inclusive), counted within each 24-hour period. */
  fromMinute: z.number().int().nonnegative(),
  /** Minute at which the band stops (exclusive). Omit for an open-ended last band. */
  toMinute: z.number().int().positive().optional(),
  /** `flat`: one charge for entering the band. `per-block`: a charge per started block. */
  kind: z.enum(['flat', 'per-block']),
  /** Charge in MYR (for the band, or per block). */
  amount: z.number().nonnegative(),
  /** Block length for `per-block` bands, for example 60 for "each subsequent hour". */
  blockMinutes: z.number().int().positive().optional(),
  label: LocalizedTextSchema.optional(),
});
/** One line of a parking tariff. See `calculateParking` in `@/lib/parking`. */
export type RateBand = z.infer<typeof RateBandSchema>;

export const CAR_PARK_TYPES = ['terminal', 'long-term', 'preferred', 'valet', 'motorcycle', 'other'] as const;

export const CarParkSchema = z.strictObject({
  id: IdSchema,
  airport: z.string().regex(/^[a-z]{3}$/),
  terminal: TerminalIdSchema.optional(),
  name: LocalizedTextSchema,
  type: z.enum(CAR_PARK_TYPES),
  description: LocalizedTextSchema.optional(),
  /** Number of bays as published. Pair with `baysQualifier`: "over 5,700". */
  bays: z.number().int().positive().optional(),
  baysQualifier: z.enum(['exact', 'over', 'about']).optional(),
  /** How you get from the car park to the terminal. */
  walk: z
    .strictObject({
      minutes: z.number().positive().optional(),
      note: LocalizedTextSchema.optional(),
    })
    .optional(),
  /** Tariff bands. Empty when `rateStatus` is `not-verified`. */
  rates: z.array(RateBandSchema),
  /**
   * `published`: `rates` holds a tariff we can cite. `not-verified`: we have not captured the
   * official rates, so the calculator is unavailable and the UI links to the official page.
   */
  rateStatus: z.enum(['published', 'not-verified']),
  /** Maximum charge per 24-hour period in MYR. */
  dailyMax: z.number().positive().optional(),
  /** Free period at the start of a stay, in minutes. */
  graceMinutes: z.number().int().nonnegative().optional(),
  payment: z.array(z.string().min(1)).optional(),
  features: z.array(LocalizedTextSchema),
  accessibleBays: z.boolean().optional(),
  evCharging: z.boolean().optional(),
  bookingUrl: z.url().optional(),
  provenance: ProvenanceSchema,
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** A car park at an airport. */
export type CarPark = z.infer<typeof CarParkSchema>;

/* -------------------------------------------------------------------------------------------
 * Airlines
 * ---------------------------------------------------------------------------------------- */

export const AirlineDestinationSchema = z.strictObject({
  /** IATA airport code. */
  code: z.string().regex(/^[A-Z]{3}$/),
  city: z.string().min(1),
  country: z.string().min(1),
});
export type AirlineDestination = z.infer<typeof AirlineDestinationSchema>;

export const AirlineAtAirportSchema = z.strictObject({
  /** IATA airline code, for example `MH`. */
  code: z.string().regex(/^[A-Z0-9]{2}$/),
  name: z.string().min(1),
  terminal: TerminalIdSchema.optional(),
  /** Check-in location in words, as far as a source supports it. */
  checkIn: z.string().optional(),
  /** Destinations we can source from this airport. Empty when none are verified. */
  destinations: z.array(AirlineDestinationSchema),
  /** Who says this airline is here: the airline, the airport, or third-party terminal guides. */
  basis: z.enum(['airline', 'airport', 'third-party']),
  note: LocalizedTextSchema.optional(),
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/**
 * An airline operating at an airport, as a published fact.
 * The demo flight generator uses the same shape with an extra `illustrative: true` marker
 * (`@/lib/providers/demo-routes`); those records are never rendered as airline facts.
 */
export type AirlineAtAirport = z.infer<typeof AirlineAtAirportSchema>;

/* -------------------------------------------------------------------------------------------
 * Guides, FAQs, notices
 * ---------------------------------------------------------------------------------------- */

export const AUDIENCES = [
  'departing',
  'arriving',
  'transiting',
  'meeting',
  'family',
  'first-time',
  'accessibility',
  'all',
] as const;
export const AudienceSchema = z.enum(AUDIENCES);
export type Audience = z.infer<typeof AudienceSchema>;

export const ContentActionSchema = z.strictObject({
  label: LocalizedTextSchema,
  /** Internal path WITHOUT the locale prefix (`/kul/map`) or an absolute `https:` URL. */
  href: z.string().min(1),
});
export type ContentAction = z.infer<typeof ContentActionSchema>;

export const GuideStepSchema = z.strictObject({
  id: IdSchema,
  title: LocalizedTextSchema,
  body: LocalizedTextSchema,
  provenance: ProvenanceSchema,
  /** Sources for this step. Required when the step is `official`. */
  sources: z.array(z.string().min(1)).optional(),
  actions: z.array(ContentActionSchema).optional(),
});
/** One step of a guide. Each step carries its own provenance tag. */
export type GuideStep = z.infer<typeof GuideStepSchema>;

export const GuideSectionSchema = z.strictObject({
  id: IdSchema,
  title: LocalizedTextSchema,
  intro: LocalizedTextSchema.optional(),
  steps: z.array(GuideStepSchema).min(1),
});
export type GuideSection = z.infer<typeof GuideSectionSchema>;

export const GuideSchema = z.strictObject({
  /** URL segment under `/guides/`. */
  slug: IdSchema,
  title: LocalizedTextSchema,
  summary: LocalizedTextSchema,
  audience: z.array(AudienceSchema).min(1),
  sections: z.array(GuideSectionSchema).min(1),
  /** Airport slugs the guide is specific to. Omit for network-wide guides. */
  airports: z.array(z.string().regex(/^[a-z]{3}$/)).optional(),
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** A "Plan your journey" guide. */
export type Guide = z.infer<typeof GuideSchema>;

export const GUIDE_NOTE_TOPICS = [
  'terminal',
  'arrival-time',
  'getting-there',
  'check-in',
  'security',
  'immigration',
  'gate',
  'boarding',
  'landing',
  'baggage',
  'customs',
  'onward-transport',
  'meeting',
  'transit',
  'assistance',
] as const;
export const GuideNoteTopicSchema = z.enum(GUIDE_NOTE_TOPICS);
export type GuideNoteTopic = z.infer<typeof GuideNoteTopicSchema>;

export const GuideNoteSchema = z.strictObject({
  id: IdSchema,
  airport: z.string().regex(/^[a-z]{3}$/),
  /** The journey step or guide topic this note belongs to. */
  topic: GuideNoteTopicSchema,
  title: LocalizedTextSchema,
  body: LocalizedTextSchema,
  /** Narrow the note to a terminal, airline, gate group or flight scope. All given keys must match. */
  appliesTo: z
    .strictObject({
      terminal: TerminalIdSchema.optional(),
      airline: z.string().length(2).optional(),
      /** Gate letter prefixes, for example `['C']` for the satellite gates. */
      gatePrefixes: z.array(z.string().min(1)).optional(),
      scope: z.enum(['international', 'domestic']).optional(),
      direction: z.enum(['departing', 'arriving']).optional(),
    })
    .optional(),
  provenance: ProvenanceSchema,
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/**
 * An airport-specific, sourced note that the journey timeline and the guides attach to a step
 * ("C gates are in the Satellite Building, reached by Aerotrain").
 */
export type GuideNote = z.infer<typeof GuideNoteSchema>;

export const FaqSchema = z.strictObject({
  id: IdSchema,
  /** Help topic slug under `/help/`, for example `lost-property`. */
  topic: IdSchema,
  question: LocalizedTextSchema,
  answer: LocalizedTextSchema,
  airports: z.array(z.string().regex(/^[a-z]{3}$/)).optional(),
  provenance: ProvenanceSchema,
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
export type Faq = z.infer<typeof FaqSchema>;

export const NOTICE_SEVERITIES = ['info', 'advisory', 'warning', 'critical'] as const;
export const NoticeSchema = z.strictObject({
  id: IdSchema,
  /** Airport slug. Omit for network-wide notices. */
  airport: z.string().regex(/^[a-z]{3}$/).optional(),
  terminal: TerminalIdSchema.optional(),
  severity: z.enum(NOTICE_SEVERITIES),
  title: LocalizedTextSchema,
  body: LocalizedTextSchema,
  /** Start of the period the notice applies to. Omit for "from now". */
  validFrom: IsoDateTimeSchema.optional(),
  /** End of the period. Omit for "until further notice". */
  validTo: IsoDateTimeSchema.optional(),
  /** `demo` marks a simulated notice that must carry the demonstration label. */
  provenance: ProvenanceSchema,
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/** A travel advisory or operational notice. Use `noticeState` from `@/content` with a clock value. */
export type Notice = z.infer<typeof NoticeSchema>;
export type NoticeSeverity = Notice['severity'];

/* -------------------------------------------------------------------------------------------
 * Corporate
 * ---------------------------------------------------------------------------------------- */

export const CORPORATE_SECTIONS = [
  'about',
  'leadership',
  'network',
  'business',
  'procurement',
  'sustainability',
  'careers',
  'news',
  'governance',
  'contact',
  'investors',
] as const;
export const CorporateSectionSchema = z.enum(CORPORATE_SECTIONS);
export type CorporateSection = z.infer<typeof CorporateSectionSchema>;

export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('paragraph'), text: LocalizedTextSchema }),
  z.strictObject({ type: z.literal('heading'), text: LocalizedTextSchema }),
  z.strictObject({ type: z.literal('list'), items: z.array(LocalizedTextSchema).min(1) }),
  z.strictObject({
    type: z.literal('fact'),
    label: LocalizedTextSchema,
    value: LocalizedTextSchema,
    asOf: z.string().optional(),
    sources: SourceIdsSchema,
  }),
]);
/** A light rich-text block for corporate pages and news. */
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

export const CorporatePageSchema = z.strictObject({
  /** Path under `/corporate/`, for example `about` or `sustainability/overview`. */
  slug: z.string().regex(/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/),
  section: CorporateSectionSchema,
  title: LocalizedTextSchema,
  summary: LocalizedTextSchema,
  body: z.array(ContentBlockSchema),
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
export type CorporatePage = z.infer<typeof CorporatePageSchema>;

export const NewsItemSchema = z.strictObject({
  slug: IdSchema,
  title: LocalizedTextSchema,
  /** Publication date of the original announcement. */
  date: IsoDateSchema,
  summary: LocalizedTextSchema,
  body: z.array(ContentBlockSchema).optional(),
  airports: z.array(z.string().regex(/^[a-z]{3}$/)).optional(),
  sources: SourceIdsSchema,
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

/* -------------------------------------------------------------------------------------------
 * Maps
 * ---------------------------------------------------------------------------------------- */

/** Every map is drawn in this coordinate space (SVG `viewBox="0 0 1000 600"`). */
export const MAP_VIEWBOX = { width: 1000, height: 600 } as const;

export const MAP_POI_KINDS = [
  ...FACILITY_CATEGORIES,
  'gate',
  'check-in',
  'security',
  'immigration',
  'customs',
  'baggage-reclaim',
  'entrance',
  'meeting-point',
  'lift',
  'train',
  'bus',
  'taxi',
  'parking',
  'shuttle',
  'dine',
  'shop',
] as const;
export const MapPoiKindSchema = z.enum(MAP_POI_KINDS);
export type MapPoiKind = z.infer<typeof MapPoiKindSchema>;

/** Labels for the map-only point kinds (facility kinds use `FACILITY_CATEGORY_META`). */
export const MAP_POI_KIND_LABELS: Record<Exclude<MapPoiKind, FacilityCategory>, LocalizedText> = {
  gate: lt('Gates', 'Pintu berlepas'),
  'check-in': lt('Check-in', 'Daftar masuk'),
  security: lt('Security screening', 'Pemeriksaan keselamatan'),
  immigration: lt('Immigration', 'Imigresen'),
  customs: lt('Customs', 'Kastam'),
  'baggage-reclaim': lt('Baggage reclaim', 'Tuntutan bagasi'),
  entrance: lt('Entrance', 'Pintu masuk'),
  'meeting-point': lt('Meeting point', 'Tempat menunggu'),
  lift: lt('Lift', 'Lif'),
  train: lt('Train', 'Tren'),
  bus: lt('Bus', 'Bas'),
  taxi: lt('Taxi', 'Teksi'),
  parking: lt('Parking', 'Tempat letak kereta'),
  shuttle: lt('Shuttle', 'Bas ulang-alik'),
  dine: lt('Food and drink', 'Makanan dan minuman'),
  shop: lt('Shops', 'Kedai'),
};

/** Label for any map point kind in the given language. */
export function mapPoiKindLabel(kind: MapPoiKind, lang: Lang): string {
  if (kind in FACILITY_CATEGORY_META) {
    return pick(FACILITY_CATEGORY_META[kind as FacilityCategory].label, lang);
  }
  return pick(MAP_POI_KIND_LABELS[kind as Exclude<MapPoiKind, FacilityCategory>], lang);
}

const MapCoordSchema = {
  x: z.number().min(0).max(MAP_VIEWBOX.width),
  y: z.number().min(0).max(MAP_VIEWBOX.height),
};

export const MapLevelSchema = z.strictObject({
  id: z.string().min(1),
  name: LocalizedTextSchema,
  /** Display order, low to high. */
  order: z.number().int(),
  note: LocalizedTextSchema.optional(),
});
export type MapLevel = z.infer<typeof MapLevelSchema>;

export const MapShapeSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('rect'),
    ...MapCoordSchema,
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  z.strictObject({
    type: z.literal('polygon'),
    points: z.array(z.tuple([z.number(), z.number()])).min(3),
  }),
]);
export type MapShape = z.infer<typeof MapShapeSchema>;

export const MapZoneSchema = z.strictObject({
  id: IdSchema,
  /** `MapLevel.id` */
  level: z.string().min(1),
  name: LocalizedTextSchema,
  kind: z.enum(['landside', 'airside', 'pier', 'satellite', 'transport', 'kerb', 'link']),
  shape: MapShapeSchema,
});
/** A named area on one level, drawn as a rectangle or polygon. */
export type MapZone = z.infer<typeof MapZoneSchema>;

export const MapPoiSchema = z.strictObject({
  id: IdSchema,
  level: z.string().min(1),
  zone: z.string().optional(),
  ...MapCoordSchema,
  name: LocalizedTextSchema,
  kind: MapPoiKindSchema,
  /** The content record this point stands for, when there is one. */
  ref: z
    .strictObject({
      type: z.enum(['facility', 'outlet', 'transport', 'car-park']),
      id: z.string().min(1),
    })
    .optional(),
  /** The walk-graph node you route to or from for this point. */
  node: z.string().min(1),
  /**
   * `official` or `estimated`: the place exists there according to a source (see `sources`), though
   * the drawn position is still schematic. `demo`: an illustrative point with no source.
   */
  provenance: ProvenanceSchema,
  sources: z.array(z.string().min(1)).optional(),
});
/** A point of interest on a map. */
export type MapPoi = z.infer<typeof MapPoiSchema>;

export const MapNodeSchema = z.strictObject({
  id: z.string().min(1),
  level: z.string().min(1),
  ...MapCoordSchema,
});
/** A node of the walk graph. */
export type MapNode = z.infer<typeof MapNodeSchema>;

export const MapEdgeSchema = z.strictObject({
  from: z.string().min(1),
  to: z.string().min(1),
  /** Length in metres. On schematic maps this is an illustrative figure. */
  metres: z.number().nonnegative(),
  /** False for escalators and stairs: excluded when routing with `accessibleOnly`. */
  accessible: z.boolean(),
  kind: z.enum(['walk', 'lift', 'escalator', 'stairs', 'travelator', 'train', 'bus']),
  /** Fixed time for rides (lift, train). When set, it replaces the walking-speed estimate. */
  fixedMinutes: z.number().nonnegative().optional(),
  note: LocalizedTextSchema.optional(),
});
/** An undirected connection between two nodes. */
export type MapEdge = z.infer<typeof MapEdgeSchema>;

export const MapModelSchema = z.strictObject({
  id: IdSchema,
  airport: z.string().regex(/^[a-z]{3}$/),
  terminal: TerminalIdSchema,
  name: LocalizedTextSchema,
  /**
   * Always true in this prototype: the map is a demonstration diagram, not a floor plan.
   * Every map screen must say so.
   */
  schematic: z.literal(true),
  note: LocalizedTextSchema,
  levels: z.array(MapLevelSchema).min(1),
  zones: z.array(MapZoneSchema),
  pois: z.array(MapPoiSchema),
  nodes: z.array(MapNodeSchema),
  edges: z.array(MapEdgeSchema),
  asOf: z.string().optional(),
  sources: SourceIdsSchema,
});
/**
 * A schematic terminal map: levels, zones, points of interest and a walk graph.
 * Route over it with `shortestPath` from `@/lib/map`.
 */
export type MapModel = z.infer<typeof MapModelSchema>;

/* -------------------------------------------------------------------------------------------
 * Per-airport content bundle
 * ---------------------------------------------------------------------------------------- */

/**
 * What a per-airport content file (`src/content/airports/<code>.ts`) exports.
 * Build it with `defineAirportContent` so that missing collections default to empty arrays.
 */
export interface AirportContentModule {
  /** Airport slug, for example `pen`. */
  airport: string;
  facilities: Facility[];
  outlets: Outlet[];
  transport: TransportOption[];
  carParks: CarPark[];
  airlines: AirlineAtAirport[];
  notices: Notice[];
  maps: MapModel[];
  guidesNotes: GuideNote[];
  /** Sources used only by this airport's content. They are merged into the source registry. */
  sources: Source[];
}

/** Helper for content authors: fills every collection you leave out with an empty array. */
export function defineAirportContent(
  input: Pick<AirportContentModule, 'airport'> & Partial<Omit<AirportContentModule, 'airport'>>,
): AirportContentModule {
  return {
    airport: input.airport,
    facilities: input.facilities ?? [],
    outlets: input.outlets ?? [],
    transport: input.transport ?? [],
    carParks: input.carParks ?? [],
    airlines: input.airlines ?? [],
    notices: input.notices ?? [],
    maps: input.maps ?? [],
    guidesNotes: input.guidesNotes ?? [],
    sources: input.sources ?? [],
  };
}

/**
 * Everything published about one airport, as returned by `getAirportContent(slug)`.
 * Collections are empty (never undefined) for airports without a content file.
 */
export interface AirportContent {
  airport: Airport;
  /** False when no content file is registered yet for this airport. */
  hasContent: boolean;
  facilities: Facility[];
  outlets: Outlet[];
  transport: TransportOption[];
  carParks: CarPark[];
  airlines: AirlineAtAirport[];
  notices: Notice[];
  maps: MapModel[];
  guidesNotes: GuideNote[];
}

/* -------------------------------------------------------------------------------------------
 * Validation
 * ---------------------------------------------------------------------------------------- */

/** The whole content layer, as passed to `validateContent`. */
export interface ContentBundle {
  sources: Source[];
  airports: Airport[];
  airportContent: AirportContentModule[];
  guides: Guide[];
  faqs: Faq[];
  notices: Notice[];
  corporatePages: CorporatePage[];
  news: NewsItem[];
}

/** One validation problem: where it is and what is wrong. */
export interface ContentIssue {
  path: string;
  message: string;
}

function schemaIssues<T>(schema: z.ZodType<T>, items: readonly unknown[], label: string): ContentIssue[] {
  const issues: ContentIssue[] = [];
  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      const id = identify(item) ?? String(index);
      for (const issue of result.error.issues) {
        issues.push({ path: `${label}[${id}].${issue.path.join('.')}`, message: issue.message });
      }
    }
  });
  return issues;
}

function identify(item: unknown): string | undefined {
  if (typeof item !== 'object' || item === null) return undefined;
  const record = item as Record<string, unknown>;
  for (const key of ['id', 'slug', 'code']) {
    if (typeof record[key] === 'string') return record[key];
  }
  return undefined;
}

function duplicateIssues(ids: readonly string[], label: string): ContentIssue[] {
  const seen = new Set<string>();
  const issues: ContentIssue[] = [];
  for (const id of ids) {
    if (seen.has(id)) issues.push({ path: `${label}[${id}]`, message: 'Duplicate id' });
    seen.add(id);
  }
  return issues;
}

function mapIssues(map: MapModel, refIds: Record<'facility' | 'outlet' | 'transport' | 'car-park', Set<string>>): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const at = `maps[${map.id}]`;
  const levels = new Set(map.levels.map((level) => level.id));
  const zones = new Set(map.zones.map((zone) => zone.id));
  const nodes = new Set(map.nodes.map((node) => node.id));

  issues.push(...duplicateIssues(map.nodes.map((n) => n.id), `${at}.nodes`));
  issues.push(...duplicateIssues(map.pois.map((p) => p.id), `${at}.pois`));
  issues.push(...duplicateIssues(map.zones.map((z) => z.id), `${at}.zones`));

  for (const zone of map.zones) {
    if (!levels.has(zone.level)) issues.push({ path: `${at}.zones[${zone.id}]`, message: `Unknown level ${zone.level}` });
  }
  for (const node of map.nodes) {
    if (!levels.has(node.level)) issues.push({ path: `${at}.nodes[${node.id}]`, message: `Unknown level ${node.level}` });
  }
  for (const poi of map.pois) {
    const where = `${at}.pois[${poi.id}]`;
    if (!levels.has(poi.level)) issues.push({ path: where, message: `Unknown level ${poi.level}` });
    if (poi.zone && !zones.has(poi.zone)) issues.push({ path: where, message: `Unknown zone ${poi.zone}` });
    if (!nodes.has(poi.node)) issues.push({ path: where, message: `Unknown node ${poi.node}` });
    if (poi.ref && !refIds[poi.ref.type].has(poi.ref.id)) {
      issues.push({ path: where, message: `Unknown ${poi.ref.type} ${poi.ref.id}` });
    }
    if (poi.provenance !== 'demo' && !(poi.sources && poi.sources.length > 0)) {
      issues.push({ path: where, message: 'A point that is not demo needs sources' });
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const edge of map.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) {
      issues.push({ path: `${at}.edges[${edge.from}>${edge.to}]`, message: 'Edge refers to an unknown node' });
      continue;
    }
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
    adjacency.set(edge.to, [...(adjacency.get(edge.to) ?? []), edge.from]);
  }
  const first = map.nodes[0];
  if (first) {
    const reached = new Set<string>([first.id]);
    const queue = [first.id];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of adjacency.get(current) ?? []) {
        if (!reached.has(next)) {
          reached.add(next);
          queue.push(next);
        }
      }
    }
    for (const node of map.nodes) {
      if (!reached.has(node.id)) {
        issues.push({ path: `${at}.nodes[${node.id}]`, message: 'Node is not connected to the walk graph' });
      }
    }
  }
  return issues;
}

/**
 * Validate the whole content layer. Returns an empty array when everything is sound.
 *
 * Checks: every record against its schema; unique ids; every `sources` id exists; every item
 * points at a registered airport and one of its terminals; map references resolve and each walk
 * graph is connected; `official` guide steps carry sources; car parks with published rates have
 * at least one band.
 */
export function validateContent(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];

  issues.push(...schemaIssues(SourceSchema, bundle.sources, 'sources'));
  issues.push(...schemaIssues(AirportSchema, bundle.airports, 'airports'));
  issues.push(...schemaIssues(GuideSchema, bundle.guides, 'guides'));
  issues.push(...schemaIssues(FaqSchema, bundle.faqs, 'faqs'));
  issues.push(...schemaIssues(NoticeSchema, bundle.notices, 'notices'));
  issues.push(...schemaIssues(CorporatePageSchema, bundle.corporatePages, 'corporatePages'));
  issues.push(...schemaIssues(NewsItemSchema, bundle.news, 'news'));

  const allSources = [...bundle.sources, ...bundle.airportContent.flatMap((content) => content.sources)];
  const sourceIds = new Set(allSources.map((source) => source.id));
  issues.push(...duplicateIssues(allSources.map((s) => s.id), 'sources'));
  issues.push(...duplicateIssues(bundle.airports.map((a) => a.code), 'airports'));
  issues.push(...duplicateIssues(bundle.guides.map((g) => g.slug), 'guides'));
  issues.push(...duplicateIssues(bundle.faqs.map((f) => f.id), 'faqs'));
  issues.push(...duplicateIssues(bundle.corporatePages.map((p) => p.slug), 'corporatePages'));
  issues.push(...duplicateIssues(bundle.news.map((n) => n.slug), 'news'));

  const terminalsByAirport = new Map<string, Set<string>>(
    bundle.airports.map((airport) => [airport.slug, new Set(airport.terminals.map((t) => t.id))]),
  );

  const checkSources = (path: string, ids: readonly string[] | undefined): void => {
    for (const id of ids ?? []) {
      if (!sourceIds.has(id)) issues.push({ path, message: `Unknown source id "${id}"` });
    }
  };
  const checkPlace = (path: string, airport: string | undefined, terminal?: string): void => {
    if (airport === undefined) return;
    const terminals = terminalsByAirport.get(airport);
    if (!terminals) {
      issues.push({ path, message: `Unknown airport "${airport}"` });
    } else if (terminal && !terminals.has(terminal)) {
      issues.push({ path, message: `Airport "${airport}" has no terminal "${terminal}"` });
    }
  };

  for (const airport of bundle.airports) {
    const at = `airports[${airport.code}]`;
    checkSources(at, airport.sources);
    if (airport.slug !== airport.code.toLowerCase()) issues.push({ path: at, message: 'slug must be the lower-case code' });
    if (airport.verification === 'verified' && airport.unverifiedFields.length > 0) {
      issues.push({ path: at, message: 'A verified airport cannot list unverified fields' });
    }
    if (airport.verification === 'unverified' && airport.unverifiedFields.length === 0) {
      issues.push({ path: at, message: 'An unverified airport must say which fields are unverified' });
    }
    for (const contact of airport.contacts) checkSources(`${at}.contacts`, contact.sources);
    for (const terminal of airport.terminals) {
      for (const level of terminal.levels) checkSources(`${at}.terminals[${terminal.id}].levels[${level.id}]`, level.sources);
    }
  }

  const allNotices = [...bundle.notices];
  const contentAirports: string[] = [];
  for (const content of bundle.airportContent) {
    const at = `airportContent[${content.airport}]`;
    contentAirports.push(content.airport);
    checkPlace(at, content.airport);

    issues.push(...schemaIssues(SourceSchema, content.sources, `${at}.sources`));
    issues.push(...schemaIssues(FacilitySchema, content.facilities, `${at}.facilities`));
    issues.push(...schemaIssues(OutletSchema, content.outlets, `${at}.outlets`));
    issues.push(...schemaIssues(TransportOptionSchema, content.transport, `${at}.transport`));
    issues.push(...schemaIssues(CarParkSchema, content.carParks, `${at}.carParks`));
    issues.push(...schemaIssues(AirlineAtAirportSchema, content.airlines, `${at}.airlines`));
    issues.push(...schemaIssues(NoticeSchema, content.notices, `${at}.notices`));
    issues.push(...schemaIssues(MapModelSchema, content.maps, `${at}.maps`));
    issues.push(...schemaIssues(GuideNoteSchema, content.guidesNotes, `${at}.guidesNotes`));

    issues.push(...duplicateIssues(content.facilities.map((f) => f.id), `${at}.facilities`));
    issues.push(...duplicateIssues(content.outlets.map((o) => o.id), `${at}.outlets`));
    issues.push(...duplicateIssues(content.outlets.map((o) => o.slug), `${at}.outlets(slug)`));
    issues.push(...duplicateIssues(content.transport.map((t) => t.id), `${at}.transport`));
    issues.push(...duplicateIssues(content.carParks.map((c) => c.id), `${at}.carParks`));
    issues.push(...duplicateIssues(content.guidesNotes.map((n) => n.id), `${at}.guidesNotes`));
    issues.push(...duplicateIssues(content.maps.map((m) => m.id), `${at}.maps`));

    const levelIds = (terminal: string): Set<string> => {
      const airport = bundle.airports.find((a) => a.slug === content.airport);
      return new Set(airport?.terminals.find((t) => t.id === terminal)?.levels.map((l) => l.id) ?? []);
    };
    const poiIds = new Set(content.maps.flatMap((map) => map.pois.map((poi) => poi.id)));

    for (const facility of content.facilities) {
      const where = `${at}.facilities[${facility.id}]`;
      checkSources(where, facility.sources);
      checkPlace(where, facility.airport, facility.terminal);
      if (facility.airport !== content.airport) issues.push({ path: where, message: 'Facility is filed under the wrong airport' });
      if (facility.level && !levelIds(facility.terminal).has(facility.level)) {
        issues.push({ path: where, message: `Unknown level "${facility.level}" for terminal ${facility.terminal}` });
      }
      if (facility.mapPoint && !poiIds.has(facility.mapPoint)) {
        issues.push({ path: where, message: `Unknown map point "${facility.mapPoint}"` });
      }
    }
    for (const outlet of content.outlets) {
      const where = `${at}.outlets[${outlet.id}]`;
      checkSources(where, outlet.sources);
      checkPlace(where, outlet.airport, outlet.terminal);
      if (outlet.mapPoint && !poiIds.has(outlet.mapPoint)) {
        issues.push({ path: where, message: `Unknown map point "${outlet.mapPoint}"` });
      }
    }
    for (const option of content.transport) {
      const where = `${at}.transport[${option.id}]`;
      checkSources(where, option.sources);
      checkPlace(where, option.airport);
      for (const stop of option.boarding) checkPlace(where, option.airport, stop.terminal);
    }
    for (const carPark of content.carParks) {
      const where = `${at}.carParks[${carPark.id}]`;
      checkSources(where, carPark.sources);
      checkPlace(where, carPark.airport, carPark.terminal);
      if (carPark.rateStatus === 'published' && carPark.rates.length === 0) {
        issues.push({ path: where, message: 'rateStatus is "published" but there are no rate bands' });
      }
      if (carPark.rateStatus === 'not-verified' && carPark.rates.length > 0) {
        issues.push({ path: where, message: 'rateStatus is "not-verified" but rate bands are present' });
      }
      for (const band of carPark.rates) {
        if (band.kind === 'per-block' && !band.blockMinutes) {
          issues.push({ path: where, message: 'A per-block band needs blockMinutes' });
        }
        if (band.toMinute !== undefined && band.toMinute <= band.fromMinute) {
          issues.push({ path: where, message: 'A band must end after it starts' });
        }
      }
    }
    for (const airline of content.airlines) {
      const where = `${at}.airlines[${airline.code}]`;
      checkSources(where, airline.sources);
      checkPlace(where, content.airport, airline.terminal);
    }
    for (const note of content.guidesNotes) {
      const where = `${at}.guidesNotes[${note.id}]`;
      checkSources(where, note.sources);
      checkPlace(where, note.airport, note.appliesTo?.terminal);
    }
    const refIds = {
      facility: new Set(content.facilities.map((f) => f.id)),
      outlet: new Set(content.outlets.map((o) => o.id)),
      transport: new Set(content.transport.map((t) => t.id)),
      'car-park': new Set(content.carParks.map((c) => c.id)),
    };
    for (const map of content.maps) {
      const where = `${at}.maps[${map.id}]`;
      checkSources(where, map.sources);
      checkPlace(where, map.airport, map.terminal);
      for (const poi of map.pois) checkSources(`${where}.pois[${poi.id}]`, poi.sources);
      issues.push(...mapIssues(map, refIds));
    }
    allNotices.push(...content.notices);
  }
  issues.push(...duplicateIssues(contentAirports, 'airportContent'));
  issues.push(...duplicateIssues(allNotices.map((n) => n.id), 'notices'));

  for (const notice of allNotices) {
    const where = `notices[${notice.id}]`;
    checkSources(where, notice.sources);
    checkPlace(where, notice.airport, notice.terminal);
    if (notice.validFrom && notice.validTo && Date.parse(notice.validTo) <= Date.parse(notice.validFrom)) {
      issues.push({ path: where, message: 'validTo must be after validFrom' });
    }
  }
  for (const guide of bundle.guides) {
    const where = `guides[${guide.slug}]`;
    checkSources(where, guide.sources);
    for (const airport of guide.airports ?? []) checkPlace(where, airport);
    for (const section of guide.sections) {
      for (const step of section.steps) {
        checkSources(`${where}.${step.id}`, step.sources);
        if (step.provenance === 'official' && !(step.sources && step.sources.length > 0)) {
          issues.push({ path: `${where}.${step.id}`, message: 'An official step needs its own sources' });
        }
      }
    }
  }
  for (const faq of bundle.faqs) {
    checkSources(`faqs[${faq.id}]`, faq.sources);
    for (const airport of faq.airports ?? []) checkPlace(`faqs[${faq.id}]`, airport);
  }
  for (const page of bundle.corporatePages) {
    checkSources(`corporatePages[${page.slug}]`, page.sources);
    for (const block of page.body) {
      if (block.type === 'fact') checkSources(`corporatePages[${page.slug}].fact`, block.sources);
    }
  }
  for (const item of bundle.news) {
    checkSources(`news[${item.slug}]`, item.sources);
    for (const airport of item.airports ?? []) checkPlace(`news[${item.slug}]`, airport);
  }

  return issues;
}
