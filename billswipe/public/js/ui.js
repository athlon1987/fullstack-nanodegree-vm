// Small DOM toolkit. Everything user-supplied goes through text nodes — never innerHTML.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v; // trusted static markup only (icons)
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const svg = (body, vb = '0 0 24 24') =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  logo: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#1f1f26"/><rect x="14" y="16" width="28" height="36" rx="5" fill="none" stroke="#f4f4f5" stroke-width="4" transform="rotate(-8 28 34)"/><path d="M33 33l6 6 13-14" fill="none" stroke="#3ee08f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  x: svg('<path d="M18 6 6 18M6 6l12 12" stroke-width="2.6"/>'),
  check: svg('<path d="M20 6 9 17l-5-5" stroke-width="2.6"/>'),
  undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
  camera: svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  stack: svg('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 3V1.5M16 3V1.5" opacity="0"/><path d="m9 12 2 2 4-4"/>'),
  heart: svg('<path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9z"/>'),
  receipt: svg('<path d="M5 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2z"/><path d="M9 9h6M9 13h6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  chevronLeft: svg('<path d="m15 18-6-6 6-6"/>'),
  medical: svg('<path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9z"/><path d="M12 10v5M9.5 12.5h5"/>'),
  rent: svg('<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  utilities: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  car: svg('<path d="M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 17v-5l2-5h14l2 5v5"/><path d="M3 12h18"/>'),
  education: svg('<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'),
  childcare: svg('<circle cx="12" cy="7" r="3"/><path d="M8 21v-5l-2-3 3-2h6l3 2-2 3v5"/>'),
  pet: svg('<circle cx="5" cy="10" r="2"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="19" cy="10" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4-2z"/>'),
  other: svg('<path d="M5 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2z"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>'),
};

export const icon = (name) => h('span', { class: 'ico', html: icons[name], 'aria-hidden': 'true' }).firstChild;

export const CATEGORY_LABELS = {
  medical: 'Medical', rent: 'Rent', utilities: 'Utilities', car: 'Car repair',
  education: 'Education', childcare: 'Childcare', pet: 'Vet', other: 'Other',
};

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
export const money = (cents) => usd.format(cents / 100);
export const moneyWhole = (cents) => usdWhole.format(Math.round(cents / 100));
export const moneyCompact = (cents) => (cents >= 1_000_000 ? compact.format(cents / 100) : moneyWhole(cents));

export function dueLabel(iso) {
  if (!iso) return { text: 'No due date', urgent: false };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(`${iso}T00:00:00`);
  const days = Math.round((due - today) / 86_400_000);
  if (days < 0) return { text: `${-days}d overdue`, urgent: true };
  if (days === 0) return { text: 'Due today', urgent: true };
  if (days === 1) return { text: 'Due tomorrow', urgent: true };
  return { text: `Due in ${days} days`, urgent: days <= 3 };
}

export const timeAgo = (ms) => {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
  const hr = Math.round(m / 60); if (hr < 24) return `${hr}h ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function announce(text) {
  const el = document.getElementById('announcer');
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = text; });
}

export function toast(message, { type = 'info', action, timeout = 4000, ring } = {}) {
  const host = document.getElementById('toasts');
  const children = [];
  let ringEl;
  if (ring) {
    ringEl = h('span', {
      html: '<svg class="ring" viewBox="0 0 26 26"><circle class="track" cx="13" cy="13" r="10"/><circle class="prog" cx="13" cy="13" r="10" stroke-dasharray="62.83" stroke-dashoffset="0"/></svg>',
    });
    children.push(ringEl);
  }
  const msg = h('span', { class: 'msg' }, message);
  children.push(msg);
  if (action) children.push(h('button', { class: 'btn sm light', onclick: () => { action.run(); dismiss(); } }, action.label));
  const el = h('div', { class: `toast ${type}`, role: type === 'error' ? 'alert' : 'status' }, children);
  host.append(el);

  let timer;
  const dismiss = () => { clearTimeout(timer); el.remove(); };
  if (timeout) timer = setTimeout(dismiss, timeout);
  if (ringEl && timeout) {
    const prog = ringEl.querySelector('.prog');
    prog.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 62.83 }], { duration: timeout, easing: 'linear', fill: 'forwards' });
  }
  return { dismiss, setMessage: (t) => { msg.textContent = t; } };
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A short, cheap confetti burst on a throwaway canvas. */
export function confetti() {
  if (reducedMotion()) return;
  const c = h('canvas', { class: 'confetti', 'aria-hidden': 'true' });
  document.body.append(c);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#3ee08f', '#f4f4f5', '#ffc24d', '#7aa7ff', '#ff7a90'];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.42,
    vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 4,
    w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const start = performance.now();
  (function frame(t) {
    const life = (t - start) / 1600;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.42; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - life); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (life < 1) requestAnimationFrame(frame); else c.remove();
  })(start);
}

export const vibrate = (pattern) => { try { navigator.vibrate?.(pattern); } catch { /* unsupported */ } };
