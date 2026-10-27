# Audio Asset Manifest & Music Direction

**Status:** every sound in the game is **original and generated in code** (WebAudio synthesis at runtime). There are no audio files to download, so there is nothing to license from third parties. The previous Kenney CC0 Ogg effects were removed from the build in this release.

The soundtrack is **integrated and playable**. It has been checked by measurement (offline renders, below), **not yet by human listening tests** — see "Honest limits".

## 1. Inventory

| Asset | What it is | Source | Licence / ownership | Status |
|---|---|---|---|---|
| POCKETHOOD theme + 8 arrangements | Adaptive lo-fi / jazz-hop score (`src/audio/music/score.ts`) | Original composition written as data in this repository (Claude Code, AI-assisted, 2026) | Project-owned code; see §6 on protectability | **Integrated, playable**; measured, not yet listened to by people |
| Instruments | Warm piano, Rhodes-style electric piano (FM), vibraphone, marimba, plucked guitar (Karplus–Strong), soft pad, round bass, upright bass, lo-fi drum kit (kick, snare, rim, hats, shaker, clap, brushes, ride), vinyl crackle, room reverb (`src/audio/music/instruments.ts`) | Original synthesis code | Project-owned | Integrated |
| Feedback sounds (18) | click, pop, coin chime (rising combo), place pop, construction flourish, level-up, unlock run, reward, friendship sparkle, water, plant, soft "hmm" error, whoosh, chime, cat / dog / fox / frog pet sounds (`src/audio/sfx.ts`) | Original synthesis code, tuned to the soundtrack's key | Project-owned | Integrated |
| Stingers (4) | quest done, construction, level, unlock (`STINGERS` in `score.ts`) — quantised to the beat | Original | Project-owned | Integrated |
| Ambience | Rain (soft, rounded), breeze, insects at dusk, lake water, birdsong (koel and bulbul-like calls in the tropics), café chatter, classroom murmur, showroom hum (`src/audio/AudioManager.ts`) | Original procedural synthesis | Project-owned | Integrated |
| Character voices | Wordless pitched syllables, a different timbre per resident (`AudioManager.voice`) | Original | Project-owned | Integrated |
| ~~Kenney Interface / Impact / Digital Audio SFX (Ogg)~~ | — | kenney.nl, CC0 1.0 | CC0 | **Retired** — removed from the build (some had combat-style names and Ogg doesn't play on older iOS Safari) |

Preview renders for listening are produced by `node scripts/audio/render-previews.mjs <dir>` (WAV + MP3 via ffmpeg; generated files, not committed).

## 2. Music brief (the direction the score follows)

**Style:** catchy, upbeat lo-fi + cosy jazz-hop + cheerful chill beats + gentle game music. Relaxing but never boring; fresh, rhythmic, memorable.

**Palette:** warm electric piano, catchy keyboard melody, light jazz chords (maj9 / m9 / 13), soft round bass, rounded lo-fi drums with swing, plucked guitar, soft pads, marimba and vibraphone accents, vinyl crackle, gentle tape wobble.

**Avoid:** harsh electronics, aggression, orchestral tension, overwhelming bass, sad or sleepy beds, irritating jingles, sudden loud transitions.

**The POCKETHOOD theme:** 8 bars in F major. A rising "do-re-mi-sol" hook (F G A C) with a playful turn, answered in bars 5–8 by the same hook reaching higher before coming home. Simple, singable (range ≤ 1½ octaves), pleasant on repeat. Progression: Fmaj9 · Dm9 · Gm9 · C13 ‖ B♭maj9 · Am7 · Gm9 · C7.

**Form (each arrangement):** four 8-bar sections cycle (e.g. theme → groove → lift → breakdown) so the hook returns regularly without wearing out. Groove sections carry a soft counter-line instead of the melody; breakdowns drop the kick and play the hook fragment only.

| Arrangement | When | Tempo | Lead | Feel |
|---|---|---|---|---|
| Town | general neighbourhood | 92 | warm piano | Rhodes chords, lo-fi drums, vinyl |
| Build | placing / constructing | 104 | marimba (+vibes) | busier percussion, pulsing bass |
| Café | café or bakery selected | 96 | Rhodes | walking bass, brushes and ride, jazzier swing |
| Garden | garden, park, lake | 95 | plucked guitar (+marimba) | guitar arpeggios, shaker and rim |
| Night | after 19:30 | 84 | mellow Rhodes | darker tone, more room, pad |
| Celebration | spot finished, festival tier, level up, landmark | 112 | piano + vibes | claps, four-on-the-floor kick, stabs, brighter |
| Activity | mini-games, shops | 108 | marimba | staccato piano, bouncy bass |
| Zen | Zen Mode | 72 | vibraphone (hook only) | pads, drone bass, no drums, wide reverb |

All arrangements share key, chords, theme and transport — they are versions of one song.

## 3. Adaptive system (integration contract)

- **One transport, never restarted.** `MusicEngine` keeps playing; `setMood()` requests an arrangement. It switches at the **next bar line**, once the request has held for 1.2 s (no flapping when the player taps around). Tempo eases by ≤ 7 BPM per bar; layer levels crossfade (time constant ≈ 1.1 s); the lo-fi tone filter glides.
- **Mood selection** (`src/audio/mood.ts`, unit-tested): Zen > celebration > mini-game > building > café > garden/lake > shop > night > town.
- **Stingers** are quantised to the next 16th on the transport and briefly duck the music (−4 dB).
- **Mixer:** music, ambience, interface and character channels each have their own volume in Settings. A master limiter prevents clipping. Feedback sounds have per-sound minimum spacing, priorities and a 6-voice cap; repeated coin collections climb a pentatonic scale instead of repeating one sound.
- **Battery:** audio is suspended while the game is in the background; the music scheduler only runs while the context is running. Synthesis load is light (≈ 25 short-lived nodes per second).
- **Partners can't touch it:** module content has no audio fields beyond choosing an approved ambient bed; no module can replace, interrupt or overlay the soundtrack (see SPONSOR_PLATFORM.md).

## 4. Verification (offline renders, Chromium `OfflineAudioContext`)

`scripts/audio/render-previews.mjs` renders each arrangement (16 bars), a 150-second **adaptive tour** (town → café → garden → build + quest stinger → celebration → mini-game → night → Zen) and the effects sheet; `scripts/audio/analyze.py` measures them.

| Render | Peak dBFS | RMS dBFS | Clipped samples | Energy < 250 Hz |
|---|---|---|---|---|
| Town | −4.8 | −19.3 | 0 | 45 % |
| Build | −4.4 | −18.6 | 0 | 53 % |
| Café | −6.3 | −19.5 | 0 | 44 % |
| Garden | −3.1 | −21.2 | 0 | 40 % |
| Night | −6.0 | −20.7 | 0 | 37 % |
| Celebration | −5.1 | −18.4 | 0 | 41 % |
| Activity | −5.1 | −19.7 | 0 | 53 % |
| Zen | −7.8 | −22.3 | 0 | 37 % |
| Adaptive tour | −4.8 | −20.0 | 0 | 52 % |

- All seven mood changes in the tour happened **on bar lines**, 1.5–2.5 s after the request; the largest loudness change between consecutive seconds was 4 dB (inside the sparse Zen section, not at a transition).
- Arrangements sit within ±1.5 dB of each other (Zen ≈ 3 dB quieter on purpose).
- The first mix measured 75–85 % of its energy below 250 Hz and clipped; kick, bass, pad voicing, reverb and a low shelf were corrected (table above shows the corrected mix). Soloing layers then showed the garden's plucked guitar buried under its sustained bass (−32 vs −22 dBFS); the guitar was raised an octave and made louder, the bass lowered and a DC offset removed from the string model.
- Effects are levelled to peaks of roughly −8 to −20 dBFS before the channel volume (loudest: the place pop at −7.6; quietest: water at −20.8); the soft "error" is a gentle two-note "hmm", never a buzzer.
- Unit tests (`src/audio/music.test.ts`): theme, chords and stingers are in key; the theme is a single non-overlapping 8-bar line opening with the hook; every tempo is inside the brief's range; Zen has no drums; mood selection rules.

## 5. Honest limits

- **Nobody has listened to it yet.** The measurements show a clean, balanced, structurally correct mix; they cannot show whether the theme is *catchy* or the timbres *beautiful*. A human listening test (team + 10–20 players, phone speakers and headphones) is the next step, and the acceptance criterion "memorable, catchy" is **not yet verified**.
- Synthesised instruments are charming but simpler than recorded ones. For launch quality we recommend a composer (below).
- Not yet measured on real phones: CPU cost of synthesis on low-end Android, Bluetooth latency of stingers.

## 6. Production plan & licensing rules

1. **Keep the procedural score as the live system** (adaptive stems for free, zero download, works offline).
2. **Commission a composer** (work-for-hire or full buyout, worldwide, all media, perpetual) to: refine the theme, record or produce higher-quality instrument samples or stems that plug into the same engine contract (per-arrangement stems: drums, bass, chords, lead, counter, pad — same key, tempo map and 8-bar form), and a short logo sting. Deliverables as WAV stems + cue sheet; licence in writing before integration.
3. **Licensed libraries** only with a written licence that explicitly covers interactive/game use, worldwide distribution in apps and on the web, and no per-play royalties; keep the licence PDF and track IDs in this file.
4. **AI music services** only if their terms grant commercial rights for game use and the output is reviewed for resemblance to existing works; record the service, plan and terms version here. Do not assume generated audio is licensed or protectable.
5. **Never** download or sample copyrighted music without permission.
6. **Protectability:** the current score was composed with AI assistance as code. The project can use it freely, but copyright protection for AI-assisted works varies by jurisdiction, so exclusivity of the theme is not guaranteed. A human-composed or human-arranged final theme gives clearer ownership of the signature melody.
