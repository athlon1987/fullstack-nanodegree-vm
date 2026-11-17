# Hand-off: AI airport concierge

Owner: concierge. Status (17 Nov 2026): `npx tsc --noEmit` clean for these files; `npx eslint` clean
on every path below; `npx vitest run src/lib/concierge` 43 passed; `PLAYWRIGHT_BASE_URL=http://localhost:3000
npx playwright test e2e/concierge.spec.ts` 14 passed (desktop and phone), axe (wcag2a, wcag2aa,
wcag21aa, wcag22aa) zero violations on the consent screen, an answer, the Malay page and the open
panel. No sideways scroll at 360 px. `next build` not run (shared folder).

## What it does

A grounded concierge that answers passenger questions in English and Bahasa Malaysia from the
content layer and the demo flight provider, and nothing else.

1. **Understands** the question (`understand.ts`): intent (check-in, terminal transfer, transport,
   dining, facility, layover, parking, lost property, assistance, flight delay, flight status,
   gate, notices, contact, greeting, unknown) and slots: airport (names, aliases such as klia2,
   upper-case codes only), terminal, flight number (gate "C12" and "KL Sentral" are not flights),
   transport destination, facility category, duration ("six-hour", "2 days", "enam jam"), gate,
   priority (cheapest, fastest), airline. Follow-ups ("and in Terminal 2?") keep the topic.
2. **Retrieves**: structured lookups first (airline check-in facts, facilities by category,
   transport by destination with published fares, outlets, car parks with `calculateParking`,
   notices with their state), then scored passages (FAQ answers, guide steps, airport guide
   notes; Terminal 1 steps are not shown for Terminal 2), then the site search engine
   (`searchAll`, keeping only hits that share a real word with the question).
3. **Answers** (`engine.ts`, pure): short text, statements each with a provenance tag and source
   ids, cards (flight, facility, outlet, transport, car park), follow-up links, limits ("what we
   do not know"), a hint, a clarifying question with airport options when one is needed, and an
   escalation block with the official contacts when data is missing or a person is needed.
   Demo flights are tagged `demo`, never cited as sources, and set `answer.demo`. Templates in
   the `engine` group of the namespace file only frame values from the content.
4. **API** `POST /api/concierge` (`src/app/api/concierge/route.ts`): zod validation
   (`request.ts`: question 1 to 400 characters, `lang`, optional `airport`, `terminal`, saved
   `flightId`, previous `intent`/`category`/`destination`), 4 KB body cap, in-memory token
   bucket per client (10 burst, 1 per 6 s; a documented placeholder for a gateway limit), the
   engine, then optional AI wording. Responds `{ mode: 'grounded' | 'grounded-rephrased', answer }`,
   `Cache-Control: no-store`, `X-Data-Mode`. 400/413/415/429 with `{ error: { code, message } }`.
   The question is never logged.
5. **AI wording** (`rephrase.server.ts`): only when `ANTHROPIC_API_KEY` is set. Raw `fetch` to the
   Messages API (`anthropic-version: 2026-10-21`; the SDK is not a dependency), model from
   `CONCIERGE_MODEL` (default `claude-opus-5-5`), `output_config.effort: 'low'`, server-side
   refusal fallbacks for models that accept them, 8 s timeout. It sends the question, the draft
   and the statements only. Only `answer.text` can change; the reply must end with `end_turn` and
   pass the fact guard (`fact-guard.ts`: no number or capitalised name absent from the context).
   Any failure keeps the deterministic text.
6. **UI**: the panel (`ConciergePanel`, same export, driven by `useOverlayDialog('concierge')`,
   honours `payload.question`) and the page `/[lang]/concierge`. First-use consent (what is sent,
   nothing stored on the server, conversation in this tab only, AI wording, limits), example
   questions, "answering for" airport chip (from the remembered airport, then each answer),
   opt-in "include my saved flight", a `role="log"` conversation with one polite `role="status"`
   announcement per answer, answers with provenance tags, source notes, cards, next steps,
   escalation, mode label, `DemoDataBanner` + `Freshness` for demo flights, `TranslationNotice`
   when Malay falls back to English, clear conversation and retry.
7. **Offline**: if the API fails (offline, timeout, 5xx, 429) the same engine runs in the
   browser with the knowledge pack from `/[lang]/concierge/knowledge.json` (static, about 81 KB
   gzipped, prefetched at idle once consent is given). Answers say "Answered on this device".

## Files

- `src/lib/concierge/`: `types.ts`, `constants.ts`, `text.ts`, `understand.ts`, `retrieve.ts`,
  `engine.ts`, `flights.ts`, `knowledge.server.ts` (server only), `request.ts`, `rate-limit.ts`,
  `fact-guard.ts`, `rephrase.server.ts` (server only), `engine.test.ts`, `server.test.ts`.
- `src/app/api/concierge/route.ts`; `src/app/[lang]/concierge/page.tsx`,
  `src/app/[lang]/concierge/knowledge.json/route.ts`.
- `src/components/concierge/`: `concierge-panel.tsx` (light; lazy-loads the rest),
  `concierge-chat.tsx`, `concierge-answer.tsx`, `concierge-cards.tsx`, `use-concierge.ts`.
- `src/lib/i18n/features/concierge.ts` (UI copy and engine phrases, both languages);
  `e2e/concierge.spec.ts`.
- Storage keys: `ma:concierge-consent:v1` (local), `ma:concierge-conversation:v1` (session).

## How to test

- Unit: `npx vitest run src/lib/concierge`. `engine.test.ts` covers every example question
  (grounded with a source, or "not available" plus escalation), Malay, unknown flights, and a
  property check over 38 questions x 7 airport contexts x 2 languages: no number or name in any
  answer string that the content, the demo flights or the question does not contain; every
  source id resolves; demo data is always flagged.
- E2E: `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test e2e/concierge.spec.ts`.
- By hand: `/en/concierge`, agree, try the examples; choose no airport and ask for a prayer room
  (clarify); ask "Where do I check in for <a flight on the KUL board>?" (demo label); block
  `/api/concierge` in devtools (local mode); switch to BM; open the panel from the header or menu.
- AI wording: set `ANTHROPIC_API_KEY` (and optionally `CONCIERGE_MODEL`) on the server; answers
  then show "Worded by AI from verified content" when the rewording passes the guard.

## Known gaps

- Coverage follows the content: KUL parking rates, Wi-Fi, toilets and most outlet positions are
  not published, so those answers say so and escalate. "Nearest" cannot be computed (no user
  position, few mapped points); the answer says so.
- Intent detection is rule-based; unusual phrasing falls to search and may answer with "not
  verified" plus contacts. Malay coverage is narrower than English; Malay copy is a draft.
- The rate limiter is per process and trusts `x-forwarded-for`; production needs a gateway limit.
- The AI path was tested with a mocked `fetch` only (no key in this environment).
- The knowledge pack is per language and includes the search documents; trimming it is possible.

## Requests to other teams

- Guides: `/help/<topic>#<faq-id>` and `/guides/<slug>#<section-id>` anchors are used for "More
  details" links; please keep those ids on the rendered FAQ items and guide sections.
- Foundation-ui: the service worker (when added) could cache `/[lang]/concierge/knowledge.json`
  so the concierge also works on a cold offline start.
- Content: Wi-Fi, toilets, prayer room locations and KUL parking rates are the most-asked gaps.
