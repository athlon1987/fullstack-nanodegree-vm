import { useEffect, useState } from 'react';
import { BUILDINGS } from '../../data/buildings';
import { ITEMS } from '../../data/items';
import { ACHIEVEMENTS, COMMUNITY_PROJECTS, EVENTS, EXPANSIONS, expansionCost, START_PLOTS } from '../../data/progression';
import { AVATARS } from '../../data/residents';
import { communityRatio, communityStage, plotUnlockable } from '../../game/core/actions';
import type { Settings } from '../../game/core/types';
import { canAfford, levelForXp } from '../../game/economy/economy';
import { objectiveProgress } from '../../game/engagement/objectives';
import { analytics } from '../../services/analytics';
import { clock } from '../../services/clock';
import { bcp47, useT } from '../../platform/i18n';
import { rewardText, useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { CostChips, Panel, Portrait, Progress, Tabs } from '../components/Panel';
import { cameraState } from '../../rendering/camera/CameraRig';
import { safeRemove } from '../../utils/safeStorage';
import { tc, tokenText } from '../../platform/i18n/content';

export function ProfilePanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const t = useT();
  const [tab, setTab] = useState<'me' | 'history' | 'achievements'>('me');
  const charm = g.buildings.reduce((a, b) => a + (BUILDINGS[b.type].charm ?? 0), 0);
  const buildings = g.buildings.filter((b) => !['decoration', 'path', 'landmark'].includes(BUILDINGS[b.type].category)).length;
  return (
    <Panel
      title={t('meta.profile.title')}
      icon="home"
      tabs={
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { id: 'me', label: t('meta.profile.tab.me') },
            { id: 'history', label: t('meta.profile.tab.history') },
            { id: 'achievements', label: t('meta.profile.tab.achievements') },
          ]}
        />
      }
    >
      {tab === 'me' && (
        <div className="stack">
          <div className="card row">
            <Portrait model={g.profile.avatar} size="lg" />
            <div className="stack" style={{ flex: 1, gap: 6 }}>
              <label className="small muted" htmlFor="pname">
                {t('meta.profile.yourName')}
              </label>
              <input id="pname" className="card" style={{ padding: 8, font: 'inherit', fontWeight: 800 }} maxLength={18} value={g.profile.name} onChange={(e) => dispatch({ type: 'profile', patch: { name: e.target.value } })} />
              <label className="small muted" htmlFor="hname">
                {t('meta.profile.hoodName')}
              </label>
              <input id="hname" className="card" style={{ padding: 8, font: 'inherit', fontWeight: 800 }} maxLength={22} value={g.profile.hoodName} onChange={(e) => dispatch({ type: 'profile', patch: { hoodName: e.target.value || 'Maple Hollow' } })} />
            </div>
          </div>
          <div className="section-title">{t('meta.profile.avatar')}</div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {AVATARS.map((a) => (
              <button key={a.id} className="card" style={{ cursor: 'pointer', borderColor: g.profile.avatar === a.id ? 'var(--teal)' : '#fff', padding: 6 }} onClick={() => dispatch({ type: 'profile', patch: { avatar: a.id } })} aria-pressed={g.profile.avatar === a.id} aria-label={t('meta.profile.avatarAria', { label: a.label })}>
                <Portrait model={a.id} />
                <div className="small" style={{ fontWeight: 800 }}>
                  {a.label}
                </div>
              </button>
            ))}
          </div>
          <p className="small muted">{t('meta.profile.moreOutfits')}</p>
          <div className="section-title">{t('meta.profile.stats')}</div>
          <div className="grid-cards">
            {[
              ['star', t('meta.stat.level'), g.level],
              ['build', t('meta.stat.buildings'), buildings],
              ['residents', t('meta.stat.neighbors'), g.residents.length],
              ['orders', t('meta.stat.orders'), g.stats.orders ?? 0],
              ['flower', t('meta.stat.charm'), charm],
              ['map', t('meta.stat.plots'), g.plots.length],
            ].map(([icon, label, v]) => (
              <div key={label as string} className="card" style={{ textAlign: 'center' }}>
                <Icon name={icon as string} size={30} style={{ margin: '0 auto' }} />
                <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.4em' }}>{v as number}</b>
                <div className="small muted">{label as string}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'history' && (
        <div>
          <p className="muted small" style={{ marginTop: 0 }}>
            {t('meta.history.intro')}
          </p>
          {g.history.map((h, i) => (
            <div key={i} className="history-item">
              <Icon name={h.icon === 'order' ? 'orders' : h.icon} size={26} />
              <div>
                <div style={{ fontWeight: 700 }}>{h.key ? tc(h.key, h.params) : h.text}</div>
                <div className="small muted">{new Date(h.t).toLocaleString(bcp47())}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'achievements' && (
        <div className="grid-cards">
          {ACHIEVEMENTS.map((a) => {
            const got = g.achievements.includes(a.id);
            return (
              <div key={a.id} className="card" style={{ textAlign: 'center', opacity: got ? 1 : 0.55 }}>
                <Icon name={got ? 'trophy' : 'lock'} size={34} style={{ margin: '0 auto' }} />
                <b style={{ fontFamily: 'var(--font-display)' }}>{a.name}</b>
                <div className="small muted">{a.description}</div>
                <div className="small" style={{ fontWeight: 800 }}>
                  {rewardText(a.reward)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className="toggle" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function SettingsPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const resetGame = useGame((s) => s.resetGame);
  const openPanel = useGame((s) => s.openPanel);
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings', patch });
  const st = g.settings;
  const t = useT();
  return (
    <Panel title={t('meta.settings.title')} icon="settings">
      <div className="setting-row">
        <span className="row">
          <Icon name="sound" size={24} /> {t('meta.settings.music')}
        </span>
        <input className="slider" style={{ maxWidth: 160 }} type="range" min={0} max={1} step={0.05} value={st.musicVolume} onChange={(e) => set({ musicVolume: +e.target.value })} aria-label={t('meta.settings.musicAria')} />
      </div>
      <div className="setting-row">
        <span className="row">
          <Icon name="sound" size={24} /> {t('meta.settings.sfx')}
        </span>
        <input className="slider" style={{ maxWidth: 160 }} type="range" min={0} max={1} step={0.05} value={st.sfxVolume} onChange={(e) => set({ sfxVolume: +e.target.value })} aria-label={t('meta.settings.sfxAria')} />
      </div>
      <div className="setting-row">
        <span className="row">
          <Icon name="mute" size={24} /> {t('meta.settings.mute')}
        </span>
        <Toggle on={st.muted} onChange={(v) => set({ muted: v })} label={t('meta.settings.muteAria')} />
      </div>
      <div className="setting-row">
        <span>{t('meta.settings.graphics')}</span>
        <span className="seg" role="group" aria-label={t('meta.settings.graphicsAria')}>
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button key={q} aria-pressed={st.graphics === q} onClick={() => set({ graphics: q })}>
              {t(`meta.settings.graphics.${q}`)}
            </button>
          ))}
        </span>
      </div>
      <div className="setting-row">
        <span>{t('meta.settings.dayNight')}</span>
        <span className="seg" role="group" aria-label={t('meta.settings.dayNightAria')}>
          {([
            ['cycle', t('meta.settings.dayNight.cycle')],
            ['local', t('meta.settings.dayNight.local')],
            ['day', t('meta.settings.dayNight.day')],
          ] as const).map(([v, l]) => (
            <button key={v} aria-pressed={st.dayNight === v} onClick={() => set({ dayNight: v })}>
              {l}
            </button>
          ))}
        </span>
      </div>
      <div className="setting-row">
        <span>{t('meta.settings.reducedMotion')}</span>
        <Toggle on={st.reducedMotion} onChange={(v) => set({ reducedMotion: v })} label={t('meta.settings.reducedMotion')} />
      </div>
      <div className="setting-row">
        <span>{t('meta.settings.textSize')}</span>
        <span className="seg" role="group" aria-label={t('meta.settings.textSize')}>
          {[1, 1.15, 1.3].map((v) => (
            <button key={v} aria-pressed={st.textScale === v} onClick={() => set({ textScale: v })}>
              {v === 1 ? 'A' : v === 1.15 ? 'A+' : 'A++'}
            </button>
          ))}
        </span>
      </div>
      <div className="setting-row">
        <span>{t('meta.settings.grid')}</span>
        <Toggle on={st.showGrid} onChange={(v) => set({ showGrid: v })} label={t('meta.settings.grid')} />
      </div>
      <div className="setting-row">
        <span>
          {t('meta.settings.analytics')}
          <div className="small muted">{t('meta.settings.analyticsNote')}</div>
        </span>
        <Toggle
          on={st.analyticsConsent}
          onChange={(v) => {
            set({ analyticsConsent: v });
            if (analytics) analytics.enabled = v;
          }}
          label={t('meta.settings.analytics')}
        />
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <button
          className="btn btn--sky"
          onClick={() => {
            dispatch({ type: 'tutorial', step: 0 });
            useGame.getState().setUI({ panel: null });
            useGame.getState().toast({ icon: 'help', title: t('meta.settings.hintsToast'), tone: 'info' });
            safeRemove('pockethood.hideHints');
          }}
        >
          {t('meta.settings.hintsAgain')}
        </button>
        <button className="btn btn--plain" onClick={() => openPanel('devtools')}>
          <Icon name="dev" size={20} /> {t('meta.settings.devtools')}
        </button>
        {!confirmReset ? (
          <button className="btn btn--coral" onClick={() => setConfirmReset(true)}>
            {t('meta.settings.newHood')}
          </button>
        ) : (
          <div className="card stack">
            <b>{t('meta.settings.resetConfirm')}</b>
            <div className="row">
              <button className="btn btn--plain" onClick={() => setConfirmReset(false)}>
                {t('meta.settings.keepPlaying')}
              </button>
              <button className="btn btn--coral" onClick={() => void resetGame()}>
                {t('meta.settings.eraseRestart')}
              </button>
            </div>
          </div>
        )}
        <p className="small muted">
          {t('meta.settings.credits')}
        </p>
      </div>
    </Panel>
  );
}

export function HelpPanel() {
  const t = useT();
  return (
    <Panel title={t('meta.help.title')} icon="help">
      <div className="stack">
        {[
          ['coin', 'collect'],
          ['build', 'build'],
          ['timer', 'produce'],
          ['orders', 'deliver'],
          ['upgrade', 'upgrade'],
          ['residents', 'befriend'],
          ['pulse', 'pulse'],
          ['camera', 'photo'],
        ].map(([icon, id]) => (
          <div key={id} className="list-item" style={{ alignItems: 'flex-start' }}>
            <Icon name={icon} size={34} />
            <div>
              <b style={{ fontFamily: 'var(--font-display)' }}>{t(`meta.help.${id}.title`)}</b>
              <div className="small">{t(`meta.help.${id}.body`)}</div>
            </div>
          </div>
        ))}
        <div className="card small">
          <b>{t('meta.help.controls')}</b>
          <div>{t('meta.help.controlsLine')}</div>
          <div>
            {t('meta.help.whilePlacing')} <span className="kbd">R</span> {t('meta.help.rotate')} · <span className="kbd">Enter</span> {t('meta.help.confirm')} · <span className="kbd">Esc</span> {t('meta.help.cancel')}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function FriendsPanel() {
  const g = useGame((s) => s.game!);
  const t = useT();
  return (
    <Panel title={t('meta.friends.title')} icon="friends">
      <div className="stack">
        <div className="coming-soon stack">
          <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.2em' }}>{t('meta.friends.comingSoon')}</b>
          <span>
            {t('meta.friends.singlePlayer')}
          </span>
        </div>
        <div className="card stack">
          <b>{t('meta.friends.planned')}</b>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>{t('meta.friends.plan.visit')}</li>
            <li>{t('meta.friends.plan.hood')}</li>
            <li>{t('meta.friends.plan.gifts')}</li>
            <li>{t('meta.friends.plan.blueprints')}</li>
          </ul>
        </div>
        <div className="card row">
          <Portrait model={g.profile.avatar} />
          <div>
            <b>{g.profile.name}</b>
            <div className="small muted">{t('meta.friends.localProfile', { hood: g.profile.hoodName })}</div>
          </div>
        </div>
        <p className="small muted">{t('meta.friends.meanwhile')}</p>
      </div>
    </Panel>
  );
}

export function EventsPanel() {
  const g = useGame((s) => s.game!);
  const t = useT();
  const def = EVENTS[0];
  const ev = g.event;
  const end = ev ? ev.startedAt + def.durationDays * 86_400_000 : 0;
  const live = ev && clock.now() < end;
  return (
    <Panel title={def.name} icon="events">
      <p className="muted" style={{ marginTop: 0 }}>
        {def.description}
      </p>
      {!ev && <div className="card muted">{t('meta.events.unlocksAt', { level: def.minLevel })}</div>}
      {ev && !live && <div className="card muted">{t('meta.events.wrapped')}</div>}
      {ev && live && (
        <div className="stack">
          <div className="chip" style={{ alignSelf: 'flex-start' }}>
            <Icon name="timer" size={18} /> {t('meta.events.daysLeft', { n: Math.ceil((end - clock.now()) / 86_400_000) })}
          </div>
          {def.objectives.map((o, i) => {
            const p = objectiveProgress(g, o, ev.baseline);
            return (
              <div key={i} className="card">
                <div className="row row--between" style={{ fontWeight: 800 }}>
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
          <div className="section-title">{t('meta.events.rewards')}</div>
          {def.tiers.map((tier, i) => (
            <div key={i} className="list-item" style={{ opacity: ev.claimedTiers.includes(i) ? 0.7 : 1 }}>
              <Icon name={ev.claimedTiers.includes(i) ? 'check' : 'gift'} size={30} />
              <div style={{ flex: 1 }}>
                <b>{tier.label}</b>
                <div className="small muted">
                  {t('meta.events.tierGoal', { n: tier.at, reward: rewardText(tier.reward) })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function CommunityPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const t = useT();
  const p = COMMUNITY_PROJECTS[0];
  const ratio = communityRatio(g);
  const stage = communityStage(g);
  const locked = g.level < p.minLevel;
  return (
    <Panel title={p.name} icon="landmark">
      <p className="muted" style={{ marginTop: 0 }}>
        {p.description}
      </p>
      {locked && <div className="card">{t('meta.community.startsAt', { level: p.minLevel })}</div>}
      <div className="card stack">
        <div className="row row--between">
          <b>{stage > 0 ? p.stages[stage - 1].label : t('meta.community.notStarted')}</b>
          <span style={{ fontWeight: 800 }}>{Math.round(ratio * 100)}%</span>
        </div>
        <Progress value={ratio * 100} max={100} />
        <div className="row small muted" style={{ gap: 10, flexWrap: 'wrap' }}>
          {p.stages.map((s, i) => (
            <span key={s.label}>
              {i < stage ? '✓' : '○'} {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="stack" style={{ marginTop: 12 }}>
        {Object.entries(p.requirements as Record<string, number>).map(([res, need]) => {
          const given = (g.community.contributed as Record<string, number>)[res] ?? 0;
          const have = res === 'coins' ? g.coins : g.inventory[res] ?? 0;
          const step = res === 'coins' ? 50 : 1;
          const complete = given >= need;
          return (
            <div key={res} className="list-item">
              <Icon name={res === 'coins' ? 'coin' : res} size={34} />
              <div style={{ flex: 1 }}>
                <b>
                  {res === 'coins' ? t('common.coins') : ITEMS[res].name} {given}/{need}
                </b>
                <Progress value={given} max={need} />
                <div className="small muted">{t('meta.community.youHave', { n: have })}</div>
              </div>
              <button
                className="btn btn--teal btn--sm"
                disabled={locked || complete || have <= 0 || !!g.community.completedAt}
                onClick={() => dispatch({ type: 'contribute', resource: res, qty: Math.min(step * (res === 'coins' ? 1 : 3), need - given), opId: `${res}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })}
              >
                {complete ? t('common.done') : res === 'coins' ? t('meta.community.give', { n: 50 }) : t('meta.community.giveUpTo', { n: 3 })}
              </button>
            </div>
          );
        })}
      </div>
      {g.community.completedAt && !g.community.rewardClaimed && (
        <button className="btn btn--gold btn--block" style={{ marginTop: 12 }} onClick={() => dispatch({ type: 'claimCommunityReward' })}>
          {t('meta.community.celebrate', { reward: rewardText(p.reward) })}
        </button>
      )}
      {g.community.log.length > 0 && (
        <>
          <div className="section-title">{t('meta.community.contributions')}</div>
          {g.community.log.slice(0, 12).map((l, i) => (
            <div key={i} className="history-item small">
              <Icon name="heart" size={20} />
              <span>
                <b>{l.who}</b> {t('meta.community.gave', { what: tokenText(l.what) })}
              </span>
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}

export function ExpandPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const focusOn = useGame((s) => s.focusOn);
  const t = useT();
  return (
    <Panel title={t('meta.expand.title')} icon="map">
      <p className="muted" style={{ marginTop: 0 }}>
        {t('meta.expand.intro')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }} aria-label={t('meta.expand.mapAria')}>
        {[0, 1, 2, 3].flatMap((pz) =>
          [0, 1, 2, 3].map((px) => {
            const id = `p${px}${pz}`;
            const owned = g.plots.includes(id);
            const avail = plotUnlockable(g, id);
            return (
              <div key={id} className="card" style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', padding: 4, background: owned ? '#bfe6a3' : avail ? '#fff4d6' : '#e9e2d3' }} title={id}>
                <Icon name={owned ? 'home' : avail ? 'map' : 'lock'} size={22} />
              </div>
            );
          }),
        )}
      </div>
      <div className="stack">
        {EXPANSIONS.filter((e) => plotUnlockable(g, e.id)).map((e) => {
          const cost = expansionCost(e, g.plots.length);
          const levelOk = g.level >= e.minLevel;
          return (
            <div key={e.id} className="list-item">
              <Icon name="map" size={34} />
              <div style={{ flex: 1 }}>
                <b style={{ fontFamily: 'var(--font-display)' }}>{e.name}</b>
                <div className="small">{levelOk ? <CostChips cost={cost} game={g} /> : <span className="muted">{t('meta.expand.unlocksAt', { level: e.minLevel })}</span>}</div>
              </div>
              <button
                className="btn btn--sm"
                disabled={!levelOk || !canAfford(g, cost)}
                onClick={() => {
                  const r = dispatch({ type: 'unlockPlot', plot: e.id });
                  if (r && !r.error) {
                    useGame.getState().openPanel(null);
                    focusOn(e.rect[0] + 3 - 12, e.rect[1] + 3 - 12, 1.2);
                  }
                }}
              >
                {t('meta.expand.buy')}
              </button>
            </div>
          );
        })}
      </div>
      <p className="small muted">{t('meta.expand.youOwn', { n: g.plots.length - START_PLOTS.length + 4 })}</p>
    </Panel>
  );
}

export function DevToolsPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const t = useT();
  const [, force] = useState(0);
  const [events, setEvents] = useState(analytics?.list() ?? []);
  useEffect(() => {
    const id = window.setInterval(() => setEvents(analytics?.list() ?? []), 1500);
    return () => window.clearInterval(id);
  }, []);
  const skip = (ms: number) => {
    clock.advance(ms);
    dispatch({ type: 'tick' });
    force((x) => x + 1);
  };
  return (
    <Panel title={t('meta.dev.title')} icon="dev">
      <p className="small muted" style={{ marginTop: 0 }}>
        {t('meta.dev.offset', { min: String(Math.round(clock.offset / 60000)) })}
      </p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        <button className="btn btn--sm btn--sky" onClick={() => skip(60_000)}>{t('meta.dev.plus1min')}</button>
        <button className="btn btn--sm btn--sky" onClick={() => skip(10 * 60_000)}>{t('meta.dev.plus10min')}</button>
        <button className="btn btn--sm btn--sky" onClick={() => skip(3_600_000)}>{t('meta.dev.plus1h')}</button>
        <button className="btn btn--sm btn--sky" onClick={() => skip(86_400_000)}>{t('meta.dev.plus1d')}</button>
        <button className="btn btn--sm btn--plain" onClick={() => { clock.reset(); force((x) => x + 1); }}>{t('meta.dev.resetTime')}</button>
      </div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <button className="btn btn--sm btn--gold" onClick={() => useGame.setState({ game: { ...g, coins: g.coins + 1000 } })}>{t('meta.dev.coins')}</button>
        <button className="btn btn--sm btn--gem" onClick={() => useGame.setState({ game: { ...g, gems: g.gems + 20 } })}>{t('meta.dev.gems')}</button>
        <button className="btn btn--sm btn--teal" onClick={() => useGame.setState({ game: { ...g, inventory: Object.fromEntries(Object.keys(ITEMS).map((k) => [k, (g.inventory[k] ?? 0) + 10])) } })}>{t('meta.dev.items')}</button>
        <button className="btn btn--sm btn--coral" onClick={() => useGame.setState({ game: { ...g, xp: g.xp + 200, level: levelForXp(g.xp + 200) } })}>{t('meta.dev.xp')}</button>
      </div>
      <p className="small muted">{t('meta.dev.camera', { zoom: cameraState.zoom.toFixed(2) })}</p>
      <div className="section-title">{t('meta.dev.analytics')}</div>
      <div className="small" style={{ fontFamily: 'ui-monospace, monospace', maxHeight: 260, overflow: 'auto' }}>
        {events.slice(0, 80).map((e, i) => (
          <div key={i}>
            {new Date(e.t).toLocaleTimeString()} <b>{e.name}</b> {JSON.stringify(e.props)}
          </div>
        ))}
      </div>
    </Panel>
  );
}
