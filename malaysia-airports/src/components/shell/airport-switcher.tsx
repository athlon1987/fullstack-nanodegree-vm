'use client';

import { getAirport, localizeAirport } from '@/content/airports';
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
  const label = choice ? (terminal || !airport ? pick(choice.label, lang) : localizeAirport(airport, lang).shortName) : t('airportSwitcher.none');
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
          'group flex w-full min-w-0 items-center gap-3 rounded-2xl border text-left transition-colors duration-fast',
          variant === 'desk' ? 'min-h-13 px-2.5 py-1.5' : 'min-h-16 px-3 py-2.5',
          unset ? 'border-gold bg-gold-soft text-ink shadow-xs hover:border-gold-hover' : 'border-line-control bg-surface text-ink hover:border-ink hover:bg-page-subtle',
          className,
        )}
      >
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', unset ? 'bg-gold text-on-gold' : 'bg-fill text-ink')}>
          <Icon name="map-pin" size="md" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="type-eyebrow block text-ink-2">{t('shell.switcher.eyebrow')}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="type-title-sm sm:text-lg">{label}</span>
            {choice ? <AirportCode code={choice.code} name={airport?.name} size="sm" className="text-ink-2" /> : null}
          </span>
        </span>
        <Icon name="chevrons-up-down" size="sm" strokeWidth={1.75} className="text-ink-3" />
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
        // The header is a midnight bar: with no airport chosen the control is a solid gold pill
        // (v1 requirement 4, a solid unset state); once chosen, a quiet glass pill.
        'inline-flex min-h-11 max-w-full min-w-0 items-center gap-2 rounded-pill border px-3 text-left text-sm font-semibold transition-colors duration-fast sm:px-3.5',
        // Redesign round one (critique item 13, less gold): unset is a solid midnight fill with a
        // gold edge and a gold pin (still the solid unset state of v1 requirement 4), not a gold slab.
        unset
          ? 'border-gold bg-fill text-ink shadow-sm hover:border-gold-bright hover:bg-fill-hover'
          : 'border-[rgb(255_255_255/0.2)] bg-[rgb(255_255_255/0.06)] text-ink hover:border-[rgb(255_255_255/0.4)] hover:bg-[rgb(255_255_255/0.12)]',
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
          <Icon name="map-pin" size="sm" strokeWidth={2} className={cn('shrink-0', unset && 'text-gold-bright')} />
          {/* At 320 px and 125% text the header hides the wordmark's name to make room, and the
              label wraps between words if it must, never letter by letter (A-16). Redesign round
              one (critique item 12): one line from 36rem; beside the Malay navigation (84 to 96rem)
              the last word is left to screen readers ("Pilih lapangan"), so the name still starts
              with what is shown (WCAG 2.5.3). */}
          <span className="min-w-0 leading-tight @[36rem]:whitespace-nowrap">
            {lang === 'ms' && label.includes(' ') ? (
              <>
                {label.slice(0, label.lastIndexOf(' '))}
                <span className="@[84rem]:@max-[96rem]:sr-only"> {label.slice(label.lastIndexOf(' ') + 1)}</span>
              </>
            ) : (
              label
            )}
          </span>
        </>
      )}
      <Icon name="chevron-down" size="sm" strokeWidth={2} className="shrink-0 opacity-70 max-xs:hidden" />
    </button>
  );
}
