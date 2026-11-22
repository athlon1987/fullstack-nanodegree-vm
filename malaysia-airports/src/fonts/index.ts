/**
 * Self-hosted typefaces (latin subsets, variable). One definitions file: every `localFont()`
 * call is a separately hosted instance, so import the objects from here and nowhere else.
 *
 *   sans     Hanken Grotesk   headings (`type-display-*`, `type-title-*`, `font-heading`) and all
 *                             interface text (`font-sans`, the default). Direction v2: big,
 *                             confident display type is set in this face, 650 with tight tracking.
 *   serif    Fraunces         the wordmark and rare editorial accents (`type-serif-*`,
 *                             `font-serif`; `font-display` is kept as an alias for the wordmark)
 *   mono     Geist Mono       times, gates, codes and tables (`type-data-*`, `font-mono`)
 *
 * The root layout puts `fontVariables` on <html>; `globals.css` maps the CSS variables to the
 * `--font-heading`, `--font-sans`, `--font-serif` / `--font-display` and `--font-mono` tokens.
 * Payload is unchanged by the redesign: Hanken (35 KB) and Fraunces (67 KB) are preloaded because
 * both are on every first screen (the page heading and the header wordmark); Geist Mono (23 KB)
 * loads when a page uses it.
 */
import localFont from 'next/font/local';

export const fontDisplay = localFont({
  // Upright only: the italic file (81 KB) carried one phrase on the home page, which now uses the
  // upright face in colour (A-10). Any remaining `italic` is synthesised by the browser.
  src: './fraunces-latin-opsz-normal.woff2',
  weight: '100 900',
  style: 'normal',
  // The header wordmark on every page is set in Fraunces, so it is preloaded. `optional` never swaps the face
  // after first paint: a heading cannot rewrap and shift the page (CLS 0.16 on /ms before).
  // When the file is not ready in time the fallback is kept for that view; it is cached for the next.
  display: 'optional',
  variable: '--font-fraunces',
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
  src: './geist-mono-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-geist-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
  adjustFontFallback: false,
  preload: false,
});

/** Class names that define the three font CSS variables. Put them on `<html>`. */
export const fontVariables = `${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`;
