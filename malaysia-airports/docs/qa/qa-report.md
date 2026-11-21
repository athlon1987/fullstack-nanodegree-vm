# Quality assurance report

Product: working concept redesign of the Malaysia Airports (MAHB) passenger and corporate websites.
Owner: head of quality. Date: 22 November 2026 (Kuala Lumpur time).
Build assessed: the production build in `.next` (build ID `b4AW-Kxsx1vSRiJq7KWD0`; Next.js 16.4.6, React 19.3.0,
Tailwind CSS 4.3.3), the final build verified in round five of [`verification.md`](verification.md) (sections G1 to
G9) and scored by the third review ([`panel/review-3.md`](panel/review-3.md)). This edition replaces the round-four
edition of 21 November; earlier rounds' figures are kept as history where the report compares rounds.

This is the document to read to judge how good the product is and what remains. It adds no new testing: every
figure comes from the QA evaluations of 18 November, the review panels of 18, 21 and 22 November, the five fix rounds
and their verification on the production build, apart from the few corrections marked [fact-check]. Each section
names its source.

**How to read it.**

- **[measured]** means a tool or script produced the number on a production build. **[judgement]** means expert
  assessment. Unlabelled statements of status come from [`verification.md`](verification.md).
- **Before** means the QA evaluations of 18 November 2026 (for links, the integration crawl of 17 November).
  **After** means verification round five, 22 November 2026, on the build above. **R1** to **R5** are the
  verification rounds. **[third review]** marks a finding of the third review panel, and **[chair]** one its chair
  checked on the running build; neither was re-measured by verification. **[fact-check]** marks a correction from the
  documentation fact-check of 22 November, measured on the same build.
- **Prototype-only** marks a condition that exists because this is a prototype on demonstration data (for example
  simulated flights) and is expected to go away with production data, not a defect of the design.
- **Team** means the delivery team can fix it. **MAHB** means it depends on MAHB data, systems or partners.
- All browser testing ran in Chromium (desktop 1440 x 900 and a Pixel 7 profile at 390 x 844, plus narrower
  viewports). WebKit, iPhone Safari, real devices and physical screen readers were not used anywhere.

---

## 1. Summary verdict

**Ready for:** stakeholder demonstrations, as a labelled concept on demonstration data, and **moderated sessions
with recruited participants**: observed, with scripted scenarios and the demonstration data presented as such. The
formative round of the usability study can run on this build; its plan is
[`usability-study-plan.md`](usability-study-plan.md). The third review reached the same position and advises fixing
the saved-flight failure and the concierge focus defect first, to keep sessions off known defects
([`panel/review-3.md`](panel/review-3.md), section 8).

**Not ready for:** a public launch, a closed pilot at KLIA, or any use in which real passengers act on its flight,
gate or status information without a moderator. The evidence below supports that limit and does not support more.

**What is proven** [measured, Chromium, production build]:

- The build has 0 type errors, 0 lint problems and 0 build warnings (363 static pages). All 581 unit tests in 41
  files pass (577 as delivered, in 7 of 7 runs). Of 526 end-to-end tests on the desktop and phone projects, 512 pass
  and 14 are deliberate skips, with 0 failures in the final runs on the real clock and with the browser clock at
  night, and in CI mode (two earlier night runs failed on harness and intermittent causes; section 10.7). No
  assertion was removed.
- axe-core reports 0 violations at 55 scan call sites in 14 specs on both projects, and in 68 further scans of the
  states round five added. The eight WCAG 2.2 criteria the accessibility audit found failing (five of them Level A,
  including Label in Name on every airport page) are fixed and verified. Lighthouse accessibility is 100 on every
  run. (The third review found one focus defect that the automated scans do not catch reliably; see below.)
- The link crawls find 0 broken internal links and 0 missing anchors: 438 static pages and 1,170 links, 285
  rendered pages and 1,541 links, and 446 search-index documents. Every sitemap page has exactly one canonical, in
  the response header and in the HTML head (276 of 276), and no page's `h1` is revealed late by React's `$RC`
  script (0 of 276).
- In the lab, under Lighthouse's slow-4G profile, LCP is 2.5 s or less on 10 of 10 pages (largest 1.15 s), on a
  flight page (1.22 s; round four 4.2 to 4.9 s) and on the empty night board (0.92 s; round four 4.7 s). CLS is at
  most 0.003 (median) on the 10 pages.
- First-load JavaScript of the shared shell fell from 70.1 to 33.0 KB (gzip); no route is over 250 KB, and 18 of 39
  are at 170 KB or less (round four 0).
- 85 of the 101 P0 and P1 backlog items are verified against their acceptance criteria, and none has regressed.
- Of round five's 18 claims, 16 are verified and 2 partly (TBT; the home's type sizes with a saved flight). Of the
  second review's team items that round four addressed (re-review 6.1.1 to 6.1.10), 9 remain verified and 1
  (density, 6.1.7) partly met. Status lines do not claim a check time or "No disruption", and parking rates read as
  one fact on the page, in the concierge and in the help FAQ.
- In the content audit, every extracted figure traced to a sourced content record or to labelled demonstration or
  estimated data; no fabricated value was found. A source policy, under which "Official" needs an authoritative
  source, is enforced by tests.
- The two high-rated security defects (unbounded request body, spoofable rate-limit key) and the cross-site posting
  defect are fixed and verified. Production dependencies have 0 known vulnerabilities.

**What is measured and not met:**

- **Resilience** [third review, chair]. With a flight saved, one failed script download (2 of 14 lazy scripts on the
  home, 2 of 10 on My journey) replaces the whole main page area with "Something went wrong", and "Try again" does
  not recover once the connection returns. Verification had recorded the residual as the card and control failing
  in the page; it is page-level. On airport Wi-Fi this is the likeliest failure for a returning passenger.
- **Focus** [third review, chair]. At 1280 x 720 the concierge's sticky question box covers the suggestion that has
  keyboard focus (button 649 to 720 px, box from 651 px), at best a marginal pass of WCAG 2.4.11. In-page links and
  palette selections leave focus on the page body. The accessibility statement says both work.
- Total blocking time is over 200 ms on 8 of 10 pages in the first Lighthouse set and 6 of 10 in the second
  (pooled medians 227 to 308 ms on eight pages). Lighthouse performance is 95 or more on 8 of 10 and 7 of 10; it is
  under 95 on `/ms` (94, 91) and `/en/kul` (94, 93). 2 of 30 interaction runs exceeded 200 ms (232 and 224 ms).
- LCP on the congested airport Wi-Fi profile is 2.57 s (`/en`) and 2.65 s (board) against 2.5 s, re-measured.
- First-load JavaScript is over 170 KB on 21 of 39 routes (170.3 to 212.2 KB). Guidance pages transfer 539 to 605
  KB against 500; HTML is over 40 KB gzip on 14 of 22 pages measured; the service worker's first visit is 61
  requests and 643 KB against 60 and 600. Run locally, the CI Lighthouse step fails 10 assertions (round four 14).
- Density (A-14) is now met on parking and the flight page as well, but 8 of 280 pages use 9 type sizes at 390 px
  (the home with a saved flight among them) and 11 exceed 8 at 1440 px, against a limit of 8.
- 16 P0 and P1 items are not verified, 9 of them P0. The backlog's own rule is that all 48 P0 items close before
  any public pilot.

**What is not proven, because it cannot be in this setting:**

- Field Core Web Vitals: there is no traffic.
- Task success with real passengers: no study has run. A study plan is written.
- What screen-reader users experience: no physical assistive technology was used.
- Behaviour on Safari and iOS: the WebKit project has never run (this container has no WebKit browser).
- The CI pipeline: its jobs were run locally in rounds four and five, but it has never run on a runner.
- The accuracy of operational data: every flight, gate, check-in row and queue time is demonstration data, and the
  official flight provider is a stub (prototype-only).

**Why not a public launch** [judgement, on the evidence above and the third review]:

1. **Operational data.** There is no live flight or operations source. The status lines say so ("Status not
   available", with the notices' own date), and since round five the concierge reads flights from the same server
   feed as the board, but that feed is demonstration data (MAHB for the feeds).
2. **Day-of-travel guidance on real data.** It is right in every state the reviewers tried, but it has only ever run
   on demonstration flights, and the assistance notice periods of airlines other than Malaysia Airlines are unknown
   (airlines, MAHB).
3. **Reliability for returning passengers.** One failed script fetch blanks the home and My journey of a passenger
   with a saved flight, with no working recovery (Team).
4. **Assisted travel.** The facts a wheelchair user travels on are missing: accessible toilets, lifts, step-free
   transport and most airlines' assistance rules (MAHB, airlines). The accessibility statement makes two claims that
   are not true on this build (Team).
5. **Evidence.** There is no real-user, assistive-technology, Safari or field evidence, and CI has not run on a
   runner (Team, with MAHB recruitment).
6. **The panel.** All three lenses of the third review independently judged it not ready for public launch, and not
   yet ready for a closed KLIA pilot. The panel median is 75.5% (up 1.0 point from 74.5%), below Heathrow (79.0%)
   and the strategy's target (90.5%).

The second review recommended a **closed pilot at KLIA** with real passengers, on five team conditions and two MAHB
ones ([`panel/re-review.md`](panel/re-review.md), section 6). The third review keeps them and adds three team
conditions ([`panel/review-3.md`](panel/review-3.md), sections 4.1 and 8). Their status on the round-five build:

| Condition | Owner | Status after round five and the third review |
|---|---|---|
| CI run, with the TBT budgets met or agreed anew | Team | **Not met.** The jobs ran locally only; the Lighthouse step fails 10 assertions (14 in round four); pooled TBT 227 to 308 ms on eight pages; no revised budget agreed |
| Durable commercial measurement | Team | **Met** (6.1.9 verified; the business reviewer clicked 5 of 5 hand-offs, each counted). E-17 as a whole is not verified: answer states exist for three tasks only |
| One source per fact (parking rates) | Team | **Met** (6.1.3 verified). Low residual: the concierge's long-stay card states RM 32 without its qualifier [third review] |
| Day-of-travel residuals | Team | **Met** (6.1.2 verified); other airlines' notice periods need airline data |
| Status-line wording | Team | **Met** (6.1.1 verified) |
| Official flight feed connected | MAHB | **Not met** (OOS-01) |
| A named owner for notices | MAHB | **Not met** (OOS-02) |
| No lazy part replaces a page after a failed script fetch, and "Try again" recovers (added by the third review) | Team | **Not met** [chair] |
| The concierge's sticky question box does not hide the focused suggestion (added) | Team | **Not met** [chair] |
| The accessibility statement is true and dated after those fixes (added) | Team | **Not met**: two sentences untrue; review date before round five |

I agree with those conditions. 4 of the second review's 7 are met, all of them team items; the CI and TBT condition,
both MAHB conditions and the three new team conditions are not. Until they are, moderated sessions are the ceiling
[judgement].

---

## 2. The brief's acceptance targets

The brief sets Core Web Vitals as 75th-percentile **field** values on mobile. A prototype with no traffic can only
show lab values; those indicate risk and do not confirm or refute the field target. Task-success targets need
real participants. Both are marked accordingly.

| Target (brief) | Before (18 Nov) | After (round five, 22 Nov) | Method | Status |
|---|---|---|---|---|
| **WCAG 2.2 AA** | 8 of 55 criteria fail (1.3.1, 1.4.11, 2.1.4, 2.2.2, 2.4.3, 2.4.7, 2.5.3, 3.1.2); 15 findings, 4 high | All 8 fixed and verified. axe 0 violations at 55 call sites in 14 specs on 2 projects (round four 54 in 13; first reported as 60 in 13 and 59 in 12) and in 68 scans of the states round five added; one intermittent `target-size` result in one night run, not reproduced in 236 repeats. One more Level A failure (2.5.3, phone bar) was found in verification round one and fixed. The third review's inclusion lens (70 axe scans; keyboard, reflow and zoom in six window sizes) found the concierge's sticky question box covering the focused suggestion at 1280 x 720 and 1440 x 900, at best a marginal pass of 2.4.11, with axe `target-size` on `/ms/concierge` at 1440 x 900 on 3 of 3 loads; the chair confirmed the geometry. In-page links leave focus on the page body. The accessibility statement (reviewed 21 November) says both work | axe-core in Playwright (wcag2a to wcag22aa); manual audit of keyboard, focus, contrast, reflow and motion (18 Nov); inclusion re-review (21 Nov) and third review (22 Nov); e2e at 320 x 256 and 320 px with 125% text | **Partly met.** One known defect at the edge of AA (2.4.11, the concierge) and two untrue sentences in the statement; conformance cannot be claimed: no screen reader, no WebKit, and the manual audit has not been repeated in full. The statement has no accessibility contact (MAHB publishes none) |
| **LCP 2.5 s or less** (p75, field) | Lab: 9 of 15 pages pass; 6 at 4.1 to 4.8 s. Congested Wi-Fi 2.8 to 2.9 s | Lab: 10 of 10 at 0.91 to 1.12 s (first-set medians; 1.15 s in the second set; largest single run 1.20 s). A flight page 1.22 s (round four 4.2 to 4.9 s); the empty night board 0.92 s in English and 0.91 s in Malay (round four 4.7 s). Congested Wi-Fi 2.57 s (`/en`) and 2.65 s (board), re-measured (round three 2.57 and 2.68 s) | Lighthouse 13.6, simulated slow 4G, 4x CPU, median of 3, two sets; browser clock at 23:30 for the night board; applied Wi-Fi profile | **Partly met in the lab** (met on every page measured under slow 4G, the flight page and the night board included; not on congested Wi-Fi; shop and dine and transit, which failed before, were not re-measured). Field: **not measurable in a prototype** |
| **INP 200 ms or less** (p75, field) | Worst interaction per page: board 784 ms, home 408 ms; 4 of 6 pages over. Up to 1,472 ms during hydration | Worst interaction per run at 4x CPU: 2 of 30 runs over 200 ms (home journey mode 232 ms, `/en/kul` airport switcher 224 ms, both in the first of two sets; round four 0 of 15). 0 of 10 inputs lost before hydration in each of four cases. TBT, the load-time proxy, is over 200 ms on 8 of 10 pages in the first set and 6 of 10 in the second | Event Timing in Playwright (Pixel 7, 4x CPU, 2 sets of 3 runs); Lighthouse TBT | **Partly met in the lab.** Field: **not measurable in a prototype** |
| **CLS 0.1 or less** (p75, field) | `/ms` 0.161; desktop 0.23 to 0.29 on four pages; My journey 0.11 to 0.23; concierge 0.14 (phone) | Lighthouse at most 0.003 (median) on 10 of 10, the flight page and the night board; home 0 in all 36 loads; desktop: airport section pages 0.0004 to 0.0005 (round four 0.025 to 0.026), transport 0.0004 and 0.0012 (0.045 to 0.049), board 0.008, flight page 0.009, `/en/kul` 0.011; the empty night board at 1440 px 0.023 (English) and 0.041 (Malay), newly measured | Lighthouse; Playwright layout-shift observer, phone and desktop | **Met in the lab.** Field: **not measurable in a prototype** |
| **Lighthouse performance 95 or more** (mobile) | 0 of 15 (56 to 92) | 8 of 10 in the first set (not `/ms` 94, `/en/kul` 94) and 7 of 10 in the second (not `/ms` 91, `/en/kul` 93, the map 94); round four 7 of 10. The concierge's round-four fall is recovered (93 → 97 and 98). A flight page 94 and 96 (round four 68 to 75); the empty night board 95 to 96 (76 to 78) | Lighthouse 13.6, median of 3, two sets | **Not met** (7 to 8 of 10) |
| **Lighthouse accessibility 95 or more** | 100 on 15 mobile and 2 desktop pages | 100 on every run of round five | Lighthouse | **Met** (automated check only) |
| **Mobile responsiveness** | ~440 px of airport chrome above every task answer on phones; sideways scroll at 320 px with 125% text (transport 30 px, help 15 px) | No sideways scroll found: the e2e reflow tests pass, and the third review found none on 28 pages at 125% text and down to 320 x 256 (round four's scripted set of 108 loads was not repeated). At 390 x 844: transport fare at 431 px (Malay 493; second review 1,821); the Malay fare at 125% text at 717 px, now on the first screen (round four 881); transit verdict at 454 px; board first row, Follow and My needs as in round four. Not met: the overview's flight search at 2,236 px on a phone [chair]; "My needs" at 1,870 to 2,142 px at 125% text [third review]; about two board rows above a 900 px desktop fold (first rows at 813, 865 and 917 px) [chair]. The header and bottom bar break with device font scaling at 200% (not a WCAG failure) [third review] | Playwright Chromium emulation; round-four and round-five acceptance scripts; third review | **Partly met.** Met for layout and for the answer's place on the key phone tasks in Chromium; not for the overview's flight search, the needs control at 125% text or the desktop board; WebKit and real devices untested |
| **Critical task completion 95% or more** | Simulated walkthrough: 28 of 36 runs (78%) | Not re-measured as a set after the fixes (section 6). The third review judged the day-of-travel tasks achievable with little friction and the purchase and assisted-travel tasks not [judgement] | 18 scripted tasks x 2 viewports, one expert evaluator, no users | **Not measurable in a prototype.** Needs the study in [`usability-study-plan.md`](usability-study-plan.md) |
| **Unaided task success 90% or more** | Simulated: 26 of 36 runs (72%) | Not re-measured | As above | **Not measurable in a prototype** |
| **Broken internal links: none** | 0 at integration (6 found and fixed then): 380 pages, 978 links | 0 broken, 0 missing anchors: static 438 pages and 1,170 links; rendered 285 pages and 1,541 links; search index 446 documents, none with "[object Object]" (4 in round four) | Static and rendered crawls seeded from the sitemap; search-index check (`scripts/qa/`) | **Met** |
| **Operational data accuracy** | Flight data generated in the browser; 9 records tagged "Official" on news or blogs; demo values on screen with no label in view | Flights, gates, queues and alerts are still demonstration data (prototype-only); the official provider throws. Since round five the concierge's flight answers come from the server feed, and the demonstration generator is in no client chunk (B-09). Status lines say "Status not available" and give the notices' date. Static facts: source policy enforced by test; a demo label in view on the board rows, previews and flight values checked. The third review found labels that mislead: the 2027 KLIA Ekspres fare badged "In effect now" on the KLIA overview, and demonstration lifts unmarked in search [chair] | Content-integrity crawl (496 renders); content tests; verification; third review | **Not measurable in a prototype.** Provenance and labelling of static content: met in the tested scope, except the labels the third review found |

---

## 3. Automated testing

Sources: [`../engineering/handoffs/integration.md`](../engineering/handoffs/integration.md) (17 November, before
QA); [`verification.md`](verification.md), sections 2, R2, T2, F2, F6, F7, G2, G6 and G7.

### 3.1 What exists

| Suite | Covers | At integration (17 Nov) | Round five (22 Nov; round four in brackets) |
|---|---|---|---|
| Types and lint | `tsc --noEmit`, ESLint | 0 errors, 0 problems | 0 errors, 0 problems |
| Unit (Vitest) | Content validation and source policy (46 tests in `content.test.ts`); journey timeline states; board model and flight changes; feed providers, including failure and last-known data (the chaos and contract tests); concierge engine and server (rate limits, red-team prompts); search ranking; sitemap, redirects, canonical and security headers; storage and link sanitising; parking, transport, transit and map logic; i18n; time; the durable metric store; the retrying import (round five) | 29 files, 363 passed | **41 files, 581 passed**, 0 failed (577 as delivered, in 7 of 7 runs; 4 added by verification) (36 files, 554) |
| End-to-end (Playwright) | 17 specs: shell (header, phone bar, focus, first-screen positions, reflow), smoke (both languages, home, search, airport choice), flights (board, flight page, save, follow, codeshare), concierge, commerce (parking, shop and dine), transport, map, guides and help, corporate, platform (headers, CSP, API refusals, rate limits, canonical, sitemap, 404 caching), cross-package hand-offs, round four's trust, ask and layout specs (status lines, day-of-travel states, one fact one answer, placement, zoom, the statement), and round five's speed, flight and polish specs (92 tests, among them a failed lazy script on the offline and flight pages) | 178 tests: 176 passed, 2 skipped | **526 tests: 512 passed, 0 failed, 14 skipped** (deliberate, project-specific), on a production build, desktop and phone projects, with the real clock, in CI mode and with the browser clock at night (434: 428) |
| Accessibility (axe-core) | Shared tag list `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` in `e2e/support/axe.ts`, run inside the specs | 41 call sites, 0 violations (5 specs omitted `wcag21a`; one ran a single rule) | **55 call sites in 14 specs, 0 violations**, plus 68 scans of round five's new states, 0 violations (54 in 13; first reported as 60 in 13 and 59 in 12, a count that included six local helper definitions and missed `shell.spec.ts`) |
| Scripted accessibility | Reflow at 320 px with 112% and 125% text in three themes; focus-indicator contrast in four themes | n/a | Round four: 108 loads, 0 sideways scroll; focus outlines 6.92 to 11.06:1 (not repeated in round five) |
| Link checks | Static crawl from every sitemap URL; rendered crawl after hydration (sitemap plus 9 client-heavy pages); search index; canonical and hreflang per response | 0 broken | 0 broken, 0 missing anchors, 0 redirects; one self-canonical with both language alternates on 276 of 276 sitemap URLs; exactly one canonical in the HTML head on 276 of 276 (152); hreflang alternates in the head on 152 (all 276 in the `Link` header); `h1` revealed by `$RC` on 0 of 276 |
| Content | `validateAllContent()` and the content tests: every record sourced, source ids exist, "Official" only on authoritative sources, social posts never Official, ISO dates, records older than 12 months flagged, rates consistent with status, map graph connected; a 138-page Malay crawl for English text outside `lang="en"` | `validateAllContent()` 0 issues | Unit tests pass; Malay crawl 0 audited English strings (D-03; round four) |
| Dependencies | `npm audit --omit=dev` and `npm audit` | | 0 and 0 vulnerabilities |

The integration-time axe count looked clean only because the tag lists were incomplete. Making them complete in
verification round one exposed a real Level A failure (section 4).

### 3.2 Gaps in the automation

- **CI has never run on a runner.** The CI workflow,
  [`.github/workflows/malaysia-airports-ci.yml`](../../../.github/workflows/malaysia-airports-ci.yml), has steps for
  types, lint, unit tests, build, the end-to-end tests on desktop, phone and WebKit phone, the Lighthouse budgets, an
  `npm audit` gate, CodeQL and gitleaks (E-06). Rounds four and five ran its jobs locally
  ([`verification.md`](verification.md), F7 and G7): install, audit, route types, type check, lint, the 581 unit
  tests, build and the desktop and phone end-to-end tests pass (512 passed, 0 flaky in CI mode). The Lighthouse step
  fails 10 assertions (14 in round four), as the budgets predict (section 5.3). WebKit, CodeQL and gitleaks could not
  run in the container.
- **WebKit has never run.** With `PLAYWRIGHT_WEBKIT=1` every `webkit-phone` test stops at browser launch: the
  container has no WebKit build.
- **Some checks still live outside the repository.** The crawls, search-index, canonical, `$RC`, first-load
  JavaScript, Lighthouse, interaction-latency, layout-shift, type-size, night-clock and acceptance scripts are in
  `scripts/qa/` with a README (round five added `acceptance-round5.mjs`, `type-sizes.mjs` and `night-clock.cjs`). The
  service-worker, early-input and HTML-size checks, the night-board Lighthouse run with a shifted clock
  (`lh-clock.mjs`) and the failed-script probes were run from scratch copies and are not committed.
- **Failure states are tested only in part.** Round five's e2e test fails every lazy script on the offline page and
  the flight page and checks that both keep their content. The saved-flight state of the home and My journey is not in
  it; that is where the third review found the page-level failure (section 1).
- **Performance is not part of the test run.** Lighthouse and the interaction measurements are manual lab runs;
  the CI budget step is the only automated performance check, and it has not run on a runner.
- **Test sensitivities.** Tests that read the board need a fixed clock at night: with the real clock the window can
  hold no demonstration departures from about 22:55 (to between 01:00 and 05:05, depending on the date). Round five
  added `scripts/qa/night-clock.cjs`, which runs the unchanged suite with the browser clock at 23:30; the final night
  run passes (512 passed, 0 failed). `shell.spec` A-03 now has its own client address (30 of 30 on repeat), but
  `flights.spec` "announces a change to a saved flight once" shares its worker's address and meets the feed's rate
  limit when repeated (14 of 20 with `--repeat-each=10`; 4 of 4 with a fresh address). One axe `target-size` result
  on the concierge appeared in one night run and not in 236 repeats; the third review's geometry explains it
  (section 4.3). All low.

### 3.3 How to run them

From `malaysia-airports/`, as in [`verification.md`](verification.md), section G9:

```bash
npm ci
npx next typegen                                            # route types; tsc fails without them on a clean checkout
npx tsc --noEmit && npx eslint . && npx vitest run          # types, lint, 581 unit tests (content validation included)
npm audit --omit=dev && npm audit
rm -rf .next && NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off                             # desktop and phone; axe runs inside the specs
NODE_OPTIONS="--require ./scripts/qa/night-clock.cjs" E2E_NIGHT=2026-11-18T23:30:00+08:00 npx playwright test --trace off   # the same suite at night
PLAYWRIGHT_WEBKIT=1 npx playwright test --project=webkit-phone   # after `npx playwright install webkit`; never run yet
npm run budgets                                             # Lighthouse CI budgets (lighthouserc.json); port 3100 must be free; fails today
# crawls, canonical, $RC, first-load JavaScript, Lighthouse, latency, layout shift, type sizes, acceptance: see scripts/qa/README.md
```

The server must trust the test client header. Without it, every worker shares one rate-limit bucket and the flight
pages answer 429. Set `E2E_STATUS_CODES=1` when `PLAYWRIGHT_BASE_URL` points at an external server, or the status-code
test (C-06) skips.

---

## 4. Accessibility

Sources: [`accessibility.md`](accessibility.md) (18 November); [`verification.md`](verification.md);
[`panel/re-review-inclusion.md`](panel/re-review-inclusion.md) (21 November);
[`panel/review-3-inclusion.md`](panel/review-3-inclusion.md) and [`panel/review-3.md`](panel/review-3.md), section 1.4
(22 November); [`fixes/round4-layout.md`](fixes/round4-layout.md), [`fixes/round4-trust.md`](fixes/round4-trust.md)
and [`fixes/round5-polish.md`](fixes/round5-polish.md).

### 4.1 Before

The audit covered 55 WCAG 2.2 A and AA criteria: **36 pass, 8 fail, 11 not applicable** (no media, sign-in or
personal-data forms). Strengths at the time [measured]:

- All nine critical journeys could be completed with the keyboard alone.
- Dialogs contained and returned focus.
- Reduced motion was honoured.
- 0 contrast failures in five display modes.
- 0 of 2,520 focus stops were hidden by sticky bars.

### 4.2 The failing criteria and what happened to them

| Criterion | Level | Finding (before) | Backlog | Status after |
|---|---|---|---|---|
| 1.3.1 Info and Relationships | A | Delayed times shown only by strike-through ("17:25 18:20"); one heading out of order on transport | B-10, C-10 | Verified: hidden text "Scheduled 18:20, now 18:55"; heading order test passes |
| 1.4.11 Non-text Contrast | AA | Active search option 1.22:1 (light), 1.03:1 (dark); focus ring on the yellow demo banner 1.09 to 1.16:1 in dark themes | A-06, A-22 | Verified: 2 px outline at 6.92 to 11.06:1 in four themes; banner ring 3 px at 11.1:1 |
| 2.1.4 Character Key Shortcuts | A | "/" opened search with no way to turn it off | A-23 | Verified: "/" alone does nothing; Ctrl+K opens search |
| 2.2.2 Pause, Stop, Hide | A | Board auto-updated every 30 s with no pause | B-18 | Verified: pause and resume, announced |
| 2.4.3 Focus Order | A | After an in-page link, the next Tab jumped to the footer | A-05 | Verified: focus on the new `h1` after client navigation |
| 2.4.7 Focus Visible | AA | Active search option invisible in dark theme; search field without a ring | A-06 | Verified (as 1.4.11) |
| 2.5.3 Label in Name | A | Airport switcher shows "KUL" but was named "Change airport. Currently KLIA", on every airport page | A-02 | Verified: name starts with the visible text. A second failure (phone bar "1Journey") was found in verification round one and fixed |
| 3.1.2 Language of Parts | AA | English source titles on 77 of 123 Malay pages without `lang="en"` | A-24 | Verified on 138 Malay pages; one remaining match is a link whose text is its own web address |

Of the audit's five other findings, four are verified: reflow at large text (A-16), sticky bars at large text
(A-11), announced board changes (B-19) and the concierge field in view after an answer (B-20). The fifth, reading
level (D-14, section 7), is not verified; it is not an AA criterion.

### 4.3 What remains

**Fixed and verified in round four** (the inclusion re-review's points; [`verification.md`](verification.md), F4):

- **Assistance state.** The timeline no longer announces "Done:" on steps nothing confirmed: 0 "Done:" and 4 "Past:"
  on a delayed flight. Inside Malaysia Airlines' 48-hour notice period it says "Act now" and whom to contact; for
  airlines whose notice period is not published (AirAsia, for example) it says so rather than inventing one.
- **Magnification and large text.** At 320 x 256 (400% zoom) sticky offsets follow the header (0 px once it slides
  away) and the concierge form is no longer sticky; facility chips at 320 px with 125% text: 0 clipped (was 7,
  "Estimatec"), so the A-16 re-check this report asked for is answered; Malay mid-word breaks at 360 px: 0 on the
  pages round four checked (the third review found 16 on four other pages; below).
- **Accessibility statement.** English and Malay: "Last reviewed 21 November 2026", the current focus behaviour,
  200% and 400% zoom in the test scope, WebKit and screen readers listed as not tested, and the official general
  contact channels. The third review found two of its focus sentences untrue on the round-five build (below).

**Fixed and verified in round five** ([`verification.md`](verification.md), G2.2 and G4):

- The Malay transport fare at 125% text is now on the first phone screen (717 px; round four 881).
- The "LGK" label on the `/en/airports` map: 0 of 5 labels outside the drawing from 320 to 1920 px and at 200% zoom.
- The states round five added (the night board, the flight page before and after the feed answers, the catch-all
  404s, the reworked parking and transport pages, the header tooltip) scanned in light and dark at 390 and 1440 px:
  0 axe violations in 68 scans.

**Still open:**

- **Focus hidden by the concierge's question box** [third review, chair]. Round four made the box static only in
  windows under 40 rem high. At 1280 x 720 the focused suggestion runs from 649 to 720 px and the sticky box starts
  at 651 px; the inclusion lens found the same at 1440 x 900, with axe `target-size` on `/ms/concierge` on 3 of 3
  loads. This is at best a marginal pass of 2.4.11 (AA) and fails 2.4.12 (AAA). Team; a pilot condition.
- **Focus after in-page links and palette selections** [third review]. "My needs", the accessibility hub's contents
  and palette selections scroll to the target, but focus stays on the page body (or the Search button); the next Tab
  enters the section. A-05 residual. Team.
- **The accessibility statement** (English and Malay, "Last reviewed 21 November 2026") says that the sticky bars
  "do not hide the item that has focus" when the page is magnified and that "a link to a section moves focus to that
  section". Neither is true on this build (the concierge's box hides the focused suggestion at 125% zoom of a 1440 x
  900 window; at the 200% and 400% zoom its test section names, nothing focused was hidden [fact-check]), and the
  review date predates round five. Team: fix the two defects above, then re-date the statement;
  a pilot condition.
- **No assistive technology with people.** No physical screen reader (NVDA, JAWS, VoiceOver, TalkBack) or speech
  input has been used; announcements are inferred from the accessibility tree and live-region recordings. There has
  been no WebKit or iOS Safari run, and no test with disabled participants. Team, with MAHB recruiting (OOS-15); the
  plan is [`usability-study-plan.md`](usability-study-plan.md).
- **No accessibility contact.** MAHB publishes neither an accessibility contact nor a response time, so the statement
  says so. MAHB.
- **Layout residuals** [third review]: Malay words broken mid-word at 360 px and 125% text on four pages (16 words,
  most visibly "Antarab / angsa" on the transit control); "My needs" at 1,870 to 2,142 px at 125% text, outside two
  phone screens; the header and bottom bar break when device font scaling doubles the root text (not a WCAG failure;
  the product's own setting stops at 125%). Team (low to medium).
- **Missing facts for assisted travellers.** Accessible toilets, lifts, step-free status per transport mode,
  accessible bays, the airport's own assistance service and most airlines' assistance rules are missing (D-04,
  OOS-07); only Malaysia Airlines' 48-hour rule is sourced. The product says "not published", honestly; the map's
  lifts are demonstration points, and search lists them first for "lift" with no illustrative marker [chair]. MAHB,
  airlines (facts); Team (the marker).

---

## 5. Performance

Sources: [`performance.md`](performance.md) (baseline, raw data in [`lighthouse/`](lighthouse/)); verification
rounds one to five (raw data in [`lighthouse-after/`](lighthouse-after/), [`lighthouse-round2/`](lighthouse-round2/),
[`lighthouse-round3/`](lighthouse-round3/), [`lighthouse-round4/`](lighthouse-round4/),
[`lighthouse-round5/`](lighthouse-round5/)); the fix logs.

### 5.1 Method and caveats

- **Settings.** Lighthouse 13.6 mobile (Moto G Power emulation, simulated slow 4G: 150 ms RTT, 1.6 Mbps, 4x CPU),
  3 runs per page, median reported. Interaction latency was measured with the Event Timing API in Playwright
  (Pixel 7, 4x CPU throttling).
- **Server.** `next start` on localhost: no TLS, no CDN, gzip only (brotli would cut JavaScript by about 13%). The
  site has no images, analytics or third parties; a production site that adds any of these will be slower.
- **TBT varies between sessions in the lab container.** The same build moved by ±60 to 100 ms of TBT from one
  session to another. Lighthouse's CPU benchmark index ranged from 2,234 to 2,861 within round three and from 1,499
  to 2,715 within round four and from 1,276 to 2,913 within round five, and the baseline ran while other evaluators
  shared the machine (index 1,318 to 2,511).
  Single runs should not be quoted.
  Differences of a few points in the performance score between rounds are within this spread. The large changes
  (for example `/en` TBT 1,391 → 257 ms) are not.
- **Pages not re-measured.** Four baseline pages have not been re-measured by Lighthouse since the fixes: shop and
  dine (67), transit (68), corporate (92) and the airport directory (81). Round three removed the cause of the late
  LCP from every static page (below). The flight page (baseline 64, LCP 4.4 s; round four 68 to 75 and 4.2 to 4.9 s
  in the CI budget step) and the empty night board were measured in round five with the harness of the table below
  (section 5.2, after the table).
- **Two sets in round five.** Set 1 is the build as delivered (02:48 to 02:55 Kuala Lumpur time); set 2 is the final
  build (05:14 to 05:21), on every page within 2 points or 20 ms of a target. The two builds differ only in the
  failure paths fixed by verification (first-load JavaScript +0.1 to 0.2 KB). The board's window held departures in
  both sets.

### 5.2 Lighthouse mobile by round (median of 3 runs)

| Page | Performance: before → R1 → R2 → R3 → R4 → R5 (set 1 / set 2) | LCP (s) | TBT (ms) |
|---|---|---|---|
| `/en` | 56 → 90 → 97 → 95 → 94 → **95 / 95** | 4.8 → 1.2 → 1.08 → 1.11 → 1.11 → **1.09** | 1,391 → 421 → 204 → 257 → 295 → **257 / 272** |
| `/ms` | 65 → 91 → 96 → 95 → 95 → **94 / 91** | 1.3 → 1.2 → 1.09 → 1.10 → 1.08 → **1.12** | 1,978 → 385 → 227 → 245 → 268 → **293 / 377** |
| `/en/kul` | 78 → 80 → 96 → 92 → 94 → **94 / 93** | 1.1 → 4.4 → 1.07 → 1.08 → 1.09 → **1.11** | 992 → 272 → 233 → 353 → 281 → **301 / 323** |
| `/en/kul/flights` (board) | 81 → 91 → 95 → 93 → 95 → **96 / 96** | 1.1 → 1.1 → 0.92 → 0.92 → 0.91 → **0.92** | 790 → 360 → 257 → 304 → 263 → **212 / 242** |
| `/en/kul/map` | 68 → 74 → 97 → 97 → 97 → **96 / 94** | 4.4 → 4.6 → 1.07 → 1.07 → 1.08 → **1.07** | 679 → 393 → 201 → 207 → 205 → **257 / 288** |
| `/en/kul/transport` | 89 → 93 → 81 → 93 → 96 → **95 / 97** | 1.3 → 1.2 → 4.27 → 1.10 → 1.07 → **1.07** | 429 → 324 → 291 → 301 → 219 → **268 / 183** |
| `/en/kul/parking` | 83 → n/m → 79\* → 95 → 97 → **96 / 95** | 1.2 → n/m → 4.13\* → 1.11 → 1.12 → **1.11** | 677 → n/m → 355\* → 255 → 188 → **221 / 273** |
| `/en/guides` | 91 → 94 → 97 → 99 → 98 → **98** | 1.1 → 1.1 → 1.07 → 1.06 → 1.07 → **0.91** | 391 → 293 → 192 → 103 → 175 → **162** |
| `/en/concierge` | 91 → 93 → 95 → 97 → 93 → **97 / 98** | 1.1 → 1.1 → 0.92 → 0.92 → 0.92 → **0.92** | 612 → 311 → 268 → 186 → 311 → **209 / 169** |
| `/en/journey` | 64 → 96 → 98 → 98 → 98 → **99** | 4.5 → 1.1 → 0.92 → 0.92 → 0.92 → **0.91** | 845 → 233 → 171 → 179 → 179 → **126** |
| **Pages meeting the target** | 95+: 0/15 → 1/9 → 8/9 → 7/10 → 7/10 → **8/10 / 7/10** | 2.5 s: 9/15 → 7/9 → 8/9 → 10/10 → 10/10 → **10/10** | 200 ms: 0/15 → 0/9 → 2/9 → 3/10 → 3/10 → **2/10 / 4/10** |

n/m: not measured. \*Parking was not in round two's set; these are the round-two build as measured at the start of
round three. R4 is the build as delivered by round four; the final build differs only in two concierge sentences
and ten Malay strings. R5 gives set 1 / set 2 (section 5.1); the guides hub and My journey were measured in set 1
only, and verification reports one LCP per page. CLS: 14 of 15 pages at 0.1 or less before (`/ms` 0.161), then 9 of 9,
9 of 9, 10 of 10, 10 of 10 and 10 of 10 (largest median 0.003). Accessibility was 100 on every page in every round.
SEO is 66 by design: the prototype sends `noindex`.

Round four's second set suggested that the concierge's TBT rise of roughly 80 to 100 ms was real
([`verification.md`](verification.md), F2.4). Pooled over the six runs of round five's two sets, TBT medians are
`/en` 260 ms (round four's pooled six 264), `/ms` 300, `/en/kul` 308 (295), the concierge **183** (287), the board
227, the map 259, transport 250 and parking 241 ms. Across sessions only the concierge (about −100 ms) and My journey
(−53 ms, three runs) move beyond the container's 60 to 100 ms spread. The speed log's interleaved comparison, the
better test of direction, found −58 to −68 ms on `/en`, `/ms` and `/en/kul`; verification could not repeat it,
because the baseline build no longer exists (G2.4).

Pages measured with this harness for the first time in round five (median of 3; set 1, then set 2):

| Page | Round four | R5 performance | LCP | TBT (ms) | CLS |
|---|---|---|---|---|---|
| Flight page (`/en/kul/flights/ak6336-20261122-d`) | 68 to 75, LCP 4.2 to 4.9 s (CI budget step) | **94 / 96** | **1.22 s** | 301 / 218 | 0.003 |
| Empty night board, English (browser clock 23:30) | 76 to 78, LCP 4.7 s (CI budget step, 23:17) | **96 / 95** | **0.92 s** | 235 / 272 | 0.012 / 0.003 |
| Empty night board, Malay | not measured | **96 / 96** | 0.91 s | 246 / 225 | 0.005 |

What moved the numbers, by round:

- **Round one.** Demonstration boards are generated on the server and cached, so typing no longer rebuilds them.
  The root loading fallback was removed. The
  display font is preloaded and the italic dropped. Prefetching was cut from 8 to 24 requests to 2 to 5 per load.
- **Round two.** URL state now hydrates (no page-level Suspense on the overview, board and map). zod left every
  client chunk. Dialogs load on first open.
- **Round three.** The `h1` is no longer revealed late by React's `$RC` script on any of the 276 sitemap pages (it
  was on 116). The demonstration flight generator is out of every route's first load.
- **Round four** was not a performance round. Transport (93 → 96) and parking (95 → 97) improved, transport with
  fewer source toggles and 2 fewer requests. The concierge fell (97 → 93, TBT 186 → 311 ms): its first-load
  JavaScript grew 1.0 KB, and its longest tasks are React DOM's chunk (201 ms) and the HTML document (139 ms).
- **Round five.** The icons became one sprite (lucide-react in 0 client chunks), the header tooltip dropped Radix,
  the platform runtime loads as its own script, and the concierge's copy left the root dictionary (HTML 6.5 to 11.1 KB
  smaller per page, the concierge page itself 1.6 KB). The shared shell's first-load JavaScript fell from 70.1 to
  33.0 KB. The concierge's round-four fall is recovered (93 → 97 and 98; 705 → 558 KB). The flight page puts its
  `h1` in the server HTML before the first hidden segment (LCP 4.2 to 4.9 → 1.22 s), and the night board sends a
  "Loading the board" block that its empty state fills (LCP 4.7 → 0.92 s).

Two things moved the wrong way in round one: `/en/kul` LCP went from 1.1 to 4.4 s (the map stayed at 4.4 to 4.6 s),
and first-load JavaScript grew. Both were recovered in round two. In round two transport went to LCP 4.27 s, which
round three recovered. In round four the concierge moved the wrong way (above); round five recovered it. In round
five the map, transport and parking read 30 to 50 ms of TBT above round four's three runs, and `/ms` scored 94 and 91
(one run 86, TBT 541 ms); verification places all of these within the container's spread, not attributed to a
change. The platform runtime's new lazy script regressed every page on a failed fetch; verification fixed it
(section 10.7).

### 5.3 Budgets

From the product strategy, section 7, and [`lighthouserc.json`](../../lighthouserc.json).

| Budget | Target | Before | R1 | R2 | R3 | R4 | R5 | Status |
|---|---|---|---|---|---|---|---|---|
| Home first-load JavaScript (gzip, build manifests) | 250 KB | 263.0 | 274.8 | 232.6 | 228.7 | 229.5 | **195.7** | Met |
| Routes over 250 KB of first-load JavaScript | none | every route (250 to 275) | most (largest: flight page 294.7) | 2 (252.0, 256.7) | 0 (largest 246.7) | 0 (largest: flight page 249.1) | **0** (largest: My journey 212.2; flight page 198.3) | Met |
| Content and guidance pages, first-load JavaScript | 170 KB | 250 to 275 (all routes) | 257 to 282 | 209 to 236 | 198.6 to 227.4 | 198.8 to 227.9 | **18 of 39 routes at 170 or less** (guides 165.5 to 167.5, corporate news 166.0); 21 over, 170.3 to 212.2 | Not met (21 of 39 over) |
| Home fonts | 150 KB | 206 | 122 | 122 | 122 | n/m | n/m | Met (R3) |
| Home transfer | 1,000 KB | 701 to 703 | 607 to 609 | 576 to 578 | 607 to 609 | 628 to 630 | **624 to 625** | Met |
| Guidance-page transfer | 500 KB | 582 to 720 | 571 to 622 | 548 to 597 | 543 to 607 | 548 to 609 | **539 to 605** | Not met |
| Requests per page | 40 | 11 of 15 over | 8 of 9 within | 5 of 9 within | 2 of 10 within | 3 of 10 within | **5 of 10 within** (map 40, transport 39; parking 43) | Not met |
| HTML per content page (gzip) | 40 KB | home 79 (half of it the interface dictionary) | 50 to 75 | 44 to 62; flight page 93.7 | 41 to 62; flight page 93.8 | 38.5 to 63.7; flight page 96.7 | **32.0 to 57.0; flight page 85.6** (8 of 22 pages at 40 or less) | Not met |
| Service worker, first visit | 60 requests, 600 KB, `/en` fetched once, cache 1 MB | 138, 1.07 MB, 3 times, 2.5 MB | 61, 710 KB, twice, 1.8 MB | 60, 652 KB, twice, 1.58 MB | 62, 685 KB, twice, 1.57 MB | 62, 691 KB, twice, 1.59 MB | **61, 643 KB, twice, 1.38 MB** | Not met |

The CI Lighthouse step (7 URLs, 3 runs each) was run locally in rounds four and five. In round four its
configuration was wrong, and after the fix it failed 14 assertions. In round five (21 runs, 04:23 to 04:26, with
rows on the board) it fails **10 assertions**: script bytes on `/en` and `/ms` (354,754 bytes transferred against
256,000; Lighthouse counts every script fetched in the load window, not first-load JavaScript) with TBT 232 and 213
ms; the baggage guide's total bytes (558 KB against 512); parking's performance (92), TBT (338 ms) and bytes (617
KB); and the flight page's performance (94) and TBT (286 ms). No longer failing: the board (95 to 97, LCP 0.92 to
0.94 s), parking's request count (40) and the flight page's LCP (1.22 s; was 4.7). My journey passes every
assertion ([`verification.md`](verification.md), F7 and G7; summary in
[`lighthouse-round5/ci-budgets/`](lighthouse-round5/ci-budgets/)).

### 5.4 Malaysian network profiles (3 runs each, median)

| Profile | Page | Before: performance, LCP, TBT | R3: performance, LCP, TBT (not re-measured in R4) | R5: performance, LCP, TBT |
|---|---|---|---|---|
| Malaysian median mobile (154 / 35 Mbps, 40 ms RTT, 4x CPU, applied) | `/en` | 74, 1.2 s, 1,539 ms | Not re-measured | Not re-measured |
| | board | 77, 1.2 s, 1,091 ms | Not re-measured | Not re-measured |
| Congested airport Wi-Fi (1.5 / 0.5 Mbps, 250 ms RTT, 4x CPU, applied) | `/en` | 63, 2.9 s, 1,956 ms | 79, **2.57 s**, 558 ms (R2: 82, 2.55 s) | 85, **2.57 s**, 357 ms |
| | board | 69, 2.8 s, 1,264 ms | 79, **2.68 s**, 469 ms (R2: 82, 2.69 s) | 86, **2.65 s** (TBT not reported) |

The Malaysian median profile is drawn from Ookla medians. The baseline showed that the network is not the
bottleneck there: LCP was 1.2 s on both pages. The Wi-Fi profile is the evaluator's own model of a crowded gate
area and leaves out packet loss and captive portals, so real congested Wi-Fi is likely worse. On that profile the
first paint is itself the LCP (round five: 2.57 s and 2.65 s; three runs each within 0.03 s). Round five raised the
performance score on this profile (79 → 85 and 86) but not LCP: about 1.2 s of it is 23 KB of render-blocking CSS,
and two preloaded fonts also come before first paint. Round four changed nothing before first paint but 1 to 3 KB
of HTML, so it was not re-measured then.

### 5.5 Interaction latency (worst interaction per run, Pixel 7, 4x CPU)

| Interaction | Before | R1 | R2 | R3 | R4 | R5 (2 sets of 3 runs) |
|---|---|---|---|---|---|---|
| Board: typing a flight number | 784 ms (worst on page) | 56 to 64 | 40 to 80 | 48 to 88 | 48 to 104 | **32 to 88** |
| Board: Departures and Arrivals | (as above) | 320 to 440 | 88 to 144 | 112 to 160 | 72 to 96 | **80 to 128** |
| Home: journey mode | 408 ms (worst on page) | 120 to 136 | 104 to 152 | 104 to 120 | 104 to 144 | **104 to 232** (1 of 6 runs at 232) |
| Home: airport switcher | (as above) | 280 to 328 | 136 to 160 | 120 to 168 | 136 to 160 | **136 to 184** |
| `/en/kul`: airport switcher | 248 ms (worst on page) | 288 to 320 | 128 to 192 | 104 to 224 (2 of 9 runs at 224) | 128 to 176 | **136 to 224** (1 of 6 runs at 224) |
| Input before hydration (scripts delayed 2.5 s) | not measured; on `/en`, interactions during hydration took up to 1,472 ms | typing lost in 5 of 6 loads | 0 of 6 lost | 0 of 6 lost | 0 of 10 lost in each of four cases | **0 of 10 lost** in each of four cases |

In round five 2 of 30 worst-interaction runs exceeded 200 ms, both in the first set (round four 0 of 15). Verification
did not attribute them to a change.

### 5.6 Remaining causes [measured attribution; remedies are judgement]

- **TBT.** In round five's second set the longest tasks are React DOM's and the framework's chunk (215 to 233 ms at
  4x CPU) and parsing the HTML document (156 to 232 ms). The framework is 128.7 KB of every route's first load; the
  icon registry is gone (one sprite since round five), and the shell is 33.0 KB. The speed log's next candidates:
  fewer Client Components on the home's first screen and the overview, `flightPages` (15 KB) scoped out of the root
  dictionary, the fonts (127 KB), and tailwind-merge (8.5 KB) out of the shell. Otherwise the TBT target should be
  revisited with the design owner. Team.
- **Congested Wi-Fi LCP.** The first paint is the LCP, behind 23 KB of render-blocking CSS and two preloaded fonts.
  Team.
- **Bytes and requests.** On a guide, the phone bar's prefetched Journey and Flights routes (A-19, about 85 KB) and
  the overlays loaded at idle (about 45 KB) take the page from about 405 KB to 536 KB; loading them only on intent
  would meet the budget at the cost of a slower first tap, a product decision not yet taken. In round four the home's
  flight-feed answer covered whole days for six airports where the preview needs about 8 rows (not re-checked). The
  service worker still fetches `/en` twice and stores more than the budget allows. Team.
- **Reliability of lazy parts** [verification; third review, chair]. `React.lazy` keeps a rejected import, so a
  script that fails to download stays failed. Verification fixed this for the platform runtime and the flight page
  with an import that retries when the browser is back online (`retryingImport`). The home's saved-flight card and
  My journey's clear control still use a plain lazy import: with a saved flight, one failed fetch replaces the whole
  main area, and "Try again" re-renders the cached rejection rather than fetching again. Team; a pilot condition.
- **For comparison** [measured, but in different conditions]. The benchmark sites were measured over the internet
  with third parties blocked; the prototype on localhost. Before the fixes the prototype's home was already 47 times
  lighter than MAHB's (0.70 MB against 32.7 MB) and scored 56 against MAHB's 9. Its main-thread work was then the
  weak point, and still is.

---

## 6. Usability

Sources: [`usability.md`](usability.md) (18 November); [`panel/re-review.md`](panel/re-review.md) (21 November);
[`panel/review-3.md`](panel/review-3.md) (22 November); [`verification.md`](verification.md), F4 and G4 (rounds
four and five); [`usability-study-plan.md`](usability-study-plan.md).

### 6.1 Method and its limits

- **What was done.** One UX research lead ran a heuristic review and scripted walkthroughs of each of the nine
  personas' two top tasks, on a phone and a desktop viewport: 18 tasks, 36 runs, in Chromium. This counts steps and
  finds problems.
- **What it cannot show.** It cannot show how often real passengers succeed, how long they take or how they feel.
- **Limits:**
  - The evaluator had read the code.
  - Pages responded almost instantly on localhost.
  - No assistive technology was used.
  - The feed-failure state could not be triggered at the time.
  - Malay was checked by string matching and one task run in Malay.
- The counts are a floor on friction, not a prediction of success rates.

### 6.2 Results

**Before** [measured, simulated]: 28 of 36 runs succeeded (78%), 4 were partial and 4 failed. 26 of 36 succeeded
without a wrong turn (72%). The strategy's interaction target was met on 9 of 18 tasks on a phone and 10 of 18 on
desktop. The prototype beat MAHB today outright on flight lookup (one interaction, any airport, any terminal),
assistance, the Calm Room, liquids and baby food, and the saved flight.

The walkthrough set was **not re-run as a whole after the fixes**, so there is no "after" rate. What has changed on
the tasks that fell short:

| Task (before) | Result before | Fix and status after | What still limits it |
|---|---|---|---|
| P2-T2: what to submit before landing | Success after a wrong turn: "arrival card" in the home search gave "0 flights found" | A-03 verified: the home search falls through to site results | None found |
| P3-T1: nearest nursing room, KLIA T1 | Partial | C-07 verified: an honest placeholder, reached in two interactions | No location published (MAHB) |
| P4-T2: is the Aerotrain running now? | Partial: planned closure only | B-01 verified: status lines on the overview, home and flight page. Round four: "Status not available" where no notice exists, and the notices' own date instead of "Checked hh:mm" (6.1.1 verified) | No live operations feed; notices are held in code (MAHB, OOS-02) |
| P8-T2: Subang parking daily cap | Failed: the tile silently opened the overview | A-07 verified: the tile says "not published" and leads to an honest state | No Subang parking data (MAHB, OOS-06) |
| P9-T2: Terminal 1 car park, 2 to 3 hours | Failed: rates not verified | C-01 verified: price-first layout, flight dates carried into the estimate. Round four: the page, the concierge and the help FAQ give the same sentence per car park (6.1.3 verified). Round five: calmer cards (4 provenance tags, 3 source toggles, 0 Demo tags on cards), with the same rate lines | No KLIA rate is verified; the Terminal 1 figure is klia.info's RM 52 a day (MAHB, OOS-03). The concierge's long-stay card states RM 32 without its qualifier [third review] (Team) |
| Answers below the first phone screen (P5-T1, P7-T1 and others) | Arrive-by time 8 scrolls down at 125% text; transfer verdict at 4,279 px | A-01, B-03 and C-03 verified: flight next step at 277 px, board row at 614 to 640 px, parking table at 340 px. Round four: transport fare at 433 px (Malay 495), transit verdict at 454 px (6.1.6 verified). Round five: the Malay fare at 125% text at 717 px, on the first screen (6.1.6 verified) | Overview flight search at 2,236 px on a phone [chair]; "My needs" at 1,870 to 2,142 px at 125% text [third review]; about two board rows above a 900 px desktop fold [chair] (Team) |

[judgement] Two of the four non-successes would still fail with real users today, because the facts are missing.
They are now failures the product admits honestly rather than dead ends. The brief's 95% and 90% targets cannot be
claimed from any evidence that exists.

**New since the walkthrough** [third review, chair]. The saved flight, one of the tasks on which the prototype beat
MAHB outright, now carries a resilience defect: with a flight saved, one failed script download replaces the home's
and My journey's main area with "Something went wrong", and "Try again" does not recover (section 1). The third
review's task-by-task view (expert judgement, not a study) is that the day-of-travel tasks can be completed with
little friction, every purchase still ends in a hand-off, and the tasks an assisted traveller depends on still fail
for lack of data ([`panel/review-3.md`](panel/review-3.md), Q4).

### 6.3 The study MAHB must run

The study design is in [`usability.md`](usability.md), section 7. A plan MAHB can run, with participant quotas, tasks
and success criteria, consent under the PDPA, a schedule and the route from findings to the backlog, is
[`usability-study-plan.md`](usability-study-plan.md) (re-review 6.1.13; OOS-15: the team runs it; MAHB funds,
recruits and signs it off). In outline:

- **Pilot** (week 1): 5 sessions.
- **Formative round** (weeks 2 to 3): moderated think-aloud with 44 participants (32 across the persona groups and
  12 NVDA, VoiceOver, TalkBack and magnifier users), in Malay and English. **This can start on the round-five
  build**; the third review agrees, and advises fixing the saved-flight failure and the concierge focus defect
  first so that sessions do not run into known defects.
- **Summative benchmark** (weeks 5 to 6): timed, on the launch candidate, with the **official flight feed on
  staging**, about 64 phone participants per core task. A matched baseline group runs the same tasks on the current
  MAHB site.
- **Measures:**
  - task success and unaided success, with adjusted-Wald intervals;
  - time on task;
  - the Single Ease Question and SUS;
  - comprehension of "Official", "Estimated", "Not published" and "Demonstration data", and of round four's
    wording ("Status not available", "Past:", "Rates not verified");
  - trust ratings.
- **Decision rules:**
  - The 90% unaided target passes for a task only with at least 62 successes in 64.
  - The pooled 95% target needs at least 497 of 512 attempts.
  - Any core task below target goes back for a fix and a retest; it is not averaged away.
- **Duration:** about 8 weeks, after about 2 weeks of approvals and set-up.

---

## 7. Content integrity and provenance

Sources: [`content-integrity.md`](content-integrity.md) (18 November); verification; the inclusion and business
re-reviews; the third review ([`panel/review-3.md`](panel/review-3.md), sections 1.4 and 7).

The product's promise is threefold: no invented facts, demonstration data always labelled, and the kind of guidance
always labelled. The labels used are Official, Estimated, Suggestion, Not published and Demonstration data.

**Before** [measured]. The audit made 496 renders (248 pages at two widths). It extracted 6,835 values (544 unique)
across money, phone numbers, times, dates, counts, places, routes and airlines, and traced each one to
`src/content`. It found **no fabricated values**, and its 13 findings were all labelling or wording (4 high):

- Most flight rows on long boards and phone layouts, and the gate, belt and counter values on the flight page, were
  on screen with no demo label in view (3 high).
- 9 records carried "Official" while resting only on news reports or blogs, among them the KLIA Ekspres fare, the
  Aerotrain closure and the Mavcom refund rule (high).
- Malay pages showed English airport and place names and team-written English.
- Notices went stale on the wrong date.
- Dates were missing or in free text.

**After.** All 13 content-integrity findings map to backlog items, and all of those items are verified. Reading
level, raised by the accessibility audit, is shown in the same table because it is a content matter; it is not
verified:

| Area | Items | Status and evidence |
|---|---|---|
| Source policy | D-01 | Verified. A content test rejects "Official" without an authoritative source; social posts never back Official. Verification round one found the concierge tagging outlet facts "Official" from a magazine; it was fixed and is now tested |
| Demo labels in view | A-04, B-05 | Verified. A demo marker is in view on every phone preview row and every board row; flight values are labelled |
| Malay | D-03, D-09, A-24 | Verified on 138 Malay pages: none of the audited English strings, and airport names and `h1` in Malay. Verification round two found the overview board still naming the airport in English and fixed it. Native review is OOS-14 (MAHB) |
| Time-sensitive content | D-08, D-10, D-12, D-13 | Verified. Clock tests at the fare and notice boundaries; ISO dates; records older than 12 months flagged; the arrival rule read from sourced content |
| Reading level | D-14 | Not verified. Immigration and customs guide at grade 9.5 and reading ease 50.5 (targets 9 and 55), with 6 sentences over 25 words |

**Found by the panel, fixed in round four** [measured; [`verification.md`](verification.md), F4]. Neither was a
regression of a fixed item.

- The status lines said "Checked hh:mm" with the current clock time and "No disruption reported" when their only
  source was dated notices held in code. Now: 0 "Checked hh:mm" and 0 "No disruption" on the KLIA overview, flight
  page and transit page in English and Malay; lines without a notice say "Status not available", and the lead gives
  the notices' date ("From notices published up to 7 Oct 2026. No live operations feed is connected yet."). The
  concierge's status sentence was brought into line by verification itself.
- The concierge said the parking rates were "not yet verified" while the parking page showed the Long Term Car
  Park's daily maximum without that mark. Now the page, the concierge and the help FAQ give one sentence per car park
  ("Rates not verified: our sources give a daily maximum of RM 32; …"), and a content test ("one fact, one answer")
  fails when they disagree.

**Round five** [measured; [`verification.md`](verification.md), G4]. The search index no longer shows "[object
Object]" in the Malaysia Airlines and Cathay Pacific summaries (0 of 223 documents per language). The parking cards
name the simulated space "Simulated space" / "Ruang simulasi" in words, with one Demo marker and the banner for the
list. The concierge's flight answers now come from the server feed, labelled as demonstration data, and say "could
not be loaded" rather than "not found" when the feed fails. The re-checks of 6.1.1 (status lines) and 6.1.3 (one fact,
one answer) still pass.

**Found by the third review, not yet fixed** [chair where marked; team unless stated]:

- The 2027 KLIA Ekspres fare change ("RM65 from 1 January 2027") is badged "In effect now" on the KLIA overview
  [chair], and a notice carries an "Estimated" chip.
- The map's demonstration lifts are named like real ones and lead the "lift" search with no illustrative marker
  [chair].
- The concierge's long-stay card states RM 32 without the "not verified" qualifier.
- A directory-only airport says "There are no notices for this airport right now", which reads as a statement about
  operations rather than about the sources.
- Malay residuals: "Penang" in a flight `h1` but "Pulau Pinang" on the board; "penerbangan simpanan" read as
  "reserve flights". Native review remains OOS-14 (MAHB).

None of these is a fabricated value; each is a label or wording that can mislead.

**What content cannot fix without MAHB** (OOS-03, OOS-05, OOS-06, OOS-08, OOS-14):

- Only KLIA (17 URLs), Penang and Kota Kinabalu (6 each) go beyond an overview and a board. Kuching and Langkawi,
  both international airports, answer 404 for transport and parking.
- The terminal car-park rates are unverified, and there are 8 outlets.
- The arrival steps cite third-party guides for MAHB's own building.
- The Malay is a draft until a native editor signs it off.

**Prototype-only.** These are expected to go away with production data:

- the demonstration flights, gates, belts, check-in rows, queues and alerts;
- the illustrative map positions and "Demo" lifts (their missing marker in search is a product defect, above);
- the "Not published" placeholders;
- the "Concept prototype, not official" banner.

---

## 8. Security and privacy

Sources: [`security.md`](security.md) (18 November); verification;
[`../engineering/security.md`](../engineering/security.md).

**Before** [measured]. The review found 17 issues: 2 high, 6 medium and 9 low. Its verdict was "not ready for
production as it stands". The front end was already well hardened:

- a strict CSP with no third parties, and the full header set;
- no XSS in 48 probes;
- framing refused and no open redirect;
- nothing personal in the service-worker caches;
- no committed secrets.

The weaknesses were in the small server surface.

**After.** 14 of 17 are fixed and verified, on the production build [measured] except security-13, which is checked
in code only:

| Finding | Backlog | Evidence after |
|---|---|---|
| security-01 (high): body buffered before the 4 KB check (200 MB request: +565 MB memory) | E-04 | Declared 5,000 bytes → 413; a 50 MB chunked stream → 413, server memory unchanged |
| security-02 (high): rate limit keyed on a client-supplied `X-Forwarded-For` | E-05 | Behind a trusted address, rotating forged values → 200 x 10, then 429 |
| security-03: any site could make visitors post to the concierge | E-07 | `text/plain` and look-alike JSON → 415; cross-site and other origins → 403 |
| security-04: AI wording guard let addresses and injected tags through; no spend cap | E-10 | `max_tokens` 240, question redacted and escaped, spend caps and breaker; red-team unit tests. The AI path stays off without a key |
| security-05, -06: flight pages for any id; no rate limits outside the concierge | B-14, E-08 | Codeshares 308; malformed ids 404 in 1.3 KB; 429 from request 61 per client on `/api/flights` and flight pages |
| security-09, -11, -12, -15, -16, -17 | E-18, E-21, E-22, E-19, E-13, E-23 | Tampered links dropped; health check returns status and build only; 404s cached 60 s; API hygiene; documentation matches code; `server-only` guard |
| security-10: dev-dependency advisories | E-20 | `npm audit` 0 and 0 |
| security-13: `lang` cookie without `Secure` | A-31 | In code on https; not observable over local http |

**Still open:**

- **Inline script allowed.** The enforced CSP still allows `'unsafe-inline'` scripts, and `Permissions-Policy` sets
  `payment=()`, which the third review's chair confirmed on the round-five build and which would block a partner
  checkout (E-09; Team, as a platform decision). A report-only policy with 4 script hashes and Trusted Types is in
  place. Next.js 16.4 cannot hash its per-page framework scripts, and nonces need per-request rendering. A future
  checkout would also need a per-route payment policy.
- **Automated security checks have not run in CI.** The `npm audit` gate passed when the CI jobs were run locally in
  rounds four and five; CodeQL and gitleaks could not run in the container (a GitHub-hosted action; no Docker, and the
  history scan was outside those rounds' briefs). A pattern scan of the working tree for keys found nothing (E-06;
  Team).
- **No disclosure route.** `security.txt` waits for a real contact (OOS-12; MAHB).

**Found and fixed during verification** (round two). Every page answered with a second `Link` header that repeated
the canonical set 6 to 8 more times and grew by one copy each time the page was regenerated. On flight pages it named
**other visitors' flight pages** as canonical, which disclosed which flights others had looked at. The fix is one
configuration setting. Afterwards there is exactly one canonical per response on all 276 sitemap URLs and on
repeated flight pages, and an end-to-end test guards it.

**Deployment dependencies** (MAHB, OOS-11):

- Rate limiting works per visitor only if the host declares the client-address header (`TRUSTED_CLIENT_IP_HEADER`
  or `TRUSTED_PROXY_HOPS`). Without it, the server warns at start-up and falls back to per-address buckets under a
  site-wide ceiling of about 600 requests.
- The edge and WAF rules are written as configuration in `docs/engineering/edge/` and are not deployed.

**Privacy.**

- Saved flights, places and preferences stay on the device and can be cleared.
- No concierge questions are logged.
- Measurement is aggregate, with a privacy section and an off switch; since round four the counts are kept in a
  durable aggregate store (E-17, partial).
- The security review advises launching the concierge in deterministic mode, with no model provider.

The review lists regulatory points to confirm with MAHB's counsel; they are not legal advice. Under the PDPA 2010
as amended in 2024, these include breach notification, a data protection officer and cross-border transfer rules if
a model provider is used. A privacy impact assessment is advised before the AI path is enabled. Under the Cyber
Security Act 2024, the live flight-data integration path could matter if MAHB systems are designated national
critical information infrastructure.

**Not tested:**

- TLS and HSTS in effect;
- a CDN or WAF in front of the site;
- the real model's resistance to prompt injection;
- a penetration test of a staging deployment.

---

## 9. Review panel

Sources: [`panel/panel-summary.md`](panel/panel-summary.md) (round one, 18 November);
[`panel/re-review.md`](panel/re-review.md) with [`re-review-business.md`](panel/re-review-business.md),
[`re-review-design.md`](panel/re-review-design.md) and [`re-review-inclusion.md`](panel/re-review-inclusion.md)
(second review, 21 November); [`panel/review-3.md`](panel/review-3.md) and [`review-3.json`](panel/review-3.json)
with [`review-3-business.md`](panel/review-3-business.md), [`review-3-design.md`](panel/review-3-design.md) and
[`review-3-inclusion.md`](panel/review-3-inclusion.md) (third review, 22 November, on the round-five build).
Benchmarks come from `docs/research/benchmarks/matrix.json`. The third review is the panel's third round of scoring;
it is not related to fix round three.

The scores are calibrated expert judgement on a 1 to 5 rubric, not measurements. ui, ux, flight, mobile, nav and ai
are scored as if production data were connected; info and commerce on what exists. The perf score uses lab
figures from verification; no reviewer re-measured performance in the third review. The matrix's stated uncertainty
is about 3 points.

| Dimension (weight) | Round one (panel average) | Second review (panel median) | Third review (panel median) | MAHB today | Heathrow | Best benchmark | Strategy target |
|---|---|---|---|---|---|---|---|
| ui: UI and brand (10%) | 4.00 | 4.0 | 4.0 | 2.5 | 3.5 | 4.0 | 4.5 |
| ux: task efficiency (20%) | 3.83 | 4.0 | 4.0 | 2.0 | 4.0 | 4.0 | 4.5 |
| info: completeness and accuracy (15%) | 3.00 | 3.0 | 3.0 | 2.0 | 4.0 | 4.5 | 4.5 |
| flight: live flight and journey (15%) | 4.00 | 4.0 | 4.0 | 2.5 | 4.5 | 4.5 | 5.0 |
| mobile (10%) | 3.50 | 4.0 | 4.0 | 2.0 | 4.0 | 4.0 | 4.5 |
| nav: navigation, search, accessibility (10%) | 3.83 | 4.0 | 4.0 | 2.0 | 3.5 | 4.0 | 4.5 |
| ai: personalisation and AI (10%) | 3.17 | 3.5 | **4.0** | 2.0 | 4.0 | 4.0 | 4.0 |
| commerce (5%) | 2.00 | 2.5 | 2.5 | 2.5 | 4.5 | 4.5 | 4.0 |
| perf: performance, security, reliability (5%) | 3.50 | 4.0 | 4.0 | 1.5 | 3.0 | 3.5 | 5.0 |
| **Weighted** | **70.8%** | **74.5%** | **75.5%** | **42.5%** | **79.0%** | **83.0%** (composite) | **90.5%** |

| | Round one | Second review | Third review |
|---|---|---|---|
| Reviews | Executive and commerce 72.5%; first-time traveller and accessibility 68.5%; design director and frequent traveller 71.5% | Business 74.5%; design 75.5%; inclusion 74.5% (like-for-like mean 74.8%, +4.0 points) | Business 74.0%; design 79.5%; inclusion 75.5% (like-for-like mean 76.3%, +1.5 on the second review and +5.5 on round one). No dimension differs by a point or more between reviewers |
| Verdict | "Not ready for public launch." "We would fund it to launch, not launch it as is" | Not ready for public launch, from all three lenses independently (in those words from business; through launch-blocker lists from design and inclusion). Business: "ready for a closed pilot with MAHB data" | Not ready for public launch, unanimous. Not yet ready for a closed KLIA pilot: 4 of the 7 pilot conditions met, and three team conditions added. Ready now for stakeholder demonstrations and a moderated usability study on phones in English and Malay |
| Position in the benchmark set | Level with Dubai (71.0%) and Hamad (69.0%); behind eight of ten benchmarks | Level with Incheon (74.5%); ahead of Dubai, Hamad and Munich; behind six (Heathrow 79.0, Haneda 77.5, Schiphol 77.0, Istanbul 76.5, Changi 76.5, Hong Kong 75.5). Only Heathrow's lead exceeds the matrix uncertainty | Level with Hong Kong (75.5%); ahead of Incheon, Dubai, Hamad and Munich; behind five (Heathrow 79.0, Haneda 77.5, Schiphol 77.0, Istanbul 76.5, Changi 76.5). Only Heathrow's lead exceeds the matrix uncertainty |
| Projections (judgement) | 77 to 79.5% with MAHB data and launch gates; design lens 83 to 84% if its must-fixes also land | About 79 to 80% with the team's fixes and MAHB data; design lens about 85% if MAHB's data also lands. None reaches 90.5% | About 80% from business (MAHB's launch gates, the team's reliability and CI fixes) and from inclusion (MAHB's accessibility facts, the assistive-technology study, the team items); design made none (it already scores 79.5%). None reaches 90.5% |

**What moved in the third review.** The panel median rose 1.0 point, all of it from ai (3.5 → 4.0: the concierge's
honest fallback with a named contact, access needs and the named airline honoured in both languages, flight answers
from the feed). Every other median is unchanged. The half-point spreads (ux, mobile and nav, where design gave 4.5;
ai and perf, where business gave 3.5) were checked by the chair on the running build. The chair's checks supported
4.0 on ux, mobile and nav, called 4.0 the upper edge of the evidence on ai, and confirmed the reliability defect
behind business's perf score; the medians stand ([`panel/review-3.md`](panel/review-3.md), sections 1.3 and 1.4).

Round one's ten main weaknesses, as judged in the second review:

- **Improved: nine**, two of them only in part. These are answers on the phone's first screen, commercial strength,
  the live-data path in the product (the data itself is unchanged), day-of-travel guidance, following a flight,
  access needs, search and concierge, noise (caveats improved, density unchanged), and performance.
- **Unchanged: one.** Content depth and operator-grade sourcing.
- **Worse: none.**

The second review's ten weaknesses, as judged in the third review:

- **Fixed: one.** The day-of-travel residuals.
- **Improved in part: seven.** Status freshness (the data unchanged); measurement (commerce unchanged); the
  assistance flow (the facts unchanged); concierge and search (surfaces agree, with new intent gaps); density
  (improved, not finished); answer-first (fixed on phones and at zoom, residuals elsewhere); release engineering and
  performance (improved, not met, with a resilience defect exposed).
- **Unchanged: two**, both dependent on MAHB: content depth and operator-grade sourcing, and alerts that do not
  reach a closed browser.
- **Worse: none.**

The gap to Heathrow is 3.5 points (second review 4.5): info −3.0, commerce −2.0 and flight −1.5, partly offset by
+3.0 on ui, nav and perf; ai is now level. The gap to the composite is 7.5 points (8.5). The whole remaining gap is
in info, commerce and flight, and each depends mainly on MAHB, its partners or its feeds [the panel's judgement].

**Second review's launch blockers** ([`panel/review-3.md`](panel/review-3.md), sections 4.2 and 4.3). Of the 13 team
items, 6 are met, 4 partly met (the concierge, answer-first and placement, density, the accessibility statement and
Malay copy) and 3 not met (performance and release gates, the per-route CSP and payment policy, the moderated
usability study). None of the 10 MAHB items is met; none was in the scope of rounds four or five.

## 10. Defects fixed in the five fix rounds

### 10.1 The backlog

The five QA evaluations raised 86 findings, the three panels 64, and an earlier documentation review 14: **164 in
all**. They were merged into **105 backlog items** in five work packages with disjoint file ownership
([`fix-backlog.md`](fix-backlog.md)):

- **By severity:** 6 critical, 30 high, 46 medium and 23 low.
- **By priority:** 48 P0, 53 P1 and 4 P2.
- **Out of scope:** the 4 P2 items, C-11, D-16, D-17 and E-25, need MAHB or partner data. They are listed with 11
  other MAHB dependencies as OOS-01 to OOS-15.

### 10.2 Items verified, by round, severity and priority

A verified item meets every part of its acceptance criterion on the production build, by a named test or a
measurement. Several items still listed as not verified had most of their work done; see the notes.

| Round | Critical | High | Medium | Low | P0 | P1 | Verified |
|---|---|---|---|---|---|---|---|
| Round one (packages A to E) | 3 | 22 | 29 | 19 | 33 | 40 | **73** (27 not verified, 1 regressed: E-03) |
| Round two (performance; hand-offs, density and low items) | 2 | 2 | 7 | 1 | 6 | 6 | **12** (E-03 regression cleared) |
| Round three (performance) | 0 | 0 | 0 | 0 | 0 | 0 | **0** (closed parts of B-09, E-02 and E-03; see 10.4) |
| Round four (trust, ask, layout) | 0 | 0 | 0 | 0 | 0 | 0 | **0** (A-14, D-04, E-17 and E-06 moved closer; re-review items closed; see 10.5) |
| Round five (speed, flight page, polish) | 0 | 0 | 0 | 0 | 0 | 0 | **0** (A-14, B-09, E-03, E-11, E-12 and E-14 moved closer; see 10.6) |
| **Verified in total** | **5** | **24** | **36** | **20** | **39** | **46** | **85 of 101** |
| Not verified | 1 | 5 | 9 | 1 | 9 | 7 | 16 |

### 10.3 By package

| Package | P0 and P1 items | Verified in round one | Verified in round two | Not verified | Logs |
|---|---|---|---|---|---|
| A. Shell, home, search, design system | 31 | 27 | 2 (A-01, A-21) | 2 (A-09, A-14) | [`fixes/A.md`](fixes/A.md) |
| B. Flights, journey, concierge | 21 | 17 | 3 (B-01, B-06, B-15) | 1 (B-09) | [`fixes/B.md`](fixes/B.md) |
| C. Airport sections | 10 | 7 | 2 (C-05, C-06) | 1 (C-08) | [`fixes/C.md`](fixes/C.md) |
| D. Content, copy, guides, help, corporate | 15 | 7 | 5 (D-02, D-05, D-08, D-09, D-13) | 3 (D-04, D-07, D-14) | [`fixes/D.md`](fixes/D.md) |
| E. Platform, performance, security | 24 | 15 | 0 | 9 (E-01, E-02, E-03, E-06, E-09, E-11, E-12, E-14, E-17) | [`fixes/E.md`](fixes/E.md) |
| **All** | **101** | **73** | **12** | **16** | |

Logs by round:

- **Round one.** Packages A to E in parallel, after an attempt interrupted by a usage limit
  ([`fixes/_interrupted-attempt.md`](fixes/_interrupted-attempt.md)).
- **Round two.** [`fixes/round2-performance.md`](fixes/round2-performance.md) closed A-01 and B-06.
  [`fixes/round2-handoffs.md`](fixes/round2-handoffs.md) closed the other ten. An interrupted first attempt changed
  92 files ([`fixes/_round2-interrupted.md`](fixes/_round2-interrupted.md)); that work was reviewed and kept.
- **Round three.** [`fixes/round3-performance.md`](fixes/round3-performance.md).
- **Round four.** Three packages in parallel against the re-review's section 6.1 and the gallery notes:
  [`fixes/round4-trust.md`](fixes/round4-trust.md) (status lines, day of travel, placement, thin airports),
  [`fixes/round4-ask.md`](fixes/round4-ask.md) (one fact one answer, concierge, search) and
  [`fixes/round4-layout.md`](fixes/round4-layout.md) (answer-first, density, measurement, the statement, 404s).
- **Round five.** Three packages in parallel against the open performance and density items and verification's
  low items: [`fixes/round5-speed.md`](fixes/round5-speed.md) (TBT, first-load JavaScript, the concierge's flights
  from the feed, bytes, HTML and the service worker, the home's type sizes),
  [`fixes/round5-flight.md`](fixes/round5-flight.md) (the flight page's LCP and first-load JavaScript, the board at
  night, density on the flight page, desktop CLS on section pages, e2e A-03) and
  [`fixes/round5-polish.md`](fixes/round5-polish.md) (the catch-all 404s, the search index, parking density, the
  transport fare row, the airports map labels, the canonical in the head, `.gitignore`).

### 10.4 What round three did

Round three moved no item to verified, because each remaining item still misses at least one part of its criterion.
It closed the largest remaining causes [measured]:

- The `h1` revealed late on 116 of 276 pages → **0**. Transport LCP 4.27 → 1.10 s; parking LCP 4.13 → 1.11 s.
- The demonstration flight generator in the first load of 39 routes → **0**. No route over 250 KB (was 2).
- Home CLS → **0** in every load (was up to 0.029).
- Arrivals no longer says landed flights "have already left".

B-09 and E-02 are now each one part short. For B-09, the concierge still generates flights on the device, and CI
has not run. For E-02, congested Wi-Fi LCP is still over target.

### 10.5 What round four did

Round four moved no backlog item to verified: the count stays **85 verified, 16 not verified, 0 regressed**. It was
aimed at the panel's re-review rather than the backlog, and closed [measured; [`verification.md`](verification.md),
F4]:

- Re-review section 6.1, items 1 to 10: **9 verified, 1 partly** (6.1.7 density: facilities toggles 21 → 11,
  transport 9 → 4, transit 16 → 6; parking and the flight page unchanged; 4 pages at 9 type sizes).
- The four gallery defects: 404s with the `h1` in the server HTML and 0 console errors; "Tomorrow" on next-day
  preview rows; the offline card and toast agree before the service worker is ready; "MH 2" returns only flights and
  Malaysia Airlines' own entries.
- Inside not-verified items: A-14 (source toggles −48% on facilities, −56% on transport), D-04 (Malaysia Airlines'
  48-hour rule drives a warning; other airlines get an honest "not published"), E-17 (every listed commercial
  hand-off measured with campaign parameters; durable counts) and E-06 (the CI jobs run locally; one configuration
  error fixed). Each still misses part of its criterion.
- The measurement scripts are now in the repository (`scripts/qa/`).

### 10.6 What round five did

Round five moved no backlog item to verified: the count stays **85 verified, 16 not verified, 0 regressed**. Of its
18 claims, **16 are verified and 2 partly** (TBT on the home, `/ms` and `/en/kul`; the home's type sizes, which are 9
with a saved flight). It closed [measured; [`verification.md`](verification.md), G2 to G5]:

- **The flight page and the night board.** The flight page's `h1` is in the server HTML before the first hidden
  segment: LCP 4.2 to 4.9 → 1.22 s, performance 94 and 96, first-load JavaScript 249.1 → 198.3 KB. The empty night
  board sends a "Loading the board" block that its empty state fills: LCP 4.7 → 0.92 s.
- **Shared JavaScript and bytes.** The shell 70.1 → 33.0 KB; 18 of 39 routes at 170 KB or less (0); icons as one
  sprite (lucide-react in 0 client chunks); HTML 6.5 to 11.1 KB smaller per page (the concierge 1.6); the service
  worker's first visit 62 → 61 requests and 691 → 643 KB. The concierge's round-four TBT rise is gone (pooled 287 → 183 ms; 705 → 558 KB).
- **The concierge's flights** come from the server feed through the provider interface; the demonstration
  generator is in no client chunk (B-09 is now one part short: the chaos and contract tests in CI).
- **Density.** Parking: 4 provenance tags, 3 source toggles, 0 Demo tags on cards, 7 type sizes at 390 px. The
  flight page: at most 1 Demo label per view, 2 source toggles, 8 type sizes.
- **Polish.** Catch-all 404s with the shell, `h1`, title, `noindex` and one canonical in the server HTML;
  "[object Object]" gone from the search index; the Malay transport fare at 125% text 881 → 717 px; desktop CLS on
  airport section pages 0.025 → 0.0004 to 0.0005 and on transport 0.045 to 0.049 → 0.0004 to 0.0012; 0 of 5 map
  labels outside the drawing; one canonical in the head on 276 of 276 (152); e2e A-03 30 of 30 on repeat.
- **Re-checks.** Re-review 6.1.1 to 6.1.6 and 6.1.8 to 6.1.10 remain verified; 6.1.7 (density) stays partly met;
  gallery note 3 (the offline page and its toast) is now partly met, because the toast waits for the runtime's script.

What it did not close: TBT over 200 ms on most pages, congested Wi-Fi LCP, first-load JavaScript over 170 KB on 21
routes, the HTML, byte and worker budgets, 9 type sizes on 8 pages at 390 px, and CI on a runner. The third review
then found the saved-flight failure to be page-level and the concierge focus defect (section 1).

### 10.7 Defects found by verification itself

Each round's verification also found defects that were not in the backlog, or that the fix logs described wrongly.

- **Round one: 6 product defects, all fixed.**
  - A new WCAG 2.5.3 Level A failure on the phone bar.
  - Sideways scroll on parking at 320 px.
  - Home CLS of 0.16 and 0.18 when a flight was saved.
  - The concierge tagging magazine facts "Official".
  - Build warnings from the sitemap tracing the whole project.
  - Desktop `/en/kul` CLS of 0.30 to 0.37.

  Six test-harness problems were also fixed, among them shared rate-limit buckets and incomplete axe tag lists. No
  test was removed, skipped or loosened.
- **Round two: 3 product defects, all fixed.**
  - The canonical `Link` header that grew and leaked other visitors' flight pages. It was pre-existing; the
    hand-offs log had called the header intended.
  - The flight-page `h1` pushed to 244 px on phones, a regression of round two.
  - D-09 incomplete on the overview board.

  The verifier also corrected statements in both round-two logs.
- **Round three: no product regression needed a fix.**
  - Two figures moved the wrong way inside items already not verified: the service worker's first visit (62
    requests, 685 KB) and the `/en/kul` switcher (224 ms in 2 of 9 runs).
  - Two statements in the round-three log were corrected: transport's median is 93, not 95, and "every page still
    has 3 `$RC` reveals" holds for non-airport pages only.
- **Round four: no product regression; 2 inconsistencies between packages, 2 test defects and 1 workflow error, all
  fixed.**
  - The concierge still said "No disruption … reported" while the status lines said "Status not available"; it now
    says "Status not available" in English and Malay.
  - 10 Malay strings in the privacy, terms, about-this-prototype and offline copy still said "concierge"; they now
    say "Tanya Kami".
  - A new parking test, written against the dev server, read a car-park card before React revealed the streamed copy
    on a production build; it now first asserts the card exists once (stricter, not looser).
  - Two board tests failed at night, when the board's window has no demonstration departures; they now fix the clock,
    with the assertions unchanged.
  - The CI Lighthouse step stopped on a configuration error before evaluating any budget; fixed, with the
    assertions unchanged.
  - Wrong-way numbers, not fixed: the concierge's Lighthouse score (97 → 93; TBT up about 80 to 100 ms), transport's
    desktop CLS (0.045 to 0.049), HTML +1.3 to 2.9 KB and first-load JavaScript +0.2 to 2.4 KB per route, the service
    worker's first visit +6 KB, My journey mobile CLS 0.036 → 0.040. None crosses a target met in round three.
  - Every log figure re-measured matched, except Follow and My needs (4 px higher than logged), the parking page's
    Demo labels (4, not 5) and the ask log's count of its new e2e tests (9, not 10).
- **Round five: 1 regression and 1 robustness slip, both fixed; harness and script corrections.**
  - **Regression (speed package).** The platform runtime became a lazy script with no error boundary. When its
    script could not be fetched, every page, the offline page included, was replaced by "This page couldn't load"
    and stayed so after the connection returned (24 of 24 page and viewport pairs with every lazy script failing);
    the flight page's new lazy parts did the same within the page. Found while checking why gallery note 3 no longer
    showed its card or toast. Fixed with `retryingImport`, an import that tries again when the browser is back
    online, with 4 unit tests and 2 e2e tests (0 of 24 afterwards).
  - **Robustness slip (flight package).** "My needs" tapped before its lazy control arrived jumped to nothing (1 in
    25 runs); the placeholder now carries the anchor (20 of 20 afterwards).
  - **Not fixed, pre-existing since rounds two and three.** The home's saved-flight card and My journey's clear
    control are also plain lazy imports. Verification recorded that a failed fetch shows "Something went wrong" in
    the page; the third review's chair found that it replaces the whole main area and that "Try again" does not
    recover.
  - **Harness.** Two night-run failures came from the clock shift's date and one from a test sharing its worker's
    rate-limit bucket; one axe `target-size` result appeared in one night run and not in 236 repeats. None is a
    product change; the night-clock script now defaults to the pinned tests' date. Three measurement scripts were
    corrected (the home strip's hidden text, the head-canonical rule, a client address per Lighthouse run).
  - **Logs' numbers.** All matched within noise except: the speed log's interleaved Lighthouse medians read better
    than verification's two sets; its "8 type sizes on the home" holds only without a saved flight; the flight
    page's `h1` is at byte 22,540, not 19,517; its desktop CLS is 0.009 (log 0.0045); the night board scores 95 to
    96 (log 93 and 90); the Malay fare's text is at 717 to 749 px (log 720 to 770). Two logs' e2e counts were
    partial runs.
  - **Wrong-way numbers, not fixed** (four now miss a target they met in round four: `/ms` performance, the map's in the
    second set, parking's TBT and two interaction runs): TBT on the map, transport and parking and `/ms` performance
    (94 and 91), within the container's spread; 2 of 30 interaction runs over 200 ms; the night
    board's desktop CLS of 0.023 and 0.041, measured for the first time; the offline toast now waits for the
    runtime's script.

[judgement] The fix logs' own statuses were more optimistic than independent verification in every round. Package D
reported D-14 fixed and package E reported E-02 fixed; neither met its criterion on the production build. The
round-two hand-offs log said the `Link` header had no duplicate; every page carried 7 to 11 canonicals. In round
four the logs' numbers held, but two inconsistencies fell between packages and were caught only by verification, and
the packages had run their tests only against dev servers, where one new test behaved differently from a production
build. In round five a speed change regressed every page on a failed script fetch, which no package's tests covered;
verification found it by following up a changed gallery check. The third review then showed that a related residual
was worse than verification had described. Keep a separate verification step, on a production build, for every
round, and test failure states (failed scripts, failed feeds, the night window) as well as the paths that work.

---

## 11. Remaining limitations, ranked

Ranked by risk to a passenger acting on the product and by how much they block a pilot or launch [judgement].
"Prototype-only" items are listed where they bear on readiness. Evidence is from [`verification.md`](verification.md),
round five (G2 to G8), and the third review ([`panel/review-3.md`](panel/review-3.md)), unless stated. **[pilot]**
marks a condition for the closed KLIA pilot (section 1).

| # | Limitation | Evidence | Backlog | Who |
|---|---|---|---|---|
| 1 | **No live operational data.** Every flight, gate, check-in row, queue and alert is demonstration data; the official provider throws; notices are a code file. The status lines and the concierge say so; the concierge reads flights from the same server feed as the board **[pilot: the feed and a notices owner]** | Third review 4.1 rows 6 and 7, weakness 1; G5 (B-09) | B-09; OOS-01, OOS-02 | **MAHB** (flight feed, operations feed, notices CMS and owner); **Team** (the chaos and contract tests in CI, the last part of B-09) |
| 2 | **A failed script fetch blanks a returning passenger's pages.** With a saved flight, 2 of 14 lazy scripts on the home and 2 of 10 on My journey each replace the whole main area with "Something went wrong"; "Try again" does not recover. The offline toast also waits for the runtime's script **[pilot]** | Third review 1.4 row 1 [chair], weakness 4; G3 item 1; G8 items 2 and 8 | none (found in round five) | **Team** |
| 3 | **No evidence from real users, assistive technology, Safari or the field.** No usability study; no physical screen reader; no WebKit or iPhone; no real device; no field Core Web Vitals. A study plan exists | Sections 2, 4 and 6 | E-06; OOS-15 | **Team** (run CI, WebKit and the AT pass); **MAHB** (recruitment, sign-off, hosting for field data) |
| 4 | **Focus defects that contradict the accessibility statement.** The concierge's sticky question box covers the focused suggestion at 1280 x 720 and 1440 x 900 (at best a marginal pass of 2.4.11); in-page links and palette selections leave focus on the page body; the statement says both work and predates round five; it has no accessibility contact **[pilot: the defect and a true statement]** | Section 4.3; third review 1.4 row 2 [chair], weakness 8 | A-05 (residual) | **Team**; **MAHB** (the contact) |
| 5 | **Facts for assisted travellers missing.** Accessible toilets, lifts, step-free status per mode, accessible bays, the airport's assistance service, the assistance rules of airlines other than Malaysia Airlines, the Immigration Department's wording for departing citizens, located taxi, rail and e-hailing points | Third review 4.3 row 19, weakness 5 | D-04, D-07, C-08; OOS-07 | **MAHB**, airlines, Immigration Department |
| 6 | **CI and release gates never run on a runner.** The jobs ran locally (all pass but the Lighthouse budgets, 10 failures); WebKit, CodeQL and gitleaks have never run; no revised TBT budget agreed **[pilot]** | Section 3.2; G7 | E-06, B-09 | **Team** |
| 7 | **Performance budgets not met.** TBT over 200 ms on most pages (pooled medians 227 to 308 ms on eight pages); performance under 95 on `/ms` (94, 91) and `/en/kul` (94, 93); congested Wi-Fi LCP 2.57 and 2.65 s; first-load JavaScript over 170 KB on 21 of 39 routes; guidance pages 539 to 605 KB; HTML over 40 KB gzip on 14 of 22 pages; worker first visit 61 requests and 643 KB | Section 5; G8 items 1, 4, 6 and 7 | A-09, E-01, E-02, E-03, E-11, E-12 | **Team** (or revised budgets agreed with the design owner) |
| 8 | **Content depth and operator-grade sourcing.** 3 of 39 airports beyond an overview and a board; Kuching and Langkawi transport and parking 404; no KLIA parking rate verified (0 of 4); 8 outlets; third-party sources for MAHB's own building; the operating airline and own phone line of 33 airports; Malay a draft | Third review 4.3 rows 16 to 20, weakness 2 | D-16; OOS-03, OOS-05, OOS-06, OOS-08, OOS-14 | **MAHB** |
| 9 | **The concierge and search miss intents.** "Book me a taxi" lists six modes; "right now" queue questions ignore the queue data; a Malay departure-autogate question leads with visitor and arrival-card content; search: "pharmacy" 0 results with no "not published" line, "kuching parking" led by other airports' pages, "charging" returns trains; concierge phone turns of 500 to 1,163 px | Third review 1.4 rows 6 and 7 [chair], weakness 6 | A-12 (its named queries met); re-review 6.1.4 | **Team** |
| 10 | **Labels and copy that mislead.** The 2027 fare badged "In effect now"; an "Estimated" chip on a notice; demonstration lifts unmarked in search; the concierge's long-stay card without its qualifier; "no notices right now" on directory-only airports; Malay mid-word breaks on four pages | Section 7; third review weakness 10 | none (residuals of re-review 6.1.4 and 6.1.6) | **Team**; **MAHB** (native Malay review, OOS-14) |
| 11 | **Nothing can be bought, and measurement is partial.** No basket, lounge booking or reserve-and-collect. Every listed commercial hand-off is measured and the counts are durable, but answer states exist for three tasks only; the enforced CSP keeps `'unsafe-inline'` and `payment=()` | Third review 4.2 rows 9 and 12, 4.3 row 17 | E-17, E-09; C-11; OOS-04, OOS-13; D-17 | **Team** (answer states, CSP); **MAHB** and partners (commerce) |
| 12 | **Alerts stop when the browser closes.** No push on iPhone outside an installed web app; e-mail is a demonstration | Third review 4.3 row 21 | B-04; OOS-10 | **MAHB** and partners |
| 13 | **Hierarchy, length and type sizes.** The overview's flight search at 2,236 px on a phone [chair]; about two board rows above a 900 px desktop fold [chair]; facilities 15,451 px on a phone; a Demo chip on every hour group of a filtered board; 9 type sizes on 8 of 280 pages at 390 px (the home with a saved flight, the corporate hub, corporate news, about-this-prototype) and 11 pages over 8 at 1440 px. Parking and the flight page are done | G4, G5 (A-14); third review weakness 9 | A-14 | **Team** (design owner) |
| 14 | **Deployment security configuration.** Per-visitor rate limits need the client-address header declared; edge and WAF rules not deployed; no `security.txt` | Section 8; G8 item 10 | E-08; OOS-11, OOS-12 | **MAHB** (hosting), with the team's checklist |
| 15 | **Low.** The night board's desktop CLS (0.023 English, 0.041 Malay); 2 of 30 interaction runs over 200 ms; one e2e test sensitive to rate limits; hreflang alternates in the HTML head on 152 of 276 pages (all in the `Link` header); the header's airport switcher shifts 0.0004 to 0.005 after hydration; unknown paths' 404 renders kept in the route cache (bound it in the deployment); the header and bottom bar at 200% device text; reading level (immigration guide at grade 9.5) | G8 item 9; sections 3.2, 4.3 and 7 | E-14, D-14 | **Team** |

Closed since the round-four edition of this report (verified in round five): the flight page's and the night board's
late LCP and the concierge's TBT regression (part of former row 4); density on parking and the flight page (most of
former row 9; type sizes remain); the concierge's on-device flights (part of former row 1); and from former row 12,
the catch-all 404s, desktop CLS on airport section pages and transport, the Malay transport fare at 125% text, the
clipped "LGK" label, "[object Object]" in search summaries, e2e A-03, the missing head canonical on 124 pages and
the `.lighthouseci/` folder (already git-ignored). New since that edition: rows 2, 4, 9 and 10, from round five's
verification and the third review.

---

## 12. Recommended next quality steps

In order. Steps 1 to 4 are the conditions for a closed pilot with real passengers: the third review's (the second
review's conditions still open, and three it added), which I adopt; steps 5 and 6 I would also complete first. The
rest stand between such a pilot and a public launch. The second review's other team conditions (status lines, day
of travel, one fact one answer, durable measurement) were met in round four and hold in round five.

1. **Make lazy parts fail safely** (Team) [pilot]. Use `retryingImport` for every `React.lazy` that renders on load
   (the home's saved-flight card, My journey's controls); scope error boundaries to the card; make "Try again"
   import again rather than re-render a cached rejection; add the saved-flight state of the home and My journey to
   the failed-script e2e test. Keep a minimal connectivity listener in the shell so the offline toast does not wait
   for the runtime's script.
2. **Fix the focus defects, then make the statement true** (Team) [pilot]. Keep the concierge's focused suggestion
   clear of its question box (scroll padding equal to the box's height, or a static box while suggestions show),
   re-tested at 1280 x 720 and 1440 x 900 with axe; move focus to the target of in-page links and palette selections;
   then re-date the accessibility statement in both languages, with the accessibility contact once MAHB names one.
3. **Run the CI workflow on a runner with WebKit**, and fix whatever it finds (Team) [pilot]. Decide with the design
   owner whether the TBT and byte budgets stand and record the decision; then make the Lighthouse step a real gate,
   with at least 5 interleaved runs per page given the container's TBT spread. Commit the one-off checks still
   outside `scripts/qa/`.
4. **Connect the official flight feed on staging and name an owner for notices** (MAHB, OOS-01 and OOS-02) [pilot].
   Run the chaos and contract tests against the real feed, and add a freshness check that fails when data is older
   than its label says.
5. **Accessibility pass with assistive technology** (Team, independent specialist):
   - NVDA with Chrome, VoiceOver on iOS Safari, TalkBack, and a magnifier at 200% and 400%, on the critical
     journeys;
   - a repeat of the full manual WCAG 2.2 AA audit of 18 November on the pilot build.
6. **Run the formative usability round**, as planned in [`usability-study-plan.md`](usability-study-plan.md): 44
   moderated sessions in Malay and English, including assistive-technology users, on the round-five build or later
   with the demonstration data stated, preferably after steps 1 and 2. MAHB recruits; the team fixes the issue list
   before the summative round.
7. **Performance** (Team): TBT on the home, overview, board, parking, map, transport and flight page; congested
   Wi-Fi LCP (render-blocking CSS and fonts); the 170 KB target on the 21 routes over it; the HTML, byte and worker
   budgets, including the product decision on the prefetched routes and idle overlays.
8. **Close the remaining team items** in section 11: concierge intents and answer length; search vocabulary and
   "not published" lines per airport; notice and label semantics ("In effect now", demonstration lifts); hierarchy
   on the overview and the desktop board; type sizes (A-14); Malay residuals; answer states for the other top tasks
   (E-17); E-14 and the low items. Re-verify each round independently on a production build, as in the five rounds
   so far, including failure states.
9. **Security before exposure** (Team, with MAHB hosting):
   - a penetration test of a staging deployment behind the real CDN and WAF;
   - confirm the client-address header and the edge rules (OOS-11), and publish `security.txt` (OOS-12);
   - decide the nonce-based CSP and payment-policy question (E-09);
   - a privacy impact assessment before any AI provider is enabled.
10. **Content operations** (MAHB):
    - operator sources for MAHB's own facilities;
    - the terminal car-park tariff;
    - the accessibility and assistance facts, including the airlines' notice periods;
    - the operating airline and own phone line of the 33 airports without a content file;
    - Kuching and Langkawi to the content minimum;
    - native Malay review, including "Tanya Kami" and the new home `h1`.

    Then run the content-integrity crawl again, with the strategy's accuracy measures (100% of items sourced and
    dated, under 2% past their review date, zero page, calculator and barrier discrepancies) as a monthly check.
11. **Summative usability benchmark** on the launch candidate with the official feed on staging, against the
    current MAHB site ([`usability-study-plan.md`](usability-study-plan.md), stage 3). The brief's 95% and 90% task
    targets are judged here, task by task, with the stated decision rules.
12. **Field measurement from day one of any public exposure** (MAHB hosting, Team instrumentation). Use
    consent-aware real-user Core Web Vitals (LCP, INP, CLS at the 75th percentile on mobile) and Chrome UX Report
    data once eligible. Spot-check on mid-range Android phones on Malaysian mobile networks and on terminal Wi-Fi.
