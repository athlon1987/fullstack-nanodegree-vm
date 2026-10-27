// Sharing: send the game to a friend (WhatsApp / system share / copy link), take a photo,
// or share a read-only snapshot of your neighbourhood's layout. Links never carry save data.
import { useMemo, useState } from 'react';
import { flag } from '../../platform/content/flags';
import { useT } from '../../platform/i18n';
import { encodeVisit, visitLink } from '../../services/visit';
import { useGame } from '../../state/store';
import { Icon } from '../components/Icon';
import { Panel } from '../components/Panel';

const close = () => useGame.getState().setUI({ activity: null });

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareCard() {
  const t = useT();
  const g = useGame((s) => s.game!);
  const [copied, setCopied] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState(false);
  const home = useMemo(() => {
    const u = new URL(location.href);
    u.search = '';
    u.hash = '';
    return u.toString();
  }, []);
  const snapLink = useMemo(() => (snapshot ? visitLink(encodeVisit(g)) : ''), [snapshot, g]);
  const link = snapshot ? snapLink : home;
  const message = snapshot ? t('share.snapshotMessage', { hood: g.profile.hoodName }) : t('share.message');
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`;
  const canNative = typeof navigator !== 'undefined' && 'share' in navigator;
  return (
    <Panel title={t('share.title')} icon="share" onClose={close}>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('share.intro')}
      </p>
      {flag('visit_links') && (
        <label className="card row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span>
            <b>{t('share.snapshot')}</b>
            <div className="small muted">{t('share.snapshotHint')}</div>
          </span>
          <input type="checkbox" checked={snapshot} onChange={(e) => setSnapshot(e.target.checked)} />
        </label>
      )}
      <div className="stack">
        <a className="btn btn--teal" href={whatsapp} target="_blank" rel="noopener noreferrer">
          <Icon name="chat" size={22} /> {t('share.whatsapp')}
        </a>
        {canNative && (
          <button className="btn btn--sky" onClick={() => navigator.share({ title: 'POCKETHOOD', text: message, url: link }).catch(() => {})}>
            <Icon name="share" size={22} /> {t('share.system')}
          </button>
        )}
        <button
          className="btn btn--plain"
          onClick={async () => {
            const ok = await copy(link);
            setCopied(ok ? link : null);
            if (!ok) window.prompt(t('share.copyManual'), link);
          }}
        >
          <Icon name="link" size={22} /> {copied === link ? t('common.copied') : t('share.copy')}
        </button>
        <button
          className="btn btn--plain"
          onClick={() => {
            useGame.getState().setUI({ activity: null, photoMode: true, panel: null, selected: null });
          }}
        >
          <Icon name="camera" size={22} /> {t('share.photo')}
        </button>
      </div>
      <p className="small muted">{snapshot ? t('share.snapshotPrivacy') : t('share.privacy')}</p>
    </Panel>
  );
}

/** Banner shown while looking at someone's shared snapshot. */
export function VisitBanner() {
  const t = useT();
  const hood = useGame((s) => s.game?.profile.hoodName ?? '');
  return (
    <div className="visit-banner" role="status">
      <Icon name="map" size={26} />
      <span style={{ flex: 1 }}>
        <b>{t('share.visiting', { hood })}</b>
        <small>{t('share.visitingHint')}</small>
      </span>
      <button
        className="btn btn--teal btn--sm"
        onClick={() => {
          const u = new URL(location.href);
          u.search = '';
          location.href = u.toString();
        }}
      >
        {t('share.goHome')}
      </button>
    </div>
  );
}
