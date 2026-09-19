import assert from 'node:assert/strict';
import {loadRuntime} from './runtime-harness.mjs';
const {context,debug,nav,elements,storage}=loadRuntime(),C=context.EVERLIGHT_STORY;
let groups=0;const test=(name,fn)=>{fn();console.log('✓ '+name);groups++;};
const state=()=>nav.get().state;
function click(attribute,value,extra={}){const camel=attribute.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());const target={dataset:{[camel]:value,...extra},closest:s=>s===`[data-${attribute}]`?target:null};context.document.getElementById('interactionBody').dispatchEvent({type:'click',target});}
function at(id){const p=C.people[id];debug.enterZone(p.zone);debug.setPlayer(p.x,p.y);nav.interact();}
function fresh(extra={}){nav.setState({style:'vanguard',mainStep:8,chapterComplete:true,opened:['hollow-warden'],level:6,maxHp:180,hp:180,zone:'moonfall',...extra});}
test('old completed-prologue saves receive a concrete next goal without losing progress',()=>{fresh({gold:777});assert.equal(state().gold,777);assert.equal(state().mainStep,8);assert.equal(state().story.step,0);assert.equal(nav.get().target.storyId,'courier');assert.match(C.objective(state())[1],/Iona/);});
test('all main objectives complete through real runtime handlers, bosses and choices exactly once',()=>{
  fresh();for(let step=0;step<C.main.length;step++){const m=C.main[step];assert.equal(state().story.step,step);at(m.at);
    if(m.kind==='kill'){elements.get('closeInteraction').onclick();nav.clearEnemies();for(let i=0;i<m.count;i++){debug.spawnEnemy('wisp');debug.defeatNearest();}}
    else if(m.kind==='boss'){elements.get('closeInteraction').onclick();const boss=nav.get().enemies.find(e=>e.storyBoss===step);assert(boss,`missing boss ${step}`);assert.equal(boss.bossName,m.boss);debug.command('enemy.kill',{enemyId:boss.id});}
    else{const action=`main:${m.kind==='choice'?m.choices[0][0]:'continue'}`;click('story-action',action,{storyPerson:m.at});const gold=state().gold;click('story-action',action,{storyPerson:m.at});assert.equal(state().gold,gold,'replayed stage cannot pay twice');}
    assert.equal(state().story.step,step+1,m.title);assert(state().inventory.every(i=>i.id));
  }assert(state().story.flags.beaconLit&&state().story.flags.miraRoads&&state().story.flags.basinRestored);assert.equal(Object.keys(state().story.choices).length,2);assert.match(C.objective(state())[0],/Restored/);assert.match(C.journal(state(),context.EVERLIGHT_ATLAS),/currently authored/);debug.save();const raw=JSON.parse(storage.get('everlight-save-v6'));assert.equal(debug.migrateSave(raw).story.step,C.main.length);
});
test('all eight side stories accept, target, resolve and pay once through runtime interactions',()=>{
  for(const q of C.sides){fresh({story:{step:C.main.length}});at(q.giver);click('story-action',`accept:${q.id}`,{storyPerson:q.giver});assert.equal(state().story.side[q.id].status,'active');assert.equal(state().story.tracked,q.id);at(q.at);
    if(q.kind==='kill'){elements.get('closeInteraction').onclick();nav.clearEnemies();for(let i=0;i<q.count;i++){debug.spawnEnemy('wisp');debug.defeatNearest();}}
    else click('story-action',`find:${q.id}`,{storyPerson:q.at});
    assert.equal(state().story.side[q.id].status,'ready');assert.equal(C.target(state()).id,q.giver);at(q.giver);const gold=state().gold;click('story-action',`claim:${q.id}`,{storyPerson:q.giver});assert.equal(state().gold,gold+q.gold);assert.equal(state().story.side[q.id].status,'complete');click('story-action',`claim:${q.id}`,{storyPerson:q.giver});assert.equal(state().gold,gold+q.gold);if(q.item)assert(state().inventory.some(i=>i.id===q.item));
  }
});
test('main and side tracking route across the whole atlas and return to Moonfall',()=>{
  for(let step=0;step<C.main.length;step++){for(const zone of ['northford','greenwake','moonfall','atlas_greenwake_00','atlas_moonfall_23']){fresh({zone,story:{step}});const t=nav.get().target;assert(t,`${step} ${zone} has no target`);assert(t.kind==='portal'||t.storyId||t.storyBoss!==undefined||C.main[step].kind==='kill');}}
  fresh({zone:'atlas_greenwake_00'});assert.equal(nav.get().target.target,'moonfall');const portal=nav.objects().find(o=>o.id==='returnMoonfall');debug.setPlayer(portal.x,portal.y);nav.interact();assert.equal(state().zone,'moonfall');
});
test('story targets are collision reachable and cannot be completed from another zone',()=>{
  for(const area of context.EVERLIGHT_ATLAS.areas.filter(a=>a.kind==='settlement')){fresh({zone:area.id});assert.equal(nav.get().enemies.length,0,area.name+' must remain a safe quest hub');}
  for(const [id,p]of Object.entries(C.people)){fresh({zone:p.zone});assert(!nav.collides(p.x,p.y),id+' blocked');}
  fresh({zone:'northford'});const old=state();click('story-action','main:continue',{storyPerson:'courier'});assert.equal(state().story.step,old.story.step);
});
test('ranked abilities change displayed stats and runtime resource limits without double-counting legacy ranks',()=>{
  fresh({skills:['aether_surge'],skillPoints:20});const E=context.EVERLIGHT_EQUIPMENT;const a=E.stats(state());click('skill','aether_surge');assert.equal(state().skillRanks.aether_surge,2);assert(E.stats(state()).spellDamage>a.spellDamage);click('skill','mana_well');assert(E.stats(state()).maxMana>state().maxMana);click('skill','hardy');assert(E.stats(state()).maxHp>a.maxHp);assert.equal(state().skillPoints,17);
});
test('merchant runtime sells unequipped items once and guards equipped and story items',()=>{
  fresh({zone:'smithy'});const o=nav.objects().find(o=>o.kind==='shop');debug.setPlayer(o.x,o.y);nav.interact();click('merchant-view','sell');assert.match(elements.get('interactionBody').innerHTML,/Sell/);const tonic=state().inventory.find(i=>i.type==='Consumable'),gold=state().gold;click('sell',tonic.uid);assert(state().gold>gold);const after=state().gold;click('sell',tonic.uid);assert.equal(state().gold,after);click('sell','starter-weapon');assert(state().inventory.some(i=>i.uid==='starter-weapon'));
});
test('level-up celebration pauses safely, groups gains, persists and resumes into ranked skills',()=>{
  fresh({xp:479});nav.start();debug.gainXp(562);nav.tick(.016);assert.equal(state().level,8);assert.equal(state().pendingLevelUp.points,2);assert(!elements.get('levelUpPanel').classList.contains('is-hidden'));assert(nav.get().paused);assert.match(elements.get('levelUpGains').textContent,/2 skill points/);elements.get('levelUpSkills').onclick();assert(!state().pendingLevelUp);assert.match(elements.get('journalBody').innerHTML,/Capacity 192/);
});
test('quest reading freezes HP, enemies and projectiles even if another close handler changes paused',()=>{
  fresh({zone:'atlas_greenwake_02',story:{step:1,side:{silverleaf:{status:'active',progress:0}},tracked:'silverleaf'}});debug.setPlayer(610,750);debug.spawnEnemy('warden',660,750);nav.interact();assert(!elements.get('interactionPanel').classList.contains('is-hidden'));nav.closeDialogue();const before=nav.get();for(let i=0;i<1000;i++)nav.tick(.016);const after=nav.get();assert.equal(after.state.hp,before.state.hp);assert.deepEqual(after.enemies,before.enemies);assert.deepEqual(after.projectiles,before.projectiles);elements.get('closeInteraction').onclick();
});
console.log(`✓ ${groups} story/skills/trade/celebration runtime groups passed`);
