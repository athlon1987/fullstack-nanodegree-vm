# Hand-off: domain and data layer

Owner: domain. Scope: `src/content/**`, `src/lib/**` (except `src/lib/concierge/`), `src/app/api/flights`,
`src/app/api/health`, `vitest.config.ts`. Status: `npx tsc --noEmit` clean, `npx eslint src/lib src/content
src/app/api` clean, `npx vitest run` 179 tests in 14 files passing. `next build` was not run (shared folder).

Exported names and types below are the contract. If something is missing, ask the domain owner rather than
editing these files.

## 1. Five rules before you import anything

1. **Server vs client imports.** Server Components may import `@/content`, `@/lib/i18n`, `@/lib/search`.
   Client Components must NOT: those pull in every airport's content or both dictionaries. On the client use
   `@/content/types`, `@/content/airports`, `@/lib/i18n/client`, `@/lib/i18n/translate` (types),
   `@/lib/search/engine`, and take content as props. Everything else under `@/lib` is client-safe.
2. **Never read the clock in render** (server or client: it fails the build). Every time-dependent function
   takes `now`. On the client get it from `useNow()` (`number | null`; `null` means "render the placeholder").
3. **Demo data is always labelled.** Every `Flight`, `WaitTime` and `ParkingAvailability` has `isDemo: true`;
   `provider.meta()` gives the label and disclaimer text in both languages.
4. **Every published item has `sources: string[]`.** Resolve with `resolveSources(ids)` from `@/content`.
   A source `url` may be an internal path (`/about-this-prototype`): pass it through `localeHref`.
5. **Hrefs in data have no locale prefix** (`/kul/map`). Always wrap with `localeHref(lang, href)`.

## 2. API reference

### Content model: `@/content/types` (client-safe; zod schema `XSchema` next to every type)

| Export | What it is |
|---|---|
| `Lang`, `LANGS`, `DEFAULT_LANG`, `isLang(v)` | Languages `'en' \| 'ms'` |
| `LocalizedText`, `pick(text, lang)`, `hasTranslation(text, lang)`, `lt(en, ms?)` | Bilingual content text; `hasTranslation` false means show `TranslationNotice` |
| `Provenance` (`official \| estimated \| suggestion \| demo`), `PROVENANCES` | Guidance tag for `ProvenanceTag` |
| `Source`, `SourceKind` | Citable source (`kind`: official, government, operator, news, aggregator, other) |
| `Airport`, `Terminal`, `TerminalId` (`T1 \| T2 \| MAIN`), `Level`, `Coordinates`, `Contact` | Registry records; `Airport.verification` + `unverifiedFields` |
| `Facility`, `FacilityCategory`, `FACILITY_CATEGORIES`, `FACILITY_CATEGORY_META`, `facilityCategoryLabel(c, lang)` | Facilities (lounges and hotels are facilities); labels in both languages plus a semantic `icon` key |
| `Outlet`, `Zone`, `Hours`, `Money` | Commerce; `Hours` kinds `24h`, `daily`, `text` |
| `TransportOption`, `TransportDestination`, `TransportMode`, `TRANSPORT_MODE_LABELS` | Ground transport; `fare` / `durationMinutes` undefined means not published |
| `CarPark`, `RateBand` | Parking; `rateStatus: 'published' \| 'not-verified'` |
| `AirlineAtAirport` | Published airline fact with `basis: 'airline' \| 'airport' \| 'third-party'` |
| `Guide`, `GuideSection`, `GuideStep`, `GuideNote`, `Faq`, `Notice`, `CorporatePage`, `NewsItem`, `ContentBlock` | Editorial content; each `GuideStep` has its own provenance |
| `MapModel`, `MapLevel`, `MapZone`, `MapPoi`, `MapNode`, `MapEdge`, `MapPoiKind`, `mapPoiKindLabel(k, lang)`, `MAP_VIEWBOX` | Schematic map in a 1000 x 600 space; `schematic` is always `true` |
| `AirportContent` | Result of `getAirportContent`: `{ airport, hasContent, facilities, outlets, transport, carParks, airlines, notices, maps, guidesNotes }` |
| `AirportContentModule`, `defineAirportContent(input)` | What a per-airport content file exports |
| `validateContent(bundle)`, `ContentIssue` | Schema and cross-reference validation (run by the tests) |

### Airport registry: `@/content/airports` (client-safe)

| Export | What it does |
|---|---|
| `AIRPORTS` | All 39 airports: 5 international, 17 domestic, 17 STOLports |
| `FEATURED_AIRPORTS`, `FEATURED_AIRPORT_SLUGS` | KUL, PEN, BKI, KCH, LGK, SZB |
| `getAirport(slugOrCode)`, `isAirportSlug(v)` | Case-insensitive lookup |
| `airportsByClassification()`, `airportsByRegion()`, `CLASSIFICATION_LABELS`, `REGION_LABELS` | Grouping and labels |
| `airportSlugs(depths?)` | For `generateStaticParams`, e.g. `airportSlugs(['full', 'essential'])` |
| `terminalLabel(airport, terminal, lang, { short? })` | "KLIA Terminal 1"; single-terminal airports give their short name |
| `isMultiTerminal(a)`, `getTerminal(a, id)`, `defaultTerminal(a)` | Terminal helpers |
| `AIRPORT_CHOICES`, `AirportChoice`, `AirportSelection`, `findAirportChoice(sel)` | Switcher rows; `kul-t1` and `kul-t2` map to `{ airport: 'kul', terminal }`, others have no terminal |
| `GROUP_CONTACTS`, `AIRPORT_TIMEZONE` | Group phone and email; `'Asia/Kuala_Lumpur'` |

### Content entry point: `@/content` (SERVER ONLY; re-exports the two modules above)

| Export | What it does |
|---|---|
| `getAirportContent(slug)` | `AirportContent`, with empty arrays when no content file exists; `undefined` for unknown airports |
| `airportsWithContent()` | Slugs that have a content file (today: `kul`) |
| `getSource(id)`, `resolveSources(ids)`, `ALL_SOURCES` | Source lookup |
| `getNotices(airport?)`, `currentNotices(notices, now, opts?)`, `noticeState(n, now)`, `sortNotices`, `NETWORK_NOTICES` | Notices; state is `upcoming \| active \| expired` |
| `GUIDES`, `getGuide`, `guideSlugs`, `guidesForAudience`, `guidesForAirport` | Guides |
| `FAQS`, `HELP_TOPICS`, `getFaq`, `getHelpTopic`, `helpTopicSlugs`, `faqsByTopic(topic, airport?)`, `faqsForAirport` | Help centre |
| `CORPORATE_PAGES`, `NEWS_ITEMS`, `getCorporatePage`, `corporatePagesBySection`, `corporatePageSlugs`, `getNewsItem`, `latestNews(limit?)` | Corporate |
| `validateAllContent()` | Validates everything that is registered |

### i18n: `@/lib/i18n` (server), `@/lib/i18n/client` (client), `@/lib/locale`

| Export | What it does |
|---|---|
| `getT(lang)` | Server translator: `t('nav.flights')`, `t('freshness.updated', { time })`, `t.count('search.resultsCount', n)`, `t.lang` |
| `getDictionary(lang)`, `toLang(param)`, `langParams()` | For the root layout and `generateStaticParams` |
| `I18nProvider({ lang, dictionary, children })` | Client provider; the root layout passes `getDictionary(lang)` |
| `useT()`, `useLang()` | Client translator and language, from context (never from URL hooks) |
| `TKey`, `PluralKey`, `TVars`, `Translator`, `interpolate`, `plural` | From `@/lib/i18n/translate` |
| `localeHref(lang, path)`, `stripLocale(pathname)`, `switchLocalePath(pathname, lang)`, `localeFromPath`, `negotiateLang(acceptLanguage)` | Locale paths; external URLs, `#hash` and `/api/*` are left alone |

Dictionaries: `src/lib/i18n/en.ts` defines the shape, `ms.ts` must satisfy it (a missing key is a compile
error). About 430 keys in sections `common`, `nav`, `journey`, `flights`, `provenance`, `demo`, `freshness`,
`airportSwitcher`, `search`, `concierge`, `preferences`, `notices`, `transport`, `parking`, `map`, `footer`,
`errors`, `empty`, `translation`. Add keys to BOTH files. The Malay copy is a draft pending native review.

### Flights: `@/lib/flights` (client-safe)

| Export | What it does |
|---|---|
| `Flight`, `DemoFlight`, `FlightDirection` (`'d' \| 'a'`), `FlightStatus`, `FLIGHT_STATUSES`, `FlightPlace` | `Flight.number` is `MH2610`; times are ISO with `+08:00`; `gate` / `belt` undefined means not assigned yet |
| `FLIGHT_STATUS_META`, `flightStatusMeta(s)`, `flightStatusLabel(s, lang)`, `StatusTone` | Label (en, ms), `tone` (neutral, positive, warning, critical, muted), `icon` key, `i18nKey` |
| `statusesForDirection(d)`, `isFinalStatus(s)` | For filters |
| `encodeFlightId(parts)`, `decodeFlightId(id)`, `isFlightId(id)`, `flightDesignator(code, number)` | Id format `mh2610-20261117-d` |
| `parseFlightQuery(text)`, `looksLikeFlightQuery(text)` | Understands "MH 2610", "mas2610", "KUL-LHR", "KUL to London", free text |
| `searchFlights(flights, q, { limit?, now? })`, `rankFlights`, `matchFlight` | Ranked search over any `Flight[]` |
| `filterFlights(flights, { direction?, terminal?, status?, from?, to?, airline?, international? })` | Board filters (window uses `estimated`) |
| `sortFlights(flights, by?)`, `groupFlightsByHour(flights)` | Ordering and hour groups (`label: '08:00'`) |
| `formatFlightNumber(flight \| 'MH2610')`, `isInternationalFlight(f)`, `remotePlace(f)` | Display helpers |

### Providers: `@/lib/providers` (client-safe)

| Export | What it does |
|---|---|
| `getFlightProvider(now)` | The flight provider for an instant (demo). Async `listFlights(q)`, `getFlight(id, airport?)`, `search(q)`, plus `listFlightsSync`, `getFlightSync`, `searchSync` and `meta()` |
| `FlightDataProvider`, `FlightListQuery`, `FlightSearchQuery`, `ProviderMeta` | Interfaces; `meta()` is `{ mode, label, generatedAt, refreshSeconds, source, disclaimer }` |
| `boardWindow(now, hoursAhead?, minutesBehind?)` | `{ from, to }` for a live board |
| `hasDemoRoutes(slug)`, `DEMO_AIRPORT_SLUGS` | Whether a demo board exists (STOLports and Melaka have none) |
| `getWaitTimeProvider(now)` | `getWaitTimes({ airport, terminal? })` / `getWaitTimesSync`; `WaitTime` has `checkpoint`, `minutes`, `level`, `trend` |
| `getParkingAvailabilityProvider(now)` | `getAvailability({ airport, carParks })` / `getAvailabilitySync`; `availableBays` only when bays are published |
| `createDemoProvider(now?)`, `DemoFlightProvider`, `demoFlightsForDate`, `buildDemoTimetable`, `DEMO_REFRESH_SECONDS` | Lower-level demo API (`createDemoProvider()` without `now` is for event handlers only) |
| `OfficialFlightProvider`, `toOfficialParams`, `ProviderNotConfiguredError`, `PROVIDER_MODES` | Documented stub for the official flight API; it throws, by design |

### Journey: `@/lib/journey` (client-safe)

| Export | What it does |
|---|---|
| `buildJourney({ flight, mode, airportContent, now, preferences? })` | Ordered `JourneyStep[]` for `departing \| arriving \| transiting \| meeting` |
| `JourneyStep` | `{ id, kind, time?, relative?, title, body, provenance, actions, sources?, notes, state }`; `title`/`body` are `LocalizedText`, `relative` and `actions[].labelKey` are dictionary keys, `state` is `done \| current \| upcoming` |
| `JourneyNote` | Sourced airport fact attached to a step, with its own provenance and sources |
| `JourneyPreferences` | `reducedMobility`, `withChildren`, `checkedBags`, `connection: { type, onwardTerminal, onwardFlight }` |
| `JourneyAirportContent` | `Pick<AirportContent, 'airport' \| 'guidesNotes'>`: pass only this slice to client components |
| `JOURNEY_MODES`, `JourneyMode`, `DEFAULT_JOURNEY_MODE`, `isJourneyMode` | Also in the tiny module `@/lib/journey/modes` |

### Map, parking, transport, search

| Export (import path) | What it does |
|---|---|
| `shortestPath(model, fromId, toId, { accessibleOnly?, profile? })` (`@/lib/map`) | Route by node or POI id: `{ nodes, legs, metres, minutes, levels, accessible, profile }` or `null`; 70 m/min standard, 48 m/min reduced |
| `findPoi`, `poisOnLevel`, `poiForRef(model, type, id)`, `poiForGate(model, 'C12')`, `nearestPoi(model, from, kind)` (`@/lib/map`) | Map lookups |
| `createEdgeBuilder(nodes)`, `schematicMetres` (`@/lib/map/build`) | For authoring maps |
| `calculateParking(carPark, minutes)` (`@/lib/parking`) | `{ total, breakdown, capped, currency: 'MYR', minutes }` or `{ unavailable: true, reason: 'rates-not-verified' \| 'invalid-duration' }` |
| `parkingMinutes(entry, exit)`, `chargeForPeriod(rates, minutes)` (`@/lib/parking`) | Calculator helpers |
| `compareTransport(options, { priority, destination?, modes? })` (`@/lib/transport`) | Scored rows `{ option, destination?, fare?, minutes?, score, rank, basis, labels }`; priority is `price \| time \| convenience \| accessibility` |
| `buildSearchDocuments(lang)` (`@/lib/search`, SERVER) | `SearchDocument[]`: `{ id, type, title, summary, href, airport?, keywords }` |
| `createSearchIndex(docs)`, `searchAll(index, query, { airport?, limit?, types? })`, `expandQuery`, `looksLikeFlightQuery` (`@/lib/search/engine`, client-safe) | MiniSearch with prefix, fuzzy, type weights and synonyms; results grouped by type |

### Client state and time: `@/lib/hooks` (all `'use client'`, hydration-safe)

| Hook | Returns |
|---|---|
| `useNow(intervalMs = 30000)` | `number \| null` (epoch ms; `null` on the server and until the first tick) |
| `useFlightProvider(intervalMs?)` | `DemoFlightProvider \| null`, rebuilt every 30 s; memoise derived lists on it |
| `useAirportContext()` | `{ selection, airport, choice, set(selection), clear(), hydrated }`; `selection` is `null` until the user chooses |
| `useJourneyMode()` | `{ mode, effectiveMode, set(mode), clear(), hydrated }` |
| `useSavedJourney()` | `{ journey: { flights, places, parkedCar }, saveFlight, removeFlight, isFlightSaved, savePlace, removePlace, isPlaceSaved, setParkedCar, clearParkedCar, clearAll, hydrated }` |
| `usePreferences()` | `{ preferences: { theme, textSize, highContrast, reducedMotion }, set(changes), reset(), hydrated }` |
| `usePreferencesSync()` | Call once in the always-mounted shell so other-tab changes apply |
| `useStore(store)`, `useHydrated()` | Generic store subscription; "has the stored value been read yet" |

Related plain modules: `@/lib/preferences` (`PREFERENCES_INIT_SCRIPT`, `DEFAULT_PREFERENCES`, `Preferences`,
`applyPreferences`), `@/lib/stores` (store instances and the `SavedFlight`, `SavedPlace`, `ParkedCarNote`
types), `@/lib/storage` (`createStore`, `storageKey`). Storage keys: `ma:airport:v1`, `ma:journey-mode:v1`,
`ma:journey:v1`, `ma:preferences:v1`.

### Utilities

| Export (import path) | What it does |
|---|---|
| `formatTime(instant)`, `formatDate(instant, lang, style?)`, `formatDateTime`, `formatRelative(target, now, lang)` (`@/lib/time`) | 24-hour airport-local time; styles `short \| medium \| long \| weekday` |
| `nowInAirport(now)`, `dateKey`, `minutesOfDay`, `toIsoWithOffset`, `zonedDateTime(dateKey, minutes)`, `addMinutes`, `minutesBetween`, `relativeMinutes` (`@/lib/time`) | Time arithmetic, all taking the instant explicitly |
| `isOpenAt(hours, instant)` (`@/lib/time`) | `true \| false \| undefined` (undefined for prose-only hours) |
| `timezoneLabel(now)`, `timezoneDiffers(now, viewerTimeZone)` (`@/lib/time`) | "MYT (UTC+8)"; whether to show it |
| `formatCurrency(amount, lang)`, `formatDuration(min, lang)`, `formatDistance(m, lang)`, `formatList(items, lang)`, `formatNumber`, `formatQualifiedNumber(5700, 'over', lang)` (`@/lib/format`) | "RM 12.50", "1 h 25 min", "350 m", "A, B dan C", "over 5,700" |
| `cn(...classes)` (`@/lib/cn`) | clsx + tailwind-merge |

### API routes

| Route | Behaviour |
|---|---|
| `GET /api/flights?airport=kul&direction=d&q=&terminal=&limit=&date=` | `{ meta, query, count, flights }`; empty params ignored; `limit` default 50, capped at 200; 400 with `{ error: { code, message, issues } }`; headers `Cache-Control: no-store`, `X-Data-Mode: demo` |
| `GET /api/health` (`?pretty`) | `{ status, time, providers, demoAirports, build, notice }` |

Both read the request before the clock and export no route segment config. Pages must not depend on them:
use the providers directly.

## 3. Recipes

Root layout (Server Component):

```tsx
import { getDictionary, toLang } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/client';
import { PREFERENCES_INIT_SCRIPT } from '@/lib/preferences';

<html lang={lang} suppressHydrationWarning>
  <head><script dangerouslySetInnerHTML={{ __html: PREFERENCES_INIT_SCRIPT }} /></head>
  <body><I18nProvider lang={lang} dictionary={getDictionary(lang)}>{children}</I18nProvider></body>
</html>
```

Client flight board:

```tsx
'use client';
const provider = useFlightProvider(); // null until hydrated
const flights = useMemo(
  () => provider?.listFlightsSync({ airport, direction, terminal, ...boardWindow(provider.now) }) ?? null,
  [provider, airport, direction, terminal],
);
if (!flights) return <BoardSkeleton />; // then render rows + DemoDataBanner (provider.meta().disclaimer)
```

Journey timeline: the server page passes `{ airport, guidesNotes }` from `getAirportContent(slug)` as a prop;
the client calls `buildJourney({ flight, mode, airportContent, now })` with `now` from `useNow()`.

Search: a Server Component calls `buildSearchDocuments(lang)` and passes the array to the palette, which calls
`createSearchIndex(docs)` on first focus and `searchAll(index, q, { airport })` per keystroke. For flights use
`looksLikeFlightQuery(q)` then `provider.searchSync({ q })`.

`<html>` attribute contract set by the preferences script and hook: `data-theme="light|dark"` (already
resolved; "system" is resolved with `matchMedia`), `data-theme-choice="system|light|dark"`,
`data-text-size="100|112|125"`, `data-contrast="normal|more"`, `data-motion="normal|reduce"`.

## 4. Adding content (content authors)

1. Create `src/content/airports/<code>.ts` exporting `defineAirportContent({ airport: '<code>', ... })`
   (copy the shape of `kul.ts`). Put sources that only this airport uses in its `sources` array.
2. Register it in the ONE map `AIRPORT_CONTENT` in `src/content/index.ts` (marked "REGISTER AIRPORT CONTENT
   HERE").
3. Run `npm run test`: `validateAllContent()` fails on unknown source ids, wrong terminals or levels, typos in
   field names (schemas are strict), duplicate ids, disconnected map graphs and rates that contradict
   `rateStatus`.
4. Guides, FAQs, network notices and corporate pages: append to the arrays in `guides.ts`, `faqs.ts`,
   `notices.ts`, `corporate.ts`. Unknown values stay `undefined`; never guess.

## 5. Decisions

- **Provenance of third-party facts.** `official` means airport, airline (about itself), government, or an
  airport statement reported by the press. Facts supported only by guides or listings are `estimated`, and the
  text says who reports them.
- **Registry verification is strict.** A record is `verified` only when IATA, ICAO and name are all
  search-confirmed. 12 are verified (PEN, BKI, IPH, TGG, KUA, BTU, LMN, SBW, BKM, BBN, LGL, ODN); 27 are
  `unverified`, usually for the ICAO code alone (KUL, LGK, KCH included). Show `unverifiedFields` only where that field is displayed. Long Akah and Long Banga have no
  ICAO code published. Coordinates are approximate and for the schematic map only.
- **Flight ids carry no airport.** `getFlight(id, airport?)` takes the airport as a hint (the detail route
  has it) and otherwise scans all demo airports.
- **The demo timetable repeats daily** (same flight number, same time), while delays (about 14%),
  cancellations (about 1%), gates, belts and counters are seeded per date. Each airport's board is generated
  independently, so a KUL departure and its PEN arrival share a number but not a time.
- **Providers are immutable snapshots of one instant** (`getFlightProvider(now)`), which keeps them pure and
  lets clients memoise on the provider.
- **`demo-routes.ts` is illustrative** (`illustrative: true`) and feeds only the generator. Published airline
  facts are `AirportContent.airlines`, which have no destinations because the research supports none.
- **The KUL map has a concept level `GATES`** for the Contact Pier and Satellite, because the research does
  not give the floor of each gate area. Points are `official`/`estimated` only when a source places them in
  that part of the terminal; illustrative points are `demo` and say so in their names.
- **`I18nProvider` receives the dictionary as a prop** so client bundles carry neither dictionary.
- **`data-theme` is the resolved theme**, so CSS needs only `[data-theme='dark']`.

## 6. Known gaps

- Only KUL has content, and it is a seed: no outlets, no rail, taxi or e-hailing details, no Terminal 2
  content beyond its Calm Room, no parking rates (so `calculateParking` returns `rates-not-verified` for every
  real car park; the calculator is tested with invented tariffs). Facility locations for prayer rooms, medical
  services, ATMs and Lost & Found are unverified and say so.
- The Aerotrain notice (28 November to 1 December 2026) is published as scheduled "subject to an independent
  safety assessment"; whether it went ahead is not confirmed.
- Malay copy (dictionary and content) is a draft pending review by a native-speaking editor.
- `@/content/types` builds its zod schemas at import, so client code that imports `pick` or labels from it
  also loads them. Splitting the few runtime helpers into a schema-free module is a possible optimisation.
- No `server-only` guard on `@/content` and `@/lib/search` (the package is not installed and tests import
  them); rule 1 above is by convention.
- Vitest prints a harmless notice about `vitest.config.ts` being ESM in a CommonJS package. Renaming it to
  `.mts` or adding `"type": "module"` would silence it; neither was in my remit.
- Hooks are not unit-tested in a DOM (no jsdom installed); the stores, the clock and the init script they
  rest on are. Cover the hooks in the Playwright journeys.
- `next build` was not run by me. Points to check in the first build: the two route handlers show as dynamic
  (`ƒ`), and the JSON import of `package.json` in `src/lib/providers/api.ts`.

## 7. Files

`src/content/`: `types.ts`, `sources.ts`, `airports.ts`, `airports/kul.ts`, `guides.ts`, `faqs.ts`,
`notices.ts`, `corporate.ts`, `index.ts`. `src/lib/`: `cn.ts`, `time.ts`, `format.ts`, `locale.ts`,
`parking.ts`, `transport.ts`, `storage.ts`, `stores.ts`, `preferences.ts`, `time-store.ts`, `flights/`,
`providers/`, `journey/`, `map/`, `search/`, `i18n/`, `hooks/`, `testing/fixtures.ts`. `src/app/api/flights/route.ts`,
`src/app/api/health/route.ts`, `vitest.config.ts`, and scripts `typecheck`, `test`, `test:watch` in `package.json`.
Tests sit next to the code as `*.test.ts`.
