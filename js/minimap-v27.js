(() => {
  'use strict';
  let last=0;
  function draw(canvas,{zone,player,objects,enemies,solids=[],polygons=[],houses=[],target,opened=[],time=0,background=null}){
    if(!canvas||time-last<100)return;last=time;
    const c=canvas.getContext('2d'),w=168,h=94,pad=6,s=Math.min((w-pad*2)/zone.width,(h-pad*2)/zone.height),ox=(w-zone.width*s)/2,oy=(h-zone.height*s)/2;
    if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    const point=(x,y)=>[ox+x*s,oy+y*s];
    c.clearRect(0,0,w,h);c.fillStyle='#071a18';c.fillRect(0,0,w,h);
    if(background){c.globalAlpha=.55;c.drawImage(background,ox,oy,zone.width*s,zone.height*s);c.globalAlpha=1;}
    else{c.fillStyle=zone.type==='room'||zone.type==='interior'?'#544332':'#234337';c.fillRect(ox,oy,zone.width*s,zone.height*s);c.strokeStyle='#779081';c.lineWidth=1;c.strokeRect(ox,oy,zone.width*s,zone.height*s);}
    c.fillStyle='#081410bb';for(const r of solids)c.fillRect(ox+r[0]*s,oy+r[1]*s,r[2]*s,r[3]*s);
    for(const poly of polygons){c.beginPath();poly.forEach(([x,y],i)=>{const p=point(x,y);i?c.lineTo(...p):c.moveTo(...p);});c.closePath();c.fill();}
    for(const b of houses)c.fillRect(ox+(b.x-94)*s,oy+(b.y-175)*s,188*s,168*s);
    const dot=(x,y,color,r)=>{c.fillStyle=color;c.strokeStyle='#00110e';c.lineWidth=1;c.beginPath();c.arc(...point(x,y),r,0,Math.PI*2);c.fill();c.stroke();};
    for(const o of objects){
      if(o.kind==='portal')dot(o.x,o.y,'#e2d5ac',2);
      else if(o.kind==='waystone')dot(o.x,o.y,'#6db9fd',2.5);
      else if(o.kind==='chest'&&!opened.includes(o.id)&&(!o.secret||Math.hypot(o.x-player.x,o.y-player.y)<100))dot(o.x,o.y,'#c29a56',1.7);
    }
    for(const e of enemies)if(!e.dead&&Math.hypot(e.x-player.x,e.y-player.y)<600)dot(e.x,e.y,'#ff796d',e.kind==='warden'?3:1.7);
    if(target){const [x,y]=point(target.x,target.y);c.strokeStyle='#ffdc74';c.lineWidth=2;c.beginPath();c.moveTo(x,y-5);c.lineTo(x+4,y);c.lineTo(x,y+5);c.lineTo(x-4,y);c.closePath();c.stroke();}
    dot(player.x,player.y,'#80fff0',3.2);c.fillStyle='#fff6d2';c.font='bold 9px system-ui';c.fillText('N',3,10);
  }
  window.EVERLIGHT_MINIMAP={version:27,draw};
})();
