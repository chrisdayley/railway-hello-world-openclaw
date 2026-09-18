# v27 — Trials & Treasures

## What changed

- Seven canonical equipment slots: Weapon, Armor, Shield, Helm, Belt, Charm1, Charm2. Both charms contribute, but the same item cannot occupy two slots. Thirteen new helm/belt/shield templates appear in shops and source-aware loot pools. Every slot supports comparisons and five-star upgrades. Max health and defense sum across all slots; mitigation is capped at 70%. Level increases improve both melee and spell damage modestly, capped at 1.9 times base.
- Ten distinct furnished room themes for ordinary settlement homes and developed businesses, with regional palettes, purposeful work/living zones and collision-matched furniture. Existing illustrated Northford interiors and authored dungeon rooms remain. Generated furniture art supplements the deterministic layouts; the code renderer remains a loading fallback.
- An always-visible local minimap shows the player, working exits, waystones, nearby threats, and the current story/contract/tracked destination. Secret chests are not revealed from across the map. Tap it to open the full map/directory.
- World-fixed recommended boss levels: Drowned Keeper 5, Hollow Warden 6, atlas keepers follow regional recommendations with a floor of 5. Faster pursuit, aimed ranged spreads, locked-direction charges, radial attacks, second-phase pressure and deliberate recovery windows replace the close-range-only behavior. No weapon, spell or hard level gate is required. Existing completed Chapter I saves get a one-time Warden’s Remembrance challenge in Moonfall without resetting the story.
- Ordinary chests contain Common/Uncommon supplies and occasional Rare gear, never Epic/Legendary/Mythic. Routine enemies also cannot drop those highest tiers. Bosses and sealed dungeon hoards provide premium rewards. Hoards require two inscriptions plus the area's defeated keeper. Mythic rolls are limited to danger-9+ bosses/hoards, and remain rare. The Aether Lens is explicitly a story relic, not legendary equipment. Existing earned items are retained.
- Property tiers now distinguish Humble, Established, Premium and Prestige. Northford home 850g, land 1,100g, market 2,200g, apothecary 2,400g, inn 2,600g, stable 3,000g, smithy 3,600g. Development is additional. Late-world holdings can exceed 18,000g. Income does not scale proportionally with purchase prices. Existing paid prices, holdings, treasury and performance history remain intact.
- A business day requires five minutes of movement or nearby engaged combat. Menu time and standing idle do not count. Rest restores the character but cannot repeatedly generate rent; the Ledger cannot bypass the adventure-time requirement. This is offline in-game progression, not wall-clock waiting.

## Save and scope

Schema 9 migrates the original Charm slot to Charm1, preserves empty slots and duplicate distinct items, and turns an equipped legacy Echo Buckler into a Shield without destroying it. Chapter completion, quests, discoveries and money are preserved. Build 27 caches its modules and artwork locally after the first successful load. These changes refine the existing world; they do not claim the entire planned 30–40-hour campaign is finished.

## Art provenance

The built-in image-generation tool produced `assets/interior-furniture-v27.png`, a transparent 4×4 sprite atlas used by the new interior renderer. No external runtime asset service is required. Prompt is recorded in ART_V27.md.
