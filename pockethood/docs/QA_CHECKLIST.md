# QA Checklist

Run before calling a build "done". Automated items name their command.

## Automated
- [ ] `npm run typecheck` — no errors
- [ ] `npm test` — all simulation tests pass
- [ ] `npm run assets:validate` — budgets, clips, references
- [ ] `npm run test:e2e` — loading, tutorial, placement, collection, upgrade, panels, persistence across reload
- [ ] `npm run economy:sim` — review new warnings in docs/ECONOMY_SIMULATION.md
- [ ] `npm run build` — production bundle builds

## Visual review (screenshots at 1280×800 and 390×844)
1. Does it look like a commercial casual game rather than a tech demo?
2. Buildings detailed (roofs, trim, windows, doors, props)? None floating, none clipping?
3. Characters proportionate, animated, readable at default zoom?
4. Cohesive palette — no un-harmonised asset standing out?
5. Lighting/shadows attractive; no shadow acne; night readable?
6. HUD professional; nothing clipped on mobile; text ≥ 12 px?
7. Interactive objects recognisable (bubbles, markers, arrows)?
8. World feels alive with no input for 30 s (walkers, cars, birds, smoke, sway)?

## Gameplay
- [ ] Fresh start shows Mia's intro and the coach within 5 s of load
- [ ] Tutorial completes in 3–5 minutes using only the hinted controls
- [ ] Skipping the tutorial leaves a playable game (orders, Pulse, quests)
- [ ] Every catalog building can be placed, rotated, moved; decorations can be sold
- [ ] Placement refuses road, locked land, overlaps — with a text reason
- [ ] Production queues respect slots, inputs and coin costs; finished goods wait while away
- [ ] Orders only request producible goods; deliver/skip work; new requests arrive
- [ ] Upgrades change function and visuals
- [ ] Talk once/day raises friendship; gift once/day; memories appear in "About"
- [ ] Story chapters start from "!", hand-over works, world changes appear
- [ ] Pulse: 3 goals, rewards once, bonus after all three
- [ ] Fountain: contributions accumulate, stages visible, reward claimable once
- [ ] Expansion: sign → panel → purchase → trees clear, camera pans
- [ ] Reload (F5) restores everything; return after ≥ 15 min shows Welcome Back
- [ ] Settings persist; mute works; reduced motion stops bobbing/sway

## Accessibility
- [ ] All buttons reachable/operable by keyboard; visible focus rings
- [ ] Touch targets ≥ 44 px
- [ ] No colour-only signals (placement & costs have text/labels)
- [ ] Reduced motion respected (OS setting and in-game toggle)
- [ ] Text scale A/A+/A++ doesn't break panels
