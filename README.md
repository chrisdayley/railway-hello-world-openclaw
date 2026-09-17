# Everlight: Vale of Echoes

This repository hosts **Everlight**, a mobile-first 2D fantasy action RPG designed to run as an offline-capable PWA on iPhone without the App Store.

## Playable prologue
**The Road Remembers** is a polished opening vertical slice set in Northford. It includes:

- three gameplay backgrounds with meaningful opening bonuses;
- touch and keyboard movement, melee combos, aimed Everlight magic, dodge invulnerability, enemy AI, damage, defeat and recovery;
- an authored Mira conversation, remembered dialogue choice, combat escalation, Hollow Warden boss and three-way finale choice;
- autosave/continue, quest and lore journal, accessibility options, procedural audio and optional haptics;
- a responsive landscape HUD, safe-area support and offline service worker shell.

## Play / install on iPhone
Once GitHub Pages is enabled for this repository and the deployment succeeds, open the Pages URL in Safari, let the game load once, then use **Share → Add to Home Screen**. The service worker caches the game for offline play after that first successful load.

## Development
`AGENTS.md` contains the locked product and engineering constraints for Codex.

## Local test
Run `npm start` and open `http://localhost:3000`.

Run `npm test` for UI shell/data smoke checks and `npm run balance` for the economy Monte Carlo report.
