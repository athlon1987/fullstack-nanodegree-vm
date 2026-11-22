import { Suspense } from 'react';
import { airportSlugs } from '@/content';
import { AirportHeader } from '@/components/airport/airport-header';
import { loadAirportPage, type AirportPageParams } from '@/components/airport/section-page';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Layout of every page under an airport: the compact airport header with its section navigation,
 * then the page. `params` is awaited inside the Suspense child, never at the top (Next.js notes,
 * section 5): flight pages under this layout are not prerendered. The overview renders its own
 * full banner instead, and `globals.css` hides this header there (round 2).
 */
export default function AirportLayout({ children, params }: LayoutProps<'/[lang]/[airport]'>) {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header params={params} />
      </Suspense>
      {/* Marks airport pages for styles that depend on the airport chrome (phone breadcrumbs).
          Redesign round one: from md up the section pill bar (48 px) sticks under the site header,
          so the page's own sticky content (`top-sticky`: board hour headings, filters, the map)
          starts below it, whether the site header shows or has slid away. */}
      <div
        data-airport-page=""
        className="contents md:[--spacing-sticky:calc(var(--spacing-header)+3rem)] md:[html[data-scroll-chrome=hidden]_&]:[--spacing-sticky:3rem]"
      >
        {children}
      </div>
    </>
  );
}

async function Header({ params }: { params: AirportPageParams }) {
  // Round 4 (layout package): an unknown airport gets no airport bar, rather than a `notFound()`
  // thrown inside this boundary (React error #419 in the browser); the page answers the 404.
  if (!airportSlugs().includes((await params).airport)) return null;
  const { lang, airport, sections } = await loadAirportPage(params);
  return <AirportHeader airport={airport} lang={lang} sections={sections} />;
}

/**
 * The size of the compact airport chrome, the header of most airport pages (no layout shift): the
 * slim midnight band and, from `md` up, the section pill bar (48 px) under it. Without the bar's
 * room every section page moved down by 48 px when the header was revealed (desktop CLS 0.025 to
 * 0.026, round 4; round 5 fix). Redesign round one: the same midnight band and pill shapes.
 */
function HeaderSkeleton() {
  return (
    <div data-airport-header-skeleton="" aria-hidden="true">
      <div className="on-media surface-midnight">
        <Container className="flex min-h-[3.4375rem] items-center gap-3 py-1 md:min-h-13">
          <Skeleton className="h-7 w-12 rounded-pill" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-20 rounded-pill" />
          <Skeleton className="ml-auto h-11 w-28 rounded-pill md:hidden" />
        </Container>
      </div>
      <div data-airport-tabs-skeleton="" className="border-b border-line bg-page max-md:hidden">
        <Container className="flex h-12 items-center gap-2">
          {TAB_WIDTHS.map((width, index) => (
            <Skeleton key={index} className={`h-9 rounded-pill ${width}`} />
          ))}
        </Container>
      </div>
    </div>
  );
}

const TAB_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-24', 'w-24', 'w-20'] as const;
