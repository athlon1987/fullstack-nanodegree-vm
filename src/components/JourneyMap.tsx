import type { CurriculumIndex, OrderedProject } from '../lib/loadContent';
import { PILLAR_META, PILLAR_ORDER } from '../lib/loadContent';
import type { Child } from '../lib/progress';
import { isLessonComplete, isLessonUnlocked, projectStatus } from '../lib/gating';
import { CheckIcon, LockIcon } from './icons';

interface Props {
  index: CurriculumIndex;
  child: Child | null;
  band: string;
  onOpenLesson: (lessonId: string) => void;
}

/**
 * The journey map for one age band. Pillars are columns; each quarter Project
 * is a milestone; each Lesson is a numbered step. Locked nodes are dimmed.
 */
export function JourneyMap({ index, child, band, onOpenLesson }: Props) {
  const pillars = index.byBand[band] ?? {};
  const orderedPillars = PILLAR_ORDER.filter((p) => pillars[p]);

  return (
    <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
      {orderedPillars.map((pillar) => {
        const meta = PILLAR_META[pillar];
        const projectIds = pillars[pillar];
        return (
          <section key={pillar} className="flex flex-col">
            <div
              className="mb-5 flex items-baseline justify-between border-b pb-2"
              style={{ borderColor: 'var(--ink)' }}
            >
              <h2 className="microlabel" style={{ color: 'var(--ink)' }}>
                {meta.label}
              </h2>
              <span className="index-num text-sm" style={{ color: meta.accent }}>
                {meta.short}
              </span>
            </div>
            <div className="flex flex-col gap-6">
              {projectIds.map((pid) => (
                <MilestoneCard
                  key={pid}
                  index={index}
                  child={child}
                  project={index.projects[pid]}
                  accent={meta.accent}
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
  onOpenLesson,
}: {
  index: CurriculumIndex;
  child: Child | null;
  project: OrderedProject;
  accent: string;
  onOpenLesson: (lessonId: string) => void;
}) {
  const status = projectStatus(index, child, project);

  return (
    <div
      className="border transition-opacity"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--paper-raised)',
        opacity: status.unlocked ? 1 : 0.55,
      }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="microlabel" style={{ color: 'var(--ink-faint)' }}>
            Quarter {project.quarter}
          </span>
          {status.complete ? (
            <span className="microlabel flex items-center gap-1" style={{ color: 'var(--ok)' }}>
              <CheckIcon size={11} />
              Complete
            </span>
          ) : !status.unlocked ? (
            <span
              className="microlabel flex items-center gap-1"
              style={{ color: 'var(--ink-faint)' }}
            >
              <LockIcon size={11} />
              Locked
            </span>
          ) : (
            <span className="index-num text-xs" style={{ color: 'var(--ink-soft)' }}>
              {status.completed}/{status.total}
            </span>
          )}
        </div>

        <h3 className="text-[15px] font-bold leading-snug tracking-tight">{project.title}</h3>

        {/* Milestone progress rule */}
        <div className="mt-2.5 h-px w-full" style={{ background: 'var(--line)' }}>
          <div
            className="h-px transition-all"
            style={{
              width: `${status.total ? (status.completed / status.total) * 100 : 0}%`,
              background: accent,
              height: '2px',
              marginTop: '-0.5px',
            }}
          />
        </div>

        {!status.unlocked && status.lockedBy.length > 0 && (
          <p className="mt-2 text-xs" style={{ color: 'var(--ink-faint)' }}>
            Unlocks after: {status.lockedBy.join(', ')}
          </p>
        )}
      </div>

      {/* Lesson steps */}
      <ol>
        {project.lessons.map((lesson, i) => {
          const done = isLessonComplete(child, lesson);
          const unlocked = isLessonUnlocked(index, child, lesson);
          const last = i === project.lessons.length - 1;
          return (
            <li key={lesson.id}>
              <button
                disabled={!unlocked}
                onClick={() => onOpenLesson(lesson.id)}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                style={{
                  borderBottom: last ? 'none' : `1px solid var(--line)`,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  color: unlocked ? 'var(--ink)' : 'var(--ink-faint)',
                }}
              >
                <StepMark done={done} unlocked={unlocked} accent={accent} n={lesson.sequence} />
                <span
                  className={done ? 'line-through' : 'group-hover:underline'}
                  style={done ? { color: 'var(--ink-faint)' } : undefined}
                >
                  {lesson.title}
                </span>
                <span
                  className="index-num ml-auto shrink-0 text-xs"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {lesson.est_minutes}m
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepMark({
  done,
  unlocked,
  accent,
  n,
}: {
  done: boolean;
  unlocked: boolean;
  accent: string;
  n: number;
}) {
  if (done) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center"
        style={{ background: accent, color: '#fff' }}
      >
        <CheckIcon size={11} />
      </span>
    );
  }
  if (!unlocked) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center border"
        style={{ borderColor: 'var(--line)', color: 'var(--ink-faint)' }}
      >
        <LockIcon size={10} />
      </span>
    );
  }
  return (
    <span
      className="index-num flex h-5 w-5 shrink-0 items-center justify-center border text-[10px]"
      style={{ borderColor: accent, color: accent }}
    >
      {String(n).padStart(2, '0')}
    </span>
  );
}
