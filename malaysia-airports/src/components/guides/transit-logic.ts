/**
 * Transit planner logic: which case a connection is, the ordered steps for it, and a rough time
 * estimate. Pure and client-safe. Every number here is a planning assumption of this prototype
 * (tagged `estimated` wherever it is shown), never an airport or airline figure.
 */

export type TransitTerminal = 'T1' | 'T2';
export type TicketType = 'protected' | 'self';
export type LegScope = 'international' | 'domestic';

export interface TransitInput {
  from: TransitTerminal;
  to: TransitTerminal;
  ticket: TicketType;
  arriving: LegScope;
  departing: LegScope;
  /** Minutes from scheduled landing to scheduled departure. */
  layover: number;
}

/** Layover choices offered in the planner, in minutes. */
export const LAYOVER_OPTIONS = [45, 60, 90, 120, 150, 180, 240, 360, 480, 720] as const;

/** From this many minutes the planner suggests resting. */
export const LONG_LAYOVER_MINUTES = 240;

export const DEFAULT_TRANSIT_INPUT: TransitInput = {
  from: 'T1',
  to: 'T1',
  ticket: 'protected',
  arriving: 'international',
  departing: 'international',
  layover: 120,
};

/**
 * - `airside`: same terminal, one booking; the traveller stays in the secure area where the legs allow.
 * - `landside-same`: same terminal, separate tickets; out through arrivals and back in as a new passenger.
 * - `landside-change`: different terminals; at KLIA there is no airside link, so always out and back in.
 */
export type TransitCase = 'airside' | 'landside-same' | 'landside-change';

export function transitCase(input: Pick<TransitInput, 'from' | 'to' | 'ticket'>): TransitCase {
  if (input.from !== input.to) return 'landside-change';
  return input.ticket === 'self' ? 'landside-same' : 'airside';
}

/** For `airside`: does the traveller enter Malaysia here, leave it, connect domestically or internationally? */
export type AirsideFlavour = 'international' | 'entering' | 'leaving' | 'domestic';

export function airsideFlavour(input: Pick<TransitInput, 'arriving' | 'departing'>): AirsideFlavour {
  if (input.arriving === 'international') return input.departing === 'international' ? 'international' : 'entering';
  return input.departing === 'international' ? 'leaving' : 'domestic';
}

export type TransitStepId =
  | 'leave-aircraft'
  | 'transfer-signs'
  | 'immigration'
  | 'bags'
  | 'bags-ask'
  | 'customs'
  | 'to-departures'
  | 'travel'
  | 'check-in'
  | 'controls'
  | 'gate';

/** The ordered steps for a connection. */
export function transitSteps(input: TransitInput): TransitStepId[] {
  const kind = transitCase(input);
  const intlIn = input.arriving === 'international';
  if (kind === 'airside') {
    switch (airsideFlavour(input)) {
      case 'international':
      case 'domestic':
        return ['leave-aircraft', 'transfer-signs', 'gate'];
      case 'entering':
        return ['leave-aircraft', 'immigration', 'bags-ask', 'customs', 'controls', 'gate'];
      case 'leaving':
        return ['leave-aircraft', 'transfer-signs', 'controls', 'gate'];
    }
  }
  const steps: TransitStepId[] = ['leave-aircraft'];
  if (intlIn) steps.push('immigration');
  steps.push('bags');
  if (intlIn) steps.push('customs');
  steps.push(kind === 'landside-change' ? 'travel' : 'to-departures', 'check-in', 'controls', 'gate');
  return steps;
}

export type SegmentId =
  | 'leaveAircraft'
  | 'transfer'
  | 'immigration'
  | 'bags'
  | 'bagsMaybe'
  | 'customs'
  | 'travel'
  | 'toDepartures'
  | 'checkIn'
  | 'controls'
  | 'controlsDomestic'
  | 'gate'
  | 'cutoff'
  | 'gateClose';

export interface Segment {
  id: SegmentId;
  min: number;
  max: number;
}

/** Planning assumptions, in minutes. Documented in the hand-off note; shown on the page as "our assumption". */
export const ASSUMPTIONS = {
  leaveAircraft: [10, 25],
  transfer: [15, 40],
  immigration: [15, 60],
  bags: [15, 45],
  bagsMaybe: [0, 45],
  customs: [5, 15],
  travel: [15, 35],
  toDepartures: [5, 15],
  checkIn: [10, 30],
  controls: [15, 45],
  controlsDomestic: [10, 25],
  gate: [10, 25],
  /** Check-in usually closes this long before departure (our assumption). */
  cutoffInternational: 60,
  cutoffDomestic: 45,
  /** Gates usually close this long before departure (our assumption). */
  gateClose: 20,
} as const;

function seg(id: Exclude<SegmentId, 'cutoff' | 'gateClose'>): Segment {
  const [min, max] = ASSUMPTIONS[id];
  return { id, min, max };
}

export interface TimeEstimate {
  /** The parts in order, the two fixed deadlines last. */
  segments: Segment[];
  /** Minutes needed between landing and departure: lowest and highest likely. */
  min: number;
  max: number;
}

/**
 * Rough time needed from landing to departure. For a new check-in (landside cases) the binding
 * constraint is whichever comes later: reaching check-in before it closes, or reaching the gate
 * before it closes.
 */
export function estimateTime(input: TransitInput): TimeEstimate {
  const kind = transitCase(input);
  const controls = input.departing === 'international' ? seg('controls') : seg('controlsDomestic');
  const gateClose: Segment = { id: 'gateClose', min: ASSUMPTIONS.gateClose, max: ASSUMPTIONS.gateClose };

  if (kind === 'airside') {
    const flavour = airsideFlavour(input);
    const parts: Segment[] = [seg('leaveAircraft')];
    if (flavour === 'entering') parts.push(seg('immigration'), seg('bagsMaybe'), seg('customs'), controls);
    else if (flavour === 'leaving') parts.push(seg('transfer'), controls);
    else parts.push(seg('transfer'));
    parts.push(seg('gate'));
    const min = parts.reduce((sum, part) => sum + part.min, 0) + gateClose.min;
    const max = parts.reduce((sum, part) => sum + part.max, 0) + gateClose.max;
    return { segments: [...parts, gateClose], min, max };
  }

  const arrival: Segment[] = [seg('leaveAircraft')];
  if (input.arriving === 'international') arrival.push(seg('immigration'));
  arrival.push(seg('bags'));
  if (input.arriving === 'international') arrival.push(seg('customs'));
  arrival.push(kind === 'landside-change' ? seg('travel') : seg('toDepartures'));
  const checkIn = seg('checkIn');
  const cutoffMinutes = input.departing === 'international' ? ASSUMPTIONS.cutoffInternational : ASSUMPTIONS.cutoffDomestic;
  const cutoff: Segment = { id: 'cutoff', min: cutoffMinutes, max: cutoffMinutes };
  const toCheckIn = { min: arrival.reduce((s, p) => s + p.min, 0) + checkIn.min, max: arrival.reduce((s, p) => s + p.max, 0) + checkIn.max };
  const gate = seg('gate');
  const viaCutoff = { min: toCheckIn.min + cutoff.min, max: toCheckIn.max + cutoff.max };
  const viaGate = {
    min: toCheckIn.min + controls.min + gate.min + gateClose.min,
    max: toCheckIn.max + controls.max + gate.max + gateClose.max,
  };
  return {
    segments: [...arrival, checkIn, controls, gate, cutoff, gateClose],
    min: Math.max(viaCutoff.min, viaGate.min),
    max: Math.max(viaCutoff.max, viaGate.max),
  };
}

export type TimeVerdict = 'comfortable' | 'tight' | 'very-tight';

export function timeVerdict(layover: number, estimate: Pick<TimeEstimate, 'min' | 'max'>): TimeVerdict {
  if (layover >= estimate.max) return 'comfortable';
  if (layover >= estimate.min) return 'tight';
  return 'very-tight';
}

/* -------------------------------------------------------------------------------------------
 * URL state: ?from=T1&to=T2&ticket=self&arr=intl&dep=dom&layover=180
 * ---------------------------------------------------------------------------------------- */

const TERMINALS: readonly TransitTerminal[] = ['T1', 'T2'];

export function parseTransitQuery(params: { get(name: string): string | null }): TransitInput {
  const term = (value: string | null, fallback: TransitTerminal): TransitTerminal =>
    TERMINALS.includes(value as TransitTerminal) ? (value as TransitTerminal) : fallback;
  const leg = (value: string | null, fallback: LegScope): LegScope => (value === 'dom' ? 'domestic' : value === 'intl' ? 'international' : fallback);
  const layover = Number(params.get('layover'));
  return {
    from: term(params.get('from'), DEFAULT_TRANSIT_INPUT.from),
    to: term(params.get('to'), DEFAULT_TRANSIT_INPUT.to),
    ticket: params.get('ticket') === 'self' ? 'self' : params.get('ticket') === 'protected' ? 'protected' : DEFAULT_TRANSIT_INPUT.ticket,
    arriving: leg(params.get('arr'), DEFAULT_TRANSIT_INPUT.arriving),
    departing: leg(params.get('dep'), DEFAULT_TRANSIT_INPUT.departing),
    layover: (LAYOVER_OPTIONS as readonly number[]).includes(layover) ? layover : DEFAULT_TRANSIT_INPUT.layover,
  };
}

export function transitQuery(input: TransitInput): string {
  const params = new URLSearchParams({
    from: input.from,
    to: input.to,
    ticket: input.ticket,
    arr: input.arriving === 'international' ? 'intl' : 'dom',
    dep: input.departing === 'international' ? 'intl' : 'dom',
    layover: String(input.layover),
  });
  return `?${params.toString()}`;
}
