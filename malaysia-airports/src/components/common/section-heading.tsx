import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionHeadingProps {
  /**
   * Section number. Direction v2 retired numbered section prefixes ("01", "02": one of the labels
   * that made pages read like a form), so it is accepted for compatibility and not shown.
   */
  number?: number;
  /** A short label above the heading, on a gold hairline. One per section at most. */
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** A link or button on the right ("View all"). */
  action?: ReactNode;
  /** Heading level; 2 by default. */
  level?: 2 | 3;
  /** `display` (default): big, confident section type. `title`: the interface size, for dense tool pages. */
  variant?: 'display' | 'title';
  id?: string;
  className?: string;
}

/**
 * Heading for a page section: an optional eyebrow on a gold hairline, the heading in big display
 * type, an optional lead and one action.
 *
 * @example <SectionHeading eyebrow={t('nav.notices')} title={...} action={<LocaleLink ...>} />
 */
export function SectionHeading({ eyebrow, title, lead, action, level = 2, variant = 'display', id, className }: SectionHeadingProps) {
  const Heading = `h${level}` as 'h2' | 'h3';
  return (
    <div className={cn('mb-7 grid items-end gap-x-10 gap-y-4 sm:mb-10 sm:grid-cols-[minmax(0,1fr)_auto]', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="type-eyebrow mb-3 flex items-center gap-2.5 text-ink-2">
            <span aria-hidden="true" className="h-px w-7 bg-gold" />
            {eyebrow}
          </p>
        ) : null}
        <Heading id={id} className={cn('text-ink', variant === 'display' ? 'type-display-md' : 'type-title-lg')}>
          {title}
        </Heading>
        {lead ? <p className="type-body mt-4 max-w-reading text-ink-2 sm:text-lg">{lead}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center sm:justify-end">{action}</div> : null}
    </div>
  );
}
