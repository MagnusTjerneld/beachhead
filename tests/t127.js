// Issue 129 (Magnus 4 nov): the campaign's second scenario, Färjeläget. Take the harbour within 12 minutes, hold it 10 minutes against three growing waves from
// two flanks, a ferry ties up at the quay after each wave that is beaten and unloads a free VARG; won when the third wave is beaten and the third ferry has
// unloaded; lost when the time of step 1 runs out or the enemy holds the quay. Headless: the points are set taken, the waves killed on the spot, the steps stepped.
// The model of the ferry (mkFerry) is cut out of g2.js the way t120 does.
const fs=require('fs'),path=require('path');global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const SC=B.SCEN.farjelaget;
const stepN=(n,dt,f)=>{for(let i=0;i<n;i++){B.step(dt||.2);if(f&&f())return i;if(B.G.over)return i;}return n;};
const fresh=()=>{B.newGame(1,'auto',{scen:'farjelaget'});const G=B.G;G.running=true;G.known.fill(1);G.knownV++;B.LOS.on=false;return G;};
const hamn=G=>G.relays.find(r=>r.type==='hamn');
const clearNear=(G,H)=>{for(const e of G.enemies)if(Math.hypot(e.x-H.x,e.y-H.y)<250)e.dead=true;};
// without the flag nothing changes
B.newGame(2547,'djup',{});ok(B.G.scen===null&&B.G.mission==='frita','without the flag no scenario state');
ok(B.scenOfKey('scenfarjelaget')===SC&&B.scenOfKey('scen')===B.SCEN.stroemmen&&B.scenOfKey('frita')===null,'the result key names the scenario (scen, scenfarjelaget)');
ok(!!B.MISSION.scenfarjelaget&&B.MISSION.scenfarjelaget.w===0,'the second scenario is a mission entry for the results and the links, never drawn');
ok(B.banaParse('#bana-1333-fastning-scenfarjelaget')&&B.banaParse('#bana-1333-fastning-scenfarjelaget').m==='scenfarjelaget'&&B.banaWhen({m:'scenfarjelaget'}).uppdrag==='scenfarjelaget','the link and the replay carry the scenario');
// Ny ö › Uppdrag › Färjeläget starts it without the flag in the address
B.newGame(5,'auto',{uppdrag:'scenfarjelaget'});
ok(B.G.scen&&B.G.scen.id==='farjelaget'&&B.G.mission==='scen'&&B.G.seed===SC.seed&&B.scenKeyOf(B.G)==='scenfarjelaget','the uppdrag choice starts Färjeläget on island '+SC.seed);
// the ordinary start
let G=fresh();
ok(G.seed===SC.seed&&G.doc===SC.doc&&G.doy===SC.when.doy&&G.tod===SC.when.tod,'island '+SC.seed+', doctrine, date and hour are fixed');
ok(B.ENEMY_CFG.budget===130,'the enemy budget is back after the island is made');
ok(G.res===500&&G.units.map(u=>u.kind).sort().join()==='eng','the ordinary start: 500 material, BÄVER (nothing follows from the first scenario)');
ok(G.power===undefined,'no dark and no power in this scenario');
ok(Object.keys(G.scen.st).join()==='hamn,hall','two steps: take the harbour, hold it');
const H=hamn(G),S=G.scen,sit=S.sites;
ok(!!H&&H.guards.length>=4,'the harbour is guarded ('+H.guards.length+')');
// the sites
{const b=sit.berth,W=B.W,L2=B.FERRY.hull[0]/2,B2=B.FERRY.hull[1]/2;let deep=true;
  for(let s=-L2;s<=L2-4;s+=6)for(let w=-B2;w<=B2;w+=5)if(B.heightAt(b.x+b.ux*s-b.uy*w,b.y+b.uy*s+b.ux*w)>-B.FERRY.depth)deep=false;
  ok(deep,'the berth is '+B.FERRY.depth+' m deep or more under all of her');
  const d=W.harbor.dock;ok(Math.hypot(b.x-d.x,b.y-d.y)>=B.FERRY.min,'the berth lies '+Math.round(Math.hypot(b.x-d.x,b.y-d.y))+' m from Birka\'s');
  ok(W.grid[B.cellIdx(sit.lp.x,sit.lp.y)]!==0&&B.passLand(B.cellIdx(sit.lp.x,sit.lp.y)),'the ramp lands on land');
  ok(!!B.astar(sit.lp.x,sit.lp.y,H.x,H.y,B.passLand,()=>1),'and from there a way on land to the harbour');
  const R=sit.plan.route,e=R[R.length-1];ok(Math.hypot(e.x-b.x,e.y-b.y)<.5&&Math.hypot(R[0].x-b.x,R[0].y-b.y)>300,'the ferry\'s way in ends at the berth and starts '+Math.round(Math.hypot(R[0].x-b.x,R[0].y-b.y))+' m out');
  ok(Math.abs(Math.sin((e.a-(b.a+Math.PI))/2))<1e-6,'bow to the shore');
  ok(sit.s2&&sit.s3&&Math.hypot(sit.s2.x-sit.s3.x,sit.s2.y-sit.s3.y)>=400,'two flanks at least 400 m apart');}
// step 1 is open from the start; its limit of 12 minutes fails the mission
stepN(3,.05);ok(B.scenStepNow().map(s=>s.id).join()==='hamn','step 1 is open');
{const G2=fresh();stepN(2,.05);G2.scen.st.hamn.t0=G2.time-721;stepN(2,.05);ok(G2.over&&G2.failed,'the time for step 1 out: the mission is lost');}
{const G2=fresh();stepN(2,.05);G2.scen.st.hamn.t0=G2.time-700;stepN(2,.05);ok(!G2.over,'at 11:40 it is not');}
// the harbour taken: step 2, waves queued; an own VARG stands at the quay
G=fresh();const S2=G.scen,H2=hamn(G);clearNear(G,H2);
const own=B.makeUnit('tank',H2.x,H2.y);G.units.push(own);own.orders=[];own.hold=true;
B.capturePoint(H2,null);stepN(3,.05);for(const e of G.enemies)if(e.mobile&&!e.scenG)e.dead=true;// the three the capture sends are out of this test
ok(B.scenStepNow().map(s=>s.id).join()==='hall'&&S2.st.hamn.done,'the harbour taken opens step 2');
ok(S2.marks.length===2,'the two flank beaches are marked');
const t0=S2.st.hall.t0,rec={},fer={};
// the waves are killed the moment they land (their size, time, march and landing places are noted first), so the ferries come one after the other
const watch=()=>{for(const e of G.enemies)if(e.scenG&&!e.dead){const r=rec[e.scenG]||(rec[e.scenG]={n:0,t:G.time-t0,march:true,a:0,b:0});r.n++;if(!(e.march&&e.march.length))r.march=false;
    if(Math.hypot(e.x-sit.s2.x,e.y-sit.s2.y)<80)r.a++;if(Math.hypot(e.x-sit.s3.x,e.y-sit.s3.y)<80)r.b++;e.dead=true;}
  for(const f of S2.ships){const r=fer[f.id]||(fer[f.id]={});if(f.phase==='unload'&&!r.dock){r.dock=Math.hypot(f.x-sit.berth.x,f.y-sit.berth.y)<1;r.t=G.time;}if(f.gone&&!r.gone)r.gone=true;}};
const tanks0=G.units.filter(u=>u.kind==='tank').length;
stepN(6000,.2,()=>{watch();return G.over;});
ok(['w1','w2','w3'].every(k=>rec[k]),'all three waves came');
ok(rec.w1.t>=59&&rec.w1.t<65&&rec.w2.t>=239&&rec.w2.t<245&&rec.w3.t>=419&&rec.w3.t<425,'at 60, 240 and 420 s after the harbour ('+[rec.w1,rec.w2,rec.w3].map(r=>r.t|0).join(', ')+')');
ok(rec.w1.n<rec.w2.n&&rec.w2.n<rec.w3.n,'the waves grow: '+[rec.w1,rec.w2,rec.w3].map(r=>r.n).join(', '));
ok([rec.w1,rec.w2,rec.w3].every(r=>r.march),'every wave marches on the harbour');
ok(rec.w1.a>0&&rec.w1.b===0&&rec.w2.b>0&&rec.w2.a===0&&rec.w3.a>0&&rec.w3.b>0,'wave 1 lands on flank 1, wave 2 on flank 2 and wave 3 on both');
ok(S2.ships.length===3&&S2.ships.every(f=>f.ferry),'a ferry for each wave beaten');
ok(['f1','f2','f3'].every(k=>fer[k]&&fer[k].dock),'each ties up at the berth');
ok(['f1','f2','f3'].every(k=>fer[k]&&fer[k].gone)||S2.ships[2].phase==='wait'||S2.ships[2].phase==='out'||G.over,'and leaves again');
{const nt=G.units.filter(u=>u.kind==='tank');ok(nt.length===tanks0+3&&nt.slice(1).every(u=>Math.hypot(u.x-sit.lp.x,u.y-sit.lp.y)<20),'three free VARG stand on the shore at the ramp');}
ok(S2.ferryDone===3&&G.over&&!G.failed&&S2.done,'won with three ferries unloaded and the harbour held');
ok(G.time-t0>=600,'not before 10 minutes ('+(G.time-t0|0)+' s)');
// the quay lost: enemy troops at the quay and none of ours for def.quay.t seconds
{const G3=fresh(),H3=hamn(G3);clearNear(G3,H3);B.capturePoint(H3,null);stepN(3,.05);
  const e=G3.enemies.find(q=>!q.dead&&q.kind==='inf')||G3.enemies.find(q=>!q.dead&&q.mobile);e.dead=false;e.x=e.px=H3.x+10;e.y=e.py=H3.y;e.hp=1e6;e.march=null;e.leash=0;e.mobile=true;
  stepN(40,.2,()=>G3.over);ok(!G3.over,'the enemy at the quay for 8 s is not yet a loss');
  stepN(500,.2,()=>{e.dead=false;e.x=e.px=H3.x+10;e.y=e.py=H3.y;return G3.over;});ok(G3.over&&G3.failed,'held for '+B.SCEN.farjelaget.quay.t+' s with none of ours there: the mission is lost');}
{const G3=fresh(),H3=hamn(G3);clearNear(G3,H3);const v=B.makeUnit('tank',H3.x+30,H3.y);v.hold=true;G3.units.push(v);B.capturePoint(H3,null);stepN(3,.05);
  const e=G3.enemies.find(q=>!q.dead&&q.mobile);e.dead=false;e.x=e.px=H3.x+10;e.y=e.py=H3.y;e.march=null;e.leash=0;
  // the enemy cannot hurt the VARG here: it is only a position test of the rule
  for(const q of G3.enemies)q.range=0;
  stepN(400,.2,()=>G3.over);ok(!(G3.over&&G3.failed),'with one of ours at the quay the quay is not lost');}
// the model
{const THREE=require('three');const src=fs.readFileSync(path.join(__dirname,'g2.js'),'utf8').split('\r').join('');
  const MARK='\nif(!hasDOM)return;\n',i=src.indexOf(MARK),R0=src.indexOf('\nlet R3=null;\n'),j=src.indexOf('function mkEnemyMesh(e){'),k=src.indexOf('\n}\n',j)+3;
  const cv=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(t,p)=>p==='createRadialGradient'||p==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true})});global.document={createElement:cv};
  const body=(src.slice(0,i)+'\n'+src.slice(R0,k)).replace('(function(){','').split('\n').filter(l=>!l.startsWith("if(typeof globalThis!=='undefined')globalThis.__BH=")).join('\n')+'\nreturn{mkFerry,setR3:o=>{R3=o;}};\n';
  const M=new Function('THREE',body)(THREE);const lampMat=new THREE.MeshLambertMaterial({color:0xe8e4d0}),winMat=new THREE.MeshLambertMaterial({color:0x2f4a5a});lampMat.userData.lit=winMat.userData.lit=true;M.setR3({lampMat,winMat});
  const g=M.mkFerry();g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),sz=bb.getSize(new THREE.Vector3());let tri=0,calls=0,bad=0,win=0,lamp=0;
  g.traverse(o=>{if(!o.isMesh)return;calls++;const ge=o.geometry,p=ge.attributes.position;tri+=(ge.index?ge.index.count:p.count)/3;for(let n=0;n<p.array.length;n++)if(!isFinite(p.array[n])){bad++;break;}if(o.material===winMat)win++;if(o.material===lampMat)lamp++;});
  if(process.env.T127_PROBE)console.log(sz,tri,calls,bb.min,bb.max);
  const u=g.userData;ok(u.length===54&&u.beam===15&&u.freeboard===3.2,'the measures hang in userData');
  ok(sz.x>=54&&sz.x<=66&&sz.z>=14&&sz.z<=17,'the ferry is about 54 m with the ramp down and 15 m across ('+sz.x.toFixed(1)+' x '+sz.z.toFixed(1)+')');
  ok(Math.abs(bb.min.y+2.2)<.1&&sz.y>10&&sz.y<22,'it floats at its waterline ('+bb.min.y.toFixed(2)+' to '+bb.max.y.toFixed(1)+')');
  ok(bad===0&&tri<6000&&calls<=60,'no NaN, '+Math.round(tri)+' triangles in '+calls+' meshes');
  ok(win>0&&lamp>0,'the glass is R3.winMat and the lamps R3.lampMat');}
console.log(fail?'FAILED '+fail:'ALL OK');process.exit(fail?1:0);
