'use client';

import { useEffect, useEffectEvent, useId, useRef, useState, type FormEvent } from 'react';
import { getAirport, terminalLabel } from '@/content/airports';
import { CONCIERGE_MAX_QUESTION } from '@/lib/concierge/constants';
import type { ConciergeContext } from '@/lib/concierge/types';
import { cn } from '@/lib/cn';
import { useHydrated } from '@/lib/hooks/use-store';
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
import { isInterrupted, loadKnowledge, useConcierge, type ConciergeTurn } from './use-concierge';

const EXAMPLE_KEYS = ['checkIn', 'transfer', 'sentral', 'eat', 'delay', 'prayer', 'layover', 'parking', 'lost', 'wheelchair', 'wifi'] as const;
const PANEL_EXAMPLES = ['transfer', 'sentral', 'delay', 'prayer', 'layover', 'parking'] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return document.documentElement.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
    <section aria-labelledby={titleId} className="flex flex-col gap-5">
      <div>
        <h3 id={titleId} className="type-title-lg text-ink">
          {t('conciergePage.consent.title')}
        </h3>
        <p className="type-body mt-1 text-ink-2">{t('conciergePage.consent.intro')}</p>
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
  /** A question to ask as soon as the visitor has agreed (from a launcher). */
  initialQuestion?: string;
  /** Panel only: close the panel ("Not now"). */
  onDecline?: () => void;
  /** Extra controls at the end of the toolbar (the panel's "open full page" link). */
  toolbarEnd?: React.ReactNode;
}

/**
 * The concierge conversation: consent on first use, the airport it answers for, example
 * questions, the log of questions and answers, and the question field. Used by the panel and
 * by the full page.
 */
export function ConciergeChat({ variant, initialQuestion, onDecline, toolbarEnd }: ConciergeChatProps) {
  const t = useT();
  const lang = useLang();
  const hydrated = useHydrated();
  const concierge = useConcierge(lang);
  const { turns, busy, consent, ask, retry, clear, scope, clearScope, savedFlight, useFlight, setUseFlight } = concierge;
  const [draft, setDraft] = useState('');
  const [announcement, setAnnouncement] = useState('');
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
        const element = logRef.current?.querySelector<HTMLElement>(`[data-turn="${turn.id}"]`);
        element?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      }
    });
  };

  // A launcher's question: ask it once consent is given (or right away if it already is).
  const askInitial = useEffectEvent(() => {
    const question = pendingInitial.current;
    if (!question || askedInitial.current === question) return;
    askedInitial.current = question;
    pendingInitial.current = null;
    submit(question);
  });
  useEffect(() => {
    if (consent) askInitial();
  }, [consent]);

  // Once agreed, fetch the knowledge pack in the background so answers keep working offline.
  useEffect(() => {
    if (!consent) return;
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 1500));
    const handle = idle(() => {
      loadKnowledge(lang).catch(() => undefined);
    });
    return () => {
      if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle);
    };
  }, [consent, lang]);

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

  if (!hydrated) {
    return (
      <div role="status" aria-label={t('common.labels.loading')} className="flex flex-col gap-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!consent) {
    return (
      <Consent
        onAccept={() => {
          concierge.accept();
          window.setTimeout(() => focusInput(), 0);
        }}
        onDecline={onDecline}
      />
    );
  }

  const airport = scope.airport ? getAirport(scope.airport) : undefined;
  const scopeLabel = airport ? terminalLabel(airport, scope.terminal && airport.terminals.length > 1 ? scope.terminal : 'MAIN', lang) : undefined;
  const length = draft.length;

  return (
    <div className={cn('@container flex flex-col', variant === 'panel' ? 'h-full min-h-0 gap-4' : 'gap-8')}>
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
            <FilterChip pressed={useFlight} onPressedChange={setUseFlight} icon="plane">
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
        {turns.length === 0 ? (
          <Examples keys={variant === 'panel' ? PANEL_EXAMPLES : EXAMPLE_KEYS} onAsk={(question) => submit(question)} disabled={busy} />
        ) : null}

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
        className={cn('flex shrink-0 flex-col gap-1.5', variant === 'panel' && '-mx-5 border-t border-line px-5 pt-4 sm:-mx-6 sm:px-6')}
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
    </div>
  );
}
