# GENERATOR — run once per cell (fill the placeholders)

> Paste `SPEC.md` first in the session, then this, with the four placeholders set.

Generate the curriculum cell below as a single JSON object conforming to `curriculum.schema.json`.

- **Pillar:** {{PILLAR}}            e.g. wealth
- **Age band:** {{AGE_BAND}}        one of 9-10 | 11-12 | 13-14 | 15-16
- **Quarter:** {{QUARTER}}          1–4
- **Lesson count:** {{N_LESSONS}}   default 5–6; never pad

Procedure (do this internally, output only the JSON):
1. Write `developmental_frame` and `authentic_value_meaning` for this exact age first. Everything else must obey them.
2. List candidate sub-skills for this pillar at this age, rank by leverage, **cut the bottom third**, keep the top {{N_LESSONS}}.
3. Design ONE project whose `artifact` is a real, tangible thing, with a single named `motivation_lever`.
4. Write the lessons, each carrying the full six-step loop and an honest `ai_judgment_note` (including when NOT to use AI).
5. Set `prereq_*` links to the prior quarter/lesson where a real dependency exists (leave empty otherwise).
6. Make every `success_criteria` parent-observable.

Emit only the JSON. No fences, no commentary.

---

## Session cadence (how the corpus accretes over time)
Run one cell per sitting. A natural order that keeps prerequisites clean:
- Start with the four load-bearing pillars for the **11-12** band (your app's likely first real cohort), Q1 → Q4.
- Then extend up to 13-14 and 15-16 (dependencies flow upward), and down to 9-10.
- Supporting pillars (Lead/Explore/Live Well/Create) can lag — weave them as supporting pillars inside the load-bearing projects first, then backfill dedicated cells only where they earn a standalone project.

## Validate before ingest
After each session, save the JSON as `content/{{PILLAR}}-{{AGE_BAND}}-q{{QUARTER}}.json` and run the validator (see CLAUDE_CODE_BRIEF.md). A file that fails schema never enters the app — that check is what keeps 40+ generation sessions consistent.
