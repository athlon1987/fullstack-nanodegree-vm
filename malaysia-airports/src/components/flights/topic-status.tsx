'use client';

import { useLang, useT } from '@/lib/i18n/client';
import { useSiteSearch } from '@/components/search/site-search';

/**
 * What the flight search's status line says when no flight matches (round 4, re-review 6.1.5):
 * a topic word such as "parking" is not announced as "0 flights found" but as the page result
 * the field offers under it ("No flights for “parking”. Top page: Parking, KLIA."). Loaded
 * lazily, in the same chunk as the inline site results, so the search engine stays out of the
 * home page's first JavaScript.
 */
export function TopicStatus({ query, airport }: { query: string; airport?: string }) {
  const t = useT();
  const lang = useLang();
  const results = useSiteSearch(lang, query, { airport, limit: 3, flightLimit: 0 });
  const hits = results.groups.flatMap((group) => group.hits).sort((a, b) => b.score - a.score);
  const text = results.query;
  if (results.status === 'error') return <>{t('flightPages.search.topicNoFlights', { query: text })}</>;
  if (results.status !== 'ready') return <>{t('flightPages.search.topicLooking', { query: text })}</>;
  if (hits.length === 0) return <>{t('flightPages.search.topicNone', { query: text })}</>;
  return <>{t('flightPages.search.topicFound', { query: text, title: hits[0].title })}</>;
}
