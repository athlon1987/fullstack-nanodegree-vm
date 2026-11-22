import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Section, type SectionProps } from '@/components/ui/section';

export interface DsSectionProps {
  id: string;
  number: number;
  title: string;
  intro?: string;
  tone?: SectionProps['tone'];
  children: ReactNode;
}

/** One numbered section of the style guide, in the Direction v2 rhythm: a big title, a lead, then the work. */
export function DsSection({ id, number, title, intro, tone = 'page', children }: DsSectionProps) {
  return (
    <Section tone={tone} aria-labelledby={`${id}-h`} id={id} className="scroll-mt-4">
      <div className="mb-10 grid gap-x-12 gap-y-4 sm:mb-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-end">
        <div className="min-w-0">
          <p className="type-overline mb-4 flex items-center gap-3 text-gold-ink">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            <span className="tabular">{String(number).padStart(2, '0')}</span>
          </p>
          <h2 id={`${id}-h`} className="type-display-lg text-ink">
            {title}
          </h2>
        </div>
        {intro ? <p className="type-lead max-w-reading text-ink-2">{intro}</p> : null}
      </div>
      <div className="flex flex-col gap-14">{children}</div>
    </Section>
  );
}

/** A titled group inside a section. */
export function DsGroup({ title, note, children, className }: { title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="type-title-lg text-ink">{title}</h3>
        {note ? <p className="type-body-sm max-w-reading text-ink-2">{note}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** A specimen frame: the example above, the component name below in mono. */
export function Demo({
  name,
  children,
  className,
  frameClassName,
  bare = false,
}: {
  /** Component or token name, shown as a mono caption. */
  name: string;
  children: ReactNode;
  /** Classes for the content area. */
  className?: string;
  frameClassName?: string;
  /** No padding and no flex layout: the example fills the frame. */
  bare?: boolean;
}) {
  return (
    <figure className={cn('flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm', frameClassName)}>
      <div className={cn('min-w-0 flex-1', !bare && 'flex flex-wrap items-center gap-3 p-5 sm:p-6', className)}>{children}</div>
      <figcaption className="type-data-xs border-t border-line px-5 py-2.5 text-ink-3 normal-case sm:px-6">{name}</figcaption>
    </figure>
  );
}

/** An example with its state written under it. */
export function Stated({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      {children}
      <span className="type-caption text-ink-3">{label}</span>
    </div>
  );
}

/** A responsive grid of specimens. */
export function DemoGrid({ children, cols = 2, className }: { children: ReactNode; cols?: 1 | 2 | 3; className?: string }) {
  return (
    <div className={cn('grid gap-5 sm:gap-6', cols === 2 && 'lg:grid-cols-2', cols === 3 && 'sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>
  );
}
