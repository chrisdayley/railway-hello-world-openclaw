# v26 economy verification

## Automated checks

- Base smoke/data/atlas suite: passes (67 UI IDs, nine data files, 288 areas).
- Economy: nine deterministic/runtime groups pass. Covers 295 unique deeds, discovery and affordability gates, duplicate transactions, seven development types, three capped upgrade tracks, variable profit/loss, idempotent daily settlement, bounded synergies, discounts, legacy migration, actual UI handlers and save/reload.
- Every ordinary enterable building has a collision-reachable deed. Developed businesses have collision, managers and working two-way portals in the actual runtime tests.
- Equipment: seven groups pass. Exploration: ten groups pass. Gameplay: eleven model/contract vectors pass. Camera: 1,890 boundary/viewport cases pass.
- All 42 offline shell assets exist. JavaScript syntax and diff whitespace checks pass.

## Browser verification

An independent playtester bought Mooncup Inn, upgraded quality/capacity/security, bought Lantern Road Parcel, developed an inn, advanced a day, reviewed variable per-property results and transferred the central treasury. The tested two-property day yielded 163 gold; this is a test observation, not a guaranteed payout.

The ledger uses independently scrolling property lists and details, 44px action targets, portfolio/market views, clear cost/revenue forecasts and persistent transaction feedback. The 844x390 landscape layout was visually inspected. Release files are staged together on a release branch before publishing, avoiding an incomplete mixed-version live build.

## Limits

Browser viewport review is not physical iPhone/Safari certification. This milestone does not claim a finished 30–40-hour campaign or a complete business-management simulation. See ECONOMY_V26.md for supported mechanics and exclusions. No real-world money or wall-clock income is involved.
