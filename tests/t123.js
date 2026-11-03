// Issue 137 (Magnus 3 nov): the masts must form a chain the net can grow along. For each island: from the ship's net alone, then with R1
// taken, then with R1 and the harbour taken, couple in every mast the net reaches, in rounds; a mast no round reaches is stranded.
// The generator keeps every mast within reach of Birka, R1 or an earlier mast; only a zone with no such spot falls back on the harbour.
// `node tests/t123.js list` prints the table, `node tests/t123.js pos` prints enemy and structure positions per seed (to compare before/after).
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const LIST=process.argv[2]==='list',POS=process.argv[2]==='pos';
function reach(G,pts){G.netAll=false;G.masts=[];
  for(const r of G.relays)r.captured=false;
  for(const r of G.relays)if(r.type!=='radar'&&r!==G.relays[2]&&(pts>=1&&r===G.relays[0]||pts>=2&&r.id==='H'))r.captured=true;
  const left=G.structs.filter(s=>s.kind==='mast');
  for(let more=true;more;){more=false;for(const m of left.slice())if(B.inNet(m.x,m.y)){G.masts.push({x:m.x,y:m.y,id:m.id});left.splice(left.indexOf(m),1);more=true;}}
  const C=B.CARRIER;return left.map(m=>m.id+'@'+Math.round(Math.hypot(m.x-C.x,m.y-C.y))+'m');}
function island(seed){B.newGame(seed);const G=B.G;
  const total=G.structs.filter(s=>s.kind==='mast').length;
  const pos=G.enemies.map(e=>e.kind+Math.round(e.x)+','+Math.round(e.y)).join(';')+'|'+G.structs.filter(s=>s.kind!=='mast').map(s=>s.kind+Math.round(s.x)+','+Math.round(s.y)).join(';');
  return{total,pos,s0:reach(G,0),s1:reach(G,1),s2:reach(G,2)};}
const seeds=[2547,2169,2024,3019,9052];for(let i=1;i<=40;i++)seeds.push(i*137+11);
if(POS){for(const s of seeds)console.log(s,island(s).pos);process.exit(0);}
let tot=0,a0=0,a1=0,a2=0,r2547=null;
for(const s of seeds){const r=island(s);tot+=r.total;a0+=r.s0.length;a1+=r.s1.length;a2+=r.s2.length;if(s===2547)r2547=r;
  if(LIST||r.s1.length||r.s2.length)console.log(s,'masts',r.total,'| stranded from Birka only:',r.s0.join(' ')||'-','| with R1:',r.s1.join(' ')||'-','| with R1+harbour:',r.s2.join(' ')||'-');}
console.log('masts',tot,'stranded from Birka only',a0,'with R1',a1,'with R1 and the harbour',a2);
ok(a2===0,'with R1 and the harbour taken every mast on every island can be coupled in, in a chain');
ok(a1<=tot*.05,'with R1 alone (no harbour) at most 5 % of the masts are stranded: '+a1+' of '+tot);
ok(r2547.s1.length===0,'island 2547: no mast out of reach with R1 alone (B16 was 369 m off until the harbour was taken)');
process.exit(fail?1:0);
