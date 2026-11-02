import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT NOT NULL,
  city        TEXT,
  role        TEXT NOT NULL CHECK (role IN ('requester', 'patron', 'admin')),
  pw_hash     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bills (
  id                 INTEGER PRIMARY KEY,
  requester_id       INTEGER NOT NULL REFERENCES users(id),
  title              TEXT NOT NULL,
  category           TEXT NOT NULL,
  amount_cents       INTEGER NOT NULL CHECK (amount_cents > 0),
  biller_name        TEXT NOT NULL,
  -- Private: where the money goes. Never exposed to patrons.
  biller_account_ref TEXT NOT NULL,
  due_date           TEXT,
  story              TEXT NOT NULL,
  image_file         TEXT,
  status             TEXT NOT NULL DEFAULT 'pending_review'
                     CHECK (status IN ('pending_review', 'open', 'paying', 'paid', 'rejected', 'withdrawn')),
  reject_reason      TEXT,
  paid_by            INTEGER REFERENCES users(id),
  paid_at            INTEGER,
  created_at         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bills_status ON bills(status, due_date);
CREATE INDEX IF NOT EXISTS bills_requester ON bills(requester_id);

CREATE TABLE IF NOT EXISTS swipes (
  patron_id   INTEGER NOT NULL REFERENCES users(id),
  bill_id     INTEGER NOT NULL REFERENCES bills(id),
  direction   TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (patron_id, bill_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id               INTEGER PRIMARY KEY,
  bill_id          INTEGER NOT NULL REFERENCES bills(id),
  patron_id        INTEGER NOT NULL REFERENCES users(id),
  amount_cents     INTEGER NOT NULL,
  idempotency_key  TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('processing', 'succeeded', 'failed')),
  provider_ref     TEXT,
  failure_reason   TEXT,
  created_at       INTEGER NOT NULL,
  UNIQUE (patron_id, idempotency_key)
);
-- At most one successful or in-flight payment per bill, enforced by the database.
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_live_per_bill
  ON payments(bill_id) WHERE status IN ('processing', 'succeeded');
`;

export function openDb(file) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  return db;
}

/** Run fn inside a write transaction. Rolls back on any throw. */
export function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
