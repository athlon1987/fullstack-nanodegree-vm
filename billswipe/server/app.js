import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tx } from './db.js';
import {
  hashPassword, verifyPassword, createSession, destroySession, userForToken,
  RateLimiter, SESSION_TTL_MS,
} from './auth.js';
import {
  HttpError, bad, sendJson, parseCookies, readJson, serveStatic, SECURITY_HEADERS,
} from './http.js';

export const CATEGORIES = ['medical', 'rent', 'utilities', 'car', 'education', 'childcare', 'pet', 'other'];
export const LIMITS = {
  minAmountCents: 100,
  maxAmountCents: 1_000_000, // $10,000
  maxActiveBillsPerRequester: 3,
  maxImageBytes: 4 * 1024 * 1024,
  storyMax: 500,
};
const COOKIE = 'bs_session';
const JSON_LIMIT = 32 * 1024;
const UPLOAD_LIMIT = 6 * 1024 * 1024;

// ---------- validation helpers ----------
function str(body, key, { min = 1, max = 200, required = true } = {}) {
  const v = body[key];
  if (v === undefined || v === null || v === '') {
    if (required) throw bad(`${key} is required`);
    return null;
  }
  if (typeof v !== 'string') throw bad(`${key} must be a string`);
  const t = v.trim().replace(/\s+/g, ' ');
  if (t.length < min) throw bad(`${key} must be at least ${min} characters`);
  if (t.length > max) throw bad(`${key} must be at most ${max} characters`);
  return t;
}

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

const IMAGE_TYPES = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
];

function decodeImage(dataUrl) {
  if (typeof dataUrl !== 'string') throw bad('A photo of the bill is required', 'image_required');
  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw bad('Bill photo must be a JPEG, PNG or WebP image', 'image_type');
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > LIMITS.maxImageBytes) throw bad('Bill photo must be under 4 MB', 'image_size');
  // Trust the bytes, not the label.
  const type = IMAGE_TYPES.find((t) => buf.length > 12 && t.test(buf));
  if (!type) throw bad('Bill photo is not a valid image', 'image_type');
  return { buf, type };
}

// ---------- response shapes ----------
const firstName = (name) => String(name).split(' ')[0];

function publicBill(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amountCents: row.amount_cents,
    billerName: row.biller_name,
    dueDate: row.due_date,
    story: row.story,
    requester: { firstName: firstName(row.requester_name), city: row.requester_city },
    verified: true,
    createdAt: row.created_at,
  };
}

function ownBill(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amountCents: row.amount_cents,
    billerName: row.biller_name,
    billerAccountLast4: row.biller_account_ref.slice(-4),
    dueDate: row.due_date,
    story: row.story,
    status: row.status,
    rejectReason: row.reject_reason,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    hasImage: Boolean(row.image_file),
  };
}

const publicUser = (u) => u && { id: u.id, email: u.email, name: u.name, city: u.city, role: u.role };

// ---------- app ----------
export function createApp({ db, provider, uploadDir, publicDir, cookieSecure = false, demo = false, now = () => Date.now() }) {
  uploadDir = resolve(uploadDir);
  mkdirSync(uploadDir, { recursive: true });
  const loginLimiter = new RateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });
  const signupLimiter = new RateLimiter({ limit: 20, windowMs: 60 * 60 * 1000 });

  const sessionCookie = (token, maxAgeSec) =>
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${cookieSecure ? '; Secure' : ''}`;

  const q = {
    billById: db.prepare('SELECT * FROM bills WHERE id = ?'),
    feed: db.prepare(`
      SELECT b.*, u.name AS requester_name, u.city AS requester_city
      FROM bills b JOIN users u ON u.id = b.requester_id
      WHERE b.status = 'open' AND b.requester_id != ?
        AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.patron_id = ? AND s.bill_id = b.id)
      ORDER BY b.due_date IS NULL, b.due_date ASC, b.created_at ASC
      LIMIT ?`),
    paymentByKey: db.prepare('SELECT * FROM payments WHERE patron_id = ? AND idempotency_key = ?'),
  };

  // ----- handlers -----
  async function signup({ body }) {
    const email = str(body, 'email', { max: 254 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw bad('Enter a valid email address');
    const name = str(body, 'name', { max: 60 });
    const city = str(body, 'city', { max: 60, required: false });
    const role = body.role;
    if (role !== 'requester' && role !== 'patron') throw bad('role must be requester or patron');
    const password = body.password;
    if (typeof password !== 'string' || password.length < 10 || password.length > 200) {
      throw bad('Password must be 10–200 characters');
    }
    const pwHash = await hashPassword(password);
    let id;
    try {
      id = db.prepare('INSERT INTO users (email, name, city, role, pw_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(email, name, city, role, pwHash, now()).lastInsertRowid;
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) throw new HttpError(409, 'email_taken', 'An account with that email already exists');
      throw e;
    }
    const token = createSession(db, Number(id), now());
    const user = db.prepare('SELECT id, email, name, city, role FROM users WHERE id = ?').get(id);
    return [201, { user: publicUser(user) }, { 'Set-Cookie': sessionCookie(token, SESSION_TTL_MS / 1000) }];
  }

  async function login({ body, ip }) {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!loginLimiter.take(`${ip}|${email}`)) {
      throw new HttpError(429, 'rate_limited', 'Too many attempts. Try again in a few minutes.');
    }
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Always run scrypt so response time doesn't reveal whether the email exists.
    const ok = await verifyPassword(password, row?.pw_hash ?? 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '==');
    if (!row || !ok) throw new HttpError(401, 'bad_credentials', 'Email or password is incorrect');
    const token = createSession(db, row.id, now());
    return [200, { user: publicUser(row) }, { 'Set-Cookie': sessionCookie(token, SESSION_TTL_MS / 1000) }];
  }

  function logout({ token }) {
    destroySession(db, token);
    return [200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) }];
  }

  function stats() {
    const paid = db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(amount_cents), 0) AS total
                             FROM payments WHERE status = 'succeeded'`).get();
    const open = db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(amount_cents), 0) AS total
                             FROM bills WHERE status = 'open'`).get();
    const patrons = db.prepare(`SELECT COUNT(DISTINCT patron_id) AS n FROM payments WHERE status = 'succeeded'`).get();
    return [200, {
      billsCleared: paid.n, totalPaidCents: paid.total,
      openBills: open.n, openCents: open.total, activePatrons: patrons.n, demo,
    }];
  }

  function feed({ user, url }) {
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 50);
    return [200, { bills: q.feed.all(user.id, user.id, limit).map(publicBill) }];
  }

  async function createBill({ user, body }) {
    const title = str(body, 'title', { min: 3, max: 80 });
    const category = body.category;
    if (!CATEGORIES.includes(category)) throw bad(`category must be one of ${CATEGORIES.join(', ')}`);
    const amountCents = body.amountCents;
    if (!Number.isInteger(amountCents) || amountCents < LIMITS.minAmountCents || amountCents > LIMITS.maxAmountCents) {
      throw bad('Amount must be between $1 and $10,000');
    }
    const billerName = str(body, 'billerName', { min: 2, max: 80 });
    const billerAccountRef = str(body, 'billerAccountRef', { min: 4, max: 64 });
    const story = str(body, 'story', { min: 20, max: LIMITS.storyMax });
    const dueDate = body.dueDate ? str(body, 'dueDate', { max: 10 }) : null;
    if (dueDate && !validDate(dueDate)) throw bad('dueDate must be YYYY-MM-DD');
    const { buf, type } = decodeImage(body.image);

    const active = db.prepare(`SELECT COUNT(*) AS n FROM bills
      WHERE requester_id = ? AND status IN ('pending_review', 'open', 'paying')`).get(user.id).n;
    if (active >= LIMITS.maxActiveBillsPerRequester) {
      throw new HttpError(409, 'too_many_active', `You can have up to ${LIMITS.maxActiveBillsPerRequester} active bills at a time`);
    }

    const file = `${randomBytes(16).toString('hex')}.${type.ext}`;
    await writeFile(join(uploadDir, file), buf, { mode: 0o600 });
    try {
      const id = db.prepare(`INSERT INTO bills
        (requester_id, title, category, amount_cents, biller_name, biller_account_ref, due_date, story, image_file, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(user.id, title, category, amountCents, billerName, billerAccountRef, dueDate, story, file, now()).lastInsertRowid;
      return [201, { bill: ownBill(q.billById.get(id)) }];
    } catch (e) {
      await unlink(join(uploadDir, file)).catch(() => {});
      throw e;
    }
  }

  function myBills({ user }) {
    const rows = db.prepare('SELECT * FROM bills WHERE requester_id = ? ORDER BY created_at DESC').all(user.id);
    return [200, { bills: rows.map(ownBill) }];
  }

  function withdraw({ user, params }) {
    const changed = db.prepare(`UPDATE bills SET status = 'withdrawn'
      WHERE id = ? AND requester_id = ? AND status IN ('pending_review', 'open')`).run(params.id, user.id).changes;
    if (!changed) throw new HttpError(409, 'not_withdrawable', 'This bill can no longer be withdrawn');
    return [200, { bill: ownBill(q.billById.get(params.id)) }];
  }

  async function billImage({ user, params, res }) {
    const bill = q.billById.get(params.id);
    if (!bill || !bill.image_file || (bill.requester_id !== user.id && user.role !== 'admin')) {
      throw new HttpError(404, 'not_found', 'Not found');
    }
    const buf = await readFile(join(uploadDir, bill.image_file));
    const type = IMAGE_TYPES.find((t) => t.test(buf));
    res.writeHead(200, { 'Content-Type': type?.mime ?? 'application/octet-stream', 'Cache-Control': 'private, no-store' });
    res.end(buf);
    return null;
  }

  async function pay({ user, params, req }) {
    const key = String(req.headers['idempotency-key'] || '');
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(key)) throw bad('Idempotency-Key header is required', 'idempotency_key');
    const billId = Number(params.id);

    const prior = q.paymentByKey.get(user.id, key);
    if (prior) {
      if (prior.bill_id !== billId) throw new HttpError(422, 'idempotency_mismatch', 'Idempotency-Key reused for a different bill');
      return paymentResult(prior);
    }

    // 1. Reserve the bill atomically so two patrons can never both pay it.
    const reservation = tx(db, () => {
      // Re-check under the write lock: a concurrent retry with the same key may have won.
      const raced = q.paymentByKey.get(user.id, key);
      if (raced) return { raced };
      const bill = q.billById.get(billId);
      if (!bill) throw new HttpError(404, 'not_found', 'Bill not found');
      if (bill.requester_id === user.id) throw new HttpError(403, 'own_bill', 'You cannot pay your own bill');
      if (bill.status === 'paid' || bill.status === 'paying') {
        throw new HttpError(409, 'already_paid', 'Another patron got to this one first');
      }
      if (bill.status !== 'open') throw new HttpError(409, 'not_available', 'This bill is no longer available');
      const paymentId = db.prepare(`INSERT INTO payments
        (bill_id, patron_id, amount_cents, idempotency_key, status, created_at) VALUES (?, ?, ?, ?, 'processing', ?)`)
        .run(billId, user.id, bill.amount_cents, key, now()).lastInsertRowid;
      db.prepare(`UPDATE bills SET status = 'paying' WHERE id = ?`).run(billId);
      return { paymentId: Number(paymentId), bill };
    });
    if (reservation.raced) {
      if (reservation.raced.bill_id !== billId) throw new HttpError(422, 'idempotency_mismatch', 'Idempotency-Key reused for a different bill');
      return paymentResult(reservation.raced);
    }

    // 2. Move the money — directly to the biller.
    let result;
    try {
      result = await provider.payBiller({
        amountCents: reservation.bill.amount_cents,
        billerName: reservation.bill.biller_name,
        billerAccountRef: reservation.bill.biller_account_ref,
        idempotencyKey: `bill${billId}_${key}`,
      });
    } catch {
      // Outcome unknown (timeout, network). Leave it "processing"; reconcile() settles it.
      return [202, { status: 'processing', message: 'Payment is processing' }];
    }

    // 3. Settle.
    settle(reservation.paymentId, result);
    return paymentResult(db.prepare('SELECT * FROM payments WHERE id = ?').get(reservation.paymentId));
  }

  function settle(paymentId, result) {
    tx(db, () => {
      const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
      if (!p || p.status !== 'processing') return;
      if (result.ok) {
        db.prepare(`UPDATE payments SET status = 'succeeded', provider_ref = ? WHERE id = ?`).run(result.ref, paymentId);
        db.prepare(`UPDATE bills SET status = 'paid', paid_by = ?, paid_at = ? WHERE id = ?`).run(p.patron_id, now(), p.bill_id);
        db.prepare(`INSERT INTO swipes (patron_id, bill_id, direction, created_at) VALUES (?, ?, 'right', ?)
                    ON CONFLICT (patron_id, bill_id) DO UPDATE SET direction = 'right', created_at = excluded.created_at`)
          .run(p.patron_id, p.bill_id, now());
      } else {
        db.prepare(`UPDATE payments SET status = 'failed', failure_reason = ? WHERE id = ?`).run(result.reason ?? 'failed', paymentId);
        db.prepare(`UPDATE bills SET status = 'open' WHERE id = ? AND status = 'paying'`).run(p.bill_id);
      }
    });
  }

  function paymentResult(p) {
    if (p.status === 'succeeded') {
      return [200, { status: 'succeeded', paymentId: p.id, amountCents: p.amount_cents, providerRef: p.provider_ref }];
    }
    if (p.status === 'processing') return [202, { status: 'processing', message: 'Payment is processing' }];
    throw new HttpError(502, 'payment_failed', p.failure_reason || 'Payment failed');
  }

  /** Settle payments whose provider call never returned (crash, timeout). Run on boot and periodically. */
  async function reconcile({ olderThanMs = 10_000 } = {}) {
    const stuck = db.prepare(`SELECT * FROM payments WHERE status = 'processing' AND created_at <= ?`).all(now() - olderThanMs);
    for (const p of stuck) {
      const r = await provider.lookup(`bill${p.bill_id}_${p.idempotency_key}`);
      if (r.status === 'succeeded') settle(p.id, { ok: true, ref: r.ref });
      else settle(p.id, { ok: false, reason: r.status === 'failed' ? 'Biller rejected the payment' : 'Payment did not complete' });
    }
    return stuck.length;
  }

  function pass({ user, params }) {
    const bill = q.billById.get(params.id);
    if (!bill || bill.status !== 'open') throw new HttpError(404, 'not_found', 'Bill not available');
    db.prepare(`INSERT INTO swipes (patron_id, bill_id, direction, created_at) VALUES (?, ?, 'left', ?)
                ON CONFLICT DO NOTHING`).run(user.id, bill.id, now());
    return [200, { ok: true }];
  }

  function undoPass({ user, params }) {
    const changed = db.prepare(`DELETE FROM swipes WHERE patron_id = ? AND bill_id = ? AND direction = 'left'`)
      .run(user.id, params.id).changes;
    if (!changed) throw new HttpError(404, 'not_found', 'Nothing to undo');
    const bill = db.prepare(`SELECT b.*, u.name AS requester_name, u.city AS requester_city
      FROM bills b JOIN users u ON u.id = b.requester_id WHERE b.id = ?`).get(params.id);
    return [200, { bill: bill.status === 'open' ? publicBill(bill) : null }];
  }

  function history({ user }) {
    const rows = db.prepare(`
      SELECT p.id, p.amount_cents, p.created_at, b.title, b.category, b.biller_name, u.name AS requester_name, u.city AS requester_city
      FROM payments p JOIN bills b ON b.id = p.bill_id JOIN users u ON u.id = b.requester_id
      WHERE p.patron_id = ? AND p.status = 'succeeded' ORDER BY p.created_at DESC`).all(user.id);
    const total = rows.reduce((s, r) => s + r.amount_cents, 0);
    return [200, {
      totalCents: total,
      count: rows.length,
      payments: rows.map((r) => ({
        id: r.id, amountCents: r.amount_cents, paidAt: r.created_at, title: r.title, category: r.category,
        billerName: r.biller_name, requester: { firstName: firstName(r.requester_name), city: r.requester_city },
      })),
    }];
  }

  function adminQueue() {
    const rows = db.prepare(`
      SELECT b.*, u.name AS requester_name, u.email AS requester_email, u.city AS requester_city
      FROM bills b JOIN users u ON u.id = b.requester_id
      WHERE b.status = 'pending_review' ORDER BY b.created_at ASC`).all();
    return [200, {
      bills: rows.map((r) => ({
        ...ownBill(r),
        billerAccountRef: r.biller_account_ref,
        requester: { name: r.requester_name, email: r.requester_email, city: r.requester_city },
      })),
    }];
  }

  function review(decision) {
    return ({ params, body }) => {
      const reason = decision === 'rejected' ? str(body, 'reason', { min: 3, max: 200 }) : null;
      const changed = db.prepare(`UPDATE bills SET status = ?, reject_reason = ? WHERE id = ? AND status = 'pending_review'`)
        .run(decision, reason, params.id).changes;
      if (!changed) throw new HttpError(409, 'not_pending', 'Bill is not awaiting review');
      return [200, { bill: ownBill(q.billById.get(params.id)) }];
    };
  }

  // ----- routing -----
  const routes = [];
  const route = (method, path, handler, opts = {}) => {
    const keys = [];
    const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '(\\d+)')) + '$');
    routes.push({ method, re, keys, handler, ...opts });
  };

  route('POST', '/api/auth/signup', signup, { body: JSON_LIMIT, limiter: signupLimiter });
  route('POST', '/api/auth/login', login, { body: JSON_LIMIT });
  route('POST', '/api/auth/logout', logout, { body: JSON_LIMIT });
  route('GET', '/api/me', ({ user }) => [200, { user: publicUser(user) }]);
  route('GET', '/api/stats', stats);
  route('GET', '/api/feed', feed, { role: 'patron' });
  route('POST', '/api/bills/:id/pay', pay, { role: 'patron', body: JSON_LIMIT });
  route('POST', '/api/bills/:id/pass', pass, { role: 'patron', body: JSON_LIMIT });
  route('DELETE', '/api/bills/:id/pass', undoPass, { role: 'patron' });
  route('GET', '/api/patron/history', history, { role: 'patron' });
  route('POST', '/api/bills', createBill, { role: 'requester', body: UPLOAD_LIMIT });
  route('GET', '/api/bills/mine', myBills, { role: 'requester' });
  route('POST', '/api/bills/:id/withdraw', withdraw, { role: 'requester', body: JSON_LIMIT });
  route('GET', '/api/bills/:id/image', billImage, { role: 'any' });
  route('GET', '/api/admin/queue', adminQueue, { role: 'admin' });
  route('POST', '/api/admin/bills/:id/approve', review('open'), { role: 'admin', body: JSON_LIMIT });
  route('POST', '/api/admin/bills/:id/reject', review('rejected'), { role: 'admin', body: JSON_LIMIT });

  async function handle(req, res) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    const url = new URL(req.url, 'http://localhost');
    const ip = req.socket.remoteAddress || 'unknown';

    try {
      if (!url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'method_not_allowed', 'Method not allowed');
        if (publicDir && (await serveStatic(publicDir, url.pathname, res))) return;
        if (publicDir && (await serveStatic(publicDir, '/index.html', res))) return;
        throw new HttpError(404, 'not_found', 'Not found');
      }

      let match = null;
      let methodMismatch = false;
      for (const r of routes) {
        const m = r.re.exec(url.pathname);
        if (!m) continue;
        if (r.method !== req.method) { methodMismatch = true; continue; }
        match = { r, params: Object.fromEntries(r.keys.map((k, i) => [k, Number(m[i + 1])])) };
        break;
      }
      if (!match) {
        throw methodMismatch
          ? new HttpError(405, 'method_not_allowed', 'Method not allowed')
          : new HttpError(404, 'not_found', 'Not found');
      }

      const { r, params } = match;
      const token = parseCookies(req.headers.cookie)[COOKIE];
      const user = userForToken(db, token, now());
      if (r.role && !user) throw new HttpError(401, 'unauthenticated', 'Sign in to continue');
      if (r.role && r.role !== 'any' && user.role !== r.role) throw new HttpError(403, 'forbidden', 'Not allowed for your account type');
      if (r.limiter && !r.limiter.take(ip)) throw new HttpError(429, 'rate_limited', 'Slow down a little');
      const body = r.body ? await readJson(req, r.body) : {};

      const out = await r.handler({ req, res, url, params, body, user, token, ip });
      if (out) sendJson(res, out[0], out[1], out[2]);
    } catch (err) {
      if (res.headersSent) return res.end();
      if (err instanceof HttpError) return sendJson(res, err.status, { error: { code: err.code, message: err.message } });
      console.error(err);
      sendJson(res, 500, { error: { code: 'internal', message: 'Something went wrong' } });
    }
  }

  return { handle, reconcile };
}
