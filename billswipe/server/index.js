import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { MockBillPayProvider } from './payments.js';
import { purgeExpiredSessions } from './auth.js';
import { seedIfEmpty, DEMO_ACCOUNTS, DEMO_PASSWORD } from './seed.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = process.env.DATA_DIR || join(root, 'data');
const port = Number(process.env.PORT || 3000);
mkdirSync(dataDir, { recursive: true });

const db = openDb(join(dataDir, 'billswipe.db'));
const provider = new MockBillPayProvider({ latencyMs: 350 });
const app = createApp({
  db,
  provider,
  uploadDir: join(dataDir, 'uploads'),
  publicDir: join(root, 'public'),
  cookieSecure: process.env.COOKIE_SECURE === '1',
  // Demo mode shows one-tap demo logins on the landing page. Set DEMO=0 in production.
  demo: process.env.DEMO !== '0',
});

const seeded = await seedIfEmpty(db);
await app.reconcile({ olderThanMs: 0 });
setInterval(() => {
  app.reconcile().catch((e) => console.error('reconcile failed', e));
  purgeExpiredSessions(db);
}, 30_000).unref();

const server = createServer(app.handle);
server.listen(port, () => {
  console.log(`BillSwipe running at http://localhost:${port}`);
  if (seeded) {
    console.log(`Demo accounts (password: ${DEMO_PASSWORD}):`);
    for (const [role, email] of Object.entries(DEMO_ACCOUNTS)) console.log(`  ${role.padEnd(9)} ${email}`);
  }
});

const shutdown = () => server.close(() => { db.close(); process.exit(0); });
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
