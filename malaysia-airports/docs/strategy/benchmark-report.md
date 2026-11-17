# Global benchmark: ten airport websites and Malaysia Airports

Deliverable 1, global benchmarking report. Written 17 November 2026 for the MAHB board and the design team.

It brings together ten benchmark reports written by different analysts on 16 and 17 November 2026, this project's
own lab measurements and screenshots, and the consolidated audit of MAHB's current websites. It places MAHB's current
passenger site in the same matrix, calibrates the scores so that they can be compared, and turns the gaps into product
requirements and design principles for the redesign.

Machine-readable scores: [`../research/benchmarks/matrix.json`](../research/benchmarks/matrix.json). Product strategy:
[`product-strategy.md`](product-strategy.md). MAHB audit: [`../research/audit/mahb-audit.md`](../research/audit/mahb-audit.md).

## How to read the evidence

| Tag | Meaning |
|---|---|
| **[direct]** | Observed first-hand by this project: an analyst's browser session, a capture script, a page's HTML or headers. |
| **[direct, lab]** | Measured by this project with Lighthouse 13, axe-core 4 or capture timings. Independent of any publisher, but lab data from one location, not field data. |
| **[direct, capture]** | A screenshot or capture taken by this project and reviewed for this report, without an analyst navigating the site. Used for Changi and Dubai. |
| **[search]** | Stated in a web search result or summary, with the URL given in the source report. The page itself was not opened. |
| **[prior]** | Background knowledge, not re-confirmed in this project. Flagged and low confidence. |
| **[hypothesis]** | An inference that needs usability testing, analytics or technical access to confirm. |
| **[assessment]** | Expert judgement (scores, priorities). Not a measurement. |

Every score in this document is an **expert assessment**. Only the figures in section 3 are measurements.

---

## Executive summary

### What the benchmark says

1. **The leading airport websites are close together, and none leads everywhere.** After calibration, nine of the ten
   benchmarks score between 69% and 79% of the maximum, and the top five lie within 2.5 points of each other:
   Heathrow 79.0%, Haneda 77.5%, Schiphol 77.0%, Istanbul 76.5% and Changi 76.5% [assessment]. Differences of that
   size are inside the uncertainty of the method, so the totals are not a ranking.
2. **Each strength lives at a different airport.** Hamad and Haneda turn a flight into a journey timeline; Istanbul,
   Heathrow and Incheon publish live queue times; Hong Kong and Munich let a visitor save a flight without an account;
   Istanbul is the only site observed to send flight updates (by WhatsApp) without an app or a login; Heathrow and Changi tie parking, Fast
   Track and retail to one account [direct; search for Changi]. No site combines these.
3. **The best features are usually behind an app or a login.** Flight alerts need the app or an account at Changi,
   Haneda, Hong Kong, Heathrow and Incheon, and Schiphol's richest itinerary features are in its app [direct; search]. First-time and foreign visitors, who start
   on the mobile web, get the weaker product.
4. **The field shares the same failures.** Heavy pages (Changi 21.0 MiB and Haneda 13.2 MiB in the lab; an 87.8 MB hero
   video at Hamad), basic accessibility defects (zoom disabled on four sites, missing `main` landmarks, invisible
   keyboard focus), maps and search that go blank when a third-party host fails, and flight lists with no update time
   or dates taken from the visitor's device clock [direct; direct, lab]. No benchmark scores above 4.0 of 5 on
   navigation, search and accessibility, or above 3.5 on performance [assessment].

### MAHB's position

MAHB's current passenger site scores **42.5% (medium confidence)**, 24 points below the lowest benchmark (Munich,
66.5%) and lowest on all nine dimensions [assessment]. The measured gap is as large as the assessed one: in the same
lab session its KLIA Terminal 1 homepage was the heaviest homepage measured (32.7 MiB over 171 requests,
about 18 times Heathrow's), had the lowest valid performance score (9 of 100) and was the only one with a layout shift
above 0.2 (0.621) [direct, lab]. When its content API stopped serving this project's network, pages went blank without
an error message [direct]. The site covers 5 of MAHB's 39 airports as six cloned 46-page trees, in English only
[direct]. A hypothetical site matching the best benchmark on every dimension would score 83.0%; no benchmark does.

### The five biggest opportunities

1. **Make the flight the front door, on the open web.** One search that finds any flight at any MAHB airport and states
   the terminal; a permanent page per flight with a journey timeline, live waits where data exists and views for
   departing, arriving, transferring and meeting; follow and alerts without an app or an account. This closes MAHB's
   largest weighted gaps (UX and flight information) and goes beyond Hamad, Haneda and Istanbul, which each do part
   of it.
2. **Be the lightest and most resilient airport site measured.** Server-rendered pages under 1 MB, last-known data
   with its age when a feed fails, and no third-party runtime dependencies. MAHB is the heaviest site in the set today;
   no benchmark shows last-known data on failure.
3. **One network, one source of truth, two languages.** All 39 airports in one model (KLIA as one airport with two
   terminals), one address per topic, and every price, fare, hour and phone number stored once with its source and
   date, shared by English and Bahasa Malaysia. The benchmarks are single hubs, and content drift was recorded at
   Changi, Heathrow and Schiphol.
4. **A live operational status layer.** Aerotrain, the Terminal 1 to Terminal 2 link, baggage reclaim, immigration,
   car parks and queues, each with a time and a source. MAHB's most publicised pain in 2025 and 2026 is operational
   [search]; Haneda, Istanbul and Incheon show what candour looks like. This depends on MAHB operational data.
5. **Answer-first everyday tasks, accessible by construction.** Parking totals before descriptions, a transport
   comparison with dated fares and an anti-touting message, prayer rooms and other facilities as located data, and an
   assistance hub at the top level, under a WCAG 2.2 AA release gate.

Section 6 converts these into 25 product requirements and ten design principles.

---

## 1. Method

### 1.1 Rubric and weights

Nine dimensions, each scored 1 to 5 in half points. The weighted total is the sum of score times weight, expressed as a
percentage of 5.

| Key | Dimension | Weight |
|---|---|---|
| ui | UI aesthetics and brand sophistication | 10% |
| ux | UX and task completion efficiency | 20% |
| info | Information comprehensiveness and accuracy | 15% |
| flight | Live flight information and journey assistance | 15% |
| mobile | Mobile experience (mobile web first; companion app as a secondary contribution) | 10% |
| nav | Navigation, search and accessibility | 10% |
| ai | Personalisation and AI | 10% |
| commerce | Digital commerce and ancillary revenue | 5% |
| perf | Performance, security and reliability | 5% |

The benchmark framework fixed the scale and the weights. The anchor wording below is this report's explicit statement
of how the analysts applied the scale, used to calibrate across reports:

| Score | Anchor |
|---|---|
| 1 | Absent or broken: the capability is missing or fails for most visitors. |
| 2 | Weak: present, but material defects block or mislead common tasks. |
| 3 | Adequate: the sector norm; core tasks possible with noticeable friction or gaps. |
| 4 | Strong: clearly above the sector norm, few material gaps, at least one distinctive feature. |
| 5 | Sector-leading: a reference implementation with no material gap on the website, verified first-hand. |

### 1.2 Evidence levels and confidence

Each score carries an evidence level (the tags above) and a confidence:

- **High:** several first-hand observations agree, including interaction (search, filters, keyboard, flight lookup).
- **Medium:** first-hand but partial, or consistent search evidence from official pages.
- **Low:** a single source, vendor claims, prior knowledge, or a feature that could not be exercised.

Five calibration rules were applied (section 7):

- **R1.** A 5 requires first-hand observation; search-only or prior evidence caps a dimension at 4.5.
- **R2.** Confidence is at most medium for search-only evidence and low for prior-only evidence.
- **R3.** The website is assessed. An app feature can support a score but cannot alone place a website above a peer
  whose equivalent web feature was observed.
- **R4.** This project's own measurements (Lighthouse, axe-core, capture timings, page structure, screenshots) are used
  where the original analyst did not have them.
- **R5.** No score is raised without evidence recorded in the calibration log.

### 1.3 Access per airport

| Airport | Analyst access | What was observed | Later project captures | Lighthouse valid runs | Main blocks (container, not site defects unless stated) |
|---|---|---|---|---|---|
| Heathrow | Partial direct, 16 Nov | 12 HTML pages, homepage headers, 2 mobile renders; 16 searches | None | 3/3 | Automation filter (HTTP 403 to curl, redirect loop to headless Chromium) stopped direct access; data API, map and chat hosts |
| Haneda | Direct, 16-17 Nov | 20 pages, 5 interaction scripts | None | 3/3 | Map, site-search backend, translation layer, tag manager |
| Schiphol | Search only, 16 Nov | Only a Cloudflare managed challenge page; 18 searches | Challenge page | Challenge page only | Bot challenge to curl and headless Chromium; not bypassed |
| Istanbul | Direct, 17 Nov | 13 pages, 4 interaction scripts | None | 3/3 | Map, chatbot, airline-logo hosts, nine marketing hosts |
| Changi | Search only, 16 Nov | 11 searches | Homepage and departures, desktop and mobile | 3/3 | Proxy refused the host during the analyst's run; flight listing did not render in the later captures |
| Hong Kong | Direct, 17 Nov | 15 pages, 3 interaction scripts | None | 3/3 | Map data host, chatbot; one Cloudflare challenge on the shop directory |
| Incheon | Direct, 17 Nov | 13 pages, 3 interaction scripts | None | 3/3 | Map engine on a non-standard port |
| Dubai | Search only, 16 Nov | 10 searches | Homepage (English and Arabic), flight board, a flight page, site search, contact launcher, map | 3/3 | Apex host blocked during the analyst's run; map engine in the captures |
| Hamad | Direct, 17 Nov | 16 pages, 2 interaction scripts | None | 0/3 in the final batch | Tag manager, map engine, weather; slow and intermittent responses |
| Munich | Direct, 16-17 Nov (about 01:00 local) | 22 pages, 4 interaction scripts | None | 3/3 | Map, "Visual help" toolbar, parking checkout |
| MAHB | Direct, 16 Nov until 23:48 UTC | Navigation, sitemap (276 URLs), titles, headings, HTML, API endpoints; 16-URL crawl | None kept | 1/3 (homepage) | MAHB's content API stopped serving the project's network; one web application firewall page [direct] |

### 1.4 What was measured and what was assessed

**Independently measured by this project** [direct, lab]: Lighthouse 13 on each homepage (mobile emulation,
simulated slow 4G, median of up to three valid runs, 16 and 17 November 2026); axe-core 4 (WCAG 2.0 to 2.2 A and AA
rules) on homepages and some inner pages at seven benchmark sites and MAHB; single-run capture timings (time to first
byte, first contentful paint, load event, bytes); page structure (headings, landmarks, skip links, alt text); HTTP
status codes and response headers.

**Expert assessment** [assessment]: every dimension score, every weighted total, and every statement about strengths,
weaknesses and what MAHB should beat. These rest on the evidence above but are judgements.

### 1.5 Limitations

- **Different analysts, different access.** Seven benchmarks were assessed with first-hand access, one (Heathrow)
  partially, and three (Changi, Dubai, Schiphol) from search. Calibration reduces the inconsistency; it does not remove
  it. Search-only scores are marked and carry lower confidence.
- **The container blocked many third-party hosts.** Maps, chatbots, tag-managed widgets and partner checkouts often did
  not load. A feature may exist without having been seen; AI and wayfinding judgements are therefore conservative.
- **Lab, not field.** One location, shared CPU, third-party hosts blocked (which removes weight that real visitors
  download). The useful signal is the order of magnitude and the pattern of failures.
- **Automated accessibility checks** find only part of WCAG. None of the figures is a conformance claim.
- **Moments in time.** Munich was observed at about 01:00 local time, so few flight statuses were live; search
  snapshots can be weeks or months old.
- **Apps were not tested hands-on.** App features and ratings come from store listings and press found by search.
- **No usability testing.** Every judgement of task efficiency is an expert hypothesis until tested with passengers.
- **MAHB's own content was largely unreadable** after its content API stopped serving this project; no MAHB
  screenshots were kept, so the MAHB UI score has low confidence and the task analysis was reconstructed from
  navigation, the sitemap and search.

---

## 2. The comparative matrix

Calibrated scores, sorted by weighted total. **The totals are expert assessments with stated confidence, not
rankings**: differences of up to about 3 points are within the uncertainty of the method, and three of the ten
benchmarks rest mainly on search evidence.

| Airport | ui | ux | info | flight | mobile | nav | ai | commerce | perf | Weighted | Confidence | Evidence mode |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| London Heathrow | 3.5 | 4.0 | 4.0 | 4.5 | 4.0 | 3.5 | 4.0 | 4.5 | 3.0 | **79.0%** | medium | partial direct |
| Tokyo Haneda | 4.0 | 4.0 | 4.0 | 4.5 | 3.5† | 3.5 | 3.5 | 4.0 | 3.0 | **77.5%** | high | direct |
| Amsterdam Schiphol | 4.0* | 4.0†* | 4.0* | 4.5†* | 4.0†* | 3.5* | 3.0* | 3.5* | 3.0* | **77.0%** | low | search only |
| Istanbul (iGA) | 3.5 | 4.0 | 4.0 | 4.5 | 3.5 | 3.0 | 4.0 | 4.0 | 3.0 | **76.5%** | high | direct |
| Singapore Changi | 4.0 | 4.0* | 4.0* | 4.0†* | 4.0†* | 3.0† | 3.5†* | 4.5†* | 3.0† | **76.5%** | low | search, plus project captures |
| Hong Kong International | 3.0 | 4.0 | 4.5 | 4.0† | 3.5 | 4.0 | 3.0 | 4.0 | 3.0 | **75.5%** | medium | direct |
| Seoul Incheon | 3.5 | 4.0 | 4.5 | 4.5 | 3.0 | 3.5 | 3.0 | 3.0 | 2.5 | **74.5%** | high | direct |
| Dubai International | 4.0† | 3.5† | 3.5* | 4.0† | 3.5 | 3.5† | 3.0† | 3.0* | 3.5† | **71.0%** | low | search, plus project captures |
| Hamad International, Doha | 4.0 | 3.5 | 3.5 | 4.5 | 3.0 | 3.0 | 3.0 | 3.0 | 2.0 | **69.0%** | medium | direct |
| Munich | 3.5 | 3.5 | 4.0 | 3.5 | 3.0 | 3.0 | 2.5 | 3.0 | 3.0 | **66.5%** | high | direct |
| **MAHB today** (passenger site) | 2.5 | 2.0 | 2.0 | 2.5 | 2.0 | 2.0 | 2.0 | 2.5 | 1.5 | **42.5%** | medium | direct (structure, lab) + search |
| *Best benchmark per dimension* | *4.0* | *4.0* | *4.5* | *4.5* | *4.0* | *4.0* | *4.0* | *4.5* | *3.5* | *83.0% (composite)* | | |

Legend: **†** changed in calibration (section 7); **\*** rests mainly on search or prior evidence (lower confidence).
Weights: ui 10%, ux 20%, info 15%, flight 15%, mobile 10%, nav 10%, ai 10%, commerce 5%, perf 5%.

Confidence by dimension (H high, M medium, L low):

| Airport | ui | ux | info | flight | mobile | nav | ai | commerce | perf |
|---|---|---|---|---|---|---|---|---|---|
| London Heathrow | M | M | M | M | M | M | M | M | L |
| Tokyo Haneda | H | H | H | H | M | M | M | M | M |
| Amsterdam Schiphol | L | M | M | M | L | L | L | L | L |
| Istanbul (iGA) | H | H | H | H | M | M | M | M | M |
| Singapore Changi | M | M | M | M | M | M | L | M | L |
| Hong Kong International | H | M | M | H | M | M | L | M | M |
| Seoul Incheon | H | H | H | H | M | M | M | M | M |
| Dubai International | M | M | M | M | M | M | L | L | M |
| Hamad International, Doha | H | M | M | H | M | M | L | M | L |
| Munich | H | H | H | M | M | H | M | M | M |
| MAHB today | L | M | M | M | M | M | L | M | M |

Where MAHB loses most, in weighted points against the best benchmark on each dimension [assessment]: UX 0.40,
information 0.38, flight 0.30, mobile 0.20, navigation 0.20, AI 0.20, UI 0.15, commerce 0.10, performance 0.10. The
first three dimensions account for more than half of the gap.

---

## 3. Independently measured results

Lighthouse 13, mobile emulation, simulated slow 4G, one shared cloud container, third-party hosts blocked, median of
the valid runs, 16 and 17 November 2026 [direct, lab]. axe-core 4 rule violations on the homepage, desktop and mobile
(iPhone 14 emulation), from the analysts' runs [direct, lab]. Weight is shown as recorded by the measurement tool, in
binary megabytes (MiB): MAHB's 32.7 MiB is 34,276,078 bytes.

| Site (homepage) | Valid runs | Perf. | Access. | Best pract. | SEO | LCP | TBT | CLS | Weight (MiB) | Requests | axe rules failing (desktop / mobile) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Dubai | 3/3 | 68 | 100 | 96 | 92 | 6.1 s | 26 ms | 0 | 4.4 | 94 | not run |
| Changi | 3/3 | 58 | 74 | 96 | 85 | 7.9 s | 379 ms | 0.077 | 21.0 | 122 | not run |
| Heathrow | 3/3 | 56 | 92 | 96 | 92 | 6.3 s | 393 ms | 0.102 | 1.8 | 47 | not run |
| Istanbul | 3/3 | 53 | 78 | 92 | 92 | 16.7 s | 163 ms | 0 | 5.9 | 100 | 8 / 5 |
| Haneda | 3/3 | 49 | 80 | 96 | 91 | 24.5 s | 732 ms | 0.062 | 13.2 | 187 | 4 / 5 |
| Munich | 3/3 | 47 | 47 | 96 | 85 | 8.7 s | 389 ms | 0 | 4.6 | 63 | 10 / 13 |
| Hong Kong | 3/3 | 28 | 68 | 50 | 83 | 8.9 s | 2,454 ms | 0.184 | 2.3 | 59 | 8 / 8 |
| Incheon | 3/3 | 27 | 79 | 73 | 100 | 25.1 s | 2,403 ms | 0 | 4.5 | 215 | 5 / 6 |
| **MAHB** (KLIA Terminal 1) | 1/3 | **9** | 79 | 85 | 100 | 6.9 s | 4,461 ms | **0.621** | **32.7** | 171 | 6 / 5 (27 / 19 elements) |
| MAHB departures page | 0/3 | earlier run: 17 | 82 | n/a | n/a | 17.5 s | n/a | 0.453 | 2.3 | 114 | not run |
| Hamad | 0/3 | earlier run: 55 | 82 | 69 | 69 | 36.6 s | n/a | n/a | 11.6 | 191 | 1 / 3 |
| Schiphol | Not measured | | | | | | | | | | |

Caveats that change how to read this table:

- **Schiphol was not measured.** The response was a Cloudflare bot-challenge page of 9 requests; its figures (for
  example performance 76) describe the challenge, not the site. The challenge was not bypassed.
  [`schiphol-cloudflare-challenge-desktop.jpg`](../research/screenshots/schiphol-cloudflare-challenge-desktop.jpg)
- **Hamad has no valid run in the final batch** (no first contentful paint within the time limit). The figures shown
  come from one earlier run the same day; the Hamad report records three failed runs of its own. Its analyst measured a
  first contentful paint of 20 to 48 seconds and an 87.8 MB hero video file [direct, lab]. Treat Hamad's absolute
  timings with caution: the network path from the container may have contributed.
- **MAHB's homepage had one valid run of three**; an earlier run under heavier contention gave performance 19 and LCP
  5.2 s with the same layout shift (0.621). The departures page could not be re-measured because MAHB's content API
  stopped serving the project's network.
- **Blocked third parties make heavy sites look lighter than they are.** Analytics, tag managers and chat widgets were
  not downloaded.
- **Accessibility scores are automated checks only.** Dubai's 100 still lists one flagged audit
  (`label-content-name-mismatch`); Munich's 47 coexists with a published accessibility declaration.

Selected structural observations [direct unless stated]:

| Observation | Sites |
|---|---|
| No `main` landmark on the homepage | MAHB, Changi [direct, capture], Heathrow, Hong Kong, Hamad |
| Pinch zoom disabled (`user-scalable=no` or `maximum-scale=1`) | Hong Kong, Incheon, Istanbul, Munich |
| No visible keyboard focus | Hamad, Istanbul (Munich: outline removed on 10 of 12 stops, colour and underline only) |
| No skip link | Changi [direct, capture], Haneda, Istanbul; Munich has none that receives focus |
| Accessibility statement found | Hong Kong, Munich, Incheon. Not found: Changi, Dubai, Schiphol [search]; Hamad [direct]; MAHB [hypothesis] |
| Map did not render because its host was blocked here | Hamad, Haneda, Incheon, Istanbul, Munich, Dubai [direct, capture]. Munich, Haneda and Istanbul offered no text fallback |
| Explicit error and retry when flight data failed | Changi ("Unable to load", "Try again") [direct, capture; cause not established]. Heathrow fails to an error message with no last-known data [direct, page source]. MAHB showed "Loading..." indefinitely [direct] |
| Last-known data shown when a feed fails | None observed |

---

## 4. Airport by airport

Each section gives the calibrated score, a positioning paragraph, the evidence for strengths and weaknesses, what MAHB
should beat and how, and the screenshots this project holds. Full evidence and URLs are in the source report named in
each heading.

### 4.1 MAHB today: 42.5%, medium confidence

Source: [`mahb-audit.md`](../research/audit/mahb-audit.md), [`firsthand-observations.md`](../research/audit/firsthand-observations.md).

**Positioning.** The passenger site is a KLIA-centred, client-rendered guide that leads with retail promotion and
depends entirely on one content API. MAHB's operations are well regarded by departing passengers (KLIA was in the
global top 10 of ACI's ASQ survey for airports above 40 million passengers in 2024 [search]), but the website is the
weakest in this set on every dimension, and the gap is widest exactly where the best benchmarks are strongest: getting
a passenger from a flight number to the next action.

| Dim. | Score | Evidence |
|---|---|---|
| ui | 2.5 (low) | No `h1` on the homepage, whose first headings are promotional `h3`s ("Charlotte Tilbury: Glam Before Take-Off") [direct]; layout shift 0.621 [direct, lab]; "0 °C" and "Loading..." shown when data is missing; a passenger page titled "Corporate Website"; four names for one terminal [direct]. Visual quality itself was not assessed: no screenshots were kept. |
| ux | 2.0 (medium) | Of five reconstructed tasks, the parking price is not on the parking page and lost-property contacts were found only on third-party sites; flight status requires knowing the terminal; prayer rooms sit on two "facilities" pages [direct; search]. Tasks were reconstructed from navigation, sitemap and search, not completed end to end. |
| info | 2.0 (medium) | 5 of 39 airports covered, as six identical 46-page trees (KLIA modelled as two airports); 48 of 276 sitemap URLs are second or third addresses for a topic [direct]; conflicting phone numbers and parking rates, a 2018 rate page and 2021 Aerotrain news still indexed [search]. KLIA Terminal 1 parking content (products, bays, booking) is substantive [direct]. |
| flight | 2.5 (medium) | "Find a Departing Flight" widget on every page, preset to Terminal 1, departures only [direct]; per-terminal boards with check-in row, gate, belt and status [search]; no per-flight page or web alert found; alerts are an app feature [search, hypothesis]; departures page LCP 17.5 s [direct, lab]. |
| mobile | 2.0 (medium) | No horizontal overflow [direct]; but performance 9, total blocking time 4.5 s and layout shift 0.621 on mobile emulation, 32.7 MiB [direct, lab]; axe 5 rules on 19 elements [direct, lab]; app reviews report a map without search [search]. |
| nav | 2.0 (medium) | No site-wide search seen (the only search control belongs to the flight widget; an icon could have been missed) [direct]; English only; "Air Travel" holds 13 unrelated items and accessibility sits under "Booking Services" [direct]; Lighthouse accessibility 79, six failing audits including `button-name`, `label` and `landmark-one-main` [direct, lab]. |
| ai | 2.0 (low) | A third-party chat widget (human agents, limited hours [search]) [direct]; the MYairports app offers "Track My Flight" notifications [search]; no personalisation on the website [direct]. |
| commerce | 2.5 (medium) | Parking booking form on the page but no prices; Fast Track sold on a separate domain; "Booking Services" mixes Fast Track with filming permits and school visits [direct]; no basket or account evidenced [hypothesis]. |
| perf | 1.5 (medium) | Heaviest homepage measured, performance 9 [direct, lab]; client-only content: under the API block, of 16 URLs 6 returned HTTP 502, 4 an unhandled application error and 6 navigation only, with no message to the visitor [direct]; at least 13 hostnames [direct, search]. Lighthouse SEO 100 [direct, lab]. |

**What the redesign must reverse first** [assessment]: the silent blank page, the terminal-first flight search, the
missing parking prices, the cloned trees and the English-only estate. These are failures no benchmark shares.

### 4.2 London Heathrow: 79.0%, medium confidence

Source: [`heathrow.md`](../research/benchmarks/heathrow.md). Partial direct access.

**Positioning.** A task-led operational portal rather than a showpiece: a four-tab flight widget sits under the hero,
security and immigration wait times are surfaced everywhere, and a deep commercial stack (parking, Fast Track, lounges,
Heathrow Express, Reserve & Collect, Rewards) hangs off one "My Heathrow" account. The most complete all-rounder in the
set, with the lightest valid homepage measured.

**Strengths.**
- One field for airline, flight number or city on the homepage; flight detail pages give check-in zone and opening
  time, when the gate will be announced, belt, codeshares, a last-updated stamp, a passenger or collector split, save
  and share [direct, page source].
- Estimated security and immigration wait times in the utility bar, the Flights menu, a homepage panel and flight
  details [direct, page source; search].
- A connections planner with a timeline and transfer minutes, and a questionnaire-based personal guide [direct, page
  source].
- Hallie, an AI agent on WhatsApp and web chat; the vendor reports 90% of chats resolved without a human [search,
  vendor claim].
- Six parking products with comparison and free cancellation, Fast Track in both directions, lounges and Reserve &
  Collect under one account [direct; search].
- Lighthouse accessibility 92 and 1.8 MiB, the lightest valid homepage measured [direct, lab].

**Weaknesses.**
- About 1.1 MB of HTML on every page, about 850 KB of it an inline SVG sprite [direct].
- The flight board is client-rendered only and fails to an error with no last-known data [direct, page source].
- Stale content: an Electronic Travel Authorisation notice still says "by the end of 2024" [direct].
- Six `h1` elements and no `main` landmark on the homepage; the chat launcher cannot take keyboard focus; eight
  languages, none of them Malay, Arabic, Japanese or Korean [direct].
- Live alerts and turn-by-turn navigation need the app; saving a flight needs an account; the connections planner does
  not apply to self-connecting passengers [direct; search]. The estate spans at least five hosts (main site, shop, maps, Heathrow Express, VIP) [direct].

**What MAHB should beat, and how.** Heathrow's flight detail, wait times and connections planner are the functional
bar. MAHB beats them by making the same page login-free with web alerts, by showing last-known data when the feed
fails, and by covering the self-transfer between KLIA's terminals that Heathrow's planner excludes. On commerce MAHB
should not try to match a mature loyalty programme at launch (requirement BR-21 is partner-dependent).

Screenshots: [`heathrow-home-mobile.jpg`](../research/screenshots/heathrow-home-mobile.jpg),
[`heathrow-flights-departures-mobile.jpg`](../research/screenshots/heathrow-flights-departures-mobile.jpg). No desktop
capture exists.

### 4.3 Tokyo Haneda: 77.5%, high confidence

Source: [`haneda.md`](../research/benchmarks/haneda.md), [`haneda.json`](../research/benchmarks/haneda.json). Direct.

**Positioning.** A recently styled, card-based site whose strength is operational usefulness: a timestamped real-time
congestion panel on the homepage and a flight-specific "Sample Plan" that turns a flight number into an ordered
journey. Strong on content and commerce breadth; held back by weight and by keeping alerts in an app behind a login.

**Strengths.**
- "Real Time Congestion Delay Information" on the homepage: delay and cancellation counts, rail status and car-park
  occupancy, with a timestamp [direct].
- Flight cards with a status pill, terminal chip, check-in counters, gate and every codeshare, stamped "Current (Japan
  time)" [direct].
- The "Sample Plan": duty-free pre-order, route to the airport, counters, recommended outlets in the flight's terminal,
  security and gate [direct].
- Restaurant search with "open now", halal and vegetarian filters and before or after security [direct]; special
  assistance organised by type of need [direct]; five languages [direct].

**Weaknesses.**
- Flight lists do not refresh automatically; saved flights and push alerts need the app and a member login [direct].
- Homepage 13.2 MiB in the lab (the analyst's captures recorded about 16 to 17 MB) with a video hero; LCP 24.5 s on
  throttled mobile; a third of visible mobile targets on the flight page under 24 px [direct, lab; direct].
- Map and site search depend on third-party hosts and did not degrade gracefully [direct]; commerce spread over many
  domains with no shared basket [direct]; no skip link and no security headers on the HTML [direct].

**What MAHB should beat, and how.** Take the Sample Plan idea further: a timeline that updates with the flight's
status, adds walking and queue times, and can be shared with whoever is collecting. Treat halal food and prayer rooms
as first-class, located data in English and Bahasa Malaysia. Deliver it at a tenth of Haneda's page weight.

Screenshots: [`haneda-home-desktop.jpg`](../research/screenshots/haneda-home-desktop.jpg),
[`haneda-home-mobile.jpg`](../research/screenshots/haneda-home-mobile.jpg),
[`haneda-congestion-desktop.jpg`](../research/screenshots/haneda-congestion-desktop.jpg),
[`haneda-flightdetail-desktop.jpg`](../research/screenshots/haneda-flightdetail-desktop.jpg),
[`haneda-flights-mobile.jpg`](../research/screenshots/haneda-flights-mobile.jpg),
[`haneda-menu-mobile.jpg`](../research/screenshots/haneda-menu-mobile.jpg).

### 4.4 Amsterdam Schiphol: 77.0%, low confidence (search only)

Source: [`schiphol.md`](../research/benchmarks/schiphol.md). No site content was observed.

**Positioning.** By reputation and by search evidence, the reference case for a flight-centric airport: each flight
number has its own page, and the passenger's biggest uncertainty (security) can be booked as a time slot. This
project could not see the site: it served a bot challenge to every automated client. Every judgement below is
[search] or [prior], and the score was lowered in calibration from 81.5% (C01, C03, C04).

**Strengths** [search].
- A clean URL per flight number, codeshares included (for example `/en/departures/MS758/`).
- Free security time slots: a 15-minute window bookable up to three days ahead for the whole party, with a QR code
  and a dedicated lane.
- A "my travel day" view of expected busyness at security and passport control; an app with lock-screen and watch
  updates since October 2025, rated 4.7 to 4.9 on Google Play.
- A public, versioned Flight API and developer portal; Privium membership sold online.

**Weaknesses** [search unless stated].
- Dutch and English only; the text service for deaf callers is Dutch-only.
- Ground transport hands off to external planners; nothing produces a "leave by" time.
- Itinerary walking times and blue-dot wayfinding are app-first; the AI chatbot is evidenced only by its privacy
  statement.
- Superseded prices and 2020 to 2023 blog pages remain on official URLs.
- Automated clients receive a bot challenge [direct]. Protection is sensible; the lesson for MAHB (whose own firewall
  blanked its site for this project) is protection that degrades to useful content.

**What MAHB should beat, and how.** A per-flight URL is the floor, not the ceiling: MAHB's flight page should add the
timeline, transport and "leave by" advice that Schiphol leaves to the app or to third parties, in more languages.
Bookable security slots need MAHB and agency operations, not just a website (hypothesis, open question for MAHB).

Screenshot: [`schiphol-cloudflare-challenge-desktop.jpg`](../research/screenshots/schiphol-cloudflare-challenge-desktop.jpg)
(the challenge page only).

### 4.5 Istanbul (iGA): 76.5%, high confidence

Source: [`istanbul.md`](../research/benchmarks/istanbul.md), [`istanbul.json`](../research/benchmarks/istanbul.json). Direct.

**Positioning.** A modern, image-led site and the most operationally candid in the set: live queue times sit on the
homepage and on every flight page, and any flight can be followed on WhatsApp without an app or an account. Its
weaknesses are technical accessibility, a commercial homepage and heavy marketing tracking.

**Strengths** [direct].
- Live waiting times for the terminal entrance checkpoint, passport control and domestic security, naming the busiest
  entrance, on the homepage and every flight page.
- Inline flight lookup on the homepage: status, counters and gate in two interactions.
- WhatsApp flight updates from any flight page, with no app and no account.
- A journey directory on each flight that can be tailored to accessibility, families, older travellers, sensory needs
  and visual description (the filter's effect was not verified).
- Restaurant and shop finders with vegan, gluten-free, diabetic and lactose-free filters and airside or landside zones;
  eight languages.

**Weaknesses** [direct; direct, lab].
- The first two homepage screens favour premium services and award announcements over passenger tasks.
- No skip link, no detectable focus indicator, zoom disabled, critical ARIA and label errors.
- No "last updated" time on the board; codeshare numbers rotate in one cell.
- Nine third-party marketing and analytics hosts on every page; LCP 16.7 s; no Content-Security-Policy.
- Map and chatbot depend on third parties and leave an empty page or no widget when they fail.

**What MAHB should beat, and how.** Match login-free messaging alerts and make each one carry the next step, the gate's
walking time and the current queue. Show queues with a trend, not only the current minutes. Remember a passenger's
needs on the device and apply them across the site. Do it with no third-party trackers.

Screenshots: [`istanbul-home-desktop.jpg`](../research/screenshots/istanbul-home-desktop.jpg),
[`istanbul-alerts-desktop.jpg`](../research/screenshots/istanbul-alerts-desktop.jpg),
[`istanbul-flightdetail-desktop.jpg`](../research/screenshots/istanbul-flightdetail-desktop.jpg),
[`istanbul-flights-mobile.jpg`](../research/screenshots/istanbul-flights-mobile.jpg).

### 4.6 Singapore Changi: 76.5%, low confidence (search, plus project captures)

Source: [`changi.md`](../research/benchmarks/changi.md); project captures and Lighthouse. The analyst's report was
search-only and left performance unscored; calibration added the lab evidence and moved six scores (C02, C05 to C07,
C09, C10).

**Positioning.** The strongest commerce and loyalty ecosystem in the sector, but most of its best journey capability
lives in the Changi App and behind an account. The website itself is a content-rich, task-labelled guide; in this
project's captures it presented a unified search for flights and facilities in the hero, and its live flight listing
did not load.

**Strengths.**
- iShopChangi: order from 30 days to 12 hours before a flight or up to 30 days after arrival, collect in any terminal or
  have it delivered; non-travellers can buy [search].
- Changi Rewards (four tiers) with Changi Pay, and benefits that reach operations such as free parking hours by tier
  [search].
- In the app: saved flights with alerts, take-off-to-landing tracking, Live Activities, and FlightSaver Assurance, an
  automatic e-voucher when a departure is 180 minutes or more late (launched as a trial in November 2025; status after
  the reported September 2026 trial end unknown) [search].
- Journey-stage guides with concrete transfer times, and inclusive-travel content for invisible disabilities [search].
- When the flight listing failed in this project's captures, the page said "Unable to load" and offered "Try again"
  rather than spinning [direct, capture; cause not established, possibly this project's network].

**Weaknesses.**
- Saving, alerts, tracking and delay payout require the app; richer benefits require a login [search].
- Content drift between pages and languages (S$10 against S$50 for the same benefit) and indexed staging hosts
  [search].
- Homepage 21.0 MiB over 122 requests; Lighthouse accessibility 74 with `landmark-one-main`, `button-name`, `label` and
  `image-alt` failing; no skip link [direct, lab; direct, capture].
- No web ground-transport comparison, no accessibility statement found, sensory map as a PDF [search].

**What MAHB should beat, and how.** Do not compete head-on with iShopChangi at launch. Beat Changi on what it gates:
a web-first, account-free "follow this flight" with alerts and a shareable link, across a network of airports, from
facts that cannot drift between languages because each is stored once. Keep Changi's honest error state and add the
last-known data it lacks.

Screenshots: [`changi-home-desktop.jpg`](../research/screenshots/changi-home-desktop.jpg),
[`changi-home-mobile.jpg`](../research/screenshots/changi-home-mobile.jpg),
[`changi-flights-departures-desktop.jpg`](../research/screenshots/changi-flights-departures-desktop.jpg),
[`changi-flights-departures-mobile.jpg`](../research/screenshots/changi-flights-departures-mobile.jpg).

### 4.7 Hong Kong International: 75.5%, medium confidence

Source: [`hkia.md`](../research/benchmarks/hkia.md), [`hkia.json`](../research/benchmarks/hkia.json). Direct.

**Positioning.** The most information-dense flight board and the best web accessibility features among the
benchmarks, in a visual system that now looks dated. Strong on content, navigation and login-free saving; weak on
mobile performance and on turning a flight into a journey.

**Strengths** [direct].
- Nine fields per departure, including check-in aisle and transfer desk; arrivals add stand, hall and belt; aisle,
  gate and belt link to their map location (for example `#gate_069`); a visible update stamp.
- Login-free bookmarking from the global header, with a counter on every page.
- One search box for content and flights, with flight-number suggestions for today and tomorrow.
- Special-needs guidance filterable by journey stage and by type of need; three skip links, visible focus, a text-size
  control and an accessibility statement.
- A parking product family (availability, booking, online payment, valet, charging) tied to reward points.

**Weaknesses** [direct; direct, lab].
- Status is undifferentiated black text; there is no flight detail URL, so a flight cannot be shared or indexed.
- Alerts, rewards and wayfinding are app features.
- Critical ARIA failures on every page, no `main` landmark, zoom disabled on mobile.
- Mobile first screen dominated by banners; Lighthouse performance 28, best practices 50, CLS 0.184; a COVID-19 item
  still in the main menu.

**What MAHB should beat, and how.** Keep Hong Kong's operational depth and map deep links, and add what it lacks: a
permanent page per flight, status that is legible at a glance (colour plus text plus icon), and journey context
(walking and queue times).

Screenshots: [`hkia-home-desktop.jpg`](../research/screenshots/hkia-home-desktop.jpg),
[`hkia-home-mobile.jpg`](../research/screenshots/hkia-home-mobile.jpg),
[`hkia-departures-desktop.jpg`](../research/screenshots/hkia-departures-desktop.jpg),
[`hkia-departures-mobile.jpg`](../research/screenshots/hkia-departures-mobile.jpg),
[`hkia-search-desktop.jpg`](../research/screenshots/hkia-search-desktop.jpg).

### 4.8 Seoul Incheon: 74.5%, high confidence

Source: [`incheon.md`](../research/benchmarks/incheon.md), [`incheon.json`](../research/benchmarks/incheon.json). Direct.

**Positioning.** A dense, data-rich public-service portal with the most complete flight data module in the set and
unusual operational transparency (live waits, two-day congestion forecasts, live car-park availability). The weakest
lab performance among valid runs, and an English site that still carries Korean strings.

**Strengths** [direct].
- Flight detail with the shortest route from car park through check-in to the gate, the walking time after
  immigration, destination time and weather, and sharing to KakaoTalk, LINE or e-mail.
- Real-time waiting times for every departure area; hourly passenger forecasts for the next two days.
- A 20-day flight window with terminal, hour, destination, airline and flight-number filters, a "Last Updated" stamp
  and an Excel download.
- Integrated search that answers with facilities (hours, location, map link); live car-park availability on the
  homepage; an accessibility statement.

**Weaknesses** [direct; direct, lab].
- Lighthouse performance 27, LCP 25.1 s, 215 requests; departures time to first byte 4.8 s; no security headers.
- No `h1`, zoom disabled, 66 of 194 visible mobile targets under 24 px; Korean strings on English pages.
- The homepage clock and waiting-time stamp follow the visitor's device clock, not Korea time.
- Codeshares as separate rows; saved flights and alerts in the app only; feedback requires Korean mobile verification.

**What MAHB should beat, and how.** Merge Incheon's route-to-gate detail with live queue times into one "time to gate"
figure per flight, turn forecasts into advice ("arrive by 07:10"), and always use airport-local time.

Screenshots: [`incheon-home-desktop.jpg`](../research/screenshots/incheon-home-desktop.jpg),
[`incheon-flightdetail-desktop.jpg`](../research/screenshots/incheon-flightdetail-desktop.jpg),
[`incheon-waittimes-desktop.jpg`](../research/screenshots/incheon-waittimes-desktop.jpg),
[`incheon-flights-mobile.jpg`](../research/screenshots/incheon-flights-mobile.jpg).

### 4.9 Dubai International: 71.0%, low confidence (search, plus project captures)

Source: [`dubai.md`](../research/benchmarks/dubai.md); project captures and Lighthouse. The analyst could not reach
the site; this report's review of the project's later captures raised six scores (C13 to C19). Confidence stays low
overall because content depth, transactions and the chat were not observed.

**Positioning.** A polished, recently rebuilt and fast site whose most inventive tools are QR-launched web apps rather
than an installed app, run by an operator that has made accessibility a public goal. Lighter and cleaner than most of
the field; thin on transit tooling, languages and a single account.

**Strengths.**
- Pocket Flights: QR codes in the terminal open a mobile web flight tool, no app needed [search]. Smart Gates
  eligibility pre-check by passport scan (July 2026) [search]. Express Maps opened from flight information screens
  [search].
- "DXB for All": Sunflower lanyards, an autism-friendly route, hearing loops and an assisted travel lounge [search].
- A board with scheduled and actual times, terminal, gate, coloured status and a date selector, and a flight page with
  a "Journey planner" personalised by traveller type [direct, capture].
- Site search that put the accessibility services page first for "wheelchair"; one launcher for feedback, lost and
  found, live chat, FAQs and contacts; a full Arabic build [direct, capture].
- The best valid Lighthouse result in the set: performance 68, accessibility 100, total blocking time 26 ms, no layout
  shift [direct, lab].

**Weaknesses.**
- English and Arabic only for a highly international passenger base [search; direct, capture].
- Fragmented estate: separate hosts and registrations for DXB, DWC, Al Majlis and operator checkouts; no single
  account or basket evidenced; the official app reportedly removed [search].
- Transfers described as procedure only, with no connection planner [search].
- A modal cookie dialogue covers the first view on desktop and mobile; no update stamp was visible on the captured
  board [direct, capture].

**What MAHB should beat, and how.** Match Dubai's lightness and beat its transit and language coverage. Its QR-to-web
idea suits MAHB's physical estate across 39 airports: a code on each flight information screen and gate that opens the
flight's page (hypothesis to test with MAHB operations).

Screenshots: [`dubai-home-desktop-first-view.jpg`](../research/screenshots/dubai-home-desktop-first-view.jpg),
[`dubai-home-mobile-first-view.jpg`](../research/screenshots/dubai-home-mobile-first-view.jpg),
[`dubai-flight-status-desktop.jpg`](../research/screenshots/dubai-flight-status-desktop.jpg),
[`dubai-flight-status-mobile-first-view.jpg`](../research/screenshots/dubai-flight-status-mobile-first-view.jpg),
[`dubai-flight-detail-desktop.jpg`](../research/screenshots/dubai-flight-detail-desktop.jpg),
[`dubai-site-search-wheelchair-desktop.jpg`](../research/screenshots/dubai-site-search-wheelchair-desktop.jpg),
[`dubai-contact-launcher-desktop.jpg`](../research/screenshots/dubai-contact-launcher-desktop.jpg),
[`dubai-home-arabic-desktop.jpg`](../research/screenshots/dubai-home-arabic-desktop.jpg),
[`dubai-express-maps-desktop.jpg`](../research/screenshots/dubai-express-maps-desktop.jpg) (map blank because its host
was blocked here).

### 4.10 Hamad International, Doha: 69.0%, medium confidence

Source: [`hamad.md`](../research/benchmarks/hamad.md). Direct, slow and intermittent.

**Positioning.** The most premium brand expression in the set and the best single flight page: it knows where the
passenger is and lays out each step with walking times and live queue status. Let down badly by engineering: an 87.8 MB
hero video, first paint of 20 to 48 seconds in the lab, and basic accessibility gaps.

**Strengths** [direct].
- A permanent page per flight that becomes a journey timeline: the passenger states where they are ("I'm at"), and the
  page lists check-in, immigration, security, boarding and departure with walking times and the live waiting status of
  that flight's own check-in rows. A Transfer tab does the same with live crowding at transfer security.
- Crowd indicators on the homepage; a task search with six quick links, including "Persons With Disability".
- A federated search overlay returning pages, facilities (male and female prayer rooms as separate records), lounges,
  shops, alerts and live flights; "Locate on map" from facility pages.
- A true right-to-left Arabic build.

**Weaknesses** [direct; direct, lab].
- An 87.8 MB hero video, about 190 requests per page, uncached HTML, no valid Lighthouse run in the final batch.
- The board renders the whole day as more than 1,300 rows (one per codeshare), has no timestamp, and takes "Today"
  from the visitor's device clock.
- No visible keyboard focus, no `main` landmark, 1,314 airline logos without alt text, unlabelled inputs, no
  accessibility statement.
- No saved flights, alerts, account or chatbot on the website (a tag-injected widget cannot be ruled out); ancillaries
  are booked on partner sites; site search took 24 seconds for "London" here.

**What MAHB should beat, and how.** Hamad's flight page is the bar for MAHB's. Beat it by doing the same at a small
fraction of the weight, with an update time, airport-local dates, codeshares grouped under the operating flight, and
alerts.

Screenshots: [`hamad-home-desktop.jpg`](../research/screenshots/hamad-home-desktop.jpg),
[`hamad-home-mobile.jpg`](../research/screenshots/hamad-home-mobile.jpg),
[`hamad-flights-desktop.jpg`](../research/screenshots/hamad-flights-desktop.jpg),
[`hamad-flights-mobile.jpg`](../research/screenshots/hamad-flights-mobile.jpg),
[`hamad-flightdetail-desktop.jpg`](../research/screenshots/hamad-flightdetail-desktop.jpg),
[`hamad-search-desktop.jpg`](../research/screenshots/hamad-search-desktop.jpg).

### 4.11 Munich: 66.5%, high confidence

Source: [`munich.md`](../research/benchmarks/munich.md), [`munich.json`](../research/benchmarks/munich.json). Direct.

**Positioning.** A calm, well-organised content site with a distinctive brand and a genuinely useful flight module,
including login-free tracking. The lowest automated accessibility score in the set (47) despite a published
accessibility declaration, and the thinnest commerce.

**Strengths** [direct].
- "Track flight" pins a flight to a strip under the header on every page, stored in the browser, no login.
- Inline flight search on the homepage with airport, airline and flight-number autocomplete and a four-week schedule;
  a freshness control ("Just updated - Last update 0 min. ago").
- A flight detail page joining gate, check-in area, weather at both ends, airline contact and aircraft facts.
- Site search with typeahead and flight-intent routing; "prayer room" returns the right four facilities first.
- Accessible-travel content of operational depth, promoted as a homepage quick link, and a published declaration.

**Weaknesses** [direct; direct, lab].
- 10 to 13 axe violations per page (4 to 6 critical), Lighthouse accessibility 47, pinch zoom disabled, no skip link
  that receives focus, focus outline removed on 10 of 12 stops, airline logos without alt text.
- Status as plain lower-case text; no alerts beyond the on-page strip; no live waiting times.
- The map depends on cookie consent and a second domain, with no fallback.
- English and German only; commerce stops at parking.

**What MAHB should beat, and how.** Keep the login-free tracking strip, add opt-in alerts and a colour, icon and text
status vocabulary, and make accessibility a release gate rather than a declaration.

Screenshots: [`munich-home-desktop.jpg`](../research/screenshots/munich-home-desktop.jpg),
[`munich-home-mobile.jpg`](../research/screenshots/munich-home-mobile.jpg),
[`munich-flights-departures-desktop.jpg`](../research/screenshots/munich-flights-departures-desktop.jpg),
[`munich-flightdetail-desktop.jpg`](../research/screenshots/munich-flightdetail-desktop.jpg),
[`munich-departures-mobile.jpg`](../research/screenshots/munich-departures-mobile.jpg),
[`munich-menu-mobile.jpg`](../research/screenshots/munich-menu-mobile.jpg).

---

## 5. Patterns across the field

What the best do that the others do not [assessment, built on the evidence in section 4]:

1. **They organise around the flight, not the organisation chart.** Hamad, Haneda, Incheon, Istanbul and Heathrow give
   each flight a web detail view with journey help (a timeline, a route to the gate, wait times or a connections
   planner); Dubai's flight page carries a journey planner; Schiphol has per-flight URLs [search]; Munich's detail page
   has flight facts but no journey help. Hong Kong, Changi's website
   and MAHB do not. No benchmark combines a permanent page, a live timeline, queue times and alerts without an app.
2. **They are candid about operations.** Istanbul, Heathrow and Incheon publish queue times; Hamad shows crowd levels;
   Haneda has a timestamped congestion panel; Incheon forecasts two days ahead and shows live car-park availability.
   Munich, Changi's website and Dubai showed none at the level of evidence available.
3. **They let people keep a flight without signing up**, but rarely follow through. Hong Kong (bookmarks), Munich
   (tracking strip) and Istanbul (WhatsApp) need no account; only Istanbul was seen sending updates. Changi, Haneda, Hong
   Kong, Heathrow and Incheon put alerts in an app or behind a login; Schiphol offers text-message updates according to
   an older blog post [search].
4. **Their search finds things, not pages.** Hamad returns facility records and live flights; Incheon answers with
   facility hours and locations; Munich routes flight numbers and finds prayer rooms; Hong Kong suggests flights as you
   type. MAHB has no site-wide search that this project could find.
5. **The best show how fresh their data is.** Hong Kong, Munich, Incheon and Haneda stamp their flight lists; Hamad and
   Istanbul's boards carry no stamp, and Hamad and Incheon take dates or clocks from the visitor's device.
6. **Commerce leaders tie services to one account.** Heathrow and Changi connect parking, Fast Track, retail and
   loyalty; Hamad, Dubai, Haneda, Incheon and Schiphol hand off to partner domains with separate checkouts.
7. **They share the same failures, which is MAHB's opening.** Weight (Changi 21.0 MiB, Haneda 13.2 MiB, Hamad's video);
   technical accessibility (zoom disabled at four sites, no `main` landmark on four benchmark homepages, statements
   found at only three); dependence on third-party hosts for maps, search and chat with no fallback; two languages at
   Dubai, Hamad, Munich and Schiphol, and none of Heathrow's eight is Malay.
8. **Graceful failure is almost absent.** Changi's "Unable to load / Try again" is the best behaviour seen; no site
   showed last-known data with its age when a feed failed.
9. **None is a network.** Every benchmark presents one airport (Dubai Airports runs DXB and DWC on separate hosts and
   registrations [search]). MAHB's 39 airports, from KLIA to rural STOLports, are a structural difference no benchmark
   can copy quickly.

---

## 6. The critical question: what would it take for MAHB to outperform every benchmark?

### 6.1 The answer in brief

Imitating each benchmark's strongest feature would, at best, produce the best-of-field composite of 83.0%: Hamad's
flight page, Istanbul's alerts, Heathrow's commerce and Hong Kong's board, each with its own trade-offs. That is not
outperformance; it repeats the field's pattern of strength on one axis and gating or weight on another. Outperforming
every benchmark takes four things [assessment]:

1. **Integrate what the field splits.** One login-free flight object that carries the timeline, live waits, transport,
   assistance needs, services and alerts, for departing, arriving, transferring and meeting.
2. **Compete where the benchmarks structurally cannot.** A network of 39 airports in one model; two languages that
   cannot drift because each fact is stored once; provenance and freshness on every answer; resilience on airport
   Wi-Fi, roaming and mid-range phones.
3. **Refuse the common failures as release gates**, not aspirations: weight, accessibility basics, silent failure,
   third-party dependency, device-clock dates, content drift.
4. **Prove it the same way.** Re-score the new product with this rubric by an assessor who did not build it, alongside
   Lighthouse and axe in CI and moderated usability tests in both languages.

### 6.2 Target profile

A target, not a forecast [assessment]. It aims to lead outright on the dimensions passengers feel most, match the
leaders on content, brand and AI, and accept being behind on commerce until partner agreements exist.

| Dimension | Best benchmark (calibrated) | MAHB today | Target | Verified by |
|---|---|---|---|---|
| ui | 4.0 (Hamad, Haneda, Changi, Dubai, Schiphol) | 2.5 | 4.5 | Independent design review against the direction document; first-screen tests |
| ux | 4.0 (seven sites) | 2.0 | 4.5 | Moderated tests: 90% unaided completion of the top eight tasks |
| info | 4.5 (Hong Kong, Incheon) | 2.0 | 4.5 at launch, 5.0 with MAHB data | Content tests: 100% of facts sourced and dated; 39 airports listed |
| flight | 4.5 (six sites) | 2.5 | 5.0 | Requirements BR-01 to BR-05 accepted; usability tests |
| mobile | 4.0 (Heathrow, Changi, Schiphol) | 2.0 | 4.5 | Field Core Web Vitals; 44 px targets; zoom enabled |
| nav | 4.0 (Hong Kong) | 2.0 | 4.5 | Zero axe violations; keyboard-only journeys; search test set |
| ai | 4.0 (Heathrow, Istanbul) | 2.0 | 4.0 | Concierge evaluation set; personalisation without an account |
| commerce | 4.5 (Heathrow, Changi) | 2.5 | 4.0 | Partner-dependent; one basket for parking and Fast Track |
| perf | 3.5 (Dubai) | 1.5 | 5.0 | Weight budgets in CI; last-known data under feed failure; no third-party requests |
| **Weighted** | 79.0% (best single site); 83.0% (composite) | 42.5% | **90.5%** | |

### 6.3 Product requirements

Priority: **Must** for launch, **Should** for launch or the first release after it, **Could** later or
partner-dependent. "Gap" names the benchmark evidence the requirement answers. Targets marked [assessment] are this
report's proposals, aligned with section 7 of the product strategy.

| ID | Requirement | Benchmark gap it closes | Priority | Acceptance criterion |
|---|---|---|---|---|
| BR-01 | One flight search, on every page, accepting flight number, airline, city or airport code, across both KLIA terminals and every MAHB airport; the result states the terminal. | MAHB's terminal-first, departures-only widget; Hong Kong, Changi, Dubai and Heathrow offer one field but for one airport. | Must | For 20 test flights split across Terminals 1 and 2 and two regional airports, the right flight and terminal appear within two interactions from any page, with no terminal chosen beforehand. |
| BR-02 | A permanent, indexable page per operating flight; codeshare numbers resolve to it; boards show one row per operating flight with all numbers searchable. | Hong Kong has no detail URL; Hamad (1,300+ rows) and Incheon list codeshares as rows; MAHB has no flight page. | Must | Every flight in the feed has a stable URL valid for its operating day; each codeshare number redirects to it; a board test finds no duplicate rows for one operating flight. |
| BR-03 | A journey timeline on the flight page (leave-by, transport, check-in row, security, immigration, gate) with walking times and current queue times where data exists, and departing, arriving, transfer and greeter views. | Hamad (timeline and queues), Haneda (Sample Plan) and Incheon (route to gate) each do part; none offers a greeter view; Heathrow's collector split sits inside detail only. | Must | For a test departure the timeline shows at least six steps, each with a time or a stated "Not published"; switching view changes the steps; every value shows its source. |
| BR-04 | Follow a flight without an account; opt-in alerts by web push and e-mail, and by WhatsApp subject to a partner agreement; a share link for whoever is collecting. | Only Istanbul alerts without an app or account; Munich's strip has no alerts; Changi, Haneda, Hong Kong, Heathrow and Incheon gate alerts behind an app or account. | Must (web push, e-mail); Should (WhatsApp) | Follow and opt-in take no more than three interactions with no account; in staging, a simulated gate change reaches each channel within 60 seconds [assessment]. |
| BR-05 | Freshness and failure states for all live data: "Updated hh:mm" in airport-local time; on feed failure, last-known values with their age and a retry; dates computed in airport time. | Hamad (no stamp, visitor-clock "Today"), Incheon (device clock), Heathrow (error, no last-known data), MAHB ("Loading..." indefinitely). | Must | With the flight API stubbed to fail, every flight surface shows last-known data and its age within 2 seconds and no spinner lasts more than 10 seconds; with the device clock set to UTC-10, "today" still follows Malaysia time. |
| BR-06 | Guidance pages server-rendered and complete with JavaScript disabled and with the content API unavailable. | MAHB's blank pages under its API block; Heathrow's client-only board; maps and search at six benchmarks fail with their third-party host. | Must | With scripts off and the API blocked, all guidance, transport, parking and contact pages render their full text; an automated crawl checks every route. |
| BR-07 | Weight and speed budgets enforced in CI: homepages 1,000 KB or less transferred, guidance pages 500 KB or less, 40 requests or fewer; field LCP 2.5 s, INP 200 ms, CLS 0.1 or better at the 75th percentile. | MAHB 32.7 MiB and CLS 0.621; Changi 21.0 MiB; Haneda 13.2 MiB; the lightest valid benchmark, Heathrow, is 1.8 MiB. | Must | The CI budget check fails the build on any breach; Lighthouse lab median on the homepage below 1,000 KB and CLS under 0.1; field data meets the thresholds three months after launch. |
| BR-08 | A live operational status layer: Aerotrain, the Terminal 1 to Terminal 2 link, shuttles, baggage reclaim, immigration disruption, rail and car-park occupancy, each with a time and a source, shown on affected pages. | Haneda's congestion panel, Incheon's car-park availability and Istanbul's waits; MAHB's 2025-2026 pain is operational and it has no status component [search; hypothesis]. | Must (framework); data feeds depend on MAHB | Each status item shows state, time and source; a fixture marking the Aerotrain closed raises a notice on the KLIA homepage, the transfer planner and affected flight pages. |
| BR-09 | Checkpoint queue times with a trend and a short forecast, converted into advice ("arrive by 07:10"). | Istanbul shows current minutes only; Incheon's forecast is separate from the flight; Heathrow publishes estimates. | Should (needs MAHB queue data) | Where data exists, each checkpoint shows current time, trend and the next two hours; the flight timeline's leave-by time moves when the forecast changes. |
| BR-10 | Price-first parking: the total for a typed stay for each product before any description, a calculator on the same rate source as the barrier, a warning before long stays in premium products, dated rate changes. | MAHB shows no prices and passengers were surprised by bills [direct; search]; Dubai's tariff page, the best seen, has no calculator or warning. | Must (needs MAHB tariff data) | The three-day total for each product is visible without scrolling; calculator results equal the tariff for ten test durations; the warning appears above a set stay length. |
| BR-11 | A to-and-from-the-airport comparison: rail, bus, official taxi and e-hailing with time, dated fare, pick-up point and an anti-touting message; scheduled fare changes take effect on their date. | Changi describes transport mode by mode; Schiphol hands off to external planners; no benchmark ties transport to a flight's leave-by time. | Must | KLIA to KL Sentral shows at least four modes on one screen; every fare carries its effective date; on 1 January 2027 the KLIA Ekspres fare shown changes from RM55 to RM65 without a code release [search for the fare change]. |
| BR-12 | Facilities as structured data (prayer rooms, toilets, baby care, clinics, halal food) with level, zone, airside or landside, hours and "nearest to gate". | Hamad (separate male and female prayer-room records), Haneda and Istanbul (dietary filters), Munich (search); MAHB has two facilities pages and no locations [direct; search]. | Must | Searching "prayer room" returns facility records first with location and hours at every airport where published; "nearest to gate C12" sorts by walking distance. |
| BR-13 | A first-party, accessible map with a text list fallback, step-free routes and walking times, and a "show on map" link from every facility and flight step. | Maps blank at six benchmarks when their host failed; Changi's sensory map is a PDF; Hong Kong deep-links but needs its map host. | Should (list fallback: Must) | With the map engine unavailable, a list of locations and routes renders; a step-free route exists from check-in to every gate at KLIA. |
| BR-14 | One network model: all 39 airports, KLIA as one airport with two terminals, one canonical URL per topic, 301 redirects from every legacy path. | MAHB's six cloned trees covering 5 airports and 48 duplicate addresses; benchmarks are single hubs. | Must | A crawl finds 39 airport entries, no duplicate topic URLs within an airport, and a 301 to a live canonical page for each of the 276 legacy sitemap URLs. |
| BR-15 | Provenance: every changeable fact (price, fare, hours, phone number) stored once with its source and last-checked date, shared by all languages and shown on the page. | Changi (S$10 against S$50), Heathrow (2024 notice live in 2026), Schiphol (superseded prices), MAHB (two general phone numbers). | Must | The build fails on any fact without a source and date; the same fact renders identically in English and Bahasa Malaysia; items past their review date are under 2%. |
| BR-16 | English and Bahasa Malaysia at parity from launch, with a visible notice where content falls back; Simplified Chinese next for the core journeys. | MAHB English only; Dubai, Hamad, Munich and Schiphol two languages; Heathrow's eight exclude Malay. | Must (EN, BM); Should (ZH) | 100% of interface strings in both languages; every core journey page available in both; fallback notices shown where a translation is missing. |
| BR-17 | Accessibility as a release gate: WCAG 2.2 AA; zero axe violations on every template; skip link, visible focus, `main` landmark, zoom enabled, 44 px touch targets; a dated accessibility statement. | Zoom disabled at four benchmarks; no visible focus at Hamad and Istanbul; Munich at 47; statements found only at three sites; MAHB 6 rules failing. | Must | axe in CI on every route and theme reports zero violations; keyboard-only completion of the eight critical journeys; statement published with audit date. |
| BR-18 | An assistance hub at the top level (hidden disabilities, wheelchair, sensory needs), with a request channel and lead time; needs chosen once are remembered on the device and change the flight timeline. | Hamad has no request channel; Istanbul's needs filter is per flight; MAHB files the Butterfly Effect under "Booking Services". | Must | Assistance is one interaction from any page; selecting "step-free" adds step-free steps to every flight timeline without an account. |
| BR-19 | One site search for flights, facilities, services and pages, returning entities (a flight card, a facility with location and hours) before pages. | Hamad, Incheon and Munich do this well; Hamad's search took 24 seconds here; MAHB has no site search. | Must | On a 30-query test set (flight numbers, "prayer room", "parking rate", "KL Sentral", "lost and found", Malay synonyms) the correct result is first in at least 90% of queries; results return in under 1 second at the 75th percentile. |
| BR-20 | A concierge that answers only from the content layer and flight data, cites its source, knows the followed flight, states human hours and escalates; it works in a deterministic mode with no AI service. | Heathrow's Hallie (English, some pages); Changi's assistants split by topic; Dubai's evidenced only by its vendor; Hong Kong and Istanbul chat not observable. | Should | On an evaluation set of 100 questions in both languages, 100% of answers cite a source page, and questions outside the content layer return an escalation, not an invented answer. |
| BR-21 | Services offered in context with one basket: Fast Track, parking, lounges and day rooms from the flight page, without a hand-off to a separate domain where avoidable. | Heathrow and Changi lead; Hamad, Dubai, Haneda and Schiphol hand off; MAHB sells Fast Track on another domain. | Could (partner-dependent) | From a flight page, parking and Fast Track can be bought in one basket with one payment; no offer appears above the primary answer on a task page. |
| BR-22 | A self-transfer planner for KLIA Terminal 1 to Terminal 2 and for domestic connections across the network, with a verdict, steps, sources and a "what if it is tight" answer. | Heathrow's planner excludes self-connecting passengers; Dubai offers procedure text; network connections are unique to MAHB. | Must | Given two flights, the planner returns comfortable, tight or not advised, with steps, sources and minimum times, for KLIA terminal pairs and KUL to domestic airports. |
| BR-23 | An arrivals and greeter view: arrival hall, belt, meeting point, the best time to arrive for the greeter, and parking or pick-up for collectors, shareable from the flight page. | Heathrow's collector split sits inside flight details; Schiphol's landing-to-exit prediction is app and blog content [search]. | Should | From any arriving flight's page, the greeter view shows hall, belt, meeting point and a recommended arrival time, and can be shared as a link. |
| BR-24 | No third-party requests at runtime; Content-Security-Policy and HSTS; rate limiting that serves cached content rather than a blank page. | Istanbul loads nine marketing hosts; Hamad, Hong Kong and Istanbul send no CSP; Incheon no security headers; MAHB's firewall left blank pages. | Must | A production page load records zero third-party requests; header checks pass (CSP without `unsafe-inline` or `unsafe-eval`); under a simulated rate limit pages still render cached content. |
| BR-25 | A documented, versioned open flight data feed for partners, with a dated changelog. | Schiphol's public Flight API and developer portal [search]; no other benchmark evidenced one. | Could | A published specification with version number, changelog and a sandbox; partner integrations use it instead of scraping. |

### 6.4 Design principles

1. **The flight is the front door.** Organise around the passenger's flight and stage of journey, not the
   organisation chart; every page knows which flight it serves when the visitor has chosen one.
2. **Open web first; the app is an upgrade, not a gate.** Nothing the web can do sits behind an install or a login.
3. **Answer before asking.** The first screen answers the top task with a number, a time or an action, not prose or a
   promotion.
4. **Show the source and the time.** Every fact says where it came from and when it was checked; every live value says
   when it was updated.
5. **Fail visibly and usefully.** Last-known data with its age, a plain explanation and a retry; never a blank page, a
   spinner without end or a wrong value such as "0 °C".
6. **Light enough for roaming and airport Wi-Fi.** Budgets are design constraints from the first sketch: no video
   heroes, no carousels, no third-party scripts.
7. **One network, one model, one address.** Every airport is a first-class entry at the depth its content supports;
   every topic has one URL; terminals are filters, not separate sites.
8. **Accessible and bilingual by construction.** Keyboard, screen reader, zoom, contrast and Bahasa Malaysia are tested
   on every build, not audited after launch.
9. **Commerce after the answer, in context.** Offers appear where they help the journey (Fast Track on a busy
   departure, parking on a "leave by" plan), never above the answer.
10. **Calm, precise and distinctly Malaysian.** Quiet layouts, editorial type used sparingly and nothing that moves on
    its own; halal and prayer facilities treated as core data; the whole network from KLIA to the rural STOLports.

---

## 7. Calibration log

The ten benchmark reports were written by different analysts in different sessions with different access. Each score
was read against its own evidence and confidence and compared with the same dimension at the other airports. Changes
follow the rules in section 1.2. The full log, with evidence paths, is in
[`matrix.json`](../research/benchmarks/matrix.json) under `calibration_log`.

### 7.1 Changes

| ID | Airport | Dim. | Score | Confidence | Rule | Reason |
|---|---|---|---|---|---|---|
| C01 | Schiphol | flight | 5.0 to 4.5 | medium | R1, R3 | The only 5 in the set rested on search; the itinerary with walking time, security wait and alerts is an app feature. Per-flight web pages and bookable slots justify the top of the observed range. |
| C02 | Changi | commerce | 5.0 to 4.5 | high to medium | R1, R2 | Well documented by official pages found by search, but no checkout observed; level with Heathrow. |
| C03 | Schiphol | ux | 4.5 to 4.0 | medium | R3 | Not task-timed; homepage composition is prior knowledge. The highest observed UX score is 4.0. |
| C04 | Schiphol | mobile | 4.5 to 4.0 | medium to low | R2, R3 | Rested on app ratings; "mobile web not observed". Aligned with Heathrow, whose mobile web was rendered. |
| C05 | Changi | flight | 4.5 to 4.0 | medium | R3, R4 | Only a searchable listing is evidenced on the web, and it did not render in either project capture; saving, alerts, tracking and FlightSaver are app features. Every other 4.5 has an observed per-flight web page with journey help. |
| C06 | Changi | mobile | 4.5 to 4.0 | medium | R3, R4 | Rested on the app rating; mobile web not assessed. Lab: 21.0 MiB, performance 58, accessibility 74. Cannot sit above Heathrow. |
| C07 | Changi | nav | 3.5 to 3.0 | low to medium | R4 | Captures found no skip link, no `main` landmark and images without alt text; accessibility 74 with seven failing audits; plus the report's own negatives. Matches Istanbul, Hamad and Munich. |
| C08 | Haneda | mobile | 4.0 to 3.5 | medium | R4 | Report evidence: about 17 MB mobile homepage, a third of targets under 24 px, alerts behind member login; lab LCP 24.5 s. Heathrow at 4.0 loads 1.8 MiB; Hong Kong and Istanbul hold 3.5. |
| C09 | Changi | ai | 4.0 to 3.5 | medium to low | R2, R3 | Account-based rewards, app saved flights and a 2020 task chatbot; no generative or flight-aware assistant found. Below Heathrow and Istanbul (4.0). The analyst noted the AI search could not run; confirmed current capability would restore 4.0. |
| C10 | Changi | perf | none to 3.0 | low | R4 | Left unscored for lack of evidence; now measured: performance 58, LCP 7.9 s, TBT 379 ms, CLS 0.077, 21.0 MiB. Comparable with Heathrow, Haneda and Istanbul. |
| C11 | Hong Kong | flight | 4.5 to 4.0 | high | R3 | Deepest board in the set, but no flight detail URL, no web alerts and no walking or queue context; every other 4.5 adds a per-flight page with journey help. Still above Munich (3.5). |
| C12 | Changi | ui | 4.0 unchanged | low to medium | R4 | Prior-only score confirmed by project screenshots. |
| C13 | Dubai | ui | 3.5 to 4.0 | low to medium | R4, R5 | Screenshots show a coherent system, a task-first hero with flight search and a full Arabic build; deduction kept for the modal cookie dialogue. |
| C14 | Dubai | ux | 3.0 to 3.5 | low to medium | R4, R5 | Flight search in the first view, working site search, a one-tap contact launcher; partner hand-offs remain. Level with Hamad and Munich. |
| C15 | Dubai | flight | 3.5 to 4.0 | low to medium | R4, R5 | Board with scheduled and actual times, terminal, gate, status and date selector; a per-flight journey planner. No update stamp seen; no saved flights or alerts evidenced. |
| C16 | Dubai | mobile | 3.5 unchanged | low to medium | R4 | Confirmed by the lab (performance 68, accessibility 100, CLS 0); held by the cookie dialogue and the absence of an official app. |
| C17 | Dubai | nav | 3.0 to 3.5 | low to medium | R4, R5 | The report found no site search; a capture shows one returning the right page first. Two languages and no statement found remain. |
| C18 | Dubai | ai | 2.5 to 3.0 | low | R4, R5 | Chat launcher on every captured page, live chat in the contact launcher, a flight-page planner personalised by traveller type. Chat not exercised. |
| C19 | Dubai | perf | 3.0 to 3.5 | low to medium | R4, R5 | Best valid lab result in the set (performance 68, TBT 26 ms, CLS 0); offsets on headers and indexed development hosts kept. |
| M01 | MAHB | all | new | | R1, R2, R4 | MAHB scored for the first time on the same rubric from the audit (section 4.1). |

### 7.2 Checked and left unchanged

| ID | Airport | Dim. | Why unchanged |
|---|---|---|---|
| K01 | Munich | flight 3.5 | Detail page, tracking strip and freshness stamp, but no status styling, alerts, waits or timeline; correctly below Hong Kong and Dubai (4.0). |
| K02 | Schiphol | ui 4.0 | Prior knowledge and the app only; no evidence to move it either way. Kept at low confidence and listed as a gap. |
| K03 | Schiphol | perf 3.0 | No speed data (the lab measured a challenge page). Kept as a low-confidence neutral score supported by search evidence on incident handling. |
| K04 | Istanbul | ai 4.0 | Login-free WhatsApp updates and a needs-tailored journey directory observed on the web; level with Heathrow. |
| K05 | Hong Kong | perf 3.0 | Similar Lighthouse score to Incheon (28 against 27) but LCP 8.9 s against 25.1 s and transport security headers present. |
| K06 | Heathrow | flight 4.5 | Features evidenced from page source and configuration rather than seen running; kept at medium confidence. |

### 7.3 Effect on totals

| Airport | Original report | Calibrated | Change |
|---|---|---|---|
| Heathrow | 79.0% | 79.0% | 0 |
| Haneda | 78.5% | 77.5% | -1.0 |
| Schiphol | 81.5% | 77.0% | -4.5 |
| Istanbul | 76.5% | 76.5% | 0 |
| Changi | 82.6% of the 95% of weight scored (performance unscored) | 76.5% (all nine dimensions) | not comparable |
| Hong Kong | 77.0% | 75.5% | -1.5 |
| Incheon | 74.5% | 74.5% | 0 |
| Dubai | 64.0% | 71.0% | +7.0 |
| Hamad | 69.0% | 69.0% | 0 |
| Munich | 66.5% | 66.5% | 0 |
| MAHB | not scored | 42.5% | new |

The direction of the changes is consistent: search-led scores that sat above observed peers came down (Schiphol,
Changi), and a search-led score that sat below the evidence now held by this project went up (Dubai). Direct
assessments changed only where one airport's score was out of line with the same evidence elsewhere (Haneda mobile,
Hong Kong flight).

---

## 8. Sources

### Project files

- Benchmark reports: [`changi.md`](../research/benchmarks/changi.md), [`dubai.md`](../research/benchmarks/dubai.md),
  [`hamad.md`](../research/benchmarks/hamad.md), [`haneda.md`](../research/benchmarks/haneda.md),
  [`heathrow.md`](../research/benchmarks/heathrow.md), [`hkia.md`](../research/benchmarks/hkia.md),
  [`incheon.md`](../research/benchmarks/incheon.md), [`istanbul.md`](../research/benchmarks/istanbul.md),
  [`munich.md`](../research/benchmarks/munich.md), [`schiphol.md`](../research/benchmarks/schiphol.md), and their
  `.json` companions where they exist.
- Calibrated matrix: [`matrix.json`](../research/benchmarks/matrix.json).
- Lab measurements: [`../research/direct/lighthouse/README.md`](../research/direct/lighthouse/README.md) and the
  per-site JSON files in the same folder.
- Capture timings: [`changi-timings.json`](../research/screenshots/changi-timings.json),
  [`dubai-timings.json`](../research/screenshots/dubai-timings.json),
  [`heathrow-timings.json`](../research/screenshots/heathrow-timings.json),
  [`munich-timings.json`](../research/screenshots/munich-timings.json).
- Screenshots: [`../research/screenshots/`](../research/screenshots/) (files linked in section 4).
- MAHB: [`mahb-audit.md`](../research/audit/mahb-audit.md),
  [`firsthand-observations.md`](../research/audit/firsthand-observations.md),
  [`../research/direct/mahb-sitemap-urls-2026-11-16.txt`](../research/direct/mahb-sitemap-urls-2026-11-16.txt).
- Strategy: [`product-strategy.md`](product-strategy.md) (differentiators, principles and metrics that this report's
  requirements align with).

### External pages cited (as recorded in the source reports; [direct] where an analyst opened them, otherwise [search])

- Heathrow: https://www.heathrow.com/departures ; https://www.heathrow.com/connecting-flights ;
  https://www.heathrow.com/transport-and-directions/heathrow-parking [direct];
  https://www.salesforce.com/uk/news/press-releases/2025/06/11/heathrow-airport-agentforce-passenger-experience/ [search].
- Haneda: https://tokyo-haneda.com/en/ ;
  https://tokyo-haneda.com/en/flight/detail/int_departure.html?searchDt=20261117&flightNumber=JL43 [direct].
- Schiphol: https://www.schiphol.nl/en/departures/MS758/ ; https://www.schiphol.nl/en/timeslots/ ;
  https://www.schiphol.nl/en/from-to-schiphol/ ; https://www.schiphol.nl/en/contact-schiphol/ [search].
- Istanbul: https://www.istairport.com/en#waitingpoints ;
  https://www.istairport.com/en/flights/airport-guides/transfer-passenger-guide [direct].
- Changi: https://www.changiairport.com/en/help/changi-app/flight-saver-assurance.html ;
  https://www.ishopchangi.com/en/pages/how-to-shop ;
  https://www.changiairport.com/en/rewards/members-special/parking-benefits.html [search];
  https://www.changiairport.com/en/fly/flight-information/departures.html [direct, capture].
- Hong Kong: https://www.hongkongairport.com/en/flights/departures/passenger.page ;
  https://www.hongkongairport.com/en/passenger-guide/airport-facilities-services/special-needs-access [direct].
- Incheon: https://www.airport.kr/ap_en/1396/subview.do ; https://www.airport.kr/ap_en/1410/subview.do ;
  https://www.airport.kr/ap_en/6654/subview.do [direct].
- Dubai: https://dubaiairports.ae/flight-status [direct, capture; search];
  https://gulfnews.com/uae/dubai-airport-launches-instant-smart-gates-eligibility-check-for-travellers-1.500618859 ;
  https://dubaiairports.ae/information/transfers [search].
- Hamad: https://dohahamadairport.com/ ; https://dohahamadairport.com/airlines/flight-details/223809456 [direct].
- Munich: https://www.munich-airport.com/all-departures-1450598 ; https://www.munich-airport.com/search-results-75585 ;
  https://www.munich-airport.com/accessible-travel-260945 [direct].
- MAHB: https://airports.malaysiaairports.com.my/en/klia1 [direct];
  https://www.futuretravelexperience.com/2026/05/how-malaysia-airports-is-blending-digital-innovation-curated-retail-and-personalised-passenger-engagement/ ;
  https://www.nst.com.my/amp/business/corporate/2026/08/1520652/mahb-reviews-duty-free-concession-model-its-airports [search].

No new web searches were made for this report. Web content was treated as data; no instruction found in any page was
followed.
