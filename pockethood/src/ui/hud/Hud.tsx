// Main HUD: profile/level, currencies, quest tracker + Pulse, bottom navigation,
// camera rail, toasts and reward fly-ups.
import { useEffect, useRef, useState } from 'react';
import { QUESTS } from '../../data/progression';
import { eligibleChapter } from '../../game/characters/relationships';
import { xpProgress, hasItems } from '../../game/economy/economy';
import { objectiveProgress } from '../../game/engagement/objectives';
import { pulseTaskProgress } from '../../game/engagement/NeighborhoodPulse';
import { zoomBy } from '../../rendering/camera/CameraRig';
import { project } from '../../rendering/scene/coords';
import { useGame, type FlyFx, type PanelId } from '../../state/store';
import { Icon } from '../components/Icon';
import { EVENTS } from '../../data/progression';
import { clock } from '../../services/clock';
import { useT } from '../../platform/i18n';

const fmtNum = (n: number) => (n >= 100000 ? `${Math.floor(n / 1000)}k` : n.toLocaleString());

function Counter({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const from = shown;
    const start = performance.now();
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / 600);
      setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{fmtNum(shown)}</span>;
}

export function TopBar() {
  const t = useT();
  const g = useGame((s) => s.game!);
  const openPanel = useGame((s) => s.openPanel);
  const bump = useGame((s) => s.ui.bumps.coins ?? 0);
  const [bumping, setBumping] = useState(false);
  useEffect(() => {
    if (!bump) return;
    setBumping(true);
    const id = window.setTimeout(() => setBumping(false), 450);
    return () => window.clearTimeout(id);
  }, [bump]);
  const xp = xpProgress(g);
  const zen = g.settings.zen;
  return (
    <div className="topbar">
      <button className="profile-chip" onClick={() => openPanel('profile')} aria-label={t('hud.profileAria', { level: g.level })} data-tutorial="profile">
        <div className="level-badge">{g.level}</div>
        <div className="profile-chip__text">
          <span className="profile-chip__name">{g.profile.hoodName}</span>
          <div className="xpbar" title={t('hud.xpTitle', { cur: xp.cur, need: xp.need })}>
            <i style={{ width: `${Math.round(xp.ratio * 100)}%` }} />
          </div>
        </div>
      </button>
      <div className="spacer" />
      {zen ? (
        <button className="pill zen-pill" onClick={() => useGame.getState().setUI({ activity: { kind: 'zen' } })} aria-label={t('zen.hudAria')}>
          <Icon name="zen" size={30} /> {t('zen.hud')}
        </button>
      ) : (
        <>
          <div className={`pill ${bumping ? 'bump' : ''}`} id="hud-coins" aria-label={t('common.coinsN', { n: g.coins })}>
            <Icon name="coin" size={34} />
            <Counter value={g.coins} />
          </div>
          <div className="pill" id="hud-gems" aria-label={t('common.gemsN', { n: g.gems })} style={{ minWidth: 0 }}>
            <Icon name="gem" size={30} />
            <Counter value={g.gems} />
          </div>
        </>
      )}
      <button className="round-btn" onClick={() => openPanel('settings')} aria-label={t('hud.settings')}>
        <Icon name="settings" size={28} />
      </button>
    </div>
  );
}

export function Tracker() {
  const t = useT();
  const g = useGame((s) => s.game!);
  const openPanel = useGame((s) => s.openPanel);
  const quest = g.quests.active.find((q) => QUESTS.find((d) => d.id === q.id)?.tutorial) ?? g.quests.active[0];
  const def = quest && QUESTS.find((d) => d.id === quest.id);
  const obj = def?.objectives.find((o) => !objectiveProgress(g, o, quest!.baseline).done) ?? def?.objectives[0];
  const prog = obj && objectiveProgress(g, obj, quest!.baseline);
  const pulse = g.pulse;
  const eventDef = EVENTS.find((e) => e.id === g.event?.id);
  const eventLive = !!g.event && !!eventDef && clock.now() < g.event.startedAt + eventDef.durationDays * 86_400_000;
  return (
    <div className="tracker">
      {def && obj && prog && (
        <button className="tracker__card" onClick={() => openPanel('quests')} aria-label={t('hud.tracker.questAria', { title: def.title, objective: obj.label })}>
          <Icon name="quests" size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <small>{def.tutorial ? t('hud.tracker.gettingStarted') : t('hud.tracker.quest')} · {def.title}</small>
            <b>{obj.label}</b>
            <div className="progress">
              <i style={{ width: `${(prog.cur / prog.n) * 100}%` }} />
            </div>
          </div>
          <span className="small" style={{ fontWeight: 800 }}>
            {prog.cur}/{prog.n}
          </span>
        </button>
      )}
      {pulse && (
        <button className="tracker__card" onClick={() => openPanel('pulse')} aria-label={t('hud.tracker.pulseAria')}>
          <Icon name="pulse" size={34} />
          <div style={{ flex: 1 }}>
            <small>{t('hud.tracker.pulseSub')}</small>
            <b>{t('hud.tracker.pulse')}</b>
          </div>
          <div className="pulse-dots" aria-hidden>
            {pulse.tasks.map((task) => (
              <i key={task.id} className={task.claimed || pulseTaskProgress(g, task) >= task.n ? 'on' : ''} />
            ))}
          </div>
        </button>
      )}
      {eventLive && g.level >= (eventDef?.minLevel ?? 99) && (
        <button className="tracker__card" onClick={() => openPanel('events')}>
          <Icon name="events" size={34} />
          <div style={{ flex: 1 }}>
            <small>{t('hud.tracker.event')}</small>
            <b>{eventDef!.name}</b>
          </div>
        </button>
      )}
    </div>
  );
}

export function BottomBar() {
  const t = useT();
  const g = useGame((s) => s.game!);
  const panel = useGame((s) => s.ui.panel);
  const openPanel = useGame((s) => s.openPanel);
  const deliverable = g.orders.filter((o) => hasItems(g.inventory, o.items)).length;
  const stories = g.residents.filter((r) => eligibleChapter(g, r)).length;
  const invCount = Object.values(g.inventory).reduce((a, b) => a + b, 0);
  const zen = g.settings.zen;
  const items: { id: PanelId; label: string; icon: string; badge?: number | string; primary?: boolean }[] = [
    { id: 'build', label: t('hud.nav.build'), icon: 'build', primary: true },
    { id: 'orders', label: t('hud.nav.orders'), icon: 'orders', badge: deliverable || undefined },
    { id: 'residents', label: t('hud.nav.residents'), icon: 'residents', badge: stories ? '!' : undefined },
    { id: 'inventory', label: t('hud.nav.inventory'), icon: 'inventory', badge: invCount ? undefined : undefined },
    { id: 'friends', label: t('hud.nav.friends'), icon: 'friends', badge: 'soon' },
  ];
  return (
    <nav className="bottombar" aria-label={t('hud.nav.aria')}>
      {items.map((it) => (
        <button
          key={it.id}
          className={`navbtn ${it.primary ? 'navbtn--primary' : ''} ${panel === it.id ? 'active' : ''}`}
          onClick={() => openPanel(panel === it.id ? null : it.id)}
          data-tutorial={`nav-${it.id}`}
          aria-label={it.label}
        >
          <span className="navbtn__icon">
            <Icon name={it.icon} size={30} />
          </span>
          {it.label}
          {it.badge !== undefined && !zen && <span className={`badge ${it.badge === 'soon' ? 'badge--soon' : ''}`}>{it.badge === 'soon' ? t('hud.nav.soon') : it.badge}</span>}
        </button>
      ))}
    </nav>
  );
}

export function SideRail() {
  const t = useT();
  const setUI = useGame((s) => s.setUI);
  const openPanel = useGame((s) => s.openPanel);
  return (
    <div className="siderail">
      <button className="round-btn" aria-label={t('hud.rail.zoomIn')} onClick={() => zoomBy(1.25)}>
        <Icon name="zoomIn" size={26} />
      </button>
      <button className="round-btn" aria-label={t('hud.rail.zoomOut')} onClick={() => zoomBy(0.8)}>
        <Icon name="zoomOut" size={26} />
      </button>
      <button className="round-btn" aria-label={t('hud.rail.photo')} onClick={() => setUI({ photoMode: true, panel: null, selected: null })} data-tutorial="photo">
        <Icon name="camera" size={28} />
      </button>
      <button className="round-btn" aria-label={t('zen.hudAria')} onClick={() => setUI({ activity: { kind: 'zen' } })}>
        <Icon name="zen" size={28} />
      </button>
      <button className="round-btn" aria-label={t('share.open')} onClick={() => setUI({ activity: { kind: 'share' }, panel: null })}>
        <Icon name="share" size={26} />
      </button>
      <button className="round-btn" aria-label={t('hud.rail.help')} onClick={() => openPanel('help')}>
        <Icon name="help" size={28} />
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.ui.toasts);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          <Icon name={t.icon} size={30} />
          <div>
            <b>{t.title}</b>
            {t.body && <small>{t.body}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Rewards arc from the world toward their HUD counter. */
export function FlyLayer() {
  const fx = useGame((s) => s.ui.fx);
  const setUI = useGame((s) => s.setUI);
  return (
    <>
      {fx.map((f) => (
        <Fly
          key={f.id}
          f={f}
          done={() => {
            const st = useGame.getState();
            setUI({ fx: st.ui.fx.filter((x) => x.id !== f.id) });
          }}
        />
      ))}
    </>
  );
}

function Fly({ f, done }: { f: FlyFx; done: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const start = project(f.from) ?? [window.innerWidth / 2, window.innerHeight / 2];
    const targetEl = f.kind === 'coins' ? document.getElementById('hud-coins') : f.kind === 'gems' ? document.getElementById('hud-gems') : document.querySelector('.profile-chip');
    const r = targetEl?.getBoundingClientRect();
    const end: [number, number] = f.kind === 'item' || f.kind === 'heart' ? [start[0], start[1] - 90] : r ? [r.left + 22, r.top + 22] : [start[0], 0];
    const jitter = (Math.random() - 0.5) * 50;
    const t0 = performance.now();
    const dur = f.kind === 'item' || f.kind === 'heart' ? 1100 : 900;
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const e = t < 0.25 ? 0 : (t - 0.25) / 0.75;
      const ease = e * e * (3 - 2 * e);
      const pop = t < 0.25 ? Math.sin((t / 0.25) * Math.PI) * 26 : 0;
      const x = start[0] + jitter * Math.min(1, t * 4) + (end[0] - start[0] - jitter) * ease;
      const y = start[1] - pop - Math.sin(ease * Math.PI) * 60 + (end[1] - start[1]) * ease;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${1 + (t < 0.25 ? t : 0.25) - ease * 0.35})`;
      el.style.opacity = String(t > 0.85 ? (1 - t) / 0.15 : 1);
      if (t < 1) raf = requestAnimationFrame(step);
      else done();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const icon = f.kind === 'coins' ? 'coin' : f.kind === 'xp' ? 'xp' : f.kind === 'gems' ? 'gem' : f.kind === 'heart' ? 'heart' : f.item!;
  return (
    <div ref={ref} className="fly" style={{ left: 0, top: 0 }}>
      <Icon name={icon} size={30} />+{f.amount}
    </div>
  );
}
