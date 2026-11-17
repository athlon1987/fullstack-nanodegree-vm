# Hand-off: corporate section and transparency pages

Owner: corporate-network. Status (17 Nov 2026): `npx tsc --noEmit` clean for these files,
`npx eslint` clean on every path below, `npx vitest run src/components/corporate` 10 of 10.
**The shared dev server was down from about 17:20 for the rest of my session (no Next process),**
so `e2e/corporate.spec.ts` is written but has NOT been run. Visual review instead used a harness
outside Next (React server rendering of each page tree plus Tailwind compiled from `globals.css`
and the self-hosted fonts): two rounds at 1440 and 390 px, light, dark and Malay, all 13 pages
free of sideways scroll at 360 px, and axe (wcag2a/2aa/21aa/22aa) zero violations on every page in
light, dark and high contrast (only `document-title`, which the harness cannot produce).

## 1. What was built

| Route (`/[lang]` prefix omitted) | Purpose |
|---|---|
| `/corporate` | Corporate home: the network in 2025 (four sourced figures), vision and brand promise, a numbered index of the sections, latest three media items, way back to the passenger site |
| `/corporate/about` | History and milestones (15, oldest first), ownership after the 2025 privatisation, leadership as of 16 Nov 2026, vision, brand promise and values, group companies, Operating Agreements, recognition |
| `/corporate/network` | Our airports: classification counts with the annual-report source, the five international airports linking to their passenger pages, 2025 traffic, Istanbul Sabiha Gökçen, projects (Aerotrain, T1 baggage system, Kota Bharu) |
| `/corporate/business` | Seven lines of business (procurement, commercial space, advertising, airlines, cargo, KLIA Aeropolis, consultancy): what is published for each, "Not published" for the dedicated channel, the vendor scam warning, and the sourced contact channels |
| `/corporate/sustainability` | Net zero 2050, 20% renewables by 2030, KLIA Aeropolis solar, Airport Carbon Accreditation table (KLIA level 3; Penang, Kuching, Kota Kinabalu, Langkawi level 1), related news |
| `/corporate/careers` | Official careers portal and Our Leaders page; programmes "Not published"; apply-safely advice (suggestion) |
| `/corporate/news` and `/corporate/news/[slug]` | Media centre: traffic statistics table (15 rows) and 14 stories (2 domain `NEWS_ITEMS` + 12 `MEDIA_ITEMS`), each marked release or press coverage; story pages with sources open; `ensureStatic = 'navigation'` |
| `/corporate/governance` | Ownership and board, Operating Agreements, MAHB privacy notice (PDF), whistleblowing and anti-bribery "Not published", scam alerts, registration number |
| `/corporate/contact` | Sourced channels only (group line, info@ email, T1 and corporate office line, live chat, feedback site, contact page), corporate office address (reference work, labelled estimated), media, investors, passenger help |
| `/about-this-prototype` | What it is and is not, verified versus demonstration table, sourcing method with live source counts and the provenance legend, six production integrations with dependencies, accessibility and performance targets, limitations |
| `/privacy` | Summary, every storage key with what and where, live "on this device now" list, what the concierge sends and when, a working "Clear all data on this device", PDPA 2024 design intentions (labelled as such), MAHB's own notice |
| `/terms` | Nine plain terms: not official, not for travel decisions, official channels prevail, no warranty, marks, links, use, data, help |

Every page: `metadata` (title and description), `PageHeader` with the only `h1`, `Breadcrumbs`, both
languages, static (no runtime APIs; root params via `next/root-params`). Corporate pages carry a
corporate band (`CorporateNav`: section links on desktop, a `<details>` disclosure on phones,
`aria-current`, "Passenger site" link) and close with the prototype note linking to the official
corporate website.

## 2. Files

- Routes: `src/app/[lang]/corporate/**` (9 pages), `src/app/[lang]/about-this-prototype/page.tsx`,
  `src/app/[lang]/privacy/page.tsx`, `src/app/[lang]/terms/page.tsx`.
- Components (`src/components/corporate/`): `corporate-data.server.ts` (source resolution,
  provenance, dates, media merge), `corporate-sections.ts`, `corporate-nav.tsx`,
  `corporate-header.tsx`, `page-section.tsx`, `jump-nav.tsx`, `fact-list.tsx`, `fact-meta.tsx`,
  `milestone-list.tsx`, `person-list.tsx`, `brand-statement.tsx`, `section-index.tsx`,
  `media-list.tsx`, `traffic-table.tsx`, `link-out-card.tsx`, `business-area-card.tsx`,
  `contact-channel-list.tsx`, `contact-views.server.ts`, `prototype-note.tsx`, `storage-keys.ts`,
  `row-header.tsx` (sentence-case row headers; `Th` is styled as a column heading),
  `missing-fact.tsx` ("Not published" without the travel wording of `NotPublished`),
  `device-data.tsx` (the only Client Component), `corporate-content.test.ts`.
- Copy: `src/lib/i18n/features/corporate.ts` (about 450 keys per language; lists are keyed objects, read
  with `Object.values(getDictionary(lang).corporatePages…)` because `TKey` cannot index arrays).
- Content: `src/content/corporate.ts` extended below the original seed (unchanged): 68
  `CORPORATE_SOURCES`, key figures, milestones, ownership, leadership (`LEADERSHIP_CHECKED`),
  brand, group companies, Operating Agreements, recognition, projects, traffic, sustainability,
  accreditations, identity, `MEDIA_ITEMS`, `CORPORATE_LINKS`. Only facts from
  `docs/research/facts/f-corporate.json` with evidence `search` and confidence high or medium.
- Test: `e2e/corporate.spec.ts` (11 journeys, axe on every page; phone branches where the
  storage-key and traffic tables become stacked lists under 640 px).

## 3. Decisions

- **Provenance from sources.** `official` when any source is Malaysia Airports, a government body
  or a programme operator (ACI for carbon accreditation); otherwise `estimated` ("reported only by
  third parties"), shown with `ProvenanceTag` beside every fact, date and `SourceNote`.
- **Leadership is dated.** Chairman and MD with effective dates; chief officers "as listed on the
  management team page, read through search results on 16 November 2026"; roles without names
  listed as such; the full board is "Not published" with the official link.
- **No invented channels.** No procurement portal, whistleblowing line, media contact or leasing
  contact was found, so each says "Not published" and points to the official contact page.
- **Clear all data** removes every `ma:` key from local and session storage and the `lang` cookie,
  resets the core stores and display attributes, then reloads with `?cleared=N` so every feature's
  in-memory store starts empty; the count is announced (`role="status"`, focused) and the
  parameter removed. "Nothing to clear" is announced without a reload.
- **PDPA** is written as design intentions with an explicit "not a legal claim" callout; no claims
  about the text of the 2024 amendments (no sourced research for it).
- Vision and brand promise are English-only in the source, so the quotes carry `lang="en"`.

## 4. How to test

`npx vitest run src/components/corporate`; `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx
playwright test e2e/corporate.spec.ts --project=desktop --trace off` (and `--project=phone`).
By hand: keyboard through the corporate band (phone disclosure too), the privacy clear dialog
(focus trap, Escape, focus on the status after reload), `/ms/corporate/**`, dark and high contrast.

## 5. Known gaps

- The founding history (1991 to 1999 listing, klia2 opening) is prior knowledge in the research and
  is left out; the About page says so and links to the official site.
- Ownership stakes after completion, the full board, the remaining chief officers' names, contact
  details for media, leasing, advertising, cargo and procurement, and the whistleblowing channel
  are not in the research.
- Corporate statistics and stories are a November 2026 snapshot; the October 2026 traffic release
  was not yet published.
- Malay copy and Malay content are drafts pending native review.
- Not yet seen in a real Next runtime: the global header and footer around the corporate band,
  client navigation between corporate pages, the clear-all reload flow and the phone disclosure.
  Run the e2e spec first; it covers each of these.

## 6. Requests to other teams

- **domain**: register `CORPORATE_SOURCES` in `ALL_SOURCES` (and `validateAllContent`) so
  `resolveSources` and the concierge see them; until then the corporate pages use
  `resolveCorporateSources`. Index `MEDIA_ITEMS` and the new corporate pages in
  `buildSearchDocuments` (only `CORPORATE_PAGES` and `NEWS_ITEMS` are indexed; search links to
  `/corporate/network` and `/corporate/news/<slug>` both work). `content.test.ts` currently fails on
  KUL outlets (`publishes no outlets…`), unrelated to this feature.
- **foundation-ui**: the utility bar's "Corporate site" link shows an external-link arrow but
  points to the internal `/corporate`; the footer's "Our network" link goes to `/corporate/network`
  (works).
- **concierge, search, flights**: if you add a storage key, keep the `ma:` prefix so the privacy
  page's clear button removes it, and tell us to list it in `storage-keys.ts`.
