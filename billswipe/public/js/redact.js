import { h, icon } from './ui.js';

const MAX_EDGE = 1600;
const MAX_BYTES = 3.5 * 1024 * 1024;

async function loadBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Lets the requester black out account numbers, addresses, etc. before upload.
 * Re-encoding through a canvas also strips EXIF metadata (GPS location, device).
 */
export async function createRedactor(file, { onChange } = {}) {
  const src = await loadBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(src.width, src.height));
  const W = Math.round(src.width * scale);
  const H = Math.round(src.height * scale);

  const canvas = h('canvas', { width: W, height: H, 'aria-label': 'Bill photo. Drag to black out private details.' });
  const ctx = canvas.getContext('2d');
  const boxes = [];
  let draft = null;

  function draw() {
    ctx.drawImage(src, 0, 0, W, H);
    ctx.fillStyle = '#000';
    for (const b of boxes) ctx.fillRect(b.x, b.y, b.w, b.h);
    if (draft) {
      ctx.fillStyle = 'rgba(0,0,0,.75)';
      ctx.fillRect(draft.x, draft.y, draft.w, draft.h);
      ctx.strokeStyle = '#3ee08f';
      ctx.lineWidth = Math.max(2, W / 400);
      ctx.strokeRect(draft.x, draft.y, draft.w, draft.h);
    }
  }

  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const norm = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

  let origin = null;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    origin = toCanvas(e);
    draft = { ...origin, w: 0, h: 0 };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!origin) return;
    draft = norm(origin, toCanvas(e));
    draw();
  });
  const finish = () => {
    if (!origin) return;
    if (draft && draft.w > 6 && draft.h > 6) boxes.push(draft);
    origin = draft = null;
    draw();
    sync();
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);

  const undoBtn = h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { boxes.pop(); draw(); sync(); } }, icon('undo'), 'Undo box');
  const clearBtn = h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { boxes.length = 0; draw(); sync(); } }, 'Clear');
  const count = h('span', { class: 'tip' });
  function sync() {
    undoBtn.disabled = clearBtn.disabled = boxes.length === 0;
    count.textContent = boxes.length
      ? `${boxes.length} area${boxes.length > 1 ? 's' : ''} blacked out. Keep the amount, biller name and due date visible.`
      : 'Drag across account numbers, your address, or anything else private to black it out.';
    onChange?.(boxes.length);
  }

  const el = h('div', { class: 'redactor' }, canvas, h('div', { class: 'redact-bar' }, count, undoBtn, clearBtn));
  draw();
  sync();

  return {
    el,
    /** JPEG data URL with redactions burned in and metadata stripped. */
    export() {
      draft = null;
      draw();
      for (const q of [0.85, 0.72, 0.6, 0.45]) {
        const url = canvas.toDataURL('image/jpeg', q);
        if ((url.length * 3) / 4 < MAX_BYTES) return url;
      }
      throw new Error('That photo is too large. Try a smaller one.');
    },
  };
}
