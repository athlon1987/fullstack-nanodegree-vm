'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';

export interface DemoTagProps extends HTMLAttributes<HTMLSpanElement> {
  /** `sm` 20 px (rows), `md` 24 px (group headers). Both stay on one line. */
  size?: 'sm' | 'md';
}

/**
 * The compact demonstration marker: one line, at most 24 px tall, visible text "Demo" and the
 * accessible name "Demonstration data". Put it on every demo row (or group header) that can be
 * read on its own, especially at narrow widths where the full `DemoDataBanner` scrolls away.
 *
 * Every instance carries `data-demo-marker`, which the in-view checks count.
 *
 * @example <DemoTag className="ml-auto" />
 */
export function DemoTag({ size = 'sm', className, ...rest }: DemoTagProps) {
  const t = useT();
  return (
    <span
      data-demo-marker=""
      className={cn(
        'type-caption relative inline-flex shrink-0 items-center overflow-hidden rounded-xs border border-demo-border bg-demo-bg pr-1.5 pl-3 leading-none font-bold whitespace-nowrap text-demo-fg forced-colors:border-[CanvasText]',
        size === 'sm' ? 'h-5 text-[0.75rem]' : 'h-6',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="hazard-stripes absolute inset-y-0 left-0 w-1.5" />
      <span aria-hidden="true">{t('provenance.demo.short')}</span>
      <span className="sr-only">{t('provenance.demo.label')}</span>
    </span>
  );
}

/**
 * Wraps a list of demo rows (a board preview, flight search results) so that a "Demo" marker
 * stays in view while the rows scroll past on a phone, where the banner above the list has long
 * scrolled away (A-04). The marker rides a track that starts below the banner (`start`) and ends
 * with the list; it is decorative for assistive technology, because the list already sits under
 * a `DemoDataBanner` and each row would otherwise be announced twice. From `md` up the rows and
 * the banner share the screen, so no marker is added.
 *
 * @example <DemoMarkedList><BoardPreview rows={8} /></DemoMarkedList>
 */
export function DemoMarkedList({ children, start = 'top-12', className }: { children: ReactNode; start?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <div aria-hidden="true" data-demo-track="" className={cn('pointer-events-none absolute inset-x-0 bottom-0 md:hidden', start)}>
        <div className="sticky top-[calc(var(--spacing-sticky)+0.5rem)] z-10 h-0">
          <DemoTag size="md" className="absolute top-0 right-2 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
