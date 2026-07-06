/**
 * Shared schema-validation logic. The schema is the single source of truth
 * (curriculum.schema.json). Both the CLI validator (scripts/validate.ts) and the
 * runtime content loader use this module so code and content share ONE contract.
 */
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import type { FutureFounderCurriculumProject } from './curriculum.types';

export type Project = FutureFounderCurriculumProject;

/** A single problem found while validating or wiring the corpus. */
export interface ValidationIssue {
  /** File or id the problem belongs to (for reporting). */
  source: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  /** Projects that parsed + passed schema validation, indexed by id. */
  projects: Record<string, Project>;
}

let cachedValidator: ValidateFunction | null = null;

/** Build (and cache) the ajv validator for the curriculum schema. */
export function getValidator(schema: object): ValidateFunction {
  if (cachedValidator) return cachedValidator;
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
  cachedValidator = ajv.compile(schema);
  return cachedValidator;
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return 'unknown schema error';
  return errors
    .map((e) => `${e.instancePath || '(root)'} ${e.message ?? ''}`.trim())
    .join('; ');
}

/**
 * Validate a set of already-parsed content objects against the schema and check
 * that every prerequisite id (project- and lesson-level) resolves. This is the
 * gate: nothing enters the app without passing both checks.
 *
 * @param schema  the parsed curriculum.schema.json
 * @param files   map of source-name -> parsed JSON (unknown shape until validated)
 */
export function validateCorpus(
  schema: object,
  files: Record<string, unknown>,
): ValidationResult {
  const validate = getValidator(schema);
  const issues: ValidationIssue[] = [];
  const projects: Record<string, Project> = {};

  // 1) Schema validation, file by file.
  for (const [source, data] of Object.entries(files)) {
    if (!validate(data)) {
      issues.push({ source, message: `SCHEMA ERROR: ${formatAjvErrors(validate.errors)}` });
      continue;
    }
    const project = data as Project;
    if (projects[project.id]) {
      issues.push({ source, message: `DUPLICATE project id: ${project.id}` });
      continue;
    }
    projects[project.id] = project;
  }

  // 2) Prerequisite resolution — projects and lessons must point at ids that exist.
  for (const project of Object.values(projects)) {
    for (const pre of project.prereq_project_ids ?? []) {
      if (!projects[pre]) {
        issues.push({ source: project.id, message: `MISSING PROJECT PREREQ: ${project.id} -> ${pre}` });
      }
    }
    const lessonIds = new Set(project.lessons.map((l) => l.id));
    for (const lesson of project.lessons) {
      for (const pre of lesson.prereq_lesson_ids ?? []) {
        if (!lessonIds.has(pre)) {
          issues.push({
            source: project.id,
            message: `MISSING LESSON PREREQ: ${lesson.id} -> ${pre}`,
          });
        }
      }
    }
  }

  return { ok: issues.length === 0, issues, projects };
}
