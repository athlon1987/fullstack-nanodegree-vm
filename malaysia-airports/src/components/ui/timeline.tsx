import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './icon';

/**
 * An ordered list of journey steps. Each step shows its state by shape: a filled check (done),
 * a ringed dot (current) or an open circle (upcoming).
 *
 * @example
 * <Timeline>
 *   <TimelineItem state="current" stateLabel={t('journey.timeline.current')} time="14:05" title="...">...</TimelineItem>
 * </Timeline>
 */
export function Timeline({ className, ...rest }: HTMLAttributes<HTMLOListElement>) {
  return <ol className={cn('flex flex-col', className)} {...rest} />;
}

export interface TimelineItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> {
  state?: 'done' | 'current' | 'upcoming';
  /** The state in words for assistive technology: `t('journey.timeline.done')` and so on. */
  stateLabel?: string;
  /** Clock time, shown in mono figures. Omit for steps without a time. */
  time?: ReactNode;
  /** Small line above the title, for example "Before you leave". */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Provenance tag or other meta shown beside the title. */
  meta?: ReactNode;
  /** Links or buttons for the step. */
  actions?: ReactNode;
  children?: ReactNode;
}

export function TimelineItem({ state = 'upcoming', stateLabel, time, eyebrow, title, meta, actions, className, children, ...rest }: TimelineItemProps) {
  return (
    <li
      aria-current={state === 'current' ? 'step' : undefined}
      className={cn('group/step relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0', className)}
      {...rest}
    >
      {/* The thread between steps: a hairline, solid once a step is done. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-7 bottom-1 left-[0.71875rem] w-px group-last/step:hidden',
          state === 'done' ? 'bg-ink-3' : 'border-l border-dashed border-line-control',
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative mt-0.5 flex size-6 items-center justify-center rounded-full border',
          state === 'done' && 'border-ink bg-ink text-page',
          state === 'current' && 'border-2 border-ink bg-surface',
          state === 'upcoming' && 'border-line-control bg-surface',
        )}
      >
        {state === 'done' ? <Icon name="check" size="xs" strokeWidth={2.5} /> : null}
        {state === 'current' ? <span className="size-2 rounded-full bg-ink" /> : null}
      </span>
      <div className="min-w-0">
        {stateLabel ? <span className="sr-only">{stateLabel}: </span> : null}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {time ? <span className={cn('type-data-lg', state === 'done' ? 'text-ink-3' : 'text-ink')}>{time}</span> : null}
          {eyebrow ? <span className="type-eyebrow text-ink-3">{eyebrow}</span> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className={cn('type-title-md', state === 'done' ? 'text-ink-2' : 'text-ink')}>{title}</h3>
          {meta}
        </div>
        {children ? <div className="type-body mt-1.5 max-w-reading text-ink-2">{children}</div> : null}
        {actions ? <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">{actions}</div> : null}
      </div>
    </li>
  );
}
