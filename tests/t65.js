// a wing of VARG and HÖK (decided 14 okt): HÖK guards the wing as a whole with its own stance, an Offensiv HÖK also strikes the
// wing's target and is retargeted by every new order, a retreat is not turned back into the fight by wing support,
// and in manual control the target the driver shoots at becomes the target of the group that follows him
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const setup=()=>{B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;const L=G.relays[0];
  const [v1,v2]=G.units.filter(u=>u.kind==='tank'),[h1,h2]=G.units.filter(u=>u.kind==='drone');
  v1.x=L.x+40;v1.y=L.y;v2.x=L.x+40;v2.y=L.y+20;h1.x=L.x+20;h1.y=L.y;h2.x=L.x+20;h2.y=L.y+20;for(const u of[v1,v2,h1,h2]){u.orders=[];u.mission=null;}
  h1.post='off';h2.post='def';G.wings={'1':[v1.id,v2.id,h1.id,h2.id]};G.selIds=[v1.id,v2.id,h1.id,h2.id];G.sel=v1.id;return{G,L,v1,v2,h1,h2};};
const foe=(G,x,y)=>{const e=G.enemies.find(q=>q.dead&&(q.kind==='inf'||q.kind==='light'||q.kind==='rb'||q.kind==='tank'));e.dead=false;e.hp=e.maxhp||60;e.x=x;e.y=y;e.hx=x;e.hy=y;e.lx=x;e.ly=y;e.seen=true;e.mobile=false;e.route=null;e.march=null;return e;};
// 1. an attack order to the wing: the Offensiv HÖK strikes the same target, the Defensiv one stays guarding the wing
{const{G,L,v1,v2,h1,h2}=setup();const e=foe(G,L.x+260,L.y+40);
  B.groupOrder({enemy:e},false);
  ok(v1.orders[0]&&v1.orders[0].type==='attack'&&v1.orders[0].enemy===e&&v2.orders[0].enemy===e,'both VARG attack the target');
  ok(h1.orders[0]&&h1.orders[0].type==='attack'&&h1.orders[0].enemy===e,'the Offensiv HÖK strikes the wing\'s target');
  ok(h1.mission&&h1.mission.type==='follow'&&h1.mission.cover&&h1.mission.post==='off','and keeps guarding the wing as its mission, with its own stance');
  ok(h2.orders[0]&&h2.orders[0]===h2.mission&&h2.mission.post==='def','the Defensiv HÖK stays in the guarding role');
  // 2. a new target for the wing reaches the HÖK too
  const e2=foe(G,L.x+240,L.y-60);B.groupOrder({enemy:e2},false);
  ok(h1.orders[0]&&h1.orders[0].enemy===e2,'a new attack order retargets the HÖK');}
// 3. guarding the wing, not one member: the HÖK keep station ahead of the wing's centre, side by side
{const{G,L,v1,v2,h1,h2}=setup();B.groupOrder({world:{x:L.x+40,y:L.y+10}},false);run(12);
  const cx=(v1.x+v2.x)/2,cy=(v1.y+v2.y)/2,d1=Math.hypot(h1.x-cx,h1.y-cy),d2=Math.hypot(h2.x-cx,h2.y-cy);
  ok(/Skyddar wingen/.test(h2.state),'the HÖK says it guards the wing ('+h2.state+')');
  ok(d1<110&&d2<110,'both HÖK stay with the wing\'s centre ('+Math.round(d1)+' and '+Math.round(d2)+' m)');
  ok(Math.hypot(h1.x-h2.x,h1.y-h2.y)>8,'and do not stack on the same spot ('+Math.round(Math.hypot(h1.x-h2.x,h1.y-h2.y))+' m apart)');}
// 4. a move given under fire to a place out of the shooters' reach is a retreat: everyone pulls back and wing support waits; an
//    advance keeps wing support; and support never sends a unit on a long trip into another zone
{const{G,L,v1,v2}=setup();const e=foe(G,L.x+200,L.y);G.selIds=[v1.id,v2.id];
  v2.hitBy[e.id]=G.time;v2.lastHit=G.time;B.groupOrder({world:{x:L.x-200,y:L.y}},false);
  ok(v1.orders[0].retreat&&v2.orders[0].retreat,'a move out of reach while under fire is a retreat for both');
  run(1);v2.hitBy[e.id]=G.time;run(.6);
  ok(v1.orders[0]&&v1.orders[0].type==='move','VARG-1 keeps retreating while VARG-2 is shot at ('+(v1.orders[0]?v1.orders[0].type:'none')+')');}
{const{G,L,v1,v2}=setup();const e=foe(G,L.x+200,L.y);G.selIds=[v1.id,v2.id];
  v2.hitBy[e.id]=G.time;B.groupOrder({world:{x:L.x+120,y:L.y+30}},false);
  ok(!v1.orders[0].retreat,'a move towards the shooter, inside its reach, is no retreat');
  v2.hitBy[e.id]=G.time;run(1);ok(v1.orders[0]&&v1.orders[0].support,'and VARG-1 supports VARG-2 against '+e.id);}
{const{G,L,v1,v2}=setup();const z=(x,y)=>B.W.zid[Math.floor(y/10)*220+Math.floor(x/10)],zu=z(v1.x,v1.y);
  let far=null;for(let a=0;a<6.28&&!far;a+=.2)for(const r of[220,260,290]){const x=v1.x+Math.cos(a)*r,y=v1.y+Math.sin(a)*r,q=z(x,y);if(q>=0&&q!==zu&&q!==z(v2.x,v2.y)){far={x,y};break;}}
  if(far){const e=foe(G,far.x,far.y);v1.orders=[{type:'move',x:v1.x,y:v1.y,post:'def'}];v2.hitBy[e.id]=G.time;run(1);
    ok(!(v1.orders[0]&&v1.orders[0].support),'no support trip to a shooter '+Math.round(Math.hypot(far.x-v1.x,far.y-v1.y))+' m away in another zone');}
  else ok(true,'(no other zone within 300 m on this island)');}
// 6. chained targets: Shift adds the next target like a waypoint, for the VARG and the Offensiv HÖK alike; when the last one falls
//    the group stays in the fight and takes what is in reach; the Defensiv HÖK takes chances close to the wing when nobody fires on it
{const{G,L,v1,v2,h1,h2}=setup();const e1=foe(G,L.x+260,L.y+40),e2=foe(G,L.x+250,L.y-60);
  B.groupOrder({enemy:e1},false);B.groupOrder({enemy:e2},true);
  ok(v1.orders.length===2&&v1.orders[0].enemy===e1&&v1.orders[1].enemy===e2,'VARG-1 has both targets in order');
  ok(h1.orders.length===2&&h1.orders[0].enemy===e1&&h1.orders[1].enemy===e2&&h1.mission&&h1.mission.cover,'the Offensiv HÖK chains the same targets and keeps guarding as its mission');
  e1.dead=true;run(.5);ok(v1.orders[0]&&v1.orders[0].enemy===e2,'when the first falls VARG-1 goes for the next');
  e2.dead=true;run(.5);ok(!v1.orders.length&&v1.engageT>G.time,'after the last the group stays in the fight for a while ('+(v1.engageT-G.time).toFixed(0)+' s)');}
{const{G,L,v1,v2,h1,h2}=setup();B.groupOrder({world:{x:L.x+40,y:L.y+10}},false);run(8);const cx=(v1.x+v2.x)/2,cy=(v1.y+v2.y)/2;const e=G.enemies.find(q=>q.dead&&!q.canAir&&B.canHit(h2,q));e.dead=false;e.hp=e.maxhp;e.x=cx+70;e.y=cy+30;e.hx=e.x;e.hy=e.y;e.lx=e.x;e.ly=e.y;e.seen=true;e.mobile=false;e.route=null;run(1);
  ok(h2.escTgt===e,'the Defensiv HÖK takes a chance on '+e.id+' close to the wing ('+(h2.escTgt?h2.escTgt.id:'none')+')');}
// 5. manual control: what the driver shoots at becomes the group's target
{const{G,L,v1,v2,h1}=setup();G.ctrl=v1.id;B.setFollowMe(true);const e=foe(G,L.x+130,L.y+10);
  G.ctrlMark={e,t:G.time};run(.5);e.visibleNow=true;
  ok(h1.escTgt===e,'the Offensiv HÖK takes the driver\'s target ('+(h1.escTgt?h1.escTgt.id:'none')+')');
  G.ctrlMark={e,t:G.time};run(.3);ok(v2.target===e||e.dead,'the following VARG fires on it ('+(v2.target?v2.target.id:'none')+')');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
