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

function drawingContext() {
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
    this.listeners = new Map();
    this.children = [];
    this.textContent = '';
    this.innerHTML = '';
    this.inert = false;
    this.width = 960;
    this.height = 540;
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
  querySelector(selector) { return selector === '#equipmentPreview' ? null : new StubElement(); }
  querySelectorAll() { return []; }
  matches() { return false; }
  getContext() { return drawingContext(); }
  getBoundingClientRect() { return { left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844 }; }
  focus() {}
  closest() { return null; }
  setPointerCapture() {}
}

function audioContextClass() {
  const frequency = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const gainValue = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  return class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    resume() { this.state = 'running'; }
    createOscillator() {
      return { frequency, connect(node) { return node; }, start() {}, stop() {}, type: 'sine' };
    }
    createGain() { return { gain: gainValue, connect() { return this; } }; }
  };
}

function loadRuntime() {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, new StubElement(id));
    return elements.get(id);
  };
  const windowListeners = new Map();
  const documentListeners = new Map();
  const storage = new Map();
  const document = {
    hidden: false,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    activeElement: element('activeElement'),
    documentElement: element('documentElement'),
    body: element('body'),
    getElementById: element,
    createElement: tag => new StubElement(tag),
    querySelectorAll: () => [],
    addEventListener(type, handler) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(handler);
    },
    exitFullscreen: async () => {}
  };
  const AudioContext = audioContextClass();
  const context = {
    console,
    document,
    location: { hostname: 'localhost', search: '', reload() {}, replace() {} },
    navigator: { standalone: false, vibrate() {} },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 1,
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
    'js/game-v4.js'
  ]) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    vm.runInContext(source, context, { filename: relativePath });
  }
  const debug = context.__EVERLIGHT_DEBUG__;
  assert(debug?.navigation, 'localhost runtime must expose navigation debug API');
  const dispatchWindow = (type, event = {}) => {
    for (const handler of windowListeners.get(type) || []) handler({ type, ...event });
  };
  return { context, debug, nav: debug.navigation, dispatchWindow, elements, storage };
}

const { context, debug, nav, dispatchWindow } = loadRuntime();
const equipment = context.EVERLIGHT_EQUIPMENT;
assert.equal(equipment.version, 25, 'v25 equipment module must be loaded');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function state() { return nav.get().state; }
function setState(patch) { nav.setState({ style: 'vanguard', build: '25', ...patch }); return state(); }

function clickJournal(attribute, value) {
  const camel = attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const selector = `[data-${attribute}]`;
  const target = {
    dataset: { [camel]: value },
    closest(candidate) { return candidate === selector ? this : null; }
  };
  context.document.getElementById('journalBody').dispatchEvent({ type: 'click', target });
}

function openGear() {
  dispatchWindow('keydown', { code: 'KeyI', repeat: false, preventDefault() {} });
  return context.document.getElementById('journalBody').innerHTML;
}

test('effective rank stats clamp to 0–5 without mutating source items', () => {
  const weapon = { uid: 'w', type: 'Weapon', power: 10, rank: 2 };
  const armor = { uid: 'a', type: 'Armor', armor: 4, maxHp: 10, rank: 3 };
  const charm = { uid: 'c', type: 'Charm', armor: 2, spell: 0.2, rank: 8 };
  const before = JSON.stringify({ weapon, armor, charm });
  const effectiveWeapon = equipment.effective(weapon);
  const effectiveArmor = equipment.effective(armor);
  const effectiveCharm = equipment.effective(charm);
  assert.equal(effectiveWeapon.power, 16);
  assert.equal(effectiveArmor.armor, 10);
  assert.equal(effectiveArmor.maxHp, 22);
  assert.equal(effectiveCharm.rank, 5);
  assert.equal(effectiveCharm.armor, 7);
  assert(Math.abs(effectiveCharm.spell - 0.35) < 1e-9);
  assert.equal(equipment.effective({ type: 'Weapon', power: 9, rank: -4 }).power, 9);
  assert.equal(equipment.effective({ type: 'Weapon', power: 9, rank: 2.9 }).rank, 2);
  assert.equal(equipment.effective(null), null);
  assert.equal(JSON.stringify({ weapon, armor, charm }), before, 'effective() must not mutate source items');
});

test('build stats preserve combat formulas and accept safe item-object comparisons', () => {
  const build = {
    style: 'arcanist', faction: 'ironbound', activeMount: 'windstrider', crit: 0.1,
    maxHp: 120, skills: ['keen_edge', 'aether_surge', 'fleetstep'],
    inventory: [
      { uid: 'w', type: 'Weapon', power: 12, rank: 2 },
      { uid: 'a', type: 'Armor', armor: 15, maxHp: 25, rank: 3 },
      { uid: 'c', type: 'Charm', armor: 7, spell: 0.2, rank: 2 }
    ],
    equipment: { Weapon: 'w', Armor: 'a', Charm: 'c' }
  };
  const snapshot = JSON.stringify(build);
  const stats = equipment.stats(build);
  const expectedArmor = (15 + 3 * 2) + (7 + 2) + 8;
  const expectedSpell = (1 + 0.2 + 2 * 0.03) * 1.25 * 1.25;
  assert.equal(stats.power, (12 + 2 * 3) * 1.2);
  assert.equal(stats.armor, expectedArmor);
  assert.equal(stats.maxHp, 120 + 25 + 3 * 4);
  assert(Math.abs(stats.spell - expectedSpell) < 1e-9);
  assert.equal(stats.spellDamage, Math.round(25 * expectedSpell));
  assert(Math.abs(stats.damageReduction - (1 - 100 / (100 + expectedArmor * 6))) < 1e-12);
  assert.equal(stats.speed, 1.65 * 1.12);
  assert.equal(stats.crit, 0.1);

  const replacement = { uid: 'candidate', type: 'Weapon', power: 30, rank: 1 };
  const compared = equipment.stats(build, { ...build.equipment, Weapon: replacement });
  assert.equal(compared.power, 33 * 1.2, 'object override must use effective candidate stats');
  assert.equal(JSON.stringify(build), snapshot, 'stats() must not mutate its state input');
});

test('comparison markup visibly labels stat gains, losses, arrows, and next-rank gains', () => {
  const base = {
    style: 'vanguard', maxHp: 100, skills: [], materials: { briarFiber: 20, wardenAlloy: 20 }, gold: 999,
    inventory: [
      { uid: 'weak', name: 'Weak Blade', type: 'Weapon', rarity: 'Common', power: 8, rank: 0, value: 20 },
      { uid: 'strong', name: 'Strong Blade', type: 'Weapon', rarity: 'Rare', power: 20, rank: 0, value: 100 },
      { uid: 'plate', name: 'Plate', type: 'Armor', rarity: 'Epic', armor: 15, maxHp: 30, rank: 2, value: 300 },
      { uid: 'cloth', name: 'Cloth', type: 'Armor', rarity: 'Common', armor: 2, maxHp: 0, rank: 0, value: 10 }
    ],
    equipment: { Weapon: 'weak', Armor: 'plate', Charm: null }
  };
  const upgrade = equipment.render(base, { selectedUid: 'strong' });
  assert.match(upgrade, /Loadout impact/);
  assert.match(upgrade, /eq25-compare-row is-up[\s\S]*Damage/);
  assert.match(upgrade, /<i>→<\/i>/);
  assert.match(upgrade, /Next star gains/);
  assert.match(upgrade, /Rank 0 → 1/);
  const downgrade = equipment.render(base, { selectedUid: 'cloth' });
  assert.match(downgrade, /eq25-compare-row is-down[\s\S]*Armor/);
  assert.match(downgrade, /eq25-compare-row is-down[\s\S]*Max HP/);
  assert.match(downgrade, /data-gear-filter="Weapon"/, 'rendered filter controls must match the runtime handler contract');
});

test('upgrade costs are deterministic through rank 5 and do not mutate items', () => {
  const expected = [
    { gold: 80, material: 'briarFiber', amount: 2 },
    { gold: 160, material: 'briarFiber', amount: 4 },
    { gold: 240, material: 'briarFiber', amount: 6 },
    { gold: 320, material: 'wardenAlloy', amount: 2 },
    { gold: 400, material: 'wardenAlloy', amount: 3 }
  ];
  for (let rank = 0; rank < 5; rank++) {
    const item = { uid: 'cost', type: 'Weapon', value: 100, power: 10, rank };
    const before = JSON.stringify(item);
    const cost = equipment.upgradeCost(item);
    assert.equal(cost.gold, expected[rank].gold);
    assert.equal(cost.material, expected[rank].material);
    assert.equal(cost.amount, expected[rank].amount);
    assert.equal(cost.rank, rank);
    assert.equal(cost.nextRank, rank + 1);
    assert(Object.isFrozen(cost), 'upgrade cost should be an immutable transaction quote');
    assert.equal(JSON.stringify(item), before, 'upgradeCost() must not mutate the item');
  }
  assert.equal(equipment.upgradeCost({ type: 'Weapon', value: 100, rank: 5 }), null);
  assert.equal(equipment.upgradeCost({ type: 'Consumable', value: 100, rank: 0 }), null);
});

test('missing equipment references fall back safely', () => {
  const broken = {
    style: 'vanguard', maxHp: 100, skills: [], inventory: [],
    equipment: { Weapon: 'deleted-weapon', Armor: 'deleted-armor', Charm: 'deleted-charm' }
  };
  const stats = equipment.stats(broken);
  assert.equal(stats.power, 8);
  assert.equal(stats.armor, 0);
  assert.equal(stats.maxHp, 100);
  assert.equal(stats.spellDamage, 25);
  assert.equal(stats.damageReduction, 0);
  assert.doesNotThrow(() => equipment.render(broken));
});

test('runtime gear handlers equip, upgrade, reject invalid transactions, clamp HP, and use consumables', () => {
  const inventory = [
    { uid: 'starter', id: 'roadworn_blade', name: 'Starter', type: 'Weapon', rarity: 'Common', power: 10, value: 50, rank: 0 },
    { uid: 'upgrade', id: 'wayfarer_bow', name: 'Upgrade Blade', type: 'Weapon', rarity: 'Rare', power: 20, value: 100, rank: 0 },
    { uid: 'vital', id: 'warden_plate', name: 'Vital Plate', type: 'Armor', rarity: 'Epic', armor: 8, maxHp: 50, value: 200, rank: 0 },
    { uid: 'tonic-test', id: 'tonic', name: 'Tonic', type: 'Consumable', rarity: 'Common', heal: 55, value: 22 }
  ];
  setState({
    zone: 'northford', x: 965, y: 625, hp: 90, maxHp: 100, gold: 1_000,
    inventory, equipment: { Weapon: 'starter', Armor: 'vital', Charm: null },
    materials: { moonleaf: 0, briarFiber: 20, wardenAlloy: 20 },
    mainStep: 7, opened: ['progress-sentinel'], dynamicQuests: { sentinel: { status: 'active', progress: 2 } }
  });
  nav.start();
  let markup = openGear();
  assert.match(markup, /Equipment &amp; Pack|Equipment & Pack/);

  clickJournal('equip', 'upgrade');
  assert.equal(state().equipment.Weapon, 'upgrade', 'valid gear must equip through the real journal handler');
  clickJournal('equip', 'tonic-test');
  assert.equal(state().equipment.Weapon, 'upgrade', 'non-gear must be rejected by the equip handler');

  const quote = equipment.upgradeCost(state().inventory.find(item => item.uid === 'upgrade'));
  const beforeUpgrade = state();
  clickJournal('upgrade', 'upgrade');
  const afterUpgrade = state();
  assert.equal(afterUpgrade.inventory.find(item => item.uid === 'upgrade').rank, 1);
  assert.equal(afterUpgrade.gold, beforeUpgrade.gold - quote.gold, 'one click must spend one quoted gold cost');
  assert.equal(afterUpgrade.materials[quote.material], beforeUpgrade.materials[quote.material] - quote.amount,
    'one click must spend one quoted material cost');

  const insufficient = {
    ...afterUpgrade, gold: 0,
    materials: { ...afterUpgrade.materials, briarFiber: 0, wardenAlloy: 0 }
  };
  setState(insufficient);
  openGear();
  const beforeRejected = state();
  clickJournal('upgrade', 'upgrade');
  assert.equal(state().inventory.find(item => item.uid === 'upgrade').rank, 1, 'insufficient resources must not raise rank');
  assert.equal(state().gold, beforeRejected.gold, 'rejected upgrade must not spend gold');

  const cappedInventory = state().inventory.map(item => item.uid === 'upgrade' ? { ...item, rank: 5 } : item);
  setState({ ...state(), gold: 999, materials: { ...state().materials, wardenAlloy: 99 }, inventory: cappedInventory });
  openGear();
  const beforeCap = state();
  clickJournal('upgrade', 'upgrade');
  assert.equal(state().inventory.find(item => item.uid === 'upgrade').rank, 5, 'rank 5 must be a hard upgrade cap');
  assert.equal(state().gold, beforeCap.gold, 'cap-5 upgrade attempt must not spend gold');
  clickJournal('upgrade', 'tonic-test');
  assert.equal(state().gold, beforeCap.gold, 'non-gear upgrade attempt must not spend gold');

  setState({ ...state(), hp: 145, equipment: { ...state().equipment, Armor: 'vital' } });
  openGear();
  clickJournal('unequip', 'Armor');
  assert.equal(state().equipment.Armor, null);
  assert.equal(state().hp, 100, 'removing max-HP armor must clamp current HP to the new maximum');
  clickJournal('equip', 'vital');
  assert.equal(state().hp, 100, 're-equipping max-HP armor must not heal the player');
  clickJournal('use', 'tonic-test');
  assert.equal(state().hp, 150, 'consumable must heal up to effective armor-boosted max HP');
  assert(!state().inventory.some(item => item.uid === 'tonic-test'), 'used consumable must leave inventory');

  assert.equal(state().mainStep, 7, 'gear transactions must preserve story progress');
  assert(state().opened.includes('progress-sentinel'), 'gear transactions must preserve opened-world progress');
  assert.equal(state().dynamicQuests.sentinel.progress, 2, 'gear transactions must preserve quest progress');
  clickJournal('unequip', 'Weapon');
  const savedWithoutWeapon = state();
  setState(savedWithoutWeapon);
  assert.equal(state().equipment.Weapon, null, 'an intentionally empty weapon slot must survive save migration');
  assert.equal(state().inventory.find(item => item.uid === 'upgrade').rank, 5, 'upgrade stars must survive save migration');
  setState({...state(),hp:150,inventory:[...state().inventory,{uid:'full-health-tonic',type:'Consumable',heal:55,name:'Full Health Tonic'}]});
  openGear();clickJournal('use','full-health-tonic');
  assert(state().inventory.some(item=>item.uid==='full-health-tonic'),'full-health use must not consume the item even if a stale button fires');
});

test('upgraded weapon, spell multiplier, and armor reduction drive actual combat', () => {
  const weapon = { uid: 'combat-weapon', id: 'wayfarer_bow', name: 'Combat Bow', type: 'Weapon', rarity: 'Rare', power: 20, value: 100, rank: 2 };
  const armor = { uid: 'combat-armor', id: 'warden_plate', name: 'Combat Plate', type: 'Armor', rarity: 'Epic', armor: 10, maxHp: 20, value: 200, rank: 2 };
  const charm = { uid: 'combat-charm', id: 'lantern_charm', name: 'Combat Charm', type: 'Charm', rarity: 'Rare', armor: 2, spell: 0.2, value: 180, rank: 2 };
  setState({
    zone: 'greenwake', x: 1080, y: 650, hp: 200, maxHp: 200, mana: 100, maxMana: 100,
    style: 'arcanist', skills: ['aether_surge'], inventory: [weapon, armor, charm],
    equipment: { Weapon: weapon.uid, Armor: armor.uid, Charm: charm.uid }, settings: { assistMode: false }
  });
  nav.clearEnemies();
  const expected = equipment.stats(state());

  debug.spawnEnemy('briar', state().x + 125, state().y);
  const arrowTarget = nav.get().enemies.find(enemy => enemy.kind === 'briar');
  dispatchWindow('keydown', { code: 'Space', repeat: false, preventDefault() {} });
  for (let i = 0; i < 7; i++) nav.tick(0.05);
  dispatchWindow('keyup', { code: 'Space' });
  const afterArrow = nav.get().enemies.find(enemy => enemy.id === arrowTarget.id);
  assert(Math.abs((arrowTarget.hp - afterArrow.hp) - expected.power) < 1e-9,
    'actual weapon damage must equal effective upgraded power');

  setState({ ...state(), zone: 'greenwake', x: 1080, y: 650, mana: 100 });
  nav.clearEnemies();
  debug.spawnEnemy('briar', state().x + 150, state().y);
  const spellTarget = nav.get().enemies.find(enemy => enemy.kind === 'briar');
  dispatchWindow('keydown', { code: 'KeyQ', repeat: false, preventDefault() {} });
  for (let i = 0; i < 9; i++) nav.tick(0.05);
  dispatchWindow('keyup', { code: 'KeyQ' });
  const afterSpell = nav.get().enemies.find(enemy => enemy.id === spellTarget.id);
  assert.equal(spellTarget.hp - afterSpell.hp, equipment.stats(state()).spellDamage,
    'actual spell projectile damage must equal equipment stats spellDamage');

  setState({ ...state(), zone: 'greenwake', x: 1080, y: 650, hp: 200 });
  nav.clearEnemies();
  nav.tick(3.6);
  debug.spawnEnemy('briar', state().x + 30, state().y);
  debug.forceWindup();
  const beforeHit = state().hp;
  nav.tick(0.9);
  nav.tick(0.05);
  const actualDamage = beforeHit - state().hp;
  const build = equipment.stats(state());
  const expectedDamage = Math.max(1, Math.round(13 * (1 - build.damageReduction)));
  assert.equal(actualDamage, expectedDamage,
    'actual incoming damage must use the same armor reduction reported by equipment stats');
  assert.equal(build.maxHp, 200 + equipment.effective(armor).maxHp,
    'runtime max HP must match the equipment module effective armor calculation');
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

if (failures) throw new Error(`${failures} equipment v25 runtime test${failures === 1 ? '' : 's'} failed`);
console.log(`\u2713 ${tests.length} equipment v25 deterministic/runtime tests passed`);
