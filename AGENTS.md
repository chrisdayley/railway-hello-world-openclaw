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

## Platform constraints
- Primary target is HTML5/PWA.
- Must work with touch controls in landscape orientation on iPhone Safari.
- Must remain playable offline after the first successful online load/install.
- Avoid runtime network dependencies, remote fonts, CDNs, analytics, or required APIs.
- Keep core saves in localStorage/IndexedDB and design for migration/versioning.

## Engineering expectations
- Preserve a fast boot path and 60fps target on modern iPhones.
- Keep gameplay data (loot tables, enemies, quests, factions, gear) data-driven as the project grows.
- Add tests or deterministic dev utilities where practical for loot and progression balancing.
- Do not remove existing systems without replacing their functionality.
- Prefer incremental, playable milestones over large untestable rewrites.

## Current milestone
Vertical slice with touch movement, combat, loot rarity, hidden secret, waystone hook, companion hook, first boss, and offline PWA shell.

## Next priorities
1. Stabilize Safari/PWA behavior and touch input.
2. Expand opening region into a coherent 30–45 minute slice.
3. Add real save/load and save schema versioning.
4. Add inventory/equipment upgrade loop and boss-specific drop tables.
5. Add faction rank progression UI and rewards.
6. Add mount and fast-travel implementation.
7. Add recruitable companion combat behavior.
8. Add second optional secret route and side boss.
