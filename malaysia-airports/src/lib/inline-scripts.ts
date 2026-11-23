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

/**
 * The terminal map's From and To with a route in the address (closing fix, verification VA6 item 3):
 * the page is static, so its HTML says "Choose a place" and the route is applied after hydration,
 * when the full place names wrapped onto two or three lines and moved what is under them. Run
 * right after the two fields, during HTML parsing, this writes the chosen names (the text of the
 * matching `<option>`, which the server HTML already holds) into the fields before the first
 * paint; React then hydrates over them and sets the same names. See `route-planner.tsx`.
 */
export const MAP_ROUTE_NAMES_SCRIPT = `(function(){try{var s=document.currentScript,w=s&&s.previousElementSibling;if(!w||!w.hasAttribute('data-route-fields'))return;var q=new URLSearchParams(location.search),t=(q.get('t')||'').trim();if(t&&t!==w.getAttribute('data-terminal'))return;var f=w.querySelectorAll('[data-place-select]');for(var i=0;i<f.length;i++){var b=f[i],v=(q.get(b.getAttribute('data-place-select'))||'').trim(),e=b.querySelector('select'),n=b.querySelector('[data-place-shown]');if(!v||!e||!n)continue;for(var j=0;j<e.options.length;j++){if(e.options[j].value===v){n.textContent=e.options[j].text;b.classList.remove('text-ink-2');e.value=v;break}}}}catch(e){}})()`;

/**
 * The terminal map's "The route continues" strip with a route in the address (closing fix): the
 * strip closes the map card and appears after hydration, when the route is applied; on a phone it
 * pushed the legend under it down (CLS 0.007 to 0.014). Run right after the strip's hidden
 * placeholder, during HTML parsing, this shows the placeholder (an empty strip of the same height)
 * when the strip will appear: both ends in the address and on different levels, and the level
 * the page will show (the address's level, else the chosen place's, else the start's) is the
 * start's or the end's, where the route leaves or reaches it. The placeholder carries each place's
 * level (`data-levels`). After hydration React replaces it with the strip itself. See
 * `map-canvas.tsx`.
 */
export const MAP_ROUTE_STRIP_SCRIPT = `(function(){try{var s=document.currentScript,p=s&&s.previousElementSibling;if(!p||!p.hasAttribute('data-route-strip-placeholder'))return;var q=new URLSearchParams(location.search),g=function(k){return(q.get(k)||'').trim()};if(g('gate')||(g('t')&&g('t')!==p.getAttribute('data-terminal')))return;var L=JSON.parse(p.getAttribute('data-levels')||'{}'),h=function(id){return Object.prototype.hasOwnProperty.call(L,id)?L[id]:''},a=h(g('from')),b=h(g('to')),v=g('level'),d='';if(!a||!b||a===b)return;for(var k in L)if(L[k]===v)d=v;d=d||h(g('poi'))||a;if(d===a||d===b)p.hidden=false}catch(e){}})()`;
