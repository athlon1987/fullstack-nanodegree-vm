/**
 * Self-hosted typefaces (latin subsets, variable). One definitions file: every `localFont()`
 * call is a separately hosted instance, so import the objects from here and nowhere else.
 *
 *   display  Fraunces         editorial headings only (`type-display-*`, `font-display`)
 *   sans     Hanken Grotesk   all interface text (`font-sans`, the default)
 *   mono     Geist Mono       times, gates, codes and tables (`type-data-*`, `font-mono`)
 *
 * The root layout puts `fontVariables` on <html>; `globals.css` maps the CSS variables to the
 * `--font-display`, `--font-sans` and `--font-mono` tokens.
 */
import localFont from 'next/font/local';

export const fontDisplay = localFont({
  src: [
    { path: './fraunces-latin-opsz-normal.woff2', weight: '100 900', style: 'normal' },
    { path: './fraunces-latin-opsz-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-fraunces',
  fallback: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
  adjustFontFallback: 'Times New Roman',
  // Display type is below the fold on most pages: do not compete with the interface face.
  preload: false,
});

export const fontSans = localFont({
  src: './hanken-grotesk-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
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
