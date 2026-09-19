/* Everlight v28 ranked skill constellations.
 * Public API: window.EVERLIGHT_SKILLS
 */
(() => {
  'use strict';

  const MAX_RANK = 6;
  const TREE_ORDER = Object.freeze(['melee','ranged','magic','survival']);
  const TREES = Object.freeze({
    melee:Object.freeze({name:'Vanguard',subtitle:'Blades, counters, and pressure',icon:'⚔'}),
    ranged:Object.freeze({name:'Wayfinder',subtitle:'Bows, precision, and mobility',icon:'➶'}),
    magic:Object.freeze({name:'Lightweaver',subtitle:'Aether, chaining, and spellcraft',icon:'✦'}),
    survival:Object.freeze({name:'Roadwarden',subtitle:'Endurance, armor, and discovery',icon:'◆'})
  });
  const EFFECT_LABELS = Object.freeze({
    power:'weapon power',rangedPower:'bow power',spell:'spell power',maxHp:'maximum health',armor:'armor',
    crit:'critical chance',maxMana:'maximum aether',maxStamina:'maximum stamina',move:'movement speed',
    healing:'healing received',manaRegen:'aether recovery',staminaRegen:'stamina recovery',lootRadius:'loot awareness',
    counterPower:'counter damage',chainPower:'chain damage',dodgeCostReduction:'dodge efficiency'
  });
  const CAPS = Object.freeze({
    power:.6,rangedPower:.6,spell:.7,maxHp:180,armor:35,crit:.15,maxMana:180,maxStamina:120,move:.25,
    healing:.4,manaRegen:.5,staminaRegen:.5,lootRadius:2,counterPower:.5,chainPower:.5,dodgeCostReduction:.35
  });
  const ZERO = Object.freeze(Object.fromEntries(Object.keys(CAPS).map(key=>[key,0])));
  const requirement = (id, rank=1) => Object.freeze({id,rank});
  const node = (id,tree,name,description,effects,requires=[],options={}) => Object.freeze({
    id,tree,name,description,maxRank:MAX_RANK,cost:1,
    effects:Object.freeze({...effects}),requires:Object.freeze(requires),
    legacyBase:!!options.legacyBase,ability:options.ability||'',baseText:options.baseText||''
  });

  const NODES = Object.freeze([
    node('keen_edge','melee','Keen Edge','Sharpen every opening into decisive weapon damage.',{power:.025},[],{legacyBase:true,baseText:'+20% weapon power'}),
    node('battle_rhythm','melee','Battle Rhythm','Sustained pressure makes each committed strike more dangerous.',{power:.012,crit:.001},[requirement('keen_edge',2)]),
    node('counter_light','melee','Counterlight','A well-timed dodge primes the next strike for a luminous counter.',{counterPower:.05,crit:.002},[requirement('keen_edge',1)],{legacyBase:true,ability:'counter',baseText:'Timed dodge empowers the next strike by +65%'}),
    node('guard_breaker','melee','Guard Breaker','Drive force through plated foes and reinforce your stance.',{power:.01,armor:.5},[requirement('battle_rhythm',3)]),
    node('relentless','melee','Relentless','Turn successful counters into longer offensive momentum.',{power:.012,counterPower:.02},[requirement('counter_light',3)]),
    node('duelist_focus','melee','Duelist Focus','Trade hesitation for measured precision and critical pressure.',{power:.008,crit:.002},[requirement('battle_rhythm',4)]),
    node('warrior_heart','melee','Warrior Heart','Build the health and armor to stay close when danger peaks.',{maxHp:4,armor:.5},[requirement('guard_breaker',4)]),
    node('blade_mastery','melee','Blade Mastery','Unify rhythm, counters, and technique into endgame weapon mastery.',{power:.015,crit:.0015},[requirement('relentless',5),requirement('duelist_focus',4)]),

    node('fleetstep','ranged','Fleetstep','Move lightly enough to create space before the next shot.',{move:.015},[],{legacyBase:true,baseText:'+12% movement speed'}),
    node('steady_hand','ranged','Steady Hand','Refine bow handling for reliable ranged damage.',{rangedPower:.018},[]),
    node('wayfarer_draw','ranged','Wayfarer Draw','Store more force in each deliberate draw.',{rangedPower:.016,maxStamina:2},[requirement('steady_hand',2)]),
    node('piercing_shot','ranged','Piercing Shot','Commit to high-impact arrows that punish durable targets.',{rangedPower:.02,crit:.001},[requirement('wayfarer_draw',3)]),
    node('windreader','ranged','Windreader','Read motion and terrain before enemies can close.',{move:.009,rangedPower:.008},[requirement('fleetstep',3)]),
    node('volley_mastery','ranged','Volley Mastery','Keep accuracy through rapid follow-up shots.',{rangedPower:.018,staminaRegen:.015},[requirement('piercing_shot',4)]),
    node('eagle_eye','ranged','Eagle Eye','Find the vulnerable seam from farther away.',{crit:.003,rangedPower:.01},[requirement('steady_hand',4)]),
    node('horizon_hunter','ranged','Horizon Hunter','Combine mobility and precision into masterful ranged pressure.',{rangedPower:.022,move:.004},[requirement('volley_mastery',5),requirement('windreader',4)]),

    node('aether_surge','magic','Aether Surge','Channel stronger aether through every offensive spell.',{spell:.03},[],{legacyBase:true,baseText:'+25% spell power'}),
    node('mana_well','magic','Mana Well','Deepen the reserve that powers exploration and combat magic.',{maxMana:4,manaRegen:.01},[]),
    node('chain_light','magic','Chain Light','Aether bolts arc from their first target into a nearby enemy.',{chainPower:.05,spell:.015},[requirement('aether_surge',1)],{legacyBase:true,ability:'chain',baseText:'Aether bolt chains to one adjacent target at 55% damage'}),
    node('echo_focus','magic','Echo Focus','Recover aether more cleanly between dangerous casts.',{manaRegen:.025,maxMana:2},[requirement('mana_well',2)]),
    node('arc_lore','magic','Arc Lore','Translate old inscriptions into practical spell power.',{spell:.018,maxMana:2},[requirement('aether_surge',3)]),
    node('spellweaver','magic','Spellweaver','Interlace chained energy with efficient casting discipline.',{spell:.022,manaRegen:.012},[requirement('chain_light',3),requirement('echo_focus',3)]),
    node('starcall','magic','Starcall','Draw dangerous power from the upper sky without losing control.',{spell:.026,crit:.001},[requirement('spellweaver',4)]),
    node('astral_core','magic','Astral Core','Forge a lasting internal reservoir for master-tier magic.',{spell:.015,maxMana:6},[requirement('arc_lore',4),requirement('mana_well',4)]),

    node('hardy','survival','Hardy','Make every earned level of health go farther.',{maxHp:6},[]),
    node('trail_armor','survival','Trail Armor','Reinforce practical protection without sacrificing mobility.',{armor:1,maxHp:2},[requirement('hardy',2)]),
    node('deep_reserves','survival','Deep Reserves','Expand the stamina needed for running, dodging, and pressure.',{maxStamina:5,staminaRegen:.01},[]),
    node('second_wind','survival','Second Wind','Recover stamina and benefit more from restorative supplies.',{staminaRegen:.025,healing:.02},[requirement('deep_reserves',2)]),
    node('treasure_sense','survival','Treasure Sense','Notice loot and secret caches from farther away.',{lootRadius:.12},[requirement('fleetstep',1)],{legacyBase:true,ability:'treasure',baseText:'+40% loot collection radius and clue awareness'}),
    node('iron_resolve','survival','Iron Resolve','Hold your footing when boss attacks would break lesser travelers.',{armor:1.2,maxHp:3},[requirement('trail_armor',3)]),
    node('wayfarer_instinct','survival','Wayfarer Instinct','Turn exploration awareness into safer, faster travel.',{move:.007,lootRadius:.08},[requirement('treasure_sense',3)]),
    node('roadborn','survival','Roadborn','Master the balance of endurance, recovery, and evasive economy.',{maxHp:5,maxStamina:4,dodgeCostReduction:.025},[requirement('iron_resolve',4),requirement('second_wind',4)])
  ]);
  const BY_ID = Object.freeze(Object.fromEntries(NODES.map(entry=>[entry.id,entry])));

  const clampInt = (value,min,max) => Math.max(min,Math.min(max,Math.trunc(Number(value)||0)));
  const esc = value => String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);

  function rank(state,id) {
    const fromRanks=state?.skillRanks?.[id];
    if(Number.isFinite(Number(fromRanks)))return clampInt(fromRanks,0,BY_ID[id]?.maxRank||MAX_RANK);
    return Array.isArray(state?.skills)&&state.skills.includes(id)?1:0;
  }

  function has(state,id){return rank(state,id)>0;}

  function migrate(state) {
    if(!state||typeof state!=='object')return state;
    const skills=Array.isArray(state.skills)?[...new Set(state.skills.filter(id=>typeof id==='string'))]:[];
    const source=state.skillRanks&&typeof state.skillRanks==='object'?state.skillRanks:{};
    const ranks={};
    for(const [id,value] of Object.entries(source)){
      const current=clampInt(value,0,BY_ID[id]?.maxRank||MAX_RANK);
      if(current>0)ranks[id]=current;
    }
    for(const id of skills)ranks[id]=Math.max(1,ranks[id]||0);
    for(const id of Object.keys(ranks))if(!skills.includes(id))skills.push(id);
    state.skills=skills;
    state.skillRanks=ranks;
    state.skillPoints=Math.max(0,Math.trunc(Number(state.skillPoints)||0));
    return state;
  }

  function missingRequirements(state,entry){return entry.requires.filter(required=>rank(state,required.id)<required.rank);}

  function buy(state,id) {
    const entry=BY_ID[id];
    if(!state||typeof state!=='object')return {ok:false,message:'No journey state was provided.'};
    if(!entry)return {ok:false,message:'That skill is not part of this constellation.'};
    const current=rank(state,id);
    if(current>=entry.maxRank)return {ok:false,message:`${entry.name} is already rank ${entry.maxRank}.`};
    const missing=missingRequirements(state,entry);
    if(missing.length){const needed=missing.map(req=>`${BY_ID[req.id]?.name||req.id} rank ${req.rank}`).join(' and ');return {ok:false,message:`Requires ${needed}.`,missing};}
    const points=Math.max(0,Math.trunc(Number(state.skillPoints)||0));
    if(points<entry.cost)return {ok:false,message:'Earn another skill point by leveling up.'};
    const nextRank=current+1;
    const currentRanks=state.skillRanks&&typeof state.skillRanks==='object'?state.skillRanks:{};
    const nextRanks={...currentRanks,[id]:nextRank};
    const nextSkills=Array.isArray(state.skills)?[...new Set(state.skills)]:[];
    if(!nextSkills.includes(id))nextSkills.push(id);
    state.skillPoints=points-entry.cost;
    state.skillRanks=nextRanks;
    state.skills=nextSkills;
    return {ok:true,message:`${entry.name} raised to rank ${nextRank}.`,id,rank:nextRank,cost:entry.cost,node:entry};
  }

  function bonuses(state) {
    const total={...ZERO};
    for(const entry of NODES){
      const current=rank(state,entry.id);
      const counted=Math.max(0,current-(entry.legacyBase?1:0));
      if(!counted)continue;
      for(const [key,amount] of Object.entries(entry.effects))if(key in total)total[key]+=amount*counted;
    }
    for(const [key,cap] of Object.entries(CAPS))total[key]=Math.min(cap,Math.max(0,Number(total[key].toFixed(4))));
    return Object.freeze(total);
  }

  function valueLabel(key,value) {
    if(['maxHp','armor','maxMana','maxStamina'].includes(key))return `+${Number.isInteger(value)?value:value.toFixed(1)} ${EFFECT_LABELS[key]}`;
    if(key==='lootRadius')return `+${Math.round(value*100)}% ${EFFECT_LABELS[key]}`;
    return `+${Math.round(value*1000)/10}% ${EFFECT_LABELS[key]}`;
  }

  function effectText(entry,current) {
    if(current>=entry.maxRank)return 'All rank benefits active';
    const countedRank=entry.legacyBase&&current===0?0:1;
    const values=Object.entries(entry.effects).map(([key,value])=>valueLabel(key,value*countedRank));
    if(entry.legacyBase&&current===0)return `Rank 1: ${entry.baseText}`;
    return `Next: ${values.join(' · ')}`;
  }

  function render(state={}) {
    const points=Math.max(0,Math.trunc(Number(state.skillPoints)||0));
    const spent=NODES.reduce((sum,entry)=>sum+rank(state,entry.id),0);
    const capacity=NODES.reduce((sum,entry)=>sum+entry.maxRank,0);
    const groups=TREE_ORDER.map(treeId=>{
      const tree=TREES[treeId],entries=NODES.filter(entry=>entry.tree===treeId);
      const treeRanks=entries.reduce((sum,entry)=>sum+rank(state,entry.id),0);
      return `<section class="skills-v28__tree skills-v28__tree--${treeId}" aria-labelledby="skills-${treeId}"><header class="skills-v28__tree-head"><span class="skills-v28__icon" aria-hidden="true">${tree.icon}</span><div><h3 id="skills-${treeId}">${tree.name}</h3><p>${tree.subtitle}</p></div><strong>${treeRanks}/${entries.length*MAX_RANK}</strong></header><div class="skills-v28__nodes">${entries.map(entry=>{
        const current=rank(state,entry.id),missing=missingRequirements(state,entry),maxed=current>=entry.maxRank,available=!missing.length&&points>=entry.cost&&!maxed;
        const requirements=entry.requires.length?entry.requires.map(req=>`${BY_ID[req.id]?.name||req.id} ${req.rank}`).join(' · '):'Open path';
        const segments=Array.from({length:entry.maxRank},(_,index)=>`<i class="${index<current?'is-filled':''}"></i>`).join('');
        return `<article class="skills-v28__node ${maxed?'is-maxed':available?'is-available':'is-locked'}"><div class="skills-v28__node-title"><div><small>${esc(requirements)}</small><h4>${esc(entry.name)}</h4></div><b>Rank ${current}/${entry.maxRank}</b></div><div class="skills-v28__ranks" aria-label="${current} of ${entry.maxRank} ranks">${segments}</div><p>${esc(entry.description)}</p><div class="skills-v28__effect">${esc(effectText(entry,current))}</div><button data-skill="${esc(entry.id)}" data-skill-buy="${esc(entry.id)}" ${available?'':'disabled'} aria-label="${maxed?`${esc(entry.name)} fully ranked`:`Raise ${esc(entry.name)} to rank ${current+1}`}">${maxed?'Mastered':missing.length?`Needs ${esc(BY_ID[missing[0].id]?.name||missing[0].id)} rank ${missing[0].rank}`:points<1?'Need 1 point':'Spend 1 point'}</button></article>`;
      }).join('')}</div></section>`;
    }).join('');
    return `<div class="skills-v28"><header class="skills-v28__summary"><div><span>ABILITY CONSTELLATION</span><h2>Build your own legend</h2><p>Every level grants one point. Rank skills freely across all four paths.</p></div><div class="skills-v28__points"><strong>${points}</strong><small>POINT${points===1?'':'S'} READY</small></div><div class="skills-v28__total"><span>Invested ${spent}</span><span>Capacity ${capacity}</span></div></header>${groups}</div>`;
  }

  window.EVERLIGHT_SKILLS=Object.freeze({
    version:28,maxRank:MAX_RANK,trees:TREES,treeOrder:TREE_ORDER,nodes:NODES,capacity:NODES.length*MAX_RANK,
    effectFields:Object.freeze(Object.keys(CAPS)),caps:CAPS,migrate,has,rank,bonuses,buy,render
  });
})();
