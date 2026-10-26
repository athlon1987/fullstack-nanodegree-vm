// The curated selection of CC0 source models used by POCKETHOOD, with their runtime
// category and any palette-harmonisation overrides (material name -> hex colour).
// Source: Kenney + Quaternius packs, via the @netforge/asset-library-files npm mirror.

const NATURE = {
  leafsGreen: '#6cc04a',
  leafsDark: '#3e9a55',
  leafsFall: '#f0a640',
  grass: '#79c45a',
  woodBark: '#8a5a3b',
  woodBarkDark: '#6e4a33',
  woodBirch: '#efe4cf',
  dirt: '#b07d52',
  colorRed: '#ee5d57',
};

export const SELECTION = [
  // Characters — Kenney Mini Characters 1.0 (rigged, 32 clips)
  ...['a', 'b', 'c', 'd', 'e', 'f'].flatMap((v) => [
    { id: `mini_male_${v}`, category: 'characters' },
    { id: `mini_female_${v}`, category: 'characters' },
  ]),
  // Animals — Quaternius (rigged, species-specific clips)
  { id: 'cat', category: 'animals' },
  { id: 'pug', category: 'animals' },
  { id: 'shiba', category: 'animals' },
  { id: 'fox', category: 'animals' },
  { id: 'frog', category: 'animals' },
  // Nature — Kenney Nature Kit (palette harmonised)
  ...['tree_oak', 'tree_fat', 'tree_autumn', 'tree_pine', 'tree_pine_tall', 'tree_dark', 'tree_palm',
    'bush', 'bush_large', 'flower_red', 'rock_large', 'rock_small', 'rock_tall', 'stump', 'log',
    'mushroom_red', 'campfire', 'tent', 'column'].map((id) => ({ id, category: 'environment', overrides: NATURE })),
  // Decorations / props
  { id: 'fence', category: 'decorations', overrides: { wood: '#c98c55', woodDark: '#9c6a3e' } },
  { id: 'barrel', category: 'decorations' },
  { id: 'barrels', category: 'decorations' },
  { id: 'crate', category: 'decorations' },
  { id: 'chest', category: 'decorations' },
  { id: 'coin', category: 'decorations' },
  // Food Kit — product displays and icon renders
  ...['apple', 'banana', 'burger', 'cake', 'carrot', 'cheese', 'cookie', 'cupcake', 'donut', 'fries',
    'hot_dog', 'ice_cream', 'pizza', 'pumpkin', 'sushi', 'taco', 'watermelon', 'fish']
    .map((id) => ({ id, category: 'food' })),
  // Vehicles — Kenney Car Kit
  ...['sedan', 'van', 'delivery_van', 'taxi', 'truck', 'suv', 'hatchback_sports', 'tractor', 'delivery_flat']
    .map((id) => ({ id, category: 'vehicles' })),
];
