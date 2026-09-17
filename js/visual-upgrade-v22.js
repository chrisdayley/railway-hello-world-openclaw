(() => {
  'use strict';
  const BUILD = '22';
  window.__EVERLIGHT_VISUAL_BUILD__ = BUILD;

  const walk = new Image();
  const attack = new Image();
  const enemies = new Image();
  walk.src = `assets/hero-walk-v22.png?v=${BUILD}`;
  attack.src = `assets/hero-attack-v22.png?v=${BUILD}`;
  enemies.src = `assets/enemies-v22.png?v=${BUILD}`;

  const state = {
    x: 0, y: -1,
    moving: false,
    attackAt: -9999,
    spellAt: -9999,
    enemyEyesToSkip: 0
  };

  const norm = (x, y) => {
    const m = Math.hypot(x, y);
    return m > .08 ? { x: x / m, y: y / m } : null;
  };
  const remember = (x, y) => {
    const n = norm(x, y);
    if (!n) return;
    state.x = n.x; state.y = n.y; state.moving = true;
  };

  // Capture movement direction without interfering with the game's own input handlers.
  const joystick = document.getElementById('joystick');
  if (joystick) {
    joystick.addEventListener('pointerdown', e => {
      const r = joystick.getBoundingClientRect();
      remember(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    }, { capture: true });
    joystick.addEventListener('pointermove', e => {
      if (!(e.buttons || e.pointerType === 'touch')) return;
      const r = joystick.getBoundingClientRect();
      remember(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    }, { capture: true });
    const stop = () => { state.moving = false; };
    joystick.addEventListener('pointerup', stop, { capture: true });
    joystick.addEventListener('pointercancel', stop, { capture: true });
  }

  const downKeys = new Set();
  addEventListener('keydown', e => {
    downKeys.add(e.code);
    const x = (downKeys.has('ArrowRight') || downKeys.has('KeyD') ? 1 : 0) - (downKeys.has('ArrowLeft') || downKeys.has('KeyA') ? 1 : 0);
    const y = (downKeys.has('ArrowDown') || downKeys.has('KeyS') ? 1 : 0) - (downKeys.has('ArrowUp') || downKeys.has('KeyW') ? 1 : 0);
    if (x || y) remember(x, y);
  }, true);
  addEventListener('keyup', e => {
    downKeys.delete(e.code);
    state.moving = [...downKeys].some(k => /Arrow|Key[WASD]/.test(k));
  }, true);

  document.getElementById('attackBtn')?.addEventListener('pointerdown', () => { state.attackAt = performance.now(); }, true);
  document.getElementById('spellBtn')?.addEventListener('pointerdown', () => { state.spellAt = performance.now(); }, true);

  const proto = CanvasRenderingContext2D.prototype;
  const originalDrawImage = proto.drawImage;
  const originalFill = proto.fill;
  const originalStroke = proto.stroke;
  const originalFillRect = proto.fillRect;

  const src = image => String(image?.currentSrc || image?.src || '');

  function aspectCover(ctx, image, dx, dy, dw, dh) {
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    if (!iw || !ih) return originalDrawImage.call(ctx, image, dx, dy, dw, dh);
    const sourceRatio = iw / ih;
    const destRatio = dw / dh;
    let sx = 0, sy = 0, sw = iw, sh = ih;
    if (sourceRatio > destRatio) {
      sw = ih * destRatio;
      sx = (iw - sw) / 2;
    } else {
      sh = iw / destRatio;
      sy = (ih - sh) / 2;
    }
    return originalDrawImage.call(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  function heroRow() {
    if (Math.abs(state.y) > Math.abs(state.x) * 1.15) return state.y < 0 ? 1 : 0;
    return 2; // horizontal; the base renderer already mirrors left-facing heroes.
  }

  function drawHeroFrame(ctx, dx, dy, dw, dh) {
    const now = performance.now();
    const attacking = now - state.attackAt < 360;
    const casting = now - state.spellAt < 380;
    const sheet = (attacking || casting) && attack.complete ? attack : walk;
    if (!sheet.complete || !sheet.naturalWidth) return false;
    const row = casting ? 3 : heroRow();
    const elapsed = attacking ? now - state.attackAt : casting ? now - state.spellAt : now;
    const frame = attacking || casting ? Math.min(3, Math.floor(elapsed / 88)) : state.moving ? Math.floor(now / 115) % 4 : 0;
    const frameW = sheet.naturalWidth / 4;
    const frameH = sheet.naturalHeight / 4;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // Keep the feet aligned with the original actor footprint but give the sprite more readable presence.
    const outW = Math.max(56, dw * 1.18);
    const outH = outW;
    const outX = dx + dw / 2 - outW / 2;
    const outY = dy + dh - outH + 7;
    originalDrawImage.call(ctx, sheet, frame * frameW, row * frameH, frameW, frameH, outX, outY, outW, outH);
    ctx.restore();
    return true;
  }

  proto.drawImage = function(image, ...args) {
    const path = src(image);
    // Preserve proportions on the painted region backgrounds instead of stretching them to arbitrary zone ratios.
    if (/northford-twilight\.jpg|greenwake-vale-v1\.jpg|moonfall-ruins-v1\.jpg/.test(path) && args.length === 4) {
      return aspectCover(this, image, args[0], args[1], args[2], args[3]);
    }
    if (/hero-player-v2\.png/.test(path) && args.length === 4 && drawHeroFrame(this, ...args)) return;
    return originalDrawImage.call(this, image, ...args);
  };

  // Replace the two generic enemy polygon fills with proper animated sprite frames.
  proto.fill = function(...args) {
    const color = String(this.fillStyle).toLowerCase();
    if (enemies.complete && enemies.naturalWidth && (color === '#45662f' || color === '#536b65')) {
      const row = color === '#45662f' ? 0 : 1;
      const frame = Math.floor(performance.now() / 180) % 4;
      const fw = enemies.naturalWidth / 4;
      const fh = enemies.naturalHeight / 3;
      this.save();
      this.imageSmoothingEnabled = false;
      originalDrawImage.call(this, enemies, frame * fw, row * fh, fw, fh, -26, -26, 52, 52);
      this.restore();
      this.__everlightSpriteEnemy = true;
      state.enemyEyesToSkip = 2;
      return;
    }
    return originalFill.apply(this, args);
  };

  proto.stroke = function(...args) {
    if (this.__everlightSpriteEnemy) {
      this.__everlightSpriteEnemy = false;
      return;
    }
    return originalStroke.apply(this, args);
  };

  proto.fillRect = function(x, y, w, h) {
    if (state.enemyEyesToSkip > 0 && String(this.fillStyle).toLowerCase() === '#ff685e') {
      state.enemyEyesToSkip--;
      return;
    }
    return originalFillRect.call(this, x, y, w, h);
  };

  // A tiny ambient animation layer around the canvas keeps screenshots from feeling like a static painted board.
  const atmosphere = document.querySelector('.atmosphere');
  if (atmosphere) atmosphere.classList.add('visual-v22');
})();
