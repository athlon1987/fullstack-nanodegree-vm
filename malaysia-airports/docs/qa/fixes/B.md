# Fix log: package B (Flights, journey and concierge)

Round: fix round after the QA and panel evaluation, resumed after the interrupted attempt
(commit 5d651e6, files listed in `docs/qa/fixes/_interrupted-attempt.md`). I reviewed every file that
attempt changed for package B against the findings, kept what was correct, finished what was partial,
fixed what was wrong, and continued with the rest. Date: 21 November 2026.

## Summary

| ID | Priority | Status | Done in |
|---|---|---|---|
| B-01 | P0 | Fixed on B's side; A and C still have to render it (hand-offs) | first attempt, completed this round |
| B-02 | P0 | Fixed | first attempt (reviewed) |
| B-03 | P0 | Fixed (optional "leave home by" not built) | first attempt (reviewed) |
| B-04 | P0 | Fixed (closed-browser delivery is OOS-10) | first attempt (reviewed) |
| B-05 | P0 | Fixed | first attempt, gap fixed this round |
| B-06 | P0 | Partially fixed: all the code changes are in, but the 200 ms target has not been measured on a production build | first attempt and this round |
| B-07 | P0 | Fixed (slow-4G LCP still to be confirmed on a production build) | first attempt and this round |
| B-08 | P0 | Fixed (Fast Track and autogate content come from D-02 and D-07) | first attempt and this round |
| B-09 | P0 | Fixed on B's side (home search is A; official feed is OOS-01) | first attempt (reviewed) |
| B-10 | P0 | Fixed | first attempt, test added this round |
| B-11 | P0 | Fixed | first attempt, gap fixed this round |
| B-12 | P0 | Fixed | first attempt, test added this round |
| B-13 | P0 | Fixed, with notes | first attempt (reviewed) |
| B-14 | P0 | Fixed; the cache header still needs checking on `next start` | first attempt (reviewed); **cross-package: `src/proxy.ts` (E)** |
| B-15 | P1 | Fixed on B's side (the Search-sheet entry is A) | this round |
| B-16 | P1 | Fixed | first attempt (reviewed) |
| B-17 | P1 | Fixed; needs MAHB data for the pick-up point and fee (D hand-off) | first attempt (reviewed) |
| B-18 | P1 | Fixed | first attempt, refined this round |
| B-19 | P1 | Fixed | first attempt, test hardened this round |
| B-20 | P1 | Fixed | this round |
| B-21 | P1 | Fixed | first attempt (reviewed) |

Checks run at the end of this round (shared folder, own dev server on port 3202 with `NEXT_DIST_DIR=.next-B`):

- `npx tsc --noEmit`: clean (whole project).
- `npx eslint` on every owned path and both e2e specs: clean.
- `npx vitest run`: 31 files, 429 tests passing (whole project).
- `e2e/flights.spec.ts` and `e2e/concierge.spec.ts`, desktop (1440x900) and phone (Pixel 7 at 390x844), against
  the dev server: 80 passed and 1 skipped (the existing .ics download check on the phone). The 3 tests that
  failed under load in an earlier run (the saved-flight announcement and the concierge CLS check) were made
  robust as described below, then passed 12 out of 12 times on repeat.
- Screenshots viewed: flight page at 390 px (light), the immigration step with status lines and demo
  queue estimates at 390 px, the board at 390 px (dark), the concierge page after an answer at 390 px
  (light) and 1440 px (dark), and My journey with a saved flight at 1440 px.
- Not run: `next build` (the verification engineer runs it). Every number measured here comes from the
  dev server.

## Cross-package changes

- **`src/proxy.ts` (package E)**, made by the first attempt and kept: it calls `flightRouteResponse()` from
  `src/lib/providers/flight-route.ts` and adds `'/(en|ms)/:airport/flights/:id'` to the matcher, so that
  malformed or unknown flight ids get a small 404 and codeshare numbers get a 308, before any page is
  built (B-14). It adds 6 lines and changes 1. Nothing else outside B's paths was changed in either attempt.
- No shared dictionary (`en.ts`, `ms.ts`) was touched. All new copy is in `src/lib/i18n/features/flights.ts`
  and `src/lib/i18n/features/concierge.ts`, appended in both languages.

## Hand-offs still open

| To | What | Why |
|---|---|---|
| A | Render `<OpsStatusSection airport="kul" />` in `src/components/home/notice-strip.tsx` and on the KLIA overview (`src/app/[lang]/[airport]/page.tsx`). The default immigration line shows the demo security and departure-immigration queue estimates the overview needs. | B-01: B provides the component, A's pages show it. At the time of writing, no file outside B uses it. |
| C | Render `<OpsStatusSection airport="kul" services={['inter-terminal-train', 'inter-terminal-shuttle']} />` in `src/components/guides/transit-planner.tsx`. | B-01 |
| A | Show stale and failed feed states in `src/components/flights/flight-search-box.tsx` (it still uses the browser generator through `useFlightProvider`). The home board preview, the journey teaser, the home saved-flight card, site search (A) and the commerce gate panel (C) also still use it. | B-09: until they move to the feed (`useFlightFeed`), the generator stays in their bundles. |
| A | Add a concierge entry to the phone Search sheet (`command-palette.tsx` or `mobile-bar.tsx`). `openConcierge(question)` now answers at once, with no consent step. | B-15 |
| A | The fonts swap on a first visit and move the footer on every page (CLS 0.14 to 0.29 on desktop, measured on `/en/privacy`, `/en/journey` and `/en/concierge`). | A-10. My CLS checks therefore load each page once to warm the font cache before measuring the page's own shifts. |
| D | Render `<NeedsControl headingLevel={2} />` on `/accessibility`. | B-11 |
| D | Publish the Fast Track record (D-02), the immigration and autogate notes for departing citizens and older travellers (D-07), and sourced pick-up and e-hailing notes for the meeting topic in `src/content/airports/kul.ts`. | B-08, B-13 and B-17 already read these records when they exist. Until then they say honestly that the information is not published. |
| C | The parking page reads only `?t=`. Journey links already carry `from` and `to` (ISO) for the booking hand-off (C-01). | B-13 |
| E | Update `docs/engineering/security.md` section 1 for the flight-id guard. Check on `next start` that a valid flight page keeps `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=60` from the proxy (the dev server always sends `no-store`). Serve the feed limits through `/api/flights`. | B-09, B-14 |

## Findings

### B-01. Operational status layer and queue times (P0, critical)

**Status:** fixed for this round on B's side. The hand-offs to A and C are open. Live feeds and a notices
CMS are OOS-02.

**What changed**

- First attempt:
  - `src/lib/providers/ops-services.ts`: the services and how each is recognised in the notices.
  - `opsStatus()` in `src/lib/providers/demo-operations.ts`: each service gets a state of notice in
    effect, planned within 14 days, or clear. Each line has the time it was checked, the source notice and
    demo queue estimates.
  - `src/components/flights/ops-status.tsx`: a client component, with a skeleton of the same height until
    the clock is read. When nothing applies it says "No disruption reported in our sources as of hh:mm;
    check the signs".
  - `src/components/flights/ops-status-section.tsx`: a server drop-in for A and C.
  - `src/lib/journey/index.ts`: steps carry `ops`. A C gate gets the Aerotrain line; the security step and
    the arrival immigration step get the immigration line; a change of terminal gets the train and shuttle
    lines.
- This round:
  - Fixed a bug where arrival immigration queues were never shown. The immigration service only carried
    departure checkpoints, so the arrival step's filter always came back empty. It now carries security,
    departure immigration and arrival immigration (`ops-services.ts`), and each step picks its own.
  - Dropped the immigration line from domestic departures, which have no immigration check
    (`journey/index.ts`).

**Verified**

- `providers.test.ts`: active, upcoming and no-notice states. A fare notice is not mistaken for a train
  disruption. Updated because the intended behaviour changed: the immigration line now has 3 demo
  checkpoints, departure and arrival.
- `journey.test.ts`: the Aerotrain line at a C gate, none at a G gate, the immigration line at security on
  international flights, none on domestic ones.
- Screenshot of the security step at 390 px: the immigration line shows "No disruption reported in our
  sources as of 09:40; check the signs", security and departure-immigration estimates, and the Demo tag.

### B-02. The timeline marks the wrong step as "Now" (P0)

**Status:** fixed by the first attempt. Reviewed and kept.

**What changed:** in `src/lib/journey/index.ts`, timed steps have an `endTime` (check-in closes, the gate
closes, landing), and `finalise()` moves on from a step once it has ended. Check-in after closing says
"Check-in closed at hh:mm" and asks the passenger to contact the airline, or carry on to security if they
have checked in. A departed flight is reduced to one terminal "departed" step, and a cancelled one to one
disruption step; neither sends anyone anywhere. Gate closed then reads "Gate closed at …".

**Verified:** the `journey.test.ts` B-02 block covers check-in close + 1 min, check-in open, boarding,
departure + 1 min, cancelled (departing, arriving and meeting journeys), and landed and not yet landed
arrivals.

### B-03. The phone flight page does not answer first (P0)

**Status:** fixed by the first attempt. The optional "leave home by" line is not built: the flight page
has no chosen transport mode to time it from.

**What changed:** `src/components/flights/flight-summary.tsx` adds a summary line between the title and
the status card. It gives the next action and its time ("Be at KLIA Terminal 1 by hh:mm (estimate) ·
Check in … · Boarding hh:mm", or the current step once that time has passed) and links to the timeline
step. The page's lead paragraph was removed (it was the repeated route).

**Verified:** in the e2e "answers first on a 360 px phone" test (EN and MS, 100% and 125% text at
360x780), the summary sits above the bottom bar and its link points at `#journey-step-…`; all 4 passed.
In the screenshot at 390x844, the summary and the start of the status card are both in the first screen.

### B-04. Flight alerts (P0)

**Status:** fixed by the first attempt. Delivery to a closed browser by push or e-mail is OOS-10.

**What changed**

- A Follow button sits next to Save in the action row directly under the status card
  (`flight-actions.tsx`).
- `flight-alerts-panel.tsx` (`FollowPanel`) states exactly what is delivered today. Where the
  Notification API is missing, it explains why and, on iPhone, how to add the site to the Home Screen. It
  always offers the e-mail follow.
- `src/lib/providers/follow.ts` defines the `FollowChannel` interface and a labelled
  `DemoEmailFollowChannel`. That channel keeps the address on this device only and sends nothing.

**Verified:** e2e "offers Follow next to Save with an e-mail option …" (including axe) and "without
browser notifications, explains the alternatives …" both passed on desktop and phone.

### B-05. No demo label in view on board rows and flight values (P0)

**Status:** fixed.

**What changed**

- First attempt:
  - `demo-mark.tsx`: a compact Demo tag.
  - Sticky hour-group headers carry the tag, in both the card and table layouts (`flight-board.tsx`).
  - The check-in, gate and belt values in the status card carry it (`flight-status-hero.tsx`).
- This round: on an arrival page at 390x844, the terminal, belt (when not yet assigned), flight time and
  aircraft values had no label in view. That page has no gate or counters, so nothing else in that column
  carried one. The terminal and belt values of arrivals now carry the tag. Departures already had it on
  check-in and gate.

**Verified**

- The e2e in-view measurement now runs at exactly 390x844 on the phone and 1280x900 on desktop, on
  `/en/kul/flights`, `/ms/kul/flights`, `/en/pen/flights`, departure page `mh2626-20261118-d` and arrival page
  `mh2627-20261118-a`. Every one reports 0 unlabelled.
- The spec runs in CI with the rest of `e2e/`.

### B-06. Main-thread cost while typing in the board (P0)

**Status:** partially fixed. Every change the acceptance lists is in the code. The 200 ms target has not
been measured on a production build, which is the verification engineer's step.

**What changed**

- First attempt:
  - The demo boards are generated on the server and cached per airport, date, direction and instant
    across provider instances (`demo-flights.ts`).
  - Airport offsets are computed once per day, with no `formatToParts` per flight (`time.ts`).
  - At most 40 rows render, with "Show more".
  - The pools for both directions are computed once per refresh, so changing direction does not rebuild
    them.
- This round:
  - The search field now keeps its own text (`BoardSearchField` in `board-toolbar.tsx`), so a keystroke
    re-renders only the field. The list follows in a transition (`useTransition`).
  - The URL's `q` is merged in once typing pauses (400 ms), not on every keystroke.
  - A new direction renders as a deferred value. The previous list stays dimmed under the new tab until it
    is ready.
  - `FlightRow` is memoised on the flight's identity (`flight-row.tsx`).

**Verified**

- `providers.test.ts` and `time.test.ts` cover the shared caches and the per-day offsets.
- On the dev server, with a Pixel 7 profile and 4x CPU throttling, I measured each interaction with Event
  Timing over 3 runs of typing "MH", 2 backspaces and a tab switch:
  - Before this round's change: keystrokes took 744 to 1,296 ms.
  - After it: keystrokes took 144 to 200 ms and the tab switch 192 to 232 ms. Leaving search mode (the
    first backspace) still took 320 to 520 ms.
- These are development-build numbers, which overstate React's cost. Confirm on `next build && next start`
  with the same profile.

### B-07. My journey skeleton swap: CLS and LCP (P0)

**Status:** fixed. LCP on applied slow 4G still needs a Lighthouse run on a production build.

**What changed**

- First attempt:
  - The storage hook's server snapshot is the empty journey, so the server HTML holds the empty state.
  - Saved flights replace it inside a first-screen minimum height.
  - Each saved airport's notes, notices and sources are fetched on demand from the static route
    `/[lang]/journey/content/[airport]`, instead of 52 KB of props.
- This round:
  - The page reads the language with `next/root-params`, as the concierge page does, and no longer wraps
    the page in a Suspense fallback that the content then replaced (`src/app/[lang]/journey/page.tsx`).
  - The JSX indentation in `my-journey.tsx` was fixed.

**Verified**

- e2e: "the empty state is in the server HTML" passed.
- On the dev server I measured the page's own CLS over 2 loads each, after warming the font cache (see the
  A-10 hand-off):
  - Empty: 0 on the phone and 0 on desktop.
  - With a saved flight: 0.034 then 0 on the phone, and 0.006 on desktop.
- LCP on the dev server without throttling was 0.3 to 0.6 s.

### B-08. Concierge direct answers (P0)

**Status:** fixed. The Fast Track answer is an honest "not published, ask …" until D-02 publishes the
record. The autogate answers use whatever D publishes; today they give the existing sourced notes.

**What changed**

- First attempt:
  - New slot-specific intents and handlers in `understand.ts`, `engine.ts` and `types.ts`, with copy in
    `features/concierge.ts`: `fare`, `airline-terminal`, `lounge` (ranked by gate and flight context),
    `fast-track`, `duty-free`, `service-status` (reads the dated notices), `immigration` and `arrival-time`.
  - Accessibility qualifiers ("accessible", "step-free", "elderly") filter transport answers to step-free
    facts, or answer "not published, ask the operator or an information counter".
- This round I probed variants of each question in both languages and fixed what came back wrong:
  - A fare we do not have ("bus fare to KL Sentral", "KLIA Transit") gave no statement at all. It now
    leads with "A fare for … is not published in our sources", then what each stop's record does say,
    with its sources.
  - "Is the shuttle bus between terminals running?" led with the car-park shuttle. A status question now
    leads with the status line, then the inter-terminal record (which is preferred over the car-park
    shuttle). That record is no longer dropped as a near-duplicate of the status line.
  - "Adakah bas ulang-alik antara terminal beroperasi?" is now recognised as a status question.
  - "Di mana teksi mesra OKU?" fell to the general assistance topic, and "Laluan tanpa tangga ke KLIA
    Ekspres?" to a generic transport list. A way of travelling with an access qualifier is now a transport
    question with step-free filtering, and "tanpa tangga" and "tiada tangga" count as qualifiers.
  - "How early should I arrive for a domestic flight?" only stated the 3-hour international rule. It now
    leads with the published guide step that gives both 3 hours international and 2 hours domestic, with
    its source, then offers the flight lookup.

**Verified**

- `engine.test.ts`:
  - Every question quoted in ux-frequent-11, exec-commerce-17, first-time-access-09, usability-13 and
    docs-03 is in the B-08 block, with its expected intent and first statement.
  - All of them, plus 11 new variants in both languages, are in the BR-20 evaluation set. That set checks,
    in both languages and 7 contexts, that every answer is grounded with sources or escalates honestly.
  - New tests for the Malay direct answers, status-first answers, Malay access qualifiers, fares we do not
    have, and domestic "how early".
- 58 concierge tests pass.

### B-09. Feed failure and last-known data; flights generated in the browser (P0)

**Status:** fixed on B's side. Connecting the official feed is OOS-01. Home search is A's hand-off.

**What changed (first attempt, reviewed)**

- The server feed `src/app/[lang]/[airport]/flights/feed/route.ts` serves boards through the provider
  interface.
- `ResilientFlightFeed` (`resilient.ts`) caches each board for 30 s and times the source out after 4 s. On
  failure it serves the last good answer, marked stale with its age.
- In the browser, `use-flight-feed.ts` gives up after 8 s, keeps the last good answer in memory and reports
  `live`, `stale` or `error` with a retry. `SnapshotFlightProvider` answers lookups from the fetched boards.
- `FeedNotice` shows last-known data with its time and age, or an error with "Try again". It is used on
  the board, the flight page and My journey.
- The demo generator no longer ships in those three pages.

**Verified**

- `providers.test.ts` covers the chaos cases (the source throws, times out, or sends old data) and runs a
  contract test against the official stub. That stub errors clearly and never invents data.
- e2e "keeps last-known flights with their age when a refresh fails …":
  - The stale notice shows within 2 s of the failure.
  - With nothing cached, an error shows within 10 s and "Try again" recovers.

### B-10. Old times shown only by strikethrough (P0)

**Status:** fixed.

**What changed**

- First attempt: the struck and current times are `aria-hidden`, and a visually hidden sentence uses the
  flight page's wording: "Scheduled 17:25, now 18:20" and "Cancelled, was 17:25". This applies to the board
  table, the phone list (`flight-row.tsx`) and the saved-flight card.
- This round: added an accessibility-tree check to the e2e test.

**Verified:** in the e2e "says when the scheduled time has changed, in words …" test, `ariaSnapshot()` of
the arrivals board (`?s=delayed,cancelled`) contains both sentences and no bare struck time. It passed on
desktop and phone.

### B-11. Assistance needs cannot be set (P0)

**Status:** fixed.

**What changed**

- First attempt:
  - `src/lib/needs.ts`: the needs store, using `createStore` (`ma:needs:v1`, kept on the device).
  - `src/components/flights/needs-control.tsx` (`NeedsControl`) offers wheelchair, step-free, older
    traveller and travelling with someone who needs help.
  - `useJourneyPreferences()` passes the needs to `buildJourney` from both callers. Any need adds the
    assistance step, with the airline's published notice period or an honest "not published", and the
    airport service. Mobility needs add `sf=1` to map links.
- This round: the control was missing from My journey, which the acceptance requires. It now sits under
  the saved flights, with the trip options when a departure is saved (`my-journey.tsx`).

**Verified:** `journey.test.ts` covers departing and arriving journeys, an unpublished notice period, and
no needs. The e2e "My needs adds the assistance step and step-free map links" test checks the 48-hour MH
notice, `sf=1` on every map link, and that My journey uses the same need; it passed on desktop and phone.

### B-12. Check-in row per cabin (P0)

**Status:** fixed.

**What changed**

- First attempt:
  - `Flight.checkInDesks` (per cabin) and `bagDrop` (`src/lib/flights/types.ts`, demo provider).
  - `checkInLines()` (`src/lib/flights/check-in.ts`) builds up to 3 lines, used by both the status card and
    the timeline.
  - With no row from the feed, the card shows the airline's published check-in area from the content
    layer, with its provenance and sources (`publishedCheckInFor`, `journey-content.ts`).
- This round: added a test across the whole demo board.

**Verified:** the new `journey.test.ts` case covers every KLIA departure in the demo board at 09:40 on 18
November. With feed rows, every card line (cabins and bag drop) appears in the timeline's check-in step in
both languages. Without them, neither the card nor the timeline invents a row. A screenshot shows "Check
in: Economy: Row H, counters 1-18" in the summary, matching the timeline note.

### B-13. Flight context in links; gate, cabin and dwell time (P0)

**Status:** fixed, with notes.

**What changed (first attempt, reviewed)**

- Links carry context:
  - shop-dine: `?gate=T1-C27&t=T1`;
  - transport: `?t=`;
  - parking: `?t=` plus `from`, the arrive-by time.
  - Meeting someone gets `from` and `to`, a 3-hour window around the landing time.
- The "time to spare" step lists the lounges and outlets near the gate after security, taken from their
  published locations. Lounges come first with lounge access.
- Two remembered toggles (`src/lib/journey/trip-options.ts`, in `NeedsControl`): hand luggage only, which
  makes the arrive-by time an hour later as an Estimated value and offers online check-in, and business or
  lounge access.
- An optional Fast Track step, never preselected, follows security on international departures when the
  content publishes the record.

**Notes**

- The departing parking link has no `to`, because the return date is unknown and is not invented.
- The parking page does not read `from` and `to` yet (C).
- The Fast Track step appears once D-02 lands.
- The airlines' deadlines for hand luggage only are not published, so the adjustment is Estimated.

**Verified:** the B-13 block in `journey.test.ts` (the parameters, the lounge near the gate, hand luggage,
Fast Track).

### B-14. Codeshare and unknown flight ids (P0)

**Status:** fixed. The `s-maxage` header still has to be checked on a production server (E hand-off).

**What changed (first attempt, reviewed)**

- `src/lib/providers/flight-route.ts`, called from `src/proxy.ts` (**cross-package**):
  - A codeshare number returns a 308 to the operating flight for that date and airport.
  - Malformed, oversized or unknown ids get a 404: a self-contained 1.4 KB page that still offers a board
    search, before any page is built.
  - A real flight is marked `public, max-age=0, s-maxage=60, stale-while-revalidate=60`.
- This round I corrected the page comment, which pointed at a file that does not exist.

**Verified**

- curl against the dev server:
  - `zz9999-20990101-d`, an encoded `<img>` tag and a 1,600-character id: 404 with 1,374 bytes each.
  - `qr5700-20261118-d`: 308 to `mh2630-20261118-d`.
- e2e:
  - Codeshare 308.
  - Unknown id: 404 under 30 KB, with search and axe.
  - New test: malformed and oversized ids get 404 under 30 KB and the `<img>` is not echoed.
- `providers.test.ts` covers the route guard.

**Not verified:** the dev server always sends `no-store`, so the valid-id cache header must be checked on
`next start`.

### B-15. Concierge skeleton swap and consent interruption (P1)

**Status:** fixed on B's side. The Search-sheet entry is A's.

**What changed (this round)**

- Before any consent, the concierge now answers every question in the browser with the deterministic
  engine and the knowledge pack (`use-concierge.ts`: `runAsk(…, useServer)`, `note: 'private'`). Nothing is
  sent, so no consent is needed, and a tapped suggested question answers at once.
- The engine and the pack load when the browser is idle (`prepareOnDevice`).
- Consent is asked only to turn on the concierge service, which may word answers with AI, or to include
  the saved flight. The opt-in opens from the privacy line or from the saved-flight switch, and can be
  turned off again (`revoke`).
- `concierge-chat.tsx` no longer has the `!hydrated` skeleton or the consent gate. The privacy line,
  examples and question field are rendered in their first-visit state, so they are in the server HTML.
  The privacy line sits above the conversation, with a privacy link.
- `concierge-answer.tsx`: answers made before consent carry "Answered on this device" and "… Your question
  was not sent anywhere."
- `concierge-panel.tsx`: the unused decline prop was removed.
- New copy in the `onDevice` group of `features/concierge.ts` (EN and MS).

**Verified**

- e2e, both projects:
  - The privacy line and the question field are in the server HTML, and no consent button is rendered.
  - A suggested question answers with no request to `/api/concierge`, then the opt-in works.
  - CLS on `/en/concierge`: 0 on the phone and on desktop, after warming the font cache. The remaining
    first-visit shift is the site-wide font swap (A-10).
- Tests updated because the intended behaviour changed: the existing concierge e2e tests no longer click
  "Agree and start" before asking. The service-failure test now opts in first, since only then is the
  service used.

### B-16. Boards open 45 minutes in the past (P1)

**Status:** fixed by the first attempt.

**What changed:** departures open 10 minutes back and arrivals 45 minutes back (`board-model.ts`).
Departed departures and completed arrivals are set aside, with "N flights have already left" and "Show
earlier flights".

**Verified:** `board-model.test.ts` covers the window and the set-aside. The e2e "leads with flights still
to leave …" test passed on both projects. In the board screenshot at 390 px, the first row is a delayed
flight still to leave.

### B-17. The greeter view leads with long-stay parking (P1)

**Status:** fixed. **Needs MAHB data** for the pick-up point and the e-hailing entry fee (D hand-off).

**What changed (first attempt, reviewed):** the meeting journey runs in this order:
1. The flight's status.
2. "Where to wait and pick up": the public arrival hall and the kerb rules. While no sourced note exists,
   it says honestly that "the e-hailing pick-up area and any entry fee are not published in our sources
   yet".
3. Short-stay parking, with a 3-hour preset around the landing time.
4. When to expect them.

Long-stay and Preferred Parking warnings are filtered out for greeters.

**Verified:** the B-17 test in `journey.test.ts`.

### B-18. No pause control for live updates (P1)

**Status:** fixed.

**What changed**

- First attempt:
  - "Pause live updates" / "Resume live updates" (`aria-pressed`) beside the freshness line.
  - Pausing freezes the board's clock, and the change is announced politely.
  - Updates are also held while a row has focus.
- This round: the hover hold now applies only while the mouse rests on a row, not anywhere on the board
  (`flight-board-explorer.tsx`).

**Verified:** e2e "live updates can be paused and resumed, and the change is announced" passed on both
projects.

### B-19. Board changes are never announced (P1)

**Status:** fixed by the first attempt.

**What changed:** `FlightWatcher` posts one polite message when a saved flight's status, time, gate or belt
changes, on the board, the flight page and My journey. Unchanged refreshes post nothing.

**Verified:** in e2e "announces a change to a saved flight once, politely", nothing is announced before
the change, and one announcement follows it. This round I made the test robust without weakening its
assertion:
- The saved flight is seeded in storage (saving is covered by the flight-page tests).
- The clock starts a minute before boarding, not 10 seconds, so a slow first load on a busy server cannot
  pass the change before the first snapshot.
- The mouse is kept off the rows.
- I added an assertion that nothing is announced before the change.

### B-20. The question field drops below the fold (P1)

**Status:** fixed.

**What changed (this round):** on the full page, the composer is sticky at the bottom of the screen. On
phones it sits above the bottom bar, with a background strip so answers do not show through
(`concierge-chat.tsx`). The answer's start still scrolls into view. The panel already scrolls the
conversation on its own.

**Verified:** new e2e "the focused question field stays in view after each answer", at 1280x800 and
390x844, over 2 answers: the field is focused and fully in the viewport after each one. Screenshots at
390 and 1440 px.

### B-21. Old-style figures in the title; the route stated three times (P1)

**Status:** fixed by the first attempt.

**What changed:** the title uses `lining-nums tabular-nums`
(`src/app/[lang]/[airport]/flights/[flightId]/page.tsx`). The lead paragraph with the route was removed,
so the route is in the title and the status card's codes only.

**Verified:** in the screenshot at 390 px, "MH 2626 to Singapore" has lining figures, and the eyebrow line
gives only the airline and date.

## Files changed this round

- `src/lib/concierge/engine.ts`
- `src/lib/concierge/understand.ts`
- `src/lib/concierge/engine.test.ts`
- `src/lib/i18n/features/concierge.ts` (appended the `onDevice` group in both languages)
- `src/components/concierge/concierge-chat.tsx`
- `src/components/concierge/use-concierge.ts`
- `src/components/concierge/concierge-answer.tsx`
- `src/components/concierge/concierge-panel.tsx`
- `src/lib/providers/ops-services.ts`
- `src/lib/providers/providers.test.ts`
- `src/lib/journey/index.ts`
- `src/lib/journey/journey.test.ts`
- `src/components/flights/my-journey.tsx`
- `src/components/flights/flight-status-hero.tsx`
- `src/components/flights/flight-board-explorer.tsx`
- `src/components/flights/board-toolbar.tsx`
- `src/components/flights/flight-row.tsx`
- `src/app/[lang]/journey/page.tsx`
- `src/app/[lang]/[airport]/flights/[flightId]/page.tsx` (comment only)
- `e2e/flights.spec.ts`
- `e2e/concierge.spec.ts`
