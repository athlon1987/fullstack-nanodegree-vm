# Future Founder — Learning App

An interactive learning app that ingests the **Future Founder & Leader** curriculum
(authored externally as validated JSON) and renders it as a gated, per-child journey.
The app validates, loads, sequences, and renders the content and tracks a child's
progress node-by-node — local-first, no backend.

Built per [`docs/CLAUDE_CODE_BRIEF.md`](docs/CLAUDE_CODE_BRIEF.md). The schema
([`curriculum.schema.json`](curriculum.schema.json)) is the single source of truth —
content and code share it as one contract.

## Quick start

```bash
npm install
npm run validate   # validate all content against the schema (also runs on build + pre-commit)
npm run dev        # start the app at http://localhost:5173
```

## What's here

```
curriculum.schema.json     # THE CONTRACT — every content file conforms to this (do not edit)
content/                   # 33 quarterly Project JSON files (do not edit)
scripts/
  validate.ts              # npm run validate — ajv schema check + prereq resolution (CI + pre-commit)
  validate.py              # reference Python validator (from the curriculum package)
src/
  lib/
    curriculum.types.ts    # TS types GENERATED from the schema (npm run gen:types)
    validation.ts          # shared ajv validation + prereq-resolution logic
    loadContent.ts         # load every content/*.json, validate, index by id, group, order lessons
    progress.ts            # per-child progress store (localStorage, no backend)
    gating.ts              # derives completion + lock state from prereq graph + progress
  components/
    JourneyMap.tsx         # projects as milestones (per age band), lessons as gated steps
    LessonView.tsx         # the six-step loop; teach-back is prominent; success criteria checkable
    AiJudgmentCard.tsx     # ai_judgment_note as a distinct, consistent element on every lesson
    Markdown.tsx           # renders Markdown-in-JSON content fields
    ChildBar.tsx           # per-child profile switcher
docs/                      # curriculum package docs (BRIEF, SPEC, GENERATOR, KICKOFF)
```

## How it works

1. **Validation is the gate.** `npm run validate` compiles the schema with `ajv`,
   validates every `content/*.json`, and checks that all `prereq_project_ids` /
   `prereq_lesson_ids` resolve. It runs on `npm run build` and as a **pre-commit hook**
   (husky) — no off-spec file enters the app. The same `src/lib/validation.ts` module
   runs again at app startup, so the running app never renders invalid content.
2. **Types come from the schema.** `npm run gen:types` regenerates
   `src/lib/curriculum.types.ts` from `curriculum.schema.json` via
   `json-schema-to-typescript`, so code and content can't drift.
3. **Loading + indexing.** On startup the loader imports every content file, validates,
   indexes projects and lessons by `id`, groups projects by `age_band` and
   `pillar_primary`, and orders lessons by `sequence`.
4. **Journey + gating.** The journey map shows projects as milestones (pillar columns
   per age band) and lessons as steps. Nodes lock until their prerequisites are complete.
   A lesson is complete when all its `success_criteria` are checked; a project is complete
   when all its lessons are.
5. **Lesson view.** Renders the six steps in fixed order — concept → real_example →
   apply_task → reflection_prompt → feedback_task → **teach_back_task** (given visual
   prominence, the retention step) — plus the `ai_judgment_note` as a distinct card on
   every lesson, and checkable `success_criteria`.
6. **Progress** is stored per child in `localStorage` and persists across reloads.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run validate` | Validate all content against the schema + check prereqs |
| `npm run gen:types` | Regenerate TS types from the schema |
| `npm run build` | Validate, typecheck, and build for production |
| `npm run typecheck` | Type-check without emitting |

## Notes / deviations from the brief

- **Tailwind v4** (via `@tailwindcss/vite`) instead of an unpinned Tailwind — current and
  simpler (no `postcss`/`tailwind.config` needed).
- Content is loaded via an in-memory store (`import.meta.glob`) rather than SQLite —
  the brief allows either for v0, and the corpus is small.
- Everything else follows `docs/CLAUDE_CODE_BRIEF.md`.
