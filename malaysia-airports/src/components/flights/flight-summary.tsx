'use client';

import { getAirport, terminalLabel } from '@/content/airports';
import { pick } from '@/content/values';
import { checkInLines, isInternationalFlight, type Flight } from '@/lib/flights';
import { useLang, useT } from '@/lib/i18n/client';
import { nextDeadline, nextStepSummary, type JourneyAirportContent, type JourneyService, type JourneyStep } from '@/lib/journey';
import { formatTime } from '@/lib/time';
import { ExternalLink } from '@/components/common/external-link';
import { keepRanges } from '@/components/common/keep-ranges';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { DEADLINE_KEYS } from './step-line';

/** Anchor id of a timeline step, shared with `JourneyTimeline`. */
export const stepAnchor = (id: string): string => `journey-step-${id}`;

export interface FlightSummaryProps {
  /** `null` until the flight feed has answered: the frame and its label are already there. */
  flight: Flight | null;
  /** The journey steps as built for this flight and the visitor's needs and options. */
  steps: readonly JourneyStep[] | null;
  now: number;
  /**
   * Polish 1b (critique-redesign1b item 1): the Fast Track record for this flight, known before the
   * feed answers (it depends on the timetable's route and terminal and on the airport's content,
   * never on the clock), so its row is in the frame from the first paint and nothing grows later.
   */
  fastTrack?: JourneyService;
}

/** The Fast Track record that applies to a departure: its terminal's own, else the airport's; none for a domestic flight. */
export function fastTrackFor(identity: Pick<Flight, 'direction' | 'terminal' | 'origin' | 'destination'>, content: JourneyAirportContent): JourneyService | undefined {
  if (identity.direction !== 'd' || !isInternationalFlight(identity)) return undefined;
  return (identity.terminal ? content.fastTrackByTerminal?.[identity.terminal] : undefined) ?? content.fastTrack;
}

const FRAME =
  // Round 5: the frame is the same while the feed loads and after, so the answer is filled in
  // place (no new block, no jump). Redesign round one: smoky glass on the flight page's midnight
  // band (an `on-media` scope). Polish 1b (critique-redesign1b item 1): every row of the frame has
  // a fixed height, whatever the answer says. The sentence holds exactly three lines on phones and
  // two from 640 px (clamped; the "See this step" link leads to the whole step), the link row is
  // as tall as the link, and the Fast Track row is there from the first paint. The panel grew from
  // 174 to 237 px when a delayed flight's answer arrived (CLS 0.106 at 1440, 0.081 at 390).
  'glass-dark flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5';
/** The sentence: a fixed number of lines (`lh`: the paragraph's own line height, so it follows text size). */
// Polish (critique-redesign2 item 22): from 1024 px, beside the title, the sentence takes the
// panel's whole width (about 500 px a line instead of 380), the link under it, so "Check-in: Row X,…"
// is no longer cut. Two lines, not three: a reserved third line stood empty above the breadcrumbs
// for most flights (a departed flight's answer is one line).
const SENTENCE = 'type-body min-w-0 flex-1 basis-64 text-ink line-clamp-3 h-[3lh] sm:line-clamp-2 sm:h-[2lh] lg:basis-full';
/** The link's row: as tall as `link-action` (44 px on phones and touch screens, 32 px otherwise). */
const LINK_ROW = 'flex min-h-8 items-center gap-3 max-md:min-h-11 touch:min-h-11';

/** "Fast Track at Terminal 1 · Fast Track · Book Fast Track": content only, the same before and after the feed. */
function FastTrackRow({ service, hidden }: { service: JourneyService; hidden?: boolean }) {
  const t = useT();
  const lang = useLang();
  return (
    <p
      data-summary-fast-track=""
      // A departed or cancelled flight keeps the row's room (no shift) but not its words.
      className={cn('type-body-sm flex basis-full flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2 text-ink-2', hidden && 'invisible')}
    >
      <span>{pick(service.title, lang)}</span>
      {service.href ? (
        <LocaleLink href={service.href} className="link-action text-ink">
          {t('flightPages.timeline.viewFastTrack')}
        </LocaleLink>
      ) : null}
      {service.bookingUrl ? (
        <ExternalLink href={service.bookingUrl} variant="action" className="text-ink" data-handoff="fast-track-booking">
          {t('airportPage.fastTrackBook')}
        </ExternalLink>
      ) : null}
    </p>
  );
}

export function FlightSummary({ flight, steps, now, fastTrack }: FlightSummaryProps) {
  const t = useT();
  const lang = useLang();
  // Both branches return the same root element and paragraph, so React fills them in place.
  if (!flight || !steps) {
    return (
      <div data-flight-summary="" data-pending="" className={FRAME}>
        <p className={SENTENCE}>
          <span className="type-eyebrow mr-2 text-gold-bright">{t('flightPages.summary.label')}</span>
          <span role="status">
            <Skeleton className="inline-block h-4 w-48 max-w-full align-middle" />
            <span className="sr-only">{t('flightPages.summary.loading')}</span>
          </span>
        </p>
        {/* Where the "See this step" link goes: the same words, unseen, so the row is as wide and tall. */}
        <span aria-hidden="true" className={LINK_ROW}>
          <span className="link-action type-body-sm invisible">
            {t('flightPages.summary.seeStep')}
            <Icon name="arrow-down" size="sm" strokeWidth={1.75} />
          </span>
        </span>
        {fastTrack && (fastTrack.href || fastTrack.bookingUrl) ? <FastTrackRow service={fastTrack} /> : null}
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

  // Round 6 (review-3 9.1 item 7): an international departure with a Fast Track record says it is
  // there, as an option, with its details and its booking site as a measured hand-off. Polish 1b:
  // the record comes from the timetable and the content (`fastTrack`), so the row is already there
  // before the feed answers; a departed or cancelled flight keeps its room without the words.
  const fastTrackHidden = Boolean(terminal) || flight.direction !== 'd';
  return (
    <div data-flight-summary="" className={FRAME}>
      <p className={SENTENCE}>
        <span className="type-eyebrow mr-2 text-gold-bright">{t('flightPages.summary.label')}</span>
        {delayed ? (
          <span data-summary-delayed="" className="mr-1.5 inline-flex items-baseline gap-1 font-semibold text-ink">
            <Icon name="clock-alert" size="sm" className="shrink-0 self-center" />
            {delayed}
            <span aria-hidden="true" className="ml-0.5 text-ink-3">
              ·
            </span>
          </span>
        ) : null}
        <strong className="font-semibold">{keepRanges(lead)}</strong>
        {estimate ? <span className="text-ink-2"> ({t('flightPages.summary.estimate')})</span> : null}
        {parts.map((part) => (
          <span key={part}>
            <span aria-hidden="true" className="mx-1.5 text-ink-3">
              ·
            </span>
            {keepRanges(part)}
          </span>
        ))}
      </p>
      {/* Round 5 (A-14): no Demo label of its own; the demonstration banner that caps the status
          card directly below is in the same view on every screen size. */}
      <span className={LINK_ROW}>
        <a href={`#${stepAnchor(anchor)}`} className="link-action type-body-sm text-ink">
          {t('flightPages.summary.seeStep')}
          <Icon name="arrow-down" size="sm" strokeWidth={1.75} />
        </a>
      </span>
      {fastTrack && (fastTrack.href || fastTrack.bookingUrl) ? <FastTrackRow service={fastTrack} hidden={fastTrackHidden} /> : null}
    </div>
  );
}

