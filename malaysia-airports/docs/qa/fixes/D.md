# Fix log: package D (content, copy, guides, help and corporate)

Engineer: package D, fix round of 21 November 2026. The interrupted first attempt changed no package D
file (see `_interrupted-attempt.md`), so everything below is from this round.

## Summary

| ID | Priority | Status | Main files |
|---|---|---|---|
| D-01 | P0 | Fixed | `types.ts` (source policy, `validateContent`), `sources.ts`, `corporate.ts`, `airports/*.ts`, `faqs.ts`, `guides.ts`, `airports.ts`, `content.test.ts` |
| D-02 | P0 | Partially fixed: the record is published and search, the concierge and the timeline already use it; the KLIA overview (A) and the legacy redirect (E) are hand-offs. Price, hours, checkpoints and seller **need MAHB or partner data** | `airports/kul.ts`, `content.test.ts` |
| D-03 | P0 | Fixed (English titles of English publications stay, as agreed: A-24) | `source-notes.ts` (new), `types.ts`, `sources.ts`, `corporate.ts`, `airports/*.ts`; **cross-package**: `source-note.tsx` (A), `airline-facts.tsx`, `engine.ts`, `demo-routes.ts` (B), `transport-values.tsx` (C) |
| D-04 | P0 | Partially fixed: the hub lists every missing fact once with the request channels, and the live-chat hours are marked "not published". Assistance rules for AirAsia, AirAsia X, Batik Air and the top international carriers **need airline data** (their sites cannot be reached from this environment). The airport's own facts are OOS-07 | `airports/kul.ts`, `accessibility-data.server.ts`, `accessibility/page.tsx`, `features/guides.ts` |
| D-05 | P0 | Partially fixed: the content side is done (dated and corrected, a test proves it, off every journey step, one place per airport). C still shows the full block on its section pages (hand-off) | `airports/_helpers.ts`, `airports/*.ts`, `types.ts`, `about-this-prototype/page.tsx`, `content.test.ts` |
| D-06 | P0 | Fixed for this round. MAHB-owned sources and brand, legal and native review remain OOS-08 and OOS-14 | `airports/kul.ts`, `types.ts`, `features/corporate.ts`, `content.test.ts` |
| D-07 | P0 | Partially fixed: an honest departing note for Malaysian citizens is in the guides, the timeline and the concierge. It **needs the Immigration Department's own wording** (its site cannot be reached from this environment) | `airports/kul.ts`, `sources.ts`, `guide-meta.ts`, `guide-views.server.ts` |
| D-08 | P1 | Partially fixed: the title and the accessible alternative are done and the clock tests pass. Transit route steps that read the notice are C's (hand-off) | `airports/kul.ts`, `content.test.ts` |
| D-09 | P1 | Partially fixed: names, cities and states in both languages and `localizeAirport()`, used on D's pages. Airport headers, overviews and switchers are A's, section titles C's and demo destinations B's (hand-offs). A native editor must confirm the names (OOS-14) | `types.ts`, `airports.ts`, D's pages |
| D-10 | P1 | Fixed (no C change was needed) | `airports/kul.ts`, `content.test.ts` |
| D-11 | P1 | Fixed | `accessibility/page.tsx`, `accessibility-data.server.ts` |
| D-12 | P1 | Fixed | `types.ts`, all source registries, `faqs.ts`, `content.test.ts`; **cross-package**: `facility-values.tsx` (C) |
| D-13 | P1 | Partially fixed: both records exist and the transit planner reads its assumptions from them. The home "be at the airport by" line is A's (hand-off) | `planning-rules.ts` (new), `index.ts`; **cross-package**: `transit-logic.ts` (C) |
| D-14 | P1 | Fixed | `guides.ts` |
| D-15 | P1 | Fixed on Help. The same row in the phone menu is A's (hand-off) | `contact-list.tsx`, `help/page.tsx`, `features/guides.ts` |
| D-16 | P2 | Not fixed: out of scope, **needs MAHB data** (OOS-06) | none |
| D-17 | P2 | Not fixed: out of scope, **needs verified MAHB commercial and media sales channels** (OOS-09) | none |

Fixed 8, partially fixed 7, not fixed 2.

Hand-offs to D taken from other packages' logs:
- B-11: `NeedsControl` now renders on `/accessibility`.
- B-08, B-13 and B-17: the Fast Track and departing-immigration records are published. The pick-up notes still need MAHB data.
- C-01: `validateContent` now checks that every `reportedDailyMax[].source` is one of the car park's own sources.
- C-08: the KLIA map places are not done (see the open hand-offs).

## Cross-package changes

Each change is the smallest edit that makes the new content model render, made where the owner's own
hand-off asked for it or where my change would otherwise have broken the build.

- **`src/components/common/source-note.tsx` (A)**. It now reads `sourceTitle`, `sourcePublisher`,
  `sourceTitleIsForeign`, `sourcePublisherIsForeign`, `formatAsOf`, `UNDATED_LABEL` and `pick` from
  `@/content/types`:
  - The prototype's own page title and publisher show in Malay. `lang="en"` and the "EN" marker apply
    only to text that really is English.
  - The new localised `note` (for example "Seperti diringkaskan dalam hasil carian") shows under the
    publisher line, and the `asOfNote` shows after the date.
  - An undated source says "Undated" / "Tiada tarikh". Before, it said nothing, or showed free English
    text.
- **`src/components/flights/airline-facts.tsx` (B)**. `checkIn` is now `LocalizedText`, so the component
  shows `pick(airline.checkIn, lang)`. It marks the text `lang="en"` only when no Malay version exists.
- **`src/lib/concierge/engine.ts` (B)**. Two check-in statements use `s.b.pick(fact.checkIn)`, and set
  `fallback` only when the Malay text is missing.
- **`src/lib/providers/demo-routes.ts` (B)**. The demo template's `checkIn` string is wrapped as
  `{ en }`, so it type-checks against the new field.
- **`src/components/flights/needs-control.tsx` (B)**. The need chips get
  `className="h-auto min-h-9 max-w-full shrink py-1.5 text-left whitespace-normal touch:h-auto touch:min-h-11"`.
  Without it, "Travelling with someone who needs help" pushed the page 32 px sideways at 125% text on a
  390 px phone, both on `/accessibility` (B-11 hand-off) and on the flight page. B's "My needs" e2e test
  still passes.
- **`src/components/transport/transport-values.tsx` (C)**. `payment` is now `LocalizedText[]`, so the
  component shows `formatList(option.payment.map((method) => pick(method, lang)), lang)`.
- **`src/components/facilities/facility-values.tsx` (C)**. `AsOf` writes months and years in words
  through `formatAsOf`, with "As of". Before, it printed a bare "2023-10".
- **`src/components/guides/transit-logic.ts` (C)**. `ASSUMPTIONS = TRANSIT_ASSUMPTIONS.minutes`, read
  from `@/content/planning-rules` (D-13). The values are unchanged and C's 17 planner unit tests pass.
- **`tsconfig.json`**. My dev server added two `.next-D` include lines. I removed them again when I
  stopped it.
- I touched no shared dictionary (`en.ts`, `ms.ts`). All new copy is in `features/guides.ts` and
  `features/corporate.ts`, in both languages.

## Hand-offs still open

| To | What | Why |
|---|---|---|
| A | Show the Fast Track records (`kul-t1-fast-track`, `kul-t2-fast-track`) in the KLIA overview services area (`src/app/[lang]/[airport]/page.tsx`). | D-02 |
| A | Wrap the airport once with `localizeAirport(airport, lang)` (from `@/content`) where pages and the chrome print its name, city or state: `[airport]/page.tsx` (h1, place line, `<title>`), `airport-header.tsx`, `airport-directory.tsx` (list and state filter), `home-sections.tsx`, `airport-switcher.tsx`. | D-09: every Malay airport h1 and title is still English until then |
| A | The home "Be at the airport by" line should take its hours and its sentence from `ARRIVAL_TIME_RULE` (`@/content/planning-rules`), not from `en.ts`/`ms.ts` line 816. | D-13 |
| A | Add the "Call Malaysia Airports" row to the phone menu (`panels.tsx`). `CallRow` in `src/components/help/contact-list.tsx` takes `contactViews(lang, t)`. | D-15 |
| A | `SourceNote` was edited (see above). Keep the `note`, `asOfNote` and `undated` lines if it is reworked. | D-03 |
| B | `journeyExtras` takes the first Fast Track facility for any terminal. Pick the one for the flight's terminal (`kul-t1-fast-track`, `kul-t2-fast-track`). | D-02 |
| B | The new departing note `kul-departing-immigration-citizens` has `appliesTo.traveller: 'citizen'`. The timeline ignores this key, so every international departure sees it. Its title says who it is for. | D-07 |
| B | Localise demo destination city names in `src/lib/providers/demo-routes.ts` ("Singapore": "Singapura", "Penang": "Pulau Pinang"). | D-09 |
| C | Replace the full "What this prototype has not verified" block with a one-line link to `/about-this-prototype#gaps-<airport>`. It appears in `parking/page.tsx`, `facilities/page.tsx`, the transport, map and commerce views. Each still reads the note by id, so nothing breaks meanwhile. | D-05 |
| C | Transit steps that use the Aerotrain (`transit-data.server.ts`) should read in-effect KUL T1 notices, for example `kul-aerotrain-software-update-nov-2026`, and link to them. | D-08 |
| C | Optional: `AsOfText` (`fact-rows.tsx`) and `asOfLabel` (`transport-logic.ts`) can use `formatAsOf` for months and years. Records no longer carry free text or codes, so nothing renders wrongly today. | D-03 / D-12 |
| C | C-08 (taxi coupon counter, rail entrance and e-hailing pick-up as KLIA map places) was not done. Their positions are not sourced, and the existing boarding notes are third-party. | C-08 |
| E | Point `/en/klia1/air-travel/services/fast-track` and `/klia2/...` in `src/lib/seo/legacy-redirects.ts` at `/kul/facilities#kul-t1-fast-track` and `#kul-t2-fast-track`. | D-02 |
| MAHB / partners | Fast Track price, hours, checkpoints and seller. Assistance rules of AirAsia, AirAsia X, Batik Air and the top international carriers (request channel, lead time, wheelchair types). Located accessible toilets, lifts, buggy and wheelchair points, accessible bays and step-free status (OOS-07). The Immigration Department's wording on departure autogates for citizens and on assisted counters. Native review of the Malay names and copy (OOS-14). | D-02, D-04, D-07, D-09 |

## Findings

### D-01. "Official" on facts that rest on news, blogs, relays or the prototype (P0)

**Status:** fixed.

**What changed**

- `src/content/types.ts` gains a written source policy (a header comment), plus `AUTHORITATIVE_SOURCE_KINDS`, `SOCIAL_HOSTS`, `RELAY_HOSTS`, `sourceHost()`, `isSocialSource()` and `isAuthoritativeSource()`.
- `validateContent` now:
  - rejects `provenance: 'official'` on every record type unless at least one cited source is authoritative. That covers facilities, transport, car parks, notes, map points, levels, notices, guide steps (their own sources, or the guide's) and FAQs. A source is authoritative if its kind is `official`, `government` or `operator`, it has a public URL (not the prototype's own pages) and it is not a social post;
  - rejects an authoritative kind on a relay or advertorial host;
  - rejects a kind other than `other` for the prototype's own pages.
- Sources reclassified:
  - the five Routes relays (`corp-routes-*`) and `routesonline-calm-room-t2` are now `news`, publisher "Routes", note "Malaysia Airports release, republished by Routes";
  - the Edge advertorial is now `other`, with the note "Advertorial for Malaysia Airports";
  - the ANA guide is now `other`, with the note "Airline travel guide about the airport".
- Records retagged `estimated`:
  - the KLIA Ekspres option, the fare-rise notice and the Aerotrain closure notice;
  - the T2 Calm Room facility and its neurodivergent guide step, which rested on the Routes relay;
  - the KUL T1 L1 level (ANA and klia2.info);
  - the bus-lounge and Jungle Boardwalk map points (news; TikTok);
  - Penang e-hailing (the option and its note) and Penang Premium Parking (the car park and its note), which rested on an X post and Threads;
  - the Subang curfew and the Mavcom refund FAQ.
- The three FAQs about the prototype (`is-this-official`, `privacy-this-site`, `privacy-clear-data`) are now `suggestion`, as the policy says.
- Corporate `provenanceOf()` uses `isAuthoritativeSource`, so corporate facts follow the same rule.

**Verified**

- `content.test.ts`, "provenance and source policy":
  - Official on news only, on `prototype-method` only and on MAHB's own TikTok is rejected; Official on `mahb-klia-t1-parking` is accepted.
  - A relay registered as official is rejected.
  - Each of the audited records and the eight sources has its new tag or kind.
- `validateAllContent()` returns `[]`. Before the retagging, it listed 17 breaches.
- Concierge, run with the real knowledge at 21 Nov 10:00. "How much is the KLIA Ekspres?" and "Berapa tambang KLIA Ekspres?" now answer under **Estimated**, the same tag as the transport card, including the 28-minute journey time.

### D-02. Fast Track (P0)

**Status:** partially fixed. The content side is done and is already used by search, the concierge and the departing timeline. The KLIA overview (A) and the legacy redirect (E) are hand-offs.

**What changed**

- Source `mahb-booking-services-fast-track` (official). I read the MAHB passenger site first hand on 21 November 2026: its Booking Services menu has an entry "Fast Track" with `allowed_airports: "klia1, klia2"` and `redirect_url: https://www.myairportfasttrack.com/`. The page itself gives no details.
- Source `myairportfasttrack-site` (other). It is the booking site the official menu links to; we could not open it, and the note says so.
- Facilities `kul-t1-fast-track` and `kul-t2-fast-track`, category `other`, tagged `official`, with `bookingUrl` and `asOf` 2026-11-21. Each says what it is (an optional service booked on that site) and where it is sold. It states "Not published in our sources: what it includes, which checkpoints it covers (security, immigration or both), the price, the hours and the seller", in both languages. No price or hours were invented.

**Verified**

- `content.test.ts` "Fast Track": both records exist, with an official MAHB source, the booking link, the "not published" fields and a Malay version.
- A's search test: "fast track" now returns the record first, in English and Malay, and the "unpublished" gap is gone (`search.test.ts` passes).
- B's concierge: "Can I buy fast track at KLIA?" and "Boleh beli fast track di KLIA?" answer from the record (intent `fast-track`, Official). B's timeline test for the optional, non-preselected step passes.
- e2e "KLIA facilities list Fast Track with its booking link" passes. The phone screenshot of `/en/kul/facilities` shows the card with Official, Terminal 1 and the not-published line.

### D-03. Team-written English on Malay pages (P0)

**Status:** fixed. The English titles of English publications stay, as agreed (A-24, OOS-14).

**What changed**

- `Source` gains:
  - `note` (LocalizedText), for our annotations;
  - `localTitle` and `localPublisher`, for names we wrote ourselves;
  - `asOfNote`, for a localised date qualifier;
  - `undated: true`, the explicit flag for no stated date.
- A script moved every annotation out of titles and publishers into `note`. 91 of the 254 sources now carry one of the 50 localised notes in `src/content/source-notes.ts`. Among them: "(as summarised in search results)" ×16 plus variants, "(third-party guide)" ×8, the Routes relays, "(post on X)", "(law firm)", "(title from the address)" and "media centre". `validateContent` now rejects an annotation in a title or publisher.
- `prototype-method` has `localTitle` "Cara prototaip konsep ini menganggar dan melabel panduan" and `localPublisher` "Prototaip ini (bukan sumber rasmi)". The unnamed corporate-profile copy gets a localised publisher.
- `asOf` is now `AsOfSchema`: `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, nothing else. Every free-text value was converted:
  - "Retrieved 2026-11-16", "Checked 16 November 2026" and "Observed …" became ISO dates;
  - "Launch coverage, 2020 to 2021" became `2021` plus a localised `asOfNote`;
  - "Page undated", "Listing undated" and "Source undated; checked …" became no record date, with the sources marked `undated`.
- `AirlineAtAirport.checkIn` and `TransportOption.payment` are now LocalizedText. The MH Level 5 check-in text, the Cathay Penang note and the BKI payment list have Malay versions.

**Verified**

- `content.test.ts`: every note and qualifier has Malay; the check-in and payment entries have Malay; the schema rejects free-text dates.
- I crawled 16 Malay pages on my dev server (transport, facilities, parking, the BKI and Penang transport pages, help, three guides, shop and dine, lounges, corporate about and network, KLIA overview, accessibility, about, notices). None of "(as summarised in search results)", "(third-party guide)", "Source undated", "Page undated", "Listing undated", "Retrieved 2026-11-16", "Level 5. International Economy", "This prototype (not an official source)" or "Planned:" is visible. The two remaining hits per page are the `en` halves of LocalizedText inside the RSC payload, not page text.
- The phone dark screenshot of `/ms/guides/departing` with a source open shows "Cara prototaip konsep ini… · Diterbitkan oleh Prototaip ini (bukan sumber rasmi) · Diperoleh 16 Nov 2026 · Setakat 17 Nov 2026".
- e2e "Malay sources are in Malay" passes.

### D-04. Accessibility facts for wheelchair users (P0)

**Status:** partially fixed. **Needs airline data:** the AirAsia, AirAsia X, Batik Air and other carrier sites, and `imi.gov.my`, refuse connections from this environment, and we hold no dated source for those carriers' assistance rules. The airport-side facts are OOS-07.

**What changed**

- New coverage note `kul-accessibility-gaps`, dated 21 November 2026, in both languages. It lists once:
  - where the accessible toilets, lifts, nursing rooms, and buggy and wheelchair points are;
  - accessible parking bays;
  - which trains, buses and stations are step-free;
  - what the airport's special assistance service offers;
  - the assistance rules of airlines other than Malaysia Airlines, naming AirAsia, AirAsia X and Batik Air;
  - the CARE live-chat hours.
  It names the request channels: your airline when you book, CARE live chat, or an information counter.
- `/accessibility` has a new section 4, "Not published yet", with that list and "Who to ask until then". It states "CARE live chat hours: not published in our sources" and links to CARE live chat.
- B's `NeedsControl` is now on the hub (B-11 hand-off).

**Verified**

- e2e "accessibility hub …" (desktop and phone) checks the section, the airline names and the chat-hours line, with axe clean.
- I looked at the desktop dark screenshot of `/ms/accessibility`.

### D-05. The generic "not verified" block (P0)

**Status:** partially fixed. The content and the single place are done; C's section pages still show the full block (hand-off).

**What changed**

- New note topics `coverage` and `parking`, which no journey step or guide reads.
- `contentGapsNote` now uses `coverage` and takes a structured `gaps` list. `validateContent` uses `coverageConflicts()` to fail any gap that names an area with published records.
- The KLIA list is corrected and dated. It is checked on 21 November 2026 and no longer claims shops, restaurants or Terminal 2 facilities as unverified. It now says "opening hours and prices of shops and restaurants, and outlets beyond the few listed", "most Terminal 2 facilities and a Terminal 2 map", and "Terminal 2 airlines other than AirAsia and AirAsia X". Its structured gaps are parking rates, a T2 map, outlet hours, toilets, accessible toilets, nursing rooms and Wi-Fi.
- Penang, Kota Kinabalu, Kuching, Langkawi and Subang have structured gaps too.
- The Preferred Parking warning moved to the `parking` topic, so it is read only by the parking page, by id.
- `/about-this-prototype` has a new section 4, "What we have not verified, airport by airport", with an anchor per airport (`#gaps-kul`, `#gaps-pen` …). It is the one place the lists appear in full.
- The guides now skip coverage notes by topic.

**Verified**

- `content.test.ts`: every content-gaps note uses `coverage` and has gaps. Giving a KLIA outlet hours makes validation fail on `outlet-hours`.
- B's timeline reads `terminal` (step 1) and `getting-there` (step 2), so neither block appears in a departing journey any more. B's journey tests pass.
- e2e "About this prototype lists what is not verified, once per airport" passes, and I looked at the desktop screenshot of the section.

### D-06. Copy and sourcing for brand and legal review (P0)

**Status:** fixed for this round. MAHB-owned sources and brand, legal and native review remain OOS-08 and OOS-14.

**What changed**

- The warning is now stated as a rule, in both languages: "Staying more than a day? Use the Long Term Car Park". It continues: "Preferred Parking … is a premium product, not long-stay parking. For a trip of more than a day, the Long Term Car Park costs at most RM32 a day from 1 May 2026 and has a free shuttle …". It has `asOf` 2026-05-01.
- The paultan.org report (RM2,084) is now only in the sources list, of both the warning and the Preferred Parking car park, whose description no longer quotes it.
- The source policy is written in `types.ts`, enforced by `validateContent` (see D-01, including social posts never backing Official), and published as step 5 of "How facts were sourced and dated" on About this prototype.

**Verified:** `content.test.ts` checks that the warning sits on the parking topic, states the RM32 rule and does not mention paultan or 2,084, and that the policy tests pass.

### D-07. Departing immigration for Malaysian citizens (P0)

**Status:** partially fixed. **Needs the Immigration Department's own wording.** `imi.gov.my` cannot be reached from here, and no source we hold states autogate eligibility for departing citizens, so I could not add a sourced eligibility statement.

**What changed**

- Note `kul-departing-immigration-citizens`, topic `immigration`, `appliesTo` international, departing and `traveller: 'citizen'` (a new optional key), tagged `suggestion`, in both languages. It says plainly what is not published, what to do (have your passport ready; ask an immigration officer for the right lane or a staffed counter) and who sets the rules.
- New source `imi-official-site` (government), with a note that its content was not read.
- The departing and first-time guides now include `immigration` notes, filtered to departing notes (`GUIDE_NOTE_DIRECTION`). The immigration-customs guide shows it too.

**Verified**

- `content.test.ts` checks the note.
- e2e "departing guide shows the passport-control note for Malaysian citizens" passes in English and Malay.
- Concierge: "Can Malaysians use the autogates when leaving KLIA?" now leads with this note (intent `immigration`). B's timeline puts it in the immigration step through `notesFor(context, 'immigration', 'departing')`.

### D-08. Aerotrain closure notice (P1)

**Status:** partially fixed. The content is done; C's route steps are a hand-off.

**What changed**

- The title is now "No Aerotrain from midnight to 5am, 28 November to 1 December" (Malay "Tiada Aerotrain …"); "Planned:" is gone.
- The body adds, in both languages: "Whether the buses are step-free, and how much extra time assisted passengers need, is not published: if you use a wheelchair or need help, ask your airline for assistance before you fly and allow extra time."

**Verified:** `content.test.ts` clock tests. At 2026-11-28 02:00 the notice is active, at 2027-01-15 it has ended, and neither title says Planned or Dirancang.

### D-09. Malay airport names, places and states (P1)

**Status:** partially fixed. See the hand-offs: A's pages and chrome, C's section titles and B's demo destinations still need it. A native editor must confirm the names (OOS-14).

**What changed**

- `Airport` gains `localName`, `localShortName`, `localCity` and `localState`. They are generated in the registry, for example "Lapangan Terbang Antarabangsa Pulau Pinang", "Lapangan Terbang Sultan Abdul Aziz Shah", "Pulau Pangkor" and "Wilayah Persekutuan Labuan".
- `localizeAirport(airport, lang)` returns the airport with those fields in the page language. Codes and slugs stay the same.
- It is used on D's pages: corporate network, news and sustainability, guide airport notes, the help FAQ chips, the accessibility hub and About this prototype.

**Verified**

- `content.test.ts`: every Malay name starts "Lapangan Terbang", and Penang and Labuan get their Malay states.
- The `/ms/accessibility` screenshot shows "Pulau Pinang".

### D-10. KLIA Ekspres fare-rise notice (P1)

**Status:** fixed.

**What changed**

- The notice now has `validFrom` 2026-10-01 (the announcement) and `validTo` 2027-01-31.
- One title reads correctly on both sides of the change: "KLIA Ekspres adult fare: RM65 from 1 January 2027".
- The body says the fare "changes from RM55 to RM65 on 1 January 2027".
- The KLIA Ekspres card no longer says "both fares are listed"; it says "The adult fare changes from RM55 to RM65 on 1 January 2027", which is true before and after the change. So C's conditional sentence is not needed.

**Verified**

- `content.test.ts`: the notice is active at 2026-12-31T23:00, 2027-01-01T00:10 and 2027-01-15 (+08:00), and has ended by 2027-02-15. The card text no longer contains the old sentence.
- The existing notices test was updated because the intended behaviour changed: the notice now stays current over the change, and with a start date it sorts after the undated demo notice of the same severity.
- The concierge shows "In effect: KLIA Ekspres adult fare: RM65 from 1 January 2027" in both languages.

### D-11. "Accessible toilets: Show on the map" (P1)

**Status:** fixed.

**What changed:** `accessibilityData` computes `accessibleToiletsPublished`, which is true when any KLIA facility or map point has the `accessible-toilet` kind.
- While it is false, the card shows "Where the accessible toilets are is not published in our sources yet, so they are not on our map. Ask at an information counter, or see the official special assistance page." Its only action is the official special assistance page.
- The map link comes back by itself once points exist.

**Verified:** e2e checks that no "Show on the map" link remains and that the official page link is present. Screenshot as for D-04.

### D-12. As-of dates (P1)

**Status:** fixed.

**What changed**

- The dates are stored in the fields that already existed:
  - `asOf`, now a strict ISO date, month or year (the acceptance's "asOfDate");
  - `asOfNote`, a LocalizedText qualifier;
  - `undated: true` for a source or FAQ that has no date.
- Backfill:
  - 107 of the 254 sources now carry `undated` (the helpers set it when no date is passed);
  - the 15 undated FAQs are filled in: six statements about the prototype take 2026-11-17, the day they were written; one takes the CAAM report month; eight are `undated`.
- Shared helpers: `formatAsOf` (dates without the clock, en-GB or ms-MY), `asOfStartDate` and `UNDATED_LABEL`.

**Verified**

- `validateContent` requires exactly one of `asOf` or `undated` on every source and FAQ.
- `content.test.ts` "flags records older than 12 months that nobody has reviewed" compares against a review date of 21 November 2026. The 20 records older than 12 months are each listed with a reason, and any new one fails the test.

### D-13. Planning guidance outside the content layer (P1)

**Status:** partially fixed. The home line is A's hand-off.

**What changed**

- New module `src/content/planning-rules.ts`. It is small and safe for client code:
  - `ARRIVAL_TIME_RULE`: 180 and 120 minutes, the sentence in both languages, `estimated`, source `prototype-method`;
  - `TRANSIT_ASSUMPTIONS`: the planner's ranges, `estimated`, source `prototype-method`.
- `transit-logic.ts` reads `ASSUMPTIONS` from `TRANSIT_ASSUMPTIONS` (cross-package, one line).

**Verified**

- `content.test.ts` checks that the rule matches the departing guide's "Plan when to arrive" step.
- `npx vitest run src/components/guides`: 17 of 17 pass.

### D-14. Immigration and customs guide reading level (P1)

**Status:** fixed.

**What changed:** I rewrote the 10 longest step bodies in plain, short sentences, in both languages. The dated reporting ("The Sarawak Tribune reported in June 2026 …") became "A news report says …"; the publisher and date stay in the source.

**Verified:** I measured the steps' English text with the same Flesch-Kincaid formulas, before and after:

| Measure | Before | After |
|---|---|---|
| Grade level | 10.2 | 7.3 |
| Reading ease | 50.3 | 62.5 |
| Sentences over 25 words | 4 | 0 |

### D-15. Phone numbers far down the Help centre (P1)

**Status:** fixed on Help; the phone menu is A's hand-off.

**What changed:** `CallRow` (in `contact-list.tsx`) sits in the Help page header, before search: "Call Malaysia Airports" with labelled `tel:` links for the published lines (the group line, and KLIA Terminal 1 and corporate office) and an "All contacts" link to `#contacts`.

**Verified**

- e2e at 390×844: the `tel:+60387770000` link sits inside the first screen and is at least 44 px tall, axe is clean and nothing scrolls sideways.
- I looked at the phone screenshot: both numbers are under the lead, above search.

### D-16 and D-17 (P2)

**Status:** not fixed. Both are out of scope this round:
- D-16 needs MAHB data feeds and a content minimum per airport (OOS-06).
- D-17 needs verified MAHB commercial and media sales channels (OOS-09).

## Checks run

- `npx tsc --noEmit`: clean (whole project).
- `npx eslint` on every path I own or touched: clean.
- `npx vitest run`: 32 files, 495 tests pass. `content.test.ts` has 17 new tests, and `validateAllContent()` returns `[]`.
- Playwright on my dev server (port 3204):
  - `e2e/guides.spec.ts` and `e2e/corporate.spec.ts`: 26 of 26 on desktop and 26 of 26 on phone (the phone run passed after the `NeedsControl` fix).
  - B's "My needs" test passes on desktop after my `needs-control.tsx` change.
  - Both specs now use the shared `e2e/support/axe.ts` (E's convention).
  - The one existing assertion I changed is in the transit planner test. It uses the verdict heading, because C's new live status line repeats "Very tight", which made `getByText` match two elements (strict mode). The intent is unchanged.
- Screenshots I viewed (5): `/en/help` (390, light), `/ms/accessibility` (1440, dark), `/en/about-this-prototype#gaps` (1440, light), `/ms/guides/departing` with a source open (390, dark), `/en/kul/facilities` with the Fast Track card (390, light).
- I stopped only my dev server's PID, deleted `.next-D`, and removed my `.next-D` lines from `tsconfig.json`.
