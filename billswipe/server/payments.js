import { randomBytes } from 'node:crypto';

/**
 * Payment provider contract. Money always goes to the BILLER (the utility,
 * hospital, landlord...), never to the person who posted the bill. That one
 * rule removes most of the fraud incentive from the product.
 *
 *   payBiller({ amountCents, billerName, billerAccountRef, idempotencyKey })
 *     -> Promise<{ ok: true, ref } | { ok: false, reason }>
 *   lookup(idempotencyKey) -> Promise<{ status: 'succeeded'|'failed'|'unknown', ref? }>
 *
 * Production would implement this with a bill-pay rail (e.g. Stripe Treasury
 * outbound payments, Method, or a bank's bill-pay API). The mock below lets the
 * whole product run end-to-end without moving real money.
 */
export class MockBillPayProvider {
  constructor({ failWhen = () => false, latencyMs = 0 } = {}) {
    this.failWhen = failWhen;
    this.latencyMs = latencyMs;
    this.ledger = new Map();
  }

  async payBiller(req) {
    if (this.latencyMs) await new Promise((r) => setTimeout(r, this.latencyMs));
    const existing = this.ledger.get(req.idempotencyKey);
    if (existing) return existing;
    const result = this.failWhen(req)
      ? { ok: false, reason: 'Biller rejected the payment' }
      : { ok: true, ref: `mock_${randomBytes(8).toString('hex')}` };
    this.ledger.set(req.idempotencyKey, result);
    return result;
  }

  async lookup(idempotencyKey) {
    const r = this.ledger.get(idempotencyKey);
    if (!r) return { status: 'unknown' };
    return r.ok ? { status: 'succeeded', ref: r.ref } : { status: 'failed' };
  }
}
