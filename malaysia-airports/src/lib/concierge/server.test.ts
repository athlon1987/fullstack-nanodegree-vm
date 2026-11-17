import { describe, expect, it, vi } from 'vitest';
import { checkGrounded, namesIn, numbersIn } from './fact-guard';
import { createTokenBucket, clientKey } from './rate-limit';
import { groundingReference, rephraseAnswer } from './rephrase.server';
import { ConciergeRequestSchema } from './request';
import type { ConciergeAnswer } from './types';

describe('token bucket', () => {
  it('allows a burst, then refills over time, per client', () => {
    const bucket = createTokenBucket({ capacity: 3, refillPerSecond: 1 });
    expect([1, 2, 3].map(() => bucket.take('a', 0).allowed)).toEqual([true, true, true]);
    const blocked = bucket.take('a', 0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
    expect(bucket.take('b', 0).allowed).toBe(true);
    expect(bucket.take('a', 1000).allowed).toBe(true);
  });

  it('forgets the oldest clients beyond its limit', () => {
    const bucket = createTokenBucket({ capacity: 1, refillPerSecond: 0.001, maxClients: 2 });
    bucket.take('a', 0);
    bucket.take('b', 0);
    bucket.take('c', 0);
    expect(bucket.take('a', 0).allowed).toBe(true);
  });

  it('reads the first forwarded address', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))).toBe('203.0.113.9');
    expect(clientKey(new Headers())).toBe('anonymous');
  });
});

describe('request schema', () => {
  it('accepts a question with context and rejects bad input', () => {
    expect(ConciergeRequestSchema.safeParse({ question: 'Where can I pray?', lang: 'en', airport: 'kul', terminal: 'T1', flightId: 'mh2610-20261117-d' }).success).toBe(true);
    expect(ConciergeRequestSchema.safeParse({ question: '   ', lang: 'en' }).success).toBe(false);
    expect(ConciergeRequestSchema.safeParse({ question: 'x'.repeat(401), lang: 'en' }).success).toBe(false);
    expect(ConciergeRequestSchema.safeParse({ question: 'hi', lang: 'fr' }).success).toBe(false);
    expect(ConciergeRequestSchema.safeParse({ question: 'hi', lang: 'en', airport: 'KUL1' }).success).toBe(false);
    expect(ConciergeRequestSchema.safeParse({ question: 'hi', lang: 'en', extra: 1 }).success).toBe(false);
  });
});

describe('fact guard', () => {
  it('finds numbers and mid-sentence names', () => {
    expect(numbersIn('RM 55.00 at 14:35, over 5,700 bays')).toEqual([55, 14, 35, 5700]);
    expect(namesIn('Take the Aerotrain to Satellite Building. Then relax')).toEqual(['Aerotrain', 'Satellite', 'Building']);
  });

  it('rejects text that adds a number or a name', () => {
    const reference = 'KLIA Ekspres to KL Sentral costs RM 55.';
    expect(checkGrounded('The KLIA Ekspres costs RM 55 to KL Sentral.', reference).ok).toBe(true);
    expect(checkGrounded('The KLIA Ekspres costs RM 45.', reference).unsupported).toEqual(['45']);
    expect(checkGrounded('Try the SkyBus to KL Sentral.', reference).unsupported).toEqual(['SkyBus']);
  });
});

const ANSWER: ConciergeAnswer = {
  lang: 'en',
  question: 'Cheapest way to KL Sentral?',
  intent: 'transport',
  text: 'Of the options to KL Sentral with a published fare, KLIA Ekspres is the lowest at RM 55.',
  statements: [{ text: 'KLIA Ekspres, KL Sentral: RM 55.', provenance: 'official', sourceIds: ['s1'] }],
  cards: [],
  actions: [],
  limits: [],
  sources: [],
  demo: false,
  translationFallback: false,
  context: { airport: 'kul', flightId: 'mh2610-20261117-d' },
};

function reply(text: string, stop = 'end_turn') {
  return vi.fn(async () => new Response(JSON.stringify({ stop_reason: stop, content: [{ type: 'text', text }] }), { status: 200 }));
}

describe('AI rewording', () => {
  it('sends only the question, the draft and the statements, with the current API conventions', async () => {
    const fetchImpl = reply('KLIA Ekspres is the cheapest published option to KL Sentral, at RM 55.');
    const text = await rephraseAnswer(ANSWER, { apiKey: 'test-key', fetchImpl });
    expect(text).toBe('KLIA Ekspres is the cheapest published option to KL Sentral, at RM 55.');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = init.headers as Record<string, string>;
    expect(headers['anthropic-version']).toBe('2026-10-21');
    expect(headers['x-api-key']).toBe('test-key');
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('claude-opus-5-5');
    expect(body).not.toHaveProperty('temperature');
    expect(String(init.body)).not.toContain('mh2610');
  });

  it('uses the configured model', async () => {
    const fetchImpl = reply('KLIA Ekspres is the lowest published fare to KL Sentral, RM 55.');
    await rephraseAnswer(ANSWER, { apiKey: 'k', model: 'claude-sonnet-5-5', fetchImpl });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).model).toBe('claude-sonnet-5-5');
  });

  it('keeps the grounded text when the model adds a fact, refuses, fails or times out', async () => {
    expect(await rephraseAnswer(ANSWER, { apiKey: 'k', fetchImpl: reply('The bus costs RM 12 to KL Sentral.') })).toBeNull();
    expect(await rephraseAnswer(ANSWER, { apiKey: 'k', fetchImpl: reply('No.', 'refusal') })).toBeNull();
    expect(await rephraseAnswer(ANSWER, { apiKey: 'k', fetchImpl: vi.fn(async () => new Response('{}', { status: 500 })) })).toBeNull();
    const hanging = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
    expect(await rephraseAnswer(ANSWER, { apiKey: 'k', timeoutMs: 20, fetchImpl: hanging as unknown as typeof fetch })).toBeNull();
  });

  it('builds its reference from the answer only', () => {
    expect(groundingReference(ANSWER)).toContain('RM 55');
  });
});
