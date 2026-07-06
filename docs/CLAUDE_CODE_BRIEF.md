# CLAUDE_CODE_BRIEF — scaffold the Future Founder app

Paste this into Claude Code once, in an empty repo, to build the shell that ingests the curriculum content.

## What we're building
An interactive learning app for kids 9–16. Content is authored **externally** as JSON files (one Project per quarter, each with nested Lessons) and dropped into `/content`. The app's job is to validate, load, sequence, and render them, and to track a child's progress node-by-node.

## Hard requirements
1. **Schema is law.** Use `curriculum.schema.json` (in repo root) as the single source of truth. Add a validation step that runs on every content file and **fails the build** if any file is off-spec. Wire it as a pre-commit hook and an `npm run validate` script using `ajv`.
2. **Content pipeline.** On startup (or build), load every `content/*.json`, validate, and index by `id`. Expose projects grouped by `age_band` and `pillar_primary`, lessons ordered by `sequence`.
3. **Sequencing + gating.** Use `prereq_project_ids` and `prereq_lesson_ids` to lock nodes until prerequisites are complete. The child sees a journey map (projects as milestones, lessons as steps within).
4. **The six-step lesson view.** Render each lesson as the fixed loop in order: concept → real_example → apply_task → reflection_prompt → feedback_task → teach_back_task. All are Markdown strings — render them as Markdown. Give `teach_back_task` visual prominence (it's the retention step).
5. **Progress tracking.** Persist per-child completion of lessons and projects, and let a child mark `success_criteria` as met (self- or parent-checked). Keep it local-first for the MVP.
6. **AI-judgment surfacing.** Show `ai_judgment_note` as a distinct, consistent UI element on every lesson so the "when NOT to use AI" habit is visible, not buried.

## Recommended stack (MVP, adjust as you see fit)
- Vite + React + TypeScript, Tailwind for UI.
- SQLite (via better-sqlite3) or even a JSON-loaded in-memory store for v0 — content is small.
- `ajv` for schema validation; generate TS types from the JSON Schema (`json-schema-to-typescript`) so content and code share one contract.
- Markdown rendering via `react-markdown`.

## Repo shape to create
```
/curriculum.schema.json      # the contract (already provided)
/content/                    # generated Project JSON files land here
  cw-13-14-q1.json           # (seed with the provided sample)
/src/
  lib/loadContent.ts         # load + validate + index
  lib/types.ts               # generated from schema
  components/JourneyMap.tsx
  components/LessonView.tsx   # the six-step loop
  components/AiJudgmentCard.tsx
/scripts/validate.ts         # npm run validate — CI + pre-commit
```

## First run
Seed `/content` with the provided `sample.cw-13-14-q1.json`, build the loader + JourneyMap + LessonView against it, and confirm the six-step view and gating work end-to-end on that one cell **before** any more content is generated. One real cell proves the pipeline; then the content sessions just accrete files into `/content`.
