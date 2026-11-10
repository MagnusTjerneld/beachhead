// Issue 170. GÄDDA och Birka mot kustartilleriet (kodgenomgången 10 nov): GÄDDA behåller sin orderkö när hon skickas hem (goRtb ->
// gaddaHome); kustartilleriet räknas som hot i GÄDDA:s hotlista (gaddaExposed, som de andra tre); strandmenyns Till hamnen vägras som
// harborGo när farleden är stängd; och reträttmeddelandet i engageHold nämner det ställe enheten faktiskt åker till.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
B.KUST_ISLE.on=1;let seed=0;for(let s=1000;s<1100&&!seed;s++){B.newGame(s);if(B.G.kustIsle)seed=s;}
ok(!!seed,'an island with a coast battery: ö '+seed);
const water=(x0,y0,r0,r1)=>{for(let r=r0;r<r1;r+=10)for(let a=0;a<6.28;a+=.1){const x=x0+Math.cos(a)*r,y=y0+Math.sin(a)*r;if(B.seaPass(B.cellIdx(x,y)))return{x,y};}return null;};
/* ---- the queue survives "Till service" ---- */
B.newGame(9052);{const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;
  const C=B.CARRIER,p=water(C.x,C.y,100,300),q1=water(C.x,C.y,320,400),q2=water(C.x,C.y,420,520);
  const u=B.makeUnit('gadda',p.x,p.y);G.units.push(u);
  u.orders=[{type:'move',x:q1.x,y:q1.y,post:'off'},{type:'move',x:q2.x,y:q2.y,post:'off'}];
  B.goRtb(u,'Till service.');
  ok(u.orders.length===3&&u.orders[0].type==='rtb'&&u.orders[1].type==='move'&&u.orders[2].type==='move','goRtb gives GÄDDA a home order in front of her queue ('+u.orders.map(o=>o.type).join(',')+')');
  ok(u.rtb===true,'and she is on her way home');
  run(900,()=>!u.rtb);
  ok(!u.rtb&&u.orders.length>=1&&u.orders[0].type==='move','back at Birka she goes on with the queue, not an empty one ('+u.orders.map(o=>o.type).join(',')+', '+u.state+')');
  ok(!(u.saved&&u.saved.length),'and nothing is left in u.saved');}
/* ---- the coast artillery is on GÄDDA's list ---- */
B.newGame(seed);{const G=B.G;G.running=true;G.netAll=true;
  const e=G.enemies.find(q=>q.kind==='kust');e.seen=true;e.lx=e.x;e.ly=e.y;
  ok(!e.canGround&&!e.range&&e.seaRange>0,'the battery shoots only over the sea: range '+e.range+', seaRange '+e.seaRange);
  const near=water(e.x,e.y,60,e.seaRange-30),far=water(e.x,e.y,e.seaRange+B.GADDA.threat+100,e.seaRange+B.GADDA.threat+500);
  if(near){const u=B.makeUnit('gadda',near.x,near.y);ok(B.gaddaExposed(u)===true,'a boat '+Math.round(Math.hypot(near.x-e.x,near.y-e.y))+' m from it is exposed (seaRange '+e.seaRange+')');}else ok(false,'water inside its reach');
  if(far){const u=B.makeUnit('gadda',far.x,far.y);ok(B.gaddaExposed(u)===false,'a boat '+Math.round(Math.hypot(far.x-e.x,far.y-e.y))+' m away is not');}else ok(false,'water outside its reach');}
/* ---- Till hamnen from the beach with a shut fairway ---- */
B.newGame(seed);{const G=B.G,H=G.harbor,S=G.beach;H.secured=true;G.running=true;G.kustIsle.closed=true;S.st='on';S.ph='ramp';
  ok(B.kustShut(false),'the fairway is shut');
  const r=B.beachGo(false);
  ok(r===false&&!H.go&&!S.toHarbor,'the beach menu\'s Till hamnen is denied like harborGo ('+r+', go '+H.go+', toHarbor '+S.toHarbor+')');
  ok(S.st==='on','Birka stays on the beach ('+S.st+')');
  ok(G.log.some(l=>/Farleden till hamnen är stängd/.test(l.t||l.msg||JSON.stringify(l))),'and the log says why');
  G.kustIsle.closed=false;const r2=B.beachGo(false);ok(r2!==false&&(H.go||S.toHarbor),'with the fairway open the order goes through');}
/* ---- the retreat message names the real place ---- */
B.newGame(9052);{const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;
  const rl=G.relays.find(r=>r.type==='verkstad'||r.type==='varv');
  if(rl){rl.captured=true;G.lock=null;/* no barrier round the yard */const e=G.enemies[0];e.dead=false;e.canGround=true;e.range=120;e.dmg=20;e.rate=1;e.acc=1;e.hp=e.maxhp=1e5;e.seen=true;e.visibleNow=true;
    let m=null,tried=0;/* a spot on open land beside the workshop (not cut off behind a barrier, where the message is another) */
    for(let r=30;r<260&&!m;r+=15)for(let a=0;a<6.28&&!m;a+=.5){const x=rl.x+Math.cos(a)*r,y=rl.y+Math.sin(a)*r;if(!B.passLand(B.cellIdx(x,y)))continue;
      const u=B.makeUnit('tank',x,y);G.units.push(u);e.x=e.lx=u.x+Math.cos(a)*100;e.y=e.ly=u.y+Math.sin(a)*100;/* on the far side from the yard */e.tgtU=u;u.hitBy[e.id]=G.time;u.lastHit=G.time;u.hp=u.maxhp*.5;
      B.engageHold(u);m=G.log.find(l=>l.uid===u.id&&/Drar mig tillbaka/.test(l.text))||null;if(m){tried++;if(/HMS Birka/.test(m.text)){m=null;u.dead=true;}}else u.dead=true;}
    ok(!!m&&/verkstad|fältvarv/.test(m.text)&&!/HMS Birka/.test(m.text),'the retreat message names the field yard it goes to, not Birka: '+(m&&m.text)+' ('+tried+' retreats tried)');}
  else ok(false,'a field workshop on the island');}
process.exit(fail?1:0);
