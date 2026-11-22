'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { getAirport, type AirportSelection } from '@/content/airports';
import type { TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { localeHref } from '@/lib/locale';
import { AIRPORT_SECTIONS, sectionPath, type AirportSectionId } from '@/components/shell/sections';
import { LocaleLink } from '@/components/common/locale-link';
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
  const list = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const currentId: AirportSectionId | undefined = segment === undefined ? undefined : (AIRPORT_SECTIONS.find((section) => section.segment === (segment ?? ''))?.id ?? undefined);

  // Overflow cues: an edge fade and a scroll button on each side that has more tabs (A-13).
  const measure = useCallback(() => {
    const scroller = list.current;
    if (!scroller) return;
    const start = scroller.scrollLeft > 2;
    const end = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 2;
    setEdges((current) => (current.start === start && current.end === end ? current : { start, end }));
  }, []);

  useEffect(() => {
    const scroller = list.current;
    if (!scroller) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    scroller.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener('scroll', measure);
    };
  }, [measure]);

  // Bring the current tab fully into view inside the scroller, with room for the fade and the
  // button, without scrolling the page itself.
  useEffect(() => {
    const scroller = list.current;
    const current = scroller?.querySelector<HTMLElement>('[aria-current]');
    if (!scroller || !current) return;
    const box = scroller.getBoundingClientRect();
    const tab = current.getBoundingClientRect();
    const pad = 48;
    if (tab.left < box.left + pad) scroller.scrollLeft -= box.left + pad - tab.left;
    else if (tab.right > box.right - pad) scroller.scrollLeft += tab.right - (box.right - pad);
    measure();
  }, [currentId, measure]);

  const scrollBy = (direction: 1 | -1) => {
    const scroller = list.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * Math.max(160, scroller.clientWidth * 0.7), behavior: 'smooth' });
  };

  return (
    <nav aria-label={t('airportPage.sectionsLabel', { airport: name })} className="relative -mx-gutter">
      <ul
        ref={list}
        style={{ '--fade-start': edges.start ? '3rem' : '0px', '--fade-end': edges.end ? '3rem' : '0px' } as CSSProperties}
        className="scroll-fade-x flex items-center gap-1 overflow-x-auto scroll-px-12 px-gutter py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {AIRPORT_SECTIONS.filter((section) => sections.includes(section.id)).map((section) => {
          const current = section.id === currentId;
          return (
            <li key={section.id} className="shrink-0">
              <LocaleLink
                href={sectionPath(slug, section.id, terminal)}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  // Redesign round one: app-like pills; the current section is an ink pill (a strong
                  // selected state, never a tint alone) and is also marked with aria-current.
                  'relative inline-flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-sm font-medium whitespace-nowrap text-ink-2 transition-colors duration-fast hover:bg-fill hover:text-ink focus-visible:focus-ring-inset touch:h-11',
                  'aria-[current]:bg-ink aria-[current]:font-semibold aria-[current]:text-page aria-[current]:shadow-sm aria-[current]:hover:bg-ink aria-[current]:hover:text-page',
                )}
              >
                {/* Labels only: without icons all nine tabs fit at 1280 px and up in both
                    languages (A-13); the phone "Sections" panel keeps the icons. */}
                {t(section.labelKey)}
              </LocaleLink>
            </li>
          );
        })}
      </ul>
      {/* Pointer users get buttons; keyboard users reach every tab with Tab, and touch users swipe. */}
      {edges.start ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => scrollBy(-1)}
          className="group/scroll absolute inset-y-0 left-0 flex w-12 items-center justify-center bg-page text-ink-2 hover:text-ink touch:hidden"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-line bg-surface shadow-sm transition-shadow duration-fast group-hover/scroll:shadow-md">
            <Icon name="chevron-left" size="sm" strokeWidth={2} />
          </span>
        </button>
      ) : null}
      {edges.end ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => scrollBy(1)}
          className="group/scroll absolute inset-y-0 right-0 flex w-12 items-center justify-center bg-page text-ink-2 hover:text-ink touch:hidden"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-line bg-surface shadow-sm transition-shadow duration-fast group-hover/scroll:shadow-md">
            <Icon name="chevron-right" size="sm" strokeWidth={2} />
          </span>
        </button>
      ) : null}
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

/* Redesign round one: refined pills. They take the theme's tokens, so the same chips work on the
   page and inside the midnight airport header (an `on-media` scope: dark fill, light words). */
// Redesign round one (critique item 17): the terminals are one segmented control (a track with
// the chosen segment filled), so they no longer look like the identity and data pills beside them.
const CHIP =
  'inline-flex h-8 items-center gap-1.5 rounded-pill px-3.5 text-sm font-medium whitespace-nowrap text-ink-2 transition-colors duration-fast touch:h-10 ' +
  'hover:text-ink hover:bg-fill aria-[current]:bg-ink aria-[current]:font-semibold aria-[current]:text-page aria-[current]:shadow-sm';

function Chips({ slug, terminals, active, hrefFor, onChoose }: TerminalChipsProps & { active?: TerminalId; hrefFor: (terminal?: TerminalId) => string; onChoose?: (selection: AirportSelection) => void }) {
  const t = useT();
  const options: { id: TerminalId | undefined; label: string }[] = [{ id: undefined, label: t('flights.filters.allTerminals') }, ...terminals];
  return (
    <ul aria-label={t('airportPage.terminalFilter')} className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-pill border border-line-control bg-surface/60 p-0.5">
      {options.map((option) => {
        const current = option.id === active;
        return (
          <li key={option.id ?? 'all'}>
            <Link
              href={hrefFor(option.id)}
              // The same page with another terminal: nothing to fetch ahead (A-19).
              prefetch={false}
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
