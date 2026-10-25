// GÄDDA (koncept 25 okt): på tolv öar och fyra doktriner, hur stor del av fiendens försvar som kan beskjutas från farbart vatten
// inom räckvidden R, från en plats utom räckhåll för allt som skjuter på mål på marken, och utom luftvärnets skydd (200 m).
//   python3 tests/mk.py && node proto/gaddastat.js   (cirka 30 s)
// GÄDDA: for each enemy, can it be hit from a navigable cell within R that no enemy able to fire on ground units reaches,
// and is it under an air defence's umbrella (AA range 200 m against the robots)
global.performance={now:()=>0};
require(require('path').join(__dirname,'..','tests','g2.js'));const B=globalThis.__BH;
const SEEDS=[2024,1234,7670,9001,9052,3019,2915,9949,1490,4711,5555,7341],DOCS=['framskjutet','djup','fastning','rorligt'],RS=[150,180,200,230,260];
const GW=220,GH=220,CELL=10,N=GW*GH,AAR=200;
const tot={};for(const R of RS)tot[R]={n:0,nab:0,saker:0,sakerUtanLV:0,utanLV:0};const kinds={};
let enemiesN=0;
for(const seed of SEEDS)for(const doc of DOCS){
  B.newGame(seed,doc);const G=B.G,g=B.W.baseGrid;
  const wet=new Uint8Array(N);for(let i=0;i<N;i++)wet[i]=g[i]===0||g[i]===1?1:0;
  const D=new Float32Array(N).fill(1e9),q=[];for(let i=0;i<N;i++)if(!wet[i]){D[i]=0;q.push(i);}
  for(let h=0;h<q.length;h++){const c=q[h],x=c%GW,y=(c/GW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(D[n]>D[c]+1){D[n]=D[c]+1;q.push(n);}}}
  const nav=new Uint8Array(N),st=[];for(let x=0;x<GW;x++)for(const y of[0,GH-1]){const i=y*GW+x;if(wet[i]&&D[i]>=2){nav[i]=1;st.push(i);}}
  while(st.length){const c=st.pop(),x=c%GW,y=(c/GW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(!nav[n]&&wet[n]&&D[n]>=2){nav[n]=1;st.push(n);}}}
  const navC=[];for(let i=0;i<N;i++)if(nav[i])navC.push([(i%GW+.5)*CELL,(((i/GW)|0)+.5)*CELL]);
  const shooters=G.enemies.filter(e=>e.canGround!==false&&(e.range||0)>0);
  const aas=G.enemies.filter(e=>e.kind==='aa');
  const safeAt=(x,y)=>!shooters.some(e=>Math.hypot(e.x-x,e.y-y)<=(e.range||140)+10);
  const safe=navC.map(([x,y])=>safeAt(x,y));
  for(const e of G.enemies){enemiesN++;const k=kinds[e.kind]=kinds[e.kind]||{};const lv=aas.some(a=>a!==e&&Math.hypot(a.x-e.x,a.y-e.y)<AAR);
    for(const R of RS){const T=tot[R];T.n++;let reach=false,sf=false;for(let j=0;j<navC.length;j++){const[x,y]=navC[j];if(Math.abs(x-e.x)>R||Math.abs(y-e.y)>R)continue;if(Math.hypot(x-e.x,y-e.y)<=R){reach=true;if(safe[j]){sf=true;break;}}}
      if(reach)T.nab++;if(sf)T.saker++;if(!lv){T.utanLV++;if(sf)T.sakerUtanLV++;}
      k[R]=k[R]||{n:0,saker:0};k[R].n++;if(sf)k[R].saker++;}}}
const res={};for(const R of RS){const T=tot[R];res[R]={nåbara:+(T.nab/T.n).toFixed(3),frånSäkerPlats:+(T.saker/T.n).toFixed(3),utanLVskydd:+(T.utanLV/T.n).toFixed(3),säkraOchUtanLV:+(T.sakerUtanLV/T.n).toFixed(3)};}
const rk={};for(const[k,v]of Object.entries(kinds)){rk[k]={};for(const R of RS)rk[k][R]=+(v[R].saker/v[R].n).toFixed(2);}

console.log(JSON.stringify({res,rk,enemiesN},null,1));
