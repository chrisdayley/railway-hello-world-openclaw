import assert from 'node:assert/strict';
import {loadRuntime} from './runtime-harness.mjs';
const {context,debug,nav,dispatchWindow}=loadRuntime(),P=context.EVERLIGHT_PROGRESSION;
let count=0;function test(name,fn){fn();count++;console.log('✓ '+name);}
const tick=seconds=>{for(let t=0;t<seconds;t+=.016)nav.tick(.016);};
const key=code=>dispatchWindow('keydown',{code,repeat:false,preventDefault(){}});
test('ordinary treasure and enemy loot never contain Epic, Legendary or Mythic',()=>{
  for(const source of ['chest','enemy'])for(let danger=1;danger<=12;danger++)for(let i=0;i<1000;i++)assert(['Common','Uncommon','Rare'].includes(P.treasure({source,danger,roll:i/1000}).tier));
  assert.equal(P.treasure({source:'boss',danger:3,roll:0}).tier,'Epic');
  assert.equal(P.treasure({source:'boss',danger:9,roll:.01}).tier,'Mythic');
  assert.equal(P.treasure({source:'chest',sealed:true,danger:9,roll:.01}).tier,'Mythic');
});
test('world-fixed boss levels and phase patterns demand preparation without hard build gates',()=>{
  assert.equal(P.profile('moonfall').level,6);assert(P.profile('moonfall').hp>=1000);
  const e={hp:1000,maxHp:1380,cycle:0};assert.equal(P.attackPlan(e,500).kind,'volley');
  assert.equal(P.attackPlan({...e,cycle:1},500).kind,'charge');
  assert.equal(P.attackPlan({...e,cycle:2},180).kind,'radial');
  assert(P.attackPlan({...e,hp:200},100).cooldown<P.attackPlan(e,100).cooldown);
});
test('actual boss fires from long range and damages an idle distant caster',()=>{
  nav.setState({style:'arcanist',zone:'moonfall',x:1050,y:560,mainStep:6,maxHp:500,hp:500});nav.clearEnemies();debug.spawnEnemy('warden',1570,560);
  let sawVolley=false,sawCharge=false,shots=0;for(let i=0;i<1000;i++){nav.tick(.016);const v=nav.get();sawVolley||=v.enemies[0].attackKind==='volley';sawCharge||=v.enemies[0].attackKind==='charge';shots=Math.max(shots,v.projectiles.filter(p=>p.kind==='enemy').length);}
  assert(sawVolley&&sawCharge);assert(shots>=3);assert(nav.get().state.hp<500,'standing still at spell range must be unsafe');
});
test('spell hits provoke pursuit beyond old aggro boundary and bosses resist stunlock',()=>{
  nav.setState({style:'arcanist',zone:'moonfall',x:1090,y:560,mainStep:6,maxHp:500,hp:500,mana:100,maxMana:100});nav.clearEnemies();debug.spawnEnemy('warden',1420,560);
  key('KeyQ');tick(1.2);const boss=nav.get().enemies[0];assert(boss.engaged);assert(boss.hp<boss.maxHp);assert(boss.maxHp>1000);
});
test('save migration preserves completed chapter and earned gear across seven slots',()=>{
  const saved={schema:8,build:'26',mainStep:8,chapterComplete:true,opened:['hollow-warden'],gold:777,inventory:[{uid:'b',id:'echo_buckler',type:'Charm',rarity:'Legendary',armor:7},{uid:'c',id:'lantern_charm',type:'Charm',spell:.2}],equipment:{Charm:'b'},properties:{},level:5};
  const next=debug.migrateSave(saved);assert.equal(next.schema,9);assert.equal(next.mainStep,8);assert.equal(next.gold,777);assert(next.chapterComplete);assert.equal(next.equipment.Shield,'b');assert.equal(next.inventory[0].rarity,'Legendary');assert.equal(Object.keys(next.equipment).length,7);
});
test('sealed dungeon hoard requires both inscriptions and defeated keeper',()=>{
  const area=context.EVERLIGHT_ATLAS.areas.find(a=>a.kind==='dungeon'&&a.hasElite);assert(area);
  nav.setState({zone:area.id,mainStep:8,inventory:[{uid:'w',id:'roadworn_blade',type:'Weapon'}]});nav.clearEnemies();const chest=nav.objects().find(o=>o.sealed);assert(chest);debug.setPlayer(chest.x,chest.y);nav.interact();assert(!nav.get().state.opened.includes(chest.id));
  const keys=[`${area.id}:elite`,`${area.id}:seal:dawn`,`${area.id}:seal:dusk`];nav.setState({...nav.get().state,opened:keys});nav.clearEnemies();debug.setPlayer(chest.x,chest.y);nav.interact();assert(nav.get().state.opened.includes(chest.id));assert.equal(nav.get().state.inventory.length,2);
});
test('minimap chooses story, interior exit and tracked road destinations',()=>{
  nav.setState({zone:'northford',mainStep:0});assert.equal(nav.get().target.id,'mira');
  nav.setState({zone:'northford',mainStep:4});assert.equal(nav.get().target.target,'guildhall');
  nav.setState({zone:'bellkeeper',mainStep:8});assert.equal(nav.get().target.id,'exit');
  nav.setState({zone:'moonfall',mainStep:8,opened:['hollow-warden']});assert.equal(nav.get().target.id,'worldRoad');
});
console.log(`✓ ${count} progression v27 source and actual-runtime groups passed`);
