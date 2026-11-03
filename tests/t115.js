// Issue 136 (Magnus 3 nov, provspel ö 2547 kp13): GÄDDA's way keeps clear of Birka while she moves, is renewed when she has moved,
// and close in the boat gives way to her
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(){B.newGame(2547);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.enemies=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
const inBox=(p,m)=>{const L=B.shipLocal(p.x,p.y);return Math.abs(L.lat)<19+(m||0)&&Math.abs(L.fwd)<48+(m||0);};
function startHarbor(){const hr=G.relays.find(r=>r.type==='hamn');hr.captured=true;G.harbor.secured=true;G.harbor.go=true;
  run(400,()=>B.birkaMoving()&&G.harbor.ph&&G.harbor.v>3);}
// the sweep and the mask: moving Birka bars her coming poses, a resting one adds nothing
fresh();{ok(B.gaddaBirkaMask()===null&&B.birkaSweep().length===1,'Birka at rest: no extra bar, one pose');
  startHarbor();ok(B.birkaMoving(),'Birka is moving to the harbour');
  const sw=B.birkaSweep(),m=B.gaddaBirkaMask();ok(sw.length>3&&!!m,'her sweep has several poses ('+sw.length+') and a mask');
  const far=sw[sw.length-1];ok(m[B.cellIdx(far.x,far.y)]===1,'the pose she reaches in 30 s is barred');
  const C=B.CARRIER,q=sw[Math.min(3,sw.length-1)],f=Math.atan2(far.y-C.y,far.x-C.x);
  let a=null,b=null;for(const k of[1,-1]){const sx=q.x-Math.sin(f)*k*140,sy=q.y+Math.cos(f)*k*140,tx=q.x+Math.sin(f)*k*140,ty=q.y-Math.cos(f)*k*140;
    if(B.seaPass(B.cellIdx(sx,sy))&&B.seaPass(B.cellIdx(tx,ty))){a={x:sx,y:sy};b={x:tx,y:ty};break;}}
  if(a){const R=B.gaddaRoute(a.x,a.y,b.x,b.y,i=>B.seaPass(i)&&!m[i]);
    ok(!!R,'a way across her track is found round the sweep');
    let hit=0;if(R){let p0=a;for(const p of R){for(let t=0;t<=1;t+=.1){const x=p0.x+(p.x-p0.x)*t,y=p0.y+(p.y-p0.y)*t;if(m[B.cellIdx(x,y)])hit++;}p0=p;}}
    ok(hit===0,'and it crosses none of her barred cells ('+hit+')');}
  else ok(true,'(no open water across the track on this island: skipped)');}
// a boat's own way is renewed once she has moved 30 m, and keeps out of her hull
fresh();{startHarbor();const C=B.CARRIER;const sw=B.birkaSweep(),far=sw[sw.length-1];
  const f=Math.atan2(far.y-C.y,far.x-C.x);let sx=0,sy=0,tx=0,ty=0,found=false;
  for(const k of[1,-1]){sx=C.x-Math.sin(f)*k*130+Math.cos(f)*60;sy=C.y+Math.cos(f)*k*130+Math.sin(f)*60;tx=C.x+Math.sin(f)*k*130+Math.cos(f)*60;ty=C.y-Math.cos(f)*k*130+Math.sin(f)*60;
    if(B.seaPass(B.cellIdx(sx,sy))&&B.seaPass(B.cellIdx(tx,ty))){found=true;break;}}
  if(found){const u=put('gadda',sx,sy);u.heading=Math.atan2(ty-sy,tx-sx);B.gaddaGo(u,tx,ty,.05,8);const b0=u.pathB;ok(!!b0&&Math.hypot(b0.x-C.x,b0.y-C.y)<1,'the way remembers where Birka was when planned');
    let inside=0;
    for(let i=0;i<1200&&Math.hypot(tx-u.x,ty-u.y)>12;i++){B.step(.05);B.gaddaGo(u,tx,ty,.05,8);if(inBox(u))inside++;}
    ok(inside===0,'the boat never enters the hull box while she moves ('+inside+' steps)');
    ok(u.pathB&&(Math.hypot(u.pathB.x-b0.x,u.pathB.y-b0.y)>1||!B.birkaMoving()),'the way was renewed after she moved');}
  else ok(true,'(no crossing found: skipped)');}
// head-on: Birka dead ahead and closing, the boat sheers off or stops and does not enter the box
fresh();{const C=B.CARRIER;let c=null;
  for(const d of[170,150,200,230]){const q=B.shipPos(0,d);if(B.seaPass(B.cellIdx(q[0],q[1]))){c=q;break;}}
  if(c){const u=put('gadda',c[0],c[1]);u.heading=Math.atan2(C.y-c[1],C.x-c[0]);
    const tq=B.shipPos(0,-300),tx=tq[0],ty=tq[1];
    let yielded=0,inside=0,minD=1e9;
    for(let i=0;i<500;i++){const k=Math.cos(C.a),n=Math.sin(C.a);B.moveCarrier(C.x+k*.12,C.y+n*.12,C.a);B.step(.05);B.gaddaGo(u,tx,ty,.05,8);
      if(B.gaddaYield(u,tx,ty)>0)yielded++;if(inBox(u))inside++;
      const L=B.shipLocal(u.x,u.y);minD=Math.min(minD,Math.hypot(Math.max(Math.abs(L.lat)-19,0),Math.max(Math.abs(L.fwd)-48,0)));}
    ok(yielded>0,'with Birka ahead and closing the boat gives way ('+yielded+' steps)');
    ok(inside===0,'and does not get into the hull box ('+inside+' steps, closest '+minD.toFixed(1)+' m)');}
  else ok(true,'(no open water ahead of Birka: skipped)');}
console.log(fail?'FAILED':'ALL OK');process.exit(fail?1:0);
