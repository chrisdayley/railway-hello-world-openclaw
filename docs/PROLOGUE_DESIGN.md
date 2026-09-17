# The Road Remembers — Playable Prologue Design

## Experience promise

Within the first five minutes the player should feel competent, curious, and personally implicated in the return of the Everlight Ways. The prologue teaches through action and ends with a remembered decision, not an exposition dump.

Moment-to-moment loop:

1. Read an enemy or environmental cue.
2. Move, strike, cast, dodge, or interact.
3. Receive immediate visual, audio, haptic, and state feedback.
4. Earn progress or reveal a new question.

Session loop:

- **Arrival:** follow the mysterious call to Mira.
- **Disruption:** corrupted echoes invade the plaza.
- **Discovery:** the Northford waystone speaks.
- **Mastery test:** defeat the Hollow Warden using melee, magic, or mixed play.
- **Consequence:** choose who the awakened road should serve.
- **Hook:** learn that another beacon—and Corven—may already be responding.

## Play space

Northford is a compact, single-screen twilight village built for legibility on a phone. It uses warm lantern pools against deep green and teal surroundings, with cyan-gold Everlight effects reserved for interactive magic.

Landmarks:

- **Lantern plaza:** Mira and the first narrative choice.
- **Central waystone:** the mystery, climax trigger, and future fast-travel anchor.
- **Forge:** visual promise of equipment progression.
- **Inn and riverside deck:** future companion and rest stories.
- **Southwest ruins:** visual foreshadowing for secrets and optional dungeons.
- **Eastern bridge:** the locked promise of the next region.

The prologue uses a bounded space to eliminate dead travel. Later regions can expand through connected handcrafted screens and fast-travel nodes without changing the input model.

## Player expression

Opening backgrounds bias the first encounter without locking a class:

- **Vanguard:** +20 maximum vitality and stronger starting blade.
- **Wayfinder:** faster movement and increased critical potential.
- **Lightweaver:** +30 maximum aether and stronger spells.

All three can complete every boss. Future progression should unlock tactics—counters, status effects, summons, mobility and weapon identities—rather than only inflating numbers.

## Combat language

- **Strike:** short recovery, assisted facing at close range, three-hit combo with a stronger finisher.
- **Aether:** costs mana, lightly aims toward the nearest nearby threat, and supports ranged play.
- **Dodge:** costs stamina, moves in the current facing direction, and grants a short invulnerability window.
- **Enemy wind-up:** a red expanding ring indicates an incoming attack. Its timing, not its color alone, communicates danger.
- **Feedback:** hit flash, damage number, knockback, burst particles, screen response, sound and optional haptics land together.
- **Failure:** the Way restores the player at the plaza with a light ten-gold loss; story state remains intact.

The Hollow Warden is the first mastery test. Phase one reinforces attack telegraphs and spacing. Below half health it adds a radial Everlight burst that can be dodged, outranged, or survived by a durable build.

## Narrative state

The game records two prologue decisions:

1. What the player tells Mira they heard: a plea for help or a command to open the road.
2. What the player does with the defeated seal: restore the road, bind it to Northford, or silence it.

Each choice receives immediate text feedback and is stored in the journal. Later chapters should call these decisions back through Mira's trust, faction interest, village state, available routes, and Corven's response. Choices should alter context and opportunity without permanently deleting the main game.

## Mobile interface rules

- Landscape-first 16:9 stage with safe-area insets.
- Stable top band: health/aether/stamina at left, objective in the center, gold and pause at right.
- Left thumb: 112px movement control. Right thumb: 60–78px primary actions.
- Contextual interaction only appears when useful.
- Story uses short dialogue packets with a single continue target or two clear choices.
- Journal overlays pause the game, stay within viewport height, and scroll internally.
- Portrait play shows an orientation prompt instead of a broken compressed game.
- Keyboard equivalents remain available for desktop testing and accessibility.

## Accessibility and comfort

- Haptics are optional and meaningful rather than constant.
- Reduced motion disables nonessential animation and transitions.
- High contrast increases UI text and edge separation.
- Left-handed mode swaps movement and action clusters.
- Essential states use text, shape, timing, and motion—not color alone.
- The game autosaves every few seconds and on backgrounding.
- Phone interruption never consumes a life or loses a story decision.

## Next production slice

1. Replace the remaining single-pose hero with a hand-cleaned directional animation atlas.
2. Add two enemy families with different readable behaviors: Briarling ambusher and Hollow Archer.
3. Turn the forge, inn, and market into compact interaction scenes.
4. Add Mira as an AI companion after the prologue, with one active assist and bond barks.
5. Open the eastern bridge into a 20–30 minute Moonfall approach with one secret route.
6. Introduce the first property deed only after the player understands Northford's people and needs.
7. Add music and authored local sound assets while preserving muted play.
8. Expand automated save migration, combat simulation, and real-device Safari testing.

This sequence deepens the proven loop before adding the larger economy, faction, event, mount, airship, and endgame systems already defined in the wider design bible.
