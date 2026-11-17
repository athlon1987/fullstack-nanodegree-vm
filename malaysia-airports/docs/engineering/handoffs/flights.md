# Hand-off: flights (board, flight page, My journey)

Owner: flights. Status (17 Nov 2026): `npx tsc --noEmit` clean; `npx eslint` clean on every file below;
`npx vitest run src/components/flights` 26 tests passing (3 files); `e2e/flights.spec.ts` 19 passed and
1 skipped (a download check on the phone project) against the shared dev server, with zero axe violations
(wcag2a, wcag2aa, wcag21aa, wcag22aa) on the board, a flight page, the not-found state and My journey (empty
and filled). Screens reviewed at 390 and 1440 px, light and dark, English and Malay; no sideways scroll at 360 px.
`next build` was not run (shared folder).

## 1. Routes

| Route | Rendering | What it does |
|---|---|---|
| `/[lang]/[airport]/flights` | `generateStaticParams` = `sectionStaticParams('flights')`; static shell, rows on the client | Departures and arrivals tabs (`?dir=d\|a`), search within the board (`?q=`, domain parser, today and tomorrow), status filters (`?s=delayed,cancelled`), KLIA terminal (`?t=T1\|T2`), time window with Earlier and Later (3-hour steps), rows grouped by hour ("From 14:00, Tomorrow" across midnight), save toggles, auto-refresh every 30 s with a Freshness row, demo banner, empty and no-results states |
| `/[lang]/[airport]/flights/[flightId]` | No `generateStaticParams` (ids carry a date): `params` awaited inside Suspense, render per request; `robots: noindex` | Status hero (status chip, scheduled and estimated times side by side, terminal, check-in row and counters, gate or "Gate not yet assigned", boarding and gate-close times, belt for arrivals, codeshares, aircraft), Save, Share (Web Share API, copy-link fallback), Add to calendar (.ics), opt-in demo alerts, the `buildJourney` timeline with a provenance tag on every step and note, "If your flight is delayed or cancelled", and the airline's published facts at the airport with sources |
| `/[lang]/journey` | Static (lang from the root layout); personal data after hydration | Saved flights with demo status and their next step, the selected flight's timeline, the parked-car note (add, edit, clear), saved places, Clear my journey with a confirmation dialog, "Saved on this device only" line, and an empty state that teaches the feature with an inline flight search |

The flight's identity (airline, route, scheduled time) is resolved on the server from the id alone with a
provider fixed at noon on the id's date (`identifyFlight`), so the `h1`, breadcrumbs and metadata are real
without reading the clock. Status always comes from the client provider. Unknown or malformed ids render the
not-found state on the server (200 with `noindex`); ids older than yesterday or more than a week ahead get the
"left the board" / "not on the board yet" state on the client, with today's flight of the same number when it runs.

## 2. Files

All mine. Pages: `src/app/[lang]/[airport]/flights/page.tsx`, `.../flights/[flightId]/page.tsx`,
`src/app/[lang]/journey/page.tsx`. Copy: `src/lib/i18n/features/flights.ts` (namespace `flightPages`, en + ms).

`src/components/flights/`:
- Base components (shell's, extended backward compatibly): `flight-board.tsx` adds optional `groupByHour`,
  `timeZone`, `dayLabel`, `before`, `after`, `empty`, `savedIds`, `onSaveChange`; `flight-row.tsx` adds optional
  `saved` and `onSaveChange` (a bookmark toggle). Home and airport previews are unchanged.
- Board: `flight-board-explorer.tsx` (URL state, pools, announcements), `board-toolbar.tsx`, `board-model.ts`.
- Flight page: `flight-detail.tsx`, `flight-status-hero.tsx`, `flight-actions.tsx`, `flight-alerts-panel.tsx`,
  `flight-not-found.tsx`, `journey-timeline.tsx`, `identify-flight.ts`; server-only `disruption-help.tsx`
  and `airline-facts.tsx` (they import `@/content` / `@/lib/i18n`; never import them from a client file).
- My journey: `my-journey.tsx`, `saved-flight-card.tsx`, `parked-car-card.tsx`, `saved-places.tsx`,
  `clear-journey.tsx`, `journey-empty.tsx`, `saved-flight.ts`.
- Shared logic: `flight-changes.ts` (diffs between refreshes), `flight-watcher.tsx` (polite announcer and demo
  notifications), `flight-alerts.ts` (permission hook, `ma:flight-alerts:v1` store), `ics.ts` (RFC 5545).
- Tests: `board-model.test.ts`, `flight-changes.test.ts`, `ics.test.ts`; `e2e/flights.spec.ts`.

## 3. Behaviour worth knowing

- **Demo labelling**: the board, the hero and My journey's flight list sit under `DemoDataBanner`; single rows
  elsewhere (today's same flight) carry a demo `ProvenanceTag`; .ics titles say "(demonstration)" and the
  description starts with the disclaimer; every notification title starts with "Demo:".
- **Announcements**: the board's Freshness row is `live="off"`. Changes (status, time, gate, belt) are
  announced politely only for saved flights (`FlightWatcher`), on the board, the flight page (when saved) and
  My journey. The number of flights shown is announced once, 0.5 s after the visitor changes a filter, never on
  an automatic refresh.
- **Alerts**: "Turn on demo alerts" calls `Notification.requestPermission()` from the click; nothing is sent
  without permission; alerts only fire while a page is open (no push server) and the panel says so.
- **Terminal filter**: KLIA's terminal is chosen with the terminal chips in the airport header (they write
  `?t=`). The board reads it, names it in the subtitle, and shows a pressed chip in the status row that clears
  it. A second three-way control was removed after review: it duplicated the header 200 px lower.
- **Disruption block** points to the airline, `/help/flights`, `/help` and `/notices`; it states no passenger
  rights. It moves above the timeline when the flight is delayed or cancelled. Tagged `suggestion`.
- **Timeline actions** to sections an airport lacks (for example `/pen/map`) are dropped using
  `useSectionAvailability()`.
- **Parked-car note**: car parks are offered only from the published list for the chosen airport; level,
  zone and note are the visitor's own words. Empty fields on save clear the note.

## 4. How to test

- `npx vitest run src/components/flights`
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/flights.spec.ts --trace off`
  The spec fixes the browser clock at 18 Nov 2026 09:40 MYT (`page.clock.setFixedTime`) so the board is busy
  and `mh2626-20261118-d` (MH 2626 to Singapore, delayed) is on it whatever day it runs.
- By hand: `/en/kul/flights?dir=a&q=MH`, `/en/kul/flights?dir=d&t=T2&s=delayed`, a flight from the board, Save,
  then `/en/journey`; `/en/kul/flights/zz9999-20261118-d` for the not-found state; Malay at `/ms/...`.
  Late at night the default window is quiet: use Later, or search (search covers today and tomorrow).

## 5. Known gaps

- Saved places: nothing in the app calls `savePlace` yet, so the list shows its empty line until map,
  facilities, commerce or transport add save buttons.
- Alerts only work while a page is open; Android Chrome needs a service worker registration for
  notifications (we fall back to `registration.showNotification` when one exists).
- Hour groups and the window use the scheduled time; a delayed flight stays in its scheduled hour (as on
  airport boards), with the new time shown in the row.
- The detail page renders per request (unknown ids). If the production build complains about
  `generateMetadata` reading params on this route, move the title into the page and keep a static title.
- The shared dev server once kept serving an old copy of the feature dictionary after a file write; changing
  the file's content again (not just `touch`) made it reload.
- Malay copy is a draft pending native review.

## 6. Requests to other teams

- **Shell (foundation-ui)**: keep the airport header's terminal chips preserving other query parameters
  (`hrefFor` does today); the board relies on them as its terminal filter. The smoke test "choosing an airport
  scopes the page and is remembered" failed against the dev server during my run (switcher dialog buttons not
  found); not caused by flights files, worth a look.
- **Guides**: the disruption block and journey steps link to `/help/flights` and `/help`; please keep those slugs.
- **Map, facilities, commerce, transport**: to appear in My journey, call `useSavedJourney().savePlace({ id,
  type, airport, title, href })` with a locale-free `href`.
- **Integration**: confirm in `next build` that `/[lang]/[airport]/flights` is `○` for the demo airports and
  `.../[flightId]` builds as a streamed route.
