# Fix log: round six, package "ask" (Ask, find and trust)

Round six, 21 to 22 November 2026. Items from the third review (`docs/qa/panel/review-3.md`, section 9.1 items 3, 4,
5, 6, 7 and 10; the chair's checks in section 1.4; weaknesses 6, 8 and 10 in section 7) with the evidence of the three
lens reports. Fixed in the order given. Owned paths, plus the **cross-package changes listed at the end** (each the
smallest change that could make the item true).

| # | Item | Status |
|---|---|---|
| 1 | Concierge focus under the question box **[pilot condition P9]** (9.1 item 3) | **Fixed**: focused controls hidden behind the composer **5 / 4 / 4 / 3 / 4 (en) and 5 / 3 / 2 / 3 / 3 (ms) → 0** at 1280 x 720, 1440 x 900 at 125%, 1440 x 900, 1920 x 1080 and 390 x 844, before and after answers; axe `target-size` on `/ms/concierge` (1440 x 900) and `/en/concierge` (1280 x 720): **0 in 10 of 10 loads**; the Malay after-answer axe test **32 of 36 → 30 of 30** passes |
| 2 | Focus after a search (palette) selection (9.1 item 3) | **Fixed**: focus lands on the destination's anchor or `h1` in both languages, phone and desktop (was `<body>` on desktop, the bottom-bar Search button on a phone) |
| 3 | Concierge intent and length (9.1 item 4) | **Fixed** for every question the lenses quoted, both languages (table below); phone turns **500–1,163 px → 322–1,012 px** (median 580), at most two cards before "More" |
| 4 | Search (9.1 item 5) | **Fixed** for every query listed; demonstration places marked "illustrative" in results. **The map's From and To lists are the access package's** (request below) |
| 5 | Notice and copy semantics (9.1 item 6) | **Fixed**: "Announced; applies from 1 January 2027" / "Diumumkan; berkuat kuasa mulai 1 Januari 2027"; no "Estimated" chip on any notice; the long-stay card's qualifier; "No notices in our sources for this airport."; no "Security MAIN" |
| 6 | Corporate type sizes (9.1 item 7, A-14) | **Fixed**: hub **9 → 8** (390 and 1440 px, en and ms); news **9 → 8** (390 px) and **8 → 7** (1440 px) |
| 7 | hreflang in the head (9.1 item 10, E-14) | **Fixed**: alternates (en, ms, x-default) in the head on **152 → 276 of 276** sitemap pages, flight pages and 404s; exactly **one canonical per response, in the head, on 276 of 276** |

## Method

- **Servers.** Dev server `NEXT_DIST_DIR=.next-r6ask npx next dev -p 3262` for the "before" numbers and quick looks;
  two production builds into `.next-r6ask-prod` (`NEXT_PUBLIC_SITE_URL=http://localhost:3272`), served with
  `TRUSTED_CLIENT_IP_HEADER=x-e2e-client-ip npx next start -p 3272`: build 1 with items 1 to 7, build 2 final (the
  search-only copy moved out of the client dictionary, below). Both builds carry the access package's work in
  progress (same folder). Playwright Chromium, a fresh client address per context; scratch scripts in the session's
  scratchpad (`r6-ask/`), none in the repository.
- **Before numbers** are mine on the dev server (concierge focus, search, the engine run directly with a fixed clock)
  or the lens reports' (phone turn heights, the palette), as stated per item.
- **Checks at the end** (build 2 unless stated): `npx tsc --noEmit` clean; `npx eslint` on every touched path clean;
  `npx vitest run` **41 files, 606 tests passed** (23 of them added by this package); Playwright on build 2:
  `ask-round6`, `concierge`, `ask-round4`, `polish-round5`, `platform`, `layout-round4`, `corporate` **243 passed,
  11 skipped**; `smoke`, `shell`, `guides` **120 passed**; on build 1 also `trust`, `map`, `commerce`, `transport`,
  `handoffs`, `speed-round5`, `flight-round5` passed. `flights.spec.ts` fails 2 tests × 2 projects on the "Save
  flight" button's name after saving: the access package's "Saved" state label (9.1 item 7), their test to update.
  `scripts/qa/canonical.py` and `search-index.mjs` on build 2 (below).
- **Screenshots looked at** (9): the concierge before a question at 390 x 844 (ms) and 1440 x 900 (dark); answers at
  390 x 844 ("book me a taxi", en light; the Malay queue question, dark) and 1280 x 720 (gate C); search "kuching
  parking" at 390 x 844; the announced fare on `/en/notices` at 1440 x 900; the corporate hub at 390 (ms) and 1440
  (dark).

---

## 1. Concierge focus (pilot condition P9)

**Cause.** The page's composer stuck to the bottom of the window from the first load, under eleven suggestions: at
1280 x 720 the "KL Sentral" suggestion ran from 649 to 720 px and the composer from 651 px (chair's check, reproduced
exactly). Nothing kept a focused control clear of it.

**Change** (`src/components/concierge/concierge-chat.tsx`):

- **Before the first question the page's composer is static and comes first**, with the suggestions after it in
  reading, focus and visual order. On a phone it is still on the first screen (field at about 700 px at 390 x 844),
  and nothing can sit under it. The panel is unchanged (its composer is outside its scroll area).
- **Once there is a conversation the composer sticks** (as before, so the field stays in view after each answer), and
  the page keeps `scroll-padding-bottom` equal to the composer's measured height plus the phone bar and safe area
  (`ResizeObserver`; removed when the composer is not stuck, for example on windows under 40 rem high, and on
  unmount). A control that takes focus is scrolled clear of it at any size, zoom or text size.

**Measured** (Tab from the `h1` through every stop; a stop fails when its box meets the composer, the header or the
bottom bar, or leaves the window):

| Window | en before | en after | ms before | ms after |
|---|---|---|---|---|
| 1280 x 720 | 5 | **0** | 5 | **0** |
| 1440 x 900 at 125% (1152 x 720 at DPR 1.25) | 4 | **0** | 3 | **0** |
| 1440 x 900 | 4 | **0** | 2 | **0** |
| 1920 x 1080 | 3 | **0** | 3 | **0** |
| 390 x 844 | 4 | **0** | 3 | **0** |
| 320 x 568, 1280 x 720 at 200% and 400% | 0 | **0** | 0 | 0 (composer), see note |

"After" includes a second walk after two answers (20 and 21 stops: answer links, "Show N more", contacts). Note: at
1280 x 720 and 400% (320 x 180) in Malay, after two answers, the header (not the composer) overlaps the top 8 px of
"Kosongkan perbualan" when Tab scrolls back up to it: the header's own scroll padding plus the phone bar's
leave 20 px of a 180 px window. That is the shell's (reported to the access package, below).

**axe** (`wcag2a … wcag22aa`): `/ms/concierge` at 1440 x 900 and `/en/concierge` at 1280 x 720, **0 violations in 10
of 10** loads (the inclusion lens had `target-size` on 3 of 3). The Malay after-answer test (`concierge.spec.ts`,
"works in Bahasa Malaysia") failed `target-size` on the privacy-row button in **4 of 36** repeats on build 2: axe ran
during the smooth scroll to the answer, when the button was half under the sticky header (at rest it is wholly behind
it). The spec's axe helper now scans the page at rest (scroll position unchanged for 250 ms): **30 of 30**. This is
G3 item 5's intermittent result, now explained.

**Tests** (`e2e/ask-round6.spec.ts`): Tab through every suggestion and every answer control, assert each focused
element fully visible, at 1280 x 720, 1440 x 900 at 125% and 390 x 844, en and ms (6 tests); the composer is static
and first before a question; axe with target size on the two windows above. `layout-round4`'s 320 x 256 check
(composer not sticky) still passes.

## 2. Focus after a palette selection

**Cause.** On close, the palette returned focus to its opener (Radix `onCloseAutoFocus` → the overlay store), after
the route-change focus handler had already declined to move focus out of the closing dialog. A same-page choice (an
anchor on the page already shown) never had a route change at all.

**Change** (`src/components/search/command-palette.tsx`, new `src/components/search/focus-destination.ts`): choosing
a result (Enter or a click) records its URL; on close the palette moves focus to the destination instead of the
opener: the `#anchor` target, otherwise the new page's visible `h1` (`tabindex="-1"`), waiting up to five seconds for
the URL to match and the target to render, then `<main>`. It never takes focus from a field or dialog the visitor has
moved to meanwhile. Compatible with the access package's new in-page focus listener (same target).

**Tests** (5 cases × 2 projects): "parking klia" (to `/en/kul/parking`, `h1`), "accessible toilet" from `/en/kul`
and from `/en/accessibility` itself (anchor), "tandas OKU" (`/ms`, anchor), "surau" (`/ms/kul`); the next Tab stays in
`<main>`. With the fix disabled the same-page case fails as the lenses describe (`<body>` on desktop, the bottom-bar
button on a phone); the cross-route cases need the production timing to fail, and pass on build 2.

## 3. Concierge intent and length

Engine: `src/lib/concierge/understand.ts`, `engine.ts`, `types.ts` (four intents: `cannot-do`, `queue`, `business`,
`out-of-scope`); copy: `src/lib/i18n/features/concierge.ts` (appended, plus the two delay leads shortened); view:
`concierge-answer.tsx`. Every answer stays grounded (the property test over every question × context × language
passes: no number or name outside the knowledge, the phrasebook and derived values).

| Question (lens) | Before (lead) | After (lead; first detail) |
|---|---|---|
| "Can you book me a taxi?" (design, chair) | "To get to and from KLIA, our sources list Long Term Car Park shuttle, buses …" | "I can't book a taxi for you. Airport taxis are paid for by coupon at a counter before you ride."; the prepaid coupon taxi card (counters, no fare published). No booking implied; no support line |
| "Boleh tempah teksi untuk saya?" | six modes | "Saya tidak boleh menempah teksi untuk anda. Teksi lapangan terbang dibayar dengan kupon …" |
| "Can you book parking for me?" / "Please book me a flight" | parking figures / — | "I can't book parking for you. The parking page links to the official booking site …" + car parks / "I can't book or change flights for you. Your airline or travel agent can." |
| "What is the queue at immigration right now?" (business, chair) | "Here is what our sources say about immigration …", visitor autogates | "There is no live queue data yet. The waiting times we show are demonstration estimates, not measurements."; "In the demonstration data: Immigration (leaving) at Terminal 1, about 10 min and … Terminal 2, about 9 min. These are not measurements." (Demo label and banner; no support line). Malay, security, arriving and one-terminal airports likewise |
| "Is the Aerotrain running now?" | (already) the planned notice + "no live operations feed" | unchanged |
| "How do I buy Fast Track?" (design, business) | "Here is what our sources say about Fast Track at KLIA." | "Fast Track at KLIA: an optional service you book on a separate website, myairportfasttrack.com." |
| Check-in, wheelchair, delay, gates, arrival autogates (all "Here is what our sources say …") | framing line | the first detail's own first sentence (for example "The departure hall and check-in counters are on Level 5 of the Main Terminal Building."); the framing line stays only when nothing follows |
| "Bolehkah ibu saya yang warga emas guna autogate semasa berlepas?", "Siapa boleh guna autogate berlepas di KLIA?", "Warga Malaysia guna autogate semasa keluar negara?", "Can my elderly mother use the autogate when leaving Malaysia?" (inclusion: 4 failed, 3 in Malay) | generic line, then visitor autogates / MDAC first | the departing-citizen card first and as the lead ("Sumber kami tidak menerbitkan siapa yang boleh menggunakan autogate berlepas …"); no MDAC or "63 countries" content; the older-traveller assistance passage when an older traveller is named. "tiba"/"arrival"/"MDAC" questions keep the arrival card |
| "What will the weather be like tomorrow (at KLIA)?" / "Bagaimana cuaca esok di KLIA?" (all three lenses) | "I can't answer that … contact Malaysia Airports customer support, +60 3 8777 0000" | "I can't give weather forecasts: check a weather service. If the weather may affect your flight, your airline has the real status." No contacts. "Will the rain delay my flight?" stays a delay question |
| "Where can I eat near gate C?" (design) | "Which airport is this about?" | KLIA Terminal 1 inferred ("Food and drink published for KLIA Terminal 1: …"); a letter only one airport publishes (from the content's gate notes and locations: A, B, C, G, H, L) |
| "Advertising space at KLIA?" (business) | "I can't answer that … customer support" | "A dedicated channel for advertising enquiries is not published in our sources. Use the official contact page or the general enquiries email, and say which team and airport you mean." + group contacts + "Doing business with Malaysia Airports". Retail space, tenders, routes, cargo, Aeropolis, Malay likewise |
| "Parking for 3 days?" (business) | the daily maximum | "For 3 days, at most RM 96 at Long Term Car Park (LTCP), from the daily maximum in our sources. Rates not verified." (the parking page's "≤ RM 96") |

**Length on a phone.** One lead line, then at most two cards (or, with no card, one detail) before "More"; with cards
the details wait behind "More" (the fare was stated in the lead, a card and a detail); a detail the lead was taken
from is labelled under the lead (its provenance tag) and not repeated; the official contacts show at once only when
there is nothing else (the "can't answer" case). 16 English turns at 390 x 844: **322 to 1,012 px, median 580**
(design lens: 500 to 1,163 px over 14 turns). The two longest are two transport cards (T1 to T2, 923 px) and two
layover cards (1,012 px).

**Tests.** Unit (`src/lib/concierge/engine.test.ts`, 10 new, en and ms): book a taxi (and that a how-to question is
not a request), book parking or a flight, "now" queues (four questions, demo label, no escalation), "running now",
leads without "Here is what our sources say" (8 questions), departing autogates (5) versus arrival (2), out of scope
(4, no support line, rain + delay stays a delay), gate letter, business (4), the 3-day upper bound and the long-stay
qualifier. E2E (`ask-round6.spec.ts`): the English and Malay intents on the page, and the phone rule (≤ 2 cards, ≤ 1
detail, "More", turn under 1,100 px). **Intended changes to existing tests, said so in place:** the round-four
"cannot answer" unit and e2e tests use the durian question instead of the weather (now out of scope); the follow-up
test expects `out-of-scope` for the weather; "tandas OKU … pintu C" now names "KLIA Terminal 1"; the property test's
allowed derived numbers include whole days and the daily maximum × days.

## 4. Search

Engine (`src/lib/search/engine.ts`) and documents (`documents.ts`):

- **The airport a query names** (its name, city or upper-case code, from the airport documents) is preferred (× 2.5),
  and in a palette scoped to another airport it becomes the scope. When it does not publish the section or service
  asked for (parking, ground transport, lounges, shops and food, facilities; ATMs, pharmacy, money changers, lost and
  found, charging), a **"<Section> at <airport>: not published"** result comes first, linking to the honest state
  page with the official website and phone line (`/airports/not-published?airport=…&section=…`), before any other
  airport's page. Templates are built with the documents but kept out of the index.
- **Vocabulary:** "Pharmacies: not published yet" and "Charging points: not published yet" (en, ms); the business
  page carries advertising, retail space, tender, cargo and Aeropolis words.
- **Noise:** help, news, notice and guide items that matched only in their summary × 0.3; hits reached only through a
  typo allowance × 0.25; hits under 3% of the best hit dropped.
- **Illustrative places:** every demonstration place on the schematic maps says so in its result, lifts included
  ("Lifts to Levels 3 and 1 (illustrative position)", "Lif ke Aras 3 dan 1 (kedudukan ilustrasi)").

| Query | Before | After |
|---|---|---|
| kuching parking | 22 results, led by KLIA, Penang, Kota Kinabalu parking | 18, led by **"Parking at Kuching International Airport: not published"** |
| langkawi taxi | KLIA and Penang taxis first | **"Ground transport at Langkawi International Airport: not published"**, then Langkawi |
| parkir kuching / teksi langkawi | as English | the Malay gap lines first |
| atm penang | — | "ATMs at Penang International Airport: not published" first |
| pharmacy / farmasi | **0 results** | "Pharmacies: not published yet" / "Farmasi: belum diterbitkan" |
| charging | the inter-terminal train and shuttle | "Charging points: not published yet" only |
| money changer | the gap, then Scoot, Royal Brunei, KLIA Ekspres, the fare notice, Premium Parking | the gap only |
| lost and found | 134 results | 7, led by Lost & Found; no lounges, medical services or Kepler |
| advertising | the privacy FAQ first | "Business with us" first |
| grab | e-hailing, touts FAQ, vendor-scam FAQ | e-hailing at KLIA and Penang |
| lift / lif | "Lifts to Levels 3 and 1" (no marker) | "… (illustrative position)" / "(kedudukan ilustrasi)" |
| penang parking, parking, taxi, surau, fast track, wifi, MH 2, penan | — | unchanged leaders |

Search index (`scripts/qa/search-index.mjs`, build 2): **470 documents** (446 in round five: 2 new gaps and 10
templates per language), 0 broken, 0 missing anchors. **Tests:** 11 unit tests (`src/lib/search/search.test.ts`) and
13 e2e cases (× 2 projects) on `/en|ms/search` (`ask-round6.spec.ts`), one per query.

**Request to the access package (not edited here):** the map's From and To lists still offer demonstration places
without the "illustrative" marker (inclusion lens: "Toilets · Level 5", "Lifts …"); the same rule as the search
documents (append "(illustrative position)" / "(kedudukan ilustrasi)" to every `provenance: 'demo'` place that lacks
it) would close 9.1 item 5 there.

## 5. Notice and copy semantics

- **Announced changes.** A notice may carry `appliesFrom` (the date the change it announces takes effect). Until then
  the notice card reads **"Announced; applies from 1 January 2027"** / **"Diumumkan; berkuat kuasa mulai 1 Januari
  2027"**, never "In effect now"; it is still shown (home strip, airport page, notices page). The KLIA Ekspres fare
  notice has `appliesFrom: 2027-01-01`. Helpers: `noticeAnnounced()` (`src/content/notices.ts`) and an `announced`
  state in `noticeViewState()`.
- **No "Estimated" chip on notices**, on the notice cards and on the status lines' notice rows; demonstration notices
  keep their Demo label and official ones their Official tag; the sources line says who reports the others.
- **The concierge's long-stay card** ("the Long Term Car Park costs at most RM32 a day from 1 May 2026") now ends with
  the car park's own rate sentence, "Rates not verified: our sources give a daily maximum of RM 32; the hourly rates
  are not confirmed." Applied to any passage that quotes an unverified car park's figure.
- **Directory-only airports:** "No notices in our sources for this airport." / "Tiada notis dalam sumber kami bagi
  lapangan terbang ini." (was "… right now").
- **Readable terminal labels:** queue lines at one-terminal airports no longer print "MAIN" ("Security: about 4 min").

**Tests.** Unit (`src/content/content.test.ts`, appended, fixed clock 22 November 2026 06:40): no notice whose start
(`validFrom` or `appliesFrom`) is in the future is `active`, and a future "from <date>" in a title requires
`appliesFrom`; the fare notice is announced until 31 December 23:59, in effect from 1 January, ended after 31 January.
E2E (fixed clock): the announced chip and no "In effect now" in the fare card on `/en/kul`, `/en/notices` and
`/ms/kul`, 0 "estimated" tags in notice cards; `/en/lwy`'s empty state; no "MAIN" on `/en/kch`; the long-stay
qualifier in a concierge answer.

## 6. Corporate type sizes

The hub's eight section titles and the media centre's headlines used `type-title-lg` (22 px), a ninth size beside
the key figures (24) and labels (11). Both now use `type-title-md` (18 px), already on the page.

| Page | 390 px before → after | 1440 px before → after |
|---|---|---|
| `/en/corporate`, `/ms/corporate` | 9 → **8** | 9 → **8** |
| `/en/corporate/news`, `/ms/corporate/news` | 9 → **8** | 8 → **7** |
| other corporate pages (about, network, business, sustainability, careers, governance, contact, a story) | 6 to 7 | 6 to 8 |

Method as `scripts/qa/type-sizes.mjs` (distinct font sizes of visible text in `<main>`). **Test:** e2e at 390 and
1440 px over the four pages.

## 7. hreflang in the head

`languageAlternates(lang, path)` (`src/lib/seo/metadata.ts`) gives a page its canonical and the en, ms and x-default
alternates; `pageMetadata` now uses it too. The 27 page files whose `generateMetadata` set only a title and
description now add it (one property and one import each; not-found branches keep the inherited canonical). It
replaces the root layout's inherited `./` canonical (shallow merge), so each head still names exactly one canonical.

`scripts/qa/canonical.py` on build 2: 276 of 276 self-canonical with en and ms; canonical in the head 276, in the
`Link` header 276; **one canonical `<link>` per document on 276 of 276**; one distinct canonical per response on 276;
flight pages (en, ms) and `/en/kul/zzz` the same. **Alternates in the head: 276 of 276** (152 in round five).
**Tests:** a new e2e test reads every sitemap page's head (en, ms, x-default alternates; exactly one canonical, itself);
`polish-round5.spec.ts`'s canonical tests and `platform.spec.ts`'s `Link` header tests pass.

---

## Side effects measured

- **HTML.** The search-only copy (gap lines and templates) first went into `shellExtras`, which the root layout sends
  with every page (build 1: +1.1 KB raw per page). Build 2 moves it to a new `searchIndex` namespace, scoped like
  `corporatePages` (never sent to the browser): `/en` 290.8 → 289.7 KB raw, 55.7 → 55.5 KB gzip; `/en/kul` 51.5 →
  51.4; `/en/concierge` 39.2 → 39.1; `/en/corporate` 41.1 → 40.9 KB gzip. Pages that gained alternates carry three
  more `<link>` tags.
- **First-load JavaScript** (`scripts/qa/first-load-js.mjs`, build 1, gzip): concierge 185.0 KB (round five 182.0),
  of which the shared shell is 37.4 (round five 33.0) and the concierge's own 18.9 (round five 20.3). This package
  changed no file the shell loads first (the palette and its focus helper load with the overlays); the shell's
  +4.4 KB is the other package's work in progress. Corporate pages 170.4 (round five 166.0) for the same reason.
- **The engine** now imports the demo queue provider (deterministic from `now`, already the overview's source); it
  still reads no clock and no network.

## Cross-package changes (smallest possible; please keep)

1. `src/content/types.ts`: optional `appliesFrom` on `NoticeSchema` (one field, documented).
2. `src/content/airports/kul.ts`: `appliesFrom: '2027-01-01T00:00:00+08:00'` on `kul-klia-ekspres-fare-rise-2027`.
3. `src/components/airport/notice-utils.ts` (`announced` state, `appliesFrom` on `NoticeView`, announced counts as
   current), `notice-views.server.ts` (passes `appliesFrom`), `notice-list.tsx` (the announced label; provenance tag
   only for demo and official notices).
4. `src/components/flights/ops-status.tsx`: no "MAIN" after a checkpoint; no "Estimated" tag on a notice row.
5. `src/lib/i18n/en.ts`, `ms.ts`: `notices.none` reworded (existing key), `notices.announced` added, new top-level
   `searchIndex` namespace appended. `src/lib/i18n/index.ts`: `searchIndex` added to `SCOPED_NAMESPACES`;
   `src/lib/i18n/i18n.test.ts`: its (empty) allow-list entry, required by the type.
6. `generateMetadata` in `about-this-prototype`, `accessibility`, `airports`, `airports/not-published`,
   `design-system`, `guides`, `guides/[topic]`, `journey`, `privacy`, `terms`, `[airport]/shop-dine/[outlet]` and
   `[airport]/flights/[flightId]` (`src/app/[lang]/…/page.tsx`): one `alternates: languageAlternates(…)` property and
   one import each.

## For the access package

- Map From and To lists: mark every demonstration place as illustrative (section 4).
- At 1280 x 720 and 400% zoom (320 x 180), the header covers the top 8 px of the concierge's "Kosongkan perbualan"
  when focus scrolls up to it after answers (section 1): the header's scroll padding (72 px) and the phone bar's
  (88 px) leave 20 px of the window.
- `flights.spec.ts` (2 tests, both projects) still looks for "Save flight" after saving; it reads "Saved" now.
