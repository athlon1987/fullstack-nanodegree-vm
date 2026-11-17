/**
 * Brand colours for places CSS cannot reach: the web app manifest, the generated icons and the
 * Open Graph image. Each value is a token from `src/app/globals.css` (light theme unless noted);
 * `brand.test.ts` fails if they drift apart.
 */
export const BRAND_COLORS = {
  /** `--color-page`: splash screen and browser chrome. */
  page: '#faf5ea',
  /** `--color-primary`: icon tile. */
  primary: '#252a6c',
  /** `--color-on-primary`: the mark on the tile. */
  onPrimary: '#fbf6ea',
  /** `--color-gold` (dark theme): the lozenge on the indigo tile. */
  goldOnDark: '#d2ac62',
  /** `--color-page` (dark theme). */
  pageDark: '#0c0e24',
} as const;

/** Icon files in `src/app` (generated from the brand mark; see the platform hand-off). */
export const APP_ICONS = {
  /** Rounded tile, transparent corners, for `purpose: any`. */
  any192: '/icon1.png',
  any512: '/icon2.png',
  /** Full-bleed tile with the mark inside the safe zone: Apple touch icon and maskable icon. */
  maskable512: '/apple-icon.png',
} as const;
