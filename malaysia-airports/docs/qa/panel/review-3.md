# Review panel, round three: consolidated verdict

Date: 22 November 2026, Kuala Lumpur time (21 November UTC). Compiled by the chair of the independent review panel
from three independent third reviews of the round-five production build (build `b4AW-Kxsx1vSRiJq7KWD0`), after fix
rounds four and five. Earlier verdicts: round one, [`panel-summary.md`](panel-summary.md); the second review,
[`re-review.md`](re-review.md) and [`re-review.json`](re-review.json). Fix rounds and their verification:
[`../verification.md`](../verification.md) (round four is F1 to F9, round five G1 to G9); fix logs
`../fixes/round4-*.md` and `../fixes/round5-*.md`. Machine-readable summary: [`review-3.json`](review-3.json).

| Third review | Lens | Report | Second review, this lens | Weighted score |
|---|---|---|---|---|
| Business | Airport digital executive: operations, flight information, commerce, multi-airport coverage, launch risk | [`review-3-business.md`](review-3-business.md) | 74.5% | **74.0%** |
| Design | UX and visual design director: hierarchy, density, interaction, phone ergonomics, navigation, search, concierge | [`review-3-design.md`](review-3-design.md) | 75.5% | **79.5%** |
| Inclusion | Accessibility specialist (WCAG 2.2 AA) and Malay-speaking first-time traveller: accessibility, language, trust | [`review-3-inclusion.md`](review-3-inclusion.md) | 74.5% | **75.5%** |
| **Panel** | Median per dimension | this file, [`review-3.json`](review-3.json) | 74.5% (median) | **75.5%** |

**Labels.** **[measured]** = observed on the running build by a reviewer, with the method named in that report.
**[chair]** = a check the chair ran for this summary (section 1.4). **[verification]** = a figure from
`verification.md`, round five, not re-measured by the panel. **[judgement]** = expert assessment.
**[fact-check]** = a correction made by the documentation fact-check after the panel reported, on the same build.

**What is prototype-only.** Every flight, gate, belt, check-in row, queue estimate, car-park space and alert is
demonstration data. `/api/flights?airport=kul` answers `"mode":"demo"` [chair]; the official flight provider is a
stub that throws on every data method; notices are a file in the code. There is no official feed of any kind.

---

## Verdict

**Not ready for public launch.** All three lenses reach this independently.

| Use | Ready now? | Basis |
|---|---|---|
| Stakeholder demonstration | **Yes**, as a labelled concept on demonstration data | Every page checked answered and rendered; demonstration data is labelled on every surface checked except the map's lifts in search results [chair]; the empty night board (about 22:55 to 05:05 Kuala Lumpur time) now explains itself |
| Moderated usability study on phones (English and Malay, including assistive-technology users) | **Yes**, and it is the most valuable next step | A plan exists ([`../usability-study-plan.md`](../usability-study-plan.md)); MAHB recruits and signs off (OOS-15). No study has been run |
| Closed KLIA pilot with recruited passengers | **Not yet** | 4 of the second review's 7 pilot conditions are met (section 4.1). CI with agreed TBT budgets, the official flight feed and a named notices owner are not. This panel adds three team conditions: the saved-flight failure, the concierge focus defect, and the two inaccurate sentences in the accessibility statement |
| Public launch | **No** | 3 of 13 team blockers from the second review are not met and 4 only partly; 0 of 10 MAHB blockers are met (sections 4.2, 4.3) |

- **Score.** The panel median is **75.5%** on the benchmark rubric (reviewers 74.0 to 79.5). The second review's
  median was 74.5%, so the panel moved **+1.0 point**, all of it from one dimension (ai, 3.5 to 4.0). The
  like-for-like mean is 76.3% (second review 74.8%; round one 70.8%). The product remains far above MAHB today
  (42.5%) and below Heathrow (79.0%, 3.5 points), the best-of-each-dimension composite (83.0%, 7.5 points) and the
  strategy's target (90.5%). On the matrix it is level with Hong Kong (75.5%). Its gap to Changi, Istanbul (1.0),
  Schiphol (1.5) and Haneda (2.0) is within the matrix's stated uncertainty of about 3 points; Heathrow's lead is
  just outside it.
- **What rounds four and five fixed** [measured by at least two reviewers; verification agrees]:
  - Status lines no longer stamp the clock or claim "No disruption"; they say "Status not available" and give the
    notices' own date.
  - Day-of-travel guidance is right in every state tried: a passed arrive-by time, a delay on one time basis, no
    "Done:" for unconfirmed steps, "Act now" inside an airline's notice period, and no invented notice period for
    AirAsia.
  - One fact, one answer: the parking page, the concierge and help give the same parking sentence.
  - Answer-first on phones for transport (fare at 431 px; was 1,821), transit (sticky verdict at 454 px) and the map
    (From and To above the drawing).
  - The concierge says when it cannot answer and names a contact, honours access needs and the named airline in
    English and Malay, and reads flights from the server feed.
  - All five commercial hand-offs carry a campaign parameter and a first-party beacon, counted in a store that
    survives restarts.
  - The flight page paints its answer first (LCP 1.22 s, was 4.2 to 4.9 s) and the empty night board explains
    itself (LCP 0.92 s, was 4.7 s) [verification].
- **What has not moved.** Everything that depends on MAHB: no live flight or operations data, notices in code, no
  verified parking price (0 of 4 KLIA car parks), nothing to buy, 3 of 39 airports beyond an overview and a board,
  no located accessibility facts or airline assistance rules, no alerts once the page is closed, third-party
  sourcing for MAHB's own building, no native Malay review.
- **What this review found or confirmed** [chair where marked]:
  - With a saved flight, one failed script fetch replaces the whole of `<main>` on the home and on My journey with
    "Something went wrong", and "Try again" does not recover once the connection returns [chair]. Verification
    recorded this as open issue 2, but as a card-level failure; it is page-level.
  - On ordinary laptop and desktop windows the concierge's sticky question box covers the suggestion that has
    keyboard focus [chair], contrary to the accessibility statement.
  - A future fare change is badged "In effect now" on the KLIA overview [chair].
  - Search and the concierge still miss some intents: "pharmacy" returns nothing, "kuching parking" returns other
    airports' pages, "lift" leads with unmarked demonstration lifts, "book me a taxi" lists six transport modes, and
    a Malay question about departure autogates leads with visitor and arrival-card content [chair].

**Caveat on every number in this document.** The scores are expert judgement on a working prototype that runs on
demonstration data. They are not the results of a user study. No passenger, disabled participant or physical screen
reader has used the product. Every review ran in Chromium only, with no WebKit, iPhone Safari or real device, at
one clock time each (05:46 to 06:47 Kuala Lumpur time). As in rounds one and two, ux, flight, mobile, nav, ai and ui
are scored as if production data were connected, while info and commerce are scored on what exists. Performance is
lab data from verification round five, measured on an unloaded container; no reviewer and not the chair
re-measured it, because other servers shared the machine, and none of it is field data.

---

## 1. Method

### 1.1 Three independent lenses

Each reviewer served the round-five production build on their own port with
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start`, drove it with Playwright Chromium
(`chromium.launch()`, no options), and stopped only their own process tree. None changed `src/`, `e2e/`, `scripts/`
or the configuration, rebuilt the product, or read the other two third reviews. Each read the second review and
the round-five verification first. The three sessions overlapped on one shared machine.

| | Business | Design | Inclusion |
|---|---|---|---|
| Time (Kuala Lumpur, 22 Nov) | 05:46 to about 06:10 | 06:04 to 06:25 | 06:07 to 06:35 |
| Port | 3302 | 3303 | 3304 |
| Clock | Real clock; browser clock fixed at 23:30 only for the night-board check | Real clock (outside the night window) | Real clock (outside the night window) |
| Viewports and settings | Desktop 1440 x 900; phone 390 x 844 (touch, Pixel 7 user agent) | Phone 390 x 844 first; desktop 1440 x 900; dark mode; 125% text | Desktop 1440 x 900; laptop 1280 x 720; phone 390 x 844 at 125% text, dark and high contrast; Malay 360 x 780 at 125%; 320 x 568 at 125%; 640 x 400 (200% zoom); 320 x 256 (400% zoom); WCAG text spacing; root text at 200%; OS and in-app reduced motion |
| Coverage | 31 URLs x 2 viewports (62 loads; 60 intended pages answered 200, 0 console errors, 0 third-party requests) | 49 pages and views (34 on the phone) | 41 pages in English and Malay |
| What was run | Saved flight on the home and My journey; Follow; needs; a cut flight feed; 5 commercial hand-offs with their beacons; 10 concierge API questions; 14 site and 4 home searches; night board; failed-chunk tests (every lazy chunk, then each of 14 alone); headers; sitemap counts; gzip HTML sizes | Vertical positions of answers; type sizes, upper-case elements, provenance tags and source toggles per page; 17 concierge answers (14 English turns measured); searches and palette focus; map, board and transit interactions | axe-core 4.14.1 (WCAG 2.0 to 2.2 A/AA), 70 scans; keyboard-only tasks; Tab walks of 40 to 75 stops in six window sizes with a covered-area measure; 17 concierge questions in two languages; 18 Malay pages scanned at 360 px; 28 "Official" tags traced; reduced motion; reflow |
| Screenshots viewed | 9 | 9 images holding 22 screenshots | 10 of 17 taken |
| Not done | Assistive technology; performance | WebKit; real devices; screen reader; performance | Physical screen reader; WebKit; participants; performance; failure states (quoted from verification) |

### 1.2 Scoring

- **Scale.** 1 to 5 in half points: 3 = a competent major airport; 4 = strong, with evidence; 5 = best in class,
  verified first-hand. No reviewer gave a 5.
- **Weights.** ui 10, ux 20, info 15, flight 15, mobile 10, nav 10, ai 10, commerce 5, perf 5.
- **Weighted result.** Sum of (weight x score), divided by 5, as a percentage.
- **Panel score.** The median of the three reviewers on each dimension, computed by the workflow. The chair has not
  changed any median.
- **Comparisons.** Round one used the mean of three reviews (70.8%); the round-three mean, 76.3%, is the
  like-for-like figure against it. The second review used the median (74.5%), as this round does.

### 1.3 Disagreements

No dimension differs by a point or more between reviewers, so no disputed score had to be settled on the build.
Four dimensions are identical across the three lenses (ui, info, flight, commerce). Five carry a half-point spread.
The chair checked the evidence behind each spread (section 1.4) and records which view it supports; the medians
stand.

| Dimension | Spread | The higher view | The lower view | What the chair's checks support |
|---|---|---|---|---|
| ux | 4.0 (business, inclusion) to 4.5 (design) | Design: the transport fare, transit verdict and delayed-flight fixes close the three ux reasons the second review gave | Commercial tasks still end in hand-offs; very long pages; no usability study | **4.0.** The design fixes are real, but the chair confirmed the overview's flight search at 2,236 px on a phone and the saved-flight failure, which takes away the returning passenger's main task on a weak connection |
| mobile | 4.0 to 4.5 (design) | Design: every key phone task answers on the first screen | Long pages; TBT over budget on mid-range phones [verification]; the saved-flight failure on weak Wi-Fi; device font scaling beyond 125% breaks the header and bottom bar | **4.0**, for the same reasons |
| nav | 4.0 to 4.5 (design) | Design: the palette and menu sheet are the strongest in the benchmark set | Cross-airport queries return another airport's page; in-page links and palette selections leave focus behind | **4.0.** Chair: "pharmacy" 0 results with no "not published" line; "kuching parking" led by KLIA, Penang and Kota Kinabalu; "lift" led by three unmarked demonstration lifts; "charging" returns the inter-terminal train and shuttle. Search still does not reliably answer the question asked. Same finding as the second review's chair |
| ai | 3.5 (business) to 4.0 (design, inclusion) | Honest fallback with a named contact; access qualifiers and the named airline honoured in two languages; flights read from the feed (13 of 17 questions led correctly for inclusion) | About half of business's ten questions got the answer asked; "now" questions ignore the queue data; answers open with "Here is what our sources say" | **Mixed.** The chair confirmed three of the misses (queue "right now", "book me a taxi", the Malay departure-autogate ordering) and one honest answer ("pharmacy": "Our sources do not publish where the pharmacy is at KLIA yet"). The fixes that lifted ai are verified by two lenses and by verification (6.1.4); the misses are equally real. 4.0 is the upper edge of what the evidence supports |
| perf | 3.5 (business) to 4.0 (design, inclusion) | Lab figures better than round four on the flight page and the night board; shell JavaScript halved [verification] | First-hand reliability: one failed script fetch blanks the home with a saved flight; CI never run; CSP `'unsafe-inline'` | **Business's reliability evidence is confirmed** and is more severe than verification describes (section 1.4, row 1). The other two lenses scored perf on lab figures alone and did not test the failure. The median of 4.0 stands, but reliability is the weakest part of this dimension |

Agreement is close partly because of shared inputs rather than independent evidence: all three took performance
from `verification.md`, and all three scored info and commerce on the same visible gaps. Each lens's scores rest on
independent observation where it measured first-hand: business on operations, commerce and failure states; design
on layout, density, search and the concierge; inclusion on accessibility and Malay.

### 1.4 Chair's checks on the running build

The chair served the same build on port 3305 with `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3305`,
from about 06:39 to 06:47 Kuala Lumpur time on 22 November (outside the night window, so no clock was fixed), drove
it with Playwright Chromium (`chromium.launch()`; service workers blocked; a fresh client address per context) and
`curl`, and stopped that process and its two children by PID. Performance was not measured. Side effect: the
server's default metric store wrote this session's counts to the git-ignored `.data/metrics.json`. The chair
checked points that one lens reported alone, that the lenses reported differently, or that bear on the pilot.

| Point | What the reviewers said | What the chair found [chair] | View supported |
|---|---|---|---|
| Failed script fetch with a saved flight | Business: the whole home `<main>` (4,932 to 97 characters) and My journey; "Try again" does not recover. Design: not reproduced; quotes verification. Inclusion: quotes verification. Verification G8 item 2: the saved-flight card and My journey's clear control show "Something went wrong" "in the page" | Saved MH 785 with "Save flight" (phone, 390 x 844). On `/en`, aborted each of the 14 lazy chunks one at a time: **2 of 14 each replaced the whole `<main>`** (5,019 to 97 characters: "Something went wrong. Please try again. The rest of the site still works. Try again. Back to home"). After removing the block, "Try again" left the error in place. On `/en/journey`, 2 of 10 lazy chunks did the same (4,162 to 97 characters), with the same result after "Try again" | **Business.** The failure is page-level, not card-level, and its recovery control does not work |
| Concierge focus under the sticky question box | Inclusion only | `/en/concierge` at 1280 x 720: Tab to "What is the cheapest way to get to KL Sentral?"; the button runs from 649 to 720 px, the sticky form starts at 651 px. axe was not run by the chair | **Confirmed.** Inclusion also found axe `target-size` on `/ms/concierge` at 1440 x 900 on 3 of 3 loads; verification recorded it once in an e2e run and not in 236 repeats (G3 item 5). The geometry explains both |
| Future fare badged "In effect now" | Business and design | `/en/kul` at 1440 x 900: "KLIA Ekspres adult fare: RM65 from 1 January 2027 … In effect now · 1 Oct 2026 to 31 Jan 2027"; at both sizes the same card also carries an "Estimated" chip | **Confirmed** |
| Overview flight search on a phone | Design only | "Find a flight at KLIA" at 2,236 px at 390 x 844 | **Confirmed** |
| Desktop board above the fold | Design: one row (798 to 850 px) | 1440 x 900: the first three flight links at 813, 865 and 917 px, rows about 52 px apart | **Confirmed in substance**: one full row and most of a second above the 900 px fold |
| Search gaps | Design: "pharmacy", "charging". Business: "kuching parking". Inclusion: "lift" | "pharmacy": "0 results … Nothing found", no "not published" line. "kuching parking": 22 results, led by parking at KLIA, Penang and Kota Kinabalu. "lift": 3 results, "Lifts to Levels 3 and 1", "5 and 1", "3 and 5", no illustrative marker. "charging": 2 results, the inter-terminal train and the free shuttle | **Confirmed**, all four |
| Concierge intents | Business: "now" questions. Design: "book me a taxi". Inclusion: Malay departure autogates | `POST /api/concierge` (airport KLIA): "What is the queue at immigration right now?" leads "Here is what our sources say about immigration and the autogates at KLIA.", first statement on visitor autogate eligibility, no queue figure and no "no live queue data" line. "Can you book me a taxi?" leads "To get to and from KLIA, our sources list Long Term Car Park shuttle, buses and coaches, KLIA Ekspres, KLIA Transit, airport taxi and e-hailing." In the `/ms/concierge` page, "Bolehkah ibu saya yang warga emas guna autogate semasa berlepas?" leads with a generic line, then the visitor autogate card (e-passport, MDAC), then "Lalui imigresen" (arrival), then "Tunjuk 3 lagi". Through the API the honest departing-citizen statement came first among the statements, so the ordering depends on context | **Confirmed**, all three; inclusion's ranking point holds in the page a passenger uses |
| Headers, feed and missing sections | Business | `/en`: `script-src 'self' 'unsafe-inline'`; `Permissions-Policy … payment=()`. `/api/flights?airport=kul`: `"mode":"demo"`. `/en/kch/parking` and `/en/lgk/transport`: 404 | **Confirmed** |

---

## 2. Scores

**Comparison figures, checked.** MAHB today 42.5% and Heathrow 79.0% match `airports[].weighted_pct` in
[`docs/research/benchmarks/matrix.json`](../../research/benchmarks/matrix.json), and both recompute from the
per-dimension scores. The composite, 83.0%, is the best benchmark score on each dimension with MAHB excluded,
recomputed by the chair from the matrix; the matrix does not store it. Round one's 70.8% is the panel average in
[`panel-summary.md`](panel-summary.md); the second review's 74.5% median (mean 74.8%) is in
[`re-review.json`](re-review.json). **All five figures are as stated in the brief; none needed correction.**

| Dimension | Weight | Business | Design | Inclusion | **Median** | Range | Round one (avg) | Second review | MAHB today | Heathrow | Composite (best: who) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ui: UI and brand | 10% | 4.0 | 4.0 | 4.0 | **4.0** | 4.0 | 4.00 | 4.0 | 2.5 | 3.5 | 4.0 (Haneda, Schiphol, Changi, Dubai, Hamad) |
| ux: task efficiency | 20% | 4.0 | 4.5 | 4.0 | **4.0** | 4.0 to 4.5 | 3.83 | 4.0 | 2.0 | 4.0 | 4.0 (seven sites) |
| info: completeness and accuracy | 15% | 3.0 | 3.0 | 3.0 | **3.0** | 3.0 | 3.00 | 3.0 | 2.0 | 4.0 | 4.5 (Hong Kong, Incheon) |
| flight: live flight and journey | 15% | 4.0 | 4.0 | 4.0 | **4.0** | 4.0 | 4.00 | 4.0 | 2.5 | 4.5 | 4.5 (Heathrow, Haneda, Schiphol, Istanbul, Incheon, Hamad) |
| mobile | 10% | 4.0 | 4.5 | 4.0 | **4.0** | 4.0 to 4.5 | 3.50 | 4.0 | 2.0 | 4.0 | 4.0 (Heathrow, Schiphol, Changi) |
| nav: navigation, search, accessibility | 10% | 4.0 | 4.5 | 4.0 | **4.0** | 4.0 to 4.5 | 3.83 | 4.0 | 2.0 | 3.5 | 4.0 (Hong Kong) |
| ai: personalisation and AI | 10% | 3.5 | 4.0 | 4.0 | **4.0** | 3.5 to 4.0 | 3.17 | 3.5 | 2.0 | 4.0 | 4.0 (Heathrow, Istanbul) |
| commerce | 5% | 2.5 | 2.5 | 2.5 | **2.5** | 2.5 | 2.00 | 2.5 | 2.5 | 4.5 | 4.5 (Heathrow, Changi) |
| perf: performance, security, reliability | 5% | 3.5 | 4.0 | 4.0 | **4.0** | 3.5 to 4.0 | 3.50 | 4.0 | 1.5 | 3.0 | 3.5 (Dubai) |
| **Weighted** | | **74.0%** | **79.5%** | **75.5%** | **75.5%** | 74.0 to 79.5 | **70.8%** | **74.5%** | **42.5%** | **79.0%** | **83.0%** |

The strategy target is 90.5% (`docs/strategy/benchmark-report.md`, section 6.2). Mean of the three reviewers:
76.3%.

**Confidence.** info is high for all three lenses. commerce is high for business and design and low for inclusion
(outside its lens). perf is medium for business (first-hand reliability evidence) and low for design and inclusion
(verification figures only). Every other score is medium.

### 2.1 What the table says

- **Since the second review: +1.0 point, from ai alone.** ai rose from 3.5 to 4.0 (design and inclusion +0.5,
  business unchanged). Every other median is unchanged. By lens: business −0.5 (perf), design +4.0 (ux, mobile, ai),
  inclusion +1.0 (ai). The mean rose 1.5 points (74.8% to 76.3%), because design's three half-point rises do not
  reach the median.
- **Since round one: +4.7 points on the median, +5.5 like for like on the mean.** ai +0.83, mobile, commerce and perf
  +0.5 each, ux and nav +0.17. ui, info and flight have not moved in three rounds.
- **Against the best benchmarks.** Equal to the best on ui, ux, mobile, nav and now ai. Above every benchmark on perf
  (4.0 against Dubai's 3.5), which is not like for like: lab Lighthouse on a local build without a CDN or traffic,
  against live sites. Below the best on info (3.0 against 4.5), flight (4.0 against 4.5) and commerce (2.5 against
  4.5).
- **The gap to Heathrow, 3.5 points (was 4.5).**

  | Dimension | Points | Main dependency |
  |---|---|---|
  | info | −3.0 | MAHB content and data |
  | commerce | −2.0 | MAHB and partners |
  | flight | −1.5 | Live data and alert delivery (MAHB and partners) |
  | ai | 0 (was −1.0) | |
  | ui, nav, perf | +3.0 in the product's favour | |
  | **Net** | **−3.5** | |

- **The gap to the composite, 7.5 points (was 8.5):** info −4.5, commerce −2.0, flight −1.5, perf +0.5.
- **The whole remaining gap is in info, commerce and flight**, and each depends mainly on MAHB, its partners or its
  feeds. The delivery team's fixes cannot close it alone [judgement].
- **Commerce is level with MAHB today (2.5)**, as in the second review; not above it.
- **Matrix position.** Level with Hong Kong (75.5%); behind Heathrow 79.0, Haneda 77.5, Schiphol 77.0, Istanbul 76.5
  and Changi 76.5; ahead of Incheon 74.5, Dubai 71.0, Hamad 69.0, Munich 66.5 and MAHB 42.5. Only Heathrow's lead
  exceeds the matrix's uncertainty of about 3 points.

### 2.2 Projections (judgement, not scores)

| Lens | Projection |
|---|---|
| Business | About 80% with MAHB's launch gates closed and the team's reliability and CI fixes (info 4.0, commerce 3.5, flight 4.5, perf 4.0): level with Heathrow, not clearly ahead |
| Design | No projection this round; the lens already scores 79.5%. Its second-round projection was about 80% with team fixes and about 85% with MAHB data |
| Inclusion | About 80% with MAHB's accessibility facts, the assistive-technology study and the team items |

None reaches the 90.5% target. The lead over Heathrow that the design lens records (79.5 against 79.0) is inside the
matrix's uncertainty and rests on six dimensions scored as designed, not on the product as it can be used today.

---

## 3. Movement since the second review, per dimension

| Dimension | Second review | Now (median) | Change | Evidence |
|---|---|---|---|---|
| ui | 4.0 | 4.0 | 0 | All three hold. The flight page is calmer (one Demo banner per view, 2 source toggles, 8 type sizes) and parking has 0 Demo tags on its cards [measured; verification G4]. Offset by the English home `h1` ("Your journey, beautifully connected."), 9 type sizes on 8 of 280 pages at 390 px (the home with a saved flight, the corporate hub, corporate news and about-this-prototype, in both languages) [verification], a Demo chip on every hour group of a filtered board, the map's route chip over the "Immigration and security" label, an "Estimated" chip on a notice [chair] |
| ux | 4.0 | 4.0 | 0 (design +0.5) | Design credits the transport fare at 431 px, the sticky transit verdict at 454 px, one time basis for delays and honest concierge fallbacks [measured]. Business and inclusion hold: purchases end in hand-offs; facilities runs to 15,451 px on a phone and the accessibility hub to 17,614 px at 125% text; the overview's flight search is at 2,236 px [chair]; the saved-flight failure [chair]; no study |
| info | 3.0 | 3.0 | 0 | Unanimous, high confidence. More honest (status semantics, one parking answer), no deeper: 0 of 4 KLIA car parks verified, 8 outlets, no lounge rules or prices, 36 of 39 airports overview-only or directory-only, no located accessibility facts |
| flight | 4.0 | 4.0 | 0 | The delayed state is right on the card, timeline and home; the night board explains itself; the flight page's `h1` is in the server HTML before the first hidden segment and paints at 1.22 s [measured; verification]; the concierge answers flight questions from the feed. Held at 4.0 by alerts that never reach a closed browser, e-mail follow as a demonstration, and a desktop board with about two rows above the fold [chair] |
| mobile | 4.0 | 4.0 | 0 (design +0.5) | Design: every key phone task answers on the first screen. Others: page length, TBT over 200 ms on most pages [verification], the saved-flight failure on weak Wi-Fi [chair], and the header and bottom bar breaking with device font scaling at 200% (inclusion) |
| nav | 4.0 | 4.0 | 0 (design 4.5, as before) | Named search fixes hold (Fast Track by terminal, smoking, Wi-Fi, taxi, accessible toilet). New gaps: "pharmacy", "kuching parking", "lift", "charging" [chair]; "lost and found" 39 options; focus after a palette selection or an in-page link stays on `<body>` or the Search button |
| ai | 3.5 | **4.0** | **+0.5** | Design and inclusion: "I can't answer that from our verified content" with the group line; wheelchair on AirAsia answered honestly in English and Malay; "tandas OKU" answered; a clarifying question when no airport is named; flight answers from the feed [measured; verification 6.1.4, B-09]. Business holds 3.5: "now" questions ignore the queue data, several answers lead with "Here is what our sources say", a 3-day parking question gets the daily maximum. Chair confirmed three misses (section 1.4) |
| commerce | 2.5 | 2.5 | 0 | Attribution complete and durable (5 of 5 hand-offs, durable store); nothing can be bought; no verified price; no B2B channel |
| perf | 4.0 | 4.0 | 0 (business −0.5) | Better: flight page LCP 4.2 to 4.9 s to 1.22 s; empty night board 4.7 s to 0.92 s; shell JavaScript 70.1 to 33.0 KB; budget-step failures 14 to 10 [verification]. Not better: TBT over 200 ms on most pages (pooled medians 227 to 308 ms on eight pages); congested Wi-Fi LCP 2.57 and 2.65 s; CI and WebKit never run on a runner; CSP `'unsafe-inline'` [chair]; and the page-level failure on a failed script fetch [chair] |
| **Weighted** | **74.5%** | **75.5%** | **+1.0** | |

---

## 4. The second review's conditions and launch blockers

Status: **met**, **partly met** or **not met**, on the reviewers' first-hand evidence and verification round five.

### 4.1 Closed-pilot conditions (the second verdict)

| # | Condition | Owner | Status | Evidence |
|---|---|---|---|---|
| 1 | CI run with its TBT budgets, met or agreed anew | Team | **Not met** | CI and WebKit have never run on a runner (G7). The budget step fails 10 assertions (14 in round four). Pooled TBT `/en` 260, `/ms` 300, `/en/kul` 308, board 227, parking 241, flight page 268 ms; under 200 only on the concierge, guides hub and My journey (G8 item 1). Verification records no revised budget |
| 2 | Commercial measurement made durable (E-17, team part) | Team | **Met** | Business clicked 5 of 5 hand-offs: each opened with `utm_campaign=<name>` and sent a `handoff` beacon, written to the file store [measured]; counts survive a restart [verification F2.6]. E-17 as a whole stays not verified (answer states for other top tasks) and partner referral codes are MAHB's |
| 3 | Status-line semantics | Team | **Met** | All three lenses: 0 "Checked hh:mm", 0 "No disruption", 3 to 4 "Status not available", "From notices published up to 7 Oct 2026. No live operations feed is connected yet." [measured]; verification 6.1.1 |
| 4 | Day-of-travel residuals | Team | **Met** | Home card "Check-in closes 06:30 · Now" after the arrive-by time passed; AK 6336 "Delayed: now 07:50 · Check-in closes 07:05 · Boarding 07:20"; 0 "Done:" on 10 departure loads; "Act now"; AirAsia notice period not invented [measured by all three]; verification 6.1.2 |
| 5 | One fact, one answer | Team | **Met** (low residual) | The parking page, the concierge and help give "Rates not verified: our sources give a daily maximum of RM 32 …" [measured]; content test passes [verification 6.1.3]. Residual: the concierge's long-stay card still states RM 32 without the qualifier (business) |
| 6 | Official flight feed connected | MAHB | **Not met** | Provider stub throws (`official-flights.ts`, lines 96 to 111); `/api/flights?airport=kul` `"mode":"demo"` [chair] |
| 7 | A named owner for notices (with an operations feed and notices CMS) | MAHB | **Not met** | Notices are `src/content/notices.ts`; no owner named |

**4 of 7 met**, all of them the team's trust items. The team's CI and TBT condition and both MAHB conditions remain.
This panel adds three team conditions (section 8), none met on this build: no lazy part may replace a page after a
failed script fetch, and "Try again" must recover [chair]; the concierge's sticky question box must not hide the
focused suggestion [chair]; the accessibility statement must be true and dated after those fixes.

### 4.2 Launch blockers fixable by the delivery team (second review, section 6.1)

| # | Blocker | Status | Evidence |
|---|---|---|---|
| 1 | Status-line semantics | **Met** | 4.1, row 3 |
| 2 | Day-of-travel residuals, corrected English | **Met** | 4.1, row 4; "Your needs: wheelchair." / "Keperluan anda: kerusi roda, warga emas." (inclusion) |
| 3 | One fact, one answer | **Met** | 4.1, row 5 |
| 4 | Concierge: fallback with the official contact; access qualifiers and named airline in English and Malay; template grammar; "In effect" label; one lead line and two cards on a phone | **Partly met** | Fallback, qualifiers, airline and grammar fixed (0 grammar errors in 17 answers, design); the concierge gives RM 55 until 31 December. Answers still 500 to 1,163 px on a phone with the fare repeated three times (design); the "In effect now" badge survives on the overview's notice card [chair]; intent misses remain (section 1.4) |
| 5 | Search relevance (A-12): the named queries | **Met** for the named queries | Fast Track by terminal, smoking, wifi, taxi, accessible toilet, the home "parking" suggestion, no "0 flights found" [measured by all three; verification 6.1.5]. New gaps beyond the named list (section 1.4) |
| 6 | Answer-first and placement | **Partly met** | Met: transport fare 431 px, transit verdict 454 px and sticky, map controls above the drawing with the disclaimer clear, sticky offsets at 400% zoom, chips that wrap, desktop first row 798 to 850 px. Not met: Malay mid-word breaks on 4 pages (16 words, e.g. "Antarab / angsa"); "My needs" at 1,870 to 2,142 px at 125% text, outside two screens (inclusion; 1,253 px at 100%, business). New: overview flight search at 2,236 px [chair]; the route chip now covers a place label |
| 7 | Density (A-14) | **Partly met** | Flight page and parking done [verification G4]. A filtered board repeats a Demo chip on every hour group (design); 9 type sizes on 8 of 280 pages at 390 px and 11 pages over 8 at 1440 px [verification G5] |
| 8 | Thin and directory-only airports | **Met** (team part) | Lawas without a journey switcher, "Airlines: Not published", depth chips 3 / 18 / 18 on `/en/airports` [measured; verification 6.1.8] |
| 9 | Measurement (E-17) | **Met** (team part) | 4.1, row 2 |
| 10 | Accessibility statement; Malay copy pass | **Partly met** | Malay `h1`, "Tanya Kami" and the placeholder fixed [measured]. The statement covers focus, zoom and untested browsers in both languages, but two sentences are untrue on this build (sticky bars "do not hide the item that has focus" when the page is magnified, which fails at 125% zoom of a 1440 x 900 window; "a link to a section moves focus to that section") [fact-check: the test sentence "is not hidden behind sticky content" is scoped to 200% and 400% zoom, where nothing focused was hidden], its review date predates round five, and it has no accessibility contact (MAHB) (inclusion; chair confirmed the first) |
| 11 | Performance and release gates | **Not met** (improved) | 4.1, row 1; congested Wi-Fi LCP 2.57 / 2.65 s; first-load JavaScript over 170 KB on 21 of 39 routes; HTML over 40 KB gzip on 14 of 22 pages; worker first visit 61 requests and 643 KB [verification G8] |
| 12 | Per-route CSP and payment policy (E-09) | **Not met** | `'unsafe-inline'` and `payment=()` [chair]; no checkout exists |
| 13 | Moderated usability study (team with MAHB) | **Not met** | A plan exists; no study run |

**6 met, 4 partly met, 3 not met.**

### 4.3 Launch blockers dependent on MAHB data, systems or partners (second review, section 6.2)

| # | Blocker | Status | Evidence |
|---|---|---|---|
| 14 | Official flight feed (OOS-01) | **Not met** | 4.1, row 6 |
| 15 | Operations feed and notices CMS with an owner (OOS-02) | **Not met** | 4.1, row 7; queue estimates are demonstration data |
| 16 | Parking tariff and dated booking link (OOS-03) | **Not met** | 0 of 4 KLIA car parks verified; "Enter them on the official site; it does not take them from this page" (business) |
| 17 | Fast Track, lounges, referral agreements (D-02, OOS-04, OOS-13) | **Not met** | Fast Track details "Not published in our sources"; 9 "Not published" on the lounges page; three lounge-operator hand-offs go to one Malaysia Airlines page; no referral codes (business) |
| 18 | Content minimum per international airport; concessionaire feed (OOS-05, OOS-06) | **Not met** | Sitemap KUL 17, PEN 6, BKI 6, other airports 1 or 2 URLs; `/en/kch/parking`, `/en/lgk/transport` 404 [chair]; 8 outlets at KLIA, 2 and no dining near T2 gate K11 |
| 19 | Located accessibility facts; assistance service; airline rules; Immigration wording; map places (OOS-07, D-04, D-07, C-08) | **Not met** | Listed as "not published" by the product in both languages; the map's lifts are demonstration points (inclusion) |
| 20 | Operator-grade sourcing; brand, legal, native-Malay review (OOS-08, OOS-14) | **Not met** | Aerotrain notice "we found no confirmation of the final dates"; "Third-party guides describe Terminal 1 as …" (business) |
| 21 | Alert delivery (OOS-10) | **Not met** | "Nothing reaches you when the browser is closed yet"; e-mail "Demonstration: nothing is sent" (all three) |
| 22 | B2B channels (D-17) | **Not met** | Every dedicated channel "Not published" on the corporate business page (business) |
| 23 | Hosting edge limits, client-address header, security.txt, field Core Web Vitals (OOS-11, OOS-12, OOS-15) | **Not met** | [verification G8 item 10]; no field data |

**0 of 10 met.** None was in the scope of rounds four or five.

---

## 5. The second review's ten weaknesses

| # | Weakness (second review) | Status now | Evidence |
|---|---|---|---|
| 1 | No live operational data; status lines overstate freshness | **Freshness fixed; data unchanged** (MAHB) | Section 4.1, rows 3, 6, 7 |
| 2 | Content depth and operator-grade sourcing | **Unchanged** (labelling of depth improved) | Section 4.3, rows 18, 20 |
| 3 | Nothing can be bought; measurement partial | **Measurement fixed; commerce unchanged** | Section 4.1, row 2; 4.3, row 17 |
| 4 | Assisted travellers lack the facts; the assistance flow misleads | **Flow fixed; facts unchanged** (MAHB, airlines) | "Past:" not "Done:", "Act now", "we do not know how much notice Singapore Airlines needs" (inclusion); 4.3, row 19 |
| 5 | Day-of-travel residuals | **Fixed** | Section 4.1, row 4 |
| 6 | Concierge and search miss the question; surfaces disagree | **Surfaces agree; concierge and search improved, with new gaps** | Section 4.2, rows 4, 5; section 1.4 |
| 7 | Alerts do not reach a closed browser | **Unchanged** (MAHB) | Section 4.3, row 21 |
| 8 | Density and label noise | **Improved, not finished** | Section 4.2, row 7 |
| 9 | Answer-first unfinished; layout defects at zoom | **Fixed on phones and at zoom; residuals elsewhere** | Section 4.2, row 6; the concierge focus defect at 720 to 900 px window heights is new (section 1.4) |
| 10 | Release engineering and performance unproven | **Improved, not met; a resilience defect exposed** | Section 4.1, row 1; section 1.4, row 1 |

---

## 6. The ten review questions, after rounds four and five

The brief's ten Phase 10 questions, as first answered in [`panel-summary.md`](panel-summary.md) and again in
[`re-review.md`](re-review.md), section 4.

### Q1. Is this genuinely easier to use than Changi?

**For finding a flight, knowing the next step and planning a transfer on the open web: yes, on expert judgement.
For anything a passenger pays for: no. Not proven with passengers.**

- **Better since the second review** [measured]: the day-of-travel guidance is right in every state the business
  lens tried, on the home, My journey and the flight page; the fare and the transfer verdict are on the first
  phone screen; the concierge says when it cannot answer and who can.
- **Still worse than Changi for buyers**: Changi lets a passenger reserve duty free and links rewards to parking;
  here nothing can be bought.
- **A new risk to the claim**: the returning passenger with a saved flight loses the whole home page to one failed
  script fetch, and the offered "Try again" does not recover it [chair].
- **On the matrix**, 75.5% against Changi's 76.5% is within the method's uncertainty; Changi's matrix score is
  low-confidence.

### Q2. Is flight discovery faster and clearer than Heathrow?

**Clearer, yes. Faster, only in the lab on demonstration data. Flight stays half a point below Heathrow (4.0
against 4.5).**

- **Fixed since the second review** [measured; verification]:
  - delayed flights on one time basis across card, timeline and home;
  - the home card shows the deadline that still matters, never a past time as "Next";
  - the flight page's answer is in the server HTML and paints at 1.22 s (was 4.2 to 4.9 s);
  - the empty night board explains itself and offers earlier and later flights (LCP 0.92 s, was 4.7 s);
  - the concierge answers "Is MH 785 delayed?" from the feed, labelled as demonstration data.
- **Still against it:** alerts reach no one once the page is closed; e-mail follow is a demonstration; at 1440 x 900
  only about two board rows sit above the fold [chair]; flight data has never come from a real source, so "faster
  than Heathrow" remains unmeasured.

### Q3. Is the visual design as refined as the best global consumer products?

**Not yet.** ui is 4.0 from all three lenses: equal to the best airport sites and above Heathrow (3.5).

- **Fixed since the second review**: the flight page's density (one Demo banner per view, 2 source toggles, 8 type
  sizes); parking's density (0 Demo tags on cards, one source list); the Malay home `h1`; map labels inside the
  drawing; section tabs with an edge fade.
- **What still separates it from the best consumer products**: the English home `h1` is still a brand line; 9 type
  sizes on 8 of 280 pages at 390 px (the home with a saved flight among them) and 11 pages over 8 at 1440 px
  [verification]; a Demo chip on every hour group of a filtered board; the map's route chip over a place label; an
  "Estimated" chip on a notice [chair]; a run-on next-step sentence; "Save flight" keeps its label once saved; the
  board's filter strip has no overflow cue; the map is still a schematic.

### Q4. Can passengers complete their most important tasks with minimal friction?

**The day-of-travel tasks, yes. Every purchase still ends in a hand-off, and the tasks an assisted traveller depends
on still fail for lack of data.**

| Task | Second review | Now |
|---|---|---|
| Flight status, terminal and gate | Yes | **Yes**, first phone screen, English and Malay |
| KLIA Ekspres fare and time | Yes; fare at 1,821 px on the transport page | **Yes**, fare at 431 px, dated "until 31 Dec 2026 · RM 65 from 1 Jan 2027" (design). The overview's notice card wrongly badges the 2027 fare "In effect now" [chair] |
| When to arrive | Yes; home card could show a past time as "Next" | **Yes**, home card and My journey show the deadline that still matters |
| Where to check in | Yes | **Yes**, per cabin; delayed flights on one time basis |
| T1 to T2 self-transfer verdict | Improved; under a five-question form | **Yes**, sticky verdict at 454 px that stays in view while the form changes |
| Save and return without an account | Yes | **Yes, with a resilience defect**: one failed script fetch blanks the home and My journey [chair] |
| Follow a flight with alerts | Partial | **Partial** (unchanged): only while the page is open; e-mail a demonstration |
| Parking price for 3 days | Improved | **Improved and consistent, still unverified**: 0 of 4 KLIA car parks verified; the concierge gives the daily maximum, not the 3-day figure the page shows (business) |
| Lounge with price | Unchanged | **Unchanged**: no price or access rules |
| Fast Track | Partial | **Partial**: findable, terminal-qualified, an optional step after security; not in the international flight summary; price, hours and seller not published |
| Buy parking, a lounge, a rail ticket or duty free | Fails | **Fails** (unchanged) |
| Immigration as a Malaysian with an elderly parent | Fails | **Fails**: the facts are not published (D-07), and in Malay the concierge leads with visitor and arrival-card content [chair] |
| Accessible toilet near my gate | Fails for lack of data | **Fails for lack of data, honestly**: search and the concierge lead with "not published yet" in both languages |
| Arrange wheelchair assistance | Improved | **Improved**: an airline-specific step, "Act now", no invented notice period; the needs control 2.5 screens down at 125% text (was eleven); AirAsia's rules not published |

### Q5. Is the information accurate, complete and trustworthy?

**Trustworthy in method, now without the freshness and consistency problems the second review found. Still
incomplete, and a few labels still mislead.**

- **Fixed since the second review** [measured by all three]: no current-time "Checked" stamps or default "No
  disruption"; one parking sentence on every surface; no "Done:" for unconfirmed assistance.
- **Labels that still mislead** [chair where marked]: the 2027 fare change badged "In effect now" [chair];
  demonstration lifts named like real ones and leading the "lift" search [chair]; the concierge's long-stay card
  without its qualifier; "There are no notices for this airport right now" on a directory-only airport.
- **Complete: no.** info is 3.0 from all three lenses with high confidence: 3 of 39 airports beyond an overview; 0
  of 4 KLIA car-park rates verified; 8 outlets; no lounge prices or rules; Fast Track details, located accessibility
  facts, airline assistance rules and departing-citizen immigration guidance missing.
- **Operator-grade sourcing is unchanged**: third-party guides describe MAHB's own building; the Aerotrain notice
  hedges MAHB's own works; Malay has had no native review.

### Q6. Is the mobile experience exceptional?

**Good, level with the best benchmarks (mobile 4.0; design 4.5). Not exceptional.**

- **Strengths** [measured]: the answer on the first screen of every key task (flight card about 238 px, board 614,
  parking 340, transport 431, transit 454); 0 sideways scroll on 28 pages at 125% text and down to 320 x 256; sticky
  chrome that gives way; Malay at 125% text that fits.
- **Against "exceptional"**: very long pages (facilities 15,451 px; the hub 17,614 to 19,186 px at 125% text);
  concierge turns up to 1,163 px; TBT over 200 ms on most pages on the mid-range Android profile [verification];
  congested Wi-Fi LCP 2.57 s [verification]; the saved-flight failure on weak connections [chair]; no alerts on
  iPhone; the header and bottom bar break with device font scaling at 200% (the product's own setting stops at
  125%).

### Q7. Does it support MAHB's commercial and operational objectives?

**Commercially, the measurement foundation is now in place but there is still nothing to sell. Operationally, the
product layer is honest and ready for feeds that are not connected.**

- **Commercial** (commerce 2.5 from all three, level with MAHB today):
  - **Now in place**: every commercial hand-off tagged and counted in a durable first-party store with no
    third-party requests (0 on 62 loads); Fast Track after security; parking dates filled from the flight; shop and
    dine sorted by the flight's gate.
  - **Still missing**: anything to buy; a verified parking price; lounge prices and rules; retail depth (8 outlets,
    0 dining near T2 gate K11); partner referral codes; B2B channels; a CSP and payment policy that would allow a
    partner checkout [chair].
- **Operational**:
  - **Now in place**: status lines that say what they do not know, with the notices' own date; last-known flight
    data with its age on a feed failure; missing sections that answer 404 with a proper page.
  - **Still missing**: the official flight feed, an operations feed, a notices CMS with an owner; the concierge does
    not use the queue data it has for "now" questions.

### Q8. Is it differentiated enough to establish a new international benchmark?

**Differentiated, yes. A new benchmark, no.**

- **Differentiators**, held or strengthened: one network-wide flight search; dated provenance on every fact in two
  languages (business: "a governance asset" that should become the CMS content contract); an account-free journey
  timeline that is now right in every state tried; honest status semantics; a needs-aware timeline with
  airline-specific warnings; the self-transfer planner with a sticky verdict; a search palette the design lens
  rates the strongest in the benchmark set; no third-party requests.
- **Why it is not a benchmark**: at 75.5% it is 3.5 points below Heathrow, 7.5 below the composite and 15 below the
  target. Both projections given this round land at about 80%, level with Heathrow. The deficit is in info,
  commerce and flight, which the delivery team cannot close alone.
- **What would make it one** [judgement]: the business lens's network-wide live status layer fed by operations, or
  one basket from the flight page; the design lens's concierge and density fixes; the inclusion lens's
  accessibility facts, tested with disabled participants.

### Q9. The most significant remaining weaknesses

See section 7.

### Q10. What must be improved before public launch?

See section 9. The lenses agree on the items and differ in emphasis:

| Lens | Emphasis |
|---|---|
| Business | Live data and publishing, commerce, resilience of the saved-flight path, CI and budgets |
| Design | Concierge intent and length, overview hierarchy, search vocabulary, desktop board, density |
| Inclusion | Assisted-travel facts, testing with assistive technology, the concierge focus defect, an accurate statement |

---

## 7. Ten most significant remaining weaknesses

Ranked by how many lenses named each and how badly it fails a top task. "Team" = fixable by the delivery team;
"MAHB" = dependent on MAHB data, systems or partners.

1. **No live operational data and no alert delivery** (MAHB: OOS-01, OOS-02, OOS-10). All three lenses. The official
   flight provider is a stub; `/api/flights` answers `"mode":"demo"` [chair]; notices are a code file needing a
   deploy; queue estimates are demonstration data; Follow works only while a page is open and e-mail is a
   demonstration. This caps info and flight.
2. **Content depth, verified prices and operator-grade sourcing** (MAHB: OOS-03, OOS-05, OOS-06, OOS-08, OOS-14).
   All three lenses; info 3.0, high confidence. 0 of 4 KLIA car-park rates verified; 3 of 39 airports beyond an
   overview and a board, with `/en/kch/parking` and `/en/lgk/transport` 404 [chair]; 8 outlets at KLIA; lounges
   sourced from third-party sites; MAHB's own building described from third-party guides; Malay not natively
   reviewed.
3. **Nothing can be bought** (MAHB and partners; team for E-09). All three lenses; commerce 2.5, level with MAHB
   today. No parking booking with dates, lounge booking, reserve-and-collect or B2B channel; the enforced
   `payment=()` and `'unsafe-inline'` would block a partner checkout [chair].
4. **A failed script fetch blanks the returning passenger's home** (team). Business found it first-hand, the chair
   confirmed it, verification ranks the underlying issue second but describes it as card-level. With a saved
   flight, 2 of 14 lazy chunks on `/en` and 2 of 10 on `/en/journey` each replace the whole of `<main>` with
   "Something went wrong", and "Try again" does not recover after the connection returns [chair]. Airport Wi-Fi and
   deploys make this the likeliest failure for the user the product most needs to keep.
5. **Assisted-travel facts missing and no assistive-technology evidence** (MAHB, airlines and Immigration for the
   facts; team with MAHB recruiting for the study). Inclusion and design. No located accessible toilets, surveyed
   lifts, wheelchair points or step-free status of transport modes; no airport assistance service, CARE hours or
   accessibility contact; no AirAsia, AirAsia X or Batik Air rules; no NVDA, JAWS, VoiceOver or TalkBack session,
   no WebKit or iOS Safari run, no disabled participant. The product says all of this plainly.
6. **The concierge and search still miss intents** (team). All three lenses. Concierge: "book me a taxi" lists six
   modes; "now" questions ignore the queue data; several answers lead with "Here is what our sources say"; Malay and
   English departure-autogate questions lead with visitor and arrival-card content [chair]; weather goes to the
   airport support line; a gate letter does not imply KLIA; phone turns of 500 to 1,163 px. Search: "pharmacy" 0
   results; "kuching parking" returns other airports' pages; "charging" returns trains; "lost and found" 39 options;
   unmarked demonstration lifts lead "lift" [chair].
7. **Release engineering and speed budgets unproven** (team) [verification]. All three lenses. CI and WebKit never run
   on a runner; the budget step fails 10 assertions; pooled TBT 227 to 308 ms on eight pages; congested Wi-Fi LCP
   2.57 and 2.65 s; first-load JavaScript over 170 KB on 21 of 39 routes; HTML over 40 KB gzip on 14 of 22 pages;
   worker first visit 61 requests and 643 KB; the offline toast waits for the runtime's script.
8. **Focus defects that contradict the accessibility statement** (team). Inclusion and design. The concierge's sticky
   question box covers the focused suggestion at 1280 x 720 [chair] and 1440 x 900 (inclusion), at best a marginal
   pass of WCAG 2.4.11; in-page links ("My needs", the hub's contents) and palette selections leave focus on `<body>`
   or the Search button. The statement claims both work, and its review date predates round five. Text-only enlargement
   beyond 125% also breaks the header and bottom bar (not a WCAG failure).
9. **Hierarchy, length and density residuals** (team). Design, with business and inclusion. The overview gives its
   first phone screen to a 100-word notice and puts flight search at 2,236 px [chair]; the desktop board shows about
   two rows above the fold [chair]; facilities 15,451 px and the hub up to 19,186 px on a phone; a Demo chip on every
   hour group of a filtered board; 9 type sizes on 8 pages at 390 px; the English home `h1` is a brand line; the
   map's route chip covers a place label and its drawing is below the first screen once a route is chosen.
10. **Notice, copy and Malay residuals** (team; native review is MAHB's). Business, design and inclusion. A 2027 fare
    badged "In effect now" and an "Estimated" chip on a notice [chair]; the concierge's long-stay card without its
    qualifier; "no notices right now" on a directory-only airport; "Security MAIN"; Malay mid-word breaks on four
    pages ("Antarab / angsa", "Domesti / k"); "kaunter 2- / 7"; "Penang" in a flight `h1` but "Pulau Pinang" on the
    board; "penerbangan simpanan" read as "reserve flights".

---

## 8. Verdict

**Not ready for public launch** [judgement, unanimous].

- **Ready now for stakeholder demonstrations**, as a labelled concept on demonstration data. Presenters should avoid
  the night window (about 22:55 to 05:05 Kuala Lumpur time) or show the empty-board state deliberately.
- **Ready now for a moderated usability study** on phones in English and Malay, including NVDA, VoiceOver on iOS,
  TalkBack and magnifier users, with MAHB recruiting and signing off (OOS-15). This is the evidence every lens says is
  missing, and nothing in it depends on MAHB's feeds. Fixing items 1 and 3 in section 9.1 first would keep sessions
  off known defects.
- **Not yet ready for a closed KLIA pilot.** The panel keeps the second review's conditions and adds three
  [judgement]:
  - **Still open from the second review**: CI on a runner with TBT budgets met or agreed anew and recorded (team);
    the official flight feed, proven against the failure states (MAHB); a named notices owner with an operations
    feed or notices process (MAHB).
  - **Added by this panel** (team): the saved-flight failure fixed so that no lazy part can replace a page and "Try
    again" recovers (business; chair confirmed); the concierge focus defect fixed (inclusion; chair confirmed); the
    accessibility statement made true and dated after the fixes (inclusion). The inclusion lens also asks that pilot
    participants with access needs be recruited and supported.
  - Design's position is compatible: ready in its lens for the pilot once MAHB connects the flight feed.
- **Public launch** needs every item in section 9.

**Score.** Panel median 75.5% (74.0 to 79.5), up 1.0 from 74.5%; round one 70.8%; MAHB today 42.5%; Heathrow
79.0%; composite 83.0%; target 90.5%. This is expert judgement on a prototype with demonstration data, not a user
study.

---

## 9. What must still be done

The panel separates prototype-only conditions from product defects:

- **Prototype-only** (expected to go with production data; not counted against the design scores): demonstration
  flights, gates, check-in rows, queues and alerts; illustrative map positions and demonstration lifts (their
  labelling is a product defect, item 9.1.5); unverified parking rates; "not published" facts; the concierge's fixed
  knowledge file; the "Concept prototype, not official" banner.
- **Product defects** (stay after MAHB connects its data): every item in 9.1.

### 9.1 Fixable by the delivery team

Items marked **[pilot]** are conditions for the closed KLIA pilot.

1. **Resilience of lazy parts [pilot].** Use `retryingImport` for every `React.lazy` that renders on load (the home's
   saved-flight card, My journey's controls), scope error boundaries to the card, make "Try again" re-import rather
   than re-render a cached rejection, and add the saved-flight state to the failed-chunk e2e test. Keep a minimal
   connectivity listener in the shell for the offline toast (G8 item 8).
2. **CI and budgets [pilot].** Run the workflow on a runner with WebKit and the chaos and contract tests; meet the TBT
   budgets on the home, overview, board, parking, map, transport and flight page, or agree revised budgets with the
   design owner and record them. Then the congested Wi-Fi LCP, first-load JavaScript, HTML, byte and worker budgets
   (A-09, E-01, E-02, E-03, E-06, E-11, E-12).
3. **Focus and the statement [pilot].** `scroll-padding-bottom` equal to the concierge composer's height (or a static
   composer while suggestions show), re-tested at 1280 x 720 and 1440 x 900 with axe; focus to the target for in-page
   links ("My needs", the hub's contents) and after a palette selection; then refresh the accessibility statement,
   dated after the fixes, in both languages.
4. **Concierge intent and length.** Recognise requests it cannot perform ("book me a taxi" to the coupon counter);
   answer "now" questions from its status and queue lines or say there is no live data; lead with the answer rather
   than "Here is what our sources say"; route departure, citizen and older-traveller autogate questions to the
   departing-citizen card first in both languages; keep out-of-scope questions away from the airport support line;
   infer KLIA from a gate letter; say when a B2B channel is not published; one lead line and at most two cards on a
   phone.
5. **Search.** "Not published for `<airport>`" with the official link before other airports' pages ("kuching parking",
   "langkawi taxi"); vocabulary for pharmacy, charging, ATM and lost and found with "not published" lines; down-rank
   unrelated help and news; mark every demonstration place, lifts included, as illustrative in results and in the
   map's From and To lists.
6. **Notice and copy semantics.** "Announced; applies from 1 January 2027" instead of "In effect now"; no "Estimated"
   chip on notices; the qualifier on the concierge's long-stay card; "No notices in our sources" for directory-only
   airports; readable terminal labels.
7. **Hierarchy and density.** Flight search above the notices on the overview's phone layout; at least five board
   rows above a 900 px desktop fold; one Demo marker per board view; at most 8 type sizes on the home with a saved
   flight and the corporate pages; shorter facilities, hub and transport pages on phones; the map drawing brought
   into view when a route is chosen and the route chip kept off labels; a task-based English home `h1` once the
   brand owner agrees (OOS-08); a "Saved" state label; an overflow cue on the board's filter strip; Fast Track as an
   optional link in the international flight summary.
8. **Malay residuals.** No mid-word breaks in segmented controls, chips and headings; non-breaking ranges; one name
   for Pulau Pinang; "penerbangan yang disimpan".
9. **Device font scaling** (recommended, not a WCAG failure): a header and bottom bar that survive 200% text; consider
   a 150% step in the site's own setting.
10. **Low items** from verification G8 item 9: night-board CLS at 1440 px, interaction latency, the rate-limit-sensitive
    e2e test, hreflang in the head on 152 of 276 pages, the header switcher's shift after hydration, reading level
    (D-14).
11. **Per-route CSP and payment policy** for any partner checkout (E-09).
12. **Moderated usability study** on phones in English and Malay, with assistive-technology users (the team runs it;
    MAHB recruits and signs off, OOS-15).

### 9.2 Dependent on MAHB data, systems or partners

1. **Official flight feed** behind the provider interface, proven against the failure states (OOS-01) **[pilot]**.
2. **Operations status and queue feeds and a notices CMS** with bilingual approval, a notice live in under 5 minutes
   without a deploy, and a named duty owner (OOS-02) **[pilot: the named owner]**.
3. **Official parking tariff** and a booking deep link that accepts product, dates and a referral code (OOS-03).
4. **Fast Track** seller, price, hours and checkpoints; **lounge** access rules, prices and booking; referral
   agreements and confirmed conversions (D-02, OOS-04, OOS-13).
5. **Content minimum for every international airport**, Kuching and Langkawi first, and a concessionaire directory
   feed (OOS-05, OOS-06); the operating airline and own contact line of the 33 airports without a content file.
6. **Located accessibility facts** for KLIA T1 and T2 (accessible toilets, surveyed lifts, wheelchair and buggy
   points, accessible bays, step-free status of every transport mode), the airport's assistance service, CARE hours,
   and an accessibility contact with a response time (OOS-07, C-08).
7. **Airline assistance rules** for AirAsia, AirAsia X, Batik Air and the other main carriers (D-04), and
   **Immigration Department wording** on departure autogates for citizens and counters for older travellers (D-07).
8. **Alert delivery** by web push, including iOS, and by e-mail (OOS-10).
9. **Operator-grade sourcing** with MAHB as the source for its own building and services; brand, legal and
   native-Malay review (OOS-08, OOS-14).
10. **B2B channels** (D-17); **hosting** edge limits and the client-address header, `security.txt`, and field Core Web
    Vitals on a mid-range Android before launch (OOS-11, OOS-12, OOS-15); **participant recruitment** for the study.

---

## 10. Reproduce

```bash
cd malaysia-airports
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3305 &   # stop it by its own PID and children afterwards
curl -sI -H 'x-e2e-client-ip: 10.0.0.1' http://localhost:3305/en | grep -iE 'content-security|permissions-policy'
curl -s -H 'x-e2e-client-ip: 10.0.0.2' 'http://localhost:3305/api/flights?airport=kul' | head -c 120
```

With Playwright Chromium (`chromium.launch()`), a fresh context and its own `x-e2e-client-ip` per page, service
workers blocked:

- **Saved-flight failure.** On a current KLIA departure page press "Save flight". Load `/en` and record every
  `/_next/static/chunks/*.js` request not referenced in the server HTML. For each, abort it alone with `page.route`,
  reload `/en`, and compare the length of `main`'s text; where it reads "Something went wrong", remove the route and
  press "Try again". Repeat on `/en/journey`.
- **Concierge focus.** `/en/concierge` at 1280 x 720; Tab to "What is the cheapest way to get to KL Sentral?";
  compare the button's `getBoundingClientRect()` with `main form`.
- **Notice badge, overview and board.** `/en/kul` at 1440 x 900: text after "RM65 from 1 January 2027"; at 390 x 844,
  the offset of "Find a flight at KLIA"; `/en/kul/flights` at 1440 x 900: tops of the flight links.
- **Search and concierge.** `/en/search?q=pharmacy`, `kuching parking`, `lift`, `charging`; `POST /api/concierge`
  with `{"question": …, "lang": "en", "airport": "kul"}`; the Malay autogate question typed into `/ms/concierge`.

If the session falls between about 22:55 and 05:05 Kuala Lumpur time, fix the browser clock to a morning with
`page.clock` for board checks; statuses computed on the server still use the server clock.
