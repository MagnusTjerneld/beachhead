// Provspel ö 3019 (Magnus 21 okt): KROK never sets BÄVER down on the water, flies to an unsecured point and waits there with the load,
// and waits where it lifted when nothing is said; a new order cancels a lift that waits; a HÖK striking a target is not taken off to
// spot it; the wing does not wait for a VARG far from its staging point; and every mast stands where the net can reach it
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};const said=(G,re)=>G.log.find(l=>re.test(l.text));
// 1. KROK and BÄVER on ö 3019
{B.newGame(3019);const G=B.G;G.running=true;G.netAll=true;const k=G.kroks[0],u=G.units.find(v=>v.kind==='eng');
  B.krokOrder(k,{type:'lift',unit:u,cap:true},false);run(25);ok(!!k.cargo,'KROK lifts BÄVER');const p0={x:k.x,y:k.y};run(10);
  ok(Math.hypot(k.x-p0.x,k.y-p0.y)<8&&/Väntar med BÄVER i kroken i ruta/.test(k.status),'with nowhere to set it down it waits where it lifted ('+k.status+')');
  k.post='off';B.krokOrder(k,{type:'drop',x:1262,y:1891,cap:true},false);run(30);
  ok(!!k.cargo&&u.carried,'a point on the water with no land near is refused and BÄVER stays on the hook');ok(!!said(G,/kör bara på land/),'and KROK says BÄVER drives only on land');
  const L=B.W.landing;B.krokOrder(k,{type:'drop',x:L.x,y:L.y,cap:true},false);run(2);
  ok(!!said(G,/Flyger dit och väntar med BÄVER/),'on unsecured land with BÄVER on Dold it flies there and waits with the load');ok(k.orders[0]&&k.orders[0].type==='move'&&!!k.cargo,'as a flight with BÄVER still on the hook');}
// 2. a new order cancels a lift that waits
{B.newGame(2024);const G=B.G;G.running=true;G.netAll=true;const k=G.kroks[0],v=B.makeUnit('tank',B.W.landing.x,B.W.landing.y);G.units.push(v);
  G.krokAuto=false;B.krokOrder(k,{type:'lift',unit:v,cap:true},false);B.krokOrder(k,{type:'drop',x:B.CARRIER.x,y:B.CARRIER.y,cap:true},true);for(let i=0;i<100&&!v.awaitKrok;i++)run(.1);ok(v.awaitKrok===k.id,'VARG waits for KROK');
  G.selIds=[v.id];G.sel=v.id;B.groupOrder({world:{x:v.x+60,y:v.y}});run(1);
  ok(!v.awaitKrok&&!k.orders.some(q=>q.unit===v),'a move order cancels the lift');ok(!!said(G,/Avbeställer lyftet/),'and VARG says so');ok(!k.orders.some(q=>q.type==='drop'),'the set-down queued after it goes too');}
// 3. a straggler is not waited for, and a striking HÖK is not taken off to spot
{B.LOS.on=false;B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;B.START.units=['drone','tank','tank','eng'];B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;G.known.fill(1);G.knownV++;
  const live=(kind,x,y)=>{const e=G.enemies.find(q=>q.dead&&q.kind===kind);e.dead=false;e.hp=e.maxhp;e.x=x;e.y=y;e.hx=x;e.hy=y;e.lx=x;e.ly=y;e.seen=true;e.route=null;e.march=null;e.alert=null;return e;};
  const t=live('turret',1375,1405);t.hp=t.maxhp=5000;t.camo=false;const[v1,v2]=G.units.filter(u=>u.kind==='tank');
  v1.x=t.x-230;v1.y=t.y-20;v2.x=t.x-230;v2.y=t.y+520;for(const v of[v1,v2]){v.hp=v.maxhp=1e5;v.orders=[{type:'attack',enemy:t,post:'off'}];}
  run(12);ok(v1.orders[0]&&v1.orders[0].go,'VARG-1 goes in without waiting for VARG-2 far behind ('+v1.state+')');ok(!!said(G,/långt efter och ansluter/),'and the log says VARG-2 joins later');
  B.SHAPE_CFG.force=null;B.SHAPE_CFG.rough=1;B.LOS.on=true;}
{B.START.units=['eng'];B.newGame(9949);const G=B.G;G.running=true;G.netAll=true;G.known.fill(1);G.knownV++;for(const e of G.enemies)e.seen=true;G.units.length=0;
  const T=G.enemies.find(e=>e.id==='T8'),L=B.W.landing,h=B.makeUnit('drone',L.x,L.y+40),v=B.makeUnit('tank',L.x+30,L.y+80);h.alt=30;h.post='off';G.units.push(h,v);
  h.orders=[{type:'attack',enemy:T,post:'off'}];v.orders=[{type:'attack',enemy:T,post:'off'}];run(4);
  ok(!(h.orders[0]&&h.orders[0].spotFor),'a HÖK striking the target is not sent to spot it for the VARG ('+(h.orders[0]?h.orders[0].type:'-')+')');}
// 4. every mast stands where the net reaches it: Birka 850 m, R1 or the harbour 500 m (not the radar station or the command centre), a mast placed before 250 m
{let n=0,bad=[];for(const sd of[3019,9949,2024,1234,5555,7341,9052,77,4242,9001,31]){B.newGame(sd);const G=B.G,C=B.CARRIER,ms=G.structs.filter(s=>s.kind==='mast');n+=ms.length;
    const src=[{x:C.x,y:C.y,r:850},...G.relays.filter(r=>r.type!=='radar'&&r.type!=='central').map(r=>({x:r.x,y:r.y,r:500}))];
    for(const m of ms)if(!src.some(q=>Math.hypot(m.x-q.x,m.y-q.y)<=q.r)&&!ms.some(o=>o!==m&&Math.hypot(o.x-m.x,o.y-m.y)<=250))bad.push(sd+' '+m.id);}
  ok(!bad.length,n+' masts on eleven islands, every one within reach of the net'+(bad.length?' ('+bad.join(', ')+')':''));}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
