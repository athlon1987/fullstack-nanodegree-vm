# Review panel: consolidated verdict

Date: 18 November 2026. Compiled by the head of product quality from the three independent panel reviews. Nothing
in this summary is new testing: every figure comes from the panel reports or, where marked **[QA]**, from the five QA
evaluations that ran on the same build today.

| Review | Members | Report | Weighted score |
|---|---|---|---|
| Executive and commerce | (A) chief digital officer of an international airport group; (B) digital commerce specialist | [`exec-commerce.md`](exec-commerce.md), [`.json`](exec-commerce.json) | 72.5% |
| First-time traveller and accessibility | (A) first-time international traveller with an elderly parent, Malay-first, mid-range Android; (B) wheelchair user with low vision, magnifier and screen reader | [`first-time-access.md`](first-time-access.md), [`.json`](first-time-access.json) | 68.5% |
| Design director and frequent traveller | (A) UX and digital product design director; (B) monthly KLIA business traveller who uses Changi, Heathrow and Hong Kong | [`ux-frequent.md`](ux-frequent.md), [`.json`](ux-frequent.json) | 71.5% |

The 64 panel findings, with the 86 findings of the five QA evaluations and 14 from the earlier documentation review, are merged, prioritised and assigned to work packages in
[`../fix-backlog.md`](../fix-backlog.md). Backlog ids (for example A-01) are given below so each criticism can be
traced to its fix.

---

## Verdict

**Not ready for public launch.** "We would fund it to launch, not launch it as is" (executive and commerce, verdict
(A)). The other two reviews reach the same conclusion in their own terms.

- **Score.** The panel averages **70.8%** on the benchmark rubric (68.5 to 72.5). That is far above MAHB today
  (42.5%) and **below Heathrow (79.0%)**, the best single benchmark, the best-of-each-dimension composite (83.0%) and
  the strategy's own target (90.5%). On the benchmark matrix it sits level with Dubai (71.0%) and Hamad (69.0%), and
  behind eight of the ten benchmark airports.
- **What leads the world.** One-field flight search across the network with the terminal resolved; a sourced,
  dated journey timeline per flight without an account; a T1 to T2 self-transfer planner; English and Malay at parity;
  the lightest pages in the benchmark set with no third-party requests. All three reviews say no benchmark combines
  these.
- **What fails.** On a phone the answers sit below about 440 px of airport chrome. As a revenue channel it is
  weaker than the site it replaces: nothing can be bought and Fast Track, which MAHB sells today, does not exist
  anywhere in the product. There is no live data path, no failure state and no operational status layer. The journey
  timeline tells passengers to check in after check-in has closed and to board a flight that has left. Alerts stop
  when the page closes and do not exist on iPhone Safari. For a wheelchair user, the accessibility layer "is empty
  where it matters" and the needs-aware timeline "is built but not wired".

In the panels' own words:

- Executive (A): "Strategically it is the right product. Operationally it is not yet an airport website."
- Commerce (B): "As a revenue channel the prototype is, today, weaker than the site it replaces."
- First-time traveller and accessibility: "It is not yet a benchmark for these two personas ... Persona B cannot
  travel with confidence."
- Design director and frequent traveller: "The redesign is a large step forward ... It does not yet set a new global
  benchmark."

No reviewer tested with real passengers, and no physical screen reader was used. Every task outcome below comes from
scripted walkthroughs and expert judgement.

---

## Scores

Scale 1 to 5 in half points (3 = competent major airport, 4 = strong with evidence, 5 = best in class, verified
first-hand). The panels scored the design as if production data were connected, except **info** and **commerce**,
which were scored on what is actually there. Benchmark figures are from
[`docs/research/benchmarks/matrix.json`](../../research/benchmarks/matrix.json) (calibrated expert assessments;
differences of up to about 3 points are within the method's uncertainty). Targets are from
`docs/strategy/benchmark-report.md` section 6.2.

| Dimension | Weight | Exec and commerce | First-time and access | Design and frequent | **Panel average** | Best benchmark (who) | Heathrow | MAHB today | Target |
|---|---|---|---|---|---|---|---|---|---|
| ui: UI and brand | 10% | 4.0 | 4.0 | 4.0 | **4.00** | 4.0 (Haneda, Schiphol, Changi, Dubai, Hamad) | 3.5 | 2.5 | 4.5 |
| ux: task efficiency | 20% | 4.0 | 3.5 | 4.0 | **3.83** | 4.0 (seven sites) | 4.0 | 2.0 | 4.5 |
| info: completeness and accuracy | 15% | 3.0 | 3.0 | 3.0 | **3.00** | 4.5 (Hong Kong, Incheon) | 4.0 | 2.0 | 4.5 |
| flight: live flight and journey | 15% | 4.0 | 4.0 | 4.0 | **4.00** | 4.5 (Heathrow, Haneda, Schiphol, Istanbul, Incheon, Hamad) | 4.5 | 2.5 | 5.0 |
| mobile | 10% | 3.5 | 3.5 | 3.5 | **3.50** | 4.0 (Heathrow, Schiphol, Changi) | 4.0 | 2.0 | 4.5 |
| nav: navigation, search, accessibility | 10% | 4.0 | 3.5 | 4.0 | **3.83** | 4.0 (Hong Kong) | 3.5 | 2.0 | 4.5 |
| ai: personalisation and AI | 10% | 3.5 | 3.0 | 3.0 | **3.17** | 4.0 (Heathrow, Istanbul) | 4.0 | 2.0 | 4.0 |
| commerce | 5% | 2.0 | 2.0 | 2.0 | **2.00** | 4.5 (Heathrow, Changi) | 4.5 | 2.5 | 4.0 |
| perf: performance, security, reliability | 5% | 3.5 | 3.5 | 3.5 | **3.50** | 3.5 (Dubai) | 3.0 | 1.5 | 5.0 |
| **Weighted** | | **72.5%** | **68.5%** | **71.5%** | **70.8%** | **83.0%** composite | **79.0%** | **42.5%** | **90.5%** |

Benchmark leaders on the same rubric (weighted, from the matrix): Heathrow 79.0% (medium confidence), Haneda 77.5%
(high), Schiphol 77.0% (low), Istanbul 76.5% (high), Changi 76.5% (low), Hong Kong 75.5% (medium), Incheon 74.5%
(high), Dubai 71.0% (low), Hamad 69.0% (medium), Munich 66.5% (high), MAHB today 42.5% (medium).

What the table says:

- **No dimension beats the best benchmark.** The product only equals the leaders on ui and perf. It is below them
  on every other dimension.
- **Commerce (2.0) is below MAHB today (2.5).** All three reviews scored it 2.0 with medium to high confidence.
- **Info is the largest single gap.** At 3.0 against Hong Kong and Incheon's 4.5, info accounts for 4.5 of the
  12.2 points between the panel average and the composite. Commerce costs 2.5 points and AI 1.7.
- **Confidence is medium on almost every score.** Only info and commerce reach high confidence.

**Where the scores disagree.**

- ux: 3.5 from first-time and access against 4.0 from the others. The answers she needs are deep in long pages at
  125% text, the needs control is not wired, and caveat blocks get in the way.
- nav: 3.5 from first-time and access against 4.0. The reasons are the Label in Name failure, focus not moved after
  navigation, duplicate route options, access words that return nothing, and no Assistance link in the desktop header.
- ai: 3.5 from executive and commerce against 3.0 from the other two. The other two put more weight on concierge
  answers that miss the question asked and on personalisation that is not wired.

**Projections (judgement, not scores).**

| Review | Projection |
|---|---|
| Executive and commerce | 79.5% with production data and its launch gates |
| First-time and access | 78% with production flight, facility and accessibility data and its must-fixes |
| Design and frequent | 77% with MAHB data; 83 to 84% if its seven must-fixes also land |

Every projection lands level with Heathrow or the composite. None reaches the 90.5% target. Commerce and AI remain
the gap after the projections.

---

## The ten questions

### Q1. Is this genuinely easier to use than Changi?

**Combined answer: easier for finding a flight and planning a journey on the open web; not easier for anything a
passenger pays for; not proven with passengers.**

- **Executive and commerce.** The home's first screen has the airport picker, direction switch and flight field with
  no consent wall, and "MH 939" returned terminal, time and status in 101 ms. Changi's phone home is half covered by a
  cookie overlay and its flight listing did not load in the project's captures. But Changi lets a passenger reserve
  duty free and ties rewards to parking; here nothing can be bought.
- **First-time and access.** Yes for the departing task (3 interactions, no account). At 125% text, though, pages run
  13,303 px (flight), 14,089 px (home) and 18,447 px (transport), so "easier" depends on not needing large text. For
  the wheelchair user the step-free route planner beats Changi's PDF sensory map. Missing toilet, lift and step-free
  transport data leave her "no better informed than she would be at Changi".
- **Design and frequent.** Easier mainly because it is calmer: no carousel, consent overlay or promotions above the
  answer. Changi's typography is the stronger brand statement.
- **Disagreement.** The panels agree on the direction. They differ on how much: first-time and access makes the claim
  conditional on text size and missing accessibility data. The executive panel stresses that neither claim has been
  tested with passengers.

### Q2. Is flight discovery faster and clearer than Heathrow?

**Combined answer: clearer, and faster in the lab, but the speed is measured on data generated in the browser, and
clarity is undermined by defects Heathrow does not have.**

- **Faster.** Measured:
  - Design and frequent: 1 interaction, answer on the first phone screen at 450 px, 0.10 to 0.14 s after Enter.
  - First-time and access: 3 interactions and 4.9 s to the flight page.
  - Executive and commerce: inline result in 101 to 114 ms.
  - Heathrow's field covers one airport, and its departures page showed an error with no last-known data in the
    project's capture.
- **Clarity defects named by the panels:**
  - The timeline's "Now" step contradicts the status (B-02).
  - The status card gives one cabin's check-in row (B-12).
  - Codeshare URLs return "not found" (B-14).
  - The gate is 1,306 px down the phone page (B-03).
  - The first board row is at 1,173 to 1,185 px, or 1,706 px at 125% text.
  - Boards open 45 minutes in the past, on departed flights (B-16).
  - Enter on a single exact match does nothing (A-03).
- **Disagreement.** First-time and access says "yes, clearly". Design and frequent says faster "yes, measured" and
  clearer "mostly". The executive panel says clearer yes but **faster unproven**: Heathrow's speed comes from live data
  and wait times, while this product's flights are generated in the browser, so it has never been measured against a
  real feed.

### Q3. Is the visual design as refined as the best global consumer products?

**Combined answer: not yet.** All three reviews give ui 4.0, equal to the best airport sites. The design and frequent
review places it at about 80% of the way to the best consumer products (Apple, Airbnb, Stripe).

What holds it back, named by the panels:

- **Label inflation.** The home has 78 upper-case micro-labels, 86 monospaced runs and 13 font sizes (A-14).
- **Provenance chips on nearly every card.** Facilities has 21 "N sources" toggles. The executive panel says this
  "reads as an information system rather than a premium brand".
- **Polish defects.** Section tabs are clipped mid-word at 1280, 1440 and 1920 px ("Connections anc", "rview") (A-13),
  and the floating search button covers the "Lounges" tile (A-11).
- **Phone first screens are mostly repeated chrome** (A-01).
- **The map still looks like a wireframe.**
- **The hero is a marketing line.** The italic display h1 "Your journey, beautifully connected." gets the most
  prominent place on a page that otherwise answers questions. First-time and access calls it "the least useful text
  on the screen".
- **Phone at large text.** On desktop the design is "close" to the best consumer products (first-time and access); on
  a phone at large text "the hierarchy breaks down".

**Disagreement: photography.** The executive panel counts the lack of photography and of any "sense of Malaysia
beyond line art" against the design, and says retail and lounges need product imagery to convert. The design director
counts "no stock photography" as part of the restraint that already reaches consumer-product level. The panel does not
resolve this. It agrees that the current style has no slot for commercial imagery.

### Q4. Can passengers complete their most important tasks with minimal friction?

**Combined answer: only the flight-status task clearly meets the bar. Every commerce task fails or ends in a hand-off,
and the accessibility tasks a wheelchair user travels on fail.**

| Task | Result across the panels |
|---|---|
| Flight status, terminal and gate | Yes: 1 to 3 interactions |
| KLIA Ekspres fare and time | Yes, with dated fares, but 2.2 phone screens of scrolling |
| When to arrive | Yes, but on the eighth phone screen at 125% text; no "leave home by" |
| Where to check in | Contradictory: "shown nearer the time" on the status card and Row H in the timeline; or Row H given to a business traveller |
| T1 to T2 self-transfer verdict | Yes, but 2,943 px down the page with default inputs |
| Save and return without an account | Yes |
| Follow a flight with alerts | Partial: 5 interactions and about 8 screens of scrolling; alerts only while the page is open; none on iPhone Safari |
| Parking price for 3 days | Partial: "At most RM 96" for one car park; Terminal 1 car park "Not verified"; estimate at 2,206 px |
| Lounge with price | Partial: location and hours, no price or access rules |
| Fast Track | **Fails**: not in the product; the concierge answers with a hidden-disability programme |
| Buy parking, a lounge, a rail ticket or duty free | **Fails**: nothing can be bought in the product |
| Immigration as a Malaysian with an elderly parent | **Fails**: no autogate or counter guidance |
| Accessible toilet near my gate | **Fails** |
| Step-free from arrival to taxi | **Fails**: level change unnamed, taxi counter not mapped, step-free status of every mode unconfirmed |
| Arrange wheelchair assistance | Partial: Malaysia Airlines' rule is clear; other airlines and the airport's own service are not; no timeline shows it |

- **Disagreement.** None on outcomes. The panels differ on the cause. The design director says the friction "is
  mostly layout, not flow". First-time and access points to missing data and unwired needs. The executive panel points
  to integrations and data.

### Q5. Is the information accurate, complete and trustworthy?

**Combined answer: trustworthy in method, incomplete in substance, and not fully accurate.**

- **Trustworthy (unanimous).** Every changeable fact carries a source and an as-of date, unknowns say "Not
  published", and the dated KLIA Ekspres fare change is exemplary.
- **Complete: no (unanimous; info 3.0 from all three).**
  - Transport has 22 "not published" or "not verified" mentions, facilities 21 to 22, parking 17 and lounges 9.
  - No car park has a verified rate.
  - 8 outlets, with hours for 0 of 8.
  - Only 3 of 39 airports go beyond an overview and flights.
  - Accessible toilets, lifts, step-free transport and accessible bays are all missing.
  - Fast Track content does not exist.
- **Accurate: not fully.**
  - Two logic errors give wrong guidance on the day of travel: the timeline's "Now" step (B-02) and the check-in row
    (B-12).
  - The "not verified" note on the flight and transport pages contradicts the shop and lounge pages (D-05).
  - The status card and timeline disagree about check-in (B-12).
- **Disagreement: does transparency equal trust for an operator?**
  - The frequent traveller finds it more trustworthy "than any airport site I use".
  - The chief digital officer says that is honest for a concept, but an operator "cannot hedge its own operations".
    The prototype cites news sites, travel blogs, trip.com, threads.com and x.com, and an operator must be the source
    (D-06).
  - First-time and access says the honesty is admirable, but the repeated caveat blocks "erode persona A's confidence
    more than they inform her" (D-05).
- **[QA] Evidence the panels did not have, which strengthens the criticism.**
  - The content-integrity evaluation found 9 records tagged "Official" that rest only on news reports, aggregators or
    a blog. They include the KLIA Ekspres fare and journey time, the Aerotrain closure and the refund rule. The trust
    signal itself is wrong in places (D-01).
  - 47 to 52 of 53 KLIA board rows have no demonstration label in view (B-05).

### Q6. Is the mobile experience exceptional?

**Combined answer: no. "Good, not exceptional" was the verdict of all three reviews; mobile is 3.5 from each, against
4.0 for Heathrow, Schiphol and Changi.**

**Strengths:**

- A bottom tab bar with a central search.
- Search in the first screen of the home.
- No sideways scroll at 360 to 390 px on almost every page.
- Malay by default on a Malay phone.
- Text settings that persist across pages.
- Offline support.
- Pages of 0.63 to 0.78 MB.

**Weaknesses:**

- On every airport sub-page the h1 starts at about 440 px of a 664 px screen, or 724 px at 125% text, under the bottom
  bar.
- Pages run 10,000 to 18,000 px long.
- Fixed chrome takes 28% of a magnified screen, and the floating search button covers text.
- Mobile TBT is 0.66 to 1.43 s in the panels' runs. **[QA]** It reaches 2.0 s on /ms, and early taps are lost during
  hydration.
- iPhone users get no alerts.
- Malay tab-bar labels run together at 360 px.

There was no disagreement on this question.

### Q7. Does it support MAHB's commercial and operational objectives?

**Combined answer: commercially, no; it is a regression. Operationally, the architecture does and the product does not
yet.**

- **Commercial (unanimous).**
  - There are zero conversion paths, and Fast Track is missing.
  - The parking link drops the dates and carries no attribution.
  - Lounges have no price or booking, and retail has 8 outlets with no hours.
  - With no analytics, none of the strategy's commercial metrics can be measured.
  - The commerce specialist: the product "loses every sale at the same three points: no price on the page, no context
    passed to the seller, and no attribution back".
  - First-time and access: an elderly parent and a wheelchair user are natural buyers of Meet and Assist, lounges,
    porters and premium parking, and the product does not connect needs to services.
- **Disagreement on operations.**
  - First-time and access ("operational, yes") and design and frequent ("yes, in large part") credit the notices
    framework, the Aerotrain closure on the home, the anti-touting advice in the arrival timeline, the transfer
    planner and the dated fares.
  - The executive panel is harder: there is no live data path, the official provider "throws", there is no failure
    state, no status layer for the Aerotrain or immigration, queue times are rendered nowhere, and "every notice is a
    code change", which it calls "unacceptable for disruption".
  - The panel's combined position takes the stricter view, because the other two reviews did not test feed failure
    or publishing.

### Q8. Is it differentiated enough to establish a new international benchmark?

**Combined answer: differentiated, yes; a new benchmark, no.**

The differentiators are real and were observed first-hand by all three reviews:

- one flight search across the network with the terminal resolved;
- provenance and dates on every changeable fact, with fare changes shown before they happen;
- an account-free journey timeline with greeter and transfer views;
- a T1 to T2 self-transfer planner;
- a step-free route planner with two walking paces;
- English and Malay at parity, with dark mode;
- the lightest pages in the set and no third-party requests.

But the panel average of 70.8% is 8 points below Heathrow and 20 points below the strategy's target. Even the most
optimistic projection (83 to 84%) only reaches the best-of-each-dimension composite.

**Disagreement: what would make it a benchmark.**

- **Executive and commerce:** something no leader has, such as one basket from the flight page across parking, Fast
  Track and lounges, plus a live status layer across the network.
- **First-time and access:** the needs-aware timeline wired up, and the accessibility data filled.
- **Design and frequent:** five design fixes:
  - the home knows my flight;
  - the timeline never contradicts the status;
  - alerts work on iOS and by e-mail;
  - answers come first on a phone;
  - Fast Track and lounge entry points exist.

### Q9. The most significant remaining weaknesses

The three ranked lists combined; see the next section.

### Q10. What must be improved before public launch?

The three must-fix lists and the executive panel's launch gates combined; see
[What must be improved before public launch](#what-must-be-improved-before-public-launch). The panels agree on the
items. They differ only in emphasis:

| Review | Emphasis |
|---|---|
| Executive and commerce | Live data, operations publishing, commerce, governance and measurement |
| First-time and access | The anxious traveller on a phone at large text, and the wheelchair user |
| Design and frequent | Product logic and phone layout |

---

## Ten most significant remaining weaknesses

Ranked by how many reviews named them and how badly they fail a top task. Each comes with its backlog items.

1. **On a phone the answer is not on the first screen.** Named by all three reviews.
   - About 440 px of airport chrome (banner, clock, terminal chips, 9 tabs, breadcrumb) sits above every h1. At 125%
     text the h1 is at 724 px, under the bottom bar.
   - Measured answer positions: gate at 1,306 px, first board row at 1,185 px, KLIA Ekspres fare at 1,467 px, parking
     estimate at 2,206 px, transfer verdict at 2,943 to 4,279 px, alerts at 5,321 px.
   - Backlog: A-01 (critical), B-03, C-01, C-03, A-11.
2. **Commercially weaker than the site it replaces.** Named by all three reviews.
   - Fast Track, which MAHB sells today, is absent from search, the concierge, the content and the timeline.
   - Nothing can be bought.
   - The parking hand-off drops the dates and carries no attribution.
   - Lounges have no price or rules, and retail has 8 outlets with no hours.
   - Commerce scores 2.0, below MAHB's 2.5.
   - Backlog: D-02, C-01, B-13, C-05, C-11, E-17.
3. **No live data path and no operational layer.** Named by executive and commerce, and by design and frequent.
   - The official flight provider is a stub that throws, and flights are generated in the browser.
   - No last-known-data or failure state exists.
   - There is no status for the Aerotrain, the inter-terminal link or immigration, and queue times are rendered
     nowhere.
   - Notices need a developer and a deploy.
   - Backlog: B-09, B-01 (critical); external parts OOS-01 and OOS-02.
4. **Wrong guidance on the day of travel.** Named by design and frequent, and first-time and access.
   - The timeline says "Now: check in" after check-in closed, and "Now: board" on a flight that left hours earlier.
   - The status card gives Economy's Row H to a business traveller.
   - The card says check-in is "shown nearer the time" while the timeline names the row.
   - Backlog: B-02, B-12.
5. **Following a flight does not work where it matters.** Named by executive and commerce, and design and frequent.
   - Alerts arrive only while the page is open, and there are none on iPhone Safari.
   - There is no e-mail option.
   - The control sits about 8 phone screens down.
   - BR-04 is a Must.
   - Backlog: B-04; delivery is OOS-10.
6. **Travellers with access needs cannot plan with confidence.** Named by first-time and access, and design and
   frequent.
   - The assistance step exists in code, but no control can switch it on.
   - Accessible toilets, lifts, step-free transport and accessible bays are missing.
   - The hub's "Show on the map" link leads to "Not on this map yet".
   - Label in Name (WCAG 2.5.3, Level A) fails on every airport page, and CI missed it.
   - Focus falls to the footer after navigation.
   - Transport reflows sideways at 320 px.
   - Backlog: B-11, D-04, D-11, A-02 (critical), A-05, A-16, C-08.
7. **Search, the concierge and the home do not answer the question asked.** Named by all three reviews.
   - The home's main search is flights-only and dead-ends on "parking", "lounge" and "fast track".
   - "lift", "buggy" and "troli" return nothing.
   - The concierge buries the KLIA Ekspres fare, cannot say which terminal an airline uses, and ignores "accessible".
   - The home forgets the visitor's saved flight.
   - Backlog: A-03 (critical), A-12, B-08, A-08.
8. **Content is thin and not operator-grade.** Named by all three reviews.
   - Only 3 of 39 airports go beyond an overview and flights.
   - No car-park rate is verified.
   - Sources include blogs, trip.com, threads.com and x.com.
   - A warning quotes a blog's report of an RM2,084 bill.
   - A stale gap note contradicts the product.
   - The Malay is a draft.
   - Backlog: D-16, D-06, D-05, D-03; external parts OOS-06, OOS-08 and OOS-14.
9. **Noise competes with answers and raises anxiety.** Named by all three reviews.
   - Provenance chips appear on nearly every card.
   - The home has 78 micro-labels.
   - A 90-word "not verified" block opens step 1 of every departing journey, followed by the parking-bill warning.
   - Backlog: A-14, D-05, D-06.
10. **Performance misses its own budgets on the pages that matter.** Named by all three reviews.
    - Mobile TBT is 0.66 to 2.0 s, and flight-page LCP is 4.4 to 4.8 s.
    - Lighthouse mobile scores are 56 to 92 against a target of 95.
    - **[QA]** Taps made during home hydration take up to 1.5 s, and half of the earliest taps are lost.
    - Backlog: E-01 (critical), A-09, B-06, E-02, E-03.

---

## What must be improved before public launch

The panel separated prototype-only conditions (demonstration flights, illustrative map positions, unverified
rates, draft Malay) from product defects. **Every item in the first list is a product defect that stays even with
production data connected.**

**1. Fix in the product: all P0 in the backlog, this round.**

- **Timeline state.** Steps get an end time; a step is never "Now" after its deadline; add closed, departed and
  cancelled states. Show check-in rows per cabin. Backlog: B-02, B-12.
- **Answer first on a phone.** A one-row airport header on task pages, with the h1 at or above 200 px. A summary line
  on the flight page ("Be at KLIA T1 by 19:30 · Check in Row H · Boarding 21:45"). The price matrix first on parking
  and the verdict first on transit. Backlog: A-01, B-03, C-01, C-03, A-11.
- **The home knows the saved flight.** Backlog: A-08.
- **One search box.** The home field falls through to site results. Search learns access and service words. The
  concierge leads with the asked-for answer and honours "accessible". Backlog: A-03, A-12, B-08.
- **Fast Track.** A sourced record, findable in search and the concierge, and offered after the security step on
  departing flights. Backlog: D-02.
- **Follow a flight.** One "Follow" control beside Save, with e-mail and add-to-home-screen paths where push is
  unavailable. Backlog: B-04.
- **Assistance.**
  - A "My needs" control wired into every timeline. Backlog: B-11.
  - Airline assistance rules for AirAsia and the main carriers. Backlog: D-04.
  - Fix Label in Name and focus after navigation. Backlog: A-02, A-05.
  - Full A/AA axe tags in CI. Backlog: E-06.
- **Caveats and provenance.**
  - Take the "not verified" block out of journey steps. Backlog: D-05.
  - Reword the parking warning as a rule. Backlog: D-06.
  - Quieter provenance, with one set of tag names. Backlog: A-14.
  - "Official" only when an official source supports the fact. Backlog: D-01.
- **Demo labels in view on every board row and flight value.** Backlog: A-04, B-05.
- **Performance budgets met and enforced in CI.** TBT 200 ms, CLS 0.1, LCP 2.5 s. Backlog: E-01, A-09, A-10, B-06,
  B-07, E-02, E-03.
- **[QA] The security evaluator's pre-production list.** A body limit before read, a trusted rate-limit key,
  cross-site rejection, a cheap 404 for unknown flight ids, per-route limits and CI with security gates. The
  concierge launches in deterministic mode with no API key. Backlog: E-04, E-05, E-07, B-14, E-08, E-06.

**2. Have from MAHB and partners: launch gates that this round cannot close.**

- **Official flight feed**, with the failure states proven against it. OOS-01.
- **Status feeds and a notices CMS.** A notice can go live in under 5 minutes without a deploy, with bilingual
  approvals. OOS-02.
- **Official parking tariff and a booking deep link** with product, dates and a referral code. OOS-03.
- **Lounge access rules and prices**, and the Fast Track seller confirmed. OOS-04, D-02.
- **Content minimum for every international airport plus Kuching and Kota Kinabalu**: transport, parking,
  facilities with hours and location, and lounges. OOS-06.
- **Accessibility facility data for KLIA T1 and T2.** OOS-07.
- **Operator-grade sourcing; brand, legal and native-Malay review.** OOS-08, OOS-14.
- **Alerts delivered when the page is closed** (push and e-mail). OOS-10.
- **Edge limits on the chosen host, and security.txt.** OOS-11, OOS-12.

**3. Prove before launch.**

- **A moderated usability study** of the top eight tasks in English and Malay on phones, including screen-reader and
  magnifier users. The study plan is in `docs/qa/usability.md`. OOS-15.
- **Field Core Web Vitals on a mid-range Android** over Malaysian networks, not only lab runs on a shared container.
- **The commercial and north-star metrics measurable from launch day**: first-party aggregate analytics and campaign
  parameters (E-17), and partner referral codes (OOS-13).

The panel's position is that a limited public pilot is possible once the first list is closed. The product's
"Not published" states stand in for the missing data, as designed. A public launch is not possible until the second
and third lists are also closed.
