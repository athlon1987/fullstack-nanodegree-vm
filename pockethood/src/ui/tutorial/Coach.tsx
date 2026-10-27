// Guided first session. Each hint is derived from the active tutorial quest AND
// the live UI state, so it always points at the exact next action — and waits
// for the player to actually do it.
import { useEffect, useState } from 'react';
import { BUILDINGS } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { QUESTS } from '../../data/progression';
import { finishedJobs, hasItems, passiveReady } from '../../game/economy/economy';
import { useT } from '../../platform/i18n';
import { objectiveProgress } from '../../game/engagement/objectives';
import { buildingCenter } from '../../rendering/scene/coords';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { Portrait } from '../components/Panel';
import { safeGet, safeSet } from '../../utils/safeStorage';

interface Hint {
  text: string;
  why?: string;
  target?: string;
  /** Building uid to mark in the world (arrow + camera focus). */
  uid?: string;
}

function useHint(): (Hint & { giver?: string }) | null {
  const t = useT();
  const g = useGame((s) => s.game!);
  const ui = useGame((s) => s.ui);
  const [, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((x) => x + 1), 500);
    return () => window.clearInterval(id);
  }, []);
  if (g.tutorial.done) return null;
  const aq = g.quests.active.find((q) => QUESTS.find((d) => d.id === q.id)?.tutorial);
  const def = aq && QUESTS.find((d) => d.id === aq.id);
  if (!aq || !def) return null;
  const o = def.objectives.find((x) => !objectiveProgress(g, x, aq.baseline).done);
  if (!o) return null;
  const now = clock.now();
  const giver = def.giver;
  const why = def.why;
  const byType = (type: string) => g.buildings.find((b) => b.type === type);
  const name = (type: string) => BUILDINGS[type]?.name ?? type;
  // A building sheet covers the bottom bar: ask to close it before pointing at navigation.
  const closeSheet: Hint | null = ui.selected ? { text: t('coach.closeCard'), target: '.sheet .round-btn' } : null;
  const hint = (h: Hint) => ({ giver, ...h });

  // Collect income from a building (the first quest).
  if (o.type === 'counter' && o.counter === 'collect:any') {
    const b = byType(def.focus?.building ?? 'starter_house');
    if (!b) return hint({ text: o.label });
    return hint({ text: t('coach.collect', { building: name(b.type) }), why, target: `[data-building="${b.type}"]`, uid: passiveReady(b, now).cycles ? undefined : b.uid });
  }
  // Build something: open Build → pick the card → place it → watch construction.
  if (o.type === 'build') {
    const type = o.building;
    const b = byType(type);
    if (b?.busyKind === 'build') return hint({ text: t('coach.constructing'), uid: b.uid });
    if (ui.placing?.type === type) return hint({ text: t('coach.place', { building: name(type) }), why: t('coach.placeWhy'), target: '[data-tutorial="place-confirm"]' });
    if (ui.panel === 'build') return hint({ text: t('coach.chooseCard', { building: name(type) }), target: `[data-tutorial="card-${type}"]` });
    if (closeSheet) return hint(closeSheet);
    return hint({ text: t('coach.openBuild'), why, target: '[data-tutorial="nav-build"]' });
  }
  // Produce goods at the building that makes them.
  if (o.type === 'counter' && o.counter.startsWith('produce:')) {
    const item = o.counter.slice('produce:'.length);
    const recipe = Object.values(RECIPES).find((r) => r.output === item && byType(r.building));
    const b = recipe && byType(recipe.building);
    if (!recipe || !b) return hint({ text: o.label });
    if (finishedJobs(b, now).length) return hint({ text: t('coach.ready', { item: ITEMS[item]?.name ?? item }), target: `[data-building="${b.type}"]` });
    if (ui.selected === b.uid) {
      if (b.queue.length >= 2) return hint({ text: t('coach.waiting'), target: '.sheet .round-btn' });
      return hint({ text: t('coach.tapMake', { item: ITEMS[item]?.name ?? item }), why: why ?? t('coach.makeWhy'), target: `[data-tutorial="recipe-${recipe.id}"]` });
    }
    if (b.queue.length) return hint({ text: t('coach.queued', { building: name(b.type) }), uid: b.uid });
    return hint({ text: t('coach.tapBuilding', { building: name(b.type) }), uid: b.uid });
  }
  // Deliver an order from the board.
  if (o.type === 'counter' && o.counter === 'orders') {
    const order = g.orders[0];
    if (order && !hasItems(g.inventory, order.items)) {
      const item = Object.keys(order.items).find((i) => (g.inventory[i] ?? 0) < order.items[i])!;
      const recipe = Object.values(RECIPES).find((r) => r.output === item);
      const b = recipe && byType(recipe.building);
      return hint({ text: t('coach.needMore', { item: ITEMS[item]?.name ?? item, building: b ? name(b.type) : '' }), uid: b?.uid, target: b && finishedJobs(b, now).length ? `[data-building="${b.type}"]` : undefined });
    }
    if (ui.panel === 'orders') return hint({ text: t('coach.tapDeliver'), target: '[data-tutorial="deliver"]' });
    if (closeSheet) return hint(closeSheet);
    return hint({ text: t('coach.openOrders'), why, target: '[data-tutorial="nav-orders"]' });
  }
  // Upgrade a building.
  if (o.type === 'upgrade') {
    const b = byType(o.building);
    if (!b) return hint({ text: o.label });
    if (b.busyKind === 'upgrade') return hint({ text: t('coach.upgrading'), uid: b.uid });
    if (ui.selected === b.uid) return hint({ text: t('coach.tapUpgrade'), why, target: '[data-tutorial="upgrade"]' });
    return hint({ text: t('coach.tapToUpgrade', { building: name(b.type) }), uid: b.uid });
  }
  return hint({ text: o.label, why });
}

export function Coach() {
  const t = useT();
  const hint = useHint();
  const setUI = useGame((s) => s.setUI);
  const dispatch = useGame((s) => s.dispatch);
  const focusOn = useGame((s) => s.focusOn);
  const g = useGame((s) => s.game!);
  const blocked = useGame((s) => !!(s.ui.dialogue || s.ui.levelUp || s.ui.welcome || s.ui.photoMode));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [hidden, setHidden] = useState(() => safeGet('pockethood.hideHints') === '1');

  useEffect(() => {
    useGame.getState().setUI({ hintUid: hint?.uid ?? null });
  }, [hint?.uid]);

  // Focus the camera on a building the hint is about.
  useEffect(() => {
    if (!hint?.uid || blocked) return;
    const b = g.buildings.find((x) => x.uid === hint.uid);
    if (b) {
      const [x, , z] = buildingCenter(b);
      focusOn(x, z, 1.6);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hint?.uid, blocked]);

  const target = hint?.target ?? (hint?.uid ? '.hint-arrow' : undefined);
  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const tick = () => {
      const el = document.querySelector(target);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [target]);

  if (!hint || blocked || hidden) return null;
  const cardTop = rect && rect.top > window.innerHeight / 2;
  return (
    <div className="coach" aria-live="polite">
      {rect && rect.width > 0 && (
        <>
          <div className="coach__ring" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />
          <svg className="coach__hand" style={{ left: rect.left + rect.width / 2 - 4, top: rect.top + rect.height / 2 + 2 }} viewBox="0 0 24 24" aria-hidden>
            <path d="M8 11V4.5a1.5 1.5 0 0 1 3 0V10l.5-1.2a1.5 1.5 0 0 1 2.8.9l.2-.4a1.5 1.5 0 0 1 2.8 1l.2-.2a1.4 1.4 0 0 1 2.5 1V15c0 3.5-2.6 6-6 6h-1.6a5 5 0 0 1-4.1-2.1L5 14.6a1.5 1.5 0 0 1 2.4-1.8z" fill="#fff" stroke="#3d3226" strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
        </>
      )}
      <div className="coach__card" style={cardTop ? { top: 'calc(80px + var(--safe-top))' } : { bottom: 'calc(110px + var(--safe-bottom))' }}>
        <Portrait resident={hint.giver} />
        <div style={{ flex: 1 }}>
          <p>{hint.text}</p>
          {hint.why && <small>{hint.why}</small>}
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <button
            className="btn btn--plain btn--sm"
            onClick={() => {
              safeSet('pockethood.hideHints', '1');
              setHidden(true);
              setUI({ hintUid: null });
            }}
            aria-label={t('coach.hideAria')}
          >
            {t('coach.hide')}
          </button>
          <button className="btn btn--plain btn--sm" onClick={() => dispatch({ type: 'tutorial', skip: true })} aria-label={t('coach.skipAria')}>
            {t('coach.skip')}
          </button>
        </div>
      </div>
      {!rect && hint.uid && <span className="sr-only">{t('coach.arrowSr')}</span>}
    </div>
  );
}
