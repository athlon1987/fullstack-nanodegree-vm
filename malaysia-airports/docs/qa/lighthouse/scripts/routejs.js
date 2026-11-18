// Per-route first-load JS from Turbopack client reference manifests (.next/server/app/**/page_client-reference-manifest.js)
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const NEXT='/home/user/fullstack-nanodegree-vm/malaysia-airports/.next';
const bm=JSON.parse(fs.readFileSync(NEXT+'/build-manifest.json','utf8'));
const root=[...bm.polyfillFiles.map(f=>({f,poly:true})),...bm.rootMainFiles.map(f=>({f}))];
const sizeCache={};
function sz(f){ if(sizeCache[f]) return sizeCache[f]; const b=fs.readFileSync(path.join(NEXT,f)); const r={raw:b.length,gz:zlib.gzipSync(b,{level:9}).length,br:zlib.brotliCompressSync(b).length}; return sizeCache[f]=r; }
function walk(d,out=[]){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) walk(p,out); else if(e.name==='page_client-reference-manifest.js') out.push(p);} return out; }
const rows=[];
for(const p of walk(NEXT+'/server/app')){
  globalThis.__RSC_MANIFEST={}; require(p); const k=Object.keys(globalThis.__RSC_MANIFEST)[0]; const m=globalThis.__RSC_MANIFEST[k];
  const route=k.replace(/\/page$/,'')||'/';
  const pageKey='[project]/src/app'+k; const files=new Set(m.entryJSFiles[pageKey]||[]);
  // layouts on the path
  const segs=k.split('/').slice(1,-1); let acc='[project]/src/app'; for(const s of segs){ acc+='/'+s; (m.entryJSFiles[acc+'/layout']||[]).forEach(f=>files.add(f)); }
  const css=new Set(); Object.entries(m.entryCSSFiles).filter(([kk])=>kk===pageKey||kk.endsWith('/layout')).forEach(([,v])=>v.forEach(c=>css.add(c.path)));
  let rootT={raw:0,gz:0,br:0}, routeT={raw:0,gz:0,br:0};
  for(const {f,poly} of root){ if(poly) continue; const s=sz(f); rootT.raw+=s.raw; rootT.gz+=s.gz; rootT.br+=s.br; }
  const rootSet=new Set(bm.rootMainFiles);
  for(const f of files){ if(rootSet.has(f)) continue; const s=sz(f); routeT.raw+=s.raw; routeT.gz+=s.gz; routeT.br+=s.br; }
  let cssT={raw:0,gz:0}; for(const c of css){ const s=sz(c); cssT.raw+=s.raw; cssT.gz+=s.gz; }
  rows.push({route,chunks:files.size+bm.rootMainFiles.length,shared_gz:rootT.gz,route_gz:routeT.gz,total_raw:rootT.raw+routeT.raw,total_gz:rootT.gz+routeT.gz,total_br:rootT.br+routeT.br,css_gz:cssT.gz,files:[...files]});
}
rows.sort((a,b)=>b.total_gz-a.total_gz);
const kb=n=>(n/1024).toFixed(1);
console.log('route | chunks | framework+shared gz | route-specific gz | total gz | total br | total raw | css gz');
for(const r of rows) console.log([r.route,r.chunks,kb(r.shared_gz),kb(r.route_gz),kb(r.total_gz),kb(r.total_br),kb(r.total_raw),kb(r.css_gz)].join(' | '));
// biggest chunks overall
const all=Object.entries(sizeCache).sort((a,b)=>b[1].gz-a[1].gz).slice(0,15);
console.log('\nLargest chunks (gz KB, raw KB, used by N routes):'); for(const [f,s] of all) console.log(f, kb(s.gz), kb(s.raw), rows.filter(r=>r.files.includes(f)).length);
fs.writeFileSync(__dirname+'/routejs.json',JSON.stringify({rootMainFiles:bm.rootMainFiles,polyfill:bm.polyfillFiles,rows:rows.map(({files,...r})=>r),chunks:sizeCache},null,1));
