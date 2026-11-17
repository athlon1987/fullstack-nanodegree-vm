import { Suspense } from 'react';
import { AirportHeader } from '@/components/airport/airport-header';
import { loadAirportPage, type AirportPageParams } from '@/components/airport/section-page';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Layout of every page under an airport: the airport header with its section navigation, then
 * the page. `params` is awaited inside the Suspense child, never at the top (Next.js notes,
 * section 5); for prerendered airports the header is part of the static HTML.
 */
export default function AirportLayout({ children, params }: LayoutProps<'/[lang]/[airport]'>) {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function Header({ params }: { params: AirportPageParams }) {
  const { lang, airport, sections } = await loadAirportPage(params);
  return <AirportHeader airport={airport} lang={lang} sections={sections} />;
}

function HeaderSkeleton() {
  return (
    <div className="border-b border-line bg-page-subtle" aria-hidden="true">
      <Container className="py-6">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="mt-4 h-10 w-full max-w-lg" />
        <Skeleton className="mt-5 h-8 w-72" />
      </Container>
    </div>
  );
}
