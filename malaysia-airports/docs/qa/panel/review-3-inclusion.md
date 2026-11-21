# Third review, after fix rounds four and five: accessibility, Malay and trust

Date: 22 November 2026, 06:07 to 06:35 Malaysia time (21 November, 22:07 to 22:35 UTC). Reviewer lens: an
accessibility specialist (WCAG 2.2 AA, assistive technology) who is also a Malay-speaking first-time traveller.
Scope: accessibility, language quality, plain language, trust and the honesty of data labels. One of three
independent third reviews; the other two were not read.

## Verdict in brief

**Measured.** Every team-fixable blocker the second review recorded in this lens has moved on the running build.
The timeline no longer says "Done:" for anything (0 on four flight pages and My journey, English and Malay; past
steps read "Past:" / "Sudah berlalu:"), a past assistance step carries "Act now", and an airline without a sourced
notice period gets "we do not know how much notice Singapore Airlines needs" instead of an invented rule. Status
lines no longer stamp the clock ("Checked hh:mm" 0; "Status not available" and "From notices published up to 7 Oct
2026" instead). The accessibility statement describes current focus behaviour, 200 and 400 per cent zoom and its
untested browsers, in both languages. At 400 per cent zoom the board's sticky heading now sits at 0 px and nothing I
focused was hidden. Access words in the concierge and search lead with an honest "not published" answer. axe (WCAG
2.0 to 2.2 A/AA) found 0 violations in 69 of 70 scans.

**Also measured, and new.** On ordinary laptop and desktop windows (1280 x 720 and 1440 x 900) the concierge's
sticky question box covers the suggestion that has keyboard focus: only a 2 to 3 px strip of its focus ring shows
(screenshots). The same overlap gives the one axe result, `target-size` on `/ms/concierge` at 1440 x 900, on all
three loads I checked. The statement says the focused item "is not hidden behind sticky content". (Fact-check: that
sentence is about 200 and 400 per cent zoom, where nothing focused was hidden; the statement's focus section, that
sticky bars "do not hide the item that has focus" when the page is magnified, is the one this defect contradicts,
at 125 per cent zoom of a 1440 x 900 window.) It also says "a link to a section moves focus to that section", but
"My needs" and the hub's contents links leave focus on `<body>`. In Malay, the concierge answers "can my older
mother use the autogate when leaving?" with visitor and arrival-card (MDAC) content first.

**Judgement.** For keyboard, magnifier, low-vision and Malay-reading users the product is now strong and honest
about what it does not know. For a wheelchair user it is still not enough to travel on, because the facts that
matter are not published (MAHB and airlines). No real screen reader, no WebKit and no disabled participant has used
it. Weighted score on the benchmark rubric: **75.5 per cent** (second review, this lens: 74.5; round one: 68.5).
Not ready for public launch. In my lens a closed KLIA pilot is acceptable if participants are recruited and
supported, and only after the concierge focus defect and the two statement inaccuracies are fixed.

---

## Method

- **Server.** `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3304` on the round-five production build
  (`b4AW-Kxsx1vSRiJq7KWD0`), stopped by its own process tree afterwards. Other servers shared the machine, so **I
  measured no performance**: performance below is quoted from `docs/qa/verification.md`, round five (G2.4, G2.5,
  G8).
- **Clock.** The session ran after 05:05 Kuala Lumpur time, so the demonstration board was populated (50 KLIA
  departures from 07:00); no browser clock was fixed. Statuses are as the server computed them at that time.
- **Browser.** Playwright Chromium (`chromium.launch()`, no options), a fresh context and client-address header
  per page. Display preferences were set through the site's own stored preference (`ma:preferences:v1`), so 125 per
  cent text, dark, high contrast and in-app reduced motion are the product's settings. Needs were set through
  `ma:needs:v1` or by pressing the product's own buttons. Browser zoom was emulated by viewport: 200 per cent as
  640 x 400, 400 per cent as 320 x 256. Text-only enlargement to 200 per cent was emulated by setting the root font
  size to 200 per cent; the product's own text setting stops at 125.
- **Configurations.** Desktop 1440 x 900; laptop 1280 x 720; phone 390 x 844 at 125 per cent; phone 390 x 844 dark
  and high contrast; Malay phone 360 x 780 at 125 per cent; 320 x 568 at 125 per cent; 640 x 400; 320 x 256; 390 x 844
  with WCAG 1.4.12 spacing; root font size 200 per cent at 1280 x 800 and 390 x 844; OS reduced motion and in-app
  reduced motion.
- **What I ran** (scripts in the session scratch folder, not in the repository):
  1. axe-core 4.14.1 with `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` on 28 pages at desktop, 28 at phone 125 per
     cent and 14 at phone dark high contrast (70 scans), plus h1, `lang`, title and sideways-scroll checks.
  2. Keyboard-only tasks. On the board: skip link, filter, open a flight, save a flight. On the map: From, To, the
     step-free switch, the route announcement. On the concierge: 17 questions in English and Malay. Also the "My
     needs" control on a Malay flight page, the search palette, display settings and the "/" key.
  3. Tab walks of 40 to 75 stops on the board, the map, the concierge, a flight page and the hub, in six window
     sizes. For each stop I recorded the name, size and focus style, and what share of a 5 x 5 grid of points on the
     focused element was not covered by other content.
  4. Status-line, provenance, Demo-label and caption checks on the overview, home, board and flight pages; a spot
     check of 28 "Official" tags against their cited hosts on six pages.
  5. A scan of 18 Malay pages at 360 px and 125 per cent text for English prose outside `lang="en"` and for words
     broken mid-word; a reading of Malay guide, hub, statement and concierge text.
  6. Reduced-motion counts on five pages; reflow with text spacing and with 200 per cent root text on seven pages.
  7. A rough Flesch–Kincaid estimate (my own syllable heuristic, so approximate) on five English pages.
  8. 17 screenshots taken, 10 looked at.
- **Not done.** No physical screen reader (NVDA, JAWS, VoiceOver, TalkBack), no WebKit or iOS Safari, no real
  phone, no participants, no night-board check, no offline or script-failure check (those are quoted from
  verification). Accessible names and announcements were read from the DOM and live regions, which shows what a
  screen reader is given, not how it is experienced.

## Pages checked (41)

Home `/en`, `/ms`; KLIA overview `/en/kul`, `/ms/kul`; board `/en/kul/flights`, `/ms/kul/flights`; flight pages
`/en/kul/flights/mh2807-20261122-d`, `/ms/kul/flights/mh2807-20261122-d`, `/ms/kul/flights/ak6336-20261122-d`
(AirAsia, delayed), `/en/kul/flights/mh2626-20261122-d`, `/en/kul/flights/sq138-20261122-d` (delayed); map
`/en/kul/map`, `/ms/kul/map`; concierge `/en/concierge`, `/ms/concierge`; accessibility hub and statement
`/en/accessibility`, `/ms/accessibility`; guides `/en/guides/first-time`, `/ms/guides/first-time`,
`/en/guides/reduced-mobility`, `/ms/guides/reduced-mobility`, `/en/guides/immigration-customs`,
`/ms/guides/immigration-customs`; transport `/en/kul/transport`, `/ms/kul/transport`; parking `/en/kul/parking`,
`/ms/kul/parking`; facilities `/en/kul/facilities`, `/ms/kul/facilities`; transit `/ms/kul/transit`; My journey
`/en/journey`, `/ms/journey`; `/ms/notices`; `/ms/help`; `/en/about-this-prototype`; site search in both
languages; 404s `/en/no-such-page`, `/ms/tiada-halaman`, `/en/kul/zzz`, `/ms/kul/flights/zz9999-20261122-d`.

---

## Item checks

Status: **fixed**, **improved** (better, not fully met), **unchanged**, **worse**, or **new** (not reported in the
second review). All evidence is what I did and saw on this build unless marked "(verification)".

### The second review's ten weaknesses in this lens

| # | Weakness (second review) | Status | Evidence |
|---|---|---|---|
| 1 | Assisted-travel facts missing (D-04, OOS-07) | **Unchanged** (MAHB, airlines) | Concierge, English: "The assistance rules of AirAsia are not published in our sources…"; Malay "tandas OKU di KLIA": "Lokasi tandas OKU di KLIA belum diterbitkan…", then a list headed "Belum ada dalam sumber kami: lokasi tandas OKU, lif, … petak parkir OKU; tren, bas dan stesen yang bebas tangga; … peraturan bantuan syarikat penerbangan". AK 6336 with needs set: "Kami belum menerbitkan tempoh notisnya: semak dengan syarikat penerbangan." The map's lifts are `provenance: 'demo'` in `src/content/airports/kul.ts` |
| 2 | Timeline says "Done: Arrange assistance"; no notice-period warning; bad English | **Fixed** | 0 "Done:" or "Selesai:" in the screen-reader text of MH 2807, MH 2626, SQ 138, AK 6336 and My journey (en, ms); My journey has 4 "Past:". MH 2807 (07:25, viewed 06:12) with a wheelchair: "Past: … Arrange assistance with Malaysia Airlines … Act now: If nobody has arranged assistance yet, contact Malaysia Airlines now, and tell its staff as soon as you reach the airport." SQ 138: "Act now: Your flight leaves in less than 2 days, and we do not know how much notice Singapore Airlines needs." Copy: "Your needs: wheelchair." / "Keperluan anda: kerusi roda, warga emas." |
| 3 | "Checked hh:mm" overstates freshness | **Fixed** | `/en/kul`, `/ms/kul`, four flight pages, home: 0 "Checked"/"Disemak hh:mm", 0 "No disruption". Overview: 3 "Status not available" lines, "From notices published up to 7 Oct 2026. No live operations feed is connected yet.", "Notice dated 7 Oct 2026" (Malay equivalents). Flight pages: "From notices published up to 7 Oct 2026; no live feed." Home strip: "1 service has a notice" / "1 perkhidmatan ada notis" |
| 4 | Statement out of date, no feedback route | **Improved** | Both languages: "Last reviewed 21 November 2026, after the fourth round of fixes"; focus behaviour; 200 and 400 per cent zoom; untested WebKit, screen readers and magnifier software; "Malaysia Airports does not publish an accessibility contact or a response time … so we cannot promise one", then the group line and e-mail. Not met: no accessibility contact (MAHB); two claims are not true on this build (weaknesses 3 and 5 below); the review date is before round five |
| 5 | No assistive-technology testing; no WebKit | **Unchanged** | Statement still says so. Verification G7: the CI workflow and WebKit have not run on a runner |
| 6 | No departing-citizen immigration guidance (D-07) | **Unchanged** (Immigration Department); **new** ranking problem | Flight pages carry an honest "Leaving Malaysia: passport control for Malaysian citizens. Our sources do not publish who may use the departure autogates…". But three of my four departure-autogate questions in the concierge got visitor or arrival content first (weakness 4 below) |
| 7 | Concierge and search miss access questions | **Fixed** for every quoted query | "Where is the accessible toilet at KLIA?" → "Our sources do not publish where the accessible toilets are at KLIA yet."; "accessible taxi" → step-free access not published; wheelchair + AirAsia (en, ms) → AirAsia's rules not published, no Calm Room lead; lift question without an airport → "Which airport is this about?" with seven choices; with KLIA T1 → step-free access for KLIA Ekspres and KLIA Transit not published. Search "accessible toilet" and "tandas OKU": 11 results, first "Accessible toilets: not published yet" / "Tandas OKU: belum diterbitkan" |
| 8 | Magnification beyond 200 per cent, narrow large text | **Fixed** at zoom; **new** at desktop | 320 x 256: `--spacing-sticky` 0 px, the hour heading stuck at 0 with its Demo chip, the focused board row fully visible with its ring (screenshot); 70 Tab stops on a flight page and on the 640 x 400 map, none obscured. 320 x 568 at 125 per cent: 0 clipped provenance tags on facilities (en, ms), the flight page, transport and transit. New at desktop: the concierge, weakness 3 below |
| 9 | Malay still a draft | **Improved** | `/ms` `h1` "Semak penerbangan, rancang perjalanan anda."; "Tanya Kami"; short placeholder "Penerbangan" fits (screenshot); 0 English prose outside `lang="en"` and 0 "concierge" on 18 Malay pages. Residuals: weakness 7 below |
| 10 | Length, depth, reading level | **Improved** (flight page), **unchanged** (hub) | Needs control on a phone flight page at 2,067 to 2,766 px (second review 8,863 px at 360 px). Hub at 390 px and 125 per cent: 17,614 px (en) and 19,186 px (ms), needs control at 4,465 / 4,947 px. Estimated reading grade 8.3 to 9.3 (immigration guide highest); verification gives 9.5 (D-14) |

### The second review's launch blockers in this lens (team)

| # | Blocker | Status | Evidence |
|---|---|---|---|
| 1 | Timeline wording for assistance | **Fixed** | As weakness 2 |
| 2 | Honest freshness labels | **Fixed** | As weakness 3 |
| 3 | Accessibility statement | **Improved** | As weakness 4 |
| 4 | Assistive-technology study and WebKit | **Unchanged** | As weakness 5 |
| 5 | Zoom and narrow-text defects | **Fixed** at 400 per cent and 320 px; **new** at 720 to 900 px window heights | As weakness 8 |
| 6 | Needs control placement | **Improved** | "My needs" link beside Follow at 1,870 to 2,142 px at 390 px and 125 per cent text (the two-screen line is 1,688 px; the verification's 1,321 to 1,375 px are at 100 per cent). Activating it scrolls the control to 230 px; the next Tab reaches "Kerusi roda"; Space sets `aria-pressed="true"`, the status says "Langkah perjalanan anda kini mengambil kira: Kerusi roda.", the step "Aturkan bantuan dengan Malaysia Airlines" appears and 1 map link gains `sf=1`. Focus itself stays on `<body>` |
| 7 | Concierge and search intent for lifts and airline assistance | **Fixed** (named queries); **new** gap for departure autogates in Malay | As weaknesses 6 and 7 |
| 8 | Malay copy pass | **Fixed** for the named items; residuals | As weakness 9 |
| 9 | Main-thread budget on low-end Android | **Unchanged** (verification) | G8 item 1: pooled TBT medians 227 to 308 ms on eight pages; under 200 only on the concierge, guides hub and My journey |

### Round-four and round-five claims in this lens

| Claim | Status | Evidence |
|---|---|---|
| 6.1.1 Status lines | **Verified** | As above |
| 6.1.2 Day of travel (home card, My journey, delayed basis, notice period) | **Verified** | Saved MH 2807 at 06:30: home card "Check-in closes 06:40 · Now: Check in and drop your bags" (ms "Daftar masuk ditutup 06:40 · Sekarang: …"), no past time; AK 6336 (07:00, now 07:50): "Lewat: kini 07:50 · Daftar masuk: Baris X, kaunter 2-7 · Daftar masuk ditutup 07:05 · Menaiki pesawat 07:20" on the first screen |
| 6.1.4 Concierge access qualifiers, fallback | **Verified**, one gap | Weather: "I can't answer that from our verified content. For a definite answer, contact Malaysia Airports customer support (group line), +60 3 8777 0000." Flight: "MH 2807 shows as check-in open in the demonstration data. Your airline has the real status." with the Demonstration data banner. Gap: departure autogates (weakness 4) |
| 6.1.5 Search for access words; no "0 flights found" | **Verified** | Home field, typed "wheelchair": "No flights match “wheelchair”. Pages that do are listed below, first: Reduced mobility and wheelchair assistance."; Malay equivalent for "kerusi roda"; Enter opens site search |
| 6.1.6 Sticky offsets at 400 per cent; chips wrap | **Verified** | As weakness 8 |
| 6.1.6 No Malay mid-word breaks | **Partly** | 0 on `/ms`, `/ms/kul`, the board, a flight page, the concierge, the hub, three guides, parking, My journey, notices, help and a 404 at 360 px and 125 per cent. 16 words on four other pages: transit 11 (the arrival-type control reads "Antarab / angsa" and "Domesti / k", screenshot), transport 2 ("terendah", "tersingkat"), facilities 2 (an `h3`, "ketidakupayaan"), map 1 ("pengangkutan"); `hyphens: manual`, so no hyphen is shown |
| 6.1.10 Statement, Malay `h1`, "Tanya Kami", placeholder | **Verified**, with two inaccurate sentences | As weakness 4 |
| Round five: the "My needs" anchor on the placeholder (G3 item 2) | **Verified** (normal load only) | The link scrolled to the control on every attempt; I did not block the chunk |
| Round five: catch-all and flight 404s | **Verified** | `/en/no-such-page`, `/ms/tiada-halaman`, `/en/kul/zzz`: status 404, `h1` "Page not found" / "Halaman tidak ditemui", correct `lang`, links home, search and all airports. `/ms/kul/flights/zz9999-…`: 404, "Kami tidak menemui penerbangan ini", with the demonstration note; its `<title>` lacks the site name (minor) |

### P0 and P1 backlog items in this lens, re-checked

| ID | Status | Evidence |
|---|---|---|
| A-01, B-03 (P0) answer first on a phone | **Holds** | `h1` at 230 px on every flight page at 390 x 844 and 125 per cent; the next step, its time and a Demo marker are on the first screen (screenshot, Malay) |
| A-02 (P0) Label in Name | **Holds** | "KUL KLIA , change airport (currently KLIA)"; axe 0 on airport pages |
| A-05 (P0) focus after navigation | **Holds** for page links; **unchanged** for in-page links | Enter on a board row: focus on `H1` "MH 2807 to Kota Kinabalu" (ms "… ke Kota Kinabalu"), title updated. "See this step" focuses the step's `<li>`. "My needs", hub "Not published yet" and hub "Penyata kebolehcapaian": focus stays on `<body>` 1.9 s later; the next Tab enters the section |
| A-06 (P0) palette active option | **Fixed** | Ctrl+K: combobox; ArrowDown sets `aria-activedescendant`; active option `aria-selected="true"`, 2 px outline, 4 px inset bar and tinted background |
| A-11 (P0) fixed chrome covers content | **Holds** | 0 px of fixed or sticky chrome in view after scrolling five pages at 320 x 568 and 125 per cent |
| A-12 (P0) access words | **Holds** | "kerusi roda" 6 (reduced-mobility guide first), "warga emas" 6 ("Pengembara warga emas" first), "lif" 3, "lift" 3; "lift" and "lif" lead with a demonstration lift (weakness 8) |
| A-13, A-16 (P0, P1) sideways scroll, clipping | **Holds** | 0 px sideways scroll on 28 pages at 390 x 844 and 125 per cent, 7 pages with text spacing, 5 at 320 x 568 and 125, and at 640 x 400 and 320 x 256 |
| A-14 (P0) label density | **Improved** (verification G4: at most 1 Demo marker per view on the flight page) | Flight pages carry 17 to 18 provenance tags (my count, data attribute); not re-counted per view |
| A-15 (P1) Assistance in the header | **Holds** | Third Tab stop on desktop, after the skip link and the prototype notice |
| A-22 (P1) focus ring on the yellow banner in dark | **Fixed** | "About this prototype" in dark and dark high contrast: outline rgb(31, 22, 0) on rgb(255, 194, 51), 11.1:1 |
| A-23 (P1) single-key "/" | **Fixed** | "/" on the home opens nothing; the palette is on Ctrl+K and a button |
| A-24, A-25, D-03 (P0, P1) English on Malay pages, wording | **Fixed** | 0 English prose outside `lang="en"` on 18 Malay pages |
| A-27 (P1) home flight-preview targets | **Fixed** | Each row is a stretched link, 97 px tall |
| B-08 (P0) concierge direct answers | **Improved** | 13 of 17 questions led with the right answer or an honest "not published"; 4 departure-autogate questions did not (weakness 4) |
| B-11 (P0) needs can be set | **Holds** | As blocker 6 |
| B-18 (P1) pause auto-update | **Holds** | "Pause live updates" becomes "Resume live updates", `aria-pressed="true"` |
| B-19 (P1) board changes announced | **Partly checked** | Filtering announces "2 flights shown" (polite); I could not provoke a status change on a saved flight |
| C-04 (P0) illustrative pins given a place | **Unchanged** residue | Route lists: "Toilets · Level 5", "Prayer room · Level 5", "Toilets · Level 3": 0 of 40 options say "illustrative"; the lifts are Demo with no marker in their name (weakness 8) |
| C-08 (P1) step-free route ends short | **Unchanged** (MAHB places) | Route steps say "Step-free: use a lift or ramp; ask staff if you cannot see one." |
| C-09, C-10 (P1) duplicate options, heading order | **Hold** | 40 options, 0 duplicates; four pages with one `h1` and 0 skipped levels |
| D-01 (P0) "Official" on unofficial sources | **Holds** (spot check) | 28 Official tags on six pages; every section that carries one cites at least one MAHB, Malaysia Airlines or `gov.my` host. The same sections also cite news and fan sites (says.com, routesonline.com on the hub; klia2.info, klairport.info and destinationkualalumpur.com on the overview) |
| D-04, D-07 (P0) | **Unchanged** (MAHB, airlines, Immigration) | As weaknesses 1 and 6 |
| D-09 (P1) Malay place names | **Partly** | Board row "Lihat penerbangan AK 6336, Pulau Pinang"; the same flight's `h1` "AK 6336 ke Penang" |
| D-14 (P1) reading level | **Unchanged** | My estimate: immigration guide grade 9.3, first-time 8.6, reduced mobility 8.3, hub 8.3; 14 sentences over 25 words in each of the two longest guides |
| E-06 (P0) CI, WebKit | **Unchanged** (verification G7) | Not run on a runner |
| Reduced motion | **Holds** | 77 to 225 elements with transitions normally; 0 with the OS setting and 0 with the in-app setting on 5 pages; 0 running animations |

---

## Scores

Same convention as before: info and commerce are scored on what exists; the other dimensions judge the design as if
production data were connected. Anchors: 3 competent major airport, 4 strong with evidence, 5 best-in-class
reference with first-hand evidence. I treated the second review's scores as history and scored what I saw.

| Key | Weight | Second review | Now | Change | Confidence | Reason |
|---|---|---|---|---|---|---|
| ui | 10% | 4.0 | **4.0** | 0 | medium | Visible 2 px rings everywhere I tabbed, including 11.1:1 on the yellow demo banner in dark; no clipped chips at 320 px. Held back by the concierge composer hiding the focused suggestion on desktop, Malay mid-word breaks in four controls, and a header and phone bar that break when the root text is doubled. |
| ux | 20% | 4.0 | **4.0** | 0 | medium | Assistance now works as a flow: needs control about 2.5 screens down instead of eleven, "Act now" when the window has passed, a deadline that never shows a past time. Still very long pages (hub 17,614 to 19,186 px at 125 per cent) and the hub's own needs control 5 screens down. |
| info | 15% | 3.0 | **3.0** | 0 | high | Honesty is now very good: status lines, statement and concierge say what is not known and who to ask. But the facts a wheelchair user, an AirAsia passenger or a departing older citizen needs are still not published, and demonstration lifts are named like real ones. |
| flight | 15% | 4.0 | **4.0** | 0 | medium | Fixed: the "Done" wording, the notice-period warning, one time basis, keyboard save with `aria-pressed`, filter results announced. Still held at 4: alerts need the page open (OOS-10), and I could not test a change announcement. |
| mobile | 10% | 4.0 | **4.0** | 0 | medium | Answer on the first screen in Malay at 125 per cent, 0 sideways scroll on 28 pages, chrome gives way when scrolling. TBT over 200 ms on most pages (verification), and text-only enlargement beyond 125 per cent breaks the bottom bar. |
| nav | 10% | 4.0 | **4.0** | 0 | medium | Skip link, focus to `h1`, Label in Name, Assistance third in the tab order, palette fixed, access words lead with "not published". In-page links still leave focus on `<body>` (contrary to the statement); "lift" leads with an unmarked demo lift. |
| ai | 10% | 3.5 | **4.0** | +0.5 | medium | First-hand: 17 questions in two languages; 13 led with the right answer or an honest "not published", including wheelchair + AirAsia, "tandas OKU", accessible taxi, a clarifying question when no airport was named, and a contact fallback. Four departure-autogate questions, three in Malay, led with visitor or arrival content. |
| commerce | 5% | 2.5 | **2.5** | 0 | low | Outside my lens; not re-examined. Nothing can be bought; parking rates are marked not verified. |
| perf | 5% | 4.0 | **4.0** | 0 | low | Not measured by me. Verification round five: LCP 1.22 s or less on 10 of 10 pages, the flight page 94 to 96; TBT over 200 ms on most pages, congested Wi-Fi LCP 2.57 to 2.65 s, CI and WebKit not run. |
| **Weighted** | | **74.5%** | **75.5%** | **+1.0** | medium | No dimension at 5. With MAHB's accessibility facts, the AT study and the team items below, I would expect about 80 per cent (judgement). |

What moved my score, first-hand: only **ai**, because I asked the access questions the second review said were
missed and they now lead with the right answer, in both languages. Several fixes in ux, flight and info are real
but did not lift those dimensions a half point: each fix is matched by a gap found or still open (the concierge
focus defect, in-page focus, unchanged facts, the unchanged hub).

---

## Strengths (measured unless marked)

1. **Honest by construction.** "Status not available" and the notices' own date replace the clock. Flight answers
   say "in the demonstration data. Your airline has the real status." The board caption reads "Berlepas: 06:11
   hingga 12:21. Data demonstrasi." with "Demo · Data demonstrasi" on every hour group. Missing facts are listed
   by name with who to ask, and Official tags trace to official hosts on the pages I checked.
2. **Assistance as part of the journey, in both languages.** One set of needs, set by keyboard in two key presses
   from the flight page's "My needs" link. It adds an airline-specific step, step-free map links and the right
   warning for where the traveller is in time ("Act now"; "we do not know how much notice … needs"), and the
   status message is announced in Malay.
3. **Complete keyboard operation of the board and map.** Board: filter announced ("2 flights shown"), row link,
   save button with `aria-pressed`, Enter to the flight with focus on its `h1`. Map: From and To lists with unique
   names, a step-free switch with a visible ring, the route announced ("Route found: about 7 minutes in 5 steps."),
   pan and zoom buttons and a "Skip to the list of places" link.
4. **Robust at zoom and large text.** No sideways scroll at 320 px with 125 per cent text, at 640 x 400 or 320 x
   256, or with WCAG text spacing. Sticky chrome gives way. Reduced motion removes every transition, from the OS or
   the site's own setting.
5. **Malay that a first-timer can use.** A task-based home `h1`, "Tanya Kami", "Keperluan anda: kerusi roda, warga
   emas.", "Tindakan segera: Jika belum ada sesiapa yang mengatur bantuan, hubungi AirAsia sekarang…". No stray
   English prose on 18 pages, and Malay searches for "kerusi roda", "tandas OKU", "warga emas" and "lif" all lead
   somewhere useful.

---

## Ten most significant remaining weaknesses (this lens)

1. **The facts an assisted traveller travels on are still missing** (D-04, OOS-07; MAHB and airlines). Located
   accessible toilets, lifts (the map's are demonstration points), wheelchair and buggy points, accessible bays, the
   step-free status of KLIA Ekspres, KLIA Transit, buses and taxis, the airport's own assistance service and how to
   book it, CARE chat hours, an accessibility contact with a response time, and the rules of AirAsia, AirAsia X and
   Batik Air. The product says all of this plainly; a wheelchair user flying AirAsia from Terminal 2 still has
   nothing specific to act on.
2. **No assistive-technology evidence** (E-06, OOS-15; team, with MAHB recruiting). No NVDA, JAWS, VoiceOver or
   TalkBack session, no WebKit or iOS Safari run, no disabled participant. Everything in this report is inferred
   from the DOM in Chromium.
3. **The concierge's sticky question box hides the focused suggestion on ordinary screens** (team; new). At 1280 x
   720, Tab to "What is the cheapest way to get to KL Sentral?": the button's box runs from 649 to 720 px and the
   sticky form starts at 651 px. Only a 2 to 3 px strip of the focus ring shows (screenshot), and two more
   suggestions are 60 per cent covered. At 1440 x 900 two suggestions per language are covered in the same way
   (Malay screenshot). This is at best a marginal pass of WCAG 2.4.11 (AA), fails 2.4.12 (AAA), and gives axe
   `target-size` on `/ms/concierge` on every load. Round four fixed it only for windows under 40 rem high. The
   statement claims the focused item is not hidden.
4. **Departure autogates for citizens and older travellers: facts absent, and the Malay concierge answers the wrong
   question** (D-07: Immigration Department; ranking: team). "Bolehkah ibu saya yang warga emas guna autogate
   semasa berlepas?", "Siapa boleh guna autogate berlepas di KLIA?" and "Warga Malaysia guna autogate semasa keluar
   negara…" all open with "Ini yang dinyatakan oleh sumber kami…". Then they put visitor autogate eligibility,
   e-passports and the arrival card (MDAC) first; the third leads with "pelawat dari 63 negara". The honest
   departing-citizen card is second or hidden behind "Tunjuk 3 lagi". In English "Can my elderly mother use the
   autogate when leaving Malaysia?" does the same; only "Malaysian citizens … departure autogate" leads correctly.
   This is the question a Malay first-timer with an older parent asks first.
5. **In-page links leave focus on `<body>`, and the statement says otherwise** (A-05 residual; team). "My needs" on
   the flight page and the hub's contents links ("Not published yet", "Penyata kebolehcapaian") scroll to the
   section and set the sequential starting point, but `document.activeElement` stays `<body>`. The statement:
   "A link to a section moves focus to that section." Screen readers that follow focus rather than the scroll
   position may not move.
6. **Length and the hub's needs control** (team). At 390 px and 125 per cent the hub is 17,614 px (en) and 19,186
   px (ms), and its needs control is at 4,465 / 4,947 px, unchanged from the second review. Facilities is
   21,242 px and transport 16,938. On flight pages "My needs" is at 1,870 to 2,142 px, outside the two-screen
   target at 125 per cent.
7. **Malay residuals** (team; native review OOS-14 is MAHB). Mid-word breaks at 360 px and 125 per cent on four
   pages, most visibly the transit control "Antarab / angsa", "Domesti / k". "kaunter 2- / 7" breaks inside a
   range on the flight summary. "Penang" in a flight `h1` but "Pulau Pinang" on the board. "Susunan kata AI dan
   penerbangan simpanan" reads as "reserve flights", although the home card says "Penerbangan yang anda
   simpan". Smaller slips: "kurang tiga minit" for "kurang daripada tiga minit", and an ambiguous "Ia menyatakan".
   The English home `h1` is still the brand line "Your journey, beautifully connected.", which says nothing about
   the task.
8. **Demonstration lifts are named like real ones** (team). In `kul.ts` the lifts are `provenance: 'demo'`, but
   unlike toilets, prayer rooms and ATMs their names lack "(illustrative position)". Site search "lift" / "lif"
   leads with "Lifts to Levels 3 and 1 · KLIA Terminal 1 schematic map". The map list relies on a level-wide
   "Demo unless marked otherwise". The route lists still offer "Toilets · Level 5" and "Prayer room · Level 5"
   with no marker. For a wheelchair user a lift is exactly the place not to guess.
9. **Text-only enlargement beyond 125 per cent** (team; not a WCAG failure). WCAG 1.4.4 is met through browser zoom
   (reflow holds at 200 per cent). But with the root text at 200 per cent, close to what large Android font
   scaling does, all seven pages I tried scroll sideways by 44 px at 1280 and 56 to 87 px at 390. On the phone the
   airport switcher is pushed off screen and the bottom bar's labels overlap ("Utama" over "Penerbangan",
   screenshot). The product's own setting stops at 125 per cent, so older users who rely on device font size are
   not served by it.
10. **Mid-range phones and failure states** (team; verification). TBT over 200 ms on most pages (pooled medians 227
    to 308 ms), congested Wi-Fi LCP 2.57 to 2.65 s, and a failed script fetch still replaces the home saved-flight
    card and My journey's clear control with "Something went wrong" (G8 items 1, 2 and 7). Delay and confusing
    error text hit anxious and cognitively disabled users hardest. The statement's review date also predates
    round five.

---

## Launch blockers

### Fixable by the delivery team

1. **Assistive-technology study and WebKit.** Run CI with WebKit, then a moderated study on phones with NVDA,
   VoiceOver on iOS, TalkBack and magnifier users, in English and Malay. MAHB recruits participants (OOS-15).
2. **Concierge focus under the sticky box** (weakness 3). Add `scroll-padding-bottom` equal to the composer's
   height, or make the composer static while suggestions are shown. Re-run the Tab walk and axe at 1280 x 720 and
   1440 x 900.
3. **In-page link focus** (weakness 5). Move focus to the target (`tabindex="-1"`) for "My needs" and the hub's
   contents, as "See this step" already does, or correct the statement.
4. **Concierge intent for departure autogates** (weakness 4). Route "berlepas", "keluar negara", "warga
   Malaysia/warganegara" and "warga emas" with "autogate" or "imigresen" to the departing-citizen card first, in
   both languages. Keep the arrival content for "tiba"/"MDAC" questions.
5. **Mark every demonstration place** (weakness 8). Add "(illustrative position)" to the lifts, and keep the marker
   in search results and the From and To lists.
6. **Statement refresh** (weaknesses 3, 5, 10). Date it after round five, and make its focus and sticky-content
   sentences true (fix 2 and 3 first).
7. **Malay residuals and the English `h1`** (weakness 7). No mid-word breaks in segmented controls, chips and
   headings; a non-breaking range for counters; one name for Pulau Pinang; "penerbangan yang disimpan"; a
   task-based English `h1` once the brand owner agrees (OOS-08).
8. **Mid-range Android budgets and resilience** (weakness 10). TBT, and `retryingImport` for every lazy part that
   renders on load.
9. **Recommended, not a WCAG failure:** let the header and bottom bar survive device font scaling (weakness 9), and
   consider a 150 per cent step in the site's own text setting.

### Dependent on MAHB data, systems or partners

1. **Located accessibility facts for KLIA T1 and T2** (OOS-07): accessible toilets, surveyed lifts, wheelchair and
   buggy points, accessible bays, and the step-free status of every transport mode.
2. **The airport's own assistance service** (what it offers, how to book, lead time), CARE chat hours, and an
   **accessibility contact with a response time** for the statement.
3. **Airline assistance rules and notice periods** for AirAsia, AirAsia X, Batik Air and the other main carriers
   (D-04).
4. **Immigration Department wording** on departure autogates for citizens and on counters for older travellers
   (D-07).
5. **Map places** for the taxi counter, rail entrances and e-hailing pick-up, so step-free routes end where the
   journey continues (C-08).
6. **Native Malay editorial review** and brand and legal sign-off, including the English brand line (OOS-14,
   OOS-08).
7. **Official flight and operations feeds** (OOS-01, OOS-02) so status lines can again carry a real checked time,
   and **alert delivery** beyond an open page (OOS-10).
8. **Participant recruitment** for the assistive-technology study (OOS-15).

## Prototype-only versus product

Prototype-only (expected to go with production data; not counted against the design scores): demonstration flights,
gates, check-in rows, queue estimates and alerts; illustrative map positions and demonstration lifts (but their
labelling, weakness 8, is a product issue); "not published" accessibility facts; unverified parking rates; the
"Concept prototype, not official" banner. Product issues that stay with production data: weaknesses 3, 4 (ranking),
5, 6, 7 (apart from the native review), 8 (labelling), 9 and 10, and the AT study in weakness 2.

## Reproduce

Serve the build as in Method. With Playwright Chromium, a fresh context per page and its own `x-e2e-client-ip`:

- **Concierge focus.** Open `/en/concierge` at 1280 x 720 and Tab to "What is the cheapest way to get to KL
  Sentral?". Compare the button's `getBoundingClientRect()` with that of `main form` (`position: sticky`). Do the
  same on `/ms/concierge` at 1440 x 900 to "Penerbangan saya lewat. Apa yang patut saya buat?". Run axe there with
  `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`.
- **In-page focus.** On `/en/kul/flights/<a same-day KUL departure>` at 390 x 844, Tab to "My needs", press Enter,
  and read `document.activeElement`.
- **Autogate ranking.** In `/ms/concierge`, ask "Bolehkah ibu saya yang warga emas guna autogate semasa
  berlepas?".
- **Timeline states.** Set `ma:needs:v1` to `["wheelchair"]` and `ma:preferences:v1` to
  `{"theme":"system","textSize":125,"highContrast":false,"reducedMotion":false}`, open a same-day Malaysia Airlines
  departure less than two hours away, and read the `.sr-only` state words in the timeline.
- **Malay breaks.** `/ms/kul/transit` at 360 x 780 and 125 per cent: the arrival-type control.
- **Text-only enlargement.** Add `html{font-size:200%!important}` to any page at 390 x 844.

Flight ids follow the demonstration date (`<airline><number>-<yyyymmdd>-d`); take a current one from
`/api/flights?airport=KUL&direction=d`.
