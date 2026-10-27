# Security Architecture

**Status:** the shipped build is a single-player, local-first browser game with no accounts, no server and no payments. Everything below marked *built* exists and is tested; everything marked *designed* is specified (often with code ready to run server-side) but **not deployed**. Passing automated tests does not make a production release secure: a launch needs a threat model review, a penetration test and the backend controls listed here.

## 1. Threat model (summary)

| Asset | Threats | Main controls |
|---|---|---|
| Player devices | malicious content (XSS, script injection, prototype pollution), hostile share links | data-only content, strict schemas, text screening, safe JSON parsing, no `innerHTML`, CSP-friendly code (no `eval`) |
| Game economy | client tampering, replay, duplicated rewards, sponsored content buying advantage | server-authoritative design, idempotent operations, template economic ceilings |
| Content pipeline | tampered or rolled-back files, compromised CDN, bad module taking the game down | sha256 per file, signed index (designed), kill switch, quarantine, last-known-good |
| Partner / sponsor trust | false labels, unverified prices or halal claims | verification-gated labels, policy enforced in the compiler |
| Children's privacy | profiling, contact, location | no chat/DMs, no location, no ad SDKs, no personal data in analytics or links |
| Staff tooling | privilege misuse | roles, RLS, audit log (designed); Studio is device-local only |

## 2. Content is data, never code — *built*

- Content files are JSON validated by `src/platform/validate.ts` (no `eval`/`Function`; works under a strict CSP). Unknown fields are errors, every string and list has a maximum size, numbers have ranges.
- Text fields reject markup, `javascript:`/`vbscript:`/`data:text/html` URLs, inline `on…=` handlers, control characters and bidi overrides. React renders text as text (no `dangerouslySetInnerHTML` anywhere).
- `safeParse()` refuses `__proto__`, `constructor` and `prototype` keys anywhere in a document (prototype pollution).
- Content can only *name* approved things: templates, behaviours, prefabs, props, icons, vehicle models, prep steps, sound beds (`catalog.ts`). Adding any of them is a code change.
- Index paths reject `..` and absolute paths; files over 512 KB are refused; module ids are pattern-checked.
- Links in modules must be `https:` and on an allowlist (empty in this build), open with `rel="noopener noreferrer"`, and are hidden in Zen Mode.

Tests: `src/platform/platform.test.ts` → "content validation rejects hostile or malformed data".

## 3. Integrity, rollback, kill switch — *built* (signature enforcement *designed*)

- Every file listed in `content/index.json` carries `sha256` and `bytes`; the loader re-hashes what it downloaded and quarantines mismatches. Tested with tampered bytes.
- Detached **ECDSA P-256 / SHA-256** signature over the exact bytes of the index (`verifySignature` in `src/platform/security/integrity.ts`), tested with generated keys, a tampered index and a missing signature. **Not enforced in this build** (`REQUIRE_SIGNED_CONTENT = false`, no `CONTENT_PUBLIC_KEY`) because no key management exists yet. Production: signing key in a KMS/HSM, public key compiled into the binary, enforcement on, key rotation via app updates.
- Fallback chain: remote → last-known-good (IndexedDB, only replaced by a fully clean set) → bundled copy. Cache and bundle are re-hashed and re-validated on every load.
- Remote kill switch (`killSwitch.modules`), per-module `enabled`, staged `rolloutPercent`, feature flags — all data, effective on next load.
- Isolation: a quarantined/killed/expired module reverts its building to neutral; player state is preserved (see MODULAR_ARCHITECTURE.md). Tested end to end ("module isolation").

## 4. Server-authoritative economy — *designed* (engine ready)

The browser is never trusted for anything of value. Planned online mode:

- The client sends **intents** (`{ type: 'produce', uid, recipe }`), never results. The server runs the same pure `applyAction` (`src/game/core/actions.ts`) against the authoritative state and the server clock, and returns the new state + events.
- Every mutating request carries an **idempotency key** (op id). The engine already models this for community contributions (`contribute` ignores repeated `opId`s — tested); the server stores processed keys per player.
- Optimistic concurrency: state version numbers; conflicting writes are rejected and re-synced.
- Rate limits per account and per IP (token bucket) on actions, content fetches and share-link resolution; abuse signals feed moderation.
- Purchases (if ever added) are validated server-side against the store's receipt APIs; the client never grants premium currency.
- Server-side input validation reuses `src/platform/validate.ts` schemas.

## 5. Roles and data access — *designed*

Roles: **Platform Admin**, **Content Reviewer**, **Business Manager**, **Business Editor**, **Player**. Postgres row-level security enforces them; see `backend/schema.sql`.

| Capability | Admin | Reviewer | Biz Manager | Biz Editor | Player |
|---|---|---|---|---|---|
| Read own save / write via game API | – | – | – | – | ✓ |
| Draft module content for own business | – | – | ✓ | ✓ | – |
| Submit for review | – | – | ✓ | – | – |
| Approve / reject / retire | ✓ | ✓ | – | – | – |
| Publish signed content index, kill switch | ✓ | – | – | – | – |
| See own business's aggregated analytics | ✓ | – | ✓ | – | – |
| Manage roles | ✓ | – | – | – | – |

Separation of duties: a business can never approve its own content; publishing requires an admin; every state change writes an append-only audit record (who, what, when, before/after hash).

## 6. Audit logging

- *Built (device-local)*: `src/platform/security/audit.ts` records content loads, rejections, quarantines, world fallbacks and Studio actions (Studio → Audit log). It's a diagnostic aid only — anyone with the device can edit it.
- *Designed*: server-side append-only `audit_log` table (no UPDATE/DELETE grants), shipped to write-once storage.

## 7. Privacy and younger players — *built* by omission, *designed* for online

- No accounts, no open chat, no direct messages, no location, no contacts, no ad or attribution SDKs, no third-party trackers.
- Analytics are local only (`src/services/analytics.ts`), opt-out in Settings, and never leave the device in this build. Online aggregates for partners would be k-anonymised counts (e.g. "visits to the showroom per day, regions with ≥ 50 players"), never individual-level, never used to profile children, never shared with institutions as personal data.
- Mood or sensitive data is never inferred or used for targeting. Zen Mode is a setting, not a signal.
- Share links contain only layout, neighbourhood name and level (tested: no coins, items, names, stats, history). Incoming visit codes are size-capped, decoded without eval, schema-checked; visiting is read-only and never writes the visitor's save (tested in e2e).
- Online social features (when built) must default to friends-only, use preset phrases rather than free text for under-16s, and include reporting/blocking.

## 8. Client hardening

- No secrets in client code (there are none to hold; future API keys stay server-side). No AI API keys.
- Service worker caches only same-origin GET requests; skipped inside iframes and on non-https origins.
- Storage access is wrapped (`safeStorage`) so blocked storage can't crash the game.
- Recommended CSP for production hosting: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://<content-cdn>; worker-src 'self'; frame-ancestors 'none'`.

## 9. Supply chain

- Third-party 3D assets and sounds are CC0, imported with sha256 verification (`scripts/asset-pipeline`); see ASSET_LICENSES.md.
- npm dependencies are pinned via `package-lock.json`; run `npm audit` in CI and review updates.

## 10. Before a public launch (checklist)

- [ ] Backend deployed with RLS, rate limits, idempotency store, server-side `applyAction`.
- [ ] Content signing key in KMS; enforcement on; key rotation plan.
- [ ] External penetration test and threat-model review.
- [ ] Privacy review (PDPA Malaysia; COPPA/GDPR-K equivalents for other markets); age-appropriate design assessment.
- [ ] Incident response runbook for content kill switch and account abuse.
