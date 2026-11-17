'use client';

import { useSearchParams } from 'next/navigation';
import type { TransitData } from './transit-data.server';
import { parseTransitQuery } from './transit-logic';
import { TransitPlanner } from './transit-planner';

/** Reads the planner state from the URL. Render inside `<Suspense>` with the default planner as fallback. */
export function TransitPlannerFromUrl({ data }: { data: TransitData }) {
  const params = useSearchParams();
  return <TransitPlanner data={data} initial={parseTransitQuery(params)} />;
}
