# The House That Forgot You — v29

## Design diagnosis

Everlight had breadth but weak moment-to-moment motivation. Existing authored objectives often delivered one paragraph, then asked for routine kills or travel. The player rarely had to interpret something, characters seldom reacted beyond a reward, and returning players had no concise emotional/contextual reminder. Adding more generated areas would not address that.

This release is a focused, playable story episode, not a claim that the entire 30–40-hour campaign has been redesigned or finished. Its emotional impact still needs feedback from human play.

## Primary-source research, accessed September 20, 2026

- Przybylski, Rigby & Ryan, *A Motivational Model of Video Game Engagement* (2010): competence, autonomy and relatedness as a framework for intrinsic engagement. Application: readable mastery, choices with functional differences, and an existing companion with personal stakes—not daily rewards, streaks or artificial scarcity. https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf
- Mobius Digital, *The Intentionality of Wandering* (2016), Alex Beachum: enough information to choose a path intentionally, with clues motivating exploration. Application: household memories explain the physical chime order; a portrait points to a concealed reward. https://www.mobiusdigitalgames.com/news/the-intentionality-of-wandering
- Supergiant Games, *Hades FAQ*: action, changing build combinations and unfolding character-driven story together. Application: a resolved relationship produces a new combat ability and a place/character to revisit. This is a design inference, not evidence that these specific Everlight changes will guarantee retention. https://www.supergiantgames.com/blog/hades-faq/

## Implemented episode

Accessible on an existing save from Continue → Read the letter, Quests → The House That Forgot You, or the letter beside Northford’s plaza. It does not reset or replace Chapters I–III. Leaving returns to the original zone and coordinates.

1. A letter in the player's handwriting introduces Mira's forgotten brother, Alden. The promise made here is recalled at the ending.
2. Three memories can be investigated in any order in a furnished, collision-aware hall. Evidence remains in the notebook.
3. The inscriptions teach RAIN → BREAD → EMBER. Players walk to and ring three physical chimes. Wrong sequences are retryable without loss. Notes have distinct audio, but text provides equivalent information.
4. The Collector of Names uses a distinct drawn silhouette, existing multi-pattern boss AI, tethers that reduce resistance and interrupt it, and delayed ground circles that punish standing still. Its first-entry level is bounded 2–8 and persists. No exact build or damage type is required.
5. Alden explains the missing name and the player's letter. Both outcomes rescue him; a refuge grants restoration and +4 HP per Resonant Dodge, while a traveling lantern adds friendly combat projectiles. Reattuning at Alden changes the mechanical choice without replaying rewards.
6. The house becomes warm, Alden and Mira have aftermath dialogue, and an optional clue-led cache awards modest equipment/gold once.

Shared permanent reward: Resonant Dodge. Dodging near a telegraphed threat restores 8 aether and boosts the next melee strike, arrow or spell by 35%. Four-second cooldown; no benefit from empty dodge-spamming. This is proximity-based timing, not a pixel-perfect hitbox/parry system.

The new interior art uses local Canvas geometry and existing pixel actors. No network assets, runtime libraries or online timers were added. Collision walls/furniture match the drawn layout. New code and CSS are precached by the v29 service worker. Save schema 9 gains additive `hearth.version: 1`; existing state remains intact.

## Verification

- v29 runtime tests exercise migration, all six clue orders, wrong-note recovery, room reachability by collision flood fill, actual interaction handlers, tether resistance/recovery, both endings and reward idempotence, clue-led cache, paused reading/deferred level-up, resource reward and friendly companion projectiles.
- Actual update-loop combat simulations defeat the Collector with melee, bow and magic using movement/dodge/attack input, not direct enemy-kill helpers. Scripted play is not a human fun assessment.
- Existing v28 story/trade/skill runtime tests, v27 gear/economy/interior/progression, exploration/equipment/economy runtime tests, camera cases and base smoke/data/atlas checks run for regression coverage.
- Browser limitation: the in-app browser was unavailable; Chrome control timed out on both the game and a blank diagnostic tab. No completed visual/mobile browser playtest is claimed for v29. These are code/runtime-verified changes with visual acceptance still outstanding.

## Follow-through still needed

Carry these principles into the existing main chapters: more authored encounters that change the world, fewer routine kill-count gates, more companion reactions and build-changing rewards. Validate the house's emotional hook and pacing with actual play feedback before treating it as a template for the entire campaign.
