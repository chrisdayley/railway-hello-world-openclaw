# Everlight: Vale of Echoes

This repository hosts **Everlight**, a mobile-first 2D fantasy action RPG designed to run as an offline-capable PWA on iPhone without the App Store.

## Current playable build
**World Awakens (v21)** expands the opening from a single combat arena into the first connected RPG chapter. It includes:

- three gameplay backgrounds with meaningful opening bonuses;
- a HUD-safe tracking camera across Northford, Greenwake Vale, Moonfall Ruins, four shop/service interiors, the Guildhall, and Windstrider Stable;
- touch and keyboard movement, melee combos, aimed Everlight magic, dodge invulnerability, animated enemy windup/strike/recovery states, directional danger telegraphs, damage, defeat and recovery;
- collectible loot piles with gold, materials, equipment, rarity beams, inventory management, gear slots and consumables;
- an authored Mira quest, local side quests, companion combat support, the Hollow Warden boss and an Aether Lens chapter payoff;
- enterable shops, buying, an inn/day cycle, early fast travel, four joinable factions, skill trees, a mount, world-event rumors, and a first property ledger purchase;
- autosave/continue, quest and lore journal, accessibility options, procedural audio and optional haptics;
- a responsive landscape HUD, safe-area support and offline service worker shell.

The data-driven campaign pack in `data/campaign.json` and `docs/CAMPAIGN_30_40_HOURS.md` defines the full 32.5-hour main route, 24 optional side quests, seven regions, faction gates, companions, vehicles, bosses, properties and late-game airship progression. v21 makes Chapter I playable and establishes the reusable runtime systems for the remaining chapters.

## Play / install on iPhone
Once GitHub Pages is enabled for this repository and the deployment succeeds, open the Pages URL in Safari, let the game load once, then use **Share → Add to Home Screen**. The service worker caches the game for offline play after that first successful load.

## Development
`AGENTS.md` contains the locked product and engineering constraints for Codex.

## Local test
Run `npm start` and open `http://localhost:3000`.

Run `npm test` for UI shell/data smoke checks, `npm run test:gameplay` for deterministic gameplay contracts, and `npm run balance` for the economy Monte Carlo report.
