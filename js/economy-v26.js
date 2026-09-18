/* Everlight v26 deterministic property economy and mobile ledger UI.
 * Public API: window.EVERLIGHT_ECONOMY
 */
(() => {
  'use strict';

  const TRACKS = Object.freeze(['quality', 'capacity', 'security']);
  const LAND_CHOICES = Object.freeze(['orchard', 'inn', 'smithy', 'apothecary', 'workshop', 'stable', 'warehouse']);
  const BUSINESS = Object.freeze({
    home:       { label:'Residence', price:230, cost:7, min:18, max:36, risk:'Low', synergy:['inn','market'], favored:['commerce'] },
    market:     { label:'Market', price:390, cost:15, min:39, max:78, risk:'Medium', synergy:['warehouse','farm','orchard'], favored:['trade','commerce','caravans'] },
    inn:        { label:'Inn', price:430, cost:18, min:46, max:88, risk:'Medium', synergy:['orchard','market','stable'], favored:['trade','commerce','caravans'] },
    smithy:     { label:'Smithy', price:510, cost:23, min:54, max:102, risk:'Medium', synergy:['mine','warehouse','workshop'], favored:['smithing','mining'] },
    apothecary: { label:'Apothecary', price:420, cost:17, min:45, max:86, risk:'Medium', synergy:['orchard','farm','conservatory'], favored:['herbs','alchemy'] },
    workshop:   { label:'Workshop', price:470, cost:21, min:49, max:96, risk:'Medium', synergy:['warehouse','smithy','market'], favored:['smithing','relics'] },
    stable:     { label:'Stable', price:460, cost:20, min:44, max:91, risk:'Medium', synergy:['inn','farm','orchard'], favored:['mounts','caravans'] },
    warehouse:  { label:'Warehouse', price:500, cost:19, min:42, max:92, risk:'Low', synergy:['market','workshop','ferry'], favored:['shipping','trade','commerce'] },
    orchard:    { label:'Orchard', price:310, cost:12, min:32, max:66, risk:'Medium', synergy:['inn','apothecary','market'], favored:['herbs','alchemy'] },
    farm:       { label:'Farm', price:320, cost:13, min:32, max:68, risk:'Medium', synergy:['market','inn','stable'], favored:['herbs','commerce'] },
    mine:       { label:'Mine', price:610, cost:31, min:67, max:132, risk:'High', synergy:['smithy','warehouse','workshop'], favored:['mining','smithing'] },
    conservatory:{label:'Conservatory',price:650,cost:29,min:66,max:138,risk:'High',synergy:['apothecary','workshop'],favored:['aether','relics'] },
    ferry:      { label:'Ferry', price:560, cost:25, min:58, max:116, risk:'Medium', synergy:['warehouse','market','inn'], favored:['shipping','trade'] },
    lodge:      { label:'Lodge', price:400, cost:17, min:39, max:82, risk:'Low', synergy:['inn','stable'], favored:['mounts','timber'] },
    land:       { label:'Land parcel', price:240, cost:0, min:0, max:0, risk:'Undeveloped', synergy:[], favored:[] }
  });
  const NORTHFORD = Object.freeze([
    { id:'estate:inn', name:'The Mooncup Inn', zone:'inn', type:'inn', x:502, y:278 },
    { id:'estate:apothecary', name:'Greenbottle Apothecary', zone:'apothecary', type:'apothecary', x:694, y:247 },
    { id:'estate:smithy', name:'Ember & Anvil', zone:'smithy', type:'smithy', x:1195, y:290 },
    { id:'estate:bellkeeper', name:'Bellkeeper’s House', zone:'bellkeeper', type:'home', x:1329, y:579 },
    { id:'estate:stable', name:'Windstrider Stable', zone:'stable', type:'stable', x:1435, y:622 },
    { id:'estate:market', name:'Pella’s Provisioners', zone:'northford', type:'market', x:1160, y:434 }
  ]);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const rank = value => Math.trunc(clamp(value, 0, 3));
  const money = value => Math.round(Number(value) || 0);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);
  const pretty = value => String(value || '').replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, c => c.toUpperCase());

  function hash(text) {
    let value = 2166136261;
    const string = String(text);
    for (let i = 0; i < string.length; i++) { value ^= string.charCodeAt(i); value = Math.imul(value, 16777619); }
    return value >>> 0;
  }

  function definition(input, danger = 1) {
    const type = BUSINESS[input.type] ? input.type : 'home';
    const config = BUSINESS[type];
    const scale = 1 + Math.max(0, danger - 1) * 0.18;
    const price = money((input.purchasePrice || config.price) * scale);
    const cost = money((input.operatingCost ?? config.cost) * (1 + Math.max(0, danger - 1) * 0.11));
    return Object.freeze({
      id:input.id, name:input.name, zone:input.zone, settlementId:input.settlementId || input.zone,
      regionId:input.regionId || 'northford', regionName:input.regionName || 'Northford', type,
      purchasePrice:price, value:price, operatingCost:cost,
      revenueMin:money((input.revenueMin ?? config.min) * scale), revenueMax:money((input.revenueMax ?? config.max) * scale),
      level:0, upgrades:Object.freeze({quality:0,capacity:0,security:0}), risk:config.risk,
      synergies:Object.freeze([...config.synergy]), regionalEconomy:input.regionalEconomy || 'commerce',
      source:input.source || 'building', x:input.x, y:input.y,
      choices:type === 'land' ? LAND_CHOICES : undefined
    });
  }

  function catalog(atlas, EX) {
    const definitions = [];
    for (const building of NORTHFORD) definitions.push(definition({...building, settlementId:'northford', source:'northford-building'}));
    definitions.push(definition({id:'land:northford',name:'Lantern Road Parcel',zone:'northford',settlementId:'northford',type:'land',source:'land',x:1500,y:195}));
    for (const area of atlas?.areas || []) {
      if (area.propertyAvailable) definitions.push(definition({
        id:area.id, name:`${area.name} ${pretty(area.propertyType)}`, zone:area.id, settlementId:area.id,
        regionId:area.regionId, regionName:area.regionName, type:area.propertyType, regionalEconomy:area.economy,
        source:'atlas-deed', x:1060, y:470
      }, area.danger));
      if (area.kind === 'settlement') {
        const homes = typeof EX?.homes === 'function' ? EX.homes(area) : [];
        for (const home of homes) {
          const type = home.role === 'merchant' ? 'market' : home.role === 'rest' ? 'inn' : 'home';
          definitions.push(definition({
            id:home.id, name:home.name, zone:home.id, settlementId:area.id, regionId:area.regionId,
            regionName:area.regionName, type, regionalEconomy:area.economy, source:'settlement-home', x:home.x, y:home.y
          }, area.danger));
        }
        definitions.push(definition({
          id:`land:${area.id}`, name:`${area.name} Development Parcel`, zone:area.id, settlementId:area.id,
          regionId:area.regionId, regionName:area.regionName, type:'land', regionalEconomy:area.economy,
          source:'land', x:1560, y:580
        }, area.danger));
      }
    }
    const unique = new Map();
    for (const item of definitions) if (!unique.has(item.id)) unique.set(item.id, item);
    return Object.freeze([...unique.values()]);
  }

  const mapOf = defs => defs instanceof Map ? defs : new Map((defs || []).map(def => [def.id, def]));
  const ownedType = property => property?.businessType || property?.type;
  const isOperating = property => property && !(property.type === 'land' && !property.businessType);

  function unlocked(state, def) {
    if (!def) return false;
    if (state?.properties?.[def.id]) return true;
    if (def.regionId === 'northford' || def.settlementId === 'northford') return true;
    const discovered = Array.isArray(state?.atlasDiscovered) ? state.atlasDiscovered : [];
    if (discovered.includes(def.settlementId) || discovered.includes(def.zone)) return true;
    if (state?.zone === def.settlementId || state?.zone === def.zone) return true;
    if (String(state?.zone || '').startsWith('home@')) return String(state.zone).split('@')[1] === def.settlementId;
    return false;
  }

  function normalizedProperty(id, raw, def) {
    const old = raw && typeof raw === 'object' ? raw : {};
    const fallbackType = BUSINESS[old.type] ? old.type : def?.type || 'home';
    const upgrades = old.upgrades || {};
    const legacyLevel = rank(old.level);
    return {
      ...(def || {}), ...old, id, type:fallbackType,
      purchasePrice:money(old.purchasePrice || def?.purchasePrice || 350),
      value:money(old.value || old.purchasePrice || def?.value || 350),
      operatingCost:money(old.operatingCost ?? def?.operatingCost ?? 8),
      revenueMin:money(old.revenueMin ?? def?.revenueMin ?? 24),
      revenueMax:money(old.revenueMax ?? def?.revenueMax ?? 52),
      level:Math.max(legacyLevel, rank(old.level)),
      upgrades:{ quality:Math.max(rank(upgrades.quality), legacyLevel), capacity:rank(upgrades.capacity), security:rank(upgrades.security) },
      lastProfit:money(old.lastProfit), lastRevenue:money(old.lastRevenue), lastCost:money(old.lastCost),
      total:money(old.total), daysOperated:Math.max(0, Math.trunc(Number(old.daysOperated) || 0)), invested:money(old.invested || old.purchasePrice || def?.purchasePrice || 350)
    };
  }

  function migrate(state, defs) {
    if (!state || typeof state !== 'object') return {ok:false,message:'No journey state was provided.'};
    const byId = mapOf(defs);
    const source = state.properties && typeof state.properties === 'object' ? state.properties : {};
    const aliases = {smithy:'estate:smithy',inn:'estate:inn',apothecary:'estate:apothecary',stable:'estate:stable',bellkeeper:'estate:bellkeeper',market:'estate:market'};
    const moved = {...source};
    for (const [legacyId, targetId] of Object.entries(aliases)) {
      if (moved[legacyId] && !moved[targetId]) {
        moved[targetId] = {...moved[legacyId], legacyId};
        delete moved[legacyId];
      }
    }
    const normalized = {};
    for (const [id, property] of Object.entries(moved)) normalized[id] = normalizedProperty(id, property, byId.get(id));
    state.properties = normalized;
    state.treasury = money(state.treasury);
    state.profitHistory = Array.isArray(state.profitHistory) ? state.profitHistory.slice(-14) : [];
    if (!Number.isFinite(Number(state.lastEconomyDay))) state.lastEconomyDay = Math.max(0, Math.trunc(Number(state.day) || 0));
    return {ok:true,message:`${Object.keys(normalized).length} owned properties ready.`,properties:normalized};
  }

  function buy(state, id, defs) {
    const def = mapOf(defs).get(id);
    if (!def) return {ok:false,message:'That deed is not in the property register.'};
    if (!unlocked(state, def)) return {ok:false,message:'Discover this settlement before buying here.'};
    if (state?.properties?.[id]) return {ok:false,message:`${def.name} is already in your portfolio.`};
    const gold = money(state?.gold);
    if (gold < def.purchasePrice) return {ok:false,message:`Need ${def.purchasePrice - gold} more gold.`};
    const property = normalizedProperty(id, {...def,invested:def.purchasePrice}, def);
    state.properties = {...(state.properties || {}), [id]:property};
    state.gold = gold - def.purchasePrice;
    return {ok:true,message:`Purchased ${def.name}. ${def.type==='land'?'Choose a development to begin earning income.':'Income begins on the next adventure day.'}`,property,cost:def.purchasePrice};
  }

  function developmentCost(property, type) {
    const config = BUSINESS[type];
    if (!config || !LAND_CHOICES.includes(type)) return null;
    return money(config.price * 0.72 + (property.purchasePrice || 240) * 0.22);
  }

  function develop(state, id, type, defs) {
    const current = state?.properties?.[id];
    const def = mapOf(defs).get(id);
    if (!current || current.type !== 'land') return {ok:false,message:'Purchase the land parcel before developing it.'};
    if (current.businessType) return {ok:false,message:`This parcel is already developed as ${pretty(current.businessType)}.`};
    const cost = developmentCost(current, type);
    if (cost == null) return {ok:false,message:'That development is not available for this parcel.'};
    const gold = money(state.gold);
    if (gold < cost) return {ok:false,message:`Need ${cost - gold} more gold to build ${pretty(type)}.`};
    const config = BUSINESS[type];
    const property = {...current, businessType:type, name:`${def?.regionName || 'Vale'} ${config.label}`, operatingCost:config.cost,
      revenueMin:config.min, revenueMax:config.max, risk:config.risk, synergies:[...config.synergy], invested:money((current.invested || current.purchasePrice) + cost), value:money(current.value + cost * .82)};
    state.gold = gold - cost;
    state.properties = {...state.properties,[id]:property};
    return {ok:true,message:`Development complete: ${property.name}.`,property,cost};
  }

  function upgradeCost(property, track) {
    if (!TRACKS.includes(track) || !property) return null;
    const current = rank(property.upgrades?.[track]);
    if (current >= 3) return null;
    const total = TRACKS.reduce((sum, key) => sum + rank(property.upgrades?.[key]), 0);
    const factor = track === 'capacity' ? 1.08 : track === 'security' ? .92 : 1;
    return money((property.purchasePrice || 350) * (0.18 + total * 0.055) * (1 + current * .48) * factor);
  }

  function upgrade(state, id, track) {
    const current = state?.properties?.[id];
    if (!current) return {ok:false,message:'Purchase this property before upgrading it.'};
    if (!isOperating(current)) return {ok:false,message:'Develop this land before adding business upgrades.'};
    if (!TRACKS.includes(track)) return {ok:false,message:'Unknown property upgrade track.'};
    const cost = upgradeCost(current, track);
    if (cost == null) return {ok:false,message:`${pretty(track)} is already rank 3.`};
    const gold = money(state.gold);
    if (gold < cost) return {ok:false,message:`Need ${cost - gold} more gold for ${pretty(track)}.`};
    const upgrades = {...current.upgrades,[track]:rank(current.upgrades?.[track]) + 1};
    const property = {...current,upgrades,level:TRACKS.reduce((sum,key)=>sum+rank(upgrades[key]),0),invested:money((current.invested||current.purchasePrice)+cost),value:money(current.value+cost*.78)};
    state.gold = gold - cost;
    state.properties = {...state.properties,[id]:property};
    return {ok:true,message:`${property.name}: ${pretty(track)} raised to rank ${upgrades[track]}.`,property,cost};
  }

  function activeEventModifier(state, def, seed) {
    const events = Object.values(state.activeEvents || {}).filter(event => event && event.status && (event.areaId === def?.zone || event.areaId === def?.settlementId || event.regionId === def?.regionId));
    if (!events.length) return {multiplier:1,label:''};
    const event = events[0];
    if (event.status === 'complete') return {multiplier:1.08,label:'Safer trade routes'};
    if (event.status !== 'active') return {multiplier:.97,label:'Recent disruption'};
    return seed % 2 ? {multiplier:1.14,label:'Crisis demand'} : {multiplier:.9,label:'Trade disruption'};
  }

  function settleDay(state, defs) {
    if (!state || !Number.isFinite(Number(state.day))) return {ok:false,message:'Adventure day is invalid.'};
    const day = Math.trunc(Number(state.day));
    if (day <= Math.trunc(Number(state.lastEconomyDay) || 0)) return {ok:false,message:`Day ${day} income was already settled.`,day};
    const byId = mapOf(defs);
    const owned = Object.entries(state.properties || {});
    const typeCounts = {};
    for (const [,property] of owned) if (isOperating(property)) typeCounts[ownedType(property)] = (typeCounts[ownedType(property)] || 0) + 1;
    const calculations = [];
    for (const [id, property] of owned) {
      const def = byId.get(id) || property;
      if (!isOperating(property)) { calculations.push({id,revenue:0,cost:0,profit:0,event:'Undeveloped land'}); continue; }
      const type = ownedType(property), config = BUSINESS[type] || BUSINESS.home, upgrades = property.upgrades || {};
      const seed = hash(`${day}:${id}:everlight-economy`), unit = (seed % 10001) / 10000;
      const base = (property.revenueMin || config.min) + ((property.revenueMax || config.max) - (property.revenueMin || config.min)) * unit;
      const quality = 1 + rank(upgrades.quality) * .1, capacity = 1 + rank(upgrades.capacity) * .14;
      const synergyCount = config.synergy.filter(key => typeCounts[key]).length;
      const synergy = 1 + Math.min(.09, synergyCount * .03);
      const regional = config.favored.includes(def.regionalEconomy) ? 1.08 : 1;
      const faction = state.faction === 'gilded' ? 1.04 : 1;
      const eventMod = activeEventModifier(state, def, seed >>> 5);
      const security = rank(upgrades.security), incidentRoll = (seed >>> 12) % 100;
      let incidentMultiplier = 1, incidentCost = 0, incident = eventMod.label;
      const badThreshold = Math.max(4, 14 - security * 3);
      if (incidentRoll < badThreshold) {
        incidentMultiplier = .62 + security * .07;
        incidentCost = money((property.operatingCost || config.cost) * (1.3 - security * .2));
        incident = ['Spoiled stock','Equipment repairs','Quiet market','Storm damage'][seed % 4];
      } else if (incidentRoll < 23) {
        incidentMultiplier = 1.22 + (seed % 9) / 100;
        incident = ['Festival rush','Rare commission','Caravan windfall','Perfect harvest'][seed % 4];
      }
      const revenue = Math.max(0, money(base * quality * capacity * synergy * regional * faction * eventMod.multiplier * incidentMultiplier));
      const cost = money((property.operatingCost || config.cost) * (1 + rank(upgrades.capacity) * .06 + rank(upgrades.quality) * .03) + incidentCost);
      calculations.push({id,revenue,cost,profit:revenue-cost,event:incident || 'Steady trade'});
    }
    const total = calculations.reduce((sum, row) => sum + row.profit, 0);
    const nextProperties = {...(state.properties || {})};
    for (const row of calculations) {
      const old = nextProperties[row.id];
      if (!old) continue;
      const floor = (old.purchasePrice || 350) * .65, ceiling = (old.invested || old.purchasePrice || 350) * 1.35;
      nextProperties[row.id] = {...old,lastRevenue:row.revenue,lastCost:row.cost,lastProfit:row.profit,lastEvent:row.event,total:money((old.total||0)+row.profit),daysOperated:(old.daysOperated||0)+(isOperating(old)?1:0),value:money(clamp((old.value||old.purchasePrice)+row.profit*.08,floor,ceiling))};
    }
    state.properties = nextProperties;
    state.treasury = money((state.treasury || 0) + total);
    state.lastEconomyDay = day;
    state.profitHistory = [...(Array.isArray(state.profitHistory) ? state.profitHistory : []),{day,profit:total,properties:calculations.length}].slice(-14);
    return {ok:true,message:`Day ${day} settled: ${total >= 0 ? '+' : ''}${total} gold to treasury.`,day,profit:total,results:calculations};
  }

  function perk(state, type) {
    if (!['smithy','apothecary','stable'].includes(type)) return 1;
    const matching = Object.values(state?.properties || {}).filter(property => isOperating(property) && ownedType(property) === type);
    if (!matching.length) return 1;
    const bestQuality = Math.max(...matching.map(property => rank(property.upgrades?.quality)));
    return Math.max(.8, .9 - bestQuality * .02);
  }

  function summary(state) {
    const properties = Object.values(state.properties || {}), history = Array.isArray(state.profitHistory) ? state.profitHistory : [];
    const value = properties.reduce((sum, property) => sum + money(property.value || property.purchasePrice), 0);
    const last = history.at(-1)?.profit || 0;
    const average = history.length ? money(history.reduce((sum,row)=>sum+(row.profit||0),0)/history.length) : 0;
    return {count:properties.length,value,last,average,treasury:money(state.treasury),history};
  }

  function propertyCard(state, def, owned, selected) {
    const property = owned || def, type = ownedType(property), isLand = property.type === 'land' && !property.businessType;
    const profit = owned ? `${property.lastProfit >= 0 ? '+' : ''}${property.lastProfit || 0}g` : `${def.revenueMin}–${def.revenueMax}g`;
    return `<button class="econ26-card${selected ? ' is-selected' : ''}${owned ? ' is-owned' : ''}" data-estate-select="${esc(def.id)}"><span class="econ26-icon">${isLand?'◇':type==='smithy'?'⚒':type==='stable'?'♞':type==='apothecary'?'✤':type==='inn'?'☾':'⌂'}</span><span><small>${owned ? 'Owned' : esc(def.regionName)} · ${esc(isLand?'Land':pretty(type))}</small><strong>${esc(property.name)}</strong><em>${owned ? `Yesterday ${profit}` : `Forecast ${profit} before costs`}</em></span><b>${owned ? '›' : `${def.purchasePrice}g`}</b></button>`;
  }

  function detail(state, def, property) {
    if (!def) return `<div class="econ26-empty"><span>⌂</span><strong>Select a property</strong><p>Compare a deed’s forecast, risk, costs, perks, and upgrade path before spending.</p></div>`;
    const owned = !!property, type = ownedType(property || def), config = BUSINESS[type] || BUSINESS.land;
    const land = (property || def).type === 'land', undeveloped = land && !property?.businessType;
    const canBuy = money(state.gold) >= def.purchasePrice, short = Math.max(0, def.purchasePrice-money(state.gold));
    const upgrades = property?.upgrades || {quality:0,capacity:0,security:0};
    const track = Number.isFinite(def.x) && Number.isFinite(def.y) && def.settlementId ? `<button class="econ26-track" data-estate-track="${esc(def.id)}">Track entrance</button>` : '';
    const purchase = !owned ? `<button data-estate-buy="${esc(def.id)}" ${canBuy?'':'disabled'}>${canBuy?`Purchase deed · ${def.purchasePrice}g`:`Need ${short} more gold`}</button>` : '';
    const choices = owned && undeveloped ? `<div class="econ26-section"><h4>Choose a development</h4><div class="econ26-choice-grid">${LAND_CHOICES.map(choice=>{const business=BUSINESS[choice],cost=developmentCost(property,choice),short=Math.max(0,cost-money(state.gold));return `<button data-estate-develop="${esc(def.id)}" data-business="${choice}" ${short?'disabled':''}><strong>${esc(business.label)} <em>${cost}g</em></strong><span>${business.min}–${business.max}g revenue · ${business.cost}g cost</span><small>${short?`Need ${short}g · `:''}${business.risk} risk · Synergy: ${business.synergy.slice(0,2).map(pretty).join(' + ')}</small></button>`}).join('')}</div></div>` : '';
    const effects = {quality:'Revenue +10% · service discount +2%',capacity:'Revenue +14% · operating cost +6%',security:'Bad-day chance −3% · smaller incident costs'};
    const upgradeButtons = owned && !undeveloped ? `<div class="econ26-section"><h4>Property upgrades</h4><div class="econ26-upgrades">${TRACKS.map(track=>{const cost=upgradeCost(property,track),level=rank(upgrades[track]);return `<button data-estate-upgrade="${esc(def.id)}" data-track="${track}" ${cost!=null&&money(state.gold)>=cost?'':'disabled'}><span>${pretty(track)} <b>${'◆'.repeat(level)}${'◇'.repeat(3-level)}</b></span><em>${effects[track]}</em><small>${cost==null?'Max rank':money(state.gold)>=cost?`${cost}g`: `Need ${cost-money(state.gold)}g`}</small></button>`}).join('')}</div></div>` : '';
    return `<article class="econ26-detail-card"><button class="econ26-back" data-estate-select="">‹ Back to properties</button><header><div><small>${esc(def.regionName)} · ${esc(undeveloped?'Land parcel':pretty(type))}</small><h3>${esc(property?.name || def.name)}</h3></div><span class="econ26-risk risk-${String(config.risk).toLowerCase()}">${esc(config.risk)} risk</span></header><p>${undeveloped?'Choose what to build. Development creates income and a useful local service.':`${config.label} revenue varies each adventure day with demand, events, operating costs, and upgrades.`}</p><div class="econ26-forecast"><div><small>Revenue range</small><strong>${property?.revenueMin ?? def.revenueMin}–${property?.revenueMax ?? def.revenueMax}g</strong></div><div><small>Operating cost</small><strong>${property?.operatingCost ?? def.operatingCost}g</strong></div><div><small>Current value</small><strong>${property?.value ?? def.value}g</strong></div><div><small>Yesterday</small><strong>${owned?`${property.lastProfit>=0?'+':''}${property.lastProfit||0}g`:'—'}</strong></div></div>${owned&&property.lastEvent?`<div class="econ26-event">Last report · ${esc(property.lastEvent)}</div>`:''}${track}${purchase}${choices}${upgradeButtons}</article>`;
  }

  function render(state = {}, defs = [], options = {}) {
    const supplied = [...defs], suppliedIds = new Set(supplied.map(def=>def.id));
    const legacy = Object.entries(state.properties || {}).filter(([id])=>!suppliedIds.has(id)).map(([id,property])=>definition({
      ...property,id,name:property.name || pretty(id),zone:property.zone || id,settlementId:property.settlementId || property.zone || id,
      regionId:property.regionId || 'legacy',regionName:property.regionName || 'Legacy holdings',type:BUSINESS[property.type]?property.type:'home',source:'legacy-owned'
    }));
    const all = [...supplied,...legacy], byId = mapOf(all), view = options.view === 'market' ? 'market' : 'portfolio';
    const sum = summary(state), owned = state.properties || {};
    const availableRegions = new Map([['all','All regions'],['northford','Northford']]);
    for (const def of all) if (unlocked(state,def)) availableRegions.set(def.regionId,def.regionName);
    const region = availableRegions.has(options.region) ? options.region : 'all';
    const list = view === 'portfolio' ? all.filter(def=>owned[def.id]) : all.filter(def=>!owned[def.id]&&unlocked(state,def));
    const filtered = region === 'all' ? list : list.filter(def=>def.regionId===region || def.settlementId===region);
    const selected = options.selectedId ? byId.get(options.selectedId) : null, selectedProperty = selected ? owned[selected.id] : null;
    const historyBars = sum.history.length ? sum.history.map(row=>`<i class="${row.profit<0?'loss':''}" style="--v:${Math.min(100,Math.abs(row.profit)/Math.max(1,...sum.history.map(x=>Math.abs(x.profit||0)))*100)}%" title="Day ${row.day}: ${row.profit}g"></i>`).join('') : '';
    return `<section class="econ26${selected?' has-selection':''}" aria-label="Property economy"><header class="econ26-header"><div><small>Vale holdings</small><h2>Property Ledger</h2></div><div class="econ26-purse"><strong>✦ ${money(state.gold)}g</strong><span>${sum.treasury}g treasury</span></div></header><div class="econ26-feedback" role="status" aria-live="polite">${esc(options.message||'')}</div><section class="econ26-summary"><div><small>Portfolio value</small><strong>${sum.value}g</strong><span>${sum.count} properties</span></div><div><small>Yesterday</small><strong class="${sum.last<0?'loss':''}">${sum.last>=0?'+':''}${sum.last}g</strong><span>Automatic treasury deposit</span></div><div><small>14-day average</small><strong>${sum.average>=0?'+':''}${sum.average}g</strong><span>Variable, never real-time</span></div><div class="econ26-history"><span>${historyBars||'<em>No settled days yet</em>'}</span></div></section><nav class="econ26-view"><button data-estate-view="portfolio" class="${view==='portfolio'?'active':''}">My portfolio</button><button data-estate-view="market" class="${view==='market'?'active':''}">Property market</button><button data-economy="collect" ${sum.treasury>0?'':'disabled'}>Transfer treasury</button><button data-economy="day">Advance day</button></nav><div class="econ26-workspace"><section class="econ26-list"><nav class="econ26-regions">${[...availableRegions].map(([id,name])=>`<button data-estate-region="${esc(id)}" class="${region===id?'active':''}">${esc(name)}</button>`).join('')}</nav><p class="econ26-note">${view==='market'?'Only discovered settlements are listed. The Guildhall is civic property and the Old Lantern Cistern is protected—not for sale.':'Profit settles after five minutes of active adventuring, resting, or Advance day. Treasury is spendable savings; property value is invested wealth.'}</p><div class="econ26-cards">${filtered.length?filtered.map(def=>propertyCard(state,def,owned[def.id],selected?.id===def.id)).join(''):`<div class="econ26-empty"><strong>${view==='market'?'No deeds available here':'Your portfolio is empty'}</strong><p>${view==='market'?'Explore another settlement to reveal its market.':'Open the property market to buy your first business or land parcel.'}</p></div>`}</div></section><aside class="econ26-detail">${detail(state,selected,selectedProperty)}</aside></div></section>`;
  }

  window.EVERLIGHT_ECONOMY = Object.freeze({
    version:26, tracks:TRACKS, landChoices:LAND_CHOICES,
    catalog, unlocked, migrate, buy, develop, upgrade, upgradeCost, settleDay, perk, render
  });
})();
