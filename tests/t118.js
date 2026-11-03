// Issue 90 (Magnus 30 okt and 3 nov): the coast artillery as a part of the island, behind the flag KUST_ISLE (off by default).
// Off: the island, the enemies and the records are as before. On: a battery between the beach and the harbour where the coast allows it,
// none where it does not; Birka is denied the harbour while a shut fairway lives, goes round it outside its reach where there is a way
// round, and may go when it is blown up; the briefing names the fairway.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const K=B.KUST_ISLE;
ok(K.on===0,'the flag is off by default');
// off: nothing is added to the world
const SEEDS=[1001,1003,1008,3019,2024];
for(const s of SEEDS){B.newGame(s);const G=B.G,W=B.WORLD;
  ok(G.enemies.length===W.enemies.length&&!G.enemies.some(e=>e.kind==='kust')&&!G.kustIsle&&!W.navOut&&!/Farleden/.test(B.misBrief().rows[0][1]),'flag off, ö '+s+': '+G.enemies.length+' enemies as in the plan, no battery, no circle, no fairway in the briefing');}
// on: find an island with a battery among the first seeds, and one without
K.on=1;let withB=null,without=null;const sig={};
for(let s=1000;s<1100&&!(withB&&without);s++){B.newGame(s);if(B.G.kustIsle&&!withB)withB=s;if(!B.G.kustIsle&&B.G.harbor&&!without)without=s;}
ok(!!withB,'flag on: some island among seeds 1000 to 1099 gets a battery ('+withB+')');
ok(!!without,'flag on: and some island does not ('+without+')');
if(withB){B.newGame(withB);const G=B.G,W=B.WORLD,I=G.kustIsle,e=G.enemies.find(q=>q.id===I.id),L=W.landing,Hb=W.harbor.dock,NR=I.NR;
  ok(!!e&&e.kind==='kust'&&!e.dead,'a battery of kind kust on the island');
  ok(W.enemies.every(q=>q.kind!=='kust'),'the cached world is untouched (the battery lives in the game only)');
  ok(Math.hypot(e.x-L.x,e.y-L.y)>=K.land,'it stands at least '+K.land+' m from the beach ('+Math.round(Math.hypot(e.x-L.x,e.y-L.y))+')');
  const RT=W.birkaPath.route;let dm=1e9;for(const q of RT)dm=Math.min(dm,Math.hypot(q.x-e.x,q.y-e.y));
  ok(dm<K.near+60,'its circle reaches her planned way (closest route point '+Math.round(dm)+' m)');
  ok(Math.hypot(CARRIER().x-e.x,CARRIER().y-e.y)>NR&&Math.hypot(Hb.x-e.x,Hb.y-e.y)>NR,'Birka\'s start and her berth lie outside its circle');
  ok(I.closed||I.way>=I.base*K.minRatio&&I.way-I.base>=K.minExtra,'the way round is '+(I.closed?'shut':Math.round(I.way)+' m against '+Math.round(I.base)+' m'));
  ok(!!W.navOut&&W.navOut[0].r===NR,'her navigator keeps '+NR+' m out');
  ok(G.enemies.length===W.enemies.length+1+(G.enemies.some(q=>q.id==='KLV')?1:0),'only the battery and its air defence are added');
  ok(e.cone&&e.cone.a1>e.cone.a0&&e.cone.a1-e.cone.a0<Math.PI*2-.2,'the firing sector is a cone ('+(e.cone?Math.round((e.cone.a1-e.cone.a0)*180/Math.PI):'-')+' degrees)');
  ok(/Farleden till hamnen/.test(B.misBrief().rows[0][1]),'the briefing names the fairway');
  // a way round: the harbour order is given and her route keeps out of its reach
  const H=G.harbor;H.secured=true;G.running=true;
  if(!I.closed){ok(!B.kustShut(false),'with a way round the order is not denied');ok(B.harborGo()===true,'she goes to the harbour (the long way)');
    for(let i=0;i<40&&!H.route;i++)B.step(.05);
    ok(!!H.route&&H.route.every(q=>Math.hypot(q.x-e.x,q.y-e.y)>NR-8||q===H.route[H.route.length-1]),'her route keeps outside the circle (all '+(H.route?H.route.length:0)+' points)');}
  // the same island with the fairway shut: denied until it is blown up
  B.newGame(withB);const G2=B.G,H2=G2.harbor,e2=G2.enemies.find(q=>q.id==='KB1');H2.secured=true;G2.running=true;G2.kustIsle.closed=true;
  ok(B.kustShut(false),'a shut fairway: kustShut is true while it lives');
  ok(B.harborGo()===false&&!H2.go,'the order to the harbour is denied');
  ok(G2.log.some(l=>/Farleden till hamnen är stängd/.test(l.t||l.msg||JSON.stringify(l))),'and she says why');
  B.killEnemy(e2,null);B.step(.05);
  ok(G2.kustIsle.open&&!B.WORLD.navOut,'blown up: the fairway is open and the circle lifted');
  ok(!B.kustShut(false)&&B.harborGo()===true,'she may go to the harbour now');
  // and the harbour can still be taken from land: the relay is not locked by the battery
  ok(G2.relays.some(r=>r.type==='hamn'),'the harbour point is still on the island to take from land');
}
// the mission Kustbatteriet is as before: one battery, and no second one
{K.on=1;B.newGame(2024,'auto',{uppdrag:'kust'});const n=B.G.enemies.filter(e=>e.kind==='kust').length;ok(n<=1,'mission kust: at most one battery ('+n+')');K.on=0;}
function CARRIER(){return B.CARRIER;}
console.log(fail?'FAILED '+fail:'ALL OK');process.exit(fail?1:0);
