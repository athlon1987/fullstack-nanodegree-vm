'use client';

import { Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { TerminalId } from '@/content/types';

export interface TerminalSection {
  id: TerminalId;
  content: ReactNode;
}

/**
 * Shows the sections of one terminal when the URL has `?t=T1|T2` (the airport header's terminal
 * chips), and all of them otherwise. The static HTML, and visitors without JavaScript, get every
 * terminal.
 */
export function TerminalSections({ sections }: { sections: readonly TerminalSection[] }) {
  return (
    <Suspense fallback={<All sections={sections} />}>
      <Scoped sections={sections} />
    </Suspense>
  );
}

function All({ sections }: { sections: readonly TerminalSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.id}>{section.content}</div>
      ))}
    </>
  );
}

function Scoped({ sections }: { sections: readonly TerminalSection[] }) {
  const params = useSearchParams();
  const wanted = params.get('t');
  const shown = sections.some((section) => section.id === wanted) ? sections.filter((section) => section.id === wanted) : sections;
  return <All sections={shown} />;
}
