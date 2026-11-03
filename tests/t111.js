// BÄVER tows scrap (issue 123, Magnus 3 nov): it drags a pile on land, at TOW.slow of its speed, to where KROK can fetch it clear of air
// defence; Dra till säker plats picks the nearest such place and orders KROK there. A new order lets go, and the pile stays where it was left
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(){B.newGame(7341);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.enemies=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
// a land cell with land all round it, well inland
function landAt(r0){const L=B.LANDING;for(let r=r0;r<r0+600;r+=20)for(let a=0;a<6.28;a+=.15){const x=L.x+Math.cos(a)*r,y=L.y+Math.sin(a)*r;let all=true;
  for(let dy=-60;dy<=60&&all;dy+=10)for(let dx=-60;dx<=60&&all;dx+=10)if(!B.passLand(B.cellIdx(x+dx,y+dy)))all=false;
  if(all)return{x,y};}return null;}
fresh();
const P=landAt(250);ok(!!P,'a place inland to put the pile');
// an air defence 80 m from the pile: KROK will not fetch it there
const aa=B.makeEnemy({id:'XA',kind:'aa',x:P.x+80,y:P.y});aa.seen=true;aa.lx=aa.x;aa.ly=aa.y;G.enemies.push(aa);G.time+=1;
const w=B.addWreck(P.x,P.y,40,false,'rubble');
ok(!B.wreckSafe(w),'the pile under the air defence is not safe for KROK');
const sp=B.towSafePt(w);ok(!!sp&&B.wreckSafe(sp),'there is a safe place by land ('+(sp?Math.round(Math.hypot(sp.x-w.x,sp.y-w.y)):'-')+' m off)');
// Dra till säker plats: to the pile, couple it, drag it, leave it and order KROK
const b=put('eng',P.x-30,P.y);b.post='off';
B.towOrder(b,w,sp,true);
ok(b.orders[0]&&b.orders[0].type==='tow','BÄVER has the tow order');
let i=run(400,()=>b.orders[0]&&b.orders[0].hooked);ok(b.orders[0]&&b.orders[0].hooked&&w.tow===b.id&&w.claimed,'it couples the pile ('+(i*.05).toFixed(1)+' s)');
// at half speed: over 4 s on the same ground it drives about TOW.slow of its own speed
{const x0=b.x,y0=b.y;run(80);const v=Math.hypot(b.x-x0,b.y-y0)/4;ok(v<=b.speed*B.TOW.slow*1.45&&v>b.speed*B.TOW.slow*.4,'it drags at about half speed ('+v.toFixed(1)+' m/s of '+b.speed+')');
  ok(Math.hypot(b.x-w.x,b.y-w.y)<=B.TOW.gap+.5,'the pile follows on the rope');}
i=run(4000,()=>!b.orders.length);
ok(!b.orders.length&&!w.tow,'it leaves the pile at the place ('+(i*.05).toFixed(0)+' s)');
ok(B.wreckSafe(w),'where KROK may fetch it');
ok(G.krokQ.includes(w.id)||G.kroks.some(k=>k.target===w),'and KROK is ordered there');
// a new order lets go: the pile stays where it was
fresh();
const w2=B.addWreck(P.x,P.y,40,false,'rubble'),b2=put('eng',P.x-20,P.y);b2.post='off';
B.towOrder(b2,w2,{x:P.x-400,y:P.y},false);
run(400,()=>b2.orders[0]&&b2.orders[0].hooked);run(100);
const mid={x:w2.x,y:w2.y};ok(Math.hypot(mid.x-P.x,mid.y-P.y)>3,'the pile has moved ('+Math.round(Math.hypot(mid.x-P.x,mid.y-P.y))+' m)');
B.giveOrder(b2,{type:'move',x:P.x+100,y:P.y,post:'off'},false);run(40);
ok(!w2.tow&&!w2.claimed&&Math.hypot(w2.x-mid.x,w2.y-mid.y)<1.5,'a new order lets go and the pile stays');
// the click: Bogsera without a place waits coupled for one; the downed crew is not towed
fresh();
const w3=B.addWreck(P.x,P.y,40,false,'rubble'),b3=put('eng',P.x-20,P.y);b3.post='off';
B.towOrder(b3,w3,null,false);run(400,()=>b3.orders[0]&&b3.orders[0].hooked);const h={x:w3.x,y:w3.y};run(60);
ok(b3.orders[0].hooked&&Math.hypot(w3.x-h.x,w3.y-h.y)<.5,'coupled and waiting for where to leave it');
B.towSet(b3,b3.orders[0],{x:P.x+120,y:P.y});ok(b3.orders[0].x!=null,'the click sets the place');
const cw=B.addWreck(P.x+50,P.y,0,false,'crew');ok(!B.towable(cw),'the downed crew is not towed');
// in the water: the place is moved to land (BÄVER does not drive in water)
{const sea={x:B.CARRIER.x,y:B.CARRIER.y};B.towSet(b3,b3.orders[0],sea);const o=b3.orders[0];ok(o.x==null||B.passLand(B.cellIdx(o.x,o.y)),'a place in the sea is not taken as it is');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
