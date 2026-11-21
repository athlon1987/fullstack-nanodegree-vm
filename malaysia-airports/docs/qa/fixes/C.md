# Fix log: package C (Airport sections: map, facilities, transport, parking, transit, lounges, shop and dine)

Round: fix round after the QA and panel evaluation, resumed after the interrupted attempt (commit 5d651e6,
files listed in `docs/qa/fixes/_interrupted-attempt.md`). For package C that attempt changed only two e2e
specs (`e2e/commerce.spec.ts` +6/-6 and `e2e/map.spec.ts` +1/-1: test wording for labels package A renamed).
I reviewed both, kept them, and did every finding in this round. Date: 21 November 2026.

## Summary

| ID | Priority | Status | Main files |
|---|---|---|---|
| C-01 | P0 | Fixed for this round; the official tariff and a dated booking deep link need MAHB data (OOS-03) | parking page, `parking-price-matrix.tsx` (new), `parking-logic.ts`, calculator; **cross-package: `src/content/types.ts`, `src/content/airports/kul.ts` (D)** |
| C-02 | P0 | Fixed | `touts-warning.tsx` (new), `transport-logic.ts`, `transport-types.ts`, `transport-data.server.ts`, option card, transport page |
| C-03 | P0 | Fixed | `transit-planner.tsx` |
| C-04 | P0 | Fixed | `map-logic.ts` (`placePosition`), `place-details.tsx`, `place-list.tsx` |
| C-05 | P0 | Fixed on C's side; the home strip is A's (hand-off); hours, prices, images, reserve-and-collect and offers need MAHB data (OOS-05) | `commerce-view.ts`, `outlet-directory.tsx` |
| C-06 | P1 | Fixed in code; the first-request 404 needs `next start` to confirm (test written); flights is B's page (hand-off) | `section-page.ts`, the seven section pages |
| C-07 | P1 | Fixed | `facility-view.ts`, `facilities-directory.tsx`, facilities page |
| C-08 | P1 | Partially fixed: named level change, immigration and customs steps, no "Walk on"; ending at the taxi counter, rail entrance or e-hailing pick-up waits for D to add those map places | `map-logic.ts`, `route-planner.tsx`, `map-explorer.tsx` |
| C-09 | P1 | Fixed | `map-logic.ts` (`placeOptionLabels`), `route-planner.tsx` |
| C-10 | P1 | Fixed | transport page |
| C-11 | P2 | Interim fixed ("Price" joins the one grouped "Not published" line on every lounge card); prices, access rules and booking need each operator (OOS-04) | `lounge-card.tsx` |

Also done from other packages' hand-offs to C: A-28 ("Entry"/"Exit" in the parking calculator), B-13 (the
parking page reads the `from` and `to` that journey links carry), B-01 (the inter-terminal status lines on
the transit page).

## Checks run (shared folder, own dev server on port 3203 with `NEXT_DIST_DIR=.next-C`)

- `npx tsc --noEmit`: clean (whole project).
- `npx eslint` on every owned path and the three owned e2e specs: clean.
- `npx vitest run`: 31 files, 442 tests passing (whole project). New tests: `map-logic.test.ts` (4),
  `commerce-view.test.ts` (2), `transport-logic.test.ts` (2), `parking-logic.test.ts` (5).
- Playwright, `e2e/transport.spec.ts`, `e2e/map.spec.ts`, `e2e/commerce.spec.ts` against the dev server,
  desktop (1440x900) and phone (Pixel 7, 390x844): 62 passed, 2 skipped (the C-06 status test, which needs
  `next start`; see C-06). Three phone failures on the first run were fixed in the specs: two breadcrumb checks
  that package A's compact chrome made invisible on phones by design (A-01; now desktop-only, see hand-offs) and
  an axe `target-size` hit on a filter chip that straddled the sticky header at the scroll position the test
  left (the check now runs from the top of the page).
- Screenshots viewed (8): parking at 390x844 (light; then the matrix alone in dark, and again after the
  column fix), parking at 1440x900, transit verdict card at 390x664, transport top at 390x844, the nursing
  room placeholder at 390 (dark), and the prayer-room details panel at 1440.
- Every changed page checked at 360 px in English and Malay: no sideways scroll, no raw dictionary keys.
- Not run: `next build` (the verification engineer runs it). Status codes (C-06) are not observable on the dev
  server, which answers 200 to every streamed not-found page.

Note for whoever runs a dev server here: Turbopack in this shared folder twice served a stale module after a
dictionary or helper file changed (`ticketChannel is not a function`, raw `transportPages.…` keys). Restarting
my own dev server cleared it; nothing was wrong in the code.

## Cross-package changes

- **`src/content/types.ts` (package D)**, 6 lines: an optional `reportedDailyMax: { amount, source }[]` on
  `CarParkSchema`, documented as "daily maximums quoted by individual sources when rates are not verified;
  shown as a dated range with the source, never as the fee".
- **`src/content/airports/kul.ts` (package D)**, 2 lines: `reportedDailyMax` on the Terminal 1 Car Park
  (RM 52, `kliainfo-parking-rates`) and the Terminal 2 car park (RM 52, `mahb-klia-parking-pages-indexed`).
  Both figures were already in each car park's description with those sources; they are now structured so
  the price matrix can show them. No new fact was added.
- No shared dictionary (`en.ts`, `ms.ts`) and no file of packages A, B or E was touched. New copy is in
  `src/lib/i18n/features/transport.ts`, `map.ts` and `commerce.ts`, in both languages. The transit verdict
  card's two new strings went under `transportPages.transitVerdict` (C's dictionary) instead of D's
  `guides.ts`, so the hand-off to D for verdict strings is not needed.

## Hand-offs still open

| To | What | Why |
|---|---|---|
| A | Use `filterAvailability()` and `withoutUnavailable()` from `src/components/commerce/commerce-view.ts` in `src/components/home/shop-dine-strip.tsx`: offer only the filters the airport's outlets can serve (today at KLIA "Open now" can never return anything). The shop and dine page already drops an unserviceable filter from a link and says why. | C-05 |
| A | The phone rule that hides `[data-page-breadcrumbs]` on airport pages (`globals.css`, A-01) also hides the two-level breadcrumb on outlet pages (KLIA > Shops and food > outlet), the only on-page way back to the directory on a phone. Consider hiding it only for one-item trails. My commerce spec now skips the breadcrumb check on phones. | A-01 side effect |
| B | Add `export const ensureStatic = 'navigation'` to `src/app/[lang]/[airport]/flights/page.tsx` (it already has `generateStaticParams`). 18 of 39 airports have no demo flights, so their `/flights` page can answer 200 on the first request. The C-06 status test leaves flights out until then. | C-06 |
| D | Add the taxi coupon counter, the rail entrance and the e-hailing pick-up as map places in `src/content/airports/kul.ts` (and the lift or ramp between the gates level and Level 3 if a source supports it). The route steps will name them with no code change. | C-08 |
| D | Add a `content.test.ts` rule that a demo map point cannot assert fields its facility lacks. The UI now enforces it (`placePosition`). | C-04 |
| D | Consider a content test that every `reportedDailyMax[].source` is also in the car park's `sources` (the parking view already ignores any that is not). | C-01 |
| D | D-03, D-05, D-10 and the transit-assumptions record hand to C work that depends on D's new codes, pages or fields (as-of codes, the single gap page, fare validity fields, the assumptions record). None exists yet; C will wire them once they land. | D-03, D-05, D-10 |
| MAHB | The official parking tariff and a booking partner link that accepts product and dates (OOS-03); outlet hours, price bands, images, reserve-and-collect and offers (OOS-05); lounge prices, access rules and booking (OOS-04); verified locations of nursing rooms and accessible toilets. | needs MAHB data |

## Findings

### C-01. Parking is not price-first (P0, critical)

**Status:** fixed for this round. The calculator on the official tariff and a dated, attributed booking deep link
are OOS-03 (needs MAHB data).

**What changed**

- `src/components/parking/parking-price-matrix.tsx` (new, server-rendered, works without JavaScript, reads no
  clock): "Prices at a glance", a table of each car park against 1, 3 and 7 days, directly under the page
  title. Each cell comes from `priceRow()`:
  - a published tariff gives an estimate;
  - a published daily maximum gives "at most" (Long Term Car Park: RM 32, 96, 224);
  - unverified rates give the range the sources' own daily maximums give ("≤ RM 52 / 156 / 364" for the
    Terminal 1 Car Park), muted, with a row note "Not verified. RM 52 a day according to klia.info (undated,
    retrieved 17 Nov 2026).", the sources marker and "Check the official rates" linking out;
  - no figure: "No price published".
  Preferred Parking's warning ("Parking for more than a day? Avoid Preferred Parking") is now in its row with a
  link to the card's details. The footer has "Book parking online" (official page), "Estimate your own dates"
  and the link to transport.
- `src/app/[lang]/[airport]/parking/page.tsx`: the matrix leads; the header actions and the two callouts that
  came before it are gone (the "not verified" message is in the matrix lead, the warning in its row); the
  lead is one line. The phone header padding is tighter.
- `src/components/parking/parking-logic.ts`: `MATRIX_DAYS`, `priceCell()`, `priceRow()`, `stampFromIso()`.
- `src/components/parking/parking-types.ts`, `parking-data.server.ts`: `reported` figures on each car park,
  each with its source's publisher, own date (if any) and retrieval date, only from sources the car park cites.
- `src/components/parking/parking-calculator.tsx`: under the result, "Book {car park} on the official site"
  with "Your dates: 20 Nov, 08:00 to 23 Nov, 08:00. Enter them on the official site; it does not take them
  from this page." The official page accepts no product or date parameters that we know of, so the dates are
  shown beside the link (the acceptance's fallback). Labels now say Entry and Exit (A-28 hand-off).
- `src/components/parking/parking-calculator-url.tsx` (new): reads `?from=&to=` (ISO) from journey links and
  fills entry and exit in airport time, with "Dates filled in from your flight" (B-13 hand-off).
- Content (cross-package, see above): `reportedDailyMax` on two KLIA car parks.

**Verified**

- `parking-logic.test.ts`: ceilings for 1, 3 and 7 days, a reported range (one figure and two differing
  figures), "none", an estimate from a published tariff, ISO stamps in airport time, and the KLIA model (the
  Terminal 1 figure carries klia.info and its retrieval date; Preferred Parking has no figure and a warning).
- `e2e/transport.spec.ts`: the matrix, its figures, the not-verified note, the warning row and the booking
  link; the calculator ceiling, the dates beside the booking link, axe; the matrix starts inside the first
  phone screen (390x844) and before the calculator; a journey link fills the dates. Intended behaviour changed,
  so the old parking test was rewritten: the warning and the "not verified" callout moved into the matrix.
- Measured at 390x844 with today's airport chrome: the matrix starts at 340 px; at 1440x900 at 460 px.
  Screenshots at 390 (light and dark) and 1440.

### C-02. Anti-touting guidance and official ticket links (P0)

**Status:** fixed.

**What changed**

- `src/components/transport/touts-warning.tsx` (new): at the top of the transport page, before the comparison,
  a warning headed "Book taxis only at the coupon counters; ignore anyone offering a ride" with the arriving
  guide's statement ("Decline rides offered by people who approach you in the arrival hall…"), its provenance
  and sources, and "Scam alerts: what to do" linking to `/help/scams#scam-touts`. Inside the taxi card the same
  sentence; inside the e-hailing card "Book in the app and meet your driver at the pick-up point; ignore
  anyone offering a ride." Shown only where the Help answer about touts applies to the airport (KLIA) and the
  airport has taxis or e-hailing.
- `transport-data.server.ts`: `toutsView()` reads the guide step (`arriving`, `official-transport`) and the
  FAQ (`scam-touts`) from the content layer; nothing is restated in code.
- `transport-logic.ts`: `servesAnyPlace()`; `withDoorToDoorEntries()` and `fareInfo()` now treat a taxi or
  e-hailing option that lists some places as serving every place, without a fare. The coupon taxi with its
  counters is ranked for KL Sentral and every other city destination instead of sitting under "Not listed".
  The door-to-door route text now reads "Door to door: no fixed route. No fare is published here."
- `transport-types.ts`: `ticketChannel()`, official channels only: an option's booking link, else its
  operator's page among its sources, else the website of its named operator when another cited page of that
  operator is known (KLIA Ekspres and KLIA Transit get kliaekspres.com). Aggregators and news sites are never
  used; taxis and e-hailing get no online ticket link. The cards show "Tickets on the operator's website".

**Verified:** `transport-logic.test.ts` (taxi for every place without a fare; ticket channels, including that an
aggregator gives none); `e2e/transport.spec.ts` on `/en/kul/transport` (warning before the comparison, Help
link, taxi and e-hailing advice in their cards, coupon taxi ranked for KL Sentral with its counters, ticket
link to `https://kliaekspres.com/`, axe) and on `/ms/kul/transport` (Malay warning and Help link). Screenshot
of the phone first screen: the warning is in it.

### C-03. Self-transfer verdict after the steps (P0)

**Status:** fixed.

**What changed:** `src/components/guides/transit-planner.tsx`: a verdict card directly under the form, before the
case and the steps, on phone and desktop: the verdict word as its heading ("Tight"), one sentence, our estimate
against the traveller's time, the separate-tickets warning when it applies, and "If it is tight: what to do"
linking to the page's "If your first flight is late" section. A verdict change is announced politely through
the form's existing status line ("Steps updated for … Tight."). The section after the steps keeps only "How we
estimate it" and the breakdown. New strings are in `transportPages.transitVerdict` (C's dictionary).

**Verified:** `e2e/transport.spec.ts` at 390x664 with the usability inputs (T1 to T2, separate tickets, 3 h):
the card is below the form's last control by less than one screen (measured 77 px), above the steps; changing
the layover to 12 h shows "Looks workable" and the status line announces it. Measured on desktop: the card is at
469 px, the steps at 1,027 px (before: 2,652 px and 4,279 px on the phone). Screenshot at 390x664.

### C-04. Illustrative prayer-room pin with a level and area (P0)

**Status:** fixed.

**What changed:** `map-logic.ts`: `placePosition()`: a demo point linked to a facility may not state a level or
area the facility's record lacks. `place-details.tsx`: the eyebrow drops the level; Level and Area join the
grouped "Not published" line; the position note reads "Position illustrative: level and area not published.
Ask at an information counter or follow the signs." `place-list.tsx`: the list view drops the area for such
points. "Show on map" stays on the facility card, so the map now agrees with the directory.

**Verified:** `map-logic.test.ts` (prayer room; a sourced point and a facility-less demo point are unchanged;
every demo point linked to a facility follows its record); `e2e/map.spec.ts` (`?poi=l5-prayer-room` shows the
note and neither "Level 5: departures" nor "Public area (landside)"; the Calm Room keeps its level). Screenshot
of the panel at 1440.

### C-05. Retail filters that return nothing (P0)

**Status:** fixed on C's side; the home strip is A's (hand-off). Hours, price bands, images, reserve-and-collect
and an offer slot are OOS-05 (needs MAHB data).

**What changed:** `commerce-view.ts`: `filterAvailability()` (which of open now, halal, before or after security
and price the outlets can serve) and `withoutUnavailable()`. `outlet-directory.tsx`: filters that cannot
return anything are not offered; a "Not offered yet" line names them and why ("“Open now” (opening hours)…
not published for these outlets yet"). A link that asks for one (the home strip's `?filters=open-now`) shows
every outlet with the other filters applied and the line "Showing every outlet: we could not apply “Open now”
(opening hours), because that information is not published for these outlets yet." At KLIA today "Open now"
is the only such filter; halal (PAUL Le Cafe) and both sides of security still work.

**Verified:** `commerce-view.test.ts` (every offered KLIA filter returns at least one outlet; `open-now,airside`
drops open now and keeps after security; nothing is dropped when the data can serve it);
`e2e/commerce.spec.ts` (`?filters=open-now,airside` shows the reason, a non-zero result line and no "Open now"
switch, with "After security" pressed). Intended behaviour changed, so the old "0 of 8 with an explanation"
test was rewritten.

### C-06. Missing airport sections (P1)

**Status:** fixed in code. The first-request 404 is only observable on `next start`; the test is written for it.
Flights is B's page (hand-off).

**What changed**

- `src/components/airport/section-page.ts`: `airportSectionMetadata()` returns the not-found title and
  `noindex, nofollow` when the airport is unknown, not canonical or lacks the section, so `/en/szb/parking` is no
  longer titled "Parking at Subang". Pages with an honest empty state pass `emptyState`: those keep their title
  and get `noindex, follow`. New `loadAirportPageFor()` lets such a page accept exactly the airports it serves.
- `export const ensureStatic = 'navigation'` on the parking, transport, facilities, lounges, shop and dine, map
  and transit pages (each already had `generateStaticParams`). `dynamicParams = false` no longer exists under
  Cache Components; per `docs/engineering/next16-notes.md` sections 2 and 5 and Next's `ensureStatic` doc, this
  makes an unlisted airport wait for the full render, so its first response is already a 404. Client hooks
  (`useSearchParams`) stay allowed. The airport overview, guide and help pages already use it.
- Map: airports with neither a map nor a facilities directory are now a 404 (they were an unlinked empty state
  for all 39 airports); airports with facilities but no map keep the "no map yet" page, `noindex`.
- Transit: airports outside KLIA and the six airports with content are now a 404; the simple page for the
  others is `noindex`.

**Verified:** on the dev server, titles and robots for `/en/szb/parking`, `/en/kch/parking`, `/en/lgk/transport`,
`/en/bki/shop-dine`, `/en/abc/parking`, `/en/szb/map`, `/en/aor/transit` ("Page not found", `noindex,
nofollow`) and `/en/pen/transit` (own title, `noindex, follow`). No `ensureStatic` validation error in the dev
log while the seven pages were loaded and the 62 e2e tests ran against them. `e2e/map.spec.ts` "missing airport sections (C-06)": for all
39 airports (read from `/en/airports`) and the seven C sections plus the overview, the first and a repeat
request must both be 200 where the overview's section navigation links the section (or its empty state
applies) and 404 otherwise, with the not-found title. It skips on a dev server (`PLAYWRIGHT_BASE_URL` set)
unless `E2E_STATUS_CODES=1`; **the verification engineer should run it against `next start`**.

### C-07. Nursing rooms absent from Facilities (P1)

**Status:** fixed.

**What changed:** `facility-view.ts`: `EXPECTED_FACILITY_CATEGORIES` (nursing room, accessible toilet, toilets,
prayer room, mirroring the map's filters) and `missingExpectedCategories()`. `facilities-directory.tsx`: a
dashed chip for each missing category in the Type filter, and a "Not published yet" section with a card per
missing category: "Not published: location, level and opening hours", "We have not verified where these are at
KLIA. Ask at an information counter or any member of staff…", and "Find an information counter" linking to the
information counter's card. At KLIA: nursing and baby care room, accessible toilet, toilets.

**Verified:** `e2e/map.spec.ts`: unfiltered, the cards are listed; on a phone, opening the filters and choosing
"Nursing and baby care room" (two interactions) shows the card with the information-counter link, and no "No
facilities match" empty state; axe. Screenshot at 390 (dark).

### C-08. Step-free arrival route (P1)

**Status:** partially fixed. Ending at the taxi counter, rail entrance or e-hailing pick-up needs D to add those
map places (hand-off); the test uses the arrivals pick-up, the nearest existing place.

**What changed:** `map-logic.ts`: immigration, customs and security points are steps of their own
(`checkpoint`), so a walk no longer runs past them; an unnamed corner before a walkway to another level is
folded into that level change instead of "Walk on"; level changes by walkway carry their direction and, on a
step-free route, a step-free flag. `route-planner.tsx`: "Go down to Level 3: arrivals, to Arrival immigration.
Step-free: use a lift or ramp; ask staff if you cannot see one." and "Go through Customs". The schematic map
has no lift between the gates level and Level 3 (the gates level is a concept drawing whose floor is not
published), so the step names the step-free need rather than inventing a lift; where the map has a lift edge
the existing "Take the lift down to Level 3" step is unchanged. `map-explorer.tsx` passes the checkpoints and
the step-free choice to the step builder.

**Verified:** `map-logic.test.ts`: gate C to the arrivals pick-up, step-free: no unnamed walk, a named step-free
level change down to arrival immigration, customs as its own step after immigration, arrival at the pick-up;
and the departure route keeps security as its own step. `e2e/map.spec.ts` checks the same in the browser.

### C-09. Duplicate route option names (P1)

**Status:** fixed.

**What changed:** `map-logic.ts`: `placeOptionLabels()` uses the short name and level, then the full name where
short names repeat, then the zone; `route-planner.tsx` uses it for From and To.

**Verified:** `map-logic.test.ts`: every label unique on the KLIA map in both languages; "Aerotrain station
(Satellite Building) · Gates". `e2e/map.spec.ts`: the From list has no duplicate.

### C-10. Heading order on the transport page (P1)

**Status:** fixed.

**What changed:** `src/app/[lang]/[airport]/transport/page.tsx`: in "Not covered here yet" the h2 block comes
first in the DOM; the grid's `order` keeps "Driving yourself" on the left on wide screens.

**Verified:** `e2e/transport.spec.ts`: no visible heading on `/en/kul/transport` skips a level going down, and
the section's first heading is its h2.

### C-11. Lounges cannot be priced or booked (P2, out of scope)

**Status:** interim done; the rest needs each lounge operator (OOS-04).

**What changed:** `lounge-card.tsx`: "Price" joins the card's single grouped "Not published" line, so each card
says once that its price is not published (with access rules, when those are missing too).

**Verified:** `e2e/commerce.spec.ts`: the Plaza Premium Lounge card mentions the price once.
