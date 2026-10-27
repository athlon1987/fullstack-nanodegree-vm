// Local security & content audit log (ring buffer). On a device this is a diagnostic aid,
// not evidence: anyone with the device can edit it. The authoritative audit trail lives
// server-side in the planned backend (see backend/README.md).
import { safeGet, safeSet } from '../../utils/safeStorage';

export interface AuditEntry {
  t: number;
  actor: 'system' | 'player' | 'studio';
  action: string;
  target?: string;
  detail?: string;
  level: 'info' | 'warn' | 'error';
}

const KEY = 'pockethood.audit';
const MAX = 300;
let entries: AuditEntry[] | null = null;
const listeners = new Set<() => void>();

function load(): AuditEntry[] {
  if (entries) return entries;
  try {
    const raw = safeGet(KEY);
    const parsed = raw ? (JSON.parse(raw) as AuditEntry[]) : [];
    entries = Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    entries = [];
  }
  return entries;
}

export function audit(e: Omit<AuditEntry, 't' | 'level'> & { level?: AuditEntry['level']; t?: number }) {
  const list = load();
  // Never log free text that could carry personal data: details are system-generated only.
  list.unshift({ level: 'info', t: Date.now(), ...e, detail: e.detail?.slice(0, 300) });
  if (list.length > MAX) list.length = MAX;
  safeSet(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

export const auditLog = () => load();
export function onAudit(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function clearAudit() {
  entries = [];
  safeSet(KEY, '[]');
  listeners.forEach((l) => l());
}
