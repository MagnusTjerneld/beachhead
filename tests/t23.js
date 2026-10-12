global.performance={now:()=>0};
require('./g2.js');
const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;/* the old start, so results compare */let GWd=220;
for(const seed of [7341,7342,1234,1235,9001,4242,2718,5555,31,77]){
  const t0=Date.now();B.newGame(seed);const ms=Date.now()-t0;const G=B.G,W=B.W,V=W.V;
  const shipCell=(()=>{const u=G.units[1];return Math.floor(u.y/10)*GWd+Math.floor(u.x/10);})();
  const flood=()=>{const r=new Uint8Array(W.grid.length);const st=[shipCell];r[shipCell]=1;while(st.length){const c=st.pop(),x=c%GWd,y=(c/GWd)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GWd||ny>=GWd)continue;const n=ny*GWd+nx;if(r[n])continue;const t=W.grid[n];if(t===4||t===5)continue;r[n]=1;st.push(n);}}return r;};
  const rc=p=>Math.floor(p.y/10)*GWd+Math.floor(p.x/10);
  let r=flood();const blocked=G.relays.map(x=>r[rc(x)]?'o':'x').join('');
  for(const b of G.barriers)for(const c of b.cells)W.grid[c]=W.baseGrid[c];
  r=flood();const open=G.relays.map(x=>r[rc(x)]?'o':'x').join('');
  for(const b of G.barriers)for(const c of b.cells)W.grid[c]=5;
  const hs=V.zones.map(z=>z.water?'~':z.h).join(',');
  // count landing clusters
  const angs=[];for(let i=0;i<W.grid.length;i++){const t=W.grid[i];if(t!==2&&t!==3)continue;const x=i%GWd,y=(i/GWd)|0;let wet=false;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=(y+dy)*GWd+x+dx;if(W.grid[n]<=1)wet=true;}if(wet&&r[i])angs.push(Math.round(((Math.atan2(y*10+5-1100,x*10+5-1100)*180/Math.PI)+360)%360));}
  angs.sort((a,b)=>a-b);const cl=[];for(const a of angs){if(cl.length&&a-cl[cl.length-1][1]<=10)cl[cl.length-1][1]=a;else cl.push([a,a]);}
  const P=W.plan,lcDef=G.enemies.filter(e=>e.kind==='turret'&&Math.hypot(e.x-G.relays[2].x,e.y-G.relays[2].y)<200).length,okk=open==='ooo'&&lcDef>=2&&P.left<25;
  console.log(seed,'check '+(okk?'ok':'FAIL'),'| plan',P.doctrine,'held',P.defended.length+'z','barred',P.barred,'mined',P.mined,'gaps',P.cracks,'LC bunkers',lcDef,'left',P.left,'|',ms+'ms zones',V.zones.length,'['+hs+'] pass',V.pass.length,'barriers',G.barriers.map(b=>b.cells.length).join('/'),'| relays reach with/without barriers',blocked,open,'| landings',cl.length,'| enemies',G.enemies.length,'roads',W.roads.length);
}
