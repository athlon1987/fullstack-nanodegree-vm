# Independent panel review: first-time international traveller and accessibility

Panel role: `first-time-access`. Date: 18 November 2026. Reviewers:

- **(A) First-time international traveller.** Flying out of Malaysia for the first time with an elderly parent;
  anxious; unfamiliar with airport terms; reads on a mid-range Android phone; more comfortable in Bahasa Malaysia.
- **(B) Traveller with accessibility requirements.** Wheelchair user with low vision; uses screen magnification and
  sometimes a screen reader; needs to arrange assistance, follow accessible routes, find accessible toilets and know
  distances and lifts.

Product under review: the concept prototype in this repository, production build served by this panel with
`next start -p 3108` (PID recorded, stopped afterwards). Flight data is the labelled demonstration provider; published
facts come from the sourced content layer. Browser clock: real time, 18 November 2026, 18:43 to 18:56 MYT.

## How we tested

**Measured** (Playwright Chromium, axe-core, Lighthouse; scripts and raw output in the panel's scratch folder):

| Setting | Values |
|---|---|
| Phone viewports | 360 x 780 (Android UA, Malay), 390 x 844 (Android UA, Malay and English), 320 x 568 (reflow check) |
| Display settings | The product's own settings written to storage before load: text size 125 per cent; high contrast on and off; light, dark; reduced motion |
| Desktop | 1440 x 900, English |
| Windows contrast themes | `forcedColors: 'active'` emulation |
| Pages | `/ms`, `/ms/kul/flights`, `/ms/kul/flights/mh2072-20261118-d` (departure, T1, London), `/en/kul/flights/mh2073-20261118-a` (arrival), `/ms/guides/first-time`, `/ms/guides/departing`, `/ms/guides/older-travellers`, `/ms/kul/transport`, `/en/accessibility`, `/en/guides/reduced-mobility`, `/en/kul/map` (step-free routes), `/en/kul/facilities`, `/en/kul/parking`, `/en/kul/transport`, `/en/help`, `/en/notices`, `/ms/journey`, site search (23 queries), concierge API (8 questions) |

**Expert judgement** is marked as such. Scores are an independent assessment on the benchmark rubric
(`docs/strategy/benchmark-report.md` section 1.1) and are not comparable to measured values.

Evidence images (9 screenshots viewed in total, including two benchmark captures) are in
[`first-time-access/`](first-time-access/): `home-ms-360-text125.jpg`, `flight-mh2072-ms-360-text125.jpg`,
`board-kul-ms-390-text125.jpg`, `map-kul-390-hc-text125-first-screen.jpg`, `accessibility-en-390-hc-text125.jpg`,
`flight-mh2072-en-desktop.jpg`, `transport-forced-colors-crop.jpg`, plus three Lighthouse summaries. Benchmarks compared:
`docs/research/screenshots/changi-home-mobile.jpg` and `heathrow-flights-departures-mobile.jpg`.

## Headline

**Measured.** The core of the product works for both personas: a Malay phone is sent to `/ms` automatically; a
flight number typed on the home page reaches its flight page in 3 interactions (4.9 s including typing); the flight page
gives a sourced step-by-step timeline (arrive by 19:30, check-in Level 5 Row H, 45 minutes for immigration and
security, boarding 21:45); the map plans a step-free route with metres and two walking paces (gate C to arrivals
pick-up: 760 m, about 14 min, or 19 min at a slower pace); the display settings (125 per cent text, high contrast,
reduced motion) apply on every page tested and survive navigation; axe reports zero violations of the standard WCAG
2.x A/AA rules on 6 pages in 3 theme combinations.

**Judgement.** It is not yet a benchmark for these two personas. Persona A is let down by length and noise on a phone
at large text: the answer she most needs ("be at the airport by 19:30") is on the eighth screen of a 13,303 px page,
behind a first step that lists 13 things the prototype could not verify and a warning about an RM2,084 parking bill.
Persona B cannot travel with confidence: the assistance step that the journey builder can add is never switched on
by any control, accessible toilets are not on the map (the hub's own link leads to "Not on this map yet"), every
transport mode says "Step-free access not confirmed", accessible parking bays are "Not published", and the airport's
own special-assistance arrangements are not summarised.

Weighted score on the rubric: **68.5 per cent as observed**, projected **78 per cent** if production flight,
facility and accessibility data were connected (assessment). Heathrow is 79.0 per cent, Changi 76.5 per cent.

## Persona A: the departing journey from home to gate (Malay, 360 px, text 125 per cent)

Flight: MH 2072 to London, KLIA Terminal 1, 22:30, travelling with an elderly mother.

| Step | What happened (measured unless marked) | Doubt or word not understood (judgement) |
|---|---|---|
| 1. Open the site | `Accept-Language: ms-MY` answered `307` to `/ms`. No cookie banner. | None. Better than Changi's mobile home, where a cookie notice covers half the first screen (`changi-home-mobile.jpg`). |
| 2. Home | First screen: airport chooser, Berlepas/Ketibaan toggle, flight search, journey-stage tabs. Search placeholder truncated to "Penerbangan, ba…". Helper text: "Mencari **pelepasan** di 21 lapangan terbang". | "Pelepasan" reads as "release"; "penerbangan berlepas" is what she would say. H1 "Perjalanan anda, terhubung dengan indah." says nothing about the task. |
| 3. Search | Typed `MH2072`: inline card "1 penerbangan ditemui · Dibaca sebagai NOMBOR PENERBANGAN · T1 TERMINAL 1 · Pintu belum ditetapkan". Pressing Enter did nothing (URL stayed `/ms`); tapping the card opened the flight page. 3 interactions, 4.9 s. | "Did it search?" after Enter. Otherwise clear: terminal shown without choosing it first (BR-01 met). |
| 4. Flight page, first screen | At 360 x 780 the first screen is the prototype banner, header, airport hero (name, code, airport time, three terminal chips) and tab strip. The h1 "MH 2072 ke London" starts at y = 724 px, under the fixed bottom navigation (y 700 to 780). | "Is this my flight or just the airport page?" |
| 5. Status card | Second screen. "Daftar masuk: Ditunjukkan lebih dekat dengan waktunya" while the timeline below already names Row H, counters 1 to 18. | Two answers to "where do I check in?". |
| 6. Timeline, first step "Pergi ke KLIA Terminal 1" | Contains a 90-word "Perkara yang belum disahkan oleh prototaip ini di KLIA" list (trains, taxi fares, parking rates, autogates, Lost & Found, Wi-Fi) and, in step 2, "Elakkan Preferred Parking… bil RM2,084". | Alarming for an anxious first-timer who is taking the train. |
| 7. When to arrive | "Tiba di lapangan terbang sebelum 19:30" at y = 6,010 px (eighth screen). No "leave home by" time; the transport page knows KLIA Ekspres takes 28 min, but the timeline does not use it. | "When do we leave the house?" is still unanswered. |
| 8. Check-in | "Daftar masuk di Aras 5"; Row H; then the airline card in **English**: "Level 5. International Economy: Row H, counters 1 to 18…", and "Setakat Page undated". | Mixed language; "serahan bagasi layan diri" (self bag drop) not explained. |
| 9. Immigration and security | "Sediakan pasport dan pas masuk… sekurang-kurangnya 45 minit". The first-time guide's "Kawalan pasport" is one sentence tagged "Cadangan". Concierge, "Boleh ibu saya guna autogate?": intent `unknown`. | "Do Malaysians use the autogate or the counter? Can my mother?" Unanswered. |
| 10. Gate and boarding | "Pintu anda belum ditetapkan… kira-kira 90 minit sebelum berlepas", map link; "Naik pesawat mulai 21:45". | Clear. "Pas masuk" is defined in the first-time guide ("pas masuk yang menunjukkan pintu dan waktu menaiki pesawat"). |
| 11. Save and come back | "Simpan penerbangan" sets `aria-pressed="true"` and announces "Disimpan ke Perjalanan saya"; `/ms/journey` shows "SETERUSNYA: Pergi ke KLIA Terminal 1". No account. | Good; reassuring. |
| 12. Wheelchair for mother | Search "kerusi roda": reduced-mobility guide first, then "Bagaimana saya meminta kerusi roda?". Malaysia Airlines: 48 hours, free. The flight page never offers an assistance step. | She has to leave her flight to find it. |

**Words or labels persona A did not understand or doubted** (judgement): pelepasan; Lounge (nav, untranslated);
Preferred Parking; Aerotrain; Contact Pier; Bangunan Satelit; serahan bagasi layan diri; e-hailing; autogate;
MDAC; the badges Rasmi / Anggaran / Cadangan / Demo (explained only at the foot of each page, under "Cara membaca
panduan ini"); "Setakat Page undated"; "pemberitahuan pelayar" (browser notification).

**Malay parity (measured).** A scan for English function words found English text on only two of eight Malay pages:
the airline check-in card on the flight page and one airline service name ("Meet and Assist") in the older-travellers
guide. Search understands Malay: "kerusi roda", "surau", "imigresen", "cecair", "teksi", "warga emas" all return the
right first result; "troli" and "tukar wang" return 0 results.

## Persona B: an accessible journey, kerb to gate and arrival to taxi (English and Malay, 390 px, 125 per cent, high contrast)

| Task | What happened (measured) | Enough to travel with confidence? (judgement) |
|---|---|---|
| Find the assistance hub | Phone: Menu, then "Assistance and accessibility" (2 taps). Desktop header: not present; reached through Help or the footer. | Findable, but not "one interaction from any page" (BR-18). |
| Request assistance | Hub explains the airline route: Malaysia Airlines wants 48 hours' notice, is free, and offers Meet and Assist (sourced). The airport's own special-assistance page is linked but "we could not capture its content". No information for AirAsia (0 mentions in the hub and reduced-mobility guide) or any other airline. Live chat is "on a daily schedule", hours not given. | Partly. Honest, but a T2 (AirAsia) traveller gets nothing specific. |
| Tell the product my needs | No control exists. `buildJourney` accepts `reducedMobility` and would add "Arrange any assistance you need" to departing and arriving timelines, but both callers omit it (`journey-timeline.tsx:63`, `my-journey.tsx:75`). | No. BR-18's "selecting step-free adds steps to every timeline" is not met. |
| Kerb to gate C, step-free | `/en/kul/map?from=l5-kerb&to=g-gates-c&sf=1`: 7 written steps, each with level, metres and minutes (210 m, 120 m, 70 m, Aerotrain under 3 min, 70 m). Zoom and reset buttons replace gestures; the map is a labelled group with a full text list. Positions are "illustrative" and the map is "schematic, not a floor plan". | Good structure, provisional data. |
| Accessible toilets | Map: "Not on this map yet: Accessible toilets". The hub's "Accessible toilets: Show on the map" opens `/kul/map?cat=accessible-toilets`, i.e. that message. Concierge: "Our sources do not publish accessible toilet for KLIA yet." | No. |
| Lifts | Map lists "Lifts to Levels 3 and 1" (Demo). Site search "lift": 0 results; "buggy": 0. | Weak. |
| Arrival, gate C to pick-up | Arrival flight page: landed, immigration, belt 10, customs, continue, meet; no assistance step. Step-free route: 760 m, about 14 min or 19 min at slower pace, but step 4 reads only "Walk on", step 5 "Continue through to Level 3: arrivals" names no lift and no immigration, and the route ends at "Arrivals pick-up". | Partly; the level change is the step a wheelchair user most needs. |
| Taxi | Transport page: coupon taxi counters "in the International Arrival Hall" (text only, not on the map); no fare table; "Step-free access not confirmed" on all six KLIA modes. Concierge "Where do I get an accessible taxi?" returned the generic transport list plus statements about changing terminals and the car-park shuttle. | No. |
| Parking | Every KLIA car park: "Not published: … accessible bays …". Search "accessible parking": Penang standard parking first. | No. |
| Aerotrain night closure | `/en/notices`: shuttle buses replace the Aerotrain 00:00 to 05:00, 28 November to 1 December; no mention of wheelchair access to those buses. The demo schedule has no night departures, so the route planner's behaviour during a closure could not be tested. | Doubt for a C-gate night flight. |
| Display settings | 125 per cent text, high contrast, reduced motion apply before paint and persist. Minimum rendered text 13.75 px at 125 per cent. | Yes. A real strength. |
| Magnification | At 320 x 568: sticky header 85 px plus bottom navigation 71 to 74 px = 28 per cent of the viewport, permanently. The h1 of the map, transport, facilities, board and flight pages is below the first screen (645 to 724 px). `/en/kul/transport` scrolls sideways by 30 px. | Workable but tiring. |
| Screen reader and keyboard | Skip link first; visible 2 to 3 px focus outline on every stop; save button uses `aria-pressed` and a live message; map steps are buttons with full text. The route's From/To selects contain "Aerotrain station · Gates" twice and "Malaysia Airlines Golden Lounge · Gates" three times. The statement says focus does not move after client navigation and no screen-reader user has tested the site. | Good foundations; the duplicate names matter for exactly this persona. |
| Windows contrast themes | axe reported 10 to 420 contrast "failures" under forced colours; a crop of the transport page (`transport-forced-colors-crop.jpg`) shows T1/T2 badges and "Step-free access not confirmed" legible as black on white with borders. Treated as an axe false positive, not a finding. | Yes. |

## Accessibility measurements

| Check | Result |
|---|---|
| axe (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa), 6 pages x 3 combinations (high contrast light 125 per cent 390 px; high contrast dark 125 per cent 360 px; dark 112 per cent 1440 px) | 0 violations on `/ms` and `/en/accessibility`. `label-content-name-mismatch` (WCAG 2.5.3, Level A; an axe rule flagged experimental), 1 node, on every airport page tested (map, flight, transport, board) in every combination: the header airport switcher shows "KUL T1" but is named "Change airport. Currently KLIA Terminal 1". |
| Reflow at 320 CSS px, 125 per cent text, high contrast, 7 pages | 6 pass; `/en/kul/transport` scrollWidth 350 px (30 px sideways scroll) from provenance tags (`whitespace-nowrap shrink-0`). |
| Lighthouse mobile, 1 run each, local server shared with other evaluators | `/ms`: performance 68, accessibility 100, TBT 1,434 ms, CLS 0.161, 720 KB, 45 requests. Flight page (ms): 68, 100, LCP 4,381 ms, 784 KB, 50 requests. `/en/accessibility`: 77, 100, LCP 4,019 ms, 630 KB. SEO 54 to 63 was not investigated (probably the prototype's no-index setting). |
| Layout shift on a slow phone | Playwright, 412 px, 4x CPU slowdown, `/ms`: one shift of 0.158 at about 0.9 s; the search card, journey tabs and operations notice move up 27 px. Without throttling: 0.000 in both languages. |
| Touch targets | Home at 360 px: 20 visible targets under 44 px high, e.g. destination links in the home flight preview at 26 px (above WCAG 2.2's 24 px minimum, below the project's own 44 px goal). Flight page: 6. |

## The ten questions

### 1. Is this genuinely easier to use than Changi?

**For persona A, yes for the departing task; for persona B, only partly.** Measured: no cookie wall (Changi's mobile
home shows one over half the first screen), the flight search and journey stages are in the first screen, a flight
is reached in 3 interactions without an account, and saving and following need no app (Changi gates saving and alerts
behind its app, per the benchmark report). Judgement: Changi's web is a content guide with its best journey
features in the app; this product puts them on the open web, which is easier. But at 125 per cent text on a phone, the
product's pages are long (home 14,089 px, flight 13,303 px, transport 18,447 px) and wrapped in airport chrome, so
"easier" depends on the visitor not needing large text. For persona B the step-free route planner with distances is
something Changi does not offer on the web (its sensory map is a PDF), but the missing accessible-toilet, lift and
step-free transport data leave her no better informed than she would be at Changi.

### 2. Is flight discovery faster and clearer than Heathrow?

**Yes, clearly.** Measured: home search to flight page in 3 interactions and 4.9 s at 360 px; the inline result
states the terminal, gate state and the demonstration label; Malay works; codeshares are shown as "Juga dijual sebagai
CX 5975" on one page. Heathrow's mobile departures capture (`heathrow-flights-departures-mobile.jpg`) spends the first
screen on a photograph and then shows "Your flight selection cannot be found" with no last-known data. Weakness: on
this product's board at 390 px with 125 per cent text, the first flight row is at y = 1,706 px (third screen), after
the airport hero, the page intro (partly under the floating search button), the tabs, search, status chips and the
demonstration banner (`board-kul-ms-390-text125.jpg`). Pressing Enter on a single exact match does nothing.

### 3. Is the visual design as refined as the best global consumer products?

**On desktop, close; on a phone at large text, not yet.** Judgement from `flight-mh2072-en-desktop.jpg`: a calm,
editorial system with a precise flight card, tabular times, quiet provenance badges and generous spacing; it is more
refined than any benchmark capture we compared. On the phone at 125 per cent (`flight-mh2072-ms-360-text125.jpg`,
`map-kul-390-hc-text125-first-screen.jpg`) the hierarchy breaks down: the airport hero (name, code, clock, three
terminal chips) repeats on every airport sub-page and fills most of the first screen; the floating search button sits
on top of body copy; the decorative display face in headings is lovely but the italic H1 on the home page is the least
useful text on the screen. High contrast mode is clean and legible (`accessibility-en-390-hc-text125.jpg`).

### 4. Can passengers complete their most important tasks with minimal friction?

| Task | Persona | Result |
|---|---|---|
| Find my flight and terminal | A | Yes, 3 interactions. |
| Know when to arrive | A | Yes, but on the eighth screen; no "leave home by". |
| Know where to check in | A | Yes (Level 5, Row H), with a contradictory "shown nearer the time" on the status card. |
| Understand immigration as a Malaysian with an elderly parent | A | No: no autogate or counter guidance. |
| Save and return without an account | A | Yes. |
| Arrange wheelchair assistance | A, B | Partly: Malaysia Airlines' rule is clear; other airlines and the airport's own service are not summarised; the flight timeline never mentions it. |
| Step-free route kerb to gate | B | Yes, with distances and two paces, on a schematic map. |
| Accessible toilet near my gate | B | No. |
| Arrival to taxi, step-free | B | No: level change unnamed, taxi counter not mapped, step-free access of every mode unconfirmed. |

### 5. Is the information accurate, complete and trustworthy?

**Trustworthy, yes; complete, no.** Measured: every changeable fact we opened carries a provenance badge and a source
count; unknowns are stated ("Not published", "not confirmed", "We could not capture its content"); the KLIA Ekspres fare
shows RM 55 "until 31 December 2026" and the change to RM 65 on 1 January 2027; demonstration flight data is labelled
on every flight surface. We did not re-verify facts against official sites. Judgement: for persona B the honesty is
admirable but the gaps are exactly the facts she travels on (accessible toilets, lifts, step-free transport, accessible
parking, the airport's assistance service). The repeated caveat blocks ("Left out because we could not verify them…"
appears on facilities, transport, parking and the first step of every departing timeline) erode persona A's
confidence more than they inform her.

### 6. Is the mobile experience exceptional?

**Good, not exceptional.** Strengths (measured): no sideways scroll on 6 of 7 pages at 320 px with 125 per cent text;
text settings that persist; 44 px controls in the core flows; Malay by default on a Malay phone; payloads of
630 to 784 KB. Weaknesses (measured): 28 per cent of a 320 x 568 screen is fixed chrome; first screens of airport
sub-pages are chrome; `/ms` total blocking time 1,434 ms and a 0.161 layout shift on a throttled phone, so early taps on
a mid-range Android are at risk; LCP 4.0 to 4.4 s in lab; the transport page scrolls sideways at 320 px.

### 7. Does it support MAHB's commercial and operational objectives?

**Operational, yes; commercial, barely (for these personas).** Measured: the home page and notices carry the planned
Aerotrain night closure with dates and sources; anti-touting advice sits in the arrival timeline ("ignore anyone who
approaches you offering a ride"); parking warns against long stays in Preferred Parking. These reduce counter enquiries
and complaints, which is the operational aim. Commercially, nothing can be bought, parking rates are unverified, and
Fast Track and assistance services are not offered in context (see the exec-commerce panel). Judgement: an elderly
parent and a wheelchair user are natural buyers of Meet and Assist, lounges, porter and premium parking; the product
does not yet connect needs to services.

### 8. Is it differentiated enough to establish a new international benchmark?

**In concept, yes; in delivery for these personas, not yet.** The differentiators are real and first-hand observed:
account-free follow with a journey timeline per flight, departing/arriving/meeting/transiting views, a step-free route
planner with two walking paces, provenance on every fact, Malay parity and persistent display settings. No benchmark
combines these on the open web. What stops it being a benchmark for us: the needs-aware timeline is built but not
wired, and the accessibility data layer is empty where it matters.

### 9. The most significant remaining weaknesses, ranked

1. **Assistance needs cannot be set, so no timeline ever shows the assistance step** (high; FTA-01).
2. **Accessibility facts a wheelchair user travels on are missing** (accessible toilets, lifts, step-free transport,
   accessible parking, airport assistance service, non-MH airlines) (high; FTA-02).
3. **On a phone at large text, the flight page hides the flight and buries "arrive by"** (high; FTA-03).
4. **Caveat and warning blocks inside the journey create anxiety** (medium; FTA-05).
5. **Arrival step-free route skips the level change and immigration and ends before the taxi** (medium; FTA-07).
6. **Concierge ignores qualifiers such as "accessible" and cannot answer autogate questions** (medium; FTA-09).
7. **No immigration and autogate guidance for departing Malaysians and older travellers** (medium; FTA-10).
8. **Main-thread blocking and a layout shift on slow phones** (medium; FTA-11).
9. **Label-in-name failure on the header airport switcher** (medium; FTA-06).
10. **Reflow failure on the transport page at 320 px** (medium; FTA-08).
11. **Fixed chrome and the floating search button cost magnifier users space and cover text** (medium; FTA-12).
12. **Search gaps for physical-access words** ("lift", "buggy", "troli", "tukar wang") (medium; FTA-13).

### 10. What must be improved before public launch

Must (blocking for these personas):

1. Add a "My needs" control (wheelchair, older traveller, step-free, travelling with someone who needs help) stored on
   the device, pass it to `buildJourney` on the flight page and My journey, and show the assistance step with the
   airline's lead time and the airport's service (BR-18).
2. Populate accessibility data for KLIA T1 and T2 from MAHB: accessible toilets, lifts, buggies or wheelchair points,
   accessible parking bays, step-free status of KLIA Ekspres, KLIA Transit, bus and taxi, the airport special-assistance
   service and its request channel, and assistance rules for AirAsia and the other main carriers.
3. Make the phone flight page answer first: compact the airport header on sub-pages, put a summary line ("Be at KLIA
   T1 by 19:30, check in at Row H, boarding 21:45") in the first screen, and move prototype caveats out of the timeline.
4. Fix the label-in-name failure and the 320 px reflow failure, and move focus to the `h1` after client navigation;
   then test with screen-reader and magnifier users (the statement says this has not happened).
5. Bring home-page main-thread work and the throttled layout shift inside the budget (TBT, CLS 0.1).

Should: name lifts and immigration in step-free arrival routes and add the taxi counter as a map point; unique option
labels in the route selects; teach the concierge to honour "accessible" and to answer "not published"; add autogate
guidance for Malaysian citizens; add assistance to the desktop header; native-speaker pass on Malay ("pelepasan",
"Lounge"); translate the airline cards and free-text "as of" values.

## Scores (independent assessment)

Anchors: 3 competent major airport, 4 strong with evidence, 5 best-in-class reference with first-hand evidence. "Info"
and "commerce" are scored on what is actually there; the others judge the design as if production data were connected.

| Key | Weight | Score | Confidence | Basis |
|---|---|---|---|---|
| ui | 10% | 4.0 | medium | Desktop refinement above every benchmark capture compared; phone at large text is chrome-heavy and the floating button overlays copy. |
| ux | 20% | 3.5 | medium | Flight in 3 interactions, account-free save; but key answers deep in long pages, needs not wired, caveat noise, no autogate guidance. |
| info | 15% | 3.0 | high | Exemplary provenance and honesty; accessibility facts missing; T2 map missing; many "Not published". |
| flight | 15% | 4.0 | medium | Per-flight pages, four journey views, follow, share, calendar, alerts (demo); no leave-home time; assistance step unreachable. |
| mobile | 10% | 3.5 | medium | Malay by default, persistent text settings, no sideways scroll on most pages; fixed chrome, TBT 1.4 s, CLS on slow phones, buried content. |
| nav | 10% | 3.5 | medium | Skip link, visible focus, Malay synonyms in search, map list alternative; label-in-name failure, focus not moved, duplicate select names, zero-result access words, assistance not in desktop header. |
| ai | 10% | 3.0 | medium | Grounded, cited, bilingual concierge; misses qualifiers; personalisation by need not wired. |
| commerce | 5% | 2.0 | medium | Nothing to buy; parking rates unverified; no needs-based services. |
| perf | 5% | 3.5 | low | 630 to 784 KB and 42 to 50 requests (far lighter than benchmarks); Lighthouse 68 to 77, LCP 4.0 to 4.4 s, TBT up to 1.4 s, single runs on a shared server. |
| **Weighted** | | **68.5%** | medium | Projection with production flight, facility and accessibility data and the must-fix items done: about 78 per cent (assessment; breakdown in the JSON). |

## Findings

IDs use the prefix `first-time-access-NN` in the JSON (`FTA-NN` above). Severity follows the brief's scale.

| ID | Severity | Area | Title |
|---|---|---|---|
| 01 | high | accessibility | Assistance needs can never be set, so the journey's assistance step is unreachable |
| 02 | high | content | Accessibility facts needed to travel are missing |
| 03 | high | flights | Phone flight page at 125 per cent text hides the flight and buries "arrive by" |
| 04 | medium | accessibility | Hub link "Accessible toilets: Show on the map" leads to "Not on this map yet" |
| 05 | medium | journey | Prototype caveats and a parking-bill warning inside every departing timeline |
| 06 | medium | shell | Header airport switcher fails Label in Name (WCAG 2.5.3) |
| 07 | medium | map | Step-free arrival route omits the lift and immigration, has a "Walk on" step and stops short of the taxi |
| 08 | medium | transport | Transport page scrolls sideways at 320 px with 125 per cent text |
| 09 | medium | concierge | Concierge ignores "accessible" and cannot answer autogate questions |
| 10 | medium | guides | No immigration or autogate guidance for departing Malaysians and older travellers |
| 11 | medium | performance | Home blocks the main thread for 1.4 s and shifts layout on slow phones |
| 12 | medium | shell | Fixed chrome takes 28 per cent of a magnified screen; floating search button covers text |
| 13 | medium | search | Physical-access and first-timer words return nothing or wrong results |
| 14 | medium | map | Duplicate option names in the route From/To lists |
| 15 | low | content | English text on Malay flight pages |
| 16 | low | content | Malay wording to review: "pelepasan", "Lounge" |
| 17 | low | home | Enter in the home search does not open a single exact match |
| 18 | low | flights | Status card and timeline disagree about check-in |
| 19 | low | shell | Assistance is not in the desktop header |
| 20 | low | transport | Aerotrain closure notice silent on wheelchair access to replacement buses |
| 21 | low | home | Home flight-preview links are 26 px tall |

Full evidence, expected behaviour, suggested fixes and file pointers for each finding are in
[`first-time-access.json`](first-time-access.json).

## Prototype-only versus product

Prototype-only (not counted against design, counted in "info" and "commerce" where the rubric says so): demonstration
flights, gates and alerts; illustrative map positions; unverified parking rates; partial shop directory; draft Malay
awaiting native review; the "Concept prototype, not official" banner and demonstration-data callouts, which add about
330 px to the board and flight page on a phone. Product issues regardless of data: findings 01, 03, 05 to 14, 17 to 19
and 21.
