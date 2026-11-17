'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { getAirport } from '@/content/airports';
import type { TerminalId } from '@/content/types';

/** What `useTerminalFilter` returns. */
export interface TerminalFilter {
  /** The terminal in the URL (`?t=T1`), when it is one of this airport's terminals. Undefined means all terminals. */
  terminal: TerminalId | undefined;
  /** The current page with another terminal (or none) selected, WITH the locale: pass it to `next/link`, not `LocaleLink`. */
  hrefFor: (terminal: TerminalId | undefined) => string;
}

/**
 * The terminal filter of an airport page. KLIA is one airport with two terminals, and the
 * terminal is a filter in the URL (`?t=T1|T2`), never a separate tree of pages.
 *
 * It reads `useSearchParams`, so the component that calls it must sit inside `<Suspense>`.
 *
 * @example
 * const { terminal } = useTerminalFilter('kul');
 * const flights = provider.listFlightsSync({ airport: 'kul', direction, terminal });
 */
export function useTerminalFilter(airport: string): TerminalFilter {
  const pathname = usePathname();
  const params = useSearchParams();
  const record = getAirport(airport);
  const value = params.get('t');
  const terminal = record && record.terminals.length > 1 ? record.terminals.find((item) => item.id === value)?.id : undefined;
  return {
    terminal,
    hrefFor: (next) => {
      const query = new URLSearchParams(params);
      if (next) query.set('t', next);
      else query.delete('t');
      const suffix = query.toString();
      return `${pathname}${suffix ? `?${suffix}` : ''}`;
    },
  };
}
