import type { CurriculumIndex, Lesson, OrderedProject } from '../lib/loadContent';
import { PILLAR_META } from '../lib/loadContent';
import type { Child } from '../lib/progress';
import { setLessonComplete, toggleCriterion } from '../lib/progress';
import { isLessonComplete, isLessonUnlocked, lessonLockedBy } from '../lib/gating';
import { Markdown } from './Markdown';
import { AiJudgmentCard } from './AiJudgmentCard';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, LockIcon } from './icons';

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
        <button onClick={onBack} className="mt-4 underline" style={{ color: 'var(--accent)' }}>
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

  const siblings = project.lessons;
  const pos = siblings.findIndex((l) => l.id === lesson.id);
  const next = siblings[pos + 1];
  const nextUnlocked = next ? isLessonUnlocked(index, child, next) : false;

  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-8">
      <button
        onClick={onBack}
        className="microlabel mb-8 inline-flex items-center gap-2 transition-colors hover:underline"
        style={{ color: 'var(--ink-soft)' }}
      >
        <ArrowLeftIcon size={12} />
        Journey map
      </button>

      <div className="mb-2 flex items-center gap-3">
        <span className="microlabel px-2 py-1" style={{ background: meta.accent, color: '#fff' }}>
          {meta.label}
        </span>
        <span className="microlabel" style={{ color: 'var(--ink-faint)' }}>
          {project.title} — Quarter {project.quarter}
        </span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        <span className="index-num mr-3" style={{ color: meta.accent }}>
          {String(lesson.sequence).padStart(2, '0')}
        </span>
        {lesson.title}
      </h1>
      <p className="microlabel mt-2" style={{ color: 'var(--ink-faint)' }}>
        Approx. {lesson.est_minutes} minutes
      </p>

      {!unlocked && (
        <div
          className="mt-6 flex items-start gap-3 border p-4 text-sm"
          style={{ borderColor: 'var(--line)', background: 'var(--paper-raised)' }}
        >
          <LockIcon size={14} className="mt-0.5 shrink-0" />
          <span>
            This lesson is locked. Finish first:{' '}
            <strong>{lessonLockedBy(index, child, lesson).join(', ')}</strong>. You can read ahead,
            but complete the earlier steps first.
          </span>
        </div>
      )}

      {/* Six-step loop, fixed order */}
      <div className="mt-10 flex flex-col gap-5">
        {STEPS.map((step) =>
          step.key === 'teach_back_task' ? (
            <TeachBackStep key={step.key} n={step.n} content={lesson[step.key]} />
          ) : (
            <Step key={step.key} n={step.n} label={step.label} content={lesson[step.key]} />
          ),
        )}
      </div>

      {/* AI judgment — consistent element on every lesson */}
      <div className="mt-5">
        <AiJudgmentCard note={lesson.ai_judgment_note} />
      </div>

      {lesson.assets_needed && lesson.assets_needed.length > 0 && (
        <div
          className="mt-5 border-l-2 py-1 pl-4 text-sm"
          style={{ borderColor: 'var(--ink)', color: 'var(--ink-soft)' }}
        >
          <span className="microlabel mr-2" style={{ color: 'var(--ink)' }}>
            Materials
          </span>
          {lesson.assets_needed.join(' · ')}
        </div>
      )}

      {/* Success criteria — the unit of progress */}
      <section
        className="mt-8 border p-5"
        style={{ borderColor: 'var(--ok)', background: 'var(--ok-soft)' }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="microlabel" style={{ color: 'var(--ok)' }}>
            Success checklist
          </h3>
          {complete && (
            <span
              className="microlabel flex items-center gap-1.5 px-2 py-1"
              style={{ background: 'var(--ok)', color: '#fff' }}
            >
              <CheckIcon size={11} />
              Lesson complete
            </span>
          )}
        </div>
        <p className="mb-4 text-xs" style={{ color: 'var(--ink-soft)' }}>
          Check each item off — a parent can verify. When all are checked, the lesson is complete
          and the next step unlocks.
        </p>
        <ul className="flex flex-col gap-2.5">
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
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ accentColor: 'var(--ok)' }}
                  />
                  <span
                    className="text-sm"
                    style={
                      isChecked
                        ? { color: 'var(--ink-faint)', textDecoration: 'line-through' }
                        : { color: 'var(--ink)' }
                    }
                  >
                    {criterion}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {child ? (
          <button
            onClick={() =>
              setLessonComplete(child.id, lesson.id, lesson.success_criteria.length, !allChecked)
            }
            className="microlabel mt-5 border px-4 py-2 transition-colors"
            style={{ background: 'var(--ok)', color: '#fff', borderColor: 'var(--ok)' }}
          >
            {allChecked ? 'Uncheck all' : 'Mark all complete'}
          </button>
        ) : (
          <p className="mt-4 text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
            Add a learner above to save progress.
          </p>
        )}
      </section>

      {/* Next lesson */}
      {next && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => onOpenLesson(next.id)}
            disabled={!nextUnlocked}
            className="microlabel flex items-center gap-2 border px-4 py-2.5 transition-colors"
            style={
              nextUnlocked
                ? { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }
                : {
                    background: 'transparent',
                    color: 'var(--ink-faint)',
                    borderColor: 'var(--line)',
                    cursor: 'not-allowed',
                  }
            }
          >
            {nextUnlocked ? (
              <>
                Next: {next.title}
                <ArrowRightIcon size={12} />
              </>
            ) : (
              <>
                <LockIcon size={12} />
                Next: {next.title}
              </>
            )}
          </button>
        </div>
      )}
    </article>
  );
}

function Step({ n, label, content }: { n: number; label: string; content: string }) {
  return (
    <section
      className="border p-5"
      style={{ borderColor: 'var(--line)', background: 'var(--paper-raised)' }}
    >
      <div className="mb-3 flex items-baseline gap-3">
        <span className="index-num text-sm" style={{ color: 'var(--ink-faint)' }}>
          {String(n).padStart(2, '0')}
        </span>
        <h3 className="microlabel" style={{ color: 'var(--ink-soft)' }}>
          {label}
        </h3>
      </div>
      <div style={{ color: 'var(--ink)' }}>
        <Markdown>{content}</Markdown>
      </div>
    </section>
  );
}

/**
 * teach_back_task — Step 6. Visually prominent: inverted ink panel with an
 * accent rule, because retention lives here.
 */
function TeachBackStep({ n, content }: { n: number; content: string }) {
  return (
    <section
      className="border-t-4 p-6"
      style={{ background: 'var(--ink)', borderColor: 'var(--accent)' }}
    >
      <div className="mb-3 flex items-baseline gap-3">
        <span className="index-num text-sm" style={{ color: 'var(--accent)' }}>
          {String(n).padStart(2, '0')}
        </span>
        <h3 className="microlabel" style={{ color: 'var(--accent)' }}>
          Teach it back — the step that makes it stick
        </h3>
      </div>
      <div
        className="[&_.md_a]:!text-white [&_.md_code]:!bg-white/10"
        style={{ color: 'var(--paper)' }}
      >
        <Markdown>{content}</Markdown>
      </div>
    </section>
  );
}
