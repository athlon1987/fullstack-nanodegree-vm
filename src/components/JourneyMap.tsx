import type { CurriculumIndex, OrderedProject } from '../lib/loadContent';
import { PILLAR_META, PILLAR_ORDER } from '../lib/loadContent';
import type { Child } from '../lib/progress';
import {
  isLessonComplete,
  isLessonUnlocked,
  projectStatus,
} from '../lib/gating';

interface Props {
  index: CurriculumIndex;
  child: Child | null;
  band: string;
  onOpenLesson: (lessonId: string) => void;
}

/**
 * The journey map for one age band. Pillars are columns; each quarter Project is
 * a milestone card; each Lesson is a step inside it. Locked nodes (unmet
 * prerequisites) are dimmed and non-clickable.
 */
export function JourneyMap({ index, child, band, onOpenLesson }: Props) {
  const pillars = index.byBand[band] ?? {};
  const orderedPillars = PILLAR_ORDER.filter((p) => pillars[p]);

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {orderedPillars.map((pillar) => {
        const meta = PILLAR_META[pillar];
        const projectIds = pillars[pillar];
        return (
          <section key={pillar} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{ backgroundColor: meta.accent }}
              >
                {meta.short}
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                {meta.label}
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {projectIds.map((pid, i) => (
                <MilestoneCard
                  key={pid}
                  index={index}
                  child={child}
                  project={index.projects[pid]}
                  accent={meta.accent}
                  isLast={i === projectIds.length - 1}
                  onOpenLesson={onOpenLesson}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MilestoneCard({
  index,
  child,
  project,
  accent,
  isLast,
  onOpenLesson,
}: {
  index: CurriculumIndex;
  child: Child | null;
  project: OrderedProject;
  accent: string;
  isLast: boolean;
  onOpenLesson: (lessonId: string) => void;
}) {
  const status = projectStatus(index, child, project);

  return (
    <div className="relative">
      <div
        className={
          'rounded-xl border bg-white p-4 shadow-sm transition ' +
          (status.unlocked ? 'border-slate-200' : 'border-slate-200 opacity-60')
        }
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Quarter {project.quarter}
          </span>
          {status.complete ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              ✓ Done
            </span>
          ) : !status.unlocked ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
              🔒 Locked
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-500">
              {status.completed}/{status.total}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold leading-snug text-slate-900">{project.title}</h3>

        {/* Milestone progress bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${status.total ? (status.completed / status.total) * 100 : 0}%`,
              backgroundColor: accent,
            }}
          />
        </div>

        {!status.unlocked && status.lockedBy.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Unlocks after: {status.lockedBy.join(', ')}
          </p>
        )}

        {/* Lesson steps */}
        <ol className="mt-3 flex flex-col gap-1.5">
          {project.lessons.map((lesson) => {
            const done = isLessonComplete(child, lesson);
            const unlocked = isLessonUnlocked(index, child, lesson);
            return (
              <li key={lesson.id}>
                <button
                  disabled={!unlocked}
                  onClick={() => onOpenLesson(lesson.id)}
                  className={
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ' +
                    (unlocked
                      ? 'hover:bg-indigo-50'
                      : 'cursor-not-allowed text-slate-400')
                  }
                >
                  <StepDot done={done} unlocked={unlocked} accent={accent} />
                  <span className={done ? 'text-slate-500 line-through' : 'text-slate-800'}>
                    {lesson.title}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{lesson.est_minutes}m</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {!isLast && <div className="mx-auto h-4 w-px bg-slate-200" aria-hidden />}
    </div>
  );
}

function StepDot({
  done,
  unlocked,
  accent,
}: {
  done: boolean;
  unlocked: boolean;
  accent: string;
}) {
  if (done) {
    return (
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: accent }}
      >
        ✓
      </span>
    );
  }
  if (!unlocked) {
    return <span className="h-4 w-4 shrink-0 text-center text-[10px] leading-4">🔒</span>;
  }
  return (
    <span
      className="h-4 w-4 shrink-0 rounded-full border-2"
      style={{ borderColor: accent }}
      aria-hidden
    />
  );
}
