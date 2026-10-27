// "Our Neighbourhood": the shared spots everyone is making beautiful together. Each card
// shows what the spot is becoming, the next step, what neighbours still need and how much
// you can give — the world changes as soon as a step is complete.
import { bdef } from '../../data/buildings';
import { idef } from '../../data/items';
import { EVENTS } from '../../data/progression';
import { SPOTS, spotNeeds } from '../../data/spots';
import type { SpotDef } from '../../game/core/types';
import { useT } from '../../platform/i18n';
import { useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { Progress } from '../components/Panel';

const opId = (r: string) => `spot-${r}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function SpotCard({ def, open }: { def: SpotDef; open: boolean }) {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const focusOn = useGame((s) => s.focusOn);
  const t = useT();
  const st = g.spots[def.id] ?? { stage: 0, given: {}, ops: [], doneAt: null };
  const total = def.stages.length;
  const done = st.stage >= total;
  const locked = g.level < def.minLevel;
  const needs = spotNeeds(def, st);
  const season = (st.refreshes ?? 0) + 1;
  const given = st.given as Record<string, number>;
  const name = bdef(def.building).name;
  const building = g.buildings.find((b) => b.type === def.building);
  const celebration = def.celebration ? EVENTS.find((e) => e.id === def.celebration) : undefined;
  const giveAll = () => {
    for (const [res, need] of Object.entries(needs)) {
      const have = res === 'coins' ? useGame.getState().game!.coins : useGame.getState().game!.inventory[res] ?? 0;
      const left = need - (given[res] ?? 0);
      if (left > 0 && have > 0) dispatch({ type: 'spruce', spot: def.id, resource: res, qty: Math.min(left, have), opId: opId(res) });
    }
  };
  const canGiveAny = !locked && Object.entries(needs).some(([res, need]) => (given[res] ?? 0) < need && (res === 'coins' ? g.coins : g.inventory[res] ?? 0) > 0);

  return (
    <div className="card stack spot-card" data-spot={def.id} style={{ gap: 8 }}>
      <div className="row row--between" style={{ alignItems: 'flex-start' }}>
        <div>
          <b>{name}</b>
          <div className="small muted">{done ? t('spots.done') : t('spots.step', { n: Math.min(st.stage + 1, total), total })}</div>
        </div>
        {building && (
          <button className="btn btn--ghost btn--sm" aria-label={name} onClick={() => focusOn(building.x + 1.5 - 12, building.z + 1.5 - 12, 1.6)}>
            <Icon name="map" size={18} />
          </button>
        )}
      </div>
      <Progress value={st.stage} max={total} />
      {open && <p className="small" style={{ margin: 0 }}>{t(`spots.${def.id}.desc`)}</p>}
      <div className="row small" style={{ gap: 8, flexWrap: 'wrap' }}>
        {def.stages.map((_, i) => (
          <span key={i} className={i < st.stage ? 'chip ok' : 'chip'}>
            {i < st.stage ? '✓' : i + 1} {t(`spots.${def.id}.s${i + 1}`)}
          </span>
        ))}
      </div>
      {locked && <div className="small muted">{t('spots.startsAt', { level: def.minLevel })}</div>}
      {!locked && open && (
        <>
          <div className="small">
            <b>{done ? t('spots.refresh', { n: season }) : t('spots.next', { what: t(`spots.${def.id}.s${st.stage + 1}`) })}</b>
            {done && <div className="muted">{t('spots.refreshHint')}</div>}
          </div>
          {Object.entries(needs).map(([res, need]) => {
            const have = res === 'coins' ? g.coins : g.inventory[res] ?? 0;
            const got = given[res] ?? 0;
            const step = res === 'coins' ? Math.min(50, need - got) : 1;
            return (
              <div key={res} className="list-item">
                <Icon name={res === 'coins' ? 'coin' : res} size={30} />
                <div style={{ flex: 1 }}>
                  <b>
                    {res === 'coins' ? t('common.coins') : idef(res).name} {got}/{need}
                  </b>
                  <Progress value={got} max={need} />
                  <div className="small muted">{t('spots.youHave', { n: have })}</div>
                </div>
                <button className="btn btn--teal btn--sm" disabled={got >= need || have <= 0} onClick={() => dispatch({ type: 'spruce', spot: def.id, resource: res, qty: step, opId: opId(res) })}>
                  {got >= need ? t('common.done') : t('spots.give', { n: step })}
                </button>
              </div>
            );
          })}
          <button className="btn btn--gold btn--block" disabled={!canGiveAny} onClick={giveAll}>
            {t('spots.giveAll')}
          </button>
          <div className="small muted">{t('spots.thanks', { n: done ? 2 : def.stages[st.stage].friendship })}</div>
        </>
      )}
      {open && (
        <div className="row small muted" style={{ gap: 10, flexWrap: 'wrap' }}>
          {celebration && <span>🎉 {t('spots.celebration', { event: celebration.name })}</span>}
          {def.unlocks && <span>🎁 {t('spots.unlocks', { building: bdef(def.unlocks).name })}</span>}
        </div>
      )}
    </div>
  );
}

/** All spots; the one the player tapped in the world (if any) comes first and open. */
export function SpotsSection() {
  const selected = useGame((s) => (s.ui.selected ? s.game!.buildings.find((b) => b.uid === s.ui.selected)?.type : undefined));
  const level = useGame((s) => s.game!.level);
  const focus = SPOTS.find((p) => p.building === selected)?.id;
  const ordered = [...SPOTS].sort((a, b) => Number(b.id === focus) - Number(a.id === focus));
  // Without a tapped spot, open the first one the player can work on.
  const firstOpen = focus ?? ordered.find((p) => level >= p.minLevel && (useGame.getState().game!.spots[p.id]?.stage ?? 0) < p.stages.length)?.id;
  return (
    <div className="stack" style={{ gap: 10 }}>
      {ordered.map((p) => (
        <SpotCard key={p.id} def={p} open={p.id === firstOpen} />
      ))}
    </div>
  );
}
