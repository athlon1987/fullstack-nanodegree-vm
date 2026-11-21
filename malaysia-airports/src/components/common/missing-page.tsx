import { notFound } from 'next/navigation';
import { lang as routeLang } from 'next/root-params';
import { Suspense } from 'react';
import { toLang } from '@/lib/i18n';
import { NotFoundBody } from '@/components/platform/not-found-body';

/**
 * The not-found page for a param that a fully static page does not list (round 2 for airports,
 * round 3 for every page that awaits `params` without a page-level `<Suspense>`, round 4 for the
 * client error).
 *
 * Those pages are complete in the static HTML for every listed param. For any other:
 *
 * - `notFound()` thrown outside a boundary made the first 404 an empty document (no site shell,
 *   no "Page not found" title: C-06).
 * - Thrown inside a plain `<Suspense>` (rounds 2 and 3), the shell and title stayed and the status
 *   was 404, but React marked that boundary as failed on the server, so the browser logged React
 *   error #419 ("could not finish this Suspense boundary") and rendered the 404 body on the client
 *   (gallery capture, round 4). Crawlers and no-JavaScript visitors saw no "Page not found" text.
 *
 * Round 4: the body is rendered here on the server (the same `NotFoundBody` as `not-found.tsx`),
 * and the 404 signal is a `notFound()` inside a `<Suspense>` boundary placed in `<noscript>`.
 * React still renders that boundary on the server and reports the error, so Next.js answers 404
 * and keeps everything rendered so far. In a browser with JavaScript the `<noscript>` content is
 * never parsed into elements, and React does not render a `<noscript>`'s children on the client,
 * so no boundary is retried and nothing is logged. Without JavaScript it is an empty `<template>`.
 *
 * @example if (!listed) return <MissingPage />;
 */
export async function MissingPage() {
  const lang = toLang(await routeLang());
  return (
    <>
      <NotFoundBody lang={lang} />
      <noscript data-not-found-signal="">
        <Suspense fallback={null}>
          <Missing />
        </Suspense>
      </noscript>
    </>
  );
}

async function Missing(): Promise<never> {
  notFound();
}
