# Everlight Campaign Pacing — 30–40 Hour Main Story

`data/campaign.json` is the production-facing campaign plan for **The Crown of Roads**. It turns the existing world, quest, faction, companion, economy, event, mount, and airship concepts into a 32.5-hour critical path. Optional side quests, recurring world events, property optimization, faction rank grinding, and postgame are deliberately excluded from that number.

## Pacing budget

| Act | Chapters | Regions | Levels | Main hours | Primary progression payoff |
| --- | --- | --- | --- | ---: | --- |
| I — The Vale Wakes | 00–02 | Greenwake, Moonfall | 1–7 | 7.5 | Mira, fast travel, Windstrider, first properties, relics, Nym |
| II — Roads of the Broken Kingdoms | 03–05 | Skyreach, Cinderfen, Sunmere | 7–16 | 13.0 | Factions, rival gates, more companions, vehicle workshop, skiff, airship parts |
| III — The Crown of Roads | 06–07 | Crownstep, Skyreach Expanse | 16–24 | 9.0 | Companion signature skills, airship charter, free flight, capstones |
| Finale — The Last Echo | 08 | Meridian Spire in Skyreach Expanse | 23–26 | 3.0 | Final mastery slot, Corven, network ending, postgame unlock |
| **Total** | **00–08** | **Seven main regions** | **1–26** | **32.5** | **Complete campaign** |

Starfall Hollow is a 4–7 hour optional postgame region. The 18.2 hours of authored side quests and roughly 8 hours of faction/economy depth raise a thorough first playthrough above the critical-path estimate without padding the required story.

## Dramatic rhythm

The campaign uses a repeating mobile-friendly rhythm:

1. Arrive at a hub and meet a person affected by the regional problem.
2. Learn one traversal, combat, economy, companion, or faction system through play.
3. Explore a dense route with a visible future secret and at least one optional branch.
4. Make a local choice with immediate feedback.
5. Complete a dungeon or multi-stage expedition.
6. Defeat a boss that tests learned mechanics through several viable strategies.
7. Receive a traversal or systemic payoff and a clear reason to enter the next chapter.

Required objectives are designed in 10–25 minute beats, while most complete quest steps fit 30–70 minute sessions. Waystones, camps, hub returns, and autosaves create natural stopping points. Chapters avoid mandatory repeat travel: exploration establishes place once, then fast travel, mounts, the skiff, and finally the airship remove friction.

## Story escalation

- **Opening promise:** Northford establishes competence, mystery, Mira, and a remembered choice within 45 minutes.
- **Act I:** Briarwatch shows why restoration matters to ordinary people; Moonfall reveals that the Ways contain memory and that Corven is forcing the network awake.
- **Act II:** Three regional arcs ask who bears the risk, who owns recovered knowledge, and who profits from reconnection. Their order is flexible, but Skyreach introduces the faction sponsor system, Cinderfen resolves Ironbound versus Ashen commitment, and Sunmere resolves Archive versus Gilded commitment.
- **Act III:** Crownstep turns the accumulated components into an airship and demands a permanent charter. The Expanse pays that work off with unrestricted flight, recontextualized old-region secrets, coalition building, and the Last Guardian reveal.
- **Finale:** Meridian Spire reflects prior choices rather than replacing them with a last-minute morality prompt. Corven's argument is answered through what the player actually built, protected, owned, shared, or controlled.

## Progression cadence

- Core strike, ranged, magic, and dodge tools are available immediately; starting backgrounds bias but never lock a class.
- Major skill-tree beats arrive once per chapter and always include Blade, Ranged, Arcane, and either Hybrid, Universal, or Companion options.
- Low-cost respecs are available from Act I onward, with a free full respec before the finale.
- Mira is required so the story always has a relationship anchor. Elya, Torren, Rennic, and Ves are optional recruits with enduring availability.
- Fast travel unlocks in chapter one, Windstrider follows in the same chapter, the Sunmere Skiff arrives in chapter five, and late-game free flight arrives in chapter seven.
- Property play begins with a no-pressure tutorial in Briarwatch, grows through regional deeds, and can finance upgrades, mounts, and the airship without becoming a story gate.

## Choice architecture

Early faction participation is permissive so players can understand each ideology before committing. Four gates then create escalating consequence:

1. **Skyreach sponsor:** route and reward choice; no exclusion.
2. **Ember Lens:** Ironbound and Ashen capstones become mutually exclusive, with a neutral Skyfarer option.
3. **Tidemirror Codex:** Archive and Gilded capstones become mutually exclusive, with a neutral Skyfarer option.
4. **Airship charter:** permanent Skyfarer, primary-faction, or independent charter that alters support, modules, and epilogues without removing critical content.

Companions react, shops and economy modifiers change, and later objectives offer different routes. No faction, companion, property, spell, item, or mount is a single required answer to a main boss.

## Content density and optional play

Every main region contains:

- one hub and waystone;
- multiple shops or service unlocks;
- one required multi-phase mastery boss;
- three or more authored optional quests;
- companion, faction, economy, event, or secret content;
- a visible inaccessible reward that becomes reachable through a later traversal upgrade;
- a persistent world or economy change after the regional climax.

Recurring world events remain optional and use in-game time. Missing one never blocks the campaign, while participation offers stronger loot, faction reputation, property modifiers, and alternate preparation for later chapters.

## Production interpretation

The JSON is intentionally reference-driven. Chapter quests point to NPC, boss, faction-gate, companion, shop, mount, vehicle, event, and property identifiers rather than duplicating full system definitions. Runtime implementation should validate those references as the data loader expands.

The estimated hours are a content budget, not a reason to add empty travel or repeated encounters. If playtests run short, deepen authored encounters, meaningful exploration, companion reactions, and choice consequences. If they run long, remove repetition and travel before cutting story payoffs or mastery encounters.
