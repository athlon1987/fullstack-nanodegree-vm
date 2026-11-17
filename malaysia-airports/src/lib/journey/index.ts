/**
 * Journey timeline builder: turns a flight, a journey mode and an airport's content into an
 * ordered list of steps, each tagged with the kind of guidance it is.
 *
 * Provenance rules applied here (build-spec section 1):
 *  - anything read from the flight (terminal, check-in row, gate, belt, times) is `demo` while
 *    the flight is simulated, `official` once a live provider supplies it;
 *  - our rules of thumb (arrive 3 hours before an international flight, typical queue
 *    allowances, connection times) are `estimated` and always point to the airline;
 *  - optional ideas (food near the gate, where to wait) are `suggestion`;
 *  - sourced airport facts are attached to steps as `notes`, each with its own provenance and
 *    sources, taken from the airport's `guidesNotes`.
 *
 * Pure: pass `now` in. Copy is `LocalizedText` (both languages); action labels are dictionary
 * keys; `href`s have no locale prefix (use `localeHref`).
 */
import { lt, type AirportContent, type GuideNote, type GuideNoteTopic, type LocalizedText, type Provenance, type TerminalId } from '@/content/types';
import { isMultiTerminal, terminalLabel } from '@/content/airports';
import { formatFlightNumber, isInternationalFlight, remotePlace } from '@/lib/flights/query';
import { flightStatusLabel } from '@/lib/flights/status';
import type { Flight } from '@/lib/flights/types';
import type { TKey } from '@/lib/i18n/translate';
import { addMinutes, formatTime, minutesBetween, toDate, toIsoWithOffset, type Instant } from '@/lib/time';
import { formatDuration } from '@/lib/format';
import type { JourneyMode } from './modes';

export { DEFAULT_JOURNEY_MODE, JOURNEY_MODES, isJourneyMode, type JourneyMode } from './modes';

/** Recommended minutes to be at the airport before departure. Estimated guidance, not a rule. */
export const RECOMMENDED_ARRIVAL_MINUTES = { international: 180, domestic: 120 } as const;

/** Optional traveller details that adjust the steps. */
export interface JourneyPreferences {
  /** Adds an assistance step and step-free wording. */
  reducedMobility?: boolean;
  /** Adds family-friendly pointers. */
  withChildren?: boolean;
  /** False when travelling with hand luggage only: bag drop and baggage reclaim are skipped. */
  checkedBags?: boolean;
  /** For `transiting`: what is known about the connection. */
  connection?: {
    /** `protected`: one booking. `self-transfer`: separate bookings. Unknown when omitted. */
    type?: 'protected' | 'self-transfer';
    /** Terminal of the onward flight, when it differs from the arrival terminal. */
    onwardTerminal?: TerminalId;
    /** The onward flight, if the traveller has chosen it. */
    onwardFlight?: Flight | null;
  };
}

/** A link offered by a step. `labelKey` is a dictionary key; `href` has no locale prefix. */
export interface JourneyAction {
  labelKey: TKey;
  href: string;
}

/** A sourced airport fact attached to a step. */
export interface JourneyNote {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  provenance: Provenance;
  sources: string[];
}

/** What a step is about; use it to pick an icon. */
export type JourneyStepKind =
  | 'disruption'
  | 'terminal'
  | 'travel'
  | 'assistance'
  | 'arrive'
  | 'check-in'
  | 'security'
  | 'gate'
  | 'food'
  | 'boarding'
  | 'landing'
  | 'immigration'
  | 'baggage'
  | 'customs'
  | 'onward'
  | 'meeting'
  | 'connection'
  | 'transfer'
  | 'connection-time'
  | 'rest'
  | 'status'
  | 'parking'
  | 'wait';

/** One step of a journey timeline. */
export interface JourneyStep {
  /** Stable within a timeline: `check-in`, `gate`, `onward-gate`, ... */
  id: string;
  kind: JourneyStepKind;
  /** When the step happens, as an ISO instant with the airport offset, if it can be timed. */
  time?: string;
  /** Dictionary key describing when the step happens relative to the journey, for untimed steps. */
  relative?: TKey;
  title: LocalizedText;
  body: LocalizedText;
  /** The kind of guidance in `title` and `body`. Notes carry their own. */
  provenance: Provenance;
  actions: JourneyAction[];
  /** Sources for the step itself, when it states a sourced fact. */
  sources?: string[];
  /** Sourced airport facts relevant to this step. */
  notes: JourneyNote[];
  /** Where the step stands at `now`. Without timed steps in the past, everything is `upcoming`. */
  state: 'done' | 'current' | 'upcoming';
}

/** The slice of airport content the builder needs (an `AirportContent` fits). */
export type JourneyAirportContent = Pick<AirportContent, 'airport' | 'guidesNotes'>;

/** Input of `buildJourney`. */
export interface BuildJourneyInput {
  /** The flight the journey is about. Without one, steps are generic and untimed. */
  flight?: Flight | null;
  mode: JourneyMode;
  airportContent: JourneyAirportContent;
  /** The current instant (from `useNow()` on the client). */
  now: Instant;
  preferences?: JourneyPreferences;
}

type Draft = Omit<JourneyStep, 'state' | 'notes' | 'actions'> & { notes?: JourneyNote[]; actions?: JourneyAction[] };

interface Context {
  content: JourneyAirportContent;
  slug: string;
  zone: string;
  flight: Flight | null;
  preferences: JourneyPreferences;
}

const clock = (context: Context, value: Instant): string => formatTime(value, context.zone);
const iso = (context: Context, value: Instant): string => toIsoWithOffset(value, context.zone);
const flightProvenance = (flight: Flight): Provenance => (flight.isDemo ? 'demo' : 'official');

function toNote(note: GuideNote): JourneyNote {
  return { id: note.id, title: note.title, body: note.body, provenance: note.provenance, sources: note.sources };
}

/** Airport notes for a topic that apply to this flight, terminal and direction. */
function notesFor(
  context: Context,
  topic: GuideNoteTopic,
  direction: 'departing' | 'arriving',
  flight: Flight | null = context.flight,
): JourneyNote[] {
  return context.content.guidesNotes
    .filter((note) => {
      if (note.topic !== topic) return false;
      const applies = note.appliesTo;
      if (!applies) return true;
      if (applies.direction && applies.direction !== direction) return false;
      if (applies.terminal && applies.terminal !== flight?.terminal) return false;
      if (applies.airline && applies.airline !== flight?.airline.code) return false;
      if (applies.scope) {
        if (!flight) return false;
        if ((applies.scope === 'international') !== isInternationalFlight(flight)) return false;
      }
      if (applies.gatePrefixes) {
        const gate = flight?.gate?.toUpperCase();
        if (!gate || !applies.gatePrefixes.some((prefix) => gate.startsWith(prefix.toUpperCase()))) return false;
      }
      return true;
    })
    .map(toNote);
}

function finalise(drafts: Draft[], now: Instant): JourneyStep[] {
  const time = toDate(now).getTime();
  let current = -1;
  drafts.forEach((draft, index) => {
    if (draft.time && Date.parse(draft.time) <= time) current = index;
  });
  return drafts.map((draft, index) => ({
    ...draft,
    actions: draft.actions ?? [],
    notes: draft.notes ?? [],
    state: index < current ? 'done' : index === current ? 'current' : 'upcoming',
  }));
}

/* ------------------------------------------------------------------------------------------
 * Shared steps
 * --------------------------------------------------------------------------------------- */

function disruptionStep(flight: Flight): Draft {
  const number = formatFlightNumber(flight);
  return {
    id: 'disruption',
    kind: 'disruption',
    title: lt(`Flight ${number} is shown as cancelled`, `Penerbangan ${number} dipaparkan sebagai dibatalkan`),
    body: lt(
      'Contact your airline before you travel to the airport. It can rebook you or explain your options.',
      'Hubungi syarikat penerbangan anda sebelum ke lapangan terbang. Ia boleh menempah semula penerbangan atau menerangkan pilihan anda.',
    ),
    provenance: flightProvenance(flight),
    actions: [
      { labelKey: 'journey.actions.contactAirline', href: '/help/flights' },
      { labelKey: 'journey.actions.viewNotices', href: '/notices' },
    ],
  };
}

function delayStep(context: Context, flight: Flight): Draft {
  const number = formatFlightNumber(flight);
  const time = clock(context, flight.estimated);
  const departing = flight.direction === 'd';
  return {
    id: 'delay',
    kind: 'status',
    title: departing
      ? lt(`Flight ${number} is delayed: new time ${time}`, `Penerbangan ${number} lewat: masa baharu ${time}`)
      : lt(`Flight ${number} is delayed: expected ${time}`, `Penerbangan ${number} lewat: dijangka ${time}`),
    body: departing
      ? lt(
          'Keep to the original check-in times unless your airline tells you otherwise. Times can change again.',
          'Patuhi waktu daftar masuk asal melainkan diberitahu sebaliknya oleh syarikat penerbangan. Masa boleh berubah lagi.',
        )
      : lt('The arrival time can change again. Check the status before you set off.', 'Waktu ketibaan boleh berubah lagi. Semak status sebelum bertolak.'),
    provenance: flightProvenance(flight),
    actions: [{ labelKey: 'journey.actions.viewFlight', href: `/${context.slug}/flights/${flight.id}` }],
  };
}

function terminalStep(context: Context, direction: 'departing' | 'arriving'): Draft {
  const { flight, content } = context;
  const airport = content.airport;
  const notes = notesFor(context, 'terminal', direction);
  if (!flight) {
    return {
      id: 'terminal',
      kind: 'terminal',
      relative: 'journey.relative.beforeYouLeave',
      title: isMultiTerminal(airport)
        ? lt('Check which terminal your flight uses', 'Semak terminal penerbangan anda')
        : lt('Check your flight details', 'Semak butiran penerbangan anda'),
      body: lt(
        'Your booking confirmation shows the airport and terminal. Check it before you set off.',
        'Pengesahan tempahan anda menunjukkan lapangan terbang dan terminal. Semak sebelum bertolak.',
      ),
      provenance: 'suggestion',
      actions: [{ labelKey: 'journey.timeline.addFlight', href: `/${context.slug}/flights` }],
      notes,
    };
  }
  const number = formatFlightNumber(flight);
  const place = remotePlace(flight).city;
  const en = terminalLabel(airport, flight.terminal, 'en');
  const ms = terminalLabel(airport, flight.terminal, 'ms');
  return {
    id: 'terminal',
    kind: 'terminal',
    relative: 'journey.relative.beforeYouLeave',
    title: lt(`Go to ${en}`, `Pergi ke ${ms}`),
    body:
      direction === 'departing'
        ? lt(
            `Flight ${number} to ${place} is shown at ${en}. Confirm the terminal on your booking before you set off.`,
            `Penerbangan ${number} ke ${place} dipaparkan di ${ms}. Sahkan terminal pada tempahan anda sebelum bertolak.`,
          )
        : lt(`Flight ${number} from ${place} is shown at ${en}.`, `Penerbangan ${number} dari ${place} dipaparkan di ${ms}.`),
    provenance: flightProvenance(flight),
    actions: [{ labelKey: 'journey.actions.viewFlight', href: `/${context.slug}/flights/${flight.id}` }],
    notes,
  };
}

function travelStep(context: Context): Draft {
  return {
    id: 'travel',
    kind: 'travel',
    relative: 'journey.relative.onTheWay',
    title: lt('Plan how you will get to the airport', 'Rancang cara anda ke lapangan terbang'),
    body: lt(
      'Compare the ways to reach the terminal and where to park. Allow extra time at busy hours.',
      'Bandingkan cara untuk ke terminal dan tempat meletak kenderaan. Peruntukkan masa tambahan pada waktu sibuk.',
    ),
    provenance: 'suggestion',
    actions: [
      { labelKey: 'journey.actions.viewTransport', href: `/${context.slug}/transport` },
      { labelKey: 'journey.actions.viewParking', href: `/${context.slug}/parking` },
    ],
    notes: notesFor(context, 'getting-there', 'departing'),
  };
}

function assistanceStep(context: Context, direction: 'departing' | 'arriving'): Draft {
  return {
    id: 'assistance',
    kind: 'assistance',
    relative: 'journey.relative.beforeYouLeave',
    title: lt('Arrange any assistance you need', 'Aturkan bantuan yang anda perlukan'),
    body: lt(
      'Ask your airline for assistance as early as you can, ideally when you book. See what the airport offers.',
      'Minta bantuan daripada syarikat penerbangan seawal mungkin, sebaik-baiknya semasa menempah. Lihat perkhidmatan yang ditawarkan oleh lapangan terbang.',
    ),
    provenance: 'suggestion',
    actions: [{ labelKey: 'journey.actions.viewAssistance', href: '/accessibility' }],
    notes: notesFor(context, 'assistance', direction),
  };
}

function gateStep(context: Context, flight: Flight | null, id = 'gate'): Draft {
  const notes = notesFor(context, 'gate', 'departing', flight);
  if (flight?.gate) {
    return {
      id,
      kind: 'gate',
      relative: 'journey.relative.afterSecurity',
      title: lt(`Go to gate ${flight.gate}`, `Pergi ke pintu ${flight.gate}`),
      body: lt(
        `Your gate is ${flight.gate}. Follow the signs and keep checking the screens: gates can change.`,
        `Pintu anda ialah ${flight.gate}. Ikut papan tanda dan terus semak skrin: pintu boleh berubah.`,
      ),
      provenance: flightProvenance(flight),
      actions: [
        {
          labelKey: 'journey.actions.viewGateOnMap',
          href: `/${context.slug}/map?gate=${encodeURIComponent(flight.gate)}&t=${flight.terminal}`,
        },
      ],
      notes,
    };
  }
  return {
    id,
    kind: 'gate',
    relative: 'journey.relative.afterSecurity',
    title: lt('Find your gate', 'Cari pintu anda'),
    body: lt(
      'Your gate is not assigned yet. Gates are usually shown about 90 minutes before departure: check the screens after security.',
      'Pintu anda belum ditetapkan. Pintu biasanya dipaparkan kira-kira 90 minit sebelum berlepas: semak skrin selepas pemeriksaan keselamatan.',
    ),
    provenance: 'estimated',
    actions: [{ labelKey: 'journey.actions.viewMap', href: `/${context.slug}/map` }],
    notes,
  };
}

function boardingStep(context: Context, flight: Flight | null, id = 'boarding'): Draft {
  const notes = notesFor(context, 'boarding', 'departing', flight);
  if (flight?.boardingAt && flight.gateClosesAt) {
    const from = clock(context, flight.boardingAt);
    const closes = clock(context, flight.gateClosesAt);
    return {
      id,
      kind: 'boarding',
      time: flight.boardingAt,
      title: lt(`Board from ${from}`, `Naik pesawat mulai ${from}`),
      body: lt(
        `Boarding is expected from ${from} and the gate closes at ${closes}. Be at the gate before then with your boarding pass and passport or identity card ready.`,
        `Penumpang dijangka menaiki pesawat mulai ${from} dan pintu ditutup pada ${closes}. Berada di pintu sebelum itu dengan pas masuk dan pasport atau kad pengenalan.`,
      ),
      provenance: flight.isDemo ? 'demo' : 'estimated',
      notes,
    };
  }
  return {
    id,
    kind: 'boarding',
    relative: 'journey.relative.beforeBoarding',
    title: lt('Be at the gate before boarding starts', 'Berada di pintu sebelum menaiki pesawat bermula'),
    body: lt(
      'Gates usually close before the departure time. Plan around the boarding time on your boarding pass.',
      'Pintu biasanya ditutup sebelum waktu berlepas. Rancang mengikut waktu menaiki pesawat pada pas masuk anda.',
    ),
    provenance: 'estimated',
    notes,
  };
}

/* ------------------------------------------------------------------------------------------
 * Departing
 * --------------------------------------------------------------------------------------- */

function departingSteps(context: Context): Draft[] {
  const { flight, preferences } = context;
  if (flight?.status === 'cancelled') return [disruptionStep(flight)];

  const international = flight ? isInternationalFlight(flight) : undefined;
  const lead = international === false ? RECOMMENDED_ARRIVAL_MINUTES.domestic : RECOMMENDED_ARRIVAL_MINUTES.international;
  const steps: Draft[] = [];

  if (flight?.status === 'delayed') steps.push(delayStep(context, flight));
  steps.push(terminalStep(context, 'departing'));
  if (preferences.reducedMobility) steps.push(assistanceStep(context, 'departing'));
  steps.push(travelStep(context));

  // Recommended arrival time: estimated unless the airport's content carries an official rule.
  const officialRule = context.content.guidesNotes.find((note) => note.topic === 'arrival-time' && note.provenance === 'official');
  const otherArrivalNotes = notesFor(context, 'arrival-time', 'departing').filter((note) => note.id !== officialRule?.id);
  const arriveBy = flight ? addMinutes(flight.scheduled, -lead) : undefined;
  const generalRule = lt(
    'As a guide, be at the terminal at least 3 hours before an international flight and at least 2 hours before a domestic flight. Your airline sets the check-in deadline: follow its advice.',
    'Sebagai panduan, berada di terminal sekurang-kurangnya 3 jam sebelum penerbangan antarabangsa dan 2 jam sebelum penerbangan domestik. Syarikat penerbangan menetapkan had masa daftar masuk: ikut nasihatnya.',
  );
  steps.push({
    id: 'arrive',
    kind: 'arrive',
    ...(arriveBy ? { time: iso(context, arriveBy) } : { relative: 'journey.relative.atTheAirport' as TKey }),
    title: arriveBy
      ? lt(`Arrive at the airport by ${clock(context, arriveBy)}`, `Tiba di lapangan terbang sebelum ${clock(context, arriveBy)}`)
      : lt('Arrive in good time', 'Tiba lebih awal'),
    body: officialRule
      ? officialRule.body
      : arriveBy && international !== undefined
        ? international
          ? lt(
              `That is 3 hours before your international flight, our recommended minimum. Your airline sets the check-in deadline: follow its advice, especially in peak periods.`,
              `Itu 3 jam sebelum penerbangan antarabangsa anda, iaitu tempoh minimum yang kami sarankan. Syarikat penerbangan menetapkan had masa daftar masuk: ikut nasihatnya, terutama pada musim puncak.`,
            )
          : lt(
              `That is 2 hours before your domestic flight, our recommended minimum. Your airline sets the check-in deadline: follow its advice, especially in peak periods.`,
              `Itu 2 jam sebelum penerbangan domestik anda, iaitu tempoh minimum yang kami sarankan. Syarikat penerbangan menetapkan had masa daftar masuk: ikut nasihatnya, terutama pada musim puncak.`,
            )
        : generalRule,
    provenance: officialRule ? 'official' : 'estimated',
    ...(officialRule ? { sources: officialRule.sources } : {}),
    notes: otherArrivalNotes,
  });

  // Check-in
  const checkInNotes = notesFor(context, 'check-in', 'departing');
  const noBags = preferences.checkedBags === false;
  if (flight && (flight.checkInRow || flight.checkInCounters) && flight.checkInClosesAt) {
    const where = [
      flight.checkInRow ? { en: `Row ${flight.checkInRow}`, ms: `Barisan ${flight.checkInRow}` } : null,
      flight.checkInCounters ? { en: `counters ${flight.checkInCounters}`, ms: `kaunter ${flight.checkInCounters}` } : null,
    ].filter((part): part is { en: string; ms: string } => part !== null);
    const closes = clock(context, flight.checkInClosesAt);
    const number = formatFlightNumber(flight);
    steps.push({
      id: 'check-in',
      kind: 'check-in',
      time: flight.checkInOpensAt,
      title: noBags ? lt('Check in', 'Daftar masuk') : lt('Check in and drop your bags', 'Daftar masuk dan serahkan bagasi'),
      body: lt(
        `Check-in for ${number} is at ${where.map((part) => part.en).join(', ')} and closes at ${closes}.${noBags ? ' If you have checked in online and have no bags to drop, go straight to security.' : ''}`,
        `Daftar masuk untuk ${number} di ${where.map((part) => part.ms).join(', ')} dan ditutup pada ${closes}.${noBags ? ' Jika anda telah daftar masuk dalam talian dan tiada bagasi untuk diserahkan, terus ke pemeriksaan keselamatan.' : ''}`,
      ),
      provenance: flightProvenance(flight),
      notes: checkInNotes,
    });
  } else {
    const opens = flight?.checkInOpensAt;
    steps.push({
      id: 'check-in',
      kind: 'check-in',
      ...(opens ? { time: opens } : { relative: 'journey.relative.atTheAirport' as TKey }),
      title: noBags ? lt('Check in', 'Daftar masuk') : lt('Check in and drop your bags', 'Daftar masuk dan serahkan bagasi'),
      body: lt(
        `Check-in usually opens 2 to 3 hours before departure and closes 45 to 60 minutes before. Check the screens in the departure hall for your row.${noBags ? ' If you have checked in online and have no bags to drop, go straight to security.' : ''}`,
        `Daftar masuk biasanya dibuka 2 hingga 3 jam sebelum berlepas dan ditutup 45 hingga 60 minit sebelum itu. Semak skrin di balai berlepas untuk barisan anda.${noBags ? ' Jika anda telah daftar masuk dalam talian dan tiada bagasi untuk diserahkan, terus ke pemeriksaan keselamatan.' : ''}`,
      ),
      provenance: 'estimated',
      notes: checkInNotes,
    });
  }

  // Security and immigration
  steps.push({
    id: 'security',
    kind: 'security',
    relative: 'journey.relative.afterCheckIn',
    title:
      international === false
        ? lt('Go through security', 'Lalui pemeriksaan keselamatan')
        : lt('Go through immigration and security', 'Lalui imigresen dan pemeriksaan keselamatan'),
    body:
      international === false
        ? lt(
            'Have your boarding pass and identity card ready. Queues vary: allow at least 30 minutes.',
            'Sediakan pas masuk dan kad pengenalan. Tempoh beratur berbeza-beza: peruntukkan sekurang-kurangnya 30 minit.',
          )
        : lt(
            'Have your passport and boarding pass ready. Queues vary: allow at least 45 minutes for immigration and security together.',
            'Sediakan pasport dan pas masuk. Tempoh beratur berbeza-beza: peruntukkan sekurang-kurangnya 45 minit untuk imigresen dan pemeriksaan keselamatan.',
          ),
    provenance: 'estimated',
    notes: [...notesFor(context, 'security', 'departing'), ...notesFor(context, 'immigration', 'departing')],
  });

  steps.push(gateStep(context, flight));

  steps.push({
    id: 'food',
    kind: 'food',
    relative: 'journey.relative.beforeBoarding',
    title: lt('Time to spare? Eat or shop near your gate', 'Ada masa terluang? Makan atau beli-belah berhampiran pintu anda'),
    body: preferences.withChildren
      ? lt(
          'Stay close to your gate and keep an eye on the boarding time. Look for family facilities on the way.',
          'Berada berhampiran pintu anda dan perhatikan waktu menaiki pesawat. Cari kemudahan keluarga di sepanjang laluan.',
        )
      : lt('Stay close to your gate and keep an eye on the boarding time.', 'Berada berhampiran pintu anda dan perhatikan waktu menaiki pesawat.'),
    provenance: 'suggestion',
    actions: [
      { labelKey: 'journey.actions.viewShopDine', href: `/${context.slug}/shop-dine` },
      { labelKey: 'journey.actions.viewFacilities', href: `/${context.slug}/facilities` },
    ],
  });

  steps.push(boardingStep(context, flight));
  return steps;
}

/* ------------------------------------------------------------------------------------------
 * Arriving
 * --------------------------------------------------------------------------------------- */

function landingStep(context: Context, flight: Flight | null): Draft {
  const notes = notesFor(context, 'landing', 'arriving');
  if (!flight) {
    return {
      id: 'landing',
      kind: 'landing',
      relative: 'journey.relative.afterLanding',
      title: lt('After you land', 'Selepas mendarat'),
      body: lt('Follow the signs for arrivals.', 'Ikut papan tanda ke balai ketibaan.'),
      provenance: 'suggestion',
      actions: [{ labelKey: 'journey.timeline.addFlight', href: `/${context.slug}/flights` }],
      notes,
    };
  }
  const number = formatFlightNumber(flight);
  const time = clock(context, flight.estimated);
  const landed = flight.actual !== undefined;
  return {
    id: 'landing',
    kind: 'landing',
    time: flight.estimated,
    title: landed
      ? lt(`Flight ${number} landed at ${time}`, `Penerbangan ${number} mendarat pada ${time}`)
      : lt(`Flight ${number} is expected at ${time}`, `Penerbangan ${number} dijangka tiba pada ${time}`),
    body: lt(
      `From ${flight.origin.city}. Status: ${flightStatusLabel(flight.status, 'en')}. Follow the signs for arrivals.`,
      `Dari ${flight.origin.city}. Status: ${flightStatusLabel(flight.status, 'ms')}. Ikut papan tanda ke balai ketibaan.`,
    ),
    provenance: flightProvenance(flight),
    actions: [{ labelKey: 'journey.actions.viewFlight', href: `/${context.slug}/flights/${flight.id}` }],
    notes,
  };
}

function arrivalImmigrationStep(context: Context): Draft {
  return {
    id: 'immigration',
    kind: 'immigration',
    relative: 'journey.relative.afterLanding',
    title: lt('Clear immigration', 'Lalui imigresen'),
    body: lt(
      'Have your passport ready. Entry requirements depend on your nationality: check them with the Immigration Department of Malaysia before you fly.',
      'Sediakan pasport anda. Syarat kemasukan bergantung pada kewarganegaraan: semak dengan Jabatan Imigresen Malaysia sebelum anda terbang.',
    ),
    provenance: 'estimated',
    notes: notesFor(context, 'immigration', 'arriving'),
  };
}

function baggageStep(context: Context, flight: Flight | null, international: boolean | undefined): Draft {
  const notes = notesFor(context, 'baggage', 'arriving');
  const relative: TKey = international === false ? 'journey.relative.afterLanding' : 'journey.relative.afterImmigration';
  if (flight?.belt) {
    return {
      id: 'baggage',
      kind: 'baggage',
      relative,
      title: lt(`Collect your bags at belt ${flight.belt}`, `Ambil bagasi anda di karusel ${flight.belt}`),
      body: lt(
        `Bags from ${formatFlightNumber(flight)} are shown at belt ${flight.belt}. Check the screens in the baggage hall: belts can change.`,
        `Bagasi dari ${formatFlightNumber(flight)} dipaparkan di karusel ${flight.belt}. Semak skrin di balai bagasi: karusel boleh berubah.`,
      ),
      provenance: flightProvenance(flight),
      notes,
    };
  }
  return {
    id: 'baggage',
    kind: 'baggage',
    relative,
    title: lt('Collect your bags', 'Ambil bagasi anda'),
    body: lt(
      'The belt for your flight is shown on the screens in the baggage hall, usually around the time the aircraft lands.',
      'Karusel untuk penerbangan anda dipaparkan pada skrin di balai bagasi, biasanya sekitar waktu pesawat mendarat.',
    ),
    provenance: 'estimated',
    notes,
  };
}

function arrivingSteps(context: Context): Draft[] {
  const { flight, preferences } = context;
  if (flight?.status === 'cancelled') return [disruptionStep(flight)];
  const international = flight ? isInternationalFlight(flight) : undefined;
  const steps: Draft[] = [];

  if (flight?.status === 'delayed') steps.push(delayStep(context, flight));
  if (preferences.reducedMobility) steps.push(assistanceStep(context, 'arriving'));
  steps.push(landingStep(context, flight));
  if (international !== false) steps.push(arrivalImmigrationStep(context));
  if (preferences.checkedBags !== false) steps.push(baggageStep(context, flight, international));
  if (international !== false) {
    steps.push({
      id: 'customs',
      kind: 'customs',
      relative: 'journey.relative.afterBaggage',
      title: lt('Go through customs', 'Lalui kastam'),
      body: lt(
        'Follow the signs to customs and declare anything you need to. If you are unsure whether something must be declared, ask an officer.',
        'Ikut papan tanda ke kastam dan isytiharkan barang yang perlu. Jika tidak pasti sama ada sesuatu perlu diisytiharkan, tanya pegawai.',
      ),
      provenance: 'estimated',
      notes: notesFor(context, 'customs', 'arriving'),
    });
  }
  steps.push({
    id: 'onward',
    kind: 'onward',
    relative: 'journey.relative.whenReady',
    title: lt('Continue your journey', 'Teruskan perjalanan anda'),
    body: lt(
      'Compare the ways to leave the airport. Use the official counters and ranks, and ignore anyone who approaches you offering a ride.',
      'Bandingkan cara untuk meninggalkan lapangan terbang. Gunakan kaunter dan hentian rasmi, dan abaikan sesiapa yang menawarkan kenderaan secara langsung.',
    ),
    provenance: 'suggestion',
    actions: [
      { labelKey: 'journey.actions.viewTransport', href: `/${context.slug}/transport` },
      { labelKey: 'journey.actions.viewParking', href: `/${context.slug}/parking` },
    ],
    notes: notesFor(context, 'onward-transport', 'arriving'),
  });
  steps.push({
    id: 'meeting-point',
    kind: 'meeting',
    relative: 'journey.relative.whenReady',
    title: lt('Being met? Agree where', 'Ada yang menjemput? Tetapkan tempat bertemu'),
    body: lt(
      'Agree a meeting point in the arrival hall before you fly, and share your flight number so they can follow its status.',
      'Tetapkan tempat bertemu di balai ketibaan sebelum anda terbang, dan kongsi nombor penerbangan supaya mereka boleh mengikuti statusnya.',
    ),
    provenance: 'suggestion',
    actions: [{ labelKey: 'journey.actions.viewMap', href: `/${context.slug}/map` }],
    notes: notesFor(context, 'meeting', 'arriving'),
  });
  return steps;
}

/* ------------------------------------------------------------------------------------------
 * Transiting
 * --------------------------------------------------------------------------------------- */

function transitingSteps(context: Context): Draft[] {
  const { flight, preferences, content } = context;
  if (flight?.status === 'cancelled') return [disruptionStep(flight)];
  const connection = preferences.connection ?? {};
  const onward = connection.onwardFlight ?? null;
  const arrivalTerminal = flight?.terminal;
  const onwardTerminal = connection.onwardTerminal ?? onward?.terminal;
  const changesTerminal = Boolean(arrivalTerminal && onwardTerminal && arrivalTerminal !== onwardTerminal);
  const selfTransfer = connection.type === 'self-transfer';
  const steps: Draft[] = [];

  if (flight?.status === 'delayed') steps.push(delayStep(context, flight));

  steps.push({
    id: 'connection-type',
    kind: 'connection',
    relative: 'journey.relative.beforeYouLeave',
    title:
      connection.type === 'protected'
        ? lt('You are on one booking (a protected connection)', 'Anda dalam satu tempahan (sambungan terlindung)')
        : selfTransfer
          ? lt('You are on separate bookings (a self-transfer)', 'Anda dalam tempahan berasingan (pindah sendiri)')
          : lt('Check what kind of connection you have', 'Semak jenis sambungan anda'),
    body:
      connection.type === 'protected'
        ? lt(
            'With both flights on one ticket, your airline is responsible for the connection and bags are usually checked through to your destination. Confirm this when you check in for the first flight.',
            'Apabila kedua-dua penerbangan dalam satu tiket, syarikat penerbangan bertanggungjawab atas sambungan dan bagasi biasanya didaftar terus ke destinasi. Sahkan perkara ini semasa daftar masuk penerbangan pertama.',
          )
        : selfTransfer
          ? lt(
              'With separate tickets you are responsible for the connection. Expect to clear immigration, collect your bags, and check in again for the next flight. If the first flight is late, the second airline does not have to wait or rebook you.',
              'Dengan tiket berasingan, anda bertanggungjawab atas sambungan. Anda perlu melalui imigresen, mengambil bagasi dan daftar masuk semula untuk penerbangan seterusnya. Jika penerbangan pertama lewat, syarikat penerbangan kedua tidak wajib menunggu atau menempah semula.',
            )
          : lt(
              'One ticket for both flights is a protected connection: the airline looks after it and bags are usually checked through. Separate tickets are a self-transfer: you collect your bags, enter Malaysia and check in again. Ask your airline if you are not sure.',
              'Satu tiket untuk kedua-dua penerbangan ialah sambungan terlindung: syarikat penerbangan menguruskannya dan bagasi biasanya didaftar terus. Tiket berasingan ialah pindah sendiri: anda mengambil bagasi, memasuki Malaysia dan daftar masuk semula. Tanya syarikat penerbangan jika tidak pasti.',
            ),
    provenance: 'estimated',
    actions: [
      { labelKey: 'journey.actions.viewTransitGuide', href: `/${context.slug}/transit` },
      { labelKey: 'journey.actions.contactAirline', href: '/help/flights' },
    ],
  });

  steps.push(landingStep(context, flight));

  if (changesTerminal) {
    const fromEn = terminalLabel(content.airport, arrivalTerminal, 'en');
    const toEn = terminalLabel(content.airport, onwardTerminal, 'en');
    const fromMs = terminalLabel(content.airport, arrivalTerminal, 'ms');
    const toMs = terminalLabel(content.airport, onwardTerminal, 'ms');
    steps.push({
      id: 'transfer',
      kind: 'transfer',
      relative: 'journey.relative.betweenFlights',
      title: lt(`Transfer from ${fromEn} to ${toEn}`, `Berpindah dari ${fromMs} ke ${toMs}`),
      body: lt(
        `${fromEn} and ${toEn} are separate buildings. Clear immigration, collect any bags that are not checked through, travel between the terminals, then check in or drop bags at ${toEn}. See the transport page for the current ways to travel between terminals.`,
        `${fromMs} dan ${toMs} ialah bangunan berasingan. Lalui imigresen, ambil bagasi yang tidak didaftar terus, bergerak antara terminal, kemudian daftar masuk atau serahkan bagasi di ${toMs}. Rujuk halaman pengangkutan untuk cara semasa bergerak antara terminal.`,
      ),
      provenance: 'estimated',
      actions: [
        { labelKey: 'journey.actions.viewTransport', href: `/${context.slug}/transport` },
        { labelKey: 'journey.actions.viewTransitGuide', href: `/${context.slug}/transit` },
      ],
      notes: notesFor(context, 'transit', 'arriving'),
    });
  } else if (selfTransfer) {
    steps.push({
      id: 'transfer',
      kind: 'transfer',
      relative: 'journey.relative.betweenFlights',
      title: lt('Collect your bags and check in again', 'Ambil bagasi dan daftar masuk semula'),
      body: lt(
        'Clear immigration, collect your bags and go through customs. Then go up to the departure hall and check in for your next flight as a new passenger.',
        'Lalui imigresen, ambil bagasi dan lalui kastam. Kemudian naik ke balai berlepas dan daftar masuk untuk penerbangan seterusnya sebagai penumpang baharu.',
      ),
      provenance: 'estimated',
      actions: [{ labelKey: 'journey.actions.viewMap', href: `/${context.slug}/map` }],
      notes: notesFor(context, 'transit', 'arriving'),
    });
  } else {
    steps.push({
      id: 'transfer',
      kind: 'transfer',
      relative: 'journey.relative.betweenFlights',
      title: lt('Follow the transfer signs', 'Ikut papan tanda pemindahan'),
      body: lt(
        'On a protected connection in the same terminal you normally stay airside. Follow the signs for transfers, pass any transfer security check, and look for your next gate on the screens.',
        'Bagi sambungan terlindung di terminal yang sama, anda biasanya kekal di kawasan udara. Ikut papan tanda pemindahan, lalui pemeriksaan keselamatan pemindahan jika ada, dan cari pintu seterusnya pada skrin.',
      ),
      provenance: 'estimated',
      actions: [{ labelKey: 'journey.actions.viewMap', href: `/${context.slug}/map` }],
      notes: notesFor(context, 'transit', 'arriving'),
    });
  }

  const available = flight && onward ? minutesBetween(flight.estimated, onward.estimated) : undefined;
  const guideEn =
    'As a rough guide, allow at least 90 minutes for a protected connection in the same terminal, and 3 to 4 hours for a self-transfer or a change of terminal. Airlines set the minimum connection time: check with yours.';
  const guideMs =
    'Sebagai panduan kasar, peruntukkan sekurang-kurangnya 90 minit untuk sambungan terlindung di terminal yang sama, dan 3 hingga 4 jam untuk pindah sendiri atau pertukaran terminal. Syarikat penerbangan menetapkan masa sambungan minimum: semak dengan syarikat penerbangan anda.';
  steps.push({
    id: 'connection-time',
    kind: 'connection-time',
    relative: 'journey.relative.betweenFlights',
    title:
      available !== undefined && available > 0
        ? lt(`You have about ${formatDuration(available, 'en')} between flights`, `Anda ada kira-kira ${formatDuration(available, 'ms')} antara penerbangan`)
        : lt('Allow enough time between flights', 'Peruntukkan masa yang cukup antara penerbangan'),
    body: lt(guideEn, guideMs),
    provenance: 'estimated',
    actions: [{ labelKey: 'journey.actions.contactAirline', href: '/help/flights' }],
  });

  steps.push({
    id: 'rest',
    kind: 'rest',
    relative: 'journey.relative.betweenFlights',
    title: lt('Rest, eat or freshen up', 'Berehat, makan atau segarkan diri'),
    body: lt(
      'If you have time, find a lounge, somewhere to eat or a quiet place to rest. Keep an eye on the time and the screens.',
      'Jika ada masa, cari lounge, tempat makan atau tempat tenang untuk berehat. Perhatikan masa dan skrin.',
    ),
    provenance: 'suggestion',
    actions: [
      { labelKey: 'journey.actions.viewFacilities', href: `/${context.slug}/lounges` },
      { labelKey: 'journey.actions.viewShopDine', href: `/${context.slug}/shop-dine` },
    ],
  });

  if (onward) {
    steps.push(gateStep(context, onward, 'onward-gate'));
    steps.push(boardingStep(context, onward, 'onward-boarding'));
  } else {
    steps.push(gateStep(context, null, 'onward-gate'));
  }
  return steps;
}

/* ------------------------------------------------------------------------------------------
 * Meeting someone
 * --------------------------------------------------------------------------------------- */

function meetingSteps(context: Context): Draft[] {
  const { flight } = context;
  if (flight?.status === 'cancelled') return [disruptionStep(flight)];
  const international = flight ? isInternationalFlight(flight) : undefined;
  const steps: Draft[] = [];

  if (flight) {
    const number = formatFlightNumber(flight);
    const time = clock(context, flight.estimated);
    steps.push({
      id: 'status',
      kind: 'status',
      time: flight.estimated,
      title: lt(
        `Flight ${number} from ${flight.origin.city}: ${flightStatusLabel(flight.status, 'en')}`,
        `Penerbangan ${number} dari ${flight.origin.city}: ${flightStatusLabel(flight.status, 'ms')}`,
      ),
      body:
        flight.actual !== undefined
          ? lt(`Landed at ${time}. Keep this page open for updates.`, `Mendarat pada ${time}. Biarkan halaman ini terbuka untuk kemas kini.`)
          : lt(
              `Expected at ${time}. The time can change: check again before you leave.`,
              `Dijangka tiba pada ${time}. Masa boleh berubah: semak semula sebelum bertolak.`,
            ),
      provenance: flightProvenance(flight),
      actions: [{ labelKey: 'journey.actions.viewFlight', href: `/${context.slug}/flights/${flight.id}` }],
    });
  } else {
    steps.push({
      id: 'status',
      kind: 'status',
      relative: 'journey.relative.beforeTheyLand',
      title: lt('Follow the flight', 'Ikuti status penerbangan'),
      body: lt(
        'Ask for the flight number, then check its status before you leave home.',
        'Dapatkan nombor penerbangan, kemudian semak statusnya sebelum bertolak dari rumah.',
      ),
      provenance: 'suggestion',
      actions: [{ labelKey: 'journey.timeline.addFlight', href: `/${context.slug}/flights` }],
    });
  }

  steps.push({
    id: 'parking',
    kind: 'parking',
    relative: 'journey.relative.beforeTheyLand',
    title: lt('Decide where to park or wait', 'Tentukan tempat meletak kenderaan atau menunggu'),
    body: lt(
      'Check the car parks before you set off. Do not wait at the kerb: it is for picking up and dropping off only.',
      'Semak tempat letak kereta sebelum bertolak. Jangan menunggu di tepi laluan: ia hanya untuk mengambil dan menurunkan penumpang.',
    ),
    provenance: 'suggestion',
    actions: [
      { labelKey: 'journey.actions.viewParking', href: `/${context.slug}/parking` },
      { labelKey: 'journey.actions.viewTransport', href: `/${context.slug}/transport` },
    ],
    notes: notesFor(context, 'getting-there', 'arriving'),
  });

  steps.push({
    id: 'wait',
    kind: 'wait',
    relative: 'journey.relative.whileYouWait',
    title: lt('Wait in the arrival hall', 'Tunggu di balai ketibaan'),
    body: lt(
      'Passengers come out into the public arrival hall after baggage reclaim and customs. Agree a meeting point in advance.',
      'Penumpang keluar ke balai ketibaan awam selepas mengambil bagasi dan melalui kastam. Tetapkan tempat bertemu lebih awal.',
    ),
    provenance: 'suggestion',
    actions: [{ labelKey: 'journey.actions.viewMap', href: `/${context.slug}/map` }],
    notes: notesFor(context, 'meeting', 'arriving'),
  });

  if (flight) {
    const from = international ? 30 : 15;
    const to = international ? 60 : 30;
    const earliest = addMinutes(flight.estimated, from);
    steps.push({
      id: 'expect',
      kind: 'meeting',
      time: iso(context, earliest),
      title: lt(`Expect them from about ${clock(context, earliest)}`, `Jangkakan mereka keluar mulai kira-kira ${clock(context, earliest)}`),
      body: international
        ? lt(
            `After an international flight lands, allow about ${from} to ${to} minutes for immigration, baggage and customs. It can take longer at busy times.`,
            `Selepas penerbangan antarabangsa mendarat, peruntukkan kira-kira ${from} hingga ${to} minit untuk imigresen, bagasi dan kastam. Ia boleh mengambil masa lebih lama pada waktu sibuk.`,
          )
        : lt(
            `After a domestic flight lands, allow about ${from} to ${to} minutes for passengers to leave the aircraft and collect bags.`,
            `Selepas penerbangan domestik mendarat, peruntukkan kira-kira ${from} hingga ${to} minit untuk penumpang turun dari pesawat dan mengambil bagasi.`,
          ),
      provenance: 'estimated',
    });
  }
  return steps;
}

/**
 * Build the journey timeline for a mode.
 *
 * - `departing`: terminal, getting there and parking, recommended arrival time, check-in,
 *   security and immigration, gate, food and shops, boarding.
 * - `arriving`: landing, immigration, baggage belt, customs, onward transport, meeting point.
 * - `transiting`: connection type, landing, transfer route (same terminal or Terminal 1 to
 *   Terminal 2), connection-time guidance, rest, onward gate and boarding.
 * - `meeting`: live status, parking, where to wait, when to expect them.
 *
 * A cancelled flight returns a single `disruption` step. Timed steps are in chronological
 * order; untimed steps sit where they logically belong.
 *
 * @example
 * const steps = buildJourney({ flight, mode: 'departing', airportContent, now });
 */
export function buildJourney(input: BuildJourneyInput): JourneyStep[] {
  const context: Context = {
    content: input.airportContent,
    slug: input.airportContent.airport.slug,
    zone: input.airportContent.airport.timezone,
    flight: input.flight ?? null,
    preferences: input.preferences ?? {},
  };
  const drafts =
    input.mode === 'departing'
      ? departingSteps(context)
      : input.mode === 'arriving'
        ? arrivingSteps(context)
        : input.mode === 'transiting'
          ? transitingSteps(context)
          : meetingSteps(context);
  return finalise(drafts, input.now);
}
