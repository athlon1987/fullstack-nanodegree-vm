You're building an interactive learning app from a curriculum package I've unzipped into this repo. Before writing any code, read README.md, CLAUDE_CODE_BRIEF.md, and curriculum.schema.json. The schema is the contract — treat it as law.

CONTEXT
- content/ holds 33 JSON files. Each file is one quarterly "Project" containing an ordered array of "Lessons".
- The 9–12 young cohort (age bands 9-10 and 11-12) is complete; 13-14 has one sample file.
- Each lesson follows a fixed six-step loop: concept → real_example → apply_task → reflection_prompt → feedback_task → teach_back_task, plus an ai_judgment_note.
- Projects link via prereq_project_ids; lessons via prereq_lesson_ids. Use these for sequencing and gating.
- All long-form fields are Markdown strings inside JSON — render them as Markdown.
- Never modify anything under content/ or curriculum.schema.json. Do not invent curriculum content.

BUILD IN THIS ORDER, then STOP after step 4 for my review:

1. Validation first. Wire schema validation as `npm run validate` and a pre-commit hook (use ajv, and generate TypeScript types from curriculum.schema.json so code and content share one contract — scripts/validate.py is a reference implementation). No content file may enter the app without passing.

2. Scaffold. Vite + React + TypeScript + Tailwind. On startup/build, load every content/*.json, validate, index by id, group by age_band and pillar_primary, and order lessons by sequence.

3. Journey + gating. A journey map showing projects as milestones (per age band) and lessons as steps within each. Use the prereq fields to lock nodes until their prerequisites are complete. Persist per-child progress locally (localStorage or a simple local store — no backend yet).

4. Lesson view. Render the six steps in fixed order as Markdown. Give teach_back_task clear visual prominence (it's the retention step). Show ai_judgment_note as a distinct, consistent element on every lesson. Let a child check off each success_criteria item.

MILESTONE
The 9-10 band works end to end: I can open it, see the journey map, move through gated lessons, and have my progress persist across reloads. Confirm `npm run validate` passes, then show me the running 9-10 flow before building anything further.

If you'd deviate from CLAUDE_CODE_BRIEF.md anywhere, say so and why before proceeding.
