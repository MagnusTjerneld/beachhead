// provspel ö 7670 (25 okt, Magnus): KROK leaves its load on Birka before the next salvage, BÄVER's queue goes on after a field repair,
// the captain's service order goes where it was sent, an air defence that drove off is forgotten when an own unit looks at the empty
// place, and the harbour's own menu sends Birka there from the beach
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
const clearAll=()=>{for(const e of G().enemies)e.dead=true;G().netAll=true;G().running=true;};
// 1. KROK with a pile on the hook gets a salvage order: both loads reach Birka
{B.newGame(2024,'fastning');clearAll();const k=G().kroks[0],c=B.CARRIER;
  const w1=B.addWreck(c.x+60,c.y+60,30,true,'crate'),w2=B.addWreck(c.x-70,c.y+50,40,true,'crate');
  G().wrecks=G().wrecks.filter(w=>w!==w1);k.carry=w1;k.carryT=G().time;k.state='back';k.x=c.x+40;k.y=c.y+40;
  const s0=G().salvaged;B.krokOrder(k,{type:'salvage',wreck:w2},false);
  until(()=>G().salvaged-s0>=w1.value+w2.value,180);
  ok(G().salvaged-s0===w1.value+w2.value,'KROK with '+w1.value+' on the hook and an order for '+w2.value+' brings both home (got '+(G().salvaged-s0)+')');}
// 2. BÄVER keeps its queue when it mends a VARG on the way
{B.newGame(2024,'fastning');clearAll();const L=B.W.landing,b=B.makeUnit('eng',L.x,L.y),v=B.makeUnit('tank',L.x+15,L.y);G().units.push(b,v);
  b.orders=[{type:'move',x:L.x+200,y:L.y,post:'def'},{type:'move',x:L.x+220,y:L.y+20,post:'def'}];v.hp=v.maxhp*.5;v.lastHit=-99;
  v.orders=[{type:'move',x:b.x,y:b.y,post:'def',toRep:b.id}];B.step(.05);
  ok(b.orders[0]&&b.orders[0].type==='repair'&&b.orders.length===3,'BÄVER puts the repair first and keeps its two orders ('+b.orders.map(o=>o.type).join(',')+')');}
// 3. the captain sends a damaged VARG to service at Birka with a BÄVER close by: it goes to Birka
{B.newGame(2024,'fastning');clearAll();const L=B.W.landing,b=B.makeUnit('eng',L.x,L.y),v=B.makeUnit('tank',L.x+20,L.y);G().units.push(b,v);
  v.hp=v.maxhp*.5;v.lastHit=-99;B.sendToService(v,'ship');for(let i=0;i<60;i++)B.step(.05);
  ok(v.rtb&&!(v.orders[0]&&v.orders[0].toRep),'a VARG sent to service at Birka does not turn to the BÄVER beside it');}
// 4. an air defence seen, then moved unseen: an own unit at its old place forgets it
{B.newGame(2024,'fastning');G().running=true;const e=G().enemies.find(x=>x.kind==='aa'&&!x.dead);
  if(!e)ok(false,'ö 2024 has an air defence');else{for(const x of G().enemies)if(x!==e)x.dead=true;e.seen=true;e.lx=e.x;e.ly=e.y;e.x+=150;e.hx=e.x;e.stale=G().time;
    const v=B.makeUnit('tank',e.lx+15,e.ly);G().units.push(v);B.step(.05);
    ok(!e.seen,'an air defence that drove off is forgotten when a VARG stands at its old place');}}
// 5. the harbour's menu sends Birka there from the beach once it is taken (ö 9001)
{B.newGame(9001);clearAll();B.beachGo(true);until(()=>G().beach.st==='on',300);const hr=G().relays.find(r=>r.type==='hamn');
  if(!hr)ok(false,'ö 9001 has a harbour');else{ok(!B.harborItem({relay:hr}),'no harbour order before the harbour is taken');hr.captured=true;for(let i=0;i<60;i++)B.step(.05);
    const it=B.harborItem({relay:hr});ok(!!it&&/hamnen/.test(it.l),'the harbour\'s menu has '+(it?it.l:'nothing'));}}
process.exit(fail?1:0);
