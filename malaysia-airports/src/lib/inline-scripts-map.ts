/**
 * The terminal map's inline scripts (closing fix, 23 November 2026), as plain strings, in a module
 * of their own: `src/lib/inline-scripts.ts` is imported by the site's shell, so a string added there
 * ships in the chunk every route loads (the two below added 0.4 KB gzip to all 40 routes). Here they
 * reach only the map's route. Pure module with NO imports: `next.config.ts` hashes each string for
 * the report-only CSP, as it does the others (docs/engineering/security.md, section 3).
 */

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
