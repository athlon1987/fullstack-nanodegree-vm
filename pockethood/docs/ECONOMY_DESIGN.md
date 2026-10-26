# Economy Design

All numbers live in `src/data/` (buildings, items/recipes, progression). Changing a value needs no code changes elsewhere.

## Currencies
| Currency | Sources | Sinks | Notes |
|---|---|---|---|
| **Coins** | Rent/shop income (capped storage), orders, quests, stories, Pulse, selling goods (60% of value) | Buildings, upgrades, decorations, land, **recipe ingredients**, fountain | Main soft currency |
| **Gems** | Achievements, Pulse daily bonus, stories, fountain, starting 10 | Optional timer skips (1 gem per started 2 min) | Reserved for future monetisation; never required |
| **XP** | Building, upgrading, production, orders, quests, stories, decorations | — | Drives levels/unlocks |
| **Materials** | Workshop (planks, bricks) | Upgrades, Townhouse, Town Hall, land ring 2, fountain | The mid-game sink and production chain |

## Faucets & sinks (after rebalance)
- **Raw recipes cost ingredients** (coffee 2, bread 3, flowers 3, berries 4, vegetables 5, planks 4, bricks 6). Goods are profit margins, not free money.
- **Order board** slots = min(3, residents + 1) (+1 with Town Hall). A completed request is replaced after **2 minutes**, a skipped one after 3. Reward = 1.3 × goods value + 3 + level/2 coins; XP ≈ value/6.
- **Passive income** caps at 10–15 cycles, so being away is never punished but doesn't create unlimited coins.
- **Escalating sinks:** land costs ×1.35 per plot owned; late buildings need materials (Townhouse 2,200 + 6 bricks; Town Hall 4,500 + 10 bricks + 10 planks; Town Hall L2 8,000 + materials).

## Level curve
`0, 30, 120, 300, 600, 1000, 1550, 2250, 3150, 4250`, then +1,500 per level. Level 2 lands inside the tutorial (≈ first order); the guided session funds its own steps (café 100 → upgrade 120 → garden 90) and is regression-tested.

## Tutorial money flow (tested)
Start 150 → +18 rent → +20 quest → −100 café → +20 → 3 coffees (−6, +15 quest) → order +17, +25 quest = **159** → café upgrade −120 → +60 quest → **99 ≥ garden 90**.

## Simulation results (30 days, bots playing the real engine)
Full report: [ECONOMY_SIMULATION.md](ECONOMY_SIMULATION.md). Before vs after the rebalance:

| Profile | Lv day 7 (before → after) | Lv day 30 | Coins day 30 (before → after) |
|---|---|---|---|
| Casual 2×3 min/day | 9 → **6** | 12 | 29,410 → **4,350** |
| Regular 3×5 min/day | 12 → **8** | 15 | 120,850 → 38,447 |
| Enthusiast | 16 → **10** | 22 | 177,813 → 88,114 |
| Returning, every 4 days | 7 → **5** | 8 | 763 → 360 |
| Solo, never contributes | 11 → **8** | 14 | 82,297 → 588 |

**Open issue (known, not hidden):** engaged players build all 12 buildings by roughly days 10–15 and then accumulate coins because there is nothing left to buy except land and decorations. That is a *content depth* problem, not a tuning problem. Planned fixes: more upgrade tiers, the second district, seasonal decoration collections, cosmetic building skins, and community landmarks that scale with Hood size. Re-run `npm run economy:sim` after each content drop.

Solo players reach the same buildings and stories as social players; the fountain is optional.
