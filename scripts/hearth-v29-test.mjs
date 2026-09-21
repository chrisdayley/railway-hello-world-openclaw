import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadRuntime} from './runtime-harness.mjs';
const {context,debug,nav,elements,storage,dispatchWindow}=loadRuntime();
const H=context.EVERLIGHT_HEARTH;
let groups=0;
const test=(name,fn)=>{fn();console.log('✓ '+name);groups++;};
const state=()=>nav.get().state;
const fresh=(extra={})=>nav.setState({style:'vanguard',mainStep:8,story:{step:9,choices:{6:'shelter'},side:{tools:{status:'complete'}}},opened:['hollow-warden'],level:6,hp:180,maxHp:180,zone:'northford',...extra});
function click(a){const target={dataset:{hearth:a},closest:s=>s==='[data-hearth]'?target:null};elements.get('interactionBody').dispatchEvent({type:'click',target});}
function at(id){const o=nav.objects().find(o=>o.hearth===id);assert(o,'missing object '+id);debug.setPlayer(o.x,o.y);nav.interact();return o;}
function close(){elements.get('closeInteraction').onclick();}
function solve(){click('promise:home');for(const id of ['portrait','boots','table']){at(id);click('remember:'+id);}at('workshop');for(const id of ['rain','bread','ember'])at(id);at('heart');}

test('v28 migration preserves gear, money, authored story, properties and starts an additive episode',()=>{
  fresh({gold:5432,properties:{custom:{value:1000}},skillRanks:{hardy:3}});const s=state();assert.equal(s.gold,5432);assert.equal(s.story.step,9);assert.equal(s.properties.custom.value,1000);assert.equal(s.skillRanks.hardy,3);assert.equal(s.hearth.stage,0);assert.equal(s.inventory[0].uid,'starter-weapon');
});
test('accepting and leaving the memory returns to the exact road and keeps the main objective',()=>{
  fresh({zone:'moonfall',x:1180,y:760});const before=state();click('promise:truth');assert.equal(state().zone,'memory_hall');assert.equal(state().hearth.promise,'truth');assert.equal(state().story.step,9);at('leave');assert.equal(state().zone,before.zone);assert.equal(state().x,before.x);assert.equal(state().y,before.y);click('resume');assert.equal(state().zone,'memory_hall');assert.equal(state().hearth.stage,1);
});
test('all six clue orders work, duplicate memories do not advance, and physical notes gate the chamber',()=>{
  for(const ids of [['boots','table','portrait'],['boots','portrait','table'],['table','boots','portrait'],['table','portrait','boots'],['portrait','table','boots'],['portrait','boots','table']]){
    fresh();click('promise:home');at('workshop');at('heart');assert.equal(state().zone,'memory_workshop');at('rain');assert.equal(state().hearth.stage,1);at('hall');
    for(const id of ids){at(id);click('remember:'+id);const n=state().hearth.clues.length;click('remember:'+id);assert.equal(state().hearth.clues.length,n);}
    assert.equal(state().hearth.stage,2);at('workshop');at('bread');assert.equal(state().hearth.sequence.length,0);at('rain');at('ember');assert.equal(state().hearth.sequence.length,0);for(const id of ['rain','bread','ember'])at(id);assert.equal(state().hearth.stage,3);at('heart');assert.equal(state().zone,'memory_heart');assert.equal(nav.get().enemies.filter(e=>e.memoryBoss).length,1);
  }
});
test('every clue, door, NPC and tether has a traversable route from its room entrance',()=>{
  // Collision-aware flood fill is stricter than teleporting to each interaction point.
  for(const zone of Object.keys(H.rooms))for(const stage of [1,3,5]){
    fresh({zone,hearth:{stage,clues:['boots','table','portrait']}});const z=H.rooms[zone],step=20,start=[Math.round(z.spawn.x/step),Math.round(z.spawn.y/step)];const seen=new Set(),queue=[start];
    while(queue.length){const [x,y]=queue.shift(),key=x+','+y;if(seen.has(key)||nav.collides(x*step,y*step))continue;seen.add(key);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}
    for(const o of nav.objects()){assert(!nav.collides(o.x,o.y),zone+' '+o.name+' is embedded in furniture');assert([...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x*step-o.x,y*step-o.y)<70;}),zone+' '+o.name+' unreachable');}
  }
});
test('tethers lower real resistance, create recovery windows, and cannot be farmed',()=>{
  fresh();solve();assert.equal(nav.get().enemies[0].resistance,.54);const gold=state().gold;
  for(const id of ['west','east','north'])at(id);const boss=nav.get().enemies[0];assert.equal(boss.resistance,0);assert.equal(boss.state,'recover');assert.equal(boss.stateTimer,1.7);at('north');assert.equal(state().hearth.anchors.length,3);assert.equal(state().gold,gold);
  debug.enterZone('memory_workshop');debug.enterZone('memory_heart');assert.equal(nav.get().enemies[0].resistance,0);
});
test('boss resolution and both choices are persistent and one-shot; attunement can be changed',()=>{
  for(const choice of ['home','road']){
    fresh();solve();debug.defeatNearest();assert.equal(state().hearth.stage,4);debug.enterZone('memory_heart');assert.equal(nav.get().enemies.length,0);at('alden');const gold=state().gold;click('resolve:'+choice);assert.equal(state().hearth.stage,5);assert.equal(state().hearth.choice,choice);assert.equal(state().gold,gold+150);click('resolve:'+choice);assert.equal(state().gold,gold+150);click('hall');assert.equal(state().zone,'memory_hall');at('alden');click('attune:'+(choice==='home'?'road':'home'));assert.notEqual(state().hearth.choice,choice);debug.save();const migrated=debug.migrateSave(JSON.parse(storage.get('everlight-save-v6')));assert.equal(migrated.hearth.stage,5);assert.equal(migrated.story.step,9);
  }
});
test('the optional cache needs observation and awards only once without free legendary loot',()=>{
  fresh();click('promise:home');assert(!nav.objects().some(o=>o.hearth==='stitch'));for(const id of ['boots','table','portrait']){at(id);click('remember:'+id);}const before=state();at('stitch');assert.equal(state().gold,before.gold+45);assert.equal(state().inventory.length,before.inventory.length+1);at('stitch');assert.equal(state().inventory.length,before.inventory.length+1);assert.equal(state().inventory.at(-1).rarity,'Uncommon');
});
test('return recap and reading freeze combat; deferred level-up remains queued',()=>{
  fresh({zone:'memory_heart',hearth:{stage:3}});nav.start();at('workshop');at('score');const hp=state().hp;for(let i=0;i<200;i++)nav.tick(.05);assert.equal(state().hp,hp);debug.gainXp(600);assert(state().pendingLevelUp);assert(elements.get('levelUpPanel').classList.contains('is-hidden'));close();nav.tick(.016);assert(!elements.get('levelUpPanel').classList.contains('is-hidden'));
});
test('Resonant Dodge restores resources only when threatened and respects its cooldown',()=>{
  fresh({hearth:{stage:5,choice:'home'},hp:80,mana:10});close();nav.clearEnemies();dispatchWindow('keydown',{code:'KeyR',repeat:false});dispatchWindow('keyup',{code:'KeyR'});assert.equal(state().hp,80);for(let i=0;i<100;i++)nav.tick(.05);debug.spawnEnemy('warden',state().x+60,state().y);debug.forceWindup();const mana=state().mana,hp=state().hp;dispatchWindow('keydown',{code:'KeyR',repeat:false});dispatchWindow('keyup',{code:'KeyR'});assert.equal(state().mana,mana+8);assert.equal(state().hp,hp+4);
});
test('marked ground attacks telegraph before damage and do not tick behind menus',()=>{
  fresh({zone:'memory_heart',hearth:{stage:3},maxHp:1000,hp:1000});nav.start();let warned=false;for(let i=0;i<90;i++){nav.tick(.05);if(nav.get().hazards.some(p=>p.life>.3&&!p.hit))warned=true;}assert(warned);const hp=state().hp;for(let i=0;i<50;i++)nav.tick(.05);assert(state().hp<hp,'standing still must be punished');elements.get('objectiveBtn').onclick();const before=nav.get();for(let i=0;i<100;i++)nav.tick(.05);assert.deepEqual(nav.get().hazards,before.hazards);assert.equal(state().hp,before.state.hp);
});
test('the traveling lantern actually joins combat and produces friendly projectiles',()=>{
  fresh({zone:'greenwake',storyChoice:null,hearth:{stage:5,choice:'road'}});nav.clearEnemies();debug.spawnEnemy('briar',state().x+130,state().y);let fired=false;for(let i=0;i<60;i++){nav.tick(.05);if(nav.get().projectiles.some(p=>p.kind==='companion'))fired=true;}assert(fired,'the lantern must fire a real projectile');
});
test('runtime build and offline cache include every new dependency',()=>{
  const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');assert.match(html,/EXPECTED_BUILD__='29'/);for(const path of ['js/hearth-v29.js','styles/hearth-v29.css']){assert(html.includes(path));assert(sw.includes(path));assert(fs.existsSync(path));}assert.match(sw,/everlight-v29/);
});
test('the Collector is beatable through actual movement, dodge and attacks with melee, ranged or magic',()=>{
  for(const build of ['melee','ranged','magic']){
    const {nav:n,dispatchWindow:key}=loadRuntime();
    n.setState({style:build==='magic'?'arcanist':'vanguard',zone:'memory_heart',level:6,maxHp:180,hp:180,maxMana:100,mana:100,hearth:{stage:3,level:6,anchors:['west','east','north']},inventory:[{id:build==='ranged'?'wayfarer_bow':'briar_edge',uid:'blade'},{id:'leather_coat',uid:'armor'},{id:'oak_shield',uid:'shield'}],equipment:{Weapon:'blade',Armor:'armor',Shield:'shield'}});
    for(let time=0;time<180;time+=.05){const run=n.get(),boss=run.enemies.find(e=>e.memoryBoss&&!e.dead);if(!boss||run.state.hp<=0)break;const s=run.state,dx=boss.x-s.x,dy=boss.y-s.y,d=Math.hypot(dx,dy)||1,wanted=build==='melee'?72:240;n.input(dx/d*(d>wanted?1:-.2)-dy/d*.85,dy/d*(d>wanted?1:-.2)+dx/d*.85);for(const code of [build==='magic'?'KeyQ':'Space',...(boss.state==='windup'?['KeyR']:[])]){key('keydown',{code,repeat:false,preventDefault(){}});key('keyup',{code});}n.tick(.05);}
    assert.equal(n.get().state.hearth.stage,4,build+' cannot defeat the boss with real attacks');assert(n.get().state.hp>0);
  }
});
console.log(`✓ ${groups} v29 runtime groups passed`);
