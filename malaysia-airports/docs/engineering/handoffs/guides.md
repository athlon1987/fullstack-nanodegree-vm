# Hand-off: guides, transit planner, accessibility hub and help centre

Owner: guides. Status (17 Nov 2026): `npx tsc --noEmit` clean (whole project, 0 errors); `npx eslint` on my
paths clean; `npx vitest run src/components/guides` 17 of 17 and content validation passes (the one failing
`content.test.ts` case is the commerce outlets check, not mine); `e2e/guides.spec.ts` 20 of 20 on desktop and
phone against the dev server, axe zero violations on every page it scans. No sideways scroll at 360 px with
125% text on any route, one `h1` per page. `next build` not run (shared folder rule).

## Routes

| Route | What it is | Rendering |
|---|---|---|
| `/[lang]/guides` | Hub: 11 guides grouped Before you fly / Borders and arriving / Extra needs, "applies to" filter (domestic, international, Sabah and Sarawak rules), next steps (KLIA transit, My journey, help) | Static; the filter is the only client code |
| `/[lang]/guides/[topic]` | departing, arriving, check-in, security, immigration-customs, baggage, families, first-time, reduced-mobility, neurodivergent, older-travellers. Numbered steps, each with provenance tag, sources, actions and scope chips; "On this page"; sourced airport notes; related guides; all sources | Static, `ensureStatic = 'navigation'` |
| `/[lang]/[airport]/transit` | KLIA: interactive planner (terminals, ticket type, leg scopes, layover) with case, steps, sourced facts per step, time estimate graded against the layover, official terminal-change note and options, rest options, late-flight answers. Other airports: their sourced notes, honest empty state, basics, link to KLIA | Prerendered for KUL plus every airport with content; others on demand. Planner state in the URL: `?from=T1&to=T2&ticket=self&arr=intl&dep=dom&layover=180` |
| `/[lang]/accessibility` | Ask for assistance (airline and airport), Butterfly Effect and Calm Rooms, accessible facilities (links into map `?sf=1`, `?cat=accessible-toilets`, facilities `?access=1`, `?cat=calm-room`), the shell's `PreferencesControls`, accessibility statement | Static; settings are client |
| `/[lang]/help` | Search across every FAQ (form falls back to `/search?q=` without JS), common questions, topic grid, scam alert, who handles what, escalation ladder, official contacts and official links | Static |
| `/[lang]/help/[topic]` | Topic lead block (contacts, escalation or who-handles-what), FAQ accordion with deep links `#<faq-id>` and copy-link, related and official pages, other topics | Static, `ensureStatic = 'navigation'`; `<noscript>` copy of the answers |

Existing links into these routes keep working: `/help/flights`, `/help/terminals`, `/help/<topic>#<faq-id>`
(search index), `/accessibility`, `/<airport>/transit` (journey timeline, for any airport).

## Files

- Pages: `src/app/[lang]/guides/page.tsx`, `guides/[topic]/page.tsx`, `src/app/[lang]/[airport]/transit/page.tsx`,
  `src/app/[lang]/accessibility/page.tsx`, `src/app/[lang]/help/page.tsx`, `help/[topic]/page.tsx`.
- `src/components/guides/`: `guide-meta.ts` (icons, groups, related, note topics), `guide-scopes.ts` (the
  "applies to" map, keyed `<guide>/<step>`), `guide-views.server.ts`, `guide-steps.tsx`, `guide-card.tsx`,
  `guide-index.tsx`, `guide-action-link.tsx`, `scope-chips.tsx`, `next-step-cards.tsx`, `fact-card.tsx`,
  `transit-logic.ts` (+ `.test.ts`), `transit-data.server.ts`, `transit-planner.tsx`, `transit-planner-url.tsx`,
  `accessibility-data.server.ts`.
- `src/components/help/`: `help-meta.ts`, `help-views.server.ts`, `faq-accordion.tsx`, `help-search.tsx`,
  `copy-link-button.tsx`, `contact-list.tsx`, `official-links.tsx`, `who-handles.tsx`, `escalation-ladder.tsx`.
- Copy: `src/lib/i18n/features/guides.ts` (`guidePages.*`, both languages). Test: `e2e/guides.spec.ts`.

## Content added (append-only)

- `src/content/guides.ts`: 10 guides appended to `GUIDES` (the seed `departing` is unchanged).
- `src/content/faqs.ts`: help topics `feedback`, `scams`, `privacy`; 21 FAQs (flights and delays, feedback
  and escalation, scams, privacy, lost property, wheelchair, liquids, power banks, missing bag, changing
  KLIA terminals). The KLIA terminal-change FAQ is filed under `parking-transport` because
  `content.test.ts` pins the `terminals` count for KUL at 2.
- `src/content/sources.ts`: 26 sources (retrieved 17 Nov 2026; the feedback site and the special assistance
  URL were observed on 16 Nov). Official hosts could not be fetched from the container, so titles say
  "as summarised in search results" where that is the basis.
- Provenance choices: Mavcom's 5-hour refund rule is `official` (regulator statement reported by The Star);
  the 2-hour care rule rests on a law-firm summary, so `estimated`. Customs allowances are deliberately not
  published (sources disagree). Sarawak MyKad entry is `estimated` (press report only).

## Transit planner assumptions (all shown as "Estimated", never as airport figures)

Ranges in minutes: leave aircraft 10–25, airside transfer 15–40, immigration 15–60, bags 15–45, customs 5–15,
between terminals 15–35, check-in 10–30, passport control and security 15–45 (domestic 10–25), walk to gate
10–25; check-in closes 60 (international) / 45 (domestic) and gates 20 minutes before departure. Landside
cases take the later of "reach check-in before it closes" and "reach the gate before it closes". Every
result says to confirm the minimum connection time with the airline. The same-terminal airside route is
our guidance: no official description of KLIA's transfer route was found.

## How to test

- `npx vitest run src/components/guides`
- `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/guides.spec.ts --project=desktop --trace off`
  (also `--project=phone`). Axe (wcag2a/2aa/21aa/22aa) runs on the hub, a guide, the planner, Penang transit,
  the help hub, a deep-linked topic and the accessibility page.
- By hand: `/en/kul/transit` keyboard only (arrow keys in each segmented control), switch to Terminal 2 and
  45 min; `/en/help/flights#flight-delay-refund`; `/ms/guides/immigration-customs`; `/en/pen/transit`.

## Known gaps

- The shared dev server held stale copies of `guides.ts`, the dictionaries and `faqs.ts` for a while (an
  older root-layout chunk stayed in memory); a real edit to the changed file refreshed it. Exports appended
  to `src/content/guides.ts` were not picked up at all, which is why the scope map lives in
  `src/components/guides/guide-scopes.ts`. A production build is unaffected.
- No nursing rooms, accessible toilets or family facilities are verified; the guides say so.
- Malay guide and FAQ content is a draft, like the rest of the Malay copy.
- The planner models KLIA only (T1 and T2). Penang, Kota Kinabalu and others get the simpler page.
- `/privacy` and `/about-this-prototype` are linked from help topics; they belong to corporate-network.

## Requests to other teams

- Domain: a per-step `appliesTo` field on `GuideStep` would let the scope map move into the content layer.
- Domain/content: official liquids, customs-allowance and special-assistance pages should be read first
  hand when the hosts are reachable; several sources are search summaries.
- Concierge/search: the new FAQs and guides are already in the search index via `FAQS`/`GUIDES`; the
  concierge may want to cite the delay and scam answers.
- Shell: move focus to the `h1` after client navigation (affects deep links into long pages).
