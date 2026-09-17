/* Authored footprints share the painted town's 1672 × 941 coordinate system. */
(() => {
  'use strict';
  const townDoors = [
    {id:'guildDoor',name:'Northford Guildhall',short:'Guildhall',icon:'⚑',x:411,y:279,target:'guildhall'},
    {id:'innDoor',name:'The Mooncup Inn',short:'Inn',icon:'☾',x:502,y:278,target:'inn'},
    {id:'apothecaryDoor',name:'Greenbottle Apothecary',short:'Remedies',icon:'✤',x:694,y:247,target:'apothecary'},
    {id:'smithyDoor',name:'Ember & Anvil',short:'Smithy',icon:'⚒',x:1195,y:290,target:'smithy'},
    {id:'cottageDoor',name:'Bellkeeper’s House',short:'Bellkeeper',icon:'♧',x:1329,y:579,target:'bellkeeper'},
    {id:'stableDoor',name:'Windstrider Stable',short:'Stable',icon:'♞',x:1435,y:622,target:'stable'},
    {id:'cisternDoor',name:'Old Lantern Cistern',short:'Cistern',icon:'◇',x:124,y:738,target:'cistern'}
  ].map(d=>({...d,kind:'portal',door:true,label:'Enter'}));
  const townSolids = [
    [[291,157],[345,50],[412,60],[445,139],[445,259],[417,261],[389,254],[303,227]],
    [[431,151],[496,61],[557,47],[603,156],[579,240],[540,267],[456,268]],
    [[587,107],[683,105],[735,118],[789,184],[761,250],[716,237],[685,226],[592,230]],
    [[980,181],[1100,111],[1164,85],[1201,126],[1278,157],[1337,207],[1319,290],[1240,280],[1170,268],[1126,265],[1034,248]],
    [[1270,489],[1336,434],[1382,425],[1440,494],[1413,562],[1375,586],[1303,562]],
    [[1388,532],[1440,480],[1495,488],[1539,474],[1584,543],[1578,632],[1504,665],[1451,636],[1420,605]],
    [[246,220],[321,197],[390,222],[394,282],[337,304],[271,272]],
    [[68,542],[110,518],[165,575],[157,662],[136,689],[104,682],[90,625]],
    [[288,631],[331,610],[351,660],[321,740],[287,714]]
  ];
  function pointInPolygon(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if(((a[1]>y)!==(b[1]>y))&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
  function intersects(x,y,r,p){if(pointInPolygon(x,y,p))return true;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));if(Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<r)return true;}return false;}
  const roomDefs = {
    bellkeeper:{name:'Bellkeeper’s House',subtitle:'A Promise in Copper',type:'room',width:960,height:720,spawn:{x:480,y:605},theme:'home'},
    cistern:{name:'Old Lantern Cistern',subtitle:'The Water Remembers',type:'room',width:1120,height:900,spawn:{x:560,y:775},theme:'dungeon'},
    sluice:{name:'The Moonlit Sluice',subtitle:'Below the Lantern Road',type:'room',width:1120,height:900,spawn:{x:560,y:775},theme:'dungeon'},
    vault:{name:'The Drowned Bell',subtitle:'The Keeper’s Last Watch',type:'room',width:1120,height:900,spawn:{x:560,y:775},theme:'dungeon'}
  };
  const roomSolids = {
    bellkeeper:[[60,155,220,120],[700,155,200,130],[70,400,170,90],[350,275,210,100]],
    cistern:[[70,270,280,200],[770,270,280,200],[460,440,200,180]],
    sluice:[[280,160,90,410],[750,160,90,410],[410,370,300,90]],
    vault:[[170,225,85,115],[865,225,85,115],[170,590,85,115],[865,590,85,115]]
  };
  function homes(area){if(area?.kind!=='settlement')return[];return [
    {x:360,y:365,role:'merchant',name:'Wayfarer Trading House'},
    {x:700,y:345,role:'resident',name:'Lantern House'},
    {x:1110,y:350,role:'rest',name:'The Roadside Hearth'},
    {x:1480,y:370,role:'resident',name:'Weaver’s Cottage'},
    {x:365,y:815,role:'resident',name:'Orchard House'},
    {x:850,y:855,role:'merchant',name:'Caravan Outfitters'},
    {x:1360,y:815,role:'resident',name:'Keeper’s Lodge'}
  ].map((b,i)=>({...b,id:`home@${area.id}@${i}`,index:i}));}
  function homeZone(id,atlas){const parts=id.split('@'),area=atlas?.get(parts[1]),building=homes(area)[Number(parts[2])];return building?{name:building.name,subtitle:area.name,type:'room',width:960,height:720,spawn:{x:480,y:605},theme:'home',parent:area.id,building}:null;}
  function drawHouse(ctx,b){ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='#03120d66';ctx.fillRect(-98,-75,213,89);ctx.fillStyle='#b5a379';ctx.fillRect(-90,-110,180,110);ctx.fillStyle='#716344';ctx.fillRect(-90,-10,180,10);ctx.fillStyle='#463624';for(const x of[-86,-30,29,82])ctx.fillRect(x,-108,7,105);ctx.fillRect(-90,-42,180,6);ctx.fillStyle='#172a2b';ctx.beginPath();ctx.moveTo(-109,-107);ctx.lineTo(-54,-172);ctx.lineTo(74,-172);ctx.lineTo(110,-107);ctx.closePath();ctx.fill();ctx.strokeStyle='#4b7070';ctx.lineWidth=3;for(let y=-159;y<-107;y+=12){ctx.beginPath();ctx.moveTo(-75-(y+159)*.6,y);ctx.lineTo(80+(y+159)*.4,y);ctx.stroke();}ctx.fillStyle='#2b2520';ctx.fillRect(-19,-49,38,49);ctx.fillStyle='#765335';ctx.fillRect(-15,-45,30,45);ctx.fillStyle='#e9c27b';ctx.fillRect(8,-24,3,3);for(const x of[-65,45]){ctx.fillStyle='#2c2c26';ctx.fillRect(x,-79,25,27);ctx.fillStyle='#efc776';ctx.fillRect(x+3,-76,19,21);ctx.fillStyle='#6b5132';ctx.fillRect(x+11,-76,3,22);ctx.fillRect(x+3,-67,19,3);}ctx.fillStyle='#c7ba94';ctx.fillRect(-28,0,56,7);ctx.restore();}
  function drawRoom(ctx,z,solids){const dungeon=z.theme==='dungeon';ctx.fillStyle=dungeon?'#111f27':'#181a16';ctx.fillRect(0,0,z.width,z.height);ctx.fillStyle=dungeon?'#38474c':'#66543a';ctx.fillRect(42,132,z.width-84,z.height-174);for(let y=140;y<z.height-42;y+=32)for(let x=46;x<z.width-42;x+=64){ctx.fillStyle=dungeon?((x+y)%3?'#35444a':'#3d4e53'):((x+y)%3?'#726043':'#68563c');ctx.fillRect(x+(y%64?0:12),y,60,29);}ctx.fillStyle=dungeon?'#273b43':'#463427';ctx.fillRect(42,92,z.width-84,66);ctx.fillRect(22,92,32,z.height-116);ctx.fillRect(z.width-54,92,32,z.height-116);ctx.fillRect(22,z.height-42,z.width-44,24);ctx.strokeStyle=dungeon?'#6b8484':'#927654';ctx.lineWidth=3;ctx.strokeRect(40,132,z.width-80,z.height-170);ctx.fillStyle=dungeon?'#506a70':'#998262';ctx.fillRect(z.width/2-42,z.height-60,84,28);
    if(dungeon){
      for(const x of[60,z.width-92]){ctx.fillStyle='#102e36';ctx.fillRect(x,165,32,z.height-230);ctx.strokeStyle='#63b1ad66';ctx.lineWidth=2;for(let y=175;y<z.height-90;y+=31){ctx.beginPath();ctx.moveTo(x+5,y);ctx.lineTo(x+24,y+3);ctx.stroke();}}
      ctx.save();ctx.translate(z.width/2,z.height*.62);ctx.strokeStyle='#a5ae8355';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,74,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,57,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.fillStyle='#a5ae8366';ctx.fillRect(-3,-68,6,16);ctx.restore();}ctx.restore();
      for(let i=0;i<27;i++){const x=100+(i*179)%(z.width-200),y=180+(i*113)%(z.height-270);ctx.strokeStyle='#182f3477';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7,y+4);ctx.lineTo(x+4,y+13);ctx.lineTo(x+16,y+18);ctx.stroke();}
    }
    if(!dungeon){ctx.fillStyle='#743c39';ctx.fillRect(z.width/2-120,435,240,130);ctx.strokeStyle='#d2a965';ctx.strokeRect(z.width/2-108,446,216,108);ctx.fillStyle='#213530';ctx.fillRect(90,96,96,47);ctx.fillStyle='#eacd87';ctx.fillRect(99,102,78,35);ctx.fillStyle='#3c5149';ctx.fillRect(136,99,6,44);ctx.fillRect(95,118,88,5);}
    for(const [x,y,w,h] of solids){ctx.fillStyle='#0005';ctx.fillRect(x+7,y+8,w,h);ctx.fillStyle=dungeon?'#52676b':'#34251c';ctx.fillRect(x,y,w,h);ctx.fillStyle=dungeon?'#788c88':'#92714a';ctx.fillRect(x+3,y+3,w-6,8);if(dungeon){ctx.strokeStyle='#2a4147';for(let by=y+22;by<y+h;by+=25){ctx.beginPath();ctx.moveTo(x,by);ctx.lineTo(x+w,by);ctx.stroke();}}else{ctx.fillStyle='#725537';ctx.fillRect(x+7,y+14,w-14,h-21);for(let bx=x+15;bx<x+w-12;bx+=27){ctx.fillStyle=['#ac5a49','#598476','#cba668'][Math.floor(bx)%3];ctx.fillRect(bx,y+21,17,24);}ctx.fillStyle='#d3bb80';ctx.fillRect(x+w/2-6,y+h-17,12,4);}}
    for(const x of[87,z.width-87])for(const y of[196,z.height-145]){const g=ctx.createRadialGradient(x,y,2,x,y,90);g.addColorStop(0,dungeon?'#7debd440':'#ffc97840');g.addColorStop(1,'#ffc97800');ctx.fillStyle=g;ctx.fillRect(x-90,y-90,180,180);ctx.fillStyle='#b49355';ctx.fillRect(x-4,y-8,8,22);ctx.fillStyle=dungeon?'#abffe0':'#ffe3a1';ctx.fillRect(x-5,y-12,10,9);}
  }
  window.EVERLIGHT_EXPLORATION={townDoors,townSolids,roomDefs,roomSolids,homes,homeZone,intersects,drawHouse,drawRoom};
})();
