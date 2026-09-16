(function(){
  const PAD={active:false,index:null,lastButtons:[],lastMove:[0,0],focusIndex:0,lastInputAt:0};
  const dead=v=>Math.abs(v)<0.16?0:v;
  const pressed=(gp,i)=>!!(gp.buttons[i]&&gp.buttons[i].pressed);
  const edge=(gp,i)=>pressed(gp,i)&&!PAD.lastButtons[i];
  const overlayOpen=()=>document.querySelector('.overlay.open');
  const gameStarted=()=>!document.getElementById('start');
  const focusables=()=>{
    const root=overlayOpen();
    if(!root)return[];
    return [...root.querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(el=>el.offsetParent!==null);
  };
  function showMode(active,gp){
    PAD.active=active;
    document.documentElement.classList.toggle('gamepad-active',active);
    let el=document.getElementById('controllerStatus');
    if(!el){
      el=document.createElement('div');el.id='controllerStatus';
      Object.assign(el.style,{position:'fixed',left:'50%',bottom:'max(8px, env(safe-area-inset-bottom))',transform:'translateX(-50%)',zIndex:'30',padding:'6px 10px',borderRadius:'999px',background:'#07110edd',border:'1px solid #9bc49c',font:'11px system-ui',color:'#fff',pointerEvents:'none',opacity:'0',transition:'opacity .2s'});
      document.body.appendChild(el);
      const style=document.createElement('style');
      style.textContent=`.gamepad-active .joy,.gamepad-active .b.atk,.gamepad-active .b.use,.gamepad-active .b.dash{opacity:.08;transition:opacity .25s}.gamepad-active .joy{pointer-events:none}.gamepad-active .b.atk,.gamepad-active .b.use,.gamepad-active .b.dash{pointer-events:none}.controller-focus{outline:3px solid #ffd36f!important;outline-offset:2px}`;
      document.head.appendChild(style);
    }
    if(active&&gp){el.textContent='🎮 Controller connected · X/Square Attack · A/Cross Use · B/Circle Dodge · Menu Start';el.style.opacity='1';clearTimeout(showMode.t);showMode.t=setTimeout(()=>el.style.opacity='0',3800)}
  }
  function focusAt(i){
    const list=focusables(); if(!list.length)return;
    list.forEach(x=>x.classList.remove('controller-focus'));
    PAD.focusIndex=(i+list.length)%list.length;
    const el=list[PAD.focusIndex];el.classList.add('controller-focus');el.focus({preventScroll:false});el.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function moveFocus(delta){focusAt(PAD.focusIndex+delta)}
  function clickFocused(){const list=focusables();if(!list.length)return false;const el=list[Math.min(PAD.focusIndex,list.length-1)];el.click();return true}
  function firePointer(el){if(el&&typeof el.onpointerdown==='function')el.onpointerdown({preventDefault(){},pointerId:-999,clientX:0,clientY:0})}
  function driveJoystick(gp){
    const joy=document.getElementById('joy'); if(!joy||typeof joy.onpointermove!=='function')return;
    let mx=dead(gp.axes[0]||0),my=dead(gp.axes[1]||0);
    // D-pad doubles as movement when no menu is open.
    if(!overlayOpen()){
      if(pressed(gp,14))mx=-1;if(pressed(gp,15))mx=1;if(pressed(gp,12))my=-1;if(pressed(gp,13))my=1;
    }
    const mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag}
    const r=joy.getBoundingClientRect();
    if(!joy.__everlightOriginalHasCapture){
      joy.__everlightOriginalHasCapture=joy.hasPointerCapture?joy.hasPointerCapture.bind(joy):()=>false;
      joy.hasPointerCapture=id=>id===-999||joy.__everlightOriginalHasCapture(id);
    }
    joy.onpointermove({pointerId:-999,clientX:r.left+r.width/2+mx*40,clientY:r.top+r.height/2+my*40});
    if(!mx&&!my&&typeof joy.onpointerup==='function')joy.onpointerup({pointerId:-999});
  }
  function changeTab(dir){
    const labels=['Adventure','Inventory','Properties','Crafting','World'];
    const root=overlayOpen();if(!root||typeof window.openTab!=='function')return;
    const tabs=[...document.querySelectorAll('#tabsEl button')];
    let cur=tabs.findIndex(b=>b.classList.contains('controller-focus')||b===document.activeElement);
    if(cur<0)cur=0;cur=(cur+dir+labels.length)%labels.length;window.openTab(labels[cur]);setTimeout(()=>{const nt=[...document.querySelectorAll('#tabsEl button')];const idx=Math.min(cur,nt.length-1);PAD.focusIndex=idx;focusAt(idx)},0);
  }
  function poll(){
    const pads=navigator.getGamepads?navigator.getGamepads():[];
    let gp=PAD.index!=null?pads[PAD.index]:null;
    if(!gp)gp=[...pads].find(Boolean);
    if(gp){
      if(!PAD.active||PAD.index!==gp.index){PAD.index=gp.index;PAD.lastButtons=[];showMode(true,gp)}
      driveJoystick(gp);
      const open=overlayOpen();
      // Start/options toggles menu. It also starts the game from the title screen.
      if(edge(gp,9)){
        const start=document.getElementById('startBtn');
        if(start&&document.getElementById('start'))start.click();
        else if(open){const close=document.getElementById('closeMenu');if(close)close.click()}
        else firePointer(document.getElementById('menu'));
      }
      if(open){
        if(edge(gp,12))moveFocus(-1);
        if(edge(gp,13))moveFocus(1);
        if(edge(gp,14))moveFocus(-1);
        if(edge(gp,15))moveFocus(1);
        if(edge(gp,4))changeTab(-1);
        if(edge(gp,5))changeTab(1);
        if(edge(gp,0)){if(!clickFocused())focusAt(0)}
        if(edge(gp,1)){const close=document.getElementById('closeMenu');if(close)close.click()}
        // Character creation and other overlays get focus automatically.
        if(focusables().length&&document.activeElement===document.body)focusAt(0);
      }else if(gameStarted()){
        if(edge(gp,2))firePointer(document.getElementById('atk')); // X / Square
        if(edge(gp,0))firePointer(document.getElementById('use')); // A / Cross
        if(edge(gp,1))firePointer(document.getElementById('dash')); // B / Circle
        if(edge(gp,3))firePointer(document.getElementById('menu')); // Y / Triangle = quick menu for now
      }
      PAD.lastButtons=gp.buttons.map(b=>b.pressed);
    }else if(PAD.active){PAD.index=null;PAD.lastButtons=[];showMode(false)}
    requestAnimationFrame(poll);
  }
  window.addEventListener('gamepadconnected',e=>{PAD.index=e.gamepad.index;showMode(true,e.gamepad);setTimeout(()=>focusAt(0),50)});
  window.addEventListener('gamepaddisconnected',e=>{if(PAD.index===e.gamepad.index){PAD.index=null;showMode(false)}});
  // Keyboard fallback also helps desktop testing.
  const keys=new Set();
  window.addEventListener('keydown',e=>{
    keys.add(e.code);
    if(e.repeat)return;
    if(e.code==='KeyJ')firePointer(document.getElementById('atk'));
    if(e.code==='KeyK')firePointer(document.getElementById('use'));
    if(e.code==='Space')firePointer(document.getElementById('dash'));
    if(e.code==='Escape')firePointer(document.getElementById('menu'));
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  requestAnimationFrame(poll);
})();
