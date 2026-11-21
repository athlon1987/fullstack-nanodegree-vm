# Third review after fix rounds four and five: airport digital executive

Reviewer lens: an airport digital executive who has run passenger digital at a major hub, judging operational
usefulness, flight information, commercial value, multi-airport coverage and launch risk. One of three independent
third reviews; the other two were not read.

Date: 22 November 2026, 05:46 to about 06:10 Kuala Lumpur time (21:46 to 22:10 UTC on 21 November). Product: the
round-five production build in `.next/` (build `b4AW-Kxsx1vSRiJq7KWD0`), served by this reviewer with
`TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3302` and stopped by its own PID and its two child
processes afterwards. Nothing under `src/`, `e2e/`, `scripts/` or the configuration was changed; no build, dev server
or git command was run.

**Labels.** **[measured]** = observed by this reviewer on the running build, with the method named.
**[verification]** = a figure from `docs/qa/verification.md` (round five, G sections, unless stated), not re-measured
here. **[judgement]** = expert assessment. **[fact-check]** = a correction made by the documentation fact-check
after this review, on the same build.

**What is prototype-only.** Every flight, gate, belt, check-in row, queue estimate and car-park space is demonstration
data: `/api/flights` answers `"mode":"demo"`, and the official provider (`src/lib/providers/official-flights.ts`,
lines 96 to 111) still throws `ProviderNotConfiguredError` from every data method. Notices are a code file
(`src/content/notices.ts`). There is no official feed of any kind. As in the earlier reviews, ux, flight, mobile,
nav, ai and ui are judged as if production flight data were connected; **info** and **commerce** are scored on what is
actually there.

---

## 1. Verdict

Rounds four and five fixed the trust defects this lens raised in the second review, and I confirmed each on the
running build: status lines no longer stamp the current time or claim "No disruption"; the home card shows the
deadline that still matters once the arrive-by time has passed; a delayed flight uses one time basis; the parking
page, the concierge and the help centre now give the same parking sentence; and all five commercial hand-offs carry a
campaign parameter and send a first-party beacon to a store that survives restarts. The flight page's first paint
problem found after the second review is fixed [verification].

What a passenger or a commercial director would notice has not changed: no live data, nothing to buy, no verified
parking price, eight outlets at KLIA, no lounge price or rule, and three of 39 airports with more than an overview and a
board. I also found one new launch risk the fix logs understate: **with a saved flight, a single failed script fetch
replaces the whole home page (and My journey) with "Something went wrong", and "Try again" does not recover it even
after the connection returns** [measured]. That is the returning passenger on airport Wi-Fi, the user this product most
needs to keep.

**Position: not ready for public launch. A closed KLIA pilot is reasonable once the delivery team has run CI on a
runner with agreed TBT budgets and fixed the saved-flight failure, and MAHB has connected the official flight feed
and named a notices owner** [judgement].

**Weighted score: 74.0%** [judgement] (second review, this lens: 74.5%; panel median 74.5%; Heathrow 79.0%, MAHB
today 42.5%). Eight dimensions are unchanged; perf falls half a point on first-hand reliability evidence (section 4).
With MAHB's launch gates closed and the team's blockers fixed, I project about **80%** [judgement, not a score].

---

## 2. Method

- **Crawl [measured].** Playwright Chromium (`chromium.launch()`, no options), 31 URLs on desktop (1440 x 900) and
  phone (390 x 844, touch, Pixel 7 user agent), 62 loads, each with its own client address. Per load: status, `h1`
  position, page height, sideways scroll, console errors, requests to other hosts, `data-handoff` links, counts of
  "Demo", "Not published" and "not verified", full text saved.
  - **Result:** 60 of 60 intended pages answered 200 with 0 console errors, 0 third-party requests and no sideways
    scroll. The other 2 loads were an arrival id I guessed wrongly; both answered 404 "We could not find this flight",
    as they should.
- **Clock.** The session fell just after the demonstration board's night gap (about 22:55 to 05:05), so boards and
  flight pages ran on the real clock (board window 05:38 to 11:48, first departures 07:00). Only the night empty-state
  check fixed the browser clock (`page.clock.install`, 23:30 on 22 November); statuses computed on the server used the
  server clock throughout.
- **Interactions [measured], phone unless stated.**
  - Saved AK 3599 (07:15, check-in open) at 05:51, then read the home card and My journey.
  - On AK 6336 (delayed 07:00 to 07:50): opened Follow, ticked Wheelchair under My needs, then aborted the flight feed
    (`page.route`) and waited 36 s.
  - Followed the flight page's parking and shop-and-dine links with their parameters.
  - Typed four queries into the home search field and pressed Enter; ran 14 site searches on desktop (3 repeated to read each result's airport).
  - Desktop: clicked the five commercial hand-offs (parking booking, Fast Track on facilities and on the overview,
    lounge operator, rail tickets) with external hosts stubbed, recording the opened URL and the `/api/metrics` beacon.
  - Resilience: with a saved flight and service workers blocked, aborted every script chunk not referenced in the
    server HTML on `/en`, `/en/journey`, `/en/kul`, `/en/kul/parking` and a flight page; then on `/en` aborted each of
    the 14 lazy chunks one at a time; then removed the block and pressed "Try again".
  - Night board at a 23:30 browser clock.
- **API and HTTP [measured].** Ten `POST /api/concierge` questions (operations and commerce); status codes of seven
  missing or legacy paths; response headers of `/en`; sitemap URLs per airport; gzip HTML size of five pages; the
  flight page's `h1` offset in the server HTML.
- **Screenshots viewed [measured].** 9 of the 15 allowed, kept in the session scratch folder
  (`review3-business/`), not in `docs/`: phone home with a saved flight, Follow panel, shop and dine with the gate,
  Lawas, parking, board, and the home after a failed script fetch; desktop airports and flight page.
- **Code read (grep only).** The official provider stub, the notices file, the metric store's adapter list.
- **Performance.** Not measured: other servers share this machine. Figures are from verification round five, labelled
  as such. Side effect: the server's default file metric store wrote this session's counts to `.data/metrics.json`
  (git-ignored); I read it once during the session (4 keys).
- **Limits.** One session of about 25 minutes on demonstration data, Chromium only, one clock time, no real passengers,
  no field data, no assistive technology. Accessibility was seen only in passing.

### Pages checked (31 URLs x 2 viewports)

| Area | Pages |
|---|---|
| Home and network | `/en`, `/ms`, `/en/airports` (the 39-airport model) |
| KLIA | `/en/kul`, `/en/kul/flights`, `/en/kul/parking`, `/en/kul/shop-dine`, `/en/kul/lounges`, `/en/kul/transport`, `/en/kul/facilities`, `/en/kul/transit`, `/en/kul/map` |
| Flight pages | AK 6336 (delayed, T2), MH 1773 (Jakarta), MH 785 (domestic, T1), MH 2070 (London), MH 2071 (arriving from London) |
| Journey | `/en/journey`, empty and with a saved flight |
| Other airports | `/en/pen`, `/en/pen/parking`, `/en/bki`, `/en/kch`, `/en/kch/flights`, `/en/lgk` (international, flights only), `/en/lwy` (directory-only STOLport) |
| Corporate | `/en/corporate`, `/en/corporate/business` |
| Notices and Malay | `/en/notices`, `/ms/kul/parking`, `/ms/kul/flights/ak3599-…` |
| With parameters | `/en/kul/parking?t=T2&from=…`, `/en/kul/shop-dine?gate=T2-K11&t=T2`, `/en/kul/facilities?t=T1` |

---

## 3. Item checks on the running build

Status: **fixed**, **improved** (better, not closed), **unchanged**, **worse**. Evidence is what I did and saw.

### 3.1 The second review's ten weaknesses in this lens (`re-review-business.md`, section 6)

| # | Weakness | Status | Evidence [measured] |
|---|---|---|---|
| 1 | No live operational data | **Unchanged** (MAHB, OOS-01) | Provider stub throws (lines 96 to 111); `/api/flights` `"mode":"demo"`; queue estimates labelled "Demonstration data" |
| 2 | Operations publishing not operator-grade; false reassurance | **Improved**: semantics fixed; publishing unchanged | `/en/kul` phone: 0 "Checked hh:mm", 0 "No disruption"; three lines "Status not available"; Aerotrain "Notice dated 7 Oct 2026"; lead "From notices published up to 7 Oct 2026. No live operations feed is connected yet." Kuching: "up to 16 Nov 2026". Home strip "1 service has a notice". Notices are still `src/content/notices.ts` |
| 3 | Multi-airport depth | **Improved** in labelling; content **unchanged** | Sitemap (276 URLs): KUL 17, PEN 6, BKI 6; 18 airports 2; 18 airports 1. `/en/kch/parking`, `/en/lgk/transport` 404. `/en/airports`: depth legend and chips, 3 "Flights and airport guide", 18 "Flights only", 18 "Directory only". Lawas: no journey-mode switcher; "Airlines: Not published"; "This airport's own phone number: Not published" |
| 4 | Nothing can be bought | **Unchanged** | No basket, lounge booking, day-room booking or reserve-and-collect; corporate business page shows every dedicated B2B channel "Not published"; `Permissions-Policy … payment=()` |
| 5 | Price-first parking on unverified prices | **Unchanged** (now consistent) | 0 of 4 KLIA car parks verified: T1 and T2 "≤ RM 52 (not verified)", LTCP "≤ RM 32 (not verified)" (it was shown as verified in the second review), Preferred Parking "No price published"; 23 "not verified" on the desktop page. Booking: "Your dates: 22 Nov, 05:15 to 23 Nov, 05:15. Enter them on the official site; it does not take them from this page" |
| 6 | Measurement cannot support a commercial case | **Fixed** (team part); referral codes MAHB | 5 of 5 hand-offs opened with `utm_source=malaysia-airports-concept&utm_medium=referral&utm_campaign=<name>` and sent `{"event":"handoff","name":…,"section":…,"host":…}`; the server wrote counts to a file store; a KV adapter is documented for several instances. Durability across a restart [verification, F2.6] |
| 7 | Operator voice and sourcing | **Unchanged** (MAHB, OOS-08, OOS-14) | Aerotrain notice: "we found no confirmation of the final dates"; flight steps: "Third-party guides describe Terminal 1 as …"; lounge sources include dragonpass.com, loungereview.com, booking.com and klia.info; T1 parking "klia.info (undated)" |
| 8 | Alerts do not reach a closed browser | **Unchanged** (MAHB, OOS-10) | Follow panel: "only while a page of this site is open. Nothing reaches you when the browser is closed yet"; e-mail "Demonstration: nothing is sent". Follow at 1,199 px (second phone screen) |
| 9 | Surfaces disagree | **Fixed**, one low residual | Parking: the page and the concierge both say "Rates not verified: our sources give a daily maximum of RM 32 …". Home card for AK 3599 at 05:51 (arrive-by 05:15 passed): "Check-in closes 06:30 · Now: Check in and drop your bags". Home "parking" suggestion leads with "Parking at KLIA". Residual: the concierge's long-stay card still says the LTCP "costs at most RM32 a day from 1 May 2026" without the qualifier |
| 10 | Release engineering unproven | **Improved**, not met; one risk newly exposed | [verification] flight page LCP 4.2–4.9 s → 1.22 s; TBT over 200 ms on 6–8 of 10; CI and WebKit never run on a runner. [measured] CSP `script-src 'self' 'unsafe-inline'`. New: the saved-flight failure (3.6, row 1) |

### 3.2 The second review's launch blockers fixable by the delivery team (section 7.1)

| # | Blocker | Status | Evidence |
|---|---|---|---|
| 1 | CI with WebKit, chaos and contract tests; TBT budgets | **Not met** | [verification] G7, G8 items 1 and 3: CI not run on a runner; budget step fails 10 assertions; pooled TBT `/en` 260, `/en/kul` 308, board 227, parking 241, flight page 268 ms |
| 2 | Complete attribution; durable counts | **Fixed** | 3.1, row 6 [measured] |
| 3 | One fact, one answer | **Fixed** (low residual) | 3.1, row 9 [measured] |
| 4 | Home card and My journey show the deadline that still matters | **Fixed** | Home and My journey: "Check-in closes 06:30 · Now" for AK 3599 at 05:51; delayed AK 6336: "Delayed: now 07:50 · … · Check-in closes 07:05 · Boarding 07:20" and "The times below follow the new departure time, 07:50"; 3 steps marked "Past:", 0 "Done:" on 10 departure-page loads [measured] |
| 5 | Status-line semantics | **Fixed** | 3.1, row 2 [measured] |
| 6 | Directory-only and thin airports | **Fixed** (team part) | 3.1, row 3 [measured]. Operating airline and own contact for 33 airports need MAHB |
| 7 | Search relevance for facility words | **Fixed**; new cross-airport gaps | "wifi" → "Wi-Fi: not published yet" first; "taxi" → 2 taxi results, no liquids rule; "smoking" → "Smoking rooms: not published yet"; "fast track" → T1 and T2 entries. Gaps: "kuching parking" (22 results) leads with KLIA, Penang and Kota Kinabalu parking, nothing saying Kuching parking is not published; "langkawi taxi" leads with the KLIA and Penang taxi entries; "advertising" leads with the privacy FAQ; "lost and found" returns 134 results [measured] |
| 8 | Follow in the first two phone screens; Fast Track in the international summary | **Partly** | Follow 1,199 px and My needs 1,253 px (AK 3599, phone): second screen. MH 2070 summary: "Be at KLIA Terminal 1 by 08:15 (estimate) · Boarding 10:30", no Fast Track; Fast Track remains an optional step after security with a marked hand-off [measured] |
| 9 | Per-route CSP and payment policy (E-09) | **Unchanged** | `curl -I /en`: `'unsafe-inline'`, `payment=()` [measured] |

### 3.3 Launch blockers dependent on MAHB (section 7.2)

| # | Blocker | Status | Evidence [measured] |
|---|---|---|---|
| 1 | Official flight feed (OOS-01) | **Unchanged** | Stub throws; feed in demo mode |
| 2 | Operations feed and notices CMS, named owner (OOS-02) | **Unchanged** | Notices in code; every status line without a notice says "Status not available" |
| 3 | Parking tariff and dated booking deep link (OOS-03) | **Unchanged** | 0 of 4 KLIA car parks verified; dates not passed |
| 4 | Fast Track and lounges (D-02, OOS-04) | **Unchanged** | Fast Track: "Not published in our sources: what it includes, which checkpoints it covers …"; 9 "Not published" on the lounges page; the three lounge-operator hand-offs all go to one Malaysia Airlines page; Plaza Premium has none |
| 5 | Content minimum per tier; concessionaire feed (OOS-05, OOS-06) | **Unchanged** | 3.1, row 3; "Partial directory … 8 at KLIA"; gate K11 (T2): "All 2 · Dine 0 · Shop 2" |
| 6 | Operator-grade sourcing; brand, legal, Malay review (OOS-08, OOS-14) | **Unchanged** | 3.1, row 7 |
| 7 | Alert delivery (OOS-10) | **Unchanged** | 3.1, row 8 |
| 8 | Partner referral codes; B2B channels (OOS-13, D-17) | **Unchanged** | Hand-offs carry a campaign tag, not a partner referral code; B2B channels "Not published" |
| 9 | Hosting (OOS-11, OOS-12) | **Unchanged** | [verification] G8 item 10 |
| 10 | Usability study and field Core Web Vitals (OOS-15) | **Unchanged** | [verification] study planned, not run |

### 3.4 Round-four claims in this lens (re-review section 6.1)

| Item | Verification says | This review | Evidence [measured] |
|---|---|---|---|
| 6.1.1 Status lines | Verified | **Confirmed** | 3.1, row 2; flight page immigration step: "Status not available … From notices published up to 7 Oct 2026; no live feed." |
| 6.1.2 Day of travel | Verified | **Confirmed** | 3.2, row 4. Wheelchair on AirAsia: "We have not published its notice period: check with the airline" and "Act now: If nobody has arranged assistance yet, contact AirAsia now" |
| 6.1.3 One fact, one answer | Verified | **Confirmed**, low residual | 3.1, row 9 |
| 6.1.4 Concierge | Verified | **Improved**, gaps remain | Unanswerable ("refund for my parking ticket"): "This is not in our verified content. For a definite answer, contact:" with the group line. Fare: "RM 55 (fare until 31 December 2026)". Gaps in 3.6, row 3 |
| 6.1.5 Search | Verified | **Confirmed**; new cross-airport gaps | 3.2, row 7 |
| 6.1.6 Placement | Verified | **Confirmed** | Phone `h1` at 184 px on every airport sub-page and flight page; board's first row about 620 px; Follow 1,199 px |
| 6.1.8 Thin airports | Verified | **Confirmed** | 3.1, row 3 |
| 6.1.9 Measurement | Verified | **Confirmed** | 3.1, row 6 |
| 6.1.11 Performance and release gates | Not met | **Not met** | [verification] G2.4, G7, G8 |
| 6.1.12 E-09 | Not met | **Not met** | 3.2, row 9 |

### 3.5 Round-five claims in this lens (verification G4)

| Claim | Verification says | This review | Evidence |
|---|---|---|---|
| Speed 3: concierge flight answers from the server feed | Verified | **Confirmed** | "Is MH 785 delayed?": "MH 785 shows as check-in open in the demonstration data. Your airline has the real status." with the delay-rights cards [measured] |
| Flight 1: flight page LCP | Verified | **Confirmed** (structure); timing not re-measured | `h1` "AK 3599 to Kuching" at byte 22,543 of the server HTML, before the first hidden segment at 46,652 [measured]; LCP 1.22 s, performance 94 and 96 [verification] |
| Flight 2: board at night | Verified | **Confirmed** | 23:30 browser clock: "No departures between 23:20 and 05:30. Show later flights to look further ahead, or earlier ones …" with both buttons [measured]; LCP 0.92 s [verification] |
| Flight 4 and Polish 3: density on the flight page and parking | Verified | **Confirmed** for this lens | Parking: 0 "Demo" labels on either viewport, one "Sources for this section (5)" list [measured]. Flight pages: one banner and 3 to 6 "Demo" words per page [measured]. A-14 overall still partly [verification] |
| Polish 1: catch-all 404s | Verified | **Confirmed** | `/en/kul/zzz`, `/en/kch/parking`, `/en/lgk/transport`, `/en/lwy/flights`, `/en/bbn/flights`: 404 with "Page not found" in the server HTML; unknown flight id: "We could not find this flight"; the legacy Fast Track path 308 to `/en/kul/facilities?t=T1#kul-t1-fast-track` [measured] |
| Polish 2: search index | Verified | **Confirmed** | 0 "[object Object]" on `/en/search?q=Malaysia Airlines`, `/ms/search?q=MH` and 62 page texts [measured] |
| Speed 4: HTML bytes | Verified | **Confirmed**; budget still missed | gzip HTML `/en` 55.2 KB, `/en/kul` 51.0, parking 51.2, board 33.2, flight page 88.9 (raw 400 KB) [measured] |
| G3 item 1: a failed script fetch took pages down | Fixed for the runtime and the flight page | **Confirmed** for those | With every lazy chunk aborted: `/en/kul` and `/en/kul/parking` kept their content; the flight page kept its `h1` and timetable facts with "Working out your next step" [measured] |
| G8 item 2: home saved-flight card and My journey | Open | **Confirmed, and worse than described** | See 3.6, row 1 |

### 3.6 New findings (not in the second review)

| # | Finding | Severity | Evidence [measured] |
|---|---|---|---|
| 1 | **A saved flight turns one failed script fetch into a blank home.** Not just the card: the whole `<main>` of `/en` (4,932 characters of text) becomes "Something went wrong" (97 characters), and the same on `/en/journey`. "Try again" does not recover after the connection returns; only a reload does. Without a saved flight both pages render. | High (launch risk) | Aborting one of 14 lazy chunks at a time on `/en`: 2 of the 14 each produce it. After removing the block, "Try again" left the error in place. Screenshot viewed |
| 2 | **Search does not say when an airport lacks a section**; it returns another airport's page | Medium | "kuching parking" → KLIA, Penang, Kota Kinabalu parking; "langkawi taxi" → KLIA and Penang taxi entries first |
| 3 | **The concierge does not answer "now" questions from the data it has** | Medium | "What is the queue at immigration right now?" → autogate eligibility text, not the demonstration queue estimates shown on the overview, and no "no live queue data" line. "Advertising space at KLIA?" → group contacts, without saying no channel is published. "Parking for 3 days?" → daily maximum, not the 3-day figure the page shows. "How do I buy Fast Track?" opens with "Here is what our sources say" |
| 4 | **Future-dated change badged "In effect now"** | Low | Overview and `/en/notices`: "KLIA Ekspres adult fare: RM65 from 1 January 2027 · In effect now · 1 Oct 2026 to 31 Jan 2027" (the concierge correctly gives RM 55 until 31 December) |
| 5 | **Retail at Terminal 2 is close to empty** | Medium (MAHB data) | Shop and dine with gate K11 (T2): 2 outlets, 0 dining, 0 services |
| 6 | Small copy defects | Low | Lawas: "There are no notices for this airport right now" (a static file, cf. 6.1.1); Kuching queue line "Security MAIN"; MH international check-in box lists domestic rows too; the English home `h1` is still the slogan "Your journey, beautifully connected." while the Malay `h1` is task-based |

---

## 4. Scores

Scale 1 to 5 in half points; 3 = competent major airport, 4 = strong with evidence, 5 = best in class with first-hand
evidence. Weighted total = sum of score x weight, as a percentage of 5. No dimension can reach 5 on demonstration data.

| Key | Weight | Second review (this lens) | **This review** | Change | Confidence | Reason |
|---|---|---|---|---|---|---|
| ui | 10% | 4.0 | **4.0** | 0 | Medium | Calm, consistent and credible on both viewports; parking and the flight page are visibly less noisy. Still dense provenance chips and source counters, and the English home leads with a slogan |
| ux | 20% | 4.0 | **4.0** | 0 | Medium | Day-of-travel guidance is now right in every state I tried (passed arrive-by, delay, needs, feed failure), but commercial tasks end in hand-offs, phone pages run to 15,451 px, and no usability study has been run |
| info | 15% | 3.0 | **3.0** | 0 | High | Scored on what exists. More honest (status semantics, one parking answer), no deeper: 0 of 4 KLIA car parks verified, 8 outlets, no lounge rules, 36 of 39 airports overview-only or directory-only, third-party sources for MAHB's own building |
| flight | 15% | 4.0 | **4.0** | 0 | Medium | Correct states, one time basis on delays, next-step line, last-known data with retry, assistance warnings, night empty state, concierge reading the feed. Held at 4.0 because alerts still never reach a closed browser and e-mail is a demonstration |
| mobile | 10% | 4.0 | **4.0** | 0 | Medium | Answer on the first phone screen of every page I opened, Follow in the second screen, no sideways scroll on 30 pages. Long pages, TBT over budget on a mid-range phone [verification], and the saved-flight failure hits phones on weak Wi-Fi |
| nav | 10% | 4.0 | **4.0** | 0 | Medium | Search now leads with the right entity for parking, Fast Track, wifi, taxi and smoking, and the 39-airport chooser labels depth. Cross-airport queries return another airport's page |
| ai | 10% | 3.5 | **3.5** | 0 | Medium | Grounded, cited and now consistent with the pages; flight answers from the feed; an honest fallback with a contact. About half of my ten questions got the answer asked; "now" questions ignore the queue data and several answers open with "Here is what our sources say" |
| commerce | 5% | 2.5 | **2.5** | 0 | High | Scored on what exists. Attribution is now complete and durable, which is the right foundation, but nothing can be bought, no parking price is verified, lounges have no price, KLIA lists 8 outlets (2 at a T2 gate), and no B2B channel exists: level with MAHB today |
| perf | 5% | 4.0 | **3.5** | −0.5 | Medium | [verification] LCP at most 1.22 s on 10 of 10 pages and the shell's JavaScript halved; but TBT over 200 ms on most pages, congested Wi-Fi LCP 2.57 to 2.65 s, CI never run on a runner, CSP `'unsafe-inline'`, and [measured] a whole-page failure on a failed script fetch that "Try again" cannot recover |
| **Weighted** | | **74.5%** | **74.0%** | −0.5 | Medium | 370 of 500 weighted points |

**What moved, and why.** Perf is the only change. The second review gave 4.0 on round-three lab figures. The
round-five lab figures are better on the flight page and the night board, and elsewhere move within the container's
spread [verification]; `/ms` performance and parking's TBT now miss targets they met in round four [fact-check].
What moved me is first-hand reliability evidence the second review did not have: on the home and My journey, with a
saved flight, one failed chunk replaces the page and the offered recovery does nothing. For an airport
site, whose users load pages on congested Wi-Fi and across deploys, I do not rate reliability above the best live
benchmark (Dubai, 3.5) until that is fixed and CI has run. The trust fixes in rounds four and five are real, but each
closes a defect inside dimensions already scored 4.0; none adds the live data, commerce or content depth that the
next half point needs.

**Projection** [judgement, not a score]. With the official feed, the notices CMS, the tariff and a dated booking link,
lounge and Fast Track data, the content minimum, alert delivery, and the team's reliability and CI fixes: info 4.0,
commerce 3.5, flight 4.5, perf 4.0 give about **80%**, level with Heathrow (79.0%), not clearly ahead.

---

## 5. Strengths [measured unless marked]

1. **Day-of-travel guidance an operations director could sign off.** Passed arrive-by, delay, check-in open,
   departed and arriving states all gave the right next action, with one time basis, on the home, My journey and the
   flight page, in English and Malay ("Langkah seterusnya … Daftar masuk ditutup 06:30").
2. **Honest operational status.** No invented freshness: every line names its source date, says "Status not
   available" when there is none, and points to the official contacts. The structure is ready for an operations feed.
3. **Failure handling on the flight page.** Feed cut: "Showing the last flight information we received, from 05:52
   (1 min ago). Try again". Script chunks cut: the flight page keeps its timetable facts.
4. **Commerce after the answer, with context, and now measured.** Fast Track as an optional step after security;
   parking dates filled from the flight; shop and dine sorted by the flight's gate; every hand-off tagged and counted
   in a durable first-party store, without third-party requests (0 on 62 loads).
5. **One network model that says what it does not know.** 39 airports on one template, with depth chips, 404s for
   missing sections, and "Not published" for a directory-only airport's airlines and phone line.
6. **Consistency across surfaces.** Parking, the concierge and the help centre now give one sentence per car park;
   the concierge's fare answer respects the fare change date.
7. **A governance asset** [judgement]: provenance, source and as-of date on every fact in both languages. This should
   become the CMS content contract.

---

## 6. Ten most significant remaining weaknesses (this lens)

1. **No live operational data** (MAHB, OOS-01, OOS-02). The official provider is a stub; every flight, gate, belt,
   queue and space is demonstration data; notices are a code file and need a deploy.
2. **Nothing can be bought** (MAHB and partners; team for E-09). No parking booking with dates, no lounge price, rule
   or booking (Plaza Premium has no operator link), no day room, no reserve-and-collect, no B2B channel;
   `payment=()` and `'unsafe-inline'` would block a partner checkout.
3. **The price-first parking page has no verified price** (MAHB, OOS-03). 0 of 4 KLIA car parks verified; Preferred
   Parking has none; the booking link cannot take dates.
4. **Multi-airport depth unchanged since round one** (MAHB, OOS-05, OOS-06). KUL 17 URLs, PEN and BKI 6, the other 36
   airports 1 or 2; Kuching and Langkawi, both international, have no transport, parking, facilities or lounges; the
   operating airline and own phone line of 33 airports are not published.
5. **A saved flight makes the home fragile** (team). One failed script fetch replaces the whole home or My journey,
   and "Try again" does not recover.
6. **Release engineering and speed budgets unproven** (team) [verification]. CI and WebKit never run on a runner; TBT
   over 200 ms on most pages; congested Wi-Fi LCP 2.57 to 2.65 s; first-load JavaScript over 170 KB on 21 of 39
   routes; HTML over 40 KB gzip on most pages (`/en` 55 KB, flight page 89 KB measured).
7. **Thin retail and lounge content** (MAHB). 8 outlets at KLIA, 2 near a T2 gate and no dining; no hours, price
   bands, images or offers; lounges sourced from lounge-network and booking sites.
8. **Alerts do not reach a passenger whose browser is closed** (MAHB and partners, OOS-10); e-mail is a demonstration.
9. **Operator voice and sourcing** (MAHB, OOS-08, OOS-14). The Aerotrain notice hedges MAHB's own works; MAHB's own
   building is described from third-party guides; the Malay has had no native review.
10. **Answers that miss the question across airports and in the concierge** (team). Search returns another airport's
    page when a section is missing; the concierge ignores the queue data for "right now" questions and opens several
    answers with "Here is what our sources say"; a future fare change is badged "In effect now".

---

## 7. Launch blockers

### 7.1 Fixable by the delivery team

1. **Reliability of lazy parts** (G8 item 2, extended). Use `retryingImport` for every lazy component that renders on
   load (the home's saved-flight card, My journey's controls), scope each error boundary to its own card, make "Try
   again" re-import rather than re-render a cached rejection, and add the saved-flight state to the failed-chunk e2e
   test.
2. **CI and budgets** (E-06, A-09, E-01, E-02). Run the workflow on a runner with WebKit and the chaos and contract
   tests; meet the TBT budgets or agree revised ones with the design owner; record the decision.
3. **Search when a section is missing** (A-12). For "kuching parking" or "langkawi taxi", return "Parking at Kuching:
   not published" with the official link before any other airport's page.
4. **Concierge "now" answers.** Use the queue and status lines it already has, or say "no live queue data"; lead
   with the answer (Fast Track: "Book on myairportfasttrack.com"); say when a B2B channel is not published.
5. **Notice and copy semantics.** "Announced" or "From 1 January 2027" instead of "In effect now" for future-dated
   changes; "No notices in our sources" for directory-only airports; the qualifier on the concierge's long-stay card;
   readable terminal labels ("Security MAIN").
6. **Fast Track in the international flight summary** as an optional link (residual of 7.1.8).
7. **A per-route CSP and payment policy** for any partner checkout (E-09).
8. **A moderated usability study on phones** in English and Malay (the team runs it; MAHB recruits, OOS-15).

### 7.2 Dependent on MAHB data, systems or partners

1. **Official flight feed** behind the provider interface, proven against the failure states (OOS-01).
2. **Operations status feed and notices CMS** with bilingual approval, a notice live in under 5 minutes without a
   deploy, and a named duty owner (OOS-02).
3. **Official parking tariff and a booking deep link** that accepts product, dates and a referral code (OOS-03).
4. **Fast Track and lounge commercial data and agreements**: seller, price, hours and checkpoints; lounge access rules,
   prices and booking from each operator; partner referral codes and confirmed conversions (D-02, OOS-04, OOS-13).
5. **Content minimum for every international airport**, Kuching and Langkawi first, and a concessionaire directory
   feed with hours, location, price band and halal status (OOS-05, OOS-06).
6. **Airline and airport facts**: assistance rules and notice periods for AirAsia, AirAsia X, Batik Air and others;
   the operating airline and own contact for 33 airports (D-04, 6.1.8).
7. **Alert delivery** by web push, including iOS, and e-mail, with consent and unsubscribe (OOS-10).
8. **Operator-grade sourcing** with MAHB as the source of its own building and services, and brand, legal and
   native-Malay review (OOS-08, OOS-14).
9. **Hosting**: edge rate limits, the client-address header declared, `security.txt`, and field Core Web Vitals on a
   mid-range Android over Malaysian networks before launch (OOS-11, OOS-12, OOS-15).
10. **B2B enquiry channels** for retail space, advertising, route development, cargo and Aeropolis (D-17).

**Position.** A closed KLIA pilot is reasonable once 7.1 items 1 and 2 are done and MAHB has delivered 7.2 items 1
and 2. Of the second review's pilot conditions, the team's attribution, one-fact, home-card and status-line items are
now met; CI and TBT are not; MAHB's are unchanged; and the saved-flight failure is a new condition. Public launch across
the network needs all of 7.2 except the B2B channels, plus 7.1 items 1 to 7.
