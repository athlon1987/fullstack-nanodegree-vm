/**
 * Display and accessibility preferences: the schema, the defaults, how they map to `<html>`
 * attributes, and the inline script that applies them before first paint.
 *
 * This is a plain module (no `'use client'`), so the root layout, a Server Component, can
 * import `PREFERENCES_INIT_SCRIPT`. The hook that reads and writes preferences is
 * `usePreferences` in `@/lib/hooks`.
 *
 * Attributes on `<html>` (the CSS contract):
 *   data-theme         "light" | "dark"            resolved theme ("system" is resolved with matchMedia)
 *   data-theme-choice  "system" | "light" | "dark" what the user picked
 *   data-text-size     "100" | "112" | "125"       percent
 *   data-contrast      "normal" | "more"
 *   data-motion        "normal" | "reduce"
 */
import { z } from 'zod';
import { storageKey } from './storage';

export const THEMES = ['system', 'light', 'dark'] as const;
export const TEXT_SIZES = [100, 112, 125] as const;

export const PreferencesSchema = z.object({
  theme: z.enum(THEMES),
  textSize: z.union([z.literal(100), z.literal(112), z.literal(125)]),
  highContrast: z.boolean(),
  reducedMotion: z.boolean(),
});

/** The user's display and accessibility choices. */
export type Preferences = z.infer<typeof PreferencesSchema>;
export type ThemeChoice = Preferences['theme'];
export type TextSize = Preferences['textSize'];

/** What a first-time visitor gets, and the server snapshot. */
export const DEFAULT_PREFERENCES: Preferences = { theme: 'system', textSize: 100, highContrast: false, reducedMotion: false };

export const PREFERENCES_STORE_NAME = 'preferences';
export const PREFERENCES_STORE_VERSION = 1;
/** The `localStorage` key holding the preferences JSON. */
export const PREFERENCES_STORAGE_KEY = storageKey(PREFERENCES_STORE_NAME, PREFERENCES_STORE_VERSION);

/** The `data-*` attributes for a set of preferences. `systemDark` resolves the `system` theme. */
export function preferenceAttributes(preferences: Preferences, systemDark: boolean): Record<string, string> {
  const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && systemDark);
  return {
    'data-theme': dark ? 'dark' : 'light',
    'data-theme-choice': preferences.theme,
    'data-text-size': String(preferences.textSize),
    'data-contrast': preferences.highContrast ? 'more' : 'normal',
    'data-motion': preferences.reducedMotion ? 'reduce' : 'normal',
  };
}

/** Write the preference attributes onto `<html>`. Browser only; a no-op on the server. */
export function applyPreferences(preferences: Preferences): void {
  if (typeof document === 'undefined') return;
  const systemDark = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  for (const [name, value] of Object.entries(preferenceAttributes(preferences, systemDark))) {
    document.documentElement.setAttribute(name, value);
  }
}

/**
 * Inline script that applies stored preferences to `<html>` before hydration, so there is no
 * flash of the wrong theme or text size. Render it in `<head>` of the root layout:
 *
 *   <html lang={lang} suppressHydrationWarning>
 *     <head><script dangerouslySetInnerHTML={{ __html: PREFERENCES_INIT_SCRIPT }} /></head>
 *
 * It mirrors `preferenceAttributes` exactly (a unit test keeps the two in step), tolerates
 * missing or corrupt storage, and needs `'unsafe-inline'` for scripts in the CSP.
 */
export const PREFERENCES_INIT_SCRIPT = `(function(){try{var d=document.documentElement,p={};try{var r=localStorage.getItem(${JSON.stringify(
  PREFERENCES_STORAGE_KEY,
)});if(r){p=JSON.parse(r)||{}}}catch(e){}var t=p.theme==="light"||p.theme==="dark"?p.theme:"system";var m=t==="dark"||(t==="system"&&typeof matchMedia==="function"&&matchMedia("(prefers-color-scheme: dark)").matches);d.setAttribute("data-theme",m?"dark":"light");d.setAttribute("data-theme-choice",t);d.setAttribute("data-text-size",p.textSize===112||p.textSize===125?String(p.textSize):"100");d.setAttribute("data-contrast",p.highContrast===true?"more":"normal");d.setAttribute("data-motion",p.reducedMotion===true?"reduce":"normal")}catch(e){}})();`;
