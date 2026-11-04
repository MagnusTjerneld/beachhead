// Issue 139 (Magnus 4 nov): a fortress round the mission's target, first in Bärgningen and only when the captain chose the fortress.
// 20 islands with Bärgningen and the fortress: the inner positions (the ring, the extra air defence, the leftovers and the reserve, tagged anc)
// stand round the wreck (at least 60 % within 160 m), the wreck is where it is with another doctrine, and the mission can be solved
// (a way over land from the beach to the wreck, and no more than N air defence positions that have to be put out for KROK to lift).
// The share of islands that fell back to depth is reported.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const seeds=[];for(let i=0;i<20;i++)seeds.push(1100+i*173);
const NAA=10;let inner=0,near=0,fell=0,same=0,tried=0,solv=0,noSpot=0,rows=[],autoFort=0,otherChanged=0;
for(const seed of seeds){
  B.newGame(seed,'djup',{uppdrag:'barg'});let G=B.G;if(G.mission!=='barg'||!G.misW){noSpot++;continue;}
  const w0={x:G.misW.x,y:G.misW.y},aa0=G.enemies.filter(e=>!e.mobile&&e.canAir&&Math.hypot(e.x-w0.x,e.y-w0.y)<(e.kRange||e.airRange||e.range)+25).length;
  B.newGame(seed,'fastning',{uppdrag:'barg'});G=B.G;tried++;
  const w=G.misW;if(w&&Math.hypot(w.x-w0.x,w.y-w0.y)<1)same++;
  if(G.doc!=='fastning'){fell++;rows.push(seed+': falls back to '+G.doc+(G.log.some(l=>/räcker inte till en fästning/.test(l.text))?' (said in the log)':' (NOT in the log)'));continue;}
  const an=G.enemies.filter(e=>e.anc),n=an.filter(e=>Math.hypot(e.x-w.x,e.y-w.y)<=160).length;inner+=an.length;near+=n;
  // the ones that must be put out before KROK can lift: air-capable fixed positions whose reach covers the wreck
  const aa=G.enemies.filter(e=>!e.mobile&&e.canAir&&Math.hypot(e.x-w.x,e.y-w.y)<(e.kRange||e.airRange||e.range)+25).length;
  const L=B.LANDING,W=B.W,gsave=W.grid.slice();W.grid.set(W.baseGrid);/* with the barriers open: the attacker blows them */const path=B.astar(L.x,L.y,w.x,w.y,B.passLand,()=>1),pOk=!!(path&&path.length);W.grid.set(gsave);
  if(pOk&&aa<=NAA)solv++;
  const blv=G.enemies.find(e=>e.id==='BLV'),dBlv=blv?Math.min(...an.map(e=>Math.hypot(e.x-blv.x,e.y-blv.y))):999;
  rows.push(seed+': anchored '+n+'/'+an.length+' within 160 m, '+aa+' (depth: '+aa0+') air positions cover the wreck, way over land '+(pOk?'yes':'NO')+', BLV '+(blv?Math.round(dBlv)+' m from the nearest ring piece':'none'));
  // Auto never builds it (docW fastning 0): the fortress stays round the command post
  B.newGame(seed,'djup',{uppdrag:'barg'});
}
console.log(rows.join('\n'));
console.log('islands '+tried+', fell back to depth '+fell+' ('+Math.round(fell/Math.max(1,tried)*100)+' %), no wreck place '+noSpot+', anchored pieces '+inner+', within 160 m '+near+' ('+(inner?Math.round(near/inner*100):0)+' %), solvable '+solv);
ok(tried>=15,'at least 15 of 20 islands gave a Bärgning ('+tried+')');
ok(same===tried,'the wreck stands in the same place with the fortress as with depth ('+same+'/'+tried+')');
ok(inner>0&&near/inner>=.6,'at least 60 % of the inner positions within 160 m of the wreck ('+(inner?Math.round(near/inner*100):0)+' %)');
ok(solv===tried-fell,'every fortress island can be solved: a way over land and at most '+NAA+' air positions to put out ('+solv+'/'+(tried-fell)+')');
// other missions and Auto are unchanged: the fortress in Frita ön and Halshuggning is still round the command post, with no anchored piece
for(const m of['frita','halshugg','crew']){B.newGame(1100,'fastning',{uppdrag:m});const G=B.G;ok(G.enemies.every(e=>!e.anc)&&!B.W.anchor,'the fortress in '+m+' has no anchor');}
{const d=B.MISSION.barg.docW;ok(d&&d.fastning===0,'Auto keeps docW fastning 0 for Bärgningen');}
// the wreck does not depend on the doctrine for the other doctrines either
{const pos=[];for(const d of['framskjutet','rorligt','djup']){B.newGame(1100,d,{uppdrag:'barg'});pos.push(B.G.misW?Math.round(B.G.misW.x)+','+Math.round(B.G.misW.y):'-');}ok(new Set(pos).size===1,'the same wreck place with three other doctrines ('+pos.join(' ')+')');}
// a fortress played after another doctrine on the same island has no anchor left over, and the same one again gives the same defence
{B.newGame(1100,'fastning',{uppdrag:'barg'});const a=B.G.enemies.map(e=>e.id+Math.round(e.x)+Math.round(e.y)).join();B.newGame(1100,'djup',{uppdrag:'barg'});B.newGame(1100,'fastning',{uppdrag:'barg'});const b=B.G.enemies.map(e=>e.id+Math.round(e.x)+Math.round(e.y)).join();ok(a===b,'the same island, doctrine and mission give the same defence again');}
// the ring avoids the wreck's own air defence: BLV does not stand on another position
{let bad=0,n=0;for(const seed of seeds.slice(0,8)){B.newGame(seed,'fastning',{uppdrag:'barg'});const G=B.G,blv=G.enemies.find(e=>e.id==='BLV');if(!blv||G.doc!=='fastning')continue;n++;if(G.enemies.some(e=>e!==blv&&Math.hypot(e.x-blv.x,e.y-blv.y)<20))bad++;}ok(bad===0,'BLV keeps 20 m from every other position ('+bad+' of '+n+' too close)');}
console.log(fail?'FAIL':'PASS');process.exit(fail?1:0);
