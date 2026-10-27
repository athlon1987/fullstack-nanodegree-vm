# Monetisation & Platform Compliance

**Status:** this build sells nothing. There are no payments, no ads, no loot boxes and no real-money items. This document fixes the rules any future monetisation must follow, and how the content platform stays within app-store rules. It is not legal advice; a launch needs review by counsel familiar with each store and market.

## Principles

1. Fair and transparent: anything bought is shown with its real price before purchase; no hidden costs, no pay-to-win advantage from sponsored content.
2. Calm by design: no artificial scarcity timers pushed by notifications, no "limited offer" pressure, nothing purchasable in Zen Mode.
3. Children: no purchases without the store's parental controls; no targeted offers; no dark patterns.
4. Gems (premium currency in the economy design) are currently **earned only**; if they are ever sold, every gem price is shown in local currency and gem bundles never expire.

## Payments and app-store rules

| Platform | Rule we follow |
|---|---|
| Apple App Store | Digital goods and currency that unlock features in the app use **In-App Purchase** (Guideline 3.1.1). No links or buttons steering to other payment methods for digital goods except where Apple's current rules and entitlements explicitly permit it in a given storefront. Physical goods/services consumed outside the app (e.g. a real kopitiam order) may use other methods (3.1.3(e)) — and are **not** linked to game currency. |
| Google Play | Digital goods via **Google Play Billing**; alternative billing only where Google's programme for that region allows it and with the required disclosures. |
| Web / PWA | Card payments through a PCI-compliant provider; prices in local currency incl. tax. |

**We do not implement any undisclosed way around store payment rules.** Partner links that lead to real businesses are informational (allowlisted, https, opened outside the app) and never sell in-game items.

## Sponsorship ≠ advertising inside gameplay

Sponsored modules are labelled (see SPONSOR_PLATFORM.md), can't buy an economic edge (template value ceilings), can't grant premium currency, and are suppressed in Zen Mode. They are disclosed as sponsored to satisfy consumer-protection and influencer/advertising rules (e.g. clear "Sponsored" labelling expected by advertising standards bodies), and they never target children with behavioural advertising.

## Remote content and app review

Remote updates are **data only** (validated JSON, see MODULAR_ARCHITECTURE.md): no executable code, no HTML, no remote scripts, no WebAssembly. New behaviours, templates or art require a reviewed binary update. This keeps remote content within Apple Guideline 2.5.2 (no downloading code that changes features) and Google Play's policy on dynamic code loading. The game behaves the same with or without the network (bundled content fallback).

## Real-world commerce

- The game never invents prices; real prices appear only when supplied and verified by the partner, with a timestamp.
- Game coins can't be exchanged for real goods or money, and real purchases never grant game currency in this design (keeps us clear of gambling/sweepstakes and stored-value rules).
- Halal and other certification claims are shown only with a verified certificate record.

## Loot boxes and randomness

None. If random rewards are ever sold, odds must be disclosed before purchase (required by Apple, Google and several jurisdictions), and purchases must not be required to progress.

## Data protection

- Malaysia: Personal Data Protection Act 2010 (and amendments) — notice & choice, purpose limitation, retention, cross-border transfer rules.
- Other markets on the country registry (SG, ID, TH, JP, KR) each have their own regimes; a country moves from `planned` to `active` only after a local privacy and content review.
- Children: age-appropriate design; no profiling; parental consent where required (COPPA-style rules for the US if ever offered).

## Before turning anything on

- [ ] Store-specific review of every purchase surface and partner link.
- [ ] Price display tested in each currency on the country registry.
- [ ] Parental-control flows tested on iOS and Android.
- [ ] Legal review of sponsorship disclosures per market.
- [ ] Refund and support process documented.
