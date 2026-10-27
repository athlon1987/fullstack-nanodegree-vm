import { useEffect, useState, type ReactNode } from 'react';
import { ITEMS } from '../../data/items';
import { RESIDENTS } from '../../data/residents';
import type { Cost, GameState, ItemBag } from '../../game/core/types';
import { portrait } from '../../rendering/thumbnails';
import { useGame } from '../../state/store';
import { Icon } from './Icon';
import { useT } from '../../platform/i18n';

export function Panel({ title, icon, onClose, children, foot, tabs }: { title: string; icon: string; onClose?: () => void; children: ReactNode; foot?: ReactNode; tabs?: ReactNode }) {
  const t = useT();
  const openPanel = useGame((s) => s.openPanel);
  const close = onClose ?? (() => openPanel(null));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  return (
    <>
      <div className="scrim" onClick={close} />
      <section className="panel" role="dialog" aria-label={title}>
        <header className="panel__head">
          <Icon name={icon} size={34} />
          <h2>{title}</h2>
          <button className="round-btn" onClick={close} aria-label={t('common.close')}>
            <Icon name="close" size={22} />
          </button>
        </header>
        {tabs}
        <div className="panel__body">{children}</div>
        {foot && <footer className="panel__foot">{foot}</footer>}
      </section>
    </>
  );
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} className={`tab ${value === o.id ? 'active' : ''}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Cost chips that show what's affordable (never colour-only: shortfalls get a label). */
export function CostChips({ cost, game }: { cost: Cost; game: GameState }) {
  const t = useT();
  const chips: ReactNode[] = [];
  if (cost.coins) {
    const short = game.coins < cost.coins;
    chips.push(
      <span key="c" className={`chip ${short ? 'short' : 'ok'}`} aria-label={short ? t('ui.cost.coinsShort', { n: cost.coins }) : t('common.coinsN', { n: cost.coins })}>
        <Icon name="coin" size={20} />
        {cost.coins}
      </span>,
    );
  }
  if (cost.gems) {
    const short = game.gems < cost.gems;
    chips.push(
      <span key="g" className={`chip ${short ? 'short' : 'ok'}`}>
        <Icon name="gem" size={20} />
        {cost.gems}
      </span>,
    );
  }
  for (const [id, n] of Object.entries(cost.items ?? {})) {
    const have = game.inventory[id] ?? 0;
    chips.push(
      <span key={id} className={`chip ${have < n ? 'short' : 'ok'}`} title={ITEMS[id].name} aria-label={t('ui.cost.item', { n, item: ITEMS[id].name, have })}>
        <Icon name={id} size={20} />
        {have}/{n}
      </span>,
    );
  }
  if (!chips.length) chips.push(<span key="free" className="chip ok">{t('common.free')}</span>);
  return <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{chips}</span>;
}

export function ItemChips({ items, game, showHave = true }: { items: ItemBag; game?: GameState; showHave?: boolean }) {
  return (
    <span className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
      {Object.entries(items).map(([id, n]) => {
        const have = game?.inventory[id] ?? 0;
        const short = !!game && have < n;
        return (
          <span key={id} className={`chip ${game ? (short ? 'short' : 'ok') : ''}`} title={ITEMS[id]?.name}>
            <Icon name={id} size={22} />
            {showHave && game ? `${Math.min(have, n)}/${n}` : `×${n}`}
          </span>
        );
      })}
    </span>
  );
}

/** Lazily rendered 3D portrait of a resident's real character model. */
export function Portrait({ resident, model, size = 'md' }: { resident?: string; model?: string; size?: 'md' | 'lg' }) {
  const t = useT();
  const name = model ?? RESIDENTS[resident!]?.model;
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    const id = window.setTimeout(() => setSrc(portrait(name)), 0);
    return () => window.clearTimeout(id);
  }, [name]);
  const color = resident ? RESIDENTS[resident]?.color : '#f2b632';
  return src ? (
    <img className={`portrait ${size === 'lg' ? 'portrait--lg' : ''}`} src={src} alt={resident ? RESIDENTS[resident].name : t('ui.avatar')} style={{ borderColor: '#fff', background: `radial-gradient(circle at 50% 30%, #fff, ${color}55)` }} />
  ) : (
    <div className={`portrait ${size === 'lg' ? 'portrait--lg' : ''}`} />
  );
}

export function Hearts({ level, max = 5 }: { level: number; max?: number }) {
  const t = useT();
  return (
    <span className="hearts" aria-label={t('ui.hearts', { level, max })}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name="heart" size={16} style={{ opacity: i < level ? 1 : 0.22, filter: i < level ? undefined : 'grayscale(1)' }} />
      ))}
    </span>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-valuemin={0}>
      <i style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} />
    </div>
  );
}
