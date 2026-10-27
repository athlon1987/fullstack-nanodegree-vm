import { useEffect, useRef, useState } from 'react';
import { ITEMS } from '../../data/items';
import { QUESTS, STORIES } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { activeChapter, eligibleChapter } from '../../game/characters/relationships';
import { dayKey } from '../../game/core/rng';
import { friendshipLevel, hasItems } from '../../game/economy/economy';
import { objectiveProgress } from '../../game/engagement/objectives';
import { phaseOf, clock } from '../../services/clock';
import { useGame, type Dialogue } from '../../state/store';
import { t, useT } from '../../platform/i18n';
import { audio } from '../../audio/AudioManager';
import { Icon } from '../components/Icon';
import { Hearts, Portrait } from '../components/Panel';
import { ResidentDetails } from '../panels/SocialPanels';
import { tc } from '../../platform/i18n/content';

function useTypewriter(text: string, reduced: boolean) {
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) {
      setN(text.length);
      return;
    }
    setN(0);
    const id = window.setInterval(() => setN((x) => (x >= text.length ? (window.clearInterval(id), x) : x + 2)), 18);
    return () => window.clearInterval(id);
  }, [text, reduced]);
  return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

/** Conversation box used for talking, quests, stories, gifts and arrivals. */
export function DialogueBox({ d }: { d: Dialogue }) {
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const next = useGame((s) => s.nextDialogue);
  const setUI = useGame((s) => s.setUI);
  const t = useT();
  const [mode, setMode] = useState<'main' | 'gift' | 'about'>('main');
  const def = RESIDENTS[d.resident];
  const r = g.residents.find((x) => x.id === d.resident);
  const tw = useTypewriter(d.text, g.settings.reducedMotion);
  const story = r && eligibleChapter(g, r);
  const active = r && activeChapter(r);
  const lvl = r ? friendshipLevel(r.friendship) : 0;
  const giftedToday = r?.lastGiftDay === dayKey(clock.now());
  const goods = Object.entries(g.inventory).filter(([, n]) => n > 0);
  useEffect(() => setMode('main'), [d]);
  const close = () => {
    audio.play('click');
    next();
  };
  const deliverNeed: Record<string, number> = {};
  if (active) for (const o of active.objectives) if (o.type === 'deliver') Object.assign(deliverNeed, o.items);
  const canDeliver = active && Object.keys(deliverNeed).length > 0 && hasItems(g.inventory, deliverNeed);
  const quest = d.questId ? QUESTS.find((q) => q.id === d.questId) : undefined;
  return (
    <div className="dialogue" role="dialog" aria-label={t('modals.says', { name: def.name })} onClick={() => !tw.done && tw.skip()}>
      <Portrait resident={d.resident} size="lg" />
      <div className="dialogue__name">
        {def.name}
        <small>{def.profession}</small>
        {r && (
          <span className="row" style={{ gap: 4 }}>
            <Hearts level={lvl} />
            <small>{t(`common.friend.${lvl}`)}</small>
          </span>
        )}
      </div>
      {mode === 'main' && (
        <p className="dialogue__text" aria-live="polite">
          {quest && <b style={{ display: 'block', color: 'var(--terracotta)', fontFamily: 'var(--font-display)' }}>{quest.title}</b>}
          {d.mode === 'story-intro' && d.chapter && <b style={{ display: 'block', color: 'var(--sky)', fontFamily: 'var(--font-display)' }}>{t('modals.storyTitle', { title: STORIES.find((s) => s.id === d.chapter)?.title ?? '' })}</b>}
          {tw.shown}
        </p>
      )}
      {mode === 'about' && (
        <div className="dialogue__text" style={{ maxHeight: 220, overflow: 'auto' }}>
          <ResidentDetails id={d.resident} />
        </div>
      )}
      {mode === 'gift' && (
        <div className="dialogue__text">
          <div className="small muted" style={{ marginBottom: 6 }}>
            {t('modals.pickGift', { name: def.name, items: def.favorites.map((f) => ITEMS[f].name).join(', ') })}
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {goods.map(([id, n]) => (
              <button
                key={id}
                className="chip"
                style={{ cursor: 'pointer', border: 0, padding: '6px 10px' }}
                onClick={() => {
                  dispatch({ type: 'gift', resident: d.resident, item: id });
                  setMode('main');
                  next();
                }}
              >
                <Icon name={id} size={22} /> {ITEMS[id].name} ×{n}
              </button>
            ))}
            {!goods.length && <span className="muted">{t('modals.storageEmpty')}</span>}
          </div>
        </div>
      )}
      <div className="dialogue__actions">
        {d.mode === 'talk' && r && mode === 'main' && (
          <>
            <button className="btn btn--plain btn--sm" onClick={() => setMode('about')}>
              {t('modals.about')}
            </button>
            <button className="btn btn--plain btn--sm" disabled={giftedToday} onClick={() => setMode('gift')} title={giftedToday ? t('modals.oneGiftPerDay') : undefined}>
              <Icon name="gift" size={18} /> {giftedToday ? t('modals.giftedToday') : t('modals.gift')}
            </button>
            {story && (
              <button
                className="btn btn--gold btn--sm"
                onClick={() => {
                  useGame.getState().setUI({ dialogue: { resident: d.resident, text: story.intro, mode: 'story-intro', chapter: story.id } });
                }}
              >
                <Icon name="story" size={18} /> {t('modals.newStory')}
              </button>
            )}
            {active && canDeliver && (
              <button
                className="btn btn--gold btn--sm"
                onClick={() => {
                  const res = dispatch({ type: 'deliverStory', resident: d.resident });
                  if (res && !res.error) next();
                }}
              >
                {t('modals.handOver')} <Icon name="gift" size={18} />
              </button>
            )}
          </>
        )}
        {mode !== 'main' && (
          <button className="btn btn--plain btn--sm" onClick={() => setMode('main')}>
            {t('common.back')}
          </button>
        )}
        {d.mode === 'story-intro' ? (
          <>
            <button className="btn btn--plain btn--sm" onClick={close}>
              {t('modals.maybeLater')}
            </button>
            <button
              className="btn btn--sm"
              onClick={() => {
                dispatch({ type: 'startStory', resident: d.resident });
                next();
              }}
            >
              {t('modals.illHelp')}
            </button>
          </>
        ) : (
          <button className="btn btn--sm" onClick={close}>
            {d.mode === 'arrival' ? t('modals.welcome') : d.mode === 'quest' ? t('modals.okay') : t('modals.bye')}
          </button>
        )}
      </div>
      {active && d.mode === 'talk' && mode === 'main' && (
        <div className="small muted" style={{ marginTop: 6 }}>
          {t('modals.storyProgress', { title: active.title, objectives: active.objectives.map((o) => `${o.label} (${objectiveProgress(g, o, r!.storyActive!.baseline).cur}/${objectiveProgress(g, o, r!.storyActive!.baseline).n})`).join(' · ') })}
        </div>
      )}
      {d.mode === 'quest' && quest?.focus && (
        <button className="btn btn--plain btn--sm" style={{ position: 'absolute', top: 12, right: 12 }} onClick={() => setUI({ panel: 'quests' })} aria-label={t('modals.openQuests')}>
          <Icon name="quests" size={18} />
        </button>
      )}
    </div>
  );
}

/** When a resident is tapped: talk (daily friendship) and open the conversation. */
export function useResidentTalk() {
  const resident = useGame((s) => s.ui.resident);
  useEffect(() => {
    if (!resident) return;
    const st = useGame.getState();
    const res = st.dispatch({ type: 'talk', resident, phase: phaseOf(st.ui.hour) });
    const line = res?.events.find((e) => e.type === 'RESIDENT_INTERACTED');
    const text = line && line.type === 'RESIDENT_INTERACTED' ? line.line : t('modals.hello');
    st.setUI({ resident: null, dialogue: { resident, text, mode: 'talk' }, selected: null, panel: null });
  }, [resident]);
}

export function LevelUpModal({ level, unlocks }: { level: number; unlocks: string[] }) {
  const setUI = useGame((s) => s.setUI);
  const t = useT();
  return (
    <div className="modal-wrap" onClick={() => setUI({ levelUp: null })}>
      <div className="modal" role="dialog" aria-label={t('modals.levelUp.aria', { level })} onClick={(e) => e.stopPropagation()} style={{ marginTop: 60 }}>
        <div className="burst">{level}</div>
        <h2>{t('modals.levelUp.title')}</h2>
        <p className="muted">{t('modals.levelUp.body')}</p>
        <div className="unlock-list">
          {unlocks.map((u) => (
            <span key={u} className="chip" style={{ padding: '6px 12px' }}>
              <Icon name="star" size={18} /> {u}
            </span>
          ))}
        </div>
        <button className="btn btn--gold btn--block" onClick={() => setUI({ levelUp: null })} autoFocus>
          {t('modals.levelUp.ok')}
        </button>
      </div>
    </div>
  );
}

export function WelcomeBack() {
  const w = useGame((s) => s.ui.welcome)!;
  const setUI = useGame((s) => s.setUI);
  const g = useGame((s) => s.game!);
  const t = useT();
  const hrs = w.awayMs / 3_600_000;
  const away = hrs >= 48 ? t('modals.welcomeBack.days', { n: Math.floor(hrs / 24) }) : hrs >= 1 ? t('modals.welcomeBack.hours', { n: Math.floor(hrs) }) : t('modals.welcomeBack.minutes', { n: Math.round(w.awayMs / 60000) });
  return (
    <div className="modal-wrap">
      <div className="modal modal--scroll" role="dialog" aria-label={t('modals.welcomeBack.aria')}>
        <Icon name="home" size={64} style={{ margin: '0 auto' }} />
        <h2>{t('modals.welcomeBack.title')}</h2>
        <p className="muted">
          {t('modals.welcomeBack.away', { away, hood: g.profile.hoodName })}
        </p>
        <div className="stack" style={{ textAlign: 'left', margin: '12px 0' }}>
          {w.coinsWaiting > 0 && (
            <div className="list-item">
              <Icon name="coin" size={30} /> {t('modals.welcomeBack.coins', { n: w.coinsWaiting })}
            </div>
          )}
          {w.readyGoods > 0 && (
            <div className="list-item">
              <Icon name="inventory" size={30} /> {t('modals.welcomeBack.goods', { n: w.readyGoods })}
            </div>
          )}
          {w.buildingsFinished.length > 0 && (
            <div className="list-item">
              <Icon name="build" size={30} /> {t('modals.welcomeBack.finished', { list: w.buildingsFinished.join(', ') })}
            </div>
          )}
          {w.storiesWaiting.length > 0 && (
            <div className="list-item">
              <Icon name="story" size={30} /> {t('modals.welcomeBack.stories', { n: w.storiesWaiting.length, names: w.storiesWaiting.join(' & ') })}
            </div>
          )}
          {w.nextGoal && (
            <div className="list-item" style={{ background: '#fff4d6' }}>
              <Icon name="star" size={30} /> <b>{t('modals.welcomeBack.next', { goal: w.nextGoal.key ? tc(w.nextGoal.key, w.nextGoal.params) : w.nextGoal.text ?? '' })}</b>
            </div>
          )}
        </div>
        <button className="btn btn--gold btn--block" onClick={() => setUI({ welcome: null })} autoFocus>
          {t('modals.welcomeBack.go')}
        </button>
      </div>
    </div>
  );
}

/** Photo mode: HUD hidden, capture, then save or share (no personal data in the image). */
export function PhotoMode() {
  const setUI = useGame((s) => s.setUI);
  const dispatch = useGame((s) => s.dispatch);
  const hood = useGame((s) => s.game!.profile.hoodName);
  const t = useT();
  const [shot, setShot] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [showName, setShowName] = useState(true);
  const blobRef = useRef<Blob | null>(null);
  const capture = () => {
    const canvas = document.querySelector('.world canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext('2d')!;
    // Sky gradient behind the transparent WebGL canvas
    const bg = getComputedStyle(document.querySelector('.world')!).backgroundImage;
    const colors = bg.match(/rgb\([^)]+\)|#[0-9a-f]{6}/gi) ?? ['#76c3e6', '#d9f2ef'];
    const grad = ctx.createLinearGradient(0, 0, 0, out.height);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.75, colors[1] ?? colors[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    const s = out.width / 1200;
    ctx.font = `700 ${Math.round(34 * s)}px "Fredoka Variable", system-ui`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8 * s;
    ctx.textAlign = 'right';
    ctx.fillText(showName ? `${hood} · POCKETHOOD` : 'POCKETHOOD', out.width - 28 * s, out.height - 28 * s);
    setShot(out.toDataURL('image/png'));
    out.toBlob((b) => (blobRef.current = b), 'image/png');
    setFlash(true);
    window.setTimeout(() => setFlash(false), 500);
    audio.play('whoosh');
    dispatch({ type: 'photo' });
  };
  const share = async () => {
    const blob = blobRef.current;
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (blob && nav.canShare?.({ files: [new File([blob], 'pockethood.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({ files: [new File([blob], 'pockethood.png', { type: 'image/png' })], title: t('modals.photo.shareTitle') });
      } catch {
        /* user cancelled */
      }
    } else download();
  };
  const download = () => {
    if (!shot) return;
    const a = document.createElement('a');
    a.href = shot;
    a.download = `pockethood-${Date.now()}.png`;
    a.click();
  };
  return (
    <div className="photo-ui">
      <div className="photo-frame" />
      {flash && <div className="flash" />}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <button className="btn btn--plain btn--sm" onClick={() => setShowName((v) => !v)} aria-pressed={showName}>
          {showName ? t('modals.photo.nameOn') : t('modals.photo.nameOff')}
        </button>
        <button className="btn btn--plain btn--sm" onClick={() => setUI({ photoMode: false })}>
          <Icon name="close" size={18} /> {t('modals.photo.exit')}
        </button>
      </div>
      <div style={{ position: 'fixed', top: 16, left: 16 }} className="chip">
        <Icon name="camera" size={20} /> {t('modals.photo.hint')}
      </div>
      <button className="shutter" aria-label={t('modals.photo.take')} onClick={capture} />
      {shot && (
        <div className="modal-wrap" onClick={() => setShot(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('modals.photo.yourPhoto')}>
            <img src={shot} alt={t('modals.photo.alt')} style={{ width: '100%', borderRadius: 14, border: '3px solid #fff' }} />
            <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
              <button className="btn btn--plain" onClick={() => setShot(null)}>
                {t('modals.photo.retake')}
              </button>
              <button className="btn btn--sky" onClick={download}>
                {t('common.save')}
              </button>
              <button className="btn btn--gold" onClick={() => void share()}>
                {t('common.share')}
              </button>
            </div>
            <p className="small muted">{t('modals.photo.note')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

