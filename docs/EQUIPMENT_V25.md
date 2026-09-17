# v25 — Character, equipment and mobile visibility

## Research applied

- Blizzard's [Diablo inventory manual](https://ftp.blizzard.com/pub/misc/Diablo.PDF) places worn items around a character silhouette. Everlight adopts a character-centered view with the three slots its actual combat system supports: weapon, armor and charm. No nonfunctional decorative slots.
- Blizzard's [Diablo Immortal itemization explanation](https://news.blizzard.com/en-us/article/23574266/itemization-in-diablo-immortal) separates base attributes, item quality and improvement ranks. Everlight now labels rarity separately from zero-to-five upgrade stars and shows the price and next-rank effect before purchase. All upgrades use earned in-game resources; no monetization or real-time gate.
- Nintendo's [Zelda feature guide](https://zelda.nintendo.com/features/) separates inventory from the adventure log. Everlight keeps Character, Quests, Skills, Factions, World, Ledger and Settings in a persistent mobile navigation rail instead of hiding sections beyond a horizontal tab strip.
- Apple's [game interface guidance](https://developer.apple.com/design/human-interface-guidelines/designing-for-games) emphasizes legibility, touch targets and safe areas. Primary touch targets are at least 44 CSS pixels. Phone layouts prioritize one item decision at a time rather than shrinking desktop columns to illegible text.

## Implemented rules

Combat and the inventory comparison share one stat calculator. Before/after values include equipped items, upgrade rank, skills, faction and opening path. Both increases and decreases are shown with signed numbers and text, not only color.

- Weapon star: +3 base weapon damage.
- Armor star: +2 armor, +4 maximum health.
- Charm star: +1 armor, +3 percentage points to the charm's aether bonus.
- Five stars maximum. Rarity does not change when upgrading.
- Upgrade gold: rounded `(50 + itemValue × 0.3) × (currentRank + 1)`.
- First three stars consume 2/4/6 Briar Fiber; fourth/fifth consume 2/3 Warden Alloy.
- Upgrades belong to the individual item, remain on it while unequipped, and persist in save schema 7.
- Equipping and unequipping do not heal the player; reducing maximum health clamps current health to the new maximum.
- Existing saved inventory is migrated with rank zero when absent. Existing items, gold, quests, properties and discoveries are retained.

## Visibility correction

The old camera calculated a dead zone for the player's feet and then clamped the camera to the map. Near boundaries that clamp could put the player back behind the HUD. v25 measures the top notification lane in screen space, accounts for canvas cropping and the full sprite height (including mounts), and gives a central unobstructed character region priority over map boundaries. The camera can show space beyond a map edge rather than losing the player behind controls.

Off-map camera space is filled with non-walkable forest scenery outdoors and masonry indoors. The backdrop deliberately excludes roads, doors and buildings so it does not advertise fake destinations.

The camera regression suite exercises all map corners, small rooms, multiple landscape sizes, mounts and large frame-to-frame movements. Phone-size browser playtesting complements the deterministic tests; it is not physical iPhone certification.
