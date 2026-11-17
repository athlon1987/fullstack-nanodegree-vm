# Homepage concept evaluation

Independent panel: product design director, airport passenger-experience lead, accessibility specialist.
Judged on what is rendered, not on the authors' descriptions.

## Decision

**Winner: B, Rimba (Forest Canopy), 7.5 / 10.** Runner-up A, Tenun, 7.4 (7.35 unrounded). Third C, Laluan, 7.1.

This is a narrow result and should be read as one. Rimba wins because it is the most useful first screen, the cleanest accessibility build and the best phone design, and those three criteria carry half the weight. It does not win on craft or identity: Tenun is clearly the more premium and more distinctly Malaysian direction, and Laluan handles operational data better than either. The winning direction is only good enough to become the design system once the grafts and fixes below are made.

| Concept | Utility 25% | Craft 20% | Identity 15% | Data 15% | Accessibility 15% | Mobile 10% | Weighted |
|---|---|---|---|---|---|---|---|
| A Tenun | 7 | 8 | 8 | 7 | 7 | 7 | **7.4** |
| B Rimba | 8 | 7 | 7 | 7 | 8 | 8 | **7.5** |
| C Laluan | 8 | 7 | 5 | 8 | 7 | 7 | **7.1** |

Scale used: 5 competent but unremarkable, 8 genuinely excellent, 10 award-winning as is. No cell reached 9.

## How it was judged

- All 18 supplied screenshots were viewed.
- Each page was re-captured with Playwright at 360, 390, 768, 1024, 1280, 1440 and 1600 px wide, light and dark, full length in sections.
- Interactions exercised: each journey mode, airport selection, a flight search, the accessibility panel, the mobile menu, keyboard tabbing, larger-text mode.
- Automated checks: computed text contrast for every visible text node in both themes, placeholder contrast, touch-target size at 390 px, focus outline on the first 16 tab stops, landmarks, headings, labels, table semantics, reduced-motion rules.
- No concept produced a console error, a failed font request or horizontal scrolling at any tested width.

## Score justification, cell by cell

| Criterion | A Tenun | B Rimba | C Laluan |
|---|---|---|---|
| Utility | 7. Everything required is above the fold at 1440x900 and 390x844, but the two-line serif headline and intro take the top quarter, the search shares a row with the airport field, and submitting a search only prints a note. | 8. Most compact first screen: one-line headline, full-width search, scope sentence ("Searching departures across all 39 airports"), modes and six actions in one row; still complete at 1280x720. | 8. Most functional search: four labelled example types and live, demo-labelled results under the field. Tallest hero, so modes and actions fall below the fold on a 720 px laptop. |
| Craft | 8. Best typography and spacing of the three (Fraunces display with italic, Hanken Grotesk), hairline discipline, one consistent line style. Loses a point to truncation at 768 and 1280 px. | 7. Cohesive and warm (Bricolage Grotesque, Hanken Grotesk, Geist Mono) but soft: pills everywhere, a crude sawtooth footer edge, a dashed selector that reads as a draft, one weak illustration. | 7. Rigorous grid and a strict signage system, but one sans for everything, mono caps labels throughout, an app-icon mark and designer notes ("MOTIF · CANOPY COLUMNS") left on passenger cards. |
| Identity | 8. Songket indigo and gold, tenun zigzag hairline, scattered-star pattern, KLIA canopy line drawing. Premium, specific, unlike any airport site. Leans hospitality more than technology. | 7. Hibiscus mark, fan palm, fern and pucuk rebung are recognisably Malaysian and memorable; friendly rather than premium, and rainforest green is shared territory in the region. | 5. Navy, blue and amber signage is the generic airport language. Malaysian cues are limited to a weave border and small pattern tiles. Looks like a capable dashboard. |
| Data | 7. Clear table, best delay treatment (old and new time together in the time column), best provenance tags (solid, outlined, dashed with three icons). Demo label is modest; airy rows and serif destinations will need a denser variant. | 7. Unmistakable striped demo banner, mono times, IATA codes, search filters the board. Brand green and red collide with On time and Cancelled, and the Suggestion tag is red-tinted. | 8. Best board: hazard-striped demo banner, freshness row, T1/T2 badges, chips that differ by shape as well as colour, the same row reused in search results. Delayed row shows only the struck-out old time in the time column; mobile rows drop the airline. |
| Accessibility | 7. Passes text contrast in both themes (only decorative dots fail), native selects, tabs with arrow keys, table caption. 20 touch targets under 44 px on mobile, airport field border at 1.7:1, 48 placeholder links, most icons not hidden from assistive technology. | 8. Fewest defects: native radios and selects, every mobile target at 44 px, all 104 icons hidden, four live regions, 3 px focus ring, Auto/Light/Dark. Red is used for focus, action and a status. | 7. Best ideas (contrast setting, spoken announcement on mode change, shape-coded chips, zero page contrast failures) undermined by an accessibility panel whose unselected options measure 2.1:1, a hand-built listbox and an h3 before the h1. |
| Mobile | 7. Bottom bar with raised search, whole brief on the first screen, cards for the board. Longest page (8,302 px), plain dropdown menu, small settings controls. | 8. Bottom bar, whole brief on the first screen, snap carousels for airports and shops (shortest page, 6,636 px), full-screen menu holding language, theme and text size. Placeholder is clipped. | 7. Efficient first screen with a four-up mode selector and scrolling example chips. Menu layout is awkward, board rows lose the airline, top bar clips at 768 px. |

## A. Tenun (Woven Light)

Strengths
- The only concept that reads as premium at first glance. Display serif with italic, generous measure, hairline rules.
- Malaysian identity is specific and restrained: indigo and gold, a woven zigzag hairline, a scattered-star field, canopy columns.
- Best illustration system: single-stroke line drawings, two featured KLIA cards above five secondary airports.
- Smartest journey modes. Choosing "I'm meeting someone" flips Departures to Arrivals, renames actions ("Track their flight", "Arrivals hall maps") and rewrites the guidance strip, naming the chosen airport.
- Clearest provenance tags and legend; best delayed-time treatment.
- Concierge teaser shows a sourced answer and a Preview badge.

Weaknesses
- Search is the least prominent of the three and does nothing in the demo.
- At 768 px the search placeholder is cut to "Flight numl"; at 1280 px the header airport selector is cut to "Choos…"; at 360 px the placeholder is clipped.
- On a 1280x720 laptop the quick actions fall below the fold.
- Settings buttons are 32 px tall on touch; concierge field and send button are 40 px.
- Airport field boundary is 1.7:1 in light and 2.3:1 in dark.
- Demonstration label is a small line in the board header, weaker than B and C.
- 48 of 64 links are bare `#` placeholders; 83 of 108 icons are not hidden from assistive technology.

## B. Rimba (Forest Canopy)

Strengths
- Useful within seconds. Airport, direction, search, modes, six actions and the notice sit in one tight column with little decoration between them.
- Unset airport is visibly unset, and a scope sentence states what the search will cover.
- Search filters the sample board and reports the count.
- Cleanest build: native radios and selects, 44 px targets, labelled regions, live regions, hidden icons, working skip link, 3 px focus ring in both themes.
- Best responsive behaviour between 768 and 1280 px; nothing truncates or wraps badly.
- Phone layout is designed: carousels, a full-screen menu with settings, a clear bottom bar.
- Colourful airport cards are warm and memorable.

Weaknesses
- Friendly rather than premium. Large radii and pills throughout soften it.
- Brand colours overlap status colours: green brand against On time on a green board, red for the main action, the focus ring, the Suggestion tag and Cancelled.
- "Reads as" hint misclassifies its own example: "AirAsia" is read as a destination.
- Journey mode does not change the Departures/Arrivals switch or the guidance strip.
- Mobile search placeholder is clipped at 390 px and 360 px.
- Four of eight airport illustrations keep light backgrounds in dark theme; the KLIA Terminal 2 drawing is the weakest of the set.
- Sawtooth footer edge is crude; sticky header uses a blur.
- Theme relies on script; there is no stylesheet-only fallback to the system preference.

## C. Laluan (Wayfinding)

Strengths
- Search behaves like a product: typed examples by kind, inline results, a demo label on the results, a Clear control.
- Best departures board and the most scalable data language for tables, directories and maps.
- Status chips differ by fill and border as well as colour.
- Airport list shows code and full official airport name.
- Provenance tags are reused inside the concierge answer.
- Contrast setting, spoken mode-change announcement, zero contrast failures on the page.

Weaknesses
- Weakest identity. It could be any airport, and the blue square mark reads as an app icon.
- Accessibility panel fails its own purpose: unselected options at 2.1:1, 24 px tall.
- Custom listbox uses buttons with `aria-selected` inside a listbox, not options.
- Amber is overloaded: demo warning, boarding status, times and the main action.
- Delayed row hides the new time in the chip; mobile rows drop the airline name.
- At 768 px the top bar wraps and clips "Corporate site"; mode labels wrap.
- "MOTIF" captions on airport cards are designer notes, not passenger content.
- First heading in the document is an h3; footer columns are h2.

## Graft into the winner

From A, Tenun
1. Typographic restraint and premium cues: hairline rules, numbered small-caps section eyebrows, a single gold hairline accent, and a refined display face for editorial headings.
2. The line-drawn airport illustrations and the two-featured-plus-five card hierarchy, in place of the mixed flat illustrations.
3. Provenance tags as solid, outlined and dashed forms with distinct icons, plus the "How to read the labels" legend.
4. Mode intelligence: a mode sets Departures or Arrivals, renames actions for the context, and rewrites the guidance strip with the chosen airport's name.
5. Delayed time shown as old and new together in the time column; cancelled rows dimmed.
6. Concierge teaser with a sourced example answer and a Preview badge.
7. Shop and dine filter chips: Open now, Halal, Near my gate, Before security, After security.
8. The "All 39 airports" band with the 5 / 17 / 17 breakdown.

From C, Laluan
1. Inline search results under the field, built from the same rows as the board, demo-labelled, with Clear.
2. Example searches labelled by kind: flight number, destination, airline, route.
3. Board details: shape-coded status chips, T1/T2 badges, hazard-striped demo banner with "Do not use them to plan travel", freshness row with airport and day.
4. Airport options with code and full official name.
5. Contrast setting and the spoken announcement when a mode reorders the actions.
6. Provenance tags and follow-up actions inside concierge answers.
7. Mode sub-labels (door to gate, gate to door, gate to gate, arrivals hall) and the four-up mode selector on phones.
8. Utility bar carrying corporate site, language and accessibility; "Save for later" on the journey card.
9. Mono, tabular data styling and density rules for tables, directories and comparison views.

## Must fix in the winner before it becomes the design system

1. Separate brand colour from status colour. Red must not mean action, focus, suggestion and cancelled at once; green must not be both brand surface and On time. Move the board to a neutral ink surface, shape-code the chips, give focus a non-semantic colour, and restyle the Suggestion tag.
2. Fix the search reading: "AirAsia" is classified as a destination. Replace the hint with real parsing and inline results.
3. Couple journey mode to the Departures/Arrivals switch and to the guidance strip.
4. Raise the premium register: smaller radii, fewer pills, finer rules, quieter hero backdrop, a redrawn footer edge.
5. Replace the dashed unset-airport border with a solid, clearly highlighted state that does not look unfinished.
6. Redraw the airport illustrations as one family with true dark-theme versions; replace the KLIA Terminal 2 drawing.
7. Shorten the search placeholder below 400 px so it is never clipped.
8. Add a stylesheet-only system-theme fallback, a contrast setting and forced-colours support.
9. Make the sticky header opaque; remove the blur.
10. Clarify the "Track a flight" icon; it is also used for Journey in the bottom bar.
11. Define dense table, directory and map tokens now: row heights, tabular figures, badge sizes.
12. Separate the board heading from its subtitle so it is not read as "DeparturesKuala Lumpur…".

## Measured evidence

| Check | A Tenun | B Rimba | C Laluan |
|---|---|---|---|
| Horizontal scroll, 360 to 1600 px | none | none | none |
| Page length at 1440 / 390 px | 5,276 / 8,302 | 5,169 / 6,636 | 4,920 / 7,734 |
| Failing text contrast, light / dark | 8 decorative dots at 3.8:1 / 0 | 0 / 0 | 0 / 0 |
| Search placeholder contrast, light / dark | 5.3 / 7.6 | 5.0 / 6.9 | 7.8 / 8.7 |
| Status chip text contrast, light | 5.9 to 7.3 | 7.9 to 8.8 | 8.2 to 11.4 |
| Touch targets under 44 px at 390 px | 20 | 0 | 0 |
| Focus outline, light / dark | 2 px #3340C8 / #F0D58A | 3 px #C2331F / #FFB3A4 | 3 px #0B4FCC / #FFBE2E |
| Accessibility panel, unselected option contrast | 16.4:1 | 7.1:1 | 2.1:1 |
| Journey mode control | tabs, arrow keys | native radios | native radios, live announcement |
| Airport control | native select | native select | custom listbox |
| Icons hidden from assistive technology | 25 of 108 | 104 of 104 | 74 of 103 |
| Placeholder `#` links | 48 of 64 | 0 | 0 |
| Reduced motion | system and toggle | system and toggle | system and toggle |
| Search in the demo | note only | filters board | inline results |
| Self-hosted fonts | Fraunces, Hanken Grotesk | Bricolage Grotesque, Hanken Grotesk, Geist Mono | Hanken Grotesk, Geist Mono |

B's two automated contrast flags were false positives: dark text on the yellow striped demo banner, which the checker reads through to the board behind it.
