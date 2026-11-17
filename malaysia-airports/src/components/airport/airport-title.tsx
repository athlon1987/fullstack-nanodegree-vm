'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import type { TerminalId } from '@/content/types';
import { getAirport } from '@/content/airports';
import { useAirportContext } from '@/lib/hooks';
import { LocaleLink } from '@/components/common/locale-link';

interface AirportTitleProps {
  slug: string;
  name: string;
}

function Title({ slug, name, overview }: AirportTitleProps & { overview: boolean }) {
  // One `h1` per page: on the overview the airport name is the page title; on a section page the
  // section's own PageHeader has the `h1`, and the name here is a link back to the overview.
  if (overview) return <h1 className="type-display-lg text-ink">{name}</h1>;
  return (
    <p className="type-display-sm text-ink">
      <LocaleLink href={`/${slug}`} className="rounded-sm underline decoration-transparent underline-offset-4 transition-colors duration-fast hover:decoration-gold">
        {name}
      </LocaleLink>
    </p>
  );
}

function TitleForSegment(props: AirportTitleProps) {
  return <Title {...props} overview={useSelectedLayoutSegment() === null} />;
}

/** The airport name in the airport header: the `h1` on the overview, a link back to it elsewhere. */
export function AirportTitle(props: AirportTitleProps) {
  return (
    <Suspense fallback={<Title {...props} overview={false} />}>
      <TitleForSegment {...props} />
    </Suspense>
  );
}

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
