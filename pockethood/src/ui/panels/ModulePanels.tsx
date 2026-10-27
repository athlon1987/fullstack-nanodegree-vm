// UI for module behaviours (Layer C content running on reviewed template rules) and the
// gentle activities: hand preparation, the daily quiz, the showroom arranger, garden plots,
// "About this place" (real-world info with its safeguards), the lake and Zen Mode.
import { useEffect, useMemo, useState } from 'react';
import { bdef } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { FISH, PETS } from '../../data/pets';
import { WORLD } from '../../data/world';
import { FISH_REST_MS, MOMENT_REST_MS, quizLimit, showroomSlots } from '../../game/core/actions';
import { hashString } from '../../game/core/rng';
import { canWater, plotStage, readyAt } from '../../game/behaviors/garden';
import type { BuildingInstance } from '../../game/core/types';
import { flag } from '../../platform/content/flags';
import { ACTIVE_MODULES, L, behaviorOf, type ActiveModule } from '../../platform/content/install';
import { bcp47, fmtDuration, getLang, useT } from '../../platform/i18n';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { ItemChips, Panel } from '../components/Panel';

const useNow = (ms = 1000) => {
  const [now, setNow] = useState(clock.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(clock.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
};

const closeActivity = () => useGame.getState().setUI({ activity: null });

// ─── In the building sheet ───────────────────────────────────────────────────

/** Labels that tell the player what kind of place this is (never promotional in Zen Mode). */
export function ModuleBadges({ m }: { m: ActiveModule }) {
  const t = useT();
  const zen = useGame((s) => s.game!.settings.zen);
  const showSponsor = m.sponsorLabel && flag('sponsor_labels') && !zen;
  return (
    <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {m.brand.kind === 'fictional' && m.kind === 'business' && <span className="chip">{t('module.badge.fictional')}</span>}
      {m.kind === 'community' && <span className="chip ok">{t('module.badge.community')}</span>}
      {showSponsor && <span className="chip sponsor-label">{t(`module.badge.${m.sponsorLabel}`)}</span>}
      <button className="btn btn--plain btn--sm" onClick={() => useGame.getState().setUI({ activity: { kind: 'about', uid: useGame.getState().ui.selected! } })}>
        <Icon name="help" size={18} /> {t('module.about')}
      </button>
    </div>
  );
}

export function BehaviorCards({ b }: { b: BuildingInstance }) {
  const rev = useGame((s) => s.contentRev);
  const prep = useMemo(() => behaviorOf(b.type, 'hand_prepare'), [b.type, rev]);
  const quiz = useMemo(() => behaviorOf(b.type, 'quiz'), [b.type, rev]);
  const showroom = useMemo(() => behaviorOf(b.type, 'showroom'), [b.type, rev]);
  const garden = useMemo(() => behaviorOf(b.type, 'garden_plots'), [b.type, rev]);
  if (b.busyKind === 'build') return null;
  return (
    <>
      {prep && <PrepCard b={b} />}
      {quiz && <QuizCard b={b} />}
      {showroom && <ShowroomArranger b={b} />}
      {garden && <GardenPlots b={b} />}
    </>
  );
}

function PrepCard({ b }: { b: BuildingInstance }) {
  const t = useT();
  const now = useNow();
  const prep = behaviorOf(b.type, 'hand_prepare')!;
  const last = useGame((s) => s.game!.ext.prep[b.uid] ?? 0);
  const recipe = RECIPES[prep.recipe];
  if (!recipe) return null;
  const rest = last + prep.cooldownSeconds * 1000 - now;
  const locked = b.level < recipe.level;
  return (
    <div className="card row" style={{ marginBottom: 10 }}>
      <Icon name={recipe.output} size={40} />
      <div style={{ flex: 1 }}>
        <b>{t('module.prep.title', { item: ITEMS[recipe.output]?.name ?? '' })}</b>
        <div className="small muted">{rest > 0 ? t('module.prep.rest', { time: fmtDuration(rest) }) : t('module.prep.hint')}</div>
      </div>
      <button className="btn btn--teal btn--sm" disabled={rest > 0 || locked} onClick={() => useGame.getState().setUI({ activity: { kind: 'prep', uid: b.uid } })}>
        {t('module.prep.start')}
      </button>
    </div>
  );
}

function QuizCard({ b }: { b: BuildingInstance }) {
  const t = useT();
  const quiz = behaviorOf(b.type, 'quiz')!;
  const learning = useGame((s) => s.game!.ext.learning);
  const day = learning.day === localDay() ? learning.today : 0;
  const left = Math.max(0, quizLimit(quiz.dailyLimit, b.level) - day);
  return (
    <div className="card row" style={{ marginBottom: 10 }}>
      <Icon name="book" size={40} />
      <div style={{ flex: 1 }}>
        <b>{quiz.topic}</b>
        <div className="small muted">{left > 0 ? t('module.quiz.left', { n: left }) : t('module.quiz.done')}</div>
        <div className="small muted">{t('module.quiz.stats', { correct: learning.correct, answered: learning.answered })}</div>
      </div>
      <button className="btn btn--teal btn--sm" disabled={left <= 0} onClick={() => useGame.getState().setUI({ activity: { kind: 'quiz', uid: b.uid } })}>
        {t('module.quiz.start')}
      </button>
    </div>
  );
}

function localDay() {
  const d = new Date(clock.now());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ShowroomArranger({ b }: { b: BuildingInstance }) {
  const t = useT();
  const sh = behaviorOf(b.type, 'showroom')!;
  const display = useGame((s) => s.game!.ext.showrooms[b.uid]);
  const dispatch = useGame((s) => s.dispatch);
  const slots = showroomSlots(sh.slots, b.level);
  return (
    <>
      <div className="section-title">
        <Icon name="car" size={22} /> {t('module.showroom.title', { n: slots, max: sh.slots })}
      </div>
      <div className="stack" style={{ marginBottom: 10 }}>
        {Array.from({ length: slots }, (_, i) => {
          const cur = display?.[i] ?? { model: sh.models[i % sh.models.length], paint: sh.paints[i % sh.paints.length].id };
          return (
            <div key={i} className="card stack" style={{ gap: 6 }}>
              <b className="small">{t('module.showroom.bay', { n: i + 1 })}</b>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} role="group" aria-label={t('module.showroom.models')}>
                {sh.models.map((m) => (
                  <button key={m} className={`chip ${cur.model === m ? 'ok' : ''}`} aria-pressed={cur.model === m} onClick={() => dispatch({ type: 'showroomSet', uid: b.uid, slot: i, model: m, paint: cur.paint })}>
                    <Icon name="car" size={18} /> {t(`module.vehicle.${m}`)}
                  </button>
                ))}
              </div>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} role="group" aria-label={t('module.showroom.paints')}>
                {sh.paints.map((p) => (
                  <button
                    key={p.id}
                    className="swatch"
                    aria-pressed={cur.paint === p.id}
                    aria-label={p.name}
                    title={p.name}
                    style={{ background: p.hex, outline: cur.paint === p.id ? '3px solid var(--ink)' : undefined }}
                    onClick={() => dispatch({ type: 'showroomSet', uid: b.uid, slot: i, model: cur.model, paint: p.id })}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function GardenPlots({ b }: { b: BuildingInstance }) {
  const t = useT();
  const now = useNow(1000);
  const g = behaviorOf(b.type, 'garden_plots')!;
  const plots = useGame((s) => s.game!.ext.gardens[b.uid]);
  const dispatch = useGame((s) => s.dispatch);
  const [choosing, setChoosing] = useState<number | null>(null);
  return (
    <>
      <div className="section-title">
        <Icon name="sapling" size={22} /> {t('module.garden.title')}
      </div>
      <div className="garden-grid" style={{ marginBottom: 10 }}>
        {Array.from({ length: g.plots }, (_, i) => {
          const p = plots?.[i];
          const def = p?.plant ? g.plants.find((x) => x.id === p.plant) : undefined;
          if (!p?.plant || !def) {
            return (
              <div key={i} className="card stack" style={{ gap: 6 }}>
                <b className="small">{t('module.garden.plot', { n: i + 1 })}</b>
                {choosing === i ? (
                  <div className="stack" style={{ gap: 4 }}>
                    {g.plants.map((pl) => (
                      <button
                        key={pl.id}
                        className="btn btn--plain btn--sm"
                        onClick={() => {
                          dispatch({ type: 'plant', uid: b.uid, plot: i, plant: pl.id });
                          setChoosing(null);
                        }}
                      >
                        <Icon name={pl.icon} size={18} /> {pl.name} · {fmtDuration(pl.growSeconds * 1000)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button className="btn btn--teal btn--sm" onClick={() => setChoosing(i)}>
                    <Icon name="sapling" size={18} /> {t('module.garden.plant')}
                  </button>
                )}
              </div>
            );
          }
          const stage = plotStage(p, def, now);
          const ready = stage === 3;
          const pct = Math.min(1, (now - p.plantedAt) / (readyAt(p, def) - p.plantedAt));
          return (
            <div key={i} className="card stack" style={{ gap: 6 }}>
              <div className="row" style={{ gap: 6 }}>
                <Icon name={def.icon} size={26} />
                <b className="small" style={{ flex: 1 }}>
                  {def.name}
                </b>
              </div>
              <div className="small muted">{ready ? t('module.garden.ready', { item: ITEMS[def.yields]?.name ?? '' }) : t(`module.garden.stage${stage}`)}</div>
              {!ready && (
                <div className="progress" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${pct * 100}%` }} />
                </div>
              )}
              {ready ? (
                <button className="btn btn--gold btn--sm" onClick={() => dispatch({ type: 'harvest', uid: b.uid, plot: i })}>
                  {t('module.garden.harvest')} <ItemChips items={{ [def.yields]: def.qty }} showHave={false} />
                </button>
              ) : (
                <button className="btn btn--sky btn--sm" disabled={!canWater(p, now)} onClick={() => dispatch({ type: 'water', uid: b.uid, plot: i })} aria-label={t('module.garden.waterAria', { n: i + 1 })}>
                  <Icon name="water" size={18} /> {t('module.garden.water', { n: p.water, max: 3 })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Activity cards ──────────────────────────────────────────────────────────

export function ActivityHost() {
  const a = useGame((s) => s.ui.activity);
  if (!a) return null;
  switch (a.kind) {
    case 'prep':
      return <PrepGame uid={a.uid} />;
    case 'quiz':
      return <QuizGame uid={a.uid} />;
    case 'about':
      return <AboutPlace uid={a.uid} />;
    case 'lake':
      return <LakeCard />;
    case 'zen':
      return <ZenCard />;
    default:
      return null;
  }
}

/** Hand preparation: tap the steps in order. Wrong taps just start over — no penalty. */
function PrepGame({ uid }: { uid: string }) {
  const t = useT();
  const b = useGame((s) => s.game!.buildings.find((x) => x.uid === uid));
  const dispatch = useGame((s) => s.dispatch);
  const prep = b ? behaviorOf(b.type, 'hand_prepare') : undefined;
  const [done, setDone] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const pads = useMemo(() => {
    const uniq = [...new Set(prep?.steps ?? [])];
    // A stable, gently shuffled pad order (per building) so it isn't just left-to-right.
    return uniq.sort((x, y) => (hashString(uid + x) % 97) - (hashString(uid + y) % 97));
  }, [prep, uid]);
  if (!b || !prep) return null;
  const recipe = RECIPES[prep.recipe];
  const item = recipe ? ITEMS[recipe.output] : undefined;
  const tap = (step: string) => {
    if (finished) return;
    const next = prep.steps[done.length];
    if (step !== next) {
      setDone([]);
      setMsg(t('module.prep.again'));
      return;
    }
    const seq = [...done, step];
    setDone(seq);
    setMsg(null);
    if (seq.length === prep.steps.length) {
      const r = dispatch({ type: 'handPrepare', uid, recipe: prep.recipe, steps: seq });
      if (r && !r.error) setFinished(true);
      else setDone([]);
    }
  };
  return (
    <Panel title={t('module.prep.title', { item: item?.name ?? '' })} icon={recipe?.output ?? 'cup'} onClose={closeActivity}>
      <p className="muted" style={{ marginTop: 0 }}>
        {prep.tip}
      </p>
      <div className="row" style={{ justifyContent: 'center', gap: 8, margin: '8px 0 14px' }} aria-label={t('module.prep.progress', { n: done.length, total: prep.steps.length })}>
        {prep.steps.map((s, i) => (
          <span key={i} className={`prep-dot ${i < done.length ? 'on' : ''}`} title={i < done.length ? t(`module.step.${s}`) : undefined} />
        ))}
      </div>
      <div className={`prep-stage ${finished ? 'done' : done.length ? 'busy' : ''}`} key={done.length}>
        <Icon name={recipe?.output ?? 'cup'} size={86} />
      </div>
      {msg && <p className="small" style={{ textAlign: 'center', color: '#a8472b', fontWeight: 800 }}>{msg}</p>}
      {finished ? (
        <div className="stack" style={{ alignItems: 'center' }}>
          <b>{t('module.prep.done', { item: item?.name ?? '' })}</b>
          <button className="btn btn--teal" onClick={closeActivity}>
            {t('common.done')}
          </button>
        </div>
      ) : (
        <div className="prep-pads">
          {pads.map((s) => (
            <button key={s} className="btn btn--plain" onClick={() => tap(s)}>
              {t(`module.step.${s}`)}
            </button>
          ))}
        </div>
      )}
      <p className="small muted" style={{ textAlign: 'center' }}>
        {t('module.prep.next', { step: finished ? '—' : t(`module.step.${prep.steps[done.length]}`) })}
      </p>
    </Panel>
  );
}

function QuizGame({ uid }: { uid: string }) {
  const t = useT();
  const b = useGame((s) => s.game!.buildings.find((x) => x.uid === uid));
  const learning = useGame((s) => s.game!.ext.learning);
  const dispatch = useGame((s) => s.dispatch);
  const quiz = b ? behaviorOf(b.type, 'quiz') : undefined;
  const [answer, setAnswer] = useState<{ q: string; choice: number; correct: boolean } | null>(null);
  if (!b || !quiz) return null;
  const today = localDay();
  const answeredToday = learning.day === today ? learning.today : 0;
  const limit = quizLimit(quiz.dailyLimit, b.level);
  // Today's questions: a stable daily order, skipping ones already answered today.
  const order = [...quiz.questions].sort((x, y) => (hashString(today + x.id) % 1009) - (hashString(today + y.id) % 1009));
  const current = answer ? quiz.questions.find((q) => q.id === answer.q) : order.find((q) => !(learning.seen[q.id] && new Date(learning.seen[q.id]).toDateString() === new Date(clock.now()).toDateString()));
  const finished = !answer && answeredToday >= limit;
  return (
    <Panel title={quiz.topic} icon="book" onClose={closeActivity}>
      <p className="small muted" style={{ marginTop: 0 }}>
        {t('module.quiz.progress', { n: Math.min(limit, answeredToday + (answer ? 0 : 1)), total: limit })}
      </p>
      {finished || !current ? (
        <div className="stack" style={{ alignItems: 'center' }}>
          <Icon name="star" size={60} />
          <b>{t('module.quiz.allDone')}</b>
          <p className="small muted">{t('module.quiz.stats', { correct: learning.correct, answered: learning.answered })}</p>
          <button className="btn btn--teal" onClick={closeActivity}>
            {t('common.done')}
          </button>
        </div>
      ) : (
        <div className="stack">
          <p style={{ fontWeight: 800, fontSize: '1.1em' }}>{current.prompt}</p>
          {current.choices.map((c, i) => {
            const state = answer ? (i === current.answer ? 'right' : i === answer.choice ? 'wrong' : '') : '';
            return (
              <button
                key={i}
                className={`btn ${state === 'right' ? 'btn--teal' : state === 'wrong' ? 'btn--coral' : 'btn--plain'}`}
                disabled={!!answer}
                onClick={() => {
                  const r = dispatch({ type: 'quizAnswer', uid, question: current.id, choice: i });
                  if (r && !r.error) setAnswer({ q: current.id, choice: i, correct: i === current.answer });
                }}
              >
                {c}
                {state === 'right' && <Icon name="check" size={20} />}
              </button>
            );
          })}
          {answer && (
            <div className="card" role="status">
              <b>{answer.correct ? t('module.quiz.right') : t('module.quiz.wrong')}</b>
              <p className="small" style={{ margin: '4px 0 0' }}>
                {current.explain}
              </p>
            </div>
          )}
          {answer && (
            <button className="btn btn--teal" onClick={() => setAnswer(null)}>
              {t('common.next')}
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}

/** About this place: what the module is, its labels and any real-world info (with safeguards). */
function AboutPlace({ uid }: { uid: string }) {
  const t = useT();
  const b = useGame((s) => s.game!.buildings.find((x) => x.uid === uid));
  const zen = useGame((s) => s.game!.settings.zen);
  const m = b ? ACTIVE_MODULES[b.type] : undefined;
  if (!b || !m) return null;
  const rw = m.realWorld;
  const showMenu = !!rw?.menu && flag('real_world_menus') && !zen;
  const money = (minor: number, cur: string) => new Intl.NumberFormat(bcp47(), { style: 'currency', currency: cur }).format(minor / 100);
  return (
    <Panel title={m.name} icon="help" onClose={closeActivity}>
      <p style={{ marginTop: 0 }}>{m.description}</p>
      <ModuleBadges m={m} />
      {rw?.notice && <div className="card small">{rw.notice}</div>}
      {showMenu && rw.menu && (
        <>
          <div className="section-title">
            <Icon name="orders" size={22} /> {rw.menu.illustrative ? t('module.menu.illustrative') : t('module.menu.real')}
          </div>
          <div className="card stack" style={{ gap: 6 }}>
            {rw.menu.items.map((i, k) => (
              <div key={k} className="row row--between small">
                <span style={{ fontWeight: 700, opacity: i.available ? 1 : 0.5 }}>{i.name}</span>
                <span className="muted">{i.priceMinor !== null ? money(i.priceMinor, rw.menu!.currency) : t('module.menu.noPrice')}</span>
              </div>
            ))}
            {rw.menu.verifiedAt && <div className="small muted">{t('module.menu.verified', { date: new Date(rw.menu.verifiedAt).toLocaleDateString(bcp47()), version: rw.menu.version })}</div>}
            <div className="small muted">{t('module.menu.coins')}</div>
          </div>
        </>
      )}
      {rw?.halal.status === 'certified' && (
        <div className="card small" style={{ marginTop: 10 }}>
          {t('module.halal.certified', { certifier: rw.halal.certifier ?? '', ref: rw.halal.certificateRef ?? '', date: rw.halal.verifiedAt ? new Date(rw.halal.verifiedAt).toLocaleDateString(bcp47()) : '' })}
        </div>
      )}
      {rw && rw.links.length > 0 && !zen && (
        <div className="stack" style={{ marginTop: 10 }}>
          {rw.links.map((l) => (
            <a key={l.url} className="btn btn--plain btn--sm" href={l.url} target="_blank" rel="noopener noreferrer">
              <Icon name="link" size={18} /> {l.label}
            </a>
          ))}
          <div className="small muted">{t('module.links.leaving')}</div>
        </div>
      )}
      <div className="section-title">
        <Icon name="settings" size={22} /> {t('module.details')}
      </div>
      <div className="small muted stack" style={{ gap: 2 }}>
        <span>{t('module.detail.id', { id: m.id, version: m.version })}</span>
        <span>{t('module.detail.template', { template: t(`module.template.${m.template}`) })}</span>
        <span>{t(m.brand.kind === 'fictional' ? 'module.detail.fictional' : 'module.detail.licensed')}</span>
      </div>
    </Panel>
  );
}

// ─── The lake & Zen ─────────────────────────────────────────────────────────

function LakeCard() {
  const t = useT();
  const now = useNow(1000);
  const g = useGame((s) => s.game!);
  const dispatch = useGame((s) => s.dispatch);
  const [lastFish, setLastFish] = useState<{ species: string; first: boolean } | null>(null);
  const fishRest = Math.max(0, g.zen.lastFish + FISH_REST_MS - now);
  const momentRest = Math.max(0, g.zen.lastMoment + MOMENT_REST_MS - now);
  const hour = useGame((s) => s.ui.hour);
  const dusk = hour >= 17.5 && hour <= 19.8;
  const pond = g.buildings.find((b) => b.type === 'pond');
  const name = pond ? bdef('pond').name : '';
  return (
    <Panel title={name} icon="fish" onClose={closeActivity}>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('zen.lake.intro')}
      </p>
      <div className="card row" style={{ marginBottom: 10 }}>
        <Icon name="fish" size={40} />
        <div style={{ flex: 1 }}>
          <b>{t('zen.fish.title')}</b>
          <div className="small muted">{lastFish ? t(lastFish.first ? 'zen.fish.first' : 'zen.fish.again', { fish: t(`zen.fish.${lastFish.species}`) }) : t('zen.fish.hint')}</div>
        </div>
        <button
          className="btn btn--sky btn--sm"
          disabled={fishRest > 0}
          onClick={() => {
            const r = dispatch({ type: 'fish' });
            const e = r?.events.find((x) => x.type === 'FISH_SEEN');
            if (e && e.type === 'FISH_SEEN') setLastFish({ species: e.species, first: e.first });
          }}
        >
          {fishRest > 0 ? fmtDuration(fishRest) : t('zen.fish.cast')}
        </button>
      </div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <button className="btn btn--plain btn--sm" disabled={momentRest > 0} onClick={() => dispatch({ type: 'zenMoment', kind: 'lake' })}>
          <Icon name="zen" size={18} /> {t('zen.moment.lake')}
        </button>
        <button className="btn btn--plain btn--sm" disabled={momentRest > 0 || !dusk} onClick={() => dispatch({ type: 'zenMoment', kind: 'sunset' })} title={dusk ? undefined : t('zen.moment.sunsetLater')}>
          <Icon name="sun" size={18} /> {dusk ? t('zen.moment.sunset') : t('zen.moment.sunsetLater')}
        </button>
      </div>
      <div className="section-title">
        <Icon name="book" size={22} /> {t('zen.journal.title')}
      </div>
      <div className="card stack" style={{ gap: 4 }}>
        {FISH.map((f) => (
          <div key={f} className="row row--between small">
            <span style={{ fontWeight: 700, opacity: g.zen.fish[f] ? 1 : 0.45 }}>{g.zen.fish[f] ? t(`zen.fish.${f}`) : t('zen.journal.unknown')}</span>
            <span className="muted">{g.zen.fish[f] ? t('zen.journal.seen', { n: g.zen.fish[f] }) : ''}</span>
          </div>
        ))}
        <div className="small muted">{t('zen.journal.release')}</div>
      </div>
    </Panel>
  );
}

function ZenCard() {
  const t = useT();
  const now = useNow(1000);
  const g = useGame((s) => s.game!);
  const st = useGame.getState();
  const dispatch = useGame((s) => s.dispatch);
  const today = localDay();
  const momentRest = Math.max(0, g.zen.lastMoment + MOMENT_REST_MS - now);
  const garden = g.buildings.find((b) => behaviorOf(b.type, 'garden_plots') && b.busyKind !== 'build');
  const pets = PETS.filter((p) => !p.requires || g.buildings.some((b) => b.type === p.requires && b.busyKind !== 'build'));
  const flowers = Object.keys(g.inventory).find((id) => ['flowers', 'hibiscus'].includes(ITEMS[id]?.icon ?? '') && g.inventory[id] >= 2);
  const go = (fn: () => void) => () => {
    st.setUI({ activity: null });
    fn();
  };
  return (
    <Panel title={t('zen.title')} icon="zen" onClose={closeActivity}>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('zen.intro')}
      </p>
      <label className="row card" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span>
          <b>{t('zen.toggle')}</b>
          <div className="small muted">{t('zen.toggleHint')}</div>
        </span>
        <input type="checkbox" checked={g.settings.zen} onChange={(e) => dispatch({ type: 'settings', patch: { zen: e.target.checked } })} />
      </label>
      <div className="stack">
        <button className="btn btn--plain" onClick={() => st.setUI({ activity: { kind: 'lake' } })}>
          <Icon name="fish" size={22} /> {t('zen.act.fish')}
        </button>
        {garden && (
          <button className="btn btn--plain" onClick={go(() => st.setUI({ selected: garden.uid }))}>
            <Icon name="sapling" size={22} /> {t('zen.act.garden')}
          </button>
        )}
        <button className="btn btn--plain" disabled={momentRest > 0 || !flowers} onClick={() => dispatch({ type: 'zenMoment', kind: 'arrange' })}>
          <Icon name="vase" size={22} /> {flowers ? t('zen.act.arrange') : t('zen.act.arrangeNeed')}
        </button>
        <button className="btn btn--plain" onClick={go(() => st.openPanel('build'))}>
          <Icon name="build" size={22} /> {t('zen.act.decorate')}
        </button>
      </div>
      <div className="section-title">
        <Icon name="paw" size={22} /> {t('zen.pets.title')}
      </div>
      <div className="stack">
        {pets.map((p) => (
          <div key={p.id} className="card row row--between">
            <b>{L(p.name, getLang())}</b>
            <button className="btn btn--plain btn--sm" disabled={g.zen.pets[p.id] === today} onClick={() => dispatch({ type: 'feedPet', pet: p.id })}>
              {g.zen.pets[p.id] === today ? t('zen.pets.fed') : t('zen.pets.feed')}
            </button>
          </div>
        ))}
      </div>
      <div className="section-title">
        <Icon name="book" size={22} /> {t('zen.journal.moments')}
      </div>
      <div className="card small stack" style={{ gap: 2 }}>
        <span>{t('zen.journal.fishCount', { n: Object.values(g.zen.fish).reduce((a, n) => a + n, 0), kinds: Object.keys(g.zen.fish).length })}</span>
        <span>{t('zen.journal.sunsets', { n: g.zen.moments.sunset ?? 0 })}</span>
        <span>{t('zen.journal.lake', { n: g.zen.moments.lake ?? 0 })}</span>
        <span>{t('zen.journal.arranged', { n: g.zen.moments.arrange ?? 0 })}</span>
      </div>
      <p className="small muted">{t('zen.disclaimer', { world: WORLD.name })}</p>
    </Panel>
  );
}
