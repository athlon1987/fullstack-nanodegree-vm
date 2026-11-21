/**
 * The `/api/concierge` request contract, validated with zod on the server.
 */
import { z } from 'zod';
import { FACILITY_CATEGORIES, LANGS, TERMINAL_IDS } from '@/content/values';
import { CONCIERGE_MAX_QUESTION } from './constants';
import { CONCIERGE_INTENTS } from './types';

export const ConciergeRequestSchema = z.strictObject({
  question: z.string().trim().min(1).max(CONCIERGE_MAX_QUESTION),
  lang: z.enum(LANGS),
  /** Airport slug the visitor is asking about (their remembered choice or the last answer's). */
  airport: z.string().regex(/^[a-z]{3}$/).optional(),
  terminal: z.enum(TERMINAL_IDS).optional(),
  /** A saved flight id, sent only when the visitor switched "include my saved flight" on. */
  flightId: z.string().regex(/^[a-z0-9]{2,3}\d{1,4}[a-z]?-\d{8}-[da]$/).optional(),
  /** Previous intent and slots, for follow-up questions. */
  intent: z.enum(CONCIERGE_INTENTS).optional(),
  category: z.enum(FACILITY_CATEGORIES).optional(),
  destination: z.string().max(80).optional(),
});

export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;

/* ---- Transport checks (security-01, security-03) ------------------------------------------- */

/** Largest request body the concierge reads, in bytes. */
export const MAX_BODY_BYTES = 4096;

/**
 * True only for the exact `application/json` media type (an optional `charset=utf-8` is allowed).
 * `text/plain;x=application/json` is what a cross-site form or no-cors fetch can send without a
 * preflight, so a substring test is not enough.
 */
export function isJsonMediaType(contentType: string | null): boolean {
  if (!contentType) return false;
  const [type, ...params] = contentType.split(';').map((part) => part.trim().toLowerCase());
  if (type !== 'application/json') return false;
  return params.every((param) => param === '' || /^charset="?utf-8"?$/.test(param));
}

/**
 * Is this request from a page of this site? Browsers send `Sec-Fetch-Site` and `Origin` with every
 * POST; a request that says `cross-site` or `same-site`, or whose `Origin` is not one of ours, is
 * refused. Requests without either header (curl, server-to-server) are not browser requests and
 * cannot ride on a visitor's browser, so they pass to the rate limit.
 */
export function isSameOriginRequest(headers: Headers, allowedOrigins: readonly string[]): boolean {
  const site = headers.get('sec-fetch-site')?.toLowerCase();
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = headers.get('origin');
  if (origin === null) return true;
  return allowedOrigins.includes(origin.toLowerCase());
}

/**
 * The origins this site answers to: the configured public URL and the origin the request was
 * addressed to (the `Host` a browser sends cannot be set by another site's script).
 */
export function siteOrigins(requestUrl: string, headers: Headers, siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string[] {
  const origins = new Set<string>();
  const add = (value: string | undefined | null) => {
    if (!value) return;
    try {
      origins.add(new URL(value).origin.toLowerCase());
    } catch {
      // Not a URL: ignore.
    }
  };
  add(siteUrl);
  add(requestUrl);
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  const proto = headers.get('x-forwarded-proto') ?? new URL(requestUrl).protocol.replace(':', '');
  if (host && /^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host) && (proto === 'http' || proto === 'https')) add(`${proto}://${host}`);
  return [...origins];
}

export type BodyResult = { ok: true; text: string } | { ok: false; reason: 'too_large' | 'invalid_encoding' };

/**
 * Read a request body as UTF-8 text without ever holding more than `limit` bytes: a declared
 * `Content-Length` over the limit is refused before reading, and a body without one is read as a
 * stream with a byte counter and cancelled as soon as it passes the limit.
 */
export async function readBodyWithLimit(request: Request, limit = MAX_BODY_BYTES): Promise<BodyResult> {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared.trim()) || Number(declared) > limit)) {
    await request.body?.cancel().catch(() => undefined);
    return { ok: false, reason: 'too_large' };
  }
  if (!request.body) return { ok: true, text: '' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, reason: 'too_large' };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, reason: 'invalid_encoding' };
  }
}
