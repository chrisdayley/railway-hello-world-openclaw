# v24 release verification — 2026-09-17

## Automated checks

- `npm test`: data references, core DOM contracts and atlas validation.
- `npm run test:exploration`: ten tests execute the real game runtime in a stubbed DOM/canvas, not a second simulation. Covers all seven Northford doors and collision-reachable paths, walls, door cooldown, run speed, both valves, Drowned Bell completion/reward idempotence, save migration, Lens revisits and legacy reliquary saves, Guildhall travel, bow damage, road contracts and seven settlement home destinations.
- `npm run test:gameplay`: existing balance vectors and runtime contract checks.
- JavaScript syntax and `git diff --check`.

## Independent browser playtest

Actual pointer/touch-style joystick and action-button inputs, not only screenshots or debug state, at 844×390 and 667×320:

- Movement in all directions and Run toggle.
- Repeated movement into stable stalls and Northford smithy stops at solid geometry.
- Manual Enter/Exit and walking across the smithy threshold both transition without bouncing back.
- Town map lists seven destinations; Bellkeeper tracking shows a direction and remaining steps.
- Ada starts The Drowned Bell and the journal records the correct objective.
- Short-landscape controls and journal tabs remain usable.
- No console warnings/errors in the independent session.

The playtest found overlapping boss/door/zone/toast layers. These were corrected with a prioritized notification lane and independently rechecked at 844×390. The boss bar remains unobstructed; zone banners suppress door hints; urgent lock feedback replaces the banner. Mara's new matching pixel portrait was also checked.

Cistern enemies were moved away from the entry threshold following the tester's difficulty feedback. Existing 3.5-second entry grace remains in place.

## Scope and limits

The complete new quest state/reward loops were tested deterministically. The independent browser session covered movement, collision, transitions, onboarding and HUD presentation, but did not complete every combat encounter or every atlas area. Desktop phone-size testing is not a physical iPhone Safari/PWA certification. The 30–40 hour campaign remains unfinished; area counts and campaign plans are not evidence of that much authored playable content.
