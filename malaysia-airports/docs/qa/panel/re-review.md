# Review panel, round two: consolidated verdict

Date: 21 November 2026. Compiled by the chair of the independent review panel from three independent re-reviews of
the production build after three fix rounds. Round one's verdict is [`panel-summary.md`](panel-summary.md); the fix
rounds and their verification are in [`../verification.md`](../verification.md) (one section per round; round three is
sections T1 to T6).

| Re-review | Lens | Report | Round-one counterpart | Weighted score |
|---|---|---|---|---|
| Business | Airport digital executive: operations, flight information, commerce, multi-airport coverage, launch risk | [`re-review-business.md`](re-review-business.md) | Executive and commerce, 72.5% | **74.5%** |
| Design | UX and visual design director: hierarchy, density, interaction, phone ergonomics, navigation, search, concierge | [`re-review-design.md`](re-review-design.md) | Design director and frequent traveller, 71.5% | **75.5%** |
| Inclusion | Accessibility specialist (WCAG 2.2 AA) and Malay-speaking first-time traveller: accessibility, language, trust | [`re-review-inclusion.md`](re-review-inclusion.md) | First-time traveller and accessibility, 68.5% | **74.5%** |
| **Panel** | Median per dimension | this file, [`re-review.json`](re-review.json) | Round-one panel average, 70.8% | **74.5%** |

**Labels used below.** **[measured]** = observed on the running production build by a reviewer or by the chair, with
the method named in the report. **[verification]** = a figure from `docs/qa/verification.md`, round three, not
re-measured by the panel. **[judgement]** = expert assessment. **[chair]** = a check the chair ran for this summary
(section 1.4).

---

## Verdict

**Not ready for public launch.** All three re-reviews reach this conclusion independently (business in those words;
design and inclusion through their lists of launch blockers). The business lens recommends a **closed pilot at KLIA** once the delivery team has run CI with its TBT budgets (met or agreed anew), made
commercial measurement durable and fixed the parking-rate disagreement, the day-of-travel residuals and the status
lines, and MAHB has connected the official flight feed and named an owner for notices
([`re-review-business.md`](re-review-business.md), section 7). The other two lenses do not discuss a pilot. Their
conditions for launch (concierge fallbacks, delayed-flight guidance, assistance wording, honest freshness labels, the
accessibility facts) are compatible with that position, and the panel adopts it as its recommendation [judgement].

- **Score.** The panel median is **74.5%** on the benchmark rubric (reviewers 74.5 to 75.5). In round one the panel
  averaged 70.8%. The like-for-like round-two mean is 74.8% (+4.0 points). Each lens moved up: business +2.0, design
  +4.0, inclusion +6.0. The product remains well above MAHB today (42.5%) and **below Heathrow (79.0%)**, the
  best-of-each-dimension composite (83.0%) and the strategy's target (90.5%). On the benchmark matrix it now sits
  level with Incheon (74.5%), ahead of Dubai, Hamad and Munich and behind six of the ten benchmark airports. Only
  Heathrow's lead exceeds the matrix's stated uncertainty of about 3 points.
- **What the fix rounds fixed** [measured by at least two reviewers]:
  - On a phone the flight page, the board, parking and the home now lead with the answer.
  - Closed and departed flights get the right timeline state, and check-in rows are given per cabin.
  - A feed failure keeps the last data with its age.
  - Fast Track can be found in English and Malay.
  - The home search falls through to site results and the home remembers the saved flight.
  - Label in Name, focus after navigation and the "My needs" control work.
  - Phone pages no longer scroll sideways at 320 px.
- **What has not moved.** Almost everything that depends on MAHB is unchanged:
  - there is no live flight or operations data, and notices are a code file;
  - only 3 of 39 airports go beyond an overview and a board;
  - no terminal car-park rate is verified;
  - accessibility facts and AirAsia's assistance rules are missing;
  - nothing can be bought.

  Commerce has risen only to the level of MAHB's current site (2.5), not above it.
- **What the fixes introduced or exposed.** None of these is a regression of a fixed item. Each was found by one or
  two reviewers, and the chair confirmed the three marked [chair]:
  - Status lines stamp the current clock time ("Checked 19:17") and say "No disruption reported" when their only
    source is notices held in the code [chair].
  - The concierge says parking rates are "not yet verified", while the parking page shows the Long Term Car Park's
    daily maximum without that mark [chair].
  - On the home, a saved-flight card can show a past arrive-by time as "Next".
  - The timeline announces "Done: Arrange assistance" when nothing was arranged.
  - On a phone, the map's route chip covers the map's own "Schematic demonstration map" label [chair].

**Caveat on every number in this document.** The scores are expert judgement on a working prototype that runs on
demonstration data. They are not the results of a user study. No passenger, disabled participant or physical screen
reader has used the product. Every review ran in Chromium only, with no WebKit or iPhone Safari and no real device,
at a single clock time. As in round one, ux, flight, mobile, nav, ai and ui are scored as if production data were
connected, while info and commerce are scored on what exists. Performance is a lab figure from an unloaded container
(verification round three), not field data. It was not re-measured by any reviewer, because other servers shared the
machine.

---

## 1. Method

### 1.1 Three independent lenses

Each re-reviewer served the existing production build (`.next/`) on their own port, using
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start`, and stopped it by its PID. None of them changed `src/`,
`e2e/` or the configuration, and none rebuilt the product. Each read the round-one reports, the fix backlog and
`verification.md`, and none read the other two re-reviews.

| | Business | Design | Inclusion |
|---|---|---|---|
| Time (MYT) | about 18:13 to 18:35 | 18:35 to 18:41 (app clock) | 18:40 to 19:15 |
| Port | 3302 | 3303 | 3304 |
| Viewports | Desktop 1440 x 900; phone 390 x 844 | Phone first (Pixel 7, 412 x 839); desktop 1440 x 900 and 1280 x 900; dark mode; 125% text on three task pages | 10 configurations: desktop; phone at 112% and 125% text; high contrast; dark; Malay (`ms-MY`); 320 x 568; 200% zoom (640 x 400) and 400% zoom (320 x 256); WCAG text spacing; reduced motion |
| Coverage | 22 URLs x 2 viewports (44 loads), plus pages with parameters | 32 pages and views | English and Malay: 18 pages for axe, 14 for reflow, 18 Malay pages scanned (the report gives no overall page count) |
| What was run | Status, `h1` position, page height, sideways scroll, console errors and third-party requests on every load. Save, Follow, home search, contextual links, a cut flight feed (36 s), parking and Fast Track hand-offs with `/api/metrics` beacons, 13 site searches, 7 concierge API questions, status codes, headers, sitemap counts. Grep of the provider stub, the status-line logic, notices and metrics | Vertical positions of answers in CSS px. Counts of provenance chips, source toggles, Demo labels, upper-case labels and type sizes. Focus targets and accessible names. Concierge and search text | axe-core 4.14.1, WCAG A/AA: 18 pages x 3 configurations, 54 scans. Tab walks and keyboard-only tasks. Reflow on 14 pages x 4 configurations. Reduced motion on 5 pages. Scan of 18 Malay pages. Provenance trace of "Official" cards on 7 pages. 14 searches in English and Malay |
| Screenshots viewed | 13 | 14 | 15 |
| Not done | Assistive technology; field performance | WebKit; real devices; screen reader | Physical screen reader (NVDA, JAWS, VoiceOver, TalkBack); WebKit; participants |

### 1.2 Scoring

- **Scale.** Scores run from 1 to 5 in half points:
  - 3 = a competent major airport;
  - 4 = strong, with evidence;
  - 5 = best in class, verified first-hand.
- **Weights.** ui 10, ux 20, info 15, flight 15, mobile 10, nav 10, ai 10, commerce 5, perf 5.
- **Weighted result.** Sum of (weight x score), divided by 5, as a percentage.
- **Panel score.** The median of the three reviewers on each dimension, computed by the workflow.
- **Comparison with round one.** Round one used the mean of three reviews. The round-two mean, 74.8%, is the
  like-for-like comparison.

### 1.3 Disagreements

No dimension differs by a point or more between reviewers, so no disputed score had to be settled on the build. The
only spread is **nav**: 4.0 from business and inclusion, 4.5 from design.

- **The design lens's case for 4.5.** It credits the search palette: results grouped by type, scoped to the airport
  or the network, with a visible active option, keyboard hints and fall-through to a results page.
- **The case for 4.0.** The other two lenses cite weak relevance.

The chair checked the relevance points [chair]:

- "smoking" returns **0 results**;
- "fast track" returns 2 results, both titled only "Fast Track", with no terminal;
- "taxi" returns 5 results, including the liquids rule and the power-bank rule;
- "wifi" is led by an airline and a lounge.

The evidence supports **4.0** as the panel score: the palette is excellent, but search does not yet reliably answer
the question asked. The medians are unchanged.

Agreement is unusually close: 8 of 9 dimensions are identical across the three reviewers. Part of this is shared
input rather than independent evidence. All three took performance from `verification.md`, and all three scored info
and commerce on the same visible gaps. The scores rest on independent observation where each lens measured first-hand:

- business: operations and commerce;
- design: layout, density, search and the concierge;
- inclusion: accessibility and Malay.

### 1.4 Chair's checks on the running build

The chair served the build on port 3305 (Playwright Chromium; app clock 19:17 MYT) and stopped it by its PID. The
chair checked only points where the reviewers' accounts differed or that one or two reviewers had measured.
Performance was not measured.

| Point | What the reviewers said | What the chair found [chair] | View supported |
|---|---|---|---|
| Are any parking prices verified? | Business: the Long Term Car Park is verified (at most RM 32, 96, 224). Design: "the only figure is Terminal 1 … not verified" (design did not read every row). Inclusion: "every price is unverified" | The `/en/kul/parking` matrix shows four car parks: <ul><li>Terminal 1: "≤ at most RM 52 (not verified)", per klia.info.</li><li>Preferred Parking: "No price published".</li><li>Long Term Car Park: "≤ at most RM 32 / 96 / 224" with "Daily maximum RM 32. Hourly rates not verified. 4 sources", and no "not verified" mark on the figures.</li><li>Terminal 2: "≤ at most RM 52 (not verified)".</li></ul> | Business. One daily maximum is presented as verified; the hourly rates are not |
| Concierge and parking page disagree | Business only | `POST /api/concierge` "How much is parking at KLIA for 3 days?" answers "Parking rates are not yet verified in this prototype" | Confirmed |
| Concierge fallbacks | Design: "never says it cannot answer" | Weather question: "I could not match that to one topic, but these published items look related", followed by the KLIA Ekspres fare change. Smoking question: "Our sources do not publish smoking room for KLIA Terminal 1 yet", followed by an unrelated statement about walking between terminals | Confirmed with a refinement: it does say it found no match, but then offers unrelated items as related and gives no route to an authority |
| Status lines | Business and inclusion | KLIA overview: four lines "Checked 19:17" and "No disruption reported in our sources as of 19:17; check the signs", stamped with the current clock time | Confirmed |
| Map chip covers its disclaimer on phones | Design only | Pixel 7, route Check-in Row B to Gates A: at the midpoint of the "Schematic demonstration map, not a floor plan" label, the element on top is the "To Gates" chip (hit test and screenshot). There is no overlap before a route is chosen | Confirmed, as a new defect |
| Content depth | Business | Sitemap: KUL 17 English URLs, PEN 6, BKI 6, every other airport 2 or fewer. `/en/kch/parking` and `/en/lgk/transport` answer 404 | Confirmed |
| Headers | Business | `/en`: `script-src 'self' 'unsafe-inline'`; `Permissions-Policy … payment=()` | Confirmed |
| Search counts | Business: "wifi" 55 results | 43 results in the chair's run | The count varies between runs; the relevance point stands |

---

## 2. Scores

Benchmark figures are from [`docs/research/benchmarks/matrix.json`](../../research/benchmarks/matrix.json):

- MAHB today: 42.5%, medium confidence.
- Heathrow: 79.0%, medium confidence.
- Composite: the best benchmark score on each dimension, MAHB excluded, computed by the chair from the matrix's
  per-dimension scores. It comes to **83.0%**; the matrix does not store this figure.
- Round one: the panel average in `panel-summary.md`, not in the matrix.

All four comparison figures are as stated in the brief. None needed correction.

| Dimension | Weight | Business | Design | Inclusion | **Median** | Range | Round one (panel avg) | MAHB today | Heathrow | Composite (best: who) |
|---|---|---|---|---|---|---|---|---|---|---|
| ui: UI and brand | 10% | 4.0 | 4.0 | 4.0 | **4.0** | 4.0 | 4.00 | 2.5 | 3.5 | 4.0 (Haneda, Schiphol, Changi, Dubai, Hamad) |
| ux: task efficiency | 20% | 4.0 | 4.0 | 4.0 | **4.0** | 4.0 | 3.83 | 2.0 | 4.0 | 4.0 (seven sites) |
| info: completeness and accuracy | 15% | 3.0 | 3.0 | 3.0 | **3.0** | 3.0 | 3.00 | 2.0 | 4.0 | 4.5 (Hong Kong, Incheon) |
| flight: live flight and journey | 15% | 4.0 | 4.0 | 4.0 | **4.0** | 4.0 | 4.00 | 2.5 | 4.5 | 4.5 (Heathrow, Haneda, Schiphol, Istanbul, Incheon, Hamad) |
| mobile | 10% | 4.0 | 4.0 | 4.0 | **4.0** | 4.0 | 3.50 | 2.0 | 4.0 | 4.0 (Heathrow, Schiphol, Changi) |
| nav: navigation, search, accessibility | 10% | 4.0 | 4.5 | 4.0 | **4.0** | 4.0 to 4.5 | 3.83 | 2.0 | 3.5 | 4.0 (Hong Kong) |
| ai: personalisation and AI | 10% | 3.5 | 3.5 | 3.5 | **3.5** | 3.5 | 3.17 | 2.0 | 4.0 | 4.0 (Heathrow, Istanbul) |
| commerce | 5% | 2.5 | 2.5 | 2.5 | **2.5** | 2.5 | 2.00 | 2.5 | 4.5 | 4.5 (Heathrow, Changi) |
| perf: performance, security, reliability | 5% | 4.0 | 4.0 | 4.0 | **4.0** | 4.0 | 3.50 | 1.5 | 3.0 | 3.5 (Dubai) |
| **Weighted** | | **74.5%** | **75.5%** | **74.5%** | **74.5%** | 74.5 to 75.5 | **70.8%** | **42.5%** | **79.0%** | **83.0%** |

The strategy target is 90.5% (`docs/strategy/benchmark-report.md`, section 6.2).

**Confidence.** Info is high for all three lenses; commerce is high for business and design and low for inclusion
(outside its lens).
Every other score is medium. Perf is low to medium, because no reviewer measured it.

### 2.1 What the table says

- **Movement since round one.**
  - Four dimensions rose by a third of a point or more: mobile (+0.5), commerce (+0.5), perf (+0.5) and ai (+0.33).
  - ux and nav rose by about 0.17, because the one lower round-one score in each came up to 4.0.
  - ui, info and flight did not move.
  - The largest single gain was the inclusion lens: ux, mobile, nav and ai each rose from 3.0 or 3.5. This follows
    from the accessibility fixes (Label in Name, focus, the needs control, reflow).
- **Against the best benchmarks.**
  - The product is now equal to the best benchmark on ui, ux, mobile and nav.
  - It is above every benchmark on perf (4.0 against Dubai's 3.5). This comparison is not like for like: the product
    figure is lab Lighthouse on a local build with no CDN or real traffic, while the benchmark figures come from
    live sites. TBT also misses its own budget on 7 of 10 pages [verification].
  - It is below the best on info (3.0 against 4.5), flight (4.0 against 4.5), ai (3.5 against 4.0) and commerce
    (2.5 against 4.5).
- **The gap to Heathrow (4.5 points) is data and commerce.**

  | Dimension | Points | Main dependency |
  |---|---|---|
  | info | −3.0 | MAHB content and data |
  | commerce | −2.0 | MAHB and partners |
  | flight | −1.5 | Alert delivery and live data (MAHB and partners) |
  | ai | −1.0 | Mostly the delivery team |
  | ui, nav, perf | +3.0 in the product's favour | |
  | **Net** | **−4.5** | |

- **The gap to the composite (8.5 points).**

  | Dimension | Points |
  |---|---|
  | info | −4.5 |
  | commerce | −2.0 |
  | flight | −1.5 |
  | ai | −1.0 |
  | perf | +0.5 in the product's favour |
  | **Net** | **−8.5** |

- **Commerce is level with MAHB today (2.5).** In round one it was below it (2.0). It is not above it.

### 2.2 Projections (judgement, not scores)

| Lens | Projection |
|---|---|
| Business | About 80% with MAHB's launch gates closed: info 4.0, commerce 3.5, flight 4.5 |
| Design | About 80% with the team's fixes; about 85% if MAHB's data also lands |
| Inclusion | About 79 to 80% with MAHB's accessibility data and the team's fixes |

Every projection lands level with Heathrow or between Heathrow and the composite. None reaches the 90.5% target. The
business lens notes that a clear lead over Heathrow would need something no benchmark has, such as a network-wide
live status layer fed by operations, or one basket from the flight page.

---

## 3. The round-one panel's ten main weaknesses

Status: **fixed**, **improved** (better, not closed), **unchanged** or **worse**. Where the lenses differ, the panel
takes the most conservative status that the evidence supports. All evidence below is [measured] unless marked.

| # | Round-one weakness (backlog) | Business | Design | Inclusion | **Panel** | Evidence |
|---|---|---|---|---|---|---|
| 1 | On a phone the answer is not on the first screen (A-01, B-03, C-01, C-03, A-11) | Fixed (first screen) | Improved, largely fixed | Fixed | **Improved** (fixed on the four top task pages) | <ul><li>`h1` at 156 to 184 px on every airport sub-page; 230 px at 125% text in Malay.</li><li>Flight next step under the `h1`: gate at 277 px (was 1,306).</li><li>First board row 615 to 640 px (was 1,185).</li><li>Parking price table at 340 px; saved flight on the home at 294 px.</li><li>Still below the first screen: transport fare 1,821 px (1,955 px in Malay), transit verdict 1,186 px (was 2,943), overview flight search 2,175 px.</li><li>Desktop first board row 938 px on a 900 px screen.</li><li>Pages run up to 15,179 px at default text size and 17,436 px at 125% text.</li></ul> |
| 2 | Commercially weaker than the site it replaces (D-02, C-01, B-13, C-05, C-11, E-17) | Improved | Improved slightly | Improved | **Improved** | <ul><li>Fast Track is in search, the palette, the concierge, the overview and the international timeline; its price, hours and seller are "Not published".</li><li>Parking is price-first, with the flight's dates carried into the estimate; the booking link drops the dates and says so.</li><li>Nothing can be bought; lounges have no price; 8 outlets.</li><li>Commerce 2.0 → 2.5, level with MAHB.</li></ul> |
| 3 | No live data path and no operational layer (B-09, B-01) | Improved; gate open | Improved in the prototype; unchanged in substance | Not assessed | **Improved** (product); **unchanged** (data) | <ul><li>Feed cut: after 36 s, "Showing the last flight information we received, from 18:26 (1 min ago)" with Try again.</li><li>"Services now" status lines and demo queue estimates on the overview and inside flight steps.</li><li>The official provider still throws; notices are still `src/content/notices.ts`; status lines come from matching notice titles.</li></ul> |
| 4 | Wrong guidance on the day of travel (B-02, B-12) | Fixed, one residual | Fixed for closed and departed; residual on delayed | Fixed, new wording issue | **Improved** (round-one defects fixed; the same class of error remains) | <ul><li>Fixed: MH 1960 "Check-in closed at 18:00"; MH 1022 and EY 411 "departed"; MH 1662 "Gate closed"; check-in rows per cabin, agreeing between card and timeline.</li><li>Remaining: the home card showed "Be at the airport by 16:35 · Next 16:35" at 18:21 (business) and "by 16:30" at 18:35 (design).</li><li>Delayed MH 1698 mixes original and new times.</li><li>"Done: Arrange assistance" on past steps (inclusion).</li></ul> |
| 5 | Following a flight does not work where it matters (B-04) | Improved; delivery open | Improved (design); unchanged (delivery) | Not the focus | **Improved** | <ul><li>Follow sits beside Save at 1,194 to 1,197 px (was 5,321).</li><li>The panel states that alerts arrive "only while a page of this site is open".</li><li>E-mail is labelled a demonstration.</li><li>No push when the browser is closed; none on iPhone outside an installed web app (OOS-10).</li></ul> |
| 6 | Travellers with access needs cannot plan with confidence (B-11, D-04, D-11, A-02, A-05, A-16, C-08) | Improved (in passing) | Improved in parts | Fixed in product; facts unchanged | **Improved** | <ul><li>Label in Name passes; axe 0 violations in 54 scans.</li><li>Focus moves to the `h1`; "Assistance" is in the desktop header.</li><li>"My needs" works and adds an assistance step and step-free links.</li><li>No sideways scroll on 56 page and configuration pairs; the hub dead-end is gone.</li><li>Still missing: accessible toilets, lifts, step-free transport and AirAsia's rules (D-04, OOS-07). The needs control is at 8,863 px of 12,514 on a phone at 125% text.</li></ul> |
| 7 | Search, the concierge and the home do not answer the question asked (A-03, A-12, B-08, A-08) | Fixed, with relevance gaps | Fixed (home, search); improved (concierge) | Improved | **Improved** (fixed for the home and search) | <ul><li>Home "parking", "fast track" and "lounge" show page suggestions; Enter opens the flight or `/search`.</li><li>"lift", "buggy", "troli", "tukar wang" and "OKU" return results.</li><li>The concierge leads with RM 55, "AirAsia flies from KLIA Terminal 2" and the nearest lounge.</li><li>Still: fallbacks offer unrelated items [chair]; the AirAsia wheelchair question gets the Calm Room first (design and inclusion); "smoking" returns 0 results [chair].</li></ul> |
| 8 | Content is thin and not operator-grade (D-16, D-06, D-05, D-03) | Unchanged | Unchanged | Improved (Malay); facts unchanged | **Unchanged** | <ul><li>Sitemap: KUL 17, PEN 6, BKI 6, others 2 or fewer [chair].</li><li>Kuching and Langkawi parking and transport answer 404 [chair].</li><li>T1 and T2 car parks "≤ RM 52 (not verified)"; 8 outlets; 29 "Not published" markers on facilities.</li><li>Arrival steps cite third-party guides for MAHB's own building.</li><li>The Malay is still a draft.</li><li>D-01 is fixed on the 7 pages checked: every "Official" card cites an airport, airline, operator or government source.</li></ul> |
| 9 | Noise competes with answers and raises anxiety (A-14, D-05, D-06) | Improved | Unchanged in substance | Improved, not met | **Improved** (caveats); **unchanged** (density) | <ul><li>The 90-word "not verified" block is gone from journey steps: 0 matches on the flight pages checked.</li><li>The parking warning is now a rule, and the RM 2,084 report appears only in sources.</li><li>Still: 20 provenance chips, 10 Demo labels and 6 source toggles on the flight page; 21 toggles on facilities; about 70 upper-case labels on the home.</li><li>A-14 is not verified [verification].</li></ul> |
| 10 | Performance misses its own budgets (E-01, A-09, B-06, E-02, E-03) | Improved, not met | Improved, not met | Improved, not met | **Improved** | [verification]<ul><li>Lighthouse mobile 92 to 99 on 10 pages, 95 or more on 7.</li><li>LCP 0.92 to 1.11 s on 10 of 10 (transport was 4.27 s).</li><li>CLS at most 0.003.</li><li>TBT over 200 ms on 7 of 10 (overview 353 ms, `/en` 257).</li><li>Guidance pages 543 to 607 KB against 500.</li><li>Congested Wi-Fi LCP 2.57 to 2.68 s against 2.5.</li><li>The CI budget step has never run.</li></ul> |

None of the ten is worse. One new defect was reported by the design lens (as a defect, not marked worse) and
reproduced by the chair: on a phone, the map's "To Gates" chip covers the "Schematic demonstration map, not a floor
plan" label.

**Backlog acceptance** [verification, round three]:

- 85 of 101 P0 and P1 items are verified, 16 are not and 0 have regressed.
- The 16 not verified are P0 A-09, A-14, B-09, D-04, D-07, E-01, E-02, E-03 and E-06, and P1 C-08, D-14, E-09,
  E-11, E-12, E-14 and E-17.
- 348 end-to-end tests pass and axe reports 0 violations.

---

## 4. The ten review questions, after the fixes

### Q1. Is this genuinely easier to use than Changi?

**Easier for finding a flight, knowing the next step and planning a T1 to T2 transfer on the open web. Not easier for
anything a passenger pays for, and not proven with passengers.**

- **Better since round one** [measured]:
  - The flight page leads with the next step.
  - The home remembers the saved flight.
  - The home search answers topics as well as flights.
  - The phone chrome no longer pushes answers down.
- **Still unproven.** Round one's calmness argument (no consent overlay or carousel above the answer) still holds,
  but "easier" is still expert judgement [judgement].
- **Still worse than Changi for buyers.** Changi lets a passenger reserve duty free and links rewards to parking.
  Here nothing can be bought.
- **Access needs.** The product now handles them better in its own logic (the needs control, step-free routes that
  name the lift). The facts a wheelchair user needs are still missing, so in the inclusion lens's words they leave
  that traveller with "nothing specific to act on".
- **On the matrix**, 74.5% against Changi's 76.5% is within the method's uncertainty. Changi's matrix score is also
  low-confidence.

### Q2. Is flight discovery faster and clearer than Heathrow?

**Clearer, yes. Faster, still only in the lab on demonstration data. Flight stays half a point below Heathrow (4.0
against 4.5).**

- **Clarity defects named in round one, now fixed** [measured]:
  - the wrong "Now" step;
  - one cabin's check-in row given to everyone;
  - the gate 1,306 px down the phone page (now 277 px);
  - the first board row at 1,185 px (now 615 to 640 px on a phone);
  - Enter doing nothing on an exact match;
  - board rows out of view of a demo label.
- **Failure handling.** On a feed failure the flight page keeps the last data with its age and a retry. Round one's
  capture of Heathrow's departures page showed an error with no last-known data.
- **Still against it:**
  - On a 1440 x 900 desktop the first board row is at 938 px, below the fold.
  - Delayed-flight guidance mixes the original and new times.
  - The home card can show a past arrive-by time.
  - Alerts reach no one once the page is closed.
- **Speed.** Flights now come from a server feed rather than the browser [verification, B-09]. The feed still serves
  demonstration data, so "faster than Heathrow" has never been measured against a real source.

### Q3. Is the visual design as refined as the best global consumer products?

**Not yet.** ui is 4.0 from all three lenses: equal to the best airport sites and above Heathrow (3.5).

- **Fixed since round one:**
  - the clipped desktop tabs;
  - the floating search button covering a tile;
  - the palette's invisible active option.
- **What still separates it from Apple-, Airbnb- or Stripe-grade polish:**
  - **Density (A-14):** 20 provenance chips and 10 Demo labels on the flight page; about 70 upper-case labels and 12
    type sizes on the home.
  - **The hero:** the marketing `h1` ("Your journey, beautifully connected."; Malay "Perjalanan anda, terhubung
    dengan indah.").
  - **The map:** a wireframe-grade schematic whose route chip covers its own disclaimer on phones.
  - **Clipping:** board status chips cut to "Boardi"; provenance chips clipped at 320 px with 125% text.
  - **Malay:** words broken mid-syllable at 360 px with 125% text.

Round one's open question about photography was not revisited. The business lens still notes "no sense of place".

### Q4. Can passengers complete their most important tasks with minimal friction?

**More of them than in round one. Flight status, check-in, saving and the parking price now work well. Every purchase
still ends in a hand-off, and the tasks a wheelchair user travels on still fail for lack of data.**

| Task | Round one | Now [measured] |
|---|---|---|
| Flight status, terminal and gate | Yes | **Yes.** Next step, gate and boarding time on the first phone screen, in English and Malay |
| KLIA Ekspres fare and time | Yes, 2.2 screens down | **Yes**, dated. The concierge leads with RM 55. On the transport page the fare is at 1,821 px on a phone |
| When to arrive | Eighth screen at 125% text | **Yes** on the flight page. The home card can show an arrive-by time already past as "Next" |
| Where to check in | Contradictory | **Yes.** Per cabin, with card and timeline agreeing |
| T1 to T2 self-transfer verdict | 2,943 px down | **Improved.** The verdict is at 1,186 px and updates live, but sits under a five-question form on a phone |
| Save and return without an account | Yes | **Yes.** The home shows the saved flight at 294 px |
| Follow a flight with alerts | Partial | **Partial.** Beside Save; alerts only while the page is open; e-mail is a demonstration; none on iPhone outside an installed web app |
| Parking price for 3 days | Partial | **Improved.** Matrix on the first screen: Long Term Car Park at most RM 96 (daily maximum verified, hourly not); terminal car parks at most RM 156, not verified; Preferred Parking unpriced [chair] |
| Lounge with price | Partial | **Unchanged.** Location and hours; no price or access rules |
| Fast Track | Fails | **Partial.** Findable everywhere and offered after security; hand-off to the booking site; price, hours and seller not published |
| Buy parking, a lounge, a rail ticket or duty free | Fails | **Fails** (unchanged) |
| Immigration as a Malaysian with an elderly parent | Fails | **Fails.** "Our sources do not publish who may use the departure autogate" (D-07) |
| Accessible toilet near my gate | Fails | **Fails for lack of data.** The hub now says so and links the official assistance page, but search returns general toilets first |
| Step-free from arrival to taxi | Fails | **Improved.** The route names the lift at the change of level (760 m, 14 or 19 min), but ends at the pick-up kerb; the taxi counter is not mapped |
| Arrange wheelchair assistance | Partial | **Improved.** "My needs" adds an assistance step. AirAsia's rules are not published; the step is later announced "Done:"; the control is about eleven screens down at 125% text; the concierge leads an AirAsia wheelchair question with the Calm Room |

### Q5. Is the information accurate, complete and trustworthy?

**More accurate and better labelled than in round one. Still incomplete, and three new freshness and consistency
problems weaken trust.**

- **Trustworthy in method** (unanimous):
  - "Official" now appears only where an airport, airline, operator or government source supports the fact (D-01, 7
    pages traced).
  - The caveat block has gone from journey steps, and the parking warning is a rule.
  - Changed times are spoken in words.
- **New trust problems** [measured; confirmed by the chair where marked]:
  - Status lines carry the current clock time as "Checked 19:17" and default to "No disruption reported in our
    sources" when the source is a set of notices in the code. On a day when nobody has typed in a disruption, that is
    false reassurance [chair].
  - The concierge says parking rates are not verified while the page shows a verified daily maximum [chair].
  - "Done: Arrange assistance" reads as if assistance was arranged.
  - The accessibility statement still describes focus behaviour that has been fixed.
- **Complete: no.** info is 3.0 from all three lenses, with high confidence:
  - 3 of 39 airports go beyond an overview and a board.
  - Kuching and Langkawi have no transport or parking pages.
  - Terminal car-park rates are unverified; there are 8 outlets; lounges have no price or rules.
  - Fast Track details, accessibility facts and immigration guidance for citizens are missing.
- **Accurate: largely.**
  - The round-one logic errors (B-02, B-12) are fixed.
  - The remaining errors are in delayed-flight guidance and the home card's arrive-by time.
- **Operator-grade sourcing is unchanged.** Arrival steps cite third-party guides for MAHB's own building, and the
  Aerotrain notice hedges MAHB's own operations. An operator cannot publish either.

### Q6. Is the mobile experience exceptional?

**Good, now equal to the best benchmarks (mobile 4.0 from all three lenses, level with Heathrow, Schiphol and Changi).
Not exceptional.**

- **Strengths** [measured]:
  - one compact airport bar;
  - the answer on the first screen of every task page checked, including Malay at 125% text;
  - chrome that gives way on scroll;
  - no sideways scroll on 56 page and configuration pairs, down to 320 x 256;
  - Malay tab-bar labels that fit;
  - LCP about 1.1 s in the lab [verification].
- **Against "exceptional":**
  - pages of 8,500 px (home) to 17,436 px (hub at 125% text);
  - concierge answers 500 to 2,301 px tall;
  - Follow at about 1,195 px;
  - the needs control eleven screens down at 125% text;
  - TBT over 200 ms on 7 of 10 pages, on exactly the mid-range Android phones the strategy targets [verification];
  - no alerts on iPhone outside an installed web app;
  - at 400% zoom, a sticky concierge form that hides the focused suggestion;
  - Malay words broken mid-syllable.

### Q7. Does it support MAHB's commercial and operational objectives?

**Commercially, it is no longer a regression, but it is not yet an improvement. Operationally, the product layer is
now designed correctly. The operations it depends on are not connected.**

- **Commercial** (commerce 2.5 from all three, level with MAHB today):
  - **Now in place:**
    - Fast Track is findable, and is offered after security on international flights.
    - Parking shows prices first and carries the flight's dates.
    - The gate drives "near your gate" in shop and dine.
    - First-party measurement exists.
  - **Still missing:**
    - Nothing can be bought.
    - The main "Book parking online" link and the facilities Fast Track link carry no campaign parameter and send no
      hand-off beacon.
    - Metric counts are kept in server memory.
    - There are no partner referral codes.
    - The enforced headers (`payment=()`, `'unsafe-inline'`) would block a partner checkout as configured [chair].
- **Operational:**
  - **Now in place** (credited by the business lens, which took the strictest view in round one):
    - a status layer with a time and a source on each line, placed inside the journey step it affects;
    - demo queue estimates;
    - last-known data on feed failure;
    - missing sections that answer 404 on the first request.
  - **Still missing:**
    - The official flight provider is a stub.
    - Every notice is a code change and a deploy.
    - Status lines are inferred from notice titles.

### Q8. Is it differentiated enough to establish a new international benchmark?

**Differentiated, more clearly than in round one. A new benchmark, no.**

- **New strengths since round one**, on top of round one's differentiators (one network-wide flight search, dated
  provenance on every fact, an account-free journey timeline, the self-transfer planner, English and Malay at parity,
  the lightest pages and no third-party requests):
  - an answer-first next-step line;
  - status-aware timeline states;
  - an honest failure state;
  - a needs-aware timeline;
  - a search palette the design lens calls "the best search I have used on an airport site".
- **Why it is not a benchmark yet.**
  - At 74.5% it is 4.5 points below Heathrow, 8.5 below the composite and 16 below the target.
  - Every lens's projection, even with MAHB's data, lands at about 79 to 85%.
  - The deficit is in info and commerce, which the delivery team cannot close alone.
- **What would make it a benchmark** [judgement]: the lenses again name different things.
  - Business: a network-wide live status layer fed by operations, or one basket from the flight page.
  - Design: the concierge and density fixes.
  - Inclusion: the accessibility facts filled in and tested with people.

### Q9. The most significant remaining weaknesses

See section 5.

### Q10. What must be improved before public launch?

See section 6. The lenses agree on the items and differ in emphasis:

| Lens | Emphasis |
|---|---|
| Business | Integrations, publishing, measurement and release engineering |
| Design | Concierge, density and answer placement |
| Inclusion | Assistance wording, freshness labels, the statement and testing with people |

---

## 5. Ten most significant remaining weaknesses

Ranked by how many lenses named each weakness and how badly it fails a top task. "Team" means the delivery team can
fix it. "MAHB" means it depends on MAHB data, systems or partners.

1. **No live operational data, and status lines that overstate freshness.** Named by all three lenses.
   - Every flight, gate, check-in row, queue and space figure is demonstration data, and the official provider throws.
   - Notices are a code file, so every notice needs a deploy.
   - Status lines are inferred from notice titles, stamped "Checked hh:mm" with the current time, and default to "No
     disruption reported" [chair].
   - Who fixes it: Team (status semantics); MAHB (OOS-01 flight feed; OOS-02 operations feed and notices CMS).
2. **Content depth and operator-grade sourcing.** Named by all three lenses; info 3.0, high confidence.
   - Only KUL (17 URLs), PEN and BKI (6 each) go beyond an overview and a board.
   - Kuching and Langkawi, both international, answer 404 for transport and parking.
   - The 17 STOLports are directory cards.
   - There are 8 outlets; lounges have no price or rules; Fast Track details are not published.
   - Third-party sources are used for MAHB's own building.
   - The Malay is a draft.
   - Who fixes it: MAHB (OOS-05, OOS-06, OOS-08, OOS-14).
3. **Nothing can be bought, and measurement is partial.** Named by all three lenses; commerce 2.5.
   - There is no basket, lounge booking or reserve-and-collect, and no B2B enquiry channel.
   - The main parking and facilities Fast Track links are untracked.
   - Metric counts are kept in memory.
   - `payment=()` and `'unsafe-inline'` would block checkout.
   - Who fixes it: Team (E-17 hand-off marking, a durable metric store, E-09 per-route policy); MAHB and partners
     (OOS-03, OOS-04, OOS-13, D-17).
4. **Assisted travellers still lack the facts, and the assistance flow misleads.** Named by inclusion and design;
   business notes D-04.
   - Missing: accessible toilets, lifts, step-free transport, accessible bays, the airport's own assistance service,
     AirAsia's rules and the immigration wording for departing citizens.
   - Past steps are announced "Done: Arrange assistance".
   - There is no warning inside the airline's notice period.
   - The needs control is about eleven screens down at 125% text.
   - The accessibility statement is out of date and has no contact.
   - Who fixes it: Team (wording, placement, statement); MAHB, airlines and the Immigration Department (OOS-07, D-04,
     D-07).
5. **Day-of-travel residuals.** Named by business and design independently, and by inclusion.
   - The home card shows a past arrive-by time as "Next" (KL 885 at 18:21; MH 1698 at 18:35).
   - The delayed MH 1698 says both "keep to the original check-in times" and "closes at 19:00" (the new basis).
   - The next-step card omits the delay.
   - This is the same class of error as round one's B-02.
   - Who fixes it: Team.
6. **The concierge and search do not always answer the question asked, and surfaces disagree.** Named by all three
   lenses.
   - Unanswerable questions get unrelated items presented as "related" [chair].
   - Access qualifiers and named airlines are missed (wheelchair on AirAsia → Calm Room; "tandas OKU" → generic line;
     "lift from arrivals to the train" → transport list).
   - Template grammar ("do not publish smoking room") [chair]; a 2027 fare change is labelled "In effect".
   - Answers are 500 to 2,301 px tall on a phone.
   - Parking rates: the concierge says not verified and the page shows a verified daily maximum [chair].
   - Search: "smoking" returns 0 results; two results are titled only "Fast Track"; "taxi" lists the liquids rule
     [chair]; accessible-toilet queries return general toilets first.
   - Who fixes it: Team.
7. **Alerts do not reach a passenger whose browser is closed.** Named by all three lenses.
   - There is no push on iPhone outside an installed web app, and e-mail is a demonstration.
   - This is why flight stays at 4.0.
   - Who fixes it: MAHB and partners (OOS-10).
8. **Density and label noise.** Named by design, business and inclusion; A-14 not verified.
   - The flight page has 20 provenance chips, 10 Demo labels and 6 source toggles.
   - Facilities has 21 source toggles.
   - The home has about 70 upper-case labels and 12 type sizes.
   - Who fixes it: Team (the design owner's call on per-section source lists).
9. **Answer-first is unfinished beyond the four main pages, and there are layout defects on phones and at zoom.**
   Named by design and inclusion; business notes page length.
   - Answer positions: transport fare at 1,821 px, transit verdict at 1,186 px under the form, overview flight search
     at 2,175 px, desktop board at 938 px.
   - Pages are up to 17,436 px long.
   - The map's route chip covers its disclaimer (new, reproduced [chair]).
   - At 400% zoom the sticky concierge form hides the focused suggestion.
   - Chips are clipped ("Boardi", "Estimatec"), and Malay words break mid-syllable.
   - Who fixes it: Team.
10. **Release engineering and performance are unproven.** Named by all three lenses [verification].
    - TBT is over 200 ms on 7 of 10 pages.
    - Guidance pages exceed the 500 KB budget.
    - Congested Wi-Fi LCP is 2.57 to 2.68 s.
    - CI, WebKit, and the chaos and contract tests have never run.
    - The enforced CSP keeps `'unsafe-inline'`.
    - Rate limiting depends on the host declaring its client-address header.
    - There has been no usability study and no test with assistive technology.
    - Who fixes it: Team (A-09, E-01, E-02, E-03, E-06, E-09); MAHB (OOS-11, OOS-15 field data and recruitment).

---

## 6. What must still be improved before a public launch

The panel separates conditions that exist only in the prototype from product defects:

- **Prototype-only** (expected to disappear with production data; not counted against the design scores):
  - demonstration flights, gates, belts, check-in rows, queues and alerts;
  - illustrative map positions and Demo lifts;
  - unverified parking rates;
  - "not published" facts;
  - in-memory metrics;
  - the "Concept prototype, not official" banner.
- **Product defects** (stay after MAHB connects its data): every item in 6.1.

### 6.1 Fixable by the delivery team

1. **Status-line semantics until a feed exists.**
   - Drop "Checked hh:mm" on lines computed from static notices, and show the notices' own as-of date instead.
   - Show "Status not available" rather than "No disruption reported" when no current source exists.
   - Named by business and inclusion.
2. **Day-of-travel residuals.**
   - Once the arrive-by time has passed, the home card and My journey show the deadline that still matters
     ("Check-in closes hh:mm"), and never show a past time as "Next".
   - Delayed flights use one time basis throughout, and the next-step card shows the delay.
   - Past steps the traveller must confirm are not marked "Done:"; use "Past" or "Missed?" with what to do.
   - A warning appears inside the airline's assistance notice period, and the English copy is corrected.
   - Named by all three lenses.
3. **One fact, one answer.** The concierge and the help FAQ read parking rates from the same records as the parking
   page, with a content test that fails when they disagree. Named by business; confirmed by the chair.
4. **Concierge.**
   - A fallback that says it cannot answer and names the official contact.
   - Honour access qualifiers and the named airline, in English and Malay (lifts, wheelchairs, "tandas OKU").
   - Correct the template grammar and the "In effect" label.
   - On a phone, cap an answer at a lead line and two cards, with the rest behind "More".
   - Named by design and inclusion (B-08).
5. **Search relevance (A-12).**
   - Put the terminal in repeated titles, and add "smoking".
   - Fix "wifi" and "taxi".
   - Rank "not published" first for accessible-toilet queries, and rank news lower.
   - Make the home's "parking" suggestion lead with the right car park.
   - Stop the home field announcing "0 flights found" for topic queries.
   - Named by all three lenses.
6. **Answer-first and placement on phones and desktop.**
   - Transport fare above the warning; transit verdict at the top or sticky; desktop board's first row above a 900 px
     fold.
   - Follow and "My needs" reachable from the first two phone screens.
   - Map route controls above the map, and the chip moved off the disclaimer.
   - Sticky offsets that follow the header at 400% zoom, chips that wrap instead of clipping, and no Malay mid-word
     breaks.
   - Named by design and inclusion; business on Follow.
7. **Density (A-14).** One source list per section and one Demo marker per view, with fewer chips. Named by design;
   [verification] T5 item 8.
8. **Thin and directory-only airports.**
   - Hide the empty journey-mode switcher (Lawas), and show the operating airline and the airport's own contact.
   - Label the content depth of each airport on `/en/airports`.
   - Named by business.
9. **Measurement (E-17).** Mark every commercial hand-off with `data-handoff` and a campaign parameter: the main
   parking link, Fast Track on facilities and the timeline, lounge operator pages and rail tickets. Replace the
   in-memory metric store with a durable aggregate store. Named by business.
10. **Accessibility statement and Malay copy.**
    - Bring the statement up to date: current focus behaviour, test scope including 200% and 400% zoom, review date,
      and an accessibility contact with a response time, in both languages.
    - Malay pass: a task-based home `h1`, a Malay name for the concierge, and a shorter placeholder.
    - Named by inclusion.
11. **Performance and release gates.**
    - Bring TBT under 200 ms on the home, overview, board, transport, parking and map, or agree revised budgets with
      the design owner.
    - Meet the byte and request budgets, and congested Wi-Fi LCP of 2.5 s or less.
    - Run CI with WebKit, the chaos and contract tests, and the security and Lighthouse gates.
    - Backlog: A-09, E-01, E-02, E-03, E-06. Named by all three lenses; [verification] T5 items 1 to 5.
12. **A per-route CSP and payment policy for any future checkout (E-09).** Named by business.
13. **A moderated usability study on phones in English and Malay**, including NVDA, VoiceOver on iOS, TalkBack and
    magnifier users. The team runs it; MAHB recruits participants and signs it off (OOS-15). Named by design and
    inclusion.

### 6.2 Dependent on MAHB data, systems or partners

1. **Official flight feed** behind the provider interface, with the failure states proven against it (OOS-01).
2. **Operations status feed and a notices CMS** (OOS-02):
   - bilingual approvals, scheduling and an audit trail;
   - a notice live in under 5 minutes without a deploy;
   - a named operations owner.
3. **Official parking tariff** from the barrier rate source, and a booking deep link that accepts the product, the
   dates and a referral code (OOS-03).
4. **Fast Track and lounges** (D-02, OOS-04, OOS-13):
   - Fast Track seller, price, hours and checkpoints covered;
   - lounge access rules, prices and booking from each operator;
   - merchant or referral agreements, partner referral codes and confirmed conversions.
5. **Content minimum for every international airport**, Kuching and Langkawi first (OOS-05, OOS-06):
   - transport, parking, facilities with hours and location, and lounges;
   - a concessionaire directory feed;
   - the airport classification confirmed.
6. **Accessibility and assistance facts** (OOS-07, D-04, D-07, C-08):
   - for KLIA T1 and T2: located accessible toilets, lifts, wheelchair and buggy points and accessible bays, and the
     step-free status of every transport mode;
   - the airport's own assistance service and CARE chat hours;
   - assistance rules for AirAsia, AirAsia X, Batik Air and the other main carriers;
   - the Immigration Department's wording for departing citizens;
   - taxi counter, rail entrance and e-hailing places on a surveyed map.
7. **Operator-grade sourcing**, with MAHB as the source for its own building and services, plus brand, legal and
   native-Malay review and approval of the concept brand line (OOS-08, OOS-14).
8. **Alert delivery** by web push, including iOS, and by e-mail (OOS-10).
9. **B2B enquiry channels** for retail space, advertising, route development, cargo and Aeropolis (D-17).
10. **Hosting** (OOS-11, OOS-12, OOS-15):
    - edge rate limits;
    - the client-address header declared (`TRUSTED_CLIENT_IP_HEADER` or `TRUSTED_PROXY_HOPS`);
    - `security.txt`;
    - before launch, field Core Web Vitals on a mid-range Android.

**Order of work** [judgement]. The team items 6.1.1 to 6.1.3, 6.1.9 and the CI and TBT parts of 6.1.11, and the
MAHB items 6.2.1 and 6.2.2, are the conditions for a closed KLIA pilot (the business lens's, section 7 of its report). Everything
else in sections 6.1 and 6.2 stands between a pilot and a public launch.

---

## 7. Reproduce

- **Scores.** Per-reviewer scores and evidence are in the three `re-review-*.md` files. The medians and the weighted
  result are in [`re-review.json`](re-review.json).
- **Comparison figures.** These come from `matrix.json`, using `airports[].weighted_pct` and the per-dimension
  `scores`. The composite is the maximum of each dimension over the ten benchmark airports (MAHB excluded), weighted
  as above.
- **Chair's checks.** Serve the build with `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3305`, then run
  the checks with Playwright Chromium (`chromium.launch()`, desktop 1440 x 900 and the Pixel 7 profile):
  - read the rows of the first `main table` on `/en/kul/parking`;
  - `POST /api/concierge` with `{question, lang: "en", airport: "kul"}` for the parking, weather and smoking questions;
  - `/en/search?q=` with smoking, wifi, taxi and fast track;
  - the "Checked" lines on `/en/kul`;
  - on `/en/kul/map` with the Pixel 7 profile, choose From "Check-in Row B · Level 5" and To "Gates A · Gates", then
    hit-test the disclaimer label with `document.elementFromPoint`;
  - `curl -I /en`;
  - the sitemap per airport.

  Flight-specific observations depend on the clock time, because flights are generated around it.

---

## After the re-review: round four

Added on 21 November 2026 by the head of quality, after the panel reported. **The panel has not re-scored.** It has
not reviewed the round-four build or re-run its checks, so its scores (panel median 74.5%), its verdict and sections
1 to 7 above remain its judgement of the round-three build, unchanged. This section records verification status only;
nothing in it implies a score change.

After the panel reported, the delivery team ran a fourth fix round against section 6.1 and the four gallery defects
(`docs/prototype/README.md`, "Observations made while capturing", notes 1 to 4), in three packages:
[`../fixes/round4-trust.md`](../fixes/round4-trust.md), [`../fixes/round4-ask.md`](../fixes/round4-ask.md) and
[`../fixes/round4-layout.md`](../fixes/round4-layout.md). Each claim was checked independently on a production build
(build `ygqxXIFcmSWq51rkxYSGE`; [`../verification.md`, Round four](../verification.md#round-four)). Statuses below are
from that verification [verification]; figures are at 390 x 844 unless stated.

### Section 6.1, the delivery team's items

| 6.1 item | Status after round four | Evidence |
|---|---|---|
| 1. Status-line semantics | **Verified** (the concierge's own status sentence was aligned during verification) | 0 "Checked hh:mm" and 0 "No disruption" on the KLIA overview, flight page and transit page in English and Malay; lines without a notice say "Status not available"; the notice line says "Notice dated 7 Oct 2026"; the lead says "From notices published up to 7 Oct 2026. No live operations feed is connected yet.", with a link to the official contacts. [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes), [F3 item 2](../verification.md#f3-regressions-defects-and-changes-in-this-round) |
| 2. Day-of-travel residuals | **Verified**; other airlines' notice periods need airline data | MH 2626 delayed to 12:00, at 09:40: home card "Check-in closes 11:00 · Now"; flight summary "Delayed: now 12:00"; 0 "Done:", 4 "Past:"; one time basis; Malaysia Airlines' 48-hour warning and "Act now"; for AirAsia "we do not know how much notice AirAsia needs". [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes) |
| 3. One fact, one answer | **Verified**; the tariff itself needs MAHB (OOS-03) | The parking page, the concierge and the help FAQ give the same sentence per car park ("Rates not verified: our sources give a daily maximum of RM 32; …"); the content test "one fact, one answer" passes. [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes) |
| 4. Concierge | **Verified** | Unanswerable questions: "I can’t answer that from our verified content", with the group line, and no unrelated cards; wheelchair on AirAsia: AirAsia's rules not published, no Calm Room card; one grammatical "not published" phrase; the 2027 fare change not "In effect"; collapsed phone answers 788 to 1,181 px (was up to 2,301) with "Show N more items". [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes) |
| 5. Search relevance | **Verified** | "Fast Track (Terminal 1)" and "(Terminal 2)"; "smoking" and "merokok" 1 honest result; "wifi" honest result first; "taxi" 1 result, no liquids rule; "accessible toilet" and "tandas OKU" lead with "not published yet"; "parking" leads with the KLIA parking page; the home field no longer announces "0 flights found". [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes) |
| 6. Answer-first and placement | **Verified**, one residual | Transport fare at 433 px (Malay 495; re-review 1,821), above the warning; transit verdict at 454 px (re-review 1,186); map From at 544 px with 0 elements over the disclaimer; desktop first board row 798 to 850 px (Malay 819 to 871; re-review 938); Follow at 1,321 px and My needs at 1,375 px; at 320 x 256 nothing sticks; 0 clipped chips; 0 Malay mid-word breaks. Residual: the Malay fare at 125% text is at 881 px. [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes) |
| 7. Density (A-14) | **Partly met** | Source toggles: facilities 21 → 11, transport 9 → 4, transit 16 → 6; map tags 42 → 19, Demo labels 18 → 4. Not met: parking unchanged (8 toggles, 4 Demo labels); the flight page 21 tags, 7 toggles, 8 Demo labels; 9 type sizes on the home, `/ms`, the overview and the flight page (limit 8). [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes), [F8 item 5](../verification.md#f8-open-issues-ranked) |
| 8. Thin and directory-only airports | **Verified** (team part); the operating airline and own contact of 33 airports need MAHB data | Lawas: no journey-mode switcher, "This airport's own phone number: Not published"; KLIA lists its airlines; `/en/airports` and `/ms/airports` show a depth chip on all 39 airports (3 / 18 / 18) with a legend. [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes) |
| 9. Measurement (E-17) | **Verified** | `data-handoff` and a campaign parameter on parking booking, Fast Track (facilities, overview, flight timeline), lounge operators and rail tickets, with the beacon (e2e); the counts survived a server restart. Backlog item E-17 as a whole is not verified: answer states exist for three tasks only. [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes), [F2.6](../verification.md#f26-other-production-measurements-playwright-pixel-7-unless-stated) |
| 10. Statement and Malay copy | **Verified**; an accessibility contact and response time need MAHB | Statement in English and Malay: "Last reviewed 21 November 2026", current focus behaviour, 200% and 400% zoom, WebKit not tested, official channels. Malay home `h1` "Semak penerbangan, rancang perjalanan anda."; "Tanya Kami" in the title, `h1`, navigation and (after a verification fix) the privacy, terms and offline copy; the short placeholder fits. [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes), [F3 item 3](../verification.md#f3-regressions-defects-and-changes-in-this-round) |
| 11. Performance and release gates | **Not met.** Not a round-four package item; verification ran the CI jobs locally | TBT over 200 ms on 7 of 10 pages; performance under 95 on 3 of 10 (the concierge 97 → 93, TBT up about 80 to 100 ms); a flight page 68 to 75 with LCP 4.2 to 4.9 s; content-page JavaScript 198.8 to 227.9 KB. The CI jobs pass locally except the Lighthouse step, whose configuration error was fixed and which now fails 14 assertions; CI has not run on a runner and WebKit has not run. [F2.4](../verification.md#f24-lighthouse-mobile-3-runs-median-scriptsqalighthousemjs-lighthouse-136-moto-g-power-simulated-slow-4g-4x-cpu), [F2.5](../verification.md#f25-first-load-javascript-and-rc-reveals), [F7](../verification.md#f7-ci-run-locally-githubworkflowsmalaysia-airports-ciyml), [F8 items 1 to 4](../verification.md#f8-open-issues-ranked) |
| 12. Per-route CSP and payment policy (E-09) | **Not started** | E-09 not verified; the enforced CSP keeps `'unsafe-inline'`. [F5](../verification.md#f5-acceptance-all-101-p0-and-p1-items), [F8 item 10](../verification.md#f8-open-issues-ranked) |
| 13. Moderated usability study | **Not run**; a plan is written | [`../usability-study-plan.md`](../usability-study-plan.md): the team runs it; MAHB recruits and signs it off (OOS-15) |

Items 1 to 10, as verified: **9 verified, 1 partly met, 0 not verified, 0 regressed.** Every number in the round-four
logs that verification re-measured matched, except Follow and My needs (4 px higher than logged) and the parking
page's Demo labels (4, not 5).

Section 6.2 (MAHB data, systems and partners): no item changed; none was in round four's scope.
[F8 item 12](../verification.md#f8-open-issues-ranked) lists the facts still needed.

### The gallery defects

| Gallery note | Status | Evidence |
|---|---|---|
| 1. React error #419 on three 404s | **Verified** | `/en/no-such-page`, `/ms/tiada-halaman` and `/en/guides/no-such-guide` answer 404 on `next start` with the `h1` in the server HTML, 0 failed boundaries and 0 console errors. A different route still falls short: the `[lang]/[...rest]` catch-all 404s send Next's empty error document ([F8 item 7](../verification.md#f8-open-issues-ranked)) |
| 2. Next-day rows without a date | **Verified** | Ipoh at 11:00 on 18 November: "15:30", "09:25 Tomorrow", "10:45 Tomorrow" |
| 3. Offline page against its toast | **Verified**, on the production service worker | Offline before the worker was ready: the card and the toast both say nothing is saved yet; back online, registration is retried; offline after it was ready: both say saved information is shown |
| 4. "MH 2" | **Verified** | 9 results, all demonstration flights; no result on the digit alone |

Evidence for all four: [F4](../verification.md#f4-acceptance-re-review-61-and-the-gallery-notes). Notes 5 (the
browser's own date fields) and 6 (advice to presenters on the clock) are observations, not product defects.

### Backlog, and what the panel has not seen

- **Backlog acceptance** [verification, round four]: unchanged at 85 of 101 P0 and P1 items verified, 16 not
  verified, 0 regressed. A-14, D-04, E-17 and E-06 moved closer and are still not verified
  ([F5](../verification.md#f5-acceptance-all-101-p0-and-p1-items)). End-to-end: 434 tests, 428 passed, 0 failed, 6
  skipped; axe 0 violations at 59 call sites.
- **Found by verification after the panel reported** (not assessed by the panel): the concierge's Lighthouse score
  fell from 97 to 93; a flight page measured 68 to 75 with LCP 4.2 to 4.9 s, and the board's LCP was 4.7 s at night
  with an empty window; the catch-all 404s above; the "LGK" label clipped on the `/en/airports` map at 1440 px
  ([F3](../verification.md#f3-regressions-defects-and-changes-in-this-round),
  [F8](../verification.md#f8-open-issues-ranked)).
- **The pilot conditions in "Order of work"** (section 6) [judgement, head of quality, not the panel]: team items
  6.1.1, 6.1.2, 6.1.3 and 6.1.9 are verified; the CI and TBT parts of 6.1.11 are not met; MAHB items 6.2.1 (the
  official flight feed) and 6.2.2 (an operations feed, a notices CMS and a named owner) are not met. The conditions
  for the closed KLIA pilot that the panel adopted are therefore not yet all met.
