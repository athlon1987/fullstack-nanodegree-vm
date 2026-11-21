import { notFound } from 'next/navigation';
import { Suspense } from 'react';

/**
 * The not-found page for an airport that a fully static page does not list (round 2).
 *
 * The airport overview, the board and the map await `params` without a page-level `<Suspense>`,
 * so every listed airport is complete in the static HTML. For any other airport, `notFound()`
 * thrown outside a boundary made the first 404 an empty document (no site shell, no "Page not
 * found" title: C-06). Thrown from inside this boundary, it keeps both, as on the other sections.
 *
 * @example if (!listed) return <MissingAirportPage />;
 */
export function MissingAirportPage() {
  return (
    <Suspense fallback={null}>
      <Missing />
    </Suspense>
  );
}

async function Missing(): Promise<never> {
  notFound();
}
