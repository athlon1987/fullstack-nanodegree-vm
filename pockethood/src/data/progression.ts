import type {
  AchievementDef,
  CommunityProjectDef,
  EventDef,
  ExpansionDef,
  LevelDef,
  QuestDef,
  StoryChapterDef,
} from '../game/core/types';

// ─── Player levels ────────────────────────────────────────────────────────────

const LEVEL_XP = [0, 30, 120, 300, 600, 1000, 1550, 2250, 3150, 4250];
const LEVEL_UNLOCKS: Record<number, string[]> = {
  1: ['Starter House', 'Mia’s Café', 'Paths, trees & flower beds'],
  2: ['Bakery', 'Community Garden', 'Benches & street lamps'],
  3: ['Workshop', 'Flower Shop', 'Cottage', 'Learning Centre', 'Fountain community project'],
  4: ['Pocket Park', 'Car Showroom', 'Land expansion', 'Maple trees', 'Spring Blossom Festival'],
  5: ['Grocery Shop', 'Theo the architect arrives'],
  6: ['Townhouse'],
  7: ['Town Hall'],
  8: ['Second Community Garden'],
  9: ['More land plots'],
  10: ['Town Hall enhancement'],
};

export const LEVELS: LevelDef[] = Array.from({ length: 30 }, (_, i) => {
  const level = i + 1;
  const xp = i < LEVEL_XP.length ? LEVEL_XP[i] : LEVEL_XP[LEVEL_XP.length - 1] + (i - LEVEL_XP.length + 1) * 1500;
  return { level, xp, unlocks: LEVEL_UNLOCKS[level] ?? ['Bigger order rewards'] };
});

export const MAX_LEVEL = LEVELS.length;

// ─── Main progression quests (the first six form the guided tutorial) ────────

export const QUESTS: QuestDef[] = [
  {
    id: 'welcome',
    title: 'Welcome Home',
    giver: 'mia',
    intro: 'Hi there, neighbor! I’m Mia. Your house has been collecting rent while you unpacked — tap the coins above it!',
    outro: 'See? This little place is already looking after you.',
    objectives: [{ type: 'counter', counter: 'collect:any', n: 1, label: 'Collect rent from your house' }],
    reward: { coins: 20, xp: 5 },
    tutorial: true,
    focus: { building: 'starter_house' },
  },
  {
    id: 'open_cafe',
    title: 'A Dream of Coffee',
    giver: 'mia',
    intro: 'Can I tell you a secret? I’ve always dreamed of opening a café. There’s an empty lot right by your house… would you help me build it?',
    outro: 'My very own café! I… I might cry. Thank you!',
    objectives: [{ type: 'build', building: 'cafe', n: 1, label: 'Build Mia’s Café' }],
    reward: { coins: 20, xp: 10 },
    after: ['welcome'],
    tutorial: true,
    focus: { building: 'cafe', panel: 'build' },
  },
  {
    id: 'first_brew',
    title: 'First Brew',
    giver: 'mia',
    intro: 'Let’s fire up the espresso machine! Tap the café and start brewing coffee.',
    outro: 'Smell that? That’s the smell of a neighborhood waking up.',
    objectives: [{ type: 'counter', counter: 'produce:coffee', n: 3, label: 'Brew and collect 3 Coffee' }],
    reward: { coins: 15, xp: 8 },
    after: ['open_cafe'],
    tutorial: true,
    focus: { building: 'cafe' },
  },
  {
    id: 'first_order',
    title: 'Our First Customer',
    giver: 'mia',
    intro: 'Someone pinned a request on the board! Open Orders and deliver it.',
    outro: 'Our first happy customer! You’re a natural.',
    objectives: [{ type: 'counter', counter: 'orders', n: 1, label: 'Complete a neighborhood order' }],
    reward: { coins: 25, xp: 10 },
    after: ['first_brew'],
    tutorial: true,
    focus: { panel: 'orders' },
  },
  {
    id: 'cafe_upgrade',
    title: 'Room to Grow',
    giver: 'mia',
    intro: 'People keep asking to sit outside… What if we upgraded the café with a terrace?',
    outro: 'A terrace! With parasols! This is the best day ever.',
    objectives: [{ type: 'upgrade', building: 'cafe', level: 2, label: 'Upgrade the café to level 2' }],
    reward: { coins: 60, xp: 15 },
    after: ['first_order'],
    tutorial: true,
    focus: { building: 'cafe' },
  },
  {
    id: 'meet_luna',
    title: 'Something Green',
    giver: 'mia',
    intro: 'My friend Luna is a gardener. If we built a Community Garden, she’d move here in a heartbeat!',
    outro: 'Luna’s here! The neighborhood is growing.',
    objectives: [{ type: 'build', building: 'garden', n: 1, label: 'Build a Community Garden' }],
    reward: { coins: 40, xp: 10 },
    after: ['cafe_upgrade'],
    tutorial: true,
    minLevel: 2,
    focus: { building: 'garden', panel: 'build' },
  },
  {
    id: 'bakery',
    title: 'Fresh Bread',
    giver: 'mia',
    intro: 'A café needs pastries! A baker named Felix is looking for a shop.',
    outro: 'Felix is already kneading dough. What a smell!',
    objectives: [{ type: 'build', building: 'bakery', n: 1, label: 'Build the Bakery' }],
    reward: { coins: 50, xp: 12 },
    after: ['meet_luna'],
  },
  {
    id: 'decorate',
    title: 'Make It Yours',
    giver: 'luna',
    intro: 'A neighborhood should look like the people who live in it. Add some trees, flowers or paths!',
    outro: 'It’s starting to feel like home.',
    objectives: [{ type: 'counter', counter: 'decor', n: 5, label: 'Place 5 decorations' }],
    reward: { coins: 40, xp: 12 },
    after: ['meet_luna'],
  },
  {
    id: 'spruce_park',
    title: 'The Overgrown Corner',
    giver: 'luna',
    intro: 'See that overgrown corner past the trees? The whole street is chipping in to turn it into a little park. Shall we help clear it?',
    outro: 'Look at it already! Everyone noticed — that’s what neighbours do.',
    objectives: [{ type: 'counter', counter: 'spruce_stage:park', n: 1, label: 'Help clear the Pocket Park' }],
    reward: { coins: 20, xp: 15 },
    after: ['decorate'],
    minLevel: 2,
    focus: { panel: 'community' },
  },
  {
    id: 'park_done',
    title: 'A Park for Everyone',
    giver: 'luna',
    intro: 'Flowers, benches, and then a picnic to open it. One step at a time — give whenever you have something spare.',
    outro: 'A picnic in our own park! Thank you for making this happen together.',
    objectives: [{ type: 'counter', counter: 'spot_done:park', n: 1, label: 'Finish the Pocket Park' }],
    reward: { xp: 40 },
    after: ['spruce_park'],
    minLevel: 2,
  },
  {
    id: 'orders_5',
    title: 'Good Neighbors',
    giver: 'felix',
    intro: 'The request board is busy! Help everyone out.',
    outro: 'Word is spreading — people love it here.',
    objectives: [{ type: 'counter', counter: 'orders', n: 5, label: 'Complete 5 orders' }],
    reward: { coins: 60, xp: 15 },
    after: ['bakery'],
  },
  {
    id: 'workshop',
    title: 'Tools of the Trade',
    giver: 'felix',
    intro: 'Upgrades need planks and bricks. My friend Oliver could run a workshop!',
    outro: 'Oliver’s sawing already. Upgrades, here we come!',
    objectives: [{ type: 'build', building: 'workshop', n: 1, label: 'Build the Workshop' }],
    reward: { coins: 60, xp: 15 },
    after: ['bakery'],
    minLevel: 3,
  },
  {
    id: 'flower_shop',
    title: 'Say It With Flowers',
    giver: 'luna',
    intro: 'With a flower shop I could make bouquets for everyone!',
    outro: 'Bouquets for every doorstep!',
    objectives: [{ type: 'build', building: 'flower_shop', n: 1, label: 'Build the Flower Shop' }],
    reward: { coins: 70, xp: 15 },
    after: ['meet_luna'],
    minLevel: 3,
  },
  {
    id: 'cottage',
    title: 'A New Neighbor',
    giver: 'mia',
    intro: 'Noah the delivery rider is looking for a home. A cottage would be perfect!',
    outro: 'Welcome, Noah!',
    objectives: [{ type: 'build', building: 'cottage', n: 1, label: 'Build a Cottage' }],
    reward: { coins: 80, xp: 20 },
    after: ['workshop'],
    minLevel: 3,
  },
  {
    id: 'fountain',
    title: 'Together We Build',
    giver: 'mia',
    intro: 'Everyone’s talking about building a fountain in the plaza. Let’s start the community project!',
    outro: 'Our fountain! Built by everyone, for everyone.',
    objectives: [{ type: 'counter', counter: 'contribute', n: 3, label: 'Contribute to the fountain project 3 times' }],
    reward: { coins: 60, xp: 20 },
    after: ['workshop'],
    minLevel: 3,
  },
  {
    id: 'park',
    title: 'A Place to Gather',
    giver: 'luna',
    intro: 'A park would give everyone a place to slow down. And Ruby has ideas…',
    outro: 'Ruby’s already hanging bunting!',
    objectives: [{ type: 'build', building: 'park', n: 1, label: 'Build the Pocket Park' }],
    reward: { coins: 90, xp: 25 },
    after: ['cottage'],
    minLevel: 4,
  },
  {
    id: 'expand',
    title: 'Beyond the Hedges',
    giver: 'oliver',
    intro: 'We’re running out of room! Let’s clear a new plot of land.',
    outro: 'So much space! The possibilities…',
    objectives: [{ type: 'counter', counter: 'expand', n: 1, label: 'Unlock a new plot of land' }],
    reward: { coins: 100, xp: 25 },
    after: ['park'],
    minLevel: 4,
  },
  {
    id: 'grocery',
    title: 'Market Day',
    giver: 'felix',
    intro: 'With all this produce, we need a proper grocery shop.',
    outro: 'The market is open!',
    objectives: [{ type: 'build', building: 'grocery', n: 1, label: 'Build the Grocery Shop' }],
    reward: { coins: 120, xp: 30 },
    after: ['expand'],
    minLevel: 5,
  },
  {
    id: 'townhouse',
    title: 'Room With a View',
    giver: 'theo',
    intro: 'A photographer named Zara wants to move here. She needs light — a townhouse!',
    outro: 'Zara’s already photographing the sunset.',
    objectives: [{ type: 'build', building: 'townhouse', n: 1, label: 'Build a Townhouse' }],
    reward: { coins: 150, xp: 35 },
    after: ['grocery'],
    minLevel: 6,
  },
  {
    id: 'town_hall',
    title: 'Heart of the Hood',
    giver: 'theo',
    intro: 'Every great neighborhood has a heart. I’ve drawn up plans for a Town Hall.',
    outro: 'A Town Hall! We’re officially a real neighborhood.',
    objectives: [{ type: 'build', building: 'town_hall', n: 1, label: 'Build the Town Hall' }],
    reward: { coins: 300, gems: 5, xp: 60 },
    after: ['townhouse'],
    minLevel: 7,
  },
];

// ─── Resident story chapters ──────────────────────────────────────────────────

export const STORIES: StoryChapterDef[] = [
  {
    id: 'mia_1',
    resident: 'mia',
    title: 'A Cup for Everyone',
    minFriendship: 0,
    requires: { quest: 'cafe_upgrade' },
    intro: 'I want everyone in the neighborhood to taste my coffee. Could you bring me 4 cups to hand out?',
    outro: 'Everyone loved it! I’m putting up a chalkboard menu so people know we’re open.',
    objectives: [{ type: 'deliver', items: { coffee: 4 }, to: 'mia', label: 'Bring Mia 4 Coffee' }],
    reward: { coins: 40, xp: 10, friendship: { resident: 'mia', points: 6 } },
    memory: 'mia_regulars',
    worldChange: 'A chalkboard menu appears outside the café.',
    flag: 'cafe_chalkboard',
  },
  {
    id: 'mia_2',
    resident: 'mia',
    title: 'Brunch Plans',
    minFriendship: 2,
    requires: { chapter: 'mia_1' },
    intro: 'Felix and I want to host the neighborhood’s first brunch! We need 2 Breakfast Sets to test the menu.',
    outro: 'The brunch was perfect. Here — a parasol for your own garden. You earned it.',
    objectives: [{ type: 'deliver', items: { breakfast: 2 }, to: 'mia', label: 'Bring Mia 2 Breakfast Sets' }],
    reward: { coins: 80, xp: 20, unlocks: ['parasol'], friendship: { resident: 'mia', points: 8 } },
    memory: 'mia_brunch',
    worldChange: 'Brunch tables now line the café terrace.',
    flag: 'cafe_brunch',
  },
  {
    id: 'mia_3',
    resident: 'mia',
    title: 'The Heart of the Hood',
    minFriendship: 3,
    requires: { chapter: 'mia_2' },
    intro: 'I want to thank everyone who made this place special. A pie and a bouquet on every table…',
    outro: 'You’ve made this neighborhood a home. For me and for everyone.',
    objectives: [{ type: 'deliver', items: { berry_pie: 1, bouquet: 1 }, to: 'mia', label: 'Bring Mia a Berry Pie and a Bouquet' }],
    reward: { gems: 5, xp: 30, unlocks: ['lantern_string'], friendship: { resident: 'mia', points: 10 } },
    memory: 'mia_heart',
    worldChange: 'Lantern posts are now available to brighten your streets.',
  },
  {
    id: 'felix_1',
    resident: 'felix',
    title: 'Grandma’s Recipe',
    minFriendship: 0,
    requires: { building: 'bakery' },
    intro: 'My grandmother’s berry pie… I need fresh berries to get it just right. Bring me 2?',
    outro: 'That’s it! That’s HER pie. I’m adding it to the sign out front.',
    objectives: [{ type: 'deliver', items: { berries: 2 }, to: 'felix', label: 'Bring Felix 2 Berries' }],
    reward: { coins: 50, xp: 12, friendship: { resident: 'felix', points: 6 } },
    memory: 'felix_pie',
    worldChange: 'The bakery sign now shows a pie.',
    flag: 'bakery_pie_sign',
  },
  {
    id: 'felix_2',
    resident: 'felix',
    title: 'Bake Sale',
    minFriendship: 2,
    requires: { chapter: 'felix_1' },
    intro: 'Let’s hold a bake sale for the neighborhood! I need 5 Bread and 3 Coffee for the table.',
    outro: 'Sold out in an hour! Here, take the pie stand — set it up wherever you like.',
    objectives: [{ type: 'deliver', items: { bread: 5, coffee: 3 }, to: 'felix', label: 'Bring Felix 5 Bread and 3 Coffee' }],
    reward: { coins: 100, xp: 20, unlocks: ['pie_stand'], friendship: { resident: 'felix', points: 8 } },
    memory: 'felix_bakesale',
  },
  {
    id: 'luna_1',
    resident: 'luna',
    title: 'First Sprouts',
    minFriendship: 0,
    requires: { building: 'garden' },
    intro: 'The soil here is wonderful. Help me harvest the first flowers?',
    outro: 'Look at them! The garden is truly alive now.',
    objectives: [{ type: 'counter', counter: 'produce:flowers', n: 6, label: 'Harvest 6 Flowers' }],
    reward: { coins: 40, xp: 10, friendship: { resident: 'luna', points: 6 } },
    memory: 'opened_garden',
  },
  {
    id: 'luna_2',
    resident: 'luna',
    title: 'Blooming Street',
    minFriendship: 1,
    requires: { chapter: 'luna_1' },
    intro: 'Imagine flowers along every path… Could you plant 3 flower beds?',
    outro: 'The butterflies found them already! Here, a bird bath — the birds deserve a treat too.',
    objectives: [{ type: 'counter', counter: 'decor:flower_bed', n: 3, label: 'Place 3 Flower Beds' }],
    reward: { coins: 60, xp: 15, unlocks: ['birdbath'], friendship: { resident: 'luna', points: 8 } },
    memory: 'luna_blooming',
    worldChange: 'Butterflies now gather around your flower beds.',
    flag: 'butterflies',
  },
  {
    id: 'luna_3',
    resident: 'luna',
    title: 'A Bouquet for a Friend',
    minFriendship: 2,
    requires: { chapter: 'luna_2', building: 'flower_shop' },
    intro: 'Mia’s been working so hard. Let’s surprise her — bring me 2 bouquets?',
    outro: 'She cried happy tears. You’re a wonderful friend.',
    objectives: [{ type: 'deliver', items: { bouquet: 2 }, to: 'luna', label: 'Bring Luna 2 Bouquets' }],
    reward: { gems: 3, xp: 20, friendship: { resident: 'luna', points: 10 } },
    memory: 'luna_bouquet',
  },
  {
    id: 'oliver_1',
    resident: 'oliver',
    title: 'Sawdust & Sunshine',
    minFriendship: 0,
    requires: { building: 'workshop' },
    intro: 'Let’s get this workshop humming. Cut 4 planks with me?',
    outro: 'Now that’s a stack to be proud of!',
    objectives: [{ type: 'counter', counter: 'produce:planks', n: 4, label: 'Produce 4 Planks' }],
    reward: { coins: 60, xp: 12, friendship: { resident: 'oliver', points: 6 } },
    memory: 'opened_workshop',
  },
  {
    id: 'ruby_1',
    resident: 'ruby',
    title: 'Party in the Park',
    minFriendship: 0,
    requires: { building: 'park' },
    intro: 'Opening party! I need a bouquet for the stage and 3 coffees for the volunteers.',
    outro: 'Best. Opening. Ever. The park is officially open!',
    objectives: [{ type: 'deliver', items: { bouquet: 1, coffee: 3 }, to: 'ruby', label: 'Bring Ruby a Bouquet and 3 Coffee' }],
    reward: { coins: 90, xp: 20, friendship: { resident: 'ruby', points: 8 } },
    memory: 'opened_park',
    flag: 'park_bunting',
    worldChange: 'Bunting is strung across the park.',
  },
];

// ─── Land expansion: a 4×4 grid of 6×6 plots; the central four start unlocked ──

export const PLOT_SIZE = 6;
export const WORLD_CELLS = 24;
export const START_PLOTS = ['p11', 'p21', 'p12', 'p22'];

export const EXPANSIONS: ExpansionDef[] = (() => {
  const out: ExpansionDef[] = [];
  const names = ['Meadow', 'Orchard', 'Brookside', 'Hilltop', 'Mill Lane', 'Willow End', 'Sunny Corner', 'Old Oak', 'Riverside', 'Lantern Row', 'Clover Patch', 'Fox Hollow'];
  let n = 0;
  for (let pz = 0; pz < 4; pz++)
    for (let px = 0; px < 4; px++) {
      const id = `p${px}${pz}`;
      if (START_PLOTS.includes(id)) continue;
      const ring = Math.max(Math.abs(px - 1.5), Math.abs(pz - 1.5)) > 1.5 ? 2 : 1;
      const adjacent = [
        [px - 1, pz],
        [px + 1, pz],
        [px, pz - 1],
        [px, pz + 1],
      ]
        .filter(([a, b]) => a >= 0 && a < 4 && b >= 0 && b < 4)
        .map(([a, b]) => `p${a}${b}`);
      out.push({
        id,
        name: names[n++ % names.length],
        rect: [px * PLOT_SIZE, pz * PLOT_SIZE, PLOT_SIZE, PLOT_SIZE],
        cost: ring === 1 ? { coins: 350 } : { coins: 900, items: { planks: 4 } },
        minLevel: ring === 1 ? 4 : 9,
        adjacentTo: adjacent,
      });
    }
  return out;
})();

/** Each successive plot costs more, so expansion stays a meaningful choice. */
export const expansionCost = (def: ExpansionDef, alreadyUnlocked: number) => {
  const factor = Math.pow(1.35, Math.max(0, alreadyUnlocked - START_PLOTS.length));
  return {
    coins: Math.round(((def.cost.coins ?? 0) * factor) / 10) * 10,
    items: def.cost.items,
  };
};

// ─── Community project ────────────────────────────────────────────────────────

export const COMMUNITY_PROJECTS: CommunityProjectDef[] = [
  {
    id: 'fountain',
    name: 'Neighborhood Fountain',
    description: 'The whole neighborhood is chipping in to build a fountain in the plaza. Residents add what they can; your contributions make the difference.',
    requirements: { coins: 300, planks: 5, flowers: 8, bread: 6 },
    stages: [
      { at: 0.25, label: 'Foundations laid' },
      { at: 0.5, label: 'Basin built' },
      { at: 0.75, label: 'Statue placed' },
      { at: 1, label: 'Water flowing!' },
    ],
    reward: { coins: 150, gems: 5, xp: 40, unlocks: ['statue'] },
    minLevel: 3,
    flag: 'fountain_complete',
  },
];

// ─── Events ───────────────────────────────────────────────────────────────────

export const EVENTS: EventDef[] = [
  {
    id: 'blossom_festival',
    name: 'Flower Festival',
    description: 'Ruby and Luna are filling the streets with flowers! Join in at your own pace — every goal you reach adds festival rewards.',
    minLevel: 4,
    durationDays: 4,
    objectives: [
      { type: 'counter', counter: 'produce:flowers', n: 20, label: 'Harvest 20 Flowers' },
      { type: 'counter', counter: 'decor:flower_bed', n: 4, label: 'Plant 4 Flower Beds' },
      { type: 'counter', counter: 'produce:bouquet', n: 3, label: 'Tie 3 Bouquets' },
      { type: 'counter', counter: 'orders', n: 8, label: 'Complete 8 Orders' },
    ],
    tiers: [
      { at: 1, reward: { coins: 60, xp: 10 }, label: 'Petal Prize' },
      { at: 2, reward: { coins: 100, unlocks: ['lantern_string'] }, label: 'Lantern Post' },
      { at: 3, reward: { gems: 5, xp: 25 }, label: 'Gem Bouquet' },
      { at: 4, reward: { unlocks: ['festival_arch'], xp: 40 }, label: 'Blossom Arch' },
    ],
  },
  {
    id: 'street_food_day',
    name: 'Street Food Day',
    description: 'Tables line the street and everyone brings something tasty to share. Cook, serve and taste your way through the day.',
    minLevel: 3,
    durationDays: 3,
    objectives: [
      { type: 'counter', counter: 'produce:coffee', n: 10, label: 'Brew 10 Coffees' },
      { type: 'counter', counter: 'produce:bread', n: 8, label: 'Bake 8 Breads' },
      { type: 'counter', counter: 'orders', n: 6, label: 'Serve 6 Orders' },
    ],
    tiers: [
      { at: 1, reward: { xp: 15, coins: 40 }, label: 'First Bite' },
      { at: 2, reward: { xp: 25, gems: 2 }, label: 'Full Table' },
      { at: 3, reward: { xp: 40, gems: 3 }, label: 'Feast for Everyone' },
    ],
  },
  {
    id: 'music_night',
    name: 'Neighbourhood Music Night',
    description: 'Someone brought a guitar, someone else a drum. Light up the lanes, chat with neighbours and enjoy the music.',
    minLevel: 4,
    durationDays: 2,
    objectives: [
      { type: 'counter', counter: 'talk', n: 5, label: 'Chat with neighbours 5 times' },
      { type: 'counter', counter: 'decor:lamp', n: 2, label: 'Place 2 Street Lamps' },
      { type: 'counter', counter: 'orders', n: 4, label: 'Complete 4 Orders' },
    ],
    tiers: [
      { at: 1, reward: { xp: 15 }, label: 'Warm-Up' },
      { at: 2, reward: { xp: 25, gems: 2 }, label: 'Encore' },
      { at: 3, reward: { xp: 40, gems: 3 }, label: 'Standing Ovation' },
    ],
  },
  {
    id: 'garden_party',
    name: 'Garden Party',
    description: 'The new pocket park is ready for its first party: flowers on every table, little gifts and a lot of laughter.',
    minLevel: 2,
    durationDays: 2,
    requires: 'spot_park',
    objectives: [
      { type: 'counter', counter: 'produce:flowers', n: 12, label: 'Grow 12 Flowers' },
      { type: 'counter', counter: 'gift', n: 3, label: 'Give 3 gifts' },
      { type: 'counter', counter: 'photo', n: 1, label: 'Take a party photo' },
    ],
    tiers: [
      { at: 1, reward: { xp: 15 }, label: 'Party Hats' },
      { at: 2, reward: { xp: 25, gems: 2 }, label: 'Garden Games' },
      { at: 3, reward: { xp: 40, gems: 3 }, label: 'Best Party Ever' },
    ],
  },
  {
    id: 'community_market',
    name: 'Community Market',
    description: 'Stalls fill the new plaza: homemade jam, fresh bread and neighbours swapping stories. Bring your best goods!',
    minLevel: 3,
    durationDays: 3,
    requires: 'spot_plaza',
    objectives: [
      { type: 'counter', counter: 'orders', n: 8, label: 'Complete 8 Orders' },
      { type: 'counter', counter: 'produce:jam', n: 3, label: 'Make 3 Jams' },
      { type: 'counter', counter: 'spruce', n: 3, label: 'Help a shared spot 3 times' },
    ],
    tiers: [
      { at: 1, reward: { xp: 20 }, label: 'Open for Business' },
      { at: 2, reward: { xp: 30, gems: 2 }, label: 'Busy Stalls' },
      { at: 3, reward: { xp: 50, gems: 4 }, label: 'Market Favourite' },
    ],
  },
  {
    id: 'pet_parade',
    name: 'Pet Parade',
    description: 'Bows, bandanas and a very proud parade around the playground. Treat the pets and cheer them on!',
    minLevel: 5,
    durationDays: 2,
    requires: 'spot_playground',
    objectives: [
      { type: 'counter', counter: 'pet', n: 3, label: 'Treat the pets 3 times' },
      { type: 'counter', counter: 'photo', n: 2, label: 'Take 2 parade photos' },
      { type: 'counter', counter: 'talk', n: 4, label: 'Cheer with 4 neighbours' },
    ],
    tiers: [
      { at: 1, reward: { xp: 20 }, label: 'Wagging Tails' },
      { at: 2, reward: { xp: 30, gems: 2 }, label: 'Best in Show' },
      { at: 3, reward: { xp: 50, gems: 4 }, label: 'Parade Champions' },
    ],
  },
  {
    id: 'movie_night',
    name: 'Outdoor Movie Night',
    description: 'A screen goes up at the lookout. Snacks, blankets and a funny old film under the stars.',
    minLevel: 7,
    durationDays: 2,
    requires: 'spot_lookout',
    objectives: [
      { type: 'counter', counter: 'produce:coffee', n: 6, label: 'Brew 6 Coffees for the crowd' },
      { type: 'counter', counter: 'produce:berry_pie', n: 2, label: 'Bake 2 Pies' },
      { type: 'counter', counter: 'talk', n: 5, label: 'Invite 5 neighbours' },
    ],
    tiers: [
      { at: 1, reward: { xp: 25 }, label: 'Popcorn' },
      { at: 2, reward: { xp: 40, gems: 2 }, label: 'Front Row' },
      { at: 3, reward: { xp: 60, gems: 4 }, label: 'Under the Stars' },
    ],
  },
  {
    id: 'anniversary',
    name: 'Town Anniversary',
    description: 'Another year of the neighbourhood! Everyone pitches in to make it look its very best for the big day.',
    minLevel: 6,
    durationDays: 3,
    objectives: [
      { type: 'counter', counter: 'orders', n: 10, label: 'Complete 10 Orders' },
      { type: 'counter', counter: 'spruce', n: 5, label: 'Help shared spots 5 times' },
      { type: 'counter', counter: 'gift', n: 4, label: 'Give 4 gifts' },
      { type: 'counter', counter: 'upgrade', n: 1, label: 'Upgrade a building' },
    ],
    tiers: [
      { at: 1, reward: { xp: 25 }, label: 'Bunting Up' },
      { at: 2, reward: { xp: 40, gems: 2 }, label: 'Cake Cut' },
      { at: 4, reward: { xp: 80, gems: 5 }, label: 'Best Year Yet' },
    ],
  },
];

// ─── Achievements ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_build', name: 'Groundbreaker', description: 'Construct your first building.', counter: 'build:any', n: 1, reward: { gems: 1 } },
  { id: 'first_upgrade', name: 'Fixer-Upper', description: 'Upgrade a building.', counter: 'upgrade', n: 1, reward: { gems: 1 } },
  { id: 'first_delivery', name: 'Special Delivery', description: 'Complete your first order.', counter: 'orders', n: 1, reward: { gems: 1 } },
  { id: 'decor_10', name: 'Interior… Exterior Designer', description: 'Place 10 decorations.', counter: 'decor', n: 10, reward: { gems: 2 } },
  { id: 'friend_first', name: 'Kindred Spirit', description: 'Become Friends with a resident.', check: 'friend', n: 1, reward: { gems: 2 } },
  { id: 'expand_1', name: 'Pioneer', description: 'Unlock a new plot of land.', counter: 'expand', n: 1, reward: { gems: 2 } },
  { id: 'produce_50', name: 'Busy Bee', description: 'Collect 50 goods.', counter: 'produce:any', n: 50, reward: { gems: 2 } },
  { id: 'produce_250', name: 'Local Industry', description: 'Collect 250 goods.', counter: 'produce:any', n: 250, reward: { gems: 5 } },
  { id: 'orders_25', name: 'Pillar of the Community', description: 'Complete 25 orders.', counter: 'orders', n: 25, reward: { gems: 3 } },
  { id: 'photo_1', name: 'Say Cheese', description: 'Take a photo of your neighborhood.', counter: 'photo', n: 1, reward: { gems: 1 } },
  { id: 'landmark', name: 'Built Together', description: 'Complete a community landmark.', check: 'landmark', n: 1, reward: { gems: 3 } },
  { id: 'story_3', name: 'Storyteller', description: 'Complete 3 resident story chapters.', counter: 'story', n: 3, reward: { gems: 3 } },
];
