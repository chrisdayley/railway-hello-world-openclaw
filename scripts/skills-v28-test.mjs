import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const window={};
const context=vm.createContext({window,console,Math,Object,Array,String,Number,RegExp});
vm.runInContext(fs.readFileSync(path.join(root,'js/skills-v28.js'),'utf8'),context,{filename:'js/skills-v28.js'});
const skills=window.EVERLIGHT_SKILLS;
const tests=[];
const test=(name,fn)=>tests.push({name,fn});
const snapshot=value=>JSON.stringify(value);

test('four extensive trees provide 192 one-point ranks with valid acyclic prerequisites',()=>{
  assert.equal(skills.version,28);
  assert.equal(skills.maxRank,6);
  assert.equal(skills.nodes.length,32);
  assert.equal(skills.capacity,192);
  assert(skills.capacity>=150,'level-100 progression needs substantially more capacity than 99 earned points');
  assert.deepEqual([...skills.treeOrder],['melee','ranged','magic','survival']);
  assert(Object.isFrozen(skills));assert(Object.isFrozen(skills.nodes));
  const ids=new Set(skills.nodes.map(node=>node.id));
  assert.equal(ids.size,skills.nodes.length);
  for(const tree of skills.treeOrder){
    const nodes=skills.nodes.filter(node=>node.tree===tree);
    assert.equal(nodes.length,8,`${tree} must contain eight ranked choices`);
    for(const node of nodes){assert.equal(node.cost,1);assert.equal(node.maxRank,6);assert(Object.isFrozen(node));}
  }
  for(const node of skills.nodes)for(const required of node.requires){
    assert(ids.has(required.id),`${node.id} has missing prerequisite ${required.id}`);
    assert(required.rank>=1&&required.rank<=6);
  }
  const visiting=new Set(),visited=new Set(),byId=Object.fromEntries(skills.nodes.map(node=>[node.id,node]));
  function visit(id){
    assert(!visiting.has(id),`prerequisite cycle at ${id}`);
    if(visited.has(id))return;visiting.add(id);
    for(const required of byId[id].requires)visit(required.id);
    visiting.delete(id);visited.add(id);
  }
  for(const id of ids)visit(id);
});

test('legacy abilities migrate to rank one without losing IDs or unrelated progression',()=>{
  const legacyIds=['keen_edge','counter_light','fleetstep','treasure_sense','aether_surge','chain_light'];
  for(const id of legacyIds)assert(skills.nodes.some(node=>node.id===id),`missing legacy skill ${id}`);
  const state={level:17,skillPoints:'4',skills:[...legacyIds,'future_mod_skill','keen_edge'],skillRanks:{keen_edge:3,hardy:2,overranked:99},gold:777};
  const returned=skills.migrate(state);
  assert.equal(returned,state);
  assert.equal(state.level,17);assert.equal(state.gold,777);assert.equal(state.skillPoints,4);
  assert.equal(state.skillRanks.keen_edge,3);
  assert.equal(state.skillRanks.hardy,2);
  assert.equal(state.skillRanks.overranked,6);
  for(const id of legacyIds)assert(state.skillRanks[id]>=1,`${id} should migrate to rank one`);
  assert.equal(state.skillRanks.future_mod_skill,1,'unknown extension skills must be preserved');
  assert.equal(new Set(state.skills).size,state.skills.length,'migration must deduplicate unlocked IDs');
  const once=snapshot(state);skills.migrate(state);assert.equal(snapshot(state),once,'migration must be idempotent');
  assert.equal(skills.migrate(null),null);
});

test('rank and has support both old arrays and new rank maps safely',()=>{
  assert.equal(skills.rank({skills:['keen_edge']},'keen_edge'),1);
  assert.equal(skills.has({skills:['keen_edge']},'keen_edge'),true);
  assert.equal(skills.rank({skillRanks:{keen_edge:4}},'keen_edge'),4);
  assert.equal(skills.rank({skillRanks:{keen_edge:400}},'keen_edge'),6);
  assert.equal(skills.rank({},'keen_edge'),0);
  assert.equal(skills.has({},'keen_edge'),false);
  assert.equal(skills.rank({skills:['unknown_skill']},'unknown_skill'),1);
});

test('buy is atomic across missing points, prerequisites, unknown IDs, and rank caps',()=>{
  const state={level:1,skillPoints:8,skills:[],skillRanks:{}};
  let before=snapshot(state),result=skills.buy(state,'not_real');
  assert.equal(result.ok,false);assert.equal(snapshot(state),before);
  before=snapshot(state);result=skills.buy(state,'battle_rhythm');
  assert.equal(result.ok,false);assert.match(result.message,/Keen Edge rank 2/);assert.equal(snapshot(state),before);
  result=skills.buy(state,'keen_edge');assert.equal(result.ok,true);assert.equal(result.rank,1);assert.equal(state.skillPoints,7);assert(state.skills.includes('keen_edge'));
  result=skills.buy(state,'battle_rhythm');assert.equal(result.ok,false,'rank-one Keen Edge is not enough for Battle Rhythm');
  result=skills.buy(state,'keen_edge');assert.equal(result.ok,true);assert.equal(result.rank,2);
  result=skills.buy(state,'battle_rhythm');assert.equal(result.ok,true);assert.equal(result.cost,1);
  while(skills.rank(state,'keen_edge')<6){state.skillPoints++;assert.equal(skills.buy(state,'keen_edge').ok,true);}
  before=snapshot(state);result=skills.buy(state,'keen_edge');assert.equal(result.ok,false);assert.equal(snapshot(state),before);
  const broke={skillPoints:0,skills:[],skillRanks:{}};before=snapshot(broke);result=skills.buy(broke,'hardy');assert.equal(result.ok,false);assert.equal(snapshot(broke),before);
  before=snapshot(state);result=skills.buy(state,'blade_mastery');assert.equal(result.ok,false);assert.equal(snapshot(state),before,'multi-prerequisite failure must not partially mutate state');
});

test('a level-one character can legally invest all 99 level-up points without build gates',()=>{
  const state={level:1,skillPoints:99,skills:[],skillRanks:{}};
  let purchases=0;
  while(state.skillPoints>0){
    let progressed=false;
    for(const node of skills.nodes){
      const result=skills.buy(state,node.id);
      if(result.ok){purchases++;progressed=true;if(state.skillPoints===0)break;}
    }
    assert(progressed,`skill graph stalled with ${state.skillPoints} points remaining`);
  }
  assert.equal(purchases,99);
  assert.equal(Object.values(state.skillRanks).reduce((sum,value)=>sum+value,0),99);
  assert.equal(state.level,1,'purchases must not impose hidden character-level gates');
  assert(Object.values(state.skillRanks).some(rank=>rank===6),'rank specialization should be possible');
  assert(Object.values(state.skillRanks).some(rank=>rank<6),'level 100 must still leave meaningful unchosen ranks');
});

test('bonuses are additive, bounded, immutable, and do not double legacy rank-one effects',()=>{
  assert.deepEqual([...skills.effectFields],[
    'power','rangedPower','spell','maxHp','armor','crit','maxMana','maxStamina','move','healing','manaRegen','staminaRegen','lootRadius','counterPower','chainPower','dodgeCostReduction'
  ]);
  const legacy={skills:['keen_edge','counter_light','fleetstep','treasure_sense','aether_surge','chain_light']};
  const legacyBonus=skills.bonuses(legacy);
  for(const value of Object.values(legacyBonus))assert.equal(value,0,'legacy rank one stays handled by existing binary gameplay effects');
  const ranked={skills:['keen_edge','aether_surge','fleetstep','hardy'],skillRanks:{keen_edge:3,aether_surge:2,fleetstep:2,hardy:4}};
  const before=snapshot(ranked),bonus=skills.bonuses(ranked);
  assert.equal(snapshot(ranked),before,'bonus calculation must not mutate saves');
  assert.equal(bonus.power,.05);assert.equal(bonus.spell,.03);assert.equal(bonus.move,.015);assert.equal(bonus.maxHp,24);
  assert(Object.isFrozen(bonus));
  const maxed={skills:skills.nodes.map(node=>node.id),skillRanks:Object.fromEntries(skills.nodes.map(node=>[node.id,6]))};
  const capped=skills.bonuses(maxed);
  for(const [field,value] of Object.entries(capped)){
    assert(value>=0);assert(value<=skills.caps[field],`${field} exceeds declared safe cap`);
  }
  assert(capped.power>0&&capped.rangedPower>0&&capped.spell>0&&capped.maxHp>0&&capped.armor>0&&capped.maxMana>0&&capped.maxStamina>0);
});

test('mobile renderer groups every node with ranks, prerequisites, and one-point actions',()=>{
  const state={skillPoints:1,skills:['keen_edge'],skillRanks:{keen_edge:1}};
  const html=skills.render(state);
  assert.match(html,/ABILITY CONSTELLATION/);
  assert.match(html,/Capacity 192/);
  for(const tree of ['Vanguard','Wayfinder','Lightweaver','Roadwarden'])assert(html.includes(tree));
  for(const node of skills.nodes){
    assert(html.includes(`data-skill-buy="${node.id}"`),`missing purchase control for ${node.id}`);
    assert(html.includes(`data-skill="${node.id}"`),`missing legacy-compatible data attribute for ${node.id}`);
  }
  assert.equal((html.match(/class="skills-v28__node /g)||[]).length,32);
  assert.equal((html.match(/class="skills-v28__ranks"/g)||[]).length,32);
  assert.equal((html.match(/<i class=/g)||[]).length,192);
  assert.match(html,/Keen Edge rank 2/,'locked prerequisite copy should be concrete');
  const freshHtml=skills.render({skillPoints:10,skills:[],skillRanks:{}});
  for(const firstRankEffect of [
    '+20% weapon power',
    'Timed dodge empowers the next strike by +65%',
    '+12% movement speed',
    '+25% spell power',
    'Aether bolt chains to one adjacent target at 55% damage',
    '+40% loot collection radius and clue awareness'
  ])assert(freshHtml.includes(firstRankEffect),`missing concrete first-rank effect: ${firstRankEffect}`);
  assert(!freshHtml.includes('+0%'),'legacy first ranks must not render misleading zero-value bonuses');
  const css=fs.readFileSync(path.join(root,'styles/skills-v28.css'),'utf8');
  assert(css.includes('@media(max-height:500px) and (orientation:landscape)'));
  assert(css.includes('min-height:40px'));
  assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
});

let failures=0;
for(const {name,fn} of tests){
  try{fn();console.log(`✓ ${name}`);}catch(error){failures++;console.error(`✗ ${name}\n${error.stack}`);}
}
if(failures)throw new Error(`${failures} skills v28 test group${failures===1?'':'s'} failed`);
console.log(`✓ ${tests.length} skills v28 deterministic tests passed`);
