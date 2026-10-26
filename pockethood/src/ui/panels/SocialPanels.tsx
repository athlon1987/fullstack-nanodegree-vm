import { useEffect, useState } from 'react';
import { BUILDINGS } from '../../data/buildings';
import { ITEMS } from '../../data/items';
import { QUESTS, STORIES } from '../../data/progression';
import { FRIENDSHIP_LEVELS, RESIDENTS, RESIDENT_IDS } from '../../data/residents';
import { activeChapter, eligibleChapter } from '../../game/characters/relationships';
import { dayKey } from '../../game/core/rng';
import { friendshipLevel, hasItems } from '../../game/economy/economy';
import { objectiveProgress } from '../../game/engagement/objectives';
import { PULSE_BONUS, pulseTaskProgress } from '../../game/engagement/NeighborhoodPulse';
import { producerOf } from '../../game/quests/orders';
import { clock } from '../../services/clock';
import { rewardText, useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { Hearts, ItemChips, Panel, Portrait, Progress, Tabs } from '../components/Panel';

export function OrdersPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const [now, setNow] = useState(clock.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(clock.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Panel title="Request Board" icon="orders">
      <p className="muted small" style={{ marginTop: 0 }}>
        Neighbors pin requests here. Requests only ask for things you can already make.
      </p>
      <div className="stack">
        {g.orders.map((o) => {
          const ready = hasItems(g.inventory, o.items);
          return (
            <div key={o.id} className="list-item" style={{ alignItems: 'flex-start' }}>
              <Portrait resident={o.resident} />
              <div style={{ flex: 1, minWidth: 0 }} className="stack">
                <div>
                  <b style={{ fontFamily: 'var(--font-display)' }}>{RESIDENTS[o.resident].name}</b>
                  <span className="small muted"> needs</span>
                </div>
                <ItemChips items={o.items} game={g} />
                {!ready && (
                  <span className="small muted">
                    Make at:{' '}
                    {[...new Set(Object.keys(o.items).filter((i) => (g.inventory[i] ?? 0) < o.items[i]).map((i) => producerOf(i)?.name))].join(', ')}
                  </span>
                )}
                <div className="row row--between" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <span className="small" style={{ fontWeight: 800 }}>
                    <span className="row" style={{ gap: 4 }}>
                      <Icon name="coin" size={18} /> {o.reward.coins} <Icon name="xp" size={18} /> {o.reward.xp}
                    </span>
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    <button className="btn btn--plain btn--sm" onClick={() => dispatch({ type: 'skipOrder', id: o.id })} aria-label="Skip this request">
                      Skip
                    </button>
                    <button className="btn btn--sm" disabled={!ready} data-tutorial="deliver" onClick={() => dispatch({ type: 'deliverOrder', id: o.id }, [0, 1, 6])}>
                      Deliver
                    </button>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {g.orderCooldowns.map((t, i) => (
          <div key={i} className="list-item muted" style={{ borderStyle: 'dashed' }}>
            <Icon name="timer" size={30} />
            <span>A new request arrives in {Math.max(0, Math.ceil((t - now) / 1000))}s</span>
          </div>
        ))}
        {!g.orders.length && !g.orderCooldowns.length && (
          <div className="card muted">No requests yet. Build a shop that makes goods and your neighbors will start asking!</div>
        )}
      </div>
    </Panel>
  );
}

export function InventoryPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const items = Object.entries(g.inventory).filter(([, n]) => n > 0);
  return (
    <Panel title="Storage" icon="inventory">
      {items.length === 0 && <div className="card muted">Your storage is empty. Collect goods from your shops and garden.</div>}
      <div className="stack">
        {items.map(([id, n]) => (
          <div key={id} className="list-item">
            <div className="recipe__icon">
              <Icon name={id} size={36} />
            </div>
            <div style={{ flex: 1 }}>
              <b>
                {ITEMS[id].name} ×{n}
              </b>
              <div className="small muted">{ITEMS[id].description}</div>
            </div>
            <button className="btn btn--plain btn--sm" onClick={() => dispatch({ type: 'sellItem', item: id, qty: 1 })} aria-label={`Sell one ${ITEMS[id].name}`}>
              Sell <Icon name="coin" size={16} /> {Math.floor(ITEMS[id].value * 0.6)}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const ARRIVAL_HINT = (id: string) => {
  const a = RESIDENTS[id].arrival;
  if (a.type === 'building') return `Moves in when you build the ${BUILDINGS[a.building].name}`;
  if (a.type === 'level') return `Arrives at neighborhood level ${a.level}`;
  return '';
};

export function ResidentsPanel() {
  const g = useGame((s) => s.game!);
  const setUI = useGame((s) => s.setUI);
  return (
    <Panel title="Neighbors" icon="residents">
      <div className="stack">
        {RESIDENT_IDS.map((id) => {
          const def = RESIDENTS[id];
          const r = g.residents.find((x) => x.id === id);
          if (!r)
            return (
              <div key={id} className="list-item" style={{ opacity: 0.65 }}>
                <div className="portrait" style={{ display: 'grid', placeItems: 'center' }}>
                  <Icon name="lock" size={26} />
                </div>
                <div>
                  <b>???</b>
                  <div className="small muted">{ARRIVAL_HINT(id)}</div>
                </div>
              </div>
            );
          const lvl = friendshipLevel(r.friendship);
          const story = eligibleChapter(g, r);
          const active = activeChapter(r);
          return (
            <button key={id} className="list-item" style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }} onClick={() => setUI({ resident: id, panel: null })}>
              <Portrait resident={id} />
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 6 }}>
                  <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.08em' }}>{def.name}</b>
                  <span className="small muted">{def.profession}</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <Hearts level={lvl} />
                  <span className="small muted">{FRIENDSHIP_LEVELS[lvl].name}</span>
                </div>
                {story && <span className="chip" style={{ background: '#ffe9b8', marginTop: 4 }}>! New story: {story.title}</span>}
                {active && <span className="chip" style={{ background: '#dcefff', marginTop: 4 }}>Story: {active.title}</span>}
              </div>
              <Icon name="arrow" size={22} />
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/** Detail sheet inside the dialogue: bio, memories, gift picker. */
export function ResidentDetails({ id }: { id: string }) {
  const g = useGame((s) => s.game!);
  const r = g.residents.find((x) => x.id === id)!;
  const def = RESIDENTS[id];
  const lvl = friendshipLevel(r.friendship);
  const next = FRIENDSHIP_LEVELS[lvl + 1];
  const memories = Object.keys(r.memories)
    .map((k) => ({ k, t: r.memories[k], text: memoryText(id, k) }))
    .filter((m) => m.text)
    .sort((a, b) => b.t - a.t);
  return (
    <div className="stack small">
      <div>{def.bio}</div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {def.traits.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <b>Loves:</b>
        {def.favorites.map((f) => (
          <span key={f} className="chip">
            <Icon name={f} size={18} /> {ITEMS[f].name}
          </span>
        ))}
      </div>
      {next && (
        <div>
          <b>Friendship:</b> {r.friendship - FRIENDSHIP_LEVELS[lvl].at}/{next.at - FRIENDSHIP_LEVELS[lvl].at} to {next.name}
          <Progress value={r.friendship - FRIENDSHIP_LEVELS[lvl].at} max={next.at - FRIENDSHIP_LEVELS[lvl].at} />
        </div>
      )}
      {memories.length > 0 && (
        <div>
          <b>Shared memories</b>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {memories.slice(0, 5).map((m) => (
              <li key={m.k}>{m.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function memoryText(resident: string, key: string): string | null {
  const name = RESIDENTS[resident].name;
  const map: Record<string, string> = {
    moved_in: `${name} moved into the neighborhood.`,
    opened_cafe: 'You helped open the café together.',
    opened_bakery: 'You built the bakery together.',
    opened_garden: 'The first sprouts in the community garden.',
    opened_workshop: 'The workshop’s first day.',
    opened_park: 'The park opening party.',
    cafe_terrace: 'The café terrace opened.',
    fountain_built: 'The neighborhood fountain was finished.',
    expanded: 'You opened new land together.',
  };
  if (map[key]) return map[key];
  if (key.startsWith('gift_')) return `You gave ${name} their favorite: ${ITEMS[key.slice(5)]?.name ?? key}.`;
  const ch = STORIES.find((c) => c.memory === key);
  return ch ? `Story: “${ch.title}”` : null;
}

export function QuestsPanel() {
  const g = useGame((s) => s.game!);
  const setUI = useGame((s) => s.setUI);
  return (
    <Panel title="Quests & Stories" icon="quests">
      <div className="section-title" style={{ marginTop: 0 }}>
        <Icon name="quests" size={22} /> Neighborhood quests
      </div>
      <div className="stack">
        {g.quests.active.map((aq) => {
          const def = QUESTS.find((q) => q.id === aq.id)!;
          return (
            <div key={aq.id} className="card stack">
              <div className="row" style={{ gap: 8 }}>
                <Portrait resident={def.giver} />
                <div>
                  <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.1em' }}>{def.title}</b>
                  <div className="small muted">{def.intro}</div>
                </div>
              </div>
              {def.objectives.map((o, i) => {
                const p = objectiveProgress(g, o, aq.baseline);
                return (
                  <div key={i}>
                    <div className="row row--between small" style={{ fontWeight: 800 }}>
                      <span>
                        {p.done ? '✓ ' : ''}
                        {o.label}
                      </span>
                      <span>
                        {p.cur}/{p.n}
                      </span>
                    </div>
                    <Progress value={p.cur} max={p.n} />
                  </div>
                );
              })}
              <span className="small" style={{ fontWeight: 800 }}>
                Reward: {rewardText(def.reward)}
              </span>
            </div>
          );
        })}
        {!g.quests.active.length && <div className="card muted">All caught up! New quests unlock as your neighborhood grows.</div>}
      </div>
      <div className="section-title">
        <Icon name="story" size={22} /> Resident stories
      </div>
      <div className="stack">
        {g.residents.map((r) => {
          const ch = activeChapter(r) ?? eligibleChapter(g, r);
          if (!ch) return null;
          const active = !!r.storyActive;
          return (
            <button key={r.id} className="list-item" style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }} onClick={() => setUI({ resident: r.id, panel: null })}>
              <Portrait resident={r.id} />
              <div style={{ flex: 1 }}>
                <b>{ch.title}</b>
                <div className="small muted">
                  {RESIDENTS[r.id].name} · {active ? ch.objectives.map((o) => o.label).join(', ') : 'Talk to start this chapter'}
                </div>
              </div>
              <Icon name="arrow" size={22} />
            </button>
          );
        })}
        <div className="small muted">
          Chapters completed: {g.residents.reduce((a, r) => a + r.storyDone.length, 0)} / {STORIES.length}
        </div>
      </div>
    </Panel>
  );
}

export function PulsePanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const pulse = g.pulse;
  return (
    <Panel title="Neighborhood Pulse" icon="pulse">
      <p className="muted" style={{ marginTop: 0 }}>
        Three ideas for today — no pressure. They refresh tomorrow, and nothing is lost if you skip a day.
      </p>
      {!pulse && <div className="card muted">The Pulse starts once you’ve finished settling in.</div>}
      {pulse && (
        <div className="stack">
          {pulse.tasks.map((t) => {
            const p = pulseTaskProgress(g, t);
            const kind = t.kind === 'practical' ? 'Improve' : t.kind === 'resident' ? 'Connect' : 'Create';
            return (
              <div key={t.id} className="card stack" style={{ background: t.claimed ? '#eef9e6' : undefined }}>
                <div className="row row--between">
                  <span className="chip">{kind}</span>
                  <span className="small" style={{ fontWeight: 800 }}>
                    {rewardText(t.reward)}
                  </span>
                </div>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.1em' }}>
                  {t.claimed ? '✓ ' : ''}
                  {t.label}
                </b>
                <Progress value={Math.max(0, p)} max={t.n} />
              </div>
            );
          })}
          <button className="btn btn--gold btn--block" disabled={!pulse.tasks.every((t) => t.claimed) || pulse.bonusClaimed} onClick={() => dispatch({ type: 'claimPulseBonus' })}>
            {pulse.bonusClaimed ? 'Bonus claimed — see you tomorrow!' : <>Daily bonus: {rewardText(PULSE_BONUS)}</>}
          </button>
          <span className="small muted">Today: {dayKey(clock.now())}</span>
        </div>
      )}
    </Panel>
  );
}

export { Tabs };
