'use client';

import { getAirport } from '@/content/airports';
import { pick } from '@/content/values';
import { cn } from '@/lib/cn';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { AirportCode } from '@/components/common/airport-code';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Icon } from '@/components/ui/icon';
import { overlays, useOverlayOpen } from './overlay-store';
import type { AirportSectionId } from './sections';

/* ---- Trigger -------------------------------------------------------------------------------- */

export interface AirportSwitcherButtonProps {
  /**
   * `header`: the compact control in the site header.
   * `desk`: the large two-line selector on the search desk.
   * `row`: a full-width row for the phone menu.
   */
  variant?: 'header' | 'desk' | 'row';
  /** Continue to this section after choosing (the "choose an airport first" step). */
  then?: AirportSectionId;
  /** `header` only: when the airport name shows beside its code (the header passes container-query classes). */
  labelClassName?: string;
  className?: string;
}

/**
 * Opens the airport switcher. No airport is ever assumed: until the visitor chooses, the control
 * is a solid, clearly highlighted "Choose airport".
 */
export function AirportSwitcherButton({ variant = 'header', then, labelClassName, className }: AirportSwitcherButtonProps) {
  const t = useT();
  const lang = useLang();
  const { choice, selection, hydrated } = useAirportContext();
  const open = useOverlayOpen('airport');
  const airport = choice ? getAirport(choice.airport) : undefined;
  // KLIA without a chosen terminal is just "KLIA": never imply Terminal 1.
  const terminal = selection?.terminal;
  const label = choice ? (terminal || !airport ? pick(choice.label, lang) : airport.shortName) : t('airportSwitcher.none');
  const unset = hydrated && !choice;
  const common = {
    type: 'button' as const,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    onClick: () => overlays.openAirportSwitcher(then),
  };

  if (variant === 'desk' || variant === 'row') {
    return (
      <button
        {...common}
        data-airport-switcher={variant}
        className={cn(
          'group flex w-full min-w-0 items-center gap-3 rounded-lg border text-left transition-colors duration-fast',
          variant === 'desk' ? 'min-h-13 px-2.5 py-1.5' : 'min-h-14 px-3 py-2.5',
          unset
            ? 'border-primary bg-primary-soft text-primary-ink shadow-xs hover:bg-surface'
            : 'border-line-control bg-surface text-ink hover:border-ink hover:bg-page-subtle',
          className,
        )}
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md',
            unset ? 'bg-primary text-on-primary' : 'bg-page-subtle text-primary-ink',
          )}
        >
          <Icon name="map-pin" size="md" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('type-eyebrow block', unset ? 'text-primary-ink' : 'text-ink-2')}>{t('shell.switcher.eyebrow')}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="type-title-sm sm:text-lg">{label}</span>
            {choice ? <AirportCode code={choice.code} name={airport?.name} size="sm" className="text-ink-2" /> : null}
          </span>
        </span>
        <Icon name="chevrons-up-down" size="sm" strokeWidth={1.75} className={unset ? 'text-primary-ink' : 'text-ink-3'} />
      </button>
    );
  }

  return (
    <button
      {...common}
      data-airport-switcher="header"
      data-early-overlay={then ? undefined : 'airport'}
      // Lets the header make room for "Choose airport" on narrow screens (see `SiteHeader`).
      data-no-airport={choice ? undefined : ''}
      className={cn(
        'inline-flex min-h-11 max-w-full min-w-0 items-center gap-2 rounded-md border px-2.5 text-left text-sm font-semibold transition-colors duration-fast sm:px-3',
        unset
          ? 'border-primary bg-primary-soft text-primary-ink hover:bg-surface'
          : 'border-line-control bg-surface text-ink hover:border-ink hover:bg-page-subtle',
        className,
      )}
    >
      {choice ? (
        <>
          {/* Label in Name (WCAG 2.5.3): the accessible name starts with exactly what is shown
              ("KUL T1"), then a visually hidden "change airport (currently KLIA Terminal 1)". */}
          <AirportCode code={choice.code} size="sm" className="font-bold" />
          {terminal ? <TerminalBadge terminal={terminal} size="sm" announce="visible" /> : null}
          <span className={cn('min-w-0 leading-tight', labelClassName ?? 'hidden sm:inline')}>{label}</span>
          <span className="sr-only">{t('shellExtras.switcher.changeSuffix', { airport: label })}</span>
        </>
      ) : (
        <>
          <Icon name="map-pin" size="sm" strokeWidth={2} className="shrink-0" />
          {/* At 320 px and 125% text the header hides the wordmark's name to make room, and the
              label wraps between words if it must, never letter by letter (A-16). */}
          <span className="min-w-0 leading-tight">{label}</span>
        </>
      )}
      <Icon name="chevron-down" size="sm" strokeWidth={2} className="shrink-0 opacity-70 max-xs:hidden" />
    </button>
  );
}
