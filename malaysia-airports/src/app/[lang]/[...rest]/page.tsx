import { notFound } from 'next/navigation';

/**
 * Catch-all for URLs under a locale that match no other route (`/en/nothing/here`). Without it
 * such URLs fall outside the root layout and get the framework's bare 404; with it they get the
 * localised not-found page inside the site shell. More specific routes always win over this one.
 */
export function generateStaticParams() {
  return [{ rest: ['not-found'] }];
}

export default function CatchAll() {
  notFound();
}
