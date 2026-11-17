# Malaysia Airports design system

Version 1.0, 17 November 2026. Concept prototype; not an official Malaysia Airports Holdings Berhad
(MAHB) property. The living version of this document is the style guide page at
`/en/design-system` (and `/ms/design-system`), which renders every token and component described
here in the light, dark and high-contrast themes.

The system is a synthesis of three working concepts (decision record: `docs/design/direction.md`).
Structure, responsive behaviour and the accessibility build come from B Rimba; the visual identity
from A Tenun; the data language from C Laluan. The aim is one refined system, not a collage: every
rule below exists so the three layers read as a single hand.

## 1. Principles

1. **Calm before clever.** Show the next step first. One primary action per view; everything else
   waits its turn. Decoration never competes with a time, a gate or a status.
2. **Honest by design.** Simulated data is always labelled with the hazard-striped demonstration
   banner or tag. Every published fact shows its source and retrieval date. Every piece of guidance
   carries a provenance tag: official, estimated, suggestion or demonstration.
3. **Made for every traveller.** Keyboard, screen reader, large text, high contrast, reduced motion
   and forced colours are designed in the first draft, not retrofitted. WCAG 2.2 AA is the floor.
4. **Quietly Malaysian.** Identity comes from woven hairlines, a scattered songket field, line
   drawings of our own terminals and landscapes, and warm paper and indigo. Never flags, emblems
   or clip art.

Three colour rules follow from these and are not negotiable:

- **Brand colour is never a status colour.** Songket indigo means "Malaysia Airports" and "the main
  action". It never means on time, delayed or cancelled.
- **Gold is a thread, not a signal.** Gold appears only as hairlines, ornaments, eyebrow text and
  the link underline. It never fills a button and never marks a status. (The amber used for
  demonstration data and warnings is a different, more saturated colour, always paired with hazard
  stripes or an icon and words.)
- **Focus has its own colour.** The focus ring is orchid, which is neither a brand colour nor a
  status colour, so it can never be mistaken for a state.

## 2. Colour

All colours are semantic tokens declared in `src/app/globals.css` and exposed as Tailwind utilities
(`bg-page`, `text-ink-2`, `border-line-control`, and so on). Components never use raw hex values.

### 2.1 Themes

| Theme | How it is selected |
|---|---|
| Light | Default; `html[data-theme="light"]` |
| Dark | `html[data-theme="dark"]`, set before first paint from the visitor's saved choice or the device setting. Without JavaScript the stylesheet follows `prefers-color-scheme` on its own. |
| High contrast (light and dark) | `html[data-contrast="more"]` (also accepts `"high"`). Lines become ink-strength, status borders take the text colour, focus rings grow to 3 px. |
| Forced colours | `@media (forced-colors: active)` (Windows contrast themes). System colours are used; patterns, hazard stripes, selected states and focus are remapped explicitly so nothing disappears. |
| Board | `.surface-board`: a neutral dark data surface that is the same in the light and dark themes. Any component placed inside it takes board colours automatically. |

In the dark theme the indigo lifts to a pale periwinkle for fills and links, so the brand stays
indigo in both themes and gold stays decoration. Selected segments invert to ink (navy in light,
ivory in dark).

### 2.2 Token values

**Surfaces**

| Token | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| `page` | #FAF5EA | #0C0E24 | #FFFCF4 | #05061A |
| `page-subtle` | #F3ECDC | #11142F | #F6F0E0 | #0A0C26 |
| `surface` | #FFFDF8 | #171A3D | #FFFFFF | #0F1233 |
| `surface-raised` | #FFFFFF | #1F2350 | #FFFFFF | #171B45 |
| `surface-sunken` | #F5EFE1 | #090B1D | #F6F0E0 | #020312 |
| `inverse` | #181B3A | #1D2152 | #181B3A | #1D2152 |
| `on-inverse` | #F6F0E2 | #F4EEDF | #F6F0E2 | #F4EEDF |
| `on-inverse-dim` | #C2C0D6 | #C2C0D6 | #C2C0D6 | #C2C0D6 |

**Ink**

| Token | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| `ink` | #181B3A | #F4EEDF | #0D0F26 | #FFFFFF |
| `ink-2` | #454867 | #C9C7DA | #25284A | #E6E4F2 |
| `ink-3` | #5C5F7B | #A2A1BD | #35385A | #CFCDE2 |

**Lines**

| Token | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| `line` | #E3DCCB | #2A2C48 | #8C899C | #6E7198 |
| `line-strong` | #CBC4B6 | #454866 | #5D5A73 | #A2A4C4 |
| `line-control` | #7F7C95 | #7D80A3 | #25284A | #E6E4F2 |

**Brand (songket indigo)**

| Token | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| `primary` | #252A6C | #C5C9FB | #171B52 | #DDE0FF |
| `primary-hover` | #181C4F | #DFE1FF | #0D0F33 | #F1F2FF |
| `on-primary` | #FBF6EA | #14163A | #FBF6EA | #14163A |
| `primary-soft` | #E7E8F4 | #20245A | #E7E8F4 | #20245A |
| `primary-ink` | #252A6C | #C7CCFF | #171B52 | #DDE0FF |

**Accents and focus**

| Token | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| `gold` | #A57B2B | #D2AC62 | #7A5814 | #E2C383 |
| `gold-ink` | #7A5814 | #E2C383 | #5A3F07 | #F0D9A4 |
| `gold-soft` | #F2E7CC | #2B2946 | #F2E7CC | #2B2946 |
| `leaf` | #1F6B4A | #8FD3AE | #124A32 | #B6F2D2 |
| `leaf-soft` | #E0EEE3 | #12382B | #E0EEE3 | #12382B |
| `focus` | #A6157F | #FF9FDC | #86095F | #FFC2E9 |

**Status tones**

| Token | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| `positive-fg` | #1A6245 | #8FDDB5 | #0D4A32 | #B6F2D2 |
| `positive-bg` | #E2F0E6 | #12382B | #E2F0E6 | #12382B |
| `positive-border` | #458A6A | #3E8F6B | #0D4A32 | #B6F2D2 |
| `warning-fg` | #874A00 | #F5C46E | #643600 | #FFD88F |
| `warning-bg` | #FAEACD | #47300A | #FAEACD | #47300A |
| `warning-border` | #AD7320 | #A87A2A | #643600 | #FFD88F |
| `critical-fg` | #A02925 | #FFA99E | #7C1814 | #FFC7BF |
| `critical-bg` | #FAE3DF | #4C1B1D | #FAE3DF | #4C1B1D |
| `critical-border` | #C55F57 | #C0625C | #7C1814 | #FFC7BF |
| `info-fg` | #0F5873 | #8CD3EC | #084256 | #B5E6F7 |
| `info-bg` | #DDEEF3 | #0E3646 | #DDEEF3 | #0E3646 |
| `info-border` | #41869F | #3F8CA8 | #084256 | #B5E6F7 |
| `neutral-fg` | #494C66 | #CDCEDD | #2C2F4E | #E8E9F3 |
| `neutral-bg` | #EAE5DA | #2B2E50 | #EAE5DA | #2B2E50 |
| `neutral-border` | #7F7C95 | #7D80A3 | #2C2F4E | #E8E9F3 |

**Provenance tones**

| Token | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| `official-fg` | #FBF6EA | #14163A | #FBF6EA | #05061A |
| `official-bg` | #181B3A | #F4EEDF | #0D0F26 | #FFFFFF |
| `official-border` | #181B3A | #F4EEDF | #0D0F26 | #FFFFFF |
| `estimated-fg` | #181B3A | #F4EEDF | #0D0F26 | #FFFFFF |
| `estimated-bg` | #FFFDF8 | #171A3D | #FFFDF8 | #171A3D |
| `estimated-border` | #454867 | #C9C7DA | #0D0F26 | #FFFFFF |
| `suggestion-fg` | #252A6C | #C7CCFF | #171B52 | #DDE0FF |
| `suggestion-bg` | #E7E8F4 | #20245A | #E7E8F4 | #20245A |
| `suggestion-border` | #252A6C | #C7CCFF | #171B52 | #DDE0FF |
| `demo-fg` | #1F1600 | #1F1600 | #1F1600 | #1F1600 |
| `demo-bg` | #FFC233 | #FFC233 | #FFC233 | #FFC233 |
| `demo-border` | #8A6400 | #FFC233 | #1F1600 | #FFC233 |

**Board** (the same in the light and dark themes; `.surface-board` also remaps the surface, ink and line tokens to these)

| Token | Value | Role |
|---|---|---|
| `board` | #080B16 | Board ground |
| `board-raised` | #121627 | Raised row or header |
| `board-ink` | #F3F1EA | Primary text |
| `board-dim` | #A9AEC2 | Secondary text |
| `board-line` | #2B3148 | Row rule |
| `board-accent` | #FFC24A | Times |

Roles:

- **Surfaces**: `page` (the paper), `page-subtle` (alternating bands), `surface` (cards, fields),
  `surface-raised` (dialogs, popovers), `surface-sunken` (wells, illustration grounds), `inverse`
  with `on-inverse` and `on-inverse-dim` (ink bands, footer, tooltips).
- **Ink**: `ink` (primary text), `ink-2` (secondary), `ink-3` (tertiary and placeholders). All
  three pass 4.5:1 on every surface.
- **Lines**: `line` (hairline dividers) and `line-strong` (card edges) are decorative; `line-control`
  bounds every form control and passes 3:1 on every surface.
- **Brand**: `primary` (fills), `primary-hover`, `on-primary` (text on fills), `primary-soft`
  (selected tint), `primary-ink` (brand-coloured text and links).
- **Accents**: `gold` (thread, decoration only), `gold-ink` (eyebrow text; passes 4.5:1),
  `gold-soft`; `leaf` and `leaf-soft` (the living secondary accent, for illustration and
  sustainability content); `focus`.
- **Board**: `board`, `board-raised`, `board-ink`, `board-dim`, `board-line`, `board-accent`
  (amber, for times on the board only).
- **Status tones** (`positive`, `warning`, `critical`, `info`, `neutral`): each has `-fg`, `-bg`
  and `-border`. Always used with an icon and words.
- **Provenance tones** (`official`, `estimated`, `suggestion`, `demo`): each has `-fg`, `-bg` and
  `-border`, and a fixed form (section 9.2).

### 2.3 Measured contrast

Measured with the WCAG 2.x relative-luminance formula by `scripts/design-tokens.mjs`, which reads
the stylesheet itself, fails if any pair drops below its threshold, and regenerates the data shown
on the style guide page. Text needs 4.5:1; UI boundaries, focus indicators and large text need
3:1; decorative pairs are reported but have no requirement.

Result for this version: **95 pairs measured in six themes. Lowest text ratio 5.28:1
(`ink-3` on `page-subtle`, light). Lowest boundary ratio 3.41:1 (`line-control` on
`page-subtle`, light). No failures.**

Each cell shows foreground on background and the measured ratio.

**Ink**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `ink` | `page` | 4.5 | #181b3a on #faf5ea **15.36** | #f4eedf on #0c0e24 **16.43** | #0d0f26 on #fffcf4 **18.39** | #ffffff on #05061a **20.04** |
| `ink-2` | `page` | 4.5 | #454867 on #faf5ea **8.12** | #c9c7da on #0c0e24 **11.47** | #25284a on #fffcf4 **13.82** | #e6e4f2 on #05061a **15.98** |
| `ink-3` | `page` | 4.5 | #5c5f7b on #faf5ea **5.71** | #a2a1bd on #0c0e24 **7.58** | #35385a on #fffcf4 **10.98** | #cfcde2 on #05061a **12.87** |
| `ink` | `page-subtle` | 4.5 | #181b3a on #f3ecdc **14.19** | #f4eedf on #11142f **15.57** | #0d0f26 on #f6f0e0 **16.57** | #ffffff on #0a0c26 **19.20** |
| `ink-2` | `page-subtle` | 4.5 | #454867 on #f3ecdc **7.51** | #c9c7da on #11142f **10.87** | #25284a on #f6f0e0 **12.46** | #e6e4f2 on #0a0c26 **15.31** |
| `ink-3` | `page-subtle` | 4.5 | #5c5f7b on #f3ecdc **5.28** | #a2a1bd on #11142f **7.18** | #35385a on #f6f0e0 **9.89** | #cfcde2 on #0a0c26 **12.33** |
| `ink` | `surface` | 4.5 | #181b3a on #fffdf8 **16.43** | #f4eedf on #171a3d **14.49** | #0d0f26 on #ffffff **18.86** | #ffffff on #0f1233 **18.18** |
| `ink-2` | `surface` | 4.5 | #454867 on #fffdf8 **8.69** | #c9c7da on #171a3d **10.11** | #25284a on #ffffff **14.17** | #e6e4f2 on #0f1233 **14.50** |
| `ink-3` | `surface` | 4.5 | #5c5f7b on #fffdf8 **6.11** | #a2a1bd on #171a3d **6.68** | #35385a on #ffffff **11.26** | #cfcde2 on #0f1233 **11.67** |
| `ink` | `surface-raised` | 4.5 | #181b3a on #ffffff **16.71** | #f4eedf on #1f2350 **12.82** | #0d0f26 on #ffffff **18.86** | #ffffff on #171b45 **16.41** |
| `ink-2` | `surface-raised` | 4.5 | #454867 on #ffffff **8.83** | #c9c7da on #1f2350 **8.95** | #25284a on #ffffff **14.17** | #e6e4f2 on #171b45 **13.09** |
| `ink-3` | `surface-raised` | 4.5 | #5c5f7b on #ffffff **6.21** | #a2a1bd on #1f2350 **5.91** | #35385a on #ffffff **11.26** | #cfcde2 on #171b45 **10.54** |
| `ink` | `surface-sunken` | 4.5 | #181b3a on #f5efe1 **14.57** | #f4eedf on #090b1d **16.84** | #0d0f26 on #f6f0e0 **16.57** | #ffffff on #020312 **20.50** |
| `ink-2` | `surface-sunken` | 4.5 | #454867 on #f5efe1 **7.70** | #c9c7da on #090b1d **11.75** | #25284a on #f6f0e0 **12.46** | #e6e4f2 on #020312 **16.34** |
| `ink-3` | `surface-sunken` | 4.5 | #5c5f7b on #f5efe1 **5.42** | #a2a1bd on #090b1d **7.76** | #35385a on #f6f0e0 **9.89** | #cfcde2 on #020312 **13.16** |

**Brand**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `primary-ink` | `page` | 4.5 | #252a6c on #faf5ea **11.87** | #c7ccff on #0c0e24 **12.23** | #171b52 on #fffcf4 **15.57** | #dde0ff on #05061a **15.44** |
| `primary-ink` | `page-subtle` | 4.5 | #252a6c on #f3ecdc **10.97** | #c7ccff on #11142f **11.59** | #171b52 on #f6f0e0 **14.03** | #dde0ff on #0a0c26 **14.79** |
| `primary-ink` | `surface` | 4.5 | #252a6c on #fffdf8 **12.70** | #c7ccff on #171a3d **10.79** | #171b52 on #ffffff **15.96** | #dde0ff on #0f1233 **14.01** |
| `primary-ink` | `surface-raised` | 4.5 | #252a6c on #ffffff **12.91** | #c7ccff on #1f2350 **9.55** | #171b52 on #ffffff **15.96** | #dde0ff on #171b45 **12.64** |
| `primary-ink` | `primary-soft` | 4.5 | #252a6c on #e7e8f4 **10.60** | #c7ccff on #20245a **9.24** | #171b52 on #e7e8f4 **13.11** | #dde0ff on #20245a **11.07** |
| `on-primary` | `primary` | 4.5 | #fbf6ea on #252a6c **11.97** | #14163a on #c5c9fb **10.88** | #fbf6ea on #171b52 **14.80** | #14163a on #dde0ff **13.42** |
| `on-primary` | `primary-hover` | 4.5 | #fbf6ea on #181c4f **14.77** | #14163a on #dfe1ff **13.56** | #fbf6ea on #0d0f33 **17.18** | #14163a on #f1f2ff **15.66** |
| `primary` | `page` | 3.0 | #252a6c on #faf5ea **11.87** | #c5c9fb on #0c0e24 **11.88** | #171b52 on #fffcf4 **15.57** | #dde0ff on #05061a **15.44** |
| `primary` | `surface` | 3.0 | #252a6c on #fffdf8 **12.70** | #c5c9fb on #171a3d **10.48** | #171b52 on #ffffff **15.96** | #dde0ff on #0f1233 **14.01** |

**Surfaces**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `on-inverse` | `inverse` | 4.5 | #f6f0e2 on #181b3a **14.70** | #f4eedf on #1d2152 **13.03** | #f6f0e2 on #181b3a **14.70** | #f4eedf on #1d2152 **13.03** |
| `on-inverse-dim` | `inverse` | 4.5 | #c2c0d6 on #181b3a **9.39** | #c2c0d6 on #1d2152 **8.48** | #c2c0d6 on #181b3a **9.39** | #c2c0d6 on #1d2152 **8.48** |

**Accents**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `gold-ink` | `page` | 4.5 | #7a5814 on #faf5ea **5.97** | #e2c383 on #0c0e24 **11.20** | #5a3f07 on #fffcf4 **9.53** | #f0d9a4 on #05061a **14.47** |
| `gold-ink` | `page-subtle` | 4.5 | #7a5814 on #f3ecdc **5.51** | #e2c383 on #11142f **10.61** | #5a3f07 on #f6f0e0 **8.59** | #f0d9a4 on #0a0c26 **13.86** |
| `gold-ink` | `surface` | 4.5 | #7a5814 on #fffdf8 **6.38** | #e2c383 on #171a3d **9.88** | #5a3f07 on #ffffff **9.77** | #f0d9a4 on #0f1233 **13.13** |
| `gold-ink` | `gold-soft` | 4.5 | #7a5814 on #f2e7cc **5.28** | #e2c383 on #2b2946 **8.19** | #5a3f07 on #f2e7cc **7.94** | #f0d9a4 on #2b2946 **10.05** |
| `gold` | `page` | n/a | #a57b2b on #faf5ea **3.53** | #d2ac62 on #0c0e24 **8.89** | #7a5814 on #fffcf4 **6.33** | #e2c383 on #05061a **11.80** |
| `gold` | `surface` | n/a | #a57b2b on #fffdf8 **3.77** | #d2ac62 on #171a3d **7.84** | #7a5814 on #ffffff **6.49** | #e2c383 on #0f1233 **10.71** |
| `leaf` | `page` | 4.5 | #1f6b4a on #faf5ea **5.92** | #8fd3ae on #0c0e24 **10.95** | #124a32 on #fffcf4 **9.98** | #b6f2d2 on #05061a **15.86** |
| `leaf` | `surface` | 4.5 | #1f6b4a on #fffdf8 **6.33** | #8fd3ae on #171a3d **9.66** | #124a32 on #ffffff **10.23** | #b6f2d2 on #0f1233 **14.39** |
| `leaf` | `leaf-soft` | 4.5 | #1f6b4a on #e0eee3 **5.37** | #8fd3ae on #12382b **7.43** | #124a32 on #e0eee3 **8.53** | #b6f2d2 on #12382b **10.21** |
| `focus` | `page` | 3.0 | #a6157f on #faf5ea **6.36** | #ff9fdc on #0c0e24 **10.18** | #86095f on #fffcf4 **9.23** | #ffc2e9 on #05061a **13.50** |
| `focus` | `page-subtle` | 3.0 | #a6157f on #f3ecdc **5.87** | #ff9fdc on #11142f **9.65** | #86095f on #f6f0e0 **8.32** | #ffc2e9 on #0a0c26 **12.93** |
| `focus` | `surface` | 3.0 | #a6157f on #fffdf8 **6.80** | #ff9fdc on #171a3d **8.98** | #86095f on #ffffff **9.46** | #ffc2e9 on #0f1233 **12.25** |
| `focus` | `surface-raised` | 3.0 | #a6157f on #ffffff **6.91** | #ff9fdc on #1f2350 **7.94** | #86095f on #ffffff **9.46** | #ffc2e9 on #171b45 **11.05** |
| `focus` | `surface-sunken` | 3.0 | #a6157f on #f5efe1 **6.03** | #ff9fdc on #090b1d **10.43** | #86095f on #f6f0e0 **8.32** | #ffc2e9 on #020312 **13.80** |
| `focus` | `primary-soft` | 3.0 | #a6157f on #e7e8f4 **5.68** | #ff9fdc on #20245a **7.69** | #86095f on #e7e8f4 **7.77** | #ffc2e9 on #20245a **9.67** |

**Lines**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `line-control` | `page` | 3.0 | #7f7c95 on #faf5ea **3.70** | #7d80a3 on #0c0e24 **4.97** | #25284a on #fffcf4 **13.82** | #e6e4f2 on #05061a **15.98** |
| `line-control` | `page-subtle` | 3.0 | #7f7c95 on #f3ecdc **3.41** | #7d80a3 on #11142f **4.71** | #25284a on #f6f0e0 **12.46** | #e6e4f2 on #0a0c26 **15.31** |
| `line-control` | `surface` | 3.0 | #7f7c95 on #fffdf8 **3.95** | #7d80a3 on #171a3d **4.38** | #25284a on #ffffff **14.17** | #e6e4f2 on #0f1233 **14.50** |
| `line-control` | `surface-raised` | 3.0 | #7f7c95 on #ffffff **4.02** | #7d80a3 on #1f2350 **3.88** | #25284a on #ffffff **14.17** | #e6e4f2 on #171b45 **13.09** |
| `line-control` | `surface-sunken` | 3.0 | #7f7c95 on #f5efe1 **3.50** | #7d80a3 on #090b1d **5.09** | #25284a on #f6f0e0 **12.46** | #e6e4f2 on #020312 **16.34** |
| `line` | `page` | n/a | #e3dccb on #faf5ea **1.25** | #2a2c48 on #0c0e24 **1.40** | #8c899c on #fffcf4 **3.31** | #6e7198 on #05061a **4.27** |
| `line-strong` | `page` | n/a | #cbc4b6 on #faf5ea **1.59** | #454866 on #0c0e24 **2.14** | #5d5a73 on #fffcf4 **6.45** | #a2a4c4 on #05061a **8.25** |
| `line` | `surface` | n/a | #e3dccb on #fffdf8 **1.34** | #2a2c48 on #171a3d **1.24** | #8c899c on #ffffff **3.40** | #6e7198 on #0f1233 **3.87** |
| `line-strong` | `surface` | n/a | #cbc4b6 on #fffdf8 **1.70** | #454866 on #171a3d **1.89** | #5d5a73 on #ffffff **6.61** | #a2a4c4 on #0f1233 **7.48** |

**Status**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `positive-fg` | `positive-bg` | 4.5 | #1a6245 on #e2f0e6 **6.20** | #8fddb5 on #12382b **8.10** | #0d4a32 on #e2f0e6 **8.73** | #b6f2d2 on #12382b **10.21** |
| `positive-fg` | `page` | 4.5 | #1a6245 on #faf5ea **6.71** | #8fddb5 on #0c0e24 **11.93** | #0d4a32 on #fffcf4 **10.02** | #b6f2d2 on #05061a **15.86** |
| `positive-fg` | `surface` | 4.5 | #1a6245 on #fffdf8 **7.18** | #8fddb5 on #171a3d **10.52** | #0d4a32 on #ffffff **10.28** | #b6f2d2 on #0f1233 **14.39** |
| `positive-border` | `page` | 3.0 | #458a6a on #faf5ea **3.78** | #3e8f6b on #0c0e24 **4.84** | #0d4a32 on #fffcf4 **10.02** | #b6f2d2 on #05061a **15.86** |
| `positive-border` | `surface` | 3.0 | #458a6a on #fffdf8 **4.05** | #3e8f6b on #171a3d **4.27** | #0d4a32 on #ffffff **10.28** | #b6f2d2 on #0f1233 **14.39** |
| `warning-fg` | `warning-bg` | 4.5 | #874a00 on #faeacd **5.88** | #f5c46e on #47300a **7.67** | #643600 on #faeacd **8.56** | #ffd88f on #47300a **9.12** |
| `warning-fg` | `page` | 4.5 | #874a00 on #faf5ea **6.41** | #f5c46e on #0c0e24 **11.77** | #643600 on #fffcf4 **9.89** | #ffd88f on #05061a **14.77** |
| `warning-fg` | `surface` | 4.5 | #874a00 on #fffdf8 **6.86** | #f5c46e on #171a3d **10.38** | #643600 on #ffffff **10.14** | #ffd88f on #0f1233 **13.39** |
| `warning-border` | `page` | 3.0 | #ad7320 on #faf5ea **3.67** | #a87a2a on #0c0e24 **4.96** | #643600 on #fffcf4 **9.89** | #ffd88f on #05061a **14.77** |
| `warning-border` | `surface` | 3.0 | #ad7320 on #fffdf8 **3.93** | #a87a2a on #171a3d **4.38** | #643600 on #ffffff **10.14** | #ffd88f on #0f1233 **13.39** |
| `critical-fg` | `critical-bg` | 4.5 | #a02925 on #fae3df **6.03** | #ffa99e on #4c1b1d **7.70** | #7c1814 on #fae3df **8.56** | #ffc7bf on #4c1b1d **9.56** |
| `critical-fg` | `page` | 4.5 | #a02925 on #faf5ea **6.80** | #ffa99e on #0c0e24 **10.34** | #7c1814 on #fffcf4 **10.25** | #ffc7bf on #05061a **13.53** |
| `critical-fg` | `surface` | 4.5 | #a02925 on #fffdf8 **7.27** | #ffa99e on #171a3d **9.12** | #7c1814 on #ffffff **10.51** | #ffc7bf on #0f1233 **12.27** |
| `critical-border` | `page` | 3.0 | #c55f57 on #faf5ea **3.75** | #c0625c on #0c0e24 **4.65** | #7c1814 on #fffcf4 **10.25** | #ffc7bf on #05061a **13.53** |
| `critical-border` | `surface` | 3.0 | #c55f57 on #fffdf8 **4.01** | #c0625c on #171a3d **4.10** | #7c1814 on #ffffff **10.51** | #ffc7bf on #0f1233 **12.27** |
| `info-fg` | `info-bg` | 4.5 | #0f5873 on #ddeef3 **6.60** | #8cd3ec on #0e3646 **7.73** | #084256 on #ddeef3 **9.14** | #b5e6f7 on #0e3646 **9.55** |
| `info-fg` | `page` | 4.5 | #0f5873 on #faf5ea **7.25** | #8cd3ec on #0c0e24 **11.45** | #084256 on #fffcf4 **10.64** | #b5e6f7 on #05061a **14.91** |
| `info-fg` | `surface` | 4.5 | #0f5873 on #fffdf8 **7.75** | #8cd3ec on #171a3d **10.10** | #084256 on #ffffff **10.91** | #b5e6f7 on #0f1233 **13.53** |
| `info-border` | `page` | 3.0 | #41869f on #faf5ea **3.76** | #3f8ca8 on #0c0e24 **5.00** | #084256 on #fffcf4 **10.64** | #b5e6f7 on #05061a **14.91** |
| `info-border` | `surface` | 3.0 | #41869f on #fffdf8 **4.02** | #3f8ca8 on #171a3d **4.41** | #084256 on #ffffff **10.91** | #b5e6f7 on #0f1233 **13.53** |
| `neutral-fg` | `neutral-bg` | 4.5 | #494c66 on #eae5da **6.66** | #cdcedd on #2b2e50 **8.36** | #2c2f4e on #eae5da **10.29** | #e8e9f3 on #2b2e50 **10.79** |
| `neutral-fg` | `page` | 4.5 | #494c66 on #faf5ea **7.69** | #cdcedd on #0c0e24 **12.20** | #2c2f4e on #fffcf4 **12.61** | #e8e9f3 on #05061a **16.59** |
| `neutral-fg` | `surface` | 4.5 | #494c66 on #fffdf8 **8.23** | #cdcedd on #171a3d **10.76** | #2c2f4e on #ffffff **12.93** | #e8e9f3 on #0f1233 **15.05** |
| `neutral-border` | `page` | 3.0 | #7f7c95 on #faf5ea **3.70** | #7d80a3 on #0c0e24 **4.97** | #2c2f4e on #fffcf4 **12.61** | #e8e9f3 on #05061a **16.59** |
| `neutral-border` | `surface` | 3.0 | #7f7c95 on #fffdf8 **3.95** | #7d80a3 on #171a3d **4.38** | #2c2f4e on #ffffff **12.93** | #e8e9f3 on #0f1233 **15.05** |
| `page` | `critical-fg` | 4.5 | #faf5ea on #a02925 **6.80** | #0c0e24 on #ffa99e **10.34** | #fffcf4 on #7c1814 **10.25** | #05061a on #ffc7bf **13.53** |

**Provenance**

| Foreground | Background | Needs | Light | Dark | HC light | HC dark |
|---|---|---|---|---|---|---|
| `official-fg` | `official-bg` | 4.5 | #fbf6ea on #181b3a **15.49** | #14163a on #f4eedf **15.04** | #fbf6ea on #0d0f26 **17.48** | #05061a on #ffffff **20.04** |
| `estimated-fg` | `estimated-bg` | 4.5 | #181b3a on #fffdf8 **16.43** | #f4eedf on #171a3d **14.49** | #0d0f26 on #fffdf8 **18.55** | #ffffff on #171a3d **16.77** |
| `estimated-border` | `page` | 3.0 | #454867 on #faf5ea **8.12** | #c9c7da on #0c0e24 **11.47** | #0d0f26 on #fffcf4 **18.39** | #ffffff on #05061a **20.04** |
| `estimated-border` | `surface` | 3.0 | #454867 on #fffdf8 **8.69** | #c9c7da on #171a3d **10.11** | #0d0f26 on #ffffff **18.86** | #ffffff on #0f1233 **18.18** |
| `suggestion-fg` | `suggestion-bg` | 4.5 | #252a6c on #e7e8f4 **10.60** | #c7ccff on #20245a **9.24** | #171b52 on #e7e8f4 **13.11** | #dde0ff on #20245a **11.07** |
| `suggestion-border` | `page` | 3.0 | #252a6c on #faf5ea **11.87** | #c7ccff on #0c0e24 **12.23** | #171b52 on #fffcf4 **15.57** | #dde0ff on #05061a **15.44** |
| `suggestion-border` | `surface` | 3.0 | #252a6c on #fffdf8 **12.70** | #c7ccff on #171a3d **10.79** | #171b52 on #ffffff **15.96** | #dde0ff on #0f1233 **14.01** |
| `demo-fg` | `demo-bg` | 4.5 | #1f1600 on #ffc233 **11.09** | #1f1600 on #ffc233 **11.09** | #1f1600 on #ffc233 **11.09** | #1f1600 on #ffc233 **11.09** |
| `demo-border` | `page` | 3.0 | #8a6400 on #faf5ea **4.94** | #ffc233 on #0c0e24 **11.79** | #1f1600 on #fffcf4 **17.46** | #ffc233 on #05061a **12.42** |
| `demo-border` | `surface` | 3.0 | #8a6400 on #fffdf8 **5.29** | #ffc233 on #171a3d **10.40** | #1f1600 on #ffffff **17.90** | #ffc233 on #0f1233 **11.27** |
| `official-bg` | `page` | 3.0 | #181b3a on #faf5ea **15.36** | #f4eedf on #0c0e24 **16.43** | #0d0f26 on #fffcf4 **18.39** | #ffffff on #05061a **20.04** |

**Board** (the same in both themes)

| Foreground | Background | Needs | Board | HC board |
|---|---|---|---|---|
| `board-ink` | `board` | 4.5 | #f3f1ea on #080b16 **17.36** | #f3f1ea on #080b16 **17.36** |
| `board-dim` | `board` | 4.5 | #a9aec2 on #080b16 **8.89** | #d5d9e8 on #080b16 **13.94** |
| `board-accent` | `board` | 4.5 | #ffc24a on #080b16 **12.21** | #ffc24a on #080b16 **12.21** |
| `board-line` | `board` | n/a | #2b3148 on #080b16 **1.52** | #636b8c on #080b16 **3.75** |
| `board-ink` | `board-raised` | 4.5 | #f3f1ea on #121627 **15.88** | #f3f1ea on #121627 **15.88** |
| `board-dim` | `board-raised` | 4.5 | #a9aec2 on #121627 **8.13** | #d5d9e8 on #121627 **12.75** |
| `board-accent` | `board-raised` | 4.5 | #ffc24a on #121627 **11.17** | #ffc24a on #121627 **11.17** |
| `board-line` | `board-raised` | n/a | #2b3148 on #121627 **1.39** | #636b8c on #121627 **3.42** |

## 3. Typography

Three self-hosted variable typefaces (latin subsets, `next/font/local`, no network requests):

| Role | Typeface | Use |
|---|---|---|
| Display | Fraunces (optical size axis, roman and italic) | Editorial headings only: page titles, section headings, the wordmark. Never for interface labels, buttons, data or body copy. |
| Interface | Hanken Grotesk | Everything else: body, labels, buttons, navigation, forms. |
| Data | Geist Mono, tabular lining figures | Times, gates, flight numbers, airport codes, amounts, token names, table headers. |

Type scale (each is one utility that sets family, size, leading, tracking and weight):

| Utility | Size (px) | Leading | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `type-display-xl` | 38 to 72, fluid | 1.0 | -0.028em | 380 | Home hero only |
| `type-display-lg` | 32 to 52, fluid | 1.04 | -0.024em | 380 | Page titles (`PageHeader`) |
| `type-display-md` | 26 to 36, fluid | 1.1 | -0.02em | 380 | Section headings |
| `type-display-sm` | 22 to 26, fluid | 1.18 | -0.014em | 400 | Card headings in editorial contexts |
| `type-title-lg` | 22 | 1.25 | -0.015em | 650 | Panel and dialog titles |
| `type-title-md` | 18 | 1.3 | -0.01em | 650 | Card titles |
| `type-title-sm` | 16 | 1.35 | -0.005em | 650 | Row titles, group headings |
| `type-body-lg` | 18 | 1.6 | 0 | 400 | Leads |
| `type-body` | 16 | 1.55 | 0 | 400 | Body (never smaller on phones) |
| `type-body-sm` | 14 | 1.5 | 0 | 400 | Secondary text, hints |
| `type-caption` | 13 | 1.4 | 0.005em | 400 | Captions, chips, tags |
| `type-eyebrow` | 12 | 1.2 | 0.14em, uppercase | 600 | Section eyebrows |
| `type-data-xl` | 24 | 1.0 | -0.01em | 600 | The time on a flight detail |
| `type-data-lg` | 20 | 1.1 | 0 | 600 | Board times |
| `type-data-md` | 15 | 1.3 | 0 | 500 | Table figures, gates, flight numbers |
| `type-data-sm` | 13 | 1.3 | 0.01em | 500 | Freshness row, codes in running rows |
| `type-data-xs` | 11 | 1.2 | 0.06em, uppercase | 500 | Table headers, specimen captions |

Rules: sentence case everywhere; headings balance (`text-wrap: balance`), paragraphs avoid orphans
(`text-wrap: pretty`); line length for reading is capped at 42rem; 24-hour clock; mono figures are
tabular so columns of times align. The text-size preference scales the root font size to 112.5% or
125%, and every size above is in `rem`, so the whole interface scales with it.

## 4. Spacing and layout

- **Base unit 4 px.** Use the Tailwind spacing scale (1 = 4 px): 1, 2, 3, 4, 6, 8, 12, 16, 20.
  Inside components prefer 8, 12 and 16; between components 16, 24 and 32; between sections the
  `py-section` token (48 to 80 px, fluid).
- **Gutter**: `px-gutter`, 16 px on phones rising to 48 px (4vw between).
- **Widths**: `max-w-reading` 672 px (long-form text), `max-w-narrow` 896 px (forms, single-column
  tools), `max-w-page` 1240 px (the default), `max-w-wide` 1440 px (boards and maps).
- **Header height** is the `--spacing-header` token (68 px); scroll padding and sticky offsets read
  it so focused elements are never hidden under the header.
- **Bands**: sections alternate between `page` and `page-subtle` with hairline borders, rather
  than relying on shadows to separate content.

## 5. Radii

Fine corners, few pills. The pill radius is reserved for the switch.

| Token | Value | Use |
|---|---|---|
| `rounded-xs` | 3 px | Badges, keyboard keys, terminal badges |
| `rounded-sm` | 5 px | Chips, provenance tags, status chips |
| `rounded-md` | 8 px | Buttons, inputs, segmented controls |
| `rounded-lg` | 12 px | Cards, callouts, banners, the board |
| `rounded-xl` | 16 px | Dialogs and sheets |
| `rounded-pill` | 999 px | Switch only |

## 6. Elevation

Restrained: hairlines do most of the separating. Shadows are tinted with ink (never pure black in
the light theme) and deepen automatically in the dark theme.

| Token | Use |
|---|---|
| `shadow-xs` | Primary and danger buttons |
| `shadow-sm` | Interactive card on hover |
| `shadow-md` | Raised card |
| `shadow-lg` | Dialog, sheet, popover, skip link |

The sticky header is opaque with a hairline beneath it: no blur, no translucency.

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 120 ms | Hover, press, colour changes |
| `duration-base` | 200 ms | Popover, tooltip, accordion, fade |
| `duration-slow` | 360 ms | Dialog and sheet entrance |
| `ease-out` | cubic-bezier(0.2, 0.7, 0.2, 1) | Entrances |
| `ease-in-out` | cubic-bezier(0.65, 0, 0.25, 1) | Exits and loops |

Motion explains a change of state and nothing else: no autoplay, no parallax, no carousels that
move on their own. With `prefers-reduced-motion` or the in-app "Reduce motion" setting, every
animation and transition collapses to an instant change, including view transitions.

## 8. Iconography

- One family: Lucide, through the single `Icon` wrapper. 1.5 px stroke at 20 px (1.75 to 2 px at
  14 to 16 px so small icons hold their weight). Sizes 14, 16, 20, 24 and 32 px.
- **One meaning, one icon.** "Track a flight" is always `plane-takeoff`; "My journey" is always
  `bookmark`; the concierge is always `sparkles`. The wrapper maps domain keys (facility
  categories, transport modes, map points, journey steps) to icons so features cannot drift.
- Icons are decorative by default and hidden from assistive technology. An icon carries a label
  only when it is the sole carrier of meaning, and icon-only buttons always require a text label.
- Icons never replace words for status, provenance or severity: they accompany them.

## 9. Status, provenance and demonstration data

### 9.1 Flight status: shape, icon and words

Colour is the fourth signal, never the first. Each tone has its own shape:

| Tone | Shape | Statuses |
|---|---|---|
| Neutral | Outlined, no fill | Scheduled, check-in closed, en route |
| Positive | Tinted fill, fine border | Check-in open, boarding, landed, at gate, bags on belt |
| Warning | Tinted fill, heavy 2 px border | Final call, delayed |
| Critical | Tinted fill, dashed border | Cancelled |
| Muted | Flat fill, no border | Gate closed, departed, completed |

A delayed time shows the old time struck through beside the new one; a cancelled row is dimmed but
keeps its chip. On the board the same chips take board colours.

### 9.2 Provenance tags: four forms

| Kind | Form | Icon | Meaning |
|---|---|---|---|
| Official | Solid ink | Badge with check | An instruction or fact from the airport, an airline or a government body |
| Estimated | Outlined | Calculator | Our calculation, a typical value, or a detail reported only by third parties |
| Suggestion | Dashed outline, indigo tint | Light bulb | An optional idea |
| Demonstration | Amber with hazard stripes | Flask | Simulated for this prototype |

The `ProvenanceLegend` ("How to read this guidance") appears wherever tags are first introduced.

### 9.3 Demonstration data

Anything produced by the demo providers sits under the `DemoDataBanner`: amber, hazard-striped,
the same in every theme, with the sentence "Do not use it to plan travel". Inline results and
single rows carry the demo provenance tag. The banner is never restyled, softened or hidden.

### 9.4 Facts, sources and gaps

A published value appears as a `KeyFact` with its provenance tag and a `SourceNote` (publisher,
retrieval date, "as of" date; collapsed by default). When a fact is not in the verified content
layer the interface says so with `NotPublished` and points to the official channel. It never
guesses.

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

Props and import paths are in `docs/engineering/handoffs/design-system.md`. States shown on the
style guide page: default, hover, focus (static example), disabled, loading, selected, error.

### 11.1 Primitives (`src/components/ui`)

| Component | States | Usage rules |
|---|---|---|
| Button | default, hover, focus, disabled, loading | One `primary` per view. `secondary` for alternatives, `ghost` and `quiet` for low emphasis, `danger` only for destructive actions. 44 px tall by default; the small size grows to 44 px on phones. |
| IconButton | default, hover, focus, pressed, disabled | A text label is required. Use `pressed` for toggles such as "saved". |
| Chip / FilterChip | static; pressed and unpressed | `Chip` is a tag and is not interactive. `FilterChip` is a toggle button with `aria-pressed` and a tick when on. |
| Badge | static | Counts, codes and levels in mono. |
| Card | outline, raised, sunken; interactive hover and focus | An interactive card is one link (the title) stretched over the card, so it has one focus ring and one name. |
| Input, NativeSelect, SearchField | default, hover, focus, error, disabled | Always a visible label unless the context labels it; hints below the field; errors in text with an icon, linked with `aria-describedby`. SearchField has a clear button and a short placeholder for narrow widths so it never clips. |
| SegmentedControl | selected, hover, focus, disabled | A radio group (native radios, arrow keys). For 2 to 4 mutually exclusive choices; four options become a 2 by 2 grid on phones. |
| Switch | on, off, focus, disabled | Immediate settings only. The on state also shows a tick. |
| Tabs | active, hover, focus, disabled | Views of the same subject. The row scrolls sideways when it must, with a fade on the edge that has more. |
| Accordion | open, closed, focus | Secondary detail; never hide the answer to the page's main question in one. |
| Dialog / Sheet | open, closed | Dialog for decisions and short forms; Sheet for menus, filters and settings (side panel on desktop, bottom sheet on phones). Focus is trapped and returned; Escape closes. |
| Popover, Tooltip | open, closed | Popovers hold a few controls. Tooltips are hints, never required reading and never the only label. |
| Callout | neutral, info, positive, warning, critical | In-page messages with an icon and optional action. |
| DataList, Table | default, hover row, muted row | Section 12. |
| Timeline | done, current, upcoming | Journey steps: state is shown by marker shape and announced in words. |
| Stat, Skeleton, Separator, Kbd | static | Skeletons are hidden from assistive technology; each loading region carries one status message that says "Loading". |

### 11.2 Domain components (`src/components/common`)

| Component | Purpose |
|---|---|
| PageHeader, Breadcrumbs, SectionHeading | Page furniture. One `h1` per page; breadcrumbs collapse to the parent link on phones. |
| QuickAction | An icon, a title and a hint leading to a tool. The first action for the current journey mode is emphasised in ink. |
| NoticeCard | A travel notice with severity (information, advisory, warning, urgent) and provenance. |
| ProvenanceTag, ProvenanceLegend, SourceNote, KeyFact, NotPublished | The honesty system (section 9). |
| DemoDataBanner, Freshness | Required above every demo data view: what it is, and how fresh it is. |
| FlightStatusChip, TerminalBadge, AirportCode, LocalTime | The data language shared by boards, search results and the journey view. |
| EmptyState | What happened, what to do next, and where the official answer is. |
| LocaleLink, ExternalLink | Internal links add the locale; external links show an arrow and tell assistive technology they open in a new tab. |
| TranslationNotice | Shown on a Malay page when verified content falls back to English. |

## 12. Data density

Operational data follows the board language everywhere, not only on the board.

| Token | Height | Use |
|---|---|---|
| `h-row` | 52 px | Default rows: boards and anything tapped on a phone |
| `h-row-dense` | 40 px | Desktop reference tables (fares, rates, directories) |
| `h-row-compact` | 32 px | Read-only reference tables |
| `h-chip` | 28 px | Chips, status chips |
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
| Hover | A quiet surface tint or a firmer border; underlines thicken. Never the only way to discover an action. |
| Focus | 2 px orchid outline with 2 px offset (3 px in high contrast and forced colours) on every interactive element, via `:focus-visible`. Never removed. Composite controls ring the visible part (`focus-ring`). |
| Pressed / selected | Ink fill with paper text (segments, filter chips) plus a tick or `aria-pressed`, `aria-checked` or `aria-current`. Never tint alone. |
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
| 1.4.3 Contrast (minimum) | All text pairs at least 5.28:1 in every theme (section 2.3) |
| 1.4.4 Resize text | Text-size setting (100, 112.5, 125%) and browser zoom to 200% without loss; sizes in `rem` |
| 1.4.10 Reflow | No horizontal page scroll at 320 CSS px; boards reflow to stacked rows |
| 1.4.11 Non-text contrast | Control boundaries, focus rings and status borders at least 3.41:1 |
| 1.4.12 Text spacing | No fixed heights on text containers; chips and buttons grow |
| 1.4.13 Content on hover or focus | Tooltips are dismissible, hoverable and persistent (Radix) |
| 2.1.1 Keyboard, 2.1.2 No trap | Native controls first; Radix primitives for dialogs, popovers, tabs and accordions; scroll regions are focusable |
| 2.3.3, 2.2.2 Motion | System and in-app reduced motion; nothing moves on its own |
| 2.4.1 Bypass blocks | Skip link as the first focusable element |
| 2.4.7 Focus visible, 2.4.11 Focus not obscured, 2.4.13 Focus appearance | Dedicated focus colour, 2 to 3 px ring, scroll padding under the opaque sticky header |
| 2.5.8 Target size | 44 px primary targets on touch; 24 px floor |
| 3.1.1, 3.1.2 Language | `<html lang>` from the route; Malay phrases inside English pages are marked `lang="ms"` |
| 3.3.1, 3.3.2 Errors and labels | Every input labelled; errors in text, linked to the field |
| 4.1.2 Name, role, value | Icon buttons require a label; toggles expose pressed and checked state |
| 4.1.3 Status messages | Polite live regions for freshness, result counts and loading; never more than one announcement per update |

Also supported: Windows forced-colours mode, a stylesheet-only dark theme for visitors without
JavaScript, and print styles for guidance pages.
