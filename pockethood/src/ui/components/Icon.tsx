// POCKETHOOD icon family: original vector "sticker" icons — chunky fills,
// a warm ink outline and a soft highlight — so currencies, goods and UI share one style.
import type { CSSProperties, ReactNode } from 'react';

const INK = '#3d3226';
const S = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const HL = { fill: '#ffffff', opacity: 0.45 };

const ICONS: Record<string, ReactNode> = {
  coin: (
    <>
      <circle cx="12" cy="12" r="9" fill="#f6c343" {...S} />
      <circle cx="12" cy="12" r="6" fill="#ffd96b" stroke="#d99a1e" strokeWidth={1.2} />
      <path d="M12 8.5v7M10 10h3a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3" stroke="#b9791a" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <ellipse cx="9" cy="7.5" rx="2.5" ry="1.2" {...HL} />
    </>
  ),
  gem: (
    <>
      <path d="M6 9l3-4h6l3 4-6 11z" fill="#5fd0e8" {...S} />
      <path d="M6 9h12M9 5l3 4 3-4M12 9v11" stroke="#2f8fb3" strokeWidth={1.1} fill="none" />
      <path d="M8 8.5l1.8-2.5" stroke="#fff" strokeWidth={1.4} opacity={0.7} />
    </>
  ),
  xp: (
    <>
      <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z" fill="#8fd16a" {...S} />
      <path d="M9.4 8.6L12 5" stroke="#fff" strokeWidth={1.4} opacity={0.6} />
    </>
  ),
  star: <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z" fill="#f6c343" {...S} />,
  build: (
    <>
      <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="#f6cfae" {...S} />
      <path d="M2.5 11.5L12 4l9.5 7.5" fill="none" stroke="#d9673f" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="14" width="4" height="6" rx="0.8" fill="#4f9de0" {...S} />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="#f7ecd8" {...S} />
      <path d="M2.5 11.5L12 4l9.5 7.5" fill="none" stroke="#d9673f" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="14" width="4" height="6" rx="0.8" fill="#8a5a37" {...S} />
    </>
  ),
  residents: (
    <>
      <circle cx="8.5" cy="8" r="3.2" fill="#f6cfae" {...S} />
      <path d="M3 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6z" fill="#ec7d61" {...S} />
      <circle cx="16" cy="9" r="2.8" fill="#f6cfae" {...S} />
      <path d="M12.5 20c.3-3 1.6-5 3.5-5s4.5 1.8 4.5 5z" fill="#4f9de0" {...S} />
    </>
  ),
  orders: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" fill="#fbf3e4" {...S} />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" fill="#d9673f" {...S} />
      <path d="M8.5 10.5l1.5 1.5 3-3M8.5 16h7" stroke="#2fa59b" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  quests: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6z" fill="#f8e2a0" {...S} />
      <path d="M6 4a2 2 0 0 0-2 2v1h2" fill="#e8c46a" {...S} />
      <path d="M9 9h7M9 12.5h7M9 16h4" stroke="#8a5a37" strokeWidth={1.5} strokeLinecap="round" />
    </>
  ),
  inventory: (
    <>
      <path d="M5 9h14l-1 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" fill="#b67b4c" {...S} />
      <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" fill="none" {...S} />
      <rect x="9.5" y="12" width="5" height="3" rx="1" fill="#f6c343" {...S} />
    </>
  ),
  friends: (
    <>
      <path d="M9 19s-6-3.8-6-8a3.4 3.4 0 0 1 6-2.2A3.4 3.4 0 0 1 15 11c0 4.2-6 8-6 8z" fill="#ff8fb1" {...S} />
      <path d="M15.5 20.5s-4.5-2.8-4.5-6a2.6 2.6 0 0 1 4.5-1.7A2.6 2.6 0 0 1 20 14.5c0 3.2-4.5 6-4.5 6z" fill="#d64f7a" {...S} />
    </>
  ),
  events: (
    <>
      <circle cx="12" cy="7" r="3.2" fill="#ff8fb1" {...S} />
      <circle cx="7" cy="11" r="3.2" fill="#ffd34d" {...S} />
      <circle cx="17" cy="11" r="3.2" fill="#c084fc" {...S} />
      <circle cx="9" cy="16" r="3.2" fill="#ff8a5b" {...S} />
      <circle cx="15" cy="16" r="3.2" fill="#8fd16a" {...S} />
      <circle cx="12" cy="12" r="2.4" fill="#fff6d8" {...S} />
    </>
  ),
  flower: (
    <>
      <path d="M12 22v-8" stroke="#3e9a55" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M12 17c-3 0-4-2-4-3 2 0 4 1 4 3z" fill="#5fb84a" {...S} />
      <circle cx="12" cy="6" r="2.8" fill="#ff8fb1" {...S} />
      <circle cx="8.5" cy="9" r="2.8" fill="#ff8fb1" {...S} />
      <circle cx="15.5" cy="9" r="2.8" fill="#ff8fb1" {...S} />
      <circle cx="10" cy="12.5" r="2.8" fill="#ff8fb1" {...S} />
      <circle cx="14" cy="12.5" r="2.8" fill="#ff8fb1" {...S} />
      <circle cx="12" cy="9.5" r="2" fill="#ffd34d" {...S} />
    </>
  ),
  settings: (
    <>
      <path
        d="M12 2.8l1.6 2.2 2.7-.6.7 2.6 2.6.9-.6 2.7 2 1.8-2 1.8.6 2.7-2.6.9-.7 2.6-2.7-.6L12 21.2l-1.6-2.2-2.7.6-.7-2.6-2.6-.9.6-2.7-2-1.8 2-1.8-.6-2.7 2.6-.9.7-2.6 2.7.6z"
        fill="#b4c3d6"
        {...S}
      />
      <circle cx="12" cy="12" r="3.3" fill="#fbf3e4" {...S} />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" fill="#4f9de0" {...S} />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="#fff" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" fill="#5fb84a" {...S} />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l9.5 17h-19z" fill="#f2b632" {...S} />
      <path d="M12 9.5v5" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx="12" cy="17.3" r="1.2" fill={INK} />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#ff6f91" {...S} />
      <ellipse cx="8.6" cy="9.4" rx="1.6" ry="1" {...HL} />
    </>
  ),
  upgrade: (
    <>
      <circle cx="12" cy="12" r="9" fill="#2fa59b" {...S} />
      <path d="M12 17V7.5M8 11l4-4 4 4" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" fill="#fbf3e4" {...S} />
      <path d="M12 9v4l2.5 2" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <rect x="10" y="2.5" width="4" height="2.5" rx="1" fill="#d9673f" {...S} />
    </>
  ),
  pulse: (
    <>
      <path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#ec7d61" {...S} />
      <path d="M5.5 12h3l1.5-2.5 2.2 5 1.6-3h4.6" stroke="#fff" strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  map: (
    <>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#cdebd8" {...S} />
      <path d="M9 4v14M15 6v14" stroke={INK} strokeWidth={1.2} />
      <circle cx="17.5" cy="10" r="1.6" fill="#d64f7a" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="#f6c343" {...S} />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3M17 6h2.5a2.5 2.5 0 0 1-2.6 3" fill="none" {...S} />
      <path d="M12 14v3M8.5 20.5h7l-1-3.5h-5z" fill="#d99a1e" {...S} />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.5" fill="#ec7d61" {...S} />
      <rect x="3" y="7" width="18" height="4" rx="1" fill="#f6cfae" {...S} />
      <path d="M12 7v13" stroke="#f6c343" strokeWidth={2.4} />
      <path d="M12 7c-2-3.5-5.5-3-5-1s5 1 5 1zm0 0c2-3.5 5.5-3 5-1s-5 1-5 1z" fill="#f6c343" {...S} />
    </>
  ),
  story: (
    <>
      <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5z" fill="#fbf3e4" {...S} />
      <path d="M12 6v14" stroke={INK} strokeWidth={1.4} />
      <path d="M6.5 9h3M6.5 12h3M14.5 9h3M14.5 12h3" stroke="#d64f7a" strokeWidth={1.3} strokeLinecap="round" />
    </>
  ),
  landmark: (
    <>
      <ellipse cx="12" cy="18" rx="9" ry="3" fill="#d9d2c3" {...S} />
      <path d="M10.5 17V9h3v8" fill="#d9d2c3" {...S} />
      <path d="M12 3c2.5 3 3 5 0 6-3-1-2.5-3 0-6z" fill="#5fd0e8" {...S} />
      <path d="M6 16c1-3 4-4 6-4s5 1 6 4" fill="none" stroke="#5fd0e8" strokeWidth={1.6} />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2.5" fill="#5d6f8a" {...S} />
      <path d="M8.5 7l1.5-2.5h4L15.5 7" fill="#5d6f8a" {...S} />
      <circle cx="12" cy="13" r="3.6" fill="#cfe3ef" {...S} />
      <circle cx="17.5" cy="9.8" r="0.9" fill="#f6c343" />
    </>
  ),
  rotate: <path d="M18.5 9A7 7 0 1 0 19 14M19 4.5V9h-4.5" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  move: <path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" stroke={INK} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  sell: (
    <>
      <path d="M5 7h14l-1.2 13a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" fill="#e8b4a0" {...S} />
      <path d="M3.5 7h17M9 7V4.5h6V7M10 11v6M14 11v6" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" fill="#b4aa98" {...S} />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" {...S} />
      <circle cx="12" cy="15" r="1.6" fill={INK} />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
  minus: <path d="M5 12h14" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />,
  chat: (
    <>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-4 3.5V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="#fbf3e4" {...S} />
      <circle cx="8.5" cy="11" r="1.2" fill={INK} />
      <circle cx="12" cy="11" r="1.2" fill={INK} />
      <circle cx="15.5" cy="11" r="1.2" fill={INK} />
    </>
  ),
  history: (
    <>
      <path d="M7 3h11a2 2 0 0 1 2 2v1H9" fill="#e8c46a" {...S} />
      <path d="M7 3a2 2 0 0 0-2 2v13a3 3 0 0 0 3 3h10a2 2 0 0 0 2-2V6H9V5a2 2 0 0 0-2-2z" fill="#f8e2a0" {...S} />
      <path d="M9.5 10h7M9.5 13.5h7M9.5 17h4" stroke="#8a5a37" strokeWidth={1.4} strokeLinecap="round" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#f6c343" {...S} />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#b4aa98" {...S} />
      <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke={INK} strokeWidth={1.9} strokeLinecap="round" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" fill="#fbf3e4" {...S} />
      <path d="M15.5 15.5L20 20M10.5 7.5v6M7.5 10.5h6" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" fill="#fbf3e4" {...S} />
      <path d="M15.5 15.5L20 20M7.5 10.5h6" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  arrow: <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  dev: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#3d3226" {...S} />
      <path d="M7 10l2.5 2L7 14M11.5 14.5h5" stroke="#8fd16a" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  // ── Goods ─────────────────────────────────────────────────────────────
  coffee: (
    <>
      <path d="M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" fill="#fffaf0" {...S} />
      <path d="M16 11h1.5a2.3 2.3 0 0 1 0 4.6H15.6" fill="none" {...S} />
      <ellipse cx="10.5" cy="9.2" rx="5.2" ry="1.4" fill="#8a5a37" {...S} />
      <path d="M8.5 6.5c0-1.5 1.5-1.5 1.5-3M12 6.5c0-1.5 1.5-1.5 1.5-3" stroke="#b4aa98" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <path d="M7 13.5c.3 2 1.5 3.5 3.5 3.5" stroke="#ec7d61" strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>
  ),
  bread: (
    <>
      <path d="M3.5 13.5c0-4 4-7 8.5-7s8.5 3 8.5 7c0 3-2 5-8.5 5s-8.5-2-8.5-5z" fill="#e3a35a" {...S} />
      <path d="M8 9.5l1.5 3M12 8.5l1.2 3.5M16 9.5l-.5 3" stroke="#a8693a" strokeWidth={1.5} strokeLinecap="round" />
      <ellipse cx="9" cy="9" rx="2.4" ry="0.9" {...HL} />
    </>
  ),
  flowers: (
    <>
      <path d="M8 21l2-8M16 21l-2-8M12 21v-9" stroke="#3e9a55" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="8" cy="9" r="3.2" fill="#ff8fb1" {...S} />
      <circle cx="16" cy="9" r="3.2" fill="#ffd34d" {...S} />
      <circle cx="12" cy="6" r="3.2" fill="#c084fc" {...S} />
      <circle cx="8" cy="9" r="1" fill="#fff" />
      <circle cx="16" cy="9" r="1" fill="#fff" />
      <circle cx="12" cy="6" r="1" fill="#fff" />
    </>
  ),
  berries: (
    <>
      <path d="M12 4c1.5 1 2 2 2 3" stroke="#3e9a55" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d="M12 6c2-1.5 4.5-1 5 .5-2 .8-3.5.5-5-.5z" fill="#5fb84a" {...S} />
      <circle cx="9" cy="12" r="3.6" fill="#7b3fa0" {...S} />
      <circle cx="15" cy="12" r="3.6" fill="#d64f7a" {...S} />
      <circle cx="12" cy="17" r="3.6" fill="#c0304d" {...S} />
      <circle cx="8" cy="11" r="0.9" fill="#fff" opacity={0.7} />
      <circle cx="14" cy="11" r="0.9" fill="#fff" opacity={0.7} />
      <circle cx="11" cy="16" r="0.9" fill="#fff" opacity={0.7} />
    </>
  ),
  vegetables: (
    <>
      <path d="M13 9l-8.5 11 2.5.5L16 12z" fill="#f07a2a" {...S} />
      <path d="M14 10c0-3 1-5 3-6M15 11c2-1 4-1 5.5 0M14.5 10.5c1.5-2 3.5-2.5 5-2" stroke="#3e9a55" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M8 15l1.5 1M10 12.5l1.5 1" stroke="#c45a14" strokeWidth={1.2} strokeLinecap="round" />
    </>
  ),
  breakfast: (
    <>
      <ellipse cx="12" cy="16" rx="9" ry="3.5" fill="#fffaf0" {...S} />
      <rect x="5" y="10" width="7" height="5.5" rx="1.5" fill="#e3a35a" {...S} />
      <path d="M13 10.5h5v3a3 3 0 0 1-3 3h0a2 2 0 0 1-2-2z" fill="#fffaf0" {...S} />
      <ellipse cx="15.5" cy="10.7" rx="2.5" ry="0.8" fill="#8a5a37" />
    </>
  ),
  pie: (
    <>
      <path d="M3 13h18l-2 5H5z" fill="#d9a066" {...S} />
      <path d="M3 13c1-4 5-6 9-6s8 2 9 6z" fill="#e8b878" {...S} />
      <path d="M7 11l3-2M11 11l3-2.5M15 11l2-1.5" stroke="#a8693a" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx="9" cy="12.5" r="1" fill="#c0304d" />
      <circle cx="14" cy="12.5" r="1" fill="#7b3fa0" />
    </>
  ),
  bouquet: (
    <>
      <path d="M8 13l4 9 4-9z" fill="#cdebd8" {...S} />
      <circle cx="9" cy="9" r="2.8" fill="#ff8fb1" {...S} />
      <circle cx="15" cy="9" r="2.8" fill="#ff6f91" {...S} />
      <circle cx="12" cy="6" r="2.8" fill="#ffd34d" {...S} />
      <circle cx="12" cy="11" r="2.4" fill="#c084fc" {...S} />
      <path d="M10.5 16.5l3 0" stroke="#d64f7a" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  crown: (
    <>
      <ellipse cx="12" cy="14" rx="8.5" ry="4" fill="none" stroke="#5fb84a" strokeWidth={2.6} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={12 + Math.cos((i / 6) * Math.PI * 2) * 8.5} cy={14 + Math.sin((i / 6) * Math.PI * 2) * 4} r={2.3} fill={['#ff8fb1', '#ffd34d', '#c084fc', '#ff8a5b', '#fff', '#ff6f91'][i]} {...S} />
      ))}
    </>
  ),
  planks: (
    <>
      <rect x="3" y="13" width="18" height="4" rx="1" fill="#c98c55" {...S} transform="rotate(-8 12 15)" />
      <rect x="3" y="8" width="18" height="4" rx="1" fill="#dba26a" {...S} transform="rotate(6 12 10)" />
      <circle cx="7" cy="9.6" r="0.7" fill="#8a5a37" />
      <circle cx="17" cy="15" r="0.7" fill="#8a5a37" />
    </>
  ),
  bricks: (
    <>
      <rect x="3" y="12.5" width="8.5" height="5" rx="1" fill="#c85a46" {...S} />
      <rect x="12.5" y="12.5" width="8.5" height="5" rx="1" fill="#d9673f" {...S} />
      <rect x="7.5" y="6.5" width="9" height="5" rx="1" fill="#e07a5a" {...S} />
    </>
  ),
  chair: (
    <>
      <rect x="6" y="3.5" width="12" height="8" rx="2" fill="#c98c55" {...S} />
      <rect x="5" y="11.5" width="14" height="3" rx="1" fill="#dba26a" {...S} />
      <path d="M6.5 14.5V21M17.5 14.5V21" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
    </>
  ),
  basket: (
    <>
      <path d="M7 10a5 5 0 0 1 10 0" fill="none" stroke="#8a5a37" strokeWidth={2} />
      <circle cx="9" cy="10" r="2.3" fill="#ec5a4a" {...S} />
      <circle cx="13" cy="9" r="2.3" fill="#8fd16a" {...S} />
      <circle cx="16" cy="10.5" r="2" fill="#f07a2a" {...S} />
      <path d="M3.5 11h17l-2 9h-13z" fill="#d9a066" {...S} />
      <path d="M5 14.5h14M6 17.5h12" stroke="#a8693a" strokeWidth={1.2} />
    </>
  ),
  jam: (
    <>
      <rect x="6" y="8" width="12" height="13" rx="3" fill="#c0304d" {...S} />
      <rect x="5.5" y="4.5" width="13" height="4" rx="1.2" fill="#ec7d61" {...S} />
      <rect x="8.5" y="12" width="7" height="5" rx="1" fill="#fffaf0" {...S} />
      <path d="M8 9.5v3" stroke="#fff" strokeWidth={1.4} opacity={0.5} strokeLinecap="round" />
    </>
  ),
};

/** Map item ids to icon names. */
const ALIAS: Record<string, string> = { furniture: 'chair', veggie_basket: 'basket', berry_pie: 'pie', flower_crown: 'crown', coins: 'coin', gems: 'gem' };

export function Icon({ name, size = 24, style, title }: { name: string; size?: number; style?: CSSProperties; title?: string }) {
  const icon = ICONS[ALIAS[name] ?? name] ?? ICONS.star;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none', display: 'block', ...style }} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {icon}
    </svg>
  );
}

export const hasIcon = (n: string) => !!ICONS[ALIAS[n] ?? n];
