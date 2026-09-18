/* Everlight v27 data-driven, code-native interiors for 960 x 720 rooms.
 * Public API: window.EVERLIGHT_INTERIORS
 */
(() => {
  'use strict';

  const WIDTH = 960;
  const HEIGHT = 720;
  const THEME_NAMES = Object.freeze([
    'house', 'market', 'inn', 'smithy', 'apothecary',
    'stable', 'workshop', 'warehouse', 'orchard', 'business'
  ]);
  const FURNITURE_ASSET = './assets/interior-furniture-v27.png?v=27';
  const SPRITE_CELLS = Object.freeze({
    bed:0,
    shelf:1, warehouseRack:1,
    hearth:2,
    counter:3,
    forge:4,
    herbTable:5,
    crates:6, pallet:6, parts:6,
    stall:7,
    loom:8,
    barrels:9, kegs:9,
    sacks:10, baskets:10,
    runner:11,
    table:12, desk:12,
    planter:13,
    workbench:14, assembly:14,
    cabinet:15, display:15, herbRack:15
  });
  let furnitureAtlas = null;
  let furnitureReady = false;
  if (typeof Image !== 'undefined') {
    furnitureAtlas = new Image();
    furnitureAtlas.onload = () => { furnitureReady = true; };
    furnitureAtlas.onerror = () => { furnitureReady = false; };
    furnitureAtlas.src = FURNITURE_ASSET;
  }

  const piece = (kind, x, y, w, h, solid = true, detail = '') =>
    Object.freeze({ kind, x, y, w, h, solid, detail });

  /* Blocking furniture deliberately leaves a broad loop from the south door to
   * the resident, ledger and northwest keepsake. Decoration inside that loop is
   * non-blocking so visual density never costs navigation clarity. */
  const THEMES = Object.freeze({
    house: Object.freeze({
      label:'Wayfarer Home', wall:'#584838', floor:'#705c42', trim:'#b99a65', accent:'#bf7658', rug:'#74403d',
      zones:Object.freeze(['sleeping alcove','family hearth','shared table','craft corner']),
      pieces:Object.freeze([
        piece('bed',62,166,218,105), piece('shelf',710,164,184,106),
        piece('hearth',62,425,166,104), piece('table',382,300,190,86),
        piece('cabinet',718,438,164,88), piece('loom',72,306,130,82,false),
        piece('chair',594,292,44,54,false), piece('plant',840,300,38,50,false),
        piece('wallArt',370,91,220,48,false), piece('runner',360,476,250,104,false)
      ])
    }),
    market: Object.freeze({
      label:'Trading House', wall:'#534637', floor:'#66543c', trim:'#c4a76b', accent:'#5d9b83', rug:'#355d55',
      zones:Object.freeze(['dry-goods wall','merchant counter','packing bay','local produce']),
      pieces:Object.freeze([
        piece('shelf',58,164,208,102), piece('shelf',700,164,204,102),
        piece('counter',366,280,230,82), piece('crates',64,424,170,105),
        piece('sacks',724,430,166,94), piece('scales',445,253,66,34,false),
        piece('barrels',76,304,122,82,false), piece('basket',794,302,80,62,false),
        piece('wallArt',370,91,220,48,false), piece('runner',354,420,260,112,false)
      ])
    }),
    inn: Object.freeze({
      label:'Roadside Hearth', wall:'#594633', floor:'#735a3d', trim:'#d0a467', accent:'#c96f51', rug:'#7c4137',
      zones:Object.freeze(['guest bunks','tap counter','story table','warming hearth']),
      pieces:Object.freeze([
        piece('bed',56,164,218,116), piece('bed',690,164,218,116),
        piece('hearth',58,425,172,108), piece('counter',710,312,184,96),
        piece('table',360,292,210,92), piece('kegs',738,440,145,88),
        piece('table',280,445,126,70,false), piece('table',535,445,126,70,false),
        piece('wallArt',370,91,220,48,false), piece('runner',376,410,208,130,false)
      ])
    }),
    smithy: Object.freeze({
      label:'Forge & Anvil', wall:'#4d3b31', floor:'#5d4b3d', trim:'#c27d4f', accent:'#dc6a3f', rug:'#513835',
      zones:Object.freeze(['stone forge','anvil floor','tool wall','tempering bench']),
      pieces:Object.freeze([
        piece('forge',56,160,238,138), piece('weaponRack',704,162,196,108),
        piece('anvil',390,296,164,98), piece('coal',62,434,178,96),
        piece('workbench',704,432,182,98), piece('barrels',78,322,112,72,false),
        piece('tools',760,286,94,64,false), piece('quench',574,300,70,75,false),
        piece('wallArt',370,91,220,48,false), piece('runner',366,432,226,98,false)
      ])
    }),
    apothecary: Object.freeze({
      label:'Herbs & Remedies', wall:'#3d4b3e', floor:'#526047', trim:'#9eb47a', accent:'#77b08c', rug:'#425e55',
      zones:Object.freeze(['dried-herb wall','mixing counter','still room','remedy cabinet']),
      pieces:Object.freeze([
        piece('herbRack',58,160,224,108), piece('cabinet',704,160,194,110),
        piece('workbench',354,292,234,92), piece('cauldron',60,426,174,104),
        piece('herbTable',710,428,180,98), piece('bottles',730,290,142,74,false),
        piece('planter',76,306,128,74,false), piece('stool',610,304,48,52,false),
        piece('wallArt',370,91,220,48,false), piece('runner',370,426,220,106,false)
      ])
    }),
    stable: Object.freeze({
      label:'Mount & Tack Hall', wall:'#514936', floor:'#64563d', trim:'#bd9e5c', accent:'#8ca45c', rug:'#5b5234',
      zones:Object.freeze(['west stall','east stall','tack wall','feed station']),
      pieces:Object.freeze([
        piece('stall',52,158,226,190), piece('stall',682,158,226,190),
        piece('tackRack',62,426,182,100), piece('desk',716,430,170,94),
        piece('hay',370,278,178,104), piece('trough',62,365,176,52,false),
        piece('trough',720,365,170,52,false), piece('saddle',390,414,140,68,false),
        piece('wallArt',370,91,220,48,false), piece('runner',370,478,220,78,false)
      ])
    }),
    workshop: Object.freeze({
      label:'Artisan Workshop', wall:'#4b4841', floor:'#5c584d', trim:'#b9a56f', accent:'#6fa5a1', rug:'#405b5d',
      zones:Object.freeze(['tool bench','assembly table','pattern archive','finished goods']),
      pieces:Object.freeze([
        piece('workbench',58,162,228,108), piece('cabinet',702,162,198,108),
        piece('assembly',356,288,230,102), piece('parts',62,430,178,98),
        piece('blueprints',710,432,180,96), piece('loom',74,298,132,90,false),
        piece('tools',740,292,122,70,false), piece('stool',614,304,48,52,false),
        piece('wallArt',370,91,220,48,false), piece('runner',366,430,226,104,false)
      ])
    }),
    warehouse: Object.freeze({
      label:'Storehouse', wall:'#48443b', floor:'#5b5446', trim:'#a99468', accent:'#b78a53', rug:'#51473b',
      zones:Object.freeze(['receiving racks','secured stock','packing pallet','clerk station']),
      pieces:Object.freeze([
        piece('warehouseRack',52,158,226,132), piece('warehouseRack',682,158,226,132),
        piece('pallet',360,288,218,105), piece('crates',58,426,184,104),
        piece('desk',716,432,170,92), piece('barrels',74,310,130,88,false),
        piece('sacks',740,304,128,78,false), piece('handcart',390,426,152,76,false),
        piece('wallArt',370,91,220,48,false), piece('runner',368,500,224,56,false)
      ])
    }),
    orchard: Object.freeze({
      label:'Indoor Orchard', wall:'#3e4c38', floor:'#536047', trim:'#aeb46d', accent:'#8fb65e', rug:'#485a3c',
      zones:Object.freeze(['sapling beds','fruit press','sorting table','preserve shelves']),
      pieces:Object.freeze([
        piece('planter',54,160,230,120), piece('planter',690,160,214,120),
        piece('press',372,288,190,106), piece('baskets',58,428,180,98),
        piece('herbTable',708,430,180,96), piece('tree',94,292,110,118,false),
        piece('jars',740,298,120,72,false), piece('stool',602,304,48,52,false),
        piece('wallArt',370,91,220,48,false), piece('runner',366,436,230,100,false)
      ])
    }),
    business: Object.freeze({
      label:'Vale Enterprise', wall:'#444740', floor:'#58594d', trim:'#b2a36d', accent:'#7da6a0', rug:'#45565a',
      zones:Object.freeze(['service counter','production floor','stock wall','manager desk']),
      pieces:Object.freeze([
        piece('shelf',58,160,216,106), piece('cabinet',700,160,202,108),
        piece('counter',364,286,230,88), piece('workbench',62,430,178,98),
        piece('desk',716,430,170,94), piece('crates',76,304,128,78,false),
        piece('display',742,294,126,74,false), piece('stool',610,302,48,52,false),
        piece('wallArt',370,91,220,48,false), piece('runner',366,430,230,106,false)
      ])
    })
  });

  function hash(value) {
    let result = 2166136261;
    const text = String(value || 'everlight');
    for (let i = 0; i < text.length; i++) { result ^= text.charCodeAt(i); result = Math.imul(result, 16777619); }
    return result >>> 0;
  }

  function hex(value, fallback) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(value || ''));
    return match ? match[1] : fallback.replace('#', '');
  }

  function mix(first, second, amount = .5) {
    const a = hex(first, '#000000'), b = hex(second, '#000000');
    const channel = index => Math.round(
      parseInt(a.slice(index, index + 2), 16) * (1 - amount) +
      parseInt(b.slice(index, index + 2), 16) * amount
    ).toString(16).padStart(2, '0');
    return `#${channel(0)}${channel(2)}${channel(4)}`;
  }

  function resolvedTheme(options = {}) {
    if (typeof options === 'string') return THEMES[options] ? options : 'business';
    const business = String(options.businessType || '').toLowerCase();
    if (THEMES[business]) return business;
    if (business === 'farm') return 'orchard';
    if (business === 'lodge') return 'house';
    const building = options.building || {};
    if (building.role === 'merchant') return 'market';
    if (building.role === 'rest') return 'inn';
    const hint = `${options.zoneId || ''} ${options.name || ''} ${building.name || ''}`.toLowerCase();
    if (/smith|anvil|forge/.test(hint)) return 'smithy';
    if (/apothec|herb|remed/.test(hint)) return 'apothecary';
    if (/stable|mount|tack/.test(hint)) return 'stable';
    if (/inn|hearth|mooncup/.test(hint)) return 'inn';
    if (/market|trading|outfitter|caravan/.test(hint)) return 'market';
    if (/orchard|grove|farm/.test(hint)) return 'orchard';
    if (/workshop|weaver|loom|artisan/.test(hint)) return 'workshop';
    if (/warehouse|storehouse/.test(hint)) return 'warehouse';
    return business ? 'business' : 'house';
  }

  function describe(options = {}) {
    if (typeof options === 'string') options = { theme:options };
    const theme = options.theme && THEMES[options.theme] ? options.theme : resolvedTheme(options);
    const def = THEMES[theme];
    const region = options.region || {};
    const sourcePalette = options.regionPalette || region.palette || [];
    const regionId = String(options.regionId || region.regionId || region.id || 'northford');
    const palette = Object.freeze({
      wall:mix(def.wall, sourcePalette[0] || '#263d34', .24),
      floor:mix(def.floor, sourcePalette[1] || '#55634c', .16),
      trim:mix(def.trim, sourcePalette[2] || '#c7ad72', .32),
      accent:mix(def.accent, sourcePalette[2] || '#7fb5a0', .48),
      rug:mix(def.rug, sourcePalette[0] || '#2e4a43', .22),
      shadow:'#101613', glow:mix('#ffd889', sourcePalette[2] || '#ffe19b', .24)
    });
    return Object.freeze({
      width:WIDTH, height:HEIGHT, theme, label:def.label,
      name:String(options.name || options.building?.name || def.label),
      regionId, biome:String(options.biome || region.biome || regionId),
      signature:hash(`${options.zoneId || options.name || theme}:${regionId}`),
      palette, zones:def.zones, pieces:def.pieces
    });
  }

  function solids(input = {}) {
    const room = describe(input);
    return room.pieces.filter(item => item.solid).map(item => [item.x, item.y, item.w, item.h]);
  }

  function rect(ctx, x, y, w, h, color, stroke) {
    if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
  }

  function shadow(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(5,10,8,.32)';
    ctx.fillRect(x + 7, y + 8, w, h);
  }

  function plank(ctx, x, y, w, h, color, trim) {
    shadow(ctx, x, y, w, h);
    rect(ctx, x, y, w, h, color, trim);
    ctx.fillStyle = mix(color, '#ffffff', .14);ctx.fillRect(x + 5, y + 5, w - 10, 7);
    ctx.fillStyle = mix(color, '#000000', .2);ctx.fillRect(x + 7, y + h - 9, w - 14, 5);
  }

  function drawShelfContents(ctx, x, y, w, rows, accent, seed) {
    const colors = [accent, '#c98b5d', '#8cb29a', '#d6bd76', '#8b759e'];
    for (let row = 0; row < rows; row++) {
      const shelfY = y + 13 + row * 27;
      ctx.fillStyle = '#3d2e25';ctx.fillRect(x + 6, shelfY + 19, w - 12, 5);
      for (let i = 0; i < Math.floor((w - 22) / 18); i++) {
        const height = 9 + ((seed + row * 13 + i * 7) % 11);
        ctx.fillStyle = colors[(seed + row + i) % colors.length];
        ctx.fillRect(x + 11 + i * 18, shelfY + 18 - height, 10 + ((seed + i) % 4), height);
      }
    }
  }

  function drawFurnitureSprite(ctx, item) {
    const cell = SPRITE_CELLS[item.kind];
    if (!furnitureReady || !furnitureAtlas || cell == null || typeof ctx.drawImage !== 'function') return false;
    const cellWidth = (furnitureAtlas.naturalWidth || furnitureAtlas.width || 1254) / 4;
    const cellHeight = (furnitureAtlas.naturalHeight || furnitureAtlas.height || 1254) / 4;
    const sourceX = (cell % 4) * cellWidth;
    const sourceY = Math.floor(cell / 4) * cellHeight;
    // The art is intentionally taller than its collision footprint. Keeping a
    // near-square presentation preserves the illustrated proportions while the
    // bottom anchor makes feet, rugs and furniture bases meet the authored floor.
    const drawWidth = Math.min(item.w * 1.06, 252);
    const drawHeight = Math.min(drawWidth * .9, item.h + 70);
    const drawX = item.x + (item.w - drawWidth) / 2;
    const drawY = item.y + item.h - drawHeight;
    ctx.drawImage(furnitureAtlas, sourceX, sourceY, cellWidth, cellHeight, drawX, drawY, drawWidth, drawHeight);
    return true;
  }

  function drawPiece(ctx, item, room) {
    const {x,y,w,h,kind} = item, p = room.palette, seed = room.signature + x * 3 + y;
    ctx.save();
    if (drawFurnitureSprite(ctx,item)) { ctx.restore(); return; }
    if (kind === 'bed') {
      plank(ctx,x,y,w,h,'#4b3529',p.trim);rect(ctx,x+10,y+10,w-20,h-20,'#d0bd91');
      rect(ctx,x+18,y+16,56,h-32,'#e8dcb7');rect(ctx,x+82,y+18,w-102,h-36,p.accent);
      ctx.fillStyle=mix(p.accent,'#ffffff',.18);for(let bx=x+90;bx<x+w-24;bx+=26)ctx.fillRect(bx,y+28,12,5);
    } else if (['shelf','warehouseRack','herbRack'].includes(kind)) {
      plank(ctx,x,y,w,h,kind==='herbRack'?'#3d4a34':'#44352a',p.trim);
      drawShelfContents(ctx,x,y,w,Math.max(2,Math.floor((h-10)/27)),kind==='herbRack'?'#78a66d':p.accent,seed);
      if(kind==='warehouseRack'){ctx.fillStyle='#c3a46d';for(let bx=x+13;bx<x+w-28;bx+=48)ctx.fillRect(bx,y+22,38,23);}
    } else if (['cabinet','display'].includes(kind)) {
      plank(ctx,x,y,w,h,'#49382c',p.trim);const half=(w-22)/2;
      rect(ctx,x+8,y+12,half,h-22,'#263c36',p.accent);rect(ctx,x+14+half,y+12,half,h-22,'#263c36',p.accent);
      drawShelfContents(ctx,x+10,y+4,w-20,Math.max(1,Math.floor(h/34)),p.accent,seed);
    } else if (['table','counter','workbench','herbTable','assembly','desk'].includes(kind)) {
      shadow(ctx,x,y,w,h);ctx.fillStyle=kind==='herbTable'?'#49523b':'#513a2a';ctx.fillRect(x,y+14,w,h-28);
      rect(ctx,x-4,y,w+8,22,kind==='counter'?mix(p.trim,'#5b3d28',.45):'#745438',p.trim);
      ctx.fillStyle='#34251e';ctx.fillRect(x+12,y+h-20,12,22);ctx.fillRect(x+w-24,y+h-20,12,22);
      ctx.fillStyle=p.accent;for(let bx=x+18;bx<x+w-18;bx+=38)ctx.fillRect(bx,y+6,17,6);
      if(kind==='desk'){rect(ctx,x+18,y+34,w-36,h-49,'#3b2c24',p.trim);ctx.fillStyle='#ded0a5';ctx.fillRect(x+34,y+6,58,8);}
      if(kind==='assembly'||kind==='workbench'){ctx.strokeStyle='#c7b47c';ctx.lineWidth=3;for(let bx=x+26;bx<x+w-18;bx+=42){ctx.beginPath();ctx.moveTo(bx,y+5);ctx.lineTo(bx+19,y+15);ctx.stroke();}}
    } else if (kind === 'hearth') {
      shadow(ctx,x,y,w,h);rect(ctx,x,y,w,h,'#514b42',p.trim);rect(ctx,x+22,y+24,w-44,h-24,'#171b18');
      const glow=ctx.createRadialGradient(x+w/2,y+h*.68,2,x+w/2,y+h*.68,w*.42);glow.addColorStop(0,'rgba(255,205,105,.62)');glow.addColorStop(1,'rgba(255,121,55,0)');ctx.fillStyle=glow;ctx.fillRect(x,y,w,h);
      ctx.fillStyle='#ec8a45';ctx.fillRect(x+w/2-25,y+h-42,50,23);ctx.fillStyle='#ffd477';ctx.fillRect(x+w/2-13,y+h-50,26,31);
      ctx.fillStyle='#24231f';for(let bx=x+4;bx<x+w-10;bx+=30)ctx.fillRect(bx,y+5,25,10);
    } else if (kind === 'forge') {
      shadow(ctx,x,y,w,h);rect(ctx,x,y,w,h,'#4e4943',p.trim);rect(ctx,x+28,y+28,w-56,h-28,'#161917');
      const glow=ctx.createRadialGradient(x+w*.5,y+h*.65,4,x+w*.5,y+h*.65,w*.44);glow.addColorStop(0,'rgba(255,225,120,.72)');glow.addColorStop(.4,'rgba(238,101,45,.56)');glow.addColorStop(1,'rgba(225,66,32,0)');ctx.fillStyle=glow;ctx.fillRect(x,y,w,h);
      ctx.fillStyle='#f08a43';ctx.fillRect(x+52,y+h-48,w-104,27);ctx.fillStyle='#ffd170';ctx.fillRect(x+84,y+h-61,w-168,39);
      ctx.fillStyle='#292c28';for(let bx=x+5;bx<x+w-15;bx+=34)ctx.fillRect(bx,y+6,28,13);
    } else if (kind === 'weaponRack' || kind === 'tools' || kind === 'tackRack') {
      plank(ctx,x,y,w,h,'#44352a',p.trim);ctx.strokeStyle=kind==='tackRack'?'#8d5a3d':'#c5c1ac';ctx.lineWidth=5;
      for(let bx=x+22;bx<x+w-15;bx+=34){ctx.beginPath();ctx.moveTo(bx,y+17);ctx.lineTo(bx+((seed+bx)%9)-4,y+h-18);ctx.stroke();}
      ctx.fillStyle=p.accent;ctx.fillRect(x+8,y+30,w-16,7);ctx.fillRect(x+8,y+h-34,w-16,7);
    } else if (kind === 'anvil') {
      shadow(ctx,x,y,w,h);rect(ctx,x+20,y+10,w-40,27,'#777c77',p.trim);rect(ctx,x+48,y+37,w-96,h-50,'#515955');
      ctx.fillStyle='#303733';ctx.fillRect(x+22,y+h-16,w-44,16);ctx.fillStyle='#a7aaa0';ctx.fillRect(x+30,y+15,w-60,6);
    } else if (kind === 'coal' || kind === 'parts' || kind === 'crates' || kind === 'pallet') {
      shadow(ctx,x,y,w,h);rect(ctx,x,y,w,h,kind==='coal'?'#272b29':'#70513a',p.trim);
      const size=kind==='parts'?18:kind==='coal'?22:34;for(let py=y+8;py<y+h-12;py+=size+5)for(let px=x+8;px<x+w-size;px+=size+6){ctx.fillStyle=kind==='coal'?((px+py)%3?'#353b37':'#202522'):((px+py)%3?'#865f40':'#65462f');ctx.fillRect(px,py,size,size-5);ctx.strokeStyle=kind==='coal'?'#485049':'#b18659';ctx.strokeRect(px,py,size,size-5);}
    } else if (kind === 'cauldron' || kind === 'quench' || kind === 'press') {
      shadow(ctx,x,y,w,h);rect(ctx,x+12,y+24,w-24,h-24,kind==='press'?'#573d2c':'#323a37',p.trim);
      ctx.fillStyle=kind==='quench'?'#4d898b':kind==='cauldron'?'#68a073':'#8c6946';ctx.fillRect(x+20,y+31,w-40,14);
      if(kind==='press'){ctx.fillStyle='#34261f';ctx.fillRect(x+w/2-8,y,16,h-24);ctx.fillRect(x+30,y+14,w-60,14);ctx.fillStyle=p.accent;ctx.fillRect(x+40,y+h-30,w-80,12);}
      else {for(let i=0;i<4;i++){ctx.fillStyle=`rgba(170,235,190,${.16+i*.04})`;ctx.beginPath();ctx.arc(x+w*.35+i*17,y+14-(i%2)*8,7+i,0,Math.PI*2);ctx.fill();}}
    } else if (kind === 'stall') {
      shadow(ctx,x,y,w,h);rect(ctx,x,y,w,h,'#4b3b2c',p.trim);rect(ctx,x+16,y+18,w-32,h-42,'#635038');
      ctx.fillStyle='#d4b36d';for(let py=y+28;py<y+h-34;py+=19)for(let px=x+22;px<x+w-28;px+=33)ctx.fillRect(px,py,25,5);
      ctx.fillStyle='#34271f';ctx.fillRect(x+8,y+h-42,w-16,12);ctx.fillRect(x+w/2-5,y,10,h);
      ctx.fillStyle=p.accent;ctx.fillRect(x+18,y+10,w-36,7);
    } else if (kind === 'hay' || kind === 'sacks' || kind === 'baskets') {
      shadow(ctx,x,y,w,h);ctx.fillStyle=kind==='hay'?'#b7954f':kind==='sacks'?'#a8956c':'#75543a';
      for(let py=y+10;py<y+h-24;py+=30)for(let px=x+10;px<x+w-34;px+=44){ctx.fillRect(px,py,34,25);ctx.strokeStyle=p.trim;ctx.strokeRect(px+1,py+1,32,23);}
      ctx.strokeStyle=kind==='hay'?'#e0c775':'#4b3b2b';ctx.lineWidth=2;for(let px=x+14;px<x+w-15;px+=20){ctx.beginPath();ctx.moveTo(px,y+8);ctx.lineTo(px+10,y+h-10);ctx.stroke();}
    } else if (kind === 'kegs' || kind === 'barrels') {
      for(let bx=x+8;bx<x+w-30;bx+=40){ctx.fillStyle='#69462d';ctx.fillRect(bx,y+12,32,h-22);ctx.strokeStyle=p.trim;ctx.strokeRect(bx+1,y+13,30,h-24);ctx.fillStyle='#302b26';ctx.fillRect(bx,y+25,32,5);ctx.fillRect(bx,y+h-25,32,5);}
    } else if (kind === 'planter') {
      shadow(ctx,x,y,w,h);rect(ctx,x,y+h-44,w,44,'#654936',p.trim);ctx.fillStyle='#263827';ctx.fillRect(x+8,y+8,w-16,h-55);
      for(let px=x+24;px<x+w-18;px+=38){ctx.fillStyle='#496d42';ctx.fillRect(px,y+31,7,h-70);ctx.beginPath();ctx.ellipse(px-5,y+27,13,7,-.45,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(px+12,y+40,14,8,.45,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.accent;ctx.beginPath();ctx.arc(px+5,y+22,6,0,Math.PI*2);ctx.fill();}
    } else if (kind === 'tree' || kind === 'plant') {
      ctx.fillStyle='#55402d';ctx.fillRect(x+w/2-6,y+h*.42,12,h*.43);ctx.fillStyle='#375a3c';
      for(const [ox,oy,r] of [[.5,.25,.25],[.32,.38,.2],[.68,.4,.21]]){ctx.beginPath();ctx.ellipse(x+w*ox,y+h*oy,w*r,h*r*.7,0,0,Math.PI*2);ctx.fill();}
      rect(ctx,x+w*.27,y+h*.82,w*.46,h*.17,'#76543c',p.trim);
    } else if (kind === 'loom') {
      ctx.strokeStyle='#725139';ctx.lineWidth=7;ctx.strokeRect(x+6,y+6,w-12,h-12);ctx.lineWidth=2;
      for(let bx=x+14;bx<x+w-12;bx+=10){ctx.strokeStyle=(bx/10)%2?p.accent:p.trim;ctx.beginPath();ctx.moveTo(bx,y+12);ctx.lineTo(bx,y+h-13);ctx.stroke();}
      ctx.fillStyle='#493426';ctx.fillRect(x,y+h-14,w,9);
    } else if (kind === 'blueprints' || kind === 'wallArt') {
      const inset=kind==='wallArt'?8:0;rect(ctx,x+inset,y+inset,w-inset*2,h-inset*2,'#d1c49a',p.trim);
      ctx.strokeStyle=mix(p.accent,'#263b39',.38);ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.strokeRect(x+18+i*13,y+18+i*5,42+i*12,18+i*5);}
    } else if (kind === 'scales') {
      ctx.strokeStyle=p.trim;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2,y+h-7);ctx.moveTo(x+8,y+10);ctx.lineTo(x+w-8,y+10);ctx.stroke();
      ctx.fillStyle=p.accent;ctx.beginPath();ctx.ellipse(x+15,y+h-10,14,6,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+w-15,y+h-10,14,6,0,0,Math.PI*2);ctx.fill();
    } else if (['chair','stool'].includes(kind)) {
      ctx.fillStyle='#5a402e';ctx.fillRect(x+6,y+h*.45,w-12,h*.24);ctx.fillRect(x+9,y+h*.65,7,h*.35);ctx.fillRect(x+w-16,y+h*.65,7,h*.35);ctx.fillRect(x+8,y+4,8,h*.45);
    } else if (kind === 'runner') {
      rect(ctx,x,y,w,h,p.rug,p.trim);ctx.fillStyle=mix(p.rug,p.accent,.42);ctx.fillRect(x+12,y+10,w-24,7);ctx.fillRect(x+12,y+h-17,w-24,7);
      for(let bx=x+24;bx<x+w-18;bx+=32){ctx.fillRect(bx,y+h/2-4,16,8);}
    } else if (kind === 'trough') {
      rect(ctx,x,y,w,h,'#4d3b2d',p.trim);ctx.fillStyle='#283b31';ctx.fillRect(x+10,y+8,w-20,h-22);
    } else if (kind === 'saddle') {
      ctx.fillStyle='#63422e';ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w*.42,h*.34,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.trim;ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#3f2d24';ctx.fillRect(x+w*.43,y+h*.1,w*.14,h*.8);
    } else if (kind === 'jars' || kind === 'bottles') {
      for(let py=y+6;py<y+h-16;py+=28)for(let px=x+8;px<x+w-15;px+=24){ctx.fillStyle=[p.accent,'#b48e69','#759b7c'][(px+py+seed)%3];ctx.fillRect(px,py+6,15,17);ctx.fillStyle=p.trim;ctx.fillRect(px+4,py+2,7,5);}
    } else if (kind === 'basket') {
      ctx.fillStyle='#8d693f';ctx.beginPath();ctx.ellipse(x+w/2,y+h*.62,w*.43,h*.3,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.trim;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+w/2,y+h*.5,w*.29,Math.PI,Math.PI*2);ctx.stroke();
      ctx.fillStyle=p.accent;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x+18+i*12,y+h*.52-(i%2)*5,6,0,Math.PI*2);ctx.fill();}
    } else if (kind === 'handcart') {
      ctx.fillStyle='#674831';ctx.fillRect(x+14,y+8,w-28,h-30);ctx.strokeStyle=p.trim;ctx.lineWidth=4;ctx.strokeRect(x+15,y+9,w-30,h-32);for(const bx of[x+28,x+w-28]){ctx.beginPath();ctx.arc(bx,y+h-10,12,0,Math.PI*2);ctx.stroke();}
    }
    ctx.restore();
  }

  function drawMotif(ctx, room) {
    const x=480,y=116,accent=room.palette.accent,trim=room.palette.trim,biome=room.biome.toLowerCase();
    ctx.save();ctx.strokeStyle=accent;ctx.fillStyle=accent;ctx.lineWidth=3;ctx.globalAlpha=.82;
    ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.stroke();
    if (/verdant|forest|swamp|herb/.test(biome)) {
      for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.ellipse(0,-32,9,17,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    } else if (/coast|island|shipping/.test(biome)) {
      ctx.strokeStyle=trim;for(const radius of[32,39]){ctx.beginPath();ctx.arc(x,y,radius,.15,Math.PI-.15);ctx.stroke();}
    } else if (/frost|alpine|sky/.test(biome)) {
      for(let i=0;i<4;i++){ctx.save();ctx.translate(x,y);ctx.rotate(i*Math.PI/4);ctx.beginPath();ctx.moveTo(-38,0);ctx.lineTo(38,0);ctx.stroke();ctx.restore();}
    } else if (/desert|sun|highland|ember/.test(biome)) {
      ctx.fillStyle=trim;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillRect(x+Math.cos(a)*36-3,y+Math.sin(a)*36-3,6,6);}
    } else if (/astral|ruin|moon|aether/.test(biome)) {
      ctx.beginPath();ctx.ellipse(x,y,42,17,-.35,0,Math.PI*2);ctx.stroke();ctx.fillStyle=trim;ctx.beginPath();ctx.arc(x+34,y-19,5,0,Math.PI*2);ctx.fill();
    } else {
      ctx.fillStyle=trim;for(const [ox,oy] of[[-34,0],[34,0],[0,-34],[0,34]])ctx.fillRect(x+ox-4,y+oy-4,8,8);
    }
    ctx.restore();
  }

  function drawArchitecture(ctx, room) {
    const p=room.palette;
    ctx.fillStyle='#111713';ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle=p.floor;ctx.fillRect(38,142,884,543);
    for(let y=148,row=0;y<684;y+=28,row++)for(let x=42+(row%2)*30;x<920;x+=60){ctx.fillStyle=mix(p.floor,(x+y+room.signature)%3?'#ffffff':'#000000',.045);ctx.fillRect(x,y,56,25);}
    ctx.fillStyle=p.wall;ctx.fillRect(38,72,884,88);ctx.fillStyle=mix(p.wall,'#000000',.24);ctx.fillRect(18,72,24,613);ctx.fillRect(918,72,24,613);ctx.fillRect(18,681,924,20);
    ctx.fillStyle=p.trim;ctx.fillRect(38,151,884,8);ctx.fillRect(38,72,884,7);ctx.fillRect(42,130,876,5);
    for(let x=72;x<920;x+=112){ctx.fillStyle=mix(p.wall,'#ffffff',.09);ctx.fillRect(x,82,78,39);ctx.fillStyle=mix(p.trim,'#000000',.2);ctx.fillRect(x+37,82,4,39);ctx.fillRect(x,100,78,4);}
    drawMotif(ctx,room);
    // South threshold is visually unmistakable and aligned to the exit portal.
    rect(ctx,436,638,88,47,'#1d2823',p.trim);rect(ctx,446,647,68,38,mix(p.wall,'#000000',.16));
    ctx.fillStyle=p.glow;ctx.fillRect(452,678,56,5);
    for(const lx of[88,872]){
      const glow=ctx.createRadialGradient(lx,190,2,lx,190,82);glow.addColorStop(0,'rgba(255,226,153,.34)');glow.addColorStop(1,'rgba(255,211,118,0)');ctx.fillStyle=glow;ctx.fillRect(lx-82,108,164,164);
      ctx.fillStyle=p.trim;ctx.fillRect(lx-4,168,8,28);ctx.fillStyle=p.glow;ctx.fillRect(lx-7,158,14,13);
    }
  }

  function draw(ctx, options = {}) {
    if (!ctx || typeof ctx.fillRect !== 'function') return false;
    const room=describe(options);
    ctx.save();drawArchitecture(ctx,room);
    // Rugs and wall art sit beneath solid work zones; other accents render over them.
    for(const item of room.pieces.filter(item => ['runner','wallArt'].includes(item.kind)))drawPiece(ctx,item,room);
    for(const item of room.pieces.filter(item => !['runner','wallArt'].includes(item.kind)))drawPiece(ctx,item,room);
    ctx.restore();
    return room;
  }

  window.EVERLIGHT_INTERIORS = Object.freeze({
    version:27,
    width:WIDTH,
    height:HEIGHT,
    themes:THEME_NAMES,
    furnitureAsset:FURNITURE_ASSET,
    get spriteReady(){ return furnitureReady; },
    describe,
    solids,
    draw
  });
})();
