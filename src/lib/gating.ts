/**
 * Derives completion and lock state from the curriculum graph + a child's
 * progress. Pure functions — no storage, no React — so they're easy to reason
 * about and reuse in the journey map and lesson view.
 */
import type { CurriculumIndex, OrderedProject, Lesson } from './loadContent';
import type { Child } from './progress';

/** A lesson is complete when all of its success_criteria are checked. */
export function isLessonComplete(child: Child | null, lesson: Lesson): boolean {
  if (!child) return false;
  const checked = child.progress.criteria[lesson.id] ?? [];
  return lesson.success_criteria.every((_, i) => checked.includes(i));
}

/** A project is complete when every one of its lessons is complete. */
export function isProjectComplete(child: Child | null, project: OrderedProject): boolean {
  if (!child) return false;
  return project.lessons.every((l) => isLessonComplete(child, l));
}

/**
 * A lesson is unlocked when its parent project is unlocked AND every
 * prereq_lesson_id is complete. (Sequence itself is not a hard gate — the
 * schema's prereq links are the source of truth — but the first lesson with no
 * prereqs is always open.)
 */
export function isLessonUnlocked(
  index: CurriculumIndex,
  child: Child | null,
  lesson: Lesson,
): boolean {
  const projectId = index.lessonToProject[lesson.id];
  const project = index.projects[projectId];
  if (!project || !isProjectUnlocked(index, child, project)) return false;
  return (lesson.prereq_lesson_ids ?? []).every((pre) => {
    const preLesson = index.lessons[pre];
    return preLesson ? isLessonComplete(child, preLesson) : true;
  });
}

/** A project is unlocked when every prereq_project_id is complete. */
export function isProjectUnlocked(
  index: CurriculumIndex,
  child: Child | null,
  project: OrderedProject,
): boolean {
  return (project.prereq_project_ids ?? []).every((pre) => {
    const preProject = index.projects[pre];
    return preProject ? isProjectComplete(child, preProject) : true;
  });
}

export interface ProjectStatus {
  completed: number;
  total: number;
  unlocked: boolean;
  complete: boolean;
  /** Human-readable reasons a locked project is locked (unmet prereqs). */
  lockedBy: string[];
}

export function projectStatus(
  index: CurriculumIndex,
  child: Child | null,
  project: OrderedProject,
): ProjectStatus {
  const completed = project.lessons.filter((l) => isLessonComplete(child, l)).length;
  const unlocked = isProjectUnlocked(index, child, project);
  const lockedBy = unlocked
    ? []
    : (project.prereq_project_ids ?? [])
        .filter((pre) => {
          const p = index.projects[pre];
          return p ? !isProjectComplete(child, p) : false;
        })
        .map((pre) => index.projects[pre]?.title ?? pre);
  return {
    completed,
    total: project.lessons.length,
    unlocked,
    complete: completed === project.lessons.length,
    lockedBy,
  };
}

/** Reasons a locked lesson is locked (incomplete prereq lesson titles). */
export function lessonLockedBy(
  index: CurriculumIndex,
  child: Child | null,
  lesson: Lesson,
): string[] {
  return (lesson.prereq_lesson_ids ?? [])
    .filter((pre) => {
      const l = index.lessons[pre];
      return l ? !isLessonComplete(child, l) : false;
    })
    .map((pre) => index.lessons[pre]?.title ?? pre);
}

/** Overall completion for an age band (for the header progress readout). */
export function bandProgress(
  index: CurriculumIndex,
  child: Child | null,
  band: string,
): { lessonsDone: number; lessonsTotal: number; projectsDone: number; projectsTotal: number } {
  const pillars = index.byBand[band] ?? {};
  let lessonsDone = 0;
  let lessonsTotal = 0;
  let projectsDone = 0;
  let projectsTotal = 0;
  for (const projectIds of Object.values(pillars)) {
    for (const pid of projectIds) {
      const project = index.projects[pid];
      projectsTotal += 1;
      if (isProjectComplete(child, project)) projectsDone += 1;
      for (const lesson of project.lessons) {
        lessonsTotal += 1;
        if (isLessonComplete(child, lesson)) lessonsDone += 1;
      }
    }
  }
  return { lessonsDone, lessonsTotal, projectsDone, projectsTotal };
}
