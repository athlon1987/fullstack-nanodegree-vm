import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from '@/components/ui/icon';

export interface EmptyStateProps {
  icon?: IconKey;
  title: ReactNode;
  /** What the visitor can do next. Say where to check officially when we simply have no data. */
  children?: ReactNode;
  /** A button or link. */
  action?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  /** `card` (default) sits in a quiet well; `plain` has no chrome, for use inside a card. */
  variant?: 'card' | 'plain';
  className?: string;
}

/**
 * The honest "nothing here" message: no results, no content yet, or not published. Solid and
 * calm, never dashed (it must not look unfinished).
 *
 * @example <EmptyState icon="search-x" title={t('flights.board.noFlights')} action={<Button ...>} />
 */
export function EmptyState({ icon = 'circle-dashed', title, children, action, headingLevel = 3, variant = 'card', className }: EmptyStateProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 px-5 py-10 text-center',
        variant === 'card' && 'rounded-lg border border-line-strong bg-page-subtle',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-line-strong bg-surface text-ink-2">
        <Icon name={icon} size="lg" />
      </span>
      <Heading className="type-title-md max-w-md text-ink">{title}</Heading>
      {children ? <div className="type-body-sm max-w-md text-ink-2 sm:text-base">{children}</div> : null}
      {action ? <div className="mt-1 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
