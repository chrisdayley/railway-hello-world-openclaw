# Everlight: Vale of Echoes

This repository now hosts **Everlight**, a mobile-first 2D pixel-art action RPG prototype designed to run as an offline-capable PWA on iPhone without the App Store.

## Play / install on iPhone
Once GitHub Pages is enabled for this repository and the deployment succeeds, open the Pages URL in Safari, let the game load once, then use **Share → Add to Home Screen**. The service worker caches the game for offline play after that first successful load.

## Development
`AGENTS.md` contains the locked product and engineering constraints for Codex.

## Local test
Run `python3 -m http.server 8080` and open `http://localhost:8080`.
