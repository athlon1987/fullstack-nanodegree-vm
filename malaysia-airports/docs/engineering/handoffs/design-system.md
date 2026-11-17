# Hand-off: design system

Owner: design-system. Scope: `src/app/globals.css`, `src/fonts/**`, `src/components/ui/**`,
`src/components/common/**`, `src/components/art/**`, `src/app/[lang]/layout.tsx` (minimal),
`src/app/[lang]/design-system/**`, `src/components/design-system/**`, `scripts/design-tokens.mjs`.
Client document: `docs/design/design-system.md`. Living reference: `/en/design-system`.

Status (17 Nov 2026): `npx tsc --noEmit` clean; `npx eslint src scripts` clean; `npx vitest run`
179 of 179; `npx next build` succeeds (`/en/design-system` and `/ms/design-system` are `○`).
Contrast: 95 pairs in 6 themes, lowest text 5.28:1, lowest boundary 3.41:1, no failures.
Checked in a browser at 360 to 1600 px, light, dark, high contrast and forced colours.

## 1. Rules before you build

1. **Tokens only.** Tailwind's default palette, radii and shadows are removed: `bg-white`,
   `text-gray-500`, `rounded-2xl` and `shadow-xl` do not exist. Use the utilities in section 2.
   No hex values and no `dark:` colour overrides in components: themes come from the tokens.
2. **Copy comes from the dictionaries.** Components here take text as props or read it with
   `useT()`. Never hard-code a string.
3. **Primary is for the one main action.** Brand indigo is never a status; gold is decoration only
   (`text-gold`, `bg-gold` on hairlines and ornaments; `text-gold-ink` for eyebrow text); the
   focus colour is only for focus.
4. **Status needs icon, shape and words.** Use `FlightStatusChip`, `Chip` with an icon, `Callout`
   or `NoticeCard`. Never a coloured dot.
5. **Demo data needs `DemoDataBanner`** (or the `demo` `ProvenanceTag` on a single row) and a
   `Freshness` row. Guidance needs a `ProvenanceTag`. Missing facts use `NotPublished`.
6. **Touch targets**: `Button`, `IconButton`, `FilterChip`, links styled `link-action` already
   reach 44 px on phones. For your own compact controls add `touch:min-h-11 touch:min-w-11`.
7. **Never read the clock in render.** `LocalTime` and `Freshness` are safe; for your own code use
   `useNow()`.
8. **Dense data responds to its container**, not the viewport: put `@container` on the wrapper and
   switch with `@4xl:` and friends, so it also adapts to the text-size setting (see
   `src/components/design-system/board-sample.tsx` for the board pattern: table when wide, stacked
   rows when narrow).
9. After changing any colour run `node scripts/design-tokens.mjs`. It regenerates
   `src/components/design-system/token-data.ts`, prints the Markdown contrast report, and exits 1
   on a contrast failure or if the no-JavaScript dark block drifts from the dark block.

## 2. Token utilities

| Group | Utilities |
|---|---|
| Surfaces | `bg-page`, `bg-page-subtle`, `bg-surface`, `bg-surface-raised`, `bg-surface-sunken`, `bg-inverse` + `text-on-inverse`, `text-on-inverse-dim` |
| Ink | `text-ink`, `text-ink-2`, `text-ink-3` |
| Lines | `border-line` (hairline), `border-line-strong` (card edge), `border-line-control` (form controls, 3:1) |
| Brand | `bg-primary`, `hover:bg-primary-hover`, `text-on-primary`, `bg-primary-soft`, `text-primary-ink` |
| Accents | `text-gold`, `bg-gold`, `text-gold-ink`, `bg-gold-soft`, `text-leaf`, `bg-leaf-soft`, `outline-focus` |
| Status | `{text,bg,border}-{positive,warning,critical,info,neutral}-{fg,bg,border}`, for example `border-warning-border bg-warning-bg text-warning-fg` |
| Provenance | `{official,estimated,suggestion,demo}-{fg,bg,border}` (use `ProvenanceTag`, not these directly) |
| Board | `surface-board` on a wrapper switches every token inside to board values; `text-board-accent` for times; also `bg-board`, `bg-board-raised`, `text-board-ink`, `text-board-dim`, `border-board-line` |
| Type | `type-display-xl/lg/md/sm` (Fraunces, headings only), `type-title-lg/md/sm`, `type-body-lg`, `type-body`, `type-body-sm`, `type-caption`, `type-eyebrow`, `type-data-xl/lg/md/sm/xs` (Geist Mono, tabular); families `font-display`, `font-sans`, `font-mono`; `tabular` |
| Radius | `rounded-xs` 3, `rounded-sm` 5, `rounded-md` 8, `rounded-lg` 12, `rounded-xl` 16, `rounded-pill` |
| Shadow | `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg` |
| Motion | `duration-fast` 120 ms, `duration-base` 200 ms, `duration-slow` 360 ms, `ease-out`, `ease-in-out`, `animate-fade-in`, `animate-rise-in`, `animate-shimmer`, sheet and collapse animations |
| Layout | `max-w-reading` 42rem, `max-w-narrow` 56rem, `max-w-page` 77.5rem, `max-w-wide` 90rem, `px-gutter`, `py-section`, `top-header` / `h-header` (4.25rem), breakpoint `xs:` 400 px |
| Dense data | `h-row` 52, `h-row-dense` 40, `h-row-compact` 32, `h-chip` 28, `h-badge` 24, `h-badge-sm` 20, `min-h-touch` / `size-touch` 44 |
| Patterns | `pattern-rebung`, `pattern-rebung-lg`, `pattern-tabur`, `pattern-tabur-fade`, `pattern-weave` (masks in `currentColor`), `hazard-stripes` |
| Helpers | `link` (inline text link), `link-action` (standalone link, 44 px on touch), `focus-ring`, `focus-ring-inset`, `scroll-fade-x` |
| Variants | `dark:`, `hc:` (high contrast), `touch:` (phones and coarse pointers), `on-board:` (inside `.surface-board`), `forced-colors:` |

`<html>` attributes (set by `PREFERENCES_INIT_SCRIPT`): `data-theme="light|dark"`,
`data-contrast="normal|more"`, `data-text-size="100|112|125"`, `data-motion="normal|reduce"`.
The stylesheet also accepts `data-contrast="high"` and `data-motion="reduced"`.

## 3. Primitives: `@/components/ui/<file>`

`C` marks a Client Component (it works inside Server Components; it just ships JavaScript).

| Export (file) | Props (defaults first) | Example |
|---|---|---|
| `Button`, `buttonClasses` (`button`) | `variant` primary, secondary, ghost, quiet, danger; `size` md, sm, lg; `asChild`; `loading`, `loadingLabel`; `iconStart`, `iconEnd`; `block` | `<Button iconEnd="arrow-right">{t('common.actions.search')}</Button>` |
| `IconButton` (`icon-button`) | `label` (required), `icon`; `variant` ghost, secondary, primary, quiet; `size` md, sm, lg; `pressed` | `<IconButton icon="bookmark" label={t('common.actions.save')} pressed={saved} />` |
| `Chip` (`chip`) | `tone` neutral, outline, solid, primary, gold, positive, warning, critical, info; `icon` | `<Chip icon="moon-star">{t('common.labels.open24Hours')}</Chip>` |
| `FilterChip` C (`filter-chip`) | `pressed`, `onPressedChange`; `icon`; `count` | `<FilterChip pressed={halal} onPressedChange={setHalal}>Halal</FilterChip>` |
| `Badge` (`badge`) | `tone` neutral, solid, primary, gold, positive, warning, critical, info; `size` md, sm | `<Badge tone="solid">L3</Badge>` |
| `Card`, `CardHeader`, `CardBody`, `CardFooter`, `CardLink` (`card`) | `variant` outline, raised, sunken, plain; `padding` none, sm, md, lg; `interactive`; `as` | `<Card interactive padding="md"><h3><CardLink href="/kul/parking">…</CardLink></h3></Card>` |
| `Input` (`input`) | `label` (required), `hideLabel`, `hint`, `error`, `optionalLabel`, `iconStart`, `mono`, `fieldClassName` + input attributes | `<Input label={t('common.labels.flight')} error={msg} mono />` |
| `Field`, `controlClasses`, `describedBy` (`field`) | `id`, `label`, `hideLabel`, `hint`, `error`, `optionalLabel` | Wrap a custom control with the standard label, hint and error |
| `SearchField` C (`search-field`) | `label` (required), `hideLabel`, `value` / `defaultValue`, `onValueChange`, `onClear`, `placeholder`, `placeholderShort`, `icon` (search; `null` for none), `size` md, lg; `trailing`, `hint` | `<SearchField label={t('search.label')} size="lg" trailing={<Button size="sm">…</Button>} />` |
| `NativeSelect` (`native-select`) | `label` (required), `hideLabel`, `hint`, `error`, `iconStart`, `fieldClassName` + select attributes | `<NativeSelect label={t('common.labels.terminal')}><option>…</option></NativeSelect>` |
| `SegmentedControl` C (`segmented-control`) | `label` (required), `showLabel`, `options` `{ value, label, icon?, hint?, disabled? }[]`, `value` / `defaultValue`, `onValueChange`, `name`, `size` md, lg; `block`, `stackOnPhone` | `<SegmentedControl label={…} options={modes} value={mode} onValueChange={set} stackOnPhone />` |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` C (`tabs`) | Radix Tabs props; give `TabsList` an `aria-label` | `<Tabs defaultValue="t1"><TabsList aria-label={…}><TabsTrigger value="t1">…` |
| `Accordion`, `AccordionItem` C (`accordion`) | Radix root props (`type`, `collapsible`); item: `value`, `title`, `headingLevel` 3 | `<Accordion type="single" collapsible><AccordionItem value="a" title={q}>{a}</AccordionItem></Accordion>` |
| `Dialog`, `DialogTrigger`, `DialogClose`, `DialogContent` C (`dialog`) | content: `title` (required), `hideTitle`, `description`, `variant` modal, sheet; `size` md, sm, lg; `footer` | `<Dialog><DialogTrigger asChild><Button>…</Button></DialogTrigger><DialogContent title={…}>…</DialogContent></Dialog>` |
| `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent` C (`dialog`) | As Dialog; side panel from `sm`, bottom sheet on phones | `<SheetContent title={t('preferences.title')}>…</SheetContent>` |
| `Popover`, `PopoverTrigger`, `PopoverClose`, `PopoverAnchor`, `PopoverContent` C (`popover`) | Radix props; `align` start, `sideOffset` 8 | `<Popover><PopoverTrigger asChild>…</PopoverTrigger><PopoverContent>…</PopoverContent></Popover>` |
| `Tooltip` C (`tooltip`) | `content`, `side` top; one focusable child | `<Tooltip content={hint}><IconButton … /></Tooltip>` |
| `Switch` C (`switch`) | `label` (required), `hint`, `checked`, `onCheckedChange` | `<Switch label={t('preferences.highContrast')} checked={on} onCheckedChange={set} />` |
| `Skeleton`, `SkeletonText` (`skeleton`) | `className`; `lines` 3 | `<Skeleton className="h-row w-full" />` inside one `role="status"` region |
| `Separator` (`separator`) | `variant` hairline, strong, rebung; `orientation` | `<Separator variant="rebung" />` |
| `Kbd`, `VisuallyHidden` (`kbd`, `visually-hidden`) | children | `<Kbd>/</Kbd>` |
| `DataList`, `DataListItem` (`data-list`) | list: `layout` rows, stacked; `dense`. item: `label`, `icon`, `mono` | `<DataList><DataListItem label={t('common.labels.gate')} mono>C12</DataListItem></DataList>` |
| `TableScroll`, `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` (`table`) | scroll: `label` (required). table: `density` default, dense, compact. `Tr muted`; `Th numeric`; `Td numeric`, `mono` | See the JSDoc example in the file; always add a `<caption>` |
| `Callout` (`callout`) | `tone` neutral, info, positive, warning, critical; `title`, `icon`, `actions` | `<Callout tone="warning" title={…}>{body}</Callout>` |
| `Timeline`, `TimelineItem` (`timeline`) | item: `state` upcoming, current, done; `stateLabel`, `time`, `eyebrow`, `title`, `meta`, `actions` | `<Timeline><TimelineItem state="current" time="05:25" title={…} meta={<ProvenanceTag …/>} /></Timeline>` |
| `Stat` (`stat`) | `value`, `label`, `hint`, `mono`, `size` md, lg | `<Stat value={39} label={t('nav.airports')} />` |
| `Container` (`container`) | `size` page, reading, narrow, wide, full; `as` | `<Container size="narrow">…</Container>` |
| `Section` (`section`) | `tone` page, subtle, surface, inverse, board; `spacing` lg, md, sm, none; `width` page (or `false`); `as` | `<Section tone="subtle" aria-labelledby="x">…</Section>` |
| `Icon`, `ICON_NAMES`, `resolveIconName`, types `IconName`, `IconKey` (`icon`) | `name` (registry name or a domain key such as `prayer-room`, `rail`, `departing`), `size` md, xs, sm, lg, xl; `label`; `strokeWidth` 1.5 | `<Icon name="plane-takeoff" size="sm" />` |

## 4. Domain components: `@/components/common/<file>`

| Export (file) | Props | Example |
|---|---|---|
| `LocaleLink` C (`locale-link`) | `href` without the locale; `lang` to override (language switcher); other `next/link` props | `<LocaleLink href="/kul/flights">{t('nav.flights')}</LocaleLink>` |
| `ExternalLink` C (`external-link`) | `href`; `variant` inline, action, plain; `hideIcon` | `<ExternalLink href={source.url}>{source.title}</ExternalLink>` |
| `ProvenanceTag`, `PROVENANCE_ICONS` C (`provenance-tag`) | `provenance`; `length` full, short | `<ProvenanceTag provenance={step.provenance} />` |
| `ProvenanceLegend` C (`provenance-legend`) | `kinds` (all four), `headingLevel` 3 or `null` | `<ProvenanceLegend />` |
| `SourceNote` C (`source-note`) | `sources: Source[]` (from `resolveSources(ids)` on the server), `defaultOpen` | `<SourceNote sources={resolveSources(item.sources)} />` |
| `DemoDataBanner` C (`demo-data-banner`) | `children` (replace the body), `compact`, `hideLink`, `attached` (caps a board) | `<DemoDataBanner attached />` |
| `Freshness` C (`freshness`) | `updatedAt` (instant or `null` while loading), `refreshSeconds`, `context`, `live` polite, off | `<Freshness updatedAt={provider?.meta().generatedAt ?? null} refreshSeconds={30} />` |
| `FlightStatusChip` C (`flight-status-chip`) | `status: FlightStatus`; `size` md, sm; `detail` | `<FlightStatusChip status={flight.status} />` |
| `TerminalBadge` C (`terminal-badge`) | `terminal` T1, T2, MAIN; `size` md, sm | `<TerminalBadge terminal={flight.terminal} size="sm" />` |
| `AirportCode` (`airport-code`) | `code`, `name` (spoken), `variant` plain, boxed; `size` md, sm, lg | `<AirportCode code="KUL" name={airport.name} />` |
| `LocalTime` C (`local-time`) | `timeZone` (airport time), `showLabel`, `zone` auto, always, never | `<LocalTime showLabel />` |
| `EmptyState` (`empty-state`) | `title`, `children`, `icon`, `action`, `headingLevel` 3, `variant` card, plain | `<EmptyState title={t('flights.board.noFlights')} action={…}>{t('empty.officialPointer')}</EmptyState>` |
| `PageHeader` (`page-header`) | `title` (the `h1`), `eyebrow`, `lead`, `breadcrumbs`, `actions`, `meta`, `art`, `tone` page, subtle; `size` md, lg; `width` | `<PageHeader title={…} lead={…} breadcrumbs={<Breadcrumbs items={[…]} />} />` |
| `Breadcrumbs` C (`breadcrumbs`) | `items: { label, href? }[]` (last item is the current page), `hideHome` | `<Breadcrumbs items={[{ label: 'KLIA', href: '/kul' }, { label: t('nav.parking') }]} />` |
| `SectionHeading` (`section-heading`) | `title`, `number`, `eyebrow`, `lead`, `action`, `level` 2, 3; `variant` display, title; `id` | `<SectionHeading number={2} eyebrow={t('nav.notices')} title={…} />` |
| `QuickAction` (`quick-action`) | `icon`, `title`, `hint`, `href`, `emphasis`, `emphasisLabel`, `layout` tile, row | `<QuickAction icon="square-parking" title={…} hint={…} href="/kul/parking" />` |
| `NoticeCard` C (`notice-card`) | `severity` info, advisory, warning, critical; `title`, `children`, `provenance`, `scope`, `period`, `footer`, `headingLevel` 3 | `<NoticeCard severity={n.severity} title={…} provenance={n.provenance}>{body}</NoticeCard>` |
| `TranslationNotice` C (`translation-notice`) | `className` | Show when `hasTranslation(text, lang)` is false |
| `KeyFact` (`key-fact`) | `label`, `value`, `hint`, `provenance`, `sources`, `mono` | `<KeyFact label={t('nav.airports')} value={39} provenance="official" sources={sources} />` |
| `NotPublished` C (`not-published`) | `officialUrl`, `variant` inline, block; `label` | `<NotPublished officialUrl={airport.contacts.website} />` |
| `SkipLink` (`skip-link`) | `label`, `target` main | Already mounted in the root layout |

## 5. Art: `@/components/art/<file>`

| Export (file) | Props | Notes |
|---|---|---|
| `BrandMark` (`brand-mark`) | `label`, `className` (size) | Original mark; NOT the official logo. Decorative unless `label` is set |
| `Wordmark` (`wordmark`) | `name` (`t('common.appName')`), `size` md, sm, lg | Wrap in the home link; the name is real text |
| `RebungRule`, `TaburField`, `WeaveTexture` (`patterns`) | `size` sm, lg; `fade`; `className` | Decorative, `aria-hidden`; position with utilities; never behind text |
| `AirportVignette`, `VIGNETTE_KEYS` (`airport-vignette`) | `code` (any case), `terminal` (T1 or T2 for KUL), `ground` sunken, surface, page, subtle; `label` | KUL T1, KUL T2, PEN, BKI, KCH, LGK, SZB; every other code gets the generic drawing. Set `ground` to the surface behind it |

Fonts: `import { fontVariables } from '@/fonts'` (already on `<html>`). Do not call `localFont` again.

## 6. Root layout: what is there, what is yours

`src/app/[lang]/layout.tsx` has `generateStaticParams` (en, ms), `generateMetadata`
(`metadataBase`, title template), `viewport`, the font variables, `PREFERENCES_INIT_SCRIPT` in
`<head>`, `I18nProvider`, the skip link and `<main id="main" tabIndex={-1}>`. Two marked comments
show where the header and the footer mount (foundation-ui). When you add them:

- Keep the header opaque (no blur) and keep `--spacing-header` in `globals.css` equal to its
  height: scroll padding reads it.
- Call `usePreferencesSync()` once in the always-mounted shell.
- Wrap any `usePathname` / `useParams` reader in `<Suspense>` at the leaf (Next.js notes, section 15).
- Use `Wordmark` inside a `LocaleLink href="/"`; use `Sheet` for the phone menu and preferences.

## 7. Do and don't

- Do use `PageHeader` + `Breadcrumbs` on every page and `SectionHeading` for sections.
- Do pass `resolveSources(ids)` results as props; never import `@/content` in a Client Component.
- Do put board-like data inside `<Section tone="board">` or a `surface-board` wrapper: chips,
  tags, tables and buttons restyle themselves.
- Do keep one `h1` per page (`PageHeader` renders it) and set `headingLevel` on cards and notices.
- Don't use the display face for labels, buttons or data; don't use gold for anything that means
  something; don't use `text-board-accent` outside the board.
- Don't truncate with an ellipsis: let labels wrap. Don't set fixed heights on text containers
  (use `min-h-*`).
- Don't add a second focus style; if a control takes focus through a hidden input or a stretched
  link, show `focus-ring` on the visible part (`has-[:focus-visible]:focus-ring`).
- Don't build links with `/en`; don't use `<a>` for internal routes.

## 8. Known gaps and notes for reviewers

- `npx eslint .` reports errors only in `docs/research/**/*.js` (research scratch scripts, outside
  this scope). `eslint.config.mjs` should ignore `docs/**`; `src` and `scripts` are clean.
- The style guide's "Home" breadcrumb points at `/en`, which does not exist until foundation-ui
  builds the home page (the only 404 in the console is that prefetch).
- Most `common` components are Client Components because they read copy with `useT()`. They need
  the `I18nProvider` from the root layout and render fine inside Server Components.
- Tailwind breakpoints are media queries in `rem`, which do not follow the in-app text size; this
  is why dense layouts should use container queries (rule 8).
- At 125% text size on a 360 px screen (about 288 px of layout) reference tables scroll inside
  their labelled region and a long search placeholder is shortened with an ellipsis; the page
  itself never scrolls sideways.
- The Malay strings for the style guide (`designSystem.*`) are a draft pending native review, like
  the rest of `ms.ts`.
- The mark, wordmark and motif drawings are original placeholders; see the cultural notes in the
  client document before production use.
- Worth testing: keyboard through `SegmentedControl` (arrow keys), `Tabs`, `Dialog` and `Sheet`
  (focus trap and return), the skip link, forced colours on Windows, and VoiceOver or NVDA on
  `FlightStatusChip`, `Freshness` (polite) and `DemoDataBanner` (`role="note"`).
