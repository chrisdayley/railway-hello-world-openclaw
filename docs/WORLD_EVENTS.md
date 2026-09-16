# Everlight Dynamic World Events

## Goal
Make Vale of Echoes feel alive even in a fully offline solo game. Events should interrupt normal routines with optional high-stakes opportunities that are exciting enough to make the player change plans.

## Timing model
World events use in-game time only. No real-world countdowns, server clocks, login windows, or internet dependencies.

An event can last for:
- a number of in-game days,
- a number of rests,
- a number of completed quests,
- or until another world-state condition resolves.

The player can see how long remains in the World Events journal.

## Event tiers
### Local
Short, accessible events near towns or roads. Good XP and uncommon/rare rewards.

Examples:
- caravan ambush
- monster nest
- missing travelers
- traveling merchant with unusual inventory
- festival challenge

### Major
Harder multi-stage encounters, temporary mini-dungeons, faction conflicts, or elite enemies. Strong XP and Epic/Legendary reward chances.

Examples:
- corrupted ruin opens for three days
- Ironbound/Archive clash over a relic
- monster migration overwhelms a trade road
- ancient vault emerges after a magical storm

### Crisis
Rare regional events with difficult bosses or multi-step objectives. Designed for players willing to prepare, upgrade, or recruit companions first.

Rewards can include boss-specific gear, high-end materials, faction rank boosts, property opportunities, permanent travel improvements, or guaranteed Legendary items.

### Mythic
Very rare late-game events that can rival secret bosses in difficulty. They should feel like world legends briefly becoming real.

Rewards can include Mythic equipment, unique abilities, rare mounts, airship upgrades, relics, or exclusive property/business opportunities.

## Event archetypes
### Roaming boss
A named elite appears in a region and moves among several marked zones until defeated or the event expires.

### Temporary dungeon
A rift, buried ruin, flooded crypt, sky fragment, moon gate, or ancient vault becomes accessible for a short in-game window. Layouts can use modular room combinations with handcrafted special rooms and a final boss/reward chamber.

### Region invasion
Enhanced enemies occupy roads, ruins, farms, or settlements. Clearing commanders weakens the invasion before fighting the leader.

### Faction conflict
Two factions compete over territory, artifacts, prisoners, political leverage, or resources. The player's allegiance and choices affect objectives and rewards.

### Economic event
A festival, ore rush, shortage, trade boom, magical harvest, tournament, or road closure changes business demand and creates related quests.

### Treasure phenomenon
Rare environmental conditions reveal hidden treasure routes, wandering treasure creatures, glowing caverns, submerged ruins, or celestial chests.

### Rescue / defense
Protect a settlement, caravan, property, scholar, faction team, or companion from escalating enemy waves or hunt threats before they arrive.

## Event generation
Each event template contains:
- id
- name
- type
- tier
- eligible regions
- minimum story progress
- level band
- prerequisites
- incompatible world states
- duration
- objectives
- enemy pools
- boss pool
- modifiers
- reward table
- XP multiplier
- economy effects
- faction effects
- persistent aftermath
- recurrence/cooldown rules

Events should feel authored even when selected procedurally. Use named bosses, short narrative framing, environmental changes, and distinctive rewards rather than generic text such as 'kill 10 enemies.'

## Difficulty
Events should be better leveling opportunities specifically because they are dangerous.

Suggested XP multipliers:
- Local: 1.25x normal XP
- Major: 1.5x
- Crisis: 1.8x
- Mythic: 2.25x

High-tier events may appear before the player is ready. The UI should show a recommended level/power estimate instead of hiding them. This creates aspirational moments without requiring the player to participate.

## Rewards
Event rewards should be stronger than ordinary side content. Possible rewards:
- large XP packages
- bonus gold
- event currency used only for premium event vendors (optional, never real money)
- boss-specific weapons/armor
- boosted Legendary/Mythic loot rolls
- unique affixes unavailable in normal drop tables
- rare crafting ingredients
- faction reputation
- companion bond
- new property deeds / premium land opportunities
- temporary or persistent economy boosts
- mounts or mount components
- airship parts/upgrades
- spells, techniques, relics, or skill points

Avoid making all best-in-slot gear event-exclusive. Events should offer powerful alternatives and collectibles without invalidating faction, boss, crafting, exploration, and economy progression.

## World consequences
Examples:
- Clearing bandits raises inn/market revenue in the region for several days.
- Ignoring a monster surge temporarily lowers farm and caravan revenue.
- Saving a mine creates a future purchase opportunity.
- Winning a faction conflict improves faction reputation and may close a rival objective.
- Clearing a sky anomaly can drop an Aether component for the airship.
- A festival increases inns, markets, orchards, and vendors while creating tournament quests.

Owned properties must never be permanently destroyed by random event expiration. Negative effects should be temporary unless the player knowingly chooses a story outcome.

## Recurrence
Most event families should recur with different locations, enemies, modifiers, and rewards.

A player who misses an event because they continued the main story should feel, 'I'll catch the next one,' not 'I permanently ruined my save.'

Special one-time events are allowed when triggered by explicit player story choices.

## Initial event pool
### The Briar King Walks — Major roaming boss
A giant briarbeast begins moving through Greenwake Vale.
- 2 in-game day duration
- Strong melee pressure + summon mechanics
- High XP
- Guaranteed Rare+, high Epic chance
- Unique Briarheart Charm chance
- Defeating it improves Greenwake trade demand for three days

### Moonfall Door — Major temporary dungeon
A sealed lunar door opens in Moonfall Ruins.
- 3 in-game day duration
- 6–9 room modular dungeon
- elite undead/construct encounters
- optional secret treasure chamber
- final boss: The Pale Castellan
- boosted relic loot
- chance for Aether Part

### Broken Caravan — Local event
A merchant caravan is pinned down by monsters.
- short duration
- rescue survivors and cargo
- good early XP/gold
- success temporarily improves Briarwatch shop demand and can reveal discounted property information

### Red Banner Muster — Crisis faction event
Late-midgame faction forces mobilize around a contested fortress.
- multi-stage assault
- objectives differ by faction
- elite commanders + final boss
- high faction reputation
- unique faction gear
- economic aftermath changes nearby smithy/stable demand

### Starfall Beast — Mythic roaming boss
A celestial creature lands in a remote region after the player gains flight.
- extremely challenging optional fight
- multiple viable strategies
- enormous XP
- unique Mythic drop table
- rare airship component

## UI
World Events screen shows:
- event name and tier
- region
- remaining in-game time
- recommended level/power
- short story hook
- objective
- known reward categories
- fast-travel shortcut if an appropriate waystone has been discovered

A small non-intrusive toast announces new events. Do not pause gameplay with repeated modal popups.

## Integration with the economy
Events and economy should feed one another rather than live as isolated systems.

Examples:
- Own a smithy during a military muster: increased revenue, plus an optional supply contract.
- Own an inn during a festival: unusually strong income day.
- Own a stable during a caravan crisis: gain a quest option to supply replacement mounts.
- Own a mine when an ore boom occurs: extra production and a temporary upgrade opportunity.

This should make property ownership feel connected to the living world rather than purely passive income.
