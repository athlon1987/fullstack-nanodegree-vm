'use client';

import { useTerminalFilter } from '@/components/airport/use-terminal-filter';
import { CarParkList } from './car-park-list';
import type { ParkingPageData } from './parking-types';

/**
 * The car park list with the airport's terminal filter from the URL (`?t=T1`). It reads
 * `useSearchParams`: render it inside `<Suspense>` with the unfiltered `<CarParkList>` as fallback.
 */
export function CarParkListFromUrl({ data }: { data: ParkingPageData }) {
  const { terminal, hrefFor } = useTerminalFilter(data.slug);
  return <CarParkList data={data} terminal={terminal} allHref={terminal ? hrefFor(undefined) : undefined} />;
}
