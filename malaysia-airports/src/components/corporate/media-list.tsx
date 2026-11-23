import { LocaleLink } from '@/components/common/locale-link';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { Translator } from '@/lib/i18n';
import type { MediaView } from './corporate-data.server';
import { FactMeta } from './fact-meta';

export interface MediaListProps {
  items: readonly MediaView[];
  t: Translator;
  /** `list`: the media centre ledger with summaries. `cards`: three across for teasers. */
  variant?: 'list' | 'cards';
  headingLevel?: 2 | 3;
}

function KindBadge({ item, t }: { item: MediaView; t: Translator }) {
  return (
    <Badge tone={item.kind === 'release' ? 'primary' : 'neutral'} size="sm">
      {t(`corporatePages.media.kind.${item.kind}`)}
    </Badge>
  );
}

/** Media centre items: date, whether it is a release or press coverage, topic, title and summary. */
export function MediaList({ items, t, variant = 'list', headingLevel = 3 }: MediaListProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  if (variant === 'cards') {
    return (
      <ul className="grid gap-4 md:grid-cols-3 lg:gap-5">
        {items.map((item) => (
          <li
            key={item.slug}
            className="relative flex min-h-56 min-w-0 flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm transition-[box-shadow,translate,border-color] duration-base ease-out has-[a:hover]:border-line-strong has-[a:hover]:shadow-lg has-[a:focus-visible]:focus-ring motion-ok:has-[a:hover]:-translate-y-0.5"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <time dateTime={item.date} className="type-caption tabular font-semibold text-ink-2">
                {item.dateLabel}
              </time>
              <KindBadge item={item} t={t} />
            </div>
            {/* title-md, so the corporate hub keeps to eight type sizes (A-14). */}
            <Heading className="type-title-md text-ink [text-wrap:balance]">
              <LocaleLink href={`/corporate/news/${item.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
                {item.title}
              </LocaleLink>
            </Heading>
            <p className="type-caption mt-auto flex items-center gap-2 border-t border-line pt-3 font-medium text-ink-2">
              <Icon name="newspaper" size="xs" />
              {t(`corporatePages.media.topic.${item.topic}`)}
            </p>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.slug} className="grid gap-x-10 gap-y-2 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7 md:grid-cols-[10rem_minmax(0,1fr)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:flex-col md:items-start">
            <time dateTime={item.date} className="type-body-sm tabular font-semibold text-ink">
              {item.dateLabel}
            </time>
            <span className="type-caption text-ink-3">{t(`corporatePages.media.topic.${item.topic}`)}</span>
          </div>
          <article className="min-w-0">
            <KindBadge item={item} t={t} />
            {/* Round 6 (A-14): title-md, so the media centre keeps to 8 type sizes. */}
            <Heading className="type-title-md mt-2 text-ink">
              <LocaleLink href={`/corporate/news/${item.slug}`} className="decoration-1 underline-offset-4 hover:underline">
                {item.title}
              </LocaleLink>
            </Heading>
            <p className="type-body mt-2 max-w-reading text-ink-2">{item.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              <LocaleLink href={`/corporate/news/${item.slug}`} className="link-action type-body-sm text-ink">
                {t('corporatePages.common.readMore')}
                <span className="sr-only">: {item.title}</span>
                <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
              </LocaleLink>
              <FactMeta provenance={item.provenance} sources={item.sources} />
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
