# Everlight Controller Design

## Goal
Everlight should feel like a controller-first action RPG when a Bluetooth gamepad is connected, while retaining touch controls as a fallback.

## Current support
Uses the standard browser Gamepad API and standard-mapping controllers.

### Standard preset
- Left stick: move
- D-pad: movement in gameplay / menu navigation in overlays
- X / Square: attack
- A / Cross: interact / confirm
- B / Circle: dodge / back
- Y / Triangle: quick menu
- Start / Options: open/close main menu
- Select / Share: controller settings
- LB / RB: previous/next menu tab

### Alternate presets
- Action-first: A/Cross attacks; X/Square interacts
- Alternate: Y/Triangle attacks; X/Square becomes quick menu

Preset choice is persisted in localStorage.

## UI behavior
- Touch movement/combat controls fade when a controller is active.
- A brief controller-hint banner appears after connection or preset change.
- Focused menu elements receive a high-contrast focus ring.
- D-pad navigates menu controls and A/Cross activates the focused control.
- B/Circle backs out of menus.
- LB/RB cycles major menu tabs.

## Next refinement pass
Once the player's exact controller model is known and the build can be tested on-device:
- verify button labels/order reported by iOS Safari;
- tune dead zone and analog response curve;
- add right-stick targeting/aim assist if useful;
- add radial quick-slot menu;
- add hold-versus-tap behavior for interact/loot;
- add vibration/haptics where browser/device support permits;
- evaluate whether touch UI should disappear completely instead of fading;
- improve inventory/property/ledger navigation for controller-only use.
