#!/usr/bin/env tsx
/**
 * Builds the Curriculum Handbook — a single printable HTML document compiled
 * verbatim from the validated content/*.json files. No content is invented or
 * altered: every long-form field is rendered from the source Markdown exactly.
 *
 * Output: docs/curriculum-handbook.html (print to PDF with headless Chromium).
 *
 * The script re-validates all content through the same shared ajv module the
 * app uses, then runs a fidelity check: the rendered text of EVERY field of
 * every project and lesson must appear in the final document, or the build
 * fails. This guarantees nothing was dropped or truncated.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { validateCorpus, type Project } from '../src/lib/validation.ts';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTENT_DIR = join(ROOT, 'content');
const OUT_PATH = join(ROOT, 'docs', 'curriculum-handbook.html');

marked.setOptions({ gfm: true, breaks: false });

/* ------------------------- load + validate ------------------------- */

const schema = JSON.parse(readFileSync(join(ROOT, 'curriculum.schema.json'), 'utf8'));
const files: Record<string, unknown> = {};
for (const name of readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json')).sort()) {
  files[name] = JSON.parse(readFileSync(join(CONTENT_DIR, name), 'utf8'));
}
const { ok, issues, projects } = validateCorpus(schema, files);
if (!ok) {
  for (const i of issues) console.error(`${i.source}: ${i.message}`);
  process.exit(1);
}

/* ------------------------- ordering ------------------------- */

const BAND_ORDER = ['9-10', '11-12', '13-14', '15-16'] as const;
const PILLAR_ORDER = [
  'think', 'communicate', 'build', 'wealth', 'lead', 'explore', 'live_well', 'create',
] as const;
const PILLAR_LABEL: Record<string, string> = {
  think: 'Think', communicate: 'Communicate', build: 'Build', wealth: 'Create Wealth',
  lead: 'Lead', explore: 'Explore', live_well: 'Live Well', create: 'Create',
};
const PILLAR_COLOR: Record<string, string> = {
  think: '#6366f1', communicate: '#0ea5e9', build: '#f59e0b', wealth: '#10b981',
  lead: '#ec4899', explore: '#8b5cf6', live_well: '#14b8a6', create: '#f43f5e',
};
const LEVER_LABEL: Record<string, string> = {
  autonomy: 'Autonomy', mastery: 'Mastery', peer_status: 'Peer status',
  real_stakes: 'Real stakes', real_audience: 'Real audience', belonging: 'Belonging',
};
const STEP_LABELS: [keyof ProjectLesson, string][] = [
  ['concept', 'Concept'],
  ['real_example', 'Real example'],
  ['apply_task', 'Apply it'],
  ['reflection_prompt', 'Reflect'],
  ['feedback_task', 'Get feedback'],
  ['teach_back_task', 'Teach it back'],
];
type ProjectLesson = Project['lessons'][number];

const all = Object.values(projects);
const byBand = new Map<string, Project[]>();
for (const band of BAND_ORDER) {
  const list = all
    .filter((p) => p.age_band === band)
    .sort(
      (a, b) =>
        PILLAR_ORDER.indexOf(a.pillar_primary) - PILLAR_ORDER.indexOf(b.pillar_primary) ||
        a.quarter - b.quarter,
    );
  if (list.length) byBand.set(band, list);
}

/* ------------------------- html helpers ------------------------- */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = (s: string) => marked.parse(s) as string;

function titleFor(id: string): string {
  return projects[id]?.title ?? id;
}
function lessonTitleFor(project: Project, id: string): string {
  return project.lessons.find((l) => l.id === id)?.title ?? id;
}

/* ------------------------- document ------------------------- */

const totalLessons = all.reduce((n, p) => n + p.lessons.length, 0);
const parts: string[] = [];

parts.push(`
<header class="cover">
  <div class="rocket">&#128640;</div>
  <h1>Future Founder &amp; Leader</h1>
  <p class="subtitle">Curriculum Handbook</p>
  <p class="cover-meta">${all.length} quarterly projects &middot; ${totalLessons} lessons &middot; ages 9&ndash;14</p>
  <p class="cover-note">Compiled verbatim from the validated curriculum content.
  Interactive version: <strong>athlon1987.github.io/fullstack-nanodegree-vm</strong></p>
</header>

<section class="howto">
  <h2>How this curriculum works</h2>
  <p>Each age band runs four <strong>pillars</strong> in parallel &mdash; Think, Communicate, Build,
  and Create Wealth &mdash; with one quarterly <strong>project</strong> per pillar. Every project ends in a
  real, tangible <strong>artifact</strong>, and every lesson follows the same six-step loop:</p>
  <ol class="loop">
    <li><strong>Concept</strong> &mdash; learn the idea</li>
    <li><strong>Real example</strong> &mdash; see it in the world</li>
    <li><strong>Apply it</strong> &mdash; advance the project artifact</li>
    <li><strong>Reflect</strong> &mdash; think about what happened</li>
    <li><strong>Get feedback</strong> &mdash; improve it</li>
    <li><strong>Teach it back</strong> &mdash; teach someone else (the retention step)</li>
  </ol>
  <p>Every lesson also carries an <strong>AI judgment note</strong>: when to reach for AI and &mdash; more
  important &mdash; when not to. Projects and lessons unlock in order via prerequisites; success
  criteria are observable things a parent can verify.</p>
  <table class="coverage">
    <tr><th>Age band</th><th>Status</th></tr>
    <tr><td>9&ndash;10</td><td>Complete &mdash; 16 projects, 4 per pillar</td></tr>
    <tr><td>11&ndash;12</td><td>Complete &mdash; 16 projects, 4 per pillar</td></tr>
    <tr><td>13&ndash;14</td><td>Sample &mdash; 1 project (Create Wealth Q1)</td></tr>
  </table>
</section>`);

// Table of contents
parts.push('<section class="toc"><h2>Contents</h2>');
for (const [band, list] of byBand) {
  parts.push(`<h3>Ages ${esc(band)}</h3><ul>`);
  for (const p of list) {
    parts.push(
      `<li><span class="dot" style="background:${PILLAR_COLOR[p.pillar_primary]}"></span>` +
        `<a href="#${esc(p.id)}">${esc(PILLAR_LABEL[p.pillar_primary])} Q${p.quarter}: ${esc(p.title)}</a></li>`,
    );
  }
  parts.push('</ul>');
}
parts.push('</section>');

// Bands → projects → lessons
for (const [band, list] of byBand) {
  parts.push(`<section class="band"><h1 class="band-title">Ages ${esc(band)}</h1></section>`);
  for (const p of list) {
    const color = PILLAR_COLOR[p.pillar_primary];
    parts.push(`
<article class="project" id="${esc(p.id)}">
  <div class="project-head" style="border-color:${color}">
    <span class="pill" style="background:${color}">${esc(PILLAR_LABEL[p.pillar_primary])} &middot; Q${p.quarter}</span>
    <h2>${esc(p.title)}</h2>
    <p class="pid">${esc(p.id)}${
      p.pillars_supporting?.length
        ? ` &middot; supporting: ${p.pillars_supporting.map((s) => esc(PILLAR_LABEL[s])).join(', ')}`
        : ''
    }</p>
  </div>
  <div class="meta">
    <h4>What&rsquo;s developmentally real at this age</h4>
    <div class="md">${md(p.developmental_frame)}</div>
    <h4>What &ldquo;creating value&rdquo; means here</h4>
    <div class="md">${md(p.authentic_value_meaning)}</div>
    <h4>Motivation lever &mdash; ${esc(LEVER_LABEL[p.motivation_lever.lever] ?? p.motivation_lever.lever)}</h4>
    <div class="md">${md(p.motivation_lever.mechanism)}</div>
    <h4>The artifact</h4>
    <div class="md">${md(p.artifact)}</div>
    <h4>Project success criteria</h4>
    <ul>${p.success_criteria.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    ${
      p.prereq_project_ids?.length
        ? `<p class="prereq">Unlocks after: ${p.prereq_project_ids.map((id) => esc(titleFor(id))).join(', ')}</p>`
        : ''
    }
  </div>`);

    for (const l of [...p.lessons].sort((a, b) => a.sequence - b.sequence)) {
      parts.push(`
  <div class="lesson">
    <h3><span class="lnum" style="background:${color}">${l.sequence}</span> ${esc(l.title)}
      <span class="mins">~${l.est_minutes} min</span></h3>
    ${STEP_LABELS.map(
      ([key, label], i) => `
    <div class="step ${key === 'teach_back_task' ? 'teachback' : ''}">
      <h5><span class="snum">${i + 1}</span> ${label}${key === 'teach_back_task' ? ' &#9733;' : ''}</h5>
      <div class="md">${md(l[key] as string)}</div>
    </div>`,
    ).join('')}
    <div class="ai-note">
      <h5>&#129517; AI judgment &mdash; when to use it, and when not to</h5>
      <div class="md">${md(l.ai_judgment_note)}</div>
    </div>
    ${
      l.assets_needed?.length
        ? `<p class="assets"><strong>You&rsquo;ll need:</strong> ${l.assets_needed.map(esc).join(' &middot; ')}</p>`
        : ''
    }
    <div class="crit">
      <h5>Success checklist</h5>
      <ul>${l.success_criteria.map((c) => `<li>&#9744; ${esc(c)}</li>`).join('')}</ul>
    </div>
    ${
      l.prereq_lesson_ids?.length
        ? `<p class="prereq">Unlocks after: ${l.prereq_lesson_ids.map((id) => esc(lessonTitleFor(p, id))).join(', ')}</p>`
        : ''
    }
  </div>`);
    }
    parts.push('</article>');
  }
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Future Founder &amp; Leader — Curriculum Handbook</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DejaVu Sans', 'Segoe UI', Helvetica, Arial, sans-serif;
         font-size: 9.5pt; line-height: 1.5; color: #1e293b; }
  .md > * + *, .md li + li { margin-top: 0.35em; }
  .md ul, .md ol { padding-left: 1.3em; margin-top: 0.35em; }
  .md em { font-style: italic; } .md strong { font-weight: 700; }
  .md code { font-family: monospace; background: #eef2ff; padding: 0 0.3em; border-radius: 3px; }

  .cover { text-align: center; padding: 90mm 0 20mm; page-break-after: always; }
  .rocket { font-size: 34pt; }
  .cover h1 { font-size: 26pt; margin-top: 8mm; letter-spacing: -0.5px; }
  .subtitle { font-size: 14pt; color: #6366f1; font-weight: 600; margin-top: 2mm; }
  .cover-meta { margin-top: 6mm; color: #475569; }
  .cover-note { margin-top: 30mm; font-size: 8.5pt; color: #64748b; }

  .howto { page-break-after: always; }
  .howto h2 { font-size: 15pt; margin-bottom: 4mm; }
  .howto p { margin-bottom: 3mm; }
  .loop { margin: 3mm 0 3mm 6mm; }
  .coverage { border-collapse: collapse; margin-top: 4mm; width: 100%; }
  .coverage th, .coverage td { border: 1px solid #cbd5e1; padding: 2mm 3mm; text-align: left; }
  .coverage th { background: #f1f5f9; }

  .toc { page-break-after: always; }
  .toc h2 { font-size: 15pt; margin-bottom: 4mm; }
  .toc h3 { margin: 4mm 0 2mm; font-size: 11pt; }
  .toc ul { list-style: none; }
  .toc li { margin: 1mm 0; }
  .toc a { color: #1e293b; text-decoration: none; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 2mm; }

  .band-title { font-size: 22pt; padding: 60mm 0 0; text-align: center;
                page-break-before: always; page-break-after: always; color: #334155; }

  .project { page-break-before: always; }
  .project-head { border-left: 4px solid; padding-left: 4mm; margin-bottom: 4mm; }
  .project-head h2 { font-size: 15pt; margin: 1.5mm 0 0.5mm; }
  .pill { color: #fff; font-size: 7.5pt; font-weight: 700; padding: 0.8mm 2.5mm;
          border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .pid { color: #94a3b8; font-size: 8pt; }
  .meta h4 { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px;
             color: #64748b; margin: 3mm 0 1mm; }
  .meta ul { padding-left: 5mm; }
  .prereq { color: #64748b; font-size: 8.5pt; margin-top: 2mm; font-style: italic; }

  .lesson { margin-top: 6mm; padding-top: 3mm; border-top: 1px solid #e2e8f0;
            page-break-inside: avoid; }
  .lesson h3 { font-size: 12pt; margin-bottom: 2.5mm; }
  .lnum { display: inline-block; color: #fff; width: 6mm; height: 6mm; line-height: 6mm;
          text-align: center; border-radius: 50%; font-size: 9pt; }
  .mins { float: right; color: #94a3b8; font-size: 8.5pt; font-weight: 400; }
  .step { border: 1px solid #e2e8f0; border-radius: 3mm; padding: 2.5mm 3mm; margin: 2mm 0;
          page-break-inside: avoid; }
  .step h5, .ai-note h5, .crit h5 { font-size: 8pt; text-transform: uppercase;
          letter-spacing: 0.5px; color: #64748b; margin-bottom: 1mm; }
  .snum { display: inline-block; background: #334155; color: #fff; width: 4.5mm; height: 4.5mm;
          line-height: 4.5mm; text-align: center; border-radius: 50%; font-size: 7pt; }
  .teachback { background: #eef2ff; border: 2px solid #6366f1; }
  .teachback h5 { color: #4338ca; font-weight: 800; }
  .ai-note { background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 3mm;
             padding: 2.5mm 3mm; margin: 2mm 0; page-break-inside: avoid; }
  .ai-note h5 { color: #92400e; }
  .assets { font-size: 8.5pt; color: #475569; margin: 2mm 0; }
  .crit { background: #ecfdf5; border: 1px solid #10b981; border-radius: 3mm;
          padding: 2.5mm 3mm; margin: 2mm 0; page-break-inside: avoid; }
  .crit h5 { color: #065f46; }
  .crit ul { list-style: none; }
</style></head><body>
${parts.join('\n')}
</body></html>`;

/* ------------------------- fidelity check ------------------------- */
// Every field of every project and lesson, rendered the same way, must appear
// in the final document text. Catches dropped lessons, fields, or truncation.

const strip = (h: string) =>
  h.replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#\d+;|&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const docText = strip(html);
const missing: string[] = [];
function mustContain(owner: string, field: string, raw: string, viaMd: boolean) {
  const needle = strip(viaMd ? md(raw) : esc(raw));
  if (needle && !docText.includes(needle)) missing.push(`${owner}.${field}`);
}

for (const p of all) {
  mustContain(p.id, 'title', p.title, false);
  mustContain(p.id, 'developmental_frame', p.developmental_frame, true);
  mustContain(p.id, 'authentic_value_meaning', p.authentic_value_meaning, true);
  mustContain(p.id, 'motivation_mechanism', p.motivation_lever.mechanism, true);
  mustContain(p.id, 'artifact', p.artifact, true);
  p.success_criteria.forEach((c, i) => mustContain(p.id, `success_criteria[${i}]`, c, false));
  for (const l of p.lessons) {
    mustContain(l.id, 'title', l.title, false);
    for (const [key] of STEP_LABELS) mustContain(l.id, key as string, l[key] as string, true);
    mustContain(l.id, 'ai_judgment_note', l.ai_judgment_note, true);
    l.success_criteria.forEach((c, i) => mustContain(l.id, `success_criteria[${i}]`, c, false));
    (l.assets_needed ?? []).forEach((a, i) => mustContain(l.id, `assets_needed[${i}]`, a, false));
  }
}

if (missing.length) {
  console.error(`FIDELITY FAILURE — ${missing.length} field(s) missing from handbook:`);
  missing.slice(0, 20).forEach((m) => console.error(`  ${m}`));
  process.exit(1);
}

writeFileSync(OUT_PATH, html);
console.log(
  `Handbook written: ${OUT_PATH}\n` +
    `${all.length} projects, ${totalLessons} lessons — fidelity check passed ` +
    `(every field of every project & lesson verified present).`,
);
