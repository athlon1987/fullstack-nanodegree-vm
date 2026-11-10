// Boots the film: loads fonts, the timeline and every act module, then exposes window.FILM.
import { Film, buildTimeline, W, H, FPS } from './engine.js';

const params = new URLSearchParams(location.search);
const ACT_MODULES = ['act1a', 'act1b', 'act2a', 'act2b', 'act3', 'act4', 'act5', 'act6', 'act7a', 'act7b', 'ui_phone', 'ui_sys', 'videos'];
const FONT_SPECS = [
  '300 20px "Inter"', '400 20px "Inter"', 'italic 400 20px "Inter"', '500 20px "Inter"', '600 20px "Inter"', '700 20px "Inter"',
  '400 20px "IBM Plex Mono"', '500 20px "IBM Plex Mono"', '600 20px "IBM Plex Mono"',
  '300 20px "Cormorant Garamond"', '400 20px "Cormorant Garamond"', '500 20px "Cormorant Garamond"',
  'italic 400 20px "Cormorant Garamond"', 'italic 500 20px "Cormorant Garamond"',
  '400 20px "Gloria Hallelujah"', '400 20px "Patrick Hand"',
];

async function boot() {
  await Promise.all(FONT_SPECS.map((f) => document.fonts.load(f)));
  await document.fonts.ready;

  const canvas = document.getElementById('stage');
  let SHOTS, CUES = [], shots = {}, loadErrors = [], missing = [];

  const sketch = params.get('sketch');
  if (sketch) {
    // Sketch mode: one module exporting `default (ctx, F)` (and optionally `duration`, `cues`) becomes the whole film.
    const mod = await import(/* @vite-ignore */ sketch + (sketch.includes('?') ? '&' : '?') + 'v=' + (params.get('v') || '0'));
    SHOTS = [{ id: 'sketch', act: 0, dur: mod.duration || 10, desc: 'sketch', vig: mod.vig, grain: mod.grain }];
    CUES = (mod.cues || []).map((c) => ({ ...c, shot: 'sketch' }));
    shots.sketch = mod.default;
  } else {
    const tlmod = await import('./timeline.js');
    SHOTS = tlmod.SHOTS; CUES = tlmod.CUES || [];
    for (const name of ACT_MODULES) {
      try {
        const m = await import(/* @vite-ignore */ `./acts/${name}.js?v=${params.get('v') || '0'}`);
        Object.assign(shots, m.shots || {});
      } catch (err) {
        loadErrors.push(`[module acts/${name}.js failed to load — syntax error or a bad import path] ${err && err.message ? err.message : err}`);
      }
    }
  }

  let voiceEnv = {};
  try {
    const r = await fetch('assets/voice_env.json', { cache: 'no-store' });
    if (r.ok) voiceEnv = await r.json();
  } catch (e) { /* optional */ }

  const film = new Film({ canvas, timeline: buildTimeline(SHOTS, CUES), shots, voiceEnv });
  film.errors.push(...loadErrors);
  if (params.get('subs') === '0') film.opts.subtitles = false;
  if (params.get('grain') === '0') film.opts.grain = false;

  window.FILM = {
    film, W, H, FPS,
    duration: film.duration,
    frames: Math.round(film.duration * FPS),
    shots: film.tl.shots.map((s) => ({ id: s.id, act: s.act, start: s.start, end: s.end, dur: s.dur, implemented: !!shots[s.id] })),
    cues: film.tl.cues,
    errors: film.errors,
    missingModules: missing,
    render: (t) => film.renderFrame(t).id,
    /** Render frame index f and return it as a JPEG data URL (used by the video renderer). */
    jpeg: (f, q = 0.95) => { film.renderFrame((f + 0.5) / FPS); return canvas.toDataURL('image/jpeg', q); },
    png: (t) => { film.renderFrame(t); return canvas.toDataURL('image/png'); },
    setStrict: (v) => { film.opts.strict = !!v; },
  };
  const t0 = parseFloat(params.get('t') || '0');
  film.renderFrame(t0);
  window.FILM_READY = true;
}

boot().catch((err) => { window.FILM_ERROR = String(err && err.stack || err); console.error(err); });
