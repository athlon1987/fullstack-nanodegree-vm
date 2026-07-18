/**
 * Content pipeline. On startup: load every content/*.json, validate against the
 * schema (schema is law — off-spec files are rejected, never rendered), index by
 * id, group by age_band and pillar_primary, and order lessons by sequence.
 */
import schema from '../../curriculum.schema.json';
import { validateCorpus, type Project, type ValidationIssue } from './validation';
import type { Lesson } from './curriculum.types';

export type { Project };
export type { Lesson } from './curriculum.types';

export type AgeBand = Project['age_band'];
export type Pillar = Project['pillar_primary'];

/** A project with its lessons guaranteed sorted by sequence. */
export interface OrderedProject extends Project {
  lessons: Project['lessons'];
}

export interface CurriculumIndex {
  /** Every valid project, keyed by id. */
  projects: Record<string, OrderedProject>;
  /** Every valid lesson across all projects, keyed by id (for prereq lookups). */
  lessons: Record<string, Lesson>;
  /** Which project each lesson belongs to. */
  lessonToProject: Record<string, string>;
  /** Age bands present, in curriculum order. */
  ageBands: AgeBand[];
  /** project ids grouped by age band, then pillar, each list ordered by quarter. */
  byBand: Record<string, Record<string, string[]>>;
  /** Problems found during load. Non-empty means something was rejected. */
  issues: ValidationIssue[];
}

const BAND_ORDER: AgeBand[] = ['9-10', '11-12', '13-14', '15-16'];

// Eagerly import every content file at build/startup. Path is root-relative so it
// resolves to /content regardless of which module imports this loader.
const modules = import.meta.glob('/content/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

let cached: CurriculumIndex | null = null;

export function loadCurriculum(): CurriculumIndex {
  if (cached) return cached;

  const files: Record<string, unknown> = {};
  for (const [path, data] of Object.entries(modules)) {
    files[path.replace('/content/', '')] = data;
  }

  const { projects: validProjects, issues } = validateCorpus(schema, files);

  const projects: Record<string, OrderedProject> = {};
  const lessons: Record<string, Lesson> = {};
  const lessonToProject: Record<string, string> = {};
  const byBand: Record<string, Record<string, string[]>> = {};

  for (const project of Object.values(validProjects)) {
    // Order lessons by sequence — never trust array order in the source file.
    const ordered: OrderedProject = {
      ...project,
      lessons: [...project.lessons].sort((a, b) => a.sequence - b.sequence) as Project['lessons'],
    };
    projects[project.id] = ordered;
    for (const lesson of ordered.lessons) {
      lessons[lesson.id] = lesson;
      lessonToProject[lesson.id] = project.id;
    }
    const band = (byBand[project.age_band] ??= {});
    (band[project.pillar_primary] ??= []).push(project.id);
  }

  // Within each pillar column, order projects by quarter.
  for (const band of Object.values(byBand)) {
    for (const pillar of Object.keys(band)) {
      band[pillar].sort((a, b) => projects[a].quarter - projects[b].quarter);
    }
  }

  const ageBands = BAND_ORDER.filter((b) => byBand[b]);

  cached = { projects, lessons, lessonToProject, ageBands, byBand, issues };
  return cached;
}

/** Human labels + display order for pillars. Deep editorial tones. */
export const PILLAR_META: Record<Pillar, { label: string; short: string; accent: string }> = {
  think: { label: 'Think', short: '01', accent: '#3d3a94' },
  communicate: { label: 'Communicate', short: '02', accent: '#0f5e80' },
  build: { label: 'Build', short: '03', accent: '#9a5610' },
  wealth: { label: 'Create Wealth', short: '04', accent: '#1d6b47' },
  lead: { label: 'Lead', short: '05', accent: '#94285c' },
  explore: { label: 'Explore', short: '06', accent: '#5b3a9e' },
  live_well: { label: 'Live Well', short: '07', accent: '#0f6b66' },
  create: { label: 'Create', short: '08', accent: '#a02c22' },
};

/** Load-bearing pillars come first, in curriculum order. */
export const PILLAR_ORDER: Pillar[] = [
  'think',
  'communicate',
  'build',
  'wealth',
  'lead',
  'explore',
  'live_well',
  'create',
];
