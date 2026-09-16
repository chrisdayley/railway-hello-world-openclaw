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
- **Dynamic world events are a major pillar.** Limited-duration events should periodically appear in regions and make the world feel active: emergency quests, elite invasions, rare dungeons, roaming bosses, faction clashes, caravans under attack, monster surges, treasure phenomena, magical anomalies, festivals, and economic opportunities.
- World events use in-game time/progression, never real-world timers or online-only scheduling. The player must be able to experience them fully offline.
- World events should be notably harder than routine encounters but offer premium rewards: excellent XP, boosted gold, rare crafting materials, boss-specific drops, high Legendary/Mythic chances, faction reputation, property/economy modifiers, unique cosmetics, mounts, relics, or abilities.
- Missing an event should never permanently lock the player out of essential story progression. Event families recur or rotate, while truly unique one-off events are tied to player-driven story choices rather than arbitrary timing.

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

## World event design rules
- Events are generated from data-driven templates with region, level band, event type, spawn conditions, duration in in-game days/steps, difficulty tier, objectives, enemies/bosses, reward tables, and aftermath effects.
- Telegraph events clearly through NPC rumors, map icons, environmental changes, faction messengers, notice boards, or companion comments.
- Use rarity tiers such as Local, Major, Crisis, and Mythic. Higher tiers are rarer, longer, harder, and more rewarding.
- Event encounters should scale within a bounded range around the player's level but preserve dangerous spikes; not every event should be immediately safe to tackle.
- Event bosses must follow the same multi-solution boss philosophy as the main game.
- Event dungeons can remix layouts, modifiers, enemy combinations, secret rooms, and reward chambers so repeats stay interesting.
- World events can influence the economy for several in-game days: shortages, festivals, military demand, safer trade routes, rare material booms, or damaged infrastructure.
- Completing certain events can create persistent world changes: unlock a merchant, improve a road, reveal a secret, add a property opportunity, increase faction reputation, or make a later event possible.
- Event failure/expiration can change short-term world state but should avoid permanently deleting major content or owned assets.
- Include a World Events journal showing active event, region, remaining in-game time, recommended level, difficulty, known rewards, and completed-event history.

## Platform constraints
- Primary target is HTML5/PWA.
- Must work with touch controls in landscape orientation on iPhone Safari.
- Must remain playable offline after the first successful online load/install.
- Avoid runtime network dependencies, remote fonts, CDNs, analytics, or required APIs.
- Keep core saves in localStorage/IndexedDB and design for migration/versioning.

## Engineering expectations
- Preserve a fast boot path and 60fps target on modern iPhones.
- Keep gameplay data (loot tables, enemies, quests, factions, gear, properties, businesses, land parcels, regional economy, world events) data-driven as the project grows.
- Add tests or deterministic dev utilities where practical for loot, economy, events, and progression balancing.
- Do not remove existing systems without replacing their functionality.
- Prefer incremental, playable milestones over large untestable rewrites.

## Current milestone
Vertical slice with touch movement, combat, loot rarity, hidden secret, waystone hook, companion hook, first boss, faction/progression prototype, mount hook, and offline PWA shell.

## Next priorities
1. Stabilize Safari/PWA behavior and touch input.
2. Integrate the first playable property economy: at least three purchasable Briarwatch properties plus one land parcel, daily income resolution, upgrades, and a portfolio ledger.
3. Add the first playable world-event loop with at least one roaming elite/boss event, one temporary dungeon event, event rewards, expiry by in-game day, and World Events journal UI.
4. Expand opening region into a coherent 30–45 minute slice.
5. Add real save/load and save schema versioning, including economy/event migration.
6. Add inventory/equipment upgrade loop and boss-specific drop tables.
7. Add faction rank progression UI and rewards.
8. Expand mount and fast-travel implementation.
9. Expand recruitable companion combat behavior.
10. Add second optional secret route and side boss.
