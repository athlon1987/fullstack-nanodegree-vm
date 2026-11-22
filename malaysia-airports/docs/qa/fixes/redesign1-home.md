# Redesign round one: the shell and the home page (Direction v2)

22 November 2026. One engineer (shell and home). Inputs: the client's verdict ("The UI/UX of this
looks really bad. It's so basic."), `docs/design/direction.md` (Direction v2), `docs/design/design-system.md`,
the new primitives in `src/components/ui`, the photo library `src/content/images.ts`, and the reference
captures in `docs/research/screenshots/` (Hamad, Dubai, Changi; looked at before designing). No git
commands were run; nothing outside the owned paths was edited.

**Result.** The shell (utility strip, header, phone tab bar, menu sheet, footer), the home page and the
404 body are rebuilt in Direction v2: a cinematic midnight first screen with the headline, a frosted
flight search, glass journey modes and quick actions and a slim glass status strip; the next flights as
app-like cards; a "Discover Malaysia" rail of place cards; the journey, concierge and shop-and-dine
bands; a dark footer with photo credits. Every feature, link, label and data source of the previous
home is still there; demonstration labels are quieter, never gone.

## The photography question

The photo library is still empty (Wikimedia refused the research requests; `docs/design/photography.md`,
"Status"), so the brief's "HeroMedia with a KLIA photograph" cannot be met today, and no stand-in photo
was added. Instead every photo slot is **photo-ready with a designed fallback**, and switches by itself
when the library lists a picture:

| Slot | With a photo (automatic) | Until then |
|---|---|---|
| Home hero | `HOME_HERO_IMAGES[0]` through `next/image`: `fill`, `preload`, `fetchPriority="high"`, `sizes="100vw"`, `quality={75}`, blur placeholder, focal point as `object-position`, a header scrim and a foot scrim, a small credit line | "KLIA at dusk" (`src/components/home/hero-art.tsx`): an inline SVG illustration of the main terminal's canopy of roof shells on its column "forest", the hall glowing warm beneath, an aircraft climbing out, a lit apron. Decorative, about 5 KB of markup, no request, deterministic (fixed-seed stars: no random values or clock in render), hidden in forced colours |
| Destination and gateway cards | The library photo whose `place` is that airport (never another place's, never the generic fallback), lazy, blur placeholder, eases in 4% on hover | A deep place-coloured ground (dusk strait for Penang, mountain dawn for Kota Kinabalu, rainforest for Kuching, Andaman sea for Langkawi, midnight for the KL gateways) with the airport's own line drawing (`AirportVignette`) in light strokes |
| Shop and dine | (no library slot yet) | Three decorative gradient tiles with large line icons and the tabur motif |

Quality is 75 rather than 70 because `images.qualities` is unset (Next 16 coerces to 75 and warns in
dev). AVIF needs `images: { formats: ['image/avif', 'image/webp'] }` in `next.config.ts`: a hand-off to
the platform owner (below), not changed here.

## What changed

### Shell (`src/components/shell/**`)

- **Utility strip** (`site-header.tsx`): a slim midnight strip. "Concept prototype, not an official
  Malaysia Airports website" keeps its link to `/about-this-prototype`, now led by the brand's small gold
  lozenge instead of a flask; below `lg` the short form ("Concept prototype, not official") keeps it on
  one line. Assistance, Corporate site, EN/BM and Display settings are pill-shaped quiet links.
- **Header**: a midnight bar (an `on-media` scope: light ink and the light focus ring everywhere),
  exactly `--spacing-header` tall and sticky as before. Wordmark, primary navigation (soft pill on hover,
  a short gold rule under the current section), the airport chooser as a pill (solid gold while no
  airport is chosen, the v1 "solid unset state" rule; a quiet glass pill once chosen), and round icon
  buttons for search, My journey (gold count badge) and the concierge. Skip link, every control, every
  accessible name and the container-query breakpoints are unchanged.
- **Transparent over the home hero.** The bar's surface is a separate layer behind its content. On a
  page whose `main` holds `[data-hero-under-header]` (the home) the layer is transparent at the top and
  fades in over the first 5rem of scrolling: with CSS scroll-driven animations (`animation-timeline:
  scroll(root)` on the existing `fade-in` keyframes) it needs no script and nothing to hydrate; in
  browsers without them `ScrollChrome` sets `data-scrolled` on `<html>` and the layer fades on that;
  without JavaScript and without scroll-driven animations the bar is simply solid. Under reduced motion
  (system or the site's own setting) the bar switches at once instead of fading. The hero runs up under
  the header with `-mt-header` in static CSS, so nothing shifts. Measured: opacity 0 at the top, 0.375 at
  30 px, 1 at 400 px (normal); 1 at 30 px under both reduced-motion settings; same without JavaScript.
- **Phone tab bar** (`mobile-bar.tsx`): frosted glass that follows the theme (solid for "reduce
  transparency" and high contrast), a soft shadow, safe-area padding kept. The current item's icon sits
  in a filled pill and its label turns full ink (state not by colour alone); the search action is a
  primary pill; the journey count is a gold badge. Columns, labels, `aria-current`, prefetch timing and
  the compact-chrome behaviour are unchanged.
- **Menu sheet** (`panels.tsx`, `primary-nav.tsx`): a full-screen midnight sheet on phones (a floating
  side panel from `sm`), the airport row first, large app-like navigation rows with round icon badges (the
  current section's badge turns gold), the call row, "More", the language as two pills, and the display
  settings. Same items, order and names.
- **Footer** (`site-footer.tsx`): a deep midnight band under a gold hairline: wordmark and tagline, "What
  this prototype is" on a quiet glass card, the four link columns (gold headings), a new **Photo credits**
  link to `/[lang]/credits` in "Transparency and legal", the official contacts, and the not-official
  disclaimer with the language links and "Back to top".
- `scroll-chrome.tsx` also maintains `data-scrolled` (see above). `airport-switcher.tsx`: the desk and
  row variants are rounded, with a gold unset state.

### Home (`src/app/[lang]/page.tsx`, `src/components/home/**`)

Order: hero, the next flights, Discover Malaysia, your journey, the concierge (midnight band), shop and
dine (the one ivory band). Bands alternate light and dark; one eyebrow per section; no section numbers.

- **Hero** (`HomeHero`): full-bleed, the picture behind (see above), the header transparent over it. A
  gold kicker (hidden on phones and short windows), the `h1` in big tight Hanken (30 px on a phone, up
  to 72 px; "beautifully connected." in bright gold), and the lead on tall desktops only. The flight
  search sits on a near-white frosted panel with 28 px corners (the brightest thing on the screen, as on
  Hamad); the saved flight card follows it (still above the journey modes); then the journey modes as a
  smoky-glass segmented pill control with a white selected pill, the six quick actions as glass tiles
  with round icon badges (the "Start here" tile is white), and the notice strip as one slim glass panel
  (severity in a tinted round mark, Details, Getting there, Terminal guidance, the KLIA services row).
  Arriving mode's checklist is a glass card too. The `h1` is in the static HTML; vertical rhythm follows
  the window height so the whole first screen fits at 1280 by 720, 1440 by 900 and 390 by 844.
- **The next flights** (`HomeBoard`): a big heading and a lead on the left (sticky on desktops), the board
  on the right at a width where `FlightBoard` shows its app-like card list (time in gold, status pills,
  gate chips). The board's own heading became an `h3`; its demonstration banner and the phone "Demo"
  marker that stays in view are unchanged in behaviour.
- **Discover Malaysia** (`HomeNetwork`, `destination-card.tsx`): Penang, Kota Kinabalu, Langkawi and
  Kuching as tall place cards (a swipeable rail with the next card peeking on phones, four up from `lg`),
  then "Gateways to Kuala Lumpur" (KLIA Terminal 1, KLIA Terminal 2, Subang) as wide cards, then the "One
  network, 39 airports" midnight band with gold figures and a gold "Browse the directory and map" pill.
  Each card is one link (the title; its hit area covers the card), names the place and the code, and
  lifts on hover where motion is allowed. Same destinations and links as before, plus "All airports".
- **Your journey** (`HomeJourney`, `journey-teaser.tsx`): the same timeline teaser on a rounded, lifted
  card; provenance legend unchanged.
- **Concierge** (`HomeConcierge`, `concierge-questions.tsx`): a midnight band; the question buttons as
  rounded rows; the sample answer in a glass chat panel with its provenance tag and sources.
- **Shop and dine** (`HomeShopDine`): the ivory band, filters and the browse button unchanged, with a
  decorative mosaic (see above).

### Shared pieces (`src/components/common/**`)

- `quick-action.tsx`: rounded 24 px tiles that lift on a soft shadow instead of an outline, the icon in a
  round badge; a new optional `tone` (`default` | `media`) for glass tiles over a hero.
  `mode-quick-actions.tsx` and `journey-modes.tsx` pass a `tone` too (default unchanged for the airport
  overview, which also uses them). The journey modes' sub-labels ("Door to gate") are now also hidden on
  windows under 50rem high, like the quick actions' hints, so the Malay first screen fits at 1280x720;
  this applies on the airport overview too.
- `section-heading.tsx`: bigger spacing, no section numbers (the `number` prop is accepted and ignored:
  numbered prefixes are on Direction v2's "stop doing" list).
- **Demonstration labels, quieter:** `demo-data-banner.tsx` loses its hazard-stripe column (a slim amber
  rule and a round flask mark instead; the title in sentence case; 24 px corners); `demo-tag.tsx` and the
  demo `provenance-tag.tsx` become amber pills with a small mark. Words, colours, `data-demo-*` markers,
  accessible names and "Do not use this data to plan travel" are all unchanged.

### 404 (`src/components/platform/not-found-body.tsx`, `not-found-content.tsx`)

The localised 404 is a midnight band with the "KLIA at dusk" art behind a scrim, a gold "404", the title
(`h1` text unchanged, still in the server HTML) and three ways back in (home, search, airports). The
global 404 gets the midnight header and footer and a gold rule.

### Copy (`src/lib/i18n/en.ts`, `ms.ts`, appended only)

`home.v2.boardTitle`, `boardLead`, `discoverTitle`, `discoverLead`, `gatewaysTitle` and
`shell.footer.photoCredits`, in English and Malay. No existing string changed.

## Accessibility and performance notes

- Text over the art or a photograph always sits on the dark sky of the art, a scrim (`scrim-behind` on
  the headline block when a photo is shown; a header-zone scrim at the text alpha), or a glass panel
  whose own fill carries the contrast (`glass`, `glass-dark`, both solid for reduced transparency and
  high contrast). axe finds no contrast issue in any combination checked (below).
- Tailwind's default palette is removed in this project, so `white` utilities do not exist; every
  translucent white is written as `rgb(255 255 255 / a)`.
- No layout shift: the hero's height comes from its content (and `svh` minimums), the header overlap is
  static CSS, the saved-flight reservation rules are untouched, the art is inline.
- Static shell: no clock, no random values, no new Suspense; the home is still fully static.
- Home type sizes stay at 8 (A-14): card titles use the board's 20 px, the kicker the caption size.

## Hand-offs (outside my paths)

1. **Platform (`next.config.ts`)**: add `images: { formats: ['image/avif', 'image/webp'], qualities: [70, 75] }`
   so the hero photo (once there is one) is served as AVIF at quality 70.
2. **Photo library**: when photos arrive, list a KLIA terminal photograph first in `HOME_HERO_IMAGES` and
   one photo per destination (`place` = `pen`, `bki`, `lgk`, `kch`; `kul` with group `klia`/`klia2`) and
   the home picks them up with no code change.
3. **Flights (`flight-search-box.tsx`)**: the hero restyles the search card from outside with descendant
   selectors (`[&>div]:…`, hides the rebung rule). A `surface` prop on `FlightSearchBox` would be cleaner.
4. **Flights (`flight-board.tsx`)**: the airline badge's 11 px text is a type size of its own on the home;
   the home stays at 8 sizes with it, with no room for another.

## Screens looked at (Playwright, deviceScaleFactor 1)

Home 1440x900 and 1280x720 (first screen and full page), 390x844 (first screen and full page), 820x1180;
light and dark; English and Malay; scrolled header (solid bar) and the reduced-motion header; the phone
menu sheet (English light, Malay dark); `/en/kul` on a phone with the new header; the localised 404 at
1440 (English) and 390 (Malay, dark). Reference captures read first: Hamad home desktop and mobile, Dubai
home desktop and mobile and flight status, Changi home desktop; the previous home `01-home-desktop.jpg`.

## Checks run

All against my own dev server (`NEXT_DIST_DIR=.next-home npx next dev -p 3282`), not a production build.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx eslint` on every path I own (shell, home, common, platform, the three `[lang]` files, `en.ts`, `ms.ts`) | 0 problems |
| `npx vitest run` | 43 files, 614 passed, 1 skipped (the photo-library count test, skipped while the library is empty). One run under heavy load timed out the concierge engine's property test (6 s against a 5 s limit); it passes alone and in the full re-run |
| First screen (own script, the smoke test's assertions): search, journey modes, header airport chooser, the notice's Details link and all six quick actions in the viewport, 6 action links | Pass at 1440x900, 1280x720, 390x844 and 360x800, English and Malay, light and dark (Malay at 1280x720 needed the mode sub-labels hidden on short windows and a slightly smaller headline on short windows: Details now ends at 664 px) |
| axe (WCAG 2.0 to 2.2 A and AA tags) on `/en` and `/ms` | 0 violations at 1440, 1280, 390 and 360, light; 1440 and 390, dark |
| Home type sizes in `main` (the A-14 count) | 8 at 390 and 1440, with and without a saved flight (a flight for tomorrow; the e2e fixture's flight is in the past now) |
| axe on other shell views | 0 violations: the localised 404 (`/en/kul/zzz` at 1440 light, `/ms/kul/zzz` at 390 dark), the open phone menu sheet (`/en` light, `/ms/kul` dark) and `/en/kul` at 1440 dark with the new header |
| Horizontal overflow | 0 px at 360, 390, 1280, 1440 |
| One `h1` on the home | Yes, in the static HTML |
| Header fade (computed opacity of the bar layer) | 0 at the top, 0.375 at 30 px, 1 at 400 px; 1 at 30 px under the system and the site reduced-motion settings; works with JavaScript off |
| e2e `smoke.spec.ts` + `shell.spec.ts` (94 tests, 3 workers) | 60 passed, 30 failed in the first run, almost all timeouts while the dev server compiled routes after a restart. Re-run of the 30 with one worker: 24 passed, 6 failed: the A-01 airport-chrome test at three sizes on the desktop project (45 s timeouts: it loads 2 x 7 airport section pages per test in dev; the phone project's runs pass), A-13 "all section tabs fit" (`/ms/kul` section tabs at 1280 px: 1254 > 1241, the airport section navigation, not shell or home code), and "unknown pages answer 404" on both projects (a 200 in dev mode, as the design-system round also found) |
| e2e, home-related tests in `trust`, `handoffs`, `access-round6`, `speed-round5`, `layout-round4`, `polish-round5` (filtered, 70 tests) | 63 passed, 7 skipped, 0 failed: home type scale (en, ms), type sizes with a saved flight (390, 1440), header and bottom bar at 200% device text, CLS at 1440 (en, ms), Malay at 360 px and 125% text, the 404s with the shell and the `h1` in the server HTML, the home strip's status lines, B-09, B-15, C-05, D-13 |

Not run here: Lighthouse and a production build (the next verification round's job); the global
404's new header and footer could not be seen in dev (Next serves its default 404 for unmatched
files there).

## Clean-up

My dev server (its own process group) is stopped; `.next-home` is deleted; the two `.next-home` lines
Next added to `tsconfig.json` are removed. `next-env.d.ts` no longer names `.next-home`; at the time of
writing it names `.next-flights`, rewritten by another engineer's dev server that is still running, so
it is left for them to restore to `.next`. Scripts and screenshots stayed in the session scratch folder
(`rd1-home/`), never in the repository.
