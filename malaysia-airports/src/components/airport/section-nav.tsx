'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { getAirport, type AirportSelection } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { localeHref } from '@/lib/locale';
import { AIRPORT_SECTIONS, sectionPath, type AirportSectionId } from '@/components/shell/sections';
import { Icon } from '@/components/ui/icon';
import { useTerminalFilter } from './use-terminal-filter';

/* ---- Section navigation ---------------------------------------------------------------------- */

export interface SectionNavProps {
  slug: string;
  /** The airport's short name, for the navigation's label. */
  name: string;
  /** Sections this airport has (from `airportSections(slug)` on the server). Others are not shown. */
  sections: readonly AirportSectionId[];
}

function NavList({ slug, name, sections, segment, terminal }: SectionNavProps & { segment: string | null | undefined; terminal?: TerminalId }) {
  const t = useT();
  const lang = useLang();
  const list = useRef<HTMLUListElement>(null);
  const currentId: AirportSectionId | undefined = segment === undefined ? undefined : (AIRPORT_SECTIONS.find((section) => section.segment === (segment ?? ''))?.id ?? undefined);

  // Bring the current section into view inside the scroller (never scrolling the page itself).
  useEffect(() => {
    const scroller = list.current;
    const current = scroller?.querySelector<HTMLElement>('[aria-current]');
    if (scroller && current) scroller.scrollLeft = current.offsetLeft - (scroller.clientWidth - current.clientWidth) / 2;
  }, [currentId]);

  return (
    <nav aria-label={t('airportPage.sectionsLabel', { airport: name })} className="-mx-gutter">
      <ul ref={list} className="flex gap-1 overflow-x-auto px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {AIRPORT_SECTIONS.filter((section) => sections.includes(section.id)).map((section) => {
          const current = section.id === currentId;
          return (
            <li key={section.id} className="shrink-0">
              <Link
                href={localeHref(lang, sectionPath(slug, section.id, terminal))}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'relative inline-flex h-12 items-center gap-2 px-3 text-[0.9375rem] font-medium whitespace-nowrap text-ink-2 transition-colors duration-fast hover:text-ink focus-visible:focus-ring-inset',
                  'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-pill after:bg-transparent hover:after:bg-line-control',
                  'aria-[current]:font-semibold aria-[current]:text-ink aria-[current]:after:bg-primary',
                )}
              >
                <Icon name={section.icon} size="sm" className={current ? 'text-primary-ink' : 'text-ink-3'} />
                {t(section.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavListForRoute(props: SectionNavProps) {
  const segment = useSelectedLayoutSegment();
  const { terminal } = useTerminalFilter(props.slug);
  return <NavList {...props} segment={segment} terminal={terminal} />;
}

/**
 * The section navigation of an airport: Overview, Flights, Terminal map and so on, showing only
 * the sections the airport has. It scrolls sideways on narrow screens and keeps the terminal
 * filter (`?t=`) when moving between sections.
 */
export function SectionNav(props: SectionNavProps) {
  return (
    // The current section and `?t=` come from URL hooks, which need this boundary. The fallback is
    // the same list without the current marker.
    <Suspense fallback={<NavList {...props} segment={undefined} />}>
      <NavListForRoute {...props} />
    </Suspense>
  );
}

/* ---- Terminal chips -------------------------------------------------------------------------- */

export interface TerminalChipsProps {
  slug: string;
  /** Terminals with their short labels, in order. */
  terminals: readonly { id: TerminalId; label: string }[];
}

const CHIP =
  'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-fast touch:h-11 ' +
  'border-line-control bg-surface text-ink hover:border-ink aria-[current]:border-ink aria-[current]:bg-ink aria-[current]:text-page';

function Chips({ slug, terminals, active, hrefFor, onChoose }: TerminalChipsProps & { active?: TerminalId; hrefFor: (terminal?: TerminalId) => string; onChoose?: (selection: AirportSelection) => void }) {
  const t = useT();
  const options: { id: TerminalId | undefined; label: string }[] = [{ id: undefined, label: t('flights.filters.allTerminals') }, ...terminals];
  return (
    <ul aria-label={t('airportPage.terminalFilter')} className="flex flex-wrap items-center gap-1.5">
      {options.map((option) => {
        const current = option.id === active;
        return (
          <li key={option.id ?? 'all'}>
            <Link
              href={hrefFor(option.id)}
              replace
              scroll={false}
              aria-current={current ? 'true' : undefined}
              onClick={() => onChoose?.(option.id ? { airport: slug, terminal: option.id } : { airport: slug })}
              className={CHIP}
            >
              {current ? <Icon name="check" size="sm" strokeWidth={2.25} /> : null}
              {option.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ChipsForRoute(props: TerminalChipsProps) {
  const { terminal, hrefFor } = useTerminalFilter(props.slug);
  const { set } = useAirportContext();
  return <Chips {...props} active={terminal} hrefFor={hrefFor} onChoose={set} />;
}

/**
 * Terminal chips for an airport with more than one terminal (KLIA): they set `?t=T1|T2` on the
 * current page and remember the terminal. Renders nothing for single-terminal airports.
 */
export function TerminalChips(props: TerminalChipsProps) {
  const lang = useLang();
  const airport = getAirport(props.slug);
  if (!airport || airport.terminals.length < 2) return null;
  return (
    <Suspense fallback={<Chips {...props} hrefFor={(terminal) => localeHref(lang, sectionPath(props.slug, 'overview', terminal))} />}>
      <ChipsForRoute {...props} />
    </Suspense>
  );
}
