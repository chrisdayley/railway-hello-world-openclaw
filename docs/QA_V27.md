# v27 verification

## Automated

- Base smoke: 69 unique UI IDs. Nine data files validate; atlas connectivity/content checks pass.
- New equipment: 8 groups; legacy/runtime equipment: 7 groups.
- Economy pricing: 6 groups; transaction/save/clock runtime: 9 groups. Idle and menu time do not accrue income. Early settlement and repeated inn-rest cannot advance the business day.
- Interiors: 6 groups. Exploration: 11 actual-runtime groups including replayed movement paths to NPCs, chests, ledgers and exits in all seven settlement home types and all seven developed-business types.
- Progression: 7 source/runtime groups, including 24,000 ordinary-loot rolls with no high-tier gear; boss long-range projectiles/damage/pursuit; phase plans; schema9 legacy buckler migration; sealed-hoard requirements; minimap destinations.
- Camera: 1,890 viewport/boundary/mount cases. Gameplay contract: 11 deterministic vectors, not a substitute for the browser playtest.

## Independent browser QA

At 844×390 and 667×320 the playtester verified boss telegraphs/ranged pressure, minimap/HUD/control separation, seven gear slots, dual-charm handling, stat comparisons, equipping/upgrading, compact scrolling, furnished inn/apothecary/workshop layouts, higher property prices and disabled early settlement. A 2,600g Mooncup purchase correctly deducted gold; shield and charm effects changed displayed stats. The stationary caster took damage at range. No browser warnings/errors were recorded. A separate interior review confirmed distinct market/workshop presentation.

The first full-fight attempts exposed recovery windows that were too short. After tuning the opening Warden to 1,080 HP, reducing its damage, extending recovery to 1.35 seconds (1.10 in phase two), and improving post-hit protection, the independent playtester defeated it with ordinary level-six gear using touch controls only. The roughly 35–38-second fight ended at 14/178 HP. Circular movement, dodge timing, ranged attacks and melee attacks during COUNTER NOW were all used; Aether depletion encouraged mixed combat. The Aether Lens reward and chapter-complete sequence advanced correctly. No hidden-state mutation or invulnerability was used.

The final illustrated furniture pass was visually inspected in a house and workshop; all 16 sprite cells have intentional mappings, preserve collision footprints, and retain a loading/offline fallback. The full regression command was rerun successfully after both balance and furniture changes.

## Limits

This is browser viewport, functional and deterministic QA—not physical-device Safari certification or proof of the full planned 30–40-hour campaign. Boss recommendations are fixed regional difficulty, not hard level gates. Existing high-rarity items are not removed from saves. The final source and offline-cache assets are verified before atomic release.
