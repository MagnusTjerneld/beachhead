// Issue 157 (Magnus 7 nov): Färjeläget. The enemy on the island is supplied by a ferry on a straight lane from the island across the sound, the loads grow; take the
// berth at the quay and it turns back, the enemy goes for the quay, and the rest of the island is taken. A quay lost lets the ferry in again. Headless.
// The model of the ferry (mkFerry) is cut out of g2.js the way t120 does.
const fs=require('fs'),path=require('path');global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const SC=B.SCEN.farjelaget;
const stepN=(n,dt,f)=>{for(let i=0;i<n;i++){B.step(dt||.2);if(f&&f())return i;if(B.G.over)return i;}return n;};
const fresh=()=>{B.newGame(1,'auto',{scen:'farjelaget'});const G=B.G;G.running=true;G.known.fill(1);G.knownV++;B.LOS.on=false;return G;};
const SumL=k=>Object.values(SC.ferry.loads[k]).reduce((a,b)=>a+b,0);
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
ok(Object.keys(G.scen.st).join()==='ramp,on','two steps: close the sound, free the island');
const FL=G.relays.find(r=>r.type==='farja'),S=G.scen,sit=S.sites;
ok(!!FL&&FL.guards.length>=4,'the ferry berth is a point at the head of the quay, guarded ('+(FL?FL.guards.length:0)+')');
// the sites: a straight lane out, deep enough, and a road all the way to the quay
{const b=sit.berth,W=B.W,L2=B.FERRY.hull[0]/2,B2=B.FERRY.hull[1]/2;let deep=true;
  for(let s=-L2;s<=L2-4;s+=6)for(let w=-B2;w<=B2;w+=5)if(B.heightAt(b.x+b.ux*s-b.uy*w,b.y+b.uy*s+b.ux*w)>-B.FERRY.depth)deep=false;
  ok(deep,'the berth is '+B.FERRY.depth+' m deep or more under all of her');
  const f=sit.lane.far,off=Math.abs((f.x-b.x)*-b.uy+(f.y-b.y)*b.ux);ok(sit.lane.L>=B.FERRY.laneMin&&off<1,'the lane is a straight line of '+sit.lane.L+' m out from the berth');
  ok(sit.lane.hit,'on island 1518 it ends at the island across the sound');
  const R=sit.road,e=R[R.length-1];ok(R.length>4&&W.roads.includes(R)&&Math.hypot(R[0].x-b.x,R[0].y-b.y)<L2+5,'a road runs from the quay edge');
  ok(W.roads.some(rd=>rd!==R&&rd.some(q=>Math.hypot(q.x-e.x,q.y-e.y)<1)),'and meets the island\'s roads');
  ok(R.every(q=>!(B.W.trees||[]).some(t=>Math.hypot(t.x-q.x,t.y-q.y)<7)),'no tree stands on it');}
// the ferry: comes at the first slot on the straight lane, lands the first load at the quay, goes back
const near=(a,b,d)=>Math.hypot(a.x-b.x,a.y-b.y)<d,fer=()=>S.ships.find(q=>q.ferry);
stepN(10,.2);const f0=fer();ok(!!f0&&f0.phase==='far'&&S.ships.length===1,'one ferry, waiting at the far end');
const n0=G.enemies.length;let tIn=null;stepN(2000,.2,()=>{if(f0.phase==='unload'&&tIn==null)tIn=G.time;return f0.phase==='wait';});
ok(f0.phase==='wait'&&near(f0,sit.berth,1),'it ties up at the berth ('+Math.round(tIn)+' s)');
ok(G.enemies.length-n0===4&&G.enemies.filter(e=>e.scenG==='f0').every(e=>e.march||near(e,sit.lp,140)),'and lands the first load, four units');
ok(G.enemies.filter(e=>e.scenG==='f0').every(e=>FL.guards.includes(e.id)),'the first load stays at the quay and has to be beaten to take it');
ok(/har lastat av 4 enheter/.test(G.log.map(l=>l.text).join('|')),'and the log says so');
const t1=G.time;stepN(4000,.2,()=>S.ferryN>=2);ok(S.ferryN===2&&G.time-t1>=250&&G.time-t1<=440,'the next load comes '+Math.round(G.time-t1)+' s later');
ok(G.enemies.filter(e=>e.scenG==='f1').length===SumL(1),'the second load is larger');
// the berth taken: the ferry turns back and lands nothing; the enemy goes for the quay
for(const e of G.enemies)e.dead=true;
{const v=B.makeUnit('tank',FL.x,FL.y+20);G.units.push(v);G.res=0;stepN(5);FL.guards.length=0;B.capturePoint(FL,v);const k=S.ferryN;
  stepN(1500,.2);ok(S.st.ramp.done&&S.ferryN===k,'with the berth ours nothing more is landed');ok(fer().phase==='far','and the ferry waits at the far end ('+fer().phase+', '+Math.round(Math.hypot(fer().x-sit.lane.far.x,fer().y-sit.lane.far.y))+' m, v '+fer().v+', i '+fer().i+')');
  ok(B.scenStepNow().map(s=>s.id).join()==='on','the next step is to free the island');ok(/Sundet är stängt/.test(G.log.map(l=>l.text).join('|')+S.def.steps[0].onDone[1].text),'the log says the sound is shut');
  // the quay lost: an enemy there and none of ours for def.quay.t s, and the ferry goes again
  v.x=v.px=FL.x+400;v.y=v.py=FL.y;v.dead=true;const e=B.makeEnemy({id:'XQ',kind:'inf',x:FL.x+5,y:FL.y});G.enemies.push(e);stepN(600,.2,()=>{e.dead=false;e.x=FL.x+5;e.y=FL.y;return!FL.captured;});
  ok(!FL.captured&&!G.over,'the quay falls back to the enemy, and the mission goes on');stepN(3000,.2,()=>S.ferryN>k);ok(S.ferryN>k,'and the ferry lands again');}
// won when every point is taken
for(const r of G.relays)r.captured=true;for(const e of G.enemies)e.dead=true;stepN(10,.2);ok(G.over&&!G.failed&&S.done,'won when the whole island is taken');
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

