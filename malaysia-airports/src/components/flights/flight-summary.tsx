'use client';

import { getAirport, terminalLabel } from '@/content/airports';
import { pick } from '@/content/values';
import { checkInLines, type Flight } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import { nextDeadline, nextStepSummary, type JourneyStep } from '@/lib/journey';
import { formatTime } from '@/lib/time';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { DEADLINE_KEYS } from './step-line';

/** Anchor id of a timeline step, shared with `JourneyTimeline`. */
export const stepAnchor = (id: string): string => `journey-step-${id}`;

export interface FlightSummaryProps {
  /** `null` until the flight feed has answered: the frame and its label are already there. */
  flight: Flight | null;
  /** The journey steps as built for this flight and the visitor's needs and options. */
  steps: readonly JourneyStep[] | null;
  now: number;
}

const FRAME =
  // Round 5: the frame is the same while the feed loads and after, so the answer is filled in
  // place (no new block, no jump); placeholders keep room for two lines and the step link.
  'flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line-strong bg-surface px-4 py-3';

/**
 * The answer first (first-time-access-03, usability-10): one line under the title with the next
 * action and its time, for example "Be at KLIA Terminal 1 by 19:30 (estimate) · Check in:
 * Economy: Row H, counters 1-18 · Boarding 21:45", linking to that step of the timeline. A
 * departed or cancelled flight shows its terminal state instead.
 *
 * Round 4 (6.1.2): a delayed flight says so first ("Delayed: now 19:45"), every time follows the
 * estimated time (as the timeline does), and once the arrive-by time has passed the card names
 * the deadline that still matters ("Check-in closes 19:00") and never a past time.
 */
export function FlightSummary({ flight, steps, now }: FlightSummaryProps) {
  const t = useT();
  const lang = useLang();
  // Both branches return the same root element and paragraph, so React fills them in place.
  if (!flight || !steps) {
    return (
      <div data-flight-summary="" data-pending="" className={FRAME}>
        <p className="type-body min-w-0 flex-1 basis-64 text-ink">
          <span className="type-eyebrow mr-2 text-ink-2">{t('flightPages.summary.label')}</span>
          <span role="status">
            <Skeleton className="inline-block h-4 w-48 max-w-full align-middle" />
            <span className="sr-only">{t('flightPages.summary.loading')}</span>
          </span>
          {/* Phones: room for the lines the answer usually takes (Malay runs a line longer). */}
          <Skeleton className="mt-2 h-4 w-3/4 sm:hidden" />
          {lang === 'ms' ? <Skeleton className="mt-2 h-4 w-1/2 sm:hidden" /> : null}
        </p>
        {/* Where the "See this step" link goes, as tall as that link (`link-action`: 44 px on
            phones and touch screens, 32 px otherwise). */}
        <span className="flex min-h-8 items-center gap-3 max-md:min-h-11 touch:min-h-11">
          <Skeleton className="h-5 w-28" />
        </span>
      </div>
    );
  }
  const airport = getAirport(flight.airport);
  const zone = airport?.timezone;
  const terminal = steps.find((step) => step.terminal);
  const current = steps.find((step) => step.state === 'current');
  const parts: string[] = [];
  const delayed =
    flight.status !== 'cancelled' && !terminal && Date.parse(flight.estimated) > Date.parse(flight.scheduled)
      ? t('flightPages.summary.delayed', { time: formatTime(flight.estimated, zone) })
      : null;
  let lead: string;
  let anchor: string;
  let estimate = false;

  if (terminal) {
    lead = pick(terminal.title, lang);
    anchor = terminal.id;
  } else if (flight.direction === 'd') {
    const arrive = steps.find((item) => item.id === 'arrive');
    lead = '';
    anchor = 'arrive';
    if (arrive?.time && Date.parse(arrive.time) > now) {
      const place = airport ? terminalLabel(airport, flight.terminal, lang) : flight.terminal;
      lead = t('flightPages.summary.beAt', { place, time: formatTime(arrive.time, zone) });
      anchor = arrive.id;
      estimate = arrive.provenance === 'estimated';
    }
    const closed = flight.checkInClosesAt !== undefined && Date.parse(flight.checkInClosesAt) <= now;
    const desk = checkInLines(flight)[0];
    const summary = nextStepSummary(steps, now);
    const step = summary?.step ?? steps[steps.length - 1];
    const deadline = nextDeadline(flight, now);
    let deskLeads = false;
    let deadlineShown: string | null = null;
    if (!(arrive?.time && Date.parse(arrive.time) > now)) {
      // Past the arrive-by time, the step under way leads; at check-in, the desk itself is the
      // answer. Then the deadline that still matters, never a past time (round 4).
      deskLeads = step.id === 'check-in' && Boolean(desk) && !closed;
      lead = deskLeads && desk ? t('flightPages.summary.checkIn', { where: pick(desk, lang) }) : pick(step.title, lang);
      anchor = step.id;
      if (deadline && deadline.kind !== 'arrive-by') {
        deadlineShown = deadline.kind;
        parts.push(`${t(DEADLINE_KEYS[deadline.kind])} ${formatTime(deadline.time, zone)}`);
      }
    }
    if (desk && !closed && !deskLeads) parts.push(t('flightPages.summary.checkIn', { where: pick(desk, lang) }));
    if (flight.gate) parts.push(t('flightPages.summary.gate', { gate: flight.gate }));
    if (flight.boardingAt && flight.status !== 'cancelled' && deadlineShown !== 'boarding' && Date.parse(flight.boardingAt) > now)
      parts.push(t('flightPages.summary.boarding', { time: formatTime(flight.boardingAt, zone) }));
  } else {
    const landed = flight.actual !== undefined;
    lead = landed ? t('flightPages.summary.landed', { time: formatTime(flight.actual ?? flight.estimated, zone) }) : t('flightPages.summary.lands', { time: formatTime(flight.estimated, zone) });
    anchor = (current ?? steps[0])?.id ?? 'landing';
    if (flight.belt) parts.push(t('flightPages.summary.belt', { belt: flight.belt }));
  }

  return (
    <div data-flight-summary="" className={FRAME}>
      <p className="type-body min-w-0 flex-1 basis-64 text-ink">
        <span className="type-eyebrow mr-2 text-ink-2">{t('flightPages.summary.label')}</span>
        {delayed ? (
          <span data-summary-delayed="" className="mr-1.5 inline-flex items-baseline gap-1 font-semibold text-ink">
            <Icon name="clock-alert" size="sm" className="shrink-0 self-center" />
            {delayed}
            <span aria-hidden="true" className="ml-0.5 text-ink-3">
              ·
            </span>
          </span>
        ) : null}
        <strong className="font-semibold">{lead}</strong>
        {estimate ? <span className="text-ink-2"> ({t('flightPages.summary.estimate')})</span> : null}
        {parts.map((part) => (
          <span key={part}>
            <span aria-hidden="true" className="mx-1.5 text-ink-3">
              ·
            </span>
            {part}
          </span>
        ))}
      </p>
      {/* Round 5 (A-14): no Demo label of its own; the demonstration banner that caps the status
          card directly below is in the same view on every screen size. */}
      <span className="flex items-center gap-3">
        <a href={`#${stepAnchor(anchor)}`} className="link-action type-body-sm text-ink">
          {t('flightPages.summary.seeStep')}
          <Icon name="arrow-down" size="sm" strokeWidth={1.75} />
        </a>
      </span>
    </div>
  );
}

