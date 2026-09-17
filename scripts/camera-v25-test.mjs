import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../js/camera-v25.js',import.meta.url),'utf8'),context);
const {frame}=context.window.EVERLIGHT_CAMERA;
let count=0;
for(const [width,height] of [[844,390],[667,320],[852,393],[1280,590],[1024,768],[568,280],[1500,320]]){
  const viewWidth=Math.max(960,Math.min(1720,Math.round(540*width/height)));
  for(const [worldWidth,worldHeight] of [[1672,941],[960,720],[1800,1100]])for(const [x,y] of [[35,70],[worldWidth-35,70],[35,worldHeight-35],[worldWidth-35,worldHeight-35],[worldWidth/2,worldHeight/2]])for(const top of [76,116,172])for(const mounted of [false,true])for(const dt of [0,1/60,.1]){
    const r=frame({x,y,camera:{x:9999,y:-9999},worldWidth,worldHeight,viewWidth,width,height,top,mounted,dt});
    const cropX=(viewWidth*r.scale-width)/2,cropY=(540*r.scale-height)/2;
    const sx=(x-r.x)*r.scale-cropX,feet=(y-r.y)*r.scale-cropY,head=feet-(mounted?88:66)*r.scale;
    assert(sx>=width*.44-.01&&sx<=width*.56+.01,'hero must stay in central corridor away from touch controls');
    assert(head>=top+11.99,`entire sprite must clear top UI at ${width}x${height}, got ${head} versus ${top}`);
    assert(feet<=height-17.99,'feet must remain onscreen even at south boundary');
    count++;
  }
}
console.log(`✓ ${count} camera boundary/viewport/mount/fast-movement cases keep the full hero visible`);
