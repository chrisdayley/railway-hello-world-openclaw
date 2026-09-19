# The Roads Remember — v28

## What is actually playable

The prologue previously ended with an unfulfilled Chapter II instruction. The generated 288-area atlas, contracts and property systems existed, but did not constitute the planned authored campaign.

This release adds two complete, finite quest arcs through the first two atlas regions. **The Broken Beacon** follows a courier, missing travelers, corrupted road guards, two inscriptions and a beacon restoration. **Ashes Under the Road** investigates erased memories, the keeper Oren and the Bell of Names. Across both: 21 persistent main objectives, three named guardian encounters, two choices with supplies/reputation consequences, companion travel with Mira, and durable beacon/memorial changes. The encounters reuse the established multi-pattern Warden combat system with regional tuning; they are not three wholly new monster archetypes.

Eight side stories have named givers, specific destinations, independent progress, return objectives and one-time rewards: A Remedy for the Road, Someone Left Behind, Letters Never Sent, The Last Ferry, A Smith Without a Forge, The Star That Listens, The Price of Safe Passage and Lanterns Against the Dark. Jory's quest reopens roadside repairs and grants a 5% shop discount. Existing side quests and contracts remain available.

The tracker automatically gives completed-prologue saves a concrete next step: speak to Iona near the Moonfall Waystone. Journal tracking persists and routes through actual exits, including a return road from the atlas. Quest panels reset scroll position, settlements cannot spawn roaming elites, and visible reading/level-up panels block world updates even if another UI callback changes the pause flag. Closing an interaction grants a short input/defensive grace period.

## Growth and trading

Merchants have Buy/Sell navigation, rank-aware resale quotes, safe atomic sales, equipped/quest-item protection, and confirmation for Epic, Legendary and Mythic gear. Prices never exceed 60% of the item value, preventing buy/sell arbitrage. No real money is involved.

Leveling grants an animated gold celebration with new level, skill points, health/aether gains and a direct Skills action. Reduced-motion preferences disable animation. Multiple levels consolidate into one celebration; pending celebrations survive saving. Level cap is 100. Four trees contain 32 nodes with six ranks each: 192 one-point investments, enough for every level-up point through 100 with substantial choice left. Existing six abilities migrate to rank one; their original effects are not double-counted. Rank bonuses affect damage, bow damage, spell damage, health, armor, crit, resource pools, regeneration, movement, healing, loot/clue awareness, counters, chains and dodge cost. Maxima remain bounded.

## Save and offline compatibility

The save key and schema 9 remain compatible; story data has its own version 1 and skillRanks is additive. No reset or item/property removal is performed. New local JS/CSS assets are in the offline cache. There are no runtime network services, external fonts or monetization systems.

## Verification and limits

Automated runtime tests traverse every main objective and side quest with actual interaction handlers, reward idempotence, save migration, route targets, collision positions, settlement safety, skill stats, trade transactions, level-up state and modal combat freeze. These tests use deterministic setup/defeat helpers and are not a full real-time campaign playthrough.

Independent real touch play covered Iona's entry, atlas travel, main/side tracking, a complete Pip quest round trip and reward, settlement safety, merchant sale, plus level-up and skill UI at 844×390 and 667×320. Full existing regression suites also run. Browser viewport QA is not physical-iPhone certification. No claim is made that the entire planned 30–40-hour game or level-100 campaign content is finished.
