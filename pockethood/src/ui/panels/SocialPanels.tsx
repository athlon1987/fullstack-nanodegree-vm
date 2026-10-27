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
import { t, useT } from '../../platform/i18n';
import { rewardText, useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { Hearts, ItemChips, Panel, Portrait, Progress, Tabs } from '../components/Panel';
import { tc } from '../../platform/i18n/content';

export function OrdersPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const t = useT();
  const [now, setNow] = useState(clock.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(clock.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <Panel title={t('social.orders.title')} icon="orders">
      <p className="muted small" style={{ marginTop: 0 }}>
        {t('social.orders.intro')}
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
                  <span className="small muted"> {t('social.orders.needs')}</span>
                </div>
                <ItemChips items={o.items} game={g} />
                {!ready && (
                  <span className="small muted">
                    {t('social.orders.makeAt', { places: [...new Set(Object.keys(o.items).filter((i) => (g.inventory[i] ?? 0) < o.items[i]).map((i) => producerOf(i)?.name))].join(', ') })}
                  </span>
                )}
                <div className="row row--between" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <span className="small" style={{ fontWeight: 800 }}>
                    <span className="row" style={{ gap: 4 }}>
                      <Icon name="coin" size={18} /> {o.reward.coins} <Icon name="xp" size={18} /> {o.reward.xp}
                    </span>
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    <button className="btn btn--plain btn--sm" onClick={() => dispatch({ type: 'skipOrder', id: o.id })} aria-label={t('social.orders.skipAria')}>
                      {t('social.orders.skip')}
                    </button>
                    <button className="btn btn--sm" disabled={!ready} data-tutorial="deliver" onClick={() => dispatch({ type: 'deliverOrder', id: o.id }, [0, 1, 6])}>
                      {t('social.orders.deliver')}
                    </button>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {g.orderCooldowns.map((at, i) => (
          <div key={i} className="list-item muted" style={{ borderStyle: 'dashed' }}>
            <Icon name="timer" size={30} />
            <span>{t('social.orders.nextIn', { secs: String(Math.max(0, Math.ceil((at - now) / 1000))) })}</span>
          </div>
        ))}
        {!g.orders.length && !g.orderCooldowns.length && (
          <div className="card muted">{t('social.orders.empty')}</div>
        )}
      </div>
    </Panel>
  );
}

export function InventoryPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const t = useT();
  const items = Object.entries(g.inventory).filter(([, n]) => n > 0);
  return (
    <Panel title={t('social.inventory.title')} icon="inventory">
      {items.length === 0 && <div className="card muted">{t('social.inventory.empty')}</div>}
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
            <button className="btn btn--plain btn--sm" onClick={() => dispatch({ type: 'sellItem', item: id, qty: 1 })} aria-label={t('social.inventory.sellAria', { item: ITEMS[id].name })}>
              {t('social.inventory.sell')} <Icon name="coin" size={16} /> {Math.floor(ITEMS[id].value * 0.6)}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const ARRIVAL_HINT = (id: string) => {
  const a = RESIDENTS[id].arrival;
  if (a.type === 'building') return t('social.residents.arrivalBuilding', { building: BUILDINGS[a.building].name });
  if (a.type === 'level') return t('social.residents.arrivalLevel', { level: a.level });
  return '';
};

export function ResidentsPanel() {
  const g = useGame((s) => s.game!);
  const setUI = useGame((s) => s.setUI);
  const t = useT();
  return (
    <Panel title={t('social.residents.title')} icon="residents">
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
                  <span className="small muted">{t(`common.friend.${lvl}`)}</span>
                </div>
                {story && <span className="chip" style={{ background: '#ffe9b8', marginTop: 4 }}>{t('social.residents.newStory', { title: story.title })}</span>}
                {active && <span className="chip" style={{ background: '#dcefff', marginTop: 4 }}>{t('social.residents.story', { title: active.title })}</span>}
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
  const t = useT();
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
        {def.traits.map((trait) => (
          <span key={trait} className="chip">
            {trait}
          </span>
        ))}
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <b>{t('social.details.loves')}</b>
        {def.favorites.map((f) => (
          <span key={f} className="chip">
            <Icon name={f} size={18} /> {ITEMS[f].name}
          </span>
        ))}
      </div>
      {next && (
        <div>
          <b>{t('social.details.friendship')}</b> {t('social.details.toNext', { cur: r.friendship - FRIENDSHIP_LEVELS[lvl].at, max: next.at - FRIENDSHIP_LEVELS[lvl].at, level: t(`common.friend.${lvl + 1}`) })}
          <Progress value={r.friendship - FRIENDSHIP_LEVELS[lvl].at} max={next.at - FRIENDSHIP_LEVELS[lvl].at} />
        </div>
      )}
      {memories.length > 0 && (
        <div>
          <b>{t('social.details.memories')}</b>
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

const MEMORY_KEYS = ['moved_in', 'opened_cafe', 'opened_bakery', 'opened_garden', 'opened_workshop', 'opened_park', 'upgraded_cafe_2', 'landmark_built', 'expanded'];

function memoryText(resident: string, key: string): string | null {
  const name = RESIDENTS[resident].name;
  if (MEMORY_KEYS.includes(key)) return t(`social.memory.${key}`, { name });
  if (key.startsWith('gift_')) return t('social.memory.gift', { name, item: ITEMS[key.slice(5)]?.name ?? key });
  const ch = STORIES.find((c) => c.memory === key);
  return ch ? t('social.memory.story', { title: ch.title }) : null;
}

export function QuestsPanel() {
  const g = useGame((s) => s.game!);
  const setUI = useGame((s) => s.setUI);
  const t = useT();
  return (
    <Panel title={t('social.quests.title')} icon="quests">
      <div className="section-title" style={{ marginTop: 0 }}>
        <Icon name="quests" size={22} /> {t('social.quests.hoodQuests')}
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
                {t('social.quests.reward', { reward: rewardText(def.reward) })}
              </span>
            </div>
          );
        })}
        {!g.quests.active.length && <div className="card muted">{t('social.quests.empty')}</div>}
      </div>
      <div className="section-title">
        <Icon name="story" size={22} /> {t('social.quests.residentStories')}
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
                  {RESIDENTS[r.id].name} · {active ? ch.objectives.map((o) => o.label).join(', ') : t('social.quests.talkToStart')}
                </div>
              </div>
              <Icon name="arrow" size={22} />
            </button>
          );
        })}
        <div className="small muted">
          {t('social.quests.chaptersDone', { done: g.residents.reduce((a, r) => a + r.storyDone.length, 0), total: STORIES.length })}
        </div>
      </div>
    </Panel>
  );
}

export function PulsePanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const t = useT();
  const pulse = g.pulse;
  return (
    <Panel title={t('social.pulse.title')} icon="pulse">
      <p className="muted" style={{ marginTop: 0 }}>
        {t('social.pulse.intro')}
      </p>
      {!pulse && <div className="card muted">{t('social.pulse.notYet')}</div>}
      {pulse && (
        <div className="stack">
          {pulse.tasks.map((task) => {
            const p = pulseTaskProgress(g, task);
            const kind = task.kind === 'practical' ? t('social.pulse.kind.practical') : task.kind === 'resident' ? t('social.pulse.kind.resident') : t('social.pulse.kind.creative');
            return (
              <div key={task.id} className="card stack" style={{ background: task.claimed ? '#eef9e6' : undefined }}>
                <div className="row row--between">
                  <span className="chip">{kind}</span>
                  <span className="small" style={{ fontWeight: 800 }}>
                    {rewardText(task.reward)}
                  </span>
                </div>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.1em' }}>
                  {task.claimed ? '✓ ' : ''}
                  {task.key ? tc(task.key, task.params) : task.label}
                </b>
                <Progress value={Math.max(0, p)} max={task.n} />
              </div>
            );
          })}
          <button className="btn btn--gold btn--block" disabled={!pulse.tasks.every((task) => task.claimed) || pulse.bonusClaimed} onClick={() => dispatch({ type: 'claimPulseBonus' })}>
            {pulse.bonusClaimed ? t('social.pulse.bonusClaimed') : <>{t('social.pulse.bonus', { reward: rewardText(PULSE_BONUS) })}</>}
          </button>
          <span className="small muted">{t('social.pulse.today', { day: dayKey(clock.now()) })}</span>
        </div>
      )}
    </Panel>
  );
}

export { Tabs };
