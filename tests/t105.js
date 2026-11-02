// HÖK lands on order (issue 72, Magnus 30 okt and 2 nov): Landa in the order wheel at a point on secured, open and level ground; down it
// stands on the ground, the battery runs down at HOKLAND.drain of the flying rate, it is no aircraft for the enemy (no air reach, no elevation
// limit) but can be seen and shot at, and it lifts by itself when an enemy comes within sight, when hit, and at every new order
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=n=>{for(let i=0;i<n;i++)B.step(.05);};
B.newGame(7341);let G=B.G;G.running=true;G.netAll=true;G.mines=[];
function fresh(){B.newGame(7341);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.enemies=[];G.units=[];G.known.fill(1);G.knownV++;LOS();}
function LOS(){B.LOS.on=false;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
fresh();
const h0=put('drone',B.LANDING.x,B.LANDING.y);
// a point that is open, firm, level and secured
let P=null;for(let r=60;r<500&&!P;r+=20)for(let a=0;a<6.28&&!P;a+=.2){const x=B.LANDING.x+Math.cos(a)*r,y=B.LANDING.y+Math.sin(a)*r;if(x>20&&y>20&&x<2180&&y<2180&&!B.landWhy(h0,x,y))P={x,y};}
ok(!!P,'there is a place to set down on the island');
// why not: the sea, ground not spanned yet
ok(B.landWhy(h0,B.CARRIER.x,B.CARRIER.y+250)==='inte fast mark'||B.landWhy(h0,B.CARRIER.x,B.CARRIER.y+250)!==null,'the sea is no place to land');
{G.known.fill(0);G.knownV++;G.time+=1;ok(B.landWhy(h0,P.x,P.y)==='marken runt ej spanad','ground not scouted gives the reason');G.known.fill(1);G.knownV++;G.time+=1;}
// its own secured ground (ö 4741 kp02): scouted from high height counts, unscouted land beyond HOKLAND.scoutR does not matter
{const K=G.known,hi=G.knownHi;if(hi)hi.fill(1);ok(B.landWhy(h0,P.x,P.y)===null,'ground scouted only from high height counts');if(hi)hi.fill(0);
  const W=B.W,LG=W.baseGrid[B.cellIdx(P.x,P.y)],at=d=>{for(let a=0;a<6.28;a+=.05){const i=B.cellIdx(P.x+Math.cos(a)*d,P.y+Math.sin(a)*d);if(W.baseGrid[i]===LG)return i;}return -1;},far=at(150),near=at(60);
  ok(far>=0&&near>=0,'land 60 and 150 m from the point');
  K[far]=0;G.knownV++;G.time+=1;ok(B.landWhy(h0,P.x,P.y)===null,'unscouted land 150 m off does not stop it');K[far]=1;
  K[near]=0;G.knownV++;G.time+=1;ok(B.landWhy(h0,P.x,P.y)==='marken runt ej spanad','unscouted land 60 m off does');K[near]=1;G.knownV++;G.time+=1;}
// known enemies: inside a weapon's reach plus HOKLAND.threatM is refused, outside it is not
{const e=B.makeEnemy({id:'XR',kind:'turret',x:P.x+150,y:P.y});e.seen=true;e.lx=e.x;e.ly=e.y;G.enemies.push(e);
  ok(/inom räckhåll/.test(B.landWhy(h0,P.x,P.y)||''),'a known bunker 150 m off stops it ('+B.landWhy(h0,P.x,P.y)+')');
  e.x=e.lx=P.x+B.ENEMY.turret.range+B.HOKLAND.threatM+10;ok(B.landWhy(h0,P.x,P.y)===null,'outside its reach and the margin it does not');
  e.seen=false;e.x=e.lx=P.x+150;ok(B.landWhy(h0,P.x,P.y)===null,'an enemy not seen does not stop it');G.enemies=[];}
ok(B.landWhy(h0,P.x,P.y)===null,'secured ground again allows it');
// the order: flies there, sets down, stands
h0.x=P.x-70;h0.y=P.y;h0.heading=0;
B.giveOrder(h0,{type:'land',x:P.x,y:P.y,post:'def'},false);
ok(!h0.landed&&h0.orders[0].type==='land','the order is given and it is not down at once');
run(400);
ok(h0.landed===true&&Math.hypot(h0.x-P.x,h0.y-P.y)<6,'it flew to the point and set down ('+Math.round(Math.hypot(h0.x-P.x,h0.y-P.y))+' m off)');
ok(/Landad/.test(h0.state),'its state says so ('+h0.state+')');
ok(B.aloft(h0)===false&&B.unitHOf(h0)<B.groundY(h0.x,h0.y)+2,'on the ground it is no aircraft and low');
{const aa=B.makeEnemy({id:'XA',kind:'aa',x:h0.x+60,y:h0.y}),tu=B.makeEnemy({id:'XT',kind:'turret',x:h0.x+60,y:h0.y});
  const f=put('drone',h0.x,h0.y+300);
  ok(B.reachVs(aa,h0)===0&&B.reachVs(aa,f)>0,'air defence does not reach a HÖK on the ground, and does reach one in the air');
  ok(B.reachVs(tu,h0)>0,'a gun does reach it on the ground');
  ok(B.elevOK(tu,h0)===true,'the elevation limit does not apply to it on the ground');
  f.dead=true;G.units=G.units.filter(u=>u!==f);}
// battery: slow while down
{const f1=h0.fuel;run(400);const dn=f1-h0.fuel;
  ok(h0.landed&&Math.abs(dn-20*B.HOKLAND.drain)<.5,'the battery ran down '+dn.toFixed(2)+' in 20 s on the ground (about '+(20*B.HOKLAND.drain)+')');
  const f=put('drone',B.LANDING.x,B.LANDING.y+300);f.orders=[];const g1=f.fuel;run(400);
  ok(g1-f.fuel>19,'in the air it ran down '+(g1-f.fuel).toFixed(1)+' in 20 s');f.dead=true;G.units=G.units.filter(u=>u!==f);}
// it stays down with nothing happening
run(600);ok(h0.landed,'it stays down with nothing around');
// saved games keep it
{const r=B.graphDec(B.graphEnc(G).tab),u=r.units.find(v=>v.id===h0.id);ok(u&&u.landed===true&&u.orders[0].type==='land','a save keeps it down with its order');}
// a new order lifts it
B.giveOrder(h0,{type:'move',x:P.x+40,y:P.y,post:'def'},false);run(2);
ok(!h0.landed,'a new order lifts it');
// Shift: an order queued behind Landa lifts too
fresh();{const h=put('drone',P.x,P.y);h.landed=true;h.orders=[{type:'land',x:P.x,y:P.y,post:'def'}];run(10);ok(h.landed,'down on its own order');
  B.giveOrder(h,{type:'move',x:P.x+40,y:P.y,post:'def'},true);run(3);ok(!h.landed&&h.orders[0].type==='move','an order added behind Landa lifts it');}
// an enemy comes into sight
fresh();{const h=put('drone',P.x,P.y);h.landed=true;h.orders=[{type:'land',x:P.x,y:P.y,post:'def'}];run(20);ok(h.landed,'quiet: still down');
  const e=B.makeEnemy({id:'XE',kind:'turret',x:P.x+h.vision*.6,y:P.y});e.visibleNow=true;e.seen=true;G.enemies.push(e);run(10);
  ok(!h.landed&&!h.orders.some(o=>o.type==='land'),'it lifts when an enemy comes within sight');
  ok(G.log.some(l=>/Lyfter/.test(l.text||l.msg||JSON.stringify(l))),'and says why');}
// an enemy outside its sight does not
fresh();{const h=put('drone',P.x,P.y);h.landed=true;h.orders=[{type:'land',x:P.x,y:P.y,post:'def'}];
  const e=B.makeEnemy({id:'XF',kind:'turret',x:P.x+h.vision+120,y:P.y});e.visibleNow=true;e.seen=true;G.enemies.push(e);run(10);ok(h.landed,'an enemy beyond its sight does not lift it');}
// a hit lifts it
fresh();{const h=put('drone',P.x,P.y);h.landed=true;h.orders=[{type:'land',x:P.x,y:P.y,post:'def'}];run(10);h.lastHit=G.time;run(2);ok(!h.landed,'a hit lifts it');}
// a point that turns out not to be landable on arrival is refused with the reason
// (it scouts the ground around it on the way, so a known enemy within reach is what makes it bad here)
fresh();{const h=put('drone',P.x-50,P.y);B.giveOrder(h,{type:'land',x:P.x,y:P.y,post:'def'},false);run(5);
  const e=B.makeEnemy({id:'XQ',kind:'aa',x:P.x+120,y:P.y});e.seen=true;e.lx=e.x;e.ly=e.y;e.dead=false;G.enemies.push(e);run(300);
  ok(!h.landed&&!h.orders.some(o=>o.type==='land'),'ground within a known enemy reach on arrival is not landed on');}
// trees (Magnus 2 nov): a lone tree a little off does not stop a landing, one within HOKLAND.treeIn does, and so do more than treeMax within clear
fresh();{const T=B.W.trees,n0=T.length,add=(dx,dy)=>T.push({x:P.x+dx,y:P.y+dy,s:1,ci:B.cellIdx(P.x+dx,P.y+dy),k:'oak'});
  add(5.5,0);ok(B.landWhy(h0,P.x,P.y)===null,'one tree 5.5 m off does not stop it');
  add(0,-6);ok(B.landWhy(h0,P.x,P.y)===null,'two trees within 7 m do not either');
  add(-6,0);ok(B.landWhy(h0,P.x,P.y)==='för många träd','a third within 7 m does');T.length=n0;
  add(2.5,1);ok(B.landWhy(h0,P.x,P.y)==='träd i vägen','a tree within 4 m does');T.length=n0;
  ok(B.landWhy(h0,P.x,P.y)===null,'the point is open again');}
// an area (ö 4741 kp03): the nearest good place within HOKLAND.near of a bad point, HOKLAND.gap apart from those taken
fresh();{const T=B.W.trees,n0=T.length;T.push({x:P.x+1,y:P.y,s:1,ci:B.cellIdx(P.x+1,P.y),k:'oak'});
  const s1=B.landSpot(h0,P.x,P.y,[]);ok(!!s1&&Math.hypot(s1.x-P.x,s1.y-P.y)<=B.HOKLAND.near&&B.landWhy(h0,s1.x,s1.y)===null,'a tree on the point: a place nearby instead'+(s1?' ('+Math.round(Math.hypot(s1.x-P.x,s1.y-P.y))+' m off)':''));
  const s2=s1&&B.landSpot(h0,P.x,P.y,[s1]);ok(!!s2&&Math.hypot(s2.x-s1.x,s2.y-s1.y)>=B.HOKLAND.gap,'a second HÖK gets another place '+(s2?Math.round(Math.hypot(s2.x-s1.x,s2.y-s1.y))+' m from the first':''));
  // on the way: the order point goes bad, it lands at the nearest good place instead
  const h=put('drone',P.x-60,P.y);T.length=n0;B.giveOrder(h,{type:'land',x:P.x,y:P.y,post:'def'},false);run(10);T.push({x:P.x+1,y:P.y,s:1,ci:B.cellIdx(P.x+1,P.y),k:'oak'});run(400);
  {const o=h.orders[0],d=o?Math.hypot(o.x-P.x,o.y-P.y):-1;ok(h.landed&&o&&d>1&&d<=B.HOKLAND.near&&B.landWhy(h,o.x,o.y)===null,'a point gone bad on the way: it landed at a place '+Math.round(d)+' m off instead');}T.length=n0;
  G.known.fill(0);G.knownV++;G.time+=1;ok(B.landSpot(h0,P.x,P.y,[])===null,'no place when nothing is scouted');G.known.fill(1);G.knownV++;G.time+=1;}
// the wing (Magnus 2 nov): one HÖK lifting for an enemy lifts the wing's other landed HÖK, and each rejoins the wing
fresh();{const h1=put('drone',P.x,P.y),h2=put('drone',P.x+12,P.y),v=put('tank',P.x-60,P.y);
  for(const h of[h1,h2]){h.landed=true;h.orders=[{type:'land',x:h.x,y:h.y,post:'def'}];}
  B.setSel([h1.id,h2.id,v.id]);B.assignWing('1');run(10);ok(h1.landed&&h2.landed,'two HÖK down in wing 1');
  const e=B.makeEnemy({id:'XW',kind:'turret',x:P.x-h1.vision*.6,y:P.y+60});e.visibleNow=true;e.seen=true;G.enemies.push(e);run(4);
  ok(!h1.landed&&!h2.landed,'both lift when one sees an enemy');
  ok([h1,h2].every(h=>h.orders[0]&&h.orders[0].type==='follow'&&h.orders[0].unit===v),'and both rejoin the wing by its VARG ('+[h1,h2].map(h=>h.orders[0]&&h.orders[0].type).join(', ')+')');}
// the kaptenbot and the test bot never give it: no order type of theirs is Landa
{const fs=require('fs'),path=require('path');let n=0;for(const f of['kapten.js','t45.js'])n+=(fs.readFileSync(path.join(__dirname,f),'utf8').match(/type:'land'/g)||[]).length;ok(n===0,'the bots do not use Landa');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
