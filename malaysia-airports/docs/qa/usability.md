# Usability evaluation: heuristic review and simulated persona tasks

Evaluator role: UX research lead. Date: 18 November 2026, about 17:45 to 18:30 Malaysia time (MYT).
Build: the existing production build in `.next`, served with `next start -p 3103`. Machine-readable
findings: [`usability.json`](./usability.json).

**This is not a study with real users.** It is a heuristic review plus a scripted, simulated walkthrough of
each persona's top two tasks, performed by one evaluator in a real browser (Chromium through Playwright).
It can find problems and count steps. It cannot tell you how often real passengers succeed, how long they
take or how they feel. Section 7 designs the study that can, and MAHB should run it before launch.

## Verdict

The prototype is a large step up from MAHB today on the core flight task: a flight number typed into the
home search returns its status, terminal and gate inline in **one interaction** (target 2; MAHB today
needs the terminal first and offers departures only). Wheelchair assistance (2), a Calm Room location (2),
baggage rules for baby milk (2) and the Malaysia Digital Arrival Card rule (3, after one wrong turn) are all
reachable in a few steps, and
Bahasa Malaysia is at near-parity on 14 key pages (measured).

Across **18 tasks on two viewports (36 runs)**: 28 runs succeeded, 4 were partial and 4 failed. Only 26
runs (72%) succeeded without a wrong turn, and 9 of 18 tasks met the strategy's interaction target on a
phone. Three of the four non-successes are content gaps (nursing-room locations, Subang parking, the
Terminal 1 car-park rate), and one is a missing live-status layer. These are simulated results, not
predictions: a study with real participants would show more friction, not less.

We logged **25 findings: 0 critical, 7 high, 10 medium, 8 low.** The seven high findings:

| ID | Finding |
|---|---|
| usability-01 | No anti-touting or official-taxi guidance where a first-time visitor picks transport into the city |
| usability-02 | Home tiles and the main navigation quietly fall back to the airport overview when an airport lacks that section (Subang "Parking" opens an overview with no parking) |
| usability-03 | The home's main search box is flights-only: a topic such as "arrival card" ends in "0 flights found" with no route to site search |
| usability-04 | On a departed flight, the journey timeline still marks "Board from 11:15, be at the gate" as **Now** |
| usability-05 | The map gives an illustrative prayer-room pin a level and a side of security that the Facilities directory says are not published |
| usability-06 | On phones, about 440 px of airport chrome sits above every task page's heading, so flight status, fares, parking estimates and board rows start below the first screen |
| usability-07 | The self-transfer verdict ("Tight") appears 4,279 px down the phone page, after eleven steps |

## 1. Method and limitations

### 1.1 What was done

| Part | How | Evidence type |
|---|---|---|
| Persona tasks | For each of the nine passenger personas (P1 to P9 in the product strategy, section 3), the two top tasks from the strategy's task list (section 4.1) were scripted as Playwright walkthroughs and run on a phone viewport (390 x 844, touch, mobile) and a desktop viewport (1280 x 800). 18 tasks, 36 runs | Measured counts; evaluator judgement on decision points and "unaided" |
| Heuristic review | Nielsen's ten heuristics plus five airport heuristics (clarity of status, trust and provenance, wayfinding continuity, stress-state usability, multilingual parity) across 12 key pages, severity 0 to 4 | Judgement, anchored to observations |
| Page measures | Rendered-text counts of provenance tags, demo labels, "not published" notes and source disclosures; page length in screens; heading position; English strings left on the 14 Malay equivalents | Measured (string matching, approximate) |
| Copy review | Interface strings in `src/lib/i18n/en.ts` and `src/lib/i18n/features/*.ts` compared with what rendered | Judgement plus grep counts |
| Screenshots | 5 viewed (home on phone and desktop, airport chooser, transport and flight page on phone) | Direct |

**How each run was counted.**

- **Interactions (raw):** each tap, click or select = 1; typing into a field = 1 per field (not per keystroke).
- **Interactions (strategy rule):** as the strategy counts them, "typing a query and choosing a suggestion counts
  as one". This is the column compared with the strategy's targets.
- **Scrolls:** the number of 75%-of-viewport flicks needed to bring the next target into the usable area (the
  phone's fixed 90 px bottom bar excluded; elements in fixed bars need none). A model, not a recording of a
  thumb.
- **Pages:** distinct paths viewed (query-string changes inside a planner are not counted). Every run had one
  full document load; everything after it was a client-side navigation.
- **Decision points, dead ends, wrong turns:** logged by the evaluator while scripting: a decision point is a
  place where the next step was not obvious from the screen; a wrong turn is a plausible step that did not lead
  to the answer; a dead end is a page that offered no way on to the answer.
- **Success:** the answer was asserted present on screen (for example "RM 55" with its validity date, or "Level
  3A"). **Partial** means an honest "not published" or a part answer. **Unaided** is the evaluator's judgement
  that a first-time visitor would take this path from on-screen cues alone, with no wrong turn.
- **Modelled time:** a keystroke-level estimate (tap 1.5 s, select 2.5 s, field 1.5 s plus 0.3 s a character,
  scroll 1 s, reading the answer 3 s, decision point 3 s, page change 1 s). It is not a measured human time and
  excludes hesitation, so real times will be longer.

**Path choice.** The evaluator explored each area first, then scripted the path a reasonable newcomer would most
plausibly take from what the screen shows. Where that path was wrong (P2-T2, P3-T1), the wrong turn is kept in the
counts. Flights were chosen from the deterministic demonstration schedule for 18 November (MH 570 to Tokyo, FY
3499 Subang to Penang, MH 2088 from Bali).

### 1.2 Limitations

- One expert evaluator who had read the code: the walkthroughs understate what a stressed first-time passenger
  meets. Treat the counts as a floor.
- Headless Chromium on a local server: page changes are near-instant, so the counts say nothing about waiting on a
  slow or roaming connection.
- No screen reader, switch or voice control was used in these runs. See the accessibility audit
  ([`accessibility.md`](./accessibility.md)) for that work.
- The flight-data failure state could not be triggered: answering `/api/flights` with 503 did not change the home
  search or the board (the demonstration provider also runs in the browser). Principle 7's unavailable state is
  therefore **not tested here**.
- Malay was checked by string matching and by running one task in Malay. That is not a native-speaker review.
- Demonstration flights depend on the clock, so a rerun on another day picks different flight numbers.
- Scripts and raw results stayed in the evaluator's scratch folder and are not part of the repository (section 8).

## 2. Results at a glance

| Measure | Phone | Desktop | Note |
|---|---|---|---|
| Runs | 18 | 18 | 9 personas x 2 tasks |
| Succeeded | 14 | 14 | Partial: P3-T1, P4-T2. Failed: P8-T2, P9-T2 |
| Succeeded unaided (no wrong turn) | 13 | 13 | P2-T2 succeeded only after a wrong turn |
| Met the strategy's interaction target | 9 of 18 | 10 of 18 | Desktop also meets P6-T1 (2 through search) |
| Interactions, median (strategy rule) | 3 | 3 | Range 1 to 6 |
| Scrolls, median | 2 | 1 | Phone range 0 to 11 |
| Modelled time, range | 6 to 27 s | 6 to 22 s | Strategy targets: flight status 30 s, parking price 60 s, T1 to T2 plan 2 min, prayer room 45 s |

Against the brief's targets (task success at least 95%, unaided success at least 90%), this simulation found 78%
full success and 72% unaided success. That is **not** a measured rate. It does show that, without the content and
status fixes below, a real study is unlikely to reach the targets on these tasks.

## 3. Task results per persona

Each cell shows **phone / desktop**. "Int." is raw interactions, then the strategy-rule count in brackets. MAHB
today comes from the audit's friction log (`docs/research/audit/mahb-audit.md`, section 2) or the strategy's
"current friction" column. The best benchmark comes from the benchmark report (sections 2 to 6; BR numbers refer to its
requirements).

### P1 Frequent international business traveller

| Task | Int. | Target | Scrolls | Pages | Decision points / dead ends / wrong turns | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 Status, terminal and gate of MH 570 today (task 1) | 2 (1) / 2 (1) | 2 | 1 / 0 | 2 / 2 | 0 / 0 / 0 | **Success, unaided.** The inline card states "T1, Gate C27, Check-in closed" after one entry; the flight page is one more tap | 13 / 12 s | Terminal-first, departures-only widget, about 4 steps; "Loading..." when the API fails | Istanbul: inline lookup in two interactions (benchmark 6.4). The prototype beats it |
| T2 Price for 3 days at KLIA T1, then the booking hand-off (task 5) | 4 (4) / 4 (4) | 3 to a price; 5 to the hand-off | 7 / 5 | 3 / 3 | 2 / 0 / 0 | **Success (upper bound), unaided.** "At most RM 96" for the Long Term Car Park after 3 interactions (it is the default car park); "Book parking online" is 4. The booking page receives no dates | 24 / 22 s | No rate table; the price is not on the page | Dubai's tariff page (BR-10) |

Decision points: the Parking tile opens a 39-airport chooser rather than parking; and the calculator does not say
which car park suits a 3-day trip until the Preferred Parking warning has been read.

### P2 First-time international visitor

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 Official way from KLIA to KL Sentral, with a dated fare (task 4) | 3 (3) / 3 (3) | 2 | 4 / 2 | 3 / 3 | 1 / 0 / 0 | **Success, unaided**: KLIA Ekspres RM 55 "until 31 December 2026", then RM 65. **But** the page has no anti-touting guidance, and for KL Sentral the official coupon taxi appears only under "Not listed for KL Sentral" (its counters show only for the city-zone destination) (usability-01) | 17 / 15 s | 3 steps and tab-hopping; page errored; touting at this decision | Changi describes transport mode by mode; no benchmark ties it to the flight (BR-11) |
| T2 What to submit before landing (task 11) | 4 (3) / 4 (3) | 2, then hand-off | 1 / 0 | 2 / 2 | 0 / 1 / 1 | **Success after a wrong turn.** "arrival card" typed in the home search returns "0 flights found" (usability-03); the site search finds the Arriving guide: MDAC within three days before arrival, free on the official portal | 18 / 17 s | Rules sit with Immigration | Not benchmarked |

Decision point: in the default Departing mode the tile reads "Getting to the airport", which does not say "into
the city". The visitor has to switch to Arriving to see "Leaving the airport" (usability-15).

### P3 Family with an infant

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 Nearest nursing room at KLIA T1 (task 7) | 6 (5) / 5 (4) | 2 | 5 / 3 | 4 / 4 | 0 / 1 / 1 | **Partial, not unaided.** Facilities (17 items at T1) has no nursing entry and no "not published" placeholder (usability-12). Search finds the Families guide: "not yet verified, ask at an information counter". No location | 24 / 20 s | Two facilities pages; locations not captured | Hamad (prayer-room records), Munich (search) (BR-12) |
| T2 Can baby milk and food go through security? (task 12) | 3 (2) / 3 (2) | 2 | 2 / 1 | 2 / 2 | 0 / 0 / 0 | **Success, unaided.** "baby food", first suggestion, then "Baby milk and baby food are allowed" | 13 / 12 s | Same rules duplicated under six trees | Not benchmarked |

### P4 Wheelchair user

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 How and when to request assistance (task 10) | 2 (2) / 2 (2) | 2 | 1 / 0 | 2 / 3 | 0 / 0 / 0 (phone); 1 / 0 / 0 (desktop) | **Success, unaided**: through the airline, at least 48 hours ahead, free (sourced). The phone path is Menu, then Assistance; the desktop header has no Assistance link, so Help, then the wheelchair question (usability-08) | 8 / 11 s | Programme filed under "Booking Services" at three URLs | Hamad has no request channel; Istanbul filters needs per flight (BR-18) |
| T2 Is the Aerotrain to the satellite running? (task 8) | 1 (1) / 1 (1) | 0 when active; 1 otherwise | 0 / 0 | 2 / 2 | 1 / 0 / 0 | **Partial.** The home notice shows the planned closure (midnight to 5am, 28 November to 1 December) with **0** interactions; nothing says whether it runs **now** (usability-11) | 9 / 9 s | No status layer; a 2021 item still surfaces in search | Haneda congestion panel, Incheon car-park status (BR-08) |

### P5 Older traveller (run in Bahasa Malaysia at 125% text)

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 Switch to Malay and largest text, then "what time should I arrive?" for MH 570 (task 3) | 7 (6) / 5 (4); the task alone 1 after setup | 3 | 10 / 5 | 3 / 3 | 0 / 0 / 0 (phone); 1 / 0 / 0 (desktop) | **Success, unaided.** "Tiba di lapangan terbang sebelum 15:55" on the Malay flight page. Setup takes 5 phone interactions (Menu, BM, Menu, 125%, close), and the answer is **8 scrolls** down at 125% (usability-10) | 27 / 22 s | English only; no leave-by guidance seen | Hamad timeline, Haneda Sample Plan (BR-03) |
| T2 Reach a verified phone number and call it (task 14) | 4 (4) / 3 (3) | 2 | 2 / 1 | 3 / 3 | 1 / 0 / 0 | **Success, unaided**: two labelled numbers (group line +60 3 8777 0000; KLIA T1 and corporate office +60 3 8777 7000), both `tel:` links. On the Help page itself they sit 5,226 px down; the "Contact" topic card is the short way | 16 / 14 s | Contacts only from third parties; two unexplained numbers | Not benchmarked |

### P6 Neurodivergent traveller, or a parent

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 What the Butterfly Effect offers and how to register (task 10) | 3 (3) / 3 (2) | 2 | 0 / 0 | 2 / 2 | 0 / 0 / 0 (phone); 1 / 0 / 0 (desktop) | **Success, unaided**: register at an information counter for a Butterfly Kit; priority access; Calm Rooms; sensory walls. Desktop needs search ("autism") because there is no header entry (usability-08) | 9 / 13 s | Under "Booking Services" at three URLs | BR-18 |
| T2 Where is the Calm Room in Terminal 2? (task 7) | 3 (2) / 3 (2) | 2 | 0 / 1 | 2 / 2 | 0 / 0 / 0 | **Success, unaided**: "Mezzanine Floor (Level 3A) of the Departure Hall", sourced | 11 / 12 s | Not found | No benchmark has a sensory map in HTML; Changi's is a PDF |

### P7 Self-transfer passenger, Terminal 1 to Terminal 2

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 Plan a self-transfer: arrive T1, leave T2, separate tickets, 3 h (task 9) | 6 (6) / 6 (6) | 3 | 6 / 2 | 3 / 3 | 1 / 0 / 0 | **Success, unaided**: ordered steps (immigration, bags, train or shuttle, check in again) and the verdict "Tight". The verdict is 4,279 px down the phone page (usability-07). The URL updates with `replaceState`, so Back is not polluted (measured) | 24 / 20 s | Duplicate pages; shuttle every 10 or 15 minutes depending on the page | Heathrow's planner excludes self-connectors; Dubai has procedure text only (BR-22) |
| T2 Train or shuttle between terminals: fare and frequency (part of task 9) | 2 (2) / 2 (2) | 3 | 11 / 6 | 1 / 1 | 1 / 0 / 0 | **Success, unaided**: train RM2 and the free shuttle, with the 10 or 15 minute disagreement stated. A consent screen interrupts the suggested question (usability-21). The home suggestion is about 6,600 px down on a phone | 20 / 15 s | As above | As above |

### P8 Domestic commuter

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 Follow FY 3499 Subang to Penang and find it again from the home screen (task 1, repeat use) | 4 (3) / 4 (3) | 2 | 2 / 1 | 2 / 2 | 0 / 0 / 0 | **Success, unaided**: "Save flight", then Home: the saved flight appears inside the first screen (top at y = 462 px on the phone) | 14 / 13 s | Subang is absent; alerts need the app | Istanbul alerts without an account (BR-04) |
| T2 Switch to Subang and find its parking daily cap (task 5, network airport) | 3 (3) / 3 (3) | 1 plus the choice; 3 to a price | 0 / 0 | 2 / 2 | 0 / 1 / 0 | **Failed.** After choosing Subang, the "Parking: Car parks and how to pay" tile (and Getting to the airport, Terminal maps, Lounges, Food and shops) silently opens the Subang overview, which never mentions parking (usability-02) | 6 / 6 s | Subang absent | Not benchmarked |

### P9 Someone meeting a passenger

| Task | Int. | Target | Scrolls | Pages | DP / DE / WT | Outcome | Modelled time | MAHB today | Best benchmark |
|---|---|---|---|---|---|---|---|---|---|
| T1 Meet MH 2088 from Bali: when to arrive, where to wait, where to pick up (task 6) | 3 (2) / 3 (2) | 3 | 3 / 2 | 2 / 2 | 0 / 0 / 0 | **Success, with a gap**: Meeting mode carries through to the flight page; "Expect them from about 19:40" (labelled Estimated); arrival hall Level 3. **No pick-up point or e-hailing area**, and the view leads with long-stay parking warnings (usability-09) | 14 / 13 s | Arrivals on separate pages; no baggage layer | Heathrow's collector split inside flight details (BR-23) |
| T2 Price of 2 to 3 hours at the Terminal 1 car park (task 5) | 5 (5) / 5 (5) | 3 | 5 / 2 | 3 / 3 | 0 / 0 / 0 | **Failed (honestly).** "No estimate: rates not verified", with an undated RM4 an hour and a RM52 daily maximum quoted as conflicting (usability-19) | 19 / 16 s | No rate table; conflicting rates | Dubai's tariff page (BR-10) |

### What the counts say

- **Where the prototype wins outright:** flight lookup (1 interaction, inline, any airport, any terminal),
  assistance (2), the Calm Room (2), liquids and baby food (2) and the saved flight on the home screen. Each was
  hard or impossible on MAHB today.
- **Where it adds steps:** every home tile and primary navigation item routes through the 39-airport chooser when
  no airport has been chosen (+1 interaction and 1 or 2 scrolls on five tasks; usability-20); the transfer planner
  takes 6 interactions against a target of 3; the phone number takes 4 against 2.
- **Where scrolling, not tapping, is the cost:** answers sit 2 to 8 scrolls down on phones because the airport
  chrome and demo banner fill the first screen (usability-06, usability-10, usability-07).
- **Where content, not design, blocks the task:** nursing rooms, Subang parking and the Terminal 1 car-park rate.
  The prototype says so honestly, but each still fails the task.

## 4. Heuristic evaluation

Severity follows Nielsen's 0 to 4 scale: 0 no problem (used only where something specific was checked), 1 cosmetic, 2
minor, 3 major, 4 catastrophe. A dash means no problem was observed in this pass. **It is not a certified pass.**
The airport heuristics are A1 clarity of status, A2 trust and provenance, A3 wayfinding continuity, A4 stress-state
usability and A5 multilingual parity.

| Page | H1 Status | H2 Real world | H3 Control | H4 Consistency | H5 Error prevention | H6 Recognition | H7 Efficiency | H8 Minimalist | H9 Error recovery | H10 Help | A1 | A2 | A3 | A4 | A5 | Main findings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home `/en` | 0 | 2 | – | 2 | – | – | 1 | 2 | 3 | – | 2 | 1 | 3 | 2 | 0 | 02, 03, 11, 14, 15, 21, 24 |
| Airport chooser `/en/airports?then=…` | 0 | – | 1 | – | – | 1 | 2 | 1 | – | – | – | – | 2 | 1 | – | 20 |
| Flight board `/en/kul/flights` | 1 | – | – | – | – | – | – | 2 | n/t | – | 2 | 1 | – | 2 | 0 | 06, 18; accessibility-03 |
| Flight page `/en/kul/flights/<id>` | 3 | – | – | 1 | – | – | 2 | 2 | n/t | – | 3 | 2 | 1 | 2 | 1 | 04, 06, 10, 17, 18, 23 |
| Transport `/en/kul/transport` | – | 2 | 0 | 2 | – | – | 2 | 2 | – | – | – | 1 | – | 3 | 0 | 01, 06, 15, 17 |
| Parking `/en/kul/parking` | – | 2 | – | – | 0 | – | 2 | 2 | 1 | – | – | 2 | – | 1 | 0 | 16, 17, 19 |
| Facilities `/en/kul/facilities` | – | 1 | – | 2 | – | 3 | 2 | 3 | – | – | – | 3 | 3 | 2 | 1 | 05, 12, 17 |
| Terminal map `/en/kul/map` | – | – | – | – | – | – | – | 2 | – | 1 | – | 3 | 1 | – | 0 | 05, 17 |
| Transit planner `/en/kul/transit` | 2 | – | 0 | – | – | – | 2 | 2 | – | – | 2 | 1 | – | 3 | 1 | 07, 11, 20 |
| Help centre `/en/help` (and `/help/contact`) | – | – | – | – | – | 2 | 2 | 1 | – | 0 | – | 1 | – | 2 | 0 | 22 |
| Assistance and accessibility `/en/accessibility` | – | – | – | 2 | – | 2 | 1 | 1 | – | 0 | – | 1 | 1 | 1 | 1 | 08 |
| Search palette and results `/en/search` | 0 | 2 | – | 2 | – | – | 0 | – | 1 | – | – | – | – | 2 | 0 | 03, 13 |

n/t: not testable in this build (the flight-data failure state could not be triggered).

**What the zeros rest on.** Home H1: "Searching departures across 21 airports" and "Updated hh:mm" are shown.
Chooser H1: "Choose an airport to continue to Parking." Transport and transit H3: planner changes use
`replaceState` (history length unchanged after three changes, measured). Parking H5: a leave date before the
arrival date gives `aria-invalid` and the alert "Your departure must be after your arrival" (measured). Help and
Assistance H10: the "Who handles what" table and a dated accessibility statement. Search H7: Calm Room (Terminal 2)
in two interactions (measured). A5 zeros: no English sentences found on the Malay version (section 5.4).

### 4.1 Heuristic findings, by theme

**Clarity of status (A1, H1).**
- usability-04 (high): on a departed flight (MH 2626, status panel "Departed, actual 12:00"), the journey timeline at
  18:10 marks "Board from 11:15. Be at the gate before then" as **Now**. `finalise()` treats the last step whose
  time has passed as current, whatever the flight's status (`src/lib/journey/index.ts:173-185`).
- usability-11 (medium): the only Aerotrain information is a planned closure. Nobody can learn whether it runs
  today, and the transit planner has no live shuttle or train line either.

**Trust and provenance (A2).**
- usability-05 (high): Facilities says the Terminal 1 prayer room's "Location, Level, Area, Opening hours and
  Accessibility" are not published, yet its "Show on map" opens a pin with "Level 5: departures" and "Public area
  (landside)" as fields. The name says "illustrative position", but those fields read as facts
  (`src/content/airports/kul.ts:1765`).
- usability-17 (medium): provenance is everywhere, which is right, but it is dense and inconsistently named (section 5).

**Wayfinding continuity (A3).**
- usability-02 (high): `sectionHref()` silently swaps a missing section for the overview
  (`src/components/shell/sections.ts:123-132`). Subang, Kuching and Langkawi have no parking, transport,
  facilities or lounges page (404 for each), so five of six home tiles land on the overview.
- usability-12 (medium): nursing rooms are a defined facility category (`src/content/types.ts:286`) but absent
  from the directory, with no placeholder. The map says "Not on this map yet: Nursing rooms", which is the right
  pattern, but Facilities does not.
- usability-20 (low): the 39-airport chooser interrupts five of the 18 tasks; KLIA is 1 to 2 scrolls down on a
  phone, below the search, state and type filters.

**Stress-state usability (A4).**
- usability-01 (high): the transport page has no "ignore touts" message. For the default destination, KL Sentral,
  the official coupon taxi is listed only under "Not listed for KL Sentral"; its counter locations and indicative
  fares appear only if the visitor changes the destination to the city zone. The guidance exists on the arrival
  flight page ("ignore anyone who approaches you offering a ride") and in Help, but not at the decision itself.
- usability-06 (high): measured `h1` tops on the phone: 414 to 440 px on the board, flight, transport, parking,
  facilities, map and transit pages. With the 90 px bottom bar, about 300 px of the 844 px screen is left for the
  task. On the flight page the gate is at 1,306 px, and the yellow demo banner sits between the title and the status.
- usability-07 (high): the transfer verdict sits at 4,279 px on the phone (2,652 px on desktop); the steps start
  at 1,644 px.
- usability-10 (medium): the arrive-by time, the answer to strategy task 3, is 3,448 px down the phone flight page.

**Consistency and standards (H4), match with the real world (H2).**
- usability-03 (high): two magnifier-icon search fields with different scopes (the home's flights-only field and
  the bottom bar's site search). The flights-only empty state never offers the other.
- usability-14 (low): "Departures | Arrivals" (search scope) and "Departing | Arriving | Transiting | Meeting
  someone" (journey mode) sit one above the other with overlapping words.
- usability-15 (medium): six labels for transport, three for shop and dine, four for lounges (section 5).

**Recognition and efficiency (H6, H7).**
- usability-08 (medium): no Assistance entry in the desktop header (strategy 4.2 says "Assistance is in the header
  and Help on every page"); on the phone it is under Menu, then More.
- usability-13 (medium): "AirAsia" in site search returns eight demo flight rows from mixed airports. "AirAsia
  terminal" returns 58 results led by transport items, and the concierge answers "I could not match that to one
  topic". Strategy task 2 (which terminal does my airline use, target 1 interaction) has no answer path except a
  flight lookup.
- usability-22 (low): Help's phone numbers are 5,226 px down the Help centre on the phone.

## 5. Copy review

### 5.1 What works (judgement)

The voice is plain and calm, and it says what it does not know without alarm: "Sources differ: check the official
page", "we could not confirm that it has started, so check with your airline", "Do not wait at the kerb: it is for
picking up and dropping off only." Error text is specific ("Your departure must be after your arrival."). Dates
sit beside changeable facts ("Applies today · Until 31 December 2026 · Changes to RM 65 on 1 January 2027"). The
Butterfly Effect section states the scheme's limits literally, which suits P6.

### 5.2 Labels: the same place under different names (usability-15)

Counted in `src/lib/i18n/en.ts` and `src/lib/i18n/features/*.ts`:

| Destination | Labels in use |
|---|---|
| Transport | "Getting to the airport", "Getting to and from", "Getting to and from {airport}", "Transport & parking", "Leaving the airport", "Getting to {airport}", "Getting to the terminal" |
| Shop and dine | "Shop & dine", "Shop and dine", "Food and shops" |
| Lounges | "Lounges", "Lounges and hotels", "Lounges and rest", "Hotels and rest" |
| Facilities | "At the airport", "Facilities and services", "Facilities" |
| Map | "Terminal map", "Terminal maps", "Find your next gate", "Find the arrivals hall" |

Mode-specific verbs ("Track their flight", "Leaving the airport") are a good idea. But the destination noun should
stay the same, so that a tile, the section tab and the page title match. "Getting to the airport" on the home
(Departing mode) was the decision point for the arriving visitor in P2-T1.

### 5.3 Errors and awkward strings (usability-16)

| String | Where | Problem | Suggested |
|---|---|---|---|
| "These are demonstration flights. **Do not use it** to plan travel." | Home flight search result (`flight-search-box.tsx:285` joins `flights.search.demoNote` and `demo.doNotPlan`) | Plural subject, singular "it" | "These flights are simulated. Do not use them to plan travel." |
| "our sources list train between Terminal 1 and Terminal 2 and free shuttle bus between the terminals." | Concierge template `transfer` (`src/lib/i18n/features/concierge.ts:153`) | Missing articles; reads machine-made | "You can take the train (RM2) or the free shuttle bus between the terminals." |
| "Arrival date" / "Departure date"; "Your departure must be after your arrival." | Parking calculator | Flight words used for car-park entry and exit; easy to confuse with the flight | "Entry" and "Exit" (or "Park from" and "Collect by") |
| "Calm Room" next to "Calm Room (Terminal 2)" | Accessibility hub, search | Only one is qualified | "Calm Room (Terminal 1)" |
| "Official instruction" on a lounge description and on a prayer-room card whose location is "Not published" | Facilities | The legend defines it as "an instruction or fact", but on a fact "instruction" misleads; the tag beside "Not published" sends mixed signals | Use "Official" for facts and keep "Official instruction" for rules |
| "Meeting someone at {airport}: Parking and the way to arrivals" linking to the parking chooser | Home notice strip, Meeting mode | The label promises a meeting guide | Link to the flight board in Meeting mode, or "Parking for pick-up" |

### 5.4 Provenance tags and demo labels: understood or noisy?

We cannot measure understanding without participants. That is a study question (section 7.5). What we measured
is density (rendered text on the phone, approximate):

| Page | Screens | Provenance tags | "N sources" disclosures | "Not published / not verified" | Demo labels |
|---|---|---|---|---|---|
| Facilities | 17.5 | about 21 | 21 | 27 | 0 |
| Transport | 13.2 | about 8 | 8 | 22 | 0 |
| Parking | 11.6 | about 7 | 7 | 17 | 5 |
| Terminal map | 11.7 | about 24 | 1 | 0 | 18 |
| Transit | 12.2 | about 19 | 15 | 4 | 1 |
| Flight page | 9.2 | about 13 | 8 | 1 | 6 |

Judgement (usability-17, usability-18):

- **Provenance is valuable and must stay**, but at this density the tags risk becoming wallpaper. The same "What this
  prototype has not verified at KLIA" list repeats on the flight, transport and transit pages, and the "How to read
  this guidance" legend repeats on Help pages.
- **Naming drifts:** "Official instruction" and "Official", "Estimated guidance" and "Estimated" both appear,
  sometimes on the same page type.
- **Demo labelling is unmissable** (principle 2 holds in every run), but the full yellow banner on each flight
  surface costs about 200 px of the phone's first screen. The header already says "Concept prototype, not
  official", and each row also carries "Demo". One compact banner per page, plus the per-row tag, would keep the
  safety without pushing status below the fold.
- **Malay parity (measured):** across 14 Malay pages, English hits were 0 on 9 pages and at most 2 on the rest. They were
  mostly product names ("Meet and Assist", "Relax & Refresh"); one airline string, "Self-service bag drop: counters
  F and G", is untranslated on the Malay flight page (usability-23). The accessibility page shows the translation
  notice. Malay quality still needs native review (integration hand-off, issue 4).

## 6. All findings

| ID | Severity | Area | Title |
|---|---|---|---|
| usability-01 | high | transport | No anti-touting or official-taxi guidance at the KLIA-to-city decision |
| usability-02 | high | shell | Home tiles and navigation silently fall back to the airport overview when a section is missing |
| usability-03 | high | search | The home's main search is flights-only and dead-ends on topic queries |
| usability-04 | high | flights | Departed flight's timeline still says "Now: board from 11:15" |
| usability-05 | high | map | Map gives an illustrative prayer-room pin a level and area that the directory says are unpublished |
| usability-06 | high | shell | About 440 px of airport chrome pushes every task answer below the phone's first screen |
| usability-07 | high | transit | Self-transfer verdict is 4,279 px down the phone page |
| usability-08 | medium | accessibility | No Assistance entry in the desktop header |
| usability-09 | medium | journey | Greeter view leads with long-stay parking and gives no pick-up point |
| usability-10 | medium | flights | Arrive-by time is 3,448 px down the phone flight page (8 scrolls at 125%) |
| usability-11 | medium | transit | No current status for the Aerotrain or the inter-terminal link |
| usability-12 | medium | facilities | Nursing rooms are absent from Facilities with no "not published" placeholder |
| usability-13 | medium | search | No airline-to-terminal answer in search or the concierge |
| usability-15 | medium | content | One destination, many labels |
| usability-17 | medium | content | Provenance and "not verified" notes are dense and inconsistently named |
| usability-19 | medium | parking | No price for short stays at the Terminal 1 car park; booking hand-off carries no dates |
| usability-24 | medium | home | Arriving mode does not add the entry checklist to the home |
| usability-14 | low | home | Two adjacent toggles with overlapping words (Departures/Departing) |
| usability-16 | low | content | Grammar and wording errors in demo, concierge and parking copy |
| usability-18 | low | flights | Full demo banner on every flight surface costs about 200 px of the phone's first screen |
| usability-20 | low | shell | The 39-airport chooser interrupts five tasks; KLIA is not pinned |
| usability-21 | low | concierge | Consent screen interrupts a suggested question; concierge hard to reach on phone |
| usability-22 | low | help | Phone numbers are 5,226 px down the phone Help centre |
| usability-23 | low | content | Airline check-in string untranslated on the Malay flight page |
| usability-25 | low | platform | A missing airport section returns "Page not found" under the title "Parking at Subang" |

Full evidence, expected behaviour, fixes and file pointers are in [`usability.json`](./usability.json).

## 7. A real usability study for MAHB to run before launch

### 7.1 Purpose and decisions it feeds

Validate the brief's and the strategy's targets with real passengers on the launch candidate, not this prototype:

| Metric | Target | Source |
|---|---|---|
| Task success, all core tasks pooled | at least 95% | Brief |
| Unaided success, each of the top 8 tasks | at least 90%; at least 80% among P2, P4, P5 and P6 participants | Brief; strategy section 7 |
| Median time on task | flight status 30 s; parking price 60 s; T1 to T2 plan 2 min; nearest prayer room 45 s | Strategy section 7 [assessment] |
| SUS | at least 80, reported with a 95% confidence interval, and compared with the current MAHB site | Proposed here [assessment]; 68 is the commonly cited average |
| Single Ease Question (1 to 7) after each task | median at least 6 | Proposed |
| Provenance comprehension | at least 80% correctly explain "Official", "Estimated", "Not published" and "Demonstration data" | Proposed; tests principles 2 to 4 |

The launch decision: any core task that misses its target at the agreed confidence (7.6) goes back for a fix and
a retest. It is not traded off against the pooled average.

### 7.2 Design

1. **Pilot** (week 1): 2 internal and 3 external sessions to debug scenarios, timing and the Malay script.
2. **Formative round** (weeks 2 to 3): moderated think-aloud, 5 to 6 participants per persona group (about 40),
   in Bahasa Malaysia and English. The output is an issue list; fix before the summative round.
3. **Summative benchmark** (weeks 5 to 6): moderated, no think-aloud, timed, on the launch candidate with the
   **official flight feed on staging** (not demonstration data), so that status and gate tasks are real.
4. **Baseline** (same weeks): a matched group runs the same tasks on the current MAHB site, giving the strategy's
   missing baselines (success, time and SUS on today's site).

### 7.3 Recruitment in Malaysia

| Persona | Who | Where and how | Summative n (phone / desktop) |
|---|---|---|---|
| P1 Business traveller | Flies from KLIA at least monthly | Klang Valley; professional panels; corporate travel desks | 7 / 4 |
| P2 First-time visitor | Has never visited Malaysia; English as a second language included | Remote, pre-arrival: panels in the largest source markets (MAHB to confirm from its traffic data); plus KLIA arrivals-hall intercepts with MAHB permission | 10 / 2 |
| P3 Family with infant | Child under 2, flown or flying within 6 months | Parenting groups, Klang Valley and Penang | 7 / 2 |
| P4 Wheelchair user | Uses a wheelchair or mobility aid when flying; include screen-reader and switch users across P4 to P6 | Disability organisations; self-advocacy groups; MAHB's assistance desk with consent | 10 / 3 |
| P5 Older traveller | 65 and over, prefers Bahasa Malaysia; half tested at 125% or larger text | Community centres, Klang Valley and Kota Kinabalu | 10 / 3 |
| P6 Neurodivergent traveller or parent | Autistic or ADHD adults, or parents of autistic children (parents only for minors) | Autism organisations (for example NASOM); Butterfly Effect registrants with MAHB's help | 10 / 2 |
| P7 Self-transfer | Has self-transferred T1 to T2 or T2 to T1 | Intercepts at both terminals' check-in halls; budget-airline traveller groups | 4 / 2 |
| P8 Domestic commuter | Flies weekly or more, including Subang, Penang, Kota Kinabalu or Kuching | Workplace recruitment in Penang, Kota Kinabalu and Kuching | 4 / 3 |
| P9 Greeter | Has collected someone at KLIA in the last 6 months | Klang Valley panels; arrivals-hall intercepts | 2 / 3 |
| **Total** | Quotas: at least 40% Bahasa Malaysia sessions; Android majority on phones (match the analytics once available); mix of states | | **64 / 24** |

Devices: participants' own phones where possible, with a throttled 4G profile for half the sessions and a roaming
profile for P2 and P7. In-terminal intercepts (15 minutes, 2 tasks) add realism: noise, a bag in one hand, time
pressure. Incentives (assessment): about RM100 to RM150 for a 60-minute session and RM50 for an intercept, paid
in a way that suits each group.

Consent and data: under the Personal Data Protection Act 2010, consent forms in Bahasa Malaysia and English,
recordings stored in Malaysia and deleted after analysis, no booking or passport data, and accessible formats for
consent (large print, easy read, screen-reader-ready).

### 7.4 Tasks

Scenarios are written without interface words (no "Meeting mode", "tile", "concierge"). Each participant does the
**8 core tasks** (strategy tasks 1, 3, 4, 5, 6, 7, 9 and 10) plus their persona's two tasks from section 3.
Order is counterbalanced, with a 5-minute ceiling per task (3 minutes for flight status).

| # | Scenario (example wording) | Success state |
|---|---|---|
| 1 | "Your flight MH 570 leaves tonight. Find out whether it is on time and where you go." | States status, terminal and gate |
| 3 | "You fly at 18:55. What time should you be at the airport?" | States the arrive-by time and that the airline sets deadlines |
| 4 | "You land at KLIA Terminal 1 and need to reach KL Sentral. How will you go and what will it cost?" | Names an official option, its fare and validity; states where not to accept rides |
| 5 | "You will park at KLIA for three days. How much will it cost, and where would you book?" | States a price per car park, or "not published" plus the official route; reaches the booking hand-off |
| 6 | "Your cousin lands from Bali tonight. When should you be in the arrival hall, and where can you pick her up?" | States an exit estimate, the waiting area and a pick-up point |
| 7 | "You are at Terminal 1 and need a prayer room (or a nursing room)." | States its location and side of security, or "not published" plus whom to ask |
| 9 | "You land at Terminal 1 at 10:00 and fly from Terminal 2 at 13:00 on a separate ticket. Is that enough time? What must you do?" | States the verdict, the steps and what to do if it is tight |
| 10 | "You use a wheelchair. Arrange help for your trip." | States the request route and lead time |

### 7.5 Measures and probes

- **Task success**: the participant states the correct answer, checked against a key. Partial counts as failure.
- **Unaided**: success with no moderator help, no external search engine and no phone call. Success after a wrong
  turn is recorded separately.
- **Time on task**: from reading the task card to stating the answer. Report the median and the geometric mean with
  a 95% confidence interval.
- **Behaviour**: interactions, scrolls, wrong turns and first-click accuracy (recorded on screen).
- **SEQ** after each task; **SUS** at the end (a validated Malay translation, or a back-translated version piloted
  in week 1).
- **Comprehension probes** after the tasks: show a card with "Official", "Estimated", "Suggestion", "Not
  published" and "Demonstration data", and ask what each means and whether it would change what they do.
- **Trust**: "How sure are you that this answer is correct?" (1 to 7) after tasks 4 and 5.
- **Accessibility**: assistive-technology users complete the same tasks; log any barrier with its WCAG reference.

### 7.6 Analysis and decision rules

- Report every rate with an adjusted-Wald interval. With 64 phone participants per core task, **62 of 64 successes**
  gives a 90% lower bound of 0.906, which passes the 90% unaided target; 61 of 64 (0.885) does not.
- For the pooled 95% target (64 x 8 = 512 attempts), **at least 497 successes** (97.1%) keep the 95% lower bound at
  0.952. Alternatively, 59 consecutive successes on a task give 95% confidence that its true rate is at least 95%.
- For the 80% subgroup target (P2, P4, P5 and P6 together, n = 40), report the point estimate and interval, and
  treat any task below 80% as a launch blocker.
- Compare time and SUS with the baseline group by Mann-Whitney U and report effect sizes; the strategy's time
  targets pass on the median.
- Rate severity of each observed issue (frequency x impact x persistence) and link it to the findings in this
  document, so that fixed issues can be retested.

### 7.7 Timeline and outputs

About 8 weeks: recruit (2 weeks, overlapping the pilot), formative (1), fixes (2), summative and baseline (2),
analysis (1). Outputs: per-task success and time with intervals, SUS, an issue log with severities, a highlights
video with consent, and a short decision note for the launch board.

## 8. Evidence and how to reproduce

- Server: `npx next start -p 3103` from the project folder (production build already present; stopped by PID
  afterwards).
- Task scripts and raw results were kept outside the repository in the evaluator's scratch folder
  (`qa-scratch/usability/`): `tasks.js` (the 18 scripted tasks with the counting rules above), `results.json`,
  `results-final.json` (with modelled times) and `pages.json` (page measures). To rerun on another day, pick flight
  numbers from `/api/flights?airport=kul&direction=d&limit=200`, because the demonstration schedule follows the clock.
- Commands used for spot checks: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3103/en/<airport>/<section>`
  for section availability; `POST /api/concierge` with `{"question":"Which terminal does AirAsia use at KLIA?"}`
  (answered "I could not match that to one topic").
