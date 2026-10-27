# Content Policy — A World of Peace, Harmony and Community

> “Life is better when we build something beautiful together.”

POCKETHOOD is a place to escape everyday stress. This policy covers **everything a player can read, hear or see**: authored dialogue, quests, stories and events, world packs, partner (sponsored) modules, interface text, and anything players type (names today, any future user-generated content). It applies in every language and every country the game expands into.

## 1. What the world is about

Peace, harmony, friendship, kindness, community, cooperation, creativity, optimism, happiness, mutual respect, generosity, nature, beautiful places, everyday accomplishments and helping others.

Cultural diversity is celebrated through **food, architecture, art, music, landscapes and everyday community life**: kopitiam breakfasts, shoplots, gardens, markets, crafts, neighbours helping neighbours.

## 2. What stays outside the game

Kept out of authored dialogue, quests, stories, events, sponsored content and player names, everywhere:

| Topic | Examples (not exhaustive) |
|---|---|
| Religion | beliefs, practices, places of worship, religious greetings and expressions, religious festivals, religious charity concepts |
| Politics | parties, leaders, elections and voting, governments and ministers, ideologies, protests, campaigns |
| Conflict | religious or political disputes, divisive messaging, hostile arguments, bullying, discrimination, violence and weapons |
| Restricted products | alcohol, tobacco and vaping, gambling (an all-ages game) |
| Unverified claims | halal status, “sponsored”, “official partner” — only the verified records described in SPONSOR_PLATFORM.md may make these |

**Identity is never a filtered topic.** Nationalities, ethnicities, languages and names are part of everyday life in the world (Uncle Lim, Mak Cik Zainab, Cikgu Kavitha, Joanna from Sabah…). The automated screen contains no identity terms, and a test asserts that identity words and everyday names pass.

Events are celebrations of togetherness — Street Food Day, Music Night, Garden Party, Pet Parade, Movie Night, Community Market, Flower Festival, Town Anniversary — not holidays tied to a religion or a political date.

## 3. How characters behave

Warm, expressive, helpful and funny. They have different personalities, tastes and hobbies, and disagreements are light (“Uncle Lim pretends he doesn’t like my kaya. He’s had three slices today.”). No hostile arguments, ideological disputes, bullying or aggressive conflict. Stories end in emotionally satisfying ways: the opening goes well, the surprise party works, the escaped cat is found in the flower bed.

## 4. Enforcement

### Automated (built and tested)

`src/platform/content/policy.ts` screens text against topic term lists (English and Malay; whole-word, case-, accent- and punctuation-insensitive). It runs:

| Where | Effect |
|---|---|
| `checkWorld` — every world pack, all languages | the world is refused and the game falls back to the bundled one |
| `compileModule` — every partner module, all languages | the module is quarantined; its building runs as a neutral shop |
| `npm run content:build` | the content release fails |
| Engine `profile` action — player and neighbourhood names | the change is refused with a friendly message |
| Visit links | a shared snapshot whose name fails the screen opens with the world’s own name |
| Unit tests | Kampung Seri, the core world, all four demo modules and **all interface text** in both languages pass the screen |

Modules also declare **content tags** from an approved vocabulary (`CONTENT_TAGS`). Tags naming excluded subjects (`religion`, `politics`, `gambling`, `alcohol`, `tobacco`, `weapons`, `dating`, `campaign`) are rejected with a policy message; unknown tags are rejected too. Partner quests may not ask for more than 10 repetitions of an activity (`MODULE_MAX_REPEATS`).

Staff-only records (approval notes, licence and contract references, the structured halal certificate record) are not player-facing prose and are not screened as such; the halal record has its own verification rules.

### Human review (required, not automated)

A word list is a safety net, not a moderator. It can’t judge tone, imagery, symbols in art, music or subtext. Every world pack and module release needs a reviewer to sign off on:

- [ ] No religious or political topics, symbols or references — in text, art, signage, music or audio.
- [ ] Tone: warm, light, kind; conflicts are gentle and resolve happily.
- [ ] Respectful cultural representation; no stereotypes or caricature.
- [ ] Each language reviewed by a native speaker (the screen catches words, not meaning).
- [ ] Art and props: no religious buildings or symbols, flags of parties, campaign colours or slogans.
- [ ] Sponsored content follows SPONSOR_PLATFORM.md (labels, no intrusive formats, no audio overrides).

### Future user-generated content

If players can ever write free text (messages, signs, descriptions), it must use: preset phrases for younger players, the same policy screen in every language, rate limits, reporting and blocking, and human moderation. Until those exist, the only free text is the player and neighbourhood name.

## 5. Changes made to existing content (this release)

| Before | After | Why |
|---|---|---|
| “Lakeside Wakaf” community project | **Lakeside Pavilion** / *Pondok Tepi Tasik* | “wakaf” is also a religious endowment term |
| “Assalamualaikum!” (Mak Cik Zainab) | “Selamat pagi!” | religious greeting |
| “MasyaAllah, cantiknya!” | “Wah, cantiknya!” | religious expression |
| “for kenduri, meetings…” (Balai Raya) | “for community dinners, meetings…” | kenduri often has religious elements |
| “Pelita Post”, “pelita lanterns” | **Lantern Post** / *Tiang Lampu Taman* | pelita are strongly associated with a religious festival |

Saves made before the rename are migrated (save v5): the quest and project ids change from `wakaf` to `pavilion`, and progress is kept.
