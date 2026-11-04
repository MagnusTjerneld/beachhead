// Issue 129 (Magnus 3 nov): the campaign's first scenario, Strömmen och cisternerna, as a prototype behind ?scen=stroemmen. The framework
// (SCEN, scenTick), the island, the dark and the power, the power station and the oil depot with four cisterns, the counterattack and
// the tanker. Headless: the points are set taken and the steps stepped.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const crypto=require('crypto');
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
const sigOf=seed=>{B.newGame(seed,'djup',{});const G=B.G;
  const s=G.mission+'|'+G.doc+'|'+G.doy+'|'+G.tod.toFixed(3)+'|'+G.relays.map(r=>r.id+r.type+Math.round(r.x)+','+Math.round(r.y)).join(';')+'|'+G.enemies.map(e=>e.id+e.kind+Math.round(e.x)+','+Math.round(e.y)).join(';')+'|'+G.structs.map(e=>e.id+e.kind+Math.round(e.x)).join(';');
  return crypto.createHash('md5').update(s).digest('hex');};
const SC=B.SCEN.stroemmen;
// without the flag the world is as it was (hashes taken from the game before the scenario, same doctrine)
ok(sigOf(1264)==='c81ed41ce444b3ffbd4722b9650a6cca'&&sigOf(2547)==='779a3b392713a53536d7bb8bc76eaa44'&&sigOf(4741)==='c54ea01e960c90619455ebdfa3f786b9','without the flag the island, points, enemies and buildings are as before');
ok(B.G.scen===null&&B.G.mission==='frita'&&B.G.power===undefined,'no scenario state without the flag');
ok(B.ENEMY_CFG.budget===130,'the enemy budget is back to 130');
// the scenario's island
B.newGame(1,'auto',{scen:'stroemmen'});let G=B.G;
ok(G.scen&&G.mission==='scen'&&G.seed===SC.seed&&G.doc===SC.doc&&G.doy===SC.when.doy&&G.tod===SC.when.tod,'the flag fixes island '+SC.seed+', doctrine, date and hour');
ok(B.ENEMY_CFG.budget===130,'and the budget is back after the island is made');
ok(G.power===false,'the island starts dark');
ok(Object.keys(G.scen.st).length===SC.steps.length,'the scenario has its '+SC.steps.length+' steps');
ok(G.relays.some(r=>r.type==='kraft')&&G.relays.some(r=>r.type==='olja'),'the power station and the oil depot are points');
{const C=G.structs.filter(s=>s.kind==='cistern'),big=C.filter(s=>s.big),small=C.filter(s=>s.big===false);
  ok(big.length===4&&small.length>=4&&small.length<=10&&!G.structs.some(s=>s.kind==='pumphus'),'four big cisterns, '+small.length+' small (4 to 10), and the pump house no target (4 nov)');
  ok(big.every(s=>s.maxhp===B.OIL.bigHp)&&small.every(s=>s.maxhp===B.OIL.smallHp&&s.r<6),'the big ones have '+B.OIL.bigHp+' hull and the small ones '+B.OIL.smallHp);}
{const S=G.scen.sites,J=S.jetty,d=B.W.harbor.dock;
  ok(!!J,'the oil jetty has a berth');
  if(J){let deep=true;for(let s=-85;s<=85;s+=5)for(let w=-13;w<=13;w+=6.5)if(B.heightAt(J.x+J.ux*s-J.uy*w,J.y+J.uy*s+J.ux*w)>-3)deep=false;
    ok(deep,'the tanker\'s berth is 3 m deep or more under all of her and 10 m beyond her ends');
    ok(J.dd>=130&&Math.hypot(J.x-d.x,J.y-d.y)>=130,'the berth lies 130 m or more from Birka\'s ('+Math.round(Math.hypot(J.x-d.x,J.y-d.y))+' m)');
    ok(J.gap<=45,'its side is '+J.gap+' m from the shore (45 at most)');
    const near=S.tanks.filter(t=>t.big).map(t=>Math.hypot(t.x-J.root.x,t.y-J.root.y));ok(Math.min(...near)<=220,'the nearest big cistern is '+Math.round(Math.min(...near))+' m from the jetty\'s root');
    const last=S.pipes.find(l=>{const e=l[l.length-1];return Math.hypot(e.x-J.plat.x,e.y-J.plat.y)<1;});ok(!!last&&last.some(p=>Math.hypot(p.x-S.pump.x,p.y-S.pump.y)<1),'a pipe runs from the big cisterns by the pump house out onto the jetty');}
  const big=S.tanks.filter(t=>t.big),hd=S.pipes[0];ok(big.every(t=>S.pipes.some(l=>l.length===2&&Math.abs(l[0].x-t.x)<.1&&Math.abs(l[1].y-hd[0].y)<.1)),'every big cistern has a pipe to the header');
  ok(S.smalls.every(sm=>S.pipes.some(l=>l.length===3&&Math.abs(l[2].y-sm.y)<.1)),'every small group is piped to the big one');
  ok(B.W.trees.every(t=>Math.hypot(t.x-S.cist.x,t.y-S.cist.y)>B.OIL.bigR+20),'no trees on the big pad');
  // the bunds and the pump house shut to vehicles, every cell under them (Magnus 4 nov, provspel kp04: VARG drove through the cisterns)
  const shut=(x,y)=>!B.passLand(B.cellIdx(x,y));
  ok(big.every(t=>[[0,0],[12,12],[-12,12],[12,-12],[-12,-12]].every(([dx,dy])=>shut(t.x+dx,t.y+dy))),'each big bund is shut to vehicles, not only its middle');
  ok(S.tanks.filter(t=>!t.big).every(t=>shut(t.x,t.y))&&shut(S.pump.x,S.pump.y),'the small groups and the pump house too');
  ok(G.enemies.every(e=>e.dead||B.W.grid[B.cellIdx(e.x,e.y)]!==5),'no enemy left standing inside a bund');
  const o=G.relays.find(q=>q.type==='olja'),L=B.W.landing;ok(!!B.astar(L.x,L.y,o.x,o.y,B.passLand,()=>1),'the depot\'s point can still be reached on land');}
{const r=G.relays.find(q=>q.type==='kraft'),o=G.relays.find(q=>q.type==='olja'),hq=B.W.harborQ,d=B.W.harbor.dock,dq=Math.min(Math.hypot(o.x-hq.x,o.y-hq.y),Math.hypot(o.x-d.x,o.y-d.y));
  ok(dq>=60&&dq<=220,'the depot lies 60 to 220 m from the quay ('+Math.round(dq)+', 4 nov: by the harbour)');
  ok(B.scenShore(B.W)[B.cellIdx(r.x,r.y)]>=220,'the power station lies well inland ('+Math.round(B.scenShore(B.W)[B.cellIdx(r.x,r.y)])+' m from the shore)');
  ok(r.guards.length>=2&&o.guards.length>=3,'the points are guarded ('+r.guards.length+' and '+o.guards.length+')');}
// the dark and the power: windows and lamps share 0 without power, then rise over four seconds
ok(B.scenWin()===0,'no window light without power');
// the steps in order
G.running=true;G.known.fill(1);G.knownV++;B.LOS.on=false;
const st=id=>G.scen.st[id],open=()=>B.scenStepNow().map(s=>s.id).join(',');
run(2);ok(open()==='land','step 0 is open at the start ('+open()+')');
st('land').t0=G.time-61;run(1);ok(st('land').done&&open()==='strom','step 0 is done after 60 s and the power station is next ('+open()+')');
const kv=G.relays.find(r=>r.type==='kraft'),oh=G.relays.find(r=>r.type==='olja'),rd=G.relays.find(r=>r.type==='radar'),hn=G.relays.find(r=>r.type==='hamn');
// a point taken early counts at once when its step opens, and the later steps wait for the ones before
rd.captured=true;run(2);ok(!st('mast').open&&open()==='strom','the radio mast taken early waits: its step is not open before the power ('+open()+')');
const res0=G.res;B.capturePoint(kv,null);run(2);
ok(G.power===true&&st('strom').done,'the power station taken: power on');
ok(G.res>=res0+150,'and 150 material given');
ok(st('mast').done&&!!G.scen.marks&&open()==='cist,hamn','the mast taken before counts at once: next the depot and the harbour at the same time ('+open()+')');
run(1);ok(B.scenWin()<1,'the windows come up gradually');run(90);ok(B.scenWin()===1,'and are lit after four seconds');
ok(G.scen.marks.some(m=>m.id==='olja'),'the depot is marked on the chart');
// the depot taken: the counterattack
B.capturePoint(oh,null);run(2);
ok(st('cist').done&&st('motanfall').open,'the depot taken: the counterattack step opens');
ok(G.scen.marks.some(m=>m.id==='strand'),'and its beach is marked');
run(Math.round(46/.05));
{const w1=G.enemies.filter(e=>e.scenG==='w1');
  ok(w1.length===9,'the first wave has landed: 9 men and vehicles ('+w1.length+')');
  ok(w1.every(e=>e.tgtThing==='cistern')&&w1.filter(e=>e.march).length>=8,'they are sent for the cisterns and march ('+w1.filter(e=>e.march).length+' on the way)');
  const s2=G.scen.sites.s2;ok(w1.every(e=>Math.hypot(e.x-s2.x,e.y-s2.y)<120),'at the second beach');
  ok(Math.hypot(s2.x-G.scen.sites.cist.x,s2.y-G.scen.sites.cist.y)>=450,'which is far from the cisterns ('+Math.round(Math.hypot(s2.x-G.scen.sites.cist.x,s2.y-G.scen.sites.cist.y))+' m)');}
// a rifleman sent for the cisterns shoots them
{const c=G.structs.find(s=>s.kind==='cistern'),hp0=c.hp;const e=B.makeEnemy({id:'XI',kind:'tank',x:c.x+60,y:c.y});e.tgtThing='cistern';e.seen=false;e.scenG='x';G.enemies.push(e);
  run(200);ok(c.hp<hp0||G.structs.filter(s=>s.kind==='cistern').some(s=>s.hp<s.maxhp),'a tank sent for the cisterns shoots one ('+Math.round(hp0)+' to '+Math.round(c.hp)+')');e.dead=true;}
// the second wave comes only if the first is alive
{const alive=G.enemies.filter(e=>e.scenG==='w1'&&!e.dead).length;for(let i=0;i<30;i++){run(100);for(const s of G.structs)if(s.kind==='cistern'&&!s.dead)s.hp=s.maxhp;}/* the cisterns are held, unlike when nobody defends them */
  ok((G.enemies.filter(e=>e.scenG==='w2').length>0)===(alive>=4),'the second wave follows the first if four or more are alive ('+alive+')');}
// all dead (or 405 s) closes the step
for(const e of G.enemies)if(e.scenG)e.dead=true;
G.structs.filter(s=>s.kind==='cistern').forEach(s=>{s.hp=s.maxhp;});
run(5);ok(st('motanfall').done,'the counterattack step is done when the landed are dead');
ok(!st('tanker').open,'the tanker waits for the harbour');
// the harbour: taken and Birka docked
hn.captured=true;G.harbor.secured=true;run(2);ok(!st('hamn').done,'the harbour taken is not enough: Birka must lie at the quay');
G.harbor.docked=true;run(2);ok(st('hamn').done,'Birka docked and the harbour taken: done');
ok(st('tanker').open&&G.scen.ships.length===1,'and the tanker is under way');
// the tanker
{const tf=G.scen.ships[0],R=G.scen.tfRoute,hq=B.W.harborQ;
  ok(R&&R.length>20,'its route is planned ('+(R&&R.length)+' poses)');ok(Math.hypot(tf.x-hq.x,tf.y-hq.y)>1500,'it starts far out ('+Math.round(Math.hypot(tf.x-hq.x,tf.y-hq.y))+' m from the harbour)');
  const d=B.W.harbor.dock,end=R[R.length-1],J=G.scen.sites.jetty;ok(Math.hypot(end.x-d.x,end.y-d.y)>=150,'and ends 150 m or more from Birka\'s berth ('+Math.round(Math.hypot(end.x-d.x,end.y-d.y))+' m)');
  ok(J&&Math.hypot(end.x-J.x,end.y-J.y)<.5&&Math.abs(Math.sin(end.a-J.a))<1e-6,'alongside the oil jetty');
  {const p=R[R.length-2];ok(Math.abs(Math.hypot(p.x-J.x,p.y-J.y)-B.OIL.stage)<1,'from a pose '+B.OIL.stage+' m off it, sideways');}
  // planned with its own 150 m hull, and with the side to the jetty that needs the least turning on the spot (Magnus 4 nov, provspel kp09)
  {let spin=0;for(let i=1;i<R.length-1;i++)if(Math.hypot(R[i].x-R[i-1].x,R[i].y-R[i-1].y)<1&&Math.hypot(R[i].x-J.x,R[i].y-J.y)<400)spin+=Math.abs(Math.atan2(Math.sin(R[i].a-R[i-1].a),Math.cos(R[i].a-R[i-1].a)));
   ok(spin<.6,'no turn on the spot near the jetty ('+Math.round(spin*180/Math.PI)+' degrees)');
   B.NAV.hull=B.TANKER_HULL;const bad=R.slice(1,-1).filter(q=>!B.navFree(B.W,q.x,q.y,q.a-Math.PI)).length;B.NAV.hull=null;ok(!bad,'its whole hull clear of land the whole way ('+bad+' poses not)');}
  // a coast bunker in reach shoots it
  const x0=tf.x,y0=tf.y;let vmax=0;run(1200,()=>{vmax=Math.max(vmax,tf.v);return false;});ok(Math.hypot(tf.x-x0,tf.y-y0)>100&&vmax<=6.01&&vmax>5,'it speeds up to 6 m/s and no more ('+Math.round(Math.hypot(tf.x-x0,tf.y-y0))+' m in 60 s, top speed '+vmax.toFixed(2)+')');
  const hp0=tf.hp,bk=B.makeEnemy({id:'XB',kind:'turret',x:tf.x+100,y:tf.y,coast:true});bk.seen=true;G.enemies.push(bk);run(160);ok(tf.hp<hp0,'a coast bunker in reach shoots it ('+hp0+' to '+tf.hp+')');bk.dead=true;tf.hp=tf.maxhp;
  let n=0;while(!tf.docked&&n++<4000)B.step(.25);
  ok(tf.docked,'it goes in and docks ('+Math.round(G.time)+' s in all)');run(3);}
ok(G.scen.done&&G.over&&!G.failed,'the scenario is won');
// three cisterns lost fail the scenario
B.newGame(1,'auto',{scen:'stroemmen'});G=B.G;G.running=true;run(2);
for(const s of G.structs.filter(q=>q.kind==='cistern'&&q.big===false))B.killStruct(s,null,'shot');
G.scen.st.cist.open=true;run(2);ok(!G.over,'all the small cisterns lost: no failure, only the big ones count');
for(const s of G.structs.filter(q=>q.kind==='cistern'&&q.big).slice(0,2))B.killStruct(s,null,'shot');
run(2);ok(!G.over,'two of four cisterns lost: not yet');
G.scen.st.cist.open=true;
B.killStruct(G.structs.filter(q=>q.kind==='cistern'&&q.big&&!q.dead)[0],null,'shot');run(2);
ok(G.over&&G.failed,'three of four cisterns lost: the scenario fails');
// a tanker that is sunk fails it
B.newGame(1,'auto',{scen:'stroemmen'});G=B.G;G.running=true;run(2);
{const S=G.scen;S.ships.push({id:'tf',label:'TF',x:0,y:0,a:0,hp:0,maxhp:500,dead:true,hitBy:{},isShip:true});run(2);ok(G.over&&G.failed,'a sunk tanker fails the scenario');}
// BÄVER cannot pull a cistern down
B.newGame(1,'auto',{scen:'stroemmen'});G=B.G;G.running=true;
{const c=G.structs.find(q=>q.kind==='cistern'),u=B.makeUnit('eng',c.x,c.y+15);G.units.push(u);u.orders=[{type:'demolish',s:c,post:'def'}];run(60);ok(!c.dead&&c.prog===0&&!u.orders.length,'BÄVER\'s order to demolish a cistern is refused');}
// the hash of the scenario game
{const q=B.banaParse(B.banaHash(B.resultOf()));ok(!q||q.m==='scen','the result of a scenario game carries the mission scen');}
console.log(fail?'FAILED '+fail:'ALL OK');process.exit(fail?1:0);
