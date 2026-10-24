// decisions after the test round on island 1490 (18 okt): rocket reach only with eyes of another kind (issue 30), a HÖK hit by air
// defence pulls out of reach and waits instead of flying home, with the wing (issue 33), a VARG sent back in turns again after a
// share of its hull (issue 25), a unit done outside the net comes back into it (issue 37 a), and KROK's set-down follows its own
// stance for the air and the vehicle's stance for secured land (issue 22)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(let i=0;i<40;i++)B.step(.05);return G;};
const foe=(G,kind,x,y)=>{const e=B.makeEnemy({id:'Q'+kind,kind,x,y});e.seen=true;e.lx=x;e.ly=y;e.visibleNow=true;e.mobile=false;G.enemies.push(e);return e;};
// 1. another HÖK beside the target does not stretch the rocket to 170 m; a VARG that sees it does
{const G=setup(7341),L=G.relays[0],e=foe(G,'rb',L.x,L.y);
  const h1=B.makeUnit('drone',L.x+160,L.y),h2=B.makeUnit('drone',L.x+30,L.y);G.units.push(h1,h2);
  ok(!B.eyesOn(e,h1)&&B.reachR(h1,e)===h1.range,'with only another HÖK on the target the rocket reaches '+B.reachR(h1,e)+' m');
  const v=B.makeUnit('tank',L.x+40,L.y+10);G.units.push(v);
  ok(B.eyesOn(e,h1)&&B.reachR(h1,e)===h1.range+50,'with a VARG seeing it '+B.reachR(h1,e)+' m');}
// 2. a HÖK on Defensiv hit by air defence with most of its hull pulls out of reach with its wing mate and waits there
{const G=setup(7341),L=G.relays[0],aa=foe(G,'aa',L.x,L.y);aa.dmg=0;
  const h1=B.makeUnit('drone',L.x+150,L.y),h2=B.makeUnit('drone',L.x+160,L.y+20);for(const h of[h1,h2]){h.post='def';h.fuel=h.maxFuel=1e5;G.units.push(h);}
  G.wings={'2':[h1.id,h2.id]};h1.hp=h1.maxhp*.7;h1.lastHit=G.time;h1.hitBy={[aa.id]:G.time};B.step(.05);
  const R=B.airThreatR(h1,aa);
  ok(!h1.rtb&&h1.orders[0]&&h1.orders[0].pull,'the HÖK hit at 70 % pulls out instead of flying home ('+(h1.orders[0]?h1.orders[0].type:'no order')+')');
  ok(h2.orders[0]&&h2.orders[0].pull,'its wing mate pulls out with it');
  for(let i=0;i<20*20;i++)B.step(.05);
  const d1=Math.hypot(h1.x-aa.x,h1.y-aa.y),d2=Math.hypot(h2.x-aa.x,h2.y-aa.y);
  ok(Math.min(d1,d2)>R-10&&!h1.rtb,'both wait outside its reach ('+d1.toFixed(0)+' and '+d2.toFixed(0)+' m, reach plus margin '+R.toFixed(0)+' m)');
  const h3=B.makeUnit('drone',L.x+150,L.y-30);h3.post='def';G.units.push(h3);h3.hp=h3.maxhp*.4;h3.lastHit=G.time;h3.hitBy={[aa.id]:G.time};B.step(.05);
  ok(h3.rtb,'one under half its hull goes to service as before');}
// 3. a VARG sent back in with little hull turns again after losing half of it; with more it fights on for 10 % of full hull
{const G=setup(7341),v=B.makeUnit('tank',0,0);G.units.push(v);
  v.holdHp=7;v.hp=5;const a=B.sentBackIn(v);v.hp=3;const b=B.sentBackIn(v);
  v.holdHp=40;v.hp=30;const c=B.sentBackIn(v);v.hp=24;const d=B.sentBackIn(v);
  ok(a&&!b&&c&&!d,'sent in with 7 it turns below 3.5, sent in with 40 it turns below 25 ('+[a,b,c,d].join(',')+')');}
// 4. a VARG and a HÖK left idle outside the net come back into it by themselves
{const G=setup(1490);G.netAll=false;const C=B.CARRIER;
  const pts=[];for(let a=0;a<64;a++){const x=C.x+Math.cos(a/64*6.283)*1000,y=C.y+Math.sin(a/64*6.283)*1000;if(!B.inNet(x,y))pts.push({x,y});}
  const v=B.makeUnit('tank',pts[0].x,pts[0].y),h=B.makeUnit('drone',pts[0].x+10,pts[0].y);h.fuel=h.maxFuel=1e5;G.units.push(v,h);v.orders=[];h.orders=[];
  for(let i=0;i<6*20;i++)B.step(.05);
  ok(v.orders[0]&&v.orders[0].toNet&&h.orders[0]&&h.orders[0].toNet,'after 3 s idle outside the net both head back ('+(v.orders[0]?v.orders[0].type:'none')+', '+(h.orders[0]?h.orders[0].type:'none')+')');
  for(let i=0;i<120*20&&!(B.inNet(v.x,v.y)&&B.inNet(h.x,h.y));i++)B.step(.05);
  for(let i=0;i<30;i++)B.step(.05);
  ok(B.inNet(v.x,v.y)&&B.inNet(h.x,h.y)&&!v.offNet&&!h.offNet,'and are inside it again with contact');}
// 5. on scouted but unsecured land a BÄVER on Defensiv is not set down; on Offensiv it is, with a line in the log
{const drop=post=>{const G=setup(1490),L=G.relays[0],k=G.kroks[0],u=G.units.find(v=>v.kind==='eng');G.known.fill(0);
    for(let y=-90;y<=90;y+=5)for(let x=-90;x<=90;x+=5)if(x*x+y*y<90*90)G.known[B.cellIdx(L.x+x,L.y+y)]=1;G.knownV++;
    k.x=L.x+40;k.y=L.y;k.orders=[];k.cargo=u;u.carried=k.id;u.post=post;B.krokOrder(k,{type:'drop',x:L.x,y:L.y});
    for(let i=0;i<40*20&&k.cargo;i++)B.step(.05);return{G,L,k,u,sec:B.isSecured(L.x,L.y),log:G.log.map(l=>l.text).join(' | ')};};
  const a=drop('def');ok(!a.sec&&a.k.cargo===a.u&&/Ingen säkrad landningsplats/.test(a.log),'a BÄVER on Defensiv is not set down on unsecured land ('+(a.k.cargo?'still carried':'set down')+')');
  const b=drop('off');ok(!b.k.cargo&&Math.hypot(b.u.x-b.L.x,b.u.y-b.L.y)<15&&/sätts ned på osäkrad mark/.test(b.log),'a BÄVER on Offensiv is set down where the captain points, with a line in the log ('+Math.hypot(b.u.x-b.L.x,b.u.y-b.L.y).toFixed(0)+' m off)');}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
