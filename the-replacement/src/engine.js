// THE REPLACEMENT — film engine.
// Everything is drawn procedurally on a 2D canvas, one frame at a time, as a pure
// function of time. No Math.random(), no Date: every frame must be reproducible.

export const W = 1920, H = 1080, FPS = 24;
export const BAR = 138;                    // letterbox bars -> 2.39:1 picture
export const PW = 1920, PH = H - 2 * BAR;  // picture space: 1920 x 804
export const CX = PW / 2, CY = PH / 2;

// ───────────────────────────── math ─────────────────────────────
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const invlerp = (a, b, v) => (a === b ? (v >= b ? 1 : 0) : clamp((v - a) / (b - a)));
export const remap = (v, a, b, c, d) => lerp(c, d, invlerp(a, b, v));
export const TAU = Math.PI * 2;
export const rad = (deg) => (deg * Math.PI) / 180;

export const ease = {
  linear: (k) => k,
  inQuad: (k) => k * k,
  outQuad: (k) => 1 - (1 - k) * (1 - k),
  inOutQuad: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  inCubic: (k) => k * k * k,
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inExpo: (k) => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10)),
  outBack: (k) => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2),
  outQuint: (k) => 1 - Math.pow(1 - k, 5),
};

/** Progress 0..1 of t through [a,b], optionally eased. */
export const seg = (t, a, b, e = ease.linear) => e(invlerp(a, b, t));

/** 0 → 1 → 0 window: rises over `fin` after a, falls over `fout` before b. */
export const pulse = (t, a, b, fin = 0.3, fout = fin) =>
  clamp(Math.min(fin <= 0 ? (t >= a ? 1 : 0) : (t - a) / fin, fout <= 0 ? (t <= b ? 1 : 0) : (b - t) / fout));

/**
 * Keyframe interpolation. frames = [[time, value, easeFn?], ...] sorted by time.
 * value may be a number, an array of numbers, or a flat object of numbers.
 * The ease on a frame applies to the segment ARRIVING at that frame.
 */
export function key(t, frames) {
  if (t <= frames[0][0]) return frames[0][1];
  const last = frames[frames.length - 1];
  if (t >= last[0]) return last[1];
  let i = 1;
  while (frames[i][0] < t) i++;
  const [t0, v0] = frames[i - 1];
  const [t1, v1, e = ease.inOutCubic] = frames[i];
  const k = e(invlerp(t0, t1, t));
  return mix(v0, v1, k);
}

/** Interpolate numbers / arrays / flat objects of numbers. Non-numeric fields snap at k>=0.5. */
export function mix(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => mix(v, b[i] ?? v, k));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const o = {};
    for (const n of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[n] === undefined) o[n] = b[n];
      else if (b[n] === undefined) o[n] = a[n];
      else o[n] = mix(a[n], b[n], k);
    }
    return o;
  }
  return k < 0.5 ? a : b;
}

// deterministic randomness
export function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Smooth 1D value noise in 0..1. */
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 7919), hash(i + 1 + seed * 7919), u);
}
/** Smooth 2D value noise in 0..1. */
export function noise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (a, b) => hash(a * 374761393 + b * 668265263 + seed * 7919);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
/** Organic drift in -1..1 (use for handheld camera, breathing, flicker). */
export const wobble = (t, freq = 1, seed = 0) =>
  (noise1(t * freq, seed) * 2 - 1) * 0.65 + (noise1(t * freq * 2.31 + 17, seed + 3) * 2 - 1) * 0.35;

// ───────────────────────────── colour ─────────────────────────────
function parseHex(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export const rgba = (hex, a = 1) => {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${clamp(a)})`;
};
export const mixHex = (a, b, k) => {
  const A = parseHex(a), B = parseHex(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};

// ───────────────────────────── drawing helpers ─────────────────────────────
export function rr(ctx, x, y, w, h, r = 0) {
  const q = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y);
  ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q);
  ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q);
  ctx.closePath();
}
export function fillRR(ctx, x, y, w, h, r, fill) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}
export function linGrad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
export function radGrad(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}
/** Additive soft light blob. squash<1 flattens it vertically (pools of light on floors). */
export function glow(ctx, x, y, r, color, alpha = 1, squash = 1) {
  if (alpha <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y);
  ctx.scale(1, squash);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r, [
    [0, rgba(color, alpha)], [0.25, rgba(color, alpha * 0.55)], [0.6, rgba(color, alpha * 0.16)], [1, rgba(color, 0)],
  ]);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.restore();
}
/** Soft cone of light from (x,y) pointing at angle (radians, 0 = right, PI/2 = down). */
export function lightCone(ctx, x, y, angle, spread, length, color, alpha = 0.3) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = linGrad(ctx, 0, 0, length, 0, [[0, rgba(color, alpha)], [1, rgba(color, 0)]]);
  ctx.beginPath();
  ctx.moveTo(0, -4); ctx.lineTo(length, -Math.tan(spread / 2) * length);
  ctx.lineTo(length, Math.tan(spread / 2) * length); ctx.lineTo(0, 4);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
/** Horizontal band of drifting fog. */
export function fog(ctx, t, y, h, color = '#9fb0c8', alpha = 0.12, seed = 0, speed = 12) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const w = 700 + hash(seed * 31 + i) * 900;
    const x = ((hash(seed * 17 + i * 3) * (PW + w * 2) + t * speed * (0.5 + hash(i + seed))) % (PW + w * 2)) - w;
    const yy = y + hash(seed + i * 11) * h;
    ctx.save();
    ctx.translate(x + w / 2, yy); ctx.scale(1, (h * 0.55) / w);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, w / 2, [[0, rgba(color, alpha)], [1, rgba(color, 0)]]);
    ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
/** Multiply/screen colour wash over the whole picture: cheap colour grading. */
export function grade(ctx, color, amount = 0.25, mode = 'soft-light') {
  if (amount <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = clamp(amount);
  ctx.fillStyle = color;
  ctx.fillRect(-PW, -PH, PW * 3, PH * 3);
  ctx.restore();
}
/** Solid/alpha rectangle over the whole picture (fades, flashes). */
export function wash(ctx, color, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.setTransform(ctx.getTransform()); ctx.globalAlpha = clamp(alpha);
  ctx.fillStyle = color; ctx.fillRect(-PW, -PH, PW * 3, PH * 3); ctx.restore();
}

export const FONT = {
  sans: '"Inter", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
  serif: '"Cormorant Garamond", Georgia, serif',
  hand: '"Gloria Hallelujah", "Patrick Hand", cursive',
  hand2: '"Patrick Hand", cursive',
};

/**
 * Draw text. opts: {size, weight, family, color, align, baseline, alpha, tracking(px),
 * italic, shadow:{color,blur,x,y}, maxWidth}
 */
export function text(ctx, str, x, y, o = {}) {
  const { size = 32, weight = 500, family = FONT.sans, color = '#fff', align = 'left', baseline = 'alphabetic',
    alpha = 1, tracking = 0, italic = false, shadow = null } = o;
  if (alpha <= 0 || !str) return 0;
  ctx.save();
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
  ctx.textAlign = align; ctx.textBaseline = baseline;
  try { ctx.letterSpacing = `${tracking}px`; } catch (e) { /* older engines */ }
  ctx.globalAlpha *= clamp(alpha);
  if (shadow) { ctx.shadowColor = shadow.color || 'rgba(0,0,0,.6)'; ctx.shadowBlur = shadow.blur ?? 8; ctx.shadowOffsetX = shadow.x || 0; ctx.shadowOffsetY = shadow.y || 0; }
  ctx.fillStyle = color;
  // letterSpacing adds trailing space; compensate so centred text stays centred
  const dx = tracking && align === 'center' ? tracking / 2 : tracking && align === 'right' ? tracking : 0;
  ctx.fillText(str, x + dx, y);
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}
export function measure(ctx, str, o = {}) {
  const { size = 32, weight = 500, family = FONT.sans, tracking = 0, italic = false } = o;
  ctx.save();
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
  try { ctx.letterSpacing = `${tracking}px`; } catch (e) { /* */ }
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}
/** Break a string into lines no wider than maxW for the given text opts. Honors "\n". */
export function wrapLines(ctx, str, maxW, o = {}) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (line && measure(ctx, test, o) > maxW) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}
/** Draw wrapped text; returns the y after the last line. opts.lineH defaults to size*1.35. */
export function paragraph(ctx, str, x, y, maxW, o = {}) {
  const lineH = o.lineH ?? (o.size ?? 32) * 1.35;
  const lines = wrapLines(ctx, str, maxW, o);
  lines.forEach((ln, i) => text(ctx, ln, x, y + i * lineH, o));
  return y + lines.length * lineH;
}
/** Typewriter: the first k (0..1) of a string. */
export const typeOn = (str, k) => str.slice(0, Math.round(str.length * clamp(k)));

// ───────────────────────────── layer cache ─────────────────────────────
const _cache = new Map();
/**
 * Memoise an expensive static drawing. draw(ctx, w, h) runs once per key; returns a canvas you can
 * ctx.drawImage(). Use for backgrounds, blurred layers, textures — anything not animating.
 */
export function cached(keyStr, w, h, draw) {
  let cv = _cache.get(keyStr);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
    const c = cv.getContext('2d', { willReadFrequently: true });
    draw(c, cv.width, cv.height);
    _cache.set(keyStr, cv);
    if (_cache.size > 400) _cache.delete(_cache.keys().next().value);
  }
  return cv;
}
/** A scratch canvas reused between frames (cleared on each request). Good for masks/compositing. */
const _scratch = new Map();
export function scratch(name, w, h) {
  let cv = _scratch.get(name);
  if (!cv || cv.width !== Math.ceil(w) || cv.height !== Math.ceil(h)) {
    cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h);
    _scratch.set(name, cv);
  }
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.clearRect(0, 0, cv.width, cv.height);
  return { cv, ctx: c };
}

// ───────────────────────────── camera ─────────────────────────────
/**
 * Run fn with a camera transform. cam = {x, y, zoom, rot}; (x,y) is the WORLD point placed at
 * picture centre. depth is the parallax factor: 1 = subject plane, 0.3 = far background,
 * 1.4 = foreground. Default camera {x:960, y:402, zoom:1} is the identity.
 */
export function camera(ctx, cam, depth, fn) {
  const { x = CX, y = CY, zoom = 1, rot = 0 } = cam || {};
  const z = 1 + (zoom - 1) * depth;
  ctx.save();
  ctx.translate(CX, CY);
  if (rot) ctx.rotate(rot * depth);
  ctx.scale(z, z);
  ctx.translate(-CX - (x - CX) * depth, -CY - (y - CY) * depth);
  fn(ctx);
  ctx.restore();
}
/** Handheld drift to add to a camera: returns {x,y,rot} offsets. */
export const handheld = (t, amp = 4, seed = 1) => ({
  x: wobble(t, 0.45, seed) * amp, y: wobble(t, 0.37, seed + 9) * amp * 0.8, rot: wobble(t, 0.3, seed + 5) * amp * 0.0006,
});

// ───────────────────────────── timeline ─────────────────────────────
export function buildTimeline(SHOTS, CUES = []) {
  let t = 0;
  const shots = SHOTS.map((s, i) => { const o = { ...s, index: i, start: t, end: t + s.dur }; t += s.dur; return o; });
  const byId = Object.fromEntries(shots.map((s) => [s.id, s]));
  const cues = CUES.map((c) => {
    const s = byId[c.shot];
    if (!s) throw new Error(`cue ${c.id}: unknown shot ${c.shot}`);
    return { ...c, t0: s.start + c.at, t1: s.start + c.at + c.dur };
  });
  const cueById = Object.fromEntries(cues.map((c) => [c.id, c]));
  return { shots, byId, cues, cueById, duration: t };
}

const SPEAKER_STYLE = {
  ADAM: { color: '#ffe9cc' },
  V1: { color: '#bfeaff' },
  ORIGINAL: { color: '#ffe9cc', italic: true },
  SYSTEM: { color: '#7fe7ff', family: FONT.mono, weight: 500, size: 30, tracking: 1 },
  default: { color: '#ffffff' },
};

function makeGrain() {
  const tiles = [];
  for (let n = 0; n < 6; n++) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 512;
    const c = cv.getContext('2d', { willReadFrequently: true }); const img = c.createImageData(512, 512); const r = rng(1000 + n);
    for (let i = 0; i < img.data.length; i += 4) {
      const g = (r() + r() + r()) / 3; // roughly gaussian around .5
      const v = Math.round(g * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    tiles.push(cv);
  }
  return tiles;
}

export class Film {
  /**
   * @param {{canvas:HTMLCanvasElement, timeline:ReturnType<typeof buildTimeline>, shots:Record<string,Function>, voiceEnv?:Record<string,number[]>}} o
   */
  constructor({ canvas, timeline, shots, voiceEnv = {} }) {
    this.canvas = canvas; canvas.width = W; canvas.height = H;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.tl = timeline; this.shots = shots; this.voiceEnv = voiceEnv;
    this.grain = makeGrain();
    this.errors = [];
    this.opts = { subtitles: true, grain: true, strict: false };
  }
  get duration() { return this.tl.duration; }

  shotAt(t) {
    const s = this.tl.shots;
    let lo = 0, hi = s.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (s[m].start <= t) lo = m; else hi = m - 1; }
    return s[lo];
  }

  /** Per-frame context handed to every shot function. */
  frameCtx(shot, gt) {
    const film = this;
    const t = gt - shot.start;
    return {
      t, T: shot.dur, k: clamp(t / shot.dur), gt, shot, fps: FPS, frame: Math.round(gt * FPS),
      /** Local time (s) of a named sync event of this shot (see `ev` in timeline.js). */
      ev(name) {
        const v = (shot.ev || {})[name];
        if (v === undefined) throw new Error(`shot ${shot.id} has no event "${name}"`);
        return v;
      },
      /** Seconds since a named event (negative before it). */
      since(name) { return t - this.ev(name); },
      /** Timing of a dialogue cue relative to this shot: {at, dur, end, since, k, active} */
      cue(id) {
        const c = film.tl.cueById[id];
        if (!c) return { at: 0, dur: 0, end: 0, since: -1e9, k: 0, active: false };
        const at = c.t0 - shot.start;
        return { at, dur: c.dur, end: at + c.dur, since: t - at, k: clamp((t - at) / c.dur), active: gt >= c.t0 && gt < c.t1, text: c.text };
      },
      /** Loudness 0..1 of a spoken cue right now (drive jaw / head-bob with it). 0 when silent. */
      voice(id) {
        const c = film.tl.cueById[id];
        if (!c || gt < c.t0 || gt >= c.t1) return 0;
        const env = film.voiceEnv[id];
        const local = gt - c.t0;
        if (env && env.length) {
          const f = local * FPS, i = Math.floor(f);
          return lerp(env[Math.min(i, env.length - 1)] || 0, env[Math.min(i + 1, env.length - 1)] || 0, f - i);
        }
        return clamp(0.25 + 0.75 * Math.abs(Math.sin(local * 11.3)) * noise1(local * 6.1, 5));
      },
      /** Who (speaker id) is talking right now, or null. */
      speaking() {
        const c = film.tl.cues.find((q) => gt >= q.t0 && gt < q.t1);
        return c ? c.who : null;
      },
    };
  }

  drawShot(ctx, shot, gt) {
    const fn = this.shots[shot.id];
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.clip();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, PW, PH);
    if (!fn) {
      slate(ctx, shot, gt - shot.start);
    } else {
      try { fn(ctx, this.frameCtx(shot, gt)); }
      catch (err) {
        const msg = `[shot ${shot.id} @${(gt - shot.start).toFixed(2)}s] ${err && err.stack ? err.stack : err}`;
        if (!this.errors.includes(msg)) { this.errors.push(msg); console.error(msg); }
        if (this.opts.strict) { ctx.restore(); throw err; }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#400'; ctx.fillRect(0, 0, PW, PH);
        text(ctx, `ERROR in ${shot.id}`, 60, 120, { size: 44, color: '#fff', weight: 700 });
        paragraph(ctx, String(err && err.message || err), 60, 190, PW - 120, { size: 28, color: '#fcc', family: FONT.mono });
      }
    }
    ctx.restore();
  }

  /** Render the whole 1920x1080 frame for global time gt (seconds). */
  renderFrame(gt) {
    const ctx = this.ctx;
    gt = clamp(gt, 0, this.duration - 1e-6);
    const shot = this.shotAt(gt);
    const t = gt - shot.start;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    // picture
    ctx.save(); ctx.translate(0, BAR);
    const prev = this.tl.shots[shot.index - 1];
    if (shot.xin && prev && t < shot.xin) {
      // dissolve from the previous shot (which keeps playing past its end)
      this.drawShot(ctx, prev, gt);
      const { cv, ctx: c2 } = scratch('xfade', PW, PH);
      this.drawShot(c2, shot, gt);
      ctx.globalAlpha = ease.inOutSine(t / shot.xin);
      ctx.drawImage(cv, 0, 0);
      ctx.globalAlpha = 1;
    } else {
      this.drawShot(ctx, shot, gt);
    }
    // fades
    const fin = shot.in && shot.in.fade ? 1 - clamp(t / shot.in.fade) : 0;
    const fout = shot.out && shot.out.fade ? clamp((t - (shot.dur - shot.out.fade)) / shot.out.fade) : 0;
    if (fin > 0) { ctx.globalAlpha = ease.inOutSine(fin); ctx.fillStyle = shot.in.color || '#000'; ctx.fillRect(0, 0, PW, PH); }
    if (fout > 0) { ctx.globalAlpha = ease.inOutSine(fout); ctx.fillStyle = shot.out.color || '#000'; ctx.fillRect(0, 0, PW, PH); }
    ctx.globalAlpha = 1;

    // vignette + grain (picture only)
    const vig = shot.vig ?? 0.55;
    if (vig > 0) {
      ctx.fillStyle = radGrad(ctx, CX, CY, PH * 0.45, PW * 0.62, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${vig})`]]);
      ctx.fillRect(0, 0, PW, PH);
    }
    const gAmt = this.opts.grain ? (shot.grain ?? 1) : 0;
    if (gAmt > 0) {
      const f = Math.round(gt * FPS);
      const tile = this.grain[f % this.grain.length];
      const ox = Math.floor(hash(f * 3 + 1) * 512), oy = Math.floor(hash(f * 5 + 2) * 512);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.clip();
      ctx.translate(-ox, -oy);
      const pat = ctx.createPattern(tile, 'repeat');
      ctx.fillStyle = pat;
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.11 * gAmt;
      ctx.fillRect(0, 0, PW + 512, PH + 512);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.022 * gAmt; // dithers near-black gradients
      ctx.fillRect(0, 0, PW + 512, PH + 512);
      ctx.restore();
    }
    ctx.restore();

    // letterbox bars
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, BAR); ctx.fillRect(0, H - BAR, W, BAR);

    if (this.opts.subtitles) this.drawSubtitles(ctx, gt);
    return shot;
  }

  drawSubtitles(ctx, gt) {
    const live = this.tl.cues.filter((c) => !c.nosub && gt >= c.t0 - 0.04 && gt < c.t1 + (c.hold ?? 0.35));
    if (!live.length) return;
    const c = live[live.length - 1];
    const st = { ...SPEAKER_STYLE.default, ...(SPEAKER_STYLE[c.who] || {}) };
    const o = { size: st.size || 34, weight: st.weight || 500, family: st.family || FONT.sans, color: st.color, italic: !!st.italic, tracking: st.tracking ?? 0.2, align: 'center', baseline: 'middle' };
    const end = c.t1 + (c.hold ?? 0.35);
    o.alpha = Math.min(clamp((gt - (c.t0 - 0.04)) / 0.12), clamp((end - gt) / 0.18));
    const lines = wrapLines(ctx, c.sub || c.text, 1280, o);
    const lh = o.size * 1.32;
    const y0 = H - BAR / 2 - 4 - ((lines.length - 1) * lh) / 2;
    lines.forEach((ln, i) => text(ctx, ln, W / 2, y0 + i * lh, o));
  }
}

/** Placeholder card for a shot that has no implementation yet. */
function slate(ctx, shot, t) {
  ctx.fillStyle = '#0c1118'; ctx.fillRect(0, 0, PW, PH);
  ctx.strokeStyle = '#223'; ctx.lineWidth = 2;
  for (let x = -PH; x < PW; x += 60) { ctx.beginPath(); ctx.moveTo(x, PH); ctx.lineTo(x + PH, 0); ctx.stroke(); }
  text(ctx, shot.id, 80, 130, { size: 54, weight: 700, color: '#7fe7ff', family: FONT.mono });
  text(ctx, `${t.toFixed(1)}s / ${shot.dur.toFixed(1)}s   set: ${shot.set || '-'}`, 80, 180, { size: 26, color: '#89a', family: FONT.mono });
  paragraph(ctx, shot.desc || '', 80, 250, PW - 160, { size: 30, color: '#cfd8e3', weight: 400 });
}
