'use client';

import type { Source } from '@/content/types';
import { cn } from '@/lib/cn';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDate } from '@/lib/time';
import { Icon } from '@/components/ui/icon';
import { ExternalLink } from './external-link';
import { LocaleLink } from './locale-link';

export interface SourceNoteProps {
  /** Resolved sources: `resolveSources(item.sources)` in a Server Component. */
  sources: readonly Source[];
  /** Open on first render. Collapsed by default so sources never crowd the guidance. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Where a fact comes from: title, publisher and the date we retrieved it, behind a small marker
 * (a document icon and the number of sources) so citations never crowd the answer (A-14). A
 * native `<details>` element, so it works without JavaScript.
 *
 * Source titles and publishers are in English (the registry has no Malay titles): on a Malay page
 * they carry `lang="en"` and an "EN" marker, so screen readers switch voice and readers know why
 * (WCAG 3.1.2, A-24).
 *
 * @example <SourceNote sources={resolveSources(facility.sources)} />
 */
export function SourceNote({ sources, defaultOpen = false, className }: SourceNoteProps) {
  const t = useT();
  const lang = useLang();
  if (sources.length === 0) return null;
  const foreign = lang !== 'en';
  const count = t.count('shellExtras.sources.count', sources.length);
  return (
    <details open={defaultOpen} className={cn('group/src min-w-0', className)}>
      <summary
        data-source-marker=""
        className="type-caption -mx-1 inline-flex min-h-8 items-center gap-1 rounded-sm px-1 font-semibold text-ink-2 transition-colors duration-fast hover:text-ink touch:min-h-11"
      >
        <Icon name="file-text" size="xs" strokeWidth={1.75} />
        <span aria-hidden="true" className="tabular">
          {sources.length}
        </span>
        <span className="sr-only">{count}</span>
        <Icon name="chevron-down" size="xs" strokeWidth={2} className="transition-transform duration-fast group-open/src:rotate-180" />
      </summary>
      <ul className="mt-1 border-l border-line-strong pl-3">
        {sources.map((source) => {
          const internal = source.url.startsWith('/');
          return (
            <li key={source.id} className="type-caption py-1.5 text-ink-2">
              {internal ? (
                <LocaleLink href={source.url} className="link text-ink">
                  {source.title}
                </LocaleLink>
              ) : (
                <ExternalLink href={source.url} className="text-ink">
                  <span lang={foreign ? 'en' : undefined}>{source.title}</span>
                </ExternalLink>
              )}
              {foreign && !internal ? (
                <span className="ml-1.5 inline-flex h-4 items-center rounded-xs border border-line-control px-1 align-middle text-[0.6875rem] font-semibold text-ink-2">
                  <span aria-hidden="true">{t('shellExtras.sources.english')}</span>
                  <span className="sr-only">({t('shellExtras.sources.inEnglish')})</span>
                </span>
              ) : null}
              <span className="block">
                {foreign ? (
                  <>
                    {t('provenance.publishedBy', { publisher: '' }).trim()} <span lang="en">{source.publisher}</span>
                  </>
                ) : (
                  t('provenance.publishedBy', { publisher: source.publisher })
                )}
                {' · '}
                {t('freshness.retrieved', { date: formatDate(source.retrieved, lang) })}
                {source.asOf ? ` · ${t('freshness.asOf', { date: source.asOf })}` : null}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
