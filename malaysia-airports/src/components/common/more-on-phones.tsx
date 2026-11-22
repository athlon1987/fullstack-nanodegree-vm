'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/ui/icon';

export interface MoreOnPhonesProps {
  /** The disclosure's label: says what is inside ("Hours, boarding points, payment and accessibility"). */
  summary: ReactNode;
  children: ReactNode;
  /**
   * Where it stops being a disclosure: `md` for the window (48rem), `card` for the nearest
   * `@container` (42rem, a wide card). Wider than that the content shows without its summary.
   */
  from?: 'md' | 'card';
  className?: string;
  contentClassName?: string;
}

/**
 * Secondary detail behind a native disclosure on phones (round 6, review-3 9.1 item 7: the
 * facilities, accessibility and transport pages were 12,000 to 15,000 px long at 390 px). A
 * `<details>` element, so screen readers announce it as expanded or collapsed and the browser's
 * find in page and links to an element inside it open it. It is open in the server HTML (all of
 * it shows without JavaScript, and nothing in the first screen moves when it closes: it is used
 * below the first phone screen); where its summary is shown, on phones, it closes once loaded.
 * From `from` up the summary is not shown (globals.css) and it stays open.
 */
export function MoreOnPhones({ summary, children, from = 'md', className, contentClassName }: MoreOnPhonesProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const details = ref.current;
    const toggle = details?.querySelector('summary');
    if (!details || !toggle) return;
    // Not when the visitor arrived at something inside it (a link to a card), and only below the
    // window: closing one in or above the view would move what the visitor is reading.
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (target && details.contains(target)) return;
    if (details.getBoundingClientRect().top < window.innerHeight) return;
    if (getComputedStyle(toggle).display !== 'none') details.open = false;
  }, []);
  return (
    <details ref={ref} open data-more-on-phones={from} className={cn('group/more min-w-0', className)}>
      <summary className="link-action type-body-sm inline-flex min-h-11 items-center gap-1.5 rounded-sm font-semibold text-ink focus-visible:focus-ring">
        <Icon name="chevron-down" size="sm" strokeWidth={1.75} className="shrink-0 transition-transform duration-fast group-open/more:rotate-180" />
        {summary}
      </summary>
      <div className={cn('pt-3', contentClassName)}>{children}</div>
    </details>
  );
}
