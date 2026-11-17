#!/usr/bin/env node
/**
 * Design-token audit. Reads the colour tokens from src/app/globals.css (the single source of
 * truth), resolves them for every theme, measures WCAG 2.x contrast for every text/background
 * pair and UI boundary, and:
 *
 *   1. writes src/components/design-system/token-data.ts (used by the /design-system page);
 *   2. prints a Markdown report (paste into docs/design/design-system.md);
 *   3. exits with code 1 if any pair is below its threshold, or if the no-JavaScript dark
 *      fallback block has drifted from the dark theme block.
 *
 * Usage: node scripts/design-tokens.mjs [--quiet]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8');
const quiet = process.argv.includes('--quiet');

/** Every `--color-x: #rrggbb` declaration in a piece of CSS, as { x: '#rrggbb' }. */
function colours(text) {
  const map = {};
  for (const match of text.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) map[match[1]] = match[2].toLowerCase();
  return map;
}

function between(start, end) {
  const from = css.indexOf(start);
  const to = css.indexOf(end, from);
  if (from === -1 || to === -1) throw new Error(`Marker not found: ${start}`);
  return css.slice(from, to);
}
const block = (name) => colours(between(`/* tokens:${name}:start */`, `/* tokens:${name}:end */`));

const light = colours(between('@theme static {', '@layer theme {'));
const darkOverrides = block('dark');
const fallback = block('dark-fallback');
const boardOverrides = block('board');
const hcLight = block('hc-light');
const hcDark = block('hc-dark');
const hcBoard = block('hc-board');

const drift = Object.keys({ ...darkOverrides, ...fallback }).filter((key) => darkOverrides[key] !== fallback[key]);

/** The cascade for each theme, in the order the stylesheet applies it. */
const THEMES = {
  light: { label: 'Light', tokens: { ...light } },
  dark: { label: 'Dark', tokens: { ...light, ...darkOverrides } },
  board: { label: 'Board', tokens: { ...light, ...darkOverrides, ...boardOverrides } },
  'hc-light': { label: 'High contrast, light', tokens: { ...light, ...hcLight } },
  'hc-dark': { label: 'High contrast, dark', tokens: { ...light, ...darkOverrides, ...hcLight, ...hcDark } },
  'hc-board': {
    label: 'High contrast, board',
    tokens: { ...light, ...hcLight, ...darkOverrides, ...boardOverrides, ...hcDark, ...hcBoard },
  },
};

function luminance(hex) {
  const channel = (index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ['page', 'page-subtle', 'surface', 'surface-raised', 'surface-sunken'];
const STATUS = ['positive', 'warning', 'critical', 'info', 'neutral'];
const PROVENANCE = ['official', 'estimated', 'suggestion', 'demo'];

/** kind: text 4.5:1, ui 3:1 (boundaries, focus, large text), deco reported only. */
const PAIRS = [];
const add = (group, fg, bg, kind, note) => PAIRS.push({ group, fg, bg, kind, note });

for (const bg of SURFACES) {
  add('ink', 'ink', bg, 'text');
  add('ink', 'ink-2', bg, 'text');
  add('ink', 'ink-3', bg, 'text');
}
for (const bg of ['page', 'page-subtle', 'surface', 'surface-raised', 'primary-soft']) add('brand', 'primary-ink', bg, 'text');
add('brand', 'on-primary', 'primary', 'text');
add('brand', 'on-primary', 'primary-hover', 'text');
for (const bg of ['page', 'surface']) add('brand', 'primary', bg, 'ui', 'button fill against its surroundings');
add('surfaces', 'on-inverse', 'inverse', 'text');
add('surfaces', 'on-inverse-dim', 'inverse', 'text');
for (const bg of ['page', 'page-subtle', 'surface', 'gold-soft']) add('accents', 'gold-ink', bg, 'text');
for (const bg of ['page', 'surface']) add('accents', 'gold', bg, 'deco', 'decorative thread only');
for (const bg of ['page', 'surface', 'leaf-soft']) add('accents', 'leaf', bg, 'text');
for (const bg of [...SURFACES, 'primary-soft']) add('accents', 'focus', bg, 'ui');
for (const bg of SURFACES) add('lines', 'line-control', bg, 'ui', 'form control boundary');
for (const bg of ['page', 'surface']) {
  add('lines', 'line', bg, 'deco', 'hairline divider');
  add('lines', 'line-strong', bg, 'deco', 'card edge');
}
for (const tone of STATUS) {
  add('status', `${tone}-fg`, `${tone}-bg`, 'text');
  add('status', `${tone}-fg`, 'page', 'text');
  add('status', `${tone}-fg`, 'surface', 'text');
  add('status', `${tone}-border`, 'page', 'ui');
  add('status', `${tone}-border`, 'surface', 'ui');
}
add('status', 'page', 'critical-fg', 'text', 'danger button label');
for (const tone of PROVENANCE) {
  add('provenance', `${tone}-fg`, `${tone}-bg`, 'text');
  if (tone !== 'official') {
    add('provenance', `${tone}-border`, 'page', 'ui');
    add('provenance', `${tone}-border`, 'surface', 'ui');
  }
}
add('provenance', 'official-bg', 'page', 'ui', 'solid tag against the page');
for (const bg of ['board', 'board-raised']) {
  add('board', 'board-ink', bg, 'text');
  add('board', 'board-dim', bg, 'text');
  add('board', 'board-accent', bg, 'text');
  add('board', 'board-line', bg, 'deco', 'row rule');
}

const THRESHOLD = { text: 4.5, ui: 3, deco: 0 };
const results = [];
const failures = [];
for (const pair of PAIRS) {
  const row = { ...pair, ratios: {} };
  for (const [id, theme] of Object.entries(THEMES)) {
    const fg = theme.tokens[pair.fg];
    const bg = theme.tokens[pair.bg];
    if (!fg || !bg) throw new Error(`Unknown token in pair ${pair.fg} / ${pair.bg}`);
    const ratio = Math.floor(contrast(fg, bg) * 100) / 100;
    row.ratios[id] = ratio;
    if (ratio < THRESHOLD[pair.kind]) failures.push(`${id}: ${pair.fg} (${fg}) on ${pair.bg} (${bg}) = ${ratio.toFixed(2)} < ${THRESHOLD[pair.kind]}`);
  }
  results.push(row);
}

/* ---- generated module ---- */
const header = `/**
 * GENERATED by \`node scripts/design-tokens.mjs\` from src/app/globals.css. Do not edit by hand.
 * Colour token values for every theme, and the measured WCAG contrast of every pair.
 */
`;
const themeIds = Object.keys(THEMES);
const body = `${header}
export type TokenThemeId = ${themeIds.map((id) => `'${id}'`).join(' | ')};

export const TOKEN_THEME_IDS: readonly TokenThemeId[] = ${JSON.stringify(themeIds)};

/** Hex value of every colour token, per theme. */
export const TOKEN_VALUES: Record<TokenThemeId, Record<string, string>> = ${JSON.stringify(
  Object.fromEntries(Object.entries(THEMES).map(([id, theme]) => [id, theme.tokens])),
  null,
  2,
)};

export type ContrastKind = 'text' | 'ui' | 'deco';

export type ContrastGroup = ${[...new Set(PAIRS.map((pair) => `'${pair.group}'`))].join(' | ')};

export interface ContrastPair {
  group: ContrastGroup;
  fg: string;
  bg: string;
  /** text needs 4.5:1, ui (boundaries, focus) needs 3:1, deco is reported only. */
  kind: ContrastKind;
  ratios: Record<TokenThemeId, number>;
}

/** Measured contrast ratio of every foreground and background pair, per theme. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = ${JSON.stringify(
  results.map(({ group, fg, bg, kind, ratios }) => ({ group, fg, bg, kind, ratios })),
  null,
  2,
)};
`;
writeFileSync(resolve(root, 'src/components/design-system/token-data.ts'), body);

/* ---- report ---- */
if (!quiet) {
  const cols = ['light', 'dark', 'hc-light', 'hc-dark'];
  let group = '';
  const lines = [];
  for (const row of results) {
    if (row.group === 'board') continue;
    if (row.group !== group) {
      group = row.group;
      lines.push('', `**${group[0].toUpperCase()}${group.slice(1)}**`, '', '| Foreground | Background | Needs | Light | Dark | HC light | HC dark |', '|---|---|---|---|---|---|---|');
    }
    const need = row.kind === 'text' ? '4.5' : row.kind === 'ui' ? '3.0' : 'n/a';
    const cell = (id) => `${THEMES[id].tokens[row.fg]} on ${THEMES[id].tokens[row.bg]} **${row.ratios[id].toFixed(2)}**`;
    lines.push(`| \`${row.fg}\` | \`${row.bg}\` | ${need} | ${cols.map(cell).join(' | ')} |`);
  }
  lines.push('', '**Board** (the same in both themes)', '', '| Foreground | Background | Needs | Board | HC board |', '|---|---|---|---|---|');
  for (const row of results.filter((item) => item.group === 'board')) {
    const need = row.kind === 'text' ? '4.5' : row.kind === 'ui' ? '3.0' : 'n/a';
    const t = THEMES.board.tokens;
    const h = THEMES['hc-board'].tokens;
    lines.push(
      `| \`${row.fg}\` | \`${row.bg}\` | ${need} | ${t[row.fg]} on ${t[row.bg]} **${row.ratios.board.toFixed(2)}** | ${h[row.fg]} on ${h[row.bg]} **${row.ratios['hc-board'].toFixed(2)}** |`,
    );
  }
  console.log(lines.join('\n'));
}

const measured = results.filter((row) => row.kind !== 'deco');
const minimum = (kind) => Math.min(...measured.filter((row) => row.kind === kind).flatMap((row) => Object.values(row.ratios)));
console.error(
  `\n${PAIRS.length} pairs x ${themeIds.length} themes. Lowest text ratio ${minimum('text').toFixed(2)}:1, lowest UI ratio ${minimum('ui').toFixed(2)}:1.`,
);
if (drift.length) console.error(`Dark fallback block has drifted from the dark block: ${drift.join(', ')}`);
if (failures.length) console.error(`\n${failures.length} FAILURES\n${failures.join('\n')}`);
else console.error('All pairs meet WCAG 2.2 AA.');
process.exit(failures.length || drift.length ? 1 : 0);
