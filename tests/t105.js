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
{G.known.fill(0);G.knownV++;G.time+=1;ok(B.landWhy(h0,P.x,P.y)==='ej säkrad mark','ground not secured gives the reason');G.known.fill(1);G.knownV++;G.time+=1;}
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
fresh();{const h=put('drone',P.x-50,P.y);B.giveOrder(h,{type:'land',x:P.x,y:P.y,post:'def'},false);G.known.fill(0);G.knownV++;G.time+=1;run(300);
  ok(!h.landed&&!h.orders.some(o=>o.type==='land'),'ground that is not secured on arrival is not landed on');}
// the kaptenbot and the test bot never give it: no order type of theirs is Landa
{const fs=require('fs'),path=require('path');let n=0;for(const f of['kapten.js','t45.js'])n+=(fs.readFileSync(path.join(__dirname,f),'utf8').match(/type:'land'/g)||[]).length;ok(n===0,'the bots do not use Landa');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
