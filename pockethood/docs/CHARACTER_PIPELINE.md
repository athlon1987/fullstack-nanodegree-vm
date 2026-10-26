# Character & Animation Pipeline

## Source rigs
| Family | Models | Rig | Clips used |
|---|---|---|---|
| Kenney Mini Characters | `mini_male_a–f`, `mini_female_a–f` | Kenney humanoid (shared) | idle, walk, sprint, sit, emote-yes, emote-no, interact-right, pick-up, crouch, jump (32 available) |
| Quaternius animals | cat, shiba, pug, fox, frog | Quaternius per-species armatures | Idle, Walk/Run/Gallop, Eating, Jump, HeadLow variants |

Humanoid clips are never applied to animals; each family has its own state→clip table.

## Runtime flow
1. `rendering/models/assets.ts` preloads every catalogued GLB (meshopt-compressed) behind the loading screen.
2. `model(name, height)` returns a **normalised clone** (`SkeletonUtils.clone` for skinned models): scaled so its height equals the requested world height, centred in XZ, feet at y = 0. Normalisation is measured once per model with a precise bounding box and cached. Quaternius animals are authored in centimetres — normalisation handles that automatically.
3. `rendering/characters/Actor.ts` wraps a clone with an `AnimationMixer` and a small **state machine**:

   | State | Kenney clip | Animal clip | Type |
   |---|---|---|---|
   | idle | idle | Idle | loop |
   | walk | walk | Walk (→Run/Gallop fallback) | loop |
   | run | sprint | Run / Gallop | loop |
   | talk | emote-yes (slowed) | Idle_2 | loop |
   | wave | interact-right | Headbutt / Jump | one-shot |
   | celebrate | jump | Jump / Jump_Loop | one-shot |
   | sit | sit | Idle_2_HeadLow | loop |
   | work | interact-right | Eating | loop |
   | surprised | emote-no | HitReact | one-shot |
   | happy | emote-yes | Jump | one-shot |
   | eat | pick-up | Eating | loop |
   | crouch | crouch | HeadLow | loop |

   Transitions crossfade (0.2–0.3 s). One-shots return to idle when finished. Missing clips are recorded in `actor.missing` and fall back to idle rather than T-posing.
4. **Resident brains** (`Characters.tsx`) pick activities from a daily schedule by phase (morning → work, day → work / favourite place / bench / plaza, evening → social, night → home and fade out), path with A* on the live navigation grid (`game/navigation/pathfinding.ts`), and stop to chat when two neighbours pass. Profession behaviour: Mia/Oliver/Theo interact, Felix/Noah pick up, Luna/Zara crouch, Ruby nods.
5. Portraits for UI are rendered from the same models (`rendering/thumbnails.ts`), posed on the idle clip.

## Adding a resident
1. Pick (or import) a rigged model compatible with one of the clip tables.
2. Add a `ResidentDef` in `src/data/residents.ts` (personality, favourites, arrival rule, dialogue, gift reactions, work action).
3. Optionally add story chapters in `src/data/progression.ts`.
4. Run `npm run assets:validate` (checks required clips) and `npm test`.

## Adding new animation clips
Import the GLB through the pipeline, then extend the `HUMANOID`/`ANIMAL` tables in `Actor.ts`. For Mixamo/Quaternius library clips on the Kenney rig, retarget in Blender (bone-name mapping) and export clips-only GLBs; verify in `/viewer.html` before wiring.

## Known limitations
- No bespoke talking/waving clips (substitutes listed above).
- No facial animation; expressions come from body clips and dialogue portraits.
- Player avatar customisation is limited to the four full-body variants actually available.
