/**
 * Check-in desks in words, shared by the status card and the journey timeline so the two can
 * never disagree (ux-frequent-08): "Economy: Row H, counters 1-18", "Business: Row D, counters
 * 4-12", "Bag drop: F, G". Pure; both languages.
 */
import type { LocalizedText } from '@/content/types';
import type { CheckInCabin, CheckInDesk, Flight } from './types';

/** Local helper (type-only import keeps zod and the content schemas out of client bundles). */
const lt = (en: string, ms: string): LocalizedText => ({ en, ms });

const CABINS: Record<CheckInCabin, LocalizedText> = {
  economy: lt('Economy', 'Ekonomi'),
  business: lt('Business', 'Perniagaan'),
  first: lt('First', 'Kelas Pertama'),
};

/** The desks of a flight: `checkInDesks`, or the single `checkInRow` and `checkInCounters`. */
export function checkInDesks(flight: Pick<Flight, 'checkInDesks' | 'checkInRow' | 'checkInCounters'>): CheckInDesk[] {
  if (flight.checkInDesks && flight.checkInDesks.length > 0) return flight.checkInDesks;
  if (flight.checkInRow || flight.checkInCounters) return [{ row: flight.checkInRow ?? '', counters: flight.checkInCounters }];
  return [];
}

function deskText(desk: CheckInDesk): LocalizedText {
  const en: string[] = [];
  const ms: string[] = [];
  if (desk.row) {
    en.push(`Row ${desk.row}`);
    ms.push(`Baris ${desk.row}`);
  }
  if (desk.counters) {
    en.push(desk.row ? `counters ${desk.counters}` : `Counters ${desk.counters}`);
    ms.push(desk.row ? `kaunter ${desk.counters}` : `Kaunter ${desk.counters}`);
  }
  const body = lt(en.join(', '), ms.join(', '));
  if (!desk.cabin) return body;
  const cabin = CABINS[desk.cabin];
  return lt(`${cabin.en}: ${body.en}`, `${cabin.ms}: ${body.ms}`);
}

/**
 * Up to three short lines: one per desk (labelled with its cabin when the source gives one),
 * then the bag drop rows. Empty when nothing is known yet.
 */
export function checkInLines(flight: Pick<Flight, 'checkInDesks' | 'checkInRow' | 'checkInCounters' | 'bagDrop'>): LocalizedText[] {
  const lines = checkInDesks(flight)
    .slice(0, 2)
    .map(deskText)
    .filter((line) => line.en.length > 0);
  if (flight.bagDrop && flight.bagDrop.length > 0) {
    const rows = flight.bagDrop.join(', ');
    lines.push(lt(`Bag drop: ${rows}`, `Serahan bagasi: ${rows}`));
  }
  return lines.slice(0, 3);
}
