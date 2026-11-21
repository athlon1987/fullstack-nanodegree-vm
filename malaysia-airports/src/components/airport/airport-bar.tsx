'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { Suspense, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { TerminalId } from '@/content/types';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { AirportCode } from '@/components/common/airport-code';
import { LocalTime } from '@/components/common/local-time';
import { LocaleLink } from '@/components/common/locale-link';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { AIRPORT_SECTIONS, sectionPath, type AirportSectionId } from '@/components/shell/sections';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { TerminalChips } from './section-nav';
import { useTerminalFilter } from './use-terminal-filter';

export interface AirportBarProps {
  slug: string;
  /** Short name ("KLIA"), shown in the bar. */
  name: string;
  /** Full name, the expansion of the code. */
  fullName: string;
  code: string;
  timeZone: string;
  /** KLIA terminals with their short labels; empty for single-terminal airports. */
  terminals: readonly { id: TerminalId; label: string }[];
  sections: readonly AirportSectionId[];
}

function ActiveTerminal({ slug }: { slug: string }) {
  const { terminal } = useTerminalFilter(slug);
  return terminal ? <TerminalBadge terminal={terminal} size="sm" /> : null;
}

function SectionLinks({ slug, sections, terminal, onNavigate }: { slug: string; sections: readonly AirportSectionId[]; terminal?: TerminalId; onNavigate: () => void }) {
  const t = useT();
  const segment = useSelectedLayoutSegment();
  return (
    <ul className="grid grid-cols-2 gap-1">
      {AIRPORT_SECTIONS.filter((section) => sections.includes(section.id)).map((section) => {
        const current = (segment ?? '') === section.segment;
        return (
          <li key={section.id} className="flex min-w-0">
            <LocaleLink
              href={sectionPath(slug, section.id, terminal)}
              aria-current={current ? 'page' : undefined}
              onClick={onNavigate}
              className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-ink-2 hover:bg-surface hover:text-ink aria-[current]:bg-surface aria-[current]:font-semibold aria-[current]:text-ink aria-[current]:shadow-[inset_3px_0_0_0_var(--color-primary)]"
            >
              <Icon name={section.icon} size="sm" className={current ? 'text-primary-ink' : 'text-ink-3'} />
              <span className="min-w-0">{t(section.labelKey)}</span>
            </LocaleLink>
          </li>
        );
      })}
    </ul>
  );
}

function SectionLinksForRoute(props: { slug: string; sections: readonly AirportSectionId[]; onNavigate: () => void }) {
  const { terminal } = useTerminalFilter(props.slug);
  return <SectionLinks {...props} terminal={terminal} />;
}

/**
 * The compact airport bar of every section page: one row, at most 56 px at 100% text on a
 * phone, with the airport (a link back to its overview), the active KLIA terminal, the local
 * time, and the airport's sections behind one "Sections" control. From `md` up the terminal
 * chips sit in the row and the section tabs show under it instead of the control.
 */
export function AirportBar({ slug, name, fullName, code, timeZone, terminals, sections }: AirportBarProps) {
  const t = useT();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // The bar persists across sections: links close the panel, and so do Escape and Back/Forward.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPop = () => setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
    };
  }, [open]);

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') event.stopPropagation();
  };

  return (
    <>
      {/* 55 px plus the 1 px rule: at most 56 px on a phone at 100% text (A-01). The bar is a
          size container, so at 360 px or 125% text it drops the boxed code (the name stays) and
          shows the Sections control as an icon, instead of squeezing the name letter by letter. */}
      <Container className="@container flex min-h-[3.4375rem] items-center gap-x-3 py-1 md:min-h-13">
        <LocaleLink
          href={`/${slug}`}
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-md text-ink hover:text-primary-ink"
        >
          <AirportCode code={code} name={fullName} variant="boxed" size="sm" className="@max-[21rem]:hidden" />
          <span className="type-title-sm min-w-0 leading-tight [overflow-wrap:normal]">{name}</span>
          <span className="sr-only">{t('shellExtras.airportBar.overviewSuffix')}</span>
        </LocaleLink>
        {terminals.length > 0 ? (
          <span className="md:hidden">
            <Suspense fallback={null}>
              <ActiveTerminal slug={slug} />
            </Suspense>
          </span>
        ) : null}
        <span className="inline-flex items-baseline gap-1.5">
          <span className="type-caption text-ink-2 max-xs:sr-only">{t('shellExtras.airportBar.time')}</span>
          <LocalTime timeZone={timeZone} zone="never" />
        </span>
        {terminals.length > 0 ? (
          <div className="ml-auto max-md:hidden">
            <TerminalChips slug={slug} terminals={terminals} />
          </div>
        ) : null}
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-line-control bg-surface px-3 text-sm font-semibold text-ink transition-colors duration-fast hover:border-ink md:hidden"
        >
          <Icon name="layers" size="sm" strokeWidth={2} />
          <span className="@max-[19rem]:sr-only">{t('shellExtras.airportBar.sections')}</span>
          <Icon name="chevron-down" size="sm" strokeWidth={2} className={cn('transition-transform duration-fast', open && 'rotate-180')} />
        </button>
      </Container>
      <div id={panelId} hidden={!open} onKeyDown={onPanelKeyDown} className="border-t border-line bg-page-subtle md:hidden">
        <Container className="flex flex-col gap-3 py-3">
          <nav aria-label={t('airportPage.sectionsLabel', { airport: name })}>
            <Suspense fallback={<SectionLinks slug={slug} sections={sections} onNavigate={() => setOpen(false)} />}>
              <SectionLinksForRoute slug={slug} sections={sections} onNavigate={() => setOpen(false)} />
            </Suspense>
          </nav>
          {terminals.length > 0 ? <TerminalChips slug={slug} terminals={terminals} /> : null}
          <LocaleLink href="/airports" onClick={() => setOpen(false)} className="link-action type-body-sm self-start text-ink-2">
            <Icon name="tower-control" size="sm" />
            {t('nav.airports')}
          </LocaleLink>
        </Container>
      </div>
    </>
  );
}
