// Privacy-conscious, local-only product analytics. Events are kept in a capped
// in-browser ring buffer for the developer inspector; nothing is transmitted.
// A future backend transport must respect `settings.analyticsConsent`.
import type { GameEvent } from '../game/core/types';

export interface AnalyticsEvent {
  t: number;
  name: string;
  props: Record<string, string | number | boolean>;
}

const KEY = 'pockethood.analytics';
const CAP = 500;

/** Map gameplay events to funnel / engagement analytics names (no personal data). */
export function toAnalytics(e: GameEvent): AnalyticsEvent['props'] & { name: string } | null {
  switch (e.type) {
    case 'QUEST_COMPLETED':
      return { name: e.quest.startsWith('welcome') || e.quest === 'meet_luna' ? `tutorial_${e.quest}` : 'quest_completed', quest: e.quest };
    case 'BUILDING_CONSTRUCTED':
      return { name: 'building_constructed', building: e.building };
    case 'BUILDING_UPGRADED':
      return { name: 'building_upgraded', building: e.building, level: e.level };
    case 'RESOURCE_COLLECTED':
      return { name: 'resource_collected', coins: e.coins, goods: Object.values(e.items).reduce((a, b) => a + b, 0) };
    case 'ORDER_COMPLETED':
      return { name: 'order_completed', resident: e.order.resident };
    case 'RESIDENT_INTERACTED':
      return { name: 'resident_interacted', resident: e.resident };
    case 'STORY_MILESTONE_COMPLETED':
      return { name: 'story_milestone', chapter: e.chapter };
    case 'DECORATION_PLACED':
      return { name: 'creative_customization', item: e.building };
    case 'PHOTO_TAKEN':
      return { name: 'photo_taken' };
    case 'COMMUNITY_PROJECT_CONTRIBUTED':
      return { name: 'community_contribution', stage: e.stage };
    case 'PULSE_TASK_DONE':
      return { name: 'pulse_task_done', task: e.task.split(':')[1] ?? e.task };
    case 'LEVEL_UP':
      return { name: 'level_up', level: e.level };
    case 'DISTRICT_UNLOCKED':
      return { name: 'district_unlocked' };
    default:
      return null;
  }
}

class Analytics {
  private buffer: AnalyticsEvent[] = [];
  enabled = true;

  constructor() {
    try {
      this.buffer = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
      this.buffer = [];
    }
  }

  track(name: string, props: AnalyticsEvent['props'] = {}) {
    if (!this.enabled) return;
    this.buffer.push({ t: Date.now(), name, props });
    if (this.buffer.length > CAP) this.buffer.splice(0, this.buffer.length - CAP);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.buffer));
    } catch {
      /* storage full or unavailable: analytics is best-effort */
    }
  }

  fromGameEvents(events: GameEvent[]) {
    for (const e of events) {
      const a = toAnalytics(e);
      if (a) {
        const { name, ...props } = a;
        this.track(name, props);
      }
    }
  }

  list() {
    return [...this.buffer].reverse();
  }

  clear() {
    this.buffer = [];
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}

export const analytics = typeof localStorage !== 'undefined' ? new Analytics() : (null as unknown as Analytics);
