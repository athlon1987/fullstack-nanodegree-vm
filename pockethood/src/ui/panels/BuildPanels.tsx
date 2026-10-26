import { useEffect, useMemo, useState } from 'react';
import { BUILDINGS, isDecoration, isFixed } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { RESIDENTS } from '../../data/residents';
import type { BuildingCategory, Rotation } from '../../game/core/types';
import { canAfford, missingFor, finishedJobs, levelDef, passiveReady, recipesFor, speedUpGems, upgradeSeconds } from '../../game/economy/economy';
import { findSpot, placementProblem } from '../../game/world/grid';
import { buildingThumb } from '../../rendering/thumbnails';
import { fmt } from '../../rendering/scene/Buildings';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { CostChips, ItemChips, Panel, Tabs } from '../components/Panel';
import { audio } from '../../audio/AudioManager';

type Tab = 'homes' | 'shops' | 'community' | 'decor' | 'keepsakes';
const TAB_CATS: Record<Tab, BuildingCategory[]> = {
  homes: ['residential'],
  shops: ['commercial', 'production'],
  community: ['community', 'landmark'],
  decor: ['decoration', 'path'],
  keepsakes: [],
};

function Thumb({ type }: { type: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setSrc(buildingThumb(type)), 0);
    return () => window.clearTimeout(id);
  }, [type]);
  return src ? <img src={src} alt="" /> : <img alt="" />;
}

export function BuildPanel() {
  const g = useGame((s) => s.game!);
  const startPlacing = useGame((s) => s.startPlacing);
  const [tab, setTab] = useState<Tab>('shops');
  const list = useMemo(
    () =>
      Object.values(BUILDINGS)
        .filter((d) => (tab === 'keepsakes' ? d.keepsake : TAB_CATS[tab].includes(d.category) && !d.keepsake))
        .filter((d) => d.unlockLevel < 99 || d.keepsake)
        .sort((a, b) => a.unlockLevel - b.unlockLevel || (a.cost.coins ?? 0) - (b.cost.coins ?? 0)),
    [tab],
  );
  return (
    <Panel
      title="Build"
      icon="build"
      tabs={
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { id: 'shops', label: 'Shops' },
            { id: 'homes', label: 'Homes' },
            { id: 'community', label: 'Community' },
            { id: 'decor', label: 'Decor' },
            { id: 'keepsakes', label: 'Keepsakes' },
          ]}
        />
      }
    >
      {tab === 'keepsakes' && <p className="muted small">Keepsakes are gifts from resident stories, events and community projects.</p>}
      <div className="grid-cards">
        {list.map((d) => {
          const count = g.buildings.filter((b) => b.type === d.id).length;
          const unlocked = d.keepsake ? g.unlocked.includes(d.id) : d.unlockLevel <= g.level;
          const maxed = d.maxCount !== undefined && count >= d.maxCount;
          const afford = canAfford(g, d.cost);
          const disabled = !unlocked || maxed;
          return (
            <button
              key={d.id}
              className={`catalog-card ${disabled ? 'locked' : ''}`}
              data-tutorial={`card-${d.id}`}
              aria-disabled={disabled}
              aria-label={`${d.name}. ${disabled ? (unlocked ? 'Maximum built' : d.keepsake ? 'Not yet earned' : `Unlocks at level ${d.unlockLevel}`) : ''}`}
              onClick={() => {
                if (!unlocked) {
                  useGame.getState().toast({ icon: 'lock', title: d.keepsake ? 'Earn this keepsake through stories & events' : `Unlocks at level ${d.unlockLevel}`, tone: 'info' });
                  return;
                }
                if (maxed) {
                  useGame.getState().toast({ icon: 'alert', title: `You can build ${d.maxCount} ${d.name}${d.maxCount! > 1 ? 's' : ''}`, tone: 'info' });
                  return;
                }
                if (!afford) audio.play('error');
                startPlacing(d.id);
                // Suggest a valid spot near the middle of owned land
                const st = useGame.getState();
                const spot = d.id === 'cafe' && !placementProblem(st.game!, 'cafe', 15, 15, 0) ? { x: 15, z: 15 } : findSpot(st.game!, d.id, 14, 12);
                if (spot) st.setUI({ placing: { type: d.id, x: spot.x, z: spot.z, rot: 0 } });
              }}
            >
              {!unlocked && (
                <span className="lock-tag">
                  <Icon name="lock" size={14} />
                  {d.keepsake ? 'Keepsake' : `Lv ${d.unlockLevel}`}
                </span>
              )}
              {unlocked && d.resident && count === 0 && <span className="new-tag">+ {RESIDENTS[d.resident].name}</span>}
              <Thumb type={d.id} />
              <b>{d.name}</b>
              {d.maxCount !== undefined && unlocked && (
                <span className="small muted">
                  {count}/{d.maxCount}
                </span>
              )}
              <CostChips cost={d.cost} game={g} />
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/** The bottom bar shown while placing or moving a building. */
export function PlaceBar() {
  const placing = useGame((s) => s.ui.placing)!;
  const g = useGame((s) => s.game!);
  const setUI = useGame((s) => s.setUI);
  const dispatch = useGame((s) => s.dispatch);
  const def = BUILDINGS[placing.type];
  const spotProblem = placementProblem(g, placing.type, placing.x, placing.z, placing.rot, placing.uid);
  const short = !placing.uid && !canAfford(g, def.cost) ? missingFor(g, def.cost) : [];
  const problem = spotProblem ?? (short.length ? 'cost' : null);
  const rotate = () => setUI({ placing: { ...placing, rot: (((placing.rot + 1) % 4) as Rotation) } });
  const cancel = () => setUI({ placing: null });
  const confirm = () => {
    const r = placing.uid
      ? dispatch({ type: 'move', uid: placing.uid, x: placing.x, z: placing.z, rot: placing.rot })
      : dispatch({ type: 'place', building: placing.type, x: placing.x, z: placing.z, rot: placing.rot });
    if (!r || r.error) return;
    // Decorations stay in "paint" mode for quick placement; buildings exit.
    const st = useGame.getState();
    if (!placing.uid && isDecoration(placing.type) && canAfford(st.game!, def.cost)) {
      const spot = findSpot(st.game!, placing.type, placing.x + 1, placing.z);
      setUI({ placing: spot ? { ...placing, ...spot } : null });
    } else setUI({ placing: null });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
      if (e.key === 'r' || e.key === 'R') rotate();
      if (e.key === 'Enter') confirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const reason: Record<string, string> = {
    occupied: 'Something is in the way',
    road: 'Can’t build on the road',
    locked_land: 'You don’t own this land yet',
    out_of_bounds: 'Too close to the edge',
    cost: `Need ${short.join(', ')}`,
  };
  return (
    <div className="placebar" role="toolbar" aria-label="Placement">
      <button className="btn btn--plain btn--icon" onClick={cancel} aria-label="Cancel placement">
        <Icon name="close" size={22} />
      </button>
      <div className="placebar__info">
        <b>{placing.uid ? `Move ${def.name}` : def.name}</b>
        <span className="small" style={{ color: problem ? '#c0392b' : '#3f8a33', fontWeight: 800 }}>
          {problem ? `✕ ${reason[problem]}` : '✓ Looks good here'}
        </span>
        {!placing.uid && <CostChips cost={def.cost} game={g} />}
      </div>
      <button className="btn btn--plain btn--icon" onClick={rotate} aria-label="Rotate (R)">
        <Icon name="rotate" size={24} />
      </button>
      <button className="btn btn--icon" onClick={confirm} disabled={!!problem} aria-label="Confirm placement" data-tutorial="place-confirm">
        <Icon name="check" size={30} />
      </button>
    </div>
  );
}

/** Info sheet for the selected building: production, collection, upgrades, move/sell. */
export function BuildingSheet() {
  const uid = useGame((s) => s.ui.selected)!;
  const g = useGame((s) => s.game!);
  const setUI = useGame((s) => s.setUI);
  const dispatch = useGame((s) => s.dispatch);
  const startPlacing = useGame((s) => s.startPlacing);
  const [now, setNow] = useState(clock.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(clock.now()), 400);
    return () => window.clearInterval(id);
  }, []);
  const b = g.buildings.find((x) => x.uid === uid);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setUI({ selected: null });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setUI]);
  if (!b) return null;
  const def = BUILDINGS[b.type];
  const lvl = levelDef(b);
  const next = def.levels[b.level];
  const recipes = recipesFor(b);
  const done = finishedJobs(b, now);
  const passive = passiveReady(b, now);
  const deco = isDecoration(b.type);
  const worker = Object.values(RESIDENTS).find((r) => r.workplace === b.type);
  const close = () => setUI({ selected: null });
  return (
    <section className="sheet" role="dialog" aria-label={def.name}>
      <header className="panel__head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{def.name}</h2>
          <div className="row small muted" style={{ gap: 6, fontWeight: 800 }}>
            {!deco && def.levels.length > 1 && (
              <span className="row" style={{ gap: 2 }} aria-label={`Level ${b.level} of ${def.levels.length}`}>
                {def.levels.map((_, i) => (
                  <Icon key={i} name="star" size={16} style={{ opacity: i < b.level ? 1 : 0.25 }} />
                ))}
              </span>
            )}
            {worker && <span>· run by {worker.name}</span>}
          </div>
        </div>
        <button className="round-btn" onClick={close} aria-label="Close">
          <Icon name="close" size={22} />
        </button>
      </header>
      <div className="panel__body">
        <p className="muted" style={{ marginTop: 0 }}>
          {def.description}
        </p>

        {b.busyUntil !== null && (
          <div className="card row row--between" style={{ marginBottom: 10 }}>
            <div className="row">
              <Icon name={b.busyKind === 'build' ? 'build' : 'upgrade'} size={30} />
              <div>
                <b>{b.busyKind === 'build' ? 'Under construction' : `Upgrading to level ${b.level + 1}`}</b>
                <div className="small muted">{fmt(b.busyUntil - now)} left</div>
              </div>
            </div>
            <button className="btn btn--gem btn--sm" onClick={() => dispatch({ type: 'speedUp', uid: b.uid })} aria-label="Finish now with gems">
              Finish <Icon name="gem" size={18} /> {speedUpGems(b.busyUntil - now)}
            </button>
          </div>
        )}

        {(done.length > 0 || passive.cycles > 0) && (
          <button className="btn btn--gold btn--block" style={{ marginBottom: 10 }} onClick={() => dispatch({ type: 'collect', uid: b.uid })}>
            Collect {passive.coins > 0 && <><Icon name="coin" size={20} /> {passive.coins}</>}
            {done.length > 0 && <><Icon name={RECIPES[done[0].recipe].output} size={20} /> ×{done.length}</>}
          </button>
        )}

        {lvl.passive && b.busyKind !== 'build' && (
          <div className="card row" style={{ marginBottom: 10 }}>
            <Icon name="coin" size={30} />
            <div style={{ flex: 1 }}>
              <b>
                {lvl.passive.coins} coins every {lvl.passive.seconds >= 60 ? `${lvl.passive.seconds / 60} min` : `${lvl.passive.seconds}s`}
              </b>
              <div className="small muted">
                Holds up to {lvl.passive.coins * lvl.passive.cycles} coins — {passive.coins} waiting
              </div>
            </div>
          </div>
        )}

        {recipes.length > 0 && b.busyKind !== 'build' && (
          <>
            <div className="section-title">
              <Icon name="timer" size={22} /> Production ({b.queue.length}/{lvl.slots})
            </div>
            <div className="slots" aria-label="Production queue">
              {Array.from({ length: lvl.slots }, (_, i) => {
                const j = b.queue[i];
                if (!j) return <div key={i} className="slot" aria-label="Empty slot" />;
                const finished = j.end <= now;
                const pct = Math.max(0, Math.min(1, (now - j.start) / (j.end - j.start)));
                return (
                  <div key={i} className={`slot filled ${finished ? 'done' : ''}`} aria-label={`${RECIPES[j.recipe].name} ${finished ? 'ready' : fmt(j.end - now)}`}>
                    <Icon name={RECIPES[j.recipe].output} size={30} />
                    {!finished && j.start <= now && <i style={{ width: `${pct * 100}%` }} />}
                    {!finished && j.start > now && <small>queued</small>}
                  </div>
                );
              })}
            </div>
            <div className="stack" style={{ marginTop: 10 }}>
              {recipes.map((r) => {
                const locked = b.level < r.level;
                const hasInputs = Object.entries(r.inputs).every(([id, n]) => (g.inventory[id] ?? 0) >= n) && g.coins >= (r.coins ?? 0);
                const full = b.queue.length >= lvl.slots;
                return (
                  <div key={r.id} className="card recipe" style={{ opacity: locked ? 0.6 : 1 }}>
                    <div className="recipe__icon">
                      <Icon name={r.output} size={36} />
                    </div>
                    <div>
                      <b>
                        {r.name}
                        {r.qty > 1 ? ` ×${r.qty}` : ''}
                      </b>
                      <div className="row small muted" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <span className="row" style={{ gap: 3 }}>
                          <Icon name="timer" size={16} /> {fmt((r.seconds * 1000) / lvl.speed)}
                        </span>
                        <span className="row" style={{ gap: 3 }} title="Value">
                          worth <Icon name="coin" size={16} /> {ITEMS[r.output].value * r.qty}
                        </span>
                        {(r.coins ?? 0) > 0 && (
                          <span className={`chip ${g.coins < (r.coins ?? 0) ? 'short' : ''}`} title="Ingredients">
                            <Icon name="coin" size={16} /> −{r.coins}
                          </span>
                        )}
                        {Object.keys(r.inputs).length > 0 && <ItemChips items={r.inputs} game={g} />}
                      </div>
                    </div>
                    {locked ? (
                      <span className="chip">
                        <Icon name="lock" size={16} /> Lv {r.level}
                      </span>
                    ) : (
                      <button
                        className="btn btn--teal btn--sm"
                        disabled={full || !hasInputs || b.busyKind === 'upgrade'}
                        data-tutorial={`recipe-${r.id}`}
                        onClick={() => dispatch({ type: 'produce', uid: b.uid, recipe: r.id })}
                        aria-label={`Make ${r.name}`}
                      >
                        {full ? 'Full' : !hasInputs ? 'Need items' : 'Make'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {next && b.busyKind === null && !deco && (
          <>
            <div className="section-title">
              <Icon name="upgrade" size={22} /> Upgrade to level {b.level + 1}
            </div>
            <div className="card stack">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {next.perks.map((p) => (
                  <li key={p} style={{ fontWeight: 700 }}>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="row row--between" style={{ flexWrap: 'wrap', gap: 8 }}>
                <span className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <CostChips cost={next.upgradeCost} game={g} />
                  <span className="chip">
                    <Icon name="timer" size={16} /> {fmt(upgradeSeconds(b.type, b.level + 1) * 1000)}
                  </span>
                </span>
                <button className="btn btn--gold" data-tutorial="upgrade" disabled={!canAfford(g, next.upgradeCost)} onClick={() => dispatch({ type: 'upgrade', uid: b.uid })}>
                  <Icon name="upgrade" size={22} /> Upgrade
                </button>
              </div>
            </div>
          </>
        )}
        {!next && !deco && def.levels.length > 1 && <p className="small muted">Fully upgraded — wonderful work!</p>}
      </div>
      <footer className="panel__foot row" style={{ gap: 8, justifyContent: 'flex-end' }}>
        {!['pond', 'fountain'].includes(b.type) && (
          <button className="btn btn--plain btn--sm" onClick={() => startPlacing(b.type, b.uid)}>
            <Icon name="move" size={18} /> Move
          </button>
        )}
        {deco && !isFixed(b.type) && (
          <button
            className="btn btn--coral btn--sm"
            onClick={() => {
              dispatch({ type: 'sell', uid: b.uid });
              close();
            }}
          >
            <Icon name="sell" size={18} /> Sell for {Math.floor((def.cost.coins ?? 0) * (def.sellRefund ?? 0.5))}
          </button>
        )}
      </footer>
    </section>
  );
}
