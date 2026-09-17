/* Screen-space visibility wins over map-edge framing. Coordinates use sprite feet. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function frame({x,y,camera,worldWidth,worldHeight,viewWidth,viewHeight=540,width,height,top=76,mounted=false,dt=0,snap=false}) {
    // Canvas uses object-fit:cover; account for any cropped intrinsic pixels.
    const scale=Math.max(width/viewWidth,height/viewHeight);
    const cropX=(viewWidth*scale-width)/2,cropY=(viewHeight*scale-height)/2;
    const head=mounted?88:66,margin=12;
    const left=(width*.44+cropX)/scale,right=(width*.56+cropX)/scale;
    const bottom=(height-18+cropY)/scale;
    const upper=Math.min(bottom, (top+margin+cropY)/scale+head);
    const lower=Math.max(upper,Math.min(bottom,(height*.73+cropY)/scale));
    const anchorY=clamp((height*.64+cropY)/scale,upper,lower);
    let tx=x-(left+right)/2,ty=y-anchorY;
    const minX=Math.min(0,(worldWidth-viewWidth)/2);
    tx=clamp(tx,minX,Math.max(minX,worldWidth-viewWidth));
    ty=clamp(ty,0,Math.max(0,worldHeight-viewHeight));
    const ease=snap?1:1-Math.exp(-9*Math.max(0,dt));
    const cx=camera.x+(tx-camera.x)*ease,cy=camera.y+(ty-camera.y)*ease;
    // The hard guard includes the full head-to-feet sprite, not just its origin.
    return {x:clamp(cx,x-right,x-left),y:clamp(cy,y-lower,y-upper),safe:{left,right,top:upper,bottom:lower},scale};
  }
  window.EVERLIGHT_CAMERA=Object.freeze({frame});
})();
