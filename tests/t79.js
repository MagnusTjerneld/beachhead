// Birka's air (kp02, Magnus 20 okt): nothing that fires on aircraft stands, shifts or drives where it reaches KROK's waiting circle
// over Birka; and a vehicle KROK carries is set down on secured land on the island near the point, never on a far skerry (ö 4754)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let bad=0;for(const s of[9949,2358,5753,4754,1234]){B.newGame(s);bad+=B.G.enemies.filter(e=>B.inBirka(e,e.x,e.y)).length;}
ok(bad===0,'5 islands (2358 and 5753 had air defence inside): none inside at the start');
B.newGame(9949);const G=B.G,C=B.CARRIER;G.running=true;
// an air defence just outside the edge, shifting 40 times: never into Birka's air
const L=G.enemies.find(e=>e.kind==='aa'&&!e.dead);let inS=0,n=0;
for(let i=0;i<40;i++){L.sc=null;const ok1=B.startScoot(L);if(!ok1)continue;n++;const p=L.sc.path[L.sc.path.length-1];if(B.inBirka(L,p.x,p.y))inS++;}
ok(n>0&&inS===0,'air defence shifting '+n+' times: no new site inside');
// a light armoured car driving straight at Birka stops at the edge
const P=B.makeEnemy({id:'XP',kind:'light',x:C.x,y:C.y-400});P.x=C.x;P.y=C.y-B.birkaR(P)-30;let k=0;
for(;k<200;k++)B.enemyStep(P,C.x,C.y,.1);
ok(!B.inBirka(P,P.x,P.y),'light armour driving at Birka holds at '+Math.round(Math.hypot(P.x-C.x,P.y-C.y))+' m (edge '+B.birkaR(P)+' m)');
// secured land for a vehicle: only on the island and near the point
G.known.fill(1);let far=0,sk=0;
for(const [x,y] of[[200,200],[2000,200],[200,2000],[2000,2000],[1100,1100]]){const r=B.knownSafe(G.kroks[0],x,y,true,true);if(r&&r.moved){if(Math.hypot(r.x-x,r.y-y)>320)far++;if(B.WORLD.zid[Math.floor(r.y/10)*220+Math.floor(r.x/10)]<0)sk++;}}
ok(far===0&&sk===0,'secured drop spots: none far from the point, none off the island');
process.exit(fail?1:0);
