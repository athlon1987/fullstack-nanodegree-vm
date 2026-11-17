/**
 * Calendar files (.ics, RFC 5545) for a flight, generated in the browser. Pure: the caller
 * passes the current instant for DTSTAMP and the translated copy.
 *
 * Every event is marked as demonstration data in its title and description, because every
 * flight in this prototype is simulated.
 */
import { getAirport, terminalLabel } from '@/content/airports';
import type { Lang } from '@/content/types';
import { flightStatusMeta, formatFlightNumber, type Flight } from '@/lib/flights';
import type { Translator } from '@/lib/i18n/translate';
import { addMinutes, toDate, type Instant } from '@/lib/time';

/** One calendar event. */
export interface CalendarEvent {
  uid: string;
  start: Instant;
  end: Instant;
  /** When the file was made (DTSTAMP). */
  stamp: Instant;
  summary: string;
  description: string;
  location?: string;
  url?: string;
}

export const ICS_PRODUCT_ID = '-//Malaysia Airports concept prototype//Flights//EN';

/** UTC date-time in the basic format: `20261117T060500Z`. */
export function formatIcsDate(value: Instant): string {
  return toDate(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** Escape a TEXT value: backslash, semicolon, comma and line breaks. */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

const encoder = new TextEncoder();

/** Fold a content line at 75 octets, continuing with CRLF and one space, never inside a character. */
export function foldIcsLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      // Continuation lines start with a space, which counts towards the 75.
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** A complete VCALENDAR with one VEVENT, lines folded, CRLF line endings. */
export function buildIcs(event: CalendarEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${ICS_PRODUCT_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatIcsDate(event.stamp)}`,
    `DTSTART:${formatIcsDate(event.start)}`,
    `DTEND:${formatIcsDate(event.end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}

/** Options for `flightCalendarEvent`. */
export interface FlightCalendarOptions {
  t: Translator;
  lang: Lang;
  /** Absolute URL of the flight page. */
  url: string;
  /** Now, from the event handler that builds the file. */
  stamp: Instant;
}

/**
 * The event for a flight: a departure spans the flight (one hour when its length is unknown);
 * an arrival is a 30-minute slot at the expected landing time, for whoever is meeting it.
 */
export function flightCalendarEvent(flight: Flight, { t, lang, url, stamp }: FlightCalendarOptions): CalendarEvent {
  const airport = getAirport(flight.airport);
  const number = formatFlightNumber(flight);
  const start = flight.estimated;
  const minutes = flight.direction === 'd' ? (flight.durationMinutes ?? 60) : 30;
  const terminal = airport ? terminalLabel(airport, flight.terminal, lang) : flight.terminal;
  const summary =
    flight.direction === 'd'
      ? t('flightPages.calendar.summaryDeparture', { number, origin: flight.origin.city, destination: flight.destination.city })
      : t('flightPages.calendar.summaryArrival', { number, origin: flight.origin.city, destination: flight.destination.city });
  const checkIn = [
    flight.checkInRow ? t('flightPages.detail.checkInRow', { row: flight.checkInRow }) : null,
    flight.checkInCounters ? t('flightPages.detail.checkInCounters', { counters: flight.checkInCounters }) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const description = [
    t('flightPages.calendar.demoLine'),
    t('flightPages.calendar.status', { status: t(flightStatusMeta(flight.status).i18nKey) }),
    t('flightPages.calendar.terminal', { terminal }),
    flight.direction === 'd' && checkIn ? t('flightPages.calendar.checkIn', { checkIn }) : null,
    flight.direction === 'd' && flight.gate ? t('flightPages.calendar.gate', { gate: flight.gate }) : null,
    flight.direction === 'a' && flight.belt ? t('flightPages.calendar.belt', { belt: flight.belt }) : null,
    t('flightPages.calendar.link', { url }),
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
  return {
    uid: `${flight.id}-${flight.airport}@malaysia-airports-prototype`,
    start,
    end: addMinutes(start, minutes),
    stamp,
    summary,
    description,
    location: airport ? `${airport.name}, ${terminal}` : undefined,
    url,
  };
}

/** File name for the download: `mh2610-20261117-d.ics`. */
export function icsFileName(flight: Pick<Flight, 'id'>): string {
  return `${flight.id}.ics`;
}
