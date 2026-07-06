# Future Founder & Leader — Curriculum Package

A supplementary, project-based curriculum for ages 9–16 built for an AI-first world. It complements school by focusing on high-leverage capabilities: thinking, communicating, building, and creating value. Content is authored as validated JSON and designed to be rendered by an interactive learning app.

## What's in this package

```
README.md                 <- you are here
CLAUDE_CODE_BRIEF.md      <- instructions to scaffold the app that renders this content
curriculum.schema.json    <- THE CONTRACT. Every content file conforms to this.
SPEC.md                   <- the design spec (paste when generating more content)
GENERATOR.md              <- reusable prompt to generate one more cell (pillar x age x quarter)
content/                  <- the curriculum itself: one JSON file per quarterly project
scripts/validate.py       <- validate all content + check prerequisite links
```

## Data model (quick version)
- A **Project** = one quarter of one pillar for one age band, containing an ordered array of **Lessons**.
- Each **Lesson** follows a fixed six-step loop: concept → real_example → apply_task → reflection_prompt → feedback_task → teach_back_task, plus an `ai_judgment_note` (when to use / NOT use AI).
- Projects link via `prereq_project_ids`; lessons via `prereq_lesson_ids`. The app uses these to sequence and gate the journey.
- Long-form fields are **Markdown strings inside JSON** — render them as Markdown.
- ID convention: project `{pillarcode}-{ageband}-q{n}`, lesson `{projectid}-l{n}`. Pillar codes: th, co, bu, le, cw, ex, lw, cr.

## Current coverage
Load-bearing pillars are Think, Communicate, Build, Create Wealth (4 pillars x 4 quarters per band).

| Age band | Status |
|----------|--------|
| 9–10  | COMPLETE (16/16 projects) |
| 11–12 | COMPLETE (16/16 projects) |
| 13–14 | Sample only (1 project — `cw-13-14-q1`, the reference implementation) |
| 15–16 | Not yet generated |

The **9–12 young cohort is complete and shippable**: 32 projects across two full years, each year ending in a shared capstone (Showcase Day at 9-10, a real Launch at 11-12) where the four pillars converge, with the Think pillar as the planning hub. Plus the 13-14 sample = 33 projects total in `content/`.

## First steps for the app builder
1. Read `CLAUDE_CODE_BRIEF.md` and scaffold the app.
2. Wire `scripts/validate.py` (or an `ajv` equivalent) as a build/pre-commit check so no off-spec file ever enters the app.
3. Build the loader + journey map + six-step lesson view against the 9-10 band, confirm gating works end to end, then the rest is just more content.

## To extend the curriculum later
Each new cell is one generation session: paste `SPEC.md`, then `GENERATOR.md` with the four placeholders filled (pillar, age band, quarter, lesson count). Save the output as `content/{pillar}-{ageband}-q{n}.json` and run `python scripts/validate.py`. Remaining to complete the load-bearing core: 13–14 (15 projects) and 15–16 (16 projects).

## Note on assets
Lessons reference printables/worksheets in each lesson's `assets_needed`. These are not yet generated — a deduplicated asset manifest can be produced from the content as a separate batch when you're ready to create the printables.
