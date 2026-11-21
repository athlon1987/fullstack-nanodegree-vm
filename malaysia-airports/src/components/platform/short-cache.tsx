import { cacheLife, cacheTag } from 'next/cache';

/**
 * Renders nothing, but caps how long a shared cache may keep the page it appears in
 * (security-12). Placed in the not-found pages: Next.js derives a prerendered page's
 * `Cache-Control` from the shortest cache life rendered into it, so a 404 is sent with
 * `s-maxage=60` (the `minutes` profile) instead of a year, and arbitrary URLs cannot fill a CDN
 * with year-long 404s. Normal pages never render the not-found boundary, so they are unaffected.
 */
export async function ShortSharedCache() {
  'use cache';
  cacheLife('minutes');
  cacheTag('not-found');
  return null;
}
