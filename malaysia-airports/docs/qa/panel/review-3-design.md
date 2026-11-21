# Third review, after fix rounds four and five: design director

Date: 22 November 2026. Reviewer: one of three independent reviewers. My lens is that of a UX and visual design
director: hierarchy, density, clarity, interaction quality, mobile ergonomics, navigation, search and the AI
concierge. I have not read the other two third-round reviews.

## Verdict

Rounds four and five fixed most of what the second design review named as fixable by the team. I checked each fix
on the running production build:

- **Answer-first on phones.** The KLIA Ekspres fare is on the first phone screen (431 px; the second review measured
  1,821 px). The transit verdict is a sticky summary that stays in view while you change the form. The map's From
  and To controls come before the drawing.
- **Delayed flights.** A delayed flight now uses one time basis on the next-step card, the timeline and the home
  card, and the card leads with "Delayed: now 07:50".
- **Concierge.** It says "I can't answer that from our verified content" instead of showing unrelated cards. It
  answers a wheelchair request on AirAsia honestly.
- **Search.** Fast Track results name their terminal, and "smoking" and "wifi" give honest "not published"
  results.
- **Density on the flight page.** One Demo banner per view, 2 source toggles, and 8 type sizes on most pages.

The product is now a strong consumer design on phones. It is not yet a best-in-class one, for these reasons:

- **The concierge.** It still misreads some intents ("Can you book me a taxi?" lists six transport modes, with the
  car-park shuttle first). A single answer still takes 500 to 1,163 px on a phone.
- **Search.** It still has gaps ("pharmacy" returns nothing at all) and noise ("charging" returns trains).
- **The KLIA overview.** It gives its first phone screen to a 100-word notice, and puts flight search at 2,236 px.
- **The desktop board.** It shows only one flight row above a 900 px fold.
- **Page length.** Long pages remain: facilities is 15,451 px on a phone.
- **What only MAHB can supply.** Everything that depends on MAHB is unchanged: no live data, a schematic map, no
  alert delivery when the page is closed, and nothing to buy.

**Rubric total: 79.5%** (judgement, medium confidence). The second design review gave 75.5%, the second-review panel
median was 74.5%, and Heathrow, the best single benchmark, scores 79.0%. The lead over Heathrow is within the
matrix's stated uncertainty of about 3 points. It rests on design as scored "as if production data were connected"
(ux, flight, mobile, nav, ai, ui), not on the product as it can be used today.

**Readiness** (judgement). My view is not ready for a public launch. It is ready, in my lens, for the closed KLIA
pilot the panel recommended, once MAHB connects the flight feed. The design blockers in section 7 are each small and
fixable by the team. Every flight, gate, queue and status value in this review is demonstration data.

---

## 1. Method

- **Session.** 06:04 to 06:25 Kuala Lumpur time on Sunday 22 November 2026 (server and browser clock). This is
  outside the empty night window, so I did not fix the clock. The board was populated with demonstration flights
  from about 06:00.
- **Build and server.** I used the final round-five build in `.next` (build `b4AW-Kxsx1vSRiJq7KWD0`), served with
  `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3303`. I stopped only that process and its two
  children at the end. I did not rebuild, run git, or edit anything outside this file.
- **Browser and set-ups.** Playwright drove Chromium (`chromium.launch()`, no options), with:
  - phone first: 390 x 844, device scale 2, touch, Pixel 7 user agent;
  - desktop: 1440 x 900;
  - dark mode: `prefers-color-scheme: dark` emulation;
  - large text: 125% root text on the flight page.

  Each context sent its own client address, so rate limits did not shape what I saw.
- **What I measured.** With scripts in my scratch folder, I recorded:
  - vertical positions in CSS px from the top of the document (on the 844 px phone the bottom bar starts at
    788 px);
  - per page, inside `<main>`:
    - distinct font sizes of visible text;
    - elements with `text-transform: uppercase`;
    - `[data-provenance]` tags;
    - `<summary>` source toggles;
  - the text of concierge answers, palette results and status messages.

  My upper-case count is not the second review's method, so compare it only with itself.
- **What I looked at.** I read 9 images, which hold 22 screenshots between them (montages), all kept under
  `scratchpad/review3-design/`, not in `docs/`.
- **Reading done first.**
  - [`re-review.md`](re-review.md): the verdict, section 5, section 6.1 and the round-four addendum;
  - [`re-review-design.md`](re-review-design.md);
  - in [`../verification.md`](../verification.md): F4, F8 and the round-five sections G1 to G8;
  - [`../fix-backlog.md`](../fix-backlog.md): the headings of packages A to C;
  - the headings of the six round-four and round-five fix logs.
- **Performance.** I did not measure performance: other servers were running on the machine. Every performance
  figure here is from `verification.md` round five and is marked **[verification]**.
- **Limits.**
  - Chromium only: no WebKit and no iPhone Safari.
  - No real device, screen reader or voice control.
  - No usability study.
  - One clock time.
  - The flight data is generated, and the concierge answers from a fixed knowledge file on the device.

## 2. Pages and views checked (49)

**Phone, 390 x 844 (34):**

1. `/en` home
2. home with "parking" typed in the flight field, then Enter, which goes to `/en/search?q=parking`
3. home after saving AK 6336
4. `/en/kul` overview
5. `/en/kul/flights` board: filter, Pause, Earlier and Arrivals
6. flight page `ak6336-20261122-d` (AirAsia, delayed 07:00 → 07:50)
7. flight page `mh2807-20261122-d` (check-in open): Follow, My needs (Wheelchair), Save
8. `/en/kul/map`, a Departures drop-off → Gates C route, including the step-free switch
9. `/en/kul/transport`
10. `/en/kul/transit`, changing the layover to 45 min
11. `/en/kul/parking`
12. `/en/kul/facilities`
13. `/en/kul/lounges`
14. `/en/kul/shop-dine`
15. the search palette from the bottom bar, with 20 queries and the keyboard
16. `/en/search?q=wheelchair`
17. `/en/concierge`, with 14 questions
18. `/ms/concierge`, with 3 questions and the airport chooser
19. `/en/journey`
20. `/en/corporate`
21. `/en/help`
22. `/en/guides`
23. `/en/notices`
24. `/en/airports`
25. `/en/accessibility`
26. `/en/pen`
27. `/en/lgk`
28. `/en/lgk/transport` (404)
29. `/en/kul/zzz` (404)
30. `/ms` home
31. `/ms/kul/transport`
32. the phone Menu sheet
33. the flight page at 125% text

**Dark mode, phone (3):**

34. home
35. flight page
36. map with a route

**Desktop, 1440 x 900 (15):**

37. `/en`
38. `/en/kul`
39. `/en/kul/flights`
40. `/ms/kul/flights`
41. flight page `mh2807`
42. palette (Ctrl+K, arrows, Enter)
43. `/en/corporate`
44. `/en/guides`
45. `/en/help`
46. `/en/journey`
47. `/en/airports`, with its map labels at 1440 and 390
48. `/en/notices` and `/en/accessibility`
49. `/en/kul/facilities`, `/en/kul/lounges` and `/en/kul/shop-dine`

---

## 3. Item checks

Status is one of **fixed**, **improved**, **unchanged** or **worse**, against the second design review. "First-hand"
means I saw it on the running build this session. **[verification]** means the figure is from `verification.md`.

### 3.1 The second design review's ten weaknesses

| # | Weakness (second review) | Status | What I did and saw |
|---|---|---|---|
| 1 | Density and label noise (20 tags, 10 Demo labels and 6 toggles on the flight page; 21 toggles on facilities; about 70 upper-case labels and 12 type sizes on the home) | **Improved; not finished** | Flight page (phone): 13 to 17 `[data-provenance]` tags, one Demo banner and an inline "Demo" chip on each simulated value, 2 toggles, 8 type sizes. Facilities: 11 toggles. Parking: 3 toggles, 0 Demo tags on its cards, 7 sizes. Home: 8 type sizes (9 with a saved flight, as [verification] says) and 28 upper-case text elements (my method). Still dense: a filtered board ("penang") gives each one-flight hour group its own header with a Demo chip (20 group headers for 20 rows). Phone pages are long (facilities 15,451 px, accessibility 12,273, transport 11,952, home 8,726). On the overview an advisory notice carries an "Estimated" chip |
| 2 | Concierge fallbacks look relevant when they are not | **Fixed** | Weather and durian: "I can't answer that from our verified content. For a definite answer, contact Malaysia Airports customer support (group line), +60 3 8777 0000", then a "Talk to a person" card, with no unrelated cards. The same in Malay ("Saya tidak dapat menjawabnya…"). Residual: sending a weather question to the airport's support line is odd. "Can you book me a taxi?" is misread (it lists six modes, with the Long Term Car Park shuttle first) |
| 3 | Concierge misses access qualifiers; template grammar | **Fixed** for the cases named | "I need a wheelchair at the gate, I fly AirAsia" leads with "The assistance rules of AirAsia are not published in our sources. Ask AirAsia…", and there is no Calm Room card. "Di mana tandas OKU berhampiran pintu C?" asks which airport, then answers "Lokasi tandas OKU di KLIA Terminal 1 belum diterbitkan dalam sumber kami." "Lift from arrivals to the train" leads with "Step-free access … is not published". I saw no slot-grammar errors in 17 answers. Residual: gate C exists only at KLIA, yet the concierge still asks which airport |
| 4 | Concierge answers too long on a phone (500 to 2,301 px) | **Improved** | 14 English turns measured 500 to 1,163 px, each with "Show N more items". The lead line is large and first, and the field stays in view (716 px) with focus. Still long: the "can't answer" turn is 881 px, mostly a contact list. The fare answer states RM 55 three times (lead, card and a second card) |
| 5 | Delayed-flight guidance contradicts itself | **Fixed** | AK 6336 (07:00 → 07:50): the card reads "Delayed: now 07:50 · Check in: Row X, counters 2-7 · Check-in closes 07:05 · Boarding 07:20". The timeline reads "The times below follow the new departure time, 07:50 … if AirAsia tells you to keep to the original check-in time, do that". The saved card on the home reads "07:50 Delayed … Check-in closes 07:05 · Now: Check in and drop your bags". One basis throughout, and no past time shown as "Next" |
| 6 | Answer-first unfinished (transport 1,821 px; transit 1,186 px under the form; desktop board 938 px) | **Fixed on phones; improved on desktop** | Transport fare at 431 px (`/ms` 493). Transit verdict summary at 454 px. After changing the layover it is sticky at 64 to 174 px in the viewport and reads "Very tight · Our estimate 55 min to 1 h 50 min; your time 45 min". Desktop board: first row at 798 to 850 px (Malay 819 to 871). Only one row clears the 900 px fold, under four bands (demo bar, board header, Earlier, column headings) |
| 7 | Map: wireframe schematic; route below the controls; chip covers the disclaimer | **Improved** | From at 544 px and To at 627 px, before the drawing (933 px). The disclaimer is a strip above the drawing and nothing covers it. New small overlap: the floating "To Gates" chip now covers the "Immigration and security" place label, in light and dark. After choosing a route the drawing is below the first screen and the steps start at 1,633 px. Still a schematic (MAHB) |
| 8 | Following delivers nothing when the page is closed | **Unchanged** (MAHB, OOS-10) | Follow panel: "only while a page of this site is open. Nothing reaches you when the browser is closed yet"; "Follow by e-mail: Demonstration: nothing is sent." Honest and well placed (Follow at 1,210 to 1,248 px) |
| 9 | Search relevance polish | **Improved** | Fixed: "Fast Track (Terminal 1)" and "(Terminal 2)"; "smoking" → "Smoking rooms: not published yet"; "wifi" → "Wi-Fi: not published yet"; "taxi" → the prepaid coupon taxi; "surau" → prayer rooms only; "MH 2" → flights and the airline. Still weak: "pharmacy" returns no result and no "not published" line; "charging" returns the inter-terminal train and shuttle; "lost and found" gives 39 options, with Medical services, Travel Club Lounge and Kepler under the right first hit; "money changer" and "grab" add unrelated KLIA Ekspres and vendor-scam items. Each result on the phone results page is 102 to 225 px tall |
| 10 | Long pages and stacked meta on phones; marketing `h1`; status chips cut at "Boardi"; "Save flight" label unchanged after saving | **Partly improved** | The English home `h1` is still "Your journey, beautifully connected." The Malay one is task-based ("Semak penerbangan, rancang perjalanan anda."). Overview: the first phone screen is the Aerotrain notice, and "Find a flight at KLIA" is at 2,236 px (second review 2,175). The board's status-filter strip still runs off the right edge ("De…") with no fade, although the section tab strip now has a 48 px fade. "Save flight" keeps its label after saving. The icon changes to a ticked bookmark, the fill darkens slightly, and a status line "Saved to My journey · Open My journey" appears (screenshot) |

### 3.2 The second design review's launch blockers

#### Fixable by the team

| # | Blocker (second review) | Status | Evidence |
|---|---|---|---|
| 1 | Concierge fallback, access qualifiers and airline, grammar, "In effect" on future changes | **Fixed in the concierge; one residual elsewhere** | See 3.1 rows 2 and 3. The concierge no longer calls the 2027 fare "In effect". But the KLIA overview's notice card "KLIA Ekspres adult fare: RM65 from 1 January 2027" still shows "In effect now · 1 Oct 2026 to 31 Jan 2027" (desktop screenshot and phone text). That reads as if RM 65 applies today |
| 2 | Concierge answer length | **Improved** | 500 to 1,163 px, against the target of one lead line and two cards. Collapsed lists ("Show N more items") are in place |
| 3 | Delayed-flight consistency | **Fixed** | 3.1 row 5 |
| 4 | Answer-first on transport, transit and the desktop board | **Fixed** (transport, transit); **improved** (desktop board) | 3.1 row 6 |
| 5 | Density (A-14) | **Improved** | 3.1 row 1. [verification] A-14 is still not verified: 8 of 280 pages have 9 sizes at 390 px, and 11 at 1440 |
| 6 | Map on phones | **Improved** | 3.1 row 7 |
| 7 | Search relevance (A-12) | **Improved** | 3.1 row 9 |
| 8 | Performance and CI | **Improved, not met** [verification] | Mobile Lighthouse 91 to 99 and LCP ≤ 1.22 s on 10 of 10 pages (flight page fixed from 4.2 to 4.9 s). TBT is over 200 ms on 6 to 8 of 10 pages. Congested Wi-Fi LCP is 2.57 / 2.65 s. CI and WebKit have never run on a runner |
| 9 | Moderated usability study | **Not run** | A plan exists ([`../usability-study-plan.md`](../usability-study-plan.md)) |

#### Dependent on MAHB data, systems or partners

All six are **unchanged**:

1. **Feeds.** The flight feed and the status and queue feeds are not connected. The overview shows "From notices
   published up to 7 Oct 2026. No live operations feed is connected yet." Three services read "Status not
   available"; the queue estimates are demonstration data.
2. **Alert delivery.** 3.1 row 8.
3. **Tariffs, Fast Track and lounges.**
   - Parking: "Rates not verified: klia.info (undated) gives RM 52 a day".
   - Fast Track: price, hours and seller are "Not published in our sources".
   - Lounges: no prices.
4. **Map.** Still a schematic: "This is a schematic demonstration map, not a floor plan".
5. **Airline assistance rules.** For AirAsia, the concierge and the timeline say they are not published. Malaysia
   Airlines' 48-hour rule is shown.
6. **Sourcing, brand and native Malay review.** Not visible as a change. `/en/lgk/transport` still answers 404.

### 3.3 Round-four and round-five claims in my lens

Each claim is checked first-hand unless marked [verification].

| Claim (log, verification item) | Status | Evidence |
|---|---|---|
| R4 trust 6.1.1: status lines without "Checked hh:mm" or "No disruption" | **Fixed** | `/en/kul`: 0 "Checked", 0 "No disruption" and 4 "Status not available". "Notice dated 7 Oct 2026". The home strip reads "Services at KLIA now: 1 service has a notice" |
| R4 trust 6.1.2: day-of-travel residuals ("Past:", not "Done:"; one time basis; assistance notice) | **Fixed** | AK 6336 timeline: "Past:" steps, "Now: 05:50 Check in and drop your bags", and the delay step first. With Wheelchair chosen on MH 2807: "Arrange assistance with Malaysia Airlines … Act now: If nobody has arranged assistance yet, contact Malaysia Airlines now", plus the 48-hour rule |
| R4 ask 6.1.4: concierge fallback, qualifiers and length | **Fixed** (fallback, qualifiers); **improved** (length) | 3.1 rows 2 to 4 |
| R4 ask 6.1.5: search relevance | **Fixed** for the named queries; new gaps found | 3.1 row 9 |
| R4 layout 6.1.6: transport fare, transit verdict, map controls, desktop board, chips that wrap | **Fixed**, with residuals | 3.1 rows 6, 7 and 10. Chips themselves do not clip, but the board's filter strip has no overflow cue |
| R4 layout and R5 flight 6.1.7: density (one Demo marker per view, one source list per section) | **Improved; not finished** | 3.1 row 1. Flight page done. Board group headers still repeat the Demo chip |
| R4 trust 6.1.10: Malay `h1` and "Tanya Kami" | **Fixed** (Malay) | `/ms` `h1` "Semak penerbangan, rancang perjalanan anda."; `/ms/concierge` `h1` "Tanya Kami"; the placeholder "Taip soalan anda" fits. The English `h1` remains a marketing line |
| R5 flight 1: flight page answer before the feed, with LCP 1.22 s | **Fixed** (design part); [verification] for LCP | The next-step card is under the `h1` at about 238 px. At 125% text the `h1` is at 230 px and the card at 319 px, with no sideways scroll |
| R5 flight 2: board at night | [verification] **Verified** | Not testable in my session (06:04 to 06:25). Verification: LCP 0.92 s, with an empty state that offers the next steps |
| R5 flight 4 and R5 polish 3: flight page and parking density | **Fixed** | 3.1 row 1 |
| R5 polish 4: transport fare row | **Fixed** | Fare beside the option name on the first screen; "Today, until 31 Dec 2026 · RM 65 from 1 Jan 2027" |
| R5 polish 5: `/en/airports` map labels | **Fixed** | KUL, PEN and LGK are all inside the drawing at 1440 and 390 |
| R5 polish 2: search index "[object Object]" | **Fixed** | "MH 2" shows "Malaysia Airlines (MH) · KLIA" in plain text |
| R5 speed 3: concierge flights from the server feed | **Fixed** | "Is MH 785 delayed?" leads with "MH 785 shows as check-in open in the demonstration data. Your airline has the real status." It has the demo banner and the flight card |
| R5 speed 5: home type sizes (A-14) | **Partly** | 8 sizes on `/en` with no saved flight (11 to 26 px); 9 with a saved flight (adds 12 px); 9 at 1440 |
| Gallery note 3 and open issue 2: lazy-chunk failure | [verification] **Partly** | Not reproduced here. The home saved-flight card and My journey's clear control can still be replaced by "Something went wrong" when a script fetch fails |

### 3.4 Other first-hand observations

- **Focus after a palette selection** (A-05 residual): **unchanged**. On the phone, choosing a result returns focus
  to the bottom-bar Search button, not the destination. On desktop, Enter on "Accessible toilets: not published
  yet" leaves focus on `<body>` at `/en/accessibility#not-published`.
- **Palette.** Ctrl+K opens it on desktop. The active option has a 2 px magenta outline (rgb 166, 21, 127). Groups
  are labelled, a KLIA / All airports scope is in the dialog, and keyboard hints sit in the footer. There is no dim
  backdrop.
- **Board interaction.**
  - Typing "penang" gives "20 flights shown" across today and tomorrow, grouped by hour with "Tomorrow" marked.
  - "Pause live updates" toggles to "Resume live updates".
  - Arrivals is a URL state (`?dir=a`).
- **Home search.** "parking" announces "No flights match "parking". Pages that do are listed below, first: Parking
  at KLIA: prices and car parks."; Enter goes to 18 results.
- **Menu sheet.** It holds the airport, the sections, Assistance with the group phone line, More, Language and the
  display settings (theme, text size, high contrast, reduce motion). It is complete and well ordered.
- **Dark mode.** Body rgb(12, 14, 36) and `h1` rgb(244, 238, 223). The map, the needs control and the home all read
  well, and the demo strip stays distinct.

---

## 4. Scores

Scale 1 to 5 in half points. Anchors: 3 is a competent major airport, 4 is strong with evidence, 5 is a
best-in-class reference with first-hand evidence. As in rounds one and two:

- **info** and **commerce** are scored on what exists;
- **ux**, **flight**, **mobile**, **nav**, **ai** and **ui** are scored as designed, assuming production data is
  connected;
- **perf** rests on [verification].

No dimension gets a 5. Where live data is the point (flight, info), a prototype on demonstration data cannot earn it.

| Key | Weight | Second review (design) | **Now** | Change | Confidence | Reason |
|---|---|---|---|---|---|---|
| ui | 10% | 4.0 | **4.0** | 0 | Medium | A coherent cream, navy and amber system with a careful dark mode. The flight page is visibly calmer (one Demo banner, 2 toggles). Held back by the marketing English `h1`, a run-on next-step sentence, heavy mono runs, a map chip over a place label, an "Estimated" chip on a notice, and repeated Demo chips on filtered board groups |
| ux | 20% | 4.0 | **4.5** | +0.5 | Medium | The named task gaps are closed first-hand: fare at 431 px, sticky transit verdict, one time basis for delays, and honest concierge fallbacks. Short of 5: overview flight search at 2,236 px, the desktop board shows one row above the fold, pages up to 15,451 px, and no usability study |
| info | 15% | 3.0 | **3.0** | 0 | High | Sourcing and dating stay exemplary. Completeness is unchanged: unverified parking rates, no lounge prices, Fast Track details not published, accessible toilet locations not published, and Langkawi transport 404 |
| flight | 15% | 4.0 | **4.0** | 0 | Medium | The delayed state is now right on the card, the timeline and the home. The board has filter, Pause, Earlier, and Tomorrow groups. Still 4.0: alerts reach no one once the page is closed, and the 1440 x 900 board shows a single row above the fold |
| mobile | 10% | 4.0 | **4.5** | +0.5 | Medium | Every key phone task now answers on the first screen (flight card about 238 px, board 614, parking 340, transport 431, transit 454 and sticky, saved flight 319). The concierge field is sticky. 125% text and Malay fit, with no sideways scroll. Short of 5: very long pages, concierge turns up to 1,163 px, TBT over 200 ms on most pages [verification], and no alerts on iOS |
| nav | 10% | 4.5 | **4.5** | 0 | Medium | The palette and Menu sheet remain the strongest in the benchmark set, now with honest "not published" hits and terminal-qualified titles. Not 5: zero results for "pharmacy", noise for "charging", "lost and found" and "grab", and focus after a palette selection does not reach the destination |
| ai | 10% | 3.5 | **4.0** | +0.5 | Medium | It says when it cannot answer and who can, honours access needs and the named airline, reads the flight feed, and answers Malay in Malay. Not 4.5: "book me a taxi" gets a list of modes, Fast Track opens with "Here is what our sources say…", weather is sent to the airport support line, gate C does not imply KLIA, and answers repeat the figure across cards |
| commerce | 5% | 2.5 | **2.5** | 0 | High | Hand-offs are marked and tracked, and parking leads with prices. Nothing can be bought, and the prices are unverified. Level with MAHB today |
| perf | 5% | 4.0 | **4.0** | 0 | Low | [verification] Lighthouse 91 to 99, LCP ≤ 1.22 s on 10 of 10 pages (the flight page fixed), shell JS 70 → 33 KB. TBT over budget on most pages, congested Wi-Fi LCP 2.57 to 2.65 s, no field data, and CI not run on a runner |
| **Weighted** | | **75.5%** | **79.5%** | **+4.0** | Medium | |

Arithmetic: (4.0×10 + 4.5×20 + 3.0×15 + 4.0×15 + 4.5×10 + 4.5×10 + 4.0×10 + 2.5×5 + 4.0×5) / 5 = 397.5 / 5 =
**79.5%**.

**What moved my scores** (first-hand evidence, not the logs):

- **ux +0.5.** The transport fare, the transit verdict and the delayed-flight guidance were the three ux reasons the
  second review gave. All three are fixed on the running build (3.1 rows 5 and 6).
- **mobile +0.5.** Four of the second review's five mobile reasons were first-screen placement or answer length.
  Placement is fixed on every key page I measured, and concierge length is roughly halved at the top end.
  Performance and iOS alerts are unchanged.
- **ai +0.5.** The two failures that held ai at 3.5 are gone in English and Malay: unrelated fallback cards, and
  missed access qualifiers.
- **Unchanged:**
  - ui: the density fix is real but partial, and I found new small defects;
  - flight: alert delivery is unchanged, and the desktop board fold is still a problem;
  - nav: search fixes balance against new gaps I found.

Against the benchmark matrix this would place the product just above Heathrow (79.0%). The difference is inside the
matrix's stated uncertainty (about 3 points), and it rests on six dimensions scored as designed. It is a judgement,
not a measurement.

## 5. Strengths (first-hand)

- **Answer-first on phones, now on every key task.**
  - The flight next-step card names the delay, cabin row, check-in close and boarding time under the `h1`.
  - Parking leads with a 1 / 3 / 7-day price table.
  - Transport puts the fare with its date beside the option name.
  - Transit keeps a sticky verdict in view while you answer the form.
- **One time basis for delays, stated plainly.** "The times below follow the new departure time, 07:50. Times can
  change again: if AirAsia tells you to keep to the original check-in time, do that." The same basis appears on the
  card, the timeline and the home.
- **A concierge that knows its limits.** "I can't answer that from our verified content" with a named contact.
  "The assistance rules of AirAsia are not published… Ask AirAsia…". A flight question answered from the feed with
  the demo banner. The same quality in Malay.
- **Search that admits gaps.** "Smoking rooms: not published yet", "Wi-Fi: not published yet" and "Accessible
  toilets: not published yet" rank as first-class results. Fast Track titles carry the terminal. The home field
  falls through to page results with a clear announcement.
- **Navigation shell.**
  - The compact airport bar (KUL · KLIA · time · Sections).
  - A five-item bottom bar with Search at the centre and a Journey badge.
  - The section tabs fade at the edge.
  - A complete Menu sheet with the display settings.
  - Ctrl+K and a visible active option in the palette.
- **Honest limits, presented calmly.**
  - The Follow panel says exactly what works.
  - The map disclaimer is a strip of its own above the drawing.
  - Status lines say "Status not available" and give the notices' as-of date.
- **Dark mode and large text.** True navy surfaces with readable contrast. At 125% text the flight `h1` is at 230 px
  with no sideways scroll.
- **Interaction details.** Pause and Resume on live updates. "Tomorrow" groups on the board. "My needs" adds an "Act
  now" assistance step to the timeline. Save confirms with "Saved to My journey · Open My journey".

## 6. Ten most significant remaining weaknesses (my lens)

Ranked by how badly each fails a top task. "Team" means the delivery team can fix it. "MAHB" means it depends on
MAHB data, systems or partners.

1. **No live operational data or alert delivery.** This is what an airport site is most used for. Every flight,
   gate and queue value is demonstration data, and Follow reaches no one when the page is closed. (MAHB: OOS-01,
   OOS-02, OOS-10)
2. **The concierge still misreads some intents and runs long.**
   - "Can you book me a taxi?" lists six transport modes, with the Long Term Car Park shuttle first, and never says
     it cannot book or points to the coupon counter.
   - Fast Track opens with "Here is what our sources say about Fast Track at KLIA."
   - A weather question is sent to the airport's support line.
   - "Gate C" does not imply KLIA.
   - Turns are 500 to 1,163 px on a phone, with the fare repeated three times.

   (Team, B-08)
3. **The KLIA overview buries its most-used tool.**
   - On a phone, the first screen is a 100-word Aerotrain notice, and "Find a flight at KLIA" is at 2,236 px.
   - On desktop the first screen is two long notice cards.
   - One card says "In effect now" beside "RM65 from 1 January 2027", which reads as if RM 65 applies today.

   (Team)
4. **Search gaps and noise.**
   - "pharmacy": no result and no "not published" line.
   - "charging": the train and shuttle.
   - "lost and found": 39 options, with Medical services and lounges under the right first hit.
   - "money changer": KLIA Ekspres items.
   - "grab": a vendor-scam item.
   - Focus after a palette selection lands on the Search button (phone) or `<body>` (desktop), not the destination.

   (Team, A-12, A-05)
5. **The desktop board wastes its first screen.** At 1440 x 900 only one row (798 to 850 px) clears the fold, under
   the demo bar, the board header, Earlier and the column headings. Malay is lower still (819 to 871). (Team)
6. **Page length and residual density.**
   - Phone pages: facilities 15,451 px, accessibility 12,273, transport 11,952, home 8,726.
   - A filtered board repeats a Demo chip on every hour group.
   - 9 type sizes on the home with a saved flight and on corporate pages; 11 pages over 8 at 1440 [verification].

   (Team, A-14)
7. **Map ergonomics on phones, and a schematic map.**
   - After choosing From and To (544 to 627 px), the drawing starts at 933 px and the steps at 1,633 px, so the
     change happens off screen.
   - The "To Gates" chip now covers the "Immigration and security" label.
   - The map is a schematic.

   (Team for the layout; MAHB for a surveyed map, OOS-07)
8. **Hierarchy and copy polish.**
   - The English home `h1` is still "Your journey, beautifully connected.", while the Malay one is task-based.
   - The next-step card is a single run-on sentence of four facts joined by dots.
   - "Save flight" keeps its label once saved.
   - The board's filter strip has no overflow cue.
   - An advisory notice carries an "Estimated" chip.

   (Team)
9. **Robustness and responsiveness.**
   - [verification] TBT is over 200 ms on most pages, and congested Wi-Fi LCP is 2.57 / 2.65 s.
   - A failed script fetch still replaces the home saved-flight card with "Something went wrong" (open issue 2).
   - The header airport switcher shifts after hydration.

   (Team)
10. **Content thinness behind good design.** No lounge prices or access rules, Fast Track details not published,
    unverified parking rates, 8 outlets on shop and dine, and a Langkawi transport page that answers 404. (MAHB:
    OOS-03 to OOS-06, OOS-13)

## 7. Launch blockers

### Fixable by the delivery team

1. **Concierge intent and length.**
   - Recognise requests it cannot perform ("book me a taxi" → "I can't book; use the coupon counter", with the
     official taxi card).
   - Answer Fast Track with "Yes, at Terminal 1: book on …".
   - Route out-of-scope questions (weather) to "outside what I cover" rather than to the airport support line.
   - Infer KLIA from a gate letter.
   - Show one lead line and at most two cards on a phone, without repeating the figure.
2. **KLIA overview hierarchy.**
   - Put "Find a flight" above the notices on phones, or condense the notice to one line with "Details".
   - Change "In effect now" on future fare changes to "Announced; applies from 1 January 2027".
   - Drop "Estimated" chips from notices.
3. **Search vocabulary and focus.**
   - A "not published" line for common facility words that have no record (pharmacy, ATM, charging).
   - Down-rank unrelated help and news items.
   - Cap noisy result sets.
   - Move focus to the destination's `h1` or anchor after a palette selection.
4. **Desktop board fold.** Combine the demo bar and the board header, and put at least five rows above a 900 px fold.
5. **Density pass (A-14).**
   - One Demo marker per board view, not per hour group.
   - Type sizes to 8 on the home with a saved flight and on the corporate pages.
   - Shorten facilities, accessibility and transport on phones with section summaries or collapsed groups.
6. **Map on phones.** Scroll the drawing into view when a route is chosen, or keep a mini route summary sticky.
   Keep the route chip off place labels.
7. **Copy and state polish.**
   - A task-based English home `h1`.
   - A next-step card laid out as labelled facts.
   - "Saved" as the label of the saved state.
   - A fade on the board's filter strip.
8. **Robustness and performance** [verification]. Use `retryingImport` for the home saved card and My journey (open
   issue 2). Bring TBT under 200 ms on the key pages or agree revised budgets. Run CI and WebKit on a runner.
9. **A moderated usability study** of the top phone tasks in English and Malay, including screen-reader and
   magnifier users. The team runs it; MAHB recruits and signs it off (OOS-15).

### Dependent on MAHB data, systems or partners

1. **Feeds.** The official flight feed, and the operations status and queue feeds with a notices CMS (OOS-01,
   OOS-02).
2. **Alert delivery** by web push, including iOS, and by e-mail (OOS-10).
3. **A surveyed terminal map** with real geometry and located accessibility facilities (OOS-07, C-08).
4. **Commercial facts.** Parking tariff and dated booking link; Fast Track price, hours and seller; lounge access
   rules and prices (OOS-03, OOS-04, OOS-13).
5. **Assistance rules** for AirAsia and the other main carriers, and the airport's own assistance service (D-04).
6. **Content, sourcing and review.** A content minimum for the other international airports (Langkawi transport is a
   404), operator-grade sourcing, and native Malay, brand and legal review (OOS-05, OOS-06, OOS-08, OOS-14).

**Prototype-only, not defects:**

- demonstration flights, gates, queue estimates and alerts;
- illustrative map positions;
- unverified car-park figures;
- "not published" facts;
- on-device concierge answers from a fixed knowledge file;
- the "Concept prototype, not official" banner.
