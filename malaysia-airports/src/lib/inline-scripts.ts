/**
 * The inline scripts that run during HTML parsing, as plain strings (round 2, the E-09 hand-off).
 * Pure module with NO imports: `next.config.ts` hashes each string for the report-only CSP, so
 * our own scripts never show up as violations and the reports list only the framework's inline
 * scripts (docs/engineering/security.md, section 3). Change a string and its hash follows.
 */

/** Header switcher, search and menu taps made before hydration (A-09); see `global-overlays.tsx`. */
export const EARLY_TAP_SCRIPT = `(function(){try{document.addEventListener('click',function(e){if(window.__maHydrated)return;var t=e.target&&e.target.closest?e.target.closest('[data-early-overlay]'):null;if(t)window.__maEarlyOverlay=t.getAttribute('data-early-overlay')},true)}catch(e){}})()`;

/** A journey mode tapped before hydration (A-09); see `journey-modes.tsx`. */
export const EARLY_MODE_SCRIPT = `(function(){try{document.addEventListener('change',function(e){var t=e.target;if(t&&t.hasAttribute&&t.hasAttribute('data-journey-radio')&&t.checked){window.__maEarlyJourneyMode=t.value}},true)}catch(e){}})()`;

/** Marks `<html>` when a saved flight is upcoming, so its slot is reserved before paint (A-08); see `saved-flight-slot.tsx`. */
export const SAVED_FLIGHT_FLAG_SCRIPT = `(function(){try{var j=JSON.parse(localStorage.getItem('ma:journey:v1')||'null');var f=j&&j.flights;if(!f||!f.length)return;var d=new Date(Date.now()+8*3600000).toISOString().slice(0,10);for(var i=0;i<f.length;i++){if(f[i]&&f[i].date>=d){document.documentElement.setAttribute('data-saved-flight','');return}}}catch(e){}})()`;
