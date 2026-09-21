# Everlight: Vale of Echoes

This repository hosts **Everlight**, a mobile-first 2D fantasy action RPG designed to run as an offline-capable PWA on iPhone without the App Store.

## Current playable build

**The House That Forgot You (v29)** adds a character-focused mystery about Mira’s forgotten brother: three furnished rooms, nonlinear evidence, a physical chime puzzle, a tether-breaking boss and an aftermath that changes the house. Rescue Alden to earn Resonant Dodge and choose a refuge or traveling lantern companion. Continue an existing save and read the letter; no restart is needed. Automated runtime/regression checks pass, but visual mobile playtesting remains unverified because browser control was unavailable. See [research, scope and QA notes](docs/HEARTH_V29.md).

**The Roads Remember (v28)** adds two authored post-prologue arcs: **The Broken Beacon** and **Ashes Under the Road**, with 21 main objectives, three named guardian encounters, eight side stories, persistent choices, rewards, and precise journal/minimap tracking. Completed-prologue saves receive Iona's next objective immediately. Merchants now buy spare inventory, level-ups have a safe celebratory screen, and four ranked skill paths provide 32 nodes/192 ranks. The complete planned 30–40-hour campaign is **not** finished; the new journal clearly identifies the end of the currently authored chapters. See [v28 notes](docs/ROADS_V28.md).

**Trials & Treasures (v27)** adds seven equipment slots, thirteen new gear templates, source-aware loot, faster multi-pattern bosses, a local minimap, richly furnished regional interiors, and a save-up property economy. High-end gear comes from bosses or properly sealed dungeon hoards, not ordinary chests. Existing Chapter I players can challenge the Warden's Remembrance in Moonfall. Schema 9 preserves progress and earned possessions. See [v27 design notes](docs/TRIALS_V27.md).

**Estates & Enterprises (v26)** adds individual building ownership, seven land-development choices, quality/capacity/security upgrades, deterministic daily business reports and a mobile property market. Northford has six purchasable businesses/residences and a land parcel; all seven ordinary buildings in each atlas settlement have individual deeds. Developed parcels become enterable businesses. Income goes to the central treasury as adventure days pass; ownership perks reduce relevant shop and mount prices. Civic buildings and dungeons are not for sale.

**Character & Camera (v25)** replaces the old gear list with a mobile character view, equipped slots, filtered pack, exact before/after build stats and earned five-star equipment upgrades. Its camera gives full-character visibility priority over map boundaries so the HUD cannot hide the player. The Menu button opens Character; a persistent section rail keeps the rest of the adventure menus accessible. Existing saves migrate to schema 7 without resetting progress.

**Roads & Doors (v24)** adds solid buildings aligned to Northford's painted architecture, seven signed walk-in entrances, a town map with destination tracking, animated pixel characters throughout, and running. It expands the authored game with the Bellkeeper's House and a three-chamber optional cistern dungeon: two valves, a keeper battle, a unique reward and a shortcut home. The Aether Lens also reveals a three-clue revisit quest with a Guildhall travel reward.

Every visible house in atlas settlements now has a collision footprint and a working door to an interior, merchant, innkeeper or resident. The bow now fires ranged arrows. Existing systems include:

- three gameplay backgrounds with meaningful opening bonuses;
- a HUD-safe tracking camera across Northford, Greenwake Vale, Moonfall Ruins, four shop/service interiors, the Guildhall, and Windstrider Stable;
- touch and keyboard movement, melee combos, aimed Everlight magic, dodge invulnerability, animated enemy windup/strike/recovery states, directional danger telegraphs, damage, defeat and recovery;
- collectible loot piles with gold, materials, equipment, rarity beams, inventory management, gear slots and consumables;
- an authored Mira quest, local side quests, companion combat support, the Hollow Warden boss and an Aether Lens chapter payoff;
- enterable shops, buying, an inn/day cycle, early fast travel, four joinable factions, skill trees, a mount, world-event rumors, and a first property ledger purchase;
- autosave/continue, quest and lore journal, accessibility options, procedural audio and optional haptics;
- a responsive landscape HUD, safe-area support and offline service worker shell.
- 288 connected explorable areas across 12 regions, including settlements, wilderness, landmarks and 36+ dungeons;
- 546 persistent hidden caches, region-scaled monsters, roaming elites and rarity-scaled equipment drops;
- generated Wayfarer contracts, active/expired world-event state, 96 purchasable business or land opportunities, upgrades, operating costs, variable daily profits, property values and a rolling portfolio ledger;
- attunable Waystones, route discovery and a persistent 288-area exploration journal.
- five distinct illustrated, collision-aware interiors with resident NPCs, readable environmental storytelling, inspectable lore, concealed caches, unique treasure and two additional local side quests.
- generated settlements now include regional merchants and named residents with biome-specific rumors, while landmarks and dungeons contain persistent lore discoveries and cache clues.

The campaign pack in `data/campaign.json` and `docs/CAMPAIGN_30_40_HOURS.md` is a **design plan**, not a completed 32.5-hour campaign. The large atlas is systemic content; it is not hundreds of individually authored adventures. The playable main story currently ends after the first Hollow Warden, with optional quests and exploration continuing afterward.

## Controls

Touch: left stick to move, **Run** to toggle a faster pace, **Map** for destinations, right-side combat and interaction controls. Walk directly onto a door threshold to enter, or tap **Enter** nearby. Running is free outside danger; it consumes stamina near enemies.

Keyboard: WASD/arrows move, Shift runs, R dodges, Space attacks, Q casts, E interacts, M opens the map, I opens equipment.

## Play / install on iPhone
Once GitHub Pages is enabled for this repository and the deployment succeeds, open the Pages URL in Safari, let the game load once, then use **Share → Add to Home Screen**. The service worker caches the game for offline play after that first successful load.

## Development
`AGENTS.md` contains the locked product and engineering constraints for Codex.

## Local test
Run `npm start` and open `http://localhost:3000`.

Run `npm test` for shell/data/atlas checks, `npm run test:exploration` for real-runtime navigation and quest regression tests, `npm run test:gameplay` for legacy gameplay contracts, and `npm run balance` for the economy report. Local-only QA views use `?v=24&qa=town`, `qa=interior-stable`, or `qa=room-cistern`. Debug controls are unavailable on public hosts.
