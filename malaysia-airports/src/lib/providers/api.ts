/**
 * Request handling for the integration-layer route handlers (`/api/flights`, `/api/health`),
 * kept here as pure functions of (input, now) so they can be unit-tested without a server.
 * The route files only read the request, read the clock, and call these.
 */
import { z } from 'zod';
import { getAirport } from '@/content/airports';
import { TERMINAL_IDS } from '@/content/types';
import type { Flight } from '@/lib/flights/types';
import { isDateKey, toIsoWithOffset } from '@/lib/time';
import { DemoFlightProvider } from './demo-flights';
import { DemoParkingAvailabilityProvider, DemoWaitTimeProvider } from './demo-operations';
import { hasDemoRoutes } from './demo-routes';
import type { ProviderMeta, ProviderMode } from './types';
import packageJson from '../../../package.json';

/** Default number of flights returned by `/api/flights`. */
export const FLIGHTS_DEFAULT_LIMIT = 50;
/** Largest number of flights `/api/flights` will return, whatever `limit` asks for. */
export const FLIGHTS_MAX_LIMIT = 200;

const FlightsQuerySchema = z.object({
  airport: z
    .string({ error: 'airport is required, for example airport=kul' })
    .trim()
    .min(1, 'airport is required, for example airport=kul')
    .max(8)
    .refine((value) => getAirport(value) !== undefined, 'Unknown airport'),
  direction: z.enum(['d', 'a'], { error: 'direction must be d (departures) or a (arrivals)' }).default('d'),
  q: z.string().trim().max(80, 'q is too long').optional(),
  terminal: z.enum(TERMINAL_IDS, { error: 'terminal must be T1, T2 or MAIN' }).optional(),
  date: z.string().refine(isDateKey, 'date must be YYYY-MM-DD').optional(),
  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int('limit must be a whole number')
    .min(1, 'limit must be at least 1')
    .default(FLIGHTS_DEFAULT_LIMIT)
    .transform((value) => Math.min(value, FLIGHTS_MAX_LIMIT)),
});

/** Successful body of `GET /api/flights`. */
export interface FlightsApiResponse {
  meta: ProviderMeta;
  /** The query as understood, after defaults and the limit cap. */
  query: { airport: string; direction: 'd' | 'a'; terminal?: string; q?: string; date?: string; limit: number };
  count: number;
  flights: Flight[];
}

/** Error body shared by the API routes. */
export interface ApiErrorResponse {
  error: { code: 'invalid_request'; message: string; issues: { field: string; message: string }[] };
}

/** Status and JSON body for a response. */
export interface ApiResult<T> {
  status: number;
  body: T | ApiErrorResponse;
}

/**
 * Handle `GET /api/flights?airport=kul&direction=d&q=&terminal=&limit=&date=`.
 * Empty parameters are treated as absent. `limit` is capped at `FLIGHTS_MAX_LIMIT`.
 */
export function handleFlightsQuery(searchParams: URLSearchParams, now: Date): ApiResult<FlightsApiResponse> {
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value.trim() !== '' && !(key in raw)) raw[key] = value;
  }
  const parsed = FlightsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: {
          code: 'invalid_request',
          message: 'Check the query parameters and try again.',
          issues: parsed.error.issues.map((issue) => ({ field: issue.path.join('.') || 'query', message: issue.message })),
        },
      },
    };
  }

  const input = parsed.data;
  const airport = getAirport(input.airport);
  if (!airport) {
    return { status: 400, body: { error: { code: 'invalid_request', message: 'Unknown airport.', issues: [{ field: 'airport', message: 'Unknown airport' }] } } };
  }
  if (input.terminal && !airport.terminals.some((terminal) => terminal.id === input.terminal)) {
    return {
      status: 400,
      body: {
        error: {
          code: 'invalid_request',
          message: 'That airport has no such terminal.',
          issues: [{ field: 'terminal', message: `${airport.code} has terminals: ${airport.terminals.map((terminal) => terminal.id).join(', ')}` }],
        },
      },
    };
  }

  const provider = new DemoFlightProvider(now);
  const flights = provider.listFlightsSync({
    airport: airport.slug,
    direction: input.direction,
    terminal: input.terminal,
    q: input.q,
    date: input.date,
    limit: input.limit,
  });

  const query: FlightsApiResponse['query'] = { airport: airport.slug, direction: input.direction, limit: input.limit };
  if (input.terminal) query.terminal = input.terminal;
  if (input.q) query.q = input.q;
  if (input.date) query.date = input.date;

  return { status: 200, body: { meta: provider.meta(), query, count: flights.length, flights } };
}

/** Body of `GET /api/health`. */
export interface HealthResponse {
  status: 'ok';
  /** Server time, ISO with the Malaysian offset. */
  time: string;
  /** Mode of each data provider. Everything is `demo` in this prototype. */
  providers: Record<'flights' | 'waitTimes' | 'parkingAvailability', { mode: ProviderMode; source: string; refreshSeconds: number }>;
  /** How many airports have demo flight boards. */
  demoAirports: number;
  build: { name: string; version: string; environment: string; node: string; commit: string | null };
  notice: string;
}

/** Build the health payload for an instant. */
export function buildHealth(now: Date, env: Record<string, string | undefined> = {}): HealthResponse {
  const describe = (meta: ProviderMeta): { mode: ProviderMode; source: string; refreshSeconds: number } => ({
    mode: meta.mode,
    source: meta.source,
    refreshSeconds: meta.refreshSeconds,
  });
  return {
    status: 'ok',
    time: toIsoWithOffset(now),
    providers: {
      flights: describe(new DemoFlightProvider(now).meta()),
      waitTimes: describe(new DemoWaitTimeProvider(now).meta()),
      parkingAvailability: describe(new DemoParkingAvailabilityProvider(now).meta()),
    },
    demoAirports: ['kul', 'pen', 'bki', 'kch', 'lgk', 'szb'].filter(hasDemoRoutes).length,
    build: {
      name: packageJson.name,
      version: packageJson.version,
      environment: env.NODE_ENV ?? 'development',
      node: env.NODE_VERSION ?? (typeof process !== 'undefined' ? process.version : 'unknown'),
      commit: env.VERCEL_GIT_COMMIT_SHA ?? env.GIT_COMMIT ?? null,
    },
    notice: 'Independent concept prototype. All operational data is simulated and labelled as demonstration data.',
  };
}
