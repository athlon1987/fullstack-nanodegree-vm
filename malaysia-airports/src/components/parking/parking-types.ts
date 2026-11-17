/**
 * Serialisable shapes for the parking page's Client Components. Client-safe: types only.
 */
import type { CarPark, Provenance, Source, TerminalId } from '@/content/types';
import type { NoteView, TerminalInfo } from '@/components/transport/transport-types';

/** A car park in the page language, with everything the calculator and the cards need. */
export interface CarParkView extends Pick<CarPark, 'rates' | 'rateStatus' | 'dailyMax' | 'graceMinutes' | 'type' | 'bays' | 'baysQualifier' | 'accessibleBays' | 'evCharging' | 'bookingUrl' | 'asOf'> {
  id: string;
  name: string;
  terminal?: TerminalId;
  description?: string;
  walk?: { minutes?: number; note?: string };
  payment?: string[];
  features: string[];
  provenance: Provenance;
  sourceIds: string[];
  /** Where to check rates: the booking page, else the car park's official source, else the airport site. */
  officialUrl: string;
}

/** Everything the parking page passes to its Client Components. */
export interface ParkingPageData {
  slug: string;
  airportName: string;
  timezone: string;
  terminals: TerminalInfo[];
  carParks: CarParkView[];
  sources: Record<string, Source>;
  /** The official parking or booking page, for the rates callout. */
  officialUrl: string;
  /** Advice that applies to premium car parks (for KLIA: avoid Preferred Parking for long stays). */
  premiumWarning?: NoteView;
}
