(function(){
  const c=document.getElementById('g'),q=c.getContext('2d');
  const heroImg=new Image(); let heroReady=false;
  heroImg.decoding='async';
  heroImg.onload=()=>heroReady=true;
  heroImg.src='assets/hero-player.webp?v=16';

  function shadow(x,y,w=18){q.save();q.globalAlpha=.35;q.fillStyle='#07110e';q.beginPath();q.ellipse(x,y,w,7,0,0,Math.PI*2);q.fill();q.restore()}
  function rect(x,y,w,h,col){q.fillStyle=col;q.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}

  function fallbackHero(x,y){
    shadow(x,y+22,17);
    rect(x-14,y-14,28,24,'#3c7950');
    rect(x-10,y-29,20,16,'#d9a274');
    rect(x-13,y+10,8,11,'#4c372a');rect(x+5,y+10,8,11,'#4c372a');
    rect(x+15,y-13,4,29,'#e4e2d7');
    rect(x-20,y-10,8,20,'#52717a');
  }

  function hero(x,y){
    shadow(x,y+23,18);
    if(!heroReady){fallbackHero(x,y);return;}
    const f=window.__everlightFacing||{x:1,y:0};
    const w=52,h=47;
    q.save();
    q.imageSmoothingEnabled=false;
    // Mirror the art when facing left so standing direction is readable even before full 4-way sheets land.
    if(f.x<-.2){q.translate(x+w/2,y-h/2);q.scale(-1,1);q.drawImage(heroImg,0,0,w,h);}
    else q.drawImage(heroImg,Math.round(x-w/2),Math.round(y-h/2),w,h);
    q.restore();
  }

  function npc(x,y,k=1){
    const cs=['#4c8753','#a25c51','#566f9e','#9a7546'];shadow(x,y+20,13);
    rect(x-9,y-20,18,15,'#d7a277');rect(x-11,y-5,22,22,cs[k%4]);
    rect(x-8,y+17,6,8,'#3b2c28');rect(x+2,y+17,6,8,'#3b2c28');
    rect(x-9,y-23,18,6,k===2?'#d2d5d4':'#593929');
  }
  function enemy(x,y,t){
    shadow(x,y+13,14);
    if(t==='cinder'){rect(x-13,y-14,26,28,'#9e5b3f');rect(x-9,y-20,18,9,'#d1884f');rect(x-6,y-5,4,4,'#ffd36f');rect(x+3,y-5,4,4,'#ffd36f');}
    else if(t==='knight'){rect(x-13,y-12,26,28,'#657181');rect(x-11,y-21,22,12,'#a9b0b4');rect(x-7,y-16,14,4,'#26303a');rect(x+14,y-8,5,28,'#d2d6d5');}
    else {q.fillStyle='#6f9d54';q.beginPath();q.arc(x,y,15,0,Math.PI*2);q.fill();rect(x-7,y-4,4,4,'#17211a');rect(x+3,y-4,4,4,'#17211a');}
  }
  window.EverlightSprites={hero,npc,enemy,heroReady:()=>heroReady};
})();