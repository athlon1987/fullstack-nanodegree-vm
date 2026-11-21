'use client';

/**
 * Concierge state and the ask flow, shared by the panel and the full page.
 *
 * - Until the visitor agrees, every question is answered on this device by the deterministic
 *   engine from the knowledge pack: nothing is sent, so no consent is needed and suggested
 *   questions answer at once (B-15, usability-21).
 * - Consent (`ma:concierge-consent:v1`) is asked only before the concierge service is used, which
 *   may word answers with AI, and before the saved flight is included.
 * - The conversation lives in session storage (`ma:concierge-conversation:v1`): this tab only,
 *   gone when the tab closes. Nothing is stored on the server.
 * - A question goes to `/api/concierge`. If that fails (offline, rate-limited, timeout, server
 *   error) the same engine runs in the browser with the knowledge pack loaded from
 *   `/<lang>/concierge/knowledge.json`, so the concierge keeps working in deterministic mode.
 *   The engine and the pack are loaded only when needed (or prefetched once consent is given).
 */
import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import type { Lang } from '@/content/types';
import { CONCIERGE_CLIENT_TIMEOUT_MS } from '@/lib/concierge/constants';
import type { ConciergeAnswer, ConciergeContext, ConciergeKnowledge, ConciergeMode, ConciergeResponse } from '@/lib/concierge/types';
import { useAirportContext } from '@/lib/hooks/use-airport-context';
import { useSavedJourney } from '@/lib/hooks/use-saved-journey';
import { useStore } from '@/lib/hooks/use-store';
import { localeHref } from '@/lib/locale';
import { createStore, type StorageLike } from '@/lib/storage';

export interface ConciergeTurn {
  id: string;
  question: string;
  status: 'pending' | 'done' | 'error';
  answer?: ConciergeAnswer;
  mode?: ConciergeMode;
  /** Why the answer was produced on this device: the service failed, or the visitor has not opted in (`private`). */
  note?: 'offline' | 'rate-limited' | 'private';
  /** Context the question was asked with, for "Try again". */
  context?: ConciergeContext;
}

interface ConversationState {
  turns: ConciergeTurn[];
  /** `null`: not chosen yet, use the remembered airport. `{}`: answer for any airport. */
  scope: { airport?: string; terminal?: 'T1' | 'T2' | 'MAIN' } | null;
  useFlight: boolean;
}

const MAX_TURNS = 30;

const sessionStorageLike: StorageLike = {
  getItem: (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Storage full or blocked: the conversation stays in memory for this visit.
    }
  },
  removeItem: (key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Nothing to remove.
    }
  },
};

const isAnswer = (value: unknown): value is ConciergeAnswer =>
  typeof value === 'object' && value !== null && typeof (value as ConciergeAnswer).text === 'string' && Array.isArray((value as ConciergeAnswer).statements);

const ContextSchema = z
  .object({ airport: z.string().optional(), terminal: z.enum(['T1', 'T2', 'MAIN']).optional(), flightId: z.string().optional(), intent: z.string().optional(), category: z.string().optional(), destination: z.string().optional() })
  .transform((value) => value as ConciergeContext);

const ConversationSchema = z.object({
  turns: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      status: z.enum(['pending', 'done', 'error']),
      answer: z.custom<ConciergeAnswer>(isAnswer).optional(),
      mode: z.enum(['grounded', 'grounded-rephrased', 'local']).optional(),
      note: z.enum(['offline', 'rate-limited', 'private']).optional(),
      context: ContextSchema.optional(),
    }),
  ),
  scope: z.object({ airport: z.string().optional(), terminal: z.enum(['T1', 'T2', 'MAIN']).optional() }).nullable(),
  useFlight: z.boolean(),
});

const EMPTY: ConversationState = { turns: [], scope: null, useFlight: false };

export const conversationStore = createStore<ConversationState>({
  name: 'concierge-conversation',
  version: 1,
  schema: ConversationSchema as unknown as z.ZodType<ConversationState>,
  defaultValue: EMPTY,
  storage: sessionStorageLike,
});

export const consentStore = createStore<boolean>({ name: 'concierge-consent', version: 1, schema: z.boolean(), defaultValue: false });

/** Requests in flight in this tab. A pending turn that is not here was interrupted by a reload. */
const inflight = new Set<string>();
let counter = 0;

export function isInterrupted(turn: ConciergeTurn): boolean {
  return turn.status === 'pending' && !inflight.has(turn.id);
}

/* ---- the browser fallback ----------------------------------------------------------------- */

const knowledgeCache = new Map<Lang, Promise<ConciergeKnowledge>>();

/** The knowledge pack, fetched once per language (static JSON, cacheable). */
export function loadKnowledge(lang: Lang): Promise<ConciergeKnowledge> {
  let pending = knowledgeCache.get(lang);
  if (!pending) {
    pending = fetch(localeHref(lang, '/concierge/knowledge.json')).then((response) => {
      if (!response.ok) throw new Error(`knowledge ${response.status}`);
      return response.json() as Promise<ConciergeKnowledge>;
    });
    pending.catch(() => knowledgeCache.delete(lang));
    knowledgeCache.set(lang, pending);
  }
  return pending;
}

/** Load the engine and the knowledge pack ahead of the first question (on idle), so on-device answers are immediate. */
export function prepareOnDevice(lang: Lang): void {
  void Promise.all([import('@/lib/concierge/engine'), import('@/lib/concierge/flights'), import('@/lib/providers'), loadKnowledge(lang)]).catch(() => undefined);
}

async function answerOnDevice(question: string, lang: Lang, context: ConciergeContext): Promise<ConciergeAnswer> {
  const [engine, adapters, providers, knowledge] = await Promise.all([
    import('@/lib/concierge/engine'),
    import('@/lib/concierge/flights'),
    import('@/lib/providers'),
    loadKnowledge(lang),
  ]);
  const now = Date.now();
  return engine.answerQuestion({ question, lang, context }, { knowledge, now, flights: adapters.flightSourceFromProvider(providers.getFlightProvider(now)) });
}

type ApiResult = { ok: true; data: ConciergeResponse } | { ok: false; reason: 'offline' | 'rate-limited' | 'private' };

async function askServer(question: string, lang: Lang, context: ConciergeContext): Promise<ApiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONCIERGE_CLIENT_TIMEOUT_MS);
  try {
    const body = { question, lang, ...Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined)) };
    const response = await fetch('/api/concierge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.status === 429) return { ok: false, reason: 'rate-limited' };
    if (!response.ok) return { ok: false, reason: 'offline' };
    const data = (await response.json()) as ConciergeResponse;
    return isAnswer(data?.answer) ? { ok: true, data } : { ok: false, reason: 'offline' };
  } catch {
    return { ok: false, reason: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

function update(id: string, patch: Partial<ConciergeTurn>): void {
  conversationStore.set((state) => ({ ...state, turns: state.turns.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)) }));
}

/**
 * Ask a question. Resolves with the finished turn (for the live announcement). With `useServer`
 * false (no consent yet) the answer is put together on this device and nothing is sent.
 */
async function runAsk(question: string, lang: Lang, context: ConciergeContext, useServer: boolean, replaceId?: string): Promise<ConciergeTurn> {
  counter += 1;
  const id = replaceId ?? `turn-${Date.now().toString(36)}-${counter}`;
  inflight.add(id);
  const pending: ConciergeTurn = { id, question, status: 'pending', context };
  conversationStore.set((state) => ({
    ...state,
    turns: replaceId ? state.turns.map((turn) => (turn.id === id ? pending : turn)) : [...state.turns, pending].slice(-MAX_TURNS),
  }));
  let finished: ConciergeTurn;
  try {
    const result: ApiResult = useServer ? await askServer(question, lang, context) : { ok: false, reason: 'private' };
    if (result.ok) {
      finished = { ...pending, status: 'done', answer: result.data.answer, mode: result.data.mode };
    } else {
      const answer = await answerOnDevice(question, lang, context);
      finished = { ...pending, status: 'done', answer, mode: 'local', note: result.reason };
    }
  } catch {
    finished = { ...pending, status: 'error' };
  } finally {
    inflight.delete(id);
  }
  update(id, finished);
  const scope = finished.answer?.context;
  if (scope?.airport) conversationStore.set((state) => ({ ...state, scope: { airport: scope.airport, terminal: scope.terminal } }));
  return finished;
}

/* ---- the hook ----------------------------------------------------------------------------- */

export function useConcierge(lang: Lang) {
  const state = useStore(conversationStore);
  const consent = useStore(consentStore);
  const { selection } = useAirportContext();
  const { journey } = useSavedJourney();
  const savedFlight = journey.flights.at(-1);

  const scope = useMemo(() => state.scope ?? (selection ? { airport: selection.airport, terminal: selection.terminal } : {}), [state.scope, selection]);

  const contextFor = useCallback(
    (override?: ConciergeContext): ConciergeContext => {
      const last = [...state.turns].reverse().find((turn) => turn.answer)?.answer?.context;
      return {
        airport: override?.airport ?? scope.airport,
        terminal: override?.airport ? override.terminal : scope.terminal,
        intent: override?.intent ?? last?.intent,
        category: override?.category ?? last?.category,
        destination: override?.destination ?? last?.destination,
        // The saved flight is sent only with consent (B-15).
        flightId: consent && state.useFlight ? savedFlight?.id : undefined,
      };
    },
    [scope, state.turns, state.useFlight, savedFlight, consent],
  );

  const ask = useCallback((question: string, override?: ConciergeContext) => runAsk(question.trim(), lang, contextFor(override), consent), [lang, contextFor, consent]);
  const retry = useCallback(
    (turn: ConciergeTurn) => runAsk(turn.question, lang, consent ? (turn.context ?? contextFor()) : { ...(turn.context ?? contextFor()), flightId: undefined }, consent, turn.id),
    [lang, contextFor, consent],
  );
  const clear = useCallback(() => conversationStore.set((current) => ({ ...current, turns: [] })), []);
  const clearScope = useCallback(() => conversationStore.set((current) => ({ ...current, scope: {} })), []);
  const setUseFlight = useCallback((on: boolean) => conversationStore.set((current) => ({ ...current, useFlight: on })), []);
  const accept = useCallback(() => consentStore.set(true), []);
  /** Back to answers on this device only: forget the consent and stop including the saved flight. */
  const revoke = useCallback(() => {
    consentStore.set(false);
    conversationStore.set((current) => ({ ...current, useFlight: false }));
  }, []);

  return {
    turns: state.turns,
    busy: state.turns.some((turn) => turn.status === 'pending' && !isInterrupted(turn)),
    consent,
    accept,
    revoke,
    scope,
    clearScope,
    savedFlight,
    useFlight: consent && state.useFlight && savedFlight !== undefined,
    setUseFlight,
    ask,
    retry,
    clear,
  };
}
