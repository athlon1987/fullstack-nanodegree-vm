import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getT, toLang } from '@/lib/i18n';
import { MissingPage } from '@/components/common/missing-page';

/**
 * Catch-all for URLs under a locale that match no other route (`/en/nothing/here`, `/en/kul/zzz`).
 * More specific routes always win over this one, so everything it serves is a 404.
 *
 * Round 5 (open issue 7): it rendered `notFound()` at the top of the page, outside any boundary.
 * For a path it does not list, Next.js then answered with its empty error document
 * (`<html id="__next_error__">`): no site shell, no title, no "Page not found" in the HTML, and the
 * browser drew the body under the site's default title. It now renders `MissingPage`, as every
 * other route does for a param it does not list: the site shell, the localised body and its `h1`
 * in the server HTML, and the 404 status from the signal inside `MissingPage`.
 *
 * `ensureStatic = 'navigation'` (as on the airport pages): a path it does not list waits for the
 * complete render instead of the fallback shell, so the first response is already the 404 with
 * the whole page. The one listed path keeps the route prerendered.
 */
export function generateStaticParams() {
  return [{ rest: ['not-found'] }];
}

export const ensureStatic = 'navigation';

/** The not-found title (as `airportSectionMetadata` gives an unknown airport), never indexed. */
export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { title: t('errors.notFoundTitle'), robots: { index: false, follow: false } };
}

export default function CatchAll() {
  return <MissingPage />;
}
