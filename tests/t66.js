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
// 2b. a coordinated attack: the VARG that arrives first waits at its staging point outside the bunker's reach until the other is
//     in place, then both go in together
{const G=setup();const L=G.relays[0],[v1,v2]=G.units.filter(u=>u.kind==='tank');const t=live(G,'turret',L.x+200,L.y);t.hp=t.maxhp=5000;t.camo=false;
  v1.x=t.x-230;v1.y=t.y-20;v2.x=t.x-520;v2.y=t.y+20;for(const v of[v1,v2]){v.hp=v.maxhp=1e5;v.orders=[{type:'attack',enemy:t,post:'off'}];}
  run(2);const st=v1.orders[0].arc&&v1.orders[0].arc.st;ok(!!st&&Math.hypot(st.x-t.x,st.y-t.y)>t.range+20,'VARG-1 has a staging point outside the bunker\'s reach');
  let waited=false,minD=1e9;for(let i=0;i<120&&!v1.orders[0].go;i++){run(.5);minD=Math.min(minD,Math.hypot(v1.x-t.x,v1.y-t.y));if(/väntar på resten/.test(v1.state))waited=true;}
  ok(waited,'VARG-1 waits in position for VARG-2');ok(minD>t.range,'and stays out of the bunker\'s reach meanwhile (closest '+Math.round(minD)+' m)');
  ok(v1.orders[0].go&&v2.orders[0].go,'they go in together');ok(G.log.some(l=>/Alla i position/.test(l.text)),'the log says all are in position');}
// 3. a lone attacker still uses the ordinary firing logic
{const G=setup();const L=G.relays[0],[v1]=G.units.filter(u=>u.kind==='tank');const t=live(G,'turret',L.x+200,L.y);v1.x=t.x-260;v1.y=t.y;v1.orders=[{type:'attack',enemy:t,post:'off'}];run(1);
  ok(!v1.orders[0].arc,'one VARG alone does not take an arc position');}
// 4. a VARG pulling back with heavy damage keeps firing on what it sees and reaches, without stopping
{const G=setup();const L=G.relays[0],[v1]=G.units.filter(u=>u.kind==='tank');v1.x=L.x+150;v1.y=L.y;v1.orders=[];v1.hp=v1.maxhp*.25;v1.lastHit=G.time;
  const e=live(G,'light',v1.x+110,v1.y);e.mobile=false;e.speed=0;e.hp=e.maxhp=1e4;const p0={x:v1.x,y:v1.y};run(3);
  ok(v1.rtb,'the damaged VARG pulls back ('+v1.state+')');ok(v1.target===e,'and fires on '+e.id+' meanwhile ('+(v1.target?v1.target.id:'none')+')');
  const d3=Math.hypot(v1.x-p0.x,v1.y-p0.y);ok(d3>15,'and keeps driving ('+Math.round(d3)+' m in 3 s)');
  for(let i=0;i<16&&e.hp>=1e4&&v1.target===e;i++)run(.5);ok(e.hp<1e4,'it hits');}
// 5. two tanks that cover each other: every VARG still gets a planned spot and a staging point, so nobody charges in alone
{const G=setup();const L=G.relays[0],vs=G.units.filter(u=>u.kind==='tank');vs.push(B.makeUnit('tank',0,0));G.units.push(vs[2]);
  const t1=live(G,'tank',L.x+200,L.y-30),t2=live(G,'tank',L.x+210,L.y+30);for(const t of[t1,t2]){t.mobile=false;t.speed=0;}
  vs.forEach((v,i)=>{v.x=L.x-220;v.y=L.y+(i-1)*26;v.orders=[{type:'attack',enemy:t1,post:'off'}];});run(1.5);
  ok(vs.every(v=>v.orders[0].arc&&v.orders[0].arc.st),'all three VARG get an arc spot and a staging point ('+vs.map(v=>v.orders[0].arc?(v.orders[0].arc.st?'st':'arc'):'-').join(', ')+')');
  ok(vs.every(v=>!v.orders[0].go),'and wait for each other');}
// 6. troops under trees only show from the air within 40 m, so a HÖK sent to spot them goes that close
{const G=setup();const L=G.relays[0],h=G.units.find(u=>u.kind==='drone');let p=null;
  for(let r=50;r<900&&!p;r+=10)for(let a=0;a<6.28&&!p;a+=.2){const x=L.x+Math.cos(a)*r,y=L.y+Math.sin(a)*r;if(B.coverAt(x,y))p={x,y};}
  if(p){const e=live(G,'at',p.x,p.y),q=B.spotPoint(h,e,{x:L.x,y:L.y});const d=q?Math.hypot(q.x-e.lx,q.y-e.ly):-1;ok(q&&d<40,'the spotting point for pansarvärn under trees is '+Math.round(d)+' m from it');}
  else ok(true,'(no trees on this island)');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
