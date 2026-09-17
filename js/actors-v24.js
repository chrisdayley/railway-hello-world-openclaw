/* Everlight v24 code-native pixel actors.
 * Public API: window.EVERLIGHT_ACTORS.draw(ctx, actorOptions)
 */
(() => {
  'use strict';

  const W = 48;
  const H = 64;
  const FEET_Y = 60;
  const cache = new Map();
  const mountCache = new Map();

  const ROLE_THEMES = {
    smith:      { cloth:'#7e3e2c', clothHi:'#b8673e', clothLo:'#4b2a25', accent:'#d69a4c', metal:'#b8c1bd' },
    apothecary: { cloth:'#2e6d55', clothHi:'#5ba47b', clothLo:'#1c4137', accent:'#b6cf72', metal:'#9fcbbd' },
    innkeeper:  { cloth:'#7c3e4b', clothHi:'#b8686d', clothLo:'#48272f', accent:'#e6c286', metal:'#cbb69d' },
    guild:      { cloth:'#334f68', clothHi:'#5f8297', clothLo:'#202f42', accent:'#e2bb57', metal:'#afc3cb' },
    stable:     { cloth:'#66723c', clothHi:'#99a75b', clothLo:'#394427', accent:'#bd7a45', metal:'#a99c78' },
    scout:      { cloth:'#316f6b', clothHi:'#55a59a', clothLo:'#273d4a', accent:'#d59a5e', metal:'#b7d2ca' },
    merchant:   { cloth:'#69456f', clothHi:'#9b6d9e', clothLo:'#3e2d49', accent:'#e0b85c', metal:'#ceb98b' },
    resident:   { cloth:'#48677a', clothHi:'#7493a1', clothLo:'#2d3e4b', accent:'#c98b58', metal:'#a8b2ae' },
    vanguard:   { cloth:'#386b55', clothHi:'#65a077', clothLo:'#213f38', accent:'#e4bd62', metal:'#c7d1ce' },
    ranger:     { cloth:'#38635f', clothHi:'#60988a', clothLo:'#263b45', accent:'#ca8c53', metal:'#a9c5bc' },
    arcanist:   { cloth:'#52547e', clothHi:'#7c7eb1', clothLo:'#302f55', accent:'#72e0d0', metal:'#c1ced0' }
  };
  const NAMED_THEMES = {
    mara:  { cloth:'#9a612d', clothHi:'#d19a4c', clothLo:'#553a24', accent:'#e5c36f', metal:'#998a68' },
    rowan: { cloth:'#355d79', clothHi:'#668ca2', clothLo:'#243849', accent:'#b97843', metal:'#aab5ad' },
    sela:  { cloth:'#27766f', clothHi:'#55aaa0', clothLo:'#184740', accent:'#d7c77b', metal:'#afd1c4' },
    nella: { cloth:'#964b34', clothHi:'#cc7951', clothLo:'#542b2c', accent:'#efc47c', metal:'#c9b28d' },
    mira:  { cloth:'#2f6c69', clothHi:'#5aa49b', clothLo:'#32364f', accent:'#d39a5d', metal:'#b9d2ca' },
    brann: { cloth:'#813d2b', clothHi:'#c0643c', clothLo:'#3f2b28', accent:'#d89c4f', metal:'#bfc6c1' },
    orin:  { cloth:'#70472f', clothHi:'#a76e45', clothLo:'#392a24', accent:'#d4ae61', metal:'#abb6b2' }
  };

  const SKINS = [
    { base:'#dca47c', hi:'#f0c39b', shade:'#ad735a' },
    { base:'#ba795b', hi:'#d99a73', shade:'#80503f' },
    { base:'#8b5543', hi:'#ae7259', shade:'#5d382f' },
    { base:'#efc29a', hi:'#ffe0bb', shade:'#bf8669' },
    { base:'#c78e6a', hi:'#e4ad84', shade:'#925f4c' }
  ];
  const HAIRS = [
    { base:'#3c2926', hi:'#68443b', shade:'#211a1b' },
    { base:'#704328', hi:'#a76b37', shade:'#40291f' },
    { base:'#b28a55', hi:'#dec07d', shade:'#705735' },
    { base:'#292f3b', hi:'#526173', shade:'#171d27' },
    { base:'#6a3748', hi:'#9d5564', shade:'#3b2531' },
    { base:'#d4c6ac', hi:'#f0e8d4', shade:'#8f877c' }
  ];

  function hash(text) {
    let value = 2166136261;
    const string = String(text || 'everlight');
    for (let i = 0; i < string.length; i++) {
      value ^= string.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function canvas(width, height) {
    if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
    const node = document.createElement('canvas');
    node.width = width;
    node.height = height;
    return node;
  }

  function rect(ctx, color, x, y, width = 2, height = 2) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  function pixelLine(ctx, color, x0, y0, x1, y1, size = 2) {
    x0 = Math.round(x0 / size);
    y0 = Math.round(y0 / size);
    x1 = Math.round(x1 / size);
    y1 = Math.round(y1 / size);
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      rect(ctx, color, x0 * size, y0 * size, size, size);
      if (x0 === x1 && y0 === y1) break;
      const doubled = error * 2;
      if (doubled >= dy) { error += dy; x0 += sx; }
      if (doubled <= dx) { error += dx; y0 += sy; }
    }
  }

  function normalizeRole(options) {
    const supplied = String(options.role || '').toLowerCase();
    if (ROLE_THEMES[supplied]) return supplied;
    const identity = `${options.id || ''} ${options.name || ''} ${supplied}`.toLowerCase();
    if (/smith|brann|orin|forge/.test(identity)) return 'smith';
    if (/apoth|sela|lio|herb|alchem/.test(identity)) return 'apothecary';
    if (/inn|nella|tavern|moon.?cup/.test(identity)) return 'innkeeper';
    if (/guild|archiv|warden|recruit/.test(identity)) return 'guild';
    if (/stable|rowan|mara|groom/.test(identity)) return 'stable';
    if (/mira|scout|tarin|ranger|wayfind/.test(identity)) return 'scout';
    if (/merchant|trader|shop|broker/.test(identity)) return 'merchant';
    return options.player ? 'vanguard' : 'resident';
  }

  function directionOf(facing) {
    if (typeof facing === 'string' && /^(up|down|left|right)$/.test(facing)) return facing;
    const x = Number(facing?.x || 0);
    const y = Number(facing?.y || 0);
    if (Math.abs(x) > Math.abs(y)) return x < 0 ? 'left' : 'right';
    return y < 0 ? 'up' : 'down';
  }

  function paletteFor(options, role) {
    const identity = hash(`${options.id || ''}:${options.name || ''}:${role}`);
    const label = `${options.id || ''} ${options.name || ''}`.toLowerCase();
    const namedKey = Object.keys(NAMED_THEMES).find(name => label.includes(name));
    const theme = NAMED_THEMES[namedKey] || ROLE_THEMES[role] || ROLE_THEMES.resident;
    const residentThemes = [ROLE_THEMES.resident, ROLE_THEMES.stable, ROLE_THEMES.scout, ROLE_THEMES.innkeeper];
    return {
      ...(role === 'resident' && !namedKey ? residentThemes[identity % residentThemes.length] : theme),
      skin: SKINS[(identity >>> 3) % SKINS.length],
      hair: HAIRS[(identity >>> 7) % HAIRS.length],
      identity,
      namedKey,
      hairStyle: namedKey === 'mara' ? 2 : namedKey === 'rowan' ? 0 : namedKey === 'sela' ? 4 :
        namedKey === 'nella' ? 3 : namedKey === 'mira' ? 4 : (identity >>> 12) % 6
    };
  }

  function drawBoot(ctx, x, y, forward, palette) {
    rect(ctx, '#14201f', x, y - 1, 7, 7);
    rect(ctx, '#51372d', x + 1, y, 5, 5);
    rect(ctx, '#8a6042', x + 2 + (forward ? 1 : 0), y, 3, 2);
    rect(ctx, '#2a211d', x, y + 4, 8, 2);
    rect(ctx, '#0b1212', x - (forward ? 0 : 1), y + 6, 9, 2);
  }

  function drawHair(ctx, direction, hair, style) {
    const back = direction === 'up';
    // Layered, stair-stepped clusters read as hair rather than a rectangular helmet.
    rect(ctx, hair.shade, 20, 4, 11, 2);
    rect(ctx, hair.shade, 17, 6, 17, 3);
    rect(ctx, hair.shade, 15, 9, 21, 4);
    rect(ctx, hair.base, 21, 5, 8, 2);
    rect(ctx, hair.base, 18, 7, 14, 3);
    rect(ctx, hair.base, 16, 10, 18, 3);
    rect(ctx, hair.hi, 22, 6, 6, 2);
    rect(ctx, hair.hi, 18, 8, 5, 2);

    if (back) {
      rect(ctx, hair.base, 16, 12, 6, 5);
      rect(ctx, hair.base, 28, 12, 6, 5);
      rect(ctx, hair.shade, 17, 16, 5, 4);
      rect(ctx, hair.shade, 29, 16, 4, 4);
      rect(ctx, hair.hi, 20, 11, 5, 2);
      if (style === 2) { // braid
        rect(ctx, hair.base, 21, 12, 10, 6);
        rect(ctx, hair.shade, 24, 18, 6, 4);
        rect(ctx, hair.base, 25, 22, 5, 4);
        rect(ctx, hair.shade, 26, 26, 4, 4);
        rect(ctx, hair.base, 27, 30, 3, 3);
        rect(ctx, '#d4a758', 25, 21, 5, 2);
      } else if (style === 3) { // soft bob
        rect(ctx, hair.base, 19, 12, 13, 6);
        rect(ctx, hair.base, 17, 17, 5, 5);
        rect(ctx, hair.base, 28, 17, 5, 5);
        rect(ctx, hair.shade, 18, 21, 4, 4);
        rect(ctx, hair.shade, 29, 21, 3, 4);
      } else if (style === 4) { // tied tail
        rect(ctx, hair.base, 20, 12, 11, 5);
        rect(ctx, hair.shade, 21, 16, 9, 3);
        rect(ctx, '#d6a459', 29, 16, 4, 2);
        rect(ctx, hair.base, 32, 16, 4, 5);
        rect(ctx, hair.base, 34, 20, 4, 5);
        rect(ctx, hair.shade, 35, 24, 3, 5);
        rect(ctx, hair.hi, 33, 19, 2, 3);
      } else if (style === 1) { // curls
        rect(ctx, hair.base, 14, 13, 5, 5);
        rect(ctx, hair.base, 18, 17, 5, 5);
        rect(ctx, hair.shade, 31, 13, 5, 5);
        rect(ctx, hair.shade, 28, 18, 5, 5);
      } else if (style === 5) { // loose, uneven locks
        rect(ctx, hair.base, 20, 12, 11, 5);
        rect(ctx, hair.shade, 15, 18, 5, 5);
        rect(ctx, hair.shade, 22, 17, 5, 7);
        rect(ctx, hair.shade, 30, 18, 5, 4);
      }
      return;
    }

    if (style === 0) { // swept crop
      rect(ctx, hair.base, 15, 11, 6, 6);
      rect(ctx, hair.base, 21, 12, 7, 3);
      rect(ctx, hair.shade, 31, 10, 4, 8);
    } else if (style === 1) { // tousled curls
      rect(ctx, hair.base, 14, 11, 6, 6);
      rect(ctx, hair.hi, 20, 11, 5, 4);
      rect(ctx, hair.base, 27, 11, 6, 5);
      rect(ctx, hair.shade, 32, 13, 4, 8);
    } else if (style === 2) { // side braid
      rect(ctx, hair.base, 15, 11, 6, 8);
      rect(ctx, hair.base, 30, 11, 5, 7);
      rect(ctx, hair.shade, 31, 17, 5, 6);
      rect(ctx, hair.base, 33, 23, 4, 5);
      rect(ctx, hair.shade, 34, 28, 3, 4);
    } else if (style === 3) { // bob
      rect(ctx, hair.base, 14, 11, 6, 12);
      rect(ctx, hair.base, 30, 11, 6, 12);
      rect(ctx, hair.shade, 15, 21, 5, 5);
      rect(ctx, hair.shade, 30, 21, 5, 5);
    } else if (style === 4) { // ponytail
      rect(ctx, hair.base, 15, 11, 6, 8);
      rect(ctx, hair.shade, 31, 10, 5, 9);
      rect(ctx, hair.base, 34, 17, 5, 7);
      rect(ctx, hair.shade, 36, 23, 4, 6);
    } else { // uneven fringe
      rect(ctx, hair.base, 15, 11, 5, 8);
      rect(ctx, hair.base, 20, 11, 5, 5);
      rect(ctx, hair.base, 26, 11, 4, 3);
      rect(ctx, hair.shade, 31, 11, 4, 8);
    }
  }

  function drawHeadwear(ctx, direction, palette, role) {
    const label = palette.namedKey;
    if (role === 'guild') {
      rect(ctx, '#15212a', 15, 7, 21, 3);
      rect(ctx, '#15212a', 18, 3, 16, 5);
      rect(ctx, palette.cloth, 20, 2, 11, 5);
      rect(ctx, palette.clothHi, 21, 3, 6, 2);
      rect(ctx, palette.accent, 16, 8, 19, 2);
      rect(ctx, palette.accent, 32, 4, 2, 4);
    } else if (label === 'rowan') {
      rect(ctx, '#17211f', 16, 7, 20, 3);
      rect(ctx, '#17211f', 18, 3, 16, 5);
      rect(ctx, palette.cloth, 20, 2, 11, 5);
      rect(ctx, palette.clothHi, 21, 3, 6, 2);
      rect(ctx, '#1b2b35', direction === 'right' ? 31 : 14, 8, 7, 2);
    } else if (label === 'mara') {
      rect(ctx, '#422d23', 15, 7, 21, 3);
      rect(ctx, palette.accent, 16, 6, 19, 3);
      rect(ctx, palette.clothHi, direction === 'right' ? 14 : 33, 8, 4, 6);
    } else if (label === 'sela') {
      rect(ctx, '#173d39', 16, 6, 19, 3);
      rect(ctx, palette.clothHi, 17, 5, 17, 3);
      rect(ctx, palette.accent, 31, 7, 5, 4);
    } else if (role === 'merchant') {
      rect(ctx, '#2b2031', 14, 7, 23, 3);
      rect(ctx, palette.cloth, 17, 3, 16, 6);
      rect(ctx, palette.accent, 30, 2, 3, 6);
    }
  }

  function drawFace(ctx, direction, palette, role) {
    const { skin, hair, identity, hairStyle } = palette;
    const side = direction === 'right';
    const back = direction === 'up';
    rect(ctx, '#17211f', 17, 7, 17, 19);
    rect(ctx, '#17211f', 15, 11, 21, 11);
    rect(ctx, '#17211f', 19, 24, 13, 4);
    rect(ctx, skin.shade, 16, 11, 19, 10);
    rect(ctx, skin.base, 18, 8, 15, 16);
    rect(ctx, skin.base, 20, 23, 11, 3);
    rect(ctx, skin.hi, 20, 10, 7, 3);
    rect(ctx, skin.shade, 15, 15, 3, 5);
    rect(ctx, skin.base, 33, 14, 3, 6);

    if (back) {
      drawHair(ctx, direction, hair, hairStyle);
      drawHeadwear(ctx, direction, palette, role);
      return;
    }

    drawHair(ctx, direction, hair, hairStyle);
    drawHeadwear(ctx, direction, palette, role);

    if (direction === 'down') {
      rect(ctx, '#182322', 20, 16, 3, 2);
      rect(ctx, '#182322', 29, 16, 3, 2);
      rect(ctx, '#fff3cf', 21, 16, 1, 1);
      rect(ctx, '#fff3cf', 30, 16, 1, 1);
      rect(ctx, skin.shade, 24, 20, 4, 2);
      rect(ctx, '#7d4941', 25, 23, 4, 1);
    } else {
      const eyeX = side ? 29 : 19;
      rect(ctx, '#182322', eyeX, 16, 3, 2);
      rect(ctx, '#fff3cf', eyeX + 1, 16, 1, 1);
      rect(ctx, skin.shade, side ? 31 : 16, 20, 3, 2);
    }
  }

  function drawTorso(ctx, direction, palette, role, walk, action) {
    const side = direction === 'left' || direction === 'right';
    const back = direction === 'up';
    const armSwing = walk === 1 ? -2 : walk === 3 ? 2 : 0;
    const attackReach = action === 'attack' ? 9 : 0;

    // Stepped shoulders and hem keep the torso from reading as a single box.
    rect(ctx, '#17211f', 16, 26, 18, 3);
    rect(ctx, '#17211f', 13, 29, 24, 14);
    rect(ctx, '#17211f', 15, 43, 20, 7);
    rect(ctx, palette.clothLo, 15, 29, 20, 14);
    rect(ctx, palette.clothLo, 17, 42, 16, 6);
    rect(ctx, palette.cloth, 17, 28, 16, 14);
    rect(ctx, palette.cloth, 18, 41, 14, 6);
    rect(ctx, palette.clothHi, 18, 29, side ? 5 : 9, 3);
    rect(ctx, palette.clothHi, 18, 32, 3, 7);
    if (!back) {
      rect(ctx, palette.accent, side ? 18 : 22, 31, side ? 4 : 6, 4);
      rect(ctx, '#f5dda0', side ? 19 : 24, 32, 2, 2);
    }

    const leftArmY = 31 + armSwing;
    const rightArmY = 31 - armSwing;
    rect(ctx, '#17211f', 7, leftArmY - 1, 9, 19);
    rect(ctx, palette.clothLo, 8, leftArmY, 7, 14);
    rect(ctx, palette.skin.shade, 9, leftArmY + 13, 6, 6);
    rect(ctx, palette.skin.base, 10, leftArmY + 13, 5, 4);

    if (action === 'cast') {
      rect(ctx, '#17211f', 34, 23, 8, 18);
      rect(ctx, palette.cloth, 35, 24, 6, 12);
      rect(ctx, palette.skin.base, 35, 18, 6, 7);
      rect(ctx, '#cafff6', 37, 16, 3, 3);
    } else if (action === 'attack') {
      pixelLine(ctx, '#17211f', 35, 32, 39 + attackReach, 27, 4);
      pixelLine(ctx, palette.cloth, 34, 32, 39 + attackReach, 27, 2);
      rect(ctx, palette.skin.base, 38 + attackReach, 24, 5, 5);
    } else {
      rect(ctx, '#17211f', 34, rightArmY - 1, 9, 19);
      rect(ctx, palette.clothLo, 35, rightArmY, 7, 14);
      rect(ctx, palette.skin.shade, 35, rightArmY + 13, 6, 6);
      rect(ctx, palette.skin.base, 35, rightArmY + 13, 5, 4);
    }

    rect(ctx, '#192321', 14, 44, 22, 5);
    rect(ctx, '#755033', 15, 45, 20, 3);
    rect(ctx, '#9b7045', 17, 45, 5, 2);
    rect(ctx, palette.accent, 23, 44, 5, 5);
    rect(ctx, '#fff1b0', 24, 46, 2, 1);
  }

  function drawRoleAccessory(ctx, role, direction, palette, action) {
    const back = direction === 'up';
    if (role === 'smith') {
      rect(ctx, '#2b211e', 17, 35, 17, 15);
      rect(ctx, '#9a6541', 18, 35, 15, 13);
      rect(ctx, '#d19b62', 20, 36, 4, 9);
      pixelLine(ctx, '#382b25', 39, 31, 42, 18, 3);
      rect(ctx, palette.metal, 37, 17, 10, 5);
      rect(ctx, '#e4ece7', 38, 17, 7, 2);
    } else if (role === 'apothecary') {
      rect(ctx, '#132a27', 17, 34, 17, 15);
      rect(ctx, '#4e8f80', 18, 35, 15, 13);
      rect(ctx, '#82c0aa', 20, 36, 4, 10);
      rect(ctx, '#244d46', 25, 40, 2, 8);
      rect(ctx, '#2b211e', 33, 40, 9, 11);
      rect(ctx, '#8f6239', 34, 41, 7, 9);
      rect(ctx, '#9ef0c7', 35, 43, 2, 4);
      rect(ctx, '#e9a2d5', 38, 42, 2, 5);
      rect(ctx, palette.accent, 17, 30, 3, 15);
    } else if (role === 'innkeeper') {
      rect(ctx, palette.clothHi, 16, 40, 18, 10);
      rect(ctx, palette.cloth, 14, 48, 7, 3);
      rect(ctx, palette.cloth, 29, 48, 7, 3);
      rect(ctx, '#e7d7b5', 17, 34, 16, 14);
      rect(ctx, '#bda985', 18, 36, 2, 11);
      rect(ctx, '#fff2d1', 20, 35, 11, 3);
      rect(ctx, '#fff2d1', 19, 46, 4, 3);
      rect(ctx, '#fff2d1', 27, 46, 4, 3);
      if (!back) { rect(ctx, '#d8c7a4', 37, 40, 7, 6); rect(ctx, '#6e4a31', 43, 41, 3, 4); }
    } else if (role === 'guild') {
      rect(ctx, '#1b2d3c', 14, 29, 6, 20);
      rect(ctx, '#263f53', 30, 29, 6, 20);
      rect(ctx, palette.clothHi, 17, 30, 3, 14);
      rect(ctx, '#17211f', 10, 26, 7, 18);
      rect(ctx, '#7c2530', 11, 27, 5, 15);
      rect(ctx, '#e2bb57', 12, 30, 3, 3);
      rect(ctx, '#f6d77d', 23, 32, 5, 5);
      rect(ctx, '#7d642a', 24, 33, 3, 3);
      rect(ctx, '#17211f', 34, 28, 9, 13);
      rect(ctx, '#d7cab0', 35, 29, 7, 11);
      rect(ctx, '#9f8c70', 37, 31, 1, 7);
    } else if (role === 'stable') {
      if (palette.namedKey === 'rowan') {
        rect(ctx, '#38271f', 16, 32, 4, 16);
        rect(ctx, '#9b6039', 17, 33, 2, 13);
        rect(ctx, '#d6b17a', 30, 31, 4, 4);
      } else if (palette.namedKey === 'mara') {
        rect(ctx, '#3b3223', 17, 35, 16, 13);
        rect(ctx, '#bd8342', 19, 35, 12, 11);
        rect(ctx, '#ead27d', 21, 37, 3, 7);
      }
      pixelLine(ctx, '#5c3c27', 37, 30, 45, 46, 2);
      pixelLine(ctx, '#bd8956', 38, 29, 46, 45, 2);
      rect(ctx, '#493323', 9, 42, 8, 8);
      rect(ctx, '#a56e3e', 10, 43, 6, 6);
    } else if (role === 'scout' || role === 'ranger') {
      rect(ctx, palette.clothLo, 12, 29, 7, 18);
      rect(ctx, palette.cloth, 13, 30, 5, 20);
      rect(ctx, palette.clothHi, 14, 31, 2, 12);
      if (back) {
        rect(ctx, '#17211f', 12, 27, 6, 21);
        rect(ctx, '#7a5235', 13, 28, 4, 19);
        rect(ctx, '#d9a65d', 14, 25, 2, 7);
      }
      pixelLine(ctx, '#3d2d24', 39, 29, 43, 47, 2);
      pixelLine(ctx, '#c69255', 40, 29, 44, 46, 2);
      rect(ctx, '#e3c17b', 42, 27, 2, 6);
    } else if (role === 'merchant') {
      rect(ctx, '#17211f', 34, 41, 10, 11);
      rect(ctx, '#8d643e', 35, 42, 8, 9);
      rect(ctx, '#edc75f', 37, 43, 3, 3);
      rect(ctx, palette.accent, 15, 29, 5, 5);
    }

    if ((role === 'vanguard' || role === 'resident') && action === 'attack') {
      pixelLine(ctx, '#263331', 42, 26, 47, 8, 4);
      pixelLine(ctx, '#d7e2df', 42, 24, 47, 7, 2);
      rect(ctx, '#fff8d6', 46, 7, 2, 5);
      rect(ctx, '#9b7040', 38, 25, 8, 3);
    } else if (role === 'vanguard') {
      pixelLine(ctx, '#263331', 40, 43, 44, 21, 4);
      pixelLine(ctx, '#cad7d3', 40, 42, 44, 20, 2);
      rect(ctx, '#9b7040', 37, 40, 8, 3);
    }

    if (role === 'arcanist') {
      rect(ctx, '#63dcca', 23, 35, 5, 5);
      rect(ctx, '#d9fff7', 24, 36, 2, 2);
      pixelLine(ctx, '#2b3c3c', 40, 47, 43, 22, 3);
      rect(ctx, '#74ead7', 39, 18, 8, 8);
      rect(ctx, '#e1fff7', 42, 20, 3, 3);
    }
  }

  function renderActor(options, role, direction, walk, action) {
    const surface = canvas(W, H);
    const ctx = surface.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (direction === 'left') { ctx.translate(W, 0); ctx.scale(-1, 1); direction = 'right'; }
    const palette = paletteFor(options, role);
    const legShift = walk === 1 ? -2 : walk === 3 ? 2 : 0;

    drawBoot(ctx, 14 + legShift, 53, legShift > 0, palette);
    drawBoot(ctx, 28 - legShift, 53, legShift < 0, palette);
    rect(ctx, '#17211f', 15 + legShift, 46, 8, 10);
    rect(ctx, palette.clothLo, 17 + legShift, 47, 5, 8);
    rect(ctx, '#17211f', 27 - legShift, 46, 8, 10);
    rect(ctx, palette.clothLo, 28 - legShift, 47, 5, 8);

    drawTorso(ctx, direction, palette, role, walk, action);
    rect(ctx, '#17211f', 20, 24, 11, 8);
    rect(ctx, palette.skin.shade, 21, 25, 9, 6);
    drawFace(ctx, direction, palette, role);
    drawRoleAccessory(ctx, role, direction, palette, action);

    if (options.player) {
      rect(ctx, '#76ead8', 12, 29, 3, 9);
      rect(ctx, '#d9fff8', 13, 30, 1, 4);
    }
    return surface;
  }

  function renderMount(frame, direction) {
    const MW = 76;
    const MH = 52;
    const surface = canvas(MW, MH);
    const ctx = surface.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (direction === 'left') { ctx.translate(MW, 0); ctx.scale(-1, 1); }
    const stride = frame === 1 ? 3 : frame === 3 ? -3 : 0;
    const outline = '#18201c';
    rect(ctx, outline, 8, 14, 51, 27);
    rect(ctx, '#744a30', 10, 15, 47, 24);
    rect(ctx, '#9c6841', 13, 15, 35, 7);
    rect(ctx, '#b98555', 17, 17, 19, 3);
    rect(ctx, '#513526', 8, 22, 8, 14);
    rect(ctx, '#34251f', 4, 25, 7, 4);
    rect(ctx, outline, 52, 5, 19, 25);
    rect(ctx, '#744a30', 53, 7, 16, 21);
    rect(ctx, '#9c6841', 56, 8, 12, 6);
    rect(ctx, outline, 62, 1, 5, 9);
    rect(ctx, '#513526', 63, 1, 3, 7);
    rect(ctx, '#17211f', 65, 14, 3, 3);
    rect(ctx, '#f3dfaa', 66, 14, 1, 1);
    rect(ctx, '#d8c28c', 70, 24, 5, 3);
    rect(ctx, '#27322b', 24, 10, 23, 7);
    rect(ctx, '#b56742', 26, 11, 19, 5);
    rect(ctx, outline, 14 + stride, 36, 8, 14);
    rect(ctx, '#6a432d', 16 + stride, 37, 5, 11);
    rect(ctx, outline, 27 - stride, 36, 8, 14);
    rect(ctx, '#6a432d', 29 - stride, 37, 5, 11);
    rect(ctx, outline, 43 - stride, 36, 8, 14);
    rect(ctx, '#6a432d', 45 - stride, 37, 5, 11);
    rect(ctx, '#0e1715', 13 + stride, 48, 11, 3);
    rect(ctx, '#0e1715', 26 - stride, 48, 11, 3);
    rect(ctx, '#0e1715', 42 - stride, 48, 11, 3);
    return surface;
  }

  function drawShadow(ctx, x, y, mounted) {
    ctx.save();
    ctx.globalAlpha = mounted ? 0.38 : 0.32;
    const width = mounted ? 34 : 15;
    rect(ctx, '#03100d', x - width, y - 2, width * 2, 5);
    rect(ctx, '#03100d', x - width + 5, y - 4, width * 2 - 10, 3);
    ctx.restore();
  }

  function drawCastingMotes(ctx, x, y, time, direction) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const side = direction === 'left' ? -1 : 1;
    for (let i = 0; i < 4; i++) {
      const phase = time * 5 + i * 1.7;
      const px = Math.round(x + side * (20 + Math.cos(phase) * 7));
      const py = Math.round(y - 39 + Math.sin(phase) * 9);
      rect(ctx, i & 1 ? '#73ead7' : '#e1fff5', px - 2, py - 2, 4, 4);
    }
    ctx.restore();
  }

  function drawAttackArc(ctx, x, y, time, direction) {
    const side = direction === 'left' ? -1 : 1;
    const phase = Math.floor((time * 14) % 3);
    ctx.save();
    ctx.globalAlpha = 0.82 - phase * 0.18;
    const color = phase === 0 ? '#fff6bf' : '#e5bc64';
    pixelLine(ctx, color, x + side * 20, y - 43 + phase * 4, x + side * (31 + phase * 3), y - 18 + phase * 5, 3);
    ctx.restore();
  }

  function draw(ctx, options = {}) {
    if (!ctx || typeof ctx.drawImage !== 'function') return;
    const x = Number(options.x || 0);
    const y = Number(options.y || 0);
    const time = Number.isFinite(options.time) ? options.time : performance.now() / 1000;
    const moving = !!options.moving;
    const role = normalizeRole(options);
    const direction = directionOf(options.facing);
    const walk = moving ? Math.floor(time * 7) % 4 : 0;
    const action = options.casting ? 'cast' : options.attacking ? 'attack' : 'idle';
    const identityHash = hash(`${options.id || ''}:${options.name || ''}`);
    const key = `${identityHash.toString(36)}|${role}|${direction}|${walk}|${action}|${options.player ? 1 : 0}`;
    let sprite = cache.get(key);
    if (!sprite) {
      sprite = renderActor(options, role, direction, walk, action);
      cache.set(key, sprite);
    }

    const bob = moving ? (walk & 1 ? -1 : 0) : (Math.floor(time * 1.6 + identityHash) & 1 ? 0 : -1);
    drawShadow(ctx, Math.round(x), Math.round(y), !!options.mounted);
    ctx.save();
    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    let actorY = y;
    if (options.mounted) {
      const mountKey = `${walk}|${direction === 'left' ? 'left' : 'right'}`;
      let mount = mountCache.get(mountKey);
      if (!mount) { mount = renderMount(walk, direction); mountCache.set(mountKey, mount); }
      ctx.drawImage(mount, Math.round(x - 38), Math.round(y - 50));
      actorY -= 20;
    }
    ctx.drawImage(sprite, Math.round(x - W / 2), Math.round(actorY - FEET_Y + bob));
    ctx.imageSmoothingEnabled = previousSmoothing;
    ctx.restore();

    if (options.casting) drawCastingMotes(ctx, x, actorY, time, direction);
    if (options.attacking) drawAttackArc(ctx, x, actorY, time, direction);
  }

  window.EVERLIGHT_ACTORS = Object.freeze({
    version: 24,
    draw,
    roles: Object.freeze(['smith','apothecary','innkeeper','guild','stable','scout','merchant','resident']),
    clearCache() { cache.clear(); mountCache.clear(); }
  });
})();
