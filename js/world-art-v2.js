(function(){
  const canvas=document.getElementById('g');
  const ctx=canvas.getContext('2d');
  const world=new Image();
  let ready=false, failed=false, tick=0;
  world.decoding='async';
  world.onload=()=>{ready=true;};
  world.onerror=()=>{failed=true;};
  world.src='assets/world-strip.svg?v=16';

  function fallback(){
    ctx.fillStyle='#315f43';
    ctx.fillRect(0,0,4800,540);
    ctx.fillStyle='#b79b68';
    ctx.fillRect(0,205,4800,120);
  }

  function ambient(cam){
    // Small animated glints keep the painted world from feeling completely static.
    tick++;
    ctx.save();
    for(let i=0;i<12;i++){
      const x=cam+((i*173+tick*.25)%960);
      const y=70+((i*97)%390);
      const a=.18+.12*Math.sin((tick+i*13)/25);
      ctx.globalAlpha=a;
      ctx.fillStyle=i%3===0?'#fff2a9':'#b7f4df';
      ctx.fillRect(x,y,2,2);
    }
    ctx.restore();
  }

  window.EverlightWorldRender=function(cam){
    ctx.imageSmoothingEnabled=false;
    if(ready){
      ctx.drawImage(world,0,0,4800,540);
      ambient(cam);
    }else{
      fallback();
      if(failed){
        ctx.fillStyle='#f0d78a';
        ctx.font='14px system-ui';
        ctx.fillText('Loading world art…',cam+30,50);
      }
    }
  };
})();