/**
 * Request limits for the whole site (the concierge first, then every API route and the dynamic
 * pages through `src/proxy.ts`), plus the spending budget for the optional AI wording.
 *
 * Three parts, each behind an interface so a shared store can replace the in-memory one:
 *  - `RateLimitStore`: token buckets keyed by client and route. `createTokenBucket` is the
 *    in-memory store; with several server instances, implement the same interface over a shared
 *    store (Redis, the CDN's rate-limit API) and pass it in. Limits belong at the edge first
 *    (docs/engineering/security.md, section 4; docs/engineering/edge/): this is the last line.
 *  - `clientKey`: the client address from a TRUSTED source only (security-02). A visitor can put
 *    anything in `X-Forwarded-For`, so the first entry is never used. Deployments say where the
 *    real address is: `TRUSTED_CLIENT_IP_HEADER` (a header the CDN overwrites, such as
 *    `cf-connecting-ip`) or `TRUSTED_PROXY_HOPS` (how many proxies of ours append to
 *    `X-Forwarded-For`; the client is that many entries from the right). With neither set,
 *    `limitKey` falls back to the address nearest the server (round 2: the last `X-Forwarded-For`
 *    entry, which `next start` fills from the socket when nothing in front of it does), marked
 *    untrusted, and every untrusted key also draws on one site-wide ceiling per route group
 *    (`UNTRUSTED_CEILING_FACTOR` times the per-client limit). Visitors are then not throttled
 *    together, and a client that invents addresses is still bounded (spend and load stay capped).
 *    `src/instrumentation.ts` warns at start-up in production when neither variable is set.
 *  - `ModelBudget`: a site-wide budget of paid model calls per minute, per day and per month,
 *    with a circuit breaker that stops calling the model after repeated failures.
 *
 * Nothing here is logged: keys live in memory only and are forgotten oldest first.
 */

/* ---- Token buckets ------------------------------------------------------------------------- */

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

/**
 * Where bucket state lives. The in-memory store answers synchronously; a shared store (Redis,
 * an edge key-value store) may answer with a promise, so callers always `await` the result.
 */
export interface RateLimitStore {
  take(clientKey: string, nowMs: number): TakeResult | Promise<TakeResult>;
}

/** The in-memory `RateLimitStore`: synchronous, per server process. */
export interface TokenBucket extends RateLimitStore {
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

/* ---- Client identity ------------------------------------------------------------------------ */

/** Where the real client address comes from. Read from the environment by `trustConfigFromEnv`. */
export interface ClientTrustConfig {
  /** A header the CDN or load balancer sets and overwrites, e.g. `cf-connecting-ip`. */
  clientIpHeader?: string;
  /** Proxies of ours that append to `X-Forwarded-For` (0 = none, so the header is not trusted). */
  trustedProxyHops: number;
}

/** The key every client shares while no trusted source is configured. */
export const UNIDENTIFIED_CLIENT = 'unidentified';

const ADDRESS = /^[0-9a-f.:[\]]{2,64}$/i;

export function trustConfigFromEnv(env: Record<string, string | undefined> = process.env): ClientTrustConfig {
  const header = env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  const hops = Number.parseInt(env.TRUSTED_PROXY_HOPS ?? '', 10);
  return {
    clientIpHeader: header && /^[a-z0-9-]{1,64}$/.test(header) ? header : undefined,
    trustedProxyHops: Number.isInteger(hops) && hops > 0 && hops < 10 ? hops : 0,
  };
}

/**
 * The client key from a trusted source only, never the first `X-Forwarded-For` entry. Never
 * logged. Values that are not an IP address shape are ignored.
 */
export function clientKey(headers: Headers, config: ClientTrustConfig = trustConfigFromEnv()): string {
  if (config.clientIpHeader) {
    const value = headers.get(config.clientIpHeader)?.split(',')[0]?.trim();
    return value && ADDRESS.test(value) ? value : UNIDENTIFIED_CLIENT;
  }
  if (config.trustedProxyHops > 0) {
    const entries = (headers.get('x-forwarded-for') ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
    const value = entries[entries.length - config.trustedProxyHops];
    return value && ADDRESS.test(value) ? value : UNIDENTIFIED_CLIENT;
  }
  return UNIDENTIFIED_CLIENT;
}

/** A rate-limit key and whether it comes from a configured, trusted source. */
export interface LimitKey {
  key: string;
  trusted: boolean;
}

/**
 * The key the limiters use (round 2, verification issue 5). With a trusted source configured it
 * is `clientKey`. Without one, it is the LAST `X-Forwarded-For` entry (the address nearest this
 * server: a proxy of ours, or the socket address `next start` adds when the request has no such
 * header), prefixed `untrusted:`. A visitor who sends the header directly can choose that value,
 * so untrusted keys are also counted against a site-wide ceiling (`createRouteLimiter`).
 */
export function limitKey(headers: Headers, config: ClientTrustConfig = trustConfigFromEnv()): LimitKey {
  if (isTrustConfigured(config)) return { key: clientKey(headers, config), trusted: true };
  const entries = (headers.get('x-forwarded-for') ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
  const nearest = entries[entries.length - 1];
  return { key: nearest && ADDRESS.test(nearest) ? `untrusted:${nearest}` : UNIDENTIFIED_CLIENT, trusted: false };
}

/** True when the deployment says where the real client address is. */
export function isTrustConfigured(config: ClientTrustConfig): boolean {
  return Boolean(config.clientIpHeader) || config.trustedProxyHops > 0;
}

/**
 * The start-up warning for a production server whose client address source is missing or
 * unreadable, or `null` when the configuration is complete. Printed by `src/instrumentation.ts`.
 */
export function trustConfigWarning(env: Record<string, string | undefined> = process.env): string | null {
  const config = trustConfigFromEnv(env);
  const badHeader = Boolean(env.TRUSTED_CLIENT_IP_HEADER?.trim()) && !config.clientIpHeader;
  const badHops = Boolean(env.TRUSTED_PROXY_HOPS?.trim()) && config.trustedProxyHops === 0;
  if (isTrustConfigured(config) && !badHeader && !badHops) return null;
  const problem = badHeader || badHops
    ? `${badHeader ? 'TRUSTED_CLIENT_IP_HEADER is not a valid header name' : ''}${badHeader && badHops ? '; ' : ''}${badHops ? 'TRUSTED_PROXY_HOPS is not a whole number from 1 to 9' : ''}, so it is ignored`
    : 'neither TRUSTED_CLIENT_IP_HEADER nor TRUSTED_PROXY_HOPS is set';
  const fallback = isTrustConfigured(config)
    ? 'The other setting is used.'
    : `Rate limits fall back to the address nearest this server (the last X-Forwarded-For entry), which a client can forge, with a site-wide ceiling of ${UNTRUSTED_CEILING_FACTOR} times each per-client limit. Behind a CDN or load balancer every visitor may then share a few addresses.`;
  return `[rate-limit] Client address source: ${problem}. ${fallback} Set TRUSTED_CLIENT_IP_HEADER (a header your CDN overwrites, such as cf-connecting-ip) or TRUSTED_PROXY_HOPS (how many of your proxies append to X-Forwarded-For). See docs/engineering/security.md, section 4.`;
}

/* ---- Per-route limits ----------------------------------------------------------------------- */

/** A named limit for a group of routes. */
export interface RoutePolicy {
  name: string;
  capacity: number;
  refillPerSecond: number;
}

/**
 * Limits per route group, applied by `src/proxy.ts` (the concierge applies its own, stricter one
 * in its route because the proxy must not buffer its body). The edge rules in
 * docs/engineering/edge/ use the same numbers.
 */
export const ROUTE_POLICIES = {
  /** Board refreshes every 30 s; 60 in a burst, then one a second. */
  flights: { name: 'flights', capacity: 60, refillPerSecond: 1 },
  /** Monitoring checks: 10 in a burst, then one every 6 s per client. */
  health: { name: 'health', capacity: 10, refillPerSecond: 1 / 6 },
  /** Browser reports (CSP violations, aggregate measurement). */
  reports: { name: 'reports', capacity: 30, refillPerSecond: 0.5 },
  /** Any other API path, including unknown ones (they answer 404). */
  api: { name: 'api', capacity: 60, refillPerSecond: 1 },
  /** Pages and handlers rendered per request: flight pages, the board feed, journey content. */
  dynamic: { name: 'dynamic', capacity: 60, refillPerSecond: 1 },
} as const satisfies Record<string, RoutePolicy>;

export type RoutePolicyName = keyof typeof ROUTE_POLICIES;

const FLIGHT_PAGE = /^\/(?:en|ms)\/[a-z]{3}\/flights\/[^/]+\/?$/;
const JOURNEY_CONTENT = /^\/(?:en|ms)\/journey\/content\/[^/]+\/?$/;
/** Several airports' boards in one request (round 2, the home flight search). */
const NETWORK_FEED = /^\/(?:en|ms)\/flights\/feed\/?$/;

/** The policy for a path, or `undefined` for paths that are not limited here (static pages, the concierge). */
export function policyFor(pathname: string): RoutePolicyName | undefined {
  if (pathname === '/api/concierge' || pathname.startsWith('/api/concierge/')) return undefined;
  if (pathname === '/api/flights' || pathname.startsWith('/api/flights/')) return 'flights';
  if (pathname === '/api/health') return 'health';
  if (pathname === '/api/csp-report' || pathname === '/api/metrics') return 'reports';
  if (pathname === '/api' || pathname.startsWith('/api/')) return 'api';
  if (FLIGHT_PAGE.test(pathname) || JOURNEY_CONTENT.test(pathname) || NETWORK_FEED.test(pathname)) return 'dynamic';
  return undefined;
}

/**
 * Without a trusted address source, all untrusted keys of a route group together may use this
 * many times one client's limit (for flights: 600 in a burst, then 10 a second, site-wide).
 */
export const UNTRUSTED_CEILING_FACTOR = 10;

/** The key of the site-wide ceiling bucket for untrusted keys. */
const CEILING_KEY = '*untrusted*';

/** The ceiling policy for a route group: `UNTRUSTED_CEILING_FACTOR` times its per-client limit. */
export function ceilingPolicy(policy: RoutePolicy): RoutePolicy {
  return { name: `${policy.name}-ceiling`, capacity: policy.capacity * UNTRUSTED_CEILING_FACTOR, refillPerSecond: policy.refillPerSecond * UNTRUSTED_CEILING_FACTOR };
}

/**
 * One store per policy. Pass a factory to back them with a shared store. A `LimitKey` that is not
 * trusted also draws on the route group's site-wide ceiling (`ceilingPolicy`); a plain string key
 * is treated as trusted.
 */
export function createRouteLimiter(factory: (policy: RoutePolicy) => RateLimitStore = (policy) => createTokenBucket(policy)) {
  const stores = new Map<string, RateLimitStore>();
  const storeFor = (policy: RoutePolicy) => {
    let store = stores.get(policy.name);
    if (!store) {
      store = factory(policy);
      stores.set(policy.name, store);
    }
    return store;
  };
  return {
    async take(name: RoutePolicyName, key: string | LimitKey, nowMs: number): Promise<TakeResult> {
      const { key: id, trusted } = typeof key === 'string' ? { key, trusted: true } : key;
      const policy = ROUTE_POLICIES[name];
      const own = await storeFor(policy).take(`${name}:${id}`, nowMs);
      if (!own.allowed || trusted) return own;
      const ceiling = await storeFor(ceilingPolicy(policy)).take(`${name}:${CEILING_KEY}`, nowMs);
      return ceiling.allowed ? own : ceiling;
    },
  };
}

/** Headers and JSON body of a 429 answer. */
export function tooManyRequests(result: TakeResult): Response {
  return Response.json(
    { error: { code: 'rate_limited', message: 'Too many requests. Please wait a moment.', retryAfterSeconds: result.retryAfterSeconds } },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds), 'Cache-Control': 'no-store' } },
  );
}

/* ---- Model spending budget ------------------------------------------------------------------ */

export interface ModelBudgetOptions {
  /** Site-wide model calls per minute. */
  perMinute: number;
  /** Site-wide model calls per day (UTC). */
  perDay: number;
  /** Site-wide model calls per month (UTC). */
  perMonth: number;
  /** Consecutive failures that open the circuit. */
  failureThreshold: number;
  /** How long the circuit stays open before one trial call. */
  coolDownMs: number;
}

export interface ModelBudgetCounters {
  minute: number;
  day: number;
  month: number;
  calls: number;
  successes: number;
  failures: number;
  refusedByBudget: number;
  refusedByCircuit: number;
  circuit: 'closed' | 'open' | 'half-open';
}

export interface ModelBudget {
  /** May a model call start now? Counts it when it may. */
  tryAcquire(nowMs: number): boolean;
  /** Report how the call went (a fact-guard rejection is not a failure of the model). */
  record(ok: boolean, nowMs: number): void;
  counters(): ModelBudgetCounters;
}

/** The defaults: about 10 % of the daily cap could go in one hour at most. */
export const DEFAULT_MODEL_BUDGET: ModelBudgetOptions = { perMinute: 30, perDay: 2000, perMonth: 40000, failureThreshold: 5, coolDownMs: 60_000 };

/** Read caps from `CONCIERGE_MAX_CALLS_PER_MINUTE`, `_PER_DAY` and `_PER_MONTH`, falling back to the defaults. */
export function modelBudgetFromEnv(env: Record<string, string | undefined> = process.env): ModelBudgetOptions {
  const read = (name: string, fallback: number) => {
    const value = Number.parseInt(env[name] ?? '', 10);
    return Number.isInteger(value) && value >= 0 ? value : fallback;
  };
  return {
    ...DEFAULT_MODEL_BUDGET,
    perMinute: read('CONCIERGE_MAX_CALLS_PER_MINUTE', DEFAULT_MODEL_BUDGET.perMinute),
    perDay: read('CONCIERGE_MAX_CALLS_PER_DAY', DEFAULT_MODEL_BUDGET.perDay),
    perMonth: read('CONCIERGE_MAX_CALLS_PER_MONTH', DEFAULT_MODEL_BUDGET.perMonth),
  };
}

/** In-memory budget for one process. With several instances, back the counters with a shared store. */
export function createModelBudget(options: ModelBudgetOptions): ModelBudget {
  const windows = { minute: { key: '', count: 0 }, day: { key: '', count: 0 }, month: { key: '', count: 0 } };
  const totals = { calls: 0, successes: 0, failures: 0, refusedByBudget: 0, refusedByCircuit: 0 };
  let consecutiveFailures = 0;
  let openedAt: number | null = null;
  let trialInFlight = false;

  const roll = (nowMs: number) => {
    const iso = new Date(nowMs).toISOString();
    const keys = { minute: iso.slice(0, 16), day: iso.slice(0, 10), month: iso.slice(0, 7) };
    for (const name of ['minute', 'day', 'month'] as const) {
      if (windows[name].key !== keys[name]) windows[name] = { key: keys[name], count: 0 };
    }
  };

  const circuit = (nowMs: number): ModelBudgetCounters['circuit'] => {
    if (openedAt === null) return 'closed';
    return nowMs - openedAt >= options.coolDownMs ? 'half-open' : 'open';
  };

  return {
    tryAcquire(nowMs) {
      roll(nowMs);
      const state = circuit(nowMs);
      if (state === 'open' || (state === 'half-open' && trialInFlight)) {
        totals.refusedByCircuit += 1;
        return false;
      }
      if (windows.minute.count >= options.perMinute || windows.day.count >= options.perDay || windows.month.count >= options.perMonth) {
        totals.refusedByBudget += 1;
        return false;
      }
      if (state === 'half-open') trialInFlight = true;
      windows.minute.count += 1;
      windows.day.count += 1;
      windows.month.count += 1;
      totals.calls += 1;
      return true;
    },
    record(ok, nowMs) {
      trialInFlight = false;
      if (ok) {
        totals.successes += 1;
        consecutiveFailures = 0;
        openedAt = null;
        return;
      }
      totals.failures += 1;
      consecutiveFailures += 1;
      if (consecutiveFailures >= options.failureThreshold || openedAt !== null) openedAt = nowMs;
    },
    counters() {
      return {
        minute: windows.minute.count,
        day: windows.day.count,
        month: windows.month.count,
        ...totals,
        circuit: openedAt === null ? 'closed' : trialInFlight ? 'half-open' : 'open',
      };
    },
  };
}

const BUDGET_KEY = Symbol.for('malaysia-airports.model-budget');

/**
 * The process-wide model budget. Kept on `globalThis` because each route is bundled separately
 * and would otherwise hold its own copy: the concierge spends it and `/api/health` reports it to
 * authenticated monitoring.
 */
export function sharedModelBudget(): ModelBudget {
  const holder = globalThis as typeof globalThis & { [BUDGET_KEY]?: ModelBudget };
  holder[BUDGET_KEY] ??= createModelBudget(modelBudgetFromEnv());
  return holder[BUDGET_KEY];
}
