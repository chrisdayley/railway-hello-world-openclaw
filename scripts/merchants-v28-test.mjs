import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const context = { console };
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/merchants-v28.js'), 'utf8'), context, { filename:'js/merchants-v28.js' });
const M = context.EVERLIGHT_MERCHANTS;

const tests = [];
const test = (name, run) => tests.push({ name, run });

test('quote is deterministic, rank-aware, and bounded to sixty percent of item value', () => {
  const base = { uid:'blade', type:'Weapon', value:100 };
  assert.equal(M.quote(base), 32);
  assert.equal(M.quote({...base,rank:1}), 46);
  assert.equal(M.quote({...base,rank:5}), 60);
  assert.equal(M.quote({...base,rank:999}), 60);
  assert.equal(M.quote({...base,rank:-10}), 32);
  assert.equal(M.quote({type:'Weapon',value:18,rank:5}), 11);
  assert.equal(M.quote({type:'Quest',value:999,rank:5}), 0);
  assert.equal(M.quote({type:'Charm',value:0}), 0);
  assert.equal(M.quote(null), 0);
  for (let rank = 0; rank <= 5; rank++) assert(M.quote({...base,rank}) <= 60);
});

test('every canonical and legacy equipped reference is protected', () => {
  const slots = ['Armor','Shield','Helm','Weapon','Belt','Charm1','Charm2','Charm'];
  for (const slot of slots) {
    const state = { gold:10, inventory:[{uid:'held',name:'Held Relic',type:'Charm',value:100}], equipment:{[slot]:'held'} };
    const before = JSON.stringify(state), result = M.sell(state,'held');
    assert.equal(M.isEquipped(state,'held'), true, slot);
    assert.equal(result.ok, false, slot);
    assert.match(result.message,/Unequip/);
    assert.equal(JSON.stringify(state), before, `${slot} rejection must be atomic`);
  }
  const objectReference = { gold:0, inventory:[{uid:'object-id',name:'Object Gear',type:'Armor',value:80}],equipment:{Armor:{uid:'object-id'}} };
  assert.equal(M.sell(objectReference,'object-id').ok,false);
});

test('quest, valueless, missing, and malformed sales never mutate state', () => {
  const state = { gold:25, inventory:[
    {uid:'quest',name:'Aether Lens',type:'Quest',value:1000},
    {uid:'free',name:'Keepsake',type:'Charm',value:0}
  ],equipment:{} };
  for (const uid of ['quest','free','missing']) {
    const before = JSON.stringify(state), result = M.sell(state,uid);
    assert.equal(result.ok,false);
    assert.equal(JSON.stringify(state),before);
  }
  assert.equal(M.sell({},'anything').ok,false);
});

test('successful sale removes one UID, pays one quote, and duplicate clicks cannot pay twice', () => {
  const item = {uid:'sale',name:'Moonfall Saber',type:'Weapon',rarity:'Rare',value:130,rank:2};
  const state = {gold:40,inventory:[item,{uid:'other',name:'Tonic',type:'Consumable',value:22}],equipment:{}};
  const expected = M.quote(item), first = M.sell(state,'sale');
  assert.equal(first.ok,true);
  assert.equal(first.gold,expected);
  assert.equal(state.gold,40+expected);
  assert.deepEqual(state.inventory.map(entry=>entry.uid),['other']);
  const snapshot = JSON.stringify(state), duplicate = M.sell(state,'sale');
  assert.equal(duplicate.ok,false);
  assert.equal(JSON.stringify(state),snapshot);
});

test('high-rarity confirmation rule is narrow and explicit', () => {
  for (const rarity of ['Epic','Legendary','Mythic']) assert.equal(M.requiresConfirmation({rarity}),true,rarity);
  for (const rarity of ['Common','Uncommon','Rare',undefined]) assert.equal(M.requiresConfirmation({rarity}),false,String(rarity));
});

test('buy presentation preserves existing runtime data attributes and exact calculated prices', () => {
  const templates = {
    blade:{id:'blade',name:'Briar <Edge>',type:'Weapon',rarity:'Uncommon',power:18,value:50,description:'Road steel.'},
    tonic:{id:'tonic',name:'Tonic',type:'Consumable',rarity:'Common',heal:55,value:22}
  };
  const state = {gold:50,inventory:[],equipment:{}}, snapshot = JSON.stringify(state);
  const html = M.render({state,stock:['blade','tonic'],templates,priceFor:item=>item.id==='blade'?75:20,keeper:'Nell & Son',view:'buy'});
  assert.match(html,/data-merchant-view="buy"/);
  assert.match(html,/data-merchant-view="sell"/);
  assert.match(html,/data-buy="blade" data-index="0" disabled/);
  assert.match(html,/Need 25g/);
  assert.match(html,/data-buy="tonic" data-index="1"/);
  assert.match(html,/>20g<\/button>/);
  assert.match(html,/Briar &lt;Edge&gt;/);
  assert.match(html,/Nell &amp; Son/);
  assert.equal(JSON.stringify(state),snapshot,'render must be pure');
});

test('sell presentation explains protected items and exposes pending rare-sale confirmation', () => {
  const state = {gold:10,inventory:[
    {uid:'common',name:'Road Belt',type:'Belt',rarity:'Common',value:30},
    {uid:'epic',name:'Hollowguard Plate',type:'Armor',rarity:'Epic',value:420,rank:2},
    {uid:'equipped',name:'Mira Charm',type:'Charm',rarity:'Rare',value:180},
    {uid:'quest',name:'Aether Lens',type:'Quest',rarity:'Rare',value:0}
  ],equipment:{Charm2:'equipped'}};
  const epicQuote = M.quote(state.inventory[1]);
  const snapshot = JSON.stringify(state);
  const list = M.render({state,keeper:'Pella',view:'sell'});
  assert.match(list,/data-sell="common"/);
  assert.match(list,/Sell · 10g/);
  assert.match(list,/data-sell="epic"/);
  assert.match(list,new RegExp(`Review · ${epicQuote}g`));
  assert.match(list,/data-sell="equipped" disabled/);
  assert.match(list,/Equipped · Charm II/);
  assert.match(list,/data-sell="quest" disabled/);
  assert.match(list,/Story item/);
  const confirm = M.render({state,keeper:'Pella',view:{mode:'sell',pendingUid:'epic',message:'Review this sale.'}});
  assert.match(confirm,/role="alertdialog"/);
  assert.match(confirm,/data-confirm-sell="epic"/);
  assert.match(confirm,/data-cancel-sale/);
  assert.match(confirm,new RegExp(`Confirm sale · ${epicQuote}g`));
  assert.match(confirm,/Review this sale\./);
  assert.equal(JSON.stringify(state),snapshot);
});

test('invalid pending references cannot manufacture confirmation actions', () => {
  const state = {gold:0,inventory:[{uid:'epic',name:'Epic',type:'Armor',rarity:'Epic',value:100}],equipment:{Armor:'epic'}};
  for (const pendingUid of ['epic','missing']) {
    const html = M.render({state,view:{mode:'sell',pendingUid}});
    assert.doesNotMatch(html,/data-confirm-sell=/);
  }
});

let passed = 0;
for (const {name,run} of tests) {
  try { await run(); passed++; console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}
console.log(`✓ ${passed} merchant v28 deterministic tests passed`);
