(function(){
const C=document.getElementById('g'),ctx=C.getContext('2d'); if(!C||!ctx)return;
const oldClear=ctx.clearRect.bind(ctx); let frame=0;
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function tree(x,y,s=1){rect(x-9*s,y-3*s,18*s,20*s,'#513b2a');rect(x-24*s,y-25*s,48*s,30*s,'#173f31');rect(x-18*s,y-32*s,36*s,25*s,'#286047');rect(x-10*s,y-37*s,20*s,16*s,'#4b8759');rect(x-20*s,y-12*s,8*s,7*s,'#74a864')}
function flower(x,y,c){rect(x,y,3,3,c);rect(x+3,y+2,2,2,'#f7e8a9')}
function house(x,y,roof='#315d79',sign=''){rect(x,y,115,72,'#927652');rect(x+6,y+8,103,57,'#c6aa78');ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-9,y+10);ctx.lineTo(x+57,y-34);ctx.lineTo(x+124,y+10);ctx.fill();rect(x+46,y+36,24,36,'#5a3926');rect(x+12,y+24,23,20,'#f4c35c');rect(x+80,y+24,23,20,'#f4c35c');rect(x+15,y+27,17,14,'#7a542c');rect(x+83,y+27,17,14,'#7a542c');if(sign){rect(x+32,y+4,52,18,'#402b20');ctx.fillStyle='#f4d68a';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText(sign,x+58,y+17);ctx.textAlign='left'}}
function bridge(x,y){rect(x,y,85,33,'#785435');for(let i=0;i<6;i++)rect(x+i*15,y+3,10,27,'#b9854e');rect(x,y-4,85,5,'#4d3829');rect(x,y+31,85,5,'#4d3829')}
function lamp(x,y){rect(x,y,5,28,'#45382c');rect(x-5,y-7,15,13,'#382d24');rect(x-2,y-4,9,7,'#ffd166')}
function npc(x,y,kind=0){const coats=['#4c8753','#8f4e45','#465f8e','#8c6a3c'];rect(x-7,y-7,14,11,'#d5a174');rect(x-8,y+4,16,18,coats[kind%coats.length]);rect(x-6,y+22,5,7,'#3b2c28');rect(x+2,y+22,5,7,'#3b2c28');rect(x-7,y-10,14,5,kind===2?'#d7d9d8':'#5a3927')}
function hero(x,y){rect(x-8,y-12,16,10,'#d7a16e');rect(x-10,y-2,20,20,'#36754e');rect(x-7,y+18,6,9,'#503a2c');rect(x+2,y+18,6,9,'#503a2c');rect(x-11,y-9,22,5,'#79522e');ctx.fillStyle='#4a8d5d';ctx.beginPath();ctx.moveTo(x-11,y-8);ctx.lineTo(x,y-22);ctx.lineTo(x+10,y-8);ctx.fill();rect(x+9,y+1,3,19,'#d8d6c8');rect(x+11,y-2,3,6,'#b88743')}
function slime(x,y,c='#678e49'){rect(x-10,y-5,20,13,c);rect(x-7,y-10,14,7,c);rect(x-5,y-3,3,3,'#101b18');rect(x+3,y-3,3,3,'#101b18')}
function decorate(cam){
// lush grass base + patterned ground
rect(cam,0,960,540,'#376c45');for(let gx=Math.floor(cam/32)*32;gx<cam+960;gx+=32)for(let gy=0;gy<540;gy+=32){if(((gx+gy)/32)%3===0)rect(gx+6,gy+8,3,7,'#5d9255')}
// Northford/Greenwake settlement
if(cam<1150){rect(60,188,1080,190,'#bca579');for(let i=0;i<34;i++){rect(75+i*31,208+(i%3)*43,21,14,i%2?'#cab58a':'#a9956e')}
rect(700,360,430,180,'#1d7080');for(let i=0;i<18;i++)rect(710+i*23,385+(i%4)*22,13,3,'#64b7c1');bridge(780,345);bridge(995,400);house(125,112,'#315c7d','WAYFARER');house(325,126,'#783d31','MARKET');house(545,105,'#6b4030','SMITHY');
for(let p of [[80,85],[250,80],[480,75],[690,75],[880,105],[1080,95],[85,420],[280,430],[520,435],[670,450]])tree(p[0],p[1],1.2);for(let i=0;i<45;i++)flower(80+(i*47)%990,155+(i*67)%285,['#fff2d2','#eaa2b8','#9bc9ff'][i%3]);for(let p of [[210,310],[390,280],[600,320],[910,250]])lamp(...p);npc(250,250,0);npc(420,330,1);npc(620,250,2);npc(875,320,3);
// fountain
ctx.fillStyle='#8f8b78';ctx.beginPath();ctx.arc(470,245,43,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3f9baa';ctx.beginPath();ctx.arc(470,245,33,0,Math.PI*2);ctx.fill();rect(464,208,12,35,'#b7b19c');
}
// later regions: distinct enchanted biomes
if(cam+960>1150&&cam<2450){for(let i=0;i<30;i++)tree(1160+(i*83)%1250,50+(i*113)%440,1+(i%3)*.15);rect(1500,150,410,120,'#213c35');for(let i=0;i<16;i++){rect(1510+i*25,165+(i%3)*25,16,9,'#536c5a')}house(1260,175,'#533d66','BRIARWATCH');}
if(cam+960>2400&&cam<3500){rect(2450,0,1050,540,'#48576a');for(let i=0;i<25;i++){rect(2460+(i*71)%1000,70+(i*109)%430,40,30,'#6d7480');rect(2470+(i*71)%1000,55+(i*109)%430,20,18,'#8b9198')}ctx.strokeStyle='#8cd9dd';ctx.lineWidth=5;ctx.strokeRect(2700,120,150,160)}
if(cam+960>3500){rect(3500,0,1450,540,'#3b745e');rect(3800,340,900,200,'#207a91');for(let i=0;i<20;i++)tree(3520+(i*91)%1300,40+(i*73)%300,1.1);house(3950,130,'#315c7d','SUNMERE');}
}
// Intercept clearRect: game calls this at start of every draw; paint our world immediately after.
ctx.clearRect=function(a,b,w,h){oldClear(a,b,w,h);frame++;let S=window.EV&&EV.S;if(!S)return;let cam=Math.max(0,Math.min(3940,S.x-480));ctx.save();ctx.translate(-cam,0);decorate(cam);ctx.restore()};
// Intercept the old simplistic hero/enemy rectangles by repainting richer sprites late each frame.
function overlay(){let S=window.EV&&EV.S;if(S){let cam=Math.max(0,Math.min(3940,S.x-480));ctx.save();ctx.translate(-cam,0);hero(S.x,S.y);if(S.mira)npc(S.x-34,S.y+8,1);ctx.restore()}requestAnimationFrame(overlay)}requestAnimationFrame(overlay);
})();