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
    createOscillator() { return { frequency, connect(node) { return node; }, start() {}, stop() {}, type: 'sine' }; }
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
    'js/economy-v26.js',
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
const economy = context.EVERLIGHT_ECONOMY;
const atlas = context.EVERLIGHT_ATLAS;
const exploration = context.EVERLIGHT_EXPLORATION;
const catalog = economy.catalog(atlas, exploration);
assert.equal(economy.version, 26);

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function clone(value) { return structuredClone(value); }
function state() { return nav.get().state; }
function setState(patch) { nav.setState({ style: 'vanguard', build: '26', ...patch }); return state(); }
function byId(id) {
  const object = nav.objects().find(candidate => candidate.id === id);
  assert(object, `missing runtime object ${id} in ${state().zone}`);
  return object;
}
function placeAt(object) { debug.setPlayer(object.x, object.y); }

function clickJournal(attribute, value, extraDataset = {}) {
  const camel = attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const selector = `[data-${attribute}]`;
  const target = {
    dataset: { [camel]: value, ...extraDataset },
    closest(candidate) {
      if (candidate === selector) return this;
      if (candidate === '[data-estate-buy],[data-estate-develop],[data-estate-upgrade]' &&
          ['estate-buy', 'estate-develop', 'estate-upgrade'].includes(attribute)) return this;
      return null;
    }
  };
  context.document.getElementById('journalBody').dispatchEvent({ type: 'click', target });
}

function owned(def, overrides = {}) {
  return {
    ...clone(def), upgrades: { quality: 0, capacity: 0, security: 0 },
    invested: def.purchasePrice, lastProfit: 0, total: 0, daysOperated: 0, ...overrides
  };
}

test('catalog covers every ordinary building, atlas deed, and settlement land parcel exactly once', () => {
  const ids = new Set(catalog.map(def => def.id));
  assert(Object.isFrozen(catalog), 'catalog array must be immutable');
  assert.equal(ids.size, catalog.length, 'estate IDs must be unique');
  assert.equal(catalog.length, 295, 'complete current world catalog should contain 295 deeds');
  assert.equal(catalog.filter(def => def.source === 'northford-building').length, 6);
  assert.equal(catalog.filter(def => def.source === 'settlement-home').length, 168);
  assert.equal(catalog.filter(def => def.source === 'atlas-deed').length, 96);
  assert.equal(catalog.filter(def => def.source === 'land').length, 25);

  for (const target of ['inn', 'apothecary', 'smithy', 'bellkeeper', 'stable']) {
    assert(ids.has(`estate:${target}`), `ordinary Northford interior ${target} needs a deed`);
  }
  assert(!ids.has('estate:guildhall'), 'civic Guildhall must not be sold');
  assert(!ids.has('estate:cistern'), 'protected Cistern must not be sold');

  for (const area of atlas.areas.filter(candidate => candidate.kind === 'settlement')) {
    const homes = exploration.homes(area);
    assert.equal(homes.length, 7);
    for (const home of homes) assert(ids.has(home.id), `${home.id} must have a deed`);
    assert(ids.has(`land:${area.id}`), `${area.id} must have a development parcel`);
  }
  assert(ids.has('land:northford'));
  assert(catalog.every(Object.isFrozen), 'catalog definitions must be immutable');
});

test('buy validates discovery, affordability, and duplicate ownership without partial mutation', () => {
  const remote = catalog.find(def => def.regionId !== 'northford');
  assert(remote, 'test needs a remote deed');
  const locked = { gold: 99_999, zone: 'northford', atlasDiscovered: [], properties: {} };
  const lockedBefore = JSON.stringify(locked);
  assert.equal(economy.buy(locked, remote.id, catalog).ok, false);
  assert.equal(JSON.stringify(locked), lockedBefore, 'locked purchase must not mutate state');

  const poor = { gold: remote.purchasePrice - 1, zone: remote.zone, atlasDiscovered: [remote.settlementId], properties: {} };
  const poorBefore = JSON.stringify(poor);
  assert.equal(economy.buy(poor, remote.id, catalog).ok, false);
  assert.equal(JSON.stringify(poor), poorBefore, 'unaffordable purchase must not mutate state');

  const buyer = { gold: remote.purchasePrice + 500, zone: remote.zone, atlasDiscovered: [remote.settlementId], properties: {} };
  const first = economy.buy(buyer, remote.id, catalog);
  assert.equal(first.ok, true);
  assert.equal(buyer.gold, 500);
  assert.equal(buyer.properties[remote.id].id, remote.id);
  const afterFirst = JSON.stringify(buyer);
  assert.equal(economy.buy(buyer, remote.id, catalog).ok, false);
  assert.equal(JSON.stringify(buyer), afterFirst, 'duplicate purchase must not charge or replace ownership');
  assert.equal(economy.buy(buyer, 'missing-deed', catalog).ok, false);
});

test('land requires one valid development choice and never earns while undeveloped', () => {
  const land = catalog.find(def => def.id === 'land:northford');
  for (const businessType of economy.landChoices) {
    const testState = { gold: 20_000, zone: 'northford', atlasDiscovered: [], properties: {}, day: 2, lastEconomyDay: 1, treasury: 0, profitHistory: [], activeEvents: {} };
    assert.equal(economy.buy(testState, land.id, catalog).ok, true);
    const undeveloped = economy.settleDay(testState, catalog);
    assert.equal(undeveloped.results[0].profit, 0);
    assert.equal(testState.properties[land.id].daysOperated, 0);
    testState.day = 3;
    const developed = economy.develop(testState, land.id, businessType, catalog);
    assert.equal(developed.ok, true, `${businessType} must be a valid land choice`);
    assert.equal(developed.property.type, 'land');
    assert.equal(developed.property.businessType, businessType);
    assert(developed.property.revenueMax > 0);
    const after = JSON.stringify(testState);
    assert.equal(economy.develop(testState, land.id, businessType, catalog).ok, false);
    assert.equal(JSON.stringify(testState), after, 'parcel cannot be developed or charged twice');
  }

  const invalid = { gold: 20_000, zone: 'northford', properties: {}, atlasDiscovered: [] };
  economy.buy(invalid, land.id, catalog);
  const before = JSON.stringify(invalid);
  assert.equal(economy.develop(invalid, land.id, 'castle', catalog).ok, false);
  assert.equal(JSON.stringify(invalid), before);
});

test('upgrades enforce affordability, valid tracks, and independent rank-3 caps', () => {
  const def = catalog.find(candidate => candidate.id === 'estate:smithy');
  const s = { gold: 100_000, zone: 'northford', atlasDiscovered: [], properties: {} };
  economy.buy(s, def.id, catalog);
  for (const track of economy.tracks) {
    for (let nextRank = 1; nextRank <= 3; nextRank++) {
      const cost = economy.upgradeCost(s.properties[def.id], track);
      assert(Number.isInteger(cost) && cost > 0);
      const beforeGold = s.gold;
      const result = economy.upgrade(s, def.id, track, catalog);
      assert.equal(result.ok, true);
      assert.equal(s.gold, beforeGold - cost);
      assert.equal(s.properties[def.id].upgrades[track], nextRank);
    }
    const atCap = JSON.stringify(s);
    assert.equal(economy.upgradeCost(s.properties[def.id], track), null);
    assert.equal(economy.upgrade(s, def.id, track, catalog).ok, false);
    assert.equal(JSON.stringify(s), atCap, `${track} cap attempt must not mutate state`);
  }
  assert.equal(s.properties[def.id].level, 9, 'aggregate upgrade level must be bounded to nine');

  const noMoney = clone(s);
  noMoney.properties[def.id].upgrades.quality = 0;
  noMoney.gold = 0;
  const before = JSON.stringify(noMoney);
  assert.equal(economy.upgrade(noMoney, def.id, 'quality', catalog).ok, false);
  assert.equal(economy.upgrade(noMoney, def.id, 'unknown', catalog).ok, false);
  assert.equal(JSON.stringify(noMoney), before);
});

test('daily settlement is deterministic, variable, idempotent, and permits real losses', () => {
  const def = catalog.find(candidate => candidate.id === 'estate:bellkeeper');
  const baseProperty = owned(def);
  const a = { day: 7, lastEconomyDay: 6, properties: { [def.id]: clone(baseProperty) }, treasury: 0, profitHistory: [], activeEvents: {} };
  const b = clone(a);
  const first = economy.settleDay(a, catalog);
  const repeat = economy.settleDay(b, catalog);
  assert.deepEqual(clone(first.results), clone(repeat.results), 'same day and holdings must settle identically');
  assert.equal(first.profit, repeat.profit);
  const once = JSON.stringify(a);
  assert.equal(economy.settleDay(a, catalog).ok, false, 'same day must not settle twice');
  assert.equal(JSON.stringify(a), once, 'idempotence guard must prevent a second deposit/history row');

  const variable = { day: 1, lastEconomyDay: 0, properties: { [def.id]: clone(baseProperty) }, treasury: 0, profitHistory: [], activeEvents: {} };
  const profits = [];
  for (let day = 1; day <= 8; day++) {
    variable.day = day;
    profits.push(economy.settleDay(variable, catalog).profit);
  }
  assert(new Set(profits).size > 1, 'daily revenue must vary deterministically by day');
  assert.equal(variable.profitHistory.length, 8);

  const loss = { day: 23, lastEconomyDay: 22, properties: { [def.id]: clone(baseProperty) }, treasury: 0, profitHistory: [], activeEvents: {} };
  const lossResult = economy.settleDay(loss, catalog);
  assert(lossResult.profit < 0, 'deterministic adverse incidents must be able to produce a daily loss');
  assert(loss.treasury < 0, 'expenses must be recorded rather than silently clamped away');
  assert.match(lossResult.results[0].event, /Quiet market|Storm damage|Spoiled stock|Equipment repairs/);
});

test('synergy bonuses are bounded and service perks use the best quality rank', () => {
  const marketDef = catalog.find(def => def.id === 'estate:market');
  const market = owned(marketDef);
  const settleMarket = extras => {
    const properties = { [marketDef.id]: clone(market) };
    extras.forEach((type, index) => {
      properties[`custom:${type}:${index}`] = owned({
        id:`custom:${type}:${index}`, name:type, type, purchasePrice:300, value:300,
        operatingCost:10, revenueMin:20, revenueMax:40, regionId:'northford', regionalEconomy:'commerce'
      });
    });
    const s = { day: 11, lastEconomyDay: 10, properties, treasury: 0, profitHistory: [], activeEvents: {} };
    return economy.settleDay(s, catalog).results.find(row => row.id === marketDef.id).revenue;
  };
  const none = settleMarket([]);
  const one = settleMarket(['warehouse']);
  const all = settleMarket(['warehouse', 'farm', 'orchard']);
  const duplicates = settleMarket(['warehouse', 'farm', 'orchard', 'warehouse', 'warehouse']);
  assert(one > none, 'one complementary business must create a synergy bonus');
  assert(all > one, 'distinct complementary businesses should stack');
  assert.equal(duplicates, all, 'duplicate synergy types must not exceed the 9% cap');

  assert.equal(economy.perk({ properties: {} }, 'smithy'), 1);
  const perks = { properties: {
    weak: owned({ id:'weak', type:'smithy', purchasePrice:100, value:100 }, { upgrades:{quality:1,capacity:0,security:0} }),
    best: owned({ id:'best', type:'smithy', purchasePrice:100, value:100 }, { upgrades:{quality:3,capacity:0,security:0} })
  }};
  assert(Math.abs(economy.perk(perks, 'smithy') - 0.84) < 1e-12);
  assert.equal(economy.perk(perks, 'apothecary'), 1);
  assert.equal(economy.perk(perks, 'market'), 1);
});

test('legacy property migration preserves ownership while normalizing aliases and history', () => {
  const history = Array.from({ length: 20 }, (_, index) => ({ day: index + 1, profit: index - 5 }));
  const legacy = {
    day: 21, gold: 777, treasury: '42', profitHistory: history,
    properties: {
      smithy: { name:'Legacy Smithy', type:'smithy', purchasePrice:350, value:475, level:2, total:91, lastProfit:-3 },
      customLegacy: { name:'Old Farm', type:'farm', purchasePrice:320, value:333, level:1 }
    }
  };
  const result = economy.migrate(legacy, catalog);
  assert.equal(result.ok, true);
  assert(!legacy.properties.smithy);
  assert.equal(legacy.properties['estate:smithy'].name, 'Legacy Smithy');
  assert.equal(legacy.properties['estate:smithy'].value, 475);
  assert.equal(legacy.properties['estate:smithy'].upgrades.quality, 2);
  assert.equal(legacy.properties.customLegacy.upgrades.quality, 1);
  assert.equal(legacy.treasury, 42);
  assert.equal(legacy.profitHistory.length, 14);
  assert.equal(legacy.profitHistory[0].day, 7);
  assert.equal(legacy.lastEconomyDay, 21);
});

test('runtime estate handlers preserve saves and developed business doors work in both directions', () => {
  setState({
    zone:'smithy', x:768, y:700, gold:20_000, day:4, economyClock:0,
    properties:{}, treasury:0, profitHistory:[], atlasDiscovered:[atlas.firstArea],
    mainStep:7, opened:['economy-progress'], dynamicQuests:{sentinel:{status:'active',progress:2}}
  });
  nav.start();
  const smithyDeed = byId('building-deed');
  assert.equal(smithyDeed.estateId, 'estate:smithy');
  assert.equal(nav.collides(smithyDeed.x, smithyDeed.y, 13), false, 'smithy deed must be reachable');
  placeAt(smithyDeed);
  nav.interact();
  let markup = context.document.getElementById('journalBody').innerHTML;
  assert.match(markup, /data-estate-buy="estate:smithy"/);
  const smithyDef = catalog.find(def => def.id === 'estate:smithy');
  const beforeBuy = state();
  clickJournal('estate-buy', 'estate:smithy');
  assert(state().properties['estate:smithy']);
  assert.equal(state().gold, beforeBuy.gold - smithyDef.purchasePrice);
  const afterBuy = state();
  clickJournal('estate-buy', 'estate:smithy');
  assert.equal(state().gold, afterBuy.gold, 'runtime duplicate buy must not charge twice');

  const beforeUpgrade = state();
  const upgradeCost = economy.upgradeCost(beforeUpgrade.properties['estate:smithy'], 'quality');
  clickJournal('estate-upgrade', 'estate:smithy', { track:'quality' });
  assert.equal(state().properties['estate:smithy'].upgrades.quality, 1);
  assert.equal(state().gold, beforeUpgrade.gold - upgradeCost);

  setState({ ...state(), zone:'northford', x:1500, y:230 });
  const landDeed = byId('land-deed');
  placeAt(landDeed);
  nav.interact();
  clickJournal('estate-buy', 'land:northford');
  assert(state().properties['land:northford']);
  clickJournal('estate-develop', 'land:northford', { business:'apothecary' });
  assert.equal(state().properties['land:northford'].businessType, 'apothecary');

  dispatchWindow('keydown', { code:'Escape', repeat:false, preventDefault() {} });
  setState({ ...state(), zone:'northford', x:1500, y:230 });
  const door = byId('development-door');
  assert.equal(door.target, 'business@land:northford');
  assert.equal(nav.collides(1500, 100, 13), true, 'developed building footprint must be solid');
  assert.equal(nav.collides(door.x, door.y + 30, 13), false, 'developed business threshold must be reachable');
  debug.setPlayer(door.x, door.y + 30);
  nav.tick(1.3);
  nav.interact();
  assert.equal(state().zone, 'business@land:northford');
  assert(byId('business-manager'));
  assert.equal(byId('business-deed').estateId, 'land:northford');
  assert.equal(nav.collides(350, 300, 13), true, 'developed business interior must retain solid furnishings');
  nav.interact();
  assert.equal(state().zone, 'business@land:northford', 'exit cooldown must prevent immediate bounce-back');
  nav.tick(1.3);
  placeAt(byId('exit'));
  nav.interact();
  assert.equal(state().zone, 'northford');

  assert.equal(state().mainStep, 7);
  assert(state().opened.includes('economy-progress'));
  assert.equal(state().dynamicQuests.sentinel.progress, 2);
});

test('every enterable ordinary building exposes a reachable deed and runtime day settlement is safe', () => {
  const progress = state();
  for (const zone of ['inn','apothecary','smithy','bellkeeper','stable']) {
    setState({ ...progress, zone });
    const deed = byId('building-deed');
    assert.equal(deed.estateId, `estate:${zone}`);
    assert.equal(nav.collides(deed.x, deed.y, 13), false, `${zone} deed must be reachable`);
  }
  for (const def of catalog.filter(candidate => candidate.source === 'settlement-home')) {
    setState({ ...progress, zone:def.zone });
    const deed = byId('building-deed');
    assert.equal(deed.estateId, def.id);
    assert.equal(nav.collides(deed.x, deed.y, 13), false, `${def.id} deed must be reachable`);
  }

  setState({ ...progress, zone:'northford', day:10, economyClock:299.9, treasury:0, profitHistory:[] });
  const beforeAutomatic = state();
  nav.tick(0.2);
  assert.equal(state().day, beforeAutomatic.day + 1, '300 seconds of active play must advance one day');
  assert.equal(state().lastEconomyDay, state().day, 'automatic day must settle exactly once');

  const dayAfterAutomatic = state().day;
  const marketDeed = byId('market-deed');
  placeAt(marketDeed);
  nav.interact();
  nav.tick(300);
  assert.equal(state().day, dayAfterAutomatic, 'paused economy journal must not advance active-play time');

  const beforeManual = state();
  clickJournal('economy', 'day');
  assert.equal(state().day, beforeManual.day + 1);
  assert.equal(state().lastEconomyDay, state().day);
  const beforeCollect = state();
  clickJournal('economy', 'collect');
  const transferable = Math.max(0, beforeCollect.treasury);
  assert.equal(state().gold, beforeCollect.gold + transferable);
  assert.equal(state().treasury, beforeCollect.treasury - transferable);
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

if (failures) throw new Error(`${failures} economy v26 deterministic/runtime test${failures === 1 ? '' : 's'} failed`);
console.log(`\u2713 ${tests.length} economy v26 deterministic/runtime tests passed`);
