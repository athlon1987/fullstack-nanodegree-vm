// Guided first session. Each hint is derived from the active tutorial quest AND
// the live UI state, so it always points at the exact next action — and waits
// for the player to actually do it.
import { useEffect, useState } from 'react';
import { QUESTS } from '../../data/progression';
import { finishedJobs, hasItems, passiveReady } from '../../game/economy/economy';
import { objectiveProgress } from '../../game/engagement/objectives';
import { buildingCenter } from '../../rendering/scene/coords';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { Portrait } from '../components/Panel';

interface Hint {
  text: string;
  why?: string;
  target?: string;
  /** Building uid to mark in the world (arrow + camera focus). */
  uid?: string;
}

function useHint(): Hint | null {
  const g = useGame((s) => s.game!);
  const ui = useGame((s) => s.ui);
  const [, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((x) => x + 1), 500);
    return () => window.clearInterval(id);
  }, []);
  if (g.tutorial.done) return null;
  const aq = g.quests.active.find((q) => QUESTS.find((d) => d.id === q.id)?.tutorial);
  if (!aq) return null;
  const now = clock.now();
  const byType = (t: string) => g.buildings.find((b) => b.type === t);
  const cafe = byType('cafe');
  // A building sheet covers the bottom bar: ask to close it before pointing at navigation.
  const closeSheet: Hint | null = ui.selected ? { text: 'Close this card to continue.', target: '.sheet .round-btn' } : null;
  const placingHint = (name: string): Hint => ({ text: `Drag the ${name} to a green spot, then tap ✓ to build it.`, why: 'Green tiles mean the spot is free.', target: '[data-tutorial="place-confirm"]' });
  switch (aq.id) {
    case 'welcome': {
      const house = byType('starter_house')!;
      return { text: 'Tap the coin bubble above your house to collect rent.', why: 'Houses earn coins over time — even while you’re away.', target: '[data-building="starter_house"]', uid: passiveReady(house, now).cycles ? undefined : house.uid };
    }
    case 'open_cafe':
    case 'meet_luna': {
      const type = aq.id === 'open_cafe' ? 'cafe' : 'garden';
      const name = aq.id === 'open_cafe' ? 'café' : 'Community Garden';
      const b = byType(type);
      if (b?.busyKind === 'build') return { text: 'Construction takes just a few seconds. Watch the builders work!', uid: b.uid };
      if (ui.placing?.type === type) return placingHint(name);
      if (ui.panel === 'build') return { text: `Choose the ${name}.`, target: `[data-tutorial="card-${type}"]` };
      if (closeSheet) return closeSheet;
      return { text: 'Open the Build menu.', why: aq.id === 'open_cafe' ? 'Mia has dreamed of this café for years.' : 'Luna will move in once there’s a garden.', target: '[data-tutorial="nav-build"]' };
    }
    case 'first_brew': {
      if (!cafe) return null;
      if (finishedJobs(cafe, now).length) return { text: 'Coffee’s ready! Tap the bubble to collect it.', target: '[data-building="cafe"]' };
      if (ui.selected === cafe.uid) {
        if (cafe.queue.length >= 2) return { text: 'Brewing… close this and wait for the bubble.', target: '.sheet .round-btn' };
        return { text: 'Tap Make to brew coffee.', why: 'Shops turn time into goods your neighbors want.', target: '[data-tutorial="recipe-coffee"]' };
      }
      if (cafe.queue.length) return { text: 'Coffee is brewing. Tap the café to queue another, or wait for the bubble.', uid: cafe.uid };
      return { text: 'Tap Mia’s Café to start brewing.', uid: cafe.uid };
    }
    case 'first_order': {
      const order = g.orders[0];
      if (order && !hasItems(g.inventory, order.items)) return { text: 'You need a little more coffee for this order — brew some at the café.', uid: cafe?.uid, target: cafe && finishedJobs(cafe, now).length ? '[data-building="cafe"]' : undefined };
      if (ui.panel === 'orders') return { text: 'Tap Deliver to hand over the coffee.', target: '[data-tutorial="deliver"]' };
      if (closeSheet) return closeSheet;
      return { text: 'Open Orders to see what your neighbors need.', target: '[data-tutorial="nav-orders"]' };
    }
    case 'cafe_upgrade': {
      if (!cafe) return null;
      if (cafe.busyKind === 'upgrade') return { text: 'Upgrading… the terrace is on its way!', uid: cafe.uid };
      if (ui.selected === cafe.uid) return { text: 'Tap Upgrade.', why: 'Upgrades add recipes, slots — and you’ll see the café change.', target: '[data-tutorial="upgrade"]' };
      return { text: 'Tap the café to upgrade it.', uid: cafe.uid };
    }
  }
  const def = QUESTS.find((d) => d.id === aq.id)!;
  const o = def.objectives.find((x) => !objectiveProgress(g, x, aq.baseline).done);
  return o ? { text: o.label } : null;
}

export function Coach() {
  const hint = useHint();
  const setUI = useGame((s) => s.setUI);
  const dispatch = useGame((s) => s.dispatch);
  const focusOn = useGame((s) => s.focusOn);
  const g = useGame((s) => s.game!);
  const blocked = useGame((s) => !!(s.ui.dialogue || s.ui.levelUp || s.ui.welcome || s.ui.photoMode));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem('pockethood.hideHints') === '1');

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
        <Portrait resident="mia" />
        <div style={{ flex: 1 }}>
          <p>{hint.text}</p>
          {hint.why && <small>{hint.why}</small>}
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <button
            className="btn btn--plain btn--sm"
            onClick={() => {
              localStorage.setItem('pockethood.hideHints', '1');
              setHidden(true);
              setUI({ hintUid: null });
            }}
            aria-label="Hide hints"
          >
            Hide
          </button>
          <button className="btn btn--plain btn--sm" onClick={() => dispatch({ type: 'tutorial', skip: true })} aria-label="Skip tutorial">
            Skip
          </button>
        </div>
      </div>
      {!rect && hint.uid && <span className="sr-only">Look for the arrow in the neighborhood.</span>}
    </div>
  );
}
