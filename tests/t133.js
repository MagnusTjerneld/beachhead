// Issue 169. Order som inte når fram (kodgenomgången 10 nov): en VARG som väntar på fältlagning retirerar när den beskjuts under 30 %; en ny order
// och Halt släpper ett väntande KROK-lyft; klicket med KROK vald och krokDefault har samma regel för vad som kan lyftas; BÄVER i en wing spränger
// kustartilleriet och lagar en skadad enhet som ensam; BÄVER utan KROK fyller inte loggen; lagningsgränsen följer BÄVER v2; och testfallen
// ospanat och natet lämnar inga spärrar kvar i G.lock.
global.performance={now:()=>0};process.env.BH_KUST='1';
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
const landPt=(G,r0,r1)=>{const C=B.CARRIER;for(let r=r0;r<r1;r+=20)for(let a=0;a<6.28;a+=.15){const x=C.x+Math.cos(a)*r,y=C.y+Math.sin(a)*r;if(B.W.grid[B.cellIdx(x,y)]===3&&B.passTank(B.cellIdx(x,y))&&!(G.lock&&G.lock[B.cellIdx(x,y)]))return{x,y};}return null;};
const fresh=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;G.known.fill(1);G.knownV++;G.mines=[];G.krokAuto=false;for(const e of G.enemies)e.dead=true;G.units=G.units.filter(v=>v.kind==='tank'||v.kind==='eng'?false:true);return G;};
/* ---- a VARG waiting for field repair retreats when it is shelled under 30 % ---- */
{const G=fresh(2929),p=landPt(G,300,900);ok(!!p,'a land point for the VARG');
  const u=B.makeUnit('tank',p.x,p.y),b=B.makeUnit('eng',p.x+60,p.y);G.units.push(u,b);
  b.orders=[{type:'repair',unit:u,post:'def'}];u.awaitRep=b.id;u.hp=u.maxhp*.2;u.lastHit=G.time;
  B.step(.05);
  ok(!u.awaitRep&&u.rtb&&G.log.some(l=>/Beskjuten medan jag väntar på lagning/.test(l.text)),'the shelled VARG gives up the wait and retreats ('+u.state+')');
  ok(!(b.orders[0]&&b.orders[0].unit===u),'and BÄVER drops the mending');}
/* ---- a new order, and Halt, let go of a lift still waited for ---- */
const lifted=(seed,how)=>{const G=fresh(seed),p=landPt(G,300,900),u=B.makeUnit('tank',p.x,p.y);G.units.push(u);G.krokAuto=false;const k=G.kroks[0];
  B.airlift([u],{x:p.x+120,y:p.y},true,false);const n=run(600,()=>u.awaitKrok);
  const waiting=!!u.awaitKrok&&k.orders.some(o=>o.type==='lift'&&o.unit===u);how(G,u,k,p);return{waiting,n,G,u,k};};
{const r=lifted(2929,(G,u,k,p)=>{B.giveOrder(u,{type:'move',x:p.x-40,y:p.y,post:'def'},false);});
  ok(r.waiting,'the VARG waits for KROK (after '+r.n+' steps)');
  ok(!r.u.awaitKrok&&!r.k.orders.some(o=>o.type==='lift'&&o.unit===r.u),'a new order through giveOrder cancels the lift');
  run(40);ok(!r.u.carried&&!r.u.awaitKrok,'and the VARG is not picked up afterwards');}
{const r=lifted(2929,(G,u,k)=>{B.setSel([u.id]);B.haltSel();});
  ok(r.waiting&&!r.u.awaitKrok&&!r.k.orders.some(o=>o.type==='lift'&&o.unit===r.u),'Halt cancels the lift');
  run(40);ok(!r.u.carried,'and the unit is not lifted to the struck order\'s goal');}
/* ---- what KROK can lift: the click and the default order use one rule ---- */
{const G=fresh(2929),k=G.kroks[0],p=landPt(G,300,900);let all=true,bad='';
  const mk=(kind,f)=>{const u=B.makeUnit(kind,p.x,p.y);G.units.push(u);if(f)f(u);return u;};
  const cases=[['tank',mk('tank')],['eng',mk('eng')],['gadda',mk('gadda')],['bjorn',mk('tank',u=>{u.ty='bjorn';})],['dead',mk('tank',u=>{u.dead=true;})],['carried',mk('tank',u=>{u.carried='K01';})],['scout',mk('scout')]];
  for(const[n,u]of cases){const d=B.krokDefault(k,{unit:u,world:{x:p.x,y:p.y}}),l=!!(d&&d.type==='lift');if(l!==B.krokCanLift(u)){all=false;bad+=' '+n;}}
  ok(all,'krokCanLift agrees with krokDefault for VARG, BÄVER, GÄDDA, BJÖRN, dead, carried and GETING'+bad);
  ok(B.krokCanLift(cases[2][1])&&!B.krokCanLift(cases[3][1]),'GÄDDA can be lifted and BJÖRN cannot');
  const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
  ok(/const liftable=krokCanLift\(pk\.unit\)/.test(src),'the click with KROK selected (onUp) uses it');}
/* ---- a BÄVER in a wing blasts the coast battery and mends, as when alone ---- */
{let seed=0;for(let s=1000;s<1100&&!seed;s++){B.newGame(s);if(B.G.kustIsle)seed=s;}ok(!!seed,'an island with a coast battery: ö '+seed);
  if(seed){B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;G.known.fill(1);G.knownV++;G.mines=[];G.krokAuto=false;
    const e=G.enemies.find(q=>q.kind==='kust');e.seen=true;e.lx=e.x;e.ly=e.y;G.enemies=G.enemies.filter(q=>q===e);
    const P=B.kustPortal(e),eng=B.makeUnit('eng',P.x+3,P.y+3),tk=B.makeUnit('tank',P.x+6,P.y+3);G.units=G.units.filter(v=>v.kind!=='eng'&&v.kind!=='tank').concat([eng,tk]);
    B.groupOrder({enemy:e,us:[tk,eng],force:true},false);
    ok(eng.orders[0]&&eng.orders[0].type==='blast'&&eng.orders[0].enemy===e,'BÄVER in a group clicked on the battery gets a blast order ('+(eng.orders[0]&&eng.orders[0].type)+')');}}
{const G=fresh(2929),p=landPt(G,300,900),eng=B.makeUnit('eng',p.x,p.y),tk=B.makeUnit('tank',p.x+10,p.y),hurt=B.makeUnit('tank',p.x+30,p.y);hurt.hp=hurt.maxhp*.4;G.units.push(eng,tk,hurt);
  B.groupOrder({unit:hurt,world:{x:hurt.x,y:hurt.y},us:[tk,eng]},false);
  ok(eng.orders[0]&&eng.orders[0].type==='repair'&&eng.orders[0].unit===hurt,'BÄVER in a group clicked on a damaged vehicle mends it ('+(eng.orders[0]&&eng.orders[0].type)+')');}
/* ---- BÄVER with no KROK to fly it: the answer is no, said once, not every three seconds ---- */
{const G=fresh(2929),p=landPt(G,300,900),u=B.makeUnit('eng',p.x,p.y);G.units.push(u);for(const k of G.kroks)k.dead=true;
  const say0=()=>G.log.filter(l=>/Ingen KROK/.test(l.text)).length;
  const a=B.autoLift(u,p.x+100,p.y);G.time+=3;const b=B.autoLift(u,p.x+100,p.y);G.time+=3;const c=B.autoLift(u,p.x+100,p.y);
  ok(a===false&&b===false&&c===false,'autoLift says false when no KROK can be ordered');
  ok(say0()<=1,'and "Ingen KROK tillgänglig" is said at most once in nine seconds: '+say0());}
/* ---- the mending cap follows the BÄVER that mends ---- */
{const G=fresh(2929),p=landPt(G,300,900),v=B.makeUnit('tank',p.x,p.y),e1=B.makeUnit('eng',p.x+20,p.y);G.units.push(v,e1);v.hp=v.maxhp*.9;
  ok(!B.damagedV(v),'at 90 % the menu offers no mending when only BÄVER v1 (cap 75 %) is there');
  const e2=B.makeUnit('eng',p.x+30,p.y);e2.v2=true;G.units.push(e2);
  ok(B.damagedV(v),'with a BÄVER v2 (cap 100 %) it does');
  /* the way to a BÄVER met in the field */
  const w=fresh(2929),q=landPt(w,300,900),t=B.makeUnit('tank',q.x,q.y),m=B.makeUnit('eng',q.x+30,q.y);m.v2=true;w.units.push(t,m);
  B.goRtb(t,'Svåra skador.');t.hp=t.maxhp*.9;t.lastHit=-100;t.medScan=0;B.step(.05);
  ok(w.log.some(l=>/lagas i fält i stället/.test(l.text)),'a retreating VARG at 90 % turns to a BÄVER v2 near it to be mended in the field');
  const w1=fresh(2929),q1=landPt(w1,300,900),t1=B.makeUnit('tank',q1.x,q1.y),m1=B.makeUnit('eng',q1.x+30,q1.y);w1.units.push(t1,m1);
  B.goRtb(t1,'Svåra skador.');t1.hp=t1.maxhp*.9;t1.lastHit=-100;t1.medScan=0;B.step(.05);
  ok(!w1.log.some(l=>/lagas i fält i stället/.test(l.text)),'but not to a BÄVER v1, which mends only to 75 %');}
/* ---- the test cases ospanat and natet leave no sector locked ---- */
for(const id of ['ospanat','natet']){B.testfall(id);const G=B.G;
  ok(G.barriers.every(b=>b.cleared)&&G.lockN===0,id+': the barriers are gone and so is the lock ('+G.lockN+' cells)');}
console.log(fail?fail+' FAIL':'all ok');process.exit(fail?1:0);
