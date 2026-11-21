# Re-review after three fix rounds: accessibility, Malay and trust

Date: 21 November 2026, 18:40 to 19:15 Malaysia time. Reviewer lens: accessibility specialist (WCAG 2.2 AA,
assistive technology) who is also a Malay-speaking first-time traveller. Scope: accessibility, language quality,
plain language, trust and the honesty of data labels. This is one of three independent re-reviews; the other two
were not read.

## Verdict in brief

**Measured.** The round-one defects that blocked assisted travellers in the product itself are fixed on the
running build: the header switcher now passes Label in Name, focus moves to the new `h1` after navigation, the
"My needs" control exists, works from the keyboard, is announced and adds an assistance step and step-free map
links, the phone flight page answers first (Malay, 360 px, 125 per cent text: `h1` at 230 px with the next step,
gate, boarding time and a Demo tag on the first screen), and nothing scrolls sideways at 320 px, 200 or 400 per
cent zoom, or with WCAG text spacing on 14 pages. axe (WCAG 2.0 to 2.2 A and AA, which in axe 4.14.1 includes
the Label in Name and target-size rules) found 0 violations in 54 scans.

**Judgement.** For a keyboard, magnifier or low-vision user the product is now strong. For a wheelchair user it is
still not enough to travel on: the facts they need (accessible toilets, lifts, step-free transport, accessible
bays, the airport's own assistance service, AirAsia's rules) are honestly marked "not published", which is right
for a prototype but is the gap that matters. Three new trust problems appear in my lens: the timeline tells a
screen-reader user "Done: Arrange assistance" when nothing was arranged; service lines say "Checked 19:05" with the
current clock time although nothing live was checked; and the accessibility statement still describes focus
behaviour that was fixed. No real screen reader and no disabled participant has used the product.

Weighted score on the benchmark rubric: **74.5 per cent** (round one, same lens: 68.5 per cent).

---

## Method

- **Server.** `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3304` on the existing production build,
  stopped by its PID afterwards. Other servers ran on the machine, so **no performance was measured**: performance
  figures below are the round-three numbers in `docs/qa/verification.md` (section T2).
- **Browser.** Playwright Chromium (`chromium.launch()`, no options), one context per configuration, each with its
  own client address header. Display preferences were set through the site's own stored preference
  (`ma:preferences:v1`), so 112 and 125 per cent text, high contrast and in-app reduced motion are the product's
  settings, not browser zoom. Browser zoom was emulated by viewport: 200 per cent of 1280 x 800 as 640 x 400, and
  400 per cent of 1280 x 1024 as 320 x 256.
- **Configurations.** Desktop 1440 x 900 light; phone 390 x 844 at 125 per cent, high contrast; phone 360 x 780 at
  112 per cent, dark; phone 360 x 780 at 125 per cent, Malay (`Accept-Language: ms-MY`); 320 x 568 at 125 per
  cent; 640 x 400; 320 x 256; 390 x 844 at 125 per cent with the WCAG 1.4.12 spacing overrides; 390 x 844 dark,
  high contrast, 125 per cent, Malay; OS reduced motion and in-app reduced motion.
- **What I ran** (scripts in the session scratch folder, not in the repository):
  1. axe-core 4.14.1 with the WCAG A/AA tags on 18 pages x 3 configurations, plus a second pass of best-practice
     rules (`region`, `p-as-heading`, `landmark-unique`, `heading-order` and others) for context.
  2. Tab walks on the board, the map and the concierge (desktop, phone at 125 per cent, 320 x 256), recording each
     stop's name, size, focus style and whether it was covered by other content; then keyboard-only tasks: filter
     the board, open a flight, save a flight; choose a level, a pin and a step-free route; ask the concierge in
     English and Malay; open and close the display settings and the search palette.
  3. Reflow, sticky-chrome share and clipped-text checks on 14 pages x 4 configurations; a mid-word line-break
     count at 360 px.
  4. Running animations and transition counts with and without reduced motion on 5 pages.
  5. A scan of 18 Malay pages for English text outside `lang="en"`, for "pelepasan" and for untranslated "Lounge".
  6. A provenance check: every "Official" card on 7 pages traced to its cited source hosts.
  7. 14 site searches in English and Malay for access and first-timer words.
  8. 15 screenshots, all viewed (kept in the session scratch folder, not in `docs/`).
- **Not done.** No physical screen reader (NVDA, JAWS, VoiceOver, TalkBack), no WebKit or iOS Safari, no real
  phone, no participants. Accessible names and announcements were read from the DOM and live regions, which shows
  what a screen reader is given, not how it is experienced.

## Pages checked (40)

Home `/en`, `/ms`; KLIA overview `/en/kul`, `/ms/kul`; board `/en/kul/flights`, `/ms/kul/flights`; flight pages
`/en` and `/ms/kul/flights/mh1698-20261121-d` (same-day, delayed), `/en/kul/flights/mh1698-20261122-d` and
`/en/kul/flights/ak5651-20261122-d` (next day, with needs set); map `/en/kul/map`, `/ms/kul/map`; concierge
`/en/concierge`, `/ms/concierge`; accessibility hub `/en/accessibility`, `/ms/accessibility`; transport, parking,
facilities, lounges and transit in both languages; `/en/journey`, `/ms/journey`; `/en/notices`, `/ms/notices`;
`/en/about-this-prototype`; guides `/ms/guides`, `/ms/guides/first-time`, `/ms/guides/reduced-mobility`,
`/ms/guides/immigration-customs`, `/en/guides/immigration-customs`; help `/en/help`, `/ms/help`; site search in
both languages.

---

## Item checks: round-one weaknesses and the critical and P0 items in this lens

Status: **fixed**, **improved** (better, not fully met), **unchanged**, **worse**, or **new** (not reported in round
one). "Measured" evidence is what I did and saw on this build.

| Item | Round one | Status | Evidence (measured) |
|---|---|---|---|
| A-01, B-03 (critical): answer below the first phone screen | `h1` at 724 px under the bottom bar; arrive-by on the eighth screen | **Fixed** | `/ms/kul/flights/mh1698-…` at 360 x 780, 125 per cent: `h1` "MH 1698 ke Langkawi" at 230 px; first screen holds "Langkah seterusnya: Daftar masuk: Ekonomi: Baris B, kaunter 1-18 · Pintu B6 · Menaiki pesawat 19:15" with a Demo tag (screenshot). Header and bottom bar give way on scroll: 0 fixed elements after scrolling `/en/kul/facilities` at 320 x 568, 125 per cent |
| A-02 (critical): Label in Name on the airport switcher | 1 node on every airport page | **Fixed** | Name is now "KUL KLIA , change airport (currently KLIA)", starting with the visible text. axe 0 violations in 54 scans; I confirmed `label-content-name-mismatch` and `target-size` are among the 65 rules the WCAG tag set runs |
| A-03 (critical): home search flights-only, Enter does nothing | "parking", "lounge" dead-end | **Improved** | Malay home, typed "kerusi roda", Enter: opens `/ms/search?q=kerusi%20roda` with 6 results, the reduced-mobility guide first. While typing, the live status still announces "0 penerbangan ditemui" (0 flights found) for a topic query |
| A-04, B-05: demo labels out of view | Board rows and flight values unlabelled in view | **Fixed** | Desktop board is a `<table>` with the caption "Departures: 19:01 to 01:11. Demonstration data." and a Demo chip on every hour group; phone groups are `h3` headings ending "Demo · Demonstration data"; at 400 per cent zoom the sticky group heading keeps the Demo chip in view |
| A-05: focus after navigation | Focus to `<body>`, next Tab to the footer | **Fixed** (client navigation), **improved** (in-page links) | Enter on a board row: focus lands on `H1 "AK 3599 to Kuching"`. "See this step": focus moves to the step's `<li>`. Hub contents link "Not published yet": focus stays on `<body>`, but the next Tab goes to that section, not the footer |
| A-06: search palette active option | 1.03:1 tint, no field ring | **Fixed** (behaviour) | Ctrl+K focuses a combobox "Search the site"; ArrowDown sets `aria-activedescendant`; Escape returns focus to the control that had it. Contrast not re-measured |
| A-11, FTA-12: fixed chrome covers content when magnified | 28 per cent of a 320 x 568 screen | **Fixed** at phone sizes; **new** issue at 400 per cent | See weakness 8: at 320 x 256 the concierge's question form sticks at 115 to 184 px and hides most of a focused suggestion (screenshot) |
| A-12, FTA-13: access words return nothing | "lift", "buggy", "troli", "tukar wang" 0 results | **Fixed** | "lift" 17 results (lifts first), "buggy" 7, "troli" 1 ("Troli bagasi: belum diterbitkan"), "tukar wang" 1 ("Pengurup wang: belum diterbitkan"), "OKU" 7 ("Parkir OKU: belum diterbitkan" first), "lif" 3. "accessible toilet" and "tandas OKU" put general "Toilets (illustrative position)" first |
| A-13, A-16, FTA-08: sideways scroll at 320 px | `/en/kul/transport` 30 px | **Fixed**, small **new** clipping | 14 pages x 4 configurations (320 x 568 at 125 per cent, 640 x 400, 320 x 256, text spacing): `scrollWidth` equals `clientWidth` on all 56. At 320 x 568 and 125 per cent 7 provenance chips on `/en/kul/facilities` are clipped, for example "Estimated" shown as "Estimatec" (screenshot) |
| A-14: provenance noise | Chips on nearly every card | **Improved, not met** (as verification T4 says) | "Official unless marked otherwise" legend replaces many chips; source toggles remain on every card. Not re-counted |
| A-24, A-25, D-03, FTA-15, FTA-16: English on Malay pages; "pelepasan"; "Lounge" | English airline card and as-of text; "pelepasan" | **Improved** | 18 Malay pages: 0 runs of English prose outside `lang="en"` by my scan; "pelepasan" 0; "Lounge" only inside names such as "Plaza Premium Lounge". Still a draft (weakness 9) |
| B-02, B-12: wrong "Now" step; card and timeline disagree | "Now: check in" after it closed | **Fixed**, with a **new** wording issue | Same flight at 18:55: "Now: Check in… closes at 19:00"; at 19:05: "Check-in closed at 19:00. If you have not checked in, contact Malaysia Airlines now". Summary card and timeline both name Row B for this domestic flight. New: past steps are announced "Done:" even when the traveller may not have done them (weakness 2) |
| B-08, FTA-09: concierge ignores "accessible", cannot answer autogate | Intent unknown; generic taxi list | **Improved** | "Where do I get an accessible taxi at KLIA Terminal 1?" announces "Answer: Step-free access for airport taxi is not published in our sources. Ask the operator or an airport information counter before you travel." Malay fare question answers "RM 55" first. Still missed: "Is there a lift from arrivals to the train?" gives the general transport list; "kerusi roda untuk penerbangan AirAsia" leads with the Calm Room card |
| B-10: changed times shown only by strike-through | WCAG 1.3.1 | **Fixed** | Hidden text "Scheduled 18:20, now 18:55" beside the struck time |
| B-11, FTA-01: needs cannot be set | No control | **Fixed** (function), **placement poor** | Flight page and hub: four toggle buttons; Space toggles `aria-pressed`; status "Perjalanan anda kini merancang untuk: Kerusi roda."; step "Aturkan bantuan dengan Malaysia Airlines" added; gate link gains `sf=1`. On a 360 px phone at 125 per cent the control is at 8,863 px of a 12,514 px flight page; on the hub (390 px, 125 per cent) at 4,947 of 17,436 px |
| C-04: illustrative prayer-room pin given a level | Misleading location | **Fixed** in the list, residue in the route lists | Map list: "Prayer room (illustrative position) · Demo". The From/To options still read "Prayer room · Level 5" and "Toilets · Level 5" without "illustrative" |
| C-08, FTA-07: step-free arrival route skips the lift and immigration | "Walk on" step, ends before the taxi | **Improved** | Gate C to arrivals pick-up, step-free: "Go down to Level 3: arrivals, to Arrival immigration. Step-free: use a lift or ramp; ask staff if you cannot see one." then customs and pick-up, 760 m, 14 or 19 min. Still ends at the pick-up kerb; no taxi counter or rail entrance (MAHB places) |
| FTA-14: duplicate names in route lists | "Aerotrain station · Gates" twice | **Fixed** | 40 options in each list, 0 duplicates |
| D-01: "Official" on news and blog facts | Unsupported Official tags | **Fixed** on the pages checked | Every Official card on transport, facilities, parking, lounges, overview, hub and the immigration guide cites at least one airport, airline, KLIA Ekspres or `gov.my` source |
| D-04, FTA-02 (P0): accessibility facts missing | Toilets, lifts, step-free transport, bays, airport service, AirAsia | **Unchanged** (MAHB and airlines) | Hub "Not published yet" lists every gap and who to ask. AirAsia flight with needs set: "We have not published its notice period: check with the airline." Every KLIA transport mode: "Step-free access not confirmed" |
| D-05, D-06, FTA-05: caveat block and RM2,084 warning in the journey | 90-word block in step 1 | **Fixed** | 0 matches for "not verified", "2,084" or "Preferred Parking" on the flight page. Parking: warning is a rule; prices read "≤ RM 52" with the symbol hidden and "at most … (not verified)" spoken, and a visible "Not verified. RM 52 a day according to klia.info" note |
| D-07, FTA-10 (P0): no immigration guidance for departing Malaysians | Unanswered | **Unchanged** (Immigration Department) | Concierge in Malay: "Sumber kami tidak menerbitkan siapa yang boleh menggunakan autogate berlepas…"; first-time guide passport control is still one sentence tagged "Cadangan" |
| D-11, FTA-04: hub link leads to "Not on this map yet" | Dead end | **Fixed** | Hub: "Where the accessible toilets are is not published in our sources yet, so they are not on our map", with the official assistance page linked; no map link |
| FTA-19, A-15: no Assistance in the desktop header | Footer or Help only | **Fixed** | "Assistance" is the third Tab stop on desktop (after the skip link and the prototype notice), before the main navigation |
| FTA-20: Aerotrain closure silent on wheelchair access | Not mentioned | **Fixed** | Notice: "Whether the buses are step-free, and how much extra time assisted passengers need, is not published: if you use a wheelchair or need help, ask your airline for assistance before you fly" |
| Reduced motion | Applied | **Holds** | 77 to 207 elements with transitions normally; 0 with the OS setting and 0 with the in-app setting on all 5 pages; no running animations; board auto-refresh has "Pause live updates" and its "Updated" line is `aria-live="off"` |
| E-06 (P0): CI, axe tag set, WebKit | Tag set incomplete, no CI | **Improved, not met** | Full WCAG 2.2 A/AA tag set in `e2e/support/axe.ts`; per verification T4 the CI workflow and the WebKit project have never run |
| E-01, A-09 (P0): mobile main-thread blocking | TBT 0.66 to 2.0 s | **Improved, not met** (verification, not measured here) | Round three: Lighthouse 92 to 99, LCP 0.92 to 1.11 s on 10 of 10 pages, CLS at most 0.003, but TBT over 200 ms on 7 of 10 (`/ms` 245 ms) |

Nothing in my lens got worse in the sense of a regression; the "new" items are either new wording introduced by the
fixes (the "Done:" state on the new assistance step) or problems that round one did not test (400 per cent zoom).

---

## Scores

Same convention as round one: info and commerce are scored on what is actually there; the other dimensions judge
the design as if production data were connected. Anchors: 3 competent major airport, 4 strong with evidence, 5
best-in-class reference with first-hand evidence.

| Key | Weight | Round one (this lens) | Now | Confidence | Reason |
|---|---|---|---|---|---|
| ui | 10% | 4.0 | **4.0** | medium | Clear system that holds in dark, high contrast and Malay, with visible 2 px focus rings everywhere I tabbed; held back by Malay mid-word breaks at 125 per cent, clipped chips at 320 px and sticky elements floating mid-screen at 400 per cent zoom. |
| ux | 20% | 3.5 | **4.0** | medium | Answer-first flight page, wired needs, closed check-in handled with an action, Enter in home search; still very long pages (flight page 12,514 px at 360 px, hub 17,436 px at 390 px, both at 125 per cent) and the needs control more than eleven screens down the flight page. |
| info | 15% | 3.0 | **3.0** | high | Labelling is exemplary and gaps are listed with who to ask, but the facts a wheelchair user travels on, AirAsia's rules and citizens' immigration guidance are still not published; "Checked HH:MM" overstates; the statement is stale. |
| flight | 15% | 4.0 | **4.0** | medium | Timeline states are now right and the board is a captioned table with spoken time changes; the assistance step mislabels past steps "Done" and does not warn inside the 48-hour notice period; alerts still stop when the page closes. |
| mobile | 10% | 3.5 | **4.0** | medium | No sideways scroll on 56 page and configuration pairs, chrome gives way on scroll, answer on the first screen in Malay at 125 per cent; TBT still over budget on 7 of 10 pages (verification), and zoomed sticky elements misbehave. |
| nav | 10% | 3.5 | **4.0** | medium | Label in Name, focus to `h1`, Assistance in the header, unique route options, access words in both languages and a palette with `aria-activedescendant` all work; untested with real screen readers, and accessible-toilet searches return general toilets first. |
| ai | 10% | 3.0 | **3.5** | medium | The concierge now honours "accessible", answers in Malay and announces its lead sentence through a status region; it still misreads a lift question and leads a wheelchair-for-AirAsia question with the Calm Room. |
| commerce | 5% | 2.0 | **2.5** | low | Outside my lens. Fast Track is now findable with a booking-site hand-off and parking leads with prices, but nothing can be bought and every price is unverified. |
| perf | 5% | 3.5 | **4.0** | low | Not measured by me. Verification round three: Lighthouse 92 to 99 and LCP about 1.1 s on all 10 pages, but TBT over 200 ms on 7 of 10, byte budgets failed, CI and WebKit never run. |
| **Weighted** | | **68.5%** | **74.5%** | medium | Not a perfect score in any dimension. With MAHB's accessibility data and the team fixes below, I would expect about 79 to 80 per cent (judgement). |

---

## Strengths (measured unless marked)

1. **Keyboard operation is complete on the three hardest surfaces.** Board: filter field, status filters, row
   links and save buttons all reachable, with a visible ring on the dark board; Enter opens the flight and moves
   focus to its `h1`. Map: level radios, focusable pins with a ring, pan and zoom buttons instead of gestures, a
   "Skip to the list of places" link, and From/To lists with unique names; a keyboard-built step-free route is
   announced "Route found: about 10 minutes in 7 steps." Concierge: labelled field, Enter submits, focus stays in
   the field, and the lead sentence is announced through a polite status ("Answer: …" / "Jawapan: …").
2. **Robust at large text and zoom.** No horizontal scroll at 320 px with 125 per cent text, at 200 or 400 per
   cent zoom, or with WCAG text spacing; the site's own text-size, contrast and motion settings apply before paint.
3. **Honest labels that a sceptical traveller can check.** "Schematic demonstration map, not a floor plan";
   "Demonstration data" in the board caption and every group heading; "(not verified)" spoken on each parking
   price; "not published yet" results for troli, money changers and accessible parking instead of silence; the
   concierge says "Your question was not sent anywhere" when it answers on the device. Official tags trace to
   official sources on every page I checked.
4. **Assistance is now part of the journey.** One set of needs, stored on the device, shared by the hub and
   every flight page, adds an airline-specific assistance step and step-free map links, in both languages.
5. **Malay near parity, including search.** Malay pages carry no stray English prose; "kerusi roda", "OKU",
   "lif", "troli", "tukar wang" and "laluan pantas" all find something; the first-time guide reads naturally
   ("Terbang ke luar negara buat kali pertama").

---

## Ten most significant remaining weaknesses (this lens)

1. **The facts an assisted traveller needs are still missing** (D-04, OOS-07; MAHB, airlines). Accessible toilets,
   lift locations (the map's lifts are Demo), wheelchair and buggy points, accessible bays, step-free status of
   all six KLIA transport modes, the content of the airport's own special-assistance service, CARE chat hours,
   and rules for AirAsia, AirAsia X and Batik Air. The product says so clearly, but a wheelchair user flying
   AirAsia from Terminal 2 still has nothing specific to act on.
2. **The timeline's state words mislead on assistance** (team). The screen-reader prefix "Done:" is put on every
   past step, so on a same-day flight a wheelchair user hears "Done: Arrange assistance with Malaysia Airlines",
   which reads as "assistance arranged". The same applies to "Done: Check-in closed at 19:00" and "Done: Flight
   MH 1698 is delayed". For the same flight tomorrow evening (about a day away) the step says "Coming up" and quotes
   the 48-hour notice period without saying that it has already passed. English copy is also ungrammatical: "You
   told us you plan for a wheelchair, an older traveller."
3. **"Checked HH:MM" overstates freshness** (team). On the overview and the flight page every status line
   ("Train between Terminal 1 and Terminal 2 · Checked 19:05 · No disruption reported in our sources as of
   19:05") carries the current clock time, although the source is a set of dated notices in the build. The
   section's subtitle admits "until a live operations feed is connected", but the per-line time reads as a live
   check. It should show the notices' own as-of date until a feed exists.
4. **The accessibility statement is out of date and has no feedback route** (team). It says "After moving to
   another page, focus stays where it was", which is no longer true; it is "last reviewed 17 November 2026",
   before three fix rounds; its test list omits 200 and 400 per cent zoom; and "Report a problem" says there is
   no support desk. A launched statement needs an accessibility contact and a response time.
5. **No assistive-technology testing with people or real screen readers, and no WebKit** (team, with
   participants). The statement admits it. Everything above is inferred from the DOM; iOS Safari and VoiceOver,
   the most likely combination for many travellers, have never run (E-06, OOS-15).
6. **Departing-citizen immigration and autogate guidance is still absent** (D-07; Immigration Department). The
   Malay concierge answers "sources differ" and "our sources do not publish who may use the departure autogate";
   the first-time guide's passport step is one sentence tagged "Cadangan". This is the question a Malay
   first-timer with an older parent asks first.
7. **The concierge and search still miss some access questions** (team). "Is there a lift from arrivals to the
   train?" returns the list of transport modes; "kerusi roda untuk penerbangan AirAsia di KLIA T2" leads with the
   Calm Room and gives the Malaysia Airlines rule third; "accessible toilet" and "tandas OKU" return general
   "Toilets (illustrative position)" first, which a hurried reader may take as the answer.
8. **Magnification beyond 200 per cent and narrow large text** (team). At 320 x 256 (400 per cent) the concierge's
   sticky question form sits mid-screen at 115 to 184 px and hides most of the focused suggestion (only its top
   border shows: passes WCAG 2.4.11 because it is not entirely hidden, fails 2.4.12); the board's sticky hour
   heading keeps a 56 px offset for a header that has scrolled away, leaving rows showing above it. At 320 x 568
   and 125 per cent 7 provenance chips on the facilities page are clipped ("Estimated" shows as "Estimatec").
9. **Malay is still a draft, with calques and broken words** (team; native review OOS-14). The home `h1`
   "Perjalanan anda, terhubung dengan indah." says nothing about the task; "Tanya concierge" uses an English word
   most first-timers do not; "perjalanan anda akan merancang untuknya" is a calque; at 360 px and 125 per cent the
   Malay home breaks 6 words mid-syllable without a hyphen ("penerba|ngan", "Penerbang|an", "Pengangk|utan"),
   3 on the KLIA overview; the home field placeholder is still cut to "Penerbangan, ba…".
10. **Length, depth and reading level** (team). At 125 per cent text the flight page is 12,514 px and the
    first-time guide 14,411 px at 360 px, and the hub 17,436 px at 390 px; the needs control is more than eleven
    screens down the flight page.
    The reading level is grade 9.5 against a target of 9 (D-14, verification). For an anxious first-timer the
    right answer is now on screen one, but anything beyond it is a long scroll.

---

## Launch blockers

### Fixable by the delivery team

1. **Timeline state wording for assistance** (weakness 2): no "Done" for steps the traveller has to confirm (use
   "Past" or "Missed?" with what to do), a warning when the flight is inside the airline's notice period, and
   corrected English.
2. **Honest freshness labels** (weakness 3): replace "Checked HH:MM" with the notices' as-of date until a live
   feed is connected.
3. **Accessibility statement** (weakness 4): describe current focus behaviour, test scope (including 200 and 400
   per cent zoom), the review date and an accessibility contact; the same in Malay.
4. **Assistive-technology study and WebKit** (weakness 5): run the CI workflow with WebKit, then a moderated study
   with NVDA, VoiceOver on iOS, TalkBack and magnifier users in English and Malay (the plan in
   `docs/qa/usability.md`; participant recruitment may need MAHB's help).
5. **Zoom and narrow-text defects** (weakness 8): sticky offsets that follow the header's visibility, no sticky
   form at short viewports, chips that wrap rather than clip.
6. **Needs control placement** (weakness 10): reachable from the flight page's first screen, for example a link
   in the summary card.
7. **Concierge and search intent for lifts and airline-specific assistance** (weakness 7), and "not published"
   ranked first for accessible-toilet searches.
8. **Malay copy pass the team can do now** (weakness 9): task-based home `h1`, a Malay name for the concierge,
   no mid-word breaks in tiles and the search helper, shorter placeholder.
9. **Main-thread budget on low-end Android** (E-01, A-09; verification T5 item 1): TBT over 200 ms on 7 of 10
   pages affects exactly the mid-range phones this lens cares about.

### Dependent on MAHB data, systems or partners

1. **Located accessibility facts for KLIA T1 and T2** (OOS-07): accessible toilets, lifts, wheelchair and buggy
   points, accessible bays, and the step-free status of KLIA Ekspres, KLIA Transit, buses and taxis.
2. **The airport's special-assistance service** (what it offers, how to book, lead time) and CARE live-chat hours.
3. **Airline assistance rules** for AirAsia, AirAsia X, Batik Air and the other main carriers (D-04).
4. **Immigration Department wording** on departure autogates for citizens and on counters for older travellers
   (D-07).
5. **Map places for the taxi counter, rail entrances and e-hailing pick-up** so step-free routes can end where the
   journey continues (C-08).
6. **A live operations and notices feed** (OOS-02) and the official flight feed (OOS-01), so status lines can
   carry a real checked time.
7. **Native Malay editorial review and brand and legal sign-off** (OOS-14, OOS-08).

## Prototype-only versus product

Prototype-only (expected to disappear with production data, and not counted against design scores): demonstration
flights, gates, queue estimates and alerts; illustrative map positions and Demo lifts; unverified parking rates;
"not published" accessibility facts; the "Concept prototype, not official" banner. Product issues that stay with
production data: weaknesses 2, 3 (as a design pattern), 4, 5, 7, 8, 9 (apart from the native review) and 10.

## Reproduce

Serve the build as in Method, then with Playwright Chromium: set `ma:preferences:v1` to
`{"theme":"system","textSize":125,"highContrast":false,"reducedMotion":false}` before load; open
`/ms/kul/flights/mh1698-20261121-d` at 360 x 780 (the flight ids follow the demo date); press the "Kerusi roda"
button under "Keperluan saya" and read the timeline's hidden state text; open `/en/concierge` at 320 x 256 and
Tab to the fourth suggestion; open `/en/kul` and compare a "Checked" time with the clock; read the accessibility
statement on `/en/accessibility`. axe: inject `node_modules/axe-core/axe.min.js` and run with the tags
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`.
