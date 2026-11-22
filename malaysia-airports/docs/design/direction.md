# Direction v2: premium, clean, app-like

Date: 22 November 2026. Owner: design director and design-system lead (redesign round one).
Inputs: the client's verdict on the working prototype ("The UI/UX of this looks really bad. It's so
basic."), the reference captures in `docs/research/screenshots/` (Hamad, Dubai, Changi) and the
current screens in `docs/prototype/screenshots/`. The living specification is
`docs/design/design-system.md` and the style guide at `/en/design-system`.

## History

- **v1 (17 November 2026)** was a synthesis of three concepts (A Tenun, B Rimba, C Laluan; panel
  record in `docs/design/concepts/evaluation.md`): warm paper neutrals, songket indigo, a single
  gold hairline, Fraunces headings, small radii, outline cards and line-drawn vignettes. It earned
  its keep on structure, honesty and accessibility, and all of that stays.
- **What went wrong** is visual: beige everywhere, outline-only cards, icon tiles in place of
  pictures, small type and many small labels made a product that reads like a government form. No
  photography, no depth, no hierarchy of drama. The client is right.
- **v2 (this document)** keeps every structural, data and accessibility rule of v1 and replaces the
  visual language.

## The idea in one line

The calm luxury of a great Gulf hub (deep colour, gold, cinematic photography) with the clarity of
Apple and Airbnb (big confident type, white space, smooth motion) and the immediacy of a travel app
(live flight status first, cards, glass, a phone UI that feels native).

## What we saw in the references

- **Hamad**: one full-bleed photograph does the emotional work; a white search bar and a row of
  white tiles sit straight on it. Deep navy, a single brand accent. Lesson: let the picture lead,
  keep the tools solid and legible on top of it.
- **Dubai**: "Find your flight status" in very large type on a soft panel, departures and arrivals
  one tap away, rounded tiles for the next intents. Lesson: flight status is the product; big type
  and pill controls make it feel effortless.
- **Changi**: a cinematic photograph, a frosted search field over it, cards with photographs
  instead of icons. Lesson: images on cards turn a directory into a place you want to visit.
- **Our current screens**: correct, dense and pale. Lesson: keep the content and the truthfulness,
  change almost everything about how it looks.

## Mood

Arriving at night into a great terminal: midnight sky, warm light, polished floors, gold detail,
nothing shouting. Confident, unhurried, precise. Premium is expressed through restraint, scale and
finish, never through ornament.

## Colour

- **Midnight navy is the brand base** (`midnight` #070c22, `primary` #0b1640). Hero bands, the
  footer, primary buttons, the board. In the dark theme the page itself becomes midnight and the
  primary action turns near-white.
- **Gold is the accent, used sparingly** (`gold` #c49a50, `gold-bright` on midnight). One gold
  action or one gold rule per view: a hero call to action, a kicker line, a hairline under a
  number. Gold is never a status colour.
- **Surfaces are white and cool grey** (`page` #f6f7f9, `surface` #ffffff, `page-subtle`
  #eceef3). Warm ivory (`ivory` #faf7f0) survives as one editorial band per page at most. Beige is
  retired.
- **Ink is navy-black**, never pure black (`ink` #0b1230, `ink-2`, `ink-3`).
- **Status colours are tuned for flights**: scheduled (slate), on time (green), boarding (blue),
  delayed (amber), cancelled (red), landed (teal), departed (muted). Each has a soft pill (tinted
  fill, coloured words) and a solid pill (strong fill) and passes AA on white, on the page, on the
  dark theme and on the board.
- **Focus stays orchid**, its own colour, light orchid over media.

## Type

- **Hanken Grotesk (licensed, already self-hosted) for headings and the interface.** Display sizes
  are big and tight: 44 to 88 px for a hero (`type-display-2xl`), 38 to 72 px for a page title,
  weight 650, tracking -0.03 to -0.04 em. Reading text stays at 16 to 18 px with generous leading.
- **Fraunces becomes the accent, not the voice**: the wordmark, an occasional serif phrase or pull
  quote (`type-serif-*`). Never a whole page of headings.
- **Geist Mono** keeps times, gates, codes and figures tabular.
- No new font files: the payload is unchanged (Hanken 35 KB and Fraunces 67 KB preloaded, mono on
  demand). Hanken now carries the `h1`, so it takes Fraunces's old rule: preloaded and
  `display: optional`, so a large heading never rewraps after first paint.

## Imagery

- **Real, licensed photography** of our airports and of Malaysia (library in
  `src/content/images.ts`, credits on the credits page). Architecture, light, people in motion,
  local texture. No stock clichés, no AI imagery presented as real places.
- **Full-bleed heroes** with the photograph doing the emotional work, the words on a **gradient
  scrim** behind them. Text over a photograph always sits on a scrim zone or on a glass panel, and
  meets 4.5:1 even if the photograph behind it is pure white (measured; see the design system).
- **Glass panels over photos** for the tools that live on a hero: flight search, the next
  departure, quick actions. The blur is decoration; the fill alone carries the contrast, and it
  turns solid for "reduce transparency", without `backdrop-filter`, and in high contrast.
- **Rounded media**: cards 20 px, media cards 24 px, hero insets and sheets 28 px. Images reserve
  their space (aspect ratios or minimum heights), so nothing shifts while they load.
- Line drawings and woven motifs from v1 remain for empty states, maps and quiet decoration, not as
  substitutes for pictures.

## Elevation and surfaces

- Cards lift off the page by a soft, layered shadow plus a hairline, not by an outline alone.
- Three planes: the page (cool grey), cards (white, `shadow-sm`), floating things (popovers,
  dialogs, glass: `shadow-lg` to `shadow-xl`).
- Bands separate by colour and space (white, cool grey, midnight, one ivory), not by rules.
- The board stays a neutral midnight data surface in both themes.

## Controls

- **Pills** for actions, chips, tabs, segmented controls and the search field. Buttons: solid
  midnight (primary), solid gold (the one premium accent), frosted surface glass (secondary),
  smoky midnight glass (over photographs), quiet text buttons.
- **Large, soft inputs**: 48 px fields, 56 to 64 px hero search with an inset icon.
- Selected states are strong (ink fill), never a faint tint, so they meet 3:1 without colour alone.

## Motion

- Smooth and short: 140 ms for controls, 240 ms for lifts and popovers, 420 ms for sheets, 700 ms
  for an image easing in on hover. One easing family (`cubic-bezier(0.22, 1, 0.36, 1)`).
- Movement only where it explains: a card lifts 2 px on hover, a photograph eases in 4 %, a sheet
  slides from its edge, a live boarding dot breathes.
- Under `prefers-reduced-motion` **and** the site's own reduced-motion setting, every duration
  token drops to zero and nothing moves (`motion-ok:` variant). No scroll-triggered reveals, ever:
  the `h1` and the first content are in the static HTML and never animate in.

## Stop doing

- Beige everywhere. One ivory band per page at most.
- Outline-only cards and icon tiles where a photograph or a real preview belongs.
- Too many labels: eyebrows on every block, numbered section prefixes, three tags on one card.
  One eyebrow per section, one provenance tag per item, words before chips.
- Small headings. If it is the most important thing on the screen, it is big.
- Hairlines as the main way to separate content.
- Hazard stripes that shout. Demonstration data stays labelled on every view that shows it (the
  words never go), but the label is quiet and elegant.

## Keep (non-negotiable)

- Every feature, route, piece of content and data source.
- Truthful demonstration labels and provenance tags; the "Concept prototype, not official" notice.
- WCAG 2.2 AA: 4.5:1 text (including over photographs), 3:1 boundaries and focus, visible focus,
  44 px targets on phones, reduced motion, high contrast, forced colours, keyboard use.
- English and Malay; the dark theme; no layout shift; the static-shell rules
  (`docs/engineering/next16-notes.md`, `docs/qa/fixes/round3-performance.md`).
- v1's binding requirements 1, 4, 6, 7, 9 and 10 (brand never a status, solid unset airport state,
  no clipping from 360 px, stylesheet-only theme fallback, dense data tokens, 44 px targets and 3:1
  boundaries on form fields). Requirement 8 (opaque header, no blur) is now the shell team's call:
  a glass header is allowed over a hero only if it keeps the 4.5:1 rule above.
