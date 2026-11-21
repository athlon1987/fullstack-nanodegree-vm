# Quality assurance report

Product: working concept redesign of the Malaysia Airports (MAHB) passenger and corporate websites.
Owner: head of quality. Date: 21 November 2026.
Build assessed: the production build in `.next` (build ID `MtgRkGApHKutmCFmH-yix`; Next.js 16.4.6, React 19.3.0,
Tailwind CSS 4.3.3), the build verified in round three of [`verification.md`](verification.md).

This is the document to read to judge how good the product is and what remains. It adds no new testing: every
figure comes from the QA evaluations of 18 November, the review panels of 18 and 21 November, the three fix rounds
and their verification on the production build. Each section names its source.

**How to read it.**

- **[measured]** means a tool or script produced the number on a production build. **[judgement]** means expert
  assessment. Unlabelled statements of status come from [`verification.md`](verification.md).
- **Before** means the QA evaluations of 18 November 2026 (for links, the integration crawl of 17 November).
  **After** means verification round three, 21 November 2026, on the build above.
- **Prototype-only** marks a condition that exists because this is a prototype on demonstration data (for example
  simulated flights) and is expected to go away with production data, not a defect of the design.
- **Team** means the delivery team can fix it. **MAHB** means it depends on MAHB data, systems or partners.
- All browser testing ran in Chromium (desktop 1440 x 900 and a Pixel 7 profile at 390 x 844, plus narrower
  viewports). WebKit, iPhone Safari, real devices and physical screen readers were not used anywhere.

---

## 1. Summary verdict

**Ready for:** stakeholder demonstrations, and a **moderated pilot**: recruited participants in observed sessions,
with scripted scenarios and the demonstration data presented as such. The formative round of the usability study
in section 6 can run on this build.

**Not ready for:** a public launch, or any pilot in which real passengers act on its flight, gate or status
information without a moderator. The evidence below supports that limit and does not support more.

**What is proven** [measured, Chromium, production build]:

- The build has 0 type errors, 0 lint problems and 0 build warnings. All 504 unit tests and all 348 end-to-end tests
  that run on the desktop and phone projects pass (6 deliberate skips, none loosened).
- axe-core reports 0 violations at 50 scan call sites on both projects. The eight WCAG 2.2 criteria the
  accessibility audit found failing (five of them Level A, including Label in Name on every airport page) are fixed
  and verified. Lighthouse accessibility is 100 on every run.
- The link crawls find 0 broken internal links and 0 missing anchors: 438 static pages, 285 rendered pages and 434
  search-index documents.
- In the lab, LCP is 0.92 to 1.11 s and CLS at most 0.003 on all 10 pages measured under Lighthouse's slow-4G
  profile. Every measured interaction is under 200 ms at 4x CPU, except one control in 2 of 9 runs (224 ms).
- 85 of the 101 P0 and P1 backlog items are verified against their acceptance criteria, and none has regressed.
- In the content audit, every extracted figure traced to a sourced content record or to labelled demonstration or
  estimated data; no fabricated value was found. A source policy, under which "Official" needs an authoritative
  source, is now enforced by tests.
- The two high-rated security defects (unbounded request body, spoofable rate-limit key) and the cross-site posting
  defect are fixed and verified. Production dependencies have 0 known vulnerabilities.

**What is measured and not met:**

- Total blocking time is over 200 ms on 7 of 10 pages, and Lighthouse performance is under 95 on 3 of 10 (92 and
  93).
- LCP on the congested airport Wi-Fi profile is 2.57 s and 2.68 s, against 2.5 s.
- The byte and request budgets fail on guidance pages, and first-load JavaScript on content pages is 199 to 227 KB
  against 170 KB.
- 16 P0 and P1 items are not verified, 9 of them P0. The backlog's own rule is that all 48 P0 items close before
  any public pilot.

**What is not proven, because it cannot be in this setting:**

- Field Core Web Vitals: there is no traffic.
- Task success with real passengers: no study has run.
- What screen-reader users experience: no physical assistive technology was used.
- Behaviour on Safari and iOS: the WebKit project has never run.
- The CI pipeline: it exists but has never run.
- The accuracy of operational data: every flight, gate, check-in row and queue time is demonstration data, and the
  official flight provider is a stub (prototype-only).

**Why not a public launch** [judgement, on the evidence above and the panel's re-review]:

1. **Operational data.** There is no live flight or operations source. The status lines also stamp the current
   clock time ("Checked 19:05") and default to "No disruption reported", which overstates freshness (Team for the
   wording; MAHB for the feeds).
2. **Day-of-travel errors.** These are the same class as round one's: a past arrive-by time shown as "Next", a
   delayed flight that mixes two time bases, and "Done: Arrange assistance" when nothing was arranged (Team).
3. **Assisted travel.** The facts a wheelchair user travels on are missing: accessible toilets, lifts, step-free
   transport and airline assistance rules (MAHB, airlines).
4. **Evidence.** There is no real-user, assistive-technology, Safari or field evidence (Team, with MAHB recruitment).
5. **The panel.** All three re-review lenses independently judge it not ready for public launch (the business lens
   in those words; design and inclusion through their lists of launch blockers). The panel scores the
   product at 74.5%, below Heathrow (79.0%) and the strategy's target (90.5%).

The panel's business lens recommends a **closed pilot at KLIA** with real passengers. Its conditions are five team
items (CI run with the TBT budgets met or agreed anew, durable commercial measurement, one source per fact,
day-of-travel residuals, status-line wording) and two MAHB ones (the official flight feed connected, a named owner
for notices) ([`panel/re-review-business.md`](panel/re-review-business.md), section 7;
[`panel/re-review.md`](panel/re-review.md), section 6). I agree with
those conditions; until they are met, the moderated pilot is the ceiling.

---

## 2. The brief's acceptance targets

The brief sets Core Web Vitals as 75th-percentile **field** values on mobile. A prototype with no traffic can only
show lab values; those indicate risk and do not confirm or refute the field target. Task-success targets need
real participants. Both are marked accordingly.

| Target (brief) | Before (18 Nov) | After (round three, 21 Nov) | Method | Status |
|---|---|---|---|---|
| **WCAG 2.2 AA** | 8 of 55 criteria fail (1.3.1, 1.4.11, 2.1.4, 2.2.2, 2.4.3, 2.4.7, 2.5.3, 3.1.2); 15 findings, 4 high | All 8 fixed and verified. axe 0 violations at 50 call sites on 2 projects. One more Level A failure (2.5.3, phone bar) was found in verification round one and fixed. The inclusion re-review (axe on 18 pages in 3 configurations, 54 scans, plus keyboard, reflow and zoom checks) reported no AA failure | axe-core in Playwright (wcag2a to wcag22aa); manual audit of keyboard, focus, contrast, reflow and motion (18 Nov); inclusion re-review (21 Nov) | **Partly met.** No known open AA failure in the tested scope, but conformance cannot be claimed: no screen reader, no WebKit, the manual audit has not been repeated in full, and the accessibility statement is out of date |
| **LCP 2.5 s or less** (p75, field) | Lab: 9 of 15 pages pass; 6 at 4.1 to 4.8 s. Congested Wi-Fi 2.8 to 2.9 s | Lab: 10 of 10 at 0.92 to 1.11 s. Congested Wi-Fi 2.57 s (`/en`) and 2.68 s (board) | Lighthouse 13.6, simulated slow 4G, 4x CPU, median of 3; applied Wi-Fi profile | **Partly met in the lab** (not on congested Wi-Fi; the flight page, shop and dine and transit, which failed before, were not re-measured). Field: **not measurable in a prototype** |
| **INP 200 ms or less** (p75, field) | Worst interaction per page: board 784 ms, home 408 ms; 4 of 6 pages over. Up to 1,472 ms during hydration | Every measured interaction under 200 ms at 4x CPU, except the `/en/kul` airport switcher at 224 ms in 2 of 9 runs. TBT, the load-time proxy, is over 200 ms on 7 of 10 pages | Event Timing in Playwright (Pixel 7, 4x CPU, 3 runs); Lighthouse TBT | **Partly met in the lab.** Field: **not measurable in a prototype** |
| **CLS 0.1 or less** (p75, field) | `/ms` 0.161; desktop 0.23 to 0.29 on four pages; My journey 0.11 to 0.23; concierge 0.14 (phone) | Lighthouse at most 0.003 on 10 of 10; desktop at most 0.011; home 0 in all 24 loads; My journey with a saved flight 0.036 | Lighthouse; Playwright layout-shift observer, phone and desktop | **Met in the lab.** Field: **not measurable in a prototype** |
| **Lighthouse performance 95 or more** (mobile) | 0 of 15 (56 to 92) | 7 of 10 (92 to 99); not met on `/en/kul` 92, the board 93 and transport 93 | Lighthouse 13.6, median of 3 | **Not met** (7 of 10) |
| **Lighthouse accessibility 95 or more** | 100 on 15 mobile and 2 desktop pages | 100 on all 42 runs of round three | Lighthouse | **Met** (automated check only) |
| **Mobile responsiveness** | ~440 px of airport chrome above every task answer on phones; sideways scroll at 320 px with 125% text (transport 30 px, help 15 px) | 0 sideways scroll in 108 loads (18 pages at 320 px, 112% and 125% text, 3 themes). `h1` at most 184 px on 54 of 54 sub-page, viewport and language combinations. First board row at 614 px at 390 x 664. Still below the first phone screen: transport fare (1,821 px), transit verdict (1,186 px) | Playwright Chromium emulation; panel re-review | **Partly met.** Met for layout in Chromium; answer-first unfinished on two pages; WebKit and real devices untested |
| **Critical task completion 95% or more** | Simulated walkthrough: 28 of 36 runs (78%) | Not re-measured as a set after the fixes (section 6) | 18 scripted tasks x 2 viewports, one expert evaluator, no users | **Not measurable in a prototype.** Needs the study in section 6 |
| **Unaided task success 90% or more** | Simulated: 26 of 36 runs (72%) | Not re-measured | As above | **Not measurable in a prototype** |
| **Broken internal links: none** | 0 at integration (6 found and fixed then): 380 pages, 978 links | 0 broken, 0 missing anchors: static 438 pages and 1,154 links; rendered 285 pages and 1,516 links; search index 434 documents | Static and rendered crawls seeded from the sitemap; search-index check | **Met** |
| **Operational data accuracy** | Flight data generated in the browser; 9 records tagged "Official" on news or blogs; demo values on screen with no label in view | Flights, gates, queues and alerts are still demonstration data (prototype-only); the official provider throws. Static facts: source policy enforced by test; a demo label is in view on the board rows, previews and flight values checked | Content-integrity crawl (496 renders); content tests; verification | **Not measurable in a prototype.** Provenance and labelling of static content: met in the tested scope |

---

## 3. Automated testing

Sources: [`../engineering/handoffs/integration.md`](../engineering/handoffs/integration.md) (17 November, before
QA); [`verification.md`](verification.md), sections 2, R2 and T2.

### 3.1 What exists

| Suite | Covers | At integration (17 Nov) | Final (21 Nov) |
|---|---|---|---|
| Types and lint | `tsc --noEmit`, ESLint | 0 errors, 0 problems | 0 errors, 0 problems |
| Unit (Vitest) | Content validation and source policy (42 tests in `content.test.ts`); journey timeline states; board model and flight changes; feed providers, including failure and last-known data (the chaos and contract tests); concierge engine and server (rate limits, red-team prompts); search ranking; sitemap, redirects, canonical and security headers; storage and link sanitising; parking, transport, transit and map logic; i18n; time | 29 files, 363 passed | **32 files, 504 passed**, 0 failed |
| End-to-end (Playwright) | 11 specs: shell (header, phone bar, focus, first-screen positions, reflow), smoke (both languages, home, search, airport choice), flights (board, flight page, save, follow, codeshare), concierge, commerce (parking, shop and dine), transport, map, guides and help, corporate, platform (headers, CSP, API refusals, rate limits, canonical, sitemap, 404 caching) and cross-package hand-offs | 178 tests: 176 passed, 2 skipped | **354 tests: 348 passed, 0 failed, 6 skipped** (deliberate, project-specific), on a production build, desktop and phone projects |
| Accessibility (axe-core) | Shared tag list `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` in `e2e/support/axe.ts`, run inside the specs | 41 call sites, 0 violations (5 specs omitted `wcag21a`; one ran a single rule) | **50 call sites in 11 specs, 0 violations** |
| Scripted accessibility | Reflow at 320 px with 112% and 125% text in three themes; focus-indicator contrast in four themes | n/a | 108 loads, 0 sideways scroll; focus outlines 6.92 to 11.06:1 |
| Link checks | Static crawl from every sitemap URL; rendered crawl after hydration (sitemap plus 9 client-heavy pages); search index; canonical and hreflang per response | 0 broken | 0 broken, 0 missing anchors; one self-canonical with both language alternates on 276 of 276 sitemap URLs |
| Content | `validateAllContent()` and the content tests: every record sourced, source ids exist, "Official" only on authoritative sources, social posts never Official, ISO dates, records older than 12 months flagged, rates consistent with status, map graph connected; a 138-page Malay crawl for English text outside `lang="en"` | `validateAllContent()` 0 issues | Unit tests pass; Malay crawl 0 audited English strings (D-03) |
| Dependencies | `npm audit --omit=dev` and `npm audit` | | 0 and 0 vulnerabilities |

The integration-time axe count looked clean only because the tag lists were incomplete. Making them complete in
verification round one exposed a real Level A failure (section 4).

### 3.2 Gaps in the automation

- **CI has never run.** The CI workflow,
  [`.github/workflows/malaysia-airports-ci.yml`](../../../.github/workflows/malaysia-airports-ci.yml), is written and
  has not been executed (E-06). Its steps are types, lint, unit tests, build, the end-to-end tests on
  desktop, phone and WebKit phone, the Lighthouse budgets, an `npm audit` gate, CodeQL and gitleaks. As configured,
  its Lighthouse step would fail today (section 5).
- **WebKit has never run.** The WebKit phone project (`PLAYWRIGHT_WEBKIT=1`) has not been run locally or in CI.
- **Many checks live outside the repository.** The crawls, interaction-latency, early-input, layout, density and
  `$RC` scripts were run from session scratch folders. Another team cannot rerun them as they stand.
- **Performance is not part of the test run.** Lighthouse and the interaction measurements are manual lab runs.

### 3.3 How to run them

From `malaysia-airports/`, as in [`verification.md`](verification.md), section T6:

```bash
npm ci
npx next typegen                                            # route types; tsc fails without them on a clean checkout
npx tsc --noEmit && npx eslint . && npx vitest run          # types, lint, 504 unit tests (content validation included)
npm audit --omit=dev && npm audit
rm -rf .next && NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next build
TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3100 &   # stop it by its PID afterwards
npx playwright test --trace off                             # desktop and phone; axe runs inside the specs
PLAYWRIGHT_WEBKIT=1 npx playwright test --project=webkit-phone   # after `npx playwright install webkit`; never run yet
npm run budgets                                             # Lighthouse CI budgets (lighthouserc.json); port 3100 must be free
```

The server must trust the test client header. Without it, every worker shares one rate-limit bucket and the flight
pages answer 429. Set `E2E_STATUS_CODES=1` when `PLAYWRIGHT_BASE_URL` points at an external server, or the status-code
test (C-06) skips.

---

## 4. Accessibility

Sources: [`accessibility.md`](accessibility.md) (18 November); [`verification.md`](verification.md);
[`panel/re-review-inclusion.md`](panel/re-review-inclusion.md) (21 November).

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

- **No assistive technology with people.** No physical screen reader (NVDA, JAWS, VoiceOver, TalkBack) or speech
  input has been used; announcements are inferred from the accessibility tree and live-region recordings. There has
  been no WebKit or iOS Safari run, and no test with disabled participants. Team, with MAHB recruiting (OOS-15).
- **Misleading assistance state.** The timeline announces "Done: Arrange assistance" on past steps when nothing was
  arranged, and does not warn when the airline's notice period has already passed. This is not a WCAG failure as
  such, but it misleads the users the feature is for. Team.
- **Accessibility statement out of date.** It describes focus behaviour that was fixed, was last reviewed on
  17 November, omits 200% and 400% zoom from its test scope and has no contact or response time. Team.
- **Magnification and large-text defects** [measured by the inclusion re-review]:
  - At 400% zoom the concierge's sticky form hides most of the focused suggestion. This passes 2.4.11 and fails
    2.4.12, which is AAA.
  - The board's sticky hour heading keeps an offset for a header that has scrolled away.
  - At 320 x 568 with 125% text, 7 provenance chips on facilities are clipped ("Estimatec").
  - Malay words break mid-syllable at 360 px.

  The clipped chips conflict with A-16's clause that no text is clipped, although A-16 is recorded as verified on
  sideways scroll; it should be re-checked against 1.4.4 and 1.4.10 [judgement]. Team.
- **Missing facts for assisted travellers.** Accessible toilets, lifts, step-free status per transport mode,
  accessible bays, the airport's own assistance service and the airlines' assistance rules are missing (D-04,
  OOS-07). The product says "not published", honestly. MAHB, airlines.

---

## 5. Performance

Sources: [`performance.md`](performance.md) (baseline, raw data in [`lighthouse/`](lighthouse/)); verification
rounds one to three (raw data in [`lighthouse-after/`](lighthouse-after/), [`lighthouse-round2/`](lighthouse-round2/),
[`lighthouse-round3/`](lighthouse-round3/)); the fix logs.

### 5.1 Method and caveats

- **Settings.** Lighthouse 13.6 mobile (Moto G Power emulation, simulated slow 4G: 150 ms RTT, 1.6 Mbps, 4x CPU),
  3 runs per page, median reported. Interaction latency was measured with the Event Timing API in Playwright
  (Pixel 7, 4x CPU throttling).
- **Server.** `next start` on localhost: no TLS, no CDN, gzip only (brotli would cut JavaScript by about 13%). The
  site has no images, analytics or third parties; a production site that adds any of these will be slower.
- **TBT varies between sessions in the lab container.** The same build moved by ±60 to 100 ms of TBT from one
  session to another. Lighthouse's CPU benchmark index ranged from 2,234 to 2,861 within round three, and the
  baseline ran while other evaluators shared the machine (index 1,318 to 2,511). Single runs should not be quoted.
  Differences of a few points in the performance score between rounds are within this spread. The large changes
  (for example `/en` TBT 1,391 → 257 ms) are not.
- **Pages not re-measured.** Five baseline pages were not re-measured by Lighthouse after the fixes: the flight
  page (baseline 64, LCP 4.4 s), shop and dine (67), transit (68), corporate (92) and the airport directory (81).
  Round three removed the cause of the late LCP from every static page (below). The flight page, which is rendered
  per request, still streams its `h1` in a hidden segment.

### 5.2 Lighthouse mobile by round (median of 3 runs)

| Page | Performance: before → R1 → R2 → R3 | LCP (s) | TBT (ms) |
|---|---|---|---|
| `/en` | 56 → 90 → 97 → **95** | 4.8 → 1.2 → 1.08 → **1.11** | 1,391 → 421 → 204 → **257** |
| `/ms` | 65 → 91 → 96 → **95** | 1.3 → 1.2 → 1.09 → **1.10** | 1,978 → 385 → 227 → **245** |
| `/en/kul` | 78 → 80 → 96 → **92** | 1.1 → 4.4 → 1.07 → **1.08** | 992 → 272 → 233 → **353** |
| `/en/kul/flights` (board) | 81 → 91 → 95 → **93** | 1.1 → 1.1 → 0.92 → **0.92** | 790 → 360 → 257 → **304** |
| `/en/kul/map` | 68 → 74 → 97 → **97** | 4.4 → 4.6 → 1.07 → **1.07** | 679 → 393 → 201 → **207** |
| `/en/kul/transport` | 89 → 93 → 81 → **93** | 1.3 → 1.2 → 4.27 → **1.10** | 429 → 324 → 291 → **301** |
| `/en/kul/parking` | 83 → n/m → 79\* → **95** | 1.2 → n/m → 4.13\* → **1.11** | 677 → n/m → 355\* → **255** |
| `/en/guides` | 91 → 94 → 97 → **99** | 1.1 → 1.1 → 1.07 → **1.06** | 391 → 293 → 192 → **103** |
| `/en/concierge` | 91 → 93 → 95 → **97** | 1.1 → 1.1 → 0.92 → **0.92** | 612 → 311 → 268 → **186** |
| `/en/journey` | 64 → 96 → 98 → **98** | 4.5 → 1.1 → 0.92 → **0.92** | 845 → 233 → 171 → **179** |
| **Pages meeting the target** | 95+: 0/15 → 1/9 → 8/9 → **7/10** | 2.5 s: 9/15 → 7/9 → 8/9 → **10/10** | 200 ms: 0/15 → 0/9 → 2/9 → **3/10** |

n/m: not measured. \*Parking was not in round two's set; these are the round-two build as measured at the start of
round three. CLS: 14 of 15 pages at 0.1 or less before (`/ms` 0.161), then 9 of 9, 9 of 9 and 10 of 10 (largest
0.003). Accessibility was 100 on every page in every round. SEO is 66 by design: the prototype sends `noindex`.

What moved the numbers, by round:

- **Round one.** Demonstration boards are generated on the server and cached, so typing no longer rebuilds them.
  The root loading fallback was removed. The
  display font is preloaded and the italic dropped. Prefetching was cut from 8 to 24 requests to 2 to 5 per load.
- **Round two.** URL state now hydrates (no page-level Suspense on the overview, board and map). zod left every
  client chunk. Dialogs load on first open.
- **Round three.** The `h1` is no longer revealed late by React's `$RC` script on any of the 276 sitemap pages (it
  was on 116). The demonstration flight generator is out of every route's first load.

Two things moved the wrong way in round one: `/en/kul` LCP went from 1.1 to 4.4 s (the map stayed at 4.4 to 4.6 s),
and first-load JavaScript grew. Both were recovered in round two. In round two transport went to LCP 4.27 s, which
round three recovered.

### 5.3 Budgets

From the product strategy, section 7, and [`lighthouserc.json`](../../lighthouserc.json).

| Budget | Target | Before | R1 | R2 | R3 | Status |
|---|---|---|---|---|---|---|
| Home first-load JavaScript (gzip, build manifests) | 250 KB | 263.0 | 274.8 | 232.6 | **228.7** | Met |
| Routes over 250 KB of first-load JavaScript | none | every route (250 to 275) | most (largest: flight page 294.7) | 2 (252.0, 256.7) | **0** (largest 246.7) | Met |
| Content and guidance pages, first-load JavaScript | 170 KB | 250 to 275 (all routes) | 257 to 282 | 209 to 236 | **198.6 to 227.4** | Not met |
| Home fonts | 150 KB | 206 | 122 | 122 | **122** | Met |
| Home transfer | 1,000 KB | 701 to 703 | 607 to 609 | 576 to 578 | **607 to 609** | Met |
| Guidance-page transfer | 500 KB | 582 to 720 | 571 to 622 | 548 to 597 | **543 to 607** | Not met |
| Requests per page | 40 | 11 of 15 over | 8 of 9 within | 5 of 9 within | **2 of 10 within** | Not met |
| HTML per content page (gzip) | 40 KB | home 79 (half of it the interface dictionary) | 50 to 75 | 44 to 62; flight page 93.7 | **41 to 62; flight page 93.8** | Not met |
| Service worker, first visit | 60 requests, 600 KB, `/en` fetched once, cache 1 MB | 138, 1.07 MB, 3 times, 2.5 MB | 61, 710 KB, twice, 1.8 MB | 60, 652 KB, twice, 1.58 MB | **62, 685 KB, twice, 1.57 MB** | Not met |

As configured, the CI Lighthouse step would fail. It would fail on TBT on `/en`, `/ms`, the board and parking, on
the board's performance score, and on bytes and requests on parking.

### 5.4 Malaysian network profiles (3 runs each, median)

| Profile | Page | Before: performance, LCP, TBT | After (R3): performance, LCP, TBT |
|---|---|---|---|
| Malaysian median mobile (154 / 35 Mbps, 40 ms RTT, 4x CPU, applied) | `/en` | 74, 1.2 s, 1,539 ms | Not re-measured |
| | board | 77, 1.2 s, 1,091 ms | Not re-measured |
| Congested airport Wi-Fi (1.5 / 0.5 Mbps, 250 ms RTT, 4x CPU, applied) | `/en` | 63, 2.9 s, 1,956 ms | 79, **2.57 s**, 558 ms (R2: 82, 2.55 s) |
| | board | 69, 2.8 s, 1,264 ms | 79, **2.68 s**, 469 ms (R2: 82, 2.69 s) |

The Malaysian median profile is drawn from Ookla medians. The baseline showed that the network is not the
bottleneck there: LCP was 1.2 s on both pages. The Wi-Fi profile is the evaluator's own model of a crowded gate
area and leaves out packet loss and captive portals, so real congested Wi-Fi is likely worse. On that profile the
first paint is itself the LCP (2.57 s and 2.68 s). The target needs fewer render-blocking bytes before first paint:
20 KB of CSS, two preloaded fonts and 38 to 60 KB of HTML.

### 5.5 Interaction latency (worst interaction per run, Pixel 7, 4x CPU)

| Interaction | Before | R1 | R2 | R3 |
|---|---|---|---|---|
| Board: typing a flight number | 784 ms (worst on page) | 56 to 64 | 40 to 80 | 48 to 88 |
| Board: Departures and Arrivals | (as above) | 320 to 440 | 88 to 144 | 112 to 160 |
| Home: journey mode | 408 ms (worst on page) | 120 to 136 | 104 to 152 | 104 to 120 |
| Home: airport switcher | (as above) | 280 to 328 | 136 to 160 | 120 to 168 |
| `/en/kul`: airport switcher | 248 ms (worst on page) | 288 to 320 | 128 to 192 | 104 to **224** (2 of 9 runs at 224) |
| Input before hydration, `/en/kul` (scripts delayed 2.5 s) | not measured; on `/en`, interactions during hydration took up to 1,472 ms | typing lost in 5 of 6 loads | 0 of 6 lost | 0 of 6 lost |

### 5.6 Remaining causes [measured attribution; remedies are judgement]

- **TBT.** The long tasks are parsing the HTML document (150 to 190 ms at 4x CPU), React DOM (tasks of 113 to 220
  ms) and the Next.js runtime (147 to 228 ms). The framework is 128.7 KB of every route's first load, and an icon
  registry of 22.8 KB loads on all 39 page routes. Candidate remedies: fewer hydrated client components on first
  screens, a tree-shaken icon set and smaller documents. Otherwise the TBT target should be revisited with the
  design owner. Team.
- **Bytes and requests.** The home's flight-feed answer covers whole days for six airports where the preview
  needs about 8 rows. The service worker precaches more than the budget allows. Team.
- **For comparison** [measured, but in different conditions]. The benchmark sites were measured over the internet
  with third parties blocked; the prototype on localhost. Before the fixes the prototype's home was already 47 times
  lighter than MAHB's (0.70 MB against 32.7 MB) and scored 56 against MAHB's 9. Its main-thread work was then the
  weak point, and still is.

---

## 6. Usability

Sources: [`usability.md`](usability.md) (18 November); [`panel/re-review.md`](panel/re-review.md) (21 November).

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
| P4-T2: is the Aerotrain running now? | Partial: planned closure only | B-01 verified: status lines on the overview, home and flight page | The lines are read from notices held in code and say "Checked" with the current time (Team for wording; MAHB OOS-02 for a feed) |
| P8-T2: Subang parking daily cap | Failed: the tile silently opened the overview | A-07 verified: the tile says "not published" and leads to an honest state | No Subang parking data (MAHB, OOS-06) |
| P9-T2: Terminal 1 car park, 2 to 3 hours | Failed: rates not verified | C-01 verified: price-first layout, flight dates carried into the estimate | The terminal car-park rates are "≤ RM 52 (not verified)" (MAHB, OOS-03) |
| Answers below the first phone screen (P5-T1, P7-T1 and others) | Arrive-by time 8 scrolls down at 125% text; transfer verdict at 4,279 px | A-01, B-03 and C-03 verified: flight next step at 277 px, board row at 614 to 640 px, parking table at 340 px | Transport fare at 1,821 px; transit verdict at 1,186 px; overview flight search at 2,175 px (Team) |

[judgement] Two of the four non-successes would still fail with real users today, because the facts are missing.
They are now failures the product admits honestly rather than dead ends. The brief's 95% and 90% targets cannot be
claimed from any evidence that exists.

### 6.3 The study MAHB must run

The study design is in [`usability.md`](usability.md), section 7 (OOS-15: the team runs it; MAHB funds, recruits
and signs it off).

- **Pilot** (week 1): 5 sessions.
- **Formative round** (weeks 2 to 3): moderated think-aloud with about 40 participants across the persona groups,
  in Malay and English, including NVDA, VoiceOver, TalkBack and magnifier users. **This can start on the current
  build.**
- **Summative benchmark** (weeks 5 to 6): timed, on the launch candidate, with the **official flight feed on
  staging**, about 64 phone participants per core task. A matched baseline group runs the same tasks on the current
  MAHB site.
- **Measures:**
  - task success and unaided success, with adjusted-Wald intervals;
  - time on task;
  - the Single Ease Question and SUS;
  - comprehension of "Official", "Estimated", "Not published" and "Demonstration data";
  - trust ratings.
- **Decision rules:**
  - The 90% unaided target passes for a task only with at least 62 successes in 64.
  - The pooled 95% target needs at least 497 of 512 attempts.
  - Any core task below target goes back for a fix and a retest; it is not averaged away.
- **Duration:** about 8 weeks.

---

## 7. Content integrity and provenance

Sources: [`content-integrity.md`](content-integrity.md) (18 November); verification; the inclusion and business
re-reviews.

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

**New since the fixes** [measured by the panel and confirmed by the chair]. Neither is a regression of a fixed item.

- The status lines say "Checked hh:mm" with the current clock time and "No disruption reported" when their only
  source is dated notices held in code. They should show the notices' own as-of date, and "Status not available"
  when no current source exists. Team.
- The concierge says the parking rates are "not yet verified", while the parking page shows the Long Term Car Park's
  daily maximum without that mark. Both should read one record, with a test that fails when they disagree. Team.

**What content cannot fix without MAHB** (OOS-03, OOS-05, OOS-06, OOS-08, OOS-14):

- Only KLIA (17 URLs), Penang and Kota Kinabalu (6 each) go beyond an overview and a board. Kuching and Langkawi,
  both international airports, answer 404 for transport and parking.
- The terminal car-park rates are unverified, and there are 8 outlets.
- The arrival steps cite third-party guides for MAHB's own building.
- The Malay is a draft until a native editor signs it off.

**Prototype-only.** These are expected to go away with production data:

- the demonstration flights, gates, belts, check-in rows, queues and alerts;
- the illustrative map positions and "Demo" lifts;
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

- **Inline script allowed.** The enforced CSP still allows `'unsafe-inline'` scripts (E-09; Team, as a platform
  decision). A report-only policy with 4 script hashes and Trusted Types is in place. Next.js 16.4 cannot hash its
  per-page framework scripts, and nonces need per-request rendering. A future checkout would also need a per-route
  payment policy.
- **No automated security checks have run.** The `npm audit` gate, CodeQL and gitleaks exist only in the unexecuted
  CI workflow (E-06; Team).
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
- Measurement is aggregate, with a privacy section and an off switch (E-17, partial).
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
(round two, 21 November). Benchmarks come from `docs/research/benchmarks/matrix.json`.

The scores are calibrated expert judgement on a 1 to 5 rubric, not measurements. ui, ux, flight, mobile, nav and ai
are scored as if production data were connected; info and commerce on what exists. The perf score uses lab
figures. The matrix's stated uncertainty is about 3 points.

| Dimension (weight) | Round one (panel average) | Round two (panel median) | MAHB today | Heathrow | Best benchmark | Strategy target |
|---|---|---|---|---|---|---|
| ui: UI and brand (10%) | 4.00 | 4.0 | 2.5 | 3.5 | 4.0 | 4.5 |
| ux: task efficiency (20%) | 3.83 | 4.0 | 2.0 | 4.0 | 4.0 | 4.5 |
| info: completeness and accuracy (15%) | 3.00 | 3.0 | 2.0 | 4.0 | 4.5 | 4.5 |
| flight: live flight and journey (15%) | 4.00 | 4.0 | 2.5 | 4.5 | 4.5 | 5.0 |
| mobile (10%) | 3.50 | 4.0 | 2.0 | 4.0 | 4.0 | 4.5 |
| nav: navigation, search, accessibility (10%) | 3.83 | 4.0 | 2.0 | 3.5 | 4.0 | 4.5 |
| ai: personalisation and AI (10%) | 3.17 | 3.5 | 2.0 | 4.0 | 4.0 | 4.0 |
| commerce (5%) | 2.00 | 2.5 | 2.5 | 4.5 | 4.5 | 4.0 |
| perf: performance, security, reliability (5%) | 3.50 | 4.0 | 1.5 | 3.0 | 3.5 | 5.0 |
| **Weighted** | **70.8%** | **74.5%** | **42.5%** | **79.0%** | **83.0%** (composite) | **90.5%** |

| | Round one | Round two |
|---|---|---|
| Reviews | Executive and commerce 72.5%; first-time traveller and accessibility 68.5%; design director and frequent traveller 71.5% | Business 74.5%; design 75.5%; inclusion 74.5% (like-for-like mean 74.8%, +4.0 points) |
| Verdict | "Not ready for public launch." "We would fund it to launch, not launch it as is" | Not ready for public launch, from all three lenses independently (in those words from business; through launch-blocker lists from design and inclusion). Business: "ready for a closed pilot with MAHB data" |
| Position in the benchmark set | Level with Dubai (71.0%) and Hamad (69.0%); behind eight of ten benchmarks | Level with Incheon (74.5%); ahead of Dubai, Hamad and Munich; behind six (Heathrow 79.0, Haneda 77.5, Schiphol 77.0, Istanbul 76.5, Changi 76.5, Hong Kong 75.5). Only Heathrow's lead exceeds the matrix uncertainty |
| Projections (judgement) | 77 to 79.5% with MAHB data and launch gates; design lens 83 to 84% if its must-fixes also land | About 79 to 80% with the team's fixes and MAHB data; design lens about 85% if MAHB's data also lands. None reaches 90.5% |

Round one's ten main weaknesses, as judged in round two:

- **Improved: nine**, two of them only in part. These are answers on the phone's first screen, commercial strength,
  the live-data path in the product (the data itself is unchanged), day-of-travel guidance, following a flight,
  access needs, search and concierge, noise (caveats improved, density unchanged), and performance.
- **Unchanged: one.** Content depth and operator-grade sourcing.
- **Worse: none.**

The gap to Heathrow is 4.5 points: info −3.0, commerce −2.0, flight −1.5 and ai −1.0, partly offset by +3.0 on ui,
nav and perf. Most of it depends on MAHB data and partners.

---

## 10. Defects fixed in the three fix rounds

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

### 10.4 What round three did

Round three moved no item to verified, because each remaining item still misses at least one part of its criterion.
It closed the largest remaining causes [measured]:

- The `h1` revealed late on 116 of 276 pages → **0**. Transport LCP 4.27 → 1.10 s; parking LCP 4.13 → 1.11 s.
- The demonstration flight generator in the first load of 39 routes → **0**. No route over 250 KB (was 2).
- Home CLS → **0** in every load (was up to 0.029).
- Arrivals no longer says landed flights "have already left".

B-09 and E-02 are now each one part short. For B-09, the concierge still generates flights on the device, and CI
has not run. For E-02, congested Wi-Fi LCP is still over target.

### 10.5 Defects found by verification itself

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

[judgement] The fix logs' own statuses were more optimistic than independent verification in every round. Package D
reported D-14 fixed and package E reported E-02 fixed; neither met its criterion on the production build. The
round-two hand-offs log said the `Link` header had no duplicate; every page carried 7 to 11 canonicals. Keep a
separate verification step for every round.

---

## 11. Remaining limitations, ranked

Ranked by risk to a passenger acting on the product and by how much they block a pilot or launch [judgement].
"Prototype-only" items are listed where they bear on readiness.

| # | Limitation | Evidence | Backlog | Who |
|---|---|---|---|---|
| 1 | **No live operational data; status lines overstate freshness.** Every flight, gate, check-in row, queue and alert is demonstration data; the official provider throws; notices are a code file; status lines stamp the current time and default to "No disruption reported" | Re-review weakness 1 [chair confirmed]; verification T4 | B-09, B-01; OOS-01, OOS-02 | **Team** (wording now); **MAHB** (flight feed, operations feed, notices CMS and owner) |
| 2 | **Day-of-travel residuals.** A past arrive-by shown as "Next"; a delayed flight mixing original and new times; "Done: Arrange assistance" on unarranged steps; no warning inside the airline's notice period | Found independently by all three re-review lenses | follow-up to B-02, B-12 | **Team** |
| 3 | **No evidence from real users, assistive technology, Safari or the field.** No usability study; no physical screen reader; no WebKit or iPhone; no real device; no field Core Web Vitals | Sections 2, 4 and 6 | E-06; OOS-15 | **Team** (run CI, WebKit and the AT pass); **MAHB** (recruitment, sign-off, hosting for field data) |
| 4 | **Facts for assisted travellers missing.** Accessible toilets, lifts, step-free status per mode, accessible bays, the airport's assistance service, airline assistance rules, the Immigration Department's wording for departing citizens, located taxi, rail and e-hailing points | Inclusion re-review; verification T5 item 15 | D-04, D-07, C-08; OOS-07 | **MAHB**, airlines, Immigration Department |
| 5 | **Performance budgets not met.** TBT over 200 ms on 7 of 10 pages; performance under 95 on 3 of 10; congested Wi-Fi LCP 2.57 and 2.68 s; content-page JavaScript 199 to 227 KB against 170; guidance pages over 500 KB; HTML and service-worker budgets | Section 5 | A-09, E-01, E-02, E-03, E-11, E-12 | **Team** (or revised budgets agreed with the design owner) |
| 6 | **CI and release gates never run.** The workflow (tests, WebKit, Lighthouse budgets, audit, CodeQL, gitleaks) and the chaos and contract tests have never executed; the QA crawl and measurement scripts are outside the repository | Section 3.2 | E-06, B-09 | **Team** |
| 7 | **Content depth and operator-grade sourcing.** 3 of 39 airports beyond an overview and a board; Kuching and Langkawi transport and parking 404; terminal car-park rates unverified; 8 outlets; third-party sources for MAHB's own building; Malay a draft | Re-review weakness 2 | D-16; OOS-03, OOS-05, OOS-06, OOS-08, OOS-14 | **MAHB** |
| 8 | **Concierge and search do not always answer the question; surfaces disagree.** Unrelated "related" items for unanswerable questions; access qualifiers and named airlines missed; "smoking" returns 0 results; parking rate marked unverified in the concierge but not on the page | Re-review weakness 6 [chair confirmed] | B-08, A-12 follow-ups | **Team** |
| 9 | **Nothing can be bought, and measurement is partial.** No basket, lounge booking or reserve-and-collect; answer states declared for three tasks only; metrics held in memory; enforced CSP keeps `'unsafe-inline'` | Re-review weakness 3; verification T4 | E-17, E-09; C-11; OOS-04, OOS-13; D-17 | **Team** (measurement, CSP); **MAHB** and partners (commerce) |
| 10 | **Alerts stop when the browser closes.** No push on iPhone outside an installed web app; e-mail is a demonstration | Re-review weakness 7 | B-04; OOS-10 | **MAHB** and partners |
| 11 | **Density and answer-first beyond the main pages.** Flight page 20 provenance chips and 10 Demo labels; facilities 21 source toggles; transport and transit answers below the first screen; the map's route chip covers its disclaimer; 400% zoom and clipped-chip defects; Malay mid-word breaks | Re-review weaknesses 8 and 9; section 4.3 | A-14; A-16 re-check | **Team** (design owner's call on source lists) |
| 12 | **Deployment security configuration.** Per-visitor rate limits need the client-address header declared; edge and WAF rules not deployed; no `security.txt` | Section 8 | E-08; OOS-11, OOS-12 | **MAHB** (hosting), with the team's checklist |
| 13 | **Accessibility statement and reading level.** Statement out of date and without a contact; immigration guide at grade 9.5 | Sections 4.3 and 7 | D-14 | **Team**; Malay sign-off **MAHB** (OOS-14) |
| 14 | **Low.** 404 bodies rendered in the browser (server HTML has the title but an empty `<main>`); canonical in the HTML on 152 of 276 routes (the `Link` header is correct on all); a 404 names itself canonical in its `Link` header | Verification T5 items 9 and 13 | E-14 | **Team** |

---

## 12. Recommended next quality steps

In order. Steps 1 to 5 are the conditions I would set for a closed pilot with real passengers; the rest stand
between such a pilot and a public launch.

1. **Run the CI workflow on a runner with WebKit**, and fix whatever it finds before anything else (Team). Commit
   the QA scripts into the repository so every check in this report can be rerun:
   - the static and rendered crawls;
   - the search-index, canonical and Malay crawls;
   - the `$RC` scan;
   - interaction and early-input latency;
   - layout and density.

   Decide with the design owner whether the TBT and byte budgets stand. Then make the Lighthouse step a real gate,
   with at least 5 interleaved runs per page given the container's TBT spread.
2. **Fix the other team items the panel ties to a pilot** (Team), each with a test that fails without the fix:
   - durable, aggregate measurement with every commercial hand-off marked (E-17);
   - status-line wording that shows the notices' own date and "Status not available" when nothing is current;
   - the day-of-travel residuals (no past time as "Next", one time basis for delays, no "Done:" on unconfirmed
     steps);
   - one record per fact for parking rates across page, concierge and FAQ.
3. **Connect the official flight feed on staging and name an owner for notices** (MAHB, OOS-01 and OOS-02). Run the
   chaos and contract tests against the real feed, and add a freshness check that fails when data is older than its
   label says.
4. **Accessibility pass with assistive technology** (Team, independent specialist):
   - NVDA with Chrome, VoiceOver on iOS Safari, TalkBack, and a magnifier at 200% and 400%, on the critical
     journeys;
   - a repeat of the full manual WCAG 2.2 AA audit of 18 November on the pilot build;
   - an updated, dated accessibility statement with a contact and response time.
5. **Run the formative usability round now** (usability.md section 7.2, step 2). About 40 moderated sessions in
   Malay and English, including assistive-technology users, on this build with the demonstration data stated.
   MAHB recruits; the team fixes the issue list before the summative round.
6. **Close the remaining team items** in section 11:
   - TBT and budgets;
   - concierge and search relevance;
   - density and answer-first on transport, transit and the overview;
   - E-14 and the low items.

   Re-verify each round independently on a production build, as in the three rounds so far.
7. **Security before exposure** (Team, with MAHB hosting):
   - a penetration test of a staging deployment behind the real CDN and WAF;
   - confirm the client-address header and the edge rules (OOS-11), and publish `security.txt` (OOS-12);
   - decide the nonce-based CSP question (E-09);
   - a privacy impact assessment before any AI provider is enabled.
8. **Content operations** (MAHB):
   - operator sources for MAHB's own facilities;
   - the terminal car-park tariff;
   - the accessibility and assistance facts;
   - Kuching and Langkawi to the content minimum;
   - native Malay review.

   Then run the content-integrity crawl again, with the strategy's accuracy measures (100% of items sourced and
   dated, under 2% past their review date, zero page, calculator and barrier discrepancies) as a monthly check.
9. **Summative usability benchmark** on the launch candidate with the official feed on staging, against the
   current MAHB site (usability.md sections 7.2 to 7.6). The brief's 95% and 90% task targets are judged here, task
   by task, with the stated decision rules.
10. **Field measurement from day one of any public exposure** (MAHB hosting, Team instrumentation). Use
    consent-aware real-user Core Web Vitals (LCP, INP, CLS at the 75th percentile on mobile) and Chrome UX Report
    data once eligible. Spot-check on mid-range Android phones on Malaysian mobile networks and on terminal Wi-Fi.
