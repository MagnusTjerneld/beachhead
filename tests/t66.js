// livelier fights (decided 14 okt): enemy guns turn at their own pace and fire only when on target, keep their target while it stays
// in reach, several VARG on one target spread on an arc clear of other known weapons, and slide along it while they fire
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const setup=()=>{B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;G.known.fill(1);G.knownV++;return G;};
const live=(G,kind,x,y)=>{const e=G.enemies.find(q=>q.dead&&q.kind===kind);e.dead=false;e.hp=e.maxhp;e.x=x;e.y=y;e.hx=x;e.hy=y;e.lx=x;e.ly=y;e.seen=true;e.route=null;e.march=null;e.alert=null;return e;};
// 1. a bunker whose gun points away has to turn before it fires, and it does not jump to a nearer target
{const G=setup();const L=G.relays[0],[v1,v2]=G.units.filter(u=>u.kind==='tank');const t=live(G,'turret',L.x+200,L.y);
  v1.x=t.x+110;v1.y=t.y;v2.x=t.x-300;v2.y=t.y;v1.orders=[];v2.orders=[];v1.hold=true;v2.hold=true;
  t.aim=Math.PI;t.cd=0;const hp0=v1.hp;run(.6);ok(v1.hp===hp0,'the bunker does not fire while its gun turns ('+Math.round(Math.abs(t.aim)*57)+' degrees off at 0.6 s)');
  run(7);ok(v1.hp<hp0||t.cd>0,'it fires once it is on target (180 degrees takes a bunker about 4.5 s)');ok(t.tgtU===v1,'it is on VARG-1');
  v2.x=t.x-90;v2.y=t.y;run(1);ok(t.tgtU===v1,'a nearer VARG behind it does not pull its gun round while VARG-1 is in reach');}
// 2. two VARG attacking one bunker spread on an arc, outside the reach of another known weapon, and slide while firing
{const G=setup();const L=G.relays[0],[v1,v2]=G.units.filter(u=>u.kind==='tank');const t=live(G,'turret',L.x+200,L.y);t.hp=t.maxhp=5000;t.camo=false;/* a known, uncamouflaged bunker: no wait for spotting */
  const other=live(G,'tank',t.x,t.y+170);other.mobile=false;other.speed=0;
  v1.x=t.x-260;v1.y=t.y-20;v2.x=t.x-260;v2.y=t.y+20;for(const v of[v1,v2]){v.hp=v.maxhp=1e5;v.orders=[{type:'attack',enemy:t,post:'off'}];}
  run(2);const f1=v1.orders[0].fp,f2=v2.orders[0].fp;
  ok(f1&&f2&&v1.orders[0].arc&&v2.orders[0].arc,'both get a firing position on the arc');
  if(f1&&f2){const a1=Math.atan2(f1.y-t.y,f1.x-t.x),a2=Math.atan2(f2.y-t.y,f2.x-t.x),sep=Math.abs(Math.atan2(Math.sin(a1-a2),Math.cos(a1-a2)));
    ok(sep>.55,'they are spread '+Math.round(sep*57)+' degrees round the target');
    ok([f1,f2].every(f=>Math.hypot(f.x-other.lx,f.y-other.ly)>other.range+19),'both stay out of the other weapon\'s reach');
    const r1=Math.hypot(f1.x-t.x,f1.y-t.y);ok(r1<v1.range&&r1>v1.range*.6,'inside their reach ('+Math.round(r1)+' m; 85 % of it, or 90 % of their sight while nobody else sees the target)');}
  run(25);const p0={x:v1.x,y:v1.y};run(5);const moved=Math.hypot(v1.x-p0.x,v1.y-p0.y);
  ok(moved>3,'VARG-1 keeps moving while it fights ('+moved.toFixed(1)+' m in 5 s, '+v1.state+')');
  ok(t.hp<5000,'and the bunker is being hit');}
// 3. a lone attacker still uses the ordinary firing logic
{const G=setup();const L=G.relays[0],[v1]=G.units.filter(u=>u.kind==='tank');const t=live(G,'turret',L.x+200,L.y);v1.x=t.x-260;v1.y=t.y;v1.orders=[{type:'attack',enemy:t,post:'off'}];run(1);
  ok(!v1.orders[0].arc,'one VARG alone does not take an arc position');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
