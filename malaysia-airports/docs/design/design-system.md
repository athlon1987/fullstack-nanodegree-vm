# Malaysia Airports design system

Version 2.0 ("Direction v2: premium, clean, app-like"), 22 November 2026. Concept prototype; not an
official Malaysia Airports Holdings Berhad (MAHB) property. The living version of this document is
the style guide at `/en/design-system` (and `/ms/design-system`), which renders every token and
component below in the light, dark and high-contrast themes. The direction and its reasons are in
`docs/design/direction.md`.

**History.** Version 1.0 (17 November 2026) synthesised three concepts (A Tenun, B Rimba, C
Laluan): warm paper, songket indigo, Fraunces headings, small radii and outline cards. The client
found it basic. Version 2.0 keeps every structural, data, honesty and accessibility rule of 1.0 and
replaces the visual language: midnight navy and gold, white and cool-grey surfaces, real
photography behind scrims, glass panels, big Hanken Grotesk headings, generous radii, soft layered
shadows and app-like pill controls. Component props and accessible behaviour did not change; new
variants and primitives were added (section 11).

## 1. Principles

1. **Calm before clever.** Show the next step first. One primary action per view; everything else
   waits its turn. Drama comes from one photograph and one big heading, never from decoration
   competing with a time, a gate or a status.
2. **Honest by design.** Simulated data is always labelled (the demonstration banner or tag), every
   published fact shows its source, every piece of guidance carries a provenance tag. In v2 these
   labels are quieter and more elegant; they are never removed.
3. **Made for every traveller.** Keyboard, screen reader, large text, high contrast, reduced motion
   and forced colours are designed in the first draft. WCAG 2.2 AA is the floor, including text over
   photographs.
4. **Quietly Malaysian.** Identity comes from real photographs of our airports and places, warm
   gold detail and the woven motifs of v1 used sparingly. Never flags, emblems or clip art.

Colour rules that are not negotiable:

- **Brand colour is never a status colour.** Midnight navy means "Malaysia Airports" and "the main
  action". It never means on time, delayed or cancelled.
- **Gold is an accent, not a signal.** One gold action, kicker or rule per view. Gold never marks a
  status. (The amber of delayed flights and demonstration data is a different, more saturated
  colour, always paired with an icon and words.)
- **Focus has its own colour.** Orchid, neither brand nor status; light orchid over media.

## 2. Colour

All colours are semantic tokens in `src/app/globals.css` (Tailwind 4 `@theme`), exposed as
utilities (`bg-page`, `text-ink-2`, `border-line-control`, `bg-flight-boarding-bg`, ...).
Components never use raw hex values. `node scripts/design-tokens.mjs` reads the file, measures every
pair in every theme, regenerates `src/components/design-system/token-data.ts` and fails on any pair
below AA.

### 2.1 Themes and scopes

| Theme or scope | How it is selected |
|---|---|
| Light | Default; `html[data-theme="light"]` |
| Dark | `html[data-theme="dark"]`, set before first paint; without JavaScript the stylesheet follows `prefers-color-scheme` on its own (a mirrored block the audit script keeps in sync). The page becomes midnight; the primary action turns near-white. |
| High contrast (light and dark) | `html[data-contrast="more"]`. Lines become ink-strength, status and provenance borders take the text colour, glass turns solid, focus rings grow to 3 px. |
| Forced colours | `@media (forced-colors: active)`: system colours; glass loses its blur and gains a boundary, scrims step aside (the system draws its own backplate), selected states use Highlight. |
| `.surface-board` | The flight board: a neutral midnight data surface, the same in both themes. Components inside take board colours. |
| `.on-media` | Anything over a photograph, a scrim, a dark glass panel or a midnight band (`Section tone="midnight"`, `HeroMedia`, `MediaCard`, `GlassPanel tone="dark"`, `Button variant="glass"`). Components inside take white and light ink and the light focus ring. |

### 2.2 The palette

| Role | Light | Dark | Notes |
|---|---|---|---|
| `midnight`, `midnight-2` | #070c22, #0f1a3d | same | The brand base: hero bands, scrims, footers, the board. |
| `primary` / `on-primary` | #0b1640 / #ffffff | #eef1fa / #0b1230 | The one main action. |
| `primary-ink`, `primary-soft` | #1f3080, #e7eaf5 | #b4c2ff, #1a2550 | Brand text and tints. |
| `gold`, `gold-hover` / `on-gold` | #c49a50, #d2ab64 / #0b1230 | #d6b46e, #e3c382 / #0b1230 | The gold button and rules. |
| `gold-ink`, `gold-soft`, `gold-bright` | #7f5b16, #f6eddb, #e8cb8c | #e5c88a, #2a2416, #e8cb8c | Gold text, gold tint, gold on midnight. |
| `page`, `page-subtle` | #f6f7f9, #eceef3 | #060a18, #0b1124 | Cool, airy page and bands. |
| `surface`, `surface-raised`, `surface-sunken` | #ffffff, #ffffff, #eef0f4 | #10172e, #172040, #04060f | Cards lift by shadow. |
| `ivory` | #faf7f0 | #0f1426 | One editorial band per page at most. |
| `fill`, `fill-hover` | #e9ecf2, #dfe3eb | #1c2547, #263058 | Tracks, chips, secondary fills. |
| `ink`, `ink-2`, `ink-3` | #0b1230, #3d4560, #5a6178 | #f4f6fb, #c2c8db, #9aa2ba | Navy-black text, never pure black. |
| `line`, `line-strong`, `line-control` | #e2e5ec, #cdd2dc, #80879c | #1e2640, #2f3858, #7a84a6 | Hairlines; `line-control` bounds form fields at 3:1. |
| `focus` | #a6157f | #ff9fdc | Light orchid #ffb8e8 over media. |
| `leaf`, `leaf-soft` | #1a6a48, #e1f1e8 | #8fd3ae, #12382b | Illustration and positive accents. |

**Flight status tones** (`StatusPill`): each tone has `-fg` on `-bg` (soft pill) and `-on` on
`-solid` (strong pill). All pass 4.5:1 in light, dark, both high-contrast themes and on the board.

| Tone | Used for | Light fg / bg / solid | Dark fg / bg / solid |
|---|---|---|---|
| `scheduled` | Scheduled, check-in closed, en route | #3d4560 / #eceef3 / #3d4560 | #c9cfe0 / #1b2340 / #c9cfe0 |
| `ontime` | Check-in open (moving as planned) | #0b6b3f / #e3f5eb / #0e7a47 | #6ee0a2 / #0e3324 / #3ccf82 |
| `boarding` | Boarding; final call (solid) | #0a4fc2 / #e6eeff / #1557d4 | #a3c2ff / #13285c / #5b95ff |
| `delayed` | Delayed | #8c4500 / #fff0d9 / #f0a032 (ink text) | #ffc66e / #3d2a08 / #f6b24c |
| `cancelled` | Cancelled | #b0121e / #fde8e9 / #c41e2a | #ffa0a5 / #4a161c / #ff737a |
| `landed` | Landed, at gate, bags on belt | #09636d / #dff3f4 / #0c707c | #72d7de / #0b3439 / #3cc5cf |
| `departed` | Gate closed, departed, completed | #585f75 / #eceef3 / #5f667c | #a3aac0 / #171e38 / #a3aac0 |

The general status tones (`positive`, `warning`, `critical`, `info`, `neutral`) use the same hues
(green, amber, red, blue, slate) for callouts, chips and errors. Provenance tones stay four forms
(official solid, estimated outlined, suggestion tinted, demonstration amber), now softer:
demonstration is a pale amber (#fbecc4, dark #33270a) with fine diagonal threads instead of loud
hazard stripes, and keeps its words in every view.

### 2.3 Glass and scrims

| Token | Value | Use |
|---|---|---|
| `glass` utility | `surface` at 84 % + 20 px blur + saturate, hairline, `shadow-lg` | Frosted panel that follows the theme. `ink-3` is raised to `ink-2` inside. |
| `glass-dark` utility | `glass-dark` #0a1130 at 72 % + blur, white hairline, `shadow-glass` | Smoky midnight glass over photographs, both themes; pair with `on-media`. |
| `scrim-behind` / `scrim-behind-left` | `scrim` #050918 at 78 % under the words, fading out 6 rem above (or 8 rem beside) them | Content-relative scrim: put it on the block holding the words, however tall it grows. |
| `scrim-bottom`, `scrim-left`, `scrim-top` | 78 % in the first 40 % from the edge, 35 % at 70 %, then clear | Image-relative scrims for fixed layouts; words stay inside the first 40 %. |
| `scrim-full` | 35 % veil | Mood only: words over it go on a `GlassPanel`. |
| `surface-midnight` | midnight with two soft navy glows | Midnight bands and cards (`Section tone="midnight"`, `Card variant="midnight"`). |

**The 4.5:1 rule over photographs.** The audit composites each glass and scrim over a pure white
and a pure black picture and measures the text on the result (the worst cases). White text on
`glass-dark` over white: 7.47:1; `on-midnight-dim` on it: 5.40:1; white in the scrim text zone
over white: 10.47:1 (dim 7.56:1); theme glass with `ink-2`: 6.51:1 over black (light) and 6.56:1
over white (dark). `gold-bright` measures 4.75:1 on glass and 6.66:1 on the scrim, but over media it is reserved for
large text, kickers and icons. Glass turns solid without
`backdrop-filter`, with `prefers-reduced-transparency: reduce`, and in high contrast.

### 2.4 Measured contrast

147 pairs measured in eight themes and scopes (light, dark, board, media, and the high-contrast
version of each). Lowest text ratio **4.84:1**, lowest boundary ratio **3.08:1**. Text needs 4.5,
boundaries and focus 3.0; decorative hairlines are reported only. Generated by
`node scripts/design-tokens.mjs` (the tables below are its output).

**Ink**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `ink` | `page` | 4.5 | #0b1230 on #f6f7f9 **17.13** | #f4f6fb on #060a18 **18.24** | #000824 on #ffffff **19.80** | #ffffff on #000000 **21.00** |
| `ink-2` | `page` | 4.5 | #3d4560 on #f6f7f9 **8.83** | #c2c8db on #060a18 **11.81** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #000000 **17.49** |
| `ink-3` | `page` | 4.5 | #5a6178 on #f6f7f9 **5.73** | #9aa2ba on #060a18 **7.75** | #262d4d on #ffffff **13.41** | #d3d7e6 on #000000 **14.63** |
| `ink` | `page-subtle` | 4.5 | #0b1230 on #eceef3 **15.82** | #f4f6fb on #0b1124 **17.34** | #000824 on #f1f2f6 **17.70** | #ffffff on #05081a **19.88** |
| `ink-2` | `page-subtle` | 4.5 | #3d4560 on #eceef3 **8.15** | #c2c8db on #0b1124 **11.23** | #1b2140 on #f1f2f6 **14.02** | #e8eaf3 on #05081a **16.56** |
| `ink-3` | `page-subtle` | 4.5 | #5a6178 on #eceef3 **5.29** | #9aa2ba on #0b1124 **7.36** | #262d4d on #f1f2f6 **11.99** | #d3d7e6 on #05081a **13.85** |
| `ink` | `surface` | 4.5 | #0b1230 on #ffffff **18.36** | #f4f6fb on #10172e **16.40** | #000824 on #ffffff **19.80** | #ffffff on #070b20 **19.48** |
| `ink-2` | `surface` | 4.5 | #3d4560 on #ffffff **9.46** | #c2c8db on #10172e **10.62** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #070b20 **16.23** |
| `ink-3` | `surface` | 4.5 | #5a6178 on #ffffff **6.14** | #9aa2ba on #10172e **6.96** | #262d4d on #ffffff **13.41** | #d3d7e6 on #070b20 **13.57** |
| `ink` | `surface-raised` | 4.5 | #0b1230 on #ffffff **18.36** | #f4f6fb on #172040 **14.74** | #000824 on #ffffff **19.80** | #ffffff on #0e1430 **18.08** |
| `ink-2` | `surface-raised` | 4.5 | #3d4560 on #ffffff **9.46** | #c2c8db on #172040 **9.55** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #0e1430 **15.06** |
| `ink-3` | `surface-raised` | 4.5 | #5a6178 on #ffffff **6.14** | #9aa2ba on #172040 **6.26** | #262d4d on #ffffff **13.41** | #d3d7e6 on #0e1430 **12.59** |
| `ink` | `surface-sunken` | 4.5 | #0b1230 on #eef0f4 **16.09** | #f4f6fb on #04060f **18.70** | #000824 on #f1f2f6 **17.70** | #ffffff on #000000 **21.00** |
| `ink-2` | `surface-sunken` | 4.5 | #3d4560 on #eef0f4 **8.29** | #c2c8db on #04060f **12.11** | #1b2140 on #f1f2f6 **14.02** | #e8eaf3 on #000000 **17.49** |
| `ink-3` | `surface-sunken` | 4.5 | #5a6178 on #eef0f4 **5.38** | #9aa2ba on #04060f **7.94** | #262d4d on #f1f2f6 **11.99** | #d3d7e6 on #000000 **14.63** |

**Brand**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `primary-ink` | `page` | 4.5 | #1f3080 on #f6f7f9 **10.92** | #b4c2ff on #060a18 **11.36** | #0b1a5c on #ffffff **15.95** | #dde4ff on #000000 **16.61** |
| `primary-ink` | `page-subtle` | 4.5 | #1f3080 on #eceef3 **10.09** | #b4c2ff on #0b1124 **10.80** | #0b1a5c on #f1f2f6 **14.25** | #dde4ff on #05081a **15.73** |
| `primary-ink` | `surface` | 4.5 | #1f3080 on #ffffff **11.71** | #b4c2ff on #10172e **10.22** | #0b1a5c on #ffffff **15.95** | #dde4ff on #070b20 **15.41** |
| `primary-ink` | `surface-raised` | 4.5 | #1f3080 on #ffffff **11.71** | #b4c2ff on #172040 **9.18** | #0b1a5c on #ffffff **15.95** | #dde4ff on #0e1430 **14.30** |
| `primary-ink` | `primary-soft` | 4.5 | #1f3080 on #e7eaf5 **9.75** | #b4c2ff on #1a2550 **8.49** | #0b1a5c on #e7eaf5 **13.28** | #dde4ff on #1a2550 **11.66** |
| `on-primary` | `primary` | 4.5 | #ffffff on #0b1640 **17.45** | #0b1230 on #eef1fa **16.26** | #ffffff on #050b2a **19.30** | #0b1230 on #ffffff **18.36** |
| `on-primary` | `primary-hover` | 4.5 | #ffffff on #1b2a63 **13.47** | #0b1230 on #ffffff **18.36** | #ffffff on #000000 **21.00** | #0b1230 on #e8eaf3 **15.29** |
| `primary` | `page` | 3.0 | #0b1640 on #f6f7f9 **16.28** | #eef1fa on #060a18 **17.47** | #050b2a on #ffffff **19.30** | #ffffff on #000000 **21.00** |
| `primary` | `surface` | 3.0 | #0b1640 on #ffffff **17.45** | #eef1fa on #10172e **15.70** | #050b2a on #ffffff **19.30** | #ffffff on #070b20 **19.48** |
| `on-gold` | `gold` | 4.5 | #0b1230 on #c49a50 **7.07** | #0b1230 on #d6b46e **9.28** | #0b1230 on #a67c2e **4.84** | #0b1230 on #e8cb8c **11.67** |
| `on-gold` | `gold-hover` | 4.5 | #0b1230 on #d2ab64 **8.52** | #0b1230 on #e3c382 **10.83** | #0b1230 on #d2ab64 **8.52** | #0b1230 on #e3c382 **10.83** |

**Surfaces**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `ink` | `fill` | 4.5 | #0b1230 on #e9ecf2 **15.51** | #f4f6fb on #1c2547 **13.82** | #000824 on #e3e6ee **15.86** | #ffffff on #1a2244 **15.48** |
| `ink-2` | `fill` | 4.5 | #3d4560 on #e9ecf2 **7.99** | #c2c8db on #1c2547 **8.95** | #1b2140 on #e3e6ee **12.56** | #e8eaf3 on #1a2244 **12.89** |
| `ink` | `fill-hover` | 4.5 | #0b1230 on #dfe3eb **14.27** | #f4f6fb on #263058 **11.79** | #000824 on #d4d8e3 **13.89** | #ffffff on #242e58 **13.07** |
| `ink-2` | `fill-hover` | 4.5 | #3d4560 on #dfe3eb **7.35** | #c2c8db on #263058 **7.64** | #1b2140 on #d4d8e3 **11.00** | #e8eaf3 on #242e58 **10.88** |
| `ink` | `ivory` | 4.5 | #0b1230 on #faf7f0 **17.16** | #f4f6fb on #0f1426 **16.91** | #000824 on #ffffff **19.80** | #ffffff on #070b20 **19.48** |
| `ink-2` | `ivory` | 4.5 | #3d4560 on #faf7f0 **8.84** | #c2c8db on #0f1426 **10.95** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #070b20 **16.23** |
| `on-midnight` | `midnight` | 4.5 | #ffffff on #070c22 **19.35** | #ffffff on #070c22 **19.35** | #ffffff on #070c22 **19.35** | #ffffff on #070c22 **19.35** |
| `on-midnight-dim` | `midnight` | 4.5 | #d6dbe9 on #070c22 **13.98** | #d6dbe9 on #070c22 **13.98** | #d6dbe9 on #070c22 **13.98** | #d6dbe9 on #070c22 **13.98** |
| `gold-bright` | `midnight` | 4.5 | #e8cb8c on #070c22 **12.30** | #e8cb8c on #070c22 **12.30** | #e8cb8c on #070c22 **12.30** | #e8cb8c on #070c22 **12.30** |
| `on-midnight` | `midnight-2` | 4.5 | #ffffff on #0f1a3d **16.99** | #ffffff on #0f1a3d **16.99** | #ffffff on #0f1a3d **16.99** | #ffffff on #0f1a3d **16.99** |
| `on-midnight-dim` | `midnight-2` | 4.5 | #d6dbe9 on #0f1a3d **12.27** | #d6dbe9 on #0f1a3d **12.27** | #d6dbe9 on #0f1a3d **12.27** | #d6dbe9 on #0f1a3d **12.27** |
| `gold-bright` | `midnight-2` | 4.5 | #e8cb8c on #0f1a3d **10.80** | #e8cb8c on #0f1a3d **10.80** | #e8cb8c on #0f1a3d **10.80** | #e8cb8c on #0f1a3d **10.80** |
| `on-inverse` | `inverse` | 4.5 | #ffffff on #0b1230 **18.36** | #f4f6fb on #121a38 **15.78** | #ffffff on #0b1230 **18.36** | #f4f6fb on #121a38 **15.78** |
| `on-inverse-dim` | `inverse` | 4.5 | #c3c9dc on #0b1230 **11.11** | #c2c8db on #121a38 **10.22** | #c3c9dc on #0b1230 **11.11** | #c2c8db on #121a38 **10.22** |

**Accents**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `gold-ink` | `page` | 4.5 | #7f5b16 on #f6f7f9 **5.74** | #e5c88a on #060a18 **12.17** | #5a3f07 on #ffffff **9.77** | #f2dcaa on #000000 **15.59** |
| `gold-ink` | `page-subtle` | 4.5 | #7f5b16 on #eceef3 **5.30** | #e5c88a on #0b1124 **11.57** | #5a3f07 on #f1f2f6 **8.73** | #f2dcaa on #05081a **14.76** |
| `gold-ink` | `surface` | 4.5 | #7f5b16 on #ffffff **6.15** | #e5c88a on #10172e **10.94** | #5a3f07 on #ffffff **9.77** | #f2dcaa on #070b20 **14.46** |
| `gold-ink` | `gold-soft` | 4.5 | #7f5b16 on #f6eddb **5.29** | #e5c88a on #2a2416 **9.51** | #5a3f07 on #f6eddb **8.40** | #f2dcaa on #2a2416 **11.44** |
| `gold` | `page` | n/a | #c49a50 on #f6f7f9 **2.42** | #d6b46e on #060a18 **9.97** | #a67c2e on #ffffff **3.78** | #e8cb8c on #000000 **13.35** |
| `gold` | `surface` | n/a | #c49a50 on #ffffff **2.59** | #d6b46e on #10172e **8.96** | #a67c2e on #ffffff **3.78** | #e8cb8c on #070b20 **12.38** |
| `leaf` | `page` | 4.5 | #1a6a48 on #f6f7f9 **6.12** | #8fd3ae on #060a18 **11.36** | #0f4a31 on #ffffff **10.27** | #b6f2d2 on #000000 **16.62** |
| `leaf` | `surface` | 4.5 | #1a6a48 on #ffffff **6.56** | #8fd3ae on #10172e **10.21** | #0f4a31 on #ffffff **10.27** | #b6f2d2 on #070b20 **15.42** |
| `leaf` | `leaf-soft` | 4.5 | #1a6a48 on #e1f1e8 **5.61** | #8fd3ae on #12382b **7.43** | #0f4a31 on #e1f1e8 **8.78** | #b6f2d2 on #12382b **10.21** |
| `focus` | `page` | 3.0 | #a6157f on #f6f7f9 **6.45** | #ff9fdc on #060a18 **10.56** | #86095f on #ffffff **9.46** | #ffc2e9 on #000000 **14.14** |
| `focus` | `page-subtle` | 3.0 | #a6157f on #eceef3 **5.96** | #ff9fdc on #0b1124 **10.04** | #86095f on #f1f2f6 **8.46** | #ffc2e9 on #05081a **13.39** |
| `focus` | `surface` | 3.0 | #a6157f on #ffffff **6.91** | #ff9fdc on #10172e **9.49** | #86095f on #ffffff **9.46** | #ffc2e9 on #070b20 **13.12** |
| `focus` | `surface-raised` | 3.0 | #a6157f on #ffffff **6.91** | #ff9fdc on #172040 **8.53** | #86095f on #ffffff **9.46** | #ffc2e9 on #0e1430 **12.17** |
| `focus` | `surface-sunken` | 3.0 | #a6157f on #eef0f4 **6.06** | #ff9fdc on #04060f **10.83** | #86095f on #f1f2f6 **8.46** | #ffc2e9 on #000000 **14.14** |
| `focus` | `primary-soft` | 3.0 | #a6157f on #e7eaf5 **5.76** | #ff9fdc on #1a2550 **7.89** | #86095f on #e7eaf5 **7.88** | #ffc2e9 on #1a2550 **9.93** |

**Lines**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `line-control` | `page` | 3.0 | #80879c on #f6f7f9 **3.34** | #7a84a6 on #060a18 **5.33** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #000000 **17.49** |
| `line-control` | `page-subtle` | 3.0 | #80879c on #eceef3 **3.08** | #7a84a6 on #0b1124 **5.07** | #1b2140 on #f1f2f6 **14.02** | #e8eaf3 on #05081a **16.56** |
| `line-control` | `surface` | 3.0 | #80879c on #ffffff **3.58** | #7a84a6 on #10172e **4.79** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #070b20 **16.23** |
| `line-control` | `surface-raised` | 3.0 | #80879c on #ffffff **3.58** | #7a84a6 on #172040 **4.31** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #0e1430 **15.06** |
| `line-control` | `surface-sunken` | 3.0 | #80879c on #eef0f4 **3.13** | #7a84a6 on #04060f **5.47** | #1b2140 on #f1f2f6 **14.02** | #e8eaf3 on #000000 **17.49** |
| `line` | `page` | n/a | #e2e5ec on #f6f7f9 **1.17** | #1e2640 on #060a18 **1.32** | #7d8399 on #ffffff **3.76** | #6e7598 on #000000 **4.66** |
| `line-strong` | `page` | n/a | #cdd2dc on #f6f7f9 **1.41** | #2f3858 on #060a18 **1.71** | #4b5168 on #ffffff **7.84** | #a2a8c4 on #000000 **8.93** |
| `line` | `surface` | n/a | #e2e5ec on #ffffff **1.26** | #1e2640 on #10172e **1.18** | #7d8399 on #ffffff **3.76** | #6e7598 on #070b20 **4.32** |
| `line-strong` | `surface` | n/a | #cdd2dc on #ffffff **1.51** | #2f3858 on #10172e **1.54** | #4b5168 on #ffffff **7.84** | #a2a8c4 on #070b20 **8.28** |

**Status**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `positive-fg` | `positive-bg` | 4.5 | #0b6b3f on #e3f5eb **5.80** | #6ee0a2 on #0e3324 **8.46** | #064d2c on #e3f5eb **8.79** | #b6f2d2 on #0e3324 **10.95** |
| `positive-fg` | `page` | 4.5 | #0b6b3f on #f6f7f9 **6.14** | #6ee0a2 on #060a18 **12.07** | #064d2c on #ffffff **9.97** | #b6f2d2 on #000000 **16.62** |
| `positive-fg` | `surface` | 4.5 | #0b6b3f on #ffffff **6.58** | #6ee0a2 on #10172e **10.85** | #064d2c on #ffffff **9.97** | #b6f2d2 on #070b20 **15.42** |
| `positive-border` | `page` | 3.0 | #3d9a6c on #f6f7f9 **3.24** | #3c9f6e on #060a18 **5.99** | #064d2c on #ffffff **9.97** | #b6f2d2 on #000000 **16.62** |
| `positive-border` | `surface` | 3.0 | #3d9a6c on #ffffff **3.47** | #3c9f6e on #10172e **5.38** | #064d2c on #ffffff **9.97** | #b6f2d2 on #070b20 **15.42** |
| `warning-fg` | `warning-bg` | 4.5 | #8c4500 on #fff0d9 **6.31** | #ffc66e on #3d2a08 **8.84** | #613000 on #fff0d9 **9.69** | #ffd88f on #3d2a08 **10.09** |
| `warning-fg` | `page` | 4.5 | #8c4500 on #f6f7f9 **6.60** | #ffc66e on #060a18 **12.73** | #613000 on #ffffff **10.87** | #ffd88f on #000000 **15.47** |
| `warning-fg` | `surface` | 4.5 | #8c4500 on #ffffff **7.07** | #ffc66e on #10172e **11.44** | #613000 on #ffffff **10.87** | #ffd88f on #070b20 **14.35** |
| `warning-border` | `page` | 3.0 | #ad7412 on #f6f7f9 **3.70** | #b8862e on #060a18 **6.09** | #613000 on #ffffff **10.87** | #ffd88f on #000000 **15.47** |
| `warning-border` | `surface` | 3.0 | #ad7412 on #ffffff **3.97** | #b8862e on #10172e **5.47** | #613000 on #ffffff **10.87** | #ffd88f on #070b20 **14.35** |
| `critical-fg` | `critical-bg` | 4.5 | #b0121e on #fde8e9 **6.06** | #ffa0a5 on #4a161c **7.60** | #7c0b14 on #fde8e9 **9.34** | #ffc7ca on #4a161c **10.03** |
| `critical-fg` | `page` | 4.5 | #b0121e on #f6f7f9 **6.63** | #ffa0a5 on #060a18 **10.16** | #7c0b14 on #ffffff **10.96** | #ffc7ca on #000000 **14.27** |
| `critical-fg` | `surface` | 4.5 | #b0121e on #ffffff **7.11** | #ffa0a5 on #10172e **9.14** | #7c0b14 on #ffffff **10.96** | #ffc7ca on #070b20 **13.24** |
| `critical-border` | `page` | 3.0 | #d9605f on #f6f7f9 **3.38** | #c9606a on #060a18 **5.04** | #7c0b14 on #ffffff **10.96** | #ffc7ca on #000000 **14.27** |
| `critical-border` | `surface` | 3.0 | #d9605f on #ffffff **3.62** | #c9606a on #10172e **4.53** | #7c0b14 on #ffffff **10.96** | #ffc7ca on #070b20 **13.24** |
| `info-fg` | `info-bg` | 4.5 | #0a4fc2 on #e6eeff **6.19** | #a3c2ff on #13285c **7.88** | #06358a on #e6eeff **9.57** | #c8daff on #13285c **10.04** |
| `info-fg` | `page` | 4.5 | #0a4fc2 on #f6f7f9 **6.73** | #a3c2ff on #060a18 **11.00** | #06358a on #ffffff **11.14** | #c8daff on #000000 **14.92** |
| `info-fg` | `surface` | 4.5 | #0a4fc2 on #ffffff **7.21** | #a3c2ff on #10172e **9.89** | #06358a on #ffffff **11.14** | #c8daff on #070b20 **13.85** |
| `info-border` | `page` | 3.0 | #4c7fd9 on #f6f7f9 **3.66** | #5b86d6 on #060a18 **5.47** | #06358a on #ffffff **11.14** | #c8daff on #000000 **14.92** |
| `info-border` | `surface` | 3.0 | #4c7fd9 on #ffffff **3.92** | #5b86d6 on #10172e **4.92** | #06358a on #ffffff **11.14** | #c8daff on #070b20 **13.85** |
| `neutral-fg` | `neutral-bg` | 4.5 | #3d4560 on #eceef3 **8.15** | #c9cfe0 on #1b2340 **9.90** | #1b2140 on #eceef3 **13.51** | #e8e9f3 on #1b2340 **12.77** |
| `neutral-fg` | `page` | 4.5 | #3d4560 on #f6f7f9 **8.83** | #c9cfe0 on #060a18 **12.66** | #1b2140 on #ffffff **15.69** | #e8e9f3 on #000000 **17.38** |
| `neutral-fg` | `surface` | 4.5 | #3d4560 on #ffffff **9.46** | #c9cfe0 on #10172e **11.38** | #1b2140 on #ffffff **15.69** | #e8e9f3 on #070b20 **16.12** |
| `neutral-border` | `page` | 3.0 | #80879c on #f6f7f9 **3.34** | #7a84a6 on #060a18 **5.33** | #1b2140 on #ffffff **15.69** | #e8e9f3 on #000000 **17.38** |
| `neutral-border` | `surface` | 3.0 | #80879c on #ffffff **3.58** | #7a84a6 on #10172e **4.79** | #1b2140 on #ffffff **15.69** | #e8e9f3 on #070b20 **16.12** |
| `page` | `critical-fg` | 4.5 | #f6f7f9 on #b0121e **6.63** | #060a18 on #ffa0a5 **10.16** | #ffffff on #7c0b14 **10.96** | #000000 on #ffc7ca **14.27** |

**Provenance**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `official-fg` | `official-bg` | 4.5 | #ffffff on #0b1230 **18.36** | #0b1230 on #f4f6fb **16.98** | #ffffff on #000824 **19.80** | #000000 on #ffffff **21.00** |
| `estimated-fg` | `estimated-bg` | 4.5 | #0b1230 on #ffffff **18.36** | #f4f6fb on #10172e **16.40** | #000824 on #ffffff **19.80** | #ffffff on #10172e **17.73** |
| `estimated-border` | `page` | 3.0 | #5a6178 on #f6f7f9 **5.73** | #c2c8db on #060a18 **11.81** | #000824 on #ffffff **19.80** | #ffffff on #000000 **21.00** |
| `estimated-border` | `surface` | 3.0 | #5a6178 on #ffffff **6.14** | #c2c8db on #10172e **10.62** | #000824 on #ffffff **19.80** | #ffffff on #070b20 **19.48** |
| `suggestion-fg` | `suggestion-bg` | 4.5 | #1f3080 on #e7eaf5 **9.75** | #b4c2ff on #1a2550 **8.49** | #0b1a5c on #e7eaf5 **13.28** | #dde4ff on #1a2550 **11.66** |
| `suggestion-border` | `page` | 3.0 | #1f3080 on #f6f7f9 **10.92** | #b4c2ff on #060a18 **11.36** | #0b1a5c on #ffffff **15.95** | #dde4ff on #000000 **16.61** |
| `suggestion-border` | `surface` | 3.0 | #1f3080 on #ffffff **11.71** | #b4c2ff on #10172e **10.22** | #0b1a5c on #ffffff **15.95** | #dde4ff on #070b20 **15.41** |
| `demo-fg` | `demo-bg` | 4.5 | #4a3200 on #fbecc4 **10.24** | #ffdc8f on #33270a **11.06** | #2e1f00 on #fbecc4 **13.63** | #ffe4a8 on #33270a **11.78** |
| `demo-border` | `page` | 3.0 | #a87a12 on #f6f7f9 **3.58** | #c99a2e on #060a18 **7.65** | #2e1f00 on #ffffff **16.00** | #ffd88f on #000000 **15.47** |
| `demo-border` | `surface` | 3.0 | #a87a12 on #ffffff **3.84** | #c99a2e on #10172e **6.87** | #2e1f00 on #ffffff **16.00** | #ffd88f on #070b20 **14.35** |
| `official-bg` | `page` | 3.0 | #0b1230 on #f6f7f9 **17.13** | #f4f6fb on #060a18 **18.24** | #000824 on #ffffff **19.80** | #ffffff on #000000 **21.00** |

**Flight**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `flight-scheduled-fg` | `flight-scheduled-bg` | 4.5 | #3d4560 on #eceef3 **8.15** | #c9cfe0 on #1b2340 **9.90** | #1b2140 on #eceef3 **13.51** | #e8e9f3 on #1b2340 **12.77** |
| `flight-scheduled-fg` | `page` | 4.5 | #3d4560 on #f6f7f9 **8.83** | #c9cfe0 on #060a18 **12.66** | #1b2140 on #ffffff **15.69** | #e8e9f3 on #000000 **17.38** |
| `flight-scheduled-fg` | `surface` | 4.5 | #3d4560 on #ffffff **9.46** | #c9cfe0 on #10172e **11.38** | #1b2140 on #ffffff **15.69** | #e8e9f3 on #070b20 **16.12** |
| `flight-scheduled-on` | `flight-scheduled-solid` | 4.5 | #ffffff on #3d4560 **9.46** | #0b1230 on #c9cfe0 **11.79** | #ffffff on #3d4560 **9.46** | #0b1230 on #c9cfe0 **11.79** |
| `flight-ontime-fg` | `flight-ontime-bg` | 4.5 | #0b6b3f on #e3f5eb **5.80** | #6ee0a2 on #0e3324 **8.46** | #064d2c on #e3f5eb **8.79** | #b6f2d2 on #0e3324 **10.95** |
| `flight-ontime-fg` | `page` | 4.5 | #0b6b3f on #f6f7f9 **6.14** | #6ee0a2 on #060a18 **12.07** | #064d2c on #ffffff **9.97** | #b6f2d2 on #000000 **16.62** |
| `flight-ontime-fg` | `surface` | 4.5 | #0b6b3f on #ffffff **6.58** | #6ee0a2 on #10172e **10.85** | #064d2c on #ffffff **9.97** | #b6f2d2 on #070b20 **15.42** |
| `flight-ontime-on` | `flight-ontime-solid` | 4.5 | #ffffff on #0e7a47 **5.39** | #06101f on #3ccf82 **9.47** | #ffffff on #075a34 **8.32** | #06101f on #3ccf82 **9.47** |
| `flight-boarding-fg` | `flight-boarding-bg` | 4.5 | #0a4fc2 on #e6eeff **6.19** | #a3c2ff on #13285c **7.88** | #06358a on #e6eeff **9.57** | #c8daff on #13285c **10.04** |
| `flight-boarding-fg` | `page` | 4.5 | #0a4fc2 on #f6f7f9 **6.73** | #a3c2ff on #060a18 **11.00** | #06358a on #ffffff **11.14** | #c8daff on #000000 **14.92** |
| `flight-boarding-fg` | `surface` | 4.5 | #0a4fc2 on #ffffff **7.21** | #a3c2ff on #10172e **9.89** | #06358a on #ffffff **11.14** | #c8daff on #070b20 **13.85** |
| `flight-boarding-on` | `flight-boarding-solid` | 4.5 | #ffffff on #1557d4 **6.27** | #06101f on #5b95ff **6.52** | #ffffff on #0b3fa6 **9.22** | #06101f on #5b95ff **6.52** |
| `flight-delayed-fg` | `flight-delayed-bg` | 4.5 | #8c4500 on #fff0d9 **6.31** | #ffc66e on #3d2a08 **8.84** | #613000 on #fff0d9 **9.69** | #ffd88f on #3d2a08 **10.09** |
| `flight-delayed-fg` | `page` | 4.5 | #8c4500 on #f6f7f9 **6.60** | #ffc66e on #060a18 **12.73** | #613000 on #ffffff **10.87** | #ffd88f on #000000 **15.47** |
| `flight-delayed-fg` | `surface` | 4.5 | #8c4500 on #ffffff **7.07** | #ffc66e on #10172e **11.44** | #613000 on #ffffff **10.87** | #ffd88f on #070b20 **14.35** |
| `flight-delayed-on` | `flight-delayed-solid` | 4.5 | #0b1230 on #f0a032 **8.55** | #06101f on #f6b24c **10.34** | #0b1230 on #f0a032 **8.55** | #06101f on #f6b24c **10.34** |
| `flight-cancelled-fg` | `flight-cancelled-bg` | 4.5 | #b0121e on #fde8e9 **6.06** | #ffa0a5 on #4a161c **7.60** | #7c0b14 on #fde8e9 **9.34** | #ffc7ca on #4a161c **10.03** |
| `flight-cancelled-fg` | `page` | 4.5 | #b0121e on #f6f7f9 **6.63** | #ffa0a5 on #060a18 **10.16** | #7c0b14 on #ffffff **10.96** | #ffc7ca on #000000 **14.27** |
| `flight-cancelled-fg` | `surface` | 4.5 | #b0121e on #ffffff **7.11** | #ffa0a5 on #10172e **9.14** | #7c0b14 on #ffffff **10.96** | #ffc7ca on #070b20 **13.24** |
| `flight-cancelled-on` | `flight-cancelled-solid` | 4.5 | #ffffff on #c41e2a **5.88** | #06101f on #ff737a **7.24** | #ffffff on #8e101b **9.37** | #06101f on #ff737a **7.24** |
| `flight-landed-fg` | `flight-landed-bg` | 4.5 | #09636d on #dff3f4 **6.05** | #72d7de on #0b3439 **7.98** | #04464d on #dff3f4 **9.18** | #b2eef2 on #0b3439 **10.48** |
| `flight-landed-fg` | `page` | 4.5 | #09636d on #f6f7f9 **6.49** | #72d7de on #060a18 **11.73** | #04464d on #ffffff **10.56** | #b2eef2 on #000000 **16.40** |
| `flight-landed-fg` | `surface` | 4.5 | #09636d on #ffffff **6.96** | #72d7de on #10172e **10.54** | #04464d on #ffffff **10.56** | #b2eef2 on #070b20 **15.22** |
| `flight-landed-on` | `flight-landed-solid` | 4.5 | #ffffff on #0c707c **5.79** | #06101f on #3cc5cf **9.14** | #ffffff on #06525b **8.87** | #06101f on #3cc5cf **9.14** |
| `flight-departed-fg` | `flight-departed-bg` | 4.5 | #585f75 on #eceef3 **5.46** | #a3aac0 on #171e38 **7.08** | #262d4d on #eceef3 **11.55** | #d3d7e6 on #171e38 **11.43** |
| `flight-departed-fg` | `page` | 4.5 | #585f75 on #f6f7f9 **5.92** | #a3aac0 on #060a18 **8.52** | #262d4d on #ffffff **13.41** | #d3d7e6 on #000000 **14.63** |
| `flight-departed-fg` | `surface` | 4.5 | #585f75 on #ffffff **6.34** | #a3aac0 on #10172e **7.65** | #262d4d on #ffffff **13.41** | #d3d7e6 on #070b20 **13.57** |
| `flight-departed-on` | `flight-departed-solid` | 4.5 | #ffffff on #5f667c **5.70** | #06101f on #a3aac0 **8.23** | #ffffff on #262d4d **13.41** | #06101f on #a3aac0 **8.23** |

**Glass**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `ink` | `glass@white` | 4.5 | #0b1230 on #ffffff **18.36** | #f4f6fb on #363c4f **10.13** | #000824 on #ffffff **19.80** | #ffffff on #2f3244 **12.64** |
| `ink-2` | `glass@white` | 4.5 | #3d4560 on #ffffff **9.46** | #c2c8db on #363c4f **6.56** | #1b2140 on #ffffff **15.69** | #e8eaf3 on #2f3244 **10.53** |
| `ink` | `glass@black` | 4.5 | #0b1230 on #d6d6d6 **12.63** | #f4f6fb on #0d1327 **17.04** | #000824 on #d6d6d6 **13.62** | #ffffff on #06091b **19.76** |
| `ink-2` | `glass@black` | 4.5 | #3d4560 on #d6d6d6 **6.51** | #c2c8db on #0d1327 **11.03** | #1b2140 on #d6d6d6 **10.79** | #e8eaf3 on #06091b **16.46** |

**Media**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `on-midnight` | `glass-dark@white` | 4.5 | #ffffff on #4f546a **7.47** | #ffffff on #4f546a **7.47** | #ffffff on #4f546a **7.47** | #ffffff on #4f546a **7.47** |
| `on-midnight-dim` | `glass-dark@white` | 4.5 | #d6dbe9 on #4f546a **5.40** | #d6dbe9 on #4f546a **5.40** | #d6dbe9 on #4f546a **5.40** | #d6dbe9 on #4f546a **5.40** |
| `gold-bright` | `glass-dark@white` | 3.0 | #e8cb8c on #4f546a **4.75** | #e8cb8c on #4f546a **4.75** | #e8cb8c on #4f546a **4.75** | #e8cb8c on #4f546a **4.75** |
| `on-midnight` | `scrim@white` | 4.5 | #ffffff on #3c3f4b **10.47** | #ffffff on #3c3f4b **10.47** | #ffffff on #3c3f4b **10.47** | #ffffff on #3c3f4b **10.47** |
| `on-midnight-dim` | `scrim@white` | 4.5 | #d6dbe9 on #3c3f4b **7.56** | #d6dbe9 on #3c3f4b **7.56** | #d6dbe9 on #3c3f4b **7.56** | #d6dbe9 on #3c3f4b **7.56** |
| `gold-bright` | `scrim@white` | 3.0 | #e8cb8c on #3c3f4b **6.66** | #e8cb8c on #3c3f4b **6.66** | #e8cb8c on #3c3f4b **6.66** | #e8cb8c on #3c3f4b **6.66** |

**Board** (the same in both themes)

| Foreground | Background | Needs | Board | HC board |
|---|---|---|---|---|
| `board-ink` | `board` | 4.5 | #f4f6fb on #070b1c **18.08** | #f4f6fb on #070b1c **18.08** |
| `board-dim` | `board` | 4.5 | #aab1c8 on #070b1c **9.15** | #d5d9e8 on #070b1c **13.89** |
| `board-accent` | `board` | 4.5 | #f3c96e on #070b1c **12.47** | #f3c96e on #070b1c **12.47** |
| `board-line` | `board` | n/a | #232a48 on #070b1c **1.39** | #636b8c on #070b1c **3.73** |
| `board-ink` | `board-raised` | 4.5 | #f4f6fb on #0f1530 **16.59** | #f4f6fb on #0f1530 **16.59** |
| `board-dim` | `board-raised` | 4.5 | #aab1c8 on #0f1530 **8.40** | #d5d9e8 on #0f1530 **12.74** |
| `board-accent` | `board-raised` | 4.5 | #f3c96e on #0f1530 **11.44** | #f3c96e on #0f1530 **11.44** |
| `board-line` | `board-raised` | n/a | #232a48 on #0f1530 **1.27** | #636b8c on #0f1530 **3.42** |

## 3. Typography

| Utility | Size (phone to desktop) / leading / tracking / weight | Use |
|---|---|---|
| `type-display-2xl` | 44–88 / 0.98 / −0.042em / Hanken 650 | The home or airport hero heading |
| `type-display-xl` | 38–72 / 1.0 / −0.038em / Hanken 650 | Landing page titles |
| `type-display-lg` | 32–56 / 1.04 / −0.032em / Hanken 650 | Page titles, section titles of landing pages |
| `type-display-md` | 26–40 / 1.08 / −0.026em / Hanken 650 | Section titles |
| `type-display-sm` | 22–28 / 1.15 / −0.02em / Hanken 650 | Card and panel titles, big numbers |
| `type-serif-xl/lg/md` | 36–68, 28–44, 22–30 / Fraunces 360–400 | An editorial phrase or pull quote, rarely |
| `type-title-lg/md/sm` | 22 / 18 / 16, Hanken 650 | Component titles |
| `type-lead` | 18–21 / 1.5 | One or two sentences under a hero or page title |
| `type-body-lg`, `type-body`, `type-body-sm` | 18, 16, 14 | Reading text (16 px minimum on phones) |
| `type-caption`, `type-eyebrow` | 13 | Meta lines; sentence-case eyebrows |
| `type-overline` | 12 / +0.16em / 650 capitals | One premium kicker per view (hero, feature band) |
| `type-data-xl … xs` | 24 … 11, Geist Mono | Times, gates, codes, amounts, board headers |

- **Hanken Grotesk** (licensed, self-hosted, 35 KB variable) sets every heading and all interface
  text. It is preloaded with `display: optional`, the rule Fraunces had while it set the `h1`: a
  late face never rewraps a big heading after first paint (it is used from the next view).
- **Fraunces** (67 KB, preloaded for the header wordmark) is the editorial accent: the wordmark,
  `type-serif-*`, `font-serif` (alias `font-display`). Never a whole page of headings.
- **Geist Mono** (23 KB, on demand) for tabular figures.
- No new font files: the payload is unchanged.
- Big type is confident, not loud: one display heading per view, a lead under it, then the work.
  Balanced wrapping on headings, pretty wrapping on paragraphs.

## 4. Space and layout

- 4 px base. Sections breathe: `py-section` is 56 to 112 px (`clamp(3.5rem, 2rem + 5vw, 7rem)`),
  `py-section-sm` 40 to 64 px. `Section spacing="md"` is 56 to 64 px.
- Containers: reading 42 rem, narrow 56 rem, page 77.5 rem, wide 90 rem; gutter 16 to 48 px.
- Bands separate by colour and space (page, subtle, surface, ivory, midnight, board), not by rules.
- Breakpoints: `xs` 400, `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536 px.

## 5. Radii

| Token | px | Use |
|---|---|---|
| `rounded-xs` | 6 | Badge, Kbd |
| `rounded-sm` | 10 | Small tiles |
| `rounded-md` | 12 | Input, select, tooltip |
| `rounded-lg` | 16 | Swatches, small panels |
| `rounded-xl` | 20 | Card, Callout, Demo frames |
| `rounded-2xl` | 24 | MediaCard, Popover, GlassPanel |
| `rounded-3xl` | 28 | HeroMedia inset, Dialog, Sheet |
| `rounded-pill` | 999 | Button, IconButton (round), Chip, FilterChip, Tabs, SegmentedControl, SearchField, StatusPill |

## 6. Elevation

Soft and layered: a contact shadow plus one or two ambient layers in midnight (black, stronger, in
the dark theme).

| Token | Use |
|---|---|
| `shadow-xs` | Inputs, Kbd, secondary buttons |
| `shadow-sm` | Cards, primary buttons |
| `shadow-md` | Raised cards, MediaCard, hero search |
| `shadow-lg` | Hover lift, theme glass |
| `shadow-xl` | Dialogs, popovers, MediaCard hover |
| `shadow-glass` | Midnight glass: a top highlight and a deep drop |

Three planes: the page; cards (`shadow-sm` and a hairline); floating things (`shadow-lg` to `xl`).

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 80 ms | Micro feedback |
| `duration-fast` | 140 ms | Buttons, chips, tabs, inputs |
| `duration-base` | 240 ms | Card lift, popovers, accordion, switch |
| `duration-slow` | 420 ms | Sheets |
| `duration-slower` | 700 ms | A photograph easing in on hover |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances and hover |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Exits |
| `animate-scale-in`, `animate-rise-in`, `animate-sheet-*`, `animate-pulse-ring` | | Dialog and popover entrances, sheets, the live boarding dot |

- **Movement only where it explains**: a card lifts 2 px, a photograph eases in 4 to 5 %, a button
  presses to 97 %, a sheet slides from its edge, a live dot breathes.
- Every transform that moves something uses the **`motion-ok:`** variant, which applies only when
  both `prefers-reduced-motion` and the site's own setting allow motion. Under either, every
  duration token is 0 ms, animations and transitions finish at once, and nothing moves.
- No scroll-triggered reveals. The `h1` and first content are static HTML and never animate in
  (static-shell rules: no clock or random values in render, no page-level Suspense, the `h1` never
  revealed by `$RC`).

## 8. Imagery

- Real, licensed photographs from the library in `src/content/images.ts` (Wikimedia Commons, free
  licences, credited on the credits page). Convert an entry with `toMediaImage(entry, lang)`
  (`src/components/ui/media.ts`): it picks the alt text for the language, the focal point, the blur
  placeholder and, for a hero, a short credit line.
- Always `next/image` with `fill` inside a box whose size is reserved (aspect ratio or minimum
  height), so nothing shifts while a picture loads. Only the one hero per page is preloaded.
- Words over a photograph sit on a scrim (`scrim-behind`) or a glass panel. Never rely on the
  picture being dark.
- Decorative when the words beside it say it all (`toMediaImage(entry, lang, { decorative: true })`),
  otherwise the library's alt text in the page language.
- The style guide shows synthetic sample images until the library has photographs, plus a white
  high-key test image as the worst case for the scrims.
- Line vignettes and woven motifs (section 10) stay for empty states, maps and quiet edges, never
  as substitutes for photographs.

## 9. Status, provenance and demonstration data

### 9.1 Flight status

`StatusPill` is the v2 status: words, an icon (or a dot) and a colour tuned for the status, as a
soft pill for lists and boards or a solid pill for the one status that matters most on a view.
`flightStatusPill(status)` maps the flight model to a tone and variant (final call is solid
boarding blue). `live` adds a breathing ring to the dot for a time-critical state (off with reduced
motion). In high contrast and forced colours the pill gains a border. `FlightStatusChip`
(`src/components/common`, shape-coded v1 chip) remains on the live board until the page designers
move it to `StatusPill`; the style guide shows both side by side for every status.

A delayed time shows the old time struck through beside the new one; a cancelled row is dimmed but
keeps its status.

### 9.2 Provenance tags

| Kind | Form | Icon | Meaning |
|---|---|---|---|
| Official | Solid ink | Badge with check | From the airport, an airline or a government body |
| Estimated | Outlined | Calculator | Our calculation or a typical value |
| Suggestion | Tinted | Light bulb | An optional idea |
| Demonstration | Pale amber with fine threads | Flask | Simulated for this prototype |

One provenance tag per item; the legend appears where tags are first introduced.

### 9.3 Demonstration data

Anything from the demo providers sits under the `DemoDataBanner` with the sentence "Do not use this
data to plan travel". In v2 it is quieter (pale amber, fine threads, the same words); it is never
hidden or removed, and the "Concept prototype, not official" notice stays in the header.

### 9.4 Facts, sources and gaps

A published value appears as a `KeyFact` with its provenance tag and a `SourceNote`. A missing fact
says so with `NotPublished` and points to the official channel. Never a guess.

## 10. Illustration and pattern

### 10.1 The vignette family

One family of line drawings, 320 by 180, drawn with a 1 px stroke in the current text colour, a
fainter second weight for texture and a single gold detail per drawing. Because they use
`currentColor` and fill overlaps with the ground token, the same drawing is correct in the light
theme, the dark theme and high contrast.

| Key | Subject |
|---|---|
| KLIA Terminal 1 | The canopy columns of the main terminal, like trees holding up the roof |
| KLIA Terminal 2 | The long folded roof, the control tower and an aircraft on stand |
| Penang | The cable stays of the bridge across the strait, hills behind |
| Kota Kinabalu | The ridgeline of Mount Kinabalu with the sun beside it |
| Kuching | Rainforest canopy along the Sarawak River |
| Langkawi | The islands of the archipelago and the sun on the water |
| Subang | A turboprop seen head-on, for the city airport's regional flights |
| Generic | A control tower, a low terminal under one arched roof, hills and the runway |

Rules: one vignette per card or header; never behind text; never recoloured per airport; new
airports get a drawing in the same grammar (one subject, horizon line, one gold detail) or the
generic one. Vignettes are decorative: the airport's name is always in text beside them.

### 10.2 Patterns

| Pattern | What it is | How it is used |
|---|---|---|
| Pucuk rebung rule | "Bamboo shoot": the row of triangles found on the borders and head panel of songket and batik cloth | A 6 px gold hairline under a hero or card (`Separator variant="rebung"`, `RebungRule`); a 20 px version for the edge of a band. As in cloth, it belongs at an edge. |
| Bunga tabur field | "Scattered flowers": small isolated motifs strewn across the field of a songket | A faded field of four-point stars in one corner of a hero (`TaburField fade`). Low opacity, never behind text. |
| Mengkuang weave | The over-and-under plait of pandanus-leaf mats and baskets | A fine texture in the corner of the board or an ink band (`WeaveTexture`). |

### 10.3 Cultural respect

Songket is a living craft; it was inscribed on UNESCO's Representative List of the Intangible
Cultural Heritage of Humanity for Malaysia in 2021. These motifs are borrowed with care.

Do:

- Use the motifs as fine, single-colour structure (a border, a field, a texture), the way they
  work in the cloth itself.
- Keep them small, quiet and at the edges. One motif per view is usually enough.
- Name them correctly (pucuk rebung, bunga tabur, anyaman mengkuang) in documentation and credits.
- Draw identity from place: the architecture of each terminal and the landscape around it.

Avoid:

- The Jalur Gemilang, the national coat of arms, state flags or crests, and royal insignia.
- Solid royal yellow fields. Yellow carries courtly associations in Malay tradition; our gold is a
  metallic thread used as a hairline only.
- Religious calligraphy, mosque or temple silhouettes, or sacred symbols as decoration.
- Ceremonial designs that carry ritual meaning or belong to a specific community, such as pua
  kumbu and other Bornean ritual textiles or tattoo motifs, used as generic ornament.
- Clip-art shorthand: hibiscus stickers, wau kites, tropical fruit, costume figures.
- Enlarging, recolouring in several colours, animating or tiling the motifs across a whole page.
- Implying that one community's craft stands for the whole country. Malaysia is plural; where a
  page is about a specific place, draw from that place.

Before production use the motif drawings should be reviewed by a Malaysian textile or cultural
adviser, and the mark and wordmark replaced by MAHB's own identity under its brand guidelines.

### 10.4 Brand mark

The prototype's mark is original: two nested pucuk rebung chevrons (a roof, a runway in
perspective) under a single gold lozenge, with "Malaysia Airports" set in the display face. It is
**not** the official Malaysia Airports logo and is not to be presented as one.

## 11. Component inventory

States shown on the style guide page: default, hover, focus (static example), disabled, loading,
selected, error. Props did not change in v2 except where a new variant or primitive is listed.

### 11.1 Primitives (`src/components/ui`)

| Component | v2 look | Usage rules |
|---|---|---|
| Button | Pill. `primary` solid midnight; **`gold`** (new) solid gold; `secondary` frosted surface glass with a hairline; **`glass`** (new) smoky midnight glass over photographs; `ghost` brand text; `quiet` text; `danger`. Presses to 97 % (`motion-ok`). | One `primary` or one `gold` per view, never both side by side. sm 36 (44 on touch), md 44, lg 52. |
| IconButton | Round. Variants ghost, secondary, primary, quiet, **glass** (new). | A text label is required; `pressed` for toggles. |
| Card | 20 px corners, hairline and soft shadow; `outline` (default), `raised`, `sunken`, **`glass`**, **`midnight`** (new). Interactive cards lift 2 px. **`CardMedia`** (new): the image slot, full bleed at the top, reserved aspect, eases in on hover. | An interactive card is one link (the title) stretched over the card. |
| **MediaCard** (new) | A photograph (4:5 by default) with its title, eyebrow, description and footer over it on a content-relative scrim; lifts and eases in on hover. | `href` makes the whole card one link named by the title. `meta` for one provenance tag or chip. Grows instead of clipping when words need room. |
| **HeroMedia** (new) | Full-bleed `next/image` with `preload`, focal point, scrim (`bottom`, `left`, `full`, `none`), reserved height (`tall`, `medium`, `short`), optional inset with 28 px corners, quiet credit. | One per page, the only preloaded image. The content is an `on-media` scope. The heading stays in the static HTML. |
| **GlassPanel** (new) | `tone="auto"` theme glass or `tone="dark"` midnight glass, 24 px corners by default. | For tools over photographs (flight search, next departure, quick actions). Solid in high contrast and with reduced transparency. |
| **StatusPill** (new) | Soft or solid pill in seven flight tones, icon or dot, optional `live` ring and `detail`. | Use `flightStatusPill(status)`. Words always present. |
| Chip / FilterChip | Soft pills; status chips keep a faint tinted edge (full border in high contrast). FilterChip: white pill, ink pill when pressed, with a tick. | `Chip` is a static tag; `FilterChip` a toggle with `aria-pressed`. |
| Badge | 6 px corners, mono. | Counts, codes, levels. |
| Tabs | App-like pills on a soft track; the active tab is an ink pill. Scrolls sideways with an edge fade. | Views of the same subject. |
| SegmentedControl | Pills on a soft track; the chosen option is an ink pill; wraps to rows when words do not fit. | 2 to 4 exclusive choices (native radios). |
| Input, NativeSelect | 48 px, 12 px corners, inset icon, 3:1 boundary, soft shadow. | Visible label unless the context labels it; hints and errors under the field. |
| SearchField | A pill with an inset icon: `md` 44 px (dense screens), `lg` 56 px (64 px from `sm`) with a deeper shadow for heroes; a trailing pill button fits inside. | Clear button once there is text; a short placeholder for narrow fields. |
| Switch | Pill track, shadowed thumb, tick when on. | Immediate settings only. |
| Callout | 20 px corners, soft tinted fill, the tone's icon in a round badge. | In-page messages; tone by icon and words too. |
| Accordion | Larger titles (18 px), 64 px rows, a round chevron button that turns. | Secondary detail only. |
| Dialog / Sheet | 28 px corners; modal scales in; the sheet is a bottom sheet with a grabber on phones and a floating side panel inset 12 px on wider screens. | Focus trapped and returned; Escape closes. |
| Popover, Tooltip | Popover 24 px corners, `shadow-xl`, scales in; tooltip 12 px corners on inverse. | Tooltips are hints, never required reading. |
| Table, DataList | Hairlines, a soft fill on row hover. | Section 12. |
| Timeline | The current step has an ink ring with a soft halo; upcoming threads are dotted. | Journey steps. |
| Stat, Skeleton, Separator, Kbd, Section, Container | Stat labels in caption weight; skeletons on `fill`; Separator **`gold`** (new) fading gold rule; Section tones **`ivory`** and **`midnight`** (new), bands without rules. | Skeletons are hidden from assistive technology; one status message per loading region. |

### 11.2 Domain components (`src/components/common`)

Owned by the page and shell teams; they inherit the v2 tokens automatically. PageHeader,
Breadcrumbs, SectionHeading, QuickAction, NoticeCard, ProvenanceTag, ProvenanceLegend, SourceNote,
KeyFact, NotPublished, DemoDataBanner, Freshness, FlightStatusChip, TerminalBadge, AirportCode,
LocalTime, EmptyState, LocaleLink, ExternalLink and TranslationNotice keep their behaviour. Next
steps for those teams: QuickAction tiles with photographs (`CardMedia` or `MediaCard`), the board
on `StatusPill`, `PageHeader` over `HeroMedia` on landing pages.

## 12. Data density

Operational data follows the board language everywhere, not only on the board.

| Token | Height | Use |
|---|---|---|
| `h-row` | 52 px | Default rows: boards and anything tapped on a phone |
| `h-row-dense` | 40 px | Desktop reference tables (fares, rates, directories) |
| `h-row-compact` | 32 px | Read-only reference tables |
| `h-chip` | 28 px | Chips, status chips (StatusPill sm 24, md 32, lg 40) |
| `h-badge` / `h-badge-sm` | 24 / 20 px | Terminal badges, counts |
| `h-touch` | 44 px | Minimum primary touch target |

- Times, gates, flight numbers, codes and amounts are mono with tabular figures; amounts and
  durations are right-aligned; text is left-aligned.
- Table headers are 11 px mono capitals in `ink-3`; rows are separated by hairlines, not zebra
  stripes; the hovered row tints.
- Real table markup with a caption and scoped headers. A table that cannot fit sits in a labelled,
  keyboard-focusable scroll region; the page itself never scrolls sideways.
- **Boards reflow instead of scrolling.** Below about 56rem of available width a board row becomes
  a stacked row: time on the left; destination and flight on the right; terminal, gate and status
  beneath. The switch is a container query, so it also responds to the text-size setting.
- Every data view has one `Freshness` row (airport, day, "Updated 09:30", refresh interval) and,
  for demo data, the banner directly above it.
- A missing value is an en dash with a spoken explanation ("Gate not assigned yet"), never blank.

## 13. Responsive rules

Mobile first. Breakpoints: `xs` 400 px, `sm` 640 px, `md` 768 px, `lg` 1024 px, `xl` 1280 px,
`2xl` 1536 px. Designs are checked at 360, 390, 768, 1024, 1280, 1440 and 1600 px.

- No horizontal page scroll at 360 px. Nothing is truncated between 360 and 1600 px: labels wrap,
  placeholders have a short form, chips grow to two lines before they clip.
- Touch targets are at least 44 by 44 px on phones and on any coarse pointer (the `touch:` variant
  grows compact desktop controls); 24 by 24 px is the absolute floor.
- Body text is never below 16 px on phones.
- Grids step 1, 2, 3 or 4 columns; cards keep a minimum comfortable measure rather than shrinking.
- Phone patterns: sheets rise from the bottom; breadcrumbs become a single back link; four-way
  mode selectors become a 2 by 2 grid; tables of flights become stacked rows.
- Dense components should respond to their container, not the viewport (`@container`), so they
  work in a sidebar, a sheet and at 125% text size alike.

## 14. Interaction states

| State | Treatment |
|---|---|
| Hover | A fill tint, a firmer hairline or a 2 px lift with a deeper shadow (lifts only with `motion-ok:`); underlines thicken. Never the only way to discover an action. |
| Focus | 2 px orchid outline with 2 px offset (3 px in high contrast and forced colours) on every interactive element, via `:focus-visible`. Never removed. Composite controls ring the visible part (`focus-ring`). |
| Pressed / selected | Ink pill with page-coloured text (tabs, segments, filter chips) plus a tick or `aria-pressed`, `aria-checked` or `aria-current`. Never tint alone. |
| Disabled | Neutral fill, tertiary ink, `not-allowed` cursor. Prefer explaining why over disabling. |
| Loading | Spinner inside the control, `aria-busy`, the control stays focusable; skeletons for regions. |
| Error | Critical border, an icon and a sentence saying what to do, linked to the field. |
| Empty | `EmptyState`: what happened, a way forward, and the official pointer. |

## 15. Accessibility standard

WCAG 2.2 level AA is the floor. How the system meets it:

| Criterion | How |
|---|---|
| 1.3.1 Info and relationships | Semantic landmarks, one `h1`, ordered headings, real tables with captions, `dl` for label and value rows, `ol` for timelines |
| 1.4.1 Use of colour | Status, provenance, severity, selection and errors all carry an icon, a shape and words |
| 1.4.3 Contrast (minimum) | All text pairs at least 4.84:1 in every theme and scope, including text over glass and scrims composited on white and black photographs (section 2.4) |
| 1.4.4 Resize text | Text-size setting (100, 112.5, 125%) and browser zoom to 200% without loss; sizes in `rem` |
| 1.4.10 Reflow | No horizontal page scroll at 320 CSS px; boards reflow to stacked rows |
| 1.4.11 Non-text contrast | Form-field boundaries, focus rings and status borders at least 3.08:1. Buttons are identified by their label and fill, not a boundary. |
| 1.4.12 Text spacing | No fixed heights on text containers; chips and buttons grow |
| 1.4.13 Content on hover or focus | Tooltips are dismissible, hoverable and persistent (Radix) |
| 2.1.1 Keyboard, 2.1.2 No trap | Native controls first; Radix primitives for dialogs, popovers, tabs and accordions; scroll regions are focusable |
| 2.3.3, 2.2.2 Motion | System and in-app reduced motion zero every duration token; `motion-ok:` guards every transform; nothing moves on its own except the opt-in live dot, which stops with reduced motion |
| 2.4.1 Bypass blocks | Skip link as the first focusable element |
| 2.4.7 Focus visible, 2.4.11 Focus not obscured, 2.4.13 Focus appearance | Dedicated focus colour (light orchid over media), 2 to 3 px ring, scroll padding under the sticky header |
| 2.5.8 Target size | 44 px primary targets on touch; 24 px floor |
| 3.1.1, 3.1.2 Language | `<html lang>` from the route; Malay phrases inside English pages are marked `lang="ms"` |
| 3.3.1, 3.3.2 Errors and labels | Every input labelled; errors in text, linked to the field |
| 4.1.2 Name, role, value | Icon buttons require a label; toggles expose pressed and checked state |
| 4.1.3 Status messages | Polite live regions for freshness, result counts and loading; never more than one announcement per update |

Also supported: Windows forced-colours mode, `prefers-reduced-transparency`, a stylesheet-only
dark theme for visitors without JavaScript, and print styles for guidance pages.
