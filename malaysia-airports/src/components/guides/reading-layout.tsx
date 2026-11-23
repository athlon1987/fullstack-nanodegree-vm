import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from '@/components/ui/icon';

export interface TocItem {
  /** The id of the section's heading or wrapper (the link goes to `#id`). */
  id: string;
  label: string;
  icon?: IconKey;
}

export interface ReadingTocProps {
  items: readonly TocItem[];
  /** "On this page". */
  title: string;
  /** The id of the visible title, which names the navigation landmark. */
  titleId: string;
  className?: string;
}

/**
 * "On this page": a sticky column of links from `lg` up, and a wrapping row of pills on phones and
 * tablets (no sideways scroll). One navigation landmark, named by its visible title.
 */
export function ReadingToc({ items, title, titleId, className }: ReadingTocProps) {
  return (
    <nav aria-labelledby={titleId} className={cn('min-w-0 lg:sticky lg:top-sticky lg:self-start lg:pt-2', className)}>
      <p id={titleId} className="type-overline mb-3 text-ink-2">
        {title}
      </p>
      <ol className="flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:border-l lg:border-line">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <a
              href={`#${item.id}`}
              className={cn(
                'type-body-sm inline-flex min-h-11 items-center gap-2 rounded-pill bg-surface px-4 text-ink shadow-xs ring-1 ring-line transition-colors duration-fast hover:ring-line-strong',
                'lg:-ml-px lg:flex lg:min-h-10 lg:rounded-none lg:border-l-2 lg:border-transparent lg:bg-transparent lg:px-4 lg:py-1.5 lg:text-ink-2 lg:shadow-none lg:ring-0 lg:hover:border-gold lg:hover:text-ink',
              )}
            >
              {item.icon ? <Icon name={item.icon} size="sm" className="text-ink-2 lg:hidden" /> : null}
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface ReadingLayoutProps {
  toc: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The long-form layout shared by guides and the transparency pages (accessibility, about this
 * prototype, privacy, terms): the table of contents on the left from `lg` up, the reading column
 * beside it, sections separated by space rather than rules.
 */
export function ReadingLayout({ toc, children, className }: ReadingLayoutProps) {
  return (
    <div className={cn('grid gap-10 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-16 xl:gap-20', className)}>
      {toc}
      <div className="flex min-w-0 flex-col gap-16 sm:gap-20">{children}</div>
    </div>
  );
}
