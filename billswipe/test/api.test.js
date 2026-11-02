import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../server/db.js';
import { createApp } from '../server/app.js';
import { MockBillPayProvider } from '../server/payments.js';
import { seedIfEmpty, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../server/seed.js';

// 1x1 transparent PNG
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

let server, base, tmp, db, provider, app;

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'billswipe-'));
  db = openDb(':memory:');
  // Fail any payment to a biller named "Flaky Biller"; hang forever for "Black Hole Bank".
  provider = new MockBillPayProvider({ failWhen: (r) => r.billerName === 'Flaky Biller' });
  const realPay = provider.payBiller.bind(provider);
  provider.payBiller = (req) => (req.billerName === 'Timeout Co' ? Promise.reject(new Error('timeout')) : realPay(req));
  app = createApp({ db, provider, uploadDir: join(tmp, 'uploads'), publicDir: null });
  await seedIfEmpty(db);
  server = createServer(app.handle);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  rmSync(tmp, { recursive: true, force: true });
});

/** Tiny cookie-jar client. */
function client() {
  let cookie = '';
  return async (method, path, body, headers = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const type = res.headers.get('content-type') || '';
    return { status: res.status, body: type.includes('json') ? await res.json() : await res.arrayBuffer() };
  };
}

async function loginAs(email) {
  const c = client();
  const r = await c('POST', '/api/auth/login', { email, password: DEMO_PASSWORD });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return c;
}

let keySeq = 0;
const key = () => `test-key-${++keySeq}-${Date.now()}`;

async function newOpenBill(fields = {}) {
  const r = client();
  const email = `req${++keySeq}@example.com`;
  await r('POST', '/api/auth/signup', { email, password: 'long-enough-pw', name: 'Test Requester', role: 'requester' });
  const created = await r('POST', '/api/bills', {
    title: 'Test bill', category: 'utilities', amountCents: 5000, billerName: 'Test Electric',
    billerAccountRef: 'ACC-998877', story: 'A sufficiently long story about this bill.', image: PNG, ...fields,
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const admin = await loginAs(DEMO_ACCOUNTS.admin);
  assert.equal((await admin('POST', `/api/admin/bills/${created.body.bill.id}/approve`, {})).status, 200);
  return { requester: r, id: created.body.bill.id };
}

test('auth: signup, me, logout, bad credentials', async () => {
  const c = client();
  const s = await c('POST', '/api/auth/signup', { email: 'New@Example.com', password: 'correct horse battery', name: 'Ana Lima', role: 'patron' });
  assert.equal(s.status, 201);
  assert.equal(s.body.user.email, 'new@example.com');
  assert.equal((await c('GET', '/api/me')).body.user.name, 'Ana Lima');
  assert.equal((await c('POST', '/api/auth/signup', { email: 'new@example.com', password: 'whatever-long', name: 'X', role: 'patron' })).status, 409);
  await c('POST', '/api/auth/logout', {});
  assert.equal((await c('GET', '/api/me')).body.user, null);
  assert.equal((await client()('POST', '/api/auth/login', { email: 'new@example.com', password: 'nope-nope-nope' })).status, 401);
  assert.equal((await client()('POST', '/api/auth/signup', { email: 'a@b.co', password: 'short', name: 'A', role: 'patron' })).status, 400);
  assert.equal((await client()('POST', '/api/auth/signup', { email: 'a@b.co', password: 'long-enough-pw', name: 'A', role: 'admin' })).status, 400);
});

test('roles are enforced', async () => {
  const anon = client();
  assert.equal((await anon('GET', '/api/feed')).status, 401);
  const requester = await loginAs(DEMO_ACCOUNTS.requester);
  assert.equal((await requester('GET', '/api/feed')).status, 403);
  assert.equal((await requester('GET', '/api/admin/queue')).status, 403);
  const patron = await loginAs(DEMO_ACCOUNTS.patron);
  assert.equal((await patron('POST', '/api/bills', {})).status, 403);
});

test('feed never leaks biller account numbers, surnames or images', async () => {
  const patron = await loginAs(DEMO_ACCOUNTS.patron);
  const { body } = await patron('GET', '/api/feed');
  assert.ok(body.bills.length >= 5);
  const raw = JSON.stringify(body);
  assert.ok(!raw.includes('ACCT-'), 'account ref leaked');
  assert.ok(!raw.includes('Okafor'), 'surname leaked');
  assert.ok(body.bills.every((b) => b.verified && !('image' in b) && !('billerAccountRef' in b)));
  // sorted by due date
  const dates = body.bills.map((b) => b.dueDate);
  assert.deepEqual(dates, [...dates].sort());
});

test('swipe right pays the biller exactly once', async () => {
  const { id, requester } = await newOpenBill();
  const patron = await loginAs(DEMO_ACCOUNTS.patron);
  const k = key();
  const first = await patron('POST', `/api/bills/${id}/pay`, {}, { 'Idempotency-Key': k });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(first.body.status, 'succeeded');

  // Retry with the same key: same payment, no new charge.
  const retry = await patron('POST', `/api/bills/${id}/pay`, {}, { 'Idempotency-Key': k });
  assert.equal(retry.body.paymentId, first.body.paymentId);
  assert.equal(provider.ledger.size >= 1, true);

  // Different patron, different key: refused.
  const p2 = client();
  await p2('POST', '/api/auth/signup', { email: `p2-${key()}@example.com`, password: 'long-enough-pw', name: 'Other', role: 'patron' });
  assert.equal((await p2('POST', `/api/bills/${id}/pay`, {}, { 'Idempotency-Key': key() })).body.error.code, 'already_paid');

  const mine = await requester('GET', '/api/bills/mine');
  assert.equal(mine.body.bills[0].status, 'paid');
  const hist = await patron('GET', '/api/patron/history');
  assert.ok(hist.body.payments.some((p) => p.title === 'Test bill'));
  const feed = await patron('GET', '/api/feed?limit=50');
  assert.ok(!feed.body.bills.some((b) => b.id === id), 'paid bill still in feed');
});

test('concurrent swipes from many patrons: exactly one payment succeeds', async () => {
  const { id } = await newOpenBill({ amountCents: 7777 });
  const patrons = await Promise.all(Array.from({ length: 8 }, async (_, i) => {
    const c = client();
    await c('POST', '/api/auth/signup', { email: `race${i}-${key()}@example.com`, password: 'long-enough-pw', name: 'Racer', role: 'patron' });
    return c;
  }));
  const results = await Promise.all(patrons.map((c) => c('POST', `/api/bills/${id}/pay`, {}, { 'Idempotency-Key': key() })));
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 7);
  const count = db.prepare(`SELECT COUNT(*) AS n FROM payments WHERE bill_id = ? AND status = 'succeeded'`).get(id).n;
  assert.equal(count, 1);
});

test('failed payment reopens the bill', async () => {
  const { id } = await newOpenBill({ billerName: 'Flaky Biller' });
  const patron = await loginAs(DEMO_ACCOUNTS.patron);
  const r = await patron('POST', `/api/bills/${id}/pay`, {}, { 'Idempotency-Key': key() });
  assert.equal(r.status, 502);
  assert.equal(db.prepare('SELECT status FROM bills WHERE id = ?').get(id).status, 'open');
});

test('unknown provider outcome stays processing until reconciled', async () => {
  const { id } = await newOpenBill({ billerName: 'Timeout Co' });
  const patron = await loginAs(DEMO_ACCOUNTS.patron);
  const r = await patron('POST', `/api/bills/${id}/pay`, {}, { 'Idempotency-Key': key() });
  assert.equal(r.status, 202);
  assert.equal(db.prepare('SELECT status FROM bills WHERE id = ?').get(id).status, 'paying');
  assert.equal(await app.reconcile({ olderThanMs: 0 }) >= 1, true);
  assert.equal(db.prepare('SELECT status FROM bills WHERE id = ?').get(id).status, 'open');
});

test('pass and undo', async () => {
  const { id } = await newOpenBill();
  const patron = await loginAs(DEMO_ACCOUNTS.patron);
  assert.equal((await patron('POST', `/api/bills/${id}/pass`, {})).status, 200);
  let feed = await patron('GET', '/api/feed?limit=50');
  assert.ok(!feed.body.bills.some((b) => b.id === id));
  const undo = await patron('DELETE', `/api/bills/${id}/pass`);
  assert.equal(undo.body.bill.id, id);
  feed = await patron('GET', '/api/feed?limit=50');
  assert.ok(feed.body.bills.some((b) => b.id === id));
});

test('bill submission validation and review flow', async () => {
  const r = client();
  await r('POST', '/api/auth/signup', { email: `val-${key()}@example.com`, password: 'long-enough-pw', name: 'Val Idator', role: 'requester' });
  const good = { title: 'Gas bill', category: 'utilities', amountCents: 4200, billerName: 'City Gas', billerAccountRef: '12345678', story: 'Twenty plus characters of story.', image: PNG };

  const cases = [
    [{ amountCents: 50 }, 400],
    [{ amountCents: 2_000_000 }, 400],
    [{ amountCents: 12.5 }, 400],
    [{ category: 'yacht' }, 400],
    [{ image: 'data:image/png;base64,' + Buffer.from('not an image at all').toString('base64') }, 400],
    [{ image: 'data:text/html;base64,PGgxPg==' }, 400],
    [{ image: undefined }, 400],
    [{ dueDate: '2026-02-31' }, 400],
    [{ story: 'too short' }, 400],
  ];
  for (const [patch, status] of cases) {
    const res = await r('POST', '/api/bills', { ...good, ...patch });
    assert.equal(res.status, status, `${JSON.stringify(patch)} -> ${JSON.stringify(res.body)}`);
  }

  const created = await r('POST', '/api/bills', good);
  assert.equal(created.body.bill.status, 'pending_review');
  assert.equal(created.body.bill.billerAccountLast4, '5678');

  // Pending bills are invisible to patrons.
  const patron = await loginAs(DEMO_ACCOUNTS.patron);
  assert.ok(!(await patron('GET', '/api/feed?limit=50')).body.bills.some((b) => b.id === created.body.bill.id));
  // Image is visible to owner and admin only.
  assert.equal((await patron('GET', `/api/bills/${created.body.bill.id}/image`)).status, 404);
  assert.equal((await r('GET', `/api/bills/${created.body.bill.id}/image`)).status, 200);

  const admin = await loginAs(DEMO_ACCOUNTS.admin);
  const queue = await admin('GET', '/api/admin/queue');
  assert.ok(queue.body.bills.some((b) => b.id === created.body.bill.id && b.billerAccountRef === '12345678'));
  assert.equal((await admin('POST', `/api/admin/bills/${created.body.bill.id}/reject`, {})).status, 400);
  assert.equal((await admin('POST', `/api/admin/bills/${created.body.bill.id}/reject`, { reason: 'Photo is unreadable' })).status, 200);
  const mine = await r('GET', '/api/bills/mine');
  assert.equal(mine.body.bills[0].rejectReason, 'Photo is unreadable');

  // Active bill cap.
  for (let i = 0; i < 3; i++) await r('POST', '/api/bills', good);
  assert.equal((await r('POST', '/api/bills', good)).body.error.code, 'too_many_active');
});

test('rejects non-JSON writes (CSRF guard) and unknown routes', async () => {
  const res = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'email=a' });
  assert.equal(res.status, 415);
  assert.equal((await fetch(base + '/api/nope')).status, 404);
  assert.equal((await fetch(base + '/api/feed', { method: 'PUT' })).status, 405);
});

test('public stats add up', async () => {
  const { body } = await client()('GET', '/api/stats');
  const paid = db.prepare(`SELECT COALESCE(SUM(amount_cents),0) AS t FROM payments WHERE status='succeeded'`).get().t;
  assert.equal(body.totalPaidCents, paid);
  assert.ok(body.openBills > 0);
});
