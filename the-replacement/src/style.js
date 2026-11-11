// House palette and lighting states. See STYLE.md.

export const C = {
  // silhouettes
  ink: '#07090e', inkSoft: '#10141d', inkWarm: '#120c08',
  // the cold world
  night: '#060b15', navy: '#0e1a2e', deep: '#16263f', steel: '#22324a', slate: '#3a4d6b',
  fog: '#6f86a8', mist: '#a9bcd6', paleSky: '#d5deea', white: '#f4f7fb',
  // home / love
  ember: '#c2571f', tungsten: '#ff9a3d', amber: '#ffb561', honey: '#ffd08a', cream: '#ffeacc',
  // the Program / the replacement
  cyan: '#7fe7ff', cyanDeep: '#1fb6e0', ice: '#d6f4ff',
  // the lunchbox, and screen accents
  lunch: '#d8432a', lunchDark: '#8f2416', lunchLight: '#f0694a',
  alert: '#ff4d4f', ok: '#4ade80', gold: '#f5c542', sodium: '#ffa64d',
  policeRed: '#ff3b4a', policeBlue: '#3b6bff',
  // paper and pencil (the note)
  paper: '#efe6d3', paperShade: '#d9cdb4', pencil: '#4a4a55',
  // institutions
  govGreen: '#9db39a', govMid: '#5f7a66', govDark: '#22302a', officeGrey: '#c9d2dc', officeBlue: '#8fa3bd',
};

/**
 * Lighting states. Each gives the colours a set needs to paint itself and the colours the rig
 * needs to light a silhouette:
 *   sky[top, bottom]  backdrop gradient      wall / floor   base surface tones
 *   key               colour of the main light (also the rim-light colour on characters)
 *   fill              ambient / shadow tint  haze           atmosphere colour
 *   ink               silhouette colour in this light
 */
export const LOOK = {
  predawn:    { sky: ['#0b1526', '#1c2e4d'], wall: '#172640', floor: '#0c1524', key: '#7f9fd0', fill: '#1b2b47', haze: '#5f7fb0', ink: '#05070c' },
  greyMorning:{ sky: ['#8a9bb3', '#c3cedd'], wall: '#56677f', floor: '#2b3648', key: '#cfdcee', fill: '#3d4c63', haze: '#b9c6d8', ink: '#0a0d14' },
  officeDay:  { sky: ['#b9c6d6', '#e6edf5'], wall: '#8798ad', floor: '#465468', key: '#f1f6fc', fill: '#5d6d84', haze: '#dfe7f0', ink: '#0b0e15' },
  dusk:       { sky: ['#1d2b55', '#e0764a'], wall: '#33325a', floor: '#151528', key: '#ff9d5c', fill: '#2a2c55', haze: '#c97a6a', ink: '#07070f' },
  blueHour:   { sky: ['#0d1a3a', '#34508a'], wall: '#1a2a52', floor: '#0c142a', key: '#ffb561', fill: '#1d2f5e', haze: '#4a68a8', ink: '#05070e' },
  nightDark:  { sky: ['#04070e', '#0c1422'], wall: '#0b1320', floor: '#05080f', key: '#5c79a8', fill: '#0c1524', haze: '#2c3f5e', ink: '#020306' },
  warmDay:    { sky: ['#ffd9a0', '#fff1d6'], wall: '#d99a55', floor: '#6b3f1f', key: '#ffe2b0', fill: '#a8642e', haze: '#ffcf8f', ink: '#150c06' },
  corridor:   { sky: ['#1a2733', '#2c3d4b'], wall: '#27363f', floor: '#131c22', key: '#b8d6dc', fill: '#1d2a32', haze: '#6f8c95', ink: '#06090b' },
  policeNight:{ sky: ['#050913', '#101a30'], wall: '#111b30', floor: '#070b14', key: '#8aa2d0', fill: '#0f182b', haze: '#31456e', ink: '#030408' },
  gov:        { sky: ['#a9b8a6', '#d2dccb'], wall: '#7d927f', floor: '#3c4b40', key: '#e3efd9', fill: '#566a59', haze: '#c6d3bf', ink: '#0a0e0b' },
  rainNight:  { sky: ['#050a14', '#0f1b30'], wall: '#0e1828', floor: '#060a12', key: '#ffa64d', fill: '#0d1626', haze: '#3a4f72', ink: '#020408' },
  greyDawn:   { sky: ['#8794a6', '#c9d0d8'], wall: '#5a6676', floor: '#2f3742', key: '#e2e7ee', fill: '#465160', haze: '#bcc5cf', ink: '#0a0c11' },
  lampNight:  { sky: ['#050607', '#0d0b09'], wall: '#17110b', floor: '#0a0705', key: '#ffd08a', fill: '#1c140c', haze: '#7a5a30', ink: '#040302' },
  golden:     { sky: ['#ffc76b', '#fff0cf'], wall: '#e7a04e', floor: '#7a4a1e', key: '#fff0c4', fill: '#b06a2a', haze: '#ffd890', ink: '#160c05' },
};

/** World scale: pixels per centimetre at zoom 1. */
export const PX_PER_CM = 2.46;
export const ADULT_H = 430;
export const CHILD_H = 285;
export const FLOOR_Y = 700;
