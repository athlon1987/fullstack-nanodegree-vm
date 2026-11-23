'use client';

import { lazy, Suspense, type ComponentProps } from 'react';
import { retryingImport } from '@/lib/retrying-import';

/**
 * Redesign 1c (verification SA5 item 1, the hero's LCP): the home's interactive parts below the
 * first screen (the board preview, the journey teaser, the concierge questions and the shop and
 * dine filters) are code-split. Their HTML is still rendered on the server and is in the static
 * HTML; only their scripts leave the first-load set. React hydrates each one when its chunk
 * arrives, which starts during hydration, after the first paint, so the hero photograph no longer
 * waits behind them in Lighthouse's simulation (it charges an image LCP for every script that
 * finished before it).
 *
 * Each sits in its own Suspense boundary, so a chunk still on its way holds back only its own
 * section, never the hero. The imports go through `retryingImport` (round 6, P8): a chunk that
 * cannot be fetched waits and is fetched again (back online, after a pause, or the saved flight's
 * "Try again"), and meanwhile the section keeps its server HTML instead of failing the page. In the static HTML each boundary's content comes after the page body
 * and React's inline reveal script moves it into place while the document is parsed (no `h1` is
 * among them, and all of them sit below the first screen, so nothing in view moves); hydration
 * then keeps the server HTML. Keep anything in the first screen out of this file: "Departing
 * now" was here once and moved the desktop hero by 14 px when it arrived.
 */
const BoardPreviewChunk = lazy(() => retryingImport(() => import('./board-preview')).then((module) => ({ default: module.BoardPreview })));
const JourneyTeaserChunk = lazy(() => retryingImport(() => import('./journey-teaser')).then((module) => ({ default: module.JourneyTeaser })));
const ConciergeQuestionsChunk = lazy(() => retryingImport(() => import('./concierge-questions')).then((module) => ({ default: module.ConciergeQuestions })));
const ShopDineStripChunk = lazy(() => retryingImport(() => import('./shop-dine-strip')).then((module) => ({ default: module.ShopDineStrip })));

export function LazyBoardPreview(props: ComponentProps<(typeof import('./board-preview'))['BoardPreview']>) {
  return (
    <Suspense fallback={null}>
      <BoardPreviewChunk {...props} />
    </Suspense>
  );
}

export function LazyJourneyTeaser(props: ComponentProps<(typeof import('./journey-teaser'))['JourneyTeaser']>) {
  return (
    <Suspense fallback={null}>
      <JourneyTeaserChunk {...props} />
    </Suspense>
  );
}

export function LazyConciergeQuestions(props: ComponentProps<(typeof import('./concierge-questions'))['ConciergeQuestions']>) {
  return (
    <Suspense fallback={null}>
      <ConciergeQuestionsChunk {...props} />
    </Suspense>
  );
}

export function LazyShopDineStrip(props: ComponentProps<(typeof import('./shop-dine-strip'))['ShopDineStrip']>) {
  return (
    <Suspense fallback={null}>
      <ShopDineStripChunk {...props} />
    </Suspense>
  );
}
