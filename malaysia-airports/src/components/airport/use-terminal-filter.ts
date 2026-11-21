'use client';

import { usePathname } from 'next/navigation';
import { getAirport } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { useUrlSearchParams } from '@/lib/hooks/use-url';

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
 * The query comes from `useUrlSearchParams` (round 2): no terminal on the server and during
 * hydration, the URL's right after, so the caller's tree hydrates instead of being replaced. It
 * still reads `usePathname` for `hrefFor`: on routes with params that are not prerendered, keep
 * the caller inside `<Suspense>`; `useTerminalParam` needs no boundary.
 *
 * @example
 * const { terminal } = useTerminalFilter('kul');
 * const flights = provider.listFlightsSync({ airport: 'kul', direction, terminal });
 */
export function useTerminalFilter(airport: string): TerminalFilter {
  const pathname = usePathname();
  const params = useUrlSearchParams();
  const terminal = terminalFrom(airport, params);
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

function terminalFrom(airport: string, params: URLSearchParams): TerminalId | undefined {
  const record = getAirport(airport);
  const value = params.get('t');
  return record && record.terminals.length > 1 ? record.terminals.find((item) => item.id === value)?.id : undefined;
}

/** Only the terminal in the URL (`?t=`), for trees that do not build links: no `<Suspense>` needed. */
export function useTerminalParam(airport: string): TerminalId | undefined {
  return terminalFrom(airport, useUrlSearchParams());
}
