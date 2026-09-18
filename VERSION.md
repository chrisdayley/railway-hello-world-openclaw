# Everlight Build

Current mobile build marker: **v27-trials-and-treasures**

Version: **0.13.0**

- Seven gear slots, two distinct charm slots, thirteen new gear templates, aggregate defensive stats and all-slot upgrades/comparisons.
- Faster world-level bosses: ranged volleys, gap-closing charges, radial attacks, second phases, recovery windows, and a one-time post-Chapter-I rematch.
- Always-visible local minimap with player, threats, working exits and objective marker.
- Ordinary chests/monsters capped at Rare; premium loot reserved for bosses and multi-condition sealed dungeon hoards.
- Ten themed regional interior layouts with collision-matched furnishings and a locally cached illustrated furniture atlas.
- Humble-to-Prestige property tiers and substantially higher prices; no repeated-rest rent exploit.
- Schema 9 retains completed story, earned items, property ownership and balances.

- 295 individually tracked deeds: Northford businesses, ordinary settlement buildings, land parcels and existing regional investments.
- Seven land-development choices; completed projects gain a world building, entrance, manager and ledger.
- Quality, capacity and security upgrades capped at three ranks per track; variable daily income, operating costs, incidents and bounded synergies.
- Portfolio/market navigation, forecasts, individual performance, treasury transfers and a rolling ledger.
- Schema 8 preserves legacy investments and equipment; income uses in-game days, never a closed-game timer.

- Mobile character paper doll, equipped weapon/armor/charm slots, filtered inventory and before/after stat comparisons.
- Five-star gear upgrades with visible next-rank benefits, gold/material costs and real combat effects.
- Persistent menu navigation, visible Menu button, saved rank migration and no equip-to-heal exploit.
- Camera guard accounts for the full sprite, actual HUD geometry, mounts and canvas cropping; map edges cannot override player visibility.
- Research and implementation notes: docs/EQUIPMENT_V25.md.

- Animated original pixel actors replace every triangular resident placeholder and the old player fallback.
- Seven aligned Northford entrances, exterior building collision, automatic walk-in doors and safe return positions.
- Town directory map, destination tracking, touch Run toggle, Shift running and R dodge.
- Bellkeeper's House and a three-room optional dungeon with valves, keeper, named loot, persistent quest reward and shortcut.
- Aether Lens revisit quest across the apothecary, stable and Guildhall, unlocking a travel destination.
- Seven enterable solid houses per atlas settlement, safe settlement streets, functioning ranged bow, wall-blocked projectiles.
- v23 saves migrate without losing equipment, quests, gold, property or discovery history. Town positions move to the new safe spawn.
- Campaign hour counts remain design targets, not a claim of a completed campaign.

- Rebuilt mobile shell, HUD, controls, journal and accessibility settings.
- New Northford twilight art direction and production title screen.
- Playable narrative prologue with Mira, remembered choices and Hollow Warden boss.
- Enemy AI, player damage, melee combo, spell damage, dodge i-frames, feedback, autosave and offline caching.
- Safari visual-viewport sizing keeps touch controls inside the visible landscape play area.
- Complete head-to-boots player sprite replaces the cropped torso-only placeholder.
- Multi-zone camera keeps the player inside a HUD-safe play area while exploring north, south, east, and west.
- Readable enemy windup, strike, and recovery animation states expose dodge timing.
- Defeated enemies scatter collectible gold, materials, equipment, rarity beams, and boss loot piles.
- Northford now has enterable shops, an inn, stable, Guildhall, faction pledges, fast travel, equipment, skill trees, mounts, side quests, a property ledger, and a road into Greenwake and Moonfall.
- Faction commitments now require an explicit tradeoff confirmation; mount pricing explains any gold shortfall in-world, and Mira uses her illustrated dialogue portrait.
- The PWA update path bypasses stale navigation caches and automatically moves older installed shells onto v22.
- A data-driven 32.5-hour campaign plan connects seven regions, 37 main quests, companions, vehicles, factions, properties, events, bosses, and late-game flight.
- The playable atlas now contains 288 connected areas in 12 regions, 546 secrets, 96 property sites, dungeons, settlements, elites and local event families.
- Wayfarer Boards generate persistent side contracts; attuned Waystones provide fast travel; each explored area records discovery, enemies, routes and danger.
- The property system now tracks purchase price, value, category, tier, operating cost, revenue range, upgrades, variable profit, lifetime income and a rolling portfolio average.
- Northford's smithy, apothecary, inn, Guildhall, and stable now have distinct illustrated interiors with collision-aware furniture, resident NPCs, lore objects, secrets, treasure containers, and local quest hooks.
- Atlas settlements now contain named regional merchants and residents with contextual rumors; landmarks and dungeons add persistent discoveries, environmental lore, and hidden-cache clues.
