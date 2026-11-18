# Independent panel review: design director and frequent business traveller

Panel members, writing in turn:

- **(A) Design director.** Judges visual and interaction craft: typography, spacing, hierarchy, motion, consistency,
  and whether anything feels templated.
- **(B) Frequent international business traveller.** Flies through KLIA monthly and uses Changi, Heathrow and Hong
  Kong regularly. Cares about speed, density, flight status, connections, lounges, parking and Fast Track, and has no
  patience for friction.

Date: 18 November 2026. Build: the existing production build in `.next`, served with `next start -p 3107`. Nothing
under `src/` or the config was changed.

**How to read this.** Results marked **[measured]** come from Playwright, axe-core or Lighthouse in this session.
Results marked **[judgement]** are the panel's expert opinion. Prototype-only conditions are marked **[prototype]**:
demonstration flight data, a schematic map and partial content. As the brief requires, design and product are judged
as if production data were connected, but `info` and `commerce` are scored on what is actually there.

---

## Verdict

**(A)** This is the most considered airport website either of us has used. It has a real design system (cream, navy
and amber; display serif, sans and mono), a dark mode built with care, and a Malay version that fits its layouts. The
first screen answers the main task without a hero photograph, carousel or cookie wall. It is not yet at the level of
the best consumer products. Too many labels compete for attention (78 upper-case micro-labels on the home page,
provenance chips on every card), the phone layout puts about 440 px of airport chrome above every answer, and there
are visible polish defects: clipped tab strips, a floating button over a tile label, and a map that still looks like a
wireframe.

**(B)** Typing "MH2630" on the home page gave me terminal, gate and status in **one interaction, on the first phone
screen** [measured]. No benchmark I use does that. After that the product lets me down on the other four things I do
every trip:

- **Following the flight.** Alerts work only while the page is open, and there are none on iPhone Safari.
- **Parking.** No price for the Terminal 1 car park.
- **Lounges.** No price or access rules.
- **Fast Track.** Nowhere on the site.

It also forgets my saved flight when I go back to the home page, and its journey timeline told me "Now: check in"
after check-in had closed.

**Rubric total: 71.5%** [judgement, medium confidence]. MAHB today scores 42.5% and Heathrow, the best benchmark,
79.0% on the same rubric. The redesign is a large step forward and leads the world on flight discovery and on showing
where its facts come from. It does not yet set a new global benchmark.

---

## 1. Scores (benchmark rubric)

Scale: 1 to 5 in half points. Anchors: 3 is a competent major airport, 4 is strong with evidence, 5 is a best-in-class
reference with first-hand evidence. No dimension earns a 5.

| Key | Weight | Score | Confidence | Best benchmark | MAHB today | Basis |
|---|---|---|---|---|---|---|
| ui | 10% | **4.0** | Medium | 4.0 | 2.5 | Coherent, distinctive system; light and dark; English and Malay at 360 to 1440 px. Held back by label noise, chip overload, clipped tab strips, a floating button over a tile, triple repetition of the route on the flight page, and a schematic map |
| ux | 20% | **4.0** | Medium | 4.0 | 2.0 | Flight status takes 1 interaction (target 2). Friction elsewhere: the home search answers flights only; the home ignores a saved flight; answers sit below the first phone screen; no Fast Track; the self-transfer verdict appears 2,943 px down |
| info | 15% | **3.0** | High | 4.5 | 2.0 | Scored on what exists. Sourcing and dating are exemplary, but completeness is low: 22 "not published" or "not verified" mentions on Transport and 17 on Parking; no Terminal 1 car-park rate; no lounge prices or access rules; no outlet hours. Two logic errors give wrong guidance (findings 01, 08) |
| flight | 15% | **4.0** | Medium | 4.5 | 2.5 | One search across the network; terminal resolved; "Updated hh:mm"; save, share and calendar with no account; journey timeline; codeshares found by search. Short of 4.5 because of the timeline's wrong "Now" step, alerts that only work with the page open (none on iOS, no e-mail), codeshare URLs returning "not found", and boards that open on departed flights |
| mobile | 10% | **3.5** | High | 4.0 | 2.0 | Tab bar, central search, no sideways scroll at 360 px, 0.69 to 0.78 MB pages. But airport chrome is about 440 px tall, the gate on the flight page is at 1,306 px and alerts at 5,321 px, mobile TBT is 0.66 to 1.31 s, and iOS has no alerts |
| nav | 10% | **4.0** | Medium | 4.0 | 2.0 | Site search returns entities first and understands Malay ("tempat letak kereta"). Zero axe violations on the integration tag set, but a Level A Label in Name failure appears on every page once an airport is chosen. The home search dead-ends on topics, and focus is not moved after client-side navigation |
| ai | 10% | **3.0** | Medium | 4.0 | 2.0 | The concierge is deterministic and cites sources. In 8 test questions it missed direct answers to fare, Fast Track, airline terminal and nearest lounge; Fast Track returned the hidden-disability programme. Personalisation is device-only, and the home does not use the saved flight |
| commerce | 5% | **2.0** | High | 4.5 | 2.5 | Scored on what exists: a parking link to the official site (no dates passed), a partial shop and dine list (8 KLIA outlets), no Fast Track, no lounge or parking purchase, no basket. This is below MAHB today, which at least sells Fast Track on another domain |
| perf | 5% | **3.5** | Medium | 3.5 | 1.5 | Lightest pages in the benchmark set (0.69 to 0.78 MB, 45 to 56 requests), CLS about 0, no third-party hosts. But mobile Lighthouse TBT is 656 to 1,308 ms and flight-page LCP 4.4 s (one run each, shared machine) |
| **Weighted** | | **71.5%** | Medium | 79.0% (Heathrow); 83.0% (best of each dimension) | 42.5% | |

Arithmetic: (4.0×10 + 4.0×20 + 3.0×15 + 4.0×15 + 3.5×10 + 4.0×10 + 3.0×10 + 2.0×5 + 3.5×5) / 5 = 357.5 / 5 =
71.5%.

**What would move the total** [judgement]. With MAHB's own data connected (info 4.5, commerce 3.0) the same build
would score about **77%**. Fixing findings 01 to 07 as well (ux 4.5, flight 4.5, mobile 4.0, ai 3.5) gives about
**83 to 84%**: level with the best-of-each-dimension composite, still short of the strategy's 90.5% target. Commerce
and AI are the gap that remains.

---

## 2. Method

**Pages: 27 distinct pages, 50 or more page-and-condition views** [measured].

| Condition | Pages |
|---|---|
| Desktop 1440 × 900, English, light | `/en`, `/en/kul`, `/en/kul/flights`, flight pages `mh2630-20261118-d` (departure) and `sq145-20261118-a` (arrival), `/en/search?q=MH2630`, `/en/kul/map`, `/facilities`, `/transport`, `/parking`, `/lounges`, `/shop-dine`, `/transit`, `/en/journey`, `/en/concierge`, `/en/help`, `/en/accessibility`, `/en/guides`, `/en/notices`, `/en/airports`, `/en/corporate`, `/en/pen` |
| Phone 390 × 664, iPhone 14 profile | All of the above, plus `/ms`, `/ms/kul/flights`, `/ms/kul/transport`, `/ms/kul/parking` |
| Desktop 1280 × 800 | `/en` (light), `/en/kul/flights` (light), flight page (dark) |
| Desktop 1440, dark, Malay | `/ms`, `/ms/kul/flights/mh2630…`, `/ms/kul/parking`, `/ms/concierge` and others (axe run) |
| Phone 360 × 780 | `/en` (dark), flight page (dark, and Malay light), `/en/kul/parking` |
| Phone 390, dark, Malay | `/ms/kul/transport`, `/ms/corporate` |

**Tools.**

- The capture helper: screenshots, page structure, axe and timings for 26 pages, desktop and mobile.
- Custom Playwright scripts:
  - five timed tasks on phone and desktop;
  - element positions;
  - axe with `wcag21a` added;
  - concierge API questions;
  - a saved-flight round trip;
  - a stubbed Notification API, and one with the API removed to act like iOS Safari.
- `lh.js`: Lighthouse, mobile, one run on each of four pages.
- Benchmark screenshots from `docs/research/screenshots/`, compared side by side in contact sheets.

**Time of test.** Between 18:38 and 19:00 Malaysia time on 18 November 2026. Demonstration flights move with the
clock, so statuses differ between runs.

**Limitations.**

- Each Lighthouse figure is a single lab run on a 4-core container shared with other evaluators.
- Headless Chromium reports notifications as blocked even when granted. The alert toggle was therefore checked with a
  stubbed API.
- Benchmark comparisons rest on this project's earlier captures and the benchmark report, not on new live visits.
- "Estimated human time" is a keystroke-level judgement, not a user test.

**Evidence images** (contact sheets saved next to this file, in `docs/qa/panel/ux-frequent/`):

| File | What it shows |
|---|---|
| `01-home-phone-vs-changi-heathrow-hkia.jpg` | Phone first screen against Changi, Heathrow and Hong Kong |
| `02-board-phone-vs-heathrow-hkia-changi.jpg` | KLIA board on a phone against Heathrow (error), Hong Kong and Changi (cookie wall, "Unable to load") |
| `03-flight-page-phone-light-dark-malay.jpg` | Flight page: 390 px light, 360 px dark, 360 px Malay |
| `04-home-desktop-vs-changi-hamad.jpg` | 1440 px home in English light and Malay dark, against Changi and Hamad |
| `05-flight-dark-and-board-1280.jpg` | 1280 px flight page in dark mode and the KLIA board |
| `06-parking-transport-lounges-phone.jpg` | Phone task pages: parking, transport (Malay, dark), lounges |
| `07-home-1280-360dark-returning.jpg` | 1280 px home, 360 px dark home, and a returning visitor's home with a saved flight |

---

## 3. The ten questions

### Q1. Is this genuinely easier to use than Changi?

**(B)** For finding things out, yes.

- On Changi's phone site the first screen is a cookie wall over a hero image, and its flight listing showed "Unable
  to load" in the project's capture (`changi-home-mobile.jpg`, `changi-flights-departures-mobile.jpg`).
- Here, flight status takes one interaction and the answer appears at 450 px, inside the first 664 px screen
  [measured].
- Getting to the city is also easier. The KLIA Ekspres card shows "RM 55 today, until 31 December 2026, changes to
  RM 65 on 1 January 2027". Changi's website has no comparable transport comparison (benchmark report §4.6).

For services, no. Changi lets me buy, collect and earn through iShopChangi and Changi Rewards. Here I cannot buy
Fast Track, a lounge visit or parking, and Fast Track is not mentioned anywhere (finding 04).

**(A)** It is easier mainly because it is calmer: no carousel, no consent overlay, no promotions above the answer.
Changi's typography is stronger as a brand statement. This product's information design is stronger.

**Verdict:** easier for flight and journey information; not yet for anything you would pay for.

### Q2. Is flight discovery faster and clearer than Heathrow?

**(B)** Faster: yes, measured.

- **Coverage.** One field covers 21 demonstration airports and both KLIA terminals. Heathrow's field covers one
  airport.
- **Speed.** The inline result appeared 0.10 to 0.14 s after Enter, with terminal, gate and status in the row.
- **Codeshares.** "QR5700" resolves to MH 2630.
- **Failure.** Heathrow's departures page showed a red error with no last-known data in the project's capture
  (`heathrow-flights-departures-mobile.jpg`).

Clearer: mostly, with three defects Heathrow does not have:

- The timeline's "Now" step contradicted the status: "Now: check in" after check-in closed, and "Now: board" on a
  flight that departed at 07:00 (finding 01).
- On a phone the gate sits at 1,306 px on the flight page (finding 07).
- A shared codeshare URL returns "We could not find this flight" (finding 09).

Heathrow's flight detail also shows security wait times, which this product has no data for [prototype].

**(A)** The flight-status card is the best component in the product: a two-column split on desktop, amber
monospaced times, and struck-through times for changes. Three things weaken it:

- **Route repeated.** The page states the route three times before the card: in the H1, in the lead sentence, and in
  the card header.
- **Flight number in old-style figures.** The H1 sets "MH 2630" in the display serif with old-style figures. A flight
  number needs lining figures you can read at a glance.
- **Board opens in the past.** The board starts 45 minutes back, so it opens on departed flights (finding 10).

### Q3. Is the visual design as refined as the best global consumer products?

**(A)** Not yet. It is at or above the best airport sites (Hamad, Haneda and Changi score 4.0 for ui) and about 80%
of the way to Apple, Airbnb or Stripe polish. What is already at that level:

- A disciplined palette.
- A dark mode with true navy surfaces rather than inverted greys.
- Malay copy that fits without truncation at 1440 px.
- Restraint: nothing moves on its own, and there is no stock photography.

What keeps it from that level [measured]:

- **Label inflation.** The home page has 78 upper-case micro-labels, 86 monospaced text runs and 13 distinct font
  sizes. Transport has 64 upper-case labels and 1,597 words.
- **Chips everywhere.** Provenance chips ("Official instruction", "Estimated guidance", "Suggestion", "Demo") and
  "N sources" toggles appear on nearly every card: 21 source toggles on Facilities.
- **Clipped tab strip.** The airport tabs are cut off at 1440 px and at 1280 px ("Connections anc", content 1,347 px
  in 1,240 px) with no fade or scroll cue (finding 16).
- **Floating button over a tile.** The phone tab bar's search button covers the "Lounges" tile label on the first
  screen (finding 18).
- **Map.** The map is a node diagram with dashed placeholder circles [prototype, but it sets the visual impression].
- **Hero line.** The H1 "Your journey, beautifully connected." is set in an italic display face. It is the only
  marketing line on a page that otherwise answers questions, and it takes the most prominent place.

### Q4. Can passengers complete their most important tasks with minimal friction?

**(B)** Results for my five tasks (section 5):

| Task | Result |
|---|---|
| Flight status | Yes: 1 interaction |
| KLIA Ekspres fare and time | Yes: 2 interactions, but 2.2 phone screens of scrolling |
| Parking price | Partial: a ceiling of "At most RM 96" for the Long Term Car Park; the Terminal 1 car park has no figure |
| Lounge | Partial: location and directory hours, no price or access rules |
| Follow the flight with alerts | Partial: 5 interactions and about 8 phone screens of scrolling; no alerts at all on iPhone Safari |
| Fast Track | Fails (finding 04) |

Returning users lose ground: after I saved MH 2630, the home page still showed a sample flight and a generic board
(finding 02). Only the Journey tab badge "1" knew about it.

**(A)** The friction is mostly layout, not flow. Every airport page on a phone opens with about 440 px of airport
identity, clock, terminal chips, section tabs and breadcrumb before its H1. Measured H1 positions: 440 px on
Transport, Transit and the flight page, and 466 px on Parking at 360 px.

### Q5. Is the information accurate, complete and trustworthy?

**(B)** Trustworthy: more than any airport site I use. Every fare, hour and rule carries a source and a date. The
KLIA Ekspres fare change is dated. Unverified figures are labelled as such instead of guessed.

Accurate: two logic errors would mislead me on the day:

- **Timeline "Now" step** (finding 01). It is wrong between check-in closing and boarding, and again after
  departure.
- **Check-in row** (finding 08). The flight card names Row H, which is Malaysia Airlines' Economy row. Business is
  Row D, which appears only deep in the timeline.

Complete: no [prototype content]. Measured counts of "Not published" or "not verified":

| Page | Count |
|---|---|
| Transport | 22 |
| Facilities | 22 |
| Parking | 17 |
| Lounges | 9 |

Also missing: the Terminal 1 car-park rate, train frequency, lounge access rules and outlet hours. Fast Track content
does not exist at all.

**(A)** Honesty is presented well in a few places (the dated fare chips are excellent), but too often it is shown as
paragraphs. The flight-page timeline opens with a 90-word "What this prototype has not verified at KLIA" block before
the first real step.

### Q6. Is the mobile experience exceptional?

**(A + B)** Good bones, not yet exceptional.

**Strengths** [measured]:

- A bottom tab bar with a central search button.
- No sideways scroll at 360 px or 390 px in either language or theme.
- Pages of 0.69 to 0.78 MB.
- CLS of about 0.

**Weaknesses** [measured]:

- Airport chrome pushes the answer down:

  | Element | Position on a 664 px screen |
  |---|---|
  | Flight-page gate | 1,306 px |
  | Save flight | 1,547 px |
  | Flight alerts | 5,321 px |
  | First board row | 1,173 px |
  | KLIA Ekspres fare | 1,467 px |
  | Parking "3 days" chip | 2,029 px |
  | Transfer verdict | 2,943 px |

- Mobile Lighthouse TBT of 656 to 1,308 ms.
- iPhone Safari cannot receive alerts.
- In Malay at 360 px, the tab-bar labels "Laman utama" and "Penerbangan" run together, and the section tabs open
  scrolled so that the first label is cut mid-word.

Heathrow (4.0) and Changi (4.0, mainly through its app) remain the mobile references.

### Q7. Does it support MAHB's commercial and operational objectives?

**Operational: yes, in large part.**

- A notices framework, with the Aerotrain night closure on the home page.
- Last-updated stamps.
- A self-transfer planner and a greeter view.
- Dated fare changes.
- A sourced content layer that should cut contact-centre load.

One gap: on the KLIA overview the Aerotrain notice sits 2,270 px down on a phone (finding 23).

**Commercial: weak** [measured]. Missing:

- Fast Track.
- Lounge, day-room or parking sales.
- A basket.
- Dates passed to the parking booking site.

Shop and dine lists only 8 KLIA outlets. The design follows "commerce after the answer" well, but it does not even
reserve the right places: Fast Track on a busy departure, the lounge nearest gate G6, and parking against a leave-by
time. Commerce scores 2.0, below MAHB today (2.5).

### Q8. Is it differentiated enough to establish a new international benchmark?

**Differentiated: yes.** No benchmark combines:

1. One flight search across a whole network, with the terminal resolved.
2. Provenance and dates on every changeable fact.
3. Scheduled fare changes shown before they happen.
4. An account-free journey timeline with greeter and transfer views.
5. A self-transfer planner between two terminals.
6. English and Malay at parity, with dark mode.
7. The lightest pages in the set and no third-party requests.

**A new benchmark: not yet.** At 71.5% it sits below Heathrow (79.0%) on the same rubric. The design itself, as
opposed to the data, needs five fixes before it can lead:

- the home page must know my flight;
- the timeline must not contradict the status;
- alerts must work on iOS and by e-mail;
- answers must come first on a phone;
- Fast Track and lounge entry points must exist.

### Q9. The most significant remaining weaknesses, ranked

| Rank | Finding | Severity |
|---|---|---|
| 1 | The journey timeline marks the wrong step as "Now": check-in after it closed, boarding after departure (01) | High |
| 2 | The home page ignores the visitor's saved flight (02) | High |
| 3 | Flight alerts only while the page is open; none on iPhone Safari; no e-mail channel (03) | High |
| 4 | Fast Track absent from the product; concierge answers with the hidden-disability programme (04) | High |
| 5 | The home's main search is flights-only and dead-ends on "parking", "lounge" and "fast track" (05) | High |
| 6 | WCAG 2.5.3 Label in Name (Level A) fails on the header airport switcher on every page once an airport is chosen; CI misses it (06) | High |
| 7 | About 440 px of airport chrome puts every phone answer below the first screen (07) | High |
| 8 | The flight card gives the Economy check-in row as the flight's check-in (08) | Medium |
| 9 | Codeshare flight URLs return "not found" (09) | Medium |
| 10 | Boards open 45 minutes in the past, so departed flights lead (10) | Medium |
| 11 | The concierge misses direct answers to fare, airline terminal and nearest lounge (11) | Medium |
| 12 | Price-first parking is not achieved; the Terminal 1 car park has no rate (14) | Medium |
| 13 | Label and provenance noise (15); tab strips clipped at 1440 and 1280 px (16) | Medium |
| 14 | Main-thread blocking: mobile TBT 0.66 to 1.31 s (17) | Medium |

### Q10. What must be improved before public launch

**Must fix (product logic and core journeys):**

1. **Timeline state** (01). Give each timed step an end (check-in closes, gate closes, departed). Never mark a step
   "Now" after its end. Add a "Check-in has closed: contact your airline" state.
2. **Home knows the flight** (02). When a flight is saved, replace the sample teaser and the network board preview
   with the saved flight's live card and next step, above the fold.
3. **Alerts that reach people** (03). E-mail opt-in (BR-04 is a Must), installable-PWA push for iOS, and a clear
   fallback message on iOS Safari. Move the alerts control next to "Save flight".
4. **Fast Track** (04). A sourced page per airport where it exists: price, hours, terminal, how to buy. A flight-page
   entry point; the concierge intent; and a redirect target for the legacy `fast-track` path.
5. **One search box** (05). The home field must fall through to site results ("Parking at KLIA", "Lounges") when no
   flight matches.
6. **Phone layout** (07). Collapse the airport header to one 56 px row on task pages, so the H1 sits under 200 px
   and the key answer is on the first screen. Put the verdict, fare and price before explanations.
7. **Accessibility gate** (06). Add `wcag21a` to the CI axe tags and make the switcher's accessible name start with
   its visible text.

**Must have with MAHB data:** parking rate cards (price-first, BR-10), lounge access rules and prices, outlet hours,
Terminal 2 content, a real map with walking times, and checkpoint queue times.

**Should fix:** findings 08 to 17, especially the check-in rows by cabin, codeshare redirects, boards anchored at
"now", and concierge answers that lead with the asked-for figure.

---

## 4. Persona A: craft critique, ten pages

Each page lists what works and the concrete visual fixes. Positions are [measured]; everything else is [judgement].

### 1. Home `/en`

Contact sheets 01, 04 and 07.

**Works:**

- The task-first first screen: search, journey mode, six tiles and an operational notice all fit in 900 px at 1440.
- No imagery weight.
- "Selamat datang" as an eyebrow is a nice local touch.

**Fixes:**

1. Replace the italic tagline H1 with a functional H1 ("Flights and airport help across Malaysia"), or demote the
   tagline to the eyebrow.
2. Merge the three stacked controls. The airport selector, Departures/Arrivals and Departing/Arriving/Transiting/
   Meeting overlap; keep the journey mode and derive the direction from it.
3. Remove the duplicate "Choose airport" on phones (header and search card) and the duplicate "Getting to the
   airport" (tile and card).
4. Cut the "TRY" example chips to two, in sentence case rather than mono capitals.
5. Drop the zig-zag "ticket stub" edge on the search card: it is decoration on the most functional element.
6. Raise the phone tile grid so the floating search button does not cover "Lounges", or give the grid
   `padding-bottom` equal to the tab bar plus the button overhang (finding 18).

### 2. KLIA overview `/en/kul`

**Works:**

- The roof-canopy line illustration is a genuinely Malaysian mark.
- The terminal chips are clear.

**Fixes:**

1. The board preview shows "Gate closed" rows as "next flights": start it at now + 15 min.
2. Move the operational notice from 2,270 px to directly under the airport header on phones.
3. Replace the clipped section tab strip with a "More" overflow menu, or a fade mask with a scroll button, at all
   widths (finding 16).

### 3. Flight board `/en/kul/flights`

Contact sheets 02 and 05.

**Works:**

- Amber monospaced times with struck-through original times.
- Status pills with icons and words.
- Status filter chips with counts.
- Terminal badges. The board reads like a departure hall.

**Fixes:**

1. Anchor the list to the current time. Fold departed flights under "Show earlier flights", which already exists.
2. Shrink the demonstration banner [prototype] to a single-line chip on phones. It costs about 170 px.
3. Make the board search sticky under the tabs on phones. The field is at 623 px and the first row at 1,173 px.
4. The dark board slab on a cream page, plus a hazard-striped yellow banner, is the loudest contrast in the system.
   In light mode, use a lighter board surface or a thinner banner.

### 4. Flight page `/en/kul/flights/mh2630-20261118-d`

Contact sheets 03 and 05.

**Works:**

- The status card's information hierarchy on desktop.
- The provenance-tagged timeline as a concept.
- Save, share and calendar in one row.

**Fixes:**

1. Use lining, tabular figures for the flight number in the H1, or set it in the sans.
2. State the route once: drop the lead sentence that repeats the card.
3. On phones, put status, gate and boarding time in a sticky compact header. The gate is at 1,306 px today.
4. Move Flight alerts beside "Save flight": it is at 5,321 px on a phone.
5. Move "What this prototype has not verified" out of step 1 into a footnote [prototype].
6. Show check-in rows by cabin (finding 08).

### 5. Parking `/en/kul/parking`

Contact sheet 06.

**Works:**

- The quick-stay chips (3 hours, 1 day, 3 days, 7 days).
- The estimate wording "At most RM 96" is honest.
- The card and table toggle.

**Fixes:**

1. Lead with a price table: one row per car park, one column per stay length, empty cells reading "Not verified".
   Today two warning callouts (red, then amber) come before the calculator, which starts about 3 phone screens down.
2. Rewrite the red callout as a rule ("Preferred Parking is priced for short stays; for more than a day use Long Term
   Car Park"). Do not quote a blog's report of a customer's RM 2,084 bill on the operator's own site (finding 21).
3. Format dates as dd/mm/yyyy for `en-MY`. The native picker followed the device locale and showed 11/18/2026 in the
   test.

### 6. Transport `/en/kul/transport` and `/ms/kul/transport`

Contact sheet 06.

**Works:**

- The best data card in the product: "FARE TODAY RM 55 · JOURNEY TIME 28 min", with two dated chips (valid until 31
  December 2026; changes to RM 65 on 1 January 2027).
- The "What matters most?" sort is a real product idea.
- Malay and dark mode are excellent here.

**Fixes:**

1. Cut the 1,597 words. Collapse "Not published: how often it runs, hours and payment methods" into one muted line
   per card.
2. Put the KLIA Ekspres card above the controls on phones. It is at 1,446 px today.
3. Add the anti-touting rule at the decision point. It exists only in a guide (`src/content/guides.ts:211`).
4. Show the airport taxi for KL Sentral. Today 3 options are listed and the taxi is filed under another destination
   name.

### 7. Lounges `/en/kul/lounges`

Contact sheet 06.

**Works:**

- Grouping by terminal and by side of security.
- The "Open now" state chip.

**Fixes:**

1. One chip row per card at most. "Estimated", "After security" and "Open now" plus "Not published" with a dashed
   circle icon (which reads like an empty radio button) is too much.
2. Lead each card with the three things a traveller decides on: price or eligibility, hours, and the nearest gates.
3. Add a "Nearest to gate G6" sort when arriving from a flight page.

### 8. Terminal map `/en/kul/map`

**Works:**

- The honest "Schematic demonstration map, not a floor plan" label [prototype].
- The text list fallback.
- Arrow and zoom buttons as alternatives to gestures.

**Fixes:**

1. Even as a schematic, draw it with the system's line weight and fill: buildings as soft fills, piers as shapes. It
   is currently dashed placeholder circles on a large empty field.
2. Reduce the legend to the three symbols in view.
3. Production needs real cartography with walking times.

### 9. Transit planner `/en/kul/transit`

**Works:**

- On desktop, a two-column form and result with a green "Looks workable" verdict and a range ("55 min to 1 h
  50 min").

**Fixes:**

1. On phones the verdict is at 2,943 px, after the steps. Put verdict and range first, then the steps.
2. Use the same segmented-control style as the home journey modes. The planner uses a third visual variant.

### 10. Corporate `/en/corporate`

**Works:**

- The most refined page. Editorial headline, large figures ("104.4 million passengers") with dated provenance, and
  generous white space.

**Fixes:**

1. Move the provenance under each statistic into a single "Sources" line per row. Four chip-and-toggle pairs under
   four numbers compete with the numbers.
2. Do not reuse the KLIA roof illustration as the corporate hero: it makes the group look like one airport.

### Across the system

1. **Quieter provenance.** Use a superscript marker (for example, a small "S") that opens sources. Keep the chips for
   the two states that change behaviour: Demo and Not verified.
2. **Fewer type sizes.** Cap any page at about 8 sizes. Reserve mono capitals for data labels inside the flight card.
3. **One segmented-control style** for the whole product.
4. **Overflow affordances** on every horizontally scrolling strip.

---

## 5. Persona B: five timed tasks against how I do them today

All runs started from `/en` on a phone (iPhone 14 profile, 390 × 664 viewport) with nothing saved, between 18:38 and
19:00 Malaysia time. Desktop runs at 1440 × 900 are noted where they differ.

- **Interactions** and **position of the answer** are [measured]; position is in CSS px from the top of the page, on
  a 664 px screen.
- **Machine time** is the measured time from the last interaction to the answer being present [measured].
- **Human time** is a keystroke-level estimate [judgement].

| # | Task | Interactions | Answer position | Machine time | Human time | Outcome |
|---|---|---|---|---|---|---|
| T1 | Status, terminal and gate for MH 2630 | 1 (type, then Enter) | Result row at 450 px: inside the first screen (desktop 408 px) | 0.10 to 0.14 s after Enter; about 1 s from navigation | About 6 s | **Success.** Row: "19:40 Singapore · MH 2630 · T1 · Gate G6 · Check-in closed" |
| T2 | Follow the flight: save, alerts on, share link | 5 (search, open, save, alerts, share) | Save at 1,547 px; alerts at 5,321 px, about 8 screens (desktop 1,086 and 1,239 px) | Under 1.5 s in total | 40 to 60 s, mostly scrolling | **Partial.** Alerts arrive only while the page is open. With the Notification API removed (as on iOS Safari) the panel says "This browser cannot show notifications", with no e-mail or other channel |
| T3 | Parking price for a 3-day stay at KLIA | 3 (Parking tile, choose KLIA, "3 days") | Quick-stay chips at 2,029 px; estimate at 2,206 px | About 1.9 s | About 25 s | **Partial.** "At most RM 96" for the Long Term Car Park (preselected). The Terminal 1 car park, where I park, shows "Not verified" and no figure. The booking link goes to the official site without dates |
| T4 | Lounge at KLIA T1, with price and hours | 2 (Lounges tile, choose KLIA) | First card below the airport chrome (card position not measured); first price-like text (a promotion) at 4,878 px | About 1.9 s | About 20 s | **Partial.** Plaza Premium Lounge, Contact Pier Level 2 near gate G, "Open 24 hours" (from a lounge directory). No price, no access rules, no booking. The flight page does not suggest it although gate G6 is next to it |
| T5 | KLIA Ekspres fare and time to KL Sentral | 2 ("Getting to the airport" tile, choose KLIA) | "RM 55" at 1,467 px, about 2.2 screens; "28 min" beside it | About 1.2 s | About 15 s | **Success** on fare and time, with dated change to RM 65. Frequency and first and last trains are not published |
| T6 (extra) | Buy Fast Track | Not possible | Site search: "0 results"; home search: "0 flights found" | Not applicable | Not applicable | **Fails.** The concierge answered with the Butterfly Effect hidden-disability programme |

**Returning visitors.** Once an airport is remembered, the home tiles link straight to that airport's section
(`src/components/shell/sections.ts:123`), which removes one interaction from T3 to T5 [source; not timed].

**Compared with how I do it today** [judgement, from benchmark screenshots and the benchmark report]:

| Task | Today, best benchmark | Interactions today | Here | Who wins |
|---|---|---|---|---|
| T1 | Heathrow mobile web: the field sits under a hero carousel at the bottom of the first screen. The departures page showed an error in the project's capture. Changi: dismiss a cookie wall, then the hero search; the listing failed to load in capture | 2 to 3 | 1, answer on the first screen | **This product, clearly** |
| T2 | Changi app (saved flights, alerts, Live Activities), but it needs the app. Heathrow web needs an account to save | 2 in an installed app | 5, plus scrolling; no alerts on iPhone | **Changi app**, for an iPhone user |
| T3 | Heathrow: parking products priced and bookable | About 4 to a priced booking | 3 to a ceiling for one car park | **Heathrow** |
| T4 | Heathrow and Changi sell lounge entry online | About 3 to a price | 2 to a list, no price | **Heathrow and Changi** |
| T5 | Heathrow Express on its own host; Changi has no web comparison | 2 to 3 | 2, with dated fares | **This product** |

---

## 6. Findings

Ranked by severity. Full evidence, expected behaviour, fixes and file pointers are in
[`ux-frequent.json`](./ux-frequent.json). "Still present" means the issue was already logged in
`docs/qa/usability.md` and was re-observed in this session.

| ID | Severity | Area | Title |
|---|---|---|---|
| ux-frequent-01 | high | flights | The timeline marks the wrong step as "Now": check-in after it closed; boarding on a departed flight (usability-04, still present and wider) |
| ux-frequent-02 | high | home | The home page ignores the visitor's saved flight |
| ux-frequent-03 | high | flights | Alerts only while the page is open; none on iPhone Safari; no e-mail opt-in; control 8 screens down on a phone |
| ux-frequent-04 | high | commerce | Fast Track is absent from search, the concierge and the content, a regression on MAHB today |
| ux-frequent-05 | high | search | The home search is flights-only and dead-ends on topic words (usability-03, still present) |
| ux-frequent-06 | high | accessibility | Label in Name (WCAG 2.5.3, Level A) fails on the header airport switcher on every page once an airport is chosen; the CI tag set omits `wcag21a` |
| ux-frequent-07 | high | shell | About 440 px of airport chrome puts phone answers below the first screen (usability-06, still present) |
| ux-frequent-08 | medium | flights | The flight card states the Economy check-in row as the flight's check-in |
| ux-frequent-09 | medium | flights | Codeshare flight URLs return "We could not find this flight" |
| ux-frequent-10 | medium | flights | Boards open 45 minutes in the past, so departed flights lead |
| ux-frequent-11 | medium | concierge | The concierge does not lead with the asked-for answer (fare, airline terminal, nearest lounge, Fast Track) |
| ux-frequent-12 | medium | transit | The self-transfer verdict is at 2,943 px on a phone, after the steps (usability-07, still present) |
| ux-frequent-13 | medium | journey | The leave-by time is not personalised and the timeline does not suggest the lounge by the gate |
| ux-frequent-14 | medium | parking | Parking is not price-first, and the Terminal 1 car park has no rate |
| ux-frequent-15 | medium | design-system | Label and provenance noise: 78 upper-case labels on home; 22 "not published" mentions on Transport |
| ux-frequent-16 | medium | design-system | The airport section tab strip is clipped at 1440 and 1280 px with no overflow cue |
| ux-frequent-17 | medium | performance | Mobile Total Blocking Time of 0.66 to 1.31 s on core pages |
| ux-frequent-23 | medium | home | The KLIA overview buries the operational notice and leads its board preview with gate-closed flights |
| ux-frequent-18 | low | home | The phone tab bar's search button covers the "Lounges" tile label |
| ux-frequent-19 | low | home | Redundant controls on the home page: two airport choosers, direction and mode, two "Getting to the airport" |
| ux-frequent-20 | low | design-system | The flight number H1 uses old-style figures and the route is stated three times |
| ux-frequent-21 | low | content | The parking warning quotes a blog's report of a customer's bill |
| ux-frequent-22 | low | shell | Malay tab-bar labels crowd, and the section tabs open clipped mid-word at 360 px |

Counts: **0 critical, 7 high, 11 medium, 5 low** (23 findings).

---

## 7. Reproduce

Scratch scripts and raw outputs are in the session scratchpad under `qa-scratch/ux-frequent/` (session-scoped; they
may be cleared):

| Script | What it does |
|---|---|
| `batch.sh` | Captures 26 pages |
| `shots.js` | 1280, 360, dark and Malay screenshots |
| `tasks.js` | The timed tasks: `node tasks.js phone` or `desktop` |
| `probe2.js` | The Notification API stub and removal |
| `probe4.js` | Searches, codeshare and board positions |
| `probe7.js` | Saved-flight round trip |
| `probe8.js` | Timeline "Now" against status |
| `axe-dark.js` | axe with `wcag21a` added |
| `craft.js` | Type and label counts |

Lighthouse: `lh.js lh 1 home=… flight=… board=… transport=…`. The server ran as one `next start` process on port
3107 and was stopped by its PID afterwards.
