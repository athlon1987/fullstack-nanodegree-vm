import { hashPassword } from './auth.js';
import { tx } from './db.js';

export const DEMO_PASSWORD = 'swipe-right-2026';
export const DEMO_ACCOUNTS = {
  patron: 'patron@billswipe.test',
  requester: 'requester@billswipe.test',
  admin: 'admin@billswipe.test',
};

const DAY = 24 * 60 * 60 * 1000;
const isoIn = (days, from) => new Date(from + days * DAY).toISOString().slice(0, 10);

// Fictional people, fictional bills.
const REQUESTERS = [
  ['Maya Okafor', 'Tulsa, OK'],
  ['Daniel Reyes', 'Fresno, CA'],
  ['Priya Natarajan', 'Columbus, OH'],
  ['Tom Becker', 'Duluth, MN'],
  ['Aisha Grant', 'Memphis, TN'],
  ['Luis Ortega', 'El Paso, TX'],
  ['Hannah Kim', 'Spokane, WA'],
  ['Jordan Price', 'Macon, GA'],
];

const BILLS = [
  [0, 'ER visit after a fall', 'medical', 184_250, 'Saint Francis Health', 6,
    'Slipped on ice walking to my shift and fractured my wrist. Insurance covered part of it, this is what is left. I am back at work but this balance went to collections notice.'],
  [1, 'Last month of rent', 'rent', 142_500, 'Cedar Court Apartments', 3,
    'My hours got cut at the warehouse in October. New job starts on the 15th, I just need to bridge this one month so my kids and I are not moved out.'],
  [2, 'Winter heating bill', 'utilities', 31_877, 'Columbia Gas of Ohio', 9,
    'Two cold snaps in a row and an old furnace. Paying it off would get us off the shutoff list before the holidays.'],
  [3, 'Transmission repair', 'car', 228_000, 'Lakeside Auto & Transmission', 12,
    'I drive 40 minutes each way to a night shift at the hospital. The car is the job. Shop has it on hold until it is paid.'],
  [4, 'Daycare balance', 'childcare', 68_000, 'Little Oaks Learning Center', 5,
    'Single mom, two kids. Daycare is what lets me work. We fell behind after a surprise dental bill and I do not want to lose our spot.'],
  [5, 'Insulin & supplies', 'medical', 46_520, 'Walgreens Pharmacy #4412', 2,
    'Type 1 diabetic, between insurance plans for 6 weeks while my new employer coverage kicks in. This is one month of supplies.'],
  [6, 'Nursing exam fee', 'education', 20_000, 'Pearson VUE – NCLEX', 21,
    'Finished my nursing program in May. The licensing exam fee is the last thing between me and my first RN job.'],
  [7, 'Emergency vet surgery', 'pet', 97_400, 'Macon Animal Hospital', 8,
    'Our 9-year-old lab swallowed a sock. He is recovering great. The surgery balance is due and they have been very patient with us.'],
  [0, 'Water bill catch-up', 'utilities', 12_890, 'City of Tulsa Utilities', 15,
    'Leak under the house we did not know about for two months. Leak is fixed, the bill is still here.'],
  [2, 'Physical therapy copays', 'medical', 54_000, 'OhioHealth Rehabilitation', 18,
    'Twelve sessions after knee surgery. I am walking without a cane now and I want to finish the last of them.'],
];

export async function seedIfEmpty(db, now = Date.now()) {
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) return false;
  const pw = await hashPassword(DEMO_PASSWORD);

  tx(db, () => {
    const addUser = db.prepare('INSERT INTO users (email, name, city, role, pw_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    addUser.run(DEMO_ACCOUNTS.patron, 'Demo Patron', 'Austin, TX', 'patron', pw, now);
    const demoRequester = Number(addUser.run(DEMO_ACCOUNTS.requester, 'Sam Rivera', 'Phoenix, AZ', 'requester', pw, now).lastInsertRowid);
    addUser.run(DEMO_ACCOUNTS.admin, 'Review Team', null, 'admin', pw, now);

    // Seeded requesters get unusable password hashes — they exist only to own bills.
    const ids = REQUESTERS.map(([name, city], i) =>
      Number(addUser.run(`seed${i}@billswipe.test`, name, city, 'requester', '!', now).lastInsertRowid));

    const addBill = db.prepare(`INSERT INTO bills
      (requester_id, title, category, amount_cents, biller_name, biller_account_ref, due_date, story, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    BILLS.forEach(([who, title, cat, cents, biller, dueIn, story], i) => {
      addBill.run(ids[who], title, cat, cents, biller, `ACCT-${String(100000 + i * 7919).slice(-6)}`,
        isoIn(dueIn, now), story, 'open', now - (BILLS.length - i) * 3600_000);
    });

    // One bill from the demo requester already in review, so the admin queue isn't empty.
    addBill.run(demoRequester, 'Dental crown', 'medical', 89_000, 'Desert Smiles Family Dental', 'PT-55120',
      isoIn(10, now), 'Cracked molar that got infected. The temporary crown is in, the permanent one is scheduled once this balance is cleared.',
      'pending_review', now);
  });
  return true;
}
