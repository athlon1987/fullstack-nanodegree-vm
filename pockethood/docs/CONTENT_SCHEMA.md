# Content Schema

POCKETHOOD content is **data only**: JSON files that the game validates with strict schemas before anything reaches the engine. Content can *name* things the client already knows how to do (approved templates, behaviours, prefabs, icons, models); it can never carry code, HTML, scripts or URLs to executable resources.

Source of truth: `src/platform/content/schema.ts` (schemas), `src/platform/content/catalog.ts` (approved vocabularies), `src/platform/content/templates.ts` (gameplay templates and their limits). The field reference at the end of this file is **generated from those schemas**.

## Files

```
content/
  index.json                      content index: versions, sha256 per file, kill switch, flags (generated)
  countries/<cc>.json             country records (MY active; SG, ID, TH, JP, KR planned)
  worlds/<world-id>.json          world packs: a district for a country (Kampung Seri)
  modules/<module-id>.json        Layer C modules (four demo modules)
```

`npm run content:build` validates everything (schema + semantic + economic checks, in every supported language), computes sha256 and byte sizes, writes `content/index.json`, and publishes a copy to `public/content/` (served next to the game). It exits non-zero on any error. The same files are bundled into the app as the offline fallback.

## Text and localisation

Any text field accepts either a plain string or a locale map:

```json
"name": { "en-MY": "Kopitiam Lim", "ms-MY": "Kopitiam Lim" }
```

At install time the game picks the player's language (`en` / `ms`), then English, then the first entry. Text is screened: markup (`<…>`), `javascript:` / `vbscript:` / `data:text/html` URLs, inline `on…=` handlers, control characters and bidi overrides are rejected. Every text field has a maximum length.

UI text is never in content: it lives in `src/platform/i18n/locales/{en,ms}/*.ts`, with the Malay files type-checked against the English keys.

## Identifiers

| Kind | Pattern | Example |
|---|---|---|
| General id | `^[a-z0-9][a-z0-9._-]*$`, 2–64 chars | `my.kampung_seri`, `teh_tarik_master` |
| Module id | `cc.category.name` | `my.food.kopitiam_lim` |
| Module-local id | `^[a-z0-9][a-z0-9_]*$` | `teh_tarik` |
| Country | ISO 3166 alpha-2 | `MY` |
| Locale | `ll` or `ll-CC` | `ms-MY` |

Module items, recipes and quests are namespaced on install: `my.food.kopitiam_lim/teh_tarik`. Modules can reference core/world items (`bread`, `berries`) as ingredients and quest targets.

## Worlds (country districts)

A world pack replaces the neutral core world's **people and story** and dresses its buildings:

- `residents`, `quests`, `stories`, `events`, `project` (community project) replace the core lists;
- `buildings`, `items`, `recipes` *override* names, descriptions, perks, archetypes (from the approved list), the linked resident and catalogue visibility of core buildings — they cannot add new building types or change economics;
- `layout` is the starting neighbourhood; `expansionNames`, `levelUnlocks` and `achievements` rename progression text;
- `environment` sets the biome (`temperate` / `tropical`) and rain chance.

After schema validation the installer runs **reference checks** (`checkWorld` in `install.ts`): every quest giver, objective target, reward unlock, story requirement and layout building must exist. A world with any broken reference is refused and the neutral core world is used instead (player saves are kept intact).

## Modules (Layer C)

A module **dresses a core building slot that runs the same template** (e.g. the kopitiam module dresses the `cafe` slot, which runs the `cafe` template). It supplies:

- `brand` — fictional or licensed, sign text and a three-colour palette;
- `presentation` — one approved prefab, approved props, the resident who staffs it;
- `items` / `recipes` — goods made there (bounded by the template, see below);
- `behaviors` — data for approved behaviours only: `hand_prepare`, `quiz`, `showroom`, `garden_plots`, `visitors`, `ambient_sound`;
- `quests` — optional, ≤ 6, no gems, no unlocks, no tutorial quests, coins ≤ the template's cap;
- `realWorld` — optional menu, halal record, links and notice (rules below);
- `sponsor`, `approval`, `activation`, `licensing` — operations data.

When a module is switched off, expires, fails validation or is killed remotely, the building reverts to the template's **neutral** presentation (generic name, core recipes, neutral quiz / showroom defaults). Nothing in the player's save is deleted: production jobs keep an output snapshot and still pay out, items stay in the inventory, garden/showroom state is kept for when the module returns.

### Template limits (economic fairness)

| Template | Behaviours allowed | Prefabs | Items / recipes | Net value/min ceiling |
|---|---|---|---|---|
| cafe, restaurant | hand_prepare, visitors, ambient_sound | kopitiam, shoplot, cafe_cottage, hawker_stall | 8 / 8 | 24 |
| retail | visitors, ambient_sound | shoplot | 8 / 8 | 18 |
| farm | garden_plots, visitors, ambient_sound | community_garden | 8 / 8 | 18 |
| learning | quiz, visitors, ambient_sound | learning_house, shoplot | 0 / 0 | – |
| showroom | showroom, visitors, ambient_sound | showroom_glass | 0 / 0 | – |
| park, community, residential | visitors, ambient_sound | – | 0 / 0 | – |
| hotel | visitors, ambient_sound | shoplot | template only (no building yet) | – |

"Net value per minute" = (output value × qty − input value − ingredient coins) ÷ minutes. The ceiling roughly matches the best core recipe, so partner or sponsored content can't buy an economic advantage. Garden plants are held to the same ceiling.

### Real-world information rules

| Field | Shown to players only if… | Otherwise |
|---|---|---|
| `menu.items[].priceMinor` | `menu.source = partner_supplied` **and** `menu.verifiedAt` set | removed, shown as "Price not provided" (warning logged) |
| `halal.status = certified` | `certifier`, `certificateRef`, `verifiedAt` present and not past `expires` | shown as nothing (status "not stated"; warning logged) |
| `links[]` | https **and** host on `LINK_HOST_ALLOWLIST` (empty in this build) | removed |
| Sponsor label | see SPONSOR_PLATFORM.md | no label |

Game coins are never connected to real prices; the menu panel says so. Real-world menus and labels are hidden in Zen Mode and can be switched off with feature flags.

## Lifecycle (per module, every install)

`killed` (index kill switch) → `disabled` (index or Studio) → `quarantined` (integrity/schema/semantic failure) → `unapproved` (approval ≠ approved) → `other_country` → `incompatible` (game version) → `scheduled` / `expired` (activation window, brand licence) → `flag_off` → `rollout` (staged percentage, bucketed per install) → `active`. See `src/platform/content/registry.ts`.

## Authoring workflow (today)

1. Edit or add JSON under `content/`.
2. `npm run content:build` — fix every reported error.
3. Preview in the running game: Settings → Studio → Module editor (validates with the production schema and compiler, previews live, never publishes).
4. Commit; the index (hashes) is regenerated by the build.

The production workflow (drafts, reviewer sign-off, signed releases) needs the backend described in `backend/README.md`.

## Field reference

<!-- schema:begin -->
_Generated by `scripts/content/schema-doc.ts` from `src/platform/content/schema.ts`. Do not edit by hand._

### Content index (`content/index.json`)

| Field | | Type |
|---|---|---|
| `schemaVersion` | **required** | 1 |
| `contentVersion` | **required** | string (semver x.y.z), ≤ 20 chars |
| `generatedAt` | **required** | string (ISO date), ≤ 30 chars |
| `minGameVersion` | **required** | string (semver x.y.z), ≤ 20 chars |
| `defaultCountry` | **required** | string (ISO 3166 alpha-2), ≤ 2 chars |
| `countries` | **required** | list (≤ 20) of objects |
| `countries[].code` | **required** | string (ISO 3166 alpha-2), ≤ 2 chars |
| `countries[].path` | **required** | string (relative .json path (no ..)), ≤ 120 chars |
| `countries[].sha256` | **required** | string (sha256 hex), ≤ 64 chars |
| `countries[].bytes` | **required** | integer ≥ 2 ≤ 512000 |
| `worlds` | **required** | list (≤ 20) of objects |
| `worlds[].id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `worlds[].country` | **required** | string (ISO 3166 alpha-2), ≤ 2 chars |
| `worlds[].path` | **required** | string (relative .json path (no ..)), ≤ 120 chars |
| `worlds[].sha256` | **required** | string (sha256 hex), ≤ 64 chars |
| `worlds[].bytes` | **required** | integer ≥ 2 ≤ 512000 |
| `modules` | **required** | list (≤ 200) of objects |
| `modules[].id` | **required** | string, ≤ 64 chars |
| `modules[].version` | **required** | string (semver x.y.z), ≤ 20 chars |
| `modules[].enabled` | **required** | boolean |
| `modules[].rolloutPercent` | optional | integer ≥ 0 ≤ 100 |
| `modules[].path` | **required** | string (relative .json path (no ..)), ≤ 120 chars |
| `modules[].sha256` | **required** | string (sha256 hex), ≤ 64 chars |
| `modules[].bytes` | **required** | integer ≥ 2 ≤ 512000 |
| `killSwitch` | **required** | object |
| `killSwitch.modules` | **required** | list (≤ 200) of string, ≤ 64 chars |
| `killSwitch.reason` | optional | string, ≤ 200 chars |
| `flags` | **required** | map (keys: string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars, ≤ 50) → boolean |

### Country (`content/countries/*.json`)

| Field | | Type |
|---|---|---|
| `schemaVersion` | **required** | 1 |
| `code` | **required** | string (ISO 3166 alpha-2), ≤ 2 chars |
| `name` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `status` | **required** | "active" \| "planned" \| "paused" |
| `locales` | **required** | list (≤ 6) of string (locale, e.g. en-MY), ≤ 10 chars |
| `defaultLocale` | **required** | string (locale, e.g. en-MY), ≤ 10 chars |
| `currency` | **required** | object |
| `currency.code` | **required** | string, ≤ 3 chars |
| `currency.symbol` | **required** | string, ≤ 4 chars |
| `currency.minorUnits` | **required** | integer ≥ 0 ≤ 3 |
| `timezone` | **required** | string (IANA zone), ≤ 40 chars |
| `worlds` | **required** | list (≤ 8) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `compliance` | **required** | object |
| `compliance.certifiedClaimsRequireVerification` | **required** | boolean |
| `compliance.pricesRequireVerification` | **required** | boolean |
| `compliance.notes` | optional | localised text (string or {locale: string}), ≤ 400 chars |

### World pack (`content/worlds/*.json`)

| Field | | Type |
|---|---|---|
| `schemaVersion` | **required** | 1 |
| `id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `version` | **required** | string (semver x.y.z), ≤ 20 chars |
| `country` | **required** | string (ISO 3166 alpha-2), ≤ 2 chars |
| `locales` | **required** | list (≤ 6) of string (locale, e.g. en-MY), ≤ 10 chars |
| `name` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `tagline` | **required** | localised text (string or {locale: string}), ≤ 140 chars |
| `hoodName` | **required** | localised text (string or {locale: string}), ≤ 32 chars |
| `avatar` | **required** | "mini_female_a" \| "mini_female_b" \| "mini_female_c" \| "mini_female_d" \| "mini_female_e" \| "mini_female_f" \| "mini_male_a" \| "mini_male_b" \| "mini_male_c" \| "mini_male_d" \| "mini_male_e" \| "mini_male_f" |
| `environment` | **required** | object |
| `environment.biome` | **required** | "temperate" \| "tropical" |
| `environment.rainChance` | **required** | number ≥ 0 ≤ 1 |
| `buildings` | **required** | map (keys: string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars, ≤ 80) → object |
| `buildings{}.name` | optional | localised text (string or {locale: string}), ≤ 40 chars |
| `buildings{}.description` | optional | localised text (string or {locale: string}), ≤ 220 chars |
| `buildings{}.perks` | optional | list (≤ 5) of list (≤ 6) |
| `buildings{}.archetype` | optional | "starter_house" \| "cottage" \| "townhouse" \| "cafe" \| "bakery" \| "garden" \| "flower_shop" \| "workshop" \| "grocery" \| "park" \| "town_hall" \| "request_board" \| "welcome_sign" \| "pond" \| "fountain" \| "showroom" \| "learning_centre" \| "my:rumah_kampung" \| "my:rumah_papan" \| "my:rumah_teres" \| "my:shoplot" \| "my:kedai_roti" \| "my:kedai_bunga" \| "my:bengkel" \| "my:kedai_runcit" \| "my:taman" \| "my:balai_raya" \| "my:papan_kenyataan" \| "my:gerbang" \| "my:tasik" \| "my:wakaf" \| "my:showroom" \| "my:pusat_belajar" \| "my:kebun" |
| `buildings{}.resident` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `buildings{}.hidden` | optional | boolean |
| `buildings{}.unlockLevel` | optional | integer ≥ 1 ≤ 99 |
| `items` | **required** | map (keys: string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars, ≤ 60) → object |
| `items{}.name` | optional | localised text (string or {locale: string}), ≤ 32 chars |
| `items{}.description` | optional | localised text (string or {locale: string}), ≤ 160 chars |
| `items{}.icon` | optional | "coffee" \| "bread" \| "flowers" \| "berries" \| "vegetables" \| "breakfast" \| "pie" \| "bouquet" \| "crown" \| "planks" \| "bricks" \| "chair" \| "basket" \| "jam" \| "teh" \| "kopi" \| "nasi_lemak" \| "roti_bakar" \| "kelapa" \| "kaya" \| "pisang" \| "hibiscus" \| "kuih" \| "herbs" \| "chili" \| "sapling" \| "fish" \| "book" \| "car" \| "leaf" \| "garland" \| "egg" \| "rice" \| "cup" |
| `recipes` | **required** | map (keys: string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars, ≤ 60) → object |
| `recipes{}.name` | **required** | localised text (string or {locale: string}), ≤ 32 chars |
| `residents` | **required** | list (≤ 16) of objects |
| `residents[].id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `residents[].name` | **required** | localised text (string or {locale: string}), ≤ 24 chars |
| `residents[].profession` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `residents[].bio` | **required** | localised text (string or {locale: string}), ≤ 260 chars |
| `residents[].traits` | **required** | list (≤ 3) of "sociable" \| "creative" \| "energetic" \| "calm" \| "curious" \| "organised" \| "warm" \| "adventurous" |
| `residents[].model` | **required** | "mini_female_a" \| "mini_female_b" \| "mini_female_c" \| "mini_female_d" \| "mini_female_e" \| "mini_female_f" \| "mini_male_a" \| "mini_male_b" \| "mini_male_c" \| "mini_male_d" \| "mini_male_e" \| "mini_male_f" |
| `residents[].color` | **required** | string (#rrggbb), ≤ 7 chars |
| `residents[].workplace` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `residents[].favorites` | **required** | list (≤ 4) of string (item id), ≤ 90 chars |
| `residents[].favoritePlace` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `residents[].arrival` | **required** | one of: start, building, level (by "type") |
| `residents[].arrival<start>.type` | **required** | "start" |
| `residents[].arrival<building>.type` | **required** | "building" |
| `residents[].arrival<building>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `residents[].arrival<level>.type` | **required** | "level" |
| `residents[].arrival<level>.level` | **required** | integer ≥ 1 ≤ 60 |
| `residents[].workAction` | **required** | "interact" \| "pick-up" \| "emote-yes" \| "crouch" |
| `residents[].greetings` | **required** | list (≤ 12) of objects |
| `residents[].greetings[].text` | **required** | localised text (string or {locale: string}), ≤ 220 chars |
| `residents[].greetings[].minLevel` | optional | integer ≥ 0 ≤ 5 |
| `residents[].greetings[].memory` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `residents[].greetings[].phase` | optional | "morning" \| "day" \| "evening" \| "night" |
| `residents[].smallTalk` | **required** | list (≤ 16) of objects |
| `residents[].smallTalk[].text` | **required** | localised text (string or {locale: string}), ≤ 220 chars |
| `residents[].smallTalk[].minLevel` | optional | integer ≥ 0 ≤ 5 |
| `residents[].smallTalk[].memory` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `residents[].smallTalk[].phase` | optional | "morning" \| "day" \| "evening" \| "night" |
| `residents[].memoryLines` | **required** | list (≤ 16) of objects |
| `residents[].memoryLines[].text` | **required** | localised text (string or {locale: string}), ≤ 220 chars |
| `residents[].memoryLines[].minLevel` | optional | integer ≥ 0 ≤ 5 |
| `residents[].memoryLines[].memory` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `residents[].memoryLines[].phase` | optional | "morning" \| "day" \| "evening" \| "night" |
| `residents[].giftReactions` | **required** | object |
| `residents[].giftReactions.love` | **required** | localised text (string or {locale: string}), ≤ 160 chars |
| `residents[].giftReactions.like` | **required** | localised text (string or {locale: string}), ≤ 160 chars |
| `residents[].giftReactions.neutral` | **required** | localised text (string or {locale: string}), ≤ 160 chars |
| `quests` | **required** | list (≤ 80) of objects |
| `quests[].id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].title` | **required** | localised text (string or {locale: string}), ≤ 48 chars |
| `quests[].giver` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].intro` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `quests[].outro` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `quests[].objectives` | **required** | list (≤ 4) of one of: counter, build, upgrade, level, deliver, friendship (by "type") |
| `quests[].objectives[]<counter>.type` | **required** | "counter" |
| `quests[].objectives[]<counter>.counter` | **required** | string (counter key), ≤ 100 chars |
| `quests[].objectives[]<counter>.n` | **required** | integer ≥ 1 ≤ 500 |
| `quests[].objectives[]<counter>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<build>.type` | **required** | "build" |
| `quests[].objectives[]<build>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<build>.n` | **required** | integer ≥ 1 ≤ 10 |
| `quests[].objectives[]<build>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<upgrade>.type` | **required** | "upgrade" |
| `quests[].objectives[]<upgrade>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<upgrade>.level` | **required** | integer ≥ 2 ≤ 5 |
| `quests[].objectives[]<upgrade>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<level>.type` | **required** | "level" |
| `quests[].objectives[]<level>.level` | **required** | integer ≥ 2 ≤ 60 |
| `quests[].objectives[]<level>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<deliver>.type` | **required** | "deliver" |
| `quests[].objectives[]<deliver>.items` | **required** | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `quests[].objectives[]<deliver>.to` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<deliver>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<friendship>.type` | **required** | "friendship" |
| `quests[].objectives[]<friendship>.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<friendship>.level` | **required** | integer ≥ 1 ≤ 5 |
| `quests[].objectives[]<friendship>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].reward` | **required** | object |
| `quests[].reward.coins` | optional | integer ≥ 0 ≤ 5000 |
| `quests[].reward.gems` | optional | integer ≥ 0 ≤ 20 |
| `quests[].reward.xp` | optional | integer ≥ 0 ≤ 500 |
| `quests[].reward.items` | optional | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `quests[].reward.unlocks` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].reward.friendship` | optional | object |
| `quests[].reward.friendship.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].reward.friendship.points` | **required** | integer ≥ 1 ≤ 20 |
| `quests[].after` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].minLevel` | optional | integer ≥ 1 ≤ 60 |
| `quests[].tutorial` | optional | boolean |
| `quests[].focus` | optional | object |
| `quests[].focus.building` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].focus.panel` | optional | "build" \| "orders" \| "quests" \| "residents" \| "inventory" \| "pulse" \| "community" \| "events" \| "map" \| "history" \| "achievements" \| "settings" |
| `quests[].why` | optional | localised text (string or {locale: string}), ≤ 140 chars |
| `stories` | **required** | list (≤ 80) of objects |
| `stories[].id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].title` | **required** | localised text (string or {locale: string}), ≤ 48 chars |
| `stories[].minFriendship` | **required** | integer ≥ 0 ≤ 5 |
| `stories[].requires` | optional | object |
| `stories[].requires.building` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].requires.quest` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].requires.chapter` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].requires.level` | optional | integer ≥ 1 ≤ 60 |
| `stories[].intro` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `stories[].outro` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `stories[].objectives` | **required** | list (≤ 3) of one of: counter, build, upgrade, level, deliver, friendship (by "type") |
| `stories[].objectives[]<counter>.type` | **required** | "counter" |
| `stories[].objectives[]<counter>.counter` | **required** | string (counter key), ≤ 100 chars |
| `stories[].objectives[]<counter>.n` | **required** | integer ≥ 1 ≤ 500 |
| `stories[].objectives[]<counter>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `stories[].objectives[]<build>.type` | **required** | "build" |
| `stories[].objectives[]<build>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].objectives[]<build>.n` | **required** | integer ≥ 1 ≤ 10 |
| `stories[].objectives[]<build>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `stories[].objectives[]<upgrade>.type` | **required** | "upgrade" |
| `stories[].objectives[]<upgrade>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].objectives[]<upgrade>.level` | **required** | integer ≥ 2 ≤ 5 |
| `stories[].objectives[]<upgrade>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `stories[].objectives[]<level>.type` | **required** | "level" |
| `stories[].objectives[]<level>.level` | **required** | integer ≥ 2 ≤ 60 |
| `stories[].objectives[]<level>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `stories[].objectives[]<deliver>.type` | **required** | "deliver" |
| `stories[].objectives[]<deliver>.items` | **required** | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `stories[].objectives[]<deliver>.to` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].objectives[]<deliver>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `stories[].objectives[]<friendship>.type` | **required** | "friendship" |
| `stories[].objectives[]<friendship>.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].objectives[]<friendship>.level` | **required** | integer ≥ 1 ≤ 5 |
| `stories[].objectives[]<friendship>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `stories[].reward` | **required** | object |
| `stories[].reward.coins` | optional | integer ≥ 0 ≤ 5000 |
| `stories[].reward.gems` | optional | integer ≥ 0 ≤ 20 |
| `stories[].reward.xp` | optional | integer ≥ 0 ≤ 500 |
| `stories[].reward.items` | optional | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `stories[].reward.unlocks` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].reward.friendship` | optional | object |
| `stories[].reward.friendship.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].reward.friendship.points` | **required** | integer ≥ 1 ≤ 20 |
| `stories[].memory` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `stories[].worldChange` | optional | localised text (string or {locale: string}), ≤ 160 chars |
| `stories[].flag` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events` | **required** | list (≤ 6) of objects |
| `events[].id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events[].name` | **required** | localised text (string or {locale: string}), ≤ 48 chars |
| `events[].description` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `events[].minLevel` | **required** | integer ≥ 1 ≤ 60 |
| `events[].durationDays` | **required** | integer ≥ 1 ≤ 30 |
| `events[].objectives` | **required** | list (≤ 6) of one of: counter, build, upgrade, level, deliver, friendship (by "type") |
| `events[].objectives[]<counter>.type` | **required** | "counter" |
| `events[].objectives[]<counter>.counter` | **required** | string (counter key), ≤ 100 chars |
| `events[].objectives[]<counter>.n` | **required** | integer ≥ 1 ≤ 500 |
| `events[].objectives[]<counter>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `events[].objectives[]<build>.type` | **required** | "build" |
| `events[].objectives[]<build>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events[].objectives[]<build>.n` | **required** | integer ≥ 1 ≤ 10 |
| `events[].objectives[]<build>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `events[].objectives[]<upgrade>.type` | **required** | "upgrade" |
| `events[].objectives[]<upgrade>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events[].objectives[]<upgrade>.level` | **required** | integer ≥ 2 ≤ 5 |
| `events[].objectives[]<upgrade>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `events[].objectives[]<level>.type` | **required** | "level" |
| `events[].objectives[]<level>.level` | **required** | integer ≥ 2 ≤ 60 |
| `events[].objectives[]<level>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `events[].objectives[]<deliver>.type` | **required** | "deliver" |
| `events[].objectives[]<deliver>.items` | **required** | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `events[].objectives[]<deliver>.to` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events[].objectives[]<deliver>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `events[].objectives[]<friendship>.type` | **required** | "friendship" |
| `events[].objectives[]<friendship>.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events[].objectives[]<friendship>.level` | **required** | integer ≥ 1 ≤ 5 |
| `events[].objectives[]<friendship>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `events[].tiers` | **required** | list (≤ 6) of objects |
| `events[].tiers[].at` | **required** | integer ≥ 1 ≤ 6 |
| `events[].tiers[].reward` | **required** | object |
| `events[].tiers[].reward.coins` | optional | integer ≥ 0 ≤ 5000 |
| `events[].tiers[].reward.gems` | optional | integer ≥ 0 ≤ 20 |
| `events[].tiers[].reward.xp` | optional | integer ≥ 0 ≤ 500 |
| `events[].tiers[].reward.items` | optional | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `events[].tiers[].reward.unlocks` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events[].tiers[].reward.friendship` | optional | object |
| `events[].tiers[].reward.friendship.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `events[].tiers[].reward.friendship.points` | **required** | integer ≥ 1 ≤ 20 |
| `events[].tiers[].label` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `project` | **required** | object |
| `project.id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `project.name` | **required** | localised text (string or {locale: string}), ≤ 48 chars |
| `project.description` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `project.requirements` | **required** | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 2000 |
| `project.stages` | **required** | list (≤ 6) of objects |
| `project.stages[].at` | **required** | number ≥ 0.05 ≤ 1 |
| `project.stages[].label` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `project.reward` | **required** | object |
| `project.reward.coins` | optional | integer ≥ 0 ≤ 5000 |
| `project.reward.gems` | optional | integer ≥ 0 ≤ 20 |
| `project.reward.xp` | optional | integer ≥ 0 ≤ 500 |
| `project.reward.items` | optional | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `project.reward.unlocks` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `project.reward.friendship` | optional | object |
| `project.reward.friendship.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `project.reward.friendship.points` | **required** | integer ≥ 1 ≤ 20 |
| `project.minLevel` | **required** | integer ≥ 1 ≤ 60 |
| `project.flag` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `expansionNames` | **required** | list (≤ 12) of localised text (string or {locale: string}), ≤ 24 chars |
| `levelUnlocks` | **required** | map (keys: string, ≤ 2 chars, ≤ 30) → list (≤ 6) |
| `achievements` | **required** | map (keys: string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars, ≤ 40) → object |
| `achievements{}.name` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `achievements{}.description` | **required** | localised text (string or {locale: string}), ≤ 120 chars |
| `layout` | **required** | list (≤ 140) of objects |
| `layout[].type` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `layout[].x` | **required** | integer ≥ 0 ≤ 23 |
| `layout[].z` | **required** | integer ≥ 0 ≤ 23 |
| `layout[].rot` | optional | 0 \| 1 \| 2 \| 3 |
| `history` | **required** | localised text (string or {locale: string}), ≤ 120 chars |

### Module (`content/modules/*.json`)

| Field | | Type |
|---|---|---|
| `schemaVersion` | **required** | 1 |
| `id` | **required** | string (cc.category.name), ≤ 64 chars |
| `version` | **required** | string (semver x.y.z), ≤ 20 chars |
| `kind` | **required** | "business" \| "community" |
| `category` | **required** | "food_beverage" \| "retail" \| "automotive" \| "education" \| "community" \| "hospitality" \| "agriculture" \| "residential" \| "recreation" |
| `template` | **required** | "restaurant" \| "cafe" \| "retail" \| "residential" \| "learning" \| "showroom" \| "park" \| "hotel" \| "farm" \| "community" |
| `slot` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `country` | **required** | string (ISO 3166 alpha-2), ≤ 2 chars |
| `locales` | **required** | list (≤ 6) of string (locale, e.g. en-MY), ≤ 10 chars |
| `name` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `tagline` | **required** | localised text (string or {locale: string}), ≤ 100 chars |
| `description` | **required** | localised text (string or {locale: string}), ≤ 400 chars |
| `brand` | **required** | object |
| `brand.kind` | **required** | "fictional" \| "licensed" |
| `brand.signText` | **required** | localised text (string or {locale: string}), ≤ 22 chars |
| `brand.palette` | **required** | object |
| `brand.palette.primary` | **required** | string (#rrggbb), ≤ 7 chars |
| `brand.palette.secondary` | **required** | string (#rrggbb), ≤ 7 chars |
| `brand.palette.accent` | **required** | string (#rrggbb), ≤ 7 chars |
| `brand.licence` | optional | object |
| `brand.licence.holder` | **required** | string, ≤ 80 chars |
| `brand.licence.agreementRef` | **required** | string, ≤ 60 chars |
| `brand.licence.expires` | **required** | string (ISO date), ≤ 30 chars |
| `sponsor` | optional | object |
| `sponsor.partnerId` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `sponsor.label` | **required** | "sponsored_experience" \| "official_partner" |
| `sponsor.verified` | **required** | boolean |
| `sponsor.verifiedAt` | optional | string (ISO date), ≤ 30 chars |
| `sponsor.contractRef` | optional | string, ≤ 60 chars |
| `approval` | **required** | object |
| `approval.state` | **required** | "draft" \| "in_review" \| "approved" \| "rejected" \| "retired" |
| `approval.reviewedBy` | optional | string, ≤ 80 chars |
| `approval.reviewedAt` | optional | string (ISO date), ≤ 30 chars |
| `approval.notes` | optional | localised text (string or {locale: string}), ≤ 300 chars |
| `activation` | **required** | object |
| `activation.from` | optional | string (ISO date), ≤ 30 chars |
| `activation.until` | optional | string (ISO date), ≤ 30 chars |
| `activation.minGameVersion` | **required** | string (semver x.y.z), ≤ 20 chars |
| `activation.maxGameVersion` | optional | string (semver x.y.z), ≤ 20 chars |
| `activation.flags` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `presentation` | **required** | object |
| `presentation.prefab` | **required** | "shoplot" \| "kopitiam" \| "showroom_glass" \| "learning_house" \| "community_garden" \| "hawker_stall" \| "cafe_cottage" |
| `presentation.props` | optional | list (≤ 6) of "marble_table" \| "round_stool" \| "menu_stand" \| "potted_plant" \| "bicycle" \| "banner" \| "bookshelf" \| "flag" \| "trellis" \| "water_tank" \| "tyre_stack" \| "lantern" |
| `presentation.staff` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `presentation.greeting` | optional | localised text (string or {locale: string}), ≤ 160 chars |
| `items` | **required** | list (≤ 12) of objects |
| `items[].id` | **required** | string (local id: a-z 0-9 _), ≤ 40 chars |
| `items[].name` | **required** | localised text (string or {locale: string}), ≤ 32 chars |
| `items[].description` | **required** | localised text (string or {locale: string}), ≤ 160 chars |
| `items[].icon` | **required** | "coffee" \| "bread" \| "flowers" \| "berries" \| "vegetables" \| "breakfast" \| "pie" \| "bouquet" \| "crown" \| "planks" \| "bricks" \| "chair" \| "basket" \| "jam" \| "teh" \| "kopi" \| "nasi_lemak" \| "roti_bakar" \| "kelapa" \| "kaya" \| "pisang" \| "hibiscus" \| "kuih" \| "herbs" \| "chili" \| "sapling" \| "fish" \| "book" \| "car" \| "leaf" \| "garland" \| "egg" \| "rice" \| "cup" |
| `items[].value` | **required** | integer ≥ 1 ≤ 200 |
| `recipes` | **required** | list (≤ 12) of objects |
| `recipes[].id` | **required** | string (local id: a-z 0-9 _), ≤ 40 chars |
| `recipes[].item` | **required** | string (item id), ≤ 90 chars |
| `recipes[].level` | **required** | integer ≥ 1 ≤ 3 |
| `recipes[].inputs` | optional | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `recipes[].coins` | optional | integer ≥ 0 ≤ 50 |
| `recipes[].seconds` | **required** | integer ≥ 5 ≤ 3600 |
| `recipes[].qty` | **required** | integer ≥ 1 ≤ 5 |
| `recipes[].xp` | **required** | integer ≥ 1 ≤ 20 |
| `behaviors` | **required** | list (≤ 6) of one of: hand_prepare, quiz, showroom, garden_plots, visitors, ambient_sound (by "type") |
| `behaviors[]<hand_prepare>.type` | **required** | "hand_prepare" |
| `behaviors[]<hand_prepare>.recipe` | **required** | string (local id: a-z 0-9 _), ≤ 40 chars |
| `behaviors[]<hand_prepare>.steps` | **required** | list (≤ 6) of "pour" \| "pull" \| "stir" \| "toast" \| "spread" \| "fold" \| "crack" \| "steam" \| "wrap" \| "scoop" \| "sprinkle" \| "serve" |
| `behaviors[]<hand_prepare>.cooldownSeconds` | **required** | integer ≥ 30 ≤ 3600 |
| `behaviors[]<hand_prepare>.tip` | optional | localised text (string or {locale: string}), ≤ 160 chars |
| `behaviors[]<quiz>.type` | **required** | "quiz" |
| `behaviors[]<quiz>.topic` | **required** | localised text (string or {locale: string}), ≤ 60 chars |
| `behaviors[]<quiz>.dailyLimit` | **required** | integer ≥ 1 ≤ 10 |
| `behaviors[]<quiz>.questions` | **required** | list (≤ 60) of objects |
| `behaviors[]<quiz>.questions[].id` | **required** | string (local id: a-z 0-9 _), ≤ 40 chars |
| `behaviors[]<quiz>.questions[].prompt` | **required** | localised text (string or {locale: string}), ≤ 180 chars |
| `behaviors[]<quiz>.questions[].choices` | **required** | list (≤ 4) of localised text (string or {locale: string}), ≤ 70 chars |
| `behaviors[]<quiz>.questions[].answer` | **required** | integer ≥ 0 ≤ 3 |
| `behaviors[]<quiz>.questions[].explain` | **required** | localised text (string or {locale: string}), ≤ 240 chars |
| `behaviors[]<showroom>.type` | **required** | "showroom" |
| `behaviors[]<showroom>.slots` | **required** | integer ≥ 1 ≤ 4 |
| `behaviors[]<showroom>.models` | **required** | list (≤ 7) of "sedan" \| "suv" \| "hatchback_sports" \| "van" \| "taxi" \| "delivery_van" \| "truck" |
| `behaviors[]<showroom>.paints` | **required** | list (≤ 8) of objects |
| `behaviors[]<showroom>.paints[].id` | **required** | string (local id: a-z 0-9 _), ≤ 40 chars |
| `behaviors[]<showroom>.paints[].name` | **required** | localised text (string or {locale: string}), ≤ 24 chars |
| `behaviors[]<showroom>.paints[].hex` | **required** | string (#rrggbb), ≤ 7 chars |
| `behaviors[]<garden_plots>.type` | **required** | "garden_plots" |
| `behaviors[]<garden_plots>.plots` | **required** | integer ≥ 2 ≤ 6 |
| `behaviors[]<garden_plots>.plants` | **required** | list (≤ 8) of objects |
| `behaviors[]<garden_plots>.plants[].id` | **required** | string (local id: a-z 0-9 _), ≤ 40 chars |
| `behaviors[]<garden_plots>.plants[].name` | **required** | localised text (string or {locale: string}), ≤ 32 chars |
| `behaviors[]<garden_plots>.plants[].icon` | **required** | "coffee" \| "bread" \| "flowers" \| "berries" \| "vegetables" \| "breakfast" \| "pie" \| "bouquet" \| "crown" \| "planks" \| "bricks" \| "chair" \| "basket" \| "jam" \| "teh" \| "kopi" \| "nasi_lemak" \| "roti_bakar" \| "kelapa" \| "kaya" \| "pisang" \| "hibiscus" \| "kuih" \| "herbs" \| "chili" \| "sapling" \| "fish" \| "book" \| "car" \| "leaf" \| "garland" \| "egg" \| "rice" \| "cup" |
| `behaviors[]<garden_plots>.plants[].growSeconds` | **required** | integer ≥ 60 ≤ 86400 |
| `behaviors[]<garden_plots>.plants[].yields` | **required** | string (item id), ≤ 90 chars |
| `behaviors[]<garden_plots>.plants[].qty` | **required** | integer ≥ 1 ≤ 4 |
| `behaviors[]<garden_plots>.plants[].color` | **required** | string (#rrggbb), ≤ 7 chars |
| `behaviors[]<visitors>.type` | **required** | "visitors" |
| `behaviors[]<visitors>.perHour` | **required** | integer ≥ 1 ≤ 12 |
| `behaviors[]<ambient_sound>.type` | **required** | "ambient_sound" |
| `behaviors[]<ambient_sound>.sound` | **required** | "kopitiam_chatter" \| "garden_birds" \| "showroom_hum" \| "classroom_murmur" \| "none" |
| `quests` | optional | list (≤ 6) of objects |
| `quests[].id` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].title` | **required** | localised text (string or {locale: string}), ≤ 48 chars |
| `quests[].giver` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].intro` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `quests[].outro` | **required** | localised text (string or {locale: string}), ≤ 320 chars |
| `quests[].objectives` | **required** | list (≤ 4) of one of: counter, build, upgrade, level, deliver, friendship (by "type") |
| `quests[].objectives[]<counter>.type` | **required** | "counter" |
| `quests[].objectives[]<counter>.counter` | **required** | string (counter key), ≤ 100 chars |
| `quests[].objectives[]<counter>.n` | **required** | integer ≥ 1 ≤ 500 |
| `quests[].objectives[]<counter>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<build>.type` | **required** | "build" |
| `quests[].objectives[]<build>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<build>.n` | **required** | integer ≥ 1 ≤ 10 |
| `quests[].objectives[]<build>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<upgrade>.type` | **required** | "upgrade" |
| `quests[].objectives[]<upgrade>.building` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<upgrade>.level` | **required** | integer ≥ 2 ≤ 5 |
| `quests[].objectives[]<upgrade>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<level>.type` | **required** | "level" |
| `quests[].objectives[]<level>.level` | **required** | integer ≥ 2 ≤ 60 |
| `quests[].objectives[]<level>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<deliver>.type` | **required** | "deliver" |
| `quests[].objectives[]<deliver>.items` | **required** | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `quests[].objectives[]<deliver>.to` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<deliver>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].objectives[]<friendship>.type` | **required** | "friendship" |
| `quests[].objectives[]<friendship>.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].objectives[]<friendship>.level` | **required** | integer ≥ 1 ≤ 5 |
| `quests[].objectives[]<friendship>.label` | **required** | localised text (string or {locale: string}), ≤ 80 chars |
| `quests[].reward` | **required** | object |
| `quests[].reward.coins` | optional | integer ≥ 0 ≤ 5000 |
| `quests[].reward.gems` | optional | integer ≥ 0 ≤ 20 |
| `quests[].reward.xp` | optional | integer ≥ 0 ≤ 500 |
| `quests[].reward.items` | optional | map (keys: string (item id), ≤ 90 chars, ≤ 6) → integer ≥ 1 ≤ 50 |
| `quests[].reward.unlocks` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].reward.friendship` | optional | object |
| `quests[].reward.friendship.resident` | **required** | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].reward.friendship.points` | **required** | integer ≥ 1 ≤ 20 |
| `quests[].after` | optional | list (≤ 4) of string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].minLevel` | optional | integer ≥ 1 ≤ 60 |
| `quests[].tutorial` | optional | boolean |
| `quests[].focus` | optional | object |
| `quests[].focus.building` | optional | string (lowercase id: a-z 0-9 . _ -), ≤ 64 chars |
| `quests[].focus.panel` | optional | "build" \| "orders" \| "quests" \| "residents" \| "inventory" \| "pulse" \| "community" \| "events" \| "map" \| "history" \| "achievements" \| "settings" |
| `quests[].why` | optional | localised text (string or {locale: string}), ≤ 140 chars |
| `realWorld` | optional | object |
| `realWorld.menu` | optional | object |
| `realWorld.menu.currency` | **required** | string, ≤ 3 chars |
| `realWorld.menu.version` | **required** | string (semver x.y.z), ≤ 20 chars |
| `realWorld.menu.source` | **required** | "partner_supplied" \| "illustrative" |
| `realWorld.menu.verifiedAt` | optional | string (ISO date), ≤ 30 chars |
| `realWorld.menu.verifiedBy` | optional | string, ≤ 80 chars |
| `realWorld.menu.items` | **required** | list (≤ 40) of objects |
| `realWorld.menu.items[].name` | **required** | localised text (string or {locale: string}), ≤ 60 chars |
| `realWorld.menu.items[].description` | optional | localised text (string or {locale: string}), ≤ 160 chars |
| `realWorld.menu.items[].priceMinor` | optional | integer ≥ 0 ≤ 10000000 |
| `realWorld.menu.items[].available` | optional | boolean |
| `realWorld.halal` | optional | object |
| `realWorld.halal.status` | **required** | "certified" \| "not_certified" \| "not_stated" |
| `realWorld.halal.certifier` | optional | string, ≤ 80 chars |
| `realWorld.halal.certificateRef` | optional | string, ≤ 60 chars |
| `realWorld.halal.verifiedAt` | optional | string (ISO date), ≤ 30 chars |
| `realWorld.halal.expires` | optional | string (ISO date), ≤ 30 chars |
| `realWorld.links` | optional | list (≤ 3) of objects |
| `realWorld.links[].label` | **required** | localised text (string or {locale: string}), ≤ 40 chars |
| `realWorld.links[].url` | **required** | string (https URL), ≤ 300 chars |
| `realWorld.notice` | optional | localised text (string or {locale: string}), ≤ 240 chars |
| `licensing` | **required** | object |
| `licensing.content` | **required** | "original" \| "licensed" |
| `licensing.assets` | **required** | list (≤ 20) of objects |
| `licensing.assets[].id` | **required** | string, ≤ 60 chars |
| `licensing.assets[].licence` | **required** | "CC0-1.0" \| "CC-BY-4.0" \| "OFL-1.1" \| "original" \| "partner-licensed" |
| `licensing.assets[].source` | **required** | string, ≤ 120 chars |

<!-- schema:end -->
