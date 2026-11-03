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
ok(G.structs.filter(s=>s.kind==='cistern').length===4&&G.structs.some(s=>s.kind==='pumphus'),'four cisterns and a pump house');
{const r=G.relays.find(q=>q.type==='kraft'),o=G.relays.find(q=>q.type==='olja'),hq=B.W.harborQ;
  ok(Math.hypot(o.x-hq.x,o.y-hq.y)>=250&&Math.hypot(o.x-hq.x,o.y-hq.y)<=420,'the depot lies 250 to 420 m from the harbour ('+Math.round(Math.hypot(o.x-hq.x,o.y-hq.y))+')');
  ok(B.scenShore(B.W)[B.cellIdx(r.x,r.y)]>=220,'the power station lies well inland ('+Math.round(B.scenShore(B.W)[B.cellIdx(r.x,r.y)])+' m from the shore)');
  ok(r.guards.length>=2&&o.guards.length>=3,'the points are guarded ('+r.guards.length+' and '+o.guards.length+')');}
console.log(fail?'FAILED '+fail:'ALL OK');process.exit(fail?1:0);
