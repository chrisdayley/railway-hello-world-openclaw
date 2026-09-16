# Everlight Property & Economy System

## Goal
Make wealth-building a satisfying optional progression path. The player should be able to become powerful not only through combat and loot, but also by building a property portfolio that produces useful in-game income and services.

## Core loop
1. Discover a town, district, or land parcel.
2. Inspect available properties and businesses.
3. Buy an existing business/building or purchase land.
4. If land is undeveloped, choose what to build.
5. Upgrade the property and optionally specialize it.
6. Advance an in-game day through normal adventuring/rest/story progression.
7. The economy sim resolves variable revenue, expenses, local modifiers, and events.
8. Profit is deposited automatically into the player's treasury.
9. Reinvest into gear, property, mounts, factions, crafting, or airship progression.

## Initial Briarwatch portfolio
### Ember & Anvil Smithy
- Type: Smithy
- Purchase: 350g
- Base daily revenue: 45–80g
- Operating cost: 20g/day
- Perk: 8% gear-upgrade discount while owned
- Upgrade 1: Better forge — +20% revenue range
- Upgrade 2: Master smith — rare weapon stock can appear
- Risk/event examples: ore shortage, military order, festival demand

### Mooncup Inn
- Type: Inn
- Purchase: 500g
- Base daily revenue: 60–110g
- Operating cost: 32g/day
- Perk: resting in Briarwatch is free; occasional companion-bond event
- Upgrade 1: Extra rooms — +25% revenue
- Upgrade 2: Famous kitchen — chance for high-profit festival days
- Risk/event examples: empty road, merchant caravan, tournament crowd

### Greenbottle Apothecary
- Type: Apothecary
- Purchase: 420g
- Base daily revenue: 50–90g
- Operating cost: 24g/day
- Perk: potions/consumables discounted; chance to generate ingredients
- Upgrade 1: Herb cellar — +15% revenue and ingredient yield
- Upgrade 2: Alchemy lab — rare tonic stock
- Risk/event examples: herb blight, healing demand, rare herb discovery

### Eastfield Parcel
- Type: Undeveloped land
- Purchase: 260g
- Player development choices:
  - Orchard: cheap, steady, low risk
  - Stable: medium cost, mount-related perks and better long-term income
  - Workshop: moderate variability, crafting synergy
- Can be redeveloped later for a fee.

## Daily simulation
Each owned property produces:
`gross revenue = random(baseMin..baseMax) * upgrade multipliers * regional demand * event modifier`

`profit = gross revenue - operating cost`

Regional demand should move within a bounded range (for example 0.80–1.25). Events can temporarily push a property above or below that range.

The player never needs to visit a property to collect income. A day summary appears once per in-game day.

## In-game days
Do not use real-world timers. A new day can resolve when the player:
- rests at an inn/camp/home,
- completes certain major quests,
- uses a deliberate "Rest until morning" interaction,
- or crosses a natural adventure-time threshold if we later add a clock.

This prevents mobile idle-game behavior while still making the economy feel alive.

## Ledger UI
Portfolio screen should show:
- Cash on hand
- Treasury income today
- Total portfolio value
- Yesterday's net profit
- 7-day average profit
- Each property: value, tier, last-day profit, average profit, upgrade availability
- Active market/event modifiers

## Property tiers
1. Local — small shop/home/plot
2. Established — upgraded regional business
3. Prestigious — rare town property or specialized production
4. Landmark — major late-game asset, faction-linked enterprise, mine, port, magical facility, etc.

Tier growth should increase absolute income, but also maintenance, upgrade costs, and event exposure.

## Land development
Purchasing land is distinct from buying an operating shop. Land becomes a strategic choice. Build categories can include:
- Farm/orchard
- Inn/tavern
- Smithy
- Apothecary
- Stable
- Workshop
- Warehouse
- Mine/quarry
- Market hall
- Magical conservatory
- Region-specific businesses

Each category must have different risk, revenue range, perk, and synergy.

## Synergies
Owning multiple complementary properties can unlock small bonuses without creating runaway exponential income.
Examples:
- Mine + Smithy: lower smithy operating cost
- Orchard + Inn: better inn festival profits
- Stable + Trade Depot: improved regional caravan events
- Apothecary + Magical Conservatory: rare ingredient chance

Cap synergy bonuses so the economy remains balanceable.

## Faction interaction
Faction choices should influence the economy without dictating it.
Examples:
- Ironbound: military contracts increase smithy/stable demand but may raise taxes in certain regions.
- Veiled Archive: relic appraisal, magical businesses, and rare antiquities become more profitable.
- Future mercantile faction: reduced transaction fees, premium land access, better information about upcoming demand.

Some faction decisions may permanently alter ownership opportunities in a town.

## Story/world events
The economy should react to the world.
Examples:
- Bandit activity hurts road-dependent inns and trade businesses.
- Clearing a dangerous road improves local commerce.
- A festival increases inn/food/market revenue.
- A monster infestation reduces farm output until dealt with.
- A faction conflict can create lucrative contracts but also risk property damage.

This ties economic success back into exploration and quests.

## Balance target
- Early game: economy is helpful but cannot trivialize equipment costs.
- Midgame: a thoughtful portfolio can comfortably finance upgrades and mounts.
- Late game: a strong property empire can help pay for premium gear, high-end crafting, faction projects, airship expansion, and landmark investments.
- Combat/questing remains viable for players who ignore property ownership entirely.

## Anti-friction rules
- No manual rent collection.
- No real-world wait timers.
- No property decay while the player is offline.
- No surprise permanent loss of a purchased property from RNG.
- Bad events can reduce profit temporarily, not erase major investments without a player-driven story choice.
