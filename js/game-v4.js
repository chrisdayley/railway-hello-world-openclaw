(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const VIEW_H = 540;
  const SAVE_KEY = 'everlight-save-v6';
  const LEGACY_SAVE_KEY = 'everlight-save-v5';
  const BUILD = '26';
  const EX = window.EVERLIGHT_EXPLORATION;
  const ATLAS = window.EVERLIGHT_ATLAS || null;
  const ECON = window.EVERLIGHT_ECONOMY;
  const ESTATES = ECON.catalog(ATLAS,EX);
  window.__EVERLIGHT_BUILD__ = BUILD;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const random = (a, b) => a + Math.random() * (b - a);
  const choose = list => list[Math.floor(Math.random() * list.length)];
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const show = (node, yes = true) => node?.classList.toggle('is-hidden', !yes);

  const el = Object.fromEntries([
    'loading','titleScreen','pathScreen','gameScreen','continueBtn','newGameBtn','hpBar','manaBar','stamBar',
    'hpProgress','manaProgress','stamProgress','hpText','manaText','levelText','goldText','objectiveBtn',
    'objectiveTitle','objectiveText','bossHud','bossBar','tutorial','toast','subtitle','joystick','joyKnob',
    'attackBtn','spellBtn','dodgeBtn','interactBtn','attackCooldown','spellCooldown','dodgeCooldown',
    'fullscreenBtn','pauseBtn','runBtn','mapBtn','destinationHint','dialogue','speakerPortrait','speakerName','dialogueText','dialogueChoices',
    'dialogueNext','journal','journalBody','closeJournal','chapterComplete','chapterSummary','keepExploringBtn',
    'interactionPanel','interactionTitle','interactionBody','closeInteraction','lootFeed','zoneBanner','srUpdates'
  ].map(id => [id, $(id)]));

  let VIEW_W = 960;
  function syncViewport() {
    const view = window.visualViewport;
    const width = Math.round(view?.width || window.innerWidth);
    const height = Math.round(view?.height || window.innerHeight);
    document.documentElement.style.setProperty('--app-width', `${width}px`);
    document.documentElement.style.setProperty('--app-height', `${height}px`);
    VIEW_W = clamp(Math.round(VIEW_H * width / Math.max(1, height)), 960, 1720);
    if (canvas.width !== VIEW_W) canvas.width = VIEW_W;
    if (canvas.height !== VIEW_H) canvas.height = VIEW_H;
  }
  syncViewport();
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);
  addEventListener('resize', syncViewport);
  addEventListener('orientationchange', () => setTimeout(syncViewport, 120));

  const RARITY = {
    Common: '#d7dfda', Uncommon: '#79dfa0', Rare: '#67b9ff', Epic: '#c783ff', Legendary: '#ffc861', Mythic: '#ff7ee8'
  };
  const ITEM_TEMPLATES = {
    roadworn_blade: { id: 'roadworn_blade', name: 'Roadworn Blade', type: 'Weapon', rarity: 'Common', power: 12, value: 18, description: 'A reliable blade scarred by old roads.' },
    briar_edge: { id: 'briar_edge', name: 'Briar Edge', type: 'Weapon', rarity: 'Uncommon', power: 18, value: 55, description: 'Thorns curl away from its sharpened moonsteel.' },
    moonfall_saber: { id: 'moonfall_saber', name: 'Moonfall Saber', type: 'Weapon', rarity: 'Rare', power: 26, value: 130, description: 'Its edge hums near broken Ways.' },
    leather_coat: { id: 'leather_coat', name: 'Greenwake Leathers', type: 'Armor', rarity: 'Common', armor: 4, value: 30, description: 'Light protection for travelers.' },
    warden_plate: { id: 'warden_plate', name: 'Hollowguard Plate', type: 'Armor', rarity: 'Epic', armor: 15, maxHp: 25, value: 420, description: 'Armor reforged from a fallen guardian.' },
    lantern_charm: { id: 'lantern_charm', name: 'Mira\'s Lantern Charm', type: 'Charm', rarity: 'Rare', spell: 0.2, value: 180, description: 'A warm light that strengthens aethercraft.' },
    tonic: { id: 'tonic', name: 'Restorative Tonic', type: 'Consumable', rarity: 'Common', heal: 55, value: 22, description: 'Restores 55 health.' },
    aether_draught: { id: 'aether_draught', name: 'Aether Draught', type: 'Consumable', rarity: 'Uncommon', mana: 45, value: 38, description: 'Restores 45 aether.' },
    echo_buckler: { id: 'echo_buckler', name: 'Echo Buckler', type: 'Charm', rarity: 'Legendary', armor: 7, dodge: 0.12, value: 720, description: 'A perfect dodge releases a protective echo.' },
    aether_lens: { id: 'aether_lens', name: 'Aether Lens', type: 'Quest', rarity: 'Legendary', value: 0, description: 'The first piece of a machine that can cross the upper sky.' }
  };
  Object.assign(ITEM_TEMPLATES, {
    wayfarer_bow: { id:'wayfarer_bow', name:'Wayfarer Bow', type:'Weapon', rarity:'Uncommon', power:21, value:88, description:'A recurved road bow strung with echo-silk.' },
    emberbrand: { id:'emberbrand', name:'Emberbrand', type:'Weapon', rarity:'Epic', power:39, value:410, description:'A frontier blade that burns without consuming.' },
    frostveil_mail: { id:'frostveil_mail', name:'Frostveil Mail', type:'Armor', rarity:'Rare', armor:12, maxHp:18, value:290, description:'Layered mail made for whiteout hunts.' },
    saltglass_idol: { id:'saltglass_idol', name:'Saltglass Idol', type:'Charm', rarity:'Epic', spell:.35, value:480, description:'A desert relic that bends aether around its bearer.' },
    starfall_relic: { id:'starfall_relic', name:'Starfall Reliquary', type:'Charm', rarity:'Mythic', spell:.55, armor:9, value:1250, description:'A fragment of the night that fell beyond the crownlands.' }
  });
  const SKILLS = [
    { id: 'keen_edge', tree: 'Vanguard', name: 'Keen Edge', cost: 1, requires: null, text: '+20% melee damage.' },
    { id: 'counter_light', tree: 'Vanguard', name: 'Counterlight', cost: 1, requires: 'keen_edge', text: 'Dodging during a telegraph empowers your next strike.' },
    { id: 'fleetstep', tree: 'Wayfinder', name: 'Fleetstep', cost: 1, requires: null, text: '+12% movement speed.' },
    { id: 'treasure_sense', tree: 'Wayfinder', name: 'Treasure Sense', cost: 1, requires: 'fleetstep', text: 'Loot beams remain visible from farther away.' },
    { id: 'aether_surge', tree: 'Lightweaver', name: 'Aether Surge', cost: 1, requires: null, text: '+25% spell damage.' },
    { id: 'chain_light', tree: 'Lightweaver', name: 'Chain Light', cost: 2, requires: 'aether_surge', text: 'Aether bolts arc to one nearby enemy.' }
  ];
  const FACTIONS = {
    ironbound: { name: 'Ironbound Wardens', color: '#e0b66a', description: 'Monster hunters who defend the old roads.', gift: 'Warden training: +8 armor.' },
    archive: { name: 'Veiled Archive', color: '#8edcf4', description: 'Relic seekers restoring the world\'s lost memory.', gift: 'Archive sight: better rare-loot chance.' },
    gilded: { name: 'Gilded Hand', color: '#f3cf62', description: 'Merchants and information brokers.', gift: 'Brokerage: shops cost 10% less.' },
    ashen: { name: 'Ashen Synod', color: '#ff8b70', description: 'Mages who study dangerous, useful power.', gift: 'Ember doctrine: +18 maximum aether.' }
  };
  const SHOP_STOCK = {
    smithy: ['briar_edge','leather_coat','moonfall_saber'],
    apothecary: ['tonic','tonic','aether_draught'],
    archive: ['lantern_charm','aether_draught'],
    road: ['tonic','aether_draught','wayfarer_bow','leather_coat']
  };

  const ZONES = {
    northford: { name: 'Northford', subtitle: 'Lantern Town', type: 'town', width: 1672, height: 941, spawn: { x: 965, y: 625 }, tint: '#15382f' },
    greenwake: { name: 'Greenwake Vale', subtitle: 'The South Road', type: 'wild', width: 2200, height: 1300, spawn: { x: 1080, y: 165 }, tint: '#173c2b' },
    moonfall: { name: 'Moonfall Ruins', subtitle: 'Where the Ways Broke', type: 'ruins', width: 1900, height: 1180, spawn: { x: 170, y: 620 }, tint: '#1d2d38' },
    smithy: { name: 'Ember & Anvil', subtitle: 'Smithy', type: 'interior', width: 1536, height: 920, spawn: { x: 768, y: 810 }, tint: '#3a2419' },
    apothecary: { name: 'Greenbottle Apothecary', subtitle: 'Herbs & Remedies', type: 'interior', width: 1536, height: 920, spawn: { x: 768, y: 820 }, tint: '#183b31' },
    inn: { name: 'The Mooncup', subtitle: 'Inn & Hearth', type: 'interior', width: 1536, height: 920, spawn: { x: 768, y: 825 }, tint: '#35291e' },
    guildhall: { name: 'Northford Guildhall', subtitle: 'Choose Who You Become', type: 'interior', width: 1536, height: 920, spawn: { x: 768, y: 835 }, tint: '#202d31' },
    stable: { name: 'Windstrider Stable', subtitle: 'Mounts & Tack', type: 'interior', width: 1536, height: 920, spawn: { x: 768, y: 235 }, tint: '#30351e' }
  };

  const INTERIOR_LAYOUTS = {
    smithy:{art:'smithy',solids:[[0,0,410,420],[420,0,560,215],[990,0,546,390],[0,600,530,320],[1080,570,456,350]]},
    apothecary:{art:'apothecary',solids:[[0,0,1536,215],[0,230,520,290],[535,220,505,240],[1260,230,276,690],[0,610,300,310],[390,600,555,250]]},
    inn:{art:'inn',solids:[[0,0,500,300],[980,0,556,300],[610,340,470,190],[430,540,560,185],[1130,360,406,390],[0,650,350,270],[1080,760,456,160]]},
    guildhall:{art:'guildhall',solids:[[0,0,1536,185],[0,185,380,250],[1156,185,380,250],[0,650,520,270],[1016,650,520,270]]},
    stable:{art:'stable',solids:[[0,0,520,650],[1000,0,536,650],[0,710,620,210],[1090,680,446,240]]}
  };

  function hashNumber(text) {
    let h = 2166136261;
    for (let i=0;i<String(text).length;i++) { h ^= String(text).charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const ATLAS_NAMES=['Alda','Bram','Cerys','Dain','Elowen','Faris','Greer','Hollis','Iria','Jory','Kest','Luma','Merek','Nessa','Oren','Pella','Quill','Rhea','Soren','Tamsin','Una','Vey','Wren','Yara'];
  function atlasNpcName(area,salt='resident'){return ATLAS_NAMES[hashNumber(`${area.id}:${salt}`)%ATLAS_NAMES.length];}
  function atlasArea(id = S?.zone) { return ATLAS?.get(id) || null; }
  function zoneById(id) {
    if(id?.startsWith('business@')){const estateId=id.slice(9),p=S.properties[estateId],def=ESTATES.find(d=>d.id===estateId);if(!p||!def||!p.businessType)return null;return {name:p.name,subtitle:'Your '+pretty(p.businessType),type:'room',theme:'home',width:960,height:720,spawn:{x:480,y:605},estateId,estateParent:def.zone};}
    if(EX?.roomDefs[id]) return EX.roomDefs[id];
    if(id?.startsWith('home@')) return EX.homeZone(id,ATLAS);
    if (ZONES[id]) return ZONES[id];
    const area = ATLAS?.get(id);
    if (!area) return null;
    return {
      name:area.name, subtitle:`${area.regionName} · ${pretty(area.kind)}`, type:'atlas',
      width:1800, height:1100, spawn:{x:260,y:550}, tint:area.palette[0], area
    };
  }

  const defaultSave = () => ({
    schema: 8, build: BUILD, style: null, zone: 'northford', x: 965, y: 625,
    hp: 100, maxHp: 100, mana: 60, maxMana: 60, stam: 100, maxStam: 100,
    gold: 140, xp: 0, level: 1, skillPoints: 1, day: 1, playTime: 0, lastPlayed: Date.now(),
    mainStep: 0, mainKills: 0, storyChoice: null, endingChoice: null, chapterComplete: false,
    faction: null, factionRep: { ironbound: 0, archive: 0, gilded: 0, ashen: 0 },
    skills: [], mounts: [], activeMount: null, vehicles: { skiff: false, airshipParts: 0, airship: false },
    inventory: [{ ...ITEM_TEMPLATES.roadworn_blade, uid: 'starter-weapon' }, { ...ITEM_TEMPLATES.tonic, uid: 'starter-tonic-1' }, { ...ITEM_TEMPLATES.tonic, uid: 'starter-tonic-2' }],
    equipment: { Weapon: 'starter-weapon', Armor: null, Charm: null }, materials: { moonleaf: 0, briarFiber: 0, wardenAlloy: 0 },
    sideQuests: { apothecary: 'available', stable: 'available', lostScout: 'available', innRumor:'available', smithyLedger:'available', drownedBell:'available' }, sideProgress: { briars: 0 },
    discoveries: ['Northford'], atlasDiscovered: [], opened: [], properties: {}, treasury: 0, defeated: 0,
    dynamicQuests: {}, areaKills: {}, profitHistory: [], attunedWaystones: [], activeEvents: {},
    settings: { sound: true, haptics: true, reducedMotion: false, highContrast: false, leftHanded: false, assistMode: false }
  });

  function normalizeItem(item, i = 0) {
    item={...item,rank:clamp(Math.floor(Number(item?.rank)||0),0,5)};
    const template = ITEM_TEMPLATES[item?.id] || null;
    if (template) return { ...template, ...item, uid: item.uid || uid(`item${i}`) };
    if (item?.name === 'Roadworn Blade') return { ...ITEM_TEMPLATES.roadworn_blade, ...item, uid: item.uid || 'starter-weapon' };
    return { id: item?.id || `legacy_${i}`, name: item?.name || 'Unknown Relic', type: item?.type || 'Charm', rarity: item?.rarity || 'Common', value: item?.value || 5, ...item, uid: item?.uid || uid(`legacy${i}`) };
  }
  function migrateSave(raw) {
    const base = defaultSave();
    if (!raw) return base;
    const oldQuestMap = [0, 2, 3, 6, 8];
    const merged = { ...base, ...raw, schema: 8, build: BUILD };
    merged.settings = { ...base.settings, ...(raw.settings || {}) };
    merged.inventory = (raw.inventory?.length ? raw.inventory : base.inventory).map(normalizeItem);
    if (!raw.schema) {
      merged.zone = 'northford'; merged.x = 940; merged.y = 760;
      merged.mainStep = oldQuestMap[raw.quest] ?? 0;
      merged.gold = Math.max(140, raw.gold || 0);
    }
    merged.equipment = { ...base.equipment, ...(raw.equipment || {}) };
    for(const type of ['Weapon','Armor','Charm'])if(merged.equipment[type]!==null&&!merged.inventory.some(i=>i.uid===merged.equipment[type]&&i.type===type))merged.equipment[type]=type==='Weapon'?merged.inventory.find(i=>i.type===type)?.uid||null:null;
    merged.factionRep = { ...base.factionRep, ...(raw.factionRep || {}) };
    merged.materials = { ...base.materials, ...(raw.materials || {}) };
    merged.sideQuests = { ...base.sideQuests, ...(raw.sideQuests || {}) };
    merged.sideProgress = { ...base.sideProgress, ...(raw.sideProgress || {}) };
    merged.vehicles = { ...base.vehicles, ...(raw.vehicles || {}) };
    merged.properties = { ...base.properties, ...(raw.properties || {}) };
    merged.atlasDiscovered = [...new Set(raw.atlasDiscovered || [])];
    merged.dynamicQuests = { ...base.dynamicQuests, ...(raw.dynamicQuests || {}) };
    merged.areaKills = { ...base.areaKills, ...(raw.areaKills || {}) };
    merged.profitHistory = Array.isArray(raw.profitHistory) ? raw.profitHistory.slice(-14) : [];
    merged.attunedWaystones = [...new Set(raw.attunedWaystones || [])];
    merged.activeEvents = { ...base.activeEvents, ...(raw.activeEvents || {}) };
    if(Number(raw.build||0)<24&&merged.zone==='northford'){merged.x=965;merged.y=625;}
    ECON.migrate(merged,ESTATES);
    return merged;
  }
  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY));
      return migrateSave(raw);
    } catch (_) { return defaultSave(); }
  }
  let S = loadSave();
  function save() {
    S.lastPlayed = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (_) {}
  }

  const bg = new Image(); bg.src = `assets/northford-twilight.jpg?v=${BUILD}`;
  const hero = new Image(); hero.src = `assets/hero-player-v2.png?v=${BUILD}`;
  const miraArt = new Image(); miraArt.src = `assets/mira-scout.png?v=${BUILD}`;
  const wardenArt = new Image(); wardenArt.src = `assets/hollow-warden.png?v=${BUILD}`;
  const greenwakeBg = new Image(); greenwakeBg.src = `assets/greenwake-vale-v1.jpg?v=${BUILD}`;
  const moonfallBg = new Image(); moonfallBg.src = `assets/moonfall-ruins-v1.jpg?v=${BUILD}`;
  const interiorArt = {};
  for (const id of Object.keys(INTERIOR_LAYOUTS)) { const art=new Image();art.src=`assets/interior-${id}-v1.jpg?v=${BUILD}`;interiorArt[id]=art; }
  const imageReady = { bg: false, hero: false, mira: false, warden: false, greenwake: false, moonfall: false, interiors:{} };
  bg.onload = () => imageReady.bg = true;
  hero.onload = () => imageReady.hero = true;
  miraArt.onload = () => imageReady.mira = true;
  wardenArt.onload = () => imageReady.warden = true;
  greenwakeBg.onload = () => imageReady.greenwake = true;
  moonfallBg.onload = () => imageReady.moonfall = true;
  for (const [id,art] of Object.entries(interiorArt)) art.onload=()=>imageReady.interiors[id]=true;

  let running = false, paused = true, last = performance.now(), saveClock = 0;
  let input = { x: 0, y: 0 }, keys = new Set(), pointerId = null, lastFacing = { x: 0, y: -1 };
  let attackCd = 0, spellCd = 0, dodgeCd = 0, invuln = 0, hurtFlash = 0, combo = 0, comboClock = 0, counterBuff = 0;
  let shake = 0, screenFlash = 0, toastTimer = 0, subtitleTimer = 0, zoneBannerTimer = 0, lootFeedTimer = 0, zoneGrace = 0;
  let enemies = [], loot = [], projectiles = [], particles = [], damageTexts = [], decor = [];
  let currentInteract = null, currentTab = 'quest', camera = { x: 0, y: 0 }, companion = { x: 0, y: 0, cooldown: .8 }, dialogueQueue = [], dialogueDone = null, dialogueChoiceHandler = null, restoreFocus = null;
  const gearView={filter:'All',selectedUid:null,message:''};
  const estateView={view:'portfolio',selectedId:null,region:'all',message:''};
  let audioCtx = null;
  let runEnabled=false, sprinting=false, sprintExhausted=false, doorCooldown=0, trackedDoor=null;

  function applySettings() {
    document.body.classList.toggle('reduced-motion', S.settings.reducedMotion);
    document.body.classList.toggle('high-contrast', S.settings.highContrast);
    document.body.classList.toggle('left-handed', S.settings.leftHanded);
  }
  function wakeAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function tone(freq = 440, dur = .06, type = 'sine', vol = .03, glide = 0) {
    if (!audioCtx || !S.settings.sound) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), now = audioCtx.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, now);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + glide), now + dur);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(.0001, now + dur);
    o.connect(g).connect(audioCtx.destination); o.start(now); o.stop(now + dur);
  }
  function haptic(pattern = 15) { if (S.settings.haptics && navigator.vibrate) navigator.vibrate(pattern); }
  function sfx(kind) {
    if (kind === 'sword') { tone(230,.07,'sawtooth',.04,170); tone(520,.04,'triangle',.025,-120); }
    if (kind === 'hit') { tone(110,.08,'square',.035,-45); haptic(22); }
    if (kind === 'spell') { tone(420,.16,'sine',.035,380); tone(680,.2,'triangle',.02,210); haptic([8,18,8]); }
    if (kind === 'hurt') { tone(90,.12,'sawtooth',.05,-30); haptic(45); }
    if (kind === 'loot') { tone(620,.07,'triangle',.025,150); }
    if (kind === 'success') { [420,560,720].forEach((f,i) => setTimeout(() => tone(f,.14,'triangle',.035,80), i * 80)); haptic([20,35,20]); }
    if (kind === 'select') tone(540,.05,'sine',.025,80);
  }
  function toast(text, seconds = 2.2) { el.toast.textContent = text; show(el.toast); toastTimer = seconds; }
  function subtitle(text, seconds = 2.8) { el.subtitle.textContent = text; show(el.subtitle); subtitleTimer = seconds; }
  function lootMessage(text, rarity = 'Common') {
    el.lootFeed.innerHTML = `<b style="color:${RARITY[rarity] || RARITY.Common}">${text}</b>`;
    show(el.lootFeed); lootFeedTimer = 2.6;
  }
  function announce(text) { el.srUpdates.textContent = text; }

  function startNew(path) {
    S = defaultSave(); S.style = path;
    if (path === 'vanguard') { S.maxHp = S.hp = 120; S.inventory[0].power = 15; }
    if (path === 'ranger') { S.crit = .18; }
    if (path === 'arcanist') { S.maxMana = S.mana = 90; }
    save(); applySettings(); beginGame(true);
  }
  function beginGame(fresh = false) {
    show(el.titleScreen, false); show(el.pathScreen, false); show(el.gameScreen, true);
    running = true; paused = false; last = performance.now(); enterZone(S.zone || 'northford', { x: S.x, y: S.y }, false); updateHUD();
    if (fresh) setTimeout(() => { subtitle('The stone beneath your feet whispers a name you have never heard.', 3.4); promptTutorial('Drag the left circle to move'); }, 420);
    else toast(`Welcome back to ${zone().name}`);
    requestAnimationFrame(loop);
  }

  function zone() { return zoneById(S.zone) || ZONES.northford; }
  function buildDecor() {
    const z = zone(), area = atlasArea(); decor = [];
    const count = area ? 42 : ['town','wild','ruins','interior','room'].includes(z.type) ? 0 : 18;
    const atlasDecor = {
      ruins:['pillar','crystal','rock'], verdant:['tree','flower','rock'], ancient_forest:['tree','tree','crystal'],
      swamp:['tree','rock','flower'], coast:['rock','flower','lamp'], islands:['rock','flower','crystal'],
      highland:['rock','tree','lamp'], alpine:['rock','tree','crystal'], frost:['rock','crystal','pillar'],
      desert:['rock','pillar','crystal'], royal:['lamp','pillar','flower'], astral:['crystal','pillar','flower']
    };
    for (let i = 0; i < count; i++) {
      const seed = (i * 92821 + hashNumber(S.zone) * 127) % 997;
      const x = 55 + (seed * 83 % Math.max(100, z.width - 110));
      const y = 70 + (seed * 151 % Math.max(100, z.height - 130));
      const kinds = area ? (atlasDecor[area.biome] || ['tree','rock','flower']) : null;
      decor.push({ x, y, kind: area ? kinds[(seed+i)%kinds.length] : z.type === 'wild' ? (i % 4 ? 'tree' : 'rock') : z.type === 'ruins' ? (i % 3 ? 'pillar' : 'crystal') : z.type === 'interior' ? (i % 3 ? 'table' : 'lamp') : (i % 4 ? 'lamp' : 'flower'), s: .75 + (seed % 40) / 100 });
    }
  }
  function enterZone(id, spawn = null, announceZone = true) {
    const target = zoneById(id); if (!target) return;
    S.zone = id; const p = spawn || target.spawn; S.x = clamp(p.x, 35, target.width - 35); S.y = clamp(p.y, 70, target.height - 35);
    doorCooldown=1.2;input.x=input.y=0;keys.clear();el.joyKnob.style.transform='';currentInteract=null;
    if(collides(S.x,S.y,13)){const safe=findWalkable(S.x,S.y);S.x=safe.x;S.y=safe.y;}
    canvas.setAttribute('aria-label', `${target.name} game world`);
    companion.x = S.x - 38; companion.y = S.y + 24; companion.cooldown = .7;
    enemies = []; loot = []; projectiles = []; particles = []; damageTexts = []; zoneGrace = 3.5; buildDecor(); spawnZoneEnemies();
    updateCamera(0,true);
    if (!S.discoveries.includes(target.name)) S.discoveries.push(target.name);
    if (target.area) {
      if (!S.atlasDiscovered.includes(id)) { S.atlasDiscovered.push(id); gainXp(8 + target.area.danger * 2); }
      ensureAreaEvent(target.area);
    }
    if (announceZone) { el.zoneBanner.innerHTML = `<strong>${target.name}</strong><span>${target.subtitle}</span>`; show(el.zoneBanner); zoneBannerTimer = 2.6; }
    if (id === 'greenwake' && S.mainStep === 1) { S.mainStep = 2; save(); subtitle('Corrupted echoes gather beyond the lantern road.', 3); }
    if (id === 'moonfall' && S.mainStep === 5) { S.mainStep = 6; save(); subtitle('The Hollow Warden rises between you and the Aether Lens.', 3); }
  }

  function makeEnemy(kind, x, y, index = 0) {
    const stats = {
      wisp: { hp: 44, r: 18, speed: 58, damage: 9, xp: 16, telegraph: .72, recover: .46 },
      briar: { hp: 72, r: 23, speed: 48, damage: 13, xp: 24, telegraph: .88, recover: .58 },
      construct: { hp: 110, r: 27, speed: 42, damage: 17, xp: 36, telegraph: 1.0, recover: .7 },
      warden: { hp: 480, r: 42, speed: 45, damage: 22, xp: 180, telegraph: 1.05, recover: .78 }
    }[kind];
    return { id: `${kind}-${index}-${Date.now()}`, kind, x, y, homeX: x, homeY: y, hp: stats.hp, maxHp: stats.hp, r: stats.r, speed: stats.speed, damage: stats.damage, xp: stats.xp, telegraphDuration: stats.telegraph, recoverDuration: stats.recover, state: 'idle', stateTimer: random(.1,.8), attackCd: random(.4,1.2), attackDir: { x: 0, y: 1 }, attackKind: kind === 'wisp' ? 'bolt' : kind === 'warden' ? 'slam' : 'melee', didHit: false, flash: 0, dead: false, phase: 1 };
  }
  function spawnZoneEnemies() {
    if(['cistern','sluice','vault'].includes(S.zone)){
      if(S.zone==='cistern')[[410,280],[725,425],[275,485]].forEach((p,i)=>enemies.push(makeEnemy('wisp',...p,i)));
      if(S.zone==='sluice')[[510,275],[645,545],[910,620]].forEach((p,i)=>enemies.push(makeEnemy('construct',...p,i)));
      if(S.zone==='vault'&&!S.opened.includes('drowned-keeper')){const boss=makeEnemy('warden',560,350,90);boss.hp=boss.maxHp=370;boss.damage=18;boss.xp=160;enemies.push(boss);}
      return;
    }
    if (S.zone === 'greenwake') {
      [[760,430,'wisp'],[1050,550,'wisp'],[1370,420,'wisp'],[550,850,'briar'],[960,930,'briar'],[1630,790,'briar'],[1840,480,'briar']].forEach((p,i) => enemies.push(makeEnemy(p[2],p[0],p[1],i)));
    }
    if (S.zone === 'moonfall') {
      [[420,420,'construct'],[730,760,'construct'],[1040,380,'construct'],[1320,720,'wisp']].forEach((p,i) => enemies.push(makeEnemy(p[2],p[0],p[1],i)));
      if (S.mainStep >= 6 && !S.opened.includes('hollow-warden')) enemies.push(makeEnemy('warden', 1570, 560, 9));
    }
    const area = atlasArea();
    if (area) {
      const count = area.kind === 'settlement' ? 0 : area.kind === 'dungeon' ? 9 : 5 + area.danger;
      for (let i=0;i<count;i++) {
        const seed = hashNumber(`${area.id}:enemy:${i}`);
        const kind = area.enemies[seed % area.enemies.length];
        const x = 180 + (seed % 1440), y = 250 + ((seed >>> 9) % 680);
        enemies.push(makeEnemy(kind,x,y,i));
      }
      if (area.hasElite && !S.opened.includes(`${area.id}:elite`)) {
        const elite = makeEnemy('warden', 900, 480, 99);
        elite.hp = elite.maxHp = 260 + area.danger * 70; elite.damage += area.danger * 2; elite.xp += area.danger * 20;
        enemies.push(elite);
      }
    }
  }

  function itemByUid(id) { return S.inventory.find(i => i.uid === id); }
  function equipped(type) { return window.EVERLIGHT_EQUIPMENT.effective(itemByUid(S.equipment[type])); }
  function hasSkill(id) { return S.skills.includes(id); }
  function combatStats() {
    return window.EVERLIGHT_EQUIPMENT.stats(S);
  }
  function gainXp(amount) {
    S.xp += amount;
    while (S.xp >= S.level * 80) {
      S.xp -= S.level * 80; S.level++; S.skillPoints++; S.maxHp += 8; S.hp = combatStats().maxHp; S.maxMana += 4; S.mana = S.maxMana;
      toast(`Level ${S.level} · Skill point earned`); sfx('success');
    }
  }
  function addItem(id, rarityOverride = null) {
    const template = ITEM_TEMPLATES[id]; if (!template) return null;
    const item = { ...template, rarity: rarityOverride || template.rarity, uid: uid(id) }; S.inventory.push(item); return item;
  }
  function playerDamage(amount, sourceX, sourceY) {
    if (invuln > 0 || paused) return;
    const reduced = Math.max(1, Math.round(amount * (100 / (100 + combatStats().armor * 6)) * (S.settings.assistMode ? .6 : 1)));
    S.hp = Math.max(0, S.hp - reduced); invuln = .78; hurtFlash = .24; shake = 8; sfx('hurt');
    const dx = S.x - sourceX, dy = S.y - sourceY, m = Math.hypot(dx,dy) || 1; moveActor(S, dx/m*24, dy/m*24, 13);
    floatText(S.x, S.y - 30, `-${reduced}`, '#ff9b8d');
    if (S.hp <= 0) defeatPlayer();
  }
  function defeatPlayer() {
    paused = true; subtitle('The Way pulls you back from the dark…', 2.2); screenFlash = .65;
    setTimeout(() => { S.hp=combatStats().maxHp; S.mana=S.maxMana; S.stam=S.maxStam; S.gold=Math.max(0,S.gold-12); enterZone('northford', ZONES.northford.spawn); paused=false; toast('Returned to Northford · −12 gold'); save(); }, 1500);
  }
  function hitEnemy(e, damage, dx, dy, magic = false, canKill = true) {
    if (e.dead) return; if(!canKill)damage=Math.min(damage,Math.max(0,e.hp-1));e.hp -= damage; e.flash = .13; moveActor(e,dx*8,dy*8,e.r*.65);
    spawnBurst(e.x,e.y,magic?'#79fff0':'#ffd77d',magic?10:7); floatText(e.x,e.y-e.r,`${Math.round(damage)}`,magic?'#8dfff0':'#ffe39a'); sfx('hit');
    if (e.hp <= 0) killEnemy(e);
  }
  function makeDrop(kind, x, y, data = {}) { loot.push({ id: uid('drop'), kind, x: x + random(-22,22), y: y + random(-14,18), vx: random(-45,45), vy: random(-85,-35), age: 0, collected: false, ...data }); }
  function dropLoot(e) {
    const boss = e.kind === 'warden'; const storyBoss = boss && S.zone==='moonfall'; const coins = boss ? 14 : e.kind === 'construct' ? 7 : 5;
    for (let i=0;i<coins;i++) makeDrop('gold', e.x, e.y, { amount: boss ? Math.ceil(random(5,10)) : Math.ceil(random(1,4)) });
    const material = e.kind === 'briar' ? 'briarFiber' : e.kind === 'warden' ? 'wardenAlloy' : Math.random() < .5 ? 'moonleaf' : null;
    if (material) for (let i=0;i<(boss?3:1);i++) makeDrop('material',e.x,e.y,{ material, amount: 1, rarity: boss?'Rare':'Uncommon' });
    const rareBonus = S.faction === 'archive' ? .1 : 0;
    if (storyBoss) { makeDrop('item',e.x,e.y,{ itemId:'warden_plate',rarity:'Epic' }); makeDrop('item',e.x,e.y,{ itemId:'aether_lens',rarity:'Legendary' }); }
    else if (boss) { const tier=atlasArea()?.treasureTier||'Epic';makeDrop('item',e.x,e.y,{itemId:choose(tier==='Mythic'?['starfall_relic','emberbrand']:['emberbrand','frostveil_mail','saltglass_idol']),rarity:tier}); }
    else if (Math.random() < .2 + rareBonus) makeDrop('item',e.x,e.y,{ itemId: choose(e.kind==='construct'?['moonfall_saber','lantern_charm','aether_draught']:['briar_edge','leather_coat','tonic']), rarity: null });
  }
  function killEnemy(e) {
    e.dead=true; spawnBurst(e.x,e.y,e.kind==='warden'?'#ffe08a':'#7efbe7',e.kind==='warden'?42:18); shake=e.kind==='warden'?14:5; dropLoot(e); gainXp(e.xp); S.defeated++;
    if (S.zone==='greenwake' && S.mainStep===2 && (e.kind==='wisp'||e.kind==='briar')) { S.mainKills++; if(S.mainKills>=3){S.mainStep=3;sfx('success');subtitle('The echo storm breaks. Mira will want to hear what you found.',3);save();} }
    if (e.kind==='briar' && S.sideQuests.stable==='active') { S.sideProgress.briars++; if(S.sideProgress.briars>=4){S.sideQuests.stable='ready';toast('Stable quest complete · Return to Rowan');} }
    if (e.kind==='warden' && S.zone==='moonfall') { if(!S.opened.includes('hollow-warden'))S.opened.push('hollow-warden'); S.mainStep=7; sfx('success'); subtitle('The Warden falls. Claim the Aether Lens from its hoard.',3); }
    if(e.kind==='warden'&&S.zone==='vault'){S.opened.push('drowned-keeper');S.sideQuests.drownedBell='ready';save();subtitle('The bell is free. Open the reliquary, then return to Ada.',4);}
    const area=atlasArea();
    if(area){
      S.areaKills[area.id]=(S.areaKills[area.id]||0)+1;
      for(const q of Object.values(S.dynamicQuests))if(q.status==='active'&&(q.targetAreaId||q.areaId)===area.id){q.progress=Math.min(q.target,q.progress+1);if(q.progress>=q.target){q.status='ready';toast('Contract complete · Return to the Wayfarer Board');}}
      if(e.kind==='warden'){const eliteId=`${area.id}:elite`;if(!S.opened.includes(eliteId))S.opened.push(eliteId);}
      const event=S.activeEvents[area.id];if(event?.status==='active'){event.progress++;if(event.progress>=event.target){event.status='complete';S.gold+=event.reward;gainXp(event.xp);toast(`${event.name} resolved · +${event.reward}g`);}}
      save();
    }
  }
  function collectDrop(d) {
    d.collected=true; sfx('loot');
    if(d.kind==='gold'){S.gold+=d.amount;lootMessage(`+${d.amount} gold`,'Common');}
    if(d.kind==='material'){S.materials[d.material]=(S.materials[d.material]||0)+d.amount;lootMessage(`+${d.amount} ${pretty(d.material)}`,d.rarity||'Uncommon');if(d.material==='moonleaf'&&S.sideQuests.apothecary==='active'&&S.materials.moonleaf>=3)S.sideQuests.apothecary='ready';}
    if(d.kind==='item'){const item=addItem(d.itemId,d.rarity);lootMessage(`${item.rarity} · ${item.name}`,item.rarity);announce(`${item.rarity} loot: ${item.name}`);if(item.id==='aether_lens'){S.mainStep=8;S.chapterComplete=true;S.vehicles.airshipParts=Math.max(1,S.vehicles.airshipParts);setTimeout(showChapterComplete,500);}}
    save();
  }

  function facing() { const m=Math.hypot(input.x,input.y); if(m>.15)lastFacing={x:input.x/m,y:input.y/m}; return lastFacing; }
  function aimDirection(range=110) {
    const target=enemies.filter(e=>!e.dead&&distance(e,S)<range).sort((a,b)=>distance(a,S)-distance(b,S))[0];
    if(!target)return facing();const dx=target.x-S.x,dy=target.y-S.y,m=Math.hypot(dx,dy)||1;lastFacing={x:dx/m,y:dy/m};return lastFacing;
  }
  function attack() {
    if(paused||attackCd>0)return;wakeAudio();dismissTutorial();combo=comboClock>0?combo%3+1:1;comboClock=.55;attackCd=combo===3?.42:.27;invuln=Math.max(invuln,.08);sfx('sword');
    if(equipped('Weapon')?.id==='wayfarer_bow'){const d=aimDirection(460);attackCd=.48;projectiles.push({kind:'player',arrow:true,x:S.x+d.x*24,y:S.y+d.y*16,vx:d.x*480,vy:d.y*480,r:5,life:1.25,damage:combatStats().power});return;}
    const d=aimDirection(112),range=combo===3?92:76;let dmg=combatStats().power*(combo===3?1.55:1)*(counterBuff>0?1.65:1)*(S.settings.assistMode?1.25:1);counterBuff=0;
    for(const e of enemies)if(!e.dead){const dx=e.x-S.x,dy=e.y-S.y,m=Math.hypot(dx,dy)||1,dot=(dx*d.x+dy*d.y)/m;if(m<range+e.r&&dot>.05){const crit=Math.random()<combatStats().crit;hitEnemy(e,dmg*(crit?1.7:1),dx/m,dy/m);if(crit)floatText(e.x,e.y-e.r-18,'CRITICAL','#fff2a6');}}
    particles.push({kind:'slash',x:S.x+d.x*24,y:S.y+d.y*18,angle:Math.atan2(d.y,d.x),life:.22,max:.22,color:combo===3?'#70f9e4':'#ffe29b',size:combo});
  }
  function castSpell(){
    if(paused||spellCd>0)return;wakeAudio();dismissTutorial();const cost=16;if(S.mana<cost){toast('Not enough aether');return;}S.mana-=cost;spellCd=1.05;sfx('spell');
    const d=aimDirection(360);projectiles.push({kind:'player',x:S.x+d.x*24,y:S.y+d.y*16,vx:d.x*360,vy:d.y*360,r:9,life:1.7,damage:Math.round(25*combatStats().spell),chain:hasSkill('chain_light')});
  }
  function dodge(){
    if(paused||dodgeCd>0||S.stam<24)return;wakeAudio();dismissTutorial();const threatened=enemies.some(e=>e.state==='windup'&&distance(e,S)<e.r+110);const d=facing();S.stam-=24;dodgeCd=.82;invuln=.5;moveActor(S,d.x*78,d.y*78,13);if(threatened&&hasSkill('counter_light')){counterBuff=4;toast('Counterlight ready');}haptic(12);tone(260,.1,'triangle',.02,130);
    for(let i=0;i<12;i++)particles.push({x:S.x-d.x*i*5,y:S.y-d.y*i*5,vx:random(-12,12),vy:random(-12,12),life:.4,max:.4,color:'#78e8d3',size:random(2,5)});
  }

  function solidRects(){return INTERIOR_LAYOUTS[S.zone]?.solids||EX?.roomSolids[S.zone]||(/^(home|business)@/.test(S.zone)?EX.roomSolids.bellkeeper:[]);}
  function collides(x,y,r){
    const z=zone();if(x-r<18||y-r<(z.type==='room'?155:40)||x+r>z.width-18||y+r>z.height-35)return true;
    if(solidRects().some(([rx,ry,rw,rh])=>x+r>rx&&x-r<rx+rw&&y+r>ry&&y-r<ry+rh))return true;
    if(S.zone==='northford'&&EX.townSolids.some(p=>EX.intersects(x,y,r,p)))return true;
    const development=landBuilding(S.zone);if(development&&x+r>development.x-94&&x-r<development.x+94&&y+r>development.y-175&&y-r<development.y-7)return true;
    return EX.homes(atlasArea()).some(b=>x+r>b.x-94&&x-r<b.x+94&&y+r>b.y-175&&y-r<b.y-7);
  }
  function findWalkable(x,y){for(let radius=0;radius<500;radius+=18)for(let a=0;a<Math.PI*2;a+=Math.PI/8){const p={x:x+Math.cos(a)*radius,y:y+Math.sin(a)*radius};if(!collides(p.x,p.y,13))return p;}return zone().spawn;}
  function moveActor(actor,dx,dy,r){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/9)),sx=dx/steps,sy=dy/steps;for(let i=0;i<steps;i++){if(!collides(actor.x+sx,actor.y,r))actor.x+=sx;if(!collides(actor.x,actor.y+sy,r))actor.y+=sy;}}
  function updatePlayer(dt){
    let ix=input.x+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);let iy=input.y+(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
    const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;}if(m>.1){lastFacing={x:ix/(Math.hypot(ix,iy)||1),y:iy/(Math.hypot(ix,iy)||1)};dismissTutorial();}
    const danger=enemies.some(e=>!e.dead&&distance(e,S)<300);if(S.stam<=8)sprintExhausted=true;if(!danger||S.stam>=35)sprintExhausted=false;sprinting=m>.1&&(runEnabled||keys.has('ShiftLeft')||keys.has('ShiftRight'))&&!sprintExhausted&&attackCd<=0;
    const pace=sprinting?1.7:1;moveActor(S,ix*150*combatStats().speed*pace*dt,iy*150*combatStats().speed*pace*dt,13);S.stam=clamp(S.stam+(sprinting&&danger?-18:28)*dt,0,S.maxStam);S.mana=Math.min(S.maxMana,S.mana+4.5*dt);
    doorCooldown=Math.max(0,doorCooldown-dt);
    if(m>.1&&doorCooldown<=0){const door=objectsForZone().find(o=>o.door&&distance(S,o)<29);if(door){usePortal(door);return;}}
    attackCd=Math.max(0,attackCd-dt);spellCd=Math.max(0,spellCd-dt);dodgeCd=Math.max(0,dodgeCd-dt);invuln=Math.max(0,invuln-dt);hurtFlash=Math.max(0,hurtFlash-dt);comboClock=Math.max(0,comboClock-dt);counterBuff=Math.max(0,counterBuff-dt);
  }
  function startEnemyWindup(e, dx, dy, d) {
    e.state='windup';e.stateTimer=e.telegraphDuration;e.attackDir={x:dx/d,y:dy/d};e.didHit=false;
    if(e.kind==='warden'&&e.hp<e.maxHp*.5)e.attackKind=Math.random()<.55?'radial':'slam';else e.attackKind=e.kind==='wisp'?'bolt':'melee';
  }
  function resolveEnemyAttack(e) {
    e.state='attack';e.stateTimer=e.attackKind==='melee'?.2:.28;e.didHit=false;shake=Math.max(shake,e.kind==='warden'?6:2);
    if(e.attackKind==='bolt')projectiles.push({kind:'enemy',x:e.x+e.attackDir.x*e.r,y:e.y+e.attackDir.y*e.r,vx:e.attackDir.x*230,vy:e.attackDir.y*230,r:8,life:2.2,damage:e.damage});
    if(e.attackKind==='radial')for(let i=0;i<10;i++){const a=i*Math.PI/5;projectiles.push({kind:'enemy',x:e.x,y:e.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170,r:8,life:2.4,damage:14});}
  }
  function updateEnemies(dt){
    for(const e of enemies){if(e.dead)continue;e.flash=Math.max(0,e.flash-dt);e.attackCd=Math.max(0,e.attackCd-dt);const dx=S.x-e.x,dy=S.y-e.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;if(zoneGrace>0){e.state='idle';continue;}
      if(e.state==='windup'){e.stateTimer-=dt;if(e.stateTimer<=0)resolveEnemyAttack(e);continue;}
      if(e.state==='attack'){
        e.stateTimer-=dt;const progress=1-clamp(e.stateTimer/(e.attackKind==='melee'?.2:.28),0,1);
        if(e.attackKind==='melee'||e.attackKind==='slam')moveActor(e,e.attackDir.x*e.speed*3.2*dt,e.attackDir.y*e.speed*3.2*dt,e.r*.7);
        if(!e.didHit&&(e.attackKind==='melee'||e.attackKind==='slam')&&distance(e,S)<e.r+28){playerDamage(e.damage,e.x,e.y);e.didHit=true;}
        if(e.stateTimer<=0){e.state='recover';e.stateTimer=e.recoverDuration;e.attackCd=random(.7,1.2);}continue;
      }
      if(e.state==='recover'){e.stateTimer-=dt;if(e.stateTimer<=0)e.state='chase';continue;}
      const reach=e.kind==='wisp'?150:e.r+38;if(d<reach&&e.attackCd<=0){startEnemyWindup(e,dx,dy,d);continue;}
      if(d<440){moveActor(e,nx*e.speed*dt,ny*e.speed*dt,e.r*.65);e.state='chase';}else e.state='idle';
      if(e.kind==='warden')e.phase=e.hp<e.maxHp*.5?2:1;
    }
  }
  function companionActive(){return !!S.storyChoice&&['greenwake','moonfall'].includes(S.zone);}
  function updateCompanion(dt){
    if(!companionActive())return;const follow={x:S.x-lastFacing.x*44-lastFacing.y*22,y:S.y-lastFacing.y*44+lastFacing.x*22};const dx=follow.x-companion.x,dy=follow.y-companion.y,d=Math.hypot(dx,dy)||1;if(d>18){companion.x+=dx/d*Math.min(d,150*dt);companion.y+=dy/d*Math.min(d,150*dt);}companion.cooldown-=dt;if(companion.cooldown<=0){const target=enemies.filter(e=>!e.dead&&distance(e,companion)<330).sort((a,b)=>distance(a,companion)-distance(b,companion))[0];if(target){const tx=target.x-companion.x,ty=target.y-companion.y,tm=Math.hypot(tx,ty)||1;projectiles.push({kind:'companion',x:companion.x,y:companion.y-12,vx:tx/tm*310,vy:ty/tm*310,r:6,life:1.4,damage:S.storyChoice==='mercy'?11:8});companion.cooldown=S.storyChoice==='mercy'?1.8:2.25;}}}
  function updateProjectiles(dt){
    for(const p of projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
      if(collides(p.x,p.y,3)){p.life=0;continue;}
      if(p.kind==='player'||p.kind==='companion'){for(const e of enemies)if(!e.dead&&Math.hypot(p.x-e.x,p.y-e.y)<p.r+e.r){const m=Math.hypot(p.vx,p.vy)||1;hitEnemy(e,p.damage,p.vx/m,p.vy/m,true,p.kind!=='companion');if(p.chain){const next=enemies.find(n=>!n.dead&&n!==e&&distance(n,e)<145);if(next){const dm=distance(next,e)||1;projectiles.push({kind:'player',x:e.x,y:e.y,vx:(next.x-e.x)/dm*300,vy:(next.y-e.y)/dm*300,r:7,life:.55,damage:Math.round(p.damage*.55),chain:false});}}p.life=0;break;}}
      else if(Math.hypot(p.x-S.x,p.y-S.y)<p.r+13){playerDamage(p.damage,p.x,p.y);p.life=0;}
    }
    const z=zone();projectiles=projectiles.filter(p=>p.life>0&&p.x>-40&&p.x<z.width+40&&p.y>-40&&p.y<z.height+40);
  }
  function updateLoot(dt){
    for(const d of loot){if(d.collected)continue;d.age+=dt;if(d.age<.55){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=180*dt;}else{d.vx*=.85;d.vy=0;}if(d.age>.45&&distance(d,S)<42)collectDrop(d);}
    loot=loot.filter(d=>!d.collected);
  }
  function updateCamera(dt,snap=false){
    const width=window.visualViewport?.width||window.innerWidth,height=window.visualViewport?.height||window.innerHeight;
    const viewport=canvas.getBoundingClientRect();let top=70;
    for(const node of [el.objectiveBtn,el.bossHud,el.toast,el.zoneBanner,el.destinationHint,el.subtitle,el.tutorial]){
      if(node.classList.contains('is-hidden'))continue;
      const r=node.getBoundingClientRect();
      if(r.width>0&&r.height>0&&r.left<width*.60&&r.right>width*.40)top=Math.max(top,r.bottom-viewport.top);
    }
    const z=zone(),frame=window.EVERLIGHT_CAMERA.frame({x:S.x,y:S.y,camera,worldWidth:z.width,worldHeight:z.height,viewWidth:VIEW_W,width,height,top,mounted:!!S.activeMount&&z.type!=='room'&&z.type!=='interior',dt,snap});
    camera.x=frame.x;camera.y=frame.y;
  }
  function updateEffects(dt){particles.forEach(p=>{p.life-=dt;if(!p.kind){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=20*dt;}});particles=particles.filter(p=>p.life>0);damageTexts.forEach(t=>{t.life-=dt;t.y-=25*dt;});damageTexts=damageTexts.filter(t=>t.life>0);shake=Math.max(0,shake-30*dt);screenFlash=Math.max(0,screenFlash-dt);toastTimer-=dt;subtitleTimer-=dt;zoneBannerTimer-=dt;lootFeedTimer-=dt;if(toastTimer<=0)show(el.toast,false);if(subtitleTimer<=0)show(el.subtitle,false);if(zoneBannerTimer<=0)show(el.zoneBanner,false);if(lootFeedTimer<=0)show(el.lootFeed,false);}

  function landSite(parent){return parent==='northford'?{x:1500,y:195}:{x:1560,y:580};}
  function landBuilding(parent){const p=S.properties[`land:${parent}`];return p?.businessType?{...landSite(parent),name:p.name,id:`business@land:${parent}`,role:'merchant'}:null;}
  function openEstate(id){closeInteraction();estateView.selectedId=id;estateView.message='';openJournal('economy');}
  function objectsForZone(){
    const z=zone();
    if(z.estateId){const p=S.properties[z.estateId],site=landSite(z.estateParent),role=p.businessType==='inn'?'rest':p.businessType==='stable'?'stable':'atlasShop';return[
      {id:'exit',kind:'portal',door:true,name:z.estateParent==='northford'?'Northford':ATLAS.get(z.estateParent)?.name||'Outside',x:480,y:655,label:'Exit',target:z.estateParent,spawn:{x:site.x,y:site.y+58}},
      {id:'business-manager',kind:role,name:'Resident Manager',x:650,y:350,label:role==='rest'?'Rest':role==='stable'?'Mounts':'Trade',shop:p.businessType==='apothecary'?'apothecary':p.businessType==='smithy'?'smithy':'road'},
      {id:'business-deed',kind:'estate',estateId:z.estateId,name:'Business Ledger',x:300,y:530,label:'Manage'}
    ];}
    const out=explorationObjectsForZone();
    const ownedId=S.zone.startsWith('home@')?S.zone:`estate:${S.zone}`;
    if(ESTATES.some(d=>d.id===ownedId))out.push({id:'building-deed',kind:'estate',estateId:ownedId,name:S.properties[ownedId]?'Property Ledger':'Building Deed',x:['apothecary','inn'].includes(S.zone)?1050:z.type==='interior'?770:300,y:z.type==='interior'?660:530,label:S.properties[ownedId]?'Manage':'Deed'});
    if(S.zone==='northford')out.push({id:'market-deed',kind:'estate',estateId:'estate:market',name:'Market Stall Deed',x:1060,y:427,label:'Deed'});
    const landId=`land:${S.zone}`;
    if(ESTATES.some(d=>d.id===landId)){
      const site=landSite(S.zone),building=landBuilding(S.zone);
      if(building)out.push({id:'development-door',kind:'portal',door:true,name:building.name,x:site.x,y:site.y,label:'Enter',target:building.id});
      out.push({id:'land-deed',kind:'estate',estateId:landId,name:building?'Business Deed':'Land for Development',x:site.x+(building?120:0),y:site.y+(building?20:0),label:S.properties[landId]?'Manage':'Inspect'});
    }
    return out;
  }
  function explorationObjectsForZone(){
    if(S.zone==='northford')return [...EX.townDoors,
      {id:'mira',kind:'npc',name:'Mira',x:775,y:535,label:'Talk'},
      {id:'southGate',kind:'portal',name:'Greenwake Vale',x:1372,y:886,label:'Travel',target:'greenwake',spawn:{x:1080,y:190}},
      {id:'waystone',kind:'waystone',name:'Northford Waystone',x:802,y:455,label:'Travel'},
      {id:'directory',kind:'directory',name:'Northford Directory',x:1050,y:528,label:'Map'},
      {id:'market',kind:'atlasShop',name:'Pella the Provisioner',x:1160,y:434,label:'Trade',shop:'road'}
    ];
    const z=zone();
    if(S.zone==='bellkeeper')return [
      {id:'exit',kind:'portal',door:true,name:'Northford',x:480,y:655,label:'Exit',target:'northford',spawn:{x:1329,y:630}},
      {id:'ada',kind:'adventure',name:'Ada, Bellkeeper',x:650,y:340,label:'Talk'},
      {id:'bellJournal',kind:'adventure',name:'Keeper’s Journal',x:275,y:315,label:'Read'}
    ];
    if(['cistern','sluice','vault'].includes(S.zone)){
      const out=[{id:'exit',kind:'portal',door:true,name:S.zone==='cistern'?'Northford':'Previous Chamber',x:560,y:823,label:'Exit',target:S.zone==='cistern'?'northford':S.zone==='sluice'?'cistern':'sluice',spawn:S.zone==='cistern'?{x:124,y:788}:{x:560,y:245}}];
      if(S.zone==='cistern')out.push({id:'cisternPlaque',kind:'adventure',name:'Lantern Inscription',x:700,y:680,label:'Read'},{id:'sluiceDoor',kind:'portal',door:true,name:'Moonlit Sluice',x:560,y:190,label:'Descend',target:'sluice'});
      if(S.zone==='sluice')out.push({id:'moonValve',kind:'adventure',name:'Moon Valve',x:170,y:310,label:S.opened.includes('moonValve')?'Turned':'Turn'},{id:'sunValve',kind:'adventure',name:'Sun Valve',x:950,y:310,label:S.opened.includes('sunValve')?'Turned':'Turn'},{id:'vaultDoor',kind:'portal',door:true,name:'The Drowned Bell',x:560,y:190,label:'Enter',target:'vault'});
      if(S.zone==='vault')out.push({id:'bellReliquary',kind:'adventure',name:'Bellkeeper’s Reliquary',x:560,y:230,label:S.opened.includes('bellReliquary')?'Opened':'Open'},...(S.opened.includes('drowned-keeper')?[{id:'shortcut',kind:'portal',door:true,name:'Northford Shortcut',x:1000,y:460,label:'Return',target:'northford',spawn:{x:124,y:788}}]:[]));
      return out;
    }
    if(z.parent){const area=ATLAS.get(z.parent),b=z.building;return [
      {id:'exit',kind:'portal',door:true,name:area.name,x:480,y:655,label:'Exit',target:area.id,spawn:{x:b.x,y:b.y+58}},
      {id:`${z.parent}:indoor:${b.index}`,kind:b.role==='merchant'?'atlasShop':b.role==='rest'?'rest':'atlasNpc',name:atlasNpcName(area,`${b.index}`),x:650,y:350,label:b.role==='merchant'?'Trade':b.role==='rest'?'Rest':'Talk',shop:'road',areaId:area.id},
      {id:`${z.parent}:houseCache:${b.index}`,kind:'chest',secret:true,name:'Traveler’s Keepsake',x:285,y:220,label:'Open',tier:'Rare'}
    ];}
    const out=baseObjectsForZone();
    const townDoor=EX.townDoors.find(d=>d.target===S.zone);
    for(const o of out){if(o.id==='exit'&&townDoor){o.door=true;o.spawn={x:townDoor.x,y:townDoor.y+54};}if(o.id==='northGate')o.spawn={x:1360,y:843};}
    const area=atlasArea();if(area?.kind==='settlement')out.push(...EX.homes(area).map(b=>({id:`door:${b.id}`,kind:'portal',door:true,name:b.name,short:b.role==='merchant'?'Shop':b.role==='rest'?'Inn':'Home',icon:b.role==='merchant'?'✦':'⌂',x:b.x,y:b.y+8,label:'Enter',target:b.id})));
    return out;
  }
  function baseObjectsForZone(){
    if(S.zone==='northford')return [
      {id:'mira',kind:'npc',name:'Mira',x:870,y:590,label:'Talk'},
      {id:'southGate',kind:'portal',name:'South Gate',x:950,y:960,label:'Travel',target:'greenwake',spawn:{x:1080,y:190}},
      {id:'smithyDoor',kind:'portal',name:'Ember & Anvil',x:1260,y:470,label:'Enter',target:'smithy'},
      {id:'apothecaryDoor',kind:'portal',name:'Greenbottle',x:1450,y:610,label:'Enter',target:'apothecary'},
      {id:'innDoor',kind:'portal',name:'Mooncup Inn',x:470,y:430,label:'Enter',target:'inn'},
      {id:'guildDoor',kind:'portal',name:'Guildhall',x:315,y:650,label:'Enter',target:'guildhall'},
      {id:'stableDoor',kind:'portal',name:'Windstrider Stable',x:1590,y:810,label:'Enter',target:'stable'},
      {id:'waystone',kind:'waystone',name:'Northford Waystone',x:950,y:365,label:'Travel'}
    ];
    if(S.zone==='greenwake')return [
      {id:'northGate',kind:'portal',name:'Northford',x:1080,y:105,label:'Return',target:'northford',spawn:{x:950,y:900}},
      {id:'moonfallRoad',kind:'portal',name:'Moonfall Road',x:2100,y:650,label:'Travel',target:'moonfall',spawn:{x:150,y:620}},
      {id:'lostScout',kind:'npc',name:'Tarin',x:410,y:990,label:'Talk'},
      {id:'greenwakeCache',kind:'chest',name:'Rootbound Cache',x:1820,y:1040,label:'Open'}
    ];
    if(S.zone==='moonfall')return [
      {id:'valeRoad',kind:'portal',name:'Greenwake Road',x:90,y:620,label:'Return',target:'greenwake',spawn:{x:2020,y:650}},
      {id:'moonfallWaystone',kind:'waystone',name:'Moonfall Waystone',x:1060,y:560,label:'Travel'},
      ...(ATLAS&&S.mainStep>=8?[{id:'worldRoad',kind:'portal',name:'The Wider Vale',x:1810,y:620,label:'Journey',target:ATLAS.firstArea,spawn:{x:150,y:550}}]:[])
    ];
    if(S.zone==='smithy')return [
      {id:'exit',kind:'portal',name:'Northford',x:768,y:860,label:'Exit',target:'northford',spawn:{x:1260,y:530}},
      {id:'smith',kind:'shop',name:'Brann',x:770,y:310,label:'Trade',shop:'smithy'},
      {id:'orin',kind:'localNpc',name:'Orin',x:470,y:520,label:'Talk'},
      {id:'forgeMark',kind:'lore',name:'Old Forge Mark',x:1080,y:455,label:'Inspect'},
      {id:'smithyCache',kind:'chest',secret:true,name:'Cracked-Wall Cache',x:1180,y:455,label:S.opened.includes('smithyCache')?'Empty':'Open',tier:'Rare'}
    ];
    if(S.zone==='apothecary')return [
      {id:'exit',kind:'portal',name:'Northford',x:768,y:865,label:'Exit',target:'northford',spawn:{x:1450,y:670}},
      {id:'apothecary',kind:'shop',name:'Sela',x:790,y:475,label:'Talk',shop:'apothecary'},
      {id:'lio',kind:'localNpc',name:'Lio',x:335,y:555,label:'Talk'},
      {id:'moonleafPress',kind:'lore',name:'Moonleaf Press',x:1080,y:520,label:'Inspect'},
      {id:'apothecaryCache',kind:'chest',secret:true,name:'Loose-Floor Cache',x:1120,y:755,label:S.opened.includes('apothecaryCache')?'Empty':'Open',tier:'Rare'}
    ];
    if(S.zone==='inn')return [
      {id:'exit',kind:'portal',name:'Northford',x:768,y:865,label:'Exit',target:'northford',spawn:{x:470,y:490}},
      {id:'innkeeper',kind:'rest',name:'Nella',x:1090,y:325,label:'Rest'},
      {id:'oldFen',kind:'localNpc',name:'Old Fen',x:350,y:525,label:'Talk'},
      {id:'innBoard',kind:'lore',name:'Rumor Board',x:255,y:565,label:'Read'},
      {id:'innHearthCache',kind:'chest',secret:true,name:'Hearthbrick Cache',x:480,y:330,label:S.opened.includes('innHearthCache')?'Empty':'Open',tier:'Rare'}
    ];
    if(S.zone==='stable')return [
      {id:'exit',kind:'portal',name:'Northford',x:768,y:185,label:'Exit',target:'northford',spawn:{x:1590,y:870}},
      {id:'stablemaster',kind:'stable',name:'Rowan',x:1000,y:680,label:'Talk'},
      {id:'mara',kind:'localNpc',name:'Mara',x:640,y:540,label:'Talk'},
      {id:'tackMap',kind:'lore',name:'Trail Map',x:900,y:520,label:'Inspect'},
      {id:'stableCache',kind:'chest',secret:true,name:'Hayloft Cache',x:650,y:700,label:S.opened.includes('stableCache')?'Empty':'Open',tier:'Rare'}
    ];
    if(S.zone==='guildhall')return [
      {id:'exit',kind:'portal',name:'Northford',x:768,y:865,label:'Exit',target:'northford',spawn:{x:315,y:710}},
      {id:'ironbound',kind:'faction',name:'Captain Vey',x:430,y:355,label:'Ironbound'},
      {id:'archive',kind:'faction',name:'Curator Elya',x:650,y:300,label:'Archive'},
      {id:'gilded',kind:'faction',name:'Broker Ves',x:885,y:300,label:'Gilded'},
      {id:'ashen',kind:'faction',name:'Magister Sol',x:1100,y:355,label:'Ashen'},
      {id:'sunderingMosaic',kind:'lore',name:'Sundering Mosaic',x:768,y:500,label:'Study'},
      {id:'guildCache',kind:'chest',secret:true,name:'Veiled Reliquary',x:1260,y:520,label:S.opened.includes('guildCache')?'Empty':'Open',tier:'Epic'}
    ];
    const area = atlasArea();
    if (area) {
      const out = [];
      const positions = { west:{x:70,y:550,spawn:{x:1710,y:550}}, east:{x:1730,y:550,spawn:{x:90,y:550}}, north:{x:900,y:175,spawn:{x:900,y:900}}, south:{x:900,y:940,spawn:{x:900,y:210}} };
      for (const [direction,target] of Object.entries(area.exits)) {
        const p=positions[direction];out.push({id:`route:${direction}`,kind:'portal',name:ATLAS.get(target)?.name||'Old Road',x:p.x,y:p.y,label:'Travel',target,spawn:p.spawn});
      }
      for (let i=0;i<area.secretCount;i++) {
        const seed=hashNumber(`${area.id}:secret:${i}`);
        out.push({id:`${area.id}:secret:${i}`,kind:'chest',secret:true,name:'Hidden Cache',x:210+(seed%1380),y:270+((seed>>>9)%570),label:'Open',tier:area.treasureTier});
      }
      if(area.kind==='settlement')out.push(
        {id:`${area.id}:board`,kind:'notice',name:'Wayfarer Board',x:760,y:480,label:'Read'},
        {id:`${area.id}:merchant`,kind:'atlasShop',name:atlasNpcName(area,'merchant'),x:540,y:570,label:'Trade',shop:'road'},
        {id:`${area.id}:resident`,kind:'atlasNpc',name:atlasNpcName(area),x:1180,y:610,label:'Talk'}
      );
      if(area.kind==='landmark'||area.kind==='dungeon')out.push({id:`${area.id}:lore`,kind:'atlasLore',name:area.kind==='dungeon'?'Echo Inscription':'Weathered Marker',x:900,y:760,label:'Inspect'});
      if(area.propertyAvailable)out.push({id:`${area.id}:deed`,kind:'property',name:`${pretty(area.propertyType)} Deed`,x:1060,y:470,label:S.properties[area.id]?'Manage':'Inspect'});
      if(area.hasWaystone)out.push({id:`${area.id}:waystone`,kind:'waystone',name:`${area.name} Waystone`,x:900,y:390,label:'Attune'});
      return out;
    }
    return [];
  }
  function nearestInteractable(){return objectsForZone().filter(o=>distance(S,o)<(o.door?74:100)).sort((a,b)=>distance(S,a)-distance(S,b))[0]||null;}
  function usePortal(o){
    if(o.door&&doorCooldown>0)return;
    if(o.target==='moonfall'&&S.mainStep<5){toast('Mira asked you to return before taking the Moonfall road');return;}
    if(o.target==='vault'&&(!S.opened.includes('moonValve')||!S.opened.includes('sunValve'))){toast('Two seals hold the door. Turn the Moon and Sun valves.');doorCooldown=1.5;return;}
    enterZone(o.target,o.spawn);save();sfx('select');
  }
  function updateInteraction(){currentInteract=nearestInteractable();show(el.interactBtn,!!currentInteract);if(currentInteract)el.interactBtn.querySelector('small').textContent=currentInteract.label;}
  function interact(){
    if(paused||!currentInteract)return;wakeAudio();dismissTutorial();sfx('select');const o=currentInteract;
    if(o.kind==='portal'){usePortal(o);return;}
    if(o.kind==='directory'){openJournal('world');return;}
    if(o.kind==='estate'){openEstate(o.estateId);return;}
    if(o.kind==='adventure'){interactAdventure(o);return;}
    if(o.kind==='shop'){if(o.id==='apothecary')talkApothecary();else openShop(o.shop,o.name);return;}
    if(o.kind==='rest'){S.hp=combatStats().maxHp;S.mana=S.maxMana;S.stam=S.maxStam;advanceDay();toast('Rested until dawn · Progress saved');save();return;}
    if(o.kind==='stable'){talkStable();return;}
    if(o.kind==='faction'){openFaction(o.id);return;}
    if(o.kind==='waystone'){openWaystone();return;}
    if(o.kind==='chest'){openChest(o);return;}
    if(o.kind==='localNpc'){talkLocal(o.id);return;}
    if(o.kind==='lore'){inspectLore(o.id);return;}
    if(o.kind==='atlasShop'){openShop(o.shop,o.name);return;}
    if(o.kind==='atlasNpc'){talkAtlasNpc(o.areaId?ATLAS.get(o.areaId):atlasArea(),o);return;}
    if(o.kind==='atlasLore'){inspectAtlasLore(atlasArea(),o);return;}
    if(o.kind==='notice'){openAreaQuest(atlasArea());return;}
    if(o.kind==='property'){openEstate(atlasArea().id);return;}
    if(o.id==='mira'){talkMira();return;}
    if(o.id==='lostScout'){talkScout();return;}
  }
  function talkMira(){
    if(S.mainStep===0)openDialogue([{speaker:'Mira',portrait:'M',text:'There you are. The old road spoke your name, and now echoes are hunting anyone carrying lantern-light.'},{speaker:'Mira',portrait:'M',text:'What did you hear in the stone?',choices:[{label:'“A voice asking for help.”',value:'mercy'},{label:'“A command: open the road.”',value:'power'}]}],choice=>{S.storyChoice=choice;S.mainStep=1;if(choice==='mercy')addItem('lantern_charm');else{S.maxMana+=15;S.mana=S.maxMana;}save();closeDialogue();subtitle('Take the south gate. Find what is poisoning Greenwake.',3);});
    else if(S.mainStep===3)openDialogue([{speaker:'Mira',portrait:'M',text:'You broke the first echo storm. But that mark on your hand belongs to one of the old factions.'},{speaker:'Mira',portrait:'M',text:'Visit the Guildhall. Choose an ally, then we take the east road to Moonfall.'}],()=>{S.mainStep=4;save();});
    else if(S.mainStep===4)openDialogue([{speaker:'Mira',portrait:'M',text:'The Guildhall is west of the plaza. Four factions are waiting—and each wants something different from the Ways.'}]);
    else if(S.mainStep===5)openDialogue([{speaker:'Mira',portrait:'M',text:'Your ally has pledged supplies. Meet me beyond Greenwake. The Moonfall seal will not wait.'}]);
    else openDialogue([{speaker:'Mira',portrait:'M',text:S.chapterComplete?'The Lens points beyond the mountains. This is only the first road, Roadbearer.':'Northford is alive again. Stock up, train, and follow the current thread when you are ready.'}]);
  }
  function interactAdventure(o){
    if(o.id==='ada'){
      if(S.sideQuests.drownedBell==='ready'&&S.opened.includes('bellReliquary')){S.sideQuests.drownedBell='complete';S.gold+=120;S.skillPoints++;gainXp(90);save();openDialogue([{speaker:'Ada',portrait:'A',text:'That is my father’s bell. He held the floodgate while the town escaped. Now we can ring it for him. Take these 120 crowns—and remember what a keeper protects.'}]);return;}
      if(S.sideQuests.drownedBell==='available'){S.sideQuests.drownedBell='active';save();}
      openDialogue([{speaker:'Ada',portrait:'A',text:S.sideQuests.drownedBell==='complete'?'At dusk I ring it once for the lost and twice for the living. The road sounds kinder now.':'The old cistern lies under the ruined arch in southwest Northford. My father’s bell is still down there. Follow the lanterns, turn both sluice valves, and bring it home.'},{speaker:'Ada',portrait:'A',text:'The stone keeper guards it. Watch for the red windup, step aside, then strike while it recovers. Sword, bow or aether will all break its shell.'}]);return;
    }
    if(o.id==='bellJournal'||o.id==='cisternPlaque'){openDialogue([{speaker:o.name,portrait:'◇',text:'“Moon to the west. Sun to the east. Open both and the water makes a road.” A sketch shows the two side passages meeting above the central wall.'}]);return;}
    if(o.id==='moonValve'||o.id==='sunValve'){if(S.opened.includes(o.id)){toast('This valve is already open');return;}S.opened.push(o.id);gainXp(20);save();spawnBurst(o.x,o.y,'#78edd5',18);toast(S.opened.includes('moonValve')&&S.opened.includes('sunValve')?'Both valves open · The north vault is unsealed':'Water falls behind the wall · Find the other valve');return;}
    if(o.id==='bellReliquary'){
      if(!S.opened.includes('drowned-keeper')){toast('The keeper’s seal still binds the reliquary');return;}
      if(S.opened.includes('bellReliquary')){toast('Return the copper bell to Ada');return;}
      S.opened.push('bellReliquary');addItem('echo_buckler');S.gold+=85;S.sideQuests.drownedBell='ready';gainXp(65);save();lootMessage('Legendary · Echo Buckler','Legendary');openDialogue([{speaker:'The Copper Bell',portrait:'♧',text:'A small copper bell rests inside a shield of hardened light. Its inscription reads: “A way home, for everyone.” You claim the Echo Buckler and 85 gold. A passage to Northford opens in the east wall.'}]);
    }
  }
  function talkApothecary(){
    if(S.sideQuests.apothecary==='available')openDialogue([{speaker:'Sela',portrait:'S',text:'The echo storm spoiled my stores. Bring me three Moonleaf from Greenwake and I will teach you a field remedy.',choices:[{label:'Accept: Moonleaf Remedy',value:'accept'},{label:'Browse remedies',value:'shop'}]}],choice=>{if(choice==='accept'){S.sideQuests.apothecary='active';save();closeDialogue();toast('Side quest started · Moonleaf Remedy');}else{closeDialogue();openShop('apothecary','Sela');}});
    else if(S.sideQuests.apothecary==='ready'){S.materials.moonleaf-=3;S.sideQuests.apothecary='complete';addItem('tonic');addItem('tonic');gainXp(45);save();openDialogue([{speaker:'Sela',portrait:'S',text:'Perfect leaves. Here—two tonics, and the recipe is yours. Northford remembers who helps it.'}]);}
    else openShop('apothecary','Sela');
  }
  function talkStable(){
    if(S.sideQuests.stable==='available')openDialogue([{speaker:'Rowan',portrait:'R',text:'My Windstrider will carry you, but not while briars stalk the south road. Clear four and I will lower the price.',choices:[{label:'Accept: Clear the Brambles',value:'accept'},{label:'Ask about mounts',value:'mount'}]}],choice=>{if(choice==='accept'){S.sideQuests.stable='active';S.sideProgress.briars=0;save();closeDialogue();toast('Side quest started · Clear the Brambles');}else{closeDialogue();openStable();}});
    else if(S.sideQuests.stable==='ready'){S.sideQuests.stable='complete';S.gold+=60;gainXp(55);save();openDialogue([{speaker:'Rowan',portrait:'R',text:'The road is clear. Take this purse—and my best price on the chestnut Windstrider.'}],()=>openStable());}
    else openStable();
  }
  function talkScout(){
    if(S.sideQuests.lostScout==='available'){S.sideQuests.lostScout='active';save();openDialogue([{speaker:'Tarin',portrait:'T',text:'I found a Rootbound Cache, then the briars found me. It is hidden near the southeast ridge. Keep what is inside—just make the road safe.'}]);}
    else openDialogue([{speaker:'Tarin',portrait:'T',text:S.opened.includes('greenwakeCache')?'You found it. Maybe the Vale has not given up on us yet.':'Southeast ridge. Look for roots wrapped around old gold.'}]);
  }
  function talkLocal(id){
    if(id==='orin'){
      if(S.sideQuests.smithyLedger==='available')openDialogue([{speaker:'Orin',portrait:'O',text:'Brann rebuilt this forge over older stone. I heard something shift behind the maker’s mark, but he says apprentices should mind their hammers.'},{speaker:'Orin',portrait:'O',text:'If you inspect the old forge mark near the weapon racks, bring me anything that explains who worked here before us.'}],()=>{S.sideQuests.smithyLedger='active';save();toast('Side quest started · The First Smith');});
      else openDialogue([{speaker:'Orin',portrait:'O',text:S.sideQuests.smithyLedger==='complete'?'That ledger names every keeper of the Northford flame. Brann finally believes me.':'The maker’s mark is beyond the anvil, near the weapon racks.'}]);
      return;
    }
    if(id==='oldFen'){
      if(S.sideQuests.innRumor==='available')openDialogue([{speaker:'Old Fen',portrait:'F',text:'This inn survived the Sundering because Nella’s grandmother hid a wayfarer beneath the hearth.'},{speaker:'Old Fen',portrait:'F',text:'One brick still rings hollow. Find the Hearthbrick Cache and we will know whether the old tale was mercy—or treason.'}],()=>{S.sideQuests.innRumor='active';save();toast('Side quest started · Beneath the Mooncup');});
      else openDialogue([{speaker:'Old Fen',portrait:'F',text:S.sideQuests.innRumor==='complete'?'So the wayfarer left a lantern token. Some debts wait a generation to be repaid.':'Listen beside the fireplace. Stone lies differently when it guards a secret.'}]);
      return;
    }
    if(id==='lio'){openDialogue([{speaker:'Lio',portrait:'L',text:S.sideQuests.apothecary==='active'?'Moonleaf keeps a silver underside even after an echo storm. The press preserves it if you need a sample.':'Sela says every bottle is a promise: label it, test it, and never pretend you know more than the plant.'}]);return;}
    if(id==='mara'){openDialogue([{speaker:'Mara',portrait:'M',text:S.sideQuests.stable==='active'?`I marked the briar nests on the trail map. You have cleared ${Math.min(4,S.sideProgress.briars)}/4.`:'Windstriders choose calm riders. Speed comes after trust.'}]);}
  }
  function inspectLore(id){
    const lensClues={moonleafPress:['lens:root','ROOT: The old roads drink from the same hidden spring.'],tackMap:['lens:road','ROAD: A keeper chose the unmarked eighth path.'],sunderingMosaic:['lens:oath','OATH: Protect the traveler, before the banner.']};
    if(S.inventory.some(i=>i.id==='aether_lens')&&lensClues[id]){
      const [key,clue]=lensClues[id];if(!S.opened.includes(key)){S.opened.push(key);gainXp(20);}
      const count=['lens:root','lens:road','lens:oath'].filter(k=>S.opened.includes(k)).length;if(S.sideQuests.lensEchoes!=='complete')S.sideQuests.lensEchoes=count===3?'ready':'active';save();
      openDialogue([{speaker:'What the Lens Remembers',portrait:'✦',text:`${clue} (${count}/3 memories restored.) ${count===3?'The eighth keeper’s reliquary opens in the east alcove of the Guildhall.':'The same glow touches a Moonleaf Press, a Trail Map, and the Guildhall Mosaic.'}`}]);return;
    }
    if(id==='forgeMark'){
      if(S.sideQuests.smithyLedger==='active'){S.sideQuests.smithyLedger='complete';S.gold+=45;gainXp(35);addItem('briar_edge');save();openDialogue([{speaker:'Forge Ledger',portrait:'◆',text:'A soot-black ledger slides from behind the maker’s mark. The first entry is signed by a smith who vanished during the Sundering. You recover an unfinished Briar Edge and 45 gold.'}]);}
      else openDialogue([{speaker:'Old Forge Mark',portrait:'◆',text:'Seven hammers surround an empty eighth place. The stone is newer than the wall around it.'}]);
      return;
    }
    if(id==='moonleafPress'){
      if(!S.opened.includes(id)){S.opened.push(id);S.materials.moonleaf=(S.materials.moonleaf||0)+1;if(S.sideQuests.apothecary==='active'&&S.materials.moonleaf>=3)S.sideQuests.apothecary='ready';gainXp(12);save();toast('Hidden drawer · +1 Moonleaf');}
      openDialogue([{speaker:'Moonleaf Press',portrait:'✤',text:'A brass press engraved with the phases of the moon. A narrow drawer underneath holds one carefully preserved leaf.'}]);return;
    }
    if(id==='innBoard'){openDialogue([{speaker:'Rumor Board',portrait:'◆',text:'Caravan missing near Glass Watch. Blue fire seen under Moonfall. Someone has pinned a child’s drawing of a crowned briar over both notices.'}]);return;}
    if(id==='tackMap'){openDialogue([{speaker:'Trail Map',portrait:'◇',text:'Rowan’s map marks shallow river crossings, waystone shelters, and a high trail labeled only: “Sky road—when the old engine wakes.”'}]);return;}
    if(id==='sunderingMosaic'){
      if(!S.opened.includes(id)){S.opened.push(id);gainXp(20);save();}
      openDialogue([{speaker:'Sundering Mosaic',portrait:'✦',text:'Four paths meet around a broken star. Each faction restored its own quarter, but none repaired the fracture at the center.'}]);
    }
  }
  function talkAtlasNpc(area,npc){
    if(!area)return;
    const event=S.activeEvents[area.id],unopened=objectsForZone().filter(o=>o.kind==='chest'&&!S.opened.includes(o.id)).length;
    const regionLines={verdant:'The moss grows toward buried Waystones, not toward the sun.',ruins:'At dusk, the broken arches repeat words no living person spoke.',highland:'Caravans pay well for a clear ridge road.',swamp:'Follow the white moths if you want dry ground.',coast:'The tide leaves old coins where the moon touches the rocks.',alpine:'Storm bells carry farther than voices up here.',frost:'Blue ice means empty water beneath. Pale ice means something is watching.',desert:'Glass sings before a storm. If it stops, find cover.',ancient_forest:'Some trees remember doors better than roads.',islands:'Every wreck has two stories—the one sailors tell and the one the sea kept.',royal:'The crown roads look safe because someone is always paying the danger elsewhere.',astral:'Do not count the falling stars. Sometimes one counts back.'};
    openDialogue([{speaker:npc.name,portrait:npc.name[0],text:event?.status==='active'?`${event.name} has everyone indoors. The Wayfarer Board lists what we know—and what the guild will pay.`:regionLines[area.biome]||'Every old road hides something from travelers who hurry.'},{speaker:npc.name,portrait:npc.name[0],text:unopened?`I have seen ${unopened===1?'a strange glimmer':`${unopened} strange glimmers`} beyond the main path. Look where the scenery seems too quiet.`:'You have sharper eyes than most. I have no hidden cache left to hint at.'}]);
  }
  function inspectAtlasLore(area,o){
    if(!area)return;const id=o.id,first=!S.opened.includes(id);if(first){S.opened.push(id);gainXp(12+area.danger*3);if(Math.random()<.5)S.materials.moonleaf=(S.materials.moonleaf||0)+1;save();}
    const lines={dungeon:`The inscription names a keeper who sealed this place from the inside. One final line has been scratched away by metal claws.`,landmark:`The marker records three roads, but only ${Object.keys(area.exits).length} remain. A faded arrow points toward one of this area's hidden caches.`};
    openDialogue([{speaker:o.name,portrait:'◆',text:lines[area.kind]||'The old stone hums faintly beneath your hand.'}]);
  }
  function openChest(o){
    if(o.id==='guildCache'&&S.sideQuests.lensEchoes!=='ready'&&S.sideQuests.lensEchoes!=='complete'){toast('Three memories seal this reliquary. Return with the Aether Lens.');return;}
    if(S.opened.includes(o.id)&&!(o.id==='guildCache'&&S.sideQuests.lensEchoes==='ready')){toast('The cache is empty');return;}
    S.opened.push(o.id);
    if(o.id==='guildCache'&&S.sideQuests.lensEchoes==='ready'){S.sideQuests.lensEchoes='complete';addItem('echo_buckler');S.skillPoints++;gainXp(90);save();lootMessage('Legendary · Echo Buckler','Legendary');openDialogue([{speaker:'The Eighth Keeper',portrait:'✦',text:'No faction claimed this keeper. Their oath belonged to everyone who walked the Ways. You recover the Echo Buckler, a skill point, and a Guildhall Waystone route.'}]);return;}
    if(o.id==='greenwakeCache'){
      S.gold+=65;const item=addItem('moonfall_saber');S.sideQuests.lostScout='complete';gainXp(60);spawnBurst(o.x,o.y,'#ffd86f',28);lootMessage(`${item.rarity} · ${item.name}`,item.rarity);save();return;
    }
    const area=atlasArea(), tier=o.tier||area?.treasureTier||'Rare';
    const table={Rare:['moonfall_saber','frostveil_mail'],Epic:['emberbrand','saltglass_idol'],Legendary:['echo_buckler','saltglass_idol'],Mythic:['starfall_relic','emberbrand']};
    const item=addItem(choose(table[tier]||table.Rare),tier);const gold=30+(area?.danger||1)*18;
    S.gold+=gold;gainXp(20+(area?.danger||1)*8);if(o.id==='innHearthCache'&&S.sideQuests.innRumor==='active'){S.sideQuests.innRumor='complete';S.gold+=40;gainXp(35);}spawnBurst(o.x,o.y,RARITY[tier]||'#ffd86f',34);lootMessage(`${tier} · ${item.name} · +${gold}g`,tier);save();
  }

  function areaQuest(area){
    if(!area)return null;
    const destination=area.kind==='settlement'?Object.values(area.exits).map(id=>ATLAS.get(id)).find(a=>a&&a.kind!=='settlement')||area:area;
    const id=`quest:${area.id}`, target=3+Math.min(5,area.danger), existing=S.dynamicQuests[id];
    if(existing){existing.targetAreaId=destination.id;existing.text=`Clear ${existing.target} threats on the road in ${destination.name}. Return to ${area.name} for payment.`;return existing;}
    const verbs={bounty:'Cull',rescue:'Rescue patrols from',relic:'Recover relics guarded by',delivery:'Clear a route through',survey:'Survey territory held by',defense:'Defend the road from',mystery:'Investigate',hunt:'Hunt'};
    return {id,areaId:area.id,targetAreaId:destination.id,name:`Roadwatch: ${destination.name}`,text:`Clear ${target} threats in ${destination.name}. Return to ${area.name} for payment.`,target,progress:0,status:'available',reward:70+area.danger*30,xp:35+area.danger*15};
  }
  function openAreaQuest(area){
    const q=areaQuest(area);if(!q)return;
    if(q.status==='ready'){
      S.gold+=q.reward;gainXp(q.xp);q.status='complete';S.dynamicQuests[q.id]=q;
      if(S.faction)S.factionRep[S.faction]+=8+area.danger;save();openDialogue([{speaker:'Wayfarer Board',portrait:'◆',text:`Contract fulfilled. ${q.reward} gold has been released from escrow.`}]);return;
    }
    openInteraction(q.name,`<div class="feature-card"><span class="choice-tag">${area.regionName} contract</span><h3>${q.text}</h3><p>Reward: ${q.reward} gold · ${q.xp} XP${S.faction?' · faction reputation':''}</p><button data-accept-quest="${q.id}" ${q.status!=='available'?'disabled':''}>${q.status==='active'?`${q.progress}/${q.target} complete`:q.status==='complete'?'Completed':'Accept contract'}</button></div>`);
  }
  function propertyBlueprint(area){
    const price=180+area.danger*95+(area.kind==='settlement'?120:0), operating=8+area.danger*4;
    return {id:area.id,name:`${area.name} ${pretty(area.propertyType)}`,type:area.propertyType,regionId:area.regionId,purchasePrice:price,value:price,level:0,operatingCost:operating,revenueMin:operating+12+area.danger*4,revenueMax:operating+34+area.danger*9,lastProfit:0,total:0};
  }
  function openProperty(area){
    const owned=S.properties[area.id], p=owned||propertyBlueprint(area), upgrade=Math.round(p.purchasePrice*.55*(1+(p.level||0)*.65));
    openInteraction(p.name,`<div class="feature-card"><span class="choice-tag">${pretty(p.type)} · ${area.regionName}</span><h3>${owned?`Tier ${p.level+1} property`:'Deed available'}</h3><p>${owned?`Value ${p.value}g · Operating cost ${p.operatingCost}g · Yesterday ${p.lastProfit>=0?'+':''}${p.lastProfit}g`:`Purchase ${p.purchasePrice}g · Daily revenue ${p.revenueMin}–${p.revenueMax}g before ${p.operatingCost}g costs.`}</p>${owned?`<button data-property-upgrade="${area.id}" ${S.gold<upgrade?'disabled':''}>Upgrade · ${upgrade}g</button>`:`<button data-property-buy="${area.id}" ${S.gold<p.purchasePrice?'disabled':''}>Purchase deed · ${p.purchasePrice}g</button>`}</div>`);
  }

  function openDialogue(lines,onDone=null,onChoice=null){restoreFocus=document.activeElement;dialogueQueue=[...lines];dialogueDone=onDone;dialogueChoiceHandler=onChoice||onDone;paused=true;el.gameScreen.inert=true;show(el.dialogue);renderDialogueLine();}
  function renderDialogueLine(){
    const line=dialogueQueue[0];if(!line){const done=dialogueDone;closeDialogue();if(done)done();return;}
    el.speakerName.textContent=line.speaker;
    const usesPortrait=line.speaker==='Mira';
    el.speakerPortrait.classList.toggle('portrait--image',usesPortrait);
    el.speakerPortrait.style.backgroundImage=usesPortrait?`url("assets/mira-scout.png?v=${BUILD}")`:'';
    el.speakerPortrait.textContent=usesPortrait?'':line.portrait||line.speaker[0];
    const actor=objectsForZone().find(o=>o.name===line.speaker&&!['adventure','chest','portal'].includes(o.kind));
    if(!usesPortrait&&actor){
      const portrait=document.createElement('canvas');portrait.width=80;portrait.height=80;
      const pc=portrait.getContext('2d');pc.scale(2,2);
      window.EVERLIGHT_ACTORS.draw(pc,{id:actor.id,name:actor.name,x:20,y:61,time:0,facing:{x:0,y:1},role:actor.kind==='atlasShop'?'merchant':actor.kind==='faction'?'guild':undefined});
      el.speakerPortrait.textContent='';el.speakerPortrait.appendChild(portrait);
    }
    el.dialogueText.textContent=line.text;el.dialogueChoices.innerHTML='';show(el.dialogueNext,!line.choices);
    if(line.choices)for(const c of line.choices){const b=document.createElement('button');b.textContent=c.label;b.onclick=()=>dialogueChoiceHandler?.(c.value);el.dialogueChoices.appendChild(b);}
    requestAnimationFrame(()=>line.choices?el.dialogueChoices.querySelector('button')?.focus():el.dialogueNext.focus());
  }
  function advanceDialogue(){if(!dialogueQueue[0]||dialogueQueue[0].choices)return;dialogueQueue.shift();renderDialogueLine();}
  function closeDialogue(){show(el.dialogue,false);el.gameScreen.inert=false;dialogueQueue=[];paused=false;last=performance.now();dialogueDone=null;dialogueChoiceHandler=null;restoreFocus?.focus?.();restoreFocus=null;}

  function priceFor(item){return Math.ceil(item.value*(S.faction==='gilded'?.9:1)*ECON.perk(S,item.type==='Consumable'?'apothecary':'smithy'));}
  function openInteraction(title,html){restoreFocus=document.activeElement;el.interactionTitle.textContent=title;el.interactionBody.innerHTML=html;paused=true;el.gameScreen.inert=true;show(el.interactionPanel);requestAnimationFrame(()=>el.closeInteraction.focus());}
  function closeInteraction(){show(el.interactionPanel,false);el.gameScreen.inert=false;paused=false;last=performance.now();restoreFocus?.focus?.();restoreFocus=null;}
  function openShop(kind,keeper){const rows=SHOP_STOCK[kind].map((id,index)=>{const i=ITEM_TEMPLATES[id],price=priceFor(i);return `<article class="market-row rarity-${i.rarity.toLowerCase()}"><div><strong>${i.name}</strong><small>${i.rarity} ${i.type} · ${i.description}</small></div><button data-buy="${id}" data-index="${index}" ${S.gold<price?'disabled':''}>${price}g</button></article>`;}).join('');openInteraction(`${keeper}'s wares`,`${rows}<p class="panel-note">Your purse: <b>${S.gold} gold</b></p>`);}
  function openStable(){const owned=S.mounts.includes('windstrider'),price=mountPrice(),shortfall=Math.max(0,price-S.gold);openInteraction('Windstrider Stable',owned?`<div class="feature-card"><h3>Chestnut Windstrider</h3><p>65% faster travel. Your mount waits outside every building.</p><button data-mount="toggle">${S.activeMount?'Dismount':'Ride Windstrider'}</button></div>`:`<div class="feature-card"><h3>Chestnut Windstrider</h3><p>Road-bred, sure-footed, and fast enough to outrun a briar storm.</p><button data-mount="buy" ${shortfall?'disabled':''}>${shortfall?`Need ${shortfall}g more`:`Purchase · ${price}g`}</button></div>`);}
  function openFaction(id){const f=FACTIONS[id],joined=S.faction===id,locked=S.faction&&S.faction!==id;openInteraction(f.name,`<div class="feature-card" style="--accent:${f.color}"><h3>${f.description}</h3><p>${f.gift}</p><p>Ranks: Initiate → Adept → Captain → Paragon</p><button data-consider="${id}" ${joined||locked?'disabled':''}>${joined?'Already joined':locked?`Committed to ${FACTIONS[S.faction].name}`:'Consider pledge'}</button></div>`);}
  function openFactionConfirm(id){const f=FACTIONS[id];openInteraction(`Pledge to ${f.name}?`,`<div class="feature-card faction-confirm" style="--accent:${f.color}"><span class="choice-tag">Permanent commitment</span><h3>${f.gift}</h3><p>This closes the other three faction paths for this journey. Their shops remain open, but their rank abilities and faction questlines will be unavailable.</p><div class="confirm-actions"><button data-faction-cancel="${id}">Not yet</button><button data-join="${id}">Make the pledge</button></div></div>`);}
  function openWaystone(){
    const area=atlasArea();if(area?.hasWaystone&&!S.attunedWaystones.includes(area.id)){S.attunedWaystones.push(area.id);toast(`${area.name} Waystone attuned`);save();}
    const destinations=[['northford','Northford'],S.sideQuests.lensEchoes==='complete'?['guildhall','Guildhall · Eighth Keeper Gate']:null,S.discoveries.includes('Greenwake Vale')?['greenwake','Greenwake Vale']:null,S.discoveries.includes('Moonfall Ruins')?['moonfall','Moonfall Ruins']:null,...S.attunedWaystones.map(id=>[id,ATLAS?.get(id)?.name]).filter(x=>x[1])].filter(Boolean);
    openInteraction('Waystone Network',destinations.map(([id,name])=>`<button class="travel-row" data-travel="${id}" ${S.zone===id?'disabled':''}>✦ ${name}</button>`).join('')+`<p class="panel-note">Attune Waystones while exploring to expand the network.</p>`);
  }
  function eventForArea(area){
    const tiers=['Local','Major','Crisis','Mythic'],tier=tiers[Math.min(3,Math.floor(area.danger/3))],target=4+area.danger;
    return {id:`event:${area.id}:${S.day}`,areaId:area.id,name:pretty(area.eventFamily),tier,status:'active',progress:0,target,expires:S.day+2+Math.min(2,area.danger),reward:90+area.danger*45,xp:45+area.danger*20};
  }
  function ensureAreaEvent(area){if(!area)return;if(area.kind==='settlement'){const old=S.activeEvents[area.id];if(old?.status==='active')old.status='expired';return;}const current=S.activeEvents[area.id];if(current&&current.status!=='expired')return;if((hashNumber(`${area.id}:${S.day}`)%5)===0||area.hasElite)S.activeEvents[area.id]=eventForArea(area);}
  function advanceDay(){
    S.day++;S.economyClock=0;ECON.settleDay(S,ESTATES);
    for(const event of Object.values(S.activeEvents))if(event.status==='active'&&S.day>event.expires)event.status='expired';
    if(S.day%3===0)toast('New world event rumors have reached the Wayfarer Boards');
  }
  function showChapterComplete(){el.chapterSummary.textContent='You recovered the Aether Lens, chose an ally, and opened the route toward the wider Vale. The next chapter begins at the Moonfall Waystone.';show(el.chapterComplete);el.gameScreen.inert=true;paused=true;el.keepExploringBtn.focus();}

  function pretty(text){return String(text).replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());}
  function objective(){const objectives=[['A Voice in the Vale','Find Mira near the lantern plaza'],['The South Road','Leave Northford through the south gate'],['Echoes in Greenwake',`Defeat corrupted echoes · ${Math.min(3,S.mainKills)}/3`],['A Mark in the Briars','Return to Mira in Northford'],['Choose an Ally','Visit the Guildhall and join a faction'],['Road to Moonfall','Take the east road through Greenwake'],['Keeper of the Seal','Defeat the Hollow Warden'],['The Fallen Warden','Collect the Aether Lens'],['The Road Remembers','Explore, grow stronger, and prepare for Chapter II']];return objectives[clamp(S.mainStep,0,objectives.length-1)];}
  function updateHUD(){const stats=combatStats(),hpMax=S.maxHp+(equipped('Armor')?.maxHp||0);el.hpBar.style.width=`${clamp(S.hp/hpMax*100,0,100)}%`;el.manaBar.style.width=`${clamp(S.mana/S.maxMana*100,0,100)}%`;el.stamBar.style.width=`${clamp(S.stam/S.maxStam*100,0,100)}%`;el.hpText.textContent=Math.ceil(S.hp);el.manaText.textContent=Math.ceil(S.mana);el.hpProgress.setAttribute('aria-valuemax',hpMax);el.hpProgress.setAttribute('aria-valuenow',Math.ceil(S.hp));el.manaProgress.setAttribute('aria-valuemax',S.maxMana);el.manaProgress.setAttribute('aria-valuenow',Math.ceil(S.mana));el.stamProgress.setAttribute('aria-valuemax',S.maxStam);el.stamProgress.setAttribute('aria-valuenow',Math.ceil(S.stam));el.levelText.textContent=S.level;el.goldText.textContent=S.gold;const[t,x]=objective();el.objectiveTitle.textContent=t;el.objectiveText.textContent=x;const boss=enemies.find(e=>e.kind==='warden'&&!e.dead);show(el.bossHud,!!boss);if(boss){el.bossBar.style.width=`${Math.max(0,boss.hp/boss.maxHp*100)}%`;el.bossHud.querySelector('span').textContent=atlasArea()?`${pretty(atlasArea().eventFamily)} elite`:'Hollow Warden';}el.attackBtn.querySelector('small').textContent=counterBuff>0?'Counter':'Strike';el.runBtn.setAttribute('aria-pressed',String(runEnabled));el.runBtn.querySelector('small').textContent=sprinting?'Running':runEnabled?'Run on':'Run';if(trackedDoor&&S.zone===(trackedDoor.zone||'northford')){const dx=trackedDoor.x-S.x,dy=trackedDoor.y-S.y,d=Math.hypot(dx,dy);el.destinationHint.textContent=d<80?`${trackedDoor.name} · Walk onto the threshold`:`${Math.abs(dx)>Math.abs(dy)?dx>0?'→':'←':dy>0?'↓':'↑'} ${trackedDoor.name} · ${Math.round(d/10)} steps`;show(el.destinationHint,true);}else if(currentInteract?.door){el.destinationHint.textContent=`${currentInteract.name} · Walk in or tap ${currentInteract.label}`;show(el.destinationHint,true);}else show(el.destinationHint,false);void stats;}
  function promptTutorial(text){el.tutorial.textContent=text;show(el.tutorial);}
  function dismissTutorial(){show(el.tutorial,false);}

  function renderJournal(tab=currentTab){currentTab=tab;el.journalBody.classList.toggle('journal-body--gear',tab==='gear');el.journalBody.classList.toggle('journal-body--economy',tab==='economy');document.querySelectorAll('.journal-tabs button').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)});const [title,text]=objective();
    if(tab==='world'&&(S.zone==='northford'||EX.townDoors.some(d=>d.target===S.zone)||['sluice','vault'].includes(S.zone))){
      const marker=S.zone==='northford'?{x:S.x,y:S.y}:EX.townDoors.find(d=>d.target===S.zone)||EX.townDoors.find(d=>d.target==='cistern');
      el.journalBody.innerHTML=`<div class="town-map" role="img" aria-label="Northford map: blue marker is your position, gold markers are working doors"><img src="assets/northford-twilight.jpg" alt="Northford streets and buildings">${EX.townDoors.map(d=>`<button style="left:${d.x/1672*100}%;top:${d.y/941*100}%" data-track-door="${d.id}" aria-label="Track ${d.name}">${d.icon}</button>`).join('')}<span class="you-marker" style="left:${marker.x/1672*100}%;top:${marker.y/941*100}%">●</span></div><p>Gold signs are working doors. Walk onto the lit threshold or tap Enter. Tap a destination below to track it.</p>${EX.townDoors.map(d=>`<button class="travel-row" data-track-door="${d.id}">${d.icon} ${d.name} <span> · Track</span></button>`).join('')}<div class="journal-card"><h3>Roads beyond town</h3><p>Greenwake Vale: southeast gate. Moonfall: east through Greenwake. The wider Vale opens beyond the first Warden.</p><p>Hold Shift to run; R to dodge. On touch, toggle Run beside the movement stick.</p></div>`;return;
    }
    if(tab==='quest'){const sideNames={lensEchoes:['What the Lens Remembers',S.sideQuests.lensEchoes==='ready'?'Open the sealed Guildhall reliquary.':'Use the Lens to inspect the Moonleaf Press, Stable Trail Map and Sundering Mosaic.'],drownedBell:['The Drowned Bell',S.sideQuests.drownedBell==='ready'?'Claim the reliquary and return to Ada in the Bellkeeper’s House.':S.opened.includes('moonValve')&&S.opened.includes('sunValve')?'Both valves are open. Enter the northern vault.':'Find the southwest cistern. Open the Moon and Sun valves, then recover Ada’s bell.'],apothecary:['Moonleaf Remedy',`Moonleaf ${Math.min(3,S.materials.moonleaf)}/3`],stable:['Clear the Brambles',`Briars ${Math.min(4,S.sideProgress.briars)}/4`],lostScout:['The Lost Scout','Find the Rootbound Cache in southeast Greenwake.'],innRumor:['Beneath the Mooncup','Search the inn fireplace for the hollow brick.'],smithyLedger:['The First Smith','Inspect the old maker’s mark inside Ember & Anvil.']};const side=Object.entries(S.sideQuests).filter(([,v])=>v!=='available').map(([id,status])=>`<div class="journal-card"><div class="journal-row"><h3>${sideNames[id]?.[0]||pretty(id)}</h3><span class="choice-tag">${status}</span></div><p>${sideNames[id]?.[1]||'Follow the local clue.'}</p></div>`).join('');const contracts=Object.values(S.dynamicQuests).filter(q=>q.status!=='complete').map(q=>`<div class="journal-card"><div class="journal-row"><h3>${q.name}</h3><span class="choice-tag">${q.status}</span></div><p>${q.text} · ${q.progress}/${q.target}</p></div>`).join('');el.journalBody.innerHTML=`<div class="journal-card"><span class="choice-tag">Main story · Chapter I</span><h3>${title}</h3><p>${text}</p><div class="progress"><i style="width:${(S.mainStep/8)*100}%"></i></div></div>${side}${contracts||(!side?'<div class="journal-card"><h3>Side quests</h3><p>Talk to townsfolk and read Wayfarer Boards across the world.</p></div>':'')}`;}
    if(tab==='gear'){el.journalBody.innerHTML=window.EVERLIGHT_EQUIPMENT.render(S,gearView);window.EVERLIGHT_EQUIPMENT.paint(el.journalBody,S);}
    if(tab==='skills'){el.journalBody.innerHTML=`<div class="journal-card"><div class="journal-row"><h3>Ability Constellation</h3><strong>${S.skillPoints} point${S.skillPoints===1?'':'s'}</strong></div><p>Unlock abilities in any tree. Your opening path never locks you out.</p></div><div class="skill-grid">${SKILLS.map(s=>{const unlocked=hasSkill(s.id),ready=!s.requires||hasSkill(s.requires);return `<article class="skill-node ${unlocked?'unlocked':''}"><small>${s.tree}</small><h3>${s.name}</h3><p>${s.text}</p><button data-skill="${s.id}" ${unlocked||!ready||S.skillPoints<s.cost?'disabled':''}>${unlocked?'Unlocked':`${s.cost} point${s.cost>1?'s':''}`}</button></article>`}).join('')}</div>`;}
    if(tab==='factions'){el.journalBody.innerHTML=S.faction?`<div class="journal-card"><span class="choice-tag">Your faction</span><h3>${FACTIONS[S.faction].name}</h3><p>${FACTIONS[S.faction].description}</p><div class="progress"><i style="width:${Math.min(100,S.factionRep[S.faction]/7)}%"></i></div><p>${S.factionRep[S.faction]} reputation · Next rank at 100</p></div>`:`<div class="journal-card"><h3>No faction chosen</h3><p>Visit Northford Guildhall. Faction commitments unlock rank rewards, gear, abilities, and questlines.</p></div>`;}
    if(tab==='world'){const z=zone(),area=atlasArea(),event=area?S.activeEvents[area.id]:null,neighbors=area?Object.values(area.exits).map(id=>ATLAS.get(id)?.name).filter(Boolean):[];el.journalBody.innerHTML=`<div class="journal-card"><h3>${z.name} · Day ${S.day}</h3><p>${z.subtitle}${area?` · Recommended level ${area.recommendedLevel} · Danger ${area.danger}`:''}</p></div><div class="journal-card"><h3>World atlas · ${S.atlasDiscovered.length}/${ATLAS?.totalAreas||288}</h3><p>${area?`Roads: ${neighbors.join(' · ')}`:S.discoveries.join(' · ')}</p><div class="progress"><i style="width:${S.atlasDiscovered.length/(ATLAS?.totalAreas||288)*100}%"></i></div></div>${event?`<div class="journal-card"><span class="choice-tag">${event.tier} world event · ${event.status}</span><h3>${event.name}</h3><p>${event.progress}/${event.target} threats · Expires after day ${event.expires} · Reward ${event.reward}g</p></div>`:'<div class="journal-card"><h3>No local crisis</h3><p>Events rotate by adventure day and can change regional demand.</p></div>'}<div class="journal-card"><h3>Vehicles</h3><p>Windstrider: ${S.mounts.length?'Owned':'Not owned'} · Skiff: ${S.vehicles.skiff?'Built':'Plans missing'} · Airship parts: ${S.vehicles.airshipParts}/3</p></div>`;}
    if(tab==='economy'){el.journalBody.innerHTML=ECON.render(S,ESTATES,estateView);}
    if(tab==='settings'){el.journalBody.innerHTML=`${settingRow('Sound effects','sound')}${settingRow('Haptics','haptics')}${settingRow('Reduced motion','reducedMotion')}${settingRow('High contrast','highContrast')}${settingRow('Left-handed controls','leftHanded')}${settingRow('Story assist · less damage, stronger attacks','assistMode')}<div class="setting"><strong>Save progress</strong><button data-save>Save now</button></div><div class="setting"><strong>Start over</strong><button data-reset class="danger-btn">Reset save</button></div>`;}
  }
  function settingRow(label,key){return `<div class="setting"><strong>${label}</strong><button role="switch" aria-checked="${S.settings[key]}" class="${S.settings[key]?'on':''}" data-setting="${key}">${S.settings[key]?'On':'Off'}</button></div>`;}
  function openJournal(tab='quest'){if(el.gameScreen.classList.contains('is-hidden'))return;restoreFocus=document.activeElement;paused=true;el.gameScreen.inert=true;show(el.journal);renderJournal(tab);requestAnimationFrame(()=>el.closeJournal.focus());}
  function closeJournal(){show(el.journal,false);el.gameScreen.inert=false;paused=false;last=performance.now();restoreFocus?.focus?.();restoreFocus=null;}

  function handleUiAction(target){
    const estateTrack=target.closest('[data-estate-track]');if(estateTrack){const def=ESTATES.find(d=>d.id===estateTrack.dataset.estateTrack);if(def){trackedDoor={name:S.properties[def.id]?.name||def.name,x:def.x,y:def.y,zone:def.settlementId||def.zone};closeJournal();toast(`Tracked ${trackedDoor.name} · ${def.regionName}`);}return;}
    const estateAction=target.closest('[data-estate-buy],[data-estate-develop],[data-estate-upgrade]');
    if(estateAction){let result;if(estateAction.dataset.estateBuy)result=ECON.buy(S,estateAction.dataset.estateBuy,ESTATES);else if(estateAction.dataset.estateDevelop)result=ECON.develop(S,estateAction.dataset.estateDevelop,estateAction.dataset.business,ESTATES);else result=ECON.upgrade(S,estateAction.dataset.estateUpgrade,estateAction.dataset.track,ESTATES);estateView.message=result.message;if(result.ok){save();sfx('success');}updateHUD();renderJournal('economy');return;}
    const estateSelect=target.closest('[data-estate-select]');if(estateSelect){estateView.selectedId=estateSelect.dataset.estateSelect||null;estateView.message='';renderJournal('economy');return;}
    const estateTab=target.closest('[data-estate-view]');if(estateTab){estateView.view=estateTab.dataset.estateView;estateView.selectedId=null;estateView.message='';renderJournal('economy');return;}
    const estateRegion=target.closest('[data-estate-region]');if(estateRegion){estateView.region=estateRegion.dataset.estateRegion;estateView.selectedId=null;renderJournal('economy');return;}
    const track=target.closest('[data-track-door]');if(track){trackedDoor=EX.townDoors.find(d=>d.id===track.dataset.trackDoor);closeJournal();toast(`Tracking ${trackedDoor.name}`);return;}
    const acceptQuest=target.closest('[data-accept-quest]');if(acceptQuest){const id=acceptQuest.dataset.acceptQuest,area=atlasArea(),q=areaQuest(area);if(q&&q.id===id){q.status='active';q.progress=S.areaKills[q.targetAreaId||area.id]||0;q.progress=Math.min(q.target,q.progress);if(q.progress>=q.target)q.status='ready';S.dynamicQuests[id]=q;save();closeInteraction();toast('Contract accepted · Track it in Quests');}return;}
    const propertyBuy=target.closest('[data-property-buy]');if(propertyBuy){estateView.message=ECON.buy(S,propertyBuy.dataset.propertyBuy,ESTATES).message;save();updateHUD();renderJournal('economy');return;}
    const propertyUpgrade=target.closest('[data-property-upgrade]');if(propertyUpgrade){estateView.message=ECON.upgrade(S,propertyUpgrade.dataset.propertyUpgrade,'quality',ESTATES).message;save();updateHUD();renderJournal('economy');return;}
    const buy=target.closest('[data-buy]');if(buy){const item=ITEM_TEMPLATES[buy.dataset.buy],price=priceFor(item);if(S.gold>=price){S.gold-=price;const gained=addItem(item.id);lootMessage(`Purchased · ${gained.name}`,gained.rarity);save();openShop(currentInteract?.shop||'smithy',currentInteract?.name||'Merchant');}return;}
    const filter=target.closest('[data-gear-filter]');if(filter){gearView.filter=filter.dataset.gearFilter;gearView.selectedUid=null;gearView.message='';renderJournal('gear');return;}
    const inspect=target.closest('[data-inspect]');if(inspect){gearView.selectedUid=inspect.dataset.inspect;gearView.message='';renderJournal('gear');return;}
    const equip=target.closest('[data-equip]');if(equip){const item=itemByUid(equip.dataset.equip);if(item&&['Weapon','Armor','Charm'].includes(item.type)){S.equipment[item.type]=item.uid;S.hp=Math.min(S.hp,combatStats().maxHp);gearView.message=`${item.name} equipped. Character stats updated.`;save();renderJournal('gear');updateHUD();}return;}
    const unequip=target.closest('[data-unequip]');if(unequip&&['Weapon','Armor','Charm'].includes(unequip.dataset.unequip)){S.equipment[unequip.dataset.unequip]=null;S.hp=Math.min(S.hp,combatStats().maxHp);gearView.message='Slot cleared. Item remains in your pack.';save();renderJournal('gear');updateHUD();return;}
    const upgrade=target.closest('[data-upgrade]');if(upgrade){const item=itemByUid(upgrade.dataset.upgrade),cost=item&&window.EVERLIGHT_EQUIPMENT.upgradeCost(item);if(cost&&S.gold>=cost.gold&&(S.materials[cost.material]||0)>=cost.amount){S.gold-=cost.gold;S.materials[cost.material]-=cost.amount;item.rank=(item.rank||0)+1;gearView.message=`${item.name} upgraded to ${item.rank} of 5 stars. Stats updated.`;sfx('success');save();}else gearView.message=cost?'Not enough gold or crafting materials.':'This item cannot be upgraded further.';renderJournal('gear');updateHUD();return;}
    const use=target.closest('[data-use]');if(use){const index=S.inventory.findIndex(i=>i.uid===use.dataset.use),item=S.inventory[index];if(item?.type==='Consumable'){if(!(item.heal&&S.hp<combatStats().maxHp)&&!(item.mana&&S.mana<S.maxMana)){gearView.message='Already restored. Item kept in your pack.';renderJournal('gear');return;}if(item.heal)S.hp=Math.min(combatStats().maxHp,S.hp+item.heal);if(item.mana)S.mana=Math.min(S.maxMana,S.mana+item.mana);S.inventory.splice(index,1);gearView.selectedUid=null;gearView.message=`${item.name} used.`;save();renderJournal('gear');updateHUD();}return;}
    const skill=target.closest('[data-skill]');if(skill){const node=SKILLS.find(s=>s.id===skill.dataset.skill);if(node&&S.skillPoints>=node.cost&&(!node.requires||hasSkill(node.requires))){S.skillPoints-=node.cost;S.skills.push(node.id);sfx('success');toast(`${node.name} unlocked`);save();renderJournal('skills');}return;}
    const consider=target.closest('[data-consider]');if(consider&&!S.faction){openFactionConfirm(consider.dataset.consider);return;}
    const factionCancel=target.closest('[data-faction-cancel]');if(factionCancel){openFaction(factionCancel.dataset.factionCancel);return;}
    const join=target.closest('[data-join]');if(join&&!S.faction){S.faction=join.dataset.join;S.factionRep[S.faction]=25;if(S.faction==='ashen'){S.maxMana+=18;S.mana=S.maxMana;}S.mainStep=Math.max(S.mainStep,5);sfx('success');save();closeInteraction();subtitle(`${FACTIONS[S.faction].name} welcomes you. The Moonfall road is open.`,3);return;}
    const mount=target.closest('[data-mount]');if(mount){if(mount.dataset.mount==='buy'){const price=mountPrice();if(S.gold>=price){S.gold-=price;S.mounts.push('windstrider');S.activeMount='windstrider';sfx('success');save();openStable();}}else{S.activeMount=S.activeMount?null:'windstrider';save();openStable();}return;}
    const travel=target.closest('[data-travel]');if(travel){closeInteraction();enterZone(travel.dataset.travel);save();return;}
    const setting=target.closest('[data-setting]');if(setting){const key=setting.dataset.setting;S.settings[key]=!S.settings[key];applySettings();save();renderJournal('settings');return;}
    if(target.closest('[data-save]')){save();toast('Journey saved');return;}
    if(target.closest('[data-reset]')){if(confirm('Erase this journey and begin again?')){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(LEGACY_SAVE_KEY);location.reload();}return;}
    const econ=target.closest('[data-economy]');if(econ){if(econ.dataset.economy==='collect'){const amount=Math.max(0,S.treasury);S.gold+=amount;S.treasury-=amount;estateView.message=amount?`${amount} gold transferred to your purse.`:'No positive treasury balance to transfer.';}else{advanceDay();estateView.message=`Day ${S.day} settled. Profits and expenses are recorded below.`;}save();updateHUD();renderJournal('economy');return;}
    const prop=target.closest('[data-property]');if(prop){openEstate('estate:smithy');return;}
  }

  function spawnBurst(x,y,color,count){for(let i=0;i<count;i++){const a=random(0,Math.PI*2),sp=random(20,105);particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:random(.25,.7),max:.7,color,size:random(2,5)});}}
  function floatText(x,y,text,color){damageTexts.push({x,y,text,color,life:.85});}
  function drawWorldSurroundings(z,art){
    // The safe camera may look beyond collision bounds. Continue the scenery into
    // a dim, non-walkable backdrop rather than exposing the cleared canvas.
    const left=camera.x-8,top=camera.y-8,w=VIEW_W+16,h=VIEW_H+16;
    if(left>=0&&top>=0&&left+w<=z.width&&top+h<=z.height)return;
    ctx.save();ctx.fillStyle=z.type==='room'||z.type==='interior'?'#252b27':z.tint||'#16372f';ctx.fillRect(left,top,w,h);
    if(imageReady.bg&&z.type!=='interior'&&z.type!=='room'){
      // A foliage-only patch has no roads, doors or buildings: overscan must not
      // invent seemingly enterable destinations outside the actual world.
      const tileW=230,tileH=110;
      for(let y=Math.floor(top/tileH)*tileH;y<top+h;y+=tileH)for(let x=Math.floor(left/tileW)*tileW;x<left+w;x+=tileW){
        if(x>=0&&x+tileW<=z.width&&y>=0&&y+tileH<=z.height)continue;
        const flip=Math.abs(Math.round(x/tileW))%2;ctx.save();ctx.translate(x+(flip?tileW:0),y);ctx.scale(flip?-1:1,1);ctx.drawImage(bg,40,830,230,110,0,0,tileW,tileH);ctx.restore();
      }
      ctx.fillStyle='rgba(14,37,32,.28)';ctx.fillRect(left,top,w,h);
    }else{
      const indoors=z.type==='room'||z.type==='interior';
      for(let y=Math.floor(top/48)*48;y<top+h;y+=48)for(let x=Math.floor(left/64)*64;x<left+w;x+=64){
        if(x>0&&x<z.width-64&&y>0&&y<z.height-48)continue;
        const seed=hashNumber(`${S.zone}:${x}:${y}`);ctx.fillStyle=indoors?(seed%2?'#394039':'#303a34'):(seed%2?'#24493b':'#1b4035');
        if(indoors)ctx.fillRect(x+(Math.abs(y/48)%2)*16,y,60,44);else{ctx.beginPath();ctx.ellipse(x+(seed%20),y,40,27,0,0,7);ctx.fill();}
      }
    }
    ctx.restore();
  }
  function drawWorld(){const z=zone(),interior=INTERIOR_LAYOUTS[S.zone],art=interior&&imageReady.interiors[S.zone]?interiorArt[S.zone]:z.type==='town'&&imageReady.bg?bg:z.type==='wild'&&imageReady.greenwake?greenwakeBg:z.type==='ruins'&&imageReady.moonfall?moonfallBg:null;drawWorldSurroundings(z,art);if(z.type==='room')EX.drawRoom(ctx,z,solidRects());else if(z.type==='atlas')drawAtlasWorld(z.area,z);else{if(art){ctx.drawImage(art,0,0,z.width,z.height);ctx.fillStyle=z.type==='town'?'rgba(5,28,22,.08)':z.type==='interior'?'rgba(3,10,9,.03)':'rgba(2,18,15,.05)';ctx.fillRect(0,0,z.width,z.height);}else{const grad=ctx.createLinearGradient(0,0,0,z.height);grad.addColorStop(0,z.tint);grad.addColorStop(1,'#071713');ctx.fillStyle=grad;ctx.fillRect(0,0,z.width,z.height);drawGroundPattern(z);}}const development=landBuilding(S.zone);if(development)EX.drawHouse(ctx,development);for(const d of decor)drawDecor(d);}
  function drawAtlasWorld(area,z){
    const grad=ctx.createLinearGradient(0,0,z.width,z.height);grad.addColorStop(0,area.palette[0]);grad.addColorStop(.62,area.palette[1]);grad.addColorStop(1,'#071713');ctx.fillStyle=grad;ctx.fillRect(0,0,z.width,z.height);
    ctx.save();ctx.globalAlpha=.22;ctx.fillStyle=area.palette[2];for(let i=0;i<28;i++){const seed=hashNumber(`${area.id}:ground:${i}`),x=seed%z.width,y=(seed>>>9)%z.height,r=45+(seed%95);ctx.beginPath();ctx.ellipse(x,y,r,r*.55,(seed%30)/10,0,7);ctx.fill();}ctx.restore();
    ctx.save();ctx.strokeStyle='rgba(236,215,157,.26)';ctx.lineWidth=54;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(70,550);ctx.bezierCurveTo(520,470,1180,650,1730,550);ctx.stroke();ctx.strokeStyle='rgba(44,30,20,.28)';ctx.lineWidth=3;ctx.setLineDash([10,16]);ctx.stroke();ctx.restore();
    if(area.kind==='settlement')for(const b of EX.homes(area))EX.drawHouse(ctx,b);
    if(area.kind==='dungeon'){ctx.save();ctx.translate(900,390);ctx.fillStyle='rgba(4,10,12,.78)';ctx.fillRect(-105,-70,210,140);ctx.fillStyle=area.palette[2];ctx.fillRect(-42,-50,84,120);ctx.strokeStyle='rgba(180,255,238,.42)';ctx.lineWidth=5;ctx.strokeRect(-42,-50,84,120);ctx.restore();}
  }
  function drawGroundPattern(z){ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=z.type==='ruins'?'#86aab4':'#8ebc8c';ctx.lineWidth=2;for(let y=80;y<z.height;y+=90){ctx.beginPath();for(let x=0;x<z.width;x+=48){ctx.lineTo(x,y+Math.sin(x*.02+y)*12);}ctx.stroke();}ctx.restore();}
  function drawDecor(d){ctx.save();ctx.translate(d.x,d.y);ctx.scale(d.s,d.s);if(d.kind==='tree'){ctx.fillStyle='#0d2419';ctx.fillRect(-5,-12,10,30);ctx.fillStyle='#173f28';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc((i-1)*11,-18-i*10,24-i*3,0,7);ctx.fill();}}else if(d.kind==='rock'||d.kind==='pillar'){ctx.fillStyle=d.kind==='pillar'?'#57696b':'#394d43';ctx.beginPath();ctx.moveTo(-15,12);ctx.lineTo(-10,-18);ctx.lineTo(9,-24);ctx.lineTo(17,10);ctx.closePath();ctx.fill();}else if(d.kind==='crystal'){ctx.fillStyle='#68dccc88';ctx.shadowColor='#6affea';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(10,4);ctx.lineTo(0,15);ctx.lineTo(-10,4);ctx.closePath();ctx.fill();}else if(d.kind==='lamp'){ctx.strokeStyle='#9b7948';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,14);ctx.lineTo(0,-14);ctx.stroke();ctx.fillStyle='#ffe491';ctx.shadowColor='#ffc85c';ctx.shadowBlur=15;ctx.fillRect(-4,-18,8,9);}else if(d.kind==='table'){ctx.fillStyle='#5a3c26';ctx.fillRect(-18,-10,36,20);}else{ctx.fillStyle='#84b875';ctx.fillRect(-2,-8,4,14);ctx.fillStyle='#d8a8dc';ctx.fillRect(-6,-11,12,5);}ctx.restore();}
  function shadow(x,y,r){ctx.save();ctx.globalAlpha=.42;ctx.fillStyle='#00100e';ctx.beginPath();ctx.ellipse(x,y,r,r*.34,0,0,7);ctx.fill();ctx.restore();}
  function drawDoor(o){
    const near=distance(S,o)<170,locked=o.target==='vault'&&(!S.opened.includes('moonValve')||!S.opened.includes('sunValve'));
    ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#17211b';ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-16,-28);ctx.quadraticCurveTo(-16,-45,0,-45);ctx.quadraticCurveTo(16,-45,16,-28);ctx.lineTo(16,0);ctx.closePath();ctx.fill();ctx.strokeStyle=locked?'#777e77':'#a89163';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#735137';ctx.fillRect(-12,-30,24,30);ctx.fillStyle='#96704a';ctx.fillRect(-10,-29,3,28);ctx.fillRect(-3,-34,3,33);ctx.fillRect(4,-29,3,28);ctx.fillStyle='#332b23';ctx.fillRect(-12,-24,24,3);ctx.fillRect(-12,-7,24,3);ctx.fillStyle='#edce83';ctx.fillRect(8,-16,3,4);ctx.fillStyle=locked?'#46504b':'#b7a77c';ctx.fillRect(-21,0,42,6);ctx.fillStyle=locked?'#304a4022':'#e9c96a33';ctx.beginPath();ctx.moveTo(-15,2);ctx.lineTo(15,2);ctx.lineTo(28,22);ctx.lineTo(-28,22);ctx.closePath();ctx.fill();
    ctx.fillStyle='#b39a5c';ctx.fillRect(26,-46,3,52);ctx.fillStyle='#10261fe8';ctx.fillRect(17,-59,24,25);ctx.strokeStyle='#b8a467';ctx.lineWidth=1;ctx.strokeRect(17,-59,24,25);ctx.fillStyle='#ffe5a2';ctx.textAlign='center';ctx.font='16px Georgia';ctx.fillText(locked?'⊗':o.icon||'⌂',29,-41);
    if(near){ctx.strokeStyle='#ffe5a2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-22,10);ctx.lineTo(22,10);ctx.stroke();}
    ctx.restore();
  }
  function drawSecretClue(o){ctx.save();ctx.translate(o.x,o.y);ctx.strokeStyle='#c2a36f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,6);ctx.lineTo(-2,0);ctx.lineTo(3,5);ctx.lineTo(12,-3);ctx.stroke();ctx.fillStyle='#f5dc9c';ctx.globalAlpha=.5+.3*Math.sin(performance.now()/650);ctx.fillRect(4,-6,3,3);ctx.restore();}
  function drawDirectory(o){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#604932';ctx.fillRect(-26,-52,52,39);ctx.fillRect(-22,-13,5,24);ctx.fillRect(17,-13,5,24);ctx.fillStyle='#d7c699';ctx.fillRect(-21,-47,42,28);ctx.strokeStyle='#705f43';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-15,-30);ctx.lineTo(10,-38);ctx.lineTo(15,-23);ctx.moveTo(0,-44);ctx.lineTo(2,-23);ctx.stroke();ctx.restore();}
  function drawChest(o){const opened=S.opened.includes(o.id);shadow(o.x,o.y+8,24);ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#30251e';ctx.fillRect(-22,-16,44,28);ctx.fillStyle='#765035';ctx.fillRect(-19,-12,38,22);ctx.fillStyle='#aa7a44';ctx.fillRect(-19,-12,38,6);ctx.fillStyle='#503521';ctx.fillRect(-19,0,38,3);if(opened){ctx.fillStyle='#171e17';ctx.fillRect(-17,-17,34,13);ctx.fillStyle='#8d663e';ctx.fillRect(-22,-30,44,12);ctx.fillStyle='#c9ab67';ctx.fillRect(-22,-30,44,3);}else{ctx.fillStyle='#b8894c';ctx.fillRect(-22,-20,44,9);ctx.fillStyle='#d1a762';ctx.fillRect(-19,-23,38,4);}ctx.fillStyle='#d5ba70';for(const x of[-15,11])ctx.fillRect(x,opened?-12:-20,4,30);ctx.fillStyle='#f5d98a';ctx.fillRect(-4,-9,8,10);ctx.fillStyle='#594226';ctx.fillRect(-1,-6,2,4);ctx.restore();}
  function drawAdventureObject(o){
    if(o.id==='ada'){drawNpc({...o,kind:'localNpc'});return;}
    ctx.save();ctx.translate(o.x,o.y);
    if(o.id.endsWith('Valve')){ctx.fillStyle='#263c40';ctx.fillRect(-16,-8,32,24);ctx.strokeStyle=S.opened.includes(o.id)?'#84e6c2':'#d7b778';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,-12,17,0,7);ctx.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2+(S.opened.includes(o.id)?Math.PI/4:0);ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(Math.cos(a)*16,-12+Math.sin(a)*16);ctx.stroke();}}
    else{ctx.fillStyle='#3a3029';ctx.fillRect(-24,-15,48,28);ctx.fillStyle='#b8964e';ctx.fillRect(-24,-20,48,10);ctx.strokeStyle='#e8d18e';ctx.strokeRect(-24,-20,48,33);ctx.fillStyle='#eed18b';ctx.fillRect(-4,-8,8,12);}
    if(distance(S,o)<150){ctx.font='600 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#07130f';const w=ctx.measureText(o.name).width+16;ctx.fillRect(-w/2,-60,w,22);ctx.fillStyle='#fff0b5';ctx.fillText(o.name,0,-44);}ctx.restore();
  }
  function drawHero(){const moving=Math.hypot(input.x,input.y)>.12||[...keys].some(k=>/Arrow|Key[WASD]/.test(k));ctx.save();if(invuln>0&&Math.floor(invuln*20)%2===0)ctx.globalAlpha=.45;window.EVERLIGHT_ACTORS.draw(ctx,{id:'player',name:'Roadbearer',x:S.x,y:S.y,time:performance.now()/1000*(sprinting?1.4:1),moving,facing:lastFacing,role:S.style,player:true,attacking:attackCd>.18,casting:spellCd>.78,mounted:!!S.activeMount&&zone().type!=='interior'&&zone().type!=='room'});ctx.restore();}
  function drawNpc(o){window.EVERLIGHT_ACTORS.draw(ctx,{id:o.id,name:o.name,x:o.x,y:o.y,time:performance.now()/1000,moving:false,facing:distance(S,o)<130?{x:S.x-o.x,y:S.y-o.y}:{x:0,y:1},role:o.kind==='atlasShop'?'merchant':o.kind==='faction'?'guild':undefined});}
  function drawCompanion(){if(!companionActive())return;window.EVERLIGHT_ACTORS.draw(ctx,{id:'mira',name:'Mira',x:companion.x,y:companion.y,time:performance.now()/1000,moving:distance(companion,S)>60,facing:lastFacing,role:'scout'});}
  function drawObject(o){if(o.door){drawDoor(o);return;}if(o.kind==='adventure'){drawAdventureObject(o);return;}if(o.kind==='directory'){drawDirectory(o);return;}if(o.secret&&distance(S,o)>210&&!S.opened.includes(o.id)){drawSecretClue(o);return;}if(o.kind==='npc'||o.kind==='shop'||o.kind==='rest'||o.kind==='stable'||o.kind==='faction'||o.kind==='localNpc'||o.kind==='atlasNpc'||o.kind==='atlasShop')drawNpc(o);else if(o.kind==='portal'){ctx.save();ctx.translate(o.x,o.y);const pulse=1+Math.sin(performance.now()/260+o.x)*.12;ctx.scale(pulse,pulse);ctx.fillStyle='#ffe086';ctx.shadowColor='#ffd15b';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff4ba';ctx.lineWidth=2;ctx.stroke();ctx.restore();}else if(o.kind==='waystone'){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#62e4d0';ctx.shadowColor='#69ffea';ctx.shadowBlur=22;ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(14,0);ctx.lineTo(0,28);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.restore();}else if(o.kind==='chest'){drawChest(o);}else if(o.kind==='lore'||o.kind==='atlasLore'){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#77e6d2';ctx.shadowColor='#68ffe7';ctx.shadowBlur=10;ctx.rotate(Math.PI/4);ctx.fillRect(-8,-8,16,16);ctx.restore();}else if(o.kind==='notice'){ctx.fillStyle='#583b25';ctx.fillRect(o.x-26,o.y-32,52,48);ctx.fillStyle='#d5c590';ctx.fillRect(o.x-19,o.y-26,38,31);ctx.fillStyle='#2f2118';ctx.fillRect(o.x-3,o.y+14,6,28);}else if(o.kind==='property'||o.kind==='estate'){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle=S.properties[o.estateId||atlasArea()?.id]?'#64d69b':'#d8b65e';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(20,-3);ctx.lineTo(13,22);ctx.lineTo(-13,22);ctx.lineTo(-20,-3);ctx.closePath();ctx.fill();ctx.fillStyle='#19352b';ctx.fillRect(-5,4,10,18);ctx.restore();}if(distance(S,o)<150){ctx.save();ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff3c5';ctx.strokeStyle='#04110e';ctx.lineWidth=4;const labelY=o.y-(['npc','shop','rest','stable','faction','localNpc','atlasNpc','atlasShop'].includes(o.kind)?72:42);ctx.strokeText(o.name,o.x,labelY);ctx.fillText(o.name,o.x,labelY);ctx.restore();}}
  function drawEnemyTelegraph(e){const pulse=.5+.5*Math.sin(performance.now()/45);ctx.save();ctx.translate(e.x,e.y);ctx.strokeStyle=`rgba(255,73,56,${.68+.25*pulse})`;ctx.fillStyle=`rgba(255,45,34,${.09+.07*pulse})`;ctx.lineWidth=4;if(e.attackKind==='radial'){ctx.beginPath();ctx.arc(0,0,e.r+72*(1-e.stateTimer/e.telegraphDuration),0,7);ctx.fill();ctx.stroke();}else if(e.attackKind==='bolt'){ctx.rotate(Math.atan2(e.attackDir.y,e.attackDir.x));ctx.beginPath();ctx.moveTo(e.r,0);ctx.lineTo(230,-18);ctx.lineTo(230,18);ctx.closePath();ctx.fill();ctx.stroke();}else{ctx.rotate(Math.atan2(e.attackDir.y,e.attackDir.x));ctx.beginPath();ctx.moveTo(2,-e.r*.8);ctx.lineTo(e.r+76,-34);ctx.lineTo(e.r+76,34);ctx.lineTo(2,e.r*.8);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();}
  function drawEnemy(e){if(e.state==='windup')drawEnemyTelegraph(e);shadow(e.x,e.y+e.r*.72,e.r*.9);ctx.save();ctx.translate(e.x,e.y);if(e.flash>0)ctx.filter='brightness(3)';let rot=0,scaleX=1,scaleY=1,offset=0;if(e.state==='windup'){const p=1-e.stateTimer/e.telegraphDuration;scaleX=1-.12*p;scaleY=1+.16*p;rot=Math.sin(p*Math.PI)*-.12;}if(e.state==='attack'){offset=10;scaleX=1.2;scaleY=.84;}if(e.state==='recover'){scaleX=1.08;scaleY=.92;}ctx.rotate(rot);ctx.translate(e.attackDir.x*offset,e.attackDir.y*offset);ctx.scale(scaleX,scaleY);if(e.kind==='wisp'){ctx.shadowColor='#69ffe8';ctx.shadowBlur=18;ctx.fillStyle='#74f4dd55';ctx.beginPath();ctx.arc(0,0,22,0,7);ctx.fill();ctx.fillStyle='#cafff3';ctx.beginPath();ctx.moveTo(0,-17);ctx.quadraticCurveTo(21,0,0,21);ctx.quadraticCurveTo(-21,0,0,-17);ctx.fill();ctx.fillStyle='#153b39';ctx.fillRect(-7,-4,4,4);ctx.fillRect(3,-4,4,4);}else if(e.kind==='warden'&&imageReady.warden){ctx.shadowColor='#69ffe8';ctx.shadowBlur=12;ctx.drawImage(wardenArt,-66,-94,132,122);}else{ctx.shadowColor=e.kind==='briar'?'#8ecf63':'#69ffe8';ctx.shadowBlur=10;ctx.fillStyle=e.kind==='briar'?'#45662f':'#536b65';ctx.beginPath();ctx.moveTo(0,-e.r*1.25);ctx.lineTo(e.r,-e.r*.55);ctx.lineTo(e.r*1.05,e.r*.75);ctx.lineTo(0,e.r);ctx.lineTo(-e.r*1.05,e.r*.75);ctx.lineTo(-e.r,-e.r*.55);ctx.closePath();ctx.fill();ctx.strokeStyle=e.kind==='briar'?'#9cbb62':'#9cb3a8';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ff685e';ctx.fillRect(-e.r*.45,-e.r*.55,e.r*.3,5);ctx.fillRect(e.r*.15,-e.r*.55,e.r*.3,5);}ctx.restore();if(e.hp<e.maxHp){ctx.fillStyle='#07100e';ctx.fillRect(e.x-e.r,e.y-e.r-19,e.r*2,6);ctx.fillStyle='#ed6d5b';ctx.fillRect(e.x-e.r+1,e.y-e.r-18,(e.r*2-2)*e.hp/e.maxHp,4);}}
  function drawLoot(){for(const d of loot){const bob=Math.sin(performance.now()/140+d.x)*3;ctx.save();ctx.translate(d.x,d.y+bob);if(d.kind==='gold'){ctx.fillStyle='#ffd963';ctx.shadowColor='#ffcb4f';ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,7);ctx.fill();ctx.strokeStyle='#8d5e1d';ctx.stroke();}else{const color=RARITY[d.rarity||ITEM_TEMPLATES[d.itemId]?.rarity||'Uncommon'];ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=14;ctx.fillRect(-7,-7,14,14);ctx.globalAlpha=.25;ctx.fillRect(-2,-Math.min(120,d.age*35+28),4,Math.min(120,d.age*35+28));}ctx.restore();}}
  function drawProjectiles(){for(const p of projectiles){const friendly=p.kind==='player'||p.kind==='companion';ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor=friendly?'#68ffec':'#ff755f';ctx.shadowBlur=18;ctx.fillStyle=p.kind==='companion'?'#fff1a0':friendly?'#bcfff5':'#ff9278';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.strokeStyle=friendly?'#63ebdb':'#bf3b32';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();}}
  function drawEffects(){for(const p of particles){ctx.save();ctx.globalAlpha=clamp(p.life/(p.max||1),0,1);if(p.kind==='slash'){ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle=p.color;ctx.lineWidth=5+p.size;ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,28+p.size*4,-1.2,1.2);ctx.stroke();}else{ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.restore();}for(const t of damageTexts){ctx.save();ctx.globalAlpha=t.life/.85;ctx.fillStyle=t.color;ctx.strokeStyle='#06100e';ctx.lineWidth=3;ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.strokeText(t.text,t.x,t.y);ctx.fillText(t.text,t.x,t.y);ctx.restore();}}
  function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,VIEW_W,VIEW_H);const sx=S.settings.reducedMotion?0:random(-shake,shake),sy=S.settings.reducedMotion?0:random(-shake,shake);ctx.save();ctx.translate(-camera.x+sx,-camera.y+sy);drawWorld();const objects=objectsForZone(),isNpc=o=>['npc','shop','rest','stable','faction','localNpc','atlasNpc','atlasShop'].includes(o.kind);for(const o of objects.filter(o=>!isNpc(o)))drawObject(o);const actors=[...objects.filter(isNpc).map(o=>({y:o.y,type:'npc',o})),...enemies.filter(e=>!e.dead).map(e=>({y:e.y,type:'enemy',o:e})),...(companionActive()?[{y:companion.y,type:'companion'}]:[]),{y:S.y,type:'hero'}].sort((a,b)=>a.y-b.y);for(const a of actors){if(a.type==='hero')drawHero();else if(a.type==='companion')drawCompanion();else if(a.type==='npc')drawObject(a.o);else drawEnemy(a.o);}drawLoot();drawProjectiles();drawEffects();ctx.restore();if(hurtFlash>0){ctx.fillStyle=`rgba(255,55,40,${hurtFlash*.35})`;ctx.fillRect(0,0,VIEW_W,VIEW_H);}if(screenFlash>0){ctx.fillStyle=`rgba(170,255,235,${screenFlash*.42})`;ctx.fillRect(0,0,VIEW_W,VIEW_H);}}

  function update(dt){if(paused)return;S.playTime+=dt;S.economyClock=(S.economyClock||0)+dt;if(S.economyClock>=300){advanceDay();toast(`Day ${S.day} · Business accounts settled`);save();}saveClock+=dt;zoneGrace=Math.max(0,zoneGrace-dt);updatePlayer(dt);updateEnemies(dt);updateCompanion(dt);updateProjectiles(dt);updateLoot(dt);updateEffects(dt);updateInteraction();updateHUD();updateCamera(dt);el.attackCooldown.style.height=`${attackCd/.42*100}%`;el.spellCooldown.style.height=`${spellCd/1.05*100}%`;el.dodgeCooldown.style.height=`${dodgeCd/.82*100}%`;if(saveClock>4){save();saveClock=0;}}
  function loop(now){if(!running)return;const dt=Math.min(.034,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop);}

  function isStandalone(){return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;}
  function fullscreenActive(){return!!(document.fullscreenElement||document.webkitFullscreenElement);}
  function updateFullscreenButton(){const active=fullscreenActive();el.fullscreenBtn.textContent=active?'×':'⛶';el.fullscreenBtn.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');if(isStandalone())show(el.fullscreenBtn,false);}
  async function toggleFullscreen(){wakeAudio();try{if(fullscreenActive()){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)await exit.call(document);}else{const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;if(!request)throw new Error('unsupported');await request.call(document.documentElement,{navigationUI:'hide'});}setTimeout(syncViewport,100);}catch(_){toast('For fullscreen: tap Share, then Add to Home Screen');}updateFullscreenButton();}
  function joyMove(e){const r=el.joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.hypot(dx,dy),lim=r.width*.31;input.x=m?dx/Math.max(m,lim):0;input.y=m?dy/Math.max(m,lim):0;const k=Math.min(lim,m);el.joyKnob.style.transform=`translate(${m?dx/m*k:0}px,${m?dy/m*k:0}px)`;}

  el.joystick.addEventListener('pointerdown',e=>{e.preventDefault();pointerId=e.pointerId;el.joystick.setPointerCapture?.(pointerId);joyMove(e);wakeAudio();});
  el.joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointerId)joyMove(e);});
  const joyEnd=e=>{if(pointerId!==null&&e.pointerId!==pointerId)return;pointerId=null;input.x=input.y=0;el.joyKnob.style.transform='';};el.joystick.addEventListener('pointerup',joyEnd);el.joystick.addEventListener('pointercancel',joyEnd);
  [['attackBtn',attack],['spellBtn',castSpell],['dodgeBtn',dodge],['interactBtn',interact]].forEach(([id,fn])=>el[id].addEventListener('pointerdown',e=>{e.preventDefault();el[id].classList.add('pressed');fn();}));
  document.addEventListener('pointerup',()=>document.querySelectorAll('.action.pressed').forEach(b=>b.classList.remove('pressed')));
  addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'&&!e.repeat){e.preventDefault();attack();}if(e.code==='KeyQ')castSpell();if(e.code==='KeyR'&&!e.repeat)dodge();if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='KeyM')openJournal('world');if(e.code==='KeyI')openJournal('gear');if(e.code==='Escape'){if(!el.interactionPanel.classList.contains('is-hidden'))closeInteraction();else if(!el.journal.classList.contains('is-hidden'))closeJournal();else openJournal('settings');}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();input.x=input.y=0;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){save();paused=true;return;}const modalOpen=[el.dialogue,el.journal,el.chapterComplete,el.interactionPanel].some(n=>!n.classList.contains('is-hidden'));if(running&&!modalOpen){paused=false;last=performance.now();}});
  el.newGameBtn.onclick=()=>{wakeAudio();if(S.style&&localStorage.getItem(SAVE_KEY)&&!confirm('Begin a new journey? Your current local journey will be replaced after you choose a new path.'))return;show(el.titleScreen,false);show(el.pathScreen,true);};
  el.continueBtn.onclick=()=>{wakeAudio();beginGame(false);};
  el.runBtn.onclick=()=>{runEnabled=!runEnabled;updateHUD();toast(runEnabled?'Running on · Free outside combat':'Walking');};
  el.mapBtn.onclick=()=>openJournal('world');
  document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{wakeAudio();sfx('select');startNew(b.dataset.path);});
  el.dialogueNext.onclick=advanceDialogue;el.objectiveBtn.onclick=()=>openJournal('quest');el.fullscreenBtn.onclick=toggleFullscreen;el.pauseBtn.onclick=()=>openJournal('gear');el.closeJournal.onclick=closeJournal;el.closeInteraction.onclick=closeInteraction;
  document.querySelectorAll('.journal-tabs button').forEach(b=>b.onclick=()=>renderJournal(b.dataset.tab));
  el.journalBody.addEventListener('click',e=>handleUiAction(e.target));el.interactionBody.addEventListener('click',e=>handleUiAction(e.target));
  el.keepExploringBtn.onclick=()=>{show(el.chapterComplete,false);el.gameScreen.inert=false;paused=false;toast('Chapter II routes are recorded in your journal');updateHUD();};
  document.addEventListener('fullscreenchange',()=>{syncViewport();updateFullscreenButton();});document.addEventListener('webkitfullscreenchange',()=>{syncViewport();updateFullscreenButton();});

  let debugHarnessState = null;
  if(['localhost','127.0.0.1'].includes(location.hostname)) window.__EVERLIGHT_DEBUG__ = {
    navigation:{
      start:()=>beginGame(),
      setState:patch=>{S=migrateSave({...defaultSave(),...patch});enterZone(S.zone,{x:S.x,y:S.y},false);paused=false;},
      objects:()=>objectsForZone(),collides:(x,y,r=13)=>collides(x,y,r),
      move:(dx,dy)=>moveActor(S,dx,dy,13),tick:dt=>update(dt),input:(x,y)=>{input={x,y};},run:on=>runEnabled=on,
      interact:()=>{updateInteraction();interact();},clearEnemies:()=>{enemies=[];},
      get:()=>({state:structuredClone(S),enemies:structuredClone(enemies),camera:{...camera},paused,sprinting,doorCooldown}),
      closeDialogue:()=>closeDialogue(),
    },
    contractVersion: 21,
    version: BUILD,
    reset: ({ state } = {}) => { debugHarnessState = state ? structuredClone(state) : null; return debugHarnessState ? structuredClone(debugHarnessState) : { state: structuredClone(S) }; },
    step: milliseconds => { if(debugHarnessState){debugHarnessState.clockMs=(debugHarnessState.clockMs||0)+milliseconds;const e=debugHarnessState.enemy;if(e&&e.phase&&e.phase!=='chase'&&e.durations){let remaining=milliseconds;const order=['windup','strike','recover','chase'];while(remaining>0&&e.phase!=='chase'){const until=e.durations[e.phase]-(e.phaseElapsedMs||0);if(remaining<until){e.phaseElapsedMs=(e.phaseElapsedMs||0)+remaining;remaining=0;}else{remaining-=until;e.phase=order[order.indexOf(e.phase)+1];e.phaseElapsedMs=0;if(e.phase==='strike')e.strikeStarted=true;if(e.phase==='recover')e.hitResolved=true;}}}return;} update(Math.min(.25,milliseconds/1000)); },
    snapshot: () => debugHarnessState ? structuredClone(debugHarnessState) : ({ state: structuredClone(S), camera: {...camera}, zone: {...zone()}, enemies: enemies.map(e=>({kind:e.kind,state:e.state,stateTimer:e.stateTimer,x:e.x,y:e.y,hp:e.hp})), loot: loot.map(d=>({kind:d.kind,x:d.x,y:d.y,itemId:d.itemId,amount:d.amount})) }),
    command: (name,payload={}) => { if(debugHarnessState){debugHarnessState.lastCommand={name,payload:structuredClone(payload)};return;}if(name==='player.move'){S.x=payload.x;S.y=payload.y;updateCamera(.5);}if(name==='enemy.kill'){const e=enemies.find(x=>x.id===payload.enemyId)||enemies.find(x=>!x.dead);if(e)killEnemy(e);}if(name==='mount.toggle'&&S.mounts.includes(payload.id))S.activeMount=S.activeMount?null:payload.id; },
    migrateSave: raw => migrateSave(raw),
    setPlayer: (x,y) => {S.x=x;S.y=y;updateCamera(.5);},
    enterZone: id => enterZone(id),
    spawnEnemy: (kind='briar',x=S.x+100,y=S.y) => enemies.push(makeEnemy(kind,x,y,enemies.length)),
    forceWindup: () => {const e=enemies.find(x=>!x.dead);if(e){const dx=S.x-e.x,dy=S.y-e.y,d=Math.hypot(dx,dy)||1;startEnemyWindup(e,dx,dy,d);}},
    defeatNearest: () => {const e=enemies.find(x=>!x.dead);if(e)killEnemy(e);},
    spawnLoot: () => {makeDrop('gold',S.x+50,S.y,{amount:7});makeDrop('item',S.x+70,S.y,{itemId:'briar_edge'});},
    save: () => save()
  };

  function startQaCombatShowcase() {
    S = defaultSave(); S.style = 'vanguard'; S.storyChoice = 'mercy'; S.mainStep = 2;
    beginGame(false); enterZone('greenwake', { x: 760, y: 520 }, false);
    enemies = [makeEnemy('briar', S.x + 92, S.y, 0)];
    startEnemyWindup(enemies[0], -1, 0, 1);
    for (let i = 0; i < 9; i++) makeDrop('gold', S.x - 70, S.y + 38, { amount: 2 });
    makeDrop('material', S.x - 48, S.y + 25, { material: 'moonleaf', amount: 1, rarity: 'Uncommon' });
    makeDrop('item', S.x - 92, S.y + 18, { itemId: 'briar_edge', rarity: 'Rare' });
    paused = true; updateHUD();
  }
  function startQaAtlasShowcase(mode='atlas') {
    S=defaultSave();S.style='ranger';S.storyChoice='mercy';S.mainStep=8;S.chapterComplete=true;S.level=10;S.gold=2400;S.mounts=['windstrider'];S.activeMount='windstrider';
    beginGame(false);enterZone(ATLAS?.firstArea||'northford',null,false);if(mode==='atlas-property'){S.x=1060;S.y=470;}if(mode==='atlas-board'){S.x=760;S.y=480;}if(mode==='atlas-route'){S.x=1718;S.y=550;}const focusId=new URLSearchParams(location.search).get('focus'),focus=objectsForZone().find(o=>o.id===focusId||o.id.endsWith(`:${focusId}`));if(focus){S.x=focus.x;S.y=focus.y+72;}show(el.toast,false);paused=false;updateCamera(.5);updateHUD();
  }
  function startQaInterior(id){S=defaultSave();S.style='vanguard';S.storyChoice='mercy';S.mainStep=4;S.gold=500;beginGame(false);enterZone(id,null,false);const focusId=new URLSearchParams(location.search).get('focus'),focus=objectsForZone().find(o=>o.id===focusId);if(focus){S.x=focus.x;S.y=focus.y+72;}show(el.toast,false);paused=false;updateCamera(.5);updateHUD();}

  function mountPrice(){return Math.ceil((S.sideQuests.stable==='complete'?120:180)*ECON.perk(S,'stable'));}
  function startQaEconomy(){startQaInterior('northford');S.gold=6000;S.atlasDiscovered=[ATLAS.firstArea];S.materials.briarFiber=30;estateView.view='market';estateView.selectedId=null;updateHUD();openJournal('economy');}
  function startQaEquipment(){
    startQaInterior('northford');S.gold=1500;S.hp=70;S.materials.briarFiber=30;S.materials.wardenAlloy=10;
    for(const id of ['briar_edge','wayfarer_bow','leather_coat','warden_plate','lantern_charm','tonic','aether_lens'])addItem(id);
    S.equipment.Armor=S.inventory.find(i=>i.id==='leather_coat').uid;updateHUD();openJournal('gear');
  }

  applySettings();updateFullscreenButton();
  addEventListener('load',()=>setTimeout(()=>{show(el.loading,false);const local=['127.0.0.1','localhost'].includes(location.hostname),qa=new URLSearchParams(location.search).get('qa');if(local&&qa==='economy'){startQaEconomy();return;}if(local&&qa==='gear'){startQaEquipment();return;}if(local&&qa==='combat'){startQaCombatShowcase();return;}if(local&&['atlas','atlas-property','atlas-board','atlas-route'].includes(qa)){startQaAtlasShowcase(qa);return;}if(local&&qa?.startsWith('interior-')){const id=qa.replace('interior-','');if(INTERIOR_LAYOUTS[id]){startQaInterior(id);return;}}if(local&&qa==='town'){startQaInterior('northford');return;}if(local&&qa?.startsWith('room-')){const id=qa.slice(5);if(EX.roomDefs[id]){startQaInterior(id);return;}}show(el.titleScreen,true);if((localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY))&&S.style)show(el.continueBtn,true);},520));
})();
