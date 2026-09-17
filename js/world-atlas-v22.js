(() => {
  'use strict';

  const REGION_DEFS = [
    { id:'greenwake', name:'Greenwake Marches', biome:'verdant', palette:['#153c2d','#245840','#6e9b62'], enemies:['wisp','briar'], event:'briar_surge', level:[2,5], economy:'herbs' },
    { id:'moonfall', name:'Moonfall Basin', biome:'ruins', palette:['#1d2d3a','#38495a','#69b9b8'], enemies:['wisp','construct'], event:'aether_anomaly', level:[4,7], economy:'relics' },
    { id:'embermarch', name:'Embermarch Frontier', biome:'highland', palette:['#3f3026','#735038','#d39a55'], enemies:['briar','construct'], event:'caravan_raid', level:[6,9], economy:'smithing' },
    { id:'cinderfen', name:'Cinderfen Expanse', biome:'swamp', palette:['#202f2a','#485c38','#9ca55f'], enemies:['wisp','briar'], event:'monster_surge', level:[8,12], economy:'alchemy' },
    { id:'sunmere', name:'Sunmere Coast', biome:'coast', palette:['#173c46','#286a72','#d7bc72'], enemies:['wisp','construct'], event:'drowned_vault', level:[10,14], economy:'trade' },
    { id:'skyreach', name:'Skyreach Highlands', biome:'alpine', palette:['#273844','#54717d','#b7d5d4'], enemies:['construct','wisp'], event:'faction_clash', level:[12,16], economy:'mounts' },
    { id:'frostveil', name:'Frostveil Range', biome:'frost', palette:['#263747','#617b91','#d9eff4'], enemies:['construct','wisp'], event:'whiteout_hunt', level:[14,18], economy:'mining' },
    { id:'saltglass', name:'Saltglass Desert', biome:'desert', palette:['#513e2c','#9b7045','#e5c27f'], enemies:['briar','construct'], event:'glass_storm', level:[16,20], economy:'caravans' },
    { id:'thornbarrow', name:'Thornbarrow Wilds', biome:'ancient_forest', palette:['#172b20','#315239','#8a8f54'], enemies:['briar','wisp'], event:'roaming_titan', level:[18,22], economy:'timber' },
    { id:'asterwild', name:'Asterwild Isles', biome:'islands', palette:['#173444','#246277','#8bd2c6'], enemies:['wisp','construct'], event:'treasure_tide', level:[20,24], economy:'shipping' },
    { id:'crownstep', name:'Crownstep Dominion', biome:'royal', palette:['#302b45','#62557c','#d5b96c'], enemies:['construct','wisp'], event:'royal_crisis', level:[22,26], economy:'commerce' },
    { id:'starfall', name:'Starfall Hollow', biome:'astral', palette:['#191d38','#403b73','#c978d4'], enemies:['wisp','construct'], event:'mythic_fall', level:[25,30], economy:'aether' }
  ];

  const PREFIXES = ['Lantern','Hollow','Silver','Old','Whisper','Crown','Moss','Ash','Moon','Fox','Warden','Wayfarer','Gloam','Dawn','Echo','Star','Thorn','Glass','Ember','Aster','Rune','Raven','Bright','Forgotten'];
  const SUFFIXES = ['Crossing','Glen','Road','Watch','Hearth','Falls','Reach','Vault','Grove','Spire','Hollow','Ford','Rise','Gate','Ruins','Mere','Pass','Field','Fen','Coast','Sanctum','Mine','Market','Wilds'];
  const PROPERTY_TYPES = ['farm','inn','smithy','apothecary','market','workshop','warehouse','stable','mine','conservatory','ferry','lodge'];
  const QUEST_TYPES = ['bounty','rescue','relic','delivery','survey','defense','mystery','hunt'];

  function hash(text) {
    let h = 2166136261;
    for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function areaName(region, index) {
    const seed = hash(`${region.id}:${index}`);
    return `${PREFIXES[seed % PREFIXES.length]} ${SUFFIXES[(seed >>> 8) % SUFFIXES.length]}`;
  }

  const areas = [];
  for (let regionIndex=0; regionIndex<REGION_DEFS.length; regionIndex++) {
    const region = REGION_DEFS[regionIndex];
    for (let index=0; index<24; index++) {
      const x = index % 6, y = Math.floor(index / 6), seed = hash(`${region.id}:${index}:everlight`);
      const id = `atlas_${region.id}_${String(index).padStart(2,'0')}`;
      const exits = {};
      if (x > 0) exits.west = `atlas_${region.id}_${String(index-1).padStart(2,'0')}`;
      if (x < 5) exits.east = `atlas_${region.id}_${String(index+1).padStart(2,'0')}`;
      if (y > 0) exits.north = `atlas_${region.id}_${String(index-6).padStart(2,'0')}`;
      if (y < 3) exits.south = `atlas_${region.id}_${String(index+6).padStart(2,'0')}`;
      if (index === 0 && regionIndex > 0) exits.west = `atlas_${REGION_DEFS[regionIndex-1].id}_23`;
      if (index === 23 && regionIndex < REGION_DEFS.length-1) exits.east = `atlas_${REGION_DEFS[regionIndex+1].id}_00`;
      const kind = index === 0 || index === 12 ? 'settlement' : index % 7 === 6 ? 'dungeon' : index % 5 === 4 ? 'landmark' : 'wilderness';
      const levelSpan = region.level[1] - region.level[0];
      areas.push({
        id, regionId:region.id, regionName:region.name, index, x, y, seed,
        name: areaName(region,index), biome:region.biome, palette:region.palette, kind,
        recommendedLevel: region.level[0] + Math.round(levelSpan * index / 23),
        danger: 1 + Math.floor((regionIndex * 24 + index) / 36),
        exits, enemies:region.enemies, eventFamily:region.event, economy:region.economy,
        secretCount: 1 + seed % 3,
        propertyType: PROPERTY_TYPES[(seed >>> 5) % PROPERTY_TYPES.length],
        propertyAvailable: kind === 'settlement' || index % 4 === 2,
        questType: QUEST_TYPES[(seed >>> 11) % QUEST_TYPES.length],
        hasWaystone: kind === 'settlement' || index === 23,
        hasElite: kind === 'dungeon' || seed % 6 === 0,
        treasureTier: regionIndex < 3 ? 'Rare' : regionIndex < 7 ? 'Epic' : regionIndex < 10 ? 'Legendary' : 'Mythic'
      });
    }
  }

  const byId = Object.fromEntries(areas.map(area => [area.id, area]));
  const regions = REGION_DEFS.map(region => ({ ...region, areas:areas.filter(area => area.regionId === region.id).map(area => area.id) }));

  window.EVERLIGHT_ATLAS = {
    version:22,
    totalAreas:areas.length,
    regions,
    areas,
    byId,
    firstArea:'atlas_greenwake_00',
    get(id){ return byId[id] || null; },
    neighbors(id){ const area=byId[id]; return area ? Object.values(area.exits).map(exitId => byId[exitId]).filter(Boolean) : []; }
  };
})();
