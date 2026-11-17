# Hand-off: application shell, home, airports, notices and search

Owner: foundation-ui (shell). Status (17 Nov 2026): `npx tsc --noEmit` clean, `npx eslint .` clean,
`npx next build` succeeds (every page below is `○` for `en` and `ms`), `npx playwright test`
31 passed and 1 skipped (a desktop-only check on the phone project), axe (wcag2a, wcag2aa, wcag21aa,
wcag22aa) reports zero violations on `/en`, `/en/kul` and `/ms/iph`. No sideways scroll and no
truncated text from 360 to 1600 px at 100% text size.

## 1. What exists

| Area | Files |
|---|---|
| Root layout: utility bar, sticky header, `<main>`, footer, phone bottom bar, global overlays | `src/app/[lang]/layout.tsx`, `src/components/shell/**` |
| Locale redirect and branded 404s | `src/proxy.ts`, `src/app/[lang]/not-found.tsx`, `src/app/[lang]/[...rest]/page.tsx`, `error.tsx`, `loading.tsx` |
| Home `/[lang]` | `src/app/[lang]/page.tsx`, `src/components/home/**` |
| Airports `/[lang]/airports` (`?then=<section>`) | `src/app/[lang]/airports/page.tsx`, `src/components/airport/airport-directory.tsx`, `network-map.tsx` |
| Airport layout and overview `/[lang]/[airport]` | `src/app/[lang]/[airport]/layout.tsx` and `page.tsx`, `src/components/airport/**` |
| Notices `/[lang]/notices` | `src/app/[lang]/notices/page.tsx`, `notices-browser.tsx`, `notice-list.tsx` |
| Search page and palette | `src/app/[lang]/search/page.tsx`, `search/index.json/route.ts`, `src/components/search/**` |
| Flight base components | `src/components/flights/flight-search-box.tsx`, `flight-row.tsx`, `flight-board.tsx`, `flight-direction.ts` |
| Concierge stub | `src/components/concierge/concierge-panel.tsx` |
| Tests | `playwright.config.ts`, `e2e/smoke.spec.ts` |

Dictionary keys added (both languages): groups `shell`, `home`, `airportsPage`, `airportPage`,
`noticesPage`, plus `home.searchPlaceholder` and `home.searchPlaceholderShort`.

## 2. Adding a page under `/[lang]/[airport]/<section>`

Sections and their order live in `AIRPORT_SECTIONS` (`src/components/shell/sections.ts`):
overview, flights, map, facilities, transport, parking, shop-dine, lounges, transit. The section
navigation, the primary navigation, the overview cards and the airport switcher all read this
registry, and an airport gets a section only when the content layer has something for it
(`sectionsForContent`: flights when the demo provider has a board; map, facilities, transport,
parking, shop-dine when the collection is not empty; lounges when a lounge or hotel is published;
transit when a transit note or inter-terminal transfer exists). You do not register your page
anywhere: create the file and the navigation already points at it. Until you do, those links 404.

```tsx
// src/app/[lang]/[airport]/parking/page.tsx
import { Suspense } from 'react';
import { airportSectionMetadata, loadAirportPage, sectionStaticParams, type AirportPageParams } from '@/components/airport/section-page';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export const generateStaticParams = () => sectionStaticParams('parking'); // only airports with parking content
export const generateMetadata = ({ params }: PageProps<'/[lang]/[airport]/parking'>) => airportSectionMetadata(params, 'parking');

export default function Page({ params }: PageProps<'/[lang]/[airport]/parking'>) {
  return (
    <Suspense fallback={<Container className="py-10"><Skeleton className="h-40 w-full" /></Container>}>
      <Parking params={params} />
    </Suspense>
  );
}

async function Parking({ params }: { params: AirportPageParams }) {
  const { t, airport, content } = await loadAirportPage(params, 'parking'); // notFound() for unknown airports or no parking
  return (
    <>
      <PageHeader title={t('nav.parking')} breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.parking') }]} />} />
      <Container className="pb-section">…</Container>
    </>
  );
}
```

- The airport layout already renders the airport header (name, code, place, local time, KLIA
  terminal chips, vignette) and the section navigation. On the overview the airport name is the
  `h1`; on every other section it becomes a link back, so your `PageHeader` owns the only `h1`.
- `loadAirportPage(params, section)` returns `{ lang, t, airport, content, sections }`. Await it
  inside a Suspense child, never at the top of the page (Next.js notes, section 5).
- Optional: `export const ensureStatic = 'navigation'` (the overview uses it) makes an unknown
  airport a real 404 on the first request. Only do it when the page reads no runtime data.
- Pass only the slices a Client Component needs as props; never import `@/content` on the client.

## 3. Links into airport sections

All hrefs are without the locale: pass them to `LocaleLink` or `localeHref`.

| Helper (`@/components/shell/sections`) | Use |
|---|---|
| `sectionHref(section, selection, availability)` | Link that respects the remembered airport: `/kul/parking?t=T1`, or `/airports?then=parking` when none is chosen; falls back to the airport home when that airport lacks the section |
| `sectionPath(slug, section, terminal?)` | A fixed airport: `/kul/parking`, `/kul?t=T2` |
| `chooseAirportPath(section)` | The "choose first" step |
| `useSectionAvailability()` (`shell-context`) | Sections per airport on the client, computed on the server in the root layout |
| `airportSections(slug)`, `airportsWithSection(section)`, `sectionStaticParams(section)` (`sections.server`) | Server only |

## 4. Airport context and the terminal filter

- `useAirportContext()` (domain) is the remembered choice. The shell never assumes an airport;
  visiting an airport page updates it (`SyncAirportContext`), so the header always names the
  airport on screen. The switcher offers the last choice first, then the featured six with KLIA
  T1 and T2 as separate rows, then everything by classification, and a link to `/airports`.
- KLIA terminal is a URL filter, `?t=T1|T2`, never a page tree. Read it with
  `useTerminalFilter(slug)` from `@/components/airport/use-terminal-filter` (it calls
  `useSearchParams`, so the component must sit inside `<Suspense>` with a fallback that renders
  the all-terminals view). `hrefFor(terminal)` gives the current page with another terminal.
- Choosing an airport while on `/kul/parking` goes to `/pen/parking` when Penang has parking,
  otherwise to `/pen` (`sameSectionPath`).

## 5. The overlay store (`@/components/shell/overlay-store`)

One overlay at a time, mounted once by `GlobalOverlays`. From any event handler:

```ts
import { overlays } from '@/components/shell/overlay-store';
overlays.openSearch('prayer room');          // command palette, optional starting query
overlays.openConcierge('Where can I pray?'); // concierge panel, optional opening question
overlays.openPreferences();                  // theme, text size, contrast, motion
overlays.openAirportSwitcher('parking');     // then continue to that section
overlays.openMenu(); overlays.close();
```

Overlays close on route change. Focus returns to the opener. `/` and Ctrl or Cmd + K open search
(not while typing in a field). Concierge owner: replace the body of `ConciergePanel`, keep its
export name and drive it with `useOverlayDialog('concierge')` (`payload.question` is the
opening question).

## 6. Flight base components (`@/components/flights`)

| Export | Notes |
|---|---|
| `FlightSearchBox({ airport?, terminal?, showAirportSelector?, id? })` | Parses with `parseFlightQuery`, shows example searches by kind, a scope sentence, inline demo-labelled results with Clear, and a link to `/<airport>/flights?dir=d&q=…` |
| `FlightBoard({ flights, direction, title, subtitle, updatedAt, refreshSeconds, context, live, showAirport, footer, emptyMessage, hideBanner })` | Demo banner, board surface, freshness row; a table when its container is wide, cards when narrow. `flights: null` renders the skeleton. Use `live="polite"` on the full board only |
| `FlightRow({ flight, layout: 'card' \| 'table', showAirport })` | Old and new time when delayed, cancelled rows dimmed and struck, T1/T2 badge, gate or belt, `FlightStatusChip`, link to the flight |
| `flightHref(flight)` | `/<airport>/flights/<flightId>` |
| `useFlightDirection()`, `setFlightDirection`, `resetFlightDirection`, `directionForMode` | Departures or arrivals, shared by the search, the boards and the journey modes |

Flights owner: please honour `?dir=d|a`, `?q=` and `?t=` on `/[airport]/flights`; the home,
the board preview and the search box already link with them. `BoardPreview`
(`@/components/home/board-preview`) is the preview used on home (eight rows) and airport pages (six); it looks a day ahead so a quiet night still fills it.

## 7. Search

Documents are built on the server and served as static JSON per language
(`/[lang]/search/index.json`); the palette and the search page fetch it on first use through
`useSiteSearch(lang, query, { airport })` in `src/components/search/site-search.ts`. Flight-shaped
queries are looked up in the demo provider and labelled. Recent searches stay on the device.

## 8. E2E conventions

- `npm run e2e` builds once and serves on port 3100 (an existing server there is reused locally).
  Projects: `desktop` (1440 by 900) and `phone` (Pixel 7 at 390 by 844).
- Use `getByRole`: hidden preserved routes stay in the DOM. Add `exact: true` where one name
  contains another ("Arrivals" and "Meeting someone, Arrivals hall").
- Keyboard shortcuts work after hydration: wrap the key press in `expect(…).toPass()`.
- Both the utility bar and the footer have a "Language" group; scope to the first one.
- Add one journey per feature with `expectNoAxeViolations(page)` (copy it from the smoke spec).
  Fix violations; do not disable rules.

## 9. Known gaps

- `app/global-not-found.tsx` is not added: it needs `experimental.globalNotFound` in
  `next.config.ts` (not mine). Today only URLs with a file extension (`/foo.txt`) bypass the
  proxy and get the framework's bare 404; everything else gets the localised page with a 404.
- Links to sections and pages other teams own (`/kul/parking`, `/guides`, `/help`, `/journey`,
  `/corporate`, `/accessibility`, `/privacy`, `/terms`, `/about-this-prototype`, `/concierge`)
  404 until those pages exist; the console shows the prefetch 404s meanwhile.
- At 125% text size on a 360 px screen the short flight-search placeholder is shortened with an
  ellipsis (by `SearchField`); the page never scrolls sideways.
- Focus is not moved to the new `h1` after a client navigation (Next.js leaves it in place; the
  route announcer reads the title). Worth adding in the shell when the feature pages land.
- Pressing `/` in the first moments before hydration is ignored.
- Malay copy added here is a draft pending native review, like the rest of `ms.ts`.
