# Redesign stage two: the airport service pages in Direction v2

Owner: senior product designer-engineer (service pages). Date: 23 November 2026. Scope: terminal map, transport,
parking, facilities, shops and food (and the outlet page), lounges and transit, under the airport header, in the
language of `docs/design/direction.md` and `docs/design/design-system.md`. Inputs looked at first: the stage 1c
previews (`docs/design/redesign-preview/stage1c-klia-desktop.jpg`, `stage1c-penang-mobile.jpg`), the Dubai and
Changi references in `docs/research/screenshots`, and the seven pages as I found them (1440 x 900, full page).

Every feature, route, piece of content and honesty label stays: demonstration data, provenance tags, "Not
published" lines, the schematic-map disclaimer, the touting warning, the sources lists and the not-official notice.
They are restyled to be quieter, never removed or reworded. No accessible name or text that an e2e spec queries was
renamed.

## The frame (all seven pages and the outlet page)

`src/components/facilities/service-frame.tsx` (new; it lives in a folder I own, and only my pages import it):

- **`ServiceIntro`**: breadcrumbs, the gold-rule eyebrow, a big `type-display-lg` title (balanced, never broken
  inside a word), a one-line summary, quiet meta (chips or in-page jump pills) and one action. The page's **key
  answer** sits in a raised panel beside the title from `lg` up and under it on phones (an answer that renders
  nothing leaves no gap). A soft fade from the surface to the cool page grey separates the intro from the content,
  without a rule. Server-rendered: the `h1` is in the first HTML on every page (checked on build 3: no `<div hidden
  id="S:…">` before the `h1` on any of the nine pages measured).
- **`ServiceBody`** and **`ServiceHeading`**: one column of sections with even 64 to 80 px spacing (no hairlines
  between sections), headings in `type-display-sm` with one line of lead and one action. `SectionHeading
  variant="title"` was replaced on these pages; the hairline `border-t … pt-10/12` section separators were removed.
- **Surfaces**: `SERVICE_CARD` (24 px corners, hairline, soft shadow), `SERVICE_TOOL` (28 px, deeper shadow, for
  tools and answers), `SERVICE_WELL`, and `SERVICE_ICON` / `SERVICE_ICON_SM` (a soft brand tile instead of the grey
  icon square). Outline-strong cards (`rounded-xl border-line-strong shadow-xs`) on these pages became v2 cards.
- On phones the summary is visually hidden where the first screen belongs to the answer (transport, parking,
  facilities, shops, lounges, transit planner); it stays for screen readers.

## Per page

| Page | What changed | Main files |
|---|---|---|
| **Transport** | The published-fares answer (`TransportGlance`) is the raised panel beside the title (under it on phones, still above the warning, C-02 and 6.1.6). Jumps ("Changing terminals", "Driving? See parking") are quiet pills from `sm` up. The touting warning is a refined callout (soft amber, round icon, no 2 px frame; same words, sources and link; the inline taxi and e-hailing notes match). Option cards: 24 px cards with the mode in a brand tile, a larger title, and **fare and time in a figure panel** (type-data-lg; side by side while they fit, stacked when they do not). **The KLIA Ekspres card carries the library's KLIA Ekspres photograph** (a band on a narrow card, a column beside the facts on a wide one, its size reserved); no other option gets a picture. The "not covered here" and private-car blocks are a well and a card with a secondary button. | `app/[lang]/[airport]/transport/page.tsx`, `transport/transport-glance.tsx`, `transport-option-card.tsx`, `touts-warning.tsx`, `transport-values.tsx` (a `size` on `DurationValue`), `transport-types.ts` and `transport-data.server.ts` (`photos`, chosen on the server: `OPTION_PHOTOS = { 'kul-klia-ekspres': 'klia-ekspres' }`), `terminal-transfers.tsx` |
| **Parking** | The price matrix is one raised panel (heading in display type, the estimated tag, the table full bleed, the source list) and **"Book parking online" is the page's primary button**; the Preferred Parking warning is a soft amber row. The calculator is one app-like tool: form and answer side by side, the answer in a well with a `type-display-md` figure, and the car park's booking hand-off as a primary button. Car-park cards: v2 cards, the premium warning as a soft amber band with a faint amber edge (full in high contrast), rate status in a quiet well. Jump pills to the calculator and "Where I parked". | `app/[lang]/[airport]/parking/page.tsx`, `parking/parking-price-matrix.tsx`, `parking-calculator.tsx`, `car-park-card.tsx` |
| **Facilities** | New **"Most looked for"** answer (`facility-quick-finds.tsx`): prayer rooms, accessibility and assistance, toilets, nursing room, information counter, each with its count, opening the directory through the filters it already reads from the URL (`?cat=prayer-room`, `?access=1`). A category with nothing published says "Not published yet: ask at an information counter" and opens its "not published" card. Filters in a 28 px panel with small-label groups (the pill `FilterChip`s stay); groups headed in display type with a count pill; cards with larger titles and the where/when/accessibility facts in a soft well. | `app/[lang]/[airport]/facilities/page.tsx`, `facilities/facility-quick-finds.tsx` (new), `facilities-directory.tsx`, `facility-card.tsx`, `facility-values.tsx` |
| **Terminal map** | Quiet meta chip per map ("KLIA Terminal 1: 4 levels · 39 places"). The canvas is a 28 px elevated card; the schematic disclaimer is a quiet chip in the card's top bar (same words, still a strip above the drawing, round 4); "The route continues" chips are solid pills; the route is a confident line (6.5 / 9 px on a 13 / 16 px casing); pan and zoom controls sit in one soft group; the legend is a soft well. The route panel is an app-like card with From and To in one well; the written route is a clean step list (soft brand thread, rounded rows). The place list is grouped in white cards with brand icon tiles; the place details panel is raised. | `app/[lang]/[airport]/map/page.tsx`, `map/map-canvas.tsx`, `map-legend.tsx`, `route-planner.tsx`, `place-list.tsx`, `place-details.tsx` |
| **Shops and food** | Answer panel (`glance-panel.tsx`): the section photograph the overview's Explore card already uses for this section (KLIA: a plate of nasi lemak, a Malaysian dish; Penang has none, so no photo), then what the directory holds by kind (each row opens the directory with `?kind=`), and how many places named sources confirm. **Outlet cards: no outlet has a licensed photograph, so each gets category art** (`category-art.tsx`): its monogram in the serif accent on a soft tint of its kind (dine gold, shop brand, service leaf), the kind's icon and a faint tabur motif; decorative and hidden from assistive technology. Gate panel raised. | `app/[lang]/[airport]/shop-dine/page.tsx`, `commerce/glance-panel.tsx` (new), `category-art.tsx` (new; also holds `KIND_ICONS` so Server Components read the values, not a client reference), `outlet-card.tsx`, `gate-panel.tsx` |
| **Outlet page** | The frame with the outlet's large category art beside the title from `lg` up (never a stand-in photo); sections in display type; hours in a soft well; the sources aside raised. | `app/[lang]/[airport]/shop-dine/[outlet]/page.tsx`, `commerce/outlet-details.tsx` |
| **Lounges** | Answer panel with KLIA's own airside photograph (the Terminal 1 canopy at the C gates, the overview's Lounges card) and the counts (6 lounges, 1 hotel, 2 rest services), and "Each card says which side of security it is on." Lounge cards get midnight category art with a gold monogram (lounges, hotels) or the service tint (rest, showers). The "not in this list" block is a soft rounded band. | `app/[lang]/[airport]/lounges/page.tsx`, `commerce/lounge-card.tsx` |
| **Transit** | The planner is app-like: the form a 28 px tool; **the verdict is the answer**: on desktop the first thing beside the form, on phones under it with the pinned one-line summary at the top of the form (C-03 and round 4 unchanged); a raised card with the verdict word in display type beside its icon in a tinted disc and the two times as large figures (tone still carried by icon, word and edge). The case card, the step-by-step (one card, timeline, sourced facts in a soft well) and the time breakdown are v2 cards. The simple page for other airports uses the same frame. | `app/[lang]/[airport]/transit/page.tsx`, `guides/transit-planner.tsx` |

Copy added (append only, English and Malay written for a Malay reader): `transportPages.frame.transportSummary`,
`mapPages.frame.*` (quick finds, accessibility, map chips), `commercePages.frame.*` (glance panel, kind counts,
"which side of security"). Everything else reuses existing strings.

**Photographs, truthfully.** Only three library photographs appear, each where it is that place's or service's own
picture: the KLIA Ekspres train on the KLIA Ekspres card, KLIA Terminal 1's airside canopy on KLIA's lounges page,
and the nasi lemak dish on KLIA's shops page (both via `EXPLORE_IMAGES`, the overview's vetted choice for those
sections). No text sits over any of them (they are panels, not backgrounds), so the 4.5:1-over-photographs rule has
no runs to measure here. No outlet, lounge or car park has a photograph; none is invented.

## Checks

Builds: three production builds (`NEXT_DIST_DIR=.next-services-prod`, `NEXT_PUBLIC_SITE_URL=http://localhost:3351`),
each 0 warnings and 366 static pages; final build 3 `gNP7q0CfXRQzjNA0hPrhx`, served by `next start -p 3351` with
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip`. Iteration on a dev server (`.next-services`, port 3341).

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx eslint` on every path I own and the new spec | 0 problems |
| `npx vitest run` | 616 / 616 |
| E2E on build 3: `map`, `transport`, `commerce`, `services-redesign2` (new), `layout-round4`, `polish-round5`, `guides` (desktop and phone) | **174 passed, 0 failed** |
| E2E on build 1: `access-round6`, `handoffs`, `trust`, `smoke`, `shell`, `flight-round5` (incl. layout shift on parking, map and transit), `verify-round6`, plus the above | 339 passed, 14 skipped, 1 failed: `verify-round6` "the overview's link to its contacts moves focus there", on the airport overview (`/en/kul`), a page I do not own and whose code I did not touch; it fails 4 of 6 on repeat against that build. Recorded for the overview's owner. |
| axe (WCAG 2.0 to 2.2 A and AA), my own sweep on build 3: 14 pages (KLIA map, map with a route, transport, parking, facilities, shops, outlet, lounges, transit; Penang transport, parking, lounges, transit; Kota Kinabalu's "no map yet") x 1440 and 390 px x light and dark x English and Malay | **112 loads, 0 violations**, no sideways scroll, no error status |
| Words broken inside (every visible word of 4+ letters spread over two lines), 360 px, text at 100% and 125%, English and Malay, 9 pages | Build 2 found two, both from the new design, both fixed in build 3: the fares panel's option name on a phone at 125% ("Ekspres" over three lines: the icon tile now shows from `sm` up) and "Percuma" in a card's figure panel (fare and time now stack when they do not fit). Build 3: **none**. |
| Static shell | No clock or random value in render; no page-level Suspense added; `h1` in the first HTML on all nine pages |
| Reduced motion | Every new movement is `motion-ok:` (arrow nudges, card lift); colour and shadow transitions only otherwise |

Updated tests: none weakened or changed. New: `e2e/services-redesign2.spec.ts` (the quick finds filter the
directory, only the KLIA Ekspres card has a photo, no outlet or lounge card has an image, the glance panel's photo is
the vetted one and Penang gets none).

## Screens looked at (11 images, several pages each)

Before: the seven KLIA pages at 1440 (two montages) and the overview and My journey for reference. After, on the dev
server: transport (1440), map, parking, facilities and transit (1440), shops, lounges, outlet and transport cards
(1440); transport, facilities, parking and transit on a 390 px phone (light, English); map, shops, lounges and
parking on a phone (dark, Malay); transport and map with a route (1440, dark), transit (1440, Malay), facilities
(1440, dark, Malay). Final, on build 3: transport at 360 px and 125% in Malay, transport (phone, dark), facilities
(phone, Malay), the outlet page (phone, dark), the map with a route (1440) and lounges (1440, dark, Malay).

## Known limits

- The map's From and To are native selects: a long place label ("Departures drop-off · Level 5") is cut short in the
  closed field at 1440 px, as before the redesign; the open list and the accessible name carry it in full. A wider
  route column was not tried (build limit).
- Pages are a little taller on phones (more generous card padding): transport 8,509 px, facilities 14,673 px at
  390 px. The long details stay behind the existing "More details" disclosures.

## Outside my paths

`tsconfig.json`: only the lines Next added for `.next-services` and `.next-services-prod` were removed at the end
(the other engineer's `.next-content*` lines are theirs and were left). `.next-services*` folders deleted. Nothing
else outside my paths was changed.
