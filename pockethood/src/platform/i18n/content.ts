// Content-aware translation: params named after content (building, resident, item, …) hold
// ids, resolved to names in the viewer's language at display time. History, Pulse tasks,
// goals and engine errors are stored this way so a language switch applies retroactively.
import { BUILDINGS } from '../../data/buildings';
import { ITEMS } from '../../data/items';
import { ACHIEVEMENTS, COMMUNITY_PROJECTS, EXPANSIONS, STORIES } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { WORLD } from '../../data/world';
import { PETS } from '../../data/pets';
import { L } from '../content/install';
import { getLang, t, type Params } from './index';

type Raw = Record<string, string | number | undefined> | undefined;

export function resolveParams(params: Raw): Params {
  const out: Params = { ...params };
  if (!params) return out;
  const p = params as Record<string, string | number>;
  if (p.building !== undefined) out.building = BUILDINGS[p.building]?.name || t('common.unknownBuilding');
  if (p.resident !== undefined) out.resident = RESIDENTS[p.resident]?.name ?? t('common.unknownResident');
  if (p.item !== undefined) out.item = ITEMS[p.item]?.name ?? t('common.unknownItem');
  if (p.achievement !== undefined) out.achievement = ACHIEVEMENTS.find((a) => a.id === p.achievement)?.name ?? String(p.achievement);
  if (p.plot !== undefined) out.plot = EXPANSIONS.find((e) => e.id === p.plot)?.name ?? String(p.plot);
  if (p.project !== undefined) out.project = COMMUNITY_PROJECTS.find((x) => x.id === p.project)?.name ?? t('history.aProject');
  if (p.chapter !== undefined) {
    const ch = STORIES.find((c) => c.id === p.chapter);
    out.chapter = ch?.title ?? String(p.chapter);
    out.change = ch?.worldChange ?? '';
  }
  if (p.friend !== undefined) out.friend = t(`common.friend.${p.friend}`);
  if (p.fish !== undefined) out.fish = t(`zen.fish.${p.fish}`);
  if (p.pet !== undefined) out.pet = L(PETS.find((x) => x.id === p.pet)?.name, getLang()) || String(p.pet);
  return out;
}

/** Translate a key whose params may reference content ids. */
export function tc(key: string, params?: Raw): string {
  if (key === 'history.start' && params?.world === WORLD.id) return WORLD.history;
  return t(key, resolveParams(params));
}

/** "coins:5" / "item:planks:2" tokens (community log) → localised text. */
export function tokenText(token: string): string {
  const [kind, a, b] = token.split(':');
  if (kind === 'coins' && a) return t('common.coinsN', { n: Number(a) });
  if (kind === 'item' && a && b) return t('common.itemN', { n: Number(b), item: ITEMS[a]?.name ?? t('common.unknownItem') });
  return token;
}
