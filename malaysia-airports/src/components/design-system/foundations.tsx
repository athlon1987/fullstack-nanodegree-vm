import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { Translator } from '@/lib/i18n/translate';
import { Icon, type IconName } from '@/components/ui/icon';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { StatusPill, type StatusPillTone } from '@/components/ui/status-pill';
import type { DsCopy } from './copy';
import { Demo, DemoGrid, DsGroup } from './parts';
import { CONTRAST_PAIRS, TOKEN_VALUES, type ContrastPair, type TokenThemeId } from './token-data';

/* ------------------------------------------------------------------------------------------
 * Colour
 * --------------------------------------------------------------------------------------- */

const COLOUR_GROUPS = [
  { key: 'brand', local: true, tokens: ['midnight', 'midnight-2', 'primary', 'primary-hover', 'primary-soft', 'primary-ink', 'inverse', 'on-midnight-dim'] },
  { key: 'surfaces', local: true, tokens: ['page', 'page-subtle', 'surface', 'surface-sunken', 'ivory', 'fill', 'fill-hover'] },
  { key: 'ink', local: false, tokens: ['ink', 'ink-2', 'ink-3', 'on-inverse', 'on-inverse-dim'] },
  { key: 'lines', local: false, tokens: ['line', 'line-strong', 'line-control'] },
  { key: 'accents', local: true, tokens: ['gold', 'gold-hover', 'on-gold', 'gold-ink', 'gold-soft', 'gold-bright', 'leaf', 'focus'] },
  { key: 'board', local: false, tokens: ['board', 'board-raised', 'board-ink', 'board-dim', 'board-line', 'board-accent'] },
] as const;

const FLIGHT_TONES: StatusPillTone[] = ['scheduled', 'ontime', 'boarding', 'delayed', 'cancelled', 'landed', 'departed'];

const TONE_ROWS = {
  status: ['positive', 'warning', 'critical', 'info', 'neutral'],
  provenance: ['official', 'estimated', 'suggestion', 'demo'],
} as const;

const swatchStyle = (token: string): CSSProperties => ({ backgroundColor: `var(--color-${token})` });

function Swatch({ token }: { token: string }) {
  return (
    <div className="min-w-0">
      <div className="h-16 rounded-lg border border-line shadow-xs" style={swatchStyle(token)} />
      <p className="type-data-sm mt-2 break-words text-ink">{token}</p>
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
      <div className="type-title-sm flex h-14 items-center rounded-lg border px-3" style={style}>
        {tone}
      </div>
      <p className="type-data-xs mt-2 text-ink-3">
        fg {TOKEN_VALUES.light[`${tone}-fg`]} · bg {TOKEN_VALUES.light[`${tone}-bg`]} · border {TOKEN_VALUES.light[`${tone}-border`]}
      </p>
    </div>
  );
}

/** A flight tone as its soft and solid pills, with the token values under them. */
function FlightToneSwatch({ tone }: { tone: StatusPillTone }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2">
        <StatusPill tone={tone}>{tone}</StatusPill>
        <StatusPill tone={tone} variant="solid">
          {tone}
        </StatusPill>
      </div>
      <p className="type-data-xs mt-2 text-ink-3">
        fg {TOKEN_VALUES.light[`flight-${tone}-fg`]} · solid {TOKEN_VALUES.light[`flight-${tone}-solid`]}
      </p>
    </div>
  );
}

export function ColourTokens({ t, c }: { t: Translator; c: DsCopy }) {
  return (
    <>
      {COLOUR_GROUPS.map((group) => (
        <DsGroup
          key={group.key}
          title={group.local ? c.groups[group.key as 'brand' | 'surfaces' | 'accents'] : t(`designSystem.groups.${group.key as 'ink' | 'lines' | 'board'}`)}
          note={group.key === 'accents' ? `${c.notes.gold} ${c.notes.focus}` : undefined}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 lg:grid-cols-8">
            {group.tokens.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
        </DsGroup>
      ))}
      <DsGroup title={c.groups.flightTones} note={c.notes.pills}>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 xs:grid-cols-2 lg:grid-cols-4">
          {FLIGHT_TONES.map((tone) => (
            <FlightToneSwatch key={tone} tone={tone} />
          ))}
        </div>
      </DsGroup>
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

const LOCAL_GROUPS = ['flight', 'glass', 'media'] as const;

export function ContrastTables({ t, c }: { t: Translator; c: DsCopy }) {
  const groupLabel = (group: string) =>
    (LOCAL_GROUPS as readonly string[]).includes(group)
      ? c.groups[group as (typeof LOCAL_GROUPS)[number]]
      : t(`designSystem.groups.${group as 'surfaces' | 'ink' | 'lines' | 'brand' | 'accents' | 'board' | 'status' | 'provenance'}`);
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
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <TableScroll label={t('designSystem.table.caption')}>
          {/* Phones show the pair in one cell with the two standard themes; the background, the
              threshold and the high-contrast columns join as the screen widens. */}
          <Table density="compact">
            <caption className="sr-only">{t('designSystem.table.caption')}</caption>
            <THead>
              <Tr>
                <Th>{t('designSystem.table.foreground')}</Th>
                <Th className="max-md:hidden">{t('designSystem.table.background')}</Th>
                <Th numeric className="max-md:hidden">
                  {t('designSystem.table.needs')}
                </Th>
                <Th numeric>{t('designSystem.table.light')}</Th>
                <Th numeric>{t('designSystem.table.dark')}</Th>
                <Th numeric className="max-xl:hidden">
                  {t('designSystem.table.hcLight')}
                </Th>
                <Th numeric className="max-xl:hidden">
                  {t('designSystem.table.hcDark')}
                </Th>
              </Tr>
            </THead>
            {groups.map((group) => {
              const board = group === 'board';
              const columns: TokenThemeId[] = board ? ['board', 'board', 'hc-board', 'hc-board'] : ['light', 'dark', 'hc-light', 'hc-dark'];
              return (
                <TBody key={group}>
                  <Tr>
                    <Th scope="colgroup" colSpan={7} className="bg-page-subtle pt-3 text-ink">
                      {groupLabel(group)}
                    </Th>
                  </Tr>
                  {CONTRAST_PAIRS.filter((pair) => pair.group === group).map((pair) => (
                    <Tr key={`${pair.fg}-${pair.bg}`}>
                      <Td mono className="max-md:py-1.5">
                        {pair.fg}
                        <span className="block text-ink-3 md:hidden">
                          <span className="sr-only">{t('designSystem.table.background')}: </span>
                          {pair.bg}
                        </span>
                      </Td>
                      <Td mono className="max-md:hidden">
                        {pair.bg}
                      </Td>
                      <Td numeric className={cn('max-md:hidden', !NEEDS[pair.kind] && 'text-ink-3')}>
                        {NEEDS[pair.kind] ?? t('designSystem.table.decorative')}
                      </Td>
                      {columns.map((theme, index) => (
                        <Td key={index} numeric className={cn(index > 1 && 'max-xl:hidden')}>
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
  { cls: 'type-display-2xl', spec: '44–88 / 0.98 / −0.042em / Hanken 650', numeric: false },
  { cls: 'type-display-xl', spec: '38–72 / 1.0 / −0.038em / Hanken 650', numeric: false },
  { cls: 'type-display-lg', spec: '32–56 / 1.04 / −0.032em / Hanken 650', numeric: false },
  { cls: 'type-display-md', spec: '26–40 / 1.08 / −0.026em / Hanken 650', numeric: false },
  { cls: 'type-display-sm', spec: '22–28 / 1.15 / −0.02em / Hanken 650', numeric: false },
  { cls: 'type-serif-lg', spec: '28–44 / 1.08 / Fraunces 380', numeric: false },
  { cls: 'type-title-lg', spec: '22 / 1.25 / Hanken 650', numeric: false },
  { cls: 'type-title-md', spec: '18 / 1.3 / Hanken 650', numeric: false },
  { cls: 'type-title-sm', spec: '16 / 1.35 / Hanken 650', numeric: false },
  { cls: 'type-lead', spec: '18–21 / 1.5 / Hanken 400', numeric: false },
  { cls: 'type-body', spec: '16 / 1.55 / Hanken 400', numeric: false },
  { cls: 'type-body-sm', spec: '14 / 1.5 / Hanken 400', numeric: false },
  { cls: 'type-caption', spec: '13 / 1.4 / Hanken 400', numeric: false },
  { cls: 'type-overline', spec: '12 / 1.2 / +0.16em / Hanken 650 caps', numeric: false },
  { cls: 'type-data-xl', spec: '24 / 1.0 / Geist Mono 600', numeric: true },
  { cls: 'type-data-md', spec: '14 / 1.3 / Geist Mono 500', numeric: true },
  { cls: 'type-data-xs', spec: '11 / 1.2 / +0.06em / Geist Mono 500', numeric: true },
] as const;

const DATA_SAMPLE = '14:05  MH 2610  C12  KUL';

export function TypeSpecimens({ t, c }: { t: Translator; c: DsCopy }) {
  const tagline = t('common.tagline');
  return (
    <>
      <DsGroup title={t('designSystem.groups.families')}>
        <DemoGrid cols={3}>
          <Demo name="font-heading · Hanken Grotesk 650" className="block">
            <p className="type-display-lg text-ink">{c.samples.heroTitle}</p>
            <p className="type-caption mt-4 text-ink-2">{c.notes.display}</p>
          </Demo>
          <Demo name="font-serif · Fraunces (accent)" className="block">
            <p className="type-serif-lg text-ink">
              <span className="text-gold-ink">Selamat datang.</span> {tagline}
            </p>
            <p className="type-caption mt-4 text-ink-2">{c.notes.serif}</p>
          </Demo>
          <Demo name="font-mono · Geist Mono" className="block">
            <p className="type-data-xl text-ink">14:05 → 16:20</p>
            <p className="type-data-md mt-3 text-ink-2">MH 2610 · AK 6124 · OD 1802</p>
            <p className="type-data-md mt-1 text-ink-2">C12 · H08 · L3 · KUL · PEN · BKI</p>
            <p className="type-caption mt-4 text-ink-2">{c.notes.mono}</p>
          </Demo>
        </DemoGrid>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.scale')}>
        <ul className="border-t border-line">
          {TYPE_SCALE.map((step) => (
            <li key={step.cls} className="grid items-baseline gap-x-6 gap-y-1 border-b border-line py-4 md:grid-cols-[minmax(0,1fr)_17rem]">
              <p className={cn(step.cls, 'min-w-0 text-ink')}>{step.numeric ? DATA_SAMPLE : tagline}</p>
              <p className="type-data-sm text-ink-3">
                <span className="text-ink-2">{step.cls}</span>
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
  { cls: 'rounded-xs', name: 'rounded-xs', px: '6', use: 'Badge, Kbd' },
  { cls: 'rounded-sm', name: 'rounded-sm', px: '10', use: 'Small tiles' },
  { cls: 'rounded-md', name: 'rounded-md', px: '12', use: 'Input, Select, Tooltip' },
  { cls: 'rounded-lg', name: 'rounded-lg', px: '16', use: 'Swatch, tile' },
  { cls: 'rounded-xl', name: 'rounded-xl', px: '20', use: 'Card, Callout' },
  { cls: 'rounded-2xl', name: 'rounded-2xl', px: '24', use: 'MediaCard, Popover, GlassPanel' },
  { cls: 'rounded-3xl', name: 'rounded-3xl', px: '28', use: 'HeroMedia inset, Dialog, Sheet' },
  { cls: 'rounded-pill', name: 'rounded-pill', px: '999', use: 'Button, Chip, Tabs, Search, StatusPill' },
] as const;

const SHADOWS = [
  { cls: 'shadow-xs', name: 'shadow-xs', use: 'Input, Kbd' },
  { cls: 'shadow-sm', name: 'shadow-sm', use: 'Card, Button' },
  { cls: 'shadow-md', name: 'shadow-md', use: 'Card raised, MediaCard' },
  { cls: 'shadow-lg', name: 'shadow-lg', use: 'Hover lift, glass' },
  { cls: 'shadow-xl', name: 'shadow-xl', use: 'Dialog, Popover' },
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
  { name: 'duration-fast', value: '140ms', use: 'Button, FilterChip, Tabs' },
  { name: 'duration-base', value: '240ms', use: 'Card lift, Popover, Accordion' },
  { name: 'duration-slow', value: '420ms', use: 'Dialog, Sheet' },
  { name: 'duration-slower', value: '700ms', use: 'Image zoom on hover' },
  { name: 'ease-out', value: 'cubic-bezier(.22,1,.36,1)', use: 'Entrances, hover' },
  { name: 'ease-in-out', value: 'cubic-bezier(.65,0,.35,1)', use: 'Exits' },
  { name: 'motion-ok:', value: 'variant', use: 'Movement only when allowed' },
] as const;

const WIDTHS = [
  { name: 'max-w-reading', value: '42rem / 672', use: 'Container reading' },
  { name: 'max-w-narrow', value: '56rem / 896', use: 'Container narrow' },
  { name: 'max-w-page', value: '77.5rem / 1240', use: 'Container page' },
  { name: 'max-w-wide', value: '90rem / 1440', use: 'Container wide' },
  { name: 'px-gutter', value: 'clamp(16, 4vw, 48)', use: 'Container' },
  { name: 'py-section', value: 'clamp(56, 32 + 5vw, 112)', use: 'Section lg' },
  { name: 'py-section-sm', value: 'clamp(40, 28 + 2.5vw, 64)', use: 'Compact bands' },
] as const;

const BREAKPOINTS = 'xs 400 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536';

export function LayoutTokens({ t, c }: { t: Translator; c: DsCopy }) {
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
        <ul className="grid grid-cols-2 gap-4 xs:grid-cols-4">
          {RADII.map((step) => (
            <li key={step.name}>
              <span className={cn('block h-14 border border-line-strong bg-page-subtle', step.cls)} />
              <span className="type-data-sm mt-2 block text-ink">
                {step.name} <span className="text-ink-3">{step.px}</span>
              </span>
              <span className="type-caption block text-ink-2">{step.use}</span>
            </li>
          ))}
        </ul>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.elevation')}>
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {SHADOWS.map((step) => (
            <li key={step.name}>
              <span className={cn('block h-16 rounded-xl border border-line bg-surface-raised', step.cls)} />
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
      <DsGroup title={t('designSystem.groups.motion')} note={c.notes.motion}>
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
