'use client';

import { useMemo, useState } from 'react';
import { localeHref } from '@/lib/locale';
import { useLang, useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';

export interface HelpSearchItem {
  id: string;
  topic: string;
  topicTitle: string;
  question: string;
  answer: string;
}

const LIMIT = 8;

function normalise(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Ranked match: every word must appear; words in the question count double. */
export function searchHelp(items: readonly HelpSearchItem[], query: string): HelpSearchItem[] {
  const words = normalise(query).split(/[^a-z0-9]+/).filter((word) => word.length > 1);
  if (words.length === 0) return [];
  return items
    .map((item) => {
      const question = normalise(item.question);
      const rest = normalise(`${item.answer} ${item.topicTitle}`);
      let score = 0;
      for (const word of words) {
        if (question.includes(word)) score += 2;
        else if (rest.includes(word)) score += 1;
        else return { item, score: 0 };
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

/**
 * Searches the help centre's questions as you type. Without JavaScript the form submits to the
 * site search page instead.
 */
export function HelpSearch({ items }: { items: readonly HelpSearchItem[] }) {
  const t = useT();
  const lang = useLang();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchHelp(items, query), [items, query]);
  const active = query.trim().length > 1;

  return (
    <div className="flex flex-col gap-4">
      <form role="search" action={localeHref(lang, '/search')} method="get" onSubmit={(event) => event.preventDefault()}>
        <SearchField
          label={t('guidePages.help.searchLabel')}
          name="q"
          size="lg"
          value={query}
          onValueChange={setQuery}
          onClear={() => setQuery('')}
          placeholder={t('guidePages.help.searchPlaceholder')}
          placeholderShort={t('guidePages.help.searchPlaceholderShort')}
          autoComplete="off"
        />
      </form>
      <p role="status" className={active ? 'type-body-sm px-2 text-ink-2' : 'sr-only'}>
        {active ? (results.length > 0 ? t.count('guidePages.help.results', results.length) : t('guidePages.help.noResults', { query: query.trim() })) : ''}
      </p>
      {active ? (
        results.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {results.slice(0, LIMIT).map((item) => (
              <li key={item.id}>
                <LocaleLink href={`/help/${item.topic}#${item.id}`} className="group flex min-h-13 items-start gap-3 rounded-2xl px-3 py-3 transition-colors duration-fast hover:bg-page-subtle focus-visible:focus-ring-inset">
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
                    <Icon name="circle-help" size="sm" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="type-body block font-medium text-ink group-hover:underline">{item.question}</span>
                    <span className="type-caption block text-ink-2">{item.topicTitle}</span>
                  </span>
                </LocaleLink>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl bg-page-subtle p-4 sm:p-5">
            <p className="type-body-sm text-ink-2">{t('guidePages.help.noResultsHint')}</p>
            <LocaleLink href={`/search?q=${encodeURIComponent(query.trim())}`} className="link-action type-body-sm mt-1 text-ink">
              {t('guidePages.help.searchSite', { query: query.trim() })}
              <Icon name="arrow-right" size="sm" />
            </LocaleLink>
          </div>
        )
      ) : null}
    </div>
  );
}
