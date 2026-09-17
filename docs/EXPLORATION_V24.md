# Everlight v24 — Exploration That Earns Its Space

## Goal

v24 should make the existing Northford → Greenwake → Moonfall slice feel authored, legible, and worth revisiting. It should not add regions or advertise a large hour count. The 30–40 hour campaign remains a product target, not a claim about the current build.

The immediate shipping target is **45–75 minutes of polished first-play exploration** across the current town, five interiors, Greenwake, and Moonfall. Expansion resumes only after this slice passes the quality gates below.

## What to take from *A Link to the Past*

Nintendo's original manual describes a small set of consistent actions—talk, lift, throw, open—and makes traversal upgrades such as the Pegasus Boots and Flippers explicit. It also teaches that ordinary world objects can hide hearts and currency, that rumors point toward services or places, and that maps distinguish visited from unvisited rooms. The lesson is not to imitate Zelda content; it is to make the world's interaction grammar learnable and then reuse it in surprising ways. [Official Nintendo manual](https://www.nintendo.co.jp/clvs/manuals/common/pdf/CLV-P-SAAEE.pdf)

Nintendo's own product description remembers the game for atmosphere, ingenious dungeons, and identity-defining tools—not for a numerical area count. [Nintendo: *A Link to the Past*](https://www.nintendo.com/en-gb/Games/Super-Nintendo/The-Legend-of-Zelda-A-Link-to-the-Past-841179.html)

Nintendo's later *A Link Between Worlds* retrospective explains the traditional loop clearly: find an item in a dungeon, then use that capability to reach the next place. The same interview discusses parallel routes as a way to keep a player from being completely stuck. Everlight should use new capabilities to create optional shortcuts, discoveries, and alternate solutions; it should not place the entire critical path behind one obscure secret. [Iwata Asks: “Rethinking the Unquestioned”](https://www.nintendo.com/en-gb/Iwata-Asks/Iwata-Asks-The-Legend-of-Zelda-A-Link-Between-Worlds/The-Legend-of-Zelda-A-Link-Between-Worlds/6-Rethinking-the-Unquestioned-/6-Rethinking-the-Unquestioned--832156.html)

The same development history records a pitch to make 50 small wall-entry dungeons being rejected; the successful direction instead began by proving the mechanic against *A Link to the Past*'s existing landforms. The Everlight inference is direct: a generated quantity is not a design accomplishment until a few spaces prove the complete play loop. [Iwata Asks: prototype and landform discussion](https://iwataasks.nintendo.com/interviews/3ds/a-link-between-worlds/0/2/)

Nintendo's Virtual Console guide also emphasizes multi-room structures, locked doors, one meaningful large chest, and a map that records traversed rooms. This is a useful density model: each compact place needs relationships, state, and a payoff—not merely another coordinate. [Nintendo Japan dungeon guide](https://www.nintendo.co.jp/wii/vc/vc_zel_sfc/vc_zel_sfc_05.html)

## Current v23 diagnosis

- `js/game-v4.js:91-108` already defines a strong compact foundation: Northford, Greenwake, Moonfall, and five visually distinct interiors with collision rectangles.
- `js/game-v4.js:482-540` places five Northford entrances and authored interior NPCs, lore objects, and caches.
- `js/game-v4.js:429-430` only applies `INTERIOR_LAYOUTS` collision. Northford's visible buildings therefore are not solid world geometry.
- `js/game-v4.js:776` renders every portal as the same floating gold diamond. The marker identifies a coordinate, but it does not make the building's doorway readable.
- The same line completely hides secret objects beyond 210 world units. A player cannot notice, remember, and later interpret a distant clue; the chest simply appears when close.
- `js/world-atlas-v22.js:4-68` manufactures 24 areas per region, for 288 total, with repeated enemy, secret, contract, and property templates. `js/game-v4.js:732` turns that count into visible progress. This inflates scope while weakening place identity.
- The authored side-quest seeds in `js/game-v4.js:592-657` are stronger than the generated contracts because they connect a named person, a concrete clue, a specific place, and a reward.

## v24 exploration rules

### 1. A door must look like a door

Every enterable building needs all five signals:

1. A visible break in the facade at the actual transition coordinate.
2. A threshold, path, steps, awning, sign, or lantern aimed toward that break.
3. Contrast between the doorway and the wall, readable at phone scale.
4. A nearby interaction label only when the player is in range.
5. A destination-consistent exit that returns the player just outside the same threshold.

Do not use a floating portal diamond as the primary entrance language. Reserve magical diamonds for Waystones and supernatural gates. Ordinary doors should be architectural objects.

Use the existing Northford targets from `objectsForZone()` (`smithyDoor`, `apothecaryDoor`, `innDoor`, `guildDoor`, `stableDoor`) as the source of truth. Align each visual threshold and collision opening to those coordinates before moving any portal.

### 2. Buildings are solid promises

Northford needs an exterior collision layout parallel to `INTERIOR_LAYOUTS`:

- Each visible building receives a coarse rectangular footprint.
- The footprint has a 72–96 world-unit door opening centered on its portal.
- Roof art may overlap the hero for depth, but the body cannot pass through walls.
- Decorative fences, counters, beds, shelves, and stalls should block movement only when their silhouette clearly implies mass.
- Every entrance and exit spawn must leave the player in a walkable pocket, 60–100 units from the trigger, facing away from it.

The current `collides()` hook at `js/game-v4.js:429-430` is the exact runtime seam. v24 should generalize the layout lookup from interiors-only to zone collision data while retaining the existing `moveActor()` stepped collision behavior.

### 3. A secret is a deduction, not an invisible pickup

Every authored secret uses at least two of these signals:

- visual irregularity: cracked masonry, missing floorboard, displaced books, unusual roots;
- sound or light: a quiet hum, draft, shimmer, or different footstep;
- environmental relationship: tracks end at a wall, furniture faces the wrong way, roots surround old metal;
- rumor: a named NPC gives a directional but nonliteral hint;
- remembered gate: the player sees the obstacle before gaining the relevant capability.

The reward must justify attention: a named item, permanent shortcut, lore that changes an NPC response, skill point, property opportunity, or persistent town change. A generic randomized cache is supplementary loot, not a centerpiece secret.

Replace the current all-or-nothing `secret && distance > 210` treatment in `drawObject()` with two states when implementation begins: a distant environmental clue that is always visible, and the actual interactable/reward revealed only after discovery conditions are met.

### 4. Revisit with new understanding

The Aether Lens is the current slice's natural revisit key. Collecting it already sets `mainStep = 8`, `chapterComplete = true`, and an airship part at `js/game-v4.js:401-406`.

Use that moment to alter earlier places:

- one old symbol now glows;
- one prior NPC has a new interpretation;
- one previously sealed cache becomes reachable;
- one route becomes shorter, not merely richer.

The revisit should take 5–10 minutes through the existing Waystone network (`js/game-v4.js:696-699`), not require replaying Greenwake travel. The player should remember at least one clue without a map marker; the journal may offer a hint after two minutes or on request.

### 5. Link compact areas; stop counting generated ones

Use a repeatable authored topology:

```text
hub/crossroads
├── obvious critical route
├── short optional room with a clue
├── loopback shortcut
└── visible blocked spur for a later revisit
```

For v24:

- Treat Northford, its five interiors, Greenwake, and Moonfall as the shipping world.
- Keep the wider atlas behind the completed-chapter gate as development scaffolding, not as evidence of finished content.
- Remove `X/288` as a player-facing success metric in the eventual runtime pass; show named routes, clues, and resolved places instead.
- Add no new generated region until the current eight authored spaces each have a landmark, a navigation decision, a secret clue, a meaningful interaction, and a changed return state.
- Prefer a connected 6–10 minute area with one loop and one secret over several empty screens.

## Three current-system quest/secret loops

These require no new engine architecture. They use current portals, dialogue, `sideQuests`, `opened`, inventory rewards, save migration, and journal rendering. The descriptions below are implementation plans only; this document makes no runtime changes.

### Loop 1 — The First Smith

**Duration:** 8–12 minutes. **Purpose:** teach that buildings contain readable, authored secrets.

1. Orin in Ember & Anvil hears movement behind the old maker's mark.
2. The mark shows seven hammers around a conspicuously patched eighth recess.
3. Inspecting it changes the crack in the east wall from scenery to an interactable clue; it does not immediately complete the quest.
4. The Cracked-Wall Cache opens and yields the named Briar Edge plus the forge ledger.
5. Returning to Orin changes his dialogue and adds the missing smith's name to the shop sign or ledger.

**Exact integration points:**

- Reuse `sideQuests.smithyLedger` in `defaultSave()` and migration at `js/game-v4.js:128-175`.
- Reuse `orin`, `forgeMark`, and `smithyCache` from `objectsForZone()` at `js/game-v4.js:504-510`.
- Split the existing completion currently inside `inspectLore('forgeMark')` at `js/game-v4.js:620-624` into `active → ready`; complete through the `smithyCache` special case in `openChest()` at `js/game-v4.js:648-657`.
- Record `smithy_mark_read` and `smithyCache` in `S.opened`; the existing autosave path is sufficient.
- Make the wall crack visible in the interior art at all times. Use `INTERIOR_LAYOUTS.smithy` at `js/game-v4.js:103` to keep the cache pocket physically believable and reachable.

**Reward:** guaranteed `briar_edge`, 45 gold, 35 XP, changed Orin dialogue. No random roll.

### Loop 2 — Roots Around Old Gold

**Duration:** 10–15 minutes. **Purpose:** connect town rumor, wilderness clue, and a useful early reward.

1. The Stable Trail Map shows a southeast Greenwake ridge circled in faded gold.
2. Tarin, already stranded in Greenwake, confirms that roots swallowed an old road cache.
3. The player follows a distinct root-and-lantern trail rather than a quest arrow.
4. The Rootbound Cache is visible behind roots from the main path but reached through a short loop around the ridge.
5. Opening it completes Tarin's quest and reveals that the Moonfall Saber reacts toward the east road.
6. Tarin's return dialogue points toward Moonfall without blocking the main path.

**Exact integration points:**

- Reuse `sideQuests.lostScout`, `lostScout`, and `greenwakeCache` at `js/game-v4.js:137`, `493-498`, and `602-605`.
- Reuse `tackMap` at `js/game-v4.js:525-530` and `inspectLore('tackMap')` at `js/game-v4.js:631` as the optional first clue.
- Keep the guaranteed `moonfall_saber`, 65 gold, and 60 XP special case at `js/game-v4.js:648-653`.
- Add authored Greenwake scenery and a solid ridge footprint through the same zone-layout collision seam used for Northford; do not reveal the chest by proximity alone.
- Add the quest's text to the existing side-quest journal mapping at `js/game-v4.js:727-728`.

**Reward:** guaranteed Moonfall Saber and a story-facing clue toward the next region. The loop remains optional and cannot gate `moonfallRoad`.

### Loop 3 — What the Lens Remembers

**Duration:** 12–18 minutes after the Hollow Warden. **Purpose:** make the first major item transform known places.

1. The Aether Lens causes three previously inspected objects to emit the same restrained cyan pulse: the Moonleaf Press, the Stable Trail Map, and the Sundering Mosaic.
2. Each object reveals one fragment: **root**, **road**, and **oath**. The order is free.
3. The three fragments describe an eighth factionless keeper erased from the Guildhall mosaic.
4. The Veiled Reliquary in the Guildhall becomes discoverable; it was visible earlier as a sealed architectural recess.
5. Opening it grants the Echo Buckler and attunes a Northford service gate, adding the Guildhall as a direct Waystone destination for faster town returns.
6. Mira comments on the player's original `storyChoice`, giving the opening decision its first callback.

**Exact integration points:**

- Gate the loop with `S.inventory.some(item => item.id === 'aether_lens')`; the item is created and chapter completion set at `js/game-v4.js:401-406`.
- Reuse `moonleafPress`, `tackMap`, `sunderingMosaic`, and `guildCache` from `objectsForZone()` at `js/game-v4.js:511-539`.
- Extend `inspectLore()` at `js/game-v4.js:620-635` to store `lens:press`, `lens:map`, and `lens:mosaic` in `S.opened`.
- Include `guildCache` only after all three tokens, or show it earlier as a sealed non-chest lore object; resolve its guaranteed reward in `openChest()` at `js/game-v4.js:648-657`.
- Add `lensEchoes` to `sideQuests` and merge it through the existing save migration at `js/game-v4.js:128-175`; render its three-fragment progress through the side-quest journal at `js/game-v4.js:727-728`.
- Use `talkMira()` at `js/game-v4.js:585-590` for the completion callback and `openWaystone()` at `js/game-v4.js:696-699` for the shortcut payoff.

**Reward:** guaranteed `echo_buckler`, 90 XP, story-choice callback, and the Guildhall service-gate destination. This is the slice's proof that revisiting changes play rather than merely respawning loot.

## v24 quality gates

### Navigation and doors

- From Northford plaza, a first-time player can identify the five enterable buildings from architecture without walking up to floating portal icons.
- Every exterior building blocks movement except at its doorway; no visible wall can be crossed.
- Entering and exiting all five buildings 20 times produces no overlap, instant retrigger, wrong destination, or trapped spawn.
- Door labels fit on a phone, use the building's real name, and appear only in interaction range.

### Secrets

- Every featured secret has two perceivable clues before its reward appears.
- No featured secret is a chest generated at an arbitrary coordinate.
- Each of the three loops has a guaranteed authored reward and a persistent NPC, route, or journal response.
- A player who misses a clue can obtain an optional hint from an NPC, the Rumor Board, or the journal; no critical progression depends on guessing.

### Area quality

- Northford, each interior, Greenwake, and Moonfall have one recognizable landmark and one changed return state.
- Ordinary traversal contains no stretch longer than roughly 20 seconds without a navigation decision, encounter, clue, or meaningful vista.
- Returning from Moonfall to Northford takes under two minutes through an attuned Waystone.
- The World journal emphasizes current named routes and unresolved clues, not percentage completion of 288 generated areas.

### Playtest evidence

- Run at least five fresh-player sessions without coaching.
- Four of five players should enter the requested first building within 15 seconds of reaching the plaza.
- Four of five should explain why the Rootbound Cache location looked suspicious before opening it.
- At least three should independently remember one Lens-reactive object after obtaining the Aether Lens.
- Record wall collisions, missed doors, false-secret reads, backtracking time, and reward reactions. Fix observed problems before expanding the atlas.

## Production order

1. Make Northford building footprints solid and align visible thresholds to the five existing portal coordinates.
2. Replace ordinary portal diamonds with architectural door states while retaining magical Waystone language.
3. Implement and QA **The First Smith** end to end.
4. Author the Greenwake ridge loop and finish **Roots Around Old Gold**.
5. Implement **What the Lens Remembers** and verify save migration from current v23 saves.
6. Update the journal away from raw atlas-count messaging.
7. Conduct fresh-player mobile playtests and only then decide whether another compact authored area is warranted.

The v24 milestone is complete when this slice is pleasant to navigate, its buildings feel physically real, its secrets can be inferred, and its first major reward makes old places newly meaningful. More coordinates do not satisfy that bar.
