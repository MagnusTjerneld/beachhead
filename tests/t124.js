// The enemy captain (issue 120, Magnus 4 nov): the picture G.eCap is built only from what the enemy has seen (shared reports, with a lag), a
// decision refers only to units in that picture, a taken command centre silences it, the same seed gives the same decisions, and off (an
// explicit choice since issue 187, when on became the default) changes nothing. Decisions 1 (alarm), 2 (reinforce) and 3 (counterattack with the strength condition).
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let G;const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
function fresh(cap,n){seedRand(7);B.newGame(1264);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;
  B.setCap(!!cap);if(!cap)B.ENEMY_SHARE.on=false;const r=G.relays[0];
  for(let i=0;i<(n||4);i++){const u=B.makeUnit('tank',r.x-60+(i%5)*8,r.y-40-Math.floor(i/5)*8);u.hp=u.maxhp=150;G.units.push(u);}
  const far=B.makeUnit('tank',B.CARRIER.x,B.CARRIER.y);far.id='DECOY';G.units.push(far);}
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f)f(i);}};
const known=new Set();const watch=()=>{if(G.eRep)for(const k of G.eRep.keys())known.add(k.slice(k.indexOf('|')+1));};

// on is the default (issue 187, Magnus 11 nov), with shared sight; BH_EKAPTEN=0 and 1 set it explicitly; off changes nothing
ok(B.CAP.on===true&&B.ENEMY_SHARE.on===true,'the captain is on by default, and shared sight with it');
{const cp=require('child_process'),q=v=>cp.execFileSync(process.execPath,['-e',"global.performance={now:()=>0};require('./g2.js');const B=globalThis.__BH;console.log(B.CAP.on+' '+B.ENEMY_SHARE.on)"],{cwd:__dirname,env:{...process.env,BH_EKAPTEN:v}}).toString().trim();
  ok(q('0')==='false false','BH_EKAPTEN=0 turns the captain off ('+q('0')+')');ok(q('1')==='true true','BH_EKAPTEN=1 turns it on ('+q('1')+')');}
fresh(false);run(1200,watch);
ok(!G.eCap&&!G.enemies.some(e=>!e.mobile&&e.alert)&&!G.enemies.some(e=>e.capTo!=null),'explicitly off: no picture, no alarm on a fixed gun, nobody sent');
const off1=JSON.stringify(G.enemies.map(e=>[Math.round(e.x),Math.round(e.y),Math.round(e.hp)]));
fresh(false);run(1200);ok(off1===JSON.stringify(G.enemies.map(e=>[Math.round(e.x),Math.round(e.y),Math.round(e.hp)])),'off: two runs from the same seed end the same');
ok(B.ENEMY_SHARE.on===false,'off: shared sight is off too');

// on: alarms from a sighting, and only seen units are referred to
fresh(true);known.clear();run(1200,watch);
const C=G.eCap,L1=C&&C.log.slice();ok(!!C&&L1.length>0,'on: the captain decides ('+(C?JSON.stringify(C.stat):'no picture')+')');
ok(B.ENEMY_SHARE.on===true,'on: shared sight is on with it');
ok(L1.every(d=>d.refs.every(id=>known.has(id)&&id!=='DECOY')),'every decision refers only to units the enemy has reported, never the unseen one');
ok(L1.some(d=>d.type==='alarm')&&G.enemies.some(e=>!e.mobile&&e.alert&&e.alert.t>0),'the alarm sets e.alert on fixed guns in other zones');
{const t=L1.filter(d=>d.type==='alarm').map(d=>d.t);let gap=1e9;for(let i=1;i<t.length;i++)gap=Math.min(gap,t[i]-t[i-1]);ok(t.length<2||gap>=CAP_Q()*.79,'the alarm keeps its silence ('+gap.toFixed(1)+' s between)');}
function CAP_Q(){return B.CAP.qAlarm;}
ok(L1.every(d=>d.type!=='alarm'||d.n>0),'an alarm that reaches no gun is not a decision');
// the lag: a unit is not in the picture until its sighting is CAP.lag old
{fresh(true);let first=null,firstSeen=null;run(400,()=>{if(firstSeen===null&&G.eRep&&G.eRep.size){firstSeen=G.time;}if(first===null&&G.eCap&&G.eCap.seen.size)first=G.time;});
  ok(firstSeen!==null&&first!==null&&first-firstSeen>=B.CAP.lag-1.1,'the picture lags the first report by CAP.lag ('+(first-firstSeen).toFixed(1)+' s)');}
// same seed, same decisions
fresh(true);run(1200);const L2=G.eCap.log;ok(JSON.stringify(L1)===JSON.stringify(L2),'the same seed and play give the same decisions ('+L1.length+' = '+L2.length+')');
// a taken command centre silences it
fresh(true);run(600);{const n0=G.eCap.log.length;G.relays.find(r=>r.type==='central').captured=true;run(1200);
  ok(G.eCap.log.length===n0&&G.eCap.silent,'the command centre taken: no decision after it ('+n0+' before)');}
// the lag is longer once R2 is taken
fresh(true);{G.relays.find(r=>r.type==='radar').captured=true;ok(true,'R2 taken (lag '+B.CAP.lagR2+' s)');let seenAt=null,rep=null;run(900,()=>{if(rep===null&&G.eRep&&G.eRep.size)rep=G.time;if(seenAt===null&&G.eCap&&G.eCap.seen.size)seenAt=G.time;});
  ok(rep!==null&&seenAt!==null&&seenAt-rep>=B.CAP.lagR2-1.1,'with R2 taken the picture lags '+B.CAP.lagR2+' s ('+(seenAt-rep).toFixed(1)+')');}
// 2: a zone under a strong seen force draws reserve from the quiet zones
fresh(true,14);run(1800);{const rf=G.eCap.log.filter(d=>d.type==='reinf');ok(rf.length>0,'a strong force by R1 draws a reinforcement ('+JSON.stringify(G.eCap.stat)+')');
  ok(rf.every(d=>d.n<=B.CAP.maxSent)&&G.enemies.filter(e=>e.capTo===0&&!e.dead&&G.time-e.capT<120).length<=B.CAP.maxSent,'at most '+B.CAP.maxSent+' at a time to a zone');
  const s=G.enemies.filter(e=>e.capTo===0);ok(s.every(e=>e.mobile&&e.hx===G.relays[0].x&&e.hy===G.relays[0].y),'those sent are mobile and bound for the point');}
// 3: a taken point is counterattacked when the reserve outweighs what is seen there, otherwise the captain waits and raises the alarm
fresh(true,1);{const r=G.relays.find(r=>r.type==='verkstad')||G.relays[0];G.relays[0].captured=true;G.relays[0].capT=0;G.time=1;run(1200);
  const c=G.eCap.log.filter(d=>d.type==='counter'||d.type==='wait');ok(c.length>0&&c[0].t>=B.CAP.lag,'a taken point is answered, not before the lag ('+(c[0]?c[0].type+' at '+c[0].t.toFixed(0)+' s':'none')+')');
  ok(c.some(d=>d.type==='counter')&&G.enemies.some(e=>e.march&&e.capTo===0),'weak opposition: a counterattack marches');}
fresh(true,14);run(600);{G.relays[0].captured=true;G.relays[0].capT=G.time;const n0=G.eCap.log.length;run(1000);const c=G.eCap.log.slice(n0).filter(d=>d.type==='counter'||d.type==='wait');
  ok(c.length>0&&c[0].type==='wait','strong opposition at the point: it waits and raises the alarm instead ('+(c[0]?c[0].type:'none')+')');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
