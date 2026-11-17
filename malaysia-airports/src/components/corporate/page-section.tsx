import type { ReactNode } from 'react';
import { SectionHeading } from '@/components/common/section-heading';
import { cn } from '@/lib/cn';

export interface PageSectionProps {
  id: string;
  title: string;
  number?: number;
  eyebrow?: string;
  lead?: ReactNode;
  action?: ReactNode;
  /** The first section on a page has no rule above it. */
  first?: boolean;
  children: ReactNode;
  className?: string;
}

/** A numbered, linkable section of a long corporate or transparency page. */
export function PageSection({ id, title, number, eyebrow, lead, action, first = false, children, className }: PageSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-32', !first && 'border-t border-line pt-12 sm:pt-14', className)}>
      <SectionHeading id={`${id}-title`} number={number} eyebrow={eyebrow} title={title} lead={lead} action={action} />
      {children}
    </section>
  );
}
