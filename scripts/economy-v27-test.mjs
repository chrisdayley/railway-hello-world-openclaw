import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const context = { console, Math, Date, Map, Set, Object, Array, JSON };
context.window = context;
vm.createContext(context);
for (const file of ['js/world-atlas-v22.js', 'js/exploration-v24.js', 'js/economy-v26.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename:file });
}

const economy = context.EVERLIGHT_ECONOMY;
const atlas = context.EVERLIGHT_ATLAS;
const exploration = context.EVERLIGHT_EXPLORATION;
const catalog = economy.catalog(atlas, exploration);
const byId = id => {
  const result = catalog.find(def => def.id === id);
  assert(result, `missing estate definition ${id}`);
  return result;
};
const clone = value => structuredClone(value);
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('v27 pricing exposes four explicit value tiers and a meaningful Northford ladder', () => {
  assert.equal(economy.version, 26, 'public API version stays compatible with the v26 runtime loader');
  assert.equal(economy.pricingVersion, 27);
  assert.deepEqual(Array.from(economy.assetTiers, tier => tier.label), ['Humble', 'Established', 'Premium', 'Prestige']);

  const expected = {
    'estate:bellkeeper': { price:850, tier:'Humble' },
    'land:northford': { price:1100, tier:'Humble' },
    'estate:market': { price:2200, tier:'Established' },
    'estate:apothecary': { price:2400, tier:'Established' },
    'estate:inn': { price:2600, tier:'Established' },
    'estate:stable': { price:3000, tier:'Premium' },
    'estate:smithy': { price:3600, tier:'Premium' }
  };
  for (const [id, quote] of Object.entries(expected)) {
    const def = byId(id);
    assert.equal(def.purchasePrice, quote.price, `${id} deed price`);
    assert.equal(def.priceTierLabel, quote.tier, `${id} tier`);
  }
  assert(byId('estate:bellkeeper').purchasePrice < byId('estate:inn').purchasePrice);
  assert(byId('estate:inn').purchasePrice < byId('estate:smithy').purchasePrice);
});

test('regional deed prices rise faster than modest revenue and expose premium late-world goals', () => {
  const purchasable = catalog.filter(def => def.type !== 'land' && def.revenueMax > 0);
  assert(purchasable.every(def => def.priceTierLabel && Number.isInteger(def.priceTierRank)));
  const early = purchasable.filter(def => def.regionId === 'greenwake');
  const late = purchasable.filter(def => def.regionId === 'starfall');
  assert(early.length && late.length);
  assert(Math.min(...late.map(def => def.purchasePrice)) > Math.min(...early.map(def => def.purchasePrice)) * 1.8,
    'late-world floor should be a serious portfolio goal');

  const typePairs = [];
  for (const first of early) {
    const later = [...late].filter(def => def.type === first.type).sort((a, b) => b.purchasePrice - a.purchasePrice)[0];
    if (later) typePairs.push([first, later]);
  }
  assert(typePairs.length, 'need a same-type early/late comparison');
  for (const [first, later] of typePairs) {
    const priceGrowth = later.purchasePrice / first.purchasePrice;
    const revenueGrowth = later.revenueMax / first.revenueMax;
    assert(priceGrowth > revenueGrowth, `${later.type} price growth must outpace revenue growth`);
  }
  assert(catalog.some(def => def.priceTierLabel === 'Prestige' && def.purchasePrice >= 10_000),
    'the wider Vale needs five-figure prestige deeds');
});

test('land development has explicit build quotes and preserves the save-up hierarchy', () => {
  const land = byId('land:northford');
  const expectedBuild = {
    orchard:1250, apothecary:2100, inn:2250, stable:2700,
    workshop:2850, smithy:3200, warehouse:3500
  };
  const totals = {};
  for (const [type, expected] of Object.entries(expectedBuild)) {
    const state = { gold:20_000, zone:'northford', properties:{}, atlasDiscovered:[] };
    assert.equal(economy.buy(state, land.id, catalog).ok, true);
    const result = economy.develop(state, land.id, type, catalog);
    assert.equal(result.ok, true, type);
    assert.equal(result.cost, expected, `${type} build quote`);
    assert.equal(result.property.invested, land.purchasePrice + expected);
    assert.equal(result.property.priceTierLabel, type === 'orchard' || type === 'apothecary' || type === 'inn' ? 'Established' : 'Premium');
    totals[type] = result.property.invested;
  }
  assert(totals.orchard < totals.inn && totals.inn < totals.smithy && totals.smithy < totals.warehouse);

  const short = { gold:land.purchasePrice + expectedBuild.inn - 1, zone:'northford', properties:{}, atlasDiscovered:[] };
  economy.buy(short, land.id, catalog);
  const before = JSON.stringify(short);
  const denied = economy.develop(short, land.id, 'inn', catalog);
  assert.equal(denied.ok, false);
  assert.match(denied.message, /Need 1 more gold/);
  assert.equal(JSON.stringify(short), before, 'failed construction must not spend or mutate');
});

test('profits remain useful but modest relative to invested capital', () => {
  const northford = catalog.filter(def => def.settlementId === 'northford' && def.type !== 'land');
  for (const def of northford) {
    const averageNet = (def.revenueMin + def.revenueMax) / 2 - def.operatingCost;
    const midpointPayback = def.purchasePrice / averageNet;
    assert(midpointPayback >= 40, `${def.name} repays too quickly at ${midpointPayback.toFixed(1)} days`);
    assert(midpointPayback <= 100, `${def.name} feels unrewarding at ${midpointPayback.toFixed(1)} days`);
  }

  const inn = byId('estate:inn');
  const state = {
    day:1, lastEconomyDay:0, treasury:0, profitHistory:[], activeEvents:{},
    properties:{ [inn.id]:{ ...clone(inn), invested:inn.purchasePrice, upgrades:{quality:0,capacity:0,security:0} } }
  };
  let earned = 0;
  for (let day = 1; day <= 20; day++) {
    state.day = day;
    earned += economy.settleDay(state, catalog).profit;
  }
  assert(earned > 0 && earned < inn.purchasePrice * .6,
    `20 deterministic business days should help without refunding the deed (earned ${earned})`);
});

test('new upgrade quotes use total developed investment while legacy saves keep their economics', () => {
  const land = byId('land:northford');
  const fresh = { gold:20_000, zone:'northford', properties:{}, atlasDiscovered:[] };
  economy.buy(fresh, land.id, catalog);
  economy.develop(fresh, land.id, 'inn', catalog);
  const property = fresh.properties[land.id];
  assert.equal(economy.upgradeCost(property, 'quality'), Math.round(property.invested * .18));

  const history = [{ day:3, profit:17 }, { day:4, profit:-2 }];
  const legacy = {
    day:5, treasury:31, profitHistory:clone(history),
    properties:{ inn:{ name:'Old Mooncup', type:'inn', purchasePrice:430, value:612, invested:507, total:119, daysOperated:8, lastProfit:22 } }
  };
  economy.migrate(legacy, catalog);
  const saved = legacy.properties['estate:inn'];
  assert.equal(saved.purchasePrice, 430);
  assert.equal(saved.value, 612);
  assert.equal(saved.invested, 507);
  assert.equal(saved.total, 119);
  assert.equal(saved.daysOperated, 8);
  assert.equal(saved.lastProfit, 22);
  assert.deepEqual(clone(legacy.profitHistory), history);
});

test('business-day UI is gated by five minutes of active adventure time', () => {
  assert.equal(economy.activeDaySeconds, 300);
  assert.deepEqual({ ...economy.settlementProgress({ economyClock:0 }) }, { seconds:0, required:300, remaining:300, ready:false, label:'0:00' });
  assert.deepEqual({ ...economy.settlementProgress({ economyClock:299.9 }) }, { seconds:299.9, required:300, remaining:.10000000000002274, ready:false, label:'4:59' });
  assert.equal(economy.settlementProgress({ economyClock:300 }).ready, true);

  const base = { gold:140, treasury:0, properties:{}, profitHistory:[], economyClock:0 };
  const locked = economy.render(base, catalog, { view:'portfolio' });
  assert.match(locked, /data-economy="day" disabled>Business day 0:00 \/ 5:00/);
  assert.doesNotMatch(locked, /Advance day/);
  assert.match(locked, /Inns heal and save, but do not advance business time/);

  const ready = economy.render({ ...base, economyClock:300 }, catalog, { view:'portfolio' });
  assert.match(ready, /data-economy="day" >Settle business day/);
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
if (failures) throw new Error(`${failures} economy v27 balance test${failures === 1 ? '' : 's'} failed`);
console.log(`\u2713 ${tests.length} economy v27 balance tests passed`);
