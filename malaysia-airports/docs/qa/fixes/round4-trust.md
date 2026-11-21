# Fix log: round four, trust and day of travel

Package: trust (re-review `docs/qa/panel/re-review.md` 6.1.1, 6.1.2, parts of 6.1.5, 6.1.6, 6.1.8, 6.1.9 and
6.1.10, and the gallery notes 2 and 3 in `docs/prototype/README.md`). Worked in parallel with two other packages in
the same folder, on a private dev server (`NEXT_DIST_DIR=.next-r4trust next dev -p 3231`, stopped and removed at
the end; its two `tsconfig.json` lines removed). No build was run and `.next` was not touched.

## Summary

| # | Item | Status |
|---|---|---|
| 1 | Status-line semantics (6.1.1) | **Fixed** (the concierge's own status sentence is another package's: see cross-package notes) |
| 2 | Day-of-travel residuals (6.1.2) | **Fixed**; notice periods for airlines other than Malaysia Airlines **need MAHB or airline data** |
| 3 | Placement (part of 6.1.6) | **Fixed** (board row above the fold; Follow and "My needs" inside two phone screens) |
| 4 | Thin and directory-only airports (6.1.8) | **Fixed** in the product; airline and own-contact facts for 33 airports **need MAHB data** |
| 5 | Malay home `h1` (6.1.10) and "0 flights found" for topic words (6.1.5) | **Fixed** (Malay draft pending native review, OOS-14) |
| 6 | Gallery: next-day rows without a date; offline page against its toast | **Fixed** |
| 7 | Fast Track hand-off on the timeline and flight page (part of 6.1.9) | **Fixed** |

Checks: `npx tsc --noEmit` clean for this package's files (the only errors left are in
`src/components/parking/parking-logic.test.ts`, another package mid-way); `npx eslint` on every path below clean;
`npx vitest run` **544 of 544** (34 files; one run of four showed one failure that did not reproduce in three
reruns, outside this package's tests); e2e on the desktop project against the dev server: `e2e/trust.spec.ts` (new)
**15 of 15**, `handoffs`, `flights`, `platform`, `smoke` and `shell` **all pass except two dev-server-only
404 checks** (`/en/zzz` answers 200 in `next dev` because `ensureStatic` is enforced by a build, and the global
not-found page renders Next's default in dev; the same happens on `/en/guides/zzz`, which this package did not
touch). Screenshots looked at: 12 (listed under each item).

---

## 1. Status-line semantics (6.1.1). Fixed

**Before.** Every status line on the KLIA overview, the home strip, the flight timeline and the transit planner read
"Checked 19:05 · No disruption reported in our sources as of 19:05; check the signs", with the browser clock, although
the lines are worked out from notices in the build. The home row said "Services at KLIA now: no disruption reported
in our sources".

**After.**

- The model (`opsStatus`) no longer carries the clock time: `checkedAt` is gone; each line has `basis: 'notices'`
  and `noticesAsOf`, the latest `asOf` of the airport's own notices (KLIA: 7 Oct 2026), from the new pure
  `noticesPublishedUpTo()`. The state `clear` became `unknown`: with no live feed, a service without a notice has
  no knowable state.
- A notice line shows the notice's own date ("Notice dated 7 Oct 2026") instead of "Checked hh:mm".
- A line without a notice says **"Status not available"**; under the lines, once, where to check: "our sources have no
  notice about the service, and there is no live feed. Check the signs at the airport or ask at an information
  counter. **Official contacts**" (a link to the airport's contacts on its overview, `#airport-contacts`).
- The card's lead reads "From notices published up to 7 Oct 2026. No live operations feed is connected yet."; the
  inline variant (home strip, timeline steps, transit planner) ends with "From notices published up to 7 Oct 2026;
  no live feed."
- Home row: "Services at KLIA now: status not available (no live feed)" or "1 service has a notice". The round-3
  no-shift grid is kept (every summary in one cell, only the current one visible).
- Malay throughout ("Status tidak tersedia", "Notis bertarikh 7 Okt 2026", "Daripada notis yang diterbitkan
  sehingga 7 Okt 2026; tiada suapan langsung.").

**Verified.** `/en/kul` (four services, the Aerotrain one with a planned notice): "Checked hh:mm" **4 lines → 0**;
"No disruption" **3 → 0**; the three lines without a notice
read "Status not available". Unit tests (`providers.test.ts`): unknown state, notices date, the same date at two
instants, latest-date rule ignoring other airports and the prototype notice. e2e: overview and home strip in English
and Malay (`trust.spec.ts` 6.1.1). Screenshots: `/en/kul` 1440x900; `/ms` home strip open, 390x844, dark.

Files: `src/lib/providers/demo-operations.ts`, `src/lib/providers/index.ts`, `src/lib/providers/providers.test.ts`
(test updated: intended behaviour changed), `src/components/flights/ops-status.tsx`,
`src/components/home/home-ops-status.tsx`, `src/app/[lang]/[airport]/page.tsx` (contacts anchor),
`src/lib/i18n/features/flights.ts`.

## 2. Day-of-travel residuals (6.1.2). Fixed (other airlines' notice periods need data)

**One time basis.** The arrive-by time now follows the **estimated** departure, like the feed's check-in, boarding
and gate times (`arriveByFor()`, used by the timeline, the summary card, both saved-flight cards and the home
teaser). The delay step no longer says "Keep to the original check-in times"; it says "The times below follow the
new departure time, 12:00. Times can change again: if Malaysia Airlines tells you to keep to the original check-in
time, do that." Counters open on the original schedule, so on a delayed flight the check-in step is timed from the
arrive-by step and the timeline stays in time order (it ran 18:25, then 16:45).

**The deadline that still matters.** New pure `nextDeadline()`: be at the airport by → check-in closes → boarding →
gate closes, never a time in the past; and `nextStepSummary()`: the step to name, "Now" or "Next", with its start if
still ahead or its end ("until 19:00") if under way, never a past time. The arrive-by step now ends at its own time,
so once it passes the journey moves on to check-in.

- Home card, MH 2626 at 09:40 (scheduled 10:50, now 12:00): **before** "Be at the airport by 07:50 (estimate) · Next:
  Check in and drop your bags 07:50"; **after** "Check-in closes 11:00 · Now: Check in and drop your bags".
- My journey card: the same deadline line (`data-deadline`) above "Now"/"Next".
- Flight page "Your next step": **"Delayed: now 12:00"** first, then the step and "Check-in closes 11:00"; boarding
  is listed only while it is still ahead.

**No "Done" for what nobody confirmed.** A past step is now `past` (sr label "Past", open muted marker), not `done`.
Only a step the feed confirms is `done` (the landing of an arrival). The delay step's label is "Flight status".
Assistance that has passed carries "Act now: If nobody has arranged assistance yet, contact Malaysia Airlines now, and
tell its staff as soon as you reach the airport."

**Notice period.** `AIRLINE_ASSISTANCE_NOTICE` in `src/content/planning-rules.ts`: Malaysia Airlines, 48 hours,
"later requests depend on availability", provenance Official, source `mh-special-assistance` (the same source and
wording as the help FAQ `wheelchair-request`). Inside it the step warns: "Malaysia Airlines asks for 48 hours'
notice, and your flight leaves in less than that. If nobody has arranged assistance yet, ask Malaysia Airlines now:
later requests depend on availability." For an airline with no sourced period nothing is invented: "Your flight leaves
in less than 2 days, and we do not know how much notice British Airways needs. If nobody has arranged assistance
yet, ask British Airways now." (the 2-day trigger is ours and says so; it states no airline rule). **Needs MAHB or
airline data:** notice periods for AirAsia, AirAsia X, Batik Air and the other carriers (D-04).

**English copy.** "You told us you plan for a wheelchair, an older traveller." → "Your needs: wheelchair, older
traveller." (Malay "Keperluan anda: kerusi roda, warga emas."). The Malay calque the inclusion reviewer quoted in the
needs control ("perjalanan anda akan merancang untuknya") → "kami mengambil kiranya dalam langkah perjalanan anda".

**Verified.** Unit tests (`journey.test.ts`, 10 new): the reviewer's MH 1698 case, deadlines at 17:00, 18:35, 19:05,
19:20 and 19:40, no past time named at five instants, time order on a delayed flight, past vs done, the past
assistance warning, the 48-hour warning inside and outside the period, no invented hours. Four existing assertions
changed from `done` to `past` and one from the old sentence to the corrected one (intended behaviour changed; said in
the test). e2e (`trust.spec.ts` 6.1.2): home card, My journey, flight page (no "Done:" anywhere), the warning the day
before. Screenshots: home card 390x844; My journey 1440x900; flight page 390x844; Malay timeline 1440x900.

Files: `src/lib/journey/index.ts`, `src/lib/journey/journey.test.ts`, `src/content/planning-rules.ts`,
`src/components/flights/{journey-timeline,flight-summary,saved-flight-card,my-journey,step-line (new)}.tsx`,
`src/components/home/{saved-flight-card,journey-teaser}.tsx`, `src/lib/i18n/features/flights.ts`,
`src/components/ui/timeline.tsx` (**cross-package**, below).

## 3. Placement (part of 6.1.6). Fixed

- **Desktop board.** One-line lead and a shorter gap under the header on `lg`; from `sm` the "already left" note and
  "Show earlier flights" share one line; from `xl` the search field and the status chips share one row. First row at
  1440x900: **before** top 935 px (evening, English); **after** top 798 / bottom 850 (English), 819 / 871 (Malay),
  the same at 09:40 with five chips. Phones unchanged (first row 602 px).
- **Flight page on a phone.** A "My needs" button beside Follow (with the count when needs are set) jumps to the
  control, and the control now sits **above** the timeline on phones (it heads the side column on desktop as before).
  MH 2626 at 390x844: Follow 1,325 px; "My needs" 1,379 px (Malay 1,429); both inside two screens (1,688). The control
  itself moved **from 5,979 to 1,768 px** on CX 771 (measured on the same flight before and after) and sits at
  1,875 px on MH 2626.

Verified: e2e (`trust.spec.ts` 6.1.6: row bottom ≤ 900 in both languages; Follow and "My needs" under 1,688 px; the
link scrolls the control into view). Screenshot: board 1440x900.

Files: `src/app/[lang]/[airport]/flights/page.tsx`, `src/components/flights/{flight-board-explorer,board-toolbar,flight-actions,needs-control,flight-detail}.tsx`.

## 4. Thin and directory-only airports (6.1.8). Fixed; facts need MAHB data

- **Empty switcher.** The overview's "What do you need at …?" block is left out when no journey mode has a task at
  the airport (`JOURNEY_ACTIONS` against its sections). Lawas: **4 mode radios → 0**. Ipoh keeps it (it has flights).
- **Airlines.** A new key fact lists the airlines the content publishes (KLIA: "Malaysia Airlines, All Nippon
  Airways (ANA), Batik Air Malaysia and 13 more", Official or Estimated by basis, with sources); otherwise "Not
  published" with "Our sources do not say which airlines fly here. Check your booking or ask your airline."
- **Own contact.** Where an airport has only the group lines: "This airport's own phone number: Not published. The
  lines below are Malaysia Airports group contacts, not lines to this airport." The as-of date under the facts is
  now formatted ("As of 29 Apr 2024", was "2024-04-29").
- **Depth on `/en/airports` and `/ms/airports`.** Each card carries a chip from the sections the airport really has
  (`airportDepthLabel`): **Flights and airport guide** (KUL, PEN, BKI), **Flights only** (18, including Kuching and
  Langkawi, planned "full" in the registry), **Directory only** (18 smaller airports, Lawas among them); Malay "Penerbangan
  dan panduan lapangan terbang", "Penerbangan sahaja", "Direktori sahaja". A short legend explains them.
- **Needs MAHB data (not invented):** the operating airline and the airport's own phone line for every airport
  without a content file (33 of 39), Lawas included (AirBorneo's takeover of MASwings is sourced for Sabah and
  Sarawak in general, not for Lawas, so it is not shown there).

Verified: unit tests (`airport-depth.test.ts`); e2e (`trust.spec.ts` 6.1.8, with axe on `/en/airports`). Screenshots:
Lawas 1440x900; `/en/airports` 1440x900; `/ms/airports` 390x844.

Files: `src/app/[lang]/[airport]/page.tsx`, `src/components/airport/{airport-flight-tools,airport-directory}.tsx`,
`src/components/airport/airport-depth.ts` (new), `src/components/airport/airport-depth.test.ts` (new).

## 5. Home: Malay `h1` and topic words (6.1.10, 6.1.5). Fixed

- **Malay `h1`:** "Semak penerbangan, rancang perjalanan anda." (check your flight, plan your journey), written as a
  Malay instruction, not a translation of the English concept line, which stays pending brand review (OOS-14). New
  keys `home.headlineTaskLead` / `headlineTaskAccent` appended to `en.ts` and `ms.ts`; the old keys are unused but
  left (append-only). Two lines at 390 px, no word broken.
- **"parking" in the home field:** the status line no longer says "0 flights found". A lazily loaded `TopicStatus`
  (same chunk as the inline site results, so nothing is added to the home's first JavaScript) says "No flights match
  “parking”. Pages that do are listed below, first: Parking at KLIA: prices and car parks." (or that nothing matches).
  Which page leads is the search package's ranking (6.1.5).

Verified: e2e (`trust.spec.ts` 6.1.10/6.1.5; `smoke.spec.ts` Malay `h1` updated: intended change). Screenshot: `/ms`
390x844.

Files: `src/components/home/home-sections.tsx`, `src/components/flights/{flight-search-box,topic-status (new)}.tsx`,
`src/lib/i18n/en.ts`, `src/lib/i18n/ms.ts` (append-only).

## 6. Gallery defects. Fixed

- **Next-day rows (note 2).** `rowDayLabel()` names the day of the time a row shows when it is not today at the
  airport ("Tomorrow", "Yesterday" or "24 Nov"; "Esok" in Malay), shown under the time and read before it. Used by the
  board previews (home and every overview) and the flight-field results; the full board keeps its hour groups with
  "Tomorrow". Ipoh at 11:00 on 18 November: "15:30" (today), "09:25 Tomorrow", "10:45 Tomorrow".
- **Offline wording (note 3).** One pure answer, `savingState(status, online)`, now drives both the status card and
  the toast (`connectionNotice()`), so they cannot disagree: "showing saved information" only when the worker controls
  the page; otherwise the toast says "You are offline: nothing is saved on this device yet" and the card, for the
  capture's case (registration failed because the connection was gone), "Nothing is saved on this device yet: the
  connection dropped before offline saving was ready. Pages you open once you are back online will be kept." To keep
  that true, a failed registration is retried when the connection returns.

Verified: unit tests (`airport-depth.test.ts` row days, incl. the KL-day vs UTC case; `sw-state.test.ts` every worker
status offline); e2e (`trust.spec.ts` Ipoh; `platform.spec.ts` offline test now checks the toast agrees with the card:
intended change). The production worker path was not run (no build allowed); it is covered by the unit tests.
Screenshots: Ipoh preview 390x844; offline page 390x844, dark.

Files: `src/components/flights/{flight-row,flight-board,flight-search-box}.tsx`, `src/components/home/board-preview.tsx`,
`src/components/platform/{sw-client,offline-status,platform-runtime}.tsx|ts`, `src/components/platform/sw-state.test.ts`
(new), `e2e/platform.spec.ts`.

## 7. Measurement: Fast Track (part of 6.1.9). Fixed

The timeline's optional Fast Track step (flight page and My journey) now offers, beside "See Fast Track", the
booking site as `data-handoff="fast-track-booking"`, the convention of `src/components/platform/analytics.ts` (counted
as a hand-off and given campaign parameters when followed), the same name as the overview's link. `JourneyAction` has
an optional `handoff`; the URL comes from the facility record's `bookingUrl` (`journeyExtras`).

Verified: unit test (exact actions for a T1 flight); e2e (attribute and URL on MH 2626's timeline).

Files: `src/lib/journey/index.ts`, `src/components/flights/{journey-content.ts,journey-timeline.tsx}`.

---

## Cross-package changes

1. **`src/components/ui/timeline.tsx` (design system).** `TimelineItem` accepts `state="past"`: open circle with an
   `ink-3` border on the solid thread, no check mark. Five lines; nothing else changed; existing states render as before.
2. **`src/components/platform/*` (offline and the toast).** Within "the service worker and offline code" this package
   owns, but the files sit in the platform folder: `sw-client.ts` (two pure helpers and the retry on reconnect),
   `offline-status.tsx`, `platform-runtime.tsx`. New copy is in `flightPages.offline` rather than the platform
   namespace.
3. **`src/lib/i18n/en.ts`, `ms.ts`:** two keys appended under `home` (Malay `h1`).
4. **`e2e/smoke.spec.ts`:** the Malay `h1` assertion updated (intended change).

**Not changed, recommended to the concierge package:** the concierge's own status sentence ("No disruption to the
{service} is reported in our sources", `src/lib/i18n/features/concierge.ts` `serviceStatusClear`, used by
`src/lib/concierge/engine.ts`) still makes the 6.1.1 claim; it should read "Status not available" with the notices
date, like the lines here.

## Needs MAHB data

- Assistance notice periods for AirAsia, AirAsia X, Batik Air and the other carriers (D-04).
- The operating airline and the airport's own contact for the 33 airports without a content file (Lawas first, then
  the other directory-only airports), and confirmation for the flights-only ones.
- A live operations feed and notices CMS (OOS-02), so status lines can carry a real checked time again.
