# Accessibility audit (WCAG 2.2 A and AA)

Evaluator role: accessibility specialist (manual and automated audit, beyond the axe scans in the e2e suite).
Date: 18 November 2026. Build: the existing production build in `.next`, served with `next start -p 3102`
(Next.js 16.4.6). Machine-readable findings: [`accessibility.json`](./accessibility.json).

## Verdict

The prototype is well above the norm for airport websites. All nine critical journeys can be completed
with the keyboard alone, every dialog moves focus in, contains it and returns it on Escape, reduced motion
is honoured from both the OS and the in-app setting, the live board refreshes without moving focus or
chattering, and axe reports no contrast failure in light, dark, both high-contrast modes or at 125% text.

It does **not** yet conform to WCAG 2.2 AA. We found **8 failing success criteria** (1.3.1, 1.4.11, 2.1.4,
2.2.2, 2.4.3, 2.4.7, 2.5.3, 3.1.2) behind **15 findings: 0 critical, 4 high, 4 medium, 7 low**. The four
high findings are small code changes:

| ID | Finding | WCAG |
|---|---|---|
| accessibility-01 | After a client-side navigation from a link in the page, focus falls to `<body>` and the next Tab jumps to the **footer** | 2.4.3 |
| accessibility-02 | Header airport switcher shows "KUL" but is named "Change airport. Currently KLIA" (speech users cannot say what they see) | 2.5.3 |
| accessibility-03 | Delayed flights on the board read "17:25 18:20" with no word for which is scheduled and which is the new time (meaning carried by strikethrough only) | 1.3.1 |
| accessibility-04 | The active result in the search palette is marked only by a tint: 1.22:1 in light, **1.03:1 in dark** | 1.4.11, 2.4.7 |

## 1. Method

**Measured** means a script or tool produced the number. **Judgement** means an expert reading of what we
saw. Everything below says which.

| Area | How |
|---|---|
| Keyboard walkthroughs | Playwright (Chromium 1.63) driving only `Tab`, `Shift+Tab`, `Enter`, `Space`, arrow keys and `Escape`. After each key press a script recorded the focused element, its accessible name, its box, its outline or ring, and whether three sample points (centre and two corners) are covered by another element (`elementFromPoint`). Desktop 1280 x 800, Pixel 7 (412 x 839) and 320 x 256. |
| Focus visibility | Computed outline colour against the adjacent background (outside) and the element's own fill (inside), plus 5 composite screenshots of focus states (home, dialogs, map, rings, forced colours). |
| Focus not obscured (2.4.11) | 6 long pages x 140 stops (70 `Tab` forward, 70 `Shift+Tab` back from the footer) at three viewports, with reduced motion and a 120 ms settle per stop. Counted stops fully covered by the sticky header or the bottom bar. |
| Screen-reader semantics | Playwright `ariaSnapshot()` of the Chromium accessibility tree (names, roles, states, headings, landmarks, tables, live regions), and `MutationObserver` recorders on every `role=status`, `role=alert`, `role=log` and `aria-live` node to count what would be announced. No physical screen reader (NVDA, JAWS, VoiceOver, TalkBack) was available in the container: those results are inferred from the accessibility tree. |
| Reflow and resizing | 13 key pages at 320 x 256 (1280 x 1024 at 400%), at 1280 x 800 with root font size 200% (text-only zoom), with the in-app 125% text size at 1280 and at 320, with the WCAG 1.4.12 text-spacing bookmarklet values injected as CSS, and in landscape (Pixel 7 landscape). A script listed page-level horizontal overflow and elements whose content is clipped by `overflow: hidden`. |
| Contrast | axe-core `color-contrast` on 8 pages in 4 extra modes (dark, light high contrast, dark high contrast, 125%), plus a canvas-based contrast probe (handles `oklch` and alpha) on 10 dense components in light, dark, light HC and dark HC. Forced colours emulated (`forcedColors: 'active'`). |
| Motion and timing | `document.getAnimations()` and computed `transition-duration` under no preference, OS `prefers-reduced-motion: reduce`, and the in-app setting. An 80-second recording of the live board with a flight link focused. |
| Pointer and target size | Pixel 7 scan of 11 pages: every interactive element under 24 x 24 px, then the WCAG 2.5.8 spacing test (24 px circle). Map drag alternatives inspected by keyboard and in the source. |
| Content | Flesch-Kincaid grade and Flesch reading ease of six guides (main text only), link-name scan of 14 pages, form error messages triggered on purpose. |
| axe | Already passing in the suite (41 scan points). We re-ran it only for the extra modes above, with all `wcag2a/2aa/21a/21aa/22aa` tags. |

Severity follows the brief: critical blocks a critical task or is unsafe; high is major friction or a
WCAG AA failure with real user impact; medium and low are lesser. Where a WCAG failure has clearly limited
impact we rate it **medium and say why** rather than inflate it.

Scripts are in the evaluator scratchpad (`qa-scratch/accessibility/*.js`, not committed). Every check can be
re-run against `next start` with Playwright.

## 2. WCAG 2.2 success criteria (Level A and AA)

Status: **Pass**, **Fail**, **N/A** (nothing on the site the criterion applies to), **Not tested**.
4.1.1 Parsing is obsolete in WCAG 2.2 and is not listed. Totals: **36 pass, 8 fail, 11 not applicable, 0 not tested**
(55 criteria).

| SC | Level | Status | Method | Evidence |
|---|---|---|---|---|
| 1.1.1 Non-text Content | A | Pass | axe (5 modes), a11y tree, map review | No image, SVG or `role=img` violations. The map SVG is `aria-hidden`; every place on it is a named button ("Gates H (international). Gates. Gates: Contact Pier and Satellite."). Status chip icons sit next to text. |
| 1.2.1 Audio-only and Video-only | A | N/A | source grep | No `<audio>`, `<video>` or `<iframe>` in `src/`. |
| 1.2.2 Captions (Prerecorded) | A | N/A | as above | No media. |
| 1.2.3 Audio Description or Media Alternative | A | N/A | as above | No media. |
| 1.2.4 Captions (Live) | AA | N/A | as above | No media. |
| 1.2.5 Audio Description (Prerecorded) | AA | N/A | as above | No media. |
| 1.3.1 Info and Relationships | A | **Fail** | a11y tree | Board cell for a delayed flight is `<s>17:25</s> <span>18:20</span>`, exposed as "17:25 18:20" with no "scheduled" or "estimated" word (accessibility-03). Minor: on `/kul/transport` an `h3` precedes its section's `h2` (accessibility-10). Otherwise strong: board table has a caption and `th scope=col`, radio groups in `fieldset`/`legend`, flight facts in a `dl`, landmarks named. |
| 1.3.2 Meaningful Sequence | A | Pass | tab walks, judgement | DOM order follows the visual order on all walked pages; side panels come after the content they accompany. |
| 1.3.3 Sensory Characteristics | A | Pass | judgement | Instructions name keys and controls ("Arrow keys move the map, plus and minus zoom, zero resets the view"), not shapes or positions. |
| 1.3.4 Orientation | AA | Pass | Pixel 7 landscape (863 x 360) | Three pages render with 0 px overflow; no orientation lock in CSS or the web manifest. |
| 1.3.5 Identify Input Purpose | AA | N/A | form inventory, grep | No field collects the user's own data (no name, email, phone or address inputs). |
| 1.4.1 Use of Color | A | Pass | contrast probe, forced colours | Flight statuses always have text and an icon. Inline links are the body-text colour but underlined. In forced colours, pressed filter chips gain a check icon and Highlight fill. |
| 1.4.2 Audio Control | A | N/A | | No audio. |
| 1.4.3 Contrast (Minimum) | AA | Pass | axe x 5 modes, probe | 0 `color-contrast` violations on 8 pages in light, dark, light HC, dark HC and 125%. Lowest measured text: placeholder 6.12:1 (light), muted "On this page" 5.72:1 (12 px, light). See section 5. |
| 1.4.4 Resize Text | AA | Pass | root font 200% on 13 pages | 11 of 13 pages clean. Home network cards clip the airport-code badge and "International" at the card edge (duplicated information; see accessibility-08); the map page scrolls 53 px sideways because of a decorative SVG path. |
| 1.4.5 Images of Text | AA | Pass | review | Only the wordmark (a logo, exempt). |
| 1.4.10 Reflow | AA | Pass | 320 x 256 on 13 pages | 0 px horizontal overflow on all 13. Home network cards clip the code badge by 8 to 12 px (still legible). Sticky header (68 px) plus bottom bar (57 px) take 49% of a 256 px viewport (accessibility-09). |
| 1.4.11 Non-text Contrast | AA | **Fail** | probe, screenshots | Search palette active option: tint only, 1.22:1 light, 1.03:1 dark (accessibility-04). Dark and dark-HC focus ring on the yellow demo banner: 1.16:1 and 1.09:1 (accessibility-07). Passing: input and chip borders 3.7:1 (light) and 4.97:1 (dark), other focus rings 5.9:1 to 18.4:1. |
| 1.4.12 Text Spacing | AA | Pass | injected CSS, 13 pages at 1280 and 320 | No text lost. Same home-card badge clipping at 320 as 1.4.10. |
| 1.4.13 Content on Hover or Focus | AA | Pass | scripted hover and focus | Header tooltips: pointer can move onto the tooltip and it stays; `Escape` dismisses it without moving focus; it persists until dismissed or blurred. |
| 2.1.1 Keyboard | A | Pass | 9 journeys, keyboard only | Every journey completed (section 3). The map pans with arrow keys and zooms with plus and minus while a place has focus. |
| 2.1.2 No Keyboard Trap | A | Pass | dialog tests | Five dialogs (display settings, airport chooser, search, concierge, phone menu) contain focus by design and release it on `Escape` or Close. The map's roving focus exits with `Tab`. |
| 2.1.4 Character Key Shortcuts | A | **Fail** | scripted key press, source | `/` opens the search dialog from anywhere outside a text field; there is no setting to turn it off or remap it (accessibility-05). |
| 2.2.1 Timing Adjustable | A | N/A | review | No time limits: no session expiry, no timed forms; the concierge conversation lives in the tab. |
| 2.2.2 Pause, Stop, Hide | A | **Fail** | 80 s recording | The board auto-updates every 30 s (rows reorder and disappear: 63 to 61 rows during the test) and offers no pause or frequency control (accessibility-06). No moving or blinking content: 0 running animations on any page. |
| 2.3.1 Three Flashes | A | Pass | `getAnimations()` | Nothing animates continuously; nothing flashes. |
| 2.4.1 Bypass Blocks | A | Pass | keyboard | Skip link is the first stop; it focuses `main` (`tabindex=-1`) and the next `Tab` lands inside main. The map adds "Skip to the list of places". |
| 2.4.2 Page Titled | A | Pass | 23 pages | Unique, specific titles ("MH 2628 to Singapore: KLIA \| Malaysia Airports"); Malay pages have Malay titles. |
| 2.4.3 Focus Order | A | **Fail** | keyboard after client navigation | Following a link inside `main` leaves focus on `<body>`; the next `Tab` goes to the footer logo and scrolls the page to the bottom (accessibility-01). Within pages and dialogs the order is logical. |
| 2.4.4 Link Purpose (In Context) | A | Pass | link-name scan of 14 pages | No generic names in the accessibility tree: "More details: Prayer rooms (surau)", "View flight MH 789, Kuching", "(opens in a new tab)" on external links. |
| 2.4.5 Multiple Ways | AA | Pass | review | Main navigation, search palette, `/search`, airport directory, breadcrumbs, footer. |
| 2.4.6 Headings and Labels | AA | Pass | heading scan of 23 pages | Exactly one `h1` per page, no skipped levels, no empty headings; labels are descriptive. |
| 2.4.7 Focus Visible | AA | **Fail** | outline probe, screenshots | In dark theme the palette's active option (the virtual focus) is effectively invisible (accessibility-04). Every other stop in about 700 walked had a visible ring, including visually hidden radios (ring on the label) and switches (ring on the track). The palette text field relies on the caret (accessibility-11). |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Pass | 2,520 stops at 3 viewports | 0 stops fully hidden by the sticky header or bottom bar (`scroll-padding-top: 84px`, `scroll-padding-bottom: 88px` on small screens). |
| 2.5.1 Pointer Gestures | A | Pass | map review | Pan and zoom have single-tap buttons; no path or multipoint gesture is required. |
| 2.5.2 Pointer Cancellation | A | Pass | source review | Actions fire on `click`; `pointerdown` only starts a map drag (`src/components/map/map-canvas.tsx:245`). |
| 2.5.3 Label in Name | A | **Fail** | axe `label-content-name-mismatch`, a11y tree | Header airport switcher (accessibility-02), on every airport-scoped page in every theme. |
| 2.5.4 Motion Actuation | A | N/A | grep | No device-motion or orientation handlers. |
| 2.5.7 Dragging Movements | AA | Pass | keyboard, a11y tree | "Move the map left/up/down/right", "Zoom in/out" and "Reset view" buttons; each place also has "Show on map" and "Route here" buttons. |
| 2.5.8 Target Size (Minimum) | AA | Pass | Pixel 7 scan of 11 pages | Undersized targets are board flight links (about 21 px tall, with 0 spacing conflicts measured, so the spacing exception applies) and inline links. The 6 apparent conflicts were links inside closed `<details>` (not rendered). |
| 3.1.1 Language of Page | A | Pass | DOM | `lang="en"` on `/en/*`, `lang="ms"` on `/ms/*`, switched on language change. |
| 3.1.2 Language of Parts | AA | **Fail** (low impact) | text scan | English pages mark Malay correctly ("Selamat datang", "Bahasa Malaysia"). Malay pages show English source titles without `lang="en"` (accessibility-12). |
| 3.2.1 On Focus | A | Pass | about 700 stops | No navigation or context change on focus. |
| 3.2.2 On Input | A | Pass | transport, transit, shop, parking | Changing a select or radio updates results in place and the URL query; focus stays on the control. |
| 3.2.3 Consistent Navigation | AA | Pass | 7 pages x 2 viewports | Header, nav and footer in the same order everywhere. |
| 3.2.4 Consistent Identification | AA | Pass | judgement | Search, My journey and concierge use the same icon and name on every page. |
| 3.2.6 Consistent Help | A | Pass | 7 pages x 2 viewports | Help link, concierge button, footer "Help centre" and phone number appear in the same relative order on every page (in the Menu dialog on phones). |
| 3.3.1 Error Identification | A | Pass | triggered errors | Parking: departure before arrival gives "Your departure must be after your arrival." in a status region, with `aria-invalid="true"` and `aria-describedby` on the field. "Where I parked" with no fields: "Fill in at least one field to save a note." |
| 3.3.2 Labels or Instructions | A | Pass | a11y tree | All inputs labelled; optional fields say "(Optional)"; formats come from native date and time inputs. |
| 3.3.3 Error Suggestion | AA | Pass | as 3.3.1 | Messages say what to change. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | N/A | review | No submissions with legal or financial effect; saved data stays on the device and can be cleared. |
| 3.3.7 Redundant Entry | A | Pass | journeys | The chosen airport and saved flight carry across pages; no process asks for the same information twice. |
| 3.3.8 Accessible Authentication (Minimum) | AA | N/A | review | No sign-in anywhere. |
| 4.1.2 Name, Role, Value | A | Pass | a11y tree, axe | Switches expose `role=switch` and `aria-checked`; filter chips `aria-pressed`; search uses `combobox` with `aria-expanded` and `aria-activedescendant`; all dialogs are named. |
| 4.1.3 Status Messages | AA | Pass | live-region recorder | Polite and short: "3 of 8 places", "1 airport matches", "2 options for Bandar Tasik Selatan, by shortest time.", "Steps updated for Terminal 1 to Terminal 2, One booking, 2 h.", "At most RM 32", concierge "Looking that up." then "Answer: …". The conversation log and board timestamp are `aria-live="off"`. Typing 7 characters gave 5 announcements (debounced). |

## 3. Journey walkthrough notes (keyboard only, desktop 1280 x 800 unless stated)

**1. Home flight search to a flight to its map route.** Tab 1 is the skip link (visible, ringed). Tabs 2 to 17
are the utility bar and header: prototype notice, Corporate, EN, BM, Display settings, logo, six nav links,
Choose airport, Search, My journey, Concierge. Tab 18 is the airport field, 19 the Departures/Arrivals
segmented control (visually hidden radio, ring drawn on its label), 20 the search field (ring on the wrapper).
Typing "MH 2628" filters results inline; the polite status went "40 flights found" to "1 flight found" (5
announcements for 7 keystrokes). The result link reads "View flight MH 2628, Singapore". `Enter` opened the
flight page with the title "MH 2628 to Singapore: KLIA". **Focus was then on `<body>` and the next `Tab` went to
the footer logo, scrolling to the bottom** (accessibility-01). From the flight page, "Find the gate on the map"
opened `/kul/map?t=T1&poi=g-gates-h` with the same focus loss. On the map: search field, nine category
buttons with counts, level radios, keyboard instructions, the map as a named group with roving focus over
place buttons (arrow keys pan, plus zooms, focus stays on the place), "Skip to the list of places" (works),
pan and zoom buttons, then the directions form (From and To selects, step-free switch, swap button).

**2. Choose an airport.** "Choose airport" (`aria-haspopup=dialog`) opens a dialog named "Choose an airport"
with a description; focus goes to the search field. Typing "kuch" announced "1 airport matches"; `ArrowDown`
moved focus into the result buttons. `Escape` closed it and returned focus to the trigger.

**3. Transport planner (`/kul/transport`).** Native select "Going to or from", then a "What matters most?"
radio group. `ArrowDown` on the select and `ArrowRight` on the radios updated results and the URL and
announced "2 options for Bandar Tasik Selatan, by shortest time." Focus stayed on the control. Switching
to Table view gives a captioned table ("Ways to travel between KLIA and Bandar Tasik Selatan, sorted by
Shortest time") with eight `scope=col` headers.

**4. Parking calculator (`/kul/parking`).** Labelled native date and time inputs grouped as "Arrive" and
"Leave", quick-length toggle buttons (`aria-pressed`), and an "Estimate" region whose status reads "At most
RM 32". Typing a departure date before arrival produced an associated, announced error (3.3.1 pass). While
typing a date digit by digit the status alternated between the error and the estimate three times: polite,
not harmful.

**5. Shop and dine filters (`/kul/shop-dine`).** Filter chips are toggle buttons with counts ("Duty free 3");
`Enter` pressed the chip, kept focus on it, updated the URL (`?cat=duty-free`) and announced "3 of 8 places".
Searching "zzzz" announced "0 of 8 places for “zzzz”". Halal and Open-now are switches whose names include their
caveats.

**6. Transit planner (`/kul/transit`).** Five radio groups and a "Time between flights" select inside a form
named "Plan your connection". Each change announced one concise sentence ("Steps updated for Terminal 1 to
Terminal 2, Separate tickets, 2 h 30 min.").

**7. Concierge.** The header button opens a dialog "Concierge" (described "Answers from verified content, with
sources.") with focus on Close, then "Agree and start", "Not now" and the privacy link, contained. On
`/concierge`, after "Agree and start" focus moves to the question field. Asking "Where can I pray at KLIA
Terminal 1?" announced "Looking that up." then "Answer: Published for KLIA Terminal 1: Prayer rooms
(surau)."; the conversation itself is a `role=log` with `aria-live=off`, so the long answer is not read twice.
Answers are structured with headings and links with specific names. Focus stays in the question field, which
the answer pushed below the fold (accessibility-14).

**8. Preferences.** "Display settings" opens "Display and accessibility" with focus on Close. Theme and text
size are radio groups (arrow keys apply immediately; the theme switched to Light on `ArrowRight`), high contrast
and reduce motion are switches (`Space` toggled `data-contrast="more"`). Settings persist in
`localStorage["ma:preferences:v1"]` and are applied before hydration (no flash). `Escape` returns focus to the
trigger. On phones the same controls sit inside the Menu dialog.

**9. Language switch.** "BM: Bahasa Malaysia" (`hreflang=ms`, `lang=ms`) loads `/ms/kul/parking` with
`<html lang="ms">` and the title "Parkir di KLIA". It is a full navigation, so focus starts at the top of the
page as expected.

**Phones (Pixel 7).** 14 stops reach the flight search; the bottom bar (Home, Flights, Search, Journey, Menu,
each 80 x 56) comes last in DOM order. The Menu dialog holds 22 stops, wraps focus, and returns it to Menu on
`Escape`. No stop was fully hidden by the header or bottom bar.

## 4. Screen-reader semantics (from the accessibility tree)

- **Landmarks:** one banner, main navigation ("Main navigation"), `main`, footer with three named navigations,
  and on phones "Quick navigation". Airport pages add "KLIA sections" and "Breadcrumb" navigations. Home
  sections are named regions; the flight search is a `search` landmark.
- **Headings:** 23 pages, one `h1` each, no skipped levels, no empty headings.
- **Board table:** caption "Departures: Next flights across the main airports. Demonstration data.", column
  headers Time, Flight, Destination, Airline, Gate, Status, Save. Status cells read as text ("Departed",
  "Delayed", "Final call"); terminal badges read "Terminal 1". Time-group rows are row headers ("From 16:00,
  1 flight"). The gap: delayed times (accessibility-03).
- **Status chips:** text plus an icon everywhere; colour is never the only signal (also in forced colours).
- **SVG map:** the drawing is `aria-hidden`; a group named "Schematic map: Gates: Contact Pier and Satellite"
  holds place buttons with name, type and level, the selected place is `aria-pressed`, and a details region
  and a written "Directions" region give the same information as the drawing.
- **Live regions:** all polite, short and deduplicated (section 2, 4.1.3). The board's "Updated 17:29" is
  `aria-live=off`, so a 30-second refresh is silent.
- **Language of parts:** "Selamat datang" and "Bahasa Malaysia" are `lang="ms"` on English pages.

## 5. Contrast spot checks (computed, WCAG ratio)

| Component | Light | Dark | Light HC | Dark HC |
|---|---|---|---|---|
| Board secondary text (13 px) on board navy | 8.14 | 8.14 | 12.75 | 12.75 |
| Status chip "Delayed" (14 px, 600) | 7.67 | 7.67 | 9.13 | 9.13 |
| Status chip "Boarding" / "Check-in open" | 8.10 | 8.10 | 10.22 | 10.22 |
| Status chip "Departed" / "Gate closed" | 8.83 | 8.83 | 11.39 | 11.39 |
| Search placeholder (18 px) | 6.12 | 6.69 | 11.26 | 11.68 |
| Muted text `text-ink-3` (12 px, 600) | 5.72 | 7.58 | 10.98 | 12.87 |
| Inline link in body text (underlined) | 8.13 | 11.47 | 13.83 | 15.99 |
| Input and unpressed-chip border (3:1 needed) | 3.70 | 4.97 | 13.83 | 15.99 |
| Disabled "Zoom out" icon (exempt) | 6.12 | 6.69 | 11.26 | 11.68 |
| Map SVG labels (14 to 16 px) | 7.71 | 11.76 | 12.46 | 16.35 |
| Focus ring on page background | 6.36 | 10.19 | 9.23 | n/m |
| Focus ring on yellow demo banner | 4.29 | **1.16** | 5.87 | **1.09** |
| Palette active option vs other options | **1.22** | **1.03** | **1.22** | n/m |

n/m: not measured. The board is always dark, so its values do not change with the theme. **Forced colours**
(emulated, dark scheme): chips keep borders, pressed filters get a check icon and Highlight fill, focus rings
follow the system colour, the board stays legible (screenshot reviewed).

## 6. Reflow, resizing, motion and timing (measured)

| Test | Pages | Result |
|---|---|---|
| 320 x 256 (400% equivalent) | 13 | 0 px horizontal overflow everywhere. Home network cards clip the code badge by 8 to 12 px. Header 68 px plus bottom bar 57 px occupy 125 of 256 px. |
| Text-only zoom 200% at 1280 | 13 | 11 clean; home network cards clip the badge and "International"; map page scrolls 53 px sideways (decorative SVG). |
| In-app 125% at 1280 | 13 | Clean apart from the home chooser button (12 px). |
| In-app 125% at 320 x 640 | 6 | `/kul/transport` scrolls 30 px and `/help` 15 px sideways; code badges on home cards mostly cut off; "Choose airport" label spills out of its button (accessibility-08). |
| Text spacing (1.4.12) at 1280 and 320 | 13 | No text lost; only the home-card badge clipping above. |
| Landscape phone | 3 | No overflow, no orientation lock; bottom bar hidden at 863 px. |
| Reduced motion (OS or in-app) | 3 | Elements with a transition fall from 124 to 287 per page to 0; no running animations in any mode; `scroll-behavior: auto`. |
| Board refresh (80 s, link focused) | 1 | Focus stayed on the same flight link; when two departed rows were removed above it, the page scrolled by 90 px so the link stayed at the same screen position; 1 live-region change (`aria-live=off`). |

## 7. Content

| Page | Words | Words per sentence | FK grade | Reading ease | Sentences over 25 words |
|---|---|---|---|---|---|
| `/guides/departing` | 1,279 | 13.2 | 7.5 | 64 | 7 |
| `/guides/check-in` | 846 | 13.0 | 8.4 | 58 | 5 |
| `/guides/first-time` | 1,150 | 13.2 | 8.6 | 57 | 8 |
| `/guides/reduced-mobility` | 772 | 12.9 | 8.7 | 56 | 3 |
| `/accessibility` | 1,215 | 11.8 | 9.3 | 49 | 6 |
| `/guides/immigration-customs` | 1,793 | 14.3 | **11.3** | **40** | **20** |

Measured with a syllable heuristic on `main` text (headings, paragraphs, list items; navigation, tables and
collapsed sources excluded). Badge text such as "KUL Official" merges into adjacent sentences, which slightly
inflates sentence length. Judgement: the copy is plain, direct and in the active voice; immigration and
customs needs the most work (accessibility-13). Link purpose is clear (2.4.4). Error messages are specific and
say how to fix the problem.

## 8. Findings

### accessibility-01 (high, 2.4.3): focus falls to the footer after following a link inside the page
- **URL:** any client-side navigation from a link inside `main`, e.g. `/en` board link "View flight MH 2628,
  Singapore" to `/en/kul/flights/mh2628-20261118-d`; that page's "Find the gate on the map" to `/en/kul/map`;
  `/en/guides` "Open My journey" to `/en/journey`.
- **Steps:** focus the link, press `Enter`, wait, press `Tab`.
- **Actual:** after navigation `document.activeElement` is `<body>`; the first `Tab` focuses the **footer**
  "Malaysia Airports home" link and scrolls to `scrollY=997`. Links in persistent navigation keep focus on
  the link instead (expected). Integration notes (section 6, issue 2) describe this as "focus stays at the
  previous position"; it is worse than that for in-content links.
- **Expected:** focus moves to the new page's `h1` (or `main`) on pathname change, so `Tab` continues from the
  top of the new content.
- **Fix:** a shell effect on pathname change (not on query-only changes) that focuses `main h1` with
  `tabIndex=-1`; keep the route announcer; add an e2e test.

### accessibility-02 (high, 2.5.3): airport switcher's visible label is not in its accessible name
- **URL:** all airport-scoped pages (`/en/kul/flights`, `/en/kul/map`, `/en/kul/shop-dine`,
  `/en/guides/departing`, `/en/kul/parking`, `/en/concierge`), every theme.
- **Actual:** visible text "KUL" (or "KUL T1 Terminal 1"); `aria-label="Change airport. Currently KLIA
  Terminal 1"`. axe `label-content-name-mismatch` flags it on every such page (the suite does not run axe's
  experimental rules). A speech-input user who says "click KUL" gets nothing.
- **Fix:** start the name with the visible text, e.g. "KUL, KLIA Terminal 1: change airport", or drop the
  `aria-label` and add visually hidden text after the visible code.
- **Files:** `src/components/shell/airport-switcher.tsx:97`, `src/lib/i18n/en.ts:722` (and `ms.ts`).

### accessibility-03 (high, 1.3.1): delayed and cancelled times rely on strikethrough
- **URL:** `/en/kul/flights` (desktop table and phone list), home board.
- **Actual:** `<s>17:25</s> <span>18:20</span>` reads "17:25 18:20" (accessibility tree: cell "17:25 19:10").
  Most screen readers do not announce `<s>`, so a blind traveller cannot tell the old time from the new one;
  it can be heard as a range. Cancelled flights use `<s>` alone.
- **Expected:** visually hidden words: "Scheduled 17:25, now 18:20" and "Cancelled, was 17:25". The flight page
  already does this right with a `dl` ("Scheduled", "Estimated").
- **Files:** `src/components/flights/flight-row.tsx:83-89` and `:136-140`,
  `src/components/flights/saved-flight-card.tsx:103`.

### accessibility-04 (high, 1.4.11 and 2.4.7): search palette's active option is nearly invisible
- **URL:** any page; `Ctrl+K` or `/`, type "KLIA", press `ArrowDown`.
- **Actual:** the active option (`aria-activedescendant`, `aria-selected=true`) is marked only by
  `bg-primary-soft`: #e7e8f4 against #ffffff = **1.22:1** in light and light HC, #20245a against #1f2350 =
  **1.03:1** in dark. No outline, bar or icon. Keyboard users in dark mode cannot see which result `Enter` opens.
- **Expected:** at least 3:1 against neighbouring options, e.g. a 2 px focus-colour outline or a 4 px left bar
  plus the tint.
- **File:** `src/components/search/command-palette.tsx:43`.

### accessibility-05 (medium, 2.1.4): the "/" shortcut cannot be turned off
- **Actual:** with focus on any non-editable element, `/` opens the search dialog
  (`src/components/shell/global-overlays.tsx:41`). It is correctly ignored inside text fields, but Display
  settings has no option to turn it off or remap it. Level A failure; rated medium because the effect (a
  dismissible dialog) is easy to undo.
- **Fix:** add "Keyboard shortcuts" (on by default) to Display settings, or keep only `Ctrl/Cmd+K`.

### accessibility-06 (medium, 2.2.2): the live board updates every 30 s with no pause
- **URL:** `/en/kul/flights`, home board, flight pages.
- **Actual:** rows change, reorder and disappear (63 to 61 rows in 80 s) while the page is read. Done well:
  focus and screen position are preserved and nothing is announced. But no control pauses updates or sets
  the frequency. Rated medium because the updates are silent and keep focus in place.
- **Fix:** a "Pause live updates" toggle next to "Refreshes every 30 seconds" (also pause while a row has
  focus or hover), and honour reduced motion by not removing rows above the viewport.
- **Files:** `src/lib/providers/demo-flights.ts:44`, `src/lib/hooks/use-flight-provider.ts:17`.

### accessibility-07 (medium, 1.4.11): focus ring disappears on the yellow demo banner in dark themes
- **URL:** `/en/kul/flights` (and every page with the demo-data banner), dark and dark-HC themes; tab to
  "About this prototype" inside the banner.
- **Actual:** ring #ff9fdc on banner #ffc233 = **1.16:1** (dark), #ffc2e9 on #ffc233 = **1.09:1** (dark HC).
  Light is 4.29:1 and light HC 5.87:1. Rated medium: one link per page.
- **Fix:** on the banner, use the light-theme focus colour (`--color-focus: #a6157f`) or a dark ring.
- **Files:** `src/components/common/demo-data-banner.tsx`, `src/app/globals.css:331`, `:391` and `:510`.

### accessibility-08 (medium): large text sizes clip content on narrow screens
- **URL:** `/en` (network cards, header), `/en/kul/transport`, `/en/help`.
- **Actual:** at 320 x 640 with the in-app 125% text size the IATA badges on home network cards are mostly cut
  off (`overflow: hidden`, content 34 to 55 px wider than the 128 px card), the header "Choose airport" label
  spills out of its button, `/kul/transport` scrolls 30 px sideways and `/help` 15 px (a paragraph). At default
  text the badges are already clipped by 8 to 12 px at 320 px, and at 200% text-only zoom on desktop.
  Not a strict WCAG failure at the default test conditions, but the 125% setting exists for low-vision users,
  who often also zoom.
- **Fix:** let the card title and badge wrap (`flex-wrap`, `min-width: 0`, no `overflow: hidden` on text), allow
  the header label to wrap or shorten to an icon with a name, and `overflow-wrap: anywhere` on long strings.
- **Files:** `src/components/home/home-sections.tsx`, `src/components/shell/airport-switcher.tsx`.

### accessibility-09 (low, 1.4.10 advisory): sticky bars take half the screen at 400% zoom
At 320 x 256 the sticky header (68 px) and fixed bottom bar (57 px) cover 125 of 256 px, leaving 131 px for
content. Not a failure (no content is lost and focus is never hidden), but reading is cramped. Suggest
un-sticking the header (or hiding it on scroll down) when the viewport is under about 400 px tall.

### accessibility-10 (low, 1.3.1 advisory): heading order on the transport page
On `/en/kul/transport` the card heading `h3` "Driving yourself" comes before its section's `h2` "Not covered
here yet" in the DOM (same row visually). Screen-reader heading navigation lists the `h3` under the previous
section. Put the `h2` first in source order. File: `src/app/[lang]/[airport]/transport/page.tsx`.

### accessibility-11 (low, 2.4.7 advisory): search palette field has no focus ring
The palette's combobox has `outline: none` and no wrapper ring; only the caret shows focus (the board and home
search fields do show a ring on their wrapper). When focus returns to the field with `Shift+Tab` from Close it
is easy to miss. File: `src/components/search/command-palette.tsx`.

### accessibility-12 (low, 3.1.2): English source titles on Malay pages are not marked
On `/ms/kul/parking` and `/ms/guides/departing`, source titles such as "RM2,084 to park at KLIA: if you are
going to park long term…" are read with Malay pronunciation (no `lang="en"`). Add `lang` from the source's
language (default `en`) in `src/components/common/source-note.tsx:43-47`.

### accessibility-13 (low, content): immigration and customs guide is harder to read
`/en/guides/immigration-customs`: Flesch-Kincaid grade 11.3, reading ease 40, 20 sentences over 25 words,
against grade 7.5 to 8.7 for the other guides. Split long sentences, lead with the action, and move dated
reporting into the source notes. (3.1.5 is AAA; advisory.) File: `src/content/guides.ts`.

### accessibility-14 (low): concierge field drops below the fold after an answer
On `/en/concierge` (1280 x 800) the field moved from y=534 to y=1027 after one answer, outside the viewport,
while it kept focus. A sighted keyboard user types the next question into an invisible field. Keep the
composer in view (sticky composer or `scrollIntoView({block: 'nearest'})` after rendering an answer).

### accessibility-15 (low): board changes are never announced, even for a saved flight
The build spec asks for polite board-update announcements. The timestamp is `aria-live=off` and nothing else
announces, so a screen-reader user watching their own flight learns of a gate change only by re-reading. That is
better than chatter, but consider one polite announcement when a saved flight's status, gate or time changes.

## 9. Limits of this audit

- No physical screen reader or speech-input software was used; announcements are inferred from the
  Chromium accessibility tree and live-region recordings. A pass with NVDA plus Chrome, VoiceOver on iOS and
  TalkBack is still needed before launch.
- Text-only zoom was simulated by setting the root font size to 200%; browser page zoom was simulated by the
  320 px viewport.
- Forced colours were emulated in Chromium, not tested on Windows High Contrast themes.
- Content is the demonstration build: the board data changes over time, so row counts differ between runs.
