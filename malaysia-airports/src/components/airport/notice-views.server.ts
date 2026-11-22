/**
 * Server-side: turn content-layer notices into `NoticeView`s for one language.
 * Imports `@/content`, so never import this file from a Client Component.
 */
import { getAirport, hasTranslation, localizeAirport, pick, resolveSources, terminalLabel, type Lang, type Notice } from '@/content';
import type { NoticeView } from './notice-utils';

/** Where a notice applies: "KLIA Terminal 1", "Penang", or undefined for the whole network. */
function scopeOf(notice: Notice, lang: Lang): string | undefined {
  const airport = notice.airport ? getAirport(notice.airport) : undefined;
  if (!airport) return undefined;
  return notice.terminal ? terminalLabel(airport, notice.terminal, lang) : localizeAirport(airport, lang).shortName;
}

/**
 * Localise notices for the UI.
 *
 * @param detail `full` adds the body and the resolved sources (notices page, airport page);
 *               `compact` leaves them out (the first screen of the home page).
 */
export function toNoticeViews(notices: readonly Notice[], lang: Lang, detail: 'full' | 'compact' = 'full'): NoticeView[] {
  return notices.map((notice) => ({
    id: notice.id,
    ...(notice.airport ? { airport: notice.airport } : {}),
    ...(notice.terminal ? { terminal: notice.terminal } : {}),
    ...(scopeOf(notice, lang) ? { scope: scopeOf(notice, lang) } : {}),
    severity: notice.severity,
    title: pick(notice.title, lang),
    provenance: notice.provenance,
    ...(notice.validFrom ? { validFrom: notice.validFrom } : {}),
    ...(notice.validTo ? { validTo: notice.validTo } : {}),
    ...(notice.appliesFrom ? { appliesFrom: notice.appliesFrom } : {}),
    translated: hasTranslation(notice.title, lang) && hasTranslation(notice.body, lang),
    ...(detail === 'full' ? { body: pick(notice.body, lang), sources: resolveSources(notice.sources) } : {}),
  }));
}
