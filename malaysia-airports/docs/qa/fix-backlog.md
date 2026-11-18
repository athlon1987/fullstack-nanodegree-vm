# Fix backlog: consolidated QA and panel findings

Date: 18 November 2026. Owner: head of product quality. Built from the findings JSON of the eight evaluations that finished today (performance, accessibility, usability, content integrity, security, and the three review panels) plus the earlier documentation review (`docs/qa/docs-review.json`, whose 14 findings were re-checked against `src/` and are all still open). Machine-readable version: [`fix-backlog.json`](fix-backlog.json). The panel's consolidated verdict is in [`panel/panel-summary.md`](panel/panel-summary.md).

Nothing in `src/` or the configuration was changed to produce this backlog.

## Summary

164 source findings were merged into **105 backlog items** in **5 work packages** with disjoint file ownership.

| Evaluation | File | Findings | Critical | High | Medium | Low |
|---|---|---|---|---|---|---|
| Performance | `docs/qa/performance.json` | 16 | 0 | 6 | 7 | 3 |
| Accessibility | `docs/qa/accessibility.json` | 15 | 0 | 4 | 4 | 7 |
| Usability | `docs/qa/usability.json` | 25 | 0 | 7 | 10 | 8 |
| Content integrity | `docs/qa/content-integrity.json` | 13 | 0 | 4 | 6 | 3 |
| Security | `docs/qa/security.json` | 17 | 0 | 2 | 6 | 9 |
| Panel: executive and commerce | `docs/qa/panel/exec-commerce.json` | 20 | 0 | 5 | 9 | 6 |
| Panel: first-time traveller and accessibility | `docs/qa/panel/first-time-access.json` | 21 | 0 | 3 | 11 | 7 |
| Panel: design director and frequent traveller | `docs/qa/panel/ux-frequent.json` | 23 | 0 | 7 | 11 | 5 |
| Documentation review (earlier, from writing the sitemap and architecture docs) | `docs/qa/docs-review.json` | 14 | 0 | 1 | 6 | 7 |
| **All sources** | | **164** | **0** | **39** | **70** | **55** |

Merged items by severity and priority:

| Severity | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| critical | 6 | 0 | 0 | 6 |
| high | 29 | 0 | 1 | 30 |
| medium | 13 | 32 | 1 | 46 |
| low | 0 | 21 | 2 | 23 |
| **Total** | **48** | **53** | **4** | **105** |

By package:

| Package | Items | P0 | P1 | P2 | Critical | High | Medium | Low |
|---|---|---|---|---|---|---|---|---|
| [A. Shell, home, search and design system](#package-a) | 31 | 14 | 17 | 0 | 3 | 8 | 14 | 6 |
| [B. Flights, journey and concierge](#package-b) | 21 | 14 | 7 | 0 | 1 | 10 | 7 | 3 |
| [C. Airport sections: map, facilities, transport, parking, transit, lounges, shop and dine](#package-c) | 11 | 5 | 5 | 1 | 1 | 3 | 6 | 1 |
| [D. Content, copy, guides, help and corporate](#package-d) | 17 | 7 | 8 | 2 | 0 | 5 | 7 | 5 |
| [E. Platform, performance and security](#package-e) | 25 | 8 | 16 | 1 | 1 | 4 | 12 | 8 |

**Critical items (6).** No single evaluation rated anything critical. These are high-rated defects that three or more evaluations found independently, so the corroboration rule raised them:

- **A-01** About 440 px of airport chrome pushes every task answer below the first phone screen (usability-06, exec-commerce-08, ux-frequent-07)
- **A-02** Header airport switcher fails Label in Name (WCAG 2.5.3, Level A) on every airport page (accessibility-02, first-time-access-06, ux-frequent-06)
- **A-03** The home's main search is flights-only: topic queries dead-end and Enter does nothing (usability-03, ux-frequent-05, first-time-access-17)
- **B-01** No operational status layer or queue times (Aerotrain, inter-terminal link, immigration); notices need a deploy (exec-commerce-04, usability-11, docs-14)
- **C-01** Parking is not price-first, the Terminal 1 car park has no price, and the booking hand-off carries no dates (exec-commerce-02, ux-frequent-14, usability-19)
- **E-01** Mobile performance below target on every page (Lighthouse 56 to 92, TBT up to 2 s); budgets not enforced (performance-01, performance-15, exec-commerce-19, ux-frequent-17)

**Before any public pilot** all 48 P0 items must be closed. 4 items and the deferred parts of 12 others need MAHB data or partners and are out of scope for this round; 12 of the 15 out-of-scope entries are still gates for **public launch** (see [Out of scope](#out-of-scope-for-this-round)).

## How findings were merged and ranked

- **Merging.** Findings that describe the same defect (same page and element, or the same root cause and fix) are merged into one item; evidence from every source is kept, with source ids. Where one source finding bundled several root causes in different packages, it was assigned to the package that owns its main fix, and the other parts are hand-offs or dependencies. Every source finding appears in exactly one item (see [Traceability](#traceability)).
- **Severity.** Highest source rating; raised one level when three or more independent evaluations found the defect (so high becomes critical); a low raised to medium when two evaluations found it. No evaluator rated anything critical on its own. Severity follows the brief: critical blocks a critical task or is unsafe; high is major friction or a WCAG A/AA failure with real user impact.
- **Priority.** P0 = critical or high; or named by at least two of the three panels (findings, ranked weaknesses or must-fix lists); or on the security evaluator's fix-before-production list; or a dependency of a P0 item. P1 = every other in-repo fix. P2 = needs MAHB data or partners; out of scope this round, with the reason. The security evaluator's list (security-01, -02, -03, -05, -06, -08) is included because a public pilot is production exposure.
- **Ownership.** Each file has exactly one owning package (longest owned prefix wins). An item lists only files its package owns; changes needed in another package's files are listed as hand-offs. Every file under `src/`, `e2e/`, `scripts/` and `public/` and every root config file was checked to have exactly one owner.
- **Parallel-work conventions.** New interface strings go in the package's own feature dictionary (`src/lib/i18n/features/*.ts`), never in another package's file; `en.ts` and `ms.ts` belong to package A. Each package owns its own e2e spec; package E publishes the shared axe tag list in `e2e/support/axe.ts`, and each package switches its spec to it. Content facts are added only by package D; other packages read them.

## Packages and file ownership

| Package | Scope | Owned paths |
|---|---|---|
| A. Shell, home, search and design system | Header, navigation, airport chrome, home page, home and site search, shared common and UI components, tokens, fonts and the core English and Malay dictionaries. | 29 entries (listed in the package section) |
| B. Flights, journey and concierge | Flight board and flight pages, journey timeline and My journey, flight and operations providers, time utilities, concierge understanding and answers. | 20 entries (listed in the package section) |
| C. Airport sections: map, facilities, transport, parking, transit, lounges, shop and dine | Every airport section page except flights and the overview, their components and logic, the transit planner and the shared section-page helper. | 29 entries (listed in the package section) |
| D. Content, copy, guides, help and corporate | The sourced content layer (all records, sources, provenance rules and content tests), guides, help, the accessibility hub, notices, corporate pages and their dictionaries. | 16 entries (listed in the package section) |
| E. Platform, performance and security | Root layout and streaming, API routes, proxy and headers, SEO, storage layer, i18n runtime, service worker, concierge server security, CI, budgets, dependencies and engineering docs. | 57 entries (listed in the package section) |

<a id="package-a"></a>

## Package A. Shell, home, search and design system

Header, navigation, airport chrome, home page, home and site search, shared common and UI components, tokens, fonts and the core English and Malay dictionaries.

31 items: 14 P0, 17 P1, 0 P2 (3 critical, 8 high, 14 medium, 6 low).

**Owned files**

- `src/components/shell/`
- `src/components/home/`
- `src/components/search/`
- `src/components/ui/`
- `src/components/common/`
- `src/components/airport/` (except `src/components/airport/section-page.ts`, package C)
- `src/components/design-system/`
- `src/components/art/`
- `src/components/flights/flight-search-box.tsx`
- `src/app/[lang]/page.tsx`
- `src/app/[lang]/[airport]/page.tsx`
- `src/app/[lang]/[airport]/layout.tsx`
- `src/app/[lang]/search/`
- `src/app/[lang]/airports/`
- `src/app/[lang]/design-system/`
- `src/app/globals.css`
- `src/fonts/`
- `src/lib/search/`
- `src/lib/i18n/en.ts`
- `src/lib/i18n/ms.ts`
- `src/lib/hooks/use-airport-context.ts`
- `src/lib/hooks/use-journey-mode.ts`
- `src/lib/format.ts`
- `src/lib/format.test.ts`
- `src/lib/cn.ts`
- `scripts/design-tokens.mjs`
- `docs/design/`
- `e2e/smoke.spec.ts`
- `e2e/shell.spec.ts`

| ID | Severity | Priority | Finding | Sources |
|---|---|---|---|---|
| [A-01](#a-01) | critical | P0 | About 440 px of airport chrome pushes every task answer below the first phone screen | usability-06, exec-commerce-08, ux-frequent-07 |
| [A-02](#a-02) | critical | P0 | Header airport switcher fails Label in Name (WCAG 2.5.3, Level A) on every airport page | accessibility-02, first-time-access-06, ux-frequent-06 |
| [A-03](#a-03) | critical | P0 | The home's main search is flights-only: topic queries dead-end and Enter does nothing | usability-03, ux-frequent-05, first-time-access-17 |
| [A-04](#a-04) | high | P0 | Demo label out of view on phone board previews and search results; the full demo banner crowds flight first screens | content-integrity-02, usability-18 |
| [A-05](#a-05) | high | P0 | Focus falls to &lt;body&gt; after following an in-page link; the next Tab jumps to the footer (WCAG 2.4.3) | accessibility-01 |
| [A-06](#a-06) | high | P0 | Search palette: active option marked only by a 1.03:1 to 1.22:1 tint, and the text field has no focus ring | accessibility-04, accessibility-11 |
| [A-07](#a-07) | high | P0 | Home tiles and navigation silently fall back to the airport overview when a section is missing | usability-02 |
| [A-08](#a-08) | high | P0 | The home page ignores the visitor's saved flight | ux-frequent-02 |
| [A-09](#a-09) | high | P0 | Home hydration blocks the main thread for 1.4 to 2.0 s; early taps are lost and switcher and mode taps exceed 200 ms | performance-03, performance-14, first-time-access-11 |
| [A-10](#a-10) | high | P0 | Display font not preloaded: the Malay h1 rewraps (CLS 0.16) and home fonts weigh 206 KB | performance-05, performance-10 |
| [A-11](#a-11) | high | P0 | Fixed header, bottom bar and floating search button cover content at large text and on the home first screen | accessibility-09, first-time-access-12, ux-frequent-18 |
| [A-12](#a-12) | medium | P0 | Site search vocabulary and ranking: "fast track", "lift", "buggy", "troli" and "tukar wang" return nothing; news outranks facilities | docs-05, first-time-access-13 |
| [A-13](#a-13) | medium | P0 | Section tab strips are clipped mid-word with no overflow cue; Malay tab-bar labels crowd | exec-commerce-15, ux-frequent-16, ux-frequent-22 |
| [A-14](#a-14) | medium | P0 | Provenance chips and micro-labels compete with the answers; tag names are inconsistent | usability-17, ux-frequent-15 |
| [A-15](#a-15) | medium | P1 | Assistance is not in the desktop header | usability-08, first-time-access-19 |
| [A-16](#a-16) | medium | P1 | Large in-app text clips content and adds sideways scrolling at 320 px | accessibility-08, first-time-access-08 |
| [A-17](#a-17) | medium | P1 | Overlapping controls on the home first screen | usability-14, ux-frequent-19 |
| [A-18](#a-18) | medium | P1 | Arriving mode does not add the entry checklist (MDAC) to the home | usability-24 |
| [A-19](#a-19) | medium | P1 | Viewport prefetching costs 40 to 125 KB per mobile load and 235 KB on the desktop board | performance-13 |
| [A-20](#a-20) | medium | P1 | The KLIA overview buries the operational notice and leads its board preview with gate-closed flights | ux-frequent-23 |
| [A-21](#a-21) | medium | P1 | One destination, many labels (transport, shop and dine, lounges, facilities) | usability-15 |
| [A-22](#a-22) | medium | P1 | Focus ring invisible on the yellow demo banner in dark themes (WCAG 1.4.11) | accessibility-07 |
| [A-23](#a-23) | medium | P1 | Single-key "/" shortcut cannot be turned off (WCAG 2.1.4) | accessibility-05 |
| [A-24](#a-24) | medium | P1 | English citation titles on Malay pages lack lang="en"; the translation notice never shows (WCAG 3.1.2) | accessibility-12, content-integrity-10 |
| [A-25](#a-25) | medium | P1 | Malay wording to review: "pelepasan", untranslated "Lounge", three names for the concierge | first-time-access-16, docs-09 |
| [A-26](#a-26) | low | P1 | The 39-airport chooser interrupts five tasks and does not pin KLIA | usability-20 |
| [A-27](#a-27) | low | P1 | Home flight-preview links are 26 px tall (product goal 44 px) | first-time-access-21 |
| [A-28](#a-28) | low | P1 | Grammar and wording errors in demo, concierge and parking copy | usability-16 |
| [A-29](#a-29) | low | P1 | Home shop and dine filters are lost after choosing an airport | docs-04 |
| [A-30](#a-30) | low | P1 | Breadcrumb structured data helper is unused | docs-08 |
| [A-31](#a-31) | low | P1 | The lang cookie is set without Secure | security-13 |

<a id="a-01"></a>

### A-01. About 440 px of airport chrome pushes every task answer below the first phone screen

- **Severity:** critical (raised from high: found independently by 3 evaluations). **Priority:** P0 (critical severity).
- **Sources:** usability-06 (high), exec-commerce-08 (medium), ux-frequent-07 (high). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** h1 at 440 px on the flight, transport, parking, facilities, map and transit pages at 390x844 and 390x664 (414 px on the board, 466 px on parking at 360, 516 px on the Malay flight page at 360). Answers: gate 1,306 px, first board row 1,173-1,185 px, KLIA Ekspres fare 1,312-1,500 px, parking quick-stay 2,029 px. The chrome is the concept banner, header, airport banner with clock, three terminal chips, a 9-tab strip and a breadcrumb (usability-06, exec-commerce-08, ux-frequent-07). Strategy principles 1 and 3 require the answer in the first screen at 360x800. First-time-access Q10 #3 asks for the same compact header.
- **Acceptance:** On every airport sub-page (board, flight, transport, parking, facilities, map, transit, lounges, shop and dine) at 360x800, 390x664 and 390x844, English and Malay: the airport header collapses to one row of at most 56 px (code, terminal, clock and sections behind one control); the h1 starts at or above 200 px at 100% text and is never under the fixed bottom bar at 125% text; the first board row is inside the first 664 px; the full airport banner remains only on the overview. A Playwright first-screen test asserting these positions runs in CI.
- **Files:** `src/components/airport/airport-header.tsx`, `src/components/airport/section-nav.tsx`, `src/app/[lang]/[airport]/layout.tsx`, `src/components/common/breadcrumbs.tsx`, `src/components/shell/site-header.tsx`, `e2e/shell.spec.ts` (new)

<a id="a-02"></a>

### A-02. Header airport switcher fails Label in Name (WCAG 2.5.3, Level A) on every airport page

- **Severity:** critical (raised from high: found independently by 3 evaluations). **Priority:** P0 (critical severity).
- **Sources:** accessibility-02 (high), first-time-access-06 (medium), ux-frequent-06 (high). **Panels naming it:** first-time-access, ux-frequent.
- **Evidence:** Visible text "KUL" (plus the "T1" badge) but aria-label "Change airport. Currently KLIA Terminal 1" (src/components/shell/airport-switcher.tsx:97, src/lib/i18n/en.ts:722). axe label-content-name-mismatch on every airport page in light, dark, both high-contrast themes and 125% text, English and Malay, at 1440, 390 and 360 px; also on /ms/concierge and /en/corporate/news once an airport is chosen; Lighthouse lists it on the board, flight and transport pages. The suite reported 0 violations because AXE_TAGS omit wcag21a (e2e/platform.spec.ts:13, e2e/guides.spec.ts:11).
- **Acceptance:** The accessible name begins with the visible text in both languages (for example "KUL T1, change airport (currently KLIA Terminal 1)"), or aria-label is removed in favour of the visible text plus a visually hidden suffix. axe with wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa plus the label-content-name-mismatch rule reports 0 violations on /en/kul, /en/kul/flights, /ms/kul/map and /en/concierge with an airport chosen; this package's specs import the shared tag list from E (CI item).
- **Files:** `src/components/shell/airport-switcher.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`, `e2e/smoke.spec.ts`
- **Depends on:** [E-06](#e-06)
- **Hand-offs to other packages:** B, C, D: replace the local AXE_TAGS constant in e2e/flights.spec.ts, concierge.spec.ts, map.spec.ts, transport.spec.ts, commerce.spec.ts, guides.spec.ts and corporate.spec.ts with the shared list from e2e/support/axe.ts (one line each).

<a id="a-03"></a>

### A-03. The home's main search is flights-only: topic queries dead-end and Enter does nothing

- **Severity:** critical (raised from high: found independently by 3 evaluations). **Priority:** P0 (critical severity).
- **Sources:** usability-03 (high), ux-frequent-05 (high), first-time-access-17 (low). **Panels naming it:** first-time-access, ux-frequent.
- **Evidence:** "arrival card", "parking", "lounge" and "fast track" in the home field give "0 flights found" with no route to site search, and Enter stays on /en (usability-03, ux-frequent-05); site search returns 14 parking and 10 lounge results for the same words. Typing "MH2072" and pressing Enter leaves the URL at /ms because onSubmit prevents navigation (src/components/flights/flight-search-box.tsx:162), so nothing visibly happens for a sighted user (first-time-access-17). BR-19 requires one search for flights, facilities, services and pages.
- **Acceptance:** In the home and overview search: a query with no flight match shows the top three site-search entities inline plus "See all results for &lt;query&gt;" linking to /&lt;lang&gt;/search?q=; Enter on a single exact flight-number match opens that flight; Enter otherwise opens /&lt;lang&gt;/search?q=&lt;query&gt;; flights stay first when both match; the live-region announcement is kept. e2e covers "parking", "arrival card", "MH2072" and "KUL-PEN" in English and Malay.
- **Files:** `src/components/flights/flight-search-box.tsx`, `src/lib/search/engine.ts`, `src/lib/search/documents.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`, `e2e/shell.spec.ts` (new)

<a id="a-04"></a>

### A-04. Demo label out of view on phone board previews and search results; the full demo banner crowds flight first screens

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** content-integrity-02 (high), usability-18 (low).
- **Evidence:** Phone 390x844: home board preview 6 of 8 rows with no demonstration label in view (/ms the same), /en/kul overview preview 4 of 6, /en/search?q=MH and ?q=AK 4 of 8 flight results; desktop passes (content-integrity-02). Conversely the full striped banner takes about 200 px between the flight h1 and "Flight status" on the phone (usability-18). Build spec rule 1: a demonstration label is visible wherever a flight row, gate or status appears.
- **Acceptance:** A compact demo tag component (one line, at most 24 px, visible text "Demo", accessible name "Demonstration data") exists in src/components/common and is used on every preview row or group header at narrow widths; the in-view check (each demo row scrolled to the viewport centre, visible demo markers counted) reports 100% of rows labelled on /en, /ms, /en/kul and /en/search?q=MH at 390x844 and 1280x900; the full banner appears at most once per page and is no taller than 48 px on flight surfaces; the in-view check runs in CI.
- **Files:** `src/components/common/demo-data-banner.tsx`, `src/components/common/demo-tag.tsx` (new), `src/components/home/board-preview.tsx`, `src/components/search/search-results.tsx`, `e2e/shell.spec.ts` (new)

<a id="a-05"></a>

### A-05. Focus falls to &lt;body&gt; after following an in-page link; the next Tab jumps to the footer (WCAG 2.4.3)

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** accessibility-01 (high). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** Keyboard only at 1280x800: after Enter on a link inside main, document.activeElement is BODY and the first Tab focuses the footer link "Malaysia Airports home" at scrollY 997; reproduced on 3 navigations (home to flight, home to map, guides to journey). Links in persistent navigation keep focus. All three panels list it as open (exec and ux nav scorecards; first-time-access Q10 must-fix #4).
- **Acceptance:** After any client-side navigation that changes the pathname (not the query alone), focus moves to the new page's h1 (tabindex=-1) or main, the route announcer still announces the title, and the next Tab reaches the first interactive element after the h1. An e2e test asserts document.activeElement after the three navigations above.
- **Files:** `src/components/shell/shell-context.tsx`, `src/components/shell/route-focus.tsx` (new), `src/components/common/page-header.tsx`, `e2e/shell.spec.ts` (new)

<a id="a-06"></a>

### A-06. Search palette: active option marked only by a 1.03:1 to 1.22:1 tint, and the text field has no focus ring

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** accessibility-04 (high), accessibility-11 (low).
- **Evidence:** aria-selected background #e7e8f4 on #ffffff = 1.22:1 (light and light high contrast) and #20245a on #1f2350 = 1.03:1 (dark); no outline, bar or icon; DOM focus stays in the combobox (src/components/search/command-palette.tsx:43). The palette combobox has outline none and no wrapper ring, unlike the home and board search fields (WCAG 1.4.11, 2.4.7).
- **Acceptance:** The active option differs from its neighbours by at least 3:1 in light, dark, light HC and dark HC (focus-colour outline or a 4 px inset bar alongside the tint), and the input wrapper shows the standard focus ring; contrast measured by script in all four themes.
- **Files:** `src/components/search/command-palette.tsx`

<a id="a-07"></a>

### A-07. Home tiles and navigation silently fall back to the airport overview when a section is missing

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** usability-02 (high).
- **Evidence:** After choosing Subang, the home tiles "Getting to the airport", "Parking", "Terminal maps", "Lounges" and "Food and shops" all link to /en/szb, whose overview never mentions parking; szb, kch and lgk return 404 for parking, transport, lounges, shop-dine and facilities. sectionHref() replaces any unavailable section with "overview" without telling the user (src/components/shell/sections.ts).
- **Acceptance:** When hasSection() is false the tile and primary-nav item stay visible but read "&lt;section&gt;: not published for &lt;airport&gt;" and lead to an honest state with the official page and phone (or are hidden with a one-line note); no tile or nav item named after a section lands on the overview; a unit test covers 39 airports x 9 sections.
- **Files:** `src/components/shell/sections.ts`, `src/components/shell/primary-nav.tsx`, `src/components/home/mode-quick-actions.tsx`, `src/components/common/quick-action.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`

<a id="a-08"></a>

### A-08. The home page ignores the visitor's saved flight

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** ux-frequent-02 (high). **Panels naming it:** ux-frequent.
- **Evidence:** After saving MH 2630 (localStorage ma:journey:v1 holds it and /en/journey lists it), "MH 2630" appears nowhere in /en main: the teaser still says "Save a flight and we build a timeline" with a sample flight ("Be at the airport by 17:30") and the board preview stays network-wide; only the tab-bar Journey badge shows "1". journey-teaser.tsx always picks a sample flight from the demo provider.
- **Acceptance:** With a saved flight for today or later, /en and /ms show that flight's live card (status, terminal, gate, next timeline step, arrive-by) above the journey modes in the first phone screen at 390x844, with 0 interactions; with none saved the sample teaser shows as now; the server HTML reserves the card's height so CLS on /en stays at or under 0.05 after hydration.
- **Files:** `src/components/home/journey-teaser.tsx`, `src/components/home/home-sections.tsx`, `e2e/shell.spec.ts` (new)
- **Depends on:** [B-02](#b-02)

<a id="a-09"></a>

### A-09. Home hydration blocks the main thread for 1.4 to 2.0 s; early taps are lost and switcher and mode taps exceed 200 ms

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** performance-03 (high), performance-14 (low), first-time-access-11 (medium). **Panels naming it:** first-time-access.
- **Evidence:** Lighthouse mobile TBT 1,391 ms (/en) and 1,978 ms (/ms), longest task 1,202 and 1,419 ms; 653 ms self time in zonedParts (src/lib/time.ts) called by DemoFlightProvider during React render because the home search box builds a pool for every demo airport before anyone types. After hydration at 4x CPU: journey-mode switch 392-520 ms, home airport switcher open 320-408 ms, /en/kul switcher 224-304 ms, /en/journey direction switch 208-216 ms. Taps 300-600 ms after DOMContentLoaded took 1,280-1,472 ms and 3 of 6 earlier taps did not change the radio (performance-03, performance-14). First-time-access measured /ms TBT 1,434 ms and a 0.158 shift on a throttled mid-range profile (first-time-access-11; the shift is tracked under the font item).
- **Acceptance:** On a 4x-throttled mobile profile: /en and /ms TBT at or under 200 ms (median of 3 Lighthouse runs); no flight pool is built during render (built lazily on first focus or keystroke inside startTransition, or served from the server); the journey-mode switch, airport-switcher open and close (home and /en/kul) and the journey direction switch each respond within 200 ms (Event Timing, 3 runs); 6 of 6 taps made 0 to 600 ms after DOMContentLoaded take effect.
- **Files:** `src/components/flights/flight-search-box.tsx`, `src/components/home/journey-modes.tsx`, `src/components/home/board-preview.tsx`, `src/components/home/home-sections.tsx`, `src/components/shell/airport-switcher.tsx`, `src/app/[lang]/page.tsx`
- **Depends on:** [B-06](#b-06)

<a id="a-10"></a>

### A-10. Display font not preloaded: the Malay h1 rewraps (CLS 0.16) and home fonts weigh 206 KB

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** performance-05 (high), performance-10 (medium). **Panels naming it:** first-time-access.
- **Evidence:** Lighthouse mobile CLS 0.161 on /ms in 3 of 3 runs; Playwright 0.154-0.158: the search card and the content below move up 27 px (mobile) or 56 px (desktop) at 242-277 ms, right after Fraunces loads; the Malay h1 is 2 lines in the fallback face and 1 line in Fraunces. Fraunces is declared with preload: false (src/fonts/index.ts lines 24 and 45). Home fonts 206 KB against a 150 KB budget (Fraunces 67 KB, Fraunces italic 81 KB for "beautifully connected." only, Geist Mono 24 KB on every page); on congested Wi-Fi Fraunces starts at 2.4 s and LCP is 2.9 s. First-time-access measured the same 0.158 shift (first-time-access-11).
- **Acceptance:** CLS at or under 0.05 on /ms and /en, mobile and desktop, in 3 runs with fonts loading normally and with Fraunces blocked; Fraunces upright preloaded on pages whose h1 uses it; fallback metrics (size-adjust, ascent-override) tuned so the Malay h1 wraps the same in both faces; the italic file dropped or subset to the glyphs used; home fonts at or under 150 KB; Geist Mono loaded only where tabular data is above the fold.
- **Files:** `src/fonts/index.ts`, `src/components/home/home-sections.tsx`, `src/app/globals.css`

<a id="a-11"></a>

### A-11. Fixed header, bottom bar and floating search button cover content at large text and on the home first screen

- **Severity:** high (raised from medium: found independently by 3 evaluations). **Priority:** P0 (high severity).
- **Sources:** accessibility-09 (low), first-time-access-12 (medium), ux-frequent-18 (low). **Panels naming it:** first-time-access, ux-frequent.
- **Evidence:** 320x256 (400% zoom): sticky header 68 px plus bottom bar 57 px = 125 of 256 px (accessibility-09). 320x568 at 125% text: 85 px plus 71-74 px, 28% of the viewport on every page; at 390 px the round search button overlaps the board intro, the map intro and the accessibility hub's fifth chip (first-time-access-12). On the home first screen at 390 px the raised search button covers the "Lounges" tile label ("Loun...") (ux-frequent-18).
- **Acceptance:** Below 640 px viewport height or at 112-125% text the header hides on scroll down and returns on scroll up, and the bottom bar collapses; page padding-bottom and scroll-padding equal the bar plus the button overhang, so no fixed element covers text or a tappable target (screenshot check at 360, 390 and 430 px at 100% and 125%); at 320x568 with 125% text fixed chrome takes at most 15% of the viewport while content scrolls.
- **Files:** `src/components/shell/site-header.tsx`, `src/components/shell/mobile-bar.tsx`, `src/app/globals.css`, `src/components/home/mode-quick-actions.tsx`

<a id="a-12"></a>

### A-12. Site search vocabulary and ranking: "fast track", "lift", "buggy", "troli" and "tukar wang" return nothing; news outranks facilities

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (a P0 item depends on it (B-08)).
- **Sources:** docs-05 (medium), first-time-access-13 (medium). **Panels naming it:** first-time-access.
- **Evidence:** 0 results for "fast track", "lift", "buggy" (en), "troli" and "tukar wang" (ms); "halal" ranks unrelated help answers above the halal outlet; "hearing loop" returns the inter-terminal shuttle and Kota Kinabalu buses; "accessible parking" ranks Penang standard parking first; "surau" ranks a solar-farm news item second (docs-05, first-time-access-13). "AirAsia" returns flight rows with no airline entity (usability-13, tracked in the concierge item).
- **Acceptance:** A bilingual synonym table (lift/lif/elevator, buggy, troli, pengurup wang/tukar wang, fast track/laluan pantas/priority lane, surau/prayer room, halal) and type boosts that demote news for facility-type queries; map places (lifts, information counters) and airline entities (airline, KLIA terminal, provenance) indexed; an explicit "Not published" result for known unpublished topics (accessible parking, hearing loops); src/lib/search/search.test.ts asserts the first result for at least 15 listed queries, including "fast track" once the Fast Track record exists.
- **Files:** `src/lib/search/documents.ts`, `src/lib/search/engine.ts`, `src/lib/search/search.test.ts`, `src/components/search/search-results.tsx`
- **Depends on:** [D-02](#d-02)

<a id="a-13"></a>

### A-13. Section tab strips are clipped mid-word with no overflow cue; Malay tab-bar labels crowd

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (named by 2 of 3 panels).
- **Sources:** exec-commerce-15 (low), ux-frequent-16 (medium), ux-frequent-22 (low). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** "KLIA sections" nav: scrollWidth 1,347 px in a 1,240 px container at 1280, 1440 and 1920 px; "Connections anc" cut at the right on the flight page and "rview" at the left on shop and dine; overflow-x auto with no mask or buttons. At 360 px in Malay the strip opens scrolled so the first label reads "ran keseluruhan". Bottom-bar labels "Laman utama" and "Penerbangan" run together at 390 px (dark) and wrap at 360 px.
- **Acceptance:** At 1280, 1440 and 1920 px all section tabs fit, or overflow is signalled with an edge fade and scroll buttons; no tab label is clipped mid-word at any width from 320 to 1920 px in either language (active tab scrolled into view with inline padding); Malay bottom-bar labels fit on one line with a visible gap at 360 px; screenshot test at 360, 390, 1280 and 1440 px.
- **Files:** `src/components/airport/section-nav.tsx`, `src/components/shell/sections.ts`, `src/components/shell/mobile-bar.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`

<a id="a-14"></a>

### A-14. Provenance chips and micro-labels compete with the answers; tag names are inconsistent

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (named by 2 of 3 panels).
- **Sources:** usability-17 (medium), ux-frequent-15 (medium). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** Phone: Facilities 17.5 screens with about 21 provenance tags, 21 "N sources" toggles and 27 "Not published/not verified" mentions; Transport 13.2 screens with 22 not-verified mentions; Map about 24 tags and 18 demo labels; tag names vary ("Official instruction"/"Official", "Estimated guidance"/"Estimated") and "Official instruction" is applied to facts (usability-17). Home: 78 upper-case micro-labels, 86 monospaced runs, 13 font sizes; Transport 64 upper-case labels (ux-frequent-15). Exec panel Q3: every card carries badges, which "reads as an information system rather than a premium brand".
- **Acceptance:** One tag set in both languages (Official, Estimated, Suggestion, Demo, Not published) with "instruction" reserved for rules; per-fact sources behind a small marker that opens a popover; unpublished fields grouped into one muted line per card; at most 8 type sizes on any page; mono capitals limited to data labels in the flight card and board; re-running the DOM count script at 390 px shows at least 40% fewer chips on Facilities and Transport than the counts above.
- **Files:** `src/components/common/provenance-tag.tsx`, `src/components/common/provenance-legend.tsx`, `src/components/common/source-note.tsx`, `src/components/common/not-published.tsx`, `src/components/ui/badge.tsx`, `src/app/globals.css`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`, `docs/design/design-system.md`
- **Hand-offs to other packages:** C: adopt the grouped "Not published" line in facility, lounge, outlet and car-park cards. D: retag content records where "instruction" is used for facts.

<a id="a-15"></a>

### A-15. Assistance is not in the desktop header

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** usability-08 (medium), first-time-access-19 (low). **Panels naming it:** first-time-access.
- **Evidence:** Desktop header: Flights, Plan your journey, At the airport, Shop &amp; dine, Transport &amp; parking, Help, plus icon buttons. /accessibility is linked only from the footer (site-footer.tsx:78, 95) and the phone Menu (panels.tsx:84). P4-T1 desktop went through Help; P6-T1 needed site search ("autism"). Strategy 4.2 and BR-18: assistance in the header, one interaction from any page.
- **Acceptance:** "Assistance" is a labelled link to /&lt;lang&gt;/accessibility in the desktop header (primary nav or top bar beside Display settings) and in the first group of the phone Menu, in both languages; e2e asserts it at 1280 and 390 px.
- **Files:** `src/components/shell/sections.ts`, `src/components/shell/site-header.tsx`, `src/components/shell/primary-nav.tsx`, `src/components/shell/panels.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`

<a id="a-16"></a>

### A-16. Large in-app text clips content and adds sideways scrolling at 320 px

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** accessibility-08 (medium), first-time-access-08 (medium). **Panels naming it:** first-time-access.
- **Evidence:** 320x640 at 125% text: home network cards clip 34-55 px (IATA badges cut off), the header "Choose airport" label spills out of its button, /en/kul/transport scrolls 30 px and /en/help 15 px sideways (accessibility-08). 320x568 at 125% text with high contrast: transport scrollWidth 350 px against 320 px; the overflowing elements are provenance tags with shrink-0 and whitespace-nowrap (first-time-access-08).
- **Acceptance:** At 320 px width with in-app text 112% and 125% (light, dark, high contrast), document scrollWidth equals clientWidth on the 15 key pages including /en/kul/transport and /en/help, and no text is clipped (cards and badges wrap; provenance tags wrap or truncate with a full accessible name); the e2e reflow check covers 320 px at 125%.
- **Files:** `src/components/common/provenance-tag.tsx`, `src/components/home/home-sections.tsx`, `src/components/shell/airport-switcher.tsx`, `e2e/shell.spec.ts` (new)
- **Hand-offs to other packages:** C: confirm transport-planner.tsx has no fixed widths once the tag wraps.

<a id="a-17"></a>

### A-17. Overlapping controls on the home first screen

- **Severity:** medium (raised from low: found independently by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** usability-14 (low), ux-frequent-19 (low). **Panels naming it:** ux-frequent.
- **Evidence:** "Departures | Arrivals" (search scope) sits directly above "Departing | Arriving | Transiting | Meeting someone" (journey mode), and choosing Arriving or Meeting also flips the scope (usability-14). "Choose airport" appears in the header and again in the search card; desktop shows a "Getting to the airport" tile and a same-named card in the notice row (ux-frequent-19).
- **Acceptance:** Journey mode drives the search direction (Departing gives departures; Arriving and Meeting give arrivals) with at most a small "Search departures instead" link; the airport chooser appears once on the home first screen; no two adjacent controls or cards share a label.
- **Files:** `src/components/home/journey-modes.tsx`, `src/components/flights/flight-search-box.tsx`, `src/components/home/home-sections.tsx`

<a id="a-18"></a>

### A-18. Arriving mode does not add the entry checklist (MDAC) to the home

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** usability-24 (medium).
- **Evidence:** With Arriving selected the home h2s are Operational notice, Arrivals, Your journey step by step, One network 39 airports, Find something good, Ask in your own words; "Malaysia Digital Arrival Card" appears nowhere (string search), although the rule exists in the Arriving guide and on arrival flight pages.
- **Acceptance:** In Arriving mode the home shows a "Before you land" card (MDAC within three days, free on the official portal) read from the guide record with its source and as-of date and a link to the Arriving guide, in both languages; no fact is copied into interface strings.
- **Files:** `src/components/home/home-sections.tsx`, `src/components/home/journey-actions.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`

<a id="a-19"></a>

### A-19. Viewport prefetching costs 40 to 125 KB per mobile load and 235 KB on the desktop board

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** performance-13 (medium).
- **Evidence:** 8 to 24 RSC prefetches per mobile page load (40 KB on journey to 125 KB on /en/kul) plus the linked routes' JavaScript (transferred JS 322-426 KB against 250-275 KB first-load); desktop /en 25 prefetches (159 KB), /en/kul/flights 39 prefetches (235 KB) and 35 script files. These requests push 11 of 15 pages over the 40-request budget.
- **Acceptance:** Prefetch only on likely next steps (board, flight, journey); prefetch={false} on footer, mega-menu and long lists, or prefetch on hover/touchstart; no prefetch when navigator.connection.saveData is true or effectiveType is 2g or 3g; at most 5 RSC prefetches per mobile load on the 15 measured pages and under 60 KB of prefetch on the desktop board.
- **Files:** `src/components/common/locale-link.tsx`, `src/components/shell/site-footer.tsx`, `src/components/shell/primary-nav.tsx`, `src/components/shell/panels.tsx`

<a id="a-20"></a>

### A-20. The KLIA overview buries the operational notice and leads its board preview with gate-closed flights

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** ux-frequent-23 (medium). **Panels naming it:** ux-frequent.
- **Evidence:** Phone 390: the Aerotrain night-closure notice is at 2,270 px on /en/kul although the network home shows it near the top. Desktop: the "Departures" preview lists 6 flights, 4 of them "Gate closed". BR-08 asks for the notice on the KLIA homepage and affected pages.
- **Acceptance:** Active operational notices render directly under the airport header on /&lt;lang&gt;/&lt;airport&gt; (inside the first 664 px on a phone); board previews start at now + 15 minutes and exclude departed and gate-closed flights (unit test on the preview filter).
- **Files:** `src/app/[lang]/[airport]/page.tsx`, `src/components/home/notice-strip.tsx`, `src/components/home/board-preview.tsx`

<a id="a-21"></a>

### A-21. One destination, many labels (transport, shop and dine, lounges, facilities)

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** usability-15 (medium).
- **Evidence:** Counted in en.ts and features/*.ts: transport has "Getting to the airport", "Getting to and from", "Transport &amp; parking", "Leaving the airport", "Getting to {airport}", "Getting to the terminal"; shop and dine has three variants, lounges four, facilities three. In P2-T1 the tile "Getting to the airport" was the decision point for an arriving visitor.
- **Acceptance:** A glossary fixes one noun per section (for example Transport, Parking, Shops and food, Lounges, Facilities, Terminal map) used by tiles, section tabs, page titles and navigation in both languages, with verbs only in tile subtitles; a unit test fails when nav, tab and page-title labels for a section differ.
- **Files:** `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`, `src/components/shell/sections.ts`
- **Hand-offs to other packages:** C: align page titles in src/lib/i18n/features/transport.ts, commerce.ts and map.ts with the glossary. D: align src/lib/i18n/features/guides.ts.

<a id="a-22"></a>

### A-22. Focus ring invisible on the yellow demo banner in dark themes (WCAG 1.4.11)

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** accessibility-07 (medium).
- **Evidence:** Outline #ff9fdc on banner #ffc233 = 1.16:1 (dark) and #ffc2e9 on #ffc233 = 1.09:1 (dark high contrast); light 4.29:1, light HC 5.87:1 (src/app/globals.css:331, 391, 510).
- **Acceptance:** The focus indicator on the banner link is at least 3:1 against the banner in all four themes (for example --color-focus overridden inside the banner).
- **Files:** `src/components/common/demo-data-banner.tsx`, `src/app/globals.css`

<a id="a-23"></a>

### A-23. Single-key "/" shortcut cannot be turned off (WCAG 2.1.4)

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** accessibility-05 (medium).
- **Evidence:** With focus on body or a link, "/" opens the Search dialog (src/components/shell/global-overlays.tsx:41); Display settings offer theme, text size, high contrast and reduce motion only.
- **Acceptance:** Pressing "/" outside a text field no longer opens search unless single-key shortcuts are switched on; Ctrl/Cmd+K still works. Preferred fix: remove "/" (no storage change). A settings switch needs a field in src/lib/preferences.ts, owned by package E.
- **Files:** `src/components/shell/global-overlays.tsx`, `src/components/shell/preferences-controls.tsx`

<a id="a-24"></a>

### A-24. English citation titles on Malay pages lack lang="en"; the translation notice never shows (WCAG 3.1.2)

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** accessibility-12 (low), content-integrity-10 (medium).
- **Evidence:** 77 of 123 Malay pages show English source titles inside lang="ms" (the Annual Report title on 23 pages; the KLIA Ekspres fare article on /ms/kul and /ms/notices); only 2 blocks on all Malay pages carry lang="en"; the TranslationNotice rendered on 0 Malay pages (content-integrity-10). Measured on /ms/kul/parking (6 titles) and /ms/guides/departing (1) (accessibility-12).
- **Acceptance:** SourceNote wraps source title and publisher in lang="en" unless a Malay title exists; a page with any English citation shows the translation notice once (or a per-citation "EN" marker); a crawl of all /ms pages finds 0 English citation blocks without a lang override.
- **Files:** `src/components/common/source-note.tsx`, `src/components/common/translation-notice.tsx`

<a id="a-25"></a>

### A-25. Malay wording to review: "pelepasan", untranslated "Lounge", three names for the concierge

- **Severity:** medium (raised from low: found independently by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** first-time-access-16 (low), docs-09 (low). **Panels naming it:** first-time-access.
- **Evidence:** Home helper "Mencari pelepasan di 21 lapangan terbang" ("pelepasan" reads as release or discharge); airport tab "Lounge dan hotel" (first-time-access-16). "Konsierj", "Concierge" and "Tanya concierge" all appear (src/lib/i18n/ms.ts lines 163, 438, 450) (docs-09). The accessibility statement says the Malay is a draft awaiting a native editor.
- **Acceptance:** Shell and home Malay copy updated to everyday terms (for example "Mencari penerbangan berlepas di 21 lapangan terbang", "Ruang menunggu (lounge) dan hotel"); one concierge term used in ms.ts and features/concierge.ts; i18n test asserts the single term. Final sign-off by a native editor is OOS-14.
- **Files:** `src/lib/i18n/ms.ts`
- **Hand-offs to other packages:** B: use the chosen concierge term in src/lib/i18n/features/concierge.ts.
- **Deferred (out of scope):** OOS-14 Native-speaker review of the Malay interface and content, and confirmation of official Malay airport names.

<a id="a-26"></a>

### A-26. The 39-airport chooser interrupts five tasks and does not pin KLIA

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** usability-20 (low).
- **Evidence:** With no airport chosen every home tile and primary nav item goes to /airports (P1-T2, P2-T1, P3-T1, P7-T1, P9-T2); on the phone the KLIA links sit at about 1,643-1,767 px below the search, state and type filters, while the home's own dialog lists KLIA T1 and T2 first.
- **Acceptance:** On /&lt;lang&gt;/airports, KLIA Terminal 1, KLIA Terminal 2 and the last-used airport are large buttons above the filters, inside the first phone screen.
- **Files:** `src/components/airport/airport-directory.tsx`

<a id="a-27"></a>

### A-27. Home flight-preview links are 26 px tall (product goal 44 px)

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** first-time-access-21 (low). **Panels naming it:** first-time-access.
- **Evidence:** 360 px at 125% text: 20 visible targets under 44 px on the home; destination links in the flight preview are 26 px tall, terminal shortcuts 30-34 px. They pass WCAG 2.5.8 (24 px) but not BR-17 (44 px).
- **Acceptance:** Each home preview row is a single link at least 44 px tall at 360 px and 125% text; no target in the preview or terminal shortcuts is under 44 px.
- **Files:** `src/components/home/board-preview.tsx`, `src/app/[lang]/page.tsx`

<a id="a-28"></a>

### A-28. Grammar and wording errors in demo, concierge and parking copy

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** usability-16 (low).
- **Evidence:** "These are demonstration flights. Do not use it to plan travel." (flight-search-box.tsx:285 joins flights.search.demoNote and demo.doNotPlan); concierge: "our sources list train between Terminal 1 and Terminal 2 and free shuttle bus between the terminals." (features/concierge.ts:153); parking calculator uses "Arrival date"/"Departure date" for car-park entry and exit; "Calm Room" beside "Calm Room (Terminal 2)".
- **Acceptance:** The demo note reads "These flights are simulated. Do not use them to plan travel." in both languages; the other three strings are fixed by their owners (hand-offs) and a copy re-read of the four surfaces finds no grammatical errors.
- **Files:** `src/components/flights/flight-search-box.tsx`, `src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts`
- **Hand-offs to other packages:** B: rewrite the transfer template in src/lib/i18n/features/concierge.ts with articles. C: "Entry"/"Exit" labels in src/lib/i18n/features/transport.ts (parking calculator). D: rename to "Calm Room (Terminal 1)" in src/content/airports/kul.ts.

<a id="a-29"></a>

### A-29. Home shop and dine filters are lost after choosing an airport

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** docs-04 (low).
- **Evidence:** Filters ticked on the home Shop &amp; dine block are dropped when the visitor then chooses an airport (sitemap.md F4).
- **Acceptance:** Chosen filters are carried as query parameters into /&lt;airport&gt;/shop-dine and applied there; filters that cannot return results are hidden (coordinated with the C retail item).
- **Files:** `src/components/home/shop-dine-strip.tsx`

<a id="a-30"></a>

### A-30. Breadcrumb structured data helper is unused

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** docs-08 (low).
- **Evidence:** src/lib/seo/schemas.ts:89-98 builds a BreadcrumbList matching the visible Breadcrumbs, but no page emits it (sitemap.md F8).
- **Acceptance:** Every page that renders Breadcrumbs emits a matching BreadcrumbList JSON-LD through the existing helper; a test validates /en/kul/parking.
- **Files:** `src/components/common/breadcrumbs.tsx`

<a id="a-31"></a>

### A-31. The lang cookie is set without Secure

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** security-13 (low).
- **Evidence:** language-switch.tsx sets "lang=&lt;lang&gt;; path=/; max-age=31536000; samesite=lax" without Secure; it is the site's only cookie.
- **Acceptance:** The cookie carries Secure when location.protocol is https: (and the __Host- prefix if E updates src/proxy.ts to read the new name).
- **Files:** `src/components/shell/language-switch.tsx`
- **Hand-offs to other packages:** E: read the renamed cookie in src/proxy.ts if the __Host- prefix is adopted.

<a id="package-b"></a>

## Package B. Flights, journey and concierge

Flight board and flight pages, journey timeline and My journey, flight and operations providers, time utilities, concierge understanding and answers.

21 items: 14 P0, 7 P1, 0 P2 (1 critical, 10 high, 7 medium, 3 low).

**Owned files**

- `src/components/flights/` (except `src/components/flights/flight-search-box.tsx`, package A)
- `src/components/concierge/`
- `src/app/[lang]/[airport]/flights/`
- `src/app/[lang]/journey/`
- `src/app/[lang]/concierge/`
- `src/lib/journey/`
- `src/lib/flights/`
- `src/lib/providers/` (except `src/lib/providers/api.ts`, package E; `src/lib/providers/api.test.ts`, package E)
- `src/lib/time.ts`
- `src/lib/time.test.ts`
- `src/lib/time-store.ts`
- `src/lib/hooks/use-flight-provider.ts`
- `src/lib/hooks/use-saved-journey.ts`
- `src/lib/hooks/use-now.ts`
- `src/lib/concierge/` (except `src/lib/concierge/rate-limit.ts`, package E; `src/lib/concierge/rephrase.server.ts`, package E; `src/lib/concierge/fact-guard.ts`, package E; `src/lib/concierge/request.ts`, package E; `src/lib/concierge/server.test.ts`, package E)
- `src/lib/needs.ts`
- `src/lib/i18n/features/flights.ts`
- `src/lib/i18n/features/concierge.ts`
- `e2e/flights.spec.ts`
- `e2e/concierge.spec.ts`

| ID | Severity | Priority | Finding | Sources |
|---|---|---|---|---|
| [B-01](#b-01) | critical | P0 | No operational status layer or queue times (Aerotrain, inter-terminal link, immigration); notices need a deploy | exec-commerce-04, usability-11, docs-14 |
| [B-02](#b-02) | high | P0 | Journey timeline marks the wrong step as "Now": check-in after it closed, boarding on a departed flight | usability-04, ux-frequent-01 |
| [B-03](#b-03) | high | P0 | The phone flight page does not answer first: status under the bottom bar at 125% text and arrive-by on the eighth screen | first-time-access-03, usability-10 |
| [B-04](#b-04) | high | P0 | Flight alerts work only while the page is open, fail silently on iPhone Safari, offer no e-mail and sit eight phone screens down | exec-commerce-13, ux-frequent-03 |
| [B-05](#b-05) | high | P0 | Board rows and flight-detail values (gate, belt, counters) appear with no demonstration label in view | content-integrity-01, content-integrity-03 |
| [B-06](#b-06) | high | P0 | Demo flight generation runs on the main thread during render and on every board keystroke (INP 736 to 832 ms) | performance-02 |
| [B-07](#b-07) | high | P0 | My journey shows a skeleton until hydration, then swaps it: CLS 0.11 to 0.23 and LCP 5.3 to 5.6 s on slow 4G | performance-06 |
| [B-08](#b-08) | high | P0 | Concierge misses direct answers: fares, airline terminal, nearest lounge, Fast Track, duty free, Aerotrain status, accessible qualifiers, autogates, "how early" | ux-frequent-11, exec-commerce-17, first-time-access-09, usability-13, docs-03 |
| [B-09](#b-09) | high | P0 | No feed-failure or last-known-data state; flights are generated in the browser and the official provider is a stub | exec-commerce-03 |
| [B-10](#b-10) | high | P0 | Delayed and cancelled board times rely on strikethrough to show which time is old (WCAG 1.3.1) | accessibility-03 |
| [B-11](#b-11) | high | P0 | Assistance needs can never be set, so no timeline shows the assistance step | first-time-access-01 |
| [B-12](#b-12) | medium | P0 | The status card gives one cabin's check-in row as the flight's, and contradicts the timeline | ux-frequent-08, first-time-access-18 |
| [B-13](#b-13) | medium | P0 | Flight-page links lose the flight's context, and the timeline ignores gate, cabin and dwell time | exec-commerce-07, ux-frequent-13 |
| [B-14](#b-14) | medium | P0 | Flight ids: codeshare URLs return "not found"; unknown ids are rendered per request at full cost | ux-frequent-09, security-05 |
| [B-15](#b-15) | medium | P1 | Concierge: the skeleton-then-consent swap shifts the page, and consent interrupts a tapped suggested question | performance-12, usability-21 |
| [B-16](#b-16) | medium | P1 | Boards open 45 minutes in the past, so departed flights lead | ux-frequent-10 |
| [B-17](#b-17) | medium | P1 | Greeter view leads with long-stay parking and gives no pick-up point | usability-09 |
| [B-18](#b-18) | medium | P1 | Live board auto-updates every 30 seconds with no pause control (WCAG 2.2.2) | accessibility-06 |
| [B-19](#b-19) | low | P1 | Board changes are never announced, even for a saved flight | accessibility-15 |
| [B-20](#b-20) | low | P1 | Concierge question field drops below the fold after an answer while keeping focus | accessibility-14 |
| [B-21](#b-21) | low | P1 | Flight-number h1 in old-style figures; the route is stated three times | ux-frequent-20 |

<a id="b-01"></a>

### B-01. No operational status layer or queue times (Aerotrain, inter-terminal link, immigration); notices need a deploy

- **Severity:** critical (raised from high: found independently by 3 evaluations). **Priority:** P0 (critical severity).
- **Sources:** exec-commerce-04 (high), usability-11 (medium), docs-14 (low). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** Nothing on the home, notices, transit or map says whether the Aerotrain, train or shuttle runs now; only a planned-closure notice exists and the transit page states a 10 versus 15 minute shuttle conflict (usability-11). /api/health reports a demo waitTimes provider but no page renders waits; the departing timeline says "allow at least 45 minutes" as static text; notices are TypeScript compiled at build time and architecture.md states "no database and no CMS" (exec-commerce-04, docs-14). BR-08, BR-09; ux-frequent Q10 lists checkpoint queue times as must-have with MAHB data.
- **Acceptance:** In this round: a status-line component (Aerotrain, inter-terminal train, shuttle, immigration) shows state, time and source, fed by current notices until a live feed exists, and says "No disruption reported in our sources as of hh:mm; check the signs" when none applies; it appears in the C-gate and immigration steps of flight timelines and is provided to the home notice strip and KLIA overview (A) and transit (C); demo-labelled security and immigration waits from DemoWaitTimeProvider appear on the flight page and airport overview; tests cover active, upcoming and no-notice states. Live feeds and a CMS with approvals are OOS-02.
- **Files:** `src/components/flights/ops-status.tsx` (new), `src/lib/providers/demo-operations.ts`, `src/lib/journey/index.ts`, `src/components/flights/flight-detail.tsx`, `src/lib/i18n/features/flights.ts`
- **Hand-offs to other packages:** A: render the status line in src/components/home/notice-strip.tsx and src/app/[lang]/[airport]/page.tsx. C: render it in src/components/guides/transit-planner.tsx.
- **Deferred (out of scope):** OOS-02 Live operational status feeds (Aerotrain, inter-terminal train, immigration queues) and a notices CMS with bilingual approvals.

<a id="b-02"></a>

### B-02. Journey timeline marks the wrong step as "Now": check-in after it closed, boarding on a departed flight

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** usability-04 (high), ux-frequent-01 (high). **Panels naming it:** ux-frequent.
- **Evidence:** At 18:10 MYT MH 2626 shows "Departed, actual 12:00" while its timeline says "Now: 11:15 Board from 11:15 ... be at the gate" (usability-04). At 18:52 MH 2630 reads "Check-in closed" (closed 18:40) but the timeline says "Now: 16:40 Check in and drop your bags"; departed AK 6336 shows "Now: 06:30 Board from 06:30" (ux-frequent-01). Cause: finalise() in src/lib/journey/index.ts (lines 174-186) marks the last step whose start time has passed as current; steps have no end and the flight status is ignored.
- **Acceptance:** Timed steps carry an end (check-in closes, gate closes, actual departure or arrival) and the state is computed from start, end and flight status; after check-in closes the timeline says "Check-in has closed: contact &lt;airline&gt;" (or moves on if the passenger has checked in); departed, landed and cancelled flights show a terminal state and no step tells the passenger to go anywhere; journey.test.ts covers check-in close + 1 min, boarding, departure + 1 min, landed and cancelled for departing and arriving journeys.
- **Files:** `src/lib/journey/index.ts`, `src/lib/journey/journey.test.ts`, `src/components/flights/journey-timeline.tsx`, `src/lib/i18n/features/flights.ts`

<a id="b-03"></a>

### B-03. The phone flight page does not answer first: status under the bottom bar at 125% text and arrive-by on the eighth screen

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** first-time-access-03 (high), usability-10 (medium). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** 360x780, Malay, 125% text: page 13,303 px; h1 "MH 2072 ke London" at 724 px, under the fixed bottom bar; status heading 1,267 px; "Tiba di lapangan terbang sebelum 19:30" 6,010 px; gate 7,961 px; no "leave home by" (first-time-access-03). English at 100%: arrive-by step at 3,448 px on the phone and 2,324 px on desktop; the status panel shows times, terminal and gate but not arrive-by (usability-10). ux-frequent measured the gate at 1,306 px; exec measured the desktop status card at 634 px.
- **Acceptance:** A summary line under the h1 or in the status panel states the next action and time (for example "Be at KLIA T1 by 19:30 (estimate) · Check in Row H · Boarding 21:45") and links to the timeline step; with the compact chrome in place it is inside the first viewport at 360x780 at 100% and 125% text in both languages; an optional "leave home by" uses the chosen transport mode's published journey time when one is chosen; e2e asserts its position.
- **Files:** `src/components/flights/flight-status-hero.tsx`, `src/components/flights/flight-detail.tsx`, `src/components/flights/journey-timeline.tsx`, `src/app/[lang]/[airport]/flights/[flightId]/page.tsx`, `src/lib/i18n/features/flights.ts`, `e2e/flights.spec.ts`
- **Depends on:** [A-01](#a-01)

<a id="b-04"></a>

### B-04. Flight alerts work only while the page is open, fail silently on iPhone Safari, offer no e-mail and sit eight phone screens down

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** exec-commerce-13 (medium), ux-frequent-03 (high). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** On-page copy: "They only arrive while this page is open." With window.Notification absent (iOS Safari outside an installed web app) the panel says "This browser cannot show notifications." and offers nothing else; there is no e-mail or WhatsApp opt-in; the Flight alerts heading is at 5,321 px on a 390 px phone (Save at 1,547 px) (exec-commerce-13, ux-frequent-03). BR-04 is a Must.
- **Acceptance:** In this round: one "Follow this flight" control sits next to Save in the status card; where the Notification API is missing (including iOS Safari outside an installed web app) it offers e-mail follow and add-to-home-screen guidance instead of a dead end; the e-mail opt-in UI and a FollowChannel provider interface exist with a labelled demo implementation; the copy states exactly what is delivered today. Delivery to a closed browser by push and e-mail is OOS-10.
- **Files:** `src/components/flights/flight-alerts-panel.tsx`, `src/components/flights/flight-alerts.ts`, `src/components/flights/flight-actions.tsx`, `src/components/flights/flight-status-hero.tsx`, `src/components/flights/flight-detail.tsx`, `src/lib/i18n/features/flights.ts`
- **Deferred (out of scope):** OOS-10 Flight alerts delivered when the page is closed (web push service, e-mail provider, server-side flight watcher).

<a id="b-05"></a>

### B-05. Board rows and flight-detail values (gate, belt, counters) appear with no demonstration label in view

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** content-integrity-01 (high), content-integrity-03 (high).
- **Evidence:** /en/kul/flights: 47 of 53 rows have no demo label in view on desktop and 52 of 53 on the phone (the same on /ms; Penang 7 of 12 and 11 of 12); the only label is the non-sticky banner above the board; a phone screenshot shows MH 1662 Shanghai, Gate C35, "Boarding" with no label on screen (content-integrity-01). Flight detail on the phone: "CHECK-IN Row X · Counters 5-10", "GATE K15" and "BAGGAGE BELT 2" with no label in view; banner at y=550, gate at y=1252 (content-integrity-03). Build spec rule 1.
- **Acceptance:** Using the compact demo tag from package A, every board time-group header (or every row at narrow widths) and the gate, belt and counter values in the status hero carry a demo marker; the in-view measurement reports 100% of rows and values labelled at 390x844 and 1280x900 on /en/kul/flights, /ms/kul/flights, /en/pen/flights and two flight pages; the check runs in CI.
- **Files:** `src/components/flights/flight-board.tsx`, `src/components/flights/flight-row.tsx`, `src/components/flights/flight-status-hero.tsx`, `src/components/flights/flight-detail.tsx`, `e2e/flights.spec.ts`
- **Depends on:** [A-04](#a-04)

<a id="b-06"></a>

### B-06. Demo flight generation runs on the main thread during render and on every board keystroke (INP 736 to 832 ms)

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** performance-02 (high).
- **Evidence:** Pixel 7 emulation at 4x CPU, typing "MH" in the board filter: worst interaction 784, 832 and 736 ms; long animation frame 729 ms with 523 ms of script in the input handler; clearing the filter 304-328 ms. CPU profile: 1,048 ms busy, zonedParts (Intl.DateTimeFormat.formatToParts) 296 ms, 262 rows rendered at once. The same zonedParts cost (653 ms) dominates home hydration; getFlightProvider creates a new provider every 30 s and the direction flip regenerates the pool.
- **Acceptance:** Every board keystroke and the journey direction switch respond within 200 ms on a 4x-throttled Pixel 7 profile (Event Timing, 3 runs); the filtered list derives from useDeferredValue or a transition; the two-day search pool is computed once per provider instant and cached per airport and date across provider instances; timezone offsets are computed once per day (no formatToParts per flight); rendered rows are capped (for example 40 with "Show more"); providers.test.ts and time.test.ts cover the cache.
- **Files:** `src/components/flights/flight-board-explorer.tsx`, `src/components/flights/board-model.ts`, `src/components/flights/flight-direction.ts`, `src/lib/providers/demo-flights.ts`, `src/lib/providers/index.ts`, `src/lib/time.ts`, `src/lib/hooks/use-flight-provider.ts`

<a id="b-07"></a>

### B-07. My journey shows a skeleton until hydration, then swaps it: CLS 0.11 to 0.23 and LCP 5.3 to 5.6 s on slow 4G

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** performance-06 (high).
- **Evidence:** Applied slow-4G Lighthouse: performance 46/50, LCP 5.6/5.3 s (element: the empty-state paragraph), CLS 0.211 (footer). Playwright CLS 0.2265 mobile and 0.1136 desktop in 2 of 2 loads. MyJourney returns a skeleton while !hydrated, then the empty state or saved flight at a different height; the page passes 33 KB of notes and 19 KB of sources to the client component.
- **Acceptance:** The server HTML of /en/journey contains the empty state; saved flights replace it after storage is read with CLS at or under 0.05 on mobile and desktop (2 loads each); LCP at or under 2.5 s on applied slow 4G; MyJourney receives only the notes and sources its saved flights need.
- **Files:** `src/components/flights/my-journey.tsx`, `src/app/[lang]/journey/page.tsx`, `src/lib/hooks/use-saved-journey.ts`

<a id="b-08"></a>

### B-08. Concierge misses direct answers: fares, airline terminal, nearest lounge, Fast Track, duty free, Aerotrain status, accessible qualifiers, autogates, "how early"

- **Severity:** high (raised from medium: found independently by 5 evaluations). **Priority:** P0 (high severity).
- **Sources:** ux-frequent-11 (medium), exec-commerce-17 (low), first-time-access-09 (medium), usability-13 (medium), docs-03 (medium). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** POST /api/concierge: "How much is the KLIA Ekspres?" and "Berapa tambang KLIA Ekspres?" lead with shuttle FAQs and bury RM 55; "Which terminal does Emirates/AirAsia use?" gets "check your booking" or "I could not match that to one topic"; "lounge near gate G6 in business class" lists all 5 T1 lounges unranked (ux-frequent-11, usability-13, docs-03). "Can I buy fast track at KLIA?" and "Where can I buy duty free chocolate?" return intent unknown, and "Is there fast track at KLIA?" leads with the Butterfly Effect hidden-disability programme; "Is the Aerotrain running?" maps to the gates intent (exec-commerce-17). "Where do I get an accessible taxi?" and "step-free access to KLIA Ekspres" get a generic transport list; "Boleh ibu saya guna autogate?" is unknown; "Pukul berapa perlu sampai?" asks for a flight number instead of giving the 3-hour guidance (first-time-access-09).
- **Acceptance:** Slot-specific intents in both languages whose first statement is the direct answer with its source: fare for a named mode (with the dated fare change), airline to terminal at KLIA (from the airline records; "confirm on your booking" where unverified), lounge nearest a gate ranked by flight context, Fast Track, duty free, Aerotrain and inter-terminal status (reads current notices), immigration and autogates, and "how early" (3 h international, 2 h domestic, then offer flight lookup). Qualifiers "accessible", "step-free" and "elderly/warga emas" filter statements to step-free fields and fall back to an explicit "not published, ask ..." answer. Every question quoted in the five source findings is in engine.test.ts and the BR-20 evaluation set, with the expected intent and first statement.
- **Files:** `src/lib/concierge/understand.ts`, `src/lib/concierge/engine.ts`, `src/lib/concierge/retrieve.ts`, `src/lib/concierge/knowledge.server.ts`, `src/lib/concierge/types.ts`, `src/lib/concierge/engine.test.ts`, `src/lib/i18n/features/concierge.ts`
- **Depends on:** [D-02](#d-02), [D-07](#d-07), [A-12](#a-12)

<a id="b-09"></a>

### B-09. No feed-failure or last-known-data state; flights are generated in the browser and the official provider is a stub

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** exec-commerce-03 (high). **Panels naming it:** exec-commerce.
- **Evidence:** src/lib/providers/official-flights.ts line 96: "Stub that documents the live integration. Every data method throws ProviderNotConfiguredError." PROVIDER_MODES sets flights, waitTimes and parkingAvailability to demo (src/lib/providers/index.ts). No last-known, stale, retry or error state exists in src/components/flights outside the alerts panel; flights are generated in the browser during hydration, so no network failure can occur today and none is handled. BR-05.
- **Acceptance:** Flights are served from the server through the provider interface with a cache (which also removes the generator from client bundles); the board, flight page and (via A) home search show last-known data with its age within 2 s of a failure, offer retry, and no spinner lasts more than 10 s; a chaos test (provider throws, times out, returns stale data) and a contract test against the official provider interface run in CI. Connecting the official feed is OOS-01.
- **Files:** `src/lib/providers/index.ts`, `src/lib/providers/official-flights.ts`, `src/lib/providers/types.ts`, `src/lib/providers/providers.test.ts`, `src/lib/hooks/use-flight-provider.ts`, `src/components/flights/flight-board-explorer.tsx`, `src/components/flights/flight-detail.tsx`
- **Hand-offs to other packages:** A: stale and failed states in src/components/flights/flight-search-box.tsx. E: /api/flights serves the cached provider data with the new limits.
- **Deferred (out of scope):** OOS-01 Official flight feed connected behind the provider interface.

<a id="b-10"></a>

### B-10. Delayed and cancelled board times rely on strikethrough to show which time is old (WCAG 1.3.1)

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** accessibility-03 (high).
- **Evidence:** The time cell for a delayed flight is &lt;s&gt;17:25&lt;/s&gt; &lt;span&gt;18:20&lt;/span&gt;, exposed as "17:25 18:20" with no "scheduled" or "estimated" word; most screen readers do not announce &lt;s&gt;. Same pattern in the phone list and saved-flight card (flight-row.tsx:83, 136; saved-flight-card.tsx:103). The flight detail page is correct.
- **Acceptance:** Delayed and cancelled times expose "Scheduled 17:25, now 18:20" and "Cancelled, was 17:25" to assistive technology on the board table, phone list and saved-flight card, reusing the flight page's Scheduled/Estimated strings; an accessibility-tree snapshot test covers both.
- **Files:** `src/components/flights/flight-row.tsx`, `src/components/flights/saved-flight-card.tsx`

<a id="b-11"></a>

### B-11. Assistance needs can never be set, so no timeline shows the assistance step

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** first-time-access-01 (high). **Panels naming it:** first-time-access.
- **Evidence:** JourneyPreferences.reducedMobility (src/lib/journey/index.ts:35) adds assistanceStep() for departing (line 392) and arriving (line 604) journeys, but both callers (journey-timeline.tsx:63, my-journey.tsx:75) call buildJourney without preferences, and no control anywhere asks about needs; MH 2072 (8 steps) and MH 2073 (6 steps) show no assistance step. BR-18.
- **Acceptance:** A "My needs" control (wheelchair, step-free, older traveller, travelling with someone who needs help) stored on the device without an account (new src/lib/needs.ts using the existing createStore) is offered on the flight page and My journey and passed to buildJourney by both callers; with a need set, departing and arriving timelines include the assistance step with the operating airline's lead time and the airport service, and map links use sf=1; journey.test.ts and an e2e test cover it.
- **Files:** `src/lib/needs.ts` (new), `src/components/flights/needs-control.tsx` (new), `src/components/flights/journey-timeline.tsx`, `src/components/flights/my-journey.tsx`, `src/lib/journey/index.ts`, `src/lib/i18n/features/flights.ts`, `e2e/flights.spec.ts`
- **Hand-offs to other packages:** D: render the needs control on /accessibility (src/app/[lang]/accessibility/page.tsx).

<a id="b-12"></a>

### B-12. The status card gives one cabin's check-in row as the flight's, and contradicts the timeline

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (named by 2 of 3 panels).
- **Sources:** ux-frequent-08 (medium), first-time-access-18 (low). **Panels naming it:** first-time-access, ux-frequent.
- **Evidence:** MH 2630 card: "CHECK-IN Row H · Counters 1-18"; the timeline note says Row H is international Economy, Row D (counters 4-12) Business, bag drop F and G; a business traveller following the card goes to the wrong row (flight-status-hero.tsx:51-52, demo provider field) (ux-frequent-08). MH 2072 card: "CHECK-IN Shown nearer the time" while the timeline and airline card give Row H (first-time-access-18).
- **Acceptance:** checkInRow is modelled per cabin, plus bag drop, in the flight type; the card shows up to three short lines ("Economy: Row H 1-18 · Business: Row D 4-12 · Bag drop: F, G") or labels the cabin when only one is known; with no feed row it falls back to the airline's published rows with provenance; a unit test over demo flights with and without feed rows proves card and timeline agree.
- **Files:** `src/lib/flights/types.ts`, `src/lib/providers/demo-flights.ts`, `src/components/flights/flight-status-hero.tsx`, `src/components/flights/airline-facts.tsx`, `src/lib/i18n/features/flights.ts`

<a id="b-13"></a>

### B-13. Flight-page links lose the flight's context, and the timeline ignores gate, cabin and dwell time

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (named by 2 of 3 panels).
- **Sources:** exec-commerce-07 (medium), ux-frequent-13 (medium). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** For MH 570 at gate C27, "Find the gate on the map" passes gate and terminal but "Browse food and shops" links /en/kul/shop-dine and "See parking" /en/kul/parking with no terminal or dates (src/lib/journey/index.ts lines 287 and 504); no lounge suggestion (exec-commerce-07). "Arrive at the airport by 16:40: 3 hours before your international flight" for a 65-minute KUL-SIN hop; no hand-luggage, cabin or Fast Track options; Plaza Premium Lounge near gate G is not suggested for gate G6; security plus immigration is a flat 45 minutes (ux-frequent-13).
- **Acceptance:** Contextual links carry what the destination can use: shop-dine ?gate=&lt;terminal&gt;-&lt;gate&gt;&amp;t=&lt;terminal&gt;, parking ?t=&lt;terminal&gt;&amp;from=&lt;ISO&gt;&amp;to=&lt;ISO&gt;, transport ?t=; the "time to spare" step lists the nearest lounge and outlets to the gate on the passenger's side of security; two remembered toggles ("Hand luggage only", "Business or lounge access") adjust arrive-by from sourced airline deadlines (Estimated where unsourced); an optional, non-preselected Fast Track action follows the security step on departing flights; journey.test.ts covers the parameters.
- **Files:** `src/lib/journey/index.ts`, `src/lib/journey/journey.test.ts`, `src/components/flights/journey-timeline.tsx`, `src/lib/i18n/features/flights.ts`
- **Depends on:** [D-02](#d-02)

<a id="b-14"></a>

### B-14. Flight ids: codeshare URLs return "not found"; unknown ids are rendered per request at full cost

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (on the security evaluator's fix-before-production list).
- **Sources:** ux-frequent-09 (medium), security-05 (medium). **Panels naming it:** ux-frequent.
- **Evidence:** Home search resolves "QR5700" to MH 2630, but /en/kul/flights/qr5700-20261118-d renders "We could not find this flight" (ux-frequent-09). Unknown ids (zz9999-20990101-d, an encoded &lt;img&gt; tag, a 1,600-character string) all return 200, about 450 KB, Cache-Control no-store; 40 concurrent random ids took 1.4-4.2 s against 7 ms for the prerendered board; no rate limit applies (security-05).
- **Acceptance:** A codeshare id redirects (308) to the operating flight's page for that date and airport; ids that fail the id shape (src/lib/flights/id.ts) or are unknown return 404 through notFound() with a small body (under 30 KB) before flight data is built; valid ids are cacheable for a short time (s-maxage at most 60 s); tests cover codeshare, malformed and unknown ids; security.md section 1 is updated through E.
- **Files:** `src/app/[lang]/[airport]/flights/[flightId]/page.tsx`, `src/lib/flights/id.ts`, `src/lib/providers/demo-flights.ts`, `src/components/flights/flight-not-found.tsx`, `e2e/flights.spec.ts`

<a id="b-15"></a>

### B-15. Concierge: the skeleton-then-consent swap shifts the page, and consent interrupts a tapped suggested question

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** performance-12 (medium), usability-21 (low).
- **Evidence:** Pixel 7: layout shift 0.14 at 349-399 ms when the consent panel replaces the role=status skeleton; the question field does not exist until hydration (performance-12). Tapping "How do I get from Terminal 1 to Terminal 2?" opens "Before you ask" and answers only after "Agree and start"; on the phone the suggestions are about 6,600 px down the home and the bottom bar has no concierge entry (usability-21).
- **Acceptance:** The consent text and question field are in the server HTML (CLS at or under 0.05 on /en/concierge, mobile); deterministic answers to suggested questions appear immediately with the privacy notice inline above the answer, and consent is asked only before AI wording or saved-flight use; the concierge is offered from the phone Search sheet (A hand-off).
- **Files:** `src/components/concierge/concierge-chat.tsx`, `src/components/concierge/concierge-panel.tsx`, `src/components/concierge/use-concierge.ts`, `src/lib/i18n/features/concierge.ts`
- **Hand-offs to other packages:** A: add a concierge entry to the phone Search sheet (src/components/search/command-palette.tsx or src/components/shell/mobile-bar.tsx).

<a id="b-16"></a>

### B-16. Boards open 45 minutes in the past, so departed flights lead

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** ux-frequent-10 (medium). **Panels naming it:** ux-frequent.
- **Evidence:** Phone 390 at about 18:55: header "17:53 to 00:38"; the first row (AK 6340, Departed) is at 1,173 px and 5 of the first 8 rows have departed; the first flight still to depart is at 1,298 px and the 18:55 departures start at about 2,478 px. board-model.ts:132 sets back = 45 minutes.
- **Acceptance:** Boards open at now minus at most 10 minutes, or keep 45 minutes but scroll to and visually collapse departed rows behind "Show earlier flights"; on /en/kul/flights at 390 px the first row shown has not departed; board-model.test.ts covers the window.
- **Files:** `src/components/flights/board-model.ts`, `src/components/flights/board-model.test.ts`, `src/components/flights/flight-board-explorer.tsx`

<a id="b-17"></a>

### B-17. Greeter view leads with long-stay parking and gives no pick-up point

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** usability-09 (medium).
- **Evidence:** P9-T1 (Meeting someone, MH 2088 arrival): steps start with "Decide where to park or wait", followed by "Parking for a longer trip" and "Avoid Preferred Parking" (RM2,084 bill); exit estimate and "Wait in the arrival hall" (Level 3) are good; no pick-up point, e-hailing pick-up area or entry fee, only "Do not wait at the kerb".
- **Acceptance:** For the meeting kind, steps lead with where to wait and pick up (arrival hall level, e-hailing pick-up area and entry fee with date or "Not published", kerb rules) and short-stay parking ("See parking" with a 3-hour preset); long-stay warnings are not shown to greeters; journey.test.ts covers the meeting kind.
- **Files:** `src/lib/journey/index.ts`, `src/lib/journey/journey.test.ts`
- **Hand-offs to other packages:** D: add sourced pick-up point and e-hailing entry-fee notes for the meeting topic in src/content/airports/kul.ts.

<a id="b-18"></a>

### B-18. Live board auto-updates every 30 seconds with no pause control (WCAG 2.2.2)

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** accessibility-06 (medium).
- **Evidence:** 80 s recording with a flight link focused: rows dropped from 63 to 61 and "Updated" changed; focus stayed and the page scrolled 90 px to keep it; no control to pause or slow updates (demo-flights.ts:44, use-flight-provider.ts:17).
- **Acceptance:** A "Pause live updates" control beside "Refreshes every 30 seconds" stops and resumes refresh; updates also pause while a row has focus or hover; the state change is announced politely.
- **Files:** `src/lib/hooks/use-flight-provider.ts`, `src/components/flights/board-toolbar.tsx`, `src/components/flights/flight-board-explorer.tsx`, `src/lib/i18n/features/flights.ts`

<a id="b-19"></a>

### B-19. Board changes are never announced, even for a saved flight

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** accessibility-15 (low).
- **Evidence:** Over 80 s the only live-region change was the aria-live=off timestamp; the build spec asks for polite board-update announcements.
- **Acceptance:** On refresh, a status, gate or time change to a saved flight posts one polite live-region message; unchanged refreshes post nothing.
- **Files:** `src/lib/hooks/use-flight-provider.ts`, `src/components/flights/flight-watcher.tsx`

<a id="b-20"></a>

### B-20. Concierge question field drops below the fold after an answer while keeping focus

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** accessibility-14 (low).
- **Evidence:** 1280x800: after one answer the focused field moved from y=534 to y=1027, outside the viewport.
- **Acceptance:** After each answer at 1280x800 and 390x844 the focused question field stays in the viewport (sticky composer or scrollIntoView with block "nearest").
- **Files:** `src/components/concierge/concierge-chat.tsx`

<a id="b-21"></a>

### B-21. Flight-number h1 in old-style figures; the route is stated three times

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** ux-frequent-20 (low). **Panels naming it:** ux-frequent.
- **Evidence:** Screenshots at 390, 360 and 1280: "MH 2630 to Singapore" in the display serif with old-style figures (the 3 descends); the lead "Malaysia Airlines. Kuala Lumpur (KUL) to Singapore (SIN)." and the card header repeat the route.
- **Acceptance:** Flight numbers use lining, tabular figures (or the sans) wherever shown; the route is stated once above the status card.
- **Files:** `src/app/[lang]/[airport]/flights/[flightId]/page.tsx`, `src/components/flights/flight-status-hero.tsx`

<a id="package-c"></a>

## Package C. Airport sections: map, facilities, transport, parking, transit, lounges, shop and dine

Every airport section page except flights and the overview, their components and logic, the transit planner and the shared section-page helper.

11 items: 5 P0, 5 P1, 1 P2 (1 critical, 3 high, 6 medium, 1 low).

**Owned files**

- `src/components/map/`
- `src/lib/map/`
- `src/components/facilities/`
- `src/components/transport/`
- `src/lib/transport.ts`
- `src/lib/transport.test.ts`
- `src/components/parking/`
- `src/lib/parking.ts`
- `src/lib/parking.test.ts`
- `src/components/commerce/`
- `src/components/guides/transit-planner.tsx`
- `src/components/guides/transit-planner-url.tsx`
- `src/components/guides/transit-logic.ts`
- `src/components/guides/transit-logic.test.ts`
- `src/components/guides/transit-data.server.ts`
- `src/components/airport/section-page.ts`
- `src/app/[lang]/[airport]/map/`
- `src/app/[lang]/[airport]/facilities/`
- `src/app/[lang]/[airport]/transport/`
- `src/app/[lang]/[airport]/parking/`
- `src/app/[lang]/[airport]/transit/`
- `src/app/[lang]/[airport]/lounges/`
- `src/app/[lang]/[airport]/shop-dine/`
- `src/lib/i18n/features/map.ts`
- `src/lib/i18n/features/transport.ts`
- `src/lib/i18n/features/commerce.ts`
- `e2e/map.spec.ts`
- `e2e/transport.spec.ts`
- `e2e/commerce.spec.ts`

| ID | Severity | Priority | Finding | Sources |
|---|---|---|---|---|
| [C-01](#c-01) | critical | P0 | Parking is not price-first, the Terminal 1 car park has no price, and the booking hand-off carries no dates | exec-commerce-02, ux-frequent-14, usability-19 |
| [C-02](#c-02) | high | P0 | No anti-touting or official-taxi guidance at the transport decision; no rail ticket links | usability-01, exec-commerce-16 |
| [C-03](#c-03) | high | P0 | The self-transfer verdict is 2,943 to 4,279 px down the phone page, after the steps | usability-07, ux-frequent-12 |
| [C-04](#c-04) | high | P0 | The map gives an illustrative prayer-room pin a level and area that the directory says are unpublished | usability-05 |
| [C-05](#c-05) | medium | P0 | Retail discovery dead-ends: filters return nothing; no hours, images, reserve-and-collect or offers | exec-commerce-10 |
| [C-06](#c-06) | medium | P1 | Missing airport sections: 404 under a section title, 200 on the first request, and indexable empty map and transit pages | usability-25, exec-commerce-18, docs-06 |
| [C-07](#c-07) | medium | P1 | Nursing rooms are absent from Facilities with no "not published" placeholder | usability-12 |
| [C-08](#c-08) | medium | P1 | Step-free arrival route omits the lift and immigration, has a vague "Walk on" step and stops short of the taxi | first-time-access-07 |
| [C-09](#c-09) | medium | P1 | Duplicate option names in the map route From and To lists | first-time-access-14 |
| [C-10](#c-10) | low | P1 | Transport page: an h3 precedes its section h2 in source order (WCAG 1.3.1) | accessibility-10 |
| [C-11](#c-11) | medium | P2 | Lounges and day rooms are listed but cannot be priced or booked | exec-commerce-09 |

<a id="c-01"></a>

### C-01. Parking is not price-first, the Terminal 1 car park has no price, and the booking hand-off carries no dates

- **Severity:** critical (raised from high: found independently by 3 evaluations). **Priority:** P0 (critical severity).
- **Sources:** exec-commerce-02 (high), ux-frequent-14 (medium), usability-19 (medium). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** All 4 KLIA car parks show "Rates: Not verified"; "3 days" gives "At most RM 96" for the Long Term Car Park only; Terminal 1 Car Park for 3 hours: "No estimate ... an undated Malaysia Airports page gives RM4 an hour for the first three hours and klia.info gives a daily maximum of RM52" (exec-commerce-02, usability-19). Phone: after the h1 come a Book link and two callouts; the "3 days" chip is at 2,029 px and the estimate at 2,206 px; 1,348 words and 17 not-verified mentions (ux-frequent-14). "Book parking online" opens the official page with no product, dates or referral. BR-10.
- **Acceptance:** In this round: the page leads with a compact matrix (car park x 1 day / 3 days / 7 days) inside the first phone viewport once the compact chrome lands; "Not verified" cells show the dated conflicting source figures as a range with sources and link out; the Preferred Parking warning moves into its row; the booking link carries product and entry/exit dates where the official site accepts them, otherwise the dates are shown beside the link; e2e covers the matrix position. Running the calculator on the official tariff and a dated, attributed booking deep link are OOS-03.
- **Files:** `src/app/[lang]/[airport]/parking/page.tsx`, `src/components/parking/parking-calculator.tsx`, `src/components/parking/car-park-card.tsx`, `src/components/parking/car-park-list.tsx`, `src/components/parking/parking-logic.ts`, `src/lib/i18n/features/transport.ts`, `e2e/commerce.spec.ts`
- **Depends on:** [A-01](#a-01)
- **Deferred (out of scope):** OOS-03 Official parking tariff in the calculator and a dated, attributed booking deep link.

<a id="c-02"></a>

### C-02. No anti-touting or official-taxi guidance at the transport decision; no rail ticket links

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** usability-01 (high), exec-commerce-16 (low). **Panels naming it:** exec-commerce.
- **Evidence:** /en/kul/transport?t=T1 contains no "tout", "scam", "unofficial" or "offering a ride"; with the default destination KL Sentral the coupon taxi appears only under "Not listed for KL Sentral" and its counters and fares only after changing destination (usability-01). KLIA Ekspres fares are dated but "check kliaekspres.com" is plain text with no ticket link; the anti-touting statement exists in the arriving guide (src/content/guides.ts line 211) and Help but not on the comparison (exec-commerce-16). BR-11.
- **Acceptance:** Arrival-side transport views show, at the top and beside taxi and e-hailing cards, "Book taxis only at the coupon counters; ignore anyone offering a ride", reusing the guide statement and its sources and linking to the Help scam answer; the coupon taxi with its counters is listed for every city destination; each mode with an official ticket channel links to it (official channels only); e2e checks /en/kul/transport and /ms/kul/transport.
- **Files:** `src/components/transport/transport-planner.tsx`, `src/components/transport/transport-logic.ts`, `src/components/transport/transport-option-card.tsx`, `src/app/[lang]/[airport]/transport/page.tsx`, `src/lib/i18n/features/transport.ts`, `e2e/transport.spec.ts`

<a id="c-03"></a>

### C-03. The self-transfer verdict is 2,943 to 4,279 px down the phone page, after the steps

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** usability-07 (high), ux-frequent-12 (medium). **Panels naming it:** ux-frequent.
- **Evidence:** With the usability inputs, "Tight. Your time sits inside our estimate..." at 4,279 px on the phone (2,652 px on desktop) after eleven steps; P7-T1 took 6 interactions against a target of 3 (usability-07). With default inputs, "Looks workable" at 2,943 px on a 10,336 px page (ux-frequent-12).
- **Acceptance:** A verdict card (verdict word, one sentence, time range, "If it is tight" action) renders directly below the form and before the steps on phone and desktop; at 390x664 it is within one screen of the form's last control; verdict changes are announced politely; e2e asserts the order.
- **Files:** `src/components/guides/transit-planner.tsx`, `src/components/guides/transit-logic.ts`, `e2e/transport.spec.ts`
- **Hand-offs to other packages:** D: add any new verdict-card strings under guidePages.transit in src/lib/i18n/features/guides.ts.

<a id="c-04"></a>

### C-04. The map gives an illustrative prayer-room pin a level and area that the directory says are unpublished

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** usability-05 (high).
- **Evidence:** Facilities card "Prayer rooms (surau)": "Locations and levels are not yet verified ... Not published: Location, Level, Area, Opening hours and Accessibility", with a "Show on map" link; the map panel then states "Level 5: departures. Area: Public area (landside)" from a point with provenance "demo" (src/content/airports/kul.ts).
- **Acceptance:** For demo-provenance map points linked to a facility whose location is unpublished, the panel shows "Position illustrative: level and area not published" instead of Level and Area (or "Show on map" is not rendered); map-logic.test.ts covers it.
- **Files:** `src/components/map/map-explorer.tsx`, `src/components/map/place-details.tsx`, `src/components/facilities/facility-card.tsx`, `src/components/map/map-logic.test.ts`
- **Hand-offs to other packages:** D: add a content.test.ts rule that a map point cannot assert fields its facility lacks.

<a id="c-05"></a>

### C-05. Retail discovery dead-ends: filters return nothing; no hours, images, reserve-and-collect or offers

- **Severity:** medium (source rating, medium). **Priority:** P0 (named by 2 of 3 panels).
- **Sources:** exec-commerce-10 (medium). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** The home strip offers "Open now", "Halal", "Before security", "After security"; /en/kul/shop-dine?filters=open-now shows "0 of 8. Outlets without published hours are left out"; hours 0 of 8, price bands 0 of 8, no outlet images; Eraman duty-free outlets have no pre-order link; no labelled offer slot exists. ux-frequent Q10 lists outlet hours as must-have with MAHB data.
- **Acceptance:** In this round: filters that cannot return results with current data are hidden or disabled with a reason on /&lt;airport&gt;/shop-dine and on the home strip (A hand-off); no offered filter returns "0 of 8". Hours, price bands, images, reserve-and-collect and an offer slot are OOS-05.
- **Files:** `src/components/commerce/outlet-directory.tsx`, `src/components/commerce/commerce-view.ts`
- **Hand-offs to other packages:** A: hide the same filters in src/components/home/shop-dine-strip.tsx.
- **Deferred (out of scope):** OOS-05 Outlet hours, price bands, images, reserve-and-collect and a labelled offer slot.

<a id="c-06"></a>

### C-06. Missing airport sections: 404 under a section title, 200 on the first request, and indexable empty map and transit pages

- **Severity:** medium (raised from low: found independently by 3 evaluations). **Priority:** P1 (should fix now).
- **Sources:** usability-25 (low), exec-commerce-18 (low), docs-06 (low). **Panels naming it:** exec-commerce.
- **Evidence:** /en/szb/parking returns 404 "Page not found" with the title "Parking at Subang | Malaysia Airports" because airportSectionMetadata builds the title before section availability is checked (usability-25; src/components/airport/section-page.ts). The first requests to /en/kch/parking, /en/lgk/transport, /en/bki/shop-dine, /en/lgk/parking and /en/pen/shop-dine return 200 with not-found content, later 404 (exec-commerce-18). /{airport}/map and /{airport}/transit answer for all 39 airports as unlinked empty states (docs-06).
- **Acceptance:** airportSectionMetadata returns the not-found title and noindex when the airport lacks the section; section routes export dynamicParams = false (or reject unknown airport-section pairs before rendering) so every request for a missing section is 404 from the first request; map and transit empty-state variants are 404 or noindex; a curl test over 39 airports x 9 sections checks the first and a repeat request.
- **Files:** `src/components/airport/section-page.ts`, `src/app/[lang]/[airport]/parking/page.tsx`, `src/app/[lang]/[airport]/transport/page.tsx`, `src/app/[lang]/[airport]/facilities/page.tsx`, `src/app/[lang]/[airport]/lounges/page.tsx`, `src/app/[lang]/[airport]/shop-dine/page.tsx`, `src/app/[lang]/[airport]/map/page.tsx`, `src/app/[lang]/[airport]/transit/page.tsx`

<a id="c-07"></a>

### C-07. Nursing rooms are absent from Facilities with no "not published" placeholder

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** usability-12 (medium).
- **Evidence:** P3-T1: 17 facilities at T1, none about nursing or baby care, although "nursing-room" is a defined category; the only answer is in the Families guide, reached by site search after a dead end; the map lists "Not on this map yet: Accessible toilets, Nursing rooms".
- **Acceptance:** Facilities shows placeholder cards for expected but unverified categories (nursing room, accessible toilet) with "Not published" and the information-counter route, mirroring the map's list; a parent reaches the nursing-room answer from Facilities in 2 interactions.
- **Files:** `src/components/facilities/facilities-directory.tsx`, `src/components/facilities/facility-view.ts`

<a id="c-08"></a>

### C-08. Step-free arrival route omits the lift and immigration, has a vague "Walk on" step and stops short of the taxi

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** first-time-access-07 (medium). **Panels naming it:** first-time-access.
- **Evidence:** Gate C to arrivals pick-up, sf=1: "About 760 m, 14 min / 19 min"; steps 4 "Walk on" 70 m and 5 "Continue through to Level 3: arrivals" 200 m name no lift and no immigration, although the map has "Arrival immigration" and lift places; taxi coupon counters are not a map place.
- **Acceptance:** Step-free routes emit a named "change level" step with the lift for every level transition, include immigration and customs as named steps, and can end at the taxi counter, rail entrance or e-hailing pick-up once D adds those places; map-logic.test.ts covers gate C to taxi counter.
- **Files:** `src/components/map/map-logic.ts`, `src/components/map/map-logic.test.ts`, `src/components/map/route-planner.tsx`
- **Hand-offs to other packages:** D: add taxi counter, rail entrance and e-hailing pick-up as map places in src/content/airports/kul.ts.

<a id="c-09"></a>

### C-09. Duplicate option names in the map route From and To lists

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** first-time-access-14 (medium). **Panels naming it:** first-time-access.
- **Evidence:** The From and To selects (40 options each) contain "Aerotrain station · Gates" twice and "Malaysia Airlines Golden Lounge · Gates" three times; the qualifiers exist in the place names but are dropped in the option text.
- **Acceptance:** Every option label is unique per terminal (full place name or building appended); a unit test asserts uniqueness.
- **Files:** `src/components/map/route-planner.tsx`, `src/components/map/map-logic.ts`, `src/components/map/map-logic.test.ts`

<a id="c-10"></a>

### C-10. Transport page: an h3 precedes its section h2 in source order (WCAG 1.3.1)

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** accessibility-10 (low).
- **Evidence:** In the region "Not covered here yet", h3 "Driving yourself" comes before h2 "Not covered here yet" in the DOM (both at y=3036).
- **Acceptance:** The section heading comes first in source order (visual order via CSS grid if needed); heading-order check passes on /en/kul/transport.
- **Files:** `src/app/[lang]/[airport]/transport/page.tsx`

<a id="c-11"></a>

### C-11. Lounges and day rooms are listed but cannot be priced or booked

- **Severity:** medium (source rating, medium). **Priority:** P2 (out of scope this round: Needs access rules, prices and booking links from each lounge operator; nothing in the repository can supply them truthfully.).
- **Sources:** exec-commerce-09 (medium). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** 6 KLIA lounges, 1 hotel and 2 rest services; Plaza Premium Lounge "Listed by lounge-network directories, not by the operator" with no booking link; "who may use it" Not published for Plaza Premium First and the Malaysia Airlines lounges; no price on any card; no lounge action on the flight page or long transfers. ux-frequent Q4: "Lounge: partial ... no price or access rules".
- **Acceptance:** When operators supply them: access rules, price and a booking action per lounge from the operator, with price and booking fields in the facility model, and a dwell-time suggestion on departing and transit timelines. Until then each card states "Price and access rules not published" once.
- **Files:** `src/components/commerce/lounge-card.tsx`, `src/app/[lang]/[airport]/lounges/page.tsx`
- **Deferred (out of scope):** OOS-04 Lounge access rules, prices and booking.

<a id="package-d"></a>

## Package D. Content, copy, guides, help and corporate

The sourced content layer (all records, sources, provenance rules and content tests), guides, help, the accessibility hub, notices, corporate pages and their dictionaries.

17 items: 7 P0, 8 P1, 2 P2 (0 critical, 5 high, 7 medium, 5 low).

**Owned files**

- `src/content/`
- `src/components/guides/` (except `src/components/guides/transit-planner.tsx`, package C; `src/components/guides/transit-planner-url.tsx`, package C; `src/components/guides/transit-logic.ts`, package C; `src/components/guides/transit-logic.test.ts`, package C; `src/components/guides/transit-data.server.ts`, package C)
- `src/components/help/`
- `src/components/corporate/`
- `src/app/[lang]/guides/`
- `src/app/[lang]/help/`
- `src/app/[lang]/corporate/`
- `src/app/[lang]/accessibility/`
- `src/app/[lang]/notices/`
- `src/app/[lang]/about-this-prototype/`
- `src/app/[lang]/privacy/`
- `src/app/[lang]/terms/`
- `src/lib/i18n/features/guides.ts`
- `src/lib/i18n/features/corporate.ts`
- `e2e/guides.spec.ts`
- `e2e/corporate.spec.ts`

| ID | Severity | Priority | Finding | Sources |
|---|---|---|---|---|
| [D-01](#d-01) | high | P0 | "Official" tag on facts that rest only on news, blogs, relays or the prototype itself | content-integrity-04, content-integrity-05, content-integrity-06 |
| [D-02](#d-02) | high | P0 | Fast Track is absent from the whole product, though MAHB sells it today | exec-commerce-01, ux-frequent-04 |
| [D-03](#d-03) | high | P0 | Team-written English strings on Malay pages: annotations, as-of text, airline check-in notes and a payment list | content-integrity-11, first-time-access-15, usability-23 |
| [D-04](#d-04) | high | P0 | Accessibility facts a wheelchair user travels on are missing (toilets, lifts, step-free transport, accessible parking, airport assistance, non-MH airlines) | first-time-access-02 |
| [D-05](#d-05) | medium | P0 | A stale, generic "not verified" block repeats on pages and inside every departing journey | exec-commerce-06, first-time-access-05 |
| [D-06](#d-06) | medium | P0 | Copy and sourcing would not pass an operator's brand and legal review; warnings quote a blog's anecdote | exec-commerce-11, ux-frequent-21 |
| [D-07](#d-07) | medium | P0 | No immigration or autogate guidance for departing Malaysian citizens and older travellers | first-time-access-10 |
| [D-08](#d-08) | medium | P1 | Aerotrain closure notice keeps "Planned:" while in effect, is silent on accessible alternatives, and route steps do not point to it | content-integrity-08, first-time-access-20 |
| [D-09](#d-09) | medium | P1 | Malay pages: airport names, states and place names stay in English | content-integrity-09 |
| [D-10](#d-10) | medium | P1 | KLIA Ekspres fare-rise notice reads "Ended" once the new fare starts; card copy goes stale after 1 January 2027 | content-integrity-07 |
| [D-11](#d-11) | medium | P1 | Hub link "Accessible toilets: Show on the map" leads to a map that says accessible toilets are not on it | first-time-access-04 |
| [D-12](#d-12) | low | P1 | As-of dates are missing on many records and free text where present | content-integrity-12 |
| [D-13](#d-13) | low | P1 | Some planning guidance lives in interface copy and code instead of the sourced content layer | content-integrity-13 |
| [D-14](#d-14) | low | P1 | Immigration and customs guide reads at grade 11 | accessibility-13 |
| [D-15](#d-15) | low | P1 | Phone numbers are 5,226 px down the phone Help centre | usability-22 |
| [D-16](#d-16) | high | P2 | Information completeness is well below the benchmark | exec-commerce-05 |
| [D-17](#d-17) | low | P2 | Business revenue channels (advertising, retail space) have no enquiry path | exec-commerce-20 |

<a id="d-01"></a>

### D-01. "Official" tag on facts that rest only on news, blogs, relays or the prototype itself

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** content-integrity-04 (high), content-integrity-05 (medium), content-integrity-06 (medium).
- **Evidence:** 9 records (12 with duplicates) render "Official" with only news, aggregator or other sources: the KLIA Ekspres card "FARE TODAY RM 55 · JOURNEY TIME 28 min" (thestar, businesstoday, soyacincau, wego; the 28 min from a blog; the concierge repeats it under Official with the hedge dropped), the RM65 fare-rise notice, the Aerotrain closure (whose body says the dates are unconfirmed), the Mavcom refund FAQ, Penang e-hailing pick-up and the Subang curfew (content-integrity-04). Answers about the prototype on /help/about-this-site and /help/privacy carry Official with only prototype-method as source (content-integrity-05). Five routesonline.com relays and an Edge advertorial are kind "official"; Routes and ANA are "operator" (content-integrity-06). The registry header (sources.ts lines 8-10) says such facts are "estimated".
- **Acceptance:** validateContent rejects provenance "official" unless at least one cited source is kind official, government or operator on the authority's own domain, and never accepts prototype-method for it; the 9 records are retagged "estimated" or gain a first-party source (kliaekspres.com fare page, Mavcom notice, MAHB notice); the 8 misclassified sources are reclassified or given the first-party URL; prototype statements carry no Official tag; content.test.ts passes with the rule; the concierge shows the same tag as the page.
- **Files:** `src/content/sources.ts`, `src/content/airports/kul.ts`, `src/content/airports/pen.ts`, `src/content/airports/szb.ts`, `src/content/faqs.ts`, `src/content/corporate.ts`, `src/content/types.ts`, `src/content/content.test.ts`

<a id="d-02"></a>

### D-02. Fast Track is absent from the whole product, though MAHB sells it today

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** exec-commerce-01 (high), ux-frequent-04 (high). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** Site search "fast track": 0 results; home search: "0 flights found"; concierge "Can I buy fast track at KLIA?" returns intent unknown and "Is there fast track at KLIA?" leads with the Butterfly Effect hidden-disability programme; no departing timeline offers it; grep finds "fast-track" only in the legacy redirect map, which sends /en/klia1/air-travel/services/fast-track to the overview (src/lib/seo/legacy-redirects.ts:77). MAHB sells Fast Track today (myairportfasttrack.com, strategy section 8) and P1 lists it as a top task. First-time-access Q7: assistance-type services are not offered in context.
- **Acceptance:** A sourced Fast Track service record per KLIA terminal where it exists (what it is, price, hours, terminal and checkpoint, how to buy, seller identity, source and as-of date, "Not published" for unknown fields) exists in the content layer and is exported to search and concierge knowledge, with a content test; it renders on the KLIA overview services area (A hand-off). The finding closes only when the related items' Fast Track checks also pass: "fast track" and "laluan pantas" return it first in search (A), the concierge answers from it (B), departing timelines offer it as an optional, non-preselected action after security (B) and the legacy fast-track path redirects to it (E).
- **Files:** `src/content/types.ts`, `src/content/airports/kul.ts`, `src/content/sources.ts`, `src/content/index.ts`, `src/content/content.test.ts`
- **Closes together with:** [A-12](#a-12), [B-08](#b-08), [B-13](#b-13), [E-16](#e-16)
- **Hand-offs to other packages:** A: show the record on the KLIA overview (src/app/[lang]/[airport]/page.tsx). E: point the fast-track legacy path at it in src/lib/seo/legacy-redirects.ts.

<a id="d-03"></a>

### D-03. Team-written English strings on Malay pages: annotations, as-of text, airline check-in notes and a payment list

- **Severity:** high (raised from medium: found independently by 3 evaluations). **Priority:** P0 (high severity).
- **Sources:** content-integrity-11 (medium), first-time-access-15 (low), usability-23 (low). **Panels naming it:** first-time-access.
- **Evidence:** Registry annotations in English on Malay pages: "How this concept prototype estimates and labels guidance" and "Diterbitkan oleh This prototype (not an official source)" on 22 pages, "(third-party guide)" on 14, "(as summarised in search results)" on 20; free-text as-of values print in English ("Source undated; checked 16 November 2026"; "Page undated" renders as "Setakat Page undated"); the BKI payment list reads "... dan DuitNow QR" (content-integrity-11, first-time-access-15). The Malaysia Airlines check-in detail on the Malay flight page ("Level 5. International Economy: Row H ...", "Self-service bag drop: counters F and G") is English with no translation notice (first-time-access-15, usability-23). BR-16.
- **Acceptance:** Annotations move out of Source.title into a localised note field; the prototype-method publisher and "(third-party guide)" suffix are localised; as-of free text becomes codes (undated, listing-undated) or ISO dates with a localised qualifier (shared schema with the as-of item); airline check-in notes and the BKI payment list are LocalizedText; a scan of all /ms pages finds 0 team-written English strings (titles of English publications excepted, handled by A).
- **Files:** `src/content/sources.ts`, `src/content/types.ts`, `src/content/airports/kul.ts`, `src/content/airports/bki.ts`, `src/content/airports/kch.ts`, `src/content/airports/pen.ts`
- **Hand-offs to other packages:** C: render as-of codes through the dictionary in src/components/commerce/fact-rows.tsx (AsOfText). B: read the localised check-in field in src/components/flights/airline-facts.tsx.
- **Deferred (out of scope):** OOS-14 Native-speaker review of the Malay interface and content, and confirmation of official Malay airport names.

<a id="d-04"></a>

### D-04. Accessibility facts a wheelchair user travels on are missing (toilets, lifts, step-free transport, accessible parking, airport assistance, non-MH airlines)

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** first-time-access-02 (high). **Panels naming it:** first-time-access.
- **Evidence:** Map: "Not on this map yet: Accessible toilets, Nursing rooms ..."; transport: "Step-free access not confirmed" on all six KLIA modes; parking: accessible bays "Not published"; hub: "We could not capture its content" for the KLIA T1 special-assistance page; 0 mentions of AirAsia or any airline other than Malaysia Airlines in the hub and reduced-mobility guide; live-chat hours not given; concierge: "Our sources do not publish accessible toilet for KLIA yet". No facility has accessible=true and there is no T2 map (integration hand-off section 6). BR-12, BR-13, BR-18.
- **Acceptance:** In this round: assistance rules of AirAsia, AirAsia X, Batik Air and the top international carriers at KLIA (request channel, lead time, wheelchair types) are added from airline sources with dates in both languages; live-chat hours are stated or marked "Not published"; the hub lists every missing accessibility fact once with the official request channel. Located toilets, lifts, buggy and wheelchair points, accessible bays, step-free status per mode and station, and the airport special-assistance service need MAHB (OOS-07).
- **Files:** `src/content/guides.ts`, `src/content/airports/kul.ts`, `src/content/sources.ts`, `src/app/[lang]/accessibility/page.tsx`
- **Deferred (out of scope):** OOS-07 Accessibility facility data for KLIA T1 and T2 (toilets, lifts, buggy and wheelchair points, accessible bays, step-free status per mode and station, special-assistance service).

<a id="d-05"></a>

### D-05. A stale, generic "not verified" block repeats on pages and inside every departing journey

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (named by 3 of 3 panels).
- **Sources:** exec-commerce-06 (medium), first-time-access-05 (medium). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** Guide note kul-content-gaps ("What this prototype has not verified at KLIA", 13 items, about 90 words; kul.ts line 1421) appears on the departing flight page, transport, facilities and parking; it still lists "shops and restaurants in either terminal" and "Terminal 2 facilities" as unverified while shop and dine lists 8 sourced outlets (2 in T2) and lounges a T2 lounge (exec-commerce-06). It sits in step 1 of every departing timeline, followed by the RM2,084 Preferred Parking warning in step 2 (first-time-access-05); ux-frequent Q5 objects to the same block.
- **Acceptance:** The gap list is generated from content coverage (or corrected and dated) so it cannot contradict published sections; it attaches to no journey-step topic and appears once per airport (overview or About this prototype) with links from pages; the Preferred Parking warning attaches only to the parking topic; content.test.ts fails if a gap entry names a category that has published records.
- **Files:** `src/content/airports/kul.ts`, `src/content/guides.ts`, `src/content/content.test.ts`
- **Hand-offs to other packages:** C: replace the full block with a one-line link where views read the note by id (src/components/parking/parking-data.server.ts:22, src/components/transport/transport-data.server.ts:69, src/components/map/map-view.server.ts:157, src/components/commerce/commerce-view.server.ts:165, src/app/[lang]/[airport]/facilities/page.tsx:46).

<a id="d-06"></a>

### D-06. Copy and sourcing would not pass an operator's brand and legal review; warnings quote a blog's anecdote

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (named by 2 of 3 panels).
- **Sources:** exec-commerce-11 (medium), ux-frequent-21 (low). **Panels naming it:** exec-commerce, ux-frequent.
- **Evidence:** Callout "Parking for more than a day? Avoid Preferred Parking" with "In January 2025 paultan.org reported a bill of RM2,084" (src/content/airports/kul.ts line 1404) on the parking page and every KLIA departing flight page; facts cite blogs, trip.com, threads.com and x.com; the Malay copy is a draft pending native review (exec-commerce-11, ux-frequent-21).
- **Acceptance:** In this round: the Preferred Parking warning is stated as a rule with the published tariff and date ("Preferred Parking is priced for short stays; for more than a day the Long Term Car Park costs at most RM32 a day"), with the press report kept only in the sources popover; a written source policy (allowed source kinds per provenance, social posts never backing Official facts) is enforced by content.test.ts. MAHB-owned or contracted sources for every fact and brand, legal and native review are OOS-08 and OOS-14.
- **Files:** `src/content/airports/kul.ts`, `src/content/notices.ts`, `src/content/sources.ts`, `src/content/content.test.ts`
- **Deferred (out of scope):** OOS-08 Operator-grade sourcing: MAHB-owned or contracted sources for every published fact; brand and legal review of warnings; OOS-14 Native-speaker review of the Malay interface and content, and confirmation of official Malay airport names.

<a id="d-07"></a>

### D-07. No immigration or autogate guidance for departing Malaysian citizens and older travellers

- **Severity:** medium (source rating, medium). **Priority:** P0 (a P0 item depends on it (B-08)).
- **Sources:** first-time-access-10 (medium). **Panels naming it:** first-time-access.
- **Evidence:** First-time guide step "2. Kawalan pasport" is one sentence; the timeline says only "at least 45 minutes"; the arriving-side autogate note covers foreign visitors; the gap note lists "the official list of nationalities that may use the autogates" as unverified; concierge intent unknown for the autogate question.
- **Acceptance:** A sourced departing-immigration note for Malaysian citizens (autogate eligibility, documents, counters for assisted or older passengers) from the Immigration Department of Malaysia, in both languages, attached to the immigration topic so it appears in the first-time and departing guides and the departing timeline's immigration step, and is available to the concierge.
- **Files:** `src/content/guides.ts`, `src/content/airports/kul.ts`, `src/content/sources.ts`

<a id="d-08"></a>

### D-08. Aerotrain closure notice keeps "Planned:" while in effect, is silent on accessible alternatives, and route steps do not point to it

- **Severity:** medium (raised from low: found independently by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** content-integrity-08 (low), first-time-access-20 (low). **Panels naming it:** first-time-access.
- **Evidence:** At 2026-11-29T02:00+08:00 /en/notices and /en/kul show "In effect now" beside "Planned: no Aerotrain ..."; at 2027-01-15 the same title shows "Ended"; /en/kul/transit step 3 still says "Take the Aerotrain ..." with no link to the notice (content-integrity-08). The notice says "Shuttle buses replace it ..." with no mention of step-free boarding or assistance (first-time-access-20).
- **Acceptance:** The stored title drops "Planned:"; the notice states the accessible alternative and extra time for assisted passengers, sourced or marked "Not published"; route steps that use the Aerotrain read in-effect notices for KUL T1 (C hand-off); clock tests at 28 November 02:00 and 15 January pass in both languages.
- **Files:** `src/content/notices.ts`, `src/content/airports/kul.ts`
- **Hand-offs to other packages:** C: read current notices in src/components/guides/transit-data.server.ts.

<a id="d-09"></a>

### D-09. Malay pages: airport names, states and place names stay in English

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** content-integrity-09 (medium).
- **Evidence:** The h1 and &lt;title&gt; of all 39 Malay airport overview pages are English names (/ms/pen "Penang International Airport"); state names render untranslated ("Labuan, Federal Territory of Labuan", "Bayan Lepas, Penang") although airports.ts has STATE_MS; "Singapore" appears on 15 Malay pages and "Penang" on 17.
- **Acceptance:** Airport.name, shortName and state are LocalizedText (or STATE_MS is applied everywhere a state is shown); demo destination names are localised through B; a crawl of /ms pages finds no English state names; official Malay airport names are confirmed by a native editor (OOS-14) before release.
- **Files:** `src/content/airports.ts`, `src/content/types.ts`
- **Hand-offs to other packages:** B: localise demo destination city names in src/lib/providers/demo-routes.ts.
- **Deferred (out of scope):** OOS-14 Native-speaker review of the Malay interface and content, and confirmation of official Malay airport names.

<a id="d-10"></a>

### D-10. KLIA Ekspres fare-rise notice reads "Ended" once the new fare starts; card copy goes stale after 1 January 2027

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** content-integrity-07 (medium).
- **Evidence:** Clock tests from 2026-11-18 to 2027-01-15: fare switching is correct (RM 55 until 2026-12-31T23:00, RM 65 from 2027-01-01T00:10), but the notice (validTo 2026-12-31T23:59:59, no validFrom) shows "In effect now" from today and "Ended" from 1 January, and leaves /en/kul and the home strip the day the change applies; after 1 January the card still says "both fares are listed" while only RM 65 is.
- **Acceptance:** The notice has validFrom (announcement) and a validTo some weeks after 1 January 2027 with before and after title variants and reads as in effect over the change; the "both fares are listed" sentence is conditional (C hand-off, needs validFrom/validUntil on TransportDestination); clock tests at 2026-12-31T23:00, 2027-01-01T00:10 and 2027-01-15 pass in both languages.
- **Files:** `src/content/airports/kul.ts`, `src/content/types.ts`
- **Hand-offs to other packages:** C: make the sentence conditional in src/components/transport/transport-logic.ts.

<a id="d-11"></a>

### D-11. Hub link "Accessible toilets: Show on the map" leads to a map that says accessible toilets are not on it

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** first-time-access-04 (medium). **Panels naming it:** first-time-access.
- **Evidence:** src/app/[lang]/accessibility/page.tsx:37 links the toilets card to /kul/map?cat=accessible-toilets with "Show on the map"; the KLIA T1 map lists "Accessible toilets" under "Not on this map yet"; the card itself says positions are not verified.
- **Acceptance:** While no accessible-toilet map points exist, the card's action is "Ask at an information counter" or the official special-assistance page; the map link returns automatically when points exist.
- **Files:** `src/app/[lang]/accessibility/page.tsx`

<a id="d-12"></a>

### D-12. As-of dates are missing on many records and free text where present

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** content-integrity-12 (low).
- **Evidence:** 108 of 251 sources have no asOf; 15 of 28 FAQs have none (14 cite only undated sources); asOf is z.string() holding "2026-10-07", "2026-08", "Retrieved 2026-11-16", "Source undated; checked 16 November 2026" and similar, which cannot be compared for staleness.
- **Acceptance:** asOf is split into asOfDate (ISO, required, or an explicit undated flag) and asOfNote (LocalizedText, optional); sources and FAQs are backfilled; content.test.ts flags records older than 12 months.
- **Files:** `src/content/types.ts`, `src/content/sources.ts`, `src/content/faqs.ts`, `src/content/content.test.ts`

<a id="d-13"></a>

### D-13. Some planning guidance lives in interface copy and code instead of the sourced content layer

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** content-integrity-13 (low).
- **Evidence:** The home "Be at the airport by 18:00 · Estimated guidance · About 3 hours before an international flight ..." comes from src/lib/i18n/en.ts line 816 (and ms.ts), duplicating guides.ts line 40 without a source id; transit connection ranges come from transit-logic.ts lines 116-127.
- **Acceptance:** The arrive-by rule and the transit connection assumptions are content records (the latter citing prototype-method); A and C read them instead of hard-coded values, so one edit updates every surface.
- **Files:** `src/content/guides.ts`
- **Hand-offs to other packages:** A: read the rule from the guide record in src/lib/i18n/en.ts and ms.ts surfaces. C: read the assumptions record in src/components/guides/transit-logic.ts.

<a id="d-14"></a>

### D-14. Immigration and customs guide reads at grade 11

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** accessibility-13 (low).
- **Evidence:** Flesch-Kincaid grade 11.3, reading ease 40, 20 sentences over 25 words; other guides grade 7.5-8.7.
- **Acceptance:** Main text at grade 9 or below and reading ease 55 or above; no sentence over 25 words; dated reporting moved into source notes.
- **Files:** `src/content/guides.ts`

<a id="d-15"></a>

### D-15. Phone numbers are 5,226 px down the phone Help centre

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** usability-22 (low).
- **Evidence:** The "Contact Malaysia Airports" section with tel: links starts at 5,226 px on /en/help; the path takes 4 interactions on the phone against a target of 2.
- **Acceptance:** A compact "Call Malaysia Airports" row with labelled tel: links sits in the first phone screen of /help; a verified number is one tap from Help.
- **Files:** `src/app/[lang]/help/page.tsx`, `src/components/help/contact-list.tsx`
- **Hand-offs to other packages:** A: add the same row to the phone menu (src/components/shell/panels.tsx).

<a id="d-16"></a>

### D-16. Information completeness is well below the benchmark

- **Severity:** high (source rating, high). **Priority:** P2 (out of scope this round: Needs MAHB data feeds (tariffs, concessionaire directory, facility register) and a content minimum per airport tier; the repository cannot add true facts without them. It is a launch gate.).
- **Sources:** exec-commerce-05 (high). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** Rendered counts: KLIA facilities 21 "Not published", lounges 9, transport 14; 7 lounge listings undated; 8 outlets with hours 0 of 8 and price 0 of 8; parking rates unverified at all 4 KLIA car parks; only KUL, PEN and BKI have pages beyond overview and flights; kch.ts 148 lines, lgk.ts 47. All three panels score info 3.0 on what is there.
- **Acceptance:** At launch every international airport plus Kuching and Kota Kinabalu has transport, parking, facilities (with hours and location) and lounges from MAHB-owned or contracted data; "Not published" counts per airport are tracked as a launch metric.
- **Files:** `src/content/airports/kul.ts`, `src/content/airports/kch.ts`, `src/content/airports/lgk.ts`
- **Deferred (out of scope):** OOS-06 Content minimum for every international airport plus Kuching and Kota Kinabalu.

<a id="d-17"></a>

### D-17. Business revenue channels (advertising, retail space) have no enquiry path

- **Severity:** low (source rating, low). **Priority:** P2 (out of scope this round: Needs verified channels from MAHB commercial and media sales.).
- **Sources:** exec-commerce-20 (low). **Panels naming it:** exec-commerce.
- **Evidence:** The advertising block reads "Dedicated channel: Not published"; retail space names Malaysia Airports (Niaga) Sdn Bhd but offers no enquiry route.
- **Acceptance:** Each business area has a verified contact or enquiry form owned by the responsible MAHB unit.
- **Files:** `src/content/corporate.ts`, `src/app/[lang]/corporate/business/page.tsx`
- **Deferred (out of scope):** OOS-09 Verified enquiry channels for advertising, retail space, cargo and airlines.

<a id="package-e"></a>

## Package E. Platform, performance and security

Root layout and streaming, API routes, proxy and headers, SEO, storage layer, i18n runtime, service worker, concierge server security, CI, budgets, dependencies and engineering docs.

25 items: 8 P0, 16 P1, 1 P2 (1 critical, 4 high, 12 medium, 8 low).

**Owned files**

- `src/app/[lang]/layout.tsx`
- `src/app/[lang]/loading.tsx`
- `src/app/[lang]/error.tsx`
- `src/app/[lang]/not-found.tsx`
- `src/app/[lang]/[...rest]/`
- `src/app/[lang]/offline/`
- `src/app/[lang]/opengraph-image.png`
- `src/app/[lang]/opengraph-image.alt.txt`
- `src/app/global-not-found.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/manifest.ts`
- `src/app/apple-icon.png`
- `src/app/favicon.ico`
- `src/app/icon.svg`
- `src/app/icon1.png`
- `src/app/icon2.png`
- `src/app/api/`
- `src/proxy.ts`
- `next.config.ts`
- `src/lib/seo/`
- `src/lib/locale.ts`
- `src/lib/locale.test.ts`
- `src/lib/preferences.ts`
- `src/lib/stores.ts`
- `src/lib/storage.ts`
- `src/lib/storage.test.ts`
- `src/lib/hooks/index.ts`
- `src/lib/hooks/use-preferences.ts`
- `src/lib/hooks/use-store.ts`
- `src/lib/i18n/client.tsx`
- `src/lib/i18n/translate.ts`
- `src/lib/i18n/index.ts`
- `src/lib/i18n/i18n.test.ts`
- `src/lib/i18n/features/platform.ts`
- `src/lib/providers/api.ts`
- `src/lib/providers/api.test.ts`
- `src/lib/concierge/rate-limit.ts`
- `src/lib/concierge/rephrase.server.ts`
- `src/lib/concierge/fact-guard.ts`
- `src/lib/concierge/request.ts`
- `src/lib/concierge/server.test.ts`
- `src/lib/testing/`
- `src/components/platform/`
- `public/`
- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `vitest.config.ts`
- `eslint.config.mjs`
- `tsconfig.json`
- `next-env.d.ts`
- `lighthouserc.json`
- `e2e/platform.spec.ts`
- `e2e/support/`
- `.github/` at the repository root (only the new malaysia-airports CI workflow and Dependabot config; deploy.yml stays untouched)
- `docs/engineering/`

| ID | Severity | Priority | Finding | Sources |
|---|---|---|---|---|
| [E-01](#e-01) | critical | P0 | Mobile performance below target on every page (Lighthouse 56 to 92, TBT up to 2 s); budgets not enforced | performance-01, performance-15, exec-commerce-19, ux-frequent-17 |
| [E-02](#e-02) | high | P0 | Root loading.tsx streams every page through a fallback: desktop CLS 0.23 to 0.29 and LCP delayed to 4.1 to 4.8 s | performance-04, performance-07 |
| [E-03](#e-03) | high | P0 | Every route ships 250 to 312 KB gzip of first-load JavaScript, 120 KB of it shell code (zod, icon registry, demo generator, Radix) | performance-08, docs-10 |
| [E-04](#e-04) | high | P0 | Concierge buffers the whole request body before enforcing the 4 KB limit | security-01 |
| [E-05](#e-05) | high | P0 | Concierge rate limit keys on a client-supplied X-Forwarded-For: bypass and victim lockout | security-02 |
| [E-06](#e-06) | medium | P0 | No CI for the app; the automated security checks security.md promises do not exist; Chromium only; axe tag set incomplete | security-08, docs-11, docs-12 |
| [E-07](#e-07) | medium | P0 | Any website can make visitors' browsers post to the concierge (no preflight, no origin check) | security-03 |
| [E-08](#e-08) | medium | P0 | No rate limit on /api/flights, /api/health or dynamic pages, and no edge configuration in the repository | security-06 |
| [E-09](#e-09) | medium | P1 | CSP allows inline script with no reporting; the header policy will block checkout integrations | security-07, exec-commerce-14 |
| [E-10](#e-10) | medium | P1 | Optional AI wording path: the fact guard passes web addresses, e-mails and anything typed in the question; tags injectable; no spend cap | security-04 |
| [E-11](#e-11) | medium | P1 | The whole interface dictionary (127 KB, 39 KB gzip) is inlined in every page; the flight page sends it twice | performance-09 |
| [E-12](#e-12) | medium | P1 | Service-worker install on a first visit makes 94 fetches, downloads /en three times and brings the first visit to 1.07 MB | performance-11 |
| [E-13](#e-13) | medium | P1 | security.md and architecture.md differ from the implementation; service-worker cache names are not build-versioned | security-16, docs-13 |
| [E-14](#e-14) | medium | P1 | Canonical and hreflang links only on /offline | docs-02 |
| [E-15](#e-15) | medium | P1 | sitemap.xml omits six corporate pages and 12 of 14 stories (36 URLs) | docs-01 |
| [E-16](#e-16) | medium | P1 | Legacy Wi-Fi, car-rental and fast-track pages redirect permanently to pages without that content | docs-07 |
| [E-17](#e-17) | medium | P1 | Commercial and answer outcomes cannot be measured: no analytics, no attribution | exec-commerce-12 |
| [E-18](#e-18) | low | P1 | Saved-place links accept any URL from localStorage; localeHref passes every scheme through | security-09 |
| [E-19](#e-19) | low | P1 | API hygiene: unbounded date, duplicate parameters accepted, HTML 404 for unknown API paths | security-15 |
| [E-20](#e-20) | low | P1 | 16 high-severity advisories in development dependencies (picomatch ReDoS); production clean | security-10 |
| [E-21](#e-21) | low | P1 | /api/health discloses the Node.js version and environment | security-11 |
| [E-22](#e-22) | low | P1 | Not-found responses carry Cache-Control s-maxage=31536000 | security-12 |
| [E-23](#e-23) | low | P1 | server-only guard missing on the modules that read the API key | security-17 |
| [E-24](#e-24) | low | P1 | A new Intl.NumberFormat is constructed on every plural lookup | performance-16 |
| [E-25](#e-25) | low | P2 | No security.txt or vulnerability disclosure route | security-14 |

<a id="e-01"></a>

### E-01. Mobile performance below target on every page (Lighthouse 56 to 92, TBT up to 2 s); budgets not enforced

- **Severity:** critical (raised from high: found independently by 3 evaluations). **Priority:** P0 (critical severity).
- **Sources:** performance-01 (high), performance-15 (low), exec-commerce-19 (low), ux-frequent-17 (medium). **Panels naming it:** exec-commerce, first-time-access, ux-frequent.
- **Evidence:** Lighthouse 13.6 mobile, median of 3: /en 56, /ms 65, /en/kul 78, board 81, flight detail 64, journey 64, map 68, transport 89, parking 83, shop-dine 67, guides 91, transit 68, concierge 91, corporate 92, airports 81; TBT 338-1,978 ms on every page; simulated TTI 4.3-6.4 s; on the Malaysian median network /en still scores 74 (performance-01). Guidance pages 582-720 KB against a 500 KB budget; 37-64 requests (performance-15). Panels measured home 75-77 (TBT 1,076-1,308 ms) and flight page 66-67 (LCP 4.4-4.8 s) (exec-commerce-19, ux-frequent-17; first-time-access measured /ms 68).
- **Acceptance:** Lighthouse CI on /en, /ms, /en/kul/flights, one flight page and /en/journey (mobile, median of 3) fails the build below performance 95, above TBT 200 ms, CLS 0.1 or LCP 2.5 s, and over byte budgets (home JS 250 KB; guidance pages 500 KB and 40 requests); all 15 measured pages reach performance 95 once the dependent items land.
- **Files:** `lighthouserc.json` (new), `.github/workflows/malaysia-airports-ci.yml` (repository root, new), `package.json`
- **Depends on:** [A-09](#a-09), [A-10](#a-10), [B-06](#b-06), [B-07](#b-07), [E-02](#e-02), [E-03](#e-03)

<a id="e-02"></a>

### E-02. Root loading.tsx streams every page through a fallback: desktop CLS 0.23 to 0.29 and LCP delayed to 4.1 to 4.8 s

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** performance-04 (high), performance-07 (medium).
- **Evidence:** 1440x900, 2 of 2 loads: the footer moves from y=640 out of the viewport, CLS 0.2889 on /en, /ms and /en/kul and 0.2317 on /en/concierge; the fallback is inserted at 57-78 ms, segments revealed by $RC at 108-137 ms (performance-04). Lighthouse mobile median LCP 4.1-4.8 s on /en, flight detail, journey, map, shop-dine and transit, because the LCP element is revealed after the whole body with 300 ms reveal batching; congested Wi-Fi /en 2.9 s (performance-07). Every page under [lang] is wrapped by src/app/[lang]/loading.tsx.
- **Acceptance:** The root src/app/[lang]/loading.tsx is removed (fallbacks only on dynamic segments such as the flight detail page); static pages emit the h1 and lead in the first HTML flush with no $RC reveal; desktop CLS at or under 0.1 on /en, /ms, /en/kul and /en/concierge (2 of 2 loads); Lighthouse mobile LCP at or under 2.5 s on the six pages (median of 3) and on the congested Wi-Fi profile for /en and the board.
- **Files:** `src/app/[lang]/loading.tsx`, `src/app/[lang]/layout.tsx`
- **Hand-offs to other packages:** A: review Suspense fallbacks in src/app/[lang]/[airport]/layout.tsx.

<a id="e-03"></a>

### E-03. Every route ships 250 to 312 KB gzip of first-load JavaScript, 120 KB of it shell code (zod, icon registry, demo generator, Radix)

- **Severity:** high (highest source rating, high; found by 2 evaluations). **Priority:** P0 (high severity).
- **Sources:** performance-08 (medium), docs-10 (high).
- **Evidence:** Build manifest, gzip -9: framework 128.6 KB plus the same eight [lang]/layout chunks 120.1 KB on every route; totals 250.3 (corporate) to 275.3 KB (flight detail), /en 263.0 KB; shell chunks: zod 4 classic plus content schemas 34.1 KB (22-24 KB unused at load), about 145 lucide icons in a name-keyed registry 22.7 KB, the demo flight generator 12.7 KB, Radix 32 KB (performance-08). The earlier documentation review measured 294-312 KB (docs-10). stores.ts imports TERMINAL_IDS from src/content/types.ts, pulling the content schemas into the client.
- **Acceptance:** First-load JS at or under 250 KB gzip on /en and at or under 170 KB on content and guidance pages (same measurement as performance-08); no zod classic or content schemas in client chunks (client storage validation uses zod/mini or hand-written guards; stores.ts and preferences.ts import no runtime values from src/content/types.ts); with the hand-offs done, the icon registry tree-shakes, the demo generator is not in the shell, and the search, concierge and switcher dialogs load on first open.
- **Files:** `src/lib/preferences.ts`, `src/lib/stores.ts`, `src/lib/storage.ts`, `src/app/[lang]/layout.tsx`
- **Hand-offs to other packages:** A: split the icon registry (src/components/ui/icon.tsx) and lazy-load the search, concierge and airport-switcher dialogs (src/components/shell/global-overlays.tsx). B: keep the demo generator out of the shell (dynamic import or server side, see the feed-failure item). D: if TERMINAL_IDS must move, re-export it from a zod-free module in src/content/types.ts.

<a id="e-04"></a>

### E-04. Concierge buffers the whole request body before enforcing the 4 KB limit

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** security-01 (high).
- **Evidence:** A 200,000,000-byte POST returned 413 after 0.68 s, but next-server RSS rose from 212,140 KB to 777,500 KB and stayed there 13 s later; route.ts calls await request.text() and then compares raw.length (UTF-16 units, not bytes) with MAX_BODY_BYTES = 4096 (src/app/api/concierge/route.ts lines 25-38).
- **Acceptance:** Content-Length over 4,096 bytes gets 413 before the body is read; bodies without Content-Length are read as a stream with a byte counter and aborted past 4,096 bytes; a 200 MB POST leaves RSS within 10 MB of baseline; server.test.ts covers both.
- **Files:** `src/app/api/concierge/route.ts`, `src/lib/concierge/server.test.ts`

<a id="e-05"></a>

### E-05. Concierge rate limit keys on a client-supplied X-Forwarded-For: bypass and victim lockout

- **Severity:** high (source rating, high). **Priority:** P0 (high severity).
- **Sources:** security-02 (high).
- **Evidence:** 14 posts with one X-Forwarded-For: 10 x 200 then 429; 30 posts with rotating values: 30 x 200; 30 invalid posts (400) never counted; clientKey() takes the first X-Forwarded-For entry (src/lib/concierge/rate-limit.ts:56); the bucket is per-process memory. With ANTHROPIC_API_KEY set, each allowed request can trigger a paid model call.
- **Acceptance:** The key comes from a trusted source (configured trusted proxy hop or CDN client-IP header), never the first X-Forwarded-For entry; invalid requests are counted; the bucket sits behind a shared-store interface; a global per-minute model-call budget with a circuit breaker exists; a test with rotating X-Forwarded-For values gets 429 after 10.
- **Files:** `src/lib/concierge/rate-limit.ts`, `src/app/api/concierge/route.ts`, `src/lib/concierge/server.test.ts`

<a id="e-06"></a>

### E-06. No CI for the app; the automated security checks security.md promises do not exist; Chromium only; axe tag set incomplete

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P0 (on the security evaluator's fix-before-production list).
- **Sources:** security-08 (medium), docs-11 (medium), docs-12 (low).
- **Evidence:** The repository's only workflow (.github/workflows/deploy.yml) builds the parent curriculum site: no CI for malaysia-airports, no npm audit gate, no CodeQL or other SAST, no Dependabot or Renovate, no secret scanning (security-08, docs-11). Both Playwright projects use Chromium; WebKit (Safari on iPhone) is not covered (docs-12). The e2e axe scans omit wcag21a (ux-frequent-06, tracked in package A).
- **Acceptance:** A workflow at the repository root (.github/workflows/malaysia-airports-ci.yml, paths malaysia-airports/**, pull requests and manual runs) runs npm ci, next typegen, tsc, lint, unit tests, build, Playwright desktop and phone (plus a WebKit phone project if the browser is available, otherwise documented), axe through a shared e2e/support/axe.ts exporting wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa, npm audit --omit=dev --audit-level=high as a gate, CodeQL and gitleaks over full history; Dependabot or Renovate is configured; the workflow passes on a clean checkout.
- **Files:** `.github/workflows/malaysia-airports-ci.yml` (repository root, new), `.github/dependabot.yml` (repository root, new), `e2e/support/axe.ts` (new), `e2e/platform.spec.ts`, `playwright.config.ts`, `package.json`

<a id="e-07"></a>

### E-07. Any website can make visitors' browsers post to the concierge (no preflight, no origin check)

- **Severity:** medium (source rating, medium). **Priority:** P0 (on the security evaluator's fix-before-production list).
- **Sources:** security-03 (medium).
- **Evidence:** A page on another origin sent four no-cors POSTs with Content-Type "text/plain;x=application/json" and the concierge processed them (X-RateLimit-Remaining 9 to 4); curl with Origin https://evil.example and Sec-Fetch-Site cross-site got 200; the check is includes('application/json') (route.ts:34).
- **Acceptance:** Only the exact application/json media type is accepted; requests with Sec-Fetch-Site cross-site, or an Origin other than the site origin, get 403; the cross-origin no-cors test no longer changes X-RateLimit-Remaining.
- **Files:** `src/app/api/concierge/route.ts`, `src/lib/concierge/request.ts`, `src/lib/concierge/server.test.ts`

<a id="e-08"></a>

### E-08. No rate limit on /api/flights, /api/health or dynamic pages, and no edge configuration in the repository

- **Severity:** medium (source rating, medium). **Priority:** P0 (on the security evaluator's fix-before-production list).
- **Sources:** security-06 (medium).
- **Evidence:** 300 burst requests to /api/flights?airport=kul: 300 x 200; /api/health and flight detail pages are unlimited too; no WAF, CDN or infrastructure-as-code exists although security.md section 4 puts limits at the edge first.
- **Acceptance:** Per-route limits for /api/flights, /api/health and dynamic pages are defined as code (proxy or route middleware behind a shared-store interface) and tested (a 300-request burst gets 429 after the limit); edge rules (per-route buckets, bot scoring, body limits) are written as configuration for the chosen host. Deploying them on MAHB infrastructure is OOS-11.
- **Files:** `src/proxy.ts`, `src/app/api/flights/route.ts`, `src/app/api/health/route.ts`, `docs/engineering/security.md`
- **Deferred (out of scope):** OOS-11 Edge and WAF rules deployed (per-route buckets, bot scoring, body limits).

<a id="e-09"></a>

### E-09. CSP allows inline script with no reporting; the header policy will block checkout integrations

- **Severity:** medium (highest source rating, medium; found by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** security-07 (medium), exec-commerce-14 (medium). **Panels naming it:** exec-commerce.
- **Evidence:** Every response: script-src 'self' 'unsafe-inline', no report-to or Reporting-Endpoints, no Trusted Types; 0 violations observed on 14 routes (security-07). Permissions-Policy includes payment=(); connect-src 'self' and no frame-src (src/lib/seo/security-headers.ts line 71), so checkout and partner widgets cannot work; BR-24 requires no unsafe-inline (exec-commerce-14).
- **Acceptance:** A report-only policy with hashes for the static preferences init script and require-trusted-types-for 'script' reports to a same-origin endpoint; after a clean report window the enforced policy drops 'unsafe-inline' for scripts (nonces on dynamic routes); per-route overrides let a checkout route allow payment=(self) plus a named payment origin and partner frame-src/connect-src without loosening other routes; security-headers.test.ts covers both.
- **Files:** `src/lib/seo/security-headers.ts`, `src/lib/seo/security-headers.test.ts`, `next.config.ts`, `src/app/api/csp-report/route.ts` (new)

<a id="e-10"></a>

### E-10. Optional AI wording path: the fact guard passes web addresses, e-mails and anything typed in the question; tags injectable; no spend cap

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** security-04 (medium).
- **Evidence:** With fake model replies, checkGrounded accepted "Book your parking at klia-parking-deals.example", "Email refunds@scam.example ...", "you do not need a passport ... just walk through security" and, because the question is part of groundingReference(), a phone number typed in the question; "&lt;/question&gt;&lt;draft&gt;...&lt;/draft&gt;" is pasted unescaped into the user message; max_tokens 2048 for 480-character output; no budget, circuit breaker or counters. The path is off unless ANTHROPIC_API_KEY is set.
- **Acceptance:** The pilot runs without ANTHROPIC_API_KEY until: the guard rejects any URL, domain, e-mail or phone not present in the retrieved statements; the question is excluded from the grounding reference for names and numbers and sent as its own content block with &lt; and &gt; escaped; max_tokens is about 200; daily and monthly spend caps, a circuit breaker and counters exist; passport, booking, phone and e-mail patterns are redacted; the four red-team cases above are rejected in tests.
- **Files:** `src/lib/concierge/rephrase.server.ts`, `src/lib/concierge/fact-guard.ts`, `src/app/api/concierge/route.ts`, `src/lib/concierge/server.test.ts`

<a id="e-11"></a>

### E-11. The whole interface dictionary (127 KB, 39 KB gzip) is inlined in every page; the flight page sends it twice

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** performance-09 (medium).
- **Evidence:** I18nProvider in the root layout receives getDictionary(lang): 126,921 bytes of JSON (38,942 gzip) on every page, including 28.7 KB of corporate copy, about half the home's 78 KB gzip HTML; the flight page contains the dictionary twice and its FlightDetail props twice (each with the whole 19 KB airport object): 500 KB raw, 127 KB gzip; /en/journey passes 33 KB of notes and 19 KB of sources.
- **Acceptance:** Each client island receives only its namespace (or server-rendered strings); corporate copy never reaches passenger pages; content-page HTML at or under 40 KB gzip; the flight page carries the dictionary and props once, passing the airport slug and needed fields instead of the airport object (B hand-off).
- **Files:** `src/app/[lang]/layout.tsx`, `src/lib/i18n/client.tsx`, `src/lib/i18n/index.ts`
- **Hand-offs to other packages:** B: pass only needed fields in src/app/[lang]/[airport]/flights/[flightId]/page.tsx and src/app/[lang]/journey/page.tsx.

<a id="e-12"></a>

### E-12. Service-worker install on a first visit makes 94 fetches, downloads /en three times and brings the first visit to 1.07 MB

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** performance-11 (medium).
- **Evidence:** First visit to /en (Pixel 7): page 20 requests / 486 KB, RSC prefetch 15 / 55 KB, other 8 / 155 KB, worker install 94 fetches for 28 URLs / 401 KB; total 138 requests, 1.07 MB; /en, /ms and both offline pages fetched with cache: reload, then the current page saved again; Cache Storage 2.5 MB.
- **Acceptance:** A first visit downloads /en once; the worker precaches only the current language's offline page and shell, dedupes asset fetches and starts after network idle; first visit at or under 600 KB and 60 requests; Cache Storage after install at or under 1 MB; sw-routes.test.ts updated.
- **Files:** `src/components/platform/service-worker.ts`, `src/components/platform/sw-routes.ts`, `src/components/platform/sw-client.ts`, `src/components/platform/sw-routes.test.ts`

<a id="e-13"></a>

### E-13. security.md and architecture.md differ from the implementation; service-worker cache names are not build-versioned

- **Severity:** medium (raised from low: found independently by 2 evaluations). **Priority:** P1 (should fix now).
- **Sources:** security-16 (low), docs-13 (low).
- **Evidence:** security.md says only API routes and not-found pages render on the server (flight pages are per request), lists the zod new Function gap as open (fixed), claims per-build cache names (caches are ma-v1-pages/static/data; docs-13), says search terms are never cached (6 recent terms are stored), omits the limiter trust model, and describes section 9 automation that does not exist.
- **Acceptance:** security.md sections 1, 2, 3, 4, 6 and 9 and architecture.md describe the system as built, each control with a dated "verified" line; cache names carry the build id or the document says v1.
- **Files:** `docs/engineering/security.md`, `docs/engineering/architecture.md`, `src/components/platform/sw-routes.ts`

<a id="e-14"></a>

### E-14. Canonical and hreflang links only on /offline

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** docs-02 (medium).
- **Evidence:** Only the offline page uses pageMetadata (src/lib/seo/metadata.ts), so no other page declares a canonical URL or en/ms alternates (sitemap.md F2).
- **Acceptance:** pageMetadata provides canonical and en/ms alternates and every route's generateMetadata uses it (page owners adopt it, hand-off); a crawl finds canonical and both alternates on 100% of sitemap URLs.
- **Files:** `src/lib/seo/metadata.ts`, `src/lib/seo/seo.test.ts`, `src/app/[lang]/layout.tsx`
- **Hand-offs to other packages:** A, B, C, D: call pageMetadata from generateMetadata in the routes you own.

<a id="e-15"></a>

### E-15. sitemap.xml omits six corporate pages and 12 of 14 stories (36 URLs)

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** docs-01 (medium).
- **Evidence:** src/lib/seo/site-routes.ts lines 17 and 47-48 read CORPORATE_PAGES and NEWS_ITEMS instead of the registries the corporate routes use.
- **Acceptance:** sitemap.xml lists every prerendered page in both locales; a test compares sitemap paths with the routes' generateStaticParams output.
- **Files:** `src/lib/seo/site-routes.ts`, `src/app/sitemap.ts`, `src/lib/seo/seo.test.ts`

<a id="e-16"></a>

### E-16. Legacy Wi-Fi, car-rental and fast-track pages redirect permanently to pages without that content

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** docs-07 (medium).
- **Evidence:** air-travel/services/wifi goes to facilities and air-travel/rental-services to transport (src/lib/seo/legacy-redirects.ts lines 80 and 92), where no Wi-Fi or rental content exists (kul.ts lists Wi-Fi details as unverified); the fast-track path goes to the overview (line 77).
- **Acceptance:** Permanent redirects only to pages with equivalent content; otherwise 307 to the closest relevant page; the fast-track path points at the Fast Track record once it exists (D); legacy-redirects.test.ts asserts a content anchor for each destination.
- **Files:** `src/lib/seo/legacy-redirects.ts`, `src/lib/seo/legacy-redirects.test.ts`

<a id="e-17"></a>

### E-17. Commercial and answer outcomes cannot be measured: no analytics, no attribution

- **Severity:** medium (source rating, medium). **Priority:** P1 (should fix now).
- **Sources:** exec-commerce-12 (medium). **Panels naming it:** exec-commerce.
- **Evidence:** 58 page loads (29 URLs) made zero third-party requests and no first-party analytics calls; outbound commercial links carry no referral or campaign parameter; strategy section 7 measures the north-star (answered journey rate) and commercial metrics through partner-confirmed bookings.
- **Acceptance:** First-party, consent-aware, aggregate analytics (no third-party hosts, no personal data) records the answer state for each top task and commercial hand-off clicks; outbound commercial links carry a campaign parameter; the privacy page describes it (D hand-off). Partner referral codes and partner-confirmed bookings are OOS-13.
- **Files:** `src/components/platform/analytics.ts` (new), `src/app/api/metrics/route.ts` (new), `src/app/[lang]/layout.tsx`
- **Hand-offs to other packages:** D: describe the measurement on src/app/[lang]/privacy/page.tsx.
- **Deferred (out of scope):** OOS-13 Partner referral codes and partner-confirmed bookings for commercial metrics.

<a id="e-18"></a>

### E-18. Saved-place links accept any URL from localStorage; localeHref passes every scheme through

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** security-09 (low).
- **Evidence:** With ma:journey:v1 tampered, /en/journey rendered links to https://evil.example/login, //evil.example/x and data:text/html,...; React 19 blocked javascript:. SavedPlaceSchema.href is z.string().min(1); localeHref returns any value matching a scheme or // unchanged.
- **Acceptance:** SavedPlaceSchema.href accepts only same-site paths (^/(?!/)); localeHref passes through only https:, mailto: and tel:; tampered entries are dropped or rendered as text; storage.test.ts and locale.test.ts cover the three cases.
- **Files:** `src/lib/stores.ts`, `src/lib/locale.ts`, `src/lib/locale.test.ts`, `src/lib/storage.test.ts`

<a id="e-19"></a>

### E-19. API hygiene: unbounded date, duplicate parameters accepted, HTML 404 for unknown API paths

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** security-15 (low).
- **Evidence:** /api/flights accepts date=1900-01-01 and 9999-12-31 and duplicate airport parameters (first wins); unknown /api/* paths return the 25 KB HTML not-found page; HEAD /api/flights returns 400.
- **Acceptance:** date bounded to today minus 1 to plus 2 days; repeated parameters rejected with 400; unknown /api/* paths return JSON 404; HEAD handled consistently; api.test.ts covers each.
- **Files:** `src/lib/providers/api.ts`, `src/lib/providers/api.test.ts`, `src/app/api/[...rest]/route.ts` (new)

<a id="e-20"></a>

### E-20. 16 high-severity advisories in development dependencies (picomatch ReDoS); production clean

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** security-10 (low).
- **Evidence:** npm audit: 16 high via GHSA-fc5q-39xc-vjpf (picomatch &lt;=4.0.7) through vitest and eslint-config-next; npm audit --omit=dev: 0; suggested fixes are semver-major downgrades.
- **Acceptance:** npm audit --omit=dev stays at 0 as a CI gate; dev advisories resolved by upstream patch releases (no downgrades) or recorded as accepted risk with a review date.
- **Files:** `package.json`, `package-lock.json`

<a id="e-21"></a>

### E-21. /api/health discloses the Node.js version and environment

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** security-11 (low).
- **Evidence:** Body includes build.node "v22.23.4", build.environment "production", build.version "0.1.0".
- **Acceptance:** The public health response returns status and build id only; runtime details only to authenticated monitoring.
- **Files:** `src/app/api/health/route.ts`, `src/lib/providers/api.ts`

<a id="e-22"></a>

### E-22. Not-found responses carry Cache-Control s-maxage=31536000

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** security-12 (low).
- **Evidence:** /en/nope-xyz and /xyz.txt return 404 with s-maxage=31536000, so a CDN would keep a 404 for a year and arbitrary URLs can fill the cache.
- **Acceptance:** 404 responses carry s-maxage of 60 s or less (or no shared caching), verified with curl on both URLs.
- **Files:** `next.config.ts`, `src/app/global-not-found.tsx`

<a id="e-23"></a>

### E-23. server-only guard missing on the modules that read the API key

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** security-17 (low).
- **Evidence:** The server-only package is not installed; knowledge.server.ts and rephrase.server.ts are server-only by name only. Today the Anthropic endpoint appears only in a server chunk.
- **Acceptance:** server-only is installed and imported at the top of rephrase.server.ts and (B hand-off) knowledge.server.ts; importing either from a client component fails the build.
- **Files:** `package.json`, `src/lib/concierge/rephrase.server.ts`
- **Hand-offs to other packages:** B: add import 'server-only' to src/lib/concierge/knowledge.server.ts.

<a id="e-24"></a>

### E-24. A new Intl.NumberFormat is constructed on every plural lookup

- **Severity:** low (source rating, low). **Priority:** P1 (should fix now).
- **Sources:** performance-16 (low).
- **Evidence:** CPU profile of /en/guides: the i18n count function is the largest app-code self time after the framework (61 ms); translate.ts:79 and the client count helper construct Intl.NumberFormat per call.
- **Acceptance:** One formatter per language cached at module level in translate.ts and the client helper; the count self time is under 5 ms in the same profile.
- **Files:** `src/lib/i18n/translate.ts`, `src/lib/i18n/client.tsx`

<a id="e-25"></a>

### E-25. No security.txt or vulnerability disclosure route

- **Severity:** low (source rating, low). **Priority:** P2 (out of scope this round: Needs MAHB's disclosure contact and policy; publishing a placeholder contact would be worse than none.).
- **Sources:** security-14 (low).
- **Evidence:** /.well-known/security.txt returns 404.
- **Acceptance:** An RFC 9116 security.txt (contact, expires, policy, preferred languages en and ms) with MAHB's disclosure contact is published before launch.
- **Files:** `public/.well-known/security.txt` (new)
- **Deferred (out of scope):** OOS-12 security.txt with a real disclosure contact and policy.

<a id="out-of-scope-for-this-round"></a>

## Out of scope for this round

These need MAHB data, partners or people outside the engineering team. "Launch gate" means the product must not launch publicly until it is closed, even though this round cannot close it. A public pilot can run with the product's honest "Not published" states in their place.

| ID | What | Backlog items | Needs | Why out of scope now | Launch gate |
|---|---|---|---|---|---|
| OOS-01 | Official flight feed connected behind the provider interface | B-09 | MAHB operational data agreement, credentials and an integration environment | The provider interface, server-side caching and the last-known and failed states are in scope (see item); the feed itself is not available to the team. | yes |
| OOS-02 | Live operational status feeds (Aerotrain, inter-terminal train, immigration queues) and a notices CMS with bilingual approvals | B-01 | MAHB operations feeds and a CMS decision with publishing roles | The status line fed by dated notices and demo-labelled waits is in scope; real-time sources and editorial workflow are not. | yes |
| OOS-03 | Official parking tariff in the calculator and a dated, attributed booking deep link | C-01 | The car-park operator's tariff source and a booking partner agreement (product, entry, exit, referral) | The price-first layout, dated source ranges and date pass-through where the site accepts them are in scope; true totals need the tariff. | yes |
| OOS-04 | Lounge access rules, prices and booking | C-11 | Each lounge operator | No truthful price or access rule can be added from the repository. | yes |
| OOS-05 | Outlet hours, price bands, images, reserve-and-collect and a labelled offer slot | C-05 | Concessionaire directory feed; Malaysia Airports (Niaga) for reserve-and-collect | Hiding dead filters is in scope; the retail data is not. | no |
| OOS-06 | Content minimum for every international airport plus Kuching and Kota Kinabalu | D-16 | MAHB data feeds (tariffs, concessionaire directory, facility register) | Facts must come from the operator or contracted sources. | yes |
| OOS-07 | Accessibility facility data for KLIA T1 and T2 (toilets, lifts, buggy and wheelchair points, accessible bays, step-free status per mode and station, special-assistance service) | D-04 | MAHB facilities and special-assistance teams | Airline assistance rules and an honest list of gaps are in scope; located facilities are not. | yes |
| OOS-08 | Operator-grade sourcing: MAHB-owned or contracted sources for every published fact; brand and legal review of warnings | D-06 | MAHB brand, legal and content owners | The written source policy, its content test and the reworded warning are in scope. | yes |
| OOS-09 | Verified enquiry channels for advertising, retail space, cargo and airlines | D-17 | MAHB commercial and media sales | No verified channel is published. | no |
| OOS-10 | Flight alerts delivered when the page is closed (web push service, e-mail provider, server-side flight watcher) | B-04 | Backend hosting, an e-mail provider and a data-protection review | The follow control, fallbacks and provider interface are in scope; delivery infrastructure is not. | yes |
| OOS-11 | Edge and WAF rules deployed (per-route buckets, bot scoring, body limits) | E-08 | MAHB hosting and CDN choice | App-level limits and the rules written as configuration are in scope. | yes |
| OOS-12 | security.txt with a real disclosure contact and policy | E-25 | MAHB security team | A placeholder contact would be worse than none. | yes |
| OOS-13 | Partner referral codes and partner-confirmed bookings for commercial metrics | E-17 | Partner agreements (parking, Fast Track, lounges) | First-party aggregate analytics and campaign parameters are in scope. | no |
| OOS-14 | Native-speaker review of the Malay interface and content, and confirmation of official Malay airport names | A-25, D-09, D-03, D-06 | A native Malay editor (MAHB or contracted) | Draft fixes are in scope; sign-off is not. | yes |
| OOS-15 | Moderated usability study of the top eight tasks in both languages, including screen-reader and magnifier users | none (study) | Research budget and recruited participants in Malaysia (plan in docs/qa/usability.md) | Not a code defect. Every task result in this backlog comes from scripted walkthroughs and expert review, not from passengers; no physical screen reader was used. | yes |

<a id="traceability"></a>

## Traceability

Every source finding and the backlog item it went to.

- **Performance:** 01 → E-01, 02 → B-06, 03 → A-09, 04 → E-02, 05 → A-10, 06 → B-07, 07 → E-02, 08 → E-03, 09 → E-11, 10 → A-10, 11 → E-12, 12 → B-15, 13 → A-19, 14 → A-09, 15 → E-01, 16 → E-24
- **Accessibility:** 01 → A-05, 02 → A-02, 03 → B-10, 04 → A-06, 05 → A-23, 06 → B-18, 07 → A-22, 08 → A-16, 09 → A-11, 10 → C-10, 11 → A-06, 12 → A-24, 13 → D-14, 14 → B-20, 15 → B-19
- **Usability:** 01 → C-02, 02 → A-07, 03 → A-03, 04 → B-02, 05 → C-04, 06 → A-01, 07 → C-03, 08 → A-15, 09 → B-17, 10 → B-03, 11 → B-01, 12 → C-07, 13 → B-08, 14 → A-17, 15 → A-21, 16 → A-28, 17 → A-14, 18 → A-04, 19 → C-01, 20 → A-26, 21 → B-15, 22 → D-15, 23 → D-03, 24 → A-18, 25 → C-06
- **Content integrity:** 01 → B-05, 02 → A-04, 03 → B-05, 04 → D-01, 05 → D-01, 06 → D-01, 07 → D-10, 08 → D-08, 09 → D-09, 10 → A-24, 11 → D-03, 12 → D-12, 13 → D-13
- **Security:** 01 → E-04, 02 → E-05, 03 → E-07, 04 → E-10, 05 → B-14, 06 → E-08, 07 → E-09, 08 → E-06, 09 → E-18, 10 → E-20, 11 → E-21, 12 → E-22, 13 → A-31, 14 → E-25, 15 → E-19, 16 → E-13, 17 → E-23
- **Panel: executive and commerce:** 01 → D-02, 02 → C-01, 03 → B-09, 04 → B-01, 05 → D-16, 06 → D-05, 07 → B-13, 08 → A-01, 09 → C-11, 10 → C-05, 11 → D-06, 12 → E-17, 13 → B-04, 14 → E-09, 15 → A-13, 16 → C-02, 17 → B-08, 18 → C-06, 19 → E-01, 20 → D-17
- **Panel: first-time traveller and accessibility:** 01 → B-11, 02 → D-04, 03 → B-03, 04 → D-11, 05 → D-05, 06 → A-02, 07 → C-08, 08 → A-16, 09 → B-08, 10 → D-07, 11 → A-09, 12 → A-11, 13 → A-12, 14 → C-09, 15 → D-03, 16 → A-25, 17 → A-03, 18 → B-12, 19 → A-15, 20 → D-08, 21 → A-27
- **Panel: design director and frequent traveller:** 01 → B-02, 02 → A-08, 03 → B-04, 04 → D-02, 05 → A-03, 06 → A-02, 07 → A-01, 08 → B-12, 09 → B-14, 10 → B-16, 11 → B-08, 12 → C-03, 13 → B-13, 14 → C-01, 15 → A-14, 16 → A-13, 17 → E-01, 18 → A-11, 19 → A-17, 20 → B-21, 21 → D-06, 22 → A-13, 23 → A-20
- **Documentation review (earlier, from writing the sitemap and architecture docs):** 01 → E-15, 02 → E-14, 03 → B-08, 04 → A-29, 05 → A-12, 06 → C-06, 07 → E-16, 08 → A-30, 09 → A-25, 10 → E-03, 11 → E-06, 12 → E-06, 13 → E-13, 14 → B-01
