/**
 * Self-hosted typefaces (latin subsets, variable). One definitions file: every `localFont()`
 * call is a separately hosted instance, so import the objects from here and nowhere else.
 *
 *   sans      Hanken Grotesk   headings (`type-display-*`, `type-title-*`, `font-heading`) and all
 *                              interface text (`font-sans`, the default). Direction v2: big,
 *                              confident display type is set in this face, 650 with tight tracking.
 *   wordmark  Fraunces         the header and footer wordmark only (`font-wordmark`): a static
 *                              instance (opsz 144, weight 520) holding just the glyphs of
 *                              "Malaysia Airports", 2 KB
 *   serif     Fraunces         rare editorial accents (`type-serif-*`, `font-serif`, `font-display`):
 *                              the design-system page and the 404 page's Malay line
 *   mono      Geist Mono       times, gates, codes and tables (`type-data-*`, `font-mono`): Basic
 *                              Latin and the punctuation the site sets in it, 14 KB
 *
 * The root layout puts `fontVariables` on <html>; `globals.css` maps the CSS variables to the
 * `--font-heading`, `--font-sans`, `--font-wordmark`, `--font-serif` / `--font-display` and
 * `--font-mono` tokens.
 *
 * Redesign 1c (verification SA5 item 1, hero LCP): every first screen used to preload Fraunces
 * (67 KB) for the 17 letters of the wordmark, and Lighthouse's simulation charges an image LCP for
 * every byte that arrives before the first paint. Now only Hanken (35 KB) and the 2 KB wordmark
 * are preloaded; the full Fraunces loads only on the two pages that set text in it. Geist Mono is
 * cut from 23 to 14 KB (codes, times and gates are Basic Latin). How the two subsets are made from
 * the latin files beside them (fontTools 4.68): `docs/qa/fixes/redesign1c.md`, item 3.
 */
import localFont from 'next/font/local';

export const fontDisplay = localFont({
  // Upright only: the italic file (81 KB) carried one phrase on the home page, which now uses the
  // upright face in colour (A-10). Any remaining `italic` is synthesised by the browser.
  src: './fraunces-latin-opsz-normal.woff2',
  weight: '100 900',
  style: 'normal',
  // Redesign 1c: no longer preloaded (the wordmark has its own 2 KB face below). `optional` never
  // swaps the face after first paint, so a serif accent cannot rewrap and shift the page.
  display: 'optional',
  variable: '--font-fraunces',
  fallback: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
  preload: false,
});

export const fontWordmark = localFont({
  // Fraunces at opsz 144 and weight 520 (the wordmark's setting), subset to "Malaysia Airports".
  src: './fraunces-wordmark-520.woff2',
  weight: '520',
  style: 'normal',
  // On every page's header, so preloaded (2 KB); `optional` keeps the header from shifting if it
  // is ever late (the metric-adjusted fallback holds the width).
  display: 'optional',
  variable: '--font-fraunces-wordmark',
  fallback: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
  preload: true,
});

export const fontSans = localFont({
  src: './hanken-grotesk-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  // Direction v2: every page's `h1` is now set in Hanken Grotesk (display sizes up to 88 px), so it
  // takes over the rule Fraunces had for headings: preloaded, and `optional` so a large heading
  // never rewraps and shifts the page when the face arrives late. A late face is used from the
  // next view (it is cached); the metric-adjusted Arial fallback holds the layout meanwhile.
  display: 'optional',
  preload: true,
  variable: '--font-hanken',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

export const fontMono = localFont({
  // Redesign 1c: Basic Latin plus the punctuation the site uses (· – — ’ “ ” … → − ≤ ≥ ×), cut from
  // geist-mono-latin-wght-normal.woff2 (kept beside it as the source); anything else falls back.
  src: './geist-mono-basic-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-geist-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
  adjustFontFallback: false,
  preload: false,
});

/** Class names that define the four font CSS variables. Put them on `<html>`. */
export const fontVariables = `${fontDisplay.variable} ${fontWordmark.variable} ${fontSans.variable} ${fontMono.variable}`;
