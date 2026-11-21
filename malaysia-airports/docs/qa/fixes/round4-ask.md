# Round 4, package "ask": concierge, search and help

Items from the panel re-review (`docs/qa/panel/re-review.md`, section 6.1) and the gallery capture notes
(`docs/prototype/README.md`, "Observations made while capturing", item 4). Fixed in this order. Measured on this
package's own dev server (`NEXT_DIST_DIR=.next-r4ask next dev -p 3232`), Playwright Chromium, phone 390 x 844 and
desktop 1440 x 900, unless stated otherwise.

| # | Item | Status |
|---|------|--------|
| 1 | One fact, one answer: parking rates (6.1.3) | **Fixed** (rates themselves: **needs MAHB data**, OOS-03) |
| 2 | Concierge (6.1.4, B-08; Malay name and placeholder from 6.1.10) | **Fixed** |
| 3 | Search relevance (6.1.5, A-12; gallery note 4) | **Fixed** for every query listed in the package |
| 4 | Measurement: main "Book parking online" link (part of 6.1.9) | **Fixed** |

---

## 1. One fact, one answer (6.1.3)

### The truth, from the records and their sources

No car park at any airport has a verified KLIA rate card; the records say so (`rateStatus: 'not-verified'` on all four
KLIA car parks). What differs is the evidence for a daily figure:

| Car park | Record | Sources | Status, as all three surfaces now word it |
|---|---|---|---|
| Long Term Car Park | `dailyMax: 32`, no bands | The Rakyat Post, 16 May 2026 (rise from RM27 to RM32 on 1 May 2026; link not recorded) and an undated MAHB rate page (RM32 a day); hourly rates differ between trip.com 2026 and the MAHB page | "Rates not verified: our sources give a daily maximum of RM 32; the hourly rates are not confirmed." |
| Terminal 1 Car Park | `reportedDailyMax` RM52 | klia.info, undated | "Rates not verified: klia.info (undated) gives RM 52 a day." |
| Terminal 2 car park | `reportedDailyMax` RM52 | MAHB page, undated, "may be out of date"; trip.com 2026 gives different hourly rates | "Rates not verified: Malaysia Airports Holdings Berhad (undated) gives RM 52 a day." |
| Preferred Parking | no figure | MAHB T1 parking page, Paul Tan 2025 | "No price published." |
| Penang Premium Parking | published bands, `dailyMax: 76` | (unchanged) | "Rates published, with a daily maximum of RM 76." |

**Before.** The parking page showed the Long Term Car Park's "≤ RM 32 / 96 / 224" in full ink with no "not verified"
marker (the terminal car parks were marked), so a reviewer read it as verified; the concierge said "Rates for Terminal 1
Car Park, Preferred Parking, Long Term Car Park (LTCP) and Terminal 2 car park are not published in our sources" with
`ratesPublished: false` on all four; the help FAQ said "Parking rates are not yet verified in this prototype". Three
answers to one fact. No record changed: the records were right; the surfaces each paraphrased them.

**Change.** One derivation, `rateFacts()` and `rateStatusText()` in `src/lib/parking.ts`, reads a car park's record and
gives its basis (`tariff`, `daily-max`, `reported`, `none`) and one bilingual sentence. Every surface uses it:

- **Parking page** (`parking-data.server.ts` adds `rateLine` and `rateVerified` to each car park): the price table's
  row note, the car-park card and the calculator's "not verified" panel all render `rateLine`. The Long Term Car
  Park's figures are now marked like the others (`data-rate-verified="false"`, screen-reader text "(not verified)",
  secondary ink). "Sources differ" is gone where it was not true (Terminal 1 has one source).
- **Concierge** (`engine.ts`): the answer leads with the figure the records give ("No parking rates at KLIA are
  verified. The lowest daily maximum in our sources is RM 32, at Long Term Car Park (LTCP).") and each car park's card
  carries the same sentence. Unverified figures are tagged Estimated (as on the page), not Official. Car parks are
  ordered by evidence: a tariff, then the lowest daily figure, Preferred Parking last.
- **Help FAQ** (`src/content/faqs.ts`): the Long Term Car Park answer is composed from the record ("A complimentary
  shuttle runs … every 10 minutes. Rates not verified: our sources give a daily maximum of RM 32; …"), and cites the
  car park's own sources (4, was 1).

**Test that fails when they disagree.** `src/content/content.test.ts`, "one fact, one answer: parking rates (6.1.3)":
for every airport with car parks, in English and Malay, the page model's `rateLine`, the price table's cell kinds, the
concierge card's `rateText` and `ratesPublished`, and any FAQ answer that names the car park and its rates must all
equal the record's sentence. Mutation checked: putting the old FAQ wording back fails 2 tests; making the page word
its own line fails 2 tests. Also `src/components/parking/parking-logic.test.ts` (each basis, both languages, "undated")
and `e2e/ask-round4.spec.ts` (the page, the concierge and the help FAQ show the same Long Term Car Park sentence in
the browser).

**Needs MAHB data.** The official tariff from the barrier rate source (6.2.3, OOS-03). When it arrives, setting
`rateStatus: 'published'` with bands changes all three surfaces at once.

---

## 2. Concierge (6.1.4, B-08; 6.1.10)

| Reviewers' case | Before | After |
|---|---|---|
| Weather (design) | "I could not match that to one topic, but these published items look related" with KLIA Ekspres fares and KLM | "I can’t answer that from our verified content. For a definite answer, contact Malaysia Airports customer support (group line), +60 3 8777 0000." No cards; the official contacts block, with tappable numbers, shows at once even on a phone |
| Durian in hand luggage (design) | Power bank rule and "Bring original documents" | The same "can’t answer" line and contacts |
| "I need a wheelchair at the gate, I fly AirAsia" (design, inclusion) | "Here is what our sources say about assistance at KLIA", Calm Room card first | "The assistance rules of AirAsia are not published in our sources. Ask AirAsia for the help you need when you book, and say exactly what that is." No Calm Room, no Malaysia Airlines 48-hour rule; contacts and the airline line in the escalation |
| "kerusi roda untuk penerbangan AirAsia di KLIA T2" (inclusion) | Calm Room first, MH rule third | "Peraturan bantuan AirAsia tidak diterbitkan dalam sumber kami. …" |
| Malaysia Airlines named | (general FAQ) | "Malaysia Airlines asks for assistance requests at least 48 hours before departure; later requests depend on availability." with its source (`AIRLINE_ASSISTANCE_NOTICE`, the same record the journey uses) |
| "Di mana tandas OKU berhampiran pintu C?" (design, inclusion) | Generic assistance line | Facility intent: "Lokasi tandas OKU di KLIA belum diterbitkan dalam sumber kami.", contacts, and a link to the hub's "not published" list |
| "Is there a lift from arrivals to the train?" (inclusion) | General list of transport modes | "Step-free access for KLIA Ekspres and KLIA Transit is not published in our sources. Ask the operator or an airport information counter before you travel.", plus the terminal map link |
| Template grammar (design) | "Our sources do not publish accessible toilet for KLIA yet", "… smoking room …" | A phrase per category, both languages: "Our sources do not publish where the accessible toilets are at KLIA yet." / "where the smoking rooms are" / "Wi-Fi details" |
| "In effect" label (design) | "In effect: KLIA Ekspres adult fare: RM65 from 1 January 2027" | Current notices carry no label ("KLIA Ekspres adult fare: RM65 from 1 January 2027"); "Upcoming:" and "Ended:" stay |
| Follow-up misread (found while capturing) | "What will the weather be like tomorrow at KLIA?" after a toilet question re-answered the toilet question | Only an elliptical question ("And at Penang?", "Dan di Pulau Pinang?") keeps the last topic |

How: `fallback()` keeps a passage or search hit only when it covers at least 60% of the question's words and the
question has no word our content never uses; otherwise it says it cannot answer and names the first official contact
from the content (the airport's own, else the group's). It never writes a contact of its own. Assistance answers bring
the calm room and sensory places only for hidden-disability words, and drop passages that state another airline's
rule. "lift", "lif", "elevator" and "ramp" are access qualifiers; "tandas OKU"/"accessible toilet" outrank the
assistance topic.

**Phone cap.** On an answer narrower than the `@lg` container (a phone, or the narrow panel) the answer shows its lead
line and two cards (or two details when there are no cards); the rest is behind a "Show N more items" button
(`aria-expanded`, `aria-controls`, chevron), and "Show less" collapses it. When there is room (fewer than two items),
the official contacts stay visible. CSS decides, so server and browser render the same markup; desktop shows
everything and no button. Phone heights of one answer turn (same server, collapsed / everything):

| Question | Reviewers (round 3) | Collapsed | Everything (after "More") |
|---|---|---|---|
| Parking at KLIA | – | 788 px | 2,101 px |
| Nearest lounge to gate C | 1,943 px | 968 px | 2,032 px |
| Wheelchair, AirAsia | 2,301 px | 1,163 px (contacts kept visible) | 1,275 px |
| Accessible toilet | 1,661 px | 1,181 px | 2,295 px |
| Terminal 1 to Terminal 2 | – | 923 px | 2,282 px |
| Weather (cannot answer) | – | 881 px | 941 px |

**Malay (6.1.10).** The concierge's Malay name is **"Tanya Kami"** (page title, `h1`, panel title, header button,
nav, home section, search hint, privacy notices of the concierge itself); no "Concierge" remains in the shell's Malay
strings (test). The home field's short Malay placeholder "Penerbangan, bandar" measured 191 px in a 166 px slot at
360 px and 125% text ("Penerbangan, ba…"); it is now "Penerbangan": 126/126 px at 320 px, 166/166 at 360, 196/196 at
390, no clipping. Native-speaker review of both is still OOS-14.

**Grounding** is unchanged: the property test (no number or name that the content, the demo flights or the question
does not hold) runs over 63 questions x 7 contexts x 2 languages and passes, now including the per-category phrases.

Tests: `src/lib/concierge/engine.test.ts` "round 4: fallback, access qualifiers, named airline, grammar (6.1.4)"
(10 tests: fallback EN and MS with the content's contact, follow-ups only when elliptical, covered questions still
answered, named airline EN and MS, Malaysia Airlines rule, hidden disabilities keep the calm room, tandas OKU /
accessible toilet / smoking grammar, a phrase for every category, lift, no "In effect"/"Berkuat kuasa"); `e2e/ask-round4.spec.ts` (fallback with
visible contacts on a phone, the "More" disclosure with `aria-expanded` before and after, desktop without it, Malay
name, tandas OKU and AirAsia in Malay).

---

## 3. Search relevance (6.1.5, A-12)

| Query | Before | After |
|---|---|---|
| "fast track" | 2 results, both titled "Fast Track" | "Fast Track (Terminal 1)", "Fast Track (Terminal 2)"; also "Sensory walls (Terminal 1)", "Calm Room (Terminal 1)", map places by level ("Toilets (illustrative position, Level 5)") |
| "smoking", "merokok" | 0 results | "Smoking rooms: not published yet" / "Bilik merokok: belum diterbitkan" first |
| "wifi", "Wi-Fi", "wi fi" | 55 results, led by a first-time-flyer guide and Firefly ("wi" and "fi" matched as prefixes) | 2 results, "Wi-Fi: not published yet" first |
| "taxi" | 6 results including the liquids rule ("cab" matched "cabin") and the power-bank rule | Taxis only (2 network-wide, 1 at KLIA) |
| "accessible toilet", "tandas OKU" | "Toilets (illustrative position)" twice, then "Accessible parking: not published" | "Accessible toilets: not published yet" / "Tandas OKU: belum diterbitkan" first, linking to the hub's not-published list |
| "surau" | Solar-farm press release second | Prayer rooms only; news ranks at half weight and never in the first five results of a task query (tested for 8 queries) |
| "parking" on the home field and at KLIA | Preferred Parking first | "Parking at KLIA: prices and car parks" first, then the Long Term Car Park; Preferred Parking still found first when asked for by name |
| "MH 2" (gallery note 4) | 25 results, including "Sensory walls (Terminal 2)", "KLIA Terminal 2" and the T2 car park, on the digit alone | Airlines only (and the demo flights above them); "terminal 2" still finds Terminal 2 |

How (`src/lib/search/engine.ts`, `documents.ts`): "Wi-Fi"/"wi fi" tokenised as one word; prefix and typo matching only
for words the visitor typed, never for added synonyms; an honest "not published" result gets a strong boost only when
its topic is typed as a phrase; an optional per-document `rank` (news 0.5, long-stay car parks 1.3, premium 0.6) and
`rankWhen` (the parking page outranks car parks only for parking words, so "penan" still finds Penang airport); one
parking-page document per airport with car parks; digits dropped from the site query when the query is a flight
number; titles that repeat within one airport get the terminal (map places: the level). Three new honest gaps, from the
content-gaps list (accessible toilets, Wi-Fi) or an empty category (smoking rooms); none states a fact.

Tests: `src/lib/search/search.test.ts` "search relevance (round 4, 6.1.5)", 8 tests, one per query group above, both
languages where the panel quoted Malay; all 16 earlier search tests unchanged and passing. `e2e/ask-round4.spec.ts`
covers the search page and the home field.

Not in this package's list and not done: "Stop the home field announcing '0 flights found' for topic queries" (the
flight search box, home/flights package).

---

## 4. Measurement (part of 6.1.9)

The main "Book parking online" link under the price table now carries `data-handoff="parking-booking"`, like the
car-park cards' and the calculator's links. **Before:** opened `https://airports.malaysiaairports.com.my/en/klia1/parking`
with no parameter and sent no beacon. **After** (e2e, external host stubbed): the opened URL contains
`utm_campaign=parking-booking` and a `handoff` beacon names `parking-booking`. Fast Track on the facilities page,
lounge operators and rail tickets belong to other packages; the durable metric store is still open (6.1.9).

---

## Cross-package changes (smallest possible; recorded here)

1. **`src/lib/i18n/ms.ts`, existing values changed** (beyond append): the Malay name "Tanya Kami" in `nav.concierge`,
   `concierge.title`, `concierge.open`, `concierge.limits`, `concierge.stub.title`, `search.noResultsHint`,
   `home.concierge.eyebrow` and `home.concierge.previewNote`; `home.searchPlaceholderShort` "Penerbangan, bandar" →
   "Penerbangan".
2. **`src/lib/i18n/en.ts` and `ms.ts`, appended:** `shellExtras.searchGaps.accessibleToilet`, `.wifi`, `.smoking` and
   `shellExtras.searchPages.parking`.
3. **`src/components/shell/sections.test.ts`** (shell package): the A-25 test asserted the Malay name "Concierge";
   updated to "Tanya Kami" and to fail on any "concierge" in the shell's Malay strings. Intended behaviour change.
4. **`e2e/transport.spec.ts`** (parking test only): the Terminal 1 note now reads "Rates not verified: klia.info
   (undated) gives RM 52 a day." and the Long Term Car Park note is asserted too. Intended behaviour change.
5. **Read-only use of another package's data:** `src/lib/concierge/knowledge.server.ts` includes
   `AIRLINE_ASSISTANCE_NOTICE` (`src/content/planning-rules.ts`) so the concierge and the journey share one rule.
6. **Left for the owners:** Malay copy that still says "concierge" outside the shell: `corporatePages` privacy texts
   (`src/lib/i18n/features/corporate.ts`, 7 strings) and `platformPages` ("Carian dan concierge.",
   `features/platform.ts`). The parking components no longer read `transportPages.matrix.dailyMaxNote`, `reportedNote`,
   `reportedFigure`, `undated`, `noneNote` or `transportPages.parking.sourcesDiffer` (`features/transport.ts`); the
   transport owner may remove them.

## Other test updates (intended behaviour changes, in this package's files)

- `engine.test.ts` "parking cost …": expected a blanket "not published" limit for KLIA; now expects the lead with
  RM 32 at the Long Term Car Park and the car park first. The property test's phrasebook includes the new phrases.
- `e2e/concierge.spec.ts`: Malay `h1` "Tanya Kami" (was "Tanya concierge"); on a phone the details sit behind "Show N
  more", so the first test opens it before checking provenance tags.

## Verification

- `npx tsc --noEmit`: clean. `npx eslint` on every owned path, the i18n files and the touched specs: clean.
- `npx vitest run`: 34 files, 544 tests, all passing.
- Playwright, against this package's server: `e2e/ask-round4.spec.ts` (10 tests) and `e2e/concierge.spec.ts`: 20 of
  20 on `desktop` and 20 of 20 on `phone`, the new spec run twice; `e2e/transport.spec.ts` and `e2e/handoffs.spec.ts`
  all passing; `e2e/shell.spec.ts`, `smoke.spec.ts` and `guides.spec.ts` 60 of 62. The two failures are outside this
  package: the transit planner's terminal-change test (transit page, mid-change in another package) and `/en/zzz`
  answering 200 on a dev server's first request (expected under `next dev`, next16-notes Do/Don't 10).
- Screens looked at (10 captures): the parking price table at 1440 and 390; the concierge parking answer at 390
  (collapsed) and 1440; the fallback at 390, before and after the follow-up fix; Malay, dark mode, the AirAsia
  wheelchair answer at 390; Malay search "tandas OKU" at 390; the home field's "parking" suggestion at 390; the Malay
  home at 360 and 125% text (the capture scrolled past the field, so the placeholder fit was measured in the DOM).
- No static-shell or `MissingPage` code was touched; no clock or random value was added to any render.
