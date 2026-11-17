'use client';

import type { TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';

export interface TerminalBadgeProps {
  terminal: TerminalId;
  /** sm 20px, md 24px (default). */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * "T1" or "T2" in a fixed-width mono badge. Terminal 1 is solid and Terminal 2 is outlined, so
 * the two never depend on colour. Single-terminal airports (`MAIN`) render nothing.
 *
 * @example <TerminalBadge terminal={flight.terminal} />
 */
export function TerminalBadge({ terminal, size = 'md', className }: TerminalBadgeProps) {
  const t = useT();
  if (terminal === 'MAIN') return null;
  const number = terminal.slice(1);
  return (
    <span
      data-terminal={terminal}
      className={cn(
        'type-data-xs inline-flex shrink-0 items-center justify-center rounded-xs border font-bold',
        size === 'sm' ? 'h-badge-sm min-w-6 px-1' : 'h-badge min-w-7 px-1.5',
        terminal === 'T1' ? 'border-ink bg-ink text-page' : 'border-ink bg-transparent text-ink',
        className,
      )}
    >
      <span aria-hidden="true">{terminal}</span>
      <span className="sr-only">
        {t('common.labels.terminal')} {number}
      </span>
    </span>
  );
}
