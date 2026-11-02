import { api } from './api.js';
import { mountSwipe } from './deck.js';
import { createRedactor } from './redact.js';
import {
  h, icon, icons, money, moneyCompact, dueLabel, timeAgo, CATEGORY_LABELS, toast, announce,
} from './ui.js';

const DEMO = { password: 'swipe-right-2026', patron: 'patron@billswipe.test', requester: 'requester@billswipe.test', admin: 'admin@billswipe.test' };
const main = document.getElementById('main');
const topbar = document.getElementById('topbar');
const tabbar = document.getElementById('tabbar');

const state = { user: null, given: null };
let unmount = null;

const HOME = { patron: '#/swipe', requester: '#/bills', admin: '#/review' };
const TABS = {
  patron: [['#/swipe', 'Swipe', 'stack'], ['#/given', 'Given', 'heart'], ['#/account', 'Account', 'user']],
  requester: [['#/bills', 'My bills', 'receipt'], ['#/new', 'New bill', 'plus'], ['#/account', 'Account', 'user']],
  admin: [['#/review', 'Review', 'inbox'], ['#/account', 'Account', 'user']],
};

const ROUTES = {
  '#/': { view: landing, guest: true },
  '#/signin': { view: signin, guest: true },
  '#/join': { view: join, guest: true },
  '#/swipe': { view: swipe, role: 'patron' },
  '#/given': { view: given, role: 'patron' },
  '#/bills': { view: myBills, role: 'requester' },
  '#/new': { view: newBill, role: 'requester' },
  '#/review': { view: review, role: 'admin' },
  '#/account': { view: account, role: 'any' },
};

// ---------- shell ----------
function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}

function parseHash() {
  const raw = location.hash || '#/';
  const [path, query = ''] = raw.split('?');
  return { path, params: new URLSearchParams(query) };
}

async function render() {
  const { path, params } = parseHash();
  const route = ROUTES[path] ?? ROUTES['#/'];
  if (route.guest && state.user) return go(HOME[state.user.role]);
  if (route.role && !state.user) return go(`#/signin?next=${encodeURIComponent(path)}`);
  if (route.role && route.role !== 'any' && route.role !== state.user.role) return go(HOME[state.user.role]);

  unmount?.();
  unmount = null;
  main.replaceChildren();
  main.classList.toggle('bare', !state.user);
  renderChrome(path);
  window.scrollTo(0, 0);
  try {
    unmount = (await route.view(main, params)) || null;
  } catch (e) {
    main.replaceChildren(h('div', { class: 'blank' }, h('h2', {}, 'Something went wrong'), h('p', {}, e.message),
      h('button', { class: 'btn ghost', onclick: render }, 'Try again')));
  }
}

function renderChrome(path) {
  const u = state.user;
  topbar.hidden = false;
  const right = [];
  if (u?.role === 'patron') {
    const pill = h('a', { class: 'pill', href: '#/given', id: 'given-pill' });
    paintGiven(pill);
    right.push(pill);
  } else if (!u) {
    right.push(h('a', { class: 'pill', href: '#/signin' }, 'Sign in'));
  }
  topbar.replaceChildren(
    h('a', { class: 'brand', href: u ? HOME[u.role] : '#/', html: icons.logo }, ),
    ...right);
  topbar.firstChild.append('BillSwipe');

  tabbar.hidden = !u;
  if (!u) return;
  tabbar.replaceChildren(h('div', { class: 'tabs' }, TABS[u.role].map(([href, label, ic]) =>
    h('a', { href, 'aria-current': path === href ? 'page' : false }, icon(ic), label))));
}

function paintGiven(pill = document.getElementById('given-pill')) {
  if (!pill) return;
  if (!state.given) {
    api.history().then((r) => { state.given = { totalCents: r.totalCents, count: r.count }; paintGiven(); }).catch(() => {});
    pill.replaceChildren('Given ', h('strong', {}, '—'));
    return;
  }
  pill.replaceChildren('Given ', h('strong', {}, moneyCompact(state.given.totalCents)));
  pill.setAttribute('aria-label', `You have given ${money(state.given.totalCents)} across ${state.given.count} bills`);
}

function setUser(user) {
  state.user = user;
  state.given = null;
}

// ---------- shared bits ----------
function formError() {
  const el = h('div', { class: 'form-error', role: 'alert', hidden: true });
  return { el, show: (m) => { el.textContent = m; el.hidden = false; el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, hide: () => { el.hidden = true; } };
}

function field(label, input, help) {
  return h('label', { class: 'field' }, h('span', {}, label), input, help ? h('small', {}, help) : null);
}

function busy(btn, on, text) {
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = text; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label ?? btn.textContent; btn.disabled = false; }
}

const statusLabel = { pending_review: 'In review', open: 'Live', paying: 'Paying', paid: 'Paid', rejected: 'Not approved', withdrawn: 'Withdrawn' };

// ---------- views ----------
async function landing(root) {
  const statsRow = h('div', { class: 'stats', 'aria-label': 'Live totals' },
    ['Bills cleared', 'Paid to billers', 'Waiting now'].map((l) => h('div', { class: 'stat' }, h('b', {}, '—'), h('span', {}, l))));
  const demoBox = h('div', { class: 'demo', hidden: true },
    h('p', {}, 'Demo build — try it instantly as:'),
    h('div', { class: 'chips' },
      [['patron', 'A patron'], ['requester', 'Someone with a bill'], ['admin', 'The review team']].map(([role, label]) =>
        h('button', { class: 'chip', type: 'button', onclick: () => demoLogin(role) }, label))));

  root.append(
    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, 'Bills, meet benefactors'),
      h('h1', {}, 'Upload a bill.', h('br'), 'A patron swipes right.', h('br'), h('em', {}, 'The biller gets paid.')),
      h('p', { class: 'lede' }, 'Real, verified bills from real people — matched with people who can afford to make them disappear. Money goes straight to the hospital, landlord or utility. Never through anyone’s pocket.'),
      h('div', { class: 'cta-stack' },
        h('a', { class: 'btn primary block', href: '#/join?role=patron' }, 'I want to pay bills'),
        h('a', { class: 'btn light block', href: '#/join?role=requester' }, 'I need help with a bill'))),
    statsRow,
    h('ol', { class: 'how' },
      [['Upload & redact', 'Snap the bill, black out anything private, tell your story in a few lines.'],
        ['We verify it', 'Our team confirms the bill is real before any patron can see it.'],
        ['Swipe right, it’s gone', 'A patron pays the biller directly. You get notified. That’s it.']]
        .map(([t, d], i) => h('li', {}, h('span', { class: 'n' }, i + 1), h('div', {}, h('h3', {}, t), h('p', {}, d))))),
    demoBox,
    h('p', { class: 'fine' }, 'Payments in this build are simulated — no real money moves.'));

  try {
    const s = await api.stats();
    const vals = [s.billsCleared.toLocaleString(), moneyCompact(s.totalPaidCents), moneyCompact(s.openCents)];
    statsRow.querySelectorAll('b').forEach((b, i) => { b.textContent = vals[i]; });
    demoBox.hidden = !s.demo;
  } catch { /* stats are decorative */ }
}

async function demoLogin(role) {
  try {
    const { user } = await api.login(DEMO[role], DEMO.password);
    setUser(user);
    go(HOME[user.role]);
  } catch (e) {
    toast(e.message, { type: 'error' });
  }
}

function signin(root, params) {
  const err = formError();
  const email = h('input', { class: 'input', type: 'email', autocomplete: 'email', required: true, inputmode: 'email' });
  const password = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', required: true });
  const submit = h('button', { class: 'btn light block', type: 'submit' }, 'Sign in');
  const form = h('form', { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    err.hide();
    busy(submit, true, 'Signing in…');
    try {
      const { user } = await api.login(email.value, password.value);
      setUser(user);
      const next = params.get('next');
      go(next && ROUTES[next] ? next : HOME[user.role]);
    } catch (x) {
      err.show(x.message);
      busy(submit, false);
    }
  } }, err.el, field('Email', email), field('Password', password), submit);

  root.append(
    h('div', { class: 'page-h' }, h('h1', {}, 'Welcome back'), h('p', {}, 'Sign in to keep swiping — or to check on your bills.')),
    form,
    h('p', { class: 'fine' }, 'New here? ', h('a', { href: '#/join' }, 'Create an account')));
  email.focus();
}

function join(root, params) {
  let role = params.get('role') === 'requester' ? 'requester' : 'patron';
  const err = formError();
  const heading = h('h1');
  const sub = h('p');
  const name = h('input', { class: 'input', autocomplete: 'name', required: true, maxlength: 60 });
  const email = h('input', { class: 'input', type: 'email', autocomplete: 'email', required: true, inputmode: 'email' });
  const city = h('input', { class: 'input', autocomplete: 'address-level2', placeholder: 'e.g. Austin, TX', maxlength: 60 });
  const password = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', required: true, minlength: 10 });
  const submit = h('button', { class: 'btn primary block', type: 'submit' });
  const nameHelp = h('small');

  const seg = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Account type' });
  const segBtn = (r, label) => h('button', { type: 'button', 'aria-pressed': String(role === r), onclick: () => { role = r; paint(); } }, label);
  function paint() {
    seg.replaceChildren(segBtn('patron', 'I want to pay bills'), segBtn('requester', 'I need help'));
    heading.textContent = role === 'patron' ? 'Become a patron' : 'Get help with a bill';
    sub.textContent = role === 'patron'
      ? 'Swipe through verified bills. Pay the ones that move you. Every dollar goes to the biller.'
      : 'Patrons only ever see your first name and city — never your account numbers or documents.';
    submit.textContent = role === 'patron' ? 'Start swiping' : 'Continue';
    submit.className = `btn ${role === 'patron' ? 'primary' : 'light'} block`;
    nameHelp.textContent = role === 'requester' ? 'Patrons see your first name only.' : '';
  }
  paint();

  const form = h('form', { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    err.hide();
    if (password.value.length < 10) return err.show('Password must be at least 10 characters.');
    busy(submit, true, 'Creating account…');
    try {
      const { user } = await api.signup({ name: name.value, email: email.value, city: city.value || null, password: password.value, role });
      setUser(user);
      go(role === 'requester' ? '#/new' : HOME[user.role]);
    } catch (x) {
      err.show(x.message);
      busy(submit, false);
    }
  } },
  seg, err.el,
  h('label', { class: 'field' }, h('span', {}, 'Full name'), name, nameHelp),
  field('Email', email),
  field('City (optional)', city),
  field('Password', password, 'At least 10 characters.'),
  submit);

  root.append(h('div', { class: 'page-h' }, heading, sub), form,
    h('p', { class: 'fine' }, 'Already have an account? ', h('a', { href: '#/signin' }, 'Sign in')));
}

function swipe(root) {
  return mountSwipe(root, {
    onPaid: (cents) => {
      if (state.given) { state.given.totalCents += cents; state.given.count += 1; }
      paintGiven();
    },
  });
}

async function given(root) {
  root.append(h('div', { class: 'spinner' }));
  const r = await api.history();
  state.given = { totalCents: r.totalCents, count: r.count };
  paintGiven();
  root.replaceChildren(
    h('div', { class: 'page-h' }, h('h1', {}, 'Given')),
    h('div', { class: 'big-total' }, h('b', {}, money(r.totalCents)),
      h('span', {}, `across ${r.count} bill${r.count === 1 ? '' : 's'}, paid directly to billers`)),
    r.payments.length
      ? h('ul', { class: 'list' }, r.payments.map((p) => h('li', { class: 'item', dataset: { cat: p.category } },
        h('div', { class: 'line1' }, h('h3', {}, p.title), h('span', { class: 'amt' }, money(p.amountCents))),
        h('div', { class: 'meta' },
          h('span', {}, `to ${p.billerName}`),
          h('span', {}, `for ${p.requester.firstName}${p.requester.city ? `, ${p.requester.city}` : ''}`),
          h('span', {}, timeAgo(p.paidAt))))))
      : h('div', { class: 'blank' }, h('div', { class: 'big' }, '💸'), h('h2', {}, 'Nothing yet'),
        h('p', {}, 'Your first right swipe will show up here.'),
        h('a', { class: 'btn primary', href: '#/swipe' }, 'Start swiping')));
}

async function myBills(root) {
  root.append(h('div', { class: 'spinner' }));
  const { bills } = await api.myBills();
  const list = h('ul', { class: 'list' });

  function item(b) {
    const due = dueLabel(b.dueDate);
    const note = {
      pending_review: 'We’re confirming this bill with the biller. Most reviews finish within a day.',
      open: 'Live — patrons can see it now. You’ll see it flip to Paid the moment someone swipes right.',
      paid: `Paid ${timeAgo(b.paidAt)} by a patron, directly to ${b.billerName}. You don’t owe this anymore.`,
      rejected: b.rejectReason ? `Not approved: ${b.rejectReason}` : 'Not approved.',
    }[b.status];
    const actions = [];
    if (b.status === 'pending_review' || b.status === 'open') {
      actions.push(h('button', { class: 'btn sm danger', onclick: async (e) => {
        if (!confirm('Withdraw this bill? Patrons will no longer see it.')) return;
        e.target.disabled = true;
        try { const r = await api.withdraw(b.id); li.replaceWith(item(r.bill)); toast('Bill withdrawn.'); }
        catch (x) { toast(x.message, { type: 'error' }); e.target.disabled = false; }
      } }, 'Withdraw'));
    }
    if (b.hasImage) actions.push(h('a', { class: 'btn sm ghost', href: `/api/bills/${b.id}/image`, target: '_blank', rel: 'noopener' }, 'View photo'));
    const li = h('li', { class: 'item', dataset: { cat: b.category } },
      h('div', { class: 'line1' }, h('h3', {}, b.title), h('span', { class: 'amt' }, money(b.amountCents))),
      h('div', { class: 'meta' },
        h('span', { class: `status ${b.status}` }, statusLabel[b.status] ?? b.status),
        h('span', {}, `${b.billerName} ···${b.billerAccountLast4}`),
        b.status === 'open' || b.status === 'pending_review' ? h('span', {}, due.text) : null),
      note ? h('div', { class: 'note' }, note) : null,
      actions.length ? h('div', { class: 'actions-row' }, actions) : null);
    return li;
  }

  bills.forEach((b) => list.append(item(b)));
  root.replaceChildren(
    h('div', { class: 'page-h' }, h('h1', {}, 'My bills'), h('p', {}, 'Up to 3 active bills at a time.')),
    bills.length ? list : h('div', { class: 'blank' }, h('div', { class: 'big' }, '🧾'), h('h2', {}, 'No bills yet'),
      h('p', {}, 'Upload a bill and our team will verify it, usually within a day.'),
      h('a', { class: 'btn light', href: '#/new' }, 'Upload a bill')),
    bills.length ? h('p', {}, h('a', { class: 'btn ghost block', href: '#/new' }, icon('plus'), 'Upload another bill')) : null);
}

function newBill(root) {
  const err = formError();
  let redactor = null;
  let category = null;

  // --- photo ---
  const fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/heic,image/*', class: 'sr-only', id: 'bill-photo' });
  const photoSlot = h('div');
  const dropLabel = h('label', { class: 'drop', for: 'bill-photo' },
    icon('camera'), h('strong', {}, 'Add a photo of the bill'), h('span', {}, 'Take a picture or choose one. You can black out private details next.'));
  photoSlot.append(dropLabel);
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    try {
      redactor = await createRedactor(f);
      photoSlot.replaceChildren(redactor.el,
        h('p', { class: 'fine' }, h('button', { type: 'button', class: 'linkish', onclick: () => fileInput.click() }, 'Use a different photo')));
    } catch {
      toast('Couldn’t open that image. Try a JPEG or PNG.', { type: 'error' });
    }
    fileInput.value = '';
  });

  // --- details ---
  const amount = h('input', { class: 'input', inputmode: 'decimal', placeholder: '0.00', autocomplete: 'off', 'aria-label': 'Amount due in dollars' });
  const biller = h('input', { class: 'input', placeholder: 'e.g. City Gas & Electric', maxlength: 80 });
  const acct = h('input', { class: 'input', placeholder: 'As printed on the bill', maxlength: 64, autocomplete: 'off' });
  const dueDate = h('input', { class: 'input', type: 'date' });
  const title = h('input', { class: 'input', placeholder: 'e.g. ER visit after a fall', maxlength: 80 });
  const story = h('textarea', { class: 'input', maxlength: 500, placeholder: 'What happened, and what clearing this would mean. Patrons read this.' });
  const counter = h('small', { class: 'counter' }, '0 / 500');
  story.addEventListener('input', () => { counter.textContent = `${story.value.length} / 500`; });

  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Category' });
  function paintChips() {
    chips.replaceChildren(...Object.entries(CATEGORY_LABELS).map(([k, label]) =>
      h('button', { type: 'button', class: 'chip', dataset: { cat: k }, 'aria-pressed': String(category === k), onclick: () => { category = k; paintChips(); } },
        icon(k), label)));
  }
  paintChips();

  const submit = h('button', { class: 'btn light block', type: 'submit' }, 'Submit for review');

  function cents() {
    const n = Number(amount.value.replace(/[$,\s]/g, ''));
    return Number.isFinite(n) ? Math.round(n * 100) : NaN;
  }

  const form = h('form', { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    err.hide();
    const c = cents();
    const problems = [];
    if (!redactor) problems.push('add a photo of the bill');
    if (!(c >= 100 && c <= 1_000_000)) problems.push('enter an amount between $1 and $10,000');
    if (biller.value.trim().length < 2) problems.push('enter who the bill is from');
    if (acct.value.trim().length < 4) problems.push('enter the account number on the bill');
    if (!category) problems.push('pick a category');
    if (title.value.trim().length < 3) problems.push('give it a short title');
    if (story.value.trim().length < 20) problems.push('tell patrons a little more (20+ characters)');
    if (problems.length) return err.show(`Almost there — please ${problems.join(', ')}.`);

    busy(submit, true, 'Uploading…');
    try {
      await api.createBill({
        title: title.value, category, amountCents: c, billerName: biller.value, billerAccountRef: acct.value,
        dueDate: dueDate.value || null, story: story.value, image: redactor.export(),
      });
      announce('Bill submitted for review');
      root.replaceChildren(h('div', { class: 'done-screen' },
        h('div', { class: 'check' }, icon('shield')),
        h('h1', {}, 'Submitted for review'),
        h('p', {}, 'We confirm every bill with the biller before patrons can see it. Most reviews finish within a day.'),
        h('a', { class: 'btn light', href: '#/bills' }, 'See my bills')));
    } catch (x) {
      err.show(x.message);
      busy(submit, false);
    }
  } },
  h('div', { class: 'shield-note' }, icon('shield'),
    h('span', {}, 'Only our review team sees your photo. Patrons see your first name, city, the amount, the biller and your story — never your account number or the document itself.')),
  err.el,
  h('h2', { class: 'section-t' }, 'The bill'),
  fileInput, photoSlot,
  h('h2', { class: 'section-t' }, 'The details'),
  h('label', { class: 'field' }, h('span', {}, 'Amount due'), h('div', { class: 'money-input' }, amount)),
  field('Who the bill is from', biller),
  h('div', { class: 'row' },
    field('Account number', acct, 'Used only to pay the biller.'),
    field('Due date', dueDate)),
  h('div', { class: 'field' }, h('span', {}, 'Category'), chips),
  field('Title', title),
  h('label', { class: 'field' }, h('span', {}, 'Your story'), story, counter),
  submit);

  root.append(h('div', { class: 'page-h' }, h('h1', {}, 'Upload a bill'), h('p', {}, 'Takes about two minutes.')), form);
}

async function review(root) {
  root.append(h('div', { class: 'spinner' }));
  const { bills } = await api.queue();
  const list = h('ul', { class: 'list' });
  const header = h('div', { class: 'page-h' }, h('h1', {}, 'Review queue'), h('p', {}));
  const setCount = () => {
    const n = list.children.length;
    header.querySelector('p').textContent = n ? `${n} bill${n === 1 ? '' : 's'} waiting. Confirm each with the biller before approving.` : '';
    if (!n) list.replaceWith(h('div', { class: 'blank' }, h('div', { class: 'big' }, '✅'), h('h2', {}, 'Queue is clear'), h('p', {}, 'New submissions will appear here.')));
  };

  for (const b of bills) {
    const reason = h('input', { class: 'input', placeholder: 'Reason shown to the requester', maxlength: 200 });
    const rejectRow = h('div', { class: 'actions-row', hidden: true }, reason,
      h('button', { class: 'btn sm danger', onclick: () => decide('reject') }, 'Confirm reject'));
    const li = h('li', { class: 'item', dataset: { cat: b.category } },
      h('div', { class: 'line1' }, h('h3', {}, b.title), h('span', { class: 'amt' }, money(b.amountCents))),
      h('div', { class: 'meta' }, h('span', {}, CATEGORY_LABELS[b.category]), h('span', {}, `submitted ${timeAgo(b.createdAt)}`)),
      h('dl', { class: 'kv' },
        h('dt', {}, 'Requester'), h('dd', {}, `${b.requester.name} <${b.requester.email}>`),
        h('dt', {}, 'City'), h('dd', {}, b.requester.city || '—'),
        h('dt', {}, 'Biller'), h('dd', {}, b.billerName),
        h('dt', {}, 'Account'), h('dd', {}, b.billerAccountRef),
        h('dt', {}, 'Due'), h('dd', {}, b.dueDate || '—')),
      h('div', { class: 'note' }, b.story),
      b.hasImage
        ? h('a', { class: 'review-img', href: `/api/bills/${b.id}/image`, target: '_blank', rel: 'noopener' },
          h('img', { src: `/api/bills/${b.id}/image`, alt: `Uploaded bill from ${b.billerName}`, loading: 'lazy' }))
        : h('div', { class: 'note' }, 'No photo attached (seed data).'),
      h('div', { class: 'actions-row' },
        h('button', { class: 'btn sm primary', onclick: () => decide('approve') }, icon('check'), 'Approve'),
        h('button', { class: 'btn sm ghost', onclick: () => { rejectRow.hidden = !rejectRow.hidden; if (!rejectRow.hidden) reason.focus(); } }, 'Reject…')),
      rejectRow);

    async function decide(kind) {
      try {
        if (kind === 'approve') await api.approve(b.id); else await api.reject(b.id, reason.value);
        li.remove();
        toast(kind === 'approve' ? `“${b.title}” is live for patrons.` : 'Rejected. The requester will see your reason.');
        setCount();
      } catch (x) {
        toast(x.message, { type: 'error' });
      }
    }
    list.append(li);
  }
  root.replaceChildren(header, list);
  setCount();
}

function account(root) {
  const u = state.user;
  const roleName = { patron: 'Patron', requester: 'Requester', admin: 'Review team' }[u.role];
  root.append(
    h('div', { class: 'page-h' }, h('h1', {}, u.name), h('p', {}, `${roleName} · ${u.email}`)),
    h('ul', { class: 'how' },
      (u.role === 'patron'
        ? [['Direct to biller', 'Your payment goes to the hospital, landlord or utility on the bill — not to the person.'],
          ['Every bill is verified', 'Our team confirms each bill with the biller before it reaches your deck.'],
          ['3.5 seconds to change your mind', 'After a right swipe you can undo before anything is charged.']]
        : u.role === 'requester'
          ? [['Your privacy', 'Patrons see your first name, city, the amount, the biller and your story. Nothing else.'],
            ['No strings', 'Patrons pay the biller directly. You never receive or owe money through BillSwipe.']]
          : [['Verify before approving', 'Call the biller or check their portal to confirm the account and balance.']])
        .map(([t, d]) => h('li', {}, h('span', { class: 'n' }, '✓'), h('div', {}, h('h3', {}, t), h('p', {}, d))))),
    h('button', { class: 'btn ghost block', onclick: async () => {
      await api.logout().catch(() => {});
      setUser(null);
      go('#/');
    } }, 'Sign out'));
}

// ---------- boot ----------
window.addEventListener('hashchange', render);
(async () => {
  try { state.user = (await api.me()).user; } catch { state.user = null; }
  render();
})();
