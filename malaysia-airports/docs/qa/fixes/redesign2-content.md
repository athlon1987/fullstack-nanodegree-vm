# Redesign stage two: content, help, concierge, search, notices and the corporate site

Owner: senior product designer-engineer (premium travel). Date: 23 November 2026. Input: Direction v2
(`docs/design/direction.md`, `docs/design/design-system.md`), the stage one screens
(`docs/design/redesign-preview/stage1c-*.jpg`) and the Hamad, Dubai and Changi references in
`docs/research/screenshots/`. Scope: the guides hub and guide pages, the help centre and its topics, the
concierge (page and panel), search (page and palette), notices, the accessibility hub and statement, about this
prototype, privacy, terms, offline, and the corporate hub and its eight sections, so the whole site reads as one
premium product. Another engineer worked in the same folder on the services pages at the same time.

Measured on my own production builds (`NEXT_DIST_DIR=.next-content-prod NEXT_PUBLIC_SITE_URL=http://localhost:3352
npx next build`, served by `next start -p 3352` with `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip`): **build 1** (first
end-to-end run; found the corporate type-size regression, item 9), **build 2** `naQmDwNnDpmlLLzPxebgi` (all page
work; the end-to-end, pixel-contrast, axe and layout-shift numbers below), **build 3** `yj3XMvrLPgCydBaJBDuQk` (two
layout-shift fixes found on build 2, item 10; re-run of the affected specs: `ask-round6`, `ask-round4`, `smoke`,
`trust`, `guides`, `corporate`, both projects, **200 passed, 0 failed**, 12 skipped). Iteration ran on a development server (`.next-content`, port 3342).

## Result

| Check | After |
|---|---|
| Text over photographs (`photo-contrast.mjs`, 1st percentile per run, brightest pixels; light, dark, high-contrast light and dark; 390 and 1440 px; EN and MS) on every page with a photograph: `/en/guides`, `/ms/guides`, `/en/guides/departing`, `/ms/guides/first-time`, `/en/guides/arriving`, `/en/corporate`, `/ms/corporate`, `/en/corporate/about`, `/ms/corporate/network`, `/en/corporate/business` | **800 runs, 0 under 4.5:1** (large text held to 4.5:1 too). Lowest: 6.13 (light and dark, 1440), 6.85 (390), **4.85** ("Start here" pill, high-contrast light, where gold is darker), 7.79 (high-contrast dark) |
| axe (WCAG 2.2 A and AA) | **0 violations** on 80 loads of the photograph pages (4 themes x 2 widths) and 26 loads of `/en/help`, `/ms/help/flights`, `/en/concierge`, `/en/search?q=wifi`, `/ms/notices`, `/en/accessibility`, `/ms/privacy`, `/en/terms`, `/en/about-this-prototype`, `/ms/corporate/careers`, `/en/corporate/news`, `/en/offline`, `/en/guides/immigration-customs` (light and dark, 390 px); the smoke spec's axe pages pass |
| Layout shift (`scripts/qa/layout-shift.mjs`, CPU 4x, phone 390 and desktop 1440, 2 runs) | `/en/guides`, `/en/guides/departing`, `/en/help`, `/en/concierge`, `/en/corporate`, `/ms/corporate/about`, `/en/accessibility`, `/en/privacy`: **0 to 0.003** (build 2). `/en/search?q=lounge` was 0.111 (phone) and `/en/notices` 0.016 on build 2; on build 3 **0** (search, both widths), **0 to 0.002** (`/en/notices`, `/ms/notices`), `/en/kul` 0.004 |
| Corporate type sizes (A-14, at most 8 at 390 and 1440, EN and MS) | hub **7 / 8**, media centre 8 / 8 |
| `tsc --noEmit` | 0 errors in my files (the other engineer's mid-way `facilities/facility-quick-finds.tsx` reported errors during the work) |
| `eslint` on every path I touched | 0 problems |
| `vitest run` | **616 / 616** |
| End to end on build 2 (both projects): `guides`, `concierge`, `corporate`, `ask-round4`, `ask-round6`, `smoke`, `handoffs`, `access-round6`, `shell` | **322 passed, 0 failed**, 20 skipped (project-specific). Also on build 1: `layout-round4`, `platform`, `polish-round5`, `speed-round5`, `verify-round6` passed; one `handoffs` B-09 failure there (home flight feed, not my pages) passed on build 2 |
| Tests changed | **None.** Every text and accessible name the specs query is unchanged |
| Builds | 3 |

Screens looked at (production, final): `/en/guides/departing` 1440 light, `/en/corporate` 1440 dark, `/en/help` 1440
dark, `/ms/corporate/about` 1440 light, `/ms/guides/immigration-customs` 390 light, `/en/notices` 390 dark, the search
palette with "wifi lounge" 1440 light; during the work `/en/guides` (full page), `/en/guides/immigration-customs`,
`/en/help`, `/en/concierge` (empty and answering), `/en/corporate`, `/en/corporate/careers`, `/en/privacy`,
`/en/search?q=wifi` (dark), `/en/notices`, and `/ms/guides`, `/en/guides/departing` (dark), `/ms/help`,
`/en/concierge` at 390.

## The shared language (new building blocks, all in my paths)

- **`PageHero`** (`src/components/guides/page-hero.tsx`): the top of every content page, three forms.
  - **Photograph** (`image`): `HeroMedia` with the left scrim at the `medium` height, preloaded, credit line in
    the corner; breadcrumbs, a gold-ruled kicker, the big Hanken `h1` and the lead sit in the scrim's text zone (the
    same 4.5:1 construction as the home and airport heroes, measured above).
  - **Midnight band** (`tone="midnight"`): landing pages without a truthful photograph (help centre, concierge,
    corporate sections). `surface-midnight`, an `on-media` scope, the scattered-flower motif in gold at 9 % fading
    towards the words, a fading gold rule along the bottom, and an emblem.
  - **Light editorial header** (`tone="light"`): reading pages (guides without a photograph, help topics, search,
    notices, accessibility, privacy, terms, about this prototype, offline). The page colour with a soft gold glow
    in the corner and the same emblem.
  - The **emblem** is the topic's line icon in a white (or smoky) disc inside two rings, one gold: decorative,
    `aria-hidden`, from `lg` up. The `h1` is static HTML in every form (no Suspense, never revealed by `$RC`, never
    animated).
- **`ReadingLayout` and `ReadingToc`** (`src/components/guides/reading-layout.tsx`): the long-form layout. A sticky
  "On this page" column with a gold indicator on hover from `lg` up; on phones the same links as wrapping pills
  (one navigation landmark, never sideways scroll). Sections separate by space, not rules.
- **Cards** follow the system everywhere: 20 to 24 px corners, a hairline and a soft shadow; icons in round tinted
  medallions instead of square tiles; "not published" states as a dashed edge with a soft gold disc (helpful, not
  an error colour).

## 1. Guides hub and guide pages

- **Hub.** A photograph header (the timber-lined roof over the C gates at KLIA Terminal 1, `GUIDES_HUB_IMAGE`). The
  "applies to" filter sits on a white pill tray with the count on the right (the same `role="status"`). Groups get
  display-size headings and a magazine rhythm: a group that opens with a photograph gives it two columns from `lg`
  up ("Flying internationally for the first time", with the gold "Start here" pill), a group of two shares the row,
  a group of four icon cards runs four across on wide screens. The hub closes on a midnight band with the three
  ways onward (transit planner, My journey, help) as cards that are one link each.
- **Photographs only where truthful** (`GUIDE_IMAGES` in `guide-meta.ts`): first-time travel shows a window seat over
  Malaysia; departing shows the roof canopies outside KLIA Terminal 1; arriving shows the KLIA Ekspres (onward
  transport). Each picture is what its alt text says and is never presented as another airport. Security, check-in,
  baggage, borders and the care guides have no truthful photograph in the library and use **editorial icon cards**:
  the guide's line icon in a white rounded tile on a soft navy plate with the scattered-flower motif. Card
  photographs are decorative (the title names the card); header photographs carry the library's alt text and credit.
- **Guide page.** The photograph header for those three guides, otherwise the light header with the guide's emblem;
  step count, "Checked" date and "applies to" chips under the lead. The reading column (48rem) has display-size
  section headings with their intro, the existing step thread, the airport notes as **fact cards** (airport code
  pill, name, provenance tag, title, body, sources), the sources in a quiet grey well, related guides as cards, the
  help callout and the provenance legend. Numbered section prefixes are gone (Direction v2).

## 2. Help centre and topics

- **Help centre**: a calm midnight band with the help emblem and the "Call Malaysia Airports" lines as pills with a gold
  phone disc (the same `tel:` links and the same named region); then **one big search on a white card that rises
  into the band** (the Dubai pattern; results in rounded rows with a question icon). Topics follow as cards with a
  tinted icon medallion and a question-count pill; popular questions in one white card with chevron discs; the scam
  callout beside them; who handles what and escalation on the subtle band; contacts as cards.
- **Topic pages**: the light header with the topic's emblem; the answers in **one white card** (the accordion's rows
  inside it); "Still need help?" as the page's one midnight card with a gold-ringed icon; other topics as a quiet
  list with their icons.

## 3. Concierge (page and panel)

- The page header is the midnight band with the sparkle emblem; the conversation is a **white card that rises into
  the band** (24 px corners, deep shadow); the explanation, legend, official contacts and privacy note beside it.
- **Bubbles**: the question is an ink pill bubble on the right; the answer sits in a soft grey bubble beside a
  midnight avatar with a gold ring. Answer cards, statement lists and limits are white 24 px cards inside it, so
  each citation block reads as a card; the mode and sources line at the bottom is a quiet pill ("From verified
  content", or the on-device mode) beside the `SourceNote`.
- **Suggestion chips**: the example questions are wrapping pills with a gold sparkle (they grow to two lines; never
  scroll sideways). Before the first question they still follow the composer in reading and focus order (round 6).
- **Composer**: one pill holding the field and the send button; the pill carries the field's 3:1 boundary and its
  focus ring. Once a conversation exists on the page, it sticks on a **glass strip** (the fill carries the
  contrast; the blur is decoration; solid with reduced transparency and in high contrast). The page's scroll padding
  still follows its height, so no focused suggestion or answer control is ever under it: the round 6 focus specs
  (`ask-round6` "every suggestion and every answer control is fully visible when focused", EN and MS, 390 x 844)
  pass, as does the phone answer-length spec.
- The "concierge on demonstration content" labelling is unchanged and quiet: the privacy line in a grey pill-shaped
  row, the demonstration banner inside answers that use flight data.

## 4. Search page and palette

- **Page**: the light header with the search emblem; the field on a raised white card; results grouped by type with a
  count pill; each result a card with its **type icon** on a tinted tile, the **query's words marked** in the title
  and summary (`Highlight`, `src/components/search/highlight.tsx`: literal matches only, `<mark>` elements, so link
  names stay the plain title; forced colours use Mark and MarkText), the airport chip, and an arrow.
- **Honest "not published" results** (`unpublished` documents) are styled as help: a dashed card with a soft gold tile;
  their title already says "not published yet" and the link leads to the official place to ask. No extra links per
  result (the "a handful of results" spec counts links).
- **Palette**: 24 px corners and a deeper shadow; each option has a type icon tile (dashed gold for "not published",
  ink for "See all results"), the query's words marked in titles, pill scope toggles, softer empty and error states.
  The selected option keeps its 2 px focus-colour outline and inset bar (WCAG 1.4.11).

## 5. Notices

- The light header with the megaphone emblem; filters on a white tray; the list uses the **compact expandable rows**
  (severity disc, severity and place, title, **dates on the line** (new `periodInSummary` prop of `NoticeList`), and
  the in-effect, coming-up or ended chip). The body, provenance and sources open below. Every notice, its provenance
  and its sources are still on the page; the 2027 fare still reads "Announced; applies from 1 January 2027".

## 6. Accessibility hub and statement, about this prototype, privacy, terms, offline

- Light editorial headers with emblems (accessibility, flask, shield, document, Wi-Fi off); section links as white
  pills; sections separated by space rather than rules (`PageSection` no longer draws a rule; `first` is kept for
  compatibility). Hairline lists became white cards with inner dividers (privacy's stored keys on phones, the
  concierge and measurement lists, the content gaps by airport, the terms clauses with gold clause numbers); the
  sourcing counts on about this prototype are stat cards with a big number over a short gold rule; facility links on
  the accessibility hub are cards with icon medallions, the unpublished toilets card dashed with a gold disc.

## 7. Corporate site

- `CorporateHeader` now renders `PageHero`: a photograph where truthful, otherwise the midnight band with the
  section's emblem (from `CORPORATE_SECTIONS`) and the kicker "Malaysia Airports corporate". Jump links move under the
  header, on the page, so a row of links never crowds a photograph.
- **Photographs** (`src/components/corporate/corporate-images.ts`), each one of the company's own airports, as its alt
  text says: the hub shows KLIA Terminal 1 from the air; about shows the Terminal 1 roof canopies; the network shows
  the Terminal 1 roofline across the airfield; business shows an aircraft at a KLIA Terminal 2 gate. Careers,
  sustainability, governance, media and contact have no truthful photograph in the library (no staff, no
  environmental work, no offices) and keep the midnight band. (The about page and the departing guide share the
  roof photograph: different registers of the site, both truthful.)
- **Hub**: key figures as stat cards (a big Hanken number over a short gold rule, provenance, date, sources); the
  vision and brand promise on the page's one **ivory band** as Fraunces pull quotes; the eight sections as cards with
  emblems (no "01" to "08" prefixes); the latest news on the subtle band as news cards (date, kind, title, topic
  under a hairline); the passenger-site card as a midnight card with the page's one gold button.
- Fact rows, people, contact channels, business areas, link-out cards and "not published" facts are cards; milestone
  years are in gold ink.

## 8. Honesty and content

No feature, route, content or label was removed. Demonstration data keeps its banner and tags, every fact its
provenance and sources, every gap its "not published" line with the official pointer, and the "Concept prototype,
not official" notice stays in the header. No new copy: every string is from the existing dictionaries (nothing
appended to `features/{guides,concierge,corporate,platform}.ts`). Malay was checked at 390 and 1440 px (guides hub,
a guide, help, corporate hub and about): long Malay labels wrap at word boundaries; nothing breaks mid-word.

## 9. Regression found and fixed: corporate type sizes (A-14)

Build 1's `ask-round6` "at most 8 type sizes" failed on the corporate hub (9 at 390 px, 11 at 1440 px): the new
pull-quote size, a 12 px kicker and title-lg news titles. Fixed without touching the test: the quotes stay in
Fraunces at the section heading's size, the brand kicker uses the eyebrow size, news card titles are title-md (as
round 6 set). Hub now 7 sizes at 390 and 8 at 1440 (EN and MS); the media centre 8 and 8.

## 10. Layout shift found and fixed (build 2 measurement)

- `/en/search?q=…` on a phone: 0.111. The footer was in the first view under the search card while the index loaded,
  then pushed down when results arrived. The results column now reserves 70 % of a screen, so the footer never starts
  in view. 0 after.
- `/en/notices` on a phone: 0.016. A notice's in-effect chip depends on the clock, so it appears after hydration and
  took a new line on phones. An invisible placeholder of the chip's height holds that line until then (this also
  helps the airport overview, which uses the same compact list). 0 after; `/en/kul` 0.004.

## Files

Mine: `src/components/guides/{page-hero,reading-layout,guide-card,guide-index,guide-meta,guide-views.server,next-step-cards,fact-card}.tsx/.ts`,
`src/components/help/{contact-list,faq-accordion,help-search}.tsx`,
`src/components/concierge/{concierge-chat,concierge-answer,concierge-cards,concierge-panel}.tsx`,
`src/components/search/{highlight (new),search-results,command-palette}.tsx`,
`src/components/corporate/{corporate-header,corporate-images (new),page-section,jump-nav,fact-list,section-index,media-list,brand-statement,prototype-note,missing-fact,link-out-card,contact-channel-list,business-area-card,milestone-list,person-list}.tsx/.ts`,
`src/components/airport/{notice-list,notices-browser}.tsx` (restyle agreed with the services engineer), and the pages
under `src/app/[lang]/{guides,help,concierge,search,notices,accessibility,about-this-prototype,privacy,terms,corporate}`.

**Outside my paths (smallest change, recorded):** `src/components/platform/offline-page.tsx`, the body of my
`/offline` route: its `PageHeader` swapped for `PageHero` (light, Wi-Fi-off emblem), 8 px more space above the body,
and its two cards on the 24 px card style. No other line changed. **Shared with the services engineer:**
`FactCard` (`src/components/guides/fact-card.tsx`) is also used by `[airport]/transit`; its card form moved from a
16 px outline to the 20 px hairline-and-shadow card, nothing else.

## Not done, or left for later

- A truthful photograph for security, baggage, the care guides, careers or sustainability needs new licensed
  pictures (for example a KLIA security hall or MAHB's own staff); the library has none, so those stay iconographic.
- Highlighting marks literal matches only: a synonym or fuzzy match ("wifi" finding "Wi-Fi") shows unmarked.
- The two-guide "Borders and arriving" group keeps the content order (the icon card first), which leaves the icon
  card wide on desktops; reordering is a content decision.
- The concierge panel inherits every chat change; its sheet frame (shell) is unchanged.
