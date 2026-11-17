# Design direction: decision record

Date: 17 November 2026. Inputs: three working homepage concepts in `docs/design/concepts/`
(A Tenun, B Rimba, C Laluan) and the independent panel's evaluation in
`docs/design/concepts/evaluation.md`.

## What the panel found

| Concept | Utility 25% | Craft 20% | Identity 15% | Data 15% | Accessibility 15% | Mobile 10% | Weighted |
|---|---|---|---|---|---|---|---|
| A Tenun (woven light) | 7 | 8 | 8 | 7 | 7 | 7 | 7.4 |
| B Rimba (forest canopy) | 8 | 7 | 7 | 7 | 8 | 8 | 7.5 |
| C Laluan (wayfinding) | 8 | 7 | 5 | 8 | 7 | 7 | 7.1 |

The panel named B the winner by 0.1 and said plainly that the result is narrow: B has the most
useful first screen, the cleanest accessibility build and the best phone design; A is "clearly the
more premium and more distinctly Malaysian direction"; C handles operational data best. No cell
reached 9, so none of the three is good enough as it stands.

## Decision

We implement a **synthesis**, not any single concept. Each concept contributes the layer it won:

| Layer | Taken from | Why |
|---|---|---|
| Structure: first-screen composition, responsive behaviour, accessibility build, phone patterns | **B Rimba** (the panel's winner) | Utility, accessibility and mobile are properties of structure. B's one-line headline, full-width search with a scope sentence, modes and six actions in one row, 44 px targets, native controls, live regions and full-screen phone menu are carried over as built. |
| Visual identity: palette, typography, hairline detailing, illustration family, provenance tags | **A Tenun** | Premium and distinctly Malaysian are two of the five required qualities of the proposition, and A leads on both craft and identity. The panel's own must-fix list for B ("raise the premium register: smaller radii, fewer pills, finer rules, quieter hero", "redraw the illustrations as one family") moves B to where A already is. A's indigo and gold also remove the collision the panel flagged in B, where brand green and brand red doubled as the On time, Cancelled, focus and Suggestion colours. |
| Data language: board, status chips, badges, demo banner, freshness, dense tables | **C Laluan** | The product is mostly operational data once past the homepage. C's neutral ink board, shape-coded status chips, T1/T2 badges, hazard-striped demonstration banner, freshness row and mono tabular figures become the rules for every data-dense screen. |

This is a judgement call by the design lead that departs from the panel's nominal ranking, so it
is recorded here rather than presented as the panel's verdict. The panel's ranking stands as
evidence; the synthesis follows the panel's own graft and must-fix lists (reproduced in the
evaluation) and changes only which concept supplies the colour and type.

## The resulting system in one paragraph

Warm paper neutrals and deep songket indigo, with a single gold-thread hairline used as decoration
only (never as a status colour) and rainforest green kept as the secondary, living accent for
illustration and positive states. Fraunces for editorial display headings, used sparingly; Hanken
Grotesk for all interface text; Geist Mono for times, gates, codes and tables. Finer rules, small
radii, few pills. A search-first first screen that fits at 1280 by 720 and 360 by 800. A dark,
neutral "board" surface for flight data in both themes. Status always carried by icon, shape and
words. Malaysian identity through pucuk rebung hairlines, a scattered bunga tabur field, line-drawn
airport vignettes and the canopy geometry of KLIA, never through flags or clip-art.

## Binding requirements carried into the design system

From the panel's must-fix list (all apply to the synthesis):

1. Brand colour is never a status colour. Focus has its own non-semantic colour.
2. Real search parsing with inline, demo-labelled results (no "reads as" guess).
3. Journey mode sets Departures or Arrivals, renames actions and rewrites the guidance strip.
4. The unset airport state is solid and clearly highlighted, never dashed.
5. One illustration family with true dark-theme versions.
6. Placeholders never clip below 400 px; nothing truncates between 360 and 1600 px.
7. Stylesheet-only system-theme fallback, a contrast setting, forced-colours support.
8. Opaque sticky header, no blur.
9. Dense table, directory and map tokens defined up front (row heights, tabular figures, badges).
10. All touch targets at least 44 px on phones; UI boundaries at least 3:1.
