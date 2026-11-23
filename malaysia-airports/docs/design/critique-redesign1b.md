# Critique: redesign stage 1b (with photography)

Date: 23 November 2026. Reviewer: executive creative director, before the work goes to the client.
Build reviewed: a production build of the working tree (`NEXT_DIST_DIR=.next-critic2 next build`, then
`next start -p 3298`), captured with Playwright (Chromium, deviceScaleFactor 1) at 1440x900 and 390x844,
first screen and one scroll, plus full-page captures of home, KLIA and Penang. Server clock 09:43 to
09:50 MYT (a weekday morning, so the boards are full). Screens: home (English, Malay, dark), KLIA overview,
KLIA departures, the flight page (`/en/kul/flights/cx767-20261123-d`, a delayed flight), My journey with
that flight saved, the airports directory, Penang overview, photo credits. References compared side by
side: `docs/research/screenshots/hamad-home-*`, `dubai-home-*-first-view`, `changi-home-*`. Earlier review:
`critique-redesign1.md` (5.8 / 10).

## Verdict

**Overall 6.4 / 10, up from 5.8. The photographs moved the desktop from "dark template" to "real
airport", but the treatment hides them, the phone barely shows them, and two regressions (a layout
shift on the flight page and broken truncation in the hero panel) must not reach the client.**

The photo library is better than the site makes it look. On `/en/credits` the 2026 aerial of KLIA, the
Terminal 1 roof canopies against blue sky, the Malaysia Airlines A330 and Mount Kinabalu at sunset are
bright, legible and unmistakably Malaysian. On the pages they sit under three stacked navy veils and come
out brown and murky. Hamad, Dubai and Changi all show one bright, saturated photograph at full strength
with words on a local scrim. We do the opposite: the whole frame is dimmed so every word is safe.

On a 390 px phone the home hero is a fifth-width slice of a timber ceiling, under a 52 % veil, covered
by the search card, the mode switch, six tiles and the notice strip. A client looking at this on their
phone will not see that photography has arrived at all.

## What now works

- **Desktop heroes on airport pages.** Penang (terminal, runway, hills and towers) and KLIA (the white
  branching columns) at full width, with a large `h1` and a quiet search card, are the best first
  views the product has had. Penang is the strongest screen in the build.
- **"Discover Malaysia" cards.** Four tall photo cards (Penang Bridge, Mount Kinabalu, Langkawi,
  Kuching) finally deliver the travel-magazine feel the client asked for.
- **The flight page answers first.** Status, the time `09:55`, gate H9 and the next step are all in the
  first view on both sizes, which fixes the old item 4.
- **The demo labels are calmer.** The demonstration notice now sits as a slim header row inside the
  board instead of a yellow box above it, which fixes the old item 3.
- **My journey.** The boarding card is now in the first phone screen (y ≈ 420, was 525), with a real
  "Next" line.
- **Credits page.** Clean and honest, and every photo is traceable. The "Photo credits" link is in the
  footer.
- **Hygiene held.** axe (WCAG 2.0 to 2.2 A and AA) finds 0 violations on 19 of 20 captures, there is one
  `h1` per page, no horizontal scroll and no console errors. CLS is at most 0.005 on home, KLIA, Penang,
  the board, the directory and credits.

## Scores by screen

| Screen | Desktop 1440 | Phone 390 | One-line reason |
|---|---|---|---|
| Home (English, light) | 7.0 | 5.5 | A real photo at last, but it is veiled to brown, and the first view still stacks seven blocks. On the phone the photo is effectively gone. |
| Home (Malay) | 6.0 | 5.5 | "Berlepas sekarang" truncates every row ("Lang…", "MH 16…", "Ho Chi M…", "D7 37…"). "Menjemput seseorang" wraps, and "Ruang menunggu (lounge)" makes uneven tiles. |
| Home (dark) | 6.5 | 5.5 | The hero is the same as in light. Below it the board still dissolves into the midnight page. |
| KLIA overview | 6.5 | 5.5 | Good hero. After it, the page falls back to v1 documentation: "Status not available", line-art Explore cards and the tiles repeated a third time. The phone hero is 140 px of near-black. |
| Departures board | 7.0 | 5.5 | Still the best data surface. Desktop status chips are clipped at "Delayed 2" and the sticky group headers stack. On the phone, destinations are ellipsized ("Langk…", "Tokyo (…") and axe reports target-size (serious). |
| Flight page | 6.5 | 6.5 | The answer is in the first view, but the page jumps (CLS 0.106 desktop, 0.081 phone). The timeline prints 06:55 beside "Check-in closed at 08:55". The photo band is a brown smudge. |
| My journey (saved flight) | 6.0 | 6.0 | Works as an app now, but it has no imagery, the boarding card is small, and "My needs" sits before the steps on the phone (CLS 0.055). |
| Airports directory | 7.0 | 6.0 | Photo cards and the map are strong. Two cards crop terminal signage mid-word ("erlepasan Departu", "NGAN TERBANG ANTARABANGSA KOTA KINA"), and Langkawi is veiled almost to black. |
| Penang overview | 7.0 | 6.5 | Best hero in the build. Below it, not one Penang photo, although the library has Penang Bridge, the Blue Mansion, Khoo Kongsi and Lebuh Penang. |
| Photo credits | 8.0 | 7.0 | Exemplary and honest. On the phone it runs 10,966 px of 96 px thumbnails. |

## Measured on this build

| Page | axe | CLS (load + one scroll) | `<img>` over 50 px | Notes |
|---|---|---|---|---|
| `/en`, `/ms`, `/en` dark | 0 | 0 | 1 (hero) | The first-ever hit painted the hero at 2.25 s on localhost while the image optimiser generated AVIF; warm hits were 0.2 to 0.5 s |
| `/en/kul` | 0 | 0.003 / 0.004 | 1 | |
| `/en/kul/flights` | 0 / **1 serious** (phone: `target-size`, "View flight OD 1146, Penang") | 0.003 / 0.005 | 0 | |
| Flight page | 0 | **0.106 / 0.081** | 0 | The "Your next step" glass panel grows from 174 to 237 px at 570 ms (desktop); on the phone the status section moves 110 px |
| `/en/journey` | 0 | 0.009 / **0.055** | 0 | "My needs" collapses from 287 to 142 px after hydration (phone) |
| `/en/airports` | 0 | 0 | 5 | |
| `/en/pen` | 0 | 0.001 / 0.004 | 1 | |
| `/en/credits` | 0 | 0 | 30 | |

## The 22 most valuable improvements, ranked

Items 1 to 6 are also listed under "Must fix before the client sees it".

1. **Flight page: the layout shift (non-negotiable).**
   *Wrong:* on a delayed flight the "Your next step" panel holds two lines while it loads (`min-h-14`) but
   fills to three lines plus the Fast Track row. At 570 ms it grows from 174 to 237 px and pushes the
   demo bar and status card down 23 px (desktop CLS 0.106). On the phone the status section drops 110 px
   (0.081). The integrate report measured 0.004 on this page. The jump depends on how long the sentence
   is, so it shows on a delayed flight whose gate has closed.
   *Do:* render the server-known parts of the panel (the Fast Track row and the booking link) on the
   server, and put the time-dependent sentence in a slot with a fixed height for each breakpoint
   (three lines at 390, two at 1440, `line-clamp` plus a "See this step" link). An alternative is to
   move the panel under the title at full width, where one line fits. Then add an e2e CLS check on a
   delayed flight at 390 and 1440 with the clock installed. On `/en/journey` (phone), render "My
   needs" collapsed on the server so it does not shrink after hydration.
   *Files:* `src/components/flights/flight-summary.tsx` (frame at line 31), `src/components/flights/flight-detail.tsx`,
   `src/components/flights/my-journey.tsx`, `src/components/flights/needs-control.tsx`, `e2e/flight-round5.spec.ts`.

2. **Home on phones: no visible photograph.**
   *Wrong:* at 390 px the hero is framed on a fifth of the ceiling photo (x 0.6) under `scrim-header`
   at 52 %, and every pixel below y = 205 is covered by controls. The first phone screen reads as dark
   wood with buttons. Changi and Hamad both give the photograph the top 40 % of the phone screen.
   *Do:* give phones a dedicated photo band 260 px tall with a bright, readable frame (the Terminal 1
   roof canopies against sky, or the 2026 aerial, focal on the roof). Put the `h1` at its foot on a
   bottom-only scrim, and let the search card overlap the photo's lower edge by 32 px. Below that, the
   mode switch. Move the six tiles to a horizontal scroll row and the notice strip below the first
   screen. Drop the "Search arrivals instead" row on phones: the "Arriving" segment does the same job.
   Re-measure contrast on the `h1` over the brightest sky pixel.
   *Files:* `src/components/home/hero-backdrop.tsx` (`HOME_HERO_FRAMING`, scrims at lines 51 to 53),
   `src/components/home/home-sections.tsx`, `src/components/home/mode-quick-actions.tsx`, `src/content/images.ts`
   (a per-breakpoint hero entry or focal point), `src/app/globals.css` (`--scrim-header-alpha`, around line 430).

3. **Desktop hero: the photograph is graded into mud.**
   *Wrong:* `scrim-header`, `scrim-bottom` (two-thirds of the height at 55 %) and the feathered scrim
   stack over the whole frame. The CC0 ceiling shot, already warm and low-contrast, comes out as brown
   texture and does not say "KLIA". The right half, where the photo could breathe, sits behind the
   "Departing now" glass panel.
   *Do:* lead `HOME_HERO_IMAGES` with the Terminal 1 roof canopies or the aerial (the KLIA silhouette)
   and keep the ceiling second. Scrim only behind the words (the left 55 %, feathered) and leave the
   right 45 % at full exposure. Cut `scrim-bottom` to the bottom third, behind the tiles only: they are
   solid glass panels already. Grade all 30 library files once at build time (a small lift, +8
   contrast, warm highlights) so the Wikimedia photos read as one set. Re-run the contrast sweep
   (0 of 3,189 runs under 4.5:1 must still hold).
   *Files:* `src/components/home/hero-backdrop.tsx`, `src/app/globals.css` (`--scrim-*` at lines 424 to 440,
   `@utility scrim-bottom` at line 1232), `src/content/images.ts`, the resize step in `docs/design/photography.md`.

4. **Home hero panel ("Departing now"): truncation looks broken, worst in Malay.**
   *Wrong:* the English panel reads "MH 1694 · …" and "D7 372 · AirA…". The Malay panel reads "Lang…",
   "MH 16…", "Ho Chi M…" and "D7 37…": the hero's live proof looks like a bug.
   *Do:* never ellipsize a destination. Drop the airline name from line 2 (the flight number is enough),
   let the destination wrap to two lines, and use short status labels below 1280 px (Malay "Ditutup",
   "Naik", "Dibuka"), or widen the panel to 22 rem. Test with the longest Malay strings.
   *Files:* `src/components/home/departing-now.tsx`, `src/lib/i18n/ms.ts`, `src/lib/i18n/en.ts`.

5. **Board on phones: destinations truncated, plus a serious axe finding.**
   *Wrong:* "Langk… LGK", "Ho Chi Min…", "Singap… SIN", "Tokyo (… NRT", "CX 767 ·…": the status pill wins
   the space and the destination, which is the answer, loses it. axe `target-size` (serious) flags the
   "View flight OD 1146, Penang" overlay link.
   *Do:* line 1 holds the time and the destination in full (wrap allowed); line 2 holds the flight,
   gate and a compact status (icon plus a one-word label, or the pill on line 2 at the right). Drop the
   airline name on phones. Give the row link a target of at least 24x24 px with no overlap from the
   bookmark button.
   *Files:* `src/components/flights/flight-row.tsx`, `src/components/flights/flight-board.tsx`, `src/components/home/board-preview.tsx`.

6. **Flight page timeline: the wrong time on the rail.**
   *Wrong:* the rail prints 06:55 beside "Check-in closed at 08:55". In the closed branch of
   `buildJourney` the step's `time` is `opensAt ?? closesAt`, so the rail shows when check-in opened. On a
   product sold on honesty this reads as an error, on the flight page and on My journey.
   *Do:* in the closed branch set `time: closesAt` (and keep `endTime`). Add a unit test for a delayed
   flight whose check-in has closed.
   *Files:* `src/lib/journey/index.ts` (around line 782), `src/lib/journey/journey.test.ts`.

7. **Airports directory: crops through signage, and a veil that hides one card.**
   *Wrong:* the Langkawi card is cut through "Perlepasan / Departure", and the Kota Kinabalu card
   through "LAPANGAN TERBANG ANTARABANGSA KOTA KINABALU". Both look like cropping mistakes. Langkawi is
   dimmed almost to black.
   *Do:* move both focal points so the sign is either whole or out of the frame (for Kota Kinabalu,
   focal y 0.7, or use `kota-kinabalu-airfield`). Use a bottom-only gradient from 45 % on every
   directory card instead of the full veil.
   *Files:* `src/content/images.ts` (focal for `langkawi/airport-departures` and `sabah/kota-kinabalu-terminal`),
   `src/components/airport/airport-directory.tsx`.

8. **Home first view: still seven blocks, on three different grids.**
   *Wrong:* the eyebrow, `h1`, search card, mode switch, six tiles, notice strip and "Services at KLIA
   now" row, plus the panel and the credit, all sit in 900 px. The right edges disagree: the search
   card ends at x 900, the mode switch at 978, the tiles at 1290. A white "Flights" tile sits directly
   under the white "Departing" segment, so there are two "selected" states.
   *Do:* keep the `h1`, the search with the mode switch under it (8 columns) and "Departing now" (4
   columns). Move the six tiles into one row that straddles the hero's bottom edge. Take the notice
   strip and the services row out of the hero into a slim bar under it. Make the active tile an
   outline, not a white fill.
   *Files:* `src/components/home/home-sections.tsx`, `src/components/home/journey-modes.tsx`, `src/components/home/mode-quick-actions.tsx`,
   `src/components/home/notice-strip.tsx`, `src/components/home/home-ops-status.tsx`.

9. **Airport pages: the library's place photos are missing below the hero.**
   *Wrong:* "Explore KLIA" is four line-art cards and "Explore Penang" two, yet the library holds the
   apron at night, the KLIA Ekspres, nasi lemak, satay, Penang Bridge, the Blue Mansion, Khoo Kongsi
   and Lebuh Penang.
   *Do:* map the explore cards to photos (Flights to `aircraft/apron-night`, Transport to
   `rail/klia-ekspres`, Shops and food to `food/nasi-lemak`, Terminal map to `klia/terminal-1-roof`).
   Keep the line art only where there is no photo. On airports that have them, add a "Beyond the
   airport" strip with three place photos that link to transport.
   *Files:* `src/app/[lang]/[airport]/page.tsx` (Explore section, lines 178 onward), `src/components/ui/media-card.tsx`,
   `src/content/images.ts`.

10. **KLIA and Penang "Services now": contradictory and unbalanced.**
    *Wrong:* the Immigration card says "Status not available" directly above a "Queue estimates: about
    9 min" table. At KLIA a grey "Status not available" box with two chips sits beside it, with 120 px
    of empty space below.
    *Do:* when estimates exist, replace "Status not available" with "No live status · demo estimates".
    Turn the services with no status into one footnote line. Lay out the Aerotrain notice and
    Immigration as two equal-height cards.
    *Files:* `src/components/flights/ops-status-section.tsx`, `src/components/flights/ops-status.tsx`, `src/components/flights/topic-status.tsx`.

11. **Airport heroes on phones: a band of near-black.**
    *Wrong:* `/en/kul` at 390 px shows about 140 px of dark ceiling between the header and the eyebrow,
    which is a photo nobody can read.
    *Do:* frame phone crops on a bright part of the photo (the canopy with sky for KLIA), and lighten
    the top veil because the header has its own ground. Same art-direction method as item 2.
    *Files:* `src/components/airport/airport-header.tsx`, `src/components/airport/airport-backdrop.tsx`, `src/components/ui/media.ts`.

12. **The flight page band and My journey: no picture worth the name.**
    *Wrong:* the flight band is the ceiling photo darkened to a brown smudge, and My journey is a flat
    midnight band. These are the two most "app" screens, and they have the least imagery.
    *Do:* show the destination's photo when the library has one (Penang, Kota Kinabalu, Kuching,
    Langkawi, Kuala Lumpur), otherwise `aircraft/apron-night` or the A330. Make the band 240 to 280 px
    with a bottom-only scrim. Give the saved-flight card a 120 px photo strip, like a wallet pass. The
    rule "never show another airport's photo" still applies.
    *Files:* `src/components/airport/airport-backdrop.tsx` (variant `band`), `src/components/flights/flight-detail.tsx`,
    `src/components/flights/saved-flight-card.tsx`, `src/content/images.ts` (a `forDestination` helper).

13. **Board on desktop: clipped chips and stacked sticky headers.**
    *Wrong:* at 1440 the status chips are clipped at "Delayed 2" by a scroll strip, with 400 px free
    beside the search. While scrolling, "From 10:00 · 4 flights" stays stuck above "From 11:00 · 8
    flights", with a stray "Demo" pill floating at the right.
    *Do:* let the chip row wrap from 1024 px (or give it its own full-width row). Make only the current
    group header sticky by putting each group in its own container. Remove the floating pill, since the
    board header already says "Demonstration data".
    *Files:* `src/components/flights/board-toolbar.tsx`, `src/components/flights/flight-board.tsx`, `src/components/flights/flight-board-explorer.tsx`.

14. **Destination and gateway cards: weak frames.**
    *Wrong:* the Langkawi card is framed on rocks and a palm (the Pantai Cenang beach is cropped out),
    and the hazy grey Penang Bridge leads the row. The whole-card tint makes blue skies grey. Subang is
    the only line-art card in a row of photos.
    *Do:* set the Langkawi focal to x 0.35 or use the Sky Bridge. Lead with Mount Kinabalu at sunset.
    Use a bottom 40 % gradient instead of a full tint. Make Subang a smaller text card so the art does
    not sit as a peer of the photos.
    *Files:* `src/components/home/destination-card.tsx`, `src/components/home/home-sections.tsx` (gateways), `src/content/images.ts`.

15. **Hero load speed: 2.5 s is still missed on `/en` and `/en/kul` (3.52 and 3.53 s in Lighthouse).**
    The first hit on a cold server also takes 2.25 s here while next/image generates the AVIF.
    *Do:* pre-generate the hero AVIF and WebP widths at build time and serve them as static files with
    an explicit `srcset`, bypassing the optimiser for the hero. At minimum, warm every hero URL before
    any client demo.
    *Files:* `src/components/home/hero-backdrop.tsx`, `src/components/airport/airport-backdrop.tsx`, `next.config.ts`, `scripts/`.

16. **KLIA overview: the third copy of the tiles.**
    *Wrong:* "At a glance" (three cards), "What do you need at KLIA?" (the mode switch and six tiles) and
    the section navigation all offer the same destinations.
    *Do:* remove "What do you need at KLIA?" from the overview, or fold it into "At a glance".
    *Files:* `src/app/[lang]/[airport]/page.tsx`.

17. **Dark mode: the board still disappears (old item 23).**
    *Do:* in dark mode raise the board surface one step above the page (for example a page at
    `#070b18` with a board at `#0e1630`), with a 1 px top highlight, so it reads as an object.
    *Files:* `src/app/globals.css` (dark tokens), `src/components/home/board-preview.tsx`.

18. **Malay labels that wrap.**
    "Menjemput seseorang" takes two lines in the segmented control at both sizes. "Ruang menunggu
    (lounge)" takes three lines and makes the tile row uneven. "Pergi ke lapangan terbang" leaves an
    orphan word. *Do:* use short Malay labels ("Menjemput", "Ruang rehat"), give tiles a fixed height
    with a two-line clamp, and use `text-balance` on strip links.
    *Files:* `src/lib/i18n/ms.ts`, `src/components/home/journey-modes.tsx`, `src/components/home/mode-quick-actions.tsx`.

19. **My journey: the card should be the hero.**
    *Wrong:* on desktop the boarding card is 265 x 165 px in a one-third column, and "Next · Gate closed at
    09:40: departs 09:55" repeats the "Gate closed" pill and chains colons. On the phone, "My needs"
    comes before the steps.
    *Do:* make the boarding card full width at the top, with the photo strip from item 12, a large time,
    the gate and the status. Put the steps below it, then "My needs". Copy: "Gate closed 09:40 · departs
    09:55".
    *Files:* `src/components/flights/my-journey.tsx`, `src/components/flights/saved-flight-card.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`.

20. **Flight page rhythm.**
    About 110 px of dead space separates the action row from "Your journey, step by step", and the five
    actions are equal pills. *Do:* make "Save flight" the only filled button, turn the other four into
    quiet icon-and-label buttons, and tighten the gap to the 48 px section rhythm.
    *Files:* `src/components/flights/flight-actions.tsx`, `src/components/flights/flight-detail.tsx`.

21. **Credits on phones.**
    The page is 10,966 px long. *Do:* use a two-column grid of 160 px thumbnails, with the licence
    details in a disclosure and a short index of sections at the top.
    *Files:* `src/app/[lang]/credits/page.tsx`.

22. **Before a public launch: two older airport photos.**
    The Langkawi departures entrance (2014) and the Kota Kinabalu terminal front (2015) should be
    compared with the airports today (see the photography hand-off). Not needed for the client
    showing, but note it in the deck.
    *Files:* `docs/design/photography.md`, `src/content/images.ts`.

## Must fix before the client sees it

1. **The flight page layout shift** (item 1). CLS 0.106 breaks a non-negotiable, and the journey
   page's 0.055 on the phone should go with it.
2. **A photograph on the phone's first screen** (items 2 and 11). The client chose "real licensed
   photography", and most of them will open the link on a phone.
3. **The "Departing now" truncation** (item 4). It is on the first screen and looks like a bug in
   Malay.
4. **Phone board destinations and the target-size violation** (item 5).
5. **The timeline's wrong time** (item 6). A one-line fix with a test.
6. **The signage crops on the directory** (item 7). Two focal-point changes.

Strongly recommended for the same pass, because it is what makes the photos read as premium: **item 3**
(lead with a bright KLIA image and scrim only behind the words).

## How the references compare

- **Hamad:** one bright interior photograph at full strength, with the search bar and a single row of
  six tiles at its foot. The photograph gets about 60 % of the first view. Ours gets about 15 % of its
  area visible between panels, under a veil.
- **Dubai:** a tinted photograph, but with one large "Find your flight status" panel and four tiles.
  The panel sizes on the left and right match.
- **Changi:** a bright pool photograph, one line of type, one search field and two promotional cards.
  This is the restraint our home still lacks.
- **Where we are ahead:** the live "Departing now" panel in the hero, the airport-specific headers, the
  flight page's answer-first card, and the honesty system (provenance chips, the demo row, credits).
  None of the three references does these. Fix the photo treatment and the crowding, and this has a
  real claim to be better than all three on usefulness while matching them on mood.
