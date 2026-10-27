import { useEffect, useMemo, useState } from 'react';
import { BUILDINGS, bdef, isDecoration, isFixed } from '../../data/buildings';
import { ACTIVE_MODULES } from '../../platform/content/install';
import { BehaviorCards, ModuleBadges } from './ModulePanels';
import { ITEMS, RECIPES, idef } from '../../data/items';
import { RESIDENTS, rdef } from '../../data/residents';
import type { BuildingCategory, Rotation } from '../../game/core/types';
import { canAfford, missingFor, finishedJobs, levelDef, passiveReady, recipesFor, speedUpGems, upgradeSeconds } from '../../game/economy/economy';
import { findSpot, placementProblem } from '../../game/world/grid';
import { buildingThumb } from '../../rendering/thumbnails';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { CostChips, ItemChips, Panel, Tabs } from '../components/Panel';
import { audio } from '../../audio/AudioManager';
import { fmtDuration as fmt, useT } from '../../platform/i18n';

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
  const t = useT();
  const g = useGame((s) => s.game!);
  const startPlacing = useGame((s) => s.startPlacing);
  const [tab, setTab] = useState<Tab>('shops');
  const list = useMemo(
    () =>
      Object.values(BUILDINGS)
        .filter((d) => (tab === 'keepsakes' ? d.keepsake : TAB_CATS[tab].includes(d.category) && !d.keepsake))
        .filter((d) => (d.unlockLevel < 99 || d.keepsake) && !d.hidden)
        .sort((a, b) => a.unlockLevel - b.unlockLevel || (a.cost.coins ?? 0) - (b.cost.coins ?? 0)),
    [tab],
  );
  return (
    <Panel
      title={t('build.title')}
      icon="build"
      tabs={
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { id: 'shops', label: t('common.cat.commercial') },
            { id: 'homes', label: t('common.cat.residential') },
            { id: 'community', label: t('common.cat.community') },
            { id: 'decor', label: t('common.cat.decoration') },
            { id: 'keepsakes', label: t('build.tab.keepsakes') },
          ]}
        />
      }
    >
      {tab === 'keepsakes' && <p className="muted small">{t('build.keepsakesHint')}</p>}
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
              aria-label={`${d.name}. ${disabled ? (unlocked ? t('build.maxBuilt') : d.keepsake ? t('build.notEarned') : t('build.unlocksAt', { level: d.unlockLevel })) : ''}`}
              onClick={() => {
                if (!unlocked) {
                  useGame.getState().toast({ icon: 'lock', title: d.keepsake ? t('build.earnKeepsake') : t('build.unlocksAt', { level: d.unlockLevel }), tone: 'info' });
                  return;
                }
                if (maxed) {
                  useGame.getState().toast({ icon: 'alert', title: t('build.maxCount', { n: d.maxCount!, name: d.name }), tone: 'info' });
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
                  {d.keepsake ? t('build.keepsake') : t('common.levelShort', { level: d.unlockLevel })}
                </span>
              )}
              {unlocked && d.resident && count === 0 && <span className="new-tag">+ {rdef(d.resident).name}</span>}
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
  const t = useT();
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
    occupied: t('build.place.occupied'),
    road: t('build.place.road'),
    locked_land: t('build.place.lockedLand'),
    out_of_bounds: t('build.place.outOfBounds'),
    cost: t('build.place.need', { list: short.join(', ') }),
  };
  return (
    <div className="placebar" role="toolbar" aria-label={t('build.place.aria')}>
      <button className="btn btn--plain btn--icon" onClick={cancel} aria-label={t('build.place.cancel')}>
        <Icon name="close" size={22} />
      </button>
      <div className="placebar__info">
        <b>{placing.uid ? t('build.place.move', { name: def.name }) : def.name}</b>
        <span className="small" style={{ color: problem ? '#c0392b' : '#3f8a33', fontWeight: 800 }}>
          {problem ? `✕ ${reason[problem]}` : `✓ ${t('build.place.ok')}`}
        </span>
        {!placing.uid && <CostChips cost={def.cost} game={g} />}
      </div>
      <button className="btn btn--plain btn--icon" onClick={rotate} aria-label={t('build.place.rotate')}>
        <Icon name="rotate" size={24} />
      </button>
      <button className="btn btn--icon" onClick={confirm} disabled={!!problem} aria-label={t('build.place.confirm')} data-tutorial="place-confirm">
        <Icon name="check" size={30} />
      </button>
    </div>
  );
}

/** Info sheet for the selected building: production, collection, upgrades, move/sell. */
export function BuildingSheet() {
  const t = useT();
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
  const def = bdef(b.type);
  if (def.archetype === 'dormant') return <DormantSheet onClose={() => setUI({ selected: null })} />;
  const mod = ACTIVE_MODULES[b.type];
  const lvl = levelDef(b)!;
  const next = def.levels[b.level];
  const recipes = recipesFor(b);
  const done = finishedJobs(b, now);
  const passive = passiveReady(b, now);
  const deco = isDecoration(b.type);
  const worker = (def.resident && RESIDENTS[def.resident]) || Object.values(RESIDENTS).find((r) => r.workplace === b.type);
  const close = () => setUI({ selected: null });
  return (
    <section className="sheet" role="dialog" aria-label={def.name}>
      <header className="panel__head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{def.name}</h2>
          <div className="row small muted" style={{ gap: 6, fontWeight: 800 }}>
            {!deco && def.levels.length > 1 && (
              <span className="row" style={{ gap: 2 }} aria-label={t('build.sheet.levelOf', { level: b.level, max: def.levels.length })}>
                {def.levels.map((_, i) => (
                  <Icon key={i} name="star" size={16} style={{ opacity: i < b.level ? 1 : 0.25 }} />
                ))}
              </span>
            )}
            {worker && <span>{t('build.sheet.runBy', { name: worker.name })}</span>}
          </div>
        </div>
        <button className="round-btn" onClick={close} aria-label={t('common.close')}>
          <Icon name="close" size={22} />
        </button>
      </header>
      <div className="panel__body">
        <p className="muted" style={{ marginTop: 0 }}>
          {def.description}
        </p>
        {mod && <ModuleBadges m={mod} />}
        {mod?.greeting && worker && b.busyKind !== 'build' && (
          <p className="small" style={{ marginTop: 0 }}>
            <b>{worker.name}:</b> “{mod.greeting}”
          </p>
        )}

        {b.busyUntil !== null && (
          <div className="card row row--between" style={{ marginBottom: 10 }}>
            <div className="row">
              <Icon name={b.busyKind === 'build' ? 'build' : 'upgrade'} size={30} />
              <div>
                <b>{b.busyKind === 'build' ? t('build.sheet.underConstruction') : t('build.sheet.upgradingTo', { level: b.level + 1 })}</b>
                <div className="small muted">{t('build.sheet.timeLeft', { time: fmt(b.busyUntil - now) })}</div>
              </div>
            </div>
            <button className="btn btn--gem btn--sm" onClick={() => dispatch({ type: 'speedUp', uid: b.uid })} aria-label={t('build.sheet.finishAria')}>
              {t('build.sheet.finish')} <Icon name="gem" size={18} /> {speedUpGems(b.busyUntil - now)}
            </button>
          </div>
        )}

        {(done.length > 0 || passive.cycles > 0) && (
          <button className="btn btn--gold btn--block" style={{ marginBottom: 10 }} onClick={() => dispatch({ type: 'collect', uid: b.uid })}>
            {t('common.collect')} {passive.coins > 0 && <><Icon name="coin" size={20} /> {passive.coins}</>}
            {done.length > 0 && <><Icon name={done[0].out?.item ?? RECIPES[done[0].recipe]?.output ?? 'star'} size={20} /> ×{done.length}</>}
          </button>
        )}

        <BehaviorCards b={b} />

        {lvl.passive && b.busyKind !== 'build' && (
          <div className="card row" style={{ marginBottom: 10 }}>
            <Icon name="coin" size={30} />
            <div style={{ flex: 1 }}>
              <b>
                {t('build.sheet.passive', {
                  coins: lvl.passive.coins,
                  interval: lvl.passive.seconds >= 60 ? t('build.sheet.intervalMin', { n: String(lvl.passive.seconds / 60) }) : t('build.sheet.intervalSec', { n: lvl.passive.seconds }),
                })}
              </b>
              <div className="small muted">
                {t('build.sheet.holds', { max: lvl.passive.coins * lvl.passive.cycles, waiting: passive.coins })}
              </div>
            </div>
          </div>
        )}

        {recipes.length > 0 && b.busyKind !== 'build' && (
          <>
            <div className="section-title">
              <Icon name="timer" size={22} /> {t('build.sheet.production', { used: b.queue.length, slots: lvl.slots })}
            </div>
            <div className="slots" aria-label={t('build.sheet.queueAria')}>
              {Array.from({ length: lvl.slots }, (_, i) => {
                const j = b.queue[i];
                if (!j) return <div key={i} className="slot" aria-label={t('build.sheet.emptySlot')} />;
                const finished = j.end <= now;
                const pct = Math.max(0, Math.min(1, (now - j.start) / (j.end - j.start)));
                return (
                  <div key={i} className={`slot filled ${finished ? 'done' : ''}`} aria-label={`${RECIPES[j.recipe]?.name ?? ITEMS[j.out?.item ?? '']?.name ?? ''} ${finished ? t('build.sheet.ready') : fmt(j.end - now)}`}>
                    <Icon name={j.out?.item ?? RECIPES[j.recipe]?.output ?? 'star'} size={30} />
                    {!finished && j.start <= now && <i style={{ width: `${pct * 100}%` }} />}
                    {!finished && j.start > now && <small>{t('build.sheet.queued')}</small>}
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
                        <span className="row" style={{ gap: 3 }} title={t('build.sheet.value')}>
                          {t('build.sheet.worth')} <Icon name="coin" size={16} /> {idef(r.output).value * r.qty}
                        </span>
                        {(r.coins ?? 0) > 0 && (
                          <span className={`chip ${g.coins < (r.coins ?? 0) ? 'short' : ''}`} title={t('build.sheet.ingredients')}>
                            <Icon name="coin" size={16} /> −{r.coins}
                          </span>
                        )}
                        {Object.keys(r.inputs).length > 0 && <ItemChips items={r.inputs} game={g} />}
                      </div>
                    </div>
                    {locked ? (
                      <span className="chip">
                        <Icon name="lock" size={16} /> {t('common.levelShort', { level: r.level })}
                      </span>
                    ) : (
                      <button
                        className="btn btn--teal btn--sm"
                        disabled={full || !hasInputs || b.busyKind === 'upgrade'}
                        data-tutorial={`recipe-${r.id}`}
                        onClick={() => dispatch({ type: 'produce', uid: b.uid, recipe: r.id })}
                        aria-label={t('build.sheet.makeAria', { name: r.name })}
                      >
                        {full ? t('build.sheet.full') : !hasInputs ? t('build.sheet.needItems') : t('build.sheet.make')}
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
              <Icon name="upgrade" size={22} /> {t('build.sheet.upgradeTo', { level: b.level + 1 })}
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
                  <Icon name="upgrade" size={22} /> {t('build.sheet.upgrade')}
                </button>
              </div>
            </div>
          </>
        )}
        {!next && !deco && def.levels.length > 1 && <p className="small muted">{t('build.sheet.maxed')}</p>}
      </div>
      <footer className="panel__foot row" style={{ gap: 8, justifyContent: 'flex-end' }}>
        {!['pond', 'fountain'].includes(b.type) && (
          <button className="btn btn--plain btn--sm" onClick={() => startPlacing(b.type, b.uid)}>
            <Icon name="move" size={18} /> {t('build.sheet.move')}
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
            <Icon name="sell" size={18} /> {t('build.sheet.sellFor', { n: Math.floor((def.cost.coins ?? 0) * (def.sellRefund ?? 0.5)) })}
          </button>
        )}
      </footer>
    </section>
  );
}

/** A building whose content is temporarily unavailable: kept safe, shown closed. */
function DormantSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <section className="sheet" role="dialog" aria-label={t('common.unknownBuilding')}>
      <header className="panel__head">
        <h2 style={{ margin: 0, flex: 1 }}>{t('common.unknownBuilding')}</h2>
        <button className="round-btn" onClick={onClose} aria-label={t('common.close')}>
          <Icon name="close" size={22} />
        </button>
      </header>
      <div className="panel__body">
        <p className="muted">{t('build.dormant')}</p>
      </div>
    </section>
  );
}
