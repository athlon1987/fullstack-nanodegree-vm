# BillSwipe

**Upload a bill. A patron swipes right. The biller gets paid.**

People post real bills. Patrons swipe through them like a dating app: right to pay, left to pass.
Money goes **straight to the biller** (the hospital, landlord or utility), never to the person who posted the bill.
That one rule removes most of the incentive for fraud.

## Run it

Needs Node 22.13 or later. There are no dependencies, so there's nothing to install.

```bash
cd billswipe
npm start          # http://localhost:3000
npm test           # API test suite (node:test)
```

The first run seeds demo data. The landing page has one-tap demo logins. You can also sign in by hand with the password `swipe-right-2026`:

| Role       | Email                      | What you can do                                   |
|------------|----------------------------|---------------------------------------------------|
| Patron     | `patron@billswipe.test`    | Swipe the deck, pay bills, see what you've given  |
| Requester  | `requester@billswipe.test` | Upload and redact a bill, track its status        |
| Review     | `admin@billswipe.test`     | Check submitted bills, then approve or reject them |

| Env var         | Default  | Meaning                                         |
|-----------------|----------|-------------------------------------------------|
| `PORT`          | `3000`   | HTTP port                                       |
| `DATA_DIR`      | `./data` | Where the SQLite database and uploads are stored |
| `COOKIE_SECURE` | unset    | Set to `1` when you serve over HTTPS            |
| `DEMO`          | on       | Set to `0` to hide the demo login buttons       |

## How it works

**Requester**
1. Takes a photo of the bill and blacks out private details right in the browser. Re-encoding the image through a canvas also strips EXIF data such as GPS location.
2. Enters the amount, biller, account number, due date, category and a short story.
3. The bill waits in review. Nobody can see it until the review team approves it.

**Patron**
- Gets a deck of verified bills, with the most urgent due dates first.
- Swiping right starts a **3.5-second undo window** before any money moves. Swiping left passes, and the undo button brings the card back.
- Works with touch, mouse or keyboard (`←` `→` `Z`). Respects reduced-motion settings.

**What patrons see:** the requester's first name and city, the amount, the biller's name, the due date and the story.
**What patrons never see:** surnames, email addresses, account numbers or the bill photo. Only the owner and reviewers can see those, and the API enforces it.

## Engineering notes

- **No double payments.** Paying first reserves the bill inside a `BEGIN IMMEDIATE` transaction. A partial unique index then allows only one in-flight or successful payment per bill. A test has 8 patrons race for the same bill: exactly one wins.
- **Idempotent payments.** The client sends an `Idempotency-Key`. If a request is retried after a network failure, the client gets the original result instead of a second charge.
- **Unknown outcomes are reconciled, not guessed.** If the payment provider times out, the payment stays `processing`. The `reconcile()` job asks the provider what happened and then settles it or reopens the bill. It runs on startup and every 30 seconds.
- **Security.** Passwords are hashed with scrypt. Session tokens are stored only as SHA-256 hashes, in `HttpOnly; SameSite=Strict` cookies. Write requests must be JSON, which blocks cross-site form posts (CSRF). The Content Security Policy is strict (no inline scripts or styles). Login is rate-limited and takes the same time whether or not an email exists. Uploaded images are checked by their actual bytes, not their declared type. All user text is rendered as text nodes, never as HTML.
- **Abuse limits.** Bills must be between $1 and $10,000. A requester can have at most 3 active bills.

## Going to production

The payment rail is the only piece that's simulated. To move real money, replace `MockBillPayProvider` in `server/payments.js` with a real bill-pay integration (for example Stripe Treasury outbound payments, Method, or a bank's bill-pay API). It needs to implement `payBiller()` and `lookup()`. Beyond that you'd want:

- Patron KYC and funding (card or ACH) before the first payment
- A way to confirm bills with the biller (a phone script or biller-portal lookup in the review queue)
- Email or push notifications when a bill is paid
- Postgres and object storage instead of SQLite and local disk once you run more than one instance (the rate limiter is in memory and needs to move too)

## Layout

```
server/
  index.js      boot, seed, reconcile loop
  app.js        routes, validation, payment state machine
  db.js         schema and transaction helper
  auth.js       scrypt, sessions, rate limiter
  payments.js   provider contract and mock
  seed.js       demo data (fictional people)
public/
  js/main.js    router and views
  js/deck.js    swipe deck: gestures, undo window, celebration
  js/redact.js  in-browser redaction and EXIF stripping
  js/ui.js      DOM helpers, icons, formatting, toasts
  css/app.css
test/api.test.js
```
