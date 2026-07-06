import type { CurriculumIndex, Lesson, OrderedProject } from '../lib/loadContent';
import { PILLAR_META } from '../lib/loadContent';
import type { Child } from '../lib/progress';
import { setLessonComplete, toggleCriterion } from '../lib/progress';
import {
  isLessonComplete,
  isLessonUnlocked,
  lessonLockedBy,
} from '../lib/gating';
import { Markdown } from './Markdown';
import { AiJudgmentCard } from './AiJudgmentCard';

interface Props {
  index: CurriculumIndex;
  child: Child | null;
  lessonId: string;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}

/** The six steps, rendered in fixed order. teach_back is given prominence. */
const STEPS: {
  key: keyof Pick<
    Lesson,
    | 'concept'
    | 'real_example'
    | 'apply_task'
    | 'reflection_prompt'
    | 'feedback_task'
    | 'teach_back_task'
  >;
  n: number;
  label: string;
}[] = [
  { key: 'concept', n: 1, label: 'Concept' },
  { key: 'real_example', n: 2, label: 'Real example' },
  { key: 'apply_task', n: 3, label: 'Apply it' },
  { key: 'reflection_prompt', n: 4, label: 'Reflect' },
  { key: 'feedback_task', n: 5, label: 'Get feedback' },
  { key: 'teach_back_task', n: 6, label: 'Teach it back' },
];

export function LessonView({ index, child, lessonId, onBack, onOpenLesson }: Props) {
  const lesson = index.lessons[lessonId];
  if (!lesson) {
    return (
      <div className="p-8">
        <p>Lesson not found.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 underline">
          Back to journey
        </button>
      </div>
    );
  }

  const project: OrderedProject = index.projects[index.lessonToProject[lessonId]];
  const meta = PILLAR_META[project.pillar_primary];
  const unlocked = isLessonUnlocked(index, child, lesson);
  const complete = isLessonComplete(child, lesson);

  const checked = child?.progress.criteria[lesson.id] ?? [];
  const allChecked = lesson.success_criteria.every((_, i) => checked.includes(i));

  // Sibling lessons for prev/next navigation within the project.
  const siblings = project.lessons;
  const pos = siblings.findIndex((l) => l.id === lesson.id);
  const next = siblings[pos + 1];

  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-6">
      {/* Breadcrumb + back */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        ← Journey map
      </button>

      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span
          className="rounded px-1.5 py-0.5 text-white"
          style={{ backgroundColor: meta.accent }}
        >
          {meta.label}
        </span>
        <span>· {project.title} · Q{project.quarter}</span>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">
        Lesson {lesson.sequence}: {lesson.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">~{lesson.est_minutes} minutes</p>

      {!unlocked && (
        <div className="mt-4 rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          🔒 This lesson is locked. Finish first:{' '}
          <strong>{lessonLockedBy(index, child, lesson).join(', ')}</strong>. You can read it, but
          complete the earlier steps first.
        </div>
      )}

      {/* Six-step loop, fixed order */}
      <div className="mt-6 flex flex-col gap-4">
        {STEPS.map((step) =>
          step.key === 'teach_back_task' ? (
            <TeachBackStep key={step.key} n={step.n} content={lesson[step.key]} />
          ) : (
            <Step key={step.key} n={step.n} label={step.label} content={lesson[step.key]} />
          ),
        )}
      </div>

      {/* AI judgment — consistent element on every lesson */}
      <div className="mt-4">
        <AiJudgmentCard note={lesson.ai_judgment_note} />
      </div>

      {lesson.assets_needed && lesson.assets_needed.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">You'll need: </span>
          {lesson.assets_needed.join(' · ')}
        </div>
      )}

      {/* Success criteria — the unit of progress */}
      <section className="mt-6 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-800">
            Success checklist
          </h3>
          {complete && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
              ✓ Lesson complete
            </span>
          )}
        </div>
        <p className="mb-3 text-xs text-emerald-700">
          Check each one off (a parent can verify). When all are checked, the lesson is complete and
          the next step unlocks.
        </p>
        <ul className="flex flex-col gap-2">
          {lesson.success_criteria.map((criterion, i) => {
            const isChecked = checked.includes(i);
            return (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!child}
                    onChange={() => child && toggleCriterion(child.id, lesson.id, i)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
                  />
                  <span
                    className={
                      'text-sm ' + (isChecked ? 'text-emerald-700 line-through' : 'text-slate-800')
                    }
                  >
                    {criterion}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {child && (
          <button
            onClick={() =>
              setLessonComplete(child.id, lesson.id, lesson.success_criteria.length, !allChecked)
            }
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {allChecked ? 'Uncheck all' : 'Mark all complete'}
          </button>
        )}
        {!child && (
          <p className="mt-3 text-sm font-medium text-emerald-800">
            Add an explorer above to save progress.
          </p>
        )}
      </section>

      {/* Next lesson */}
      {next && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onOpenLesson(next.id)}
            disabled={!isLessonUnlocked(index, child, next)}
            className={
              'rounded-lg px-4 py-2 text-sm font-semibold transition ' +
              (isLessonUnlocked(index, child, next)
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'cursor-not-allowed bg-slate-200 text-slate-400')
            }
          >
            {isLessonUnlocked(index, child, next)
              ? `Next: ${next.title} →`
              : `🔒 Next: ${next.title}`}
          </button>
        </div>
      )}
    </article>
  );
}

function Step({ n, label, content }: { n: number; label: string; content: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
          {n}
        </span>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</h3>
      </div>
      <div className="text-slate-800">
        <Markdown>{content}</Markdown>
      </div>
    </section>
  );
}

/**
 * teach_back_task — Step 6. Given clear visual prominence because retention
 * lives here (per the schema, it's weighted heavily).
 */
function TeachBackStep({ n, content }: { n: number; content: string }) {
  return (
    <section className="rounded-2xl border-2 border-indigo-500 bg-indigo-600 p-5 text-white shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-indigo-600">
          {n}
        </span>
        <h3 className="text-base font-extrabold uppercase tracking-wide">
          ★ Teach it back — the step that makes it stick
        </h3>
      </div>
      <div className="prose-invert text-indigo-50 [&_.md_a]:text-white [&_.md_strong]:text-white">
        <Markdown>{content}</Markdown>
      </div>
    </section>
  );
}
