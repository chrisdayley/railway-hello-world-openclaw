(() => {
  'use strict';

  function syncViewport(){
    const view=window.visualViewport;
    const width=Math.round(view?.width||window.innerWidth);
    const height=Math.round(view?.height||window.innerHeight);
    document.documentElement.style.setProperty('--app-width',`${width}px`);
    document.documentElement.style.setProperty('--app-height',`${height}px`);
  }
  syncViewport();
  window.visualViewport?.addEventListener('resize',syncViewport);
  window.visualViewport?.addEventListener('scroll',syncViewport);
  addEventListener('resize',syncViewport);
  addEventListener('orientationchange',()=>setTimeout(syncViewport,120));

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540, SAVE_KEY = 'everlight-save-v5';
  const el = Object.fromEntries([
    'loading','titleScreen','pathScreen','gameScreen','continueBtn','newGameBtn','hpBar','manaBar','stamBar','hpProgress','manaProgress','stamProgress','hpText','manaText','levelText','goldText','objectiveBtn','objectiveTitle','objectiveText','bossHud','bossBar','tutorial','toast','subtitle','joystick','joyKnob','attackBtn','spellBtn','dodgeBtn','interactBtn','attackCooldown','spellCooldown','dodgeCooldown','fullscreenBtn','pauseBtn','dialogue','speakerPortrait','speakerName','dialogueText','dialogueChoices','dialogueNext','journal','journalBody','closeJournal','chapterComplete','chapterSummary','keepExploringBtn','srUpdates'
  ].map(id => [id, $(id)]));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => a + (b - a) * t;
  const random = (a, b) => a + Math.random() * (b - a);
  const show = (node, yes = true) => node.classList.toggle('is-hidden', !yes);

  const defaults = () => ({
    version: 5, style: null, x: 498, y: 397, hp: 100, maxHp: 100, mana: 60, maxMana: 60,
    stam: 100, maxStam: 100, gold: 35, xp: 0, level: 1, quest: 0, storyChoice: null,
    endingChoice: null, pendingEnding: false, chapterComplete: false, miraWard: 0, playTime: 0, lastPlayed: Date.now(),
    settings: { sound: true, haptics: true, reducedMotion: false, highContrast: false, leftHanded: false, assistMode: false },
    inventory: [{ name: 'Roadworn Blade', type: 'Weapon', rarity: 'Common', power: 12 }],
    discoveries: ['Northford'], defeated: 0
  });

  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!raw) return defaults();
      const base = defaults();
      return { ...base, ...raw, settings: { ...base.settings, ...(raw.settings || {}) } };
    } catch (_) { return defaults(); }
  }

  let S = loadSave();
  let running = false, paused = true, last = performance.now(), saveClock = 0;
  let input = { x: 0, y: 0 }, keys = new Set(), pointerId = null;
  let attackCd = 0, spellCd = 0, dodgeCd = 0, invuln = 0, hurtFlash = 0, combo = 0, comboClock = 0;
  let shake = 0, screenFlash = 0, currentInteract = null, currentTab = 'quest', miraAssistCd = 1.5;
  let enemies = [], particles = [], projectiles = [], damageTexts = [], ambient = [];
  let dialogueQueue = [], dialogueDone = null, dialogueChoiceHandler = null, restoreFocus = null;

  const bg = new Image(); bg.src = 'assets/northford-twilight.jpg?v=20';
  const hero = new Image(); hero.src = 'assets/hero-player-v2.png?v=20';
  const miraArt = new Image(); miraArt.src = 'assets/mira-scout.png?v=20';
  const wardenArt = new Image(); wardenArt.src = 'assets/hollow-warden.png?v=20';
  let bgReady = false, heroReady = false, miraReady = false, wardenReady = false;
  bg.onload = () => bgReady = true; hero.onload = () => heroReady = true;
  miraArt.onload = () => miraReady = true; wardenArt.onload = () => wardenReady = true;
  for (let i = 0; i < 42; i++) ambient.push({ x: random(0,W), y: random(80,H), s: random(.4,1.25), p: random(0,7) });

  const npc = { id: 'mira', name: 'Mira', x: 407, y: 337 };
  const waystone = { id: 'waystone', name: 'Waystone', x: 494, y: 260 };
  const blockers = [
    {x:180,y:40,w:236,h:105},{x:524,y:32,w:223,h:138},{x:716,y:302,w:182,h:100},
    {x:0,y:0,w:105,h:250},{x:0,y:456,w:960,h:84},{x:820,y:0,w:140,h:103},
    {x:0,y:265,w:270,h:75},{x:0,y:345,w:315,h:111},{x:295,y:390,w:110,h:66},{x:612,y:455,w:348,h:85}
  ];

  function applySettings() {
    document.body.classList.toggle('reduced-motion', S.settings.reducedMotion);
    document.body.classList.toggle('high-contrast', S.settings.highContrast);
    document.body.classList.toggle('left-handed', S.settings.leftHanded);
  }

  function save() {
    S.lastPlayed = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (_) {}
  }

  function announce(text) { el.srUpdates.textContent = text; }
  let toastTimer = 0, subtitleTimer = 0;
  function toast(text, seconds = 2.2) { el.toast.textContent = text; show(el.toast); toastTimer = seconds; }
  function subtitle(text, seconds = 2.8) { el.subtitle.textContent = text; show(el.subtitle); subtitleTimer = seconds; }
  function haptic(pattern = 15) { if (S.settings.haptics && navigator.vibrate) navigator.vibrate(pattern); }

  let audioCtx = null;
  function wakeAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function tone(freq = 440, dur = .06, type = 'sine', vol = .035, glide = 0) {
    if (!audioCtx || !S.settings.sound) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), now = audioCtx.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, now); if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+glide), now+dur);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(.0001, now+dur);
    o.connect(g).connect(audioCtx.destination); o.start(now); o.stop(now+dur);
  }
  function sfx(kind) {
    if (kind === 'sword') { tone(230,.07,'sawtooth',.04,170); tone(520,.04,'triangle',.025,-120); }
    if (kind === 'hit') { tone(110,.08,'square',.035,-45); haptic(22); }
    if (kind === 'spell') { tone(420,.16,'sine',.035,380); tone(680,.2,'triangle',.02,210); haptic([8,18,8]); }
    if (kind === 'hurt') { tone(90,.12,'sawtooth',.05,-30); haptic(45); }
    if (kind === 'success') { [420,560,720].forEach((f,i)=>setTimeout(()=>tone(f,.16,'triangle',.04,80),i*90)); haptic([20,35,20]); }
    if (kind === 'select') tone(540,.05,'sine',.025,80);
  }

  function startNew(path) {
    S = defaults(); S.style = path;
    if (path === 'vanguard') { S.maxHp = S.hp = 120; S.inventory[0].power = 15; }
    if (path === 'ranger') { S.crit = .18; S.speedBonus = 18; }
    if (path === 'arcanist') { S.maxMana = S.mana = 90; S.spellPower = 1.35; }
    save(); applySettings(); beginGame(true);
  }

  function beginGame(fresh = false) {
    show(el.titleScreen, false); show(el.pathScreen, false); show(el.gameScreen, true);
    running = true; paused = false; last = performance.now(); resetWorld(); updateHUD();
    if (S.pendingEnding && !S.endingChoice) setTimeout(showEndingChoice, 350);
    if (fresh) {
      setTimeout(() => {
        subtitle('The stone beneath your feet whispers a name you have never heard.', 3.4);
        promptTutorial('Drag the left circle to move');
      }, 450);
    } else {
      toast('Welcome back to Northford');
      if (S.quest === 1 && !enemies.length) spawnWisps();
    }
    requestAnimationFrame(loop);
  }

  function resetWorld() {
    enemies = []; projectiles = []; particles = []; damageTexts = [];
    if (S.quest === 1) spawnWisps();
    if (S.quest === 3) spawnBoss();
  }

  function spawnWisps() {
    if (enemies.some(e => e.kind === 'wisp')) return;
    [[330,382],[580,357],[641,422]].forEach((p,i) => enemies.push(makeEnemy('wisp',p[0],p[1],i)));
    subtitle('The echoes found you.', 2.2); promptTutorial('Strike, cast, and dodge incoming attacks');
  }

  function spawnBoss() {
    if (enemies.some(e => e.kind === 'warden')) return;
    enemies.push(makeEnemy('warden', 676, 286, 0));
    show(el.bossHud); subtitle('HOLLOW WARDEN: “The road stays shut.”', 3); shake = 10;
  }

  function makeEnemy(kind, x, y, index) {
    const boss = kind === 'warden';
    return { id: kind + index + Date.now(), kind, x, y, vx: 0, vy: 0, hp: boss ? 420 : 48, maxHp: boss ? 420 : 48,
      r: boss ? 31 : 15, speed: boss ? 54 : random(38,52), state: 'idle', timer: random(.2,1), flash: 0, dead: false,
      attackCd: random(.4,1.3), telegraph: 0, phase: 1 };
  }

  function promptTutorial(text) { el.tutorial.textContent = text; show(el.tutorial); }
  function dismissTutorial() { show(el.tutorial, false); }

  function objective() {
    if (S.quest === 0) return ['A Voice in the Vale','Find Mira by the lantern plaza'];
    if (S.quest === 1) return ['Echoes at the Gate',`Disperse the corrupted echoes · ${enemies.filter(e=>e.kind==='wisp'&&!e.dead).length} remain`];
    if (S.quest === 2) return ['The Sleeping Road','Approach the ancient waystone'];
    if (S.quest === 3) return ['Keeper of the Seal','Defeat the Hollow Warden'];
    return ['The Road Remembers','Explore Northford and prepare for the eastern road'];
  }

  function updateHUD() {
    el.hpBar.style.width = `${clamp(S.hp/S.maxHp*100,0,100)}%`;
    el.manaBar.style.width = `${clamp(S.mana/S.maxMana*100,0,100)}%`;
    el.stamBar.style.width = `${clamp(S.stam/S.maxStam*100,0,100)}%`;
    el.hpText.textContent = Math.ceil(S.hp); el.manaText.textContent = Math.ceil(S.mana);
    el.hpProgress.setAttribute('aria-valuemax',S.maxHp);el.hpProgress.setAttribute('aria-valuenow',Math.ceil(S.hp));
    el.manaProgress.setAttribute('aria-valuemax',S.maxMana);el.manaProgress.setAttribute('aria-valuenow',Math.ceil(S.mana));
    el.stamProgress.setAttribute('aria-valuemax',S.maxStam);el.stamProgress.setAttribute('aria-valuenow',Math.ceil(S.stam));
    el.levelText.textContent = S.level; el.goldText.textContent = S.gold;
    const [title,text] = objective(); el.objectiveTitle.textContent = title; el.objectiveText.textContent = text;
    const boss = enemies.find(e=>e.kind==='warden'&&!e.dead);
    if (boss) { show(el.bossHud); el.bossBar.style.width = `${Math.max(0,boss.hp/boss.maxHp*100)}%`; }
    else show(el.bossHud,false);
  }

  function playerDamage(amount, sourceX, sourceY) {
    if (invuln > 0 || paused) return;
    if (S.miraWard > 0) { amount=Math.max(1,Math.round(amount*.6));S.miraWard--;toast(`Mira's ward softens the blow · ${S.miraWard} charges`); }
    if (S.settings.assistMode) amount = Math.max(1, Math.round(amount * .6));
    S.hp = Math.max(0, S.hp - amount); invuln = .8; hurtFlash = .22; shake = 8; sfx('hurt');
    const dx = S.x-sourceX, dy=S.y-sourceY, m=Math.hypot(dx,dy)||1; S.x += dx/m*22; S.y += dy/m*22;
    floatText(S.x,S.y-24,`-${amount}`,'#ff9b8d');
    if (S.hp <= 0) defeatPlayer();
  }

  function defeatPlayer() {
    paused = true; subtitle('The Way pulls you back from the dark…', 2.5); screenFlash = .65;
    setTimeout(()=>{ S.hp=S.maxHp; S.mana=S.maxMana; S.stam=S.maxStam; S.x=498; S.y=397; S.gold=Math.max(0,S.gold-10); resetWorld(); paused=false; toast('Returned to the Northford waystone · −10 gold'); save(); },1700);
  }

  function gainXp(n) {
    S.xp += n; const need = S.level * 70;
    if (S.xp >= need) { S.xp -= need; S.level++; S.maxHp += 10; S.hp=S.maxHp; S.maxMana+=5; S.mana=S.maxMana; toast(`Level ${S.level} — your light grows`); sfx('success'); }
  }

  function hitEnemy(e, damage, dx, dy, magic = false) {
    if (e.dead) return; e.hp -= damage; e.flash=.13; e.x += dx*10; e.y += dy*10;
    spawnBurst(e.x,e.y, magic?'#79fff0':'#ffd77d', magic?10:6); floatText(e.x,e.y-e.r,`${Math.round(damage)}`,magic?'#8dfff0':'#ffe39a'); sfx('hit');
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.dead=true; spawnBurst(e.x,e.y,e.kind==='warden'?'#ffe08a':'#7efbe7',e.kind==='warden'?34:16); shake=e.kind==='warden'?14:5;
    if (e.kind === 'wisp') { S.gold += 9; gainXp(18); S.defeated++; }
    if (e.kind === 'warden') { S.gold += 75; gainXp(120); onBossDefeated(); }
    if (S.quest===1 && enemies.filter(x=>x.kind==='wisp'&&!x.dead).length===0) {
      S.quest=2; save(); sfx('success'); toast('The echoes fall silent'); subtitle('The waystone answers with a pulse beneath your feet.',3); dismissTutorial();
    }
  }

  function attack() {
    if (paused || attackCd>0) return; wakeAudio(); dismissTutorial();
    combo = comboClock>0 ? combo%3+1 : 1; comboClock=.55; attackCd=combo===3?.42:.27; invuln=Math.max(invuln,.08); sfx('sword');
    const d=aimDirection(98), range=combo===3?78:65, dmg=(S.inventory[0]?.power||12)*(combo===3?1.55:1)*(S.settings.assistMode?1.25:1);
    for (const e of enemies) if(!e.dead) { const dx=e.x-S.x,dy=e.y-S.y,m=Math.hypot(dx,dy)||1,dot=(dx*d.x+dy*d.y)/m;if(m<range+e.r&&dot>.15){const crit=Math.random()<(S.crit||0);hitEnemy(e,dmg*(crit?1.7:1),dx/m,dy/m);if(crit)floatText(e.x,e.y-e.r-14,'CRITICAL','#fff2a6');} }
    slashFx(d,combo);
  }

  function castSpell() {
    if (paused || spellCd>0) return; wakeAudio(); dismissTutorial();
    const cost=16; if(S.mana<cost){toast('Not enough aether');tone(120,.09,'square',.025);return;}
    S.mana-=cost; spellCd=1.05; const d=facing(); sfx('spell');
    let target=enemies.filter(e=>!e.dead).sort((a,b)=>dist(a,S)-dist(b,S))[0];
    let dx=d.x,dy=d.y;if(target&&dist(target,S)<250){const m=Math.hypot(target.x-S.x,target.y-S.y)||1;dx=(target.x-S.x)/m;dy=(target.y-S.y)/m;}
    projectiles.push({kind:'player',x:S.x+dx*22,y:S.y+dy*14,vx:dx*310,vy:dy*310,r:9,life:1.1,damage:Math.round(24*(S.spellPower||1))});
  }

  function dodge() {
    if (paused || dodgeCd>0 || S.stam<24) return; wakeAudio(); dismissTutorial();
    const d=facing(); S.stam-=24; dodgeCd=.82; invuln=.48; moveActor(S,d.x*68,d.y*68,12); haptic(12); tone(260,.1,'triangle',.02,130);
    for(let i=0;i<10;i++) particles.push({x:S.x-d.x*i*4,y:S.y-d.y*i*4,vx:random(-12,12),vy:random(-12,12),life:.35,max:.35,color:'#78e8d3',size:random(2,5)});
  }

  let lastFacing={x:0,y:-1};
  function facing(){const m=Math.hypot(input.x,input.y);if(m>.15)lastFacing={x:input.x/m,y:input.y/m};return lastFacing;}
  function aimDirection(range) {
    const target=enemies.filter(e=>!e.dead&&dist(e,S)<range).sort((a,b)=>dist(a,S)-dist(b,S))[0];
    if (!target) return facing();
    const dx=target.x-S.x,dy=target.y-S.y,m=Math.hypot(dx,dy)||1;lastFacing={x:dx/m,y:dy/m};return lastFacing;
  }
  function slashFx(d,c){particles.push({kind:'slash',x:S.x+d.x*22,y:S.y+d.y*16,angle:Math.atan2(d.y,d.x),life:.2,max:.2,color:c===3?'#70f9e4':'#ffe29b',size:c});}

  function spawnBurst(x,y,color,count){for(let i=0;i<count;i++){const a=random(0,Math.PI*2),sp=random(20,100);particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:random(.25,.65),max:.65,color,size:random(2,5)});}}
  function floatText(x,y,text,color){damageTexts.push({x,y,text,color,life:.8});}

  function updatePlayer(dt) {
    let ix=input.x+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
    let iy=input.y+(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
    const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m;} if(m>.1){lastFacing={x:ix/(Math.hypot(ix,iy)||1),y:iy/(Math.hypot(ix,iy)||1)};dismissTutorial();}
    const speed=126+(S.speedBonus||0);moveActor(S,ix*speed*dt,iy*speed*dt,12);
    S.stam=Math.min(S.maxStam,S.stam+28*dt);S.mana=Math.min(S.maxMana,S.mana+4.5*dt);
    attackCd=Math.max(0,attackCd-dt);spellCd=Math.max(0,spellCd-dt);dodgeCd=Math.max(0,dodgeCd-dt);invuln=Math.max(0,invuln-dt);hurtFlash=Math.max(0,hurtFlash-dt);comboClock=Math.max(0,comboClock-dt);
  }

  function collides(x,y,r){return blockers.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h);}
  function moveActor(actor,dx,dy,r){
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8)),sx=dx/steps,sy=dy/steps;
    for(let i=0;i<steps;i++){
      const nx=clamp(actor.x+sx,24,W-24),ny=clamp(actor.y+sy,87,H-28);
      if(!collides(nx,actor.y,r))actor.x=nx;
      if(!collides(actor.x,ny,r))actor.y=ny;
    }
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      if(e.dead)continue;e.flash=Math.max(0,e.flash-dt);e.attackCd=Math.max(0,e.attackCd-dt);e.timer-=dt;
      const dx=S.x-e.x,dy=S.y-e.y,d=Math.hypot(dx,dy)||1,nx=dx/d,ny=dy/d;
      if(e.telegraph>0){e.telegraph-=dt;if(e.telegraph<=0){
        if(e.kind==='warden'&&e.phase>=2){for(let i=0;i<8;i++){const a=i*Math.PI/4;projectiles.push({kind:'enemy',x:e.x,y:e.y,vx:Math.cos(a)*130,vy:Math.sin(a)*130,r:7,life:2.2,damage:12});}shake=7;}
        else if(d<e.r+40) playerDamage(e.kind==='warden'?20:9,e.x,e.y);e.attackCd=e.kind==='warden'?1.25:1.4;e.state='chase';
      }} else if(d<e.r+32&&e.attackCd<=0){e.telegraph=e.kind==='warden'?.58:.42;e.state='windup';}
      else if(d<300){const chase=e.telegraph>0?0:e.speed*(e.kind==='warden'&&e.hp<e.maxHp*.5?1.28:1);moveActor(e,nx*chase*dt,ny*chase*dt,e.r*.65);e.state='chase';}
      else e.state='idle';
      if(e.kind==='warden'){e.phase=e.hp<e.maxHp*.45?2:1;if(e.attackCd<=0&&d>95&&d<260&&Math.random()<dt*.36){e.telegraph=.72;e.state='windup';}}
    }
  }

  function updateProjectiles(dt){
    for(const p of projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
      if(p.kind==='player'||p.kind==='companion'){for(const e of enemies)if(!e.dead&&Math.hypot(p.x-e.x,p.y-e.y)<p.r+e.r){const m=Math.hypot(p.vx,p.vy)||1;hitEnemy(e,p.damage,p.vx/m,p.vy/m,true);p.life=0;break;}}
      else if(Math.hypot(p.x-S.x,p.y-S.y)<p.r+12){playerDamage(p.damage,p.x,p.y);p.life=0;}
    } projectiles=projectiles.filter(p=>p.life>0&&p.x>-30&&p.x<W+30&&p.y>-30&&p.y<H+30);
  }

  function updateMiraAssist(dt){
    if(S.quest!==1&&S.quest!==3)return;miraAssistCd-=dt;if(miraAssistCd>0)return;
    const target=enemies.filter(e=>!e.dead).sort((a,b)=>dist(a,npc)-dist(b,npc))[0];if(!target)return;
    const dx=target.x-npc.x,dy=target.y-npc.y,m=Math.hypot(dx,dy)||1;
    projectiles.push({kind:'companion',x:npc.x+dx/m*14,y:npc.y+dy/m*14,vx:dx/m*260,vy:dy/m*260,r:6,life:1.6,damage:9});
    miraAssistCd=S.storyChoice==='mercy'?2.25:2.7;tone(330,.06,'triangle',.018,120);
  }

  function updateEffects(dt){
    particles.forEach(p=>{p.life-=dt;if(!p.kind){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=20*dt;}});particles=particles.filter(p=>p.life>0);
    damageTexts.forEach(t=>{t.life-=dt;t.y-=25*dt;});damageTexts=damageTexts.filter(t=>t.life>0);
    shake=Math.max(0,shake-30*dt);screenFlash=Math.max(0,screenFlash-dt);toastTimer-=dt;subtitleTimer-=dt;if(toastTimer<=0)show(el.toast,false);if(subtitleTimer<=0)show(el.subtitle,false);
  }

  function nearestInteractable(){
    const list=[];if(S.quest===0)list.push({...npc,label:'Talk'});if(S.quest===2)list.push({...waystone,label:'Awaken'});if(S.quest>=4)list.push({...npc,label:'Talk'},{...waystone,label:'Travel'});
    return list.filter(x=>dist(S,x)<64).sort((a,b)=>dist(S,a)-dist(S,b))[0]||null;
  }

  function updateInteraction(){currentInteract=nearestInteractable();show(el.interactBtn,!!currentInteract);if(currentInteract)el.interactBtn.querySelector('small').textContent=currentInteract.label;}

  function interact(){
    if(paused||!currentInteract)return;wakeAudio();dismissTutorial();sfx('select');
    if(currentInteract.id==='mira'&&S.quest===0) firstMiraDialogue();
    else if(currentInteract.id==='waystone'&&S.quest===2) awakenWaystone();
    else if(currentInteract.id==='mira') openDialogue([{speaker:'Mira',portrait:'M',text:S.endingChoice==='restore'?'For the first time in years, the eastern lamps are lighting themselves. Whatever you woke, it is already moving.':'The road is quiet now. Too quiet. We should prepare before we leave.'}]);
    else toast('The distant roads are still veiled in this prologue');
  }

  function firstMiraDialogue(){
    openDialogue([
      {speaker:'Mira',portrait:'M',text:'There you are. I felt the road wake beneath the village—and then the briars started whispering your name.'},
      {speaker:'Mira',portrait:'M',text:'Tell me what you heard.',choices:[
        {label:'“A voice asking for help.”',value:'mercy'},{label:'“A command: open the road.”',value:'power'}
      ]}
    ], choice=>{
      S.storyChoice=choice;S.quest=1;
      if(choice==='mercy'){S.miraWard=3;toast("Mira joins you · Lantern Ward gained");}
      else{S.maxMana+=15;S.mana=S.maxMana;S.spellPower=(S.spellPower||1)*1.1;toast('The Way answers · +15 maximum aether');}
      save();closeDialogue();subtitle(choice==='mercy'?'Mira will remember your compassion—and guard your back.':'Mira studies you, uncertain. The Way burns brighter in your hands.',2.7);spawnWisps();
    });
  }

  function awakenWaystone(){
    openDialogue([
      {speaker:'The Way',portrait:'✦',text:'ROADBEARER. THE SEAL FAILS. WILL YOU CARRY WHAT FOLLOWS?'},
      {speaker:'Mira',portrait:'M',text:'That was not a ruin speaking. Something on the other side heard us.'}
    ],()=>{S.quest=3;S.hp=S.maxHp;S.mana=S.maxMana;S.stam=S.maxStam;save();toast('The waystone restores your strength');setTimeout(()=>{spawnBoss();promptTutorial('Watch the red telegraph, then dodge')},450);});
  }

  function onBossDefeated(){
    S.quest=4;S.pendingEnding=true;S.chapterComplete=false;save();dismissTutorial();show(el.bossHud,false);sfx('success');
    setTimeout(showEndingChoice,600);
  }

  function showEndingChoice(){
    if(!S.pendingEnding||S.endingChoice)return;
    openDialogue([
      {speaker:'The Way',portrait:'✦',text:'THE SEAL IS YOURS. NAME ITS PURPOSE.',choices:[
        {label:'Restore the road for everyone',value:'restore'},{label:'Bind its power to Northford',value:'bind'},{label:'Silence it—for now',value:'silence'}
      ]}
    ], choice=>{
      S.endingChoice=choice;S.pendingEnding=false;S.chapterComplete=true;S.gold+=250;const discovery=choice==='restore'?'The Free Road':choice==='bind'?'Northford Ward':'The Quiet Seal';if(!S.discoveries.includes(discovery))S.discoveries.push(discovery);save();closeDialogue();updateHUD();
      const summary={restore:'You opened the first Everlight Way. Travelers will return—and so will those hunting the old roads.',bind:'You bound the Way to Northford. The village is safe, but the eastern road remains hungry.',silence:'You quieted the Way. Its enemies lost the trail, but Mira heard one final name: Corven.'}[choice];
      el.chapterSummary.textContent=summary;show(el.chapterComplete);el.gameScreen.inert=true;paused=true;el.keepExploringBtn.focus();
    });
  }

  function openDialogue(lines,onDone=null,onChoice=null){
    restoreFocus=document.activeElement;dialogueQueue=[...lines];dialogueDone=onDone;dialogueChoiceHandler=onChoice||onDone;paused=true;el.gameScreen.inert=true;show(el.dialogue);renderDialogueLine();
  }
  function renderDialogueLine(){
    const line=dialogueQueue[0];if(!line){const done=dialogueDone;closeDialogue();if(done)done();return;}
    el.speakerName.textContent=line.speaker;el.speakerPortrait.textContent=line.portrait||line.speaker[0];el.dialogueText.textContent=line.text;el.dialogueChoices.innerHTML='';
    show(el.dialogueNext,!line.choices);if(line.choices)for(const c of line.choices){const b=document.createElement('button');b.textContent=c.label;b.onclick=()=>dialogueChoiceHandler?.(c.value);el.dialogueChoices.appendChild(b);}requestAnimationFrame(()=>line.choices?el.dialogueChoices.querySelector('button')?.focus():el.dialogueNext.focus());
  }
  function advanceDialogue(){if(!dialogueQueue[0]||dialogueQueue[0].choices)return;dialogueQueue.shift();renderDialogueLine();}
  function closeDialogue(){show(el.dialogue,false);el.gameScreen.inert=false;dialogueQueue=[];paused=false;dialogueDone=null;dialogueChoiceHandler=null;restoreFocus?.focus?.();restoreFocus=null;}

  function draw(){
    ctx.save();const sx=S.settings.reducedMotion?0:random(-shake,shake),sy=S.settings.reducedMotion?0:random(-shake,shake);ctx.translate(sx,sy);
    if(bgReady)ctx.drawImage(bg,0,0,W,H);else{ctx.fillStyle='#0b2a22';ctx.fillRect(0,0,W,H);}
    drawAmbient(); drawWorldMarkers(); drawNPC();
    const sorted=[...enemies.filter(e=>!e.dead).map(e=>({y:e.y,type:'enemy',o:e})),{y:S.y,type:'hero'}].sort((a,b)=>a.y-b.y);
    for(const item of sorted)item.type==='hero'?drawHero():drawEnemy(item.o);
    drawProjectiles();drawEffects();ctx.restore();
    if(hurtFlash>0){ctx.fillStyle=`rgba(255,55,40,${hurtFlash*.35})`;ctx.fillRect(0,0,W,H);}if(screenFlash>0){ctx.fillStyle=`rgba(170,255,235,${screenFlash*.42})`;ctx.fillRect(0,0,W,H);}
  }

  function drawAmbient(){
    const t=performance.now()/1000;ctx.save();ctx.globalCompositeOperation='screen';
    for(const a of ambient){const y=a.y+(S.settings.reducedMotion?0:Math.sin(t*a.s+a.p)*8),x=a.x+(S.settings.reducedMotion?0:Math.cos(t*.4+a.p)*5);ctx.fillStyle=`rgba(103,255,227,${.18+(S.settings.reducedMotion?0:.15*Math.sin(t+a.p))})`;ctx.beginPath();ctx.arc(x,y,a.s*1.7,0,7);ctx.fill();}
    ctx.restore();
  }

  function drawWorldMarkers(){
    let target=S.quest===0?npc:S.quest===2?waystone:null;if(!target)return;const t=performance.now()/250;ctx.save();ctx.translate(target.x,target.y-42-Math.sin(t)*4);ctx.fillStyle='#fff3a6';ctx.shadowColor='#ffe06d';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,9);ctx.lineTo(-7,-3);ctx.lineTo(0,-10);ctx.lineTo(7,-3);ctx.closePath();ctx.fill();ctx.restore();
  }

  function shadow(x,y,r){ctx.save();ctx.globalAlpha=.4;ctx.fillStyle='#00100e';ctx.beginPath();ctx.ellipse(x,y,r,r*.35,0,0,7);ctx.fill();ctx.restore();}
  function drawHero(){
    const moving=Math.hypot(input.x,input.y)>.12||[...keys].some(k=>/Arrow|Key[WASD]/.test(k));const bob=moving?Math.sin(performance.now()/75)*2:Math.sin(performance.now()/280)*1;shadow(S.x,S.y+18,17);
    ctx.save();ctx.translate(S.x,S.y+bob);if(lastFacing.x<-.15)ctx.scale(-1,1);if(invuln>0&&Math.floor(invuln*20)%2===0)ctx.globalAlpha=.45;ctx.shadowColor='#68ffe1';ctx.shadowBlur=invuln>0?16:4;
    if(heroReady)ctx.drawImage(hero,-24,-52,48,64);else{ctx.fillStyle='#2e7955';ctx.fillRect(-12,-18,24,34);ctx.fillStyle='#efb184';ctx.beginPath();ctx.arc(0,-20,9,0,7);ctx.fill();}
    ctx.restore();
  }

  function drawNPC(){shadow(npc.x,npc.y+14,14);ctx.save();ctx.translate(npc.x,npc.y);if(miraReady){ctx.shadowColor='#74ead2';ctx.shadowBlur=S.quest===1||S.quest===3?8:2;ctx.drawImage(miraArt,-31,-51,62,66);}else{ctx.fillStyle='#6f3d76';ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(-15,17);ctx.lineTo(15,17);ctx.closePath();ctx.fill();ctx.fillStyle='#e2ae85';ctx.beginPath();ctx.arc(0,-20,8,0,7);ctx.fill();ctx.strokeStyle='#c9e6dc';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(9,-8);ctx.lineTo(18,15);ctx.stroke();}ctx.restore();}

  function drawEnemy(e){
    shadow(e.x,e.y+e.r*.75,e.r*.9);ctx.save();ctx.translate(e.x,e.y);if(e.flash>0)ctx.filter='brightness(3)';
    if(e.telegraph>0){ctx.strokeStyle=`rgba(255,90,70,${.45+.3*Math.sin(performance.now()/50)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.r+10+(e.telegraph*8),0,7);ctx.stroke();}
    if(e.kind==='wisp'){ctx.shadowColor='#69ffe8';ctx.shadowBlur=18;const pulse=1+Math.sin(performance.now()/120+e.x)*.08;ctx.scale(pulse,pulse);ctx.fillStyle='#74f4dd55';ctx.beginPath();ctx.arc(0,0,18,0,7);ctx.fill();ctx.fillStyle='#cafff3';ctx.beginPath();ctx.moveTo(0,-14);ctx.quadraticCurveTo(18,0,0,17);ctx.quadraticCurveTo(-18,0,0,-14);ctx.fill();ctx.fillStyle='#153b39';ctx.fillRect(-6,-3,3,3);ctx.fillRect(3,-3,3,3);}
    else if(wardenReady){ctx.shadowColor='#69ffe8';ctx.shadowBlur=12;ctx.drawImage(wardenArt,-58,-82,116,108);}
    else {ctx.shadowColor='#69ffe8';ctx.shadowBlur=10;ctx.fillStyle='#536b65';ctx.beginPath();ctx.moveTo(0,-36);ctx.lineTo(27,-18);ctx.lineTo(30,22);ctx.lineTo(0,34);ctx.lineTo(-30,22);ctx.lineTo(-27,-18);ctx.closePath();ctx.fill();ctx.strokeStyle='#9cb3a8';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#1a2a27';ctx.fillRect(-20,-19,40,13);ctx.fillStyle='#6ff5df';ctx.fillRect(-12,-15,8,5);ctx.fillRect(5,-15,8,5);}
    ctx.restore();
    if(e.kind!=='warden'&&e.hp<e.maxHp){ctx.fillStyle='#07100e';ctx.fillRect(e.x-19,e.y-e.r-14,38,5);ctx.fillStyle='#ed6d5b';ctx.fillRect(e.x-18,e.y-e.r-13,36*e.hp/e.maxHp,3);}
  }

  function drawProjectiles(){for(const p of projectiles){const friendly=p.kind!=='enemy';ctx.save();ctx.globalCompositeOperation='screen';ctx.shadowColor=friendly?'#68ffec':'#ff755f';ctx.shadowBlur=18;ctx.fillStyle=p.kind==='companion'?'#fff2a6':friendly?'#bcfff5':'#ff9278';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.strokeStyle=friendly?'#63ebdb':'#bf3b32';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();}}
  function drawEffects(){for(const p of particles){ctx.save();ctx.globalAlpha=clamp(p.life/(p.max||1),0,1);if(p.kind==='slash'){ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.strokeStyle=p.color;ctx.lineWidth=5+p.size;ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,28+p.size*4,-1.2,1.2);ctx.stroke();}else{ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}ctx.restore();}for(const t of damageTexts){ctx.save();ctx.globalAlpha=t.life/.8;ctx.fillStyle=t.color;ctx.strokeStyle='#06100e';ctx.lineWidth=3;ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.strokeText(t.text,t.x,t.y);ctx.fillText(t.text,t.x,t.y);ctx.restore();}}

  function update(dt){
    if(paused)return;S.playTime+=dt;saveClock+=dt;updatePlayer(dt);updateEnemies(dt);updateMiraAssist(dt);updateProjectiles(dt);updateEffects(dt);updateInteraction();updateHUD();
    el.attackCooldown.style.height=`${attackCd/.42*100}%`;el.spellCooldown.style.height=`${spellCd/1.05*100}%`;el.dodgeCooldown.style.height=`${dodgeCd/.82*100}%`;
    if(saveClock>4){save();saveClock=0;}
  }
  function loop(now){if(!running)return;const dt=Math.min(.034,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop);}

  function renderJournal(tab=currentTab){
    currentTab=tab;document.querySelectorAll('.journal-tabs button').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)});const [title,text]=objective();
    if(tab==='quest')el.journalBody.innerHTML=`<div class="journal-card"><span class="choice-tag">Main thread</span><h3>${title}</h3><p>${text}</p><div class="progress"><i style="width:${Math.min(100,(S.quest+1)*20)}%"></i></div></div><div class="journal-card"><h3>What the road remembers</h3><p>${S.storyChoice?`You told Mira that you heard ${S.storyChoice==='mercy'?'a plea for help':'a command to open the road'}. She will remember that.`:'Mira is waiting near the lantern plaza. She seems to know why the road called you.'}</p>${S.endingChoice?`<span class="choice-tag">Choice: ${S.endingChoice}</span>`:''}</div>`;
    if(tab==='gear')el.journalBody.innerHTML=`<div class="journal-card"><div class="journal-row"><div><h3>${S.inventory[0].name}</h3><p>${S.inventory[0].rarity} ${S.inventory[0].type}</p></div><strong>${S.inventory[0].power} power</strong></div></div><div class="journal-card"><h3>${S.style==='vanguard'?'Vanguard':S.style==='ranger'?'Wayfinder':'Lightweaver'} gift</h3><p>${S.style==='vanguard'?'+20 maximum vitality and a 15-power starting blade.':S.style==='ranger'?'+18 movement speed and an 18% critical-strike chance.':'+30 maximum aether and 35% stronger starting spells.'}</p></div>${S.storyChoice?`<div class="journal-card"><h3>Mira's response</h3><p>${S.storyChoice==='mercy'?`Lantern Ward: incoming hits are softened while ${S.miraWard} ward charges remain.`:'The commanding Way: +15 maximum aether and 10% stronger magic.'}</p></div>`:''}`;
    if(tab==='world')el.journalBody.innerHTML=`<div class="journal-card"><h3>Northford</h3><p>A riverside village built around a dead Everlight Way. Its lamps have begun lighting on their own.</p></div><div class="journal-card"><h3>Discoveries</h3><p>${S.discoveries.join(' · ')}</p></div><div class="journal-card"><h3>The eastern road</h3><p>${S.chapterComplete?'The seal has changed. Somewhere beyond the mountain, a second beacon has answered.':'The gate remains sealed by a Hollow Warden.'}</p></div>`;
    if(tab==='settings')el.journalBody.innerHTML=`${settingRow('Sound effects','sound')}${settingRow('Haptics','haptics')}${settingRow('Reduced motion','reducedMotion')}${settingRow('High contrast','highContrast')}${settingRow('Left-handed controls','leftHanded')}${settingRow('Story assist · less damage, stronger attacks','assistMode')}<div class="setting"><div><strong>Save</strong><small> Progress autosaves every few seconds.</small></div><button id="saveNow">Save now</button></div><div class="setting"><div><strong>Start over</strong><small> Erases this local journey.</small></div><button id="resetGame" class="danger-btn">Reset save</button></div>`;
    if(tab==='settings'){el.journalBody.querySelectorAll('[data-setting]').forEach(b=>b.onclick=()=>toggleSetting(b.dataset.setting));$('saveNow').onclick=()=>{save();toast('Journey saved')};$('resetGame').onclick=()=>{if(confirm('Erase this journey and begin again?')){localStorage.removeItem(SAVE_KEY);location.reload();}};}
  }
  function settingRow(label,key){return `<div class="setting"><strong>${label}</strong><button role="switch" aria-checked="${S.settings[key]}" class="${S.settings[key]?'on':''}" data-setting="${key}">${S.settings[key]?'On':'Off'}</button></div>`;}
  function toggleSetting(key){S.settings[key]=!S.settings[key];applySettings();save();renderJournal('settings');}
  function openJournal(tab='quest'){if(el.gameScreen.classList.contains('is-hidden'))return;restoreFocus=document.activeElement;paused=true;el.gameScreen.inert=true;show(el.journal);renderJournal(tab);requestAnimationFrame(()=>el.closeJournal.focus());}
  function closeJournal(){show(el.journal,false);el.gameScreen.inert=false;paused=false;last=performance.now();restoreFocus?.focus?.();restoreFocus=null;}

  function isStandalone(){return window.navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;}
  function fullscreenActive(){return !!(document.fullscreenElement||document.webkitFullscreenElement);}
  function updateFullscreenButton(){
    const active=fullscreenActive();
    el.fullscreenBtn.textContent=active?'×':'⛶';
    el.fullscreenBtn.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');
    if(isStandalone())show(el.fullscreenBtn,false);
  }
  async function toggleFullscreen(){
    wakeAudio();
    try{
      if(fullscreenActive()){
        const exit=document.exitFullscreen||document.webkitExitFullscreen;
        if(exit)await exit.call(document);
      }else{
        const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;
        if(!request)throw new Error('unsupported');
        await request.call(document.documentElement,{navigationUI:'hide'});
      }
      setTimeout(syncViewport,100);
    }catch(_){toast('For fullscreen: tap Share, then Add to Home Screen');}
    updateFullscreenButton();
  }

  function joyMove(e){const r=el.joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),m=Math.hypot(dx,dy),lim=r.width*.31;input.x=m?dx/Math.max(m,lim):0;input.y=m?dy/Math.max(m,lim):0;const k=Math.min(lim,m);el.joyKnob.style.transform=`translate(${m?dx/m*k:0}px,${m?dy/m*k:0}px)`;}
  el.joystick.addEventListener('pointerdown',e=>{e.preventDefault();pointerId=e.pointerId;el.joystick.setPointerCapture?.(pointerId);joyMove(e);wakeAudio();});
  el.joystick.addEventListener('pointermove',e=>{if(e.pointerId===pointerId)joyMove(e)});
  const joyEnd=e=>{if(pointerId!==null&&e.pointerId!==pointerId)return;pointerId=null;input.x=input.y=0;el.joyKnob.style.transform=''};el.joystick.addEventListener('pointerup',joyEnd);el.joystick.addEventListener('pointercancel',joyEnd);
  [['attackBtn',attack],['spellBtn',castSpell],['dodgeBtn',dodge],['interactBtn',interact]].forEach(([id,fn])=>el[id].addEventListener('pointerdown',e=>{e.preventDefault();el[id].classList.add('pressed');fn()}));
  document.addEventListener('pointerup',()=>document.querySelectorAll('.action.pressed').forEach(b=>b.classList.remove('pressed')));
  addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'){e.preventDefault();attack()}if(e.code==='KeyQ')castSpell();if(e.code==='ShiftLeft'||e.code==='ShiftRight')dodge();if(e.code==='KeyE')interact();if(e.code==='Escape'){if(!el.journal.classList.contains('is-hidden'))closeJournal();else openJournal('settings')}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();input.x=input.y=0});document.addEventListener('visibilitychange',()=>{
    if(document.hidden){save();paused=true;return;}
    const modalOpen=!el.dialogue.classList.contains('is-hidden')||!el.journal.classList.contains('is-hidden')||!el.chapterComplete.classList.contains('is-hidden');
    if(running&&!modalOpen){paused=false;last=performance.now();}
  });

  el.newGameBtn.onclick=()=>{wakeAudio();if(S.style&&localStorage.getItem(SAVE_KEY)&&!confirm('Begin a new journey? Your current local journey will be replaced after you choose a new path.'))return;show(el.titleScreen,false);show(el.pathScreen,true)};
  el.continueBtn.onclick=()=>{wakeAudio();beginGame(false)};
  document.querySelectorAll('[data-path]').forEach(b=>b.onclick=()=>{wakeAudio();sfx('select');startNew(b.dataset.path)});
  el.attackBtn.onclick=()=>{};el.dialogueNext.onclick=advanceDialogue;el.objectiveBtn.onclick=()=>openJournal('quest');el.fullscreenBtn.onclick=toggleFullscreen;el.pauseBtn.onclick=()=>openJournal('settings');el.closeJournal.onclick=closeJournal;
  document.querySelectorAll('.journal-tabs button').forEach(b=>b.onclick=()=>renderJournal(b.dataset.tab));
  el.keepExploringBtn.onclick=()=>{show(el.chapterComplete,false);el.gameScreen.inert=false;paused=false;toast('Northford is yours to explore');updateHUD();el.objectiveBtn.focus()};

  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;const modal=[el.dialogue,el.journal,el.chapterComplete].find(node=>!node.classList.contains('is-hidden'));if(!modal)return;
    const focusable=[...modal.querySelectorAll('button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')];if(!focusable.length)return;
    const first=focusable[0],lastItem=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastItem.focus()}else if(!e.shiftKey&&document.activeElement===lastItem){e.preventDefault();first.focus()}
  });

  document.addEventListener('fullscreenchange',()=>{syncViewport();updateFullscreenButton()});
  document.addEventListener('webkitfullscreenchange',()=>{syncViewport();updateFullscreenButton()});
  applySettings();updateFullscreenButton();
  addEventListener('load',()=>setTimeout(()=>{show(el.loading,false);show(el.titleScreen,true);if(localStorage.getItem(SAVE_KEY)&&S.style)show(el.continueBtn,true);},520));
})();
