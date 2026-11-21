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
      {/* Marks airport pages for styles that depend on the airport chrome (phone breadcrumbs). */}
      <div data-airport-page="" className="contents">
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

/** The size of the compact airport bar, the chrome of most airport pages (no layout shift). */
function HeaderSkeleton() {
  return (
    <div data-airport-header-skeleton="" className="border-b border-line bg-page-subtle" aria-hidden="true">
      <Container className="flex min-h-[3.4375rem] items-center gap-3 py-1 md:min-h-13">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-14" />
        <Skeleton className="ml-auto h-9 w-28 md:hidden" />
      </Container>
    </div>
  );
}
