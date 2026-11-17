# Hand-off: ground transport planner and parking

Owner: transport. Status (17 Nov 2026): `npx tsc --noEmit` clean; `npx eslint` clean on every file below;
`npx vitest run src/components/transport src/components/parking src/lib/i18n` 30 passed;
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/transport.spec.ts` 14 passed (desktop and
phone), axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) zero violations on both pages, cards and table views.
No sideways scroll at 360 px at 100% and 125% text. `next build` was not run (shared folder).

## Routes

| Route | Rendering | What it does |
|---|---|---|
| `/[lang]/[airport]/transport` | Static per airport with transport content (`sectionStaticParams('transport')`); the planner reads `?to=&by=&view=&t=` inside `<Suspense>`, whose fallback is the full planner in its default state (what no-JS visitors and crawlers get) | Planner, missing modes, between the terminals, inside the terminal, content gaps |
| `/[lang]/[airport]/parking` | Static per airport with car parks; the list reads `?t=` inside `<Suspense>` | Premium-parking warning, rates status, stay estimate, car parks (cards or table) with demo space, "Where I parked", gaps |

Both export metadata (title and description from `transportPages.*.meta*`), use `PageHeader` (one `h1`) and
`Breadcrumbs`, and work in `en` and `ms` (TranslationNotice when content falls back to English).

## What was built

**Planner.** Places come from the destinations in the content (`placeChoices`, most widely served first;
KL Sentral at KLIA). Priority (price, time, convenience, accessibility) and view (cards, table) are native
radios (`SegmentedControl`). Ranking is `compareTransport` on the options as they stand today
(`optionsForDay`), so the fare in force is the one compared. Door-to-door modes with no destination list
(e-hailing) rank with the rest but never show a number ("Door to door: no fixed route or fare table").
Options that do not list the chosen place are set apart with the places they do list. The sort note says
that options without the number come last; the convenience ranking carries an `estimated` tag.
Each option shows: fare (`from` when the basis is `from`, "Free" at zero, the basis caption), the period
that applies today and the next change, journey time, frequency, hours, boarding points (terminal badge,
level, published door or bay note; honours `?t=`), payment, step-free status with icon and words, booking
link only when `bookingUrl` exists, provenance, sources and as-of date, and one "Not published: …" line
for the missing facts. Modes with no option (car rental; private car points to parking) are listed as not
published with the official site.

**Fare validity.** The content encodes the KLIA Ekspres change in destination names ("KL Sentral (fare
until 31 December 2026)", "(fare from 1 January 2027)"). `farePeriods` parses those dates (English name,
strict pattern, never guessed); `fareInfo` picks today's period from `useNow` in airport time. Before the
clock is read (server HTML) both fares are listed with their dates. After 1 January 2027 RM 65 applies and
the "Changes to" chip disappears; an ended fare with no successor reads "not published".

**Between the terminals (KLIA).** Inter-terminal options that board at two or more terminals (train RM 2,
free shuttle loop with its T1 Door 4 and T2 Bay A10 stops), led by the airport-wide transit note ("no airside
link") as a warning callout with sources. Single-terminal movers (Aerotrain) are under "Inside the terminal".

**Parking.** Preferred Parking warning from the `<slug>-preferred-parking-warning` note, shown as a
critical callout at the top, a warning band on that card and table row, in the calculator when it is
chosen, and in "Where I parked". Rates by `rateStatus`:
- `published`: calculator with `calculateParking` (total, breakdown, daily cap chip, estimate note).
- `not-verified`: no fee is calculated. Each card quotes the content's figures under "What our sources
  say" with sources, "Sources differ. Check the official page." and a link to the official booking page.
  When a daily maximum is published (KLIA Long Term Car Park, RM 32) the calculator shows only
  "At most RM 32 × started 24-hour periods", labelled estimated, with the assumption stated
  (`dailyMaxCeiling`).
Arrival defaults to the next quarter hour (airport time) once the clock is read; quick stays 3 h, 1, 3, 7
days. Demo space comes from `getParkingAvailabilityProvider(now)` under a compact `DemoDataBanner`, a
`Freshness` row and a `demo` tag on every value. "Where I parked" saves `{ airport, carParkId, level, zone,
note }` with `useSavedJourney().setParkedCar`; the flights team's `ParkedCarCard` shows it on `/journey`.

## Files

- Pages: `src/app/[lang]/[airport]/transport/page.tsx`, `src/app/[lang]/[airport]/parking/page.tsx`
- Transport: `src/components/transport/` `transport-logic.ts` (+ `.test.ts`), `transport-types.ts`,
  `transport-data.server.ts`, `transport-planner.tsx`, `transport-planner-url.tsx`,
  `transport-option-card.tsx`, `transport-table.tsx`, `transport-values.tsx`, `terminal-transfers.tsx`
- Parking: `src/components/parking/` `parking-logic.ts` (+ `.test.ts`), `parking-types.ts`,
  `parking-data.server.ts`, `parking-calculator.tsx`, `car-park-list.tsx`, `car-park-list-url.tsx`,
  `car-park-card.tsx`, `car-park-values.tsx`, `parked-car-control.tsx`
- Copy: `src/lib/i18n/features/transport.ts` (`transportPages.*`, both languages). Tests: `e2e/transport.spec.ts`

## How to test

1. `/en/kul/transport`: KL Sentral by lowest price lists KLIA Ekspres RM 55 "Applies today · Until
   31 December 2026" and "Changes to RM 65 on 1 January 2027", then the coach and e-hailing as "Not
   published". Switch to Shortest time, Least effort, Step-free, Table; the URL follows and survives reload.
   Pick Salak Tinggi: the stopping train ranks; others appear under "Not listed for Salak Tinggi".
2. Click "Terminal 2" in the airport header: boarding points narrow to T2 ("No boarding point listed at
   Terminal 2" for the coach). Scroll to "Between the terminals".
3. `/en/kul/parking`: warnings at the top; calculator on the Long Term Car Park says "At most RM 32",
   3 days "At most RM 96"; Terminal 1 Car Park gives no figure. Table view on a phone scrolls inside its region.
4. Save a parking note, open My journey. Try `/ms/...`, dark theme, 125% text, keyboard only.
5. Fix the clock to 2027-01-02 (see the spec) to see the new fare apply.

## Known gaps

- The published-rate calculator path is covered by unit tests only: no car park in the content has
  `rateStatus: 'published'` today, so it has not been seen with real data in a browser.
- Fare periods rely on the naming convention above until the content model has validity fields.
- Native date and time inputs follow the browser's locale (12-hour in an en-US browser).
- The parking cards/table choice is not kept in the URL (the planner's is).
- Malay copy is a draft pending native review.

## Requests to other teams

- Domain: add `validFrom` / `validUntil` (date keys) to `TransportDestination`, so fare periods stop
  depending on destination names; `transport-logic.ts` would then read the fields first.
- Content: official parking rate cards (to turn on the calculator), car rental and taxi fare tables,
  rail station levels, coach bays at T2, payment methods and step-free facts for each mode.
- Design system: make `TableScroll` `position: relative`. Without it, `sr-only` text inside a wide table
  escapes the scroll region and the whole page scrolls sideways on phones (worked around here with
  `className="relative"`). Also consider a `Th` variant for row headers.
- Flights (`/journey`): `ParkedCarCard` could repeat the premium-parking warning when the saved car park
  is of type `preferred`.
