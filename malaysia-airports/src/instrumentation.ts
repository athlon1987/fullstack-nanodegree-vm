/**
 * Runs once when a server instance starts (Next.js instrumentation hook).
 *
 * Round 2 (verification issue 5): rate limits need to know where the real client address is
 * (`TRUSTED_CLIENT_IP_HEADER` or `TRUSTED_PROXY_HOPS`, docs/engineering/security.md section 4).
 * A production server without either still starts, with an untrusted per-address fallback and a
 * site-wide ceiling, but says so once, loudly, in its log. Not printed during `next build` or in
 * development.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build') return;
  const { trustConfigWarning } = await import('@/lib/concierge/rate-limit');
  const warning = trustConfigWarning(process.env);
  if (warning) console.warn(warning);
}
