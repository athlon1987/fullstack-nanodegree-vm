// Approved vocabularies. Content (worlds, modules) may only *name* things from these
// lists; the code that draws, plays or runs them lives in the client and is reviewed.
// Adding an entry here is a code change (and an App Store binary update), by design.

/** Icon keys drawn by src/ui/components/Icon.tsx. */
export const ICONS = [
  'coffee', 'bread', 'flowers', 'berries', 'vegetables', 'breakfast', 'pie', 'bouquet', 'crown', 'planks', 'bricks', 'chair',
  'basket', 'jam', 'teh', 'kopi', 'nasi_lemak', 'roti_bakar', 'kelapa', 'kaya', 'pisang', 'hibiscus', 'kuih', 'herbs', 'chili',
  'sapling', 'fish', 'book', 'car', 'leaf', 'garland', 'egg', 'rice', 'cup',
] as const;

/** Architecture-kit archetypes a world may assign to a core building. */
export const ARCHETYPES = [
  'starter_house', 'cottage', 'townhouse', 'cafe', 'bakery', 'garden', 'flower_shop', 'workshop', 'grocery', 'park', 'town_hall',
  'request_board', 'welcome_sign', 'pond', 'fountain', 'showroom', 'learning_centre',
  'my:rumah_kampung', 'my:rumah_papan', 'my:rumah_teres', 'my:shoplot', 'my:kedai_roti', 'my:kedai_bunga', 'my:bengkel',
  'my:kedai_runcit', 'my:taman', 'my:balai_raya', 'my:papan_kenyataan', 'my:gerbang', 'my:tasik', 'my:pondok',
  'my:showroom', 'my:pusat_belajar', 'my:kebun',
  // Modern Klang Valley kit (src/rendering/kit/urban.ts)
  'kl:terrace', 'kl:semid', 'kl:condo', 'kl:shoplot_cafe', 'kl:dessert', 'kl:urban_garden', 'kl:florist', 'kl:makerspace',
  'kl:minimart', 'kl:ev_showroom', 'kl:learning', 'kl:park', 'kl:community_centre', 'kl:notice', 'kl:gateway', 'kl:lake',
  'kl:fountain', 'kl:mamak', 'kl:coworking', 'kl:mall', 'kl:school', 'kl:clinic_row', 'kl:petrol',
] as const;

/** Prefabs a module may dress its building with (each takes the module's palette and sign). */
export const PREFABS = ['shoplot', 'kopitiam', 'showroom_glass', 'learning_house', 'community_garden', 'hawker_stall', 'cafe_cottage'] as const;

/** Small props a module may scatter around its building. */
export const PROPS = ['marble_table', 'round_stool', 'menu_stand', 'potted_plant', 'bicycle', 'banner', 'bookshelf', 'flag', 'trellis', 'water_tank', 'tyre_stack', 'lantern'] as const;

/** Rigged character models (Kenney Mini Characters, CC0). */
export const CHARACTER_MODELS = [
  'mini_female_a', 'mini_female_b', 'mini_female_c', 'mini_female_d', 'mini_female_e', 'mini_female_f',
  'mini_male_a', 'mini_male_b', 'mini_male_c', 'mini_male_d', 'mini_male_e', 'mini_male_f',
] as const;

/** Unbranded vehicle models a showroom may display (Kenney Car Kit, CC0). */
export const VEHICLE_MODELS = ['sedan', 'suv', 'hatchback_sports', 'van', 'taxi', 'delivery_van', 'truck'] as const;

/** Steps a hand-preparation mini-game can ask for (each has an animation + sound). */
export const PREP_STEPS = ['pour', 'pull', 'stir', 'toast', 'spread', 'fold', 'crack', 'steam', 'wrap', 'scoop', 'sprinkle', 'serve'] as const;

/** Procedural ambience beds the audio engine can synthesise. */
export const AMBIENT_SOUNDS = ['kopitiam_chatter', 'garden_birds', 'showroom_hum', 'classroom_murmur', 'none'] as const;

/** Content categories (used for review routing and player-facing filters). */
export const CATEGORIES = ['food_beverage', 'retail', 'automotive', 'education', 'community', 'hospitality', 'agriculture', 'residential', 'recreation'] as const;

/** Hosts an "official link" may point to (exact host match, https only). Empty until a partner is verified. */
export const LINK_HOST_ALLOWLIST: readonly string[] = [];

/** Hosts remote content and module assets may be fetched from (besides same-origin). */
export const CONTENT_HOST_ALLOWLIST: readonly string[] = [];

export const TRAITS = ['sociable', 'creative', 'energetic', 'calm', 'curious', 'organised', 'warm', 'adventurous'] as const;
export const WORK_ACTIONS = ['interact', 'pick-up', 'emote-yes', 'crouch'] as const;
export const PANELS = ['build', 'orders', 'quests', 'residents', 'inventory', 'pulse', 'community', 'events', 'map', 'history', 'achievements', 'settings'] as const;
