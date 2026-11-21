# Re-review after three fix rounds: design director

Date: 21 November 2026. Reviewer: one of three independent re-reviewers, with the lens of a UX and visual design
director (hierarchy, density, clarity, interaction quality, mobile ergonomics, navigation, search and the AI
concierge). I have not read the other re-reviews.

## Verdict

The three rounds fixed most of what the round-one design review asked for:

- the airport chrome on phones
- the home page that ignored a saved flight
- the flights-only home search
- the wrong "Now" step on closed and departed flights
- Label in Name
- focus after navigation
- the palette's invisible active option
- a concierge that did not lead with the figure asked for

I checked each of these on the running production build. The product is now clearly better than the round-one
build. It is still not a best-in-class consumer product, for four reasons:

- **Density.** The flight page carries 20 provenance chips and 10 "Demo" labels. Facilities still has 21 source
  toggles.
- **The concierge's fallbacks.** Asked about the weather, it offers KLIA Ekspres fares and KLM. Asked for a
  wheelchair on AirAsia, it leads with the Calm Room.
- **Answers still below the first screen.** On transport and transit the answer is not on the first phone screen.
  On desktop the first board row is below the 900 px fold.
- **The map.** It is still a schematic, and its route chip covers its own disclaimer on phones.

Most of what keeps the product from launch still depends on MAHB data, systems or partners.

**Rubric total: 75.5%** (judgement, medium confidence). The round-one design review gave 71.5%, the round-one
panel average was 70.8%, and Heathrow, the best single benchmark, scores 79.0%.

---

## 1. Method

- **Build and server.** I used the existing production build in `.next`, started with
  `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3303`. I stopped only that process when I had
  finished. I did not rebuild, and I did not edit anything under `src/`, `e2e/` or the config files.
- **Browser and devices.** Playwright drove Chromium (`chromium.launch()`, no options) with three set-ups:
  - phone first, with the Playwright "Pixel 7" profile (412 x 839 CSS px, touch);
  - desktop at 1440 x 900, plus 1280 x 900 for the tab strips;
  - dark mode through `prefers-color-scheme: dark` emulation.
- **Large text.** I set the root font size to 125% on three task pages.
- **Clock.** The application clock read 18:35 to 18:41 MYT on Saturday 21 November 2026. Flights are demonstration
  data generated around that time, so the flight numbers below are only reproducible at a similar clock time.
- **What I measured.** With scripts in a scratch folder, not the repository, I recorded:
  - the vertical position in CSS px from the top of the document (on a 839 px phone viewport the bottom bar starts
    at 782 px);
  - counts of provenance chips (`[data-provenance]`), source toggles (`<summary>`), "Demo" labels, upper-case leaf
    labels and distinct type sizes in `<main>`;
  - focus targets and accessible names;
  - the text of concierge answers and search results.
- **What I looked at.** I read 14 screenshots, all kept outside `docs/`.
- **Reading done first.** [`panel-summary.md`](panel-summary.md), [`ux-frequent.md`](ux-frequent.md), the relevant
  parts of the other two round-one reports, [`../fix-backlog.md`](../fix-backlog.md) and
  [`../verification.md`](../verification.md) (rounds one to three, including T5).
- **Performance.** I did not measure performance: other servers were running on the machine. Where I cite
  performance, the figure is from `verification.md` section T2.4 and is marked **[verification]**.
- **Limits.**
  - Chromium only: no WebKit and no iPhone Safari.
  - No real device, screen reader, magnifier or voice-control software.
  - No usability study with passengers.
  - One clock time.
  - Every flight, gate, queue and status value is simulated.

## 2. Pages and views checked (32)

**Phone (Pixel 7):**

1. `/en` home, before and after saving a flight
2. home search with "parking" typed, then Enter, which goes to `/en/search?q=parking`
3. `/en/search` for "fast track" and "wheelchair"
4. `/en/kul` overview
5. `/en/kul/flights` board, including "Show earlier flights"
6. flight page `mh1698` (delayed)
7. flight page `ey411` (departed)
8. flight page `od2219` (final call)
9. flight page `mh1662` (gate closed)
10. `/en/kul/map`, with three routes, one of them step-free
11. `/en/kul/transit`, with two scenarios
12. `/en/kul/parking`
13. `/en/kul/transport`
14. `/en/kul/lounges`
15. `/en/kul/facilities`
16. `/en/kul/shop-dine`
17. `/en/concierge`, with 13 questions
18. search palette from the bottom bar, with 14 queries
19. `/ms/kul/transport`
20. `/ms/concierge`, with 2 questions
21. flight, transit and parking at 125% root text

**Dark mode, phone:**

22. home
23. flight page

**Desktop (1440 x 900, and 1280 x 900 for the tabs):**

24. `/en` home
25. `/en/kul`
26. `/en/kul/flights`
27. flight page
28. search palette (mouse and keyboard)
29. `/en/corporate`
30. `/en/guides` and `/en/help`
31. `/en/journey` and `/en/accessibility`
32. `/en/airports` and `/en/notices`

---

## 3. Item checks

### 3.1 Round-one panel weaknesses

Each weakness is checked on the running build. The status is fixed, improved, unchanged or worse.

| # | Round-one weakness | Status | What I did and saw |
|---|---|---|---|
| 1 | On a phone the answer is not on the first screen | **Improved** (largely fixed) | Every airport sub-page has a single compact airport bar (KUL · KLIA · time · Sections). The `h1` sits at 156 to 184 px on the board, flight, map, transit, parking, transport, lounges, facilities and shop pages. Where answers now sit: first board row 615 px (round one 1,173); flight "Your next step" card under the `h1` (gate B6 at 277 px; round one 1,306); parking "Prices at a glance" 340 px; saved-flight card on the home 294 px. Still below the first screen: KLIA Ekspres fare 1,821 px on transport (1,955 px in Malay); transit verdict 1,186 px; overview flight search 2,175 px |
| 2 | Commercially weaker than the site it replaces | **Improved slightly** | Fast Track now appears in four places, each with its price, hours and seller marked "Not published": a card per terminal on the overview ("Services you can book", 5,077 px on a phone), the palette, the search page and the concierge. Parking leads with a price table, but the only figure is the Terminal 1 car park "≤ RM 52 a day", marked "Not verified … according to klia.info"; the next row, Preferred Parking, says "No price published" (I did not read every row). Nothing can be bought, and lounges have no price |
| 3 | No live data path and no operational layer | **Improved in the prototype; unchanged in substance** | "Services now" blocks on the overview and transit, and "Services at KLIA now: 1 service has a notice" on the home. All are notice-based. Flights are demonstration data. A live feed is MAHB's (OOS-01, OOS-02) |
| 4 | Wrong guidance on the day of travel | **Fixed for closed and departed flights; residual on delayed ones** | Each status now gets its own step: EY 411 "Flight EY 411 departed at 15:50"; MH 1662 "Gate closed at 18:30: departs 18:45"; OD 2219 "Check-in closed at 18:10 … If you have not checked in, contact Batik Air". The delayed MH 1698 (scheduled 18:30, estimated 19:45) is inconsistent: see the note under this table |
| 5 | Following a flight does not work where it matters | **Improved (design); unchanged (delivery)** | "Follow" now sits beside "Save flight", "Share" and "Add to calendar" at 1,194 px (round one: alerts at 5,321 px). Its panel says plainly that alerts arrive "only while a page of this site is open" and that e-mail is a demonstration ("nothing is sent"). Delivery is MAHB and partners (OOS-10) |
| 6 | Travellers with access needs cannot plan with confidence | **Improved in parts** (lens overlap only) | The map's step-free switch adds "use a lift or ramp; ask staff if you cannot see one" on the change of level. The arrival hall to prayer room step-free route uses the lifts. The concierge still fails "I need a wheelchair at the gate, I fly AirAsia": the first card is the Calm Room. I did not check the "My needs" control (B-11) |
| 7 | Search, the concierge and the home do not answer the question asked | **Fixed (home, search); improved (concierge)** | Typed "parking", the home field lists pages under "No flights match", and Enter opens `/en/search?q=parking` with 7 parking results. "lift", "troli", "tukar wang", "buggy" and "fast track" all return results. The concierge now leads with "The KLIA Ekspres fare to KL Sentral (fare until 31 December 2026) is RM 55", "AirAsia flies from KLIA Terminal 2", "Nearest to gate C: Malaysia Airlines Golden Lounge (Satellite)", the arrive-by rule and the Aerotrain closure. Its fallbacks remain weak (section 6) |
| 8 | Content is thin and not operator-grade | **Unchanged** (scored on what exists) | 8 outlets on shop and dine. No lounge prices or access rules. One unverified car-park rate. Many "Not published" lines |
| 9 | Noise competes with answers | **Unchanged in substance** | Flight page: 20 provenance chips, 10 "Demo" labels, 6 source toggles. Facilities: 21 source toggles (round one: 21). Home: about 70 upper-case labels (68 and 72 on two loads; round one counted 78) and 12 type sizes (13). The 90-word "not verified" block is gone from the journey steps I read (D-05) |
| 10 | Performance misses its budgets | **Improved, still not met** [verification] | Mobile Lighthouse 92 to 99. LCP 0.92 to 1.11 s on 10 of 10 pages. TBT over 200 ms on 7 of 10 pages (`/en` 257, overview 353). The CI budget step has never run. Not re-measured here |

**Residual on delayed flights (row 4).** MH 1698 was scheduled at 18:30 and estimated at 19:45. Its timeline and
the home card disagree with each other:

- The first step tells the traveller to "Keep to the original check-in times".
- The "Now" step says "Check-in … closes at 19:00", which is based on the new time.
- At 18:35 the saved-flight card on the home still reads "Be at the airport by 16:30" and "Next: Check in and drop
  your bags 16:30".

### 3.2 Critical and P0 backlog items in my lens

| ID | Item | Status | Evidence |
|---|---|---|---|
| A-01 (critical) | Airport chrome on phones | **Fixed** | Compact bar about 56 px high. `h1` at 156 to 184 px on nine sub-pages and at 230 px with 125% root text. No sideways scroll on the three pages I checked. The overview keeps the full header by design (`h1` 151 px, terminal chips, tabs) |
| A-02 (critical) | Label in Name on the airport switcher | **Fixed** | The switcher's text is "KUL, change airport (currently KLIA)", so the accessible name starts with the visible "KUL". Not tested with speech software |
| A-03 (critical) | Flights-only home search | **Fixed** | "parking" and "fast track" fall through to page suggestions and a "See all results" link. Enter goes to `/en/search` |
| C-01 (critical) | Parking not price-first | **Improved** | A "Prices at a glance" table (1, 3 and 7 days) is the first block at 340 px. The figures are capped estimates from one unofficial source. I did not test the dated booking hand-off. The official tariff is MAHB's |
| B-01 (critical) | Operational status layer | **Improved (prototype)** | Notice-based "Services now" lines on the overview, home and transit. Queue figures are demonstration data |
| E-01 (critical) | Mobile performance | **Not met** [verification] | See row 10 above |
| A-04 | Demo label out of view | **Fixed** | Board: hatched "DEMO Simulated, not live" bar plus a "Demo" chip per group header. Flight summary: a "Demo" chip. Saved card: a "Demo" chip. The cost is density (A-14) |
| A-05 | Focus after navigation | **Fixed** | "See this step" moves focus to the step's `<li>`, and the next Tab goes to the step's source toggle. A bottom-bar link to Flights moves focus to the `h1` "Flights". Minor exception: after choosing a palette result on the phone, focus returns to the bottom-bar Search button, not the destination |
| A-06 | Palette active option | **Fixed** | The active option has a 2 px magenta outline (rgb 166, 21, 127) as well as the tint. A footer reads "Arrow keys to move, Enter to open, Escape to close" |
| A-08 | Home ignores the saved flight | **Fixed** | After saving MH 1698, the home shows "Your saved flight" at 294 px with status, terminal, gate, arrive-by and next step, and the Journey tab shows a badge of 1. The arrive-by time can be in the past (row 4) |
| A-11 | Controls cover content | **Fixed at default text** | The floating Search button no longer covers the Lounges tile (screenshot). At 125% text the `h1` clears the bar. I did not check every page at 125% |
| A-12 | Search vocabulary | **Improved** | "lift", "troli", "tukar wang", "buggy" and "fast track" return results. Still weak: "smoking" returns nothing; "surau" ranks a solar-farm news story second; "buggy" lists "Sensory walls" twice; "fast track" returns two results titled only "Fast Track", with no terminal |
| A-13 | Tab strips clipped | **Fixed** for section tabs | 1,240 of 1,240 px at 1440 and 1280. Malay tab-bar labels fit (Utama, Penerbangan, Carian, Perjalanan, Menu). The board's status chips run off the phone screen at "Boardi" with no fade, a minor case of the same issue |
| A-14 | Provenance and label noise | **Unchanged in substance** | See row 9 above (verification also lists it as not verified) |
| B-02 | Wrong "Now" step | **Fixed**, with the delayed-flight residual | Departed, gate-closed and check-in-closed states all read correctly. The delayed flight's guidance is inconsistent (row 4) |
| B-03 | Flight page not answer-first | **Fixed** | "Your next step: Check in: Economy: Row B, counters 1-18 · Gate B6 · Boarding 19:15" sits directly under the `h1` on phone and desktop. The card does not mention that the flight is delayed: the "Delayed" badge is about 560 px down |
| B-04 | Follow a flight | **Improved; delivery open** | See row 5 above |
| B-08 | Concierge misses direct answers | **Improved** | The fare, airline terminal, nearest lounge, arrive-by and Aerotrain answers now lead. Fast Track still opens with "Here is what our sources say about Fast Track at KLIA" rather than a yes and how to buy |
| B-12 | One cabin's row as the flight's | **Fixed** | The card names the cabin ("Economy: Row B"). The desktop status panel adds "Bag drop: F, G" |
| C-03 | Transit verdict too far down | **Improved** | 1,186 px (round one 2,943 to 4,279 px), above the steps. It updates live: "Looks workable" changes to "Very tight" for separate tickets from Terminal 2 to Terminal 1. On a phone it sits under a five-question form, so it is out of view while the answers change |
| D-02 | Fast Track absent | **Fixed (presence)** | Overview cards for Terminal 1 and Terminal 2, palette, search page and concierge. Price, hours and seller are "Not published" (MAHB) |
| D-05 | "Not verified" block in journey steps | **Fixed** in the steps I read | Not in the MH 1698 timeline |
| C-09 (P1) | Duplicate map option names | **Fixed** | Options carry their level, for example "Toilets · Level 5" and "Toilets · Level 3" |

---

## 4. Scores

Scale 1 to 5 in half points. Anchors: 3 is a competent major airport, 4 is strong with evidence, 5 is a
best-in-class reference with first-hand evidence.

**info** and **commerce** are scored on what exists. **flight**, **ux** and **ai** are scored as designed, assuming
production data is connected, as in round one. **perf** relies on the verification figures.

| Key | Weight | Round one (design) | **Now** | Confidence | Reason |
|---|---|---|---|---|---|
| ui | 10% | 4.0 | **4.0** | Medium | Coherent cream, navy and amber system with careful dark mode. The polish defects are fixed (tabs, floating button). Still held back by 20 chips and 10 Demo labels on the flight page, the marketing hero `h1`, heavy mono runs, and a schematic map whose route chip covers its own disclaimer on phones |
| ux | 20% | 4.0 | **4.0** | Medium | Home search, saved-flight card, answer-first flight page, price-first parking and the correct closed and departed states are real gains. Still: the transport fare is on the third phone screen, the transit verdict is out of view while you answer the form, and delayed-flight guidance contradicts itself |
| info | 15% | 3.0 | **3.0** | High | Sourcing and dating are exemplary. Completeness is unchanged: one unverified car-park rate, no lounge prices or access rules, 8 outlets, Fast Track details not published |
| flight | 15% | 4.0 | **4.0** | Medium | Network flight search, a next-step card, status-aware timeline states, a board anchored at now with Earlier and Pause, and Follow beside Save. Short of 4.5 because alerts reach no one once the page is closed and the delayed-flight guidance mixes the old and new times |
| mobile | 10% | 3.5 | **4.0** | Medium | One-row airport bar, `h1` at 184 px or less, first board row at 615 px, saved flight at 294 px, Malay labels that fit, no overlaps. Still: an 8,500 px home, concierge answers 500 to 2,300 px tall, fare and verdict below the first screen, TBT over 200 ms on 7 of 10 pages [verification], no iOS alerts |
| nav | 10% | 4.0 | **4.5** | Medium | The palette is the best search I have used on an airport site: grouped, scoped to the airport or the network, keyboard hints, visible active state, and a fall-through to a results page. Label in Name and focus are fixed, and Assistance is in the desktop utility bar. Short of 5 because of duplicate "Fast Track" titles, zero results for "smoking" and noisy secondary results |
| ai | 10% | 3.0 | **3.5** | Medium | Leads with the asked-for figure in 6 of my 9 core questions, and answers Malay questions in Malay on `/ms`. Fallbacks surface unrelated cards (weather → KLIA Ekspres and KLM; durian → power bank) instead of saying it cannot answer. It misses access qualifiers (wheelchair on AirAsia → Calm Room; Malay "tandas OKU" → generic assistance). Template grammar ("do not publish accessible toilet") and very long answers |
| commerce | 5% | 2.0 | **2.5** | High | Fast Track is now findable everywhere with a hand-off to the booking site, and parking leads with prices. Nothing can be bought, the prices are placeholders, and lounges have no price. Level with MAHB today, not ahead of it |
| perf | 5% | 3.5 | **4.0** | Low | [verification] Lighthouse 92 to 99, LCP 0.92 to 1.11 s, CLS 0 to 0.003, no third-party hosts: the lightest pages in the benchmark set. TBT is over budget on 7 of 10 pages, CI has never run, and there is no field data |
| **Weighted** | | **71.5%** | **75.5%** | Medium | |

Arithmetic: (4.0×10 + 4.0×20 + 3.0×15 + 4.0×15 + 4.0×10 + 4.5×10 + 3.5×10 + 2.5×5 + 4.0×5) / 5 = 377.5 / 5 =
**75.5%**.

On the benchmark matrix that places it above Dubai (71.0%), Hamad (69.0%) and Munich (66.5%), level with Incheon
(74.5%) and Hong Kong (75.5%), and below Changi and Istanbul (76.5%), Schiphol (77.0%), Haneda (77.5%) and Heathrow
(79.0%) (judgement).

**What would move it** (judgement):

- **Fixes the team can make** (section 7) would lift ui, ux, mobile and ai by about half a point each, to about
  80%.
- **MAHB's data** (tariffs, lounge rules, Fast Track details, surveyed map, live feeds) would add info and commerce,
  to about 85%.

## 5. Strengths (first-hand)

- **Answer-first flight page.** "Your next step: Check in … · Gate B6 · Boarding 19:15" sits under the `h1` on both
  phone and desktop, with the demo label beside it rather than over it.
- **Status-aware journey states.** Departed, gate-closed and check-in-closed flights each get the right "Now" step
  and a plain instruction ("If you have not checked in, contact Batik Air").
- **Search palette.**
  - Results are grouped (Facilities, Places on the map, Help, See all results).
  - A KLIA / All airports scope sits in the dialog.
  - A clear active option and keyboard hints.
  - Malay and colloquial words (troli, tukar wang, surau) are understood.
  - The home field falls through to site results.
- **Compact airport bar on phones.** One row with the code, name, airport time and a Sections menu replaces about
  440 px of chrome.
- **Saved flight on the home.** The card shows the live status, terminal, gate and next step at 294 px, with a
  Journey badge.
- **Honest limits.** The Follow panel says exactly what works today. The map labels itself "Schematic demonstration
  map, not a floor plan". Positions not yet verified are drawn as dashed "illustrative position" pins.
- **Dark mode.** True navy surfaces (body rgb 12, 14, 36) and readable contrast on the flight status card. The
  demo strip stays unmistakable.
- **Malay at parity in layout.** Tab-bar labels fit, and Malay concierge questions are answered in Malay on `/ms`
  ("Tambang KLIA Ekspres ke KL Sentral … ialah RM 55").
- **Interaction details.**
  - The board has "Pause live updates" and "1 flight has already left. Use Earlier to see it."
  - Transit verdicts update live.
  - Map routes give typical and slower walking times and a step-free variant.
  - The concierge's question field stays in view and keeps focus after an answer.

## 6. Ten most significant remaining weaknesses (my lens)

1. **Density and label noise.** These are still the main obstacle to consumer-grade polish:
   - the flight page has 20 provenance chips, 10 "Demo" labels and 6 source toggles;
   - Facilities has 21 source toggles, the same as round one;
   - the home has about 70 upper-case labels and 12 type sizes.

   Every concierge card carries its own "Official" or "Estimated" chip. (A-14)
2. **Concierge fallbacks look relevant when they are not.** Questions it cannot answer produce "I could not match
   that to one topic, but these published items look related":
   - weather → KLIA Ekspres fares and KLM;
   - durian in hand luggage → power bank and original documents.

   It never says "I can't answer that; here is who can". (B-08)
3. **The concierge misses access qualifiers and writes from templates.**
   - "I need a wheelchair at the gate, I fly AirAsia" leads with "Here is what our sources say about assistance at
     KLIA" and the Calm Room card.
   - "Di mana tandas OKU berhampiran pintu C?" gets a generic assistance line.
   - Slot-filled grammar: "Our sources do not publish accessible toilet for KLIA yet", and "smoking room" in the same
     frame.
   - A fare change that starts on 1 January 2027 is labelled "In effect".
4. **Concierge answers are too long for a phone.** One turn is 500 to 2,301 px tall: the nearest lounge 1,943, the
   wheelchair question 2,301, accessible toilet 1,661. The lead line is good. The cards and "what we have not
   verified" lists under it bury the next question.
5. **Delayed-flight guidance contradicts itself.** On MH 1698:
   - the first step says "Keep to the original check-in times";
   - the "Now" step says check-in "closes at 19:00", which is based on the new time;
   - the home card still says "Be at the airport by 16:30" at 18:35.

   The next-step card does not mention the delay. (B-02 residual)
6. **Answer-first is not finished.**
   - Transport: the KLIA Ekspres fare is at 1,821 px (1,955 px in Malay), after a five-line intro, two buttons and
     the touting warning.
   - Transit: the verdict is at 1,186 px under a five-question form, so changing an answer changes something you
     cannot see.
   - Desktop: the first board row is at 938 px on a 1440 x 900 screen, below the fold. The home board starts at
     about 890 px.
7. **The map is still a wireframe-grade schematic, and directions work against it on phones.**
   - From and To are at about 1,500 px, below the 302 px-tall map at 935 px, so you choose a route and scroll back
     up to see it drawn.
   - On a phone the floating "To Gates" chip covers the "Schematic demonstration map, not a floor plan" label (the
     two boxes overlap at 192 to 284 px across and 948 to 977 px down). Desktop is clear.
8. **Following a flight still delivers nothing when the page is closed.** The design is now honest and well placed.
   The function is absent: there is no push on iOS, and e-mail is a demonstration. (B-04, OOS-10)
9. **Search relevance polish.**
   - Two results are titled only "Fast Track" (the terminal is missing from the title) in the palette and on the
     results page.
   - "smoking" returns nothing and offers no suggestion.
   - "surau" ranks a solar-farm news story second.
   - "buggy" lists "Sensory walls" twice.
   - Each result on the phone results page takes about 215 px.

   (A-12)
10. **Long pages and stacked meta on phones.**
    - The home is about 8,500 px long and still opens with the marketing `h1` "Your journey, beautifully connected."
    - The overview gives its first screen to a 100-word Aerotrain notice; flight search is at 2,175 px.
    - The board stacks four bands (demo bar, time window and Pause, Earlier, group header) of about 250 px before
      the first row.
    - Its status chips are cut off at "Boardi".
    - "Save flight" keeps the same label after saving; only `aria-pressed` and the styling change.

## 7. Launch blockers

### Fixable by the delivery team

1. **Concierge fallback.** When no intent matches, say so and route to the official contact or the airline. Show no
   unrelated cards. Honour access qualifiers (wheelchair, OKU, accessible) and the airline named, in English and
   Malay. Fix the template grammar and the "In effect" label on future changes. (B-08)
2. **Concierge answer length on phones.** One lead line, at most two cards, and the rest behind "More". Move "what we
   have not verified" lists behind a toggle.
3. **Delayed-flight consistency.** Use one time basis for check-in, arrive-by and the next step. Never show a past
   arrive-by time as a target. Put "Delayed" in the next-step card. (B-02 residual)
4. **Answer-first on transport, transit and the desktop board.**
   - Transport: a fare row above the warning, or a condensed warning.
   - Transit: a verdict summary at the top of the form, or a sticky verdict.
   - Desktop board: the first row above the 900 px fold.
5. **Density (A-14).**
   - One source list per section instead of a toggle per card.
   - One "Demo" marker per view.
   - Chips only where provenance changes the decision.
6. **Map on phones.** Fix the chip and label overlap. Put the From and To controls above the map, or keep the map in
   view when a route is chosen.
7. **Search relevance (A-12).** Put the terminal in titles that would otherwise repeat, add "smoking" and other
   common facility words, and down-rank news for facility words.
8. **Performance and CI** [verification]. TBT 200 ms on the key pages, and the CI and WebKit runs (A-09, E-01,
   E-06).
9. **Prove it.** The moderated usability study of the top tasks on phones in English and Malay, with screen-reader
   and magnifier users (OOS-15). The team runs it; MAHB recruits and signs off.

### Dependent on MAHB data, systems or partners

1. Official flight feed, and status and queue feeds for the Aerotrain, the inter-terminal link and immigration
   (OOS-01, OOS-02).
2. Alert delivery when the page is closed: push, including an installable path for iOS, and e-mail (OOS-10).
3. Parking tariff and a dated booking link; Fast Track price, hours and seller; lounge access rules and prices;
   partner referral codes (C-01, D-02, C-11, OOS-03, OOS-04, OOS-13).
4. A surveyed terminal map with real geometry, located accessibility facilities, and taxi, rail and e-hailing places
   (OOS-07, C-08).
5. Airline assistance rules for AirAsia and the main carriers (D-04).
6. Operator-grade sourcing, brand and legal review, and native Malay review (OOS-08, OOS-14).

**Prototype-only, not defects:** demonstration flights, gates and queues; illustrative map positions; capped and
unverified car-park figures; on-device concierge answers from a fixed knowledge file; draft Malay.
