'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTerminalFilter } from '@/components/airport/use-terminal-filter';
import type { TransportPriority } from '@/lib/transport';
import { DEFAULT_PLANNER_STATE, PRIORITIES, TransportPlanner, type PlannerState } from './transport-planner';
import type { PlannerData } from './transport-types';

const isPriority = (value: string | null): value is TransportPriority => PRIORITIES.includes(value as TransportPriority);

/**
 * The planner with its choices in the URL (`?to=KL Sentral&by=time&view=table`, plus the
 * airport's `?t=T1` terminal filter), so a comparison can be shared and survives a reload.
 * It reads `useSearchParams`: render it inside `<Suspense>` with `<TransportPlanner>` and the
 * default state as the fallback, which is also what visitors without JavaScript see.
 */
export function TransportPlannerFromUrl(props: PlannerData) {
  const params = useSearchParams();
  const { terminal, hrefFor } = useTerminalFilter(props.context.slug);
  const by = params.get('by');
  // The latest choice is kept locally too, so the controls answer at once while the router catches up.
  const [local, setLocal] = useState<PlannerState | null>(null);
  const fromUrl: PlannerState = {
    place: params.get('to') ?? undefined,
    priority: isPriority(by) ? by : DEFAULT_PLANNER_STATE.priority,
    view: params.get('view') === 'table' ? 'table' : 'cards',
  };
  const state = local ?? fromUrl;

  const onStateChange = (next: PlannerState) => {
    setLocal(next);
    const query = new URLSearchParams(params);
    const write = (name: string, value: string | undefined, fallback?: string) => {
      if (value && value !== fallback) query.set(name, value);
      else query.delete(name);
    };
    write('to', next.place);
    write('by', next.priority, DEFAULT_PLANNER_STATE.priority);
    write('view', next.view, DEFAULT_PLANNER_STATE.view);
    const suffix = query.toString();
    // Next.js keeps useSearchParams in step with the History API; no server round trip is needed.
    // Pass null as the state: Next.js skips syncing when the state carries its own router marker.
    window.history.replaceState(null, '', `${window.location.pathname}${suffix ? `?${suffix}` : ''}${window.location.hash}`);
  };

  return <TransportPlanner {...props} state={state} onStateChange={onStateChange} terminal={terminal} allTerminalsHref={terminal ? hrefFor(undefined) : undefined} />;
}
