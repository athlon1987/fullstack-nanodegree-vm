import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SectionHeading } from '@/components/common/section-heading';
import { Section, type SectionProps } from '@/components/ui/section';

export interface DsSectionProps {
  id: string;
  number: number;
  title: string;
  intro?: string;
  tone?: SectionProps['tone'];
  children: ReactNode;
}

/** One numbered section of the style guide. */
export function DsSection({ id, number, title, intro, tone = 'page', children }: DsSectionProps) {
  return (
    <Section tone={tone} aria-labelledby={`${id}-h`} id={id} className="scroll-mt-4">
      <SectionHeading number={number} title={title} lead={intro} id={`${id}-h`} />
      <div className="flex flex-col gap-10">{children}</div>
    </Section>
  );
}

/** A titled group inside a section. */
export function DsGroup({ title, note, children, className }: { title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line-strong pb-2">
        <h3 className="type-title-sm text-ink">{title}</h3>
        {note ? <p className="type-caption max-w-reading text-ink-2">{note}</p> : null}
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
    <figure className={cn('flex min-w-0 flex-col overflow-hidden rounded-lg border border-line-strong bg-surface', frameClassName)}>
      <div className={cn('min-w-0 flex-1', !bare && 'flex flex-wrap items-center gap-3 p-4 sm:p-5', className)}>{children}</div>
      <figcaption className="type-data-xs border-t border-line px-4 py-2 text-ink-3 normal-case sm:px-5">{name}</figcaption>
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
    <div className={cn('grid gap-4 sm:gap-5', cols === 2 && 'lg:grid-cols-2', cols === 3 && 'sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>
  );
}
