// POCKETHOOD design tokens — the single source of colour truth for both the 3D
// world (architecture kit, terrain, lighting) and the UI (mirrored in tokens.css).

export const PALETTE = {
  // Sky & water
  skyTop: '#7ec8e3',
  skyBottom: '#d6f0ef',
  water: '#5bbfd1',
  waterDeep: '#3a9bb5',
  // Ground
  grass: '#8fd16a',
  grassDark: '#6fb54f',
  grassLocked: '#b8c58f',
  earth: '#b98559',
  earthDark: '#8f6143',
  stone: '#d9d2c3',
  stoneDark: '#b4aa98',
  asphalt: '#6e7480',
  // Architecture: walls
  cream: '#f7ecd8',
  peach: '#f6cfae',
  butter: '#f8e2a0',
  powder: '#cfe3ef',
  mint: '#cdebd8',
  blush: '#f6d3d8',
  barn: '#c85a46',
  // Roofs
  terracotta: '#d9673f',
  coral: '#ec7d61',
  burgundy: '#a8434d',
  slate: '#5d6f8a',
  moss: '#6c8f5a',
  // Wood & trim
  wood: '#b67b4c',
  woodDark: '#8a5a37',
  trim: '#fffaf0',
  // Accents
  gold: '#f2b632',
  amber: '#f59f2e',
  teal: '#2fa59b',
  berry: '#d64f7a',
  sky: '#4f9de0',
  leaf: '#5fb84a',
  // UI surfaces
  ivory: '#fffaf0',
  paper: '#fbf3e4',
  ink: '#3d3226',
  inkSoft: '#7a6a58',
} as const;
