import { api, payWithRetry } from './api.js';
import {
  h, icon, money, dueLabel, CATEGORY_LABELS, toast, announce, confetti, vibrate, reducedMotion,
} from './ui.js';

const UNDO_WINDOW_MS = 3500;
const VISIBLE = 3;

function amountEl(cents) {
  const [dollars, c] = money(cents).split('.');
  return h('div', { class: 'amount' }, dollars, h('span', { class: 'cents' }, `.${c}`));
}

function cardEl(bill) {
  const due = dueLabel(bill.dueDate);
  return h('article', {
    class: 'card',
    dataset: { cat: bill.category, id: bill.id },
    'aria-label': `${bill.title}, ${money(bill.amountCents)} to ${bill.billerName}`,
  },
    h('div', { class: 'stamp pay', 'aria-hidden': 'true' }, 'PAY'),
    h('div', { class: 'stamp pass', 'aria-hidden': 'true' }, 'PASS'),
    h('div', { class: 'top' },
      h('span', { class: 'cat' }, icon(bill.category), CATEGORY_LABELS[bill.category] ?? bill.category),
      h('span', { class: `due${due.urgent ? ' urgent' : ''}` }, due.text)),
    amountEl(bill.amountCents),
    h('h2', {}, bill.title),
    h('p', { class: 'payee' }, `to ${bill.billerName}`),
    h('p', { class: 'story' }, bill.story),
    h('div', { class: 'foot' },
      h('div', { class: 'who' },
        h('span', { class: 'avatar', 'aria-hidden': 'true' }, bill.requester.firstName.slice(0, 1)),
        h('span', {}, bill.requester.firstName, h('small', {}, bill.requester.city || ''))),
      h('span', { class: 'verified', title: 'Reviewed by our team. Money goes straight to the biller.' },
        icon('shield'), 'Verified')),
  );
}

export function mountSwipe(root, { onPaid }) {
  const queue = [];
  const seen = new Set();
  let lastPass = null;
  let pending = null;
  let fetching = false;
  let exhausted = false;
  let alive = true;

  const deck = h('div', { class: 'deck', role: 'region', 'aria-label': 'Bills to review' });
  const passBtn = h('button', { class: 'act pass', 'aria-label': 'Pass on this bill', onclick: () => swipeTop(-1) }, icon('x'));
  const undoBtn = h('button', { class: 'act undo', 'aria-label': 'Undo', onclick: undo, disabled: true }, icon('undo'));
  const payBtn = h('button', { class: 'act pay', 'aria-label': 'Pay this bill', onclick: () => swipeTop(1) }, icon('check'));
  const actions = h('div', { class: 'actions' }, passBtn, undoBtn, payBtn);
  const hint = h('p', { class: 'hint' }, 'Swipe right to pay, left to pass · ', h('kbd', {}, '←'), ' ', h('kbd', {}, '→'), ' ', h('kbd', {}, 'Z'), ' undo');
  root.append(h('div', { class: 'deck-wrap' }, deck, actions, hint));

  // ---------- rendering ----------
  function layout() {
    for (const el of [...deck.children]) if (!el.classList.contains('flying')) el.remove();
    const shown = queue.slice(0, VISIBLE);
    // Bottom of the stack first so the top card is last in the DOM (and on top).
    for (let i = shown.length - 1; i >= 0; i--) {
      const el = cardEl(shown[i]);
      el.dataset.depth = String(i);
      if (i === 0) attachDrag(el, shown[i]);
      else el.setAttribute('aria-hidden', 'true');
      deck.append(el);
    }
    if (!shown.length) deck.append(emptyEl());
    const hasTop = shown.length > 0;
    passBtn.disabled = payBtn.disabled = !hasTop;
    undoBtn.disabled = !(pending || lastPass);
  }

  function emptyEl() {
    if (fetching || !exhausted) return h('div', { class: 'empty' }, h('div', { class: 'spinner' }));
    return h('div', { class: 'empty' },
      h('div', { class: 'big', 'aria-hidden': 'true' }, '🌤'),
      h('h2', {}, 'You’re all caught up'),
      h('p', {}, 'Every verified bill has been seen. New ones arrive throughout the day.'),
      h('p', {}, h('button', { class: 'btn ghost sm', onclick: () => { exhausted = false; refill(true); } }, 'Check again')));
  }

  const topEl = () => deck.querySelector('.card[data-depth="0"]:not(.flying)');
  const nextEl = () => deck.querySelector('.card[data-depth="1"]');

  // ---------- data ----------
  async function refill(force = false) {
    if (fetching || (exhausted && !force) || !alive) return;
    fetching = true;
    if (!queue.length) layout();
    try {
      const { bills } = await api.feed(20);
      const fresh = bills.filter((b) => !seen.has(b.id));
      fresh.forEach((b) => seen.add(b.id));
      queue.push(...fresh);
      exhausted = fresh.length === 0;
    } catch (e) {
      toast(e.message, { type: 'error' });
      exhausted = true;
    } finally {
      fetching = false;
      if (alive) layout();
    }
  }

  // ---------- gestures ----------
  function attachDrag(el, bill) {
    let start = null;
    let samples = [];
    const payStamp = el.querySelector('.stamp.pay');
    const passStamp = el.querySelector('.stamp.pass');

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      el.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY };
      samples = [{ x: e.clientX, t: e.timeStamp }];
      el.style.transition = 'none';
    });

    el.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = (e.clientY - start.y) * 0.35;
      samples.push({ x: e.clientX, t: e.timeStamp });
      if (samples.length > 5) samples.shift();
      paintDrag(el, dx, dy, payStamp, passStamp);
    });

    const end = (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = (e.clientY - start.y) * 0.35;
      const first = samples[0];
      const vx = first && e.timeStamp > first.t ? (e.clientX - first.x) / (e.timeStamp - first.t) : 0;
      start = null;
      const threshold = Math.min(deck.clientWidth * 0.28, 140);
      if (dx > threshold || (vx > 0.55 && dx > 30)) commit(el, bill, 1, dy);
      else if (dx < -threshold || (vx < -0.55 && dx < -30)) commit(el, bill, -1, dy);
      else springBack(el, payStamp, passStamp);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', () => { if (start) { start = null; springBack(el, payStamp, passStamp); } });
  }

  function paintDrag(el, dx, dy, payStamp, passStamp) {
    const rot = reducedMotion() ? 0 : dx * 0.06;
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    payStamp.style.opacity = String(Math.max(0, Math.min(1, dx / 90)));
    passStamp.style.opacity = String(Math.max(0, Math.min(1, -dx / 90)));
    const n = nextEl();
    if (n) {
      const p = Math.min(Math.abs(dx) / 140, 1);
      n.style.transition = 'none';
      n.style.transform = `translateY(${14 - 14 * p}px) scale(${0.95 + 0.05 * p})`;
      n.style.filter = `brightness(${0.7 + 0.3 * p})`;
    }
  }

  function springBack(el, payStamp, passStamp) {
    el.style.transition = 'transform .4s cubic-bezier(.2, 1.5, .4, 1)';
    el.style.transform = '';
    payStamp.style.opacity = passStamp.style.opacity = '0';
    const n = nextEl();
    if (n) { n.style.transition = 'transform .3s ease, filter .3s ease'; n.style.transform = ''; n.style.filter = ''; }
  }

  function flyOut(el, dir, dy = 0) {
    el.classList.add('flying');
    el.removeAttribute('data-depth');
    el.style.pointerEvents = 'none';
    el.style.zIndex = '5';
    el.querySelector(dir > 0 ? '.stamp.pay' : '.stamp.pass').style.opacity = '1';
    const w = deck.clientWidth;
    el.style.transition = 'transform .34s cubic-bezier(.3, .7, .4, 1), opacity .34s ease';
    requestAnimationFrame(() => {
      el.style.transform = `translate(${dir * w * 1.5}px, ${dy + 40}px) rotate(${reducedMotion() ? 0 : dir * 28}deg)`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 380);
  }

  /** Button / keyboard swipe. */
  function swipeTop(dir) {
    const el = topEl();
    if (!el || !queue.length) return;
    commit(el, queue[0], dir, 0);
  }

  function commit(el, bill, dir, dy) {
    const idx = queue.indexOf(bill);
    if (idx === -1) return;
    queue.splice(idx, 1);
    flyOut(el, dir, dy);
    vibrate(dir > 0 ? [12, 40, 18] : 8);
    if (dir > 0) startPay(bill); else doPass(bill);
    layout();
    if (queue.length < 4) refill();
  }

  // ---------- pass / undo ----------
  async function doPass(bill) {
    lastPass = bill;
    announce(`Passed on ${bill.title}`);
    try {
      await api.pass(bill.id);
    } catch (e) {
      if (e.status !== 404) { toast(e.message, { type: 'error' }); restore(bill); }
    }
  }

  function restore(bill) {
    if (!queue.includes(bill)) queue.unshift(bill);
    layout();
    const el = topEl();
    if (el && !reducedMotion()) el.animate(
      [{ transform: 'translateX(-30px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 260, easing: 'cubic-bezier(.2, 1.3, .4, 1)' });
  }

  async function undo() {
    if (pending) return cancelPending();
    if (!lastPass) return;
    const bill = lastPass;
    lastPass = null;
    layout();
    try {
      const res = await api.undoPass(bill.id);
      if (res.bill) restore(res.bill.id === bill.id ? bill : res.bill);
      else toast('That bill was already paid by another patron.');
    } catch (e) {
      toast(e.message, { type: 'error' });
    }
  }

  // ---------- pay ----------
  function startPay(bill) {
    if (pending) flushPending();
    const key = crypto.randomUUID().replace(/-/g, '');
    const t = toast(`Paying ${money(bill.amountCents)} to ${bill.billerName}`, {
      ring: true, timeout: UNDO_WINDOW_MS,
      action: { label: 'Undo', run: () => cancelPending() },
    });
    pending = { bill, key, toast: t, timer: setTimeout(flushPending, UNDO_WINDOW_MS) };
    lastPass = null;
    announce(`Paying ${money(bill.amountCents)}. Undo available for a few seconds.`);
    layout();
  }

  function cancelPending() {
    if (!pending) return;
    const { bill, timer, toast: t } = pending;
    clearTimeout(timer);
    t.dismiss();
    pending = null;
    restore(bill);
    announce('Payment cancelled');
  }

  async function flushPending() {
    if (!pending) return;
    const { bill, key, timer, toast: t } = pending;
    clearTimeout(timer);
    t.dismiss();
    pending = null;
    if (alive) layout();
    try {
      const res = await payWithRetry(bill.id, key);
      if (res.status === 'processing' || res.status === 202) {
        toast('Payment is processing. It will show in Given once it settles.');
        return;
      }
      onPaid?.(res.amountCents);
      if (alive) celebrate(bill, res);
    } catch (e) {
      if (e.code === 'already_paid') {
        toast(`Another patron just cleared “${bill.title}”. Nice instincts.`);
      } else {
        toast(`${e.message}. The bill is back in your deck.`, { type: 'error', timeout: 6000 });
        if (alive) restore(bill);
      }
    }
  }

  function celebrate(bill, res) {
    vibrate([20, 60, 30]);
    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey, true); };
    const onKey = (e) => { e.stopPropagation(); e.preventDefault(); close(); };
    const overlay = h('div', { class: 'cleared', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Bill cleared', onclick: close },
      h('div', { class: 'inner' },
        h('div', { class: 'check' }, icon('check')),
        h('h2', {}, 'Bill cleared'),
        h('p', {}, `${money(res.amountCents)} sent directly to ${bill.billerName}.`),
        h('p', {}, `${bill.requester.firstName}${bill.requester.city ? ` in ${bill.requester.city}` : ''} no longer owes it.`),
        h('p', { class: 'ref' }, `Ref ${res.providerRef}`)));
    document.body.append(overlay);
    document.addEventListener('keydown', onKey, true);
    confetti();
    setTimeout(close, 2600);
  }

  // ---------- keyboard ----------
  function onKey(e) {
    if (e.target.closest?.('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); swipeTop(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); swipeTop(-1); }
    else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); undo(); }
  }
  document.addEventListener('keydown', onKey);

  layout();
  refill();

  return function unmount() {
    alive = false;
    document.removeEventListener('keydown', onKey);
    // Leaving the screen confirms an in-flight payment rather than silently dropping it.
    flushPending();
  };
}
