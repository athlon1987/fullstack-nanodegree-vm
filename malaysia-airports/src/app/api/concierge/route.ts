import { answerQuestion } from '@/lib/concierge/engine';
import { flightSourceFromProvider } from '@/lib/concierge/flights';
import { buildConciergeKnowledge } from '@/lib/concierge/knowledge.server';
import { createTokenBucket, clientKey } from '@/lib/concierge/rate-limit';
import { rephraseAnswer } from '@/lib/concierge/rephrase.server';
import { ConciergeRequestSchema } from '@/lib/concierge/request';
import type { ConciergeResponse } from '@/lib/concierge/types';
import { getFlightProvider } from '@/lib/providers';

/**
 * POST /api/concierge
 *
 * Body: `{ question, lang, airport?, terminal?, flightId?, intent?, category?, destination? }`
 * (see `ConciergeRequestSchema`). Answers `{ mode, answer }` where `mode` is `grounded`, or
 * `grounded-rephrased` when the server has `ANTHROPIC_API_KEY` and the AI wording passed the
 * fact guard. Errors: 400 invalid input, 413 body too large, 415 not JSON, 429 rate limited.
 *
 * Privacy: the question is never logged or stored. The client key used by the rate limiter is
 * kept in memory only. Pages never depend on this route: the browser falls back to running the
 * same engine locally.
 */

/** Ten questions in a burst, then one every six seconds per client. Placeholder: see rate-limit.ts. */
const bucket = createTokenBucket({ capacity: 10, refillPerSecond: 1 / 6 });
const MAX_BODY_BYTES = 4096;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  json({ error: { code, message, ...extra } }, status, headers);

export async function POST(request: Request) {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return error(415, 'unsupported_media_type', 'Send JSON with Content-Type: application/json.');
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return error(413, 'payload_too_large', 'The request body is too large.');

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return error(400, 'invalid_json', 'The request body is not valid JSON.');
  }
  const parsed = ConciergeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return error(400, 'invalid_request', 'The question or its context is not valid.', {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }

  // The clock is read only after the request, as the framework requires for dynamic handlers.
  const now = Date.now();
  const limit = bucket.take(clientKey(request.headers), now);
  if (!limit.allowed) {
    return error(429, 'rate_limited', 'Too many questions. Please wait a moment.', { retryAfterSeconds: limit.retryAfterSeconds }, { 'Retry-After': String(limit.retryAfterSeconds) });
  }

  const input = parsed.data;
  const knowledge = buildConciergeKnowledge(input.lang);
  const answer = answerQuestion(
    {
      question: input.question,
      lang: input.lang,
      context: {
        airport: input.airport,
        terminal: input.terminal,
        flightId: input.flightId,
        intent: input.intent,
        category: input.category,
        destination: input.destination,
      },
    },
    { knowledge, now, flights: flightSourceFromProvider(getFlightProvider(now)) },
  );

  let mode: ConciergeResponse['mode'] = 'grounded';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const text = await rephraseAnswer(answer, { apiKey, model: process.env.CONCIERGE_MODEL });
    if (text) {
      answer.text = text;
      mode = 'grounded-rephrased';
    }
  }

  const payload: ConciergeResponse = { mode, answer };
  return json(payload, 200, {
    'X-Data-Mode': answer.demo ? 'demo' : 'content',
    'X-RateLimit-Remaining': String(limit.remaining),
  });
}
