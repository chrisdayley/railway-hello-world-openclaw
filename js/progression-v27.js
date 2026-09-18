/* World-fixed boss mastery and source-aware treasure. No player-level rubber band. */
(() => {
  'use strict';
  const pools = {
    Common:['leather_coat','traveler_helm','road_belt','tonic'],
    Uncommon:['briar_edge','wayfarer_bow','oak_shield','trail_helm','scout_belt','aether_draught'],
    Rare:['moonfall_saber','frostveil_mail','lantern_charm','sentinel_shield','rune_helm','duelist_belt'],
    Epic:['emberbrand','warden_plate','saltglass_idol','warden_helm','sunward_shield'],
    Legendary:['echo_buckler','crown_of_echoes','starwoven_belt'],
    Mythic:['starfall_relic']
  };
  function profile(zone,area,rematch=false){
    const level=area?Math.max(5,Number(area.recommendedLevel)||5):zone==='vault'?5:6;
    return {level,name:area?`${area.regionName} Waykeeper`:zone==='vault'?'Drowned Keeper':rematch?'Warden’s Remembrance':'Hollow Warden',
      hp:area?900+level*80:zone==='vault'?900:1080,speed:112+Math.min(18,level),damage:24+Math.floor(level*1.2),
      xp:160+level*28,armor:Math.min(0.24,.06+level*.008)};
  }
  function attackPlan(e,d){
    const phase=e.hp<e.maxHp*.45?2:1,turn=(e.cycle||0)%4;
    const kind=d>260?(turn%2===0?'volley':'charge'):turn===2?'radial':d<120?'slam':'volley';
    return {kind,phase,windup:kind==='charge'?.85:kind==='radial'?.9:kind==='slam'?.62:.75,
      recovery:phase===2?1.1:1.35,cooldown:phase===2?.45:.65,attackTime:kind==='charge'?.62:.3};
  }
  function treasure({source='chest',danger=1,sealed=false,roll=Math.random(),pick=Math.random()}={}){
    let tier;
    if(source==='boss') tier=danger>=9&&roll<.035?'Mythic':danger>=5&&roll<.17?'Legendary':roll<.78?'Epic':'Rare';
    else if(sealed) tier=danger>=9&&roll<.015?'Mythic':danger>=5&&roll<.10?'Legendary':roll<.45?'Epic':'Rare';
    else if(source==='enemy') tier=danger>=4&&roll<.12?'Rare':roll<.6?'Uncommon':'Common';
    else tier=roll<.68?'Common':roll<.97?'Uncommon':'Rare';
    const list=pools[tier];return {tier,itemId:list[Math.min(list.length-1,Math.floor(Math.max(0,pick)*list.length))]};
  }
  window.EVERLIGHT_PROGRESSION={version:27,pools,profile,attackPlan,treasure};
})();
