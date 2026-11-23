# Redesign three: phone pass (concierge, terminal map, service imagery, page length)

Phone first (390 x 844), then checked at 1440 x 900. Inputs: `docs/design/critique-redesign2.md` (items 5, 13, 14, 17,
24 and 25 open or partly done), `docs/qa/verification.md` Round eight (V2.7 lengths, V6 open issues 4 and 5).
Every feature, honesty label and official contact stays. The `h1` stays static HTML on every page touched.

## 1. Concierge on a phone

**Before:** the midnight band took the whole first phone screen (eyebrow, title, a five-line lead), and the
conversation began at y 1,430 (`stage2-concierge-mobile.jpg`).

**Now** (`src/app/[lang]/concierge/page.tsx`, `src/components/concierge/concierge-chat.tsx`):

- A compact header on the page background at every width: breadcrumbs, a small midnight tile with the gold
  sparkle (decorative), the `h1` "Ask the concierge" / "Tanya Kami", and one short line (new key
  `conciergePage.shortLead`, both languages).
- The honesty note is one quiet line, **"How answers are put together"**, a native `<details>` (works without
  JavaScript, announced as expanded or collapsed). Inside: the page's full lead (what answers come from, that they
  say which and show sources, and that the concierge says when it does not know) and the three steps.
- The privacy line ("Nothing you type is sent or stored") stays visible above the conversation, as the specs
  require. The demo and provenance labels on answers, the provenance legend, the official contacts and the privacy
  section are unchanged; on a phone they follow the conversation.
- First phone screen now holds the title, the line, the disclosure, "Answering for", the privacy line, the
  **composer** and the first **three suggestion chips** (composer at y 528, chips from y 633). Answers keep the
  polish's flat form (sentence bubble, full-width cards, sources row).
- Desktop: the same header at the page's text edge (x 148), then one calm row: the conversation card and the side
  column (legend, contacts, privacy). The band's "How answers" panel moved into the disclosure.
- Composer contract unchanged (not sticky before the first question, suggestions after it in focus order, scroll
  padding while it sticks). One fix found by the Malay phone axe run: the first answer now scrolls from the toolbar
  row ("Answering for", "Clear conversation"), not from the privacy line, so that row is never left half under the
  sticky header (axe `target-size` on `/ms/concierge` at 390 once the page's gaps tightened).

Page length 4,222 → 3,654 px (en, 390).

## 2. Terminal map

Files: `src/components/map/map-logic.ts`, `map-canvas.tsx`, `map-explorer.tsx`, `route-planner.tsx`,
`map-logic.test.ts`.

- **Fit the drawing to its content.** `levelBounds` now also returns the extent of the level's places
  (`focus`). `baseScale` is at least "contain" (the whole level fits), and where the frame is much taller than the
  level is wide (a phone) it goes up to the scale at which the places still fit with 30 px around them, never past
  "cover". `fitView(bounds, frame)` keeps the centre as close to the drawing's centre as the places allow. On a
  wide frame both equal "contain", so 1440 is unchanged. The canvas reports its size (`onFrameChange`), and the
  explorer frames each level's first view, "Reset view" and a new route with it. Zoom 1 stays "the first view", so
  "Zoom out" is still disabled there (the spec's check holds).
- **Phone frame 5:4** (was square below 480 px): the drawing is y 418 to 702 at 390 x 844 (was 418 to 773), with
  far less empty band above and below the level, and the zoom and pan bar now on the first screen.
- **Labels never cross the route.** `placeLabels` takes the drawn route as screen segments (`segmentHitsBox`,
  Liang-Barsky, with the route's halo as padding). A place label takes the first free side that does not cross
  the route; only the route's own start and end may cross it when no other side is free. Zone labels that would
  cross the route are not drawn. "Rows F and G" now sits beside its marker at 1440, and at 390 (where no side is
  free) it is left out rather than drawn under the line; the marker still names it.
- **The reserved top-left corner is gone.** Labels were kept out of the top 56 px for level chips that the polish
  moved into the card's top bar.
- **From and To show the whole name** (`PlaceSelect`): the chosen place is drawn as text that wraps ("Departures
  drop-off · Level 5" on two lines at 1440, was "Departures drop-off · Lev…"), with the real `<select>` lying over it,
  transparent. It keeps its label, keyboard and the phone's picker; the focus ring is drawn on the field; the drawn
  text is `aria-hidden` (the select announces the value).
- Unit tests: phone framing keeps every Level 5 place in the first view; labels avoid a route; a boxed-in plain
  label is dropped while a route end is kept.

Not done from critique item 5: the zone tints without dashes, 32 px start and end discs and the route draw
animation (item 25). The legend still matches the drawing.

## 3. Service-page imagery

`src/content/images.ts` gains `SERVICE_IMAGES` (which photograph each service page's band uses) and
`serviceImageFor(code, section)`; `servicePlace(slug, lang, section)` reads it, and each of the six pages passes its
section. Sections not listed keep the airport's first hero, so other airports are unchanged (their own photographs).

| KLIA page | Band before | Band now | Why it is truthful |
|---|---|---|---|
| Transport | KLIA aerial | `klia-ekspres` | KLIA's own train, the page's first answer |
| Parking | KLIA aerial | KLIA aerial (kept) | the library has no car park |
| Facilities | KLIA aerial | `klia-t1-roof` | Terminal 1's own roof canopies |
| Shops and food | KLIA aerial | `nasi-lemak` | a Malaysian dish (the overview's "Shops and food" card); the panel still has no photograph (critique item 7) |
| Lounges | KLIA aerial + panel photo | `klia-t1-canopy` in the band, none in the panel | the C-gates roof; **one photograph on the first phone screen** (was two stacked) |
| Transit | KLIA aerial | `aircraft-terminal-1` | jets in front of Terminal 1, for changing flights (it was in the library and in no list) |

The KLIA Ekspres option card no longer repeats the train once the band shows it (`transport-data.server.ts`:
`optionPhotos` skips the band's photograph). The terminal map keeps no band (its drawing must be on the first
screen). Credits are unchanged (every photograph was already credited). Bands are decorative with their credit
shown, as before.

## 4. Phone page length

Measured with Playwright at 390 x 844 on the production build (`next start`), full document height after load.
"Before" is the same script on the unchanged code (it matches V2.7).

| Page | Before | After | Change |
|---|---:|---:|---|
| `/en/corporate/about` | 15,185 | **9,353** | −38 % (ms 9,702) |
| `/en/kul/facilities` | 14,483 | **10,034** | −31 % (ms 10,455) |
| `/en/kul/map?from=l5-kerb&to=g-gates-c` | 11,406 | 11,359 | frame 5:4 |
| `/en/kul/map` | 10,024 | 9,953 | frame 5:4 |
| `/en/concierge` | 4,222 | 3,654 | compact header |
| `/en/kul/transport` | 8,548 | 8,388 | card photo not repeated |
| `/en/kul/lounges` | 9,255 | 9,111 | one photograph |
| transit, parking, shops, guides, help, corporate hub | 10,694 / 10,118 / 6,592 / 8,014 / 9,530 / 7,513 | unchanged | not touched |

- **Facilities** (`facilities-directory.tsx`, `facility-card.tsx`, `facility-values.tsx`): with no filter, a group
  shows two cards from 768 px up (was three: the third sat alone on its row at 1440) and **one on a phone**, the rest
  behind the existing "Show N more: <group>" disclosure (`MoreOnPhones`). The server HTML and the first render use
  two (no hydration mismatch, nothing hidden without JavaScript); a phone moves the extra cards into the disclosure
  once loaded, below the first screen. Links to a card inside it (`#kul-t1-fast-track` from the overview) open it.
  Cards are tighter on phones only (16 px padding, 40 px icon tile, smaller gaps, 8 px fact rows). The quick finds
  (the first answer), the "Official unless marked otherwise" line, every card's own tag, the section source lists and
  the "Not published yet" section (the C-07 two-interaction path) all stay in view.
- **Corporate about** (`src/app/[lang]/corporate/about/page.tsx`; new keys `corporatePages.aboutPhone.*`, both
  languages): on phones the four latest milestones show and the eleven earlier ones sit behind "Show 11 earlier
  milestones, 1993 to 2025" above them (the timeline still reads oldest first; from 768 px it is one continuous list
  with a hairline at the join). The management list, the group companies, the Operating Agreements and the
  recognition facts sit behind one line each. Headings, leads, the board, the "as of" and provenance line under the
  management team, the roles not named, the "Full Board ... not published" note, the ownership facts, the brand
  statements and the prototype note stay in view. Labels inside a closed list travel with their facts.

Critique items: 13 (facilities: length addressed; the horizontal filter bar is **not** done), 14 (labels: nothing
changed; the corporate and guides label pattern is untouched), 17 (notices) and 24 (home) are outside these paths,
25 (motion) not done.

## Tests changed, and why

All are intended appearance changes, each with a comment in the spec; none is loosened.

- `e2e/services-redesign2.spec.ts`: transport now checks the band shows `klia-ekspres` and that no option card
  carries a photograph (was: only the KLIA Ekspres card had one); shops checks the band shows `nasi-lemak` (was the
  aerial); lounges checks the panel has none and the band shows the canopy (was one in the panel).
- `e2e/guides.spec.ts` (D-02): below 768 px it opens "Show 2 more: Other" before checking Fast Track, waiting for
  that summary (the server HTML shows two cards per group).
- `e2e/layout-round4.spec.ts` (E-17 hand-offs): the facilities case opens `/en/kul/facilities#kul-t1-fast-track`,
  so the card is in view on phones as well.

## Checks

- `npx tsc --noEmit`, `npx eslint` on every path changed, `npx vitest run`: clean, **626 tests** (two new map tests).
- Production build (`NEXT_DIST_DIR=.next-phone-prod`, three builds; the first failed on `/en/airports` with
  "Image is not defined" while the other engineer was editing `airport-directory.tsx`; not this pass).
- Playwright on that build, desktop and phone: `concierge`, `ask-round4`, `ask-round6`, `map`, `services-redesign2`,
  `guides`, `layout-round4`, `handoffs`, `corporate`, `transport`, `commerce`, `verify-round6`, `speed-round5`,
  `shell`, `polish-round5`, `access-round6`: **465 passed, 26 skipped, 1 failed**. The failure is the transport CLS
  budget run inside the phone project under four workers (0.031); re-run alone it passed 6 of 6 (both projects, three
  repeats). The two earlier failures (Malay concierge axe, D-02 on phones) are fixed above.
- Screens looked at (9): concierge 390 (light, Malay dark) and 1440; map 390 with a route and Levels 5, Gates, 1 and
  Malay Level 3; map 1440 with a route; lounges, transport and transit 390; facilities 390 dark; corporate history
  390.

## Open

1. Facilities at 1440: the filter rail and three-across results (critique item 13) are still to do.
2. The map's visual upgrade (soft tints, discs, the route draw under `motion-ok:`) and the transit verdict fade
   (critique items 5 and 25).
3. Transit (10,694 px) and parking (10,118 px) are still long on a phone; the same `MoreOnPhones` pattern applies.
4. The facilities band (`klia-t1-roof`) reads as sky and one column top at 390; a lower focal point would show more
   of the canopies (a one-line change to its `focal` in `images.ts`, not made after the last build).
5. Desktop concierge: the page header is at x 148 as on every page; the conversation is not centred in the window.

## Outside the owned paths

- `e2e/services-redesign2.spec.ts`, `e2e/guides.spec.ts`, `e2e/layout-round4.spec.ts`: the test updates above.
- `tsconfig.json` and `next-env.d.ts`: `next dev`/`next build` added `.next-phone*` lines; removed again, and
  `next-env.d.ts` points at `.next-perf-prod` as before. `.next-phone` and `.next-phone-prod` deleted.
- `src/lib/i18n/features/map.ts`: a key was appended and then removed; the file is as before.
- Uses, without changing them: `src/components/common/more-on-phones.tsx`, `src/components/ui/field.tsx`.
