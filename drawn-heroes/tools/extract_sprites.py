"""Extract the two hand-drawn heroes from their photos into layered, transparent PNG parts.

Usage: python3 extract_sprites.py <momo.jpg> <scout.jpg> <out_dir>
Coordinates below are in 1500x2000 'display' space of the original 1512x2016 photos.
"""
import cv2, numpy as np, json, sys, os

INK = (0x23, 0x20, 0x2e)      # line colour (RGB)
PAPER = (0xff, 0xfb, 0xf2)    # paper fill (RGB)

CHARS = {
  'momo': dict(
    crop=(160, 650, 1485, 1585), target_h=300,
    parts=[  # drawn back-to-front order is given separately in JSON
      ('tail', [(985,1080),(1490,1080),(1490,1250),(990,1250)], (1000,1192)),
      ('armL', [(160,930),(335,930),(405,1050),(415,1100),(360,1180),(160,1110)], (372,1125)),
      ('armR', [(880,895),(1125,895),(1125,1012),(995,1062),(940,1125),(882,1112)], (905,1105)),
      ('head', [(290,650),(960,650),(955,900),(870,1000),(760,1047),(560,1062),(420,1015),(380,925),(290,905)], (640,1045)),
    ],
    order=['tail','armL','body','armR','head']),
  'scout': dict(
    crop=(325, 185, 1205, 1585), target_h=330,
    parts=[
      ('tail', [(1062,1305),(1105,1255),(1205,1262),(1205,1440),(1078,1440),(1050,1392)], (1062,1398)),
      ('head', [(325,185),(965,185),(935,800),(912,872),(640,893),(560,905),(380,770),(325,645)], (700,890)),
    ],
    order=['tail','body','head']),
}

def process(name, path, out):
    cfg = CHARS[name]
    im = cv2.imread(path)
    im = cv2.resize(im, (1500, 2000), interpolation=cv2.INTER_AREA)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32)
    bg = cv2.GaussianBlur(cv2.dilate(g, np.ones((25, 25))), (0, 0), 25)
    ratio = g / np.maximum(bg, 1)
    x0, y0, x1, y1 = cfg['crop']
    ratio = ratio[y0:y1, x0:x1]
    ink_hard = (ratio < 0.55).astype(np.uint8)
    # drop specks
    n, lab, stats, _ = cv2.connectedComponentsWithStats(ink_hard, 8)
    keep = np.zeros(n, np.uint8); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 60
    ink_hard = keep[lab]
    scale = cfg['target_h'] / (y1 - y0)
    # thicken lines so they stay ~4.5px at sprite size (readable once scaled into the game)
    grow = max(0, int(round((4.5 / scale - 7) / 2)))
    soft = np.clip((0.78 - ratio) / 0.3, 0, 1).astype(np.float32) * cv2.dilate(ink_hard, np.ones((5, 5))).astype(np.float32)
    if grow:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1))
        soft = cv2.dilate(soft, k)
    ink_mask = (soft > 0.3).astype(np.uint8)
    # sticker silhouette: thin margin around ink + closed gaps + filled interiors
    m = 9 + grow
    margin = cv2.dilate(ink_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * m + 1, 2 * m + 1)))
    closed = cv2.morphologyEx(ink_mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (45, 45)))
    sil = np.maximum(margin, closed)
    ff = np.pad(sil, 1).copy(); h, w = ff.shape
    mask = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 2)
    sil = (ff[1:-1, 1:-1] != 2).astype(np.uint8)
    sil_f = cv2.GaussianBlur(sil.astype(np.float32), (0, 0), 1.5)
    # compose RGBA at full res
    a = soft[..., None]
    rgb = np.array(PAPER, np.float32) * (1 - a) + np.array(INK, np.float32) * a
    alpha = np.clip(np.maximum(sil_f, soft), 0, 1)
    rgba = np.dstack([rgb, alpha[..., None] * 255]).astype(np.float32)
    # part assignment
    H, W = sil.shape
    owner = np.zeros((H, W), np.int32)  # 0 = body
    for i, (pn, poly, piv) in enumerate(cfg['parts']):
        pm = np.zeros((H, W), np.uint8)
        pts = np.array([(px - x0, py - y0) for px, py in poly], np.int32)
        cv2.fillPoly(pm, [pts], 1)
        owner[(pm == 1) & (owner == 0)] = i + 1
    names = ['body'] + [p[0] for p in cfg['parts']]
    pivots = [None] + [p[2] for p in cfg['parts']]
    os.makedirs(out, exist_ok=True)
    meta = dict(name=name, width=int(round(W * scale)), height=int(round(H * scale)), parts={}, order=cfg['order'])
    def save(img, fn):
        small = cv2.resize(img, (int(round(img.shape[1] * scale)), int(round(img.shape[0] * scale))), interpolation=cv2.INTER_AREA)
        bgra = np.dstack([small[..., 2], small[..., 1], small[..., 0], small[..., 3]])
        cv2.imwrite(os.path.join(out, fn), np.clip(bgra, 0, 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 9])
        return small
    full = save(rgba, f'{name}_full.png')
    for idx, pn in enumerate(names):
        sel = (owner == idx).astype(np.float32)
        # feather 1px across seams so parts overlap cleanly
        sel = np.clip(cv2.dilate(sel, np.ones((5, 5))), 0, 1)
        part = rgba.copy(); part[..., 3] *= sel
        ys, xs = np.where(part[..., 3] > 4)
        bx0, by0 = max(xs.min() - 4, 0), max(ys.min() - 4, 0)
        bx1, by1 = min(xs.max() + 5, W), min(ys.max() + 5, H)
        crop = part[by0:by1, bx0:bx1]
        save(crop, f'{name}_{pn}.png')
        piv = pivots[idx]
        meta['parts'][pn] = dict(
            x=round(bx0 * scale, 2), y=round(by0 * scale, 2),
            px=round((piv[0] - x0) * scale, 2) if piv else None,
            py=round((piv[1] - y0) * scale, 2) if piv else None)
    with open(os.path.join(out, f'{name}.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    print(name, meta['width'], meta['height'], 'grow', grow)

if __name__ == '__main__':
    momo, scout, out = sys.argv[1:4]
    process('momo', momo, out)
    process('scout', scout, out)
