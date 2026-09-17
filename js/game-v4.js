(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const VIEW_H = 540;
  const SAVE_KEY = 'everlight-save-v6';
  const LEGACY_SAVE_KEY = 'everlight-save-v5';
  const BUILD = '21';
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
    'fullscreenBtn','pauseBtn','dialogue','speakerPortrait','speakerName','dialogueText','dialogueChoices',
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
    archive: ['lantern_charm','aether_draught']
  };

  const ZONES = {
    northford: { name: 'Northford', subtitle: 'Lantern Town', type: 'town', width: 1900, height: 1050, spawn: { x: 940, y: 760 }, tint: '#15382f' },
    greenwake: { name: 'Greenwake Vale', subtitle: 'The South Road', type: 'wild', width: 2200, height: 1300, spawn: { x: 1080, y: 165 }, tint: '#173c2b' },
    moonfall: { name: 'Moonfall Ruins', subtitle: 'Where the Ways Broke', type: 'ruins', width: 1900, height: 1180, spawn: { x: 170, y: 620 }, tint: '#1d2d38' },
    smithy: { name: 'Ember & Anvil', subtitle: 'Smithy', type: 'interior', width: 1800, height: 680, spawn: { x: 900, y: 500 }, tint: '#3a2419' },
    apothecary: { name: 'Greenbottle Apothecary', subtitle: 'Herbs & Remedies', type: 'interior', width: 1800, height: 680, spawn: { x: 900, y: 500 }, tint: '#183b31' },
    inn: { name: 'The Mooncup', subtitle: 'Inn & Hearth', type: 'interior', width: 1800, height: 680, spawn: { x: 900, y: 500 }, tint: '#35291e' },
    guildhall: { name: 'Northford Guildhall', subtitle: 'Choose Who You Become', type: 'interior', width: 1900, height: 720, spawn: { x: 950, y: 540 }, tint: '#202d31' },
    stable: { name: 'Windstrider Stable', subtitle: 'Mounts & Tack', type: 'interior', width: 1800, height: 700, spawn: { x: 900, y: 520 }, tint: '#30351e' }
  };

  const defaultSave = () => ({
    schema: 6, build: BUILD, style: null, zone: 'northford', x: 940, y: 760,
    hp: 100, maxHp: 100, mana: 60, maxMana: 60, stam: 100, maxStam: 100,
    gold: 140, xp: 0, level: 1, skillPoints: 1, day: 1, playTime: 0, lastPlayed: Date.now(),
    mainStep: 0, mainKills: 0, storyChoice: null, endingChoice: null, chapterComplete: false,
    faction: null, factionRep: { ironbound: 0, archive: 0, gilded: 0, ashen: 0 },
    skills: [], mounts: [], activeMount: null, vehicles: { skiff: false, airshipParts: 0, airship: false },
    inventory: [{ ...ITEM_TEMPLATES.roadworn_blade, uid: 'starter-weapon' }, { ...ITEM_TEMPLATES.tonic, uid: 'starter-tonic-1' }, { ...ITEM_TEMPLATES.tonic, uid: 'starter-tonic-2' }],
    equipment: { Weapon: 'starter-weapon', Armor: null, Charm: null }, materials: { moonleaf: 0, briarFiber: 0, wardenAlloy: 0 },
    sideQuests: { apothecary: 'available', stable: 'available', lostScout: 'available' }, sideProgress: { briars: 0 },
    discoveries: ['Northford'], opened: [], properties: {}, treasury: 0, defeated: 0,
    settings: { sound: true, haptics: true, reducedMotion: false, highContrast: false, leftHanded: false, assistMode: false }
  });

  function normalizeItem(item, i = 0) {
    const template = ITEM_TEMPLATES[item?.id] || null;
    if (template) return { ...template, ...item, uid: item.uid || uid(`item${i}`) };
    if (item?.name === 'Roadworn Blade') return { ...ITEM_TEMPLATES.roadworn_blade, ...item, uid: item.uid || 'starter-weapon' };
    return { id: item?.id || `legacy_${i}`, name: item?.name || 'Unknown Relic', type: item?.type || 'Charm', rarity: item?.rarity || 'Common', value: item?.value || 5, ...item, uid: item?.uid || uid(`legacy${i}`) };
  }
  function migrateSave(raw) {
    const base = defaultSave();
    if (!raw) return base;
    const oldQuestMap = [0, 2, 3, 6, 8];
    const merged = { ...base, ...raw, schema: 6, build: BUILD };
    merged.settings = { ...base.settings, ...(raw.settings || {}) };
    merged.inventory = (raw.inventory?.length ? raw.inventory : base.inventory).map(normalizeItem);
    if (!raw.schema) {
      merged.zone = 'northford'; merged.x = 940; merged.y = 760;
      merged.mainStep = oldQuestMap[raw.quest] ?? 0;
      merged.gold = Math.max(140, raw.gold || 0);
    }
    merged.equipment = { ...base.equipment, ...(raw.equipment || {}) };
    if (!merged.inventory.some(i => i.uid === merged.equipment.Weapon)) merged.equipment.Weapon = merged.inventory.find(i => i.type === 'Weapon')?.uid || null;
    merged.factionRep = { ...base.factionRep, ...(raw.factionRep || {}) };
    merged.materials = { ...base.materials, ...(raw.materials || {}) };
    merged.sideQuests = { ...base.sideQuests, ...(raw.sideQuests || {}) };
    merged.sideProgress = { ...base.sideProgress, ...(raw.sideProgress || {}) };
    merged.vehicles = { ...base.vehicles, ...(raw.vehicles || {}) };
    merged.properties = { ...base.properties, ...(raw.properties || {}) };
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
  const imageReady = { bg: false, hero: false, mira: false, warden: false, greenwake: false, moonfall: false };
  bg.onload = () => imageReady.bg = true;
  hero.onload = () => imageReady.hero = true;
  miraArt.onload = () => imageReady.mira = true;
  wardenArt.onload = () => imageReady.warden = true;
  greenwakeBg.onload = () => imageReady.greenwake = true;
  moonfallBg.onload = () => imageReady.moonfall = true;

  let running = false, paused = true, last = performance.now(), saveClock = 0;
  let input = { x: 0, y: 0 }, keys = new Set(), pointerId = null, lastFacing = { x: 0, y: -1 };
  let attackCd = 0, spellCd = 0, dodgeCd = 0, invuln = 0, hurtFlash = 0, combo = 0, comboClock = 0, counterBuff = 0;
  let shake = 0, screenFlash = 0, toastTimer = 0, subtitleTimer = 0, zoneBannerTimer = 0, lootFeedTimer = 0, zoneGrace = 0;
  let enemies = [], loot = [], projectiles = [], particles = [], damageTexts = [], decor = [];
  let currentInteract = null, currentTab = 'quest', camera = { x: 0, y: 0 }, companion = { x: 0, y: 0, cooldown: .8 }, dialogueQueue = [], dialogueDone = null, dialogueChoiceHandler = null, restoreFocus = null;
  let audioCtx = null;

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
    else toast(`Welcome back to ${ZONES[S.zone].name}`);
    requestAnimationFrame(loop);
  }

  function zone() { return ZONES[S.zone] || ZONES.northford; }
  function buildDecor() {
    const z = zone(); decor = [];
    const count = ['town','wild','ruins'].includes(z.type) ? 0 : 18;
    for (let i = 0; i < count; i++) {
      const seed = (i * 92821 + S.zone.length * 127) % 997;
      const x = 55 + (seed * 83 % Math.max(100, z.width - 110));
      const y = 70 + (seed * 151 % Math.max(100, z.height - 130));
      decor.push({ x, y, kind: z.type === 'wild' ? (i % 4 ? 'tree' : 'rock') : z.type === 'ruins' ? (i % 3 ? 'pillar' : 'crystal') : z.type === 'interior' ? (i % 3 ? 'table' : 'lamp') : (i % 4 ? 'lamp' : 'flower'), s: .75 + (seed % 40) / 100 });
    }
  }
  function enterZone(id, spawn = null, announceZone = true) {
    const target = ZONES[id]; if (!target) return;
    S.zone = id; const p = spawn || target.spawn; S.x = clamp(p.x, 35, target.width - 35); S.y = clamp(p.y, 70, target.height - 35);
    companion.x = S.x - 38; companion.y = S.y + 24; companion.cooldown = .7;
    enemies = []; loot = []; projectiles = []; particles = []; damageTexts = []; zoneGrace = 3.5; buildDecor(); spawnZoneEnemies();
    camera.x = clamp(S.x - VIEW_W / 2, 0, Math.max(0, target.width - VIEW_W));
    camera.y = clamp(S.y - VIEW_H * .62, 0, Math.max(0, target.height - VIEW_H));
    if (!S.discoveries.includes(target.name)) S.discoveries.push(target.name);
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
    if (S.zone === 'greenwake') {
      [[760,430,'wisp'],[1050,550,'wisp'],[1370,420,'wisp'],[550,850,'briar'],[960,930,'briar'],[1630,790,'briar'],[1840,480,'briar']].forEach((p,i) => enemies.push(makeEnemy(p[2],p[0],p[1],i)));
    }
    if (S.zone === 'moonfall') {
      [[420,420,'construct'],[730,760,'construct'],[1040,380,'construct'],[1320,720,'wisp']].forEach((p,i) => enemies.push(makeEnemy(p[2],p[0],p[1],i)));
      if (S.mainStep >= 6 && !S.opened.includes('hollow-warden')) enemies.push(makeEnemy('warden', 1570, 560, 9));
    }
  }

  function itemByUid(id) { return S.inventory.find(i => i.uid === id); }
  function equipped(type) { return itemByUid(S.equipment[type]); }
  function hasSkill(id) { return S.skills.includes(id); }
  function combatStats() {
    const weapon = equipped('Weapon'), armor = equipped('Armor'), charm = equipped('Charm');
    return {
      power: (weapon?.power || 8) * (hasSkill('keen_edge') ? 1.2 : 1),
      armor: (armor?.armor || 0) + (charm?.armor || 0) + (S.faction === 'ironbound' ? 8 : 0),
      spell: (1 + (charm?.spell || 0)) * (hasSkill('aether_surge') ? 1.25 : 1) * (S.style === 'arcanist' ? 1.25 : 1),
      speed: (S.activeMount ? 1.65 : 1) * (hasSkill('fleetstep') ? 1.12 : 1) * (S.style === 'ranger' ? 1.1 : 1),
      crit: (S.crit || 0) + (S.faction === 'archive' ? .04 : 0)
    };
  }
  function gainXp(amount) {
    S.xp += amount;
    while (S.xp >= S.level * 80) {
      S.xp -= S.level * 80; S.level++; S.skillPoints++; S.maxHp += 8; S.hp = S.maxHp; S.maxMana += 4; S.mana = S.maxMana;
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
    setTimeout(() => { S.hp=S.maxHp; S.mana=S.maxMana; S.stam=S.maxStam; S.gold=Math.max(0,S.gold-12); enterZone('northford', ZONES.northford.spawn); paused=false; toast('Returned to Northford · −12 gold'); save(); }, 1500);
  }
  function hitEnemy(e, damage, dx, dy, magic = false, canKill = true) {
    if (e.dead) return; if(!canKill)damage=Math.min(damage,Math.max(0,e.hp-1));e.hp -= damage; e.flash = .13; e.x += dx * 8; e.y += dy * 8;
    spawnBurst(e.x,e.y,magic?'#79fff0':'#ffd77d',magic?10:7); floatText(e.x,e.y-e.r,`${Math.round(damage)}`,magic?'#8dfff0':'#ffe39a'); sfx('hit');
    if (e.hp <= 0) killEnemy(e);
  }
  function makeDrop(kind, x, y, data = {}) { loot.push({ id: uid('drop'), kind, x: x + random(-22,22), y: y + random(-14,18), vx: random(-45,45), vy: random(-85,-35), age: 0, collected: false, ...data }); }
  function dropLoot(e) {
    const boss = e.kind === 'warden'; const coins = boss ? 14 : e.kind === 'construct' ? 7 : 5;
    for (let i=0;i<coins;i++) makeDrop('gold', e.x, e.y, { amount: boss ? Math.ceil(random(5,10)) : Math.ceil(random(1,4)) });
    const material = e.kind === 'briar' ? 'briarFiber' : e.kind === 'warden' ? 'wardenAlloy' : Math.random() < .5 ? 'moonleaf' : null;
    if (material) for (let i=0;i<(boss?3:1);i++) makeDrop('material',e.x,e.y,{ material, amount: 1, rarity: boss?'Rare':'Uncommon' });
    const rareBonus = S.faction === 'archive' ? .1 : 0;
    if (boss) { makeDrop('item',e.x,e.y,{ itemId:'warden_plate',rarity:'Epic' }); makeDrop('item',e.x,e.y,{ itemId:'aether_lens',rarity:'Legendary' }); }
    else if (Math.random() < .2 + rareBonus) makeDrop('item',e.x,e.y,{ itemId: choose(e.kind==='construct'?['moonfall_saber','lantern_charm','aether_draught']:['briar_edge','leather_coat','tonic']), rarity: null });
  }
  function killEnemy(e) {
    e.dead=true; spawnBurst(e.x,e.y,e.kind==='warden'?'#ffe08a':'#7efbe7',e.kind==='warden'?42:18); shake=e.kind==='warden'?14:5; dropLoot(e); gainXp(e.xp); S.defeated++;
    if (S.zone==='greenwake' && S.mainStep===2 && (e.kind==='wisp'||e.kind==='briar')) { S.mainKills++; if(S.mainKills>=3){S.mainStep=3;sfx('success');subtitle('The echo storm breaks. Mira will want to hear what you found.',3);save();} }
    if (e.kind==='briar' && S.sideQuests.stable==='active') { S.sideProgress.briars++; if(S.sideProgress.briars>=4){S.sideQuests.stable='ready';toast('Stable quest complete · Return to Rowan');} }
    if (e.kind==='warden') { if(!S.opened.includes('hollow-warden'))S.opened.push('hollow-warden'); S.mainStep=7; sfx('success'); subtitle('The Warden falls. Claim the Aether Lens from its hoard.',3); }
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

  function collides(x,y,r){const z=zone();return x-r<18||y-r<160||x+r>z.width-18||y+r>z.height-150;}
  function moveActor(actor,dx,dy,r){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/9)),sx=dx/steps,sy=dy/steps;for(let i=0;i<steps;i++){if(!collides(actor.x+sx,actor.y,r))actor.x+=sx;if(!collides(actor.x,actor.y+sy,r))actor.y+=sy;}}
  function updatePlayer(dt){
    let ix=input.x+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);let iy=input.y+(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
    const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;}if(m>.1){lastFacing={x:ix/(Math.hypot(ix,iy)||1),y:iy/(Math.hypot(ix,iy)||1)};dismissTutorial();}
    moveActor(S,ix*138*combatStats().speed*dt,iy*138*combatStats().speed*dt,13);S.stam=Math.min(S.maxStam,S.stam+28*dt);S.mana=Math.min(S.maxMana,S.mana+4.5*dt);
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
      if(p.kind==='player'||p.kind==='companion'){for(const e of enemies)if(!e.dead&&Math.hypot(p.x-e.x,p.y-e.y)<p.r+e.r){const m=Math.hypot(p.vx,p.vy)||1;hitEnemy(e,p.damage,p.vx/m,p.vy/m,true,p.kind!=='companion');if(p.chain){const next=enemies.find(n=>!n.dead&&n!==e&&distance(n,e)<145);if(next){const dm=distance(next,e)||1;projectiles.push({kind:'player',x:e.x,y:e.y,vx:(next.x-e.x)/dm*300,vy:(next.y-e.y)/dm*300,r:7,life:.55,damage:Math.round(p.damage*.55),chain:false});}}p.life=0;break;}}
      else if(Math.hypot(p.x-S.x,p.y-S.y)<p.r+13){playerDamage(p.damage,p.x,p.y);p.life=0;}
    }
    const z=zone();projectiles=projectiles.filter(p=>p.life>0&&p.x>-40&&p.x<z.width+40&&p.y>-40&&p.y<z.height+40);
  }
  function updateLoot(dt){
    for(const d of loot){if(d.collected)continue;d.age+=dt;if(d.age<.55){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=180*dt;}else{d.vx*=.85;d.vy=0;}if(d.age>.45&&distance(d,S)<42)collectDrop(d);}
    loot=loot.filter(d=>!d.collected);
  }
  function updateCamera(dt){
    const z=zone();const safeL=VIEW_W*.30,safeR=VIEW_W*.70,safeT=162,safeB=378;let targetX=camera.x,targetY=camera.y;const sx=S.x-camera.x,sy=S.y-camera.y;
    if(sx<safeL)targetX=S.x-safeL;if(sx>safeR)targetX=S.x-safeR;if(sy<safeT)targetY=S.y-safeT;if(sy>safeB)targetY=S.y-safeB;
    targetX=clamp(targetX,0,Math.max(0,z.width-VIEW_W));targetY=clamp(targetY,0,Math.max(0,z.height-VIEW_H));const speed=1-Math.pow(.0008,dt);camera.x=lerp(camera.x,targetX,speed);camera.y=lerp(camera.y,targetY,speed);
  }
  function updateEffects(dt){particles.forEach(p=>{p.life-=dt;if(!p.kind){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=20*dt;}});particles=particles.filter(p=>p.life>0);damageTexts.forEach(t=>{t.life-=dt;t.y-=25*dt;});damageTexts=damageTexts.filter(t=>t.life>0);shake=Math.max(0,shake-30*dt);screenFlash=Math.max(0,screenFlash-dt);toastTimer-=dt;subtitleTimer-=dt;zoneBannerTimer-=dt;lootFeedTimer-=dt;if(toastTimer<=0)show(el.toast,false);if(subtitleTimer<=0)show(el.subtitle,false);if(zoneBannerTimer<=0)show(el.zoneBanner,false);if(lootFeedTimer<=0)show(el.lootFeed,false);}

  function objectsForZone(){
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
      {id:'moonfallWaystone',kind:'waystone',name:'Moonfall Waystone',x:1060,y:560,label:'Travel'}
    ];
    if(S.zone==='smithy')return [{id:'exit',kind:'portal',name:'Northford',x:900,y:565,label:'Exit',target:'northford',spawn:{x:1260,y:530}},{id:'smith',kind:'shop',name:'Brann',x:900,y:250,label:'Trade',shop:'smithy'}];
    if(S.zone==='apothecary')return [{id:'exit',kind:'portal',name:'Northford',x:900,y:565,label:'Exit',target:'northford',spawn:{x:1450,y:670}},{id:'apothecary',kind:'shop',name:'Sela',x:900,y:250,label:'Talk',shop:'apothecary'}];
    if(S.zone==='inn')return [{id:'exit',kind:'portal',name:'Northford',x:900,y:565,label:'Exit',target:'northford',spawn:{x:470,y:490}},{id:'innkeeper',kind:'rest',name:'Nella',x:900,y:250,label:'Rest'}];
    if(S.zone==='stable')return [{id:'exit',kind:'portal',name:'Northford',x:900,y:585,label:'Exit',target:'northford',spawn:{x:1590,y:870}},{id:'stablemaster',kind:'stable',name:'Rowan',x:900,y:260,label:'Talk'}];
    if(S.zone==='guildhall')return [{id:'exit',kind:'portal',name:'Northford',x:950,y:605,label:'Exit',target:'northford',spawn:{x:315,y:710}},{id:'ironbound',kind:'faction',name:'Captain Vey',x:350,y:290,label:'Ironbound'},{id:'archive',kind:'faction',name:'Curator Elya',x:750,y:220,label:'Archive'},{id:'gilded',kind:'faction',name:'Broker Ves',x:1150,y:220,label:'Gilded'},{id:'ashen',kind:'faction',name:'Magister Sol',x:1550,y:290,label:'Ashen'}];
    return [];
  }
  function nearestInteractable(){return objectsForZone().filter(o=>distance(S,o)<108).sort((a,b)=>distance(S,a)-distance(S,b))[0]||null;}
  function updateInteraction(){currentInteract=nearestInteractable();show(el.interactBtn,!!currentInteract);if(currentInteract)el.interactBtn.querySelector('small').textContent=currentInteract.label;}
  function interact(){
    if(paused||!currentInteract)return;wakeAudio();dismissTutorial();sfx('select');const o=currentInteract;
    if(o.kind==='portal'){if(o.target==='moonfall'&&S.mainStep<5){toast('Mira asked you to return before taking the Moonfall road');return;}enterZone(o.target,o.spawn);save();return;}
    if(o.kind==='shop'){if(o.id==='apothecary')talkApothecary();else openShop(o.shop,o.name);return;}
    if(o.kind==='rest'){S.hp=S.maxHp;S.mana=S.maxMana;S.stam=S.maxStam;advanceDay();toast('Rested until dawn · Progress saved');save();return;}
    if(o.kind==='stable'){talkStable();return;}
    if(o.kind==='faction'){openFaction(o.id);return;}
    if(o.kind==='waystone'){openWaystone();return;}
    if(o.kind==='chest'){openChest(o);return;}
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
  function openChest(o){if(S.opened.includes(o.id)){toast('The cache is empty');return;}S.opened.push(o.id);S.gold+=65;const item=addItem('moonfall_saber');S.sideQuests.lostScout='complete';gainXp(60);spawnBurst(o.x,o.y,'#ffd86f',28);lootMessage(`${item.rarity} · ${item.name}`,item.rarity);save();}

  function openDialogue(lines,onDone=null,onChoice=null){restoreFocus=document.activeElement;dialogueQueue=[...lines];dialogueDone=onDone;dialogueChoiceHandler=onChoice||onDone;paused=true;el.gameScreen.inert=true;show(el.dialogue);renderDialogueLine();}
  function renderDialogueLine(){const line=dialogueQueue[0];if(!line){const done=dialogueDone;closeDialogue();if(done)done();return;}el.speakerName.textContent=line.speaker;const usesPortrait=line.speaker==='Mira';el.speakerPortrait.classList.toggle('portrait--image',usesPortrait);el.speakerPortrait.style.backgroundImage=usesPortrait?`url("assets/mira-scout.png?v=${BUILD}")`:'';el.speakerPortrait.textContent=usesPortrait?'':line.portrait||line.speaker[0];el.dialogueText.textContent=line.text;el.dialogueChoices.innerHTML='';show(el.dialogueNext,!line.choices);if(line.choices)for(const c of line.choices){const b=document.createElement('button');b.textContent=c.label;b.onclick=()=>dialogueChoiceHandler?.(c.value);el.dialogueChoices.appendChild(b);}requestAnimationFrame(()=>line.choices?el.dialogueChoices.querySelector('button')?.focus():el.dialogueNext.focus());}
  function advanceDialogue(){if(!dialogueQueue[0]||dialogueQueue[0].choices)return;dialogueQueue.shift();renderDialogueLine();}
  function closeDialogue(){show(el.dialogue,false);el.gameScreen.inert=false;dialogueQueue=[];paused=false;last=performance.now();dialogueDone=null;dialogueChoiceHandler=null;restoreFocus?.focus?.();restoreFocus=null;}

  function priceFor(item){return Math.ceil(item.value*(S.faction==='gilded'?.9:1));}
  function openInteraction(title,html){restoreFocus=document.activeElement;el.interactionTitle.textContent=title;el.interactionBody.innerHTML=html;paused=true;el.gameScreen.inert=true;show(el.interactionPanel);requestAnimationFrame(()=>el.closeInteraction.focus());}
  function closeInteraction(){show(el.interactionPanel,false);el.gameScreen.inert=false;paused=false;last=performance.now();restoreFocus?.focus?.();restoreFocus=null;}
  function openShop(kind,keeper){const rows=SHOP_STOCK[kind].map((id,index)=>{const i=ITEM_TEMPLATES[id],price=priceFor(i);return `<article class="market-row rarity-${i.rarity.toLowerCase()}"><div><strong>${i.name}</strong><small>${i.rarity} ${i.type} · ${i.description}</small></div><button data-buy="${id}" data-index="${index}" ${S.gold<price?'disabled':''}>${price}g</button></article>`;}).join('');openInteraction(`${keeper}'s wares`,`${rows}<p class="panel-note">Your purse: <b>${S.gold} gold</b></p>`);}
  function openStable(){const owned=S.mounts.includes('windstrider'),price=S.sideQuests.stable==='complete'?120:180,shortfall=Math.max(0,price-S.gold);openInteraction('Windstrider Stable',owned?`<div class="feature-card"><h3>Chestnut Windstrider</h3><p>65% faster travel. Your mount waits outside every building.</p><button data-mount="toggle">${S.activeMount?'Dismount':'Ride Windstrider'}</button></div>`:`<div class="feature-card"><h3>Chestnut Windstrider</h3><p>Road-bred, sure-footed, and fast enough to outrun a briar storm.</p><button data-mount="buy" ${shortfall?'disabled':''}>${shortfall?`Need ${shortfall}g more`:`Purchase · ${price}g`}</button></div>`);}
  function openFaction(id){const f=FACTIONS[id],joined=S.faction===id,locked=S.faction&&S.faction!==id;openInteraction(f.name,`<div class="feature-card" style="--accent:${f.color}"><h3>${f.description}</h3><p>${f.gift}</p><p>Ranks: Initiate → Adept → Captain → Paragon</p><button data-consider="${id}" ${joined||locked?'disabled':''}>${joined?'Already joined':locked?`Committed to ${FACTIONS[S.faction].name}`:'Consider pledge'}</button></div>`);}
  function openFactionConfirm(id){const f=FACTIONS[id];openInteraction(`Pledge to ${f.name}?`,`<div class="feature-card faction-confirm" style="--accent:${f.color}"><span class="choice-tag">Permanent commitment</span><h3>${f.gift}</h3><p>This closes the other three faction paths for this journey. Their shops remain open, but their rank abilities and faction questlines will be unavailable.</p><div class="confirm-actions"><button data-faction-cancel="${id}">Not yet</button><button data-join="${id}">Make the pledge</button></div></div>`);}
  function openWaystone(){const destinations=[['northford','Northford'],S.discoveries.includes('Greenwake Vale')?['greenwake','Greenwake Vale']:null,S.discoveries.includes('Moonfall Ruins')?['moonfall','Moonfall Ruins']:null].filter(Boolean);openInteraction('Waystone Network',destinations.map(([id,name])=>`<button class="travel-row" data-travel="${id}" ${S.zone===id?'disabled':''}>✦ ${name}</button>`).join('')+`<p class="panel-note">Fast travel unlocked early. More Ways awaken through the story.</p>`);}
  function advanceDay(){S.day++;for(const [id,p]of Object.entries(S.properties)){const base=id==='smithy'?38:id==='inn'?52:34;const swing=Math.round(random(-10,18));const profit=Math.max(-8,base+swing+(p.level||0)*12);p.lastProfit=profit;p.total=(p.total||0)+profit;S.treasury+=profit;}if(S.day%3===0)toast('A new world event rumor appears on the notice board');}
  function showChapterComplete(){el.chapterSummary.textContent='You recovered the Aether Lens, chose an ally, and opened the route toward the wider Vale. The next chapter begins at the Moonfall Waystone.';show(el.chapterComplete);el.gameScreen.inert=true;paused=true;el.keepExploringBtn.focus();}

  function pretty(text){return String(text).replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());}
  function objective(){const objectives=[['A Voice in the Vale','Find Mira near the lantern plaza'],['The South Road','Leave Northford through the south gate'],['Echoes in Greenwake',`Defeat corrupted echoes · ${Math.min(3,S.mainKills)}/3`],['A Mark in the Briars','Return to Mira in Northford'],['Choose an Ally','Visit the Guildhall and join a faction'],['Road to Moonfall','Take the east road through Greenwake'],['Keeper of the Seal','Defeat the Hollow Warden'],['The Fallen Warden','Collect the Aether Lens'],['The Road Remembers','Explore, grow stronger, and prepare for Chapter II']];return objectives[clamp(S.mainStep,0,objectives.length-1)];}
  function updateHUD(){const stats=combatStats(),hpMax=S.maxHp+(equipped('Armor')?.maxHp||0);el.hpBar.style.width=`${clamp(S.hp/hpMax*100,0,100)}%`;el.manaBar.style.width=`${clamp(S.mana/S.maxMana*100,0,100)}%`;el.stamBar.style.width=`${clamp(S.stam/S.maxStam*100,0,100)}%`;el.hpText.textContent=Math.ceil(S.hp);el.manaText.textContent=Math.ceil(S.mana);el.hpProgress.setAttribute('aria-valuemax',hpMax);el.hpProgress.setAttribute('aria-valuenow',Math.ceil(S.hp));el.manaProgress.setAttribute('aria-valuemax',S.maxMana);el.manaProgress.setAttribute('aria-valuenow',Math.ceil(S.mana));el.stamProgress.setAttribute('aria-valuemax',S.maxStam);el.stamProgress.setAttribute('aria-valuenow',Math.ceil(S.stam));el.levelText.textContent=S.level;el.goldText.textContent=S.gold;const[t,x]=objective();el.objectiveTitle.textContent=t;el.objectiveText.textContent=x;const boss=enemies.find(e=>e.kind==='warden'&&!e.dead);show(el.bossHud,!!boss);if(boss)el.bossBar.style.width=`${Math.max(0,boss.hp/boss.maxHp*100)}%`;el.attackBtn.querySelector('small').textContent=counterBuff>0?'Counter':'Strike';void stats;}
  function promptTutorial(text){el.tutorial.textContent=text;show(el.tutorial);}
  function dismissTutorial(){show(el.tutorial,false);}

  function renderJournal(tab=currentTab){currentTab=tab;document.querySelectorAll('.journal-tabs button').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)});const [title,text]=objective();
    if(tab==='quest'){const side=Object.entries(S.sideQuests).filter(([,v])=>v!=='available').map(([id,status])=>`<div class="journal-card"><div class="journal-row"><h3>${id==='apothecary'?'Moonleaf Remedy':id==='stable'?'Clear the Brambles':'The Lost Scout'}</h3><span class="choice-tag">${status}</span></div><p>${id==='apothecary'?`Moonleaf ${Math.min(3,S.materials.moonleaf)}/3`:id==='stable'?`Briars ${Math.min(4,S.sideProgress.briars)}/4`:'Find the Rootbound Cache in southeast Greenwake.'}</p></div>`).join('');el.journalBody.innerHTML=`<div class="journal-card"><span class="choice-tag">Main story · Chapter I</span><h3>${title}</h3><p>${text}</p><div class="progress"><i style="width:${(S.mainStep/8)*100}%"></i></div></div>${side||'<div class="journal-card"><h3>Side quests</h3><p>Talk to townsfolk and explore interiors to find local stories.</p></div>'}`;}
    if(tab==='gear'){const slots=['Weapon','Armor','Charm'].map(type=>{const item=equipped(type);return `<div class="equipment-slot"><small>${type}</small><strong>${item?.name||'Empty'}</strong><span>${item?item.rarity:''}</span></div>`}).join('');const items=S.inventory.map(i=>`<article class="inventory-row rarity-${i.rarity.toLowerCase()}"><div><strong>${i.name}</strong><small>${i.rarity} ${i.type} · ${i.description||''}</small></div>${['Weapon','Armor','Charm'].includes(i.type)?`<button data-equip="${i.uid}" ${S.equipment[i.type]===i.uid?'disabled':''}>${S.equipment[i.type]===i.uid?'Equipped':'Equip'}</button>`:i.type==='Consumable'?`<button data-use="${i.uid}">Use</button>`:''}</article>`).join('');el.journalBody.innerHTML=`<div class="equipment-grid">${slots}</div><div class="inventory-list">${items}</div>`;}
    if(tab==='skills'){el.journalBody.innerHTML=`<div class="journal-card"><div class="journal-row"><h3>Ability Constellation</h3><strong>${S.skillPoints} point${S.skillPoints===1?'':'s'}</strong></div><p>Unlock abilities in any tree. Your opening path never locks you out.</p></div><div class="skill-grid">${SKILLS.map(s=>{const unlocked=hasSkill(s.id),ready=!s.requires||hasSkill(s.requires);return `<article class="skill-node ${unlocked?'unlocked':''}"><small>${s.tree}</small><h3>${s.name}</h3><p>${s.text}</p><button data-skill="${s.id}" ${unlocked||!ready||S.skillPoints<s.cost?'disabled':''}>${unlocked?'Unlocked':`${s.cost} point${s.cost>1?'s':''}`}</button></article>`}).join('')}</div>`;}
    if(tab==='factions'){el.journalBody.innerHTML=S.faction?`<div class="journal-card"><span class="choice-tag">Your faction</span><h3>${FACTIONS[S.faction].name}</h3><p>${FACTIONS[S.faction].description}</p><div class="progress"><i style="width:${Math.min(100,S.factionRep[S.faction]/7)}%"></i></div><p>${S.factionRep[S.faction]} reputation · Next rank at 100</p></div>`:`<div class="journal-card"><h3>No faction chosen</h3><p>Visit Northford Guildhall. Faction commitments unlock rank rewards, gear, abilities, and questlines.</p></div>`;}
    if(tab==='world'){el.journalBody.innerHTML=`<div class="journal-card"><h3>${ZONES[S.zone].name} · Day ${S.day}</h3><p>${ZONES[S.zone].subtitle}</p></div><div class="journal-card"><h3>Discovered</h3><p>${S.discoveries.join(' · ')}</p></div><div class="journal-card"><span class="choice-tag">World event rumor</span><h3>${S.day%3===0?'Broken Caravan':'The Briar King Walks'}</h3><p>${S.day%3===0?'A trade caravan is overdue on the Greenwake road.':'Hunters report crown-shaped tracks beyond the Vale. Recommended level 5.'}</p></div><div class="journal-card"><h3>Vehicles</h3><p>Windstrider: ${S.mounts.length?'Owned':'Not owned'} · Skiff: ${S.vehicles.skiff?'Built':'Plans missing'} · Airship parts: ${S.vehicles.airshipParts}/3</p></div>`;}
    if(tab==='economy'){const owned=Object.entries(S.properties).map(([id,p])=>`<div class="journal-card"><div class="journal-row"><h3>${pretty(id)}</h3><strong>${p.lastProfit>=0?'+':''}${p.lastProfit||0}g yesterday</strong></div><p>Tier ${(p.level||0)+1} · Lifetime ${p.total||0}g</p></div>`).join('');el.journalBody.innerHTML=`<div class="journal-card"><div class="journal-row"><div><h3>Portfolio ledger</h3><p>Income resolves by adventure day, never real-world timers.</p></div><strong>${S.treasury}g treasury</strong></div><button data-economy="collect" ${S.treasury<=0?'disabled':''}>Transfer treasury</button> <button data-economy="day">Rest to next day</button></div>${owned||'<div class="journal-card"><h3>No properties yet</h3><p>Complete Chapter I to unlock deeds for the Smithy, Mooncup Inn, Greenbottle Apothecary, and Eastfield land.</p></div>'}${S.chapterComplete&&!S.properties.smithy?'<div class="journal-card"><h3>Ember & Anvil share</h3><p>Purchase 25% of the smithy. Variable daily profit and an 8% gear discount.</p><button data-property="smithy" '+(S.gold<350?'disabled':'')+'>Purchase · 350g</button></div>':''}`;}
    if(tab==='settings'){el.journalBody.innerHTML=`${settingRow('Sound effects','sound')}${settingRow('Haptics','haptics')}${settingRow('Reduced motion','reducedMotion')}${settingRow('High contrast','highContrast')}${settingRow('Left-handed controls','leftHanded')}${settingRow('Story assist · less damage, stronger attacks','assistMode')}<div class="setting"><strong>Save progress</strong><button data-save>Save now</button></div><div class="setting"><strong>Start over</strong><button data-reset class="danger-btn">Reset save</button></div>`;}
  }
  function settingRow(label,key){return `<div class="setting"><strong>${label}</strong><button role="switch" aria-checked="${S.settings[key]}" class="${S.settings[key]?'on':''}" data-setting="${key}">${S.settings[key]?'On':'Off'}</button></div>`;}
  function openJournal(tab='quest'){if(el.gameScreen.classList.contains('is-hidden'))return;restoreFocus=document.activeElement;paused=true;el.gameScreen.inert=true;show(el.journal);renderJournal(tab);requestAnimationFrame(()=>el.closeJournal.focus());}
  function closeJournal(){show(el.journal,false);el.gameScreen.inert=false;paused=false;last=performance.now();restoreFocus?.focus?.();restoreFocus=null;}

  function handleUiAction(target){
    const buy=target.closest('[data-buy]');if(buy){const item=ITEM_TEMPLATES[buy.dataset.buy],price=priceFor(item);if(S.gold>=price){S.gold-=price;const gained=addItem(item.id);lootMessage(`Purchased · ${gained.name}`,gained.rarity);save();openShop(currentInteract?.shop||'smithy',currentInteract?.name||'Merchant');}return;}
    const equip=target.closest('[data-equip]');if(equip){const item=itemByUid(equip.dataset.equip);if(item){S.equipment[item.type]=item.uid;toast(`${item.name} equipped`);save();renderJournal('gear');}return;}
    const use=target.closest('[data-use]');if(use){const index=S.inventory.findIndex(i=>i.uid===use.dataset.use),item=S.inventory[index];if(item){if(item.heal)S.hp=Math.min(S.maxHp+(equipped('Armor')?.maxHp||0),S.hp+item.heal);if(item.mana)S.mana=Math.min(S.maxMana,S.mana+item.mana);S.inventory.splice(index,1);toast(`${item.name} used`);save();renderJournal('gear');}return;}
    const skill=target.closest('[data-skill]');if(skill){const node=SKILLS.find(s=>s.id===skill.dataset.skill);if(node&&S.skillPoints>=node.cost&&(!node.requires||hasSkill(node.requires))){S.skillPoints-=node.cost;S.skills.push(node.id);sfx('success');toast(`${node.name} unlocked`);save();renderJournal('skills');}return;}
    const consider=target.closest('[data-consider]');if(consider&&!S.faction){openFactionConfirm(consider.dataset.consider);return;}
    const factionCancel=target.closest('[data-faction-cancel]');if(factionCancel){openFaction(factionCancel.dataset.factionCancel);return;}
    const join=target.closest('[data-join]');if(join&&!S.faction){S.faction=join.dataset.join;S.factionRep[S.faction]=25;if(S.faction==='ashen'){S.maxMana+=18;S.mana=S.maxMana;}S.mainStep=Math.max(S.mainStep,5);sfx('success');save();closeInteraction();subtitle(`${FACTIONS[S.faction].name} welcomes you. The Moonfall road is open.`,3);return;}
    const mount=target.closest('[data-mount]');if(mount){if(mount.dataset.mount==='buy'){const price=S.sideQuests.stable==='complete'?120:180;if(S.gold>=price){S.gold-=price;S.mounts.push('windstrider');S.activeMount='windstrider';sfx('success');save();openStable();}}else{S.activeMount=S.activeMount?null:'windstrider';save();openStable();}return;}
    const travel=target.closest('[data-travel]');if(travel){closeInteraction();enterZone(travel.dataset.travel);save();return;}
    const setting=target.closest('[data-setting]');if(setting){const key=setting.dataset.setting;S.settings[key]=!S.settings[key];applySettings();save();renderJournal('settings');return;}
    if(target.closest('[data-save]')){save();toast('Journey saved');return;}
    if(target.closest('[data-reset]')){if(confirm('Erase this journey and begin again?')){localStorage.removeItem(SAVE_KEY);localStorage.removeItem(LEGACY_SAVE_KEY);location.reload();}return;}
    const econ=target.closest('[data-economy]');if(econ){if(econ.dataset.economy==='collect'){S.gold+=S.treasury;S.treasury=0;toast('Treasury transferred');}else advanceDay();save();renderJournal('economy');return;}
    const prop=target.closest('[data-property]');if(prop&&S.gold>=350){S.gold-=350;S.properties.smithy={level:0,lastProfit:0,total:0};toast('Ember & Anvil added to portfolio');save();renderJournal('economy');}
  }

  function spawnBurst(x,y,color,count){for(let i=0;i<count;i++){const a=random(0,Math.PI*2),sp=random(20,105);particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:random(.25,.7),max:.7,color,size:random(2,5)});}}
  function floatText(x,y,text,color){damageTexts.push({x,y,text,color,life:.85});}
  function drawWorld(){const z=zone();const art=z.type==='town'&&imageReady.bg?bg:z.type==='wild'&&imageReady.greenwake?greenwakeBg:z.type==='ruins'&&imageReady.moonfall?moonfallBg:null;if(art){ctx.drawImage(art,0,0,z.width,z.height);ctx.fillStyle=z.type==='town'?'rgba(5,28,22,.08)':'rgba(2,18,15,.05)';ctx.fillRect(0,0,z.width,z.height);}else{const grad=ctx.createLinearGradient(0,0,0,z.height);grad.addColorStop(0,z.tint);grad.addColorStop(1,'#071713');ctx.fillStyle=grad;ctx.fillRect(0,0,z.width,z.height);drawGroundPattern(z);}for(const d of decor)drawDecor(d);}
  function drawGroundPattern(z){ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=z.type==='ruins'?'#86aab4':'#8ebc8c';ctx.lineWidth=2;for(let y=80;y<z.height;y+=90){ctx.beginPath();for(let x=0;x<z.width;x+=48){ctx.lineTo(x,y+Math.sin(x*.02+y)*12);}ctx.stroke();}ctx.restore();}
  function drawDecor(d){ctx.save();ctx.translate(d.x,d.y);ctx.scale(d.s,d.s);if(d.kind==='tree'){ctx.fillStyle='#0d2419';ctx.fillRect(-5,-12,10,30);ctx.fillStyle='#173f28';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc((i-1)*11,-18-i*10,24-i*3,0,7);ctx.fill();}}else if(d.kind==='rock'||d.kind==='pillar'){ctx.fillStyle=d.kind==='pillar'?'#57696b':'#394d43';ctx.beginPath();ctx.moveTo(-15,12);ctx.lineTo(-10,-18);ctx.lineTo(9,-24);ctx.lineTo(17,10);ctx.closePath();ctx.fill();}else if(d.kind==='crystal'){ctx.fillStyle='#68dccc88';ctx.shadowColor='#6affea';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(10,4);ctx.lineTo(0,15);ctx.lineTo(-10,4);ctx.closePath();ctx.fill();}else if(d.kind==='lamp'){ctx.strokeStyle='#9b7948';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,14);ctx.lineTo(0,-14);ctx.stroke();ctx.fillStyle='#ffe491';ctx.shadowColor='#ffc85c';ctx.shadowBlur=15;ctx.fillRect(-4,-18,8,9);}else if(d.kind==='table'){ctx.fillStyle='#5a3c26';ctx.fillRect(-18,-10,36,20);}else{ctx.fillStyle='#84b875';ctx.fillRect(-2,-8,4,14);ctx.fillStyle='#d8a8dc';ctx.fillRect(-6,-11,12,5);}ctx.restore();}
  function shadow(x,y,r){ctx.save();ctx.globalAlpha=.42;ctx.fillStyle='#00100e';ctx.beginPath();ctx.ellipse(x,y,r,r*.34,0,0,7);ctx.fill();ctx.restore();}
  function drawHero(){const moving=Math.hypot(input.x,input.y)>.12||[...keys].some(k=>/Arrow|Key[WASD]/.test(k));const bob=moving?Math.sin(performance.now()/70)*2:Math.sin(performance.now()/280);shadow(S.x,S.y+18,S.activeMount?25:17);ctx.save();ctx.translate(S.x,S.y+bob);if(lastFacing.x<-.15)ctx.scale(-1,1);if(invuln>0&&Math.floor(invuln*20)%2===0)ctx.globalAlpha=.45;if(S.activeMount){ctx.fillStyle='#9a683f';ctx.beginPath();ctx.ellipse(0,8,29,18,0,0,7);ctx.fill();ctx.fillStyle='#d2a171';ctx.beginPath();ctx.arc(20,-1,11,0,7);ctx.fill();ctx.translate(0,-13);}ctx.shadowColor='#68ffe1';ctx.shadowBlur=invuln>0?16:4;if(imageReady.hero)ctx.drawImage(hero,-24,-52,48,64);else{ctx.fillStyle='#2e7955';ctx.fillRect(-12,-18,24,34);ctx.fillStyle='#efb184';ctx.beginPath();ctx.arc(0,-20,9,0,7);ctx.fill();}ctx.restore();}
  function drawNpc(o){shadow(o.x,o.y+14,15);ctx.save();ctx.translate(o.x,o.y);if(o.id==='mira'&&imageReady.mira)ctx.drawImage(miraArt,-31,-51,62,66);else{const hue=(o.id.charCodeAt(0)*37)%360;ctx.fillStyle=`hsl(${hue} 38% 42%)`;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(-15,18);ctx.lineTo(15,18);ctx.closePath();ctx.fill();ctx.fillStyle='#e3b38a';ctx.beginPath();ctx.arc(0,-23,8,0,7);ctx.fill();}ctx.restore();}
  function drawCompanion(){if(!companionActive())return;shadow(companion.x,companion.y+14,14);ctx.save();ctx.translate(companion.x,companion.y);ctx.shadowColor='#ffe58a';ctx.shadowBlur=8;if(imageReady.mira)ctx.drawImage(miraArt,-28,-47,56,60);else{ctx.fillStyle='#6f3d76';ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(-14,17);ctx.lineTo(14,17);ctx.closePath();ctx.fill();}ctx.restore();}
  function drawObject(o){if(o.kind==='npc'||o.kind==='shop'||o.kind==='rest'||o.kind==='stable'||o.kind==='faction')drawNpc(o);else if(o.kind==='portal'){ctx.save();ctx.translate(o.x,o.y);const pulse=1+Math.sin(performance.now()/260+o.x)*.12;ctx.scale(pulse,pulse);ctx.fillStyle='#ffe086';ctx.shadowColor='#ffd15b';ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff4ba';ctx.lineWidth=2;ctx.stroke();ctx.restore();}else if(o.kind==='waystone'){ctx.save();ctx.translate(o.x,o.y);ctx.fillStyle='#62e4d0';ctx.shadowColor='#69ffea';ctx.shadowBlur=22;ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(14,0);ctx.lineTo(0,28);ctx.lineTo(-14,0);ctx.closePath();ctx.fill();ctx.restore();}else if(o.kind==='chest'){ctx.fillStyle=S.opened.includes(o.id)?'#3b3429':'#b68536';ctx.fillRect(o.x-18,o.y-10,36,24);ctx.strokeStyle='#f0cf76';ctx.strokeRect(o.x-18,o.y-10,36,24);}if(distance(S,o)<150){ctx.save();ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff3c5';ctx.strokeStyle='#04110e';ctx.lineWidth=4;ctx.strokeText(o.name,o.x,o.y-42);ctx.fillText(o.name,o.x,o.y-42);ctx.restore();}}
  function drawEnemyTelegraph(e){const pulse=.5+.5*Math.sin(performance.now()/45);ctx.save();ctx.translate(e.x,e.y);ctx.strokeStyle=`rgba(255,73,56,${.68+.25*pulse})`;ctx.fillStyle=`rgba(255,45,34,${.09+.07*pulse})`;ctx.lineWidth=4;if(e.attackKind==='radial'){ctx.beginPath();ctx.arc(0,0,e.r+72*(1-e.stateTimer/e.telegraphDuration),0,7);ctx.fill();ctx.stroke();}else if(e.attackKind==='bolt'){ctx.rotate(Math.atan2(e.attackDir.y,e.attackDir.x));ctx.beginPath();ctx.moveTo(e.r,0);ctx.lineTo(230,-18);ctx.lineTo(230,18);ctx.closePath();ctx.fill();ctx.stroke();}else{ctx.rotate(Math.atan2(e.attackDir.y,e.attackDir.x));ctx.beginPath();ctx.moveTo(2,-e.r*.8);ctx.lineTo(e.r+76,-34);ctx.lineTo(e.r+76,34);ctx.lineTo(2,e.r*.8);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();}
  function drawEnemy(e){if(e.state==='windup')drawEnemyTelegraph(e);shadow(e.x,e.y+e.r*.72,e.r*.9);ctx.save();ctx.translate(e.x,e.y);if(e.flash>0)ctx.filter='brightness(3)';let rot=0,scaleX=1,scaleY=1,offset=0;if(e.state==='windup'){const p=1-e.stateTimer/e.telegraphDuration;scaleX=1-.12*p;scaleY=1+.16*p;rot=Math.sin(p*Math.PI)*-.12;}if(e.state==='attack'){offset=10;scaleX=1.2;scaleY=.84;}if(e.state==='recover'){scaleX=1.08;scaleY=.92;}ctx.rotate(rot);ctx.translate(e.attackDir.x*offset,e.attackDir.y*offset);ctx.scale(scaleX,scaleY);if(e.kind==='wisp'){ctx.shadowColor='#69ffe8';ctx.shadowBlur=18;ctx.fillStyle='#74f4dd55';ctx.beginPath();ctx.arc(0,0,22,0,7);ctx.fill();ctx.fillStyle='#cafff3';ctx.beginPath();ctx.moveTo(0,-17);ctx.quadraticCurveTo(21,0,0,21);ctx.quadraticCurveTo(-21,0,0,-17);ctx.fill();ctx.fillStyle='#153b39';ctx.fillRect(-7,-4,4,4);ctx.fillRect(3,-4,4,4);}else if(e.kind==='warden'&&imageReady.warden){ctx.shadowColor='#69ffe8';ctx.shadowBlur=12;ctx.drawImage(wardenArt,-66,-94,132,122);}else{ctx.shadowColor=e.kind==='briar'?'#8ecf63':'#69ffe8';ctx.shadowBlur=10;ctx.fillStyle=e.kind==='briar'?'#45662f':'#536b65';ctx.beginPath();ctx.moveTo(0,-e.r*1.25);ctx.lineTo(e.r,-e.r*.55);ctx.lineTo(e.r*1.05,e.r*.75);ctx.lineTo(0,e.r);ctx.lineTo(-e.r*1.05,e.r*.75);ctx.lineTo(-e.r,-e.r*.55);ctx.closePath();ctx.fill();ctx.strokeStyle=e.kind==='briar'?'#9cbb62':'#9cb3a8';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ff685e';ctx.fillRect(-e.r*.45,-e.r*.55,e.r*.3,5);ctx.fillRect(e.r*.15,-e.r*.55,e.r*.3,5);}ctx.restore();if(e.hp<e.maxHp){ctx.fillStyle='#07100e';ctx.fillRect(e.x-e.r,e.y-e.r-19,e.r*2,6);ctx.fillStyle='#ed6d5b';ctx.fillRect(e.x-e.r+1,e.y-e.r-18,(e.r*2-2)*e.hp/e.maxHp,4);}}
  function drawLoot(){for(const d of loot){const bob=Math.sin(performance.now()/140+d.x)*3;ctx.save();ctx.translate(d.x,d.y+bob);if(d.kind==='gold'){ctx.fillStyle='#ffd963';ctx.shadowColor='#ffcb4f';ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,7);ctx.fill();ctx.strokeStyle='#8d5e1d';ctx.stroke();}else{const color=RARITY[d.rarity||ITEM_TEMPLATES[d.itemId]?.rarity||'Uncommon'];ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=14;ctx.fillRect(-7,-7,14,14);ctx.globalAlpha=.25;ctx.fillRect(-2,-Math.min(120,d.age*35+28),4,Math.min(120,d.age*35+28));}ctx.restore();}}
  function drawProjectiles(){for(const p of projectiles){const friendly=p.kind==='player'||p.kind==='companion';ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor=friendly?'#68ffec':'#ff755f';ctx.shadowBlur=18;ctx.fillStyle=p.kind==='companion'?'#fff1a0':friendly?'#bcfff5':'#ff9278';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.strokeStyle=friendly?'#63ebdb':'#bf3b32';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();}}
  function drawEffects(){for(const p of particles){ctx.save();ctx.globalAlpha=clamp(p.life/(p.max||1),0,1);if(p.kind==='slash'){ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle=p.color;ctx.lineWidth=5+p.size;ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,28+p.size*4,-1.2,1.2);ctx.stroke();}else{ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.restore();}for(const t of damageTexts){ctx.save();ctx.globalAlpha=t.life/.85;ctx.fillStyle=t.color;ctx.strokeStyle='#06100e';ctx.lineWidth=3;ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.strokeText(t.text,t.x,t.y);ctx.fillText(t.text,t.x,t.y);ctx.restore();}}
  function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,VIEW_W,VIEW_H);const sx=S.settings.reducedMotion?0:random(-shake,shake),sy=S.settings.reducedMotion?0:random(-shake,shake);ctx.save();ctx.translate(-camera.x+sx,-camera.y+sy);drawWorld();for(const o of objectsForZone())drawObject(o);const actors=[...enemies.filter(e=>!e.dead).map(e=>({y:e.y,type:'enemy',o:e})),...(companionActive()?[{y:companion.y,type:'companion'}]:[]),{y:S.y,type:'hero'}].sort((a,b)=>a.y-b.y);for(const a of actors){if(a.type==='hero')drawHero();else if(a.type==='companion')drawCompanion();else drawEnemy(a.o);}drawLoot();drawProjectiles();drawEffects();ctx.restore();if(hurtFlash>0){ctx.fillStyle=`rgba(255,55,40,${hurtFlash*.35})`;ctx.fillRect(0,0,VIEW_W,VIEW_H);}if(screenFlash>0){ctx.fillStyle=`rgba(170,255,235,${screenFlash*.42})`;ctx.fillRect(0,0,VIEW_W,VIEW_H);}}

  function update(dt){if(paused)return;S.playTime+=dt;saveClock+=dt;zoneGrace=Math.max(0,zoneGrace-dt);updatePlayer(dt);updateEnemies(dt);updateCompanion(dt);updateProjectiles(dt);updateLoot(dt);updateCamera(dt);updateEffects(dt);updateInteraction();updateHUD();el.attackCooldown.style.height=`${attackCd/.42*100}%`;el.spellCooldown.style.height=`${spellCd/1.05*100}%`;el.dodgeCooldown.style.height=`${dodgeCd/.82*100}%`;if(saveClock>4){save();saveClock=0;}}
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
  addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'){e.preventDefault();attack();}if(e.code==='KeyQ')castSpell();if(e.code==='ShiftLeft'||e.code==='ShiftRight')dodge();if(e.code==='KeyE')interact();if(e.code==='KeyM')openJournal('world');if(e.code==='KeyI')openJournal('gear');if(e.code==='Escape'){if(!el.interactionPanel.classList.contains('is-hidden'))closeInteraction();else if(!el.journal.classList.contains('is-hidden'))closeJournal();else openJournal('settings');}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();input.x=input.y=0;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){save();paused=true;return;}const modalOpen=[el.dialogue,el.journal,el.chapterComplete,el.interactionPanel].some(n=>!n.classList.contains('is-hidden'));if(running&&!modalOpen){paused=false;last=performance.now();}});
  el.newGameBtn.onclick=()=>{wakeAudio();if(S.style&&localStorage.getItem(SAVE_KEY)&&!confirm('Begin a new journey? Your current local journey will be replaced after you choose a new path.'))return;show(el.titleScreen,false);show(el.pathScreen,true);};
  el.continueBtn.onclick=()=>{wakeAudio();beginGame(false);};
  document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{wakeAudio();sfx('select');startNew(b.dataset.path);});
  el.dialogueNext.onclick=advanceDialogue;el.objectiveBtn.onclick=()=>openJournal('quest');el.fullscreenBtn.onclick=toggleFullscreen;el.pauseBtn.onclick=()=>openJournal('quest');el.closeJournal.onclick=closeJournal;el.closeInteraction.onclick=closeInteraction;
  document.querySelectorAll('.journal-tabs button').forEach(b=>b.onclick=()=>renderJournal(b.dataset.tab));
  el.journalBody.addEventListener('click',e=>handleUiAction(e.target));el.interactionBody.addEventListener('click',e=>handleUiAction(e.target));
  el.keepExploringBtn.onclick=()=>{show(el.chapterComplete,false);el.gameScreen.inert=false;paused=false;toast('Chapter II routes are recorded in your journal');updateHUD();};
  document.addEventListener('fullscreenchange',()=>{syncViewport();updateFullscreenButton();});document.addEventListener('webkitfullscreenchange',()=>{syncViewport();updateFullscreenButton();});

  let debugHarnessState = null;
  window.__EVERLIGHT_DEBUG__ = {
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

  applySettings();updateFullscreenButton();
  addEventListener('load',()=>setTimeout(()=>{show(el.loading,false);const qaCombat=['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).get('qa')==='combat';if(qaCombat){startQaCombatShowcase();return;}show(el.titleScreen,true);if((localStorage.getItem(SAVE_KEY)||localStorage.getItem(LEGACY_SAVE_KEY))&&S.style)show(el.continueBtn,true);},520));
})();
