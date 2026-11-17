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
 * Where a fact comes from: title, publisher and the date we retrieved it. A native
 * `<details>` element, so it works without JavaScript.
 *
 * @example <SourceNote sources={resolveSources(facility.sources)} />
 */
export function SourceNote({ sources, defaultOpen = false, className }: SourceNoteProps) {
  const t = useT();
  const lang = useLang();
  if (sources.length === 0) return null;
  return (
    <details open={defaultOpen} className={cn('group/src min-w-0', className)}>
      <summary className="type-caption -mx-1.5 inline-flex min-h-8 items-center gap-1.5 rounded-sm px-1.5 font-semibold text-ink-2 transition-colors duration-fast hover:text-ink touch:min-h-11">
        <Icon name="file-text" size="xs" strokeWidth={1.75} />
        {t.count('provenance.sourcesCount', sources.length)}
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
                  {source.title}
                </ExternalLink>
              )}
              <span className="block">
                {t('provenance.publishedBy', { publisher: source.publisher })}
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
