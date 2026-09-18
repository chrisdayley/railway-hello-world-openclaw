import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const context = { console, devicePixelRatio:1 };
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/equipment-v25.js'), 'utf8'), context, { filename:'js/equipment-v25.js' });
const E = context.EVERLIGHT_EQUIPMENT;

const tests = [];
const test = (name, run) => tests.push({ name, run });
const inventory = () => [
  { uid:'w', name:'Road Blade', type:'Weapon', rarity:'Common', power:10, value:50, rank:1 },
  { uid:'a', name:'Vale Coat', type:'Armor', rarity:'Uncommon', armor:4, maxHp:10, value:80, rank:1 },
  { uid:'s', name:'Briar Guard', type:'Shield', rarity:'Rare', armor:3, maxHp:2, value:90, rank:1 },
  { uid:'h', name:'Moon Helm', type:'Helm', rarity:'Rare', armor:2, maxHp:2, value:100, rank:1 },
  { uid:'b', name:'Road Belt', type:'Belt', rarity:'Uncommon', armor:1, maxHp:2, crit:.01, value:70, rank:1 },
  { uid:'c1', name:'Lantern Charm', type:'Charm', rarity:'Rare', armor:1, spell:.1, value:120, rank:1 },
  { uid:'c2', name:'Echo Charm', type:'Charm', rarity:'Epic', armor:0, spell:.2, value:180, rank:2 },
  { uid:'p', name:'Tonic', type:'Consumable', rarity:'Common', heal:50, value:20 }
];

test('public contract exposes seven canonical slots and all filters', () => {
  assert.equal(E.version, 27);
  assert.deepEqual([...E.slots], ['Armor','Shield','Helm','Weapon','Belt','Charm1','Charm2']);
  for (const type of ['Weapon','Armor','Shield','Helm','Belt','Charm','Consumable','Quest']) assert(E.filters.includes(type));
  for (const name of ['canonical','migrate','equippedSlots','aggregate','stats','slotForItem','equip','unequip']) assert.equal(typeof E[name], 'function');
});

test('effective applies bounded type-specific star gains without mutation', () => {
  const cases = [
    [{type:'Weapon',power:10,rank:2}, {power:16}],
    [{type:'Armor',armor:4,maxHp:10,rank:3}, {armor:10,maxHp:22}],
    [{type:'Shield',armor:3,maxHp:4,rank:2}, {armor:7,maxHp:8}],
    [{type:'Helm',armor:2,maxHp:5,rank:3}, {armor:5,maxHp:14}],
    [{type:'Belt',armor:1,maxHp:2,crit:.02,rank:4}, {armor:5,maxHp:10,crit:.04}],
    [{type:'Charm',armor:2,spell:.2,rank:9}, {rank:5,armor:7,spell:.35}]
  ];
  for (const [item, expected] of cases) {
    const snapshot = JSON.stringify(item), result = E.effective(item);
    for (const [key,value] of Object.entries(expected)) assert(Math.abs(result[key] - value) < 1e-10, `${item.type}.${key}`);
    assert.equal(JSON.stringify(item), snapshot);
  }
  assert.equal(E.effective(null), null);
});

test('legacy Charm migrates to Charm1 and invalid or duplicate references are cleared', () => {
  const items = inventory();
  const legacy = { inventory:items, equipment:{Weapon:'w',Armor:'a',Charm:'c1',Charm2:'c1',Shield:'w'} };
  const pure = E.canonical(legacy);
  assert.equal(pure.Charm1, 'c1');
  assert.equal(pure.Charm2, null);
  assert.equal(pure.Shield, null, 'wrong item type cannot occupy a shield slot');
  assert('Charm' in legacy.equipment, 'canonical must be pure');
  const result = E.migrate(legacy);
  assert(result.ok);
  assert.equal(legacy.equipment.Charm1, 'c1');
  assert(!('Charm' in legacy.equipment));
  assert.deepEqual(Object.keys(legacy.equipment), [...E.slots]);
});

test('aggregate includes every defensive slot and both distinct charms exactly once', () => {
  const state = { inventory:inventory(), equipment:{Weapon:'w',Armor:'a',Shield:'s',Helm:'h',Belt:'b',Charm1:'c1',Charm2:'c2'} };
  const total = E.aggregate(state);
  assert.equal(total.power, 13);
  assert.equal(total.armor, 20);
  assert.equal(total.maxHp, 27);
  assert(Math.abs(total.spell - .39) < 1e-10);
  assert(Math.abs(total.crit - .015) < 1e-10);
  const duplicate = E.aggregate(state, {...state.equipment,Charm2:'c1'});
  assert.equal(duplicate.items.Charm2, null);
  assert.equal(duplicate.armor, 18);
  assert(Math.abs(duplicate.spell - .13) < 1e-10);
});

test('stats add level offense, aggregate HP, and capped coefficient-3 mitigation', () => {
  const state = {
    level:5, maxHp:100, crit:.02, faction:'ironbound', style:'vanguard', skills:['keen_edge'],
    inventory:inventory(), equipment:{Weapon:'w',Armor:'a',Shield:'s',Helm:'h',Belt:'b',Charm1:'c1',Charm2:'c2'}
  };
  const stats = E.stats(state);
  assert(Math.abs(stats.levelBonus - 1.18) < 1e-10);
  assert(Math.abs(stats.power - 13 * 1.2 * 1.18) < 1e-10);
  assert.equal(stats.armor, 28);
  assert.equal(stats.maxHp, 127);
  assert(Math.abs(stats.crit - .035) < 1e-10);
  assert(Math.abs(stats.damageReduction - (1 - 100 / (100 + 28 * 3))) < 1e-12);
  assert.equal(stats.spellDamage, Math.round(25 * 1.39 * 1.18));
  const capped = E.stats({...state,level:999,inventory:[{uid:'huge',type:'Armor',armor:1000}],equipment:{Armor:'huge'}});
  assert.equal(capped.levelBonus, 1.9);
  assert.equal(capped.damageReduction, .7);
});

test('equip and unequip are atomic, charm-aware, and never double-equip one UID', () => {
  const state = { inventory:inventory(), equipment:{Weapon:'w',Armor:'a',Charm:'c1'} };
  assert(E.equip(state,'c2').ok);
  assert.equal(state.equipment.Charm1, 'c1');
  assert.equal(state.equipment.Charm2, 'c2');
  assert(E.equip(state,'c1','Charm2').ok);
  assert.equal(state.equipment.Charm1, null);
  assert.equal(state.equipment.Charm2, 'c1');
  assert.equal(Object.values(state.equipment).filter(value => value === 'c1').length, 1);
  assert(E.equip(state,'s').ok);
  assert.equal(state.equipment.Shield, 's');
  const snapshot = JSON.stringify(state);
  assert.equal(E.equip(state,'p').ok, false);
  assert.equal(E.equip(state,'missing').ok, false);
  assert.equal(JSON.stringify(state), snapshot);
  assert(E.unequip(state,'Shield').ok);
  assert.equal(state.equipment.Shield, null);
  assert.equal(E.unequip(state,'Unknown').ok, false);
});

test('render exposes seven readable slots, filters, exact charm targets, and real comparisons', () => {
  const state = {
    level:4, maxHp:100, hp:70, maxMana:60, mana:40, gold:999,
    materials:{briarFiber:30,wardenAlloy:20}, inventory:inventory(),
    equipment:{Weapon:'w',Armor:'a',Shield:'s',Helm:'h',Belt:'b',Charm1:'c1',Charm2:null}
  };
  const base = E.render(state);
  for (const slot of E.slots) assert(base.includes(`eq25-slot--${slot.toLowerCase()}`), slot);
  for (const type of E.filters) assert(base.includes(`data-gear-filter="${type}"`), type);
  const charm = E.render(state,{selectedUid:'c2'});
  assert.match(charm,/data-equip="c2" data-slot="Charm1"/);
  assert.match(charm,/data-equip="c2" data-slot="Charm2"/);
  assert.match(charm,/Loadout impact/);
  assert.match(charm,/Next star gains/);
  assert.match(charm,/Damage|Armor|Spell dmg/);
  assert.match(charm,/eq25-charm-actions/);
});

test('upgrade quotes remain deterministic for every gear type through rank five', () => {
  for (const type of E.gearTypes) {
    for (let rank = 0; rank < 5; rank++) {
      const item = { type, value:100, rank }, snapshot = JSON.stringify(item), quote = E.upgradeCost(item);
      assert.equal(quote.gold, 80 * (rank + 1));
      assert.equal(quote.rank, rank);
      assert.equal(quote.nextRank, rank + 1);
      assert(Object.isFrozen(quote));
      assert.equal(JSON.stringify(item), snapshot);
    }
    assert.equal(E.upgradeCost({type,value:100,rank:5}), null);
  }
  assert.equal(E.upgradeCost({type:'Consumable',value:100}), null);
});

let passed = 0;
for (const { name, run } of tests) {
  try { await run(); passed++; console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}
console.log(`✓ ${passed} equipment v27 deterministic tests passed`);
