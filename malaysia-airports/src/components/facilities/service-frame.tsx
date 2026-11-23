import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container } from '@/components/ui/container';

/*
 * The frame of the airport service pages (redesign stage two, Direction v2): terminal map,
 * transport, parking, facilities, shops and food, lounges and transit share one page intro, one
 * section heading and one set of surfaces, so they read as one product with the airport overview.
 *
 * It lives with the facilities components because the service-pages engineer owns this folder;
 * nothing outside those pages imports it.
 */

/** A content card: white, 24 px corners, a hairline and a soft shadow (it lifts off the cool page). */
export const SERVICE_CARD = 'rounded-2xl border border-line bg-surface shadow-sm';
/** A tool panel (route planner, calculator, connection planner): 28 px corners, a deeper shadow. */
export const SERVICE_TOOL = 'rounded-3xl border border-line bg-surface shadow-md';
/** A quiet well inside a card or beside the content. */
export const SERVICE_WELL = 'rounded-2xl bg-page-subtle';
/** The icon of a card: a soft brand tile, never a status colour. */
export const SERVICE_ICON = 'flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink';
/** The smaller icon tile, for rows and compact cards. */
export const SERVICE_ICON_SM = 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink';

export interface ServiceIntroProps {
  /** Small line above the title on a gold hairline: the airport or its terminals. */
  eyebrow?: ReactNode;
  /** The page's single `h1`. */
  title: ReactNode;
  /** One line: what the page answers. */
  summary?: ReactNode;
  /** Classes for the summary, for example `max-sm:sr-only` where the first phone screen belongs to the answer. */
  summaryClassName?: string;
  breadcrumbs?: ReactNode;
  /**
   * The key answer (a fare, a count, the most-asked places): beside the title from `lg` up, under
   * it on phones. An answer that renders nothing leaves no gap.
   */
  answer?: ReactNode;
  /** Quiet chips or in-page links under the summary. */
  meta?: ReactNode;
  /** One primary or secondary action. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The intro of a service page: breadcrumbs, a gold-rule eyebrow, a big title, a one-line summary
 * and, where the page has one, the key answer in a raised panel. A soft fade from the surface to
 * the cool page grey separates it from the sections below without a rule. Static: the `h1` is in
 * the first HTML and never revealed by a script.
 */
export function ServiceIntro({ eyebrow, title, summary, summaryClassName, breadcrumbs, answer, meta, actions, className }: ServiceIntroProps) {
  return (
    <header data-service-intro="" className={cn('bg-linear-to-b from-surface to-page', className)}>
      <Container className={cn('pb-8 sm:pb-12', breadcrumbs ? 'pt-3 sm:pt-4' : 'pt-8 sm:pt-12')}>
        {breadcrumbs ? (
          <div data-page-breadcrumbs="" className="mb-5 sm:mb-9">
            {breadcrumbs}
          </div>
        ) : null}
        <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
          <div className="min-w-0 lg:max-w-[46rem] lg:flex-1">
            {eyebrow ? (
              <p className="type-eyebrow mb-3 flex items-center gap-2.5 text-gold-ink">
                <span aria-hidden="true" className="h-px w-7 bg-gold" />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="type-display-lg text-balance text-ink">{title}</h1>
            {summary ? <p className={cn('type-lead mt-3 max-w-[40rem] text-ink-2 sm:mt-4', summaryClassName)}>{summary}</p> : null}
            {meta ? <div className="mt-5 flex flex-wrap items-center gap-2">{meta}</div> : null}
            {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
          {answer ? (
            <div data-service-answer="" className="min-w-0 empty:hidden lg:w-[27rem] lg:shrink-0">
              {answer}
            </div>
          ) : null}
        </div>
      </Container>
    </header>
  );
}

/** The column of sections under the intro: generous, even spacing instead of rules. */
export function ServiceBody({ className, children }: { className?: string; children: ReactNode }) {
  return <Container className={cn('flex flex-col gap-16 pb-section sm:gap-20', className)}>{children}</Container>;
}

export interface ServiceHeadingProps {
  id?: string;
  title: ReactNode;
  /** One sentence under the heading. */
  lead?: ReactNode;
  /** A link or two on the right ("All notices", "Open the map"). */
  action?: ReactNode;
  level?: 2 | 3;
  className?: string;
}

/** The heading of a section on a service page: confident display type, one line of lead, one action. */
export function ServiceHeading({ id, title, lead, action, level = 2, className }: ServiceHeadingProps) {
  const Heading = `h${level}` as 'h2' | 'h3';
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 sm:mb-8', className)}>
      <div className="min-w-0 max-w-[46rem]">
        <Heading id={id} className={cn('text-ink', level === 2 ? 'type-display-sm' : 'type-title-lg')}>
          {title}
        </Heading>
        {lead ? <p className="type-body mt-2 text-ink-2">{lead}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">{action}</div> : null}
    </div>
  );
}

/** A quiet pill link for the intro's in-page jumps ("Changing terminals", "Driving? See parking"). */
export const SERVICE_JUMP =
  'type-body-sm inline-flex min-h-10 items-center gap-2 rounded-pill border border-line bg-surface px-4 font-medium text-ink shadow-xs transition-colors duration-fast hover:border-line-strong hover:bg-fill touch:min-h-11';
