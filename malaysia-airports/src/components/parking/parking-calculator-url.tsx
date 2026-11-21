'use client';

import { useSearchParams } from 'next/navigation';
import { ParkingCalculator, type CalculatorInitial } from './parking-calculator';
import { stampFromIso } from './parking-logic';
import type { ParkingPageData } from './parking-types';

/**
 * The calculator with entry and exit from the link: journey and flight pages send
 * `?from=<ISO>&to=<ISO>` (B-13), shown here in airport time. It reads `useSearchParams`: render it
 * inside `<Suspense>` with the plain `<ParkingCalculator>` as the fallback.
 */
export function ParkingCalculatorFromUrl({ data }: { data: ParkingPageData }) {
  const params = useSearchParams();
  const entry = stampFromIso(params.get('from'), data.timezone);
  const exit = stampFromIso(params.get('to'), data.timezone);
  const initial: CalculatorInitial = {};
  if (entry) initial.entry = entry;
  if (entry && exit) initial.exit = exit;
  // A new link means new dates: remount rather than keep the dates typed for the last one.
  return <ParkingCalculator key={`${entry?.date}${entry?.time}${exit?.date}${exit?.time}`} data={data} initial={initial} />;
}
