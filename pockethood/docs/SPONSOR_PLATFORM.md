# POCKETHOOD Partners — Sponsor Platform

> Businesses are guests in the player's world, not its owners.

POCKETHOOD Partners lets real businesses appear in a neighbourhood as **modules**: a dressed building with its own goods, small activities and (optionally) verified real-world information. This document describes what partners can and can't do, how labels work, and which parts exist today.

**Status:** the client-side rules (schemas, labels, economic limits, real-world-info policy, Zen suppression, kill switch) are **built and tested**. The partner workflow (accounts, contracts, review queue, signed publishing, analytics) is **designed, not built** — there is no public partner portal. All four demo modules are fictional and unsponsored.

## What a partner module can be

A module dresses one template slot (café, restaurant, retail, learning, showroom, farm, …) with:

| Partners control | Within these limits |
|---|---|
| Name, tagline, description, sign text | text screening, length limits, en + ms |
| Palette (3 colours) and prefab | approved prefabs per template only |
| Goods and recipes | template item/recipe counts and the **value-per-minute ceiling** |
| Behaviour data (prep steps, quiz questions, showroom models/paints, garden plants) | approved behaviours per template; approved vocabularies |
| Up to 6 quests | no gems, no unlocks, no tutorial quests, coin cap |
| Real-world menu, halal record, links, notice | verification rules below |

Partners **cannot**: ship code, HTML, scripts, trackers or remote resources; change prices of other things, the economy or progression; grant premium currency; insert themselves into the tutorial; message players; collect personal data; appear in Zen Mode with promotional labels; or change anything about other businesses.

## Branded content must preserve the mood

POCKETHOOD is a peaceful, welcoming world (CONTENT_POLICY.md). Every module is held to the same creative standard as our own content.

**Rejected — automatically where possible, always at review:**

| Content | How it is enforced |
|---|---|
| Religious or political promotion, divisive messaging | content-policy screen on every text field in every language (`compileModule`) → module quarantined; human review |
| Aggressive or hostile themes | screen (hostile/violent vocabulary) + review |
| Alcohol, tobacco/vaping, gambling | screen + blocked content tags (`alcohol`, `tobacco`, `gambling`) |
| Self-declared "halal", "sponsored", "official partner" claims in free text | screen (`claim` topic): only verified records may make these claims |
| Overriding or interrupting the soundtrack, autoplaying audio or ads | impossible by construction: modules have no audio, video or media fields; only an approved ambient bed can be chosen |
| Intrusive pop-ups, interstitials, timers, push messages | impossible by construction: modules can't add UI or notifications |
| Forced purchases | modules can't sell anything in-game (MONETIZATION_COMPLIANCE.md) |
| Excessive repetitive activities ("grind") | partner quest objectives are capped at 10 repetitions (`MODULE_MAX_REPEATS`) |
| Misleading commercial relationships | labels are computed from verified records; a module can't label itself |

Every module declares **content tags** from the approved vocabulary (food, drink, cafe, bakery, retail, vehicles, learning, nature, gardening, music, arts, crafts, sport, community, pets, celebration, travel, family, technology, wellbeing_activity). Unknown or blocked tags fail compilation.

## Positive brand integration

Businesses contribute to the living world; they don't control the player's experience.

| Partner | Contributes | Through |
|---|---|---|
| Restaurant / café | a delightful cooking moment | `hand_prepare` (e.g. pulling teh tarik), recipes within the value ceiling |
| Car company | beautiful vehicles and playful arranging | `showroom` (approved models, paints, display bays) |
| School / learning centre | a light, friendly quiz | `quiz` (questions screened, no wrong-answer penalties) |
| Hotel | a peaceful destination | `hotel` template (defined; no building yet) |
| Retailer | interesting goods and a small shop activity | retail template, goods and quests within limits |
| Community organisation | a shared place to grow things | `garden_plots`, community kind (no sponsor label) |

## Sponsor audio rules

- The game's soundtrack always plays as composed (AUDIO_ASSET_MANIFEST.md). No module can replace, pause, duck or overlay it.
- A module may choose one **approved ambient bed** (café chatter, birds, showroom hum, classroom murmur) from the catalog; it plays quietly on the ambience channel, which the player controls, and only while the player has that building selected.
- No jingles, voice-overs, commercials or branded sounds. Future branded audio, if ever allowed, must be approved per release, user-controllable, and consistent with the atmosphere.

## Labels

| Label | Shown when | Notes |
|---|---|---|
| **Sponsored Experience** | `sponsor.verified = true` **and** `verifiedAt` **and** `contractRef` present | the default sponsor label |
| **Official Brand Partner** | as above **and** `brand.kind = licensed` with an unexpired licence record | otherwise downgraded to "Sponsored Experience" with a warning |
| **Fictional business** | `brand.kind = fictional` and the module is a business | all four demo modules |
| **Community place** | `kind = community` | e.g. the community garden |

Labels are computed by the compiler (`compileModule` in `src/platform/content/install.ts`) — a module can't self-declare one. They are hidden in Zen Mode and can be switched off with the `sponsor_labels` flag. Studio → Sponsor preview shows exactly what players would see for any combination.

## Real-world information

- **Menus** are separate from game goods. Prices appear only when partner-supplied **and** verified (date stamped); otherwise "Price not provided". Illustrative menus (all demos) never show prices. The game never invents prices, and game coins are explicitly not money.
- **Halal**: shown only as "Halal certified by {body} (ref. {ref}), verified {date}" when the certifier, certificate reference and verification date are present and the certificate hasn't expired. Anything else shows **nothing** — not "not halal", not a guess.
- **Links** open outside the game, are https-only, must be on a host allowlist (empty in this build), and are hidden in Zen Mode.
- A free-text **notice** lets the partner or reviewer add context (e.g. "Prices may differ by branch").

## No disruptive advertising

- No interstitials, pop-ups, autoplay video, push notifications or timers from partners.
- No placement in the tutorial or in the first-session flow.
- Promotions, sponsor labels, real-world menus and links are suppressed in Zen Mode.
- Kill switch: any module can be switched off remotely in minutes; the building reverts to a neutral shop and nothing is lost for the player.

## Analytics for partners (designed)

Aggregated and privacy-safe only: daily counts of visits to the module's building, items made, quests completed, sessions in which the module was seen — per region with a minimum cohort size (e.g. ≥ 50 players), with small-cell suppression. Never individual-level, never device ids, never children's data, never used for targeting.

## Partner workflow (designed)

```
Business Editor drafts ─▶ Business Manager submits ─▶ Content Reviewer checks
   (brand, safety, culture, accuracy, halal/price evidence, economy table)
      ─▶ approve / request changes / reject ─▶ Platform Admin publishes a signed index
      ─▶ staged rollout (rolloutPercent) ─▶ monitoring ─▶ renew / expire / retire
```

Every step is a row in `module_versions` with an audit record (`backend/schema.sql`). Contracts, licence documents and certificates are stored server-side; the module JSON carries references only.

## Reviewer checklist

- [ ] Brand rights: licence on file for licensed brands; fictional names checked against obvious collisions.
- [ ] Text: accurate, respectful, en + ms reviewed by a native speaker, no claims about health or wellbeing.
- [ ] Culture: no stereotypes or caricature; no religious or political references, symbols or campaigns (CONTENT_POLICY.md).
- [ ] Mood: warm, peaceful, non-intrusive; no audio, no pop-ups, no grind; content tags accurate.
- [ ] Food: menu items real for that business; no invented prices; halal evidence verified or omitted.
- [ ] Economy: Studio economy table within the template ceiling; quests within limits.
- [ ] Children: nothing that targets or profiles young players; no outbound links for kid-facing content.
- [ ] Activation window and licence expiry set; kill-switch contact known.
