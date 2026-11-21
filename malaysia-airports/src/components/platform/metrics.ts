/**
 * The aggregate measurement contract shared by the browser (`analytics.ts`) and the server
 * (`/api/metrics`), with no browser or server globals (exec-commerce-12).
 *
 * What is measured, and only this: whether a top task was answered on the page the visitor
 * reached (`answer`: task and answer state) and which commercial or official hand-off they
 * followed (`handoff`: the hand-off name and the destination host). Never an identifier, a cookie,
 * the full URL, a query, a search term, a flight, an address or a time finer than the day.
 */

export const METRIC_EVENTS = ['answer', 'handoff'] as const;
export type MetricEvent = (typeof METRIC_EVENTS)[number];

/** Answer states a page can declare for its top task (`data-answer-state`). */
export const ANSWER_STATES = ['answered', 'partial', 'not-published', 'demo'] as const;
export type AnswerState = (typeof ANSWER_STATES)[number];

/** One measurement as sent by the browser. */
export interface Metric {
  event: MetricEvent;
  /** The top task or hand-off name: lower-case words and hyphens, e.g. `parking-price`, `parking-booking`. */
  name: string;
  /** Answer state (for `answer`). */
  state?: AnswerState;
  /** Destination host (for `handoff`), e.g. `www.klia2.info`. */
  host?: string;
  /** Section of the site: locale and at most two path segments, e.g. `/en/kul/parking`. */
  section: string;
}

const NAME = /^[a-z0-9][a-z0-9-]{0,47}$/;
const HOST = /^[a-z0-9.-]{3,100}$/;
const SECTION = /^\/(?:en|ms)(?:\/[a-z0-9-]{1,40}){0,2}$/;

/** The section a path belongs to: `/en/kul/flights/mh1-20261121-d?x` gives `/en/kul/flights`. */
export function sectionOf(pathname: string): string {
  const parts = pathname.split(/[?#]/)[0].split('/').filter(Boolean).slice(0, 3);
  const section = `/${parts.join('/')}`.toLowerCase();
  return SECTION.test(section) ? section : '/other';
}

/** Validate one measurement; anything unexpected is dropped, never stored. */
export function parseMetric(input: unknown): Metric | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const keys = Object.keys(value);
  if (keys.some((key) => !['event', 'name', 'state', 'host', 'section'].includes(key))) return null;
  if (!METRIC_EVENTS.includes(value.event as MetricEvent)) return null;
  if (typeof value.name !== 'string' || !NAME.test(value.name)) return null;
  if (typeof value.section !== 'string' || (value.section !== '/other' && !SECTION.test(value.section))) return null;
  if (value.event === 'answer' && !ANSWER_STATES.includes(value.state as AnswerState)) return null;
  if (value.event === 'handoff' && (typeof value.host !== 'string' || !HOST.test(value.host))) return null;
  return {
    event: value.event as MetricEvent,
    name: value.name,
    section: value.section,
    ...(value.event === 'answer' ? { state: value.state as AnswerState } : { host: value.host as string }),
  };
}

/** The campaign parameters added to outbound commercial links. */
export const CAMPAIGN = { source: 'malaysia-airports-concept', medium: 'referral' } as const;

/** Add campaign parameters to an outbound https link (other values are returned unchanged). */
export function withCampaign(href: string, campaign: string): string {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || !NAME.test(campaign)) return href;
    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', CAMPAIGN.source);
      url.searchParams.set('utm_medium', CAMPAIGN.medium);
      url.searchParams.set('utm_campaign', campaign);
    }
    return url.toString();
  } catch {
    return href;
  }
}
