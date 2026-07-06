#!/usr/bin/env tsx
/**
 * CLI validator — `npm run validate`.
 *
 * Validates every content/*.json against curriculum.schema.json (via ajv) and
 * checks that all prerequisite ids resolve. Fails (exit 1) on any problem so it
 * can guard the build and run as a pre-commit hook. TypeScript port of the
 * reference scripts/validate.py, sharing the app's own validation module.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCorpus } from '../src/lib/validation.ts';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SCHEMA_PATH = join(ROOT, 'curriculum.schema.json');
const CONTENT_DIR = join(ROOT, 'content');

function main(): void {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

  const fileNames = readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (fileNames.length === 0) {
    console.error('No content files found.');
    process.exit(1);
  }

  // Parse each file; a JSON syntax error is itself a validation failure.
  const files: Record<string, unknown> = {};
  let parseErrors = 0;
  for (const name of fileNames) {
    try {
      files[name] = JSON.parse(readFileSync(join(CONTENT_DIR, name), 'utf8'));
    } catch (err) {
      parseErrors++;
      console.error(`INVALID JSON in ${name}: ${(err as Error).message}`);
    }
  }

  const result = validateCorpus(schema, files);

  for (const issue of result.issues) {
    console.error(`${issue.source}: ${issue.message}`);
  }

  const projects = Object.values(result.projects);
  const lessonCount = projects.reduce((n, p) => n + p.lessons.length, 0);
  const bands: Record<string, number> = {};
  for (const p of projects) bands[p.age_band] = (bands[p.age_band] ?? 0) + 1;

  console.log(`\n${projects.length} projects, ${lessonCount} lessons`);
  for (const b of ['9-10', '11-12', '13-14', '15-16']) {
    if (bands[b]) console.log(`  ${b}: ${bands[b]}/16`);
  }

  if (parseErrors > 0 || !result.ok) {
    console.error(`\nFAILED: ${parseErrors + result.issues.length} problem(s). No content may enter the app.`);
    process.exit(1);
  }

  console.log('\nAll valid. Prereqs resolve.');
}

main();
