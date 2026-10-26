// The engine composes a raw action with the Engagement Director so every action
// immediately advances quests, stories, the Pulse, achievements and history.
import { directEngagement } from '../engagement/EngagementDirector';
import { applyAction, type Action } from './actions';
import { dayKey } from './rng';
import type { ActionResult, GameState } from './types';

export function dispatch(state: GameState, action: Action, now: number): ActionResult {
  const res = applyAction(state, action, now);
  if (res.error) return res;
  // Idle tick: nothing changed. Only the daily Pulse rollover needs attention.
  if (res.state === state) {
    if (!(state.tutorial.done && state.pulse?.day !== dayKey(now))) return res;
    const s = structuredClone(state);
    return { state: s, events: directEngagement(s, [], now) };
  }
  // A tick after every action resolves arrivals and order refills caused by it.
  let { state: s, events } = res;
  if (action.type !== 'tick' && action.type !== 'sessionStart') {
    const t = applyAction(s, { type: 'tick' }, now);
    s = t.state;
    events = [...events, ...t.events];
  }
  const follow = directEngagement(s, events, now);
  return { state: s, events: [...events, ...follow] };
}

export type { Action };
