# 🌊 SwimPath — Youth Swimming Progress (Web Prototype)

A mobile-first prototype of **SwimPath**, a platform for tracking, coaching and
predicting swimming development for children aged 4–14. It answers two questions
on every screen:

> **"Is my child improving?"** and **"What should they work on next?"**

This is **v0.1**: a runnable, offline web prototype that implements the core
modules with real, transparent logic — not a mockup. It is the foundation for
the full Flutter + Firebase product described in the original brief.

## Run it

No build step, no dependencies. Either:

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/swimpath/index.html
```

…or just open `swimpath/index.html` directly in a browser. Demo data for an
8-year-old swimmer ("Maya") loads automatically on first run; everything is
stored in `localStorage`.

## What's implemented

| Module | Status |
| --- | --- |
| **Swimmer profile** | ✅ Editable — name, age, height, weight, arm span, club, coach, level, favourite stroke, avatar |
| **Progress engine** | ✅ Overall 0–100 score, confidence %, expectation label (ahead / on track / building), strengths & weaknesses |
| **Stroke tracking** | ✅ 8 technique elements per stroke, colour-coded **radar charts**, live coach-rating sliders |
| **Time tracking** | ✅ Unlimited swims; auto **lifetime / seasonal PBs**, improvement %, pace per 25 m, progression **line chart**, vs-age guide |
| **Gamification** | ✅ XP, levels, coins, streaks, **7 unlockable badges**, reward toasts |
| **AI insights** | ✅ Plain-language observations derived strictly from recorded data |
| **Growth prediction** | ✅ Time projections at 6 mo / 1 yr / 3 yr with **confidence ranges** (estimates, not guarantees) |
| **Analytics** | ✅ Stroke comparison bars, attendance vs. consistency, trophy cabinet, goals |
| Dark / light mode | ✅ |

## How the numbers are calculated

Everything is a **transparent heuristic** — no black box. See `js/engine.js`:

- **Overall score** = weighted blend of technique (45%), performance vs. an
  age-group benchmark (30%), attendance consistency (15%) and recent engagement
  (10%); weights renormalise when data is missing.
- **Performance** compares each event's best time to an approximate age-group
  reference (`BENCH_50_FREE` scaled by distance and a per-stroke factor). These
  references are motivational guides, **clearly not official standards**.
- **Predictions** extrapolate the observed improvement-per-day trend, damped
  ~30% per 6-month block (improvement slows with age), and presented as a range.
- **Confidence** grows with how much data has been recorded.

## Project structure

```
swimpath/
├── index.html          # app shell + bottom nav
├── css/styles.css      # mobile-first aquatic theme (dark + light)
└── js/
    ├── store.js        # localStorage persistence + constants
    ├── engine.js       # scoring, benchmarks, predictions, insights, badges
    ├── charts.js       # dependency-free canvas charts (radar/line/bars/ring)
    ├── seed.js         # demo swimmer
    └── app.js          # UI controller (5 tabs)
```

The data shape in `store.js` (`profile`, `swims`, `strokeRatings`, `sessions`,
`game`, `goals`) intentionally mirrors what would become Firestore collections.

## Roadmap toward the full product

This prototype covers the highest-value modules. Still to build for the full
brief:

1. **Flutter + Firebase** port — Auth, Firestore, Cloud Storage, offline sync.
2. **Role-based access** — parent / coach / swimmer / admin dashboards.
3. **AI video analysis** — pose estimation for head position, elbow angle, kick
   timing, streamline (on-device or cloud function).
4. **Coach & family features** — multi-swimmer management, PDF reports, photo
   timeline, sharing.
5. **Competition mode**, **AI training planner**, **push notifications**.
6. **Future**: wearables, live race timing, national rankings, voice coach.

> Predictions throughout are presented as **data-driven estimates, not
> guarantees**, in line with the product's success criteria.
