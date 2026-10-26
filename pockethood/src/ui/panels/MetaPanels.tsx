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
import { rewardText, useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { CostChips, Panel, Portrait, Progress, Tabs } from '../components/Panel';
import { cameraState } from '../../rendering/camera/CameraRig';

export function ProfilePanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const [tab, setTab] = useState<'me' | 'history' | 'achievements'>('me');
  const charm = g.buildings.reduce((a, b) => a + (BUILDINGS[b.type].charm ?? 0), 0);
  const buildings = g.buildings.filter((b) => !['decoration', 'path', 'landmark'].includes(BUILDINGS[b.type].category)).length;
  return (
    <Panel
      title="My Neighborhood"
      icon="home"
      tabs={
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { id: 'me', label: 'Profile' },
            { id: 'history', label: 'History' },
            { id: 'achievements', label: 'Achievements' },
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
                Your name
              </label>
              <input id="pname" className="card" style={{ padding: 8, font: 'inherit', fontWeight: 800 }} maxLength={18} value={g.profile.name} onChange={(e) => dispatch({ type: 'profile', patch: { name: e.target.value } })} />
              <label className="small muted" htmlFor="hname">
                Neighborhood name
              </label>
              <input id="hname" className="card" style={{ padding: 8, font: 'inherit', fontWeight: 800 }} maxLength={22} value={g.profile.hoodName} onChange={(e) => dispatch({ type: 'profile', patch: { hoodName: e.target.value || 'Maple Hollow' } })} />
            </div>
          </div>
          <div className="section-title">Avatar</div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {AVATARS.map((a) => (
              <button key={a.id} className="card" style={{ cursor: 'pointer', borderColor: g.profile.avatar === a.id ? 'var(--teal)' : '#fff', padding: 6 }} onClick={() => dispatch({ type: 'profile', patch: { avatar: a.id } })} aria-pressed={g.profile.avatar === a.id} aria-label={`Avatar ${a.label}`}>
                <Portrait model={a.id} />
                <div className="small" style={{ fontWeight: 800 }}>
                  {a.label}
                </div>
              </button>
            ))}
          </div>
          <p className="small muted">More outfits and hairstyles will come with future character packs; only variants backed by real models are offered.</p>
          <div className="section-title">Neighborhood stats</div>
          <div className="grid-cards">
            {[
              ['star', 'Level', g.level],
              ['build', 'Buildings', buildings],
              ['residents', 'Neighbors', g.residents.length],
              ['orders', 'Orders done', g.stats.orders ?? 0],
              ['flower', 'Charm', charm],
              ['map', 'Land plots', g.plots.length],
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
            Your neighborhood’s story, written by everything you’ve done.
          </p>
          {g.history.map((h, i) => (
            <div key={i} className="history-item">
              <Icon name={h.icon === 'order' ? 'orders' : h.icon} size={26} />
              <div>
                <div style={{ fontWeight: 700 }}>{h.text}</div>
                <div className="small muted">{new Date(h.t).toLocaleString()}</div>
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
  return (
    <Panel title="Settings" icon="settings">
      <div className="setting-row">
        <span className="row">
          <Icon name="sound" size={24} /> Music & ambience
        </span>
        <input className="slider" style={{ maxWidth: 160 }} type="range" min={0} max={1} step={0.05} value={st.musicVolume} onChange={(e) => set({ musicVolume: +e.target.value })} aria-label="Music volume" />
      </div>
      <div className="setting-row">
        <span className="row">
          <Icon name="sound" size={24} /> Sound effects
        </span>
        <input className="slider" style={{ maxWidth: 160 }} type="range" min={0} max={1} step={0.05} value={st.sfxVolume} onChange={(e) => set({ sfxVolume: +e.target.value })} aria-label="Sound effects volume" />
      </div>
      <div className="setting-row">
        <span className="row">
          <Icon name="mute" size={24} /> Mute all
        </span>
        <Toggle on={st.muted} onChange={(v) => set({ muted: v })} label="Mute all audio" />
      </div>
      <div className="setting-row">
        <span>Graphics</span>
        <span className="seg" role="group" aria-label="Graphics quality">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button key={q} aria-pressed={st.graphics === q} onClick={() => set({ graphics: q })}>
              {q[0].toUpperCase() + q.slice(1)}
            </button>
          ))}
        </span>
      </div>
      <div className="setting-row">
        <span>Day & night</span>
        <span className="seg" role="group" aria-label="Day and night cycle">
          {([
            ['cycle', 'Cycle'],
            ['local', 'My clock'],
            ['day', 'Always day'],
          ] as const).map(([v, l]) => (
            <button key={v} aria-pressed={st.dayNight === v} onClick={() => set({ dayNight: v })}>
              {l}
            </button>
          ))}
        </span>
      </div>
      <div className="setting-row">
        <span>Reduced motion</span>
        <Toggle on={st.reducedMotion} onChange={(v) => set({ reducedMotion: v })} label="Reduced motion" />
      </div>
      <div className="setting-row">
        <span>Text size</span>
        <span className="seg" role="group" aria-label="Text size">
          {[1, 1.15, 1.3].map((v) => (
            <button key={v} aria-pressed={st.textScale === v} onClick={() => set({ textScale: v })}>
              {v === 1 ? 'A' : v === 1.15 ? 'A+' : 'A++'}
            </button>
          ))}
        </span>
      </div>
      <div className="setting-row">
        <span>Always show grid</span>
        <Toggle on={st.showGrid} onChange={(v) => set({ showGrid: v })} label="Always show grid" />
      </div>
      <div className="setting-row">
        <span>
          Local analytics
          <div className="small muted">Kept on this device only, used to improve the game. Nothing is sent anywhere.</div>
        </span>
        <Toggle
          on={st.analyticsConsent}
          onChange={(v) => {
            set({ analyticsConsent: v });
            if (analytics) analytics.enabled = v;
          }}
          label="Local analytics"
        />
      </div>
      <div className="stack" style={{ marginTop: 16 }}>
        <button
          className="btn btn--sky"
          onClick={() => {
            dispatch({ type: 'tutorial', step: 0 });
            useGame.getState().setUI({ panel: null });
            useGame.getState().toast({ icon: 'help', title: 'Tutorial hints are back on', tone: 'info' });
            localStorage.removeItem('pockethood.hideHints');
          }}
        >
          Show tutorial hints again
        </button>
        <button className="btn btn--plain" onClick={() => openPanel('devtools')}>
          <Icon name="dev" size={20} /> Developer tools
        </button>
        {!confirmReset ? (
          <button className="btn btn--coral" onClick={() => setConfirmReset(true)}>
            Start a new neighborhood…
          </button>
        ) : (
          <div className="card stack">
            <b>This erases your neighborhood on this device. Are you sure?</b>
            <div className="row">
              <button className="btn btn--plain" onClick={() => setConfirmReset(false)}>
                Keep playing
              </button>
              <button className="btn btn--coral" onClick={() => void resetGame()}>
                Erase & restart
              </button>
            </div>
          </div>
        )}
        <p className="small muted">
          POCKETHOOD v0.1 · Art: original POCKETHOOD architecture kit + CC0 models by Kenney & Quaternius. See docs/ASSET_LICENSES.md.
        </p>
      </div>
    </Panel>
  );
}

export function HelpPanel() {
  return (
    <Panel title="How to play" icon="help">
      <div className="stack">
        {[
          ['coin', 'Collect', 'Tap a building when a bubble floats above it. Houses pay rent; shops and gardens make goods.'],
          ['build', 'Build', 'Open Build, pick something, drag it into place and tap ✓. Rotate with the arrow (or R).'],
          ['timer', 'Produce', 'Tap a shop to start production. Goods wait for you — even when you’re away.'],
          ['orders', 'Deliver', 'Neighbors pin requests on the Request Board. Deliver goods for coins, XP and friendship.'],
          ['upgrade', 'Upgrade', 'Upgrades add recipes, slots and visible changes. Planks and bricks come from the Workshop.'],
          ['residents', 'Befriend', 'Tap residents to chat. Gifts they love and helping with their stories deepen friendships — and they remember.'],
          ['pulse', 'Neighborhood Pulse', 'Three optional ideas each day. Skipping a day never costs you anything.'],
          ['camera', 'Photo mode', 'Hide the interface and capture your neighborhood.'],
        ].map(([icon, title, body]) => (
          <div key={title} className="list-item" style={{ alignItems: 'flex-start' }}>
            <Icon name={icon} size={34} />
            <div>
              <b style={{ fontFamily: 'var(--font-display)' }}>{title}</b>
              <div className="small">{body}</div>
            </div>
          </div>
        ))}
        <div className="card small">
          <b>Controls</b>
          <div>Drag to pan · Scroll or pinch to zoom · Tap to select</div>
          <div>
            While placing: <span className="kbd">R</span> rotate · <span className="kbd">Enter</span> confirm · <span className="kbd">Esc</span> cancel
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function FriendsPanel() {
  const g = useGame((s) => s.game!);
  return (
    <Panel title="Friends & Hoods" icon="friends">
      <div className="stack">
        <div className="coming-soon stack">
          <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.2em' }}>Online play is coming in a later update</b>
          <span>
            This version is single-player and stores everything on this device. There are no other players here yet — and we won’t pretend otherwise.
          </span>
        </div>
        <div className="card stack">
          <b>What’s planned</b>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Visit friends’ neighborhoods and leave a kind note</li>
            <li>Join a Hood of 5–20 players and build shared landmarks together</li>
            <li>Send optional gifts (no obligation to reciprocate)</li>
            <li>Share layouts as blueprints, with credit to the creator</li>
          </ul>
        </div>
        <div className="card row">
          <Portrait model={g.profile.avatar} />
          <div>
            <b>{g.profile.name}</b>
            <div className="small muted">Local profile · {g.profile.hoodName}</div>
          </div>
        </div>
        <p className="small muted">Meanwhile, your residents are building the fountain with you — see the Community Project at the plaza.</p>
      </div>
    </Panel>
  );
}

export function EventsPanel() {
  const g = useGame((s) => s.game!);
  const def = EVENTS[0];
  const ev = g.event;
  const end = ev ? ev.startedAt + def.durationDays * 86_400_000 : 0;
  const live = ev && clock.now() < end;
  return (
    <Panel title={def.name} icon="events">
      <p className="muted" style={{ marginTop: 0 }}>
        {def.description}
      </p>
      {!ev && <div className="card muted">Unlocks at level {def.minLevel}.</div>}
      {ev && !live && <div className="card muted">The festival has wrapped up. It will return soon — rewards you earned are yours to keep.</div>}
      {ev && live && (
        <div className="stack">
          <div className="chip" style={{ alignSelf: 'flex-start' }}>
            <Icon name="timer" size={18} /> {Math.ceil((end - clock.now()) / 86_400_000)} days left · optional
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
          <div className="section-title">Rewards</div>
          {def.tiers.map((t, i) => (
            <div key={i} className="list-item" style={{ opacity: ev.claimedTiers.includes(i) ? 0.7 : 1 }}>
              <Icon name={ev.claimedTiers.includes(i) ? 'check' : 'gift'} size={30} />
              <div style={{ flex: 1 }}>
                <b>{t.label}</b>
                <div className="small muted">
                  Complete {t.at} goal{t.at > 1 ? 's' : ''} · {rewardText(t.reward)}
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
  const p = COMMUNITY_PROJECTS[0];
  const ratio = communityRatio(g);
  const stage = communityStage(g);
  const locked = g.level < p.minLevel;
  return (
    <Panel title={p.name} icon="landmark">
      <p className="muted" style={{ marginTop: 0 }}>
        {p.description}
      </p>
      {locked && <div className="card">The project starts at level {p.minLevel}. The surveyors’ stakes are already in the plaza!</div>}
      <div className="card stack">
        <div className="row row--between">
          <b>{stage > 0 ? p.stages[stage - 1].label : 'Not started'}</b>
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
                  {res === 'coins' ? 'Coins' : ITEMS[res].name} {given}/{need}
                </b>
                <Progress value={given} max={need} />
                <div className="small muted">You have {have}</div>
              </div>
              <button
                className="btn btn--teal btn--sm"
                disabled={locked || complete || have <= 0 || !!g.community.completedAt}
                onClick={() => dispatch({ type: 'contribute', resource: res, qty: Math.min(step * (res === 'coins' ? 1 : 3), need - given), opId: `${res}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })}
              >
                {complete ? 'Done' : `Give ${res === 'coins' ? 50 : 'up to 3'}`}
              </button>
            </div>
          );
        })}
      </div>
      {g.community.completedAt && !g.community.rewardClaimed && (
        <button className="btn btn--gold btn--block" style={{ marginTop: 12 }} onClick={() => dispatch({ type: 'claimCommunityReward' })}>
          Celebrate! {rewardText(p.reward)}
        </button>
      )}
      {g.community.log.length > 0 && (
        <>
          <div className="section-title">Contributions</div>
          {g.community.log.slice(0, 12).map((l, i) => (
            <div key={i} className="history-item small">
              <Icon name="heart" size={20} />
              <span>
                <b>{l.who}</b> gave {l.what}
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
  return (
    <Panel title="Expand your land" icon="map">
      <p className="muted" style={{ marginTop: 0 }}>
        Buy plots that border your land. Each new plot clears the woods and opens space to build.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }} aria-label="Land map">
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
                <div className="small">{levelOk ? <CostChips cost={cost} game={g} /> : <span className="muted">Unlocks at level {e.minLevel}</span>}</div>
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
                Buy
              </button>
            </div>
          );
        })}
      </div>
      <p className="small muted">You own {g.plots.length - START_PLOTS.length + 4} plots.</p>
    </Panel>
  );
}

export function DevToolsPanel() {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
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
    <Panel title="Developer tools" icon="dev">
      <p className="small muted" style={{ marginTop: 0 }}>
        For testing only. Time offset: {Math.round(clock.offset / 60000)} min.
      </p>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        <button className="btn btn--sm btn--sky" onClick={() => skip(60_000)}>+1 min</button>
        <button className="btn btn--sm btn--sky" onClick={() => skip(10 * 60_000)}>+10 min</button>
        <button className="btn btn--sm btn--sky" onClick={() => skip(3_600_000)}>+1 hour</button>
        <button className="btn btn--sm btn--sky" onClick={() => skip(86_400_000)}>+1 day</button>
        <button className="btn btn--sm btn--plain" onClick={() => { clock.reset(); force((x) => x + 1); }}>Reset time</button>
      </div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <button className="btn btn--sm btn--gold" onClick={() => useGame.setState({ game: { ...g, coins: g.coins + 1000 } })}>+1000 coins</button>
        <button className="btn btn--sm btn--gem" onClick={() => useGame.setState({ game: { ...g, gems: g.gems + 20 } })}>+20 gems</button>
        <button className="btn btn--sm btn--teal" onClick={() => useGame.setState({ game: { ...g, inventory: Object.fromEntries(Object.keys(ITEMS).map((k) => [k, (g.inventory[k] ?? 0) + 10])) } })}>+10 of every item</button>
        <button className="btn btn--sm btn--coral" onClick={() => useGame.setState({ game: { ...g, xp: g.xp + 200, level: levelForXp(g.xp + 200) } })}>+200 XP</button>
      </div>
      <p className="small muted">Camera: zoom {cameraState.zoom.toFixed(2)}</p>
      <div className="section-title">Analytics events (local only)</div>
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
