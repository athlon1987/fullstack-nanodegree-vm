/**
 * A per-client token bucket kept in server memory.
 *
 * PLACEHOLDER: this protects a single server process during the prototype. It is not shared
 * between instances, resets on restart and trusts the forwarded client address. In production
 * the limit belongs at the API gateway or CDN (per client and per route, with a shared store),
 * and this bucket would only be a last line of defence.
 */
export interface TokenBucketOptions {
  /** Requests a client may make in a burst. */
  capacity: number;
  /** Tokens added back per second. */
  refillPerSecond: number;
  /** Clients remembered at most (oldest are forgotten first). */
  maxClients?: number;
}

export interface TakeResult {
  allowed: boolean;
  /** Whole tokens left after this request. */
  remaining: number;
  /** Seconds until one token is available again (0 when allowed). */
  retryAfterSeconds: number;
}

export interface TokenBucket {
  take(clientKey: string, nowMs: number): TakeResult;
}

export function createTokenBucket({ capacity, refillPerSecond, maxClients = 5000 }: TokenBucketOptions): TokenBucket {
  const buckets = new Map<string, { tokens: number; updated: number }>();
  return {
    take(clientKey, nowMs) {
      const previous = buckets.get(clientKey);
      const elapsed = previous ? Math.max(0, nowMs - previous.updated) / 1000 : 0;
      const tokens = previous ? Math.min(capacity, previous.tokens + elapsed * refillPerSecond) : capacity;
      // Re-insert so the Map keeps the most recently seen clients last.
      buckets.delete(clientKey);
      if (tokens < 1) {
        buckets.set(clientKey, { tokens, updated: nowMs });
        return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((1 - tokens) / refillPerSecond) };
      }
      buckets.set(clientKey, { tokens: tokens - 1, updated: nowMs });
      while (buckets.size > maxClients) {
        const oldest = buckets.keys().next().value;
        if (oldest === undefined) break;
        buckets.delete(oldest);
      }
      return { allowed: true, remaining: Math.floor(tokens - 1), retryAfterSeconds: 0 };
    },
  };
}

/** Best-effort client key from proxy headers. Never logged. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'anonymous';
}
