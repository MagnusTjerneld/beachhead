// Birka's anchorage lies as near the beach as the water allows (issue 118, Magnus 1 nov): on 3019 she lay 624 m from STRAND, the one ray out
// along the coast's normal ran past a narrow inlet. Every island has a berth and her distance to STRAND is about the clear water round her.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const SHARD=(process.env.SHARD||'0/1').split('/').map(Number),mine=k=>k%SHARD[1]===SHARD[0];/* run.js runs this test in parts (issue 181) */const seeds=[3019,2718,1490,9949,1234,9027,7341,4242,9001,5555,2024,3402,9052,31,55];let worst=0,ws=0;const row=[];
for(const[si,s]of seeds.entries()){if(!mine(si))continue;B.newGame(s);const C=B.CARRIER,L=B.LANDING,d=Math.round(Math.hypot(C.x-L.x,C.y-L.y));row.push(s+':'+d);if(d>worst){worst=d;ws=s;}
  if(!B.W.beach)ok(false,s+' has a berth for Birka');}
console.log(row.join(' '));
ok(worst<=300,'Birka lies at most 300 m from STRAND on every island tried (worst '+worst+' on '+ws+')');
if(mine(0)){B.newGame(3019);const C=B.CARRIER,L=B.LANDING;ok(Math.hypot(C.x-L.x,C.y-L.y)<320,'3019, where the ray gave 624 m, now lies near the inlet');ok(!!B.W.beach&&!!B.W.beach.route,'and the navigator finds her way in from there');}
if(mine(1%SHARD[1])){B.newGame(2718);const C=B.CARRIER,L=B.LANDING;ok(Math.hypot(C.x-L.x,C.y-L.y)<320,'2718, where the ray gave 544 m, now lies near the beach');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
