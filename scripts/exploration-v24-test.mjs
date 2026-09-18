import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');

class ClassList {
  constructor(initial = []) { this.values = new Set(initial); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name); else this.values.delete(name);
    return enabled;
  }
}

function makeDrawingContext() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(target, property) {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') return () => gradient;
      if (property === 'measureText') return text => ({ width: String(text).length * 8 });
      if (!(property in target)) target[property] = () => {};
      return target[property];
    },
    set(target, property, value) { target[property] = value; return true; }
  });
}

class StubElement {
  constructor(id = '') {
    this.id = id;
    this.classList = new ClassList(['is-hidden']);
    this.style = { setProperty() {} };
    this.dataset = {};
    this.children = [];
    this.textContent = '';
    this.innerHTML = '';
    this.inert = false;
    this.width = 960;
    this.height = 540;
    this.listeners = new Map();
  }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  dispatchEvent(event) {
    for (const handler of this.listeners.get(event.type) || []) handler(event);
    return true;
  }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, value) { this[name] = String(value); }
  getAttribute(name) { return this[name] ?? null; }
  querySelector() { return new StubElement(); }
  querySelectorAll() { return []; }
  getContext() { return makeDrawingContext(); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 140, height: 140 }; }
  focus() {}
  closest() { return null; }
  setPointerCapture() {}
}

function makeAudioContext() {
  const frequency = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const gainValue = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  return class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    resume() { this.state = 'running'; }
    createOscillator() {
      return { frequency, connect(node) { return node; }, start() {}, stop() {}, type: 'sine' };
    }
    createGain() {
      return { gain: gainValue, connect() { return this; } };
    }
  };
}

function loadRuntime() {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, new StubElement(id));
    return elements.get(id);
  };
  const storage = new Map();
  const windowListeners = new Map();
  const document = {
    hidden: false,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    documentElement: element('documentElement'),
    body: element('body'),
    getElementById: element,
    createElement: tag => new StubElement(tag),
    querySelectorAll: () => [],
    addEventListener(type, handler) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(handler);
    },
    exitFullscreen: async () => {}
  };
  const AudioContext = makeAudioContext();
  const context = {
    console,
    document,
    location: { hostname: 'localhost', search: '', reload() {} },
    navigator: { standalone: false, vibrate() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    innerWidth: 390,
    innerHeight: 844,
    visualViewport: null,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener(type, handler) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(handler);
    },
    removeEventListener() {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    setTimeout: () => 1,
    clearTimeout() {},
    performance: { now: () => 1_000 },
    Image: class Image { constructor() { this.complete = false; this.onload = null; } },
    AudioContext,
    webkitAudioContext: AudioContext,
    URLSearchParams,
    structuredClone,
    confirm: () => true,
    Math,
    Date,
    Map,
    Set,
    Object,
    Array,
    JSON,
    Promise
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  for (const relativePath of [
    'js/world-atlas-v22.js',
    'js/exploration-v24.js',
    'js/actors-v24.js',
    'js/camera-v25.js',
    'js/equipment-v25.js',
    'js/economy-v26.js',
    'js/game-v4.js'
  ]) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    vm.runInContext(source, context, { filename: relativePath });
  }
  const debug = context.__EVERLIGHT_DEBUG__;
  assert(debug, 'localhost runtime must expose __EVERLIGHT_DEBUG__');
  assert(debug.navigation, 'runtime must expose __EVERLIGHT_DEBUG__.navigation');
  const dispatchWindow = (type, event = {}) => {
    for (const handler of windowListeners.get(type) || []) handler({ type, ...event });
  };
  return { context, debug, nav: debug.navigation, dispatchWindow };
}

const { context, debug, nav, dispatchWindow } = loadRuntime();
const exploration = context.EVERLIGHT_EXPLORATION;
const atlas = context.EVERLIGHT_ATLAS;

function state() { return nav.get().state; }

function setState(patch) {
  nav.setState({ style: 'vanguard', build: '24', ...patch });
  return state();
}

function placeAt(object, extra = {}) {
  setState({ ...state(), ...extra, x: object.x, y: object.y });
}

function byId(id) {
  const object = nav.objects().find(candidate => candidate.id === id);
  assert(object, `missing runtime object ${id} in ${state().zone}`);
  return object;
}

function findCollisionPath(start, target, { step = 18, reach = 62, width = 1672, height = 941 } = {}) {
  const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const queue = [{ x: start.x, y: start.y, parent: -1 }];
  const visited = new Set(['0,0']);
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    if (Math.hypot(node.x - target.x, node.y - target.y) <= reach) {
      const path = [];
      for (let index = head; index >= 0; index = queue[index].parent) path.push({ x: queue[index].x, y: queue[index].y });
      return path.reverse();
    }
    const cellX = Math.round((node.x - start.x) / step);
    const cellY = Math.round((node.y - start.y) / step);
    for (const [dx, dy] of directions) {
      const nextCellX = cellX + dx;
      const nextCellY = cellY + dy;
      const key = `${nextCellX},${nextCellY}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const x = start.x + nextCellX * step;
      const y = start.y + nextCellY * step;
      if (x < 13 || y < 13 || x > width - 13 || y > height - 13 || nav.collides(x, y, 13)) continue;
      queue.push({ x, y, parent: head });
    }
  }
  return null;
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('all seven authored Northford doors are collision-reachable', () => {
  assert.equal(exploration.townDoors.length, 7, 'Northford must expose seven authored doors');
  for (const door of exploration.townDoors) {
    setState({ zone: 'northford', x: 965, y: 625 });
    nav.clearEnemies();
    const start = { x: state().x, y: state().y };
    assert.equal(nav.collides(start.x, start.y, 13), false, 'Northford spawn must be walkable');
    const path = findCollisionPath(start, door);
    assert(path, `${door.name} has no collision-valid path from the town spawn`);

    for (const waypoint of path.slice(1)) {
      const before = state();
      nav.move(waypoint.x - before.x, waypoint.y - before.y);
      const after = state();
      assert.equal(nav.collides(after.x, after.y, 13), false, `${door.name} path moved into a solid`);
    }
    assert(Math.hypot(state().x - door.x, state().y - door.y) <= 64,
      `${door.name} collision path stops outside interaction reach`);
  }
});

test('solid geometry blocks direct movement through a room wall', () => {
  setState({ zone: 'sluice', x: 560, y: 520, opened: [] });
  nav.clearEnemies();
  assert.equal(nav.collides(560, 410, 13), true, 'sluice center wall must be solid');
  nav.move(0, -210);
  assert(state().y >= 473, `player crossed the center wall (ended at y=${state().y})`);
  assert.equal(nav.collides(state().x, state().y, 13), false, 'blocked movement must leave player in walkable space');
});

test('door portals transition and their exit cooldown prevents bounce-back', () => {
  setState({ zone: 'northford', x: 1329, y: 579 });
  nav.tick(1.3);
  nav.interact();
  assert.equal(state().zone, 'bellkeeper', 'town door must enter its target room');
  nav.interact();
  assert.equal(state().zone, 'bellkeeper', 'freshly entered room must not immediately bounce through its exit');
  nav.tick(1.3);
  nav.interact();
  assert.equal(state().zone, 'northford', 'room exit must work after cooldown expires');
});

test('run input moves materially faster than walking in the real update loop', () => {
  const origin = { zone: 'greenwake', x: 1080, y: 650, stam: 100, maxStam: 100 };
  setState(origin);
  nav.clearEnemies();
  nav.input(1, 0);
  nav.run(false);
  nav.tick(0.4);
  const walkingDistance = state().x - origin.x;

  setState(origin);
  nav.clearEnemies();
  nav.input(1, 0);
  nav.run(true);
  nav.tick(0.4);
  const runningDistance = state().x - origin.x;
  nav.input(0, 0);
  nav.run(false);

  assert(walkingDistance > 0, 'walking input must move the player');
  assert(runningDistance > walkingDistance * 1.55,
    `running must be about 70% faster (walk ${walkingDistance}, run ${runningDistance})`);
});

test('the Sluice vault requires both independently activated valves', () => {
  setState({ zone: 'sluice', x: 560, y: 190, opened: [], sideQuests: { drownedBell: 'active' } });
  nav.clearEnemies();
  nav.tick(1.3);
  nav.interact();
  assert.equal(state().zone, 'sluice', 'vault must remain sealed with no valves');

  placeAt(byId('moonValve'));
  nav.interact();
  assert(state().opened.includes('moonValve'), 'Moon valve interaction must persist');
  assert(!state().opened.includes('sunValve'), 'Moon valve must not activate the Sun valve');

  placeAt(byId('vaultDoor'));
  nav.tick(1.6);
  nav.interact();
  assert.equal(state().zone, 'sluice', 'one valve must not unlock the vault');

  placeAt(byId('sunValve'));
  nav.interact();
  assert(state().opened.includes('sunValve'), 'Sun valve interaction must persist');

  placeAt(byId('vaultDoor'));
  nav.tick(1.6);
  nav.interact();
  assert.equal(state().zone, 'vault', 'both valves must unlock the vault');
});

test('Drowned Bell advances to ready and pays each reward exactly once', () => {
  setState({
    zone: 'vault', x: 560, y: 700, gold: 200, xp: 0, level: 3, skillPoints: 0,
    opened: ['moonValve', 'sunValve'], sideQuests: { drownedBell: 'active' }
  });
  const boss = nav.get().enemies.find(enemy => enemy.kind === 'warden' && !enemy.dead);
  assert(boss, 'entering an uncleared vault must spawn its real warden');
  debug.defeatNearest();
  assert.equal(state().sideQuests.drownedBell, 'ready', 'defeating the vault warden must ready the bell quest');
  assert(state().opened.includes('drowned-keeper'), 'warden defeat must clear the reliquary seal');

  placeAt(byId('bellReliquary'));
  nav.interact();
  const afterReliquary = state();
  assert(afterReliquary.opened.includes('bellReliquary'), 'reliquary must record its one-time opening');
  assert.equal(afterReliquary.gold, 285, 'reliquary must award 85 gold once');
  assert.equal(afterReliquary.inventory.filter(item => item.id === 'echo_buckler').length, 1,
    'reliquary must award one Echo Buckler');
  nav.closeDialogue();
  nav.interact();
  assert.equal(state().gold, afterReliquary.gold, 'reopening the reliquary must not duplicate gold');
  assert.equal(state().inventory.filter(item => item.id === 'echo_buckler').length, 1,
    'reopening the reliquary must not duplicate the item');

  debug.enterZone('bellkeeper');
  nav.tick(1.3);
  placeAt(byId('ada'));
  const beforeAda = state();
  nav.interact();
  const afterAda = state();
  assert.equal(afterAda.sideQuests.drownedBell, 'complete', 'Ada must complete a ready recovered-bell quest');
  assert.equal(afterAda.gold - beforeAda.gold, 120, 'Ada must award 120 gold');
  assert(afterAda.skillPoints > beforeAda.skillPoints, 'Ada must award at least the promised skill point');
  nav.closeDialogue();
  nav.interact();
  const afterRepeat = state();
  assert.equal(afterRepeat.gold, afterAda.gold, 'Ada must not duplicate quest gold');
  assert.equal(afterRepeat.skillPoints, afterAda.skillPoints, 'Ada must not duplicate skill points');
  assert.equal(afterRepeat.xp, afterAda.xp, 'Ada must not duplicate quest XP');
});

test('schema migration preserves exploration and economy progress', () => {
  const migrated = debug.migrateSave({
    schema: 5,
    build: '23',
    style: 'ranger',
    zone: 'sluice',
    x: 777,
    y: 666,
    gold: 987,
    opened: ['moonValve', 'sunValve', 'bellReliquary'],
    sideQuests: { drownedBell: 'ready' },
    atlasDiscovered: ['atlas_greenwake_00'],
    properties: { smithy: { level: 2, value: 900 } },
    settings: { reducedMotion: true }
  });
  assert.equal(migrated.schema, 8);
  assert.equal(migrated.build, '26');
  assert.equal(migrated.style, 'ranger');
  assert.equal(migrated.zone, 'sluice');
  assert.equal(migrated.x, 777);
  assert.equal(migrated.y, 666);
  assert.equal(migrated.gold, 987);
  assert.deepEqual([...migrated.opened], ['moonValve', 'sunValve', 'bellReliquary']);
  assert.equal(migrated.sideQuests.drownedBell, 'ready');
  assert.equal(migrated.sideQuests.apothecary, 'available', 'migration must supply newly required defaults');
  assert.equal(migrated.properties['estate:smithy'].level, 2);
  assert.equal(migrated.settings.reducedMotion, true);
  assert.equal(migrated.settings.highContrast, false, 'migration must merge missing accessibility settings');
});

test('Aether Lens revisits, legacy reliquary saves, reward idempotence, and Guildhall travel work end to end', () => {
  const legacy = debug.migrateSave({
    schema: 5,
    build: '23',
    style: 'ranger',
    zone: 'apothecary',
    x: 768,
    y: 820,
    xp: 0,
    level: 4,
    skillPoints: 0,
    opened: ['guildCache'],
    inventory: [
      { id: 'roadworn_blade', name: 'Roadworn Blade', type: 'Weapon', rarity: 'Common', power: 12, uid: 'legacy-weapon' },
      { id: 'aether_lens', name: 'Aether Lens', type: 'Quest', rarity: 'Legendary', uid: 'legacy-lens' }
    ],
    equipment: { Weapon: 'legacy-weapon' },
    sideQuests: { drownedBell: 'available' }
  });
  nav.setState(legacy);

  const inspectMemory = (zone, objectId, expectedKey) => {
    setState({ ...state(), zone });
    placeAt(byId(objectId));
    const before = state();
    nav.interact();
    const after = state();
    assert(after.opened.includes(expectedKey), `${objectId} must restore ${expectedKey}`);
    assert.equal(after.xp - before.xp, 20, `${objectId} must award its one-time memory XP`);
    nav.closeDialogue();
    nav.interact();
    assert.equal(state().xp, after.xp, `${objectId} must not duplicate memory XP`);
    nav.closeDialogue();
  };

  inspectMemory('apothecary', 'moonleafPress', 'lens:root');
  inspectMemory('stable', 'tackMap', 'lens:road');
  inspectMemory('guildhall', 'sunderingMosaic', 'lens:oath');
  assert.equal(state().sideQuests.lensEchoes, 'ready', 'three distinct memories must ready the Lens quest');

  placeAt(byId('guildCache'));
  const beforeReward = state();
  nav.interact();
  const afterReward = state();
  assert.equal(afterReward.sideQuests.lensEchoes, 'complete',
    'a legacy save that already opened guildCache must still complete the new Lens reward');
  assert.equal(afterReward.skillPoints - beforeReward.skillPoints, 1, 'Lens reliquary must award one skill point');
  assert.equal(afterReward.inventory.filter(item => item.id === 'echo_buckler').length, 1,
    'Lens reliquary must award exactly one Echo Buckler');
  nav.closeDialogue();
  nav.interact();
  const afterRepeat = state();
  assert.equal(afterRepeat.skillPoints, afterReward.skillPoints, 'reopening the Lens reliquary must not duplicate skill points');
  assert.equal(afterRepeat.xp, afterReward.xp, 'reopening the Lens reliquary must not duplicate XP');
  assert.equal(afterRepeat.inventory.filter(item => item.id === 'echo_buckler').length, 1,
    'reopening the Lens reliquary must not duplicate the Echo Buckler');

  setState({ ...state(), zone: 'northford' });
  placeAt(byId('waystone'));
  nav.interact();
  const interactionBody = context.document.getElementById('interactionBody');
  assert.match(interactionBody.innerHTML, /data-travel="guildhall"/,
    'completed Lens quest must add Guildhall to the Waystone network');
  const guildhallTravelButton = {
    dataset: { travel: 'guildhall' },
    closest(selector) { return selector === '[data-travel]' ? this : null; }
  };
  interactionBody.dispatchEvent({ type: 'click', target: guildhallTravelButton });
  assert.equal(state().zone, 'guildhall', 'Guildhall Waystone choice must perform real travel');

  const beforeBowCombat = state();
  setState({
    ...beforeBowCombat,
    zone: 'greenwake', x: 1080, y: 650,
    inventory: [...beforeBowCombat.inventory, {
      id: 'wayfarer_bow', name: 'Wayfarer Bow', type: 'Weapon', rarity: 'Uncommon', uid: 'test-bow'
    }],
    equipment: { ...beforeBowCombat.equipment, Weapon: 'test-bow' }
  });
  nav.clearEnemies();
  debug.spawnEnemy('briar', state().x + 125, state().y);
  const target = nav.get().enemies.find(enemy => enemy.kind === 'briar');
  assert(target, 'bow combat test needs a live target');
  dispatchWindow('keydown', { code: 'Space', repeat: false, preventDefault() {} });
  for (let i = 0; i < 6; i++) nav.tick(0.05);
  dispatchWindow('keyup', { code: 'Space' });
  const struck = nav.get().enemies.find(enemy => enemy.id === target.id);
  assert(struck.hp < target.hp, 'equipped Wayfarer Bow must fire a projectile that damages a ranged target');
});

test('settlement contracts send kills to a neighboring road and pay once at the issuing board', () => {
  const settlementId = atlas.firstArea;
  const settlement = atlas.get(settlementId);
  assert.equal(settlement.kind, 'settlement', 'contract test must begin at a settlement');
  setState({
    zone: settlementId, x: 900, y: 700, gold: 400, xp: 0, level: 8,
    dynamicQuests: {}, areaKills: {},
    activeEvents: {
      [settlementId]: { id: 'legacy-settlement-event', status: 'active', progress: 0, target: 4 }
    }
  });
  assert.equal(state().activeEvents[settlementId].status, 'expired',
    'entering a settlement must expire an obsolete combat event there');

  const board = byId(`${settlementId}:board`);
  placeAt(board);
  nav.interact();
  const interactionBody = context.document.getElementById('interactionBody');
  const questId = `quest:${settlementId}`;
  assert.match(interactionBody.innerHTML, new RegExp(`data-accept-quest="${questId}"`),
    'settlement board must render an accept action');
  const acceptButton = {
    dataset: { acceptQuest: questId },
    closest(selector) { return selector === '[data-accept-quest]' ? this : null; }
  };
  interactionBody.dispatchEvent({ type: 'click', target: acceptButton });

  const accepted = state().dynamicQuests[questId];
  assert(accepted, 'board acceptance must persist the contract');
  assert.equal(accepted.status, 'active');
  assert.notEqual(accepted.targetAreaId, settlementId, 'settlement contract cannot target its enemy-free issuing area');
  const targetArea = atlas.get(accepted.targetAreaId);
  assert(targetArea, 'contract target must resolve to a real atlas area');
  assert.notEqual(targetArea.kind, 'settlement', 'settlement contract must target neighboring combat terrain');
  assert(Object.values(settlement.exits).includes(targetArea.id), 'contract target must directly neighbor its settlement');

  setState({ ...state(), zone: targetArea.id, x: 900, y: 550 });
  nav.clearEnemies();
  for (let kill = 0; kill < accepted.target; kill++) {
    debug.spawnEnemy('briar', state().x + 120, state().y);
    debug.defeatNearest();
  }
  const ready = state().dynamicQuests[questId];
  assert.equal(ready.progress, ready.target, 'kills in the specified neighboring area must fill contract progress');
  assert.equal(ready.status, 'ready', 'completed neighboring-area kills must ready the issuing board reward');
  assert.equal(state().areaKills[targetArea.id], ready.target, 'target-area kill counter must track the same progress');
  assert.equal(state().areaKills[settlementId] || 0, 0, 'enemy-free settlement kill counter must remain untouched');

  setState({ ...state(), zone: settlementId, x: board.x, y: board.y });
  const beforeReward = state();
  nav.interact();
  const afterReward = state();
  assert.equal(afterReward.dynamicQuests[questId].status, 'complete', 'issuing board must complete its ready contract');
  assert.equal(afterReward.gold - beforeReward.gold, ready.reward, 'issuing board must pay the advertised gold exactly once');
  nav.closeDialogue();
  nav.interact();
  const afterRepeat = state();
  assert.equal(afterRepeat.gold, afterReward.gold, 'revisiting a completed board contract must not duplicate gold');
  assert.equal(afterRepeat.xp, afterReward.xp, 'revisiting a completed board contract must not duplicate XP');
});

test('all seven settlement doors resolve to distinct, enterable home rooms', () => {
  const settlementId = atlas.firstArea;
  setState({ zone: settlementId, x: 900, y: 700 });
  nav.clearEnemies();
  const doors = nav.objects().filter(object => object.door && object.target.startsWith('home@'));
  assert.equal(doors.length, 7, 'settlement must expose seven house doors');
  assert.equal(new Set(doors.map(door => door.target)).size, 7, 'each settlement door needs a distinct target room');

  for (const door of doors) {
    const room = exploration.homeZone(door.target, atlas);
    assert(room, `${door.target} must resolve through the exploration module`);
    assert.equal(room.parent, settlementId);
    setState({ zone: settlementId, x: door.x, y: door.y });
    nav.clearEnemies();
    nav.tick(1.3);
    nav.interact();
    assert.equal(state().zone, door.target, `${door.name} must enter its own room`);
    const exit = byId('exit');
    assert.equal(exit.target, settlementId, `${door.name} room exit must return to its settlement`);
  }
});

let failures = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`\u2713 ${name}`);
  } catch (error) {
    failures++;
    console.error(`\u2717 ${name}`);
    console.error(error.stack || error);
  }
}

if (failures) {
  throw new Error(`${failures} exploration v24 runtime test${failures === 1 ? '' : 's'} failed`);
}
console.log(`\u2713 ${tests.length} exploration v24 runtime tests passed`);
