'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AIRPORTS, AIRPORT_CHOICES, getAirport, type AirportChoice, type AirportSelection } from '@/content/airports';
import { pick } from '@/content/types';
import { cn } from '@/lib/cn';
import { useAirportContext } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { localeHref, stripLocale } from '@/lib/locale';
import { AirportCode } from '@/components/common/airport-code';
import { LocaleLink } from '@/components/common/locale-link';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { SearchField } from '@/components/ui/search-field';
import { closeOverlay, overlays, useOverlayDialog, useOverlayState } from './overlay-store';
import { chooseAirportPath, getSection, isAirportSection, sameSectionPath, sectionHref, sectionPath, type AirportSectionId } from './sections';
import { useSectionAvailability } from './shell-context';

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
  const { open } = useOverlayState();
  const airport = choice ? getAirport(choice.airport) : undefined;
  // KLIA without a chosen terminal is just "KLIA": never imply Terminal 1.
  const terminal = selection?.terminal;
  const label = choice ? (terminal || !airport ? pick(choice.label, lang) : airport.shortName) : t('airportSwitcher.none');
  const unset = hydrated && !choice;
  const common = {
    type: 'button' as const,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open === 'airport',
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
      aria-label={choice ? t('shell.switcher.changeFrom', { airport: label }) : undefined}
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
          <AirportCode code={choice.code} size="sm" className="font-bold" />
          {terminal ? <TerminalBadge terminal={terminal} size="sm" /> : null}
          <span className={cn('min-w-0 leading-tight', labelClassName ?? 'hidden sm:inline')}>{label}</span>
        </>
      ) : (
        <>
          <Icon name="map-pin" size="sm" strokeWidth={2} />
          <span className="min-w-0 leading-tight max-xs:max-w-20 max-xs:text-xs">{label}</span>
        </>
      )}
      <Icon name="chevron-down" size="sm" strokeWidth={2} className="shrink-0 opacity-70 max-xs:hidden" />
    </button>
  );
}

/* ---- Dialog --------------------------------------------------------------------------------- */

const normalise = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

interface Option {
  choice: AirportChoice;
  label: string;
  name: string;
  haystack: string;
}

/**
 * The airport switcher: a search over all 39 airports (name, city, state, code) with the main
 * airports first and KLIA Terminal 1 and Terminal 2 as separate choices. A dialog on desktop, a
 * bottom sheet on phones. Mounted once by `GlobalOverlays`.
 */
export function AirportSwitcherDialog() {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const dialog = useOverlayDialog('airport');
  const availability = useSectionAvailability();
  const { selection, set, clear } = useAirportContext();
  const isSelected = (choice: AirportChoice): boolean => Boolean(selection && choice.airport === selection.airport && choice.terminal === selection.terminal);
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const then = dialog.payload.then;

  const options = useMemo<Option[]>(
    () =>
      AIRPORT_CHOICES.map((choice) => {
        const airport = getAirport(choice.airport);
        const label = pick(choice.label, lang);
        const name = airport?.name ?? label;
        return {
          choice,
          label,
          name,
          haystack: normalise([label, name, airport?.shortName, airport?.city, airport?.state, choice.code, airport?.icao, choice.terminal].filter(Boolean).join(' ')),
        };
      }),
    [lang],
  );

  const terms = normalise(query).split(/\s+/).filter(Boolean);
  const filtering = terms.length > 0;
  const matches = filtering ? options.filter((option) => terms.every((term) => option.haystack.includes(term))) : options;

  const groups: { id: string; title: string; items: Option[] }[] = filtering
    ? [{ id: 'matches', title: t.count('shell.switcher.matches', matches.length), items: matches }]
    : [
        {
          id: 'last',
          title: t('shell.switcher.lastUsed'),
          items: options.filter((option) => selection && option.choice.airport === selection.airport && (!selection.terminal || option.choice.terminal === selection.terminal)),
        },
        { id: 'featured', title: t('airportSwitcher.featured'), items: options.filter((option) => option.choice.featured) },
        {
          id: 'international',
          title: t('airportSwitcher.international'),
          items: options.filter((option) => !option.choice.featured && option.choice.classification === 'international'),
        },
        { id: 'domestic', title: t('airportSwitcher.domestic'), items: options.filter((option) => !option.choice.featured && option.choice.classification === 'domestic') },
        { id: 'stolport', title: t('airportSwitcher.stolports'), items: options.filter((option) => !option.choice.featured && option.choice.classification === 'stolport') },
      ].filter((group) => group.items.length > 0);

  const choose = (choice: AirportChoice) => {
    const next: AirportSelection = choice.terminal ? { airport: choice.airport, terminal: choice.terminal } : { airport: choice.airport };
    set(next);
    const path = stripLocale(window.location.pathname);
    const param = new URLSearchParams(window.location.search).get('then');
    const target = then ?? (path === '/airports' && isAirportSection(param) ? param : undefined);
    const destination = target
      ? sectionHref(target, next, availability)
      : path === '/airports'
        ? sectionPath(next.airport, 'overview', next.terminal)
        : sameSectionPath(path, next, availability);
    setQuery('');
    closeOverlay('airport');
    if (destination) router.push(localeHref(lang, destination));
  };

  const optionButtons = (): HTMLButtonElement[] => Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-airport-option]') ?? []);

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      optionButtons()[0]?.focus();
    } else if (event.key === 'Enter' && filtering && matches.length > 0) {
      event.preventDefault();
      choose(matches[0].choice);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
    const buttons = optionButtons();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    event.preventDefault();
    if (event.key === 'ArrowUp' && index === 0) {
      listRef.current?.closest('[role="dialog"]')?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
      return;
    }
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : index + (event.key === 'ArrowDown' ? 1 : -1);
    buttons[Math.max(0, Math.min(buttons.length - 1, next))]?.focus();
  };

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(next) => {
        if (!next) setQuery('');
        dialog.onOpenChange(next);
      }}
    >
      <DialogContent
        title={t('airportSwitcher.label')}
        description={t('shell.switcher.description', { count: AIRPORTS.length })}
        size="md"
        onCloseAutoFocus={dialog.onCloseAutoFocus}
        className="max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[92dvh] max-sm:translate-y-0 max-sm:rounded-b-none max-sm:border-b-0 max-sm:pb-[env(safe-area-inset-bottom)] sm:max-h-[min(44rem,calc(100dvh-3rem))]"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <LocaleLink href={chooseAirportPath(then)} onClick={() => closeOverlay('airport')} className="link-action text-ink">
              {t('shell.switcher.viewAll', { count: AIRPORTS.length })}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
            {selection ? (
              <Button variant="quiet" size="sm" onClick={() => clear()}>
                {t('airportSwitcher.clear')}
              </Button>
            ) : null}
          </div>
        }
      >
        <SearchField
          label={t('shell.switcher.searchLabel')}
          placeholder={t('airportSwitcher.searchPlaceholder')}
          value={query}
          onValueChange={setQuery}
          onKeyDown={onSearchKeyDown}
          autoFocus
          enterKeyHint="go"
        />
        {then && then !== 'overview' ? (
          <p className="type-body-sm mt-3 flex items-start gap-2 text-ink-2">
            <Icon name="arrow-right" size="sm" className="mt-1 text-primary-ink" />
            {t('shell.switcher.continueTo', { section: t(getSection(then).labelKey) })}
          </p>
        ) : null}
        <p role="status" className="sr-only">
          {filtering ? t.count('shell.switcher.matches', matches.length) : ''}
        </p>

        <div ref={listRef} onKeyDown={onListKeyDown} className="mt-4 flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`airport-group-${group.id}`}>
              <h3 id={`airport-group-${group.id}`} className="type-eyebrow mb-1.5 flex items-center gap-2.5 text-ink-2">
                <span aria-hidden="true" className="h-px w-5 bg-gold" />
                {group.title}
              </h3>
              <ul className="-mx-2 flex flex-col">
                {group.items.map(({ choice, label, name }) => {
                  const selected = isSelected(choice);
                  return (
                    <li key={`${group.id}-${choice.id}`}>
                      <button
                        type="button"
                        data-airport-option={choice.id}
                        aria-current={selected ? 'true' : undefined}
                        onClick={() => choose(choice)}
                        className={cn(
                          'flex min-h-13 w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-fast hover:bg-page-subtle',
                          selected && 'bg-primary-soft hover:bg-primary-soft',
                        )}
                      >
                        <AirportCode code={choice.code} variant="boxed" className="w-13 shrink-0 justify-center text-center" />
                        <span className="min-w-0 flex-1">
                          <span className="type-title-sm flex flex-wrap items-center gap-x-2 text-ink">
                            {label}
                            {choice.terminal ? <TerminalBadge terminal={choice.terminal} size="sm" /> : null}
                          </span>
                          <span className="type-body-sm block text-ink-2">
                            {name} <span aria-hidden="true">·</span> {choice.detail}
                          </span>
                        </span>
                        {selected ? (
                          <span className="flex shrink-0 items-center gap-1 text-primary-ink">
                            <Icon name="check" size="sm" strokeWidth={2.25} />
                            <span className="sr-only">{t('shell.switcher.selected')}</span>
                          </span>
                        ) : (
                          <Icon name="chevron-right" size="sm" className="shrink-0 text-ink-3" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {matches.length === 0 ? (
            <p className="type-body flex items-start gap-2.5 rounded-md border border-line bg-page-subtle p-4 text-ink-2">
              <Icon name="search-x" className="mt-0.5 text-ink-3" />
              {t('airportSwitcher.noMatch')}
            </p>
          ) : null}
        </div>
        <p className="type-caption mt-5 text-ink-2">{t('airportSwitcher.remembered')}</p>
      </DialogContent>
    </Dialog>
  );
}
