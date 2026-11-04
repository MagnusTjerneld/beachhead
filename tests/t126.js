// BJÖRN and BÄVER v2 (issue 92, Magnus 4 nov): values, directional armour, the lock until Birka has berthed in the harbour, the limit of two, the drive
// off Birka by the side ramp, no lift by KROK (nor of its wreck), no service on Birka's pads, BÄVER v2's field repair to 100 % and the upgrade
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return G().time;B.step(.05);}return f()?G().time:null;};
let seed=0;for(const sd of[2024,9949,1490,3402,9052,1264,2547,3100,2169]){B.newGame(sd);if(G().harbor){seed=sd;break;}}
ok(!!seed,'an island with a harbour: '+seed);G().running=true;G().netAll=true;
// 1. values
{const T=B.TYPES.bjorn;ok(T.cost===360&&T.hp===400&&T.speed===6&&T.range===160&&T.dmg===40&&T.rate===.25&&T.acc===.85&&T.vision===90&&T.build===40,'BJÖRN: 360 material, 400 hull, speed 6, 40 damage at 160 m, 0.25 a second, 0.85, sight 90, 40 s');
  const u=B.makeUnit('bjorn',100,100);ok(u.kind==='tank'&&u.ty==='bjorn'&&u.hp===400&&u.name==='BJÖRN J01'&&u.range===160,'a BJÖRN is a tank of type bjorn with its own call sign ('+u.name+')');
  G().units.push(u);const v=B.makeUnit('tank',100,100);G().units.push(v);const u2=B.makeUnit('bjorn',0,0);G().units.push(u2);ok(v.name==='VARG V01'&&u2.name==='BJÖRN J02','the call numbers count per kind ('+v.name+')');
  ok(B.BJORN.max===2&&B.BJORN.armor.front===.5&&B.BJORN.armor.side===1&&B.BJORN.armor.rear===1.5&&B.BJORN.seen===1.5&&B.BJORN.mine===2,'armour .5 / 1 / 1.5, seen 1.5 times as far, mines twice, at most 2');
  ok(B.ENG2.cost===190&&B.ENG2.hp===70&&B.ENG2.cap===1&&B.ENG2.upg===50&&B.ENG2.upgT===20,'BÄVER v2: 190, 70 hull, cap 100 %, upgrade 50 and 20 s');
  G().units=G().units.filter(x=>x.ty!=='bjorn'&&x.kind!=='tank');ok(B.homeAt(u,'ship')===null&&B.homeFor(u).ship===false,'BJÖRN has no service on Birka');}
// 2. directional armour
{const u=B.makeUnit('bjorn',500,500);u.heading=0;const at=(a)=>({x:500+Math.cos(a)*100,y:500+Math.sin(a)*100});
  ok(B.armorF(u,at(0))===.5&&B.armorF(u,at(.5))===.5,'a shot from ahead takes half');
  ok(B.armorF(u,at(Math.PI/2))===1&&B.armorF(u,at(-Math.PI/2))===1,'from the side it takes all');
  ok(B.armorF(u,at(Math.PI))===1.5&&B.armorF(u,at(Math.PI*.9))===1.5,'from behind it takes half again');
  const v=B.makeUnit('tank',500,500);v.heading=0;ok(B.armorF(v,at(Math.PI))===1,'a VARG has no directional armour');}
// 3. locked until the harbour, then at most two
const H=G().harbor;
  const hitBy=(t,a)=>{const h0=t.hp;B.resolveShot({tg:t,a,ws:'e_shell',hit:true,dmg:20,side:'e',x2:t.x,y2:t.y,h2:3,t:0,ttl:1,w:null});return h0-t.hp;};
  {const b=B.makeUnit('bjorn',500,500);b.heading=0;G().units.push(b);const e={x:600,y:500,kind:'tank',id:'ex'};const e2={x:400,y:500,kind:'tank',id:'ey'},e3={x:500,y:600,kind:'tank',id:'ez'};
   const f=hitBy(b,e),r=hitBy(b,e2),sd=hitBy(b,e3);ok(f>0&&Math.abs(r/f-3)<.01&&Math.abs(sd/f-2)<.01,'resolved shots: ahead '+f+', side '+sd+', behind '+r+' hull points');G().units=G().units.filter(x=>x!==b);}
{ok(B.buildLock('bjorn')&&/hamnen/.test(B.buildLock('bjorn')),'locked while Birka lies at anchor: "'+B.buildLock('bjorn')+'"');
  G().res=2000;const r0=G().res;ok(B.queueBuild('bjorn')===false&&G().res===r0&&G().build.length===0,'the order is refused and costs nothing');
  ok(B.buildCost('eng')===150&&!B.unlocked(),'a BÄVER still costs 150');
  const d=B.W.harbor.dock;B.moveCarrier(d.x,d.y,d.a);H.secured=true;H.docked=true;
  ok(B.unlocked()&&B.buildLock('bjorn')===null,'unlocked once she has berthed');
  ok(B.queueBuild('bjorn')&&G().res===r0-360,'one BJÖRN queued for 360');
  ok(B.queueBuild('bjorn'),'a second');ok(B.buildLock('bjorn')&&!B.queueBuild('bjorn'),'the third is refused: "'+B.buildLock('bjorn')+'"');
  B.cancelBuild('ship',1);B.cancelBuild('ship',0);ok(G().res===r0,'the queue is struck and the material comes back');
  ok(B.buildCost('eng')===190,'a new BÄVER now costs 190');}
// 4. built on Birka, drives off by the side ramp and does not drive in water
{const G0=G();G0.res=2000;G0.units=G0.units.filter(u=>u.kind!=='eng');B.queueBuild('bjorn');
  const t=until(()=>G().units.some(u=>u.ty==='bjorn'),50);ok(t!=null,'built in about 40 s ('+(t&&t.toFixed(0))+')');
  const u=G().units.find(x=>x.ty==='bjorn');ok(!!u&&u.orders.length===1,'it has an order to the quay');
  const q=B.bjornSpot();ok(!!q,'a spot on the quay by the side ramp');
  const sx=u.x,sy=u.y;const t2=until(()=>Math.hypot(u.x-q.x,u.y-q.y)<14,120);if(t2==null)console.log('  at',u.x.toFixed(0),u.y.toFixed(0),'from',sx.toFixed(0),sy.toFixed(0),'to',q.x.toFixed(0),q.y.toFixed(0),'onDeck',B.onDeck&&B.onDeck(u.x,u.y),u.orders.length);ok(t2!=null,'it drives off by the side ramp to the quay ('+u.state+')');
  ok(B.passLand(B.cellIdx(u.x,u.y)),'and stands on land');
  // water: an order across the sea gives no way
  const w=B.W;let sea=null;for(let i=0;i<w.grid.length&&!sea;i+=97)if(w.grid[i]<=1)sea=B.cellCenter?B.cellCenter(i):null;
  u.orders=[];u.path=null;const L=B.W.landing;B.giveOrder(u,{type:'move',x:L.x,y:L.y,post:'def'},false);run(5);
  ok(B.passLand(B.cellIdx(u.x,u.y)),'after 5 s of driving it is still on land');
  // not lifted by KROK
  ok(B.krokDefault(G().kroks[0],{unit:u})===null,'KROK has no order for a BJÖRN (krokDefault)');
  const k=G().kroks[0];k.x=u.x;k.y=u.y;k.alt=10;const h=B.krokHookTarget(k);ok(!h||h.type!=='lift'||h.unit!==u,'KROK\'s hook does not take it');
  // its wreck
  B.killUnit(u,'test');const w1=G().wrecks.find(x=>x.kind==='bjorn');ok(!!w1&&w1.value===180,'its wreck is kind bjorn, worth 180');
  const pick=B.krokPick(k);ok(!pick||pick.kind!=='bjorn','KROK does not pick the wreck');
  const e1=G().units.find(x=>x.kind==='eng');ok(!e1||!e1.v2,'a BÄVER from the start is v1');}
for(const e of G().enemies)e.dead=true;
// 5. BÄVER v2: built as v2, repairs to 100 %, v1 to 75 %
{G().res=2000;G().units=G().units.filter(x=>x.kind!=='eng'&&x.ty!=='bjorn');B.queueBuild('eng');
  ok(until(()=>G().units.some(x=>x.kind==='eng'),40)!=null,'a BÄVER built');const e=G().units.find(x=>x.kind==='eng');
  ok(e.v2&&e.maxhp===70&&e.hp===70&&/v2/.test(e.name)&&e.cost===190,'built as v2: 70 hull ('+e.name+')');
  const L=B.W.landing,v=B.makeUnit('tank',L.x,L.y);G().units.push(v);e.x=L.x+10;e.y=L.y;e.orders=[];e.deckTo=null;e.path=null;
  v.hp=v.maxhp*.3;e.hp=e.maxhp;G().res=500;B.giveOrder(e,{type:'repair',unit:v,post:'def'},false);
  const t=until(()=>v.hp>=v.maxhp-.5,200);ok(t!=null,'BÄVER v2 repairs a VARG to 100 % ('+Math.round(v.hp/v.maxhp*100)+' %)');
  // v1 (the v2 is taken away so that it does not mend it first)
  G().units=G().units.filter(x=>x!==e);
  const e1=B.makeUnit('eng',L.x+10,L.y);G().units.push(e1);e.orders=[];const v2=B.makeUnit('tank',L.x+30,L.y);G().units.push(v2);v2.hp=v2.maxhp*.3;e1.x=L.x+30;e1.y=L.y+10;e1.orders=[];
  B.giveOrder(e1,{type:'repair',unit:v2,post:'def'},false);run(120);ok(v2.hp/v2.maxhp>.74&&v2.hp/v2.maxhp<.77,'a BÄVER v1 stops at 75 % ('+Math.round(v2.hp/v2.maxhp*100)+' %)');
  // 6. the upgrade of a v1 on Birka
  const o=B.makeUnit('eng',0,0);const p=B.shipPos(8,-10);o.x=p[0];o.y=p[1];G().units.push(o);G().res=100;
  ok(B.upgradable(o),'a v1 on Birka\'s deck can be upgraded');const r0=G().res;ok(B.startUpgrade(o)&&G().res===r0-50,'it costs 50');
  run(10);ok(!o.v2,'not done after 10 s');run(11);ok(o.v2&&o.maxhp===70&&o.hp===70&&!o.upg,'done after 20 s: v2 with 70 hull ('+o.name+')');
  ok(!B.upgradable(o)&&!B.upgradable(e1),'a v2 cannot be upgraded, nor one on the ground');}
console.log(fail?fail+' FAILED':'all ok');process.exit(fail?1:0);
