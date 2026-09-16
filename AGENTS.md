# Everlight: Vale of Echoes — Codex Instructions

## Product goal
Build a solo, mobile-first, offline-capable 2D pixel-art action RPG for iPhone browsers/PWA. No App Store dependency.

## Locked design pillars
- Zelda-like adventurous, mysterious, warm high-fantasy tone.
- Customizable player character; choices matter.
- Balanced viable melee, ranged, and magic builds.
- Bosses are mastery tests with multiple viable solutions; never require one exact spell/item/build.
- 30–40 hour target experience.
- Joinable factions with rank progression, unique high-level gear/abilities, and some mutually exclusive commitments.
- Recruitable companions who fight alongside the player.
- Strong main quest plus side quests, optional bosses, hidden treasure, secrets, random loot tables, rarity tiers, gear upgrades.
- Fast travel unlocks early. Earnable/upgradable mounts and vehicles reduce travel friction.
- Late-game flight (airship or equivalent) is a major progression payoff.
- Light death penalty.
- Pixel-art exploration must be dense with readable environmental clues and hidden areas.
- **Property/economy progression is a major pillar.** The player can purchase shops, homes, buildings, land parcels, and later larger commercial properties across the world, then develop or upgrade them into income-producing assets.
- Property income is variable by day rather than a fixed timer payout. Profit should respond to business type, upgrades, region, local demand, operating costs, faction/story events, and occasional positive/negative events.
- Property ownership must create a satisfying economic engine similar in spirit to Fable-style property ownership: early purchases provide modest help, while a well-built portfolio can fund premium equipment, crafting, mounts, faction projects, airship construction, and expensive endgame investments.
- Economic progression is optional, not mandatory for beating the game, and should never become a real-money/mobile monetization system.
- Players should be able to buy undeveloped land and choose what to build on it. Different development choices should have different costs, risk, income ranges, upgrades, and synergies.
- Major towns should eventually expose many purchasable properties, including ordinary shops/buildings rather than only a few hand-picked quest properties.

## Economy design rules
- Use an in-game day cycle or adventure-day counter. Do not require the player to wait real-world hours/days for money.
- Each owned asset tracks purchase price, current value, business category, tier, maintenance/operating cost, base revenue range, region modifiers, and upgrade state.
- Daily profit = revenue influenced by demand/events/upgrades minus operating cost; allow both strong days and occasional weak/negative days.
- Provide a ledger/dashboard showing portfolio value, yesterday's profit, rolling average profit, and per-property performance.
- Allow upgrades such as capacity, quality, staffing/management, specialty production, security, storage, or magical infrastructure depending on the property type.
- Land development examples: farm/orchard, inn, smithy, apothecary, market stalls, workshop, warehouse, stable, mine/quarry, magical conservatory, or region-specific businesses.
- Property ownership can unlock gameplay perks in addition to cash: shop discounts, crafting access, rare stock, storage, mount services, ingredient production, rumors/quests, faction reputation, or unique items.
- Avoid infinite exponential runaway. Use higher-tier operating costs, diminishing returns, scarcity of premium land, story gates, and optional reinvestment sinks.
- Do not make the player manually collect rent from every building. Income should flow into a central treasury/ledger automatically after each in-game day.

## Platform constraints
- Primary target is HTML5/PWA.
- Must work with touch controls in landscape orientation on iPhone Safari.
- Must remain playable offline after the first successful online load/install.
- Avoid runtime network dependencies, remote fonts, CDNs, analytics, or required APIs.
- Keep core saves in localStorage/IndexedDB and design for migration/versioning.

## Engineering expectations
- Preserve a fast boot path and 60fps target on modern iPhones.
- Keep gameplay data (loot tables, enemies, quests, factions, gear, properties, businesses, land parcels, regional economy) data-driven as the project grows.
- Add tests or deterministic dev utilities where practical for loot, economy, and progression balancing.
- Do not remove existing systems without replacing their functionality.
- Prefer incremental, playable milestones over large untestable rewrites.

## Current milestone
Vertical slice with touch movement, combat, loot rarity, hidden secret, waystone hook, companion hook, first boss, faction/progression prototype, mount hook, and offline PWA shell.

## Next priorities
1. Stabilize Safari/PWA behavior and touch input.
2. Integrate the first playable property economy: at least three purchasable Briarwatch properties plus one land parcel, daily income resolution, upgrades, and a portfolio ledger.
3. Expand opening region into a coherent 30–45 minute slice.
4. Add real save/load and save schema versioning, including economy migration.
5. Add inventory/equipment upgrade loop and boss-specific drop tables.
6. Add faction rank progression UI and rewards.
7. Expand mount and fast-travel implementation.
8. Expand recruitable companion combat behavior.
9. Add second optional secret route and side boss.
