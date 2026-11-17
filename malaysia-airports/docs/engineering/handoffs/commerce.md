# Hand-off: shop and dine, outlet pages, lounges and rest

Owner: commerce. Status (17 Nov 2026): `npx tsc --noEmit` clean (whole project), `npx eslint` clean on my
paths, `npx vitest run src/components/commerce` 18 of 18, `e2e/commerce.spec.ts` 18 of 18 (desktop and phone)
against the dev server, axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) zero violations on `/en/kul/shop-dine`
(plain and with a gate set), `/en/kul/shop-dine/paul-le-cafe`, `/en/kul/lounges`, `/en/pen/lounges`. No
sideways scroll at 360 px, also at 125% text with high contrast, in both languages. `next build` not run.
`npx vitest run src/content`: content validation passes; ONE domain assertion now fails by design (see requests).

## Routes

| Route | What it is |
|---|---|
| `/[lang]/[airport]/shop-dine` | Discovery. Prerendered for `sectionStaticParams('shop-dine')` (KUL today) |
| `/[lang]/[airport]/shop-dine/[outlet]` | Outlet page. `generateStaticParams` lists every outlet of every airport with the section |
| `/[lang]/[airport]/lounges` | Lounges, hotels, rest and shower facilities. Prerendered for KUL, PEN, BKI |

URL state on shop-dine (all shareable, written with `history.replaceState(null, …)`): `q`, `kind=dine|shop|service`,
`cat=duty-free,cafe`, `cuisine=`, `t=T1|T2` (also the shell's terminal chips), `area=landside|airside`, `halal=1`,
`open=1`, `price=1,2`, `sort=suggested|name|gate`, `gate=kul-t1-c` (an area) or `gate=T1-C12` (a saved flight's
gate). The home page strip's `?filters=open-now,halal,landside,airside` is honoured. `/kul/lounges?t=T2` shows one
terminal; `#<facility-id>` anchors match the search index's lounge links.

## What it does

- **Discovery**: text search (accent and punctuation tolerant, a few everyday synonyms: coffee, makeup, food,
  makan…), type chips with facet counts, category, cuisine (only when published), terminal, before or after
  security, halal certified (with "others may be halal too"), open now (only outlets with machine-readable hours;
  the switch says "hours are published for N of M" and the empty state explains the exclusion), price (only when a
  band is published, otherwise a one-line explanation), sort (most detail first, A to Z, nearest to your gate).
  Results group by terminal, or by proximity when a gate is set. Static HTML lists everything without JavaScript.
- **Near your gate**: choose a gate area (KLIA T1 A/B domestic, G/H international, C Satellite; T2 L/P/Q
  international; each backed by a content source) or use the gate of a saved departing flight (demo data, tagged
  Demo). Proximity is schematic and tagged Estimated everywhere it shows: near your gate area, same building, on
  your way (Main Terminal Building before the Aerotrain to C gates), other building, before security, not on your
  side of departures (international-only outlet for a domestic gate), other terminal, location not published.
- **Honest partial directory**: a note at the top of the results ("Only what we could confirm", count, links to
  the official KLIA T1 dine, shop and services directories and the airport page) and a coverage panel at the
  bottom (location 4 of 8, hours 0 of 8, halal 1 of 8, price 0 of 8) that shows why some filters find little and
  what discovery will do once official data is connected. Provenance legend beside it.
- **Outlet cards**: category and terminal, name (whole card is the link), side of security, halal and open-now
  chips, location note or "Location not published", proximity line, provenance tag and "From <publisher>".
  Outlet provenance is derived: `official` when an official, government or operator source backs it, else
  `estimated` (outlets have no provenance field).
- **Outlet page**: where (terminal, security, level, location; one combined "Not published" row for gaps), show
  on map when mapped (none yet) or a link to the terminal map, opening hours or `NotPublished` with the official
  directory, details (type, category, cuisine for dining, halal, price), sources open by default with as-of date,
  Save to my journey (`useSavedJourney().savePlace`, type `outlet`), three related outlets.
- **Lounges**: by terminal (KLIA) then after security / before security / location not confirmed, cards with
  description, location, level, hours (open-now chip when machine-readable), access as published, operator, links
  to the map point, the operator's own page (when a source of kind `operator` matches the operator) and booking,
  sources and as-of. A transit explainer "Rest airside or landside?" tagged Suggestion, linking to transit. A
  "Not listed here" section with the official lounge listing and airport page.

## Content added (only publishable rows of `docs/research/facts/f-supplement-commerce-regional.md`)

`src/content/airports/kul.ts`: outlets Eraman Duty-Free Mall (T1, T2), Eraman Chocolate and Liquor Duty Free,
Charlotte Tilbury (location left ambiguous as the sources disagree), Kapten Batik, PAUL Le Cafe (halal certified),
7-Eleven CAFe, gateway@klia2 (layout "as described by third-party guides"); facilities Travel Club Lounge (T2,
estimated), Kepler and DaySleeper (rest; the DaySleeper offer is quoted with its date, not as a price). 14 sources
appended to `KUL_SOURCES` (publisher-level where the research recorded no link, using the file's existing
`LINK_NOT_RECORDED` pattern), including the three official directory URLs. Left out: Nooodles (terminal
uncertain), Dimensi Beauty (no citable link), gateway@klia2 restaurants (undated fan pages). `pen.ts` unchanged:
both Penang lounges were already published.

## Files

`src/app/[lang]/[airport]/shop-dine/page.tsx`, `shop-dine/[outlet]/page.tsx`, `lounges/page.tsx`;
`src/components/commerce/`: `commerce-view.ts` (pure: view types, gate areas, `placeFromNote`, `gateProximity`,
filters, URL parse/write, search, sort, coverage, related), `commerce-view.server.ts` (server-only builders:
`outletViews`, `restViews`, `officialDirectory`, `officialLoungeListing`, `mapPointHref`, provenance),
`outlet-directory.tsx`, `outlet-card.tsx`, `gate-panel.tsx`, `directory-notes.tsx` (`PartialNote`, `Coverage`),
`outlet-details.tsx`, `save-place-button.tsx`, `open-status.tsx`, `fact-rows.tsx`, `lounge-card.tsx`,
`terminal-sections.tsx`, `rest-explainer.tsx`, `commerce-view.test.ts`; `src/lib/i18n/features/commerce.ts`;
`e2e/commerce.spec.ts`.

## How to test

- `/en/kul/shop-dine`: type "satellite", "coffee" or "gateway klia2"; Dine chip; Halal switch; Open now (empty
  state with explanation); choose "Gates C, international" and see the proximity groups; `?filters=halal` from home.
- Save a departing KLIA flight (journey page or flight detail), return: the gate panel offers "Use gate …" with a
  Demo tag once the demo board assigns a gate (about an hour before departure), or says it has no gate yet.
- `/en/kul/shop-dine/charlotte-tilbury`, `/ms/kul/shop-dine/gateway-klia2`; Save to my journey toggles.
- `/en/kul/lounges`, `?t=T2`, `/en/pen/lounges` (operator page links), `/en/bki/lounges`.
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/commerce.spec.ts`.

## Known gaps

- No outlet publishes hours, price band or cuisine, so "Open now" returns nothing and price and cuisine filters
  are explanations. The logic is unit-tested with invented fixtures only.
- Official directory links cover KLIA Terminal 1 only (the Terminal 2 directory URL is not confirmed); Terminal 2
  outlets link to the airport page. No outlet has a map point, so "Show on map" never shows for outlets.
- Proximity reads English location notes; T2 gates other than L/P/Q fall back to terminal-level proximity.
- The "use your flight's gate" path was checked live only for a flight without a gate (none had one at test time).
- Malay copy is a draft pending native review; outlet categories are translated via `commercePages.categoryNames`.

## Requests to other teams

- **Domain**: `src/content/content.test.ts` "publishes no outlets…" asserts `kul.outlets` is empty and now fails,
  because this assignment adds the publishable outlets. Please change it to assert each outlet has sources and is
  in the supplement's publishable list. Also refresh the `kul.ts` header and the `kul-content-gaps` note ("shops
  and restaurants" are now partial, not absent). Consider `Outlet.provenance` and a dated `promotion` field.
- **Content**: Penang domestic Plaza Premium is "Level 2, 05:00 to 23:00 daily" per the operator listing (marked
  publishable); the existing record says hours not verified. Add map points for outlets (Eraman Chocolate and
  Liquor near C1/C2) and the KLIA T2 directory URLs when confirmed.
- **Search/domain**: facilities of category `rest` and `shower` could link to `/[airport]/lounges#id` like lounges.
- **Foundation-ui**: the home shop strip lead says "only outlets that an official source confirms"; some are
  backed by news reports (tagged Estimated), so "a named source" would be accurate.
