# Critique: redesign stage two (the whole site)

Date: 23 November 2026. Reviewer: executive creative director, before the client sees the work. I did not design it.
Build reviewed: a production build of the working tree with both stage-two passes in it (`redesign2-services.md`
and `redesign2-content.md`): `NEXT_DIST_DIR=.next-critic3-prod NEXT_PUBLIC_SITE_URL=http://localhost:3353 next build`
(366 static pages, no warnings), served by `next start -p 3353` with `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip`.
Captured with Playwright (Chromium, deviceScaleFactor 1) at 1440x900 and 390x844, first screen and one scroll
(90 % of the viewport), server clock about 15:32 MYT on a weekday. Pages: home, KLIA overview, terminal map with a
route (`?from=l5-kerb&to=g-gates-c`), transport, parking, facilities, shops and food, lounges, transit, guides hub,
the departing guide, help, the concierge after "How much does parking cost at KLIA?", search (`?q=lounge`), notices,
the accessibility hub, the corporate hub and a flight page (`/en/kul/flights/ak5995-20261123-d`, delayed). Malay:
transport, the departing guide, corporate. Dark: the same three. References looked at again: `hamad-home-desktop`,
`dubai-home-desktop-first-view`, `stage1c-klia-desktop`, `stage1c-home-desktop`. Earlier review:
`critique-redesign1b.md` (6.4 / 10).

## Verdict

**Overall 6.9 / 10, up from 6.4. The site now speaks one component language, and the build is clean: 0 axe
violations on 48 loads, CLS at most 0.007, no sideways scroll. But it does not yet feel like one premium product. The
photo-led pages (home, KLIA, guides, corporate) feel like Hamad. The seven airport service pages, where a passenger
spends most of the visit, feel like a well-made SaaS help centre: a navy bar, then white.**

What changed since 6.4: the stage 1c fix pass put a photograph on the phone's first screen (Mount Kinabalu on home,
the KLIA aerial on the overview). Stage two gave every page the same card, pill, chip and spacing system, and two
pages now rank with the best of the references: the guides hub and the corporate hub. Honesty labels are all still
there and quieter.

What holds the score below 7.5: (1) **five different page tops** (photo hero, midnight band with an emblem, light
header with an emblem in two widths, the service intro and the flight band), so the `h1` jumps between x 154 and x 326 from page to
page; (2) **no sense of place on the service pages**, although the library holds each airport's own photograph;
(3) **placeholder-looking art** (monogram tiles on shops and lounges, ringed emblems on help, search, notices and
accessibility); (4) **the terminal map's drawing is not in the first view** on either size; (5) a handful of phone
wraps and cramped tables that a client will find in five minutes.

## What now works

- **Guides hub and guide pages.** The timber roof over the C gates is the best hero after Penang. The magazine
  rhythm (a two-column photo card with "Start here", then icon cards) and the reading layout with a sticky "On this
  page" column feel editorial, not documentary.
- **Corporate hub.** The KLIA aerial at full strength, a three-line `h1`, then figures, then the ivory band with the
  Fraunces pull quotes. This is the most "Hamad corporate" screen in the build.
- **Answer-first service intros.** Transport puts "RM 55, 28 min" beside the title. Facilities' "Most looked for"
  (prayer room, accessibility, toilets, nursing room, information counter) is exactly what Changi's facility finder
  does. Transit's verdict ("Looks workable") sits beside the form.
- **One card language.** 24 px corners, a hairline and a soft shadow, round tinted icon medallions and pill
  filters on every page. Sections are separated by space, not rules. This is the Apple and Airbnb calm the client
  asked for.
- **Help centre search rising into the band** (the Dubai pattern) and **the concierge's conversation card** rising
  the same way. These are two good, consistent moments.
- **Photography is truthful.** Every photo I saw is that place's or service's own picture, credited in the corner.
  There is no other airport's terminal and no text over a photo without a scrim.
- **Hygiene is excellent** (table below). One `h1` per page, no console errors, CLS at most 0.007, and
  `tsc`, `vitest` (616 / 616) and the `services-redesign2`, `guides` and `corporate` specs (58 / 58, desktop and
  phone) all pass on this build.
- **Malay reads well.** No word broken mid-word on any capture. "Pengangkutan ke dan dari KLIA", "Berlepas: dari
  rumah ke pintu berlepas" and "Syarikat yang mengendalikan lapangan terbang Malaysia" set cleanly.
- **Dark mode holds.** Cards lift off the page, photo heroes are unchanged and text stays legible.

## Scores by page

| Page | Desktop 1440 | Phone 390 | One-line reason |
|---|---|---|---|
| Home | 7.5 | 7.0 | The phone now shows a real photo (Kinabalu). The first desktop view still stacks seven blocks (1b item 8). |
| KLIA overview | 7.5 | 7.0 | A strong aerial hero. Below it "Services now" is still a v1 grey "Status not available" box with chips. |
| Flight page | 7.0 | 7.0 | Steady (CLS 0.004), answer-first. "Your next step" ends in an ellipsis ("Check-in: Row X,…"). No imagery. |
| Terminal map with a route | 6.0 | 5.5 | The drawing starts at y 686 of 900 (desktop) and y 1173 (phone). It reads as a wireframe, and the From field is cut ("Departures drop-off · Lev…"). |
| Transport | 7.5 | 7.0 | The best service page: fares beside the title, the train's own photo. The touting warning is a 194 px amber slab (420 px on phone), muddy in dark mode. |
| Parking | 6.5 | 6.0 | The right half of the intro is empty. On phones the price table squeezes names into 134 px, with rows 103 to 109 px tall. |
| Facilities | 6.5 | 6.5 | "Most looked for" is excellent. Then comes a 900 px rail of one-per-row chips and grey "Not published" wells. The page is 11,821 px long (14,673 px on phone). |
| Shops and food | 6.0 | 6.0 | Monogram tiles ("CT EC ED PL KB G ED", with "ED" twice) look like missing images. A nasi lemak photo sits over "1 place to eat or drink". |
| Lounges | 6.5 | 6.0 | Midnight slabs with "PP PP MA MA MA" monograms open every card. The side-of-security answer is a small chip. |
| Transit | 7.5 | 7.0 | Feels like an app, and the verdict is the answer. On phones "55 min to 1 h 50 min" breaks over three lines in a 119 px box. |
| Guides hub | 8.0 | 7.5 | Editorial and premium. On phones the filter chips stack one per row. |
| Guide (departing) | 8.0 | 7.5 | Photo hero and a calm reading column. Each step ends in an icon, a number and a chevron that do not say "sources". |
| Help centre | 7.0 | 7.0 | Good search pattern and topic grid. The right half of the band is a "?" in two rings. |
| Concierge (answering) | 6.5 | 6.0 | Answer cards sit in a grey bubble, inside a white card, on the page: three levels of nesting. The composer opens with a magenta ring. |
| Search results | 6.5 | 6.5 | Opens with a magenta ring on the field (autofocus). All 11 results carry the same pin icon and up to 6 lines of summary. |
| Notices | 6.5 | 6.5 | Tidy, but it reads as a list, not a status page: a narrow centred column next to an emblem. |
| Accessibility hub | 7.0 | 6.5 | Clear structure and honest gaps. A wheelchair emblem fills the hero. 10,902 px on phone. |
| Corporate hub | 8.0 | 7.5 | Best of stage two. Figures are set at about 24 px with a 100 px hole under them. In dark mode the ivory band disappears. |
| Malay (transport, guide, corporate) | 7.5 | 7.0 | Clean. On phones "What matters most?" wraps 3 + 1, and the corporate `h1` takes four lines over the photo. |
| Dark (transport, guide, corporate) | 7.5 | 7.0 | Holds up. The amber warning turns olive-brown, and the corporate vision band merges with the page. |

## Measured on this build

| Check | Result |
|---|---|
| axe (WCAG 2.0 to 2.2 A and AA), 24 page and theme combinations x 2 widths | **0 violations on 48 loads** |
| CLS (load plus one scroll) | max **0.007** (`/ms/kul/transport` phone). Map 0.006, KLIA 0.003, flight page 0.004, all others 0 to 0.001 |
| Sideways scroll | 0 px everywhere |
| `h1` | exactly 1 on every page, all server-rendered |
| Console errors | none |
| Distinct font sizes in `main` (my count: elements with their own text, including SVG labels; not the A-14 script) | 10 on the map (desktop); 9 on transport, parking, shops, lounges, transit, guides, guide, help; 5 to 8 elsewhere |
| Page length on phone | facilities 14,673 px, map 11,721, accessibility 10,902, transit 10,480, parking 10,033 |
| Map drawing top (route set) | **y 686** at 1440x900 (214 px of map visible), **y 1173** at 390x844 |
| Monograms on one page | lounges `PP PP MA MA MA SS K D TC`; shops `CT EC ED PL KB G ED` |
| `tsc --noEmit`, `vitest run` | 0 errors; 616 / 616 |
| e2e on this build: `services-redesign2`, `guides`, `corporate` (desktop and phone) | 58 passed, 0 failed |

## Consistency: does every page feel like the same product?

The **components** are consistent: cards, pills, chips, icon medallions and section spacing match on every page.
The **page tops** are not. There are five systems, one of them in two widths:

| System | Pages | Left edge of `h1` at 1440 |
|---|---|---|
| Photo hero (scrim left) | home, airport overview, guides, three guides, corporate hub and three sections | 154 |
| Midnight band with ringed emblem | help, concierge, five corporate sections | 154 |
| Light header with ringed emblem, page width | accessibility, privacy, terms, about | 154 |
| Light header with ringed emblem, **narrow and centred** | search, notices | **326** |
| Service intro with key-answer panel | the seven airport service pages, outlet page | 154 |
| Midnight flight band | flight page, My journey | 154 |

On top of that, the airport frame names "KLIA" three times before the `h1` (the header chip, the breadcrumb and the
eyebrow), while the content pages use the eyebrow for a category ("Guide", "Concierge"). The fix is one page-top
contract, described in item 2.

## The 26 most valuable improvements, ranked

Items marked **[must]** are listed again under "Must fix before the client sees it". Before renaming any text or
accessible name, grep `e2e/`. Specs query the touting warning (`role="note"`, "Book taxis only at the coupon
counters"), "Sources" buttons (`corporate.spec.ts:101`, `commerce.spec.ts:136`) and many headings.

1. **[must] Service pages: give every airport page its own place.**
   *Wrong:* transport, parking, facilities, shops, lounges, map and transit go from the navy airport bar straight to
   white. Only transport (the train) and two glance panels have a photo. The client will click "Transport" from the
   KLIA hero and fall from Hamad into a help centre.
   *Do:* add a **place band** to `ServiceIntro`: the airport's own first hero image (`AIRPORT_HERO_IMAGES[code][0]`,
   the same vetted photo as the overview; `FALLBACK_HERO` where the overview uses it). Make it 220 px at 1440 and
   140 px at 390, full bleed under the section tabs, with a bottom-only scrim. Two variants are acceptable: (a) photo
   only, with the intro on white below and the key-answer panel overlapping the photo's lower edge by 48 px (the help
   centre's "rises into the band" move, so there is no text over the photo); or (b) breadcrumb and `h1` on the scrim
   at the foot. (b) needs the brightest-pixel 4.5:1 sweep used in `redesign2-content.md`. Prefer (a). Use
   `HeroMedia` with fixed `aspect-ratio` per breakpoint (no layout shift) and `priority={false}` (the `h1` is the
   LCP candidate). Keep the `h1` static HTML.
   *Files:* `src/components/facilities/service-frame.tsx`, `src/components/ui/hero-media.tsx`, `src/content/images.ts`
   (a `heroFor(code)` helper if `airport-backdrop.tsx` does not already expose one), the seven pages under
   `src/app/[lang]/[airport]/`.

2. **[must] One page-top contract for the whole site.**
   *Wrong:* five header systems (table above). Search and notices centre an 800 px column, so the `h1` jumps from
   x 154 to x 326 between `/en/accessibility` and `/en/notices`.
   *Do:* every page top is page width. The `h1`'s left edge aligns with the logo. The stack is breadcrumb, eyebrow,
   `h1` (one display size per form) and lead, with the same bottom spacing (48 px phone, 64 px desktop). Two surfaces
   only: **photo** (landing pages with a truthful image) or **light** (everything else, including the service intro).
   The midnight band stays for help, concierge and the corporate sections only if the right column carries content
   (item 3). Narrow pages narrow the **body** column, left-aligned, never the header.
   *Files:* `src/components/guides/page-hero.tsx` (`width` prop, line 114), `src/components/facilities/service-frame.tsx`,
   `src/app/[lang]/search/page.tsx`, `src/app/[lang]/notices/page.tsx`.

3. **[must] Replace the ringed emblems with content.**
   *Wrong:* a line icon in a white disc inside two rings fills the right half of help ("?"), concierge (sparkle),
   search (magnifier), notices (megaphone) and accessibility (wheelchair). It is decoration standing in for a
   picture, and it reads as a placeholder. Hamad and Dubai never leave a hero column empty.
   *Do:* put each page's key answer in the right column. Help: the two call lines as a card (they are already in
   the band). Notices: "In effect now · 4", "Coming up · 1" as a status card. Accessibility: the "Ask for assistance"
   card with the airline and airport routes. Concierge: the three-step "How answers are put together". Search:
   nothing; the field spans 8 columns. Keep the emblem only on the offline page.
   *Files:* `src/components/guides/page-hero.tsx` (`emblem`), `src/app/[lang]/{help,concierge,search,notices,accessibility}/page.tsx`.

4. **[must] Terminal map: show the route in the first view.**
   *Wrong:* with `from` and `to` set, the drawing starts at y 686 of 900 at 1440 (the route is below the fold) and
   at y 1173 on a phone (two screens down, under the form). The page's product is not visible.
   *Do:* desktop: shrink the intro to breadcrumb and `h1` on one row, with the meta chip beside it. Move the level
   tabs into the canvas's top bar. Start the two columns at about y 260 and size the canvas
   `h-[min(calc(100dvh-14rem),42rem)]`. Phone: when a route is set, order the page as route summary (time,
   step-free), then the canvas, then the form collapsed behind "Change route". Show the chosen places in the
   From/To fields over two lines (name / level) so "Departures drop-off · Level 5" is never cut. Add an e2e check
   that the SVG's top is under 900 px (desktop) and under 844 px (phone) with a route set.
   *Files:* `src/app/[lang]/[airport]/map/page.tsx`, `src/components/map/route-planner.tsx`,
   `src/components/map/map-canvas.tsx` (frame at line 315), `e2e/map.spec.ts`.

5. **Terminal map: from wireframe to wayfinding.**
   *Wrong:* dashed zone boxes, thin grey links and about 11 px labels. It looks like a diagram in a spec, not
   Changi's or Dubai's maps.
   *Do:* fill zones with soft tints (check-in in navy at 4 %, security in amber at 6 %, airside in teal at 5 %), with
   no dashes. Draw the route at 4 px in the brand blue with a 10 px white halo, and the start and end as 32 px filled
   discs. POIs become 28 px filled discs with white icons, and labels get a white text halo (`paint-order: stroke`).
   Draw the route with `stroke-dashoffset` over 600 ms under `motion-ok:` only. Keep the "Schematic demonstration
   map, not a floor plan" chip.
   *Files:* `src/components/map/map-canvas.tsx` (`fontSize` at lines 385 and 530), `src/components/map/map-legend.tsx`.

6. **[must] Shops and lounges: drop the monogram art.**
   *Wrong:* every outlet card opens with a 96 px pastel tile with a serif monogram, and every lounge card with a
   midnight slab and a gold one. On one page: `PP PP MA MA MA` and `ED … ED`. The repetition makes it obvious the art
   is generic, and it reads as "image missing".
   *Do:* remove the art band (`h-24`). Lead each card with a 48 px category medallion (the category icon on the
   category tint) beside the name, as in Airbnb's list rows. For lounges, make the answer the visual: a 4 px top edge
   in the side's colour (airside teal, landside sand) with "After security" or "Before security" as the first line
   in `type-title-sm`. Each card is about 100 px shorter. Keep the outlet page's large art beside the title, because
   one big monogram on a detail page reads as a crest, not a gap. `services-redesign2.spec.ts` ("no outlet or lounge
   card has an image") still holds.
   *Files:* `src/components/commerce/category-art.tsx`, `src/components/commerce/outlet-card.tsx`, `src/components/commerce/lounge-card.tsx`.

7. **Shops: the glance photo over-promises.**
   *Wrong:* a plate of nasi lemak heads "At a glance: 1 place to eat or drink · 7 shops". It suggests a food hall
   while the directory confirms one eatery, and the photo is not taken at KLIA.
   *Do:* put the counts first and the photo second, with a visible caption ("Nasi lemak, a Malaysian dish" plus the
   credit). Or use no photo, and let the counts and the "Only what we could confirm" note be the answer. Lounges'
   C-gates roof is truthful and can stay.
   *Files:* `src/components/commerce/glance-panel.tsx`.

8. **[must] Parking: fill the intro, and fix the phone table.**
   *Wrong:* at 1440 the right half beside "Parking at KLIA" is empty, because the key answer renders nothing. At 390
   the price table gives car park names 134 px, so "Terminal 2 car park (gateway@klia2)" takes three lines and rows
   are 103 to 109 px tall.
   *Do:* make the key answer "From RM 32 a day · Long Term Car Park" with "Book parking online" as its button. These
   figures are already on the page, with the same "Estimated" tag and source. Below 640 px, lay each row out as a
   grid: the name across the full width, then the three prices (1 day / 3 days / 7 days) as three equal cells under
   it. Use CSS grid on `tr`/`th`/`td` so the table semantics stay.
   *Files:* `src/components/parking/parking-price-matrix.tsx`, `src/app/[lang]/[airport]/parking/page.tsx`.

9. **Transport: a quieter touting warning (same words, same place).**
   *Wrong:* a 194 px filled amber block at y 614 on desktop, and 420 px (half the screen) at y 591 on a phone. In
   dark mode it is an olive-brown fill.
   *Do:* keep the `role="note"`, the bold first sentence, its position (the specs `layout-round4` and
   `polish-round5` check it) and every source. Restyle it as a white card with a 3 px amber left edge and a 24 px
   amber icon disc, with the body at `type-body-sm` and a `max-w-reading` measure. In dark mode use
   `--color-warning-bg` at a lower mix (for example `color-mix(in oklab, var(--color-warning-fg) 12%, var(--color-surface))`)
   with `--color-warning-border` as a 1 px hairline, and check 4.5:1.
   *Files:* `src/components/transport/touts-warning.tsx`, `src/app/globals.css` (dark warning tokens).

10. **[must] Phone wraps a client will spot.**
    (a) Transport "What matters most?" wraps 3 + 1, with "Step-free" alone and centred on its own row: use a 2x2
    grid below `sm`. (b) Transit "Our estimate 55 min to 1 h 50 min" breaks over three lines in a 119 px box: stack
    the two stat boxes full width below `sm` and make each value `whitespace-nowrap` per unit. (c) Concierge
    "Answering for KLIA Terminal 1" breaks the chip to "KLIA Terminal / 1": `whitespace-nowrap` on the chip label.
    (d) Guides hub filter chips stack one per row: let them take their own width and wrap (two or three per row).
    *Files:* `src/components/transport/transport-planner.tsx`, `src/components/guides/transit-planner.tsx`,
    `src/components/concierge/concierge-chat.tsx`, `src/components/guides/guide-index.tsx` (lines 36 and 37).

11. **[must] Remove the magenta ring from first impressions.**
    *Wrong:* `/en/search?q=lounge` opens with the field focused (`autoFocus`, `search-results.tsx:92`), so the first
    thing the eye meets is a 2 px magenta (`--color-focus: #a6157f`) double ring. The concierge composer does the
    same after an answer. It is correct for keyboard users and off-palette for everyone else.
    *Do:* on `/search` with a query, do not autofocus (the visitor came to read results). The palette and the empty
    search page can keep it. In the concierge, keep the focus behaviour the round 6 specs require
    (`ask-round6.spec.ts`), but style the composer's `:focus` (not `:focus-visible`) as a quiet navy 2 px border,
    with the magenta ring on `:focus-visible` only. Keep the magenta token for keyboard focus everywhere.
    *Files:* `src/components/search/search-results.tsx`, `src/components/concierge/concierge-chat.tsx`, `src/app/globals.css`.

12. **Concierge: flatten the answer.**
    *Wrong:* the answer's cards sit inside a grey bubble, inside the white conversation card, on the page, with
    two-column mini cards of 6 to 8 lines each. On a phone the answer is a stack of boxes in boxes.
    *Do:* the bubble holds the prose sentence only. Cards follow it at the conversation's full width, one per row:
    name, the rate line in `type-data-xl`, the provenance chip and "More details". The sources line closes the
    turn as one quiet row. Keep every citation, label and the demo banner.
    *Files:* `src/components/concierge/concierge-answer.tsx`, `src/components/concierge/concierge-cards.tsx`.

13. **Facilities: a filter bar, not a 900 px rail.**
    *Wrong:* the type filters are one chip per row in a left rail about 900 px tall, beside a two-column list in
    which every card carries a grey "Not published" well. The page is 11,821 px at 1440.
    *Do:* desktop: a sticky horizontal filter bar above the results (type chips wrap to at most two lines; terminal
    and access as dropdown pills) and results three across. Card: one quiet line "Location, level and hours not
    published · ask at an information counter" in `text-ink-3`, with no well or disc.
    *Files:* `src/components/facilities/facilities-directory.tsx`, `src/components/facilities/facility-card.tsx`.

14. **Honesty labels: show the exception, not the rule.**
    *Wrong:* labels are present and polite, but they are still the most repeated element. Every guide step, every
    corporate figure and every lounge card has a provenance chip plus a sources control drawn as an icon, a number
    and a chevron.
    *Do:* apply the "Official unless marked otherwise" pattern (already on facilities and transport) to guides,
    corporate figures and lounges, with a chip only where an item differs from the section default. Make the
    sources control read "2 sources" in visible text; its accessible name must still contain "Sources"
    (`corporate.spec.ts:101`, `commerce.spec.ts:136`). Keep the provenance legend at the page foot.
    *Files:* `src/components/common/provenance-tag.tsx`, `src/components/common/source-note.tsx`,
    `src/components/corporate/fact-list.tsx`, `src/components/guides/guide-views.server.ts`, `src/components/commerce/lounge-card.tsx`.

15. **Place chips are set like code.**
    *Wrong:* "TERMINAL 1" and "KLIA TERMINAL 2" use `Badge` (`type-data-xs`: 13 px monospace, uppercase, tracked).
    On facilities, the concierge and search they are the noisiest marks on the card.
    *Do:* add a `Badge` variant `label` (sans `type-caption`, semibold, sentence case, neutral tint) for place
    names. Keep monospace for flight numbers, times, gates and airport codes only.
    *Files:* `src/components/ui/badge.tsx`, `src/components/facilities/facility-card.tsx` (line 62), `src/components/concierge/concierge-cards.tsx`,
    `src/components/commerce/lounge-card.tsx`.

16. **Airport frame: say "KLIA" once.**
    *Wrong:* header chip "KUL KLIA", breadcrumb "Home › KLIA › Transport", then the eyebrow "KLIA", all before the
    `h1`.
    *Do:* the eyebrow names the page's group, as the content pages do: "Getting here" (transport, parking),
    "In the terminal" (map, facilities, transit), "Shops and lounges". Or it shows the terminal filter's state
    ("All terminals"). Add new keys in English and Malay ("Ke lapangan terbang", "Di dalam terminal"); do not reuse
    the nav labels.
    *Files:* `src/components/facilities/service-frame.tsx`, `src/lib/i18n/features/{transport,map,commerce}.ts`.

17. **Notices: a status page, not a list.**
    *Wrong:* a narrow centred column of equal rows. "In effect now" is a small chip at the end of each row.
    *Do:* group the notices as "In effect now", "Coming up" and "Ended", each with a count. Give advisory rows a
    3 px severity edge. Put the filters in the header's right column (item 3). Use the page width, with rows at most
    56 rem. Keep the hydration placeholder that holds the chip line (CLS 0 today).
    *Files:* `src/components/airport/notices-browser.tsx`, `src/components/airport/notice-list.tsx`, `src/app/[lang]/notices/page.tsx`.

18. **Search results: a list with hierarchy.**
    *Wrong:* 11 results in two columns, each with the same pin tile and up to 6 lines of summary. Scanning is slow.
    *Do:* one column at up to 48 rem, with the title in `type-title-sm` (query marked), a 2-line clamp on the summary
    and the airport chip at the right. The type icon goes on the group heading, not on every result. Keep the
    "not published" dashed results and the link count the spec checks.
    *Files:* `src/components/search/search-results.tsx`.

19. **Corporate: give the numbers their scale, and keep the band in dark mode.**
    *Wrong:* "104.4 million" is about 24 px, with about 100 px of empty card under it before the chips. In dark mode
    the ivory vision band becomes the page colour, so the hub loses its one change of register.
    *Do:* figures in `type-display-lg` (Hanken, tabular) with the label under them and provenance in one line at the
    foot. The hub is at 7 type sizes at 390 and 8 at 1440 today (A-14 allows 8), so reuse a display size the hub
    already has instead of adding one. In dark mode the band uses `--color-surface-raised` with a 1 px gold top hairline.
    *Files:* `src/components/corporate/fact-list.tsx` (line 46), `src/components/corporate/brand-statement.tsx`, `src/app/globals.css`.

20. **Guides hub: the icon cards look unfinished beside the photo cards.**
    *Wrong:* "Check-in and bag drop", "Security screening" and "Baggage" are pastel plates with a dotted motif and a
    40 px white tile, under two strong photo cards.
    *Do:* make the icon cards midnight, with a 56 px gold line icon and a white title (the hub's closing band
    already uses this language), so the grid alternates photo and midnight like Hamad's "Experience" tiles. Do not add
    photos that are not of these places.
    *Files:* `src/components/guides/guide-card.tsx`.

21. **Help centre: topic cards with less chrome.**
    *Wrong:* each topic card has an icon tile, a "N questions" pill at the top right, a title and two lines.
    Twelve of these make a dense grid.
    *Do:* move the count after the title in `text-ink-3` ("Baggage · 3"), drop the pill, and put the popular
    questions above the topics (they answer faster).
    *Files:* `src/app/[lang]/help/page.tsx`.

22. **Flight page: no ellipsis in the answer.**
    *Wrong:* at 1440 "Your next step" reads "Terminal 2 by 15:40 (estimate) · Check-in: Row X,…". The clamp that fixed
    the CLS now cuts the answer.
    *Do:* widen the panel to 28 rem from `lg` and allow three lines at 1440. Test it with the longest Malay
    sentence. Keep the fixed-height slot and "See this step".
    *Files:* `src/components/flights/flight-summary.tsx`, `src/components/flights/flight-detail.tsx`.

23. **KLIA overview below the hero (1b item 10, still open).**
    *Wrong:* "Services now" still sets a grey "Status not available" box with two chips beside the Immigration card,
    which leaves an empty column.
    *Do:* turn the services with no status into one footnote line, and give the Aerotrain notice and Immigration two
    equal cards. Use the `ServiceBody` rhythm so the overview matches the service pages.
    *Files:* `src/components/flights/ops-status-section.tsx`, `src/components/flights/ops-status.tsx`, `src/app/[lang]/[airport]/page.tsx`.

24. **Home first view (1b item 8, still open).**
    Seven blocks remain in 900 px: the notice strip and the services row are still inside the hero. Move them to a
    slim bar under it, and make the active tile an outline.
    *Files:* `src/components/home/home-sections.tsx`, `src/components/home/notice-strip.tsx`, `src/components/home/mode-quick-actions.tsx`.

25. **Motion: polish without risk.**
    *Wrong:* the only motion is a card lift and an arrow nudge. Moving between the airport's section tabs is a
    hard cut.
    *Do:* add `@view-transition { navigation: auto; }` with a 180 ms cross-fade of `main` only (the header and tabs
    stay put), disabled under `prefers-reduced-motion: reduce`. Add the map's route draw (item 5) and a 150 ms fade of
    the transit verdict's value when it changes, under `motion-ok:`. Never animate the `h1`.
    *Files:* `src/app/globals.css`, `src/components/map/map-canvas.tsx`, `src/components/guides/transit-planner.tsx`.

26. **Malay `h1` length on photo heroes.**
    "Syarikat yang mengendalikan lapangan terbang Malaysia" takes four lines over the aerial on a phone, which pushes
    the lead below the photo's sweet spot. *Do:* add a `size` step to `PageHero` that drops to `type-display-md`
    when the title is longer than 40 characters. Do not shorten the Malay copy.
    *Files:* `src/components/guides/page-hero.tsx`.

## Must fix before the client sees it

1. **A sense of place on the service pages** (item 1). This is what the client will call "basic" after clicking
   from the KLIA hero.
2. **One page top, with no emblem filler** (items 2 and 3). The site has to feel like one product from page to page.
3. **The map's route in the first view** (item 4).
4. **No monogram tiles on shops and lounges** (item 6).
5. **Parking's empty intro and cramped phone table** (item 8).
6. **The four phone wraps** (item 10) and **the magenta ring on first load** (item 11). They are small, but they
   are the details a client screenshots.

Strongly recommended in the same pass, because each is small and visible: items 9 (the warning), 15 (the place
chips) and 22 (the flight page ellipsis).

## How the references compare

- **Hamad:** every first-level page opens on a bright photograph of the place. We now do that on home, airports,
  guides and corporate, but not on the seven pages passengers use most.
- **Dubai:** one big task panel and a few tiles. Our help centre and concierge use the same "rises into the band"
  move well. The service intros' key-answer panel is the same idea and should be on every service page (parking
  lacks it).
- **Changi:** restraint. One line of type, one field, two cards. Our service pages are restrained, but their
  labels are not. Show the exception, not the rule (item 14).
- **Where we are ahead:** answer-first service pages (fares, verdicts, "Most looked for"), the honesty system,
  truthful and credited photography, and a build with no accessibility violations or layout shift. Fix the page
  tops, give each airport page its own photograph, and replace the placeholder art, and this is a credible 8.

## Method notes

- Screenshots were combined into 12 contact sheets and looked at with the two references (13 images looked at).
  Raw captures and the metrics JSON are in the reviewer's scratch folder only. No source file was changed.
- After the review, the build folder `.next-critic3-prod` was deleted. The two `include` lines Next added to
  `tsconfig.json` for it were removed, and the two imports Next pointed at it in `next-env.d.ts` were set back to
  `./.next/types/…`. The server's process group was stopped.
