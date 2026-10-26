// Resident relationships: dialogue selection, memories, gifts and story eligibility.
import { ITEMS } from '../../data/items';
import { STORIES } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { hashString, rng } from '../core/rng';
import type { DayPhase, GameState, ResidentState, StoryChapterDef } from '../core/types';
import { friendshipLevel, isOperational } from '../economy/economy';

export function eligibleChapter(state: GameState, r: ResidentState): StoryChapterDef | null {
  if (r.storyActive) return null;
  const lvl = friendshipLevel(r.friendship);
  for (const ch of STORIES) {
    if (ch.resident !== r.id || r.storyDone.includes(ch.id)) continue;
    const q = ch.requires;
    if (q?.chapter && !r.storyDone.includes(q.chapter)) continue;
    if (q?.quest && !state.quests.done.includes(q.quest)) continue;
    if (q?.building && !state.buildings.some((b) => b.type === q.building && isOperational(b))) continue;
    if (q?.level && state.level < q.level) continue;
    if (lvl < ch.minFriendship) return null; // chapters are sequential; wait for friendship
    return ch;
  }
  return null;
}

export const activeChapter = (r: ResidentState) => (r.storyActive ? STORIES.find((s) => s.id === r.storyActive!.id) ?? null : null);

/**
 * Pick what a resident says. Priority: story hooks, then a remembered shared
 * moment (so history visibly matters), then greeting/small talk for their friendship level.
 */
export function chooseLine(state: GameState, r: ResidentState, phase: DayPhase, now: number): string {
  const def = RESIDENTS[r.id];
  const lvl = friendshipLevel(r.friendship);
  const roll = rng(state.seed ^ hashString(`${r.id}:${Math.floor(now / 60_000)}`));
  const memories = def.memoryLines.filter((l) => l.memory && r.memories[l.memory]);
  if (memories.length && roll() < 0.5) return memories[Math.floor(roll() * memories.length)].text;
  const fits = (l: { minLevel?: number; phase?: DayPhase }) => (l.minLevel ?? 0) <= lvl && (!l.phase || l.phase === phase);
  const greet = def.greetings.filter(fits);
  const talk = def.smallTalk.filter(fits);
  // Prefer the newest unlocked small talk, so friendship growth shows up in conversation.
  const newest = talk.filter((l) => (l.minLevel ?? 0) === Math.max(...talk.map((t) => t.minLevel ?? 0)));
  const pool = roll() < 0.35 && greet.length ? greet : roll() < 0.6 && newest.length ? newest : talk.length ? talk : greet;
  return pool[Math.floor(roll() * pool.length)]?.text ?? 'Hello!';
}

export function giftReaction(residentId: string, item: string): { reaction: 'love' | 'like' | 'neutral'; points: number } {
  const def = RESIDENTS[residentId];
  if (def.favorites.includes(item)) return { reaction: 'love', points: 8 };
  if (ITEMS[item]?.kind === 'good' && ITEMS[item].value >= 20) return { reaction: 'like', points: 4 };
  return { reaction: 'neutral', points: 2 };
}

export const OPENED_MEMORY: Record<string, string> = {
  cafe: 'opened_cafe',
  bakery: 'opened_bakery',
  garden: 'opened_garden',
  workshop: 'opened_workshop',
  park: 'opened_park',
};
