# Backend (design — not deployed)

Nothing in this folder runs today. The shipped game is local-first and needs no server. This is the reviewed design for the online version: accounts, cloud saves, a server-authoritative economy, the partner content workflow and signed content releases.

## Shape

- **Postgres** (e.g. Supabase or Cloud SQL) with row-level security — `schema.sql`.
- **Auth**: email / Apple / Google sign-in; players under 13 (or the local age of digital consent) only with a parent-managed account.
- **Game API** (one serverless function per route), all authenticated, rate-limited, idempotent:
  - `POST /v1/actions` — `{ opId, action }` → runs the same pure `applyAction` from `src/game/core/actions.ts` against the stored save with the server clock; stores `opId` so retries apply once; returns `{ state, events }`. The client never sends results, only intents.
  - `GET /v1/save` / `POST /v1/save/migrate` — load; one-time import of a local save (sanitised, values clamped, flagged for review if implausible).
  - `GET /v1/visit/:code` — resolves short share codes to the public layout snapshot (no private fields; same validator as the client).
- **Content API** (staff only): draft → submit → review → approve → publish. Publishing builds `index.json` with the same `scripts/content/build-index.ts`, signs it with an ECDSA P-256 key held in a KMS, uploads to the CDN, and records a `content_releases` row.
- **Analytics**: daily aggregates only (`analytics_daily`), small-cell suppression (< 50 players → hidden), no device ids, no children's data.

## Security controls

| Control | Where |
|---|---|
| Row-level security for every table | `schema.sql` policies |
| Roles: platform_admin, content_reviewer, business_manager, business_editor, player | `profiles.role`, `business_members.role` |
| Separation of duties (no self-approval) | `module_versions` check + policy |
| Idempotency | `action_log (user_id, op_id)` primary key |
| Optimistic concurrency | `saves.revision` compare-and-swap |
| Rate limits | API gateway token buckets per user and IP |
| Append-only audit | `audit_log` with no UPDATE/DELETE grants |
| Signed content | `content_releases.signature`; public key compiled into the client |

## Not decided yet

Hosting region (data residency for MY), age-verification provider, CDN, the exact store-billing integration (only if monetisation is ever enabled — see docs/MONETIZATION_COMPLIANCE.md).
