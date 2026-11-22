'use client';

import { useState } from 'react';
import { useLang, useT } from '@/lib/i18n/client';
import type { TKey } from '@/lib/i18n/translate';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/cn';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceDefault, ProvenanceTag } from '@/components/common/provenance-tag';
import { sectionSources } from '@/components/common/section-sources';
import { sharedProvenance } from '@/components/common/shared-provenance';
import { SourceNote } from '@/components/common/source-note';
import { Callout } from '@/components/ui/callout';
import { Icon, type IconKey } from '@/components/ui/icon';
import { NativeSelect } from '@/components/ui/native-select';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { FactCard, type FactView } from './fact-card';
import { OpsStatus } from '@/components/flights/ops-status';
import type { TransitData } from './transit-data.server';
import {
  LAYOVER_OPTIONS,
  LONG_LAYOVER_MINUTES,
  airsideFlavour,
  estimateTime,
  timeVerdict,
  transitCase,
  transitQuery,
  transitSteps,
  type LegScope,
  type TicketType,
  type TransitInput,
  type TransitStepId,
  type TransitTerminal,
  type TimeVerdict,
} from './transit-logic';

export interface TransitPlannerProps {
  data: TransitData;
  initial: TransitInput;
}

const STEP_COPY: Record<TransitStepId, { title: TKey; body: TKey; icon: IconKey }> = {
  'leave-aircraft': { title: 'guidePages.transit.steps.leaveAircraft', body: 'guidePages.transit.steps.leaveAircraftBody', icon: 'plane-landing' },
  'transfer-signs': { title: 'guidePages.transit.steps.transferSigns', body: 'guidePages.transit.steps.transferSignsBody', icon: 'signpost' },
  immigration: { title: 'guidePages.transit.steps.immigration', body: 'guidePages.transit.steps.immigrationBody', icon: 'id-card' },
  bags: { title: 'guidePages.transit.steps.bags', body: 'guidePages.transit.steps.bagsBody', icon: 'baggage-claim' },
  'bags-ask': { title: 'guidePages.transit.steps.bagsAsk', body: 'guidePages.transit.steps.bagsAskBody', icon: 'luggage' },
  customs: { title: 'guidePages.transit.steps.customs', body: 'guidePages.transit.steps.customsBody', icon: 'stamp' },
  'to-departures': { title: 'guidePages.transit.steps.toDepartures', body: 'guidePages.transit.steps.toDeparturesBody', icon: 'plane-takeoff' },
  travel: { title: 'guidePages.transit.steps.travel', body: 'guidePages.transit.steps.travelBody', icon: 'arrow-left-right' },
  'check-in': { title: 'guidePages.transit.steps.checkIn', body: 'guidePages.transit.steps.checkInBody', icon: 'ticket-check' },
  controls: { title: 'guidePages.transit.steps.controlsInternational', body: 'guidePages.transit.steps.controlsInternationalBody', icon: 'scan-line' },
  gate: { title: 'guidePages.transit.steps.gate', body: 'guidePages.transit.steps.gateBody', icon: 'door-open' },
};

const VERDICT: Record<TimeVerdict, { tone: 'positive' | 'warning' | 'critical'; icon: 'circle-check' | 'clock-alert' | 'octagon-alert'; title: TKey; body: TKey }> = {
  comfortable: { tone: 'positive', icon: 'circle-check', title: 'guidePages.transit.time.verdict.comfortable', body: 'guidePages.transit.time.verdictBody.comfortable' },
  tight: { tone: 'warning', icon: 'clock-alert', title: 'guidePages.transit.time.verdict.tight', body: 'guidePages.transit.time.verdictBody.tight' },
  'very-tight': { tone: 'critical', icon: 'octagon-alert', title: 'guidePages.transit.time.verdict.veryTight', body: 'guidePages.transit.time.verdictBody.veryTight' },
};

const TONE_TEXT = { positive: 'text-positive-fg', warning: 'text-warning-fg', critical: 'text-critical-fg' } as const;

/** Steps the official inter-terminal note covers when the traveller changes terminals. */
const OFFICIAL_WHEN_CHANGING: readonly TransitStepId[] = ['immigration', 'bags', 'travel', 'check-in'];

/**
 * The transit planner: five inputs, then the case, the ordered steps with the sourced facts that
 * apply at each, and a rough time estimate graded against the layover. State lives in the URL
 * (`?from=T1&to=T2&ticket=self&arr=intl&dep=dom&layover=180`) so a plan can be shared.
 */
export function TransitPlanner({ data, initial }: TransitPlannerProps) {
  const t = useT();
  const lang = useLang();
  const [input, setInput] = useState<TransitInput>(initial);
  const [announcement, setAnnouncement] = useState('');

  const terminalName = (terminal: TransitTerminal) => t('guidePages.transit.planner.terminal', { number: terminal.slice(1) });
  const ticketName = (ticket: TicketType) => (ticket === 'protected' ? t('guidePages.transit.planner.ticketProtected') : t('guidePages.transit.planner.ticketSelf'));

  const update = (changes: Partial<TransitInput>) => {
    const next = { ...input, ...changes };
    setInput(next);
    try {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${transitQuery(next)}`);
    } catch {
      // Some embedded browsers forbid history writes; the planner still works without the URL.
    }
    const nextVerdict = timeVerdict(next.layover, estimateTime(next));
    setAnnouncement(
      t('transportPages.transitVerdict.announce', {
        updated: t('guidePages.transit.planner.updated', {
          summary: t('guidePages.transit.planner.summary', {
            from: terminalName(next.from),
            to: terminalName(next.to),
            ticket: ticketName(next.ticket),
            layover: formatDuration(next.layover, lang),
          }),
        }),
        verdict: t(VERDICT[nextVerdict].title),
      }),
    );
  };

  const kind = transitCase(input);
  const steps = transitSteps(input);
  const estimate = estimateTime(input);
  const verdict = timeVerdict(input.layover, estimate);
  const flavour = airsideFlavour(input);

  const caseCopy: { title: TKey; body: TKey; icon: IconKey } =
    kind === 'landside-change'
      ? { title: 'guidePages.transit.cases.landsideChange', body: 'guidePages.transit.cases.landsideChangeBody', icon: 'arrow-left-right' }
      : kind === 'landside-same'
        ? { title: 'guidePages.transit.cases.landsideSame', body: 'guidePages.transit.cases.landsideSameBody', icon: 'door-open' }
        : flavour === 'entering'
          ? { title: 'guidePages.transit.cases.entering', body: 'guidePages.transit.cases.enteringBody', icon: 'id-card' }
          : flavour === 'leaving'
            ? { title: 'guidePages.transit.cases.leaving', body: 'guidePages.transit.cases.leavingBody', icon: 'plane-takeoff' }
            : flavour === 'domestic'
              ? { title: 'guidePages.transit.cases.domestic', body: 'guidePages.transit.cases.domesticBody', icon: 'route' }
              : { title: 'guidePages.transit.cases.airside', body: 'guidePages.transit.cases.airsideBody', icon: 'shield-check' };

  const factsFor = (step: TransitStepId): FactView[] => {
    const facts: (FactView | undefined)[] = [];
    if (step === 'immigration') facts.push(data.mdac);
    if (step === 'customs') facts.push(data.customs);
    if (step === 'check-in') facts.push(data.checkIn[input.to]);
    if (step === 'gate') facts.push(data.gates[input.to]);
    return facts.filter((fact): fact is FactView => Boolean(fact));
  };

  const stepProvenance = (step: TransitStepId) =>
    kind === 'landside-change' && data.interTerminal && OFFICIAL_WHEN_CHANGING.includes(step)
      ? { provenance: data.interTerminal.provenance, sources: data.interTerminal.sources }
      : { provenance: 'estimated' as const, sources: data.methodSources };

  const stepViews = steps.map((step) => {
    const copy = step === 'controls' && input.departing === 'domestic' ? { ...STEP_COPY.controls, title: 'guidePages.transit.steps.controlsDomestic' as const, body: 'guidePages.transit.steps.controlsDomesticBody' as const } : STEP_COPY[step];
    const title = step === 'travel' ? t(copy.title, { number: input.to.slice(1) }) : t(copy.title);
    return { step, copy, title, origin: stepProvenance(step) };
  });
  const stepsDefault = sharedProvenance(stepViews.map((view) => view.origin));
  const stepSources = sectionSources(
    stepViews,
    (view) => view.origin.sources.map((source) => source.id),
    (view) => view.title,
    Object.fromEntries(stepViews.flatMap((view) => view.origin.sources.map((source) => [source.id, source]))),
  );

  const legOptions = [
    { value: 'international' as const, label: t('common.labels.international'), icon: 'globe' as const },
    { value: 'domestic' as const, label: t('common.labels.domestic'), icon: 'route' as const },
  ];
  const terminalOptions = (['T1', 'T2'] as const).map((value) => ({ value, label: terminalName(value), icon: 'terminal' as const }));

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12">
      <form
        aria-labelledby="transit-planner-title"
        onSubmit={(event) => event.preventDefault()}
        // The sticky verdict summary covers the top of the window on phones: focused fields keep clear of it (WCAG 2.4.11).
        className="flex min-w-0 flex-col gap-5 rounded-xl border border-line-strong bg-surface p-5 shadow-sm max-lg:[@media(min-height:40rem)]:[&_:is(input,select,button)]:scroll-mt-40 lg:sticky lg:top-[calc(var(--spacing-sticky)+1.5rem)]"
      >
        <h2 id="transit-planner-title" className="type-title-lg text-ink">
          {t('guidePages.transit.planner.title')}
        </h2>
        <VerdictSummary verdict={verdict} estimate={estimate} layover={input.layover} />
        <SegmentedControl<TransitTerminal> label={t('guidePages.transit.planner.arrive')} showLabel block options={terminalOptions} value={input.from} onValueChange={(from) => update({ from })} />
        <SegmentedControl<LegScope> label={t('guidePages.transit.planner.arrivingLeg')} showLabel block options={legOptions} value={input.arriving} onValueChange={(arriving) => update({ arriving })} />
        <div aria-hidden="true" className="h-px bg-line" />
        <SegmentedControl<TransitTerminal> label={t('guidePages.transit.planner.depart')} showLabel block options={terminalOptions} value={input.to} onValueChange={(to) => update({ to })} />
        <SegmentedControl<LegScope> label={t('guidePages.transit.planner.departingLeg')} showLabel block options={legOptions} value={input.departing} onValueChange={(departing) => update({ departing })} />
        <div aria-hidden="true" className="h-px bg-line" />
        <SegmentedControl<TicketType>
          label={t('guidePages.transit.planner.ticket')}
          showLabel
          block
          stackOnPhone
          options={[
            { value: 'protected', label: t('guidePages.transit.planner.ticketProtected'), hint: t('guidePages.transit.planner.ticketProtectedHint'), icon: 'ticket-check' },
            { value: 'self', label: t('guidePages.transit.planner.ticketSelf'), hint: t('guidePages.transit.planner.ticketSelfHint'), icon: 'ticket' },
          ]}
          value={input.ticket}
          onValueChange={(ticket) => update({ ticket })}
        />
        <NativeSelect
          label={t('guidePages.transit.planner.layover')}
          hint={t('guidePages.transit.planner.layoverHint')}
          iconStart="clock"
          value={String(input.layover)}
          onChange={(event) => update({ layover: Number(event.target.value) })}
        >
          {LAYOVER_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {formatDuration(minutes, lang)}
            </option>
          ))}
        </NativeSelect>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </form>

      <div className="flex min-w-0 flex-col gap-8">
        <VerdictCard verdict={verdict} estimate={estimate} layover={input.layover} self={input.ticket === 'self'} late={data.late.length > 0} />

        <section aria-labelledby="transit-case-title" className="flex min-w-0 gap-4 rounded-xl border border-ink bg-surface p-5">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-inverse text-on-inverse">
            <Icon name={caseCopy.icon} />
          </span>
          <div className="min-w-0">
            <p className="type-eyebrow text-ink-3">
              {terminalName(input.from)}
              <Icon name="arrow-right" size="xs" className="mx-1.5 inline" />
              {terminalName(input.to)}
              <span aria-hidden="true"> · </span>
              <span className="sr-only">, </span>
              {ticketName(input.ticket)}
            </p>
            <h3 id="transit-case-title" className="type-title-lg mt-1 text-ink">
              {t(caseCopy.title)}
            </h3>
            <p className="type-body mt-1.5 text-ink-2">{t(caseCopy.body)}</p>
          </div>
        </section>

        <section aria-labelledby="transit-steps-title">
          <h3 id="transit-steps-title" className="type-title-md mb-5 text-ink">
            {t('guidePages.transit.planner.stepsTitle')}
          </h3>
          {/* Round 4 (A-14): the tag most steps share is said once; one source list for the steps. */}
          {stepsDefault ? <ProvenanceDefault provenance={stepsDefault} className="-mt-2 mb-4" /> : null}
          <Timeline aria-label={t('guidePages.transit.planner.stepsLabel')}>
            {stepViews.map(({ step, copy, title, origin }, index) => {
              const facts = factsFor(step);
              return (
                <TimelineItem
                  key={step}
                  state={index === 0 ? 'current' : 'upcoming'}
                  eyebrow={String(index + 1).padStart(2, '0')}
                  title={title}
                  meta={origin.provenance !== stepsDefault ? <ProvenanceTag provenance={origin.provenance} length="short" /> : undefined}
                >
                  <p>{t(copy.body)}</p>
                  {step === 'travel' && data.options.length > 0 ? (
                    <ul className="mt-3 flex flex-col gap-2">
                      {data.options.map((option) => (
                        <li key={option.id} className="type-body-sm flex min-w-0 flex-wrap items-baseline gap-x-2 text-ink">
                          <Icon name="inter-terminal" size="xs" className="self-center text-ink-2" />
                          <span className="font-semibold">{option.title}</span>
                          {option.details?.[0] ? <span className="text-ink-2">{option.details[0].value}</span> : null}
                        </li>
                      ))}
                      <li>
                        <a href="#between-terminals" className="link-action type-body-sm text-ink">
                          {t('guidePages.transit.official.optionsTitle')}
                          <Icon name="arrow-down" size="sm" />
                        </a>
                      </li>
                    </ul>
                  ) : null}
                  {/* D-08 hand-off (round 2): reaching a Terminal 1 gate may use the Aerotrain, so the
                      step reads the current Aerotrain notices and links to them. */}
                  {step === 'gate' && input.to === 'T1' && data.aerotrain ? (
                    <OpsStatus airport={data.airportSlug} notices={data.aerotrain.notices} sources={data.aerotrain.sources} services={['aerotrain']} variant="inline" />
                  ) : null}
                  {facts.length > 0 ? (
                    <div className="mt-3 flex flex-col gap-3 border-l-2 border-line-strong pl-4">
                      {facts.map((fact) => (
                        <FactCard key={fact.id} fact={fact} headingLevel={4} variant="plain" />
                      ))}
                    </div>
                  ) : null}
                </TimelineItem>
              );
            })}
          </Timeline>
          {stepSources.sources.length > 0 ? (
            <div data-section-sources="" className="mt-2">
              <SourceNote sources={stepSources.sources} citedBy={stepSources.citedBy} label={t('shellExtras.sourceLists.section')} />
            </div>
          ) : null}
        </section>

        <section aria-labelledby="transit-time-title" className="rounded-xl border border-line-strong bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="transit-time-title" className="type-title-md text-ink">
                {t('guidePages.transit.time.breakdown')}
              </h3>
              <p className="type-body-sm mt-1 text-ink-2">{t('guidePages.transit.time.lead')}</p>
            </div>
            <ProvenanceTag provenance="estimated" />
          </div>
          <p className="type-body-sm mt-4 flex gap-2 text-ink">
            <Icon name="info" size="sm" className="mt-0.5 shrink-0" />
            <span>{t('guidePages.transit.time.confirm')}</span>
          </p>
          <details className="group/est mt-4 border-t border-line pt-3">
            <summary className="type-body-sm inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-semibold text-ink">
              {t('guidePages.transit.time.segment')}
              <Icon name="chevron-down" size="sm" className="transition-transform duration-fast group-open/est:rotate-180" />
            </summary>
            <p className="type-caption mb-2 text-ink-2">{t('guidePages.transit.time.breakdownLead')}</p>
            <table className="type-body-sm w-full border-collapse">
              <caption className="sr-only">{t('guidePages.transit.time.breakdown')}</caption>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th scope="col" className="py-2 pr-3 font-semibold text-ink">
                    {t('guidePages.transit.time.segment')}
                  </th>
                  <th scope="col" className="py-2 text-right font-semibold text-ink">
                    {t('guidePages.transit.time.minutes')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {estimate.segments.map((segment) => (
                  <tr key={segment.id} className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-2">
                      {t(`guidePages.transit.time.segments.${segment.id}`)}
                    </th>
                    <td className="tabular py-2 text-right whitespace-nowrap text-ink">
                      {segment.min === segment.max ? formatDuration(segment.min, lang) : `${formatDuration(segment.min, lang)}–${formatDuration(segment.max, lang)}`}
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-2 pr-3 text-left font-semibold text-ink">
                    {t('guidePages.transit.time.totalLabel')}
                  </th>
                  <td className="tabular py-2 text-right font-semibold whitespace-nowrap text-ink">
                    {formatDuration(estimate.min, lang)}–{formatDuration(estimate.max, lang)}
                  </td>
                </tr>
              </tbody>
            </table>
          </details>
        </section>

        {input.layover >= LONG_LAYOVER_MINUTES && data.rest.length > 0 ? (
          <Callout tone="info" icon="sofa" title={t('guidePages.transit.rest.enoughTime', { time: formatDuration(input.layover, lang) })}>
            <a href="#transit-rest" className={cn('link-action type-body-sm text-ink')}>
              {t('guidePages.transit.rest.title')}
              <Icon name="arrow-down" size="sm" />
            </a>
          </Callout>
        ) : null}

        <p className="type-body-sm text-ink-2">
          <LocaleLink href="/help/flights" className="link">
            {t('guidePages.transit.late.rights')}
          </LocaleLink>
        </p>
      </div>
    </div>
  );
}

/**
 * Round 4 (6.1.6, C-03): on phones the full verdict card sits under a five-question form, so this
 * one-line summary stays at the top of the form while it is answered: the verdict word, our range
 * against the traveller's time, and a link down to the plan. It sticks under the header while the
 * form scrolls past, except on short windows (400% zoom), where nothing sticks. Hidden from `lg`,
 * where the card is beside the form. Not a live region: the form's status line announces changes.
 */
function VerdictSummary({ verdict, estimate, layover }: { verdict: TimeVerdict; estimate: { min: number; max: number }; layover: number }) {
  const t = useT();
  const lang = useLang();
  const copy = VERDICT[verdict];
  const border = verdict === 'comfortable' ? 'border-positive-border' : verdict === 'tight' ? 'border-warning-border' : 'border-critical-border';
  return (
    <div
      data-verdict-summary={verdict}
      className={cn(
        'z-10 -mx-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border-2 bg-surface px-3 py-2 shadow-sm lg:hidden',
        '[@media(min-height:40rem)]:sticky [@media(min-height:40rem)]:top-[calc(var(--spacing-sticky)+0.5rem)]',
        border,
      )}
    >
      <p className="type-body-sm flex min-w-0 flex-1 basis-48 items-start gap-2 text-ink">
        <Icon name={copy.icon} size="sm" className={cn('mt-0.5 shrink-0', TONE_TEXT[copy.tone])} />
        <span className="min-w-0">
          <strong className="font-semibold">{t(copy.title)}</strong>
          <span aria-hidden="true"> · </span>
          <span className="sr-only">. </span>
          {t('guidePages.transit.time.summary', {
            range: t('guidePages.transit.time.range', { min: formatDuration(estimate.min, lang), max: formatDuration(estimate.max, lang) }),
            layover: formatDuration(layover, lang),
          })}
        </span>
      </p>
      <a href="#transit-verdict-title" className="link-action type-body-sm shrink-0 text-ink">
        {t('guidePages.transit.time.summaryLink')}
        <Icon name="arrow-down" size="sm" />
      </a>
    </div>
  );
}

/**
 * The answer first (C-03): verdict word, one sentence, our time range against the traveller's,
 * and what to do if it is tight, directly under the form on phone and desktop. Changes are
 * announced politely by the form's status line.
 */
function VerdictCard({ verdict, estimate, layover, self, late }: { verdict: TimeVerdict; estimate: { min: number; max: number }; layover: number; self: boolean; late: boolean }) {
  const t = useT();
  const lang = useLang();
  const copy = VERDICT[verdict];
  const border = verdict === 'comfortable' ? 'border-positive-border' : verdict === 'tight' ? 'border-warning-border' : 'border-critical-border';
  return (
    <section aria-labelledby="transit-verdict-title" data-transit-verdict={verdict} className={cn('flex min-w-0 flex-col gap-4 rounded-xl border-2 bg-surface p-5 shadow-sm', border)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="type-eyebrow text-ink-3">{t('guidePages.transit.time.title')}</p>
        <ProvenanceTag provenance="estimated" length="short" />
      </div>
      <div className="flex min-w-0 gap-3">
        <Icon name={copy.icon} className={cn('mt-1 shrink-0', TONE_TEXT[copy.tone])} />
        <div className="min-w-0">
          <h3 id="transit-verdict-title" className="type-title-lg text-ink">
            {t(copy.title)}
          </h3>
          <p className="type-body mt-1 text-ink-2">{t(copy.body)}</p>
        </div>
      </div>
      {/* Round 6 (review-3 9.1 item 8): side by side while their labels fit, stacked when they do not
          ("penerbangan" broke in a 96 px column at 360 px and 125% text). */}
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
        <div className="min-w-0 rounded-lg bg-page-subtle p-3">
          <dt className="type-caption text-ink-2">{t('guidePages.transit.time.estimate')}</dt>
          <dd className="type-data-md mt-1 text-ink">{t('guidePages.transit.time.range', { min: formatDuration(estimate.min, lang), max: formatDuration(estimate.max, lang) })}</dd>
        </div>
        <div className="min-w-0 rounded-lg bg-page-subtle p-3">
          <dt className="type-caption text-ink-2">{t('guidePages.transit.time.yours')}</dt>
          <dd className="type-data-md mt-1 text-ink">{formatDuration(layover, lang)}</dd>
        </div>
      </dl>
      {self ? (
        <p className="type-body-sm flex gap-2 text-ink">
          <Icon name="triangle-alert" size="sm" className="mt-0.5 shrink-0" />
          <span>{t('guidePages.transit.time.selfWarning')}</span>
        </p>
      ) : null}
      {late ? (
        <a href="#transit-late" className="link-action type-body-sm self-start font-semibold text-ink">
          {t('transportPages.transitVerdict.tightAction')}
          <Icon name="arrow-down" size="sm" />
        </a>
      ) : null}
    </section>
  );
}
