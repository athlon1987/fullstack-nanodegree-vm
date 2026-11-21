/**
 * Aggregates Content Security Policy violation reports (security-07) so the report window can
 * show what the stricter policy would block, without storing anything about the visitor: only
 * counts per (directive, blocked resource kind, page path without query, first 40 characters of
 * the sample). Framework inline scripts (`self.__next_f…`) are counted under their own label, so
 * "only framework scripts" is a clear signal that the enforced policy can move to hashes and
 * nonces. In memory per process; read by authenticated monitoring through `/api/health`.
 */

export interface CspViolation {
  directive: string;
  blocked: string;
  page: string;
  sample: string;
}

/** Normalise one report body, in either format: `application/csp-report` or Reporting API. */
export function parseCspReports(body: unknown): CspViolation[] {
  const items: unknown[] = Array.isArray(body) ? body : [body];
  const violations: CspViolation[] = [];
  for (const item of items.slice(0, 50)) {
    if (typeof item !== 'object' || item === null) continue;
    const record = item as Record<string, unknown>;
    // Reporting API: { type: 'csp-violation', body: { effectiveDirective, blockedURL, documentURL, sample } }
    // report-uri:    { 'csp-report': { 'effective-directive', 'blocked-uri', 'document-uri', 'script-sample' } }
    const legacy = record['csp-report'];
    const raw = (record.type === 'csp-violation' ? record.body : legacy) as Record<string, unknown> | undefined;
    if (typeof raw !== 'object' || raw === null) continue;
    const text = (...keys: string[]) => {
      for (const key of keys) if (typeof raw[key] === 'string') return raw[key] as string;
      return '';
    };
    violations.push({
      directive: text('effectiveDirective', 'effective-directive', 'violated-directive').split(' ')[0].slice(0, 40) || 'unknown',
      blocked: blockedKind(text('blockedURL', 'blocked-uri')),
      page: pagePath(text('documentURL', 'document-uri')),
      sample: sampleLabel(text('sample', 'script-sample')),
    });
  }
  return violations;
}

/** `inline`, `eval`, `trusted-types-sink`, or the blocked origin; never a full URL. */
function blockedKind(value: string): string {
  if (!value || /^(inline|eval|wasm-eval|trusted-types-\w+)$/.test(value)) return value || 'unknown';
  try {
    return new URL(value).origin;
  } catch {
    return value.slice(0, 20);
  }
}

/** The page path only (no query or hash), and only the locale plus two segments. */
function pagePath(value: string): string {
  try {
    return new URL(value).pathname.split('/').slice(0, 4).join('/') || '/';
  } catch {
    return 'unknown';
  }
}

function sampleLabel(value: string): string {
  if (value.startsWith('self.__next_f') || value.startsWith('(self.__next_f')) return 'framework:flight-data';
  if (value.startsWith('$RC') || value.startsWith('$RS') || value.startsWith('$RX')) return 'framework:react-reveal';
  return value.slice(0, 40).replace(/[^\x20-\x7e]/g, '?');
}

export interface CspReportStore {
  add(violations: CspViolation[]): void;
  summary(): { total: number; groups: { key: string; count: number }[] };
}

/** Counts per group, keeping at most `maxGroups` (new groups beyond that are counted as `other`). */
export function createCspReportStore(maxGroups = 200): CspReportStore {
  const counts = new Map<string, number>();
  let total = 0;
  return {
    add(violations) {
      for (const violation of violations) {
        total += 1;
        const key = [violation.directive, violation.blocked, violation.page, violation.sample].join(' | ');
        const target = counts.has(key) || counts.size < maxGroups ? key : 'other';
        counts.set(target, (counts.get(target) ?? 0) + 1);
      }
    },
    summary() {
      return { total, groups: [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 50) };
    },
  };
}

const STORE_KEY = Symbol.for('malaysia-airports.csp-reports');

/** The process-wide report store, shared between the report route and `/api/health`. */
export function sharedCspReports(): CspReportStore {
  const holder = globalThis as typeof globalThis & { [STORE_KEY]?: CspReportStore };
  holder[STORE_KEY] ??= createCspReportStore();
  return holder[STORE_KEY];
}
