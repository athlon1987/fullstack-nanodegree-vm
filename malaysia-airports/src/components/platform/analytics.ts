/**
 * First-party, consent-aware, aggregate measurement in the browser (exec-commerce-12).
 *
 *  - Nothing is sent when the visitor has asked not to be measured: Global Privacy Control,
 *    Do Not Track, or the "measurement" switch (`measurementStore`, offered on the privacy page).
 *  - Only `sendBeacon` to `/api/metrics` on this origin: no third-party host, no cookie, no id.
 *  - What is sent is defined in `metrics.ts`: a top task's answer state, or the hand-off a
 *    visitor followed, with the site section and the destination host. Nothing else.
 *
 * Pages declare what to measure with attributes, so the measurement needs no code in features:
 *   <section data-answer-task="parking-price" data-answer-state="answered">…
 *   <a href="https://partner.example/book" data-handoff="parking-booking">…
 * Links marked `data-handoff` also get campaign parameters when followed (`withCampaign`).
 */
import { check, createStore, validator } from '@/lib/storage';
import { ANSWER_STATES, parseMetric, sectionOf, withCampaign, type AnswerState, type Metric } from './metrics';

/** The visitor's choice: `on` (default) or `off`. Kept on the device. */
export const measurementStore = createStore<'on' | 'off'>({
  name: 'measurement',
  version: 1,
  schema: validator(check.oneOf(['on', 'off'] as const)),
  defaultValue: 'on',
});

/** May this browser send measurements now? */
export function isMeasurementAllowed(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl === true || nav.doNotTrack === '1') return false;
  return measurementStore.get() === 'on' && typeof nav.sendBeacon === 'function';
}

/** Send one measurement (dropped silently when not allowed or not valid). */
export function track(metric: Metric): void {
  const valid = parseMetric(metric);
  if (!valid || !isMeasurementAllowed()) return;
  try {
    navigator.sendBeacon('/api/metrics', new Blob([JSON.stringify(valid)], { type: 'text/plain;charset=UTF-8' }));
  } catch {
    // Measurement must never get in the way.
  }
}

const reported = new Set<string>();

/** Report the answer state of every task the current page declares, once per page view. */
function reportAnswers(): void {
  const section = sectionOf(location.pathname);
  for (const element of document.querySelectorAll<HTMLElement>('[data-answer-task][data-answer-state]')) {
    const name = element.dataset.answerTask ?? '';
    const state = element.dataset.answerState as AnswerState;
    const key = `${location.pathname}|${name}`;
    if (reported.has(key) || !ANSWER_STATES.includes(state)) continue;
    reported.add(key);
    track({ event: 'answer', name, state, section });
  }
}

function onClick(event: MouseEvent): void {
  const link = (event.target as Element | null)?.closest?.('a[data-handoff]') as HTMLAnchorElement | null;
  if (!link) return;
  const name = link.dataset.handoff ?? '';
  let host = '';
  try {
    const url = new URL(link.href);
    if (url.origin === location.origin) return;
    host = url.hostname;
  } catch {
    return;
  }
  link.href = withCampaign(link.href, name);
  track({ event: 'handoff', name, host, section: sectionOf(location.pathname) });
}

let started = false;

/** Start once, from the always-mounted `PlatformRuntime`. */
export function startAnalytics(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  document.addEventListener('click', onClick, { capture: true });
  const later = () => window.setTimeout(reportAnswers, 1200);
  later();
  window.addEventListener('popstate', later);
  // Client navigations: the Navigation API where the browser has it, else a title change.
  const navigation = (window as Window & { navigation?: EventTarget }).navigation;
  if (navigation) navigation.addEventListener('navigatesuccess', later);
  else new MutationObserver(later).observe(document.head, { subtree: true, childList: true, characterData: true });
}
