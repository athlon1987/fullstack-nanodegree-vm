import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionHeadingProps {
  /** Section number, shown as "01". Use on long landing pages only. */
  number?: number;
  /** Small-caps label beside the number. */
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** A link or button on the right ("View all"). */
  action?: ReactNode;
  /** Heading level; 2 by default. */
  level?: 2 | 3;
  /** `display` (default) uses the editorial face; `title` uses the interface face for dense tool pages. */
  variant?: 'display' | 'title';
  id?: string;
  className?: string;
}

/**
 * Heading for a page section: a numbered small-caps eyebrow on a gold hairline, the heading,
 * an optional lead and one action.
 *
 * @example <SectionHeading number={2} eyebrow={t('nav.notices')} title={...} action={<LocaleLink ...>} />
 */
export function SectionHeading({ number, eyebrow, title, lead, action, level = 2, variant = 'display', id, className }: SectionHeadingProps) {
  const Heading = `h${level}` as 'h2' | 'h3';
  return (
    <div className={cn('mb-6 grid items-end gap-x-8 gap-y-3 sm:mb-8 sm:grid-cols-[minmax(0,1fr)_auto]', className)}>
      <div className="min-w-0">
        {number !== undefined || eyebrow ? (
          <p className="type-eyebrow mb-3 flex items-center gap-2.5 text-gold-ink">
            <span aria-hidden="true" className="h-px w-7 bg-gold" />
            {number !== undefined ? <span className="tabular font-medium text-ink-3">{String(number).padStart(2, '0')}</span> : null}
            {eyebrow}
          </p>
        ) : null}
        <Heading id={id} className={cn('text-ink', variant === 'display' ? 'type-display-md' : 'type-title-lg')}>
          {title}
        </Heading>
        {lead ? <p className="type-body mt-3 max-w-reading text-ink-2 sm:text-lg">{lead}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center sm:justify-end">{action}</div> : null}
    </div>
  );
}
