(() => {
  'use strict';
  // An authored episode: knowledge opens the door; fighting alone cannot tell the story.
  const rooms = {
    memory_hall: {name:'The House That Forgot',subtitle:'Someone set the table for you.',type:'memory',width:1200,height:880,spawn:{x:600,y:745},tint:'#17292b'},
    memory_workshop: {name:'Alden’s Workshop',subtitle:'A tune remembered by hands, not machines.',type:'memory',width:1200,height:880,spawn:{x:600,y:745},tint:'#16292f'},
    memory_heart: {name:'The Unwritten Hearth',subtitle:'Break the three tethers. Bring someone home.',type:'memory',width:1200,height:880,spawn:{x:600,y:745},tint:'#17212c'}
  };
  const clues = {
    boots:{name:'Two pairs of boots',zone:'memory_hall',x:285,y:650,symbol:'RAIN',text:'A small pair faces the door. A larger pair faces inward. Mud on both soles, though it has not rained in Northford for weeks. Under the mat: “First, let the RAIN come in.”',voice:'Mira: “He always came home soaked. Said umbrellas made the rain feel unwelcome.”'},
    table:{name:'A place left for you',zone:'memory_hall',x:875,y:480,symbol:'BREAD',text:'Three cups. Two names scratched beneath them: MIRA and ALDEN. The third is in your handwriting: “Then share the BREAD.” You cannot remember carving it.',voice:'Mira: “Everyone says I grew up alone. Then why do I always lay out two plates?”'},
    portrait:{name:'The unfinished portrait',zone:'memory_hall',x:295,y:280,symbol:'EMBER',text:'The paint has forgotten a face, but not the hand resting on Mira’s shoulder. The frame reads: “Last, keep an EMBER for whoever is still outside.” Behind it: a key-shaped stitch in the rug.',voice:'Mira: “Alden. His name was Alden. Please don’t let me lose it again.”'}
  };
  const order=['rain','bread','ember'];
  const button=(action,label)=>`<button data-hearth="${action}">${label}</button>`;
  const card=(tag,title,text,actions='')=>`<article class="hearth-card"><span class="choice-tag">${tag}</span><h3>${title}</h3><p>${text}</p>${actions}</article>`;
  function init(S) {
    const h=S.hearth||{};
    S.hearth={version:1,stage:Math.max(0,Math.min(5,Math.floor(Number(h.stage)||0))),clues:[...new Set((h.clues||[]).filter(id=>clues[id]))],notes:h.notes||[],sequence:(h.sequence||[]).filter(id=>order.includes(id)).slice(0,2),anchors:[...new Set((h.anchors||[]).filter(id=>['west','east','north'].includes(id)))],promise:h.promise==='truth'?'truth':'home',choice:['home','road'].includes(h.choice)?h.choice:null,cache:!!h.cache,offered:!!h.offered,returnTo:h.returnTo||null,level:Math.max(2,Math.min(8,Number(h.level)||S.level||2))};
    return S.hearth;
  }
  const inside=S=>!!rooms[S.zone];
  const solidMap={
    memory_hall:[[165,190,250,50],[170,365,195,140],[800,385,210,70],[880,570,165,100],[430,190,340,38]],
    memory_workshop:[[165,205,220,75],[815,205,220,75],[170,515,155,135],[875,515,155,135]],
    memory_heart:[[160,185,155,95],[885,185,155,95],[170,620,115,100],[915,620,115,100]]
  };
  function objects(S) {
    const h=S.hearth;
    if(!inside(S))return S.zone==='northford'?[{id:'hearth:invitation',kind:'hearth',name:h.stage===5?'Alden’s Lantern':'A letter in your handwriting',x:1070,y:625,label:'Read',hearth:'invitation'}]:[];
    const obj=(id,name,x,y,label='Inspect',extra={})=>({id:`hearth:${id}`,hearth:id,kind:'hearth',name,x,y,label,...extra});
    const out=[obj('leave','Return to your road',600,800,'Leave')];
    if(S.zone==='memory_hall') {
      out.push(...Object.entries(clues).map(([id,c])=>obj(id,c.name,c.x,c.y)),obj('mira','Mira',650,640,'Talk',{actor:true}),obj('workshop','Workshop door',600,260,'Enter',{doorArt:true}));
      if(h.clues.length===3)out.push(obj('stitch',h.cache?'An empty hiding place':'A key-shaped stitch',470,490,'Search'));
      if(h.stage===5)out.push(obj('alden','Alden',720,500,'Talk',{actor:true}),obj('rest','The lit hearth',610,340,'Rest'));
    }
    if(S.zone==='memory_workshop')out.push(obj('hall','Return to the hall',600,755,'Enter',{doorArt:true}),...order.map((id,i)=>obj(id,`${id.toUpperCase()} chime`,360+i*240,425,'Ring')),obj('score','Alden’s unfinished song',600,630),obj('heart','The sealed hearth door',600,235,'Enter',{doorArt:true}));
    if(S.zone==='memory_heart') {
      out.push(obj('workshop','Return to workshop',600,755,'Enter',{doorArt:true}));
      if(h.stage===3)out.push(obj('west','West tether',330,450,'Sever'),obj('east','East tether',870,450,'Sever'),obj('north','North tether',600,290,'Sever'));
      if(h.stage>=4)out.push(obj('alden','Alden · Remembered',600,410,'Talk',{actor:true}));
    }
    return out;
  }
  function objective(S) {
    const h=S.hearth;
    if(!inside(S))return null;
    if(h.stage===1)return ['Who is missing from this house?',`Find the three household memories · ${h.clues.length}/3`];
    if(h.stage===2)return ['A tune for someone lost','Ring the workshop chimes in the order the house remembers'];
    if(h.stage===3)return ['The Collector of Names',`${h.anchors.length}/3 tethers severed · Dodge the marked circles, then counter`];
    if(h.stage===4)return ['Someone, not something','Speak to Alden at the freed hearth'];
    return ['A light worth coming home to',h.choice==='home'?'Alden has opened a refuge · Visit the hall':'Alden’s lantern travels with you · Return to your road'];
  }
  function target(S,all) {
    if(!inside(S))return null;
    const h=S.hearth;
    let id='leave';
    if(h.stage===1)id=S.zone==='memory_hall'?Object.keys(clues).find(id=>!h.clues.includes(id)):'hall';
    if(h.stage===2)id=S.zone==='memory_hall'?'workshop':S.zone==='memory_workshop'?'score':'workshop';
    if(h.stage===3)id=S.zone==='memory_hall'?'workshop':S.zone==='memory_workshop'?'heart':['west','east','north'].find(id=>!h.anchors.includes(id));
    if(h.stage===4)id=S.zone==='memory_hall'?'workshop':S.zone==='memory_workshop'?'heart':'alden';
    return all.find(o=>o.hearth===id)||null;
  }
  function invitation(S) {
    return card('A personal mystery · available now','The House That Forgot You','A letter has appeared in your pack. The handwriting is yours. You have never seen it before.<br><br><em>“If she forgets me, show her the house. Don’t bring a weapon for the door. Bring a reason to open it.”</em><br><br>Mira turns the paper over. “Why do I know this handwriting?”',button('promise:home','“We bring them home.”')+button('promise:truth','“We find out what happened.”'))+'<p class="hearth-note">A self-contained investigation with exploration, a chime puzzle, a boss and a lasting reward. You can leave and resume at any time. Your current quests stay intact.</p>';
  }
  function panel(S,id) {
    const h=S.hearth;
    if(id==='invitation')return {title:'A letter that should not exist',html:h.stage?journal(S):invitation(S)};
    if(clues[id])return {title:clues[id].name,html:card('A memory, not a quest token',clues[id].symbol,clues[id].text,button(`remember:${id}`,h.clues.includes(id)?'Read the memory again':'Hold on to this memory'))};
    if(id==='mira')return {title:'Mira',html:card('Someone to come back for','“I keep setting a second place.”',h.stage===5?'“This morning I remembered an argument we had. A stupid, ordinary argument. I have never been so glad to be cross with someone.”':h.clues.length===3?'“He made a tune for rainy days. Rain at the door. Bread on the table. An ember left burning. Try the chimes in his workshop.”':'“There is a shape where someone should be. I thought if I never looked at it, it would stop hurting.” She takes your hand. “Look with me.”')};
    if(id==='score')return {title:'The unfinished song',html:card('Observation opens the way','Not a lock. A welcome.','Three chimes: RAIN, BREAD, EMBER. The household inscriptions tell you which came first. Walk to each chime and tap Ring. A wrong note clears the tune; nothing is consumed.')+h.clues.map(id=>card('Remembered clue',clues[id].name,clues[id].text)).join('')+`<p>Notes played: ${h.sequence.length?h.sequence.join(' → '):'none'}</p>`};
    if(id==='alden'&&h.stage===4)return {title:'Alden',html:card('The person behind the mystery','“You came back.”','“I was the keeper who refused the toll. The Ways wanted another memory every time someone passed. So I gave them my own name. It kept people safe. It made me impossible to find.”<br><br>Mira kneels beside him. “You absolute idiot. You could have asked me.”<br><br>He laughs. She remembers that first.<br><br>He turns to you. “You carried my last letter. The Collector followed the memory of that road, so you asked me to hide it. You wrote yourself a way back before I did. That third cup was yours.”'+(h.promise==='home'?'<br><br>You promised to bring him home. Now there is a home again.':'<br><br>You wanted the truth. It was not a hidden villain. It was someone trying to bear the cost alone.'))+card('A lasting choice · both save Alden','Where should this light live?','Keep the lantern here and Alden opens a refuge: safe resting and a restorative pulse when you earn a Resonant Dodge. Carry it and his echo fights beside you. You can change its home by speaking to him later.',button('resolve:home','Make the house a refuge · Dodge heals 4 HP')+button('resolve:road','Carry the lantern · Companion attacks'))};
    if(id==='alden'&&h.stage===5)return {title:'Alden · Lantern Keeper',html:card('A life continuing after the reward','“Mira burned breakfast. We ate it anyway.”',h.choice==='home'?'Travelers have started leaving their boots by the door. There is always another cup. Your Resonant Dodge restores 4 HP as well as aether.':'“Let the lantern see the world for me today.” Its echo fights beside you outside safe towns. You can always bring it home.',button(`attune:${h.choice==='home'?'road':'home'}`,h.choice==='home'?'Carry the lantern instead':'Leave the lantern at the refuge'))};
    return {title:'The remembered house',html:journal(S)};
  }
  function action(S,a,hooks) {
    const h=S.hearth,[verb,id]=a.split(':');
    if(verb==='promise'&&h.stage===0&&['home','truth'].includes(id)){h.promise=id;h.stage=1;h.offered=true;h.level=Math.max(2,Math.min(8,S.level));hooks.begin();hooks.save();return true;}
    if(a==='resume'&&h.stage>0){hooks.begin();return true;}
    if(a==='offer'){hooks.panel('A letter that should not exist',invitation(S));return true;}
    if(!inside(S))return false;
    if(a==='leave'){hooks.leave();return true;}
    if(a==='hall'){hooks.travel('memory_hall');return true;}
    if(a==='workshop'){hooks.travel('memory_workshop');return true;}
    if(a==='heart'){if(h.stage<3)hooks.toast('The door listens. Find the three household clues, then play their tune.');else hooks.travel('memory_heart');return true;}
    if(verb==='remember'&&clues[id]&&clues[id].zone===S.zone){if(!h.clues.includes(id)){h.clues.push(id);if(h.clues.length===3)h.stage=Math.max(h.stage,2);hooks.save();}hooks.close();hooks.voice(clues[id].voice);return true;}
    if(order.includes(a)&&S.zone==='memory_workshop'){
      if(h.stage<2){hooks.toast('Something is missing. Read all three memories in the hall first.');return true;}
      if(h.stage>2){hooks.toast('The door remembers. The hearth is open.');return true;}
      if(order[h.sequence.length]!==a){h.sequence=[];hooks.toast('A wrong note. Listen again: rain at the door, bread shared, an ember kept.');}
      else {h.sequence.push(a);hooks.note(order.indexOf(a));if(h.sequence.length===3){h.sequence=[];h.stage=3;hooks.voice('Mira: “That’s his song.” A door opens where there was only a wall.');hooks.success();}else hooks.toast(`${a.toUpperCase()} · ${h.sequence.length}/3 notes remembered`);}
      hooks.save();return true;
    }
    if(['west','east','north'].includes(a)&&S.zone==='memory_heart'&&h.stage===3){if(!h.anchors.includes(a)){h.anchors.push(a);hooks.anchor();hooks.save();hooks.toast(`${h.anchors.length}/3 tethers broken · The Collector weakens`);}else hooks.toast('This tether is already broken.');return true;}
    if(a==='stitch'&&S.zone==='memory_hall'&&h.clues.length===3){if(!h.cache){h.cache=true;hooks.reward({gold:45,item:'trail_helm'});hooks.save();hooks.voice('Under the rug: Alden’s traveling hood, and a note. “For the one who notices what everyone walks over.”');}else hooks.toast('You found what the portrait was pointing to.');return true;}
    if(verb==='resolve'&&h.stage===4&&['home','road'].includes(id)){h.choice=id;h.stage=5;hooks.reward({xp:220,gold:150});hooks.save();hooks.success();hooks.panel('A light worth coming home to',card('Episode complete · Permanent ability unlocked','Resonant Dodge','Dodge a nearby, telegraphed attack to restore 8 aether and ready a 35% stronger next strike or spell. One pulse every 4 seconds. Works with every build.'+(id==='home'?'<br><br>Your refuge also makes each pulse heal 4 HP. Alden and Mira now wait in the warm hall.':'<br><br>Alden’s lantern now fights beside you on dangerous roads. He and Mira can still be visited in the hall.'),button('hall','Go home with Mira')));return true;}
    if(verb==='attune'&&h.stage===5&&['home','road'].includes(id)){h.choice=id;hooks.save();hooks.close();hooks.toast(id==='home'?'The refuge’s light settles around you.':'Alden’s lantern answers.');return true;}
    if(a==='rest'&&h.stage===5){hooks.restore();hooks.toast('A warm meal. A safe bed. You are restored.');return true;}
    return false;
  }
  function journal(S) {
    const h=S.hearth;
    if(!h.stage)return card('New · A story about Mira','The House That Forgot You','A letter in your handwriting. A brother nobody remembers. Three places set at a table. Why is one of them yours?',button('offer','Read the letter'));
    const o=objective({...S,zone:'memory_hall'});
    return card(h.stage===5?'A changed corner of the world':'Your unfinished mystery',o[0],o[1],button('resume',h.stage===5?'Visit Alden and Mira':'Return to the remembered house'))+`<details class="hearth-notebook"><summary>Your evidence · ${h.clues.length}/3 memories</summary>${h.clues.map(id=>card(clues[id].symbol,clues[id].name,clues[id].text)).join('')}${h.stage>=4?'<p>The Ways consumed names. Alden offered his own to shelter other travelers. You broke the Collector’s hold.</p>':''}${h.stage===5?'<p>Resonant Dodge unlocked: +8 aether and +35% next strike or spell; 4-second cooldown. '+(h.choice==='home'?'Refuge: +4 HP per pulse.':'Traveling lantern: a companion on dangerous roads.')+'</p>':''}</details>`;
  }
  // Furniture silhouettes match the collision rectangles, leaving broad touch-friendly lanes.
  function drawWorld(c,S,time) {
    const warm=S.hearth.stage===5,heart=S.zone==='memory_heart',work=S.zone==='memory_workshop';
    c.save();c.fillStyle='#081317';c.fillRect(0,0,1200,880);
    for(let y=150;y<825;y+=32)for(let x=90;x<1110;x+=64){c.fillStyle=(x/64+y/32)%3<1?(warm?'#634b35':'#334447'):(warm?'#59412e':'#2a393c');c.fillRect(x+(y%64?0:4),y,61,29);}
    c.fillStyle=warm?'#493422':'#203237';c.fillRect(90,90,1020,95);c.fillRect(90,185,28,640);c.fillRect(1082,185,28,640);
    c.fillStyle='#b69558';c.fillRect(90,177,1020,5);c.fillRect(114,185,4,640);c.fillRect(1082,185,4,640);
    for(let x=195;x<1090;x+=245){c.fillStyle='#0b1e27';c.fillRect(x,100,70,60);c.fillStyle=warm?'#edcc7e':'#4c939b';c.fillRect(x+8,108,23,40);c.fillRect(x+38,108,23,40);c.fillStyle='#162c32';c.fillRect(x+32,100,5,62);}
    c.fillStyle=warm?'#774640':'#254c55';c.fillRect(445,380,310,335);c.strokeStyle='#c8aa6e';c.lineWidth=4;c.strokeRect(455,390,290,315);
    for(let y=405;y<700;y+=28){c.fillStyle='#b29b6355';c.fillRect(466,y,9,9);c.fillRect(726,y,9,9);}
    for(const [x,y,w,h]of solidMap[S.zone]){c.fillStyle='#09151288';c.fillRect(x+8,y+12,w,h);c.fillStyle='#594938';c.fillRect(x,y,w,h);c.fillStyle='#8e7150';c.fillRect(x,y,w,8);c.fillStyle='#283b38';c.fillRect(x+7,y+16,w-14,h-25);for(let i=10;i<w-12;i+=22){c.fillStyle=i%3?'#94714c':'#6e9287';c.fillRect(x+i,y+24,12,Math.min(30,h-30));}}
    if(!work&&!heart){c.fillStyle='#ac8455';c.fillRect(800,385,210,70);for(let i=0;i<3;i++){c.fillStyle='#d9d1ad';c.beginPath();c.ellipse(835+i*63,417,15,8,0,0,7);c.fill();}c.fillStyle='#1c282b';c.fillRect(239,211,80,78);c.strokeStyle='#d3b36f';c.strokeRect(239,211,80,78);c.fillStyle=warm?'#b5976c':'#314649';c.fillRect(267,227,27,38);}
    if(heart){c.strokeStyle='#719da5';c.lineWidth=3;c.beginPath();c.ellipse(600,470,230,155,0,0,7);c.stroke();}
    const flicker=S.settings.reducedMotion?0:Math.sin(time/260)*3;
    for(const x of[140,1060])for(const y of[325,580]){c.fillStyle='#967348';c.fillRect(x-4,y,8,26);c.fillStyle=warm?'#ffe29b':'#88ddd3';c.shadowColor=c.fillStyle;c.shadowBlur=18;c.fillRect(x-6,y-12-flicker,12,19);c.shadowBlur=0;}
    c.fillStyle='#e2d2a6';c.font='16px Georgia';c.textAlign='center';c.fillText(rooms[S.zone].name,600,137);c.restore();
  }
  function drawObject(c,o,S,time) {
    const used=S.hearth.clues.includes(o.hearth)||S.hearth.anchors.includes(o.hearth);
    c.save();c.translate(o.x,o.y);c.fillStyle='#08151288';c.beginPath();c.ellipse(0,9,24,9,0,0,7);c.fill();
    if(order.includes(o.hearth)){c.fillStyle='#a58758';c.fillRect(-25,-67,50,5);c.fillRect(-25,-67,5,73);c.fillRect(20,-67,5,73);c.fillStyle=['#80d5e2','#e6bf80','#ed9075'][order.indexOf(o.hearth)];c.fillRect(-9,-49,18,42);c.fillStyle='#fce3a3';c.fillRect(-11,-47,22,5);}
    else if(['west','east','north'].includes(o.hearth)){c.strokeStyle=used?'#48645f':'#ce809a';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(600-o.x,470-o.y);c.stroke();c.fillStyle=used?'#48645f':'#f2a6c5';c.beginPath();c.moveTo(0,-48);c.lineTo(18,-18);c.lineTo(0,8);c.lineTo(-18,-18);c.closePath();c.fill();}
    else if(o.hearth==='boots'){c.fillStyle='#b88b58';c.fillRect(-18,-22,11,27);c.fillRect(-18,-4,17,10);c.fillRect(5,-15,9,19);c.fillRect(5,-3,14,9);}
    else if(o.hearth==='leave'){c.strokeStyle='#91b8b0';c.lineWidth=3;c.strokeRect(-34,-21,68,32);c.fillStyle='#fff0b7';c.font='25px Georgia';c.textAlign='center';c.fillText('↓',0,5);}
    else {c.fillStyle=used?'#719b8d':'#f7d18a';c.fillRect(-12,-24,24,24);c.fillStyle='#34493f';c.fillRect(-7,-18,14,3);c.fillRect(-7,-11,10,3);}
    c.fillStyle=used?'#a8c2b6':'#ffe7ae';c.font='bold 13px system-ui';c.textAlign='center';c.strokeStyle='#061310';c.lineWidth=4;c.strokeText(o.name,0,-82);c.fillText(o.name,0,-82);c.restore();
  }
  const walls=[[0,0,1200,185],[0,185,118,695],[1082,185,118,695],[0,825,1200,55]];
  window.EVERLIGHT_HEARTH={rooms,clues,init,inside,solids:S=>inside(S)?[...walls,...solidMap[S.zone]]:[],objects,objective,target,panel,action,journal,invitation,drawWorld,drawObject};
})();
