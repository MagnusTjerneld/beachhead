// Minefields by effect (decided 21 okt, Magnus, built 24 okt): the enemy lays each field where it catches most of our ways in, as our
// vehicles would drive them, not on the road cell nearest its pass; it keeps clear of the landing, the points and other fields, and a
// bunker watches every field from close by
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const MP=B.MINE_PLAN;let n=0,onWay=0,bad=[],far=[];
for(const sd of[3019,1234,4242,5555,1554]){B.newGame(sd,'fastning');const W=B.W,G=B.G,land=i=>W.grid[i]===3||W.grid[i]===2;
  const ways=[];for(const shut of[true,false]){const bar=new Set();if(shut)for(const b of G.barriers)for(const c of b.cells)bar.add(c);
    const H=G.relays.find(r=>r.type==='hamn');for(const S of[W.landing,...(H?[H]:[])])for(const R of G.relays.slice(0,3)){const p=B.astar(S.x,S.y,R.x,R.y,i=>land(i)&&!bar.has(i),i=>W.road[i]?.6:1);if(p)ways.push([S,...p]);}}
  const near=(m,P)=>{for(let k=1;k<P.length;k++){const a=P[k-1],b=P[k],L=Math.hypot(b.x-a.x,b.y-a.y),s=Math.ceil(L/4);for(let t=0;t<=s;t++)if(Math.hypot(a.x+(b.x-a.x)*t/s-m.x,a.y+(b.y-a.y)*t/s-m.y)<m.r+4)return true;}return false;};
  for(const m of G.mines){n++;if(ways.some(P=>near(m,P)))onWay++;
    const H=G.relays.find(r=>r.type==='hamn');if([W.landing,...(H?[H]:[])].some(q=>Math.hypot(m.x-q.x,m.y-q.y)<MP.landing-20)||G.relays.some(r=>Math.hypot(r.x-m.x,r.y-m.y)<MP.point)||G.mines.some(o=>o!==m&&Math.hypot(o.x-m.x,o.y-m.y)<MP.apart))bad.push(sd+' '+m.id);
    let w=1e9;for(const e of G.enemies)if(e.kind==='turret')w=Math.min(w,Math.hypot(e.x-m.x,e.y-m.y));if(w>MP.watch+15)far.push(sd+' '+m.id+' '+Math.round(w)+' m');}}
ok(n>=8,n+' fields on five islands with the fortress doctrine');
ok(onWay>=n*.8,onWay+' of '+n+' lie on a way from the landing or the harbour to a point (the rest catch ways from the coast)');
ok(!bad.length,'none near the landing, the harbour, a point or another field'+(bad.length?' ('+bad.join(', ')+')':''));
ok(!far.length,'a bunker within '+(MP.watch+15)+' m of every field'+(far.length?' ('+far.join(', ')+')':''));
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
