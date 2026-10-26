# Performance Budget

## What was measured (and what wasn't)
This environment has **no GPU** — Chromium runs WebGL through SwiftShader (CPU software rendering). Under SwiftShader the starting scene renders at well under 1 FPS at 1400×900, which says nothing reliable about real devices; it is useful only for *relative* comparisons and for counting work. **Frame-rate targets below are engineering targets that still need validation on real desktop and mobile hardware.**

Measured with `renderer.info` on the starting neighborhood (desktop, High preset):

| Metric | Before optimisation | Now |
|---|---|---|
| Draw calls per frame (incl. shadow pass) | 737 | ~430 |
| Triangles | 149k | ~111k |
| Meshes in scene | 493 | ~334 |
| Runtime model payload | — | 3.7 MiB (69 GLBs, quantised; no WASM decoder needed) |

Optimisations applied: baked archetypes (merge per material, dequantised CC0 geometry merges too), shared/tinted material cache, per-plot baked wilderness, merged road markings, instanced grass/flowers/path tiles, lower bevel segment counts on small parts, small decorations don't cast shadows, throttled shadow-map updates on Medium/Low, idle engine ticks return the same state object (no React re-render storms).

## Targets
| | Desktop (High) | Mid-range mobile (Medium/Low) |
|---|---|---|
| Frame rate | 60 FPS | 30–60 FPS |
| Draw calls | ≤ 500 | ≤ 250 (Low: no shadows ⇒ ~half) |
| Triangles | ≤ 250k | ≤ 120k |
| Texture memory | ≤ 64 MB | ≤ 32 MB |
| Model payload | ≤ 6 MiB (validated by `npm run assets:validate`) | same |
| Per-model budget | ≤ 512 KiB, ≤ 6k tris (validated) | same |
| Time to interactive | ≤ 4 s on broadband | ≤ 8 s on 4G |
| Placement interaction | no frame > 50 ms | no frame > 80 ms |

## Presets
| | Low | Medium | High |
|---|---|---|---|
| Pixel ratio | 0.75–1 | 1–1.5 | 1–2 |
| Shadows | off | 1024², every 2nd frame | 2048², every frame |
| Grass density | 2/cell | 3/cell | 5/cell |
| Fireflies | off | on | on |

## Next steps
1. Measure on real hardware (Chrome DevTools performance + `renderer.info` overlay in dev tools).
2. Batch all static decorations into a single merged mesh per material with an id buffer for picking.
3. LOD/impostors for wilderness trees at far zoom; frustum-cull residents' mixers when off-screen.
4. KTX2 texture compression once real textured building packs land.
