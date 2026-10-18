// service and the wing (18 okt, issues 43, 50, 51, 55): a unit done with field repair takes up the wing's current group order, or
// joins the leader when the wing has none; a whole wing goes to service in one order, each to its own place; a unit on a pad shows
// a wrench and one waiting for a pad an hourglass; a new BÄVER drives out of the build bay to its own box and waits there
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(let i=0;i<40;i++)B.step(.05);return G;};
const land=(G,r)=>{const L=G.relays[r];return{x:L.x,y:L.y};};
// 1. the wing's order: a move, an attack, and the leader when the wing stands idle
{const G=setup(7341),p=land(G,0),a=B.makeUnit('tank',p.x,p.y),b=B.makeUnit('tank',p.x+12,p.y);G.units.push(a,b);B.setSel([a.id,b.id]);B.assignWing('1');
  const P={x:p.x+200,y:p.y};B.groupOrder({world:P},false);b.orders=[];B.rejoinWing(b);const o=b.orders[0];
  ok(o&&o.type==='move'&&Math.hypot(o.x-P.x,o.y-P.y)<=13,'after service a VARG takes the wing\'s move order'+(o?' ('+o.type+', '+Math.round(Math.hypot(o.x-P.x,o.y-P.y))+' m from the point)':''));
  const e=B.makeEnemy({id:'QT',kind:'turret',x:p.x+150,y:p.y+40});e.seen=true;e.lx=e.x;e.ly=e.y;G.enemies.push(e);B.groupOrder({enemy:e},false);b.orders=[];B.rejoinWing(b);
  ok(b.orders[0]&&b.orders[0].type==='attack'&&b.orders[0].enemy===e,'and the wing\'s attack order');
  e.dead=true;a.orders=[];b.orders=[];B.rejoinWing(b);const q=b.orders[0];
  ok(q&&q.type==='move'&&Math.hypot(q.x-a.x,q.y-a.y)<20,'with the target gone and the wing idle it joins its leader');
  const c=B.makeUnit('tank',p.x,p.y+30);G.units.push(c);ok(!B.rejoinWing(c)&&!c.orders.length,'a VARG in no wing is left as it was');}
// 2. end to end: a VARG repaired in the field by a BÄVER goes after its wing
{const G=setup(7341),p=land(G,0),a=B.makeUnit('tank',p.x,p.y),b=B.makeUnit('tank',p.x+12,p.y),r=B.makeUnit('eng',p.x+20,p.y+10);G.units.push(a,b,r);
  B.setSel([a.id,b.id]);B.assignWing('2');b.hp=b.maxhp*.4;const P={x:p.x+250,y:p.y};B.groupOrder({world:P},false);B.giveOrder(r,{type:'repair',unit:b,post:'def'});
  let t=0;for(let i=0;i<120*20&&!(b.hp>=b.maxhp*.74&&b.orders.length);i++){B.step(.05);t+=.05;}const o=b.orders[0];
  ok(b.hp>=b.maxhp*.74&&o&&o.type==='move'&&Math.hypot(o.x-a.x,o.y-a.y)<=40,'a VARG repaired in the field ('+Math.round(b.hp/b.maxhp*100)+' % after '+t.toFixed(0)+' s) drives after its wing, which is already there'+(o?'':' (no order)'));}
// 3. the whole wing to service: only those that need it, each to its own place
{const G=setup(7341),p=land(G,0),a=B.makeUnit('tank',p.x,p.y),b=B.makeUnit('tank',p.x+12,p.y),h=B.makeUnit('drone',p.x,p.y+20);G.units.push(a,b,h);
  b.hp=b.maxhp*.6;h.ammo=0;B.groupService([a,b,h],'Wing 3');
  ok(!a.rtb&&!a.orders.length&&b.rtb&&h.rtb,'Wing till service sends the damaged VARG and the HÖK without robots, not the whole one');
  const r=B.makeUnit('eng',p.x+30,p.y+20);G.units.push(r);b.orders=[];b.rtb=false;b.saved=null;B.groupService([b]);
  ok(b.orders[0]&&b.orders[0].toRep===r.id,'a damaged VARG with a BÄVER nearby goes to it for field repair');}
// 4. marks: a wrench with progress over a unit on a pad, an hourglass over one waiting for a pad
{const G=setup(7341),h=B.makeUnit('drone',0,0);G.units.push(h);h.ammo=h.maxAmmo/2;h.orders=[{type:'rtb',post:'def'}];h.rtb=true;h.pad={key:'ship',i:0,t:0};h.onPad=true;
  let m=B.taskMarks().find(k=>k.unit===h);ok(m&&m.g==='wrench'&&Math.abs(m.p-.5)<.01,'a HÖK on a pad shows a wrench at 50 %');
  h.pad=null;h.onPad=false;h.padWait={key:'ship',t:0};m=B.taskMarks().find(k=>k.unit===h);ok(m&&m.g==='wait','one waiting for a pad an hourglass');}
// 5. a new BÄVER drives out of the build bay to its box and waits there
{const G=setup(7341);G.res=5000;B.queueBuild('eng');let u=null;for(let i=0;i<200*20&&!u;i++){B.step(.05);u=G.units.find(v=>v.kind==='eng'&&G.units.indexOf(v)>0);}
  for(let i=0;i<20*20;i++)B.step(.05);const L=u&&B.shipLocal(u.x,u.y),S=B.BEV_SPOT;
  ok(u&&Math.hypot(L.lat-S.lat,L.fwd-S.fwd)<2.5&&L.fwd>17,'the new BÄVER waits in its box aft of the bay'+(L?' (lat '+L.lat.toFixed(1)+', fwd '+L.fwd.toFixed(1)+': '+u.state+')':''));}
// 6. test round 9949: an order to the group does not take a unit off its way to service; one to it alone does
{const G=setup(7341),p=land(G,0),a=B.makeUnit('tank',p.x,p.y),b=B.makeUnit('tank',p.x+12,p.y);G.units.push(a,b);b.hp=b.maxhp*.6;B.sendToService(b,'ship');
  B.setSel([a.id,b.id]);B.groupOrder({world:{x:p.x+200,y:p.y}},false);ok(b.rtb&&b.orders[0].type==='rtb'&&a.orders[0].type==='move','a group order leaves a VARG at 60 % on its way to service');
  B.setSel([b.id]);B.groupOrder({world:{x:p.x+200,y:p.y}},false);ok(!b.rtb&&b.orders[0].type==='move','an order to it alone sends it');}
// 7. test round 9949: a VARG retreating from a bunker that hits it, with Birka on the far side of the bunker, first leaves the
// bunker's reach by the shortest way instead of driving past it, then goes to service
{let n=0,okN=0,info=[];for(const sd of[7341,1490,5555]){const G=setup(sd),C=B.CARRIER,L=G.relays[0],e=B.makeEnemy({id:'QB',kind:'turret',x:L.x,y:L.y});e.seen=true;e.lx=e.x;e.ly=e.y;e.dmg=1;e.hp=e.maxhp=5000;G.enemies.push(e);
  const d=Math.hypot(L.x-C.x,L.y-C.y),v=B.makeUnit('tank',L.x+(L.x-C.x)/d*e.range*.6,L.y+(L.y-C.y)/d*e.range*.6);G.units.push(v);v.hp=v.maxhp*.25;
  let mn=1e9,left=null;for(let i=0;i<40*20&&left==null;i++){B.step(.05);const r=Math.hypot(v.x-e.x,v.y-e.y);mn=Math.min(mn,r);if(r>e.range+10)left=G.time;}
  n++;if(left!=null&&mn>e.range*.6-25)okN++;info.push(Math.round(mn)+'/'+Math.round(e.range*.6)+(left==null?' kvar':''));}
  ok(okN===n,'a VARG retreating from a bunker between it and Birka leaves its reach without closing on it ('+okN+' of '+n+'; closest/start '+info.join(', ')+')');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
