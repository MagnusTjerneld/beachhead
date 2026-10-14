// air defence that shoots and moves (decided 14 okt): the AA is a light truck (light armour, 10 a hit), a hidden one keeps quiet
// against a SPARV that has not seen it, packs up and moves after a fight or when our vehicles come close, cannot fire meanwhile, and
// what we knew fades and is forgotten; the MANPADS team fires its magazine, then moves while it reloads
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const setup=()=>{B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;
  for(const u of G.units)if(u.kind!=='eng'){u.x=G.relays[0].x-700;u.y=G.relays[0].y;u.orders=[];u.hold=true;}return G;};
const tame=u=>{u.orders=[];u.hold=true;u.override=true;u.dmg=0;u.ammo=0;u.range=0;u.speed=0;u.fuel=u.maxFuel=1e5;return u;};/* a target that neither fires back nor flies home */
const put=(G,kind,x,y)=>{const e=B.makeEnemy({id:'Q'+G.enemies.length,kind,x,y});G.enemies.push(e);return e;};
ok(B.ENEMY.aa.cls==='light'&&B.ENEMY.aa.dmg===10,'the AA counts as light armour and does 10 a hit');
ok(B.SIZE_ACC.scout<B.SIZE_ACC.drone&&B.SIZE_ACC.drone<B.SIZE_ACC.krok,'small aircraft are harder to hit: SPARV '+B.SIZE_ACC.scout+', HÖK '+B.SIZE_ACC.drone+', KROK '+B.SIZE_ACC.krok);
// 1. a hidden AA keeps quiet against a SPARV that cannot see it, but fires on a HÖK at the same distance
{const G=setup();const L=G.relays[0],a=put(G,'aa',L.x,L.y);const s=tame(B.makeUnit('scout',L.x+170,L.y));G.units.push(s);
  run(3);ok(s.hp===s.maxhp&&!a.firedHere,'the hidden AA holds its fire against a SPARV at 170 m that has not seen it');
  s.x=L.x+90;run(3);ok(a.firedHere,'it fires once the SPARV comes close enough to see it');}
{const G=setup();const L=G.relays[0],a=put(G,'aa',L.x,L.y);const h=tame(B.makeUnit('drone',L.x+170,L.y));G.units.push(h);h.hp=h.maxhp=1e4;
  run(3);ok(a.firedHere,'a HÖK at 170 m is worth it: the AA fires');
  // 2. when the fight is over it packs up and moves, without camouflage and without firing, and sets up again
  h.dead=true;G.units=G.units.filter(u=>u!==h);let packed=false,moved=false,quietMove=true;const p0={x:a.x,y:a.y};
  for(let i=0;i<40*20;i++){B.step(.05);if(a.sc){packed=true;if(a.camo)quietMove=false;if(a.sc.ph==='move')moved=true;}if(packed&&!a.sc)break;}
  const d=Math.hypot(a.x-p0.x,a.y-p0.y);
  ok(packed&&moved,'five seconds after the last shot it packs up and drives off');ok(quietMove,'and has no camouflage while it moves');
  ok(!a.sc&&a.camo&&d>40&&Math.hypot(a.x-a.px,a.y-a.py)<=150,'it sets up '+Math.round(d)+' m away, near its post, hidden again');}
// 3. our vehicles close in: the AA, which cannot fire on them, leaves
{const G=setup();const L=G.relays[0],a=put(G,'aa',L.x,L.y);const v=tame(B.makeUnit('tank',L.x+130,L.y));G.units.push(v);
  run(1);ok(!!a.sc,'a VARG 130 m away makes the AA pack up and leave');
  a.cd=0;const h=tame(B.makeUnit('drone',a.x+100,a.y));G.units.push(h);run(1);ok(h.hp===h.maxhp,'it cannot fire while it packs or moves');}
// 4. what we knew fades and is forgotten once it has moved out of sight
{const G=setup();const L=G.relays[0],a=put(G,'aa',L.x,L.y);a.seen=true;a.lx=a.x;a.ly=a.y;B.startScoot(a);
  run(30);ok(a.stale!=null||!a.seen,'the old position becomes a fading mark when the AA has moved unseen');
  run(45);ok(!a.seen,'and is forgotten after 40 s');}
// 5. the MANPADS team fires its magazine, then moves while it reloads
{const G=setup();const L=G.relays[0],r=put(G,'rb',L.x,L.y);const h=tame(B.makeUnit('drone',L.x+90,L.y));G.units.push(h);h.hp=h.maxhp=1e4;
  let shots=0,lastHp=h.hp;for(let i=0;i<8*20&&!r.sc;i++){B.step(.05);if(r.ammo<B.ENEMY.rb.mag-shots)shots=B.ENEMY.rb.mag-r.ammo;}
  ok(r.ammo===0&&!!r.sc,'the team fired its '+B.ENEMY.rb.mag+' robots and moves off');ok(r.cd>B.ENEMY.rb.reload-8,'with a long reload ('+r.cd.toFixed(0)+' s left)');
  G.units=G.units.filter(u=>u!==h);run(45);ok(r.ammo===B.ENEMY.rb.mag&&!r.sc,'and is ready again once it has reloaded and set up (ammo '+r.ammo+', cd '+r.cd.toFixed(1)+', '+(r.sc?r.sc.ph:'set up')+')');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
