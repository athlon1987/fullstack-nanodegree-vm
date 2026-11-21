'use client';

import { useEffect, useEffectEvent, useId, useRef, useState, type FormEvent } from 'react';
import { getAirport, terminalLabel } from '@/content/airports';
import { CONCIERGE_MAX_QUESTION } from '@/lib/concierge/constants';
import type { ConciergeContext } from '@/lib/concierge/types';
import { cn } from '@/lib/cn';
import { useLang, useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { FilterChip } from '@/components/ui/filter-chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ConciergeAnswerView } from './concierge-answer';
import { isInterrupted, prepareOnDevice, useConcierge, type ConciergeTurn } from './use-concierge';

const EXAMPLE_KEYS = ['checkIn', 'transfer', 'sentral', 'eat', 'delay', 'prayer', 'layover', 'parking', 'lost', 'wheelchair', 'wifi'] as const;
const PANEL_EXAMPLES = ['transfer', 'sentral', 'delay', 'prayer', 'layover', 'parking'] as const;
/** Without intent, the on-device engine loads this long after the page has loaded (round 5). */
const ON_DEVICE_WARM_DELAY_MS = 8_000;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The opt-in for the concierge service (AI wording, saved flight). Asked only when the visitor
 * wants one of those (B-15): answers already work on this device without it.
 */
function Consent({ onAccept, onDecline }: { onAccept: () => void; onDecline?: () => void }) {
  const t = useT();
  const titleId = useId();
  const items: { icon: IconName; title: string; body: string }[] = [
    { icon: 'send', title: t('conciergePage.consent.sentTitle'), body: t('conciergePage.consent.sent') },
    { icon: 'shield-check', title: t('conciergePage.consent.storedTitle'), body: t('conciergePage.consent.stored') },
    { icon: 'sparkles', title: t('conciergePage.consent.aiTitle'), body: t('conciergePage.consent.ai') },
    { icon: 'info', title: t('conciergePage.consent.limitsTitle'), body: t('conciergePage.consent.limits') },
  ];
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-5 rounded-lg border border-line-strong bg-surface p-4 sm:p-5">
      <div>
        <h3 id={titleId} className="type-title-md text-ink">
          {t('conciergePage.onDevice.optInTitle')}
        </h3>
        <p className="type-body mt-1 text-ink-2">{t('conciergePage.onDevice.optInIntro')}</p>
      </div>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-ink">
              <Icon name={item.icon} size="sm" />
            </span>
            <div className="min-w-0">
              <p className="type-title-sm text-ink">{item.title}</p>
              <p className="type-body text-ink-2">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onAccept} iconEnd="arrow-right">
          {t('conciergePage.consent.accept')}
        </Button>
        {onDecline ? (
          <Button variant="secondary" onClick={onDecline}>
            {t('conciergePage.consent.decline')}
          </Button>
        ) : null}
      </div>
      <LocaleLink href="/privacy" className="link type-body-sm self-start">
        {t('conciergePage.consent.privacyLink')}
      </LocaleLink>
    </section>
  );
}

/**
 * The privacy line above the conversation, in the server HTML (performance-12): what happens to
 * a question now, and the switch between answers on this device and the concierge service.
 */
function PrivacyNotice({ consent, onTurnOn, onTurnOff, expanded }: { consent: boolean; onTurnOn: () => void; onTurnOff: () => void; expanded: boolean }) {
  const t = useT();
  return (
    <div data-concierge-privacy={consent ? 'service' : 'device'} className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-md border border-line bg-page-subtle px-3.5 py-2.5">
      <Icon name={consent ? 'sparkles' : 'shield-check'} size="sm" className="mt-0.5 shrink-0 text-ink-2" />
      <p className="type-body-sm min-w-0 flex-1 basis-56 text-ink-2">
        {consent ? t('conciergePage.onDevice.noticeServer') : t('conciergePage.onDevice.noticeLocal')}{' '}
        <LocaleLink href="/privacy" className="link">
          {t('conciergePage.consent.privacyLink')}
        </LocaleLink>
      </p>
      {consent ? (
        <Button variant="quiet" size="sm" iconStart="shield-check" onClick={onTurnOff}>
          {t('conciergePage.onDevice.turnOff')}
        </Button>
      ) : (
        <Button variant="quiet" size="sm" iconStart="sparkles" aria-expanded={expanded} onClick={onTurnOn}>
          {t('conciergePage.onDevice.turnOn')}
        </Button>
      )}
    </div>
  );
}

function Examples({ keys, onAsk, disabled }: { keys: readonly (typeof EXAMPLE_KEYS)[number][]; onAsk: (question: string) => void; disabled: boolean }) {
  const t = useT();
  const titleId = useId();
  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className="type-eyebrow mb-2.5 text-ink-2">
        {t('conciergePage.examplesTitle')}
      </h3>
      <ul className="grid gap-2 @2xl:grid-cols-2">
        {keys.map((key) => {
          const question = t(`conciergePage.examples.${key}`);
          return (
            <li key={key} className="flex">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAsk(question)}
                className="group flex min-h-12 w-full items-center gap-3 rounded-md border border-line-strong bg-surface px-3.5 py-2.5 text-left text-ink transition-colors duration-fast hover:border-ink-3 hover:bg-surface-raised disabled:opacity-60"
              >
                <Icon name="messages-square" size="sm" className="shrink-0 text-primary-ink" />
                <span className="type-body min-w-0 flex-1">{question}</span>
                <Icon name="arrow-right" size="sm" className="shrink-0 text-ink-3 transition-transform duration-base group-hover:translate-x-0.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Turn({ turn, onAsk, onRetry, busy }: { turn: ConciergeTurn; onAsk: (question: string, context?: ConciergeContext) => void; onRetry: () => void; busy: boolean }) {
  const t = useT();
  const failed = turn.status === 'error' || isInterrupted(turn);
  return (
    <li data-turn={turn.id} className="flex scroll-mt-4 flex-col gap-4">
      <h3 className="type-body ml-auto max-w-[85%] rounded-lg rounded-br-xs bg-primary px-4 py-2.5 font-medium break-words text-on-primary">
        <span className="sr-only">{t('conciergePage.log.you')}: </span>
        {turn.question}
      </h3>
      <div className="flex min-w-0 items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 hidden size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink @md:flex">
          <Icon name="sparkles" size="sm" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="sr-only">{t('conciergePage.log.concierge')}</p>
          {turn.status === 'done' && turn.answer ? (
            <ConciergeAnswerView answer={turn.answer} mode={turn.mode ?? 'grounded'} note={turn.note} onAsk={onAsk} busy={busy} />
          ) : failed ? (
            <Callout
              tone="warning"
              title={t('conciergePage.log.failed')}
              actions={
                <Button variant="secondary" size="sm" iconStart="refresh-cw" onClick={onRetry} disabled={busy}>
                  {t('conciergePage.log.retry')}
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2.5 pt-1">
              <p className="type-body-sm inline-flex items-center gap-2 text-ink-2">
                <Icon name="loader-circle" size="sm" className="motion-safe:animate-spin" />
                {t('conciergePage.log.thinking')}
              </p>
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-8/12" />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export interface ConciergeChatProps {
  variant: 'panel' | 'page';
  /** A question to answer as soon as the conversation opens (from a launcher). */
  initialQuestion?: string;
  /** Extra controls at the end of the toolbar (the panel's "open full page" link). */
  toolbarEnd?: React.ReactNode;
}

/**
 * The concierge conversation: the privacy line (answers on this device until the visitor opts in
 * to the service), the airport it answers for, example questions, the log of questions and
 * answers, and the question field. Used by the panel and by the full page. Everything here is in
 * the server HTML in its first-visit state, so nothing jumps when it hydrates (performance-12).
 */
export function ConciergeChat({ variant, initialQuestion, toolbarEnd }: ConciergeChatProps) {
  const t = useT();
  const lang = useLang();
  const concierge = useConcierge(lang);
  const { turns, busy, consent, ask, retry, clear, scope, clearScope, savedFlight, useFlight, setUseFlight } = concierge;
  const [draft, setDraft] = useState('');
  const [announcement, setAnnouncement] = useState('');
  /** The opt-in panel is open; `flight` when it was opened by the saved-flight switch. */
  const [optIn, setOptIn] = useState<null | 'service' | 'flight'>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const focusInput = () => formRef.current?.querySelector('input')?.focus();
  const logRef = useRef<HTMLOListElement>(null);
  const askedInitial = useRef<string | null>(null);
  const pendingInitial = useRef<string | null>(initialQuestion ?? null);

  const submit = (question: string, context?: ConciergeContext) => {
    const text = question.trim();
    if (!text || busy || text.length > CONCIERGE_MAX_QUESTION) return;
    setDraft('');
    setAnnouncement(t('conciergePage.log.announceThinking'));
    void ask(text, context).then((turn) => {
      setAnnouncement(turn.answer ? t('conciergePage.log.announceAnswer', { text: turn.answer.text }) : t('conciergePage.log.failed'));
      if (turn.answer) {
        // The answer's start comes into view; the composer stays on screen (sticky on the page,
        // inside the panel's own scroll area), so the focused field never leaves the viewport.
        const element = logRef.current?.querySelector<HTMLElement>(`[data-turn="${turn.id}"]`);
        element?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
    });
  };

  // A launcher's question (a suggested question on the home page) is answered at once: before
  // consent it is answered on this device, so there is nothing to agree to first (usability-21).
  const askInitial = useEffectEvent(() => {
    const question = pendingInitial.current;
    if (!question || askedInitial.current === question) return;
    askedInitial.current = question;
    pendingInitial.current = null;
    submit(question);
  });
  useEffect(() => {
    askInitial();
  }, []);

  // Load the engine and the knowledge pack (about 125 KB) before the first on-device answer, so
  // it is immediate and later ones keep working offline. Round 5 (A-09, E-01): on the page this
  // ran at the first idle moment, inside the page's start-up, and its parsing was most of the
  // concierge's TBT rise in round four. Now it starts when the visitor shows intent (pointer or
  // focus in the concierge, below), or after the page has been loaded and idle for a while. The
  // panel is opened on purpose, so it starts at once there.
  const prepared = useRef(false);
  const prepare = () => {
    if (prepared.current) return;
    prepared.current = true;
    prepareOnDevice(lang);
  };
  const prepareSoon = useEffectEvent(prepare);
  useEffect(() => {
    if (variant === 'panel') {
      prepareSoon();
      return;
    }
    let idle: number | undefined;
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => prepareSoon(), { timeout: 5000 });
      else prepareSoon();
    }, ON_DEVICE_WARM_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      if (idle !== undefined) window.cancelIdleCallback(idle);
    };
  }, [variant]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(draft);
    focusInput();
  };

  const onClear = () => {
    clear();
    setAnnouncement(t('conciergePage.log.announceCleared'));
    focusInput();
  };

  const acceptOptIn = () => {
    concierge.accept();
    if (optIn === 'flight') setUseFlight(true);
    setOptIn(null);
    setAnnouncement(t('conciergePage.onDevice.announceOn'));
    window.setTimeout(() => focusInput(), 0);
  };
  const turnOff = () => {
    concierge.revoke();
    setAnnouncement(t('conciergePage.onDevice.announceOff'));
  };
  const onFlightChange = (on: boolean) => {
    if (on && !consent) {
      setOptIn('flight');
      setAnnouncement(t('conciergePage.onDevice.flightNeedsConsent'));
      return;
    }
    setUseFlight(on);
  };

  /** The page's composer sticks to the bottom of the window only once there is a conversation. */
  const stuck = variant === 'page' && turns.length > 0;
  // Round 6 (P9, WCAG 2.4.11): while the composer is stuck, the page keeps a bottom scroll padding
  // as tall as the composer (plus the phone's bottom bar when it shows), so a control that takes
  // focus is scrolled clear of it, at any window size, zoom or text size. Measured, because the
  // composer grows with the text size and with the character counter.
  useEffect(() => {
    const form = formRef.current;
    if (!stuck || !form) return;
    const root = document.documentElement;
    const update = () => {
      if (getComputedStyle(form).position !== 'sticky') {
        root.style.removeProperty('scroll-padding-bottom');
        return;
      }
      const height = Math.ceil(form.getBoundingClientRect().height);
      root.style.setProperty('scroll-padding-bottom', `calc(${height}px + var(--spacing-sticky-bottom) + env(safe-area-inset-bottom) + 0.5rem)`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(form);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty('scroll-padding-bottom');
    };
  }, [stuck]);

  const airport = scope.airport ? getAirport(scope.airport) : undefined;
  const scopeLabel = airport ? terminalLabel(airport, scope.terminal && airport.terminals.length > 1 ? scope.terminal : 'MAIN', lang) : undefined;
  const length = draft.length;

  return (
    <div className={cn('@container flex flex-col', variant === 'panel' ? 'h-full min-h-0 gap-4' : 'gap-8')} onPointerEnter={prepare} onPointerDown={prepare} onFocus={prepare}>
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <div className={cn('flex items-center justify-between gap-x-4 gap-y-2', variant === 'page' && 'flex-wrap')}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className={cn('type-caption text-ink-2', variant === 'panel' && 'sr-only')}>{t('conciergePage.scope.label')}</span>
          {scopeLabel ? (
            <span className="type-body-sm inline-flex min-h-8 items-center gap-1 rounded-pill border border-line-strong bg-surface py-0.5 pr-0.5 pl-3 text-ink touch:min-h-11">
              <Icon name="map-pin" size="xs" className="text-ink-2" />
              {scopeLabel}
              <button
                type="button"
                onClick={clearScope}
                aria-label={t('conciergePage.scope.clearAirport', { airport: scopeLabel })}
                className="ml-0.5 flex size-7 items-center justify-center rounded-pill text-ink-2 hover:bg-page-subtle hover:text-ink touch:size-10"
              >
                <Icon name="x" size="xs" />
              </button>
            </span>
          ) : (
            <span className="type-body-sm text-ink">{t('conciergePage.scope.noAirport')}</span>
          )}
          {savedFlight ? (
            <FilterChip pressed={useFlight} onPressedChange={onFlightChange} icon="plane">
              {t('conciergePage.scope.useFlight', { flight: savedFlight.number })}
            </FilterChip>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {turns.length > 0 ? (
            variant === 'panel' ? (
              <IconButton icon="trash-2" label={t('conciergePage.clear')} size="sm" onClick={onClear} />
            ) : (
              <Button variant="ghost" size="sm" iconStart="trash-2" onClick={onClear}>
                {t('conciergePage.clear')}
              </Button>
            )
          ) : null}
          {toolbarEnd}
        </div>
      </div>

      {/* In the panel the conversation scrolls on its own, so the question field stays in view. */}
      <div className={cn('flex flex-col gap-8', variant === 'panel' && '-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2')}>
        <div className="flex flex-col gap-4">
          <PrivacyNotice consent={consent} expanded={optIn !== null} onTurnOn={() => setOptIn((value) => (value ? null : 'service'))} onTurnOff={turnOff} />
          {optIn && !consent ? <Consent onAccept={acceptOptIn} onDecline={() => setOptIn(null)} /> : null}
        </div>
        {variant === 'panel' && turns.length === 0 ? <Examples keys={PANEL_EXAMPLES} onAsk={(question) => submit(question)} disabled={busy} /> : null}

        <div role="log" aria-label={t('conciergePage.log.label')} aria-live="off" className={cn(turns.length === 0 && 'hidden')}>
          <ol ref={logRef} className="flex flex-col gap-8">
            {turns.map((turn) => (
              <Turn key={turn.id} turn={turn} busy={busy} onAsk={(question, context) => submit(question, context)} onRetry={() => void retry(turn)} />
            ))}
          </ol>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={onSubmit}
        data-sticky-bottom={variant === 'page' ? '' : undefined}
        data-composer={variant === 'page' ? (stuck ? 'sticky' : 'static') : undefined}
        className={cn(
          'flex shrink-0 flex-col gap-1.5',
          variant === 'panel' && '-mx-5 border-t border-line px-5 pt-4 sm:-mx-6 sm:px-6',
          // On the page, once there is a conversation, the composer sticks to the bottom of the
          // screen (above the phone's bottom bar), so the focused field stays in view after each
          // answer (accessibility-14).
          stuck &&
            // Round 4 (layout package, WCAG 2.4.11/2.4.12): the offset follows the bottom bar (0 while it is slid
            // away), and on short windows `data-sticky-bottom` turns sticking off (globals.css).
            'sticky bottom-[calc(var(--spacing-sticky-bottom)+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-line bg-page px-4 py-3 sm:-mx-7 sm:bg-surface sm:px-7 md:bottom-0',
          // Fills the strip between the composer and the phone's bottom bar, so answers do not show through.
          stuck && 'after:absolute after:inset-x-0 after:top-full after:h-6 after:bg-page sm:after:bg-surface md:after:hidden',
        )}
      >
        <div className="flex items-end gap-2">
          <Input
            label={t('conciergePage.composer.label')}
            hideLabel
            placeholder={t('conciergePage.composer.placeholder')}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={CONCIERGE_MAX_QUESTION}
            autoComplete="off"
            enterKeyHint="send"
            fieldClassName="min-w-0 flex-1"
          />
          <Button type="submit" loading={busy} loadingLabel={t('conciergePage.composer.sending')} iconEnd="send" disabled={!draft.trim()}>
            {t('conciergePage.composer.send')}
          </Button>
        </div>
        {length > CONCIERGE_MAX_QUESTION - 80 ? (
          <p className="type-caption text-ink-2" aria-live="polite">
            {t('conciergePage.composer.counter', { count: length, max: CONCIERGE_MAX_QUESTION })}
          </p>
        ) : null}
      </form>

      {/* Round 6 (P9, WCAG 2.4.11 and 2.5.8): before the first question the page's composer is not
          sticky and comes first, with the suggestions after it in reading and focus order, so no
          suggestion can sit under it (it hid the focused suggestion at 1280 x 720 and 1440 x 900). */}
      {variant === 'page' && turns.length === 0 ? <Examples keys={EXAMPLE_KEYS} onAsk={(question) => submit(question)} disabled={busy} /> : null}
    </div>
  );
}
