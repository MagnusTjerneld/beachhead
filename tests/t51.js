global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;/* the old start, so results compare */
for(const seed of [7341,1234,9001,31,77,2718]){
  B.newGame(seed);const G=B.G;G.running=true;G.res=5000;for(const b of G.barriers){b.cleared=true;for(const c of b.cells)B.W.grid[c]=B.W.baseGrid[c];}B.computeLock();// the defence planner may put a point behind a barrier; this test is about the yard and the counterattack
  const types=G.relays.map(r=>r.id+':'+r.type).join(' ');
  const out=[types];
  for(const r of G.relays){
    if(r.type==='verkstad'){for(const e of G.enemies)if(Math.hypot(e.x-r.x,e.y-r.y)<450){e.dead=true;}B.capturePoint(r,null);const d=G.units.find(u=>u.kind==='drone');d.x=r.x+250;d.y=r.y;d.fuel=20;d.orders=[{type:'move',x:r.x+400,y:r.y,post:'def'}];
      let at=null;for(let i=0;i<20*40;i++){B.step(.05);if(!at&&Math.hypot(d.x-r.x,d.y-r.y)<22)at=Math.round(G.time);}out.push('verkstad: drone reached '+(at!=null?'yes':'NO')+' fuel '+Math.round(d.fuel)+'/'+d.maxFuel+' dead '+d.dead+' state '+d.state);}
    if(r.type==='radar'){const n0=G.enemies.filter(e=>e.seen).length;B.capturePoint(r,null);for(let i=0;i<10;i++)B.step(.05);const n1=G.enemies.filter(e=>e.seen).length;let kn=0;for(const v of G.known)kn+=v;out.push('radar: seen '+n0+' -> '+n1);}
    if(r.type==='varv'){for(const e of G.enemies)if(Math.hypot(e.x-r.x,e.y-r.y)<160)e.dead=true;B.capturePoint(r,null);const marching=G.enemies.filter(e=>e.march).map(e=>e.id+'@'+Math.round(Math.hypot(e.x-r.x,e.y-r.y)));
      G.fbuild.push({kind:'tank',t:1,total:1,at:r.id});const n0=G.units.length;let paused=0;for(let i=0;i<20*120;i++){B.step(.05);if(G.fbuild[0]&&G.fbuild[0].paused)paused++;}
      const near=G.enemies.filter(e=>!e.dead&&Math.hypot(e.x-r.x,e.y-r.y)<60).map(e=>e.id);
      out.push('varv: marching '+marching.join(',')+' | built '+(G.units.length-n0)+' paused steps '+paused+' | enemies at yard after 120s: '+near.join(','));}
  }
  const c=G.relays.find(r=>r.type==='central');B.capturePoint(c,null);out.push('central -> over '+G.over);
  console.log(seed,out.join('\n   '));
}
