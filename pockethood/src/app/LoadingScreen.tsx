import { useEffect, useState } from 'react';
import { useT } from '../platform/i18n';

const TIPS = ['ui.tip.collect', 'ui.tip.remember', 'ui.tip.paths', 'ui.tip.pulse', 'ui.tip.away', 'ui.tip.upgrades', 'ui.tip.photo'];

export function LoadingScreen({ progress, done, error }: { progress: number; done: boolean; error?: string }) {
  const t = useT();
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTip((i) => (i + 1) % TIPS.length), 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className={`loading ${done ? 'done' : ''}`} aria-busy={!done} aria-live="polite">
      <LoadScene />
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div className="logo">
          POCKET<span>HOOD</span>
        </div>
        <div className="tagline">{t('ui.loading.tagline')}</div>
        <div className="loadbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <i style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="tip">{error ?? t(TIPS[tip])}</div>
      </div>
    </div>
  );
}

/** A painted rolling-hills skyline with little houses, drawn in SVG. */
function LoadScene() {
  const houses = [
    { x: 90, w: 70, h: 54, wall: '#f7ecd8', roof: '#d9673f' },
    { x: 200, w: 60, h: 46, wall: '#cdebd8', roof: '#ec7d61' },
    { x: 690, w: 76, h: 60, wall: '#f8e2a0', roof: '#a8434d' },
    { x: 800, w: 58, h: 44, wall: '#f6d3d8', roof: '#5d6f8a' },
  ];
  return (
    <svg className="load-scene" viewBox="0 0 960 240" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <path d="M0 150 Q 160 90 320 140 T 640 130 T 960 120 V240 H0z" fill="#9fd47c" />
      <path d="M0 190 Q 200 140 420 185 T 960 170 V240 H0z" fill="#7fc25a" />
      {houses.map((h, i) => (
        <g key={i} transform={`translate(${h.x} ${170 - h.h - (i % 2) * 8})`}>
          <rect x={0} y={18} width={h.w} height={h.h} rx={5} fill={h.wall} stroke="#3d3226" strokeWidth={3} />
          <path d={`M-8 24 L${h.w / 2} -10 L${h.w + 8} 24`} fill={h.roof} stroke="#3d3226" strokeWidth={3} strokeLinejoin="round" />
          <rect x={h.w / 2 - 9} y={h.h - 8} width={18} height={26} rx={3} fill="#4f9de0" stroke="#3d3226" strokeWidth={2.5} />
          <rect x={8} y={32} width={14} height={14} rx={2} fill="#a9d8e8" stroke="#3d3226" strokeWidth={2.5} />
        </g>
      ))}
      {[380, 460, 560, 900, 30].map((x, i) => (
        <g key={x} transform={`translate(${x} ${160 + (i % 2) * 12})`}>
          <rect x={-4} y={10} width={8} height={22} fill="#8a5a37" />
          <circle cx={0} cy={0} r={22} fill={i % 2 ? '#5fb84a' : '#6cc04a'} stroke="#3d3226" strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
}
