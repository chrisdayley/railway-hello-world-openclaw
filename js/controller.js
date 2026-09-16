(function(){
  const PRESETS={
    standard:{attack:2,use:0,dodge:1,quick:3,menu:9,settings:8},
    action:{attack:0,use:2,dodge:1,quick:3,menu:9,settings:8},
    southpaw:{attack:3,use:0,dodge:1,quick:2,menu:9,settings:8}
  };
  let preset=localStorage.getItem('everlight-controller-preset')||'standard';
  if(!PRESETS[preset])preset='standard';
  const PAD={active:false,index:null,lastButtons:[],focusIndex:0};
  const map=()=>PRESETS[preset];
  const dead=v=>Math.abs(v)<0.16?0:v;
  const pressed=(gp,i)=>!!(gp.buttons[i]&&gp.buttons[i].pressed);
  const edge=(gp,i)=>pressed(gp,i)&&!PAD.lastButtons[i];
  const overlayOpen=()=>document.querySelector('.overlay.open,#controllerOverlay.open');
  const gameStarted=()=>!document.getElementById('start');
  const focusables=()=>{
    const root=overlayOpen();
    if(!root)return[];
    return [...root.querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(el=>el.offsetParent!==null);
  };
  function ensureUi(){
    let el=document.getElementById('controllerStatus');
    if(!el){
      el=document.createElement('div');el.id='controllerStatus';
      Object.assign(el.style,{position:'fixed',left:'50%',bottom:'max(8px, env(safe-area-inset-bottom))',transform:'translateX(-50%)',zIndex:'30',padding:'6px 10px',borderRadius:'999px',background:'#07110edd',border:'1px solid #9bc49c',font:'11px system-ui',color:'#fff',pointerEvents:'none',opacity:'0',transition:'opacity .2s'});
      document.body.appendChild(el);
      const style=document.createElement('style');
      style.textContent=`.gamepad-active .joy,.gamepad-active .b.atk,.gamepad-active .b.use,.gamepad-active .b.dash{opacity:.06;transition:opacity .25s}.gamepad-active .joy{pointer-events:none}.gamepad-active .b.atk,.gamepad-active .b.use,.gamepad-active .b.dash{pointer-events:none}.controller-focus{outline:3px solid #ffd36f!important;outline-offset:2px}#controllerOverlay{position:fixed;inset:0;z-index:40;background:#07110ef6;display:none;place-items:center;padding:20px;box-sizing:border-box}#controllerOverlay.open{display:grid}#controllerOverlay .ccard{width:min(620px,92vw);background:#10231d;border:1px solid #9bc49c;border-radius:14px;padding:18px}#controllerOverlay .preset{display:block;width:100%;margin:8px 0;background:#1b3b31;color:#fff;border:1px solid #a7d5a8;border-radius:10px;padding:12px;text-align:left}#controllerOverlay .activePreset{border-color:#ffd36f;box-shadow:0 0 0 2px #ffd36f55}`;
      document.head.appendChild(style);
      const ov=document.createElement('div');ov.id='controllerOverlay';
      ov.innerHTML='<div class="ccard"><h2>Controller</h2><p class="muted">Choose a layout. Select/Share opens this screen any time.</p><div id="controllerPresetList"></div><p class="muted">Left stick: move · D-pad: menu navigation · LB/RB: menu tabs · Start/Options: game menu</p><button id="controllerClose" class="preset">Close</button></div>';
      document.body.appendChild(ov);
      document.getElementById('controllerClose').onclick=closeSettings;
    }
    renderSettings();
  }
  function labels(){
    return preset==='action'?['A/Cross Attack','X/Square Use','B/Circle Dodge','Y/Triangle Quick Menu']:preset==='southpaw'?['Y/Triangle Attack','A/Cross Use','B/Circle Dodge','X/Square Quick Menu']:['X/Square Attack','A/Cross Use','B/Circle Dodge','Y/Triangle Quick Menu'];
  }
  function renderSettings(){
    const list=document.getElementById('controllerPresetList');if(!list)return;
    const names={standard:'Standard',action:'Action-first',southpaw:'Alternate'};
    list.innerHTML=Object.keys(PRESETS).map(k=>`<button class="preset ${k===preset?'activePreset':''}" data-preset="${k}"><b>${names[k]}</b><br><span class="muted">${k==='standard'?'Attack on X/Square, interact on A/Cross':k==='action'?'Attack on A/Cross, interact on X/Square':'Attack on Y/Triangle, quick menu on X/Square'}</span></button>`).join('');
    [...list.querySelectorAll('[data-preset]')].forEach(b=>b.onclick=()=>{preset=b.dataset.preset;localStorage.setItem('everlight-controller-preset',preset);renderSettings();showMode(true,navigator.getGamepads?.()[PAD.index]||null);setTimeout(()=>focusAt(0),0)});
  }
  function openSettings(){ensureUi();const ov=document.getElementById('controllerOverlay');ov.classList.add('open');PAD.focusIndex=0;setTimeout(()=>focusAt(0),0)}
  function closeSettings(){document.getElementById('controllerOverlay')?.classList.remove('open');PAD.focusIndex=0}
  function showMode(active,gp){
    ensureUi();PAD.active=active;document.documentElement.classList.toggle('gamepad-active',active);
    const el=document.getElementById('controllerStatus');
    if(active&&gp){el.textContent='🎮 '+labels().join(' · ')+' · Select/Share Settings';el.style.opacity='1';clearTimeout(showMode.t);showMode.t=setTimeout(()=>el.style.opacity='0',4200)}else el.style.opacity='0';
  }
  function focusAt(i){const list=focusables();if(!list.length)return;list.forEach(x=>x.classList.remove('controller-focus'));PAD.focusIndex=(i+list.length)%list.length;const el=list[PAD.focusIndex];el.classList.add('controller-focus');el.focus({preventScroll:false});el.scrollIntoView({block:'nearest',behavior:'smooth'})}
  function moveFocus(delta){focusAt(PAD.focusIndex+delta)}
  function clickFocused(){const list=focusables();if(!list.length)return false;const el=list[Math.min(PAD.focusIndex,list.length-1)];el.click();return true}
  function firePointer(el){if(el&&typeof el.onpointerdown==='function')el.onpointerdown({preventDefault(){},pointerId:-999,clientX:0,clientY:0})}
  function driveJoystick(gp){
    const joy=document.getElementById('joy');if(!joy||typeof joy.onpointermove!=='function')return;
    let mx=dead(gp.axes[0]||0),my=dead(gp.axes[1]||0);
    if(!overlayOpen()){if(pressed(gp,14))mx=-1;if(pressed(gp,15))mx=1;if(pressed(gp,12))my=-1;if(pressed(gp,13))my=1}
    const mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag}
    const r=joy.getBoundingClientRect();
    if(!joy.__everlightOriginalHasCapture){joy.__everlightOriginalHasCapture=joy.hasPointerCapture?joy.hasPointerCapture.bind(joy):()=>false;joy.hasPointerCapture=id=>id===-999||joy.__everlightOriginalHasCapture(id)}
    joy.onpointermove({pointerId:-999,clientX:r.left+r.width/2+mx*40,clientY:r.top+r.height/2+my*40});
    if(!mx&&!my&&typeof joy.onpointerup==='function')joy.onpointerup({pointerId:-999});
  }
  function changeTab(dir){
    const labels=['Adventure','Inventory','Properties','Crafting','World'];const root=overlayOpen();if(!root||typeof window.openTab!=='function'||document.getElementById('controllerOverlay')?.classList.contains('open'))return;
    const tabs=[...document.querySelectorAll('#tabsEl button')];let cur=tabs.findIndex(b=>b.classList.contains('controller-focus')||b===document.activeElement);if(cur<0)cur=0;cur=(cur+dir+labels.length)%labels.length;window.openTab(labels[cur]);setTimeout(()=>{const nt=[...document.querySelectorAll('#tabsEl button')];PAD.focusIndex=Math.min(cur,nt.length-1);focusAt(PAD.focusIndex)},0)
  }
  function poll(){
    const pads=navigator.getGamepads?navigator.getGamepads():[];let gp=PAD.index!=null?pads[PAD.index]:null;if(!gp)gp=[...pads].find(Boolean);
    if(gp){
      if(!PAD.active||PAD.index!==gp.index){PAD.index=gp.index;PAD.lastButtons=[];showMode(true,gp)}
      driveJoystick(gp);const open=overlayOpen(),m=map();
      if(edge(gp,m.settings)){if(document.getElementById('controllerOverlay')?.classList.contains('open'))closeSettings();else openSettings()}
      if(edge(gp,m.menu)){
        const start=document.getElementById('startBtn');
        if(start&&document.getElementById('start'))start.click();
        else if(document.getElementById('controllerOverlay')?.classList.contains('open'))closeSettings();
        else if(open){document.getElementById('closeMenu')?.click()}
        else firePointer(document.getElementById('menu'));
      }
      if(open){
        if(edge(gp,12)||edge(gp,14))moveFocus(-1);if(edge(gp,13)||edge(gp,15))moveFocus(1);if(edge(gp,4))changeTab(-1);if(edge(gp,5))changeTab(1);
        if(edge(gp,0)){if(!clickFocused())focusAt(0)}
        if(edge(gp,1)){if(document.getElementById('controllerOverlay')?.classList.contains('open'))closeSettings();else document.getElementById('closeMenu')?.click()}
        if(focusables().length&&document.activeElement===document.body)focusAt(0);
      }else if(gameStarted()){
        if(edge(gp,m.attack))firePointer(document.getElementById('atk'));
        if(edge(gp,m.use))firePointer(document.getElementById('use'));
        if(edge(gp,m.dodge))firePointer(document.getElementById('dash'));
        if(edge(gp,m.quick))firePointer(document.getElementById('menu'));
      }
      PAD.lastButtons=gp.buttons.map(b=>b.pressed);
    }else if(PAD.active){PAD.index=null;PAD.lastButtons=[];showMode(false)}
    requestAnimationFrame(poll)
  }
  window.addEventListener('gamepadconnected',e=>{PAD.index=e.gamepad.index;showMode(true,e.gamepad);setTimeout(()=>focusAt(0),50)});
  window.addEventListener('gamepaddisconnected',e=>{if(PAD.index===e.gamepad.index){PAD.index=null;showMode(false)}});
  window.addEventListener('keydown',e=>{if(e.repeat)return;if(e.code==='KeyJ')firePointer(document.getElementById('atk'));if(e.code==='KeyK')firePointer(document.getElementById('use'));if(e.code==='Space')firePointer(document.getElementById('dash'));if(e.code==='Escape')firePointer(document.getElementById('menu'));if(e.code==='F1')openSettings()});
  ensureUi();requestAnimationFrame(poll);
})();
