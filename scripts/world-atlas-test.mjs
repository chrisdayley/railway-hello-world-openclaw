import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('js/world-atlas-v22.js','utf8');
const context={window:{}};vm.runInNewContext(source,context);
const atlas=context.window.EVERLIGHT_ATLAS;
assert(atlas,'atlas must be exposed');
assert.equal(atlas.version,22);
assert.equal(atlas.regions.length,12);
assert.equal(atlas.areas.length,288);
assert.equal(new Set(atlas.areas.map(a=>a.id)).size,288,'area IDs must be unique');
assert(atlas.areas.every(a=>a.secretCount>=1),'every area needs a hidden treasure');
assert(atlas.areas.filter(a=>a.propertyAvailable).length>=70,'the world needs abundant properties');
assert(atlas.areas.filter(a=>a.kind==='dungeon').length>=30,'the world needs many dungeons');
for(const area of atlas.areas){
  for(const [direction,target] of Object.entries(area.exits)){
    assert(atlas.byId[target],`${area.id} has missing ${direction} exit ${target}`);
  }
}
for(const region of atlas.regions)assert.equal(region.areas.length,24,`${region.id} must have 24 areas`);
console.log(`Everlight atlas passed: ${atlas.areas.length} areas, ${atlas.areas.reduce((n,a)=>n+a.secretCount,0)} secrets, ${atlas.areas.filter(a=>a.propertyAvailable).length} properties.`);
