import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { Translator } from '@/lib/i18n/translate';
import { Icon, type IconName } from '@/components/ui/icon';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { Demo, DemoGrid, DsGroup } from './parts';
import { CONTRAST_PAIRS, TOKEN_VALUES, type ContrastPair, type TokenThemeId } from './token-data';

/* ------------------------------------------------------------------------------------------
 * Colour
 * --------------------------------------------------------------------------------------- */

const COLOUR_GROUPS = [
  { key: 'surfaces', tokens: ['page', 'page-subtle', 'surface', 'surface-raised', 'surface-sunken', 'inverse'] },
  { key: 'ink', tokens: ['ink', 'ink-2', 'ink-3', 'on-inverse', 'on-inverse-dim'] },
  { key: 'lines', tokens: ['line', 'line-strong', 'line-control'] },
  { key: 'brand', tokens: ['primary', 'primary-hover', 'on-primary', 'primary-soft', 'primary-ink'] },
  { key: 'accents', tokens: ['gold', 'gold-ink', 'gold-soft', 'leaf', 'leaf-soft', 'focus'] },
  { key: 'board', tokens: ['board', 'board-raised', 'board-ink', 'board-dim', 'board-line', 'board-accent'] },
] as const;

const TONE_ROWS = {
  status: ['positive', 'warning', 'critical', 'info', 'neutral'],
  provenance: ['official', 'estimated', 'suggestion', 'demo'],
} as const;

const swatchStyle = (token: string): CSSProperties => ({ backgroundColor: `var(--color-${token})` });

function Swatch({ token }: { token: string }) {
  return (
    <div className="min-w-0">
      <div className="h-14 rounded-md border border-line-control" style={swatchStyle(token)} />
      <p className="type-data-sm mt-2 truncate text-ink">{token}</p>
      <p className="type-data-xs mt-0.5 text-ink-3">
        {TOKEN_VALUES.light[token]} · {TOKEN_VALUES.dark[token]}
      </p>
    </div>
  );
}

/** A tone as its three tokens working together: text on fill inside the border. */
function ToneSwatch({ tone }: { tone: string }) {
  const style: CSSProperties = {
    backgroundColor: `var(--color-${tone}-bg)`,
    color: `var(--color-${tone}-fg)`,
    borderColor: `var(--color-${tone}-border)`,
  };
  return (
    <div className="min-w-0">
      <div className="type-title-sm flex h-14 items-center rounded-md border px-3" style={style}>
        {tone}
      </div>
      <p className="type-data-xs mt-2 text-ink-3">
        fg {TOKEN_VALUES.light[`${tone}-fg`]} · bg {TOKEN_VALUES.light[`${tone}-bg`]} · border {TOKEN_VALUES.light[`${tone}-border`]}
      </p>
    </div>
  );
}

export function ColourTokens({ t }: { t: Translator }) {
  return (
    <>
      {COLOUR_GROUPS.map((group) => (
        <DsGroup
          key={group.key}
          title={t(`designSystem.groups.${group.key}`)}
          note={group.key === 'accents' ? `${t('designSystem.notes.gold')} ${t('designSystem.notes.focus')}` : undefined}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
            {group.tokens.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
        </DsGroup>
      ))}
      {(['status', 'provenance'] as const).map((kind) => (
        <DsGroup key={kind} title={t(`designSystem.groups.${kind}`)}>
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 xs:grid-cols-2 lg:grid-cols-5">
            {TONE_ROWS[kind].map((tone) => (
              <ToneSwatch key={tone} tone={tone} />
            ))}
          </div>
        </DsGroup>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------------------------------
 * Measured contrast
 * --------------------------------------------------------------------------------------- */

const NEEDS = { text: '4.5', ui: '3.0', deco: null } as const;

function Ratio({ pair, theme }: { pair: ContrastPair; theme: TokenThemeId }) {
  const tokens = TOKEN_VALUES[theme];
  const sample: CSSProperties = { color: tokens[pair.fg], backgroundColor: tokens[pair.bg], borderColor: tokens[pair.fg] };
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {/* A literal sample of the measured pair: these two hex values come from the token data, not from the theme. */}
      <span aria-hidden="true" className="inline-flex size-5 items-center justify-center rounded-xs border text-[0.625rem] leading-none font-bold" style={sample}>
        A
      </span>
      <span className="tabular">{pair.ratios[theme].toFixed(2)}</span>
    </span>
  );
}

export function ContrastTables({ t }: { t: Translator }) {
  const measured = CONTRAST_PAIRS.filter((pair) => pair.kind !== 'deco');
  const lowest = (kind: 'text' | 'ui') =>
    Math.min(...measured.filter((pair) => pair.kind === kind).flatMap((pair) => Object.values(pair.ratios))).toFixed(2);
  const groups = [...new Set(CONTRAST_PAIRS.map((pair) => pair.group))];
  return (
    <>
      <p className="type-body flex items-start gap-2.5 text-ink">
        <Icon name="shield-check" className="mt-0.5 text-positive-fg" />
        <span>{t('designSystem.table.summary', { text: lowest('text'), ui: lowest('ui'), count: CONTRAST_PAIRS.length })}</span>
      </p>
      <div className="rounded-lg border border-line-strong bg-surface">
        <TableScroll label={t('designSystem.table.caption')}>
          <Table density="compact" className="min-w-[46rem]">
            <caption className="sr-only">{t('designSystem.table.caption')}</caption>
            <THead>
              <Tr>
                <Th>{t('designSystem.table.foreground')}</Th>
                <Th>{t('designSystem.table.background')}</Th>
                <Th numeric>{t('designSystem.table.needs')}</Th>
                <Th numeric>{t('designSystem.table.light')}</Th>
                <Th numeric>{t('designSystem.table.dark')}</Th>
                <Th numeric>{t('designSystem.table.hcLight')}</Th>
                <Th numeric>{t('designSystem.table.hcDark')}</Th>
              </Tr>
            </THead>
            {groups.map((group) => {
              const board = group === 'board';
              const columns: TokenThemeId[] = board ? ['board', 'board', 'hc-board', 'hc-board'] : ['light', 'dark', 'hc-light', 'hc-dark'];
              return (
                <TBody key={group}>
                  <Tr>
                    <Th scope="colgroup" colSpan={7} className="bg-page-subtle pt-3 text-ink">
                      {t(`designSystem.groups.${group}`)}
                    </Th>
                  </Tr>
                  {CONTRAST_PAIRS.filter((pair) => pair.group === group).map((pair) => (
                    <Tr key={`${pair.fg}-${pair.bg}`}>
                      <Td mono>{pair.fg}</Td>
                      <Td mono>{pair.bg}</Td>
                      <Td numeric className={cn(!NEEDS[pair.kind] && 'text-ink-3')}>
                        {NEEDS[pair.kind] ?? t('designSystem.table.decorative')}
                      </Td>
                      {columns.map((theme, index) => (
                        <Td key={index} numeric>
                          <Ratio pair={pair} theme={theme} />
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </TBody>
              );
            })}
          </Table>
        </TableScroll>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------------------------
 * Typography
 * --------------------------------------------------------------------------------------- */

const TYPE_SCALE = [
  { cls: 'type-display-xl', name: 'type-display-xl', spec: '38–72 / 1.0 / Fraunces 380', numeric: false },
  { cls: 'type-display-lg', name: 'type-display-lg', spec: '32–52 / 1.04 / Fraunces 380', numeric: false },
  { cls: 'type-display-md', name: 'type-display-md', spec: '26–36 / 1.1 / Fraunces 380', numeric: false },
  { cls: 'type-display-sm', name: 'type-display-sm', spec: '22–26 / 1.18 / Fraunces 400', numeric: false },
  { cls: 'type-title-lg', name: 'type-title-lg', spec: '22 / 1.25 / Hanken 650', numeric: false },
  { cls: 'type-title-md', name: 'type-title-md', spec: '18 / 1.3 / Hanken 650', numeric: false },
  { cls: 'type-title-sm', name: 'type-title-sm', spec: '16 / 1.35 / Hanken 650', numeric: false },
  { cls: 'type-body-lg', name: 'type-body-lg', spec: '18 / 1.6 / Hanken 400', numeric: false },
  { cls: 'type-body', name: 'type-body', spec: '16 / 1.55 / Hanken 400', numeric: false },
  { cls: 'type-body-sm', name: 'type-body-sm', spec: '14 / 1.5 / Hanken 400', numeric: false },
  { cls: 'type-caption', name: 'type-caption', spec: '13 / 1.4 / Hanken 400', numeric: false },
  { cls: 'type-eyebrow', name: 'type-eyebrow', spec: '12 / 1.2 / +0.14em / Hanken 600', numeric: false },
  { cls: 'type-data-xl', name: 'type-data-xl', spec: '24 / 1.0 / Geist Mono 600', numeric: true },
  { cls: 'type-data-lg', name: 'type-data-lg', spec: '20 / 1.1 / Geist Mono 600', numeric: true },
  { cls: 'type-data-md', name: 'type-data-md', spec: '15 / 1.3 / Geist Mono 500', numeric: true },
  { cls: 'type-data-sm', name: 'type-data-sm', spec: '13 / 1.3 / Geist Mono 500', numeric: true },
  { cls: 'type-data-xs', name: 'type-data-xs', spec: '11 / 1.2 / +0.06em / Geist Mono 500', numeric: true },
] as const;

const DATA_SAMPLE = '14:05  MH 2610  C12  KUL';

export function TypeSpecimens({ t }: { t: Translator }) {
  const tagline = t('common.tagline');
  const [first, ...rest] = tagline.split(', ');
  return (
    <>
      <DsGroup title={t('designSystem.groups.families')}>
        <DemoGrid cols={3}>
          <Demo name="font-display · Fraunces" className="block">
            <p className="type-display-lg text-ink">
              {first}
              {rest.length ? (
                <>
                  ,<br />
                  <em className="font-[330]">{rest.join(', ')}</em>
                </>
              ) : null}
            </p>
            <p className="type-caption mt-4 text-ink-2">{t('designSystem.notes.display')}</p>
          </Demo>
          <Demo name="font-sans · Hanken Grotesk" className="block">
            <p className="type-title-lg text-ink">{t('journey.timeline.title')}</p>
            <p className="type-body mt-2 text-ink-2">{t('journey.modes.hint')}</p>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-ink">
              <span className="font-normal">400</span>
              <span className="font-medium">500</span>
              <span className="font-semibold">600</span>
              <span className="font-[650]">650</span>
            </p>
          </Demo>
          <Demo name="font-mono · Geist Mono" className="block">
            <p className="type-data-xl text-ink">14:05 → 16:20</p>
            <p className="type-data-md mt-3 text-ink-2">MH 2610 · AK 6124 · OD 1802</p>
            <p className="type-data-md mt-1 text-ink-2">C12 · H08 · L3 · KUL · PEN · BKI</p>
            <p className="type-caption mt-4 text-ink-2">{t('designSystem.notes.mono')}</p>
          </Demo>
        </DemoGrid>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.scale')}>
        <ul className="border-t border-line-strong">
          {TYPE_SCALE.map((step) => (
            <li key={step.name} className="grid items-baseline gap-x-6 gap-y-1 border-b border-line py-3 md:grid-cols-[minmax(0,1fr)_17rem]">
              <p className={cn(step.cls, 'min-w-0 text-ink')}>{step.numeric ? DATA_SAMPLE : tagline}</p>
              <p className="type-data-sm text-ink-3">
                <span className="text-ink-2">{step.name}</span>
                <br />
                {step.spec}
              </p>
            </li>
          ))}
        </ul>
      </DsGroup>
    </>
  );
}

/* ------------------------------------------------------------------------------------------
 * Space, radius, elevation, motion, dense data, widths
 * --------------------------------------------------------------------------------------- */

const SPACING = [
  { cls: 'w-1', name: '1', px: '4' },
  { cls: 'w-2', name: '2', px: '8' },
  { cls: 'w-3', name: '3', px: '12' },
  { cls: 'w-4', name: '4', px: '16' },
  { cls: 'w-6', name: '6', px: '24' },
  { cls: 'w-8', name: '8', px: '32' },
  { cls: 'w-12', name: '12', px: '48' },
  { cls: 'w-16', name: '16', px: '64' },
  { cls: 'w-20', name: '20', px: '80' },
] as const;

const RADII = [
  { cls: 'rounded-xs', name: 'rounded-xs', px: '3', use: 'Badge, Kbd' },
  { cls: 'rounded-sm', name: 'rounded-sm', px: '5', use: 'Chip, ProvenanceTag' },
  { cls: 'rounded-md', name: 'rounded-md', px: '8', use: 'Button, Input' },
  { cls: 'rounded-lg', name: 'rounded-lg', px: '12', use: 'Card, Callout' },
  { cls: 'rounded-xl', name: 'rounded-xl', px: '16', use: 'Dialog, Sheet' },
  { cls: 'rounded-pill', name: 'rounded-pill', px: '999', use: 'Switch' },
] as const;

const SHADOWS = [
  { cls: 'shadow-xs', name: 'shadow-xs', use: 'Button' },
  { cls: 'shadow-sm', name: 'shadow-sm', use: 'Card interactive' },
  { cls: 'shadow-md', name: 'shadow-md', use: 'Card raised' },
  { cls: 'shadow-lg', name: 'shadow-lg', use: 'Dialog, Popover' },
] as const;

const DENSE = [
  { cls: 'h-row', name: 'h-row', px: '52' },
  { cls: 'h-row-dense', name: 'h-row-dense', px: '40' },
  { cls: 'h-row-compact', name: 'h-row-compact', px: '32' },
  { cls: 'h-chip', name: 'h-chip', px: '28' },
  { cls: 'h-badge', name: 'h-badge', px: '24' },
  { cls: 'h-badge-sm', name: 'h-badge-sm', px: '20' },
  { cls: 'h-touch', name: 'h-touch', px: '44' },
] as const;

const MOTION = [
  { name: 'duration-fast', value: '120ms', use: 'Button, FilterChip' },
  { name: 'duration-base', value: '200ms', use: 'Popover, Tooltip, Accordion' },
  { name: 'duration-slow', value: '360ms', use: 'Dialog, Sheet' },
  { name: 'ease-out', value: 'cubic-bezier(.2,.7,.2,1)', use: 'data-state=open' },
  { name: 'ease-in-out', value: 'cubic-bezier(.65,0,.25,1)', use: 'data-state=closed' },
] as const;

const WIDTHS = [
  { name: 'max-w-reading', value: '42rem / 672', use: 'Container reading' },
  { name: 'max-w-narrow', value: '56rem / 896', use: 'Container narrow' },
  { name: 'max-w-page', value: '77.5rem / 1240', use: 'Container page' },
  { name: 'max-w-wide', value: '90rem / 1440', use: 'Container wide' },
  { name: 'px-gutter', value: 'clamp(16, 4vw, 48)', use: 'Container' },
  { name: 'py-section', value: 'clamp(48, 32 + 4vw, 80)', use: 'Section lg' },
] as const;

const BREAKPOINTS = 'xs 400 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536';

export function LayoutTokens({ t }: { t: Translator }) {
  return (
    <DemoGrid cols={2}>
      <DsGroup title={t('designSystem.groups.spacing')} note="4 px">
        <ul className="flex flex-col gap-2">
          {SPACING.map((step) => (
            <li key={step.name} className="flex items-center gap-4">
              <span className="type-data-sm w-8 text-ink-2">{step.name}</span>
              <span className={cn('h-3 rounded-xs bg-primary', step.cls)} />
              <span className="type-data-sm text-ink-3">{step.px}</span>
            </li>
          ))}
        </ul>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.radii')}>
        <ul className="grid grid-cols-2 gap-4 xs:grid-cols-3">
          {RADII.map((step) => (
            <li key={step.name}>
              <span className={cn('block h-14 border border-line-control bg-surface', step.cls)} />
              <span className="type-data-sm mt-2 block text-ink">
                {step.name} <span className="text-ink-3">{step.px}</span>
              </span>
              <span className="type-caption block text-ink-2">{step.use}</span>
            </li>
          ))}
        </ul>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.elevation')}>
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {SHADOWS.map((step) => (
            <li key={step.name}>
              <span className={cn('block h-16 rounded-lg border border-line bg-surface-raised', step.cls)} />
              <span className="type-data-sm mt-3 block text-ink">{step.name}</span>
              <span className="type-caption block text-ink-2">{step.use}</span>
            </li>
          ))}
        </ul>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.dense')}>
        <ul className="flex flex-wrap items-end gap-3">
          {DENSE.map((step) => (
            <li key={step.name} className="flex flex-col items-start gap-2">
              <span className={cn('type-data-sm flex w-24 items-center justify-center rounded-xs border border-line-control bg-surface text-ink-2', step.cls)}>{step.px}</span>
              <span className="type-data-xs text-ink-3 normal-case">{step.name}</span>
            </li>
          ))}
        </ul>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.motion')}>
        <TokenList rows={MOTION} t={t} />
      </DsGroup>
      <DsGroup title={t('designSystem.groups.widths')} note={BREAKPOINTS}>
        <TokenList rows={WIDTHS} t={t} />
      </DsGroup>
    </DemoGrid>
  );
}

function TokenList({ rows, t }: { rows: readonly { name: string; value: string; use: string }[]; t: Translator }) {
  return (
    <ul aria-label={t('designSystem.table.token')} className="border-t border-line">
      {rows.map((row) => (
        <li key={row.name} className="grid grid-cols-1 gap-x-4 gap-y-0.5 border-b border-line py-2 xs:grid-cols-[9rem_minmax(0,1fr)]">
          <span className="type-data-sm text-ink">{row.name}</span>
          <span className="min-w-0">
            <span className="type-data-sm block break-words text-ink-2">{row.value}</span>
            <span className="type-caption block text-ink-3">{row.use}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------------------------------
 * Icons
 * --------------------------------------------------------------------------------------- */

const ICON_SAMPLES: IconName[] = [
  'plane-takeoff',
  'plane-landing',
  'arrow-left-right',
  'users',
  'tower-control',
  'map',
  'map-pin',
  'train-front',
  'bus-front',
  'car-taxi-front',
  'square-parking',
  'utensils',
  'shopping-bag',
  'armchair',
  'luggage',
  'baggage-claim',
  'scan-line',
  'id-card',
  'door-open',
  'moon-star',
  'baby',
  'accessibility',
  'hand-helping',
  'wifi',
  'bookmark',
  'sparkles',
  'search',
  'megaphone',
  'clock',
  'badge-check',
  'calculator',
  'lightbulb',
  'flask-conical',
  'circle-check',
  'triangle-alert',
  'octagon-alert',
];

export function IconSamples() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
      {ICON_SAMPLES.map((name) => (
        <li key={name} className="flex min-h-11 min-w-0 items-center gap-3 border-b border-line py-2 text-ink">
          <Icon name={name} />
          <span className="type-data-sm min-w-0 break-words text-ink-2">{name}</span>
        </li>
      ))}
    </ul>
  );
}
