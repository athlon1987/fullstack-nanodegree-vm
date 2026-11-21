import { notFound } from 'next/navigation';
import { Suspense } from 'react';

/**
 * The not-found page for a param that a fully static page does not list (round 2 for airports,
 * round 3 for every page that awaits `params` without a page-level `<Suspense>`).
 *
 * Those pages are complete in the static HTML for every listed param. For any other, `notFound()`
 * thrown outside a boundary made the first 404 an empty document (no site shell, no "Page not
 * found" title: C-06). Thrown from inside this boundary, it keeps both.
 *
 * @example if (!listed) return <MissingPage />;
 */
export function MissingPage() {
  return (
    <Suspense fallback={null}>
      <Missing />
    </Suspense>
  );
}

async function Missing(): Promise<never> {
  notFound();
}
