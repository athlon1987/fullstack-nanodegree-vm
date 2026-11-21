'use client';

import { useEffect } from 'react';
import type { TerminalId } from '@/content/types';
import { getAirport } from '@/content/airports';
import { useAirportContext } from '@/lib/hooks';

/**
 * Keeps the remembered airport in step with the airport page being viewed, so the header's
 * airport switcher always names the airport on screen. A valid `?t=` also sets the terminal.
 */
export function SyncAirportContext({ slug }: { slug: string }) {
  const { selection, set, hydrated } = useAirportContext();
  useEffect(() => {
    if (!hydrated) return;
    const airport = getAirport(slug);
    if (!airport) return;
    const value = new URLSearchParams(window.location.search).get('t');
    const terminal = airport.terminals.length > 1 ? (airport.terminals.find((item) => item.id === value)?.id as TerminalId | undefined) : undefined;
    if (selection?.airport !== airport.slug) set({ airport: airport.slug, terminal });
    else if (terminal && selection.terminal !== terminal) set({ airport: airport.slug, terminal });
  }, [slug, selection, set, hydrated]);
  return null;
}
