import { answerQuestion } from '@/lib/concierge/engine';
import { flightSourceFromProvider } from '@/lib/concierge/flights';
import { buildConciergeKnowledge } from '@/lib/concierge/knowledge.server';
import { clientKey, createTokenBucket, sharedModelBudget, type RateLimitStore } from '@/lib/concierge/rate-limit';
import { rephraseAnswer } from '@/lib/concierge/rephrase.server';
import { ConciergeRequestSchema, isJsonMediaType, isSameOriginRequest, readBodyWithLimit, siteOrigins } from '@/lib/concierge/request';
import type { ConciergeResponse } from '@/lib/concierge/types';
import { getFlightProvider } from '@/lib/providers';

/**
 * POST /api/concierge
 *
 * Body: `{ question, lang, airport?, terminal?, flightId?, intent?, category?, destination? }`
 * (see `ConciergeRequestSchema`). Answers `{ mode, answer }` where `mode` is `grounded`, or
 * `grounded-rephrased` when the server has `ANTHROPIC_API_KEY` and the AI wording passed the
 * fact guard. Errors: 400 invalid input, 403 not from this site, 413 body too large, 415 not
 * JSON, 429 rate limited.
 *
 * Order of checks (security-01 to security-03): the exact JSON media type (a cross-site form or
 * no-cors fetch cannot send it without a preflight), then the browser's `Sec-Fetch-Site` and
 * `Origin` (other sites are refused before anything is counted), then the per-client limit (every
 * request that gets this far counts, valid or not), then the body: a declared length over 4 KB is
 * refused unread and an undeclared one is read as a stream and cut off at 4 KB.
 *
 * Privacy: the question is never logged or stored. The client key used by the rate limiter is
 * kept in memory only. Pages never depend on this route: the browser falls back to running the
 * same engine locally.
 */

/**
 * Ten questions in a burst, then one every six seconds per client (keyed on a trusted address
 * only: see rate-limit.ts). In memory here; a shared `RateLimitStore` replaces it with several
 * instances.
 */
const bucket: RateLimitStore = createTokenBucket({ capacity: 10, refillPerSecond: 1 / 6 });

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  json({ error: { code, message, ...extra } }, status, headers);

export async function POST(request: Request) {
  if (!isJsonMediaType(request.headers.get('content-type'))) {
    await request.body?.cancel().catch(() => undefined);
    return error(415, 'unsupported_media_type', 'Send JSON with Content-Type: application/json.');
  }
  if (!isSameOriginRequest(request.headers, siteOrigins(request.url, request.headers))) {
    await request.body?.cancel().catch(() => undefined);
    return error(403, 'forbidden_origin', 'Questions can only be sent from this website.');
  }

  // The clock is read only after the request, as the framework requires for dynamic handlers.
  const now = Date.now();
  const limit = await bucket.take(clientKey(request.headers), now);
  const limitHeaders = { 'X-RateLimit-Remaining': String(limit.remaining) };
  if (!limit.allowed) {
    await request.body?.cancel().catch(() => undefined);
    return error(429, 'rate_limited', 'Too many questions. Please wait a moment.', { retryAfterSeconds: limit.retryAfterSeconds }, { 'Retry-After': String(limit.retryAfterSeconds), ...limitHeaders });
  }

  const raw = await readBodyWithLimit(request);
  if (!raw.ok) {
    return raw.reason === 'too_large'
      ? error(413, 'payload_too_large', 'The request body is too large.', {}, limitHeaders)
      : error(400, 'invalid_json', 'The request body is not valid UTF-8 JSON.', {}, limitHeaders);
  }
  let body: unknown;
  try {
    body = JSON.parse(raw.text);
  } catch {
    return error(400, 'invalid_json', 'The request body is not valid JSON.', {}, limitHeaders);
  }
  const parsed = ConciergeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return error(
      400,
      'invalid_request',
      'The question or its context is not valid.',
      { issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) },
      limitHeaders,
    );
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
    const text = await rephraseAnswer(answer, { apiKey, model: process.env.CONCIERGE_MODEL, budget: sharedModelBudget(), nowMs: now });
    if (text) {
      answer.text = text;
      mode = 'grounded-rephrased';
    }
  }

  const payload: ConciergeResponse = { mode, answer };
  return json(payload, 200, {
    'X-Data-Mode': answer.demo ? 'demo' : 'content',
    ...limitHeaders,
  });
}
