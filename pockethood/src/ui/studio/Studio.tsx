// POCKETHOOD Studio — internal developer & content tools (prototype). Everything here acts on
// this device only: previews are not published, approvals are not real sign-offs, overrides
// never reach other players. The production workflow needs the backend (backend/README.md).
// Studio is staff-facing tooling, so it is written in English only.
import { useEffect, useMemo, useState } from 'react';
import { BUILDINGS } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { RESIDENTS } from '../../data/residents';
import { WORLD } from '../../data/world';
import { friendshipLevel } from '../../game/economy/economy';
import { ARCHETYPES, ICONS, PREFABS, PROPS, VEHICLE_MODELS } from '../../platform/content/catalog';
import { DEFAULT_FLAGS, flags as currentFlags, overrideFlag, useFlags } from '../../platform/content/flags';
import { ACTIVE_MODULES, compileModule } from '../../platform/content/install';
import { safeParse } from '../../platform/content/loader';
import { GAME_VERSION } from '../../platform/content/registry';
import { moduleSchema, type ModuleManifest } from '../../platform/content/schema';
import { studio, useContent } from '../../platform/content/service';
import { TEMPLATES } from '../../platform/content/templates';
import { getLang, missingKeys } from '../../platform/i18n';
import { audit, auditLog, clearAudit, onAudit } from '../../platform/security/audit';
import { run } from '../../platform/validate';
import { buildingThumb } from '../../rendering/thumbnails';
import { useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { Panel, Tabs } from '../components/Panel';
import { audio, type MoodId, type Sfx } from '../../audio/AudioManager';
import { ARRANGEMENTS, STINGERS } from '../../audio/music/score';

type Tab = 'status' | 'modules' | 'editor' | 'menu' | 'sponsor' | 'approvals' | 'countries' | 'npcs' | 'economy' | 'assets' | 'audio' | 'flags' | 'audit';
const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'modules', label: 'Modules' },
  { id: 'editor', label: 'Module editor' },
  { id: 'menu', label: 'Menu editor' },
  { id: 'sponsor', label: 'Sponsor preview' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'countries', label: 'Countries' },
  { id: 'npcs', label: 'NPCs' },
  { id: 'economy', label: 'Economy' },
  { id: 'assets', label: 'Assets' },
  { id: 'audio', label: 'Audio' },
  { id: 'flags', label: 'Flags' },
  { id: 'audit', label: 'Audit log' },
];

const mono = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 } as const;
const reload = () => useGame.getState().reloadContent();

export function StudioPanel() {
  const [tab, setTab] = useState<Tab>('status');
  useContent((c) => c.rev);
  return (
    <Panel title="Studio" icon="studio" onClose={() => useGame.getState().setUI({ activity: null })} tabs={<div style={{ overflowX: 'auto' }}><Tabs value={tab} onChange={setTab} options={TABS} /></div>}>
      <p className="small muted" style={{ marginTop: 0 }}>
        Internal prototype tools. Changes apply to this device only and are never published.
      </p>
      {tab === 'status' && <StatusTab />}
      {tab === 'modules' && <ModulesTab />}
      {tab === 'editor' && <EditorTab />}
      {tab === 'menu' && <MenuTab />}
      {tab === 'sponsor' && <SponsorTab />}
      {tab === 'approvals' && <ApprovalsTab />}
      {tab === 'countries' && <CountriesTab />}
      {tab === 'npcs' && <NpcTab />}
      {tab === 'economy' && <EconomyTab />}
      {tab === 'assets' && <AssetsTab />}
      {tab === 'audio' && <AudioTab />}
      {tab === 'flags' && <FlagsTab />}
      {tab === 'audit' && <AuditTab />}
    </Panel>
  );
}

function Kv({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="card stack" style={{ gap: 4 }}>
      {rows.map(([k, v]) => (
        <div key={k} className="row row--between small">
          <span className="muted">{k}</span>
          <b style={{ textAlign: 'right' }}>{v}</b>
        </div>
      ))}
    </div>
  );
}

function StatusTab() {
  const c = useContent();
  const g = useGame((s) => s.game!);
  const active = c.modules.filter((m) => m.status === 'active').length;
  return (
    <div className="stack">
      <Kv
        rows={[
          ['Game version', GAME_VERSION],
          ['Content source', c.bundle?.source ?? '—'],
          ['Content version', c.bundle?.index.contentVersion ?? '—'],
          ['World', `${WORLD.name} (${WORLD.id}, ${WORLD.country})`],
          ['Save world', g.world.id],
          ['Modules active / listed', `${active} / ${c.modules.length}`],
          ['Language', getLang()],
          ['Missing i18n keys seen', String(missingKeys().length)],
          ['Save version', String(g.version)],
          ['Zen Mode', g.settings.zen ? 'on' : 'off'],
        ]}
      />
      <div className="section-title">Load log</div>
      <div className="card" style={mono}>
        {c.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        {c.bundle?.problems.map((p, i) => (
          <div key={`p${i}`} style={{ color: '#a8472b' }}>
            {p}
          </div>
        ))}
      </div>
      <p className="small muted">Feature status and test results: docs/DEVELOPMENT_STATUS.md.</p>
    </div>
  );
}

function ModulesTab() {
  const mods = useContent((c) => c.modules);
  return (
    <div className="stack">
      {mods.map((m) => (
        <div key={m.id} className="card stack" style={{ gap: 4 }}>
          <div className="row row--between">
            <b style={mono}>{m.id}</b>
            <span className={`chip ${m.status === 'active' ? 'ok' : 'short'}`}>{m.status}</span>
          </div>
          <div className="small muted">
            v{m.version} · {m.source} · {m.reason}
          </div>
          {m.issues.map((i, k) => (
            <div key={k} className="small" style={{ ...mono, color: '#a8472b' }}>
              ✕ {i}
            </div>
          ))}
          {m.warnings.map((i, k) => (
            <div key={k} className="small" style={{ ...mono, color: '#9a6a12' }}>
              ! {i}
            </div>
          ))}
          <div className="row" style={{ gap: 6 }}>
            <button
              className="btn btn--plain btn--sm"
              onClick={() => {
                if (studio.disabled.has(m.id)) studio.disabled.delete(m.id);
                else studio.disabled.add(m.id);
                audit({ actor: 'studio', action: studio.disabled.has(m.id) ? 'module.local_disable' : 'module.local_enable', target: m.id });
                reload();
              }}
            >
              {studio.disabled.has(m.id) ? 'Switch back on (this device)' : 'Switch off (this device)'}
            </button>
            {studio.previews.has(m.id) && (
              <button
                className="btn btn--plain btn--sm"
                onClick={() => {
                  studio.previews.delete(m.id);
                  reload();
                }}
              >
                Discard preview
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="small muted">Remote kill switches live in the content index (content/index.json → killSwitch) and take effect on the next load.</p>
    </div>
  );
}

function pickModule(mods: ReturnType<typeof useContent.getState>['modules'], id: string | null) {
  return mods.find((m) => m.id === id) ?? mods.find((m) => m.manifest);
}

/** Edit a module's JSON, validate it with the production schema + compiler, preview it live. */
function EditorTab() {
  const mods = useContent((c) => c.modules);
  const [id, setId] = useState<string | null>(null);
  const sel = pickModule(mods, id);
  const [text, setText] = useState('');
  useEffect(() => setText(sel?.manifest ? JSON.stringify(sel.manifest, null, 2) : ''), [sel?.id]);
  const result = useMemo(() => {
    try {
      const parsed = run(moduleSchema, safeParse(text));
      if (!parsed.ok) return { ok: false, lines: parsed.issues.map((i) => `${i.path}: ${i.message}`), manifest: null };
      const c = compileModule(parsed.value, getLang(), Date.now(), WORLD.country);
      return { ok: c.ok, lines: [...c.errors, ...c.warnings.map((w) => `warning: ${w}`)], manifest: parsed.value as ModuleManifest };
    } catch (e) {
      return { ok: false, lines: [`JSON: ${(e as Error).message}`], manifest: null };
    }
  }, [text]);
  return (
    <div className="stack">
      <select value={sel?.id ?? ''} onChange={(e) => setId(e.target.value)}>
        {mods.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id}
          </option>
        ))}
      </select>
      <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ ...mono, width: '100%', minHeight: 280 }} aria-label="Module JSON" />
      <div className="card" style={mono}>
        <b style={{ color: result.ok ? '#2f7d4f' : '#a8472b' }}>{result.ok ? '✓ Valid — passes schema, template and economy checks' : '✕ Not valid'}</b>
        {result.lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <button
          className="btn btn--teal btn--sm"
          disabled={!result.ok || !result.manifest}
          onClick={() => {
            studio.previews.set(result.manifest!.id, result.manifest!);
            audit({ actor: 'studio', action: 'module.preview', target: result.manifest!.id });
            reload();
          }}
        >
          Preview in this session
        </button>
        <button className="btn btn--plain btn--sm" onClick={() => void navigator.clipboard?.writeText(text)}>
          Copy JSON
        </button>
      </div>
      <p className="small muted">Previewing re-installs content live, so you can see that changing data (names, recipes, quiz questions, palettes) changes the game without any code change.</p>
    </div>
  );
}

/** Real-world menu editor with the player-facing policy applied as you type. */
function MenuTab() {
  const mods = useContent((c) => c.modules.filter((m) => m.manifest));
  const [id, setId] = useState<string | null>(null);
  const sel = pickModule(mods, id);
  type Row = { name: string; price: string; available: boolean };
  const [rows, setRows] = useState<Row[]>([]);
  const [source, setSource] = useState<'illustrative' | 'partner_supplied'>('illustrative');
  const [verifiedAt, setVerifiedAt] = useState('');
  useEffect(() => {
    const menu = sel?.manifest?.realWorld?.menu;
    setRows(menu?.items.map((i) => ({ name: typeof i.name === 'string' ? i.name : Object.values(i.name)[0], price: i.priceMinor !== undefined ? (i.priceMinor / 100).toFixed(2) : '', available: i.available ?? true })) ?? [{ name: '', price: '', available: true }]);
    setSource(menu?.source ?? 'illustrative');
    setVerifiedAt(menu?.verifiedAt ?? '');
  }, [sel?.id]);
  if (!sel?.manifest) return <p>No module loaded.</p>;
  const draft: ModuleManifest = {
    ...sel.manifest,
    realWorld: {
      ...sel.manifest.realWorld,
      menu: {
        currency: 'MYR',
        version: '1.0.1',
        source,
        ...(verifiedAt ? { verifiedAt } : {}),
        items: rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), ...(r.price ? { priceMinor: Math.round(Number(r.price) * 100) } : {}), available: r.available })),
      },
    },
  };
  const schemaCheck = run(moduleSchema, draft);
  const compiled = schemaCheck.ok ? compileModule(schemaCheck.value, getLang(), Date.now(), WORLD.country) : null;
  const shown = compiled?.module?.realWorld?.menu;
  return (
    <div className="stack">
      <select value={sel.id} onChange={(e) => setId(e.target.value)}>
        {mods.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id}
          </option>
        ))}
      </select>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <label className="small">
          Source{' '}
          <select value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
            <option value="illustrative">illustrative (no prices)</option>
            <option value="partner_supplied">partner supplied</option>
          </select>
        </label>
        <label className="small">
          Verified on <input type="date" value={verifiedAt} onChange={(e) => setVerifiedAt(e.target.value)} />
        </label>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="row" style={{ gap: 6 }}>
          <input value={r.name} placeholder="Item name" onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} style={{ flex: 1 }} />
          <input value={r.price} placeholder="RM" inputMode="decimal" onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, price: e.target.value.replace(/[^0-9.]/g, '') } : x)))} style={{ width: 70 }} />
          <input type="checkbox" checked={r.available} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, available: e.target.checked } : x)))} aria-label="Available" />
        </div>
      ))}
      <button className="btn btn--plain btn--sm" onClick={() => setRows([...rows, { name: '', price: '', available: true }])}>
        Add item
      </button>
      <div className="section-title">What players would see</div>
      <div className="card small stack" style={{ gap: 2 }}>
        {!schemaCheck.ok && schemaCheck.issues.map((i, k) => <div key={k} style={{ color: '#a8472b' }}>✕ {i.path}: {i.message}</div>)}
        {shown?.items.map((i, k) => (
          <div key={k} className="row row--between">
            <span>{i.name}</span>
            <span className="muted">{i.priceMinor !== null ? `RM${(i.priceMinor / 100).toFixed(2)}` : 'Price not provided'}</span>
          </div>
        ))}
        {compiled?.warnings.map((w, k) => (
          <div key={`w${k}`} style={{ color: '#9a6a12' }}>
            ! {w}
          </div>
        ))}
      </div>
      <button className="btn btn--plain btn--sm" onClick={() => void navigator.clipboard?.writeText(JSON.stringify(draft.realWorld, null, 2))}>
        Copy realWorld JSON
      </button>
      <p className="small muted">Prices are only ever shown when partner-supplied AND verified. Game coins are never linked to real prices.</p>
    </div>
  );
}

function SponsorTab() {
  const mods = useContent((c) => c.modules.filter((m) => m.manifest));
  const [id, setId] = useState<string | null>(null);
  const sel = pickModule(mods, id);
  const [label, setLabel] = useState<'sponsored_experience' | 'official_partner'>('sponsored_experience');
  const [verified, setVerified] = useState(false);
  const [licensed, setLicensed] = useState(false);
  if (!sel?.manifest) return <p>No module loaded.</p>;
  const m: ModuleManifest = {
    ...sel.manifest,
    sponsor: { partnerId: 'demo-partner', label, verified, ...(verified ? { verifiedAt: '2026-10-01', contractRef: 'DEMO-1' } : {}) },
    brand: licensed ? { ...sel.manifest.brand, kind: 'licensed', licence: { holder: 'Demo Partner Sdn Bhd', agreementRef: 'DEMO-L', expires: '2027-12-31' } } : sel.manifest.brand,
  };
  const c = compileModule(m, getLang(), Date.now(), WORLD.country);
  return (
    <div className="stack">
      <select value={sel.id} onChange={(e) => setId(e.target.value)}>
        {mods.map((x) => (
          <option key={x.id} value={x.id}>
            {x.id}
          </option>
        ))}
      </select>
      <label className="small">
        Requested label{' '}
        <select value={label} onChange={(e) => setLabel(e.target.value as typeof label)}>
          <option value="sponsored_experience">Sponsored Experience</option>
          <option value="official_partner">Official Brand Partner</option>
        </select>
      </label>
      <label className="small">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Sponsorship verified (contract on file)
      </label>
      <label className="small">
        <input type="checkbox" checked={licensed} onChange={(e) => setLicensed(e.target.checked)} /> Licensed brand with a valid licence
      </label>
      <div className="card stack">
        <b>Player sees:</b>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          <span className="chip">{c.module?.brand.kind === 'fictional' ? 'Fictional business' : 'Licensed brand'}</span>
          {c.module?.sponsorLabel ? <span className="chip sponsor-label">{c.module.sponsorLabel === 'official_partner' ? 'Official Brand Partner' : 'Sponsored Experience'}</span> : <span className="small muted">no sponsor label</span>}
        </div>
        {c.warnings.map((w, k) => (
          <div key={k} className="small" style={{ color: '#9a6a12' }}>
            ! {w}
          </div>
        ))}
        {!c.ok && c.errors.map((e, k) => <div key={k} className="small" style={{ color: '#a8472b' }}>✕ {e}</div>)}
      </div>
      <p className="small muted">Labels are never shown in Zen Mode. Sponsored content can’t change the economy (template ceilings), grant gems, or add tutorial quests.</p>
    </div>
  );
}

type Stage = 'draft' | 'in_review' | 'approved' | 'rejected';
function ApprovalsTab() {
  const mods = useContent((c) => c.modules.filter((m) => m.manifest));
  const [state, setState] = useState<Record<string, Stage>>({});
  const role = 'Content Reviewer (local prototype)';
  return (
    <div className="stack">
      <p className="small muted">Prototype of the review workflow (draft → in review → approved / rejected). Decisions here are local notes only; real approvals are recorded server-side with role checks and an audit trail.</p>
      {mods.map((m) => {
        const cur = state[m.id] ?? (m.manifest!.approval.state as Stage);
        const go = (s: Stage) => {
          setState({ ...state, [m.id]: s });
          audit({ actor: 'studio', action: `approval.${s}`, target: m.id, detail: role });
        };
        return (
          <div key={m.id} className="card stack" style={{ gap: 4 }}>
            <div className="row row--between">
              <b style={mono}>{m.id}</b>
              <span className="chip">{cur}</span>
            </div>
            <div className="small muted">
              Reviewed by {m.manifest!.approval.reviewedBy ?? '—'} on {m.manifest!.approval.reviewedAt ?? '—'} · brand: {m.manifest!.brand.kind} · sponsor: {m.manifest!.sponsor ? 'yes' : 'none'}
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button className="btn btn--plain btn--sm" onClick={() => go('in_review')}>
                Send to review
              </button>
              <button className="btn btn--teal btn--sm" onClick={() => go('approved')}>
                Approve
              </button>
              <button className="btn btn--coral btn--sm" onClick={() => go('rejected')}>
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CountriesTab() {
  const countries = useContent((c) => c.bundle?.countries ?? []);
  return (
    <div className="stack">
      {countries.map((c) => (
        <Kv
          key={c.code}
          rows={[
            ['Country', `${c.code} · ${typeof c.name === 'string' ? c.name : Object.values(c.name)[0]}`],
            ['Status', c.status],
            ['Locales', c.locales.join(', ')],
            ['Currency', `${c.currency.code} (${c.currency.symbol})`],
            ['Time zone', c.timezone],
            ['Worlds', c.worlds.join(', ') || '—'],
          ]}
        />
      ))}
    </div>
  );
}

function NpcTab() {
  const g = useGame((s) => s.game!);
  const focus = (id: string) => useGame.getState().setUI({ resident: id, panel: 'residents' });
  return (
    <div className="stack">
      {Object.values(RESIDENTS).map((r) => {
        const st = g.residents.find((x) => x.id === r.id);
        return (
          <div key={r.id} className="card stack" style={{ gap: 2 }}>
            <div className="row row--between">
              <b>
                {r.name} <span className="muted small">({r.id})</span>
              </b>
              <span className={`chip ${st ? 'ok' : ''}`}>{st ? 'here' : r.arrival.type === 'building' ? `arrives with ${r.arrival.building}` : r.arrival.type}</span>
            </div>
            <div className="small muted">
              {r.profession} · {r.model} · works at {r.workplace ?? '—'} · favourites: {r.favorites.map((f) => ITEMS[f]?.name ?? f).join(', ')}
            </div>
            {st && (
              <div className="small">
                Friendship {st.friendship} (level {friendshipLevel(st.friendship)}) · memories {Object.keys(st.memories).length} · stories done {st.storyDone.length}
                {st.storyActive ? ` · active: ${st.storyActive.id}` : ''}
              </div>
            )}
            {st && (
              <button className="btn btn--plain btn--sm" onClick={() => focus(r.id)}>
                Open
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Value created per minute by every active recipe vs its template ceiling. */
function EconomyTab() {
  const rows = Object.values(RECIPES).map((r) => {
    const inputs = Object.entries(r.inputs).reduce((s, [i, n]) => s + (ITEMS[i]?.value ?? 0) * n, 0);
    const net = (ITEMS[r.output]?.value ?? 0) * r.qty - inputs - (r.coins ?? 0);
    const perMin = net / (r.seconds / 60);
    const tpl = BUILDINGS[r.building]?.template;
    const ceiling = tpl ? TEMPLATES[tpl].limits.valuePerMinute : null;
    return { r, perMin, ceiling, module: r.module };
  });
  rows.sort((a, b) => b.perMin - a.perMin);
  return (
    <div className="stack">
      <p className="small muted">Net value per minute (output − inputs − ingredient coins). Module recipes must stay under their template’s ceiling; the content build and the installer both enforce this. Full bot simulation: npm run economy:sim.</p>
      <div className="card" style={mono}>
        {rows.map(({ r, perMin, ceiling, module }) => (
          <div key={r.id} className="row row--between" style={{ color: ceiling !== null && perMin > ceiling ? '#a8472b' : undefined }}>
            <span>
              {r.name}
              {module ? ' ◆' : ''}
            </span>
            <span>
              {perMin.toFixed(1)}/min{ceiling !== null ? ` (≤ ${ceiling})` : ''}
            </span>
          </div>
        ))}
      </div>
      <p className="small muted">◆ = from a module</p>
    </div>
  );
}

function AssetsTab() {
  const [arch, setArch] = useState<string>('my:rumah_kampung');
  const [src, setSrc] = useState('');
  useEffect(() => {
    const b = Object.values(BUILDINGS).find((d) => d.archetype === arch);
    const id = window.setTimeout(() => setSrc(b ? buildingThumb(b.id) : ''), 0);
    return () => window.clearTimeout(id);
  }, [arch]);
  const used = new Set(Object.values(BUILDINGS).map((b) => b.archetype));
  return (
    <div className="stack">
      <div className="section-title">Architecture kit</div>
      <select value={arch} onChange={(e) => setArch(e.target.value)}>
        {ARCHETYPES.filter((a) => used.has(a)).map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      {src && <img src={src} alt={arch} style={{ width: 200, alignSelf: 'center' }} />}
      <Kv
        rows={[
          ['Module prefabs', PREFABS.join(', ')],
          ['Props', PROPS.join(', ')],
          ['Vehicles (Kenney CC0)', VEHICLE_MODELS.join(', ')],
          ['Dressed now', Object.values(ACTIVE_MODULES).map((m) => `${m.slot}→${m.prefab}`).join(', ') || '—'],
        ]}
      />
      <div className="section-title">Approved icons</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        {ICONS.map((i) => (
          <span key={i} className="chip" title={i}>
            <Icon name={i} size={24} /> <small>{i}</small>
          </span>
        ))}
      </div>
      <a className="btn btn--plain btn--sm" href="./viewer.html?base=assets/models/characters/&m=mini_female_b,mini_male_e" target="_blank" rel="noopener">
        Open the 3D model viewer
      </a>
    </div>
  );
}

/** Audio QA: pin an arrangement, fire stingers and feedback sounds, watch the transport. */
function AudioTab() {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);
  const st = audio.musicState;
  const moods = Object.keys(ARRANGEMENTS) as MoodId[];
  const sfx: Sfx[] = ['click', 'collect', 'place', 'complete', 'unlock', 'reward', 'friendship', 'water', 'plant', 'levelup', 'error', 'chime', 'pet_cat', 'pet_dog'];
  return (
    <div className="stack">
      <Kv rows={[['Music', st ? `${st.mood} · ${st.bpm.toFixed(0)} BPM · bar ${st.bar} · cycle ${st.cycle}` : 'not started (tap the world first)'], ['Pinned', audio.forceMood ?? 'follows the game']]} />
      <div className="section-title">Arrangement</div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <button className="btn btn--sm" onClick={() => (audio.forceMood = null)}>Follow game</button>
        {moods.map((m) => (
          <button key={m} className={`btn btn--sm ${audio.forceMood === m ? 'btn--teal' : ''}`} onClick={() => (audio.forceMood = m)}>
            {m} · {ARRANGEMENTS[m].bpm}
          </button>
        ))}
      </div>
      <div className="section-title">Stingers</div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {(Object.keys(STINGERS) as (keyof typeof STINGERS)[]).map((k) => (
          <button key={k} className="btn btn--sm" onClick={() => audio.stinger(k)}>
            {k}
          </button>
        ))}
      </div>
      <div className="section-title">Feedback sounds</div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {sfx.map((k) => (
          <button key={k} className="btn btn--sm" onClick={() => audio.play(k)}>
            {k}
          </button>
        ))}
      </div>
      <p className="small muted">Everything is synthesised live; see docs/AUDIO_ASSET_MANIFEST.md. Changes take effect at the next bar line.</p>
    </div>
  );
}

function FlagsTab() {
  const { remote, overrides } = useFlags();
  const all = currentFlags();
  return (
    <div className="stack">
      {Object.keys({ ...DEFAULT_FLAGS, ...remote }).map((k) => (
        <div key={k} className="card row row--between small">
          <span>
            <b style={mono}>{k}</b>
            <div className="muted">
              default {String(DEFAULT_FLAGS[k] ?? '—')} · index {k in remote ? String(remote[k]) : '—'} · override {k in overrides ? String(overrides[k]) : '—'}
            </div>
          </span>
          <span className="row" style={{ gap: 4 }}>
            <button
              className={`btn btn--sm ${all[k] ? 'btn--teal' : 'btn--plain'}`}
              onClick={() => {
                overrideFlag(k, !all[k]);
                audit({ actor: 'studio', action: 'flag.override', target: k, detail: String(!all[k]) });
                reload();
              }}
            >
              {all[k] ? 'on' : 'off'}
            </button>
            {k in overrides && (
              <button
                className="btn btn--plain btn--sm"
                onClick={() => {
                  overrideFlag(k, undefined);
                  reload();
                }}
              >
                reset
              </button>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function AuditTab() {
  const [, setN] = useState(0);
  useEffect(() => onAudit(() => setN((x) => x + 1)), []);
  const log = auditLog();
  return (
    <div className="stack">
      <p className="small muted">Device-local log of content loads, rejections, quarantines and Studio actions. Diagnostic only — the authoritative audit trail is server-side.</p>
      <button className="btn btn--plain btn--sm" onClick={clearAudit}>
        Clear
      </button>
      <div className="card" style={{ ...mono, maxHeight: 380, overflow: 'auto' }}>
        {log.map((e, i) => (
          <div key={i} style={{ color: e.level === 'error' ? '#a8472b' : e.level === 'warn' ? '#9a6a12' : undefined }}>
            {new Date(e.t).toLocaleTimeString()} [{e.actor}] {e.action} {e.target ?? ''} {e.detail ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}
