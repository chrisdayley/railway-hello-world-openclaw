import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
const context = vm.createContext({ window, console, Math, Object, Array, String, Number, RegExp });

for (const relative of ['js/world-atlas-v22.js', 'js/exploration-v24.js', 'js/interiors-v27.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), 'utf8'), context, { filename:relative });
}

const atlas = window.EVERLIGHT_ATLAS;
const exploration = window.EVERLIGHT_EXPLORATION;
const interiors = window.EVERLIGHT_INTERIORS;
class LoadedImage {
  constructor(){this.naturalWidth=1254;this.naturalHeight=1254;this.width=1254;this.height=1254;}
  set src(value){this._src=value;this.onload?.();}
  get src(){return this._src;}
}
const spriteWindow={};
const spriteContext=vm.createContext({window:spriteWindow,Image:LoadedImage,console,Math,Object,Array,String,Number,RegExp});
vm.runInContext(fs.readFileSync(path.join(root,'js/interiors-v27.js'),'utf8'),spriteContext,{filename:'js/interiors-v27.js'});
const spriteInteriors=spriteWindow.EVERLIGHT_INTERIORS;
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

function makeContextSpy() {
  const calls = new Map();
  const drawImages=[];
  const count = method => calls.set(method, (calls.get(method) || 0) + 1);
  const gradient = { addColorStop(){ count('addColorStop'); } };
  const ctx = {
    calls,drawImages,
    save(){count('save');}, restore(){count('restore');},
    fillRect(){count('fillRect');}, strokeRect(){count('strokeRect');},
    beginPath(){count('beginPath');}, closePath(){count('closePath');},
    moveTo(){count('moveTo');}, lineTo(){count('lineTo');}, stroke(){count('stroke');}, fill(){count('fill');},
    arc(){count('arc');}, ellipse(){count('ellipse');}, translate(){count('translate');}, rotate(){count('rotate');},
    drawImage(...args){count('drawImage');drawImages.push(args);},
    createLinearGradient(){count('createLinearGradient');return gradient;},
    createRadialGradient(){count('createRadialGradient');return gradient;}
  };
  for (const property of ['fillStyle','strokeStyle','lineWidth','globalAlpha']) {
    Object.defineProperty(ctx, property, { set(){ count(`set:${property}`); }, configurable:true });
  }
  return ctx;
}

function collision(solids, x, y, radius = 13) {
  if (x-radius < 18 || y-radius < 155 || x+radius > 942 || y+radius > 685) return true;
  return solids.some(([rx,ry,rw,rh]) => x+radius>rx && x-radius<rx+rw && y+radius>ry && y-radius<ry+rh);
}

function reachable(solids, target, threshold) {
  const step=12, start={x:480,y:605};
  const key=(x,y)=>`${Math.round(x/step)},${Math.round(y/step)}`;
  const queue=[start], seen=new Set([key(start.x,start.y)]);
  while(queue.length){
    const point=queue.shift();
    if(Math.hypot(point.x-target.x,point.y-target.y)<=threshold)return true;
    for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
      const next={x:point.x+dx,y:point.y+dy}, id=key(next.x,next.y);
      if(!seen.has(id)&&!collision(solids,next.x,next.y)){seen.add(id);queue.push(next);}
    }
  }
  return false;
}

test('public API exposes ten complete deterministic room themes', () => {
  assert.equal(interiors.version, 27);
  assert.equal(interiors.width, 960);
  assert.equal(interiors.height, 720);
  assert.deepEqual([...interiors.themes], [
    'house','market','inn','smithy','apothecary','stable','workshop','warehouse','orchard','business'
  ]);
  assert(Object.isFrozen(interiors));
  assert(Object.isFrozen(interiors.themes));
  for(const theme of interiors.themes){
    const first=interiors.describe({theme,zoneId:`test:${theme}`,regionId:'greenwake'});
    const second=interiors.describe({theme,zoneId:`test:${theme}`,regionId:'greenwake'});
    assert.equal(first.theme,theme);
    assert.equal(first.width,960);assert.equal(first.height,720);
    assert.equal(first.signature,second.signature);
    assert.deepEqual(first.palette,second.palette);
    assert.equal(first.zones.length,4,`${theme} should have four purposeful work/living zones`);
    assert(first.pieces.length>=10,`${theme} should be richly furnished`);
    assert(first.pieces.filter(item=>item.solid).length>=5,`${theme} needs substantial collision-matched furniture`);
  }
});

test('every atlas home and developed land choice resolves to an intentional layout', () => {
  const settlementHomes=atlas.areas.filter(area=>area.kind==='settlement').flatMap(area=>
    exploration.homes(area).map(building=>({area,building}))
  );
  assert.equal(settlementHomes.length,168);
  const expectedByIndex=['market','house','inn','workshop','orchard','market','house'];
  for(const {area,building} of settlementHomes){
    const room=interiors.describe({zoneId:building.id,name:building.name,building,region:area});
    assert.equal(room.theme,expectedByIndex[building.index],`${building.id} should fit its authored purpose`);
    assert.equal(room.regionId,area.regionId);
    assert.equal(room.name,building.name);
  }
  for(const type of ['orchard','inn','smithy','apothecary','workshop','stable','warehouse']){
    assert.equal(interiors.describe({zoneId:'business@land:test',businessType:type}).theme,type);
  }
  assert.equal(interiors.describe({businessType:'farm'}).theme,'orchard');
  assert.equal(interiors.describe({businessType:'lodge'}).theme,'house');
  for(const type of ['mine','conservatory','ferry'])assert.equal(interiors.describe({businessType:type}).theme,'business');
  assert.equal(interiors.describe({zoneId:'bellkeeper',name:'Bellkeeper’s House'}).theme,'house');
});

test('regional palettes vary every interior without changing its collision contract', () => {
  assert.equal(atlas.regions.length,12);
  const accents=new Set(), signatures=new Set();
  const baseline=interiors.solids({theme:'house',zoneId:'same-room',region:atlas.regions[0]});
  for(const region of atlas.regions){
    const room=interiors.describe({theme:'house',zoneId:`home:${region.id}`,region});
    accents.add(room.palette.accent);signatures.add(room.signature);
    assert.deepEqual(interiors.solids({theme:'house',zoneId:`home:${region.id}`,region}),baseline);
  }
  assert.equal(accents.size,12,'each authored region palette should remain visible indoors');
  assert.equal(signatures.size,12,'regional rooms need stable distinct decorative signatures');
});

test('blocking geometry exactly matches solid furniture and is safely bounded', () => {
  for(const theme of interiors.themes){
    const room=interiors.describe(theme), geometry=interiors.solids(theme);
    assert.equal(
      JSON.stringify(geometry),
      JSON.stringify(room.pieces.filter(item=>item.solid).map(item=>[item.x,item.y,item.w,item.h]))
    );
    for(const [x,y,w,h] of geometry){
      assert(x>=18&&y>=155&&x+w<=942&&y+h<=685,`${theme} furniture must remain inside the playable room`);
      assert(w>0&&h>0);
    }
    const copy=interiors.solids(theme);copy[0][0]=-1000;
    assert.notEqual(interiors.solids(theme)[0][0],-1000,'callers must receive defensive collision arrays');
  }
});

test('every layout keeps door, resident, ledger, and keepsake interaction positions reachable', () => {
  const targets=[
    {name:'exit door',x:480,y:655,threshold:28},
    {name:'resident or manager',x:650,y:350,threshold:82},
    {name:'property ledger',x:300,y:530,threshold:82},
    {name:'traveler keepsake',x:285,y:220,threshold:82}
  ];
  for(const theme of interiors.themes){
    const geometry=interiors.solids(theme);
    assert(!collision(geometry,480,605),`${theme} spawn must be walkable`);
    for(const target of targets)assert(reachable(geometry,target,target.threshold),`${theme}: ${target.name} must be reachable`);
  }
});

test('all themes render dense code-native rooms with lighting and no filled triangle shortcuts', () => {
  const signatures=[],fallbackFillCounts=new Map();
  for(const theme of interiors.themes){
    const ctx=makeContextSpy(), room=interiors.draw(ctx,{theme,zoneId:`qa:${theme}`,region:atlas.regions[theme.length%atlas.regions.length]});
    assert.equal(room.theme,theme);
    assert((ctx.calls.get('fillRect')||0)>=60,`${theme} needs dense floor, architecture, and furnishing detail`);
    assert((ctx.calls.get('strokeRect')||0)>=10,`${theme} needs readable furniture edges`);
    assert((ctx.calls.get('createRadialGradient')||0)>=2,`${theme} needs local light pools`);
    assert((ctx.calls.get('arc')||0)+(ctx.calls.get('ellipse')||0)>=2,`${theme} needs organic decorative detail`);
    assert.equal(ctx.calls.get('closePath')||0,0,`${theme} should not rely on filled triangle silhouettes`);
    assert.equal(ctx.calls.get('save'),ctx.calls.get('restore'),'canvas state must remain balanced');
    fallbackFillCounts.set(theme,ctx.calls.get('fillRect')||0);
    signatures.push(`${theme}:${ctx.calls.get('fillRect')}:${ctx.calls.get('strokeRect')}:${ctx.calls.get('arc')||0}:${ctx.calls.get('ellipse')||0}`);
  }
  assert(new Set(signatures).size>=8,'themes should have materially different rendering profiles');

  assert.equal(spriteInteriors.spriteReady,true,'loaded local furniture art must activate without network dependencies');
  assert.equal(spriteInteriors.furnitureAsset,'./assets/interior-furniture-v27.png?v=27');
  const usedCells=new Set();let bedCall=null;
  for(const theme of spriteInteriors.themes){
    const ctx=makeContextSpy();
    spriteInteriors.draw(ctx,{theme,zoneId:`sprite:${theme}`,region:atlas.regions[theme.length%atlas.regions.length]});
    assert((ctx.calls.get('drawImage')||0)>=4,`${theme} should replace primary flat furniture with rich atlas art`);
    assert((ctx.calls.get('fillRect')||0)<fallbackFillCounts.get(theme),`${theme} must not paint flat fallback bases behind loaded sprites`);
    for(const args of ctx.drawImages){
      const column=Math.round(args[1]/313.5),row=Math.round(args[2]/313.5);
      usedCells.add(row*4+column);
      if(theme==='house'&&row===0&&column===0)bedCall=args;
    }
  }
  assert.deepEqual([...usedCells].sort((a,b)=>a-b),Array.from({length:16},(_,index)=>index),'the complete 4x4 row-major atlas must be mapped');
  assert(bedCall,'bed must use atlas cell zero');
  assert(Math.abs((bedCall[6]+bedCall[8])-(166+105))<.001,'sprite bottoms must anchor to furniture collision bottoms');
  assert(bedCall[8]>105,'sprite art should extend above, not squash into, its collision footprint');
});

let failures=0;
for(const {name,fn} of tests){
  try{fn();console.log(`✓ ${name}`);}catch(error){failures++;console.error(`✗ ${name}\n${error.stack}`);}
}
if(failures)throw new Error(`${failures} interior v27 test group${failures===1?'':'s'} failed`);
console.log(`✓ ${tests.length} interior v27 deterministic/reachability tests passed`);
