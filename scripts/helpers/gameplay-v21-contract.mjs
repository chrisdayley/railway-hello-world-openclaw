import assert from 'node:assert/strict';

export const CONTRACT_VERSION = 21;
export const REQUIRED_DEBUG_METHODS = ['reset', 'step', 'snapshot', 'command', 'migrateSave'];

const clone = value => structuredClone(value);

export function createReferenceState(overrides = {}) {
  const state = {
    clockMs: 0,
    player: {
      x: 498, y: 397, gold: 35, baseAttack: 12, attack: 12,
      inventory: [], equipment: { weapon: null }, pickups: 0,
      skillPoints: 0, unlockedSkills: [],
      ownedMounts: [], activeMount: null, speedMultiplier: 1
    },
    enemy: null,
    world: {
      loot: [], zone: 'northford', previousZone: null, transitionCount: 0,
      camera: { x: 0, y: 0 }, viewport: { width: 960, height: 540 },
      bounds: { width: 1920, height: 1080 },
      safeZone: { left: 288, right: 672, top: 162, bottom: 378 }
    },
    shop: { stock: {} },
    quest: { id: 'prologue', stage: 0, wispsDefeated: 0 },
    factions: { active: null, memberships: {} },
    save: null
  };
  return merge(state, overrides);
}

function merge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return clone(patch);
  const out = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    out[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(out[key] && typeof out[key] === 'object' ? out[key] : {}, value)
      : clone(value);
  }
  return out;
}

export function stepReference(state, milliseconds) {
  assert(Number.isFinite(milliseconds) && milliseconds >= 0, 'step milliseconds must be non-negative');
  const next = clone(state);
  next.clockMs += milliseconds;
  const enemy = next.enemy;
  if (!enemy || !enemy.phase || enemy.phase === 'chase') return next;

  const order = ['windup', 'strike', 'recover', 'chase'];
  let remaining = milliseconds;
  while (remaining > 0 && enemy.phase !== 'chase') {
    const duration = enemy.durations[enemy.phase];
    assert(Number.isFinite(duration) && duration > 0, `missing duration for ${enemy.phase}`);
    const untilBoundary = duration - enemy.phaseElapsedMs;
    if (remaining < untilBoundary) {
      enemy.phaseElapsedMs += remaining;
      remaining = 0;
    } else {
      remaining -= untilBoundary;
      enemy.phase = order[order.indexOf(enemy.phase) + 1];
      enemy.phaseElapsedMs = 0;
      if (enemy.phase === 'strike') enemy.strikeStarted = true;
      if (enemy.phase === 'recover') enemy.hitResolved = true;
    }
  }
  return next;
}

function zoneForX(x) {
  return x < 960 ? 'northford' : 'greenwake';
}

function trackCamera(state) {
  const { player, world } = state;
  const camera = world.camera;
  const safe = world.safeZone;
  if (player.x < camera.x + safe.left) camera.x = player.x - safe.left;
  if (player.x > camera.x + safe.right) camera.x = player.x - safe.right;
  if (player.y < camera.y + safe.top) camera.y = player.y - safe.top;
  if (player.y > camera.y + safe.bottom) camera.y = player.y - safe.bottom;
  camera.x = clamp(camera.x, 0, world.bounds.width - world.viewport.width);
  camera.y = clamp(camera.y, 0, world.bounds.height - world.viewport.height);
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function commandReference(state, name, payload = {}) {
  const next = clone(state);
  if (name === 'enemy.kill') {
    assert(next.enemy && next.enemy.id === payload.enemyId, `enemy ${payload.enemyId} not found`);
    next.enemy.dead = true;
    next.world.loot.push({
      id: payload.dropId, kind: payload.kind, amount: payload.amount,
      x: next.enemy.x, y: next.enemy.y
    });
  } else if (name === 'loot.pickup') {
    const index = next.world.loot.findIndex(drop => drop.id === payload.id);
    assert(index >= 0, `loot ${payload.id} not found`);
    const [drop] = next.world.loot.splice(index, 1);
    if (drop.kind === 'gold') next.player.gold += drop.amount;
    else next.player.inventory.push({ id: drop.id, kind: drop.kind, quantity: drop.amount || 1 });
    next.player.pickups++;
  } else if (name === 'player.move') {
    next.player.x = payload.x;
    next.player.y = payload.y;
    const zone = zoneForX(next.player.x);
    if (zone !== next.world.zone) {
      next.world.previousZone = next.world.zone;
      next.world.zone = zone;
      next.world.transitionCount++;
    }
    trackCamera(next);
  } else if (name === 'shop.buy') {
    const stock = next.shop.stock[payload.itemId] || 0;
    if (stock > 0 && next.player.gold >= payload.price) {
      next.player.gold -= payload.price;
      next.shop.stock[payload.itemId] = stock - 1;
      const item = next.player.inventory.find(entry => entry.id === payload.itemId);
      if (item) item.quantity++;
      else next.player.inventory.push({ id: payload.itemId, quantity: 1 });
    }
  } else if (name === 'quest.event') {
    if (payload.event === 'mira.choice' && next.quest.stage === 0) next.quest.stage = 1;
    if (payload.event === 'wisp.defeated' && next.quest.stage === 1) {
      next.quest.wispsDefeated++;
      if (next.quest.wispsDefeated >= 3) next.quest.stage = 2;
    }
    if (payload.event === 'waystone.awakened' && next.quest.stage === 2) next.quest.stage = 3;
    if (payload.event === 'warden.defeated' && next.quest.stage === 3) next.quest.stage = 4;
  } else if (name === 'faction.join') {
    next.factions.active = payload.id;
    next.factions.memberships[payload.id] = { rank: payload.rank || 'Initiate', reputation: payload.reputation ?? 1 };
  } else if (name === 'skill.unlock') {
    if (next.player.skillPoints > 0 && !next.player.unlockedSkills.includes(payload.id)) {
      next.player.skillPoints--;
      next.player.unlockedSkills.push(payload.id);
    }
  } else if (name === 'equipment.equip') {
    const item = next.player.inventory.find(entry => entry.id === payload.itemId);
    assert(item, `equipment ${payload.itemId} not found`);
    next.player.equipment[payload.slot] = payload.itemId;
    if (payload.slot === 'weapon') next.player.attack = next.player.baseAttack + (item.power || 0);
  } else if (name === 'mount.toggle') {
    const mountId = payload.id;
    if (next.player.activeMount === mountId) {
      next.player.activeMount = null;
      next.player.speedMultiplier = 1;
    } else if (next.player.ownedMounts.includes(mountId)) {
      next.player.activeMount = mountId;
      next.player.speedMultiplier = payload.speedMultiplier || 1.5;
    }
  } else {
    throw new Error(`Unknown reference command: ${name}`);
  }
  return next;
}

export function migrateReferenceSave(raw) {
  const source = clone(raw || {});
  const settings = {
    sound: true, haptics: true, reducedMotion: false, highContrast: false,
    leftHanded: false, assistMode: false, ...(source.settings || {})
  };
  return {
    version: CONTRACT_VERSION,
    migratedFrom: source.version ?? 0,
    player: {
      x: source.x ?? 498, y: source.y ?? 397,
      hp: source.hp ?? 100, maxHp: source.maxHp ?? 100,
      mana: source.mana ?? 60, maxMana: source.maxMana ?? 60,
      stamina: source.stam ?? 100, maxStamina: source.maxStam ?? 100,
      gold: source.gold ?? 35, level: source.level ?? 1, xp: source.xp ?? 0,
      style: source.style ?? null
    },
    story: {
      questStage: source.quest ?? 0, storyChoice: source.storyChoice ?? null,
      endingChoice: source.endingChoice ?? null, chapterComplete: !!source.chapterComplete
    },
    inventory: clone(source.inventory || []),
    equipment: clone(source.equipment || { weapon: null }),
    factions: clone(source.factions || { active: null, memberships: {} }),
    skills: clone(source.skills || { points: 0, unlocked: [] }),
    mounts: clone(source.mounts || { owned: [], active: null }),
    economy: clone(source.economy || { day: 1, properties: {} }),
    events: clone(source.events || { active: [], history: [] }),
    settings
  };
}

export function assertSubset(actual, expected, label = 'snapshot') {
  if (expected === null || typeof expected !== 'object') {
    assert.deepEqual(actual, expected, `${label} mismatch`);
    return;
  }
  if (Array.isArray(expected)) {
    assert(Array.isArray(actual), `${label} must be an array`);
    assert.equal(actual.length, expected.length, `${label} length mismatch`);
    expected.forEach((value, index) => assertSubset(actual[index], value, `${label}[${index}]`));
    return;
  }
  assert(actual !== null && typeof actual === 'object', `${label} must be an object`);
  for (const [key, value] of Object.entries(expected)) {
    assert(Object.hasOwn(actual, key), `${label} missing ${key}`);
    assertSubset(actual[key], value, `${label}.${key}`);
  }
}

export function validateDebugApi(api) {
  assert(api && typeof api === 'object', 'window.__EVERLIGHT_DEBUG__ must be an object');
  assert.equal(api.contractVersion, CONTRACT_VERSION, `debug contract version must be ${CONTRACT_VERSION}`);
  for (const method of REQUIRED_DEBUG_METHODS) {
    assert.equal(typeof api[method], 'function', `debug API missing ${method}()`);
  }
}

export async function runDebugScenarios(api, vectors) {
  validateDebugApi(api);
  for (const scenario of vectors.scenarios) {
    await api.reset({ scenario: scenario.id, seed: vectors.meta.seed, state: clone(scenario.initial) });
    for (const [index, action] of scenario.actions.entries()) {
      let actual;
      if (action.type === 'step') {
        await api.step(action.ms);
        actual = await api.snapshot(action.scope);
      } else if (action.type === 'migrate') {
        actual = await api.migrateSave(clone(action.save));
      } else {
        await api.command(action.name, clone(action.payload || {}));
        actual = await api.snapshot(action.scope);
      }
      assertSubset(actual, action.expect, `${scenario.id}[${index}]`);
    }
  }
}
