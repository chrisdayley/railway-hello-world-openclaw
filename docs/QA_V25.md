# v25 verification

## Automated checks

- `npm test`: 67 unique UI IDs; all nine data files validated; atlas integrity for 288 areas, 546 secrets and 96 properties.
- `npm run test:equipment`: seven pure/runtime groups. Tests execute the actual journal handlers and combat code: equip, unequip, rank costs/cap, insufficient resources, consumables, maximum-health clamping, bow/spell damage and armor mitigation. Empty weapon slots and upgrade ranks survive migration; a stale full-health use action cannot waste a tonic.
- `npm run test:camera`: 1,890 cases across map edges, seven viewport sizes, small rooms, mounts and abrupt movement.
- `npm run test:exploration`: ten runtime scenarios covering doors, collision, running, optional dungeon, quest rewards, travel, settlements and save migration.
- `npm run test:gameplay`: eleven deterministic vectors; this suite is a model/contract check, not a substitute for browser playtesting.
- JavaScript syntax and `git diff --check` pass.

## Mobile browser review

Landscape layouts reviewed at 844×390 and 667×320. Character preview uses its actual rendered canvas dimensions, avoiding horizontal distortion. At short heights, character stats and the section rail scroll independently instead of overlapping equipment slots. Item details scroll while Equip/Upgrade remain reachable. Primary actions use at least 44px targets.

An independent agent exercised actual browser controls: filters, inspect/back, comparisons, equip, upgrades, five-star cap and map-edge movement. Review findings drove corrections to the compact Charm slot, the preview aspect ratio, explicit missing-resource feedback and off-map scenery. A stale test-fixture HUD was also corrected; the fixture starts at 70 HP, not full health.

## Limits

These are browser viewport and deterministic runtime checks, not a physical iPhone/Safari certification or a 30–40-hour content playthrough. This release refines the existing game systems; it does not claim that the full planned campaign is finished.
